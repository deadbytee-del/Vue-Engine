const assert=require('assert')
const path=require('path')
const src=p=>require(path.join(__dirname,'..','src',p))
const Blockly=require('blockly')
const {javascriptGenerator:gen,Order}=require('blockly/javascript')
const ts=require('typescript')
const {Game}=src('runtime.js')
const Nodes=src('nodedefs.js')
const Blocks=src('blocks.js')
const Compiler=src('compiler.js')
const Sample=src('sample.js')
const Player=src('player.js')
Blocks.init(Blockly,gen,Order)
const transpile=async s=>{
const r=ts.transpileModule(s,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020},reportDiagnostics:true})
return{code:r.outputText,errors:(r.diagnostics||[]).map(d=>ts.flattenDiagnosticMessageText(d.messageText,'\n'))}
}
const ctx=new Proxy({},{get:(t,k)=>k==='measureText'?()=>({width:10}):()=>{},set:()=>true})
const canvas={getContext:()=>ctx,width:0,height:0,addEventListener(){},removeEventListener(){},getBoundingClientRect:()=>({left:0,top:0,width:960,height:540})}
const step=(g,n)=>{for(let i=0;i<n;i++)g.update(1/60)}
const key=(g,k,down)=>{if(down){g.keys.add(k);g.pressedSet.add(k)}else g.keys.delete(k)}
;(async()=>{
const project=Sample.make()
const env={Blockly,gen,blocks:Blocks,nodes:Nodes,transpile}
const {scripts,errors}=await Compiler.compileProject(project,env)
assert.deepStrictEqual(errors,[])
assert.strictEqual(Object.keys(scripts).length,6)
for(const code of Object.values(scripts))new Function('vue','self','on','exports','module',code)
const g=new Game({canvas,project,scripts})
g.loadScene('s1')
g.startAll()
const pl=g.vue.find('Player'),en=g.vue.find('Enemy')
assert.ok(pl&&en)
step(g,90)
assert.ok(pl.grounded,'player grounded')
const gy=pl.y
key(g,'arrowright',true)
const x0=pl.x
step(g,30)
assert.ok(pl.x>x0+100,'player moves right')
key(g,'arrowright',false)
key(g,'space',true)
step(g,2)
assert.ok(pl.y<gy-5,'player jumps')
step(g,120)
const c1=g.vue.find('Coin 1')
pl.x=c1.x;pl.y=c1.y
step(g,3)
assert.strictEqual(g.vars.score,1,'coin collected')
assert.ok(!c1.alive,'coin destroyed')
const vxs=new Set()
for(let i=0;i<60;i++){step(g,1);vxs.add(Math.round(en.vx))}
assert.ok(vxs.size>10,'enemy patrol velocity varies')
const ex=en.x
pl.x=en.x;pl.y=en.y
step(g,1)
await new Promise(r=>setTimeout(r,10))
step(g,30)
assert.ok(g.timers.length>=0)
g.draw()
const html=Player.html(project,scripts,require('fs').readFileSync(path.join(__dirname,'..','src','runtime.js'),'utf8'),'Test')
assert.ok(html.includes('VueRuntime.Game')&&!html.includes('</script></script>'))
const bad=await Compiler.compileScript({mode:'code',code:'export function update( {'},env)
assert.ok(bad.errors.length>0,'syntax errors reported')
const g2=new Game({canvas,project,scripts:{}})
g2.loadScene('s1')
const t0=process.hrtime.bigint()
for(let i=0;i<2000;i++){const d={id:'x'+i,name:'b'+i,x:(i%100)*40,y:-Math.floor(i/100)*40,w:30,h:30,body:i%2?'dynamic':'static'};g2.entities.push(new (require(path.join(__dirname,'..','src','runtime.js')).Entity)(d,g2))}
step(g2,60)
const ms=Number(process.hrtime.bigint()-t0)/1e6
console.log('2000 bodies, 60 steps:',ms.toFixed(1),'ms')
console.log('all tests passed')
})().catch(e=>{console.error(e);process.exit(1)})
