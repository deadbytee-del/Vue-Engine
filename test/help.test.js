const assert=require('assert')
const path=require('path')
const src=p=>require(path.join(__dirname,'..','src',p))
const {Game}=src('runtime.js')
const H=src('help.js')
const BH=src('behaviors.js')
const ctx=new Proxy({},{get:(t,k)=>k==='measureText'?()=>({width:10}):()=>{},set:()=>true})
const canvas={getContext:()=>ctx,width:0,height:0,addEventListener(){},removeEventListener(){},getBoundingClientRect:()=>({left:0,top:0,width:320,height:180})}
for(const n of BH.NAMES){
const m=H.miniProject(n)
const g=new Game({canvas,project:m.project,scripts:m.scripts})
const errs=[]
g.log=(l,t)=>{if(l==='error')errs.push(t)}
g.loadScene('s1')
g.startAll()
for(let i=0;i<150;i++)g.update(1/60)
assert.deepStrictEqual(errs,[],n+' example runs clean')
assert.ok(g.entities.length>=1,n+' example has objects')
}
const ball=H.miniProject('Ball')
const gb=new Game({canvas,project:ball.project,scripts:ball.scripts})
gb.loadScene('s1');gb.startAll()
let low=1e9
for(let i=0;i<200;i++){gb.update(1/60);low=Math.min(low,gb.vue.find('Subject').vy)}
assert.ok(low<0||gb.vue.find('Subject').y<80,'ball example moves')
assert.ok(/spelling/.test(H.plainError('speeed is not defined')))
assert.ok(/empty/.test(H.plainError("Cannot read properties of null (reading 'x')")))
assert.ok(/not one|spelling/.test(H.plainError('self.fly is not a function')))
assert.strictEqual(H.plainError('something odd'),'')
for(const k of['scene','object','physics','script','events','blocks','code'])assert.ok(H.TOPICS[k].text&&H.TOPICS[k].steps.length)
console.log('help tests passed')
