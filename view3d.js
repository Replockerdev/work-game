import * as T from './vendor/three.module.js';

export function createView(canvas){
 const renderer=new T.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});
 renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.outputColorSpace=T.SRGBColorSpace;
 const scene=new T.Scene();scene.background=new T.Color('#a7d7db');scene.fog=new T.Fog('#a7d7db',135,240);
 const camera=new T.PerspectiveCamera(46,1,.1,350);camera.position.set(50,57,99);
 scene.add(new T.HemisphereLight(0xd8f1ff,0x477443,2.5));
 const sun=new T.DirectionalLight(0xffeed0,3.1);sun.position.set(-25,80,30);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-80,right:80,top:70,bottom:-70,near:1,far:170});sun.shadow.bias=-.0008;scene.add(sun);
 const mats={};function mat(color){return mats[color]??=new T.MeshStandardMaterial({color,roughness:.95,flatShading:true});}
 function box(w,h,d,color,x,y,z,parent=scene){const mesh=new T.Mesh(new T.BoxGeometry(w,h,d),mat(color));mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;}
 function line(points,color='#f6f5da',opacity=1){const geo=new T.BufferGeometry().setFromPoints(points.map(p=>new T.Vector3(p[0],p[1]??.045,p[2])));const l=new T.Line(geo,new T.LineBasicMaterial({color,transparent:opacity<1,opacity}));scene.add(l);return l;}
 function groundRect(x,z,w,d){line([[x,.06,z],[x+w,.06,z],[x+w,.06,z+d],[x,.06,z+d],[x,.06,z]]);}
 box(240,.6,190,'#6a9c6b',50,-.65,31);box(110,.3,70,'#478a4c',50,-.2,31);
 for(let i=0;i<10;i++)box(9.5,.08,56,i%2?'#60a658':'#559b50',7.25+i*9.5,-.035,31);
 groundRect(2.5,3,95,56);line([[50,.06,3],[50,.06,59]]);
 const circle=[];for(let i=0;i<=64;i++){const a=i/64*Math.PI*2;circle.push([50+Math.cos(a)*7.7,.07,31+Math.sin(a)*7.7]);}line(circle);
 groundRect(2.5,16.4,15.5,29.2);groundRect(82,16.4,15.5,29.2);groundRect(2.5,24.2,5.3,13.6);groundRect(92.2,24.2,5.3,13.6);
 for(const x of [13,50,87]){const dot=new T.Mesh(new T.CircleGeometry(.22,12),mat('#f6f5da'));dot.rotation.x=-Math.PI/2;dot.position.set(x,.08,31);scene.add(dot);}
 for(const x of [2.5,97.5]){const back=x<50?x-3.3:x+3.3;for(const z of [24.5,37.5]){box(.22,3.2,.22,'#f7f5e9',x,1.6,z);line([[x,3.2,z],[back,3.2,z],[back,.1,z]],'#edf4df',.65);}box(.22,.22,13.2,'#f7f5e9',x,3.2,31);for(let z=24.5;z<=37.5;z+=.7)line([[x,3.2,z],[back,3.2,z],[back,.1,z]],'#ecf8e4',.32);for(let y=.1;y<=3.2;y+=.5)line([[back,y,24.5],[back,y,37.5]],'#ecf8e4',.32);}
 // A small, bright stadium with low-cost instanced spectators.
 for(const z of [-7,69]){for(let r=0;r<4;r++)box(122,1.15,2.5,r%2?'#455f66':'#3a535f',50,r*1.1+.5,z+(z<0?-r*2.3:r*2.3));}
 for(const x of [-10,110]){for(let r=0;r<3;r++)box(2.5,1.15,75,'#455f66',x+(x<50?-r*2.3:r*2.3),r*1.1+.5,31);}
 const crowd=new T.InstancedMesh(new T.BoxGeometry(.6,.9,.6),mat('#ffffff'),600);const dummy=new T.Object3D(),palette=['#f2cc70','#eac1a4','#7f9fb4','#f9f1dd','#e88b75','#acc96a'];let idx=0;
 for(const z of [-7,69])for(let r=0;r<4;r++)for(let j=0;j<64;j++){dummy.position.set(-8+j*1.85,r*1.1+1.5,z+(z<0?-r*2.3:r*2.3));dummy.updateMatrix();crowd.setMatrixAt(idx,dummy.matrix);crowd.setColorAt(idx,new T.Color(palette[(j+r*3)%palette.length]));idx++;}crowd.count=idx;scene.add(crowd);
 for(const z of [-1,63])for(let j=0;j<8;j++)box(11,.9,.25,j%2?'#173d39':'#d6ed93',8+j*12,.45,z);
 for(const x of [-4,104])for(const z of [-3,65]){box(.25,15,.25,'#758a88',x,7.5,z);box(4,1,.6,'#f9f4cb',x,15,z);}
 function makePlayer(team,id,index){const root=new T.Group(),body=new T.Group();root.add(body);body.scale.setScalar(1.35);scene.add(root);const kit=id===0?'#66bfd4':team?'#f8896f':'#c5ed69',shorts=team?'#f8eacb':'#163f37',skin=['#c78a60','#e7b587','#805333','#d09c75','#b77c56'][index%5];
 box(1.12,1.25,.6,kit,0,1.83,0,body);box(1.05,.46,.61,shorts,0,1.03,0,body);
 const head=new T.Mesh(new T.IcosahedronGeometry(.45,1),mat(skin));head.position.set(0,2.85,0);body.add(head);box(.69,.18,.66,'#30312c',0,3.1,0,body);
 const legs=[],arms=[];for(const side of [-1,1]){const leg=new T.Group();leg.position.set(side*.3,1,0);body.add(leg);box(.33,.55,.35,skin,0,-.23,0,leg);box(.34,.32,.36,kit,0,-.62,0,leg);box(.39,.22,.68,'#253735',0,-.84,.15,leg);legs.push(leg);const arm=new T.Group();arm.position.set(side*.72,2.3,0);body.add(arm);box(.33,.55,.36,kit,0,-.22,0,arm);box(.28,.55,.3,skin,0,-.7,0,arm);arms.push(arm);}
 const ring=new T.Mesh(new T.RingGeometry(1.22,1.4,32),new T.MeshBasicMaterial({color:'#efff88',side:T.DoubleSide}));ring.rotation.x=-Math.PI/2;ring.position.y=.08;root.add(ring);
 const arrow=new T.Mesh(new T.ConeGeometry(.38,.65,3),mat('#eaff7a'));arrow.rotation.z=Math.PI;arrow.position.y=4.9;root.add(arrow);
 return {root,body,legs,arms,ring,arrow,x:0,z:0,walk:0,angle:team?-Math.PI/2:Math.PI/2};}
 const models=Array.from({length:10},(_,i)=>makePlayer(i<5?0:1,i%5,i));
 const football=new T.Group(),sphere=new T.Mesh(new T.IcosahedronGeometry(.59,2),mat('#fffae8'));sphere.castShadow=true;football.add(sphere);
 const points=[[0,1,0],[0,-1,0],[1,0,0],[-1,0,0],[0,0,1],[0,0,-1]];for(const p of points){const patch=new T.Mesh(new T.CircleGeometry(.2,5),mat('#253631'));patch.position.set(p[0]*.584,p[1]*.584,p[2]*.584);patch.lookAt(p[0]*2,p[1]*2,p[2]*2);football.add(patch);}scene.add(football);
 const ballShadow=new T.Mesh(new T.CircleGeometry(.7,20),new T.MeshBasicMaterial({color:'#233b2c',transparent:true,opacity:.35,depthWrite:false}));ballShadow.rotation.x=-Math.PI/2;ballShadow.position.y=.09;scene.add(ballShadow);
 const aim=new T.Mesh(new T.ConeGeometry(.38,2.1,3),new T.MeshBasicMaterial({color:'#edff92'}));aim.rotation.x=Math.PI/2;scene.add(aim);
 let lastW=0,lastH=0,camX=50,camZ=31;
 function render(state,dt){const w=canvas.clientWidth,h=canvas.clientHeight;if(w!==lastW||h!==lastH){renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();lastW=w;lastH=h;}
 const {players,ball,active,charge,playing,lastAim}=state;
 for(let i=0;i<players.length;i++){const p=players[i],m=models[i],x=p.x/10,z=p.y/10,speed=Math.hypot(x-m.x,z-m.z)/Math.max(dt,.016);if(speed>.08&&speed<100){m.walk+=dt*Math.min(speed,25)*1.05;const target=Math.atan2(x-m.x,z-m.z);let delta=(target-m.angle+Math.PI*3)%(Math.PI*2)-Math.PI;m.angle+=delta*Math.min(1,dt*15);}m.x=x;m.z=z;m.root.position.set(x,0,z);m.body.rotation.y=m.angle;
 const stride=playing?Math.min(speed/16,1):0;m.legs[0].rotation.x=Math.sin(m.walk)*.85*stride;m.legs[1].rotation.x=-Math.sin(m.walk)*.85*stride;m.arms[0].rotation.x=-Math.sin(m.walk)*.7*stride;m.arms[1].rotation.x=Math.sin(m.walk)*.7*stride;m.body.position.y=Math.abs(Math.sin(m.walk))*stride*.14;m.body.rotation.z=playing?Math.sin(m.walk*.5)*stride*.07:0;m.ring.visible=m.arrow.visible=i===active;m.arrow.position.y=4.9+Math.sin(performance.now()*.004)*.12;}
 football.position.set(ball.x/10,.6+(ball.z||0)/10,ball.y/10);football.rotation.z-=ball.vx*dt*.025;football.rotation.x+=ball.vy*dt*.025;ballShadow.position.set(ball.x/10,.09,ball.y/10);ballShadow.scale.setScalar(1+(ball.z||0)*.012);ballShadow.material.opacity=Math.max(.12,.4-(ball.z||0)*.004);
 aim.visible=charge>0&&ball.owner===active;const p=players[active];if(p){aim.position.set(p.x/10+lastAim.x*2.6,.15,p.y/10+lastAim.y*2.6);aim.rotation.z=-Math.atan2(lastAim.x,lastAim.y);aim.scale.setScalar(.75+charge*.7);}
 const targetX=T.MathUtils.clamp(ball.x/10*.65+players[active].x/10*.35,23,77),targetZ=T.MathUtils.clamp(ball.y/10,20,42);camX+=(targetX-camX)*(1-Math.exp(-dt*3));camZ+=(targetZ-camZ)*(1-Math.exp(-dt*2));
 const wide=state.wide;camera.position.set(camX,wide?68:35,camZ+(wide?75:43));camera.lookAt(camX,0,camZ-3);renderer.render(scene,camera);
 }
 return {render};
}

