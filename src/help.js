(function(root){
const BH=root.VueBehaviors||(typeof require!=='undefined'?require('./behaviors.js'):null)
const ERR=[
[/(\w+) is not defined/,m=>'The script uses "'+m[1]+'" but nothing has that name. Check the spelling, or create it first.'],
[/Cannot read propert(?:y|ies) of (?:null|undefined) \(reading '(\w+)'\)/,m=>'The script asked for "'+m[1]+'" of something that is empty. This often means an object name was not found, for example vue.find("Name") with a misspelled name.'],
[/Cannot set propert(?:y|ies) of (?:null|undefined) \(setting '(\w+)'\)/,m=>'The script tried to change "'+m[1]+'" on something that is empty. Check that the object exists before using it.'],
[/(\S+) is not a function/,m=>'The script calls "'+m[1]+'" like an action, but it is not one. Check the spelling after the dot.'],
[/Unexpected token|Unexpected end|missing \)|Invalid or unexpected/,()=>'There is a typing mistake in the code, such as a missing bracket, quote or comma.'],
[/Assignment to constant/,()=>'A value made with const cannot be changed. Use let instead.'],
[/Maximum call stack/,()=>'Something keeps calling itself forever. Check for a loop that never ends.'],
[/prefab|Prefab/,()=>'The prefab name was not found. Make the prefab first, then use the same name.']
]
function plainError(t){
t=String(t)
for(const[re,f]of ERR){const m=re.exec(t);if(m)return f(m)}
return''
}
const TOPICS={
scene:{title:'Scene',text:'A scene is one level or screen. Objects live inside it. Switch between scenes in the Scenes panel.',steps:['Click + in Scenes to add another one.','Use Go to scene in a script to move between them.']},
object:{title:'Object',text:'Everything in your game is an object: the player, a coin, a wall. Select one to change where it is, how it looks and what it does.',steps:['Click an object in the Hierarchy or the scene.','Change Position and Size in the Inspector.','Add behaviors with Add Component.']},
physics:{title:'Physics Body',text:'A body decides how an object takes part in physics. Dynamic objects fall and bump. Static objects stay still, like floors. Triggers only notice touches.',steps:['Floors and walls: Static.','Players and balls: Dynamic.','Coins and zones: Trigger.']},
script:{title:'Script',text:'A script tells an object what to do. Use Blocks to snap steps together, Events for When / If / Do sentences, or Code if you like typing.',steps:['Open the Script tab.','Add an event, then add what should happen.','Press Play to try it.']},
events:{title:'Event sheet',text:'Each row reads like a sentence: When something happens, if some conditions are true, do these actions.',steps:['Add event: pick what starts the row.','Add condition: optional checks.','Add action: what should happen.']},
blocks:{title:'Blocks',text:'Blocks snap together like puzzle pieces. A hat block says when it runs, and the blocks inside say what to do.',steps:['Drag a when block to the workspace.','Drag action blocks inside it.','Press Play.']},
code:{title:'Code',text:'Code is TypeScript. Type vue. to see everything you can do. Errors are explained in plain words.',steps:['Type vue. and pick from the list.','Hover a word to read what it does.','Press Play.']}
}
const hero=(sway)=>({name:'Hero',x:40,y:30,w:24,h:24,color:'#4cc9f0',body:'dynamic',tags:['player'],_script:'on("update",function(){self.vx=Math.sin(vue.time*'+(sway||0.8)+')*90;});'})
const ground=()=>({name:'Ground',x:0,y:78,w:900,h:24,color:'#2f6f4f',body:'static'})
const subject=(type,vals,o)=>Object.assign({name:'Subject',x:-70,y:30,w:24,h:24,color:'#ff9f43',body:'dynamic',beh:[vals||BH.make(type,false)]},o||{})
const EX={
Ball:(t,v)=>[ground(),subject(t,v,{shape:'circle',y:-40,x:0,w:22,h:22})],
EnemyAI:(t,v)=>[ground(),subject(t,v),hero(0.5)],
Health:(t,v)=>[ground(),subject(t,v,{x:0,_script:'on("update",function(){vue.healthBar(self)});'}),{name:'Hazard',x:0,y:62,w:60,h:12,color:'#ef476f',body:'trigger',beh:[Object.assign(BH.make('DamageZone',false),{damage:10})]}],
Pickup:(t,v)=>[ground(),subject(t,v,{body:'trigger',gravityScale:0,x:0,y:50,w:16,h:16,shape:'circle',color:'#ffd34d'}),hero(0.8),{name:'Score',x:200,y:-200,w:1,h:1,_script:'on("update",function(){vue.hud("score",vue.vars.score||0)});'}],
Switch:(t,v)=>[ground(),subject(t,v,{body:'trigger',x:0,y:64,w:50,h:8,color:'#4ade80'}),{name:'Door',x:100,y:30,w:14,h:70,body:'static',color:'#a78bfa',beh:[BH.make('Door',false)]},hero(0.8)],
Door:(t,v)=>[ground(),{name:'Plate',x:0,y:64,w:50,h:8,body:'trigger',color:'#4ade80',beh:[BH.make('Switch',false)]},subject(t,v,{x:100,y:30,w:14,h:70,body:'static',color:'#a78bfa'}),hero(0.8)],
MovingPlatform:(t,v)=>[subject(t,v,{x:-60,y:50,w:70,h:12,body:'static',color:'#3d8b63'}),{name:'Hero',x:-60,y:20,w:20,h:20,color:'#4cc9f0',body:'dynamic',tags:['player']}],
Spawner:(t,v)=>[ground(),subject(t,v,{x:0,y:-50,w:14,h:14,body:'none'}),{name:'Bit',prefab:true,x:0,y:0,w:10,h:10,color:'#ffd34d',body:'dynamic'}],
Projectile:(t,v)=>[ground(),{name:'Gun',x:-100,y:50,w:24,h:24,color:'#ff9f43',body:'static',beh:[Object.assign(BH.make('Weapon',false),{prefab:'Subject',auto:true,rate:0.7,key:'space'})],_script:'on("update",function(){self.rot=0;if(Math.floor(vue.time*1.4)!==self.data.k){self.data.k=Math.floor(vue.time*1.4);vue.shoot(self,{prefab:"Subject",rate:0,offset:20,_s:{ammo:-1}});}});'},Object.assign(subject(t,v,{x:0,y:0,w:10,h:6,body:'trigger',gravityScale:0}),{prefab:true})],
Weapon:(t,v)=>[ground(),subject(t,Object.assign({},v||BH.make(t,false),{prefab:'Bullet',auto:true,rate:0.5,key:''}),{body:'static',x:-100,y:50,_script:'on("update",function(){if(Math.floor(vue.time*2)!==self.data.k){self.data.k=Math.floor(vue.time*2);vue.shoot(self,self.bh[0])}});'}),{name:'Bullet',prefab:true,x:0,y:0,w:10,h:6,color:'#ffd34d',body:'trigger',gravityScale:0,beh:[BH.make('Projectile',false)]}],
Turret:(t,v)=>[ground(),subject(t,Object.assign({},v||BH.make(t,false),{prefab:'Bullet',rate:0.8}),{body:'static',x:-100,y:50}),{name:'Bullet',prefab:true,x:0,y:0,w:10,h:6,color:'#ffd34d',body:'trigger',gravityScale:0,beh:[BH.make('Projectile',false)]},hero(0.7)],
Goal:(t,v)=>[ground(),subject(t,v,{body:'trigger',x:100,y:40,w:30,h:50,color:'#4ade80'}),{name:'Ball',x:-60,y:30,w:18,h:18,shape:'circle',color:'#ffd34d',body:'dynamic',beh:[BH.make('Ball',false)],_script:'on("start",function(){self.vx=90});on("update",function(){vue.hud("blue",vue.scores.blue||0)});'}],
Teleporter:(t,v)=>[ground(),subject(t,v,{body:'trigger',x:-80,y:50,w:20,h:30,color:'#a78bfa',tags:[]}),{name:'Exit',x:90,y:50,w:20,h:30,color:'#4cc9f0',body:'trigger'},hero(0.9)],
Bouncer:(t,v)=>[ground(),subject(t,v,{body:'trigger',x:0,y:64,w:50,h:8,color:'#ff9f43'}),hero(0.6)],
Conveyor:(t,v)=>[subject(t,v,{x:0,y:60,w:160,h:14,body:'static',color:'#6c7cff'}),{name:'Crate',x:-40,y:30,w:18,h:18,body:'dynamic',color:'#ffd34d'}],
DamageZone:(t,v)=>[ground(),subject(t,v,{body:'trigger',x:0,y:62,w:60,h:12,color:'#ef476f'}),{name:'Hero',x:0,y:30,w:24,h:24,color:'#4cc9f0',body:'dynamic',tags:['player'],beh:[BH.make('Health',false)],_script:'on("update",function(){vue.healthBar(self)});'}],
Vehicle:(t,v)=>[subject(t,v,{x:0,y:0,w:36,h:18,gravityScale:0,body:'dynamic',color:'#4cc9f0'})],
Checkpoint:(t,v)=>[ground(),subject(t,v,{body:'trigger',x:0,y:40,w:14,h:50,color:'#4ade80'}),hero(0.7)],
TriggerZone:(t,v)=>[ground(),subject(t,v,{body:'trigger',x:0,y:50,w:60,h:40,color:'#4cc9f0',_script:'on("beh:enter",function(){self.color="#ffd34d";});'}),hero(0.7)],
BoostPad:(t,v)=>[ground(),subject(t,v,{body:'trigger',x:0,y:64,w:50,h:8,color:'#ff9f43'}),hero(0.6)]
}
function miniProject(type,vals){
const ents=(EX[type]||((t,v)=>[ground(),subject(t,v),hero(0.8)]))(type,vals)
const scripts={}
let n=0
const out=ents.map(e=>{
const id='h'+(++n)
const o=Object.assign({id,rot:0,shape:'rect',color:'#ffffff',image:'',text:'',fontSize:20,z:0,alpha:1,body:'none',gravityScale:1,tags:[],visible:true,prefab:false,script:null},e)
if(o._script){scripts[id]=o._script;delete o._script}
if(o.beh)o.beh=JSON.parse(JSON.stringify(o.beh))
return o
})
const project={name:'Example',version:1,startScene:'s1',settings:{width:320,height:180,pixelArt:false,core:'js'},assets:{},scenes:[{id:'s1',name:'Example',bg:'#1b2340',gravity:1400,camera:{x:0,y:0,zoom:1},entities:out}]}
return{project,scripts}
}
const hint=t=>({Vehicle:'Use W A S D or the arrow keys.',Weapon:'Shots fire on their own here.'}[t]||'')
const api={plainError,TOPICS,miniProject,hint,EX}
if(typeof module!=='undefined'&&module.exports)module.exports=api
else root.VueHelp=api
})(typeof window!=='undefined'?window:globalThis);
