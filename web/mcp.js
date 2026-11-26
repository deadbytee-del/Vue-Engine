const fs=require('fs')
const path=require('path')
const http=require('http')
const crypto=require('crypto')
const BH=require('./behaviors.js')
const EV=require('./events.js')
const ND=require('./nodedefs.js')
const DTS=require('./dts.js')
const SAMPLE=require('./sample.js')
const PLAYER=require('./player.js')
const COMPILER=require('./compiler.js')
const PROPS=['name','x','y','z','w','h','d','rot','rx','ry','rz','color','text','fontSize','alpha','visible','flipX','body','gravityScale','shape','image','tags','z']
const PROP_TYPES={name:'string',color:'string',text:'string',body:'string',shape:'string',image:'string',x:'number',y:'number',z:'number',w:'number',h:'number',d:'number',rot:'number',rx:'number',ry:'number',rz:'number',fontSize:'number',alpha:'number',gravityScale:'number',visible:'boolean',flipX:'boolean',tags:'array'}
const BODIES=['none','static','dynamic','trigger']
const ASSET_EXT={png:'image/png',jpg:'image/jpeg',jpeg:'image/jpeg',gif:'image/gif',webp:'image/webp',bmp:'image/bmp',svg:'image/svg+xml',wav:'audio/wav',mp3:'audio/mpeg',ogg:'audio/ogg'}
const MAX_ASSET=20*1024*1024
class McpError extends Error{constructor(m,code){super(m);this.code=code||-32602}}
const real=p=>{
try{return fs.realpathSync(p)}catch(e){
const d=path.dirname(p)
if(d===p)return p
return path.join(real(d),path.basename(p))
}
}
function check(schema,v,at){
at=at||'arguments'
if(schema.type==='object'){
if(v===undefined)v={}
if(typeof v!=='object'||v===null||Array.isArray(v))throw new McpError(at+' must be an object')
const props=schema.properties||{}
for(const k of schema.required||[])if(v[k]===undefined)throw new McpError('Missing required field "'+k+'"')
for(const k of Object.keys(v))if(!props[k])throw new McpError('Unknown field "'+k+'"')
const o={}
for(const k of Object.keys(v))o[k]=check(props[k],v[k],k)
return o
}
if(schema.type==='string'){
if(typeof v!=='string')throw new McpError(at+' must be a string')
if(v.length>(schema.maxLength||4096))throw new McpError(at+' is too long')
if(schema.enum&&!schema.enum.includes(v))throw new McpError(at+' must be one of: '+schema.enum.join(', '))
return v
}
if(schema.type==='number'){
if(typeof v!=='number'||!Number.isFinite(v))throw new McpError(at+' must be a finite number')
return v
}
if(schema.type==='boolean'){
if(typeof v!=='boolean')throw new McpError(at+' must be true or false')
return v
}
if(schema.type==='array'){
if(!Array.isArray(v)||v.length>(schema.maxItems||1000))throw new McpError(at+' must be a short array')
return v.map(x=>check(schema.items||{type:'string'},x,at))
}
if(schema.type==='any'){
if(JSON.stringify(v).length>2000000)throw new McpError(at+' is too large')
return v
}
return v
}
const S=(props,required)=>({type:'object',properties:props,required:required||[]})
const str=(d,m)=>({type:'string',description:d,maxLength:m})
const num=d=>({type:'number',description:d})
const bool=d=>({type:'boolean',description:d})
const anyv=d=>({type:'any',description:d})
const ref=S({id:str('Object id or exact name',200),scene:str('Scene name. Defaults to the current scene.',200)},['id'])
function create(opt){
const roots=(opt.roots||[]).map(r=>real(path.resolve(r)))
const importRoots=(opt.importRoots||[]).map(r=>real(path.resolve(r)))
const bridge=opt.bridge||null
const ts=opt.ts||null
const readRuntime=opt.runtimeSource||(()=>['vwr.js','behaviors.js','runtime.js','render3d.js'].map(f=>fs.readFileSync(path.join(__dirname,f),'utf8')).join('\n;\n'))
const readThree=opt.threeSource||(()=>{try{return fs.readFileSync(path.join(__dirname,'..','node_modules','three','build','three.min.js'),'utf8')}catch(e){return ''}})
const extIndex=opt.extensionsIndex||(()=>{try{return JSON.parse(fs.readFileSync(path.join(__dirname,'..','extensions','index.json'),'utf8')).extensions}catch(e){return[]}})
const cur={file:null,project:null,scene:0}
let tokens=30,last=Date.now()
const limit=()=>{
const n=Date.now()
tokens=Math.min(30,tokens+(n-last)/1000*15)
last=n
if(tokens<1)throw new McpError('Too many requests. Slow down and try again in a moment.',-32000)
tokens--
}
const within=(p,list,what)=>{
const r=real(path.resolve(String(p)))
const ok=list.some(b=>r===b||r.startsWith(b+path.sep))
if(!ok)throw new McpError((what||'Path')+' is outside the allowed folders')
return r
}
const projectPath=(p,exists)=>{
const r=within(p,roots,'Project path')
if(path.extname(r).toLowerCase()!=='.vue')throw new McpError('Project files must end in .vue')
if(exists&&!fs.existsSync(r))throw new McpError('Project file not found')
return r
}
const need=()=>{if(!cur.project)throw new McpError('No project is open. Use open_project or new_project first.');return cur.project}
const scene=name=>{
const p=need()
if(name){const s=p.scenes.find(x=>x.name===name||x.id===name);if(!s)throw new McpError('Scene not found: '+name);return s}
return p.scenes[Math.min(cur.scene,p.scenes.length-1)]
}
const find=(a)=>{
const sc=scene(a.scene)
const e=sc.entities.find(x=>x.id===a.id)||sc.entities.find(x=>x.name===a.id)
if(!e)throw new McpError('Object not found: '+a.id)
return{sc,e}
}
const brief=e=>({id:e.id,name:e.name,shape:e.shape,x:e.x,y:e.y,z:e.z,body:e.body,tags:e.tags,script:e.script?e.script.mode:null,behaviors:(e.beh||[]).map(b=>b.type),player:!!e.player})
const applyProps=(e,props)=>{
for(const k of Object.keys(props||{})){
if(!PROPS.includes(k))throw new McpError('Property "'+k+'" cannot be set. Allowed: '+PROPS.join(', '))
const v=props[k],t=PROP_TYPES[k]
if(t==='array'?!Array.isArray(v)||v.some(x=>typeof x!=='string'):typeof v!==t)throw new McpError('Property "'+k+'" must be a '+t)
if(k==='body'&&!BODIES.includes(v))throw new McpError('body must be one of: '+BODIES.join(', '))
if(k==='shape'&&!(SAMPLE.kinds[v]||SAMPLE.kinds3[v]||v==='sprite'||v==='text'))throw new McpError('Unknown shape: '+v)
if(typeof v==='string'&&v.length>2000)throw new McpError('Property "'+k+'" is too long')
e[k]=v
}
}
const save=()=>{
need()
if(!cur.file)throw new McpError('This project has no file yet. Use new_project or open_project.')
fs.writeFileSync(cur.file,JSON.stringify(cur.project),'utf8')
return cur.file
}
function diagnose(code){
if(!ts)throw new McpError('The TypeScript compiler is not available here')
const files={'/script.ts':code,'/vue.d.ts':DTS.dts+'\n'}
const opts={target:ts.ScriptTarget.ES2020,lib:['lib.es2020.d.ts'],noEmit:true,strict:false,module:ts.ModuleKind.CommonJS,types:[]}
const host=ts.createCompilerHost(opts,true)
const rf=host.readFile,fe=host.fileExists,gs=host.getSourceFile
host.fileExists=f=>f in files||fe.call(host,f)
host.readFile=f=>f in files?files[f]:rf.call(host,f)
host.getSourceFile=(f,l,...r)=>f in files?ts.createSourceFile(f,files[f],l):gs.call(host,f,l,...r)
const prog=ts.createProgram(['/script.ts','/vue.d.ts'],opts,host)
const ds=[...prog.getSyntacticDiagnostics(prog.getSourceFile('/script.ts')),...prog.getSemanticDiagnostics(prog.getSourceFile('/script.ts'))]
return ds.map(d=>{const p=d.file&&d.start!=null?d.file.getLineAndCharacterOfPosition(d.start):{line:0,character:0};return{line:p.line+1,column:p.character+1,message:ts.flattenDiagnosticMessageText(d.messageText,'\n')}})
}
async function compileAll(){
const p=need(),scripts={},errors=[]
for(const sc of p.scenes)for(const e of sc.entities){
const s=e.script
if(!s)continue
let code=''
if(s.mode==='events')code=EV.compileEvents(s.events)
else if(s.mode==='nodes')code=ND.compileGraph(s.nodes)
else if(s.mode==='code'){
if((s.code||'').trim()){
if(!ts)throw new McpError('The TypeScript compiler is not available here')
const r=ts.transpileModule(s.code,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020},reportDiagnostics:true})
code=r.outputText+COMPILER.EPI
for(const d of r.diagnostics||[])errors.push(e.name+': '+ts.flattenDiagnosticMessageText(d.messageText,'\n'))
}
}else if(s.mode==='blocks'&&s.blocks&&s.blocks.blocks&&s.blocks.blocks.blocks&&s.blocks.blocks.blocks.length){
if(!bridge)throw new McpError('Block scripts are compiled by the editor. Open the Vue Engine window with the HTTP server on, or switch "'+e.name+'" to Events or Code.')
code=await bridge.call('compileBlocks',{blocks:s.blocks})
}
if(code)scripts[e.id]=code
}
return{scripts,errors}
}
const live=async(name,args)=>{
if(!bridge)throw new McpError('This needs the Vue Engine window. Start the app normally and turn on the HTTP server in Settings, Integrations.')
return bridge.call(name,args||{})
}
const T=[]
const tool=(name,description,schema,fn,ro)=>T.push({name,description,schema,fn,ro})
tool('list_projects','List the .vue project files in the allowed folders.',S({}),async()=>{
const out=[]
for(const r of roots){
let l=[]
try{l=fs.readdirSync(r)}catch(e){}
for(const f of l)if(f.toLowerCase().endsWith('.vue')){const full=path.join(r,f);let st;try{st=fs.statSync(full)}catch(e){continue}out.push({path:full,name:f,modified:st.mtime.toISOString(),bytes:st.size})}
}
return out
},true)
tool('open_project','Open a project file so the other tools can read and edit it.',S({path:str('Path to a .vue file inside an allowed folder',1000)},['path']),async a=>{
const f=projectPath(a.path,true)
const st=fs.statSync(f)
if(st.size>200*1024*1024)throw new McpError('Project file is too large')
let p
try{p=JSON.parse(fs.readFileSync(f,'utf8'))}catch(e){throw new McpError('That file is not a valid Vue project')}
if(!p||!Array.isArray(p.scenes))throw new McpError('That file is not a valid Vue project')
cur.file=f;cur.project=p;cur.scene=0
return{name:p.name,scenes:p.scenes.map(s=>s.name)}
})
tool('new_project','Create a new project. Templates: '+SAMPLE.TEMPLATES.map(t=>t.id||t.name).join(', ')+'.',S({name:str('Project name',100),template:str('Template id. Defaults to a blank 2D project.',100),mode:{type:'string',enum:['2d','3d'],description:'Blank project mode'}},['name']),async a=>{
const safe=a.name.replace(/[^\w\- ]+/g,'').trim()
if(!safe)throw new McpError('Use letters, numbers, spaces or dashes in the name')
const t=a.template&&SAMPLE.TEMPLATES.find(x=>x.id===a.template||x.name===a.template)
if(a.template&&!t)throw new McpError('Unknown template: '+a.template)
const p=t?t.make():(a.mode==='3d'?SAMPLE.blank3():SAMPLE.blank())
p.name=a.name
const f=path.join(roots[0],safe+'.vue')
within(f,roots,'Project path')
if(fs.existsSync(f))throw new McpError('A project with that name already exists')
fs.writeFileSync(f,JSON.stringify(p),'utf8')
cur.file=real(f);cur.project=p;cur.scene=0
return{path:cur.file,scenes:p.scenes.map(s=>s.name)}
})
tool('save','Write the open project back to its file.',S({}),async()=>({path:save(),reloaded:bridge?await bridge.call('reload',{path:cur.file}).catch(()=>false):false}))
tool('get_scene','Describe a scene: settings and its objects.',S({scene:str('Scene name',200)}),async a=>{
const sc=scene(a.scene)
return{id:sc.id,name:sc.name,mode:sc.mode||'2d',bg:sc.bg,gravity:sc.gravity,camera:sc.camera,objects:sc.entities.map(brief)}
},true)
tool('list_objects','List objects in a scene, optionally filtered by tag.',S({scene:str('Scene name',200),tag:str('Only objects with this tag',100)}),async a=>scene(a.scene).entities.filter(e=>!a.tag||(e.tags||[]).includes(a.tag)).map(brief),true)
tool('get_object','Get every property of one object.',ref,async a=>find(a).e,true)
tool('create_object','Create an object. Kinds for 2D: '+Object.keys(SAMPLE.kinds).join(', ')+'. For 3D: '+Object.keys(SAMPLE.kinds3).join(', ')+'.',S({kind:str('Shape kind',50),scene:str('Scene name',200),properties:{type:'any',description:'Properties to set, such as x, y, w, h, color, body, tags'}},['kind']),async a=>{
const sc=scene(a.scene)
const k=(sc.mode==='3d'?SAMPLE.kinds3:SAMPLE.kinds)[a.kind]
if(!k)throw new McpError('Unknown kind for this scene: '+a.kind)
if(sc.entities.length>=20000)throw new McpError('This scene has too many objects')
const e=k()
if(a.properties!==undefined&&(typeof a.properties!=='object'||a.properties===null||Array.isArray(a.properties)))throw new McpError('properties must be an object')
applyProps(e,a.properties)
sc.entities.push(e)
return brief(e)
})
tool('update_object','Change several properties of an object at once.',S({id:str('Object id or name',200),scene:str('Scene name',200),properties:anyv('Properties to change')},['id','properties']),async a=>{
const{e}=find(a)
if(typeof a.properties!=='object'||a.properties===null||Array.isArray(a.properties))throw new McpError('properties must be an object')
applyProps(e,a.properties)
return brief(e)
})
tool('set_property','Set one property of an object.',S({id:str('Object id or name',200),scene:str('Scene name',200),key:str('Property name',50),value:anyv('New value')},['id','key','value']),async a=>{
const{e}=find(a)
applyProps(e,{[a.key]:a.value})
return{id:e.id,[a.key]:e[a.key]}
})
tool('delete_object','Delete an object and its children.',ref,async a=>{
const{sc,e}=find(a)
const kill=new Set([e.id])
let ch=true
while(ch){ch=false;for(const x of sc.entities)if(x.parent&&kill.has(x.parent)&&!kill.has(x.id)){kill.add(x.id);ch=true}}
sc.entities=sc.entities.filter(x=>!kill.has(x.id))
return{deleted:kill.size}
})
tool('add_component','Add a behavior preset or a player controller to an object. Behaviors: '+BH.NAMES.join(', ')+'. Player presets: '+['Platformer','Top-down RPG','Shooter','FPS','Racer-lite'].join(', ')+'.',S({id:str('Object id or name',200),scene:str('Scene name',200),preset:str('Behavior name or "Player:<preset>"',100),options:anyv('Optional field values for the preset')},['id','preset']),async a=>{
const{sc,e}=find(a)
if(a.options!==undefined&&(typeof a.options!=='object'||a.options===null||Array.isArray(a.options)))throw new McpError('options must be an object')
if(a.preset.startsWith('Player:')){
const RT=require('./runtime.js')
const n=a.preset.slice(7)
if(!RT.PC_PRESETS[n])throw new McpError('Unknown player preset: '+n)
e.player=RT.pcPreset(n)
e.body='dynamic'
return brief(e)
}
if(!BH.BEH[a.preset])throw new McpError('Unknown preset: '+a.preset)
const b=BH.make(a.preset,sc.mode==='3d')
for(const f of BH.BEH[a.preset].fields)if(a.options&&a.options[f.k]!==undefined)b[f.k]=a.options[f.k]
e.beh=(e.beh||[]).filter(x=>x.type!==a.preset)
e.beh.push(BH.norm(b))
if((a.preset==='Ball'||a.preset==='Vehicle')&&(!e.body||e.body==='none'||e.body==='static'))e.body='dynamic'
return brief(e)
})
tool('list_assets','List the assets stored in the project.',S({}),async()=>Object.keys(need().assets||{}).map(k=>({name:k,type:need().assets[k].type})),true)
tool('import_asset','Add an image or sound file from disk to the project assets.',S({path:str('File path inside an allowed import folder',1000),name:str('Asset name',200)},['path']),async a=>{
const p=need()
const f=within(a.path,importRoots.concat(cur.file?[real(path.dirname(cur.file))]:[]).concat(roots),'Import path')
const ext=path.extname(f).slice(1).toLowerCase()
const mime=ASSET_EXT[ext]
if(!mime)throw new McpError('Only image and audio files can be imported: '+Object.keys(ASSET_EXT).join(', '))
const st=fs.statSync(f)
if(!st.isFile()||st.size>MAX_ASSET)throw new McpError('That file is missing or larger than 20 MB')
const name=(a.name||path.basename(f)).replace(/[^\w.\- ]+/g,'')||'asset'
p.assets=p.assets||{}
p.assets[name]={type:mime.startsWith('audio')?'audio':'image',data:'data:'+mime+';base64,'+fs.readFileSync(f).toString('base64')}
return{name,type:p.assets[name].type,bytes:st.size}
})
tool('get_script','Read the script on an object (events, blocks JSON or code).',ref,async a=>{const{e}=find(a);return e.script||null},true)
tool('set_script','Set an object script. mode is events, blocks or code.',S({id:str('Object id or name',200),scene:str('Scene name',200),mode:{type:'string',enum:['events','blocks','code']},code:str('TypeScript source for code mode',500000),events:anyv('Event sheet JSON for events mode'),blocks:anyv('Blockly workspace JSON for blocks mode')},['id','mode']),async a=>{
const{e}=find(a)
const s={mode:a.mode,code:'',blocks:null,nodes:null,events:null}
if(a.mode==='code'){if(typeof a.code!=='string')throw new McpError('code mode needs a code string');s.code=a.code}
else if(a.mode==='events'){
const ev=a.events
if(!ev||typeof ev!=='object'||!Array.isArray(ev.rows))throw new McpError('events mode needs an object with a rows array')
s.events={v:1,vars:Array.isArray(ev.vars)?ev.vars:[],rows:ev.rows}
try{new Function('on','vue','self',EV.compileEvents(s.events))}catch(x){throw new McpError('That event sheet does not compile: '+x.message)}
}else{
if(!a.blocks||typeof a.blocks!=='object')throw new McpError('blocks mode needs a Blockly workspace object')
s.blocks=a.blocks
}
e.script=s
return{id:e.id,mode:s.mode}
})
tool('validate_script','Check a script and report problems. Code is type-checked with TypeScript against the Vue API.',S({id:str('Object id or name',200),scene:str('Scene name',200),code:str('Code to check instead of an object script',500000)}),async a=>{
if(a.code!==undefined)return{ok:!diagnose(a.code).length,diagnostics:diagnose(a.code)}
if(!a.id)throw new McpError('Give an object id or code')
const{e}=find(a)
const s=e.script
if(!s)return{ok:true,diagnostics:[]}
if(s.mode==='code'){const d=diagnose(s.code||'');return{ok:!d.length,diagnostics:d}}
if(s.mode==='events'){try{new Function('on','vue','self',EV.compileEvents(s.events));return{ok:true,diagnostics:[]}}catch(x){return{ok:false,diagnostics:[{line:0,column:0,message:x.message}]}}}
return{ok:true,diagnostics:[],note:'Blocks are checked by the editor'}
},true)
tool('run','Start playing the project in the editor window.',S({}),async()=>live('run'))
tool('stop','Stop the running game.',S({}),async()=>live('stop'))
tool('get_console_logs','Read the editor console messages.',S({limit:num('How many recent lines, up to 500')}),async a=>live('logs',{limit:Math.max(1,Math.min(500,Math.floor(a.limit||100)))}),true)
tool('screenshot','Capture the editor viewport as a PNG image.',S({}),async()=>({__image:await live('screenshot')}),true)
tool('list_extensions','List the extensions that can be installed, and which ones the project uses.',S({}),async()=>{
const have=need().extensions||[]
return extIndex().map(x=>({id:x.id,name:x.name,desc:x.desc,modes:x.modes,installed:have.includes(x.id)}))
},true)
tool('install_extension','Add an extension to the project.',S({id:str('Extension id',100)},['id']),async a=>{
const p=need()
const x=extIndex().find(q=>q.id===a.id)
if(!x)throw new McpError('Unknown extension: '+a.id)
p.extensions=p.extensions||[]
for(const r of x.requires||[])if(!p.extensions.includes(r))p.extensions.push(r)
if(!p.extensions.includes(x.id))p.extensions.push(x.id)
return{extensions:p.extensions}
})
tool('export_html','Export the project as one HTML game file.',S({path:str('Output .html path inside an allowed folder',1000)},['path']),async a=>{
const out=within(a.path,roots,'Output path')
if(path.extname(out).toLowerCase()!=='.html')throw new McpError('Output must end in .html')
const p=need()
const r=await compileAll()
const html=PLAYER.html(p,r.scripts,readRuntime(),p.name,p.scenes.some(s=>s.mode==='3d')?readThree():'')
fs.writeFileSync(out,html,'utf8')
return{path:out,bytes:Buffer.byteLength(html),errors:r.errors}
})
const resources=[
{uri:'vue://project',name:'Open project',description:'The open project as JSON',mimeType:'application/json',read:()=>JSON.stringify(need())},
{uri:'vue://api',name:'Script API',description:'The typed Vue scripting API (TypeScript declarations)',mimeType:'text/plain',read:()=>DTS.dts},
{uri:'vue://templates',name:'Templates',description:'Available starter templates',mimeType:'application/json',read:()=>JSON.stringify(SAMPLE.TEMPLATES.map(t=>({id:t.id,name:t.name,genre:t.genre,desc:t.desc})))},
{uri:'vue://behaviors',name:'Behavior presets',description:'Every behavior preset with its fields',mimeType:'application/json',read:()=>JSON.stringify(BH.NAMES.map(n=>({name:n,category:BH.BEH[n].cat,description:BH.BEH[n].desc,fields:BH.BEH[n].fields.map(f=>({key:f.k,type:f.t,default:f.d,description:f.tip,options:f.o&&f.o.map(q=>q[0])}))})))}
]
const ok=(id,result)=>({jsonrpc:'2.0',id,result})
const bad=(id,code,message)=>({jsonrpc:'2.0',id,error:{code,message}})
async function handle(msg){
if(!msg||typeof msg!=='object'||msg.jsonrpc!=='2.0'||typeof msg.method!=='string')return bad(msg&&msg.id!==undefined?msg.id:null,-32600,'Invalid request')
const id=msg.id
if(id===undefined)return null
try{
limit()
const p=msg.params||{}
if(msg.method==='initialize')return ok(id,{protocolVersion:['2024-11-05','2025-03-26','2025-06-18'].includes(p.protocolVersion)?p.protocolVersion:'2025-03-26',capabilities:{tools:{},resources:{}},serverInfo:{name:'vue-engine',version:opt.version||'1'},instructions:'Open or create a project, edit objects and scripts, then save. Event sheets are the easiest script format to write.'})
if(msg.method==='ping')return ok(id,{})
if(msg.method==='tools/list')return ok(id,{tools:T.map(t=>({name:t.name,description:t.description,inputSchema:Object.assign({additionalProperties:false},JSON.parse(JSON.stringify(t.schema,(k,v)=>k==='type'&&v==='any'?undefined:v))),annotations:{readOnlyHint:!!t.ro}}))})
if(msg.method==='tools/call'){
const t=T.find(x=>x.name===p.name)
if(!t)return bad(id,-32602,'Unknown tool: '+p.name)
let r
try{
r=await t.fn(check(t.schema,p.arguments))
}catch(x){
if(x instanceof McpError&&x.code===-32000)return bad(id,-32000,x.message)
return ok(id,{isError:true,content:[{type:'text',text:String(x&&x.message||x)}]})
}
if(r&&r.__image)return ok(id,{content:[{type:'image',data:r.__image,mimeType:'image/png'}]})
return ok(id,{content:[{type:'text',text:JSON.stringify(r===undefined?{ok:true}:r)}]})
}
if(msg.method==='resources/list')return ok(id,{resources:resources.map(r=>({uri:r.uri,name:r.name,description:r.description,mimeType:r.mimeType}))})
if(msg.method==='resources/read'){
const r=resources.find(x=>x.uri===p.uri)
if(!r)return bad(id,-32002,'Resource not found')
try{return ok(id,{contents:[{uri:r.uri,mimeType:r.mimeType,text:r.read()}]})}catch(x){return bad(id,-32002,x.message)}
}
return bad(id,-32601,'Method not found: '+msg.method)
}catch(x){
return bad(id,x.code||-32603,x.message)
}
}
return{handle,tools:T,state:cur}
}
function startHttp(server,o){
const token=o.token||crypto.randomBytes(24).toString('hex')
const tb=Buffer.from(token)
const s=http.createServer((req,res)=>{
const send=(c,b)=>{res.writeHead(c,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(b))}
const port=s.address().port
const hostOk=[`127.0.0.1:${port}`,`localhost:${port}`].includes(String(req.headers.host||''))
const origin=req.headers.origin
if(!hostOk||(origin&&!/^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/.test(origin)))return send(403,{error:'Forbidden'})
const a=Buffer.from(String(req.headers.authorization||'').replace(/^Bearer\s+/i,''))
if(a.length!==tb.length||!crypto.timingSafeEqual(a,tb))return send(401,{error:'Missing or wrong token'})
if(req.url.split('?')[0]!=='/mcp')return send(404,{error:'Not found'})
if(req.method!=='POST')return send(405,{error:'Use POST'})
let n=0
const chunks=[]
req.on('data',c=>{n+=c.length;if(n>8*1024*1024){req.destroy();return}chunks.push(c)})
req.on('end',async()=>{
let m
try{m=JSON.parse(Buffer.concat(chunks).toString('utf8'))}catch(e){return send(400,bad2(null,-32700,'Parse error'))}
if(Array.isArray(m)){const r=(await Promise.all(m.slice(0,50).map(server.handle))).filter(Boolean);return r.length?send(200,r):(res.writeHead(202),res.end())}
const r=await server.handle(m)
if(!r){res.writeHead(202);return res.end()}
send(200,r)
})
})
const bad2=(id,code,message)=>({jsonrpc:'2.0',id,error:{code,message}})
return new Promise((res,rej)=>{
s.once('error',rej)
s.listen(o.port||0,'127.0.0.1',()=>res({port:s.address().port,token,close:()=>new Promise(r=>s.close(()=>r()))}))
})
}
function runStdio(server,input,output){
let buf=''
const write=m=>output.write(JSON.stringify(m)+'\n')
input.setEncoding('utf8')
input.on('data',async c=>{
buf+=c
if(buf.length>16*1024*1024){buf='';return}
let i
while((i=buf.indexOf('\n'))>=0){
const line=buf.slice(0,i).trim()
buf=buf.slice(i+1)
if(!line)continue
let m
try{m=JSON.parse(line)}catch(e){write({jsonrpc:'2.0',id:null,error:{code:-32700,message:'Parse error'}});continue}
const r=await server.handle(m)
if(r)write(r)
}
})
}
module.exports={create,startHttp,runStdio,McpError}
