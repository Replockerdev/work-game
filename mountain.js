import {createMountain} from './mountain-view.js';
import {spawn,step,board,boardingLift,canUnload,unload,BASE,TOP,routes,pathX,JUNIPER,EXPERT,liftWorld,expertFaceX,expertRoute,chuteX,chuteRoute,timberX,timberRoute,juniperZ,timberlineZ,bowlRoute,bowlX,powderCenterZ} from './mountain-core.js';
const expertRoutes=[expertRoute,chuteRoute,timberRoute,bowlRoute];
const $=id=>document.getElementById(id),canvas=$('game');let view;try{view=createMountain(canvas);}catch(e){$('overlay').querySelector('h1').textContent='3D graphics unavailable';$('overlay').querySelector('p').textContent='This mountain needs WebGL. Try Chrome or Edge with graphics acceleration enabled.';throw e;}
let p=spawn(),keys={},started=false,paused=false,jump=false,last=0,toastTime=0,uiTimer=0;try{p.laps=Math.max(0,Number(localStorage.getItem('work-game-three-lines-laps'))||0);}catch{}
function toast(s,time=3){$('toast').textContent=s;$('toast').hidden=false;toastTime=time;}
function reset(){const laps=p.laps;p=spawn();p.laps=laps;keys={};jump=false;view.resetCamera();toast('Back at the chair. E to board.');canvas.focus();}
function interact(){
 if(!started||paused)return;
 if(unload(p)){jump=false;toast('Hold W to skate. Steer toward any run.',4);}
 else if(board(p)){keys={};view.resetCamera();toast(p.activeLift===EXPERT?'Heading up Timberline. Brake before the pitch.':'Heading up. Pick a line below the summit.',4);}
 else if(p.mode==='ski')toast('Ski into a lift loading area and press E to board.');
 canvas.focus();ui();
}
function pause(){if(!started)return;paused=!paused;keys={};jump=false;$('pauseOverlay').hidden=!paused;$('pause').textContent=paused?'Resume · P':'Pause · P';if(!paused)canvas.focus();}
function map(){$('trailMap').hidden=!$('trailMap').hidden;canvas.focus();}
function drawMap(){
 const c=$('map').getContext('2d'),sx=x=>64-x*.20,sz=z=>20+(z-JUNIPER.top)/(BASE.z-JUNIPER.top)*285;
 c.clearRect(0,0,250,330);
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
 for(const [route,center,start,end] of [[expertRoute,expertFaceX,26,382],[chuteRoute,chuteX,68,315],[timberRoute,timberX,182,322]]){
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
 for(let x=-692;x<=-288;x+=4)c.lineTo(sx(x),sz(powderCenterZ(x)));
 for(let z=307;z<=580;z+=4)c.lineTo(sx(bowlX(z)),sz(z));
 c.stroke();
 c.font='9px Arial';c.fillStyle='#486570';c.textAlign='center';
 c.fillText('JUNIPER SUMMIT',64,12);c.fillText('JUNIPER BASE',64,326);c.fillText('TIMBERLINE',191,248);
 c.fillText('POWDER BOWL',161,204);
 c.fillStyle=p.mode==='lift'?'#d79b55':'#254e60';c.beginPath();c.arc(sx(p.x),sz(p.z),5,0,7);c.fill();c.strokeStyle='#fff';c.lineWidth=2;c.stroke();
}
function ui(){
 const lift=p.mode==='lift',near=boardingLift(p),atTop=canUnload(p);
 const expertDescent=p.route==='Timberline Summit'||expertRoutes.some(route=>route.name===p.route);
 $('speed').textContent=lift?'—':Math.round(p.speed*3.6);
 $('laps').textContent=p.laps;
 $('movement').textContent=atTop?'Press E when you’re ready':lift?'Chairlift · '+Math.round(p.ride*100)+'%':p.air?'In the air':p.drive==='skate'?'Skating · hold W to push':p.drive==='tuck'?'Tucking · release W to stand':p.speed<1?'Hold W to skate · A / D turns your skis':'Carve with A / D · S slows you down';
 $('route').textContent=lift?p.activeLift.name+(atTop?' · At the summit':' · Going up'):p.route;
 $('routeDot').style.background=lift?'#d6a166':[...routes,...expertRoutes].find(r=>r.name===p.route)?.color||'#72bfb4';
 const atJuniperSummit=p.z<juniperZ(75);
 $('prompt').hidden=!near&&!lift&&(expertDescent||p.z<565&&!atJuniperSummit);
 $('interact').hidden=!near&&!atTop;
 $('interact').textContent=atTop?'E · Unload':'E · Board chair';
 $('promptText').textContent=atTop?'Your chair will wait here.':lift?'Press E to unload when you reach the summit.':near?'Press E to board '+near.name+'.':atJuniperSummit?'Groomer →    Park straight ahead    ← Glades':'Juniper base '+Math.round(Math.hypot(p.x-BASE.x,p.z-BASE.z))+' m · head into the base clearing';
 if(!$('trailMap').hidden)drawMap();
}
function frame(t){const dt=Math.min((t-last)/1000,.1)||0;last=t;if(!document.hidden){if(started&&!paused){let remaining=dt;while(remaining>0){const d=Math.min(remaining,1/120),events=step(p,{left:keys.a||keys.ArrowLeft,right:keys.d||keys.ArrowRight,tuck:keys.w||keys.ArrowUp,brake:keys.s||keys.ArrowDown,jump},d,view.trees);jump=false;for(const e of events){if(e==='land')toast('Landed. '+p.jumps+' clean '+(p.jumps===1?'jump':'jumps')+'.',2);if(e==='bump')toast('A soft bump. Brake and pick your way through.',2);if(e==='lap'){try{localStorage.setItem('work-game-three-lines-laps',p.laps);}catch{}toast('Lap complete. E boards in the loading area.',4);}}remaining-=d;}}
view.render(p,dt,paused||!started);toastTime-=paused?0:dt;if(toastTime<=0)$('toast').hidden=true;uiTimer+=dt;if(uiTimer>.12){ui();uiTimer=0;}}requestAnimationFrame(frame);}
$('start').onclick=()=>{started=true;$('overlay').hidden=true;canvas.focus();toast('Press E anywhere in the base clearing to ride the chair.',5);};$('interact').onclick=interact;$('pause').onclick=pause;$('resume').onclick=pause;$('mapButton').onclick=map;$('closeMap').onclick=map;$('fullscreen').onclick=()=>{if(document.fullscreenElement)document.exitFullscreen();else $('mountain').requestFullscreen().catch(()=>{});canvas.focus();};
document.addEventListener('keydown',e=>{if(['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName))return;const k=e.key.length===1?e.key.toLowerCase():e.key;if([' ','ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(k)&&e.target.tagName!=='BUTTON')e.preventDefault();if(!e.repeat){if(k==='p'||k==='Escape')pause();if(!paused&&started){if(k==='e')interact();if(k==='r')reset();if(k==='m')map();if(k===' '&&e.target.tagName!=='BUTTON')jump=true;}}if(e.target.tagName!=='BUTTON')keys[k]=true;});document.addEventListener('keyup',e=>keys[e.key.length===1?e.key.toLowerCase():e.key]=false);canvas.addEventListener('pointerdown',()=>canvas.focus());window.addEventListener('blur',()=>{keys={};if(started&&!paused)pause();});document.addEventListener('visibilitychange',()=>{if(document.hidden){keys={};if(started&&!paused)pause();}});
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
