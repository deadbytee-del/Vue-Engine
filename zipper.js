const fs=require('fs')
const path=require('path')
const zlib=require('zlib')
const CRC=(()=>{const t=new Uint32Array(256);for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xedb88320^(c>>>1):c>>>1;t[n]=c>>>0}return t})()
function crc32(b){let c=0xffffffff;for(let i=0;i<b.length;i++)c=CRC[(c^b[i])&255]^(c>>>8);return(c^0xffffffff)>>>0}
async function zip(entries,out,onp){
const fd=fs.openSync(out,'w')
let off=0
const cen=[]
const w=b=>{fs.writeSync(fd,b);off+=b.length}
let i=0
for(const en of entries){
const data=en.data||fs.readFileSync(en.src)
const name=Buffer.from(en.name.replace(/\\/g,'/'),'utf8')
const crc=crc32(data)
const comp=await new Promise((res,rej)=>zlib.deflateRaw(data,{level:6},(e,r)=>e?rej(e):res(r)))
const useDef=comp.length<data.length
const body=useDef?comp:data
const d=new Date(),dt=((d.getFullYear()-1980)<<9)|((d.getMonth()+1)<<5)|d.getDate(),tm=(d.getHours()<<11)|(d.getMinutes()<<5)|(d.getSeconds()>>1)
const h=Buffer.alloc(30)
h.writeUInt32LE(0x04034b50,0);h.writeUInt16LE(20,4);h.writeUInt16LE(0x0800,6);h.writeUInt16LE(useDef?8:0,8);h.writeUInt16LE(tm,10);h.writeUInt16LE(dt,12);h.writeUInt32LE(crc,14);h.writeUInt32LE(body.length,18);h.writeUInt32LE(data.length,22);h.writeUInt16LE(name.length,26);h.writeUInt16LE(0,28)
const at=off
w(h);w(name);w(body)
const c=Buffer.alloc(46)
c.writeUInt32LE(0x02014b50,0);c.writeUInt16LE(20,4);c.writeUInt16LE(20,6);c.writeUInt16LE(0x0800,8);c.writeUInt16LE(useDef?8:0,10);c.writeUInt16LE(tm,12);c.writeUInt16LE(dt,14);c.writeUInt32LE(crc,16);c.writeUInt32LE(body.length,20);c.writeUInt32LE(data.length,24);c.writeUInt16LE(name.length,28);c.writeUInt32LE(en.exec?(0o100755<<16)>>>0:0,38);c.writeUInt32LE(at,42)
c.writeUInt16LE(en.exec?0x0314:20,4)
cen.push(Buffer.concat([c,name]))
if(onp)onp(++i,entries.length)
}
const cs=off
for(const c of cen)w(c)
const e=Buffer.alloc(22)
e.writeUInt32LE(0x06054b50,0);e.writeUInt16LE(cen.length,8);e.writeUInt16LE(cen.length,10);e.writeUInt32LE(off-cs,12);e.writeUInt32LE(cs,16)
w(e)
fs.closeSync(fd)
}
function walk(dir,base,out){
for(const n of fs.readdirSync(dir)){
const p=path.join(dir,n),r=base?base+'/'+n:n,st=fs.statSync(p)
if(st.isDirectory())walk(p,r,out)
else out.push({name:r,src:p,size:st.size,exec:(st.mode&0o111)!==0})
}
return out
}
module.exports={zip,walk,crc32}
