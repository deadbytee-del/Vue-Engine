const assert=require('assert')
const path=require('path')
const src=p=>require(path.join(__dirname,'..','src',p))
const Blockly=require('blockly')
const {javascriptGenerator:gen,Order}=require('blockly/javascript')
const R=src('runtime.js')
const Nodes=src('nodedefs.js')
const Blocks=src('blocks.js')
Blocks.init(Blockly,gen,Order)
const ctx=new Proxy({},{get:(t,k)=>k==='measureText'?()=>({width:10}):()=>{},set:()=>true})
const canvas={getContext:()=>ctx,width:0,height:0}
const step=(g,n)=>{for(let i=0;i<n;i++)g.update(1/60)}
const mk=(ents,o)=>Object.assign({settings:{},assets:{},scenes:[Object.assign({id:'s',name:'S',gravity:1400,entities:ents},o||{})],startScene:'s'},{})
const game=(p,scripts)=>{const g=new R.Game({canvas,project:p,scripts:scripts||{}});g.loadScene('s');g.startAll();return g}
const AF=Object.getPrototypeOf(async function(){}).constructor
;(async()=>{
let n=0
for(const def of Blocks.DEFS){
const ws=new Blockly.Workspace()
const t=def.type
const b=ws.newBlock(t)
let top=b
if(Blocks.HATS.indexOf(t)<0){
const hatB=ws.newBlock('vue_on_start')
if(def.output!==undefined){const pr=ws.newBlock('vue_print');pr.getInput('V').connection.connect(b.outputConnection);hatB.getInput('DO').connection.connect(pr.previousConnection)}
else hatB.getInput('DO').connection.connect(b.previousConnection)
top=hatB
}
const json=Blockly.serialization.workspaces.save(ws)
ws.dispose()
const code=Blocks.compile(json,Blockly,gen)
try{new Function('vue','self','on','exports','module',code)}catch(x){throw new Error(t+': '+x.message+'\n'+code)}
n++
}
console.log('blocks compiled:',n)
{
const ws=new Blockly.Workspace()
const proc=ws.newBlock('procedures_defreturn');proc.setFieldValue('double','NAME')
const call=ws.newBlock('procedures_callreturn');call.setFieldValue('double','NAME')
const w=ws.newBlock('vue_wait');const num=ws.newBlock('math_number');num.setFieldValue(0,'NUM');w.getInput('S').connection.connect(num.outputConnection)
proc.getInput('STACK').connection.connect(w.previousConnection)
const hatB=ws.newBlock('vue_on_start'),pr=ws.newBlock('vue_print')
pr.getInput('V').connection.connect(call.outputConnection);hatB.getInput('DO').connection.connect(pr.previousConnection)
const rep=ws.newBlock('controls_repeat_ext');const n10=ws.newBlock('math_number');n10.setFieldValue(3,'NUM');rep.getInput('TIMES').connection.connect(n10.outputConnection)
pr.nextConnection.connect(rep.previousConnection)
const code=Blocks.compile(Blockly.serialization.workspaces.save(ws),Blockly,gen)
assert.ok(/async function double/.test(code)&&/await double\(/.test(code),'procedures async')
new Function('vue','self','on','exports','module',code)
}
{
const ws=new Blockly.Workspace()
const h=ws.newBlock('vue_on_update'),cx=ws.newBlock('vue_change_x'),nb=ws.newBlock('math_number')
nb.setFieldValue(1,'NUM');cx.getInput('BY').connection.connect(nb.outputConnection);h.getInput('DO').connection.connect(cx.previousConnection)
const code=Blocks.compile(Blockly.serialization.workspaces.save(ws),Blockly,gen)
assert.ok(!/async/.test(code),'sync update handlers stay sync')
}
for(const t in Nodes.defs){
const d=Nodes.defs[t]
const g={nodes:[{id:1,type:d.ev?t:'start',x:0,y:0,v:{}}],links:[]}
if(!d.ev){g.nodes.push({id:2,type:t,x:0,y:0,v:{}});if(d.c)g.links.push({a:1,ap:'next',b:2,bp:'in'});else{g.nodes.push({id:3,type:'print',v:{}});g.links.push({a:1,ap:'next',b:3,bp:'in'});const o=d.out[0];g.links.push({a:2,ap:o.n,b:3,bp:'value'})}}
const code=Nodes.compileGraph(g)
try{new Function('vue','self','on','exports','module',code)}catch(x){throw new Error('node '+t+': '+x.message+'\n'+code)}
}
console.log('nodes compiled:',Object.keys(Nodes.defs).length)
{
const p=mk([
{id:'p',name:'Parent',x:100,y:100,w:40,h:40,rot:90},
{id:'c',name:'Child',x:50,y:0,w:10,h:10,parent:'p'},
{id:'g',name:'Grand',x:10,y:0,w:4,h:4,parent:'c'}
])
const g=game(p)
const P=g.vue.find('Parent'),Cc=g.vue.find('Child'),G=g.vue.find('Grand')
assert.ok(Math.abs(Cc.x-100)<1e-6&&Math.abs(Cc.y-150)<1e-6,'child world from parent rotation')
assert.ok(Math.abs(G.y-160)<1e-6,'grandchild chained')
P.x+=20;step(g,1)
assert.ok(Math.abs(Cc.x-120)<1e-6,'child follows parent')
Cc.x=200;step(g,1)
assert.ok(Math.abs(Cc.x-200)<1e-6&&Math.abs(Cc.lx-(150-0))>-1,'script write to child world persists')
P.destroy();step(g,1)
assert.ok(!Cc.alive&&!G.alive,'children destroyed with parent')
const L=R.toLocal({x:1,y:2,z:3,rx:10,ry:30,rz:5},{x:4,y:5,z:6,rx:10,ry:30,rz:5},true)
const M=R.mat(10,30,5),wx=1+M[0]*L.x+M[1]*L.y+M[2]*L.z
assert.ok(Math.abs(wx-4)<1e-9&&Math.abs(L.rx)<1e-6&&Math.abs(L.ry)<1e-6,'3d toLocal inverse')
}
{
const tiles={}
for(let x=-5;x<=5;x++)tiles[x+',2']=0
const p=mk([{id:'t',name:'Tilemap',shape:'tilemap',x:0,y:0,cell:32,tiles,solid:true,tags:['ground']},{id:'h',name:'Hero',x:16,y:-50,w:20,h:20,body:'dynamic'}])
const code="on('collide',function(o){if(o.hasTag('ground'))vue.vars.hit=1})"
const g=game(p,{h:code})
step(g,90)
const h=g.vue.find('Hero')
assert.ok(h.grounded&&Math.abs(h.y-(64-10))<0.01,'lands on tile row: y='+h.y)
assert.strictEqual(g.vue.tileAt('Tilemap',16,70),0)
g.vue.setTile('Tilemap',16,70,-1)
assert.strictEqual(g.vue.tileAt('Tilemap',16,70),-1)
assert.ok(h.touching('ground')||g.vars.hit===1,'touching tilemap')
}
{
const p=mk([{id:'a',name:'Anim',shape:'sprite',x:0,y:0,anims:{walk:{sheet:'s.png',fw:16,fh:16,frames:[3,4,5],fps:10,loop:true},hit:{sheet:'s.png',fw:16,fh:16,frames:[7,8],fps:10,loop:false}},anim:'walk'}])
const g=game(p,{a:"on('animend',function(){vue.vars.done=(vue.vars.done||0)+1})"})
const a=g.vue.find('Anim')
assert.strictEqual(a.frame,3)
step(g,7)
assert.strictEqual(a.frame,4)
step(g,12)
assert.strictEqual(a.frame,3,'loops')
a.play('hit');step(g,30)
assert.strictEqual(a.frame,8);assert.strictEqual(g.vars.done,1,'animend once')
}
{
const p=mk([{id:'a',name:'Actor',x:0,y:0,w:10,h:10},{id:'b',name:'Watcher',x:0,y:0}])
p.cutscenes=[{id:'c1',name:'Intro',lock:true,letterbox:true,steps:[{type:'move',target:'Actor',t:0,dur:1,x:100,y:50,ease:'linear'},{type:'camera',t:0.5,dur:0.5,x:30,y:40,zoom:2},{type:'setvar',t:1.2,dur:0,name:'seen',value:'1'},{type:'emit',t:1.3,dur:0,name:'done'}]}]
const g=game(p,{b:"on('msg:done',function(){vue.vars.got=1})"})
let fin=false
g.vue.cutscene('Intro').then(()=>{fin=true})
step(g,30)
const A=g.vue.find('Actor')
assert.ok(Math.abs(A.x-50)<3,'tween halfway '+A.x)
assert.ok(g.vue.inCutscene&&!g.vue.key('a'))
step(g,60)
await new Promise(r=>setTimeout(r,0))
assert.ok(Math.abs(A.x-100)<1e-6&&Math.abs(g.camera.zoom-2)<1e-6,'final state')
assert.strictEqual(g.vars.seen,1);assert.strictEqual(g.vars.got,1)
assert.ok(fin&&!g.vue.inCutscene,'cutscene finished')
}
{
const p=mk([{id:'a',name:'A',x:0,y:0}])
const g=game(p)
const A=g.vue.find('A')
let done=false
g.vue.tween(A,{x:10},0.5,'linear').then(()=>done=true)
step(g,31)
await new Promise(r=>setTimeout(r,0))
assert.ok(done&&A.x===10)
let ticks=0
g.vue.every(0.1,()=>ticks++)
step(g,61)
assert.ok(ticks>=9&&ticks<=11,'every '+ticks)
}
{
const p=mk([{id:'pf',name:'Bullet',x:0,y:0,prefab:true},{id:'pk',name:'Trail',x:5,y:0,parent:'pf'}])
const g=game(p)
assert.strictEqual(g.vue.count(),0)
const b=g.vue.spawn('Bullet',100,0)
step(g,1)
assert.strictEqual(g.entities.length,2,'prefab kids spawned')
const t=g.entities.find(e=>e.name==='Trail')
assert.ok(Math.abs(t.x-105)<1e-6&&t.par===b)
}
{
const Sample=src('sample.js'),Compiler=src('compiler.js'),ts=require('typescript')
const env={Blockly,gen,blocks:Blocks,nodes:Nodes,events:require('../src/events.js'),transpile:async c=>{const r=ts.transpileModule(c,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020},reportDiagnostics:true});return{code:r.outputText,errors:(r.diagnostics||[]).map(d=>ts.flattenDiagnosticMessageText(d.messageText,'\n'))}}}
const p=Sample.makeKit()
const r=await Compiler.compileProject(p,env)
assert.deepStrictEqual(r.errors,[])
const g=new R.Game({canvas,project:p,scripts:r.scripts})
g.loadScene(p.startScene);g.startAll()
assert.ok(g.vue.inCutscene,'intro autoplays')
step(g,60)
assert.ok(!g.vue.key('d'),'input locked during intro')
step(g,240)
assert.ok(!g.vue.inCutscene,'intro ends')
const hero=g.vue.find('Hero'),hat=g.vue.find('Hat'),plume=g.vue.find('Plume')
assert.ok(hero.grounded&&Math.abs(hero.y-(128-20))<0.01,'hero on tiles '+hero.y)
assert.ok(Math.abs(hat.x-hero.x)<1e-6&&Math.abs(hat.y-(hero.y-24))<1e-6&&Math.abs(plume.y-(hero.y-30))<1e-6,'hat and plume follow')
assert.strictEqual(hero.animation,'idle')
g.keys.add('d');g.pressedSet.add('d')
step(g,30)
assert.strictEqual(hero.animation,'walk')
assert.ok(hero.x>-240+80,'hero walks')
}
{
const fs=require('fs'),vm=require('vm')
const main=fs.readFileSync(path.join(__dirname,'..','main.js'),'utf8'),web=fs.readFileSync(path.join(__dirname,'..','src','host-web.js'),'utf8')
assert.ok(/join\('\\n;\\n'\)/.test(main)&&/join\('\\n;\\n'\)/.test(web),'runtime sources joined safely')
const js=['vwr.js','runtime.js','render3d.js'].map(f=>fs.readFileSync(path.join(__dirname,'..','src',f),'utf8')).join('\n;\n')
const w={console,atob,WebAssembly,Uint8Array};w.window=w
vm.runInNewContext(js,w)
assert.ok(w.VueRuntime&&w.VueRender3D&&w.VWR,'game runtime bundle evaluates')
}
console.log('feature tests passed')
})().catch(e=>{console.error(e);process.exit(1)})
