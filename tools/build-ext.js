const fs=require('fs'),path=require('path'),vm=require('vm')
const dir=path.join(__dirname,'..','extensions'),out=[]
for(const f of fs.readdirSync(dir).filter(f=>f.endsWith('.js')).sort()){
const code=fs.readFileSync(path.join(dir,f),'utf8')
let d=null
const sb={VueExt:{register:x=>{d=x;return x}},globalThis:{}}
sb.globalThis=sb
vm.runInNewContext(code,sb,{filename:f})
if(!d)throw new Error(f+' did not register')
out.push({id:d.id,name:d.name,ns:d.ns||d.id,cat:d.cat||'Other',icon:d.icon||'puzzle',version:d.version||'1.0.0',modes:d.modes||'2d3d',requires:d.requires||[],desc:d.desc||'',defaults:d.defaults||{},example:d.example||'',choices:d.choices||{},file:f,size:Buffer.byteLength(code)})
}
fs.writeFileSync(path.join(dir,'index.json'),JSON.stringify({version:1,extensions:out},null,1))
console.log(out.length+' extensions, '+out.reduce((a,b)=>a+b.size,0)+' bytes')
