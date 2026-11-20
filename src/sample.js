(function(root){
let n=0
const uid=()=>'i'+Date.now().toString(36)+(n++).toString(36)+Math.random().toString(36).slice(2,5)
const bk=(type,o)=>Object.assign({type,id:uid()},o||{})
const num=v=>({shadow:{type:'math_number',fields:{NUM:v}}})
const link=(...bs)=>{for(let i=0;i<bs.length-1;i++)bs[i].next={block:bs[i+1]};return bs[0]}
const ws=(...tops)=>({blocks:{languageVersion:0,blocks:tops}})
const ent=(o)=>Object.assign({id:uid(),name:'Entity',x:0,y:0,w:48,h:48,rot:0,shape:'rect',color:'#ffffff',image:'',text:'',fontSize:20,z:0,alpha:1,body:'none',gravityScale:1,tags:[],visible:true,prefab:false,script:null},o)
const kinds={
rect:()=>ent({name:'Box',shape:'rect',color:'#7aa2f7'}),
circle:()=>ent({name:'Ball',shape:'circle',color:'#f7768e'}),
sprite:()=>ent({name:'Sprite',shape:'sprite',color:'#ffffff'}),
text:()=>ent({name:'Label',shape:'text',text:'Hello Vue',fontSize:28,w:160,h:40,color:'#ffffff'})
}
const e3=(o)=>ent(Object.assign({shape:'box',x:0,y:0,z:0,w:1,h:1,d:1,rx:0,ry:0,rz:0},o))
const kinds3={
box:()=>e3({name:'Box',color:'#7aa2f7'}),
sphere:()=>e3({name:'Sphere',shape:'sphere',color:'#f7768e'}),
cylinder:()=>e3({name:'Cylinder',shape:'cylinder',color:'#9ece6a'}),
plane:()=>e3({name:'Plane',shape:'plane',w:10,h:1,d:10,color:'#8896b3'}),
light:()=>e3({name:'Light',shape:'light',w:20,color:'#fff4d6',y:5})
}
const blank3=()=>{const p=blank();p.scenes[0].mode='3d';p.scenes[0].name='World';p.scenes[0].bg='#8ec5ff';p.scenes[0].gravity=30;p.scenes[0].mouseLook=true;p.scenes[0].camera3={x:0,y:8,z:14,tx:0,ty:1,tz:0,fov:70};p.scenes[0].entities.push(e3({name:'Ground',w:60,h:1,d:60,y:-0.5,color:'#4f9d69',body:'static'}));return p}
const blank=()=>({name:'My Game',version:1,startScene:'s1',settings:{width:960,height:540,pixelArt:true},assets:{},scenes:[{id:'s1',name:'Level 1',bg:'#1b2340',gravity:1400,camera:{x:0,y:0,zoom:1},entities:[]}]})
const playerCode=`export function start(): void {
vue.vars.score = 0
vue.follow(self)
}

export function update(dt: number): void {
const speed: number = 260
self.vx = 0
if (vue.key("ArrowLeft") || vue.key("a")) self.vx = -speed
if (vue.key("ArrowRight") || vue.key("d")) self.vx = speed
const wantsJump: boolean = vue.pressed("ArrowUp") || vue.pressed("w") || vue.pressed("space")
if (wantsJump && self.grounded) {
self.vy = -620
vue.beep(520, 0.08)
}
vue.hud("Score", vue.vars.score)
if (self.y > 900) vue.go("Level 1")
}
`
function make(){
const p=blank()
p.name='Vue Platformer'
const sc=p.scenes[0]
const coinBlocks=ws(
bk('vue_on_update',{x:20,y:20,inputs:{DO:{block:bk('vue_change_rot',{inputs:{V:num(4)}})}}}),
bk('vue_on_collide',{x:20,y:140,fields:{TAG:'player'},inputs:{DO:{block:link(
bk('vue_change_global',{fields:{N:'score'},inputs:{V:num(1)}}),
bk('vue_beep',{inputs:{F:num(880),D:num(0.1)}}),
bk('vue_burst',{fields:{C:'#ffd34d'},inputs:{N:num(14)}}),
bk('vue_destroy_self')
)}}})
)
const enemyGraph={nid:20,nodes:[
{id:1,type:'update',x:40,y:40,v:{}},
{id:2,type:'setvx',x:300,y:40,v:{}},
{id:3,type:'mul',x:560,y:40,v:{b:120}},
{id:4,type:'func',x:780,y:20,v:{fn:'sin'}},
{id:5,type:'mul',x:1000,y:20,v:{b:1.5}},
{id:6,type:'time',x:1200,y:20,v:{}},
{id:7,type:'collide',x:40,y:300,v:{tag:'player'}},
{id:8,type:'shake',x:300,y:300,v:{amount:8,sec:0.3}},
{id:9,type:'wait',x:560,y:300,v:{sec:0.25}},
{id:10,type:'go',x:780,y:300,v:{scene:'Level 1'}}
],links:[
{a:1,ap:'next',b:2,bp:'in'},
{a:3,ap:'result',b:2,bp:'vx'},
{a:4,ap:'result',b:3,bp:'a'},
{a:5,ap:'result',b:4,bp:'a'},
{a:6,ap:'seconds',b:5,bp:'a'},
{a:7,ap:'next',b:8,bp:'in'},
{a:8,ap:'next',b:9,bp:'in'},
{a:9,ap:'next',b:10,bp:'in'}
]}
sc.entities.push(
ent({name:'Ground',x:0,y:260,w:1800,h:60,color:'#2f6f4f',body:'static',z:-1}),
ent({name:'Platform A',x:-220,y:130,w:200,h:20,color:'#3d8b63',body:'static',z:-1}),
ent({name:'Platform B',x:160,y:30,w:220,h:20,color:'#3d8b63',body:'static',z:-1}),
ent({name:'Platform C',x:520,y:-60,w:200,h:20,color:'#3d8b63',body:'static',z:-1}),
ent({name:'Player',x:-340,y:190,w:36,h:48,color:'#4cc9f0',body:'dynamic',tags:['player'],z:5,script:{mode:'code',code:playerCode,blocks:null,nodes:null}}),
ent({name:'Coin 1',x:-220,y:90,w:22,h:22,shape:'circle',color:'#ffd34d',body:'trigger',tags:['coin'],script:{mode:'blocks',code:'',blocks:coinBlocks,nodes:null}}),
ent({name:'Enemy',x:300,y:210,w:36,h:36,color:'#ef476f',body:'dynamic',tags:['enemy'],z:4,script:{mode:'nodes',code:'',blocks:null,nodes:enemyGraph}}),
ent({name:'Hint',x:-330,y:90,w:420,h:30,shape:'text',text:'Arrows / WASD to move, Space to jump',fontSize:18,color:'#9aa4c4',z:-2})
)
const mk=(name,x,y)=>{const c=JSON.parse(JSON.stringify(sc.entities.find(e=>e.name==='Coin 1')));c.id=uid();c.name=name;c.x=x;c.y=y;return c}
sc.entities.push(mk('Coin 2',160,-10),mk('Coin 3',520,-100),mk('Coin 4',760,200))
return p
}
const player3Code=`export function start(): void {
vue.vars.score = 0
vue.follow(self, 9, 1.6)
vue.camera.pitch = 22
}

export function update(dt: number): void {
const cam = vue.camera
cam.yaw -= vue.mouse.dx * 0.25
cam.pitch = Math.max(-10, Math.min(70, cam.pitch + vue.mouse.dy * 0.2))
if (vue.key("ArrowLeft")) cam.yaw += 120 * dt
if (vue.key("ArrowRight")) cam.yaw -= 120 * dt
let forward: number = 0
let strafe: number = 0
if (vue.key("w") || vue.key("ArrowUp")) forward += 1
if (vue.key("s") || vue.key("ArrowDown")) forward -= 1
if (vue.key("d")) strafe += 1
if (vue.key("a")) strafe -= 1
self.moveLocal(forward * 8, strafe * 8, cam.yaw)
if (vue.pressed("space")) self.jump(13)
self.ry = cam.yaw
vue.hud("Score", vue.vars.score)
if (self.y < -20) vue.go("World")
}
`
function make3(){
const p=blank3()
p.name='Vue 3D Demo'
const sc=p.scenes[0]
const coinBlocks=ws(
bk('vue_on_update',{x:20,y:20,inputs:{DO:{block:bk('vue_rotate3',{fields:{AX:'ry'},inputs:{V:num(4)}})}}}),
bk('vue_on_collide',{x:20,y:140,fields:{TAG:'player'},inputs:{DO:{block:link(
bk('vue_change_global',{fields:{N:'score'},inputs:{V:num(1)}}),
bk('vue_beep',{inputs:{F:num(880),D:num(0.1)}}),
bk('vue_destroy_self')
)}}})
)
const hazardGraph={nid:20,nodes:[
{id:1,type:'update',x:40,y:40,v:{}},
{id:2,type:'setvx',x:300,y:40,v:{}},
{id:3,type:'mul',x:560,y:40,v:{b:4}},
{id:4,type:'func',x:780,y:20,v:{fn:'sin'}},
{id:5,type:'mul',x:1000,y:20,v:{b:1.2}},
{id:6,type:'time',x:1200,y:20,v:{}},
{id:7,type:'collide',x:40,y:300,v:{tag:'player'}},
{id:8,type:'shake',x:300,y:300,v:{amount:8,sec:0.3}},
{id:9,type:'wait',x:560,y:300,v:{sec:0.25}},
{id:10,type:'go',x:780,y:300,v:{scene:'World'}}
],links:[
{a:1,ap:'next',b:2,bp:'in'},
{a:3,ap:'result',b:2,bp:'vx'},
{a:4,ap:'result',b:3,bp:'a'},
{a:5,ap:'result',b:4,bp:'a'},
{a:6,ap:'seconds',b:5,bp:'a'},
{a:7,ap:'next',b:8,bp:'in'},
{a:8,ap:'next',b:9,bp:'in'},
{a:9,ap:'next',b:10,bp:'in'}
]}
const plat=(n,x,y,z)=>e3({name:n,x,y,z,w:5,h:1,d:5,color:'#c9a35b',body:'static'})
const coin=(n,x,y,z)=>e3({name:n,shape:'sphere',x,y,z,w:0.8,h:0.8,d:0.8,color:'#ffd34d',body:'trigger',tags:['coin'],script:{mode:'blocks',code:'',blocks:JSON.parse(JSON.stringify(coinBlocks)),nodes:null}})
sc.entities.push(
plat('Platform A',4,1,-3),plat('Platform B',10,2.5,-8),plat('Platform C',4,4,-13),plat('Platform D',-3,5.5,-17),
e3({name:'Wall',x:0,y:2,z:-30,w:20,h:4,d:2,color:'#8b6f9c',body:'static'}),
e3({name:'Player',x:0,y:1,z:6,w:1,h:2,d:1,color:'#4cc9f0',body:'dynamic',tags:['player'],script:{mode:'code',code:player3Code,blocks:null,nodes:null}}),
coin('Coin 1',4,2.7,-3),coin('Coin 2',10,4.2,-8),coin('Coin 3',4,5.7,-13),coin('Coin 4',-3,7.2,-17),coin('Coin 5',-6,1,0),
e3({name:'Hazard',x:-10,y:0.75,z:-4,w:1.5,h:1.5,d:1.5,color:'#ef476f',body:'dynamic',tags:['enemy'],script:{mode:'nodes',code:'',blocks:null,nodes:hazardGraph}}),
e3({name:'Lamp',shape:'light',x:0,y:12,z:-5,w:60,color:'#fff4d6'})
)
return p
}
const api={make,make3,blank,blank3,ent,kinds,kinds3,uid,playerCode}
if(typeof module!=='undefined'&&module.exports)module.exports=api
else root.VueSample=api
})(typeof window!=='undefined'?window:globalThis)
