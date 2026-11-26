(function(root){
const LIST=[]
const num=v=>+v||0
const clampN=(v,a,b)=>v<a?a:v>b?b:v
const D=(n,cat,t,ret,label,args,sig,doc,impl,gen)=>LIST.push({n,cat,t,ret,label,a:args,sig,doc,impl,gen})
const N=(name,def)=>[name,'Number',def]
const Tx=(name,def)=>[name,'String',def]
const An=(name,def)=>[name,'Any',def]
const En=name=>[name,'Entity','self']
const Bo=(name,def)=>[name,'Boolean',def]
const EASE='"linear"|"in"|"out"|"inout"|"back"|"bounce"'
const pt=(e)=>e||{x:0,y:0,z:0}
D('map','Math','val','Number','convert %1 from %2-%3 to %4-%5',[N('V',0),N('A',0),N('B',1),N('C',0),N('D',100)],'(v:number,a:number,b:number,c:number,d:number):number','Converts a number from one range to another range.',()=>(v,a,b,c,d)=>num(c)+(num(v)-num(a))/((num(b)-num(a))||1)*(num(d)-num(c)))
D('wrap','Math','val','Number','wrap %1 around %2 to %3',[N('V',0),N('LO',0),N('HI',360)],'(v:number,lo:number,hi:number):number','Loops a number around so it stays between lo and hi.',()=>(v,a,b)=>{a=num(a);b=num(b);const r=b-a;return r?a+(((num(v)-a)%r)+r)%r:a})
D('smoothstep','Math','val','Number','smooth step from %1 to %2 at %3',[N('A',0),N('B',1),N('T',0.5)],'(a:number,b:number,t:number):number','Eases from 0 to 1 as t goes from a to b.',()=>(a,b,t)=>{const k=clampN((num(t)-num(a))/((num(b)-num(a))||1),0,1);return k*k*(3-2*k)})
D('approach','Math','val','Number','move %1 toward %2 by %3',[N('V',0),N('T',10),N('S',1)],'(v:number,target:number,step:number):number','Moves a number toward a target without passing it.',()=>(v,t,s)=>{v=num(v);t=num(t);s=Math.abs(num(s));return v<t?Math.min(t,v+s):Math.max(t,v-s)})
D('angleDiff','Math','val','Number','shortest turn from %1 to %2 degrees',[N('A',0),N('B',90)],'(a:number,b:number):number','The shortest turn in degrees from angle a to angle b.',()=>(a,b)=>((num(b)-num(a)+540)%360+360)%360-180)
D('vec','Vectors','val','Any','vector %1 %2 %3',[N('X',0),N('Y',0),N('Z',0)],'(x:number,y?:number,z?:number):Vec','Makes a position or direction with x, y and z.',()=>(x,y,z)=>({x:num(x),y:num(y),z:num(z)}))
D('vecAdd','Vectors','val','Any','%1 plus %2',[An('A','vec'),An('B','vec')],'(a:Vec,b:Vec):Vec','Adds two vectors.',()=>(a,b)=>{a=pt(a);b=pt(b);return{x:a.x+b.x,y:a.y+b.y,z:(a.z||0)+(b.z||0)}})
D('vecSub','Vectors','val','Any','%1 minus %2',[An('A','vec'),An('B','vec')],'(a:Vec,b:Vec):Vec','Subtracts vector b from vector a.',()=>(a,b)=>{a=pt(a);b=pt(b);return{x:a.x-b.x,y:a.y-b.y,z:(a.z||0)-(b.z||0)}})
D('vecScale','Vectors','val','Any','%1 times %2',[An('A','vec'),N('K',2)],'(a:Vec,k:number):Vec','Makes a vector longer or shorter.',()=>(a,k)=>{a=pt(a);return{x:a.x*num(k),y:a.y*num(k),z:(a.z||0)*num(k)}})
D('vecLength','Vectors','val','Number','length of %1',[An('A','vec')],'(a:Vec):number','How long a vector is.',()=>a=>{a=pt(a);return Math.hypot(a.x,a.y,a.z||0)})
D('vecNormalize','Vectors','val','Any','direction of %1',[An('A','vec')],'(a:Vec):Vec','The same direction, with a length of 1.',()=>a=>{a=pt(a);const l=Math.hypot(a.x,a.y,a.z||0)||1;return{x:a.x/l,y:a.y/l,z:(a.z||0)/l}})
D('vecDot','Vectors','val','Number','dot product of %1 and %2',[An('A','vec'),An('B','vec')],'(a:Vec,b:Vec):number','Tells how much two directions point the same way.',()=>(a,b)=>{a=pt(a);b=pt(b);return a.x*b.x+a.y*b.y+(a.z||0)*(b.z||0)})
D('listRange','Lists','val','Array','numbers from %1 to %2 step %3',[N('A',1),N('B',5),N('S',1)],'(from:number,to:number,step?:number):number[]','Makes a list of numbers counting up or down.',()=>(a,b,s)=>{a=num(a);b=num(b);s=Math.abs(num(s))||1;const o=[];if(a<=b)for(let i=a;i<=b&&o.length<10000;i+=s)o.push(i);else for(let i=a;i>=b&&o.length<10000;i-=s)o.push(i);return o})
D('listPick','Lists','val','Any','random item of %1',[An('L','list')],'<T>(list:T[]):T|undefined','Picks one item from a list at random.',()=>l=>Array.isArray(l)&&l.length?l[Math.floor(Math.random()*l.length)]:undefined)
D('listShuffle','Lists','val','Array','shuffled copy of %1',[An('L','list')],'<T>(list:T[]):T[]','A copy of the list in a random order.',()=>l=>{const a=Array.isArray(l)?l.slice():[];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));const t=a[i];a[i]=a[j];a[j]=t}return a})
D('listSum','Lists','val','Number','sum of %1',[An('L','list')],'(list:number[]):number','Adds up every number in the list.',()=>l=>(Array.isArray(l)?l:[]).reduce((s,v)=>s+num(v),0))
D('listMin','Lists','val','Number','smallest of %1',[An('L','list')],'(list:number[]):number','The smallest number in the list.',()=>l=>Array.isArray(l)&&l.length?Math.min(...l.map(num)):0)
D('listMax','Lists','val','Number','largest of %1',[An('L','list')],'(list:number[]):number','The largest number in the list.',()=>l=>Array.isArray(l)&&l.length?Math.max(...l.map(num)):0)
D('listUnique','Lists','val','Array','%1 without repeats',[An('L','list')],'<T>(list:T[]):T[]','A copy of the list with repeated items removed.',()=>l=>Array.isArray(l)?Array.from(new Set(l)):[])
D('listSort','Lists','val','Array','sorted copy of %1',[An('L','list')],'(list:any[],descending?:boolean):any[]','A sorted copy of the list.',()=>(l,d)=>{const a=Array.isArray(l)?l.slice():[];a.sort((x,y)=>typeof x==='number'&&typeof y==='number'?x-y:String(x)<String(y)?-1:1);return d===true?a.reverse():a})
D('upper','Text','val','String','%1 in capitals',[Tx('T','hello')],'(text:string):string','Turns text into CAPITAL letters.',()=>t=>String(t).toUpperCase())
D('lower','Text','val','String','%1 in small letters',[Tx('T','HELLO')],'(text:string):string','Turns text into small letters.',()=>t=>String(t).toLowerCase())
D('padNumber','Text','val','String','%1 with zeros to %2 digits',[N('N',7),N('L',3)],'(n:number,length:number):string','Writes a number with zeros in front, like 007.',()=>(n,l)=>String(Math.floor(num(n))).padStart(clampN(Math.floor(num(l)),0,50),'0'))
D('formatNumber','Text','val','String','%1 with %2 decimals',[N('N',3.14159),N('D',2)],'(n:number,decimals:number):string','Writes a number with a set number of decimals.',()=>(n,d)=>num(n).toFixed(clampN(Math.floor(num(d)),0,20)))
D('formatTime','Text','val','String','%1 seconds as minutes:seconds',[N('S',125)],'(seconds:number):string','Writes seconds like 2:05.',()=>s=>{s=Math.max(0,Math.floor(num(s)));return Math.floor(s/60)+':'+String(s%60).padStart(2,'0')})
D('contains','Text','val','Boolean','%1 contains %2',[Tx('T','hello'),Tx('S','ell')],'(text:string,part:string):boolean','True when the text has the other text inside it.',()=>(t,s)=>String(t).includes(String(s)))
D('repeatText','Text','val','String','%1 repeated %2 times',[Tx('T','ab'),N('N',3)],'(text:string,times:number):string','Repeats text several times.',()=>(t,n)=>String(t).repeat(clampN(Math.floor(num(n)),0,1000)))
D('now','Time','val','Number','milliseconds since 1970',[],'():number','The clock time in milliseconds.',()=>()=>Date.now())
D('dateText','Time','val','String','today as text',[],'():string','Today as a date and time.',()=>()=>new Date().toLocaleString())
D('startTimer','Time','stmt','Any','start timer %1',[Tx('N','lap')],'(name:string):void','Starts a stopwatch with a name.',(g)=>n=>{g.stopwatch=g.stopwatch||{};g.stopwatch[String(n)]=g.time})
D('timerElapsed','Time','val','Number','seconds on timer %1',[Tx('N','lap')],'(name:string):number','Seconds since that stopwatch started.',(g)=>n=>g.stopwatch&&g.stopwatch[String(n)]!==undefined?g.time-g.stopwatch[String(n)]:0)
D('waitUntil','Time','stmt','Any','wait until %1',[Bo('C',true)],'(condition:()=>boolean):Promise<void>','Pauses the script until the condition is true.',(g,api)=>async f=>{while(typeof f==='function'?!f():!f)await api.frame()},(a)=>`await vue.waitUntil(()=>${a[0]});\n`)
D('pulse','Tweens','stmt','Any','pulse %1 to %2 times size for %3 s',[En('E'),N('K',1.3),N('S',0.3)],'(e:Entity|string,scale:number,seconds:number):Promise<void>','Grows then shrinks an object.',(g,api)=>async(e,k,s)=>{e=g.vue.find(e)||e;if(!e||!e.alive)return;const w=e.w,h=e.h,d=e.d,sec=Math.max(0.01,num(s))/2;await api.tween(e,{w:w*num(k),h:h*num(k),d:d*num(k)},sec,'out');if(e.alive)await api.tween(e,{w,h,d},sec,'in')},null)
D('fade','Tweens','stmt','Any','fade %1 to opacity %2 over %3 s',[En('E'),N('A',0),N('S',1)],'(e:Entity|string,alpha:number,seconds:number):Promise<void>','Fades an object in or out.',(g,api)=>(e,a,s)=>api.tween(e,{alpha:clampN(num(a),0,1)},num(s),'inout'))
D('moveTo','Tweens','stmt','Any','move %1 to x %2 y %3 over %4 s',[En('E'),N('X',0),N('Y',0),N('S',1)],'(e:Entity|string,x:number,y:number,seconds:number):Promise<void>','Slides an object to a place.',(g,api)=>(e,x,y,s)=>api.tween(e,{x:num(x),y:num(y)},num(s),'inout'))
D('spin','Tweens','stmt','Any','spin %1 by %2 degrees over %3 s',[En('E'),N('D',360),N('S',1)],'(e:Entity|string,degrees:number,seconds:number):Promise<void>','Turns an object around.',(g,api)=>(e,d,s)=>{e=g.vue.find(e)||e;if(!e)return Promise.resolve();return api.tween(e,g.is3d?{ry:e.ry+num(d)}:{rot:e.rot+num(d)},num(s),'inout')})
D('push','Physics','stmt','Any','push %1 by x %2 y %3 z %4',[En('E'),N('X',0),N('Y',0),N('Z',0)],'(e:Entity|string,x:number,y:number,z?:number):void','Adds speed to an object.',(g)=>(e,x,y,z)=>{e=g.vue.find(e)||e;if(!e)return;e.vx+=num(x);e.vy+=num(y);e.vz+=num(z)})
D('setGravity','Physics','stmt','Any','set gravity to %1',[N('G',1400)],'(g:number):void','Changes how hard things fall in this scene.',(g)=>v=>{if(g.scene)g.scene.gravity=num(v);g.gravity=num(v)})
D('freeze','Physics','stmt','Any','freeze %1 in place',[En('E')],'(e:Entity|string):void','Makes an object stop moving and stay put.',(g)=>e=>{e=g.vue.find(e)||e;if(!e||e._fz)return;e._fz=e.body;e.body='static';e.vx=0;e.vy=0;e.vz=0})
D('unfreeze','Physics','stmt','Any','unfreeze %1',[En('E')],'(e:Entity|string):void','Lets a frozen object move again.',(g)=>e=>{e=g.vue.find(e)||e;if(!e||!e._fz)return;e.body=e._fz;e._fz=null})
D('speedOf','Physics','val','Number','speed of %1',[En('E')],'(e:Entity|string):number','How fast an object is moving.',(g)=>e=>{e=g.vue.find(e)||e;return e?Math.hypot(e.vx,e.vy,e.vz):0})
D('knockback','Physics','stmt','Any','knock %1 away from %2 with power %3',[En('E'),En('F'),N('P',300)],'(e:Entity|string,from:Entity|string,power:number):void','Pushes an object away from another one.',(g)=>(e,f,p)=>{e=g.vue.find(e)||e;f=g.vue.find(f)||f;if(!e||!f)return;const dx=e.x-f.x,dz=g.is3d?e.z-f.z:e.y-f.y,n=Math.hypot(dx,dz)||1;e.vx=dx/n*num(p);if(g.is3d)e.vz=dz/n*num(p);else e.vy=dz/n*num(p)})
D('zoom','Camera','stmt','Any','set camera zoom to %1',[N('Z',1)],'(zoom:number):void','Zooms the 2D camera in or out.',(g)=>z=>{g.camera.zoom=clampN(num(z),0.05,20)})
D('lookAt','Camera','stmt','Any','camera looks at %1',[En('E')],'(e:Entity|string):void','Points the camera at an object.',(g)=>e=>{e=g.vue.find(e)||e;if(!e)return;g.camera.follow=null;if(g.is3d){g.camera.tx=e.x;g.camera.ty=e.y;g.camera.tz=e.z}else{g.camera.x=e.x;g.camera.y=e.y}})
D('moveCamera','Camera','stmt','Any','move camera to x %1 y %2 z %3',[N('X',0),N('Y',0),N('Z',12)],'(x:number,y:number,z?:number):void','Puts the camera somewhere.',(g)=>(x,y,z)=>{g.camera.follow=null;g.camera.x=num(x);g.camera.y=num(y);if(g.is3d)g.camera.z=num(z)})
D('fov','Camera','stmt','Any','set camera field of view to %1',[N('F',70)],'(degrees:number):void','Changes how wide the 3D camera sees.',(g)=>f=>{g.camera.fov=clampN(num(f),10,150)})
D('resetCamera','Camera','stmt','Any','reset the camera',[],'():void','Puts the camera back to its normal view.',(g)=>()=>{g.camera.follow=null;g.camera.zoom=1;if(!g.is3d){g.camera.x=0;g.camera.y=0}})
const bar=(v,m,w)=>{m=num(m)||1;w=clampN(Math.floor(num(w))||10,2,40);const k=Math.round(clampN(num(v)/m,0,1)*w);return '█'.repeat(k)+'░'.repeat(w-k)}
D('bar','UI','stmt','Any','show bar %1 at %2 of %3',[Tx('L','Energy'),N('V',50),N('M',100)],'(label:string,value:number,max:number,width?:number):void','Shows a filled bar on screen.',(g)=>(l,v,m,w)=>{g.hudLines.set(String(l),bar(v,m,w))})
D('healthBar','UI','stmt','Any','show health bar for %1',[En('E')],'(e:Entity|string,label?:string):void','Shows how much health an object has left.',(g)=>(e,l)=>{e=g.vue.find(e)||e;if(!e)return;const m=e._hb?e._hb.max:e.pc?e.pc.health.max:100;g.hudLines.set(String(l||'Health'),bar(e.hp,m,10))})
D('banner','UI','stmt','Any','show message %1 for %2 s',[Tx('T','Go!'),N('S',2)],'(text:string,seconds?:number):void','Shows a big message for a short time.',(g)=>(t,s)=>{const k='​'+(g.bannerN=(g.bannerN||0)+1);g.hudLines.set(k,String(t));g.timers.push({t:s==null?2:num(s),f:()=>g.hudLines.delete(k)})})
D('button','UI','stmt','Any','add button %1 that runs %2',[Tx('L','Play again'),['F','fn']],'(label:string,onClick:()=>void):void','Adds a clickable button over the game.',(g)=>(l,f)=>{
const doc=root.document,host=g.canvas&&g.canvas.parentElement
if(!doc||!host)return
let bx=g.uiBox
if(!bx||!bx.isConnected){bx=g.uiBox=doc.createElement('div');bx.style.cssText='position:fixed;left:0;right:0;bottom:24px;display:flex;gap:10px;justify-content:center;z-index:5;pointer-events:none';host.appendChild(bx)}
const b=doc.createElement('button')
b.textContent=String(l)
b.style.cssText='pointer-events:auto;padding:10px 18px;font:600 16px sans-serif;background:#111;border:1px solid #888;color:#fff;border-radius:6px;cursor:pointer'
b.onclick=()=>{try{if(typeof f==='function')f()}catch(x){g.log('error',String(x))}}
bx.appendChild(b)
},(a)=>`vue.button(${a[0]},()=>{\n${a[1]}});\n`)
D('clearButtons','UI','stmt','Any','remove all buttons',[],'():void','Removes the buttons added with addButton.',(g)=>()=>{if(g.uiBox){g.uiBox.remove();g.uiBox=null}})
D('menu','UI','val','Any','ask %1 with choices %2',[Tx('T','Pause'),An('L','list')],'(title:string,choices:string[]):Promise<string>','Shows a menu and gives back the choice that was clicked.',(g)=>(t,l)=>new Promise(res=>{
const doc=root.document,host=g.canvas&&g.canvas.parentElement
const list=Array.isArray(l)?l.map(String):[]
if(!doc||!host||!list.length){res(list[0]||'');return}
const o=doc.createElement('div')
o.style.cssText='position:fixed;inset:0;display:grid;place-items:center;background:rgba(0,0,0,.55);z-index:6'
const p=doc.createElement('div')
p.style.cssText='background:#222;color:#fff;padding:20px;border-radius:6px;display:flex;flex-direction:column;gap:8px;min-width:220px;font:16px sans-serif'
const h=doc.createElement('b');h.textContent=String(t);p.appendChild(h)
for(const c of list){const b=doc.createElement('button');b.textContent=c;b.style.cssText='padding:8px;font:inherit;background:#111;border:1px solid #888;color:#fff;border:0;border-radius:4px;cursor:pointer';b.onclick=()=>{o.remove();res(c)};p.appendChild(b)}
o.appendChild(p);host.appendChild(o)
}),(a)=>`(await vue.menu(${a[0]},${a[1]}))`)
D('floatText','UI','stmt','Any','%1 says %2 for %3 s',[En('E'),Tx('T','Nice!'),N('S',1.5)],'(e:Entity|string,text:string,seconds?:number):void','Shows a speech bubble over an object.',(g)=>(e,t,s)=>{e=g.vue.find(e)||e;if(e)e.say(t,s)})
D('fadeMusic','Audio','stmt','Any','fade out music over %1 s',[N('S',2)],'(seconds:number):Promise<void>','Slowly turns the music down, then stops it.',(g,api)=>async s=>{const v=g.vol,n=Math.max(1,Math.floor(num(s)*60));for(let i=1;i<=n;i++){await api.frame();if(g.master)g.master.gain.value=v*(1-i/n)}g.stopMusic();if(g.master)g.master.gain.value=v})
D('mute','Audio','stmt','Any','mute sound %1',[Bo('M',true)],'(muted:boolean):void','Turns all sound off or on.',(g)=>m=>{if(g.master)g.master.gain.value=m===true?0:g.vol})
D('playRandom','Audio','stmt','Any','play a random sound from %1',[An('L','list')],'(names:string[],volume?:number):void','Plays one sound picked from a list.',(g)=>(l,v)=>{if(Array.isArray(l)&&l.length)g.sfx(String(l[Math.floor(Math.random()*l.length)]),v)})
D('playPitched','Audio','stmt','Any','play sound %1 at speed %2',[Tx('N','sound.wav'),N('R',1)],'(name:string,rate:number):void','Plays a sound higher or lower.',(g)=>(n,r)=>g.sfx(String(n),1,false,clampN(num(r),0.1,4)))
const store=g=>{
let ls=null
try{ls=root.localStorage}catch(e){}
const pre='vue.save.'+((g.project&&g.project.name)||'game')+'.'
g.mem=g.mem||{}
return{pre,get:k=>{try{if(ls)return ls.getItem(pre+k)}catch(e){}return g.mem[pre+k]===undefined?null:g.mem[pre+k]},set:(k,v)=>{try{if(ls){ls.setItem(pre+k,v);return}}catch(e){}g.mem[pre+k]=v},del:k=>{try{if(ls)ls.removeItem(pre+k)}catch(e){}delete g.mem[pre+k]},keys:()=>{const o=[];try{if(ls)for(let i=0;i<ls.length;i++){const k=ls.key(i);if(k.indexOf(pre)===0)o.push(k.slice(pre.length))}}catch(e){}for(const k in g.mem)if(k.indexOf(pre)===0&&!o.includes(k.slice(pre.length)))o.push(k.slice(pre.length));return o}}
}
D('save','Save','stmt','Any','save %2 as %1',[Tx('K','score'),An('V',0)],'(key:string,value:any):void','Remembers a value, even after the game closes.',(g)=>(k,v)=>store(g).set(String(k),JSON.stringify(v)))
D('load','Save','val','Any','saved value %1 or %2 if none',[Tx('K','score'),An('D',0)],'(key:string,fallback?:any):any','Reads a value remembered earlier.',(g)=>(k,d)=>{const r=store(g).get(String(k));if(r===null)return d;try{return JSON.parse(r)}catch(e){return d}})
D('hasSave','Save','val','Boolean','is %1 saved',[Tx('K','score')],'(key:string):boolean','True when something was saved with that name.',(g)=>k=>store(g).get(String(k))!==null)
D('deleteSave','Save','stmt','Any','forget saved %1',[Tx('K','score')],'(key:string):void','Deletes one saved value.',(g)=>k=>store(g).del(String(k)))
D('clearSaves','Save','stmt','Any','forget everything saved',[],'():void','Deletes every saved value of this game.',(g)=>()=>{const s=store(g);for(const k of s.keys())s.del(k)})
const cols=['#ff5555','#ffd34d','#4ade80','#4cc9f0','#a78bfa','#f472b6']
D('confetti','Effects','stmt','Any','confetti at x %1 y %2',[N('X',0),N('Y',0)],'(x:number,y:number):void','A shower of colored bits.',(g)=>(x,y)=>{for(const c of cols)g.burst(num(x),num(y),c,6)})
D('explosion','Effects','stmt','Any','explosion at x %1 y %2',[N('X',0),N('Y',0)],'(x:number,y:number):void','A fiery burst.',(g)=>(x,y)=>{g.burst(num(x),num(y),'#ff9f43',18);g.burst(num(x),num(y),'#ffd34d',12);g.burst(num(x),num(y),'#ff5555',10)})
D('sparkle','Effects','stmt','Any','sparkle on %1',[En('E')],'(e:Entity|string):void','Little bright bits around an object.',(g)=>e=>{e=g.vue.find(e)||e;if(e){g.burst(e.x,e.y,'#ffffff',8);g.burst(e.x,e.y,'#ffd34d',6)}})
D('smoke','Effects','stmt','Any','smoke at x %1 y %2',[N('X',0),N('Y',0)],'(x:number,y:number):void','Puffs of gray smoke.',(g)=>(x,y)=>{g.burst(num(x),num(y),'#8a8f98',10);g.burst(num(x),num(y),'#555a63',8)})
const box=(e,g)=>({x0:e.x-e.w/2,x1:e.x+e.w/2,y0:e.y-e.h/2,y1:e.y+e.h/2,z0:g.is3d?e.z-e.d/2:-1,z1:g.is3d?e.z+e.d/2:1})
function ray(g,ox,oy,oz,dx,dy,dz,max,ok,skip){
const l=Math.hypot(dx,dy,dz)
if(!l)return null
dx/=l;dy/=l;dz/=l
let best=null
for(const e of g.entities){
if(!e.alive||e===skip||!ok(e))continue
const b=box(e,g)
let t0=0,t1=max
for(const[o,d,a,c]of[[ox,dx,b.x0,b.x1],[oy,dy,b.y0,b.y1],[g.is3d?oz:0,g.is3d?dz:0,b.z0,b.z1]]){
if(Math.abs(d)<1e-9){if(o<a||o>c){t1=-1;break}}
else{let p=(a-o)/d,q=(c-o)/d;if(p>q){const s=p;p=q;q=s}t0=Math.max(t0,p);t1=Math.min(t1,q);if(t0>t1)break}
}
if(t1>=t0&&t1>=0&&(!best||t0<best.dist))best={entity:e,dist:t0,x:ox+dx*t0,y:oy+dy*t0,z:oz+dz*t0}
}
return best
}
D('raycast','Raycast','val','Any','first thing hit from x %1 y %2 going x %3 y %4 within %5',[N('X',0),N('Y',0),N('DX',1),N('DY',0),N('M',500)],'(x:number,y:number,dx:number,dy:number,max?:number,tag?:string,z?:number,dz?:number):{entity:Entity;dist:number;x:number;y:number;z:number}|null','Shoots an invisible line and tells what it hits first.',(g)=>(x,y,dx,dy,m,tag,z,dz)=>ray(g,num(x),num(y),num(z),num(dx),num(dy),num(dz),m==null?1e6:num(m),e=>!tag||e.hasTag(String(tag))))
D('lineOfSight','Raycast','val','Boolean','%1 can see %2',[En('A'),En('B')],'(from:Entity|string,to:Entity|string):boolean','True when no solid object is between two objects.',(g)=>(a,b)=>{a=g.vue.find(a)||a;b=g.vue.find(b)||b;if(!a||!b)return false;const dx=b.x-a.x,dy=b.y-a.y,dz=g.is3d?b.z-a.z:0,d=Math.hypot(dx,dy,dz);const h=ray(g,a.x,a.y,a.z,dx,dy,dz,d,e=>e.body==='static'&&e!==a&&e!==b);return!h||h.dist>=d-1e-6})
D('entitiesAt','Raycast','val','Array','objects at x %1 y %2',[N('X',0),N('Y',0)],'(x:number,y:number,z?:number):Entity[]','Every object that covers a point.',(g)=>(x,y,z)=>g.entities.filter(e=>{if(!e.alive)return false;const b=box(e,g);return num(x)>=b.x0&&num(x)<=b.x1&&num(y)>=b.y0&&num(y)<=b.y1&&(!g.is3d||num(z)>=b.z0&&num(z)<=b.z1)}))
D('overlapping','Raycast','val','Array','objects with tag %2 touching %1',[En('E'),Tx('T','enemy')],'(e:Entity|string,tag?:string):Entity[]','Objects touching this one, optionally with a tag.',(g)=>(e,t)=>{e=g.vue.find(e)||e;return e?g.entities.filter(o=>o.alive&&o!==e&&(!t||o.hasTag(String(t)))&&e.overlaps(o,0)):[]})
D('spawnMany','Spawning','stmt','Any','spawn %2 of %1 around x %3 y %4 spread %5',[Tx('P','Prefab'),N('N',5),N('X',0),N('Y',0),N('R',100)],'(prefab:string,count:number,x:number,y:number,spread?:number):Entity[]','Creates several copies of a prefab.',(g,api)=>(p,n,x,y,r)=>{const o=[];n=clampN(Math.floor(num(n)),0,500);for(let i=0;i<n;i++){const a=Math.random()*Math.PI*2,k=Math.random()*num(r);const e=g.is3d?api.spawn(p,num(x)+Math.cos(a)*k,num(y),num(0)+Math.sin(a)*k):api.spawn(p,num(x)+Math.cos(a)*k,num(y)+Math.sin(a)*k);if(e)o.push(e)}return o})
D('spawnAround','Spawning','stmt','Any','spawn %2 of %1 in a ring around %3',[Tx('P','Prefab'),N('N',6),En('E')],'(prefab:string,count:number,center:Entity|string,radius?:number):Entity[]','Creates copies in a circle around an object.',(g,api)=>(p,n,c,r)=>{c=g.vue.find(c)||c;const o=[];if(!c)return o;n=clampN(Math.floor(num(n)),0,500);r=r==null?(g.is3d?3:80):num(r);for(let i=0;i<n;i++){const a=i/Math.max(1,n)*Math.PI*2;const e=g.is3d?api.spawn(p,c.x+Math.cos(a)*r,c.y,c.z+Math.sin(a)*r):api.spawn(p,c.x+Math.cos(a)*r,c.y+Math.sin(a)*r);if(e)o.push(e)}return o})
D('spawnAt','Spawning','stmt','Any','spawn %1 at %2',[Tx('P','Prefab'),En('E')],'(prefab:string,at:Entity|string):Entity|null','Creates a copy of a prefab on top of an object.',(g,api)=>(p,e)=>{e=g.vue.find(e)||e;return e?api.spawn(p,e.x,e.y,g.is3d?e.z:undefined):null})
D('destroyAll','Spawning','stmt','Any','destroy everything with tag %1',[Tx('T','enemy')],'(tag:string):number','Removes every object with a tag and tells how many.',(g)=>t=>{let n=0;for(const e of g.entities.slice())if(e.alive&&e.hasTag(String(t))){e.destroy();n++}return n})
const pairs=(g,a,b)=>{const x=[],y=[];for(const e of g.entities)if(e.alive){if(e.hasTag(a))x.push(e);if(e.hasTag(b))y.push(e)}return[x,y]}
const watch=(g,a,b,f,end)=>{
a=String(a);b=String(b)
const on=new Set()
g.ticks.push(()=>{
const[x,y]=pairs(g,a,b),now=new Set()
for(const p of x)for(const q of y)if(p!==q&&p.overlaps(q,0)){const k=p.id+'|'+q.id;now.add(k);if(!end&&!on.has(k)){try{f(p,q)}catch(e){g.log('error',String(e))}}}
if(end)for(const k of on)if(!now.has(k)){const[i,j]=k.split('|');const p=g.entities.find(e=>e.id===i),q=g.entities.find(e=>e.id===j);if(p&&q)try{f(p,q)}catch(e){g.log('error',String(e))}}
on.clear();for(const k of now)on.add(k)
})
}
D('onTouch','Collisions','stmt','Any','when something tagged %1 touches something tagged %2 run %3',[Tx('A','player'),Tx('B','coin'),['F','fn']],'(tagA:string,tagB:string,handler:(a:Entity,b:Entity)=>void):void','Runs when two kinds of objects start touching.',(g)=>(a,b,f)=>watch(g,a,b,f,false),(a)=>`vue.onTouch(${a[0]},${a[1]},(a,b)=>{\n${a[2]}});\n`)
D('onTouchEnd','Collisions','stmt','Any','when something tagged %1 stops touching something tagged %2 run %3',[Tx('A','player'),Tx('B','coin'),['F','fn']],'(tagA:string,tagB:string,handler:(a:Entity,b:Entity)=>void):void','Runs when two kinds of objects stop touching.',(g)=>(a,b,f)=>watch(g,a,b,f,true),(a)=>`vue.onTouchEnd(${a[0]},${a[1]},(a,b)=>{\n${a[2]}});\n`)
function install(g,api){
for(const d of LIST){if(d.n in api)throw new Error('vue.'+d.n+' already exists');api[d.n]=d.impl(g,api)}
}
const sigs=()=>LIST.map(d=>`/** ${d.doc} */\n${d.n}${d.sig};`).join('\n')
const dts='declare interface Vec{x:number;y:number;z:number}\n'
const api={LIST,install,sigs,dts}
if(typeof module!=='undefined'&&module.exports)module.exports=api
else root.VueLib=api
})(typeof window!=='undefined'?window:globalThis);
