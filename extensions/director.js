VueExt.register({id:'director',name:'AI Director',ns:'director',cat:'AI',icon:'activity',version:'1.0.0',example:"export function start() {\nvue.director.spawner('Zombie', { max: 12, tag: 'zombie', around: 'Player' })\nvue.director.onPhase(p => vue.hud('Threat', p))\n}\nexport function collide(other: any) {\nif (other.hasTag('zombie')) vue.director.stress(15)\n}",desc:'Paces your game like a horror or horde director. Tracks player stress, cycles calm, build-up, peak and relief phases, and spawns enemies off screen at the right moments so fights never feel flat or overwhelming.',defaults:{calm:18,build:22,peak:10,relax:12,decay:6,peakAt:70,max:100},
api(g,c,s){
s.ph='calm';s.t=0;s.i=0;s.sp=[];s.cb=[]
return{
get phase(){return s.ph},
get intensity(){return s.i},
stress:v=>{s.i=Math.min(c.max,s.i+(+v||0))},
calm:()=>{set(g,c,s,'relax')},
force:p=>{set(g,c,s,p)},
onPhase:fn=>{s.cb.push(fn)},
spawner:(prefab,o)=>{const h=Object.assign({prefab,max:8,radius:g.is3d?18:520,min:g.is3d?10:360,around:null,tag:'',rate:{calm:0.05,build:0.35,peak:1,relax:0},acc:0},o||{});s.sp.push(h);return h}
}
function set(g,c,s,p){if(s.ph===p)return;s.ph=p;s.t=0;for(const f of s.cb)try{f(p)}catch(x){g.err(x)}g.fireAll('msg:director',p)}
},
update(g,c,s,dt){
s.t+=dt
s.i=Math.max(0,s.i-c.decay*dt*(s.ph==='peak'?0.3:1))
const go=p=>{if(s.ph===p)return;s.ph=p;s.t=0;for(const f of s.cb)try{f(p)}catch(x){g.err(x)}g.fireAll('msg:director',p)}
if(s.ph==='calm'&&s.t>c.calm)go('build')
else if(s.ph==='build'&&(s.t>c.build||s.i>=c.peakAt))go('peak')
else if(s.ph==='peak'&&(s.t>c.peak||s.i>=c.max*0.98))go('relax')
else if(s.ph==='relax'&&s.t>c.relax&&s.i<c.peakAt*0.4)go('calm')
for(const h of s.sp){
const rate=(h.rate[s.ph]||0)*(s.ph==='build'?0.4+0.6*Math.min(1,s.t/c.build):1)
h.acc+=rate*dt
if(h.acc<1)continue
h.acc=0
const tag=h.tag||h.prefab
if(g.vue.count(tag)>=h.max&&h.tag)continue
const a=typeof h.around==='string'?g.vue.find(h.around):h.around||g.camera.follow
const cx=a?a.x:g.camera.x,cy=a?(g.is3d?a.z:a.y):g.camera.y
let x,y,tries=0
do{const ang=Math.random()*Math.PI*2,r=h.min+Math.random()*(h.radius-h.min);x=cx+Math.cos(ang)*r;y=cy+Math.sin(ang)*r;tries++}while(!g.is3d&&tries<8&&Math.abs(x-g.camera.x)<g.w/2/g.camera.zoom&&Math.abs(y-g.camera.y)<g.h/2/g.camera.zoom)
const e=g.is3d?g.vue.spawn(h.prefab,x,a?a.y+1:2,y):g.vue.spawn(h.prefab,x,y)
if(e&&h.tag&&e.tags.indexOf(h.tag)<0)e.tags.push(h.tag)
}
}
})
