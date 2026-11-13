import {height,smooth,clamp,SNOW_WEST,SNOW_EAST,SNOW_NORTH,SNOW_SOUTH} from './mountain-core.js';

const frac=x=>x-Math.floor(x),mix=(a,b,t)=>a+(b-a)*t;
const hash=(x,z)=>frac(Math.sin(x*127.1+z*311.7)*43758.5453);
export function terrainNoise(x,z){
 const a=Math.floor(x),b=Math.floor(z),u=smooth(frac(x)),v=smooth(frac(z));
 return mix(mix(hash(a,b),hash(a+1,b),u),mix(hash(a,b+1),hash(a+1,b+1),u),v);
}

const centerX=(SNOW_WEST+SNOW_EAST)/2,centerZ=(SNOW_NORTH+SNOW_SOUTH)/2;
const halfWidth=(SNOW_EAST-SNOW_WEST)/2,halfLength=(SNOW_SOUTH-SNOW_NORTH)/2;
// Heights and widths around the outer rim, starting on the east and turning south.
// The low gap just past the base reads as the mouth of the valley.
const sectors=[
 [160,340],[133,310],[164,325],[112,290],[58,300],[39,340],[84,360],[181,365],
 [191,345],[151,295],[132,300],[200,345],[162,350],[83,300],[74,300],[113,330]
];
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
 const a=(Math.atan2(pz,px)/(2*Math.PI)+1)*sectors.length;
 const index=Math.floor(a)%sectors.length,t=smooth(frac(a));
 const [riseA,widthA]=sectors[index], [riseB,widthB]=sectors[(index+1)%sectors.length];
 const crestTexture=terrainNoise(ux*11+16,uz*11+12)-.5;
 const shoulderTexture=terrainNoise(ux*26-6,uz*26+21)-.5;
 // Where the playable mountain already reaches the skyline, continue its
 // shoulders over the rim. Low ground rises gradually into that same rim.
 const skyline=Math.max(edge,inland);
 const developed=smooth((skyline-125)/250);
 const rise=(mix(riseA,riseB,t)+crestTexture*94+shoulderTexture*32)*(1-developed);
 const run=mix(widthA,widthB,t)+crestTexture*105;
 const crestDistance=mix(run,34,developed);
 const crest=edge+rise;
 const y=distance<crestDistance
  ?mix(edge,crest,smooth(distance/crestDistance))
  :mix(crest,-145,smooth((distance-crestDistance)/(1140-crestDistance)));
 const cloud=smooth((distance-crestDistance-24)/460);
 return {y,cloud};
}
export const basinHeight=(x,z)=>basinSample(x,z).y;
