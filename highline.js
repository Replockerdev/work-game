export const OLD_EAST=215;
export const HIGHLINE_EAST=1195;
export const HOLLOW_BASE={x:636,z:550,y:23};
export const TREELINE={x:783,z:151,y:324};
export const HIGHLINE_PEAK={x:888,z:-210,y:700};
const clamp=(value,min=0,max=1)=>Math.max(min,Math.min(max,value));
const smooth=value=>{const t=clamp(value);return t*t*(3-2*t);};
const mix=(a,b,t)=>a+(b-a)*t;
const length=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
const smoothMax=(a,b,range)=>{
 const overlap=Math.max(0,range-Math.abs(a-b))/range;
 return Math.max(a,b)+range*.25*overlap*overlap;
};

function chair(id,name,top,bottom,rideSeconds,landing){
 const span=length(top,bottom);
 const towers=Array.from({length:8},(_,i)=>span*i/7);
 return {id,name,x:top.x,z:top.z,center:0,yaw:Math.atan2(bottom.x-top.x,bottom.z-top.z),
  hand:1,top:0,bottom:span,rideSeconds,towers,landing,autoUnload:true};
}
export const HOLLOW_CHAIR=chair('hollow','Hollow Chair',{x:759,z:154},HOLLOW_BASE,15,'Treeline Saddle');
export const HIGHLINE_CHAIR=chair('highline','Highline Chair',{x:911,z:-211},{x:832,z:151},17,'Highline Summit');
export const HIGHLINE_LIFTS=[HOLLOW_CHAIR,HIGHLINE_CHAIR];

// Catmull-Rom samples leave the trails continuous through the bends.
function trail(id,name,color,kind,width,anchors){
 const sample=(a,b,c,d,t)=>b+.5*t*(c-a+t*(2*a-5*b+4*c-d+t*(3*(b-c)+d-a)));
 const points=[];
 for(let i=0;i<anchors.length-1;i++){
  const a=anchors[Math.max(0,i-1)],b=anchors[i],c=anchors[i+1],d=anchors[Math.min(anchors.length-1,i+2)];
  const count=Math.ceil(Math.hypot(c[0]-b[0],c[1]-b[1])/12);
  for(let k=0;k<count;k++){
   const t=k/count;
   points.push({x:sample(a[0],b[0],c[0],d[0],t),z:sample(a[1],b[1],c[1],d[1],t),
    y:sample(a[2],b[2],c[2],d[2],t)});
  }
 }
 const last=anchors.at(-1);
 points.push({x:last[0],z:last[1],y:last[2]});
 const reach=width+(id==='hollow-link'?108:69);
 const bounds={left:Math.min(...points.map(p=>p.x))-reach,right:Math.max(...points.map(p=>p.x))+reach,
  top:Math.min(...points.map(p=>p.z))-reach,bottom:Math.max(...points.map(p=>p.z))+reach};
 let distance=0;
 const segments=points.slice(1).map((end,i)=>{
  const start=points[i],dx=end.x-start.x,dz=end.z-start.z,span=Math.hypot(dx,dz);
  const segment={start,end,dx,dz,span,distance};
  distance+=span;
  return segment;
 });
 const grades=points.map((point,i)=>{
  const before=points[Math.max(i-1,0)],after=points[Math.min(i+1,points.length-1)];
  const dx=after.x-before.x,dz=after.z-before.z,span=Math.hypot(dx,dz);
  return {x:point.x,z:point.z,y:point.y,dx:dx/span,dz:dz/span,grade:(after.y-before.y)/span,
   along:segments[i]?.distance??distance};
 });
 const gradeSpread=(kind==='chute'?10:Math.max(13,width*.40))**2;
 return {id,name,color,kind,width,points,segments,bounds,distance,grades,gradeSpread,reach};
}
export const HOLLOW_LINK=trail('hollow-link','Hidden Hollow','#638a73','link',23,[
 [91,173,130],[120,181,124],[145,191,118],[159,214,112],[200,236,102],
 [251,268,91],[319,315,77],[386,369,63],[448,434,49],[509,500,36],
 [552,539,29],[593,548,25],[636,547,23]
]);
export const MEADOW=trail('meadow','Meadow Way','#4e9b72','groomer',27,[
 [749,174,316],[656,210,279],[570,250,234],[559,317,196],[650,365,157],
 [681,410,118],[593,458,77],[566,505,43],[646,550,23]
]);
export const RACE=trail('ridge-race','Ridgeline Race','#c28342','race',25,[
 [806,174,316],[907,226,272],[953,290,228],[936,350,181],[892,410,132],
 [850,470,82],[782,519,44],[652,550,23]
]);
export const FIR_GLADE=trail('fir-glade','Fir Hollow Glades','#487a59','glade',34,[
 [779,179,315],[793,220,289],[785,275,245],[766,335,192],[741,393,139],
 [711,449,91],[676,503,48],[646,548,23]
]);
export const SUN_BOWL=trail('sun-bowl','Sunbreak Bowl','#799aa8','bowl',56,[
 [914,-192,690],[962,-153,660],[1000,-82,578],[1010,-5,496],
 [969,67,417],[902,115,362],[822,145,324]
]);
// Individual bumps with skiable gaps and an open line on either side.
const sunbreakMoguls=[
 [149,-13,12,8,.80],[159,6,11,8,1.05],[172,-5,13,7,.90],[179,15,10,7,.74],
 [189,-18,11,8,.97],[193,3,12,8,1.18],[204,19,12,7,.90],
 [214,-10,13,9,1.05],[222,9,11,8,1.14],[236,-20,10,7,.85],[241,-1,13,8,1.14],
 [253,17,13,8,.92],[263,-12,12,9,1.07],[271,6,11,8,1.02],[284,-3,13,8,.79]
];
function mogulHeight(along,across){
 if(along<137||along>297||Math.abs(across)>29)return 0;
 let height=0;
 for(const [center,side,length,width,rise] of sunbreakMoguls){
  const radius=((along-center)/length)**2+((across-side)/width)**2;
  if(radius<1)height+=rise*(1-radius)**3;
 }
 return height;
}
export const WIND_BOWL=trail('wind-bowl','Windward Bowl','#658da2','bowl',42,[
 [880,-197,694],[838,-172,660],[805,-127,601],[768,-76,532],
 [748,-18,471],[747,39,410],[767,101,350],[797,145,324]
]);
export const NEEDLE=trail('needle','Needle Chute','#546079','chute',7.6,[
 [889,-190,689],[874,-154,659],[859,-117,605],[846,-70,544],
 [839,-27,493],[829,25,438],[819,78,385],[815,126,336],[816,145,324]
]);
export const WEST_NOTCH=trail('west-notch','Juniper Notch','#765b79','chute',6.9,[
 [863,-192,688],[813,-184,655],[747,-158,588],[672,-132,509],[611,-95,445],
 [582,-45,400],[607,12,373],[676,74,351],[750,123,332],[807,147,324]
]);
export const HOLLOW_RETURN=trail('hollow-return','Hollow Return','#68a69f','link',17,[
 [626,567,22],[527,581,18],[429,593,14],[322,600,10],[221,604,6],
 [137,605,2.8],[48,610,.2]
]);
export const HIGHLINE_TRAILS=[HOLLOW_LINK,MEADOW,RACE,FIR_GLADE,SUN_BOWL,WIND_BOWL,NEEDLE,WEST_NOTCH,HOLLOW_RETURN];
export const HIGHLINE_CHUTE_ROCKS=[
 [NEEDLE,74,-1.7,.65],[NEEDLE,109,1.85,.67],[NEEDLE,150,-1.9,.74],
 [NEEDLE,187,1.75,.60],[NEEDLE,224,-2.1,.73],[NEEDLE,261,2.6,.68],
 [WEST_NOTCH,109,1.8,.68],[WEST_NOTCH,153,-1.65,.63],[WEST_NOTCH,196,1.7,.76],
 [WEST_NOTCH,243,-1.8,.69],[WEST_NOTCH,289,1.7,.61],[WEST_NOTCH,344,-1.8,.78],
 [WEST_NOTCH,396,2.2,.65],[WEST_NOTCH,451,-2.45,.73]
].map(([route,along,side,size])=>{
 const p=trailPoint(route,along);
 return {x:p.x+p.dz*side,z:p.z-p.dx*side,size};
});

export function trailPoint(route,distance){
 const along=clamp(distance,0,route.distance);
 const s=route.segments.find(s=>along<=s.distance+s.span)??route.segments.at(-1);
 const t=clamp((along-s.distance)/s.span);
 return {x:mix(s.start.x,s.end.x,t),z:mix(s.start.z,s.end.z,t),y:mix(s.start.y,s.end.y,t),
  dx:s.dx/s.span,dz:s.dz/s.span};
}
export function trailSample(route,x,z,blend=false){
 const b=route.bounds;
 if(x<b.left||x>b.right||z<b.top||z>b.bottom)return null;
 let best=Infinity,segment=null,progress=0;
 for(const s of route.segments){
  const dx=x-s.start.x,dz=z-s.start.z;
  const t=clamp((dx*s.dx+dz*s.dz)/(s.span*s.span));
  const d=(dx-t*s.dx)**2+(dz-t*s.dz)**2;
  if(d<best){best=d;segment=s;progress=t;}
 }
 const closest={distance:Math.sqrt(best),along:segment.distance+progress*segment.span,
  y:mix(segment.start.y,segment.end.y,progress),
  across:((x-segment.start.x)*segment.dz-(z-segment.start.z)*segment.dx)/segment.span};
 if(!blend||closest.distance>route.reach)return closest;

 // Blend nearby tangent slopes so the surface stays smooth even where
 // the nearest segment changes abruptly on the inside of a turn.
 const limit=best+route.gradeSpread*8;
 let along=0,y=0,across=0,weight=0;
 for(const s of route.grades){
  const dx=x-s.x,dz=z-s.z,distance=dx*dx+dz*dz;
  if(distance>=limit)continue;
  const w=Math.exp((best-distance)/route.gradeSpread);
  const t=clamp(s.along+dx*s.dx+dz*s.dz,0,route.distance);
  weight+=w;
  along+=t*w;
  y+=(s.y+(t-s.along)*s.grade)*w;
  across+=(dx*s.dz-dz*s.dx)*w;
 }
 if(weight>0){
  closest.along=along/weight;
  closest.y=y/weight;
  const t=closest.along/route.distance;
  const interior=smooth(t*20)*smooth((1-t)*20);
  closest.across=mix(closest.across,across/weight,interior);
  closest.distance=mix(closest.distance,Math.abs(across/weight),interior);
 }
 return closest;
}
function trailWidth(route,sample){
 if(route.kind!=='chute')return route.width;
 const p=sample.along/route.distance;
 if(route===WEST_NOTCH){
  const slot=smooth((p-.08)/.14)*(1-smooth((p-.66)/.22));
  const pinch=.65+.45*Math.sin(sample.along*.053);
  return route.width-slot*(3.45+pinch)+13*smooth((p-.71)/.25);
 }
 return route.width-3.5*smooth((p-.16)/.21)*(1-smooth((p-.60)/.28))
  +13*smooth((p-.71)/.25);
}
export function highlineTrailAt(x,z){
 if(x<28||x>1115||z<-230||z>633)return null;
 let nearest=null,best=Infinity;
 for(const route of HIGHLINE_TRAILS){
  const sample=trailSample(route,x,z);
  if(!sample)continue;
  const ratio=sample.distance/trailWidth(route,sample);
  if(ratio<1&&ratio<best){nearest=route;best=ratio;}
 }
 return nearest;
}

const mountainProfile=[
 [-340,658],[-285,691],[-235,710],[-195,694],[-145,657],[-78,582],
 [0,498],[76,414],[145,333],[178,322],[245,276],[312,226],[380,166],
 [445,107],[500,57],[555,25],[620,9],[690,7]
];
function faceHeight(z){
 for(let i=1;i<mountainProfile.length;i++){
  const a=mountainProfile[i-1],b=mountainProfile[i];
  if(z<=b[0])return mix(a[1],b[1],clamp((z-a[0])/(b[0]-a[0])));
 }
 return mountainProfile.at(-1)[1];
}
function deck(x,z,y,center,rx,rz){
 const r=Math.hypot((x-center.x)/rx,(z-center.z)/rz);
 return mix(y,center.y,1-smooth((r-.52)/.48));
}
function rib(x,z,cx,cz,rx,rz,h){
 return h*Math.exp(-(((x-cx)/rx)**2+((z-cz)/rz)**2));
}
function chuteBanks(route,s,width){
 const edge=s.distance-width;
 const notch=route===WEST_NOTCH;
 const face=smooth((s.along-27)/46)*(1-smooth((s.along-route.distance*.70)/(route.distance*.24)));
 const side=s.across<0?0:2.5;
 const bankHeight=(notch?20:16)+2.8*Math.sin(s.along*.043+side);
 return face*bankHeight*smooth(edge/(notch?3.5:4.6))*(1-smooth((edge-5)/(notch?15:19)));
}
function summitApron(x,z,y){
 const across=Math.abs(x-883),front=z+210;
 const sides=1-smooth((across-52)/40);
 const back=smooth((front+37)/21);
 const apron=sides*back*(1-smooth((front-31)/46));
 const fall=.16*front+.012*Math.max(0,front-6)**2;
 const surface=700-fall-.0011*(x-896)**2;
 // A shared downhill apron connects the terminal to the mouths of all four runs.
 // Ahead of it, trim the high snow between the entrances as the runs separate.
 const limit=surface+4+Math.max(0,front-40)*.65;
 const cap=sides*back*smooth((front-22)/20)*(1-smooth((front-87)/34));
 return mix(mix(y,-smoothMax(-y,-limit,2),cap),surface,apron);
}
function highlineTerminal(x,z,y,station){
 const lift=HIGHLINE_CHAIR;
 const dx=x-lift.x,dz=z-lift.z,cos=Math.cos(lift.yaw),sin=Math.sin(lift.yaw);
 const across=dx*cos-dz*sin,along=dx*sin+dz*cos-station;
 const apron=Math.hypot(across/19,along/19);
 const top=station===lift.top;
 const floor=top?700.6:TREELINE.y;
 return mix(y,floor,1-smooth((apron-.64)/.36));
}
export function highlineHeight(x,z,original){
 if(x<30)return original;
 if(x<=OLD_EAST&&z<154)return original;
 let y=original;
 if(x>OLD_EAST){
  const fallLine=880-.28*Math.max(0,z+210);
  const west=smooth((x-227)/(fallLine-227));
  const east=1-.77*smooth((x-966)/229);
  const south=smooth((z-295)/252);
  const bench=7+16*smooth((x-228)/400);
  const face=bench+(faceHeight(z)-bench)*west*east;
  // The Juniper shoulder rises along the west side of the same summit ridge.
  const shoulder=(225+480*smooth((x-114)/756))*Math.exp(-(((z+242)/122)**2));
  const ridgeNoise=(Math.sin(x*.031+z*.019)*8+Math.sin(x*.071-z*.045)*3.2)*west*(1-south);
  const woodedFold=rib(x,z,426,528,98,108,48)+rib(x,z,357,447,91,105,32);
  const outerBank=rib(x,z,1155,400,118,240,74);
  const newGround=Math.max(face,shoulder)+ridgeNoise+woodedFold+outerBank;
  y=mix(original,newGround,smooth((x-OLD_EAST)/133));
 }
 let target=0,weight=0,coverage=0;
 for(const route of HIGHLINE_TRAILS){
  const s=trailSample(route,x,z,true);
  if(!s)continue;
  const width=trailWidth(route,s);
  const fade=route===HOLLOW_LINK?48+60*smooth((x-211)/141):
   route.kind==='bowl'?66:route.kind==='chute'?44:route.kind==='glade'?52:44;
  const envelope=route===WEST_NOTCH?width+3.5:width;
  const influence=1-smooth((s.distance-envelope)/fade);
  if(influence<=0)continue;
  const upper=route.kind==='bowl'||route.kind==='chute';
  const level=upper?1-smooth((z-150)/28):
   route.kind==='link'?1:smooth((z-143)/26);
  if(level<=0)continue;
  const join=smooth(s.along/(route===HOLLOW_LINK?44:26))*smooth((route.distance-s.along)/23);
  let floor=s.y;
  if(route.kind==='chute'){
   floor+=chuteBanks(route,s,width);
  }else if(route.kind==='bowl'){
   floor+=22*smooth((s.distance-width*.45)/(width*.65));
   if(route===SUN_BOWL)floor+=mogulHeight(s.along,s.across);
  }else if(route.kind==='glade'){
   floor+=.33*Math.sin(s.along*.064+s.across*.07);
  }
  // The wider shoulders blend into the mountain while the trail beds retain their grade.
  const entryBlend=route===HOLLOW_LINK?smooth((x-89)/39)*smooth((z-154)/34):1;
  const exitBlend=route===HOLLOW_RETURN?smooth((x-30)/55):1;
  const strength=influence*level*(.28+.72*join)*entryBlend*exitBlend;
  const priority=strength**4/(1+(s.distance/(width*.62))**4);
  target+=floor*priority;weight+=priority;
  coverage=Math.min(1,smoothMax(coverage,strength,.25*Math.min(coverage,strength)+.001));
 }
 if(weight>0)y=mix(y,target/weight,coverage);
 if(x>520){
  y=deck(x,z,y,HOLLOW_BASE,50,35);
  y=deck(x,z,y,TREELINE,76,44);
  if(x>785&&z<-89)y=summitApron(x,z,y);
  if(x>811&&x<853&&z>130&&z<173)y=highlineTerminal(x,z,y,HIGHLINE_CHAIR.bottom);
  if(x>890&&x<932&&z>-232&&z<-190)y=highlineTerminal(x,z,y,HIGHLINE_CHAIR.top);
 }
 return y;
}
export function highlineRock(x,z){
 if(x<541||z<-204||z>114)return 0;
 let rock=0;
 for(const route of [NEEDLE,WEST_NOTCH]){
  const s=trailSample(route,x,z,true);
  if(!s)continue;
  const edge=s.distance-trailWidth(route,s);
  const span=smooth((s.along-27)/46)*(1-smooth((s.along-route.distance*.70)/(route.distance*.24)));
  rock=Math.max(rock,span*smooth(edge/2.8)*(1-smooth((edge-11)/15)));
 }
 return rock;
}
export function highlineTrees(height,loading){
 const trees=[];
 let seed=73437;
 const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 for(let i=0;i<4500&&trees.length<560;i++){
  const x=224+rand()*934,z=69+rand()*569,y=height(x,z);
  if(y>348||y<11||loading.some(p=>length({x,z},p)<29))continue;
  if(Math.hypot((x-TREELINE.x)/1.6,z-TREELINE.z)<37)continue;
  const grade=Math.hypot(height(x+1,z)-height(x-1,z),height(x,z+1)-height(x,z-1))/2;
  if(grade>.96)continue;
  let open=false;
  for(const route of HIGHLINE_TRAILS){
   const s=trailSample(route,x,z);
   if(!s)continue;
   const clearance=route.kind==='glade'?9:route===HOLLOW_LINK?16:trailWidth(route,s)+4;
   if(s.distance<clearance){open=true;break;}
  }
  if(open||trees.some(t=>(t.x-x)**2+(t.z-z)**2<47))continue;
  const grove=.54+.21*Math.sin(x*.045+z*.031)+.18*Math.sin(x*.079-z*.052);
  if(rand()>grove)continue;
  const s=.59+rand()*.67;
  trees.push({x,z,s,r:.56+s*.25});
 }
 return trees;
}

export const RACE_GATES=[.085,.19,.31,.43,.55,.67,.79,.89,.965].map((progress,index,array)=>{
 const p=trailPoint(RACE,RACE.distance*progress);
 return {...p,width:index===0||index===array.length-1?19:14+(index%3)*2};
});
export function advanceRace(p,oldX,oldZ,dt,events){
 if(p.race){
  p.race.time+=dt;
  const sample=trailSample(RACE,p.x,p.z);
  if(!sample||sample.distance>54){p.race=null;events.push('race-missed');return;}
 }
 const index=p.race?.next??0,gate=RACE_GATES[index];
 const before=(oldX-gate.x)*gate.dx+(oldZ-gate.z)*gate.dz;
 const after=(p.x-gate.x)*gate.dx+(p.z-gate.z)*gate.dz;
 if(before>=0||after<0)return;
 const t=-before/(after-before);
 const x=mix(oldX,p.x,t),z=mix(oldZ,p.z,t);
 const across=Math.abs((x-gate.x)*gate.dz-(z-gate.z)*gate.dx);
 if(across>gate.width){
  if(p.race){p.race=null;events.push('race-missed');}
  return;
 }
 if(index===0){p.race={next:1,time:0};events.push('race-start');return;}
 if(index===RACE_GATES.length-1){
  p.raceResult=p.race.time;p.race=null;events.push('race-finish');
 }else{p.race.next++;events.push('race-gate');}
}
