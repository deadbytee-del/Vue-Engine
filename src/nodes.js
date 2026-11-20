(function(root){
const TC={exec:'#ece8f6',num:'#3ddc84',str:'#ff9de2',bool:'#ff4d6a',ent:'#4d8dff',any:'#b9b0d0',col:'#ffd34d',sel:'#b9b0d0'}
const ic=(n,s)=>root.VueIcon?root.VueIcon(n,s):''
const CATI={Events:'sparkles',Flow:'workflow',Motion:'move',Looks:'palette',Game:'gamepad',Sound:'music',Data:'tag',Math:'target',Logic:'target',Sensing:'eye'}
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
this.pend=null
el.classList.add('ne')
el.tabIndex=0
el.innerHTML='<div class="ne-world"><svg class="ne-links" width="1" height="1"></svg></div><div class="ne-hint">Right-click or drag a wire into empty space to add nodes · Alt-click a wire to cut · Del removes</div><div class="ne-pal"><div class="ne-pal-s">'+ic('search',14)+'<input placeholder="Search nodes"></div><div class="ne-pal-l"></div></div>'
this.world=el.querySelector('.ne-world')
this.svg=el.querySelector('.ne-links')
this.pal=el.querySelector('.ne-pal')
this.pin=this.pal.querySelector('input')
this.pl=this.pal.querySelector('.ne-pal-l')
this.pin.addEventListener('input',()=>this.fill())
this.pin.addEventListener('keydown',e=>{
const items=Array.from(this.pl.querySelectorAll('.ne-pi'))
let i=items.findIndex(x=>x.classList.contains('on'))
if(e.key==='ArrowDown'){i=Math.min(items.length-1,i+1);e.preventDefault()}
else if(e.key==='ArrowUp'){i=Math.max(0,i-1);e.preventDefault()}
else if(e.key==='Enter'){if(items[i])this.pick(items[i].dataset.t);e.preventDefault();return}
else if(e.key==='Escape'){this.closePal();e.preventDefault();return}
else return
items.forEach((x,j)=>x.classList.toggle('on',j===i))
if(items[i])items[i].scrollIntoView({block:'nearest'})
})
el.addEventListener('pointerdown',e=>this.down(e))
el.addEventListener('pointermove',e=>this.move(e))
el.addEventListener('pointerup',e=>this.up(e))
el.addEventListener('wheel',e=>this.wheel(e),{passive:false})
el.addEventListener('contextmenu',e=>{
e.preventDefault()
if(e.target.closest('.ne-node,.ne-pal'))return
this.pend=null
this.openPal(e.clientX,e.clientY)
})
el.addEventListener('keydown',e=>{
if(e.target.closest('input,select,textarea'))return
if((e.key==='Delete'||e.key==='Backspace')&&this.sel!=null){this.removeNode(this.sel);e.preventDefault()}
if(e.key===' '||e.key==='Tab'){const r=el.getBoundingClientRect();this.pend=null;this.openPal(r.left+r.width/2-140,r.top+r.height/3);e.preventDefault()}
})
el.addEventListener('click',e=>{
const p=e.target.closest('.ne-link')
if(p&&e.altKey){this.g.links.splice(+p.dataset.i,1);this.render();this.emit()}
})
el.addEventListener('dblclick',e=>{
const p=e.target.closest('.ne-link')
if(p){this.g.links.splice(+p.dataset.i,1);this.render();this.emit()}
})
this.applyView()
}
load(g){
this.g=g||{nid:1,nodes:[],links:[]}
if(!this.g.nodes)this.g.nodes=[]
if(!this.g.links)this.g.links=[]
if(!this.g.nid)this.g.nid=this.g.nodes.reduce((m,n)=>Math.max(m,n.id),0)+1
this.sel=null
this.closePal()
this.render()
}
emit(){this.onChange(this.g)}
applyView(){
this.world.style.transform='translate('+this.pan.x+'px,'+this.pan.y+'px) scale('+this.zoom+')'
this.el.style.backgroundPosition=this.pan.x+'px '+this.pan.y+'px'
this.el.style.backgroundSize=24*this.zoom+'px '+24*this.zoom+'px'
}
openPal(cx,cy){
const r=this.el.getBoundingClientRect()
this.palAt=[cx,cy]
this.pal.style.left=Math.min(r.width-290,Math.max(8,cx-r.left))+'px'
this.pal.style.top=Math.min(r.height-330,Math.max(8,cy-r.top))+'px'
this.pal.classList.add('on')
this.pin.value=''
this.fill()
setTimeout(()=>this.pin.focus(),0)
}
closePal(){this.pal.classList.remove('on');this.pend=null;this.temp=null;if(this.svg)this.drawLinks()}
compat(t){
const p=this.pend
if(!p)return true
const d=this.defs[t],list=p.dir==='out'?d.in:d.out
return list.some(q=>!q.f&&((q.t==='exec')===(p.t==='exec')))
}
fill(){
const q=this.pin.value.trim().toLowerCase()
this.pl.innerHTML=''
let cat=''
const ts=Object.keys(this.defs).filter(t=>{const d=this.defs[t];return this.compat(t)&&(!q||(d.title+' '+d.cat).toLowerCase().indexOf(q)>=0)})
ts.sort((a,b)=>{const A=this.defs[a],B=this.defs[b];return A.cat<B.cat?-1:A.cat>B.cat?1:0})
let first=true
for(const t of ts){
const d=this.defs[t]
if(d.cat!==cat&&!q){cat=d.cat;const h=document.createElement('div');h.className='ne-pc';h.textContent=cat;this.pl.appendChild(h)}
const it=document.createElement('div')
it.className='ne-pi'+(first?' on':'')
first=false
it.dataset.t=t
it.innerHTML='<i style="background:'+(this.colors[d.cat]||'#666')+'"></i><span>'+d.title+'</span><em>'+d.cat+'</em>'
it.addEventListener('pointerdown',e=>{e.stopPropagation();this.pick(t)})
this.pl.appendChild(it)
}
if(!ts.length){const h=document.createElement('div');h.className='ne-pc';h.textContent='No matching nodes';this.pl.appendChild(h)}
}
pick(t){
const r=this.el.getBoundingClientRect(),[cx,cy]=this.palAt
const x=(cx-r.left-this.pan.x)/this.zoom,y=(cy-r.top-this.pan.y)/this.zoom
const n={id:this.g.nid++,type:t,x:Math.round(x),y:Math.round(y-20),v:{}}
this.g.nodes.push(n)
const p=this.pend
if(p){
const d=this.defs[t]
if(p.dir==='out'){
const q=d.in.find(q=>!q.f&&((q.t==='exec')===(p.t==='exec')))
if(q)this.g.links.push({a:p.node,ap:p.port,b:n.id,bp:q.n})
if(p.t==='exec')this.g.links=this.g.links.filter(l=>!(l.a===p.node&&l.ap===p.port&&l.b!==n.id))
}else{
const q=d.out.find(q=>(q.t==='exec')===(p.t==='exec'))
if(q){this.g.links=this.g.links.filter(l=>!(l.b===p.node&&l.bp===p.port));this.g.links.push({a:n.id,ap:q.n,b:p.node,bp:p.port})}
n.x-=230
}
}
this.closePal()
this.sel=n.id
this.render()
this.emit()
this.el.focus()
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
s.style.setProperty('--pc',TC[p.t]||TC.any)
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
i.className='sw'
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
el.style.setProperty('--cc',this.colors[d.cat]||'#666')
const h=document.createElement('div')
h.className='ne-head'
h.innerHTML='<span class="ne-ic">'+ic(CATI[d.cat]||'workflow',13)+'</span><span>'+d.title+'</span>'
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
const c=TC[a.dataset.t]||TC.any,d=this.path(x1,y1,x2,y2)
const glow=document.createElementNS(ns,'path')
glow.setAttribute('d',d)
glow.setAttribute('class','ne-glow')
glow.setAttribute('stroke',c)
svg.appendChild(glow)
const p=document.createElementNS(ns,'path')
p.setAttribute('d',d)
p.setAttribute('class','ne-link'+(a.dataset.t==='exec'?' ex':''))
p.setAttribute('stroke',c)
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
if(t.closest('.ne-pal'))return
if(this.pal.classList.contains('on'))this.closePal()
if(e.button===2)return
if(t.classList.contains('ne-port')){
this.el.focus()
let node=+t.dataset.node,port=t.dataset.port,dir=t.dataset.dir,ty=t.dataset.t
if(dir==='in'){
const i=this.g.links.findIndex(l=>l.b===node&&l.bp===port)
if(i>=0){
const l=this.g.links[i]
this.g.links.splice(i,1)
node=l.a
port=l.ap
dir='out'
const src=this.ports.get(node+':'+port+':out')
ty=src?src.dataset.t:ty
this.render()
this.emit()
}
}
this.mode={k:'link',node,port,dir,t:ty}
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
if(t.closest('.ne-link'))return
this.el.focus()
this.select(null)
this.mode={k:'pan',sx:e.clientX,sy:e.clientY,px:this.pan.x,py:this.pan.y}
this.el.classList.add('panning')
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
m.n.x=Math.round((x-m.ox)/8)*8
m.n.y=Math.round((y-m.oy)/8)*8
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
this.el.classList.remove('panning')
if(!m)return
try{this.el.releasePointerCapture(e.pointerId)}catch(x){}
if(m.k==='drag')this.emit()
if(m.k==='link'){
const t=document.elementFromPoint(e.clientX,e.clientY)
if(t&&t.classList.contains('ne-port')&&t.dataset.dir!==m.dir&&(t.dataset.t==='exec')===(m.t==='exec')&&+t.dataset.node!==m.node){
this.temp=null
const o=m.dir==='out'?{a:m.node,ap:m.port,b:+t.dataset.node,bp:t.dataset.port}:{a:+t.dataset.node,ap:t.dataset.port,b:m.node,bp:m.port}
this.g.links=this.g.links.filter(l=>!(l.b===o.b&&l.bp===o.bp)&&!(m.t==='exec'&&l.a===o.a&&l.ap===o.ap))
this.g.links.push(o)
this.render()
this.emit()
}else if(!t||!t.closest('.ne-node')){
this.pend={node:m.node,port:m.port,dir:m.dir,t:m.t}
this.openPal(e.clientX,e.clientY)
}else{this.temp=null;this.drawLinks()}
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
