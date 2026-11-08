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
export function expertLocal(x,z){
 const dx=x-EXPERT.x,dz=z-EXPERT.z,cos=Math.cos(EXPERT.yaw),sin=Math.sin(EXPERT.yaw);
 return {x:sin*dz-cos*dx,z:sin*dx+cos*dz};
}
export function expertFaceX(z){return 35+17*smooth((z-28)/60)-33*smooth((z-244)/120);}
export const expertRoute={id:'expert',name:'Timberline Face',color:'#414e61'};
export const chuteRoute={id:'chute',name:'Splitrock Chute',color:'#493d58'};
export const timberRoute={id:'timber',name:'Pine Thread',color:'#466956'};
export const bailoutRoute={id:'bailout',name:'Juniper Traverse',color:'#41778a'};
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
 return ground+5.1+blend*(chord-ground+7.9-Math.sin(t*Math.PI)*.65);
}
export function liftGround(lift,x,z){
 const point=liftWorld(lift,x,z);
 return height(point.x,point.z);
}
export const chairProgress=t=>t-.86*Math.sin(t*2*Math.PI)/(2*Math.PI);
export const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
export const smooth=t=>{t=clamp(t,0,1);return t*t*(3-2*t);};
// Survey points from the upper Timberline Face to the floor of Juniper Bowl.
const traverseSurvey=[
 [-397,555,193],[-355,535,172],[-328,505,154],[-331,462,136],
 [-359,420,114],[-379,376,91],[-355,342,73],[-321,326,64],[-288,336,57]
];
function spline(a,b,c,d,t){
 return b+.5*t*(c-a+t*(2*a-5*b+4*c-d+t*(3*(b-c)+d-a)));
}
export const traversePoints=traverseSurvey.flatMap((point,i,points)=>{
 if(i===points.length-1)return [{x:point[0],z:point[1],y:point[2]}];
 const before=points[Math.max(0,i-1)],after=points[Math.min(i+2,points.length-1)];
 return Array.from({length:5},(_,j)=>{
  const values=point.map((value,k)=>spline(before[k],value,points[i+1][k],after[k],j/5));
  return {x:values[0],z:values[1],y:values[2]};
 });
});
const traverseSegments=traversePoints.slice(1).map((end,i)=>{
 const start=traversePoints[i],dx=end.x-start.x,dz=end.z-start.z;
 return {start,end,dx,dz,lengthSquared:dx*dx+dz*dz};
});
function surveyValue(progress,axis){
 const index=Math.min(traverseSurvey.length-2,Math.floor(progress));
 return spline(traverseSurvey[Math.max(0,index-1)][axis],traverseSurvey[index][axis],
  traverseSurvey[index+1][axis],traverseSurvey[Math.min(traverseSurvey.length-1,index+2)][axis],progress-index);
}
export function traverseAt(x,z){
 if(x<-435||x>-250||z<289||z>593)return null;
 let best=39*39,progress=-1;
 for(let i=0;i<traverseSegments.length;i++){
  const {start,dx,dz,lengthSquared}=traverseSegments[i];
  const rx=x-start.x,rz=z-start.z;
  const t=clamp((rx*dx+rz*dz)/lengthSquared,0,1);
  const distance=(rx-dx*t)**2+(rz-dz*t)**2;
  if(distance<best){
   best=distance;
   progress=(i+t)/5;
  }
 }
 if(progress<0)return null;
 // Refine on the continuous curve so a turn cannot step between flat chords.
 const end=traverseSurvey.length-1,epsilon=.005;
 for(let i=0;i<3;i++){
  const left=clamp(progress-epsilon,0,end),right=clamp(progress+epsilon,0,end);
  const dx=(surveyValue(right,0)-surveyValue(left,0))/(right-left);
  const dz=(surveyValue(right,1)-surveyValue(left,1))/(right-left);
  const correction=((x-surveyValue(progress,0))*dx+(z-surveyValue(progress,1))*dz)/(dx*dx+dz*dz);
  progress=clamp(progress+correction,0,end);
 }
 const distance=Math.hypot(x-surveyValue(progress,0),z-surveyValue(progress,1));
 return distance<38?{y:surveyValue(progress,2),distance,progress:progress*5}:null;
}
export const expertRocks=[
 [112,-13,3.9],[120,-14.5,4.6],[138,12.5,4.1],[147,15.5,4.9],
 [167,-12,4.3],[173,-15,3.7],[191,12,4.1],[207,13,4.8],
 [223,-13,4.5],[241,13.5,3.7],[262,13,3.4],[273,-14,2.9]
].map(([z,offset,size])=>({...liftWorld(EXPERT,chuteX(z)+offset,z),size,r:size*.78}));
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
 const traverse=traverseAt(x,z);
 if(traverse&&traverse.distance<11&&traverse.progress>1&&traverse.progress<traverseSegments.length-1)return bailoutRoute;
 const expert=expertLine(x,z);
 if(expert)return expert;
 if(inBowl(x,z)&&Math.abs(x-pathX(z,groomer))>groomer.width)return bowlRoute;
 if(z<85||z>570)return null;
 return routes.reduce((a,b)=>Math.abs(x-pathX(z,a))<Math.abs(x-pathX(z,b))?a:b);
}
export function onTrail(x,z){return z<90||z>570||inBowl(x,z)||onExpertFace(x,z)||(traverseAt(x,z)?.distance??Infinity)<12||routes.some(r=>Math.abs(x-pathX(z,r))<r.width);}
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
 if(x<-35){
  const local=expertLocal(x,z);
  const shelf=1-smooth((local.z-356)/34);
  // Carry the summit west into the enclosing ridge. Fan the north shoulder
  // out uphill and narrow its toe where it meets the existing Juniper runs.
  const shoulderWidth=96+160*smooth((-x-287)/205);
  const northDistance=Math.max(0,-local.x-9);
  const contour=(12*Math.sin(local.z*.028)+5*Math.sin(local.z*.059+1.2))*smooth(northDistance/40);
  const southSlope=1-smooth((local.x-118)/40);
  const northSlope=1-smooth(northDistance/(shoulderWidth+contour));
  const crossSlope=local.x>=-9?southSlope:northSlope;
  const fall=1-smooth((local.z-25)/310);
  const ridgeBack=smooth((-local.z-22)/100)*23;
  const drainage=smooth((northDistance-19)/36)*(1-smooth((northDistance-143)/65));
  const upperGully=(local.z+64-northDistance*.32)/20;
  const lowerGully=(local.z-36-northDistance*.42)/24;
  const erosion=drainage*(37*Math.exp(-upperGully*upperGully)+29*Math.exp(-lowerGully*lowerGully));
  y+=(198*fall*shelf+ridgeBack-erosion)*crossSlope+expertRelief(local.x,local.z);
  const terminalWidth=1-smooth((Math.abs(local.x)-20)/12);
  const summitDeck=terminalWidth*(1-smooth((Math.abs(local.z)-11)/18));
  const loadingDeck=terminalWidth*(1-smooth((Math.abs(local.z-EXPERT.bottom)-11)/24));
  y+=(211-y)*summitDeck+(3.4-y)*loadingDeck;
 }
 const traverse=traverseAt(x,z);
 if(traverse){
  const width=1-smooth((traverse.distance-9)/29);
  const ends=smooth(traverse.progress/3)*smooth((traverseSegments.length-traverse.progress)/5);
  y+=(traverse.y-y)*width*ends;
 }
 if(x<-304&&x>-492&&z>321&&z<504){
  const shoulder=smooth((x+492)/45)*(1-smooth((x+347)/43));
  const taper=smooth((z-321)/42)*(1-smooth((z-460)/44));
  const trailClearance=smooth(((traverse?.distance??38)-14)/19);
  const roll=Math.sin(x*.045+z*.025)+.48*Math.sin(z*.11-x*.036);
  y+=roll*3.4*shoulder*taper*trailClearance;
 }
 for(const j of jumps){const d=z-j.z;if(Math.abs(x)<j.width){if(d>=-17&&d<0)y+=j.h*smooth((d+17)/17);else if(d>=0&&d<2)y+=j.h*(1-smooth(d/2));}}return y;}
export function obstacles(){const a=[];let seed=7182;function rand(){seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;}for(let i=0;i<900;i++){const z=95+rand()*465,x=-190+rand()*380;const near=routes.reduce((a,b)=>Math.abs(x-pathX(z,a))<Math.abs(x-pathX(z,b))?a:b),distance=Math.abs(x-pathX(z,near));const inGlade=near.id==='glades'&&distance<34;const gap=inGlade?Math.abs(x-pathX(z,near))<6:false;if((distance>near.width+7||inGlade&&!gap)&&Math.abs(x+28)>7){const s=.75+rand()*.75;if(!inBowl(x,z,7)&&!onExpertFace(x,z)&&Math.hypot(x-expertLoading.x,z-expertLoading.z)>20)a.push({x,z,r:.8,s});}}
 for(let i=0;i<70;i++){
  const z=200+rand()*364;
  const x=bowlX(z)-bowlWidth(z)-8-rand()*45;
  const s=.65+rand()*.5;
  if(x<-195&&x>SNOW_WEST+8&&!onExpertFace(x,z)&&(traverseAt(x,z)?.distance??Infinity)>15)a.push({x,z,r:.8,s});
 }
 // The trees frame a clear central line and a few pockets for wider turns.
 for(let i=0;i<32;i++){
  const z=188+i*4+rand()*4;
  const side=i%2===0?-1:1;
  const x=timberX(z)+side*(4.5+rand()*6);
  if(x<16)continue;
  const point=liftWorld(EXPERT,x,z);
  a.push({...point,r:.8,s:.5+rand()*.45});
 }
 for(let i=15;i<36;i++){
  const point=traversePoints[i],next=traversePoints[i+1];
  const dx=next.x-point.x,dz=next.z-point.z,length=Math.hypot(dx,dz);
  const offset=(22+rand()*11)*(i%3===0?-1:1);
  const x=point.x-dz*offset/length,z=point.z+dx*offset/length;
  if(inBowl(x,z,6)||(traverseAt(x,z)?.distance??38)<20)continue;
  const grade=Math.hypot(height(x+1,z)-height(x-1,z),height(x,z+1)-height(x,z-1))/2;
  if(grade<.85)a.push({x,z,r:.8,s:.58+rand()*.5});
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
 const expert=expertLine(p.x,p.z),traverse=traverseAt(p.x,p.z);
 const downhillGrade=expert||traverse?.distance<12
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
 if(route&&(expert||p.z>105&&p.z<570)){if(route.name!==p.route){p.route=route.name;events.push('route');}p.lastRoute=route.name;}
 const returnedToBase=p.z>585&&p.x>-86;
 const returnedToExpert=p.activeLift===EXPERT&&boardingLift(p)===EXPERT;
 if(p.passedTop&&(returnedToBase||returnedToExpert)){p.laps++;p.passedTop=false;events.push('lap');}
 if(p.z>590&&returnedToBase){if(!input.tuck)p.speed=Math.max(0,p.speed-4*dt);p.route='Lift base';}
 return events;}

