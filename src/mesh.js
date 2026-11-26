(function(root){
const K=(a,b)=>a<b?a*4194304+b:b*4194304+a
const ka=k=>Math.floor(k/4194304)
const kb=k=>k%4194304
const sub=(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]]
const add=(a,b)=>[a[0]+b[0],a[1]+b[1],a[2]+b[2]]
const mul=(a,s)=>[a[0]*s,a[1]*s,a[2]*s]
const dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2]
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]]
const len=a=>Math.hypot(a[0],a[1],a[2])
const nrm=a=>{const l=len(a)||1;return[a[0]/l,a[1]/l,a[2]/l]}
const lerp=(a,b,t)=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t]
const mat0=()=>({name:'Material',color:'#b8b8b8',metal:0,rough:0.6,emissive:'#000000'})
const empty=()=>({v:[],f:[],fm:[],mats:[mat0()],smooth:0})
const clone=m=>({v:m.v.map(p=>p.slice()),f:m.f.map(f=>f.slice()),fm:m.fm.slice(),mats:m.mats.map(x=>Object.assign({},x)),smooth:m.smooth||0})
const addFace=(m,f,mi)=>{m.f.push(f);m.fm.push(mi||0);return m.f.length-1}
function tidy(m){
const F=[],M=[],map=new Int32Array(m.f.length).fill(-1)
m.f.forEach((f,i)=>{
const g=[]
for(const a of f)if(!g.length||g[g.length-1]!==a)g.push(a)
while(g.length>1&&g[0]===g[g.length-1])g.pop()
if(g.length>=3&&new Set(g).size===g.length){map[i]=F.length;F.push(g);M.push(m.fm[i])}
})
m.f=F;m.fm=M
return map
}
function compact(m){
const used=new Uint8Array(m.v.length)
for(const f of m.f)for(const i of f)used[i]=1
const map=new Int32Array(m.v.length).fill(-1),nv=[]
for(let i=0;i<m.v.length;i++)if(used[i]){map[i]=nv.length;nv.push(m.v[i])}
m.v=nv
m.f=m.f.map(f=>f.map(i=>map[i]))
return map
}
function fn(m,f){
let x=0,y=0,z=0
const n=f.length
for(let i=0;i<n;i++){const a=m.v[f[i]],b=m.v[f[(i+1)%n]];x+=(a[1]-b[1])*(a[2]+b[2]);y+=(a[2]-b[2])*(a[0]+b[0]);z+=(a[0]-b[0])*(a[1]+b[1])}
const l=Math.hypot(x,y,z)||1
return[x/l,y/l,z/l]
}
function fcenter(m,f){
let x=0,y=0,z=0
for(const i of f){const p=m.v[i];x+=p[0];y+=p[1];z+=p[2]}
return[x/f.length,y/f.length,z/f.length]
}
function farea(m,f){
let x=0,y=0,z=0
const n=f.length
for(let i=0;i<n;i++){const a=m.v[f[i]],b=m.v[f[(i+1)%n]],c=cross(a,b);x+=c[0];y+=c[1];z+=c[2]}
return Math.hypot(x,y,z)/2
}
function tri(m,f){
const n=f.length,v=m.v
if(n===3)return[[f[0],f[1],f[2]]]
if(n===4){
const d1=len(sub(v[f[0]],v[f[2]])),d2=len(sub(v[f[1]],v[f[3]]))
return d1<=d2?[[f[0],f[1],f[2]],[f[0],f[2],f[3]]]:[[f[0],f[1],f[3]],[f[1],f[2],f[3]]]
}
const nm=fn(m,f),ax=Math.abs(nm[0])<0.9?[1,0,0]:[0,1,0],u=nrm(cross(nm,ax)),w=cross(nm,u)
const P=f.map(i=>[dot(v[i],u),dot(v[i],w)])
const idx=f.map((_,i)=>i),out=[]
const cr=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0])
let g=0
while(idx.length>3&&g++<5000){
let cut=false
for(let j=0;j<idx.length;j++){
const a=idx[(j+idx.length-1)%idx.length],b=idx[j],c=idx[(j+1)%idx.length]
if(cr(P[a],P[b],P[c])<=1e-12)continue
let ins=false
for(const q of idx){if(q===a||q===b||q===c)continue;const X=P[q];if(cr(P[a],P[b],X)>=0&&cr(P[b],P[c],X)>=0&&cr(P[c],P[a],X)>=0){ins=true;break}}
if(ins)continue
out.push([f[a],f[b],f[c]]);idx.splice(j,1);cut=true;break
}
if(!cut){out.push([f[idx[0]],f[idx[1]],f[idx[2]]]);idx.splice(1,1)}
}
if(idx.length===3)out.push([f[idx[0]],f[idx[1]],f[idx[2]]])
return out
}
function edgeMap(m){
const e=new Map()
m.f.forEach((f,fi)=>{
for(let i=0;i<f.length;i++){
const a=f[i],b=f[(i+1)%f.length],k=K(a,b)
let o=e.get(k)
if(!o){o={a:Math.min(a,b),b:Math.max(a,b),f:[]};e.set(k,o)}
o.f.push(fi)
}
})
return e
}
function vfaces(m){
const r=Array.from({length:m.v.length},()=>[])
m.f.forEach((f,fi)=>{for(const i of f)r[i].push(fi)})
return r
}
function vnormals(m){
const n=m.v.map(()=>[0,0,0])
m.f.forEach(f=>{
const nm=fn(m,f),a=farea(m,f)
for(const i of f){n[i][0]+=nm[0]*a;n[i][1]+=nm[1]*a;n[i][2]+=nm[2]*a}
})
return n.map(nrm)
}
function check(m){
const d=new Map()
let bad=0
for(const f of m.f)for(let i=0;i<f.length;i++){
const a=f[i],b=f[(i+1)%f.length],k=a+'>'+b
d.set(k,(d.get(k)||0)+1)
}
let open=0
for(const[k,c]of d){
if(c>1)bad++
const[a,b]=k.split('>')
if(!d.has(b+'>'+a))open++
}
let ok=true
for(const f of m.f)for(const i of f)if(!m.v[i])ok=false
return{ok:ok&&bad===0,closed:open===0,open,bad}
}
function xform(m,fnc){for(let i=0;i<m.v.length;i++)m.v[i]=fnc(m.v[i]);return m}
function rot(p,r){
const D=Math.PI/180
let[x,y,z]=p
let c=Math.cos(r[0]*D),s=Math.sin(r[0]*D);[y,z]=[y*c-z*s,y*s+z*c]
c=Math.cos(r[1]*D);s=Math.sin(r[1]*D);[x,z]=[x*c+z*s,-x*s+z*c]
c=Math.cos(r[2]*D);s=Math.sin(r[2]*D);[x,y]=[x*c-y*s,x*s+y*c]
return[x,y,z]
}
function join(a,b){
const o=clone(a),n=o.v.length,mo=o.mats.length
for(const p of b.v)o.v.push(p.slice())
b.f.forEach((f,i)=>{o.f.push(f.map(x=>x+n));o.fm.push(b.fm[i]+mo)})
for(const x of b.mats)o.mats.push(Object.assign({},x))
return o
}
function weld(m,eps){
eps=eps||1e-5
const h=new Map(),map=new Int32Array(m.v.length)
const nv=[]
m.v.forEach((p,i)=>{
const k=Math.round(p[0]/eps)+','+Math.round(p[1]/eps)+','+Math.round(p[2]/eps)
let j=h.get(k)
if(j===undefined){j=nv.length;nv.push(p);h.set(k,j)}
map[i]=j
})
m.v=nv
m.f=m.f.map(f=>f.map(i=>map[i]))
tidy(m)
compact(m)
return map
}
function box(sx,sy,sz){
sx=(sx||1)/2;sy=(sy===undefined?sx*2:sy)/2;sz=(sz===undefined?sx*2:sz)/2
const m=empty()
m.v=[[-sx,-sy,-sz],[sx,-sy,-sz],[sx,sy,-sz],[-sx,sy,-sz],[-sx,-sy,sz],[sx,-sy,sz],[sx,sy,sz],[-sx,sy,sz]]
m.f=[[4,5,6,7],[1,0,3,2],[5,1,2,6],[0,4,7,3],[7,6,2,3],[0,1,5,4]]
m.fm=[0,0,0,0,0,0]
return m
}
function lathe(pr,seg,closed,capB,capT){
const m=empty(),rows=[]
for(const p of pr){
if(p[0]<1e-9)rows.push([m.v.push([0,p[1],0])-1])
else{const r=[];for(let s=0;s<seg;s++){const a=s/seg*Math.PI*2;r.push(m.v.push([p[0]*Math.cos(a),p[1],p[0]*Math.sin(a)])-1)};rows.push(r)}
}
const R=rows.length,E=closed?R:R-1
for(let j=0;j<E;j++){
const A=rows[j],B=rows[(j+1)%R]
for(let s=0;s<seg;s++){
const s1=(s+1)%seg
const a=A[A.length===1?0:s],b=A[A.length===1?0:s1],c=B[B.length===1?0:s1],d=B[B.length===1?0:s]
addFace(m,[a,d,c,b])
}
}
if(capB&&rows[0].length>2)addFace(m,rows[0].slice())
if(capT&&rows[R-1].length>2)addFace(m,rows[R-1].slice().reverse())
tidy(m)
return m
}
function uvsphere(r,seg,rings){
r=r||0.5;seg=seg||16;rings=rings||Math.max(3,seg/2|0)
const pr=[]
for(let j=0;j<=rings;j++){const p=-Math.PI/2+Math.PI*j/rings;pr.push([Math.cos(p)*r,Math.sin(p)*r])}
return lathe(pr,seg,false)
}
function cylinder(r,h,seg,r2){
r=r||0.5;h=h||1;seg=seg||16
return lathe([[r,-h/2],[r2===undefined?r:r2,h/2]],seg,false,true,r2===undefined||r2>1e-9)
}
function cone(r,h,seg){
r=r||0.5;h=h||1
return lathe([[r,-h/2],[0,h/2]],seg||16,false,true,false)
}
function capsule(r,h,seg){
r=r||0.3;h=h||1;seg=seg||16
const k=Math.max(2,seg/4|0),pr=[]
for(let j=0;j<=k;j++){const p=-Math.PI/2+Math.PI/2*j/k;pr.push([Math.cos(p)*r,-h/2+Math.sin(p)*r])}
for(let j=0;j<=k;j++){const p=Math.PI/2*j/k;pr.push([Math.cos(p)*r,h/2+Math.sin(p)*r])}
return lathe(pr,seg,false)
}
function torus(R,r,seg,tseg){
R=R||0.5;r=r||0.15;seg=seg||24;tseg=tseg||12
const pr=[]
for(let i=0;i<tseg;i++){const a=i/tseg*Math.PI*2;pr.push([R+Math.cos(a)*r,Math.sin(a)*r])}
return lathe(pr,seg,true)
}
function grid(nx,ny,sx,sy){
nx=Math.max(1,nx|0);ny=Math.max(1,ny|0);sx=sx||1;sy=sy||sx
const m=empty()
for(let j=0;j<=ny;j++)for(let i=0;i<=nx;i++)m.v.push([(i/nx-0.5)*sx,0,(j/ny-0.5)*sy])
for(let j=0;j<ny;j++)for(let i=0;i<nx;i++){const a=j*(nx+1)+i;addFace(m,[a,a+nx+1,a+nx+2,a+1])}
return m
}
function circle(r,seg){
r=r||0.5;seg=seg||16
const m=empty(),f=[]
for(let s=0;s<seg;s++){const a=s/seg*Math.PI*2;f.push(m.v.push([r*Math.cos(a),0,r*Math.sin(a)])-1)}
addFace(m,f.reverse())
return m
}
function icosphere(r,sub){
r=r||0.5;sub=sub===undefined?2:sub
const t=(1+Math.sqrt(5))/2
let v=[[-1,t,0],[1,t,0],[-1,-t,0],[1,-t,0],[0,-1,t],[0,1,t],[0,-1,-t],[0,1,-t],[t,0,-1],[t,0,1],[-t,0,-1],[-t,0,1]].map(p=>nrm(p))
let f=[[0,11,5],[0,5,1],[0,1,7],[0,7,10],[0,10,11],[1,5,9],[5,11,4],[11,10,2],[10,7,6],[7,1,8],[3,9,4],[3,4,2],[3,2,6],[3,6,8],[3,8,9],[4,9,5],[2,4,11],[6,2,10],[8,6,7],[9,8,1]]
for(let s=0;s<sub;s++){
const c=new Map(),nf=[]
const mid=(a,b)=>{const k=K(a,b);let i=c.get(k);if(i===undefined){i=v.length;v.push(nrm(lerp(v[a],v[b],0.5)));c.set(k,i)}return i}
for(const[a,b,d]of f){const ab=mid(a,b),bd=mid(b,d),da=mid(d,a);nf.push([a,ab,da],[b,bd,ab],[d,da,bd],[ab,bd,da])}
f=nf
}
const m=empty()
m.v=v.map(p=>mul(p,r))
m.f=f
m.fm=f.map(()=>0)
return m
}
function extrudePoly(pr,d){
d=d||1
const m=empty(),n=pr.length
for(const p of pr)m.v.push([p[0],p[1],d/2])
for(const p of pr)m.v.push([p[0],p[1],-d/2])
addFace(m,[...Array(n).keys()])
addFace(m,[...Array(n).keys()].map(i=>i+n).reverse())
for(let i=0;i<n;i++){const j=(i+1)%n;addFace(m,[i,i+n,j+n,j])}
return m
}
function stairs(n,w,h,d){
n=n||5;w=w||1;h=h||1;d=d||1
const pr=[[0,0],[w,0]]
for(let i=n;i>=1;i--)pr.push([w*i/n,h*i/n],[w*(i-1)/n,h*i/n])
const m=extrudePoly(pr,d)
m.v=m.v.map(p=>[p[0]-w/2,p[1]-h/2,p[2]])
return m
}
function wedge(w,h,d){
w=w||1;h=h||1;d=d||1
const m=extrudePoly([[0,0],[w,0],[0,h]],d)
m.v=m.v.map(p=>[p[0]-w/2,p[1]-h/2,p[2]])
return m
}
const PRIMS={
cube:o=>box(o.size||1,o.size||1,o.size||1),
plane:o=>grid(1,1,o.size||2),
grid:o=>grid(o.nx||8,o.ny||8,o.size||2),
circle:o=>circle((o.size||1)/2,o.seg||16),
cylinder:o=>cylinder((o.size||1)/2,o.h||1,o.seg||16),
cone:o=>cone((o.size||1)/2,o.h||1,o.seg||16),
sphere:o=>uvsphere((o.size||1)/2,o.seg||16),
icosphere:o=>icosphere((o.size||1)/2,o.sub===undefined?2:o.sub),
torus:o=>torus((o.size||1)/2,(o.size||1)*0.15,o.seg||24,12),
capsule:o=>capsule((o.size||1)*0.3,o.h||1,o.seg||16),
pyramid:o=>lathe([[(o.size||1)*0.707,-(o.h||1)/2],[0,(o.h||1)/2]],4,false,true,false),
wedge:o=>wedge(o.size||1,o.h||1,o.size||1),
stairs:o=>stairs(o.steps||5,o.size||1,o.h||1,o.size||1)
}
function primitive(kind,o){
if(!PRIMS[kind])throw new Error('Unknown shape: '+kind)
const m=PRIMS[kind](o||{})
tidy(m)
return m
}
function eset(m,faces){
const e=new Set()
for(const fi of faces){const f=m.f[fi];for(let i=0;i<f.length;i++)e.add(K(f[i],f[(i+1)%f.length]))}
return e
}
function fverts(m,faces){const s=new Set();for(const fi of faces)for(const i of m.f[fi])s.add(i);return s}
function everts(es){const s=new Set();for(const k of es){s.add(ka(k));s.add(kb(k))}return s}
function faceNormalsAvg(m,faces){
let x=0,y=0,z=0
for(const fi of faces){const n=fn(m,m.f[fi]),a=farea(m,m.f[fi]);x+=n[0]*a;y+=n[1]*a;z+=n[2]*a}
return nrm([x,y,z])
}
function extrudeFaces(m,faces,dist){
faces=new Set(faces)
const em=edgeMap(m),dup=new Map(),side=[]
const vs=fverts(m,faces)
for(const i of vs)dup.set(i,m.v.push(m.v[i].slice())-1)
const nm=faceNormalsAvg(m,faces)
for(const fi of faces){
const f=m.f[fi]
for(let i=0;i<f.length;i++){
const a=f[i],b=f[(i+1)%f.length],e=em.get(K(a,b))
const out=e.f.filter(x=>!faces.has(x)).length
if(out>0||e.f.length===1)side.push([a,b,fi])
}
}
for(const[a,b,fi]of side)addFace(m,[a,b,dup.get(b),dup.get(a)],m.fm[fi])
const nf=[]
for(const fi of faces){m.f[fi]=m.f[fi].map(i=>dup.get(i));nf.push(fi)}
if(dist)for(const i of dup.values()){const p=m.v[i];m.v[i]=[p[0]+nm[0]*dist,p[1]+nm[1]*dist,p[2]+nm[2]*dist]}
return{f:nf,v:[...dup.values()],n:nm}
}
function extrudeEdges(m,edges,dist){
const dup=new Map(),F=[]
const dir=new Set()
for(const f of m.f)for(let i=0;i<f.length;i++)dir.add(f[i]+'>'+f[(i+1)%f.length])
for(const k of edges)for(const i of[ka(k),kb(k)])if(!dup.has(i))dup.set(i,m.v.push(m.v[i].slice())-1)
const ne=[]
for(const k of edges){
const a=ka(k),b=kb(k)
const q=dir.has(a+'>'+b)?[b,a,dup.get(a),dup.get(b)]:[a,b,dup.get(b),dup.get(a)]
F.push(addFace(m,q))
ne.push(K(dup.get(a),dup.get(b)))
}
let nm=[0,0,0]
for(const fi of F){const n=fn(m,m.f[fi]);nm=add(nm,n)}
nm=nrm(nm)
if(dist)for(const i of dup.values())m.v[i]=add(m.v[i],mul(nm,dist))
return{v:[...dup.values()],e:ne,f:F,n:nm}
}
function insetFaces(m,faces,t,depth){
const nf=[],mv=Math.min(0.95,t||0.2)
for(const fi of [...faces]){
const f=m.f[fi],c=fcenter(m,f),nm=fn(m,f),inner=[]
for(const i of f)inner.push(m.v.push(add(lerp(m.v[i],c,mv),mul(nm,depth||0)))-1)
const n=f.length,mi=m.fm[fi]
for(let i=0;i<n;i++){const j=(i+1)%n;addFace(m,[f[i],f[j],inner[j],inner[i]],mi)}
m.f[fi]=inner
nf.push(fi)
}
return{f:nf}
}
function insetAbs(m,faces,w,depth){
const nf=[]
for(const fi of [...faces]){
const f=m.f[fi],nm=fn(m,f),n=f.length,inner=[]
for(let i=0;i<n;i++){
const p=m.v[f[i]],pa=m.v[f[(i+n-1)%n]],pb=m.v[f[(i+1)%n]]
const ea=nrm(sub(pa,p)),eb=nrm(sub(pb,p))
let bis=add(ea,eb)
if(len(bis)<1e-6)bis=cross(nm,ea)
bis=nrm(bis)
const ang=Math.acos(Math.max(-1,Math.min(1,dot(ea,eb)))),sn=Math.sin(ang/2)||1
const s=Math.min(w/sn,len(sub(fcenter(m,f),p))*0.98)
inner.push(m.v.push(add(add(p,mul(bis,s)),mul(nm,depth||0)))-1)
}
const mi=m.fm[fi]
for(let i=0;i<n;i++){const j=(i+1)%n;addFace(m,[f[i],f[j],inner[j],inner[i]],mi)}
m.f[fi]=inner
nf.push(fi)
}
return{f:nf}
}
function bevel(m,edges,w){
const touch=everts(edges),vf=vfaces(m),split=new Map()
const cen=m.f.map(f=>fcenter(m,f))
const sk=(v,fi)=>v*8388608+fi
for(const v of touch)for(const fi of vf[v]){
const p=m.v[v],d=sub(cen[fi],p),l=len(d)||1
split.set(sk(v,fi),m.v.push(add(p,mul(d,Math.min(w,l*0.45)/l)))-1)
}
const old=m.f.map(f=>f.slice()),em=edgeMap(m)
const get=(v,fi)=>touch.has(v)?split.get(sk(v,fi)):v
const nfl=[]
old.forEach((f,fi)=>{m.f[fi]=f.map(v=>get(v,fi))})
for(const[k,e]of em){
if(!touch.has(e.a)&&!touch.has(e.b))continue
if(e.f.length!==2)continue
const f1=e.f[0],f2=e.f[1],F1=old[f1]
const fw=F1.findIndex((x,i)=>x===e.a&&F1[(i+1)%F1.length]===e.b)>=0
const p=fw?e.a:e.b,q=fw?e.b:e.a
nfl.push(addFace(m,[get(q,f1),get(p,f1),get(p,f2),get(q,f2)],m.fm[f1]))
}
for(const v of touch){
const ring=orderAround(old,vf[v],v)
if(!ring)continue
const cap=ring.map(fi=>split.get(sk(v,fi)))
if(cap.length>=3)nfl.push(addFace(m,cap,m.fm[ring[0]]))
}
tidy(m)
compact(m)
return{f:nfl}
}
function orderAround(faces,list,v){
if(!list.length)return null
const nx=fi=>{const f=faces[fi],i=f.indexOf(v);return[f[(i+f.length-1)%f.length],f[(i+1)%f.length]]}
const out=[list[0]]
let cur=list[0]
for(let g=0;g<list.length;g++){
const pv=nx(cur)[0]
const n=list.find(x=>x!==cur&&nx(x)[1]===pv)
if(n===undefined||n===out[0])break
out.push(n);cur=n
}
return out.length===list.length?out:null
}
function subdivideFaces(m,faces){
faces=faces?[...faces]:m.f.map((_,i)=>i)
const set=new Set(faces),old=m.f.map(f=>f.slice()),mids=new Map(),nf=[]
const mid=(a,b)=>{const k=K(a,b);let i=mids.get(k);if(i===undefined){i=m.v.push(lerp(m.v[a],m.v[b],0.5))-1;mids.set(k,i)}return i}
for(const fi of faces){
const f=old[fi],n=f.length,c=m.v.push(fcenter(m,f))-1,ms=f.map((v,i)=>mid(v,f[(i+1)%n])),mi=m.fm[fi]
for(let i=0;i<n;i++){const q=[f[i],ms[i],c,ms[(i+n-1)%n]];if(i===0){m.f[fi]=q;nf.push(fi)}else nf.push(addFace(m,q,mi))}
}
for(let fi=0;fi<old.length;fi++){
if(set.has(fi))continue
const f=old[fi],g=[]
for(let i=0;i<f.length;i++){g.push(f[i]);const mm=mids.get(K(f[i],f[(i+1)%f.length]));if(mm!==undefined)g.push(mm)}
m.f[fi]=g
}
return{f:nf}
}
function subdivideEdges(m,edges,cuts){
cuts=cuts||1
const pts=new Map(),nv=[]
for(const k of edges){
const a=ka(k),b=kb(k),arr=[]
for(let c=1;c<=cuts;c++)arr.push(m.v.push(lerp(m.v[a],m.v[b],c/(cuts+1)))-1)
pts.set(k,arr);nv.push(...arr)
}
m.f=m.f.map(f=>{
const g=[]
for(let i=0;i<f.length;i++){
const a=f[i],b=f[(i+1)%f.length],k=K(a,b)
g.push(a)
const arr=pts.get(k)
if(arr)g.push(...(a<b?arr:arr.slice().reverse()))
}
return g
})
return{v:nv}
}
function loopRing(m,em,fi,a,b){
const f0=m.f[fi]
if(f0.length!==4)return null
const rot4=(f,x,y)=>{if(f.length!==4)return null;const i=f.findIndex((q,j)=>q===x&&f[(j+1)%4]===y);return i<0?null:[f[i],f[(i+1)%4],f[(i+2)%4],f[(i+3)%4]]}
const start=rot4(f0,a,b)
if(!start)return null
const walk=(q0,s0)=>{
const out=[{fi:s0,q:q0}]
let q=q0,cur=s0
for(let g=0;g<100000;g++){
const e=em.get(K(q[2],q[3]))
if(!e||e.f.length!==2)return{out,closed:false}
const nx=e.f[0]===cur?e.f[1]:e.f[0]
if(nx===s0)return{out,closed:true}
const nq=rot4(m.f[nx],q[3],q[2])
if(!nq)return{out,closed:false}
out.push({fi:nx,q:nq});q=nq;cur=nx
}
return{out,closed:false}
}
let r=walk(start,fi)
if(r.closed)return r.out
const back=walk([start[2],start[3],start[0],start[1]],fi)
const L=back.out[back.out.length-1]
return walk([L.q[2],L.q[3],L.q[0],L.q[1]],L.fi).out
}
function ringEdges(m,fi,a,b){
const em=edgeMap(m),r=loopRing(m,em,fi,a,b)
if(!r)return[]
const s=new Set()
for(const{q}of r){s.add(K(q[0],q[1]));s.add(K(q[2],q[3]))}
return[...s]
}
function loopCut(m,fi,a,b,cuts,t){
cuts=Math.max(1,cuts|0||1);t=t===undefined?0.5:t
const em=edgeMap(m),ring=loopRing(m,em,fi,a,b)
if(!ring)throw new Error('Loop cut works on rings of four-sided faces')
const cache=new Map()
const pts=(u,w)=>{
const k=K(u,w)
let c=cache.get(k)
if(!c){
const lo=Math.min(u,w),hi=Math.max(u,w),arr=[]
for(let i=1;i<=cuts;i++)arr.push(m.v.push(lerp(m.v[lo],m.v[hi],cuts===1?(u===lo?t:1-t):i/(cuts+1)))-1)
c={lo:u===lo?lo:hi,arr};cache.set(k,c)
}
return c.lo===u?c.arr:c.arr.slice().reverse()
}
const nf=[],nv=new Set(),ne=[]
for(const{fi:f,q}of ring){
const A=q[0],B=q[1],C=q[2],D=q[3],P=pts(A,B),Q=pts(D,C)
const faces=[]
let pp=A,pq=D
for(let i=0;i<cuts;i++){faces.push([pp,P[i],Q[i],pq]);pp=P[i];pq=Q[i]}
faces.push([pp,B,C,pq])
const mi=m.fm[f]
m.f[f]=faces[0];nf.push(f)
for(let i=1;i<faces.length;i++)nf.push(addFace(m,faces[i],mi))
for(let i=0;i<cuts;i++){nv.add(P[i]);nv.add(Q[i]);ne.push(K(P[i],Q[i]))}
}
return{v:[...nv],e:[...new Set(ne)],f:nf}
}
function edgeLoop(m,k){
const em=edgeMap(m),adj=new Map()
for(const[key,e]of em){for(const v of[e.a,e.b]){let l=adj.get(v);if(!l){l=[];adj.set(v,l)}l.push(key)}}
const share=(k1,k2)=>{const a=em.get(k1),b=em.get(k2);return a.f.some(x=>b.f.includes(x))}
const out=new Set([k])
const go=(from,key)=>{
let v=from,cur=key
for(let g=0;g<200000;g++){
const l=adj.get(v)
if(!l||l.length!==4)return
const nx=l.find(x=>x!==cur&&!share(x,cur))
if(nx===undefined||out.has(nx))return
out.add(nx)
const e=em.get(nx)
v=e.a===v?e.b:e.a;cur=nx
}
}
const e0=em.get(k)
go(e0.a,k);go(e0.b,k)
return[...out]
}
function linked(m,fi){
const em=edgeMap(m),seen=new Set([fi]),st=[fi]
while(st.length){
const c=st.pop(),f=m.f[c]
for(let i=0;i<f.length;i++){const e=em.get(K(f[i],f[(i+1)%f.length]));for(const g of e.f)if(!seen.has(g)){seen.add(g);st.push(g)}}
}
return[...seen]
}
function growFaces(m,faces){
const vf=vfaces(m),s=new Set(faces)
for(const fi of faces)for(const v of m.f[fi])for(const g of vf[v])s.add(g)
return[...s]
}
function shrinkFaces(m,faces){
const set=new Set(faces),em=edgeMap(m),out=[]
for(const fi of faces){
const f=m.f[fi]
let keep=true
for(let i=0;i<f.length;i++){const e=em.get(K(f[i],f[(i+1)%f.length]));if(e.f.length<2||e.f.some(g=>!set.has(g)))keep=false}
if(keep)out.push(fi)
}
return out
}
function deleteFaces(m,faces){
const s=new Set(faces)
const F=[],M=[]
m.f.forEach((f,i)=>{if(!s.has(i)){F.push(f);M.push(m.fm[i])}})
m.f=F;m.fm=M
return compact(m)
}
function deleteVerts(m,vs){
vs=new Set(vs)
const del=[]
m.f.forEach((f,i)=>{if(f.some(x=>vs.has(x)))del.push(i)})
const F=new Set(del),keep=[],M=[]
m.f.forEach((f,i)=>{if(!F.has(i)){keep.push(f);M.push(m.fm[i])}})
m.f=keep;m.fm=M
return compact(m)
}
function deleteEdges(m,es){
const s=new Set(),em=edgeMap(m)
for(const k of es){const e=em.get(k);if(e)for(const f of e.f)s.add(f)}
return deleteFaces(m,s)
}
function dissolveEdges(m,es){
dissolveEdgesRaw(m,es)
tidy(m)
return compact(m)
}
function dissolveVerts(m,vs){
for(const v of vs){
const es=new Set()
for(const f of m.f){const i=f.indexOf(v);if(i>=0){es.add(K(v,f[(i+1)%f.length]));es.add(K(v,f[(i+f.length-1)%f.length]))}}
const em=edgeMap(m),inner=[...es].filter(k=>em.get(k)&&em.get(k).f.length===2)
dissolveEdgesRaw(m,inner)
m.f=m.f.map(f=>f.filter(x=>x!==v))
}
tidy(m)
return compact(m)
}
function dissolveEdgesRaw(m,es){
const keep=m.v.length
for(const k of es){
const a=ka(k),b=kb(k),fs=[]
m.f.forEach((f,i)=>{if(f&&f.includes(a)&&f.includes(b))fs.push(i)})
if(fs.length!==2)continue
const[x,y]=fs,A=m.f[x],B=m.f[y]
let i=A.findIndex((q,j)=>q===a&&A[(j+1)%A.length]===b),p=a,q=b
if(i<0){i=A.findIndex((q2,j)=>q2===b&&A[(j+1)%A.length]===a);p=b;q=a}
if(i<0)continue
const j=B.findIndex((z,jj)=>z===q&&B[(jj+1)%B.length]===p)
if(j<0)continue
const out=[]
for(let t=0;t<A.length-1;t++)out.push(A[(i+1+t)%A.length])
for(let t=0;t<B.length-2;t++)out.push(B[(j+2+t)%B.length])
m.f[x]=out;m.f[y]=null
}
const F=[],M=[]
m.f.forEach((f,i)=>{if(f){F.push(f);M.push(m.fm[i])}})
m.f=F;m.fm=M
}
function mergeVerts(m,vs,mode){
vs=[...vs]
if(vs.length<2)return null
let p
if(mode==='first')p=m.v[vs[0]].slice()
else if(mode==='last')p=m.v[vs[vs.length-1]].slice()
else{p=[0,0,0];for(const i of vs)p=add(p,m.v[i]);p=mul(p,1/vs.length)}
const t=vs[0],s=new Set(vs)
m.v[t]=p
m.f=m.f.map(f=>f.map(i=>s.has(i)?t:i))
const fm=tidy(m)
const map=compact(m)
return{v:[map[t]]}
}
function flip(m,faces){
const s=faces?new Set(faces):null
m.f=m.f.map((f,i)=>!s||s.has(i)?f.slice().reverse():f)
}
function volume(m){
let v=0
for(const f of m.f)for(const t of tri(m,f)){const a=m.v[t[0]],b=m.v[t[1]],c=m.v[t[2]];v+=dot(a,cross(b,c))/6}
return v
}
function recalc(m){
const em=edgeMap(m),seen=new Uint8Array(m.f.length)
for(let s=0;s<m.f.length;s++){
if(seen[s])continue
seen[s]=1
const st=[s],comp=[s]
while(st.length){
const c=st.pop(),f=m.f[c]
for(let i=0;i<f.length;i++){
const a=f[i],b=f[(i+1)%f.length],e=em.get(K(a,b))
for(const g of e.f){
if(seen[g])continue
const G=m.f[g],j=G.findIndex((x,jj)=>x===a&&G[(jj+1)%G.length]===b)
if(j>=0)m.f[g]=G.slice().reverse()
seen[g]=1;st.push(g);comp.push(g)
}
}
}
const sub2={v:m.v,f:comp.map(i=>m.f[i])}
if(volume(sub2)<0)for(const i of comp)m.f[i]=m.f[i].slice().reverse()
}
}
function orderLoop(es){
const adj=new Map()
for(const k of es){
const a=ka(k),b=kb(k)
if(!adj.has(a))adj.set(a,[]);if(!adj.has(b))adj.set(b,[])
adj.get(a).push(b);adj.get(b).push(a)
}
const used=new Set(),loops=[]
for(const[s]of adj){
if(used.has(s))continue
const l=[s];used.add(s)
let cur=s
for(let g=0;g<100000;g++){
const nx=adj.get(cur).find(x=>!used.has(x))
if(nx===undefined)break
l.push(nx);used.add(nx);cur=nx
}
loops.push(l)
}
return loops
}
function fill(m,es){
const loops=orderLoop(es)
if(!loops.length||loops[0].length<3)throw new Error('Select a closed ring of edges to fill')
const l=loops[0],f=l.slice()
const c=fcenter(m,f)
let mc=[0,0,0];for(const p of m.v)mc=add(mc,p);mc=mul(mc,1/Math.max(1,m.v.length))
const nm=fn(m,f)
if(m.v.length>f.length&&dot(nm,sub(c,mc))<0)f.reverse()
return{f:[addFace(m,f)]}
}
function bridge(m,es){
const loops=orderLoop(es)
if(loops.length!==2||loops[0].length!==loops[1].length)throw new Error('Select two edge loops with the same number of edges')
let A=loops[0],B=loops[1]
const n=A.length
const dir=new Set()
for(const f of m.f)for(let i=0;i<f.length;i++)dir.add(f[i]+'>'+f[(i+1)%f.length])
let best=1e18,bs=0,bf=1
for(let s=0;s<n;s++)for(const fl of[1,-1]){
let d=0
for(let i=0;i<n;i++)d+=len(sub(m.v[A[i]],m.v[B[((fl*i+s)%n+n)%n]]))
if(d<best){best=d;bs=s;bf=fl}
}
const nf=[]
for(let i=0;i<n;i++){
const j=(i+1)%n
const a=A[i],b=A[j],c=B[((bf*j+bs)%n+n)%n],d=B[((bf*i+bs)%n+n)%n]
let q=[a,b,c,d]
if(dir.has(a+'>'+b))q=[b,a,d,c]
nf.push(addFace(m,q))
}
return{f:nf}
}
function connect(m,a,b){
for(let fi=0;fi<m.f.length;fi++){
const f=m.f[fi],i=f.indexOf(a),j=f.indexOf(b)
if(i<0||j<0)continue
const n=f.length
if((i+1)%n===j||(j+1)%n===i)continue
const lo=Math.min(i,j),hi=Math.max(i,j)
const A=f.slice(lo,hi+1),B=[...f.slice(hi),...f.slice(0,lo+1)]
m.f[fi]=A
const nf=addFace(m,B,m.fm[fi])
return{f:[fi,nf],e:[K(a,b)]}
}
throw new Error('Pick two corners of the same face')
}
function mirrorMap(m,ax,eps){
eps=eps||1e-4
const h=new Map(),q=p=>Math.round(p[0]/eps)+','+Math.round(p[1]/eps)+','+Math.round(p[2]/eps)
m.v.forEach((p,i)=>h.set(q(p),i))
const map=new Int32Array(m.v.length).fill(-1)
m.v.forEach((p,i)=>{const r=p.slice();r[ax]=-r[ax];const j=h.get(q(r));if(j!==undefined)map[i]=j})
return map
}
function mirror(m,ax,eps){
eps=eps||1e-5
const o=empty(),map=[],on=[]
o.mats=m.mats.map(x=>Object.assign({},x));o.smooth=m.smooth
for(let i=0;i<m.v.length;i++){
const p=m.v[i].slice()
if(Math.abs(p[ax])<=eps){p[ax]=0;map.push(o.v.length);o.v.push(p);on.push(true)}
else{map.push(o.v.length);o.v.push(p);on.push(false)}
}
const mir=m.v.map((p,i)=>{if(on[i])return map[i];const q=p.slice();q[ax]=-q[ax];return o.v.push(q)-1})
m.f.forEach((f,fi)=>{
if(f.every(i=>on[i]))return
o.f.push(f.map(i=>map[i]));o.fm.push(m.fm[fi])
o.f.push(f.map(i=>mir[i]).reverse());o.fm.push(m.fm[fi])
})
compact(o)
return o
}
function arrayMod(m,count,off,rt,merge){
let o=clone(m)
for(let k=1;k<count;k++){
const c=clone(m)
xform(c,p=>{const q=rot(p,[rt[0]*k,rt[1]*k,rt[2]*k]);return[q[0]+off[0]*k,q[1]+off[1]*k,q[2]+off[2]*k]})
const base=o.v.length
for(const p of c.v)o.v.push(p)
c.f.forEach((f,i)=>{o.f.push(f.map(x=>x+base));o.fm.push(c.fm[i])})
}
if(merge>0)weld(o,merge)
return o
}
function subsurf(m,level){
let c=clone(m)
for(let l=0;l<level;l++){
const em=edgeMap(c),n=c.v.length
const fp=c.f.map(f=>fcenter(c,f))
const ep=new Map()
for(const[k,e]of em){
const A=c.v[e.a],B=c.v[e.b]
if(e.f.length===2){const m1=lerp(A,B,0.5),f1=fp[e.f[0]],f2=fp[e.f[1]];ep.set(k,mul(add(add(A,B),add(f1,f2)),0.25))}
else ep.set(k,lerp(A,B,0.5))
}
const vf=vfaces(c),ve=Array.from({length:n},()=>[])
for(const[k,e]of em){ve[e.a].push(k);ve[e.b].push(k)}
const nv=[],O=c.v
for(let i=0;i<n;i++){
const P=O[i],es=ve[i],bd=es.filter(k=>em.get(k).f.length!==2)
if(bd.length>=2||es.length===0||vf[i].length===0){
if(bd.length===2){const q=bd.map(k=>{const e=em.get(k);return O[e.a===i?e.b:e.a]});nv.push(add(mul(P,0.75),mul(add(q[0],q[1]),0.125)))}
else nv.push(P.slice())
continue
}
const k=vf[i].length
let F=[0,0,0],R=[0,0,0]
for(const fi of vf[i])F=add(F,fp[fi])
F=mul(F,1/k)
for(const ek of es){const e=em.get(ek);R=add(R,lerp(O[e.a],O[e.b],0.5))}
R=mul(R,1/es.length)
nv.push(mul(add(add(F,mul(R,2)),mul(P,k-3)),1/k))
}
const out=empty()
out.mats=c.mats;out.smooth=c.smooth
out.v=nv
const fidx=fp.map(p=>out.v.push(p)-1),eidx=new Map()
for(const[k,p]of ep)eidx.set(k,out.v.push(p)-1)
c.f.forEach((f,fi)=>{
const L=f.length
for(let i=0;i<L;i++){
const a=f[i],b=f[(i+1)%L],z=f[(i+L-1)%L]
out.f.push([a,eidx.get(K(a,b)),fidx[fi],eidx.get(K(z,a))]);out.fm.push(c.fm[fi])
}
})
c=out
}
return c
}
function solidify(m,t,off){
t=t===undefined?0.1:t;off=off===undefined?-1:off
const o=clone(m),vn=vnormals(m),n=m.v.length,s=off>=0?1:-1
for(let i=0;i<n;i++)o.v.push(add(m.v[i],mul(vn[i],t*s)))
if(s<0)m.f.forEach((f,fi)=>{o.f.push(f.map(i=>i+n).reverse());o.fm.push(m.fm[fi])})
else{o.f=m.f.map(f=>f.slice().reverse());m.f.forEach((f,fi)=>{o.f.push(f.map(i=>i+n))});o.fm=m.fm.concat(m.fm)}
const em=edgeMap(m)
for(const[k,e]of em){
if(e.f.length!==1)continue
const f=m.f[e.f[0]],i=f.findIndex((x,j)=>K(x,f[(j+1)%f.length])===k),p=f[i],q=f[(i+1)%f.length]
o.f.push(s<0?[q,p,p+n,q+n]:[p,q,q+n,p+n]);o.fm.push(m.fm[e.f[0]])
}
return o
}
function smoothVerts(m,vs,k,iter){
vs=vs?[...vs]:m.v.map((_,i)=>i)
k=k===undefined?0.5:k;iter=iter||1
const nb=Array.from({length:m.v.length},()=>new Set())
for(const f of m.f)for(let i=0;i<f.length;i++){nb[f[i]].add(f[(i+1)%f.length]);nb[f[(i+1)%f.length]].add(f[i])}
for(let it=0;it<iter;it++){
const np=new Map()
for(const v of vs){
if(!nb[v].size)continue
let c=[0,0,0]
for(const j of nb[v])c=add(c,m.v[j])
c=mul(c,1/nb[v].size)
np.set(v,lerp(m.v[v],c,k))
}
for(const[v,p]of np)m.v[v]=p
}
}
function decimate(m,ratio){
const o=clone(m)
const target=Math.max(4,Math.floor(o.f.length*ratio))
for(let pass=0;pass<30&&o.f.length>target;pass++){
const em=edgeMap(o),es=[...em.values()].map(e=>({e,l:len(sub(o.v[e.a],o.v[e.b]))})).sort((x,y)=>x.l-y.l)
const dead=new Set(),map=new Int32Array(o.v.length).map((_,i)=>i)
let cnt=o.f.length
for(const{e}of es){
if(cnt<=target)break
if(dead.has(e.a)||dead.has(e.b))continue
if(e.f.length!==2)continue
o.v[e.a]=lerp(o.v[e.a],o.v[e.b],0.5)
dead.add(e.a);dead.add(e.b)
map[e.b]=e.a
cnt-=2
}
o.f=o.f.map(f=>f.map(i=>map[i]))
tidy(o);compact(o)
}
return o
}
function triangulate(m,faces){
const s=faces?new Set(faces):null,F=[],M=[]
m.f.forEach((f,i)=>{
if(s&&!s.has(i)||f.length===3){F.push(f);M.push(m.fm[i]);return}
for(const t of tri(m,f)){F.push(t);M.push(m.fm[i])}
})
m.f=F;m.fm=M
}
const EPS=1e-5
function planeOf(vs){const n=nrm(cross(sub(vs[1],vs[0]),sub(vs[2],vs[0])));return{n,w:dot(n,vs[0])}}
function flipPoly(p){p.vs.reverse();p.pl={n:mul(p.pl.n,-1),w:-p.pl.w}}
function splitPoly(pl,poly,cf,cb,f,b){
const T=poly.vs.map(v=>{const t=dot(pl.n,v)-pl.w;return t<-EPS?2:t>EPS?1:0})
let ty=0
for(const t of T)ty|=t
if(ty===0){(dot(pl.n,poly.pl.n)>0?cf:cb).push(poly);return}
if(ty===1){f.push(poly);return}
if(ty===2){b.push(poly);return}
const F=[],B=[]
for(let i=0;i<poly.vs.length;i++){
const j=(i+1)%poly.vs.length,ti=T[i],tj=T[j],vi=poly.vs[i],vj=poly.vs[j]
if(ti!==2)F.push(vi)
if(ti!==1)B.push(ti!==2?vi.slice():vi)
if((ti|tj)===3){const t=(pl.w-dot(pl.n,vi))/dot(pl.n,sub(vj,vi)),v=lerp(vi,vj,t);F.push(v);B.push(v.slice())}
}
if(F.length>=3)f.push({vs:F,pl:poly.pl,m:poly.m})
if(B.length>=3)b.push({vs:B,pl:poly.pl,m:poly.m})
}
function BNode(polys){this.pl=null;this.front=null;this.back=null;this.polys=[];if(polys&&polys.length)this.build(polys)}
BNode.prototype.invert=function(){
for(const p of this.polys)flipPoly(p)
if(this.pl)this.pl={n:mul(this.pl.n,-1),w:-this.pl.w}
if(this.front)this.front.invert()
if(this.back)this.back.invert()
const t=this.front;this.front=this.back;this.back=t
}
BNode.prototype.clip=function(polys){
if(!this.pl)return polys.slice()
let f=[],b=[]
for(const p of polys)splitPoly(this.pl,p,f,b,f,b)
if(this.front)f=this.front.clip(f)
b=this.back?this.back.clip(b):[]
return f.concat(b)
}
BNode.prototype.clipTo=function(n){this.polys=n.clip(this.polys);if(this.front)this.front.clipTo(n);if(this.back)this.back.clipTo(n)}
BNode.prototype.all=function(){let r=this.polys.slice();if(this.front)r=r.concat(this.front.all());if(this.back)r=r.concat(this.back.all());return r}
BNode.prototype.build=function(polys){
if(!polys.length)return
if(!this.pl)this.pl={n:polys[0].pl.n.slice(),w:polys[0].pl.w}
const f=[],b=[]
for(const p of polys)splitPoly(this.pl,p,this.polys,this.polys,f,b)
if(f.length){if(!this.front)this.front=new BNode();this.front.build(f)}
if(b.length){if(!this.back)this.back=new BNode();this.back.build(b)}
}
function polysOf(m,mo){
const o=[]
m.f.forEach((f,fi)=>{
for(const t of tri(m,f)){
const vs=t.map(i=>m.v[i].slice())
const c=cross(sub(vs[1],vs[0]),sub(vs[2],vs[0]))
if(len(c)<1e-12)continue
o.push({vs,pl:planeOf(vs),m:m.fm[fi]+mo})
}
})
return o
}
function boolean(a,b,op){
if(a.f.length>3000||b.f.length>3000)throw new Error('Boolean works on meshes under 3000 faces. Decimate first.')
const pa=polysOf(a,0),pb=polysOf(b,a.mats.length)
const A=new BNode(pa),B=new BNode(pb)
if(op==='union'){A.clipTo(B);B.clipTo(A);B.invert();B.clipTo(A);B.invert();A.build(B.all())}
else if(op==='difference'){A.invert();A.clipTo(B);B.clipTo(A);B.invert();B.clipTo(A);B.invert();A.build(B.all());A.invert()}
else{A.invert();B.clipTo(A);B.invert();A.clipTo(B);B.clipTo(A);A.build(B.all());A.invert()}
const out=empty()
out.mats=a.mats.concat(b.mats).map(x=>Object.assign({},x))
out.smooth=a.smooth
for(const p of A.all()){out.f.push(p.vs.map(v=>out.v.push(v)-1));out.fm.push(p.m)}
weld(out,1e-4)
return out
}
function applyMod(m,d){
if(d.on===false)return m
switch(d.type){
case'mirror':return mirror(m,d.axis|0)
case'array':return arrayMod(m,Math.max(1,Math.min(100,d.count|0||2)),d.off||[1,0,0],d.rot||[0,0,0],d.merge||0)
case'subsurf':return subsurf(m,Math.max(0,Math.min(4,d.level|0)))
case'solidify':return solidify(m,d.t,d.off)
case'smooth':{const o=clone(m);smoothVerts(o,null,d.k===undefined?0.5:d.k,d.iter||1);return o}
case'decimate':return decimate(m,Math.max(0.02,Math.min(1,d.ratio||0.5)))
case'boolean':return d.mesh?boolean(m,d.mesh,d.op||'difference'):m
case'triangulate':{const o=clone(m);triangulate(o);return o}
case'bevel':{const o=clone(m),em=edgeMap(o),es=[];for(const[k,e]of em)if(e.f.length===2&&dot(fn(o,o.f[e.f[0]]),fn(o,o.f[e.f[1]]))<Math.cos((d.angle||30)*Math.PI/180))es.push(k);if(es.length)bevel(o,es,d.w||0.05);return o}
case'weld':{const o=clone(m);weld(o,d.d||1e-4);return o}
}
return m
}
function evaluate(p){
let m=clone(p.mesh)
for(const d of p.mods||[])m=applyMod(m,d)
return m
}
function render(m){
const F=m.f,N=F.map(f=>fn(m,f))
const vf=m.smooth>0?vfaces(m):null,cosT=Math.cos(Math.min(180,m.smooth||0)*Math.PI/180)-1e-6
const T=[]
F.forEach((f,fi)=>{for(const t of tri(m,f))T.push([t,fi])})
const pos=new Float32Array(T.length*9),nr=new Float32Array(T.length*9),tf=new Int32Array(T.length)
const area=F.map(f=>farea(m,f))
T.forEach(([t,fi],ti)=>{
tf[ti]=fi
for(let c=0;c<3;c++){
const v=t[c],p=m.v[v]
let n=N[fi]
if(vf){let x=0,y=0,z=0;for(const g of vf[v])if(dot(N[g],N[fi])>=cosT){x+=N[g][0]*area[g];y+=N[g][1]*area[g];z+=N[g][2]*area[g]};n=nrm([x,y,z])}
const o=ti*9+c*3
pos[o]=p[0];pos[o+1]=p[1];pos[o+2]=p[2]
nr[o]=n[0];nr[o+1]=n[1];nr[o+2]=n[2]
}
})
return{pos,nrm:nr,tf,count:T.length}
}
function groups(m){
const r=render(m),G=new Map()
for(let t=0;t<r.count;t++){
const mi=Math.min(m.mats.length-1,m.fm[r.tf[t]]||0)
let g=G.get(mi)
if(!g){g={mat:m.mats[mi],pos:[],nrm:[]};G.set(mi,g)}
for(let k=0;k<9;k++){g.pos.push(r.pos[t*9+k]);g.nrm.push(r.nrm[t*9+k])}
}
return[...G.values()]
}
function stats(m){
const em=edgeMap(m)
let t=0
for(const f of m.f)t+=f.length-2
return{verts:m.v.length,edges:em.size,faces:m.f.length,tris:t}
}
function bbox(m){
const mn=[1e9,1e9,1e9],mx=[-1e9,-1e9,-1e9]
for(const p of m.v)for(let i=0;i<3;i++){mn[i]=Math.min(mn[i],p[i]);mx[i]=Math.max(mx[i],p[i])}
return m.v.length?{min:mn,max:mx}:{min:[0,0,0],max:[0,0,0]}
}
function fromTris(parts){
const m=empty()
m.mats=[]
const h=new Map()
for(const part of parts){
const mi=m.mats.length
m.mats.push({name:part.name||'Material',color:part.color||'#b8b8b8',metal:part.metal||0,rough:part.rough===undefined?0.6:part.rough,emissive:part.emissive||'#000000'})
const map=[]
for(let i=0;i<part.pos.length;i+=3){
const p=[part.pos[i],part.pos[i+1],part.pos[i+2]]
const k=Math.round(p[0]*1e4)+','+Math.round(p[1]*1e4)+','+Math.round(p[2]*1e4)+','+mi
let j=h.get(k)
if(j===undefined){j=m.v.push(p)-1;h.set(k,j)}
map.push(j)
}
for(let t=0;t<part.idx.length;t+=3)m.f.push([map[part.idx[t]],map[part.idx[t+1]],map[part.idx[t+2]]]),m.fm.push(mi)
}
tidy(m)
if(!m.mats.length)m.mats=[mat0()]
return m
}
function toOBJ(m,name){
let s='o '+(name||'model')+'\n'
for(const p of m.v)s+='v '+p[0].toFixed(5)+' '+p[1].toFixed(5)+' '+p[2].toFixed(5)+'\n'
for(const f of m.f)s+='f '+f.map(i=>i+1).join(' ')+'\n'
return s
}
function fromOBJ(text){
const m=empty(),V=[]
for(const line of text.split(/\r?\n/)){
const t=line.trim().split(/\s+/)
if(t[0]==='v')V.push([+t[1]||0,+t[2]||0,+t[3]||0])
else if(t[0]==='f'){
const f=t.slice(1).map(x=>{const i=parseInt(x.split('/')[0],10);return i<0?V.length+i:i-1})
if(f.length>=3&&f.every(i=>i>=0&&i<V.length))m.f.push(f),m.fm.push(0)
}
}
m.v=V
tidy(m);compact(m)
if(m.f.length>200000)throw new Error('That model is too big to edit here')
return m
}
function fromGLB(buf){
const dv=new DataView(buf.buffer?buf.buffer:buf,buf.byteOffset||0,buf.byteLength)
if(dv.getUint32(0,true)!==0x46546C67)throw new Error('Not a GLB file')
let o=12,json=null,bin=null
while(o<dv.byteLength){
const l=dv.getUint32(o,true),t=dv.getUint32(o+4,true)
const u8=new Uint8Array(dv.buffer,dv.byteOffset+o+8,l)
if(t===0x4E4F534A)json=JSON.parse(new TextDecoder().decode(u8))
else if(t===0x004E4942)bin=u8
o+=8+l+(l%4?4-l%4:0)
}
if(!json||!bin)throw new Error('This GLB has no mesh data')
const read=ai=>{
const a=json.accessors[ai],bv=json.bufferViews[a.bufferView]
const comps={SCALAR:1,VEC2:2,VEC3:3,VEC4:4}[a.type],off=(bv.byteOffset||0)+(a.byteOffset||0)
const stride=bv.byteStride||0
const T={5126:[Float32Array,4],5125:[Uint32Array,4],5123:[Uint16Array,2],5121:[Uint8Array,1]}[a.componentType]
const out=[]
const dv2=new DataView(bin.buffer,bin.byteOffset,bin.byteLength)
const get={5126:(p)=>dv2.getFloat32(p,true),5125:p=>dv2.getUint32(p,true),5123:p=>dv2.getUint16(p,true),5121:p=>dv2.getUint8(p)}[a.componentType]
for(let i=0;i<a.count;i++)for(let c=0;c<comps;c++)out.push(get(off+i*(stride||comps*T[1])+c*T[1]))
return out
}
const hexc=c=>'#'+c.slice(0,3).map(x=>Math.round(Math.max(0,Math.min(1,x))*255).toString(16).padStart(2,'0')).join('')
const parts=[]
for(const me of json.meshes||[])for(const pr of me.primitives){
if(pr.attributes.POSITION===undefined)continue
const pos=read(pr.attributes.POSITION)
const idx=pr.indices!==undefined?read(pr.indices):[...Array(pos.length/3).keys()]
const mt=json.materials&&json.materials[pr.material]
const pb=mt&&mt.pbrMetallicRoughness||{}
parts.push({name:mt&&mt.name,pos,idx,color:hexc(pb.baseColorFactor||[0.7,0.7,0.7]),metal:pb.metallicFactor||0,rough:pb.roughnessFactor===undefined?0.6:pb.roughnessFactor,emissive:hexc(mt&&mt.emissiveFactor||[0,0,0])})
}
return fromTris(parts)
}
function sanitize(m,limit){
if(!m||!Array.isArray(m.v)||!Array.isArray(m.f))throw new Error('A mesh needs v and f lists')
limit=limit||200000
if(m.v.length>limit||m.f.length>limit)throw new Error('This mesh is too big')
const v=m.v.map(p=>{if(!Array.isArray(p)||p.length!==3||p.some(x=>typeof x!=='number'||!isFinite(x)))throw new Error('Bad vertex');return[Math.round(p[0]*1e5)/1e5,Math.round(p[1]*1e5)/1e5,Math.round(p[2]*1e5)/1e5]})
const f=m.f.map(q=>{if(!Array.isArray(q)||q.length<3||q.length>64||q.some(i=>!Number.isInteger(i)||i<0||i>=v.length))throw new Error('Bad face');return q.slice()})
const mats=(Array.isArray(m.mats)&&m.mats.length?m.mats:[mat0()]).slice(0,64).map(x=>({name:String(x.name||'Material').slice(0,40),color:/^#[0-9a-fA-F]{6}$/.test(x.color)?x.color:'#b8b8b8',metal:Math.min(1,Math.max(0,+x.metal||0)),rough:Math.min(1,Math.max(0,x.rough===undefined?0.6:+x.rough)),emissive:/^#[0-9a-fA-F]{6}$/.test(x.emissive)?x.emissive:'#000000'}))
const fm=f.map((_,i)=>Math.min(mats.length-1,Math.max(0,(m.fm&&m.fm[i])|0)))
return{v,f,fm,mats,smooth:Math.min(180,Math.max(0,+m.smooth||0))}
}
function sanitizeMods(mods){
if(mods===undefined)return[]
if(!Array.isArray(mods)||mods.length>16)throw new Error('At most 16 modifiers')
const T=['mirror','array','subsurf','solidify','smooth','decimate','boolean','triangulate','bevel','weld']
return mods.map(d=>{
if(!d||!T.includes(d.type))throw new Error('Unknown modifier: '+(d&&d.type))
const o={type:d.type,on:d.on!==false}
for(const k of['axis','count','level','t','off','k','iter','ratio','w','angle','merge','d'])if(d[k]!==undefined){if(typeof d[k]!=='number'||!isFinite(d[k]))throw new Error('Bad modifier value');o[k]=d[k]}
if(d.off!==undefined&&Array.isArray(d.off))o.off=d.off.map(Number)
for(const k of['rot','off'])if(Array.isArray(d[k])&&d[k].length===3&&d[k].every(x=>typeof x==='number'))o[k]=d[k].slice()
if(d.type==='boolean'){o.op=['union','difference','intersect'].includes(d.op)?d.op:'difference';if(d.mesh)o.mesh=sanitize(d.mesh,6000)}
return o
})
}
root.VueMesh={empty,clone,primitive,PRIMS,box,lathe,uvsphere,cylinder,cone,capsule,torus,grid,circle,icosphere,extrudePoly,stairs,wedge,tri,fn,fcenter,farea,edgeMap,vfaces,vnormals,check,K,ka,kb,eset,fverts,everts,xform,rot,join,weld,tidy,compact,extrudeFaces,extrudeEdges,insetFaces,insetAbs,bevel,subdivideFaces,subdivideEdges,loopCut,ringEdges,edgeLoop,linked,growFaces,shrinkFaces,deleteFaces,deleteVerts,deleteEdges,dissolveEdges,dissolveVerts,mergeVerts,flip,recalc,volume,fill,bridge,connect,mirrorMap,mirror,arrayMod,subsurf,solidify,smoothVerts,decimate,triangulate,boolean,applyMod,evaluate,render,groups,stats,bbox,fromTris,toOBJ,fromOBJ,fromGLB,sanitize,sanitizeMods,addFace,sub,add,mul,dot,cross,len,nrm,lerp}
})(typeof window!=='undefined'?window:globalThis)
