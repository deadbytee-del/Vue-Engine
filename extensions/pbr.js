VueExt.register({id:'pbr',name:'PBR',ns:'pbr',cat:'Rendering',icon:'sparkles',version:'1.0.0',example:"export function start() {\nvue.pbr.material(self, { metalness: 1, roughness: 0.2 })\nvue.pbr.tag('lava', { emissive: '#ff5a1f', glow: 2 })\n}",modes:'3d',desc:'Physically based rendering: image-based sky lighting, ACES filmic tone mapping and per-object metalness, roughness and glow. Metals reflect the sky and colors stay natural in bright scenes.',defaults:{exposure:1,envIntensity:1,sky:'#9ec9ff',ground:'#4a4038'},
api(g,c,s){
s.m=new Map()
const put=(e,o)=>{s.m.set(e,Object.assign(s.m.get(e)||{},o))}
return{
material:(e,o)=>{e=typeof e==='string'?g.vue.find(e):e;if(e)put(e,o||{})},
tag:(t,o)=>{for(const e of g.vue.all(t))put(e,o||{})},
exposure:v=>{c.exposure=+v;s.dirty=true}
}
},
render3(g,c,s,r){
const T=r.T
if(!s.env||s.dirty){
s.dirty=false
r.r.toneMapping=T.ACESFilmicToneMapping
r.r.toneMappingExposure=c.exposure
const sc=new T.Scene(),geo=new T.SphereGeometry(50,32,16)
const mat=new T.ShaderMaterial({side:T.BackSide,uniforms:{a:{value:new T.Color(c.sky)},b:{value:new T.Color(c.ground)}},vertexShader:'varying vec3 p;void main(){p=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'uniform vec3 a;uniform vec3 b;varying vec3 p;void main(){float h=p.y;vec3 c=mix(b,a,smoothstep(-.2,.35,h));c+=vec3(1.,.95,.85)*pow(max(dot(p,normalize(vec3(.5,.8,.3))),0.),64.)*6.;gl_FragColor=vec4(c,1.);}'})
sc.add(new T.Mesh(geo,mat))
const pm=new T.PMREMGenerator(r.r)
if(s.env)s.env.dispose()
s.env=pm.fromScene(sc,0.02).texture
pm.dispose();geo.dispose();mat.dispose()
r.scene.environment=s.env
r.hemi.intensity=0.35
}
for(const[e,o]of s.m){
if(!e.alive){s.m.delete(e);continue}
const m=r.meshOf(e)
if(!m||!m.material)continue
const t=m.material
if(o.metalness!=null)t.metalness=+o.metalness
if(o.roughness!=null)t.roughness=+o.roughness
if(o.emissive!=null){t.emissive.set(o.emissive);t.emissiveIntensity=o.glow==null?1:+o.glow}
t.envMapIntensity=o.env==null?c.envIntensity:+o.env
}
},
scene(g,c,s){s.m.clear()}
})
