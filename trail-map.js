import {BASE,JUNIPER,EXPERT,height,liftWorld,routes,pathX,juniperZ,timberlineZ,expertFaceX,
 expertRoute,chuteRoute,chuteX,timberRoute,timberX,bowlRoute,powderToGladeZ,driftRoute,
 driftX,driftExitX,ridgeDropRoute,ridgeDropX} from './mountain-core.js';
import {HIGHLINE_TRAILS,HIGHLINE_LIFTS,HIGHLINE_PEAK,TREELINE,HOLLOW_BASE,FIR_GLADE,FIR_HOLLOW_APPROACH} from './highline.js';

const sample=(start,end,step,point)=>Array.from(
 {length:Math.ceil((end-start)/step)+1},(_,i)=>point(Math.min(start+i*step,end))
);
const timberlineTrail=(route,center,start,end,kind)=>({...route,kind,
 points:sample(start,end,4,z=>liftWorld(EXPERT,center(z),timberlineZ(z)))});

export const mapTrails=[
 ...routes.map((route,i)=>({...route,kind:['groomer','park','glade'][i],
  points:sample(juniperZ(85),590,8,z=>({x:pathX(z,route),z}))})),
 {...driftRoute,kind:'glade',points:[
  ...sample(52,266,4,s=>({x:driftX(s),z:juniperZ(s)})),
  ...sample(266,412,4,s=>({x:driftExitX(s),z:juniperZ(s)}))
 ]},
 {...ridgeDropRoute,kind:'drop',points:sample(193,550,6,z=>({x:ridgeDropX(z),z}))},
 {...bowlRoute,kind:'bowl',points:sample(-692,-184,8,x=>({x,z:powderToGladeZ(x)}))},
 timberlineTrail(expertRoute,expertFaceX,26,382,'expert'),
 timberlineTrail(chuteRoute,chuteX,68,329,'chute'),
 timberlineTrail(timberRoute,timberX,182,322,'glade'),
 ...HIGHLINE_TRAILS
];
const trailById=new Map(mapTrails.map(trail=>[trail.id,trail]));
const storageKey='work-game-visited-trails-v1';
export function readVisits(storage){
 try{
  const saved=JSON.parse(storage.getItem(storageKey));
  return new Set(Array.isArray(saved)?saved.filter(id=>trailById.has(id)):[]);
 }catch{return new Set();}
}
export function saveVisits(storage,visits){
 try{storage.setItem(storageKey,JSON.stringify([...new Set([...readVisits(storage),...visits])]));}catch{}
}

const types={
 groomer:['Groomer','#207558'],park:['Park','#a45327'],glade:['Glade','#42714c'],
 drop:['Cliff drop','#9a4d42'],bowl:['Bowl','#2a6885'],expert:['Expert','#33445c'],
 chute:['Chute','#704976'],link:['Connector','#3e6f6c'],race:['Race','#9a5924']
};
const lifts=[JUNIPER,EXPERT,...HIGHLINE_LIFTS];
const width=920, mapHeight=508, west=-780,east=1090,north=-334,south=685;
const px=x=>28+(x-west)/(east-west)*(width-56);
const py=z=>24+(z-north)/(south-north)*(mapHeight-48);
const places=[
 ['JUNIPER SUMMIT',liftWorld(JUNIPER,JUNIPER.center,JUNIPER.top),14,-13,'left'],
 ['JUNIPER BASE',BASE,-13,17,'right'],
 ['TIMBERLINE',liftWorld(EXPERT,EXPERT.center,EXPERT.top),-3,15,'center'],
 ['HIGHLINE SUMMIT',HIGHLINE_PEAK,14,-12,'right'],
 ['TREELINE SADDLE',TREELINE,-14,-4,'right'],
 ['HOLLOW BASE',HOLLOW_BASE,12,20,'left']
];

function paintRelief(canvas){
 const ctx=canvas.getContext('2d');
 const image=ctx.createImageData(width,mapHeight);
 const spacing=4,columns=Math.ceil(width/spacing)+1,rows=Math.ceil(mapHeight/spacing)+1;
 const grid=Array.from({length:rows},(_,j)=>Array.from({length:columns},(_,i)=>{
  const x=west+(i*spacing-28)/(width-56)*(east-west);
  const z=north+(j*spacing-24)/(mapHeight-48)*(south-north);
  return height(x,z);
 }));
 for(let y=0;y<mapHeight;y++){
  const row=Math.floor(y/spacing),v=y/spacing-row;
  for(let x=0;x<width;x++){
   const col=Math.floor(x/spacing),u=x/spacing-col;
   const a=grid[row][col],b=grid[row][col+1],c=grid[row+1][col],d=grid[row+1][col+1];
   const upper=a+(b-a)*u,lower=c+(d-c)*u,h=upper+(lower-upper)*v;
   const shade=Math.max(-17,Math.min(16,((b-a+d-c)*.5+lower-upper)*.75));
   const contour=h>28&&Math.abs(h-Math.round(h/45)*45)<Math.min(3,Math.max(.65,Math.abs(shade)*.34))?9:0;
   const ridge=Math.max(0,Math.min(1,h/650));
   const i=(y*width+x)*4;
   image.data[i]=221+ridge*19+shade-contour;
   image.data[i+1]=233+ridge*11+shade-contour;
   image.data[i+2]=230+ridge*17+shade*.8-contour*.7;
   image.data[i+3]=255;
  }
 }
 ctx.putImageData(image,0,0);
}

export function createTrailMap({canvas,visitedList,unvisitedList,count,visits}){
 const ctx=canvas.getContext('2d'),base=document.createElement('canvas');
 base.width=canvas.width=width;
 base.height=canvas.height=mapHeight;
 let ready=false,selected=null;
 function line(points){
  ctx.beginPath();
  points.forEach(({x,z},i)=>i?ctx.lineTo(px(x),py(z)):ctx.moveTo(px(x),py(z)));
 }
 function draw(player){
  if(!ready){paintRelief(base);ready=true;}
  ctx.drawImage(base,0,0);
  ctx.lineCap='round';ctx.lineJoin='round';
  for(const lift of lifts){
   const ends=[lift.top,lift.bottom].map(z=>liftWorld(lift,lift.center,z));
   line(ends);ctx.strokeStyle='#213e52';ctx.lineWidth=1.6;ctx.setLineDash([3,4]);ctx.stroke();
   for(const p of ends){ctx.fillStyle='#213e52';ctx.fillRect(px(p.x)-2.3,py(p.z)-2.3,4.6,4.6);}
  }
  for(const trail of mapTrails){
   const highlighted=trail.id===selected;
   line(trail.points);
   if(trail===FIR_GLADE&&visits.has(trail.id)){
    FIR_HOLLOW_APPROACH.points.forEach(({x,z},i)=>i?ctx.lineTo(px(x),py(z)):ctx.moveTo(px(x),py(z)));
   }
   ctx.setLineDash([]);ctx.strokeStyle='#f4faf6';
   ctx.lineWidth=highlighted?8:5.1;ctx.stroke();
   ctx.setLineDash(visits.has(trail.id)?[]:[4,4]);
   ctx.strokeStyle=types[trail.kind][1];ctx.lineWidth=highlighted?5:2.7;ctx.stroke();
  }
  ctx.setLineDash([]);ctx.textBaseline='middle';
  ctx.font='700 12px Arial';
  for(const [label,p,dx,dy,align] of places){
   ctx.textAlign=align;ctx.lineWidth=4;ctx.strokeStyle='#eef5f3';ctx.fillStyle='#213c50';
   ctx.strokeText(label,px(p.x)+dx,py(p.z)+dy);
   ctx.fillText(label,px(p.x)+dx,py(p.z)+dy);
  }
  const trail=trailById.get(selected);
  if(trail){
   const p=trail.points[Math.floor(trail.points.length*.5)];
   ctx.textAlign='center';ctx.font='700 14px Arial';
   ctx.lineWidth=5;ctx.strokeStyle='#f4faf6';ctx.fillStyle='#172e3d';
   ctx.strokeText(trail.name,px(p.x),py(p.z)-13);
   ctx.fillText(trail.name,px(p.x),py(p.z)-13);
  }
  const x=Math.max(12,Math.min(width-12,px(player.x)));
  const y=Math.max(12,Math.min(mapHeight-12,py(player.z)));
  ctx.beginPath();ctx.arc(x,y,7,0,Math.PI*2);
  ctx.fillStyle='#a74427';ctx.fill();ctx.strokeStyle='white';ctx.lineWidth=2.5;ctx.stroke();
 }
 function updateLists(){
  count.textContent=visits.size+' / '+mapTrails.length+' trails visited';
  for(const [list,visited] of [[visitedList,true],[unvisitedList,false]]){
   list.replaceChildren();
   for(const trail of mapTrails.filter(trail=>visits.has(trail.id)===visited)){
    const [label,color]=types[trail.kind];
    const li=document.createElement('li');
    const button=document.createElement('button');
    button.type='button';button.dataset.trail=trail.id;
    button.setAttribute('aria-pressed',String(trail.id===selected));
    button.style.setProperty('--trail-color',color);
    const name=document.createElement('span'),kind=document.createElement('small');
    name.textContent=trail.name;kind.textContent=label;
    button.append(name,kind);li.append(button);list.append(li);
   }
   if(!list.childElementCount){
    const li=document.createElement('li');
    li.className='map-empty';
    li.textContent=visited?'Ski a trail to add it here.':'You’ve visited every trail.';
    list.append(li);
   }
  }
 }
 function select(trailId,player){
  selected=selected===trailId?null:trailId;
  for(const list of [visitedList,unvisitedList]){
   for(const button of list.querySelectorAll('button[data-trail]')){
    button.setAttribute('aria-pressed',String(button.dataset.trail===selected));
   }
  }
  draw(player);
 }
 return {draw,updateLists,select};
}
