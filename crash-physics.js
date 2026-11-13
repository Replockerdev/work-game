import {Quaternion,Vector3} from './vendor/three.module.js';

const gravity=9.81;
const terrainNormal=new Vector3(),normal=new Vector3(),arm=new Vector3(),point=new Vector3();
const contactVelocity=new Vector3(),torque=new Vector3(),tangent=new Vector3(),rotation=new Quaternion();

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
// Contact spheres sit at the hips, torso, helmet, hands, and boots of the fall pose.
const skierContacts=[
 [0,0,0,.40],[0,.33,-.02,.43],[0,.65,.02,.42],[0,1.19,.23,.36],
 [-.68,.1,.28,.27],[.68,.1,.28,.27],[-.44,-.45,.10,.25],[.44,-.45,.10,.25]
];
const mountedContacts=[
 [-.56,-.52,.9,.23],[.56,-.52,.9,.23],[-.81,-.82,1.73,.21],[.81,-.82,1.73,.21],
 [-.19,-.23,-.85,.21],[.19,-.23,-.85,.21],[-.86,-.37,-.29,.19],[.86,-.37,-.29,.19]
];
const attachedContacts=[...skierContacts,...mountedContacts];
export const crashContacts=yardSale=>yardSale?skierContacts:attachedContacts;
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
