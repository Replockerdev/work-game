import {Matrix4,Quaternion,Vector3} from './vendor/three.module.js';

const gravity=9.81;
const terrainNormal=new Vector3(),normal=new Vector3(),arm=new Vector3(),point=new Vector3();
const contactVelocity=new Vector3(),torque=new Vector3(),tangent=new Vector3(),rotation=new Quaternion();
const chest=new Vector3(),bodyUp=new Vector3();

export function obstacleDistance(x,z,obstacle){
 const dx=x-obstacle.x,dz=z-obstacle.z;
 if(!obstacle.box)return Math.hypot(dx,dz)-(obstacle.r??.8);
 const {cos,sin,halfWidth,halfDepth}=obstacle.box;
 const across=Math.abs(dx*cos-dz*sin)-halfWidth;
 const along=Math.abs(dx*sin+dz*cos)-halfDepth;
 return Math.hypot(Math.max(0,across),Math.max(0,along))+Math.min(0,Math.max(across,along));
}
export function obstacleNormal(x,z,obstacle,forwardX,forwardZ){
 let nx=x-obstacle.x,nz=z-obstacle.z;
 if(obstacle.box){
  const e=.04;
  nx=obstacleDistance(x+e,z,obstacle)-obstacleDistance(x-e,z,obstacle);
  nz=obstacleDistance(x,z+e,obstacle)-obstacleDistance(x,z-e,obstacle);
 }
 const length=Math.hypot(nx,nz);
 return length?[nx/length,nz/length]:[-forwardX,-forwardZ];
}
export const obstacleTop=(o,height)=>o.top??height(o.x,o.z)+(o.chuteRock?o.size*1.32:o.size??5);

export const crashHipHeight=.75;
export const crashBootOffset=new Vector3(0,.28,-.06);
export const skiProfile=Array.from({length:23},(_,i)=>{
 const t=i/22;
 return {z:-1.3+t*3.15,w:.105+.035*Math.sin(t*Math.PI),
  y:.035+.28*Math.max(0,(t-.84)/.16)**2+.05*Math.max(0,(.1-t)/.1)**2};
});
const skiVertices=skiProfile.flatMap(({z,w,y})=>[
 new Vector3(-w,y,z),new Vector3(w,y,z),new Vector3(-w,y+.055,z),new Vector3(w,y+.055,z)
]);
const skiPoint=new Vector3();
export function skiClearance(position,orientation,height){
 let gap=Infinity;
 for(const vertex of skiVertices){
  skiPoint.copy(vertex).applyQuaternion(orientation).add(position);
  gap=Math.min(gap,skiPoint.y-height(skiPoint.x,skiPoint.z));
 }
 return gap;
}
// The torso and helmet use rigid contacts. Limbs and attached gear have their own joints.
export const crashContacts=[
 [0,0,0,.40],[0,.33,-.02,.43],[0,.65,.02,.42],[0,1.19,.23,.36]
];
export function gearContacts(length,radius,axis){
 const segments=Math.ceil(length/.24);
 return Array.from({length:segments+1},(_,i)=>{
  const distance=(i/segments-.5)*length;
  return [0,axis==='y'?distance:0,axis==='z'?distance:0,radius];
 });
}

function impulse(body,direction,amount){
 body.velocity.addScaledVector(direction,amount);
 body.spin.addScaledVector(torque.crossVectors(arm,direction),amount*body.inverseInertia);
}
function resolve(body,direction,penetration,restitution,friction){
 body.position.addScaledVector(direction,penetration+.001);
 contactVelocity.crossVectors(body.spin,arm).add(body.velocity);
 const inward=-contactVelocity.dot(direction);
 if(inward<=0)return;
 const effectiveMass=1+body.inverseInertia*torque.crossVectors(arm,direction).lengthSq();
 const normalImpulse=inward*(1+(inward>1.2?restitution:0))/effectiveMass;
 impulse(body,direction,normalImpulse);
 contactVelocity.crossVectors(body.spin,arm).add(body.velocity);
 tangent.copy(contactVelocity).addScaledVector(direction,-contactVelocity.dot(direction));
 const speed=tangent.length();
 if(speed<1e-6)return;
 tangent.multiplyScalar(-1/speed);
 const tangentMass=1+body.inverseInertia*torque.crossVectors(arm,tangent).lengthSq();
 impulse(body,tangent,Math.min(speed/tangentMass,normalImpulse*friction));
}

export function advanceCrashBody(body,dt,height,colliders,bounds){
 const {position,velocity,orientation,spin,contacts}=body;
 const skier=contacts===crashContacts;
 const nearby=colliders.filter(o=>obstacleDistance(position.x,position.z,o)<2.5+velocity.length()*dt);
 const count=Math.ceil(Math.max(dt*240,velocity.length()*dt/.12,spin.length()*dt/.10,1));
 const slice=dt/count;
 let grounded=false;
 for(let i=0;i<count;i++){
  let onSnow=false;
  velocity.y-=gravity*slice;
  position.addScaledVector(velocity,slice);
  if(skier&&position.y-height(position.x,position.z)<.62){
   chest.set(0,.37,0).applyQuaternion(orientation);
   spin.x+=gravity*chest.z*slice*2;
   spin.z-=gravity*chest.x*slice*2;
  }
  const angularSpeed=spin.length();
  if(angularSpeed>1e-6){
   rotation.setFromAxisAngle(normal.copy(spin).multiplyScalar(1/angularSpeed),angularSpeed*slice);
   orientation.premultiply(rotation).normalize();
  }
  for(let pass=0;pass<3;pass++){
   let contact=false;
   for(const [x,y,z,radius] of contacts){
    arm.set(x,y,z).applyQuaternion(orientation);
    point.copy(position).add(arm);
    const h=height(point.x,point.z);
    const groundGap=point.y-h;
    if(groundGap<radius*1.6){
     const dx=(height(point.x+.18,point.z)-height(point.x-.18,point.z))/.36;
     const dz=(height(point.x,point.z+.18)-height(point.x,point.z-.18))/.36;
     terrainNormal.set(-dx,1,-dz).normalize();
     const penetration=radius-groundGap*terrainNormal.y;
     if(penetration>0){
      resolve(body,terrainNormal,penetration,.12,.65);
      onSnow=true;contact=true;
      point.copy(position).add(arm);
     }
    }
    for(const obstacle of nearby){
     const side=obstacleDistance(point.x,point.z,obstacle);
     if(side>=radius)continue;
     const above=point.y-obstacleTop(obstacle,height);
     if(above>=radius)continue;
     const distance=side>0&&above>0?Math.hypot(side,above):Math.max(side,above);
     if(distance>=radius)continue;
     if(above>side&&side<=0){normal.set(0,1,0);onSnow=true;}
     else{
      const [nx,nz]=obstacleNormal(point.x,point.z,obstacle,body.forwardX,body.forwardZ);
      if(side>0&&above>0)normal.set(nx*side,above,nz*side).normalize();
      else normal.set(nx,0,nz);
     }
     resolve(body,normal,radius-distance,.18,.48);
     point.copy(position).add(arm);contact=true;
    }
   }
   if(!contact)break;
  }
  grounded ||= onSnow;
  const friction=onSnow?body.snowDrag:0;
  velocity.multiplyScalar(Math.exp(-(friction+.14)*slice));
  if(skier){
   bodyUp.set(0,1,0).applyQuaternion(orientation);
   const twist=spin.dot(bodyUp);
   const damped=twist*Math.exp(-(onSnow?12:5)*slice);
   spin.addScaledVector(bodyUp,Math.max(-1.5,Math.min(1.5,damped))-twist);
   spin.clampLength(0,7);
  }
  spin.multiplyScalar(Math.exp(-(onSnow?4.4:.52)*slice));
  const x=Math.max(bounds.west,Math.min(bounds.east,position.x));
  const z=Math.max(bounds.north,Math.min(bounds.south,position.z));
  if(x!==position.x)velocity.x=0;
  if(z!==position.z)velocity.z=0;
  position.x=x;position.z=z;
 }
 return grounded;
}

// Verlet joints carry their momentum through the fall. The hips and shoulders
// follow the torso while the other joints are free to fold and hit the ground.
const limbOffset=new Vector3(),limbNormal=new Vector3();
const upper=new Vector3(),lower=new Vector3(),hinge=new Vector3(),bend=new Vector3();
const bodyRight=new Vector3(),rest=new Vector3();
const bootUp=new Vector3(),bootForward=new Vector3(),bootRight=new Vector3(),bootBase=new Vector3();
const snowUp=new Vector3(),snowForward=new Vector3(),snowBoot=new Quaternion();
const bootBasis=new Matrix4();
const legAxis=new Vector3(),kneeDirection=new Vector3(),targetKnee=new Vector3();
function makeLimb(body,anchor,points,radii,restDirection,maxSwing,maxBend){
 const local=new Vector3(...anchor);
 const origin=local.clone().applyQuaternion(body.orientation).add(body.position);
 const nodes=points.map((values,i)=>{
  const offset=new Vector3(...values).applyQuaternion(body.orientation);
  const position=offset.clone().add(body.position);
  const previous=position.clone().addScaledVector(body.velocity,-1/240);
  previous.addScaledVector(new Vector3().crossVectors(body.spin,offset),-1/240);
  return {position,previous,radius:radii[i]};
 });
 const links=nodes.map((node,i)=>[i-1,i,node.position.distanceTo(i?nodes[i-1].position:origin)]);
 return {local,origin,nodes,links,restDirection:new Vector3(...restDirection).normalize(),maxSwing,maxBend};
}
export function createCrashLimbs(body){
 return [-1,1].map(side=>({
  arm:makeLimb(body,[side*.43,.61,.12],[
   [side*.63,.24,.16],[side*.7,.06,.32],...(body.yardSale?[]:[[side*.86,-.39,-.29]])
  ],[.15,.15,.11],[side*.36,-1,.20],1.65,2.30),
  leg:makeLimb(body,[side*.22,-.10,-.12],[
   [side*.28,-.31,.18],[side*.38,-.58,.03]
  ],[.18,.20],[side*.15,-1,.30],1.28,2.17),
  boot:new Quaternion()
 }));
}
function limitJoints(limb,body,isLeg){
 const [joint,end]=limb.nodes;
 const middle=joint.position,tip=end.position;
 upper.subVectors(middle,limb.origin).normalize();
 rest.copy(limb.restDirection).applyQuaternion(body.orientation);
 const swing=upper.angleTo(rest);
 if(swing>limb.maxSwing){
  upper.addScaledVector(rest,-upper.dot(rest)).normalize();
  upper.multiplyScalar(Math.sin(limb.maxSwing)).addScaledVector(rest,Math.cos(limb.maxSwing));
  limbOffset.copy(limb.origin).addScaledVector(upper,limb.links[0][2]).sub(middle);
  middle.add(limbOffset);
  tip.add(limbOffset);
 }
 // Knees fold toward the heel. Elbows fold toward the shoulder's front.
 bend.crossVectors(upper,bodyRight);
 if(bend.lengthSq()<.01)bend.set(0,0,1).applyQuaternion(body.orientation).addScaledVector(upper,-bend.dot(upper));
 bend.normalize().multiplyScalar(isLeg?-1:1);
 hinge.crossVectors(upper,bend).normalize();
 lower.subVectors(tip,middle);
 const flex=Math.min(limb.maxBend,Math.atan2(Math.max(0,lower.dot(bend)),lower.dot(upper)));
 const maxSplay=isLeg?.07:.09;
 const splay=Math.max(-maxSplay,Math.min(maxSplay,lower.dot(hinge)));
 const reach=Math.sqrt(Math.max(0,limb.links[1][2]**2-splay**2));
 tip.copy(middle).addScaledVector(upper,Math.cos(flex)*reach)
  .addScaledVector(bend,Math.sin(flex)*reach).addScaledVector(hinge,splay);
}
function fitCrashBoot(side,body,height){
 const [knee,ankle]=side.leg.nodes;
 const p=ankle.position,boot=side.boot;
 bootUp.subVectors(knee.position,p).normalize();
 if(bootUp.lengthSq()<.01)bootUp.set(0,1,0).applyQuaternion(body.orientation);
 bootRight.copy(bodyRight).addScaledVector(bootUp,-bodyRight.dot(bootUp));
 if(bootRight.lengthSq()<.01)bootRight.set(body.forwardZ,0,-body.forwardX);
 bootForward.crossVectors(bootRight,bootUp).normalize();
 if(bootForward.lengthSq()<.01)bootForward.set(body.forwardX,0,body.forwardZ);
 bootRight.crossVectors(bootUp,bootForward).normalize();
 bootUp.crossVectors(bootForward,bootRight);
 boot.setFromRotationMatrix(bootBasis.makeBasis(bootRight,bootUp,bootForward));
 if(body.yardSale)return;
 bootBase.copy(crashBootOffset).applyQuaternion(boot).negate().add(p);
 let gap=skiClearance(bootBase,boot,height);
 if(gap<.01){
  // The ski can tip or slide when it meets the slope. Keep the boot at the binding.
  const x=p.x,z=p.z;
  snowUp.set(height(x-.4,z)-height(x+.4,z),.8,height(x,z-.4)-height(x,z+.4)).normalize();
  snowForward.set(bootForward.x,0,bootForward.z);
  if(snowForward.lengthSq()<.02)snowForward.set(body.forwardX,0,body.forwardZ);
  snowForward.addScaledVector(snowUp,-snowForward.dot(snowUp)).normalize();
  bootRight.crossVectors(snowUp,snowForward).normalize();
  snowBoot.setFromRotationMatrix(bootBasis.makeBasis(bootRight,snowUp,snowForward));
  boot.slerp(snowBoot,Math.min(1,(.01-gap)/.37));
  bootBase.copy(crashBootOffset).applyQuaternion(boot).negate().add(p);
  gap=skiClearance(bootBase,boot,height);
  if(gap<.012){
   const lift=.012-gap;
   p.y+=lift;
   ankle.previous.y+=lift*.7;
  }
 }
}
function keepKneeBentForward(leg){
 // A ski that catches the snow can move the ankle after the joint solve.
 // Keep the knee on the forward side of that new hip-to-boot line.
 const [joint,ankle]=leg.nodes;
 legAxis.subVectors(ankle.position,leg.origin);
 const distance=legAxis.length();
 if(distance<1e-5)return;
 legAxis.multiplyScalar(1/distance);
 kneeDirection.crossVectors(legAxis,bodyRight).normalize();
 if(kneeDirection.lengthSq()<.01)return;
 const thigh=leg.links[0][2],shin=leg.links[1][2];
 const minimum=Math.sqrt(thigh**2+shin**2+2*thigh*shin*Math.cos(leg.maxBend));
 const span=Math.max(minimum,distance);
 const along=(thigh**2-shin**2+span**2)/(2*span);
 const rise=Math.sqrt(Math.max(0,thigh**2-along**2));
 targetKnee.copy(leg.origin).addScaledVector(legAxis,Math.min(distance,along*distance/span))
  .addScaledVector(kneeDirection,rise*distance/span);
 joint.position.copy(targetKnee);
}
function placeJoint(node,height,nearby,body){
 const p=node.position,r=node.radius;
 const snow=height(p.x,p.z);
 if(p.y<snow+r){p.y=snow+r;node.previous.lerp(p,.55);}
 for(const obstacle of nearby){
  const side=obstacleDistance(p.x,p.z,obstacle),above=p.y-obstacleTop(obstacle,height);
  if(side>=r||above>=r)continue;
  if(above>side&&side<=0){p.y+=r-above;node.previous.lerp(p,.4);}
  else{
   const reach=above>0?Math.sqrt(r*r-above*above):r;
   if(side>=reach)continue;
   const [x,z]=obstacleNormal(p.x,p.z,obstacle,body.forwardX,body.forwardZ);
   limbNormal.set(x,0,z);
   p.addScaledVector(limbNormal,reach-side+.001);
   node.previous.lerp(p,.45);
  }
 }
}
export function advanceCrashLimbs(body,dt,height,colliders){
 const nearby=colliders.filter(o=>obstacleDistance(body.position.x,body.position.z,o)<3.5);
 const steps=Math.max(1,Math.ceil(dt*240)),slice=dt/steps;
 const damping=Math.exp(-6*slice);
 bodyRight.set(1,0,0).applyQuaternion(body.orientation);
 for(let step=0;step<steps;step++){
  const momentum=slice/(body.limbStep??1/240)*damping;
  if(slice>0)body.limbStep=slice;
  for(const side of body.limbs)for(const limb of [side.arm,side.leg]){
   const isLeg=limb===side.leg;
   const {origin,local,nodes,links}=limb;
   origin.copy(local).applyQuaternion(body.orientation).add(body.position);
   if(slice>0){
    for(const node of nodes){
     limbOffset.copy(node.position).sub(node.previous).multiplyScalar(momentum);
     node.previous.copy(node.position);
     node.position.add(limbOffset);
     node.position.y-=gravity*slice*slice;
    }
   }
   for(let pass=0;pass<6;pass++){
    for(const [a,b,length] of links){
     const first=a<0?origin:nodes[a].position,second=nodes[b].position;
     limbOffset.subVectors(second,first);
     const distance=limbOffset.length();
     if(distance<1e-6)continue;
     limbOffset.multiplyScalar((distance-length)/distance);
     second.addScaledVector(limbOffset,a<0?-1:-.5);
     if(a>=0)first.addScaledVector(limbOffset,.5);
    }
    limitJoints(limb,body,isLeg);
    for(const node of nodes)placeJoint(node,height,nearby,body);
    if(isLeg&&pass===5){
     fitCrashBoot(side,body,height);
     keepKneeBentForward(limb);
     placeJoint(nodes[0],height,nearby,body);
    }
   }
  }
 }
}
