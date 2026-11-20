VueExt.register({id:'crowd',name:'Crowd Simulation',ns:'crowd',cat:'AI',icon:'users',version:'1.0.0',example:"export function start() {\nconst flock = vue.crowd.add('sheep', { speed: 90 })\nvue.crowd.flee(flock, 'Dog', 200)\n}",desc:'Flocking crowds, herds and swarms. Agents keep their distance, move together, flow toward goals and push around obstacles, scaling to thousands with a spatial grid.',defaults:{},
api(g,c,s){
s.gs=new Map()
const ent=v=>typeof v==='string'?g.vue.all(v):Array.isArray(v)?v:[v]
return{
add:(tag,o)=>{const k=typeof tag==='string'?tag:'_'+Math.random();s.gs.set(k,Object.assign({tag,list:typeof tag==='string'?null:ent(tag),speed:g.is3d?3:90,radius:g.is3d?0.8:22,sep:1.6,ali:0.6,coh:0.4,goalW:1.2,goal:null,flee:null,fleeR:g.is3d?6:180,wander:0.3},o||{}));return k},
goal:(k,x,y,z)=>{const q=s.gs.get(k);if(q)q.goal=x==null?null:typeof x==='object'?x:{x,y,z}},
flee:(k,from,r)=>{const q=s.gs.get(k);if(q){q.flee=from;if(r)q.fleeR=r}},
set:(k,o)=>{const q=s.gs.get(k);if(q)Object.assign(q,o)},
remove:k=>{s.gs.delete(k)}
}
},
update(g,c,s,dt){
const d3=g.is3d
for(const q of s.gs.values()){
const L=(q.list||g.vue.all(q.tag)).filter(e=>e.alive)
if(!L.length)continue
const R=q.radius,cell=R*2,grid=new Map(),key=(x,y)=>Math.floor(x/cell)*73856093^Math.floor(y/cell)*19349663
for(const e of L){const k=key(e.x,d3?e.z:e.y);let a=grid.get(k);if(!a)grid.set(k,a=[]);a.push(e);if(e._cv==null){e._cv=(Math.random()-0.5)*q.speed;e._cw=(Math.random()-0.5)*q.speed}}
const G=q.goal?(typeof q.goal==='string'?g.vue.find(q.goal):q.goal):null,F=q.flee?(typeof q.flee==='string'?g.vue.find(q.flee):q.flee):null
for(const e of L){
const ex=e.x,ey=d3?e.z:e.y
let sx=0,sy=0,ax=0,ay=0,cx=0,cy=0,n=0
const gx=Math.floor(ex/cell),gy=Math.floor(ey/cell)
for(let i=-1;i<=1;i++)for(let j=-1;j<=1;j++){const a=grid.get((gx+i)*73856093^(gy+j)*19349663);if(!a)continue;for(const o of a){if(o===e)continue;const dx=ex-o.x,dy=ey-(d3?o.z:o.y),d=Math.hypot(dx,dy);if(d>cell||d===0)continue;if(d<R){sx+=dx/d*(R-d)/R;sy+=dy/d*(R-d)/R}ax+=o._cv;ay+=o._cw;cx+=o.x;cy+=d3?o.z:o.y;n++}}
let vx=e._cv,vy=e._cw
if(n){vx+=(sx*q.speed*q.sep+(ax/n-vx)*q.ali+(cx/n-ex)*q.coh)*dt*4;vy+=(sy*q.speed*q.sep+(ay/n-vy)*q.ali+(cy/n-ey)*q.coh)*dt*4}
if(G){const tx=G.x-ex,ty=(d3?(G.z!=null?G.z:G.y):G.y)-ey,d=Math.hypot(tx,ty)||1;vx+=tx/d*q.speed*q.goalW*dt*3;vy+=ty/d*q.speed*q.goalW*dt*3}
if(F){const tx=ex-F.x,ty=ey-(d3?F.z:F.y),d=Math.hypot(tx,ty)||1;if(d<q.fleeR){vx+=tx/d*q.speed*6*dt*(1-d/q.fleeR)*4;vy+=ty/d*q.speed*6*dt*(1-d/q.fleeR)*4}}
vx+=(Math.random()-0.5)*q.speed*q.wander*dt*6;vy+=(Math.random()-0.5)*q.speed*q.wander*dt*6
const m=Math.hypot(vx,vy),mx=q.speed*(F?1.8:1);if(m>mx){vx*=mx/m;vy*=mx/m}
e._cv=vx;e._cw=vy
if(e.body==='dynamic'){e.vx=vx;if(d3)e.vz=vy;else if(e.gravityScale===0||!g.gravity)e.vy=vy}
else{e.x+=vx*dt;if(d3)e.z+=vy*dt;else e.y+=vy*dt}
if(d3)e.ry=Math.atan2(vx,vy)*180/Math.PI;else if(Math.abs(vx)>1)e.flipX=vx<0
}
}
},
scene(g,c,s){s.gs.clear()}
})
