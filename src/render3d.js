(function(root){
const D=Math.PI/180
class Render3D{
constructor(T,parent,before){
this.T=T
this.r=new T.WebGLRenderer({antialias:true})
this.r.shadowMap.enabled=true
this.r.shadowMap.type=T.PCFSoftShadowMap
this.r.outputEncoding=T.sRGBEncoding
this.el=this.r.domElement
this.el.className='gl'
parent.insertBefore(this.el,before||null)
this.scene=new T.Scene()
this.cam=new T.PerspectiveCamera(70,1,0.1,800)
this.hemi=new T.HemisphereLight(0xffffff,0x4a5568,0.75)
this.sun=new T.DirectionalLight(0xffffff,0.9)
this.sun.castShadow=true
this.sun.shadow.mapSize.set(2048,2048)
const sc=this.sun.shadow.camera
sc.left=-45;sc.right=45;sc.top=45;sc.bottom=-45;sc.near=1;sc.far=160
this.sun.shadow.bias=-0.0004
this.scene.add(this.hemi,this.sun,this.sun.target)
this.map=new Map()
this.geo={box:new T.BoxGeometry(1,1,1),sphere:new T.SphereGeometry(0.5,28,18),cylinder:new T.CylinderGeometry(0.5,0.5,1,28),cone:new T.ConeGeometry(0.5,1,28),plane:new T.PlaneGeometry(1,1).rotateX(-Math.PI/2)}
this.tex=new Map()
this.ray=new T.Raycaster()
this.bg=''
this.helper=null
this.editor=false
this.dpr=1
}
resize(w,h){
this.dpr=Math.min(2,(root.devicePixelRatio||1))
this.r.setPixelRatio(this.dpr)
this.r.setSize(w,h,false)
this.cam.aspect=w/h
this.cam.updateProjectionMatrix()
}
setEditor(on){
if(on===this.editor)return
this.editor=on
if(on&&!this.grid){
const T=this.T,g=new T.Group()
const minor=new T.GridHelper(400,400,0x241f33,0x241f33)
const major=new T.GridHelper(400,40,0x3a3050,0x3a3050)
for(const h of[minor,major]){h.material.transparent=true;h.material.opacity=h===minor?0.55:0.9;h.material.depthWrite=false;g.add(h)}
const ax=(a,b,c)=>{const geo=new T.BufferGeometry().setFromPoints([a,b]);const l=new T.Line(geo,new T.LineBasicMaterial({color:c,transparent:true,opacity:0.7,depthWrite:false}));l.position.y=0.002;g.add(l)}
ax(new T.Vector3(-200,0,0),new T.Vector3(200,0,0),0xff4d6a)
ax(new T.Vector3(0,0,-200),new T.Vector3(0,0,200),0x4d8dff)
g.renderOrder=-1
this.grid=g
this.scene.add(g)
}
if(this.grid)this.grid.visible=on
}
texture(game,name){
const im=game.images[name]
if(!im)return null
let t=this.tex.get(name)
if(!t||t.image!==im){
t=new this.T.Texture(im)
t.encoding=this.T.sRGBEncoding
t.wrapS=t.wrapT=this.T.RepeatWrapping
t.needsUpdate=true
this.tex.set(name,t)
}
return t
}
make(e){
const T=this.T
let m
if(e.shape==='light'){
m=new T.PointLight(0xffffff,1.2,20,1.5)
if(this.editor){
const s=new T.Mesh(new T.SphereGeometry(0.3,12,8),new T.MeshBasicMaterial({color:0xffe066}))
m.add(s)
}
}else{
m=new T.Mesh(this.geo[e.shape]||this.geo.box,new T.MeshStandardMaterial({color:0xffffff,roughness:0.7,metalness:0.05}))
m.castShadow=e.shape!=='plane'
m.receiveShadow=true
}
m.userData.e=e
m.userData.shape=e.shape
this.scene.add(m)
return m
}
meshOf(e){return this.map.get(e)||null}
remove(e){
const m=this.map.get(e)
if(!m)return
this.scene.remove(m)
if(m.material)m.material.dispose()
if(this.helper&&this.helper.userData.m===m){this.scene.remove(this.helper);this.helper=null}
this.map.delete(e)
}
sync(game){
const seen=new Set(),es=game.entities
for(let i=0;i<es.length;i++){
const e=es[i]
if(!e.alive)continue
let m=this.map.get(e)
if(!m||m.userData.shape!==e.shape){
if(m)this.remove(e)
m=this.make(e)
this.map.set(e,m)
}
seen.add(e)
m.position.set(e.x,e.y,e.z)
m.rotation.set(e.rx*D,e.ry*D,e.rz*D,'YXZ')
const ghost=this.editor&&(e.prefab||!e.visible)
m.visible=e.visible||this.editor
if(e.shape==='light'){
if(m.userData.c!==e.color){m.color.set(e.color);m.userData.c=e.color}
m.intensity=e.alpha*1.6
m.distance=e.w||20
continue
}
m.scale.set(e.w,e.shape==='plane'?1:e.h,e.d)
const mat=m.material
if(m.userData.c!==e.color){mat.color.set(e.color);m.userData.c=e.color}
if(m.userData.i!==e.image){
const t=e.image?this.texture(game,e.image):null
mat.map=t
mat.needsUpdate=true
m.userData.i=e.image
}
const a=e.alpha*(ghost?0.4:1)
const tr=a<1
if(mat.transparent!==tr){mat.transparent=tr;mat.needsUpdate=true}
mat.opacity=a
}
for(const e of Array.from(this.map.keys()))if(!seen.has(e))this.remove(e)
}
setSelection(e){
const m=e?this.map.get(e):null
if(this.helper&&(!m||this.helper.userData.m!==m)){this.scene.remove(this.helper);this.helper=null}
if(m&&!this.helper){
this.helper=new this.T.BoxHelper(m,0x9d5cff)
this.helper.material.depthTest=false
this.helper.renderOrder=999
this.helper.userData.m=m
this.scene.add(this.helper)
}
}
render(c,bg){
const T=this.T
if(bg!==this.bg){this.scene.background=new T.Color(bg);this.scene.fog=this.editor?null:new T.Fog(new T.Color(bg),60,220);this.bg=bg}
if(this.grid)this.grid.visible=this.editor&&this.gridOn!==false
const cam=this.cam
cam.fov=c.fov||70
cam.position.set(c.x,c.y,c.z)
cam.lookAt(c.tx,c.ty,c.tz)
cam.updateProjectionMatrix()
this.sun.position.set(c.tx+22,c.ty+40,c.tz+14)
this.sun.target.position.set(c.tx,c.ty,c.tz)
if(this.helper)this.helper.update()
this.r.render(this.scene,cam)
}
pick(px,py,w,h){
this.ray.setFromCamera({x:px/w*2-1,y:-(py/h)*2+1},this.cam)
const list=[]
for(const m of this.map.values())if(m.visible)list.push(m)
const hits=this.ray.intersectObjects(list,true)
for(const hit of hits){
let o=hit.object
while(o&&!o.userData.e)o=o.parent
if(o&&o.userData.e)return o.userData.e
}
return null
}
ground(px,py,w,h,y){
this.ray.setFromCamera({x:px/w*2-1,y:-(py/h)*2+1},this.cam)
const o=this.ray.ray.origin,d=this.ray.ray.direction
if(Math.abs(d.y)<1e-5)return null
const t=(y-o.y)/d.y
if(t<0)return null
return{x:o.x+d.x*t,z:o.z+d.z*t}
}
}
const api=Render3D
if(typeof module!=='undefined'&&module.exports)module.exports=api
else root.VueRender3D=api
})(typeof window!=='undefined'?window:globalThis);
