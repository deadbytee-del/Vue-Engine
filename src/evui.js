(function(root){
const E=root.VueEvents
function create(host,o){
const h=o.h,ic=o.ic
let sheet=E.empty(),pop=null
const uid=()=>'r'+Math.random().toString(36).slice(2,8)
const change=()=>{o.onChange(sheet);draw()}
const closePop=()=>{if(pop){pop.remove();pop=null}}
document.addEventListener('mousedown',e=>{if(pop&&!pop.contains(e.target)&&!e.target.closest('[data-pick]'))closePop()})
function picker(anchor,title,cat,onPick){
closePop()
const inp=h('input',{class:'evq',placeholder:'Search '+title.toLowerCase()+'...',spellcheck:'false'})
const list=h('div',{class:'evl'})
const fill=()=>{
list.innerHTML=''
const q=inp.value.trim().toLowerCase()
const groups={}
for(const k in cat){
const d=cat[k]
if(q&&!(d.title.toLowerCase().includes(q)||String(d.cat).toLowerCase().includes(q)))continue
;(groups[d.cat]=groups[d.cat]||[]).push(k)
}
const names=Object.keys(groups)
if(!names.length)list.append(h('div',{class:'hint',text:'No match'}))
for(const g of names){
list.append(h('div',{class:'evh',text:g}))
for(const k of groups[g])list.append(h('button',{class:'evi',text:cat[k].title,onclick:()=>{closePop();onPick(k)}}))
}
}
inp.addEventListener('input',fill)
inp.addEventListener('keydown',e=>{if(e.key==='Escape')closePop();if(e.key==='Enter'){const b=list.querySelector('.evi');if(b)b.click()}})
pop=h('div',{class:'evpop'},inp,list)
document.body.append(pop)
const r=anchor.getBoundingClientRect()
pop.style.left=Math.min(r.left,innerWidth-330)+'px'
pop.style.top=Math.min(r.bottom+4,innerHeight-360)+'px'
fill()
inp.focus()
}
function defaults(d){
const v={}
for(const p of d.in)v[p.n]=p.d
return v
}
function field(d,v){
const out=[]
for(const p of d.in){
let el
const cur=v[p.n]==null?p.d:v[p.n]
if(p.t==='sel'){
el=h('select',{class:'evf'})
for(const op of p.o||[])el.append(h('option',{value:op[1],text:op[0]}))
el.value=String(cur)
el.onchange=()=>{v[p.n]=el.value;change()}
}else if(p.t==='bool'){
el=h('select',{class:'evf'},h('option',{value:'true',text:'yes'}),h('option',{value:'false',text:'no'}))
el.value=String(cur===true||cur==='true')
el.onchange=()=>{v[p.n]=el.value==='true';change()}
}else if(p.t==='col'){
el=h('input',{type:'color',class:'evf col',value:String(cur)})
el.onchange=()=>{v[p.n]=el.value;change()}
}else{
el=h('input',{class:'evf',value:String(cur),size:Math.max(3,Math.min(18,String(cur).length+1)),spellcheck:'false',title:p.n})
el.onchange=()=>{v[p.n]=p.t==='num'&&el.value.trim()!==''&&!isNaN(Number(el.value))?Number(el.value):el.value;change()}
}
out.push(h('label',{class:'evp'},h('span',{text:p.n}),el))
}
return out
}
function chip(d,item,onDel,extra){
if(!item.v)item.v=defaults(d)
const c=h('div',{class:'evc'+(item.off?' off':'')},h('span',{class:'evt',text:d.title}),...field(d,item.v))
if(extra)c.prepend(extra)
c.append(h('button',{class:'ib',title:'Remove',html:ic('x',11),onclick:onDel}))
return c
}
function condCell(r){
const box=h('div',{class:'evcell evif'},h('div',{class:'evlab',text:'If'}))
r.conds=r.conds||[]
r.conds.forEach((c,i)=>{
const d=E.COND[c.t]
if(!d)return
const neg=h('button',{class:'evneg'+(c.not?' on':''),title:'Invert this condition',text:'not',onclick:()=>{c.not=!c.not;change()}})
box.append(chip(d,c,()=>{r.conds.splice(i,1);change()},neg))
})
const row=h('div',{class:'evadd'},h('button',{class:'btn sm ghost','data-pick':1,html:ic('plus',12)+'Condition',onclick:e=>picker(e.currentTarget,'Conditions',E.COND,k=>{r.conds.push({t:k,v:defaults(E.COND[k])});change()})}))
if(r.conds.length>1)row.append(h('button',{class:'btn sm ghost',text:r.any?'Any of these':'All of these',title:'Switch between all and any',onclick:()=>{r.any=!r.any;change()}}))
box.append(row)
return box
}
function actCell(r){
const box=h('div',{class:'evcell evdo'},h('div',{class:'evlab',text:'Do'}))
r.acts=r.acts||[]
r.acts.forEach((a,i)=>{
const d=E.ACT[a.t]
if(!d)return
const up=h('button',{class:'ib',title:'Move up',html:ic('chevu',11),onclick:()=>{if(i){r.acts.splice(i-1,0,r.acts.splice(i,1)[0]);change()}}})
box.append(chip(d,a,()=>{r.acts.splice(i,1);change()},i?up:null))
})
box.append(h('div',{class:'evadd'},h('button',{class:'btn sm ghost','data-pick':1,html:ic('plus',12)+'Action',onclick:e=>picker(e.currentTarget,'Actions',E.ACT,k=>{r.acts.push({t:k,v:defaults(E.ACT[k])});change()})})))
return box
}
function head(r,list,i,sub){
const d=r.ev&&E.EV[r.ev.t]
const b=h('div',{class:'evwhen'},h('div',{class:'evlab',text:sub?'Then':'When'}))
if(d){
if(!r.ev.v)r.ev.v=defaults(d)
b.append(h('div',{class:'evc'},h('span',{class:'evt',text:d.title}),...field(d,r.ev.v)))
}
return b
}
function rowTools(r,list,i,sub){
return h('div',{class:'evtools'},
h('button',{class:'ib',title:r.off?'Turn on':'Turn off',html:ic(r.off?'eyeoff':'eye',12),onclick:()=>{r.off=!r.off;change()}}),
h('button',{class:'ib',title:'Move up',html:ic('chevu',12),onclick:()=>{if(i){list.splice(i-1,0,list.splice(i,1)[0]);change()}}}),
h('button',{class:'ib',title:'Move down',html:ic('chev',12),onclick:()=>{if(i<list.length-1){list.splice(i+1,0,list.splice(i,1)[0]);change()}}}),
!sub?h('button',{class:'ib',title:'Add a sub-event that runs inside this one',html:ic('plus',12),onclick:()=>{r.subs=r.subs||[];r.subs.push({id:uid(),k:'sub',conds:[],acts:[],subs:[]});change()}}):h('button',{class:'ib',title:'Add a nested sub-event',html:ic('plus',12),onclick:()=>{r.subs=r.subs||[];r.subs.push({id:uid(),k:'sub',conds:[],acts:[],subs:[]});change()}}),
h('button',{class:'ib',title:'Delete',html:ic('trash',12),onclick:()=>{list.splice(i,1);change()}}))
}
function rowEl(r,list,i,sub){
if(r.k==='group'){
const g=h('div',{class:'evgroup'+(r.off?' off':'')})
const nm=h('input',{class:'evname',value:r.name||'Group',spellcheck:'false'})
nm.onchange=()=>{r.name=nm.value;change()}
g.append(h('div',{class:'evghead'},h('button',{class:'ib',title:r.closed?'Open':'Close',html:ic(r.closed?'chevr':'chev',12),onclick:()=>{r.closed=!r.closed;change()}}),nm,rowTools(r,list,i,true)))
if(!r.closed){
const body=h('div',{class:'evgbody'})
r.vars=r.vars||[]
r.vars.forEach((v,j)=>body.append(varRow(v,()=>{r.vars.splice(j,1);change()})))
r.rows=r.rows||[]
r.rows.forEach((q,j)=>body.append(rowEl(q,r.rows,j,false)))
body.append(h('div',{class:'evadd'},
h('button',{class:'btn sm ghost','data-pick':1,html:ic('plus',12)+'Event',onclick:e=>picker(e.currentTarget,'Events',E.EV,k=>{r.rows.push(newEvent(k));change()})}),
h('button',{class:'btn sm ghost',html:ic('plus',12)+'Local variable',onclick:()=>{r.vars.push({n:'count',v:0});change()}})))
g.append(body)
}
return g
}
const el=h('div',{class:'evrow'+(r.off?' off':'')+(sub?' sub':'')})
el.append(head(r,list,i,sub),condCell(r),actCell(r),rowTools(r,list,i,sub))
const wrap=h('div',{class:'evwrap'},el)
if(r.subs&&r.subs.length){
const sb=h('div',{class:'evsubs'})
r.subs.forEach((q,j)=>sb.append(rowEl(q,r.subs,j,true)))
wrap.append(sb)
}
return wrap
}
function newEvent(k){
return{id:uid(),k:'event',ev:{t:k,v:defaults(E.EV[k])},conds:[],acts:[],subs:[]}
}
function varRow(v,del){
const n=h('input',{class:'evf',value:v.n,size:8,spellcheck:'false'}),val=h('input',{class:'evf',value:String(v.v),size:8,spellcheck:'false'})
n.onchange=()=>{v.n=n.value.replace(/[^A-Za-z0-9_]/g,'')||'count';change()}
val.onchange=()=>{v.v=val.value.trim()!==''&&!isNaN(Number(val.value))?Number(val.value):val.value;change()}
return h('div',{class:'evvar'},h('span',{class:'evlab',text:'Local variable'}),n,h('span',{text:'starts at'}),val,h('button',{class:'ib',title:'Remove',html:ic('x',11),onclick:del}))
}
function draw(){
const keep=host.scrollTop
host.innerHTML=''
const bar=h('div',{class:'evbar'},
h('button',{class:'btn sm primary','data-pick':1,html:ic('plus',13)+'Add event',onclick:e=>picker(e.currentTarget,'Events',E.EV,k=>{sheet.rows.push(newEvent(k));change()})}),
h('button',{class:'btn sm',html:ic('folder',13)+'Add group',onclick:()=>{sheet.rows.push({id:uid(),k:'group',name:'Group',rows:[],vars:[]});change()}}),
h('button',{class:'btn sm',html:ic('plus',13)+'Variable',onclick:()=>{sheet.vars.push({n:'count',v:0});change()}}))
host.append(bar)
const body=h('div',{class:'evbody'})
sheet.vars.forEach((v,j)=>body.append(varRow(v,()=>{sheet.vars.splice(j,1);change()})))
sheet.rows.forEach((r,i)=>body.append(rowEl(r,sheet.rows,i,false)))
if(!sheet.rows.length)body.append(h('div',{class:'empty'},h('h3',{text:'No events yet'}),h('p',{text:'An event sheet reads like a sentence. When something happens, if some conditions are true, do these actions.'}),h('button',{class:'btn primary','data-pick':1,html:ic('plus',13)+'Add your first event',onclick:e=>picker(e.currentTarget,'Events',E.EV,k=>{sheet.rows.push(newEvent(k));change()})})))
host.append(body)
host.scrollTop=keep
}
const last=()=>{
let r=null
for(const q of sheet.rows)if(q.k==='event')r=q
if(!r){r=newEvent('start');sheet.rows.push(r)}
return r
}
return{addEvent:k=>{sheet.rows.push(newEvent(k));change()},addAction:k=>{last().acts.push({t:k,v:defaults(E.ACT[k])});change()},addCondition:k=>{last().conds.push({t:k,v:defaults(E.COND[k])});change()},load:s=>{sheet=s||E.empty();if(!sheet.rows)sheet.rows=[];if(!sheet.vars)sheet.vars=[];closePop();draw()},get:()=>sheet}
}
root.VueEventsUI={create}
})(window)
