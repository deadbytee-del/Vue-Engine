const assert=require('assert')
const SAMPLE=require('../src/sample.js')
const MCP=require('../src/mcp.js')
const A=require('../src/assistant.js')
const MODEL=require('../src/model3d.js')
const t3=SAMPLE.TEMPLATES.find(t=>t.id==='empty3')
const mk=()=>{const cur={file:null,project:t3.make(),scene:0};return{cur,server:MCP.create({cur})}}
const sse=(rows)=>new Response(new ReadableStream({start(c){const e=new TextEncoder();for(const r of rows)c.enqueue(e.encode('data: '+(typeof r==='string'?r:JSON.stringify(r))+'\n\n'));c.close()}}),{status:200})
const mkHost=o=>{const h={snaps:0,changes:0,asks:[],confirms:[],snap(){h.snaps++},changed(){h.changes++},async ask(q){h.asks.push(q);return o&&o.answer||{choices:['Smooth']}},async confirm(l){h.confirms.push(l);return o&&o.accept!==undefined?o.accept:true}};return h}
;(async()=>{
{
const{cur,server}=mk(),host=mkHost(),ev=[]
const a=A.create({server,host,on:e=>ev.push(e)})
assert(a.tools.some(t=>t.name==='ask_user')&&a.tools.some(t=>t.name==='create_model')&&a.tools.some(t=>t.name==='get_scene'))
assert(!a.tools.some(t=>t.name==='open_project'||t.name==='import_asset'||t.name==='export_html'))
const r=await a.send('make me a lamp',{provider:'mock',model:'mock',prices:{mock:{in:3,out:15,cr:0.3,cw:3.75}}})
assert.strictEqual(r,'done')
assert.strictEqual(host.asks.length,1)
assert.strictEqual(host.snaps,1)
assert.strictEqual(host.changes,2)
assert(cur.project.assets['Lamp post']&&cur.project.assets['Lamp post'].type==='model')
const sc=cur.project.scenes[0]
assert(sc.entities.some(e=>e.shape==='model'&&e.image==='Lamp post'))
assert(a.usage.requests===4&&a.usage.total.in>0&&a.usage.total.out===320&&a.usage.cost>0)
assert(ev.some(e=>e.t==='undo')&&ev.some(e=>e.t==='done'))
assert(a.history.some(m=>m.role==='tool'&&m.ask))
}
{
const{cur,server}=mk(),host=mkHost({accept:false})
const a=A.create({server,host})
await a.send('x',{provider:'mock',model:'mock',ask:true})
assert(host.confirms.length>=1)
assert(!cur.project.assets||!cur.project.assets['Lamp post'])
assert.strictEqual(host.snaps,0)
}
{
const{cur,server}=mk(),host=mkHost()
const a=A.create({server,host})
await a.send('x',{provider:'mock',model:'mock',budget:{type:'tokens',limit:1000}})
const r=await a.send('again',{provider:'mock',model:'mock',budget:{type:'tokens',limit:1000}})
assert.strictEqual(r,'budget')
}
{
const{server}=mk(),host=mkHost()
const a=A.create({server,host})
const stopper=A.create({server,host,on:e=>{if(e.t==='assistant')stopper.stop()}})
const r=await stopper.send('x',{provider:'mock',model:'mock'})
assert.strictEqual(r,'stopped')
const lim=A.create({server,host})
assert.strictEqual(await lim.send('x',{provider:'mock',model:'mock',maxIter:2}),'limit')
}
{
const{server}=mk(),host=mkHost()
const a=A.create({server,host})
const x=await a.send('x',{provider:'anthropic',model:'m',key:''})
assert.strictEqual(x,'error')
}
{
const{server}=mk(),host=mkHost()
let seen
const fetchFn=async(url,o)=>{seen={url,o,body:JSON.parse(o.body)};return sse([{type:'message_start',message:{usage:{input_tokens:10,output_tokens:1,cache_read_input_tokens:5,cache_creation_input_tokens:2}}},{type:'content_block_start',index:0,content_block:{type:'text',text:''}},{type:'content_block_delta',index:0,delta:{type:'text_delta',text:'Hi '}},{type:'content_block_delta',index:0,delta:{type:'text_delta',text:'there'}},{type:'content_block_start',index:1,content_block:{type:'tool_use',id:'tu1',name:'get_scene',input:{}}},{type:'content_block_delta',index:1,delta:{type:'input_json_delta',partial_json:'{"sce'}},{type:'content_block_delta',index:1,delta:{type:'input_json_delta',partial_json:'ne":"World"}'}},{type:'message_delta',delta:{stop_reason:'tool_use'},usage:{output_tokens:20}}])}
const ev=[]
const a=A.create({server,host,fetch:fetchFn,on:e=>ev.push(e),skip:[]})
let n=0
const f2=async(u,o)=>{n++;if(n===1)return fetchFn(u,o);return sse([{type:'message_start',message:{usage:{input_tokens:30,output_tokens:1}}},{type:'content_block_delta',index:0,delta:{type:'text_delta',text:'ok'}},{type:'message_delta',usage:{output_tokens:2}}])}
const b=A.create({server,host,fetch:f2,on:e=>ev.push(e)})
await b.send('hello',{provider:'anthropic',model:'claude-x',key:'sk-test'})
assert.strictEqual(seen.url,'https://api.anthropic.com/v1/messages')
assert.strictEqual(seen.o.headers['anthropic-dangerous-direct-browser-access'],'true')
assert.strictEqual(seen.o.headers['x-api-key'],'sk-test')
assert.strictEqual(seen.body.stream,true)
assert(seen.body.tools.length>20&&seen.body.tools.every(t=>t.input_schema&&t.input_schema.type==='object'))
assert(JSON.stringify(seen.body.tools).indexOf('"any"')<0)
assert.strictEqual(b.history[1].text,'Hi there')
assert.deepStrictEqual(b.history[1].calls[0].args,{scene:'World'})
assert.strictEqual(b.history[2].role,'tool')
assert.strictEqual(b.usage.total.in,40)
assert.strictEqual(b.usage.total.out,22)
assert.strictEqual(b.usage.total.cr,5)
assert.strictEqual(b.usage.total.cw,2)
assert(!JSON.stringify(ev).includes('sk-test'))
}
{
const{server}=mk(),host=mkHost()
let seen,n=0
const f=async(u,o)=>{seen={u,o,body:JSON.parse(o.body)};n++;if(n===1)return sse([{choices:[{delta:{content:'a'}}]},{choices:[{delta:{tool_calls:[{index:0,id:'c1',function:{name:'list_objects',arguments:'{"tag"'}}]}}]},{choices:[{delta:{tool_calls:[{index:0,function:{arguments:':"x"}'}}]}}]},{choices:[],usage:{prompt_tokens:100,completion_tokens:9,prompt_tokens_details:{cached_tokens:40}}},'[DONE]']);return sse([{choices:[{delta:{content:'done'}}]},{choices:[],usage:{prompt_tokens:10,completion_tokens:1}}])}
const a=A.create({server,host,fetch:f})
await a.send('go',{provider:'openai',model:'gpt',key:'k'})
assert.strictEqual(seen.u,'https://api.openai.com/v1/chat/completions')
assert.strictEqual(seen.o.headers.authorization,'Bearer k')
assert.strictEqual(seen.body.messages.some(m=>m.role==='tool'&&m.tool_call_id==='c1'),true)
assert.strictEqual(a.usage.total.cr,40)
assert.strictEqual(a.usage.total.in,70)
const lc=A.create({server,host,fetch:async u=>{assert(u.startsWith('http://localhost:11434/v1'));return sse([{choices:[{delta:{content:'hi'}}]}])}})
await lc.send('x',{provider:'compat',model:'llama3.1'})
assert.strictEqual(lc.usage.reported,false)
const orr=A.create({server,host,fetch:async u=>{assert.strictEqual(u,'https://openrouter.ai/api/v1/chat/completions');return sse([{choices:[{delta:{content:'hi'}}]}])}})
await orr.send('x',{provider:'openrouter',model:'m',key:'k'})
}
{
const{server}=mk(),host=mkHost()
let n=0,seen
const f=async(u,o)=>{seen={u,o,body:JSON.parse(o.body)};n++;if(n===1)return sse([{candidates:[{content:{parts:[{functionCall:{name:'get_scene',args:{}}}]}}],usageMetadata:{promptTokenCount:50,candidatesTokenCount:5,cachedContentTokenCount:10}}]);return sse([{candidates:[{content:{parts:[{text:'fine'}]}}],usageMetadata:{promptTokenCount:60,candidatesTokenCount:2}}])}
const a=A.create({server,host,fetch:f})
await a.send('go',{provider:'gemini',model:'gemini-2.5-flash',key:'gk'})
assert(seen.u.startsWith('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?alt=sse'))
assert.strictEqual(seen.o.headers['x-goog-api-key'],'gk')
assert(seen.body.contents.some(c=>c.parts.some(p=>p.functionResponse)))
assert.strictEqual(a.usage.total.cr,10)
assert.strictEqual(a.usage.total.in,100)
}
{
const{server}=mk(),host=mkHost()
const f=async()=>new Response('{"error":{"message":"bad key"}}',{status:401})
const ev=[]
const a=A.create({server,host,fetch:f,on:e=>ev.push(e)})
assert.strictEqual(await a.send('x',{provider:'openai',model:'m',key:'secret-key'}),'error')
assert(ev.some(e=>e.t==='error'&&/401/.test(e.message)))
assert(!JSON.stringify(ev).includes('secret-key'))
}
{
const{cur,server}=mk()
const call=async(n,a)=>JSON.parse((await server.handle({jsonrpc:'2.0',id:1,method:'tools/call',params:{name:n,arguments:a}})).result.content[0].text)
const bad=await server.handle({jsonrpc:'2.0',id:2,method:'tools/call',params:{name:'create_model',arguments:{name:'x',spec:{parts:[{type:'wat'}]}}}})
assert(bad.result.isError&&/Unknown part type/.test(bad.result.content[0].text))
const r=await call('create_model',{name:'Tower',spec:{parts:[{type:'box',size:[1,2,1]},{type:'cone',pos:[0,1.5,0],radius:0.8,height:1,color:'#aa3333'}]}})
assert(r.bounds.size[1]>2.4)
assert.strictEqual((await call('list_models',{})).length,1)
assert.strictEqual((await call('get_model',{name:'Tower'})).parts.length,2)
const e=await call('place_model',{name:'Tower',properties:{x:3}})
assert.strictEqual(e.shape,'model')
}
{
const b=MODEL.bake({parts:[{type:'box',size:[2,2,2]},{type:'sphere',radius:1,pos:[5,0,0]},{type:'cylinder',pos:[0,0,5]},{type:'torus',pos:[0,0,-5]},{type:'extrude',profile:[[0,0],[2,0],[2,2],[1,1],[0,2]],depth:1,pos:[-6,0,0]},{type:'lathe',profile:[[0.5,0],[0.2,1]],pos:[0,0,9]}]})
for(const m of b.meshes.filter(x=>x.name!=='torus')){
let c=[0,0,0];for(let k=0;k<m.pos.length;k+=3){c[0]+=m.pos[k];c[1]+=m.pos[k+1];c[2]+=m.pos[k+2]}
const n=m.pos.length/3;c=c.map(x=>x/n)
let out=0,tot=0
for(let t=0;t<m.idx.length;t+=3){const a=m.idx[t]*3;const d=(m.nrm[a]*(m.pos[a]-c[0])+m.nrm[a+1]*(m.pos[a+1]-c[1])+m.nrm[a+2]*(m.pos[a+2]-c[2]));tot++;if(d>=-1e-6)out++}
assert(out/tot>0.9,m.name+' faces point inward')
}
const mir=MODEL.bake({parts:[{type:'box',pos:[1,0,0],mirror:'x'}]})
assert.strictEqual(mir.meshes.length,2)
assert(Math.min(...mir.meshes[1].pos.filter((v,i)=>i%3===0))<0)
assert.strictEqual(MODEL.bake({parts:[{type:'box',array:{count:5,offset:[2,0,0]}}]}).meshes.length,5)
assert.throws(()=>MODEL.validate({parts:[{type:'box',array:{count:100},mirror:'x'},{type:'box',array:{count:100},mirror:'x'},{type:'box',array:{count:100},mirror:'x'}]}),/at most/)
assert.throws(()=>MODEL.validate({parts:[{type:'extrude',profile:[[0,0],[1,1]]}]}),/at least 3/)
const g=Buffer.from(MODEL.toGLB({parts:[{type:'box'},{type:'sphere',color:'#ff0000'}]}))
assert.strictEqual(g.toString('latin1',0,4),'glTF')
assert.strictEqual(g.readUInt32LE(8),g.length)
const jl=g.readUInt32LE(12),json=JSON.parse(g.toString('utf8',20,20+jl))
assert.strictEqual(json.meshes.length,2)
assert.strictEqual(json.accessors[0].min.length,3)
}
console.log('assistant tests passed')
})().catch(e=>{console.error(e);process.exit(1)})
