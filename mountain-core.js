export const LENGTH=640, BASE={x:-28,z:622},TOP={x:-20,z:35};
export const BOARD_CENTER={x:0,z:610},BOARD_RADIUS=58;
export const LIFT={upX:-22,downX:-38,towerX:-30,towerWidth:.9,crossbeamClearance:1.5,chairWidth:3.6};
export const SUMMIT_TERMINAL=12;
export const RIDE_SECONDS=17.5;
export const UNLOAD_SECONDS=2.5;
export const liftTowers=[12,65,170,275,380,485,590,622];
export function liftCableHeight(z){
 z=clamp(z,SUMMIT_TERMINAL,BASE.z);
 let i=0;
 while(i<liftTowers.length-2&&z>liftTowers[i+1])i++;
 const a=liftTowers[i],b=liftTowers[i+1],t=(z-a)/(b-a);
 const terminalDistance=Math.min(z-SUMMIT_TERMINAL,BASE.z-z);
 const blend=smooth(terminalDistance/45);
 const ground=baseHeight(z);
 const chord=baseHeight(a)*(1-t)+baseHeight(b)*t;
 return ground+5.1+blend*(chord-ground+7.9-Math.sin(t*Math.PI)*.65);
}
export const chairProgress=t=>t-.86*Math.sin(t*2*Math.PI)/(2*Math.PI);
export const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
export const smooth=t=>{t=clamp(t,0,1);return t*t*(3-2*t);};
export const routes=[{id:'groomer',name:'The Groomer',offset:-103,width:23,color:'#72bfb4'},{id:'park',name:'The Park',offset:0,width:24,color:'#e3a36b'},{id:'glades',name:'The Glades',offset:103,width:36,color:'#8da776'}];
export const pathX=(z,r)=>r.offset*Math.sin(Math.PI*clamp((z-60)/530,0,1));
const groomer=routes[0];
const bowlRoute={id:'bowl',name:'Juniper Bowl',color:'#638b91'};
export const bowlStart=150,bowlEnd=520;
export function bowlX(z){
 const offset=smooth((z-bowlStart)/115)*(1-smooth((z-355)/(bowlEnd-355)));
 return pathX(z,groomer)-63*offset;
}
export function bowlWidth(z){
 return 10+25*smooth((z-180)/85)*(1-smooth((z-385)/100));
}
export function inBowl(x,z,margin=0){
 return z>=bowlStart&&z<=bowlEnd&&Math.abs(x-bowlX(z))<bowlWidth(z)+margin;
}
// Staggered outcrops frame the opening, then sit on either side of the chute.
export const bowlRocks=[
 {z:198,offset:-21,size:4.6},{z:205,offset:-24,size:3.1},
 {z:235,offset:35,size:3.8},{z:245,offset:41,size:2.8},
 {z:262,offset:-32,size:4.3},{z:277,offset:-34,size:3.5},
 {z:271,offset:-5,size:2.6},{z:288,offset:-6,size:2.2}
].map(({z,offset,size})=>({x:bowlX(z)+offset,z,size,r:size*.83}));
export function trailAt(x,z){
 if(z<85||z>570)return null;
 if(inBowl(x,z)&&Math.abs(x-pathX(z,groomer))>groomer.width)return bowlRoute;
 return routes.reduce((a,b)=>Math.abs(x-pathX(z,a))<Math.abs(x-pathX(z,b))?a:b);
}
export function onTrail(x,z){return z<90||z>570||inBowl(x,z)||routes.some(r=>Math.abs(x-pathX(z,r))<r.width);}
export const jumps=[{z:205,h:2.7,width:9},{z:315,h:3.8,width:10},{z:425,h:4.5,width:11}];
export function baseHeight(z){return 148*(1-smooth((z-5)/610));}
export function height(x,z){let y=baseHeight(z);const edge=smooth((Math.abs(x)-130)/80);y+=edge*(6+Math.sin(z*.021)*3);
 if(z>bowlStart&&z<bowlEnd){
  const distance=x-bowlX(z),width=bowlWidth(z);
  const basin=smooth((z-186)/84)*(1-smooth((z-386)/130));
  const floor=1-smooth(Math.abs(distance)/(width+9));
  const chute=smooth((z-248)/31)*(1-smooth((z-297)/83));
  const chuteWidth=1-smooth(Math.abs(distance+17)/15);
  const shoulder=smooth((-distance-24)/18)*(1-smooth((-distance-42)/14));
  y+=basin*(9*shoulder-11*floor)-10*chute*chuteWidth;
 }
 const rampWidth=1-smooth((Math.abs(x-LIFT.upX)-2.2)/1.6);
 const rampLength=smooth((z-3)/8)*(1-smooth((z-13)/7));
 y+=.5*rampWidth*rampLength;
 for(const j of jumps){const d=z-j.z;if(Math.abs(x)<j.width){if(d>=-17&&d<0)y+=j.h*smooth((d+17)/17);else if(d>=0&&d<2)y+=j.h*(1-smooth(d/2));}}return y;}
export function obstacles(){const a=[];let seed=7182;function rand(){seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;}for(let i=0;i<900;i++){const z=95+rand()*465,x=-190+rand()*380;const near=routes.reduce((a,b)=>Math.abs(x-pathX(z,a))<Math.abs(x-pathX(z,b))?a:b),distance=Math.abs(x-pathX(z,near));const inGlade=near.id==='glades'&&distance<34;const gap=inGlade?Math.abs(x-pathX(z,near))<6:false;if((distance>near.width+7||inGlade&&!gap)&&Math.abs(x+28)>7){const s=.75+rand()*.75;if(!inBowl(x,z,5))a.push({x,z,r:.8,s});}}return a;}
export function spawn(){return {x:BASE.x,z:BASE.z-10,y:height(BASE.x,BASE.z-10),angle:0,yaw:0,speed:0,vy:0,groundV:0,air:false,jumps:0,airtime:0,bump:0,mode:'ski',ride:0,laps:0,passedTop:false,route:'Lift base',lastRoute:'',distance:0,drive:'glide',skatePhase:0};}
export const canBoard=p=>p.mode==='ski'&&Math.hypot(p.x-BOARD_CENTER.x,p.z-BOARD_CENTER.z)<=BOARD_RADIUS;
export function board(p){if(!canBoard(p))return false;p.mode='lift';p.ride=0;p.speed=0;p.air=false;p.angle=0;p.yaw=0;return true;}
export function step(p,input,dt,colliders=[]){const events=[];
 if(p.mode==='lift'){
  p.ride=Math.min(1,p.ride+dt/RIDE_SECONDS);
  p.x=LIFT.upX;
  p.z=BASE.z+(SUMMIT_TERMINAL-BASE.z)*chairProgress(p.ride);
  p.y=liftCableHeight(p.z)-4.6;
  p.angle=0;
  if(p.ride>=1){
   p.mode='unload';
   p.x=LIFT.upX-.44;
   p.angle=Math.PI;
   p.unloadTime=0;
   p.route='Summit · unloading';
   p.drive='glide';
  }
  return events;
 }
 if(p.mode==='unload'){
  p.unloadTime=Math.min(UNLOAD_SECONDS,p.unloadTime+dt);
  const t=p.unloadTime/UNLOAD_SECONDS,u=1-t;
  // Glide uphill off the chair, swing around the outside of the station,
  // then rejoin the marked summit area heading down the mountain.
  const startX=LIFT.upX-.44;
  p.x=(u*u*u+3*u*u*t)*startX+3*u*t*t*(-7)+t*t*t*TOP.x;
  p.z=u*u*u*SUMMIT_TERMINAL+3*u*u*t*(-5)+3*u*t*t*4+t*t*t*TOP.z;
  p.y=height(p.x,p.z);
  const dx=6*u*t*(-7-startX)+3*t*t*(TOP.x+7);
  const dz=3*u*u*(-5-SUMMIT_TERMINAL)+6*u*t*9+3*t*t*(TOP.z-4);
  p.angle=Math.atan2(dx,dz)*(1-smooth((t-.8)/.2));
  if(t>=1){
   p.mode='ski';
   p.speed=2;
   p.vy=0;
   p.groundV=0;
   p.passedTop=true;
   p.route='Summit · pick a line';
   events.push('unload');
  }
  return events;
 }
 p.bump=Math.max(0,p.bump-dt);const direction=(input.left?1:0)-(input.right?1:0);const steering=(p.air?.7:1)*(input.brake?1.9:1.25);p.yaw+=(direction*steering-p.yaw)*(1-Math.exp(-dt*10));p.angle+=p.yaw*dt;
 const eps=.3,slope=(height(p.x,p.z-eps)-height(p.x,p.z+eps))/(eps*2),sideSlope=(height(p.x-eps,p.z)-height(p.x+eps,p.z))/(eps*2),g=18,grade=slope*Math.cos(p.angle)+sideSlope*Math.sin(p.angle);const gravity=g*grade;
 // Read the main slope over several ski lengths so a bump or ramp lip
 // cannot change the stance. The loading area always behaves as flat.
 const headingZ=Math.cos(p.angle);
 const downhillGrade=p.z>=590?0:(baseHeight(p.z-12*headingZ)-baseHeight(p.z+12*headingZ))/24;
 const wasTucking=p.drive==='tuck';
 const canTuck=downhillGrade>=(wasTucking?.055:.085)&&p.speed>=(wasTucking?6:7.5);
 p.drive='glide';
 if(input.tuck&&!input.brake&&!p.air){
  if(canTuck)p.drive='tuck';
  else if(p.speed<11)p.drive='skate';
 }
 if(p.drive==='skate')p.skatePhase=(p.skatePhase||0)+dt*(1.35+Math.min(6,p.speed)*.07)*Math.PI*2;
 const push=p.drive==='skate'?8.8*Math.max(0,1-p.speed/10)+.9*Math.max(0,Math.sin(p.skatePhase*2)):0,drag=(p.drive==='tuck'?.0065:.009)*p.speed*p.speed+(onTrail(p.x,p.z)?.28:1.5)+Math.abs(p.yaw)*.55;
 p.speed=clamp(p.speed+(gravity+push-drag-(input.brake?10:0))*dt,0,p.drive==='tuck'?28:23);if(!p.air&&p.speed<.05)p.speed=0;
 const oldY=p.y,oldGroundV=p.groundV,dx=Math.sin(p.angle)*p.speed*dt,dz=Math.cos(p.angle)*p.speed*dt;p.x=clamp(p.x+dx,-205,205);p.z=clamp(p.z+dz,-5,657);p.distance+=Math.hypot(dx,dz);const ground=height(p.x,p.z);
 if(!p.air&&input.jump&&p.speed>1){p.air=true;p.vy=oldGroundV+7;p.airtime=0;events.push('takeoff');}else if(!p.air&&ground<oldY+oldGroundV*dt-.075&&p.speed>5){p.air=true;p.vy=oldGroundV;p.airtime=0;events.push('takeoff');}
 if(p.air){p.vy-=g*dt;p.y+=p.vy*dt;p.airtime+=dt;if(p.y<=ground){p.y=ground;p.air=false;p.vy=0;if(p.airtime>.25){p.jumps++;events.push('land');}p.groundV=0;}}else{p.y=ground;p.groundV=clamp((ground-oldY)/dt,-20,20);}
 for(const o of colliders){const d=Math.hypot(p.x-o.x,p.z-o.z),radius=(o.r??.8)+.4;if(d<radius&&p.y-ground<5&&p.bump<=0){const nx=(p.x-o.x)/(d||1),nz=(p.z-o.z)/(d||1);p.x=o.x+nx*(radius+.4);p.z=o.z+nz*(radius+.4);p.speed*=.25;p.bump=.8;events.push('bump');}}
 if(p.z>105&&p.z<550){const route=trailAt(p.x,p.z).name;if(route!==p.route){p.route=route;events.push('route');}p.lastRoute=route;}
 if(p.passedTop&&p.z>585){p.laps++;p.passedTop=false;p.route='Lift base';events.push('lap');}
 if(p.z>590){if(!input.tuck)p.speed=Math.max(0,p.speed-4*dt);p.route='Lift base';}
 return events;}

