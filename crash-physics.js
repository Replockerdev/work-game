import {Quaternion,Vector3} from './vendor/three.module.js';

const gravity=9.81;
const terrainNormal=new Vector3(),normal=new Vector3(),arm=new Vector3(),point=new Vector3();
const contactVelocity=new Vector3(),torque=new Vector3(),tangent=new Vector3(),rotation=new Quaternion();
const chest=new Vector3();

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
 const nearby=colliders.filter(o=>obstacleDistance(position.x,position.z,o)<2.5+velocity.length()*dt);
 const count=Math.ceil(Math.max(dt*240,velocity.length()*dt/.12,spin.length()*dt/.10,1));
 const slice=dt/count;
 let grounded=false;
 for(let i=0;i<count;i++){
  let onSnow=false;
  velocity.y-=gravity*slice;
  position.addScaledVector(velocity,slice);
  if(body.limbs&&position.y-height(position.x,position.z)<.62){
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
function makeLimb(body,anchor,points,radii,extra=null){
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
 if(extra)links.push(extra);
 return {local,origin,nodes,links};
}
export function createCrashLimbs(body){
 return [-1,1].map(side=>({
  arm:makeLimb(body,[side*.43,.61,.12],[
   [side*.63,.24,.16],[side*.7,.06,.32],...(body.yardSale?[]:[[side*.86,-.39,-.29]])
  ],[.15,.15,.11]),
  leg:makeLimb(body,[side*.22,-.10,-.12],[
   [side*.28,-.31,.18],[side*.38,-.58,.03],
   ...(body.yardSale?[]:[[side*.42,-.68,1.71],[side*.37,-.66,-1.28]])
  ],[.18,.20,.13,.13],body.yardSale?null:[2,3,3])
 }));
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
 if(dt<=0)return;
 const nearby=colliders.filter(o=>obstacleDistance(body.position.x,body.position.z,o)<3.5);
 const steps=Math.max(1,Math.ceil(dt*240)),slice=dt/steps;
 const damping=Math.exp(-6*slice);
 for(let step=0;step<steps;step++){
  const momentum=slice/(body.limbStep??1/240)*damping;
  body.limbStep=slice;
  for(const side of body.limbs)for(const limb of [side.arm,side.leg]){
   const {origin,local,nodes,links}=limb;
   origin.copy(local).applyQuaternion(body.orientation).add(body.position);
   for(const node of nodes){
    limbOffset.copy(node.position).sub(node.previous).multiplyScalar(momentum);
    node.previous.copy(node.position);
    node.position.add(limbOffset);
    node.position.y-=gravity*slice*slice;
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
    for(const node of nodes)placeJoint(node,height,nearby,body);
   }
  }
 }
}
