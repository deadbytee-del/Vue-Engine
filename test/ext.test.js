const assert=require('assert'),fs=require('fs'),path=require('path'),vm=require('vm')
const R=require(path.join(__dirname,'..','src','runtime.js'))
const dir=path.join(__dirname,'..','extensions')
const cat=require(path.join(dir,'index.json')).extensions
for(const e of cat)vm.runInThisContext(fs.readFileSync(path.join(dir,e.file),'utf8'),{filename:e.file})
const P=()=>new Proxy(function(){},{get:(t,k)=>k==='measureText'?()=>({width:10}):k==='canvas'?{width:960,height:540}:P(),set:()=>true,apply:()=>P()})
const ctx=P(),canvas={getContext:()=>ctx,width:0,height:0}
const ids=cat.filter(e=>e.modes!=='3d').map(e=>e.id)
const ent=(o)=>Object.assign({id:'e'+Math.random().toString(36).slice(2),name:'E',x:0,y:0,w:32,h:32,shape:'rect',color:'#fff',body:'none',tags:[],visible:true},o)
const tiles={};for(let x=-20;x<20;x++)tiles[x+',4']=0
const p={settings:{},assets:{},extensions:ids,scenes:[{id:'s',name:'s',mode:'2d',gravity:1400,entities:[
ent({name:'Hero',x:-200,y:0,body:'dynamic',tags:['player']}),
ent({name:'Goal',x:300,y:-200}),
ent({name:'Wall',x:0,y:-60,w:40,h:300,body:'static'}),
ent({name:'Crate',x:100,y:60,body:'static',tags:['breakable']}),
ent({name:'Pool',x:-300,y:100,w:200,h:80,tags:['water']}),
ent({name:'Lamp',x:50,y:0,tags:['light']}),
ent({name:'Map',shape:'tilemap',x:0,y:0,cell:32,tiles,solid:true}),
ent({name:'Bat',x:500,y:-100,prefab:true,tags:['bat']})
].concat(Array.from({length:30},(_,i)=>ent({name:'Sheep',x:400+i*5,y:-300,tags:['sheep']})))}],startScene:'s'}
const g=new R.Game({canvas,project:p,scripts:{}})
g.loadScene('s');g.initExt();g.startAll()
const v=g.vue
for(const id of ids){const d=cat.find(e=>e.id===id);assert.ok(v[d.ns],'api for '+id)}
v.fx.burst(0,0,'sparks');const em=v.fx.emitter('fire',{x:10,y:10})
const path1=v.nav.path('Hero','Goal')
assert.ok(path1.length>0,'nav path found')
const wall=v.find('Wall');for(const q of path1)assert.ok(!(Math.abs(q.x-wall.x)<wall.w/2&&Math.abs(q.y-wall.y)<wall.h/2),'path avoids wall')
let seen=0
v.bt.run('Lamp',v.bt.seq(v.bt.cond(()=>true),v.bt.wait(0.1),v.bt.act(()=>{seen++;return true})))
v.director.spawner('Bat',{max:3,tag:'bat',rate:{calm:30,build:30,peak:30,relax:30}})
const k=v.crowd.add('sheep',{goal:{x:600,y:-300}})
v.terrain.noise(1,2,3)
v.weather.set('rain');v.day.setHour(21);v.post.set('bloom',0.5);v.blur.strength(0.5)
v.dialogue.say('Guide','Hello there')
for(let i=0;i<180;i++){g.update(1/60);g.draw()}
assert.ok(seen>=1,'behavior tree ran an action')
assert.ok(v.count('bat')>0,'director spawned')
assert.ok(v.fx.count>0,'particles alive')
assert.ok(v.day.isNight,'night at 21h')
const before=g.tms[0].tiles.size
v.destruct.explode(100,100,90)
assert.ok(g.tms[0].tiles.size<before,'explosion removed tiles')
assert.ok(!v.find('Crate')||!v.find('Crate').alive,'breakable shattered')
for(let i=0;i<200;i++)g.update(1/60)
assert.strictEqual(v.all('debris').length,0,'debris cleaned up')
const sheep=v.all('sheep');assert.ok(sheep.reduce((a,e)=>a+e.x,0)/sheep.length>400,'crowd moves toward goal')
v.stream.radius(50);for(let i=0;i<30;i++)g.update(1/60)
assert.ok(v.stream.sleeping>0,'streaming slept far entities')
v.stream.wake()
{const h=v.find('Hero');h.vx=300;g.snap();g.update(1/60);const x1=h.x,y1=h.y;let seenX=null;const d=g.draw.bind(g);g.draw=()=>{seenX=h.x;d()};g.drawLerp(0.5);g.draw=d;assert.ok(seenX!==null&&Math.abs(seenX-(h._px+(x1-h._px)*0.5))<1e-9,'interpolated draw position');assert.ok(h.x===x1&&h.y===y1,'positions restored after interpolated draw')}
console.log('extension tests passed ('+ids.length+' 2D-capable extensions exercised, '+cat.length+' in catalog)')
