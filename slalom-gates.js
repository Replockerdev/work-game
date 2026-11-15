import {RACE_GATES,RACE_LINE_WIDTH,raceGatePoint} from './highline.js';

const clamp=(v,lo,hi)=>Math.max(lo,Math.min(hi,v));
const part=(right,y,width,height,depth)=>({right,y,extents:[width/2,height/2,depth/2]});
const pole=right=>part(right,1.2,.13,2.4,.13);
export function makeGateHardware(height){
 return RACE_GATES.flatMap(gate=>{
  if(!gate.side)return [-RACE_LINE_WIDTH,RACE_LINE_WIDTH].map(right=>{
   const {x,z}=raceGatePoint(gate,right);
   return {...gate,x,z,base:height(x,z),slope:0,reach:2,parts:[pole(0),part(0,1.98,1.4,.62,.12)]};
  });
  const width=1.65,a=raceGatePoint(gate,-width),b=raceGatePoint(gate,width);
  const left=height(a.x,a.z),right=height(b.x,b.z);
  return [{...gate,base:(left+right)/2,slope:(right-left)/(2*width),reach:3,
   parts:[pole(-width),pole(width),part(0,1.78,2*width,.76,.12)]}];
 }).map((gate,id)=>({...gate,id}));
}

const maxBend=.56;
export function stepGateSprings(p,dt){
 if(!p.gateSprings)return;
 for(const [gate,spring] of p.gateSprings){
  spring.velocity=(spring.velocity-105*spring.bend*dt)*Math.exp(-8.5*dt);
  spring.bend=clamp(spring.bend+spring.velocity*dt,-maxBend,maxBend);
  if(Math.abs(spring.bend)===maxBend)spring.velocity*=.3;
  if(Math.abs(spring.bend)<.001&&Math.abs(spring.velocity)<.015)p.gateSprings.delete(gate);
 }
}
export function springGate(p,gate,side,impact){
 const springs=p.gateSprings??=new Map();
 const spring=springs.get(gate.id)??{bend:0,velocity:0};
 spring.velocity=clamp(spring.velocity+side*clamp(impact*.39,1.65,8),-9,9);
 springs.set(gate.id,spring);
}

// Three face normals of the same tilted, sheared boxes drawn by the renderer.
function axes(gate,bend){
 const {dx,dz,slope}=gate;
 return [[-dz,0,dx],[dz*slope,1,-dx*slope],
  [dx-dz*slope*bend,-bend,dz+dx*slope*bend]]
  .map(([x,y,z])=>{
   const length=Math.hypot(x,y,z);
   return {x,y,z,length,nx:x/length,ny:y/length,nz:z/length};
  });
}
function project(a,gate,x,y,z){
 return a.x*(x-gate.x)+a.y*(y-gate.base)+a.z*(z-gate.z);
}
function sphereGap(x,y,z,shape,ax){
 const a=(Math.abs(x)-shape.extents[0])/ax[0].length;
 const b=(Math.abs(y)-shape.extents[1])/ax[1].length;
 const c=(Math.abs(z)-shape.extents[2])/ax[2].length;
 const edge=Math.max(a,b,c);
 return edge<=0?edge:Math.hypot(Math.max(0,a),Math.max(0,b),Math.max(0,c));
}
function contactNormal(values,shape,ax){
 const gaps=values.map((v,i)=>(Math.abs(v)-shape.extents[i])/ax[i].length);
 const edge=Math.max(...gaps);
 let x=0,y=0,z=0;
 for(let i=0;i<3;i++){
  const weight=edge>0?Math.max(0,gaps[i]):Number(i===gaps.indexOf(edge));
  const sign=weight*(Math.sign(values[i])||1);
  x+=ax[i].nx*sign;y+=ax[i].ny*sign;z+=ax[i].nz*sign;
 }
 const length=Math.hypot(x,y,z)||1;
 return [x/length,y/length,z/length];
}

// A swept envelope prevents thin posts and cloth from being skipped at speed.
export function sweepGate(p,old,hardware,fallX,fallZ){
 let hit=null;
 const cos=Math.cos(p.angle),sin=Math.sin(p.angle);
 const oldCos=Math.cos(old.angle),oldSin=Math.sin(old.angle);
 const movement=Math.hypot(p.x-old.x,p.z-old.z);
 for(const gate of hardware){
  if(Math.hypot(gate.x-old.x,gate.z-old.z)>gate.reach+2.4+movement)continue;
  const ax=axes(gate,p.gateSprings?.get(gate.id)?.bend??0);
  const crouch=p.drive==='tuck'?.26:0;
  const samples=[[0,.02,.86-crouch,.43],[0,.02,1.38-crouch,.46],[0,.1,2.03-crouch,.36]];
  for(const side of [-1,1]){
   samples.push([side*.59,.08,1.29-crouch,.24],[side*.70,.35,1.02-crouch,.23]);
  }
  for(const side of [-.29,.29])for(let i=0;i<11;i++){
   const t=i/10,z=-1.3+3.15*t;
   const lift=.1+.26*Math.max(0,(t-.84)/.16)**2;
   samples.push([side,z,lift,.18]);
  }
  for(const [across,along,up,radius] of samples){
   const dx=cos*across+sin*along,dz=-sin*across+cos*along;
   const oldDx=oldCos*across+oldSin*along,oldDz=-oldSin*across+oldCos*along;
   const dy=up-(up<.5?fallX*dx+fallZ*dz:0);
   const oldDy=up-(up<.5?fallX*oldDx+fallZ*oldDz:0);
   const a=ax.map(axis=>project(axis,gate,old.x+oldDx,old.y+oldDy,old.z+oldDz));
   const b=ax.map(axis=>project(axis,gate,p.x+dx,p.y+dy,p.z+dz));
   for(const shape of gate.parts){
    const centers=[shape.right,shape.y,0];
    let enter=0,exit=1;
    for(let i=0;i<3;i++){
     const first=a[i]-centers[i],motion=b[i]-a[i];
     const extent=shape.extents[i]+radius*ax[i].length;
     if(Math.abs(motion)<1e-8){
      if(Math.abs(first)>extent){exit=-1;break;}
      continue;
     }
     const incoming=-Math.sign(motion);
     const near=(incoming*extent-first)/motion;
     const far=(-incoming*extent-first)/motion;
     enter=Math.max(enter,near);
     exit=Math.min(exit,far);
     if(enter>exit)break;
    }
    if(enter>exit||hit&&enter>=hit.t)continue;
    const value=(axis,t)=>a[axis]-centers[axis]+(b[axis]-a[axis])*t;
    const gap=t=>sphereGap(value(0,t),value(1,t),value(2,t),shape,ax)-radius;
    if(gap(enter)>1e-5){
     // The slab sweep is a broad phase. Round its corners for actual brushes.
     let low=enter,high=exit;
     for(let i=0;i<12;i++){
      const left=(2*low+high)/3,right=(low+2*high)/3;
      if(gap(left)<gap(right))high=right;else low=left;
     }
     high=(low+high)/2;
     if(gap(high)>1e-5)continue;
     low=enter;
     for(let i=0;i<12;i++){
      const mid=(low+high)/2;
      if(gap(mid)>1e-5)low=mid;else high=mid;
     }
     enter=high;
    }
    if(hit&&enter>=hit.t)continue;
    if(enter===0&&gap(Math.min(exit,.02))>gap(0)+1e-6)continue;
    let [nx,,nz]=contactNormal([value(0,enter),value(1,enter),value(2,enter)],shape,ax);
    // Roll over or under the gate only when the skier actually clears it.
    if(Math.hypot(nx,nz)<.3){
     const forward=(old.x-gate.x)*gate.dx+(old.z-gate.z)*gate.dz;
     const sign=Math.sign(forward)||-Math.sign((p.x-old.x)*gate.dx+(p.z-old.z)*gate.dz)||1;
     nx=sign*gate.dx;nz=sign*gate.dz;
    }else{
     const length=Math.hypot(nx,nz);nx/=length;nz/=length;
    }
    hit={gate,t:enter,nx,nz,depth:enter===0?Math.max(0,-gap(0)):0};
   }
  }
 }
 return hit;
}

// The crash solver uses the gate's current pose for the body, limbs and loose gear.
export function gateCrashColliders(p,hardware){
 return hardware.filter(g=>Math.hypot(g.x-p.x,g.z-p.z)<15).flatMap(gate=>{
  const ax=axes(gate,p.gateSprings?.get(gate.id)?.bend??0);
  return gate.parts.map(shape=>({
   x:gate.x,z:gate.z,r:gate.reach,
   contact(point,radius,normal){
    const offsets=[shape.right,shape.y,0];
    const values=ax.map((axis,i)=>project(axis,gate,point.x,point.y,point.z)-offsets[i]);
    const distance=sphereGap(...values,shape,ax);
    if(distance>=radius)return 0;
    normal.set(...contactNormal(values,shape,ax));
    return radius-distance;
   }
  }));
 });
}
