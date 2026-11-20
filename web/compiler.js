(function(root){
const EPI=";(function(){for(const n of['start','update','collide','click','keypress','animend'])if(typeof exports[n]==='function')on(n,exports[n]);})();"
async function compileScript(s,env){
if(!s)return{code:'',errors:[]}
try{
if(s.mode==='blocks'){
if(!s.blocks||!env.Blockly)return{code:'',errors:[]}
return{code:env.blocks.compile(s.blocks,env.Blockly,env.gen),errors:[]}
}
if(s.mode==='nodes'){
return{code:env.nodes.compileGraph(s.nodes),errors:[]}
}
const src=s.code||''
if(!src.trim())return{code:'',errors:[]}
const r=await env.transpile(src)
return{code:r.code+EPI,errors:r.errors||[]}
}catch(x){
return{code:'',errors:[String(x&&x.message||x)]}
}
}
async function compileProject(project,env){
const scripts={},errors=[]
for(const sc of project.scenes)for(const e of sc.entities){
if(!e.script)continue
const r=await compileScript(e.script,env)
if(r.code)scripts[e.id]=r.code
for(const m of r.errors)errors.push(e.name+': '+m)
}
return{scripts,errors}
}
const api={compileScript,compileProject,EPI}
if(typeof module!=='undefined'&&module.exports)module.exports=api
else root.VueCompiler=api
})(typeof window!=='undefined'?window:globalThis)
