(function(root){
const exec='#e6e8ee',data='#7dd3fc'
class NodeEditor{
constructor(el,defs,colors,onChange){
this.el=el
this.defs=defs
this.colors=colors
this.onChange=onChange||(()=>{})
this.g={nid:1,nodes:[],links:[]}
this.pan={x:60,y:60}
this.zoom=1
this.sel=null
this.mode=null
this.ports=new Map()
el.classList.add('ne')
el.tabIndex=0
el.innerHTML='<div class="ne-world"><svg class="ne-links" width="1" height="1"></svg></div><div class="ne-bar"><input class="ne-add" list="ne-list" placeholder="Add node (type to search)"><datalist id="ne-list"></datalist><span class="ne-hint">Drag from a port to connect. Double-click a wire to cut it. Delete removes the selected node. Scroll to zoom, drag the background to pan.</span></div>'
this.world=el.querySelector('.ne-world')
this.svg=el.querySelector('.ne-links')
this.add=el.querySelector('.ne-add')
const dl=el.querySelector('#ne-list')
this.labels={}
for(const t in defs){
const lab=defs[t].cat+' · '+defs[t].title
this.labels[lab]=t
const o=document.createElement('option')
o.value=lab
dl.appendChild(o)
}
this.add.addEventListener('change',()=>{
const t=this.labels[this.add.value]
if(t){
const r=el.getBoundingClientRect()
this.addNode(t,(r.width/2-this.pan.x)/this.zoom-80,(r.height/2-this.pan.y)/this.zoom-40)
}
this.add.value=''
})
el.addEventListener('pointerdown',e=>this.down(e))
el.addEventListener('pointermove',e=>this.move(e))
el.addEventListener('pointerup',e=>this.up(e))
el.addEventListener('wheel',e=>this.wheel(e),{passive:false})
el.addEventListener('keydown',e=>{
if(e.target.closest('input,select,textarea'))return
if((e.key==='Delete'||e.key==='Backspace')&&this.sel!=null){this.removeNode(this.sel);e.preventDefault()}
})
el.addEventListener('dblclick',e=>{
const p=e.target.closest('.ne-link')
if(p){
const i=+p.dataset.i
this.g.links.splice(i,1)
this.render()
this.emit()
}
})
this.applyView()
}
load(g){
this.g=g||{nid:1,nodes:[],links:[]}
if(!this.g.nodes)this.g.nodes=[]
if(!this.g.links)this.g.links=[]
if(!this.g.nid)this.g.nid=this.g.nodes.reduce((m,n)=>Math.max(m,n.id),0)+1
this.sel=null
this.render()
}
emit(){this.onChange(this.g)}
applyView(){this.world.style.transform='translate('+this.pan.x+'px,'+this.pan.y+'px) scale('+this.zoom+')'}
addNode(type,x,y){
const n={id:this.g.nid++,type,x:Math.round(x),y:Math.round(y),v:{}}
this.g.nodes.push(n)
this.sel=n.id
this.render()
this.emit()
}
removeNode(id){
this.g.nodes=this.g.nodes.filter(n=>n.id!==id)
this.g.links=this.g.links.filter(l=>l.a!==id&&l.b!==id)
this.sel=null
this.render()
this.emit()
}
linkedIn(id,port){return this.g.links.some(l=>l.b===id&&l.bp===port)}
render(){
for(const n of this.world.querySelectorAll('.ne-node'))n.remove()
this.ports.clear()
for(const n of this.g.nodes){
const d=this.defs[n.type]
if(!d)continue
this.world.appendChild(this.nodeEl(n,d))
}
this.drawLinks()
}
portEl(n,p,dir){
const s=document.createElement('span')
s.className='ne-port '+dir+' '+(p.t==='exec'?'exec':'data')
s.dataset.node=n.id
s.dataset.port=p.n
s.dataset.dir=dir
s.dataset.t=p.t
this.ports.set(n.id+':'+p.n+':'+dir,s)
return s
}
field(n,p){
const cur=n.v&&n.v[p.n]!==undefined?n.v[p.n]:p.d
let i
if(p.t==='sel'){
i=document.createElement('select')
for(const o of p.o){const op=document.createElement('option');op.value=o[1];op.textContent=o[0];i.appendChild(op)}
i.value=cur
}else if(p.t==='bool'){
i=document.createElement('input')
i.type='checkbox'
i.checked=cur===true||cur==='true'
}else{
i=document.createElement('input')
i.type=p.t==='num'?'number':p.t==='col'?'color':'text'
if(p.t==='num')i.step='any'
if(p.t==='ent')i.placeholder='self'
i.value=cur==null?'':cur
}
const set=()=>{
if(!n.v)n.v={}
n.v[p.n]=p.t==='bool'?i.checked:p.t==='num'?(i.value===''?0:Number(i.value)):i.value
this.emit()
}
i.addEventListener('input',set)
i.addEventListener('change',set)
i.addEventListener('pointerdown',e=>e.stopPropagation())
return i
}
nodeEl(n,d){
const el=document.createElement('div')
el.className='ne-node'+(this.sel===n.id?' sel':'')
el.dataset.id=n.id
el.style.left=n.x+'px'
el.style.top=n.y+'px'
const h=document.createElement('div')
h.className='ne-head'
h.style.background=this.colors[d.cat]||'#555'
h.textContent=d.title
el.appendChild(h)
const cols=document.createElement('div')
cols.className='ne-cols'
const ci=document.createElement('div'),co=document.createElement('div')
ci.className='ne-in'
co.className='ne-out'
for(const p of d.in){
const r=document.createElement('div')
r.className='ne-row'
if(!p.f)r.appendChild(this.portEl(n,p,'in'))
if(!(p.t==='exec'&&p.n==='in')){
const l=document.createElement('label')
l.textContent=p.n
r.appendChild(l)
}
if(p.f||(p.t!=='exec'&&!this.linkedIn(n.id,p.n)))r.appendChild(this.field(n,p))
ci.appendChild(r)
}
for(const p of d.out){
const r=document.createElement('div')
r.className='ne-row'
if(!(p.t==='exec'&&p.n==='next')){
const l=document.createElement('label')
l.textContent=p.n
r.appendChild(l)
}
r.appendChild(this.portEl(n,p,'out'))
co.appendChild(r)
}
cols.appendChild(ci)
cols.appendChild(co)
el.appendChild(cols)
return el
}
center(el){
const r=el.getBoundingClientRect(),w=this.world.getBoundingClientRect()
return[(r.left+r.width/2-w.left)/this.zoom,(r.top+r.height/2-w.top)/this.zoom]
}
path(x1,y1,x2,y2){
const k=Math.max(40,Math.abs(x2-x1)*0.5)
return'M'+x1+' '+y1+'C'+(x1+k)+' '+y1+','+(x2-k)+' '+y2+','+x2+' '+y2
}
drawLinks(){
const svg=this.svg
while(svg.firstChild)svg.removeChild(svg.firstChild)
const ns='http://www.w3.org/2000/svg'
this.g.links.forEach((l,i)=>{
const a=this.ports.get(l.a+':'+l.ap+':out'),b=this.ports.get(l.b+':'+l.bp+':in')
if(!a||!b)return
const[x1,y1]=this.center(a),[x2,y2]=this.center(b)
const p=document.createElementNS(ns,'path')
p.setAttribute('d',this.path(x1,y1,x2,y2))
p.setAttribute('class','ne-link')
p.setAttribute('stroke',a.dataset.t==='exec'?exec:data)
p.dataset.i=i
svg.appendChild(p)
})
if(this.temp){
const p=document.createElementNS(ns,'path')
p.setAttribute('d',this.temp)
p.setAttribute('class','ne-temp')
svg.appendChild(p)
}
}
local(e){
const r=this.el.getBoundingClientRect()
return[(e.clientX-r.left-this.pan.x)/this.zoom,(e.clientY-r.top-this.pan.y)/this.zoom]
}
select(id){
this.sel=id
for(const n of this.world.querySelectorAll('.ne-node'))n.classList.toggle('sel',+n.dataset.id===id)
}
down(e){
const t=e.target
if(t.closest('.ne-bar'))return
if(t.classList.contains('ne-port')){
this.el.focus()
let node=+t.dataset.node,port=t.dataset.port,dir=t.dataset.dir
if(dir==='in'){
const i=this.g.links.findIndex(l=>l.b===node&&l.bp===port)
if(i>=0){
const l=this.g.links[i]
this.g.links.splice(i,1)
node=l.a
port=l.ap
dir='out'
this.render()
this.emit()
}
}
this.mode={k:'link',node,port,dir,t:t.dataset.t}
this.el.setPointerCapture(e.pointerId)
e.preventDefault()
return
}
const head=t.closest('.ne-head')
if(head){
this.el.focus()
const id=+head.parentNode.dataset.id,n=this.g.nodes.find(q=>q.id===id),[x,y]=this.local(e)
this.select(id)
this.mode={k:'drag',n,ox:x-n.x,oy:y-n.y,el:head.parentNode}
this.el.setPointerCapture(e.pointerId)
e.preventDefault()
return
}
if(t.closest('input,select'))return
const nd=t.closest('.ne-node')
if(nd){this.el.focus();this.select(+nd.dataset.id);return}
this.el.focus()
this.select(null)
this.mode={k:'pan',sx:e.clientX,sy:e.clientY,px:this.pan.x,py:this.pan.y}
this.el.setPointerCapture(e.pointerId)
}
move(e){
const m=this.mode
if(!m)return
if(m.k==='pan'){
this.pan.x=m.px+e.clientX-m.sx
this.pan.y=m.py+e.clientY-m.sy
this.applyView()
}else if(m.k==='drag'){
const[x,y]=this.local(e)
m.n.x=Math.round(x-m.ox)
m.n.y=Math.round(y-m.oy)
m.el.style.left=m.n.x+'px'
m.el.style.top=m.n.y+'px'
this.drawLinks()
}else if(m.k==='link'){
const p=this.ports.get(m.node+':'+m.port+':'+m.dir)
if(!p)return
const[x1,y1]=this.center(p),[x2,y2]=this.local(e)
this.temp=m.dir==='out'?this.path(x1,y1,x2,y2):this.path(x2,y2,x1,y1)
this.drawLinks()
}
}
up(e){
const m=this.mode
this.mode=null
if(!m)return
try{this.el.releasePointerCapture(e.pointerId)}catch(x){}
if(m.k==='drag')this.emit()
if(m.k==='link'){
this.temp=null
const t=document.elementFromPoint(e.clientX,e.clientY)
if(t&&t.classList.contains('ne-port')&&t.dataset.dir!==m.dir&&(t.dataset.t==='exec')===(m.t==='exec')&&+t.dataset.node!==m.node){
const o=m.dir==='out'?{a:m.node,ap:m.port,b:+t.dataset.node,bp:t.dataset.port}:{a:+t.dataset.node,ap:t.dataset.port,b:m.node,bp:m.port}
this.g.links=this.g.links.filter(l=>!(l.b===o.b&&l.bp===o.bp)&&!(m.t==='exec'&&l.a===o.a&&l.ap===o.ap))
this.g.links.push(o)
this.render()
this.emit()
}else this.drawLinks()
}
}
wheel(e){
e.preventDefault()
const r=this.el.getBoundingClientRect(),cx=e.clientX-r.left,cy=e.clientY-r.top
const z=Math.min(2,Math.max(0.3,this.zoom*(e.deltaY<0?1.1:1/1.1)))
this.pan.x=cx-(cx-this.pan.x)*(z/this.zoom)
this.pan.y=cy-(cy-this.pan.y)*(z/this.zoom)
this.zoom=z
this.applyView()
this.drawLinks()
}
}
const api={NodeEditor}
if(typeof module!=='undefined'&&module.exports)module.exports=api
else root.VueNodeEditor=NodeEditor
})(typeof window!=='undefined'?window:globalThis)
