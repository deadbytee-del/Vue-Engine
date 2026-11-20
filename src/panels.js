(function(){
let ed,S,h,ic
const P={}
const TS={idx:0,tool:'brush',hover:null,zoom:3}
let animSel=null,frameSel=-1,csSel=null,stepSel=null,raf=0,prevPlay=true
const PPS=90
const STEP_TYPES=[
['move','Move entity','move',1,1],['rotate','Rotate entity','rotate',1,1],['fade','Fade entity','eye',1,1],['scale','Resize entity','scale',1,1],
['camera','Move camera','scene',1,0],['say','Speech bubble','text',2,1],['caption','Caption','text',2,0],['anim','Play animation','film',0,1],
['show','Show entity','eye',0,1],['hide','Hide entity','eyeoff',0,1],['sound','Play sound','audio',0,0],['music','Play music','music',0,0],
['shake','Camera shake','target',0.4,0],['setvar','Set global','tag',0,0],['emit','Broadcast message','sparkles',0,0]]
const TMETA={}
for(const t of STEP_TYPES)TMETA[t[0]]={label:t[1],ic:t[2],dur:t[3],target:!!t[4]}
const TWEEN=['move','rotate','fade','scale','camera']
const TYPE_COL={move:'#4d8dff',rotate:'#4d8dff',fade:'#9d5cff',scale:'#4d8dff',camera:'#6c7cff',say:'#22c3a6',caption:'#22c3a6',anim:'#9d5cff',show:'#8a83a3',hide:'#8a83a3',sound:'#d65ad1',music:'#d65ad1',shake:'#f5a524',setvar:'#ff8a3d',emit:'#e0457b'}
function rng(seed){let s=seed>>>0;return()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296}}
function defaultTileset(){
const N=16,cv=document.createElement('canvas')
cv.width=N*4;cv.height=N*4
const c=cv.getContext('2d')
const px=(ox,oy,x,y,col)=>{c.fillStyle=col;c.fillRect(ox+x,oy+y,1,1)}
const shade=(hex,k)=>{const n=parseInt(hex.slice(1),16);let r=n>>16,g=n>>8&255,b=n&255;r=Math.max(0,Math.min(255,r+k));g=Math.max(0,Math.min(255,g+k));b=Math.max(0,Math.min(255,b+k));return'rgb('+r+','+g+','+b+')'}
const noise=(ox,oy,base,amt,seed)=>{const r=rng(seed);for(let y=0;y<N;y++)for(let x=0;x<N;x++)px(ox,oy,x,y,shade(base,Math.round((r()-0.5)*amt)))}
const T=[
(o,p)=>{noise(o,p,'#8b5e3c',30,1);const r=rng(2);for(let x=0;x<N;x++){const hh=4+Math.floor(r()*3);for(let y=0;y<hh;y++)px(o,p,x,y,shade('#5aa469',Math.round((r()-0.5)*30)))}},
(o,p)=>noise(o,p,'#8b5e3c',36,3),
(o,p)=>{noise(o,p,'#7a7f8c',28,4);c.fillStyle='rgba(0,0,0,0.25)';c.fillRect(o+3,p+5,4,1);c.fillRect(o+9,p+11,5,1)},
(o,p)=>{c.fillStyle='#8c3b2a';c.fillRect(o,p,N,N);c.fillStyle='#b5523b';for(let r=0;r<4;r++){const off=r%2?4:0;for(let k=-1;k<2;k++)c.fillRect(o+off+k*8+1,p+r*4+1,6,2)}},
(o,p)=>{noise(o,p,'#a57c4b',18,5);c.fillStyle='#6e4f2c';for(let r=0;r<4;r++)c.fillRect(o,p+r*4+3,N,1);c.fillRect(o+5,p,1,4);c.fillRect(o+11,p+4,1,4);c.fillRect(o+3,p+8,1,4);c.fillRect(o+9,p+12,1,4)},
(o,p)=>{noise(o,p,'#3f7fbf',16,6);c.fillStyle='rgba(255,255,255,0.35)';c.fillRect(o+2,p+3,5,1);c.fillRect(o+9,p+9,5,1)},
(o,p)=>noise(o,p,'#e0c97f',22,7),
(o,p)=>{noise(o,p,'#a9d8f2',12,8);c.fillStyle='rgba(255,255,255,0.6)';c.fillRect(o+3,p+3,1,6);c.fillRect(o+4,p+3,4,1)},
(o,p)=>{noise(o,p,'#9aa3b0',10,9);c.fillStyle='#6f7885';c.fillRect(o,p,N,1);c.fillRect(o,p,1,N);c.fillStyle='#c5ccd6';[[2,2],[13,2],[2,13],[13,13]].forEach(q=>c.fillRect(o+q[0],p+q[1],1,1))},
(o,p)=>{noise(o,p,'#d1401f',40,10);const r=rng(11);c.fillStyle='#ffb02e';for(let i=0;i<14;i++)c.fillRect(o+Math.floor(r()*N),p+Math.floor(r()*N),2,1)},
(o,p)=>{noise(o,p,'#3e8b46',50,12)},
(o,p)=>noise(o,p,'#4a4d57',24,13),
(o,p)=>{c.fillStyle='#55585f';c.fillRect(o,p,N,N);const r=rng(14);for(let i=0;i<9;i++){c.fillStyle=shade('#80848d',Math.round((r()-0.5)*30));c.fillRect(o+(i%3)*5+1,p+Math.floor(i/3)*5+1,4,4)}},
(o,p)=>{noise(o,p,'#f2c230',24,15);c.fillStyle='#fff3b0';c.fillRect(o+2,p+2,4,1);c.fillStyle='#b88a10';c.fillRect(o,p+N-1,N,1);c.fillRect(o+N-1,p,1,N)},
(o,p)=>{c.fillStyle='#b07d42';c.fillRect(o,p,N,N);c.fillStyle='#6e4f2c';c.fillRect(o,p,N,2);c.fillRect(o,p+N-2,N,2);c.fillRect(o,p,2,N);c.fillRect(o+N-2,p,2,N);for(let i=0;i<N;i++){c.fillRect(o+i,p+i,1,1);c.fillRect(o+N-1-i,p+i,1,1)}},
(o,p)=>{c.fillStyle='rgba(180,225,255,0.35)';c.fillRect(o,p,N,N);c.fillStyle='rgba(255,255,255,0.8)';c.fillRect(o,p,N,1);c.fillRect(o,p,1,N);c.fillRect(o+3,p+4,1,4);c.fillRect(o+4,p+3,3,1)}
]
T.forEach((f,i)=>f((i%4)*N,Math.floor(i/4)*N))
return cv.toDataURL('image/png')
}
function sampleSheet(){
const F=8,S=32,cv=document.createElement('canvas')
cv.width=F*S;cv.height=S
const c=cv.getContext('2d')
for(let i=0;i<F;i++){
const o=i*S,ph=i/F*Math.PI*2,b=Math.abs(Math.sin(ph))*3,sq=1+Math.cos(ph*2)*0.06
c.fillStyle='rgba(0,0,0,0.25)'
c.beginPath();c.ellipse(o+16,29,9,2,0,0,7);c.fill()
const l1=Math.sin(ph)*4,l2=-l1
c.fillStyle='#3b2a6b'
c.fillRect(o+11+l1,22-b,3,6);c.fillRect(o+18+l2,22-b,3,6)
c.fillStyle='#9d5cff'
c.beginPath();c.ellipse(o+16,16-b,10*sq,10/sq,0,0,7);c.fill()
c.fillStyle='#c9a6ff'
c.beginPath();c.ellipse(o+12,12-b,3,2,-0.5,0,7);c.fill()
c.fillStyle='#fff'
c.fillRect(o+18,13-b,4,4)
c.fillStyle='#120a24'
c.fillRect(o+20,14-b,2,3)
}
return cv.toDataURL('image/png')
}
function imgOf(name){return S.game&&S.game.images[name]}
function imageAssets(){const a=S.project.assets,o=[];for(const k in a)if(a[k].type==='image')o.push(k);return o}
function audioAssets(){const a=S.project.assets,o=[];for(const k in a)if(a[k].type==='audio')o.push(k);return o}
function sel(opts,val,fn,none){
const s=h('select')
if(none)s.append(h('option',{value:'',text:none}))
for(const o of opts){const v=Array.isArray(o)?o[0]:o,t=Array.isArray(o)?o[1]:o;s.append(h('option',{value:v,text:t}))}
s.value=val==null?'':val
s.addEventListener('change',()=>fn(s.value))
return s
}
function numIn(val,fn,step){
const i=h('input',{type:'number',step:step||'any',value:val==null?0:val})
let first=true
i.addEventListener('input',()=>{if(first){ed.snap();first=false}fn(parseFloat(i.value)||0)})
i.addEventListener('change',()=>{first=true})
return i
}
function txtIn(val,fn,ph){
const i=h('input',{type:'text',value:val==null?'':val,spellcheck:'false',placeholder:ph||''})
let first=true
i.addEventListener('input',()=>{if(first){ed.snap();first=false}fn(i.value)})
i.addEventListener('change',()=>{first=true})
return i
}
function sw(val,fn){const i=h('input',{type:'checkbox',class:'sw'});i.checked=!!val;i.addEventListener('change',()=>{ed.snap();fn(i.checked)});return i}
function fld(label,el){return h('div',{class:'fld'},h('label',{text:label,title:label}),el)}
function empty(box,icon,title,msg,btn){
box.innerHTML=''
const e=h('div',{class:'empty pe'},h('span',{html:ic(icon,30)}),h('h3',{text:title}),h('p',{text:msg}))
if(btn)e.append(btn)
box.append(e)
}
function renderTiles(){
const box=$('#tiles')
if(!box)return
const d=ed.selData()
if(ed.is3()){empty(box,'map','Tilemaps are 2D','Switch to a 2D scene to paint tiles.');return}
if(!d||d.shape!=='tilemap'){empty(box,'map','No tilemap selected','Tilemaps paint whole levels fast: grass, walls, platforms, with collision built in.',h('button',{class:'btn primary',html:ic('plus',14)+'Create tilemap',onclick:()=>ed.addEntity('tilemap')}));return}
box.innerHTML=''
const e=ed.entOf(d)
const tools=h('div',{class:'seg'})
for(const t of[['brush','brush','Brush (B)'],['rect','rect','Rectangle (U)'],['bucket','bucket','Fill (G)'],['eraser','eraser','Eraser (Shift)'],['pipette','pipette','Pick tile (Alt)']]){
tools.append(h('button',{class:TS.tool===t[0]?'on':'',title:t[2],html:ic(t[1],15),onclick:()=>{TS.tool=t[0];ed.setTool('paint');renderTiles()}}))
}
const side=h('div',{class:'pp-side'},
h('div',{class:'pp-h',html:ic('map',14)+'<b></b>'}),
fld('Tileset',sel(imageAssets(),d.tileset,v=>{ed.snap();d.tileset=v;ed.refresh();renderTiles()},'Colors only')),
fld('Tile px',numIn(d.ts||16,v=>{d.ts=Math.max(1,v|0);ed.refresh();drawPalette()},1)),
fld('Cell size',numIn(d.cell||32,v=>{d.cell=Math.max(1,v);ed.refresh()},1)),
fld('Solid',sw(d.solid!==false,v=>{d.solid=v;ed.refresh()})),
h('div',{class:'fld'},h('label',{text:'Tool'}),tools),
h('div',{class:'hint',text:'Pick a tile on the right, then paint in the viewport. Shift erases, Alt picks. '+(e&&e.tiles?e.tiles.size:0)+' tiles placed.'}))
side.querySelector('.pp-h b').textContent=d.name
const pal=h('div',{class:'tpal'})
const cv=h('canvas',{class:'tcv'})
pal.append(cv)
const zoom=h('div',{class:'pp-tb'},h('span',{class:'hint',text:'Tile '+TS.idx}),h('span',{style:'flex:1'}),h('button',{class:'ib',title:'Zoom out',html:'−',onclick:()=>{TS.zoom=Math.max(1,TS.zoom-1);drawPalette()}}),h('button',{class:'ib',title:'Zoom in',html:'+',onclick:()=>{TS.zoom=Math.min(8,TS.zoom+1);drawPalette()}}))
const main=h('div',{class:'pp-main'},zoom,pal)
box.append(side,main)
cv.addEventListener('pointerdown',ev=>{
const im=imgOf(d.tileset),ts=d.ts||16,z=TS.zoom
const r=cv.getBoundingClientRect(),x=Math.floor((ev.clientX-r.left)/(ts*z)),y=Math.floor((ev.clientY-r.top)/(ts*z))
const cols=im&&im.naturalWidth?Math.max(1,Math.floor(im.naturalWidth/ts)):8
const rows=im&&im.naturalHeight?Math.max(1,Math.floor(im.naturalHeight/ts)):1
if(x<0||y<0||x>=cols||y>=rows)return
TS.idx=y*cols+x
if(TS.tool==='eraser'||TS.tool==='pipette')TS.tool='brush'
ed.setTool('paint')
renderTiles()
})
drawPalette()
}
function drawPalette(){
const d=ed.selData(),cv=document.querySelector('#tiles .tcv')
if(!d||!cv)return
const im=imgOf(d.tileset),ts=d.ts||16,z=TS.zoom
const c=cv.getContext('2d')
if(im&&im.naturalWidth){
const cols=Math.max(1,Math.floor(im.naturalWidth/ts)),rows=Math.max(1,Math.floor(im.naturalHeight/ts))
cv.width=cols*ts*z;cv.height=rows*ts*z
c.imageSmoothingEnabled=false
c.drawImage(im,0,0,cols*ts,rows*ts,0,0,cols*ts*z,rows*ts*z)
c.strokeStyle='rgba(255,255,255,0.12)'
c.lineWidth=1
for(let x=0;x<=cols;x++){c.beginPath();c.moveTo(x*ts*z+0.5,0);c.lineTo(x*ts*z+0.5,cv.height);c.stroke()}
for(let y=0;y<=rows;y++){c.beginPath();c.moveTo(0,y*ts*z+0.5);c.lineTo(cv.width,y*ts*z+0.5);c.stroke()}
const sx=(TS.idx%cols)*ts*z,sy=Math.floor(TS.idx/cols)*ts*z
c.strokeStyle='#ffd34d';c.lineWidth=2;c.strokeRect(sx+1,sy+1,ts*z-2,ts*z-2)
}else{
const cols=8,sz=ts*z
cv.width=cols*sz;cv.height=sz
const TC=['#5aa469','#8b5e3c','#7a7f8c','#b5523b','#3f7fbf','#a57c4b','#e0c97f','#9aa3b0']
for(let i=0;i<cols;i++){c.fillStyle=TC[i];c.fillRect(i*sz,0,sz,sz)}
c.strokeStyle='#ffd34d';c.lineWidth=2;c.strokeRect((TS.idx%cols)*sz+1,1,sz-2,sz-2)
}
}
function put(d,e,cx,cy,i){
if(!d.tiles)d.tiles={}
const k=cx+','+cy
if(i<0){if(!(k in d.tiles))return;delete d.tiles[k]}else{if(d.tiles[k]===i)return;d.tiles[k]=i}
d.tv=(d.tv||0)+1
if(e){e.setTile(cx,cy,i);e._tv=d.tv;e._tobj=d.tiles}
}
function line(x0,y0,x1,y1,f){
const dx=Math.abs(x1-x0),dy=-Math.abs(y1-y0),sx=x0<x1?1:-1,sy=y0<y1?1:-1
let err=dx+dy,n=0
while(n++<4096){f(x0,y0);if(x0===x1&&y0===y1)break;const e2=2*err;if(e2>=dy){err+=dy;x0+=sx}if(e2<=dx){err+=dx;y0+=sy}}
}
function flood(d,e,cx,cy){
const target=e.getTile(cx,cy),idx=TS.tool==='eraser'?-1:TS.idx
if(target===idx)return 0
let b=e.tb?[e.tb[0]-8,e.tb[1]-8,e.tb[2]+8,e.tb[3]+8]:[cx-16,cy-16,cx+16,cy+16]
b=[Math.min(b[0],cx),Math.min(b[1],cy),Math.max(b[2],cx),Math.max(b[3],cy)]
const seen=new Set(),q=[[cx,cy]]
let n=0
while(q.length&&n<20000){
const[x,y]=q.pop()
const k=x+','+y
if(seen.has(k)||x<b[0]||y<b[1]||x>b[2]||y>b[3])continue
seen.add(k)
if(e.getTile(x,y)!==target)continue
put(d,e,x,y,idx)
n++
q.push([x+1,y],[x-1,y],[x,y+1],[x,y-1])
}
return n
}
P.tileDown=(ev,wx,wy)=>{
const d=ed.selData(),e=ed.entOf(d)
if(!d||!e||d.shape!=='tilemap')return false
const[cx,cy]=e.cellAt(wx,wy)
let tool=TS.tool
if(ev.shiftKey)tool='eraser'
if(ev.altKey)tool='pipette'
if(tool==='pipette'){const t=e.getTile(cx,cy);if(t>=0){TS.idx=t;TS.tool='brush';renderTiles()}return true}
ed.snap()
if(tool==='bucket'){const n=flood(d,e,cx,cy);ed.markDirty();ed.redraw();if(n>=20000)ed.toast('Fill stopped at 20,000 tiles');renderTilesSoon();return true}
S.drag={k:'tile',tool,d,e,sx:cx,sy:cy,lx:cx,ly:cy}
if(tool==='brush'||tool==='eraser')put(d,e,cx,cy,tool==='eraser'?-1:TS.idx)
ed.redraw()
return true
}
P.tileMove=(wx,wy)=>{
const dr=S.drag
const[cx,cy]=dr.e.cellAt(wx,wy)
TS.hover=[cx,cy]
if(dr.tool==='rect'){dr.lx=cx;dr.ly=cy}
else{line(dr.lx,dr.ly,cx,cy,(x,y)=>put(dr.d,dr.e,x,y,dr.tool==='eraser'?-1:TS.idx));dr.lx=cx;dr.ly=cy}
ed.redraw()
}
P.tileUp=()=>{
const dr=S.drag
if(dr.tool==='rect'){
const x0=Math.min(dr.sx,dr.lx),x1=Math.max(dr.sx,dr.lx),y0=Math.min(dr.sy,dr.ly),y1=Math.max(dr.sy,dr.ly)
for(let x=x0;x<=x1;x++)for(let y=y0;y<=y1;y++)put(dr.d,dr.e,x,y,TS.idx)
}
S.drag=null
ed.markDirty()
ed.redraw()
renderTilesSoon()
}
P.tileHover=(wx,wy)=>{
const d=ed.selData(),e=ed.entOf(d)
if(!e||d.shape!=='tilemap'){TS.hover=null;return}
const c=e.cellAt(wx,wy)
if(!TS.hover||TS.hover[0]!==c[0]||TS.hover[1]!==c[1]){TS.hover=c;ed.redraw()}
}
P.overlay=c=>{
const d=ed.selData(),e=ed.entOf(d)
if(!e||d.shape!=='tilemap'||S.tool!=='paint')return
const s=e.cell,z=S.cam.zoom,dr=S.drag
let cells=null
if(dr&&dr.k==='tile'&&dr.tool==='rect')cells=[Math.min(dr.sx,dr.lx),Math.min(dr.sy,dr.ly),Math.max(dr.sx,dr.lx),Math.max(dr.sy,dr.ly)]
else if(TS.hover)cells=[TS.hover[0],TS.hover[1],TS.hover[0],TS.hover[1]]
if(!cells)return
const p0=ed.scr(e.x+cells[0]*s,e.y+cells[1]*s),p1=ed.scr(e.x+(cells[2]+1)*s,e.y+(cells[3]+1)*s)
const im=imgOf(e.tileset),ts=e.ts
if(im&&im.naturalWidth&&TS.tool!=='eraser'){
const cols=Math.max(1,Math.floor(im.naturalWidth/ts))
c.globalAlpha=0.55
c.imageSmoothingEnabled=false
for(let x=cells[0];x<=cells[2];x++)for(let y=cells[1];y<=cells[3];y++){const q=ed.scr(e.x+x*s,e.y+y*s);c.drawImage(im,(TS.idx%cols)*ts,Math.floor(TS.idx/cols)*ts,ts,ts,q[0],q[1],s*z,s*z)}
c.globalAlpha=1
}
c.strokeStyle=TS.tool==='eraser'?'#ff4d6a':'#ffd34d'
c.lineWidth=2
c.strokeRect(p0[0],p0[1],p1[0]-p0[0],p1[1]-p0[1])
}
let rtT=0
function renderTilesSoon(){clearTimeout(rtT);rtT=setTimeout(()=>{if(cur()==='tiles')renderTiles()},120)}
function cur(){const b=document.querySelector('.btab.on');return b?b.dataset.btab:''}
const $=s=>document.querySelector(s)
function renderAnim(){
const box=$('#anim')
if(!box)return
cancelAnimationFrame(raf)
const d=ed.selData()
if(!d||ed.is3()){empty(box,'film','No 2D entity selected','Select a 2D entity to give it sprite animations: walk cycles, attacks, idle loops.');return}
if(d.shape==='tilemap'){empty(box,'film','Tilemaps are not animated','Select a sprite or shape entity.');return}
box.innerHTML=''
const anims=d.anims||{}
const names=Object.keys(anims)
if(!animSel||!anims[animSel])animSel=d.anim&&anims[d.anim]?d.anim:names[0]||null
const list=h('div',{class:'alist'})
for(const n of names){
const it=h('div',{class:'item'+(n===animSel?' on':''),onclick:()=>{animSel=n;frameSel=-1;renderAnim()}},
h('button',{class:'ib'+(d.anim===n?' star':''),title:d.anim===n?'Default animation':'Make default',html:ic('star',13),onclick:ev=>{ev.stopPropagation();ed.snap();d.anim=n;ed.refresh();renderAnim()}}),
h('span',{class:'nm',text:n}),
h('span',{class:'scb',text:(anims[n].frames||[]).length+'f'}),
h('button',{class:'ib',title:'Delete',html:ic('trash',13),onclick:ev=>{ev.stopPropagation();ed.snap();delete anims[n];if(d.anim===n)d.anim=Object.keys(anims)[0]||'';ed.refresh();renderAnim();ed.renderHier()}}))
list.append(it)
}
const add=h('button',{class:'btn sm',html:ic('plus',13)+'New animation',onclick:async()=>{
const n=await ed.dialog({title:'New animation',msg:'Name it after what it shows, like walk, idle or jump.',input:names.length?'':'idle',buttons:[{label:'Cancel',value:null},{label:'Create',value:true,primary:true}]})
if(!n||!n.trim())return
const nm=n.trim()
if(anims[nm]){ed.toast('An animation named '+nm+' exists','err');return}
ed.snap()
if(!d.anims)d.anims=anims
const imgs=imageAssets(),sheet=imgs.find(k=>/sheet|sprite|anim/i.test(k))||imgs[0]||''
const a={sheet,fw:32,fh:32,frames:[],fps:8,loop:true}
const im=imgOf(sheet)
if(im&&im.naturalWidth){a.fh=im.naturalHeight;a.fw=im.naturalHeight}
d.anims[nm]=a
if(!d.anim)d.anim=nm
if(d.shape!=='sprite'){d.shape='sprite';d.w=Math.max(d.w,a.fw);d.h=Math.max(d.h,a.fh)}
animSel=nm
ed.refresh();ed.buildInspector();ed.renderHier();renderAnim()
}})
const side=h('div',{class:'pp-side'},h('div',{class:'pp-h',html:ic('film',14)+'<b></b>'}),list,add)
side.querySelector('.pp-h b').textContent=d.name+' animations'
box.append(side)
const a=animSel&&anims[animSel]
if(!a){box.append(h('div',{class:'pp-main'},h('div',{class:'empty pe'},h('span',{html:ic('film',30)}),h('h3',{text:'No animations yet'}),h('p',{text:'Create one, pick a sprite sheet, then click frames to build the timeline.'}))));return}
const sheets=imageAssets()
const props=h('div',{class:'aprops'},
fld('Name',txtIn(animSel,v=>{})),
fld('Sheet',h('div',{class:'row2'},sel(sheets,a.sheet,v=>{ed.snap();a.sheet=v;const im=imgOf(v);if(im&&im.naturalWidth&&a.fh>im.naturalHeight){a.fh=im.naturalHeight;a.fw=im.naturalHeight}ed.refresh();renderAnim()},'Choose…'),h('button',{class:'btn sm',title:'Add a sample 8-frame character sheet',html:ic('wand',13)+'Sample',onclick:async()=>{const nm=await ed.addAsset('hero_sheet.png','image',sampleSheet());ed.snap();a.sheet=nm;a.fw=32;a.fh=32;if(!a.frames.length)a.frames=[0,1,2,3,4,5,6,7];d.w=d.w<32?32:d.w;d.h=d.h<32?32:d.h;ed.refresh();renderAnim()}}))),
fld('Frame size',h('div',{class:'row2'},numIn(a.fw,v=>{a.fw=Math.max(1,v|0);ed.refresh();drawSheet()},1),numIn(a.fh,v=>{a.fh=Math.max(1,v|0);ed.refresh();drawSheet()},1))),
fld('Speed (fps)',numIn(a.fps,v=>{a.fps=Math.max(0.1,v);ed.refresh()},1)),
fld('Loop',sw(a.loop!==false,v=>{a.loop=v;ed.refresh()})))
const nameIn=props.querySelector('input')
nameIn.addEventListener('change',()=>{
const nv=nameIn.value.trim()
if(!nv||nv===animSel||anims[nv]){nameIn.value=animSel;return}
const o={}
for(const k of Object.keys(anims))o[k===animSel?nv:k]=anims[k]
d.anims=o
if(d.anim===animSel)d.anim=nv
animSel=nv
ed.refresh();renderAnim()
})
const sheet=h('div',{class:'sheet'},h('canvas',{class:'scv'}))
const tl=h('div',{class:'atl'})
const tlb=h('div',{class:'pp-tb'},h('b',{text:'Timeline'}),h('span',{class:'hint',text:' click sheet frames to add · drag to reorder · Del removes'}),h('span',{style:'flex:1'}),
h('button',{class:'btn sm',html:ic('listplus',13)+'All frames',onclick:()=>{const im=imgOf(a.sheet);if(!im||!im.naturalWidth)return;const n=Math.max(1,Math.floor(im.naturalWidth/a.fw))*Math.max(1,Math.floor(im.naturalHeight/a.fh));ed.snap();a.frames=Array.from({length:n},(_,i)=>i);ed.refresh();renderAnim()}}),
h('button',{class:'btn sm',html:ic('reverse',13)+'Reverse',onclick:()=>{ed.snap();a.frames.reverse();ed.refresh();renderAnim()}}),
h('button',{class:'btn sm',html:ic('trash',13)+'Clear',onclick:()=>{ed.snap();a.frames=[];frameSel=-1;ed.refresh();renderAnim()}}))
const main=h('div',{class:'pp-main'},props,sheet,tlb,tl)
const pv=h('canvas',{class:'apv',width:150,height:150})
const pvl=h('div',{class:'hint',style:'text-align:center'})
const prev=h('div',{class:'pp-prev'},h('div',{class:'pp-h',html:ic('play',14)+'Preview'}),pv,pvl,h('button',{class:'btn sm',html:ic(prevPlay?'pause':'play',13)+(prevPlay?'Pause':'Play'),onclick:()=>{prevPlay=!prevPlay;renderAnim()}}))
box.append(main,prev)
function frameBox(f,i){
const c=h('canvas',{width:56,height:56})
drawFrame(c,a,f)
const it=h('div',{class:'af'+(i===frameSel?' on':''),draggable:'true',title:'Frame '+f},c,h('span',{text:String(f)}))
it.addEventListener('click',()=>{frameSel=i;renderAnim()})
it.addEventListener('dragstart',e=>{e.dataTransfer.setData('text/plain',String(i));e.dataTransfer.effectAllowed='move'})
it.addEventListener('dragover',e=>{e.preventDefault();it.classList.add('dov')})
it.addEventListener('dragleave',()=>it.classList.remove('dov'))
it.addEventListener('drop',e=>{e.preventDefault();e.stopPropagation();const from=+e.dataTransfer.getData('text/plain');if(isNaN(from)||from===i)return;ed.snap();const[x]=a.frames.splice(from,1);a.frames.splice(i,0,x);frameSel=i;ed.refresh();renderAnim()})
return it
}
a.frames.forEach((f,i)=>tl.append(frameBox(f,i)))
if(!a.frames.length)tl.append(h('div',{class:'hint',style:'padding:14px',text:'No frames yet. Click frames in the sheet above.'}))
tl.tabIndex=0
tl.addEventListener('keydown',e=>{if((e.key==='Delete'||e.key==='Backspace')&&frameSel>=0){ed.snap();a.frames.splice(frameSel,1);frameSel=Math.min(frameSel,a.frames.length-1);ed.refresh();renderAnim();e.stopPropagation()}})
const scv=sheet.querySelector('canvas')
scv.addEventListener('pointerdown',ev=>{
const im=imgOf(a.sheet)
if(!im||!im.naturalWidth)return
const k=scv.width/im.naturalWidth,r=scv.getBoundingClientRect()
const x=Math.floor((ev.clientX-r.left)/(a.fw*k)),y=Math.floor((ev.clientY-r.top)/(a.fh*k)),cols=Math.max(1,Math.floor(im.naturalWidth/a.fw))
if(x>=cols||y>=Math.floor(im.naturalHeight/a.fh))return
ed.snap()
a.frames.push(y*cols+x)
ed.refresh()
renderAnim()
})
drawSheet()
let t0=performance.now()
const loop=()=>{
if(cur()!=='anim')return
raf=requestAnimationFrame(loop)
const n=a.frames.length
if(!n){const c=pv.getContext('2d');c.clearRect(0,0,150,150);pvl.textContent='No frames';return}
let i=Math.floor((performance.now()-t0)/1000*(a.fps||8))
if(!prevPlay)i=Math.max(0,frameSel)
i=a.loop!==false?i%n:Math.min(i,n-1)
drawFrame(pv,a,a.frames[i])
pvl.textContent='Frame '+(i+1)+' / '+n+' · '+a.fps+' fps'
}
loop()
function drawSheet(){
const im=imgOf(a.sheet),c=scv.getContext('2d')
if(!im||!im.naturalWidth){scv.width=420;scv.height=60;c.fillStyle='#6b6385';c.font='13px Inter';c.fillText(sheets.length?'Choose a sprite sheet above':'Import a sprite sheet in Assets, or click Sample',12,34);return}
const k=Math.max(1,Math.min(4,Math.floor(150/im.naturalHeight)||1))
scv.width=im.naturalWidth*k;scv.height=im.naturalHeight*k
c.imageSmoothingEnabled=false
c.drawImage(im,0,0,scv.width,scv.height)
const cols=Math.max(1,Math.floor(im.naturalWidth/a.fw)),rows=Math.max(1,Math.floor(im.naturalHeight/a.fh))
c.strokeStyle='rgba(157,92,255,0.7)'
c.lineWidth=1
c.font='600 10px Inter'
for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){
c.strokeRect(x*a.fw*k+0.5,y*a.fh*k+0.5,a.fw*k-1,a.fh*k-1)
c.fillStyle='rgba(10,9,16,0.7)';c.fillRect(x*a.fw*k+1,y*a.fh*k+1,16,12)
c.fillStyle='#ece8f6';c.fillText(String(y*cols+x),x*a.fw*k+3,y*a.fh*k+10)
}
}
}
function drawFrame(cv,a,f){
const c=cv.getContext('2d'),im=imgOf(a.sheet)
c.clearRect(0,0,cv.width,cv.height)
if(!im||!im.naturalWidth)return
const cols=Math.max(1,Math.floor(im.naturalWidth/a.fw)),sx=(f%cols)*a.fw,sy=Math.floor(f/cols)*a.fh
const k=Math.min(cv.width/a.fw,cv.height/a.fh)
c.imageSmoothingEnabled=false
c.drawImage(im,sx,sy,a.fw,a.fh,(cv.width-a.fw*k)/2,(cv.height-a.fh*k)/2,a.fw*k,a.fh*k)
}
function cuts(){const p=S.project;if(!p.cutscenes)p.cutscenes=[];return p.cutscenes}
function renderCuts(){
const box=$('#cuts')
if(!box)return
box.innerHTML=''
const list=cuts()
if(!csSel||!list.find(c=>c.id===csSel))csSel=list[0]?list[0].id:null
const cs=list.find(c=>c.id===csSel)
const sc=ed.scene()
const li=h('div',{class:'alist'})
for(const c of list){
li.append(h('div',{class:'item'+(c.id===csSel?' on':''),onclick:()=>{csSel=c.id;stepSel=null;renderCuts()}},h('span',{class:'ti',html:ic('video',14)}),h('span',{class:'nm',text:c.name}),sc.cutscene===c.name?h('span',{class:'scb',text:'auto'}):null,h('button',{class:'ib',title:'Delete',html:ic('trash',13),onclick:async ev=>{ev.stopPropagation();const ok=await ed.dialog({title:'Delete cutscene "'+c.name+'"?',buttons:[{label:'Cancel',value:null},{label:'Delete',value:1,danger:true,primary:true}]});if(!ok)return;ed.snapAll();list.splice(list.indexOf(c),1);ed.markDirty();renderCuts()}})))
}
const nb=h('button',{class:'btn sm',html:ic('plus',13)+'New cutscene',onclick:async()=>{
const n=await ed.dialog({title:'New cutscene',msg:'Cutscenes move entities and the camera on a timeline, show captions and play sounds.',input:'Intro',buttons:[{label:'Cancel',value:null},{label:'Create',value:true,primary:true}]})
if(!n||!n.trim())return
ed.snapAll()
const c={id:ed.uid(),name:n.trim(),letterbox:true,lock:true,skippable:true,steps:[]}
const first=sc.entities.find(e=>!e.prefab&&e.shape!=='tilemap')
if(first){
c.steps.push({id:ed.uid(),type:'caption',t:0,dur:2.5,text:'Meanwhile…'})
c.steps.push({id:ed.uid(),type:'camera',t:0,dur:2,ease:'inout',x:ed.is3()?(first.x||0)+6:first.x,y:ed.is3()?(first.y||0)+4:first.y,z:ed.is3()?(first.z||0)+8:0,tx:first.x||0,ty:first.y||0,tz:first.z||0,zoom:1.5})
c.steps.push({id:ed.uid(),type:'say',t:2,dur:2,target:first.name,text:'Let\'s go!'})
}
list.push(c)
csSel=c.id
ed.markDirty()
renderCuts()
}})
const side=h('div',{class:'pp-side'},h('div',{class:'pp-h',html:ic('video',14)+'<b>Cutscenes</b>'}),li,nb)
box.append(side)
if(!cs){box.append(h('div',{class:'pp-main'},h('div',{class:'empty pe'},h('span',{html:ic('video',30)}),h('h3',{text:'No cutscenes yet'}),h('p',{text:'Make an intro, a boss reveal or an ending. Play them from scripts or automatically when a scene starts.'}))));return}
const set=(k,v)=>{ed.snapAll();cs[k]=v;ed.markDirty()}
const props=h('div',{class:'aprops cprops'},
fld('Name',(()=>{const i=txtIn(cs.name,()=>{});i.addEventListener('change',()=>{const v=i.value.trim();if(!v)return;for(const s of S.project.scenes)if(s.cutscene===cs.name)s.cutscene=v;set('name',v);renderCuts()});return i})()),
fld('Letterbox',sw(cs.letterbox!==false,v=>set('letterbox',v))),
fld('Lock input',sw(cs.lock!==false,v=>set('lock',v))),
fld('Skippable',sw(cs.skippable!==false,v=>set('skippable',v))),
fld('Auto-play',sw(sc.cutscene===cs.name,v=>{ed.snapAll();sc.cutscene=v?cs.name:'';ed.markDirty();renderCuts()})))
const end=Math.max(4,...cs.steps.map(s=>(+s.t||0)+(+s.dur||0)))+1
const addB=h('button',{class:'btn sm',html:ic('plus',13)+'Add step',onclick:ev=>{
const r=ev.currentTarget.getBoundingClientRect()
ed.showMenu(r.left,r.bottom+4,STEP_TYPES.map(t=>({ic:t[2],label:t[1],fn:()=>addStep(cs,t[0])})))
}})
const tb=h('div',{class:'pp-tb'},addB,h('button',{class:'btn sm primary',html:ic('play',13)+'Preview',onclick:()=>ed.play(cs.name)}),h('span',{style:'flex:1'}),h('span',{class:'hint',text:cs.steps.length+' steps · '+(end-1).toFixed(1)+' s · drag bars to retime, drag the right edge to change length'}))
const tl=h('div',{class:'cstl'})
const ruler=h('div',{class:'csr',style:'width:'+(end*PPS+160)+'px'})
for(let t=0;t<=end;t+=0.5)ruler.append(h('span',{class:t%1?'mn':'mj',style:'left:'+(160+t*PPS)+'px',text:t%1?'':t+'s'}))
tl.append(ruler)
cs.steps.slice().sort((a,b)=>(+a.t||0)-(+b.t||0)).forEach(s=>{
const m=TMETA[s.type]||{label:s.type,ic:'sparkles'}
const lab=h('div',{class:'csl',html:ic(m.ic,13)})
lab.append(h('span',{text:m.label+(s.target?' · '+s.target:'')}))
const bar=h('div',{class:'csb'+(s.id===stepSel?' on':'')+(+s.dur>0?'':' inst'),style:'left:'+((+s.t||0)*PPS)+'px;width:'+Math.max(10,(+s.dur||0)*PPS)+'px;--bc:'+(TYPE_COL[s.type]||'#9d5cff')},h('span',{text:s.text||s.sound||s.anim||s.name||''}),+s.dur>0?h('i',{class:'rs'}):null)
const track=h('div',{class:'cstr',style:'width:'+(end*PPS)+'px'},bar)
const row=h('div',{class:'csrow'+(s.id===stepSel?' on':'')},lab,track)
lab.addEventListener('click',()=>{stepSel=s.id;renderCuts()})
bar.addEventListener('pointerdown',ev=>{
ev.preventDefault()
stepSel=s.id
bar.setPointerCapture(ev.pointerId)
const rs=ev.target.classList.contains('rs'),x0=ev.clientX,t0=+s.t||0,d0=+s.dur||0
let moved=false
const mv=e2=>{
const dt=(e2.clientX-x0)/PPS
if(!moved&&Math.abs(e2.clientX-x0)>2){moved=true;ed.snapAll()}
if(!moved)return
const q=v=>e2.shiftKey?Math.round(v*100)/100:Math.round(v*20)/20
if(rs){s.dur=Math.max(0.05,q(d0+dt));bar.style.width=Math.max(10,s.dur*PPS)+'px'}
else{s.t=Math.max(0,q(t0+dt));bar.style.left=s.t*PPS+'px'}
}
const up=()=>{bar.removeEventListener('pointermove',mv);bar.removeEventListener('pointerup',up);if(moved)ed.markDirty();renderCuts()}
bar.addEventListener('pointermove',mv)
bar.addEventListener('pointerup',up)
})
tl.append(row)
})
if(!cs.steps.length)tl.append(h('div',{class:'hint',style:'padding:16px',text:'Add steps with the button above. Steps that overlap play at the same time.'}))
const main=h('div',{class:'pp-main'},props,tb,tl)
box.append(main)
const st=cs.steps.find(s=>s.id===stepSel)
const insp=h('div',{class:'pp-prev csi'})
if(st)stepInspector(insp,cs,st)
else insp.append(h('div',{class:'hint',style:'padding:12px',text:'Select a step to edit it.'}))
box.append(insp)
}
function addStep(cs,type){
ed.snapAll()
const m=TMETA[type],sc=ed.scene(),d=ed.selData()
const tgt=m.target?(d&&!d.prefab?d.name:(sc.entities.find(e=>!e.prefab&&e.shape!=='tilemap')||{}).name||''):''
const end=cs.steps.reduce((a,s)=>Math.max(a,(+s.t||0)+(+s.dur||0)),0)
const s={id:ed.uid(),type,t:Math.round(end*20)/20,dur:m.dur,ease:'inout'}
if(tgt)s.target=tgt
const td=sc.entities.find(e=>e.name===tgt)
if(type==='move'&&td){s.x=td.x+(ed.is3()?2:100);s.y=td.y;s.z=td.z||0}
if(type==='rotate')s.rot=90
if(type==='fade')s.alpha=0
if(type==='scale'&&td){s.w=td.w*1.5;s.h=td.h*1.5}
if(type==='camera'){const c=S.game.camera;if(ed.is3()){Object.assign(s,{x:r(c.x),y:r(c.y),z:r(c.z),tx:r(c.tx),ty:r(c.ty),tz:r(c.tz)})}else Object.assign(s,{x:r(S.cam.x),y:r(S.cam.y),zoom:1})}
if(type==='say')s.text='Hello!'
if(type==='caption')s.text='Chapter 1'
if(type==='sound'||type==='music'){s.sound=audioAssets()[0]||'';s.vol=type==='music'?0.6:1}
if(type==='shake')s.amount=8
if(type==='anim'&&td&&td.anims)s.anim=td.anim||Object.keys(td.anims)[0]||''
if(type==='setvar'){s.name='seenIntro';s.value='1'}
if(type==='emit'){s.name='go';s.value=''}
cs.steps.push(s)
stepSel=s.id
ed.markDirty()
renderCuts()
}
const r=v=>Math.round(v*100)/100
function stepInspector(box,cs,s){
const m=TMETA[s.type]||{}
const set=(k,v)=>{s[k]=v;ed.markDirty()}
const re=()=>renderCuts()
const names=ed.scene().entities.filter(e=>!e.prefab&&e.shape!=='tilemap').map(e=>e.name)
const td=ed.scene().entities.find(e=>e.name===s.target)
box.append(h('div',{class:'pp-h',html:ic(m.ic||'sparkles',14)+'<b></b>'}))
box.querySelector('.pp-h b').textContent=m.label||s.type
const f=[]
f.push(fld('Type',sel(STEP_TYPES.map(t=>[t[0],t[1]]),s.type,v=>{ed.snapAll();s.type=v;if(TMETA[v].target&&!s.target&&names[0])s.target=names[0];ed.markDirty();re()})))
f.push(fld('Start (s)',numIn(s.t||0,v=>{set('t',Math.max(0,v))},0.05)))
if(TWEEN.indexOf(s.type)>=0||['say','caption','shake'].indexOf(s.type)>=0)f.push(fld('Duration (s)',numIn(s.dur||0,v=>set('dur',Math.max(0,v)),0.05)))
if(TWEEN.indexOf(s.type)>=0)f.push(fld('Easing',sel([['inout','Smooth'],['linear','Linear'],['in','Ease in'],['out','Ease out'],['back','Overshoot'],['bounce','Bounce']],s.ease||'inout',v=>{ed.snapAll();set('ease',v)})))
if(m.target)f.push(fld('Target',sel(names,s.target,v=>{ed.snapAll();set('target',v);re()},'Choose…')))
const n3=ed.is3()
if(s.type==='move'){
f.push(fld('X',numIn(s.x,v=>set('x',v))),fld('Y',numIn(s.y,v=>set('y',v))))
if(n3)f.push(fld('Z',numIn(s.z,v=>set('z',v))))
f.push(h('button',{class:'btn sm',html:ic('target',13)+'Use target\'s current spot',onclick:()=>{if(!td)return;ed.snapAll();const w=ed.worldOf(td);s.x=r(w.x);s.y=r(w.y);s.z=r(w.z||0);ed.markDirty();re()}}))
}
if(s.type==='rotate')f.push(fld(n3?'Yaw (deg)':'Angle (deg)',numIn(s.rot,v=>set('rot',v))))
if(s.type==='fade')f.push(fld('Opacity',numIn(s.alpha,v=>set('alpha',Math.max(0,Math.min(1,v))),0.05)))
if(s.type==='scale')f.push(fld('Width',numIn(s.w,v=>set('w',v))),fld('Height',numIn(s.h,v=>set('h',v))))
if(s.type==='camera'){
if(n3)f.push(fld('Camera X',numIn(s.x,v=>set('x',v))),fld('Camera Y',numIn(s.y,v=>set('y',v))),fld('Camera Z',numIn(s.z,v=>set('z',v))),fld('Look X',numIn(s.tx,v=>set('tx',v))),fld('Look Y',numIn(s.ty,v=>set('ty',v))),fld('Look Z',numIn(s.tz,v=>set('tz',v))))
else f.push(fld('X',numIn(s.x,v=>set('x',v))),fld('Y',numIn(s.y,v=>set('y',v))),fld('Zoom',numIn(s.zoom||1,v=>set('zoom',Math.max(0.05,v)),0.1)))
f.push(h('button',{class:'btn sm',html:ic('target',13)+'Use current view',onclick:()=>{ed.snapAll();const c=S.game.camera;if(n3)Object.assign(s,{x:r(c.x),y:r(c.y),z:r(c.z),tx:r(c.tx),ty:r(c.ty),tz:r(c.tz)});else Object.assign(s,{x:r(S.cam.x),y:r(S.cam.y),zoom:r(S.cam.zoom)});ed.markDirty();re()}}))
}
if(s.type==='say'||s.type==='caption')f.push(fld('Text',txtIn(s.text,v=>set('text',v))))
if(s.type==='sound'||s.type==='music'){const au=audioAssets();f.push(fld('Sound',sel(au,s.sound,v=>{ed.snapAll();set('sound',v)},au.length?'Choose…':'Import audio in Assets')),fld('Volume',numIn(s.vol==null?1:s.vol,v=>set('vol',Math.max(0,v)),0.05)))}
if(s.type==='shake')f.push(fld('Strength',numIn(s.amount||6,v=>set('amount',v))))
if(s.type==='anim'){const an=td&&td.anims?Object.keys(td.anims):[];f.push(fld('Animation',sel(an,s.anim,v=>{ed.snapAll();set('anim',v)},an.length?'Choose…':'Target has no animations')))}
if(s.type==='setvar'||s.type==='emit')f.push(fld(s.type==='emit'?'Message':'Global',txtIn(s.name,v=>set('name',v))),fld('Value',txtIn(s.value,v=>set('value',v))))
for(const x of f)box.append(x)
box.append(h('div',{class:'row2',style:'margin-top:10px'},
h('button',{class:'btn sm',html:ic('copy',13)+'Duplicate',onclick:()=>{ed.snapAll();const c=JSON.parse(JSON.stringify(s));c.id=ed.uid();c.t=(+s.t||0)+(+s.dur||0);cs.steps.push(c);stepSel=c.id;ed.markDirty();re()}}),
h('button',{class:'btn sm danger',html:ic('trash',13)+'Delete',onclick:()=>{ed.snapAll();cs.steps.splice(cs.steps.indexOf(s),1);stepSel=null;ed.markDirty();re()}})))
}
P.render=t=>{
t=t||cur()
if(t==='tiles')renderTiles()
else if(t==='anim')renderAnim()
else if(t==='cuts')renderCuts()
}
P.onSelect=()=>{
const t=cur()
if(t==='tiles'||t==='anim')P.render(t)
}
P.init=e=>{ed=e;S=e.S;h=e.h;ic=e.ic}
P.defaultTileset=defaultTileset
P.sampleSheet=sampleSheet
P.TS=TS
window.VuePanels=P
})()
