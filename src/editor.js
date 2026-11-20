(function(){
const host=window.host
const $=s=>document.querySelector(s)
const $$=s=>Array.from(document.querySelectorAll(s))
const h=(tag,a,...c)=>{
const e=document.createElement(tag)
if(a)for(const k in a){
if(k==='class')e.className=a[k]
else if(k==='text')e.textContent=a[k]
else if(k.slice(0,2)==='on')e.addEventListener(k.slice(2),a[k])
else e.setAttribute(k,a[k])
}
for(const x of c)if(x!=null)e.append(x)
return e
}
const S={cam3:{tx:0,ty:1,tz:0,yaw:0,pitch:28,dist:20},project:null,path:null,sceneId:null,sel:null,tab:'scene',undo:[],redo:[],cam:{x:0,y:0,zoom:1},drag:null,space:false,editing:false,inputs:{},game:null,loading:false,ws:null,ne:null,code:null}
const scene=()=>S.project.scenes.find(s=>s.id===S.sceneId)||S.project.scenes[0]
const is3=()=>scene().mode==='3d'
const selData=()=>S.sel?scene().entities.find(e=>e.id===S.sel)||null:null
const clone=o=>JSON.parse(JSON.stringify(o))
const num=v=>{const n=parseFloat(v);return isNaN(n)?0:n}
function log(level,text){
const c=$('#console')
c.append(h('div',{class:level,text:text}))
while(c.children.length>400)c.firstChild.remove()
c.scrollTop=c.scrollHeight
}
function ask(msg,def){
return new Promise(res=>{
const m=$('#modal'),i=$('#minput')
$('#mmsg').textContent=msg
i.value=def||''
m.classList.add('on')
i.focus()
i.select()
const done=v=>{m.classList.remove('on');$('#mok').onclick=null;$('#mcancel').onclick=null;i.onkeydown=null;res(v)}
$('#mok').onclick=()=>done(i.value)
$('#mcancel').onclick=()=>done(null)
i.onkeydown=e=>{if(e.key==='Enter')done(i.value);if(e.key==='Escape')done(null)}
})
}
let saveT=0
function scheduleSave(){
clearTimeout(saveT)
saveT=setTimeout(()=>{try{localStorage.setItem('vue.autosave',JSON.stringify(S.project))}catch(x){}},700)
}
function snap(){
S.undo.push(JSON.stringify(S.project.scenes))
if(S.undo.length>60)S.undo.shift()
S.redo=[]
}
function restore(json){
S.project.scenes=JSON.parse(json)
if(!S.project.scenes.find(s=>s.id===S.sceneId))S.sceneId=S.project.scenes[0].id
if(S.sel&&!selData())S.sel=null
reloadScene()
renderAll()
scheduleSave()
}
function undo(){
if(!S.undo.length)return
S.redo.push(JSON.stringify(S.project.scenes))
restore(S.undo.pop())
}
function redo(){
if(!S.redo.length)return
S.undo.push(JSON.stringify(S.project.scenes))
restore(S.redo.pop())
}
function normalize(p){
p.settings=Object.assign({width:960,height:540,pixelArt:true},p.settings||{})
p.assets=p.assets||{}
p.name=p.name||'My Game'
for(const sc of p.scenes){
sc.camera=sc.camera||{x:0,y:0,zoom:1}
sc.entities=sc.entities||[]
sc.mode=sc.mode||'2d'
if(sc.gravity==null)sc.gravity=1400
if(!sc.bg)sc.bg='#1b2340'
}
if(!p.startScene||!p.scenes.find(s=>s.id===p.startScene))p.startScene=p.scenes[0].id
return p
}
function setProject(p,path){
S.project=normalize(p)
S.path=path||null
S.undo=[]
S.redo=[]
S.sceneId=S.project.startScene
S.sel=null
makeGame()
resetView()
renderAll()
scheduleSave()
document.title=S.project.name+' - Vue Engine'
}
function makeGame(){
const cv=$('#cv'),wrap=$('#cvwrap')
S.game=new VueRuntime.Game({canvas:cv,project:S.project,editor:true,width:Math.max(200,wrap.clientWidth),height:Math.max(200,wrap.clientHeight)})
S.game.loadAssets().then(()=>{reloadScene();redraw()})
reloadScene()
}
function reloadScene(){
const g=S.game
g.project=S.project
g.pixel=S.project.settings.pixelArt!==false
g.ctx.imageSmoothingEnabled=!g.pixel
g.loadScene(S.sceneId)
redraw()
}
function resetView(){
const sc=scene()
if(sc.mode==='3d'){const k=sc.camera3||{};S.cam3={tx:k.tx||0,ty:k.ty==null?1:k.ty,tz:k.tz||0,yaw:0,pitch:28,dist:20}}
else{const c=sc.camera;S.cam={x:c.x||0,y:c.y||0,zoom:1}}
redraw()
}
let rq=0
function redraw(){
if(rq)return
rq=requestAnimationFrame(()=>{rq=0;paint()})
}
function paint(){
const g=S.game
if(!g||S.tab!=='scene')return
if(is3()){paint3();return}
g.camera.x=S.cam.x
g.camera.y=S.cam.y
g.camera.zoom=S.cam.zoom
g.grid_on=$('#grid').checked
g.draw()
const c=g.ctx,z=S.cam.zoom
const sx=x=>(x-S.cam.x)*z+g.w/2,sy=y=>(y-S.cam.y)*z+g.h/2
const sc=scene(),cz=sc.camera.zoom||1,fw=S.project.settings.width/cz,fh=S.project.settings.height/cz
c.setTransform(1,0,0,1,0,0)
c.setLineDash([6,5])
c.strokeStyle='rgba(120,140,255,0.7)'
c.lineWidth=1
c.strokeRect(sx(sc.camera.x-fw/2),sy(sc.camera.y-fh/2),fw*z,fh*z)
c.setLineDash([])
const d=selData()
if(d){
const x0=sx(d.x-d.w/2),y0=sy(d.y-d.h/2),w=d.w*z,hh=d.h*z
c.strokeStyle='#7a88ff'
c.lineWidth=2
c.strokeRect(x0,y0,w,hh)
c.fillStyle='#fff'
for(const[hx,hy]of[[0,0],[1,0],[0,1],[1,1]])c.fillRect(x0+hx*w-4,y0+hy*hh-4,8,8)
}
$('#zoomLbl').textContent=Math.round(z*100)+'%  ('+Math.round(S.cam.x)+', '+Math.round(S.cam.y)+')'
}
function paint3(){
const g=S.game,o=S.cam3,sc=scene(),c=g.camera,D=Math.PI/180
const cy=o.yaw*D,cp=o.pitch*D
c.tx=o.tx;c.ty=o.ty;c.tz=o.tz
c.x=o.tx+Math.sin(cy)*Math.cos(cp)*o.dist
c.y=o.ty+Math.sin(cp)*o.dist
c.z=o.tz+Math.cos(cy)*Math.cos(cp)*o.dist
c.fov=(sc.camera3&&sc.camera3.fov)||70
if(g.r3){
g.r3.sync(g)
const d=selData()
g.r3.setSelection(d?g.entities.find(e=>e.src===d):null)
}
g.draw()
$('#zoomLbl').textContent='3D  distance '+o.dist.toFixed(1)
}
function rel(e){
const r=$('#cv').getBoundingClientRect()
return[e.clientX-r.left,e.clientY-r.top,r.width,r.height]
}
function down3(e){
const o=S.cam3,[px,py,w,h]=rel(e)
if(e.button===2){S.drag={k:'orbit',sx:e.clientX,sy:e.clientY,yaw:o.yaw,pitch:o.pitch};return}
if(e.button===1||S.space){S.drag={k:'pan3',sx:e.clientX,sy:e.clientY,tx:o.tx,ty:o.ty,tz:o.tz};return}
const hit=S.game.r3?S.game.r3.pick(px,py,w,h):null
if(hit){
const d=hit.src
select(d.id)
snap()
if(e.shiftKey)S.drag={k:'moveY',d,sy:e.clientY,y0:d.y}
else{
const p=S.game.r3.ground(px,py,w,h,d.y)||{x:d.x,z:d.z}
S.drag={k:'move3',d,ox:d.x-p.x,oz:d.z-p.z}
}
}else select(null)
}
function move3(e){
const dr=S.drag
if(!dr)return
const o=S.cam3,D=Math.PI/180
if(dr.k==='orbit'){
o.yaw=dr.yaw-(e.clientX-dr.sx)*0.4
o.pitch=Math.max(-89,Math.min(89,dr.pitch+(e.clientY-dr.sy)*0.4))
}else if(dr.k==='pan3'){
const k=o.dist*0.0016,dx=e.clientX-dr.sx,dy=e.clientY-dr.sy,cy=o.yaw*D
o.tx=dr.tx-dx*k*Math.cos(cy)
o.tz=dr.tz+dx*k*Math.sin(cy)
o.ty=dr.ty+dy*k
}else{
const d=dr.d
if(dr.k==='move3'){
const[px,py,w,h]=rel(e),p=S.game.r3.ground(px,py,w,h,d.y)
if(!p)return
d.x=gs(p.x+dr.ox)
d.z=gs(p.z+dr.oz)
}else d.y=gs(dr.y0-(e.clientY-dr.sy)*o.dist*0.003)
S.game.refresh()
syncInspector()
}
redraw()
}
function toWorld(e){
const r=$('#cv').getBoundingClientRect(),g=S.game
return[(e.clientX-r.left-g.w/2)/S.cam.zoom+S.cam.x,(e.clientY-r.top-g.h/2)/S.cam.zoom+S.cam.y]
}
function pick(wx,wy){
const es=scene().entities.map((d,i)=>[d,i]).sort((a,b)=>(a[0].z||0)-(b[0].z||0)||a[1]-b[1])
for(let i=es.length-1;i>=0;i--){
const d=es[i][0]
if(Math.abs(wx-d.x)*2<=d.w&&Math.abs(wy-d.y)*2<=d.h)return d
}
return null
}
function hitHandle(e,d){
const r=$('#cv').getBoundingClientRect(),g=S.game,z=S.cam.zoom
const px=e.clientX-r.left,py=e.clientY-r.top
for(const[hx,hy]of[[-1,-1],[1,-1],[-1,1],[1,1]]){
const x=(d.x+hx*d.w/2-S.cam.x)*z+g.w/2,y=(d.y+hy*d.h/2-S.cam.y)*z+g.h/2
if(Math.abs(px-x)<=7&&Math.abs(py-y)<=7)return[hx,hy]
}
return null
}
const gs=v=>$('#snap').checked?(is3()?Math.round(v*2)/2:Math.round(v/8)*8):Math.round(v*100)/100
function canvasEvents(){
const cv=$('#cv')
cv.addEventListener('contextmenu',e=>e.preventDefault())
cv.addEventListener('pointerdown',e=>{
cv.setPointerCapture(e.pointerId)
if(is3()){down3(e);return}
const[wx,wy]=toWorld(e)
if(e.button===1||e.button===2||S.space){S.drag={k:'pan',sx:e.clientX,sy:e.clientY,cx:S.cam.x,cy:S.cam.y};return}
const d=selData()
if(d){
const hd=hitHandle(e,d)
if(hd){snap();S.drag={k:'size',d,hx:hd[0],hy:hd[1],ox:d.x-hd[0]*d.w/2,oy:d.y-hd[1]*d.h/2};return}
}
const hit=pick(wx,wy)
if(hit){
select(hit.id)
snap()
S.drag={k:'move',d:hit,ox:wx-hit.x,oy:wy-hit.y}
}else select(null)
})
cv.addEventListener('pointermove',e=>{
if(is3()){move3(e);return}
const dr=S.drag
if(!dr)return
if(dr.k==='pan'){
S.cam.x=dr.cx-(e.clientX-dr.sx)/S.cam.zoom
S.cam.y=dr.cy-(e.clientY-dr.sy)/S.cam.zoom
}else{
const[wx,wy]=toWorld(e),d=dr.d
if(dr.k==='move'){
d.x=gs(wx-dr.ox)
d.y=gs(wy-dr.oy)
}else{
const w=Math.max(4,gs((wx-dr.ox)*dr.hx)),hh=Math.max(4,gs((wy-dr.oy)*dr.hy))
d.w=w
d.h=hh
d.x=dr.ox+dr.hx*w/2
d.y=dr.oy+dr.hy*hh/2
}
S.game.refresh()
syncInspector()
}
redraw()
})
const end=e=>{
if(S.drag&&S.drag.k!=='pan')scheduleSave()
S.drag=null
}
cv.addEventListener('pointerup',end)
cv.addEventListener('pointercancel',end)
cv.addEventListener('wheel',e=>{
e.preventDefault()
if(is3()){S.cam3.dist=Math.min(400,Math.max(1.5,S.cam3.dist*(e.deltaY<0?1/1.12:1.12)));redraw();return}
const r=cv.getBoundingClientRect(),g=S.game
const[wx,wy]=toWorld(e)
const z=Math.min(8,Math.max(0.05,S.cam.zoom*(e.deltaY<0?1.12:1/1.12)))
S.cam.zoom=z
S.cam.x=wx-(e.clientX-r.left-g.w/2)/z
S.cam.y=wy-(e.clientY-r.top-g.h/2)/z
redraw()
},{passive:false})
new ResizeObserver(()=>{
const w=$('#cvwrap').clientWidth,hh=$('#cvwrap').clientHeight
if(S.game&&w>0&&hh>0){S.game.resize(w,hh);redraw()}
}).observe($('#cvwrap'))
}
function select(id){
S.sel=id
renderHier()
buildInspector()
redraw()
if(S.tab==='script')loadScriptView()
}
function uniqueName(base){
const names=new Set(scene().entities.map(e=>e.name))
if(!names.has(base))return base
let i=2
while(names.has(base+' '+i))i++
return base+' '+i
}
function addEntity(kind){
snap()
const d=is3()?VueSample.kinds3[kind]():VueSample.kinds[kind]()
d.name=uniqueName(d.name)
if(is3()){d.x=gs(S.cam3.tx);d.z=gs(S.cam3.tz);d.y=d.shape==='light'?5:gs(S.cam3.ty)+(d.shape==='plane'?0:d.h/2)}
else{d.x=gs(S.cam.x);d.y=gs(S.cam.y)}
scene().entities.push(d)
S.sel=d.id
reloadScene()
renderAll()
scheduleSave()
}
function dupEntity(){
const d=selData()
if(!d)return
snap()
const c=clone(d)
c.id=VueSample.uid()
c.name=uniqueName(d.name)
c.x+=16
c.y+=16
scene().entities.push(c)
S.sel=c.id
reloadScene()
renderAll()
scheduleSave()
}
function delEntity(){
const d=selData()
if(!d)return
snap()
const es=scene().entities
es.splice(es.indexOf(d),1)
S.sel=null
reloadScene()
renderAll()
scheduleSave()
}
function updateToolbar(){
const t=is3()
for(const b of $$('.d2'))b.style.display=t?'none':''
for(const b of $$('.d3'))b.style.display=t?'':'none'
}
function renderAll(){
updateToolbar()
renderScenes()
renderHier()
renderAssets()
buildInspector()
$('#pname').textContent=S.project.name
document.title=S.project.name+' - Vue Engine'
}
function renderScenes(){
const box=$('#scenes')
box.innerHTML=''
for(const sc of S.project.scenes){
box.append(h('div',{class:'item'+(sc.id===S.sceneId?' on':''),onclick:()=>switchScene(sc.id)},h('span',{text:sc.name+(sc.id===S.project.startScene?'  (start)':'')})))
}
}
function switchScene(id){
S.sceneId=id
S.sel=null
reloadScene()
resetView()
renderAll()
}
function renderHier(){
const box=$('#hier')
box.innerHTML=''
for(const d of scene().entities){
box.append(h('div',{class:'item'+(d.id===S.sel?' on':'')+(d.prefab?' prefab':''),onclick:()=>select(d.id)},h('i',{style:'background:'+d.color}),h('span',{text:d.name})))
}
}
function renderAssets(){
const box=$('#assets')
box.innerHTML=''
const a=S.project.assets
for(const k in a){
const it=h('div',{class:'asset',title:k,onclick:()=>useAsset(k)})
if(a[k].type==='image')it.append(h('img',{src:a[k].data}))
else it.append(h('span',{text:'♪'}))
it.append(h('b',{text:'×',onclick:ev=>{ev.stopPropagation();snap();delete S.project.assets[k];S.game.loadAssets().then(redraw);renderAssets();scheduleSave()}}))
box.append(it)
}
}
function useAsset(k){
const a=S.project.assets[k]
if(a.type!=='image'){S.game.play(k);return}
const d=selData()
if(!d)return
snap()
d.shape='sprite'
d.image=k
const im=S.game.images[k]
if(im&&im.naturalWidth){const m=Math.min(1,256/Math.max(im.naturalWidth,im.naturalHeight));d.w=Math.round(im.naturalWidth*m);d.h=Math.round(im.naturalHeight*m)}
S.game.refresh()
buildInspector()
redraw()
scheduleSave()
}
async function importAssets(){
const files=await host.importAssets()
if(!files||!files.length)return
snap()
for(const f of files){
let n=f.name,i=2
while(S.project.assets[n])n=f.name.replace(/(\.[^.]*)?$/,'_'+(i++)+'$1')
S.project.assets[n]={type:f.type,data:f.data}
}
await S.game.loadAssets()
renderAssets()
redraw()
scheduleSave()
}
function afterEdit(key){
S.game.refresh()
redraw()
scheduleSave()
if(key==='name')renderHier()
if(key==='color')renderHier()
if(key==='shape'||key==='prefab'||key==='body')buildInspector()
}
function edit(key,set){
return e=>{
if(!S.editing){snap();S.editing=true}
set(e.target)
afterEdit(key)
}
}
const done=()=>{S.editing=false}
function field(d,key,type,opts){
let el
if(type==='sel'){
el=h('select')
for(const o of opts)el.append(h('option',{value:o,text:o}))
el.value=d[key]
el.addEventListener('change',e=>{snap();d[key]=el.value;afterEdit(key)})
}else if(type==='bool'){
el=h('input',{type:'checkbox'})
el.checked=!!d[key]
el.addEventListener('change',e=>{snap();d[key]=el.checked;afterEdit(key)})
}else if(type==='asset'){
el=h('select')
el.append(h('option',{value:'',text:'(none)'}))
for(const k in S.project.assets)if(S.project.assets[k].type==='image')el.append(h('option',{value:k,text:k}))
el.value=d[key]||''
el.addEventListener('change',e=>{snap();d[key]=el.value;afterEdit(key)})
}else{
el=h('input',{type:type==='num'?'number':type==='col'?'color':'text'})
if(type==='num')el.step='any'
el.value=type==='tags'?(d[key]||[]).join(', '):d[key]==null?'':d[key]
el.addEventListener('input',edit(key,t=>{
if(type==='num'){d[key]=key==='alpha'?Math.min(1,Math.max(0,num(t.value))):num(t.value)}
else if(type==='tags')d[key]=t.value.split(',').map(s=>s.trim()).filter(Boolean)
else d[key]=t.value
}))
el.addEventListener('change',done)
}
S.inputs[key]=el
return el
}
function row(label,...els){
const r=h('div',{class:'fld'},h('label',{text:label}))
if(els.length>1)r.append(h('div',{class:'two',style:'grid-template-columns:repeat('+els.length+',1fr)'},...els))
else r.append(els[0])
return r
}
function syncInspector(){
const d=selData()
if(!d)return
for(const k of['x','y','z','w','h','d','rot','rx','ry','rz']){
const el=S.inputs[k]
if(el&&document.activeElement!==el)el.value=Math.round(d[k]*100)/100
}
}
function buildInspector(){
const box=$('#insp')
box.innerHTML=''
S.inputs={}
const d=selData()
if(!d){sceneSettings(box);return}
box.append(row('Name',field(d,'name','text')))
box.append(row('Tags',field(d,'tags','tags')))
if(is3()){build3(box,d);return}
box.append(h('div',{class:'sec',text:'Transform'}))
box.append(row('Position',field(d,'x','num'),field(d,'y','num')))
box.append(row('Size',field(d,'w','num'),field(d,'h','num')))
box.append(row('Rotation',field(d,'rot','num')))
box.append(row('Layer (z)',field(d,'z','num')))
box.append(h('div',{class:'sec',text:'Look'}))
box.append(row('Shape',field(d,'shape','sel',['rect','circle','sprite','text'])))
box.append(row('Color',field(d,'color','col')))
if(d.shape==='sprite')box.append(row('Image',field(d,'image','asset')))
if(d.shape==='text'){
box.append(row('Text',field(d,'text','text')))
box.append(row('Font size',field(d,'fontSize','num')))
}
box.append(row('Opacity',field(d,'alpha','num')))
box.append(row('Visible',field(d,'visible','bool')))
box.append(h('div',{class:'sec',text:'Physics'}))
box.append(row('Body',field(d,'body','sel',['none','static','dynamic','trigger'])))
if(d.body==='dynamic')box.append(row('Gravity',field(d,'gravityScale','num')))
box.append(h('div',{class:'sec',text:'Behavior'}))
box.append(row('Prefab',field(d,'prefab','bool')))
box.append(h('button',{text:'Edit script',onclick:()=>setTab('script')}))
}
function build3(box,d){
box.append(h('div',{class:'sec',text:'Transform'}))
box.append(row('Position',field(d,'x','num'),field(d,'y','num'),field(d,'z','num')))
box.append(row('Size',field(d,'w','num'),field(d,'h','num'),field(d,'d','num')))
box.append(row('Rotation',field(d,'rx','num'),field(d,'ry','num'),field(d,'rz','num')))
box.append(h('div',{class:'sec',text:'Look'}))
box.append(row('Shape',field(d,'shape','sel',['box','sphere','cylinder','cone','plane','light'])))
box.append(row('Color',field(d,'color','col')))
if(d.shape!=='light')box.append(row('Texture',field(d,'image','asset')))
box.append(row(d.shape==='light'?'Intensity':'Opacity',field(d,'alpha','num')))
box.append(row('Visible',field(d,'visible','bool')))
box.append(h('div',{class:'sec',text:'Physics'}))
box.append(row('Body',field(d,'body','sel',['none','static','dynamic','trigger'])))
if(d.body==='dynamic')box.append(row('Gravity',field(d,'gravityScale','num')))
box.append(h('div',{class:'sec',text:'Behavior'}))
box.append(row('Prefab',field(d,'prefab','bool')))
box.append(h('button',{text:'Edit script',onclick:()=>setTab('script')}))
}
function sceneSettings(box){
const sc=scene(),p=S.project
const bind=(o,key,type,after)=>{
const el=h('input',{type:type==='num'?'number':type==='col'?'color':type==='bool'?'checkbox':'text'})
if(type==='num')el.step='any'
if(type==='bool')el.checked=!!o[key]
else el.value=o[key]
const fn=()=>{if(!S.editing){snap();S.editing=true}o[key]=type==='bool'?el.checked:type==='num'?num(el.value):el.value;if(after)after();scheduleSave();redraw()}
el.addEventListener('input',fn)
el.addEventListener('change',done)
return el
}
box.append(h('div',{class:'sec',text:'Scene'}))
box.append(row('Name',bind(sc,'name','text',renderScenes)))
const ms=h('select')
for(const m of['2d','3d'])ms.append(h('option',{value:m,text:m.toUpperCase()}))
ms.value=sc.mode||'2d'
ms.addEventListener('change',()=>{
snap()
sc.mode=ms.value
if(sc.mode==='3d'&&!sc.camera3)sc.camera3={x:0,y:8,z:14,tx:0,ty:1,tz:0,fov:70}
if(sc.mode==='3d'&&sc.gravity>200)sc.gravity=30
if(sc.mode==='2d'&&sc.gravity<200)sc.gravity=1400
reloadScene()
resetView()
renderAll()
scheduleSave()
})
box.append(row('Mode',ms))
box.append(row('Background',bind(sc,'bg','col',()=>{S.game.bg=sc.bg})))
box.append(row('Gravity',bind(sc,'gravity','num',()=>{S.game.gravity=sc.gravity})))
if(sc.mode==='3d'){
const k=sc.camera3||(sc.camera3={x:0,y:8,z:14,tx:0,ty:1,tz:0,fov:70})
box.append(row('Camera',bind(k,'x','num'),bind(k,'y','num'),bind(k,'z','num')))
box.append(row('Looks at',bind(k,'tx','num'),bind(k,'ty','num'),bind(k,'tz','num')))
box.append(row('Field of view',bind(k,'fov','num')))
box.append(row('Mouse look',bind(sc,'mouseLook','bool')))
}else{
box.append(row('Start view',bind(sc.camera,'x','num'),bind(sc.camera,'y','num')))
box.append(row('Start zoom',bind(sc.camera,'zoom','num')))
}
box.append(h('div',{class:'sec',text:'Project'}))
box.append(row('Title',bind(p,'name','text',()=>{$('#pname').textContent=p.name;document.title=p.name+' - Vue Engine'})))
box.append(row('Resolution',bind(p.settings,'width','num'),bind(p.settings,'height','num')))
box.append(row('Pixel art',bind(p.settings,'pixelArt','bool',()=>{S.game.pixel=p.settings.pixelArt;S.game.ctx.imageSmoothingEnabled=!S.game.pixel})))
const sel=h('select')
for(const s of p.scenes)sel.append(h('option',{value:s.id,text:s.name}))
sel.value=p.startScene
sel.addEventListener('change',()=>{p.startScene=sel.value;renderScenes();scheduleSave()})
box.append(row('Start scene',sel))
const btns=h('div',{class:'fld'},h('label'))
btns.append(h('button',{text:'Set as start',onclick:()=>{p.startScene=sc.id;renderAll();scheduleSave()}}))
box.append(btns)
if(p.scenes.length>1)box.append(h('button',{text:'Delete this scene',onclick:()=>{
snap()
p.scenes.splice(p.scenes.indexOf(sc),1)
if(p.startScene===sc.id)p.startScene=p.scenes[0].id
S.sceneId=p.scenes[0].id
reloadScene()
resetView()
renderAll()
scheduleSave()
}}))
}
function addScene(){
snap()
const sc={id:VueSample.uid(),name:'Scene '+(S.project.scenes.length+1),bg:'#1b2340',gravity:1400,camera:{x:0,y:0,zoom:1},entities:[]}
S.project.scenes.push(sc)
switchScene(sc.id)
scheduleSave()
}
function ensureScript(d){
if(!d.script)d.script={mode:'code',code:VueDTS.TEMPLATE,blocks:null,nodes:null}
if(!d.script.mode)d.script.mode='code'
return d.script
}
function ensureBlockly(){
if(S.ws)return
S.ws=Blockly.inject($('#blk'),{toolbox:S.toolbox,renderer:'zelos',theme:VueBlocks.theme(Blockly),grid:{spacing:24,length:3,colour:'#222834',snap:true},zoom:{controls:true,wheel:true,startScale:0.9,maxScale:2,minScale:0.4},trashcan:true,move:{scrollbars:true,drag:true,wheel:false}})
S.ws.addChangeListener(ev=>{
if(ev.isUiEvent||S.loading)return
const d=selData()
if(d&&d.script&&d.script.mode==='blocks'){d.script.blocks=Blockly.serialization.workspaces.save(S.ws);scheduleSave()}
})
}
function ensureNodes(){
if(S.ne)return
S.ne=new VueNodeEditor($('#nodes'),VueNodes.defs,VueNodes.CAT_COLORS,g=>{
const d=selData()
if(d&&d.script&&d.script.mode==='nodes'){d.script.nodes=g;scheduleSave()}
})
}
let monacoP=null
function loadMonaco(){
if(monacoP)return monacoP
monacoP=new Promise(res=>{
if(typeof require==='undefined'||!require.config){res(null);return}
try{
const base=new URL('../node_modules/monaco-editor/min/',location.href).href
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
if(d&&d.script&&d.script.mode==='code'){d.script.code=v;scheduleSave()}
}
if(m){
const ts=m.languages.typescript
ts.typescriptDefaults.setCompilerOptions({target:ts.ScriptTarget.ES2020,lib:['es2020'],allowNonTsExtensions:true,module:ts.ModuleKind.CommonJS,noEmit:true,strict:false})
ts.typescriptDefaults.addExtraLib(VueDTS.dts,'file:///vue.d.ts')
const model=m.editor.createModel('','typescript',m.Uri.parse('file:///script.ts'))
const ed=m.editor.create($('#code'),{model,theme:'vs-dark',minimap:{enabled:false},fontSize:14,automaticLayout:true,scrollBeyondLastLine:false,tabSize:2})
model.onDidChangeContent(()=>onChange(model.getValue()))
S.code={set:v=>{S.loading=true;model.setValue(v);S.loading=false},layout:()=>ed.layout()}
}else{
const ta=h('textarea',{spellcheck:'false',style:'width:100%;height:100%;background:#12151c;color:#dfe3ee;border:0;padding:12px;font:14px Consolas,monospace;resize:none;outline:0;tab-size:2'})
$('#code').append(ta)
ta.addEventListener('input',()=>onChange(ta.value))
ta.addEventListener('keydown',e=>{
if(e.key==='Tab'){e.preventDefault();const s=ta.selectionStart;ta.setRangeText('\t',s,ta.selectionEnd,'end');onChange(ta.value)}
})
S.code={set:v=>{S.loading=true;ta.value=v;S.loading=false},layout:()=>{}}
}
}
async function loadScriptView(){
const d=selData()
for(const id of['blk','nodes','code'])$('#'+id).classList.remove('on')
$('#sempty').classList.toggle('on',!d)
$('#sname').textContent=d?d.name:''
for(const b of $$('[data-mode]'))b.disabled=!d
if(!d){for(const b of $$('[data-mode]'))b.classList.remove('on');return}
showMode(ensureScript(d).mode)
}
async function showMode(m){
const d=selData()
if(!d)return
const s=ensureScript(d)
s.mode=m
for(const b of $$('[data-mode]'))b.classList.toggle('on',b.dataset.mode===m)
const map={blocks:'blk',nodes:'nodes',code:'code'}
for(const k in map)$('#'+map[k]).classList.toggle('on',k===m)
if(m==='blocks'){
ensureBlockly()
S.loading=true
Blockly.Events.disable()
S.ws.clear()
if(s.blocks)Blockly.serialization.workspaces.load(s.blocks,S.ws)
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
scheduleSave()
}
function setTab(t){
if(S.tab==='game'&&t!=='game')stopGame()
S.tab=t
for(const b of $$('.tabs button'))b.classList.toggle('on',b.dataset.tab===t)
$('#viewScene').classList.toggle('on',t==='scene')
$('#viewScript').classList.toggle('on',t==='script')
$('#viewGame').classList.toggle('on',t==='game')
if(t==='scene'){
const w=$('#cvwrap').clientWidth,hh=$('#cvwrap').clientHeight
if(w>0&&hh>0)S.game.resize(w,hh)
redraw()
}
if(t==='script')loadScriptView()
}
function compileEnv(){
return{Blockly:window.Blockly,gen:Blockly.JavaScript,blocks:VueBlocks,nodes:VueNodes,transpile:s=>host.transpile(s)}
}
async function build(){
const r=await VueCompiler.compileProject(S.project,compileEnv())
$('#console').innerHTML=''
for(const e of r.errors)log('error',e)
const rt=await host.runtimeSource()
const three=S.project.scenes.some(s=>s.mode==='3d')?await host.threeSource():''
return{html:VuePlayer.html(S.project,r.scripts,rt,S.project.name,three),errors:r.errors}
}
async function play(){
stopGame()
setTab('game')
const{html,errors}=await build()
log('info','Running '+S.project.name+(errors.length?' ('+errors.length+' script errors)':''))
const f=$('#frame')
f.onload=()=>f.focus()
f.srcdoc=html
}
function stopGame(){
const f=$('#frame')
f.onload=null
f.srcdoc=''
$('#fps').textContent=''
}
async function exportHtml(){
const{html}=await build()
const p=await host.exportHtml(html,S.project.name)
if(p)log('info','Exported '+p)
}
async function save(as){
const p=await host.saveProject(JSON.stringify(S.project),as?null:S.path)
if(p){S.path=p;log('info','Saved '+p)}
}
async function open(){
const r=await host.openProject()
if(!r)return
try{
const p=JSON.parse(r.data)
if(!p.scenes||!p.scenes.length)throw new Error('no scenes')
setProject(p,r.path)
log('info','Opened '+r.path)
}catch(x){log('error','Not a valid Vue project file')}
}
function typing(t){
return t&&(t.tagName==='INPUT'||t.tagName==='TEXTAREA'||t.tagName==='SELECT'||(t.closest&&t.closest('.monaco-editor,.blocklyWidgetDiv,.ne,#blk,#modal')))
}
function keys(){
window.addEventListener('keydown',e=>{
const t=e.target,ty=typing(t),k=e.key.toLowerCase()
if(e.ctrlKey||e.metaKey){
if(k==='s'){e.preventDefault();save(e.shiftKey);return}
if(k==='enter'){e.preventDefault();play();return}
if(ty)return
if(k==='z'){e.preventDefault();e.shiftKey?redo():undo()}
else if(k==='y'){e.preventDefault();redo()}
else if(k==='d'&&S.tab==='scene'){e.preventDefault();dupEntity()}
return
}
if(k==='escape'&&S.tab==='game'){setTab('scene');return}
if(ty||S.tab!=='scene')return
if(k===' '){S.space=true;e.preventDefault();return}
if(k==='delete'||k==='backspace'){delEntity();return}
const d=selData()
if(d&&k.indexOf('arrow')===0){
e.preventDefault()
snap()
const s=e.shiftKey?8:1
const st=is3()?s*0.5:s
if(k==='arrowleft')d.x-=st
if(k==='arrowright')d.x+=st
if(k==='arrowup'){if(is3())d.z-=st;else d.y-=st}
if(k==='arrowdown'){if(is3())d.z+=st;else d.y+=st}
S.game.refresh()
syncInspector()
redraw()
scheduleSave()
}
})
window.addEventListener('keyup',e=>{if(e.key===' ')S.space=false})
}
function wire(){
$('#bNew').onclick=()=>setProject(VueSample.blank(),null)
$('#bSample').onclick=()=>setProject(VueSample.make(),null)
$('#bNew3').onclick=()=>setProject(VueSample.blank3(),null)
$('#bSample3').onclick=()=>setProject(VueSample.make3(),null)
$('#bOpen').onclick=open
$('#bSave').onclick=()=>save(false)
$('#bExport').onclick=exportHtml
$('#bUndo').onclick=undo
$('#bRedo').onclick=redo
$('#bPlay').onclick=play
$('#bStop').onclick=()=>{if(S.tab==='game')setTab('scene')}
$('#bAddScene').onclick=addScene
$('#bDup').onclick=dupEntity
$('#bDel').onclick=delEntity
$('#bImport').onclick=importAssets
$('#bClear').onclick=()=>{$('#console').innerHTML=''}
$('#bFrame').onclick=resetView
$('#grid').onchange=redraw
for(const b of $$('.tabs button'))b.onclick=()=>setTab(b.dataset.tab)
for(const b of $$('[data-add]'))b.onclick=()=>addEntity(b.dataset.add)
for(const b of $$('[data-mode]'))b.onclick=()=>showMode(b.dataset.mode)
window.addEventListener('message',e=>{
const m=e.data
if(!m||m.vue!==1||e.source!==$('#frame').contentWindow)return
if(m.type==='log')log(m.level,m.text)
if(m.type==='fps')$('#fps').textContent=m.v+' fps  '+m.n+' entities'
})
window.addEventListener('resize',()=>{if(S.ws)Blockly.svgResize(S.ws);if(S.code)S.code.layout()})
}
function boot(){
const r=VueBlocks.init(Blockly,Blockly.JavaScript,window.javascript.Order)
S.toolbox=r.toolbox
Blockly.dialog.setPrompt((msg,def,cb)=>{ask(msg,def).then(v=>cb(v))})
wire()
keys()
canvasEvents()
let p=null
try{const raw=localStorage.getItem('vue.autosave');if(raw)p=JSON.parse(raw)}catch(x){}
if(!p||!p.scenes||!p.scenes.length)p=VueSample.make()
setProject(p,null)
setTab('scene')
loadMonaco()
log('info','Vue Engine ready. Press Ctrl+Enter to play.')
}
boot()
})()
