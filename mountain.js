import {createMountain} from './mountain-view.js';
import {spawn,step,board,boardingLift,canUnload,unload,turnStyles,BASE,EXPERT,liftWorld,height,expertRoute,chuteRoute,timberRoute,juniperZ,bowlRoute,driftRoute} from './mountain-core.js';
import {OLD_EAST,HOLLOW_CHAIR,HIGHLINE_CHAIR,HIGHLINE_PEAK,TREELINE,RACE,RACE_GATES} from './highline.js';
import {createTrailMap,mapTrails,readVisits,saveVisits} from './trail-map.js';
const expertRoutes=[expertRoute,chuteRoute,timberRoute,bowlRoute];
const $=id=>document.getElementById(id),canvas=$('game');let view;try{view=createMountain(canvas);}catch(e){$('overlay').querySelector('h1').textContent='3D graphics unavailable';$('overlay').querySelector('p').textContent='This mountain needs WebGL. Try Chrome or Edge with graphics acceleration enabled.';throw e;}
let p=spawn(),keys={},started=false,paused=false,jump=false,last=0,toastTime=0,uiTimer=0,speedKph=0,raceBest=0;
try{
 p.laps=Math.max(0,Number(localStorage.getItem('work-game-three-lines-laps'))||0);
 raceBest=Number(localStorage.getItem('work-game-ridgeline-best'))||0;
}catch{}
function toast(s,time=3){$('toast').textContent=s;$('toast').hidden=false;toastTime=time;}
function reset(){
 const {laps,turnStyle}=p;
 const home=p.x>OLD_EAST?(p.y>=310?HIGHLINE_CHAIR:HOLLOW_CHAIR):null;
 p=spawn();p.laps=laps;p.turnStyle=turnStyle;speedKph=0;trackedTrail=null;trailDistance=0;
 if(home){
  Object.assign(p,liftWorld(home,home.center+8,home.bottom+7));
  p.y=height(p.x,p.z);p.angle=home.yaw;p.route=home.name+' · Base';
 }
 keys={};jump=false;view.resetCamera();toast('Back at the chair. E to board.');canvas.focus();
}
function cycleTurnStyle(){
 if(!started||paused)return;
 p.turnStyle=(p.turnStyle+1)%turnStyles.length;
 const style=turnStyles[p.turnStyle],button=$('turnStyle');
 button.textContent=style.label+' · Shift';
 button.dataset.style=style.id;
 canvas.focus();
}
function interact(){
 if(!started||paused)return;
 if(unload(p)){jump=false;speedKph=0;toast('Hold W to skate. Steer toward any run.',4);}
 else if(board(p)){keys={};view.resetCamera();toast(p.activeLift===EXPERT?'Heading up Timberline. Brake before the pitch.':'Heading up. Pick a line below the summit.',4);}
 else if(p.mode==='ski')toast('Ski into a lift loading area and press E to board.');
 canvas.focus();ui();
}
function pause(){if(!started)return;paused=!paused;keys={};jump=false;$('pauseOverlay').hidden=!paused;$('pause').textContent=paused?'Resume · P':'Pause · P';if(!paused)canvas.focus();}
const mapDialog=$('trailMap');
let visitStorage;
try{visitStorage=window.localStorage;}catch{}
const visits=readVisits(visitStorage);
const trailMap=createTrailMap({canvas:$('map'),visitedList:$('visitedTrails'),
 unvisitedList:$('unvisitedTrails'),count:$('visitCount'),visits});
let trackedTrail=null,trailDistance=0;
function recordVisit(distance){
 if(p.trailId!==trackedTrail){trackedTrail=p.trailId;trailDistance=0;}
 if(!trackedTrail||visits.has(trackedTrail))return;
 trailDistance+=distance;
 if(trailDistance>=12){
  visits.add(trackedTrail);
  saveVisits(visitStorage,visits);
 }
}
function map(){
 if(mapDialog.open){mapDialog.close();return;}
 if(!started||paused)return;
 keys={};jump=false;
 for(const id of readVisits(visitStorage))visits.add(id);
 trailMap.updateLists();
 trailMap.draw(p);
 mapDialog.showModal();
}
mapDialog.addEventListener('close',()=>{
 keys={};jump=false;
 canvas.focus();
});
mapDialog.addEventListener('click',event=>{
 const button=event.target.closest('button[data-trail]');
 if(button)trailMap.select(button.dataset.trail,p);
});
function ui(){
 const lift=p.mode==='lift',near=boardingLift(p),atTop=canUnload(p);
 const alpine=p.x>OLD_EAST;
 const expertDescent=p.route==='Timberline Summit'||expertRoutes.some(route=>route.name===p.route);
 $('speed').textContent=lift?'—':Math.round(speedKph);
 $('laps').textContent=p.laps;
 $('movement').textContent=p.mode==='crash'?'Wipeout · Getting back up…':atTop?'Press E when you’re ready':lift?'Chairlift · '+Math.round(p.ride*100)+'%':p.air?'In the air':p.drive==='skate'?'Skating · hold W to push':p.drive==='tuck'?'Tucking · release W to stand':p.speed<1?'Hold W to skate · A / D turns your skis':p.drive==='brake'?'Hockey stop':'Carve with A / D · S hockey stops';
 $('route').textContent=lift?p.activeLift.name+(atTop?' · At the summit':' · Going up'):p.route;
 $('routeDot').style.background=lift?'#d6a166':mapTrails.find(r=>r.name===p.route)?.color||'#72bfb4';
 const raceStatus=$('raceStatus');
 raceStatus.hidden=!p.race&&(p.route!==RACE.name||!raceBest);
 raceStatus.textContent=p.race?`${p.race.time.toFixed(1)} s · Gate ${p.race.next}/${RACE_GATES.length-1}`:`Race best · ${raceBest.toFixed(2)} s`;
 const atJuniperSummit=p.z<juniperZ(75);
 const prompt=$('prompt');
 const atSaddle=alpine&&Math.hypot(p.x-TREELINE.x,p.z-TREELINE.z)<53;
 const atHighlineSummit=alpine&&Math.hypot(p.x-HIGHLINE_PEAK.x,p.z-HIGHLINE_PEAK.z)<35;
 prompt.hidden=!near&&!lift&&(alpine?!atSaddle&&!atHighlineSummit:expertDescent||p.route===driftRoute.name||p.z<565&&!atJuniperSummit);
 $('interact').hidden=!near&&!atTop;
 $('interact').textContent=atTop?'E · Unload':'E · Board chair';
 $('promptText').textContent=atTop?'Your chair will wait here.':lift?(p.activeLift.autoUnload?'Unloading at '+p.activeLift.landing+'.':'Press E to unload when you reach the summit.'):near?'Press E to board '+near.name+'.':atHighlineSummit?'Turn downhill to pick a bowl or chute.':atSaddle?'Highline Chair ←    Fir Hollow ahead    Meadow Way →':atJuniperSummit?'Glades ←    Park straight ahead    Groomer & Snowdrift →':'Juniper base '+Math.round(Math.hypot(p.x-BASE.x,p.z-BASE.z))+' m · head into the base clearing';
}
function onSkiEvent(event){
 if(event==='land'&&!p.race)toast('Landed. '+p.jumps+' clean '+(p.jumps===1?'jump':'jumps')+'.',2);
 if(event==='bump'&&!p.race)toast('A soft bump. Brake and pick your way through.',2);
 if(event==='crash')toast('Wipeout · Getting back up…',2);
 if(event==='respawn'){keys={};jump=false;view.resetCamera();toastTime=0;}
 if(event==='unload'){keys={};jump=false;view.resetCamera();toast(p.route,3);}
 if(event==='race-start')toast('Ridgeline Race · Go!',2);
 if(event==='race-missed')toast('Missed a gate. Cross the start again for another run.',3);
 if(event==='race-finish'){
  const best=!raceBest||p.raceResult<raceBest;
  if(best){
   raceBest=p.raceResult;
   try{localStorage.setItem('work-game-ridgeline-best',String(raceBest));}catch{}
  }
  toast(`Finish · ${p.raceResult.toFixed(2)} s${best?' · Personal best':''}`,5);
 }
 if(event==='lap'){
  try{localStorage.setItem('work-game-three-lines-laps',p.laps);}catch{}
  if(!p.raceResult||toastTime<=0)toast('Lap complete. E boards in the loading area.',4);
 }
}
function frame(t){
 const elapsed=last?(t-last)/1000:0;last=t;
 const dt=Math.min(elapsed,.1);
 if(!document.hidden){
  const skiing=started&&!paused&&!mapDialog.open;
  if(skiing){
   let distance=0;
   let remaining=dt;
   while(remaining>0){
    const d=Math.min(remaining,1/120);
    const events=step(p,{left:keys.a||keys.ArrowLeft,right:keys.d||keys.ArrowRight,tuck:keys.w||keys.ArrowUp,brake:keys.s||keys.ArrowDown,jump},d,view.colliders);
    const motion=p.horizontalSpeed*d;
    distance+=motion;recordVisit(motion);
    jump=false;
    for(const event of events)onSkiEvent(event);
    remaining-=d;
   }
   const currentKph=elapsed>0?distance/elapsed*3.6:0;
   speedKph=p.mode!=='ski'||(!p.air&&p.speed===0)?0:
    speedKph+(currentKph-speedKph)*(1-Math.exp(-elapsed*12));
  }
  view.render(p,dt,!skiing);
  toastTime-=paused||mapDialog.open?0:dt;
  if(toastTime<=0)$('toast').hidden=true;
  uiTimer+=dt;
  if(uiTimer>.12){ui();uiTimer=0;}
 }
 requestAnimationFrame(frame);
}
$('start').onclick=()=>{started=true;$('overlay').hidden=true;canvas.focus();toast('Press E anywhere in the base clearing to ride the chair.',5);};$('interact').onclick=interact;$('pause').onclick=pause;$('resume').onclick=pause;$('mapButton').onclick=map;$('closeMap').onclick=map;$('fullscreen').onclick=()=>{if(document.fullscreenElement)document.exitFullscreen();else $('mountain').requestFullscreen().catch(()=>{});canvas.focus();};
$('turnStyle').onclick=cycleTurnStyle;
document.addEventListener('keydown',e=>{
 if(['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName))return;
 const k=e.key.length===1?e.key.toLowerCase():e.key;
 if(mapDialog.open){
  if(k==='m'||k==='Escape'){e.preventDefault();if(!e.repeat)mapDialog.close();}
  return;
 }
 if([' ','ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(k)&&e.target.tagName!=='BUTTON')e.preventDefault();
 if(!e.repeat){
  if(k==='p'||k==='Escape')pause();
  if(!paused&&started){
   if(k==='e')interact();
   if(k==='r')reset();
   if(k==='m'){map();return;}
   if(k==='Shift')cycleTurnStyle();
   if(k===' '&&e.target.tagName!=='BUTTON')jump=true;
  }
 }
 if(e.target.tagName!=='BUTTON')keys[k]=true;
});
document.addEventListener('keyup',e=>keys[e.key.length===1?e.key.toLowerCase():e.key]=false);
canvas.addEventListener('pointerdown',()=>canvas.focus());
window.addEventListener('blur',()=>{keys={};if(started&&!paused)pause();});
document.addEventListener('visibilitychange',()=>{if(document.hidden){keys={};if(started&&!paused)pause();}});
const touchMap={left:'a',right:'d',tuck:'w',brake:'s'};document.querySelectorAll('[data-key]').forEach(b=>{b.onpointerdown=e=>{e.preventDefault();b.setPointerCapture(e.pointerId);keys[touchMap[b.dataset.key]]=true;};b.onpointerup=b.onpointercancel=()=>keys[touchMap[b.dataset.key]]=false;});$('touchJump').onpointerdown=e=>{e.preventDefault();jump=true;};
if('serviceWorker'in navigator){
 const worker=navigator.serviceWorker;
 const release=Number(document.documentElement.dataset.release);
 const checkActive=()=>worker.controller?.postMessage('work-game-release');
 worker.addEventListener('message',({data})=>{
  if(data?.type==='work-game-release'&&data.release>release)$('updateGame').hidden=false;
 });
 worker.addEventListener('controllerchange',checkActive);
 $('updateGame').onclick=()=>location.reload();
 worker.register('/sw.js',{updateViaCache:'none'}).then(registration=>{
  checkActive();
  let lastCheck=0;
  const check=()=>{
   if(document.hidden||Date.now()-lastCheck<10000)return;
   lastCheck=Date.now();
   registration.update().catch(()=>{});
  };
  document.addEventListener('visibilitychange',check);
  window.addEventListener('focus',check);
  setInterval(check,60000);
 }).catch(()=>{});
}
ui();requestAnimationFrame(frame);
