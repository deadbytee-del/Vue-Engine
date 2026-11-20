VueExt.register({id:'destruct',name:'Destructible World',ns:'destruct',cat:'World',icon:'bomb',version:'1.0.0',example:"export function click() {\nvue.destruct.explode(self.x, self.y, 120)\n}\nexport function collide(other: any) {\nif (other.hasTag('bullet')) vue.destruct.shatter(self, { pieces: 12 })\n}",desc:'Break things apart. Shatter any entity into physical debris, blast craters into solid tilemaps, and push nearby bodies away from explosions. Anything tagged "breakable" caught in a blast shatters too.',defaults:{life:2.2,debris:true},
api(g,c,s){
s.deb=[]
const ent=e=>typeof e==='string'?g.vue.find(e):e
const shatter=(e,o)=>{
e=ent(e);if(!e||!e.alive)return[]
o=Object.assign({pieces:8,force:g.is3d?6:260},o||{})
const n=Math.max(2,Math.min(64,o.pieces|0)),out=[],d3=g.is3d
const cols=Math.ceil(Math.sqrt(n)),rows=Math.ceil(n/cols),pw=e.w/cols,ph=e.h/rows
for(let i=0;i<cols;i++)for(let j=0;j<rows;j++){
if(out.length>=n)break
const x=e.x-e.w/2+pw*(i+0.5),y=d3?e.y-e.h/2+ph*(j+0.5):e.y-e.h/2+ph*(j+0.5)
const k=g.add({name:'Debris',x,y,z:e.z,w:pw*0.9,h:ph*0.9,d:d3?(e.d||1)*0.5:pw,shape:d3?'box':'rect',color:e.color,image:'',body:'dynamic',gravityScale:1,alpha:e.alpha,tags:['debris']})
const ang=Math.atan2(y-e.y,x-e.x)+(Math.random()-0.5)*0.8,f=o.force*(0.6+Math.random()*0.8)
k.vx=Math.cos(ang)*f+(e.vx||0);k.vy=d3?Math.abs(Math.sin(ang))*f+f*0.5:Math.sin(ang)*f-f*0.6
if(d3)k.vz=(Math.random()-0.5)*f
k.rot=Math.random()*360
s.deb.push({e:k,t:c.life*(0.7+Math.random()*0.6),spin:(Math.random()-0.5)*720})
out.push(k)
}
if(g.vue.fx)g.vue.fx.burst(e.x,e.y,e.z,'dust');else if(!d3)g.burst(e.x,e.y,e.color,12)
g.destroy(e)
return out
}
return{
shatter,
explode:(x,y,z,radius,o)=>{
if(typeof radius!=='number'){o=radius;radius=z;z=0}
radius=+radius||(g.is3d?3:96);o=Object.assign({force:g.is3d?14:600,tiles:true},o||{})
const d3=g.is3d
if(!d3&&o.tiles)for(const m of g.tms||[]){if(!m.alive||!m.solid)continue;const c0=m.cellAt(x-radius,y-radius),c1=m.cellAt(x+radius,y+radius);for(let cx=c0[0];cx<=c1[0];cx++)for(let cy=c0[1];cy<=c1[1];cy++){const tx=m.x+(cx+0.5)*m.cell,ty=m.y+(cy+0.5)*m.cell;if(Math.hypot(tx-x,ty-y)>radius)continue;const t=m.getTile(cx,cy);if(t<0)continue;m.setTile(cx,cy,-1);if(c.debris&&Math.random()<0.5){const k=g.add({name:'Debris',x:tx,y:ty,w:m.cell*0.4,h:m.cell*0.4,shape:'rect',color:'#7a6a55',body:'dynamic',tags:['debris']});const a=Math.atan2(ty-y,tx-x);k.vx=Math.cos(a)*o.force*0.6;k.vy=Math.sin(a)*o.force*0.6-200;s.deb.push({e:k,t:c.life,spin:(Math.random()-0.5)*600})}}}
for(const e of g.entities.slice()){
if(!e.alive||e.tags.indexOf('debris')>=0)continue
const dist=Math.hypot(e.x-x,e.y-y,d3?e.z-z:0)
if(dist>radius)continue
if(e.tags.indexOf('breakable')>=0){shatter(e,{force:o.force*0.6});continue}
if(e.body==='dynamic'){const k=(1-dist/radius)*o.force,dd=dist||1;e.vx+=(e.x-x)/dd*k;e.vy+=d3?Math.abs((e.y-y)/dd*k)+k*0.4:(e.y-y)/dd*k-k*0.3;if(d3)e.vz+=(e.z-z)/dd*k}
}
if(g.vue.fx)g.vue.fx.burst(x,y,z,'explosion');else if(!d3)g.burst(x,y,'#ffb347',40)
g.shakeA=Math.max(g.shakeA||0,d3?0:10);g.shakeT=0.35
g.fireAll('msg:explosion',{x,y,z,radius})
}
}
},
update(g,c,s,dt){
for(let i=s.deb.length-1;i>=0;i--){const d=s.deb[i];d.t-=dt;if(!d.e.alive){s.deb.splice(i,1);continue}d.e.rot+=d.spin*dt;if(g.is3d){d.e.rx+=d.spin*dt;d.e.rz+=d.spin*dt*0.7}if(d.t<0.5)d.e.alpha=Math.max(0,d.t/0.5);if(d.t<=0){g.destroy(d.e);s.deb.splice(i,1)}}
},
scene(g,c,s){s.deb=[]}
})
