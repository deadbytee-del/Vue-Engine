const fs=require('fs'),path=require('path')
const root=path.join(__dirname,'..'),src=path.join(root,'src'),out=path.join(root,'web')
const pkg=n=>require(path.join(root,'node_modules',n,'package.json')).version
const V={blockly:pkg('blockly'),monaco:pkg('monaco-editor'),three:pkg('three'),inter:pkg('@fontsource/inter'),mono:pkg('@fontsource/jetbrains-mono'),ts:pkg('typescript')}
fs.rmSync(out,{recursive:true,force:true})
fs.mkdirSync(out,{recursive:true})
const copy=(a,b)=>{fs.mkdirSync(path.dirname(b),{recursive:true});fs.copyFileSync(a,b)}
const walk=(d,r='')=>{for(const n of fs.readdirSync(d)){const p=path.join(d,n),q=r?r+'/'+n:n;if(fs.statSync(p).isDirectory())walk(p,q);else if(n!=='index.html')copy(p,path.join(out,q))}}
walk(src)
let html=fs.readFileSync(path.join(src,'index.html'),'utf8')
const cdn='https://cdn.jsdelivr.net/npm/'
html=html.replace(/\.\.\/node_modules\/@fontsource\/inter\//g,cdn+'@fontsource/inter@'+V.inter+'/')
.replace(/\.\.\/node_modules\/@fontsource\/jetbrains-mono\//g,cdn+'@fontsource/jetbrains-mono@'+V.mono+'/')
.replace(/\.\.\/node_modules\/blockly\//g,cdn+'blockly@'+V.blockly+'/')
.replace(/\.\.\/node_modules\/monaco-editor\//g,cdn+'monaco-editor@'+V.monaco+'/')
.replace(/\.\.\/node_modules\/three\//g,cdn+'three@'+V.three+'/')
html=html.replace('<script src="icons.js"></script>','<script>window.VUE_CDN='+JSON.stringify({monaco:cdn+'monaco-editor@'+V.monaco+'/min/',blocklyMedia:cdn+'blockly@'+V.blockly+'/media/',three:cdn+'three@'+V.three+'/build/three.min.js',ts:cdn+'typescript@'+V.ts+'/lib/typescript.js'})+'</script>\n<script src="host-web.js"></script>\n<script src="icons.js"></script>')
if(/node_modules/.test(html))throw new Error('unmapped node_modules path')
fs.writeFileSync(path.join(out,'index.html'),html)
copy(path.join(root,'assets','logo.png'),path.join(out,'logo.png'))
console.log('web build ->',out,V)
