(function(root){
const KEY_LIST=['space','arrowleft','arrowright','arrowup','arrowdown','enter','shift','control','escape','tab'].concat('abcdefghijklmnopqrstuvwxyz'.split(''),'0123456789'.split(''))
const KEYS=KEY_LIST.map(k=>[k==='arrowleft'?'left arrow':k==='arrowright'?'right arrow':k==='arrowup'?'up arrow':k==='arrowdown'?'down arrow':k,k])
const E=n=>({n,t:'exec'})
const P=(n,t,d)=>({n,t,d})
const F=(n,t,d,o)=>({n,t,d,o,f:1})
const PROPS=['x','y','z','vx','vy','vz','w','h','d','rot','rx','ry','rz','alpha','grounded','name','color','text','visible','flipX','gravityScale','animation']
const NUMPROPS=['x','y','vx','vy','w','h','rot','alpha']
const J=JSON.stringify
const defs={
start:{title:'On Start',cat:'Events',ev:()=>'start',args:[],in:[],out:[E('next')]},
update:{title:'On Update',cat:'Events',ev:()=>'update',args:['dt'],in:[],out:[E('next'),P('dt','num')],x:(n,a,p)=>'dt'},
key:{title:'On Key Pressed',cat:'Events',ev:n=>'key:'+((n.v&&n.v.key)||'space'),args:[],in:[F('key','sel','space',KEYS)],out:[E('next')]},
collide:{title:'On Touch',cat:'Events',ev:()=>'collide',args:['other'],pre:(n,a)=>`if(!(${a('tag')}===''||other.hasTag(${a('tag')})))return;\n`,in:[F('tag','str','')],out:[E('next'),P('other','ent')],x:()=>'other'},
click:{title:'On Click',cat:'Events',ev:()=>'click',args:[],in:[],out:[E('next')]},
keyup:{title:'On Key Released',cat:'Events',ev:n=>'keyup:'+((n.v&&n.v.key)||'space'),args:[],in:[F('key','sel','space',KEYS)],out:[E('next')]},
msg:{title:'On Message',cat:'Events',ev:n=>'msg:'+((n.v&&n.v.name)||'go'),args:['data'],in:[F('name','str','go')],out:[E('next'),P('data','any')],x:()=>'data'},
animend:{title:'On Animation End',cat:'Events',ev:()=>'animend',args:[],in:[],out:[E('next')]},
branch:{title:'Branch',cat:'Flow',in:[E('in'),P('cond','bool',false)],out:[E('then'),E('else'),E('next')],c:(n,a,k)=>`if(${a('cond')}){\n${k('then')}}else{\n${k('else')}}\n`},
repeat:{title:'Repeat',cat:'Flow',in:[E('in'),P('count','num',3)],out:[E('body'),E('next'),P('index','num')],c:(n,a,k)=>`for(let i${n.id}=0,c${n.id}=${a('count')};i${n.id}<c${n.id};i${n.id}++){\n${k('body')}await vue.frame();\n}\n`,x:(n)=>'i'+n.id},
forever:{title:'Forever',cat:'Flow',end:1,in:[E('in')],out:[E('body')],c:(n,a,k)=>`while(self.alive){\nawait vue.frame();\n${k('body')}}\n`},
waituntil:{title:'Wait Until',cat:'Flow',in:[E('in'),P('cond','bool',false)],out:[E('next')],c:(n,a)=>`while(!(${a('cond')}))await vue.frame();\n`},
foreach:{title:'For Each With Tag',cat:'Flow',in:[E('in'),F('tag','str','enemy')],out:[E('body'),E('next'),P('item','ent')],c:(n,a,k)=>`for(const it${n.id} of vue.all(${a('tag')})){\n${k('body')}}\n`,x:n=>'it'+n.id},
wait:{title:'Wait',cat:'Flow',in:[E('in'),P('sec','num',1)],out:[E('next')],c:(n,a)=>`await vue.wait(${a('sec')});\n`},
setpos:{title:'Set Position',cat:'Motion',in:[E('in'),P('x','num',0),P('y','num',0)],out:[E('next')],c:(n,a)=>`self.x=${a('x')};self.y=${a('y')};\n`},
move:{title:'Move By',cat:'Motion',in:[E('in'),P('dx','num',0),P('dy','num',0)],out:[E('next')],c:(n,a)=>`self.x+=${a('dx')};self.y+=${a('dy')};\n`},
setpos3:{title:'Set Position 3D',cat:'Motion',in:[E('in'),P('x','num',0),P('y','num',0),P('z','num',0)],out:[E('next')],c:(n,a)=>`self.x=${a('x')};self.y=${a('y')};self.z=${a('z')};\n`},
move3:{title:'Move By 3D',cat:'Motion',in:[E('in'),P('dx','num',0),P('dy','num',0),P('dz','num',0)],out:[E('next')],c:(n,a)=>`self.x+=${a('dx')};self.y+=${a('dy')};self.z+=${a('dz')};\n`},
setvel3:{title:'Set Velocity 3D',cat:'Motion',in:[E('in'),P('vx','num',0),P('vy','num',0),P('vz','num',0)],out:[E('next')],c:(n,a)=>`self.vx=${a('vx')};self.vy=${a('vy')};self.vz=${a('vz')};\n`},
rotate3:{title:'Rotate By 3D',cat:'Motion',in:[E('in'),P('rx','num',0),P('ry','num',0),P('rz','num',0)],out:[E('next')],c:(n,a)=>`self.rx+=${a('rx')};self.ry+=${a('ry')};self.rz+=${a('rz')};\n`},
setvel:{title:'Set Velocity',cat:'Motion',in:[E('in'),P('vx','num',0),P('vy','num',0)],out:[E('next')],c:(n,a)=>`self.vx=${a('vx')};self.vy=${a('vy')};\n`},
setvx:{title:'Set Velocity X',cat:'Motion',in:[E('in'),P('vx','num',0)],out:[E('next')],c:(n,a)=>`self.vx=${a('vx')};\n`},
jump:{title:'Jump',cat:'Motion',in:[E('in'),P('power','num',600)],out:[E('next')],c:(n,a)=>`self.jump(${a('power')});\n`},
glide:{title:'Glide To',cat:'Motion',in:[E('in'),P('x','num',0),P('y','num',0),P('sec','num',1),F('ease','sel','inout',[['smooth','inout'],['linear','linear'],['ease in','in'],['ease out','out'],['overshoot','back'],['bounce','bounce']])],out:[E('next')],c:(n,a)=>`await vue.tween(self,{x:${a('x')},y:${a('y')}},${a('sec')},${a('ease')});\n`},
pointat:{title:'Point At',cat:'Motion',in:[E('in'),P('target','ent','Player')],out:[E('next')],c:(n,a)=>`self.pointAt(${a('target')});\n`},
walk3:{title:'Walk (Camera Relative)',cat:'Motion',in:[E('in'),P('forward','num',0),P('strafe','num',0)],out:[E('next')],c:(n,a)=>`self.moveLocal(${a('forward')},${a('strafe')},vue.camera.yaw);\n`},
setrot:{title:'Set Rotation',cat:'Motion',in:[E('in'),P('deg','num',0)],out:[E('next')],c:(n,a)=>`self.rot=${a('deg')};\n`},
setcolor:{title:'Set Color',cat:'Looks',in:[E('in'),F('color','col','#ff5555')],out:[E('next')],c:(n,a)=>`self.color=${a('color')};\n`},
setsize:{title:'Set Size',cat:'Looks',in:[E('in'),P('w','num',32),P('h','num',32)],out:[E('next')],c:(n,a)=>`self.w=${a('w')};self.h=${a('h')};\n`},
say:{title:'Say',cat:'Looks',in:[E('in'),P('text','str','Hello!'),P('sec','num',2)],out:[E('next')],c:(n,a)=>`self.say(${a('text')},${a('sec')});\n`},
visible:{title:'Set Visible',cat:'Looks',in:[E('in'),P('show','bool',true)],out:[E('next')],c:(n,a)=>`self.visible=!!${a('show')};\n`},
playanim:{title:'Play Animation',cat:'Looks',in:[E('in'),F('name','str','walk')],out:[E('next')],c:(n,a)=>`self.play(${a('name')});\n`},
stopanim:{title:'Stop Animation',cat:'Looks',in:[E('in')],out:[E('next')],c:()=>`self.stopAnim();\n`},
alpha:{title:'Set Opacity',cat:'Looks',in:[E('in'),P('alpha','num',1)],out:[E('next')],c:(n,a)=>`self.alpha=${a('alpha')};\n`},
settext:{title:'Set Text',cat:'Looks',in:[E('in'),P('text','any','')],out:[E('next')],c:(n,a)=>`self.text=String(${a('text')});\n`},
burst:{title:'Particle Burst',cat:'Looks',in:[E('in'),F('color','col','#ffd34d'),P('count','num',14)],out:[E('next')],c:(n,a)=>`vue.burst(self.x,self.y,${a('color')},${a('count')});\n`},
shake:{title:'Camera Shake',cat:'Looks',in:[E('in'),P('amount','num',6),P('sec','num',0.3)],out:[E('next')],c:(n,a)=>`vue.shake(${a('amount')},${a('sec')});\n`},
follow:{title:'Camera Follow Self',cat:'Looks',in:[E('in')],out:[E('next')],c:()=>`vue.follow(self);\n`},
spawn:{title:'Spawn Prefab',cat:'Game',in:[E('in'),P('name','str','Prefab'),P('x','num',0),P('y','num',0),P('z','num',0)],out:[E('next'),P('entity','ent')],c:(n,a)=>`const s${n.id}=vue.spawn(${a('name')},${a('x')},${a('y')},${a('z')});\n`,x:n=>'s'+n.id},
destroy:{title:'Destroy',cat:'Game',in:[E('in'),P('target','ent','self')],out:[E('next')],c:(n,a)=>`{const t=${a('target')};if(t)t.destroy();}\n`},
emit:{title:'Broadcast',cat:'Game',in:[E('in'),F('name','str','go'),P('data','any','')],out:[E('next')],c:(n,a)=>`vue.emit(${a('name')},${a('data')});\n`},
cutscene:{title:'Play Cutscene',cat:'Game',in:[E('in'),F('name','str','Intro'),F('wait','bool',true)],out:[E('next')],c:(n,a)=>(a('wait')==='true'?'await ':'')+`vue.cutscene(${a('name')});\n`},
attach:{title:'Attach To',cat:'Game',in:[E('in'),P('parent','ent','Player')],out:[E('next')],c:(n,a)=>`self.attach(${a('parent')});\n`},
detach:{title:'Detach',cat:'Game',in:[E('in')],out:[E('next')],c:()=>`self.detach();\n`},
settile:{title:'Set Tile',cat:'Game',in:[E('in'),F('map','str','Tilemap'),P('x','num',0),P('y','num',0),P('tile','num',0)],out:[E('next')],c:(n,a)=>`vue.setTile(${a('map')},${a('x')},${a('y')},${a('tile')});\n`},
addtag:{title:'Add Tag',cat:'Game',in:[E('in'),F('tag','str','enemy')],out:[E('next')],c:(n,a)=>`self.addTag(${a('tag')});\n`},
removetag:{title:'Remove Tag',cat:'Game',in:[E('in'),F('tag','str','enemy')],out:[E('next')],c:(n,a)=>`self.removeTag(${a('tag')});\n`},
go:{title:'Go To Scene',cat:'Game',in:[E('in'),P('scene','str','Level 1')],out:[E('next')],c:(n,a)=>`vue.go(${a('scene')});\n`},
hud:{title:'Show On HUD',cat:'Game',in:[E('in'),P('label','str','Score'),P('value','any',0)],out:[E('next')],c:(n,a)=>`vue.hud(${a('label')},${a('value')});\n`},
print:{title:'Print',cat:'Game',in:[E('in'),P('value','any','hello')],out:[E('next')],c:(n,a)=>`vue.log(${a('value')});\n`},
setvar:{title:'Set Global',cat:'Game',in:[E('in'),P('name','str','score'),P('value','any',0)],out:[E('next')],c:(n,a)=>`vue.vars[${a('name')}]=${a('value')};\n`},
changevar:{title:'Change Global',cat:'Game',in:[E('in'),P('name','str','score'),P('by','num',1)],out:[E('next')],c:(n,a)=>`vue.vars[${a('name')}]=(+vue.vars[${a('name')}]||0)+${a('by')};\n`},
setlocal:{title:'Set Local',cat:'Game',in:[E('in'),P('name','str','hp'),P('value','any',0)],out:[E('next')],c:(n,a)=>`self.data[${a('name')}]=${a('value')};\n`},
setprop:{title:'Set Property',cat:'Game',in:[E('in'),P('entity','ent','self'),F('prop','sel','x',PROPS.map(p=>[p,p])),P('value','any',0)],out:[E('next')],c:(n,a)=>`{const t=${a('entity')};if(t)t[${a('prop')}]=${a('value')};}\n`},
beep:{title:'Beep',cat:'Sound',in:[E('in'),P('freq','num',440),P('dur','num',0.15),F('wave','sel','square',[['square','square'],['sine','sine'],['triangle','triangle'],['sawtooth','sawtooth']])],out:[E('next')],c:(n,a)=>`vue.beep(${a('freq')},${a('dur')},${a('wave')});\n`},
play:{title:'Play Sound',cat:'Sound',in:[E('in'),P('name','str','sound.wav'),P('volume','num',1)],out:[E('next')],c:(n,a)=>`vue.play(${a('name')},${a('volume')});\n`},
music:{title:'Play Music',cat:'Sound',in:[E('in'),P('name','str','music.mp3'),P('volume','num',0.6)],out:[E('next')],c:(n,a)=>`vue.music(${a('name')},${a('volume')});\n`},
stopmusic:{title:'Stop Music',cat:'Sound',in:[E('in')],out:[E('next')],c:()=>`vue.stopMusic();\n`},
num:{title:'Number',cat:'Data',in:[F('v','num',0)],out:[P('value','num')],x:(n,a)=>a('v')},
str:{title:'Text',cat:'Data',in:[F('v','str','')],out:[P('value','str')],x:(n,a)=>a('v')},
bool:{title:'Boolean',cat:'Data',in:[F('v','bool',true)],out:[P('value','bool')],x:(n,a)=>a('v')},
add:{title:'Add',cat:'Math',in:[P('a','num',0),P('b','num',0)],out:[P('result','num')],x:(n,a)=>`(${a('a')}+${a('b')})`},
sub:{title:'Subtract',cat:'Math',in:[P('a','num',0),P('b','num',0)],out:[P('result','num')],x:(n,a)=>`(${a('a')}-${a('b')})`},
mul:{title:'Multiply',cat:'Math',in:[P('a','num',0),P('b','num',1)],out:[P('result','num')],x:(n,a)=>`(${a('a')}*${a('b')})`},
div:{title:'Divide',cat:'Math',in:[P('a','num',0),P('b','num',1)],out:[P('result','num')],x:(n,a)=>`(${a('a')}/(${a('b')}||1))`},
mod:{title:'Modulo',cat:'Math',in:[P('a','num',0),P('b','num',2)],out:[P('result','num')],x:(n,a)=>`(${a('a')}%(${a('b')}||1))`},
func:{title:'Math Function',cat:'Math',in:[F('fn','sel','abs',['abs','floor','ceil','round','sin','cos','sqrt','sign'].map(f=>[f,f])),P('a','num',0)],out:[P('result','num')],x:(n,a)=>`Math[${a('fn')}](${a('a')})`},
clamp:{title:'Clamp',cat:'Math',in:[P('v','num',0),P('lo','num',0),P('hi','num',1)],out:[P('result','num')],x:(n,a)=>`Math.min(Math.max(${a('v')},${a('lo')}),${a('hi')})`},
random:{title:'Random',cat:'Math',in:[P('min','num',0),P('max','num',1)],out:[P('value','num')],x:(n,a)=>`vue.random(${a('min')},${a('max')})`},
compare:{title:'Compare',cat:'Logic',in:[P('a','any',0),F('op','sel','==',['==','!=','<','>','<=','>='].map(o=>[o,o])),P('b','any',0)],out:[P('result','bool')],x:(n,a)=>{const o=n.v&&['==','!=','<','>','<=','>='].indexOf(n.v.op)>=0?n.v.op:'==';return `(${a('a')}${o==='=='?'===':o==='!='?'!==':o}${a('b')})`}},
and:{title:'And',cat:'Logic',in:[P('a','bool',false),P('b','bool',false)],out:[P('result','bool')],x:(n,a)=>`(${a('a')}&&${a('b')})`},
or:{title:'Or',cat:'Logic',in:[P('a','bool',false),P('b','bool',false)],out:[P('result','bool')],x:(n,a)=>`(${a('a')}||${a('b')})`},
not:{title:'Not',cat:'Logic',in:[P('a','bool',false)],out:[P('result','bool')],x:(n,a)=>`(!${a('a')})`},
select:{title:'Select',cat:'Logic',in:[P('cond','bool',false),P('a','any',0),P('b','any',0)],out:[P('result','any')],x:(n,a)=>`(${a('cond')}?${a('a')}:${a('b')})`},
join:{title:'Join Text',cat:'Logic',in:[P('a','any',''),P('b','any','')],out:[P('result','str')],x:(n,a)=>`(String(${a('a')})+String(${a('b')}))`},
keydown:{title:'Key Down',cat:'Sensing',in:[F('key','sel','space',KEYS)],out:[P('down','bool')],x:(n,a)=>`vue.key(${a('key')})`},
mouse:{title:'Mouse',cat:'Sensing',in:[],out:[P('x','num'),P('y','num'),P('down','bool')],x:(n,a,p)=>`vue.mouse.${p}`},
mousedown:{title:'Mouse Down',cat:'Sensing',in:[],out:[P('down','bool')],x:()=>'vue.mouse.down'},
keypressed:{title:'Key Just Pressed',cat:'Sensing',in:[F('key','sel','space',KEYS)],out:[P('pressed','bool')],x:(n,a)=>`vue.pressed(${a('key')})`},
nearest:{title:'Nearest With Tag',cat:'Sensing',in:[F('tag','str','enemy')],out:[P('entity','ent')],x:(n,a)=>`vue.nearest(self,${a('tag')})`},
count:{title:'Count With Tag',cat:'Sensing',in:[F('tag','str','enemy')],out:[P('count','num')],x:(n,a)=>`vue.count(${a('tag')})`},
tileat:{title:'Tile At',cat:'Sensing',in:[F('map','str','Tilemap'),P('x','num',0),P('y','num',0)],out:[P('tile','num')],x:(n,a)=>`vue.tileAt(${a('map')},${a('x')},${a('y')})`},
incs:{title:'In Cutscene',cat:'Sensing',in:[],out:[P('active','bool')],x:()=>'vue.inCutscene'},
randint:{title:'Random Integer',cat:'Math',in:[P('min','num',1),P('max','num',6)],out:[P('value','num')],x:(n,a)=>`vue.randomInt(${a('min')},${a('max')})`},
lerp:{title:'Lerp',cat:'Math',in:[P('a','num',0),P('b','num',1),P('t','num',0.5)],out:[P('result','num')],x:(n,a)=>`vue.lerp(${a('a')},${a('b')},${a('t')})`},
time:{title:'Time',cat:'Sensing',in:[],out:[P('seconds','num')],x:()=>'vue.time'},
self:{title:'Self',cat:'Sensing',in:[],out:[P('entity','ent')],x:()=>'self'},
find:{title:'Find Entity',cat:'Sensing',in:[P('name','str','Player')],out:[P('entity','ent')],x:(n,a)=>`vue.find(${a('name')})`},
getprop:{title:'Get Property',cat:'Sensing',in:[P('entity','ent','self'),F('prop','sel','x',PROPS.map(p=>[p,p]))],out:[P('value','any')],x:(n,a)=>`((${a('entity')}||{})[${a('prop')}])`},
touching:{title:'Is Touching',cat:'Sensing',in:[F('tag','str','')],out:[P('result','bool')],x:(n,a)=>`self.touching(${a('tag')})`},
hastag:{title:'Has Tag',cat:'Sensing',in:[P('entity','ent','self'),F('tag','str','')],out:[P('result','bool')],x:(n,a)=>`!!(${a('entity')}&&${a('entity')}.hasTag(${a('tag')}))`},
distance:{title:'Distance To',cat:'Sensing',in:[P('name','str','Player')],out:[P('result','num')],x:(n,a)=>`vue.dist(self,vue.find(${a('name')}))`},
getvar:{title:'Get Global',cat:'Sensing',in:[P('name','str','score')],out:[P('value','any')],x:(n,a)=>`(vue.vars[${a('name')}]??0)`},
getlocal:{title:'Get Local',cat:'Sensing',in:[P('name','str','hp')],out:[P('value','any')],x:(n,a)=>`(self.data[${a('name')}]??0)`}
}
const CAT_COLORS={Events:'#e0457b',Flow:'#f5a524',Motion:'#4d8dff',Looks:'#9d5cff',Game:'#22c3a6',Sound:'#d65ad1',Data:'#8a83a3',Math:'#3ddc84',Logic:'#3ddc84',Sensing:'#38bdf8'}
function literal(p,v){
if(v===undefined||v===null)v=p.d
const t=p.t
if(t==='num')return String(Number(v)||0)
if(t==='bool')return v===true||v==='true'?'true':'false'
if(t==='ent')return typeof v==='string'&&v&&v!=='self'?`vue.find(${J(v)})`:'self'
if(t==='any'){
if(typeof v==='boolean'||typeof v==='number')return String(v)
if(typeof v==='string'&&v.trim()!==''&&!isNaN(Number(v)))return String(Number(v))
if(v==='true')return 'true'
if(v==='false')return 'false'
return J(String(v))
}
return J(String(v))
}
function compileGraph(g,D){
D=D||defs
const nodes=g&&g.nodes||[],links=g&&g.links||[]
const byId=new Map(nodes.map(n=>[n.id,n]))
const to=new Map(),from=new Map()
for(const l of links){to.set(l.b+':'+l.bp,l);from.set(l.a+':'+l.ap,l)}
const argFn=(n,depth)=>{
const d=D[n.type]
return name=>{
const p=d.in.find(q=>q.n===name)
if(!p)return '0'
if(!p.f){
const l=to.get(n.id+':'+name)
if(l){
const s=byId.get(l.a),sd=s&&D[s.type]
if(sd&&sd.x&&depth<48)return sd.x(s,argFn(s,depth+1),l.ap)
}
}
return literal(p,n.v&&n.v[name])
}
}
const chain=(n,port,stack)=>{
const l=from.get(n.id+':'+port)
if(!l)return ''
const t=byId.get(l.b),d=t&&D[t.type]
if(!d||!d.c||stack.indexOf(t.id)>=0||stack.length>120)return ''
stack.push(t.id)
let s=d.c(t,argFn(t,0),o=>chain(t,o,stack))
if(!d.end)s+=chain(t,'next',stack)
stack.pop()
return s
}
let out=''
for(const n of nodes){
const d=D[n.type]
if(!d||!d.ev)continue
const a=argFn(n,0)
const body=(d.pre?d.pre(n,a):'')+chain(n,'next',[n.id])
out+=`on(${J(d.ev(n))},${/\bawait\b/.test(body)?'async ':''}function(${d.args.join(',')}){\n${body}});\n`
}
return out
}
const api={defs,KEYS,KEY_LIST,CAT_COLORS,compileGraph,literal}
if(typeof module!=='undefined'&&module.exports)module.exports=api
else root.VueNodes=api
})(typeof window!=='undefined'?window:globalThis)
