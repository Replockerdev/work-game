import {createMountain} from './mountain-view.js';
import {spawn,step,board,boardingLift,canUnload,unload,turnStyles,BASE,TOP,routes,pathX,JUNIPER,EXPERT,liftWorld,height,expertFaceX,expertRoute,chuteX,chuteRoute,timberX,timberRoute,juniperZ,timberlineZ,bowlRoute,powderToGladeZ,driftRoute,driftX,driftExitX,ridgeDropX} from './mountain-core.js';
import {OLD_EAST,HOLLOW_CHAIR,HIGHLINE_CHAIR,HIGHLINE_LIFTS,HIGHLINE_TRAILS,HIGHLINE_PEAK,TREELINE,HOLLOW_BASE,RACE,RACE_GATES} from './highline.js';
const expertRoutes=[expertRoute,chuteRoute,timberRoute,bowlRoute];
const $=id=>document.getElementById(id),canvas=$('game');let view;try{view=createMountain(canvas);}catch(e){$('overlay').querySelector('h1').textContent='3D graphics unavailable';$('overlay').querySelector('p').textContent='This mountain needs WebGL. Try Chrome or Edge with graphics acceleration enabled.';throw e;}
let p=spawn(),keys={},started=false,paused=false,jump=false,last=0,toastTime=0,uiTimer=0,mapArea='juniper',raceBest=0;
try{
 p.laps=Math.max(0,Number(localStorage.getItem('work-game-three-lines-laps'))||0);
 raceBest=Number(localStorage.getItem('work-game-ridgeline-best'))||0;
}catch{}
function toast(s,time=3){$('toast').textContent=s;$('toast').hidden=false;toastTime=time;}
function reset(){
 const {laps,turnStyle}=p;
 const home=p.x>OLD_EAST?(p.y>=310?HIGHLINE_CHAIR:HOLLOW_CHAIR):null;
 p=spawn();p.laps=laps;p.turnStyle=turnStyle;
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
 if(unload(p)){jump=false;toast('Hold W to skate. Steer toward any run.',4);}
 else if(board(p)){keys={};view.resetCamera();toast(p.activeLift===EXPERT?'Heading up Timberline. Brake before the pitch.':'Heading up. Pick a line below the summit.',4);}
 else if(p.mode==='ski')toast('Ski into a lift loading area and press E to board.');
 canvas.focus();ui();
}
function pause(){if(!started)return;paused=!paused;keys={};jump=false;$('pauseOverlay').hidden=!paused;$('pause').textContent=paused?'Resume · P':'Pause · P';if(!paused)canvas.focus();}
function map(){
 $('trailMap').hidden=!$('trailMap').hidden;
 if(!$('trailMap').hidden)setMapArea(p.x>OLD_EAST?'highline':'juniper');
 canvas.focus();
}
function setMapArea(area){
 mapArea=area;
 $('mapJuniper').setAttribute('aria-pressed',String(area==='juniper'));
 $('mapHighline').setAttribute('aria-pressed',String(area==='highline'));
 $('legendJuniper').hidden=area!=='juniper';
 $('legendHighline').hidden=area!=='highline';
 drawMap();
}
function drawHighlineMap(c){
 const sx=x=>247-(x-80)*.222,sz=z=>24+(z+230)*.339;
 c.strokeStyle='#91a2a9';c.lineWidth=2;c.setLineDash([4,4]);
 for(const lift of HIGHLINE_LIFTS){
  const top=liftWorld(lift,0,lift.top),bottom=liftWorld(lift,0,lift.bottom);
  c.beginPath();c.moveTo(sx(top.x),sz(top.z));c.lineTo(sx(bottom.x),sz(bottom.z));c.stroke();
 }
 c.setLineDash([]);
 for(const route of HIGHLINE_TRAILS){
  c.strokeStyle=route.color;c.lineWidth=route.kind==='chute'?2.6:3.7;c.lineCap='round';
  if(route.kind==='link')c.setLineDash([3,4]);
  c.beginPath();for(const point of route.points)c.lineTo(sx(point.x),sz(point.z));c.stroke();
  c.setLineDash([]);
 }
 c.font='9px Arial';c.fillStyle='#395769';c.textAlign='center';
 c.fillText('HIGHLINE SUMMIT',sx(HIGHLINE_PEAK.x),sz(HIGHLINE_PEAK.z)-7);
 c.fillText('TREELINE SADDLE',sx(TREELINE.x)-19,sz(TREELINE.z)-7);
 c.fillText('HOLLOW CHAIR',sx(HOLLOW_BASE.x),sz(HOLLOW_BASE.z)+15);
 c.fillText('OG GLADES',sx(103)-19,sz(233)-7);
 c.fillText('JUNIPER RETURN',sx(241)-15,sz(606)+16);
 if(p.x>72){c.fillStyle='#254e60';c.beginPath();c.arc(sx(p.x),sz(p.z),5,0,7);c.fill();c.strokeStyle='#fff';c.lineWidth=2;c.stroke();}
}
function drawMap(){
 const c=$('map').getContext('2d'),sx=x=>64-x*.20,sz=z=>20+(z-JUNIPER.top)/(BASE.z-JUNIPER.top)*285;
 c.clearRect(0,0,250,330);
 if(mapArea==='highline'){drawHighlineMap(c);return;}
 c.strokeStyle='#7d919b';c.lineWidth=2;c.setLineDash([4,4]);
 for(const lift of [JUNIPER,EXPERT]){
  const top=liftWorld(lift,lift.center,lift.top),base=liftWorld(lift,lift.center,lift.bottom);
  c.beginPath();c.moveTo(sx(top.x),sz(top.z));c.lineTo(sx(base.x),sz(base.z));c.stroke();
 }
 c.setLineDash([]);
 for(const r of routes){
  c.strokeStyle=r.color;c.lineWidth=6;c.lineCap='round';c.beginPath();
  for(let z=TOP.z;z<=600;z+=5)c.lineTo(sx(pathX(z,r)),sz(z));
  c.stroke();
 }
 for(const [route,center,start,end] of [[expertRoute,expertFaceX,26,382],[chuteRoute,chuteX,68,329],[timberRoute,timberX,182,322]]){
  c.strokeStyle=route.color;
  c.lineWidth=route===expertRoute?5:2.5;
  c.beginPath();
  for(let z=start;z<=end;z+=3){
   const point=liftWorld(EXPERT,center(z),timberlineZ(z));
   c.lineTo(sx(point.x),sz(point.z));
  }
  c.stroke();
 }
 c.strokeStyle=bowlRoute.color;c.lineWidth=4;c.beginPath();
 for(let x=-692;x<=-184;x+=4)c.lineTo(sx(x),sz(powderToGladeZ(x)));
 c.stroke();
 c.strokeStyle=driftRoute.color;c.lineWidth=4;c.beginPath();
 for(let s=52;s<266;s+=3)c.lineTo(sx(driftX(s)),sz(juniperZ(s)));
 for(let s=266;s<=412;s+=3)c.lineTo(sx(driftExitX(s)),sz(juniperZ(s)));
 c.stroke();
 c.strokeStyle=driftRoute.color;c.lineWidth=3;c.beginPath();
 for(let z=193;z<=550;z+=4)c.lineTo(sx(ridgeDropX(z)),sz(z));
 c.stroke();
 c.font='9px Arial';c.fillStyle='#486570';c.textAlign='center';
 c.fillText('JUNIPER SUMMIT',64,12);c.fillText('JUNIPER BASE',64,326);c.fillText('TIMBERLINE',191,248);
 c.fillText('POWDER BOWL',161,204);
 c.textAlign='left';c.fillText('SNOWDRIFT GLADE',125,111);
 c.fillStyle=p.mode==='lift'?'#d79b55':'#254e60';c.beginPath();c.arc(sx(p.x),sz(p.z),5,0,7);c.fill();c.strokeStyle='#fff';c.lineWidth=2;c.stroke();
}
function ui(){
 const lift=p.mode==='lift',near=boardingLift(p),atTop=canUnload(p);
 const alpine=p.x>OLD_EAST;
 const expertDescent=p.route==='Timberline Summit'||expertRoutes.some(route=>route.name===p.route);
 $('speed').textContent=lift?'—':Math.round(p.measuredSpeed*3.6);
 $('laps').textContent=p.laps;
 $('movement').textContent=p.mode==='crash'?'Wipeout · Getting back up…':atTop?'Press E when you’re ready':lift?'Chairlift · '+Math.round(p.ride*100)+'%':p.air?'In the air':p.drive==='skate'?'Skating · hold W to push':p.drive==='tuck'?'Tucking · release W to stand':p.speed<1?'Hold W to skate · A / D turns your skis':p.drive==='brake'?'Braking · steer across the slope':'Carve with A / D · S slows you down';
 $('route').textContent=lift?p.activeLift.name+(atTop?' · At the summit':' · Going up'):p.route;
 $('routeDot').style.background=lift?'#d6a166':[...routes,...expertRoutes,driftRoute,...HIGHLINE_TRAILS].find(r=>r.name===p.route)?.color||'#72bfb4';
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
 if(!$('trailMap').hidden)drawMap();
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
 const dt=Math.min((t-last)/1000,.1)||0;last=t;
 if(!document.hidden){
  if(started&&!paused){
   let remaining=dt;
   while(remaining>0){
    const d=Math.min(remaining,1/120);
    const events=step(p,{left:keys.a||keys.ArrowLeft,right:keys.d||keys.ArrowRight,tuck:keys.w||keys.ArrowUp,brake:keys.s||keys.ArrowDown,jump},d,view.colliders);
    jump=false;
    for(const event of events)onSkiEvent(event);
    remaining-=d;
   }
  }
  view.render(p,dt,paused||!started);
  toastTime-=paused?0:dt;
  if(toastTime<=0)$('toast').hidden=true;
  uiTimer+=dt;
  if(uiTimer>.12){ui();uiTimer=0;}
 }
 requestAnimationFrame(frame);
}
$('start').onclick=()=>{started=true;$('overlay').hidden=true;canvas.focus();toast('Press E anywhere in the base clearing to ride the chair.',5);};$('interact').onclick=interact;$('pause').onclick=pause;$('resume').onclick=pause;$('mapButton').onclick=map;$('closeMap').onclick=map;$('fullscreen').onclick=()=>{if(document.fullscreenElement)document.exitFullscreen();else $('mountain').requestFullscreen().catch(()=>{});canvas.focus();};
$('turnStyle').onclick=cycleTurnStyle;
$('mapJuniper').onclick=()=>setMapArea('juniper');
$('mapHighline').onclick=()=>setMapArea('highline');
document.addEventListener('keydown',e=>{
 if(['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName))return;
 const k=e.key.length===1?e.key.toLowerCase():e.key;
 if([' ','ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(k)&&e.target.tagName!=='BUTTON')e.preventDefault();
 if(!e.repeat){
  if(k==='p'||k==='Escape')pause();
  if(!paused&&started){
   if(k==='e')interact();
   if(k==='r')reset();
   if(k==='m')map();
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
