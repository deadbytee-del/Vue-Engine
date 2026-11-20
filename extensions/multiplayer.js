VueExt.register({id:'multiplayer',name:'Multiplayer',ns:'net',cat:'Networking',icon:'globe',version:'1.0.0',example:"export async function start() {\nconst code = await vue.net.host()\nvue.hud('Room', code)\nvue.net.replicate(self)\nvue.net.on('chat', (msg, from) => vue.log(from, msg))\n}",desc:'Online multiplayer over peer-to-peer WebRTC with no server to run. Host a room, share the 5-letter code, and friends join from any browser. Includes messages, shared state, join and leave events and automatic entity replication with smoothing.',defaults:{rate:20,smooth:14,prefix:'vue-'},
api(g,c,s){
s.conns=new Map();s.peers=new Set();s.h=new Map();s.rep=new Map();s.remote=new Map();s.state={};s.n=0;s.acc=0
const lib=()=>s.lp||(s.lp=new Promise((res,rej)=>{if(globalThis.Peer)return res(globalThis.Peer);const d=globalThis.document;if(!d)return rej(new Error('no document'));const sc=d.createElement('script');sc.src='https://cdn.jsdelivr.net/npm/peerjs@1.5.5/dist/peerjs.min.js';sc.onload=()=>res(globalThis.Peer);sc.onerror=()=>rej(new Error('Could not load networking library'));d.head.appendChild(sc)}))
const fire=(t,d,from)=>{const L=s.h.get(t);if(L)for(const f of L)try{f(d,from)}catch(x){g.err(x)}g.fireAll('msg:net:'+t,d)}
const sendTo=(conn,m)=>{try{if(conn.open)conn.send(m)}catch(x){}}
const bcast=(m,except)=>{for(const[id,cn]of s.conns)if(id!==except)sendTo(cn,m)}
const recv=(m,from)=>{
if(!m||typeof m!=='object')return
if(s.isHost&&m.f!==s.id)bcast(m,from)
if(m.t==='$r')return applyRep(m)
if(m.t==='$x'){for(const id of m.d){const e=s.remote.get(id);if(e){g.destroy(e);s.remote.delete(id)}}return}
if(m.t==='$s'){if(s.isHost&&m.req){s.state[m.d[0]]=m.d[1];bcast({t:'$s',d:m.d,f:s.id});fire('state',{key:m.d[0],value:m.d[1]})}else if(!m.req){s.state[m.d[0]]=m.d[1];fire('state',{key:m.d[0],value:m.d[1]})}return}
if(m.t==='$S'){Object.assign(s.state,m.d);return}
if(m.t==='$P'){for(const p of m.d)if(p!==s.id)s.peers.add(p);return}
if(m.t==='$j'){s.peers.add(m.d);fire('join',m.d);return}
if(m.t==='$l'){s.peers.delete(m.d);drop(m.d);fire('leave',m.d);return}
fire(m.t,m.d,m.f)
}
const drop=pid=>{for(const[id,e]of s.remote)if(id.split(':')[0]===pid){g.destroy(e);s.remote.delete(id)}}
const applyRep=m=>{
for(const r of m.d){
const[id,pf,x,y,z,rot,ry,an,fx,w,h,col,al]=r
let e=s.remote.get(id)
if(!e||!e.alive){
e=pf&&g.prefabs[pf]?g.spawn(pf,x,y,g.is3d?z:undefined):g.add({name:'Remote',x,y,z,w:w||32,h:h||32,d:w||1,color:col||'#ffffff',shape:g.is3d?'box':'rect'})
if(!e)continue
e.body='none';e.remote=true;e.netId=id;e.tags.push('remote')
s.remote.set(id,e)
}
e.nt=[x,y,z,rot,ry];if(an&&e.animation!==an&&e.play)e.play(an);e.flipX=!!fx;if(col)e.color=col;if(al!=null)e.alpha=al
}
}
const wire=(conn)=>{
conn.on('data',m=>recv(m,conn.peer))
conn.on('close',()=>{s.conns.delete(conn.peer);s.peers.delete(conn.peer);drop(conn.peer);if(s.isHost)bcast({t:'$l',d:conn.peer,f:s.id});fire('leave',conn.peer);if(!s.isHost){s.ok=false;fire('disconnect',conn.peer)}})
}
const mk=async id=>{const P=await lib();return new Promise((res,rej)=>{const p=id?new P(id):new P();p.on('open',i=>{s.id=i;res(p)});p.on('error',e=>{g.log('warn','Network: '+(e&&e.type||e));rej(e)})})}
const code=()=>{const a='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';let r='';for(let i=0;i<5;i++)r+=a[(Math.random()*a.length)|0];return r}
return{
host:async want=>{
s.isHost=true;s.code=String(want||code()).toUpperCase()
s.peer=await mk(c.prefix+s.code)
s.ok=true
s.peer.on('connection',conn=>{conn.on('open',()=>{s.conns.set(conn.peer,conn);s.peers.add(conn.peer);wire(conn);sendTo(conn,{t:'$S',d:s.state,f:s.id});sendTo(conn,{t:'$P',d:Array.from(s.peers),f:s.id});bcast({t:'$j',d:conn.peer,f:s.id},conn.peer);fire('join',conn.peer)})})
return s.code
},
join:async cd=>{
s.isHost=false;s.code=String(cd).toUpperCase()
s.peer=await mk()
const conn=s.peer.connect(c.prefix+s.code,{reliable:true})
await new Promise((res,rej)=>{conn.on('open',res);conn.on('error',rej);setTimeout(()=>rej(new Error('Room not found')),10000)})
s.conns.set(conn.peer,conn);s.peers.add(conn.peer);wire(conn);s.ok=true
return true
},
leave:()=>{if(s.rep.size)bcast({t:'$x',d:Array.from(s.rep.values()).map(r=>r.id),f:s.id});for(const cn of s.conns.values())try{cn.close()}catch(x){}s.conns.clear();if(s.peer)s.peer.destroy();s.peer=null;s.ok=false;for(const e of s.remote.values())g.destroy(e);s.remote.clear()},
send:(t,d)=>{const m={t:String(t),d,f:s.id};if(s.isHost)bcast(m);else for(const cn of s.conns.values())sendTo(cn,m)},
on:(t,fn)=>{const k=String(t);if(!s.h.has(k))s.h.set(k,[]);s.h.get(k).push(fn)},
replicate:(e,o)=>{e=typeof e==='string'?g.vue.find(e):e;if(!e)return;s.rep.set(e,{id:(s.id||'local')+':'+(++s.n),pf:(o&&o.prefab)||''})},
get:k=>s.state[k],
set:(k,v)=>{s.state[k]=v;const m={t:'$s',d:[k,v],f:s.id};if(s.isHost)bcast(m);else{m.req=1;for(const cn of s.conns.values())sendTo(cn,m)}},
get id(){return s.id||''},
get code(){return s.code||''},
get isHost(){return!!s.isHost},
get connected(){return!!s.ok},
get players(){return[s.id].concat(Array.from(s.peers)).filter(Boolean)},
get _s(){return s}
}
},
update(g,c,s,dt){
for(const e of s.remote.values()){if(!e.alive||!e.nt)continue;const k=Math.min(1,dt*c.smooth),t=e.nt;e.x+=(t[0]-e.x)*k;e.y+=(t[1]-e.y)*k;if(g.is3d){e.z+=(t[2]-e.z)*k;e.ry=t[4]}else e.rot=t[3]}
if(!s.ok||!s.rep.size)return
s.acc+=dt
if(s.acc<1/c.rate)return
s.acc=0
const d=[],gone=[]
for(const[e,r]of s.rep){if(r.id.startsWith('local:'))r.id=s.id+':'+r.id.split(':')[1];if(!e.alive){gone.push(r.id);s.rep.delete(e);continue}d.push([r.id,r.pf,+e.x.toFixed(3),+e.y.toFixed(3),+(e.z||0).toFixed(3),Math.round(e.rot||0),Math.round(e.ry||0),e.animation||'',e.flipX?1:0,e.w,e.h,e.color,e.alpha])}
const send=m=>{if(s.isHost){for(const cn of s.conns.values())try{if(cn.open)cn.send(m)}catch(x){}}else for(const cn of s.conns.values())try{if(cn.open)cn.send(m)}catch(x){}}
if(d.length)send({t:'$r',d,f:s.id})
if(gone.length)send({t:'$x',d:gone,f:s.id})
}
})
