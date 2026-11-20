VueExt.register({id:'weather',name:'Weather System',ns:'weather',cat:'World',icon:'cloud',version:'1.0.0',example:"export function start() {\nvue.weather.set('storm', 1)\nvue.weather.wind(0.4)\nvue.after(30, () => vue.weather.set('clear'))\n}",desc:'Rain, snow, storms with lightning and thunder, and rolling fog, with wind and smooth transitions between states. Works in 2D and 3D and can change on a timer or from scripts.',defaults:{type:'clear',intensity:1,wind:0.2,auto:false,thunder:true},
api(g,c,s){
s.k=c.type==='clear'?0:1;s.cur=c.type;s.next=c.type;s.p=[];s.flash=0;s.tt=6
return{
set:(t,i)=>{s.next=String(t||'clear');if(i!=null)c.intensity=+i;if(s.next!==s.cur&&s.k>0)s.out=true;else{s.cur=s.next;s.out=false}},
get type(){return s.cur},
wind:v=>{c.wind=+v},
intensity:v=>{c.intensity=+v},
lightning:()=>{s.flash=1;s.boom=0.4+Math.random()*1.2}
}
},
update(g,c,s,dt){
if(s.out){s.k-=dt*0.6;if(s.k<=0){s.k=0;s.out=false;s.cur=s.next}}
else if(s.cur!=='clear')s.k=Math.min(1,s.k+dt*0.4)
if(c.auto){s.tt-=dt;if(s.tt<=0){s.tt=40+Math.random()*60;const o=['clear','clear','rain','snow','storm','fog'];g.vue.weather.set(o[(Math.random()*o.length)|0])}}
if(s.cur==='storm'&&s.k>0.6&&Math.random()<dt*0.12)g.vue.weather.lightning()
if(s.flash>0)s.flash=Math.max(0,s.flash-dt*2.5)
if(s.boom!=null){s.boom-=dt;if(s.boom<=0){s.boom=null;if(c.thunder)thunder(g)}}
const W=g.w,H=g.h,want=(s.cur==='rain'?420:s.cur==='storm'?700:s.cur==='snow'?260:0)*c.intensity*s.k
while(s.p.length<want)s.p.push({x:Math.random()*(W+200)-100,y:Math.random()*H,v:0.7+Math.random()*0.6,ph:Math.random()*6})
if(s.p.length>want)s.p.length=Math.max(0,Math.floor(want))
const snow=s.cur==='snow'
for(const p of s.p){
if(snow){p.y+=dt*(40+30*p.v);p.x+=dt*(c.wind*90+Math.sin(g.time*1.3+p.ph)*20)}
else{p.y+=dt*(900*p.v);p.x+=dt*c.wind*600*p.v}
if(p.y>H){p.y=-10-Math.random()*40;p.x=Math.random()*(W+200)-100;if(!snow&&Math.random()<0.25)s.sp=(s.sp||[]).concat([{x:p.x,y:H-4-Math.random()*H*0.25,t:0.25}]).slice(-80)}
if(p.x>W+100)p.x-=W+200;if(p.x<-100)p.x+=W+200
}
if(s.sp)for(const q of s.sp)q.t-=dt
function thunder(g){const ac=g.audio&&g.audio(true);if(!ac||ac.state!=='running')return;const n=ac.sampleRate*2.5,b=ac.createBuffer(1,n,ac.sampleRate),d=b.getChannelData(0);let l=0;for(let i=0;i<n;i++){const w=Math.random()*2-1;l=(l+0.02*w)/1.02;d[i]=l*3.5*Math.pow(1-i/n,2)}const src=ac.createBufferSource(),f=ac.createBiquadFilter(),gn=ac.createGain();f.type='lowpass';f.frequency.value=380;gn.gain.value=0.9;src.buffer=b;src.connect(f);f.connect(gn);gn.connect(g.master||ac.destination);src.start()}
},
render3(g,c,s,r){
const T=r.T
if(s.cur==='fog'||s.cur==='storm'||s.cur==='rain'){const d=(s.cur==='fog'?0.06:0.025)*s.k*c.intensity;if(d>0.001){const col=r.scene.background&&r.scene.background.isColor?r.scene.background.getHex():0x9aa4b1;if(!r.scene.fog||!r.scene.fog.isFogExp2)r.scene.fog=new T.FogExp2(col,d);r.scene.fog.density=Math.max(r.scene.fog.density,d)}}
if(s.flash>0)r.hemi.intensity+=s.flash*2
},
screen(g,c,s,ctx){
const W=g.w,H=g.h
ctx.save()
if(s.cur==='storm'||s.cur==='rain'){ctx.globalAlpha=0.18*s.k*c.intensity;ctx.fillStyle='#1c2433';ctx.fillRect(0,0,W,H)}
if(s.cur==='fog'&&!g.is3d){const gr=ctx.createLinearGradient(0,0,0,H);gr.addColorStop(0,'rgba(200,210,220,'+0.15*s.k+')');gr.addColorStop(1,'rgba(220,226,232,'+0.6*s.k*c.intensity+')');ctx.fillStyle=gr;ctx.fillRect(0,0,W,H)}
if(s.p.length){
if(s.cur==='snow'){ctx.fillStyle='#fff';for(const p of s.p){ctx.globalAlpha=0.5+0.4*p.v;ctx.beginPath();ctx.arc(p.x,p.y,1+p.v*1.6,0,6.3);ctx.fill()}}
else{ctx.strokeStyle='#cfe3ff';ctx.lineWidth=1.2;ctx.globalAlpha=0.45;ctx.beginPath();for(const p of s.p){ctx.moveTo(p.x,p.y);ctx.lineTo(p.x-c.wind*18*p.v,p.y-16*p.v)}ctx.stroke()
if(s.sp){ctx.globalAlpha=0.5;ctx.beginPath();for(const q of s.sp)if(q.t>0){const k=1-q.t/0.25;ctx.moveTo(q.x-6*k,q.y);ctx.ellipse(q.x,q.y,6*k+1,2*k+0.5,0,0,6.3)}ctx.stroke()}}
}
if(s.flash>0){ctx.globalAlpha=s.flash*0.75;ctx.fillStyle='#eef4ff';ctx.fillRect(0,0,W,H)}
ctx.restore()
}
})
