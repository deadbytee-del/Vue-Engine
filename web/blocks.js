(function(root){
const KEYS=(root.VueNodes||(typeof require!=='undefined'?require('./nodedefs.js'):null)).KEYS
const C={ex:'#c23bd4',ev:'#e0457b',mo:'#4d8dff',lo:'#9d5cff',co:'#f5a524',se:'#38bdf8',so:'#d65ad1',ga:'#22c3a6',ca:'#6c7cff',ob:'#ff8a3d',ti:'#a3c94a'}
const iv=(name,check)=>({type:'input_value',name,check})
const BEHN=(root.VueBehaviors||(typeof require!=='undefined'?require('./behaviors.js'):{NAMES:[]})).NAMES
const dd=(name,opts)=>({type:'field_dropdown',name,options:opts})
const ft=(name,text)=>({type:'field_input',name,text})
const fv=(name,v)=>({type:'field_variable',name,variable:v})
const st=name=>({type:'input_statement',name})
const COLORS=[['red','#ff5555'],['orange','#ff9f43'],['gold','#ffd34d'],['green','#4ade80'],['cyan','#4cc9f0'],['blue','#4c8dff'],['purple','#a78bfa'],['pink','#f472b6'],['white','#ffffff'],['gray','#8a8f98'],['black','#111111']]
const fc=name=>dd(name,COLORS)
const stmt=(type,msg,args,col)=>({type,message0:msg,args0:args||[],previousStatement:null,nextStatement:null,colour:col,inputsInline:true})
const cstmt=(type,msg,args,col)=>({type,message0:msg,args0:args||[],message1:'%1',args1:[st('DO')],previousStatement:null,nextStatement:null,colour:col,inputsInline:true})
const val=(type,msg,args,col,out)=>({type,message0:msg,args0:args||[],output:out===undefined?null:out,colour:col,inputsInline:true})
const hat=(type,msg,args)=>({type,message0:msg+' %'+((args||[]).length+1),args0:(args||[]).concat([{type:'input_dummy'}]),message1:'%1',args1:[st('DO')],style:'event_blocks',inputsInline:true})
const P2=['x','y','z','vx','vy','vz','w','h','d','rot','rx','ry','rz','alpha','gravityScale','fontSize'].map(p=>[({x:'x',y:'y',z:'z / layer',vx:'velocity x',vy:'velocity y',vz:'velocity z',w:'width',h:'height',d:'depth',rot:'rotation',rx:'rotation x',ry:'rotation y',rz:'rotation z',alpha:'opacity',gravityScale:'gravity scale',fontSize:'font size'})[p],p])
const PALL=P2.concat([['name','name'],['color','color'],['text','text'],['visible','visible'],['on ground','grounded'],['flipped','flipX'],['body type','body'],['shape','shape'],['image','image'],['animation','animation']])
const CAMP=['x','y','z','zoom','tx','ty','tz','yaw','pitch','fov','dist','eye','smooth'].map(p=>[({tx:'target x',ty:'target y',tz:'target z',dist:'follow distance',eye:'eye height',smooth:'smoothing'})[p]||p,p])
const EASES=[['smooth','inout'],['linear','linear'],['ease in','in'],['ease out','out'],['overshoot','back'],['bounce','bounce']]
const WAVES=[['square','square'],['sine','sine'],['triangle','triangle'],['sawtooth','sawtooth']]
const BODIES=[['static','static'],['dynamic','dynamic'],['trigger','trigger'],['none','none']]
const MOUSE=[['x','x'],['y','y'],['moved x','dx'],['moved y','dy']]
const DEFS=[
stmt('vue_x_burst','burst %1 effect here',[dd('P',[['sparks','sparks'],['explosion','explosion'],['magic','magic'],['dust','dust'],['fire','fire'],['smoke','smoke']])],C.ex),
stmt('vue_x_emit','attach %1 emitter to this',[dd('P',[['fire','fire'],['smoke','smoke'],['magic','magic'],['snow','snow']])],C.ex),
stmt('vue_x_weather','set weather to %1 intensity %2',[dd('W',[['rain','rain'],['snow','snow'],['storm','storm'],['fog','fog'],['clear','clear']]),iv('I','Number')],C.ex),
stmt('vue_x_hour','set time of day to hour %1',[iv('H','Number')],C.ex),
val('vue_x_night','is night',[],C.ex,'Boolean'),
stmt('vue_x_goto','walk to %1 at speed %2 using pathfinding',[iv('E'),iv('S','Number')],C.ex),
stmt('vue_x_explode','explode here with radius %1',[iv('R','Number')],C.ex),
stmt('vue_x_shatter','shatter this into %1 pieces',[iv('N','Number')],C.ex),
stmt('vue_x_say','dialogue: %1 says %2',[iv('W','String'),iv('T','String')],C.ex),
val('vue_x_ask','dialogue: %1 asks %2 choices %3',[iv('W','String'),iv('T','String'),iv('L','Array')],C.ex,'Number'),
val('vue_x_chat','AI reply from %1 to %2 personality %3',[iv('W','String'),iv('T','String'),iv('P','String')],C.ex,'String'),
stmt('vue_x_voice','speak %1 with voice %2',[iv('T','String'),dd('V',[['Heart','af_heart'],['Bella','af_bella'],['Nicole','af_nicole'],['Sky','af_sky'],['Michael','am_michael'],['Fenrir','am_fenrir'],['Puck','am_puck'],['Emma','bf_emma'],['George','bm_george'],['Lewis','bm_lewis']])],C.ex),
val('vue_x_pad','gamepad button %1 held',[dd('B',[['A','a'],['B','b'],['X','x'],['Y','y'],['LB','lb'],['RB','rb'],['LT','lt'],['RT','rt'],['Start','start'],['Select','select']])],C.ex,'Boolean'),
val('vue_x_axis','gamepad stick %1',[dd('A',[['left x','lx'],['left y','ly'],['right x','rx'],['right y','ry']])],C.ex,'Number'),
stmt('vue_x_rumble','rumble controller for %1 ms',[iv('M','Number')],C.ex),
stmt('vue_x_host','host multiplayer room and show code',[],C.ex),
stmt('vue_x_join','join multiplayer room %1',[iv('C','String')],C.ex),
stmt('vue_x_rep','sync this across multiplayer',[],C.ex),
stmt('vue_x_send','send network message %1 with %2',[ft('M','chat'),iv('D')],C.ex),
stmt('vue_x_post','set screen effect %1 to %2',[dd('K',[['bloom','bloom'],['vignette','vignette'],['grain','grain'],['saturation','saturation'],['contrast','contrast'],['brightness','brightness'],['scanlines','scanlines'],['hue','hue']]),iv('V','Number')],C.ex),
stmt('vue_x_flash','flash screen %1 for %2 secs',[fc('C'),iv('S','Number')],C.ex),
stmt('vue_x_call','call extension vue. %1 . %2 with %3',[ft('NS','fx'),ft('FN','burst'),iv('A')],C.ex),
val('vue_x_get','extension value vue. %1 . %2',[ft('NS','day'),ft('K','hour')],C.ex,null),
hat('vue_on_start','when game starts'),
hat('vue_on_update','every frame'),
hat('vue_on_key','when key %1 pressed',[dd('KEY',KEYS)]),
hat('vue_on_keyup','when key %1 released',[dd('KEY',KEYS)]),
hat('vue_on_anykey','when any key pressed'),
hat('vue_on_click','when this is clicked'),
hat('vue_on_collide','when touching tag %1',[ft('TAG','')]),
hat('vue_on_msg','when I receive %1',[ft('M','go')]),
hat('vue_on_animend','when my animation finishes'),
hat('vue_on_beh','when this %1',[dd('E',[['dies','death'],['is hurt','hurt'],['is picked up','pickup'],['attacks','attack'],['scores a goal','goal'],['is entered','enter'],['opens','open'],['reaches a checkpoint','checkpoint'],['shoots','shoot'],['hits something','hit'],['wins','win'],['runs out of time','timeup'],['finishes talking','dialogue']])]),
stmt('vue_beh_add','give this the %1 behavior',[dd('B',BEHN.map(n=>[n,n]))],C.mo),
stmt('vue_hurt','hurt %1 by %2',[{type:'input_value',name:'E',check:null},{type:'input_value',name:'V',check:'Number'}],C.mo),
stmt('vue_heal','heal %1 by %2',[{type:'input_value',name:'E',check:null},{type:'input_value',name:'V',check:'Number'}],C.mo),
stmt('vue_channel','set channel %1 %2',[{type:'input_value',name:'N',check:'String'},dd('S',[['on','true'],['off','false']])],C.mo),
stmt('vue_score','add %1 point to team %2',[{type:'input_value',name:'V',check:'Number'},{type:'input_value',name:'T',check:'String'}],C.mo),
{type:'vue_forever',message0:'forever',message1:'%1',args1:[st('DO')],previousStatement:null,colour:C.co},
stmt('vue_change_x','change x by %1',[iv('BY','Number')],C.mo),
stmt('vue_change_y','change y by %1',[iv('BY','Number')],C.mo),
stmt('vue_change_z','change z by %1',[iv('BY','Number')],C.mo),
stmt('vue_set_x','set x to %1',[iv('V','Number')],C.mo),
stmt('vue_set_y','set y to %1',[iv('V','Number')],C.mo),
stmt('vue_set_z','set z to %1',[iv('V','Number')],C.mo),
stmt('vue_set_pos','go to x %1 y %2',[iv('X','Number'),iv('Y','Number')],C.mo),
stmt('vue_set_pos3','go to x %1 y %2 z %3',[iv('X','Number'),iv('Y','Number'),iv('Z','Number')],C.mo),
stmt('vue_goto_ent','go to %1',[iv('E')],C.mo),
stmt('vue_goto_mouse','go to mouse pointer',[],C.mo),
stmt('vue_glide','glide to x %1 y %2 in %3 s %4',[iv('X','Number'),iv('Y','Number'),iv('S','Number'),dd('EASE',EASES)],C.mo),
stmt('vue_glide3','glide to x %1 y %2 z %3 in %4 s',[iv('X','Number'),iv('Y','Number'),iv('Z','Number'),iv('S','Number')],C.mo),
stmt('vue_set_vel','set velocity x %1 y %2',[iv('VX','Number'),iv('VY','Number')],C.mo),
stmt('vue_set_vel3','set velocity x %1 y %2 z %3',[iv('VX','Number'),iv('VY','Number'),iv('VZ','Number')],C.mo),
stmt('vue_set_vx','set velocity x to %1',[iv('V','Number')],C.mo),
stmt('vue_set_vy','set velocity y to %1',[iv('V','Number')],C.mo),
stmt('vue_change_vel','change velocity by x %1 y %2',[iv('VX','Number'),iv('VY','Number')],C.mo),
stmt('vue_jump','jump with power %1',[iv('P','Number')],C.mo),
stmt('vue_player_make','make this a player: %1',[dd('P',[['Platformer','Platformer'],['Top-down RPG','Top-down RPG'],['Shooter','Shooter'],['FPS','FPS'],['Racer-lite','Racer-lite']])],C.mo),
stmt('vue_player_set','set player %1 to %2',[dd('K',[['speed','speed'],['jumpHeight','jump height'],['jumps','jump count'],['accel','acceleration'],['friction','friction'],['maxSpeed','max speed'],['gravityScale','gravity scale'],['airControl','air control'],['runMult','run multiplier']]),iv('V','Number')],C.mo),
stmt('vue_move_local','walk forward %1 strafe %2 relative to camera',[iv('F','Number'),iv('S','Number')],C.mo),
stmt('vue_set_rot','set rotation to %1 degrees',[iv('V','Number')],C.mo),
stmt('vue_change_rot','rotate by %1 degrees',[iv('V','Number')],C.mo),
stmt('vue_rotate3','rotate %1 axis by %2 degrees',[dd('AX',[['x','rx'],['y','ry'],['z','rz']]),iv('V','Number')],C.mo),
stmt('vue_move_dir','move %1 steps forward',[iv('V','Number')],C.mo),
stmt('vue_point_at','point towards %1',[iv('E')],C.mo),
stmt('vue_point_mouse','point towards mouse',[],C.mo),
stmt('vue_flip','face %1',[dd('F',[['right','false'],['left','true']])],C.mo),
stmt('vue_set_body','set body type to %1',[dd('B',BODIES)],C.mo),
stmt('vue_set_grav','set gravity scale to %1',[iv('V','Number')],C.mo),
stmt('vue_color','set color to %1',[fc('C')],C.lo),
stmt('vue_color_v','set color to %1',[iv('V','String')],C.lo),
stmt('vue_say','say %1 for %2 seconds',[iv('T'),iv('S','Number')],C.lo),
stmt('vue_visible','%1',[dd('V',[['show','true'],['hide','false']])],C.lo),
stmt('vue_size','set size w %1 h %2',[iv('W','Number'),iv('H','Number')],C.lo),
stmt('vue_change_size','change size by %1 %%',[iv('V','Number')],C.lo),
stmt('vue_set_alpha','set opacity to %1',[iv('V','Number')],C.lo),
stmt('vue_change_alpha','change opacity by %1',[iv('V','Number')],C.lo),
stmt('vue_set_layer','go to layer %1',[iv('V','Number')],C.lo),
stmt('vue_set_text','set text to %1',[iv('V')],C.lo),
stmt('vue_set_font','set font size to %1',[iv('V','Number')],C.lo),
stmt('vue_set_image','switch image to %1',[ft('N','image.png')],C.lo),
stmt('vue_anim','play animation %1 %2',[ft('N','walk'),dd('R',[['','false'],['from start','true']])],C.lo),
stmt('vue_anim_stop','stop animation',[],C.lo),
stmt('vue_burst','burst %1 particles of %2',[iv('N','Number'),fc('C')],C.lo),
stmt('vue_follow','camera follows this',[],C.ca),
stmt('vue_follow3','camera follows this at distance %1 height %2',[iv('D','Number'),iv('H','Number')],C.ca),
stmt('vue_unfollow','camera stops following',[],C.ca),
stmt('vue_cam_set','set camera %1 to %2',[dd('P',CAMP),iv('V','Number')],C.ca),
stmt('vue_cam_change','change camera %1 by %2',[dd('P',CAMP),iv('V','Number')],C.ca),
stmt('vue_shake','shake camera by %1 for %2 s',[iv('A','Number'),iv('S','Number')],C.ca),
stmt('vue_lock_mouse','lock mouse to game',[],C.ca),
stmt('vue_beep','beep at %1 Hz for %2 s',[iv('F','Number'),iv('D','Number')],C.so),
stmt('vue_beep2','beep %1 at %2 Hz for %3 s volume %4',[dd('W',WAVES),iv('F','Number'),iv('D','Number'),iv('V','Number')],C.so),
stmt('vue_play','play sound %1',[ft('N','sound.wav')],C.so),
stmt('vue_play2','play sound %1 volume %2 %3',[ft('N','sound.wav'),iv('V','Number'),dd('L',[['once','false'],['looping','true']])],C.so),
stmt('vue_music','play music %1 volume %2',[ft('N','music.mp3'),iv('V','Number')],C.so),
stmt('vue_stop_music','stop music',[],C.so),
stmt('vue_stop_sounds','stop all sounds',[],C.so),
stmt('vue_volume','set master volume to %1',[iv('V','Number')],C.so),
stmt('vue_my_sound','%1 my sound',[dd('A',[['play','playSound'],['stop','stopSound']])],C.so),
stmt('vue_wait','wait %1 seconds',[iv('S','Number')],C.co),
stmt('vue_wait_until','wait until %1',[iv('C','Boolean')],C.co),
cstmt('vue_after','after %1 seconds',[iv('S','Number')],C.co),
cstmt('vue_every','every %1 seconds',[iv('S','Number')],C.co),
cstmt('vue_foreach','for each %1 with tag %2',[fv('VAR','item'),ft('TAG','enemy')],C.co),
stmt('vue_return','stop this script',[],C.co),
stmt('vue_destroy_self','destroy this',[],C.co),
stmt('vue_destroy','destroy %1',[iv('T')],C.co),
stmt('vue_spawn','spawn prefab %1 at x %2 y %3',[ft('N','Prefab'),iv('X','Number'),iv('Y','Number')],C.co),
stmt('vue_spawn3','spawn prefab %1 at x %2 y %3 z %4',[ft('N','Prefab'),iv('X','Number'),iv('Y','Number'),iv('Z','Number')],C.co),
val('vue_spawn_v','spawn prefab %1 at x %2 y %3',[ft('N','Prefab'),iv('X','Number'),iv('Y','Number')],C.co),
stmt('vue_go','go to scene %1',[ft('S','Level 1')],C.co),
stmt('vue_restart','restart scene',[],C.co),
stmt('vue_emit','broadcast %1 with %2',[ft('M','go'),iv('V')],C.co),
stmt('vue_cutscene','play cutscene %1 %2',[ft('N','Intro'),dd('W',[['','false'],['and wait','true']])],C.co),
stmt('vue_skip_cs','skip cutscene',[],C.co),
stmt('vue_stop_game','stop game',[],C.co),
val('vue_key_down','key %1 down?',[dd('KEY',KEYS)],C.se,'Boolean'),
val('vue_key_pressed','key %1 just pressed?',[dd('KEY',KEYS)],C.se,'Boolean'),
val('vue_any_key','any key down?',[],C.se,'Boolean'),
val('vue_last_key','pressed key',[],C.se,'String'),
val('vue_mouse','mouse %1',[dd('A',MOUSE)],C.se,'Number'),
val('vue_mouse_down','mouse down?',[],C.se,'Boolean'),
val('vue_mouse_clicked','mouse clicked?',[],C.se,'Boolean'),
val('vue_self_prop','my %1',[dd('P',PALL)],C.se),
val('vue_grounded','on the ground?',[],C.se,'Boolean'),
val('vue_touching','touching tag %1 ?',[ft('TAG','')],C.se,'Boolean'),
val('vue_other','other',[],C.se),
val('vue_other_tag','other has tag %1 ?',[ft('TAG','')],C.se,'Boolean'),
val('vue_msg_data','message data',[],C.se),
val('vue_dist','distance to %1',[iv('E')],C.se,'Number'),
val('vue_angle','angle to %1',[iv('E')],C.se,'Number'),
val('vue_find','entity %1',[ft('N','Player')],C.se),
val('vue_self','me',[],C.se),
val('vue_nearest','nearest with tag %1',[ft('TAG','enemy')],C.se),
val('vue_count','number of entities with tag %1',[ft('TAG','enemy')],C.se,'Number'),
val('vue_all','all entities with tag %1',[ft('TAG','enemy')],C.se,'Array'),
val('vue_exists','%1 exists?',[iv('E')],C.se,'Boolean'),
val('vue_get_prop','%1 of %2',[dd('P',PALL),iv('E')],C.se),
val('vue_cam_get','camera %1',[dd('P',CAMP)],C.se,'Number'),
val('vue_time','timer',[],C.se,'Number'),
val('vue_dt','delta time',[],C.se,'Number'),
val('vue_screen','screen %1',[dd('A',[['width','width'],['height','height']])],C.se,'Number'),
val('vue_in_cs','in cutscene?',[],C.se,'Boolean'),
val('vue_scene_name','scene name',[],C.se,'String'),
stmt('vue_set_prop','set %1 of %2 to %3',[dd('P',PALL),iv('E'),iv('V')],C.ob),
stmt('vue_change_prop','change %1 of %2 by %3',[dd('P',P2),iv('E'),iv('V','Number')],C.ob),
stmt('vue_add_tag','add tag %1',[ft('T','enemy')],C.ob),
stmt('vue_remove_tag','remove tag %1',[ft('T','enemy')],C.ob),
val('vue_has_tag','%1 has tag %2 ?',[iv('E'),ft('T','enemy')],C.ob,'Boolean'),
stmt('vue_set_local','set my variable %1 to %2',[ft('N','hp'),iv('V')],C.ob),
stmt('vue_change_local','change my variable %1 by %2',[ft('N','hp'),iv('V','Number')],C.ob),
val('vue_get_local','my variable %1',[ft('N','hp')],C.ob),
stmt('vue_attach','attach me to %1',[iv('E')],C.ob),
stmt('vue_detach','detach from parent',[],C.ob),
val('vue_parent','my parent',[],C.ob),
val('vue_children','my children',[],C.ob,'Array'),
stmt('vue_set_tile','set tile at x %1 y %2 on %3 to %4',[iv('X','Number'),iv('Y','Number'),ft('M','Tilemap'),iv('I','Number')],C.ti),
stmt('vue_erase_tile','erase tile at x %1 y %2 on %3',[iv('X','Number'),iv('Y','Number'),ft('M','Tilemap')],C.ti),
val('vue_tile_at','tile at x %1 y %2 on %3',[iv('X','Number'),iv('Y','Number'),ft('M','Tilemap')],C.ti,'Number'),
stmt('vue_set_global','set global %1 to %2',[ft('N','score'),iv('V')],C.ga),
stmt('vue_change_global','change global %1 by %2',[ft('N','score'),iv('V','Number')],C.ga),
val('vue_get_global','global %1',[ft('N','score')],C.ga),
stmt('vue_hud','show %1 on screen: %2',[ft('L','Score'),iv('V')],C.ga),
stmt('vue_hud_clear','remove %1 from screen',[ft('L','Score')],C.ga),
stmt('vue_print','print %1',[iv('V')],C.ga),
stmt('vue_warn','warn %1',[iv('V')],C.ga),
val('vue_random','random from %1 to %2',[iv('A','Number'),iv('B','Number')],C.ga,'Number'),
val('vue_random_int','random whole number from %1 to %2',[iv('A','Number'),iv('B','Number')],C.ga,'Number'),
val('vue_chance','%1 %% chance',[iv('P','Number')],C.ga,'Boolean'),
val('vue_lerp','lerp from %1 to %2 by %3',[iv('A','Number'),iv('B','Number'),iv('K','Number')],C.ga,'Number')
]
const HATS=['vue_on_beh','vue_on_start','vue_on_update','vue_on_key','vue_on_keyup','vue_on_anykey','vue_on_click','vue_on_collide','vue_on_msg','vue_on_animend','vue_forever']
const blk=(type,inputs,fields)=>{
const o={kind:'block',type}
if(fields)o.fields=fields
if(inputs){
o.inputs={}
for(const k in inputs){
const v=inputs[k]
o.inputs[k]={shadow:typeof v==='number'?{type:'math_number',fields:{NUM:v}}:typeof v==='string'?{type:'text',fields:{TEXT:v}}:v}
}
}
return o
}
const E=n=>({type:'vue_find',fields:{N:n}})
const cat=(name,colour,contents)=>({kind:'category',name,colour,contents})
const toolbox=()=>({kind:'categoryToolbox',contents:[
cat('Common',C.ev,[blk('vue_on_start'),blk('vue_on_update'),blk('vue_on_key'),blk('vue_change_x',{BY:5}),blk('vue_change_y',{BY:5}),blk('vue_jump',{P:600}),blk('vue_say',{T:'Hello!',S:2}),blk('controls_if')]),
{kind:'sep'},
cat('Events',C.ev,['vue_on_beh','vue_on_start','vue_on_update','vue_on_key','vue_on_keyup','vue_on_anykey','vue_on_click','vue_on_collide','vue_on_msg','vue_on_animend'].map(t=>blk(t)).concat([blk('vue_last_key'),blk('vue_msg_data')])),
cat('Movement',C.mo,[blk('vue_beh_add'),blk('vue_hurt',{E:E('Player'),V:10}),blk('vue_heal',{E:E('Player'),V:10}),blk('vue_channel',{N:'A'}),blk('vue_score',{V:1,T:'blue'}),blk('vue_player_make'),blk('vue_player_set',{V:300}),blk('vue_change_x',{BY:5}),blk('vue_change_y',{BY:5}),blk('vue_set_x',{V:0}),blk('vue_set_y',{V:0}),blk('vue_set_pos',{X:0,Y:0}),blk('vue_goto_ent',{E:E('Player')}),blk('vue_goto_mouse'),blk('vue_glide',{X:100,Y:0,S:1}),blk('vue_set_vel',{VX:0,VY:0}),blk('vue_set_vx',{V:200}),blk('vue_set_vy',{V:0}),blk('vue_change_vel',{VX:10,VY:0}),blk('vue_jump',{P:600}),blk('vue_set_rot',{V:0}),blk('vue_change_rot',{V:15}),blk('vue_move_dir',{V:4}),blk('vue_point_at',{E:E('Player')}),blk('vue_point_mouse'),blk('vue_flip'),blk('vue_set_body'),blk('vue_set_grav',{V:1}),{kind:'label',text:'3D'},blk('vue_change_z',{BY:1}),blk('vue_set_z',{V:0}),blk('vue_set_pos3',{X:0,Y:1,Z:0}),blk('vue_glide3',{X:0,Y:1,Z:0,S:1}),blk('vue_set_vel3',{VX:0,VY:0,VZ:0}),blk('vue_move_local',{F:6,S:0}),blk('vue_rotate3',{V:5})]),
cat('Looks',C.lo,[blk('vue_color'),blk('vue_color_v',{V:'#ff5555'}),blk('vue_say',{T:'Hello!',S:2}),blk('vue_visible'),blk('vue_size',{W:32,H:32}),blk('vue_change_size',{V:10}),blk('vue_set_alpha',{V:1}),blk('vue_change_alpha',{V:-0.1}),blk('vue_set_layer',{V:1}),blk('vue_set_text',{V:'Score: 0'}),blk('vue_set_font',{V:24}),blk('vue_set_image'),blk('vue_anim'),blk('vue_anim_stop'),blk('vue_burst',{N:14})]),
cat('Camera',C.ca,[blk('vue_follow'),blk('vue_follow3',{D:9,H:1.6}),blk('vue_unfollow'),blk('vue_cam_set',{V:0}),blk('vue_cam_change',{V:1}),blk('vue_cam_get'),blk('vue_shake',{A:6,S:0.3}),blk('vue_lock_mouse')]),
cat('Sound',C.so,[blk('vue_play2',{V:1}),blk('vue_play'),blk('vue_music',{V:0.6}),blk('vue_stop_music'),blk('vue_stop_sounds'),blk('vue_volume',{V:1}),blk('vue_my_sound'),blk('vue_beep',{F:440,D:0.15}),blk('vue_beep2',{F:660,D:0.2,V:0.2})]),
{kind:'sep'},
cat('Repeat and decide',C.co,[blk('vue_wait',{S:1}),blk('vue_wait_until'),blk('vue_forever'),blk('controls_repeat_ext',{TIMES:10}),blk('controls_whileUntil'),blk('controls_for',{FROM:1,TO:10,BY:1}),blk('controls_forEach'),blk('vue_foreach'),blk('controls_if'),blk('controls_flow_statements'),blk('vue_after',{S:1}),blk('vue_every',{S:1}),blk('vue_return'),blk('vue_spawn',{X:0,Y:0}),blk('vue_spawn3',{X:0,Y:1,Z:0}),blk('vue_spawn_v',{X:0,Y:0}),blk('vue_destroy_self'),blk('vue_destroy',{T:E('Enemy')}),blk('vue_go'),blk('vue_restart'),blk('vue_emit',{V:''}),blk('vue_cutscene'),blk('vue_skip_cs'),blk('vue_stop_game')]),
cat('Checks',C.se,[blk('vue_key_down'),blk('vue_key_pressed'),blk('vue_any_key'),blk('vue_mouse'),blk('vue_mouse_down'),blk('vue_mouse_clicked'),blk('vue_self_prop'),blk('vue_grounded'),blk('vue_touching'),blk('vue_other'),blk('vue_other_tag'),blk('vue_self'),blk('vue_find'),blk('vue_nearest'),blk('vue_count'),blk('vue_all'),blk('vue_exists',{E:E('Player')}),blk('vue_dist',{E:E('Player')}),blk('vue_angle',{E:E('Player')}),blk('vue_get_prop',{E:E('Player')}),blk('vue_time'),blk('vue_dt'),blk('vue_screen'),blk('vue_in_cs'),blk('vue_scene_name')]),
cat('Score and game',C.ga,[blk('vue_set_global',{V:0}),blk('vue_change_global',{V:1}),blk('vue_get_global'),blk('vue_hud',{V:0}),blk('vue_hud_clear'),blk('vue_print',{V:'hello'}),blk('vue_warn',{V:'careful'}),blk('vue_random',{A:0,B:10}),blk('vue_random_int',{A:1,B:6}),blk('vue_chance',{P:50}),blk('vue_lerp',{A:0,B:100,K:0.1})]),
{kind:'sep'},
cat('Other objects',C.ob,[blk('vue_set_prop',{E:E('Player'),V:0}),blk('vue_change_prop',{E:E('Player'),V:10}),blk('vue_add_tag'),blk('vue_remove_tag'),blk('vue_has_tag',{E:E('Player')}),blk('vue_set_local',{V:100}),blk('vue_change_local',{V:-10}),blk('vue_get_local'),blk('vue_attach',{E:E('Player')}),blk('vue_detach'),blk('vue_parent'),blk('vue_children')]),
cat('Tiles',C.ti,[blk('vue_set_tile',{X:0,Y:0,I:0}),blk('vue_erase_tile',{X:0,Y:0}),blk('vue_tile_at',{X:0,Y:0})]),
cat('Extensions',C.ex,[blk('vue_x_burst'),blk('vue_x_emit'),blk('vue_x_weather',{I:1}),blk('vue_x_hour',{H:20}),blk('vue_x_night'),blk('vue_x_goto',{E:E('Player'),S:140}),blk('vue_x_explode',{R:100}),blk('vue_x_shatter',{N:8}),blk('vue_x_say',{W:'Guide',T:'Hello!'}),blk('vue_x_ask',{W:'Guide',T:'Ready?'}),blk('vue_x_chat',{W:'Guide',T:'Hi there',P:'A friendly guide'}),blk('vue_x_voice',{T:'Welcome!'}),blk('vue_x_pad'),blk('vue_x_axis'),blk('vue_x_rumble',{M:200}),blk('vue_x_host'),blk('vue_x_join',{C:'ABCDE'}),blk('vue_x_rep'),blk('vue_x_send',{D:'hi'}),blk('vue_x_post',{V:0.5}),blk('vue_x_flash',{S:0.2}),blk('vue_x_call',{A:0}),blk('vue_x_get')]),
{kind:'sep'},
cat('Conditions','#2fbf74',[blk('logic_compare'),blk('logic_operation'),blk('logic_negate'),blk('logic_boolean'),blk('logic_null'),blk('logic_ternary')]),
cat('Numbers','#2fbf74',[blk('math_number'),blk('math_arithmetic',{A:1,B:1}),blk('math_single',{NUM:9}),blk('math_trig',{NUM:45}),blk('math_constant'),blk('math_number_property',{NUMBER_TO_CHECK:0}),blk('math_round',{NUM:3.1}),blk('math_on_list'),blk('math_modulo',{DIVIDEND:64,DIVISOR:10}),blk('math_constrain',{VALUE:50,LOW:1,HIGH:100}),blk('math_random_int',{FROM:1,TO:100}),blk('math_random_float'),blk('math_atan2',{X:1,Y:1})]),
cat('Text','#e86fbf',[blk('text'),blk('text_join'),blk('text_append',{TEXT:''}),blk('text_length',{VALUE:'abc'}),blk('text_isEmpty',{VALUE:''}),blk('text_indexOf',{FIND:'abc'}),blk('text_charAt'),blk('text_getSubstring'),blk('text_changeCase',{TEXT:'abc'}),blk('text_trim',{TEXT:' abc '}),blk('text_count',{SUB:'a',TEXT:'banana'}),blk('text_replace',{FROM:'a',TO:'o',TEXT:'banana'}),blk('text_reverse',{TEXT:'abc'})]),
cat('Lists','#c06cff',[blk('lists_create_empty'),blk('lists_create_with'),blk('lists_repeat',{NUM:5}),blk('lists_length'),blk('lists_isEmpty'),blk('lists_indexOf'),blk('lists_getIndex'),blk('lists_setIndex'),blk('lists_getSublist'),blk('lists_split',{DELIM:','}),blk('lists_sort'),blk('lists_reverse')]),
{kind:'category',name:'Variables',colour:'#ff7a45',custom:'VARIABLE'},
{kind:'category',name:'My blocks',colour:'#8a8f98',custom:'PROCEDURE'}
]})
const fnh=(args,body)=>(/\bawait\b/.test(body)?'async ':'')+'function('+args+'){\n'+body+'}'
function init(Blockly,gen,Order){
Blockly.defineBlocksWithJsonArray(DEFS)
gen.addReservedWords('vue,self,on,exports,module,dt,other,key,data,vue_e,vue_x')
gen.INFINITE_LOOP_TRAP='await vue.frame();\n'
const G=gen.forBlock
const V=(b,n,o)=>gen.valueToCode(b,n,o===undefined?Order.NONE:o)||'0'
const N=(b,n)=>gen.valueToCode(b,n,Order.NONE)||'null'
const T=(b,n)=>gen.valueToCode(b,n,Order.NONE)||"''"
const EN=(b,n)=>'vue_e('+(gen.valueToCode(b,n,Order.NONE)||'self')+')'
const S=(b,n)=>gen.statementToCode(b,n)
const F=(b,n)=>b.getFieldValue(n)
const J=JSON.stringify
const A=Order.ATOMIC,FC=Order.FUNCTION_CALL,M=Order.MEMBER
G.vue_on_start=b=>`on('start',${fnh('',S(b,'DO'))});\n`
G.vue_on_update=b=>`on('update',${fnh('dt',S(b,'DO'))});\n`
G.vue_on_key=b=>`on(${J('key:'+F(b,'KEY'))},${fnh('',S(b,'DO'))});\n`
G.vue_on_keyup=b=>`on(${J('keyup:'+F(b,'KEY'))},${fnh('',S(b,'DO'))});\n`
G.vue_on_anykey=b=>`on('keypress',${fnh('key',S(b,'DO'))});\n`
G.vue_on_collide=b=>{const t=J(F(b,'TAG')||'');return `on('collide',${fnh('other',`if(!(${t}===''||other.hasTag(${t})))return;\n`+S(b,'DO'))});\n`}
G.vue_on_click=b=>`on('click',${fnh('',S(b,'DO'))});\n`
G.vue_on_msg=b=>`on(${J('msg:'+F(b,'M'))},${fnh('data',S(b,'DO'))});\n`
G.vue_on_beh=b=>`on(${J('beh:'+F(b,'E'))},${fnh('arg',S(b,'DO'))});\n`
G.vue_beh_add=b=>`self.attachBehavior(${J(F(b,'B'))});\n`
G.vue_hurt=b=>`{const t=${EN(b,'E')};if(t)t.hurt(${V(b,'V')});}\n`
G.vue_heal=b=>`{const t=${EN(b,'E')};if(t)t.heal(${V(b,'V')});}\n`
G.vue_channel=b=>`vue.channel(${T(b,'N')},${F(b,'S')});\n`
G.vue_score=b=>`vue.score(${T(b,'T')},${V(b,'V')});\n`
G.vue_on_animend=b=>`on('animend',${fnh('',S(b,'DO'))});\n`
G.vue_forever=b=>`while(self.alive){\nawait vue.frame();\n${S(b,'DO')}}\n`
G.vue_change_x=b=>`self.x+=${V(b,'BY',Order.ADDITION)};\n`
G.vue_change_y=b=>`self.y+=${V(b,'BY',Order.ADDITION)};\n`
G.vue_change_z=b=>`self.z+=${V(b,'BY',Order.ADDITION)};\n`
G.vue_set_x=b=>`self.x=${V(b,'V')};\n`
G.vue_set_y=b=>`self.y=${V(b,'V')};\n`
G.vue_set_z=b=>`self.z=${V(b,'V')};\n`
G.vue_set_pos=b=>`self.x=${V(b,'X')};self.y=${V(b,'Y')};\n`
G.vue_set_pos3=b=>`self.x=${V(b,'X')};self.y=${V(b,'Y')};self.z=${V(b,'Z')};\n`
G.vue_goto_ent=b=>`{const t=${EN(b,'E')};if(t){self.x=t.x;self.y=t.y;self.z=t.z;}}\n`
G.vue_goto_mouse=()=>`self.x=vue.mouse.x;self.y=vue.mouse.y;\n`
G.vue_glide=b=>`await vue.tween(self,{x:${V(b,'X')},y:${V(b,'Y')}},${V(b,'S')},${J(F(b,'EASE'))});\n`
G.vue_glide3=b=>`await vue.tween(self,{x:${V(b,'X')},y:${V(b,'Y')},z:${V(b,'Z')}},${V(b,'S')});\n`
G.vue_set_vel=b=>`self.vx=${V(b,'VX')};self.vy=${V(b,'VY')};\n`
G.vue_set_vel3=b=>`self.vx=${V(b,'VX')};self.vy=${V(b,'VY')};self.vz=${V(b,'VZ')};\n`
G.vue_set_vx=b=>`self.vx=${V(b,'V')};\n`
G.vue_set_vy=b=>`self.vy=${V(b,'V')};\n`
G.vue_change_vel=b=>`self.vx+=${V(b,'VX',Order.ADDITION)};self.vy+=${V(b,'VY',Order.ADDITION)};\n`
G.vue_jump=b=>`self.jump(${V(b,'P')});\n`
G.vue_player_make=b=>`self.makePlayer(${J(F(b,'P'))});\n`
G.vue_player_set=b=>`vue.player.${F(b,'K')}=${V(b,'V')};\n`
G.vue_move_local=b=>`self.moveLocal(${V(b,'F')},${V(b,'S')},vue.camera.yaw);\n`
G.vue_set_rot=b=>`self.rot=${V(b,'V')};\n`
G.vue_change_rot=b=>`self.rot+=${V(b,'V',Order.ADDITION)};\n`
G.vue_rotate3=b=>`self.${F(b,'AX')}+=${V(b,'V',Order.ADDITION)};\n`
G.vue_move_dir=b=>`{const a=self.rot*Math.PI/180,d=${V(b,'V')};self.x+=Math.cos(a)*d;self.y+=Math.sin(a)*d;}\n`
G.vue_point_at=b=>`self.pointAt(${EN(b,'E')});\n`
G.vue_point_mouse=()=>`self.pointAt(vue.mouse);\n`
G.vue_flip=b=>`self.flipX=${F(b,'F')};\n`
G.vue_set_body=b=>`self.body=${J(F(b,'B'))};\n`
G.vue_set_grav=b=>`self.gravityScale=${V(b,'V')};\n`
G.vue_color=b=>`self.color=${J(F(b,'C'))};\n`
G.vue_color_v=b=>`self.color=String(${T(b,'V')});\n`
G.vue_say=b=>`self.say(${T(b,'T')},${V(b,'S')});\n`
G.vue_visible=b=>`self.visible=${F(b,'V')};\n`
G.vue_size=b=>`self.w=${V(b,'W')};self.h=${V(b,'H')};\n`
G.vue_change_size=b=>`{const k=1+(${V(b,'V')})/100;self.w*=k;self.h*=k;self.d*=k;}\n`
G.vue_set_alpha=b=>`self.alpha=Math.max(0,Math.min(1,${V(b,'V')}));\n`
G.vue_change_alpha=b=>`self.alpha=Math.max(0,Math.min(1,self.alpha+(${V(b,'V')})));\n`
G.vue_set_layer=b=>`self.setZ(${V(b,'V')});\n`
G.vue_set_text=b=>`self.text=String(${T(b,'V')});\n`
G.vue_set_font=b=>`self.fontSize=${V(b,'V')};\n`
G.vue_set_image=b=>`self.image=${J(F(b,'N'))};\n`
G.vue_anim=b=>`self.play(${J(F(b,'N'))},${F(b,'R')});\n`
G.vue_anim_stop=()=>`self.stopAnim();\n`
G.vue_burst=b=>`vue.burst(self.x,self.y,${J(F(b,'C'))},${V(b,'N')});\n`
G.vue_follow=()=>`vue.follow(self);\n`
G.vue_follow3=b=>`vue.follow(self,${V(b,'D')},${V(b,'H')});\n`
G.vue_unfollow=()=>`vue.follow(null);\n`
G.vue_cam_set=b=>`vue.camera.${F(b,'P')}=${V(b,'V')};\n`
G.vue_cam_change=b=>`vue.camera.${F(b,'P')}+=${V(b,'V',Order.ADDITION)};\n`
G.vue_cam_get=b=>['vue.camera.'+F(b,'P'),M]
G.vue_shake=b=>`vue.shake(${V(b,'A')},${V(b,'S')});\n`
G.vue_lock_mouse=()=>`vue.lockMouse();\n`
G.vue_beep=b=>`vue.beep(${V(b,'F')},${V(b,'D')});\n`
G.vue_beep2=b=>`vue.beep(${V(b,'F')},${V(b,'D')},${J(F(b,'W'))},${V(b,'V')});\n`
G.vue_play=b=>`vue.play(${J(F(b,'N'))});\n`
G.vue_play2=b=>`vue.play(${J(F(b,'N'))},${V(b,'V')},${F(b,'L')});\n`
G.vue_music=b=>`vue.music(${J(F(b,'N'))},${V(b,'V')});\n`
G.vue_stop_music=()=>`vue.stopMusic();\n`
G.vue_stop_sounds=()=>`vue.stopSounds();\n`
G.vue_volume=b=>`vue.volume(${V(b,'V')});\n`
G.vue_my_sound=b=>`self.${F(b,'A')}();\n`
G.vue_x_burst=b=>`vue_x('fx','Particle FX').burst(self.x,self.y,self.z,${J(F(b,'P'))});\n`
G.vue_x_emit=b=>`vue_x('fx','Particle FX').emitter(${J(F(b,'P'))},{follow:self});\n`
G.vue_x_weather=b=>`vue_x('weather','Weather System').set(${J(F(b,'W'))},${V(b,'I')});\n`
G.vue_x_hour=b=>`vue_x('day','Day/Night Cycle').setHour(${V(b,'H')});\n`
G.vue_x_night=()=>[`!!vue_x('day','Day/Night Cycle').isNight`,Order.LOGICAL_NOT]
G.vue_x_goto=b=>`await vue_x('nav','NavMesh & Pathfinding').go(self,${EN(b,'E')},${V(b,'S')});\n`
G.vue_x_explode=b=>`vue_x('destruct','Destructible World').explode(self.x,self.y,self.z,${V(b,'R')});\n`
G.vue_x_shatter=b=>`vue_x('destruct','Destructible World').shatter(self,{pieces:${V(b,'N')}});\n`
G.vue_x_say=b=>`await vue_x('dialogue','Dialogue AI').say(${T(b,'W')},${T(b,'T')});\n`
G.vue_x_ask=b=>[`(await vue_x('dialogue','Dialogue AI').ask(${T(b,'W')},${T(b,'T')},${gen.valueToCode(b,'L',Order.NONE)||'[]'}))`,FC]
G.vue_x_chat=b=>[`(await vue_x('dialogue','Dialogue AI').chat(${T(b,'W')},${T(b,'T')},${T(b,'P')}))`,FC]
G.vue_x_voice=b=>`await vue_x('voice','Kokoro Voice').say(${T(b,'T')},{voice:${J(F(b,'V'))},entity:self});\n`
G.vue_x_pad=b=>[`!!vue_x('pad','Gamepad').button(${J(F(b,'B'))})`,Order.LOGICAL_NOT]
G.vue_x_axis=b=>[`(+vue_x('pad','Gamepad').axis(${J(F(b,'A'))})||0)`,FC]
G.vue_x_rumble=b=>`vue_x('pad','Gamepad').vibrate(${V(b,'M')});\n`
G.vue_x_host=()=>`vue.hud('Room',await vue_x('net','Multiplayer').host());\n`
G.vue_x_join=b=>`await vue_x('net','Multiplayer').join(${T(b,'C')});\n`
G.vue_x_rep=()=>`vue_x('net','Multiplayer').replicate(self);\n`
G.vue_x_send=b=>`vue_x('net','Multiplayer').send(${J(F(b,'M'))},${N(b,'D')});\n`
G.vue_x_post=b=>`vue_x('post','Post Processing').set(${J(F(b,'K'))},${V(b,'V')});\n`
G.vue_x_flash=b=>`vue_x('post','Post Processing').flash(${J(F(b,'C'))},${V(b,'S')});\n`
G.vue_x_call=b=>`await vue_x(${J(F(b,'NS'))},${J(F(b,'NS'))})[${J(F(b,'FN'))}](${N(b,'A')});\n`
G.vue_x_get=b=>[`vue_x(${J(F(b,'NS'))},${J(F(b,'NS'))})[${J(F(b,'K'))}]`,M]
G.vue_wait=b=>`await vue.wait(${V(b,'S')});\n`
G.vue_wait_until=b=>`while(!(${V(b,'C')}))await vue.frame();\n`
G.vue_after=b=>`vue.after(${V(b,'S')},${fnh('',S(b,'DO'))});\n`
G.vue_every=b=>`vue.every(${V(b,'S')},${fnh('',S(b,'DO'))});\n`
G.vue_foreach=b=>`for(${gen.getVariableName(F(b,'VAR'))} of vue.all(${J(F(b,'TAG'))})){\n${S(b,'DO')}}\n`
G.vue_return=()=>`return;\n`
G.vue_destroy_self=()=>`self.destroy();\n`
G.vue_destroy=b=>`{const t=vue_e(${N(b,'T')});if(t&&t.destroy)t.destroy();}\n`
G.vue_spawn=b=>`vue.spawn(${J(F(b,'N'))},${V(b,'X')},${V(b,'Y')});\n`
G.vue_spawn3=b=>`vue.spawn(${J(F(b,'N'))},${V(b,'X')},${V(b,'Y')},${V(b,'Z')});\n`
G.vue_spawn_v=b=>[`vue.spawn(${J(F(b,'N'))},${V(b,'X')},${V(b,'Y')})`,FC]
G.vue_go=b=>`vue.go(${J(F(b,'S'))});\n`
G.vue_restart=()=>`vue.restart();\n`
G.vue_emit=b=>`vue.emit(${J(F(b,'M'))},${N(b,'V')});\n`
G.vue_cutscene=b=>F(b,'W')==='true'?`await vue.cutscene(${J(F(b,'N'))});\n`:`vue.cutscene(${J(F(b,'N'))});\n`
G.vue_skip_cs=()=>`vue.skipCutscene();\n`
G.vue_stop_game=()=>`vue.stop();\n`
G.vue_key_down=b=>[`vue.key(${J(F(b,'KEY'))})`,FC]
G.vue_key_pressed=b=>[`vue.pressed(${J(F(b,'KEY'))})`,FC]
G.vue_any_key=()=>['vue.anyKey()',FC]
G.vue_last_key=()=>['(typeof key!=="undefined"?key:"")',A]
G.vue_mouse=b=>['vue.mouse.'+F(b,'A'),M]
G.vue_mouse_down=()=>['vue.mouse.down',M]
G.vue_mouse_clicked=()=>['vue.mouse.clicked',M]
G.vue_self_prop=b=>['self.'+F(b,'P'),M]
G.vue_grounded=()=>['self.grounded',M]
G.vue_touching=b=>[`self.touching(${J(F(b,'TAG')||'')})`,FC]
G.vue_other=()=>['(typeof other!=="undefined"?other:null)',A]
G.vue_other_tag=b=>[`(typeof other!=="undefined"&&!!other&&other.hasTag(${J(F(b,'TAG')||'')}))`,A]
G.vue_msg_data=()=>['(typeof data!=="undefined"?data:null)',A]
G.vue_dist=b=>[`self.dist(${EN(b,'E')})`,FC]
G.vue_angle=b=>[`vue.angle(self,${EN(b,'E')})`,FC]
G.vue_find=b=>[`vue.find(${J(F(b,'N'))})`,FC]
G.vue_self=()=>['self',A]
G.vue_nearest=b=>[`vue.nearest(self,${J(F(b,'TAG'))})`,FC]
G.vue_count=b=>[`vue.count(${J(F(b,'TAG'))})`,FC]
G.vue_all=b=>[`vue.all(${J(F(b,'TAG'))})`,FC]
G.vue_exists=b=>[`(!!${EN(b,'E')}&&${EN(b,'E')}.alive)`,A]
G.vue_get_prop=b=>[`((${EN(b,'E')}||{}).${F(b,'P')})`,A]
G.vue_time=()=>['vue.time',M]
G.vue_dt=()=>['vue.dt',M]
G.vue_screen=b=>['vue.'+F(b,'A'),M]
G.vue_in_cs=()=>['vue.inCutscene',M]
G.vue_scene_name=()=>['vue.scene',M]
G.vue_set_prop=b=>`{const t=${EN(b,'E')};if(t)t.${F(b,'P')}=${V(b,'V')};}\n`
G.vue_change_prop=b=>`{const t=${EN(b,'E')};if(t)t.${F(b,'P')}+=${V(b,'V',Order.ADDITION)};}\n`
G.vue_add_tag=b=>`self.addTag(${J(F(b,'T'))});\n`
G.vue_remove_tag=b=>`self.removeTag(${J(F(b,'T'))});\n`
G.vue_has_tag=b=>[`(!!${EN(b,'E')}&&${EN(b,'E')}.hasTag(${J(F(b,'T'))}))`,A]
G.vue_set_local=b=>`self.data[${J(F(b,'N'))}]=${V(b,'V')};\n`
G.vue_change_local=b=>{const n=J(F(b,'N'));return `self.data[${n}]=(+self.data[${n}]||0)+${V(b,'V',Order.ADDITION)};\n`}
G.vue_get_local=b=>[`(self.data[${J(F(b,'N'))}]??0)`,A]
G.vue_attach=b=>`self.attach(${EN(b,'E')});\n`
G.vue_detach=()=>`self.detach();\n`
G.vue_parent=()=>['self.parent',M]
G.vue_children=()=>['self.children',M]
G.vue_set_tile=b=>`vue.setTile(${J(F(b,'M'))},${V(b,'X')},${V(b,'Y')},${V(b,'I')});\n`
G.vue_erase_tile=b=>`vue.setTile(${J(F(b,'M'))},${V(b,'X')},${V(b,'Y')},-1);\n`
G.vue_tile_at=b=>[`vue.tileAt(${J(F(b,'M'))},${V(b,'X')},${V(b,'Y')})`,FC]
G.vue_set_global=b=>`vue.vars[${J(F(b,'N'))}]=${V(b,'V')};\n`
G.vue_change_global=b=>{const n=J(F(b,'N'));return `vue.vars[${n}]=(+vue.vars[${n}]||0)+${V(b,'V',Order.ADDITION)};\n`}
G.vue_get_global=b=>[`(vue.vars[${J(F(b,'N'))}]??0)`,A]
G.vue_hud=b=>`vue.hud(${J(F(b,'L'))},${V(b,'V')});\n`
G.vue_hud_clear=b=>`vue.clearHud(${J(F(b,'L'))});\n`
G.vue_print=b=>`vue.log(${V(b,'V')});\n`
G.vue_warn=b=>`vue.warn(${V(b,'V')});\n`
G.vue_random=b=>[`vue.random(${V(b,'A')},${V(b,'B')})`,FC]
G.vue_random_int=b=>[`vue.randomInt(${V(b,'A')},${V(b,'B')})`,FC]
G.vue_chance=b=>[`vue.chance((${V(b,'P')})/100)`,FC]
G.vue_lerp=b=>[`vue.lerp(${V(b,'A')},${V(b,'B')},${V(b,'K')})`,FC]
const cr=G.procedures_callreturn
if(cr)G.procedures_callreturn=(b,g)=>{const r=cr(b,g);return['(await '+r[0]+')',A]}
return {toolbox:toolbox()}
}
const PRE='const vue_e=v=>typeof v==="string"?vue.find(v):v;\nconst vue_x=(n,t)=>vue[n]||(vue.warn("Turn on the "+t+" extension to use this block"),new Proxy(function(){},{get:(a,k)=>k==="then"?undefined:vue_x(n,t),apply:()=>undefined}));\n'
function compile(json,Blockly,gen){
const ws=new Blockly.Workspace()
try{
Blockly.serialization.workspaces.load(json,ws)
gen.init(ws)
let code=''
const procs=[]
for(const b of ws.getTopBlocks(true)){
if(b.type==='procedures_defnoreturn'||b.type==='procedures_defreturn'){gen.blockToCode(b);procs.push(gen.getProcedureName?gen.getProcedureName(b.getFieldValue('NAME')):b.getFieldValue('NAME'));continue}
if(HATS.indexOf(b.type)<0||!b.isEnabled())continue
const c=gen.blockToCode(b)
if(typeof c==='string')code+=b.type==='vue_forever'?`on('start',async function(){\n${c}});\n`:c
}
let out=gen.finish(code)
for(const p of procs)out=out.split('function '+p+'(').join('async function '+p+'(')
return PRE+out
}finally{ws.dispose()}
}
function theme(Blockly){
return Blockly.Theme.defineTheme('vue',{
name:'vue',
base:Blockly.Themes.Zelos,
blockStyles:{event_blocks:{colourPrimary:C.ev,colourSecondary:'#c93a6b',colourTertiary:'#a8305a',hat:'cap'},logic_blocks:{colourPrimary:'#2fbf74',colourSecondary:'#27a564',colourTertiary:'#1f8a53'},math_blocks:{colourPrimary:'#2fbf74',colourSecondary:'#27a564',colourTertiary:'#1f8a53'},loop_blocks:{colourPrimary:C.co,colourSecondary:'#d98f1c',colourTertiary:'#b87814'},text_blocks:{colourPrimary:'#e86fbf',colourSecondary:'#cf5fab',colourTertiary:'#b44f94'},variable_blocks:{colourPrimary:'#ff7a45',colourSecondary:'#e86a38',colourTertiary:'#c9582c'},variable_dynamic_blocks:{colourPrimary:'#ff7a45',colourSecondary:'#e86a38',colourTertiary:'#c9582c'},list_blocks:{colourPrimary:'#c06cff',colourSecondary:'#a95ae6',colourTertiary:'#8f48c4'},procedure_blocks:{colourPrimary:'#8a8f98',colourSecondary:'#767b84',colourTertiary:'#62666e'}},
fontStyle:{family:'Inter, system-ui, sans-serif',weight:'600',size:11},
componentStyles:{workspaceBackgroundColour:'#131313',toolboxBackgroundColour:'#1b1b1b',toolboxForegroundColour:'#e6e3dd',flyoutBackgroundColour:'#222222',flyoutForegroundColour:'#e6e3dd',flyoutOpacity:0.97,scrollbarColour:'#454545',scrollbarOpacity:0.6,insertionMarkerColour:'#ffffff',insertionMarkerOpacity:0.3,cursorColour:'#d0d0d0'}
})
}
const api={DEFS,HATS,init,compile,theme}
if(typeof module!=='undefined'&&module.exports)module.exports=api
else root.VueBlocks=api
})(typeof window!=='undefined'?window:globalThis);
