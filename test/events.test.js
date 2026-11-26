const assert=require('assert')
const E=require('../src/events.js')
const N=require('../src/nodedefs.js')
const C=require('../src/compiler.js')
const S=require('../src/sample.js')
const sheet={v:1,vars:[{n:'count',v:0}],rows:[
{k:'event',ev:{t:'key',v:{key:'space'}},conds:[{t:'grounded',v:{}},{t:'gvar',v:{name:'score',op:'>=',value:5},not:true}],acts:[{t:'jump',v:{power:500}},{t:'addl',v:{name:'count',by:1}}],subs:[{conds:[{t:'lvar',v:{name:'count',op:'>=',value:3}}],acts:[{t:'burst',v:{color:'#ffffff',count:5}}]}]},
{k:'group',name:'g',vars:[{n:'t',v:1}],rows:[{k:'event',ev:{t:'every',v:{sec:2}},conds:[],acts:[{t:'addg',v:{name:'score',by:1}}]}]}
]}
const code=E.compileEvents(sheet)
new Function('on','vue','self',code)
const reg=[],calls=[]
const vars={}
const self={grounded:true,jump:p=>calls.push('jump'+p),x:0,y:0,hasTag:()=>false}
const vue={vars,key:()=>true,burst:(...a)=>calls.push('burst'),every:(s,f)=>reg.push(['every',s,f]),random:()=>0,time:0}
const on=(n,f)=>reg.push([n,f])
new Function('on','vue','self',code)(on,vue,self)
assert.strictEqual(reg[0][0],'key:space')
for(let i=0;i<3;i++)reg[0][1].call(null)
assert.strictEqual(calls.filter(c=>c==='jump500').length,3)
assert.strictEqual(calls.filter(c=>c==='burst').length,1)
assert.strictEqual(reg[1][0],'every')
reg[1][2]()
assert.strictEqual(vars.score,1)
vars.score=9
calls.length=0
reg[0][1].call(null)
assert.strictEqual(calls.length,0)
const g={nid:3,nodes:[{id:1,type:'start',v:{}},{id:2,type:'say',v:{text:'Hi',sec:1}},{id:3,type:'shake',v:{amount:3,sec:1}}],links:[{a:1,ap:'next',b:2,bp:'in'},{a:2,ap:'next',b:3,bp:'in'}]}
const r=E.fromNodes(g)
assert(r.ok)
assert.strictEqual(r.sheet.rows[0].acts.length,2)
const legacy=N.compileGraph(g),ev=E.compileEvents(r.sheet)
assert(/say\("Hi",1\)/.test(legacy)&&/say\("Hi",1\)/.test(ev))
const w={nid:2,nodes:[{id:1,type:'update',v:{}},{id:2,type:'setvx',v:{}},{id:3,type:'num',v:{v:2}}],links:[{a:1,ap:'next',b:2,bp:'in'},{a:3,ap:'value',b:2,bp:'vx'}]}
assert(!E.fromNodes(w).ok)
;(async()=>{
const out=await C.compileScript({mode:'events',events:sheet},{events:E})
assert(out.code.includes('on("key:space"'))
const out2=await C.compileScript({mode:'nodes',nodes:g},{nodes:N})
assert(out2.code.includes('on("start"'))
let n=0
for(const t of S.TEMPLATES){
const p=t.make()
for(const sc of p.scenes)for(const e of sc.entities){
assert(!e.script||e.script.mode!=='nodes')
if(e.script&&e.script.mode==='events'){n++;const o=await C.compileScript(e.script,{events:E});new Function('on','vue','self',o.code)}
}
}
assert(n>=3)
console.log('events tests passed')
})()
