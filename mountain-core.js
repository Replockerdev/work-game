export const LENGTH=640, BASE={x:-28,z:622},TOP={x:-20,z:35};
export const SNOW_WEST=-575,SNOW_EAST=215;
export const BOARD_CENTER={x:0,z:610},BOARD_RADIUS=58;
export const LIFT={upX:-22,downX:-38,towerX:-30,towerWidth:.9,crossbeamClearance:1.5,chairWidth:3.6};
export const SUMMIT_TERMINAL=12;
export const RIDE_SECONDS=17.5;
export const UNLOAD_SECONDS=2.5;
export const liftTowers=[12,65,170,275,380,485,590,622];
export const JUNIPER={id:'juniper',name:'Juniper Chair',center:LIFT.towerX,top:SUMMIT_TERMINAL,bottom:BASE.z,
 rideSeconds:RIDE_SECONDS,towers:liftTowers,x:0,z:0,yaw:0,hand:1,exitX:TOP.x,exitZ:TOP.z};
export const EXPERT={id:'expert',name:'Timberline Chair',center:0,top:0,bottom:390,
 rideSeconds:19,towers:[0,38,100,168,235,303,352,390],
 x:-465,z:510,yaw:1.45,hand:-1,exitX:24,exitZ:27,exitAngle:.23};
export function liftWorld(lift,x,z){
 const cos=Math.cos(lift.yaw),sin=Math.sin(lift.yaw);
 return {x:lift.x+cos*x*lift.hand+sin*z,z:lift.z-sin*x*lift.hand+cos*z};
}
function expertLocal(x,z){
 const dx=x-EXPERT.x,dz=z-EXPERT.z,cos=Math.cos(EXPERT.yaw),sin=Math.sin(EXPERT.yaw);
 return {x:sin*dz-cos*dx,z:sin*dx+cos*dz};
}
export function expertFaceX(z){return 35+17*smooth((z-28)/60)-33*smooth((z-244)/120);}
export const expertRoute={id:'expert',name:'Timberline Face',color:'#414e61'};
export function onExpertFace(x,z){
 const local=expertLocal(x,z);
 return local.z>=20&&local.z<=382&&Math.abs(local.x-expertFaceX(local.z))<36;
}
export function liftCableHeight(z,lift=JUNIPER){
 const towers=lift.towers;
 z=clamp(z,lift.top,lift.bottom);
 let i=0;
 while(i<towers.length-2&&z>towers[i+1])i++;
 const a=towers[i],b=towers[i+1],t=(z-a)/(b-a);
 const terminalDistance=Math.min(z-lift.top,lift.bottom-z);
 const blend=smooth(terminalDistance/45);
 if(lift===EXPERT){
  const ground=liftGround(lift,8,z);
  const chord=liftGround(lift,8,a)*(1-t)+liftGround(lift,8,b)*t;
  const highLane=Math.max(ground,liftGround(lift,-8,z));
  const span=Math.max(chord+12-Math.sin(t*Math.PI)*.65,highLane+9);
  return ground+5.1+blend*(span-ground-5.1);
 }
 const ground=baseHeight(z);
 const chord=baseHeight(a)*(1-t)+baseHeight(b)*t;
 return ground+5.1+blend*(chord-ground+7.9-Math.sin(t*Math.PI)*.65);
}
export function liftGround(lift,x,z){
 const point=liftWorld(lift,x,z);
 return height(point.x,point.z);
}
export const chairProgress=t=>t-.86*Math.sin(t*2*Math.PI)/(2*Math.PI);
export const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
export const smooth=t=>{t=clamp(t,0,1);return t*t*(3-2*t);};
export const routes=[{id:'groomer',name:'The Groomer',offset:-103,width:23,color:'#72bfb4'},{id:'park',name:'The Park',offset:0,width:24,color:'#e3a36b'},{id:'glades',name:'The Glades',offset:103,width:36,color:'#8da776'}];
export const pathX=(z,r)=>r.offset*Math.sin(Math.PI*clamp((z-60)/530,0,1));
const groomer=routes[0];
const bowlRoute={id:'bowl',name:'Juniper Bowl',color:'#638b91'};
export const bowlStart=148,bowlEnd=584;
export function bowlX(z){
 const traverse=59*smooth((z-bowlStart)/84);
 const sweep=127*smooth((z-206)/138);
 const returnToGroomer=1-smooth((z-370)/(bowlEnd-370));
 return pathX(z,groomer)-(traverse+sweep)*returnToGroomer;
}
export function bowlWidth(z){
 return 15+39*smooth((z-215)/105)*(1-smooth((z-402)/135));
}
export function inBowl(x,z,margin=0){
 return z>=bowlStart&&z<=bowlEnd&&Math.abs(x-bowlX(z))<bowlWidth(z)+margin;
}
// Staggered outcrops frame the opening, then sit on either side of the chute.
export const bowlRocks=[
 {z:180,offset:-20,size:4.4},{z:187,offset:-23,size:3.1},
 {z:208,offset:21,size:3.2},{z:216,offset:24,size:2.6},
 {z:275,offset:-43,size:4.4},{z:294,offset:-47,size:3.9},
 {z:266,offset:-10,size:3.1},{z:285,offset:-10,size:2.7},
 {z:330,offset:51,size:5.9},{z:355,offset:56,size:4.4}
].map(({z,offset,size})=>({x:bowlX(z)+offset,z,size,r:size*.83}));
export function trailAt(x,z){
 if(onExpertFace(x,z))return expertRoute;
 if(inBowl(x,z)&&Math.abs(x-pathX(z,groomer))>groomer.width)return bowlRoute;
 if(z<85||z>570)return null;
 return routes.reduce((a,b)=>Math.abs(x-pathX(z,a))<Math.abs(x-pathX(z,b))?a:b);
}
export function onTrail(x,z){return z<90||z>570||inBowl(x,z)||onExpertFace(x,z)||routes.some(r=>Math.abs(x-pathX(z,r))<r.width);}
export const jumps=[{z:205,h:2.7,width:9},{z:315,h:3.8,width:10},{z:425,h:4.5,width:11}];
export function baseHeight(z){return 148*(1-smooth((z-5)/610));}
export function height(x,z){let y=baseHeight(z);const edge=smooth((Math.abs(x)-130)/80);y+=edge*(6+Math.sin(z*.021)*3);
 if(z>bowlStart&&z<bowlEnd){
  const distance=x-bowlX(z),width=bowlWidth(z);
  const lip=smooth((z-185)/42)*(1-smooth((z-232)/38));
  const basin=smooth((z-230)/75)*(1-smooth((z-365)/211));
  const floor=1-smooth(Math.max(0,Math.abs(distance)-width*.53)/(width*.64+9));
  const chute=smooth((z-251)/35)*(1-smooth((z-303)/115));
  const chuteWidth=1-smooth(Math.abs(distance+26)/19);
  const outerWall=smooth((-distance-width*.62)/28)*(1-smooth((-distance-width-18)/40));
  const ridgeDistance=Math.abs(x-pathX(z,groomer)+67);
  const ridge=(1-smooth(ridgeDistance/37))*smooth((z-226)/70)*(1-smooth((z-446)/90));
  y+=floor*(4*lip-15*basin)-12*chute*chuteWidth+21*basin*outerWall+26*ridge;
 }
 const rampWidth=1-smooth((Math.abs(x-LIFT.upX)-2.2)/1.6);
 const rampLength=smooth((z-3)/8)*(1-smooth((z-13)/7));
 y+=.5*rampWidth*rampLength;
 if(x<-35&&z>395){
  const local=expertLocal(x,z);
  const shelf=1-smooth((local.z-356)/34);
  const crown=1-smooth((-local.z-35)/75);
  const crossSlope=1-smooth((Math.abs(local.x-29)-68)/40);
  const fall=1-smooth((local.z-25)/310);
  y+=198*fall*shelf*crown*crossSlope;
  const terminalWidth=1-smooth((Math.abs(local.x)-20)/12);
  const summitDeck=terminalWidth*(1-smooth((Math.abs(local.z)-11)/18));
  const loadingDeck=terminalWidth*(1-smooth((Math.abs(local.z-EXPERT.bottom)-11)/24));
  y+=(211-y)*summitDeck+(3.4-y)*loadingDeck;
 }
 for(const j of jumps){const d=z-j.z;if(Math.abs(x)<j.width){if(d>=-17&&d<0)y+=j.h*smooth((d+17)/17);else if(d>=0&&d<2)y+=j.h*(1-smooth(d/2));}}return y;}
export function obstacles(){const a=[];let seed=7182;function rand(){seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;}for(let i=0;i<900;i++){const z=95+rand()*465,x=-190+rand()*380;const near=routes.reduce((a,b)=>Math.abs(x-pathX(z,a))<Math.abs(x-pathX(z,b))?a:b),distance=Math.abs(x-pathX(z,near));const inGlade=near.id==='glades'&&distance<34;const gap=inGlade?Math.abs(x-pathX(z,near))<6:false;if((distance>near.width+7||inGlade&&!gap)&&Math.abs(x+28)>7){const s=.75+rand()*.75;if(!inBowl(x,z,7)&&!onExpertFace(x,z)&&Math.hypot(x-expertLoading.x,z-expertLoading.z)>20)a.push({x,z,r:.8,s});}}
 for(let i=0;i<70;i++){
  const z=200+rand()*364;
  const x=bowlX(z)-bowlWidth(z)-8-rand()*45;
  const s=.65+rand()*.5;
  if(x<-195&&x>SNOW_WEST+8&&!onExpertFace(x,z))a.push({x,z,r:.8,s});
 }
 return a;
}
export function spawn(){return {x:BASE.x,z:BASE.z-10,y:height(BASE.x,BASE.z-10),angle:0,yaw:0,speed:0,vy:0,groundV:0,air:false,jumps:0,airtime:0,bump:0,mode:'ski',ride:0,laps:0,passedTop:false,route:'Lift base',lastRoute:'',distance:0,drive:'glide',skatePhase:0};}
const expertLoading=liftWorld(EXPERT,8,EXPERT.bottom);
export function boardingLift(p){
 if(p.mode!=='ski')return null;
 if(Math.hypot(p.x-expertLoading.x,p.z-expertLoading.z)<=35)return EXPERT;
 if(Math.hypot(p.x-BOARD_CENTER.x,p.z-BOARD_CENTER.z)<=BOARD_RADIUS)return JUNIPER;
 return null;
}
export const canBoard=p=>Boolean(boardingLift(p));
export function board(p){
 const lift=boardingLift(p);
 if(!lift)return false;
 p.activeLift=lift;p.mode='lift';p.ride=0;p.speed=0;p.air=false;p.angle=lift.yaw;p.yaw=0;
 return true;
}
export function step(p,input,dt,colliders=[]){const events=[];
 if(p.mode==='lift'){
  const lift=p.activeLift??JUNIPER;
  p.ride=Math.min(1,p.ride+dt/lift.rideSeconds);
  const z=lift.bottom+(lift.top-lift.bottom)*chairProgress(p.ride);
  const point=liftWorld(lift,lift.center+8,z);
  p.x=point.x;p.z=point.z;p.y=liftCableHeight(z,lift)-4.6;
  p.angle=lift.yaw;
  if(p.ride>=1){
   p.mode='unload';
   const seat=liftWorld(lift,lift.center+7.56,z);
   p.x=seat.x;p.z=seat.z;
   p.angle=lift.yaw+Math.PI;
   p.unloadTime=0;
   p.route='Summit · unloading';
   p.drive='glide';
  }
  return events;
 }
 if(p.mode==='unload'){
  const lift=p.activeLift??JUNIPER;
  p.unloadTime=Math.min(UNLOAD_SECONDS,p.unloadTime+dt);
  const t=p.unloadTime/UNLOAD_SECONDS,u=1-t;
  // Glide uphill off the chair, swing around the outside of the station,
  // then rejoin the marked summit area heading down the mountain.
  const startX=lift.center+7.56,turnX=lift.center+23;
  const x=(u*u*u+3*u*u*t)*startX+3*u*t*t*turnX+t*t*t*lift.exitX;
  const z=u*u*u*lift.top+3*u*u*t*(lift.top-17)+3*u*t*t*(lift.top-8)+t*t*t*lift.exitZ;
  const point=liftWorld(lift,x,z);
  p.x=point.x;p.z=point.z;
  p.y=height(p.x,p.z);
  const dx=6*u*t*(turnX-startX)+3*t*t*(lift.exitX-turnX);
  const dz=-51*u*u+54*u*t+3*t*t*(lift.exitZ-lift.top+8);
  const straightening=smooth((t-.8)/.2);
  const angle=Math.atan2(dx,dz)*(1-straightening)+(lift.exitAngle??0)*straightening;
  p.angle=lift.yaw+lift.hand*angle;
  if(t>=1){
   p.mode='ski';
   p.speed=2;
   p.vy=0;
   p.groundV=0;
   p.passedTop=true;
   p.route=lift===EXPERT?'Timberline Summit':'Summit · pick a line';
   events.push('unload');
  }
  return events;
 }
 p.bump=Math.max(0,p.bump-dt);const direction=(input.left?1:0)-(input.right?1:0);const steering=(p.air?.7:1)*(input.brake?1.9:1.25);p.yaw+=(direction*steering-p.yaw)*(1-Math.exp(-dt*10));p.angle+=p.yaw*dt;
 const eps=.3,slope=(height(p.x,p.z-eps)-height(p.x,p.z+eps))/(eps*2),sideSlope=(height(p.x-eps,p.z)-height(p.x+eps,p.z))/(eps*2),g=18,grade=slope*Math.cos(p.angle)+sideSlope*Math.sin(p.angle);const gravity=g*grade;
 // Read the main slope over several ski lengths so a bump or ramp lip
 // cannot change the stance. The loading area always behaves as flat.
 const headingZ=Math.cos(p.angle),headingX=Math.sin(p.angle);
 const expert=onExpertFace(p.x,p.z);
 const downhillGrade=expert
  ?(height(p.x-12*headingX,p.z-12*headingZ)-height(p.x+12*headingX,p.z+12*headingZ))/24
  :p.z>=590?0:(baseHeight(p.z-12*headingZ)-baseHeight(p.z+12*headingZ))/24;
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
 const oldY=p.y,oldGroundV=p.groundV,dx=Math.sin(p.angle)*p.speed*dt,dz=Math.cos(p.angle)*p.speed*dt;p.x=clamp(p.x+dx,SNOW_WEST+10,SNOW_EAST-10);p.z=clamp(p.z+dz,-5,657);p.distance+=Math.hypot(dx,dz);const ground=height(p.x,p.z);
 if(!p.air&&input.jump&&p.speed>1){p.air=true;p.vy=oldGroundV+7;p.airtime=0;events.push('takeoff');}else if(!p.air&&ground<oldY+oldGroundV*dt-.075&&p.speed>5){p.air=true;p.vy=oldGroundV;p.airtime=0;events.push('takeoff');}
 if(p.air){p.vy-=g*dt;p.y+=p.vy*dt;p.airtime+=dt;if(p.y<=ground){p.y=ground;p.air=false;p.vy=0;if(p.airtime>.25){p.jumps++;events.push('land');}p.groundV=0;}}else{p.y=ground;p.groundV=clamp((ground-oldY)/dt,-20,20);}
 for(const o of colliders){const d=Math.hypot(p.x-o.x,p.z-o.z),radius=(o.r??.8)+.4;if(d<radius&&p.y-ground<5&&p.bump<=0){const nx=(p.x-o.x)/(d||1),nz=(p.z-o.z)/(d||1);p.x=o.x+nx*(radius+.4);p.z=o.z+nz*(radius+.4);p.speed*=.25;p.bump=.8;events.push('bump');}}
 const route=trailAt(p.x,p.z);
 if(route&&(onExpertFace(p.x,p.z)||p.z>105&&p.z<570)){if(route.name!==p.route){p.route=route.name;events.push('route');}p.lastRoute=route.name;}
 const returnedToBase=p.z>585&&p.x>-86;
 const returnedToExpert=p.activeLift===EXPERT&&boardingLift(p)===EXPERT;
 if(p.passedTop&&(returnedToBase||returnedToExpert)){p.laps++;p.passedTop=false;events.push('lap');}
 if(p.z>590&&returnedToBase){if(!input.tuck)p.speed=Math.max(0,p.speed-4*dt);p.route='Lift base';}
 return events;}

