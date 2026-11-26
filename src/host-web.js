(function(){
if(window.host)return
const C=window.VUE_CDN||{}
const txt=u=>fetch(u).then(r=>{if(!r.ok)throw new Error(u+' '+r.status);return r.text()})
let tsP=null
const loadTs=()=>tsP||(tsP=new Promise((res,rej)=>{const s=document.createElement('script');s.src=C.ts;s.onload=()=>res(window.ts);s.onerror=rej;document.head.append(s)}))
const download=(name,blob)=>{const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.append(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},1000);return name}
const pick=(accept,multi)=>new Promise(res=>{const i=document.createElement('input');i.type='file';i.accept=accept;i.multiple=!!multi;i.onchange=()=>res(Array.from(i.files||[]));i.click()})
const readAs=(f,how)=>new Promise(res=>{const r=new FileReader();r.onload=()=>res(r.result);r[how](f)})
const b64=s=>{const b=atob(s),u=new Uint8Array(b.length);for(let i=0;i<b.length;i++)u[i]=b.charCodeAt(i);return u}
const CRC=(()=>{const t=new Uint32Array(256);for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xedb88320^(c>>>1):c>>>1;t[n]=c>>>0}return t})()
const crc=b=>{let c=0xffffffff;for(let i=0;i<b.length;i++)c=CRC[(c^b[i])&255]^(c>>>8);return(c^0xffffffff)>>>0}
function zip(files){
const enc=new TextEncoder(),parts=[],cen=[]
let off=0
for(const f of files){
const data=f.b64?b64(f.data):enc.encode(f.data),name=enc.encode(f.name),c=crc(data)
const h=new DataView(new ArrayBuffer(30))
h.setUint32(0,0x04034b50,true);h.setUint16(4,20,true);h.setUint16(6,0x0800,true);h.setUint32(14,c,true);h.setUint32(18,data.length,true);h.setUint32(22,data.length,true);h.setUint16(26,name.length,true)
parts.push(new Uint8Array(h.buffer),name,data)
const ce=new DataView(new ArrayBuffer(46))
ce.setUint32(0,0x02014b50,true);ce.setUint16(4,20,true);ce.setUint16(6,20,true);ce.setUint16(8,0x0800,true);ce.setUint32(16,c,true);ce.setUint32(20,data.length,true);ce.setUint32(24,data.length,true);ce.setUint16(28,name.length,true);ce.setUint32(42,off,true)
cen.push(new Uint8Array(ce.buffer),name)
off+=30+name.length+data.length
}
const cs=off
let cl=0
for(const c of cen)cl+=c.length
const e=new DataView(new ArrayBuffer(22))
e.setUint32(0,0x06054b50,true);e.setUint16(8,files.length,true);e.setUint16(10,files.length,true);e.setUint32(12,cl,true);e.setUint32(16,cs,true)
return new Blob(parts.concat(cen,[new Uint8Array(e.buffer)]),{type:'application/zip'})
}
window.host={
web:true,
version:async()=>(window.VUE_VERSION||'')+'-web',
platform:async()=>'web',
transpile:async src=>{const ts=await loadTs();const r=ts.transpileModule(String(src),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020},reportDiagnostics:true});return{code:r.outputText,errors:(r.diagnostics||[]).map(d=>ts.flattenDiagnosticMessageText(d.messageText,'\n'))}},
runtimeSource:async()=>(await Promise.all(['vwr.js','behaviors.js','apilib.js','runtime.js','model3d.js','render3d.js'].map(txt))).join('\n;\n'),
threeSource:()=>txt(C.three),
readProject:async()=>null,
openProject:async()=>{const f=(await pick('.vue,.json'))[0];return f?{path:f.name,data:await readAs(f,'readAsText')}:null},
saveProject:async(data,file)=>download((file||'game').replace(/\.vue$/,'')+'.vue',new Blob([data],{type:'application/json'})),
exportHtml:async(html,name)=>download((name||'game')+'.html',new Blob([html],{type:'text/html'})),
importAssets:async()=>{const fs=await pick('image/*,audio/*',true);return Promise.all(fs.map(async f=>({name:f.name,type:f.type.indexOf('audio')===0?'audio':'image',data:await readAs(f,'readAsDataURL')})))},
detach:async html=>{const w=window.open('','_blank');if(w){w.document.open();w.document.write(html);w.document.close()}return true},
port:async o=>{
const safe=String(o.name||'game').replace(/[^\w\- ]+/g,'').trim()||'game'
if(o.target==='desktop')throw new Error('Desktop apps can only be ported from the Windows app')
if(o.target==='html')return download(safe+'.html',new Blob([o.files[0].data],{type:'text/html'}))
if(o.target==='project')return download(safe+'.vue',new Blob([o.files[0].data],{type:'application/json'}))
return download(safe+(o.target==='pwa'?'-pwa':'-web')+'.zip',zip(o.files))
},
onPortProgress:()=>{}
}
})()
