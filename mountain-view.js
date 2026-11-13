import * as T from './vendor/three.module.js';
import {height,pathX,routes,jumps,BASE,obstacles,LIFT,JUNIPER,EXPERT,liftWorld,liftGround,liftCableHeight,liftSupports,liftCycleSeconds,liftTerminalTurn,liftChairPosition,expertFaceX,expertLine,expertLocal,chuteX,chuteRoute,cliffDrops,chuteHalfWidth,chuteRockMask,bowlX,bowlWidth,inBowl,bowlRocks,bowlStart,bowlEnd,powderDepth,powderCliffOffset,powderCliffSpan,powderToGladeMask,driftDepth,snowDepth,ridgeDropLip,ridgeDropMask,SNOW_WEST,SNOW_EAST,SNOW_NORTH,SNOW_SOUTH,juniperZ,timberlineZ} from './mountain-core.js';
import {snowMaterial,addRange,detailedTrees,surroundingForest,rangeHeight} from './mountain-environment.js';
import {terrainNoise} from './basin-terrain.js';
import {makeSkier} from './skier-model.js';
import {OLD_EAST,HIGHLINE_LIFTS,HIGHLINE_PEAK,TREELINE,HOLLOW_BASE,HOLLOW_LINK,HOLLOW_RETURN,RACE_GATES,highlineTrailAt,highlineRock} from './highline.js';
const surfaceHeight=(x,z)=>x>=SNOW_WEST&&x<=SNOW_EAST&&z>=SNOW_NORTH&&z<=SNOW_SOUTH?height(x,z):rangeHeight(x,z);
export function createMountain(canvas){
 const renderer=new T.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1;
 const scene=new T.Scene();scene.background=new T.Color('#a5c9dc');scene.fog=new T.Fog('#c0d4e2',1200,5500);const camera=new T.PerspectiveCamera(64,1,.15,9200);
 scene.add(new T.HemisphereLight('#e4f3ff','#45648b',1.4));const sun=new T.DirectionalLight('#fff0d2',3.2);sun.position.set(-50,220,100);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-42,right:42,top:55,bottom:-45,near:1,far:220});sun.shadow.normalBias=.04;sun.shadow.bias=-.0002;scene.add(sun,sun.target);
 const mats=new Map(),mat=c=>{if(!mats.has(c))mats.set(c,new T.MeshStandardMaterial({color:c,roughness:.85,flatShading:true}));return mats.get(c);};
 function mesh(geo,c,parent=scene){const m=new T.Mesh(geo,mat(c));m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
 function box(w,h,d,c,x,y,z,parent=scene){const m=mesh(new T.BoxGeometry(w,h,d),c,parent);m.position.set(x,y,z);return m;}
 function line(points,c,parent=scene){const l=new T.Line(new T.BufferGeometry().setFromPoints(points.map(p=>new T.Vector3(...p))),new T.LineBasicMaterial({color:c}));parent.add(l);return l;}
 function trailSign(label,x,y,z,color,width=3.5,facing=-1,parent=scene,panelHeight=.69){
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
  const panel=new T.Mesh(new T.PlaneGeometry(width,panelHeight),new T.MeshBasicMaterial({map}));
  panel.position.set(x,y,z+facing*.073);
  panel.rotation.y=facing<0?Math.PI:0;
  parent.add(panel);
  box(width,panelHeight,.14,'#343e3e',x,y,z,parent);
  return panel;
 }
 const snowWidth=SNOW_EAST-SNOW_WEST,snowLength=SNOW_SOUTH-SNOW_NORTH;
 const xs=[],rows=[];
 for(let x=SNOW_WEST;x<OLD_EAST;x+=2.5)xs.push(x);
 for(let x=OLD_EAST;x<SNOW_EAST;x+=x<535?4:x<855?2:3)xs.push(x);
 xs.push(SNOW_EAST);
 const columns=xs.length-1;
 // Finer cross-slope samples through Splitrock keep its steep walls readable.
 for(let z=SNOW_NORTH;z<SNOW_SOUTH;z+=z>=536&&z<664?1:2)rows.push(z);
 rows.push(SNOW_SOUTH);
 const geo=new T.PlaneGeometry(snowWidth,snowLength,columns,rows.length-1);
 geo.rotateX(-Math.PI/2);
 geo.translate((SNOW_WEST+SNOW_EAST)/2,0,(SNOW_NORTH+SNOW_SOUTH)/2);
 const pos=geo.attributes.position,uv=geo.attributes.uv,colors=[];
 const rockExposure=new Float32Array(pos.count);
 for(let i=0;i<pos.count;i++){
  const z=rows[Math.floor(i/(columns+1))];
  const x=xs[i%(columns+1)];
  pos.setX(i,x);pos.setZ(i,z);
  uv.setX(i,(x-SNOW_WEST)/snowWidth);uv.setY(i,1-(z-SNOW_NORTH)/snowLength);
 }
 const flatSummit=juniperZ(90),bankStart=juniperZ(100);
 const bowlSnow=new T.Color('#eef5fa');
 const driftSnow=new T.Color('#edf5ff');
 const expertSnow=new T.Color('#e8eff8');
 const chuteSnow=new T.Color('#cfdfe9'),ledgeRock=new T.Color('#65717e');
 const rockShade=new T.Color('#37444e'),weatheredRock=new T.Color('#847468'),wallColor=new T.Color();
 for(let i=0;i<pos.count;i++){const x=pos.getX(i),z=pos.getZ(i),y=height(x,z);pos.setY(i,y);let color=new T.Color('#dbe7ef');const trail=routes.find(r=>Math.abs(x-pathX(z,r))<r.width);if(z<flatSummit||z>575)color.set('#e9f0f2');else if(trail){color.set(trail.id==='groomer'?'#eaf1f4':trail.id==='park'?'#e4edf4':'#d2e1e8');}const bank=routes.some(r=>Math.abs(Math.abs(x-pathX(z,r))-r.width)<3);if(bank&&z>bankStart&&z<560)color.multiplyScalar(.88);
  if(inBowl(x,z)){
   const edgeFade=T.MathUtils.smoothstep(bowlWidth(z)-Math.abs(x-bowlX(z)),0,10);
   const endFade=T.MathUtils.smoothstep(z,bowlStart,bowlStart+42)*(1-T.MathUtils.smoothstep(z,bowlEnd-55,bowlEnd));
   color.lerp(bowlSnow,.72*edgeFade*endFade);
  }
  if(x<-85&&z>440){
   const route=expertLine(x,z);
   if(route)color.lerp(route===chuteRoute?chuteSnow:expertSnow,.45);
   const local=expertLocal(x,z);
   const wall=chuteRockMask(local.x,local.z);
   if(wall>0){
    const strata=terrainNoise(local.z*.051+y*.083,local.x*.23-y*.057);
    const grain=terrainNoise(x*.24,z*.21);
    const weathering=terrainNoise(x*.047+y*.035,z*.091);
    const dust=terrainNoise(local.z*.11,local.x*.12+y*.054);
    const exposed=wall*(1-.68*T.MathUtils.smoothstep(dust,.55,.79));
    wallColor.copy(ledgeRock).lerp(weatheredRock,.58*weathering)
     .lerp(rockShade,.12+.63*strata).multiplyScalar(.84+.27*grain);
    rockExposure[i]=exposed;
    color.lerp(wallColor,exposed*.98);
   }
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
   const cliffOffset=powderCliffOffset(x,z);
   if(Math.abs(cliffOffset-1.7)<5){
    const band=1-T.MathUtils.smoothstep(Math.abs(cliffOffset-1.7),1.8,5);
    color.lerp(ledgeRock,band*powderCliffSpan(z)*.96);
   }
  }
  const glade=Math.max(driftDepth(x,z),ridgeDropMask(x,z)*(1-T.MathUtils.smoothstep(z,478,532)),powderToGladeMask(x,z)*.78);
  color.lerp(driftSnow,glade*.78);
  color.multiplyScalar(1+glade*(terrainNoise(x*.17,z*.13)-.5)*.065);
  const alpine=highlineTrailAt(x,z);
  if(x>OLD_EAST){
   const wind=terrainNoise(x*.028,z*.028);
   color.set(y>340?'#e3edf4':'#dae9ee').multiplyScalar(.9+.16*wind);
   if(alpine?.kind==='groomer'||alpine?.kind==='race')color.lerp(expertSnow,.75);
   const rock=highlineRock(x,z);
   if(rock>0){
    const strata=terrainNoise(x*.15+y*.11,z*.14);
    wallColor.copy(ledgeRock).lerp(weatheredRock,.33).lerp(rockShade,.6*strata);
    color.lerp(wallColor,rock*.96);
    rockExposure[i]=rock;
   }
  }
  if(alpine===HOLLOW_LINK||alpine===HOLLOW_RETURN)color.lerp(expertSnow,.58);
 if(x>-230&&x<-105&&z>397&&z<432){
   const face=1-T.MathUtils.smoothstep(Math.abs(z-ridgeDropLip(x)-1.8),1.5,5.8);
   const rock=terrainNoise(x*.19,z*.13);
   color.lerp(ledgeRock,face*ridgeDropMask(x,z)*(.80+rock*.2));
  }
  const tint=terrainNoise(x*.073,z*.071);
  color.multiplyScalar(.985+.03*tint);colors.push(color.r,color.g,color.b);}
 geo.setAttribute('color',new T.Float32BufferAttribute(colors,3));
 geo.setAttribute('rockExposure',new T.BufferAttribute(rockExposure,1));
 geo.computeVertexNormals();const ground=new T.Mesh(geo,snowMaterial(renderer));ground.receiveShadow=true;scene.add(ground);
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
 const driftSignX=-61,driftSignZ=juniperZ(52),driftSignY=height(driftSignX,driftSignZ);
 box(.16,2.25,.16,'#68523f',driftSignX,driftSignY+1.12,driftSignZ);
 trailSign('Snowdrift Glade  →',driftSignX,driftSignY+2.05,driftSignZ,'#365c50',5.6);
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
 const trees=obstacles();
 const forest=detailedTrees(scene,[...trees,...surroundingForest()]);
 const colliders=[...trees,...bowlRocks,...addRange(scene)];
 function waymark(label,x,z,color,width=5.3){
  const y=height(x,z);
  box(.15,2.2,.15,'#725c49',x,y+1.1,z);
  trailSign(label,x,y+1.9,z,color,width);
 }
 waymark('← Hidden Hollow',86,155,'#3b6252',5.8);
 waymark('← Highline Chair',TREELINE.x-2,TREELINE.z+14,'#345b70',6.2);
 waymark('Meadow Way →',737,177,'#347652');
 waymark('Fir Hollow',777,184,'#487253',4.6);
 waymark('← Ridgeline Race',823,178,'#965825',6);
 waymark('Sunbreak Bowl',HIGHLINE_PEAK.x+40,HIGHLINE_PEAK.z+23,'#4f7484',6.2);
 waymark('◆ Needle',HIGHLINE_PEAK.x+12,HIGHLINE_PEAK.z+25,'#4c506b',4.6);
 waymark('Windward Bowl',HIGHLINE_PEAK.x-13,HIGHLINE_PEAK.z+25,'#4b6a7e',6.2);
 waymark('◆ Juniper Notch',HIGHLINE_PEAK.x-38,HIGHLINE_PEAK.z+23,'#664d71',6.2);
 waymark('Juniper return →',HOLLOW_BASE.x-14,HOLLOW_BASE.z+15,'#3b6252',6);
 for(const [index,gate] of RACE_GATES.entries()){
  const terminal=index===0||index===RACE_GATES.length-1;
  const color=terminal?'#b57838':index%2?'#b9473a':'#306f9d';
  for(const side of [-1,1]){
   const x=gate.x+gate.dz*gate.width*side,z=gate.z-gate.dx*gate.width*side;
   const y=height(x,z);
   box(.13,2.4,.13,color,x,y+1.2,z);
   const flag=box(1.55,.68,.1,color,x,y+2,z);
   flag.rotation.y=Math.atan2(-gate.dx,gate.dz);
  }
  if(terminal){
   const mark=[];
   for(let i=-10;i<=10;i++){
    const x=gate.x+gate.dz*gate.width*i/10,z=gate.z-gate.dx*gate.width*i/10;
    mark.push([x,height(x,z)+.09,z]);
   }
   line(mark,color);
   const side=gate.width+3;
   waymark(index===0?'RACE START':'FINISH',gate.x+gate.dz*side,gate.z-gate.dx*side,color,4.4);
  }
 }
 const rockShape=new T.DodecahedronGeometry(1,0);
 for(const [i,{x,z,size}] of bowlRocks.entries()){
  const rock=mesh(rockShape,i%2?'#69767b':'#535e64');
  rock.scale.set(size,size*.72,size*.85);
  rock.rotation.set(.18*i,.63*i,-.27);
  rock.position.set(x,height(x,z)+size*.18,z);
 }
 function makeLift(config){
  const group=new T.Group();
  group.position.set(config.x,0,config.z);
  group.rotation.y=config.yaw;
  group.scale.x=config.hand;
  scene.add(group);
 const upX=config.center+LIFT.lane,downX=config.center-LIFT.lane;
  const groundHeight=(x,z)=>liftGround(config,x,z);
  const cableHeight=z=>liftCableHeight(z,config);
  const liftBox=(w,h,d,color,x,y,z,parent=group)=>box(w,h,d,color,x,y,z,parent);
  function solidBox(w,h,d,color,x,y,z){
   liftBox(w,h,d,color,x,y,z);
   colliders.push({...liftWorld(config,x,z),top:y+h/2,box:{
    cos:Math.cos(config.yaw),sin:Math.sin(config.yaw),halfWidth:w/2,halfDepth:d/2
   }});
  }
  const liftSign=(label,x,y,z,color,width,facing)=>{
   trailSign(label,x,y,z,color,width,facing,group).scale.x=config.hand;
  };
  const liftLine=(points,color)=>line(points,color,group);
  // One continuous chairlift, with a visible cable, towers, terminals and moving chairs.
  const supports=liftSupports(config);
  for(const {z,y:c} of supports.slice(1,-1)){
   const h=groundHeight(config.center,z),beam=c+LIFT.crossbeamClearance;
   solidBox(LIFT.towerWidth,beam-h,.9,'#607580',config.center,(beam+h)/2,z);
   liftBox(21,.5,1.1,'#526874',config.center,beam,z);
   solidBox(2,.5,2,'#777b73',config.center,h+.1,z);
   for(const x of [upX,downX]){
    for(const dz of [-1.1,-.4,.4,1.1]){
     const wheel=mesh(new T.CylinderGeometry(.34,.34,.18,12),'#354a57',group);
     wheel.rotation.z=Math.PI/2;wheel.position.set(x,cableHeight(z+dz)+.34,z+dz);
    }
    const mount=liftBox(1.1,.18,3.4,'#647983',x,c+.85,z);
    mount.rotation.x=-Math.atan2(cableHeight(z+1.1)-cableHeight(z-1.1),2.2);
   }
   for(let y=h+1;y<beam-1;y+=.9)liftBox(.7,.06,.16,'#9aa7a6',config.center+.55,y,z);
  }
  function terminal(z,name,isBase){
   const center=config.center;
   const cableY=cableHeight(z);
   const approach=isBase?-1:1;
   const coveredSpan=cableHeight(z+approach*6);
   const eaveY=Math.max(cableY,coveredSpan)+1.65;
   const shedZ=z-approach*3;
   const steel='#445a62',roof=config===EXPERT?'#384451':'#36515b',wood='#9a785a';

   // Four columns sit outside both chair lanes and carry a shallow gable.
   for(const x of [center-11.5,center+11.5]){
    for(const postZ of [shedZ-6.5,shedZ+6.5]){
     const groundY=groundHeight(x,postZ);
     liftBox(.85,.48,.85,'#a4aba8',x,groundY+.2,postZ);
     solidBox(.42,eaveY-groundY,.42,steel,x,(groundY+eaveY)/2,postZ);
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
   solidBox(4.3,3.2,5.2,wood,boothX,boothY+1.6,shedZ);
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
  terminal(config.top,config.landing??(config===EXPERT?'Timberline Summit':'Juniper Summit'),false);
  const rampVertices=[];
  for(let z=config.top-(config.autoUnload?12:8);z<config.top+5;z++){
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
  const unloadSignX=upX+3.1,unloadSignZ=config.top+(config.autoUnload?-8:2);
  const unloadSignY=groundHeight(unloadSignX,unloadSignZ);
  liftBox(.14,1.8,.14,'#445a62',unloadSignX,unloadSignY+.9,unloadSignZ);
  liftSign(config.autoUnload?'Unload ahead':'E · Unload',unloadSignX,unloadSignY+1.65,unloadSignZ,'#237449',2.5,1);
  if(config===EXPERT){
   const x=expertFaceX(46)+23,z=timberlineZ(46),y=groundHeight(x,z);
   liftBox(.16,2.6,.16,'#445a62',x,y+1.3,z);
   liftSign('◆  Timberline Face  ↑',x,y+2.4,z,'#303944',5.5,-1);
   liftSign('◆◆  Splitrock  →',x,y+1.65,z,'#493d58',5.5,-1);
   const bowlSignX=16,bowlSignZ=timberlineZ(32),bowlSignY=groundHeight(bowlSignX,bowlSignZ);
   liftBox(.14,2.25,.14,'#445a62',bowlSignX,bowlSignY+1.12,bowlSignZ);
   liftSign('←  Powder Bowl · Cliff drop',bowlSignX,bowlSignY+2,bowlSignZ,'#417587',6.9,-1);
   const chuteZ=70,chuteMarkerX=chuteX(chuteZ)+chuteHalfWidth(chuteZ)+2;
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
  class RopeCurve extends T.Curve{
   constructor(sample){super();this.sample=sample;}
   getPoint(t,target=new T.Vector3()){
    const {x,y,z}=this.sample(t);
    return target.set(x,y,z);
   }
  }
  function haulRope(sample,segments){
   const curve=new RopeCurve(sample);
   group.add(new T.Mesh(new T.TubeGeometry(curve,segments,.07,6,false),cableMaterial));
  }
  for(let i=1;i<supports.length;i++){
   const a=supports[i-1].z,b=supports[i].z;
   for(const x of [upX,downX])haulRope(t=>{
    const z=a+(b-a)*t;
    return {x,z,y:cableHeight(z)};
   },Math.ceil((b-a)*1.5));
  }
  function chair(){const g=new T.Group();group.add(g);for(let i=0;i<4;i++){const x=-1.3+i*.87;liftBox(.8,.19,1.25,'#a57455',x,1,0,g);liftBox(.8,.65,.15,'#a57455',x,1.55,-.62,g);liftBox(.75,.035,1.15,'#c19471',x,1.11,0,g);}pipe([[-1.75,1,-.6],[-1.75,2.7,-.6],[0,3.3,-.6],[1.75,2.7,-.6],[1.75,1,-.6]],.065,g);pipe([[0,3.3,-.6],[0,4.65,-.45],[0,LIFT.hanger,0]],.075,g);liftBox(.25,.16,.5,'#303c43',0,LIFT.hanger,0,g);pipe([[-1.65,2.1,-.5],[-1.65,1.65,.7],[1.65,1.65,.7],[1.65,2.1,-.5]],.045,g);for(const x of[-.9,.9]){pipe([[x,1.65,.7],[x,.62,1.02],[x,.62,1.4]],.035,g);}return g;}
  const chairs=Array.from({length:config===JUNIPER?12:8},chair);
  const cycleSeconds=liftCycleSeconds(config);
  function placeChair(chair,{x,y,z,heading}){
   chair.position.set(x,y-LIFT.hanger,z);
   chair.rotation.y=heading;
  }

  const bullwheels=[];
  for(const z of [config.top,config.bottom]){
   const c=cableHeight(z),g=new T.Group();
   g.position.set(config.center,c+.12,z);group.add(g);
   const rim=new T.Mesh(new T.TorusGeometry(LIFT.lane,.18,6,48),frameMat);
   rim.rotation.x=Math.PI/2;g.add(rim);
   g.add(new T.Mesh(new T.CylinderGeometry(.9,.9,.8,12),frameMat));
   for(let i=0;i<8;i++){
    const spoke=liftBox(7.8,.15,.15,'#657985',0,0,0,g);
    spoke.position.set(Math.cos(i*Math.PI/4)*4,0,Math.sin(i*Math.PI/4)*4);spoke.rotation.y=-i*Math.PI/4;
   }
   bullwheels.push(g);
   haulRope(t=>liftTerminalTurn(config,t,z===config.top),64);
  }
  let rider=null,clock=0,lastTime=0,boardingPhase=0;
  const spacing=cycleSeconds/chairs.length;
  return function animateLift(player,time){
   const active=player.activeLift===config;
   const riding=active&&player.mode==='lift';
   if(riding){
    if(rider!==player)boardingPhase=Math.round(clock/spacing)*spacing;
    clock=boardingPhase+player.ride*config.rideSeconds;
   }else if(rider&&active&&player.ride>=1){
    clock=boardingPhase+config.rideSeconds;
   }else{
    clock+=time-lastTime;
   }
   lastTime=time;
   rider=riding?player:null;
   for(const wheel of bullwheels)wheel.rotation.y=clock*.7;
   for(let i=0;i<chairs.length;i++){
    placeChair(chairs[i],liftChairPosition(config,clock+i*spacing));
   }
  };
 }
 const animateLifts=[JUNIPER,EXPERT,...HIGHLINE_LIFTS].map(makeLift);
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
 const sprayCount=96;
 const sprayParticles=Array.from({length:sprayCount},()=>({age:0,life:0,x:0,y:0,z:0,vx:0,vy:0,vz:0}));
 const sprayPositions=new T.BufferAttribute(new Float32Array(sprayCount*3),3);
 const sprayColors=new T.BufferAttribute(new Float32Array(sprayCount*4).fill(1),4);
 sprayPositions.setUsage(T.DynamicDrawUsage);
 sprayColors.setUsage(T.DynamicDrawUsage);
 const sprayGeometry=new T.BufferGeometry();
 sprayGeometry.setAttribute('position',sprayPositions);
 sprayGeometry.setAttribute('color',sprayColors);
 const spray=new T.Points(sprayGeometry,new T.PointsMaterial({
  map:puffs.material.map,size:.52,vertexColors:true,transparent:true,depthWrite:false
 }));
 spray.frustumCulled=false;spray.visible=false;scene.add(spray);
 let sprayCursor=0,sprayCarry=0;
 function animateSpray(p,dt){
  if(p.spray>.025&&!p.air&&p.mode==='ski'&&p.speed>3){
   sprayCarry+=dt*168*p.spray;
   const travel=p.travelAngle??p.angle,dx=Math.sin(travel),dz=Math.cos(travel);
   const outside=-Math.sign(p.slip);
   while(sprayCarry>=1){
    const bit=sprayParticles[sprayCursor++%sprayCount];
    const fan=outside*(1.6+Math.random()*3.4);
    const tail=.55+Math.random()*.85;
    Object.assign(bit,{
     age:0,life:.24+Math.random()*.20,
     x:p.x-dx*tail+dz*outside*.32,y:p.y+.19,z:p.z-dz*tail-dx*outside*.32,
     vx:dx*p.speed*.21+dz*fan,vy:1.45+Math.random()*2.5+p.groundV*.13,
     vz:dz*p.speed*.21-dx*fan
    });
    sprayCarry--;
   }
  }else sprayCarry=0;
  let visible=false;
  for(let i=0;i<sprayCount;i++){
   const bit=sprayParticles[i];
   bit.age+=dt;
   if(bit.age>=bit.life){sprayColors.array[i*4+3]=0;continue;}
   visible=true;
   const age=bit.age;
   sprayPositions.setXYZ(i,bit.x+bit.vx*age,bit.y+bit.vy*age-3.5*age**2,bit.z+bit.vz*age);
   sprayColors.array[i*4+3]=(1-age/bit.life)*.95;
  }
  spray.visible=visible;
  if(visible){sprayPositions.needsUpdate=true;sprayColors.needsUpdate=true;}
 }
 let w=0,h=0,time=0,camReady=false,camHeading=0;
 const camPos=new T.Vector3(),look=new T.Vector3(),desired=new T.Vector3();
 function render(p,dt,paused=false){time+=paused?0:dt;if(w!==canvas.clientWidth||h!==canvas.clientHeight){w=canvas.clientWidth;h=canvas.clientHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();}
 const lift=p.mode==='lift',crashed=p.mode==='crash',config=p.activeLift??JUNIPER;
 const offset=liftWorld(config,-.44,0);
 skier.position.set(lift?p.x+offset.x-config.x:p.x,p.y+(lift||p.air?.12:0),lift?p.z+offset.z-config.z:p.z);
 const skiX=Math.sin(p.angle)*.4,skiZ=Math.cos(p.angle)*.4;
 const airPitch=!lift&&p.air?Math.atan2(height(p.x+skiX,p.z+skiZ)-height(p.x-skiX,p.z-skiZ),.8)*-.65:0;
 const airBank=!lift&&p.air?-p.yaw*Math.min(.25,p.speed*.015):0;
 skier.rotation.set(airPitch,lift?config.yaw+Math.PI:p.angle,airBank,'YXZ');
 rig.animate(p,time);
 for(const animateLift of animateLifts)animateLift(p,time);
 if(!paused)animateSpray(p,dt);
 if(!lift&&!crashed&&!p.air&&p.speed>1&&!paused){
  const crossX=Math.cos(p.angle)*.29,crossZ=-Math.sin(p.angle)*.29;
  const contacts=[-1,1].map(side=>{
   const x=p.x+crossX*side,z=p.z+crossZ*side;
   return [x,height(x,z)+.045,z];
  });
  if(previous&&Math.hypot(p.x-previous.x,p.z-previous.z)<3){
   for(let i=0;i<contacts.length;i++){
    const k=(trackCount++%max)*6;
    trackPositions.set(previous.contacts[i],k);
    trackPositions.set(contacts[i],k+3);
   }
   trackGeo.attributes.position.needsUpdate=true;
   trackGeo.setDrawRange(0,Math.min(trackCount,max)*2);
  }
  previous={x:p.x,z:p.z,contacts};
 }else previous=null;
 puffs.visible=!lift&&!crashed&&!p.air&&p.speed>4;
 if(puffs.visible){
  const travel=p.travelAngle??p.angle;
  const powder=snowDepth(p.x,p.z),sin=Math.sin(travel),cos=Math.cos(travel);
  const skid=Math.sin(p.slip);
  const spread=.24+Math.abs(skid)*1.6+powder*.8+(p.drive==='brake'?.45:0);
  const length=2+powder*2.2;
  const rise=height(p.x-sin*length,p.z-cos*length)-p.y;
  puffs.material.size=.22+powder*.72;
  puffs.material.opacity=.15+powder*.56;
  for(let i=0;i<60;i++){
   const t=(time*2+i*.17)%1,lateral=(Math.cos(i*8.7)*spread+skid*1.35)*t;
   const behind=t*length;
   puffPositions[i*3]=p.x+cos*lateral-sin*behind;
   puffPositions[i*3+1]=p.y+rise*t+t*(.62+powder*.9)*(.55+.45*Math.sin(i*3.4)**2);
   puffPositions[i*3+2]=p.z-sin*lateral-cos*behind;
  }
  puffs.geometry.attributes.position.needsUpdate=true;
 }
 const heading=lift?config.yaw:p.angle-p.slip*.55*T.MathUtils.smoothstep(p.speed,2,8);
 const turn=heading-camHeading;
 camHeading=camReady?camHeading+Math.atan2(Math.sin(turn),Math.cos(turn))*(1-Math.exp(-dt*7)):heading;
 const forwardX=Math.sin(camHeading),forwardZ=Math.cos(camHeading);
 // Close in beneath the terminal roof before the usual trailing camera resumes.
 const summit=liftWorld(config,config.center+8,config.top);
 const dock=1-T.MathUtils.smoothstep(Math.hypot(p.x-summit.x,p.z-summit.z),9,26);
 const behind=T.MathUtils.lerp(lift?17:13.5,4,dock),ahead=T.MathUtils.lerp(lift?38:14,5.5,dock);
 const eyeX=p.x-forwardX*behind,eyeZ=p.z-forwardZ*behind;
 const lookX=p.x+forwardX*ahead,lookZ=p.z+forwardZ*ahead;
 const cameraHeight=p.y+(p.mode==='ski'&&!p.air?p.suspension*.78:0);
 const eyeY=Math.max(cameraHeight+T.MathUtils.lerp(lift?6:8.5,3.7,dock),surfaceHeight(eyeX,eyeZ)+3);
 const rearView=T.MathUtils.smoothstep(-forwardZ,.45,1)*(1-T.MathUtils.smoothstep(p.z,juniperZ(50),juniperZ(105)));
 const lookY=lift?p.y+T.MathUtils.lerp(2,1,dock):Math.max(cameraHeight-6,surfaceHeight(lookX,lookZ)+.6)+rearView*4;
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
 return {render,colliders,resetCamera(){
  camReady=false;previous=null;sprayCarry=0;spray.visible=false;
  for(const bit of sprayParticles)bit.life=0;
 }};
}
