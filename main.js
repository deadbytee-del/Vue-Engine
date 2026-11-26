const{app,BrowserWindow,ipcMain,dialog,Menu,shell}=require('electron')
const zlib=require('zlib')
const fs=require('fs')
const path=require('path')
let ts=null
try{ts=require('typescript')}catch(e){}
let win=null
const mime={png:'image/png',jpg:'image/jpeg',jpeg:'image/jpeg',gif:'image/gif',webp:'image/webp',bmp:'image/bmp',svg:'image/svg+xml',wav:'audio/wav',mp3:'audio/mpeg',ogg:'audio/ogg'}
function create(){
Menu.setApplicationMenu(null)
win=new BrowserWindow({width:1600,height:950,minWidth:1100,minHeight:650,backgroundColor:'#131313',title:'Vue Engine',icon:path.join(__dirname,'build','icon.ico'),show:false,titleBarStyle:'hidden',titleBarOverlay:{color:'#1b1b1b',symbolColor:'#e6e3dd',height:40},webPreferences:{preload:path.join(__dirname,'preload.js'),contextIsolation:true,nodeIntegration:false,sandbox:false}})
win.once('ready-to-show',()=>win.show())
win.webContents.on('before-input-event',(e,i)=>{
if(i.type==='keyDown'&&i.key==='F12')win.webContents.toggleDevTools()
})
win.loadFile(path.join(__dirname,'src','index.html'))
}
ipcMain.handle('ts:transpile',(e,src)=>{
if(!ts)return{code:'',errors:['TypeScript compiler is not available']}
const r=ts.transpileModule(String(src),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,strict:false,esModuleInterop:false},reportDiagnostics:true})
return{code:r.outputText,errors:(r.diagnostics||[]).map(d=>ts.flattenDiagnosticMessageText(d.messageText,'\n'))}
})
ipcMain.handle('runtime:source',()=>['vwr.js','runtime.js','render3d.js'].map(f=>fs.readFileSync(path.join(__dirname,'src',f),'utf8')).join('\n;\n'))
ipcMain.handle('three:source',()=>fs.readFileSync(path.join(__dirname,'node_modules','three','build','three.min.js'),'utf8'))
ipcMain.handle('shell:show',(e,p)=>{try{shell.showItemInFolder(p);return true}catch(x){return false}})
ipcMain.handle('project:read',(e,p)=>{try{return{path:p,data:fs.readFileSync(p,'utf8')}}catch(x){return null}})
ipcMain.handle('app:version',()=>app.getVersion())
ipcMain.handle('game:detach',(e,html,title)=>{
const f=path.join(app.getPath('temp'),'vue-engine-play.html')
fs.writeFileSync(f,html,'utf8')
const w=new BrowserWindow({width:1280,height:760,backgroundColor:'#000000',title:String(title||'Vue Game'),icon:path.join(__dirname,'build','icon.ico'),autoHideMenuBar:true})
w.setMenu(null)
w.loadFile(f)
return true
})
ipcMain.handle('project:open',async()=>{
const r=await dialog.showOpenDialog(win,{title:'Open Vue project',filters:[{name:'Vue project',extensions:['vue','json']}],properties:['openFile']})
if(r.canceled||!r.filePaths.length)return null
return{path:r.filePaths[0],data:fs.readFileSync(r.filePaths[0],'utf8')}
})
ipcMain.handle('project:save',async(e,data,file)=>{
let p=file
if(!p){
const r=await dialog.showSaveDialog(win,{title:'Save Vue project',defaultPath:'game.vue',filters:[{name:'Vue project',extensions:['vue']}]})
if(r.canceled||!r.filePath)return null
p=r.filePath
}
fs.writeFileSync(p,data,'utf8')
return p
})
ipcMain.handle('export:html',async(e,html,name)=>{
const safe=String(name||'game').replace(/[^\w\- ]+/g,'').trim()||'game'
const r=await dialog.showSaveDialog(win,{title:'Export game',defaultPath:safe+'.html',filters:[{name:'HTML game',extensions:['html']}]})
if(r.canceled||!r.filePath)return null
fs.writeFileSync(r.filePath,html,'utf8')
return r.filePath
})
const{zip,walk}=require('./zipper.js')
ipcMain.handle('port:run',async(e,o)=>{
const safe=String(o.name||'game').replace(/[^\w\- ]+/g,'').trim()||'game'
const ext={html:'html',project:'vue'}[o.target]||'zip'
const label={html:'HTML game',web:'Web game ZIP',pwa:'Installable web app ZIP',desktop:'Desktop app ZIP',project:'Vue project'}[o.target]
const r=await dialog.showSaveDialog(win,{title:'Port '+safe,defaultPath:safe+(o.target==='desktop'?'-'+process.platform:o.target==='pwa'?'-pwa':o.target==='web'?'-web':'')+'.'+ext,filters:[{name:label,extensions:[ext]}]})
if(r.canceled||!r.filePath)return null
const out=r.filePath
const files=(o.files||[]).map(f=>({name:f.name,data:Buffer.from(f.data,f.b64?'base64':'utf8')}))
const prog=(i,n)=>e.sender.send('port:progress',{i,n})
if(o.target==='html'||o.target==='project'){fs.writeFileSync(out,files[0].data);shell.showItemInFolder(out);return out}
if(o.target==='desktop'){
const dir=path.dirname(process.execPath),exe=path.basename(process.execPath)
const ent=[]
for(const f of walk(dir,'',[])){
if(/^resources\/(app\.asar|app\.asar\.unpacked|app-update\.yml|app)(\/|$)/.test(f.name))continue
if(f.name===exe){ent.push({name:safe+'/'+safe+(process.platform==='win32'?'.exe':''),src:f.src,exec:true});continue}
ent.push({name:safe+'/'+f.name,src:f.src,exec:f.exec})
}
const main="const{app,BrowserWindow,Menu}=require('electron')\nconst path=require('path')\napp.whenReady().then(()=>{\nMenu.setApplicationMenu(null)\nconst w=new BrowserWindow({width:"+(o.width|0||960)+",height:"+(o.height|0||540)+",useContentSize:true,backgroundColor:'#000000',title:"+JSON.stringify(o.name||safe)+",fullscreen:"+(!!o.fullscreen)+",autoHideMenuBar:true,webPreferences:{contextIsolation:true}})\nw.loadFile(path.join(__dirname,'index.html'))\nw.webContents.on('before-input-event',(e,i)=>{if(i.type==='keyDown'&&i.key==='F11')w.setFullScreen(!w.isFullScreen())})\n})\napp.on('window-all-closed',()=>app.quit())\n"
ent.push({name:safe+'/resources/app/package.json',data:Buffer.from(JSON.stringify({name:safe.toLowerCase().replace(/\s+/g,'-'),productName:o.name||safe,version:'1.0.0',main:'main.js'}))})
ent.push({name:safe+'/resources/app/main.js',data:Buffer.from(main)})
for(const f of files)ent.push({name:safe+'/resources/app/'+f.name,data:f.data})
await zip(ent,out,prog)
shell.showItemInFolder(out)
return out
}
await zip(files,out,prog)
shell.showItemInFolder(out)
return out
})
ipcMain.handle('app:platform',()=>process.platform)
ipcMain.handle('assets:import',async()=>{
const r=await dialog.showOpenDialog(win,{title:'Import assets',filters:[{name:'Images and audio',extensions:Object.keys(mime)}],properties:['openFile','multiSelections']})
if(r.canceled)return[]
return r.filePaths.map(f=>{
const ext=path.extname(f).slice(1).toLowerCase()
const m=mime[ext]
return{name:path.basename(f),type:m&&m.indexOf('audio')===0?'audio':'image',data:'data:'+m+';base64,'+fs.readFileSync(f).toString('base64')}
})
})
app.whenReady().then(create)
app.on('window-all-closed',()=>app.quit())
