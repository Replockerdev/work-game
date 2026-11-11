import * as T from './vendor/three.module.js';
import {height} from './mountain-core.js';
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
 const skiGroup=new T.Group();root.add(skiGroup);const boots=[],legs=[],arms=[],feet=[];
 function skiGeometry(){const points=[];for(let i=0;i<=22;i++){const z=-1.3+i/22*3.15,t=i/22,w=.105+.035*Math.sin(t*Math.PI),y=.035+Math.pow(Math.max(0,(t-.84)/.16),2)*.28+Math.pow(Math.max(0,(.1-t)/.1),2)*.05;points.push({z,w,y});}const p=[],ind=[];for(const v of points)p.push(-v.w,v.y,v.z,v.w,v.y,v.z,-v.w,v.y+.055,v.z,v.w,v.y+.055,v.z);for(let i=0;i<points.length-1;i++){const k=i*4,n=k+4;ind.push(k+2,n+2,k+3,k+3,n+2,n+3,k,n,k+2,k+2,n,n+2,k+1,k+3,n+1,k+3,n+3,n+1,k,n+1,n,k,k+1,n+1);}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setIndex(ind);g.computeVertexNormals();return g;}
 const skiMat=new T.MeshStandardMaterial({color:'#d49b54',metalness:.24,roughness:.37});
 for(const s of[-1,1]){const foot=new T.Group();foot.position.x=s*.29;skiGroup.add(foot);feet.push({foot,s});const ski=mesh(skiGeometry(),skiMat,foot);box(.055,.018,2.55,darkCloth,0,.1,.12,foot);box(.2,.07,.28,rubber,0,.13,.14,foot);box(.2,.07,.25,rubber,0,.13,-.26,foot);const boot=new T.Group();foot.add(boot);const shell=mesh(new T.CapsuleGeometry(.12,.28,3,8),rubber,boot);shell.rotation.x=Math.PI/2;shell.position.set(0,.22,.02);box(.23,.3,.23,darkCloth,0,.32,-.1,boot);for(const y of[.25,.4])box(.25,.035,.04,trim,0,y,.025,boot);boots.push(boot);
 const thigh=link([s*.22,.98,0],[s*.25,.57,.2],.17,.15,darkCloth),shin=link([s*.25,.57,.2],[s*.29,.3,-.07],.145,.12,darkCloth);legs.push({thigh,shin,s});
 const upper=link([s*.43,1.77,0],[s*.65,1.37,.14],.145,.125,cloth),lower=link([s*.65,1.37,.14],[s*.74,1.08,.35],.12,.095,cloth),glove=mesh(new T.SphereGeometry(.11,9,6),rubber),pole=link([s*.74,1.08,.35],[s*.88,.07,-.3],.025,.025,metal);arms.push({upper,lower,glove,pole,s});const basket=mesh(new T.TorusGeometry(.065,.013,4,8),rubber);basket.rotation.x=Math.PI/2;arms.at(-1).basket=basket;
 }
 const forward=new T.Vector3(),up=new T.Vector3(),right=new T.Vector3();
 const basis=new T.Matrix4(),yaw=new T.Quaternion(),roll=new T.Quaternion();
 const vertical=new T.Vector3(0,1,0),skiAxis=new T.Vector3(0,0,1);
 const contact=new T.Vector3(),anklePoint=new T.Vector3(),shoulderPoint=new T.Vector3(),crashPivot=new T.Vector3();
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
 function animate(p,time){
 const crashed=p.mode==='crash',crashTime=p.crash?.time??0;
 if(crashed){
  const {heading,side}=p.crash;
  const tumble=T.MathUtils.smoothstep(crashTime,0,.95);
  const pitch=.42*Math.sin(crashTime*5)*Math.exp(-crashTime*1.4);
  root.rotation.set(pitch,heading+.35*side*tumble,side*Math.PI*1.5*tumble,'YXZ');
  // Roll around the hips, then settle onto the snow.
  crashPivot.set(0,.9,0).applyEuler(root.rotation);
  const bounce=.45*Math.sin(Math.PI*T.MathUtils.clamp(crashTime/.95,0,1));
  const settle=.55*T.MathUtils.smoothstep(crashTime,.9,1.45);
  root.position.set(p.x-crashPivot.x,p.y+.95+bounce-settle-crashPivot.y,p.z-crashPivot.z);
 }
 const seated=p.mode==='lift',grounded=!seated&&!crashed&&!p.air;
 const skating=grounded&&p.drive==='skate',tucking=!seated&&p.drive==='tuck';
 const phase=p.skatePhase||0,turn=Math.min(1,Math.abs(p.yaw));
 const edge=grounded&&!skating?p.edgeAngle:0;
 const hipShift=Math.sin(edge)*.45;
 const crouch=crashed?.63:seated?.44:tucking?.60:skating?.87:.91-Math.min(.15,p.speed*.005)-turn*.06-Math.abs(hipShift)*.16;
 const hipZ=seated?-.05:tucking?-.24:-.12;
 torso.position.set(skating?Math.sin(phase)*.065:hipShift,crouch,hipZ);
 torso.rotation.x=crashed?.35+Math.sin(crashTime*10)*.1*Math.exp(-crashTime*3):seated?-.08:tucking?.48:skating?.16+Math.cos(phase*2)*.035:.06+Math.min(.23,p.speed*.007);
 torso.rotation.z=crashed?p.crash.side*.18:-edge*.9;
 skiGroup.position.set(0,seated?.05:0,seated?.77:0);
 skiGroup.rotation.x=seated?.2:0;
 for(const {foot,s} of feet){
  const stroke=Math.sin(phase+(s>0?Math.PI:0)),spread=skating?.15*Math.max(0,stroke):0;
  const footYaw=skating?-s*(.14+.19*Math.max(0,stroke)):0;
  foot.position.set(s*(.29+spread),0,skating?stroke*.28:0);
  if(grounded)fitSki(foot,p,footYaw,skating?Math.max(0,-stroke)*.1:0,edge);
  else foot.rotation.set(crashed?s*.25:0,crashed?s*.38:footYaw,crashed?s*.18:0);
  if(crashed)foot.position.set(s*.48,.1,s*.22);
 }
 for(let i=0;i<legs.length;i++){const {thigh,shin,s}=legs[i],foot=feet[i].foot,hip=[s*.22+hipShift,crouch+.02,hipZ],knee=[skating?foot.position.x:s*.27+hipShift*.78,seated?.43:.52-turn*.03,seated?.56:skating?.19+foot.position.z*.6:.2];
  anklePoint.set(0,.3,-.07).applyQuaternion(foot.quaternion).add(foot.position);
  const ankle=seated?[foot.position.x,.26,.72]:anklePoint.toArray();
  thigh.update(hip,knee);shin.update(knee,ankle);
 }
 for(const a of arms){
  const {s}=a,push=skating?Math.sin(phase+(s>0?Math.PI:0)):0;
  const shoulder=shoulderPoint.set(s*.43,.77,.04).applyQuaternion(torso.quaternion).add(torso.position);
  const lean=shoulder.x-s*.43;
  const flail=crashed?Math.sin(crashTime*13+s)*.16*Math.exp(-crashTime*2):0;
  const elbow=[s*(crashed?.84:.65)+lean*.65,crouch+.4+flail,hipZ+(seated?.35:tucking?.45:.12)+push*.12];
  const hand=[s*(crashed?1.04:.7)+lean*.32,crouch+(crashed?.45:.15)+flail,hipZ+(seated?.88:tucking?.65:.43)+push*.35];
  a.upper.update(shoulder.toArray(),elbow);a.lower.update(elbow,hand);a.glove.position.set(...hand);
  const tip=[s*(crashed?1.25:skating?1.02:.88),crashed?.4+flail:seated?.05:.07,seated?1.48:skating?push*.7-.3:-.3];
  a.pole.update(hand,tip);a.basket.position.set(tip[0],tip[1]+.1,tip[2]);
 }
 }
 return {root,animate};
}
