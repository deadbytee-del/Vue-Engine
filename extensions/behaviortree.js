VueExt.register({id:'behaviortree',name:'Behavior Trees',ns:'bt',cat:'AI',icon:'git-branch',version:'1.0.0',example:"const B = vue.bt\nexport function start() {\nB.run(self, B.sel(\nB.seq(B.cond(e => vue.dist(e, 'Player') < 200), B.act(e => { e.vx = (vue.find('Player').x - e.x) > 0 ? 160 : -160; return 'running' })),\nB.seq(B.act(e => { e.vx = 0 }), B.wait(1))\n))\n}",desc:'Structured enemy and NPC brains: sequences, selectors, conditions, actions, waits, repeats, inverters and parallel nodes with a per-entity blackboard. Trees tick every frame and keep running actions across frames.',defaults:{},
api(g,c,s){
s.run=new Map()
const S='success',F='failure',RU='running'
const node=(kind,o)=>Object.assign({kind,id:Math.random().toString(36).slice(2)},o)
const res=v=>v===false?F:v===RU||v==='run'?RU:v===F?F:S
const tick=(n,e,bb,mem,dt)=>{
const m=mem.get(n.id)||{};mem.set(n.id,m)
switch(n.kind){
case'seq':{let i=m.i||0;for(;i<n.kids.length;i++){const r=tick(n.kids[i],e,bb,mem,dt);if(r===RU){m.i=i;return RU}if(r===F){m.i=0;return F}}m.i=0;return S}
case'sel':{let i=m.i||0;for(;i<n.kids.length;i++){const r=tick(n.kids[i],e,bb,mem,dt);if(r===RU){m.i=i;return RU}if(r===S){m.i=0;return S}}m.i=0;return F}
case'par':{let ok=0,bad=0;for(const k of n.kids){const r=tick(k,e,bb,mem,dt);if(r===S)ok++;else if(r===F)bad++}if(bad>=(n.fail||1))return F;if(ok>=(n.need||n.kids.length))return S;return RU}
case'cond':return n.fn(e,bb,g.vue)?S:F
case'act':return res(n.fn(e,bb,dt,g.vue))
case'wait':{m.t=(m.t==null?+n.s:m.t)-dt;if(m.t<=0){m.t=null;return S}return RU}
case'inv':{const r=tick(n.kid,e,bb,mem,dt);return r===RU?RU:r===S?F:S}
case'rep':{m.n=m.n||0;const r=tick(n.kid,e,bb,mem,dt);if(r===RU)return RU;m.n++;if(n.times&&m.n>=n.times){m.n=0;return S}return RU}
case'cool':{if(m.u&&g.time<m.u)return F;const r=tick(n.kid,e,bb,mem,dt);if(r!==RU)m.u=g.time+(+n.s);return r}
case'chance':return Math.random()<+n.p?tick(n.kid,e,bb,mem,dt):F
}
return F
}
s.tick=tick
const ent=e=>typeof e==='string'?g.vue.find(e):e
return{
seq:(...k)=>node('seq',{kids:k.flat()}),
sel:(...k)=>node('sel',{kids:k.flat()}),
parallel:(need,...k)=>node('par',{need,kids:k.flat()}),
cond:fn=>node('cond',{fn}),
act:fn=>node('act',{fn}),
wait:s2=>node('wait',{s:s2}),
invert:k=>node('inv',{kid:k}),
repeat:(times,k)=>k?node('rep',{times,kid:k}):node('rep',{times:0,kid:times}),
cooldown:(s2,k)=>node('cool',{s:s2,kid:k}),
chance:(p,k)=>node('chance',{p,kid:k}),
run:(e,tree,bb)=>{e=ent(e);if(!e)return null;const r={tree,bb:bb||{},mem:new Map(),status:RU};s.run.set(e,r);return r.bb},
stop:e=>{s.run.delete(ent(e))},
status:e=>{const r=s.run.get(ent(e));return r?r.status:''},
blackboard:e=>{const r=s.run.get(ent(e));return r?r.bb:null}
}
},
update(g,c,s,dt){
for(const[e,r]of s.run){if(!e.alive){s.run.delete(e);continue}r.status=s.tick(r.tree,e,r.bb,r.mem,dt);if(r.status!=='running'&&!r.tree.keep)r.mem.clear()}
},
scene(g,c,s){s.run.clear()}
})
