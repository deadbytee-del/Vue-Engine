const{app,BrowserWindow,ipcMain,dialog,Menu}=require('electron')
const fs=require('fs')
const path=require('path')
let ts=null
try{ts=require('typescript')}catch(e){}
let win=null
const mime={png:'image/png',jpg:'image/jpeg',jpeg:'image/jpeg',gif:'image/gif',webp:'image/webp',bmp:'image/bmp',svg:'image/svg+xml',wav:'audio/wav',mp3:'audio/mpeg',ogg:'audio/ogg'}
function create(){
Menu.setApplicationMenu(null)
win=new BrowserWindow({width:1600,height:950,minWidth:1100,minHeight:650,backgroundColor:'#0a0910',title:'Vue Engine',icon:path.join(__dirname,'build','icon.ico'),show:false,titleBarStyle:'hidden',titleBarOverlay:{color:'#110f19',symbolColor:'#ece8f6',height:40},webPreferences:{preload:path.join(__dirname,'preload.js'),contextIsolation:true,nodeIntegration:false,sandbox:false}})
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
ipcMain.handle('runtime:source',()=>fs.readFileSync(path.join(__dirname,'src','runtime.js'),'utf8')+'\n'+fs.readFileSync(path.join(__dirname,'src','render3d.js'),'utf8'))
ipcMain.handle('three:source',()=>fs.readFileSync(path.join(__dirname,'node_modules','three','build','three.min.js'),'utf8'))
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
