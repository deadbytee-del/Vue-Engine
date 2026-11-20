VueExt.register({id:'terrain',name:'Procedural Terrain',ns:'terrain',cat:'World',icon:'mountain',version:'1.0.0',example:"export function start() {\nvue.terrain.generate('Ground', { width: 200, seed: 7, caves: 0.4 })\n}\n// 3D: vue.terrain.generate3({ size: 200, height: 16, seed: 3 })",desc:'Seeded terrain generation. 2D fills a tilemap with hills, caves, grass, dirt and stone. 3D builds a smooth height-mapped landscape with sand, grass, rock and snow, and keeps every body standing on it.',defaults:{},
api(g,c,s){
const hash=(x,y,sd)=>{let h=(x*374761393+y*668265263+sd*144665)|0;h=(h^(h>>>13))*1274126177|0;return((h^(h>>>16))>>>0)/4294967296}
const sm=t=>t*t*(3-2*t)
const vn=(x,y,sd)=>{const xi=Math.floor(x),yi=Math.floor(y),xf=x-xi,yf=y-yi,a=hash(xi,yi,sd),b=hash(xi+1,yi,sd),c2=hash(xi,yi+1,sd),d=hash(xi+1,yi+1,sd),u=sm(xf),v=sm(yf);return a+(b-a)*u+(c2-a)*v+(a-b-c2+d)*u*v}
const fbm=(x,y,sd,oc)=>{let t=0,a=0.5,f=1,n=0;for(let i=0;i<(oc||5);i++){t+=vn(x*f,y*f,sd+i*17)*a;n+=a;a*=0.5;f*=2}return t/n}
s.fbm=fbm
return{
noise:(x,y,seed,oct)=>fbm(+x,+y,+seed||1,oct),
generate:(m,o)=>{
m=typeof m==='string'?g.vue.find(m):m
if(!m||!m.setTile){g.log('warn','terrain.generate needs a Tilemap entity');return}
o=Object.assign({width:160,height:40,x:-80,y:0,seed:1,ground:12,hills:10,caves:0.42,grass:0,dirt:1,stone:2,scale:0.04},o||{})
for(let i=0;i<o.width;i++){
const cx=o.x+i,top=Math.round(o.ground+(fbm(cx*o.scale,0,o.seed,5)-0.5)*2*o.hills)
for(let j=0;j<o.height;j++){
const cy=o.y+j
if(j<top){m.setTile(cx,cy,-1);continue}
const deep=j-top
if(o.caves>0&&deep>3&&fbm(cx*0.09,cy*0.09,o.seed+99,3)>1-o.caves*0.62){m.setTile(cx,cy,-1);continue}
m.setTile(cx,cy,deep===0?o.grass:deep<4?o.dirt:o.stone)
}
}
g.sDirty=true
},
generate3:(o)=>{
o=Object.assign({size:160,res:128,height:14,scale:0.025,seed:1,x:0,z:0,y:0,water:-1},o||{})
s.t3=o
s.h3=(x,z)=>{const n=fbm((x-o.x)*o.scale+50,(z-o.z)*o.scale+50,o.seed,6),r=Math.pow(n,1.6);return o.y+(r-0.25)*o.height*2}
s.dirty=true
},
height:(x,z)=>s.h3?s.h3(+x,+z):0,
clear:()=>{s.h3=null;s.t3=null;s.dirty=true}
}
},
update(g,c,s,dt){
if(!g.is3d||!s.h3)return
for(const e of g.entities){if(!e.alive||e.body!=='dynamic'||e.par)continue;const h=s.h3(e.x,e.z),b=e.y-e.h/2;if(b<h){e.y=h+e.h/2;if(e.vy<0)e.vy=0;e.grounded=true}}
},
render3(g,c,s,r){
if(!s.dirty)return
s.dirty=false
const T=r.T
if(s.mesh){r.scene.remove(s.mesh);s.mesh.geometry.dispose();s.mesh=null}
const o=s.t3
if(!o)return
const geo=new T.PlaneGeometry(o.size,o.size,o.res,o.res).rotateX(-Math.PI/2),p=geo.attributes.position,col=new Float32Array(p.count*3),cl=new T.Color()
const C=[[-1e9,'#c9b27c'],[o.y+o.height*0.05,'#5f9e4f'],[o.y+o.height*0.6,'#4f7f3f'],[o.y+o.height*0.95,'#7d7568'],[o.y+o.height*1.35,'#f2f4f7']]
for(let i=0;i<p.count;i++){const x=p.getX(i)+o.x,z=p.getZ(i)+o.z,h=s.h3(x,z);p.setY(i,h);let k=C[0][1];for(const q of C)if(h>=q[0])k=q[1];cl.set(k);const n=(s.fbm(x*0.3,z*0.3,7,2)-0.5)*0.12;col[i*3]=cl.r+n;col[i*3+1]=cl.g+n;col[i*3+2]=cl.b+n}
geo.setAttribute('color',new T.BufferAttribute(col,3))
geo.computeVertexNormals()
s.mesh=new T.Mesh(geo,new T.MeshStandardMaterial({vertexColors:true,roughness:0.92,metalness:0}))
s.mesh.position.set(o.x,0,o.z)
s.mesh.receiveShadow=true;s.mesh.castShadow=true
r.scene.add(s.mesh)
},
scene(g,c,s){if(s.mesh&&g.r3)g.r3.scene.remove(s.mesh);s.mesh=null;s.h3=null;s.t3=null}
})
