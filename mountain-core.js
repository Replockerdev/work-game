// Stretch Juniper toward the north ridge while keeping the shared lower hill in place.
export function juniperZ(section){
 if(section<=0)return section-300;
 if(section>=500)return section;
 return section-300*(1-section/500)**2;
}
export function juniperSection(z){
 if(z<=-300)return z+300;
 if(z>=500)return z;
 const distance=z+300;
 return 2*distance/(2.2+Math.sqrt(4.84-.0048*distance));
}
export const LENGTH=640, BASE={x:-28,z:622},TOP={x:-20,z:juniperZ(35)};
export const SNOW_WEST=-875,SNOW_EAST=215,SNOW_NORTH=-340,SNOW_SOUTH=690;
export const BOARD_CENTER={x:0,z:610},BOARD_RADIUS=58;
export const LIFT={upX:-22,downX:-38,towerX:-30,towerWidth:.9,crossbeamClearance:1.5,chairWidth:3.6};
export const SUMMIT_TERMINAL=juniperZ(12);
export const RIDE_SECONDS=24;
export const UNLOAD_SECONDS=2.5;
export const liftTowers=[12,65,118,170,225,275,330,380,435,485,590,622].map(juniperZ);
export const JUNIPER={id:'juniper',name:'Juniper Chair',center:LIFT.towerX,top:SUMMIT_TERMINAL,bottom:BASE.z,
 rideSeconds:RIDE_SECONDS,towers:liftTowers,x:0,z:0,yaw:0,hand:1,exitX:TOP.x,exitZ:TOP.z};
export function timberlineZ(section){
 if(section<=0)return section-280;
 if(section>=360)return section;
 return section-280*(1-section/360)**2;
}
const timberlineScale=1+560/360;
function timberlineSection(z){
 if(z<=-280)return z+280;
 if(z>=360)return z;
 const distance=z+280;
 return 2*distance/(timberlineScale+Math.sqrt(timberlineScale**2-1120*distance/360**2));
}
export const EXPERT={id:'expert',name:'Timberline Chair',center:0,top:timberlineZ(0),bottom:390,
 rideSeconds:29,towers:[0,27,57,90,126,165,208,253,305,352,390].map(timberlineZ),
 x:-465,z:510,yaw:1.45,hand:-1,exitX:24,exitZ:timberlineZ(17),exitAngle:.23};
export function liftWorld(lift,x,z){
 const cos=Math.cos(lift.yaw),sin=Math.sin(lift.yaw);
 return {x:lift.x+cos*x*lift.hand+sin*z,z:lift.z-sin*x*lift.hand+cos*z};
}
export function expertLocal(x,z){
 const dx=x-EXPERT.x,dz=z-EXPERT.z,cos=Math.cos(EXPERT.yaw),sin=Math.sin(EXPERT.yaw);
 const along=sin*dx+cos*dz;
 return {x:sin*dz-cos*dx,z:timberlineSection(along),along};
}
export function expertFaceX(z){return 35+17*smooth((z-28)/60)-33*smooth((z-244)/120);}
export const expertRoute={id:'expert',name:'Timberline Face',color:'#414e61'};
export const chuteRoute={id:'chute',name:'Splitrock Chute',color:'#493d58'};
export const timberRoute={id:'timber',name:'Pine Thread',color:'#466956'};
export function chuteX(z){
 return 62+42*smooth((z-58)/72)+4*Math.sin((z-130)*.045)*smooth((z-124)/24)
  -52*smooth((z-220)/104);
}
export function timberX(z){return Math.max(23,expertFaceX(z)-24);}
export function expertLine(x,z){
 const local=expertLocal(x,z);
 if(local.z>=68&&local.z<315&&Math.abs(local.x-chuteX(local.z))<12)return chuteRoute;
 if(local.z>178&&local.z<321&&Math.abs(local.x-timberX(local.z))<10)return timberRoute;
 if(local.z>=20&&local.z<=382&&Math.abs(local.x-expertFaceX(local.z))<36)return expertRoute;
 return null;
}
export function onExpertFace(x,z){
 return Boolean(expertLine(x,z));
}
export const cliffDrops=[
 {x:77,z:148,width:11,drop:4.5},
 {x:76,z:205,width:11,drop:7},
 {x:69,z:258,width:9,drop:3.5}
];
function expertRelief(x,z){
 const distance=Math.abs(x-chuteX(z));
 const channel=smooth((z-85)/36)*(1-smooth((z-241)/63));
 const wall=smooth((distance-6)/8)*(1-smooth((distance-14)/9));
 let relief=channel*(wall*7-(1-smooth(distance/10))*3.5);
 for(const cliff of cliffDrops){
  const cross=1-smooth(Math.abs(x-cliff.x)/cliff.width);
  const shelf=smooth((z-cliff.z+24)/18)*(1-smooth((z-cliff.z)/2));
  relief+=cliff.drop*cross*shelf;
 }
 return relief;
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
 const span=Math.max(chord+13-Math.sin(t*Math.PI)*.65,ground+11);
 return ground+5.1+blend*(span-ground-5.1);
}
export function liftGround(lift,x,z){
 const point=liftWorld(lift,x,z);
 return height(point.x,point.z);
}
export const chairProgress=t=>t-.86*Math.sin(t*2*Math.PI)/(2*Math.PI);
export const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
export const smooth=t=>{t=clamp(t,0,1);return t*t*(3-2*t);};
export const expertRocks=[
 [112,-13,3.9],[120,-14.5,4.6],[138,12.5,4.1],[147,15.5,4.9],
 [167,-12,4.3],[173,-15,3.7],[191,12,4.1],[207,13,4.8],
 [223,-13,4.5],[241,13.5,3.7],[262,13,3.4],[273,-14,2.9]
].map(([z,offset,size])=>({...liftWorld(EXPERT,chuteX(z)+offset,timberlineZ(z)),size,r:size*.78}));
export const routes=[{id:'groomer',name:'The Groomer',offset:-103,width:23,color:'#72bfb4'},{id:'park',name:'The Park',offset:0,width:24,color:'#e3a36b'},{id:'glades',name:'The Glades',offset:103,width:36,color:'#8da776'}];
export const pathX=(z,r)=>r.offset*Math.sin(Math.PI*clamp((juniperSection(z)-60)/530,0,1));
const groomer=routes[0];
const bowlRoute={id:'bowl',name:'Juniper Bowl',color:'#638b91'};
export const bowlStart=juniperZ(148),bowlEnd=juniperZ(584);
export function bowlX(z){
 const section=juniperSection(z);
 const entry=59*smooth((section-148)/84);
 const sweep=127*smooth((section-206)/138);
 const returnToGroomer=1-smooth((section-370)/214);
 return pathX(z,groomer)-(entry+sweep)*returnToGroomer;
}
export function bowlWidth(z){
 const section=juniperSection(z);
 return 15+39*smooth((section-215)/105)*(1-smooth((section-402)/135));
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
].map(({z:section,offset,size})=>{
 const z=juniperZ(section);
 return {x:bowlX(z)+offset,z,size,r:size*.83};
});
export function trailAt(x,z){
 const expert=expertLine(x,z);
 if(expert)return expert;
 if(inBowl(x,z)&&Math.abs(x-pathX(z,groomer))>groomer.width)return bowlRoute;
 if(z<juniperZ(85)||z>570)return null;
 return routes.reduce((a,b)=>Math.abs(x-pathX(z,a))<Math.abs(x-pathX(z,b))?a:b);
}
export function onTrail(x,z){return z<juniperZ(90)||z>570||inBowl(x,z)||onExpertFace(x,z)||routes.some(r=>Math.abs(x-pathX(z,r))<r.width);}
export const jumps=[{z:205,h:2.7,width:9},{z:315,h:3.8,width:10},{z:425,h:4.5,width:11}]
 .map(j=>({...j,z:juniperZ(j.z)}));
export function baseHeight(z){
 const section=juniperSection(z);
 return 148*(1-smooth((section-5)/610))+76*(1-smooth(section/465));
}
export function height(x,z){let y=baseHeight(z);const edge=smooth((Math.abs(x)-130)/80);y+=edge*(6+Math.sin(z*.021)*3);
 if(z>bowlStart&&z<bowlEnd){
  const section=juniperSection(z);
  const distance=x-bowlX(z),width=bowlWidth(z);
  const lip=smooth((section-185)/42)*(1-smooth((section-232)/38));
  const basin=smooth((section-230)/75)*(1-smooth((section-365)/211));
  const floor=1-smooth(Math.max(0,Math.abs(distance)-width*.53)/(width*.64+9));
  const chute=smooth((section-251)/35)*(1-smooth((section-303)/115));
  const chuteWidth=1-smooth(Math.abs(distance+26)/19);
  const outerWall=smooth((-distance-width*.62)/28)*(1-smooth((-distance-width-18)/40));
  const ridgeDistance=Math.abs(x-pathX(z,groomer)+67);
  const ridge=(1-smooth(ridgeDistance/37))*smooth((section-226)/70)*(1-smooth((section-446)/90));
  y+=floor*(4*lip-15*basin)-12*chute*chuteWidth+21*basin*outerWall+26*ridge;
 }
 const rampWidth=1-smooth((Math.abs(x-LIFT.upX)-2.2)/1.6);
 const rampLength=smooth((z-SUMMIT_TERMINAL+9)/8)*(1-smooth((z-SUMMIT_TERMINAL-1)/7));
 y+=.5*rampWidth*rampLength;
 const ridgeApproach=1-smooth((z-SNOW_NORTH)/64);
 const summitSaddle=smooth((Math.abs(x+25)-42)/155);
 y+=ridgeApproach*summitSaddle*(29+9*Math.sin(x*.021));
 if(x<-35){
  const local=expertLocal(x,z);
  const shelf=1-smooth((local.z-356)/34);
  // Build the Juniper-facing slope as a broad rise from the basin to the ridge.
  const northDistance=Math.max(0,-local.x-9);
  const southSlope=1-smooth((local.x-118)/94);
  const fall=1-smooth((local.z-18)/319);
  const ridgeBack=smooth((EXPERT.top-local.along-14)/138)*103;
  const timberlineFace=(335*fall*shelf+ridgeBack)*southSlope;
  const uphill=smooth((-x-310)/430);
  const behindPeak=smooth((-x-740)/140);
  const basinApproach=smooth((z+170)/620);
  const apron=(354+90*behindPeak-y)*uphill*basinApproach;
  // Fill the trough up to a steady crossfall from the lift, then round the
  // join with the longer uphill slope from Juniper.
  const crossfall=timberlineFace-.52*northDistance;
  const overlap=Math.max(0,1-Math.abs(apron-crossfall)/18);
  const rise=Math.max(apron,crossfall);
  const fill=rise+4.5*overlap*overlap*smooth(rise/14);
  const northBlend=smooth(northDistance/28);
  y+=timberlineFace*(1-northBlend)+fill*northBlend+expertRelief(local.x,local.z);
  const terminalWidth=1-smooth((Math.abs(local.x)-20)/12);
  const summitDeck=terminalWidth*(1-smooth((Math.abs(local.along-EXPERT.top)-11)/19));
  const loadingDeck=terminalWidth*(1-smooth((Math.abs(local.z-EXPERT.bottom)-11)/24));
  y+=(354-y)*summitDeck+(3.4-y)*loadingDeck;
 }
 for(const j of jumps){const d=z-j.z;if(Math.abs(x)<j.width){if(d>=-17&&d<0)y+=j.h*smooth((d+17)/17);else if(d>=0&&d<2)y+=j.h*(1-smooth(d/2));}}return y;}
export function obstacles(){const a=[];let seed=7182;function rand(){seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;}for(let i=0;i<900;i++){const z=juniperZ(95+rand()*465),x=-190+rand()*380;const near=routes.reduce((a,b)=>Math.abs(x-pathX(z,a))<Math.abs(x-pathX(z,b))?a:b),distance=Math.abs(x-pathX(z,near));const inGlade=near.id==='glades'&&distance<34;const gap=inGlade?Math.abs(x-pathX(z,near))<6:false;if((distance>near.width+7||inGlade&&!gap)&&Math.abs(x+28)>7){const s=.75+rand()*.75;if(!inBowl(x,z,7)&&!onExpertFace(x,z)&&Math.hypot(x-expertLoading.x,z-expertLoading.z)>20)a.push({x,z,r:.8,s});}}
 for(let i=0;i<70;i++){
  const z=juniperZ(200+rand()*364);
  const x=bowlX(z)-bowlWidth(z)-8-rand()*45;
  const s=.65+rand()*.5;
  if(x<-195&&x>SNOW_WEST+8&&!onExpertFace(x,z))a.push({x,z,r:.8,s});
 }
 // The trees frame a clear central line and a few pockets for wider turns.
 for(let i=0;i<32;i++){
  const z=188+i*4+rand()*4;
  const side=i%2===0?-1:1;
  const x=timberX(z)+side*(4.5+rand()*6);
  if(x<16)continue;
  const point=liftWorld(EXPERT,x,timberlineZ(z));
  a.push({...point,r:.8,s:.5+rand()*.45});
 }
 for(let i=0;i<38;i++){
  const side=i%2===0?-1:1;
  const x=-25+side*(48+rand()*110);
  const z=SNOW_NORTH+8+rand()*54;
  a.push({x,z,r:.8,s:.65+rand()*.65});
 }
 for(let i=0;i<100;i++){
  const x=-848+rand()*436,z=260+rand()*218;
  const slope=Math.hypot(height(x+2,z)-height(x-2,z),height(x,z+2)-height(x,z-2))/4;
  if(slope<.92&&height(x,z)<312&&Math.abs(expertLocal(x,z).x)>18&&!inBowl(x,z,9)&&!onExpertFace(x,z)){
   a.push({x,z,r:.8,s:.5+rand()*.6});
  }
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
 const expert=expertLine(p.x,p.z);
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
 const oldY=p.y,oldGroundV=p.groundV,dx=Math.sin(p.angle)*p.speed*dt,dz=Math.cos(p.angle)*p.speed*dt;p.x=clamp(p.x+dx,SNOW_WEST+10,SNOW_EAST-10);p.z=clamp(p.z+dz,SNOW_NORTH+12,657);p.distance+=Math.hypot(dx,dz);const ground=height(p.x,p.z);
 if(!p.air&&input.jump&&p.speed>1){p.air=true;p.vy=oldGroundV+7;p.airtime=0;events.push('takeoff');}else if(!p.air&&ground<oldY+oldGroundV*dt-.075&&p.speed>5){p.air=true;p.vy=oldGroundV;p.airtime=0;events.push('takeoff');}
 if(p.air){p.vy-=g*dt;p.y+=p.vy*dt;p.airtime+=dt;if(p.y<=ground){p.y=ground;p.air=false;p.vy=0;if(p.airtime>.25){p.jumps++;events.push('land');}p.groundV=0;}}else{p.y=ground;p.groundV=clamp((ground-oldY)/dt,-20,20);}
 for(const o of colliders){const d=Math.hypot(p.x-o.x,p.z-o.z),radius=(o.r??.8)+.4;if(d<radius&&p.y-ground<5&&p.bump<=0){const nx=(p.x-o.x)/(d||1),nz=(p.z-o.z)/(d||1);p.x=o.x+nx*(radius+.4);p.z=o.z+nz*(radius+.4);p.speed*=.25;p.bump=.8;events.push('bump');}}
 const route=trailAt(p.x,p.z);
 if(route&&(expert||p.z>juniperZ(105)&&p.z<570)){if(route.name!==p.route){p.route=route.name;events.push('route');}p.lastRoute=route.name;}
 const returnedToBase=p.z>585&&p.x>-86;
 const returnedToExpert=p.activeLift===EXPERT&&boardingLift(p)===EXPERT;
 if(p.passedTop&&(returnedToBase||returnedToExpert)){p.laps++;p.passedTop=false;events.push('lap');}
 if(p.z>590&&returnedToBase){if(!input.tuck)p.speed=Math.max(0,p.speed-4*dt);p.route='Lift base';}
 return events;}

