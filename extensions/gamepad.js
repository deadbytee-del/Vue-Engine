VueExt.register({id:'gamepad',name:'Gamepad',ns:'pad',cat:'Input',icon:'gamepad',version:'1.0.0',example:"export function update(dt: number) {\nself.vx = vue.pad.axis('lx') * 240\nif (vue.pad.pressed('a')) self.vy = -600\nif (vue.pad.pressed('x')) vue.pad.vibrate(150, 0.6)\n}",desc:'Xbox, PlayStation and Switch controllers. Sticks and buttons drive your keyboard controls automatically, with rumble and per-button reads for custom mappings.',defaults:{map:true,dead:0.25},
api(g,c,s){
const B={a:0,b:1,x:2,y:3,lb:4,rb:5,lt:6,rt:7,select:8,start:9,ls:10,rs:11,up:12,down:13,left:14,right:15,home:16}
const A={lx:0,ly:1,rx:2,ry:3}
s.p=[];s.prev={};s.edge=new Set();s.vk=new Set()
const P=i=>s.p[i||0]||null,bi=b=>typeof b==='number'?b:B[String(b).toLowerCase()]
return{
connected:i=>!!P(i),
count:()=>s.p.filter(Boolean).length,
name:i=>{const p=P(i);return p?p.id:''},
axis:(a,i)=>{const p=P(i);if(!p)return 0;const v=p.axes[typeof a==='number'?a:A[a]||0]||0;return Math.abs(v)<c.dead?0:v},
button:(b,i)=>{const p=P(i),x=p&&p.buttons[bi(b)];return!!(x&&x.pressed)},
pressed:(b,i)=>s.edge.has((i||0)+':'+bi(b)),
value:(b,i)=>{const p=P(i),x=p&&p.buttons[bi(b)];return x?x.value:0},
vibrate:(ms,str,i)=>{const p=P(i),a=p&&p.vibrationActuator;str=str==null?0.8:+str;if(a&&a.playEffect)a.playEffect('dual-rumble',{duration:+ms||200,strongMagnitude:str,weakMagnitude:str*0.6}).catch(()=>{})},
mapping:on=>{c.map=!!on}
}
},
pre(g,c,s){
const n=globalThis.navigator
if(!n||!n.getGamepads)return
const ps=Array.from(n.getGamepads()||[])
s.p=ps
s.edge.clear()
ps.forEach((p,i)=>{if(!p)return;p.buttons.forEach((b,k)=>{const id=i+':'+k;if(b.pressed&&!s.prev[id])s.edge.add(id);s.prev[id]=b.pressed})})
if(!c.map)return
const p=ps.find(Boolean),want=new Set()
if(p){
const ax=k=>{const v=p.axes[k]||0;return Math.abs(v)<c.dead?0:v},bt=k=>!!(p.buttons[k]&&p.buttons[k].pressed)
if(ax(0)<-0.4||bt(14))want.add('a').add('arrowleft')
if(ax(0)>0.4||bt(15))want.add('d').add('arrowright')
if(ax(1)<-0.4||bt(12))want.add('w').add('arrowup')
if(ax(1)>0.4||bt(13))want.add('s').add('arrowdown')
if(bt(0))want.add('space')
if(bt(1))want.add('shift')
if(bt(2))want.add('e')
if(bt(3))want.add('q')
if(bt(9))want.add('enter')
if(bt(8))want.add('escape')
if(g.scene&&g.scene.mouseLook){const rx=ax(2),ry=ax(3);g.mouse.dx+=rx*14;g.mouse.dy+=ry*14}
}
for(const k of want)if(!s.vk.has(k)){s.vk.add(k);g.vkey(k,true)}
for(const k of Array.from(s.vk))if(!want.has(k)){s.vk.delete(k);g.vkey(k,false)}
}
})
