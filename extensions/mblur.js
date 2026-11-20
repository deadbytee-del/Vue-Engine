VueExt.register({id:'mblur',name:'Motion Blur',ns:'blur',cat:'Rendering',icon:'wind',version:'1.0.0',example:"export function start() {\nvue.blur.strength(0.8)\nvue.blur.trails(0.4)\n}",desc:'Camera motion blur that streaks along the direction the view is moving, plus per-object trails for fast movers. Scales with frame rate so it looks the same at 60 and 144 Hz.',defaults:{strength:0.6,samples:6,trails:0.35},
api(g,c,s){return{strength:v=>{c.strength=+v},trails:v=>{c.trails=+v}}},
post(g,c,s,ctx){
const doc=globalThis.document
if(!doc||c.strength<=0)return
const W=g.w,H=g.h,gl=g.is3d&&g.r3?g.r3.el:null,src=gl||g.canvas,cam=g.camera
let vx=0,vy=0
if(g.is3d){const yaw=Math.atan2(cam.tx-cam.x,cam.tz-cam.z),pit=Math.atan2(cam.ty-cam.y,Math.hypot(cam.tx-cam.x,cam.tz-cam.z));if(s.yaw!=null){let dy=yaw-s.yaw;if(dy>Math.PI)dy-=Math.PI*2;if(dy<-Math.PI)dy+=Math.PI*2;const f=W/(2*Math.tan((cam.fov||70)*Math.PI/360));vx=-dy*f;vy=(pit-s.pit)*f}s.yaw=yaw;s.pit=pit}
else{if(s.cx!=null){vx=(cam.x-s.cx)*cam.zoom;vy=(cam.y-s.cy)*cam.zoom}s.cx=cam.x;s.cy=cam.y}
const m=Math.hypot(vx,vy)
let o=s.o
if(!o){o=s.o=doc.createElement('canvas')}
if(o.width!==W||o.height!==H){o.width=W;o.height=H;s.acc=null}
const x=o.getContext('2d')
x.globalAlpha=1;x.clearRect(0,0,W,H);x.drawImage(src,0,0,W,H)
let t=ctx
if(gl){let b=s.b;if(!b){b=s.b=doc.createElement('canvas')}if(b.width!==W||b.height!==H){b.width=W;b.height=H}t=b.getContext('2d');t.globalAlpha=1;t.clearRect(0,0,W,H);t.drawImage(o,0,0)}
if(m>1.5){
const n=Math.max(2,c.samples|0),len=Math.min(80,m*c.strength*1.5)
t.save()
for(let i=1;i<=n;i++){t.globalAlpha=(1-i/(n+1))*1.5/n;t.drawImage(o,-vx/m*len*i/n,-vy/m*len*i/n)}
t.restore()
}
if(gl){ctx.save();ctx.globalCompositeOperation='destination-over';ctx.drawImage(s.b,0,0);ctx.restore()}
if(c.trails>0&&!gl){
let a=s.acc
if(!a){a=s.acc=doc.createElement('canvas');a.width=W;a.height=H}
const ax=a.getContext('2d')
if(s.pcx!=null&&!g.is3d)ax.drawImage(a,-(cam.x-s.pcx)*cam.zoom,-(cam.y-s.pcy)*cam.zoom)
s.pcx=cam.x;s.pcy=cam.y
ctx.save();ctx.globalAlpha=c.trails*0.8;ctx.drawImage(a,0,0);ctx.restore()
ax.globalCompositeOperation='copy';ax.globalAlpha=1;ax.drawImage(o,0,0)
ax.globalCompositeOperation='source-over'
}
}
})
