VueExt.register({id:'handtracking',name:'Hand Tracking',ns:'hands',cat:'XR',icon:'hand',version:'1.0.0',example:"export function update(dt: number) {\nif (vue.hands.pinch('right')) {\nconst p = vue.hands.tip('right', 'index')\nif (p) { self.x = p.x; self.y = p.y; self.z = p.z }\n}\n}",modes:'3d',requires:['vr'],desc:'Tracks both hands in VR with all 25 joints per hand. Read fingertip positions and detect pinches to grab, point and press without controllers.',defaults:{show:true,pinch:0.025},
api(g,c,s){
s.h=[null,null]
const J=(i,n)=>{const h=s.h[i==='right'||i===1?1:0];const j=h&&h.joints&&h.joints[n];if(!j||!g.r3)return null;const p=new g.r3.T.Vector3();j.getWorldPosition(p);return{x:p.x,y:p.y,z:p.z}}
return{
tracked:i=>{const h=s.h[i==='right'||i===1?1:0];return!!(h&&h.joints&&h.joints['wrist']&&h.joints['wrist'].visible)},
joint:J,
tip:(i,f)=>J(i,(f||'index')+'-finger-tip'),
pinch:i=>{const a=J(i,'thumb-tip'),b=J(i,'index-finger-tip');return!!(a&&b&&Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z)<c.pinch)}
}
},
render3(g,c,s,r){
const xr=g.vue.xr,rig=xr&&xr._rig
if(!rig||s.made)return
s.made=true
const T=r.T,geo=new T.SphereGeometry(0.008,10,8),mat=new T.MeshStandardMaterial({color:0xe8dcff,roughness:0.5})
s.h=[0,1].map(i=>{const h=r.r.xr.getHand(i);rig.add(h);h.addEventListener('connected',()=>{setTimeout(()=>{if(!c.show)return;for(const n in h.joints){const j=h.joints[n];if(!j.userData.vm){j.userData.vm=1;j.add(new T.Mesh(geo,mat))}}},300)});return h})
}
})
