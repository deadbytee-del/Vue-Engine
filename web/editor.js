(function(){
const host=window.host
const $=s=>document.querySelector(s)
const $$=s=>Array.from(document.querySelectorAll(s))
const ic=(n,s)=>VueIcon(n,s)
const h=(tag,a,...c)=>{
const e=document.createElement(tag)
if(a)for(const k in a){
const v=a[k]
if(v==null)continue
if(k==='class')e.className=v
else if(k==='text')e.textContent=v
else if(k==='html')e.innerHTML=v
else if(k.slice(0,2)==='on')e.addEventListener(k.slice(2),v)
else e.setAttribute(k,v)
}
for(const x of c)if(x!=null&&x!==false)e.append(x)
return e
}
const icons=root=>{for(const s of(root||document).querySelectorAll('[data-ic]')){if(s.firstChild)continue;s.innerHTML=ic(s.dataset.ic,+s.dataset.s||16)}}
const D=Math.PI/180
const clone=o=>JSON.parse(JSON.stringify(o))
const num=v=>{const n=parseFloat(v);return isNaN(n)?0:n}
const r2=v=>Math.round(v*1000)/1000
const ls={get:(k,d)=>{try{const v=localStorage.getItem(k);return v==null?d:JSON.parse(v)}catch(x){return d}},set:(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(x){}}}
const SHAPE_IC={tilemap:'map',rect:'square',circle:'circle',sprite:'image',text:'text',box:'box',sphere:'sphere',cylinder:'cylinder',cone:'cone',plane:'plane',light:'light'}
const K2=[['rect','Rectangle'],['circle','Circle'],['sprite','Sprite'],['text','Text'],['tilemap','Tilemap']]
const K3=[['box','Box'],['sphere','Sphere'],['cylinder','Cylinder'],['plane','Plane'],['light','Light']]
const S={project:null,path:null,sceneId:null,sel:null,hover:null,tab:'scene',undo:[],redo:[],cam:{x:0,y:0,zoom:1},cam3:{tx:0,ty:1,tz:0,yaw:30,pitch:28,dist:20},drag:null,space:false,tool:'move',snapOn:ls.get('vue.snap',true),gridOn:ls.get('vue.grid',true),skyOn:ls.get('vue.sky',false),snap2:ls.get('vue.snap2',8),snap3:ls.get('vue.snap3',0.5),playing:false,paused:false,game:null,ws:null,ne:null,code:null,dirty:false,savedAt:0,autoAt:0,clip:null,logs:[],lv:{log:true,warn:true,error:true},closed:new Set(ls.get('vue.closed',[])),inputs:{},editing:false,loading:false,tc:null,guides:[],gizmo:[],fly:new Set(),version:'1.0.0',res:'free',lastHtml:''}
const scene=()=>S.project.scenes.find(s=>s.id===S.sceneId)||S.project.scenes[0]
const is3=()=>scene().mode==='3d'
const selData=()=>S.sel?scene().entities.find(e=>e.id===S.sel)||null:null
const entOf=d=>d&&S.game?S.game.entities.find(e=>e.src===d)||null:null
function toast(msg,kind){
const t=h('div',{class:'toast '+(kind||''),html:ic(kind==='ok'?'check':kind==='err'?'err':'info',16)})
t.append(h('span',{text:msg}))
$('#toasts').append(t)
setTimeout(()=>{t.classList.add('out');setTimeout(()=>t.remove(),300)},3000)
}
function dialog(o){
return new Promise(res=>{
const d=$('#dialog'),inp=$('#dInput'),bx=$('#dBtns')
$('#dTitle').textContent=o.title||''
$('#dMsg').textContent=o.msg||''
$('#dMsg').style.display=o.msg?'':'none'
inp.style.display=o.input!=null?'':'none'
inp.value=o.input||''
bx.innerHTML=''
const done=v=>{d.classList.remove('on');document.removeEventListener('keydown',kd,true);res(v)}
const btns=o.buttons||[{label:'Cancel',value:null},{label:'OK',value:true,primary:true}]
for(const b of btns)bx.append(h('button',{class:'btn'+(b.primary?' primary':'')+(b.danger?' danger':''),text:b.label,onclick:()=>done(b.value===true&&o.input!=null?inp.value:b.value)}))
const kd=e=>{
if(e.key==='Escape'){e.stopPropagation();done(null)}
if(e.key==='Enter'){e.stopPropagation();e.preventDefault();const p=btns.find(b=>b.primary);done(p?(p.value===true&&o.input!=null?inp.value:p.value):null)}
}
document.addEventListener('keydown',kd,true)
d.classList.add('on')
setTimeout(()=>{if(o.input!=null){inp.focus();inp.select()}else{const p=bx.querySelector('.primary');if(p)p.focus()}},10)
})
}
function markDirty(){
S.dirty=true
$('#dirty').classList.add('on')
scheduleSave()
status()
}
let saveT=0
function scheduleSave(){
clearTimeout(saveT)
saveT=setTimeout(()=>{ls.set('vue.autosave',{project:S.project,path:S.path});S.autoAt=Date.now();status()},700)
}
function ago(t){
const s=Math.round((Date.now()-t)/1000)
if(s<5)return'just now'
if(s<60)return s+'s ago'
if(s<3600)return Math.floor(s/60)+'m ago'
if(s<86400)return Math.floor(s/3600)+'h ago'
return Math.floor(s/86400)+'d ago'
}
function status(){
if(!S.project)return
const sv=$('#stSave')
sv.classList.toggle('dirty',S.dirty)
sv.querySelector('b').textContent=S.dirty?(S.path?'Unsaved changes':'Not saved to a file yet'):S.savedAt?'Saved · '+ago(S.savedAt):'Saved'
const sc=scene(),d=selData()
$('#stScene').textContent=sc.name+' · '+(is3()?'3D':'2D')+' · '+sc.entities.length+' entities'+(d?' · '+d.name+' selected':'')
$('#stVer').textContent=(S.project.settings.core==='js'||!(window.VWR&&VWR.exports)?'JS core':'VWR core')+' · Vue Engine '+S.version
const e=S.logs.filter(l=>l.level==='error').reduce((a,l)=>a+l.count,0),w=S.logs.filter(l=>l.level==='warn').reduce((a,l)=>a+l.count,0)
$('#stErr').innerHTML=(e?'<span class="e">'+e+' error'+(e>1?'s':'')+'</span>':'')+(w?'<span class="w">'+w+' warning'+(w>1?'s':'')+'</span>':'')
$('#pname').textContent=S.project.name
document.title=S.project.name+(S.dirty?' •':'')+' — Vue Engine'
}
const snapJ=()=>JSON.stringify({s:S.project.scenes,c:S.project.cutscenes||[]})
function snap(){
S.undo.push(snapJ())
if(S.undo.length>80)S.undo.shift()
S.redo=[]
markDirty()
}
function restore(json){
const o=JSON.parse(json)
S.project.scenes=o.s
S.project.cutscenes=o.c
if(!S.project.scenes.find(s=>s.id===S.sceneId))S.sceneId=S.project.scenes[0].id
if(S.sel&&!selData())S.sel=null
reloadScene()
renderAll()
markDirty()
}
function undo(){if(!S.undo.length)return;S.redo.push(snapJ());restore(S.undo.pop());VuePanels.render();toast('Undo')}
function redo(){if(!S.redo.length)return;S.undo.push(snapJ());restore(S.redo.pop());VuePanels.render();toast('Redo')}
function normalize(p){
p.settings=Object.assign({width:960,height:540,pixelArt:true},p.settings||{})
p.assets=p.assets||{}
p.name=p.name||'My Game'
for(const sc of p.scenes){
sc.camera=sc.camera||{x:0,y:0,zoom:1}
sc.entities=sc.entities||[]
sc.mode=sc.mode||'2d'
if(sc.gravity==null)sc.gravity=sc.mode==='3d'?30:1400
if(!sc.bg)sc.bg='#1b2340'
if(sc.mode==='3d'&&!sc.camera3)sc.camera3={x:0,y:8,z:14,tx:0,ty:1,tz:0,fov:70}
}
if(!p.startScene||!p.scenes.find(s=>s.id===p.startScene))p.startScene=p.scenes[0].id
return p
}
function setProject(p,path,dirty){
S.project=normalize(p)
S.path=path||null
S.undo=[]
S.redo=[]
S.sceneId=S.project.startScene
S.sel=null
S.dirty=!!dirty
S.savedAt=path&&!dirty?Date.now():0
$('#dirty').classList.toggle('on',S.dirty)
stopGame()
makeGame()
resetView()
renderAll()
scheduleSave()
if(S.tab==='script')loadScriptView()
}
function makeGame(){
const old=S.game
if(old&&old.r3){
if(S.tc){S.tc.detach();S.tc.dispose();S.tc=null}
old.r3.r.dispose()
old.r3.el.remove()
}
const wrap=$('#cvwrap')
S.game=new VueRuntime.Game({canvas:$('#cv'),project:S.project,editor:true,width:Math.max(200,wrap.clientWidth),height:Math.max(200,wrap.clientHeight)})
S.game.loadAssets().then(()=>{reloadScene();redraw()})
reloadScene()
}
function reloadScene(){
const g=S.game
g.project=S.project
g.pixel=S.project.settings.pixelArt!==false
g.ctx.imageSmoothingEnabled=!g.pixel
g.loadScene(S.sceneId)
if(g.r3)ensureTC()
updateToolbar()
redraw()
}
function ensureTC(){
const g=S.game
if(S.tc||!g.r3||!window.TransformControls)return
const tc=new TransformControls(g.r3.cam,$('#cv'))
tc.setSize(0.9)
g.r3.scene.add(tc)
tc.addEventListener('change',()=>redraw())
tc.addEventListener('dragging-changed',e=>{
if(e.value){snap();S.tcDrag=true}
else{S.tcDrag=false;scheduleSave();syncInspector()}
})
tc.addEventListener('objectChange',()=>{
const m=tc.object,d=selData()
if(!m||!d)return
if(d.shape!=='light'){d.w=r2(Math.max(0.01,m.scale.x));d.d=r2(Math.max(0.01,m.scale.z));if(d.shape!=='plane')d.h=r2(Math.max(0.01,m.scale.y))}
setW(d,{x:m.position.x,y:m.position.y,z:m.position.z,rx:m.rotation.x/D,ry:m.rotation.y/D,rz:m.rotation.z/D})
syncInspector()
})
S.tc=tc
applyTC()
}
function applyTC(){
const tc=S.tc
if(!tc)return
const mode=is3()?{move:'translate',rotate:'rotate',scale:'scale'}[S.tool]:null
if(!mode&&tc.object)tc.detach()
tc.enabled=!!mode
tc.visible=!!mode
if(mode)tc.setMode(mode)
tc.setTranslationSnap(S.snapOn?S.snap3:null)
tc.setRotationSnap(S.snapOn?15*D:null)
tc.setScaleSnap(S.snapOn?0.25:null)
redraw()
}
function resetView(){
const sc=scene()
if(sc.mode==='3d'){
const k=sc.camera3||{}
const dx=(k.x||0)-(k.tx||0),dy=(k.y==null?8:k.y)-(k.ty==null?1:k.ty),dz=(k.z==null?14:k.z)-(k.tz||0)
const dist=Math.hypot(dx,dy,dz)||20
S.cam3={tx:k.tx||0,ty:k.ty==null?1:k.ty,tz:k.tz||0,yaw:Math.atan2(dx,dz)/D,pitch:Math.asin(dy/dist)/D,dist:Math.max(6,dist*1.4)}
}else{const c=sc.camera;S.cam={x:c.x||0,y:c.y||0,zoom:1}}
redraw()
}
let rq=0
function redraw(){if(rq)return;rq=requestAnimationFrame(()=>{rq=0;paint()})}
function tween(from,to,ms,set){
const t0=performance.now()
const step=()=>{const k=Math.min(1,(performance.now()-t0)/ms),e=1-Math.pow(1-k,3);set(e);paint();if(k<1)requestAnimationFrame(step)}
requestAnimationFrame(step)
}
function frameSel(all){
const d=all?null:selData(),es=(d?[d]:scene().entities.filter(e=>!e.prefab)).map(x=>{const e=entOf(x);if(e&&e.shape==='tilemap'){const b=tmRect(e);return{x:(b[0]+b[2])/2,y:(b[1]+b[3])/2,w:b[2]-b[0],h:b[3]-b[1]}}return e||x})
if(!es.length)return
if(is3()){
let x0=1e9,y0=1e9,z0=1e9,x1=-1e9,y1=-1e9,z1=-1e9
for(const e of es){if(e.shape==='light'&&!d)continue;const w=e.shape==='light'?1:e.w,hh=e.shape==='light'?1:e.h,dd=e.shape==='light'?1:e.d;x0=Math.min(x0,e.x-w/2);x1=Math.max(x1,e.x+w/2);y0=Math.min(y0,e.y-hh/2);y1=Math.max(y1,e.y+hh/2);z0=Math.min(z0,e.z-dd/2);z1=Math.max(z1,e.z+dd/2)}
if(x0>x1)return
const c=S.cam3,f={tx:c.tx,ty:c.ty,tz:c.tz,dist:c.dist},t={tx:(x0+x1)/2,ty:(y0+y1)/2,tz:(z0+z1)/2,dist:Math.max(3,Math.hypot(x1-x0,y1-y0,z1-z0)*1.3)}
tween(f,t,220,k=>{for(const q in t)c[q]=f[q]+(t[q]-f[q])*k})
}else{
let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9
for(const e of es){x0=Math.min(x0,e.x-e.w/2);x1=Math.max(x1,e.x+e.w/2);y0=Math.min(y0,e.y-e.h/2);y1=Math.max(y1,e.y+e.h/2)}
const g=S.game,c=S.cam,f={x:c.x,y:c.y,zoom:c.zoom}
const z=Math.min(4,Math.max(0.1,Math.min(g.w/((x1-x0)*1.6||1),g.h/((y1-y0)*1.6||1))))
const t={x:(x0+x1)/2,y:(y0+y1)/2,zoom:z}
tween(f,t,220,k=>{for(const q in t)c[q]=f[q]+(t[q]-f[q])*k})
}
}
function wd(d){return entOf(d)||d}
function byId(id){return scene().entities.find(x=>x.id===id)||null}
function setW(d,p){
const pd=d.parent?byId(d.parent):null,pe=pd?entOf(pd):null
if(!pe){Object.assign(d,p);for(const k in p)d[k]=r2(d[k])}
else{
const cur=wd(d),w={x:cur.x,y:cur.y,z:cur.z,rot:cur.rot,rx:cur.rx,ry:cur.ry,rz:cur.rz}
Object.assign(w,p)
const L=VueRuntime.toLocal(pe,w,is3())
d.x=r2(L.x);d.y=r2(L.y)
if(is3()){d.z=r2(L.z);d.rx=r2(L.rx);d.ry=r2(L.ry);d.rz=r2(L.rz)}else d.rot=r2(L.rot)
}
S.game.refresh()
}
function tmRect(e){
const s=e.cell||32
if(!e.tb)return[e.x,e.y,e.x+s,e.y+s]
return[e.x+e.tb[0]*s,e.y+e.tb[1]*s,e.x+(e.tb[2]+1)*s,e.y+(e.tb[3]+1)*s]
}
function paint(){
const g=S.game
if(!g||S.tab!=='scene'||S.playing)return
if(is3()){paint3();return}
g.camera.x=S.cam.x
g.camera.y=S.cam.y
g.camera.zoom=S.cam.zoom
g.grid_on=S.gridOn
g.bg=scene().bg
g.draw()
const c=g.ctx,z=S.cam.zoom
const sx=x=>(x-S.cam.x)*z+g.w/2,sy=y=>(y-S.cam.y)*z+g.h/2
const sc=scene(),cz=sc.camera.zoom||1,fw=S.project.settings.width/cz,fh=S.project.settings.height/cz
c.setTransform(1,0,0,1,0,0)
c.setLineDash([7,5])
c.strokeStyle='rgba(157,92,255,0.75)'
c.lineWidth=1.5
const fx=sx(sc.camera.x-fw/2),fy=sy(sc.camera.y-fh/2)
c.strokeRect(fx,fy,fw*z,fh*z)
c.setLineDash([])
c.font='600 11px Inter,system-ui,sans-serif'
const lab='Camera  '+S.project.settings.width+' × '+S.project.settings.height,lw=c.measureText(lab).width+14
c.fillStyle='rgba(123,43,217,0.9)'
rr(c,fx,fy-22,lw,18,5);c.fill()
c.fillStyle='#fff'
c.textAlign='left'
c.textBaseline='middle'
c.fillText(lab,fx+7,fy-13)
const hv=S.hover&&S.hover!==S.sel?byId(S.hover):null
if(hv)outline(c,hv,'rgba(157,92,255,0.6)',1)
for(const gl of S.guides){
c.strokeStyle='#ff4d9a'
c.lineWidth=1
c.beginPath()
if(gl.x!=null){c.moveTo(sx(gl.x),0);c.lineTo(sx(gl.x),g.h)}else{c.moveTo(0,sy(gl.y));c.lineTo(g.w,sy(gl.y))}
c.stroke()
}
const d=selData()
if(d){
const W=wd(d)
if(d.parent){const pd=byId(d.parent);if(pd){const P=wd(pd);c.setLineDash([3,4]);c.strokeStyle='rgba(255,211,77,0.55)';c.lineWidth=1;c.beginPath();c.moveTo(sx(P.x),sy(P.y));c.lineTo(sx(W.x),sy(W.y));c.stroke();c.setLineDash([])}}
outline(c,d,'#9d5cff',2)
const cx=sx(W.x),cy=sy(W.y),tm=d.shape==='tilemap'
if(S.tool==='paint'&&tm)VuePanels.overlay(c)
else if(S.tool==='scale'&&!tm){
for(const[hx,hy]of HANDLES){const p=handlePos(d,hx,hy);c.fillStyle='#fff';c.strokeStyle='#7b2bd9';c.lineWidth=1.5;rr(c,p[0]-4,p[1]-4,8,8,2);c.fill();c.stroke()}
}else if(S.tool==='rotate'&&!tm){
const R=rotR(d)
c.strokeStyle='rgba(157,92,255,0.85)';c.lineWidth=2
c.beginPath();c.arc(cx,cy,R,0,Math.PI*2);c.stroke()
const a=(W.rot||0)*D-Math.PI/2
c.fillStyle='#ffd34d';c.beginPath();c.arc(cx+Math.cos(a)*R,cy+Math.sin(a)*R,6,0,Math.PI*2);c.fill()
c.strokeStyle='rgba(255,211,77,0.6)';c.lineWidth=1;c.beginPath();c.moveTo(cx,cy);c.lineTo(cx+Math.cos(a)*R,cy+Math.sin(a)*R);c.stroke()
if(S.drag&&S.drag.k==='rot'){c.fillStyle='#fff';c.font='600 12px Inter';c.textAlign='center';c.fillText(Math.round(W.rot||0)+'°',cx,cy-R-14)}
}else if(S.tool==='move'||(S.tool==='paint'&&!tm)){
arrow(c,cx,cy,cx+64,cy,'#ff4d6a',S.hoverAx==='x')
arrow(c,cx,cy,cx,cy-64,'#3ddc84',S.hoverAx==='y')
c.fillStyle=S.hoverAx==='xy'?'#ffe58a':'rgba(255,211,77,0.85)'
c.fillRect(cx+6,cy-20,14,14)
}
}
$('#zoomLbl').textContent=Math.round(z*100)+'%'
}
function rr(c,x,y,w,hh,r){c.beginPath();c.moveTo(x+r,y);c.arcTo(x+w,y,x+w,y+hh,r);c.arcTo(x+w,y+hh,x,y+hh,r);c.arcTo(x,y+hh,x,y,r);c.arcTo(x,y,x+w,y,r);c.closePath()}
function arrow(c,x0,y0,x1,y1,col,hi){
c.strokeStyle=hi?'#ffe58a':col;c.fillStyle=hi?'#ffe58a':col;c.lineWidth=hi?3:2.5
c.beginPath();c.moveTo(x0,y0);c.lineTo(x1,y1);c.stroke()
const a=Math.atan2(y1-y0,x1-x0)
c.beginPath();c.moveTo(x1+Math.cos(a)*10,y1+Math.sin(a)*10);c.lineTo(x1+Math.cos(a+2.4)*9,y1+Math.sin(a+2.4)*9);c.lineTo(x1+Math.cos(a-2.4)*9,y1+Math.sin(a-2.4)*9);c.closePath();c.fill()
}
const HANDLES=[[-1,-1],[0,-1],[1,-1],[1,0],[1,1],[0,1],[-1,1],[-1,0]]
function corner(d,lx,ly){const W=wd(d),a=(W.rot||0)*D,co=Math.cos(a),si=Math.sin(a);return[W.x+lx*co-ly*si,W.y+lx*si+ly*co]}
function scr(x,y){const g=S.game,z=S.cam.zoom;return[(x-S.cam.x)*z+g.w/2,(y-S.cam.y)*z+g.h/2]}
function handlePos(d,hx,hy){const p=corner(d,hx*d.w/2,hy*d.h/2);return scr(p[0],p[1])}
function rotR(d){return Math.max(28,Math.hypot(d.w,d.h)/2*S.cam.zoom+16)}
function outline(c,d,col,lw){
c.strokeStyle=col;c.lineWidth=lw
if(d.shape==='tilemap'){const e=entOf(d);if(!e)return;const b=tmRect(e),p0=scr(b[0],b[1]),p1=scr(b[2],b[3]);c.strokeRect(p0[0],p0[1],p1[0]-p0[0],p1[1]-p0[1]);return}
const pts=[[-1,-1],[1,-1],[1,1],[-1,1]].map(q=>{const p=corner(d,q[0]*d.w/2,q[1]*d.h/2);return scr(p[0],p[1])})
c.beginPath();pts.forEach((p,i)=>i?c.lineTo(p[0],p[1]):c.moveTo(p[0],p[1]));c.closePath();c.stroke()
}
function paint3(){
const g=S.game,o=S.cam3,sc=scene(),c=g.camera
const cy=o.yaw*D,cp=o.pitch*D
c.tx=o.tx;c.ty=o.ty;c.tz=o.tz
c.x=o.tx+Math.sin(cy)*Math.cos(cp)*o.dist
c.y=o.ty+Math.sin(cp)*o.dist
c.z=o.tz+Math.cos(cy)*Math.cos(cp)*o.dist
c.fov=(sc.camera3&&sc.camera3.fov)||70
g.bg=S.skyOn?sc.bg:'#15121f'
if(g.r3){
g.r3.gridOn=S.gridOn
g.r3.sync(g)
const d=selData(),e=entOf(d)
g.r3.setSelection(e)
const m=e?g.r3.meshOf(e):null
if(S.tc){if(m&&!d.locked){if(S.tc.object!==m)S.tc.attach(m)}else if(S.tc.object)S.tc.detach()}
}
g.draw()
axisGizmo(g)
$('#zoomLbl').textContent=o.dist.toFixed(1)+' m'
}
function axisGizmo(g){
const c=g.ctx,r3=g.r3
if(!r3)return
const cx=g.w-58,cy=58,R=34
c.setTransform(1,0,0,1,0,0)
c.fillStyle='rgba(17,15,25,0.55)'
c.beginPath();c.arc(cx,cy,R+16,0,Math.PI*2);c.fill()
const m=r3.cam.matrixWorldInverse.elements
const ax=[['X',1,0,0,'#ff4d6a'],['Y',0,1,0,'#3ddc84'],['Z',0,0,1,'#4d8dff'],['-X',-1,0,0,'#ff4d6a'],['-Y',0,-1,0,'#3ddc84'],['-Z',0,0,-1,'#4d8dff']]
const pts=ax.map(a=>{const x=m[0]*a[1]+m[4]*a[2]+m[8]*a[3],y=m[1]*a[1]+m[5]*a[2]+m[9]*a[3],z=m[2]*a[1]+m[6]*a[2]+m[10]*a[3];return{a,x:cx+x*R,y:cy-y*R,z}})
pts.sort((p,q)=>p.z-q.z)
S.gizmo=[]
for(const p of pts){
const neg=p.a[0][0]==='-'
if(!neg){c.strokeStyle=p.a[4];c.lineWidth=2;c.beginPath();c.moveTo(cx,cy);c.lineTo(p.x,p.y);c.stroke()}
c.globalAlpha=neg?0.45:1
c.fillStyle=p.a[4]
c.beginPath();c.arc(p.x,p.y,neg?6:9,0,Math.PI*2);c.fill()
c.globalAlpha=1
if(!neg){c.fillStyle='#0a0910';c.font='700 10px Inter';c.textAlign='center';c.textBaseline='middle';c.fillText(p.a[0],p.x,p.y+0.5)}
S.gizmo.push({x:p.x,y:p.y,r:neg?7:10,a:p.a[0]})
}
}
function gizmoHit(px,py){
for(let i=S.gizmo.length-1;i>=0;i--){const q=S.gizmo[i];if(Math.hypot(px-q.x,py-q.y)<=q.r+2)return q.a}
return null
}
function snapView(a){
const c=S.cam3,f={yaw:c.yaw,pitch:c.pitch}
const t={X:[90,0],'-X':[-90,0],Z:[0,0],'-Z':[180,0],Y:[c.yaw,89],'-Y':[c.yaw,-89]}[a]
let ty=t[0]
while(ty-f.yaw>180)ty-=360
while(ty-f.yaw<-180)ty+=360
tween(f,{yaw:ty,pitch:t[1]},240,k=>{c.yaw=f.yaw+(ty-f.yaw)*k;c.pitch=f.pitch+(t[1]-f.pitch)*k})
}
function rel(e){const r=$('#cv').getBoundingClientRect();return[e.clientX-r.left,e.clientY-r.top,r.width,r.height]}
function toWorld(e){const g=S.game,[px,py]=rel(e);return[(px-g.w/2)/S.cam.zoom+S.cam.x,(py-g.h/2)/S.cam.zoom+S.cam.y]}
function pick(wx,wy){
const es=S.game.entities.map((e,i)=>[e,i]).sort((a,b)=>(a[0].z||0)-(b[0].z||0)||a[1]-b[1])
for(let i=es.length-1;i>=0;i--){
const e=es[i][0],d=e.src
if(!d||d.locked)continue
if(e.shape==='tilemap'){if(e.tileAt(wx,wy)>=0)return d;continue}
const a=-(e.rot||0)*D,dx=wx-e.x,dy=wy-e.y,lx=dx*Math.cos(a)-dy*Math.sin(a),ly=dx*Math.sin(a)+dy*Math.cos(a)
if(Math.abs(lx)*2<=Math.abs(e.w)&&Math.abs(ly)*2<=Math.abs(e.h))return d
}
return null
}
const gs=v=>S.snapOn?(is3()?Math.round(v/S.snap3)*S.snap3:Math.round(v/S.snap2)*S.snap2):Math.round(v*100)/100
function gizmoAt2(e,d){
const W=wd(d),[px,py]=rel(e),[cx,cy]=scr(W.x,W.y),tm=d.shape==='tilemap'
if(S.tool==='paint'&&tm)return null
if(S.tool==='scale'&&!tm){for(const[hx,hy]of HANDLES){const p=handlePos(d,hx,hy);if(Math.abs(px-p[0])<=7&&Math.abs(py-p[1])<=7)return{k:'size',hx,hy}}}
if(S.tool==='rotate'&&!tm){const R=rotR(d),dd=Math.hypot(px-cx,py-cy);if(Math.abs(dd-R)<=8)return{k:'rot'}}
if(S.tool==='move'||S.tool==='paint'){
if(px>=cx+4&&px<=cx+22&&py>=cy-22&&py<=cy-4)return{k:'move',ax:'xy'}
if(px>cx+8&&px<cx+76&&Math.abs(py-cy)<=7)return{k:'move',ax:'x'}
if(py<cy-8&&py>cy-76&&Math.abs(px-cx)<=7)return{k:'move',ax:'y'}
}
return null
}
const CURS=['nwse-resize','ns-resize','nesw-resize','ew-resize','nwse-resize','ns-resize','nesw-resize','ew-resize']
function hoverCursor2(e){
const d=selData(),cv=$('#cv')
const pax=S.hoverAx
S.hoverAx=null
if(S.tool==='pan'||S.space){cv.style.cursor='grab';return}
if(d&&S.tool==='paint'&&d.shape==='tilemap'){cv.style.cursor='crosshair';const[wx,wy]=toWorld(e);VuePanels.tileHover(wx,wy);return}
if(d){
const gz=gizmoAt2(e,d)
if(gz){
if(gz.k==='size'){const i=HANDLES.findIndex(q=>q[0]===gz.hx&&q[1]===gz.hy);cv.style.cursor=CURS[i]}
else if(gz.k==='rot')cv.style.cursor='grab'
else{S.hoverAx=gz.ax;cv.style.cursor=gz.ax==='x'?'ew-resize':gz.ax==='y'?'ns-resize':'move'}
if(pax!==S.hoverAx)redraw()
return
}
}
const[wx,wy]=toWorld(e),p=pick(wx,wy)
cv.style.cursor=p?(S.tool==='move'?'move':'pointer'):'default'
const id=p?p.id:null
if(id!==S.hover||pax!==S.hoverAx){S.hover=id;redraw()}
}
function underOf(e,root){let p=e;let n=0;while(p&&n++<64){if(p===root)return true;p=p.par}return false}
function alignGuides(d,nx,ny){
S.guides=[]
if(!S.snapOn||d.shape==='tilemap')return[nx,ny]
const me=entOf(d),th=6/S.cam.zoom,mine={x:[nx-d.w/2,nx,nx+d.w/2],y:[ny-d.h/2,ny,ny+d.h/2]}
let bx=null,by=null
for(const o of S.game.entities){
if(!o.src||o.src.prefab||o.shape==='tilemap'||(me&&underOf(o,me)))continue
const ox=[o.x-o.w/2,o.x,o.x+o.w/2],oy=[o.y-o.h/2,o.y,o.y+o.h/2]
for(let i=0;i<3;i++)for(const v of ox){const df=v-mine.x[i];if(Math.abs(df)<th&&(!bx||Math.abs(df)<Math.abs(bx.df)))bx={df,v}}
for(let i=0;i<3;i++)for(const v of oy){const df=v-mine.y[i];if(Math.abs(df)<th&&(!by||Math.abs(df)<Math.abs(by.df)))by={df,v}}
}
if(bx){nx+=bx.df;S.guides.push({x:bx.v})}
if(by){ny+=by.df;S.guides.push({y:by.v})}
return[nx,ny]
}
function canvasEvents(){
const cv=$('#cv'),wrap=$('#cvwrap')
cv.addEventListener('contextmenu',e=>{
e.preventDefault()
if(S.ctxBlock){S.ctxBlock=false;return}
let hit=null
if(is3()){const[px,py,w,hh]=rel(e);const en=S.game.r3?S.game.r3.pick(px,py,w,hh):null;hit=en?en.src:null}
else{const[wx,wy]=toWorld(e);hit=pick(wx,wy)}
if(hit)select(hit.id)
viewportMenu(e.clientX,e.clientY,hit)
})
cv.addEventListener('pointerdown',e=>{
cv.focus()
closePops()
if(is3()){down3(e);return}
cv.setPointerCapture(e.pointerId)
const[wx,wy]=toWorld(e)
if(e.button===1||e.button===2||S.space||S.tool==='pan'){S.drag={k:'pan',sx:e.clientX,sy:e.clientY,cx:S.cam.x,cy:S.cam.y,btn:e.button};wrap.classList.add('panning');return}
const d=selData()
if(d&&!d.locked){
if(S.tool==='paint'&&d.shape==='tilemap'){VuePanels.tileDown(e,wx,wy);return}
const gz=gizmoAt2(e,d)
if(gz){
snap()
const W=wd(d)
if(gz.k==='size')S.drag={k:'size',d,hx:gz.hx,hy:gz.hy,w0:d.w,h0:d.h,x0:W.x,y0:W.y,r0:W.rot||0}
else if(gz.k==='rot')S.drag={k:'rot',d,r0:W.rot||0,a0:Math.atan2(wy-W.y,wx-W.x)}
else S.drag={k:'move',d,ax:gz.ax,ox:wx-W.x,oy:wy-W.y}
return
}
}
const hit=pick(wx,wy)
if(hit){
select(hit.id)
snap()
const W=wd(hit)
if(S.tool==='rotate'&&hit.shape!=='tilemap')S.drag={k:'rot',d:hit,r0:W.rot||0,a0:Math.atan2(wy-W.y,wx-W.x)}
else S.drag={k:'move',d:hit,ax:'xy',ox:wx-W.x,oy:wy-W.y}
}else select(null)
})
cv.addEventListener('pointermove',e=>{
if(is3()){move3(e);return}
const dr=S.drag
if(!dr){hoverCursor2(e);return}
if(dr.k==='tile'){const[wx,wy]=toWorld(e);VuePanels.tileMove(wx,wy);return}
if(Math.abs(e.movementX)+Math.abs(e.movementY)>0)dr.moved=true
if(dr.k==='pan'){
S.cam.x=dr.cx-(e.clientX-dr.sx)/S.cam.zoom
S.cam.y=dr.cy-(e.clientY-dr.sy)/S.cam.zoom
redraw()
return
}
const[wx,wy]=toWorld(e),d=dr.d,W=wd(d)
if(dr.k==='move'){
let nx=dr.ax==='y'?W.x:gs(wx-dr.ox),ny=dr.ax==='x'?W.y:gs(wy-dr.oy)
if(dr.ax==='xy')[nx,ny]=alignGuides(d,nx,ny)
setW(d,{x:nx,y:ny})
}else if(dr.k==='rot'){
let r=dr.r0+(Math.atan2(wy-W.y,wx-W.x)-dr.a0)/D
if(e.shiftKey||S.snapOn)r=Math.round(r/15)*15
setW(d,{rot:Math.round(((r%360)+540)%360-180)})
}else if(dr.k==='size'){
const a=-dr.r0*D,dx=wx-dr.x0,dy=wy-dr.y0
const lx=dx*Math.cos(a)-dy*Math.sin(a),ly=dx*Math.sin(a)+dy*Math.cos(a)
const alt=e.altKey,ax0=-dr.hx*dr.w0/2,ay0=-dr.hy*dr.h0/2
let w=dr.hx?Math.max(2,gs(alt?Math.abs(lx)*2:Math.abs(lx-ax0))):dr.w0
let hh=dr.hy?Math.max(2,gs(alt?Math.abs(ly)*2:Math.abs(ly-ay0))):dr.h0
if(e.shiftKey&&dr.hx&&dr.hy){const k=Math.max(w/dr.w0,hh/dr.h0);w=Math.round(dr.w0*k);hh=Math.round(dr.h0*k)}
const clx=alt?0:dr.hx?ax0+dr.hx*w/2:0,cly=alt?0:dr.hy?ay0+dr.hy*hh/2:0
const ra=dr.r0*D
d.w=w;d.h=hh
setW(d,{x:dr.x0+clx*Math.cos(ra)-cly*Math.sin(ra),y:dr.y0+clx*Math.sin(ra)+cly*Math.cos(ra)})
}
syncInspector()
redraw()
})
const end=()=>{
if(is3()){up3();return}
if(S.drag&&S.drag.k==='tile'){VuePanels.tileUp();return}
if(S.drag&&S.drag.k==='pan'&&S.drag.moved&&S.drag.btn===2)S.ctxBlock=true
if(S.drag&&S.drag.k!=='pan'){if(!S.drag.moved)S.undo.pop();scheduleSave()}
S.drag=null
S.guides=[]
wrap.classList.remove('panning')
redraw()
}
cv.addEventListener('pointerup',end)
cv.addEventListener('pointercancel',end)
cv.addEventListener('pointerleave',()=>{if(!S.drag&&S.hover){S.hover=null;redraw()}})
cv.addEventListener('wheel',e=>{
e.preventDefault()
if(is3()){const c=S.cam3;c.dist=Math.min(600,Math.max(1,c.dist*(e.deltaY<0?1/1.12:1.12)));redraw();return}
const g=S.game,[px,py]=rel(e),[wx,wy]=toWorld(e)
const z=Math.min(16,Math.max(0.05,S.cam.zoom*(e.deltaY<0?1.12:1/1.12)))
S.cam.zoom=z
S.cam.x=wx-(px-g.w/2)/z
S.cam.y=wy-(py-g.h/2)/z
redraw()
},{passive:false})
new ResizeObserver(()=>{
const w=wrap.clientWidth,hh=wrap.clientHeight
if(S.game&&w>0&&hh>0){S.game.resize(w,hh);redraw()}
}).observe(wrap)
}
function down3(e){
const o=S.cam3,[px,py,w,hh]=rel(e),cv=$('#cv')
const ga=gizmoHit(px,py)
if(ga&&e.button===0){snapView(ga);return}
if(S.tc&&S.tc.axis&&e.button===0)return
cv.setPointerCapture(e.pointerId)
if(e.button===2||(e.button===0&&e.altKey)){S.drag={k:'orbit',sx:e.clientX,sy:e.clientY,yaw:o.yaw,pitch:o.pitch,btn:e.button};startFly();return}
if(e.button===1||S.space||S.tool==='pan'){S.drag={k:'pan3',sx:e.clientX,sy:e.clientY,tx:o.tx,ty:o.ty,tz:o.tz};$('#cvwrap').classList.add('panning');return}
const hit=S.game.r3?S.game.r3.pick(px,py,w,hh):null
if(hit&&hit.src&&!hit.src.locked)select(hit.src.id)
else select(null)
}
function move3(e){
const dr=S.drag
if(!dr)return
const o=S.cam3
if(Math.abs(e.clientX-dr.sx)+Math.abs(e.clientY-dr.sy)>3)dr.moved=true
if(dr.k==='orbit'){
o.yaw=dr.yaw-(e.clientX-dr.sx)*0.35
o.pitch=Math.max(-89,Math.min(89,dr.pitch+(e.clientY-dr.sy)*0.35))
}else if(dr.k==='pan3'){
const k=o.dist*0.0018,dx=e.clientX-dr.sx,dy=e.clientY-dr.sy,cy=o.yaw*D
o.tx=dr.tx-dx*k*Math.cos(cy)
o.tz=dr.tz+dx*k*Math.sin(cy)
o.ty=dr.ty+dy*k
}
redraw()
}
function up3(){
const dr=S.drag
if(dr&&dr.k==='orbit'&&dr.moved&&dr.btn===2)S.ctxBlock=true
S.drag=null
S.fly.clear()
$('#cvwrap').classList.remove('panning')
}
function startFly(){
let last=performance.now()
const loop=()=>{
if(!S.drag||S.drag.k!=='orbit')return
const now=performance.now(),dt=Math.min(0.05,(now-last)/1000)
last=now
if(S.fly.size){
const o=S.cam3,sp=Math.max(4,o.dist*1.2)*dt*(S.fly.has('shift')?3:1),cy=o.yaw*D,cp=o.pitch*D
const fx=-Math.sin(cy)*Math.cos(cp),fy=-Math.sin(cp),fz=-Math.cos(cy)*Math.cos(cp),rx=Math.cos(cy),rz=-Math.sin(cy)
let mx=0,my=0,mz=0
if(S.fly.has('w')){mx+=fx;my+=fy;mz+=fz}
if(S.fly.has('s')){mx-=fx;my-=fy;mz-=fz}
if(S.fly.has('d')){mx+=rx;mz+=rz}
if(S.fly.has('a')){mx-=rx;mz-=rz}
if(S.fly.has('e'))my+=1
if(S.fly.has('q'))my-=1
o.tx+=mx*sp;o.ty+=my*sp;o.tz+=mz*sp
S.drag.moved=true
paint()
}
requestAnimationFrame(loop)
}
requestAnimationFrame(loop)
}
function select(id){
S.sel=id
const d=selData()
if(S.tool==='paint'&&!(d&&d.shape==='tilemap'))S.tool='move'
if(d&&d.shape==='tilemap'&&$('#tiles').classList.contains('on'))S.tool='paint'
updateToolbar()
VuePanels.onSelect()
renderHier()
buildInspector()
redraw()
status()
if(S.tab==='script')loadScriptView()
}
function uniqueName(base){
const names=new Set(scene().entities.map(e=>e.name))
if(!names.has(base))return base
const b=base.replace(/ \d+$/,'')
let i=2
while(names.has(b+' '+i))i++
return b+' '+i
}
function addEntity(kind,asChild){
snap()
const t3=K3.some(k=>k[0]===kind)
const d=t3?VueSample.kinds3[kind]():VueSample.kinds[kind]()
d.name=uniqueName(d.name)
const par=asChild?selData():null
if(par){
d.parent=par.id
d.x=0;d.y=0
if(t3){d.z=0;d.y=d.shape==='light'?2:(par.h||1)/2+(d.h||1)/2}else d.x=(par.w||32)/2+(d.w||32)/2+8
}else if(is3()){
const o=S.cam3
d.x=gs(o.tx);d.z=gs(o.tz)
d.y=d.shape==='light'?Math.max(4,o.ty+4):d.shape==='plane'?0:Math.max(d.h/2,gs(o.ty))
}else if(kind==='tilemap'){d.x=gs(S.cam.x-S.cam.x%32);d.y=gs(S.cam.y-S.cam.y%32)}
else{d.x=gs(S.cam.x);d.y=gs(S.cam.y)}
if(kind==='tilemap'){
if(!S.project.assets['tiles.png'])S.project.assets['tiles.png']={type:'image',data:VuePanels.defaultTileset()}
d.tileset='tiles.png'
d.ts=16
d.tiles={}
for(let x=-6;x<=6;x++){d.tiles[x+',3']=0;d.tiles[x+',4']=1}
}
const es=scene().entities
if(par)es.splice(es.indexOf(par)+subtree(par).length,0,d)
else es.push(d)
S.sel=d.id
if(kind==='tilemap'){S.game.loadAssets().then(()=>{redraw();VuePanels.render()});S.tool='paint';setBTab('tiles')}
reloadScene()
renderAll()
toast('Added '+d.name+(par?' inside '+par.name:''),'ok')
}
function subtree(d){
const es=scene().entities,out=[d],ids=new Set([d.id])
let grew=true
while(grew){grew=false;for(const e of es)if(e.parent&&ids.has(e.parent)&&!ids.has(e.id)){ids.add(e.id);out.push(e);grew=true}}
return out
}
function cloneTree(list,renameRoot){
const map={},out=list.map(x=>clone(x))
for(const c of out){const n=VueSample.uid();map[c.id]=n;c.id=n}
for(const c of out)if(c.parent&&map[c.parent])c.parent=map[c.parent]
if(renameRoot)out[0].name=uniqueName(out[0].name)
return out
}
function dupEntity(){
const d=selData()
if(!d)return
snap()
const cs=cloneTree(subtree(d),true)
if(is3())cs[0].x+=1;else{cs[0].x+=16;cs[0].y+=16}
const es=scene().entities,at=Math.max(...subtree(d).map(x=>es.indexOf(x)))+1
es.splice(at,0,...cs)
S.sel=cs[0].id
reloadScene()
renderAll()
}
function delEntity(){
const d=selData()
if(!d)return
snap()
const kill=new Set(subtree(d))
scene().entities=scene().entities.filter(e=>!kill.has(e))
S.sel=null
reloadScene()
renderAll()
toast('Deleted '+d.name+(kill.size>1?' and '+(kill.size-1)+' child'+(kill.size>2?'ren':''):''))
}
function copyEntity(){const d=selData();if(!d)return;S.clip=subtree(d).map(clone);toast('Copied '+d.name)}
function pasteEntity(){
if(!S.clip)return
snap()
const cs=cloneTree(S.clip,true)
const root=cs[0]
const pd=root.parent&&byId(root.parent)
if(!pd){delete root.parent;if(is3()){root.x=gs(S.cam3.tx);root.z=gs(S.cam3.tz)}else{root.x=gs(S.cam.x);root.y=gs(S.cam.y)}}
scene().entities.push(...cs)
S.sel=root.id
reloadScene()
renderAll()
}
function reparent(d,np,before,after){
if(np&&(np===d||subtree(d).indexOf(np)>=0))return false
const W=wd(d),w={x:W.x,y:W.y,z:W.z,rot:W.rot,rx:W.rx,ry:W.ry,rz:W.rz}
const pe=np?entOf(np):null
if(np)d.parent=np.id;else delete d.parent
const L=pe?VueRuntime.toLocal(pe,w,is3()):w
d.x=r2(L.x);d.y=r2(L.y)
if(is3()){d.z=r2(L.z);d.rx=r2(L.rx||0);d.ry=r2(L.ry||0);d.rz=r2(L.rz||0)}else d.rot=r2(L.rot||0)
const es=scene().entities,tree=subtree(d)
for(const x of tree)es.splice(es.indexOf(x),1)
let at=es.length
if(before)at=es.indexOf(before)
else if(after){const t=subtree(after);at=Math.max(...t.map(x=>es.indexOf(x)))+1}
else if(np){const t=subtree(np);at=Math.max(...t.map(x=>es.indexOf(x)))+1}
es.splice(at,0,...tree)
return true
}
function renameEntity(){
const d=selData()
if(!d)return
const row=$('#hier .item.on')
if(!row)return
const nm=row.querySelector('.nm')
const inp=h('input',{class:'ren',value:d.name})
nm.replaceWith(inp)
inp.focus()
inp.select()
let fin=false
const finish=ok=>{
if(fin)return
fin=true
if(ok&&inp.value.trim()&&inp.value.trim()!==d.name){snap();d.name=inp.value.trim();S.game.refresh()}
renderHier()
buildInspector()
}
inp.addEventListener('keydown',e=>{e.stopPropagation();if(e.key==='Enter')finish(true);if(e.key==='Escape')finish(false)})
inp.addEventListener('blur',()=>finish(true))
inp.addEventListener('pointerdown',e=>e.stopPropagation())
inp.addEventListener('click',e=>e.stopPropagation())
}
function renderAll(){
VuePanels.render()
updateToolbar()
renderScenes()
renderHier()
renderAssets()
buildInspector()
status()
}
function updateToolbar(){
const t=is3()
$('#modeLbl').textContent=t?'3D':'2D'
for(const b of $$('[data-tool]'))b.classList.toggle('on',b.dataset.tool===S.tool)
$('#tSnap').classList.toggle('on',S.snapOn)
$('#tGrid').classList.toggle('on',S.gridOn)
$('#tSky').classList.toggle('on',S.skyOn)
$('#tSky').style.display=t?'':'none'
const sd=selData()
$('#tPaint').style.display=!t&&((sd&&sd.shape==='tilemap')||S.tool==='paint')?'':'none'
const sel=$('#snapSel'),opts=t?[0.1,0.25,0.5,1,2]:[1,4,8,16,32],cur=t?S.snap3:S.snap2
sel.innerHTML=''
for(const o of opts)sel.append(h('option',{value:o,text:t?o+' m':o+' px'}))
sel.value=cur
sel.disabled=!S.snapOn
applyTC()
}
function setTool(t){S.tool=t;updateToolbar();redraw()}
function renderScenes(){
const box=$('#scenes')
box.innerHTML=''
for(const sc of S.project.scenes){
const it=h('div',{class:'item'+(sc.id===S.sceneId?' on':''),onclick:()=>switchScene(sc.id),ondblclick:()=>renameScene(sc),oncontextmenu:e=>{e.preventDefault();sceneMenu(e.clientX,e.clientY,sc)}},
h('span',{class:'ti',html:ic(sc.mode==='3d'?'cube':'square',14)}),
h('span',{class:'nm',text:sc.name}),
sc.id===S.project.startScene?h('span',{class:'ti',title:'Start scene',html:ic('star',13)}):null,
h('span',{class:'scb',text:sc.mode==='3d'?'3D':'2D'}))
box.append(it)
}
}
async function renameScene(sc){
const v=await dialog({title:'Rename scene',input:sc.name,buttons:[{label:'Cancel',value:null},{label:'Rename',value:true,primary:true}]})
if(v&&v.trim()){snap();sc.name=v.trim();renderAll()}
}
function switchScene(id){
if(id===S.sceneId)return
S.sceneId=id
S.sel=null
reloadScene()
resetView()
renderAll()
if(S.tab==='script')loadScriptView()
}
function renderHier(){
const box=$('#hier'),q=$('#hfilter').value.trim().toLowerCase()
box.innerHTML=''
const es=scene().entities,ids=new Set(es.map(e=>e.id)),kids={}
for(const d of es){const p=d.parent&&ids.has(d.parent)?d.parent:'';(kids[p]||(kids[p]=[])).push(d)}
if(!S.collapsed)S.collapsed=new Set()
let shown=0
const rowOf=(d,depth)=>{
shown++
const has=!!(kids[d.id]&&kids[d.id].length),col=S.collapsed.has(d.id)
const eye=h('button',{class:'ib'+(d.visible===false?' keep':''),title:d.visible===false?'Show':'Hide',html:ic(d.visible===false?'eyeoff':'eye',13),onclick:ev=>{ev.stopPropagation();snap();d.visible=d.visible===false;S.game.refresh();renderHier();redraw()}})
const lock=h('button',{class:'ib'+(d.locked?' keep':''),title:d.locked?'Unlock':'Lock in viewport',html:ic('lock',13),onclick:ev=>{ev.stopPropagation();d.locked=!d.locked;markDirty();renderHier();redraw()}})
const chev=h('span',{class:'chv'+(has?'':' none')+(col?' col':''),html:has?ic('chev',12):'',onclick:ev=>{ev.stopPropagation();if(!has)return;if(col)S.collapsed.delete(d.id);else S.collapsed.add(d.id);renderHier()}})
const it=h('div',{class:'item'+(d.id===S.sel?' on':'')+(d.prefab||d.visible===false?' ghost':''),draggable:'true',style:'padding-left:'+(4+depth*14)+'px',title:d.prefab?'Prefab: spawned by scripts, not placed at start':null},
chev,
h('span',{class:'ti',html:ic(SHAPE_IC[d.shape]||'square',14)}),
h('span',{class:'nm',text:d.name}),
d.prefab?h('span',{class:'tagp',text:'prefab'}):null,
d.sound?h('span',{class:'ti',title:'Audio source',html:ic('audio',12)}):null,
d.anims&&Object.keys(d.anims).length?h('span',{class:'ti',title:'Animated',html:ic('film',12)}):null,
d.script?h('span',{class:'ti',title:'Has '+d.script.mode+' script',html:ic(d.script.mode==='blocks'?'blocks':d.script.mode==='nodes'?'nodes':'code',12)}):null,
d.shape!=='tilemap'?h('span',{class:'sw2',style:'background:'+d.color}):null,
h('span',{class:'acts'},lock,eye))
it.addEventListener('click',()=>select(d.id))
it.addEventListener('dblclick',e=>{if(e.target.closest('.chv,.ib'))return;select(d.id);renameEntity()})
it.addEventListener('contextmenu',e=>{e.preventDefault();select(d.id);entityMenu(e.clientX,e.clientY,d)})
it.addEventListener('dragstart',e=>{S.dnd=d;e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('text/plain',d.id)})
it.addEventListener('dragover',e=>{
if(!S.dnd||S.dnd===d||subtree(S.dnd).indexOf(d)>=0)return
e.preventDefault()
e.stopPropagation()
const r=it.getBoundingClientRect(),k=(e.clientY-r.top)/r.height
it.classList.toggle('dropt',k<0.28)
it.classList.toggle('dropb',k>0.72)
it.classList.toggle('dropin',k>=0.28&&k<=0.72)
})
it.addEventListener('dragleave',()=>it.classList.remove('dropb','dropt','dropin'))
it.addEventListener('drop',e=>{
e.preventDefault()
e.stopPropagation()
const src=S.dnd
S.dnd=null
const z=it.classList.contains('dropin')?'in':it.classList.contains('dropt')?'before':'after'
it.classList.remove('dropb','dropt','dropin')
if(!src||src===d)return
snap()
const pd=d.parent?byId(d.parent):null
const ok=z==='in'?reparent(src,d):z==='before'?reparent(src,pd,d):reparent(src,pd,null,d)
if(!ok){S.undo.pop();return}
if(z==='in')S.collapsed.delete(d.id)
S.game.refresh()
renderHier()
buildInspector()
redraw()
if(z==='in')toast(src.name+' is now inside '+d.name,'ok')
})
it.addEventListener('dragend',()=>{S.dnd=null;for(const x of box.querySelectorAll('.item'))x.classList.remove('dropb','dropt','dropin')})
box.append(it)
if(has&&!col&&!q)for(const k of kids[d.id])rowOf(k,depth+1)
}
if(q){for(const d of es)if(d.name.toLowerCase().indexOf(q)>=0||(d.tags||[]).some(t=>t.toLowerCase().indexOf(q)>=0))rowOf(d,0)}
else for(const d of kids['']||[])rowOf(d,0)
if(!shown)box.append(h('div',{class:'hint',style:'padding:10px 8px',text:q?'No entities match "'+q+'"':'Empty scene. Press Shift+A or the + button to add something.'}))
}
function createItems(child){
const t=is3()
const list=(t?K3:K2).filter(k=>!(child&&k[0]==='tilemap')).map(k=>({ic:SHAPE_IC[k[0]],label:k[1],fn:()=>addEntity(k[0],child)}))
return[{head:(child?'Create inside '+selData().name:'Create '+(t?'3D':'2D'))}].concat(list)
}
function entityMenu(x,y,d){
const items=[
{ic:'edit',label:'Rename',kbd:'F2',fn:renameEntity},
{ic:'copy',label:'Duplicate',kbd:'Ctrl+D',fn:dupEntity},
{ic:'copy',label:'Copy',kbd:'Ctrl+C',fn:copyEntity},
{ic:'copy',label:'Paste',kbd:'Ctrl+V',fn:pasteEntity,dis:!S.clip},
{sep:1}]
if(d.shape!=='tilemap')items.push({ic:'child',label:'Add child…',fn:()=>{const r=$('#ctx');showMenu(r,x,y,createItems(true))}})
if(d.parent)items.push({ic:'unlink',label:'Unparent',fn:()=>{snap();reparent(d,null);S.game.refresh();renderHier();buildInspector();redraw()}})
items.push(
{ic:'frame',label:'Frame in view',kbd:'F',fn:()=>{setTab('scene');frameSel()}},
{ic:'script',label:'Edit script',fn:()=>setTab('script')},
{ic:'star',label:d.prefab?'Place in scene (not prefab)':'Make prefab',fn:()=>{snap();d.prefab=!d.prefab;reloadScene();renderAll()}},
{sep:1},
{ic:'trash',label:'Delete',kbd:'Del',fn:delEntity})
showMenu($('#ctx'),x,y,items)
}
function viewportMenu(x,y,d){
const items=createItems()
if(S.clip)items.push({ic:'copy',label:'Paste',kbd:'Ctrl+V',fn:pasteEntity})
if(d)items.push({sep:1},{head:d.name},{ic:'copy',label:'Duplicate',kbd:'Ctrl+D',fn:dupEntity},{ic:'script',label:'Edit script',fn:()=>setTab('script')},{ic:'trash',label:'Delete',kbd:'Del',fn:delEntity})
items.push({sep:1},{ic:'frame',label:'Frame all',kbd:'Shift+F',fn:()=>frameSel(true)})
showMenu($('#ctx'),x,y,items)
}
function sceneMenu(x,y,sc){
showMenu($('#ctx'),x,y,[
{ic:'edit',label:'Rename',fn:()=>renameScene(sc)},
{ic:'copy',label:'Duplicate',fn:()=>{snap();const c=clone(sc);c.id=VueSample.uid();c.name=sc.name+' copy';const mp={};for(const e of c.entities){const n=VueSample.uid();mp[e.id]=n;e.id=n}for(const e of c.entities)if(e.parent)e.parent=mp[e.parent];S.project.scenes.push(c);switchScene(c.id)}},
{ic:'star',label:'Set as start scene',dis:S.project.startScene===sc.id,fn:()=>{S.project.startScene=sc.id;markDirty();renderAll()}},
{sep:1},
{ic:'trash',label:'Delete scene',dis:S.project.scenes.length<2,fn:async()=>{
const ok=await dialog({title:'Delete "'+sc.name+'"?',msg:'Its '+sc.entities.length+' entities go with it. You can undo this.',buttons:[{label:'Cancel',value:null},{label:'Delete',value:1,danger:true,primary:true}]})
if(!ok)return
snap()
const p=S.project
p.scenes.splice(p.scenes.indexOf(sc),1)
if(p.startScene===sc.id)p.startScene=p.scenes[0].id
S.sceneId=p.scenes[0].id
S.sel=null
reloadScene();resetView();renderAll()
}}
])
}
async function addScene(){
const v=await dialog({title:'New scene',msg:'2D scenes use pixels and a flat camera. 3D scenes use meters, lights and a perspective camera.',buttons:[{label:'Cancel',value:null},{label:'2D scene',value:'2d'},{label:'3D scene',value:'3d',primary:true}]})
if(!v)return
snap()
const sc=v==='3d'?VueSample.blank3().scenes[0]:VueSample.blank().scenes[0]
sc.id=VueSample.uid()
sc.name=(v==='3d'?'World ':'Scene ')+(S.project.scenes.length+1)
for(const e of sc.entities)e.id=VueSample.uid()
S.project.scenes.push(sc)
switchScene(sc.id)
}
function renderAssets(){
const box=$('#assets')
box.innerHTML=''
const a=S.project.assets,ks=Object.keys(a)
for(const k of ks){
const im=a[k].type==='image'
const wv=im?null:h('canvas',{class:'wave',width:160,height:160})
const it=h('div',{class:'asset',title:im?k+'\nClick to apply to the selected entity':k+'\nClick to play, click again to stop',onclick:()=>useAsset(k)},
h('div',{class:'at'},im?h('img',{src:a[k].data}):wv,im?null:h('span',{class:'aplay',html:ic(S.preview&&S.preview.k===k?'stop':'play',18)})),
h('span',{text:k}),
h('i',{class:'badge',text:im?'IMG':'SFX'}),
h('button',{class:'ib del',title:'Delete asset',html:ic('trash',12),onclick:ev=>{ev.stopPropagation();delete S.project.assets[k];S.game.loadAssets().then(redraw);renderAssets();markDirty()}}))
box.append(it)
}
requestAnimationFrame(()=>{for(const cv of box.querySelectorAll('canvas.wave'))waveOf(cv,cv.closest('.asset').querySelector('span:not(.aplay)').textContent)})
box.append(h('div',{class:'adrop'},h('span',{html:ic('upload',26)}),h('b',{text:ks.length?'Drop more files here':'No assets yet'}),h('span',{text:'Drag PNG, JPG, GIF, WebP, SVG, WAV, MP3 or OGG anywhere in the window, or'}),h('button',{class:'btn sm',html:ic('folder',14)+'Browse files',onclick:importAssets})))
}
function waveOf(cv,k){
const b=S.game.buffers[k]
const c=cv.getContext('2d')
c.clearRect(0,0,cv.width,cv.height)
if(!b){c.fillStyle='#6b6385';c.font='600 13px Inter';c.textAlign='center';c.fillText('decoding…',cv.width/2,cv.height/2);return}
const d=b.getChannelData(0),n=cv.width,step=Math.max(1,Math.floor(d.length/n)),mid=cv.height/2
c.fillStyle='#9d5cff'
for(let i=0;i<n;i++){let mn=1,mx=-1;for(let j=0;j<step;j+=Math.max(1,step>>5)){const v=d[i*step+j]||0;if(v<mn)mn=v;if(v>mx)mx=v}c.fillRect(i,mid+mn*mid*0.9,1,Math.max(1,(mx-mn)*mid*0.9))}
c.fillStyle='rgba(236,232,246,0.85)';c.font='600 20px JetBrains Mono';c.textAlign='right';c.fillText(b.duration.toFixed(1)+'s',cv.width-8,cv.height-10)
}
async function addAsset(name,type,data){
let nm=name,i=2
while(S.project.assets[nm]&&S.project.assets[nm].data!==data)nm=name.replace(/(\.[^.]*)?$/,'_'+(i++)+'$1')
S.project.assets[nm]={type,data}
await S.game.loadAssets()
renderAssets()
markDirty()
return nm
}
function useAsset(k){
const a=S.project.assets[k]
if(a.type!=='image'){
const was=S.preview&&S.preview.k===k
if(S.preview){S.preview.h.stop();S.preview=null}
if(!was){const hd=S.game.sfx(k,1);S.preview={k,h:hd};const t=setInterval(()=>{if(!S.game.sounds.has(hd)){clearInterval(t);if(S.preview&&S.preview.h===hd){S.preview=null;renderAssets()}}},250)}
renderAssets()
return
}
const d=selData()
if(!d){toast('Select an entity first, then click an image to apply it');return}
snap()
if(!is3()){
d.shape='sprite'
const im=S.game.images[k]
if(im&&im.naturalWidth){const m=Math.min(1,256/Math.max(im.naturalWidth,im.naturalHeight));d.w=Math.round(im.naturalWidth*m);d.h=Math.round(im.naturalHeight*m)}
}
d.image=k
S.game.refresh()
buildInspector()
renderHier()
redraw()
toast('Applied '+k+' to '+d.name,'ok')
}
async function addFiles(files){
if(!files||!files.length)return
let n=0
for(const f of files){
let nm=f.name,i=2
while(S.project.assets[nm])nm=f.name.replace(/(\.[^.]*)?$/,'_'+(i++)+'$1')
S.project.assets[nm]={type:f.type,data:f.data}
n++
}
await S.game.loadAssets()
renderAssets()
redraw()
markDirty()
setBTab('assets')
setTimeout(renderAssets,400)
toast('Imported '+n+' asset'+(n>1?'s':''),'ok')
}
async function importAssets(){addFiles(await host.importAssets())}
function readDropped(list){
const ok=/^(image\/(png|jpe?g|gif|webp|bmp|svg\+xml)|audio\/(wav|x-wav|wave|mpeg|mp3|ogg))$/
return Promise.all(Array.from(list).filter(f=>ok.test(f.type)).map(f=>new Promise(r=>{const fr=new FileReader();fr.onload=()=>r({name:f.name,type:f.type.indexOf('audio')===0?'audio':'image',data:fr.result});fr.readAsDataURL(f)})))
}
function dropEvents(){
let depth=0
const hint=$('#dropHint')
const files=e=>e.dataTransfer&&Array.from(e.dataTransfer.types).indexOf('Files')>=0
window.addEventListener('dragenter',e=>{if(!files(e))return;depth++;if(S.tab==='scene'&&!S.playing)hint.classList.add('on')})
window.addEventListener('dragleave',e=>{if(!files(e))return;depth=Math.max(0,depth-1);if(!depth)hint.classList.remove('on')})
window.addEventListener('dragover',e=>{if(files(e))e.preventDefault()})
window.addEventListener('drop',async e=>{
if(!files(e))return
e.preventDefault()
depth=0
hint.classList.remove('on')
const f=await readDropped(e.dataTransfer.files)
if(f.length)addFiles(f);else toast('Unsupported file type','err')
})
}
function setBTab(t){
for(const b of $$('.btab'))b.classList.toggle('on',b.dataset.btab===t)
for(const id of['console','assets','tiles','anim','cuts'])$('#'+id).classList.toggle('on',t===id)
$('#conTools').classList.toggle('hide',t!=='console')
$('#assetTools').classList.toggle('hide',t!=='assets')
if(S.layout&&S.layout.bh<120)toggleDock(true)
if(t==='tiles'){const d=selData();if(d&&d.shape==='tilemap'&&S.tool!=='paint'){S.tool='paint';updateToolbar();redraw()}}
if(t==='tiles'||t==='anim'||t==='cuts')VuePanels.render(t)
}
function afterEdit(key){
S.game.refresh()
redraw()
if(key==='name'||key==='color'||key==='visible'||key==='prefab'||key==='shape')renderHier()
if(key==='shape'||key==='prefab'||key==='body'||key==='tileset'||key==='anim')buildInspector()
if(key==='tileset'||key==='ts'){S.game.loadAssets().then(redraw);VuePanels.render()}
if(key==='prefab')reloadScene()
status()
}
function card(id,title,icn,body,extra){
const c=h('div',{class:'cardc'+(S.closed.has(id)?' closed':'')})
const hd=h('header',{onclick:()=>{c.classList.toggle('closed');if(c.classList.contains('closed'))S.closed.add(id);else S.closed.delete(id);ls.set('vue.closed',Array.from(S.closed))}},h('span',{class:'cv',html:ic('chev',14)}),h('span',{html:ic(icn,15)}),h('span',{class:'sp',text:title}),extra||null)
const b=h('div',{class:'cbody'})
for(const x of body)if(x)b.append(x)
c.append(hd,b)
return c
}
function row(label,el,scrubKey,d,step){
const l=h('label',{text:label,title:scrubKey?'Drag to scrub '+label:label})
if(scrubKey&&d){l.classList.add('scrub');scrubber(l,d,scrubKey,step)}
return h('div',{class:'fld'},l,el)
}
function scrubber(el,d,key,step){
el.addEventListener('pointerdown',e=>{
e.preventDefault()
el.setPointerCapture(e.pointerId)
snap()
let acc=0
const v0=num(d[key])
const mv=ev=>{
acc+=ev.movementX
const k=ev.shiftKey?0.1:ev.ctrlKey?10:1
let v=v0+acc*step*k
if(key==='alpha')v=Math.min(1,Math.max(0,v))
if(key==='w'||key==='h'||key==='d')v=Math.max(0.01,v)
d[key]=Math.round(v*1000)/1000
S.game.refresh()
syncInspector(true)
redraw()
}
const up=()=>{el.removeEventListener('pointermove',mv);el.removeEventListener('pointerup',up);if(!acc)S.undo.pop();scheduleSave()}
el.addEventListener('pointermove',mv)
el.addEventListener('pointerup',up)
})
}
function edit(key,set){return e=>{if(!S.editing){snap();S.editing=true}set(e.target);afterEdit(key)}}
const done=()=>{S.editing=false}
function field(d,key,type,opts){
let el
if(type==='sel'){
el=h('select')
for(const o of opts){const v=Array.isArray(o)?o[0]:o,t=Array.isArray(o)?o[1]:o;el.append(h('option',{value:v,text:t}))}
el.value=d[key]
el.addEventListener('change',()=>{snap();d[key]=el.value;afterEdit(key)})
}else if(type==='bool'){
el=h('input',{type:'checkbox',class:'sw'})
el.checked=key==='visible'?d[key]!==false:!!d[key]
el.addEventListener('change',()=>{snap();d[key]=el.checked;afterEdit(key)})
}else if(type==='asset'){
el=h('select')
el.append(h('option',{value:'',text:'None'}))
for(const k in S.project.assets)if(S.project.assets[k].type==='image')el.append(h('option',{value:k,text:k}))
el.value=d[key]||''
el.addEventListener('change',()=>{snap();d[key]=el.value;afterEdit(key)})
}else if(type==='col'){
const pick=h('input',{type:'color',value:/^#[0-9a-f]{6}$/i.test(d[key])?d[key]:'#ffffff'})
const chip=h('label',{class:'chipc',style:'background:'+d[key]},pick)
const hex=h('input',{class:'hex',value:d[key],spellcheck:'false'})
const apply=v=>{if(!S.editing){snap();S.editing=true}d[key]=v;chip.style.background=v;afterEdit(key)}
pick.addEventListener('input',()=>{hex.value=pick.value;apply(pick.value)})
pick.addEventListener('change',done)
hex.addEventListener('input',()=>{if(/^#([0-9a-f]{3}){1,2}$/i.test(hex.value)){if(hex.value.length===7)pick.value=hex.value;apply(hex.value)}})
hex.addEventListener('change',done)
el=h('div',{class:'colf'},chip,hex)
}else{
el=h('input',{type:type==='num'?'number':'text',spellcheck:'false'})
if(type==='num')el.step='any'
el.value=type==='tags'?(d[key]||[]).join(', '):d[key]==null?'':d[key]
if(type==='tags')el.placeholder='player, enemy…'
el.addEventListener('input',edit(key,t=>{
if(type==='num')d[key]=key==='alpha'?Math.min(1,Math.max(0,num(t.value))):num(t.value)
else if(type==='tags')d[key]=t.value.split(',').map(s=>s.trim()).filter(Boolean)
else d[key]=t.value
}))
el.addEventListener('change',done)
S.inputs[key]=el
}
return el
}
function vec(d,keys,step,labels){
const box=h('div',{class:'vec',style:'grid-template-columns:repeat('+keys.length+',1fr)'})
keys.forEach((k,i)=>{
const L=labels?labels[i]:['X','Y','Z'][i]
const b=h('b',{text:L.slice(0,1),title:'Drag to scrub'})
const inp=h('input',{type:'number',step:'any',value:r2(d[k]||0)})
S.inputs[k]=inp
inp.addEventListener('input',edit(k,t=>{let v=num(t.value);if(k==='w'||k==='h'||k==='d')v=Math.max(0.01,v);d[k]=v}))
inp.addEventListener('change',done)
scrubber(b,d,k,step)
box.append(h('div',{class:'ax '+(['X','Y','Z'].indexOf(L)>=0?L:'W')},b,inp))
})
return box
}
function syncInspector(all){
const d=selData()
if(!d)return
for(const k of['x','y','z','w','h','d','rot','rx','ry','rz','alpha','z','fontSize','gravityScale']){
const el=S.inputs[k]
if(el&&(all||document.activeElement!==el))el.value=r2(d[k]||0)
}
}
function buildInspector(){
const box=$('#insp')
box.innerHTML=''
S.inputs={}
const d=selData()
$('#inspTitle').textContent=d?'Inspector':'Scene & Project'
if(!d){sceneSettings(box);return}
const t3=is3()
box.append(card('ent',d.name,SHAPE_IC[d.shape]||'square',[
row('Name',field(d,'name','text')),
row('Tags',field(d,'tags','tags')),
row('Prefab',field(d,'prefab','bool')),
d.prefab?h('div',{class:'hint',text:'Prefabs are hidden at start and appear when a script calls vue.spawn("'+d.name+'").'}):null
]))
const pd=d.parent?byId(d.parent):null,lp=pd?'Local position':'Position',lr=pd?'Local rotation':'Rotation'
if(pd)box.append(h('div',{class:'phint',html:ic('child',13)},h('span',{text:'Inside '}),h('b',{text:pd.name,class:'lnk',onclick:()=>select(pd.id)}),h('span',{text:'. Moves with its parent.'}),h('button',{class:'ib',title:'Unparent',html:ic('unlink',13),onclick:()=>{snap();reparent(d,null);S.game.refresh();renderAll();redraw()}})))
if(d.shape==='tilemap'){tilemapInspector(box,d);return}
const tf=t3?[
row(lp,vec(d,['x','y','z'],0.05)),
row(lr,vec(d,['rx','ry','rz'],1)),
d.shape==='light'?row('Range',field(d,'w','num'),'w',d,0.1):row('Scale',d.shape==='plane'?vec(d,['w','d'],0.02,['X','Z']):vec(d,['w','h','d'],0.02))
]:[
row(lp,vec(d,['x','y'],1)),
row('Size',vec(d,['w','h'],1,['W','H'])),
row(lr,field(d,'rot','num'),'rot',d,1),
row('Layer',field(d,'z','num'),'z',d,0.1)
]
box.append(card('tf','Transform','move',tf))
const shapes=t3?[['box','Box'],['sphere','Sphere'],['cylinder','Cylinder'],['cone','Cone'],['plane','Plane'],['light','Point light']]:[['rect','Rectangle'],['circle','Circle'],['sprite','Sprite'],['text','Text']]
const look=[row('Shape',field(d,'shape','sel',shapes)),row('Color',field(d,'color','col'))]
if(!t3&&d.shape==='sprite')look.push(row('Image',field(d,'image','asset')))
if(t3&&d.shape!=='light')look.push(row('Texture',field(d,'image','asset')))
if(d.shape==='text'){look.push(row('Text',field(d,'text','text')),row('Font size',field(d,'fontSize','num'),'fontSize',d,0.5))}
look.push(row(d.shape==='light'?'Intensity':'Opacity',field(d,'alpha','num'),'alpha',d,0.01))
look.push(row('Visible',field(d,'visible','bool')))
box.append(card('look',t3&&d.shape==='light'?'Light':'Appearance','palette',look))
if(!t3&&d.anims&&Object.keys(d.anims).length){
const an=Object.keys(d.anims)
box.append(card('anim','Animation','film',[
row('Default',field(d,'anim','sel',an.map(n=>[n,n+' ('+(d.anims[n].frames||[]).length+' frames)']))),
h('button',{class:'btn sm',html:ic('film',13)+'Open animation editor',onclick:()=>setBTab('anim')})
]))
}
if(d.sound!=null){
const au=Object.keys(S.project.assets).filter(k=>S.project.assets[k].type==='audio')
const sel=h('select')
sel.append(h('option',{value:'',text:au.length?'Choose a sound…':'Import audio in Assets'}))
for(const k of au)sel.append(h('option',{value:k,text:k}))
sel.value=d.sound||''
sel.addEventListener('change',()=>{snap();d.sound=sel.value;afterEdit('sound');renderHier()})
if(d.soundVol==null)d.soundVol=1
box.append(card('audio','Audio Source','audio',[
row('Sound',sel),
row('Volume',field(d,'soundVol','num'),'soundVol',d,0.01),
row('Loop',field(d,'soundLoop','bool')),
row('Play on start',field(d,'soundAuto','bool')),
h('div',{class:'row2'},h('button',{class:'btn sm',html:ic('play',13)+'Preview',onclick:()=>{if(d.sound){S.game.stopSounds();S.game.sfx(d.sound,d.soundVol)}}}),h('button',{class:'btn sm',html:ic('stop',13)+'Stop',onclick:()=>S.game.stopSounds()})),
h('div',{class:'hint',style:'margin-top:8px',text:'Scripts can call self.playSound() and self.stopSound().'})
],h('button',{class:'ib',title:'Remove',html:ic('x',13),onclick:e=>{e.stopPropagation();snap();delete d.sound;delete d.soundVol;delete d.soundLoop;delete d.soundAuto;buildInspector();renderHier()}})))
}
if(d.body&&d.body!=='none'){
const ph=[row('Body',field(d,'body','sel',[['static','Static: walls, floors'],['dynamic','Dynamic: falls, collides'],['trigger','Trigger: detects touches'],['none','None']]))]
if(d.body==='dynamic')ph.push(row('Gravity',field(d,'gravityScale','num'),'gravityScale',d,0.05))
box.append(card('phys','Physics Body','physics',ph,h('button',{class:'ib',title:'Remove',html:ic('x',13),onclick:e=>{e.stopPropagation();snap();d.body='none';afterEdit('body')}})))
}
if(d.script){
const m=d.script.mode
box.append(card('scr','Script','script',[
h('div',{class:'scard'},h('span',{class:'badge',html:ic(m==='blocks'?'blocks':m==='nodes'?'nodes':'code',12)+(m==='blocks'?'Blocks':m==='nodes'?'Nodes':'Code')}),h('span',{style:'flex:1'}),h('button',{class:'btn sm primary',html:ic('edit',13)+'Open',onclick:()=>setTab('script')})),
h('div',{class:'hint',style:'margin-top:8px',text:'Only the '+m+' version runs. Switch modes in the Script workspace.'})
],h('button',{class:'ib',title:'Remove script',html:ic('x',13),onclick:async e=>{e.stopPropagation();const ok=await dialog({title:'Remove script from '+d.name+'?',msg:'All Blocks, Nodes and Code for this entity are deleted. You can undo this.',buttons:[{label:'Cancel',value:null},{label:'Remove',value:1,danger:true,primary:true}]});if(ok){snap();d.script=null;buildInspector();renderHier()}}})))
}
const add=h('button',{class:'addc',html:ic('plus',14)+'Add Component',onclick:()=>{
const r=add.getBoundingClientRect(),items=[]
if(!d.body||d.body==='none')items.push({head:'Physics'},{ic:'physics',label:'Static body',fn:()=>{snap();d.body='static';afterEdit('body')}},{ic:'physics',label:'Dynamic body',fn:()=>{snap();d.body='dynamic';afterEdit('body')}},{ic:'physics',label:'Trigger',fn:()=>{snap();d.body='trigger';afterEdit('body')}})
if(!d.script)items.push({head:'Behavior'},{ic:'blocks',label:'Blocks script',fn:()=>newScript(d,'blocks')},{ic:'nodes',label:'Node graph',fn:()=>newScript(d,'nodes')},{ic:'code',label:'TypeScript',fn:()=>newScript(d,'code')})
if(d.sound==null||(!t3&&!d.anims))items.push({head:'Media'})
if(d.sound==null)items.push({ic:'audio',label:'Audio source',fn:()=>{snap();d.sound='';d.soundVol=1;d.soundLoop=false;d.soundAuto=true;buildInspector();renderHier()}})
if(!t3&&(!d.anims||!Object.keys(d.anims).length))items.push({ic:'film',label:'Sprite animation',fn:()=>setBTab('anim')})
items.push({head:'Hierarchy'},{ic:'child',label:'Child entity…',fn:()=>{const rr=add.getBoundingClientRect();showMenu($('#ctx'),rr.left,rr.bottom+4,createItems(true),rr.width)}})
if(!items.length)items.push({head:'All components added'})
showMenu($('#ctx'),r.left,r.bottom+4,items,r.width)
}})
box.append(add)
}
function tilemapInspector(box,d){
const e=entOf(d)
const im=Object.keys(S.project.assets).filter(k=>S.project.assets[k].type==='image')
box.append(card('tf','Transform','move',[row('Origin',vec(d,['x','y'],1)),row('Layer',field(d,'z','num'),'z',d,0.1)]))
box.append(card('tm','Tilemap','map',[
row('Tileset',field(d,'tileset','sel',[['','Colors only']].concat(im.map(k=>[k,k])))),
row('Tile px',field(d,'ts','num'),'ts',d,1),
row('Cell size',field(d,'cell','num'),'cell',d,1),
row('Solid',field(d,'solid','bool')),
h('div',{class:'hint',text:(e&&e.tiles?e.tiles.size:0)+' tiles. Solid tiles block dynamic bodies and trigger "touching" events.'}),
h('button',{class:'btn sm primary',html:ic('brush',13)+'Paint tiles',onclick:()=>{setTool('paint');setBTab('tiles')}})
]))
if(d.script){const m=d.script.mode;box.append(card('scr','Script','script',[h('div',{class:'scard'},h('span',{class:'badge',text:m}),h('span',{style:'flex:1'}),h('button',{class:'btn sm primary',html:ic('edit',13)+'Open',onclick:()=>setTab('script')}))]))}
else box.append(h('button',{class:'addc',html:ic('plus',14)+'Add script',onclick:e=>{const r=e.currentTarget.getBoundingClientRect();showMenu($('#ctx'),r.left,r.bottom+4,[{ic:'blocks',label:'Blocks script',fn:()=>newScript(d,'blocks')},{ic:'nodes',label:'Node graph',fn:()=>newScript(d,'nodes')},{ic:'code',label:'TypeScript',fn:()=>newScript(d,'code')}],r.width)}}))
}
function newScript(d,mode){
snap()
d.script={mode,code:mode==='code'?VueDTS.TEMPLATE:'',blocks:null,nodes:null}
buildInspector()
renderHier()
setTab('script')
}
function sceneSettings(box){
const sc=scene(),p=S.project
const bind=(o,key,type,after)=>{
if(type==='col')return field(o,key,'col')
const el=h('input',{type:type==='num'?'number':type==='bool'?'checkbox':'text'})
if(type==='bool')el.className='sw'
if(type==='num')el.step='any'
if(type==='bool')el.checked=!!o[key]
else el.value=o[key]==null?'':o[key]
const fn=()=>{if(!S.editing){snap();S.editing=true}o[key]=type==='bool'?el.checked:type==='num'?num(el.value):el.value;if(after)after();redraw();status()}
el.addEventListener('input',fn)
el.addEventListener('change',()=>{if(type==='bool')fn();done()})
return el
}
const ms=h('select')
for(const m of[['2d','2D: pixels, flat camera'],['3d','3D: meters, perspective']])ms.append(h('option',{value:m[0],text:m[1]}))
ms.value=sc.mode||'2d'
ms.addEventListener('change',()=>{
snap()
sc.mode=ms.value
if(sc.mode==='3d'&&!sc.camera3)sc.camera3={x:0,y:8,z:14,tx:0,ty:1,tz:0,fov:70}
if(sc.mode==='3d'&&sc.gravity>200)sc.gravity=30
if(sc.mode==='2d'&&sc.gravity<200)sc.gravity=1400
reloadScene();resetView();renderAll()
})
const scf=[row('Name',bind(sc,'name','text',renderScenes)),row('Mode',ms),row('Background',bind(sc,'bg','col')),row('Gravity',bind(sc,'gravity','num',()=>{S.game.gravity=sc.gravity}))]
if(sc.mode==='3d'){
const k=sc.camera3
scf.push(h('div',{class:'hint',text:'Start camera. Scripts can take over with vue.follow().'}))
scf.push(row('Camera at',h('div',{class:'vec',style:'grid-template-columns:repeat(3,1fr)'},axIn(k,'x','X'),axIn(k,'y','Y'),axIn(k,'z','Z'))))
scf.push(row('Looks at',h('div',{class:'vec',style:'grid-template-columns:repeat(3,1fr)'},axIn(k,'tx','X'),axIn(k,'ty','Y'),axIn(k,'tz','Z'))))
scf.push(row('Field of view',bind(k,'fov','num')))
scf.push(row('Mouse look',bind(sc,'mouseLook','bool')))
scf.push(h('button',{class:'btn sm',style:'margin-bottom:8px',html:ic('target',13)+'Use current view',onclick:()=>{snap();const c=S.game.camera;Object.assign(k,{x:r2(c.x),y:r2(c.y),z:r2(c.z),tx:r2(c.tx),ty:r2(c.ty),tz:r2(c.tz)});buildInspector();toast('Start camera set from viewport','ok')}}))
}else{
scf.push(row('Camera at',h('div',{class:'vec',style:'grid-template-columns:repeat(2,1fr)'},axIn(sc.camera,'x','X'),axIn(sc.camera,'y','Y'))))
scf.push(row('Zoom',bind(sc.camera,'zoom','num')))
}
box.append(card('scene','Scene','scene',scf))
const ss=h('select')
for(const s of p.scenes)ss.append(h('option',{value:s.id,text:s.name}))
ss.value=p.startScene
ss.addEventListener('change',()=>{p.startScene=ss.value;markDirty();renderScenes()})
box.append(card('proj','Project','settings',[
row('Title',bind(p,'name','text',status)),
row('Resolution',h('div',{class:'vec',style:'grid-template-columns:repeat(2,1fr)'},axIn(p.settings,'width','W'),axIn(p.settings,'height','H'))),
row('Pixel art',bind(p.settings,'pixelArt','bool',()=>{S.game.pixel=p.settings.pixelArt;S.game.ctx.imageSmoothingEnabled=!S.game.pixel})),
row('Start scene',ss),
row('Engine core',(()=>{const c=h('select');c.append(h('option',{value:'vwr',text:'VWR (WebAssembly, fastest)'}),h('option',{value:'js',text:'JavaScript'}));c.value=p.settings.core==='js'?'js':'vwr';c.addEventListener('change',()=>{snap();p.settings.core=c.value;status()});return c})()),
h('div',{class:'hint',text:window.VWR&&VWR.exports?'VWR runs physics in a C++ and Rust core compiled to WebAssembly. Same results as JavaScript, about 1.5 to 2x faster on big scenes.':'VWR is not available here, so JavaScript runs physics.'})
]))
box.append(h('div',{class:'hint',style:'padding:4px',text:'Select an entity to edit it. Shift+A adds one, Ctrl+P finds anything.'}))
}
function axIn(o,k,L){
const b=h('b',{text:L})
const inp=h('input',{type:'number',step:'any',value:o[k]==null?0:o[k]})
inp.addEventListener('input',()=>{if(!S.editing){snap();S.editing=true}o[k]=num(inp.value);redraw()})
inp.addEventListener('change',done)
b.addEventListener('pointerdown',e=>{
e.preventDefault();b.setPointerCapture(e.pointerId);snap()
let acc=0;const v0=num(o[k]),st=is3()?0.05:1
const mv=ev=>{acc+=ev.movementX;o[k]=r2(v0+acc*st*(ev.shiftKey?0.1:1));inp.value=o[k];redraw()}
const up=()=>{b.removeEventListener('pointermove',mv);b.removeEventListener('pointerup',up);scheduleSave()}
b.addEventListener('pointermove',mv);b.addEventListener('pointerup',up)
})
return h('div',{class:'ax '+(['X','Y','Z'].indexOf(L)>=0?L:'W')},b,inp)
}
function ensureBlockly(){
if(S.ws)return
S.ws=Blockly.inject($('#blk'),{toolbox:S.toolbox,renderer:'zelos',theme:VueBlocks.theme(Blockly),grid:{spacing:28,length:2,colour:'#1f1a2c',snap:true},zoom:{controls:true,wheel:true,startScale:0.85,maxScale:2,minScale:0.35,pinch:true},trashcan:true,move:{scrollbars:true,drag:true,wheel:false},sounds:false,media:window.VUE_CDN&&VUE_CDN.blocklyMedia||'../node_modules/blockly/media/'})
S.ws.addChangeListener(ev=>{
if(ev.isUiEvent||S.loading)return
const d=selData()
if(d&&d.script&&d.script.mode==='blocks'){d.script.blocks=Blockly.serialization.workspaces.save(S.ws);markDirty()}
})
}
function ensureNodes(){
if(S.ne)return
S.ne=new VueNodeEditor($('#nodes'),VueNodes.defs,VueNodes.CAT_COLORS,g=>{
const d=selData()
if(d&&d.script&&d.script.mode==='nodes'){d.script.nodes=g;markDirty()}
})
}
let monacoP=null
function loadMonaco(){
if(monacoP)return monacoP
monacoP=new Promise(res=>{
if(typeof require==='undefined'||!require.config){res(null);return}
try{
const base=window.VUE_CDN&&VUE_CDN.monaco||new URL('../node_modules/monaco-editor/min/',location.href).href
window.MonacoEnvironment={getWorkerUrl:()=>'data:text/javascript;charset=utf-8,'+encodeURIComponent("self.MonacoEnvironment={baseUrl:'"+base+"'};importScripts('"+base+"vs/base/worker/workerMain.js');")}
require.config({paths:{vs:base+'vs'}})
require(['vs/editor/editor.main'],()=>res(window.monaco),()=>res(null))
}catch(x){res(null)}
})
return monacoP
}
async function ensureCode(){
if(S.code)return
const m=await loadMonaco()
if(S.code)return
const onChange=v=>{
if(S.loading)return
const d=selData()
if(d&&d.script&&d.script.mode==='code'){d.script.code=v;markDirty()}
}
if(m){
const ts=m.languages.typescript
ts.typescriptDefaults.setCompilerOptions({target:ts.ScriptTarget.ES2020,lib:['es2020'],allowNonTsExtensions:true,module:ts.ModuleKind.CommonJS,noEmit:true,strict:false})
ts.typescriptDefaults.addExtraLib(VueDTS.dts,'file:///vue.d.ts')
m.editor.defineTheme('vue',{base:'vs-dark',inherit:true,rules:[{token:'keyword',foreground:'c792ff'},{token:'string',foreground:'ff9de2'},{token:'number',foreground:'3ddc84'},{token:'comment',foreground:'6b6385',fontStyle:'italic'},{token:'type',foreground:'7dd3fc'},{token:'identifier',foreground:'ece8f6'}],colors:{'editor.background':'#0a0910','editor.foreground':'#ece8f6','editor.lineHighlightBackground':'#16131f','editor.lineHighlightBorder':'#00000000','editorLineNumber.foreground':'#4a4262','editorLineNumber.activeForeground':'#9d5cff','editor.selectionBackground':'#7b2bd966','editor.inactiveSelectionBackground':'#7b2bd933','editorCursor.foreground':'#b98aff','editorIndentGuide.background1':'#1d1929','editorWidget.background':'#171422','editorWidget.border':'#3a3050','editorSuggestWidget.background':'#171422','editorSuggestWidget.border':'#3a3050','editorSuggestWidget.selectedBackground':'#7b2bd9','editorHoverWidget.background':'#171422','editorHoverWidget.border':'#3a3050','scrollbarSlider.background':'#2a233880','scrollbarSlider.hoverBackground':'#3a3050'}})
const model=m.editor.createModel('','typescript',m.Uri.parse('file:///script.ts'))
const ed=m.editor.create($('#code'),{model,theme:'vue',minimap:{enabled:false},fontSize:14,fontFamily:"'JetBrains Mono',Consolas,monospace",fontLigatures:true,automaticLayout:true,scrollBeyondLastLine:false,tabSize:2,padding:{top:14},smoothScrolling:true,cursorBlinking:'smooth',cursorSmoothCaretAnimation:'on',renderLineHighlight:'all',bracketPairColorization:{enabled:true}})
model.onDidChangeContent(()=>onChange(model.getValue()))
S.code={set:v=>{S.loading=true;model.setValue(v);S.loading=false},layout:()=>ed.layout()}
}else{
const ta=h('textarea',{spellcheck:'false',style:'width:100%;height:100%;background:#0a0910;color:#ece8f6;border:0;border-radius:0;padding:14px;font:14px var(--mono);resize:none;outline:0;tab-size:2'})
$('#code').append(ta)
ta.addEventListener('input',()=>onChange(ta.value))
ta.addEventListener('keydown',e=>{if(e.key==='Tab'){e.preventDefault();const s=ta.selectionStart;ta.setRangeText('\t',s,ta.selectionEnd,'end');onChange(ta.value)}})
S.code={set:v=>{S.loading=true;ta.value=v;S.loading=false},layout:()=>{}}
}
}
function hasContent(s,m){
if(m==='blocks')return!!(s.blocks&&s.blocks.blocks&&s.blocks.blocks.blocks&&s.blocks.blocks.blocks.length)
if(m==='nodes')return!!(s.nodes&&s.nodes.nodes&&s.nodes.nodes.length)
return!!(s.code&&s.code.trim())
}
function crumb(d){
const c=$('#crumb')
c.innerHTML=''
c.append(h('span',{html:ic('scene',14)}),h('span',{text:scene().name}))
if(d){c.append(h('span',{html:ic('chevr',13)}),h('span',{html:ic(SHAPE_IC[d.shape]||'square',14)}),h('b',{text:d.name}))
if(d.script)c.append(h('span',{html:ic('chevr',13)}),h('span',{text:d.script.mode==='blocks'?'Blocks':d.script.mode==='nodes'?'Node graph':'script.ts'}))}
}
function loadScriptView(){
const d=selData()
for(const id of['blk','nodes','code'])$('#'+id).classList.remove('on')
crumb(d)
const em=$('#sempty')
const hasS=d&&d.script
em.classList.toggle('on',!hasS)
$('.modes').style.visibility=hasS?'':'hidden'
if(!hasS){
const box=em.querySelector('.empty')
box.innerHTML=''
if(!d)box.append(h('span',{html:ic('script',40)}),h('h3',{text:'No entity selected'}),h('p',{text:'Pick an entity in the Hierarchy to give it behavior with Blocks, Nodes or Code.'}),h('button',{class:'btn',html:ic('scene',14)+'Go to Scene',onclick:()=>setTab('scene')}))
else box.append(h('span',{html:ic('sparkles',40)}),h('h3',{text:d.name+' has no behavior yet'}),h('p',{text:'Choose how to build it. Blocks and Nodes can be converted to Code later.'}),h('div',{style:'display:flex;gap:8px'},h('button',{class:'btn',html:ic('blocks',14)+'Blocks',onclick:()=>newScript(d,'blocks')}),h('button',{class:'btn',html:ic('nodes',14)+'Nodes',onclick:()=>newScript(d,'nodes')}),h('button',{class:'btn primary',html:ic('code',14)+'Code',onclick:()=>newScript(d,'code')})))
return
}
showMode(d.script.mode,true)
}
async function pickMode(m){
const d=selData()
if(!d||!d.script||d.script.mode===m)return
const s=d.script,cur=s.mode
if(hasContent(s,cur)&&!hasContent(s,m)){
const btns=[{label:'Cancel',value:null}]
if(m==='code')btns.push({label:'Start empty',value:'empty'},{label:'Convert to Code',value:'convert',primary:true})
else btns.push({label:'Switch',value:'switch',primary:true})
const v=await dialog({title:'Switch '+d.name+' to '+(m==='code'?'Code':m==='nodes'?'Nodes':'Blocks')+'?',msg:m==='code'?'Convert turns your '+cur+' into equivalent code you can keep editing. Start empty keeps your '+cur+' saved, but only the code runs.':'Your '+(cur==='code'?'code stays':cur+' stay')+' saved, but only one mode runs at a time.',buttons:btns})
if(!v)return
snap()
if(v==='convert'){
const r=await VueCompiler.compileScript(s,compileEnv())
s.code=r.code.replace(/\n{2,}/g,'\n')
toast('Converted to Code','ok')
}
if(m==='code'&&!s.code)s.code=VueDTS.TEMPLATE
}else snap()
showMode(m)
}
async function showMode(m,quiet){
const d=selData()
if(!d||!d.script)return
const s=d.script
s.mode=m
for(const b of $$('[data-mode]'))b.classList.toggle('on',b.dataset.mode===m)
const map={blocks:'blk',nodes:'nodes',code:'code'}
for(const k in map)$('#'+map[k]).classList.toggle('on',k===m)
crumb(d)
if(m==='blocks'){
ensureBlockly()
S.loading=true
Blockly.Events.disable()
S.ws.clear()
if(s.blocks)Blockly.serialization.workspaces.load(s.blocks,S.ws)
const tops=S.ws.getTopBlocks(true).map(b=>b.getBoundingRectangle())
let ov=false
for(let i=0;i<tops.length&&!ov;i++)for(let j=i+1;j<tops.length;j++){const a=tops[i],b=tops[j];if(a.left<b.right&&b.left<a.right&&a.top<b.bottom&&b.top<a.bottom){ov=true;break}}
if(ov){S.ws.cleanUp();s.blocks=Blockly.serialization.workspaces.save(S.ws)}
Blockly.Events.enable()
S.loading=false
Blockly.svgResize(S.ws)
}else if(m==='nodes'){
ensureNodes()
if(!s.nodes)s.nodes={nid:1,nodes:[],links:[]}
S.ne.load(s.nodes)
}else{
await ensureCode()
if(selData()===d&&d.script.mode==='code'){S.code.set(s.code||'');S.code.layout()}
}
if(!quiet){renderHier();buildInspector()}
}
function setTab(t){
S.tab=t
for(const b of $$('.ws button'))b.classList.toggle('on',b.dataset.tab===t)
$('#viewScene').classList.toggle('on',t==='scene')
$('#viewScript').classList.toggle('on',t==='script')
if(t==='scene'){
const w=$('#cvwrap').clientWidth,hh=$('#cvwrap').clientHeight
if(w>0&&hh>0)S.game.resize(w,hh)
redraw()
}
if(t==='script')loadScriptView()
}
function compileEnv(){return{Blockly:window.Blockly,gen:Blockly.JavaScript,blocks:VueBlocks,nodes:VueNodes,transpile:s=>host.transpile(s)}}
async function build(preview){
const r=await VueCompiler.compileProject(S.project,compileEnv())
const proj=preview?Object.assign({},S.project,{_preview:preview}):S.project
for(const e of r.errors){const i=e.indexOf(': ');log('error',i>0?e.slice(i+2):e,i>0?e.slice(0,i):'')}
const rt=await host.runtimeSource()
const three=S.project.scenes.some(s=>s.mode==='3d')?await host.threeSource():''
return{html:VuePlayer.html(proj,r.scripts,rt,S.project.name,three),errors:r.errors}
}
async function play(preview){
if(S.playing){stopGame();if(typeof preview!=='string')return}
if($('#clearPlay').checked)clearLog()
const{html,errors}=await build(typeof preview==='string'?preview:null)
S.lastHtml=html
S.playing=true
S.paused=false
document.body.classList.add('playing')
$('#playLayer').classList.add('on')
transport()
log('info','Playing '+S.project.name+(errors.length?' with '+errors.length+' script error'+(errors.length>1?'s':''):''))
const f=$('#frame')
f.onload=()=>f.focus()
f.srcdoc=html
fitPlay()
}
function stopGame(){
const f=$('#frame')
f.onload=null
f.srcdoc=''
$('#fps').textContent=''
const was=S.playing
S.playing=false
S.paused=false
document.body.classList.remove('playing')
$('#playLayer').classList.remove('on')
transport()
if(was){setTab(S.tab);redraw()}
}
function pauseGame(){
if(!S.playing)return
S.paused=!S.paused
$('#frame').contentWindow.postMessage({vue:1,cmd:S.paused?'pause':'resume'},'*')
transport()
if(!S.paused)$('#frame').focus()
}
function stepGame(){
if(!S.playing)return
S.paused=true
$('#frame').contentWindow.postMessage({vue:1,cmd:'step'},'*')
transport()
}
function transport(){
const p=S.playing
$('#bPlay').classList.toggle('hide',p)
$('#bPause').disabled=!p
$('#bPause').classList.toggle('on',S.paused)
$('#bStep').disabled=!p
$('#bStop').disabled=!p
$('#pill').classList.toggle('paused',S.paused)
$('#pill .live').lastChild.textContent=S.paused?'Paused':'Playing'
$('#pPause').innerHTML=ic(S.paused?'play':'pause',16)
}
function fitPlay(){
const box=$('#playBox'),f=$('#frame'),W=box.clientWidth,H=box.clientHeight
if(S.res==='free'){f.style.width='100%';f.style.height='100%';return}
const[w,hh]=S.res.split('x').map(Number),k=Math.min(W/w,H/hh)
f.style.width=Math.floor(w*k)+'px'
f.style.height=Math.floor(hh*k)+'px'
}
function clearLog(){S.logs=[];renderLog();status()}
function log(level,text,src){
const last=S.logs[S.logs.length-1]
if(last&&last.level===level&&last.text===String(text)&&last.src===(src||'')){last.count++;last.t=new Date()}
else S.logs.push({level,text:String(text),src:src||'',t:new Date(),count:1})
if(S.logs.length>500)S.logs.shift()
renderLog()
status()
}
let logRq=0
function renderLog(){
if(logRq)return
logRq=requestAnimationFrame(()=>{
logRq=0
const c=$('#console'),q=$('#cfilter').value.trim().toLowerCase()
const cnt={log:0,warn:0,error:0}
for(const l of S.logs)cnt[l.level==='info'?'log':l.level]+=l.count
$('#cLog').textContent=cnt.log
$('#cWarn').textContent=cnt.warn
$('#cErr').textContent=cnt.error
$('#cErr').parentNode.classList.toggle('has',cnt.error>0)
$('#cWarn').parentNode.classList.toggle('has',cnt.warn>0)
const atEnd=c.scrollTop+c.clientHeight>=c.scrollHeight-20
c.innerHTML=''
for(const l of S.logs){
const lv=l.level==='info'?'log':l.level
if(!S.lv[lv])continue
if(q&&(l.text+' '+l.src).toLowerCase().indexOf(q)<0)continue
const r=h('div',{class:'cl '+l.level,html:ic(l.level==='error'?'err':l.level==='warn'?'alert':'info',14)})
r.append(h('span',{class:'msg',text:l.text}))
if(l.count>1)r.append(h('span',{class:'cnt',text:'×'+l.count}))
if(l.src)r.append(h('span',{class:'src',text:l.src,title:'Select '+l.src,onclick:()=>goEntity(l.src)}))
r.append(h('time',{text:l.t.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit',second:'2-digit'})}))
c.append(r)
}
if(!c.children.length)c.append(h('div',{class:'hint',style:'padding:12px',text:S.logs.length?'No messages match the filters.':'Messages from your game appear here. Try vue.log("hi") in a script.'}))
if(atEnd)c.scrollTop=c.scrollHeight
})
}
function goEntity(name){
for(const sc of S.project.scenes){
const d=sc.entities.find(e=>e.name===name)
if(d){
if(S.playing)stopGame()
if(sc.id!==S.sceneId){S.sceneId=sc.id;reloadScene();resetView();renderAll()}
select(d.id)
if(d.script)setTab('script')
return
}
}
toast('No entity named '+name,'err')
}
function closePops(){for(const p of $$('.pop'))p.classList.remove('on');for(const b of $$('.mb'))b.classList.remove('on');S.menuOpen=null}
function showMenu(el,x,y,items,minW){
closePops()
el.innerHTML=''
el.style.minWidth=(minW||230)+'px'
for(const it of items){
if(!it)continue
if(it.sep){el.append(h('div',{class:'msep'}));continue}
if(it.head){el.append(h('div',{class:'mh',text:it.head}));continue}
const m=h('div',{class:'mi'+(it.dis?' dis':''),html:ic(it.ic||'chevr',15)})
m.append(h('span',{text:it.label}))
if(it.kbd)m.append(h('kbd',{text:it.kbd}))
m.addEventListener('click',()=>{closePops();if(it.fn)it.fn()})
el.append(m)
}
el.classList.add('on')
el.style.left='0px'
el.style.top='0px'
const r=el.getBoundingClientRect()
el.style.left=Math.max(4,Math.min(x,innerWidth-r.width-8))+'px'
el.style.top=Math.max(4,Math.min(y,innerHeight-r.height-8))+'px'
}
function recent(){return ls.get('vue.recent',[])}
function menus(){
const rec=recent().slice(0,6).map(r=>({ic:'file',label:r.name+'  ·  '+r.path.split(/[\\/]/).pop(),fn:()=>openPath(r.path)}))
return{
file:[{ic:'sparkles',label:'New project…',kbd:'Ctrl+N',fn:()=>showHub('new')},{ic:'folder',label:'Open…',kbd:'Ctrl+O',fn:open},rec.length?{head:'Recent'}:null].concat(rec,[{sep:1},{ic:'save',label:'Save',kbd:'Ctrl+S',fn:()=>save(false)},{ic:'save',label:'Save as…',kbd:'Ctrl+Shift+S',fn:()=>save(true)},{ic:'export',label:'Port game…',kbd:'Ctrl+E',fn:openPort},{sep:1},{ic:'home',label:'Project hub',fn:()=>showHub('new')}]),
edit:[{ic:'undo',label:'Undo',kbd:'Ctrl+Z',fn:undo,dis:!S.undo.length},{ic:'redo',label:'Redo',kbd:'Ctrl+Y',fn:redo,dis:!S.redo.length},{sep:1},{ic:'copy',label:'Copy',kbd:'Ctrl+C',fn:copyEntity,dis:!S.sel},{ic:'copy',label:'Paste',kbd:'Ctrl+V',fn:pasteEntity,dis:!S.clip},{ic:'copy',label:'Duplicate',kbd:'Ctrl+D',fn:dupEntity,dis:!S.sel},{ic:'edit',label:'Rename',kbd:'F2',fn:renameEntity,dis:!S.sel},{ic:'trash',label:'Delete',kbd:'Del',fn:delEntity,dis:!S.sel},{sep:1},{ic:'plus',label:'Add entity…',kbd:'Shift+A',fn:()=>palette('create ')},{ic:'scene',label:'New scene…',fn:addScene},{sep:1},{ic:'command',label:'Command palette',kbd:'Ctrl+P',fn:()=>palette('')}],
view:[{ic:'scene',label:'Scene workspace',kbd:'Ctrl+1',fn:()=>setTab('scene')},{ic:'script',label:'Script workspace',kbd:'Ctrl+2',fn:()=>setTab('script')},{sep:1},{ic:'grid',label:(S.gridOn?'Hide':'Show')+' grid',kbd:'G',fn:toggleGrid},{ic:'magnet',label:(S.snapOn?'Disable':'Enable')+' snapping',fn:toggleSnap},{ic:'frame',label:'Frame selection',kbd:'F',fn:()=>frameSel()},{ic:'frame',label:'Frame all',kbd:'Shift+F',fn:()=>frameSel(true)},{ic:'target',label:'Reset camera',fn:resetView},{sep:1},{ic:'terminal',label:'Console',fn:()=>setBTab('console')},{ic:'assets',label:'Assets',fn:()=>setBTab('assets')},{ic:'map',label:'Tile painter',fn:()=>setBTab('tiles')},{ic:'film',label:'Animation editor',fn:()=>setBTab('anim')},{ic:'video',label:'Cutscene editor',fn:()=>setBTab('cuts')},{ic:'layers',label:'Reset layout',fn:resetLayout}],
help:[{ic:'keyboard',label:'Keyboard shortcuts',kbd:'?',fn:showKeys},{ic:'book',label:'Learn Vue Engine',fn:()=>showHub('learn')},{sep:1},{ic:'info',label:'About Vue Engine',fn:()=>dialog({title:'Vue Engine '+S.version,msg:'A 2D and 3D game creation engine with Blocks, Nodes and TypeScript. Icons by Lucide (ISC), 3D by three.js (MIT), Blocks by Blockly (Apache 2.0), code editor by Monaco (MIT), fonts Inter and JetBrains Mono (OFL).',buttons:[{label:'Close',value:1,primary:true}]})}]
}
}
function wireMenus(){
for(const b of $$('.mb')){
const op=()=>{const r=b.getBoundingClientRect();showMenu($('#menu'),r.left,r.bottom+4,menus()[b.dataset.menu]);b.classList.add('on');S.menuOpen=b.dataset.menu}
b.addEventListener('click',e=>{e.stopPropagation();if(S.menuOpen===b.dataset.menu)closePops();else op()})
b.addEventListener('mouseenter',()=>{if(S.menuOpen&&S.menuOpen!==b.dataset.menu)op()})
}
document.addEventListener('pointerdown',e=>{if(!(e.target.closest&&e.target.closest('.pop,.mb')))closePops()},true)
}
function commands(){
const C=[
['New project','sparkles',()=>showHub('new'),'Ctrl+N'],['Open project','folder',open,'Ctrl+O'],['Save','save',()=>save(false),'Ctrl+S'],['Save as','save',()=>save(true),'Ctrl+Shift+S'],['Port game (HTML, web, PWA, desktop)','export',openPort,'Ctrl+E'],
['Play','play',play,'Ctrl+Enter'],['Stop','stop',stopGame,'Esc'],['Undo','undo',undo,'Ctrl+Z'],['Redo','redo',redo,'Ctrl+Y'],
['Scene workspace','scene',()=>setTab('scene'),'Ctrl+1'],['Script workspace','script',()=>setTab('script'),'Ctrl+2'],
['Toggle grid','grid',toggleGrid,'G'],['Toggle snapping','magnet',toggleSnap,''],['Frame selection','frame',()=>frameSel(),'F'],['Frame all','frame',()=>frameSel(true),'Shift+F'],
['Pan tool','hand',()=>setTool('pan'),'Q'],['Move tool','move',()=>setTool('move'),'W'],['Rotate tool','rotate',()=>setTool('rotate'),'E'],['Scale tool','scale',()=>setTool('scale'),'R'],
['New scene','scene',addScene,''],['Tile painter','map',()=>setBTab('tiles'),'B'],['Animation editor','film',()=>setBTab('anim'),''],['Cutscene editor','video',()=>setBTab('cuts'),''],['Add audio source','audio',()=>{const d=selData();if(d&&d.sound==null){snap();d.sound='';d.soundVol=1;d.soundAuto=true;buildInspector()}},''],['Import assets','upload',importAssets,''],['Clear console','trash',clearLog,''],['Reset layout','layers',resetLayout,''],['Keyboard shortcuts','keyboard',showKeys,'?'],['Project hub','home',()=>showHub('new'),'']
].map(c=>({label:c[0],ic:c[1],fn:c[2],kbd:c[3],kind:'Command'}))
const cr=(is3()?K3:K2).map(k=>({label:'Create '+k[1],ic:SHAPE_IC[k[0]],fn:()=>{setTab('scene');addEntity(k[0])},kind:'Create'}))
const en=[]
for(const sc of S.project.scenes)for(const d of sc.entities)en.push({label:d.name,ic:SHAPE_IC[d.shape]||'square',kind:sc.name,fn:()=>{if(sc.id!==S.sceneId)switchScene(sc.id);select(d.id);if(S.tab==='scene')frameSel()}})
const scn=S.project.scenes.map(sc=>({label:'Open scene: '+sc.name,ic:'scene',kind:'Scene',fn:()=>{setTab('scene');switchScene(sc.id)}}))
const as=Object.keys(S.project.assets).map(k=>({label:'Asset: '+k,ic:S.project.assets[k].type==='image'?'image':'music',kind:'Asset',fn:()=>{setBTab('assets');useAsset(k)}}))
return cr.concat(C,en,scn,as)
}
function fuzzy(q,s){
q=q.toLowerCase();s=s.toLowerCase()
if(!q)return 1
const i=s.indexOf(q)
if(i>=0)return 100-i
let j=0,sc=0
for(const ch of s){if(ch===q[j]){j++;sc++}if(j===q.length)return sc}
return 0
}
function palette(init){
const p=$('#palette'),inp=$('#palIn'),list=$('#palList')
const all=commands()
let cur=0,items=[]
const mark=()=>{Array.from(list.children).forEach((x,i)=>x.classList.toggle('on',i===cur));const o=list.children[cur];if(o)o.scrollIntoView({block:'nearest'})}
const close=()=>{p.classList.remove('on');inp.onkeydown=null;inp.oninput=null}
const run=i=>{const c=items[i];close();if(c)c.fn()}
const fill=()=>{
const q=inp.value.trim()
items=all.map(c=>({c,s:fuzzy(q,c.label)})).filter(x=>x.s>0).sort((a,b)=>b.s-a.s).slice(0,60).map(x=>x.c)
cur=0
list.innerHTML=''
items.forEach((c,i)=>{
const m=h('div',{class:'mi'+(i===0?' on':''),html:ic(c.ic,15)})
m.append(h('span',{text:c.label}),h('em',{text:c.kind}))
if(c.kbd)m.append(h('kbd',{text:c.kbd}))
m.addEventListener('click',()=>run(i))
m.addEventListener('mousemove',()=>{if(cur!==i){cur=i;mark()}})
list.append(m)
})
if(!items.length)list.append(h('div',{class:'hint',style:'padding:14px',text:'Nothing found'}))
}
inp.value=init||''
inp.oninput=fill
inp.onkeydown=e=>{
e.stopPropagation()
if(e.key==='ArrowDown'){cur=Math.min(items.length-1,cur+1);mark();e.preventDefault()}
else if(e.key==='ArrowUp'){cur=Math.max(0,cur-1);mark();e.preventDefault()}
else if(e.key==='Enter'){run(cur);e.preventDefault()}
else if(e.key==='Escape')close()
}
p.onpointerdown=e=>{if(e.target===p)close()}
p.classList.add('on')
fill()
setTimeout(()=>{inp.focus();inp.setSelectionRange(inp.value.length,inp.value.length)},0)
}
const KEYS=[['Play / stop','Ctrl+Enter'],['Save','Ctrl+S'],['Save as','Ctrl+Shift+S'],['Open','Ctrl+O'],['New project','Ctrl+N'],['Port game','Ctrl+E'],['Command palette','Ctrl+P'],['Undo / redo','Ctrl+Z / Ctrl+Y'],['Copy / paste','Ctrl+C / Ctrl+V'],['Duplicate','Ctrl+D'],['Delete','Del'],['Rename','F2'],['Add entity','Shift+A'],['Pan / Move / Rotate / Scale','Q / W / E / R'],['Paint tiles (tilemap selected)','B, Shift erases, Alt picks'],['Make child','Drag onto middle of a row'],['Frame selection / all','F / Shift+F'],['Toggle grid','G'],['Nudge','Arrows (+Shift)'],['Pan 2D view','Space+drag, MMB'],['Orbit 3D view','RMB or Alt+LMB'],['Fly in 3D','Hold RMB + WASD QE'],['Snap 3D view','Click axis gizmo'],['Fine / coarse scrub','Shift / Ctrl + drag label'],['Scene / Script workspace','Ctrl+1 / Ctrl+2'],['Add node','Right-click or Space'],['Stop game','Esc'],['Shortcuts','?']]
function showKeys(){
const l=$('#keyList')
l.innerHTML=''
for(const k of KEYS)l.append(h('div',null,h('span',{text:k[0]}),h('kbd',{text:k[1]})))
$('#keys').classList.add('on')
}
function toggleGrid(){S.gridOn=!S.gridOn;ls.set('vue.grid',S.gridOn);updateToolbar();redraw()}
function toggleSnap(){S.snapOn=!S.snapOn;ls.set('vue.snap',S.snapOn);updateToolbar()}
async function thumb(project,w,hh){
w=w||480;hh=hh||270
const sc=project.scenes.find(s=>s.id===project.startScene)||project.scenes[0]
const wrap=h('div',{style:'position:fixed;left:-20000px;top:0;width:'+w+'px;height:'+hh+'px'})
const cv=h('canvas')
wrap.append(cv)
document.body.append(wrap)
try{
const g=new VueRuntime.Game({canvas:cv,project,editor:true,width:w,height:hh})
await g.loadAssets()
g.loadScene(sc.id)
g.grid_on=false
const out=h('canvas',{width:w,height:hh}),o=out.getContext('2d')
if(sc.mode==='3d'&&g.r3){
const k=sc.camera3||{}
Object.assign(g.camera,{x:k.x==null?0:k.x,y:k.y==null?8:k.y,z:k.z==null?14:k.z,tx:k.tx||0,ty:k.ty==null?1:k.ty,tz:k.tz||0,fov:k.fov||70})
g.r3.gridOn=false
g.r3.sync(g)
g.r3.render(g.camera,sc.bg)
o.drawImage(g.r3.el,0,0,w,hh)
g.r3.r.dispose()
g.r3.r.forceContextLoss()
}else{
const z=(sc.camera&&sc.camera.zoom||1)*Math.min(w/project.settings.width,hh/project.settings.height)
Object.assign(g.camera,{x:sc.camera.x||0,y:sc.camera.y||0,zoom:z})
g.draw()
o.drawImage(cv,0,0)
}
return out.toDataURL('image/jpeg',0.82)
}catch(x){return''}
finally{wrap.remove()}
}
async function showHub(pane){
$('#hub').classList.add('on')
hubPane(pane||'new')
$('#hubBack').style.display=S.project?'':'none'
const grid=$('#tplGrid')
if(!grid.children.length){
for(const t of VueSample.TEMPLATES){
const th=h('div',{class:'th'},h('span',{class:'badge b'+t.kind[0],text:t.kind}))
grid.append(h('button',{class:'card',onclick:()=>{setProject(t.make(),null,true);hideHub();toast('Created '+t.name,'ok')}},th,h('div',{class:'cb'},h('b',{text:t.name}),h('small',{text:t.desc}))))
thumb(t.make()).then(u=>{if(u)th.style.backgroundImage='url('+u+')'})
}
}
renderRecent()
}
function hideHub(){$('#hub').classList.remove('on');setTimeout(()=>{if(S.game){const w=$('#cvwrap').clientWidth,hh=$('#cvwrap').clientHeight;if(w&&hh)S.game.resize(w,hh);redraw()}},0)}
function hubPane(p){
for(const b of $$('.hub-nav'))b.classList.toggle('on',b.dataset.hub===p)
for(const s of $$('.hub-main section'))s.classList.toggle('on',s.dataset.pane===p)
}
function renderRecent(){
const rs=recent(),auto=ls.get('vue.autosave',null)
const mk=r=>h('button',{class:'card',onclick:()=>openPath(r.path)},h('div',{class:'th',style:r.thumb?'background-image:url('+r.thumb+')':null},h('span',{class:'badge b'+(r.kind||'2D')[0],text:r.kind||'2D'})),h('div',{class:'cb'},h('b',{text:r.name}),h('small',{text:ago(r.time)+' · '+r.path})))
const mini=$('#recentMini'),full=$('#recentGrid')
mini.innerHTML=''
full.innerHTML=''
if(auto&&auto.project&&auto.project.scenes){
mini.append(h('button',{class:'card',onclick:()=>{setProject(auto.project,auto.path,!auto.path);hideHub()}},h('div',{class:'th',style:'background:radial-gradient(circle at 50% 40%,rgba(157,92,255,.35),transparent 70%),#0a0910;display:grid;place-items:center;color:#c9a6ff',html:ic('clock',34)}),h('div',{class:'cb'},h('b',{text:'Continue: '+auto.project.name}),h('small',{text:'Your last session, restored'}))))
}
for(const r of rs.slice(0,7))mini.append(mk(r))
for(const r of rs)full.append(mk(r))
if(!mini.children.length)mini.append(h('div',{class:'nores',text:'Nothing yet. Pick a template above to start.'}))
if(!full.children.length)full.append(h('div',{class:'nores',text:'Projects you save or open show up here.'}))
}
function pushRecent(path,thumbUrl){
const rs=recent().filter(r=>r.path!==path)
rs.unshift({path,name:S.project.name,thumb:thumbUrl||'',time:Date.now(),kind:S.project.scenes.some(s=>s.mode==='3d')?'3D':'2D'})
ls.set('vue.recent',rs.slice(0,16))
}
async function openPath(p){
const r=await host.readProject(p)
if(!r){toast('Could not open '+p,'err');ls.set('vue.recent',recent().filter(x=>x.path!==p));renderRecent();return}
loadData(r)
}
function loadData(r){
try{
const p=JSON.parse(r.data)
if(!p.scenes||!p.scenes.length)throw new Error('no scenes')
setProject(p,r.path)
pushRecent(r.path,p.thumb)
hideHub()
toast('Opened '+p.name,'ok')
}catch(x){toast('Not a valid Vue project file','err')}
}
async function open(){const r=await host.openProject();if(r)loadData(r)}
async function save(as){
S.project.thumb=await thumb(S.project,320,180)
const p=await host.saveProject(JSON.stringify(S.project),as?null:S.path)
if(!p)return
S.path=p
S.dirty=false
S.savedAt=Date.now()
$('#dirty').classList.remove('on')
pushRecent(p,S.project.thumb)
scheduleSave()
status()
toast('Saved '+p.split(/[\\/]/).pop(),'ok')
}
const PORTS=[
['html','Single HTML file','file','One self-contained .html. Double-click to play, email it, or drop it anywhere.','.html'],
['web','Web game (ZIP)','export','index.html + game.js + assets folder. Upload straight to itch.io, Newgrounds or GitHub Pages.','.zip'],
['pwa','Installable web app (ZIP)','gamepad','Web game with manifest, icons and offline cache. Players can install it on phones, tablets and desktops.','.zip'],
['desktop','Desktop app','cube','A standalone app folder with its own executable for this computer\'s OS. No browser needed.','.zip'],
['project','Vue project file','save','The editable source. Share it so others can open and remix your game in Vue Engine.','.vue']
]
let portSel='html'
async function exportHtml(){openPort()}
function openPort(){
const box=$('#portList')
box.innerHTML=''
for(const p of PORTS){
const it=h('button',{class:'pcard'+(p[0]===portSel?' on':''),onclick:()=>{portSel=p[0];openPort()}},h('span',{class:'pi',html:ic(p[2],20)}),h('span',{class:'pt'},h('b',{text:p[1]+(p[0]==='desktop'&&S.platform?' · '+({win32:'Windows',darwin:'macOS',linux:'Linux'}[S.platform]||S.platform):'')}),h('small',{text:p[3]})),h('em',{text:p[4]}))
box.append(it)
}
$('#portName').value=$('#portName').value||S.project.name
$('#portFsRow').style.display=portSel==='desktop'?'':'none'
$('#portBar').style.display='none'
$('#port').classList.add('on')
}
function closePort(){$('#port').classList.remove('on')}
function dataParts(u){const m=/^data:([^;,]+)?(;base64)?,(.*)$/.exec(u||'');return m?{mime:m[1]||'',b64:!!m[2],data:m[3]}:null}
function assetFiles(proj){
const files=[],used=new Set()
for(const k in proj.assets){
const a=proj.assets[k],d=dataParts(a.data)
if(!d)continue
let nm=k.replace(/[^\w.\-]+/g,'_')||'asset',i=2
while(used.has(nm))nm=nm.replace(/(\.[^.]*)?$/,'_'+(i++)+'$1')
used.add(nm)
files.push({name:'assets/'+nm,data:d.b64?d.data:btoa(unescape(encodeURIComponent(decodeURIComponent(d.data)))),b64:true})
a.data='assets/'+nm
}
return files
}
function iconPng(src,size){
return new Promise(res=>{
const im=new Image()
im.onload=()=>{const c=document.createElement('canvas');c.width=c.height=size;const x=c.getContext('2d');x.fillStyle='#0a0910';x.fillRect(0,0,size,size);const k=Math.max(size/im.width,size/im.height);x.drawImage(im,(size-im.width*k)/2,(size-im.height*k)/2,im.width*k,im.height*k);res(c.toDataURL('image/png').split(',')[1])}
im.onerror=()=>res(null)
im.src=src
})
}
async function runPort(){
const target=portSel,name=($('#portName').value||S.project.name).trim()||'My Game'
const r=await VueCompiler.compileProject(S.project,compileEnv())
for(const e of r.errors){const i=e.indexOf(': ');log('error',i>0?e.slice(i+2):e,i>0?e.slice(0,i):'')}
if(r.errors.length&&target!=='project'&&!await dialog({title:'Port with '+r.errors.length+' script error'+(r.errors.length>1?'s':'')+'?',msg:'Entities with broken scripts will do nothing in the ported game. Details are in the Console.',buttons:[{label:'Cancel',value:null},{label:'Port anyway',value:1,primary:true}]}))return
const rt=await host.runtimeSource()
const three=S.project.scenes.some(s=>s.mode==='3d')?await host.threeSource():''
const proj=JSON.parse(JSON.stringify(S.project))
proj.name=name
delete proj.thumb
let files=[]
if(target==='html')files=[{name:'index.html',data:VuePlayer.html(proj,r.scripts,rt,name,three)}]
else if(target==='project'){const sp=JSON.parse(JSON.stringify(S.project));sp.thumb=await thumb(S.project,320,180);files=[{name:'game.vue',data:JSON.stringify(sp)}]}
else{
const af=target==='desktop'?[]:assetFiles(proj)
let extra=''
if(target==='pwa')extra='<link rel="manifest" href="manifest.json"><meta name="theme-color" content="#0a0910"><link rel="icon" href="icon-192.png"><link rel="apple-touch-icon" href="icon-192.png"><meta name="apple-mobile-web-app-capable" content="yes"><script>if("serviceWorker"in navigator)addEventListener("load",function(){navigator.serviceWorker.register("sw.js")})</script>'
const pt=VuePlayer.parts(proj,r.scripts,rt,name,three,extra)
files=[{name:'index.html',data:pt.html},{name:'game.js',data:pt.js}].concat(af)
if(target==='pwa'){
const shot=await thumb(S.project,512,512)
const i512=await iconPng(shot||'gem.png',512),i192=await iconPng(shot||'gem.png',192)
if(i512)files.push({name:'icon-512.png',data:i512,b64:true})
if(i192)files.push({name:'icon-192.png',data:i192,b64:true})
files.push({name:'manifest.json',data:JSON.stringify({name,short_name:name.slice(0,12),start_url:'./index.html',display:'fullscreen',orientation:S.project.settings.width>=S.project.settings.height?'landscape':'portrait',background_color:'#000000',theme_color:'#0a0910',icons:[{src:'icon-192.png',sizes:'192x192',type:'image/png'},{src:'icon-512.png',sizes:'512x512',type:'image/png'}]},null,1)})
const list=files.map(f=>'./'+f.name)
files.push({name:'sw.js',data:'const C="vue-'+Date.now()+'",F='+JSON.stringify(['./'].concat(list))+';self.addEventListener("install",e=>{self.skipWaiting();e.waitUntil(caches.open(C).then(c=>c.addAll(F)))});self.addEventListener("activate",e=>e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C).map(x=>caches.delete(x)))).then(()=>clients.claim())));self.addEventListener("fetch",e=>{e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request)))})'})
}
}
const bar=$('#portBar')
bar.style.display=''
bar.firstChild.style.width='0%'
$('#portGo').disabled=true
try{
const out=await host.port({target,name,files,width:S.project.settings.width,height:S.project.settings.height,fullscreen:$('#portFs').checked})
if(out){closePort();log('info','Ported to '+out);toast('Ported '+name+' → '+out.split(/[\\/]/).pop(),'ok')}
}catch(x){toast('Port failed: '+(x&&x.message||x),'err')}
finally{$('#portGo').disabled=false;bar.style.display='none'}
}
const LAYOUT={lw:250,rw:300,bh:240}
function applyLayout(L){
const r=document.documentElement.style
r.setProperty('--lw',L.lw+'px')
r.setProperty('--rw',L.rw+'px')
r.setProperty('--bh',L.bh+'px')
}
function resetLayout(){S.layout=Object.assign({},LAYOUT);S.layout.bh=Math.round(Math.min(LAYOUT.bh,innerHeight*0.3));ls.set('vue.layout',S.layout);applyLayout(S.layout)}
function toggleDock(force){
const L=S.layout,open=L.bh>40
if(force===true&&open)return
if(open){L.bhPrev=L.bh;L.bh=31}else L.bh=Math.max(160,Math.min(L.bhPrev||LAYOUT.bh,Math.round(innerHeight*0.45)))
applyLayout(L);ls.set('vue.layout',L)
$('#bDock').innerHTML=ic(L.bh>40?'chev':'chevr',14)
}
function splitters(){
S.layout=Object.assign({},LAYOUT,ls.get('vue.layout',{}))
if(S.layout.bh>innerHeight*0.4)S.layout.bh=Math.round(innerHeight*0.3)
if(S.layout.lw>innerWidth*0.3)S.layout.lw=LAYOUT.lw
if(S.layout.rw>innerWidth*0.35)S.layout.rw=LAYOUT.rw
applyLayout(S.layout)
const mk=(id,key,dir,max,sign)=>{
const el=$(id)
let prev=null
el.addEventListener('pointerdown',e=>{
el.setPointerCapture(e.pointerId)
el.classList.add('drag')
const s0=dir==='x'?e.clientX:e.clientY,v0=S.layout[key]
const mv=ev=>{const d=(dir==='x'?ev.clientX:ev.clientY)-s0;S.layout[key]=Math.round(Math.min(max(),Math.max(0,v0+d*sign)));applyLayout(S.layout)}
const up=()=>{el.classList.remove('drag');el.removeEventListener('pointermove',mv);el.removeEventListener('pointerup',up);ls.set('vue.layout',S.layout)}
el.addEventListener('pointermove',mv)
el.addEventListener('pointerup',up)
})
el.addEventListener('dblclick',()=>{
if(S.layout[key]>4){prev=S.layout[key];S.layout[key]=0}else S.layout[key]=prev||LAYOUT[key]
applyLayout(S.layout);ls.set('vue.layout',S.layout)
})
}
mk('#spL','lw','x',()=>innerWidth*0.4,1)
mk('#spR','rw','x',()=>innerWidth*0.45,-1)
mk('#spB','bh','y',()=>innerHeight*0.6,-1)
}
function typing(t){
return t&&(t.tagName==='INPUT'||t.tagName==='TEXTAREA'||t.tagName==='SELECT'||(t.closest&&t.closest('.monaco-editor,.blocklyWidgetDiv,.blocklyDropDownDiv,.ne,#blk,#dialog,#palette')))
}
function keys(){
window.addEventListener('keydown',e=>{
const t=e.target,ty=typing(t),k=e.key.toLowerCase()
if($('#dialog').classList.contains('on')||$('#palette').classList.contains('on'))return
if($('#keys').classList.contains('on')){if(k==='escape'||e.key==='?')$('#keys').classList.remove('on');return}
if($('#hub').classList.contains('on')){if(k==='escape'&&S.project)hideHub();if((e.ctrlKey||e.metaKey)&&k==='o'){e.preventDefault();open()}return}
if(S.drag&&S.drag.k==='orbit'&&k.length===1&&'wasdqe'.indexOf(k)>=0){S.fly.add(k);if(e.shiftKey)S.fly.add('shift');e.preventDefault();return}
if(e.ctrlKey||e.metaKey){
if(k==='s'){e.preventDefault();save(e.shiftKey);return}
if(k==='enter'){e.preventDefault();play();return}
if(k==='o'){e.preventDefault();open();return}
if(k==='n'){e.preventDefault();showHub('new');return}
if(k==='e'){e.preventDefault();openPort();return}
if(k==='p'){e.preventDefault();palette('');return}
if(k==='1'){e.preventDefault();setTab('scene');return}
if(k==='2'){e.preventDefault();setTab('script');return}
if(ty)return
if(k==='z'){e.preventDefault();e.shiftKey?redo():undo()}
else if(k==='y'){e.preventDefault();redo()}
else if(k==='d'){e.preventDefault();dupEntity()}
else if(k==='c')copyEntity()
else if(k==='v')pasteEntity()
return
}
if(k==='escape'){if(S.playing){stopGame();return}closePops();if(S.sel&&!ty&&S.tab==='scene')select(null);return}
if(ty)return
if(e.key==='?'){showKeys();return}
if(e.key==='F2'){e.preventDefault();renameEntity();return}
if(S.tab!=='scene'||S.playing)return
if(k==='a'&&e.shiftKey){e.preventDefault();palette('create ');return}
if(k===' '){S.space=true;$('#cvwrap').classList.add('pan');e.preventDefault();return}
if(k==='delete'||k==='backspace'){delEntity();return}
if(k==='q')return setTool('pan')
if(k==='w')return setTool('move')
if(k==='e')return setTool('rotate')
if(k==='r')return setTool('scale')
if(k==='b'){const d=selData();if(d&&d.shape==='tilemap'){setTool('paint');setBTab('tiles')}return}
if(k==='f'){frameSel(e.shiftKey);return}
if(k==='g'){toggleGrid();return}
const d=selData()
if(d&&k.indexOf('arrow')===0){
e.preventDefault()
if(!e.repeat)snap()
const st=is3()?(e.shiftKey?1:0.1):(e.shiftKey?8:1)
if(k==='arrowleft')d.x=r2(d.x-st)
if(k==='arrowright')d.x=r2(d.x+st)
if(k==='arrowup'){if(is3())d.z=r2(d.z-st);else d.y=r2(d.y-st)}
if(k==='arrowdown'){if(is3())d.z=r2(d.z+st);else d.y=r2(d.y+st)}
S.game.refresh()
syncInspector()
redraw()
scheduleSave()
}
})
window.addEventListener('keyup',e=>{
const k=e.key.toLowerCase()
if(k===' '){S.space=false;$('#cvwrap').classList.remove('pan')}
S.fly.delete(k)
if(k==='shift')S.fly.delete('shift')
})
}
function wire(){
icons()
wireMenus()
$('#bPlay').onclick=play
$('#bPause').onclick=pauseGame
$('#bStep').onclick=stepGame
$('#bStop').onclick=stopGame
$('#pPause').onclick=pauseGame
$('#pStep').onclick=stepGame
$('#pStop').onclick=stopGame
$('#pDetach').onclick=async()=>{const html=S.lastHtml;stopGame();if(html)await host.detach(html,S.project.name)}
$('#resSel').onchange=()=>{S.res=$('#resSel').value;fitPlay()}
new ResizeObserver(fitPlay).observe($('#playBox'))
$('#bExport').onclick=openPort
$('#bDock').onclick=()=>toggleDock()
$('#bDock').innerHTML=ic(S.layout.bh>40?'chev':'chevr',14)
for(const b of $$('.btab'))b.addEventListener('dblclick',()=>toggleDock())
$('#portGo').onclick=runPort
$('#portCancel').onclick=closePort
$('#port').onpointerdown=e=>{if(e.target.id==='port')closePort()}
if(host.onPortProgress)host.onPortProgress(p=>{const b=$('#portBar');if(b)b.firstChild.style.width=Math.round(p.i/p.n*100)+'%'})
$('#bAddScene').onclick=addScene
$('#bAddEnt').onclick=e=>{const r=e.currentTarget.getBoundingClientRect();showMenu($('#ctx'),r.left,r.bottom+4,createItems())}
$('#bImport').onclick=importAssets
$('#bClear').onclick=clearLog
$('#bFrame').onclick=()=>frameSel()
$('#zoomLbl').onclick=()=>resetView()
$('#zoomLbl').ondblclick=()=>frameSel(true)
$('#tSnap').onclick=toggleSnap
$('#tGrid').onclick=toggleGrid
$('#tSky').onclick=()=>{S.skyOn=!S.skyOn;ls.set('vue.sky',S.skyOn);updateToolbar();redraw()}
$('#snapSel').onchange=()=>{const v=num($('#snapSel').value);if(is3()){S.snap3=v;ls.set('vue.snap3',v)}else{S.snap2=v;ls.set('vue.snap2',v)}applyTC()}
$('#hfilter').oninput=renderHier
$('#tPaint').onclick=()=>setTool('paint')
$('#hier').addEventListener('dragover',e=>{if(S.dnd&&e.target===$('#hier'))e.preventDefault()})
$('#hier').addEventListener('drop',e=>{if(!S.dnd||e.target!==$('#hier'))return;e.preventDefault();const d=S.dnd;S.dnd=null;snap();reparent(d,null);S.game.refresh();renderHier();buildInspector();redraw()})
$('#cfilter').oninput=renderLog
$('#stErr').onclick=()=>setBTab('console')
$('#keysClose').onclick=()=>$('#keys').classList.remove('on')
$('#keys').onpointerdown=e=>{if(e.target.id==='keys')$('#keys').classList.remove('on')}
$('#hubOpen').onclick=open
$('#hubBack').onclick=hideHub
for(const b of $$('.hub-nav'))b.onclick=()=>hubPane(b.dataset.hub)
for(const b of $$('.fchip'))b.onclick=()=>{S.lv[b.dataset.lv]=!S.lv[b.dataset.lv];b.classList.toggle('on',S.lv[b.dataset.lv]);renderLog()}
for(const b of $$('.btab'))b.onclick=()=>setBTab(b.dataset.btab)
for(const b of $$('.ws button'))b.onclick=()=>setTab(b.dataset.tab)
for(const b of $$('[data-tool]'))b.onclick=()=>setTool(b.dataset.tool)
for(const b of $$('[data-mode]'))b.onclick=()=>pickMode(b.dataset.mode)
window.addEventListener('message',e=>{
const m=e.data
if(!m||m.vue!==1||e.source!==$('#frame').contentWindow)return
if(m.type==='log')log(m.level,m.text,m.src)
if(m.type==='fps')$('#fps').textContent=m.v+' fps · '+m.n+' entities'
})
window.addEventListener('resize',()=>{if(S.ws)Blockly.svgResize(S.ws);if(S.code)S.code.layout()})
new ResizeObserver(()=>{if(S.ws&&S.tab==='script')Blockly.svgResize(S.ws)}).observe($('#sbody'))
setInterval(status,5000)
}
window.VueEd={S,h,ic,scene,is3,selData,entOf,snap,snapAll:snap,markDirty,scheduleSave,reloadScene,renderAll,renderHier,buildInspector,redraw,toast,dialog,setBTab,setTab,setTool,select,addEntity,addAsset,worldOf:wd,setW,scr,uid:()=>VueSample.uid(),refresh:()=>{S.game.refresh();redraw();buildInspector();markDirty()},showMenu:(x,y,items)=>showMenu($('#ctx'),x,y,items),play:n=>play(n)}
window.vueBoot=async function(){
VuePanels.init(window.VueEd)
const r=VueBlocks.init(Blockly,Blockly.JavaScript,window.javascript.Order)
S.toolbox=r.toolbox
Blockly.dialog.setPrompt((msg,def,cb)=>{dialog({title:msg,input:def||'',buttons:[{label:'Cancel',value:null},{label:'OK',value:true,primary:true}]}).then(v=>cb(v))})
Blockly.dialog.setConfirm((msg,cb)=>{dialog({title:msg,buttons:[{label:'Cancel',value:false},{label:'OK',value:true,primary:true}]}).then(v=>cb(!!v))})
Blockly.dialog.setAlert((msg,cb)=>{dialog({title:msg,buttons:[{label:'OK',value:1,primary:true}]}).then(()=>{if(cb)cb()})})
splitters()
wire()
keys()
canvasEvents()
dropEvents()
try{S.version=await host.version()}catch(x){}
try{S.platform=await host.platform()}catch(x){}
$('#stVer').textContent='Vue Engine '+S.version
$('#hubVer').textContent='Version '+S.version
const auto=ls.get('vue.autosave',null)
const ok=auto&&auto.project&&auto.project.scenes&&auto.project.scenes.length
setProject(ok?auto.project:VueSample.make(),ok?auto.path:null,ok&&!auto.path)
setTab('scene')
setBTab('console')
transport()
loadMonaco()
log('info','Vue Engine '+S.version+' ready')
await showHub('new')
setTimeout(()=>$('#splash').classList.add('out'),650)
setTimeout(()=>$('#splash').remove(),1100)
}
})()
