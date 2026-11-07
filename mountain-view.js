import * as T from './vendor/three.module.js';
import {height,baseHeight,pathX,routes,jumps,BASE,TOP,obstacles,LIFT,liftTowers,liftCableHeight} from './mountain-core.js';
import {snowMaterial,addRange,detailedTrees,surroundingForest} from './mountain-environment.js';
import {makeSkier} from './skier-model.js';
export function createMountain(canvas){
 const renderer=new T.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1;
 const scene=new T.Scene();scene.background=new T.Color('#a5c9dc');scene.fog=new T.Fog('#c0d4e2',1200,5500);const camera=new T.PerspectiveCamera(64,1,.15,9200);
 scene.add(new T.HemisphereLight('#e4f3ff','#45648b',1.4));const sun=new T.DirectionalLight('#fff0d2',3.2);sun.position.set(-50,220,100);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-42,right:42,top:55,bottom:-45,near:1,far:220});sun.shadow.normalBias=.04;sun.shadow.bias=-.0002;scene.add(sun,sun.target);
 const mats=new Map(),mat=c=>{if(!mats.has(c))mats.set(c,new T.MeshStandardMaterial({color:c,roughness:.85,flatShading:true}));return mats.get(c);};
 function mesh(geo,c,parent=scene){const m=new T.Mesh(geo,mat(c));m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
 function box(w,h,d,c,x,y,z,parent=scene){const m=mesh(new T.BoxGeometry(w,h,d),c,parent);m.position.set(x,y,z);return m;}
 function line(points,c,parent=scene){const l=new T.Line(new T.BufferGeometry().setFromPoints(points.map(p=>new T.Vector3(...p))),new T.LineBasicMaterial({color:c}));parent.add(l);return l;}
 function text(s,x,y,z,color='#27434d',scale=1){const c=document.createElement('canvas');c.width=1024;c.height=180;const ctx=c.getContext('2d');ctx.fillStyle='#f7f5e7';ctx.fillRect(0,0,1024,180);ctx.strokeStyle=color;ctx.lineWidth=12;ctx.strokeRect(6,6,1012,168);ctx.fillStyle=color;ctx.font='bold 57px Arial';ctx.textAlign='center';ctx.fillText(s,512,112);const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;const o=new T.Mesh(new T.PlaneGeometry(11*scale,1.94*scale),new T.MeshBasicMaterial({map:tex,side:T.DoubleSide}));o.position.set(x,y,z);o.rotation.y=Math.PI;scene.add(o);return o;}
 const geo=new T.PlaneGeometry(430,730,172,365);geo.rotateX(-Math.PI/2);geo.translate(0,0,325);const pos=geo.attributes.position,colors=[];
 for(let i=0;i<pos.count;i++){const x=pos.getX(i),z=pos.getZ(i);pos.setY(i,height(x,z));let color=new T.Color('#dbe7ef');const trail=routes.find(r=>Math.abs(x-pathX(z,r))<r.width);if(z<90||z>575)color.set('#e9f0f2');else if(trail){color.set(trail.id==='groomer'?(Math.floor(z*.7)%2?'#edf3f5':'#e4edf1'):trail.id==='park'?'#e4edf4':'#d2e1e8');}const bank=routes.some(r=>Math.abs(Math.abs(x-pathX(z,r))-r.width)<3);if(bank&&z>100&&z<560)color.multiplyScalar(.88);const n=Math.sin(x*.31+z*.047)*.024; color.offsetHSL(0,0,n);colors.push(color.r,color.g,color.b);}
 geo.setAttribute('color',new T.Float32BufferAttribute(colors,3));geo.computeVertexNormals();const ground=new T.Mesh(geo,snowMaterial(renderer));ground.receiveShadow=true;scene.add(ground);
 // Visible trail-edge poles and arrows make all three routes converge at the base.
 for(const r of routes){for(let z=100;z<=560;z+=35){for(const side of [-1,1]){const x=pathX(z,r)+r.width*side;box(.14,1.6,.14,r.color,x,height(x,z)+.8,z);box(.55,.25,.12,r.color,x,height(x,z)+1.55,z);}}
 const z=110,x=pathX(z,r);box(.23,4,.23,'#707c78',x,height(x,z)+2,z);text((r.id==='groomer'?'● ':r.id==='park'?'▲ ':'♠ ')+r.name.toUpperCase(),x,height(x,z)+4,z,r.color,.9);}
 for(const j of jumps){for(const side of [-1,1]){box(.16,2.2,.16,'#e9a66e',side*(j.width+1),height(side*(j.width+1),j.z)+1.1,j.z);box(1.2,.7,.08,'#e9a66e',side*(j.width+1),height(side*(j.width+1),j.z)+1.8,j.z);}line([[-j.width,height(0,j.z-.05)+.09,j.z-.05],[j.width,height(0,j.z-.05)+.09,j.z-.05]],'#e3a66e');}
 for(const z of [565,594]){const x=z===565?0:-10;box(.18,3,.18,'#728b87',x,height(x,z)+1.5,z);text('↓  ALL RUNS → LIFT BASE',x,height(x,z)+3.3,z,'#476b67',.85);}
 const trees=obstacles();const forest=detailedTrees(scene,[...trees,...surroundingForest()]);addRange(scene);
 // One continuous chairlift, with a visible cable, towers, terminals and moving chairs.
 const cable=[];for(let z=12;z<=BASE.z;z+=2)cable.push([LIFT.upX,liftCableHeight(z),z]);
 for(const z of liftTowers.slice(1,-1)){const h=height(LIFT.towerX,z),c=liftCableHeight(z),beam=c+LIFT.crossbeamClearance;box(LIFT.towerWidth,beam-h,.9,'#607580',LIFT.towerX,(beam+h)/2,z);box(21,.5,1.1,'#526874',LIFT.towerX,beam,z);box(2,.5,2,'#777b73',LIFT.towerX,h+.1,z);for(const x of [LIFT.upX,LIFT.downX]){for(const dz of [-1.1,-.4,.4,1.1]){const wheel=mesh(new T.CylinderGeometry(.34,.34,.18,12),'#354a57');wheel.rotation.z=Math.PI/2;wheel.position.set(x,c+.34,z+dz);}box(1.1,.18,3.4,'#647983',x,c+.85,z);}for(let y=h+1;y<beam-1;y+=.9)box(.7,.06,.16,'#9aa7a6',LIFT.towerX+.55,y,z);}
 function terminal(z,name){const y=height(LIFT.towerX,z),c=liftCableHeight(z);for(const x of [-45,-15])box(.6,c-y+1.5,.6,'#647b82',x,(c+y+1.5)/2,z);box(31,.6,5,'#456573',-30,c+1.5,z);box(8,3.3,6,'#4b6571',-49,y+1.6,z);box(1.4,1.2,.12,'#b4d5de',-49,y+2,z-3.1);box(9,.25,7,'#e3ebea',-49,y+3.4,z);text(name,-11,y+4,z-7,'#355e63',.85);for(const x of [-44,-13]){for(let d=-8;d<=8;d+=4){box(.15,1.2,.15,'#8a9996',x,y+.6,z+d);}box(.1,.1,16,'#d7b575',x,y+1,z);} }
 terminal(BASE.z,'JUNIPER CHAIR · E TO BOARD');terminal(12,'SUMMIT · THREE WAYS DOWN');
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
 const rig=makeSkier(scene),skier=rig.root;
 const bullwheels=[];for(const z of[12,BASE.z]){const c=liftCableHeight(z),g=new T.Group();g.position.set(LIFT.towerX,c+.25,z);scene.add(g);const rim=new T.Mesh(new T.TorusGeometry(8,.18,6,36),frameMat);rim.rotation.x=Math.PI/2;g.add(rim);const hub=new T.Mesh(new T.CylinderGeometry(.9,.9,.8,12),frameMat);g.add(hub);for(let i=0;i<8;i++){const spoke=box(7.8,.15,.15,'#657985',0,0,0,g);spoke.position.set(Math.cos(i*Math.PI/4)*4,0,Math.sin(i*Math.PI/4)*4);spoke.rotation.y=-i*Math.PI/4;}bullwheels.push(g);const arc=[];for(let i=0;i<=40;i++){const a=i/40*Math.PI;arc.push([LIFT.towerX+Math.cos(a)*8,c,z+(z===12?-1:1)*Math.sin(a)*8]);}haulRope(arc);}
 // Two persistent ski tracks follow every grounded turn.
 const max=6000,trackPositions=new Float32Array(max*6),trackGeo=new T.BufferGeometry();trackGeo.setAttribute('position',new T.BufferAttribute(trackPositions,3));trackGeo.setDrawRange(0,0);const tracks=new T.LineSegments(trackGeo,new T.LineBasicMaterial({color:'#9cbacb',transparent:true,opacity:.55}));scene.add(tracks);let trackCount=0,previous=null;
 tracks.frustumCulled=false;
 const puffPositions=new Float32Array(60*3),puffs=new T.Points(new T.BufferGeometry(),new T.PointsMaterial({color:'#fff',size:.22,transparent:true,opacity:.75}));puffs.geometry.setAttribute('position',new T.BufferAttribute(puffPositions,3));puffs.frustumCulled=false;scene.add(puffs);
 let w=0,h=0,time=0,camReady=false;const camPos=new T.Vector3(),look=new T.Vector3();
 function render(p,dt,paused=false){time+=paused?0:dt;if(w!==canvas.clientWidth||h!==canvas.clientHeight){w=canvas.clientWidth;h=canvas.clientHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();}
 const lift=p.mode==='lift';skier.position.set(lift?p.x-.44:p.x,p.y+.12,p.z);skier.rotation.y=lift?Math.PI:p.angle;skier.rotation.z=lift?0:-p.yaw*Math.min(.25,p.speed*.015);skier.rotation.x=lift?0:Math.atan2(height(p.x,p.z+.4)-height(p.x,p.z-.4),.8)*-.65;rig.animate(p,time);for(const wheel of bullwheels)wheel.rotation.y=time*.7;
 occupied.visible=lift;if(lift)occupied.position.set(p.x,p.y-.6,p.z);for(let i=0;i<chairs.length;i++){const t=(time*.018+i/chairs.length)%1,up=t<.5,k=up?t*2:(1-t)*2,z=BASE.z+(12-BASE.z)*k;chairs[i].position.set(up?LIFT.upX:LIFT.downX,liftCableHeight(z)-5.2,z);chairs[i].rotation.y=up?Math.PI:0;chairs[i].visible=!(lift&&up&&Math.abs(z-p.z)<12);}

 if(!lift&&!p.air&&p.speed>1&&!paused){if(previous&&Math.hypot(p.x-previous.x,p.z-previous.z)<3){for(const side of [-1,1]){const ox=Math.cos(p.angle)*.29*side,oz=-Math.sin(p.angle)*.29*side;const k=(trackCount++%max)*6;trackPositions.set([previous.x+ox,previous.y+.04,previous.z+oz,p.x+ox,height(p.x+ox,p.z+oz)+.04,p.z+oz],k);}trackGeo.attributes.position.needsUpdate=true;trackGeo.setDrawRange(0,Math.min(trackCount,max)*2);}previous={x:p.x,y:p.y,z:p.z};}else previous=null;
 for(let i=0;i<60;i++){const t=(time*2+i*.17)%1,spread=Math.abs(p.yaw)*.8+.15;puffPositions[i*3]=p.x+Math.cos(i*8.7)*t*spread;puffPositions[i*3+1]=p.y+t*.7;puffPositions[i*3+2]=p.z-t*2;}puffs.geometry.attributes.position.needsUpdate=true;puffs.visible=!lift&&!p.air&&p.speed>4;
 const desired=new T.Vector3(p.x,p.y+(lift?6:8.5),p.z-(lift?17:13.5));const ahead=lift?38:14;if(!camReady){camPos.copy(desired);look.set(p.x,lift?p.y+2:height(p.x,p.z+ahead)+.6,p.z+ahead);camReady=true;}camPos.lerp(desired,1-Math.exp(-dt*7));camera.position.copy(camPos);const aheadY=lift?p.y+2:height(p.x,p.z+ahead)+.6;look.lerp(new T.Vector3(p.x,aheadY,p.z+ahead),1-Math.exp(-dt*6));camera.lookAt(look);sun.position.set(p.x-45,p.y+85,p.z-25);sun.target.position.set(p.x,p.y,p.z+15);sun.target.updateMatrixWorld();forest.clearSightline(camera.position,skier.position,dt);renderer.render(scene,camera);}
 return {render,trees,resetCamera(){camReady=false;previous=null;}};
}

