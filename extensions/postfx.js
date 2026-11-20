VueExt.register({id:'postfx',name:'Post Processing',ns:'post',cat:'Rendering',icon:'aperture',version:'1.0.0',example:"export function collide(other: any) {\nvue.post.flash('#ff3355', 0.25)\nvue.post.set({ saturation: 0.4, vignette: 0.6 })\nvue.after(1, () => vue.post.set({ saturation: 1.1, vignette: 0.35 }))\n}",desc:'Screen effects for 2D and 3D: bloom, color grading, vignette, film grain, scanlines and chromatic fringe. Change any of them live from scripts for hit flashes, slow-mo or flashbacks.',defaults:{bloom:0.45,threshold:0.6,vignette:0.35,grain:0.04,scanlines:0,chroma:0,saturation:1.1,contrast:1.05,brightness:1,hue:0,tint:''},
api(g,c,s){return{set:(k,v)=>{if(typeof k==='object')Object.assign(c,k);else c[k]=v},get:k=>c[k],flash:(col,secs)=>{s.fl={c:col||'#ffffff',t:+secs||0.2,d:+secs||0.2}},reset:()=>{Object.assign(c,{bloom:0,vignette:0,grain:0,scanlines:0,chroma:0,saturation:1,contrast:1,brightness:1,hue:0,tint:''})}}},
post(g,c,s,ctx,dtt){
const doc=globalThis.document
if(!doc)return
const W=g.w,H=g.h,gl=g.is3d&&g.r3?g.r3.el:null,src=gl||g.canvas
const off=(k,w,h)=>{let o=s[k];if(!o){o=s[k]=doc.createElement('canvas')}if(o.width!==w||o.height!==h){o.width=w;o.height=h}return o}
const grade='saturate('+c.saturation+') contrast('+c.contrast+') brightness('+c.brightness+')'+(c.hue?' hue-rotate('+c.hue+'deg)':'')
const plain=c.saturation===1&&c.contrast===1&&c.brightness===1&&!c.hue
if(gl){const f=plain?'':grade;if(gl.style.filter!==f)gl.style.filter=f}
else if(!plain){const o=off('g',W,H),x=o.getContext('2d');x.clearRect(0,0,W,H);x.drawImage(src,0,0);ctx.save();ctx.filter=grade;ctx.clearRect(0,0,W,H);ctx.drawImage(o,0,0);ctx.restore()}
if(c.chroma>0&&!gl){const o=off('ch',W,H),x=o.getContext('2d');x.clearRect(0,0,W,H);x.drawImage(g.canvas,0,0);ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=0.35;ctx.filter='sepia(1) saturate(8) hue-rotate(-50deg)';ctx.drawImage(o,c.chroma,0);ctx.filter='sepia(1) saturate(8) hue-rotate(160deg)';ctx.drawImage(o,-c.chroma,0);ctx.restore()}
if(c.bloom>0){
const bw=Math.max(1,W>>2),bh=Math.max(1,H>>2),o=off('b',bw,bh),x=o.getContext('2d')
x.clearRect(0,0,bw,bh);x.filter='brightness('+(1-c.threshold+0.4)+') contrast('+(1+c.threshold*4)+') blur('+Math.max(1,bw/90)+'px)';x.drawImage(src,0,0,bw,bh);x.filter='none'
ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=c.bloom;ctx.imageSmoothingEnabled=true;ctx.drawImage(o,0,0,W,H);ctx.restore()
}
if(c.tint){ctx.save();ctx.globalCompositeOperation='overlay';ctx.globalAlpha=0.35;ctx.fillStyle=c.tint;ctx.fillRect(0,0,W,H);ctx.restore()}
if(c.scanlines>0){if(!s.sl){s.sl=doc.createElement('canvas');s.sl.width=2;s.sl.height=4;const x=s.sl.getContext('2d');x.fillStyle='#000';x.fillRect(0,2,2,2)}ctx.save();ctx.globalAlpha=c.scanlines;ctx.fillStyle=ctx.createPattern(s.sl,'repeat');ctx.fillRect(0,0,W,H);ctx.restore()}
if(c.grain>0){if(!s.gn){s.gn=doc.createElement('canvas');s.gn.width=s.gn.height=256;const x=s.gn.getContext('2d'),d=x.createImageData(256,256);for(let i=0;i<d.data.length;i+=4){const v=Math.random()*255;d.data[i]=d.data[i+1]=d.data[i+2]=v;d.data[i+3]=255}x.putImageData(d,0,0)}ctx.save();ctx.globalAlpha=c.grain;ctx.globalCompositeOperation='overlay';const p=ctx.createPattern(s.gn,'repeat'),ox=(Math.random()*256)|0,oy=(Math.random()*256)|0;ctx.translate(-ox,-oy);ctx.fillStyle=p;ctx.fillRect(0,0,W+ox,H+oy);ctx.restore()}
if(c.vignette>0){if(s.vw!==W||s.vh!==H||s.vv!==c.vignette){const gr=ctx.createRadialGradient(W/2,H/2,Math.min(W,H)*0.35,W/2,H/2,Math.hypot(W,H)*0.6);gr.addColorStop(0,'rgba(0,0,0,0)');gr.addColorStop(1,'rgba(0,0,0,'+c.vignette+')');s.vg=gr;s.vw=W;s.vh=H;s.vv=c.vignette}ctx.fillStyle=s.vg;ctx.fillRect(0,0,W,H)}
if(s.fl&&s.fl.t>0){ctx.save();ctx.globalAlpha=Math.max(0,s.fl.t/s.fl.d)*0.8;ctx.fillStyle=s.fl.c;ctx.fillRect(0,0,W,H);ctx.restore();s.fl.t-=1/60}
}
})
