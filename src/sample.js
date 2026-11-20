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
const api={make,blank,ent,kinds,uid,playerCode}
if(typeof module!=='undefined'&&module.exports)module.exports=api
else root.VueSample=api
})(typeof window!=='undefined'?window:globalThis)
