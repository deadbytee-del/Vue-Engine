(function(root){
const KEYS=(root.VueNodes||(typeof require!=='undefined'?require('./nodedefs.js'):null)).KEYS
const C={ev:'#d9534f',mo:'#4c8dff',lo:'#9b6bff',co:'#e8943a',se:'#4ea6d6',so:'#cf63cf',ga:'#2fb36f'}
const iv=(name,check)=>({type:'input_value',name,check})
const dd=(name,opts)=>({type:'field_dropdown',name,options:opts})
const ft=(name,text)=>({type:'field_input',name,text})
const COLORS=[['red','#ff5555'],['orange','#ff9f43'],['gold','#ffd34d'],['green','#4ade80'],['cyan','#4cc9f0'],['blue','#4c8dff'],['purple','#a78bfa'],['pink','#f472b6'],['white','#ffffff'],['black','#111111']]
const fc=name=>dd(name,COLORS)
const st=name=>({type:'input_statement',name})
const stmt=(type,msg,args,col)=>({type,message0:msg,args0:args||[],previousStatement:null,nextStatement:null,colour:col,inputsInline:true})
const val=(type,msg,args,col,out)=>({type,message0:msg,args0:args||[],output:out===undefined?null:out,colour:col,inputsInline:true})
const hat=(type,msg,args)=>({type,message0:msg+' %'+((args||[]).length+1),args0:(args||[]).concat([{type:'input_dummy'}]),message1:'%1',args1:[st('DO')],style:'event_blocks',inputsInline:true})
const PROPSEL=['x','y','vx','vy','w','h','rot'].map(p=>[p,p])
const DEFS=[
hat('vue_on_start','when game starts'),
hat('vue_on_update','every frame'),
hat('vue_on_key','when key %1 pressed',[dd('KEY',KEYS)]),
hat('vue_on_collide','when touching tag %1',[ft('TAG','')]),
hat('vue_on_click','when this is clicked'),
{type:'vue_forever',message0:'forever',message1:'%1',args1:[st('DO')],previousStatement:null,colour:C.co},
stmt('vue_change_x','change x by %1',[iv('BY','Number')],C.mo),
stmt('vue_change_y','change y by %1',[iv('BY','Number')],C.mo),
stmt('vue_set_x','set x to %1',[iv('V','Number')],C.mo),
stmt('vue_set_y','set y to %1',[iv('V','Number')],C.mo),
stmt('vue_set_pos','go to x %1 y %2',[iv('X','Number'),iv('Y','Number')],C.mo),
stmt('vue_set_vel','set velocity x %1 y %2',[iv('VX','Number'),iv('VY','Number')],C.mo),
stmt('vue_set_vx','set velocity x to %1',[iv('V','Number')],C.mo),
stmt('vue_jump','jump with power %1',[iv('P','Number')],C.mo),
stmt('vue_set_rot','set rotation to %1 degrees',[iv('V','Number')],C.mo),
stmt('vue_change_rot','rotate by %1 degrees',[iv('V','Number')],C.mo),
stmt('vue_move_dir','move %1 steps forward',[iv('V','Number')],C.mo),
stmt('vue_color','set color to %1',[fc('C','#ff5555')],C.lo),
stmt('vue_say','say %1 for %2 seconds',[iv('T'),iv('S','Number')],C.lo),
stmt('vue_visible','%1',[dd('V',[['show','true'],['hide','false']])],C.lo),
stmt('vue_size','set size w %1 h %2',[iv('W','Number'),iv('H','Number')],C.lo),
stmt('vue_burst','burst %1 particles of %2',[iv('N','Number'),fc('C','#ffd34d')],C.lo),
stmt('vue_shake','shake camera by %1',[iv('A','Number')],C.lo),
stmt('vue_follow','camera follows this',[],C.lo),
stmt('vue_wait','wait %1 seconds',[iv('S','Number')],C.co),
stmt('vue_destroy_self','destroy this',[],C.co),
stmt('vue_destroy','destroy %1',[iv('T')],C.co),
stmt('vue_spawn','spawn prefab %1 at x %2 y %3',[ft('N','Prefab'),iv('X','Number'),iv('Y','Number')],C.co),
stmt('vue_go','go to scene %1',[ft('S','Level 1')],C.co),
stmt('vue_beep','beep at %1 Hz for %2 s',[iv('F','Number'),iv('D','Number')],C.so),
stmt('vue_play','play sound %1',[ft('N','sound')],C.so),
stmt('vue_set_global','set global %1 to %2',[ft('N','score'),iv('V')],C.ga),
stmt('vue_change_global','change global %1 by %2',[ft('N','score'),iv('V','Number')],C.ga),
stmt('vue_hud','show %1 on screen: %2',[ft('L','Score'),iv('V')],C.ga),
stmt('vue_print','print %1',[iv('V')],C.ga),
val('vue_get_global','global %1',[ft('N','score')],C.ga),
val('vue_random','random from %1 to %2',[iv('A','Number'),iv('B','Number')],C.ga,'Number'),
val('vue_time','time',[],C.se,'Number'),
val('vue_key_down','key %1 down?',[dd('KEY',KEYS)],C.se,'Boolean'),
val('vue_mouse','mouse %1',[dd('A',[['x','x'],['y','y']])],C.se,'Number'),
val('vue_self_prop','my %1',[dd('P',PROPSEL)],C.se,'Number'),
val('vue_grounded','on the ground?',[],C.se,'Boolean'),
val('vue_touching','touching tag %1 ?',[ft('TAG','')],C.se,'Boolean'),
val('vue_other','other',[],C.se),
val('vue_other_tag','other has tag %1 ?',[ft('TAG','')],C.se,'Boolean'),
val('vue_dist','distance to %1',[ft('N','Player')],C.se,'Number'),
val('vue_find','entity %1',[ft('N','Player')],C.se),
val('vue_get_prop','%1 of %2',[dd('P',PROPSEL),iv('E')],C.se)
]
const HATS=['vue_on_start','vue_on_update','vue_on_key','vue_on_collide','vue_on_click','vue_forever']
const blk=(type,inputs)=>{
const o={kind:'block',type}
if(inputs){
o.inputs={}
for(const k in inputs){
const v=inputs[k]
o.inputs[k]={shadow:typeof v==='number'?{type:'math_number',fields:{NUM:v}}:{type:'text',fields:{TEXT:v}}}
}
}
return o
}
const cat=(name,colour,contents)=>({kind:'category',name,colour,contents})
const toolbox=()=>({kind:'categoryToolbox',contents:[
cat('Events',C.ev,['vue_on_start','vue_on_update','vue_on_key','vue_on_collide','vue_on_click'].map(t=>blk(t))),
cat('Motion',C.mo,[blk('vue_change_x',{BY:5}),blk('vue_change_y',{BY:5}),blk('vue_set_x',{V:0}),blk('vue_set_y',{V:0}),blk('vue_set_pos',{X:0,Y:0}),blk('vue_set_vel',{VX:0,VY:0}),blk('vue_set_vx',{V:100}),blk('vue_jump',{P:600}),blk('vue_set_rot',{V:0}),blk('vue_change_rot',{V:3}),blk('vue_move_dir',{V:4})]),
cat('Looks',C.lo,[blk('vue_color'),blk('vue_say',{T:'Hello!',S:2}),blk('vue_visible'),blk('vue_size',{W:32,H:32}),blk('vue_burst',{N:14}),blk('vue_shake',{A:6}),blk('vue_follow')]),
cat('Control',C.co,[blk('vue_wait',{S:1}),blk('vue_forever'),blk('controls_repeat_ext',{TIMES:10}),blk('controls_whileUntil'),blk('controls_if'),blk('controls_flow_statements'),blk('vue_destroy_self'),blk('vue_destroy'),blk('vue_spawn',{X:0,Y:0}),blk('vue_go')]),
cat('Sensing',C.se,[blk('vue_key_down'),blk('vue_grounded'),blk('vue_touching'),blk('vue_other'),blk('vue_other_tag'),blk('vue_self_prop'),blk('vue_mouse'),blk('vue_dist'),blk('vue_find'),blk('vue_get_prop'),blk('vue_time')]),
cat('Sound','#cf63cf',[blk('vue_beep',{F:440,D:0.15}),blk('vue_play')]),
cat('Game',C.ga,[blk('vue_set_global',{V:0}),blk('vue_change_global',{V:1}),blk('vue_get_global'),blk('vue_hud',{V:0}),blk('vue_print',{V:'hello'}),blk('vue_random',{A:0,B:10})]),
{kind:'sep'},
cat('Logic','#3aa9a0',[blk('logic_compare'),blk('logic_operation'),blk('logic_negate'),blk('logic_boolean'),blk('logic_ternary')]),
cat('Math','#3aa9a0',[blk('math_number'),blk('math_arithmetic'),blk('math_single'),blk('math_round'),blk('math_modulo'),blk('math_constrain'),blk('math_change')]),
cat('Text','#59a05c',[blk('text'),blk('text_join')]),
{kind:'category',name:'Variables',colour:'#e07a3a',custom:'VARIABLE'}
]})
function init(Blockly,gen,Order){
Blockly.defineBlocksWithJsonArray(DEFS)
gen.addReservedWords('vue,self,on,exports,module,dt,other')
gen.INFINITE_LOOP_TRAP='await vue.frame();\n'
const G=gen.forBlock
const V=(b,n,o)=>gen.valueToCode(b,n,o===undefined?Order.NONE:o)||'0'
const N=(b,n)=>gen.valueToCode(b,n,Order.NONE)||'null'
const T=(b,n)=>gen.valueToCode(b,n,Order.NONE)||"''"
const S=(b,n)=>gen.statementToCode(b,n)
const J=JSON.stringify
G.vue_on_start=b=>`on('start',async function(){\n${S(b,'DO')}});\n`
G.vue_on_update=b=>`on('update',async function(dt){\n${S(b,'DO')}});\n`
G.vue_on_key=b=>`on(${J('key:'+b.getFieldValue('KEY'))},async function(){\n${S(b,'DO')}});\n`
G.vue_on_collide=b=>{const t=J(b.getFieldValue('TAG')||'');return `on('collide',async function(other){\nif(!(${t}===''||other.hasTag(${t})))return;\n${S(b,'DO')}});\n`}
G.vue_on_click=b=>`on('click',async function(){\n${S(b,'DO')}});\n`
G.vue_forever=b=>`while(self.alive){\nawait vue.frame();\n${S(b,'DO')}}\n`
G.vue_change_x=b=>`self.x+=${V(b,'BY',Order.ADDITION)};\n`
G.vue_change_y=b=>`self.y+=${V(b,'BY',Order.ADDITION)};\n`
G.vue_set_x=b=>`self.x=${V(b,'V')};\n`
G.vue_set_y=b=>`self.y=${V(b,'V')};\n`
G.vue_set_pos=b=>`self.x=${V(b,'X')};self.y=${V(b,'Y')};\n`
G.vue_set_vel=b=>`self.vx=${V(b,'VX')};self.vy=${V(b,'VY')};\n`
G.vue_set_vx=b=>`self.vx=${V(b,'V')};\n`
G.vue_jump=b=>`self.jump(${V(b,'P')});\n`
G.vue_set_rot=b=>`self.rot=${V(b,'V')};\n`
G.vue_change_rot=b=>`self.rot+=${V(b,'V',Order.ADDITION)};\n`
G.vue_move_dir=b=>`{const a=self.rot*Math.PI/180,d=${V(b,'V')};self.x+=Math.cos(a)*d;self.y+=Math.sin(a)*d;}\n`
G.vue_color=b=>`self.color=${J(b.getFieldValue('C'))};\n`
G.vue_say=b=>`self.say(${T(b,'T')},${V(b,'S')});\n`
G.vue_visible=b=>`self.visible=${b.getFieldValue('V')};\n`
G.vue_size=b=>`self.w=${V(b,'W')};self.h=${V(b,'H')};\n`
G.vue_burst=b=>`vue.burst(self.x,self.y,${J(b.getFieldValue('C'))},${V(b,'N')});\n`
G.vue_shake=b=>`vue.shake(${V(b,'A')},0.3);\n`
G.vue_follow=()=>`vue.follow(self);\n`
G.vue_wait=b=>`await vue.wait(${V(b,'S')});\n`
G.vue_destroy_self=()=>`self.destroy();\n`
G.vue_destroy=b=>`{const t=${N(b,'T')};if(t&&t.destroy)t.destroy();}\n`
G.vue_spawn=b=>`vue.spawn(${J(b.getFieldValue('N'))},${V(b,'X')},${V(b,'Y')});\n`
G.vue_go=b=>`vue.go(${J(b.getFieldValue('S'))});\n`
G.vue_beep=b=>`vue.beep(${V(b,'F')},${V(b,'D')});\n`
G.vue_play=b=>`vue.play(${J(b.getFieldValue('N'))});\n`
G.vue_set_global=b=>`vue.vars[${J(b.getFieldValue('N'))}]=${V(b,'V')};\n`
G.vue_change_global=b=>{const n=J(b.getFieldValue('N'));return `vue.vars[${n}]=(+vue.vars[${n}]||0)+${V(b,'V',Order.ADDITION)};\n`}
G.vue_hud=b=>`vue.hud(${J(b.getFieldValue('L'))},${V(b,'V')});\n`
G.vue_print=b=>`vue.log(${V(b,'V')});\n`
G.vue_get_global=b=>[`(vue.vars[${J(b.getFieldValue('N'))}]??0)`,Order.ATOMIC]
G.vue_random=b=>[`vue.random(${V(b,'A')},${V(b,'B')})`,Order.FUNCTION_CALL]
G.vue_time=()=>['vue.time',Order.MEMBER]
G.vue_key_down=b=>[`vue.key(${J(b.getFieldValue('KEY'))})`,Order.FUNCTION_CALL]
G.vue_mouse=b=>['vue.mouse.'+b.getFieldValue('A'),Order.MEMBER]
G.vue_self_prop=b=>['self.'+b.getFieldValue('P'),Order.MEMBER]
G.vue_grounded=()=>['self.grounded',Order.MEMBER]
G.vue_touching=b=>[`self.touching(${J(b.getFieldValue('TAG')||'')})`,Order.FUNCTION_CALL]
G.vue_other=()=>['(typeof other!=="undefined"?other:null)',Order.ATOMIC]
G.vue_other_tag=b=>[`(typeof other!=="undefined"&&other.hasTag(${J(b.getFieldValue('TAG')||'')}))`,Order.ATOMIC]
G.vue_dist=b=>[`vue.dist(self,vue.find(${J(b.getFieldValue('N'))}))`,Order.FUNCTION_CALL]
G.vue_find=b=>[`vue.find(${J(b.getFieldValue('N'))})`,Order.FUNCTION_CALL]
G.vue_get_prop=b=>[`((${N(b,'E')}||{}).${b.getFieldValue('P')})`,Order.ATOMIC]
return {toolbox:toolbox()}
}
function compile(json,Blockly,gen){
const ws=new Blockly.Workspace()
try{
Blockly.serialization.workspaces.load(json,ws)
gen.init(ws)
let code=''
for(const b of ws.getTopBlocks(true)){
if(HATS.indexOf(b.type)<0||!b.isEnabled())continue
const c=gen.blockToCode(b)
code+=typeof c==='string'?c:''
}
return gen.finish(code)
}finally{ws.dispose()}
}
function theme(Blockly){
return Blockly.Theme.defineTheme('vue',{
name:'vue',
base:Blockly.Themes.Zelos,
blockStyles:{event_blocks:{colourPrimary:C.ev,colourSecondary:'#c94449',colourTertiary:'#b03a3e',hat:'cap'}},
componentStyles:{workspaceBackgroundColour:'#12141a',toolboxBackgroundColour:'#1a1d25',toolboxForegroundColour:'#e6e8ee',flyoutBackgroundColour:'#20242d',flyoutForegroundColour:'#e6e8ee',flyoutOpacity:1,scrollbarColour:'#4a5060',scrollbarOpacity:0.5,insertionMarkerColour:'#ffffff',insertionMarkerOpacity:0.3,cursorColour:'#d0d0d0'}
})
}
const api={DEFS,HATS,init,compile,theme}
if(typeof module!=='undefined'&&module.exports)module.exports=api
else root.VueBlocks=api
})(typeof window!=='undefined'?window:globalThis)
