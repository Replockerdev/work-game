import * as T from './vendor/three.module.js';
import {height,pathX,routes,jumps,BASE,obstacles,LIFT,JUNIPER,EXPERT,liftWorld,liftGround,liftCableHeight,chairProgress,expertFaceX,expertLine,expertLocal,chuteX,chuteRoute,cliffDrops,expertRocks,bowlX,bowlWidth,inBowl,bowlRocks,bowlStart,bowlEnd,powderDepth,powderCliffX,powderCliffSpan,SNOW_WEST,SNOW_EAST,SNOW_NORTH,SNOW_SOUTH,juniperZ,timberlineZ} from './mountain-core.js';
import {snowMaterial,addRange,detailedTrees,surroundingForest,rangeHeight} from './mountain-environment.js';
import {terrainNoise} from './basin-terrain.js';
import {makeSkier} from './skier-model.js';
const surfaceHeight=(x,z)=>x>=SNOW_WEST&&x<=SNOW_EAST&&z>=SNOW_NORTH&&z<=SNOW_SOUTH?height(x,z):rangeHeight(x,z);
export function createMountain(canvas){
 const renderer=new T.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1;
 const scene=new T.Scene();scene.background=new T.Color('#a5c9dc');scene.fog=new T.Fog('#c0d4e2',1200,5500);const camera=new T.PerspectiveCamera(64,1,.15,9200);
 scene.add(new T.HemisphereLight('#e4f3ff','#45648b',1.4));const sun=new T.DirectionalLight('#fff0d2',3.2);sun.position.set(-50,220,100);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-42,right:42,top:55,bottom:-45,near:1,far:220});sun.shadow.normalBias=.04;sun.shadow.bias=-.0002;scene.add(sun,sun.target);
 const mats=new Map(),mat=c=>{if(!mats.has(c))mats.set(c,new T.MeshStandardMaterial({color:c,roughness:.85,flatShading:true}));return mats.get(c);};
 function mesh(geo,c,parent=scene){const m=new T.Mesh(geo,mat(c));m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
 function box(w,h,d,c,x,y,z,parent=scene){const m=mesh(new T.BoxGeometry(w,h,d),c,parent);m.position.set(x,y,z);return m;}
 function line(points,c,parent=scene){const l=new T.Line(new T.BufferGeometry().setFromPoints(points.map(p=>new T.Vector3(...p))),new T.LineBasicMaterial({color:c}));parent.add(l);return l;}
 function trailSign(label,x,y,z,color,width=3.5,facing=-1,parent=scene){
  const canvas=document.createElement('canvas');
  canvas.width=768;
  canvas.height=150;
  const ctx=canvas.getContext('2d');
  ctx.fillStyle=color;
  ctx.fillRect(0,0,768,150);
  ctx.strokeStyle='#f0f4ef';
  ctx.lineWidth=4;
  ctx.strokeRect(11,11,746,128);
  ctx.fillStyle='#ffffff';
  ctx.font='bold 64px Arial';
  ctx.textAlign='center';
  ctx.textBaseline='middle';
  ctx.fillText(label,384,78,695);
  const map=new T.CanvasTexture(canvas);
  map.colorSpace=T.SRGBColorSpace;
  const panel=new T.Mesh(new T.PlaneGeometry(width,.69),new T.MeshBasicMaterial({map}));
  panel.position.set(x,y,z+facing*.073);
  panel.rotation.y=facing<0?Math.PI:0;
  parent.add(panel);
  box(width,.69,.14,'#343e3e',x,y,z,parent);
  return panel;
 }
 const snowWidth=SNOW_EAST-SNOW_WEST,snowLength=SNOW_SOUTH-SNOW_NORTH;
 const geo=new T.PlaneGeometry(snowWidth,snowLength,snowWidth/2.5,snowLength/2);
 geo.rotateX(-Math.PI/2);
 geo.translate((SNOW_WEST+SNOW_EAST)/2,0,(SNOW_NORTH+SNOW_SOUTH)/2);
 const pos=geo.attributes.position,colors=[];
 const flatSummit=juniperZ(90),bankStart=juniperZ(100);
 const bowlSnow=new T.Color('#eef5fa');
 const expertSnow=new T.Color('#e8eff8');
 const chuteSnow=new T.Color('#cfdfe9'),ledgeRock=new T.Color('#65717e');
 for(let i=0;i<pos.count;i++){const x=pos.getX(i),z=pos.getZ(i),y=height(x,z);pos.setY(i,y);let color=new T.Color('#dbe7ef');const trail=routes.find(r=>Math.abs(x-pathX(z,r))<r.width);if(z<flatSummit||z>575)color.set('#e9f0f2');else if(trail){color.set(trail.id==='groomer'?(Math.floor(z*.7)%2?'#edf3f5':'#e4edf1'):trail.id==='park'?'#e4edf4':'#d2e1e8');}const bank=routes.some(r=>Math.abs(Math.abs(x-pathX(z,r))-r.width)<3);if(bank&&z>bankStart&&z<560)color.multiplyScalar(.88);
  if(inBowl(x,z)){
   const edgeFade=T.MathUtils.smoothstep(bowlWidth(z)-Math.abs(x-bowlX(z)),0,10);
   const endFade=T.MathUtils.smoothstep(z,bowlStart,bowlStart+42)*(1-T.MathUtils.smoothstep(z,bowlEnd-55,bowlEnd));
   color.lerp(bowlSnow,.72*edgeFade*endFade);
  }
  if(x<-85&&z>440){
   const route=expertLine(x,z);
   if(route)color.lerp(route===chuteRoute?chuteSnow:expertSnow,.45);
   const local=expertLocal(x,z);
   for(const cliff of cliffDrops){
    const cross=1-T.MathUtils.smoothstep(Math.abs(local.x-cliff.x),cliff.width*.55,cliff.width);
    const face=1-T.MathUtils.smoothstep(Math.abs(local.z-cliff.z-1),.8,3.4);
    color.lerp(ledgeRock,cross*face*.95);
   }
  }
  if(x<-365&&y>105){
   const local=expertLocal(x,z);
   const offTrail=Math.max(T.MathUtils.smoothstep(-local.x,17,45),T.MathUtils.smoothstep(-local.z,18,55));
   const grade=Math.hypot(height(x+2,z)-height(x-2,z),height(x,z+2)-height(x,z-2))/4;
   const layers=terrainNoise(x*.037+y*.016,z*.019-y*.028);
   const grain=terrainNoise(x*.087,z*.091);
   const talus=T.MathUtils.smoothstep(grade+(layers-.5)*.93+(grain-.5)*.24,.46,.95);
   color.lerp(ledgeRock,talus*offTrail*.84*T.MathUtils.smoothstep(-x,365,415));
  }
  if(x<-286&&z>205&&z<590){
   const powder=powderDepth(x,z);
   color.lerp(bowlSnow,powder*.72);
   if(x>-533&&x<-490&&z>350&&z<456){
    const band=1-T.MathUtils.smoothstep(Math.abs(x-powderCliffX(z)-1.7),1.8,5);
    color.lerp(ledgeRock,band*powderCliffSpan(z)*.96);
   }
  }
  const n=Math.sin(x*.31+z*.047)*.024; color.offsetHSL(0,0,n);colors.push(color.r,color.g,color.b);}
 geo.setAttribute('color',new T.Float32BufferAttribute(colors,3));geo.computeVertexNormals();const ground=new T.Mesh(geo,snowMaterial(renderer));ground.receiveShadow=true;scene.add(ground);
 // Visible trail-edge poles and arrows make all three routes converge at the base.
 for(const r of routes){for(let section=100;section<=560;section+=30){const z=juniperZ(section);for(const side of [-1,1]){const x=pathX(z,r)+r.width*side;if(r.id==='groomer'&&side===-1&&inBowl(x,z,3))continue;box(.14,1.6,.14,r.color,x,height(x,z)+.8,z);box(.55,.25,.12,r.color,x,height(x,z)+1.55,z);}}
 const z=juniperZ(110),x=pathX(z,r)+r.width*.65,y=height(x,z);
 const colors={groomer:'#237449',park:'#98500e',glades:'#254d77'};
 box(.15,1.75,.15,'#68523f',x,y+.87,z);
 trailSign(r.name,x,y+1.65,z,colors[r.id]);}
 const guideZ=juniperZ(65),guideX=-5,guideY=height(guideX,guideZ);
 box(.18,3,.18,'#68523f',guideX,guideY+1.5,guideZ);
 trailSign('Groomer  →',guideX,guideY+2.7,guideZ,'#237449');
 trailSign('Park  ↑',guideX,guideY+1.95,guideZ,'#98500e');
 trailSign('←  Glades',guideX,guideY+1.2,guideZ,'#254d77');
 for(const j of jumps){for(const side of [-1,1]){box(.16,2.2,.16,'#e9a66e',side*(j.width+1),height(side*(j.width+1),j.z)+1.1,j.z);box(1.2,.7,.08,'#e9a66e',side*(j.width+1),height(side*(j.width+1),j.z)+1.8,j.z);}line([[-j.width,height(0,j.z-.05)+.09,j.z-.05],[j.width,height(0,j.z-.05)+.09,j.z-.05]],'#e3a66e');}
 for(const z of [565,594]){
  const x=7,y=height(x,z);
  box(.15,1.75,.15,'#68523f',x,y+.87,z);
  trailSign('Lift base  →',x,y+1.65,z,'#355663');
 }
 const expertSignZ=518,expertSignX=pathX(expertSignZ,routes[0])-11;
 const expertSignY=height(expertSignX,expertSignZ);
 box(.16,2,.16,'#445a62',expertSignX,expertSignY+1,expertSignZ);
 trailSign('◆  Timberline Chair  →',expertSignX,expertSignY+1.85,expertSignZ,'#354356',5.4);
 const trees=obstacles();const forest=detailedTrees(scene,[...trees,...surroundingForest()]);addRange(scene);
 const rockShape=new T.DodecahedronGeometry(1,0);
 for(const [i,{x,z,size}] of bowlRocks.entries()){
  const rock=mesh(rockShape,i%2?'#69767b':'#535e64');
  rock.scale.set(size,size*.72,size*.85);
  rock.rotation.set(.18*i,.63*i,-.27);
  rock.position.set(x,height(x,z)+size*.18,z);
 }
 for(const [i,{x,z,size}] of expertRocks.entries()){
  const rock=mesh(rockShape,i%2?'#65727e':'#515e6a');
  rock.scale.set(size*.86,size*.9,size*1.18);
  rock.rotation.set(.21*i,.8*i,-.24+i*.06);
  rock.position.set(x,height(x,z)+size*.33,z);
  const cap=mesh(rockShape,'#dbe5ed');
  cap.scale.copy(rock.scale).multiplyScalar(.68);
  cap.rotation.copy(rock.rotation);
  cap.position.copy(rock.position);
  cap.position.y+=size*.37;
 }
 function makeLift(config){
  const group=new T.Group();
  group.position.set(config.x,0,config.z);
  group.rotation.y=config.yaw;
  group.scale.x=config.hand;
  scene.add(group);
  const upX=config.center+8,downX=config.center-8;
  const groundHeight=(x,z)=>liftGround(config,x,z);
  const cableHeight=z=>liftCableHeight(z,config);
  const liftBox=(w,h,d,color,x,y,z,parent=group)=>box(w,h,d,color,x,y,z,parent);
  const liftSign=(label,x,y,z,color,width,facing)=>{
   trailSign(label,x,y,z,color,width,facing,group).scale.x=config.hand;
  };
  const liftLine=(points,color)=>line(points,color,group);
  // One continuous chairlift, with a visible cable, towers, terminals and moving chairs.
  const cable=[];for(let z=config.top;z<config.bottom;z+=2)cable.push([upX,cableHeight(z),z]);
  cable.push([upX,cableHeight(config.bottom),config.bottom]);
  for(const z of config.towers.slice(1,-1)){const h=groundHeight(config.center,z),c=cableHeight(z),beam=c+LIFT.crossbeamClearance;liftBox(LIFT.towerWidth,beam-h,.9,'#607580',config.center,(beam+h)/2,z);liftBox(21,.5,1.1,'#526874',config.center,beam,z);liftBox(2,.5,2,'#777b73',config.center,h+.1,z);for(const x of [upX,downX]){for(const dz of [-1.1,-.4,.4,1.1]){const wheel=mesh(new T.CylinderGeometry(.34,.34,.18,12),'#354a57',group);wheel.rotation.z=Math.PI/2;wheel.position.set(x,c+.34,z+dz);}liftBox(1.1,.18,3.4,'#647983',x,c+.85,z);}for(let y=h+1;y<beam-1;y+=.9)liftBox(.7,.06,.16,'#9aa7a6',config.center+.55,y,z);}
  function terminal(z,name,isBase){
   const center=config.center;
   const cableY=cableHeight(z);
   const approach=isBase?-1:1;
   const eaveY=cableY+2;
   const shedZ=z-approach*3;
   const steel='#445a62',roof=config===EXPERT?'#384451':'#36515b',wood='#9a785a';

   // Four columns sit outside both chair lanes and carry a shallow gable.
   for(const x of [center-11.5,center+11.5]){
    for(const postZ of [shedZ-6.5,shedZ+6.5]){
     const groundY=groundHeight(x,postZ);
     liftBox(.85,.48,.85,'#a4aba8',x,groundY+.2,postZ);
     liftBox(.42,eaveY-groundY,.42,steel,x,(groundY+eaveY)/2,postZ);
    }
    liftBox(.38,.54,15.5,steel,x,eaveY,shedZ);
   }
   for(const sign of [-1,1]){
    const panel=liftBox(12.7,.26,17,roof,center+sign*6.15,eaveY+1.15,shedZ);
    panel.rotation.z=-sign*.17;
    const snowCap=liftBox(12.6,.12,16.9,'#e3ebee',panel.position.x,panel.position.y+.16,shedZ);
    snowCap.rotation.z=panel.rotation.z;
   }
   liftBox(24,.48,.5,steel,center,eaveY,shedZ-7.5);
   liftBox(24,.48,.5,steel,center,eaveY,shedZ+7.5);
   liftBox(6.8,1.05,5.5,'#68818a',center,cableY+.9,z);
   for(let x=center-2.5;x<=center+2.5;x+=.5){
    liftBox(.06,.35,.04,steel,x,cableY+.9,z+approach*2.77);
   }

   // The operator booth is beside the loading lane, clear of the cable and skis.
   const boothX=center-14.7;
   const boothY=groundHeight(boothX,shedZ);
   liftBox(4.3,3.2,5.2,wood,boothX,boothY+1.6,shedZ);
   liftBox(4.65,.23,5.65,roof,boothX,boothY+3.26,shedZ);
   liftBox(4.5,.10,5.5,'#e3ebee',boothX,boothY+3.41,shedZ);
   liftBox(.06,1.2,2.25,'#334b56',boothX+2.16,boothY+2.05,shedZ);
   liftBox(.07,.95,1.95,'#a9c9d2',boothX+2.18,boothY+2.08,shedZ);
   liftBox(.1,1.05,.07,steel,boothX+2.21,boothY+2.08,shedZ);
   const signX=upX+9;
   const signZ=z+approach*10;
   const signY=groundHeight(signX,signZ)+2.2;
   liftBox(.17,2.25,.17,steel,signX,signY-1.1,signZ);
   liftSign(name,signX,signY,signZ,'#355663',4.2,approach);

   // Low ropes mark the entrance without putting a raised floor over the snow.
   if(isBase){
    for(const x of [upX-2.8,upX+2.8]){
     const rope=[];
     for(let d=8;d<=20;d+=4){
      const postZ=z-d;
      const groundY=groundHeight(x,postZ);
      liftBox(.13,1.02,.13,steel,x,groundY+.51,postZ);
      rope.push([x,groundY+.86,postZ]);
     }
     liftLine(rope,'#a87b43');
    }
   }
  }
  terminal(config.bottom,config.name+'  ·  Load',true);
  terminal(config.top,config===EXPERT?'Timberline Summit':'Juniper Summit',false);
  const rampVertices=[];
  for(let z=config.top-8;z<config.top+5;z++){
   const left=upX-1.9,right=upX+1.9;
   const a=[left,groundHeight(left,z)+.06,z],b=[right,groundHeight(right,z)+.06,z];
   const c=[left,groundHeight(left,z+1)+.06,z+1],d=[right,groundHeight(right,z+1)+.06,z+1];
   rampVertices.push(...a,...c,...b,...b,...c,...d);
  }
  const rampGeometry=new T.BufferGeometry();
  rampGeometry.setAttribute('position',new T.Float32BufferAttribute(rampVertices,3));
  rampGeometry.computeVertexNormals();
  const ramp=mesh(rampGeometry,'#cbdde1',group);
  ramp.castShadow=false;
  const unloadSignX=upX+3.1,unloadSignZ=config.top+2;
  const unloadSignY=groundHeight(unloadSignX,unloadSignZ);
  liftBox(.14,1.8,.14,'#445a62',unloadSignX,unloadSignY+.9,unloadSignZ);
  liftSign('E · Unload',unloadSignX,unloadSignY+1.65,unloadSignZ,'#237449',2.5,1);
  if(config===EXPERT){
   const x=expertFaceX(46)+23,z=timberlineZ(46),y=groundHeight(x,z);
   liftBox(.16,2.6,.16,'#445a62',x,y+1.3,z);
   liftSign('◆  Timberline Face  ↑',x,y+2.4,z,'#303944',5.5,-1);
   liftSign('◆◆  Splitrock  →',x,y+1.65,z,'#493d58',5.5,-1);
   const bowlSignX=16,bowlSignZ=timberlineZ(32),bowlSignY=groundHeight(bowlSignX,bowlSignZ);
   liftBox(.14,2.25,.14,'#445a62',bowlSignX,bowlSignY+1.12,bowlSignZ);
   liftSign('←  Powder Bowl',bowlSignX,bowlSignY+2,bowlSignZ,'#417587',5,-1);
   const chuteZ=103,chuteMarkerX=chuteX(chuteZ)+9;
   const markerY=groundHeight(chuteMarkerX,chuteZ);
   liftBox(.13,1.7,.13,'#445a62',chuteMarkerX,markerY+.85,chuteZ);
   liftSign('◆◆',chuteMarkerX,markerY+1.55,chuteZ,'#493d58',1.45,-1);
   const treeSignX=37,treeSignZ=timberlineZ(176),treeSignY=groundHeight(treeSignX,treeSignZ);
   liftBox(.13,1.85,.13,'#445a62',treeSignX,treeSignY+.92,treeSignZ);
   liftSign('←  Pine Thread',treeSignX,treeSignY+1.72,treeSignZ,'#466956',3.8,-1);
   const runoutX=expertFaceX(358)+18,runoutZ=timberlineZ(358),runoutY=groundHeight(runoutX,runoutZ);
   liftBox(.16,2.6,.16,'#445a62',runoutX,runoutY+1.3,runoutZ);
   liftSign('←  Timberline Chair',runoutX,runoutY+2.4,runoutZ,'#354356',4.8,-1);
   liftSign('Juniper Base  →',runoutX,runoutY+1.65,runoutZ,'#355663',4.8,-1);
  }
  const frameMat=new T.MeshStandardMaterial({color:'#586d79',roughness:.4,metalness:.65});
  function pipe(points,r=.055,parent=group){const curve=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p)));const o=new T.Mesh(new T.TubeGeometry(curve,Math.max(6,points.length*3),r,6,false),frameMat);o.castShadow=true;parent.add(o);return o;}
  const cableMaterial=new T.MeshStandardMaterial({color:'#303c43',roughness:.62});
  function haulRope(points){
   const curve=new T.CatmullRomCurve3(points.map(point=>new T.Vector3(...point)));
   group.add(new T.Mesh(new T.TubeGeometry(curve,points.length*2,.055,6,false),cableMaterial));
  }
  haulRope(cable);
  haulRope(cable.map(([x,y,z])=>[downX,y,z]));
  function chair(){const g=new T.Group();group.add(g);for(let i=0;i<4;i++){const x=-1.3+i*.87;liftBox(.8,.19,1.25,'#a57455',x,1,0,g);liftBox(.8,.65,.15,'#a57455',x,1.55,-.62,g);liftBox(.75,.035,1.15,'#c19471',x,1.11,0,g);}pipe([[-1.75,1,-.6],[-1.75,2.7,-.6],[0,3.3,-.6],[1.75,2.7,-.6],[1.75,1,-.6]],.065,g);pipe([[0,3.3,-.6],[0,4.65,-.45],[0,5.2,0]],.075,g);liftBox(.25,.16,.5,'#303c43',0,5.2,0,g);pipe([[-1.65,2.1,-.5],[-1.65,1.65,.7],[1.65,1.65,.7],[1.65,2.1,-.5]],.045,g);for(const x of[-.9,.9]){pipe([[x,1.65,.7],[x,.62,1.02],[x,.62,1.4]],.035,g);}return g;}
  const chairs=Array.from({length:config===EXPERT?8:12},chair),occupied=chair();occupied.visible=false;occupied.rotation.y=Math.PI;
  const turnSeconds=3,cycleSeconds=2*(config.rideSeconds+turnSeconds);
  function turnChair(chair,progress,atSummit){
   const angle=Math.PI*progress,direction=atSummit?1:-1;
   const terminalZ=atSummit?config.top:config.bottom;
   chair.position.set(config.center+direction*8*Math.cos(angle),cableHeight(terminalZ)-5.2,terminalZ-direction*8*Math.sin(angle));
   chair.rotation.y=atSummit?Math.PI+angle:angle;
  }
  function moveChair(chair,seconds){
   const position=(seconds%cycleSeconds+cycleSeconds)%cycleSeconds;
   const uphill=position<config.rideSeconds+turnSeconds;
   const phase=position-(uphill?0:config.rideSeconds+turnSeconds);
   if(phase>=config.rideSeconds){
    turnChair(chair,(phase-config.rideSeconds)/turnSeconds,uphill);
    return;
   }
   const t=chairProgress(phase/config.rideSeconds);
   const z=uphill?config.bottom+(config.top-config.bottom)*t:config.top+(config.bottom-config.top)*t;
   chair.position.set(uphill?upX:downX,cableHeight(z)-5.2,z);
   chair.rotation.y=uphill?Math.PI:0;
  }

  const bullwheels=[];for(const z of[config.top,config.bottom]){const c=cableHeight(z),g=new T.Group();g.position.set(config.center,c+.25,z);group.add(g);const rim=new T.Mesh(new T.TorusGeometry(8,.18,6,36),frameMat);rim.rotation.x=Math.PI/2;g.add(rim);const hub=new T.Mesh(new T.CylinderGeometry(.9,.9,.8,12),frameMat);g.add(hub);for(let i=0;i<8;i++){const spoke=liftBox(7.8,.15,.15,'#657985',0,0,0,g);spoke.position.set(Math.cos(i*Math.PI/4)*4,0,Math.sin(i*Math.PI/4)*4);spoke.rotation.y=-i*Math.PI/4;}bullwheels.push(g);const arc=[];for(let i=0;i<=40;i++){const a=i/40*Math.PI;arc.push([config.center+Math.cos(a)*8,c,z+(z===config.top?-1:1)*Math.sin(a)*8]);}haulRope(arc);}
  let waiting=false,departure=-Infinity;
  return function animateLift(player,time){
   for(const wheel of bullwheels)wheel.rotation.y=time*.7;
   const active=player.activeLift===config;
   if(waiting&&active&&player.mode==='ski')departure=time;
   waiting=active&&player.mode==='lift'&&player.ride===1;
   const leaving=time-departure;
   occupied.visible=active&&(player.mode==='lift'||leaving<turnSeconds);
   if(active&&player.mode==='lift'){
    const z=config.bottom+(config.top-config.bottom)*chairProgress(player.ride);
    occupied.position.set(upX,player.y-.6,z);
    occupied.rotation.y=Math.PI;
   }else if(occupied.visible){
    turnChair(occupied,leaving/turnSeconds,true);
   }
   for(let i=0;i<chairs.length;i++){
    const empty=chairs[i];
    moveChair(empty,time+i*cycleSeconds/chairs.length);
    empty.visible=!occupied.visible||empty.position.distanceToSquared(occupied.position)>16;
   }
  };
 }
 const animateJuniper=makeLift(JUNIPER),animateExpert=makeLift(EXPERT);
 const rig=makeSkier(scene),skier=rig.root;
 // Two persistent ski tracks follow every grounded turn.
 const max=6000,trackPositions=new Float32Array(max*6),trackGeo=new T.BufferGeometry();trackGeo.setAttribute('position',new T.BufferAttribute(trackPositions,3));trackGeo.setDrawRange(0,0);const tracks=new T.LineSegments(trackGeo,new T.LineBasicMaterial({color:'#9cbacb',transparent:true,opacity:.55}));scene.add(tracks);let trackCount=0,previous=null;
 tracks.frustumCulled=false;
 const puffStamp=document.createElement('canvas');puffStamp.width=puffStamp.height=32;
 const puffContext=puffStamp.getContext('2d');
 const fade=puffContext.createRadialGradient(16,16,0,16,16,16);
 fade.addColorStop(0,'rgba(255,255,255,.85)');
 fade.addColorStop(1,'rgba(255,255,255,0)');
 puffContext.fillStyle=fade;puffContext.fillRect(0,0,32,32);
 const puffPositions=new Float32Array(60*3);
 const puffs=new T.Points(new T.BufferGeometry(),new T.PointsMaterial({
  color:'#fff',map:new T.CanvasTexture(puffStamp),size:.22,transparent:true,opacity:.75,depthWrite:false
 }));
 puffs.geometry.setAttribute('position',new T.BufferAttribute(puffPositions,3));puffs.frustumCulled=false;scene.add(puffs);
 let w=0,h=0,time=0,camReady=false,camHeading=0;
 const camPos=new T.Vector3(),look=new T.Vector3(),desired=new T.Vector3();
 function render(p,dt,paused=false){time+=paused?0:dt;if(w!==canvas.clientWidth||h!==canvas.clientHeight){w=canvas.clientWidth;h=canvas.clientHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();}
 const lift=p.mode==='lift',config=p.activeLift??JUNIPER;
 const offset=liftWorld(config,-.44,0);
 skier.position.set(lift?p.x+offset.x-config.x:p.x,p.y+(lift||p.air?.12:0),lift?p.z+offset.z-config.z:p.z);
 const skiX=Math.sin(p.angle)*.4,skiZ=Math.cos(p.angle)*.4;
 const airPitch=!lift&&p.air?Math.atan2(height(p.x+skiX,p.z+skiZ)-height(p.x-skiX,p.z-skiZ),.8)*-.65:0;
 const airBank=!lift&&p.air?-p.yaw*Math.min(.25,p.speed*.015):0;
 skier.rotation.set(airPitch,lift?config.yaw+Math.PI:p.angle,airBank,'YXZ');
 rig.animate(p,time);
 animateJuniper(p,time);
 animateExpert(p,time);
 if(!lift&&!p.air&&p.speed>1&&!paused){if(previous&&Math.hypot(p.x-previous.x,p.z-previous.z)<3){for(const side of [-1,1]){const ox=Math.cos(p.angle)*.29*side,oz=-Math.sin(p.angle)*.29*side;const k=(trackCount++%max)*6;trackPositions.set([previous.x+ox,previous.y+.04,previous.z+oz,p.x+ox,height(p.x+ox,p.z+oz)+.04,p.z+oz],k);}trackGeo.attributes.position.needsUpdate=true;trackGeo.setDrawRange(0,Math.min(trackCount,max)*2);}previous={x:p.x,y:p.y,z:p.z};}else previous=null;
 puffs.visible=!lift&&!p.air&&p.speed>4;
 if(puffs.visible){
  const powder=powderDepth(p.x,p.z),sin=Math.sin(p.angle),cos=Math.cos(p.angle);
  const spread=.24+Math.abs(p.yaw)*.72+powder*.8;
  const length=2+powder*2.2;
  const rise=height(p.x-sin*length,p.z-cos*length)-p.y;
  puffs.material.size=.22+powder*.72;
  for(let i=0;i<60;i++){
   const t=(time*2+i*.17)%1,lateral=Math.cos(i*8.7)*t*spread;
   const behind=t*length;
   puffPositions[i*3]=p.x+cos*lateral-sin*behind;
   puffPositions[i*3+1]=p.y+rise*t+t*(.62+powder*.9)*(.55+.45*Math.sin(i*3.4)**2);
   puffPositions[i*3+2]=p.z-sin*lateral-cos*behind;
  }
  puffs.geometry.attributes.position.needsUpdate=true;
 }
 const heading=p.mode==='ski'?p.angle:config.yaw;
 const turn=heading-camHeading;
 camHeading=camReady?camHeading+Math.atan2(Math.sin(turn),Math.cos(turn))*(1-Math.exp(-dt*7)):heading;
 const forwardX=Math.sin(camHeading),forwardZ=Math.cos(camHeading);
 // Close in beneath the terminal roof before the usual trailing camera resumes.
 const summit=liftWorld(config,config.center+8,config.top);
 const dock=1-T.MathUtils.smoothstep(Math.hypot(p.x-summit.x,p.z-summit.z),9,26);
 const behind=T.MathUtils.lerp(lift?17:13.5,4,dock),ahead=T.MathUtils.lerp(lift?38:14,5.5,dock);
 const eyeX=p.x-forwardX*behind,eyeZ=p.z-forwardZ*behind;
 const lookX=p.x+forwardX*ahead,lookZ=p.z+forwardZ*ahead;
 const eyeY=Math.max(p.y+T.MathUtils.lerp(lift?6:8.5,3.7,dock),surfaceHeight(eyeX,eyeZ)+3);
 const rearView=T.MathUtils.smoothstep(-forwardZ,.45,1)*(1-T.MathUtils.smoothstep(p.z,juniperZ(50),juniperZ(105)));
 const lookY=lift?p.y+T.MathUtils.lerp(2,1,dock):Math.max(p.y-6,surfaceHeight(lookX,lookZ)+.6)+rearView*4;
 desired.set(eyeX,eyeY,eyeZ);
 if(!camReady){camPos.copy(desired);look.y=lookY;camReady=true;}
 camPos.lerp(desired,1-Math.exp(-dt*10));
 camPos.y=Math.max(camPos.y,surfaceHeight(camPos.x,camPos.z)+3);
 camera.position.copy(camPos);
 look.set(lookX,T.MathUtils.lerp(look.y,lookY,1-Math.exp(-dt*6)),lookZ);
 camera.lookAt(look);
 sun.position.set(p.x-45,p.y+85,p.z-25);
 sun.target.position.set(p.x+forwardX*15,p.y,p.z+forwardZ*15);
 sun.target.updateMatrixWorld();
 forest.clearSightline(camera.position,skier.position,dt);
 renderer.render(scene,camera);}
 return {render,trees:[...trees,...bowlRocks,...expertRocks],resetCamera(){camReady=false;previous=null;}};
}
