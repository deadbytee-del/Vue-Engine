VueExt.register({id:'kokorovoice',name:'Kokoro Voice',ns:'voice',cat:'Audio',icon:'mic',version:'1.0.0',example:"export async function click() {\nawait vue.voice.say('Welcome, traveler. The gate opens at dawn.', { voice: 'bm_george', entity: self })\n}",desc:'Natural AI voices from the open Kokoro-82M model, generated on the player\'s device with no server or key. Make any NPC speak any line, with 3D panning from the speaker. Falls back to the system voice while the model downloads.',choices:{voice:['af_heart','af_bella','af_nicole','af_sarah','af_sky','am_adam','am_michael','am_fenrir','am_puck','bf_emma','bf_isabella','bm_george','bm_lewis'],dtype:['q8','q4','fp16','fp32']},defaults:{voice:'af_heart',speed:1,dtype:'q8',volume:1,preload:false},
api(g,c,s){
const V=['af_heart','af_bella','af_nicole','af_sarah','af_sky','am_adam','am_michael','am_fenrir','am_puck','bf_emma','bf_isabella','bm_george','bm_lewis']
const load=()=>s.lp||(s.lp=(async()=>{
const m=await import('https://cdn.jsdelivr.net/npm/kokoro-js@1.2.1/dist/kokoro.web.js')
try{await caches.keys()}catch(x){if(m.env)m.env.useBrowserCache=false}
s.tts=await m.KokoroTTS.from_pretrained('onnx-community/Kokoro-82M-v1.0-ONNX',{dtype:c.dtype,device:'wasm',progress_callback:p=>{if(p&&p.progress!=null&&p.status==='progress')s.pct=Math.round(p.progress)}})
s.pct=100
return s.tts
})().catch(e=>{s.err=e;g.log('warn','Kokoro voice could not load: '+(e&&e.message||e));throw e}))
s.load=load
const sys=(text,o)=>new Promise(res=>{const S=globalThis.speechSynthesis;if(!S)return res();const u=new SpeechSynthesisUtterance(text);u.rate=o.speed||c.speed;u.volume=c.volume;u.onend=u.onerror=()=>res();S.speak(u)})
return{
voices:V,
get ready(){return!!s.tts},
get progress(){return s.pct||0},
preload:()=>load().then(()=>true,()=>false),
say:async(text,o)=>{
o=Object.assign({},typeof o==='string'?{voice:o}:o||{})
text=String(text||'')
if(!text)return
if(!s.tts&&!o.wait){load().catch(()=>{});return sys(text,o)}
let t
try{t=await load()}catch(e){return sys(text,o)}
const a=await t.generate(text,{voice:o.voice||c.voice,speed:o.speed||c.speed})
const ac=g.audio(true)
if(!ac)return
const buf=ac.createBuffer(1,a.audio.length,a.sampling_rate);buf.copyToChannel(a.audio,0)
const src=ac.createBufferSource(),gn=ac.createGain();src.buffer=buf;gn.gain.value=(o.volume==null?1:+o.volume)*c.volume
let out=gn
const e=o.entity?(typeof o.entity==='string'?g.vue.find(o.entity):o.entity):null
if(e&&ac.createStereoPanner){const p=ac.createStereoPanner();const dx=e.x-g.camera.x;p.pan.value=Math.max(-1,Math.min(1,dx/(g.is3d?10:g.w/2)));gn.connect(p);out=p}
src.connect(gn);out.connect(g.master||ac.destination)
if(e&&o.bubble!==false)e.say&&e.say(text,buf.duration+0.3)
return new Promise(r=>{src.onended=r;src.start()})
}
}
},
init(g,c,s){if(c.preload)s.load().catch(()=>{})},
screen(g,c,s,ctx){if(s.lp&&!s.tts&&!s.err){ctx.save();ctx.font='600 12px Inter,system-ui,sans-serif';ctx.fillStyle='rgba(0,0,0,.55)';ctx.fillRect(g.w-190,g.h-30,180,22);ctx.fillStyle='#c9a6ff';ctx.fillRect(g.w-190,g.h-10,180*(s.pct||0)/100,2);ctx.fillStyle='#fff';ctx.textBaseline='middle';ctx.fillText('Loading voice '+(s.pct||0)+'%',g.w-182,g.h-19);ctx.restore()}}
})
