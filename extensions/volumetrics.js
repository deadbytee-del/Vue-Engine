VueExt.register({id:'volumetrics',name:'Volumetrics',ns:'volume',cat:'Rendering',icon:'cloud',version:'1.0.0',example:"export function start() {\nvue.volume.rays(1)\nvue.volume.fog(0.02)\n}",modes:'3d',desc:'Volumetric light scattering: god rays stream around anything that blocks the sun, plus exponential fog that thickens with distance. Rendered on the GPU with a radial scattering pass.',defaults:{rays:0.85,decay:0.965,density:0.012,fog:0.008,samples:60,sunColor:'#fff1d6'},
api(g,c,s){return{rays:v=>{c.rays=+v},fog:v=>{c.fog=+v},density:v=>{c.density=+v}}},
render3(g,c,s,r){
const T=r.T
if(!s.rt){
s.rt=new T.WebGLRenderTarget(256,256)
s.black=new T.MeshBasicMaterial({color:0x000000})
s.sun=new T.Mesh(new T.SphereGeometry(1,24,12),new T.MeshBasicMaterial({color:0xffffff,fog:false}))
s.oc=new T.Scene()
s.cam2=new T.OrthographicCamera(-1,1,1,-1,0,1)
s.mat=new T.ShaderMaterial({transparent:true,blending:T.AdditiveBlending,depthTest:false,depthWrite:false,uniforms:{t:{value:s.rt.texture},sp:{value:new T.Vector2(0.5,0.5)},w:{value:c.rays},dec:{value:c.decay},den:{value:c.density},col:{value:new T.Color(c.sunColor)}},vertexShader:'varying vec2 u;void main(){u=uv;gl_Position=vec4(position.xy,0.,1.);}',fragmentShader:'uniform sampler2D t;uniform vec2 sp;uniform float w;uniform float dec;uniform float den;uniform vec3 col;varying vec2 u;void main(){vec2 d=(u-sp)*den;vec2 p=u;float il=1.,a=0.;for(int i=0;i<'+(c.samples|0)+';i++){p-=d;a+=texture2D(t,p).r*il;il*=dec;}gl_FragColor=vec4(col*a*w/'+(c.samples|0)+'.,1.);}'})
s.quad=new T.Mesh(new T.PlaneGeometry(2,2),s.mat)
s.qs=new T.Scene();s.qs.add(s.quad)
}
if(!r.skyLock&&r.scene.background){const bc=r.scene.background;if(!r.scene.fog||!r.scene.fog.isFogExp2)r.scene.fog=new T.FogExp2(bc.getHex(),c.fog);r.scene.fog.color.copy(bc);r.scene.fog.density=c.fog}
s.on=true
},
screen(g,c,s){
const r=g.r3
if(!r||!s.on||!g.is3d)return
const T=r.T,cam=r.cam,sun=r.sun
const dir=new T.Vector3().subVectors(sun.position,sun.target.position).normalize()
const sp=cam.position.clone().addScaledVector(dir,300)
s.sun.position.copy(sp)
s.sun.scale.setScalar(14)
const pr=sp.clone().project(cam)
const vis=pr.z<1&&new T.Vector3(0,0,-1).applyQuaternion(cam.quaternion).dot(dir)>0
s.mat.uniforms.w.value=vis?c.rays*Math.max(0,1-Math.max(Math.abs(pr.x),Math.abs(pr.y))*0.45):0
s.mat.uniforms.den.value=c.density*60
s.mat.uniforms.dec.value=c.decay
if(!vis)return
s.mat.uniforms.sp.value.set(pr.x*0.5+0.5,pr.y*0.5+0.5)
const bg=r.scene.background,fog=r.scene.fog
r.scene.background=null;r.scene.fog=null
r.scene.add(s.sun)
const old=r.r.getRenderTarget(),cc=r.r.getClearColor(new T.Color()),ca=r.r.getClearAlpha()
r.r.setRenderTarget(s.rt);r.r.setClearColor(0x000000,1);r.r.clear()
const xr=r.r.xr.enabled;r.r.xr.enabled=false
const hid=[]
r.scene.traverse(o=>{if(o.isMesh&&o!==s.sun){if(o.visible){hid.push([o,o.material]);o.material=s.black}}})
r.r.render(r.scene,cam)
for(const[o,m]of hid)o.material=m
r.scene.remove(s.sun)
r.scene.background=bg;r.scene.fog=fog
r.r.setRenderTarget(old);r.r.setClearColor(cc,ca)
const ac=r.r.autoClear;r.r.autoClear=false
r.r.render(s.qs,s.cam2)
r.r.autoClear=ac;r.r.xr.enabled=xr
}
})
