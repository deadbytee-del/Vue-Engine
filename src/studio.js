(function(root){
const VM=()=>root.VueMesh
const h=(t,a,...c)=>{
const e=document.createElement(t)
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
const ic=(n,s)=>root.VueIcon(n,s||16)
const r3=v=>Math.round(v*1000)/1000
const SHAPES=[['cube','Cube'],['sphere','Sphere'],['icosphere','Ico sphere'],['cylinder','Cylinder'],['cone','Cone'],['torus','Torus'],['capsule','Capsule'],['plane','Plane'],['grid','Grid'],['circle','Circle'],['pyramid','Pyramid'],['wedge','Wedge'],['stairs','Stairs']]
const st={cur:null,mode:'edit',sm:'f',sel:{v:new Set(),e:new Set(),f:new Set()},mir:[0,0,0],prop:{on:false,r:1},xray:false,wire:false,snap:false,tool:'select',undo:[],redo:[],last:null,br:{kind:'draw',r:0.3,s:0.4},matIdx:0,tab:'tool',simple:true,shown:false}
const V={yaw:35,pitch:25,dist:4,t:[0,0,0]}
let host,el,cv,rd,sc,cam,tc,pivot,gridObj,baseMesh,evMesh,edgeLines,vertPts,selMesh,ringLines,ghost,brushRing
let W=1,H=1,need=true,loopId=0
let disp=null,evalCache=null,topo=null,scr=null
let xf=null,modal=null,drag=null,hover=null,saveT=0,knifeA=null
const dom={}
function T(){return root.THREE}
function curMesh(){return st.cur.mesh}
function invalidate(geo){evalCache=null;topo=null;scr=null;if(geo!==false)geo=true;st.geo=geo;need=true}
function snapshot(){return{mesh:structuredClone(st.cur.mesh),mods:structuredClone(st.cur.mods),sel:{v:[...st.sel.v],e:[...st.sel.e],f:[...st.sel.f]},sm:st.sm}}
function restore(s){
st.cur.mesh=structuredClone(s.mesh);st.cur.mods=structuredClone(s.mods)
st.sel={v:new Set(s.sel.v),e:new Set(s.sel.e),f:new Set(s.sel.f)};st.sm=s.sm
st.last=null
changed()
}
function pushUndo(){st.undo.push(snapshot());if(st.undo.length>60)st.undo.shift();st.redo=[]}
function undo(){if(!st.undo.length)return;st.redo.push(snapshot());restore(st.undo.pop())}
function redo(){if(!st.redo.length)return;st.undo.push(snapshot());restore(st.redo.pop())}
function changed(){invalidate();refreshUI();scheduleSave()}
function scheduleSave(){clearTimeout(saveT);saveT=setTimeout(commit,500)}
function toast(m,k){host&&host.toast?host.toast(m,k):0}
function evaluated(){
if(!evalCache){
try{evalCache=VM().evaluate({mesh:st.cur.mesh,mods:st.cur.mods})}catch(x){toast(x.message,'warn');evalCache=VM().clone(st.cur.mesh)}
}
return evalCache
}
function getTopo(){
if(!topo){
const m=st.cur.mesh,em=VM().edgeMap(m),keys=[...em.keys()]
topo={em,keys}
}
return topo
}
function getVerts(){
const m=st.cur.mesh
if(st.mode==='object'){const s=new Set();for(let i=0;i<m.v.length;i++)s.add(i);return s}
if(st.sm==='v')return st.sel.v
if(st.sm==='e')return VM().everts(st.sel.e)
return VM().fverts(m,st.sel.f)
}
function getEdges(){
const m=st.cur.mesh
if(st.sm==='e')return st.sel.e
if(st.sm==='f')return VM().eset(m,st.sel.f)
const s=new Set()
for(const k of getTopo().keys)if(st.sel.v.has(VM().ka(k))&&st.sel.v.has(VM().kb(k)))s.add(k)
return s
}
function getFaces(){
const m=st.cur.mesh
if(st.sm==='f')return st.sel.f
const vs=getVerts(),s=new Set()
m.f.forEach((f,i)=>{if(f.every(x=>vs.has(x)))s.add(i)})
return s
}
function selCount(){return st.mode==='object'?st.cur.mesh.v.length:st.sm==='v'?st.sel.v.size:st.sm==='e'?st.sel.e.size:st.sel.f.size}
function clearSel(){st.sel={v:new Set(),e:new Set(),f:new Set()}}
function setSel(r){
clearSel()
if(!r)return
if(st.sm==='v')for(const i of r.v||[])st.sel.v.add(i)
else if(st.sm==='e'){for(const k of r.e||[])st.sel.e.add(k)}
else for(const i of r.f||[])st.sel.f.add(i)
}
function setSelMode(m){
if(st.mode==='object')st.mode='edit'
const vs=getVerts(),es=st.sm==='f'?VM().eset(st.cur.mesh,st.sel.f):getEdges(),fs=getFaces(),old=st.sm
clearSel()
st.sm=m
if(m==='v')for(const i of vs)st.sel.v.add(i)
else if(m==='e'){
if(old==='v'){for(const k of es)st.sel.e.add(k)}
else if(old==='f'){const em=getTopo().em;for(const k of es){const e=em.get(k);if(e&&e.f.every(f=>fs.has(f)))st.sel.e.add(k)}}
}else{for(const i of fs)st.sel.f.add(i)}
if(m==='f'&&old==='e'){const set=st.sel.e;st.sel.f=new Set();st.cur.mesh.f.forEach((f,i)=>{if(f.every((x,j)=>set.has(VM().K(x,f[(j+1)%f.length]))))st.sel.f.add(i)})}
refreshUI();updateOverlay()
}
function setMode(m){
st.mode=m
if(m==='object')clearSel()
refreshUI();updateOverlay();attachGizmo()
}
function centroid(vs){
const m=st.cur.mesh
let x=0,y=0,z=0,n=0
for(const i of vs){const p=m.v[i];x+=p[0];y+=p[1];z+=p[2];n++}
return n?[x/n,y/n,z/n]:[0,0,0]
}
function project(p){
const v=new (T().Vector3)(p[0],p[1],p[2]).project(cam)
return[(v.x*0.5+0.5)*W,(-v.y*0.5+0.5)*H,v.z]
}
function getScr(){
if(scr&&scr.ver===camVer)return scr
const m=st.cur.mesh,n=m.v.length,sx=new Float32Array(n),sy=new Float32Array(n),sz=new Float32Array(n)
const v=new (T().Vector3)()
cam.updateMatrixWorld();cam.updateProjectionMatrix()
for(let i=0;i<n;i++){const p=m.v[i];v.set(p[0],p[1],p[2]).project(cam);sx[i]=(v.x*0.5+0.5)*W;sy[i]=(-v.y*0.5+0.5)*H;sz[i]=v.z}
scr={sx,sy,sz,ver:camVer}
return scr
}
let camVer=0
function mouseRay(x,y){
const v=new (T().Vector3)((x/W)*2-1,-(y/H)*2+1,0.5).unproject(cam)
const o=cam.position.clone(),d=v.sub(o).normalize()
return{o:[o.x,o.y,o.z],d:[d.x,d.y,d.z]}
}
function raycast(o,d){
if(!disp)return null
const P=disp.pos
let bt=1e30,bi=-1
for(let t=0;t<disp.count;t++){
const q=t*9
const e1x=P[q+3]-P[q],e1y=P[q+4]-P[q+1],e1z=P[q+5]-P[q+2],e2x=P[q+6]-P[q],e2y=P[q+7]-P[q+1],e2z=P[q+8]-P[q+2]
const px=d[1]*e2z-d[2]*e2y,py=d[2]*e2x-d[0]*e2z,pz=d[0]*e2y-d[1]*e2x
const det=e1x*px+e1y*py+e1z*pz
if(Math.abs(det)<1e-12)continue
const inv=1/det,tx=o[0]-P[q],ty=o[1]-P[q+1],tz=o[2]-P[q+2]
const u=(tx*px+ty*py+tz*pz)*inv
if(u<0||u>1)continue
const qx=ty*e1z-tz*e1y,qy=tz*e1x-tx*e1z,qz=tx*e1y-ty*e1x
const v=(d[0]*qx+d[1]*qy+d[2]*qz)*inv
if(v<0||u+v>1)continue
const tt=(e2x*qx+e2y*qy+e2z*qz)*inv
if(tt>1e-6&&tt<bt){bt=tt;bi=t}
}
return bi<0?null:{t:bt,tri:bi,face:disp.tf[bi],p:[o[0]+d[0]*bt,o[1]+d[1]*bt,o[2]+d[2]*bt]}
}
function visible(i){
if(st.xray)return true
const p=st.cur.mesh.v[i],o=cam.position,d=[p[0]-o.x,p[1]-o.y,p[2]-o.z],l=Math.hypot(d[0],d[1],d[2])
const dd=[d[0]/l,d[1]/l,d[2]/l],h=raycast([o.x,o.y,o.z],dd)
return !h||h.t>l-Math.max(0.002,l*0.003)
}
function pickVert(x,y){
const s=getScr(),m=st.cur.mesh,c=[]
for(let i=0;i<m.v.length;i++){const d=Math.hypot(s.sx[i]-x,s.sy[i]-y);if(d<14)c.push([d,i])}
c.sort((a,b)=>a[0]-b[0])
for(const[,i]of c.slice(0,6))if(visible(i))return i
return -1
}
function pickEdge(x,y){
const s=getScr(),m=st.cur.mesh,c=[]
for(const k of getTopo().keys){
const a=VM().ka(k),b=VM().kb(k),ax=s.sx[a],ay=s.sy[a],bx=s.sx[b],by=s.sy[b]
const dx=bx-ax,dy=by-ay,l2=dx*dx+dy*dy||1
let t=((x-ax)*dx+(y-ay)*dy)/l2
t=Math.max(0,Math.min(1,t))
const d=Math.hypot(ax+dx*t-x,ay+dy*t-y)
if(d<10)c.push([d,k,t])
}
c.sort((a,b)=>a[0]-b[0])
for(const[d,k,t]of c.slice(0,6)){
const a=m.v[VM().ka(k)],b=m.v[VM().kb(k)],mid=VM().lerp(a,b,0.5)
if(st.xray||visPoint(mid))return{k,t}
}
return null
}
function visPoint(p){
const o=cam.position,d=[p[0]-o.x,p[1]-o.y,p[2]-o.z],l=Math.hypot(d[0],d[1],d[2]),h2=raycast([o.x,o.y,o.z],[d[0]/l,d[1]/l,d[2]/l])
return !h2||h2.t>l-Math.max(0.003,l*0.004)
}
function pickFace(x,y){
const r=mouseRay(x,y),h2=raycast(r.o,r.d)
return h2?h2.face:-1
}
function toggle(set,k,ext){
if(ext){if(set.has(k))set.delete(k);else set.add(k)}
else{set.clear();set.add(k)}
}
function clickSelect(x,y,ext,alt,ctrl){
if(st.mode==='object')return
const m=st.cur.mesh
const sel=st.sel
if(st.sm==='v'){
const i=pickVert(x,y)
if(i<0){if(!ext)clearSel()}
else toggle(sel.v,i,ext)
}else if(st.sm==='e'){
const e=pickEdge(x,y)
if(!e){if(!ext)clearSel()}
else if(alt){
const ks=ctrl?ringOf(e.k):VM().edgeLoop(m,e.k)
if(!ext)sel.e.clear()
for(const k of ks)sel.e.add(k)
}else toggle(sel.e,e.k,ext)
}else{
const f=pickFace(x,y)
if(f<0){if(!ext)clearSel()}
else if(alt){
if(!ext)sel.f.clear()
for(const g of VM().linked(m,f))sel.f.add(g)
}else toggle(sel.f,f,ext)
}
updateOverlay();refreshUI();attachGizmo()
}
function ringOf(k){
const m=st.cur.mesh,e=getTopo().em.get(k)
if(!e)return[k]
return VM().ringEdges(m,e.f[0],e.a,e.b).concat([k])
}
function boxSelect(x0,y0,x1,y1,ext){
const s=getScr(),m=st.cur.mesh
const[lx,hx]=[Math.min(x0,x1),Math.max(x0,x1)],[ly,hy]=[Math.min(y0,y1),Math.max(y0,y1)]
const inb=i=>s.sx[i]>=lx&&s.sx[i]<=hx&&s.sy[i]>=ly&&s.sy[i]<=hy&&s.sz[i]<1
let front=null
if(!st.xray){
const vn=VM().vnormals(m),o=cam.position
front=i=>{const p=m.v[i];return vn[i][0]*(o.x-p[0])+vn[i][1]*(o.y-p[1])+vn[i][2]*(o.z-p[2])>-0.0001}
}
const ok=i=>inb(i)&&(!front||front(i))
if(!ext)clearSel()
if(st.sm==='v'){for(let i=0;i<m.v.length;i++)if(ok(i))st.sel.v.add(i)}
else if(st.sm==='e'){for(const k of getTopo().keys)if(ok(VM().ka(k))&&ok(VM().kb(k)))st.sel.e.add(k)}
else m.f.forEach((f,i)=>{const c=VM().fcenter(m,f),p=project(c);if(p[0]>=lx&&p[0]<=hx&&p[1]>=ly&&p[1]<=hy&&p[2]<1&&(!front||f.some(x=>front(x))))st.sel.f.add(i)})
updateOverlay();refreshUI();attachGizmo()
}
function selectAll(){
const m=st.cur.mesh
if(st.mode==='object')return
if(st.sm==='v')for(let i=0;i<m.v.length;i++)st.sel.v.add(i)
else if(st.sm==='e')for(const k of getTopo().keys)st.sel.e.add(k)
else for(let i=0;i<m.f.length;i++)st.sel.f.add(i)
updateOverlay();refreshUI();attachGizmo()
}
function invertSel(){
const m=st.cur.mesh,s=st.sel
if(st.sm==='v'){const n=new Set();for(let i=0;i<m.v.length;i++)if(!s.v.has(i))n.add(i);s.v=n}
else if(st.sm==='e'){const n=new Set();for(const k of getTopo().keys)if(!s.e.has(k))n.add(k);s.e=n}
else{const n=new Set();for(let i=0;i<m.f.length;i++)if(!s.f.has(i))n.add(i);s.f=n}
updateOverlay();refreshUI();attachGizmo()
}
function growShrink(grow){
const m=st.cur.mesh
if(st.sm==='f'){const r=grow?VM().growFaces(m,[...st.sel.f]):VM().shrinkFaces(m,[...st.sel.f]);st.sel.f=new Set(r)}
else if(st.sm==='v'){
if(grow){const add=new Set(st.sel.v);for(const f of m.f)if(f.some(i=>st.sel.v.has(i)))for(const i of f)add.add(i);st.sel.v=add}
else{const keep=new Set();for(const i of st.sel.v){let all=true;for(const f of m.f)if(f.includes(i)&&f.some(x=>!st.sel.v.has(x))){all=false;break};if(all)keep.add(i)}st.sel.v=keep}
}else{
const vs=VM().everts(st.sel.e)
if(grow){const add=new Set(st.sel.e);for(const k of getTopo().keys)if(vs.has(VM().ka(k))||vs.has(VM().kb(k)))add.add(k);st.sel.e=add}
else{const keep=new Set();for(const k of st.sel.e){const a=VM().ka(k),b=VM().kb(k);let ca=0,cb=0;for(const q of st.sel.e){if(VM().ka(q)===a||VM().kb(q)===a)ca++;if(VM().ka(q)===b||VM().kb(q)===b)cb++};if(ca>1&&cb>1)keep.add(k)}st.sel.e=keep}
}
updateOverlay();refreshUI();attachGizmo()
}
function pivotPoint(){return centroid(getVerts())}
function attachGizmo(){
if(!tc)return
const tool=st.tool
const on=(tool==='move'||tool==='rotate'||tool==='scale')&&selCount()>0&&st.mode!=='sculpt'
if(!on){tc.detach();pivot.visible=false;need=true;return}
const p=pivotPoint()
pivot.position.set(p[0],p[1],p[2]);pivot.quaternion.set(0,0,0,1);pivot.scale.set(1,1,1)
tc.setMode(tool==='move'?'translate':tool)
tc.setTranslationSnap(st.snap?0.25:null);tc.setRotationSnap(st.snap?Math.PI/12:null);tc.setScaleSnap(st.snap?0.1:null)
tc.attach(pivot);need=true
}
function beginXf(){
const m=st.cur.mesh,vs=getVerts(),p=centroid(vs),bp=new Map(),w=new Map()
for(const i of vs){bp.set(i,m.v[i].slice());w.set(i,1)}
if(st.prop.on&&vs.size<=2000&&st.mode==='edit'){
const sel=[...vs],few=sel.length<=64
for(let i=0;i<m.v.length;i++){
if(vs.has(i))continue
let d=1e9
if(few)for(const j of sel){const q=m.v[j],dd=Math.hypot(q[0]-m.v[i][0],q[1]-m.v[i][1],q[2]-m.v[i][2]);if(dd<d)d=dd}
else d=Math.hypot(p[0]-m.v[i][0],p[1]-m.v[i][1],p[2]-m.v[i][2])
if(d<st.prop.r){const t=1-d/st.prop.r;bp.set(i,m.v[i].slice());w.set(i,t*t*(3-2*t))}
}
}
const maps=[]
for(let a=0;a<3;a++)if(st.mir[a])maps.push([a,VM().mirrorMap(m,a)])
xf={snap:snapshot(),bp,w,p,maps,moved:false}
}
function applyXf(fn){
const m=st.cur.mesh
for(const[i,b]of xf.bp){
const wt=xf.w.get(i)
const q=fn(b)
m.v[i]=wt>=1?q:[b[0]+(q[0]-b[0])*wt,b[1]+(q[1]-b[1])*wt,b[2]+(q[2]-b[2])*wt]
}
for(const[a,map]of xf.maps){
for(const i of xf.bp.keys()){
const j=map[i]
if(j===i)m.v[i][a]=0
else if(j>=0){const q=m.v[i].slice();q[a]=-q[a];m.v[j]=q}
}
}
xf.moved=true
invalidate();updateOverlay()
}
function endXf(){
if(!xf)return
if(xf.moved){st.undo.push(xf.snap);if(st.undo.length>60)st.undo.shift();st.redo=[];st.last=null;changed()}
xf=null
attachGizmo()
}
function cancelXf(){
if(!xf)return
const s=xf.snap
st.cur.mesh=structuredClone(s.mesh)
xf=null;invalidate();updateOverlay();attachGizmo()
}
function gizmoChange(){
if(!xf)return
const T3=T(),q=pivot.quaternion,s=pivot.scale,p0=xf.p,pp=pivot.position
const v=new T3.Vector3()
applyXf(b=>{
v.set((b[0]-p0[0])*s.x,(b[1]-p0[1])*s.y,(b[2]-p0[2])*s.z).applyQuaternion(q)
return[v.x+pp.x,v.y+pp.y,v.z+pp.z]
})
}
function startModal(kind){
if(selCount()===0||st.mode==='sculpt')return
beginXf()
modal={kind,axis:null,buf:'',x0:mouse.x,y0:mouse.y,amt:0}
host&&host.hint&&host.hint(modalHint())
setHint(modalHint())
}
function modalHint(){return (modal.kind==='g'?'Move':modal.kind==='r'?'Rotate':'Scale')+(modal.axis?' '+modal.axis.toUpperCase():'')+(modal.buf?': '+modal.buf:'. Move the mouse, type a number, press X, Y or Z for an axis. Click or Enter to confirm, Esc to cancel.')}
function modalApply(){
const k=modal.kind,ax=modal.axis,idx=ax?'xyz'.indexOf(ax):-1
const dx=mouse.x-modal.x0,dy=mouse.y-modal.y0
const typed=modal.buf!==''&&!isNaN(parseFloat(modal.buf))?parseFloat(modal.buf):null
const p=xf.p
if(k==='g'){
const dist=cam.position.distanceTo(new (T().Vector3)(p[0],p[1],p[2])),sc2=2*dist*Math.tan(cam.fov*Math.PI/360)/H
const right=new (T().Vector3)().setFromMatrixColumn(cam.matrixWorld,0),up=new (T().Vector3)().setFromMatrixColumn(cam.matrixWorld,1)
let d=right.multiplyScalar(dx*sc2).add(up.multiplyScalar(-dy*sc2)).toArray()
if(idx>=0){const l=d[idx];d=[0,0,0];d[idx]=l}
if(typed!==null){const a=idx>=0?idx:0;d=[0,0,0];d[a]=typed}
if(st.snap&&typed===null)d=d.map(x=>Math.round(x/0.25)*0.25)
applyXf(b=>[b[0]+d[0],b[1]+d[1],b[2]+d[2]])
}else if(k==='r'){
let ang=typed!==null?typed:dx*0.5
if(st.snap&&typed===null)ang=Math.round(ang/15)*15
const axis=idx>=0?[[1,0,0],[0,1,0],[0,0,1]][idx]:cam.getWorldDirection(new (T().Vector3)()).toArray().map(x=>-x)
const qn=new (T().Quaternion)().setFromAxisAngle(new (T().Vector3)(...axis).normalize(),ang*Math.PI/180),v=new (T().Vector3)()
applyXf(b=>{v.set(b[0]-p[0],b[1]-p[1],b[2]-p[2]).applyQuaternion(qn);return[v.x+p[0],v.y+p[1],v.z+p[2]]})
}else{
let f=typed!==null?typed:Math.max(0.01,1+dx/150)
if(st.snap&&typed===null)f=Math.round(f*10)/10
applyXf(b=>{const r=[b[0]-p[0],b[1]-p[1],b[2]-p[2]];if(idx>=0)r[idx]*=f;else{r[0]*=f;r[1]*=f;r[2]*=f}return[r[0]+p[0],r[1]+p[1],r[2]+p[2]]})
}
setHint(modalHint())
}
function endModal(ok){
if(!modal)return
modal=null
if(ok)endXf();else cancelXf()
setHint('')
}
const mouse={x:0,y:0}
function setHint(t){if(dom.hint)dom.hint.textContent=t||hintFor()}
function hintFor(){
if(st.mode==='sculpt')return 'Drag on the model to sculpt. Hold Shift to smooth. [ and ] change the brush size.'
if(st.tool==='loopcut')return 'Hover an edge on a four-sided face to preview the cut, then click it.'
if(st.tool==='knife')return knifeA===null?'Knife: click the first corner.':'Knife: click the second corner of the same face.'
if(st.tool==='paint')return 'Click or drag over faces to paint them with the chosen material.'
if(st.mode==='object')return 'Object mode: move, rotate and scale the whole model. Press Tab to edit its points.'
return selCount()?'Selected '+selCount()+'. Use the tools on the left or the gizmo. Right-drag to orbit, wheel to zoom.':'Click a '+(st.sm==='v'?'point':st.sm==='e'?'edge':'face')+' to select it, or drag a box. Right-drag orbits, wheel zooms.'
}
const OPS={}
function def(id,o){OPS[id]=Object.assign({id},o)}
const need1=(n,t)=>{if(n===0)throw new Error(t)}
def('extrude',{label:'Extrude',ic:'extrude',key:'E',tip:'Pull selected faces or edges outward to make new geometry.',params:[{k:'d',label:'Distance',min:-3,max:3,step:0.01,def:0.3}],modal:'d',run(m,p){
if(st.sm==='f'){need1(st.sel.f.size,'Select some faces to extrude');const r=VM().extrudeFaces(m,[...st.sel.f],p.d);return{f:r.f}}
if(st.sm==='e'){need1(st.sel.e.size,'Select some edges to extrude');const r=VM().extrudeEdges(m,[...st.sel.e],p.d);return{e:r.e}}
throw new Error('Switch to edge or face select to extrude')
}})
def('inset',{label:'Inset',ic:'inset',key:'I',tip:'Shrink selected faces and add a border around them.',params:[{k:'w',label:'Width',min:0.005,max:1,step:0.005,def:0.1},{k:'depth',label:'Depth',min:-1,max:1,step:0.01,def:0}],modal:'w',run(m,p){
if(st.sm!=='f')throw new Error('Select some faces to inset')
need1(st.sel.f.size,'Select some faces to inset')
return{f:VM().insetAbs(m,[...st.sel.f],p.w,p.depth).f}
}})
def('bevel',{label:'Bevel',ic:'bevel',key:'Ctrl+B',tip:'Round or chamfer the selected edges.',params:[{k:'w',label:'Width',min:0.005,max:0.5,step:0.005,def:0.05}],modal:'w',run(m,p){
const es=[...getEdges()]
need1(es.length,'Select some edges to bevel')
return{f:VM().bevel(m,es,p.w).f}
}})
def('subdivide',{label:'Subdivide',ic:'subdiv',key:'',tip:'Split faces or edges into smaller pieces.',params:[{k:'cuts',label:'Cuts',min:1,max:6,step:1,def:1}],run(m,p){
if(st.sm==='e'&&st.sel.e.size){const r=VM().subdivideEdges(m,[...st.sel.e],p.cuts);return{v:r.v}}
let faces=st.sm==='f'&&st.sel.f.size?[...st.sel.f]:null
let r={f:faces||[]}
for(let i=0;i<p.cuts;i++){r=VM().subdivideFaces(m,faces);faces=st.sm==='f'&&st.sel.f.size?r.f:null}
return st.sm==='f'&&st.sel.f.size?{f:r.f}:null
}})
def('merge',{label:'Merge',ic:'merge',key:'M',tip:'Combine the selected points into one.',params:[{k:'mode',label:'At',choices:['center','first','last'],def:'center'}],run(m,p){
const vs=[...getVerts()]
need1(vs.length>=2?1:0,'Select two or more points to merge')
const r=VM().mergeVerts(m,vs,p.mode)
return r?{v:r.v}:null
}})
def('dissolve',{label:'Dissolve',ic:'dissolve',key:'Ctrl+X',tip:'Remove points or edges but keep the surface closed.',params:[],run(m){
if(st.sm==='e'){need1(st.sel.e.size,'Select some edges');VM().dissolveEdges(m,[...st.sel.e]);return null}
if(st.sm==='v'){need1(st.sel.v.size,'Select some points');VM().dissolveVerts(m,[...st.sel.v]);return null}
throw new Error('Dissolve works on points or edges')
}})
def('delete',{label:'Delete',ic:'trash',key:'X',tip:'Delete the selected points, edges or faces.',params:[],run(m){
if(st.sm==='f'){need1(st.sel.f.size,'Select some faces');VM().deleteFaces(m,[...st.sel.f])}
else if(st.sm==='e'){need1(st.sel.e.size,'Select some edges');VM().deleteEdges(m,[...st.sel.e])}
else{need1(st.sel.v.size,'Select some points');VM().deleteVerts(m,[...st.sel.v])}
return null
}})
def('fill',{label:'Fill',ic:'fillf',key:'F',tip:'Close a ring of selected edges with a new face.',params:[],run(m){
need1(st.sel.e.size,'Select a closed ring of edges, then Fill')
return{f:VM().fill(m,[...st.sel.e]).f}
}})
def('bridge',{label:'Bridge',ic:'bridge',key:'',tip:'Connect two selected edge loops with faces.',params:[],run(m){
need1(st.sel.e.size,'Select two edge loops, then Bridge')
return{f:VM().bridge(m,[...st.sel.e]).f}
}})
def('connect',{label:'Connect',ic:'knife',key:'J',tip:'Cut a line between two selected corners of one face.',params:[],run(m){
const vs=[...st.sel.v]
if(st.sm!=='v'||vs.length!==2)throw new Error('Select exactly two points on the same face')
const r=VM().connect(m,vs[0],vs[1]);return{v:vs}
}})
def('flip',{label:'Flip normals',ic:'flipn',key:'',tip:'Turn the selected faces inside out.',params:[],run(m){
VM().flip(m,st.mode==='object'||!st.sel.f.size&&st.sm!=='f'?null:[...getFaces()]);return null
}})
def('smoothv',{label:'Relax',ic:'drop',key:'',tip:'Even out the selected points to smooth lumps.',params:[{k:'k',label:'Strength',min:0.05,max:1,step:0.05,def:0.5},{k:'iter',label:'Repeat',min:1,max:20,step:1,def:2}],run(m,p){
const vs=selCount()?[...getVerts()]:null
VM().smoothVerts(m,vs,p.k,p.iter);return null
}})
def('triangulate',{label:'Triangulate',ic:'face',key:'',tip:'Turn many-sided faces into triangles.',params:[],run(m){VM().triangulate(m,selCount()&&st.sm==='f'?[...st.sel.f]:null);return null}})
def('duplicate',{label:'Duplicate',ic:'copy',key:'Shift+D',tip:'Copy the selected faces.',params:[],after:'g',run(m){
if(st.sm!=='f')throw new Error('Select faces to duplicate')
need1(st.sel.f.size,'Select some faces to duplicate')
const map=new Map(),nf=[]
for(const fi of st.sel.f){const f=m.f[fi].map(i=>{if(!map.has(i))map.set(i,m.v.push(m.v[i].slice())-1);return map.get(i)});nf.push(VM().addFace(m,f,m.fm[fi]))}
return{f:nf}
}})
def('recalc',{label:'Fix normals',ic:'flipn',key:'Shift+N',tip:'Make every face point outward.',params:[],run(m){VM().recalc(m);return null}})
def('center',{label:'Center model',ic:'target',key:'',tip:'Move the model so its middle sits at the origin.',params:[],run(m){
const b=VM().bbox(m),c=[(b.min[0]+b.max[0])/2,(b.min[1]+b.max[1])/2,(b.min[2]+b.max[2])/2]
VM().xform(m,p=>[p[0]-c[0],p[1]-c[1],p[2]-c[2]]);return null
}})
def('floor',{label:'Sit on floor',ic:'target',key:'',tip:'Move the model up or down so its bottom touches y = 0.',params:[],run(m){
const b=VM().bbox(m);VM().xform(m,p=>[p[0],p[1]-b.min[1],p[2]]);return null
}})
function runOp(id,p0){
const op=OPS[id]
try{
const params={}
for(const q of op.params)params[q.k]=p0&&p0[q.k]!==undefined?p0[q.k]:q.def
const snap=snapshot()
const before=st.last
pushUndo()
const m=st.cur.mesh
const r=op.run(m,params)
VM().tidy(m)
st.last={id,params,snap}
if(r)setSel(r);else clearSel()
changed();attachGizmo()
if(op.after==='g')startModal('g')
else if(op.modal&&!p0&&selCount()&&st.mode==='edit')liveParam(op)
}catch(x){
if(st.undo.length&&before===st.last)st.undo.pop()
toast(x.message,'warn')
}
}
function reapply(){
const l=st.last
if(!l)return
const op=OPS[l.id]
const s=l.snap
st.cur.mesh=structuredClone(s.mesh);st.cur.mods=structuredClone(s.mods)
st.sel={v:new Set(s.sel.v),e:new Set(s.sel.e),f:new Set(s.sel.f)};st.sm=s.sm
try{
const r=op.run(st.cur.mesh,l.params)
VM().tidy(st.cur.mesh)
if(r)setSel(r);else clearSel()
}catch(x){toast(x.message,'warn')}
invalidate();updateOverlay();attachGizmo();refreshUI(true);scheduleSave()
}
let live=null
function liveParam(op){
const q=op.params.find(p=>p.k===op.modal)
if(!q)return
live={op,q,x0:mouse.x,v0:q.def}
setHint('Move the mouse to set '+q.label.toLowerCase()+'. Click to confirm, Esc to cancel.')
}
function liveMove(){
const{op,q,x0,v0}=live
const span=q.max-q.min,v=Math.max(q.min,Math.min(q.max,v0+(mouse.x-x0)/400*span))
st.last.params[q.k]=Math.round(v/q.step)*q.step
reapply()
setHint(q.label+': '+r3(st.last.params[q.k])+'. Click to confirm, Esc to cancel.')
}
function endLive(ok){
if(!live)return
const l=live
live=null
if(!ok){st.undo.pop();restore(st.last.snap)}
setHint('');refreshUI()
}
function addPrimitive(kind,o){
pushUndo()
const m=st.cur.mesh,p=VM().primitive(kind,o||{}),base=m.v.length,mo=m.mats.length
const sel=new Set()
p.v.forEach(q=>{m.v.push(q.slice())})
p.f.forEach((f,i)=>{m.f.push(f.map(x=>x+base));m.fm.push(Math.min(st.matIdx,m.mats.length-1))})
for(let i=base;i<m.v.length;i++)sel.add(i)
st.mode='edit'
st.sm='f'
clearSel()
for(let i=m.f.length-p.f.length;i<m.f.length;i++)st.sel.f.add(i)
st.last=null
changed();attachGizmo()
if(!st.tool||st.tool==='select'){st.tool='move';refreshUI()}
}
function setTool(t){
st.tool=t
knifeA=null
if(t==='loopcut'||t==='knife'||t==='paint'){if(st.mode==='object')st.mode='edit'}
refreshUI();attachGizmo();setHint('')
}
function setBrush(k){st.br.kind=k;st.mode='sculpt';st.tool='sculpt';refreshUI();attachGizmo()}
function loopCutAt(k,face,t){
const e=getTopo().em.get(k)
if(!e)return
pushUndo()
const m=st.cur.mesh
try{
const r=VM().loopCut(m,face,e.a,e.b,cutOpt.cuts,cutOpt.t)
VM().tidy(m)
st.sm='e';clearSel()
for(const q of r.e)st.sel.e.add(q)
st.last={id:'loopcut',params:{cuts:cutOpt.cuts,t:cutOpt.t},snap:null}
changed();attachGizmo()
}catch(x){st.undo.pop();toast(x.message,'warn')}
}
const cutOpt={cuts:1,t:0.5}
function paintFace(f){
if(f<0)return
const m=st.cur.mesh
if(m.fm[f]===st.matIdx)return
m.fm[f]=st.matIdx
invalidate();updateOverlay()
}
function sculptDab(hp,n,kind,mx,my,ctx){
const m=st.cur.mesh,r=st.br.r,s=st.br.s
const maps=[]
const apply=(P,N)=>{
const vs=ctx.verts
for(let i=0;i<m.v.length;i++){
const p=m.v[i],dx=p[0]-P[0],dy=p[1]-P[1],dz=p[2]-P[2],d=Math.hypot(dx,dy,dz)
if(d>=r)continue
const f=Math.pow(1-d/r,2)*s
if(kind==='draw')m.v[i]=[p[0]+N[0]*f*r*0.3,p[1]+N[1]*f*r*0.3,p[2]+N[2]*f*r*0.3]
else if(kind==='inflate'){const q=ctx.vn[i];m.v[i]=[p[0]+q[0]*f*r*0.3,p[1]+q[1]*f*r*0.3,p[2]+q[2]*f*r*0.3]}
else if(kind==='flatten'){const dd=dx*N[0]+dy*N[1]+dz*N[2];m.v[i]=[p[0]-N[0]*dd*f,p[1]-N[1]*dd*f,p[2]-N[2]*dd*f]}
else if(kind==='smooth'){const nb=ctx.nb[i];if(nb&&nb.length){let c=[0,0,0];for(const j of nb){c[0]+=m.v[j][0];c[1]+=m.v[j][1];c[2]+=m.v[j][2]}c=[c[0]/nb.length,c[1]/nb.length,c[2]/nb.length];const k=Math.min(1,f*1.5);m.v[i]=[p[0]+(c[0]-p[0])*k,p[1]+(c[1]-p[1])*k,p[2]+(c[2]-p[2])*k]}}
}
}
apply(hp,n)
for(let a=0;a<3;a++)if(st.mir[a]){const P=hp.slice(),N=n.slice();P[a]=-P[a];N[a]=-N[a];apply(P,N)}
}
function neighbors(m){
const nb=Array.from({length:m.v.length},()=>new Set())
for(const f of m.f)for(let i=0;i<f.length;i++){nb[f[i]].add(f[(i+1)%f.length]);nb[f[(i+1)%f.length]].add(f[i])}
return nb.map(s=>[...s])
}
function startSculpt(x,y,shift){
const r=mouseRay(x,y),hit=raycast(r.o,r.d)
if(!hit)return false
pushUndo()
const m=st.cur.mesh
const kind=shift?'smooth':st.br.kind
const ctx={vn:VM().vnormals(m),nb:neighbors(m),n:0}
drag={type:'sculpt',kind,ctx,last:{x,y},hit}
if(kind==='grab'){
const verts=new Map()
for(let i=0;i<m.v.length;i++){const d=Math.hypot(m.v[i][0]-hit.p[0],m.v[i][1]-hit.p[1],m.v[i][2]-hit.p[2]);if(d<st.br.r)verts.set(i,[m.v[i].slice(),Math.pow(1-d/st.br.r,2)])}
drag.grab={verts,p0:hit.p,x0:x,y0:y}
}else sculptStroke(x,y)
return true
}
function sculptStroke(x,y){
const r=mouseRay(x,y),hit=raycast(r.o,r.d)
if(!hit)return
const m=st.cur.mesh,f=m.f[hit.face],n=VM().fn(m,f)
const c=drag.ctx
if(++c.n%6===0)c.vn=VM().vnormals(m)
sculptDab(hit.p,n,drag.kind,x,y,c)
invalidate();updateOverlay()
}
function grabMove(x,y){
const g=drag.grab,m=st.cur.mesh
const dist=cam.position.distanceTo(new (T().Vector3)(...g.p0)),sc2=2*dist*Math.tan(cam.fov*Math.PI/360)/H
const right=new (T().Vector3)().setFromMatrixColumn(cam.matrixWorld,0),up=new (T().Vector3)().setFromMatrixColumn(cam.matrixWorld,1)
const d=right.multiplyScalar((x-g.x0)*sc2).add(up.multiplyScalar(-(y-g.y0)*sc2))
for(const[i,[p,w]]of g.verts)m.v[i]=[p[0]+d.x*w*st.br.s*2.5,p[1]+d.y*w*st.br.s*2.5,p[2]+d.z*w*st.br.s*2.5]
invalidate();updateOverlay()
}
function rebuildGeo(){
const T3=T(),m=st.mode==='edit'||st.mode==='sculpt'?st.cur.mesh:evaluated()
disp=VM().render(m)
const geo=new T3.BufferGeometry(),col=new Float32Array(disp.count*9)
for(let t=0;t<disp.count;t++){
const mt=m.mats[Math.min(m.mats.length-1,m.fm[disp.tf[t]]||0)],c=new T3.Color(mt.color)
for(let k=0;k<3;k++){col[t*9+k*3]=c.r;col[t*9+k*3+1]=c.g;col[t*9+k*3+2]=c.b}
}
geo.setAttribute('position',new T3.BufferAttribute(disp.pos,3))
geo.setAttribute('normal',new T3.BufferAttribute(disp.nrm,3))
geo.setAttribute('color',new T3.BufferAttribute(col,3))
if(baseMesh.geometry)baseMesh.geometry.dispose()
baseMesh.geometry=geo
baseMesh.material.wireframe=st.wire
baseMesh.visible=true
const edit=st.mode!=='object'
if(edit&&st.cur.mods.length&&st.cur.mods.some(d=>d.on!==false)){
const e=evaluated(),r=VM().render(e),g2=new T3.BufferGeometry()
g2.setAttribute('position',new T3.BufferAttribute(r.pos,3))
g2.setAttribute('normal',new T3.BufferAttribute(r.nrm,3))
if(ghost.geometry)ghost.geometry.dispose()
ghost.geometry=g2;ghost.visible=true
}else ghost.visible=false
st.geo=false
}
const C_EDGE=[0.32,0.32,0.34],C_SEL=[1,1,1],C_VERT=[0.55,0.55,0.58],C_RING=[0.4,0.7,1]
function updateOverlay(){
if(!sc||!st.cur)return
const T3=T(),m=st.cur.mesh
if(st.geo)rebuildGeo()
const edit=st.mode==='edit'&&st.shown
edgeLines.visible=edit;vertPts.visible=edit&&st.sm==='v';selMesh.visible=edit
if(!edit){need=true;return}
const keys=getTopo().keys,ep=new Float32Array(keys.length*6),ec=new Float32Array(keys.length*6)
const se=getEdges()
keys.forEach((k,i)=>{
const a=m.v[VM().ka(k)],b=m.v[VM().kb(k)],c=se.has(k)?C_SEL:C_EDGE
ep.set(a,i*6);ep.set(b,i*6+3);ec.set(c,i*6);ec.set(c,i*6+3)
})
let g=edgeLines.geometry
g.setAttribute('position',new T3.BufferAttribute(ep,3));g.setAttribute('color',new T3.BufferAttribute(ec,3))
g.computeBoundingSphere()
if(st.sm==='v'){
const n=m.v.length,vp=new Float32Array(n*3),vc=new Float32Array(n*3),sv=st.sel.v
for(let i=0;i<n;i++){vp.set(m.v[i],i*3);vc.set(sv.has(i)?C_SEL:C_VERT,i*3)}
g=vertPts.geometry
g.setAttribute('position',new T3.BufferAttribute(vp,3));g.setAttribute('color',new T3.BufferAttribute(vc,3))
g.computeBoundingSphere()
}
const fs=getFaces(),tris=[]
for(const fi of fs)for(const t of VM().tri(m,m.f[fi]))for(const i of t)tris.push(...m.v[i])
g=selMesh.geometry
g.setAttribute('position',new T3.BufferAttribute(new Float32Array(tris),3))
g.computeBoundingSphere()
if(hover&&hover.ring){
const rp=[]
for(const k of hover.ring){rp.push(...m.v[VM().ka(k)],...m.v[VM().kb(k)])}
ringLines.geometry.setAttribute('position',new T3.BufferAttribute(new Float32Array(rp),3));ringLines.visible=true
}else ringLines.visible=false
need=true
}
function setupScene(){
const T3=T()
sc=new T3.Scene()
cam=new T3.PerspectiveCamera(45,1,0.01,1000)
rd=new T3.WebGLRenderer({canvas:cv,antialias:true,alpha:false})
rd.setPixelRatio(Math.min(2,window.devicePixelRatio||1))
const amb=new T3.HemisphereLight(0xffffff,0x555560,0.9),dl=new T3.DirectionalLight(0xffffff,0.8)
dl.position.set(3,6,4)
sc.add(amb,dl)
gridObj=new T3.GridHelper(20,40,0x4a4a4a,0x2c2c2c)
sc.add(gridObj)
const ax=(a,b,c)=>{const g=new T3.BufferGeometry().setFromPoints([new T3.Vector3(...a),new T3.Vector3(...b)]);const l=new T3.Line(g,new T3.LineBasicMaterial({color:c}));sc.add(l)}
ax([-10,0,0],[10,0,0],0x8a3a3a);ax([0,0,-10],[0,0,10],0x3a5a8a);ax([0,0,0],[0,5,0],0x3a8a4a)
baseMesh=new T3.Mesh(new T3.BufferGeometry(),new T3.MeshStandardMaterial({vertexColors:true,roughness:0.75,metalness:0,polygonOffset:true,polygonOffsetFactor:1,polygonOffsetUnits:1}))
sc.add(baseMesh)
ghost=new T3.Mesh(new T3.BufferGeometry(),new T3.MeshStandardMaterial({color:0x9ab8ff,transparent:true,opacity:0.28,depthWrite:false,roughness:0.6}))
ghost.visible=false;sc.add(ghost)
edgeLines=new T3.LineSegments(new T3.BufferGeometry(),new T3.LineBasicMaterial({vertexColors:true}))
sc.add(edgeLines)
vertPts=new T3.Points(new T3.BufferGeometry(),new T3.PointsMaterial({size:6,vertexColors:true,sizeAttenuation:false}))
sc.add(vertPts)
selMesh=new T3.Mesh(new T3.BufferGeometry(),new T3.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0.22,depthWrite:false,side:T3.DoubleSide,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1}))
sc.add(selMesh)
ringLines=new T3.LineSegments(new T3.BufferGeometry(),new T3.LineBasicMaterial({color:0x66b3ff,depthTest:false}))
ringLines.visible=false;sc.add(ringLines)
brushRing=new T3.Mesh(new T3.RingGeometry(0.97,1,48),new T3.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0.8,side:T3.DoubleSide,depthTest:false}))
brushRing.visible=false;sc.add(brushRing)
pivot=new T3.Object3D();sc.add(pivot)
tc=new root.TransformControls(cam,cv)
tc.setSize(0.8)
sc.add(tc)
tc.addEventListener('mouseDown',()=>{if(!modal)beginXf()})
tc.addEventListener('objectChange',gizmoChange)
tc.addEventListener('mouseUp',()=>{if(!modal)endXf()})
}
function placeCam(){
const y=V.yaw*Math.PI/180,p=V.pitch*Math.PI/180
cam.position.set(V.t[0]+V.dist*Math.cos(p)*Math.sin(y),V.t[1]+V.dist*Math.sin(p),V.t[2]+V.dist*Math.cos(p)*Math.cos(y))
cam.lookAt(V.t[0],V.t[1],V.t[2])
cam.updateMatrixWorld();camVer++;scr=null;need=true
}
function frame(){
const b=VM().bbox(st.cur.mesh),c=[(b.min[0]+b.max[0])/2,(b.min[1]+b.max[1])/2,(b.min[2]+b.max[2])/2]
const r=Math.max(0.3,Math.hypot(b.max[0]-b.min[0],b.max[1]-b.min[1],b.max[2]-b.min[2])/2)
V.t=c;V.dist=r*2.6;placeCam()
}
function view(yaw,pitch){V.yaw=yaw;V.pitch=pitch;placeCam()}
function resize(){
if(!cv||!dom.vp)return
const w=dom.vp.clientWidth,hh=dom.vp.clientHeight
if(w<2||hh<2)return
W=w;H=hh
rd.setSize(w,hh,false)
cv.style.width=w+'px';cv.style.height=hh+'px'
cam.aspect=w/hh;cam.updateProjectionMatrix();placeCam()
}
let rafOn=false
function loop(){
if(!st.shown){rafOn=false;return}
if(need){
need=false
if(st.geo){updateOverlay()}
const bg=getComputedStyle(document.body).getPropertyValue('--bg0').trim()||'#0a0a0a'
rd.setClearColor(bg)
if(tc&&tc.object)pivot.updateMatrixWorld()
rd.render(sc,cam)
}
requestAnimationFrame(loop)
}
function startLoop(){if(!rafOn){rafOn=true;need=true;requestAnimationFrame(loop)}}
function bindEvents(){
const rel=e=>{const r=cv.getBoundingClientRect();return[e.clientX-r.left,e.clientY-r.top]}
cv.addEventListener('contextmenu',e=>e.preventDefault())
cv.addEventListener('wheel',e=>{
e.preventDefault()
V.dist=Math.max(0.05,Math.min(500,V.dist*Math.exp(e.deltaY*0.0012)));placeCam()
},{passive:false})
cv.addEventListener('pointerdown',e=>{
cv.focus()
const[x,y]=rel(e)
mouse.x=x;mouse.y=y
if(live){endLive(e.button===0);return}
if(modal){endModal(e.button===0);return}
if(tc&&tc.dragging)return
if(e.button===2||e.button===1||(e.button===0&&e.code==='Space')){
drag={type:'orbit',x,y,pan:e.shiftKey||e.button===1&&e.shiftKey,yaw:V.yaw,pitch:V.pitch,t:V.t.slice()}
cv.setPointerCapture(e.pointerId);return
}
if(e.button!==0)return
if(st.mode==='sculpt'){if(startSculpt(x,y,e.shiftKey))cv.setPointerCapture(e.pointerId);return}
if(st.tool==='paint'){pushUndo();drag={type:'paint'};paintFace(pickFace(x,y));cv.setPointerCapture(e.pointerId);return}
if(st.tool==='loopcut'){if(hover&&hover.edge)loopCutAt(hover.edge.k,hover.face,0.5);return}
if(st.tool==='knife'){
const i=pickVert(x,y)
if(i<0)return
if(knifeA===null){knifeA=i;st.sm='v';clearSel();st.sel.v.add(i);updateOverlay();setHint('')}
else{
const a=knifeA;knifeA=null
if(a!==i){pushUndo();try{const r=VM().connect(st.cur.mesh,a,i);clearSel();st.sel.v.add(a);st.sel.v.add(i);changed()}catch(x2){st.undo.pop();toast(x2.message,'warn')}}
setHint('')
}
return
}
drag={type:'box',x0:x,y0:y,x,y,ext:e.shiftKey,alt:e.altKey,ctrl:e.ctrlKey||e.metaKey,moved:false}
cv.setPointerCapture(e.pointerId)
})
cv.addEventListener('pointermove',e=>{
const[x,y]=rel(e)
mouse.x=x;mouse.y=y
if(live){liveMove();return}
if(modal){modalApply();return}
if(drag){
if(drag.type==='orbit'){
const dx=x-drag.x,dy=y-drag.y
if(drag.pan||e.shiftKey){
const sc2=2*V.dist*Math.tan(cam.fov*Math.PI/360)/H
const right=new (T().Vector3)().setFromMatrixColumn(cam.matrixWorld,0),up=new (T().Vector3)().setFromMatrixColumn(cam.matrixWorld,1)
const d=right.multiplyScalar(-dx*sc2).add(up.multiplyScalar(dy*sc2))
V.t=[drag.t[0]+d.x,drag.t[1]+d.y,drag.t[2]+d.z]
}else{V.yaw=drag.yaw-dx*0.4;V.pitch=Math.max(-89,Math.min(89,drag.pitch+dy*0.4))}
placeCam()
}else if(drag.type==='box'){
drag.x=x;drag.y=y
if(Math.abs(x-drag.x0)>4||Math.abs(y-drag.y0)>4)drag.moved=true
showBox()
}else if(drag.type==='sculpt'){
if(drag.kind==='grab')grabMove(x,y);else sculptStroke(x,y)
}else if(drag.type==='paint')paintFace(pickFace(x,y))
return
}
if(st.mode==='sculpt'){
const r=mouseRay(x,y),h2=raycast(r.o,r.d)
if(h2){
const m=st.cur.mesh,n=VM().fn(m,m.f[h2.face])
brushRing.visible=true;brushRing.position.set(...h2.p)
brushRing.lookAt(h2.p[0]+n[0],h2.p[1]+n[1],h2.p[2]+n[2])
brushRing.scale.setScalar(st.br.r)
}else brushRing.visible=false
need=true
return
}
if(st.tool==='loopcut'&&st.mode==='edit'){
const ed=pickEdge(x,y)
let nh=null
if(ed){
const e2=getTopo().em.get(ed.k)
const face=e2.f.find(f=>st.cur.mesh.f[f].length===4)
if(face!==undefined){const ring=VM().ringEdges(st.cur.mesh,face,e2.a,e2.b);nh={edge:ed,face,ring:ring}}
}
if(!hover&&!nh||hover&&nh&&hover.edge.k===nh.edge.k)return
hover=nh;updateOverlay()
}
})
cv.addEventListener('pointerup',e=>{
if(live)return
if(drag){
const d=drag
drag=null
try{cv.releasePointerCapture(e.pointerId)}catch(x){}
if(dom.box)dom.box.style.display='none'
if(d.type==='box'){
if(d.moved)boxSelect(d.x0,d.y0,d.x,d.y,d.ext)
else clickSelect(d.x0,d.y0,d.ext,d.alt,d.ctrl)
}else if(d.type==='sculpt'||d.type==='paint'){changed()}
}
})
cv.addEventListener('pointerleave',()=>{if(brushRing){brushRing.visible=false;need=true}})
}
function showBox(){
if(!drag||drag.type!=='box'||!drag.moved){if(dom.box)dom.box.style.display='none';return}
const b=dom.box
b.style.display='block'
b.style.left=Math.min(drag.x0,drag.x)+'px';b.style.top=Math.min(drag.y0,drag.y)+'px'
b.style.width=Math.abs(drag.x-drag.x0)+'px';b.style.height=Math.abs(drag.y-drag.y0)+'px'
}
const KEYS={
'1':()=>setSelMode('v'),'2':()=>setSelMode('e'),'3':()=>setSelMode('f')
}
function onKey(e){
if(!st.shown||!st.cur)return
const t=e.target
if(t&&(t.tagName==='INPUT'||t.tagName==='TEXTAREA'||t.tagName==='SELECT'||t.isContentEditable))return
const k=e.key,ctrl=e.ctrlKey||e.metaKey
if(live){if(k==='Escape'){endLive(false);e.preventDefault()}else if(k==='Enter'){endLive(true);e.preventDefault()}return}
if(modal){
e.preventDefault();e.stopPropagation()
if(k==='Escape')endModal(false)
else if(k==='Enter')endModal(true)
else if(/^[xyzXYZ]$/.test(k)){modal.axis=modal.axis===k.toLowerCase()?null:k.toLowerCase();modalApply()}
else if(/^[0-9.\-]$/.test(k)){modal.buf+=k;modalApply()}
else if(k==='Backspace'){modal.buf=modal.buf.slice(0,-1);modalApply()}
return
}
if(ctrl&&k.toLowerCase()==='z'){e.preventDefault();e.stopPropagation();e.shiftKey?redo():undo();return}
if(ctrl&&k.toLowerCase()==='y'){e.preventDefault();e.stopPropagation();redo();return}
if(ctrl&&k.toLowerCase()==='s'){e.preventDefault();e.stopPropagation();commit(true);return}
if(ctrl&&k.toLowerCase()==='b'){e.preventDefault();e.stopPropagation();runOp('bevel');return}
if(ctrl&&k.toLowerCase()==='i'){e.preventDefault();e.stopPropagation();invertSel();return}
if(ctrl&&k.toLowerCase()==='r'){e.preventDefault();e.stopPropagation();setTool('loopcut');return}
if(ctrl)return
const K2=k.toLowerCase()
if(k==='Tab'){e.preventDefault();setMode(st.mode==='edit'?'object':'edit');return}
if(k==='Escape'){if(knifeA!==null){knifeA=null;setHint('')}return}
if(k==='Home'||k==='.'){frame();return}
if(k==='['){st.br.r=Math.max(0.02,st.br.r/1.2);refreshUI();return}
if(k===']'){st.br.r=Math.min(5,st.br.r*1.2);refreshUI();return}
if(e.altKey&&K2==='a'){clearSel();updateOverlay();refreshUI();attachGizmo();return}
if(K2==='a'&&!e.shiftKey){selectAll();return}
if(e.shiftKey&&K2==='a'){e.preventDefault();showAdd();return}
if(e.shiftKey&&K2==='d'){runOp('duplicate');return}
if(e.shiftKey&&K2==='n'){runOp('recalc');return}
if(KEYS[k]&&st.mode!=='object'){KEYS[k]();return}
if(K2==='g'&&!st.simple){startModal('g');return}
if(K2==='r'&&!st.simple){startModal('r');return}
if(K2==='s'&&!st.simple&&!e.shiftKey){startModal('s');return}
if(st.simple){
if(K2==='w'){setTool('move');return}
if(K2==='e'&&!OPS.extrude){return}
if(K2==='r'){setTool('rotate');return}
if(K2==='s'){setTool('scale');return}
if(K2==='q'){setTool('select');return}
if(K2==='e'){runOp('extrude');return}
}else{if(K2==='e'){runOp('extrude');return}}
if(K2==='i'){runOp('inset');return}
if(K2==='x'||k==='Delete'){runOp('delete');return}
if(K2==='m'){runOp('merge');return}
if(K2==='f'){runOp('fill');return}
if(K2==='j'||K2==='k'){runOp('connect');return}
if(K2==='l'&&hover){return}
}
function showAdd(){
const back=h('div',{class:'stmenu',style:'left:'+Math.min(mouse.x+60,W-200)+'px;top:'+Math.min(mouse.y+40,H-340)+'px'})
back.append(h('div',{class:'sth',text:'Add shape'}))
for(const[k,n]of SHAPES)back.append(h('button',{text:n,onclick:()=>{back.remove();addPrimitive(k)}}))
dom.vp.append(back)
const off=e=>{if(!back.contains(e.target)){back.remove();document.removeEventListener('pointerdown',off,true)}}
setTimeout(()=>document.addEventListener('pointerdown',off,true),0)
}
function defaults(){return{name:'Model',mesh:VM().primitive('cube',{size:1}),mods:[]}}
function specOf(){
const mesh=VM().sanitize(st.cur.mesh),mods=VM().sanitizeMods(st.cur.mods)
return{v:1,name:st.cur.name,pivot:[0,0,0],parts:[{type:'mesh',name:'Mesh',mesh,mods}]}
}
function commit(toastIt){
clearTimeout(saveT)
if(!st.cur||!host)return
try{
const spec=root.VueModel.validate(specOf())
host.assets()[st.cur.name]={type:'model',spec}
host.changed(st.cur.name)
if(toastIt)toast('Saved '+st.cur.name,'ok')
}catch(x){toast(x.message,'warn')}
}
function openAsset(name){
const a=host.assets()[name]
if(!a||a.type!=='model')return
let mesh,mods=[]
const parts=a.spec.parts||[]
if(parts.length===1&&parts[0].type==='mesh'){mesh=structuredClone(parts[0].mesh);mods=structuredClone(parts[0].mods||[])}
else{
const b=root.VueModel.bake(a.spec)
mesh=VM().fromTris(b.meshes)
toast('Converted '+name+' to an editable mesh. Saving replaces its original parts.','info')
}
st.cur={name,mesh,mods}
resetSession()
}
function newModel(kind,name){
const nm=uniq(name||'Model')
const mesh=VM().primitive(kind||'cube',{size:1})
st.cur={name:nm,mesh,mods:[]}
host.assets()[nm]={type:'model',spec:root.VueModel.validate(specOf())}
resetSession()
host.changed(nm)
}
function uniq(base){
const a=host.assets()
let n=base,i=2
while(a[n])n=base+' '+i++
return n
}
function resetSession(){
st.undo=[];st.redo=[];st.last=null;clearSel();st.mode='edit';st.sm='f';st.tool='move';st.matIdx=0;knifeA=null;hover=null
invalidate()
if(cam){frame();updateOverlay();attachGizmo()}
refreshUI(false,true)
}
async function importFile(addTo){
const inp=h('input',{type:'file',accept:'.glb,.obj'})
inp.onchange=async()=>{
const f=inp.files[0]
if(!f)return
try{
let m
const base=f.name.replace(/\.[^.]*$/,'')
if(/\.obj$/i.test(f.name))m=VM().fromOBJ(await f.text())
else m=VM().fromGLB(new Uint8Array(await f.arrayBuffer()))
if(addTo&&st.cur){
pushUndo()
const j=VM().join(st.cur.mesh,m);st.cur.mesh=j;changed();toast('Added '+f.name,'ok')
}else{
const nm=uniq(base)
st.cur={name:nm,mesh:m,mods:[]}
host.assets()[nm]={type:'model',spec:root.VueModel.validate(specOf())}
resetSession();host.changed(nm);frame()
}
}catch(x){toast('Could not import: '+x.message,'warn')}
}
inp.click()
}
function download(name,data,type){
const u=URL.createObjectURL(new Blob([data],{type}))
const a=h('a',{href:u,download:name})
document.body.append(a);a.click();a.remove()
setTimeout(()=>URL.revokeObjectURL(u),2000)
}
function exportGLB(){commit();download(st.cur.name.replace(/[^\w.\- ]+/g,'')+'.glb',root.VueModel.toGLB(specOf()),'model/gltf-binary')}
function exportOBJ(){download(st.cur.name.replace(/[^\w.\- ]+/g,'')+'.obj',VM().toOBJ(evaluated(),st.cur.name),'text/plain')}
const MODS={
mirror:{label:'Mirror',tip:'Copy the model across an axis so you only model half.',def:{type:'mirror',axis:0},fields:[{k:'axis',label:'Axis',choices:[[0,'X'],[1,'Y'],[2,'Z']]}]},
array:{label:'Array',tip:'Repeat the model in a line.',def:{type:'array',count:3,off:[1.2,0,0],rot:[0,0,0],merge:0},fields:[{k:'count',label:'Count',min:1,max:50,step:1},{k:'off',label:'Offset',vec:true},{k:'rot',label:'Rotate each',vec:true},{k:'merge',label:'Merge gap',min:0,max:0.5,step:0.005}]},
subsurf:{label:'Smooth surface',tip:'Round everything off by subdividing and smoothing.',def:{type:'subsurf',level:1},fields:[{k:'level',label:'Level',min:0,max:3,step:1}]},
solidify:{label:'Thickness',tip:'Give a flat surface thickness, or hollow out a solid.',def:{type:'solidify',t:0.1,off:-1},fields:[{k:'t',label:'Thickness',min:0.005,max:1,step:0.005},{k:'off',label:'Direction',choices:[[-1,'Inward'],[1,'Outward']]}]},
bevel:{label:'Round edges',tip:'Bevel every sharp edge automatically.',def:{type:'bevel',w:0.04,angle:30},fields:[{k:'w',label:'Width',min:0.002,max:0.3,step:0.002},{k:'angle',label:'Sharper than',min:5,max:120,step:1}]},
boolean:{label:'Cut or join',tip:'Cut a shape out of the model, or join another shape to it.',def:null,fields:[]},
decimate:{label:'Simplify',tip:'Reduce the number of faces.',def:{type:'decimate',ratio:0.5},fields:[{k:'ratio',label:'Keep',min:0.05,max:1,step:0.01}]},
smooth:{label:'Relax',tip:'Even out lumps.',def:{type:'smooth',k:0.5,iter:2},fields:[{k:'k',label:'Strength',min:0.05,max:1,step:0.05},{k:'iter',label:'Repeat',min:1,max:20,step:1}]},
triangulate:{label:'Triangulate',tip:'Convert every face to triangles.',def:{type:'triangulate'},fields:[]},
weld:{label:'Weld points',tip:'Merge points that sit on top of each other.',def:{type:'weld',d:0.0001},fields:[{k:'d',label:'Distance',min:0.00001,max:0.1,step:0.00001}]}
}
function addMod(key,extra){
let d=MODS[key].def?structuredClone(MODS[key].def):null
if(key==='boolean')d=Object.assign({type:'boolean',op:'difference'},extra)
pushUndo();st.cur.mods.push(d);changed()
}
function operand(kind,size,pos){
const m=VM().primitive(kind,{size});VM().xform(m,p=>[p[0]+pos[0],p[1]+pos[1],p[2]+pos[2]]);return m
}
function applyMods(){
if(!st.cur.mods.length)return
pushUndo()
st.cur.mesh=VM().clone(evaluated());st.cur.mods=[];clearSel();st.last=null;changed();attachGizmo()
}
const PRESETS=[
['Make smooth','Round the whole model off.',()=>{addMod('subsurf');st.cur.mesh.smooth=Math.max(st.cur.mesh.smooth,60)}],
['Round the edges','Bevel sharp edges and shade smoothly.',()=>{addMod('bevel');st.cur.mesh.smooth=40}],
['Make hollow','Hollow the model with a thin wall.',()=>addMod('solidify')],
['Add thickness','Give a flat shape some depth.',()=>{st.cur.mods.push({type:'solidify',t:0.1,off:1});pushUndo();changed()}],
['Make symmetrical','Model one half, get both.',()=>addMod('mirror')],
['Simplify','Fewer faces, lighter model.',()=>addMod('decimate')]
]
function field(label,node,tip){return h('div',{class:'stf',title:tip||''},h('label',{text:label}),node)}
function numIn(v,step,fn,min,max){
const i=h('input',{type:'number',step:step||0.01,value:r3(v),min,max})
i.addEventListener('change',()=>fn(parseFloat(i.value)||0))
return i
}
function sld(v,min,max,step,fn,live){
const wrap=h('div',{class:'stsl'}),r=h('input',{type:'range',min,max,step,value:v}),n=h('input',{type:'number',min,max,step,value:r3(v)})
r.addEventListener('input',()=>{n.value=r3(+r.value);if(live)fn(+r.value,true)})
r.addEventListener('change',()=>fn(+r.value))
n.addEventListener('change',()=>{r.value=n.value;fn(parseFloat(n.value)||0)})
wrap.append(r,n)
return wrap
}
function sel(opts,v,fn){
const s=h('select')
for(const[val,txt]of opts)s.append(h('option',{value:val,text:txt}))
s.value=v
s.addEventListener('change',()=>fn(s.value))
return s
}
function seg(items,cur,fn,cls){
const w=h('div',{class:'seg '+(cls||'')})
for(const[k,l,i,tip]of items)w.append(h('button',{class:k===cur?'on':'',title:tip||l,html:(i?ic(i,14):'')+(l?'<span>'+l+'</span>':''),onclick:()=>fn(k)}))
return w
}
function toolBtn(o){
const b=h('button',{class:'stt'+(o.on?' on':'')+(o.off?' off':''),title:o.tip+(o.key?' ('+o.key+')':''),onclick:o.fn,html:ic(o.ic,18)+'<span>'+o.label+'</span>'})
return b
}
function refreshUI(keepPanel,full){
if(!dom.root||!st.shown&&!full)return
buildHead();buildTools()
if(!keepPanel||full)buildSide()
if(dom.stats)dom.stats.textContent=statLine()
setHint('')
if(dom.start)dom.start.style.display=st.cur?'none':'flex'
if(!st.cur)buildStart()
}
function statLine(){
if(!st.cur)return''
const s=VM().stats(st.cur.mesh),e=st.cur.mods.length?VM().stats(evaluated()):null
return s.verts+' points · '+s.edges+' edges · '+s.faces+' faces · '+s.tris+' triangles'+(e?' (after modifiers: '+e.tris+')':'')
}
function buildHead(){
const hd=dom.head
hd.textContent=''
if(!st.cur)return
const name=h('input',{class:'stname',value:st.cur.name,spellcheck:'false',title:'Model name'})
name.addEventListener('change',()=>{
const nn=name.value.trim()
if(!nn||nn===st.cur.name){name.value=st.cur.name;return}
if(host.assets()[nn]){toast('That name is taken','warn');name.value=st.cur.name;return}
delete host.assets()[st.cur.name];st.cur.name=nn;commit()
})
hd.append(
h('button',{class:'btn sm',html:ic('chevr',12)+'<span>Models</span>',title:'Back to the model list',onclick:()=>{commit();st.cur=null;refreshUI()}}),
name,
seg([['object','Object',null,'Move, rotate and scale the whole model (Tab)'],['edit','Edit',null,'Edit points, edges and faces (Tab)'],['sculpt','Sculpt',null,'Push and pull the surface like clay']],st.mode,m=>{if(m==='sculpt'){setBrush(st.br.kind)}else{if(st.tool==='sculpt')st.tool='move';setMode(m)}}),
st.mode==='edit'?seg([['v','','vert','Points (1)'],['e','','edge','Edges (2)'],['f','','face','Faces (3)']],st.sm,setSelMode,'icons'):null,
h('span',{class:'stsp'}),
h('button',{class:'btn sm tg'+(st.xray?' on':''),title:'See through the model to select hidden parts',text:'See-through',onclick:()=>{st.xray=!st.xray;refreshUI()}}),
h('button',{class:'btn sm tg'+(st.wire?' on':''),title:'Show only the wires',text:'Wireframe',onclick:()=>{st.wire=!st.wire;invalidate();refreshUI()}}),
h('button',{class:'btn sm tg'+(st.snap?' on':''),title:'Snap movement to a grid',html:ic('magnet',13)+'<span>Snap</span>',onclick:()=>{st.snap=!st.snap;attachGizmo();refreshUI()}}),
h('span',{class:'stmir',title:'Mirror edits across an axis so both sides change together'},h('em',{text:'Mirror'}),...[0,1,2].map(a=>h('button',{class:'btn sm tg'+(st.mir[a]?' on':''),text:'XYZ'[a],onclick:()=>{st.mir[a]^=1;refreshUI()}}))),
seg([['p','Persp'],['f','Front'],['s','Side'],['t','Top']],null,k=>{if(k==='p')view(35,25);else if(k==='f')view(0,0);else if(k==='s')view(90,0);else view(0,89)}),
h('button',{class:'btn sm',html:ic('frame',13)+'<span>Frame</span>',title:'Fit the model in view (Home)',onclick:frame}),
h('button',{class:'btn sm primary',html:ic('save',13)+'<span>Save</span>',title:'Save into the project (Ctrl+S)',onclick:()=>commit(true)})
)
}
function buildTools(){
const t=dom.tools
t.textContent=''
if(!st.cur)return
const sec=(n)=>t.append(h('div',{class:'sth',text:n}))
sec('Move')
const tl=(id,label,i,tip,key)=>t.append(toolBtn({ic:i,label,tip,key,on:st.tool===id&&st.mode!=='sculpt',fn:()=>setTool(id)}))
tl('select','Select','selcur','Click or drag a box to select','Q')
tl('move','Move','move','Move the selection','W')
tl('rotate','Rotate','rotate','Rotate the selection','R')
tl('scale','Scale','scale','Scale the selection','S')
if(st.mode==='sculpt'){
sec('Brushes')
for(const[k,l,i,tip]of[['draw','Draw','sculpt','Push the surface outward'],['inflate','Inflate','drop','Puff the surface up along its normals'],['smooth','Smooth','dissolve','Relax lumps (hold Shift with any brush)'],['flatten','Flatten','plane','Level the surface'],['grab','Grab','grab','Drag a region of the surface']])t.append(toolBtn({ic:i,label:l,tip,on:st.br.kind===k,fn:()=>setBrush(k)}))
return
}
sec('Build')
const opb=(id,mode)=>{const o=OPS[id];t.append(toolBtn({ic:o.ic,label:o.label,tip:o.tip,key:o.key,off:mode===false,fn:()=>runOp(id)}))}
opb('extrude');opb('inset');opb('bevel')
t.append(toolBtn({ic:'loopcut',label:'Loop cut',tip:'Slice a ring around the model',key:'Ctrl+R',on:st.tool==='loopcut',fn:()=>setTool('loopcut')}))
t.append(toolBtn({ic:'knife',label:'Knife',tip:'Cut a line between two corners of a face',on:st.tool==='knife',fn:()=>setTool('knife')}))
opb('subdivide');opb('fill');opb('bridge')
sec('Clean up')
opb('merge');opb('dissolve');opb('delete');opb('flip');opb('smoothv')
sec('Paint')
t.append(toolBtn({ic:'brush',label:'Paint faces',tip:'Click faces to give them the chosen material',on:st.tool==='paint',fn:()=>setTool('paint')}))
t.append(toolBtn({ic:'plus',label:'Add shape',tip:'Add a new shape to the model',key:'Shift+A',fn:showAdd}))
}
function buildSide(){
const s=dom.side
s.textContent=''
if(!st.cur)return
const tabs=[['tool','Tool'],['mods','Modifiers'],['mat','Materials'],['info','Model']]
s.append(seg(tabs.map(([k,l])=>[k,l]),st.tab,k=>{st.tab=k;buildSide()},'tabs'))
const body=h('div',{class:'stbody2'})
s.append(body)
if(st.tab==='tool')toolPanel(body)
else if(st.tab==='mods')modPanel(body)
else if(st.tab==='mat')matPanel(body)
else infoPanel(body)
}
function toolPanel(b){
if(st.mode==='sculpt'){
b.append(h('h4',{text:'Brush'}),field('Size',sld(st.br.r,0.02,3,0.01,v=>{st.br.r=v})),field('Strength',sld(st.br.s,0.02,1,0.01,v=>{st.br.s=v})),h('p',{class:'stnote',text:'Sculpting needs plenty of faces. Use Edit mode, Subdivide a few times first. Mirror toggles in the top bar also work here.'}),h('button',{class:'btn sm',text:'Subdivide the whole model',onclick:()=>{st.mode='edit';clearSel();runOp('subdivide');st.mode='sculpt';refreshUI()}}))
return
}
const l=st.last
if(l&&OPS[l.id]&&l.snap){
const op=OPS[l.id]
b.append(h('h4',{text:op.label}),h('p',{class:'stnote',text:op.tip}))
for(const q of op.params){
if(q.choices)b.append(field(q.label,sel(q.choices.map(c=>[c,c]),l.params[q.k],v=>{l.params[q.k]=v;reapply()})))
else b.append(field(q.label,sld(l.params[q.k],q.min,q.max,q.step,(v,lv)=>{l.params[q.k]=v;reapply()},false)))
}
if(!op.params.length)b.append(h('p',{class:'stnote',text:'Applied. Undo with Ctrl+Z.'}))
}else if(l&&l.id==='loopcut'){
b.append(h('h4',{text:'Loop cut'}),h('p',{class:'stnote',text:'Applied. Choose the options below, then use the tool again.'}))
}
if(st.tool==='loopcut'){
b.append(h('h4',{text:'Loop cut'}),field('Cuts',sld(cutOpt.cuts,1,8,1,v=>{cutOpt.cuts=Math.round(v)})),field('Position',sld(cutOpt.t,0.05,0.95,0.01,v=>{cutOpt.t=v})))
}
if(st.mode==='edit'){
b.append(h('h4',{text:'Selection'}),h('div',{class:'stgrid'},
h('button',{class:'btn sm',text:'All',onclick:selectAll}),h('button',{class:'btn sm',text:'None',onclick:()=>{clearSel();updateOverlay();refreshUI();attachGizmo()}}),h('button',{class:'btn sm',text:'Invert',onclick:invertSel}),h('button',{class:'btn sm',text:'More',onclick:()=>growShrink(true)}),h('button',{class:'btn sm',text:'Less',onclick:()=>growShrink(false)})))
b.append(h('h4',{text:'Soft move'}),h('label',{class:'stck'},h('input',{type:'checkbox',checked:st.prop.on?'':null,onchange:e=>{st.prop.on=e.target.checked}}),h('span',{text:'Move nearby points too, with a smooth fade'})),field('Reach',sld(st.prop.r,0.05,5,0.05,v=>{st.prop.r=v})))
}
b.append(h('h4',{text:'Shortcuts'}),h('label',{class:'stck'},h('input',{type:'checkbox',checked:st.simple?'':null,onchange:e=>{st.simple=e.target.checked;refreshUI()}}),h('span',{text:'Simple keys: W move, E extrude, R rotate, S scale'})),h('p',{class:'stnote',text:st.simple?'Tab switches Object and Edit. 1, 2, 3 pick points, edges, faces. I inset, X delete, M merge, F fill, J connect.':'Blender style: G move, R rotate, S scale with X, Y, Z axis lock and typed numbers. E extrude, I inset, Ctrl+B bevel, Ctrl+R loop cut.'}))
}
function modPanel(b){
b.append(h('h4',{text:'Quick looks'}))
const g=h('div',{class:'stpre'})
for(const[n,t,fn]of PRESETS)g.append(h('button',{class:'btn sm',title:t,text:n,onclick:()=>{if(fn.length===0){const before=st.cur.mods.length;pushUndo();fn();if(st.cur.mods.length===before+0)undoFix();changed()}}}))
b.append(g)
b.append(h('h4',{text:'Stack'}))
st.cur.mods.forEach((d,i)=>{
const M=MODS[d.type]||{label:d.type,fields:[]}
const card=h('div',{class:'stmod'+(d.on===false?' off':'')})
card.append(h('div',{class:'stmh'},
h('button',{class:'ib',title:d.on===false?'Turn on':'Turn off',html:ic(d.on===false?'eyeoff':'eye',13),onclick:()=>{pushUndo();d.on=d.on===false;changed()}}),
h('b',{text:M.label}),h('span',{class:'stsp'}),
h('button',{class:'ib',title:'Move up',html:ic('chevu',12),onclick:()=>{if(i>0){pushUndo();const m=st.cur.mods;[m[i-1],m[i]]=[m[i],m[i-1]];changed()}}}),
h('button',{class:'ib',title:'Apply to the mesh for good',html:ic('check',13),onclick:()=>{pushUndo();const keep=st.cur.mods.slice(i+1),before=st.cur.mods.slice(0,i+1);const mesh=VM().evaluate({mesh:st.cur.mesh,mods:before});st.cur.mesh=mesh;st.cur.mods=keep;clearSel();changed();attachGizmo()}}),
h('button',{class:'ib',title:'Remove',html:ic('x',13),onclick:()=>{pushUndo();st.cur.mods.splice(i,1);changed()}})))
if(d.type==='boolean'){
card.append(field('Action',sel([['difference','Cut out'],['union','Join'],['intersect','Keep overlap']],d.op,v=>{pushUndo();d.op=v;changed()})))
card.append(h('p',{class:'stnote',text:'Shape: '+(d.mesh?d.mesh.f.length+' faces':'none')}))
}
for(const f of M.fields||[]){
if(f.choices)card.append(field(f.label,sel(f.choices,d[f.k],v=>{pushUndo();d[f.k]=+v;changed()})))
else if(f.vec)card.append(field(f.label,h('div',{class:'stvec'},...[0,1,2].map(a=>numIn(d[f.k][a],0.05,v=>{pushUndo();d[f.k][a]=v;changed()})))))
else card.append(field(f.label,sld(d[f.k],f.min,f.max,f.step,v=>{pushUndo();d[f.k]=v;changed()})))
}
b.append(card)
})
if(!st.cur.mods.length)b.append(h('p',{class:'stnote',text:'Modifiers change the model without touching your points. You can reorder, switch off, or apply them.'}))
b.append(h('h4',{text:'Add'}))
const sl=h('select',{class:'stadd'})
sl.append(h('option',{value:'',text:'Choose a modifier'}))
for(const k in MODS)sl.append(h('option',{value:k,text:MODS[k].label+(MODS[k].tip?' – '+MODS[k].tip:'')}))
sl.addEventListener('change',()=>{const k=sl.value;if(!k)return;if(k==='boolean')boolPanel(b);else addMod(k)})
b.append(sl)
if(st.cur.mods.length)b.append(h('button',{class:'btn sm',text:'Apply all',onclick:applyMods}))
}
function undoFix(){}
function boolPanel(b){
const box=h('div',{class:'stmod'})
const shape=sel(SHAPES.map(([k,n])=>[k,n]),'cube',()=>{}),size=numIn(0.6,0.05,()=>{},0.01,50),pos=[0.3,0.3,0.3].map(v=>numIn(v,0.05,()=>{}))
const assets=Object.keys(host.assets()).filter(k=>host.assets()[k].type==='model'&&k!==st.cur.name)
const src=sel([['shape','A new shape'],...assets.map(k=>['a:'+k,'Model: '+k])],'shape',()=>{})
box.append(h('b',{text:'Cut or join with'}),field('From',src),field('Shape',shape),field('Size',size),field('Position',h('div',{class:'stvec'},...pos)),field('Action',(box.op=sel([['difference','Cut out'],['union','Join'],['intersect','Keep overlap']],'difference',()=>{}))),h('button',{class:'btn sm primary',text:'Add',onclick:()=>{
try{
let mesh
if(src.value==='shape')mesh=operand(shape.value,parseFloat(size.value)||0.6,pos.map(i=>parseFloat(i.value)||0))
else{
const a=host.assets()[src.value.slice(2)],bk=root.VueModel.bake(a.spec);mesh=VM().fromTris(bk.meshes)
VM().xform(mesh,p=>[p[0]+(parseFloat(pos[0].value)||0),p[1]+(parseFloat(pos[1].value)||0),p[2]+(parseFloat(pos[2].value)||0)])
}
if(mesh.f.length>3000)throw new Error('That shape has too many faces for a cut. Simplify it first.')
addMod('boolean',{op:box.op.value,mesh})
}catch(x){toast(x.message,'warn')}
}}))
b.append(box)
}
function matPanel(b){
const m=st.cur.mesh
b.append(h('h4',{text:'Materials'}))
m.mats.forEach((mt,i)=>{
const row=h('div',{class:'stmat'+(i===st.matIdx?' on':'')})
const c=h('input',{type:'color',value:mt.color})
c.addEventListener('input',()=>{mt.color=c.value;invalidate();scheduleSave()})
c.addEventListener('change',()=>{pushUndo();changed()})
row.append(h('button',{class:'stpick',title:'Use this material for painting and new shapes',onclick:()=>{st.matIdx=i;buildSide()}},c,h('input',{class:'stmn',value:mt.name,onchange:e=>{mt.name=e.target.value||'Material';scheduleSave()}})),h('button',{class:'ib',title:'Remove',html:ic('x',12),onclick:()=>{if(m.mats.length<2)return;pushUndo();m.mats.splice(i,1);m.fm=m.fm.map(x=>x===i?0:x>i?x-1:x);st.matIdx=Math.min(st.matIdx,m.mats.length-1);changed()}}))
b.append(row)
})
b.append(h('div',{class:'stgrid'},h('button',{class:'btn sm',text:'New material',onclick:()=>{if(m.mats.length>=64)return;pushUndo();m.mats.push({name:'Material '+(m.mats.length+1),color:'#'+Math.floor(Math.random()*0xffffff).toString(16).padStart(6,'0'),metal:0,rough:0.6,emissive:'#000000'});st.matIdx=m.mats.length-1;changed()}}),h('button',{class:'btn sm',text:'Give to selection',title:'Paint the selected faces with the chosen material',onclick:()=>{const fs=getFaces();if(!fs.size){toast('Select some faces first','warn');return}pushUndo();for(const f of fs)m.fm[f]=st.matIdx;changed()}})))
const cur=m.mats[st.matIdx]
b.append(h('h4',{text:'Look of "'+cur.name+'"'}),field('Metal',sld(cur.metal,0,1,0.01,v=>{cur.metal=v;scheduleSave()})),field('Rough',sld(cur.rough,0,1,0.01,v=>{cur.rough=v;scheduleSave()})),field('Glow color',(()=>{const e=h('input',{type:'color',value:cur.emissive});e.addEventListener('change',()=>{pushUndo();cur.emissive=e.value;changed()});return e})()),h('p',{class:'stnote',text:'Metal, roughness and glow show in your game. The Studio view only previews color.'}))
}
function infoPanel(b){
const m=st.cur.mesh,s=VM().stats(m),c=VM().check(m),bb=VM().bbox(m)
b.append(h('h4',{text:'Model'}),h('div',{class:'stinfo'},h('span',{text:'Points'}),h('b',{text:s.verts}),h('span',{text:'Edges'}),h('b',{text:s.edges}),h('span',{text:'Faces'}),h('b',{text:s.faces}),h('span',{text:'Triangles'}),h('b',{text:s.tris}),h('span',{text:'Size'}),h('b',{text:[0,1,2].map(i=>r3(bb.max[i]-bb.min[i])).join(' × ')}),h('span',{text:'Watertight'}),h('b',{text:c.closed&&c.ok?'Yes':'No ('+c.open+' open edges)'})))
b.append(h('h4',{text:'Shading'}),field('Look',sel([[0,'Flat'],[30,'Smooth, keep sharp edges'],[180,'Fully smooth']],m.smooth===0?0:m.smooth===180?180:30,v=>{pushUndo();m.smooth=+v;changed()})))
b.append(h('h4',{text:'Fix up'}),h('div',{class:'stgrid'},...['center','floor','recalc','triangulate'].map(id=>h('button',{class:'btn sm',title:OPS[id].tip,text:OPS[id].label,onclick:()=>{const mode=st.mode;st.mode='object';runOp(id);st.mode=mode}}))))
b.append(h('h4',{text:'Use it'}),h('div',{class:'stgrid'},h('button',{class:'btn sm primary',text:'Put in scene',title:'Add this model to the current 3D scene',onclick:()=>{commit();host.place&&host.place(st.cur.name)}}),h('button',{class:'btn sm',text:'Export GLB',onclick:exportGLB}),h('button',{class:'btn sm',text:'Export OBJ',onclick:exportOBJ}),h('button',{class:'btn sm',text:'Add file…',title:'Add a GLB or OBJ into this model',onclick:()=>importFile(true)})))
}
function buildStart(){
const s=dom.start
s.textContent=''
const assets=host.assets(),ms=Object.keys(assets).filter(k=>assets[k].type==='model')
const box=h('div',{class:'stsbox'})
box.append(h('h2',{text:'Model Studio'}),h('p',{text:'Shape 3D models with real faces, edges and points. Start from a shape, then extrude, bevel, cut and paint.'}))
box.append(h('h3',{text:'New model'}))
const g=h('div',{class:'stshapes'})
for(const[k,n]of SHAPES)g.append(h('button',{class:'stshape',onclick:()=>newModel(k,n),html:'<span>'+n+'</span>'}))
box.append(g)
box.append(h('div',{class:'stgrid'},h('button',{class:'btn',html:ic('upload',14)+'<span>Import GLB or OBJ</span>',onclick:()=>importFile(false)})))
if(ms.length){
box.append(h('h3',{text:'Your models'}))
const l=h('div',{class:'stmodels'})
for(const k of ms){
let th=''
try{th=host.thumb(assets[k])}catch(x){}
l.append(h('button',{class:'stmodel',onclick:()=>openAsset(k)},th?h('img',{src:th}):h('span',{class:'stph'}),h('span',{text:k})))
}
box.append(l)
}
s.append(box)
}
function mount(parent){
el=h('div',{class:'studio'})
dom.root=el
dom.head=h('div',{class:'sthead'})
dom.tools=h('div',{class:'sttools'})
dom.vp=h('div',{class:'stvp'})
cv=h('canvas',{tabindex:'0',class:'stcv'})
dom.hint=h('div',{class:'sthint'})
dom.stats=h('div',{class:'ststats'})
dom.box=h('div',{class:'stbox'})
dom.side=h('div',{class:'stside'})
dom.start=h('div',{class:'ststart'})
dom.vp.append(cv,dom.box,dom.hint,dom.stats)
const main=h('div',{class:'stmain'},dom.tools,dom.vp,dom.side)
el.append(dom.head,main,dom.start)
parent.append(el)
setupScene()
bindEvents()
document.addEventListener('keydown',onKey,true)
new ResizeObserver(()=>resize()).observe(dom.vp)
}
function show(){
st.shown=true
document.body.classList.add('studio')
if(!el)return
resize();startLoop()
if(st.cur){invalidate();updateOverlay();attachGizmo()}
refreshUI(false,true)
}
function hide(){
st.shown=false
document.body.classList.remove('studio')
commit()
}
function init(h2,parent){
host=h2
mount(parent)
}
function open(name){
if(name)openAsset(name)
}
root.VueStudio={init,show,hide,open,newModel,isOpen:()=>!!st.cur,commit,get state(){return st},OPS,runOp,undo,redo}
})(window)
