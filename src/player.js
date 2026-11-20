(function(root){
const esc=x=>JSON.stringify(x).replace(/</g,'\\u003c').replace(/[\u2028\u2029]/g,c=>'\\u'+c.charCodeAt(0).toString(16))
function html(project,scripts,runtime,title,three){
const needs3=project.scenes.some(s=>s.mode==='3d')
const lib=needs3&&three?'<script>'+three+'</script>':''
const px=project.settings&&project.settings.pixelArt===false?'auto':'pixelated'
const safeTitle=String(title||'Vue Game').replace(/[<>&]/g,'')
return '<!doctype html><html><head><meta charset="utf-8"><title>'+safeTitle+'</title><style>html,body{margin:0;height:100%;background:#000;overflow:hidden}canvas{position:fixed;left:0;top:0;display:block;width:100vw;height:100vh;object-fit:contain;image-rendering:'+px+'}canvas.gl{image-rendering:auto}</style></head><body><canvas id="c"></canvas>'+lib+'<script>'+runtime+'</script><script>(function(){var g=new VueRuntime.Game({canvas:document.getElementById("c"),project:'+esc(project)+',scripts:'+esc(scripts)+'});g.start()})()</script></body></html>'
}
const api={html}
if(typeof module!=='undefined'&&module.exports)module.exports=api
else root.VuePlayer=api
})(typeof window!=='undefined'?window:globalThis)
