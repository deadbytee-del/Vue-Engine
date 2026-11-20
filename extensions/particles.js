VueExt.register({id:'particles',name:'Particle FX',ns:'fx',cat:'Effects',icon:'sparkles',version:'1.0.0',example:"export function start() {\nvue.fx.emitter('fire', { follow: self, oy: -10 })\n}\nexport function click() {\nvue.fx.burst(self.x, self.y, 'explosion')\n}",desc:'GPU-friendly particle systems for 2D and 3D: continuous emitters and one-shot bursts with gravity, drag, size and color over life, additive glow and presets for fire, smoke, sparks, magic, explosions and dust.',defaults:{max:20000},
api(g,c,s){
const N=c.max
s.n=0;s.x=new Float32Array(N);s.y=new Float32Array(N);s.z=new Float32Array(N);s.vx=new Float32Array(N);s.vy=new Float32Array(N);s.vz=new Float32Array(N);s.l=new Float32Array(N);s.L=new Float32Array(N);s.s0=new Float32Array(N);s.s1=new Float32Array(N);s.g=new Float32Array(N);s.dr=new Float32Array(N);s.c0=new Uint32Array(N);s.c1=new Uint32Array(N);s.ad=new Uint8Array(N)
s.em=[]
const d3=()=>g.is3d
const P={
fire:{rate:60,life:[0.5,0.9],speed:[30,80],angle:-90,spread:25,gravity:-60,drag:1,size:[14,2],color:['#ffd34d','#ff4d1a'],add:1},
smoke:{rate:20,life:[1.4,2.4],speed:[15,40],angle:-90,spread:30,gravity:-20,drag:0.6,size:[10,34],color:['#8a8f98','#2a2d33'],add:0,alpha:0.5},
sparks:{count:30,life:[0.3,0.7],speed:[160,380],spread:360,gravity:500,drag:0.5,size:[3,1],color:['#fff6c2','#ff9f43'],add:1},
magic:{rate:40,life:[0.6,1.2],speed:[10,50],spread:360,gravity:-30,drag:1.5,size:[6,0],color:['#c9a6ff','#4cc9f0'],add:1},
explosion:{count:80,life:[0.4,1],speed:[80,420],spread:360,gravity:120,drag:2.2,size:[18,4],color:['#fff1a8','#ff3d00'],add:1},
dust:{count:16,life:[0.4,0.8],speed:[20,70],angle:-90,spread:160,gravity:40,drag:2,size:[6,12],color:['#c8b89a','#8a7a5c'],add:0,alpha:0.6},
snow:{rate:30,life:[3,5],speed:[10,30],angle:90,spread:40,gravity:12,drag:0.2,size:[3,3],color:['#ffffff','#dff3ff'],add:0}
}
const k3=o=>{if(!d3())return o;const q=Object.assign({},o);const sc=1/40;q.speed=o.speed.map(v=>v*sc);q.gravity=(o.gravity||0)*sc;q.size=o.size.map(v=>v*sc*1.5);return q}
const col=h=>{h=String(h||'#ffffff').replace('#','');if(h.length===3)h=h.split('').map(x=>x+x).join('');return parseInt(h,16)>>>0}
const R=(a)=>Array.isArray(a)?a[0]+Math.random()*(a[1]-a[0]):+a
const opts=(p,o)=>{const b=typeof p==='string'?P[p]||{}:p||{};return k3(Object.assign({life:[0.5,1],speed:[40,120],angle:-90,spread:360,gravity:0,drag:0,size:[8,0],color:['#ffffff','#ffffff'],add:1},b,o||{}))}
const emit=(o,x,y,z)=>{
if(s.n>=N)return
const i=s.n++,a=((o.angle||0)+(Math.random()-0.5)*(o.spread||0))*Math.PI/180,sp=R(o.speed)
s.x[i]=x;s.y[i]=y;s.z[i]=z||0
if(d3()){let dx,dy,dz;if((o.spread||0)>=360){const u=Math.random()*2-1,th=Math.random()*6.2832,q=Math.sqrt(1-u*u);dx=q*Math.cos(th);dy=u;dz=q*Math.sin(th)}else{const hh=(o.spread||0)/2*Math.PI/180*Math.random(),th=Math.random()*6.2832,up=o.angle==null||o.angle<0?1:-1;dx=Math.sin(hh)*Math.cos(th);dz=Math.sin(hh)*Math.sin(th);dy=Math.cos(hh)*up}s.vx[i]=dx*sp;s.vy[i]=dy*sp;s.vz[i]=dz*sp}
else{s.vx[i]=Math.cos(a)*sp;s.vy[i]=Math.sin(a)*sp;s.vz[i]=0}
s.L[i]=s.l[i]=R(o.life);s.s0[i]=o.size[0];s.s1[i]=o.size[1]==null?o.size[0]:o.size[1];s.g[i]=o.gravity||0;s.dr[i]=o.drag||0
const cs=Array.isArray(o.color)?o.color:[o.color,o.color];s.c0[i]=col(cs[0]);s.c1[i]=col(cs[1]||cs[0]);s.ad[i]=o.add?1:0
}
s.emit=emit
return{
presets:Object.keys(P),
burst:(x,y,z,p,o)=>{if(typeof z==='string'||typeof z==='object'&&z!==null){o=p;p=z;z=0}const q=opts(p||'sparks',o),n=q.count||24;for(let i=0;i<n;i++)emit(q,x,y,z)},
emitter:(p,o)=>{const q=opts(p||'fire',o),h={q,x:q.x||0,y:q.y||0,z:q.z||0,follow:q.follow?(typeof q.follow==='string'?g.vue.find(q.follow):q.follow):null,on:true,acc:0,rate:q.rate||30,stop(){h.on=false},start(){h.on=true},remove(){h.on=false;s.em=s.em.filter(e=>e!==h)}};s.em.push(h);return h},
clear:()=>{s.n=0;s.em=[]},
get count(){return s.n}
}
},
update(g,c,s,dt){
for(const h of s.em){
if(!h.on)continue
if(h.follow){if(!h.follow.alive){h.on=false;continue}h.x=h.follow.x+(h.q.ox||0);h.y=h.follow.y+(h.q.oy||0);h.z=h.follow.z}
h.acc+=h.rate*dt
while(h.acc>=1){h.acc--;s.emit(h.q,h.x,h.y,h.z)}
}
const d3=g.is3d
let n=s.n
for(let i=0;i<n;i++){
s.l[i]-=dt
if(s.l[i]<=0){n--;if(i!==n){for(const k of['x','y','z','vx','vy','vz','l','L','s0','s1','g','dr','c0','c1','ad'])s[k][i]=s[k][n]}i--;continue}
const k=1-Math.min(1,s.dr[i]*dt)
s.vx[i]*=k;s.vy[i]*=k;s.vz[i]*=k
if(d3)s.vy[i]-=s.g[i]*dt;else s.vy[i]+=s.g[i]*dt
s.x[i]+=s.vx[i]*dt;s.y[i]+=s.vy[i]*dt;s.z[i]+=s.vz[i]*dt
}
s.n=n
},
world(g,c,s,ctx){
const mix=(a,b,t)=>{const r=((a>>16)&255)*(1-t)+((b>>16)&255)*t,gg=((a>>8)&255)*(1-t)+((b>>8)&255)*t,bb=(a&255)*(1-t)+(b&255)*t;return'rgb('+(r|0)+','+(gg|0)+','+(bb|0)+')'}
let mode=''
for(let i=0;i<s.n;i++){
const t=1-s.l[i]/s.L[i],sz=s.s0[i]+(s.s1[i]-s.s0[i])*t
if(sz<=0.2)continue
const m=s.ad[i]?'lighter':'source-over'
if(m!==mode){ctx.globalCompositeOperation=m;mode=m}
ctx.globalAlpha=Math.min(1,(1-t)*1.6)*(s.ad[i]?0.9:0.6)
ctx.fillStyle=mix(s.c0[i],s.c1[i],t)
ctx.beginPath();ctx.arc(s.x[i],s.y[i],sz/2,0,6.2832);ctx.fill()
}
ctx.globalCompositeOperation='source-over';ctx.globalAlpha=1
},
render3(g,c,s,r){
const T=r.T,N=c.max
if(!s.pts){
s.geo=new T.BufferGeometry()
s.pos=new Float32Array(N*3);s.colr=new Float32Array(N*4);s.sz=new Float32Array(N)
s.geo.setAttribute('position',new T.BufferAttribute(s.pos,3));s.geo.setAttribute('c',new T.BufferAttribute(s.colr,4));s.geo.setAttribute('s',new T.BufferAttribute(s.sz,1))
s.mat=new T.ShaderMaterial({transparent:true,depthWrite:false,blending:T.AdditiveBlending,vertexShader:'attribute vec4 c;attribute float s;varying vec4 vc;void main(){vc=c;vec4 mv=modelViewMatrix*vec4(position,1.);gl_PointSize=s*600./-mv.z;gl_Position=projectionMatrix*mv;}',fragmentShader:'varying vec4 vc;void main(){float d=length(gl_PointCoord-.5);if(d>.5)discard;gl_FragColor=vec4(vc.rgb,vc.a*smoothstep(.5,.15,d));}'})
s.pts=new T.Points(s.geo,s.mat);s.pts.frustumCulled=false;r.scene.add(s.pts)
}
if(s.pts.parent!==r.scene)r.scene.add(s.pts)
for(let i=0;i<s.n;i++){
const t=1-s.l[i]/s.L[i],a=s.c0[i],b=s.c1[i]
s.pos[i*3]=s.x[i];s.pos[i*3+1]=s.y[i];s.pos[i*3+2]=s.z[i]
s.colr[i*4]=(((a>>16)&255)*(1-t)+((b>>16)&255)*t)/255;s.colr[i*4+1]=(((a>>8)&255)*(1-t)+((b>>8)&255)*t)/255;s.colr[i*4+2]=((a&255)*(1-t)+(b&255)*t)/255;s.colr[i*4+3]=Math.min(1,(1-t)*1.6)
s.sz[i]=s.s0[i]+(s.s1[i]-s.s0[i])*t
}
s.geo.setDrawRange(0,s.n)
s.geo.attributes.position.needsUpdate=s.geo.attributes.c.needsUpdate=s.geo.attributes.s.needsUpdate=true
},
scene(g,c,s){s.n=0;s.em=[]}
})
