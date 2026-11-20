VueExt.register({id:'touch',name:'Touch',ns:'touch',cat:'Input',icon:'hand',version:'1.0.0',example:"export function start() {\nvue.touch.buttons([{ key: 'space', label: 'Jump' }, { key: 'e', label: 'Use' }])\n}",desc:'On-screen joystick and buttons for phones and tablets. They press the same keys your game already uses, so mobile ports work with no script changes.',choices:{stickKeys:['wasd','arrows']},defaults:{always:false,buttons:[{key:'space',label:'A'},{key:'e',label:'B'}],stickKeys:'wasd',size:1},
api(g,c,s){
s.stick={x:0,y:0,id:null,ox:0,oy:0};s.btn={};s.vk=new Set();s.on=c.always||('ontouchstart' in globalThis)||(globalThis.navigator&&navigator.maxTouchPoints>0)
return{get stick(){return{x:s.stick.x,y:s.stick.y}},get active(){return s.on},show:v=>{s.on=!!v},buttons:b=>{c.buttons=b}}
},
init(g,c,s){
const cv=g.canvas
if(!cv||!cv.addEventListener)return
cv.style.touchAction='none'
const pt=ev=>{const r=cv.getBoundingClientRect(),k=Math.min(r.width/g.w,r.height/g.h);return{x:(ev.clientX-r.left-(r.width-g.w*k)/2)/k,y:(ev.clientY-r.top-(r.height-g.h*k)/2)/k}}
const lay=()=>{const u=Math.min(g.w,g.h)*0.11*c.size;return{u,sx:u*1.9,sy:g.h-u*1.9,bs:(c.buttons||[]).map((b,i)=>({b,x:g.w-u*1.3-(i%2)*u*2.1,y:g.h-u*1.3-Math.floor(i/2)*u*2.1-(i%2)*u*0.9,r:u*0.8}))}}
s.lay=lay
const down=ev=>{
if(ev.pointerType==='mouse'&&!c.always)return
s.on=true
const p=pt(ev),L=lay()
for(const o of L.bs)if(Math.hypot(p.x-o.x,p.y-o.y)<o.r*1.25){s.btn[ev.pointerId]=o.b.key;g.vkey(o.b.key,true);ev.preventDefault();return}
if(p.x<g.w*0.5&&s.stick.id==null){s.stick.id=ev.pointerId;s.stick.ox=p.x;s.stick.oy=p.y;s.stick.x=0;s.stick.y=0;ev.preventDefault()}
}
const move=ev=>{
if(ev.pointerId!==s.stick.id)return
const p=pt(ev),L=lay(),dx=p.x-s.stick.ox,dy=p.y-s.stick.oy,m=Math.hypot(dx,dy),r=L.u
const k=m>r?r/m:1
s.stick.x=dx*k/r;s.stick.y=dy*k/r
}
const up=ev=>{
const b=s.btn[ev.pointerId]
if(b){delete s.btn[ev.pointerId];if(!Object.values(s.btn).includes(b))g.vkey(b,false)}
if(ev.pointerId===s.stick.id){s.stick.id=null;s.stick.x=0;s.stick.y=0}
}
cv.addEventListener('pointerdown',down)
globalThis.addEventListener('pointermove',move)
globalThis.addEventListener('pointerup',up)
globalThis.addEventListener('pointercancel',up)
},
pre(g,c,s){
const st=s.stick,want=new Set(),K=c.stickKeys==='arrows'?['arrowleft','arrowright','arrowup','arrowdown']:['a','d','w','s']
if(st.x<-0.35)want.add(K[0])
if(st.x>0.35)want.add(K[1])
if(st.y<-0.35)want.add(K[2])
if(st.y>0.35)want.add(K[3])
for(const k of want)if(!s.vk.has(k)){s.vk.add(k);g.vkey(k,true)}
for(const k of Array.from(s.vk))if(!want.has(k)){s.vk.delete(k);g.vkey(k,false)}
},
screen(g,c,s){
if(!s.on||!s.lay)return
const L=s.lay(),st=s.stick
c.save()
const bx=st.id!=null?st.ox:L.sx,by=st.id!=null?st.oy:L.sy
c.globalAlpha=0.28;c.fillStyle='#000';c.beginPath();c.arc(bx,by,L.u,0,7);c.fill()
c.globalAlpha=0.55;c.strokeStyle='#fff';c.lineWidth=2;c.stroke()
c.globalAlpha=0.75;c.fillStyle='#fff';c.beginPath();c.arc(bx+st.x*L.u,by+st.y*L.u,L.u*0.42,0,7);c.fill()
const held=new Set(Object.values(s.btn))
c.font='700 '+Math.round(L.u*0.45)+'px Inter,system-ui,sans-serif';c.textAlign='center';c.textBaseline='middle'
for(const o of L.bs){c.globalAlpha=held.has(o.b.key)?0.7:0.35;c.fillStyle=held.has(o.b.key)?'#9d5cff':'#000';c.beginPath();c.arc(o.x,o.y,o.r,0,7);c.fill();c.globalAlpha=0.85;c.strokeStyle='#fff';c.stroke();c.fillStyle='#fff';c.fillText(o.b.label||o.b.key,o.x,o.y)}
c.restore()
}
})
