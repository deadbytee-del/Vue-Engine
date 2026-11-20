VueExt.register({id:'daynight',name:'Day/Night Cycle',ns:'day',cat:'World',icon:'sun',version:'1.0.0',example:"export function start() {\nvue.day.setHour(18)\nvue.day.speed(120)\n}\nexport function update(dt: number) {\nvue.hud('Time', Math.floor(vue.day.hour) + ':00')\n}",desc:'A full sun and moon cycle. 3D scenes move the sun, recolor the sky, fog and light; 2D scenes get dusk and night grading, stars, and glowing lights on anything tagged "light".',defaults:{length:180,start:0.3,auto:true,lightTag:'light'},
api(g,c,s){
s.t=c.start
return{
get time(){return s.t},set time(v){s.t=((+v%1)+1)%1},
get hour(){return s.t*24},
get isNight(){return s.t<0.23||s.t>0.77},
setHour:h=>{s.t=(((+h/24)%1)+1)%1},
speed:v=>{c.length=+v||180},
pause:()=>{c.auto=false},resume:()=>{c.auto=true}
}
},
update(g,c,s,dt){if(c.auto)s.t=(s.t+dt/c.length)%1;const n=s.t<0.23||s.t>0.77;if(n!==s.wn){if(s.wn!=null)g.fireAll('msg:'+(n?'night':'day'));s.wn=n}},
render3(g,c,s,r){
const T=r.T,t=s.t,a=(t-0.25)*Math.PI*2,el=Math.sin(a)
r.sunDir=[Math.cos(a)*45,Math.max(-10,el*48),18]
const day=Math.max(0,Math.min(1,el*3+0.25)),dusk=Math.max(0,1-Math.abs(el)*5)
r.sun.intensity=0.05+day*0.95
r.sun.color.setRGB(1,0.85+0.15*day-0.25*dusk,0.75+0.25*day-0.35*dusk)
r.hemi.intensity=0.12+day*0.65
if(!s.base){s.base=new T.Color(g.bg||'#8ec5ff')}
const night=new T.Color('#070b1c'),duskc=new T.Color('#f08a5d'),sky=night.clone().lerp(s.base,day).lerp(duskc,dusk*0.55)
r.skyLock=true
if(!r.scene.background||!r.scene.background.isColor)r.scene.background=new T.Color()
r.scene.background.copy(sky)
if(r.scene.fog)r.scene.fog.color.copy(sky)
},
screen(g,c,s,ctx){
if(g.is3d)return
const t=s.t,el=Math.sin((t-0.25)*Math.PI*2),day=Math.max(0,Math.min(1,el*3+0.25)),dusk=Math.max(0,1-Math.abs(el)*5),W=g.w,H=g.h
if(day<1){
ctx.save()
ctx.globalCompositeOperation='multiply'
const k=1-day
ctx.fillStyle='rgb('+Math.round(255-k*205)+','+Math.round(255-k*190)+','+Math.round(255-k*110)+')'
ctx.fillRect(0,0,W,H)
if(dusk>0){ctx.globalCompositeOperation='overlay';ctx.globalAlpha=dusk*0.5;ctx.fillStyle='#ff7a3d';ctx.fillRect(0,0,W,H)}
ctx.restore()
if(k>0.5){ctx.save();ctx.globalAlpha=(k-0.5)*1.6;ctx.fillStyle='#fff';for(let i=0;i<70;i++){const x=(i*137.5)%W,y=(i*71.3)%(H*0.45);ctx.globalAlpha=(k-0.5)*1.6*(0.4+0.6*Math.abs(Math.sin(g.time*1.5+i)));ctx.fillRect(x,y,1.5,1.5)}ctx.restore()}
const cam=g.camera,z=cam.zoom
ctx.save();ctx.globalCompositeOperation='lighter'
for(const e of g.vue.all(c.lightTag)){const sx=(e.x-cam.x)*z+W/2,sy=(e.y-cam.y)*z+H/2,rr=(e.lightRadius||e.w*4||120)*z;if(sx<-rr||sx>W+rr||sy<-rr||sy>H+rr)continue;const gr=ctx.createRadialGradient(sx,sy,0,sx,sy,rr);gr.addColorStop(0,'rgba(255,214,140,'+(0.55*k)+')');gr.addColorStop(1,'rgba(255,180,90,0)');ctx.fillStyle=gr;ctx.fillRect(sx-rr,sy-rr,rr*2,rr*2)}
ctx.restore()
}
}
})
