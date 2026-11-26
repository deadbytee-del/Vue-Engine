(function(root){
const N=typeof module!=='undefined'&&module.exports?require('./nodedefs.js'):root.VueNodes
const J=JSON.stringify
const ND=N.defs
const OPS=['==','!=','<','>','<=','>='].map(o=>[o,o])
const fp=(n,t,d,o)=>({n,t,d,o,f:1})
const pp=(n,t,d,o)=>({n,t,d,o})
const lit=(p,v)=>N.literal(p,v)
const val=(p,v)=>{
if(v===undefined||v===null)v=p.d
const s=String(v)
if(p.t==='any'||p.t==='num'){
const m=/^\{(\w+)\}$/.exec(s)
if(m)return m[1]
}
return lit(p,v)
}
const EV={}
for(const k in ND){
const d=ND[k]
if(!d.ev)continue
EV[k]={title:d.title.replace(/^On /,'When '),cat:'Events',in:d.in.filter(p=>p.f),args:d.args,ev:v=>d.ev({v}),pre:d.pre&&((v,a)=>d.pre({v},a))}
}
EV.every={title:'Every few seconds',cat:'Events',in:[pp('sec','num',1)],args:[],ev:()=>'every',reg:(v,fn,a)=>`vue.every(${a('sec')},${fn});\n`}
EV.death={title:'When this dies',cat:'Behaviors',in:[],args:[],ev:()=>'beh:death'}
EV.hurt={title:'When this is hurt',cat:'Behaviors',in:[],args:['amount'],ev:()=>'beh:hurt'}
EV.pickup={title:'When picked up',cat:'Behaviors',in:[],args:['who'],ev:()=>'beh:pickup'}
EV.attack={title:'When this attacks',cat:'Behaviors',in:[],args:['target'],ev:()=>'beh:attack'}
EV.goal={title:'When a goal is scored',cat:'Behaviors',in:[],args:['ball'],ev:()=>'beh:goal'}
EV.enter={title:'When something enters this zone',cat:'Behaviors',in:[],args:['other'],ev:()=>'beh:enter'}
EV.opened={title:'When this opens',cat:'Behaviors',in:[],args:[],ev:()=>'beh:open'}
EV.checkpoint={title:'When a checkpoint is reached',cat:'Behaviors',in:[],args:['who'],ev:()=>'beh:checkpoint'}
const C=(title,params,x,cat)=>({title,cat:cat||'Common',in:params,x})
const COND={
key:C('Key is held',[fp('key','sel','space',N.KEYS)],(v,a)=>`vue.key(${a('key')})`,'Input'),
keyp:C('Key was just pressed',[fp('key','sel','space',N.KEYS)],(v,a)=>`vue.pressed(${a('key')})`,'Input'),
mouse:C('Mouse is down',[],()=>'vue.mouse.down','Input'),
touch:C('Touching tag',[fp('tag','str','')],(v,a)=>`self.touching(${a('tag')})`,'Physics'),
grounded:C('Is on the ground',[],()=>'self.grounded','Physics'),
hastag:C('Has tag',[fp('tag','str','')],(v,a)=>`self.hasTag(${a('tag')})`,'Common'),
other:C('Other has tag',[fp('tag','str','')],(v,a)=>`(typeof other!=='undefined'&&!!other&&other.hasTag(${a('tag')}))`,'Physics'),
prop:C('Property compares',[fp('prop','sel','x',['x','y','z','vx','vy','vz','w','h','rot','alpha','hp'].map(p=>[p,p])),fp('op','sel','>',OPS),pp('value','any',0)],(v,a)=>`(+self[${a('prop')}]${OPS.some(o=>o[0]===v.op)?v.op:'>'}${a('value')})`,'Common'),
gvar:C('Global variable compares',[fp('name','str','score'),fp('op','sel','>=',OPS),pp('value','any',0)],(v,a)=>`((vue.vars[${a('name')}]??0)${OPS.some(o=>o[0]===v.op)?v.op:'>='}${a('value')})`,'Variables'),
lvar:C('Local variable compares',[fp('name','str','count'),fp('op','sel','>=',OPS),pp('value','any',0)],(v,a)=>`(${/^[A-Za-z_]\w*$/.test(v.name||'count')?v.name||'count':'count'}${OPS.some(o=>o[0]===v.op)?v.op:'>='}${a('value')})`,'Variables'),
chance:C('Random chance (percent)',[pp('pct','num',50)],(v,a)=>`(vue.random(0,100)<${a('pct')})`,'Common'),
near:C('Near entity',[fp('name','str','Player'),pp('dist','num',100)],(v,a)=>`(vue.dist(self,vue.find(${a('name')}))<${a('dist')})`,'Physics'),
cut:C('In a cutscene',[],()=>'vue.inCutscene','Common'),
count:C('Count of tag compares',[fp('tag','str','enemy'),fp('op','sel','==',OPS),pp('value','num',0)],(v,a)=>`(vue.count(${a('tag')})${OPS.some(o=>o[0]===v.op)?v.op:'=='}${a('value')})`,'Common'),
alive:C('Entity exists',[fp('name','str','Player')],(v,a)=>`!!vue.find(${a('name')})`,'Common'),
scene:C('Scene is',[fp('name','str','Level 1')],(v,a)=>`(vue.scene===${a('name')})`,'Common')
}
const ACT={}
const SKIP=new Set(['branch','repeat','forever','foreach','waituntil','setvar','changevar','setlocal'])
for(const k in ND){
const d=ND[k]
if(!d.c||d.ev||SKIP.has(k))continue
ACT[k]={title:d.title,cat:d.cat,in:d.in.filter(p=>p.t!=='exec'),c:(v,a)=>d.c({id:0,v},a,()=>'')}
}
const A=(title,params,c,cat)=>({title,cat:cat||'Variables',in:params,c})
ACT.setg=A('Set global variable',[fp('name','str','score'),pp('value','any',0)],(v,a)=>`vue.vars[${a('name')}]=${a('value')};\n`)
ACT.addg=A('Change global variable',[fp('name','str','score'),pp('by','num',1)],(v,a)=>`vue.vars[${a('name')}]=(+vue.vars[${a('name')}]||0)+${a('by')};\n`)
ACT.setl=A('Set local variable',[fp('name','str','count'),pp('value','any',0)],(v,a)=>`${/^[A-Za-z_]\w*$/.test(v.name||'count')?v.name||'count':'count'}=${a('value')};\n`)
ACT.addl=A('Change local variable',[fp('name','str','count'),pp('by','num',1)],(v,a)=>{const n=/^[A-Za-z_]\w*$/.test(v.name||'count')?v.name||'count':'count';return`${n}=(+${n}||0)+${a('by')};\n`})
ACT.hurtt=A('Hurt entity',[pp('entity','ent','Player'),pp('amount','num',10)],(v,a)=>`{const t=${a('entity')};if(t)t.hurt(${a('amount')});}\n`,'Behaviors')
ACT.healt=A('Heal entity',[pp('entity','ent','self'),pp('amount','num',10)],(v,a)=>`{const t=${a('entity')};if(t)t.heal(${a('amount')});}\n`,'Behaviors')
ACT.respawn=A('Respawn at checkpoint',[pp('entity','ent','self')],(v,a)=>`vue.respawn(${a('entity')});\n`,'Behaviors')
ACT.channel=A('Set channel (doors and switches)',[fp('name','str','A'),pp('on','bool',true)],(v,a)=>`vue.channel(${a('name')},${a('on')});\n`,'Behaviors')
ACT.score=A('Add score to a team',[fp('team','str','blue'),pp('by','num',1)],(v,a)=>`vue.score(${a('team')},${a('by')});\n`,'Behaviors')
ACT.give=A('Give item',[pp('entity','ent','Player'),fp('item','str','key'),pp('count','num',1)],(v,a)=>`{const t=${a('entity')};if(t)vue.give(t,${a('item')},${a('count')});}\n`,'Behaviors')
ACT.sway=A('Sway side to side',[pp('rate','num',1.5),pp('speed','num',120)],(v,a)=>`self.vx=Math.sin(vue.time*${a('rate')})*${a('speed')};\n`,'Motion')
ACT.chaset=A('Move toward an object',[fp('name','str','Player'),pp('speed','num',90)],(v,a)=>`{const t=vue.find(${a('name')});if(t){self.vx=Math.sign(t.x-self.x)*${a('speed')};self.vy=Math.sign(t.y-self.y)*${a('speed')};}}\n`,'Motion')
ACT.waitf=A('Wait (frames)',[pp('frames','num',1)],(v,a)=>`for(let i=0;i<${a('frames')};i++)await vue.frame();\n`,'Flow')
ACT.destroyself=A('Destroy this',[],()=>`self.destroy();\n`,'Game')
ACT.stop=A('Stop this event',[],()=>`return;\n`,'Flow')
const sg=(d,v,k)=>{
const p=d.in.find(q=>q.n===k)
return p?val(p,v&&v[k]):'0'
}
const argFor=(d,v)=>k=>sg(d,v,k)
const ident=s=>/^[A-Za-z_]\w*$/.test(s||'')
function condCode(c,i){
const d=COND[c.t]
if(!d)return 'true'
const x=d.x(c.v||{},argFor(d,c.v))
return c.not?`!(${x})`:`(${x})`
}
function actCode(a){
const d=ACT[a.t]
if(!d)return ''
const f=a.v||{}
return d.c(f,argFor(d,f))
}
function blockOf(r){
let s=''
const cs=(r.conds||[]).map(condCode)
const pre=cs.length?`if(!(${cs.join(r.any?'||':'&&')}))return;\n`:''
for(const a of r.acts||[])if(!a.off)s+=actCode(a)
for(const q of r.subs||[])if(!q.off)s+=subCode(q)
return{pre,body:s}
}
function subCode(r){
const cs=(r.conds||[]).map(condCode)
let inner=''
for(const a of r.acts||[])if(!a.off)inner+=actCode(a)
for(const q of r.subs||[])if(!q.off)inner+=subCode(q)
return cs.length?`if(${cs.join(r.any?'||':'&&')}){\n${inner}}\n`:`{\n${inner}}\n`
}
function rowCode(r){
if(r.off)return ''
if(r.k==='group'){
let s='{\n'
for(const g of r.vars||[])if(ident(g.n))s+=`let ${g.n}=${lit({t:'any'},g.v)};\n`
for(const q of r.rows||[])s+=rowCode(q)
return s+'}\n'
}
const d=EV[r.ev&&r.ev.t]
if(!d)return ''
const v=r.ev.v||{}
const a=argFor(d,v)
const b=blockOf(r)
const body=(d.pre?d.pre(v,a):'')+b.pre+b.body
const fn=`${/\bawait\b/.test(body)?'async ':''}function(${d.args.join(',')}){\n${body}}`
if(d.reg)return d.reg(v,fn,a)
return `on(${J(d.ev(v))},${fn});\n`
}
function compileEvents(s){
if(!s)return''
let out=''
for(const g of s.vars||[])if(ident(g.n))out+=`let ${g.n}=${lit({t:'any'},g.v)};\n`
for(const r of s.rows||[])out+=rowCode(r)
return out
}
function empty(){return{v:1,vars:[],rows:[]}}
function count(s){
let n=0
const w=rs=>{for(const r of rs||[]){n++;w(r.rows);w(r.subs)}}
w(s&&s.rows)
return n
}
function fromNodes(g){
const nodes=g&&g.nodes||[],links=g&&g.links||[]
const byId=new Map(nodes.map(n=>[n.id,n]))
const rows=[]
const unmapped=[]
for(const n of nodes){
const d=ND[n.type]
if(!d||!d.ev)continue
const row={id:'r'+n.id,k:'event',ev:{t:n.type,v:Object.assign({},n.v)},conds:[],acts:[],subs:[]}
let cur=n,port='next',guard=0
for(;;){
const l=links.find(q=>q.a===cur.id&&q.ap===port)
if(!l||guard++>200)break
const t=byId.get(l.b),td=t&&ND[t.type]
if(!td||!ACT[t.type]||td.end||td.ev){if(t)unmapped.push(t.type);break}
if(links.some(q=>q.b===t.id&&q.bp!=='in'&&!(td.in.find(p=>p.n===q.bp)||{}).f)){unmapped.push(t.type+' with wired inputs');break}
row.acts.push({t:t.type,v:Object.assign({},t.v)})
cur=t
port='next'
}
rows.push(row)
}
const wired=nodes.some(n=>ND[n.type]&&!ND[n.type].ev&&!ACT[n.type]&&!ND[n.type].c)
return{sheet:{v:1,vars:[],rows},ok:!unmapped.length&&!wired&&rows.length>0,unmapped}
}
const api={EV,COND,ACT,compileEvents,empty,count,fromNodes}
if(typeof module!=='undefined'&&module.exports)module.exports=api
else root.VueEvents=api
})(typeof window!=='undefined'?window:globalThis);
