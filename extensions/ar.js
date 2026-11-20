globalThis.VUE_GL_ALPHA=true
VueExt.register({id:'ar',name:'AR',ns:'ar',cat:'XR',icon:'scan',version:'1.0.0',example:"export function start() {\nvue.ar.scale(30)\n}\nexport function update(dt: number) {\nif (vue.ar.placed) self.ry += 40 * dt\n}",modes:'3d',desc:'Places your 3D scene on real tables and floors through WebXR augmented reality on Android phones and AR headsets. Tap to anchor the world, then play on top of the real room.',defaults:{scale:20},
api(g,c,s){
return{
get supported(){return!!s.ok},
get active(){return!!s.sess},
get surface(){return s.hit?{x:s.hit.x,y:s.hit.y,z:s.hit.z}:null},
get placed(){return!!s.placed},
enter:()=>s.start&&s.start(),
exit:()=>{if(s.sess)s.sess.end()},
place:()=>{if(s.hit){s.anchor=s.hit.clone();s.placed=true}},
scale:v=>{c.scale=+v||1}
}
},
init(g,c,s){
const xr=globalThis.navigator&&navigator.xr
if(!xr||!g.r3)return
s.start=()=>{
if(s.sess)return
xr.requestSession('immersive-ar',{requiredFeatures:['hit-test'],optionalFeatures:['local-floor','dom-overlay'],domOverlay:globalThis.document?{root:document.body}:undefined}).then(async ss=>{
const r=g.r3
r.r.xr.enabled=true
r.r.xr.setReferenceSpaceType('local')
s.sess=ss
await r.r.xr.setSession(ss)
const vs=await ss.requestReferenceSpace('viewer')
s.src=await ss.requestHitTestSource({space:vs})
ss.addEventListener('select',()=>{if(!s.placed)g.vue.ar.place();else{g.vkey('space',true);setTimeout(()=>g.vkey('space',false),120)}})
g.xrLoop=true
r.r.setAnimationLoop((t,f)=>{s.frame=f;g.loop(t)})
if(s.btn)s.btn.style.display='none'
ss.addEventListener('end',()=>{s.sess=null;s.src=null;s.placed=false;g.xrLoop=false;r.r.setAnimationLoop(null);r.skyLock=false;r.bg='';g.raf=requestAnimationFrame(g.loop);if(s.btn)s.btn.style.display=''})
}).catch(e=>g.log('warn','AR could not start: '+(e&&e.message||e)))
}
xr.isSessionSupported('immersive-ar').then(ok=>{
s.ok=ok
if(!ok||!globalThis.document)return
const b=document.createElement('button')
b.textContent='Start AR'
b.style.cssText='position:fixed;left:50%;bottom:18px;transform:translateX(-50%);z-index:20;padding:10px 22px;border:1px solid rgba(255,255,255,.35);border-radius:999px;background:rgba(17,15,25,.82);color:#fff;font:600 14px Inter,system-ui,sans-serif;cursor:pointer'
b.onclick=()=>s.start()
document.body.appendChild(b)
s.btn=b
}).catch(()=>{})
},
render3(g,c,s,r){
const T=r.T
if(!s.rig){s.rig=new T.Group();r.scene.add(s.rig);s.rig.add(r.cam);s.ret=new T.Mesh(new T.RingGeometry(0.06,0.08,32).rotateX(-Math.PI/2),new T.MeshBasicMaterial({color:0xffffff}));s.ret.visible=false;r.scene.add(s.ret)}
if(!s.sess){s.rig.position.set(0,0,0);s.rig.scale.setScalar(1);s.ret.visible=false;return}
r.skyLock=true
r.scene.background=null
r.scene.fog=null
s.rig.scale.setScalar(c.scale)
const f=s.frame,ref=r.r.xr.getReferenceSpace()
if(f&&s.src&&ref){const hs=f.getHitTestResults(s.src);if(hs.length){const p=hs[0].getPose(ref).transform.position;s.hit=new T.Vector3(p.x,p.y,p.z)}else s.hit=null}
const a=s.anchor||new T.Vector3(0,-1,-1.5)
s.rig.position.set(-a.x*c.scale,-a.y*c.scale,-a.z*c.scale)
if(s.hit&&!s.placed){s.ret.visible=true;s.ret.position.copy(s.hit).multiplyScalar(c.scale).add(s.rig.position);s.ret.scale.setScalar(c.scale)}else s.ret.visible=false
}
})
