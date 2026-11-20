VueExt.register({id:'streaming',name:'World Streaming',ns:'stream',cat:'World',icon:'layers',version:'1.0.0',example:"export function start() {\nvue.stream.radius(1800)\n}\nexport function update(dt: number) {\nvue.hud('Awake', vue.stream.active)\n}",desc:'Keeps huge levels fast by putting far-away entities to sleep. Anything outside the streaming radius stops rendering, colliding and running physics until the camera comes back. Tag an entity "always" to keep it awake.',defaults:{radius:0,interval:0.25,keep:'always'},
api(g,c,s){
s.out=new Set();s.t=0
return{
get active(){return g.entities.filter(e=>e.alive).length-s.out.size},
get sleeping(){return s.out.size},
radius:v=>{c.radius=+v},
wake:()=>{for(const e of s.out)wake(e);s.out.clear()}
}
function wake(e){e._sb=e._sb||{};e.visible=e._sb.v;e.body=e._sb.b;e._str=false}
},
update(g,c,s,dt){
s.t-=dt
if(s.t>0)return
s.t=c.interval
const R=c.radius||(g.is3d?140:Math.max(g.w,g.h)*1.6/(g.camera.zoom||1)),cam=g.camera,f=cam.follow
const cx=f&&f.alive?f.x:g.is3d?cam.tx:cam.x,cy=f&&f.alive?f.y:g.is3d?cam.ty:cam.y,cz=f&&f.alive?f.z:cam.tz
for(const e of g.entities){
if(!e.alive||e.par||e.tiles||e===f||e.tags.indexOf(c.keep)>=0||e.prefab)continue
const far=Math.hypot(e.x-cx,e.y-cy,g.is3d?e.z-cz:0)>R+Math.max(e.w,e.h)
if(far&&!e._str){e._sb={v:e.visible,b:e.body,vx:e.vx,vy:e.vy,vz:e.vz};e._str=true;e.visible=false;e.body='none';s.out.add(e)}
else if(!far&&e._str){e.visible=e._sb.v;e.body=e._sb.b;e.vx=e._sb.vx;e.vy=e._sb.vy;e.vz=e._sb.vz;e._str=false;s.out.delete(e)}
}
for(const e of s.out)if(!e.alive)s.out.delete(e)
},
scene(g,c,s){s.out.clear()}
})
