const assert=require('assert')
const path=require('path')
const src=p=>require(path.join(__dirname,'..','src',p))
const RT=src('runtime.js')
const Sample=src('sample.js')
const Compiler=src('compiler.js')
const Nodes=src('nodedefs.js')
const {Game}=RT
const ctx=new Proxy({},{get:(t,k)=>k==='measureText'?()=>({width:10}):()=>{},set:()=>true})
const canvas={getContext:()=>ctx,width:0,height:0,addEventListener(){},removeEventListener(){},getBoundingClientRect:()=>({left:0,top:0,width:960,height:540})}
const step=(g,n)=>{for(let i=0;i<n;i++)g.update(1/60)}
const key=(g,k,down)=>{if(down){g.keys.add(k);g.pressedSet.add(k)}else g.keys.delete(k)}
const tap=(g,k)=>{g.keys.add(k);g.pressedSet.add(k);step(g,1);g.keys.delete(k)}
const world=(player,extra)=>{
const p=Sample.blank()
p.settings.core='js'
p.scenes[0].entities.push(Sample.ent({name:'Ground',x:0,y:300,w:4000,h:100,body:'static'}))
for(const e of extra||[])p.scenes[0].entities.push(Sample.ent(e))
p.scenes[0].entities.push(Sample.ent(Object.assign({name:'P',x:0,y:200,w:30,h:50,body:'dynamic'},player)))
const g=new Game({canvas,project:p,scripts:{}})
g.loadScene('s1')
g.startAll()
return g
}
const pl=g=>g.vue.find('P')
let g=world({player:{type:'platformer'}})
step(g,60)
assert.ok(pl(g).grounded,'grounded')
assert.ok(pl(g).pc&&pl(g).pc.keys&&pl(g).pc.cam,'defaults filled')
key(g,'d',true)
step(g,3)
const v1=pl(g).vx
assert.ok(v1>0&&v1<pl(g).pc.speed,'accelerates gradually')
step(g,60)
assert.ok(Math.abs(pl(g).vx-pl(g).pc.speed)<1,'reaches speed')
assert.ok(pl(g).x>100,'moves right')
key(g,'shift',true)
step(g,60)
assert.ok(pl(g).vx>pl(g).pc.speed,'run multiplier')
assert.ok(pl(g).vx<=pl(g).pc.maxSpeed+1e-6,'max speed cap')
key(g,'d',false);key(g,'shift',false)
step(g,60)
assert.ok(Math.abs(pl(g).vx)<1,'friction stops')
g.vue.player.speed=100
key(g,'a',true)
step(g,90)
assert.ok(Math.abs(pl(g).vx+100)<1,'vue.player overrides speed')
key(g,'a',false)
g=world({player:{type:'platformer',jumpHeight:100}})
step(g,60)
const y0=pl(g).y
let top=y0
tap(g,'space')
for(let i=0;i<90;i++){step(g,1);key(g,'space',true);top=Math.min(top,pl(g).y)}
key(g,'space',false)
assert.ok(Math.abs((y0-top)-100)<12,'jump height close to setting '+(y0-top))
g=world({player:{type:'platformer',coyote:0.1}})
step(g,60)
const ground=g.vue.find('Ground')
ground.y=1e6
g.sDirty=true
step(g,3)
tap(g,'space')
assert.ok(pl(g).vy<0||pl(g).y<200,'coyote jump just after leaving ground')
g=world({player:{type:'platformer',coyote:0.1}})
step(g,60)
g.vue.find('Ground').y=1e6
g.sDirty=true
step(g,14)
tap(g,'space')
assert.ok(pl(g).vy>0,'no jump after coyote expires')
g=world({player:{type:'platformer',jumps:1,buffer:0.15,y:80}})
const ey=pl(g)
let n=0
while(!ey.grounded&&n++<400){step(g,1);if(ey.y>300-50-25-14&&ey.vy>0&&!g.pressedSet.size&&n>5)break}
tap(g,'space')
for(let i=0;i<20&&ey.vy>=0;i++)step(g,1)
assert.ok(ey.vy<0||ey.y<250,'buffered jump fires on landing')
g=world({player:{type:'platformer',jumps:2}})
step(g,60)
tap(g,'space')
step(g,10)
tap(g,'space')
const vy2=pl(g).vy
step(g,1)
assert.ok(vy2<0&&pl(g).vy<0,'double jump works')
step(g,5)
const before=pl(g).vy
tap(g,'space')
assert.ok(pl(g).vy>=before,'no third jump')
g=world({y:-600,player:{type:'topdown4'}})
key(g,'d',true);key(g,'w',true)
step(g,30)
assert.ok(Math.abs(pl(g).vy)<1e-6||Math.abs(pl(g).vx)<1e-6,'4 direction moves on one axis')
g=world({y:-600,player:{type:'topdown8'}})
key(g,'d',true);key(g,'s',true)
step(g,60)
assert.ok(Math.abs(Math.hypot(pl(g).vx,pl(g).vy)-pl(g).pc.speed)<2,'8 direction normalized diagonal')
g=world({player:{type:'platformer',health:{max:50,respawn:true,rx:10,ry:100}}})
step(g,5)
pl(g).hurt(50)
step(g,1)
assert.strictEqual(pl(g).hp,50,'respawn restores health')
assert.ok(Math.abs(pl(g).x-10)<1e-6,'respawn point')
for(const name of Object.keys(RT.PC_PRESETS)){
const a=RT.pcPreset(name)
const b=JSON.parse(JSON.stringify(a))
assert.deepStrictEqual(RT.pcNorm(b),a,'preset roundtrip '+name)
assert.deepStrictEqual(RT.pcNorm(JSON.parse(JSON.stringify(RT.pcNorm(b)))),a)
}
const mine=RT.pcNorm({type:'topdown8',speed:333,keys:{left:['j']},cam:{zoom:2}})
const rt=RT.pcNorm(JSON.parse(JSON.stringify(mine)))
assert.deepStrictEqual(rt,mine,'user preset serialization')
assert.strictEqual(rt.keys.right[0],'d','partial keys keep defaults')
assert.strictEqual(rt.cam.zoom,2)
const proj=JSON.parse(JSON.stringify(Sample.makePC()))
assert.ok(proj.scenes[0].entities.some(e=>e.player),'template has player')
const tg=new Game({canvas,project:proj,scripts:{}})
tg.loadScene('s1');tg.startAll()
step(tg,90)
assert.ok(tg.vue.find('Player').grounded,'template player grounded')
key(tg,'d',true)
step(tg,60)
assert.ok(tg.vue.find('Player').x>-500+50,'template player moves with no scripts')
assert.ok(Sample.TEMPLATES.some(t=>t.id==='pc'))
const cam0=tg.camera.x
step(tg,30)
assert.ok(tg.camera.x>cam0-1e-6,'camera follows')
for(const s of['pill','rrect','triangle','hexagon','star','ring','arrow','circle']){
const L=RT.shapeLoops(s,80,40)
assert.ok(L.length>=1&&L.every(p=>p.length>=3&&p.every(q=>Math.abs(q[0])<=40.0001&&Math.abs(q[1])<=20.0001)),'shape loops '+s)
}
assert.strictEqual(RT.shapeLoops('ring',50,50).length,2)
for(const k of Object.keys(Sample.kinds))assert.ok(Sample.kinds[k]().shape)
for(const k of['capsule','cone','torus','pyramid','wedge','stairs'])assert.strictEqual(Sample.kinds3[k]().shape,k)
const rest=(shape,x)=>{
const p=Sample.blank()
p.settings.core='js'
p.scenes[0].entities.push(Sample.ent({name:'S',x:0,y:100,w:100,h:40,body:'static'}),Sample.ent({name:'C',shape,x,y:0,w:20,h:60,body:'dynamic'}))
const g=new Game({canvas,project:p,scripts:{}})
g.loadScene('s1');g.startAll()
step(g,120)
return g.vue.find('C')
}
const aabb=rest('rect',59),cap=rest('pill',59)
assert.ok(aabb.grounded&&Math.abs(aabb.y-(80-30))<0.01,'aabb rests on top')
const r=10,L=20,dx=59-50,need=L+Math.sqrt(r*r-Math.min(dx,r)*Math.min(dx,r))
assert.ok(Math.abs(cap.y-(80-need))<0.05&&cap.y>aabb.y+5,'capsule rests on corner exactly '+cap.y)
const capMid=rest('pill',0)
assert.ok(Math.abs(capMid.y-(80-30))<0.05,'capsule rests flat on top')
const h3=(shape)=>{
const p=Sample.blank3()
p.settings.core='js'
p.scenes[0].entities.length=0
p.scenes[0].entities.push(Sample.ent({name:'S',x:0,y:0,z:0,w:2,h:1,d:2,body:'static',shape:'box'}),Sample.ent({name:'C',shape,x:1.3,y:3,z:0,w:0.8,h:1.8,d:0.8,body:'dynamic'}))
const g=new Game({canvas,project:p,scripts:{}})
g.loadScene('s1');g.startAll()
step(g,180)
return g.vue.find('C')
}
const c3=h3('capsule'),b3=h3('box')
assert.ok(Math.abs(b3.y-(0.5+0.9))<0.01,'3d box rests on top')
const r3=0.4,L3=0.9-r3,dd=1.3-1
assert.ok(Math.abs(c3.y-(0.5+L3+Math.sqrt(r3*r3-dd*dd)))<0.02&&c3.y<b3.y-0.1,'3d capsule rests on corner '+c3.y)
const env={Blockly:null,gen:null,blocks:null,nodes:Nodes,transpile:async s=>({code:s,errors:[]})}
const code=Nodes.compileGraph({nid:3,nodes:[{id:1,type:'start',x:0,y:0,v:{}},{id:2,type:'playerctl',x:200,y:0,v:{preset:'FPS'}}],links:[{a:1,ap:'next',b:2,bp:'in'}]})
assert.ok(/makePlayer\("FPS"\)/.test(code),'node compiles '+code)
const code2=Nodes.compileGraph({nid:3,nodes:[{id:1,type:'start',x:0,y:0,v:{}},{id:2,type:'playerset',x:200,y:0,v:{prop:'speed',value:300}}],links:[{a:1,ap:'next',b:2,bp:'in'}]})
assert.ok(/vue\.player\["speed"\]=300/.test(code2),'player set node '+code2)
const dts=src('dts.js').dts
assert.ok(/PlayerController/.test(dts)&&/makePlayer/.test(dts))
console.log('player tests passed')
