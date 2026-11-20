VueExt.register({id:'water',name:'Advanced Water',ns:'water',cat:'World',icon:'waves',version:'1.0.0',example:"// Tag a box or rectangle \"water\" in the Inspector\nexport function update(dt: number) {\nif (self.wet) vue.hud('Status', 'Swimming')\n}",desc:'Tag any entity "water" to turn it into animated water. 3D gets layered waves, Fresnel reflections, sun glints and foam; 2D gets a rolling surface and bubbles. Bodies inside float, drift and slow down.',defaults:{tag:'water',color:'#1f7fbf',deep:'#0a3a63',waves:1,buoyancy:1,drag:2.5},
api(g,c,s){return{waves:v=>{c.waves=+v},color:(a,b)=>{c.color=a;if(b)c.deep=b;s.re=true},surface:(x,z)=>s.level?s.level(x,z):null}},
update(g,c,s,dt){
const ws=g.vue.all(c.tag)
if(!ws.length)return
const t=g.time,d3=g.is3d
s.level=(x,z)=>{for(const w of ws){const inX=Math.abs(x-w.x)<=w.w/2,inZ=d3?Math.abs((z||0)-w.z)<=w.d/2:true;if(inX&&inZ){const top=d3?w.y+w.h/2:w.y-w.h/2;return top+c.waves*(d3?0.12:4)*Math.sin(x*(d3?0.6:0.035)+t*(d3?1.6:2))}}return null}
for(const e of g.entities){
if(!e.alive||e.body!=='dynamic')continue
for(const w of ws){
if(Math.abs(e.x-w.x)>(w.w+e.w)/2||Math.abs(e.y-w.y)>(w.h+e.h)/2||(d3&&Math.abs(e.z-w.z)>(w.d+e.d)/2))continue
const lv=s.level(e.x,e.z)
const sub=d3?Math.min(1,Math.max(0,(lv-(e.y-e.h/2))/e.h)):Math.min(1,Math.max(0,((e.y+e.h/2)-lv)/e.h))
if(sub<=0)continue
const gv=g.gravity*e.gravityScale
if(d3){e.vy+=gv*sub*1.6*c.buoyancy*dt;e.vz*=1-Math.min(1,c.drag*sub*dt)}else e.vy-=gv*sub*1.6*c.buoyancy*dt
e.vx*=1-Math.min(1,c.drag*sub*dt);e.vy*=1-Math.min(1,c.drag*sub*dt)
e.wet=true
break
}
}
},
world(g,c,s,ctx){
const t=g.time
for(const w of g.vue.all(c.tag)){
if(!w.visible)continue
const x0=w.x-w.w/2,x1=w.x+w.w/2,y0=w.y-w.h/2,y1=w.y+w.h/2,A=4*c.waves
const gr=ctx.createLinearGradient(0,y0,0,y1);gr.addColorStop(0,c.color);gr.addColorStop(1,c.deep)
ctx.globalAlpha=0.82;ctx.fillStyle=gr
ctx.beginPath();ctx.moveTo(x0,y1)
for(let x=x0;x<=x1+0.1;x+=6)ctx.lineTo(x,y0+A*Math.sin(x*0.035+t*2)+A*0.5*Math.sin(x*0.09-t*3.1))
ctx.lineTo(x1,y1);ctx.closePath();ctx.fill()
ctx.globalAlpha=0.7;ctx.strokeStyle='#cfefff';ctx.lineWidth=2;ctx.beginPath()
for(let x=x0;x<=x1+0.1;x+=6){const y=y0+A*Math.sin(x*0.035+t*2)+A*0.5*Math.sin(x*0.09-t*3.1);if(x===x0)ctx.moveTo(x,y);else ctx.lineTo(x,y)}
ctx.stroke()
ctx.fillStyle='#e6f7ff'
for(let i=0;i<Math.min(40,w.w/18);i++){const bx=x0+((i*97.3)%w.w),ph=(t*0.35+i*0.137)%1,by=y1-ph*(w.h-8);ctx.globalAlpha=0.35*(1-ph);ctx.beginPath();ctx.arc(bx+Math.sin(t*3+i)*3,by,1.5+(i%3),0,7);ctx.fill()}
ctx.globalAlpha=1
}
},
render3(g,c,s,r){
const T=r.T
if(!s.mat||s.re){
s.re=false
s.mat=new T.ShaderMaterial({transparent:true,uniforms:{t:{value:0},a:{value:new T.Color(c.color)},b:{value:new T.Color(c.deep)},sun:{value:new T.Vector3()},cp:{value:new T.Vector3()},amp:{value:c.waves}},
vertexShader:'uniform float t;uniform float amp;varying vec3 wp;varying vec3 n;float h(vec2 p){return amp*(.12*sin(p.x*.6+t*1.6)+.08*sin(p.y*.8+t*1.3+p.x*.2)+.04*sin((p.x+p.y)*1.7+t*2.7));}void main(){vec4 w=modelMatrix*vec4(position,1.);float e=.05;float hh=h(w.xz);w.y+=hh;n=normalize(vec3(-(h(w.xz+vec2(e,0.))-hh)/e,1.,-(h(w.xz+vec2(0.,e))-hh)/e));wp=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}',
fragmentShader:'uniform vec3 a;uniform vec3 b;uniform vec3 sun;uniform vec3 cp;uniform float t;varying vec3 wp;varying vec3 n;void main(){vec3 v=normalize(cp-wp);float f=pow(1.-max(dot(n,v),0.),3.);vec3 sky=vec3(.65,.8,.95);vec3 c=mix(b,a,.5+.5*n.y)+sky*f*.6;vec3 hv=normalize(normalize(sun)+v);c+=vec3(1.,.95,.8)*pow(max(dot(n,hv),0.),180.)*2.;float fo=smoothstep(.93,1.,sin(wp.x*1.3+t*1.7)*sin(wp.z*1.1-t*1.2))*.5;c+=fo;gl_FragColor=vec4(c,.78+f*.2);}'})
for(const m of(s.ms||new Map()).values())r.scene.remove(m)
s.ms=new Map()
}
s.mat.uniforms.t.value=g.time
s.mat.uniforms.amp.value=c.waves
s.mat.uniforms.sun.value.copy(r.sun.position).sub(r.sun.target.position)
s.mat.uniforms.cp.value.copy(r.cam.position)
const seen=new Set()
for(const w of g.vue.all(c.tag)){
seen.add(w)
let m=s.ms.get(w)
if(!m){const seg=Math.max(8,Math.min(160,Math.round(Math.max(w.w,w.d)*2)));m=new T.Mesh(new T.PlaneGeometry(1,1,seg,seg).rotateX(-Math.PI/2),s.mat);m.renderOrder=2;r.scene.add(m);s.ms.set(w,m)}
m.position.set(w.x,w.y+w.h/2,w.z);m.scale.set(w.w,1,w.d);m.visible=w.visible
const em=r.meshOf(w);if(em)em.visible=false
}
for(const[w,m]of s.ms)if(!seen.has(w)){r.scene.remove(m);m.geometry.dispose();s.ms.delete(w)}
},
scene(g,c,s){if(s.ms&&g.r3)for(const m of s.ms.values())g.r3.scene.remove(m);s.ms=new Map()}
})
