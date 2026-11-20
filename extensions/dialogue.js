VueExt.register({id:'dialogue',name:'Dialogue AI',ns:'dialogue',cat:'AI',icon:'message',version:'1.0.0',example:"export async function click() {\nawait vue.dialogue.say('Mira', 'You made it through the forest!')\nconst pick = await vue.dialogue.ask('Mira', 'Need anything?', ['A map', 'Nothing'])\nconst line = await vue.dialogue.input('You', 'Ask Mira anything')\nawait vue.dialogue.say('Mira', await vue.dialogue.chat('Mira', line, 'You are Mira, a cheerful forest guide.'))\n}",desc:'A polished dialogue box with typewriter text, speaker names and branching choices, plus live AI conversations: give an NPC a personality and players can talk to it in their own words. AI replies use Puter, which is free and needs no API key.',defaults:{speed:45,box:'#110f19',accent:'#9d5cff',model:'gpt-4o-mini'},
api(g,c,s){
s.q=[];s.hist=new Map()
const show=o=>new Promise(res=>{s.q.push(Object.assign({res,t:0,shown:0,sel:0},o))})
const puter=()=>s.pp||(s.pp=new Promise((res,rej)=>{if(globalThis.puter)return res(globalThis.puter);const d=globalThis.document;if(!d)return rej(new Error('no document'));const sc=d.createElement('script');sc.src='https://js.puter.com/v2/';sc.onload=()=>res(globalThis.puter);sc.onerror=()=>rej(new Error('Could not load Puter'));d.head.appendChild(sc)}))
return{
say:(who,text)=>show({who:String(who||''),text:String(text==null?'':text)}),
ask:(who,text,choices)=>show({who:String(who||''),text:String(text||''),choices:(choices||[]).map(String)}),
input:(who,text)=>show({who:String(who||''),text:String(text||''),input:true}),
get open(){return s.q.length>0},
chat:async(npc,line,persona)=>{
const key=String(npc)
let h=s.hist.get(key)
if(!h){h=[{role:'system',content:(persona||('You are '+key+', a character in a video game.'))+' Stay in character. Reply in one to three short sentences. Never mention being an AI.'}];s.hist.set(key,h)}
h.push({role:'user',content:String(line)})
let out=''
try{const P=await puter();const r=await P.ai.chat(h,{model:c.model});out=typeof r==='string'?r:(r&&r.message&&(typeof r.message.content==='string'?r.message.content:Array.isArray(r.message.content)?r.message.content.map(x=>x.text||'').join(''):''))||String(r)}
catch(e){out='...';g.log('warn','AI dialogue unavailable here ('+(e&&e.message||e)+'). It works in exported games opened in a browser.')}
h.push({role:'assistant',content:out})
if(h.length>24)h.splice(1,2)
return out
},
forget:npc=>{s.hist.delete(String(npc))}
}
},
init(g,c,s){
if(!g.canvas||!g.canvas.addEventListener)return
g.canvas.addEventListener('pointerdown',()=>{s.click=true})
},
pre(g,c,s,dt){
const d=s.q[0]
if(!d){if(s.inp){s.inp.remove();s.inp=null}return}
d.t+=dt
const full=d.text.length
d.shown=Math.min(full,Math.floor(d.t*c.speed))
const K=k=>g.pressedSet.has(k)
const adv=K('space')||K('enter')||K('e')||s.click
s.click=false
if(d.input){
if(!s.inp&&globalThis.document){const i=document.createElement('input');i.placeholder='Type and press Enter';i.style.cssText='position:fixed;left:50%;bottom:9%;transform:translateX(-50%);width:min(70vw,560px);z-index:30;padding:10px 14px;border-radius:10px;border:1px solid '+c.accent+';background:#0a0910;color:#fff;font:15px Inter,system-ui,sans-serif;outline:none';i.onkeydown=ev=>{ev.stopPropagation();if(ev.key==='Enter'){const v=i.value;i.remove();s.inp=null;s.q.shift();d.res(v)}};document.body.appendChild(i);setTimeout(()=>i.focus(),0);s.inp=i}
return
}
if(d.choices&&d.choices.length&&d.shown>=full){
if(K('arrowdown')||K('s'))d.sel=(d.sel+1)%d.choices.length
if(K('arrowup')||K('w'))d.sel=(d.sel+d.choices.length-1)%d.choices.length
for(let i=0;i<Math.min(9,d.choices.length);i++)if(K(String(i+1))){d.sel=i;s.q.shift();d.res(i);return}
if(s.hit!=null&&adv){d.sel=s.hit}
if(adv){s.q.shift();d.res(d.sel);return}
return
}
if(adv){if(d.shown<full)d.t=1e9;else{s.q.shift();d.res()}}
},
screen(g,c,s,ctx){
const d=s.q[0]
if(!d||d.input&&!d.text)return
const W=g.w,H=g.h,bw=Math.min(W-40,760),bx=(W-bw)/2,lines=[],fs=Math.max(14,Math.min(20,W/48))
ctx.save()
ctx.font='500 '+fs+'px Inter,system-ui,sans-serif'
const words=d.text.slice(0,d.shown).split(' ');let ln=''
for(const w of words){const t=ln?ln+' '+w:w;if(ctx.measureText(t).width>bw-40&&ln){lines.push(ln);ln=w}else ln=t}
if(ln)lines.push(ln)
const ch=d.choices&&d.shown>=d.text.length?d.choices:[],bh=Math.max(3,lines.length)*fs*1.45+40+ch.length*(fs*1.7),by=H-bh-24-(d.input?60:0)
ctx.globalAlpha=0.94;ctx.fillStyle=c.box;ctx.strokeStyle=c.accent;ctx.lineWidth=2
ctx.beginPath();ctx.roundRect?ctx.roundRect(bx,by,bw,bh,14):ctx.rect(bx,by,bw,bh);ctx.fill();ctx.stroke()
ctx.globalAlpha=1
if(d.who){ctx.font='700 '+(fs*0.85)+'px Inter,system-ui,sans-serif';const tw=ctx.measureText(d.who).width+22;ctx.fillStyle=c.accent;ctx.beginPath();ctx.roundRect?ctx.roundRect(bx+18,by-14,tw,26,8):ctx.rect(bx+18,by-14,tw,26);ctx.fill();ctx.fillStyle='#fff';ctx.textBaseline='middle';ctx.fillText(d.who,bx+29,by-1)}
ctx.font='500 '+fs+'px Inter,system-ui,sans-serif';ctx.fillStyle='#ece8f6';ctx.textBaseline='top'
lines.forEach((l,i)=>ctx.fillText(l,bx+20,by+22+i*fs*1.45))
s.hit=null
const mx=g.mouse.sx,my=g.mouse.sy
ch.forEach((o,i)=>{const y=by+22+Math.max(3,lines.length)*fs*1.45+i*fs*1.7;if(mx>bx&&mx<bx+bw&&my>y-4&&my<y+fs*1.4){d.sel=i;s.hit=i}const on=i===d.sel;ctx.fillStyle=on?c.accent:'rgba(255,255,255,.06)';ctx.fillRect(bx+16,y-4,bw-32,fs*1.45);ctx.fillStyle=on?'#fff':'#c9c2dc';ctx.fillText((i+1)+'.  '+o,bx+26,y)})
if(!ch.length&&d.shown>=d.text.length&&!d.input){ctx.fillStyle=c.accent;ctx.globalAlpha=0.5+0.5*Math.sin(g.time*6);ctx.beginPath();ctx.moveTo(bx+bw-28,by+bh-20);ctx.lineTo(bx+bw-18,by+bh-20);ctx.lineTo(bx+bw-23,by+bh-13);ctx.fill()}
ctx.restore()
}
})
