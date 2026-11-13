import {height,smooth,clamp,SNOW_WEST,SNOW_EAST,SNOW_NORTH,SNOW_SOUTH} from './mountain-core.js';

const frac=x=>x-Math.floor(x),mix=(a,b,t)=>a+(b-a)*t;
const hash=(x,z)=>frac(Math.sin(x*127.1+z*311.7)*43758.5453);
export function terrainNoise(x,z){
 const a=Math.floor(x),b=Math.floor(z),u=smooth(frac(x)),v=smooth(frac(z));
 return mix(mix(hash(a,b),hash(a+1,b),u),mix(hash(a,b+1),hash(a+1,b+1),u),v);
}

const centerX=(SNOW_WEST+SNOW_EAST)/2,centerZ=(SNOW_NORTH+SNOW_SOUTH)/2;
const halfWidth=(SNOW_EAST-SNOW_WEST)/2,halfLength=(SNOW_SOUTH-SNOW_NORTH)/2;
// Relief and run-up around the outer rim, starting on the east and turning south.
// Keep a low saddle just past the base where the valley opens out.
const sectors=[
 [450,400],[370,355],[465,425],[350,410],[120,410],[104,410],[245,395],[395,415],
 [360,360],[410,375],[390,400],[445,370],[360,410],[390,395],[290,365],[420,375]
];
// Gullies and wider bowls break up the crest and cut through the front faces.
// Widths and positions are in fractions of the same sectors above.
const drainages=[
 [.34,.16,.56],[1.84,.44,.50],[2.67,.20,.65],[3.74,.37,.43],[5.93,.39,.58],
 [7.44,.20,.59],[8.88,.31,.50],[10.15,.17,.64],[11.28,.37,.45],
 [12.55,.20,.58],[14.18,.29,.55],[15.14,.22,.62]
];
function drainageDepth(sector){
 let cut=0;
 for(const [center,width,depth] of drainages){
  const separation=Math.abs(sector-center);
  const offset=Math.min(separation,sectors.length-separation)/width;
  if(offset<1)cut=Math.max(cut,depth*(1-smooth(offset)));
 }
 return cut;
}
export function basinSample(x,z){
 const px=(x-centerX)/halfWidth,pz=(z-centerZ)/halfLength;
 const radius=Math.max(Math.abs(px),Math.abs(pz));
 if(radius<=1)return {y:height(x,z),cloud:0};
 const edgeX=centerX+(x-centerX)/radius,edgeZ=centerZ+(z-centerZ)/radius;
 const dx=x-edgeX,dz=z-edgeZ,distance=Math.hypot(dx,dz);
 if(distance>=1260)return {y:-145,cloud:1};
 const ux=dx/distance,uz=dz/distance;
 const edge=height(edgeX,edgeZ);
 const inland=height(edgeX-ux*90,edgeZ-uz*90);
 const a=(Math.atan2(pz,px)/(2*Math.PI)+1)*sectors.length%sectors.length;
 const index=Math.floor(a),t=smooth(frac(a));
 const [riseA,widthA]=sectors[index], [riseB,widthB]=sectors[(index+1)%sectors.length];
 const crestTexture=terrainNoise(ux*14+16,uz*14+12)-.5;
 const shoulderTexture=terrainNoise(ux*32-6,uz*32+21)-.5;
 const brokenRock=terrainNoise(ux*59+7,uz*59-12)-.5;
 const cut=drainageDepth(a);
 const exposed=1-smooth(cut/.55);
 // Join high terrain on its shoulder and give lower valleys their own
 // headwalls. The far side then falls away continuously into the clouds.
 const developed=smooth((Math.max(edge,inland)-165)/310);
 const behindSummit=smooth((inland-edge-30)/130);
 const relief=Math.max(55,mix(riseA,riseB,t)+crestTexture*182+shoulderTexture*80+brokenRock*28);
 const rise=relief*(1-cut)*(1-behindSummit)*mix(1,.24,developed);
 const run=mix(widthA,widthB,t)+crestTexture*126+shoulderTexture*44;
 const crestDistance=mix(run,115,developed);
 const crest=edge+rise;
 const face=distance/crestDistance;
 const bandStart=.46+crestTexture*.15+shoulderTexture*.12;
 const bandEnd=.76+crestTexture*.15+shoulderTexture*.12;
 const lowerFace=smooth((face-.06)/.76);
 const headwall=smooth((face-bandStart)/(bandEnd-bandStart));
 const upperFace=smooth((face-.75)/.25);
 const profile=mix(smooth(face),.38*lowerFace+.49*headwall+.13*upperFace,exposed);
 const y=face<1?mix(edge,crest,profile)
  :mix(crest,-145,smooth((distance-crestDistance)/(1140-crestDistance)));
 const cloud=smooth((distance-crestDistance-24)/460);
 return {y,cloud};
}
export const basinHeight=(x,z)=>basinSample(x,z).y;
