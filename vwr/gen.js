const fs=require('fs'),path=require('path')
const b=fs.readFileSync(path.join(__dirname,'vwr.wasm')).toString('base64')
const src=`(function(root){
const B=${JSON.stringify(b)}
const bytes=()=>{if(typeof Buffer!=='undefined')return Buffer.from(B,'base64');const s=atob(B),u=new Uint8Array(s.length);for(let i=0;i<s.length;i++)u[i]=s.charCodeAt(i);return u}
const V={exports:null,version:'1.0.0',name:'VWR'}
V.ready=(typeof WebAssembly==='undefined'?Promise.reject(new Error('no wasm')):WebAssembly.instantiate(bytes(),{})).then(r=>{V.exports=r.instance.exports;return V}).catch(()=>V)
root.VWR=V
if(typeof module!=='undefined'&&module.exports)module.exports=V
})(typeof window!=='undefined'?window:globalThis)
`
fs.writeFileSync(path.join(__dirname,'..','src','vwr.js'),src)
console.log('vwr.wasm',fs.statSync(path.join(__dirname,'vwr.wasm')).size,'bytes')
