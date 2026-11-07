export const LENGTH=640, BASE={x:-28,z:622},TOP={x:-20,z:35};
export const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
export const smooth=t=>{t=clamp(t,0,1);return t*t*(3-2*t);};
export const routes=[{id:'groomer',name:'The Groomer',offset:-103,width:23,color:'#72bfb4'},{id:'park',name:'The Park',offset:0,width:24,color:'#e3a36b'},{id:'glades',name:'The Glades',offset:103,width:36,color:'#8da776'}];
export const pathX=(z,r)=>r.offset*Math.sin(Math.PI*clamp((z-60)/530,0,1));
export function trailAt(x,z){if(z<85||z>570)return null;return routes.reduce((a,b)=>Math.abs(x-pathX(z,a))<Math.abs(x-pathX(z,b))?a:b);}
export function onTrail(x,z){return z<90||z>570||routes.some(r=>Math.abs(x-pathX(z,r))<r.width);}
export const jumps=[{z:205,h:2.7,width:9},{z:315,h:3.8,width:10},{z:425,h:4.5,width:11}];
export function baseHeight(z){return 148*(1-smooth((z-5)/610));}
export function height(x,z){let y=baseHeight(z);const edge=smooth((Math.abs(x)-130)/80);y+=edge*(6+Math.sin(z*.021)*3);for(const j of jumps){const d=z-j.z;if(Math.abs(x)<j.width){if(d>=-17&&d<0)y+=j.h*smooth((d+17)/17);else if(d>=0&&d<2)y+=j.h*(1-smooth(d/2));}}return y;}
export function obstacles(){const a=[];let seed=7182;function rand(){seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;}for(let i=0;i<245;i++){const z=95+rand()*465,x=-190+rand()*380;const near=trailAt(x,z),distance=Math.abs(x-pathX(z,near));const inGlade=near.id==='glades'&&distance<34;const gap=inGlade?Math.abs(x-pathX(z,near))<6:false;if((distance>near.width+7||inGlade&&!gap)&&Math.abs(x+28)>7)a.push({x,z,r:.8,s:.75+rand()*.75});}return a;}
export function spawn(){return {x:BASE.x,z:BASE.z-10,y:height(BASE.x,BASE.z-10),angle:0,yaw:0,speed:0,vy:0,groundV:0,air:false,jumps:0,airtime:0,bump:0,mode:'ski',ride:0,laps:0,passedTop:false,route:'Lift base',lastRoute:'',distance:0};}
export const canBoard=p=>p.mode==='ski'&&Math.hypot(p.x-BASE.x,p.z-BASE.z)<11&&p.speed<5;
export function board(p){if(!canBoard(p))return false;p.mode='lift';p.ride=0;p.speed=0;p.air=false;p.angle=0;p.yaw=0;return true;}
export function step(p,input,dt,trees=[]){const events=[];if(p.mode==='lift'){p.ride=Math.min(1,p.ride+dt/20);const t=p.ride;p.x=-28;p.z=BASE.z+(12-BASE.z)*t;p.y=height(p.x,p.z)+7*Math.min(1,t*10,(1-t)*10)+1.1;p.angle=0;if(t>=1){p.mode='ski';p.x=TOP.x;p.z=TOP.z;p.y=height(p.x,p.z);p.speed=2;p.vy=0;p.groundV=0;p.passedTop=true;p.route='Summit · pick a line';events.push('unload');}return events;}
 p.bump=Math.max(0,p.bump-dt);const direction=(input.left?1:0)-(input.right?1:0);const steering=(p.air?.7:1)*(input.brake?1.9:1.25);p.yaw+=(direction*steering-p.yaw)*(1-Math.exp(-dt*10));p.angle+=p.yaw*dt;
 const eps=.3,slope=(height(p.x,p.z-eps)-height(p.x,p.z+eps))/(eps*2),g=18;const gravity=g*slope*Math.cos(p.angle),push=input.tuck?(p.speed<4?3.5:1.6):0;const drag=.009*p.speed*p.speed+(onTrail(p.x,p.z)?.28:1.5)+Math.abs(p.yaw)*.55;
 p.speed=clamp(p.speed+(gravity+push-drag-(input.brake?10:0))*dt,0,input.tuck?28:23);if(!p.air&&p.speed<.05)p.speed=0;
 const oldY=p.y,oldGroundV=p.groundV,dx=Math.sin(p.angle)*p.speed*dt,dz=Math.cos(p.angle)*p.speed*dt;p.x=clamp(p.x+dx,-205,205);p.z=clamp(p.z+dz,-5,657);p.distance+=Math.hypot(dx,dz);const ground=height(p.x,p.z);
 if(!p.air&&input.jump&&p.speed>1){p.air=true;p.vy=oldGroundV+7;p.airtime=0;events.push('takeoff');}else if(!p.air&&ground<oldY+oldGroundV*dt-.075&&p.speed>5){p.air=true;p.vy=oldGroundV;p.airtime=0;events.push('takeoff');}
 if(p.air){p.vy-=g*dt;p.y+=p.vy*dt;p.airtime+=dt;if(p.y<=ground){p.y=ground;p.air=false;p.vy=0;if(p.airtime>.25){p.jumps++;events.push('land');}p.groundV=0;}}else{p.y=ground;p.groundV=clamp((ground-oldY)/dt,-20,20);}
 for(const o of trees){const d=Math.hypot(p.x-o.x,p.z-o.z);if(d<1.2&&p.y-ground<5&&p.bump<=0){const nx=(p.x-o.x)/(d||1),nz=(p.z-o.z)/(d||1);p.x=o.x+nx*1.6;p.z=o.z+nz*1.6;p.speed*=.25;p.bump=.8;events.push('bump');}}
 if(p.z>105&&p.z<550){const route=trailAt(p.x,p.z).name;if(route!==p.route){p.route=route;events.push('route');}p.lastRoute=route;}
 if(p.passedTop&&p.z>585){p.laps++;p.passedTop=false;p.route='Lift base';events.push('lap');}
 if(p.z>590){p.speed=Math.max(0,p.speed-4*dt);p.route='Lift base';}
 return events;}

