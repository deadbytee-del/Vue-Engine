(function(root){
const PLAIN=[
[2304,m=>{const n=/'([^']+)'/.exec(m);return(n?'"'+n[1]+'"':'This name')+' is not known here. Check the spelling, or create it first with let or const.'}],
[2339,m=>{const n=/'([^']+)'/.exec(m);return'This object has no "'+(n?n[1]:'that')+'". Check the spelling. Type a dot to see what it has.'}],
[2551,m=>{const n=/'([^']+)'/.exec(m);return'This object has no "'+(n?n[1]:'that')+'". Check the spelling. Type a dot to see what it has.'}],
[2322,m=>{const q=[...m.matchAll(/'([^']+)'/g)].map(x=>x[1]);return q.length>1?'Wrong kind of value: this needs '+q[1]+' but got '+q[0]+'.':'Wrong kind of value here.'}],
[2345,m=>{const q=[...m.matchAll(/'([^']+)'/g)].map(x=>x[1]);return q.length>1?'This value does not fit: it needs '+q[1]+' but got '+q[0]+'.':'This value does not fit.'}],
[2554,()=>'Wrong number of values in this call. Hover the name to see what it needs.'],
[2555,()=>'Wrong number of values in this call. Hover the name to see what it needs.'],
[2532,()=>'This could be empty. Check it first, for example with if (thing) { ... }.'],
[2531,()=>'This could be empty. Check it first, for example with if (thing) { ... }.'],
[1005,m=>'Something is missing: '+m.replace(/ expected\.?$/,'')+' is needed here.'],
[1109,()=>'An expression is needed here.'],
[1128,()=>'A statement is needed here.'],
[2300,m=>'This name is used twice. Rename one of them.'],
[6133,m=>'This is never used.'],
[2588,()=>'This is a constant and cannot be changed. Use let instead of const.']
]
const SNIPPETS=[
['on start','Run once when the game begins','export function start(): void {\n\t${1:vue.log("Hello")}\n}'],
['on update','Run every frame','export function update(dt: number): void {\n\t${1:self.x += 100 * dt}\n}'],
['on collision','Run when this touches something','export function collide(other: Entity): void {\n\tif (other.hasTag("${1:enemy}")) {\n\t\t${2:self.hurt(10)}\n\t}\n}'],
['on click','Run when this is clicked','export function click(): void {\n\t${1:vue.log("clicked")}\n}'],
['on key press','Run when a key goes down','export function keypress(key: string): void {\n\tif (key === "${1:space}") {\n\t\t${2:self.jump(500)}\n\t}\n}'],
['spawn','Create a copy of a prefab','const ${1:thing} = vue.spawn("${2:Prefab}", ${3:self.x}, ${4:self.y})'],
['tween','Move a value smoothly','await vue.tween(self, { x: ${1:300}, y: ${2:self.y} }, ${3:1}, "${4:inout}")'],
['timer every','Do something again and again','vue.every(${1:2}, () => {\n\t${2:vue.log("tick")}\n})'],
['wait','Pause this script','await vue.wait(${1:1})'],
['for each tag','Do something to every object with a tag','for (const ${1:e} of vue.all("${2:enemy}")) {\n\t${3:e.hurt(5)}\n}'],
['give behavior','Attach a ready-made behavior','vue.behavior(self, "${1:Health}", { ${2:max: 100} })'],
['move toward','Walk toward another object','const ${1:target} = vue.find("${2:Player}")\nif (${1:target}) {\n\tself.vx = Math.sign(${1:target}.x - self.x) * ${3:100}\n}']
]
const CALLS=[
[/vue\s*\.\s*(find|all|nearest|count|destroy)\s*\(\s*(?:[A-Za-z_.]+\s*,\s*)?(["'])[^"']*$/,'names'],
[/vue\s*\.\s*go\s*\(\s*(["'])[^"']*$/,'scenes'],
[/vue\s*\.\s*spawn\s*\(\s*(["'])[^"']*$/,'prefabs'],
[/vue\s*\.\s*(play|music)\s*\(\s*(["'])[^"']*$/,'audio'],
[/(vue\s*\.\s*behavior\s*\([^,]+,|attachBehavior\s*\()\s*(["'])[^"']*$/,'behaviors'],
[/vue\s*\.\s*playerPreset\s*\([^,]+,\s*(["'])[^"']*$/,'presets'],
[/\.\s*(hasTag|addTag|removeTag)\s*\(\s*(["'])[^"']*$/,'tags'],
[/\bon\s*\(\s*(["'])[^"']*$/,'events']
]
function install(m,o){
const ts=m.languages.typescript
const kinds=m.languages.CompletionItemKind
const names=()=>{
const p=o.project()
const n=new Set(),t=new Set(),sc=new Set(),pf=new Set(),au=new Set()
if(p){
for(const s of p.scenes){sc.add(s.name);for(const e of s.entities){if(e.prefab)pf.add(e.name);else n.add(e.name);for(const g of e.tags||[])t.add(g)}}
for(const k in p.assets||{})if(p.assets[k].type==='audio')au.add(k)
}
return{names:n,tags:t,scenes:sc,prefabs:pf,audio:au}
}
const extLib=()=>{
const p=o.project(),have=(p&&p.extensions)||[],cat=o.catalog()||[]
const ns=cat.filter(e=>have.includes(e.id)&&e.ns).map(e=>e.ns)
const src='declare interface Vue{'+ns.map(n=>'readonly '+n+':any;').join('')+'}'
if(root.__vueExtLib)root.__vueExtLib.dispose()
root.__vueExtLib=ts.typescriptDefaults.addExtraLib(src,'file:///ext.d.ts')
}
m.languages.registerCompletionItemProvider('typescript',{
triggerCharacters:['"',"'"],
provideCompletionItems(model,pos){
const before=model.getValueInRange({startLineNumber:pos.lineNumber,startColumn:1,endLineNumber:pos.lineNumber,endColumn:pos.column})
const w=model.getWordUntilPosition(pos)
const range={startLineNumber:pos.lineNumber,endLineNumber:pos.lineNumber,startColumn:w.startColumn,endColumn:w.endColumn}
for(const[re,k]of CALLS){
if(!re.test(before))continue
const N=names()
const BH=root.VueBehaviors
let list=[]
if(k==='names')list=[...N.names,...N.tags]
else if(k==='scenes')list=[...N.scenes]
else if(k==='prefabs')list=[...N.prefabs]
else if(k==='audio')list=[...N.audio]
else if(k==='tags')list=[...N.tags]
else if(k==='behaviors')list=BH?BH.NAMES:[]
else if(k==='presets')list=Object.keys((root.VueRuntime&&VueRuntime.PC_PRESETS)||{})
else if(k==='events')list=['start','update','collide','click','keypress','animend','key:space','keyup:space','msg:go','beh:death','beh:hurt','beh:pickup']
return{suggestions:list.map(v=>({label:v,kind:kinds.Value,insertText:v,range,sortText:'0'+v}))}
}
if(/\.\s*\w*$/.test(before))return{suggestions:[]}
return{suggestions:SNIPPETS.map(s=>({label:s[0],kind:kinds.Snippet,detail:s[1],insertText:s[2],insertTextRules:m.languages.CompletionItemInsertTextRule.InsertAsSnippet,range,sortText:'9'+s[0]}))}
}
})
let timer=0
const owner='vue-plain'
async function plain(model){
if(model.isDisposed())return
const w=await ts.getTypeScriptWorker().then(f=>f(model.uri))
const u=model.uri.toString()
const ds=[...await w.getSyntacticDiagnostics(u),...await w.getSemanticDiagnostics(u)]
const mk=ds.filter(d=>d.start!=null&&d.length!=null).map(d=>{
const msg=typeof d.messageText==='string'?d.messageText:d.messageText.messageText
const f=PLAIN.find(x=>x[0]===d.code)
const a=model.getPositionAt(d.start),b=model.getPositionAt(d.start+d.length)
return{severity:d.category===1?m.MarkerSeverity.Error:m.MarkerSeverity.Warning,message:f?f[1](msg):msg,code:String(d.code),source:'Vue',startLineNumber:a.lineNumber,startColumn:a.column,endLineNumber:b.lineNumber,endColumn:b.column}
})
m.editor.setModelMarkers(model,owner,mk)
}
ts.typescriptDefaults.setDiagnosticsOptions({noSemanticValidation:true,noSyntaxValidation:true})
const watch=model=>{
const run=()=>{clearTimeout(timer);timer=setTimeout(()=>plain(model),350)}
model.onDidChangeContent(run)
run()
}
m.languages.registerCodeActionProvider('typescript',{
provideCodeActions(model,range,ctx){
const acts=[]
for(const mk of ctx.markers){
if(mk.source!=='Vue')continue
const t=model.getValueInRange(mk)
if(mk.code==='2304'&&/^[A-Za-z_]\w*$/.test(t))acts.push({title:'Create a variable named '+t,kind:'quickfix',edit:{edits:[{resource:model.uri,textEdit:{range:{startLineNumber:1,startColumn:1,endLineNumber:1,endColumn:1},text:'let '+t+' = 0\n'},versionId:undefined}]},diagnostics:[mk],isPreferred:true})
}
return{actions:acts,dispose(){}}
}
})
return{watch,refresh:extLib}
}
root.VueAuto={install,SNIPPETS,PLAIN,CALLS}
})(window)
