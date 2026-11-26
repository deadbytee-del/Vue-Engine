(function(root){
const TYPES=['box','sphere','cylinder','cone','torus','lathe','extrude','group']
const MAXP=500,MAXT=200000
const D=Math.PI/180
const num=(v,d)=>typeof v==='number'&&isFinite(v)?v:d
const vec=(v,d)=>Array.isArray(v)&&v.length===3&&v.every(x=>typeof x==='number'&&isFinite(x))?v.slice():d.slice()
const hex=(c,d)=>typeof c==='string'&&/^#[0-9a-fA-F]{6}$/.test(c)?c:d
function norm(p,depth){
if(!p||typeof p!=='object'||!TYPES.includes(p.type))throw new Error('Unknown part type: '+(p&&p.type)+'. Use: '+TYPES.join(', '))
if(depth>8)throw new Error('Groups are nested too deeply')
const o={type:p.type,name:String(p.name||p.type).slice(0,60),pos:vec(p.pos,[0,0,0]),rot:vec(p.rot,[0,0,0]),scale:vec(p.scale,[1,1,1]),color:hex(p.color,'#b0b0b0'),metal:Math.min(1,Math.max(0,num(p.metal,0.05))),rough:Math.min(1,Math.max(0,num(p.rough,0.7))),emissive:hex(p.emissive,'#000000')}
if(p.size)o.size=vec(p.size,[1,1,1])
for(const k of['radius','radiusTop','radiusBottom','height','tube','depth'])if(p[k]!==undefined)o[k]=Math.max(0.001,num(p[k],1))
if(p.segments!==undefined)o.segments=Math.min(64,Math.max(3,Math.floor(num(p.segments,16))))
if(p.profile!==undefined){
if(!Array.isArray(p.profile)||p.profile.length<2||p.profile.length>200||p.profile.some(q=>!Array.isArray(q)||q.length!==2||!isFinite(q[0])||!isFinite(q[1])))throw new Error('profile must be a list of 2 to 200 [x,y] points')
o.profile=p.profile.map(q=>[q[0],q[1]])
}
if(p.type==='extrude'&&(!o.profile||o.profile.length<3))throw new Error('extrude needs a profile with at least 3 points')
if(p.type==='lathe'&&!o.profile)throw new Error('lathe needs a profile of [radius, height] points')
if(p.mirror!==undefined){if(!['x','y','z'].includes(p.mirror))throw new Error('mirror must be x, y or z');o.mirror=p.mirror}
if(p.array!==undefined){
const a=p.array
if(!a||typeof a!=='object'||!(a.count>=1&&a.count<=100))throw new Error('array needs count from 1 to 100')
o.array={count:Math.floor(a.count),offset:vec(a.offset,[1,0,0]),rot:vec(a.rot,[0,0,0])}
}
if(p.type==='group'){
if(!Array.isArray(p.children))throw new Error('group needs children')
o.children=p.children.map(c=>norm(c,(depth||0)+1))
}
return o
}
function validate(spec){
if(!spec||typeof spec!=='object'||!Array.isArray(spec.parts))throw new Error('A model needs a parts list')
const s={v:1,name:String(spec.name||'Model').slice(0,80),pivot:vec(spec.pivot,[0,0,0]),parts:spec.parts.map(p=>norm(p,0))}
let n=0
const count=ps=>{for(const p of ps){n+=(p.array?p.array.count:1)*(p.mirror?2:1);if(p.children)count(p.children)}}
count(s.parts)
if(n>MAXP)throw new Error('A model can have at most '+MAXP+' parts')
return s
}
const mul=(a,b)=>{const o=new Array(16).fill(0);for(let c=0;c<4;c++)for(let r=0;r<4;r++)for(let k=0;k<4;k++)o[c*4+r]+=a[k*4+r]*b[c*4+k];return o}
const I=()=>[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]
function trs(p,rot,sc){
const[x,y,z]=rot.map(v=>v*D),cx=Math.cos(x),sx=Math.sin(x),cy=Math.cos(y),sy=Math.sin(y),cz=Math.cos(z),sz=Math.sin(z)
const r=[cy*cz,cy*sz,-sy,0,sx*sy*cz-cx*sz,sx*sy*sz+cx*cz,sx*cy,0,cx*sy*cz+sx*sz,cx*sy*sz-sx*cz,cx*cy,0]
return[r[0]*sc[0],r[1]*sc[0],r[2]*sc[0],0,r[4]*sc[1],r[5]*sc[1],r[6]*sc[1],0,r[8]*sc[2],r[9]*sc[2],r[10]*sc[2],0,p[0],p[1],p[2],1]
}
const det3=m=>m[0]*(m[5]*m[10]-m[6]*m[9])-m[4]*(m[1]*m[10]-m[2]*m[9])+m[8]*(m[1]*m[6]-m[2]*m[5])
function boxM(sx,sy,sz){
const p=[],i=[]
const F=[[0,0,1,1,0,0,0,1,0],[0,0,-1,-1,0,0,0,1,0],[1,0,0,0,0,-1,0,1,0],[-1,0,0,0,0,1,0,1,0],[0,1,0,1,0,0,0,0,-1],[0,-1,0,1,0,0,0,0,1]]
for(const f of F){
const n=[f[0],f[1],f[2]],u=[f[3],f[4],f[5]],v=[f[6],f[7],f[8]],b=p.length/3
for(const[a,c]of[[-1,-1],[1,-1],[1,1],[-1,1]])p.push((n[0]+u[0]*a+v[0]*c)*sx/2,(n[1]+u[1]*a+v[1]*c)*sy/2,(n[2]+u[2]*a+v[2]*c)*sz/2)
i.push(b,b+1,b+2,b,b+2,b+3)
}
return{p,i}
}
function latheM(pr,seg){
const p=[],i=[]
for(let s=0;s<=seg;s++){
const a=s/seg*Math.PI*2,c=Math.cos(a),n=Math.sin(a)
for(const q of pr)p.push(q[0]*c,q[1],q[0]*n)
}
const k=pr.length
for(let s=0;s<seg;s++)for(let j=0;j<k-1;j++){const a=s*k+j,b=(s+1)*k+j;i.push(a,a+1,b,b,a+1,b+1)}
return{p,i}
}
function ear(pts){
const n=pts.length,idx=[...Array(n).keys()]
let area=0
for(let j=0;j<n;j++){const a=pts[j],b=pts[(j+1)%n];area+=a[0]*b[1]-b[0]*a[1]}
if(area<0)idx.reverse()
const out=[]
const cr=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0])
let g=0
while(idx.length>3&&g++<10000){
let cut=false
for(let j=0;j<idx.length;j++){
const a=idx[(j+idx.length-1)%idx.length],b=idx[j],c=idx[(j+1)%idx.length]
if(cr(pts[a],pts[b],pts[c])<=0)continue
let inside=false
for(const q of idx){if(q===a||q===b||q===c)continue;const P=pts[q];if(cr(pts[a],pts[b],P)>=0&&cr(pts[b],pts[c],P)>=0&&cr(pts[c],pts[a],P)>=0){inside=true;break}}
if(inside)continue
out.push(a,b,c);idx.splice(j,1);cut=true;break
}
if(!cut)break
}
if(idx.length===3)out.push(idx[0],idx[1],idx[2])
return out
}
function extrudeM(pr,d){
const p=[],i=[],n=pr.length
const tri=ear(pr)
let b=0
for(const q of pr)p.push(q[0],q[1],d/2)
for(let t=0;t<tri.length;t+=3)i.push(tri[t],tri[t+1],tri[t+2])
b=p.length/3
for(const q of pr)p.push(q[0],q[1],-d/2)
for(let t=0;t<tri.length;t+=3)i.push(b+tri[t],b+tri[t+2],b+tri[t+1])
let area=0
for(let j=0;j<n;j++){const a=pr[j],c=pr[(j+1)%n];area+=a[0]*c[1]-c[0]*a[1]}
for(let j=0;j<n;j++){
const a=pr[j],c=pr[(j+1)%n],s=p.length/3
p.push(a[0],a[1],d/2,c[0],c[1],d/2,c[0],c[1],-d/2,a[0],a[1],-d/2)
if(area>0)i.push(s,s+3,s+1,s+1,s+3,s+2);else i.push(s,s+1,s+3,s+1,s+2,s+3)
}
return{p,i}
}
function local(p){
const seg=p.segments||16
if(p.type==='box'){const s=p.size||[1,1,1];return boxM(s[0],s[1],s[2])}
if(p.type==='sphere'){const r=p.radius||0.5,pr=[];for(let j=0;j<=seg;j++){const a=j/seg*Math.PI;pr.push([Math.sin(a)*r,-Math.cos(a)*r])};return latheM(pr,seg*2)}
if(p.type==='cylinder'||p.type==='cone'){
const h=p.height||1,rt=p.type==='cone'?0:(p.radiusTop!==undefined?p.radiusTop:(p.radius||0.5)),rb=p.radiusBottom!==undefined?p.radiusBottom:(p.radius||0.5)
const pr=[[0,-h/2],[rb,-h/2],[rb,-h/2],[rt,h/2],[rt,h/2],[0,h/2]]
return latheM(pr,seg)
}
if(p.type==='torus'){
const R=p.radius||0.5,r=p.tube||0.15,pr=[]
for(let j=0;j<=Math.max(6,seg/2|0);j++){const a=j/Math.max(6,seg/2|0)*Math.PI*2;pr.push([R+Math.cos(a)*r,Math.sin(a)*r])}
return latheM(pr,seg*2)
}
if(p.type==='lathe')return latheM(p.profile,seg)
return extrudeM(p.profile,p.depth||1)
}
function normals(p,i){
const n=new Array(p.length).fill(0)
for(let t=0;t<i.length;t+=3){
const a=i[t]*3,b=i[t+1]*3,c=i[t+2]*3
const ux=p[b]-p[a],uy=p[b+1]-p[a+1],uz=p[b+2]-p[a+2],vx=p[c]-p[a],vy=p[c+1]-p[a+1],vz=p[c+2]-p[a+2]
const x=uy*vz-uz*vy,y=uz*vx-ux*vz,z=ux*vy-uy*vx
for(const q of[a,b,c]){n[q]+=x;n[q+1]+=y;n[q+2]+=z}
}
for(let k=0;k<n.length;k+=3){const l=Math.hypot(n[k],n[k+1],n[k+2])||1;n[k]/=l;n[k+1]/=l;n[k+2]/=l}
return n
}
function bake(spec){
const s=validate(spec),out=[]
const walk=(ps,pm)=>{
for(const p of ps){
const reps=p.array?p.array.count:1
for(let r=0;r<reps;r++){
const base=mul(pm,trs(p.pos,p.rot,p.scale))
const ar=p.array?mul(trs(p.array.offset.map(v=>v*r),p.array.rot.map(v=>v*r),[1,1,1]),I()):I()
const m0=mul(ar,base)
const ms=p.mirror?[m0,mul(trs([0,0,0],[0,0,0],[p.mirror==='x'?-1:1,p.mirror==='y'?-1:1,p.mirror==='z'?-1:1]),m0)]:[m0]
for(const m of ms){
if(p.type==='group'){walk(p.children,m);continue}
const g=local(p),flip=det3(m)<0,idx=g.i.slice()
if(flip)for(let t=0;t<idx.length;t+=3){const x=idx[t+1];idx[t+1]=idx[t+2];idx[t+2]=x}
const pos=[]
for(let k=0;k<g.p.length;k+=3){const x=g.p[k],y=g.p[k+1],z=g.p[k+2];pos.push(m[0]*x+m[4]*y+m[8]*z+m[12]-s.pivot[0],m[1]*x+m[5]*y+m[9]*z+m[13]-s.pivot[1],m[2]*x+m[6]*y+m[10]*z+m[14]-s.pivot[2])}
out.push({name:p.name,pos,idx,nrm:normals(pos,idx),color:p.color,metal:p.metal,rough:p.rough,emissive:p.emissive})
}
}
}
}
walk(s.parts,I())
let t=0
for(const o of out)t+=o.idx.length/3
if(t>MAXT)throw new Error('This model has too many triangles')
return{meshes:out,tris:t,name:s.name}
}
const rgb=h=>[parseInt(h.slice(1,3),16)/255,parseInt(h.slice(3,5),16)/255,parseInt(h.slice(5,7),16)/255]
function build(T,spec){
const b=bake(spec),g=new T.Group()
for(const m of b.meshes){
const geo=new T.BufferGeometry()
geo.setAttribute('position',new T.Float32BufferAttribute(m.pos,3))
geo.setAttribute('normal',new T.Float32BufferAttribute(m.nrm,3))
geo.setIndex(m.idx)
const mat=new T.MeshStandardMaterial({color:m.color,metalness:m.metal,roughness:m.rough,emissive:m.emissive})
const mesh=new T.Mesh(geo,mat)
mesh.castShadow=true;mesh.receiveShadow=true
g.add(mesh)
}
return g
}
function cat(list){
let n=0
for(const a of list)n+=a.length
const o=new Uint8Array(n)
let k=0
for(const a of list){o.set(a,k);k+=a.length}
return o
}
function toGLB(spec){
const b=bake(spec),bufs=[],views=[],acc=[],meshes=[],mats=[],nodes=[]
let off=0
const add=(arr,target)=>{
const bytes=new Uint8Array(arr.buffer,arr.byteOffset,arr.byteLength)
const pad=(4-bytes.length%4)%4
bufs.push(bytes,new Uint8Array(pad))
views.push({buffer:0,byteOffset:off,byteLength:bytes.length,target})
off+=bytes.length+pad
return views.length-1
}
b.meshes.forEach((m,k)=>{
const P=new Float32Array(m.pos),N=new Float32Array(m.nrm),X=new Uint32Array(m.idx)
const mn=[1e9,1e9,1e9],mx=[-1e9,-1e9,-1e9]
for(let j=0;j<P.length;j+=3)for(let q=0;q<3;q++){mn[q]=Math.min(mn[q],P[j+q]);mx[q]=Math.max(mx[q],P[j+q])}
const a0=acc.length
acc.push({bufferView:add(P,34962),componentType:5126,count:P.length/3,type:'VEC3',min:mn,max:mx})
acc.push({bufferView:add(N,34962),componentType:5126,count:N.length/3,type:'VEC3'})
acc.push({bufferView:add(X,34963),componentType:5125,count:X.length,type:'SCALAR'})
mats.push({name:m.name,pbrMetallicRoughness:{baseColorFactor:[...rgb(m.color),1],metallicFactor:m.metal,roughnessFactor:m.rough},emissiveFactor:rgb(m.emissive)})
meshes.push({name:m.name,primitives:[{attributes:{POSITION:a0,NORMAL:a0+1},indices:a0+2,material:k}]})
nodes.push({mesh:k,name:m.name})
})
const bin=cat(bufs)
const json={asset:{version:'2.0',generator:'Vue Engine'},scene:0,scenes:[{nodes:nodes.map((n,k)=>k)}],nodes,meshes,materials:mats,accessors:acc,bufferViews:views,buffers:[{byteLength:bin.length}]}
let js=new TextEncoder().encode(JSON.stringify(json))
const jp=(4-js.length%4)%4
js=cat([js,new Uint8Array(jp).fill(0x20)])
const out=new Uint8Array(12+8+js.length+8+bin.length),dv=new DataView(out.buffer)
dv.setUint32(0,0x46546C67,true);dv.setUint32(4,2,true);dv.setUint32(8,out.length,true)
dv.setUint32(12,js.length,true);dv.setUint32(16,0x4E4F534A,true)
out.set(js,20)
const q=20+js.length
dv.setUint32(q,bin.length,true);dv.setUint32(q+4,0x004E4942,true)
out.set(bin,q+8)
return out
}
const bounds=spec=>{
const b=bake(spec),mn=[1e9,1e9,1e9],mx=[-1e9,-1e9,-1e9]
for(const m of b.meshes)for(let j=0;j<m.pos.length;j+=3)for(let q=0;q<3;q++){mn[q]=Math.min(mn[q],m.pos[j+q]);mx[q]=Math.max(mx[q],m.pos[j+q])}
return b.meshes.length?{min:mn,max:mx,size:[mx[0]-mn[0],mx[1]-mn[1],mx[2]-mn[2]],parts:b.meshes.length,triangles:b.tris}:{min:[0,0,0],max:[0,0,0],size:[0,0,0],parts:0,triangles:0}
}
function preview(spec,size){
const b=bake(spec),cv=document.createElement('canvas')
cv.width=cv.height=size||160
const c=cv.getContext('2d'),ya=0.6,pa=0.45,cy=Math.cos(ya),sy=Math.sin(ya),cp=Math.cos(pa),sp=Math.sin(pa)
const tr=[]
let mnx=1e9,mxx=-1e9,mny=1e9,mxy=-1e9
const proj=(x,y,z)=>{const a=x*cy+z*sy,d=-x*sy+z*cy;return[a,y*cp-d*sp,y*sp+d*cp]}
for(const m of b.meshes){
const P=[]
for(let k=0;k<m.pos.length;k+=3){const q=proj(m.pos[k],m.pos[k+1],m.pos[k+2]);P.push(q);mnx=Math.min(mnx,q[0]);mxx=Math.max(mxx,q[0]);mny=Math.min(mny,q[1]);mxy=Math.max(mxy,q[1])}
const col=rgb(m.color)
for(let t=0;t<m.idx.length;t+=3){
const i=m.idx[t],j=m.idx[t+1],k=m.idx[t+2]
const n=proj(m.nrm[i*3],m.nrm[i*3+1],m.nrm[i*3+2])
const sh=0.35+0.65*Math.max(0,n[0]*-0.3+n[1]*0.7+n[2]*0.65)
tr.push({a:P[i],b:P[j],c:P[k],z:(P[i][2]+P[j][2]+P[k][2])/3,f:'rgb('+col.map(v=>Math.round(Math.min(1,v*sh)*255)).join(',')+')'})
}
}
if(!tr.length)return cv.toDataURL()
tr.sort((p,q)=>q.z-p.z)
const w=Math.max(0.001,mxx-mnx),hh=Math.max(0.001,mxy-mny),sc=cv.width*0.84/Math.max(w,hh),ox=cv.width/2-(mnx+mxx)/2*sc,oy=cv.height/2+(mny+mxy)/2*sc
for(const t of tr){
c.fillStyle=t.f;c.strokeStyle=t.f;c.lineWidth=0.6
c.beginPath();c.moveTo(ox+t.a[0]*sc,oy-t.a[1]*sc);c.lineTo(ox+t.b[0]*sc,oy-t.b[1]*sc);c.lineTo(ox+t.c[0]*sc,oy-t.c[1]*sc);c.closePath();c.fill();c.stroke()
}
return cv.toDataURL()
}
const DOC='Model spec: {name,pivot:[x,y,z],parts:[part]}. A part is {type,name,pos:[x,y,z],rot:[degrees],scale:[x,y,z],color:"#rrggbb",metal:0-1,rough:0-1,emissive:"#rrggbb"} plus per type: box size:[w,h,d]; sphere radius; cylinder radius or radiusTop/radiusBottom and height; cone radius,height; torus radius,tube; lathe profile:[[radius,height],...]; extrude profile:[[x,y],...] and depth; group children:[part]. Any part may have mirror:"x"|"y"|"z" and array:{count,offset:[x,y,z],rot:[deg]}. Units are metres, Y is up.'
const api={TYPES,validate,bake,build,toGLB,bounds,preview,DOC}
if(typeof module!=='undefined'&&module.exports)module.exports=api
else root.VueModel=api
})(typeof window!=='undefined'?window:globalThis)
