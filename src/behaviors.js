(function(root){
const DEG=Math.PI/180
const F=(k,t,d,tip,o,d3,adv)=>({k,t,d,d3:d3===undefined?d:d3,tip,o,adv:!!adv})
const sel=(...a)=>a.map(x=>[x,x])
const DIRS=sel('up','down','left','right','forward','back')
const BEH={}
const def=(name,cat,desc,fields,o)=>{BEH[name]=Object.assign({name,cat,desc,fields},o)}
const alive=e=>e&&e.alive
const dist=(a,b,g)=>g.is3d?Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z):Math.hypot(a.x-b.x,a.y-b.y)
const over=(a,b,g,pad)=>{
pad=pad||0
return Math.abs(a.x-b.x)*2<a.w+b.w+pad&&Math.abs(a.y-b.y)*2<a.h+b.h+pad&&(!g.is3d||Math.abs(a.z-b.z)*2<a.d+b.d+pad)
}
const isWho=(o,w)=>{
if(!w||w==='any')return true
if(o.hasTag(w)||o.name===w)return true
return w==='player'&&!!(o.pc||o._veh)
}
const each=(g,fn)=>{const es=g.entities;for(let i=0;i<es.length;i++){const e=es[i];if(e.alive)fn(e)}}
const near=(g,self,who)=>{
let best=null,bd=1e18
each(g,e=>{if(e===self||!isWho(e,who))return;const d=dist(self,e,g);if(d<bd){bd=d;best=e}})
return best
}
const up=g=>g.is3d?1:-1
const vecOf=(g,dir,e)=>{
if(dir==='up')return g.is3d?[0,1,0]:[0,-1,0]
if(dir==='down')return g.is3d?[0,-1,0]:[0,1,0]
if(dir==='left')return[-1,0,0]
if(dir==='right')return[1,0,0]
if(dir==='forward')return g.is3d?[0,0,-1]:[0,-1,0]
return g.is3d?[0,0,1]:[0,1,0]
}
const facing=(g,e)=>{
if(g.is3d){const a=(e.ry||0)*DEG;return[-Math.sin(a),0,-Math.cos(a)]}
const a=(e.rot||0)*DEG
return[Math.cos(a),Math.sin(a),0]
}
const kick=(g,e,v,s)=>{e.vx=v[0]*s;e.vy=v[1]*s;if(g.is3d)e.vz=v[2]*s}
const hurtE=(g,e,n)=>{if(e._hb||e._pcs)e.hurt(n)}
const hasHp=e=>!!(e._hb||e._pcs)
const rider=(g,p,r)=>{
if(!r.alive||r===p||r.body!=='dynamic')return false
const top=g.is3d?p.y+p.h/2:p.y-p.h/2,bot=g.is3d?r.y-r.h/2:r.y+r.h/2
if(Math.abs(bot-top)>Math.max(4,p.h*0.25+2)*(g.is3d?0.05:1)+(g.is3d?0.15:0))return false
return Math.abs(r.x-p.x)*2<p.w+r.w&&(!g.is3d||Math.abs(r.z-p.z)*2<p.d+r.d)
}
def('Health','Combat','Hit points. Dies at zero.',[
F('max','num',100,'Most health this object can have. Example: 100'),
F('regen','num',0,'Health gained per second. 0 means none.'),
F('regenDelay','num',3,'Seconds without damage before health comes back.',null,3,true),
F('invuln','num',0.5,'Seconds it cannot be hurt again after a hit.'),
F('onDeath','sel','destroy','What happens at zero health.',sel('destroy','respawn','nothing'))
],{init(g,e,b){b._s={hp:b.max,inv:0,since:99};e._hb=b},
upd(g,e,b,dt){const s=b._s;s.inv=Math.max(0,s.inv-dt);s.since+=dt;if(b.regen>0&&s.since>=b.regenDelay&&s.hp<b.max&&s.hp>0)s.hp=Math.min(b.max,s.hp+b.regen*dt)}})
def('EnemyAI','Combat','Patrols, notices a target, chases or flees, and attacks.',[
F('mode','sel','patrol','patrol walks back and forth, chase follows, flee runs away, guard waits.',sel('patrol','chase','flee','guard')),
F('target','str','player','Tag or name of what to notice. Example: player'),
F('speed','num',100,'How fast it moves.',null,3),
F('sight','num',300,'How far away it can see the target.',null,8),
F('attackRange','num',40,'How close it must be to hit.',null,1.5),
F('damage','num',10,'Health taken from the target per hit.'),
F('cooldown','num',1,'Seconds between hits.',null,1,true),
F('patrolDist','num',160,'How far from its start it walks while patrolling.',null,4,true),
F('move','sel','side','side moves left and right only. free moves in every direction (2D).',sel('side','free'),'side',true)
],{init(g,e,b){b._s={x0:e.x,z0:e.z,dir:1,cd:0}},
upd(g,e,b,dt){
const s=b._s
s.cd=Math.max(0,s.cd-dt)
const t=near(g,e,b.target)
const d=t?dist(e,t,g):1e9
const go=(tx,k)=>{
const dx=tx.x-e.x,dz=g.is3d?tx.z-e.z:tx.y-e.y,n=Math.hypot(dx,dz)||1
if(g.is3d){e.vx=dx/n*b.speed*k;e.vz=dz/n*b.speed*k}else{e.vx=Math.sign(dx)*b.speed*k;if(b.move==='free')e.vy=dz/n*b.speed*k}
}
if(t&&d<=b.sight){
if(b.mode==='flee')go(t,-1)
else{
if(d>b.attackRange)go(t,1);else{e.vx=0;if(g.is3d)e.vz=0}
if(d<=b.attackRange&&s.cd<=0){s.cd=b.cooldown;g.fire(e,'beh:attack',t);hurtE(g,t,b.damage)}
}
}else if(b.mode==='patrol'){
e.vx=s.dir*b.speed
if(Math.abs(e.x-s.x0)>b.patrolDist)s.dir=e.x>s.x0?-1:1
}else{e.vx=0;if(g.is3d)e.vz=0}
}})
def('Pickup','Items','Collect it by touching. Gives score, health or an item.',[
F('kind','sel','coin','coin adds to a score, health heals, the others go in the inventory.',sel('coin','health','ammo','key','custom')),
F('amount','num',1,'How much it gives.'),
F('var','str','score','Score variable that coins add to.',null,'score',true),
F('item','str','key','Inventory name for keys and ammo.',null,'key',true),
F('who','str','player','Tag or name that can collect it.',null,'player',true),
F('respawn','num',0,'Seconds until it comes back. 0 means gone for good.',null,0,true)
],{init(g,e,b){b._s={cool:0};if(!e.body||e.body==='none')e.body='trigger'},
upd(g,e,b,dt){
const s=b._s
if(s.cool>0){s.cool-=dt;if(s.cool<=0)e.visible=true;return}
let hit=null
each(g,o=>{if(!hit&&o!==e&&isWho(o,b.who)&&over(e,o,g))hit=o})
if(!hit)return
if(b.kind==='coin')g.vars[b.var]=(+g.vars[b.var]||0)+b.amount
else if(b.kind==='health')hit.heal(b.amount)
else if(b.kind==='ammo'||b.kind==='key')g.vue.give(hit,b.item,b.amount)
g.fire(e,'beh:pickup',hit)
if(b.respawn>0){s.cool=b.respawn;e.visible=false}else e.destroy()
}})
def('Checkpoint','Level',"Remembers where the player was. Dying respawns here.",[
F('who','str','player','Tag or name that triggers it.')
],{upd(g,e,b){each(g,o=>{if(o!==e&&isWho(o,b.who)&&over(e,o,g)){const c=o._cp;if(!c||c[0]!==e.x||c[1]!==e.y){o._cp=[e.x,e.y,e.z];g.fire(e,'beh:checkpoint',o)}}})}})
def('Switch','Level','A pressure plate or button. Opens doors on the same channel.',[
F('channel','str','A','Doors with the same channel open. Example: A'),
F('mode','sel','hold','hold stays on while pressed, toggle flips on each press, once stays on forever.',sel('hold','toggle','once')),
F('who','str','player','Tag or name that can press it.',null,'player',true)
],{init(g,e,b){b._s={on:false,was:false}},
upd(g,e,b){
const s=b._s
let p=false
each(g,o=>{if(!p&&o!==e&&isWho(o,b.who)&&over(e,o,g,g.is3d?0.1:2))p=true})
if(b.mode==='hold')s.on=p
else if(p&&!s.was){s.on=b.mode==='once'?true:!s.on}
s.was=p
g.vue.channel(b.channel,s.on)
}})
def('Door','Level','Slides open when its channel is on, or when a player with the key touches it.',[
F('channel','str','A','Opens when a Switch on this channel is on. Example: A'),
F('needKey','str','','Inventory item that opens it by touch. Leave empty for none.'),
F('dir','sel','up','Which way it slides.',DIRS),
F('dist','num',100,'How far it slides.',null,3),
F('time','num',0.5,'Seconds to open.',null,0.5,true)
],{init(g,e,b){b._s={o:0,p:[e.x,e.y,e.z],open:false,key:false}},
upd(g,e,b,dt){
const s=b._s
if(b.needKey&&!s.key)each(g,o=>{if(!s.key&&o!==e&&o._inv&&o._inv[b.needKey]>0&&over(e,o,g,g.is3d?1:60)){o._inv[b.needKey]--;s.key=true}})
const want=(g.ch&&b.channel&&g.ch[b.channel])||s.key
s.o=Math.max(0,Math.min(1,s.o+(want?1:-1)*dt/Math.max(0.01,b.time)))
if(want&&!s.open){s.open=true;g.fire(e,'beh:open')}
if(!want&&s.o===0)s.open=false
const v=vecOf(g,b.dir)
e.x=s.p[0]+v[0]*b.dist*s.o;e.y=s.p[1]+v[1]*b.dist*s.o;if(g.is3d)e.z=s.p[2]+v[2]*b.dist*s.o
}})
def('MovingPlatform','Level','Moves back and forth and carries what stands on it.',[
F('dx','num',200,'Distance to move sideways.',null,6),
F('dy','num',0,'Distance to move up or down.',null,0),
F('dz','num',0,'Distance to move forward or back (3D).',null,0,true),
F('speed','num',80,'How fast it moves.',null,3),
F('wait','num',0.5,'Seconds to rest at each end.',null,0.5,true),
F('mode','sel','pingpong','pingpong goes there and back, loop jumps back to the start.',sel('pingpong','loop'),'pingpong',true)
],{init(g,e,b){b._s={p:[e.x,e.y,e.z],t:0,dir:1,w:0}},
upd(g,e,b,dt){
const s=b._s
if(s.w>0){s.w-=dt;return}
const len=Math.hypot(b.dx,b.dy,b.dz)||1
s.t+=s.dir*b.speed*dt/len
let end=false
if(s.t>=1){s.t=1;end=true}else if(s.t<=0){s.t=0;end=true}
const nx=s.p[0]+b.dx*s.t,ny=s.p[1]+b.dy*s.t,nz=s.p[2]+b.dz*s.t
const mx=nx-e.x,my=ny-e.y,mz=nz-e.z
each(g,r=>{if(rider(g,e,r)){r.x+=mx;r.y+=my;if(g.is3d)r.z+=mz}})
e.x=nx;e.y=ny;if(g.is3d)e.z=nz
if(end){s.w=b.wait;if(b.mode==='loop')s.t=s.dir>0?0:1;else s.dir=-s.dir}
}})
def('Spawner','Level','Creates copies of a prefab again and again.',[
F('prefab','str','','Name of the prefab to create. Make one from the Hierarchy menu.'),
F('every','num',2,'Seconds between spawns.'),
F('max','num',5,'Most copies alive at once.'),
F('first','num',0,'Seconds before the first spawn.',null,0,true),
F('radius','num',0,'Random spread around the spawner.',null,0,true)
],{init(g,e,b){b._s={t:b.first||0,list:[]}},
upd(g,e,b,dt){
const s=b._s
s.list=s.list.filter(x=>x.alive||x.alive===undefined&&!x.dead)
s.t-=dt
if(s.t>0||!b.prefab||s.list.length>=b.max)return
s.t=Math.max(0.05,b.every)
const r=b.radius,ox=r?(Math.random()*2-1)*r:0,oz=r?(Math.random()*2-1)*r:0
const n=g.spawn(b.prefab,e.x+ox,g.is3d?e.y:e.y+oz,g.is3d?e.z+oz:undefined)
if(n)s.list.push(n)
}})
def('Projectile','Combat','Flies in a straight line, hurts what it hits, then disappears.',[
F('speed','num',400,'How fast it flies.',null,14),
F('life','num',3,'Seconds before it disappears.'),
F('damage','num',10,'Health taken from what it hits.'),
F('dir','sel','facing','Which way it flies. facing uses the way the shooter points.',sel('facing',...DIRS)),
F('hits','str','','Only hurt this tag or name. Empty hurts anything with health.',null,'',true),
F('gravity','num',0,'Pull downward while flying. 0 flies straight.',null,0,true)
],{init(g,e,b){b._s={v:null,t:b.life};e._proj=true;if(!e.body||e.body==='none'||e.body==='dynamic')e.body='trigger'},
upd(g,e,b,dt){
const s=b._s
if(!s.v){const v=b.dir==='facing'?facing(g,e):vecOf(g,b.dir);s.v=[v[0]*b.speed,v[1]*b.speed,v[2]*b.speed]}
s.t-=dt
if(s.t<=0){e.destroy();return}
s.v[1]+=(g.is3d?-1:1)*b.gravity*dt
e.x+=s.v[0]*dt;e.y+=s.v[1]*dt;if(g.is3d)e.z+=s.v[2]*dt
let hit=null
each(g,o=>{if(!hit&&o!==e&&!o._proj&&o!==e._owner&&(b.hits?isWho(o,b.hits):hasHp(o))&&over(e,o,g))hit=o})
if(hit){if(hasHp(hit))hit.hurt(b.damage);g.fire(e,'beh:hit',hit);e.destroy()}
}})
def('Weapon','Combat','Shoots a prefab when you press a key.',[
F('prefab','str','','Name of the projectile prefab to shoot.'),
F('key','str','space','Key that shoots. Example: space'),
F('rate','num',0.25,'Seconds between shots.'),
F('ammo','num',-1,'Shots available. -1 means unlimited.',null,-1,true),
F('offset','num',24,'How far in front of the object the shot starts.',null,1,true),
F('auto','bool',false,'Hold the key to keep shooting.',null,false,true)
],{init(g,e,b){b._s={cd:0,ammo:b.ammo}},
upd(g,e,b,dt){
const s=b._s
s.cd=Math.max(0,s.cd-dt)
if(!b.key)return
if(b.auto?g.vue.key(b.key):g.vue.pressed(b.key))g.vue.shoot(e,b)
}})
def('Turret','Combat','Aims at a target and shoots it.',[
F('prefab','str','','Name of the projectile prefab to shoot.'),
F('target','str','player','Tag or name to aim at.'),
F('range','num',400,'How far it can shoot.',null,12),
F('rate','num',1,'Seconds between shots.'),
F('turn','bool',true,'Rotate to face the target.',null,true,true)
],{init(g,e,b){b._s={cd:0}},
upd(g,e,b,dt){
const s=b._s
s.cd=Math.max(0,s.cd-dt)
const t=near(g,e,b.target)
if(!t||dist(e,t,g)>b.range)return
const a=g.is3d?Math.atan2(-(t.x-e.x),-(t.z-e.z))/DEG:Math.atan2(t.y-e.y,t.x-e.x)/DEG
if(b.turn){if(g.is3d)e.ry=a;else e.rot=a}
if(s.cd<=0&&b.prefab){s.cd=b.rate;g.vue.shoot(e,{prefab:b.prefab,offset:g.is3d?1:24,_s:{ammo:-1},angle:a})}
}})
def('Ball','Sports','A bouncy ball. Add a physics body and it rolls, bounces and gets kicked.',[
F('bounce','num',0.8,'How much speed it keeps after a bounce. 1 never loses speed.'),
F('mass','num',1,'Heavier balls are harder to push.'),
F('drag','num',0.3,'Slows it down over time.',null,0.3,true),
F('maxSpeed','num',900,'Fastest it can go.',null,30,true)
],{init(g,e,b){b._s={lx:0,ly:0,lz:0};e._ball=b;if(!e.body||e.body==='none'||e.body==='static')e.body='dynamic'},
upd(g,e,b,dt){
const s=b._s
const k=Math.max(0,1-b.drag*dt)
e.vx*=k;if(g.is3d)e.vz*=k
let sp=Math.hypot(e.vx,g.is3d?e.vz:0,e.vy)
if(sp>b.maxSpeed){const q=b.maxSpeed/sp;e.vx*=q;e.vy*=q;if(g.is3d)e.vz*=q}
each(g,o=>{
if(o===e||!o._veh||!over(e,o,g,0))return
const dx=e.x-o.x,dz=g.is3d?e.z-o.z:e.y-o.y,n=Math.hypot(dx,dz)||1
const rv=Math.hypot(o.vx,g.is3d?o.vz:o.vy)
const p=(rv*1.1+(g.is3d?4:120))/b.mass
e.vx=dx/n*p;if(g.is3d)e.vz=dz/n*p;else e.vy=dz/n*p
if(g.is3d)e.vy=Math.max(e.vy,p*0.15)
})
s.lx=e.vx;s.ly=e.vy;s.lz=g.is3d?e.vz:0
},
post(g,e,b){
const s=b._s,th=g.is3d?1.5:60
for(const[k,l]of[['vx','lx'],['vy','ly'],['vz','lz']]){
if(k==='vz'&&!g.is3d)continue
const p=s[l],c=e[k]
if(Math.abs(p)>th&&(Math.sign(c)!==Math.sign(p)||Math.abs(c)<Math.abs(p)*0.3))e[k]=-p*b.bounce
}
}})
def('Vehicle','Vehicles','An arcade car. Drive with WASD or the arrow keys, jump, boost and drift.',[
F('accel','num',500,'How quickly it speeds up.',null,22),
F('maxSpeed','num',600,'Top speed on the ground.',null,26),
F('steer','num',110,'How fast it turns, in degrees per second.'),
F('grip','num',6,'How well tyres hold. Lower slides more.',null,6),
F('jump','num',500,'Jump strength. 0 turns jumping off.',null,9),
F('boostMax','num',100,'Size of the boost tank. 0 turns boost off.'),
F('boostPower','num',2,'How much stronger boost makes the engine.',null,2,true),
F('drift','num',0.15,'Grip left while the handbrake is held. Lower drifts more.',null,0.15,true),
F('flip','bool',true,'Press jump again in the air to flip.',null,true,true),
F('keys','str','w,s,a,d,space,shift,control','Forward, back, left, right, jump, boost and handbrake keys.',null,'w,s,a,d,space,shift,control',true)
],{init(g,e,b){b._s={boost:b.boostMax,jc:0,fl:0,k:b.keys.split(',').map(x=>x.trim())};e._veh=b;if(!e.body||e.body==='none'||e.body==='static')e.body='dynamic'},
upd(g,e,b,dt){
const s=b._s,V=g.vue,k=s.k
let thr=(V.key(k[0])||V.key('arrowup')?1:0)-(V.key(k[1])||V.key('arrowdown')?1:0),st=(V.key(k[3])||V.key('arrowright')?1:0)-(V.key(k[2])||V.key('arrowleft')?1:0)
const gp=root.navigator&&navigator.getGamepads?(navigator.getGamepads()||[])[0]:null
let gb=false,gj=false,gh=false
if(gp){const x=gp.axes[0]||0;if(Math.abs(x)>0.2)st=x;if(gp.buttons[7]&&gp.buttons[7].pressed)thr=1;if(gp.buttons[6]&&gp.buttons[6].pressed)thr=-1;gb=!!(gp.buttons[1]&&gp.buttons[1].pressed);gj=!!(gp.buttons[0]&&gp.buttons[0].pressed&&!s.gj);s.gj=!!(gp.buttons[0]&&gp.buttons[0].pressed);gh=!!(gp.buttons[2]&&gp.buttons[2].pressed)}
const bst=(V.key(k[5])||gb)&&s.boost>0&&b.boostMax>0
const hb=V.key(k[6])||gh
const is3=g.is3d
let h=(is3?e.ry:e.rot)||0
const a=h*DEG
const fx=is3?-Math.sin(a):Math.cos(a),fy=is3?-Math.cos(a):Math.sin(a)
const rx=-fy,ry=fx
let vx=e.vx,vy=is3?e.vz:e.vy
let vf=vx*fx+vy*fy,vl=vx*rx+vy*ry
const mult=bst?b.boostPower:1
if(bst){s.boost=Math.max(0,s.boost-b.boostMax*0.33*dt);vf+=b.accel*mult*dt}
else if(thr)vf+=thr*b.accel*dt
else vf*=Math.max(0,1-1.2*dt)
const lim=b.maxSpeed*mult
vf=Math.max(-lim*0.5,Math.min(lim,vf))
vl*=Math.exp(-b.grip*(hb?b.drift:1)*dt)
const grounded=is3?e.grounded:true
if(grounded||!is3){const f=Math.min(1,Math.abs(vf)/(b.maxSpeed*0.15));h+=(is3?-1:1)*st*b.steer*f*dt*(vf<0?-1:1)}
else if(st&&s.fl<=0)e.rz=(e.rz||0)-st*180*dt
const a2=h*DEG
const gx=is3?-Math.sin(a2):Math.cos(a2),gy=is3?-Math.cos(a2):Math.sin(a2)
e.vx=gx*vf+(-gy)*vl
if(is3)e.vz=gy*vf+gx*vl;else e.vy=gy*vf+gx*vl
if(is3)e.ry=h;else e.rot=h
if(is3&&b.jump>0){
const jp=V.pressed(k[4])||gj
if(e.grounded){s.jc=0;s.fl=0;e.rx=0;e.rz=0}
if(jp){
if(e.grounded){e.vy=b.jump;s.jc=1}
else if(s.jc===1&&b.flip){s.jc=2;s.fl=0.5;e.vy=Math.max(e.vy,b.jump*0.5);e.vx+=gx*b.maxSpeed*0.35*(thr>=0?1:-1);e.vz+=gy*b.maxSpeed*0.35*(thr>=0?1:-1)}
}
}
if(s.fl>0){s.fl-=dt;e.rx=(e.rx||0)+720*dt*(thr<0?-1:1);if(s.fl<=0)e.rx=0}
if(b.boostMax>0)g.vue.hud('Boost',Math.round(s.boost))
}})
def('Goal','Sports','Counts a score when the ball enters. Resets the ball.',[
F('team','str','blue','Team that scores here. Example: blue'),
F('who','str','ball','Tag or name that counts. Example: ball'),
F('resetBall','bool',true,'Put the ball back where it started after a goal.',null,true,true),
F('cooldown','num',2,'Seconds before this goal can score again.',null,2,true)
],{init(g,e,b){b._s={cd:0};if(!e.body||e.body==='none')e.body='trigger'},
upd(g,e,b,dt){
const s=b._s
s.cd=Math.max(0,s.cd-dt)
if(s.cd>0)return
each(g,o=>{
if(s.cd>0||o===e||!(isWho(o,b.who)||(b.who==='ball'&&o._ball))||!over(e,o,g))return
s.cd=b.cooldown
g.vue.score(b.team,1)
g.fire(e,'beh:goal',o)
g.fireAll('msg:goal',b.team)
if(b.resetBall&&o._st){o.x=o._st[0];o.y=o._st[1];o.z=o._st[2];o.vx=0;o.vy=0;o.vz=0}
})
}})
def('TriggerZone','Level','Runs an event when something enters it.',[
F('who','str','player','Tag or name that triggers it.'),
F('once','bool',false,'Only trigger one time.')
],{init(g,e,b){b._s={in:new Set(),done:false};if(!e.body||e.body==='none')e.body='trigger'},
upd(g,e,b){
const s=b._s
if(s.done)return
each(g,o=>{if(o===e||!isWho(o,b.who))return;const i=over(e,o,g);if(i&&!s.in.has(o)){s.in.add(o);g.fire(e,'beh:enter',o);if(b.once)s.done=true}else if(!i)s.in.delete(o)})
}})
def('BoostPad','Vehicles','Refills a vehicle boost and gives it a push.',[
F('amount','num',50,'Boost added to the vehicle tank.'),
F('push','num',0,'Extra speed forward in the direction the pad faces.',null,0,true),
F('who','str','player','Tag or name that can use it.',null,'player',true),
F('cooldown','num',4,'Seconds before it works again.',null,4,true)
],{init(g,e,b){b._s={cd:0,vis:e.alpha};if(!e.body||e.body==='none')e.body='trigger'},
upd(g,e,b,dt){
const s=b._s
if(s.cd>0){s.cd-=dt;e.alpha=0.35;if(s.cd<=0)e.alpha=s.vis;return}
each(g,o=>{
if(s.cd>0||o===e||!isWho(o,b.who)||!over(e,o,g))return
if(o._veh)o._veh._s.boost=Math.min(o._veh.boostMax,o._veh._s.boost+b.amount)
if(b.push){const f=facing(g,e);o.vx+=f[0]*b.push;o.vy+=g.is3d?0:f[1]*b.push;if(g.is3d)o.vz+=f[2]*b.push}
s.cd=b.cooldown
})
}})
def('Scoreboard','Game rules','Shows each team score on screen and ends the game at a target score.',[
F('teams','str','blue,red','Team names, separated by commas.'),
F('toWin','num',5,'Score that wins the game. 0 means no limit.'),
F('show','bool',true,'Show the scores on screen.',null,true,true)
],{init(g,e,b){b._s={};for(const t of b.teams.split(',').map(x=>x.trim()).filter(Boolean))g.scores[t]=g.scores[t]||0;g.board=b},
upd(g,e,b){
if(b.show)for(const t in g.scores)g.vue.hud(t,g.scores[t])
if(b.toWin>0&&!b._s.over)for(const t in g.scores)if(g.scores[t]>=b.toWin){b._s.over=true;g.vars.winner=t;g.fire(e,'beh:win',t);g.fireAll('msg:win',t)}
}})
def('MatchTimer','Game rules','A countdown that announces when time is up.',[
F('seconds','num',300,'How long the match lasts.'),
F('overtime','bool',false,'If the score is tied at zero, keep playing until someone scores.',null,false,true),
F('label','str','Time','Name shown on screen.',null,'Time',true)
],{init(g,e,b){b._s={t:b.seconds,done:false,ot:false}},
upd(g,e,b,dt){
const s=b._s
if(s.done)return
if(!s.ot)s.t=Math.max(0,s.t-dt)
const t=Math.ceil(s.t),m=Math.floor(t/60),r=t%60
g.vue.hud(b.label,s.ot?'Overtime':m+':'+(r<10?'0':'')+r)
g.vars.timeLeft=s.t
if(s.t>0&&!s.ot)return
const v=Object.values(g.scores).sort((x,y)=>y-x)
const tied=v.length>1&&v[0]===v[1]
if(b.overtime&&tied){s.ot=true;if(!s.fired){s.fired=true;g.fireAll('msg:overtime')}return}
if(!s.ot||!tied){s.done=true;g.fire(e,'beh:timeup');g.fireAll('msg:timeup')}
}})
def('CameraRig','Game rules','Makes the camera follow something smoothly and shake when it is hurt.',[
F('target','str','player','Tag or name to follow.'),
F('smooth','num',0.12,'How smoothly it follows. Lower is tighter.',null,0.12,true),
F('distance','num',10,'How far behind in 3D.',null,10,true),
F('height','num',3,'How high above in 3D.',null,3,true),
F('shakeOnHurt','bool',true,'Shake the screen when the target loses health.',null,true,true)
],{init(g,e,b){b._s={hp:null,tg:null}},
upd(g,e,b,dt){
const s=b._s
if(!s.tg||!s.tg.alive)s.tg=near(g,e,b.target)
const t=s.tg
if(!t)return
const c=g.camera,k=1-Math.pow(b.smooth,dt*60*0.5)
if(g.is3d){
const a=(t.ry||0)*DEG
c.x+=(t.x+Math.sin(a)*b.distance-c.x)*k
c.y+=(t.y+b.height-c.y)*k
c.z+=(t.z+Math.cos(a)*b.distance-c.z)*k
c.tx=t.x;c.ty=t.y+1;c.tz=t.z
}else{c.x+=(t.x-c.x)*k;c.y+=(t.y-c.y)*k}
const hp=t.hp
if(b.shakeOnHurt&&s.hp!=null&&hp<s.hp)g.vue.shake(g.is3d?0.3:6,0.25)
s.hp=hp
}})
def('Inventory','Items','Holds items the player collects. Keys open doors.',[
F('slots','num',8,'How many different items it can hold.'),
F('show','bool',true,'Show the items on screen.',null,true,true)
],{init(g,e,b){e._inv=e._inv||{}},
upd(g,e,b){if(b.show){const l=Object.keys(e._inv).filter(k=>e._inv[k]>0).map(k=>k+' x'+e._inv[k]).join(', ');g.vue.hud('Items',l||'none')}}})
def('DialogueTrigger','Story','Shows lines of text when the player comes close.',[
F('lines','str','Hello there!|Nice to meet you.','What it says. Separate lines with |'),
F('who','str','player','Tag or name that can talk to it.',null,'player',true),
F('range','num',100,'How close the player must be.',null,3),
F('key','str','','Key to press to talk. Empty talks automatically.',null,'',true),
F('once','bool',true,'Only talk once.',null,true,true)
],{init(g,e,b){b._s={i:-1,t:0,done:false}},
upd(g,e,b,dt){
const s=b._s,L=b.lines.split('|')
if(s.i>=0){s.t-=dt;if(s.t<=0){s.i++;if(s.i>=L.length){s.i=-1;s.done=b.once;g.fire(e,'beh:dialogue');e.sayText='';e.sayT=0}else{e.say(L[s.i],2.4);s.t=2.5}}return}
if(s.done)return
const t=near(g,e,b.who)
if(t&&dist(e,t,g)<=b.range&&(!b.key||g.vue.pressed(b.key))){s.i=0;e.say(L[0],2.4);s.t=2.5}
}})
def('DamageZone','Combat','Hurts anything with health that stands in it.',[
F('damage','num',10,'Health taken per hit.'),
F('interval','num',0.5,'Seconds between hits.',null,0.5,true),
F('who','str','','Only hurt this tag or name. Empty hurts anything with health.',null,'',true)
],{init(g,e,b){b._s={cd:0};if(!e.body||e.body==='none')e.body='trigger'},
upd(g,e,b,dt){
const s=b._s
s.cd-=dt
if(s.cd>0)return
let any=false
each(g,o=>{if(o!==e&&hasHp(o)&&(!b.who||isWho(o,b.who))&&over(e,o,g)){o.hurt(b.damage);any=true}})
if(any)s.cd=b.interval
}})
def('Conveyor','Level','Pushes whatever stands on it.',[
F('speed','num',100,'How fast it carries things.',null,4),
F('dir','sel','right','Which way it carries.',DIRS)
],{upd(g,e,b,dt){const v=vecOf(g,b.dir);each(g,r=>{if(rider(g,e,r)){r.x+=v[0]*b.speed*dt;if(g.is3d)r.z+=v[2]*b.speed*dt}})}})
def('Bouncer','Level','Launches whatever touches it, like a spring or bumper.',[
F('power','num',700,'How hard it launches.',null,14),
F('dir','sel','up','up springs, away pushes from the middle.',sel('up','away')),
F('cooldown','num',0.2,'Seconds before it can launch again.',null,0.2,true)
],{init(g,e,b){b._s={cd:0};if(!e.body||e.body==='none')e.body='trigger'},
upd(g,e,b,dt){
const s=b._s
s.cd-=dt
if(s.cd>0)return
each(g,o=>{
if(o===e||o.body!=='dynamic'||!over(e,o,g))return
s.cd=b.cooldown
if(b.dir==='up'){o.vy=up(g)*b.power;o.grounded=false}
else{const dx=o.x-e.x,dz=g.is3d?o.z-e.z:o.y-e.y,n=Math.hypot(dx,dz)||1;o.vx=dx/n*b.power;if(g.is3d)o.vz=dz/n*b.power;else o.vy=dz/n*b.power}
})
}})
def('Teleporter','Level','Moves whatever touches it to another object.',[
F('target','str','Exit','Name of the object to arrive at.'),
F('who','str','player','Tag or name that can use it.',null,'player',true),
F('cooldown','num',1,'Seconds before it can be used again.',null,1,true)
],{init(g,e,b){b._s={};if(!e.body||e.body==='none')e.body='trigger'},
upd(g,e,b,dt){
const dest=g.vue.find(b.target)
if(!dest)return
each(g,o=>{
if(o===e||o===dest||!isWho(o,b.who)||!over(e,o,g))return
if(o._tp>0)return
o._tp=b.cooldown
o.x=dest.x;o.y=dest.y;if(g.is3d)o.z=dest.z
})
}})
const NAMES=Object.keys(BEH)
function make(type,is3){
const B=BEH[type]
if(!B)return null
const o={type}
for(const f of B.fields)o[f.k]=is3&&f.d3!==undefined?f.d3:f.d
return o
}
function norm(o){
const B=BEH[o&&o.type]
if(!B)return null
const r={type:o.type}
for(const f of B.fields){
let v=o[f.k]
if(v===undefined||v===null)v=f.d
if(f.t==='num')v=Number.isFinite(+v)?+v:f.d
else if(f.t==='bool')v=v===true||v==='true'
else if(f.t==='sel')v=f.o.some(q=>q[0]===v)?v:f.d
else v=String(v)
r[f.k]=v
}
return r
}
function runtime(o){
const r=norm(o)
if(!r)return null
Object.defineProperty(r,'_s',{value:{},writable:true,enumerable:false})
return r
}
const api={BEH,NAMES,make,norm,runtime,isWho,over,dist,near,facing}
if(typeof module!=='undefined'&&module.exports)module.exports=api
else root.VueBehaviors=api
})(typeof window!=='undefined'?window:globalThis);
