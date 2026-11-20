VueExt.register({id:'shadows',name:'Advanced Shadows',ns:'shadows',cat:'Rendering',icon:'sun',version:'1.0.0',example:"export function start() {\nvue.shadows.range(60)\nvue.shadows.softness(6)\n}",modes:'3d',desc:'Soft variance shadows at up to 4096px that follow the camera, shadow-casting point lights and per-object control. Crisp up close, soft at the edges, no acne.',defaults:{size:4096,range:40,softness:4,pointShadows:true},
api(g,c,s){return{range:v=>{c.range=+v},softness:v=>{c.softness=+v;s.ok=false},cast:(e,on)=>{e=typeof e==='string'?g.vue.find(e):e;if(e&&g.r3){const m=g.r3.meshOf(e);if(m)m.castShadow=on!==false}}}},
render3(g,c,s,r){
const T=r.T,sun=r.sun
if(!s.ok){
s.ok=true
r.r.shadowMap.type=T.VSMShadowMap
r.r.shadowMap.needsUpdate=true
sun.shadow.mapSize.set(c.size,c.size)
if(sun.shadow.map){sun.shadow.map.dispose();sun.shadow.map=null}
sun.shadow.radius=c.softness
sun.shadow.blurSamples=16
sun.shadow.bias=-0.0002
sun.shadow.normalBias=0.02
}
const cam=sun.shadow.camera,R=c.range
if(cam.right!==R){cam.left=-R;cam.right=R;cam.top=R;cam.bottom=-R;cam.far=R*4;cam.updateProjectionMatrix()}
if(c.pointShadows)for(const m of r.map.values())if(m.isPointLight&&!m.castShadow){m.castShadow=true;m.shadow.mapSize.set(512,512);m.shadow.radius=c.softness;m.shadow.bias=-0.002}
}
})
