(function(root){
const AS=root.VueAssistant,P=AS.PROVIDERS
const LS=root.localStorage,SS=root.sessionStorage
const jget=(st,k,d)=>{try{const v=st.getItem(k);return v?JSON.parse(v):d}catch(e){return d}}
const jset=(st,k,v)=>{try{st.setItem(k,JSON.stringify(v))}catch(e){}}
const fmt=n=>n>=1e6?(n/1e6).toFixed(2)+'M':n>=1e4?(n/1e3).toFixed(1)+'k':String(n||0)
let ed,h,ic,A=null,server=null,cfg,panel,els={},wired=false,tsTried=false
const loadCfg=()=>Object.assign({provider:'anthropic',model:'',base:'',ask:false,remember:true,budget:{type:'usd',limit:0},prices:{},system:''},jget(LS,'vue.assist',{}))
const saveCfg=()=>jset(LS,'vue.assist',cfg)
const keyStore=()=>cfg.remember?LS:SS
const getKey=p=>(jget(LS,'vue.assist.keys',{})[p])||(jget(SS,'vue.assist.keys',{})[p])||''
function setKey(p,k){
for(const st of[LS,SS]){const m=jget(st,'vue.assist.keys',{});delete m[p];jset(st,'vue.assist.keys',m)}
if(k){const st=keyStore(),m=jget(st,'vue.assist.keys',{});m[p]=k;jset(st,'vue.assist.keys',m)}
}
const mockOn=()=>/[?&#]assistant=mock/.test(root.location.href)
const connected=()=>cfg.provider==='mock'||!!cfg.model&&(!P[cfg.provider]||!P[cfg.provider].key||!!getKey(cfg.provider))
const runCfg=()=>Object.assign({},cfg,{key:getKey(cfg.provider),maxIter:12})
const strip=hs=>hs.slice(-200).map(m=>{const o=Object.assign({},m);delete o.image;return o})
function modal(build){
const back=h('div',{class:'aimodal'})
const box=h('div',{class:'aibox'})
back.append(box)
document.body.append(back)
const close=()=>back.remove()
build(box,close)
return close
}
function ask(q){
return new Promise(res=>{
modal((box,close)=>{
const sel=new Set()
const other=h('input',{type:'text',placeholder:'Something else',class:'aiother'})
const rows=q.options.map(o=>{
const inp=h('input',{type:q.multi?'checkbox':'radio',name:'aiq',onchange:()=>{if(!q.multi)sel.clear();inp.checked?sel.add(o):sel.delete(o)}})
return h('label',{class:'aiopt'},inp,h('span',{text:o}))
})
const done=v=>{close();res(v)}
box.append(h('h3',{text:q.question}),h('div',{class:'ailist'},...rows,h('label',{class:'aiopt'},h('span',{text:'Other'}),other)),h('div',{class:'aibtns'},h('button',{class:'btn',text:'Skip',onclick:()=>done(null)}),h('button',{class:'btn primary',text:'Send',onclick:()=>{const c=[...sel],o=other.value.trim();done(c.length||o?{choices:c,other:o}:null)}})))
})
})
}
function confirm(lines){
return new Promise(res=>{
modal((box,close)=>{
const done=v=>{close();res(v)}
box.append(h('h3',{text:'The assistant wants to change your project'}),h('ul',{class:'ailines'},...lines.map(l=>h('li',{text:l}))),h('div',{class:'aibtns'},h('button',{class:'btn',text:'Reject',onclick:()=>done(false)}),h('button',{class:'btn primary',text:'Accept',onclick:()=>done(true)})))
})
})
}
function loadTs(){
if(root.ts&&root.ts.createProgram)return Promise.resolve(root.ts)
return new Promise(res=>{
const old=root.define
root.define=undefined
const s=document.createElement('script')
s.src=root.VUE_CDN&&VUE_CDN.ts||new URL('../node_modules/typescript/lib/typescript.js',location.href).href
const fin=()=>{root.define=old;res(root.ts&&root.ts.createProgram?root.ts:null)}
s.onload=fin;s.onerror=fin
document.head.append(s)
})
}
function ensure(){
const S=ed.S
if(A&&A.proj===S.project)return A
const cur={file:null}
Object.defineProperty(cur,'project',{get:()=>S.project,enumerable:true})
Object.defineProperty(cur,'scene',{get:()=>Math.max(0,S.project.scenes.findIndex(s=>s.id===S.sceneId)),enumerable:true})
server=root.VueMcp.create({cur,bridge:{call:(n,a)=>root.vueMcp[n](a||{})}})
if(root.ts&&root.ts.createProgram)server.setTs(root.ts)
const hist=(S.project.assistant&&S.project.assistant.history||[]).slice()
A=AS.create({server,history:hist,fetch:root.fetch.bind(root),on,host:{snap:()=>ed.snap(),changed:()=>{ed.reloadScene();ed.renderAll();ed.markDirty()},ask,confirm}})
A.proj=S.project
return A
}
let cur=null
const scroll=()=>{els.chat.scrollTop=els.chat.scrollHeight}
function bubble(cls,text){const b=h('div',{class:'aimsg '+cls});b.append(h('div',{class:'aitxt',text}));els.chat.append(b);scroll();return b}
function copyBtn(get){return h('button',{class:'ib aicopy',title:'Copy',html:ic('copy',14),onclick:()=>{try{navigator.clipboard.writeText(get())}catch(e){}ed.toast('Copied','ok')}})}
function toolLine(line,res){
const d=h('details',{class:'aitool'+(res.error?' bad':'')})
let body=res.text
if(res.ask)body='Question: '+res.ask.q+'\nYou answered: '+[...(res.ask.a.choices||[]),res.ask.a.other].filter(Boolean).join(', ')
d.append(h('summary',{text:(res.ask?'You answered a question':line)+(res.error?' (failed)':'')}),h('pre',{text:body}))
if(res.image){const im=h('img',{src:'data:image/png;base64,'+res.image,class:'aishot'});d.append(im)}
els.chat.append(d);scroll()
}
function meter(){
const u=A?A.usage:{last:null,total:{in:0,out:0,cr:0,cw:0},requests:0,reported:true,cost:0}
const l=u.last
const pr=AS.price(cfg.prices,cfg.model)
els.last.textContent=l?(l.reported?'Last reply: in '+fmt(l.in)+', out '+fmt(l.out)+(l.cr||l.cw?', cache read '+fmt(l.cr)+', write '+fmt(l.cw):''):'Last reply: usage not reported'):'Last reply: nothing yet'
const t=u.total
let s='Session: in '+fmt(t.in)+', out '+fmt(t.out)+' · '+u.requests+' request'+(u.requests===1?'':'s')
if(!u.reported)s+=' · some usage not reported'
s+=pr?' · about $'+u.cost.toFixed(4):' · no price set for this model'
els.sess.textContent=s
const b=cfg.budget,pct=b&&b.limit>0?Math.min(100,100*(b.type==='usd'?u.cost:t.in+t.out)/b.limit):0
els.bar.style.display=b&&b.limit>0?'':'none'
els.bar.firstChild.style.width=pct+'%'
els.bar.title=b&&b.limit>0?Math.round(pct)+'% of the '+(b.type==='usd'?'$'+b.limit:fmt(b.limit)+' token')+' budget':''
}
function on(e){
if(!panel)return
if(e.t==='user'){bubble('user',e.text);cur=null}
else if(e.t==='text'){if(!cur){cur=bubble('ai','');cur.append(copyBtn(()=>cur.firstChild.textContent))}cur.firstChild.textContent+=e.delta;scroll()}
else if(e.t==='assistant')cur=null
else if(e.t==='tool')toolLine(e.line,e.result)
else if(e.t==='usage')meter()
else if(e.t==='error')bubble('err',e.message)
else if(e.t==='undo')bubble('note','Those changes are one step. Press Ctrl+Z to undo them all.')
else if(e.t==='done'){
els.send.classList.remove('hide');els.stop.classList.add('hide');els.input.disabled=false
if(e.reason==='budget')bubble('note','Stopped: you reached your budget limit. Raise it under Limits to continue.')
if(e.reason==='limit')bubble('note','Stopped after '+12+' steps. Say "continue" to go on.')
if(e.reason==='stopped')bubble('note','Stopped.')
ed.S.project.assistant={history:strip(A.history)}
ed.markDirty()
meter()
}
}
function renderChat(){
els.chat.innerHTML=''
if(!A)return
for(const m of A.history){
if(m.role==='user')bubble('user',m.text)
else if(m.role==='assistant'&&m.text){const b=bubble('ai',m.text);b.append(copyBtn(()=>m.text))}
else if(m.role==='tool')toolLine(m.name,m)
}
if(!A.history.length)bubble('note','Ask me to build something, for example: make a small arena with a car and a ball. I can ask you questions along the way.')
}
async function send(){
const t=els.input.value.trim()
if(!t)return
if(!connected()){showConnect();return}
if(ed.S.playing)ed.toast('Stop the game first so the assistant can change it','warn')
ensure()
if(!tsTried){tsTried=true;loadTs().then(x=>{if(x&&server)server.setTs(x)})}
els.input.value=''
els.input.disabled=true
els.send.classList.add('hide');els.stop.classList.remove('hide')
A.send(t,runCfg())
}
function showConnect(){
els.conn.classList.remove('hide');els.main.classList.add('hide')
const prov=els.prov,model=els.modelSel,custom=els.custom,key=els.key,base=els.base,rem=els.rem
prov.innerHTML=''
for(const k of Object.keys(P))prov.append(h('option',{value:k,text:P[k].name}))
if(mockOn())prov.append(h('option',{value:'mock',text:'Mock (testing)'}))
prov.value=cfg.provider
const fill=()=>{
const p=prov.value,pp=P[p]||{models:['mock'],base:'',key:false}
model.innerHTML=''
for(const m of pp.models)model.append(h('option',{value:m,text:m}))
model.append(h('option',{value:'',text:'Other (type below)'}))
model.value=pp.models.includes(cfg.model)&&cfg.provider===p?cfg.model:(cfg.provider===p&&cfg.model?'':pp.models[0])
custom.value=cfg.provider===p&&cfg.model&&!pp.models.includes(cfg.model)?cfg.model:''
custom.style.display=model.value===''?'':'none'
base.value=cfg.provider===p?cfg.base:''
base.placeholder=pp.base||''
els.baseRow.style.display=p==='compat'||p==='openrouter'||p==='anthropic'||p==='openai'?'':'none'
els.keyRow.style.display=pp.key===false?'none':''
key.value=getKey(p)?'saved':''
key.dataset.saved=getKey(p)?'1':''
}
prov.onchange=fill
model.onchange=()=>{custom.style.display=model.value===''?'':'none'}
key.onfocus=()=>{if(key.dataset.saved){key.value='';key.dataset.saved=''}}
rem.checked=cfg.remember
fill()
}
function connect(){
const p=els.prov.value
cfg.provider=p
cfg.model=els.modelSel.value||els.custom.value.trim()
cfg.base=els.base.value.trim()
cfg.remember=els.rem.checked
const k=els.key.value.trim()
if(els.key.dataset.saved&&els.key.value==='saved')setKey(p,getKey(p))
else if(k||P[p]&&P[p].key!==false)setKey(p,k)
saveCfg()
if(!connected()){ed.toast('Add a model and, if the provider needs one, your API key','warn');return}
A=null
showMain()
}
function disconnect(){
for(const p of Object.keys(P))setKey(p,'')
cfg.model=''
saveCfg()
A=null
showConnect()
ed.toast('Disconnected. Your key was removed from this browser.','ok')
}
function showMain(){
els.conn.classList.add('hide');els.main.classList.remove('hide')
els.who.textContent=(P[cfg.provider]?P[cfg.provider].name:'Mock')+' · '+cfg.model
els.ask.checked=!!cfg.ask
ensure()
renderChat()
meter()
}
function limits(){
modal((box,close)=>{
const type=h('select',null,h('option',{value:'usd',text:'Dollars'}),h('option',{value:'tokens',text:'Tokens'}))
type.value=cfg.budget.type
const lim=h('input',{type:'number',min:'0',step:'any',value:cfg.budget.limit||''})
const rows=[]
const table=h('div',{class:'aiprices'})
const draw=()=>{
table.innerHTML=''
table.append(h('div',{class:'aiprow head'},h('span',{text:'Model id'}),h('span',{text:'In'}),h('span',{text:'Out'}),h('span',{text:'Cache read'}),h('span',{text:'Cache write'}),h('span')))
for(const m of Object.keys(cfg.prices)){
const p=cfg.prices[m]
const f=k=>h('input',{type:'number',min:'0',step:'any',value:p[k]||0,onchange:e=>{p[k]=+e.target.value||0}})
table.append(h('div',{class:'aiprow'},h('span',{text:m}),f('in'),f('out'),f('cr'),f('cw'),h('button',{class:'ib',title:'Remove',html:ic('x',14),onclick:()=>{delete cfg.prices[m];draw()}})))
}
}
draw()
const nm=h('input',{type:'text',placeholder:'Model id, e.g. '+(cfg.model||'gpt-4o')})
box.append(h('h3',{text:'Limits and prices'}),h('p',{class:'aisub',text:'The assistant stops when the session reaches the budget. Leave it empty for no limit.'}),h('div',{class:'airow'},type,lim),h('h3',{text:'Price per million tokens (dollars)'}),h('p',{class:'aisub',text:'Used only to estimate cost. Enter the numbers from your provider.'}),table,h('div',{class:'airow'},nm,h('button',{class:'btn sm',text:'Add model',onclick:()=>{const k=nm.value.trim();if(k&&!cfg.prices[k]){cfg.prices[k]={in:0,out:0,cr:0,cw:0};nm.value='';draw()}}})),h('div',{class:'aibtns'},h('button',{class:'btn primary',text:'Done',onclick:()=>{cfg.budget={type:type.value,limit:+lim.value||0};saveCfg();meter();close()}})))
})
}
function build(){
const q=(c,t,o)=>h(t||'div',Object.assign({class:c},o||{}))
els.last=q('aim1');els.sess=q('aim2');els.bar=q('aibar');els.bar.append(h('i'))
els.who=q('aiwho')
const head=q('aihead',null,{})
head.append(h('div',{class:'aitop'},h('b',{text:'Assistant'}),els.who,h('span',{style:'flex:1'}),h('button',{class:'ib',title:'Limits and prices',html:ic('sliders',16),onclick:limits}),h('button',{class:'ib',title:'Connection',html:ic('settings',16),onclick:showConnect}),h('button',{class:'ib',title:'Clear chat',html:ic('trash',16),onclick:()=>{if(A)A.reset();ed.S.project.assistant=null;ed.markDirty();renderChat();meter()}}),h('button',{class:'ib',title:'Close',html:ic('x',16),onclick:toggle})),els.last,els.sess,els.bar)
els.chat=q('aichat')
els.input=h('textarea',{class:'aiin',rows:'2',placeholder:'Tell the assistant what to build',onkeydown:e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send()}}})
els.send=h('button',{class:'btn primary',text:'Send',onclick:send})
els.stop=h('button',{class:'btn hide',text:'Stop',onclick:()=>{if(A)A.stop()}})
els.ask=h('input',{type:'checkbox',class:'sw',onchange:()=>{cfg.ask=els.ask.checked;saveCfg()}})
els.main=q('aimain')
els.main.append(els.chat,h('div',{class:'aifoot'},h('label',{class:'aiask'},els.ask,h('span',{text:'Ask before applying changes'})),els.input,h('div',{class:'airow'},els.send,els.stop)))
els.prov=h('select');els.modelSel=h('select');els.custom=h('input',{type:'text',placeholder:'Model id'});els.key=h('input',{type:'password',placeholder:'API key',autocomplete:'off'});els.base=h('input',{type:'text'});els.rem=h('input',{type:'checkbox'})
els.baseRow=h('label',{class:'aif'},h('span',{text:'Server address (optional)'}),els.base)
els.keyRow=h('label',{class:'aif'},h('span',{text:'API key'}),els.key)
els.conn=q('aiconn')
els.conn.append(h('p',{class:'aisub',text:'Connect an AI provider with your own API key. Requests go straight from this window to the provider.'}),h('label',{class:'aif'},h('span',{text:'Provider'}),els.prov),els.keyRow,h('label',{class:'aif'},h('span',{text:'Model'}),els.modelSel,els.custom),els.baseRow,h('label',{class:'aif aichk'},els.rem,h('span',{text:'Remember the key on this device'})),h('p',{class:'aisub',text:'Your key stays in this browser and is sent only to the provider you pick. It is never logged or sent anywhere else. Turn off Remember to keep it for this tab only.'}),h('div',{class:'airow'},h('button',{class:'btn primary',text:'Connect',onclick:connect}),h('button',{class:'btn',text:'Disconnect',onclick:disconnect}),h('button',{class:'btn ghost hide',id:'aiBack',text:'Back',onclick:()=>{if(connected())showMain()}})))
panel=h('aside',{id:'ai',class:'hide'},head,els.main,els.conn)
document.body.append(panel)
}
function toggle(){
if(!panel)build()
const open=panel.classList.contains('hide')
panel.classList.toggle('hide',!open)
document.body.classList.toggle('ai-open',open)
root.dispatchEvent(new Event('resize'))
if(open){cfg=loadCfg();if(connected())showMain();else showConnect()}
}
function init(e){
ed=e;h=e.h;ic=e.ic;cfg=loadCfg()
}
const status=()=>{cfg=loadCfg();return connected()?'Connected to '+(P[cfg.provider]?P[cfg.provider].name:'Mock'):'Not connected'}
root.VueAssist={init,toggle,status,limits,projectChanged:()=>{A=null;if(panel&&!panel.classList.contains('hide')){if(connected())showMain()}}}
})(window)
