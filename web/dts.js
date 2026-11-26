(function(root){
const dts=`declare interface Entity{
readonly id:string;name:string;x:number;y:number;z:number;w:number;h:number;d:number;rot:number;rx:number;ry:number;rz:number;
vx:number;vy:number;vz:number;lx:number;ly:number;lz:number;lrot:number;
color:string;image:string;text:string;fontSize:number;alpha:number;visible:boolean;flipX:boolean;readonly grounded:boolean;readonly alive:boolean;
tags:string[];data:{[k:string]:any};shape:string;body:"none"|"static"|"dynamic"|"trigger";gravityScale:number;
readonly parent:Entity|null;readonly children:Entity[];readonly animation:string;
hasTag(t:string):boolean;addTag(t:string):void;removeTag(t:string):void;
readonly hp:number;hurt(amount:number):void;heal(amount:number):void;makePlayer(preset?:PlayerPreset|PlayerController):void;
say(text:string,seconds?:number):void;jump(power:number):void;moveLocal(forward:number,strafe:number,yawDegrees:number):void;pointAt(target:{x:number,y:number}):void;
destroy():void;dist(o:Entity):number;overlaps(o:Entity):boolean;touching(tag?:string):boolean;setZ(z:number):void;
play(animation:string,restart?:boolean):void;stopAnim():void;playSound():void;stopSound():void;
attach(parent:Entity):void;detach():void;
getTile(cx:number,cy:number):number;setTile(cx:number,cy:number,tile:number):void;tileAt(x:number,y:number):number;cellAt(x:number,y:number):[number,number]}
declare type PlayerPreset="Platformer"|"Top-down RPG"|"Shooter"|"FPS"|"Racer-lite"
declare interface PlayerController{
type:"platformer"|"topdown4"|"topdown8"|"fps"|"tps";speed:number;accel:number;friction:number;maxSpeed:number;jumpHeight:number;jumps:number;coyote:number;buffer:number;gravityScale:number;airControl:number;runMult:number;crouch:boolean;
dash:{on:boolean;speed:number;time:number;cooldown:number};mass:number;bounce:number;grip:number;layers:string[];
cam:{follow:boolean;zoom:number;smooth:number;lookAhead:number;deadzone:[number,number];bounds:[number,number,number,number]|null;dist:number;fov:number;height:number;sens:number};
keys:{left:string[];right:string[];up:string[];down:string[];jump:string[];dash:string[];run:string[];crouch:string[]};
pad:boolean;touch:boolean;health:{max:number;respawn:boolean;rx:number|null;ry:number|null};anims:{idle:string;run:string;jump:string;fall:string}}
declare interface SoundHandle{stop():void;volume:number}
declare type Ease="linear"|"in"|"out"|"inout"|"back"|"bounce"
declare interface Vue{
vars:{[k:string]:any};
camera:{x:number;y:number;z:number;zoom:number;smooth:number;tx:number;ty:number;tz:number;fov:number;yaw:number;pitch:number;dist:number;eye:number};
mouse:{x:number;y:number;sx:number;sy:number;dx:number;dy:number;down:boolean;clicked:boolean};
player:PlayerController;readonly playerEntity:Entity|null;playerPreset(e:Entity|string,preset?:PlayerPreset|PlayerController):void;playerPresets():string[];
readonly time:number;readonly dt:number;readonly width:number;readonly height:number;readonly inCutscene:boolean;readonly scene:string;
key(k:string):boolean;pressed(k:string):boolean;anyKey():boolean;
find(name:string):Entity|null;all(tag?:string):Entity[];count(tag?:string):number;nearest(from:Entity,tag?:string):Entity|null;
spawn(prefab:string,x?:number,y?:number,z?:number):Entity|null;destroy(e:Entity|string):void;go(scene:string):void;restart():void;
follow(e:Entity|string|null,distance?:number,eyeHeight?:number):void;lockMouse():void;
wait(seconds:number):Promise<void>;until(test:()=>boolean):Promise<void>;frame():Promise<void>;after(seconds:number,fn:()=>void):void;every(seconds:number,fn:()=>void):void;
tween(target:Entity|string|object,props:{[k:string]:number},seconds:number,ease?:Ease):Promise<void>;
random(min:number,max:number):number;randomInt(min:number,max:number):number;pick<T>(list:T[]):T;chance(p:number):boolean;lerp(a:number,b:number,t:number):number;clamp(v:number,min:number,max:number):number;
dist(a:Entity|string,b:Entity|string):number;angle(a:Entity|string,b:Entity|string):number;
hud(label:string,value:any):void;clearHud(label?:string):void;
beep(freq?:number,dur?:number,wave?:string,volume?:number):void;play(sound:string,volume?:number,loop?:boolean,rate?:number):SoundHandle;music(sound:string,volume?:number):SoundHandle;stopMusic():void;stopSounds():void;volume(v:number):void;
burst(x:number,y:number,color?:string,count?:number):void;shake(amount:number,seconds?:number):void;
emit(message:string,data?:any):void;cutscene(name:string):Promise<void>;skipCutscene():void;
tileAt(tilemap:Entity|string,x:number,y:number):number;setTile(tilemap:Entity|string,x:number,y:number,tile:number):void;
log(...a:any[]):void;warn(...a:any[]):void;stop():void}
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
})(typeof window!=='undefined'?window:globalThis);
