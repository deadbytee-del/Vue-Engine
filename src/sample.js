(function(root){
let n=0
const uid=()=>'i'+Date.now().toString(36)+(n++).toString(36)+Math.random().toString(36).slice(2,5)
const bk=(type,o)=>Object.assign({type,id:uid()},o||{})
const num=v=>({shadow:{type:'math_number',fields:{NUM:v}}})
const link=(...bs)=>{for(let i=0;i<bs.length-1;i++)bs[i].next={block:bs[i+1]};return bs[0]}
const ws=(...tops)=>({blocks:{languageVersion:0,blocks:tops}})
const ent=(o)=>Object.assign({id:uid(),name:'Entity',x:0,y:0,w:48,h:48,rot:0,shape:'rect',color:'#ffffff',image:'',text:'',fontSize:20,z:0,alpha:1,body:'none',gravityScale:1,tags:[],visible:true,prefab:false,script:null},o)
const kinds={
tilemap:()=>ent({name:'Tilemap',shape:'tilemap',x:0,y:0,w:32,h:32,cell:32,ts:16,tileset:'',tiles:{},solid:true,z:-1}),
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
bk('vue_on_collide',{x:20,y:200,fields:{TAG:'player'},inputs:{DO:{block:link(
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
bk('vue_on_collide',{x:20,y:200,fields:{TAG:'player'},inputs:{DO:{block:link(
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
const topCode=`export function start(): void {
vue.vars.gems = 0
vue.follow(self)
}

export function update(dt: number): void {
const speed: number = 220
let dx: number = 0
let dy: number = 0
if (vue.key("a") || vue.key("ArrowLeft")) dx -= 1
if (vue.key("d") || vue.key("ArrowRight")) dx += 1
if (vue.key("w") || vue.key("ArrowUp")) dy -= 1
if (vue.key("s") || vue.key("ArrowDown")) dy += 1
const len: number = Math.hypot(dx, dy) || 1
self.vx = dx / len * speed
self.vy = dy / len * speed
if (dx !== 0) self.flipX = dx < 0
vue.hud("Gems", vue.vars.gems + " / 6")
if (vue.vars.gems >= 6) self.say("You win!", 0.1)
}
`
function makeTop(){
const p=blank()
p.name='Gem Dash'
const sc=p.scenes[0]
sc.name='Arena'
sc.bg='#1d1a2b'
sc.gravity=0
const gem=ws(
bk('vue_on_update',{x:20,y:20,inputs:{DO:{block:bk('vue_change_rot',{inputs:{V:num(3)}})}}}),
bk('vue_on_collide',{x:20,y:200,fields:{TAG:'player'},inputs:{DO:{block:link(
bk('vue_change_global',{fields:{N:'gems'},inputs:{V:num(1)}}),
bk('vue_beep',{inputs:{F:num(988),D:num(0.08)}}),
bk('vue_burst',{fields:{C:'#4cc9f0'},inputs:{N:num(16)}}),
bk('vue_destroy_self')
)}}})
)
const chase={nid:30,nodes:[
{id:1,type:'update',x:40,y:40,v:{}},
{id:2,type:'setvel',x:300,y:40,v:{}},
{id:3,type:'mul',x:560,y:20,v:{b:90}},
{id:4,type:'func',x:780,y:20,v:{fn:'sign'}},
{id:5,type:'sub',x:1000,y:20,v:{}},
{id:6,type:'getprop',x:1220,y:-20,v:{prop:'x'}},
{id:7,type:'find',x:1440,y:20,v:{name:'Hero'}},
{id:8,type:'getprop',x:1220,y:110,v:{prop:'x'}},
{id:9,type:'mul',x:560,y:220,v:{b:90}},
{id:10,type:'func',x:780,y:220,v:{fn:'sign'}},
{id:11,type:'sub',x:1000,y:220,v:{}},
{id:12,type:'getprop',x:1220,y:220,v:{prop:'y'}},
{id:13,type:'getprop',x:1220,y:330,v:{prop:'y'}},
{id:14,type:'collide',x:40,y:420,v:{tag:'player'}},
{id:15,type:'shake',x:300,y:420,v:{amount:10,sec:0.3}},
{id:16,type:'wait',x:560,y:420,v:{sec:0.3}},
{id:17,type:'go',x:780,y:420,v:{scene:'Arena'}}
],links:[
{a:1,ap:'next',b:2,bp:'in'},
{a:3,ap:'result',b:2,bp:'vx'},{a:4,ap:'result',b:3,bp:'a'},{a:5,ap:'result',b:4,bp:'a'},{a:6,ap:'value',b:5,bp:'a'},{a:7,ap:'entity',b:6,bp:'entity'},{a:8,ap:'value',b:5,bp:'b'},
{a:9,ap:'result',b:2,bp:'vy'},{a:10,ap:'result',b:9,bp:'a'},{a:11,ap:'result',b:10,bp:'a'},{a:12,ap:'value',b:11,bp:'a'},{a:7,ap:'entity',b:12,bp:'entity'},{a:13,ap:'value',b:11,bp:'b'},
{a:14,ap:'next',b:15,bp:'in'},{a:15,ap:'next',b:16,bp:'in'},{a:16,ap:'next',b:17,bp:'in'}
]}
const wall=(n,x,y,w,h)=>ent({name:n,x,y,w,h,color:'#3b3355',body:'static',z:-1})
sc.entities.push(
ent({name:'Floor',x:0,y:0,w:1200,h:800,color:'#25213a',z:-5}),
wall('Wall N',0,-416,1232,32),wall('Wall S',0,416,1232,32),wall('Wall W',-616,0,32,800),wall('Wall E',616,0,32,800),
wall('Pillar 1',-240,-120,80,80),wall('Pillar 2',240,120,80,80),wall('Pillar 3',240,-200,80,80),wall('Pillar 4',-240,200,80,80),
ent({name:'Hero',x:0,y:0,w:32,h:32,shape:'circle',color:'#7bf1a8',body:'dynamic',gravityScale:0,tags:['player'],z:5,script:{mode:'code',code:topCode,blocks:null,nodes:null}}),
ent({name:'Chaser',x:-480,y:-300,w:34,h:34,color:'#ff4d6a',body:'dynamic',gravityScale:0,tags:['enemy'],z:4,script:{mode:'nodes',code:'',blocks:null,nodes:chase}})
)
const pts=[[-460,-320],[460,-320],[-460,320],[460,320],[0,-300],[0,300]]
pts.forEach((q,i)=>sc.entities.push(ent({name:'Gem '+(i+1),x:q[0],y:q[1],w:22,h:22,color:'#4cc9f0',body:'trigger',tags:['gem'],rot:45,script:{mode:'blocks',code:'',blocks:JSON.parse(JSON.stringify(gem)),nodes:null}})))
return p
}
function wav(notes,len,wave){
const sr=22050,n=Math.floor(sr*len),data=new Uint8Array(44+n)
const w=(o,str)=>{for(let i=0;i<str.length;i++)data[o+i]=str.charCodeAt(i)}
const u32=(o,v)=>{data[o]=v&255;data[o+1]=v>>8&255;data[o+2]=v>>16&255;data[o+3]=v>>24&255}
const u16=(o,v)=>{data[o]=v&255;data[o+1]=v>>8&255}
w(0,'RIFF');u32(4,36+n);w(8,'WAVE');w(12,'fmt ');u32(16,16);u16(20,1);u16(22,1);u32(24,sr);u32(28,sr);u16(32,1);u16(34,8);w(36,'data');u32(40,n)
const seg=n/notes.length
for(let i=0;i<n;i++){
const f=notes[Math.min(notes.length-1,Math.floor(i/seg))],t=i/sr,env=Math.pow(1-i/n,1.6)
const ph=(t*f)%1,v=wave==='sine'?Math.sin(ph*Math.PI*2):ph<0.5?1:-1
data[44+i]=128+Math.round(v*env*90)
}
let b=''
for(let i=0;i<data.length;i++)b+=String.fromCharCode(data[i])
return'data:audio/wav;base64,'+(typeof btoa!=='undefined'?btoa(b):Buffer.from(data).toString('base64'))
}
const heroCode=`export function start(): void {
vue.vars.coins = 0
vue.follow(self)
}

export function update(dt: number): void {
let dir: number = 0
if (vue.key("a") || vue.key("ArrowLeft")) dir -= 1
if (vue.key("d") || vue.key("ArrowRight")) dir += 1
self.vx = dir * 240
if (dir !== 0) {
self.flipX = dir < 0
self.play("walk")
} else {
self.play("idle")
}
const jump: boolean = vue.pressed("space") || vue.pressed("w") || vue.pressed("ArrowUp")
if (jump && self.grounded) {
self.vy = -660
vue.play("jump.wav", 0.5)
}
vue.hud("Coins", vue.vars.coins + " / 5")
if (vue.vars.coins >= 5 && !self.data.won) {
self.data.won = true
vue.cutscene("Victory")
}
if (self.y > 900) vue.restart()
}
`
function makeKit(){
const p=blank()
p.name='Adventure Kit'
const sc=p.scenes[0]
sc.name='Meadow'
sc.bg='#7ec8f5'
sc.cutscene='Intro'
p.assets['coin.wav']={type:'audio',data:wav([988,1319],0.18)}
p.assets['jump.wav']={type:'audio',data:wav([392,523,659],0.16,'sine')}
const V=typeof window!=='undefined'&&window.VuePanels
if(V){p.assets['tiles.png']={type:'image',data:V.defaultTileset()};p.assets['hero_sheet.png']={type:'image',data:V.sampleSheet()}}
const tiles={}
for(let x=-14;x<=30;x++){tiles[x+',4']=0;for(let y=5;y<=7;y++)tiles[x+','+y]=y===7?2:1}
for(let x=-3;x<=1;x++)tiles[x+',1']=4
for(let x=5;x<=9;x++)tiles[x+',-1']=4
for(let x=13;x<=16;x++)tiles[x+',-3']=3
for(let y=-6;y<=3;y++){tiles['-15,'+y]=2;tiles['31,'+y]=2}
for(let x=20;x<=23;x++)tiles[x+',4']=5
const coinBlocks=ws(
bk('vue_on_update',{x:20,y:20,inputs:{DO:{block:bk('vue_change_rot',{inputs:{V:num(3)}})}}}),
bk('vue_on_collide',{x:20,y:200,fields:{TAG:'player'},inputs:{DO:{block:link(
bk('vue_change_global',{fields:{N:'coins'},inputs:{V:num(1)}}),
bk('vue_play2',{fields:{N:'coin.wav',L:'false'},inputs:{V:num(0.7)}}),
bk('vue_burst',{fields:{C:'#ffd34d'},inputs:{N:num(16)}}),
bk('vue_destroy_self')
)}}})
)
const hero=ent({name:'Hero',x:-240,y:96,w:40,h:40,shape:'sprite',color:'#9d5cff',body:'dynamic',tags:['player'],z:5,anims:{idle:{sheet:'hero_sheet.png',fw:32,fh:32,frames:[0,0,0,1,1,1],fps:4,loop:true},walk:{sheet:'hero_sheet.png',fw:32,fh:32,frames:[0,1,2,3,4,5,6,7],fps:12,loop:true}},anim:'idle',script:{mode:'code',code:heroCode,blocks:null,nodes:null}})
const hat=ent({name:'Hat',parent:hero.id,x:0,y:-24,w:22,h:8,color:'#ff4d6a',z:6})
const plume=ent({name:'Plume',parent:hat.id,x:8,y:-6,w:4,h:8,color:'#ffd34d',z:6})
sc.entities.push(
ent({name:'Ground',shape:'tilemap',x:0,y:0,w:32,h:32,cell:32,ts:16,tileset:'tiles.png',tiles,solid:true,tags:['ground'],z:-1}),
hero,hat,plume,
ent({name:'Sign',x:-240,y:20,w:320,h:30,shape:'text',text:'A/D to walk, Space to jump',fontSize:18,color:'#1d2a4a',z:-2})
)
const spots=[[-30,0],[230,-64],[470,-128],[690,96],[860,96]]
spots.forEach((q,i)=>sc.entities.push(ent({name:'Coin '+(i+1),x:q[0],y:q[1],w:20,h:20,shape:'circle',color:'#ffd34d',body:'trigger',tags:['coin'],script:{mode:'blocks',code:'',blocks:JSON.parse(JSON.stringify(coinBlocks)),nodes:null}})))
p.cutscenes=[
{id:uid(),name:'Intro',letterbox:true,lock:true,skippable:true,steps:[
{id:uid(),type:'camera',t:0,dur:0,x:600,y:-40,zoom:0.7},
{id:uid(),type:'caption',t:0.2,dur:2.4,text:'Five coins are hidden in the meadow'},
{id:uid(),type:'camera',t:0.6,dur:2.2,ease:'inout',x:-240,y:60,zoom:1.2},
{id:uid(),type:'say',t:2.9,dur:1.6,target:'Hero',text:'Time to collect them!'},
{id:uid(),type:'sound',t:2.9,dur:0,sound:'jump.wav',vol:0.6}
]},
{id:uid(),name:'Victory',letterbox:true,lock:true,skippable:true,steps:[
{id:uid(),type:'sound',t:0,dur:0,sound:'coin.wav',vol:1},
{id:uid(),type:'caption',t:0,dur:3,text:'All coins collected!'},
{id:uid(),type:'say',t:0.4,dur:2,target:'Hero',text:'Woohoo!'},
{id:uid(),type:'shake',t:0.2,dur:0.4,amount:5}
]}
]
return p
}
const TEMPLATES=[
{id:'kit',name:'Adventure Kit',kind:'2D',desc:'Tilemap level, animated hero, parenting, cutscenes and sound',make:makeKit},
{id:'empty2',name:'Empty 2D',kind:'2D',desc:'A blank 2D scene',make:blank},
{id:'empty3',name:'Empty 3D',kind:'3D',desc:'Ground, light and sky',make:blank3},
{id:'plat',name:'Platformer',kind:'2D',desc:'Jump, collect coins, avoid the enemy',make:make},
{id:'top',name:'Top-down Arena',kind:'2D',desc:'Grab gems while a chaser hunts you',make:makeTop},
{id:'plat3',name:'3D Platformer',kind:'3D',desc:'Third-person controller with mouse look',make:make3}
]
const api={make,make3,makeTop,makeKit,wav,blank,blank3,ent,kinds,kinds3,uid,playerCode,TEMPLATES}
if(typeof module!=='undefined'&&module.exports)module.exports=api
else root.VueSample=api
})(typeof window!=='undefined'?window:globalThis);
