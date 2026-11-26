(function(root){
const H=root.VueHelp,BH=root.VueBehaviors
function create(o){
const h=o.h,ic=o.ic,$=o.$,S=o.S
let pop=null,mini=null
const closeHelp=()=>{
if(mini){try{mini.stop()}catch(e){}mini=null}
if(pop){pop.remove();pop=null}
}
async function showHelp(topic,opt){
closeHelp()
opt=opt||{}
const B=BH.BEH[topic]
const T=H.TOPICS[topic]
if(!B&&!T)return
pop=h('div',{class:'helppop'})
const head=h('div',{class:'hhead'},h('b',{text:opt.test?'Test: '+topic:'How '+(B?topic:T.title)+' works'}),h('button',{class:'ib',title:'Close',html:ic('x',13),onclick:closeHelp}))
const body=h('div',{class:'hbody'})
body.append(h('p',{text:B?B.desc:T.text}))
if(B){
const fields=B.fields.filter(f=>!f.adv).slice(0,4)
body.append(h('ul',null,...fields.map(f=>h('li',null,h('b',{text:f.k.replace(/([A-Z])/g,' $1').replace(/^./,c=>c.toUpperCase())+': '}),f.tip))))
}else body.append(h('ol',null,...T.steps.map(s=>h('li',{text:s}))))
if(B){
const cv=h('canvas',{width:320,height:180,class:'hcv'})
const note=h('div',{class:'hint',text:H.hint(topic)||'This is a live example. Try changing the values and press Test again.'})
body.append(cv,note,h('button',{class:'btn sm',html:ic('play',12)+'Restart',onclick:()=>run()}))
const run=async()=>{
if(mini){try{mini.stop()}catch(e){}mini=null}
const m=H.miniProject(topic,opt.vals)
const g=new root.VueRuntime.Game({canvas:cv,project:m.project,scripts:m.scripts})
mini=g
try{await g.start()}catch(e){}
}
setTimeout(run,0)
}
pop.append(head,body)
document.body.append(pop)
}
const TUTS=[]
const byText=(sel,re)=>()=>Array.from(document.querySelectorAll(sel)).find(x=>re.test(x.textContent))
const ents=()=>S.project.scenes.flatMap(s=>s.entities)
const sel=()=>o.selData()
const scriptHas=(d,str)=>!!(d&&d.script&&JSON.stringify(d.script.blocks||d.script.events||'').includes(str))
TUTS.push({id:'move',title:'Make an object move',desc:'Create an object and move it with the keyboard.',steps:[
{t:'Click the + next to Hierarchy to create an object.',at:()=>Array.from(document.querySelectorAll('.ph')).find(x=>/hierarchy/i.test(x.textContent))?.querySelector('.ib:last-of-type,button:last-of-type'),ok:()=>ents().length>(S.tutBase.n||0)},
{t:'Click your new object in the Hierarchy to select it.',at:()=>document.querySelector('#hier .item.on')||document.querySelector('#hier .item'),ok:()=>!!sel()},
{t:'Press Add Component in the Inspector, then choose Blocks script.',at:()=>document.querySelector('.addc'),ok:()=>!!(sel()&&sel().script)},
{t:'Open the Script tab at the top.',at:()=>document.querySelector('.ws button[data-tab=script]'),ok:()=>S.tab==='script'},
{t:'Drag a "when key pressed" block and a "change x by" block inside it. They live under Common.',at:()=>document.querySelector('#blk'),ok:()=>scriptHas(sel(),'vue_on_key')&&scriptHas(sel(),'vue_change_x')},
{t:'Press Play and use the key you picked. Then press Stop.',at:()=>document.querySelector('#bPlay'),ok:()=>S.playing}
]})
TUTS.push({id:'enemy',title:'Make an enemy',desc:'Add an enemy that patrols, chases and hurts the player.',steps:[
{t:'Create an object with the + next to Hierarchy.',at:()=>Array.from(document.querySelectorAll('.ph')).find(x=>/hierarchy/i.test(x.textContent))?.querySelector('.ib:last-of-type,button:last-of-type'),ok:()=>ents().length>(S.tutBase.n||0)},
{t:'Select it, then rename it to Enemy in the Inspector.',at:()=>document.querySelector('#insp input'),ok:()=>ents().some(e=>e.name==='Enemy')},
{t:'Press Add Component and choose EnemyAI under Combat.',at:()=>document.querySelector('.addc'),ok:()=>ents().some(e=>(e.beh||[]).some(b=>b.type==='EnemyAI'))},
{t:'Create another object, then Add Component, Player controller. This is the hero.',at:()=>document.querySelector('.addc'),ok:()=>ents().some(e=>e.player)},
{t:'Give the hero Health (Add Component, Combat, Health) so the enemy can hurt it.',at:()=>document.querySelector('.addc'),ok:()=>ents().some(e=>e.player&&(e.beh||[]).some(b=>b.type==='Health'))},
{t:'Press Play. Walk near the enemy and watch it chase you.',at:()=>document.querySelector('#bPlay'),ok:()=>S.playing}
]})
TUTS.push({id:'score',title:'Make a score, a win and a lose',desc:'Collect coins, then show a message when you have three.',steps:[
{t:'Create an object and name it Coin. Then Add Component, Items, Pickup.',at:()=>document.querySelector('.addc'),ok:()=>ents().some(e=>(e.beh||[]).some(b=>b.type==='Pickup'))},
{t:'Copy the coin two more times with Ctrl+D so there are three.',at:()=>document.querySelector('#hier'),ok:()=>ents().filter(e=>(e.beh||[]).some(b=>b.type==='Pickup')).length>=3},
{t:'Create one more object called Rules. Add Component, Event sheet. Then open the Script tab.',at:()=>document.querySelector('.addc'),ok:()=>ents().some(e=>e.script&&e.script.mode==='events')&&S.tab==='script'},
{t:'Press Add event and pick "When Update".',at:()=>document.querySelector('.evbar .btn'),ok:()=>ents().some(e=>e.script&&e.script.mode==='events'&&VueEvents.count(e.script.events)>0)},
{t:'Press Condition and pick "Global variable compares". Set name to score and value to 3.',at:()=>document.querySelector('.evif .evadd .btn'),ok:()=>ents().some(e=>scriptHas(e,'gvar'))},
{t:'Press Action and add "Show On HUD" or "Go To Scene" to win the game.',at:()=>document.querySelector('.evdo .evadd .btn'),ok:()=>ents().some(e=>e.script&&e.script.mode==='events'&&(e.script.events.rows||[]).some(r=>(r.acts||[]).length>0&&(r.conds||[]).length>0))},
{t:'Press Play and collect the coins.',at:()=>document.querySelector('#bPlay'),ok:()=>S.playing}
]})
let box=null,ring=null,timer=0,run=null
const stopTut=()=>{
clearInterval(timer)
if(box){box.remove();box=null}
if(ring){ring.remove();ring=null}
run=null
}
const place=()=>{
if(!run||!ring)return
const st=TUTS.find(x=>x.id===run.id).steps[run.i]
const el=st&&st.at&&st.at()
if(el&&el.getBoundingClientRect){
const r=el.getBoundingClientRect()
if(r.width>0){ring.style.display='block';ring.style.left=r.left-3+'px';ring.style.top=r.top-3+'px';ring.style.width=r.width+6+'px';ring.style.height=r.height+6+'px';return}
}
ring.style.display='none'
}
const draw=()=>{
if(!run)return
const T=TUTS.find(x=>x.id===run.id)
box.innerHTML=''
if(run.i>=T.steps.length){
box.append(h('div',{class:'tt'},h('b',{text:'Well done'}),h('button',{class:'ib',title:'Close',html:ic('x',13),onclick:stopTut})),h('p',{text:T.title+' is finished. Try changing the values and playing again.'}))
if(ring)ring.style.display='none'
return
}
box.append(h('div',{class:'tt'},h('b',{text:T.title}),h('small',{text:'Step '+(run.i+1)+' of '+T.steps.length}),h('button',{class:'ib',title:'Close tutorial',html:ic('x',13),onclick:stopTut})),h('p',{text:T.steps[run.i].t}),h('div',{class:'row'},h('button',{class:'btn sm ghost',text:'Skip step',onclick:()=>{run.i++;draw();place()}})))
place()
}
const tick=()=>{
if(!run)return
const T=TUTS.find(x=>x.id===run.id)
if(run.i<T.steps.length&&T.steps[run.i].ok()){run.i++;draw()}
place()
}
function start(id){
stopTut()
const T=TUTS.find(x=>x.id===id)
if(!T)return
S.tutBase={n:ents().length}
run={id,i:0}
box=h('div',{class:'tutbox'})
ring=h('div',{class:'tutring'})
document.body.append(ring,box)
draw()
timer=setInterval(tick,300)
}
return{showHelp,closeHelp,start,stop:stopTut,TUTS:TUTS.map(t=>({id:t.id,title:t.title,desc:t.desc}))}
}
root.VueGuide={create}
})(window)
