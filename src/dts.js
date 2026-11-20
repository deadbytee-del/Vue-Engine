(function(root){
const dts=`declare interface Entity{name:string;x:number;y:number;z:number;w:number;h:number;d:number;rot:number;rx:number;ry:number;rz:number;vx:number;vy:number;vz:number;color:string;image:string;text:string;fontSize:number;alpha:number;visible:boolean;flipX:boolean;grounded:boolean;alive:boolean;tags:string[];data:{[k:string]:any};shape:string;body:"none"|"static"|"dynamic"|"trigger";gravityScale:number;hasTag(t:string):boolean;say(text:string,seconds?:number):void;jump(power:number):void;moveLocal(forward:number,strafe:number,yawDegrees:number):void;destroy():void;dist(o:Entity):number;overlaps(o:Entity):boolean;touching(tag?:string):boolean;setZ(z:number):void}
declare interface Vue{vars:{[k:string]:any};camera:{x:number;y:number;z:number;zoom:number;smooth:number;tx:number;ty:number;tz:number;fov:number;yaw:number;pitch:number;dist:number;eye:number};mouse:{x:number;y:number;sx:number;sy:number;dx:number;dy:number;down:boolean;clicked:boolean};readonly time:number;readonly dt:number;readonly width:number;readonly height:number;key(k:string):boolean;pressed(k:string):boolean;find(name:string):Entity|null;all(tag?:string):Entity[];spawn(name:string,x?:number,y?:number,z?:number):Entity|null;destroy(e:Entity):void;go(scene:string):void;follow(e:Entity|null,distance?:number,eyeHeight?:number):void;lockMouse():void;wait(seconds:number):Promise<void>;after(seconds:number,fn:()=>void):void;frame():Promise<void>;random(min:number,max:number):number;dist(a:Entity,b:Entity):number;hud(label:string,value:any):void;beep(freq?:number,dur?:number,wave?:string,volume?:number):void;play(sound:string):void;burst(x:number,y:number,color?:string,count?:number):void;shake(amount:number,seconds?:number):void;log(...a:any[]):void;stop():void}
declare const vue:Vue
declare const self:Entity
declare function on(event:string,fn:(...a:any[])=>any):void
declare const console:{log(...a:any[]):void}`
const TEMPLATE=`export function start(): void {
self.say("Hello from Vue!", 2)
}

export function update(dt: number): void {
if (vue.key("ArrowRight")) self.x += 200 * dt
if (vue.key("ArrowLeft")) self.x -= 200 * dt
}

export function collide(other: Entity): void {
}
`
const api={dts,TEMPLATE}
if(typeof module!=='undefined'&&module.exports)module.exports=api
else root.VueDTS=api
})(typeof window!=='undefined'?window:globalThis)
