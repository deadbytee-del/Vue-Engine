(function(root){
const TYPES=[['panel','Panel'],['text','Text'],['image','Image'],['button','Button'],['bar','Bar']]
const make=type=>{
const b={id:Math.random().toString(36).slice(2,9),type,name:type[0].toUpperCase()+type.slice(1),ax:0.5,ay:0.5,x:0,y:0,w:160,h:48,color:'#1d1d1d',opacity:1,radius:8,border:0,borderColor:'#ffffff',texture:'',fit:'stretch',text:'',size:20,tcolor:'#ffffff',align:'center',bold:true,bind:'',max:100,show:'',act:'',target:'',value:'1',hover:'#3b3b3b',tint:'#ffffff'}
if(type==='panel'){b.w=240;b.h=160;b.color='#101010'}
if(type==='text'){b.text='Score: {score}';b.color='transparent';b.w=200;b.h=32;b.ax=0;b.ay=0;b.x=16;b.y=16;b.align='left'}
if(type==='image'){b.w=96;b.h=96;b.color='transparent'}
if(type==='button'){b.text='Play';b.w=180;b.h=52;b.color='#f2f2f2';b.tcolor='#0a0a0a';b.hover='#d4d4d4';b.act='scene'}
if(type==='bar'){b.name='Bar';b.w=220;b.h=18;b.ax=0.5;b.ay=0;b.y=16;b.color='#2a2a2a';b.tint='#e8e8e8';b.bind='health';b.radius=9}
return b
}
const rect=(u,W,H)=>({x:u.ax*W+u.x-u.ax*u.w,y:u.ay*H+u.y-u.ay*u.h,w:u.w,h:u.h})
const fill=(s,vars)=>String(s==null?'':s).replace(/\{([\w.]+)\}/g,(m,k)=>{const v=vars[k];return v===undefined?'':typeof v==='number'?String(Math.round(v*100)/100):String(v)})
const vis=(u,vars)=>!u.show||!!vars[u.show]
const rr=(c,x,y,w,h,r)=>{r=Math.max(0,Math.min(r,w/2,h/2));c.beginPath();if(c.roundRect)c.roundRect(x,y,w,h,r);else c.rect(x,y,w,h)}
function draw(c,list,W,H,vars,images,mouse){
let hit=null
for(const u of list){
if(!vis(u,vars))continue
const r=rect(u,W,H),over=mouse&&mouse.x>=r.x&&mouse.x<=r.x+r.w&&mouse.y>=r.y&&mouse.y<=r.y+r.h
c.save()
c.globalAlpha=Math.max(0,Math.min(1,u.opacity))
let col=u.color
if(u.type==='button'&&over&&mouse.live)col=u.hover
if(col&&col!=='transparent'){c.fillStyle=col;rr(c,r.x,r.y,r.w,r.h,u.radius);c.fill()}
const im=u.texture&&images?images[u.texture]:null
if(im&&im.naturalWidth){
c.save();rr(c,r.x,r.y,r.w,r.h,u.radius);c.clip()
const iw=im.naturalWidth,ih=im.naturalHeight
if(u.fit==='tile'){const p=c.createPattern(im,'repeat');c.fillStyle=p;c.translate(r.x,r.y);c.fillRect(0,0,r.w,r.h)}
else if(u.fit==='stretch')c.drawImage(im,r.x,r.y,r.w,r.h)
else{const s=u.fit==='cover'?Math.max(r.w/iw,r.h/ih):Math.min(r.w/iw,r.h/ih),dw=iw*s,dh=ih*s;c.drawImage(im,r.x+(r.w-dw)/2,r.y+(r.h-dh)/2,dw,dh)}
c.restore()
}
if(u.type==='bar'){
const v=Number(vars[u.bind]),m=Number(u.max)||1,f=isFinite(v)?Math.max(0,Math.min(1,v/m)):0
if(f>0){c.fillStyle=u.tint;rr(c,r.x,r.y,Math.max(u.radius?Math.min(r.w*f,r.h):1,r.w*f),r.h,u.radius);c.fill()}
}
if(u.border>0){c.strokeStyle=u.borderColor;c.lineWidth=u.border;rr(c,r.x+u.border/2,r.y+u.border/2,r.w-u.border,r.h-u.border,u.radius);c.stroke()}
if(u.text&&(u.type==='text'||u.type==='button'||u.type==='panel')){
c.fillStyle=u.tcolor;c.font=(u.bold?'600 ':'400 ')+u.size+'px Inter,system-ui,sans-serif';c.textBaseline='middle'
const t=fill(u.text,vars),pad=10
c.textAlign=u.align
const tx=u.align==='left'?r.x+pad:u.align==='right'?r.x+r.w-pad:r.x+r.w/2
c.fillText(t,tx,r.y+r.h/2)
}
c.restore()
if(over&&u.type==='button'&&u.act)hit=u
}
return hit
}
function click(u,g){
if(u.act==='scene'&&u.target)g.nextScene=u.target
else if(u.act==='set')g.vars[u.target]=isNaN(+u.value)||u.value===''?u.value:+u.value
else if(u.act==='add')g.vars[u.target]=(+g.vars[u.target]||0)+(+u.value||0)
else if(u.act==='toggle')g.vars[u.target]=!g.vars[u.target]
else if(u.act==='quit'&&root.close)root.close()
}
root.VueUI={TYPES,make,rect,fill,vis,draw,click}
})(typeof window!=='undefined'?window:globalThis)
