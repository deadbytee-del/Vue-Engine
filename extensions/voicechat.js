VueExt.register({id:'voicechat',name:'Voice Chat',ns:'vc',cat:'Networking',icon:'mic',version:'1.0.0',example:"export async function start() {\nawait vue.vc.start()\n}\nexport function update(dt: number) {\nif (vue.pressed('m')) vue.vc.mute(!vue.vc.talking)\n}",requires:['multiplayer'],desc:'Live voice between players in a Multiplayer room, with push-to-talk, mute, and optional proximity so voices fade with distance between replicated players.',defaults:{proximity:false,range:0,pushToTalk:'',volume:1},
api(g,c,s){
s.calls=new Map();s.out=new Map()
const net=()=>g.vue.net&&g.vue.net._s
s.attach=call=>attach(call)
const attach=(call)=>{call.on('stream',st=>{const ac=g.audio(true);if(!ac)return;const src=ac.createMediaStreamSource(st),gn=ac.createGain();gn.gain.value=c.volume;src.connect(gn);gn.connect(g.master||ac.destination);const a=new Audio();a.srcObject=st;a.muted=true;a.play().catch(()=>{});s.out.set(call.peer,{gn,a})});call.on('close',()=>{const o=s.out.get(call.peer);if(o)o.gn.disconnect();s.out.delete(call.peer);s.calls.delete(call.peer)});s.calls.set(call.peer,call)}
return{
start:async()=>{
const n=net()
if(!n||!n.peer){g.log('warn','Join or host a Multiplayer room before starting voice chat');return false}
try{s.mic=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true}})}catch(e){g.log('warn','Microphone blocked: '+(e&&e.message||e));return false}
if(c.pushToTalk)for(const t of s.mic.getAudioTracks())t.enabled=false
if(!s.hooked){s.hooked=true;n.peer.on('call',call=>{call.answer(s.mic);attach(call)})}
s.on=true
return true
},
stop:()=>{for(const cl of s.calls.values())try{cl.close()}catch(x){}s.calls.clear();if(s.mic)for(const t of s.mic.getTracks())t.stop();s.mic=null;s.on=false},
mute:m=>{if(s.mic)for(const t of s.mic.getAudioTracks())t.enabled=!m;s.muted=!!m},
get talking(){return!!(s.mic&&s.mic.getAudioTracks().some(t=>t.enabled))},
get active(){return!!s.on}
}
},
update(g,c,s){
if(!s.on)return
const n=g.vue.net&&g.vue.net._s
if(n&&n.peer&&s.mic)for(const id of n.peers)if(!s.calls.has(id)&&n.id>id)s.attach(n.peer.call(id,s.mic))
if(c.pushToTalk&&s.mic&&!s.muted){const on=g.keys.has(c.pushToTalk);for(const t of s.mic.getAudioTracks())t.enabled=on}
if(c.proximity&&n){const me=Array.from(n.rep.keys())[0],R=c.range||(g.is3d?25:900);for(const[pid,o]of s.out){let e=null;for(const[id,x]of n.remote)if(id.startsWith(pid+':')){e=x;break}if(!me||!e){o.gn.gain.value=c.volume;continue}const d=Math.hypot(me.x-e.x,me.y-e.y,(me.z||0)-(e.z||0));o.gn.gain.value=c.volume*Math.max(0,1-d/R)}}
}
})
