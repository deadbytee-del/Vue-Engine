(function(root){
const h=(t,a,...c)=>{const e=document.createElement(t);if(a)for(const k in a){const v=a[k];if(v==null)continue;if(k==='class')e.className=v;else if(k==='text')e.textContent=v;else if(k==='html')e.innerHTML=v;else if(k.slice(0,2)==='on')e.addEventListener(k.slice(2),v);else e.setAttribute(k,v)}for(const x of c)if(x!=null&&x!==false)e.append(x);return e}
const ic=(n,s)=>root.VueIcon(n,s||16)
const U=()=>root.VueUI
let host,el,stage,list,insp,wrap,sel=null,drag=null,snapOn=true,k=1
const sceneUI=()=>{const s=host.scene();if(!s.ui)s.ui=[];return s.ui}
const cur=()=>sceneUI().find(u=>u.id===sel)||null
const res=()=>{const s=host.settings();return[s.width||960,s.height||540]}
function commit(){host.dirty()}
function snapshot(){host.snap()}
function init(hst,parent){
host=hst
el=h('div',{class:'uied'})
list=h('div',{class:'uil'})
wrap=h('div',{class:'uiw'})
stage=h('div',{class:'uis'})
wrap.append(stage)
insp=h('div',{class:'uii'})
el.append(list,wrap,insp)
parent.append(el)
new ResizeObserver(fit).observe(wrap)
document.addEventListener('keydown',e=>{
if(!el.parentNode||!el.parentNode.classList.contains('on'))return
const t=e.target
if(t&&(t.tagName==='INPUT'||t.tagName==='TEXTAREA'||t.tagName==='SELECT'))return
const u=cur()
if(!u)return
const key=e.key
if(key==='Delete'||key==='Backspace'){e.preventDefault();remove(u)}
else if(key.startsWith('Arrow')){e.preventDefault();snapshot();const d=e.shiftKey?10:1;if(key==='ArrowLeft')u.x-=d;if(key==='ArrowRight')u.x+=d;if(key==='ArrowUp')u.y-=d;if(key==='ArrowDown')u.y+=d;commit();paint();fields()}
else if((e.ctrlKey||e.metaKey)&&key.toLowerCase()==='d'){e.preventDefault();dup(u)}
})
stage.addEventListener('pointerdown',e=>{if(e.target===stage){sel=null;paint();build()}})
}
function show(){build();fit();paint()}
function fit(){
if(!wrap||!wrap.clientWidth)return
const[W,H]=res(),m=40
k=Math.max(0.1,Math.min((wrap.clientWidth-m)/W,(wrap.clientHeight-m)/H))
stage.style.width=W+'px';stage.style.height=H+'px'
stage.style.transform='translate(-50%,-50%) scale('+k+')'
const s=host.scene()
stage.style.background=s.bg||'#111'
}
function add(type){
snapshot()
const u=U().make(type)
u.name=type[0].toUpperCase()+type.slice(1)+' '+(sceneUI().length+1)
sceneUI().push(u);sel=u.id;commit();build();paint()
}
function remove(u){snapshot();const l=sceneUI();l.splice(l.indexOf(u),1);sel=null;commit();build();paint()}
function dup(u){snapshot();const c=structuredClone(u);c.id=U().make('panel').id;c.name=u.name+' copy';c.x+=16;c.y+=16;sceneUI().push(c);sel=c.id;commit();build();paint()}
function build(){
list.textContent=''
list.append(h('div',{class:'sth',text:'Add'}))
const g=h('div',{class:'uig'})
for(const[t,n]of U().TYPES)g.append(h('button',{class:'btn sm',text:n,onclick:()=>add(t)}))
list.append(g,h('div',{class:'sth',text:'On screen'}))
const l=sceneUI()
if(!l.length)list.append(h('p',{class:'stnote',text:'Nothing yet. Add a panel, text, image, button or bar, then drag it into place.'}))
for(let i=l.length-1;i>=0;i--){
const u=l[i]
list.append(h('div',{class:'uir'+(u.id===sel?' on':''),onclick:()=>{sel=u.id;paint();build()}},h('span',{text:u.name}),h('i',{text:u.type}),
h('button',{class:'ib',title:'Bring forward',html:ic('chevu',12),onclick:ev=>{ev.stopPropagation();if(i<l.length-1){snapshot();[l[i],l[i+1]]=[l[i+1],l[i]];commit();build();paint()}}}),
h('button',{class:'ib',title:'Delete',html:ic('trash',12),onclick:ev=>{ev.stopPropagation();remove(u)}})))
}
fields()
}
function paint(){
const[W,H]=res(),imgs=host.assets()
stage.textContent=''
fit()
stage.append(h('div',{class:'uigrid'}))
for(const u of sceneUI()){
const r=U().rect(u,W,H)
const d=h('div',{class:'uiw2 '+u.type+(u.id===sel?' sel':''),style:'left:'+r.x+'px;top:'+r.y+'px;width:'+r.w+'px;height:'+r.h+'px;border-radius:'+u.radius+'px;opacity:'+u.opacity})
let bg=u.color&&u.color!=='transparent'?u.color:''
if(u.type==='bar'){d.style.background=bg;d.append(h('div',{class:'uifill',style:'width:60%;background:'+u.tint+';border-radius:'+u.radius+'px'}))}
else d.style.background=bg
const a=u.texture&&imgs[u.texture]
if(a){
d.style.backgroundImage='url('+a.data+')'
d.style.backgroundSize=u.fit==='stretch'?'100% 100%':u.fit==='tile'?'auto':u.fit
d.style.backgroundRepeat=u.fit==='tile'?'repeat':'no-repeat';d.style.backgroundPosition='center'
}
if(u.border>0)d.style.boxShadow='inset 0 0 0 '+u.border+'px '+u.borderColor
if(u.text&&u.type!=='image'&&u.type!=='bar'){
d.append(h('span',{class:'uit',style:'color:'+u.tcolor+';font-size:'+u.size+'px;font-weight:'+(u.bold?600:400)+';text-align:'+u.align+';justify-content:'+(u.align==='left'?'flex-start':u.align==='right'?'flex-end':'center'),text:U().fill(u.text,{score:0,health:100,coins:0,lives:3})}))
}
d.addEventListener('pointerdown',ev=>{
ev.stopPropagation()
if(ev.button!==0)return
sel=u.id
snapshot()
drag={u,mode:'move',x0:ev.clientX,y0:ev.clientY,r:{...U().rect(u,W,H)},moved:false}
d.setPointerCapture(ev.pointerId)
paint();build()
})
if(u.id===sel){
for(const hd of['nw','n','ne','e','se','s','sw','w']){
const hn=h('div',{class:'uih '+hd})
hn.addEventListener('pointerdown',ev=>{ev.stopPropagation();snapshot();drag={u,mode:hd,x0:ev.clientX,y0:ev.clientY,r:{...U().rect(u,W,H)},moved:false};hn.setPointerCapture(ev.pointerId)})
hn.addEventListener('pointermove',mv);hn.addEventListener('pointerup',up)
d.append(hn)
}
}
d.addEventListener('pointermove',mv);d.addEventListener('pointerup',up)
stage.append(d)
}
}
function setRect(u,r){
const[W,H]=res()
u.w=Math.max(4,Math.round(r.w));u.h=Math.max(4,Math.round(r.h))
u.x=Math.round(r.x-u.ax*W+u.ax*u.w);u.y=Math.round(r.y-u.ay*H+u.ay*u.h)
}
function mv(ev){
if(!drag)return
const[W,H]=res(),d=drag,dx=(ev.clientX-d.x0)/k,dy=(ev.clientY-d.y0)/k
if(Math.abs(dx)+Math.abs(dy)>2)d.moved=true
if(!d.moved)return
const g=snapOn?(ev.altKey?1:8):1,sn=v=>Math.round(v/g)*g
const r={...d.r}
if(d.mode==='move'){
r.x=sn(d.r.x+dx);r.y=sn(d.r.y+dy)
if(snapOn){
const cx=r.x+r.w/2,cy=r.y+r.h/2
if(Math.abs(cx-W/2)<8)r.x=W/2-r.w/2
if(Math.abs(cy-H/2)<8)r.y=H/2-r.h/2
}
}else{
const m=d.mode
if(m.includes('e'))r.w=Math.max(4,sn(d.r.w+dx))
if(m.includes('s'))r.h=Math.max(4,sn(d.r.h+dy))
if(m.includes('w')){const nw=Math.max(4,sn(d.r.w-dx));r.x=d.r.x+d.r.w-nw;r.w=nw}
if(m.includes('n')){const nh=Math.max(4,sn(d.r.h-dy));r.y=d.r.y+d.r.h-nh;r.h=nh}
}
setRect(d.u,r)
const n=stage.querySelector('.uiw2.sel')
if(n){const q=U().rect(d.u,W,H);n.style.left=q.x+'px';n.style.top=q.y+'px';n.style.width=q.w+'px';n.style.height=q.h+'px'}
}
function up(ev){
if(!drag)return
const m=drag.moved
drag=null
if(m){commit();paint();fields()}
}
function fld(label,node){return h('div',{class:'stf'},h('label',{text:label}),node)}
function num(u,key,step){const i=h('input',{type:'number',step:step||1,value:u[key]});i.addEventListener('change',()=>{snapshot();u[key]=parseFloat(i.value)||0;commit();paint()});return i}
function txt(u,key,ph){const i=h('input',{type:'text',value:u[key]==null?'':u[key],placeholder:ph||''});i.addEventListener('change',()=>{snapshot();u[key]=i.value;commit();paint();if(key==='name')build()});return i}
function col(u,key){const i=h('input',{type:'color',value:/^#[0-9a-f]{6}$/i.test(u[key])?u[key]:'#000000'});i.addEventListener('input',()=>{u[key]=i.value;paint()});i.addEventListener('change',()=>{snapshot();u[key]=i.value;commit();paint()});return i}
function sld(u,key,min,max,step){const w=h('div',{class:'stsl'}),r=h('input',{type:'range',min,max,step,value:u[key]}),n=h('input',{type:'number',min,max,step,value:u[key]});r.addEventListener('input',()=>{u[key]=+r.value;n.value=r.value;paint()});r.addEventListener('change',()=>{snapshot();commit()});n.addEventListener('change',()=>{snapshot();u[key]=parseFloat(n.value)||0;r.value=n.value;commit();paint()});w.append(r,n);return w}
function sel2(opts,v,fn){const s=h('select');for(const[a,b]of opts)s.append(h('option',{value:a,text:b}));s.value=v;s.addEventListener('change',()=>fn(s.value));return s}
function anchor(u){
const[W,H]=res(),g=h('div',{class:'uian'})
for(const ay of[0,0.5,1])for(const ax of[0,0.5,1])g.append(h('button',{class:u.ax===ax&&u.ay===ay?'on':'',title:'Pin to this part of the screen',onclick:()=>{snapshot();const r=U().rect(u,W,H);u.ax=ax;u.ay=ay;setRect(u,r);commit();paint();fields()}}))
return g
}
function importTex(u){
const i=h('input',{type:'file',accept:'image/*'})
i.onchange=()=>{
const f=i.files[0]
if(!f)return
const fr=new FileReader()
fr.onload=()=>{
const a=host.assets()
let n=f.name,c=2
while(a[n])n=f.name.replace(/(\.[^.]*)?$/,' '+c+++'$1')
snapshot();a[n]={type:'image',data:fr.result};u.texture=n;host.assetsChanged();commit();paint();fields()
}
fr.readAsDataURL(f)
}
i.click()
}
function fields(){
insp.textContent=''
const u=cur()
if(!u){insp.append(h('h4',{text:'UI'}),h('p',{class:'stnote',text:'This is what the player sees on top of the scene. Add pieces on the left, drag them into place, and pick one to change its look, texture and what it does. Pieces stick to a part of the screen, so they stay put at any window size.'}),h('label',{class:'stck'},h('input',{type:'checkbox',checked:snapOn?'':null,onchange:e=>{snapOn=e.target.checked}}),h('span',{text:'Snap to a grid and the center (hold Alt to turn off)'})));return}
const imgs=host.assets(),names=Object.keys(imgs).filter(n=>imgs[n].type==='image')
const b=insp
b.append(h('h4',{text:u.name}),fld('Name',txt(u,'name')))
b.append(h('h4',{text:'Place'}),fld('Pin to',anchor(u)),fld('X',num(u,'x')),fld('Y',num(u,'y')),fld('Width',num(u,'w')),fld('Height',num(u,'h')))
b.append(h('h4',{text:'Look'}),fld('Color',col(u,'color')),h('label',{class:'stck'},h('input',{type:'checkbox',checked:u.color==='transparent'?'':null,onchange:e=>{snapshot();u.color=e.target.checked?'transparent':'#1d1d1d';commit();paint();fields()}}),h('span',{text:'No fill'})),fld('See-through',sld(u,'opacity',0,1,0.01)),fld('Corners',sld(u,'radius',0,80,1)),fld('Outline',sld(u,'border',0,12,1)))
if(u.border>0)b.append(fld('Outline color',col(u,'borderColor')))
if(u.type==='bar')b.append(fld('Fill color',col(u,'tint')))
b.append(h('h4',{text:'Texture'}))
b.append(fld('Image',sel2([['','None'],...names.map(n=>[n,n])],u.texture||'',v=>{snapshot();u.texture=v;commit();paint()})),fld('Fit',sel2([['stretch','Stretch'],['cover','Fill and crop'],['contain','Fit inside'],['tile','Repeat']],u.fit,v=>{snapshot();u.fit=v;commit();paint()})),h('button',{class:'btn sm',html:ic('upload',13)+'<span>Add a texture…</span>',onclick:()=>importTex(u)}))
if(u.type!=='image'&&u.type!=='bar'){
b.append(h('h4',{text:'Text'}),fld('Words',txt(u,'text','Use {score} for a variable')),fld('Size',num(u,'size')),fld('Color',col(u,'tcolor')),fld('Align',sel2([['left','Left'],['center','Center'],['right','Right']],u.align,v=>{snapshot();u.align=v;commit();paint()})))
b.append(h('p',{class:'stnote',text:'Put a variable name in braces, like {score} or {coins}, and it shows the live value in the game.'}))
}
if(u.type==='bar'){
b.append(h('h4',{text:'Fill'}),fld('Variable',txt(u,'bind','health')),fld('Full at',num(u,'max')),h('p',{class:'stnote',text:'The bar fills as this variable goes from 0 up to the full value.'}))
}
if(u.type==='button'){
b.append(h('h4',{text:'When clicked'}),fld('Do',sel2([['','Nothing'],['scene','Go to a scene'],['set','Set a variable'],['add','Add to a variable'],['toggle','Flip a variable']],u.act,v=>{snapshot();u.act=v;commit();fields()})))
if(u.act==='scene')b.append(fld('Scene',sel2(host.scenes().map(s=>[s.name,s.name]),u.target,v=>{snapshot();u.target=v;commit()})))
else if(u.act)b.append(fld('Variable',txt(u,'target','score')),u.act==='toggle'?null:fld('Value',txt(u,'value','1')))
b.append(fld('Hover color',col(u,'hover')))
if(u.act==='scene'&&!u.target){u.target=host.scenes()[0].name}
}
b.append(h('h4',{text:'Show'}),fld('Only when',txt(u,'show','variable name, or empty for always')))
b.append(h('div',{class:'stgrid'},h('button',{class:'btn sm',text:'Duplicate',onclick:()=>dup(u)}),h('button',{class:'btn sm danger',text:'Delete',onclick:()=>remove(u)})))
}
root.VueUIEd={init,show,refresh:()=>{if(el&&el.parentNode.classList.contains('on')){build();paint()}}}
})(window)
