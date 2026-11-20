const assert=require('assert')
const path=require('path')
const R=require(path.join(__dirname,'..','src','runtime.js'))
const V=require(path.join(__dirname,'..','src','vwr.js'))
const ctx=new Proxy({},{get:(t,k)=>k==='measureText'?()=>({width:10}):()=>{},set:()=>true})
const canvas={getContext:()=>ctx,width:0,height:0}
function scene(d3,nd,ns,seed){
let s=seed
const r=()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296}
const ents=[]
const side=Math.ceil(Math.sqrt(ns))
for(let i=0;i<ns;i++){const gx=i%side,gy=Math.floor(i/side);ents.push(d3?{id:'s'+i,x:gx*9-side*4.5,y:(gy%3)*2,z:gy*9-side*4.5,w:6,h:0.5,d:6,body:'static'}:{id:'s'+i,x:gx*160-side*80,y:200+gy*90,w:110,h:16,body:'static'})}
for(let i=0;i<nd;i++)ents.push(d3?{id:'d'+i,x:(r()-0.5)*80,y:5+r()*20,z:(r()-0.5)*80,w:0.5+r(),h:0.5+r()*2,d:0.5+r(),body:'dynamic',gravityScale:0.5+r()}:{id:'d'+i,x:(r()-0.5)*4000,y:-r()*600,w:8+r()*30,h:8+r()*30,body:'dynamic',gravityScale:0.5+r()})
if(!d3){const tiles={};for(let x=-80;x<80;x++)tiles[x+',30']=0;ents.push({id:'tm',name:'tm',shape:'tilemap',x:-2560,y:0,cell:32,tiles,solid:true})}
return{settings:{},assets:{},scenes:[{id:'a',name:'a',mode:d3?'3d':'2d',gravity:d3?30:1400,entities:ents}],startScene:'a'}
}
function sim(p,core,steps,vel){
p.settings.core=core
const g=new R.Game({canvas,project:p,scripts:{}})
g.loadScene('a')
let k=0
for(const e of g.entities)if(e.body==='dynamic'){e.vx=Math.sin(k)*vel;e.vz=Math.cos(k++)*vel*0.01}
const t0=process.hrtime.bigint()
for(let i=0;i<steps;i++)g.update(1/60)
return{ms:Number(process.hrtime.bigint()-t0)/1e6/steps,es:g.entities.filter(e=>e.body==='dynamic')}
}
V.ready.then(()=>{
assert.ok(V.exports,'VWR loaded')
for(const d3 of[false,true]){
const a=sim(scene(d3,400,400,7),'js',240,d3?3:200),b=sim(scene(d3,400,400,7),'vwr',240,d3?3:200)
let mx=0,gr=0
a.es.forEach((e,i)=>{const f=b.es[i];mx=Math.max(mx,Math.abs(e.x-f.x),Math.abs(e.y-f.y),Math.abs(e.z-f.z));if(e.grounded!==f.grounded)gr++})
assert.ok(mx<1e-6&&gr===0,(d3?'3D':'2D')+' parity max diff '+mx+' grounded mismatches '+gr)
console.log((d3?'3D':'2D')+' VWR matches JS physics (max diff '+mx.toExponential(1)+')')
}
{
const run=core=>{const p=scene(false,600,300,11);p.settings.core=core;const g=new R.Game({canvas,project:p,scripts:{}});g.loadScene('a');const ds=g.entities.filter(e=>e.body==='dynamic');for(let i=0;i<400;i++){if(i===250)ds.forEach((e,k)=>{if(k%7===0)e.vx=120;if(k%11===0)e.vy=-500});if(i===320)g.gravity=900;g.update(1/60)}return{ds,g}}
const a=run('js'),b=run('vwr'),c=run('vwr-steady')
let mx=0;a.ds.forEach((e,i)=>{for(const o of[b.ds[i],c.ds[i]]){mx=Math.max(mx,Math.abs(e.x-o.x),Math.abs(e.y-o.y));assert.strictEqual(e.grounded,o.grounded)}})
assert.ok(mx<1e-6,'resting skip parity '+mx)
console.log('VWR resting-body skip matches JS after wake-ups and gravity change')
}
{
const pile=core=>{const p=scene(false,20000,20000,3);p.settings.core=core;const g=new R.Game({canvas,project:p,scripts:{}});g.loadScene('a');for(let i=0;i<240;i++)g.update(1/60);const t0=process.hrtime.bigint();for(let i=0;i<60;i++)g.update(1/60);return Number(process.hrtime.bigint()-t0)/1e6/60}
const a=pile('js'),b=pile('vwr-steady'),c=pile('vwr')
console.log('2D settling pile 20000+20000: JS '+a.toFixed(2)+' ms, VWR Steady '+b.toFixed(2)+' ms, VWR '+c.toFixed(2)+' ms ('+(a/c).toFixed(2)+'x)')
}
for(const[nd,ns]of[[1000,1000],[5000,5000],[20000,20000]]){
const a=sim(scene(false,nd,ns,3),'js',120,150),b=sim(scene(false,nd,ns,3),'vwr',120,150)
console.log('2D '+nd+' dynamic + '+ns+' static: JS '+a.ms.toFixed(2)+' ms, VWR '+b.ms.toFixed(2)+' ms ('+(a.ms/b.ms).toFixed(2)+'x)')
}
{
const a=sim(scene(true,10000,10000,5),'js',120,3),b=sim(scene(true,10000,10000,5),'vwr',120,3)
console.log('3D 10000 dynamic + 10000 static: JS '+a.ms.toFixed(2)+' ms, VWR '+b.ms.toFixed(2)+' ms ('+(a.ms/b.ms).toFixed(2)+'x)')
}
console.log('vwr tests passed')
}).catch(e=>{console.error(e);process.exit(1)})
