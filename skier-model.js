import * as T from './vendor/three.module.js';
import {height,crashBounds} from './mountain-core.js';
import {advanceCrashBody,crashBootOffset,crashHipHeight,gearContacts,skiClearance,skiProfile} from './crash-physics.js';
export function makeSkier(scene){
 const root=new T.Group();scene.add(root);const cloth=new T.MeshStandardMaterial({color:'#c66d46',roughness:.91}),darkCloth=new T.MeshStandardMaterial({color:'#34485a',roughness:.94}),trim=new T.MeshStandardMaterial({color:'#dfaa70',roughness:.8}),rubber=new T.MeshStandardMaterial({color:'#263743',roughness:.74}),metal=new T.MeshStandardMaterial({color:'#a3b0b8',roughness:.28,metalness:.65}),skin=new T.MeshStandardMaterial({color:'#d8ac83',roughness:.9}),helmetMat=new T.MeshStandardMaterial({color:'#e8be63',roughness:.36});
 function mesh(g,m,parent=root){const o=new T.Mesh(g,m);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;}
 function box(w,h,d,m,x,y,z,parent=root){const o=mesh(new T.BoxGeometry(w,h,d),m,parent);o.position.set(x,y,z);return o;}
 function link(a,b,r1,r2,m){const o=mesh(new T.CylinderGeometry(r1,r2,1,9),m);const update=(a,b)=>{const av=new T.Vector3(...a),bv=new T.Vector3(...b),v=bv.clone().sub(av);o.position.copy(av.add(bv).multiplyScalar(.5));o.scale.y=v.length();o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),v.normalize());};update(a,b);return {update};}
 const torso=new T.Group();root.add(torso);const jacket=mesh(new T.CapsuleGeometry(.36,.54,5,12),cloth,torso);jacket.scale.set(1.18,1,.82);jacket.position.y=.48;
 box(.76,.13,.53,darkCloth,0,-.02,0,torso);box(.025,.8,.025,rubber,0,.49,.305,torso);for(const s of[-1,1]){box(.23,.025,.035,trim,s*.21,.34,.29,torso);box(.13,.22,.025,darkCloth,s*.27,.73,-.31,torso);}box(.035,.45,.025,trim,-.2,.49,-.32,torso);box(.035,.45,.025,trim,.2,.49,-.32,torso);
 const collar=mesh(new T.CylinderGeometry(.21,.24,.19,12),darkCloth,torso);collar.position.y=1.02;const face=mesh(new T.SphereGeometry(.275,14,10),skin,torso);face.position.y=1.3;
 const helmet=mesh(new T.SphereGeometry(.32,16,10,0,Math.PI*2,0,Math.PI*.63),helmetMat,torso);helmet.position.y=1.39;for(const x of[-.12,0,.12]){const vent=box(.035,.025,.14,rubber,x,1.68,0,torso);vent.rotation.x=.1;}
 const strap=mesh(new T.CylinderGeometry(.281,.281,.08,16,1,true),rubber,torso);strap.position.y=1.32;
 const lens=mesh(new T.SphereGeometry(.31,16,8,0,Math.PI),new T.MeshStandardMaterial({color:'#a2c3d3',roughness:.12,metalness:.7}),torso);lens.scale.set(1.05,.37,.45);lens.position.set(0,1.34,.23);box(.075,.06,.08,rubber,0,1.3,.36,torso);
 const hood=mesh(new T.SphereGeometry(.25,10,7),cloth,torso);hood.scale.set(1,.8,.55);hood.position.set(0,.94,-.27);
 const skiGroup=new T.Group();root.add(skiGroup);const legs=[],arms=[],feet=[],equipment=[];
 function trackGear(mounted,kind,side){
  const loose=mounted.clone(true);
  loose.name='Loose '+kind;loose.visible=false;scene.add(loose);
  const ski=kind==='ski';
  equipment.push({mounted,loose,side,ski,body:{
   position:loose.position,orientation:loose.quaternion,velocity:new T.Vector3(),spin:new T.Vector3(),
   contacts:ski?skiProfile.filter((_,i)=>i%2===0).map(({y,z})=>[0,y+.025,z,.145]):gearContacts(1,.08,'y'),
   inverseInertia:ski?1.1:3,snowDrag:2.7,forwardX:0,forwardZ:1
  }});
 }
 function skiGeometry(){const p=[],ind=[];for(const {w,y,z} of skiProfile)p.push(-w,y,z,w,y,z,-w,y+.055,z,w,y+.055,z);for(let i=0;i<skiProfile.length-1;i++){const k=i*4,n=k+4;ind.push(k+2,n+2,k+3,k+3,n+2,n+3,k,n,k+2,k+2,n,n+2,k+1,k+3,n+1,k+3,n+3,n+1,k,n+1,n,k,k+1,n+1);}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setIndex(ind);g.computeVertexNormals();return g;}
 const skiMat=new T.MeshStandardMaterial({color:'#d49b54',metalness:.24,roughness:.37});
 for(const s of[-1,1]){const foot=new T.Group();foot.position.x=s*.29;skiGroup.add(foot);feet.push({foot,s});
 const ski=new T.Group();ski.name='Mounted ski';foot.add(ski);
 mesh(skiGeometry(),skiMat,ski);box(.055,.018,2.55,darkCloth,0,.1,.12,ski);
 box(.2,.07,.28,rubber,0,.13,.14,ski);box(.2,.07,.25,rubber,0,.13,-.26,ski);
 trackGear(ski,'ski',s);
 const boot=new T.Group();foot.add(boot);const shell=mesh(new T.CapsuleGeometry(.12,.28,3,8),rubber,boot);shell.rotation.x=Math.PI/2;shell.position.set(0,.22,.02);box(.23,.3,.23,darkCloth,0,.32,-.1,boot);for(const y of[.25,.4])box(.25,.035,.04,trim,0,y,.025,boot);
 const thigh=link([s*.22,.98,0],[s*.25,.57,.2],.17,.15,darkCloth),shin=link([s*.25,.57,.2],[s*.29,.3,-.07],.145,.12,darkCloth);legs.push({thigh,shin,s});
 const upper=link([s*.43,1.77,0],[s*.65,1.37,.14],.145,.125,cloth),lower=link([s*.65,1.37,.14],[s*.74,1.08,.35],.12,.095,cloth),glove=mesh(new T.SphereGeometry(.11,9,6),rubber);
 const pole=new T.Group();pole.name='Mounted pole';root.add(pole);
 mesh(new T.CylinderGeometry(.025,.025,1,9),metal,pole);
 const basket=mesh(new T.TorusGeometry(.065,.013,4,8),rubber,pole);
 basket.rotation.x=Math.PI/2;basket.position.y=-.42;
 trackGear(pole,'pole',s);arms.push({upper,lower,glove,pole,s});
 }
 const forward=new T.Vector3(),up=new T.Vector3(),right=new T.Vector3();
 const basis=new T.Matrix4(),yaw=new T.Quaternion(),roll=new T.Quaternion();
 const vertical=new T.Vector3(0,1,0),skiAxis=new T.Vector3(0,0,1);
 const contact=new T.Vector3(),anklePoint=new T.Vector3(),shoulderPoint=new T.Vector3(),crashPivot=new T.Vector3();
 const poleDirection=new T.Vector3();
 let gearCrash=null,gearTime=0;
 function stepGear(item,dt,colliders){
  const {body,ski}=item;
  advanceCrashBody(body,dt,height,colliders,crashBounds);
  if(!ski)return;
  const gap=skiClearance(body.position,body.orientation,height);
  if(gap>=.012)return;
  body.position.y+=.012-gap;
  body.velocity.y=Math.max(0,body.velocity.y);
 }
 function animateGear(p,colliders){
  const crash=p.crash?.yardSale?p.crash:null;
  if(crash!==gearCrash){
   gearCrash=crash;
   if(crash)root.updateMatrixWorld(true);
   for(const item of equipment){
    const {mounted,loose,side,ski,body}=item;
    mounted.visible=!crash;loose.visible=Boolean(crash);
    if(!crash)continue;
    mounted.getWorldPosition(loose.position);
    mounted.getWorldQuaternion(loose.quaternion);
    mounted.getWorldScale(loose.scale);
    const sideways=side*(ski?3.1:4.2);
    body.forwardX=crash.forwardX;body.forwardZ=crash.forwardZ;
    body.velocity.copy(crash.launch).multiplyScalar(ski?.85:.62);
    body.velocity.x+=body.forwardZ*sideways;
    body.velocity.z-=body.forwardX*sideways;
    body.velocity.y+=ski?1.6:2.1;
    body.spin.set(2.8,side*3.5,ski?1.8:4.2);
    stepGear(item,0,colliders);
   }
   gearTime=crash?.time??0;
  }
  if(!crash)return;
  let remaining=Math.min(.12,crash.time-gearTime);
  gearTime=crash.time;
  while(remaining>1e-6){
   const dt=Math.min(remaining,1/120);remaining-=dt;
   for(const item of equipment)stepGear(item,dt,colliders);
  }
 }
 const runningSole=[-1.05,-.45,.15,.75,1.33];
 function fitSki(foot,p,footYaw,lift,edge){
  const sin=Math.sin(p.angle),cos=Math.cos(p.angle);
  const x=p.x+cos*foot.position.x+sin*foot.position.z;
  const z=p.z-sin*foot.position.x+cos*foot.position.z;
  const heading=p.angle+footYaw,dx=Math.sin(heading),dz=Math.cos(heading);
  const along=(height(x+dx,z+dz)-height(x-dx,z-dz))/2;
  const across=(height(x+dz*.32,z-dx*.32)-height(x-dz*.32,z+dx*.32))/.64;
  forward.set(0,along,1).normalize();
  up.set(-across,1,-along).normalize();
  right.crossVectors(up,forward).normalize();
  up.crossVectors(forward,right);
  foot.quaternion.setFromRotationMatrix(basis.makeBasis(right,up,forward));
  foot.quaternion.multiply(roll.setFromAxisAngle(skiAxis,-edge));
  foot.quaternion.premultiply(yaw.setFromAxisAngle(vertical,footYaw));

  // Fit both edges of the running surface so the loaded edge stays on the snow.
  let floor=-Infinity;
  for(const across of [-.11,.11]){
   for(const distance of runningSole){
    contact.set(across,.035,distance).applyQuaternion(foot.quaternion);
    const surface=height(x+cos*contact.x+sin*contact.z,z-sin*contact.x+cos*contact.z);
    floor=Math.max(floor,surface-contact.y);
   }
  }
  foot.position.y=floor-p.y+.025+lift;
 }
 const inverseFall=new T.Quaternion();
 function poseFall(crash){
  root.quaternion.copy(crash.orientation);
  crashPivot.set(0,crashHipHeight,0).applyQuaternion(root.quaternion);
  root.position.copy(crash.position).sub(crashPivot);
  inverseFall.copy(root.quaternion).invert();
  const local=world=>world.clone().sub(root.position).applyQuaternion(inverseFall);
  torso.position.set(0,.65,-.08);
  torso.rotation.set(.12,0,0);
  skiGroup.position.set(0,0,0);
  skiGroup.rotation.set(0,0,0);
  crash.limbs.forEach(({arm,leg,boot},i)=>{
   const [elbow,hand,poleTip]=arm.nodes.map(node=>local(node.position));
   const [knee,ankle]=leg.nodes.map(node=>local(node.position));
   const {foot}=feet[i],{thigh,shin}=legs[i],{upper,lower,glove,pole}=arms[i];
   thigh.update(local(leg.origin).toArray(),knee.toArray());
   shin.update(knee.toArray(),ankle.toArray());
   upper.update(local(arm.origin).toArray(),elbow.toArray());
   lower.update(elbow.toArray(),hand.toArray());
   glove.position.copy(hand);
   foot.position.copy(ankle);
   foot.quaternion.copy(boot).premultiply(inverseFall);
   anklePoint.copy(crashBootOffset).applyQuaternion(foot.quaternion);
   foot.position.sub(anklePoint);
   const tip=poleTip??elbow;
   poleDirection.subVectors(hand,tip);
   pole.position.copy(hand).add(tip).multiplyScalar(.5);
   pole.scale.y=poleDirection.length();
   pole.quaternion.setFromUnitVectors(vertical,poleDirection.normalize());
  });
 }
 function animate(p,colliders=[]){
 if(p.mode==='crash'){
  animateGear(p,colliders);
  poseFall(p.crash);
  return;
 }
 const seated=p.mode==='lift',grounded=!seated&&!p.air;
 const skating=grounded&&p.drive==='skate',tucking=!seated&&p.drive==='tuck';
 const phase=p.skatePhase||0,turn=Math.min(1,Math.abs(p.yaw));
 const edge=grounded&&!skating?p.edgeAngle:0;
 const hipShift=Math.sin(edge)*.45;
 const suspension=grounded?p.suspension:0;
 const compression=Math.max(0,-suspension);
 const stance=seated?.44:tucking?.60:skating?.87:.91-Math.min(.15,p.speed*.005)-turn*.06-Math.abs(hipShift)*.16;
 const crouch=stance+suspension*(tucking?.53:.84);
 const hipZ=(seated?-.05:tucking?-.24:-.12)-compression*.24;
 torso.position.set(skating?Math.sin(phase)*.065:hipShift,crouch,hipZ);
 torso.rotation.x=seated?-.08:tucking?.48:skating?.16+Math.cos(phase*2)*.035:.06+Math.min(.23,p.speed*.007);
 torso.rotation.z=-edge*.9;
 skiGroup.position.set(0,seated?.05:0,seated?.77:0);
 skiGroup.rotation.x=seated?.2:0;
 for(const {foot,s} of feet){
  const stroke=Math.sin(phase+(s>0?Math.PI:0)),spread=skating?.15*Math.max(0,stroke):0;
  const footYaw=skating?-s*(.14+.19*Math.max(0,stroke)):0;
  foot.position.set(s*(.29+spread),0,skating?stroke*.28:0);
  if(grounded)fitSki(foot,p,footYaw,skating?Math.max(0,-stroke)*.1:0,edge);
  else foot.rotation.set(0,footYaw,0);
 }
 for(let i=0;i<legs.length;i++){
  const {thigh,shin,s}=legs[i],foot=feet[i].foot;
  const hip=[s*.22+hipShift,crouch+.02,hipZ];
  const knee=[skating?foot.position.x:s*.27+hipShift*.78,
   seated?.43:.52-turn*.03+(grounded?foot.position.y*.45+(crouch-stance)*.52:0),
   seated?.56:(skating?.19+foot.position.z*.6:.2)+compression*.58];
  anklePoint.set(0,.3,-.07).applyQuaternion(foot.quaternion).add(foot.position);
  const ankle=seated?[foot.position.x,.26,.72]:anklePoint.toArray();
  thigh.update(hip,knee);shin.update(knee,ankle);
 }
 for(const a of arms){
  const {s}=a,push=skating?Math.sin(phase+(s>0?Math.PI:0)):0;
  const shoulder=shoulderPoint.set(s*.43,.77,.04).applyQuaternion(torso.quaternion).add(torso.position);
  const lean=shoulder.x-s*.43;
  const elbow=[s*.65+lean*.65,crouch+.4,hipZ+(seated?.35:tucking?.45:.12)+push*.12];
  const hand=[s*.7+lean*.32,crouch+.15,hipZ+(seated?.88:tucking?.65:.43)+push*.35];
  a.upper.update(shoulder.toArray(),elbow);a.lower.update(elbow,hand);a.glove.position.set(...hand);
  const tip=[s*(skating?1.02:.88),seated?.05:.07,seated?1.48:skating?push*.7-.3:-.3];
  poleDirection.set(hand[0]-tip[0],hand[1]-tip[1],hand[2]-tip[2]);
  a.pole.position.set((hand[0]+tip[0])/2,(hand[1]+tip[1])/2,(hand[2]+tip[2])/2);
  a.pole.scale.y=poleDirection.length();
  a.pole.quaternion.setFromUnitVectors(vertical,poleDirection.normalize());
 }
 animateGear(p,colliders);
 }
 return {root,animate};
}
