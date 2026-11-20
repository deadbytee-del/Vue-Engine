VueExt.register({id:'vr',name:'VR',ns:'xr',cat:'XR',icon:'glasses',version:'1.0.0',example:"export function start() {\nvue.follow(self, 6, 1.6)\n}\nexport function update(dt: number) {\nconst r = vue.xr.controller(1)\nif (r && r.trigger > 0.5) vue.emit('fire')\n}",modes:'3d',desc:'Play 3D scenes in a headset through WebXR. PC VR headsets run through their OpenXR runtime (SteamVR, Meta Link, Windows Mixed Reality) and standalone headsets run it in their browser. Controllers drive WASD, jump and turning.',defaults:{snapTurn:30,eye:1.6,moveKeys:true},
api(g,c,s){
s.ctl=[];s.yaw=0
return{
get supported(){return!!s.ok},
get active(){return!!s.sess},
enter:()=>s.start&&s.start(),
exit:()=>{if(s.sess)s.sess.end()},
controller:i=>s.ctl[i||0]||null,
get head(){const r=g.r3;if(!r||!s.sess)return null;const p=new r.T.Vector3();r.r.xr.getCamera().getWorldPosition(p);return{x:p.x,y:p.y,z:p.z}},
get yaw(){return s.yaw},
get _rig(){return s.rig}
}
},
init(g,c,s){
const xr=globalThis.navigator&&navigator.xr
if(!xr||!g.r3)return
s.start=()=>{
if(s.sess)return
xr.requestSession('immersive-vr',{optionalFeatures:['local-floor','bounded-floor','hand-tracking']}).then(ss=>{
const r=g.r3
r.r.xr.enabled=true
r.r.xr.setReferenceSpaceType('local-floor')
s.sess=ss
r.r.xr.setSession(ss)
g.xrLoop=true
r.r.setAnimationLoop(t=>g.loop(t))
if(s.btn)s.btn.textContent='Exit VR'
ss.addEventListener('end',()=>{s.sess=null;g.xrLoop=false;r.r.setAnimationLoop(null);g.raf=requestAnimationFrame(g.loop);if(s.btn)s.btn.textContent='Enter VR';for(const k of Array.from(s.vk||[]))g.vkey(k,false);s.vk=new Set()})
}).catch(e=>g.log('warn','VR could not start: '+(e&&e.message||e)))
}
xr.isSessionSupported('immersive-vr').then(ok=>{
s.ok=ok
if(!ok||!globalThis.document)return
const b=document.createElement('button')
b.textContent='Enter VR'
b.style.cssText='position:fixed;left:50%;bottom:18px;transform:translateX(-50%);z-index:20;padding:10px 22px;border:1px solid rgba(255,255,255,.35);border-radius:999px;background:rgba(17,15,25,.82);color:#fff;font:600 14px Inter,system-ui,sans-serif;cursor:pointer;backdrop-filter:blur(8px)'
b.onclick=()=>s.sess?s.sess.end():s.start()
document.body.appendChild(b)
s.btn=b
}).catch(()=>{})
},
render3(g,c,s,r){
const T=r.T
if(!s.rig){s.rig=new T.Group();r.scene.add(s.rig);s.rig.add(r.cam);s.cs=[0,1].map(i=>{const k=r.r.xr.getController(i);s.rig.add(k);const m=new T.Mesh(new T.BoxGeometry(0.04,0.04,0.14),new T.MeshStandardMaterial({color:0x9d5cff,roughness:0.4}));m.position.z=-0.04;k.add(m);return k})}
if(!s.sess){s.rig.position.set(0,0,0);s.rig.rotation.set(0,0,0);return}
const f=g.camera.follow
if(f&&f.alive)s.rig.position.set(f.x,f.y-f.h/2,f.z)
else s.rig.position.set(g.camera.x,g.camera.y-c.eye,g.camera.z)
s.rig.rotation.set(0,s.yaw,0)
s.vk=s.vk||new Set()
const want=new Set(),ctl=[]
for(const src of s.sess.inputSources){
const gp=src.gamepad
if(!gp)continue
const hand=src.handedness==='right'?1:0,ax=gp.axes,bt=gp.buttons
const x=ax[2]||0,y=ax[3]||0
const k=s.cs[hand],p=new T.Vector3()
if(k)k.getWorldPosition(p)
ctl[hand]={x:p.x,y:p.y,z:p.z,trigger:bt[0]?bt[0].value:0,squeeze:bt[1]?bt[1].value:0,stickX:x,stickY:y,a:!!(bt[4]&&bt[4].pressed),b:!!(bt[5]&&bt[5].pressed)}
if(hand===0&&c.moveKeys){if(x<-0.5)want.add('a');if(x>0.5)want.add('d');if(y<-0.5)want.add('w');if(y>0.5)want.add('s')}
if(hand===1){
if(Math.abs(x)>0.7){if(!s.turned){s.yaw-=Math.sign(x)*c.snapTurn*Math.PI/180;s.turned=true}}else s.turned=false
if(bt[4]&&bt[4].pressed)want.add('space')
if(bt[0]&&bt[0].pressed)want.add('enter')
}
}
s.ctl=ctl
for(const k of want)if(!s.vk.has(k)){s.vk.add(k);g.vkey(k,true)}
for(const k of Array.from(s.vk))if(!want.has(k)){s.vk.delete(k);g.vkey(k,false)}
}
})
