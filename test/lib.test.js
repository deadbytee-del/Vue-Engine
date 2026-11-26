const assert=require('assert')
const path=require('path')
const src=p=>require(path.join(__dirname,'..','src',p))
const RT=src('runtime.js')
const Sample=src('sample.js')
const LIB=src('apilib.js')
const D=src('dts.js')
const Blocks=src('blocks.js')
const {Game}=RT
const ctx=new Proxy({},{get:(t,k)=>k==='measureText'?()=>({width:10}):()=>{},set:()=>true})
const canvas={getContext:()=>ctx,width:0,height:0,addEventListener(){},removeEventListener(){},getBoundingClientRect:()=>({left:0,top:0,width:960,height:540})}
const step=(g,n)=>{for(let i=0;i<n;i++)g.update(1/60)}
const world=(ents,three,prefabs)=>{
const p=three?Sample.blank3():Sample.blank()
p.settings.core='js'
const sc=p.scenes[0]
sc.entities.length=0
for(const e of ents)sc.entities.push(Sample.ent(e))
for(const e of prefabs||[])sc.entities.push(Sample.ent(Object.assign({prefab:true},e)))
const g=new Game({canvas,project:p,scripts:{}})
g.loadScene(sc.id)
g.startAll()
return g
}
assert.ok(LIB.LIST.length>=60,'at least 60 new blocks, got '+LIB.LIST.length)
const names=new Set()
for(const d of LIB.LIST){
assert.ok(!names.has(d.n),'duplicate '+d.n)
names.add(d.n)
assert.ok(d.doc&&d.doc.length>8&&d.sig&&d.label,d.n+' is documented')
assert.ok(D.dts.includes(d.n+d.sig),d.n+' is in dts')
assert.strictEqual((d.label.match(/%\d/g)||[]).length,d.a.length,d.n+' label placeholders')
}
const g=world([{name:'A',x:0,y:0,w:20,h:20,body:'dynamic',gravityScale:0,tags:['a']},{name:'B',x:100,y:0,w:20,h:20,body:'static',tags:['wall']},{name:'C',x:200,y:0,w:20,h:20,body:'static',tags:['c']}],false,[{name:'Pre',w:10,h:10}])
const v=g.vue
const eq=(a,b,m)=>assert.deepStrictEqual(a,b,m)
eq(v.clamp(5,0,3),3);eq(v.clamp(-5,0,3),0)
eq(v.map(5,0,10,0,100),50)
eq(v.wrap(370,0,360),10);eq(v.wrap(-10,0,360),350)
eq(v.smoothstep(0,1,0.5),0.5);eq(v.smoothstep(0,1,2),1)
eq(v.approach(0,10,3),3);eq(v.approach(9,10,3),10);eq(v.approach(10,0,3),7)
eq(v.angleDiff(350,10),20);eq(v.angleDiff(10,350),-20)
eq(v.vec(1,2,3),{x:1,y:2,z:3})
eq(v.vecAdd(v.vec(1,1),v.vec(2,3)),{x:3,y:4,z:0})
eq(v.vecSub(v.vec(5,5),v.vec(2,3)),{x:3,y:2,z:0})
eq(v.vecScale(v.vec(1,2),3),{x:3,y:6,z:0})
eq(v.vecLength(v.vec(3,4)),5)
eq(v.vecNormalize(v.vec(0,10)),{x:0,y:1,z:0})
eq(v.vecDot(v.vec(1,2),v.vec(3,4)),11)
eq(v.listRange(1,5,2),[1,3,5]);eq(v.listRange(3,1,1),[3,2,1])
assert.ok([1,2,3].includes(v.listPick([1,2,3])))
eq(v.listShuffle([1,2,3,4]).sort(),[1,2,3,4])
eq(v.listSum([1,2,3]),6);eq(v.listMin([4,2,8]),2);eq(v.listMax([4,2,8]),8)
eq(v.listUnique([1,1,2,2,3]),[1,2,3])
eq(v.listSort([3,1,2]),[1,2,3]);eq(v.listSort([3,1,2],true),[3,2,1])
eq(v.upper('ab'),'AB');eq(v.lower('AB'),'ab')
eq(v.padNumber(7,3),'007');eq(v.formatNumber(3.14159,2),'3.14');eq(v.formatTime(125),'2:05')
eq(v.contains('hello','ell'),true);eq(v.repeatText('ab',3),'ababab')
assert.ok(v.now()>1e12&&typeof v.dateText()==='string')
v.startTimer('t');step(g,30)
assert.ok(v.timerElapsed('t')>0.4&&v.timerElapsed('none')===0)
let waited=false
v.waitUntil(()=>v.vars.go===true).then(()=>{waited=true})
step(g,3);assert.ok(!waited);v.vars.go=true;step(g,3);
const A=v.find('A')
v.push(A,10,0,0);eq(A.vx,10)
eq(v.speedOf(A),10)
v.freeze(A);eq(A.body,'static');v.unfreeze(A);eq(A.body,'dynamic')
v.knockback(A,v.find('B'),200);assert.ok(A.vx<-100)
v.setGravity(500);eq(g.scene.gravity,500)
v.zoom(2);eq(g.camera.zoom,2);v.resetCamera();eq(g.camera.zoom,1)
v.moveCamera(5,6);eq(g.camera.x,5);v.lookAt(A);eq(g.camera.x,A.x);v.fov(50);eq(g.camera.fov,50)
v.bar('E',50,100,10);assert.ok(/^█{5}░{5}$/.test(g.hudLines.get('E')))
v.healthBar(A);assert.ok(g.hudLines.has('Health'))
v.banner('Go',0.5);assert.ok([...g.hudLines.values()].includes('Go'));step(g,40);assert.ok(![...g.hudLines.values()].includes('Go'))
v.button('x',()=>{});v.clearButtons()
v.floatText(A,'hi',1);eq(A.sayText,'hi')
v.mute(true);v.mute(false);v.playRandom(['a']);v.playPitched('a',2);v.fadeMusic(0.05)
v.save('k',{a:1});eq(v.load('k'),{a:1});eq(v.hasSave('k'),true);v.deleteSave('k');eq(v.hasSave('k'),false);eq(v.load('k',9),9)
v.save('z',1);v.clearSaves();eq(v.hasSave('z'),false)
v.confetti(0,0);v.explosion(0,0);v.sparkle(A);v.smoke(0,0)
const hit=v.raycast(-50,0,1,0,500)
assert.ok(hit&&hit.entity.name==='A'||hit&&hit.entity.name==='B')
const h2=v.raycast(50,0,1,0,500,'c')
eq(h2.entity.name,'C');assert.ok(Math.abs(h2.dist-140)<1e-6)
eq(v.raycast(50,0,1,0,20,'c'),null)
eq(v.lineOfSight(A,v.find('C')),false)
eq(v.entitiesAt(A.x,A.y).map(e=>e.name),['A'])
eq(v.overlapping(A,'wall').length,0)
const n0=g.entities.length
v.spawnMany('Pre',4,0,0,50);v.spawnAround('Pre',3,A,40);v.spawnAt('Pre',A)
step(g,1)
eq(g.entities.filter(e=>e.name==='Pre'&&!e.prefab).length,8)
v.find('A').addTag('mark')
eq(v.destroyAll('mark'),1)
const g2=world([{name:'P',x:0,y:0,w:20,h:20,body:'dynamic',gravityScale:0,tags:['player']},{name:'K',x:100,y:0,w:20,h:20,body:'trigger',tags:['coin']}])
let t=0,te=0
g2.vue.onTouch('player','coin',()=>t++)
g2.vue.onTouchEnd('player','coin',()=>te++)
step(g2,3);eq(t,0)
g2.vue.find('P').x=100;step(g2,3);eq(t,1);step(g2,10);eq(t,1)
g2.vue.find('P').x=0;step(g2,3);eq(te,1)
const g3=world([{name:'Cam',x:0,y:0,z:0,w:1,h:1,d:1,body:'none'}],true)
g3.vue.lookAt(g3.vue.find('Cam'));eq(g3.camera.tx,0)
;(async()=>{
let Blockly=require('blockly')
const {javascriptGenerator:gen,Order}=require('blockly/javascript')
const Compiler=src('compiler.js')
const env={Blockly,gen,blocks:Blocks,nodes:src('nodedefs.js'),events:src('events.js'),transpile:async c=>({code:c,errors:[]})}
const tb=Blocks.init(Blockly,gen,Order).toolbox
const cats=tb.contents.filter(c=>c.kind==='category'&&c.contents)
const made=cats.flatMap(c=>c.contents).filter(b=>b.type&&b.type.startsWith('vue_a_'))
assert.strictEqual(made.length,LIB.LIST.length,'every lib block is in the toolbox')
let total=0
for(const b of made){
const d=LIB.LIST.find(x=>'vue_a_'+x.n===b.type)
const body=d.t==='val'?{type:'vue_say',inputs:{T:{block:{type:b.type,inputs:b.inputs}},S:{shadow:{type:'math_number',fields:{NUM:1}}}}}:{type:b.type,inputs:b.inputs}
const ws={blocks:{languageVersion:0,blocks:[{type:'vue_on_start',inputs:{DO:{block:body}}}]}}
const code=await Compiler.compileScript({mode:'blocks',blocks:ws},env)
assert.ok(!code.errors.length,d.n+' compiles')
assert.ok(code.code.includes('vue.'+d.n),d.n+' generates vue.'+d.n)
new Function('on','vue','self',code.code)
total++
}
assert.strictEqual(total,LIB.LIST.length)
console.log('lib tests passed ('+LIB.LIST.length+' blocks)')
})().catch(e=>{console.error(e);process.exit(1)})
