(function(root){
const STEP=1/60,CELL=128,MAXP=2048,DEG=Math.PI/180,OFF=32768
const BH=root.VueBehaviors||(typeof require!=='undefined'&&typeof module!=='undefined'?require('./behaviors.js'):null)
const EXT=root.VueExt||(root.VueExt={list:{},register(d){this.list[d.id]=d;return d}})
const norm=k=>{k=String(k).toLowerCase();return k===' '?'space':k}
const pk=(x,y)=>(x+OFF)*65536+(y+OFF)
const clamp=(v,a,b)=>v<a?a:v>b?b:v
const EASE={linear:k=>k,in:k=>k*k*k,out:k=>1-Math.pow(1-k,3),inout:k=>k<0.5?4*k*k*k:1-Math.pow(-2*k+2,3)/2,back:k=>{const c=1.70158;return 1+(c+1)*Math.pow(k-1,3)+c*Math.pow(k-1,2)},bounce:k=>{const n=7.5625,d=2.75;if(k<1/d)return n*k*k;if(k<2/d)return n*(k-=1.5/d)*k+0.75;if(k<2.5/d)return n*(k-=2.25/d)*k+0.9375;return n*(k-=2.625/d)*k+0.984375}}
function mat(rx,ry,rz){
const a=Math.cos(rx*DEG),b=Math.sin(rx*DEG),c=Math.cos(ry*DEG),d=Math.sin(ry*DEG),e=Math.cos(rz*DEG),f=Math.sin(rz*DEG)
const ce=c*e,cf=c*f,de=d*e,df=d*f
return[ce+df*b,de*b-cf,a*d,a*f,a*e,-b,cf*b-de,df+ce*b,a*c]
}
function mul(A,B){
const r=new Array(9)
for(let i=0;i<3;i++)for(let j=0;j<3;j++)r[i*3+j]=A[i*3]*B[j]+A[i*3+1]*B[3+j]+A[i*3+2]*B[6+j]
return r
}
function tr(A){return[A[0],A[3],A[6],A[1],A[4],A[7],A[2],A[5],A[8]]}
function eul(m){
const x=Math.asin(-clamp(m[5],-1,1))
let y,z
if(Math.abs(m[5])<0.9999999){y=Math.atan2(m[2],m[8]);z=Math.atan2(m[3],m[4])}else{y=Math.atan2(-m[6],m[0]);z=0}
return[x/DEG,y/DEG,z/DEG]
}
function toLocal(p,w,d3){
if(!p)return w
if(d3){
const R=mat(p.rx,p.ry,p.rz),T=tr(R),dx=w.x-p.x,dy=w.y-p.y,dz=w.z-p.z
const L=mul(T,mat(w.rx||0,w.ry||0,w.rz||0)),e=eul(L)
return{x:T[0]*dx+T[1]*dy+T[2]*dz,y:T[3]*dx+T[4]*dy+T[5]*dz,z:T[6]*dx+T[7]*dy+T[8]*dz,rx:e[0],ry:e[1],rz:e[2]}
}
const a=-p.rot*DEG,dx=w.x-p.x,dy=w.y-p.y
return{x:dx*Math.cos(a)-dy*Math.sin(a),y:dx*Math.sin(a)+dy*Math.cos(a),rot:(w.rot||0)-p.rot}
}
const SHAPES2=new Set(['pill','rrect','triangle','hexagon','star','ring','arrow'])
const LOOPS=new Map()
const arcPts=(cx,cy,rx,ry,a0,a1,n,out)=>{for(let i=0;i<=n;i++){const a=a0+(a1-a0)*i/n;out.push([cx+Math.cos(a)*rx,cy+Math.sin(a)*ry])}}
function shapeLoops(s,w,h){
w=Math.abs(w);h=Math.abs(h)
const key=s+'|'+w+'|'+h
let r=LOOPS.get(key)
if(r)return r
const a=w/2,b=h/2,L=[],P=Math.PI
if(s==='pill'){const p=[],q=Math.min(a,b);if(h>=w){arcPts(0,-b+q,q,q,P,2*P,12,p);arcPts(0,b-q,q,q,0,P,12,p)}else{arcPts(-a+q,0,q,q,P/2,P*1.5,12,p);arcPts(a-q,0,q,q,-P/2,P/2,12,p)}L.push(p)}
else if(s==='rrect'){const q=Math.min(a,b)*0.4,p=[];arcPts(a-q,-b+q,q,q,-P/2,0,6,p);arcPts(a-q,b-q,q,q,0,P/2,6,p);arcPts(-a+q,b-q,q,q,P/2,P,6,p);arcPts(-a+q,-b+q,q,q,P,P*1.5,6,p);L.push(p)}
else if(s==='triangle')L.push([[0,-b],[a,b],[-a,b]])
else if(s==='hexagon'){const p=[];for(let i=0;i<6;i++){const t=i*P/3;p.push([Math.cos(t)*a,Math.sin(t)*b])}L.push(p)}
else if(s==='star'){const p=[];for(let i=0;i<10;i++){const t=-P/2+i*P/5,k=i%2?0.45:1;p.push([Math.cos(t)*a*k,Math.sin(t)*b*k])}L.push(p)}
else if(s==='ring'){const o=[],n=[];arcPts(0,0,a,b,0,2*P,32,o);arcPts(0,0,a*0.6,b*0.6,0,2*P,32,n);L.push(o,n)}
else if(s==='arrow')L.push([[-a,-b*0.3],[a*0.1,-b*0.3],[a*0.1,-b],[a,0],[a*0.1,b],[a*0.1,b*0.3],[-a,b*0.3]])
else{const p=[];arcPts(0,0,a,b,0,2*P,32,p);L.push(p)}
if(LOOPS.size>300)LOOPS.clear()
LOOPS.set(key,L)
return L
}
const capHit2=(c,o,ep)=>{
const v=c.h>=c.w,r=(v?c.w:c.h)/2,L=(v?c.h:c.w)/2-r,dx=Math.max(0,Math.abs(c.x-o.x)-o.w/2-ep),dy=Math.max(0,Math.abs(c.y-o.y)-o.h/2-ep),gx=v?dx:Math.max(0,dx-L),gy=v?Math.max(0,dy-L):dy
return gx*gx+gy*gy<(r-0.001)*(r-0.001)
}
const capHit3=(c,o,ep)=>{
const r=Math.min(c.w,c.d)/2,L=c.h/2-r,dx=Math.max(0,Math.abs(c.x-o.x)-o.w/2-ep),dz=Math.max(0,Math.abs(c.z-o.z)-o.d/2-ep),dy=Math.max(0,Math.abs(c.y-o.y)-o.h/2-ep),gy=Math.max(0,dy-L)
return dx*dx+dz*dz+gy*gy<(r-0.001)*(r-0.001)
}
const PC_COMMON={type:'platformer',speed:240,accel:1800,friction:2200,maxSpeed:420,jumpHeight:120,jumps:1,coyote:0.1,buffer:0.12,gravityScale:1,airControl:0.6,runMult:1.6,crouch:true,
dash:{on:false,speed:620,time:0.15,cooldown:0.6},mass:1,bounce:0,grip:1,layers:[],
cam:{follow:true,zoom:1,smooth:0.12,lookAhead:40,deadzone:[0,0],bounds:null,dist:8,fov:70,height:1.6,sens:0.12},
keys:{left:['a','arrowleft'],right:['d','arrowright'],up:['w','arrowup'],down:['s','arrowdown'],jump:['space','w','arrowup'],dash:['x'],run:['shift'],crouch:['s','arrowdown']},
pad:true,touch:true,health:{max:100,respawn:true,rx:null,ry:null},anims:{idle:'idle',run:'run',jump:'jump',fall:'fall'}}
const PC_TYPE={
platformer:{},
topdown4:{speed:170,accel:1400,friction:1800,maxSpeed:300,gravityScale:0,airControl:1,jumps:0,crouch:false,cam:{lookAhead:0}},
topdown8:{type:'topdown8',speed:200,accel:1400,friction:1800,maxSpeed:340,gravityScale:0,airControl:1,jumps:0,crouch:false,cam:{lookAhead:0}},
fps:{speed:6,accel:50,friction:40,maxSpeed:10,jumpHeight:1.4,gravityScale:1,airControl:0.4,runMult:1.7,jumps:1,crouch:false,dash:{speed:14,time:0.15,cooldown:0.8},cam:{follow:true,dist:0,height:1.6,fov:75,sens:0.12,lookAhead:0},keys:{jump:['space']}},
tps:{speed:6,accel:50,friction:40,maxSpeed:10,jumpHeight:1.4,gravityScale:1,airControl:0.4,runMult:1.7,jumps:1,crouch:false,dash:{speed:14,time:0.15,cooldown:0.8},cam:{follow:true,dist:7,height:1.6,fov:70,sens:0.12,lookAhead:0},keys:{jump:['space']}}
}
const PC_PRESETS={'Platformer':{type:'platformer'},'Top-down RPG':{type:'topdown4'},'Shooter':{type:'topdown8',speed:230,dash:{on:true}},'FPS':{type:'fps'},'Racer-lite':{type:'topdown8',speed:380,accel:420,friction:160,maxSpeed:560,mass:2}}
const deep=(a,b)=>{
const o=Array.isArray(a)?a.slice():Object.assign({},a)
if(b)for(const k in b){const v=b[k];o[k]=v&&typeof v==='object'&&!Array.isArray(v)&&a&&a[k]&&typeof a[k]==='object'&&!Array.isArray(a[k])?deep(a[k],v):Array.isArray(v)?v.slice():v&&typeof v==='object'?deep({},v):v}
return o
}
function pcNorm(o){
o=o||{}
const t=PC_TYPE[o.type]?o.type:'platformer'
return deep(deep(PC_COMMON,PC_TYPE[t]),Object.assign({},o,{type:t}))
}
const pcFull=o=>!!(o.keys&&o.health&&o.dash&&o.anims&&o.cam&&o.cam.deadzone&&o.cam.sens!=null&&o.layers)
function pcPreset(n){return pcNorm(PC_PRESETS[n]||{type:'platformer'})}
const pcAp=(v,t,a)=>v<t?Math.min(t,v+a):Math.max(t,v-a)
const pcAny=(l,s)=>{for(let i=0;i<l.length;i++)if(s.has(norm(l[i])))return true;return false}
const pcLayer=(e,s)=>{const l=e.pc&&e.pc.layers;if(!l||!l.length)return true;for(let i=0;i<l.length;i++)if(s.tags.indexOf(l[i])>=0)return true;return false}
class Entity{
constructor(d,game){
this._x=0;this._y=0;this._z=0;this._w=0;this._h=0;this._d=0
this._px=0;this._py=0;this._pz=0;this._pr=0;this._pn=-1;this._qx=0;this._qy=0;this._qz=0;this._qr=0;this._rs=0;this._ix=0;this._iy=0;this._iz=0;this._ivx=0;this._ivy=0;this._ivz=0;this._iw=0;this._ih=0;this._id=0;this._igs=0;this._ig=false
this.game=game
this.alive=true
this.vx=0
this.vy=0
this.vz=0
this.grounded=false
this.flipX=false
this.data={}
this.hd=null
this.sayText=''
this.sayT=0
this._q=0
this.img=null
this.imgName=''
this.par=null
this.kids=[]
this.cur=null
this.animT=0
this.frame=0
this.animDone=false
this.snd=null
this._sx=NaN;this._sy=NaN;this._sw=NaN;this._sh=NaN;this._sz=NaN;this._sd=NaN
this._wx=undefined;this._wy=0;this._wz=0;this._wr=0;this._wrx=0;this._wry=0;this._wrz=0
this._ox=NaN;this._oy=NaN;this._oc=NaN
this._body='none'
this.src=d
this.apply(d)
}
get x(){return this._x}
set x(v){if(v!==this._x){this._x=v;if(this._body==='static')this.game.sDirty=true}}
get y(){return this._y}
set y(v){if(v!==this._y){this._y=v;if(this._body==='static')this.game.sDirty=true}}
get z(){return this._z}
set z(v){if(v!==this._z){this._z=v;if(this._body==='static')this.game.sDirty=true}}
get w(){return this._w}
set w(v){if(v!==this._w){this._w=v;if(this._body==='static')this.game.sDirty=true}}
get h(){return this._h}
set h(v){if(v!==this._h){this._h=v;if(this._body==='static')this.game.sDirty=true}}
get d(){return this._d}
set d(v){if(v!==this._d){this._d=v;if(this._body==='static')this.game.sDirty=true}}
get body(){return this._body}
set body(v){if(v!==this._body){this._body=v;if(this.game){this.game.listDirty=true;this.game.sDirty=true}}}
apply(d){
this.id=d.id
this.name=d.name||'Entity'
this.x=d.x||0
this.y=d.y||0
this.w=d.w==null?32:d.w
this.h=d.h==null?32:d.h
this.rot=d.rot||0
this.d=d.d==null?this.w:d.d
this.rx=d.rx||0
this.ry=d.ry||0
this.rz=d.rz||0
this.pid=d.parent||null
this._wx=undefined
this.lx=this.x;this.ly=this.y;this.lrot=this.rot;this.lrx=this.rx;this.lry=this.ry;this.lrz=this.rz
this.shape=d.shape||'rect'
this.color=d.color||'#ffffff'
this.image=d.image||''
this.text=d.text||''
this.fontSize=d.fontSize||20
this.body=this.shape==='tilemap'?'none':d.body||'none'
this.gravityScale=d.gravityScale==null?1:d.gravityScale
this.tags=(d.tags||[]).slice()
this.visible=d.visible!==false
this.z=d.z||0
this.lz=this.z
this.alpha=d.alpha==null?1:d.alpha
this.prefab=!!d.prefab
this.anims=d.anims||null
if(d.anim&&this.anims&&this.anims[d.anim]){if(this.cur!==d.anim||this.game.editor){this.cur=d.anim;this.animT=0;this.animDone=false;const a=this.anims[d.anim];this.frame=a.frames&&a.frames.length?a.frames[0]:0}}
else if(this.game.editor)this.cur=null
this.sound=d.sound||''
this.soundVol=d.soundVol==null?1:d.soundVol
this.soundLoop=!!d.soundLoop
this.soundAuto=!!d.soundAuto
if(d.player&&!pcFull(d.player))Object.assign(d.player,pcNorm(d.player))
this.pc=d.player||null
this.bh=null
if(d.beh&&d.beh.length&&BH&&this.game){this.bh=d.beh.map(BH.runtime).filter(Boolean);if(this.bh.length)this.game.hasBh=true;else this.bh=null}
if(this.pc&&this.game)this.game.hasPc=true
if(this.shape==='tilemap'){
this.tileset=d.tileset||''
this.ts=d.ts||16
this.cell=d.cell||32
this.solid=d.solid!==false
if(this._tobj!==d.tiles||this._tv!==d.tv){this._tobj=d.tiles;this._tv=d.tv;this.loadTiles(d.tiles||{})}
}
}
loadTiles(o){
this.tiles=new Map()
for(const k in o){const i=k.indexOf(',');this.tiles.set(pk(+k.slice(0,i),+k.slice(i+1)),o[k])}
this.bounds()
}
bounds(){
let a=1e9,b=1e9,c=-1e9,d=-1e9
for(const k of this.tiles.keys()){const cx=Math.floor(k/65536)-OFF,cy=k%65536-OFF;if(cx<a)a=cx;if(cx>c)c=cx;if(cy<b)b=cy;if(cy>d)d=cy}
this.tb=a>c?null:[a,b,c,d]
}
getTile(cx,cy){const v=this.tiles?this.tiles.get(pk(cx,cy)):undefined;return v==null?-1:v}
setTile(cx,cy,i){if(!this.tiles)return;this.game.sDirty=true;if(i==null||i<0){if(this.tiles.delete(pk(cx,cy)))this.bounds()}else{this.tiles.set(pk(cx,cy),i|0);const t=this.tb;if(!t)this.tb=[cx,cy,cx,cy];else{if(cx<t[0])t[0]=cx;if(cy<t[1])t[1]=cy;if(cx>t[2])t[2]=cx;if(cy>t[3])t[3]=cy}}}
cellAt(wx,wy){return[Math.floor((wx-this.x)/this.cell),Math.floor((wy-this.y)/this.cell)]}
tileAt(wx,wy){const c=this.cellAt(wx,wy);return this.getTile(c[0],c[1])}
tileHit(o,ep){
if(!this.tiles||!this.tiles.size)return false
ep=ep||0
const s=this.cell,x0=Math.floor((o.x-o.w/2-ep-this.x)/s),x1=Math.floor((o.x+o.w/2+ep-this.x-1e-6)/s),y0=Math.floor((o.y-o.h/2-ep-this.y)/s),y1=Math.floor((o.y+o.h/2+ep-this.y-1e-6)/s)
for(let cx=x0;cx<=x1;cx++)for(let cy=y0;cy<=y1;cy++)if(this.tiles.has(pk(cx,cy)))return true
return false
}
makePlayer(n){this.game.pcAttach(this,n)}
get hp(){return this._hb?this._hb._s.hp:this._pcs?this._pcs.hp:0}
hurt(n){if(this._hb)this.game.bhHurt(this,+n||0);else if(this._pcs)this.game.pcHurt(this,+n||0)}
heal(n){if(this._hb)this._hb._s.hp=Math.min(this._hb.max,this._hb._s.hp+(+n||0));else if(this._pcs)this._pcs.hp=Math.min(this.pc.health.max,this._pcs.hp+(+n||0))}
attachBehavior(t,o){return this.game.bhAttach(this,t,o)}
hasTag(t){return this.tags.indexOf(t)>=0}
addTag(t){if(!this.hasTag(t))this.tags.push(String(t))}
removeTag(t){const i=this.tags.indexOf(t);if(i>=0)this.tags.splice(i,1)}
say(t,s){this.sayText=String(t);this.sayT=s==null?2:s}
jump(p){if(this.grounded){this.vy=this.game.is3d?p:-p;this.grounded=false}}
moveLocal(f,s,yaw){const a=yaw*DEG,fx=-Math.sin(a),fz=-Math.cos(a);this.vx=fx*f-fz*s;this.vz=fz*f+fx*s}
pointAt(o){if(o)this.rot=Math.atan2(o.y-this.y,o.x-this.x)/DEG}
destroy(){this.game.destroy(this)}
dist(o){return o?Math.hypot(o.x-this.x,o.y-this.y,this.game.is3d?o.z-this.z:0):0}
overlaps(o,ep){
ep=ep||0
if(o.shape==='tilemap')return o.tileHit(this,ep)
if(this.shape==='tilemap')return this.tileHit(o,ep)
const e2=ep*2
if(this.game.is3d){
if(this.shape==='capsule'||o.shape==='capsule'){if(!(Math.abs(this.x-o.x)*2<this.w+o.w+e2&&Math.abs(this.y-o.y)*2<this.h+o.h+e2&&Math.abs(this.z-o.z)*2<this.d+o.d+e2))return false;return this.shape==='capsule'?capHit3(this,o,ep):capHit3(o,this,ep)}
return Math.abs(this.x-o.x)*2<this.w+o.w+e2&&Math.abs(this.y-o.y)*2<this.h+o.h+e2&&Math.abs(this.z-o.z)*2<this.d+o.d+e2
}
if(this.shape==='pill'||o.shape==='pill')return this.shape==='pill'?capHit2(this,o,ep):capHit2(o,this,ep)
return Math.abs(this.x-o.x)*2<this.w+o.w+e2&&Math.abs(this.y-o.y)*2<this.h+o.h+e2
}
touching(tag){return this.game.touching(this,tag)}
setZ(z){this.z=z;this.lz=z;this.game.zDirty=true}
play(n,restart){
if(!this.anims||!this.anims[n])return
if(this.cur===n&&!restart&&!this.animDone)return
this.cur=n;this.animT=0;this.animDone=false
const a=this.anims[n];this.frame=a.frames&&a.frames.length?a.frames[0]:0
}
stopAnim(){this.cur=null}
get animation(){return this.cur||''}
playSound(){if(this.sound){this.stopSound();this.snd=this.game.sfx(this.sound,this.soundVol,this.soundLoop)}}
stopSound(){if(this.snd){this.snd.stop();this.snd=null}}
attach(p){this.game.reparent(this,p)}
detach(){this.game.reparent(this,null)}
get parent(){return this.par}
get children(){return this.kids.filter(k=>k.alive)}
}
class Game{
constructor(o){
this.canvas=o.canvas
this.ctx=this.canvas.getContext('2d')
this.project=o.project
this.editor=!!o.editor
this.scripts=o.scripts||{}
const s=this.project.settings||{}
this.pixel=s.pixelArt!==false
this.resize(o.width||s.width||960,o.height||s.height||540)
this.images={}
this.buffers={}
this.entities=[]
this.order=[]
this.pending=[]
this.prefabs={}
this.prefabKids={}
this.hier=[]
this.tms=[]
this.zDirty=true
this.dead=false
this.vars={}
this.keys=new Set()
this.pressedSet=new Set()
this.mouse={x:0,y:0,sx:0,sy:0,dx:0,dy:0,down:false,clicked:false}
this.camera={x:0,y:0,zoom:1,follow:null,smooth:0.12,z:12,tx:0,ty:1,tz:0,fov:70,yaw:0,pitch:20,dist:10,eye:1.5}
this.is3d=false
this.cell=CELL
this.r3=null
this.timers=[]
this.tweens=[]
this.frameWaiters=[]
this.time=0
this.nextScene=null
this.hudLines=new Map()
this.sg=new Map()
this.dg=new Map()
this.pool=[]
this.sDirty=true
this.sCount=-1
this.dgFrame=-1
this.frameNo=0
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
this.cs=null
this.lb=0
this.sounds=new Set()
this.musicH=null
this.vol=1
this.pcNull={}
this.hasPc=false
this.pcE=null
this.hasBh=false
this.scores={}
this.ch={}
this.vue=this.makeApi()
this.loop=this.loop.bind(this)
this.snapN=0
this.exts=[]
}
resize(w,h){
this.w=w
this.h=h
this.canvas.width=w
this.canvas.height=h
this.ctx.imageSmoothingEnabled=!this.pixel
if(this.r3)this.r3.resize(w,h)
}
log(level,text,src){
if(this.onlog)return this.onlog(level,text,src)
if(root.parent&&root.parent!==root)root.parent.postMessage({vue:1,type:'log',level,text:String(text),src:src||''},'*')
else if(root.console)console[level==='error'?'error':'log'](text)
}
err(x,e){
const m=(e?e.name+': ':'')+(x&&x.message||x)
if(this.errSeen.has(m))return
this.errSeen.add(m)
this.log('error',String(x&&x.message||x),e?e.name:'')
}
loadAssets(){
const a=this.project.assets||{},ps=[]
this.images={}
for(const k in a){
if(a[k].type==='image'&&typeof Image!=='undefined'){
const im=new Image()
im.src=a[k].data
this.images[k]=im
ps.push(Promise.race([im.decode?im.decode().catch(()=>{}):new Promise(r=>{im.onload=im.onerror=r}),new Promise(r=>setTimeout(r,4000))]))
}else if(a[k].type==='audio'&&!this.buffers[k]&&typeof fetch!=='undefined'){
const ac=this.audio(true)
if(ac)this.audioLoad=(this.audioLoad||Promise.resolve()).then(()=>fetch(a[k].data).then(r=>r.arrayBuffer()).then(b=>new Promise((res,rej)=>ac.decodeAudioData(b,res,rej))).then(b=>{this.buffers[k]=b}).catch(()=>{}))
if(ac&&this.editor)ps.push(this.audioLoad)
}
}
return Promise.all(ps)
}
findScene(k){
const s=this.project.scenes
for(let i=0;i<s.length;i++)if(s[i].id===k||s[i].name===k)return s[i]
return s[0]
}
loadScene(k){
this.hasPc=false
this.hasBh=false
this.scores={}
this.ch={}
this.pcE=null
const sc=this.findScene(k)
this.scene=sc
this.bg=sc.bg||'#1a1c23'
this.is3d=sc.mode==='3d'
this.cell=this.is3d?8:CELL
this.gravity=sc.gravity==null?(this.is3d?30:1400):sc.gravity
if(this.is3d&&!this.r3&&root.THREE&&root.VueRender3D&&this.canvas.parentNode){
this.r3=new root.VueRender3D(root.THREE,this.canvas.parentNode,this.canvas)
this.r3.resize(this.w,this.h)
}
if(this.r3){this.r3.el.style.display=this.is3d?'block':'none';this.r3.setEditor(this.editor)}
this.entities=[]
this.pending=[]
this.prefabs={}
this.prefabKids={}
this.hudLines.clear()
this.timers=[]
this.tweens=[]
this.frameWaiters=[]
this.pn=0
this.dead=false
this.zDirty=true
this.sDirty=true
this.cs=null
this.lb=0
if(!this.editor&&this.is3d){
const k=sc.camera3||{}
Object.assign(this.camera,{x:k.x==null?0:k.x,y:k.y==null?8:k.y,z:k.z==null?14:k.z,tx:k.tx||0,ty:k.ty==null?1:k.ty,tz:k.tz||0,fov:k.fov||70,yaw:0,pitch:20,dist:10,eye:1.5,follow:null})
}else if(!this.editor){
const c=sc.camera||{}
this.camera.x=c.x||0
this.camera.y=c.y||0
this.camera.zoom=c.zoom||1
this.camera.follow=null
}
const byId={}
for(const d of sc.entities)byId[d.id]=d
const inPrefab=d=>{let p=d,n=0;while(p&&n++<64){if(p.prefab)return p;p=p.parent?byId[p.parent]:null}return null}
for(const d of sc.entities){
const pf=inPrefab(d)
if(pf){
if(d===pf)this.prefabs[d.name]=d
else(this.prefabKids[pf.id]||(this.prefabKids[pf.id]=[])).push(d)
if(!this.editor)continue
}
const e=new Entity(d,this)
if(!this.editor)this.attach(e,d)
this.entities.push(e)
}
this.link()
}
link(){
const m=new Map()
for(const e of this.entities)if(e.alive)m.set(e.id,e)
for(const e of this.pending)if(e.alive)m.set(e.id,e)
this.tms=[]
const all=this.entities.concat(this.pending)
for(const e of all){e.kids=[];if(e.shape==='tilemap'&&e.alive)this.tms.push(e)}
const hs=[]
this.listDirty=true
for(const e of all){
const p=e.pid?m.get(e.pid):null
e.par=p&&p!==e?p:null
if(e.par){e.par.kids.push(e);hs.push(e)}
}
const depth=e=>{let n=0,p=e.par;while(p&&n<64){n++;p=p.par}return n}
hs.sort((a,b)=>depth(a)-depth(b))
this.hier=hs
this.updateHier()
}
updateHier(){
const hs=this.hier,d3=this.is3d
for(let i=0;i<hs.length;i++){
const e=hs[i],p=e.par
if(!p)continue
if(e._wx!==undefined&&(e.x!==e._wx||e.y!==e._wy||(d3?(e.z!==e._wz||e.rx!==e._wrx||e.ry!==e._wry||e.rz!==e._wrz):e.rot!==e._wr))){
const L=toLocal(p,{x:e.x,y:e.y,z:e.z,rot:e.rot,rx:e.rx,ry:e.ry,rz:e.rz},d3)
e.lx=L.x;e.ly=L.y
if(d3){e.lz=L.z;e.lrx=L.rx;e.lry=L.ry;e.lrz=L.rz}else e.lrot=L.rot
}
if(d3){
const R=mat(p.rx,p.ry,p.rz)
e.x=p.x+R[0]*e.lx+R[1]*e.ly+R[2]*e.lz
e.y=p.y+R[3]*e.lx+R[4]*e.ly+R[5]*e.lz
e.z=p.z+R[6]*e.lx+R[7]*e.ly+R[8]*e.lz
const E=eul(mul(R,mat(e.lrx,e.lry,e.lrz)))
e.rx=E[0];e.ry=E[1];e.rz=E[2]
}else{
const a=p.rot*DEG,c=Math.cos(a),s=Math.sin(a)
e.x=p.x+e.lx*c-e.ly*s
e.y=p.y+e.lx*s+e.ly*c
e.rot=p.rot+e.lrot
}
e._wx=e.x;e._wy=e.y;e._wz=e.z;e._wr=e.rot;e._wrx=e.rx;e._wry=e.ry;e._wrz=e.rz
}
}
reparent(e,p){
if(p===e)return
let q=p
while(q){if(q===e)return;q=q.par}
const d3=this.is3d
const L=toLocal(p,{x:e.x,y:e.y,z:e.z,rot:e.rot,rx:e.rx,ry:e.ry,rz:e.rz},d3)
e.pid=p?p.id:null
e._wx=undefined
if(p){e.lx=L.x;e.ly=L.y;if(d3){e.lz=L.z;e.lrx=L.rx;e.lry=L.ry;e.lrz=L.rz}else e.lrot=L.rot}
this.link()
}
refresh(){
for(const e of this.entities)e.apply(e.src)
this.zDirty=true
this.sDirty=true
this.link()
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
if(r!==undefined&&r!==null&&typeof r.then==='function')r.then(null,x=>this.err(x,e))
}catch(x){this.err(x,e)}
}
fire(e,n,a,b){
const l=e.hd&&e.hd[n]
if(!l)return
for(let i=0;i<l.length;i++)this.call(l[i],e,a,b)
}
fireAll(n,a,b){
const es=this.entities
for(let i=0;i<es.length;i++){const e=es[i];if(e.alive&&e.hd&&e.hd[n])this.fire(e,n,a,b)}
}
bhAttach(e,t,o){
if(!e||!BH||!BH.BEH[t])return null
const r=BH.runtime(Object.assign(BH.make(t,this.is3d),o||{},{type:t}))
if(!e.bh)e.bh=[]
e.bh=e.bh.filter(x=>x.type!==t)
e.bh.push(r)
this.hasBh=true
this.bhInit(e)
return r
}
bhHurt(e,n){
const b=e._hb,s=b._s
if(s.inv>0||s.hp<=0||n<=0)return
s.hp=Math.max(0,s.hp-n)
s.inv=b.invuln
s.since=0
this.fire(e,'beh:hurt',n)
if(s.hp<=0){
this.fire(e,'beh:death')
if(b.onDeath==='destroy')e.destroy()
else if(b.onDeath==='respawn'){this.vue.respawn(e);s.hp=b.max}
}
}
bhInit(e){
if(!e._st)e._st=[e.x,e.y,e.z]
for(let j=0;j<e.bh.length;j++){const b=e.bh[j];if(!b._i){b._i=1;const B=BH.BEH[b.type];if(B.init)B.init(this,e,b)}}
}
bhInitAll(){
const es=this.entities
for(let i=0;i<es.length;i++)if(es[i].alive&&es[i].bh)this.bhInit(es[i])
}
bhUpdate(dt){
const es=this.entities
for(let i=0;i<es.length;i++){
const e=es[i]
if(!e.alive||!e.bh)continue
this.bhInit(e)
if(e._tp>0)e._tp-=dt
for(let j=0;j<e.bh.length;j++){
const b=e.bh[j],B=BH.BEH[b.type]
if(B.upd)B.upd(this,e,b,dt)
}
}
}
bhPost(dt){
const es=this.entities
for(let i=0;i<es.length;i++){
const e=es[i]
if(!e.alive||!e.bh)continue
for(let j=0;j<e.bh.length;j++){const b=e.bh[j],B=BH.BEH[b.type];if(B.post&&b._i)B.post(this,e,b,dt)}
}
}
pcAttach(e,n){
if(!e)return
e.pc=pcPreset(typeof n==='string'?n:'Platformer')
if(n&&typeof n==='object')e.pc=pcNorm(n)
this.hasPc=true
e.body='dynamic'
e._pcs=null
this.pcE=e
}
pcState(e,c){return{coy:0,buf:0,jc:0,rise:false,dash:0,dcd:0,face:1,dx:1,dy:0,ax4:'x',cr:false,h0:e.h,hp:c.health.max,sx:e.x,sy:e.y,sz:e.z,lvy:0,gp:false,gd:false}}
pcIn(c){
const K=this.keys,P=this.pressedSet,k=c.keys
if(this.cs&&this.cs.lock)return{ax:0,ay:0,jd:false,jp:false,dp:false,run:false,cr:false}
let ax=(pcAny(k.right,K)?1:0)-(pcAny(k.left,K)?1:0),ay=(pcAny(k.down,K)?1:0)-(pcAny(k.up,K)?1:0),jd=pcAny(k.jump,K),jp=pcAny(k.jump,P),dp=pcAny(k.dash,P),run=pcAny(k.run,K),cr=pcAny(k.crouch,K)
if(c.pad&&root.navigator&&navigator.getGamepads){
const gp=(navigator.getGamepads()||[])[0]
if(gp){
const x=gp.axes[0]||0,y=gp.axes[1]||0,b=i=>!!(gp.buttons[i]&&gp.buttons[i].pressed)
if(Math.abs(x)>0.2)ax=x
if(Math.abs(y)>0.2)ay=y
jd=jd||b(0);jp=jp||(b(0)&&!this._gpj);dp=dp||(b(2)&&!this._gpd);run=run||b(7)
this._gpj=b(0);this._gpd=b(2)
}
}
return{ax,ay,jd,jp,dp,run,cr}
}
pcUpdate(dt){
const es=this.entities
let first=null
for(let i=0;i<es.length;i++){
const e=es[i]
if(!e.alive||!e.pc)continue
if(!first)first=e
this.pcStep(e,dt)
}
if(!this.pcE||!this.pcE.alive||!this.pcE.pc)this.pcE=first
}
pcStep(e,dt){
const c=e.pc,s=e._pcs||(e._pcs=this.pcState(e,c)),d3=this.is3d,i=this.pcIn(c),t=c.type
if(e.body!=='dynamic')e.body='dynamic'
const grav=Math.abs(this.gravity*c.gravityScale),air=e.grounded?1:c.airControl,mass=Math.max(0.1,c.mass)
const run=i.run?c.runMult:1
s.dcd=Math.max(0,s.dcd-dt)
if(c.health&&(e.y>(d3?1e9:6000)||(d3&&e.y<-200)))s.hp=0
if(s.hp<=0&&c.health.respawn!==false){e.x=c.health.rx==null?s.sx:c.health.rx;e.y=c.health.ry==null?s.sy:c.health.ry;if(d3)e.z=s.sz;e.vx=0;e.vy=0;if(d3)e.vz=0;s.hp=c.health.max;this.fireAll('msg:respawn',e)}
const jump=()=>{const v=Math.sqrt(2*grav*Math.max(0,c.jumpHeight));e.vy=d3?v:-v;e.grounded=false;s.rise=true}
if(t==='platformer'||t==='fps'||t==='tps'){
if(e.grounded){s.coy=c.coyote;s.jc=0;s.rise=false}else s.coy=Math.max(0,s.coy-dt)
if(i.jp)s.buf=c.buffer;else s.buf=Math.max(0,s.buf-dt)
if(s.buf>0&&c.jumps>0){
if(s.coy>0){jump();s.coy=0;s.jc=1;s.buf=0}
else{if(s.jc===0)s.jc=1;if(s.jc<c.jumps){jump();s.jc++;s.buf=0}}
}
if(s.rise&&!i.jd&&(d3?e.vy>0:e.vy<0)){e.vy*=0.5;s.rise=false}
if(s.rise&&(d3?e.vy<=0:e.vy>=0))s.rise=false
}
let gs=c.gravityScale
let mx=0,my=0
const crouching=t==='platformer'&&c.crouch&&i.cr&&e.grounded
if(t==='platformer'){
if(crouching&&!s.cr){s.h0=e.h;e.h=s.h0*0.6;e.y+=(s.h0-e.h)/2;s.cr=true}
else if(!crouching&&s.cr){e.y-=(s.h0-e.h)/2;e.h=s.h0;s.cr=false}
mx=i.ax
if(i.ax!==0)s.face=i.ax>0?1:-1
}else if(t==='topdown4'||t==='topdown8'){
let ax=i.ax,ay=i.ay
if(t==='topdown4'){if(ax&&ay){if(s.ax4==='x')ay=0;else ax=0}else if(ax)s.ax4='x';else if(ay)s.ax4='y'}
else if(ax&&ay){const l=Math.hypot(ax,ay);ax/=l;ay/=l}
mx=ax;my=ay
if(ax||ay){s.dx=ax;s.dy=ay}
if(ax!==0)s.face=ax>0?1:-1
}else{
const cam=this.camera,cc=c.cam
if(this.mouse&&(this.scene.mouseLook||this.mouse.down)){cam.yaw-=this.mouse.dx*cc.sens;cam.pitch=clamp(cam.pitch+(t==='fps'?-1:1)*this.mouse.dy*cc.sens,t==='fps'?-85:-10,t==='fps'?85:75)}
const f=-i.ay,sd=i.ax,l=Math.hypot(f,sd)||1,a=cam.yaw*DEG,fx=-Math.sin(a),fz=-Math.cos(a)
mx=(fx*f-fz*sd)/Math.max(1,l)
my=(fz*f+fx*sd)/Math.max(1,l)
if(f||sd){s.dx=mx;s.dy=my}
}
const sp=Math.min(c.speed*run*(crouching?0.5:1),c.maxSpeed)
const acc=(mx||my?c.accel:c.friction*(e.grounded?c.grip:1))*(d3||t==='platformer'?air:1)*dt/mass
if(c.dash.on&&i.dp&&s.dcd<=0&&s.dash<=0){s.dash=c.dash.time;s.dcd=c.dash.cooldown}
if(s.dash>0){
s.dash-=dt
const dl=t==='platformer'?[s.face,0]:[s.dx,s.dy]
if(d3){e.vx=dl[0]*c.dash.speed;e.vz=dl[1]*c.dash.speed}else{e.vx=dl[0]*c.dash.speed;if(t!=='platformer')e.vy=dl[1]*c.dash.speed;else e.vy=0}
if(t==='platformer')gs=0
}else if(t==='platformer'){e.vx=pcAp(e.vx,mx*sp,acc)}
else if(d3){e.vx=pcAp(e.vx,mx*sp,acc);e.vz=pcAp(e.vz,my*sp,acc)}
else{e.vx=pcAp(e.vx,mx*sp,acc);e.vy=pcAp(e.vy,my*sp,acc)}
e.gravityScale=gs
if(d3){
if(t==='fps')e.ry=this.camera.yaw
else if(mx||my)e.ry=Math.atan2(-mx,-my)/DEG
}else if(e.shape==='sprite'||e.anims)e.flipX=s.face<0
if(e.anims){
const mv=Math.abs(e.vx)+(t==='platformer'?0:Math.abs(e.vy))>10
const n=t==='platformer'&&!e.grounded?(e.vy<0?c.anims.jump:c.anims.fall):mv?c.anims.run:c.anims.idle
if(n&&e.anims[n])e.play(n)
}
s.lvy=e.vy
}
pcPost(dt){
const es=this.entities,d3=this.is3d
for(let i=0;i<es.length;i++){
const e=es[i]
if(!e.alive||!e.pc||!e._pcs)continue
const c=e.pc,s=e._pcs
const fall=d3?-s.lvy:s.lvy
if(c.bounce>0&&e.grounded&&fall>(d3?3:200)){e.vy=d3?fall*c.bounce:-fall*c.bounce;e.grounded=false}
}
}
pcHurt(e,n){const s=e._pcs;s.hp=Math.max(0,s.hp-n);if(s.hp<=0)this.fireAll('msg:playerdead',e)}
pcCam(e,dt){
const c=this.camera,pc=e.pc,cc=pc.cam,s=e._pcs
if(this.is3d){
c.follow=e;c.fov=cc.fov;c.smooth=cc.smooth;c.dist=pc.type==='fps'?0:cc.dist;c.eye=cc.height
this.cam3(dt)
return
}
c.follow=null
if(!s)return
c.zoom+=(cc.zoom-c.zoom)*Math.min(1,dt*8)
const k=1-Math.pow(1-cc.smooth,dt*60),sp=Math.max(1,pc.speed),ah=cc.lookAhead||0
const tx=e.x+(pc.type==='platformer'?clamp(e.vx/sp,-1,1):clamp(e.vx/sp,-1,1))*ah,ty=e.y+(pc.type==='platformer'?0:clamp(e.vy/sp,-1,1)*ah)
const dz=cc.deadzone||[0,0]
let gx=tx-clamp(tx-c.x,-dz[0],dz[0]),gy=ty-clamp(ty-c.y,-dz[1],dz[1])
c.x+=(gx-c.x)*k
c.y+=(gy-c.y)*k
const b=cc.bounds
if(b&&b.length===4){
const hw=this.w/(2*c.zoom),hh=this.h/(2*c.zoom)
c.x=b[2]-b[0]<=2*hw?(b[0]+b[2])/2:clamp(c.x,b[0]+hw,b[2]-hw)
c.y=b[3]-b[1]<=2*hh?(b[1]+b[3])/2:clamp(c.y,b[1]+hh,b[3]-hh)
}
}
startAll(){
const es=this.entities.slice()
if(this.hasBh)this.bhInitAll()
for(const e of es){if(e.soundAuto)e.playSound();this.fire(e,'start')}
const sc=this.scene
const pv=this.project._preview
if(pv&&!this._pvDone){this._pvDone=true;this.cutscene(pv)}
else if(sc&&sc.cutscene)this.cutscene(sc.cutscene)
}
vkey(k,on){
k=norm(k)
if(on){if(this.keys.has(k))return;this.keys.add(k);this.pressedSet.add(k);this.audio(true);if(this.cs&&this.cs.lock)return;this.fireAll('key:'+k);this.fireAll('keypress',k)}
else{if(!this.keys.has(k))return;this.keys.delete(k);if(this.cs&&this.cs.lock)return;this.fireAll('keyup:'+k)}
}
add(o){
const d=Object.assign({id:'x'+(++this.stamp),name:'Entity',x:0,y:0,z:0,w:32,h:32,d:32,rot:0,rx:0,ry:0,rz:0,shape:'rect',color:'#ffffff',image:'',text:'',fontSize:20,alpha:1,body:'none',gravityScale:1,tags:[],visible:true,prefab:false,script:null},o||{})
const e=new Entity(d,this)
this.attach(e,d)
this.pending.push(e)
this.link()
return e
}
spawn(n,x,y,z){
const d=this.prefabs[n]
if(!d)return null
const e=new Entity(d,this)
e.prefab=false
e.id=d.id+'#'+(++this.stamp)
if(x!=null){e.x=x;e.y=y==null?e.y:y;e.lx=e.x;e.ly=e.y}
if(z!=null){e.z=z;e.lz=z}
this.attach(e,d)
this.pending.push(e)
const kids=this.prefabKids[d.id]
if(kids){
const map={}
map[d.id]=e.id
const q=kids.slice()
let guard=0
while(q.length&&guard++<512){
const kd=q.shift()
if(!map[kd.parent]){q.push(kd);continue}
const k=new Entity(kd,this)
k.prefab=false
k.id=kd.id+'#'+(++this.stamp)
k.pid=map[kd.parent]
map[kd.id]=k.id
this.attach(k,kd)
this.pending.push(k)
}
}
this.link()
return e
}
destroy(e){
if(!e||!e.alive)return
e.alive=false
e.stopSound()
this.dead=true
if(this.camera.follow===e)this.camera.follow=null
for(const k of e.kids)this.destroy(k)
}
nearest(from,tag){
let best=null,bd=1e18
for(const e of this.entities){
if(!e.alive||e===from||(tag&&e.tags.indexOf(tag)<0))continue
const d=(e.x-from.x)**2+(e.y-from.y)**2+(this.is3d?(e.z-from.z)**2:0)
if(d<bd){bd=d;best=e}
}
return best
}
tween(t,props,secs,ease){
return new Promise(res=>{
if(!t){res();return}
const from={}
for(const k in props)from[k]=+t[k]||0
const tw={t,props,from,dur:Math.max(0,+secs||0),el:0,ease:EASE[ease]||EASE.inout,res}
if(tw.dur===0){for(const k in props)this.setProp(t,k,props[k]);res();return}
this.tweens.push(tw)
})
}
setProp(t,k,v){t[k]=v}
makeApi(){
const g=this
const ent=v=>typeof v==='string'?api.find(v):v
const api={
vars:g.vars,
camera:g.camera,
mouse:g.mouse,
get time(){return g.time},
get player(){return g.pcE&&g.pcE.pc?g.pcE.pc:g.pcNull},
get playerEntity(){return g.pcE||null},
playerPreset:(e,n)=>g.pcAttach(ent(e),n),
behavior:(e,t,o)=>g.bhAttach(ent(e),t,o),
behaviors:()=>BH?BH.NAMES.slice():[],
channel:(n,on)=>{g.ch[n]=on===undefined?true:!!on},
get scores(){return g.scores},
score:(t,by)=>{g.scores[t]=(g.scores[t]||0)+(by==null?1:+by);return g.scores[t]},
give:(e,k,n)=>{e=ent(e);if(!e)return;e._inv=e._inv||{};e._inv[k]=(e._inv[k]||0)+(n==null?1:+n)},
take:(e,k,n)=>{e=ent(e);if(!e||!e._inv)return false;n=n==null?1:+n;if((e._inv[k]||0)<n)return false;e._inv[k]-=n;return true},
itemCount:(e,k)=>{e=ent(e);return e&&e._inv&&e._inv[k]||0},
respawn:e=>{
e=ent(e)
if(!e)return
const p=e._cp||e._st||(e._pcs?[e._pcs.sx,e._pcs.sy,e._pcs.sz]:null)
if(!p)return
e.x=p[0];e.y=p[1];if(g.is3d)e.z=p[2];e.vx=0;e.vy=0;e.vz=0
if(e._hb)e._hb._s.hp=e._hb.max
else if(e._pcs)e._pcs.hp=e.pc.health.max
},
shoot:(e,w)=>{
e=ent(e)
if(!e||!w||!w.prefab)return null
const s=w._s||(w._s={cd:0,ammo:-1})
if(s.cd>0||s.ammo===0)return null
s.cd=w.rate||0
if(s.ammo>0)s.ammo--
const is3=g.is3d
const ang=w.angle!=null?w.angle:is3?(e.ry||0):e._pcs?(String(e.pc.type).indexOf('topdown')===0?Math.atan2(e._pcs.dy,e._pcs.dx)/DEG:(e._pcs.face<0?180:0)):(e.rot||0)
const a=ang*DEG,off=w.offset==null?24:w.offset
const fx=is3?-Math.sin(a):Math.cos(a),fy=is3?0:Math.sin(a),fz=is3?-Math.cos(a):0
const n=g.spawn(w.prefab,e.x+fx*off,e.y+fy*off,is3?e.z+fz*off:undefined)
if(!n)return null
if(is3)n.ry=ang;else n.rot=ang
n._owner=e
g.fire(e,'beh:shoot',n)
return n
},
playerPresets:()=>Object.keys(PC_PRESETS),
get dt(){return STEP},
get width(){return g.w},
get height(){return g.h},
get inCutscene(){return!!g.cs},
get scene(){return g.scene?g.scene.name:''},
key:k=>!(g.cs&&g.cs.lock)&&g.keys.has(norm(k)),
pressed:k=>!(g.cs&&g.cs.lock)&&g.pressedSet.has(norm(k)),
anyKey:()=>!(g.cs&&g.cs.lock)&&g.keys.size>0,
find:n=>{const es=g.entities;for(let i=0;i<es.length;i++){const e=es[i];if(e.alive&&e.name===n)return e}return null},
all:t=>g.entities.filter(e=>e.alive&&(t==null||t===''||e.tags.indexOf(t)>=0)),
count:t=>{let n=0;for(const e of g.entities)if(e.alive&&(t==null||t===''||e.tags.indexOf(t)>=0))n++;return n},
nearest:(from,tag)=>g.nearest(from,tag),
spawn:(n,x,y,z)=>g.spawn(n,x,y,z),
create:o=>g.add(o),
destroy:e=>g.destroy(ent(e)),
go:s=>{g.nextScene=s},
restart:()=>{g.nextScene=g.scene.id},
follow:(e,dist,eye)=>{g.camera.follow=ent(e)||null;if(dist!=null)g.camera.dist=+dist;if(eye!=null)g.camera.eye=+eye},
lockMouse:()=>{if(g.canvas.requestPointerLock)g.canvas.requestPointerLock()},
wait:s=>new Promise(r=>g.timers.push({t:+s||0,f:r})),
until:fn=>new Promise(r=>{const ck=()=>{let ok=false;try{ok=fn()}catch(x){}if(ok)r();else g.frameWaiters.push(ck)};ck()}),
after:(s,f)=>{g.timers.push({t:+s||0,f})},
every:(s,f)=>{const iv=Math.max(0.001,+s||0),tk={t:iv,f:null};tk.f=()=>{tk.t+=iv;g.timers.push(tk);f()};g.timers.push(tk)},
frame:()=>new Promise(r=>g.frameWaiters.push(r)),
random:(a,b)=>{a=+a||0;b=b==null?1:+b;return a+Math.random()*(b-a)},
randomInt:(a,b)=>{a=Math.ceil(+a||0);b=Math.floor(+b||0);return a+Math.floor(Math.random()*(b-a+1))},
pick:l=>l&&l.length?l[Math.floor(Math.random()*l.length)]:undefined,
chance:p=>Math.random()<+p,
lerp:(a,b,k)=>a+(b-a)*k,
clamp:(v,a,b)=>clamp(v,a,b),
dist:(a,b)=>{a=ent(a);b=ent(b);return a&&b?Math.hypot(a.x-b.x,a.y-b.y,g.is3d?a.z-b.z:0):0},
angle:(a,b)=>{a=ent(a);b=ent(b);return a&&b?Math.atan2(b.y-a.y,b.x-a.x)/DEG:0},
tween:(t,props,secs,ease)=>g.tween(ent(t),props,secs,ease),
hud:(k,v)=>{g.hudLines.set(String(k),v)},
clearHud:k=>{if(k==null)g.hudLines.clear();else g.hudLines.delete(String(k))},
beep:(f,d,t,v)=>g.beep(f,d,t,v),
play:(n,v,loop,rate)=>g.sfx(n,v,loop,rate),
music:(n,v)=>g.music(n,v),
stopMusic:()=>g.stopMusic(),
stopSounds:()=>g.stopSounds(),
volume:v=>{g.vol=clamp(+v,0,1);if(g.master)g.master.gain.value=g.vol},
burst:(x,y,c,n)=>g.burst(x,y,c,n),
shake:(a,d)=>{g.shakeA=+a||0;g.shakeT=d==null?0.3:+d},
emit:(n,data)=>g.fireAll('msg:'+n,data),
cutscene:n=>g.cutscene(n),
skipCutscene:()=>g.skipCs(),
tileAt:(m,x,y)=>{m=ent(m);return m&&m.tileAt?m.tileAt(x,y):-1},
setTile:(m,x,y,i)=>{m=ent(m);if(m&&m.cellAt){const c=m.cellAt(x,y);m.setTile(c[0],c[1],i)}},
log:(...a)=>g.log('log',a.map(String).join(' ')),
warn:(...a)=>g.log('warn',a.map(String).join(' ')),
stop:()=>g.stop()
}
return api
}
audio(silent){
if(!this.ac){const C=root.AudioContext||root.webkitAudioContext;if(C){this.ac=new C();this.master=this.ac.createGain();this.master.gain.value=this.vol;this.master.connect(this.ac.destination)}}
if(!silent&&this.ac&&this.ac.state==='suspended')this.ac.resume()
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
g.connect(this.master)
o.start()
o.stop(a.currentTime+d)
}
sfx(n,v,loop,rate){
const ac=this.audio(),b=this.buffers[n]
v=v==null?1:+v
if(ac&&b){
const s=ac.createBufferSource(),g=ac.createGain()
s.buffer=b
s.loop=!!loop
s.playbackRate.value=rate||1
g.gain.value=v
s.connect(g)
g.connect(this.master)
s.start()
const h={stop:()=>{try{s.stop()}catch(x){}this.sounds.delete(h)},set volume(x){g.gain.value=x}}
this.sounds.add(h)
s.onended=()=>this.sounds.delete(h)
return h
}
const a=this.project.assets&&this.project.assets[n]
if(a&&a.type==='audio'&&typeof Audio!=='undefined'){
const el=new Audio(a.data)
el.volume=clamp(v*this.vol,0,1)
el.loop=!!loop
el.play().catch(()=>{})
const h={stop:()=>{el.pause();this.sounds.delete(h)},set volume(x){el.volume=clamp(x*this.vol,0,1)}}
this.sounds.add(h)
return h
}
return{stop(){},set volume(x){}}
}
music(n,v){this.stopMusic();this.musicH=this.sfx(n,v==null?0.6:v,true);return this.musicH}
stopMusic(){if(this.musicH){this.musicH.stop();this.musicH=null}}
stopSounds(){for(const h of Array.from(this.sounds))h.stop();this.musicH=null}
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
fill(grid,stat){
const pool=this.pool,d3=this.is3d,C=this.cell
for(const a of grid.values()){a.length=0;pool.push(a)}
grid.clear()
const es=this.entities
for(let i=0;i<es.length;i++){
const e=es[i]
if(!e.alive||e.body==='none'||(stat&&e.body!=='static'))continue
const pb=d3?e.z:e.y,wb=d3?e.d:e.h
const x0=Math.floor((e.x-e.w/2)/C),x1=Math.floor((e.x+e.w/2)/C),y0=Math.floor((pb-wb/2)/C),y1=Math.floor((pb+wb/2)/C)
for(let cx=x0;cx<=x1;cx++)for(let cy=y0;cy<=y1;cy++){
const k=pk(cx,cy)
let a=grid.get(k)
if(!a){a=pool.pop()||[];grid.set(k,a)}
a.push(e)
}
}
}
staticGrid(){
const es=this.entities,d3=this.is3d
let n=0,dirty=this.sDirty
for(let i=0;i<es.length;i++){
const e=es[i]
if(!e.alive||e.body!=='static')continue
n++
if(e._sx!==e.x||e._sy!==e.y||e._sw!==e.w||e._sh!==e.h||(d3&&(e._sz!==e.z||e._sd!==e.d))){dirty=true;e._sx=e.x;e._sy=e.y;e._sw=e.w;e._sh=e.h;e._sz=e.z;e._sd=e.d}
}
if(n!==this.sCount)dirty=true
if(dirty){this.fill(this.sg,true);this.sCount=n;this.sDirty=false}
}
dynGrid(){
if(this.dgFrame===this.frameNo)return
this.dgFrame=this.frameNo
this.fill(this.dg,false)
}
query(e,out,grid){
out.length=0
const st=++this.stamp,d3=this.is3d,C=this.cell
const pb=d3?e.z:e.y,wb=d3?e.d:e.h
const a0=Math.floor((e.x-e.w/2)/C),a1=Math.floor((e.x+e.w/2)/C),b0=Math.floor((pb-wb/2)/C),b1=Math.floor((pb+wb/2)/C)
for(let cx=a0;cx<=a1;cx++)for(let cy=b0;cy<=b1;cy++){
const a=grid.get(pk(cx,cy))
if(!a)continue
for(let i=0;i<a.length;i++){
const o=a[i]
if(o._q!==st){o._q=st;out.push(o)}
}
}
return out
}
ep(){return this.is3d?0.01:0.5}
touching(e,tag){
this.dynGrid()
const q=this.query(e,this.qt,this.dg)
for(let i=0;i<q.length;i++){
const o=q[i]
if(o!==e&&o.alive&&(tag==null||tag===''||o.tags.indexOf(tag)>=0)&&e.overlaps(o,this.ep()))return true
}
if(!this.is3d)for(const m of this.tms)if(m!==e&&m.alive&&(tag==null||tag===''||m.tags.indexOf(tag)>=0)&&m.tileHit(e,0.5))return true
return false
}
rect(e,sx,sy,sw,sh,ax){
if(e.shape==='pill')return this.cap(e,sx,sy,sw,sh,ax)
if(!(Math.abs(e.x-sx)*2<sw+e.w&&Math.abs(e.y-sy)*2<sh+e.h))return
if(ax){
if(e.vx>0||(e.vx===0&&e.x<sx))e.x=sx-(sw+e.w)/2
else e.x=sx+(sw+e.w)/2
e.vx=0
}else{
if(e.vy>0||(e.vy===0&&e.y<sy)){e.y=sy-(sh+e.h)/2;e.grounded=true}
else e.y=sy+(sh+e.h)/2
e.vy=0
}
}
cap(e,sx,sy,sw,sh,ax){
const v=e.h>=e.w,r=(v?e.w:e.h)/2,L=(v?e.h:e.w)/2-r
const dx=Math.max(0,Math.abs(e.x-sx)-sw/2),dy=Math.max(0,Math.abs(e.y-sy)-sh/2),gx=v?dx:Math.max(0,dx-L),gy=v?Math.max(0,dy-L):dy
if(gx*gx+gy*gy>=(r-0.001)*(r-0.001))return
if(ax){
const n=Math.sqrt(Math.max(0,r*r-gy*gy))+(v?0:L)
if(e.vx>0||(e.vx===0&&e.x<sx))e.x=sx-sw/2-n
else e.x=sx+sw/2+n
e.vx=0
}else{
const n=Math.sqrt(Math.max(0,r*r-gx*gx))+(v?L:0)
if(e.vy>0||(e.vy===0&&e.y<sy)){e.y=sy-sh/2-n;e.grounded=true}
else e.y=sy+sh/2+n
e.vy=0
}
}
cap3(e,s,ax){
const r=Math.min(e.w,e.d)/2,L=e.h/2-r,dx=Math.max(0,Math.abs(e.x-s.x)-s.w/2),dz=Math.max(0,Math.abs(e.z-s.z)-s.d/2),dy=Math.max(0,Math.abs(e.y-s.y)-s.h/2),gy=Math.max(0,dy-L)
if(ax===0){
const n=Math.sqrt(Math.max(0,r*r-dz*dz-gy*gy))
if(e.vx>0||(e.vx===0&&e.x<s.x))e.x=s.x-s.w/2-n
else e.x=s.x+s.w/2+n
e.vx=0
}else if(ax===2){
const n=Math.sqrt(Math.max(0,r*r-dx*dx-gy*gy))
if(e.vz>0||(e.vz===0&&e.z<s.z))e.z=s.z-s.d/2-n
else e.z=s.z+s.d/2+n
e.vz=0
}else{
const n=Math.sqrt(Math.max(0,r*r-dx*dx-dz*dz))+L
if(e.vy<0||(e.vy===0&&e.y>s.y)){e.y=s.y+s.h/2+n;e.grounded=true}
else e.y=s.y-s.h/2-n
e.vy=0
}
}
resolve(e,ax){
const q=this.query(e,this.qr,this.sg)
for(let i=0;i<q.length;i++){
const s=q[i]
if(s===e||!s.alive||!pcLayer(e,s))continue
this.rect(e,s.x,s.y,s.w,s.h,ax)
}
const tms=this.tms
for(let t=0;t<tms.length;t++){
const m=tms[t]
if(!m.alive||!m.solid||!m.tiles.size||!pcLayer(e,m))continue
const c=m.cell,x0=Math.floor((e.x-e.w/2-m.x)/c),x1=Math.floor((e.x+e.w/2-m.x-1e-6)/c),y0=Math.floor((e.y-e.h/2-m.y)/c),y1=Math.floor((e.y+e.h/2-m.y-1e-6)/c)
for(let cx=x0;cx<=x1;cx++)for(let cy=y0;cy<=y1;cy++)if(m.tiles.has(pk(cx,cy)))this.rect(e,m.x+(cx+0.5)*c,m.y+(cy+0.5)*c,c,c,ax)
}
}
vwr(){
const V=root.VWR
const core=this.project.settings&&this.project.settings.core
if(!V||!V.exports||core==='js')return null
if(!this.W){
this.sleep=core!=='vwr-steady'
const x=V.exports,m=x.memory.buffer,F=(f,n)=>new Float64Array(m,x[f](),n),MS=x.vwr_max_static(),MD=x.vwr_max_dynamic()
this.W={x,MS,MD,sx:F('vwr_sx',MS),sy:F('vwr_sy',MS),sz:F('vwr_sz',MS),sw:F('vwr_sw',MS),sh:F('vwr_sh',MS),sd:F('vwr_sd',MS),dx:F('vwr_dx',MD),dy:F('vwr_dy',MD),dz:F('vwr_dz',MD),dw:F('vwr_dw',MD),dh:F('vwr_dh',MD),dd:F('vwr_dd',MD),dvx:F('vwr_dvx',MD),dvy:F('vwr_dvy',MD),dvz:F('vwr_dvz',MD),dgs:F('vwr_dgs',MD),dgr:new Uint8Array(m,x.vwr_dgr(),MD),list:[],sn:-1}
}
return this.W
}
lists(){
const es=this.entities,st=this.statics||(this.statics=[]),dy=this.dyns||(this.dyns=[])
const old=st.slice()
st.length=0;dy.length=0
let cap=false
for(let i=0;i<es.length;i++){const e=es[i];if(!e.alive)continue;const b=e._body;if(b!=='none'&&(e.shape==='pill'||e.shape==='capsule'||(e.pc&&e.pc.layers&&e.pc.layers.length)))cap=true;if(b==='static')st.push(e);else if(b==='dynamic'&&!e.par)dy.push(e)}
this.hasCap=cap
if(old.length!==st.length)this.sDirty=true
else for(let i=0;i<st.length;i++)if(old[i]!==st[i]){this.sDirty=true;break}
this.listDirty=false
}
physW(dt){
const W=this.vwr(),d3=this.is3d
if(this.listDirty||!this.statics)this.lists()
if(this.hasCap)return false
const es=this.statics
let dirty=this.sDirty||W.d3!==d3,n=es.length
if(!d3)for(const m of this.tms)if(m.alive&&m.solid){n+=m.tiles.size;if(m._ox!==m.x||m._oy!==m.y||m._oc!==m.cell){dirty=true;m._ox=m.x;m._oy=m.y;m._oc=m.cell}}
if(n!==W.sn)dirty=true
if(n>W.MS)return false

if(dirty){
let k=0
for(let i=0;i<es.length;i++){
const e=es[i]
if(!e.alive)continue
W.sx[k]=e.x;W.sy[k]=e.y;W.sw[k]=e.w;W.sh[k]=e.h;W.sz[k]=e.z;W.sd[k]=e.d;k++
}
const ne=k
if(!d3)for(const m of this.tms){
if(!m.alive||!m.solid)continue
const c=m.cell
for(const key of m.tiles.keys()){const cx=Math.floor(key/65536)-OFF,cy=key%65536-OFF;W.sx[k]=m.x+(cx+0.5)*c;W.sy[k]=m.y+(cy+0.5)*c;W.sw[k]=c;W.sh[k]=c;W.sz[k]=0;W.sd[k]=0;k++}
}
W.x.vwr_static(k,ne,d3?1:0,this.cell)
W.sn=n
W.d3=d3
this.sDirty=false
}
const L=this.dyns,nl=L.length
if(nl>W.MD)return false
const dx=W.dx,dyy=W.dy,dz=W.dz,dw=W.dw,dh=W.dh,dd=W.dd,dvx=W.dvx,dvy=W.dvy,dvz=W.dvz,dgs=W.dgs,dgr=W.dgr
const wake=dirty||W.lg!==this.gravity||W.ldt!==dt||!this.sleep,map=W.map||(W.map=new Int32Array(W.MD))
W.lg=this.gravity;W.ldt=dt
let m=0
for(let i=0;i<nl;i++){
const e=L[i]
if(!wake&&e._rs===1&&e._x===e._ix&&e._y===e._iy&&e.vx===e._ivx&&e.vy===e._ivy&&e._w===e._iw&&e._h===e._ih&&e.gravityScale===e._igs&&(!d3||(e._z===e._iz&&e.vz===e._ivz&&e._d===e._id))){e.grounded=e._ig;continue}
map[m]=i;dx[m]=e._x;dyy[m]=e._y;dw[m]=e._w;dh[m]=e._h;dvx[m]=e.vx;dvy[m]=e.vy;dgs[m]=e.gravityScale
if(d3){dz[m]=e._z;dd[m]=e._d;dvz[m]=e.vz}
m++
}
W.awake=m
if(m)W.x.vwr_step(m,dt,this.gravity)
for(let j=0;j<m;j++){
const e=L[map[j]]
if(!e.alive)continue
const x=dx[j],y=dyy[j],vx=dvx[j],vy=dvy[j],gr=dgr[j]===1
let rs=x===e._x&&y===e._y&&vx===e.vx&&vy===e.vy
e._x=x;e._y=y;e.vx=vx;e.vy=vy;e.grounded=gr
if(d3){const z=dz[j],vz=dvz[j];rs=rs&&z===e._z&&vz===e.vz;e._z=z;e.vz=vz;if(rs){e._iz=z;e._ivz=vz;e._id=e._d}}
if(rs){e._rs=1;e._ix=x;e._iy=y;e._ivx=vx;e._ivy=vy;e._iw=e._w;e._ih=e._h;e._igs=e.gravityScale;e._ig=gr}else e._rs=0
}
return true
}
physics(dt){
if(this.vwr()&&this.physW(dt)){this.sgStale=true;return}
if(this.sgStale){this.sDirty=true;this.sgStale=false}
if(this.W)this.W.sn=-1
const es=this.entities,g=this.gravity
this.staticGrid()
for(let i=0;i<es.length;i++){
const e=es[i]
if(!e.alive||e.body!=='dynamic'||e.par)continue
e.vy+=g*e.gravityScale*dt
e.x+=e.vx*dt
this.resolve(e,true)
e.grounded=false
e.y+=e.vy*dt
this.resolve(e,false)
}
}
physics3(dt){
if(this.vwr()&&this.physW(dt)){this.sgStale=true;return}
if(this.sgStale){this.sDirty=true;this.sgStale=false}
if(this.W)this.W.sn=-1
const es=this.entities,g=this.gravity
this.staticGrid()
for(let i=0;i<es.length;i++){
const e=es[i]
if(!e.alive||e.body!=='dynamic'||e.par)continue
e.vy-=g*e.gravityScale*dt
e.x+=e.vx*dt
this.res3(e,0)
e.z+=e.vz*dt
this.res3(e,2)
e.grounded=false
e.y+=e.vy*dt
this.res3(e,1)
}
}
res3(e,ax){
const q=this.query(e,this.qr,this.sg)
for(let i=0;i<q.length;i++){
const s=q[i]
if(s===e||!s.alive||!pcLayer(e,s)||!e.overlaps(s))continue
if(e.shape==='capsule'){this.cap3(e,s,ax);continue}
if(ax===0){
if(e.vx>0||(e.vx===0&&e.x<s.x))e.x=s.x-(s.w+e.w)/2
else e.x=s.x+(s.w+e.w)/2
e.vx=0
}else if(ax===2){
if(e.vz>0||(e.vz===0&&e.z<s.z))e.z=s.z-(s.d+e.d)/2
else e.z=s.z+(s.d+e.d)/2
e.vz=0
}else{
if(e.vy<0||(e.vy===0&&e.y>s.y)){e.y=s.y+(s.h+e.h)/2;e.grounded=true}
else e.y=s.y-(s.h+e.h)/2
e.vy=0
}
}
}
cam3(dt){
const c=this.camera,t=c.follow
if(!t||!t.alive||(this.cs&&this.cs.cam))return
const yaw=c.yaw*DEG,pit=c.pitch*DEG,cp=Math.cos(pit)
if(c.dist>0.05){
const k=1-Math.pow(1-c.smooth,dt*60)
const tx=t.x,ty=t.y+c.eye,tz=t.z
const px=tx+Math.sin(yaw)*cp*c.dist,py=ty+Math.sin(pit)*c.dist,pz=tz+Math.cos(yaw)*cp*c.dist
c.tx+=(tx-c.tx)*k;c.ty+=(ty-c.ty)*k;c.tz+=(tz-c.tz)*k
c.x+=(px-c.x)*k;c.y+=(py-c.y)*k;c.z+=(pz-c.z)*k
}else{
c.x=t.x;c.y=t.y+c.eye;c.z=t.z
c.tx=c.x-Math.sin(yaw)*cp
c.ty=c.y+Math.sin(pit)
c.tz=c.z-Math.cos(yaw)*cp
}
}
events(){
const es=this.entities
let any=false
for(let i=0;i<es.length;i++){const e=es[i];if(e.alive&&e.hd&&e.hd.collide){any=true;break}}
if(!any)return
this.dynGrid()
const ep=this.ep()
for(let i=0;i<es.length;i++){
const a=es[i]
if(!a.alive)continue
const c=a.hd&&a.hd.collide
if(!c)continue
if(a.body!=='none'){
const q=this.query(a,this.qe,this.dg)
for(let j=0;j<q.length;j++){
const b=q[j]
if(b===a||!b.alive||!a.alive||!a.overlaps(b,ep))continue
for(let k=0;k<c.length;k++)this.call(c[k],a,b)
}
}
if(!this.is3d)for(const m of this.tms)if(m!==a&&m.alive&&a.alive&&m.tileHit(a,ep))for(let k=0;k<c.length;k++)this.call(c[k],a,m)
}
}
cutscene(n){
const list=this.project.cutscenes||[]
const def=list.find(c=>c.id===n||c.name===n)
if(!def){this.log('warn','No cutscene named '+n);return Promise.resolve()}
if(this.cs)this.endCs(true)
return new Promise(res=>{
const steps=(def.steps||[]).map(s=>({s,st:false,en:false,from:null}))
let end=0
for(const s of def.steps||[])end=Math.max(end,(+s.t||0)+(+s.dur||0))
this.cs={def,t:0,end,steps,res,lock:def.lock!==false,box:def.letterbox!==false,skip:def.skippable!==false,caption:'',capT:0,cam:false,follow:this.camera.follow}
})
}
csTarget(s){
if(s.type==='camera')return this.camera
return s.target?this.vue.find(s.target):null
}
csStart(x){
const s=x.s,t=this.csTarget(s),ty=s.type
x.st=true
const props={}
if(ty==='move'){props.x=+s.x||0;props.y=+s.y||0;if(this.is3d)props.z=+s.z||0}
else if(ty==='rotate'){if(this.is3d)props.ry=+s.rot||0;else props.rot=+s.rot||0}
else if(ty==='fade')props.alpha=+s.alpha
else if(ty==='scale'){props.w=+s.w||1;props.h=+s.h||1}
else if(ty==='camera'){
this.cs.cam=true
this.camera.follow=null
if(this.is3d){props.x=+s.x||0;props.y=+s.y||0;props.z=+s.z||0;props.tx=+s.tx||0;props.ty=+s.ty||0;props.tz=+s.tz||0}
else{props.x=+s.x||0;props.y=+s.y||0;props.zoom=+s.zoom||1}
}else if(ty==='say'){if(t)t.say(s.text||'',+s.dur||2)}
else if(ty==='caption'){this.cs.caption=String(s.text||'');this.cs.capT=+s.dur||2}
else if(ty==='sound'){if(s.sound)this.sfx(s.sound,s.vol==null?1:+s.vol)}
else if(ty==='music'){if(s.sound)this.music(s.sound,s.vol==null?0.6:+s.vol)}
else if(ty==='shake'){this.shakeA=+s.amount||6;this.shakeT=+s.dur||0.3}
else if(ty==='show'){if(t)t.visible=true}
else if(ty==='hide'){if(t)t.visible=false}
else if(ty==='anim'){if(t)t.play(s.anim,true)}
else if(ty==='setvar'){this.vars[s.name||'var']=isNaN(+s.value)||s.value===''?s.value:+s.value}
else if(ty==='emit'){this.fireAll('msg:'+(s.name||''),s.value)}
x.t=t
x.props=props
x.from={}
if(t)for(const k in props)x.from[k]=+t[k]||0
if(!Object.keys(props).length)x.en=true
}
csStep(x,k){
const t=x.t
if(!t)return
const e=(EASE[x.s.ease]||EASE.inout)(k)
for(const p in x.props)this.setProp(t,p,x.from[p]+(x.props[p]-x.from[p])*e)
}
csUpdate(dt){
const cs=this.cs
cs.t+=dt
for(const x of cs.steps){
if(!x.st&&cs.t>=(+x.s.t||0))this.csStart(x)
if(x.st&&!x.en){
const d=+x.s.dur||0,k=d>0?clamp((cs.t-(+x.s.t||0))/d,0,1):1
this.csStep(x,k)
if(k>=1)x.en=true
}
}
if(cs.capT>0){cs.capT-=dt;if(cs.capT<=0)cs.caption=''}
if(cs.t>=cs.end&&cs.steps.every(x=>x.en||!x.props))this.endCs(false)
}
skipCs(){
const cs=this.cs
if(!cs||!cs.skip)return
for(const x of cs.steps){
if(!x.st){
const ty=x.s.type
if(ty==='say'||ty==='caption'||ty==='sound'||ty==='shake'||ty==='emit')continue
this.csStart(x)
}
if(x.props)this.csStep(x,1)
}
this.endCs(false)
}
endCs(){
const cs=this.cs
if(!cs)return
this.cs=null
if(cs.follow&&cs.follow.alive)this.camera.follow=cs.follow
cs.res()
}
update(dt){
this.frameNo++
this.time+=dt
if(this.exts.length)this.hk('pre',dt)
const tm=this.timers
if(tm.length){
for(let i=tm.length-1;i>=0;i--){
const t=tm[i]
t.t-=dt
if(t.t<=1e-9){tm.splice(i,1);try{t.f()}catch(x){this.err(x)}}
}
}
if(this.frameWaiters.length){const f=this.frameWaiters;this.frameWaiters=[];for(let i=0;i<f.length;i++)f[i]()}
this.updateMouse()
const es=this.entities
for(let i=0;i<es.length;i++){
const e=es[i]
if(!e.alive)continue
const u=e.hd&&e.hd.update
if(u)for(let j=0;j<u.length;j++)this.call(u[j],e,dt)
if(e.cur){
const a=e.anims&&e.anims[e.cur]
if(a&&a.frames&&a.frames.length){
e.animT+=dt
const n=a.frames.length
let i2=Math.floor(e.animT*(a.fps||8))
if(a.loop!==false)i2%=n
else if(i2>=n){i2=n-1;if(!e.animDone){e.animDone=true;this.fire(e,'animend',e.cur)}}
e.frame=a.frames[i2]
}
}
}
if(this.tweens.length){
const tw=this.tweens
for(let i=tw.length-1;i>=0;i--){
const w=tw[i]
w.el+=dt
const k=Math.min(1,w.el/w.dur),e=w.ease(k)
for(const p in w.props)this.setProp(w.t,p,w.from[p]+(w.props[p]-w.from[p])*e)
if(k>=1){tw.splice(i,1);w.res()}
}
}
if(this.cs)this.csUpdate(dt)
if(this.hasPc)this.pcUpdate(dt)
if(this.hasBh)this.bhUpdate(dt)
if(this.is3d)this.physics3(dt);else this.physics(dt)
if(this.hasPc)this.pcPost(dt)
if(this.hasBh)this.bhPost(dt)
if(this.hier.length)this.updateHier()
if(this.exts.length)this.hk('update',dt)
this.events()
const c=this.camera
const pe=this.pcE
if(pe&&pe.alive&&pe.pc&&pe.pc.cam.follow&&!(this.cs&&this.cs.cam))this.pcCam(pe,dt)
else if(this.is3d)this.cam3(dt)
else if(c.follow&&c.follow.alive&&!(this.cs&&this.cs.cam)){
const k=1-Math.pow(1-c.smooth,dt*60)
c.x+=(c.follow.x-c.x)*k
c.y+=(c.follow.y-c.y)*k
}
const lbT=this.cs&&this.cs.box?1:0
this.lb+=(lbT-this.lb)*Math.min(1,dt*6)
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
this.link()
for(const e of p){if(e.soundAuto)e.playSound();this.fire(e,'start')}
}
if(this.dead){this.entities=this.entities.filter(e=>e.alive);this.dead=false;this.zDirty=true;this.link()}
this.pressedSet.clear()
this.mouse.clicked=false
this.mouse.dx=0
this.mouse.dy=0
if(this.nextScene!==null){
const n=this.nextScene
this.nextScene=null
this.stopSounds()
this.loadScene(n)
if(this.exts.length)this.hk("scene")
this.startAll()
}
}
updateMouse(){
const m=this.mouse,c=this.camera
m.x=(m.sx-this.w/2)/c.zoom+c.x
m.y=(m.sy-this.h/2)/c.zoom+c.y
}
drawTiles(c,e,l,r,t,b){
const s=e.cell,img=this.images[e.tileset],ok=img&&img.complete&&img.naturalWidth,ts=e.ts,cols=ok?Math.max(1,Math.floor(img.naturalWidth/ts)):1
const cx0=Math.floor((l-e.x)/s),cx1=Math.floor((r-e.x)/s),cy0=Math.floor((t-e.y)/s),cy1=Math.floor((b-e.y)/s)
const area=(cx1-cx0+1)*(cy1-cy0+1)
const draw=(cx,cy,i)=>{
const dx=e.x+cx*s,dy=e.y+cy*s
if(ok)c.drawImage(img,(i%cols)*ts,Math.floor(i/cols)*ts,ts,ts,dx,dy,s+0.02,s+0.02)
else{c.fillStyle=TILE_COLORS[i%TILE_COLORS.length];c.fillRect(dx,dy,s,s)}
}
if(area<e.tiles.size){
for(let cx=cx0;cx<=cx1;cx++)for(let cy=cy0;cy<=cy1;cy++){const i=e.tiles.get(pk(cx,cy));if(i!=null)draw(cx,cy,i)}
}else{
for(const[k,i]of e.tiles){const cx=Math.floor(k/65536)-OFF,cy=k%65536-OFF;if(cx<cx0||cx>cx1||cy<cy0||cy>cy1)continue;draw(cx,cy,i)}
}
}
draw(){
if(this.is3d){this.draw3();return}
const c=this.ctx,W=this.w,H=this.h,cam=this.camera,z=cam.zoom
if(this.zDirty){this.order=this.entities.slice().sort((a,b)=>a.z-b.z);this.zDirty=false}
c.setTransform(1,0,0,1,0,0)
c.globalAlpha=1
const at=this.scene.atmo
if(at&&at.gradient!==false&&at.skyTop){const k=at.skyTop+at.skyBottom+H;if(this._agk!==k){const gr=c.createLinearGradient(0,0,0,H);gr.addColorStop(0,at.skyTop);gr.addColorStop(1,at.skyBottom||this.bg);this._ag=gr;this._agk=k}c.fillStyle=this._ag}
else c.fillStyle=this.bg
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
let a=e.alpha
if(this.editor&&(e.prefab||!e.visible))a*=0.4
if(a<=0)continue
if(e.shape==='tilemap'){
if(!e.tiles||!e.tiles.size)continue
if(a!==al){c.globalAlpha=a;al=a}
this.drawTiles(c,e,l,r,t,b)
fill=''
continue
}
const rad=(Math.abs(e.w)+Math.abs(e.h))*0.5
if(e.x+rad<l||e.x-rad>r||e.y+rad<t||e.y-rad>b)continue
if(a!==al){c.globalAlpha=a;al=a}
const rot=e.rot!==0,flip=e.flipX
if(rot||flip){
const ca=rot?Math.cos(e.rot*DEG):1,sa=rot?Math.sin(e.rot*DEG):0,fx=flip?-1:1
c.setTransform(z*ca*fx,z*sa*fx,-z*sa,z*ca,W/2+(e.x-cx)*z,H/2+(e.y-cy)*z)
c.translate(-e.x,-e.y)
}
const s=e.shape
if(s==='sprite'){
const an=e.cur&&e.anims?e.anims[e.cur]:null
const key=an?an.sheet:e.image
if(e.imgName!==key||!e.img){e.img=this.images[key]||null;e.imgName=key}
const im=e.img
if(im&&im.complete&&im.naturalWidth){
if(an&&an.fw&&an.fh){const cols=Math.max(1,Math.floor(im.naturalWidth/an.fw)),f=e.frame|0;c.drawImage(im,(f%cols)*an.fw,Math.floor(f/cols)*an.fh,an.fw,an.fh,e.x-e.w/2,e.y-e.h/2,e.w,e.h)}
else c.drawImage(im,e.x-e.w/2,e.y-e.h/2,e.w,e.h)
}else{if(fill!=='#ff00ff'){c.fillStyle='#ff00ff';fill='#ff00ff'}c.fillRect(e.x-e.w/2,e.y-e.h/2,e.w,e.h)}
}else if(s==='circle'){
if(fill!==e.color){c.fillStyle=e.color;fill=e.color}
c.beginPath()
c.ellipse(e.x,e.y,Math.abs(e.w)/2,Math.abs(e.h)/2,0,0,6.2832)
c.fill()
}else if(SHAPES2.has(s)){
if(fill!==e.color){c.fillStyle=e.color;fill=e.color}
const Lp=shapeLoops(s,e.w,e.h)
c.beginPath()
for(let q=0;q<Lp.length;q++){const p=Lp[q];c.moveTo(e.x+p[0][0],e.y+p[0][1]);for(let k=1;k<p.length;k++)c.lineTo(e.x+p[k][0],e.y+p[k][1]);c.closePath()}
c.fill('evenodd')
}else if(s==='text'){
if(fill!==e.color){c.fillStyle=e.color;fill=e.color}
const f=e.fontSize+'px Inter,system-ui,sans-serif'
if(f!==font){c.font=f;c.textAlign='center';c.textBaseline='middle';font=f}
c.fillText(e.text,e.x,e.y)
}else{
if(fill!==e.color){c.fillStyle=e.color;fill=e.color}
c.fillRect(e.x-e.w/2,e.y-e.h/2,e.w,e.h)
}
if(rot||flip)c.setTransform(z,0,0,z,W/2-cx*z,H/2-cy*z)
}
if(al!==1)c.globalAlpha=1
for(let i=0;i<this.pn;i++){
c.globalAlpha=Math.min(1,this.pl[i]*2)
c.fillStyle=this.pc[i]
c.fillRect(this.px[i]-2,this.py[i]-2,4,4)
}
c.globalAlpha=1
for(let i=0;i<o.length;i++){
const e=o[i]
if(!e.alive||!e.sayText)continue
c.font='600 14px Inter,system-ui,sans-serif'
c.textAlign='center'
c.textBaseline='middle'
const tw=c.measureText(e.sayText).width+16,by=e.y-e.h/2-26
c.fillStyle='#fff'
c.fillRect(e.x-tw/2,by-12,tw,24)
c.fillStyle='#111'
c.fillText(e.sayText,e.x,by)
}
if(this.exts.length)this.hk('world',c)
if(at)this.atmo2(c,at)
if(this.exts.length){c.setTransform(1,0,0,1,0,0);c.globalAlpha=1;this.hk('screen',c);this.hk('post',c)}
this.drawHud(c)
}
atmo2(c,a){
const W=this.w,H=this.h
c.save()
c.setTransform(1,0,0,1,0,0)
if(a.tint&&+a.tintAmt>0){c.globalCompositeOperation='multiply';c.globalAlpha=Math.min(1,+a.tintAmt);c.fillStyle=a.tint;c.fillRect(0,0,W,H)}
if(a.haze&&+a.hazeAmt>0){c.globalCompositeOperation='source-over';c.globalAlpha=1;const g=c.createLinearGradient(0,H*(1-Math.min(1,+a.hazeAmt)*0.9),0,H);g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(1,a.haze);c.globalAlpha=Math.min(1,+a.hazeAmt);c.fillStyle=g;c.fillRect(0,0,W,H)}
if(+a.vignette>0){c.globalCompositeOperation='source-over';c.globalAlpha=1;const g=c.createRadialGradient(W/2,H/2,Math.min(W,H)*0.3,W/2,H/2,Math.hypot(W,H)*0.6);g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(1,'rgba(0,0,0,'+Math.min(1,+a.vignette)+')');c.fillStyle=g;c.fillRect(0,0,W,H)}
c.restore()
}
draw3(){
const c=this.ctx,r=this.r3
c.setTransform(1,0,0,1,0,0)
c.globalAlpha=1
c.clearRect(0,0,this.w,this.h)
if(!r)return
r.sync(this)
const cam=this.camera
cam.x+=this.shx*0.05;cam.y+=this.shy*0.05
r.env(this.bg,this.scene.atmo)
if(this.exts.length)this.hk('render3',r)
r.render(cam,this.bg,this.scene.atmo)
if(this.exts.length){this.hk('screen',c);this.hk('post',c)}
cam.x-=this.shx*0.05;cam.y-=this.shy*0.05
if(!this.editor&&this.scene.mouseLook){c.fillStyle='rgba(255,255,255,0.85)';c.fillRect(this.w/2-1,this.h/2-8,2,16);c.fillRect(this.w/2-8,this.h/2-1,16,2)}
this.drawHud(c)
}
drawHud(c){
const W=this.w,H=this.h
c.setTransform(1,0,0,1,0,0)
c.globalAlpha=1
if(this.lb>0.01){
const bh=H*0.11*this.lb
c.fillStyle='#000'
c.fillRect(0,0,W,bh)
c.fillRect(0,H-bh,W,bh)
}
if(this.cs&&this.cs.caption){
c.font='600 20px Inter,system-ui,sans-serif'
c.textAlign='center'
c.textBaseline='middle'
const tw=c.measureText(this.cs.caption).width+36,y=H-H*0.11*this.lb-34
c.fillStyle='rgba(0,0,0,0.7)'
c.fillRect(W/2-tw/2,y-20,tw,40)
c.fillStyle='#fff'
c.fillText(this.cs.caption,W/2,y)
}
if(this.cs&&this.cs.skip){
c.font='12px Inter,system-ui,sans-serif'
c.textAlign='right'
c.textBaseline='bottom'
c.fillStyle='rgba(255,255,255,0.55)'
c.fillText('Esc to skip',W-12,H-8)
}
if(this.hudLines.size){
c.font='600 18px Inter,system-ui,sans-serif'
c.textAlign='left'
c.textBaseline='top'
let y=10+H*0.11*this.lb
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
let s=16
while(s*z<12)s*=2
c.lineWidth=1/z
c.strokeStyle='rgba(255,255,255,0.045)'
c.beginPath()
for(let x=Math.floor(l/s)*s;x<=r;x+=s){c.moveTo(x,t);c.lineTo(x,b)}
for(let y=Math.floor(t/s)*s;y<=b;y+=s){c.moveTo(l,y);c.lineTo(r,y)}
c.stroke()
const S=s*4
c.strokeStyle='rgba(255,255,255,0.09)'
c.beginPath()
for(let x=Math.floor(l/S)*S;x<=r;x+=S){c.moveTo(x,t);c.lineTo(x,b)}
for(let y=Math.floor(t/S)*S;y<=b;y+=S){c.moveTo(l,y);c.lineTo(r,y)}
c.stroke()
c.strokeStyle='rgba(255,77,106,0.28)'
c.beginPath();c.moveTo(l,0);c.lineTo(r,0);c.stroke()
c.strokeStyle='rgba(61,220,132,0.28)'
c.beginPath();c.moveTo(0,t);c.lineTo(0,b);c.stroke()
}
loop(ts){
if(!this.running)return
if(!this.xrLoop)this.raf=requestAnimationFrame(this.loop)
let ft=(ts-this.last)/1000
this.last=ts
if(ft>0.1)ft=0.1
this.acc+=ft
let n=0
const sm=!this.editor&&this.project.settings.smooth!==false
if(this.paused){this.acc=0;if(this.stepReq){this.stepReq=false;this.update(STEP)}}
while(!this.paused&&this.acc>=STEP&&n<5){if(sm)this.snap();this.update(STEP);this.acc-=STEP;n++}
if(n===5)this.acc=0
if(sm&&!this.paused&&this.snapN>0)this.drawLerp(this.acc/STEP);else this.draw()
this.fc++
this.ft+=ft
if(this.ft>=0.5){
this.fps=Math.round(this.fc/this.ft)
this.fc=0
this.ft=0
if(root.parent&&root.parent!==root)root.parent.postMessage({vue:1,type:'fps',v:this.fps,n:this.entities.length},'*')
}
}
snap(){
const es=this.entities,c=this.camera,n=++this.snapN
for(let i=0;i<es.length;i++){const e=es[i];e._px=e._x;e._py=e._y;e._pz=e._z;e._pr=e.rot;e._pn=n}
this.pcam=[c.x,c.y,c.z,c.tx,c.ty,c.tz]
}
drawLerp(a){
const es=this.entities,n=this.snapN,c=this.camera,lim=this.is3d?16:65536,L=this.lerpL||(this.lerpL=[])
L.length=0
for(let i=0;i<es.length;i++){
const e=es[i]
if(e._pn!==n||!e.alive)continue
const dx=e._x-e._px,dy=e._y-e._py,dz=e._z-e._pz
if(dx===0&&dy===0&&dz===0&&e.rot===e._pr)continue
if(dx*dx+dy*dy+dz*dz>lim)continue
L.push(e)
e._qx=e._x;e._qy=e._y;e._qz=e._z;e._qr=e.rot
e._x=e._px+dx*a;e._y=e._py+dy*a;e._z=e._pz+dz*a
const dr=e.rot-e._pr
if(dr<180&&dr>-180)e.rot=e._pr+dr*a
}
const p=this.pcam,q=[c.x,c.y,c.z,c.tx,c.ty,c.tz],ks=['x','y','z','tx','ty','tz']
if(p)for(let i=0;i<6;i++){const d=q[i]-p[i];if(d*d<lim)c[ks[i]]=p[i]+d*a}
try{this.draw()}finally{
for(let i=0;i<L.length;i++){const e=L[i];e._x=e._qx;e._y=e._qy;e._z=e._qz;e.rot=e._qr}
for(let i=0;i<6;i++)c[ks[i]]=q[i]
}
}
initExt(){
const ids=this.project.extensions||[],cfg=this.project.extConfig||{}
this.exts=[]
for(const id of ids){
const d=EXT.list[id]
if(!d){this.log('warn','Extension '+id+' is not installed');continue}
const x={d,cfg:Object.assign({},d.defaults||{},cfg[id]||{}),s:{}}
this.exts.push(x)
if(d.api)try{const a=d.api(this,x.cfg,x.s);if(a)this.vue[d.ns||id]=a}catch(e){this.err(e)}
}
for(const x of this.exts)if(x.d.init)try{x.d.init(this,x.cfg,x.s)}catch(e){this.err(e)}
}
hk(n,a,b){
const xs=this.exts
for(let i=0;i<xs.length;i++){const x=xs[i],f=x.d[n];if(f)try{f(this,x.cfg,x.s,a,b)}catch(e){this.err(e)}}
}
async start(){
await this.loadAssets()
this.loadScene(this.project.startScene)
this.bind()
this.initExt()
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
if(this.cs&&k==='escape'){this.skipCs();return}
if(ev.repeat||this.keys.has(k))return
this.keys.add(k)
this.pressedSet.add(k)
this.audio()
if(this.cs&&this.cs.lock)return
this.fireAll('key:'+k)
this.fireAll('keypress',k)
}
const ku=ev=>{
const k=norm(ev.key)
this.keys.delete(k)
if(this.cs&&this.cs.lock)return
this.fireAll('keyup:'+k)
}
const bl=()=>{this.keys.clear()}
const md=ev=>{
pos(ev)
this.updateMouse()
this.mouse.down=true
this.mouse.clicked=true
this.audio()
if(this.cs&&this.cs.lock)return
if(this.is3d){
if(this.scene.mouseLook&&!locked()&&cv.requestPointerLock)cv.requestPointerLock()
const px=locked()?this.w/2:this.mouse.sx,py=locked()?this.h/2:this.mouse.sy
const e=this.r3?this.r3.pick(px,py,this.w,this.h):null
if(e&&e.alive)this.fire(e,'click')
return
}
const o=this.order
for(let i=o.length-1;i>=0;i--){
const e=o[i]
if(!e.alive||!e.hd||!e.hd.click)continue
if(e.shape==='tilemap'?e.tileAt(this.mouse.x,this.mouse.y)>=0:Math.abs(this.mouse.x-e.x)*2<=e.w&&Math.abs(this.mouse.y-e.y)*2<=e.h){this.fire(e,'click');break}
}
}
const locked=()=>root.document&&root.document.pointerLockElement===cv
const mm=ev=>{
if(locked()){this.mouse.dx+=ev.movementX||0;this.mouse.dy+=ev.movementY||0}else pos(ev)
}
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
const TILE_COLORS=['#5aa469','#8b5e3c','#7a7f8c','#b5523b','#3f7fbf','#a57c4b','#e0c97f','#9aa3b0']
const api={Game,Entity,STEP,norm,toLocal,mat,eul,EASE,pk,OFF,shapeLoops,SHAPES2,pcNorm,pcPreset,PC_PRESETS,PC_TYPE,PC_COMMON}
if(typeof module!=='undefined'&&module.exports)module.exports=api
else root.VueRuntime=api
})(typeof window!=='undefined'?window:globalThis);
