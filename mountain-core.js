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
export const liftTowers=[12,65,118,170,225,275,330,380,435,485,590,622].map(juniperZ);
export const JUNIPER={id:'juniper',name:'Juniper Chair',center:LIFT.towerX,top:SUMMIT_TERMINAL,bottom:BASE.z,
 rideSeconds:RIDE_SECONDS,towers:liftTowers,x:0,z:0,yaw:0,hand:1};
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
 x:-465,z:510,yaw:1.45,hand:-1};
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
export const bowlRoute={id:'bowl',name:'Juniper Powder Bowl',color:'#638b91'};
export const driftRoute={id:'drift',name:'Snowdrift Glade',color:'#527d66'};
export const ridgeDropRoute={id:'ridge-drop',name:'Snowdrift Ridge Drop',color:'#986044'};
const driftStart=juniperZ(32),driftEnd=juniperZ(300);
const driftExitStart=juniperZ(263),driftExitEnd=juniperZ(310);
export function driftX(section){
 return -65-210*smooth((section-34)/130)+26*smooth((section-225)/60)
  +9*Math.sin((section-120)*.039)*smooth((section-100)/55);
}
function driftMainX(section){return driftX(section)+9*Math.sin(section*.066);}
function driftEntryX(z){
 const section=juniperSection(z);
 return -22+(driftMainX(section)+22)*smooth((section-11)/41);
}
function driftEntryMask(x,z){
 if(x>=-37||x<=-296||z<=-238||z>=-18)return 0;
 const width=1-smooth((Math.abs(x-driftEntryX(z))-16)/23);
 return width*smooth((-x-37)/17)*smooth((z+238)/36)*(1-smooth((z+87)/69));
}
function driftOuterX(section){
 const split=smooth((section-96)/36)*(1-smooth((section-228)/40));
 const outer=driftX(section)-41+12*Math.sin(section*.078+1.5);
 return driftMainX(section)+(outer-driftMainX(section))*split;
}
export function driftExitX(section){
 const main=driftMainX(section),merge=smooth((section-267)/34);
 const z=juniperZ(section);
 // Stay on the floor as the lower bowl bends around the Timberline flank.
 const trough=-5+22*smooth((z-257)/34)+20*smooth((z-288)/54)
  -54*smooth((z-405)/77)+29*smooth((z-482)/21)-12*smooth((z-505)/30);
 return main+(bowlX(z)+trough-main)*merge;
}
const ridgeStartX=-259,ridgeStartZ=176;
const ridgeDirectionX=102/238;
const ridgePlanLength=Math.hypot(ridgeDirectionX,1);
const ridgeGrade=.30;
export function ridgeDropX(z){
 if(z>440){
  const join=ridgeStartX+(440-ridgeStartZ)*ridgeDirectionX-.30*22*smooth(22/40);
  return join+.13*(z-440)+52*smooth((z-455)/106);
 }
 const after=Math.max(0,z-418);
 return ridgeStartX+(z-ridgeStartZ)*ridgeDirectionX-.30*after*smooth(after/40);
}
export function ridgeDropLip(x){
 return 414+.15*(x+157)+3.7*Math.sin((x+158)*.105)+1.1*Math.sin((x+158)*.27);
}
export function ridgeDropMask(x,z){
 if(x<-330||x>10||z<=151||z>=586)return 0;
 const across=x-ridgeDropX(z);
 // Carry the landing around the flank and into the lift clearing, instead of
 // blending back up onto the higher snow immediately below the cliff.
 const runout=(1-smooth((Math.abs(across)-40)/20))*(1-smooth((z-560)/26));
 if(z>=460)return runout;
 if(x>-90&&z<=440)return 0;
 const width=smooth((z-190)/64);
 // Open the run-up toward the bowl where skiers naturally swing wide.
 const core=across<0?23+25*width:23+16*width;
 const sides=1-smooth((Math.abs(across)-core)/18);
 const clearGroomer=smooth((pathX(z,groomer)-groomer.width-x)/9);
 const runup=sides*clearGroomer*smooth((z-151)/40);
 // Hold a fixed cross section across the final approach. A moving trail-edge
 // blend here can flatten the snow immediately before the cliff.
 const finalSides=smooth((x+246)/24)*(1-smooth((x+109)/15));
 const finalApproach=finalSides*smooth((z-ridgeDropLip(x)+61)/25);
 const approach=Math.max(runup,finalApproach);
 return approach+(runout-approach)*smooth((z-440)/20);
}
export function driftDepth(x,z){
 if(x>=-54||x<=-398||z<driftStart||z>driftEnd)return 0;
 const section=juniperSection(z),width=48+50*smooth((section-60)/74);
 const edge=1-smooth((Math.abs(x-driftX(section))-width*.58)/(width*.42));
 const entry=smooth((section-32)/47),exit=1-smooth((section-252)/48);
 const clearGroomer=smooth((pathX(z,groomer)-groomer.width-x-8)/32);
 return edge*entry*exit*clearGroomer*smooth((-x-54)/25);
}
// Short powder lips have open approaches and landings; the wider lines pass around them.
export const driftHits=[
 {section:108,offset:-28,h:1.65,width:7,approach:13,landing:7},
 {section:144,offset:23,h:2.4,width:9,approach:17,landing:8},
 {section:178,offset:-36,h:2.1,width:8,approach:14,landing:7},
 {section:208,offset:33,h:2.65,width:10,approach:17,landing:9},
 {section:240,offset:-21,h:1.8,width:8,approach:14,landing:8}
].map(hit=>({...hit,x:driftX(hit.section)+hit.offset,z:2*Math.round(juniperZ(hit.section)/2)}));
export const ridgeGladeDepth=(x,z)=>ridgeDropMask(x,z)*(1-smooth((z-478)/54));
export const snowDepth=(x,z)=>Math.max(driftDepth(x,z),powderDepth(x,z),ridgeGladeDepth(x,z),powderToGladeMask(x,z));
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
export function powderCenterZ(x){
 const west=-x-290;
 return 305+145*smooth(west/410)+.08*west;
}
const bowlMergeStart=-408,bowlMergeEnd=-184;
export function powderToGladeZ(x){
 const bend=clamp((x+358)/(bowlMergeEnd+358),0,1);
 return powderCenterZ(x)+54.5*bend**4.2;
}
export function powderToGladeMask(x,z){
 if(x<=bowlMergeStart||x>=bowlMergeEnd+20||z<244||z>416)return 0;
 const cross=1-smooth((Math.abs(z-powderToGladeZ(x))-24)/31);
 const ends=smooth((x-bowlMergeStart)/54)*(1-smooth((x-bowlMergeEnd)/20));
 // Leave the actual cliff edge and landing to the glade terrain.
 return cross*ends*(1-smooth((z-ridgeDropLip(x)+23)/16));
}
export function powderDepth(x,z){
 const lower=inBowl(x,z)&&Math.abs(x-pathX(z,groomer))>groomer.width;
 if(x>-287||x<-755||z<205||z>590)return lower?1:0;
 const width=48+43*smooth((x+690)/140);
 const edge=1-smooth((Math.abs(z-powderCenterZ(x))-width*.62)/(width*.38));
 const entry=smooth((x+755)/52);
 const merge=1-smooth((x+327)/40);
 const offLift=smooth((-expertLocal(x,z).x-12)/21);
 return Math.max(lower?1:0,edge*entry*merge*offLift);
}
export function powderCliffX(z){
 return -455+.24*(z-373)+3.4*Math.sin((z-356)*.11);
}
export function powderCliffSpan(z){
 // The lip spans the powder corridor and tapers into the banks on either side.
 return smooth((z-262)/30)*(1-smooth((z-454)/22));
}
export function powderCliffOffset(x,z){
 if(x<=-520||x>=-422||z<=262||z>=476)return Infinity;
 return x-powderCliffX(z);
}
// Staggered outcrops frame the opening, then sit on either side of the chute.
export const bowlRocks=[
 {z:180,offset:-20,size:4.4},{z:187,offset:-23,size:3.1},
 {z:208,offset:21,size:3.2},{z:216,offset:24,size:2.6},
 {z:266,offset:-33,size:3.1},{z:285,offset:-39,size:2.7}
].map(({z:section,offset,size})=>{
 const z=juniperZ(section);
 return {x:bowlX(z)+offset,z,size,r:size*.83};
});
export function trailAt(x,z){
 const expert=expertLine(x,z);
 if(expert)return expert;
 if(ridgeDropMask(x,z)>.55)return driftRoute;
 if(powderToGladeMask(x,z)>.4)return x<-260?bowlRoute:driftRoute;
 if(driftDepth(x,z)>.22)return driftRoute;
 if(powderDepth(x,z)>.2)return bowlRoute;
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
// A broad wooded shoulder connects Snowdrift to the Groomer. Keep both ski
// lanes at their existing elevations and remove the narrow divider between.
export function gladeBoundary(z){
 const upper=driftMainX(juniperSection(z))+28;
 const lower=ridgeDropX(z)+30;
 const west=upper+(lower-upper)*smooth((z-145)/60);
 return {west,east:pathX(z,groomer)-groomer.width};
}
export function height(x,z){
 const y=mountainHeight(x,z);
 if(z<=-170||z>=391)return y;
 const {west,east}=gladeBoundary(z);
 if(x<=west||x>=east||east-west<20)return y;
 const t=(x-west)/(east-west);
 const left=mountainHeight(west,z),right=mountainHeight(east,z);
 const shoulder=left+(right-left)*smooth(t)
  +.38*Math.sin(z*.047+x*.039)*Math.sin(Math.PI*t)**2;
 const blend=smooth((z+170)/45)*(1-smooth((z-363)/28));
 return y+(shoulder-y)*blend;
}
function mountainHeight(x,z){let y=baseHeight(z);const edge=smooth((Math.abs(x)-130)/80);y+=edge*(6+Math.sin(z*.021)*3);
 if(x<-54&&x>-398&&z>driftStart&&z<driftEnd){
  const depth=driftDepth(x,z);
  // A shallow drainage draws the snow toward the lower bowl; waves leave some room for turns.
  const section=juniperSection(z);
  const pitch=-12*smooth((section-70)/139)*(1-smooth((section-228)/65));
  const driftRoll=1.9*Math.sin(z*.038+x*.022)+.82*Math.sin(z*.096-x*.054);
  y+=depth*(-11+pitch+driftRoll);
  for(const hit of driftHits){
   const d=z-hit.z;
   if(d< -hit.approach||d>hit.landing||Math.abs(x-hit.x)>=hit.width)continue;
   const cross=1-smooth((Math.abs(x-hit.x)/hit.width-.27)/.73);
   const face=d<0?(1+d/hit.approach)**2:(1-d/hit.landing)**2;
   y+=hit.h*cross*face;
  }
 }
 if(z>bowlStart&&z<bowlEnd){
  const section=juniperSection(z);
  const distance=x-bowlX(z),width=bowlWidth(z);
  const lip=smooth((section-185)/42)*(1-smooth((section-232)/38));
  const basin=smooth((section-230)/75)*(1-smooth((section-365)/211));
  const floor=1-smooth(Math.max(0,Math.abs(distance)-width*.53)/(width*.64+9));
  const chute=smooth((section-251)/35)*(1-smooth((section-303)/115));
  const chuteWidth=1-smooth(Math.abs(distance+26)/19);
  const ridgeDistance=Math.abs(x-pathX(z,groomer)+67);
  const ridge=(1-smooth(ridgeDistance/37))*smooth((section-226)/70)*(1-smooth((section-446)/90));
  y+=floor*(4*lip-15*basin)-12*chute*chuteWidth+26*ridge;
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
 if(x>-444&&x<-250){
  // Round the former divide where the new bowl rolls into the old trough.
  const across=z-powderCenterZ(x);
  const width=1-smooth((Math.abs(across)-37)/28);
  const ends=smooth((x+444)/56)*(1-smooth((x+281)/31));
  const runout=78+(-x-280)*1.02+.18*across;
  y+=(runout-y)*width*ends;
 }
 const cliffOffset=powderCliffOffset(x,z);
 if(cliffOffset>-29&&cliffOffset<2.4){
  const shelf=smooth((cliffOffset+29)/22)*(1-smooth(cliffOffset/2.4));
  y+=powderCliffSpan(z)*shelf*(12+2.5*Math.sin(z*.085));
 }
 if(x>-321&&x<-199&&z>driftExitStart&&z<driftExitEnd){
  const s=juniperSection(z),across=x-driftExitX(s);
  const blend=smooth((s-263)/11)*(1-smooth((s-294)/16))*(1-smooth((Math.abs(across)-13)/22));
  const runout=114-(s-263)*.74+.10*across;
  y+=(runout-y)*blend;
 }
 const ridge=ridgeDropMask(x,z);
 if(ridge>0){
  // Use one plane from the fork to the lip so the grade is steady across the lane.
  const run=(z-ridgeStartZ+(x-ridgeStartX)*ridgeDirectionX)/ridgePlanLength;
  const pitch=114-ridgeGrade*run;
  const fromLip=z-ridgeDropLip(x);
  const drop=21*smooth(fromLip/3);
  const landing=(ridgeGrade/ridgePlanLength-.10)*Math.max(0,fromLip-3);
  let floor=pitch-drop+landing;
  if(z>440){
   // Every part of the wide landing descends to the station elevation. Let
   // its crossfall relax with the descent so the low side never climbs out.
   const joinX=ridgeDropX(440)+x-ridgeDropX(z);
   const joinRun=(440-ridgeStartZ+(joinX-ridgeStartX)*ridgeDirectionX)/ridgePlanLength;
   const joinLip=440-ridgeDropLip(joinX);
   const joinHeight=114-ridgeGrade*joinRun-21
    +(ridgeGrade/ridgePlanLength-.10)*(joinLip-3);
   floor=3.4+(joinHeight-3.4)*(1-clamp((z-440)/110,0,1))**1.35;
   if(z>=550)floor=Math.min(y,floor);
  }
  // Small wind pillows break up the planar approach without taking away its
  // continuous downhill grade or rounding away the actual cliff edge.
  const pillows=(.28*Math.sin(x*.058+z*.046)+.12*Math.sin(z*.16-x*.09))
   *smooth((z-184)/30)*(1-smooth((z-398)/15));
  floor+=pillows;
  y+=(floor-y)*ridge;
 }
 const bowlMerge=powderToGladeMask(x,z);
 let apron=0;
 if(x>-366&&x<-197&&z>160&&z<428){
  // Carry the bowl floor across the pockets on either side of the main line.
  const width=smooth((x+366)/42)*(1-smooth((x+217)/20));
  const extent=smooth((z-160)/76)*(1-smooth((z-397)/31));
  const cliff=smooth((ridge-.25)/.40)*smooth((z-ridgeDropLip(x))/4);
  apron=width*extent*(1-cliff);
 }
 if(bowlMerge>0||apron>0){
  // Ease the upper shoulder into the approach from Snowdrift.
  const center=powderToGladeZ(x),north=Math.max(0,center-z-22);
  const shoulderZ=z+.72*north-5.76*Math.tanh(north/8);
  const along=(shoulderZ-ridgeStartZ+(x-ridgeStartX)*ridgeDirectionX)/ridgePlanLength;
  const remaining=1-clamp((x-bowlMergeStart)/(bowlMergeEnd-bowlMergeStart),0,1);
  const floor=114-ridgeGrade*along+125*remaining**2.25;
  // Outside the main line, fill low snow without cutting new depressions.
  y+=(floor-y)*(floor>y?Math.max(bowlMerge,apron):bowlMerge);
 }
 const entry=driftEntryMask(x,z);
 if(entry>0){
  // The short glide from the summit carries into the open upper glade.
  const run=z+229;
  const pitch=222-.32*run+.00065*run**2;
  y+=Math.min(0,pitch-y)*entry;
 }
 for(const j of jumps){const d=z-j.z;if(Math.abs(x)<j.width){if(d>=-17&&d<0)y+=j.h*smooth((d+17)/17);else if(d>=0&&d<2)y+=j.h*(1-smooth(d/2));}}return y;}
export function obstacles(){const a=[];let seed=7182;function rand(){seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;}for(let i=0;i<900;i++){const z=juniperZ(95+rand()*465),x=-190+rand()*380;const near=routes.reduce((a,b)=>Math.abs(x-pathX(z,a))<Math.abs(x-pathX(z,b))?a:b),distance=Math.abs(x-pathX(z,near));const inGlade=near.id==='glades'&&distance<34;const gap=inGlade?Math.abs(x-pathX(z,near))<6:false;if((distance>near.width+7||inGlade&&!gap)&&Math.abs(x+28)>7){const s=.75+rand()*.75;if(!inBowl(x,z,7)&&!onExpertFace(x,z)&&driftDepth(x,z)<.14&&Math.hypot(x-expertLoading.x,z-expertLoading.z)>20)a.push({x,z,r:.8,s});}}
 for(let i=0;i<70;i++){
  const z=juniperZ(200+rand()*364);
  const x=bowlX(z)-bowlWidth(z)-8-rand()*45;
  const s=.65+rand()*.5;
  if(x<-195&&x>SNOW_WEST+8&&!onExpertFace(x,z)&&powderDepth(x,z)<.26)a.push({x,z,r:.8,s});
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
  if(slope<.92&&height(x,z)<312&&Math.abs(expertLocal(x,z).x)>18&&powderDepth(x,z)<.26&&!inBowl(x,z,9)&&!onExpertFace(x,z)){
   a.push({x,z,r:.8,s:.5+rand()*.6});
  }
 }
 const planted=[];
 for(let i=0;i<1900&&planted.length<215;i++){
  const section=41+246*rand(),z=juniperZ(section),center=driftX(section),x=center+(rand()-.5)*218;
  const depth=driftDepth(x,z);
  if(depth<.12)continue;
  if(Math.abs(x-driftMainX(section))<9||Math.abs(x-driftOuterX(section))<10)continue;
  if(driftHits.some(hit=>Math.abs(x-hit.x)<hit.width+5&&z>hit.z-hit.approach-9&&z<hit.z+hit.landing+14))continue;
  const islands=.5+.24*Math.sin(x*.075+z*.056)+.21*Math.cos(z*.092-x*.038);
  if(rand()>islands||planted.some(t=>(x-t.x)**2+(z-t.z)**2<51))continue;
  const s=.53+rand()*.72;
  planted.push({x,z,s,r:.55+s*.27});
 }
 a.push(...planted);
 const existing=a.filter(tree=>{
  if(ridgeDropMask(tree.x,tree.z)>=.18)return false;
  if(tree.z>-224&&tree.z<-32&&Math.abs(tree.x-driftEntryX(tree.z))<31)return false;
  return tree.z<driftExitStart||tree.z>driftExitEnd
   ||Math.abs(tree.x-driftExitX(juniperSection(tree.z)))>17;
 });
 // Continue the forest through the former cleared jump lane. Irregular tree
 // islands leave several skiable gaps, with an open flight and landing zone.
 const lowerGlade=[];
 for(let i=0;i<1800&&lowerGlade.length<135;i++){
  const z=181+rand()*321,across=(rand()-.5)*114,x=ridgeDropX(z)+across;
  if(ridgeDropMask(x,z)<.65)continue;
  if(Math.abs(across)<7||Math.abs(Math.abs(across)-24)<4.8)continue;
  if(z>ridgeDropLip(x)-6&&z<474&&Math.abs(across)<34)continue;
  if(Math.abs(x-driftExitX(juniperSection(z)))<17)continue;
  if(z>474&&Math.abs(across)<15)continue;
  const islands=.54+.25*Math.sin(x*.073+z*.049)+.18*Math.cos(z*.087-x*.052);
  if(rand()>islands||lowerGlade.some(t=>(t.x-x)**2+(t.z-z)**2<53)
   ||existing.some(t=>(t.x-x)**2+(t.z-z)**2<37))continue;
  const slope=Math.hypot(height(x+1,z)-height(x-1,z),height(x,z+1)-height(x,z-1))/2;
  if(slope>.68)continue;
  const s=.56+rand()*.66;
  lowerGlade.push({x,z,s,r:.55+s*.27});
 }
 // A few mature trees reach almost to the edge; the cliff emerges from the
 // forest rather than sitting at the end of a fenced-off, bare runway.
 for(const [z,across,s] of [[396,-13,.96],[405,12,1.08],[409,37,.79]]){
  const x=ridgeDropX(z)+across;
  if(!lowerGlade.some(t=>(t.x-x)**2+(t.z-z)**2<36))lowerGlade.push({x,z,s,r:.55+s*.27});
 }
 const shoulderTrees=[];
 for(let i=0;i<2400&&shoulderTrees.length<175;i++){
  const z=-122+rand()*490,{west,east}=gladeBoundary(z);
  if(east-west<29)continue;
  const x=west+8+rand()*(east-west-15);
  if(Math.abs(x-driftExitX(juniperSection(z)))<17)continue;
  if(driftHits.some(hit=>Math.abs(x-hit.x)<hit.width+5&&z>hit.z-hit.approach-9&&z<hit.z+hit.landing+14))continue;
  if(existing.some(t=>(t.x-x)**2+(t.z-z)**2<24)
   ||lowerGlade.some(t=>(t.x-x)**2+(t.z-z)**2<24)
   ||shoulderTrees.some(t=>(t.x-x)**2+(t.z-z)**2<24))continue;
  const s=.65+rand()*.68;
  shoulderTrees.push({x,z,s,r:.55+s*.27});
 }
 return [...existing,...lowerGlade,...shoulderTrees];
}
export const turnStyles=[
 {id:'normal',label:'Normal turns',grip:8.8,scrub:.42},
 {id:'carve',label:'Carve turns',grip:24,scrub:.16},
 {id:'skid',label:'Short skid turns',grip:6.1,scrub:1.25}
];
export function spawn(){
 return {x:BASE.x,z:BASE.z-10,y:height(BASE.x,BASE.z-10),angle:0,yaw:0,speed:0,measuredSpeed:0,
  travelAngle:null,slip:0,vy:0,groundV:0,air:false,jumps:0,airtime:0,bump:0,mode:'ski',ride:0,laps:0,
  passedTop:false,route:'Lift base',lastRoute:'',distance:0,drive:'glide',skatePhase:0,
  turnStyle:0,edgeAngle:0,spray:0,safeTrail:[],crash:null};
}
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
 p.edgeAngle=0;p.spray=0;
 p.safeTrail=[];
 return true;
}
export const canUnload=p=>p.mode==='lift'&&p.ride>=1;
export function unload(p){
 if(!canUnload(p))return false;
 const lift=p.activeLift;
 // Stand just past the ramp in the same lane, facing down the hill with no push to either side.
 Object.assign(p,liftWorld(lift,lift.center+8,lift.top+7));
 p.y=height(p.x,p.z);
 p.mode='ski';p.angle=lift.yaw;p.speed=0;p.measuredSpeed=0;p.travelAngle=null;p.slip=0;
 p.yaw=0;p.vy=0;p.groundV=0;p.drive='glide';
 p.passedTop=true;
 p.route=lift===EXPERT?'Timberline Summit':'Summit · pick a line';
 return true;
}
const gravity=9.81;
const angleDelta=(target,current)=>Math.atan2(Math.sin(target-current),Math.cos(target-current));
function obstacleDistance(x,z,obstacle){
 const dx=x-obstacle.x,dz=z-obstacle.z;
 if(!obstacle.box)return Math.hypot(dx,dz)-(obstacle.r??.8);
 const {cos,sin,halfWidth,halfDepth}=obstacle.box;
 const across=Math.abs(dx*cos-dz*sin)-halfWidth;
 const along=Math.abs(dx*sin+dz*cos)-halfDepth;
 return Math.hypot(Math.max(0,across),Math.max(0,along))+Math.min(0,Math.max(across,along));
}
function obstacleNormal(x,z,obstacle,forwardX,forwardZ){
 let nx=x-obstacle.x,nz=z-obstacle.z;
 if(obstacle.box){
  const e=.04;
  nx=obstacleDistance(x+e,z,obstacle)-obstacleDistance(x-e,z,obstacle);
  nz=obstacleDistance(x,z+e,obstacle)-obstacleDistance(x,z-e,obstacle);
 }
 const length=Math.hypot(nx,nz);
 return length?[nx/length,nz/length]:[-forwardX,-forwardZ];
}
const obstacleTop=o=>o.top??height(o.x,o.z)+(o.size??5);
function safeRecovery(x,z,colliders){
 if(x<SNOW_WEST+12||x>SNOW_EAST-12||z<SNOW_NORTH+14||z>655)return false;
 if(colliders.some(o=>obstacleDistance(x,z,o)<2.3))return false;
 const grade=Math.hypot(height(x+1,z)-height(x-1,z),height(x,z+1)-height(x,z-1))/2;
 return grade<1.8;
}
function crashRecovery(p,colliders){
 const impactHeight=height(p.x,p.z);
 const trail=(p.safeTrail??[]).filter(s=>{
  const back=p.distance-s.distance,d=Math.hypot(p.x-s.x,p.z-s.z);
  return back>=7&&back<=15&&d>=6&&d<=16&&s.y>=impactHeight-1&&safeRecovery(s.x,s.z,colliders);
 }).sort((a,b)=>Math.abs(p.distance-a.distance-10)-Math.abs(p.distance-b.distance-10));
 if(trail.length)return trail[0];
 // A collision just after a jump may have no nearby grounded breadcrumb.
 // Search uphill on the snow instead of placing the skier back in the air.
 const heading=p.travelAngle??p.angle;
 const uphillX=height(p.x+1,p.z)-height(p.x-1,p.z);
 const uphillZ=height(p.x,p.z+1)-height(p.x,p.z-1);
 const ascent=Math.atan2(uphillX,uphillZ);
 const directions=[heading+Math.PI,ascent,ascent-.4,ascent+.4];
 for(const angle of directions)for(const distance of [10,12,8,14]){
  const x=p.x+Math.sin(angle)*distance,z=p.z+Math.cos(angle)*distance;
  if(height(x,z)>=impactHeight-1&&safeRecovery(x,z,colliders))return {x,z,angle:angle+Math.PI};
 }
 // Dense tree islands can require a small sideways adjustment.
 for(let radius=8;radius<=18;radius+=2)for(let i=0;i<16;i++){
  const angle=ascent+(i%2?1:-1)*Math.ceil(i/2)*Math.PI/8;
  const x=p.x+Math.sin(angle)*radius,z=p.z+Math.cos(angle)*radius;
  if(safeRecovery(x,z,colliders))return {x,z,angle:angle+Math.PI};
 }
 return {x:p.x,z:p.z,angle:heading};
}
function startCrash(p,colliders,nx,nz,impactSpeed){
 const recovery=crashRecovery(p,colliders);
 const heading=p.travelAngle??p.angle,dx=Math.sin(heading),dz=Math.cos(heading);
 const side=nx*dz-nz*dx>=0?1:-1;
 const deflection=.25-Math.min(0,dx*nx+dz*nz);
 const severity=smooth((impactSpeed-4)/13);
 const tumble=impactSpeed>=14;
 const yardSale=impactSpeed>=23;
 const slideHeading=tumble?heading+side*.32:Math.atan2(dx+nx*deflection,dz+nz*deflection);
 p.crash={time:0,duration:1.25+.6*severity,heading,side,severity,tumble,slideHeading,
  slideSpeed:tumble?Math.min(p.speed*.88,28):impactSpeed*.24,
  slideTime:tumble?1.7:.45+.35*severity,
  flying:tumble,verticalSpeed:tumble?2.25+severity*.5:0,yardSale,recovery};
 p.mode='crash';p.air=false;p.vy=0;p.y=height(p.x,p.z);p.speed=0;p.measuredSpeed=0;
 p.yaw=0;p.edgeAngle=0;p.spray=0;p.drive='crash';
}
export function step(p,input,dt,colliders=[]){const events=[];
 if(p.mode==='crash'){
  const crash=p.crash;crash.time+=dt;
  const slide=crash.slideSpeed*Math.max(0,1-crash.time/crash.slideTime)*dt;
  const dx=Math.sin(crash.slideHeading),dz=Math.cos(crash.slideHeading);
  let x=p.x+dx*slide,z=p.z+dz*slide,y=p.y;
  if(crash.flying){
   crash.verticalSpeed-=gravity*dt;
   y+=crash.verticalSpeed*dt;
  }
  if(crash.tumble&&slide>0){
   // Keep forward momentum while sliding around obstacles too tall to clear.
   for(const o of colliders){
    const clearance=obstacleDistance(x,z,o);
    if(clearance>=.4||y>=obstacleTop(o))continue;
    const [nx,nz]=obstacleNormal(x,z,o,dx,dz);
    x+=nx*(.4-clearance);z+=nz*(.4-clearance);
   }
  }
  p.x=clamp(x,SNOW_WEST+12,SNOW_EAST-12);
  p.z=clamp(z,SNOW_NORTH+14,655);
  const snow=height(p.x,p.z);
  if(y<=snow)crash.flying=false;
  p.y=crash.flying?y:snow;
  if(crash.time>=crash.duration){
   const spot=crash.recovery;
   p.x=spot.x;p.z=spot.z;p.y=height(p.x,p.z);p.angle=spot.angle;
   p.mode='ski';p.crash=null;p.safeTrail=[];
   p.travelAngle=null;p.slip=0;p.speed=0;p.measuredSpeed=0;p.groundV=0;p.vy=0;p.airtime=0;
   p.drive='glide';p.bump=0;p.skatePhase=0;
   events.push('respawn');
  }
  return events;
 }
 if(p.mode==='lift'){
  if(canUnload(p))return events;
  const lift=p.activeLift??JUNIPER;
  p.ride=Math.min(1,p.ride+dt/lift.rideSeconds);
  const z=lift.bottom+(lift.top-lift.bottom)*chairProgress(p.ride);
  const point=liftWorld(lift,lift.center+8,z);
  p.x=point.x;p.z=point.z;p.y=liftCableHeight(z,lift)-4.6;
  p.angle=lift.yaw;
  return events;
 }
 p.bump=Math.max(0,p.bump-dt);
 const direction=Number(Boolean(input.left))-Number(Boolean(input.right));
 const style=turnStyles[p.turnStyle]??turnStyles[0];
 const carve=style.id==='carve'&&!input.brake;
 const shortSkid=style.id==='skid';
 const gladeSnow=Math.max(driftDepth(p.x,p.z),ridgeGladeDepth(p.x,p.z));
 const ridge=ridgeDropMask(p.x,p.z);
 const entry=driftEntryMask(p.x,p.z);
 const powder=Math.max(gladeSnow,powderDepth(p.x,p.z));
 const edgeLimit=(11.4-3.4*powder)/Math.max(5,p.speed);
 let turnRate=(input.brake?1.9:1.55)/(1+p.speed*.019);
 if(carve)turnRate=Math.min(turnRate,edgeLimit*.88);
 if(shortSkid)turnRate=Math.max(turnRate,2.45/(1+p.speed*.028));
 if(p.air)turnRate=.76;
 p.yaw+=(direction*turnRate-p.yaw)*(1-Math.exp(-dt*(shortSkid?13:9)));
 p.angle+=p.yaw*dt;

 const eps=.55;
 const fallZ=(height(p.x,p.z-eps)-height(p.x,p.z+eps))/(2*eps);
 const fallX=(height(p.x-eps,p.z)-height(p.x+eps,p.z))/(2*eps);
 const expert=expertLine(p.x,p.z);
 // The skis turn first. Edges bring the momentum around while gravity pulls toward the fall line.
 const previousTravel=p.travelAngle??p.angle;
 let travel=previousTravel;
 if(!p.air){
  if(p.speed<1.2)travel=p.angle;
  else{
   const gripBase=input.brake?5.5:shortSkid&&!direction?14:style.grip;
   const grip=gripBase/(1+p.speed*.081)*(1-powder*.16);
   const edgeTurn=angleDelta(p.angle,travel)*(1-Math.exp(-grip*dt));
   travel+=carve?clamp(edgeTurn,-edgeLimit*dt,edgeLimit*dt):edgeTurn;
   const crossfall=fallX*Math.cos(travel)-fallZ*Math.sin(travel);
   const drift=carve?.18:.54;
   travel+=gravity*crossfall*dt*drift/(Math.max(4,p.speed)*(1+fallX**2+fallZ**2));
  }
 }
 p.travelAngle=travel;
 p.slip=angleDelta(p.angle,travel);
 const sideSlip=Math.sin(p.slip);
 const turnLoad=angleDelta(travel,previousTravel)*p.speed/(gravity*dt);
 const lean=Math.atan(turnLoad);
 const edge=carve?lean*.84:lean*(shortSkid?.22:.34)+p.yaw*(shortSkid?.11:.085);
 const maxEdge=carve?.64:shortSkid?.40:.47;
 const edgeTarget=p.air?0:clamp(edge,-maxEdge,maxEdge)*smooth((p.speed-2)/7);
 p.edgeAngle+=(edgeTarget-p.edgeAngle)*(1-Math.exp(-dt*12));
 p.spray=p.air?0:smooth((p.speed-3)/8)*smooth((Math.abs(sideSlip)-.12)/.48)
  *(shortSkid?1:input.brake?.52:0);
 const forwardX=Math.sin(travel),forwardZ=Math.cos(travel);
 const grade=fallX*forwardX+fallZ*forwardZ;
 const downhillPull=gravity*grade/(1+fallX**2+fallZ**2);

 // Judge skating and tucking from the main slope, beyond any nearby jump lip.
 const headingX=Math.sin(p.angle),headingZ=Math.cos(p.angle);
 const downhillGrade=expert||powder>.2||ridge>.2||entry>.2
  ?(height(p.x-12*headingX,p.z-12*headingZ)-height(p.x+12*headingX,p.z+12*headingZ))/24
  :p.z>=590?0:(baseHeight(p.z-12*headingZ)-baseHeight(p.z+12*headingZ))/24;
 const wasTucking=p.drive==='tuck';
 const canTuck=downhillGrade>=(wasTucking?.055:.085)&&p.speed>=(wasTucking?6:7.5);
 p.drive=input.brake&&!p.air?'brake':'glide';
 if(input.tuck&&!input.brake&&!p.air){
  if(canTuck)p.drive='tuck';
  else if(p.speed<11)p.drive='skate';
 }
 if(p.drive==='skate')p.skatePhase=(p.skatePhase||0)+dt*(1.35+Math.min(6,p.speed)*.07)*Math.PI*2;
 const push=p.drive==='skate'?8.8*Math.max(0,1-p.speed/10)+.9*Math.max(0,Math.sin(p.skatePhase*2)):0;
 const softSnow=powder*(.60+p.speed*.045)-gladeSnow*(.23+p.speed*.01);
 const trailDrag=(onTrail(p.x,p.z)||powder>.2?.30:.72)+softSnow;
 const surfaceDrag=trailDrag+(.18-trailDrag)*Math.max(entry,ridge,powderToGladeMask(p.x,p.z));
 const aeroDrag=(p.drive==='tuck'?.0038:.0058)*p.speed**2;
 const edgeDrag=Math.abs(sideSlip)*p.speed*(input.brake?Math.max(.42,style.scrub):style.scrub);
 const brake=p.drive==='brake'?5.6+p.speed*.32:0;
 const acceleration=p.air?-.0024*p.speed**2:downhillPull+push-surfaceDrag-aeroDrag-edgeDrag-brake;
 p.speed=clamp(p.speed+acceleration*dt,0,39);
 if(!p.air&&p.speed<.05)p.speed=0;

 const oldX=p.x,oldZ=p.z,oldY=p.y,oldGroundV=p.groundV;
 const dx=forwardX*p.speed*dt,dz=forwardZ*p.speed*dt;
 p.x=clamp(p.x+dx,SNOW_WEST+10,SNOW_EAST-10);
 p.z=clamp(p.z+dz,SNOW_NORTH+12,657);
 const actualX=p.x-oldX,actualZ=p.z-oldZ,horizontal=Math.hypot(actualX,actualZ);
 if(horizontal+1e-7<Math.hypot(dx,dz)){
  p.speed=horizontal/dt;
  if(p.speed>.05)p.travelAngle=Math.atan2(actualX,actualZ);
 }
 const ground=height(p.x,p.z);
 const sideHit=powder>.2&&!p.air&&p.speed>9&&dz>0&&driftHits.some(hit=>oldZ<hit.z&&p.z>=hit.z&&Math.abs(p.x-hit.x)<hit.width*.61);
 const powderDrop=powderCliffOffset(oldX,oldZ)<=0&&powderCliffOffset(p.x,p.z)>0
  &&powderCliffSpan(p.z)>.88;
 const ridgeDrop=ridge>.6&&dz>0&&oldZ<=ridgeDropLip(oldX)&&p.z>ridgeDropLip(p.x);
 const cliffDrop=!p.air&&(powderDrop||ridgeDrop);
 const leavesSnow=!p.air&&p.speed>5&&ground<oldY+(oldGroundV-8)*dt;
 if(!p.air&&input.jump&&p.speed>1){
  p.air=true;p.vy=oldGroundV+4.4;p.airtime=0;events.push('takeoff');
 }else if(cliffDrop||sideHit||leavesSnow){
  const launch=cliffDrop?0:sideHit?-.65:oldGroundV;
  p.air=true;p.vy=Math.max(oldGroundV,launch);p.airtime=0;events.push('takeoff');
 }
 // Keep the actual snow pitch through touchdown so steep snow doesn't launch the skis again.
 if(p.air){p.vy-=gravity*dt;p.y+=p.vy*dt;p.airtime+=dt;if(p.y<=ground){p.y=ground;p.air=false;p.vy=0;if(p.airtime>.25){p.jumps++;events.push('land');}p.groundV=(ground-height(oldX,oldZ))/dt;}}else{p.y=ground;p.groundV=(ground-oldY)/dt;}
 // Measure the actual distance in 3D before any collision push-out can move the skier.
 const distance=Math.hypot(horizontal,p.y-oldY);
 p.distance+=distance;
 p.measuredSpeed+=(distance/dt-p.measuredSpeed)*(1-Math.exp(-dt*9));
 for(const o of colliders){
  const clearance=obstacleDistance(p.x,p.z,o);
  if(clearance>=.4||p.bump>0)continue;
  if(p.y>=obstacleTop(o))continue;
  const [nx,nz]=obstacleNormal(p.x,p.z,o,forwardX,forwardZ);
  const inward=Math.max(0,-forwardX*nx-forwardZ*nz);
  const impactSpeed=p.speed*inward;
  const skating=p.drive==='skate'&&!p.air;
  if(!skating&&impactSpeed>=3.3){
   startCrash(p,colliders,nx,nz,impactSpeed);events.push('crash');return events;
  }
  p.x=clamp(p.x+nx*(.8-clearance),SNOW_WEST+10,SNOW_EAST-10);
  p.z=clamp(p.z+nz*(.8-clearance),SNOW_NORTH+12,657);
  if(skating){
   // Preserve the tangent to the obstacle. A square hit turns to one side.
   let vx=forwardX+nx*inward,vz=forwardZ+nz*inward;
   if(Math.hypot(vx,vz)<.15){
    const side=direction||1;
    vx=-nz*side;vz=nx*side;
   }
   p.angle=p.travelAngle=Math.atan2(vx+nx*.18,vz+nz*.18);
   p.yaw=0;p.slip=0;
  }
  const retainedSpeed=skating?.48:.25;
  p.speed*=retainedSpeed;p.measuredSpeed*=retainedSpeed;
  if(!p.air){p.y=height(p.x,p.z);p.groundV=-grade*p.speed;}
  p.bump=skating?.22:.8;events.push('bump');
 }
 const stillAtTimberline=p.route==='Timberline Summit'&&!expert&&powder<=.2&&expertLocal(p.x,p.z).z<20;
 const route=stillAtTimberline?null:trailAt(p.x,p.z);
 if(route&&(expert||route===driftRoute||p.z>juniperZ(105)&&p.z<570)){if(route.name!==p.route){p.route=route.name;events.push('route');}p.lastRoute=route.name;}
 const returnedToBase=p.z>585&&p.x>-86;
 const returnedToExpert=p.activeLift===EXPERT&&boardingLift(p)===EXPERT;
 if(p.passedTop&&(returnedToBase||returnedToExpert)){p.laps++;p.passedTop=false;events.push('lap');}
 if(p.z>590&&returnedToBase)p.route='Lift base';
 if(!p.air&&p.speed<.05){p.speed=0;p.measuredSpeed=0;}
 if(!p.air){
  const trail=p.safeTrail??[],last=trail.at(-1);
  if((!last||p.distance-last.distance>=.7)&&safeRecovery(p.x,p.z,colliders)){
   const point={x:p.x,z:p.z,y:p.y,angle:p.travelAngle??p.angle,distance:p.distance};
   p.safeTrail=[...trail.filter(s=>p.distance-s.distance<45),point];
  }
 }
 return events;}

