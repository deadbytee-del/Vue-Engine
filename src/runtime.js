(function(root){
const STEP=1/60,CELL=128,MAXP=1024,DEG=Math.PI/180
const norm=k=>{k=String(k).toLowerCase();return k===' '?'space':k}
const OFF=32768
class Entity{
constructor(d,game){
this.game=game
this.alive=true
this.vx=0
this.vy=0
this.grounded=false
this.flipX=false
this.data={}
this.hd=null
this.sayText=''
this.sayT=0
this._q=0
this.img=null
this.imgName=''
this.prefab=false
this.src=d
this.apply(d)
}
apply(d){
this.id=d.id
this.name=d.name||'Entity'
this.x=d.x||0
this.y=d.y||0
this.w=d.w==null?32:d.w
this.h=d.h==null?32:d.h
this.rot=d.rot||0
this.shape=d.shape||'rect'
this.color=d.color||'#ffffff'
this.image=d.image||''
this.text=d.text||''
this.fontSize=d.fontSize||20
this.body=d.body||'none'
this.gravityScale=d.gravityScale==null?1:d.gravityScale
this.tags=(d.tags||[]).slice()
this.visible=d.visible!==false
this.z=d.z||0
this.alpha=d.alpha==null?1:d.alpha
this.prefab=!!d.prefab
}
hasTag(t){return this.tags.indexOf(t)>=0}
say(t,s){this.sayText=String(t);this.sayT=s==null?2:s}
jump(p){if(this.grounded){this.vy=-p;this.grounded=false}}
destroy(){this.game.destroy(this)}
dist(o){return Math.hypot(o.x-this.x,o.y-this.y)}
overlaps(o){return Math.abs(this.x-o.x)*2<this.w+o.w&&Math.abs(this.y-o.y)*2<this.h+o.h}
touching(tag){return this.game.touching(this,tag)}
setZ(z){this.z=z;this.game.zDirty=true}
}
class Game{
constructor(o){
this.canvas=o.canvas
this.ctx=this.canvas.getContext('2d',{alpha:false})
this.project=o.project
this.editor=!!o.editor
this.scripts=o.scripts||{}
const s=this.project.settings||{}
this.pixel=s.pixelArt!==false
this.resize(o.width||s.width||960,o.height||s.height||540)
this.images={}
this.entities=[]
this.order=[]
this.pending=[]
this.prefabs={}
this.zDirty=true
this.dead=false
this.vars={}
this.keys=new Set()
this.pressedSet=new Set()
this.mouse={x:0,y:0,sx:0,sy:0,down:false,clicked:false}
this.camera={x:0,y:0,zoom:1,follow:null,smooth:0.12}
this.timers=[]
this.frameWaiters=[]
this.time=0
this.nextScene=null
this.hudLines=new Map()
this.grid=new Map()
this.gridPool=[]
this.stamp=0
this.qr=[]
this.qe=[]
this.qt=[]
this.fnCache=new Map()
this.errSeen=new Set()
this.shakeA=0
this.shakeT=0
this.shx=0
this.shy=0
this.px=new Float32Array(MAXP)
this.py=new Float32Array(MAXP)
this.pvx=new Float32Array(MAXP)
this.pvy=new Float32Array(MAXP)
this.pl=new Float32Array(MAXP)
this.pc=new Array(MAXP)
this.pn=0
this.running=false
this.debug=false
this.fps=0
this.grid_on=true
this.vue=this.makeApi()
this.loop=this.loop.bind(this)
}
resize(w,h){
this.w=w
this.h=h
this.canvas.width=w
this.canvas.height=h
this.ctx.imageSmoothingEnabled=!this.pixel
}
log(level,text){
if(this.onlog)return this.onlog(level,text)
if(root.parent&&root.parent!==root)root.parent.postMessage({vue:1,type:'log',level,text},'*')
else if(root.console)console[level==='error'?'error':'log'](text)
}
err(x,e){
const m=(e?e.name+': ':'')+(x&&x.message||x)
if(this.errSeen.has(m))return
this.errSeen.add(m)
this.log('error',m)
}
loadAssets(){
const a=this.project.assets||{},ps=[]
this.images={}
for(const k in a){
if(a[k].type!=='image')continue
const im=new Image()
im.src=a[k].data
this.images[k]=im
ps.push(im.decode?im.decode().catch(()=>{}):new Promise(r=>{im.onload=im.onerror=r}))
}
return Promise.all(ps)
}
findScene(k){
const s=this.project.scenes
for(let i=0;i<s.length;i++)if(s[i].id===k||s[i].name===k)return s[i]
return s[0]
}
loadScene(k){
const sc=this.findScene(k)
this.scene=sc
this.bg=sc.bg||'#1a1c23'
this.gravity=sc.gravity==null?1400:sc.gravity
this.entities=[]
this.pending=[]
this.prefabs={}
this.hudLines.clear()
this.timers=[]
this.frameWaiters=[]
this.pn=0
this.dead=false
this.zDirty=true
if(!this.editor){
const c=sc.camera||{}
this.camera.x=c.x||0
this.camera.y=c.y||0
this.camera.zoom=c.zoom||1
this.camera.follow=null
}
for(const d of sc.entities){
if(d.prefab){
this.prefabs[d.name]=d
if(!this.editor)continue
}
const e=new Entity(d,this)
if(!this.editor)this.attach(e,d)
this.entities.push(e)
}
}
refresh(){
for(const e of this.entities)e.apply(e.src)
this.zDirty=true
}
attach(e,d){
const code=this.scripts[d.id]
if(!code)return
let fn=this.fnCache.get(code)
if(!fn){
try{fn=new Function('vue','self','on','exports','module',code)}catch(x){this.err(x,e);return}
this.fnCache.set(code,fn)
}
const hd={}
e.hd=hd
const on=(n,f)=>{(hd[n]||(hd[n]=[])).push(f)}
const ex={}
try{fn(this.vue,e,on,ex,{exports:ex})}catch(x){this.err(x,e)}
}
call(f,e,a,b){
try{
const r=f(a,b)
if(r&&r.catch)r.catch(x=>this.err(x,e))
}catch(x){this.err(x,e)}
}
fire(e,n,a,b){
const l=e.hd&&e.hd[n]
if(!l)return
for(let i=0;i<l.length;i++)this.call(l[i],e,a,b)
}
startAll(){
const es=this.entities.slice()
for(const e of es)this.fire(e,'start')
}
spawn(n,x,y){
const d=this.prefabs[n]
if(!d)return null
const e=new Entity(d,this)
e.prefab=false
if(x!=null){e.x=x;e.y=y==null?e.y:y}
this.attach(e,d)
this.pending.push(e)
return e
}
destroy(e){
if(!e||!e.alive)return
e.alive=false
this.dead=true
if(this.camera.follow===e)this.camera.follow=null
}
makeApi(){
const g=this
return{
vars:g.vars,
camera:g.camera,
mouse:g.mouse,
get time(){return g.time},
get dt(){return STEP},
get width(){return g.w},
get height(){return g.h},
key:k=>g.keys.has(norm(k)),
pressed:k=>g.pressedSet.has(norm(k)),
find:n=>{for(const e of g.entities)if(e.alive&&e.name===n)return e;return null},
all:t=>g.entities.filter(e=>e.alive&&(t==null||e.tags.indexOf(t)>=0)),
spawn:(n,x,y)=>g.spawn(n,x,y),
destroy:e=>g.destroy(e),
go:s=>{g.nextScene=s},
follow:e=>{g.camera.follow=e||null},
wait:s=>new Promise(r=>g.timers.push({t:+s||0,f:r})),
after:(s,f)=>{g.timers.push({t:+s||0,f})},
frame:()=>new Promise(r=>g.frameWaiters.push(r)),
random:(a,b)=>{a=+a||0;b=b==null?1:+b;return a+Math.random()*(b-a)},
dist:(a,b)=>a&&b?Math.hypot(a.x-b.x,a.y-b.y):0,
hud:(k,v)=>{g.hudLines.set(String(k),v)},
beep:(f,d,t,v)=>g.beep(f,d,t,v),
play:n=>g.play(n),
burst:(x,y,c,n)=>g.burst(x,y,c,n),
shake:(a,d)=>{g.shakeA=+a||0;g.shakeT=d==null?0.3:+d},
log:(...a)=>g.log('log',a.map(String).join(' ')),
stop:()=>g.stop()
}
}
audio(){
if(!this.ac){const C=root.AudioContext||root.webkitAudioContext;if(C)this.ac=new C()}
if(this.ac&&this.ac.state==='suspended')this.ac.resume()
return this.ac
}
beep(f,d,t,v){
const a=this.audio()
if(!a)return
f=f||440
d=d||0.15
v=v==null?0.15:v
const o=a.createOscillator(),g=a.createGain()
o.type=t||'square'
o.frequency.value=f
g.gain.setValueAtTime(v,a.currentTime)
g.gain.exponentialRampToValueAtTime(0.0001,a.currentTime+d)
o.connect(g)
g.connect(a.destination)
o.start()
o.stop(a.currentTime+d)
}
play(n){
const s=this.project.assets&&this.project.assets[n]
if(s&&s.type==='audio'){const a=new Audio(s.data);a.play().catch(()=>{})}
}
burst(x,y,c,n){
n=n==null?14:n
for(let i=0;i<n&&this.pn<MAXP;i++){
const k=this.pn++,a=Math.random()*Math.PI*2,s=60+Math.random()*220
this.px[k]=x
this.py[k]=y
this.pvx[k]=Math.cos(a)*s
this.pvy[k]=Math.sin(a)*s-80
this.pl[k]=0.4+Math.random()*0.5
this.pc[k]=c||'#ffffff'
}
}
cellsOf(e,fn){
const x0=Math.floor((e.x-e.w/2)/CELL),x1=Math.floor((e.x+e.w/2)/CELL),y0=Math.floor((e.y-e.h/2)/CELL),y1=Math.floor((e.y+e.h/2)/CELL)
for(let cx=x0;cx<=x1;cx++)for(let cy=y0;cy<=y1;cy++)fn((cx+OFF)*65536+(cy+OFF))
}
buildGrid(onlyStatic){
const grid=this.grid,pool=this.gridPool
for(const a of grid.values()){a.length=0;pool.push(a)}
grid.clear()
const es=this.entities
for(let i=0;i<es.length;i++){
const e=es[i]
if(!e.alive||e.body==='none'||(onlyStatic&&e.body!=='static'))continue
const x0=Math.floor((e.x-e.w/2)/CELL),x1=Math.floor((e.x+e.w/2)/CELL),y0=Math.floor((e.y-e.h/2)/CELL),y1=Math.floor((e.y+e.h/2)/CELL)
for(let cx=x0;cx<=x1;cx++)for(let cy=y0;cy<=y1;cy++){
const k=(cx+OFF)*65536+(cy+OFF)
let a=grid.get(k)
if(!a){a=pool.pop()||[];grid.set(k,a)}
a.push(e)
}
}
}
query(x0,y0,x1,y1,out){
out.length=0
const st=++this.stamp,grid=this.grid
const a0=Math.floor(x0/CELL),a1=Math.floor(x1/CELL),b0=Math.floor(y0/CELL),b1=Math.floor(y1/CELL)
for(let cx=a0;cx<=a1;cx++)for(let cy=b0;cy<=b1;cy++){
const a=grid.get((cx+OFF)*65536+(cy+OFF))
if(!a)continue
for(let i=0;i<a.length;i++){
const e=a[i]
if(e._q!==st){e._q=st;out.push(e)}
}
}
return out
}
touching(e,tag){
const q=this.query(e.x-e.w/2,e.y-e.h/2,e.x+e.w/2,e.y+e.h/2,this.qt)
for(let i=0;i<q.length;i++){
const o=q[i]
if(o!==e&&o.alive&&(tag==null||tag===''||o.tags.indexOf(tag)>=0)&&e.overlaps(o))return true
}
return false
}
resolve(e,ax){
const q=this.query(e.x-e.w/2,e.y-e.h/2,e.x+e.w/2,e.y+e.h/2,this.qr)
for(let i=0;i<q.length;i++){
const s=q[i]
if(s===e||s.body!=='static'||!s.alive||!e.overlaps(s))continue
if(ax){
if(e.vx>0||(e.vx===0&&e.x<s.x))e.x=s.x-(s.w+e.w)/2
else e.x=s.x+(s.w+e.w)/2
e.vx=0
}else{
if(e.vy>0||(e.vy===0&&e.y<s.y)){e.y=s.y-(s.h+e.h)/2;e.grounded=true}
else e.y=s.y+(s.h+e.h)/2
e.vy=0
}
}
}
physics(dt){
const es=this.entities,g=this.gravity
this.buildGrid(true)
for(let i=0;i<es.length;i++){
const e=es[i]
if(!e.alive||e.body!=='dynamic')continue
e.vy+=g*e.gravityScale*dt
e.x+=e.vx*dt
this.resolve(e,true)
e.grounded=false
e.y+=e.vy*dt
this.resolve(e,false)
}
}
events(){
const es=this.entities
this.buildGrid(false)
for(let i=0;i<es.length;i++){
const a=es[i]
if(!a.alive||a.body==='none')continue
const c=a.hd&&a.hd.collide
if(!c)continue
const q=this.query(a.x-a.w/2,a.y-a.h/2,a.x+a.w/2,a.y+a.h/2,this.qe)
for(let j=0;j<q.length;j++){
const b=q[j]
if(b===a||!b.alive||!a.alive||!a.overlaps(b))continue
for(let k=0;k<c.length;k++)this.call(c[k],a,b)
}
}
}
update(dt){
this.time+=dt
const tm=this.timers
for(let i=tm.length-1;i>=0;i--){
const t=tm[i]
t.t-=dt
if(t.t<=0){tm.splice(i,1);try{t.f()}catch(x){this.err(x)}}
}
if(this.frameWaiters.length){const f=this.frameWaiters;this.frameWaiters=[];for(let i=0;i<f.length;i++)f[i]()}
this.updateMouse()
const es=this.entities
for(let i=0;i<es.length;i++){
const e=es[i]
if(!e.alive)continue
const u=e.hd&&e.hd.update
if(u)for(let j=0;j<u.length;j++)this.call(u[j],e,dt)
}
this.physics(dt)
this.events()
const c=this.camera
if(c.follow&&c.follow.alive){
const k=1-Math.pow(1-c.smooth,dt*60)
c.x+=(c.follow.x-c.x)*k
c.y+=(c.follow.y-c.y)*k
}
if(this.shakeT>0){
this.shakeT-=dt
this.shx=(Math.random()-0.5)*2*this.shakeA
this.shy=(Math.random()-0.5)*2*this.shakeA
}else{this.shx=0;this.shy=0}
for(let i=0;i<es.length;i++){
const e=es[i]
if(e.sayT>0){e.sayT-=dt;if(e.sayT<=0)e.sayText=''}
}
for(let i=0;i<this.pn;){
this.pl[i]-=dt
if(this.pl[i]<=0){
const l=--this.pn
this.px[i]=this.px[l];this.py[i]=this.py[l];this.pvx[i]=this.pvx[l];this.pvy[i]=this.pvy[l];this.pl[i]=this.pl[l];this.pc[i]=this.pc[l]
}else{
this.pvy[i]+=700*dt
this.px[i]+=this.pvx[i]*dt
this.py[i]+=this.pvy[i]*dt
i++
}
}
if(this.pending.length){
const p=this.pending
this.pending=[]
for(const e of p)this.entities.push(e)
this.zDirty=true
for(const e of p)this.fire(e,'start')
}
if(this.dead){this.entities=this.entities.filter(e=>e.alive);this.dead=false;this.zDirty=true}
this.pressedSet.clear()
this.mouse.clicked=false
if(this.nextScene!==null){
const n=this.nextScene
this.nextScene=null
this.loadScene(n)
this.startAll()
}
}
updateMouse(){
const m=this.mouse,c=this.camera
m.x=(m.sx-this.w/2)/c.zoom+c.x
m.y=(m.sy-this.h/2)/c.zoom+c.y
}
draw(){
const c=this.ctx,W=this.w,H=this.h,cam=this.camera,z=cam.zoom
if(this.zDirty){this.order=this.entities.slice().sort((a,b)=>a.z-b.z);this.zDirty=false}
c.setTransform(1,0,0,1,0,0)
c.globalAlpha=1
c.fillStyle=this.bg
c.fillRect(0,0,W,H)
const cx=cam.x+this.shx,cy=cam.y+this.shy
c.setTransform(z,0,0,z,W/2-cx*z,H/2-cy*z)
const hw=W/2/z,hh=H/2/z,l=cx-hw,r=cx+hw,t=cy-hh,b=cy+hh
if(this.editor&&this.grid_on)this.drawGrid(c,l,r,t,b,z)
let fill='',font='',al=1
const o=this.order
for(let i=0;i<o.length;i++){
const e=o[i]
if(!e.alive||(!e.visible&&!this.editor))continue
const rad=(Math.abs(e.w)+Math.abs(e.h))*0.5
if(e.x+rad<l||e.x-rad>r||e.y+rad<t||e.y-rad>b)continue
let a=e.alpha
if(this.editor&&(e.prefab||!e.visible))a*=0.4
if(a!==al){c.globalAlpha=a;al=a}
const rot=e.rot!==0,flip=e.flipX
if(rot||flip){
c.save()
c.translate(e.x,e.y)
if(rot)c.rotate(e.rot*DEG)
if(flip)c.scale(-1,1)
c.translate(-e.x,-e.y)
}
const s=e.shape
if(s==='sprite'){
if(e.imgName!==e.image||!e.img){e.img=this.images[e.image]||null;e.imgName=e.image}
if(e.img&&e.img.complete&&e.img.naturalWidth)c.drawImage(e.img,e.x-e.w/2,e.y-e.h/2,e.w,e.h)
else{if(fill!=='#ff00ff'){c.fillStyle='#ff00ff';fill='#ff00ff'}c.fillRect(e.x-e.w/2,e.y-e.h/2,e.w,e.h)}
}else if(s==='circle'){
if(fill!==e.color){c.fillStyle=e.color;fill=e.color}
c.beginPath()
c.ellipse(e.x,e.y,Math.abs(e.w)/2,Math.abs(e.h)/2,0,0,6.2832)
c.fill()
}else if(s==='text'){
if(fill!==e.color){c.fillStyle=e.color;fill=e.color}
const f=e.fontSize+'px system-ui,sans-serif'
if(f!==font){c.font=f;c.textAlign='center';c.textBaseline='middle';font=f}
c.fillText(e.text,e.x,e.y)
}else{
if(fill!==e.color){c.fillStyle=e.color;fill=e.color}
c.fillRect(e.x-e.w/2,e.y-e.h/2,e.w,e.h)
}
if(rot||flip){c.restore();if(al!==1){c.globalAlpha=al}}
}
if(al!==1)c.globalAlpha=1
for(let i=0;i<this.pn;i++){
const k=Math.min(1,this.pl[i]*2)
c.globalAlpha=k
c.fillStyle=this.pc[i]
c.fillRect(this.px[i]-2,this.py[i]-2,4,4)
}
c.globalAlpha=1
font=''
for(let i=0;i<o.length;i++){
const e=o[i]
if(!e.alive||!e.sayText)continue
c.font='600 14px system-ui,sans-serif'
c.textAlign='center'
c.textBaseline='middle'
const tw=c.measureText(e.sayText).width+16,by=e.y-e.h/2-26
c.fillStyle='#fff'
c.fillRect(e.x-tw/2,by-12,tw,24)
c.fillStyle='#111'
c.fillText(e.sayText,e.x,by)
}
c.setTransform(1,0,0,1,0,0)
if(this.hudLines.size){
c.font='600 18px system-ui,sans-serif'
c.textAlign='left'
c.textBaseline='top'
let y=10
for(const [k,v] of this.hudLines){
const s=k+': '+v
c.fillStyle='rgba(0,0,0,0.55)'
c.fillRect(8,y-2,c.measureText(s).width+12,26)
c.fillStyle='#fff'
c.fillText(s,14,y+1)
y+=28
}
}
if(this.debug){
c.font='12px monospace'
c.textAlign='right'
c.textBaseline='top'
c.fillStyle='#0f0'
c.fillText(this.fps+' fps  '+this.entities.length+' entities  '+this.pn+' particles',W-8,8)
}
}
drawGrid(c,l,r,t,b,z){
let s=64
while(s*z<14)s*=2
c.lineWidth=1/z
c.strokeStyle='rgba(255,255,255,0.06)'
c.beginPath()
for(let x=Math.floor(l/s)*s;x<=r;x+=s){c.moveTo(x,t);c.lineTo(x,b)}
for(let y=Math.floor(t/s)*s;y<=b;y+=s){c.moveTo(l,y);c.lineTo(r,y)}
c.stroke()
c.strokeStyle='rgba(255,255,255,0.22)'
c.beginPath()
c.moveTo(0,t);c.lineTo(0,b);c.moveTo(l,0);c.lineTo(r,0)
c.stroke()
}
loop(ts){
if(!this.running)return
this.raf=requestAnimationFrame(this.loop)
let ft=(ts-this.last)/1000
this.last=ts
if(ft>0.1)ft=0.1
this.acc+=ft
let n=0
while(this.acc>=STEP&&n<5){this.update(STEP);this.acc-=STEP;n++}
if(n===5)this.acc=0
this.draw()
this.fc++
this.ft+=ft
if(this.ft>=0.5){
this.fps=Math.round(this.fc/this.ft)
this.fc=0
this.ft=0
if(root.parent&&root.parent!==root)root.parent.postMessage({vue:1,type:'fps',v:this.fps,n:this.entities.length},'*')
}
}
async start(){
await this.loadAssets()
this.loadScene(this.project.startScene)
this.bind()
this.startAll()
this.running=true
this.acc=0
this.fc=0
this.ft=0
this.last=performance.now()
this.raf=requestAnimationFrame(this.loop)
}
stop(){
this.running=false
if(this.raf)cancelAnimationFrame(this.raf)
if(this.ac)this.ac.close().catch(()=>{})
this.unbind()
}
bind(){
const cv=this.canvas
const pos=ev=>{
const r=cv.getBoundingClientRect(),s=Math.min(r.width/this.w,r.height/this.h)
this.mouse.sx=(ev.clientX-r.left-(r.width-this.w*s)/2)/s
this.mouse.sy=(ev.clientY-r.top-(r.height-this.h*s)/2)/s
}
const kd=ev=>{
const k=norm(ev.key)
if(k==='f3'){this.debug=!this.debug;ev.preventDefault();return}
if(['arrowleft','arrowright','arrowup','arrowdown','space'].indexOf(k)>=0)ev.preventDefault()
if(ev.repeat||this.keys.has(k))return
this.keys.add(k)
this.pressedSet.add(k)
this.audio()
const es=this.entities
for(let i=0;i<es.length;i++){
const e=es[i]
if(!e.alive||!e.hd)continue
this.fire(e,'key:'+k)
this.fire(e,'keypress',k)
}
}
const ku=ev=>{this.keys.delete(norm(ev.key))}
const bl=()=>{this.keys.clear()}
const md=ev=>{
pos(ev)
this.updateMouse()
this.mouse.down=true
this.mouse.clicked=true
this.audio()
const o=this.order
for(let i=o.length-1;i>=0;i--){
const e=o[i]
if(!e.alive||!e.hd||!e.hd.click)continue
if(Math.abs(this.mouse.x-e.x)*2<=e.w&&Math.abs(this.mouse.y-e.y)*2<=e.h){this.fire(e,'click');break}
}
}
const mm=ev=>pos(ev)
const mu=()=>{this.mouse.down=false}
root.addEventListener('keydown',kd)
root.addEventListener('keyup',ku)
root.addEventListener('blur',bl)
cv.addEventListener('mousedown',md)
root.addEventListener('mousemove',mm)
root.addEventListener('mouseup',mu)
this.unbind=()=>{
root.removeEventListener('keydown',kd)
root.removeEventListener('keyup',ku)
root.removeEventListener('blur',bl)
cv.removeEventListener('mousedown',md)
root.removeEventListener('mousemove',mm)
root.removeEventListener('mouseup',mu)
}
}
unbind(){}
}
const api={Game,Entity,STEP,norm}
if(typeof module!=='undefined'&&module.exports)module.exports=api
else root.VueRuntime=api
})(typeof window!=='undefined'?window:globalThis)
