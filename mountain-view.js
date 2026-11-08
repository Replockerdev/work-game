import * as T from './vendor/three.module.js';
import {height,pathX,routes,jumps,BASE,obstacles,LIFT,liftTowers,liftCableHeight,SUMMIT_TERMINAL,RIDE_SECONDS,chairProgress,bowlX,bowlWidth,inBowl,bowlRocks,bowlStart,bowlEnd,SNOW_WEST,SNOW_EAST} from './mountain-core.js';
import {snowMaterial,addRange,detailedTrees,surroundingForest,rangeHeight} from './mountain-environment.js';
import {makeSkier} from './skier-model.js';
const surfaceHeight=(x,z)=>x>=SNOW_WEST&&x<=SNOW_EAST&&z>=-40&&z<=690?height(x,z):rangeHeight(x,z);
export function createMountain(canvas){
 const renderer=new T.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1;
 const scene=new T.Scene();scene.background=new T.Color('#a5c9dc');scene.fog=new T.Fog('#c0d4e2',1200,5500);const camera=new T.PerspectiveCamera(64,1,.15,9200);
 scene.add(new T.HemisphereLight('#e4f3ff','#45648b',1.4));const sun=new T.DirectionalLight('#fff0d2',3.2);sun.position.set(-50,220,100);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-42,right:42,top:55,bottom:-45,near:1,far:220});sun.shadow.normalBias=.04;sun.shadow.bias=-.0002;scene.add(sun,sun.target);
 const mats=new Map(),mat=c=>{if(!mats.has(c))mats.set(c,new T.MeshStandardMaterial({color:c,roughness:.85,flatShading:true}));return mats.get(c);};
 function mesh(geo,c,parent=scene){const m=new T.Mesh(geo,mat(c));m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
 function box(w,h,d,c,x,y,z,parent=scene){const m=mesh(new T.BoxGeometry(w,h,d),c,parent);m.position.set(x,y,z);return m;}
 function line(points,c,parent=scene){const l=new T.Line(new T.BufferGeometry().setFromPoints(points.map(p=>new T.Vector3(...p))),new T.LineBasicMaterial({color:c}));parent.add(l);return l;}
 function trailSign(label,x,y,z,color,width=3.5,facing=-1){
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
  scene.add(panel);
  box(width,.69,.14,'#343e3e',x,y,z);
  return panel;
 }
 const snowWidth=SNOW_EAST-SNOW_WEST;
 const geo=new T.PlaneGeometry(snowWidth,730,snowWidth/2.5,365);geo.rotateX(-Math.PI/2);geo.translate((SNOW_WEST+SNOW_EAST)/2,0,325);const pos=geo.attributes.position,colors=[];
 const bowlSnow=new T.Color('#eef5fa');
 for(let i=0;i<pos.count;i++){const x=pos.getX(i),z=pos.getZ(i);pos.setY(i,height(x,z));let color=new T.Color('#dbe7ef');const trail=routes.find(r=>Math.abs(x-pathX(z,r))<r.width);if(z<90||z>575)color.set('#e9f0f2');else if(trail){color.set(trail.id==='groomer'?(Math.floor(z*.7)%2?'#edf3f5':'#e4edf1'):trail.id==='park'?'#e4edf4':'#d2e1e8');}const bank=routes.some(r=>Math.abs(Math.abs(x-pathX(z,r))-r.width)<3);if(bank&&z>100&&z<560)color.multiplyScalar(.88);
  if(inBowl(x,z)){
   const edgeFade=T.MathUtils.smoothstep(bowlWidth(z)-Math.abs(x-bowlX(z)),0,10);
   const endFade=T.MathUtils.smoothstep(z,bowlStart,bowlStart+42)*(1-T.MathUtils.smoothstep(z,bowlEnd-55,bowlEnd));
   color.lerp(bowlSnow,.72*edgeFade*endFade);
  }
  const n=Math.sin(x*.31+z*.047)*.024; color.offsetHSL(0,0,n);colors.push(color.r,color.g,color.b);}
 geo.setAttribute('color',new T.Float32BufferAttribute(colors,3));geo.computeVertexNormals();const ground=new T.Mesh(geo,snowMaterial(renderer));ground.receiveShadow=true;scene.add(ground);
 // Visible trail-edge poles and arrows make all three routes converge at the base.
 for(const r of routes){for(let z=100;z<=560;z+=35){for(const side of [-1,1]){const x=pathX(z,r)+r.width*side;if(r.id==='groomer'&&side===-1&&inBowl(x,z,3))continue;box(.14,1.6,.14,r.color,x,height(x,z)+.8,z);box(.55,.25,.12,r.color,x,height(x,z)+1.55,z);}}
 const z=110,x=pathX(z,r)+r.width*.65,y=height(x,z);
 const colors={groomer:'#237449',park:'#98500e',glades:'#254d77'};
 box(.15,1.75,.15,'#68523f',x,y+.87,z);
 trailSign(r.name,x,y+1.65,z,colors[r.id]);}
 const guideZ=65,guideX=-5,guideY=height(guideX,guideZ);
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
 const trees=obstacles();const forest=detailedTrees(scene,[...trees,...surroundingForest()]);addRange(scene);
 const rockShape=new T.DodecahedronGeometry(1,0);
 for(const [i,{x,z,size}] of bowlRocks.entries()){
  const rock=mesh(rockShape,i%2?'#69767b':'#535e64');
  rock.scale.set(size,size*.72,size*.85);
  rock.rotation.set(.18*i,.63*i,-.27);
  rock.position.set(x,height(x,z)+size*.18,z);
 }
 // One continuous chairlift, with a visible cable, towers, terminals and moving chairs.
 const cable=[];for(let z=12;z<=BASE.z;z+=2)cable.push([LIFT.upX,liftCableHeight(z),z]);
 for(const z of liftTowers.slice(1,-1)){const h=height(LIFT.towerX,z),c=liftCableHeight(z),beam=c+LIFT.crossbeamClearance;box(LIFT.towerWidth,beam-h,.9,'#607580',LIFT.towerX,(beam+h)/2,z);box(21,.5,1.1,'#526874',LIFT.towerX,beam,z);box(2,.5,2,'#777b73',LIFT.towerX,h+.1,z);for(const x of [LIFT.upX,LIFT.downX]){for(const dz of [-1.1,-.4,.4,1.1]){const wheel=mesh(new T.CylinderGeometry(.34,.34,.18,12),'#354a57');wheel.rotation.z=Math.PI/2;wheel.position.set(x,c+.34,z+dz);}box(1.1,.18,3.4,'#647983',x,c+.85,z);}for(let y=h+1;y<beam-1;y+=.9)box(.7,.06,.16,'#9aa7a6',LIFT.towerX+.55,y,z);}
 function terminal(z,name,isBase){
  const center=LIFT.towerX;
  const cableY=liftCableHeight(z);
  const approach=isBase?-1:1;
  const eaveY=cableY+2;
  const shedZ=z-approach*3;
  const steel='#445a62',roof='#36515b',wood='#9a785a';

  // Four columns sit outside both chair lanes and carry a shallow gable.
  for(const x of [center-11.5,center+11.5]){
   for(const postZ of [shedZ-6.5,shedZ+6.5]){
    const groundY=height(x,postZ);
    box(.85,.48,.85,'#a4aba8',x,groundY+.2,postZ);
    box(.42,eaveY-groundY,.42,steel,x,(groundY+eaveY)/2,postZ);
   }
   box(.38,.54,15.5,steel,x,eaveY,shedZ);
  }
  for(const sign of [-1,1]){
   const panel=box(12.7,.26,17,roof,center+sign*6.15,eaveY+1.15,shedZ);
   panel.rotation.z=-sign*.17;
   const snowCap=box(12.6,.12,16.9,'#e3ebee',panel.position.x,panel.position.y+.16,shedZ);
   snowCap.rotation.z=panel.rotation.z;
  }
  box(24,.48,.5,steel,center,eaveY,shedZ-7.5);
  box(24,.48,.5,steel,center,eaveY,shedZ+7.5);
  box(6.8,1.05,5.5,'#68818a',center,cableY+.9,z);
  for(let x=center-2.5;x<=center+2.5;x+=.5){
   box(.06,.35,.04,steel,x,cableY+.9,z+approach*2.77);
  }

  // The operator booth is beside the loading lane, clear of the cable and skis.
  const boothX=center-14.7;
  const boothY=height(boothX,shedZ);
  box(4.3,3.2,5.2,wood,boothX,boothY+1.6,shedZ);
  box(4.65,.23,5.65,roof,boothX,boothY+3.26,shedZ);
  box(4.5,.10,5.5,'#e3ebee',boothX,boothY+3.41,shedZ);
  box(.06,1.2,2.25,'#334b56',boothX+2.16,boothY+2.05,shedZ);
  box(.07,.95,1.95,'#a9c9d2',boothX+2.18,boothY+2.08,shedZ);
  box(.1,1.05,.07,steel,boothX+2.21,boothY+2.08,shedZ);
  const signX=LIFT.upX+9;
  const signZ=z+approach*10;
  const signY=height(signX,signZ)+2.2;
  box(.17,2.25,.17,steel,signX,signY-1.1,signZ);
  trailSign(name,signX,signY,signZ,'#355663',4.2,approach);

  // Low ropes mark the entrance without putting a raised floor over the snow.
  if(isBase){
   for(const x of [LIFT.upX-2.8,LIFT.upX+2.8]){
    const rope=[];
    for(let d=8;d<=20;d+=4){
     const postZ=z-d;
     const groundY=height(x,postZ);
     box(.13,1.02,.13,steel,x,groundY+.51,postZ);
     rope.push([x,groundY+.86,postZ]);
    }
    line(rope,'#a87b43');
   }
  }
 }
 terminal(BASE.z,'Juniper Chair  ·  Load',true);
 terminal(SUMMIT_TERMINAL,'Juniper Summit',false);
 const rampVertices=[];
 for(let z=4;z<17;z++){
  const left=LIFT.upX-1.9,right=LIFT.upX+1.9;
  const a=[left,height(left,z)+.06,z],b=[right,height(right,z)+.06,z];
  const c=[left,height(left,z+1)+.06,z+1],d=[right,height(right,z+1)+.06,z+1];
  rampVertices.push(...a,...c,...b,...b,...c,...d);
 }
 const rampGeometry=new T.BufferGeometry();
 rampGeometry.setAttribute('position',new T.Float32BufferAttribute(rampVertices,3));
 rampGeometry.computeVertexNormals();
 const ramp=mesh(rampGeometry,'#cbdde1');
 ramp.castShadow=false;
 const unloadSignX=LIFT.upX+3.1,unloadSignZ=14;
 const unloadSignY=height(unloadSignX,unloadSignZ);
 box(.14,1.8,.14,'#445a62',unloadSignX,unloadSignY+.9,unloadSignZ);
 trailSign('Unload  ↗',unloadSignX,unloadSignY+1.65,unloadSignZ,'#237449',2.5,1);
 const frameMat=new T.MeshStandardMaterial({color:'#586d79',roughness:.4,metalness:.65});
 function pipe(points,r=.055,parent=scene){const curve=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p)));const o=new T.Mesh(new T.TubeGeometry(curve,Math.max(6,points.length*3),r,6,false),frameMat);o.castShadow=true;parent.add(o);return o;}
 const cableMaterial=new T.MeshStandardMaterial({color:'#303c43',roughness:.62});
 function haulRope(points){
  const curve=new T.CatmullRomCurve3(points.map(point=>new T.Vector3(...point)));
  scene.add(new T.Mesh(new T.TubeGeometry(curve,points.length*2,.055,6,false),cableMaterial));
 }
 haulRope(cable);
 haulRope(cable.map(([x,y,z])=>[LIFT.downX,y,z]));
 function chair(){const g=new T.Group();scene.add(g);for(let i=0;i<4;i++){const x=-1.3+i*.87;box(.8,.19,1.25,'#a57455',x,1,0,g);box(.8,.65,.15,'#a57455',x,1.55,-.62,g);box(.75,.035,1.15,'#c19471',x,1.11,0,g);}pipe([[-1.75,1,-.6],[-1.75,2.7,-.6],[0,3.3,-.6],[1.75,2.7,-.6],[1.75,1,-.6]],.065,g);pipe([[0,3.3,-.6],[0,4.65,-.45],[0,5.2,0]],.075,g);box(.25,.16,.5,'#303c43',0,5.2,0,g);pipe([[-1.65,2.1,-.5],[-1.65,1.65,.7],[1.65,1.65,.7],[1.65,2.1,-.5]],.045,g);for(const x of[-.9,.9]){pipe([[x,1.65,.7],[x,.62,1.02],[x,.62,1.4]],.035,g);}return g;}
 const chairs=Array.from({length:12},chair),occupied=chair();occupied.visible=false;occupied.rotation.y=Math.PI;
 const turnSeconds=3,cycleSeconds=2*(RIDE_SECONDS+turnSeconds);
 function turnChair(chair,progress,atSummit){
  const angle=Math.PI*progress,direction=atSummit?1:-1;
  const terminalZ=atSummit?SUMMIT_TERMINAL:BASE.z;
  chair.position.set(LIFT.towerX+direction*8*Math.cos(angle),liftCableHeight(terminalZ)-5.2,terminalZ-direction*8*Math.sin(angle));
  chair.rotation.y=atSummit?Math.PI+angle:angle;
 }
 function moveChair(chair,seconds){
  const position=(seconds%cycleSeconds+cycleSeconds)%cycleSeconds;
  const uphill=position<RIDE_SECONDS+turnSeconds;
  const phase=position-(uphill?0:RIDE_SECONDS+turnSeconds);
  if(phase>=RIDE_SECONDS){
   turnChair(chair,(phase-RIDE_SECONDS)/turnSeconds,uphill);
   return;
  }
  const t=chairProgress(phase/RIDE_SECONDS);
  const z=uphill?BASE.z+(SUMMIT_TERMINAL-BASE.z)*t:SUMMIT_TERMINAL+(BASE.z-SUMMIT_TERMINAL)*t;
  chair.position.set(uphill?LIFT.upX:LIFT.downX,liftCableHeight(z)-5.2,z);
  chair.rotation.y=uphill?Math.PI:0;
 }
 const rig=makeSkier(scene),skier=rig.root;
 const bullwheels=[];for(const z of[12,BASE.z]){const c=liftCableHeight(z),g=new T.Group();g.position.set(LIFT.towerX,c+.25,z);scene.add(g);const rim=new T.Mesh(new T.TorusGeometry(8,.18,6,36),frameMat);rim.rotation.x=Math.PI/2;g.add(rim);const hub=new T.Mesh(new T.CylinderGeometry(.9,.9,.8,12),frameMat);g.add(hub);for(let i=0;i<8;i++){const spoke=box(7.8,.15,.15,'#657985',0,0,0,g);spoke.position.set(Math.cos(i*Math.PI/4)*4,0,Math.sin(i*Math.PI/4)*4);spoke.rotation.y=-i*Math.PI/4;}bullwheels.push(g);const arc=[];for(let i=0;i<=40;i++){const a=i/40*Math.PI;arc.push([LIFT.towerX+Math.cos(a)*8,c,z+(z===12?-1:1)*Math.sin(a)*8]);}haulRope(arc);}
 // Two persistent ski tracks follow every grounded turn.
 const max=6000,trackPositions=new Float32Array(max*6),trackGeo=new T.BufferGeometry();trackGeo.setAttribute('position',new T.BufferAttribute(trackPositions,3));trackGeo.setDrawRange(0,0);const tracks=new T.LineSegments(trackGeo,new T.LineBasicMaterial({color:'#9cbacb',transparent:true,opacity:.55}));scene.add(tracks);let trackCount=0,previous=null;
 tracks.frustumCulled=false;
 const puffPositions=new Float32Array(60*3),puffs=new T.Points(new T.BufferGeometry(),new T.PointsMaterial({color:'#fff',size:.22,transparent:true,opacity:.75}));puffs.geometry.setAttribute('position',new T.BufferAttribute(puffPositions,3));puffs.frustumCulled=false;scene.add(puffs);
 let w=0,h=0,time=0,camReady=false,camHeading=0;
 const camPos=new T.Vector3(),look=new T.Vector3(),desired=new T.Vector3();
 function render(p,dt,paused=false){time+=paused?0:dt;if(w!==canvas.clientWidth||h!==canvas.clientHeight){w=canvas.clientWidth;h=canvas.clientHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();}
 const lift=p.mode==='lift';skier.position.set(lift?p.x-.44:p.x,p.y+.12,p.z);skier.rotation.y=lift?Math.PI:p.angle;skier.rotation.z=lift?0:-p.yaw*Math.min(.25,p.speed*.015);skier.rotation.x=lift?0:Math.atan2(height(p.x,p.z+.4)-height(p.x,p.z-.4),.8)*-.65;rig.animate(p,time);for(const wheel of bullwheels)wheel.rotation.y=time*.7;
 occupied.visible=lift||p.mode==='unload';
 if(lift){
  occupied.position.set(p.x,p.y-.6,p.z);
  occupied.rotation.y=Math.PI;
 }else if(p.mode==='unload'){
  turnChair(occupied,p.unloadTime/turnSeconds,true);
 }
 for(let i=0;i<chairs.length;i++){
  const empty=chairs[i];
  moveChair(empty,time+i*cycleSeconds/chairs.length);
  empty.visible=!occupied.visible||empty.position.distanceToSquared(occupied.position)>16;
 }

 if(!lift&&!p.air&&p.speed>1&&!paused){if(previous&&Math.hypot(p.x-previous.x,p.z-previous.z)<3){for(const side of [-1,1]){const ox=Math.cos(p.angle)*.29*side,oz=-Math.sin(p.angle)*.29*side;const k=(trackCount++%max)*6;trackPositions.set([previous.x+ox,previous.y+.04,previous.z+oz,p.x+ox,height(p.x+ox,p.z+oz)+.04,p.z+oz],k);}trackGeo.attributes.position.needsUpdate=true;trackGeo.setDrawRange(0,Math.min(trackCount,max)*2);}previous={x:p.x,y:p.y,z:p.z};}else previous=null;
 for(let i=0;i<60;i++){const t=(time*2+i*.17)%1,spread=Math.abs(p.yaw)*.8+.15;puffPositions[i*3]=p.x+Math.cos(i*8.7)*t*spread;puffPositions[i*3+1]=p.y+t*.7;puffPositions[i*3+2]=p.z-t*2;}puffs.geometry.attributes.position.needsUpdate=true;puffs.visible=!lift&&!p.air&&p.speed>4;
 const heading=p.mode==='ski'?p.angle:0;
 const turn=heading-camHeading;
 camHeading=camReady?camHeading+Math.atan2(Math.sin(turn),Math.cos(turn))*(1-Math.exp(-dt*7)):heading;
 const forwardX=Math.sin(camHeading),forwardZ=Math.cos(camHeading);
 const behind=lift?17:13.5,ahead=lift?38:14;
 const eyeX=p.x-forwardX*behind,eyeZ=p.z-forwardZ*behind;
 const lookX=p.x+forwardX*ahead,lookZ=p.z+forwardZ*ahead;
 const eyeY=Math.max(p.y+(lift?6:8.5),surfaceHeight(eyeX,eyeZ)+3);
 const rearView=T.MathUtils.smoothstep(-forwardZ,.45,1)*(1-T.MathUtils.smoothstep(p.z,50,105));
 const lookY=lift?p.y+2:Math.max(p.y-6,surfaceHeight(lookX,lookZ)+.6)+rearView*4;
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
 return {render,trees:[...trees,...bowlRocks],resetCamera(){camReady=false;previous=null;}};
}
