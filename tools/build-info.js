const fs=require('fs'),path=require('path'),cp=require('child_process')
const root=path.join(__dirname,'..')
let news=[]
try{
news=cp.execSync('git log -n 3 --format=%cs%x09%s',{cwd:root,encoding:'utf8'}).trim().split('\n').filter(Boolean).map(l=>{const i=l.indexOf('\t');return{d:l.slice(0,i),t:l.slice(i+1)}})
}catch(x){
try{news=JSON.parse(fs.readFileSync(path.join(root,'src','buildinfo.json'),'utf8')).news}catch(y){}
}
const info={date:new Date().toISOString().slice(0,10),news}
fs.writeFileSync(path.join(root,'src','buildinfo.js'),'window.VUE_BUILD='+JSON.stringify(info)+'\n')
fs.writeFileSync(path.join(root,'src','buildinfo.json'),JSON.stringify(info))
