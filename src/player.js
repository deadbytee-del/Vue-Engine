(function(root){
const esc=x=>JSON.stringify(x).replace(/</g,'\\u003c').replace(/[\u2028\u2029]/g,c=>'\\u'+c.charCodeAt(0).toString(16))
function html(project,scripts,runtime,title,three){
const needs3=project.scenes.some(s=>s.mode==='3d')
const lib=needs3&&three?'<script>'+three+'</script>':''
const px=project.settings&&project.settings.pixelArt===false?'auto':'pixelated'
const safeTitle=String(title||'Vue Game').replace(/[<>&]/g,'')
return '<!doctype html><html><head><meta charset="utf-8"><title>'+safeTitle+'</title><style>html,body{margin:0;height:100%;background:#000;overflow:hidden}canvas{position:fixed;left:0;top:0;display:block;width:100vw;height:100vh;object-fit:contain;image-rendering:'+px+'}canvas.gl{image-rendering:auto}</style></head><body><canvas id="c"></canvas>'+lib+'<script>'+runtime+'</script><script>(function(){var g=new VueRuntime.Game({canvas:document.getElementById("c"),project:'+esc(project)+',scripts:'+esc(scripts)+'});var E=function(m){var d=document.getElementById("vue-err");if(!d){d=document.createElement("div");d.id="vue-err";d.style.cssText="position:fixed;left:8px;bottom:8px;max-width:90vw;color:#ff8fa3;background:rgba(0,0,0,.75);padding:6px 10px;border-radius:6px;font:12px monospace;white-space:pre-wrap;z-index:9";document.body.appendChild(d)}d.textContent=String(m)};(window.VWR?VWR.ready:Promise.resolve()).then(function(){return g.start()}).catch(function(x){E(x&&x.stack||x)});addEventListener("message",function(e){var m=e.data;if(!m||m.vue!==1)return;if(m.cmd==="pause")g.paused=true;if(m.cmd==="resume")g.paused=false;if(m.cmd==="step"){g.paused=true;g.stepReq=true}});addEventListener("error",function(e){g.log("error",e.message);E(e.message)})})()</script></body></html>'
}
function parts(project,scripts,runtime,title,three,extra){
const px=project.settings&&project.settings.pixelArt===false?'auto':'pixelated'
const safeTitle=String(title||'Vue Game').replace(/[<>&]/g,'')
const js=(three||'')+'\n'+runtime+'\n;(function(){var g=new VueRuntime.Game({canvas:document.getElementById("c"),project:'+esc(project)+',scripts:'+esc(scripts)+'});(window.VWR?VWR.ready:Promise.resolve()).then(function(){g.start()});addEventListener("error",function(e){g.log("error",e.message)})})()\n'
const html='<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,user-scalable=no"><title>'+safeTitle+'</title>'+(extra||'')+'<style>html,body{margin:0;height:100%;background:#000;overflow:hidden;touch-action:none}canvas{position:fixed;left:0;top:0;display:block;width:100vw;height:100vh;object-fit:contain;image-rendering:'+px+'}canvas.gl{image-rendering:auto}</style></head><body><canvas id="c"></canvas><script src="game.js"></script></body></html>'
return{html,js}
}
const api={html,parts}
if(typeof module!=='undefined'&&module.exports)module.exports=api
else root.VuePlayer=api
})(typeof window!=='undefined'?window:globalThis)
