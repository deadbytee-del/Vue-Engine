VueExt.register({id:'navmesh',name:'NavMesh & Pathfinding',ns:'nav',cat:'AI',icon:'route',version:'1.0.0',example:"export function start() {\nvue.every(1, () => vue.nav.go(self, 'Player', 140))\n}",desc:'Builds a walkable navigation grid from your static bodies and solid tiles, then finds smooth A* paths around them. Send any entity to a point or another entity and it steers there, re-planning when the world changes.',defaults:{cell:0,margin:0,agentHeight:1.8,diagonal:true,rebuild:1},
api(g,c,s){
const d3=()=>g.is3d
s.ag=new Map()
const build=()=>{
const cs=c.cell||(d3()?1:32),m=c.margin||(d3()?0.3:6)
let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9
const obs=[]
for(const e of g.entities){if(!e.alive||e.body!=='static')continue;if(d3()&&(e.y+e.h/2<=0.05||e.y-e.h/2>c.agentHeight))continue;const pz=d3()?e.z:e.y,ph=d3()?e.d:e.h;obs.push([e.x-e.w/2-m,pz-ph/2-m,e.x+e.w/2+m,pz+ph/2+m]);x0=Math.min(x0,e.x-e.w/2);x1=Math.max(x1,e.x+e.w/2);y0=Math.min(y0,pz-ph/2);y1=Math.max(y1,pz+ph/2)}
if(!d3())for(const t of g.tms||[]){if(!t.alive||!t.solid)continue;for(const k of t.tiles.keys()){const cx=Math.floor(k/65536)-32768,cy=k%65536-32768,a=t.x+cx*t.cell,b=t.y+cy*t.cell;obs.push([a-m,b-m,a+t.cell+m,b+t.cell+m]);x0=Math.min(x0,a);x1=Math.max(x1,a+t.cell);y0=Math.min(y0,b);y1=Math.max(y1,b+t.cell)}}
for(const e of g.entities)if(e.alive&&e.body!=='static'){const pz=d3()?e.z:e.y;x0=Math.min(x0,e.x);x1=Math.max(x1,e.x);y0=Math.min(y0,pz);y1=Math.max(y1,pz)}
if(x0>x1){x0=-cs*20;x1=cs*20;y0=-cs*20;y1=cs*20}
const pad=cs*6;x0-=pad;y0-=pad;x1+=pad;y1+=pad
const W=Math.min(1024,Math.ceil((x1-x0)/cs)),H=Math.min(1024,Math.ceil((y1-y0)/cs)),grid=new Uint8Array(W*H)
for(const o of obs){const a=Math.max(0,Math.floor((o[0]-x0)/cs)),b=Math.min(W-1,Math.floor((o[2]-x0)/cs)),cc=Math.max(0,Math.floor((o[1]-y0)/cs)),d=Math.min(H-1,Math.floor((o[3]-y0)/cs));for(let x=a;x<=b;x++)for(let y=cc;y<=d;y++)grid[y*W+x]=1}
s.n={x0,y0,cs,W,H,grid,ver:(s.n?s.n.ver:0)+1}
}
const cellOf=(x,y)=>[Math.floor((x-s.n.x0)/s.n.cs),Math.floor((y-s.n.y0)/s.n.cs)]
const ok=(x,y)=>x>=0&&y>=0&&x<s.n.W&&y<s.n.H&&!s.n.grid[y*s.n.W+x]
const los=(a,b)=>{let x=a[0],y=a[1];const dx=Math.abs(b[0]-x),dy=Math.abs(b[1]-y),sx=x<b[0]?1:-1,sy=y<b[1]?1:-1;let e=dx-dy;for(;;){if(!ok(x,y))return false;if(x===b[0]&&y===b[1])return true;const e2=2*e;if(e2>-dy){e-=dy;x+=sx}if(e2<dx){e+=dx;y+=sy}if(e2>-dy&&e2<dx&&(!ok(x-sx,y)||!ok(x,y-sy)))return false}}
const near=(p)=>{if(ok(p[0],p[1]))return p;for(let r=1;r<24;r++)for(let dx=-r;dx<=r;dx++)for(let dy=-r;dy<=r;dy++)if((Math.abs(dx)===r||Math.abs(dy)===r)&&ok(p[0]+dx,p[1]+dy))return[p[0]+dx,p[1]+dy];return null}
const astar=(A,B)=>{
const {W,H}=s.n,N=W*H,gs=s.gs&&s.gs.length===N?s.gs:(s.gs=new Float32Array(N)),from=s.fr&&s.fr.length===N?s.fr:(s.fr=new Int32Array(N)),st=s.st&&s.st.length===N?s.st:(s.st=new Uint32Array(N))
const run=s.run=(s.run||0)+1,hp=[],hf=[]
const push=(i,f)=>{hp.push(i);hf.push(f);let k=hp.length-1;while(k>0){const p=(k-1)>>1;if(hf[p]<=hf[k])break;[hp[p],hp[k]]=[hp[k],hp[p]];[hf[p],hf[k]]=[hf[k],hf[p]];k=p}}
const pop=()=>{const r=hp[0],li=hp.pop(),lf=hf.pop();if(hp.length){hp[0]=li;hf[0]=lf;let k=0;for(;;){const l=k*2+1,rr=l+1;let m=k;if(l<hp.length&&hf[l]<hf[m])m=l;if(rr<hp.length&&hf[rr]<hf[m])m=rr;if(m===k)break;[hp[m],hp[k]]=[hp[k],hp[m]];[hf[m],hf[k]]=[hf[k],hf[m]];k=m}}return r}
const h=(x,y)=>{const dx=Math.abs(x-B[0]),dy=Math.abs(y-B[1]);return c.diagonal?Math.max(dx,dy)+0.4142*Math.min(dx,dy):dx+dy}
const si=A[1]*W+A[0],ti=B[1]*W+B[0]
st[si]=run*2;gs[si]=0;from[si]=-1;push(si,h(A[0],A[1]))
const D=c.diagonal?[[1,0,1],[-1,0,1],[0,1,1],[0,-1,1],[1,1,1.4142],[1,-1,1.4142],[-1,1,1.4142],[-1,-1,1.4142]]:[[1,0,1],[-1,0,1],[0,1,1],[0,-1,1]]
let it=0
while(hp.length&&it++<200000){
const cur=pop();if(cur===ti)break
if(st[cur]===run*2+1)continue
st[cur]=run*2+1
const cx=cur%W,cy=(cur/W)|0
for(const d of D){const nx=cx+d[0],ny=cy+d[1];if(!ok(nx,ny))continue;if(d[2]>1&&(!ok(cx+d[0],cy)||!ok(cx,cy+d[1])))continue;const ni=ny*W+nx;if(st[ni]===run*2+1)continue;const ng=gs[cur]+d[2];if(st[ni]!==run*2||ng<gs[ni]){st[ni]=run*2;gs[ni]=ng;from[ni]=cur;push(ni,ng+h(nx,ny))}}
}
if(st[ti]!==run*2&&st[ti]!==run*2+1)return null
const out=[];for(let i=ti;i>=0;i=from[i])out.push([i%W,(i/W)|0]);out.reverse()
const sm=[out[0]];let k=0
while(k<out.length-1){let j=out.length-1;while(j>k+1&&!los(out[k],out[j]))j--;sm.push(out[j]);k=j}
return sm
}
const path=(a,b)=>{
if(!s.n)build()
a=typeof a==='string'?g.vue.find(a):a;b=typeof b==='string'?g.vue.find(b):b
if(!a||!b)return[]
const ay=d3()?a.z:a.y,by=d3()?(b.z!=null?b.z:b.y):b.y
const A=near(cellOf(a.x,ay)),B=near(cellOf(b.x,by))
if(!A||!B)return[]
const p=astar(A,B)
if(!p)return[]
const cs=s.n.cs
return p.slice(1).map(q=>d3()?{x:s.n.x0+(q[0]+0.5)*cs,z:s.n.y0+(q[1]+0.5)*cs}:{x:s.n.x0+(q[0]+0.5)*cs,y:s.n.y0+(q[1]+0.5)*cs})
}
s.path=path;s.build=build
return{
rebuild:build,
path,
walkable:(x,y)=>{if(!s.n)build();const q=cellOf(x,y);return ok(q[0],q[1])},
go:(e,t,speed,opt)=>{e=typeof e==='string'?g.vue.find(e):e;if(!e)return Promise.resolve(false);const old=s.ag.get(e);if(old)old.done(false);return new Promise(res=>{s.ag.set(e,{t,sp:speed||(d3()?4:160),p:null,ver:-1,re:0,arrive:(opt&&opt.arrive)||(d3()?0.3:8),done:res})})},
stop:e=>{e=typeof e==='string'?g.vue.find(e):e;const a=s.ag.get(e);if(a){a.done(false);s.ag.delete(e);if(e.body==='dynamic'){e.vx=0;if(d3())e.vz=0;else e.vy=0}}},
moving:e=>s.ag.has(typeof e==='string'?g.vue.find(e):e),
get grid(){return s.n}
}
},
update(g,c,s,dt){
if(!s.ag||!s.ag.size)return
const d3=g.is3d
if(g.sDirty||!s.n){s.re=(s.re||0)+dt;if(!s.n||s.re>c.rebuild){s.re=0;s.build()}}
for(const[e,a]of s.ag){
if(!e.alive){s.ag.delete(e);a.done(false);continue}
const T=typeof a.t==='string'?g.vue.find(a.t):a.t
if(!T){s.ag.delete(e);a.done(false);continue}
const tx=T.x,ty=d3?(T.z!=null?T.z:0):T.y,ey=d3?e.z:e.y
a.re-=dt
if(!a.p||a.ver!==s.n.ver||(a.re<=0&&T.alive!==undefined)){a.p=s.path(e,T);a.ver=s.n.ver;a.re=0.5}
if(Math.hypot(tx-e.x,ty-ey)<a.arrive){s.ag.delete(e);if(e.body==='dynamic'){e.vx=0;if(d3)e.vz=0;else e.vy=0}a.done(true);continue}
let w=a.p[0]
while(w&&Math.hypot(w.x-e.x,(d3?w.z:w.y)-ey)<(d3?0.25:6)){a.p.shift();w=a.p[0]}
if(!w)w=d3?{x:tx,z:ty}:{x:tx,y:ty}
const dx=w.x-e.x,dy=(d3?w.z:w.y)-ey,m=Math.hypot(dx,dy)||1,vx=dx/m*a.sp,vy=dy/m*a.sp
if(e.body==='dynamic'){e.vx=vx;if(d3)e.vz=vy;else if(!g.gravity||e.gravityScale===0)e.vy=vy}
else{e.x+=vx*dt;if(d3)e.z+=vy*dt;else e.y+=vy*dt}
if(!d3)e.flipX=vx<0
}
}
})
