import {height,smooth,clamp,SNOW_WEST,SNOW_EAST,SNOW_NORTH,SNOW_SOUTH} from './mountain-core.js';
const frac=x=>x-Math.floor(x),mix=(a,b,t)=>a+(b-a)*t;
const hash=(x,z)=>frac(Math.sin(x*127.1+z*311.7)*43758.5453);
export function terrainNoise(x,z){const a=Math.floor(x),b=Math.floor(z),u=smooth(frac(x)),v=smooth(frac(z));return mix(mix(hash(a,b),hash(a+1,b),u),mix(hash(a,b+1),hash(a+1,b+1),u),v);}
function fbm(x,z){let h=0,amp=.5;for(let i=0;i<5;i++){h+=terrainNoise(x,z)*amp;x=x*2.07+7;z=z*2.03-17;amp*=.5;}return h;}
// Unequal spines, saddles and drainage channels; no continuous circular wall.
export const ridgeSpines=[
 {width:245,points:[[-480,-480,360],[-720,-160,610],[-810,95,655],[-875,275,492],[-815,420,718],[-755,620,484],[-830,803,610],[-510,1130,400]]},
 {width:275,points:[[540,-460,395],[760,-330,540],[835,-165,728],[785,-20,490],[960,175,787],[855,320,505],[975,470,673],[795,650,468],[885,835,577],[635,1240,397]]},
 {width:116,points:[[775,-220,471],[605,-125,349],[500,15,210],[378,105,96]]},
 {width:130,points:[[850,175,530],[705,210,375],[565,300,245],[410,420,99]]},
 {width:110,points:[[873,479,470],[674,560,295],[558,651,182],[411,707,75]]},
 {width:115,points:[[-817,412,496],[-720,360,344],[-651,284,196]]},
 {width:145,points:[[-825,486,426],[-733,527,319],[-635,549,274],[-580,538,266]]},
 {width:225,points:[[-690,-520,530],[-470,-740,535],[-240,-890,315],[30,-930,235],[275,-880,300],[510,-720,550],[690,-470,590]]},
 {width:175,points:[[-440,-620,540],[-330,-513,480],[-210,-434,392],[-145,-350,310]]},
 {width:170,points:[[510,-660,550],[325,-575,460],[175,-485,381],[123,-354,320]]},
 {width:170,points:[[-160,-690,405],[-45,-568,382],[-25,-416,340]]},
 {width:320,points:[[-690,1240,390],[-350,1420,490],[90,1300,360],[420,1430,470],[810,1240,510]]},
 {width:530,points:[[-1800,-300,850],[-1550,800,1060],[-1000,1800,800]]},
 {width:600,points:[[1800,-800,1000],[2150,800,1200],[1500,2200,950]]},
 {width:430,points:[[-2200,-1920,1020],[-1430,-2290,1180],[-980,-2070,725],[-540,-2410,990]]},
 {width:490,points:[[160,-2720,785],[760,-2600,1270],[1270,-2240,960],[1810,-1970,1070]]}
];
export const drainage=[
 {name:'West Chute',from:[-690,-70],to:[-245,175],width:22,depth:64},
 {name:'West Snow Bowl',from:[-740,610],to:[-240,675],width:96,depth:96},
 {name:'North Couloir',from:[-240,-890],to:[-80,-350],width:23,depth:61},
 {name:'East Chute',from:[710,65],to:[240,280],width:21,depth:70},
 {name:'East Upper Gully',from:[917,-146],to:[487,155],width:40,depth:96},
 {name:'East Fork',from:[953,108],to:[593,263],width:32,depth:70},
 {name:'East Scree Gully',from:[958,387],to:[523,490],width:48,depth:108},
 {name:'West Ridge Gully',from:[-899,285],to:[-604,404],width:37,depth:85},
 {name:'East Alpine Bowl',from:[800,530],to:[245,600],width:100,depth:112},
 {name:'Split Chute',from:[730,920],to:[250,850],width:24,depth:62},
 {name:'Lower Snow Bowl',from:[60,1300],to:[0,705],width:112,depth:75}
];
function segment(x,z,a,b){const vx=b[0]-a[0],vz=b[1]-a[1],t=Math.max(0,Math.min(1,((x-a[0])*vx+(z-a[1])*vz)/(vx*vx+vz*vz)));return {t,d:Math.hypot(x-a[0]-vx*t,z-a[1]-vz*t)};}
export function basinHeight(x,z){
 const ex=Math.max(0,SNOW_WEST-x,x-SNOW_EAST),ez=Math.max(0,SNOW_NORTH-z,z-SNOW_SOUTH);
 const edge=height(clamp(x,SNOW_WEST,SNOW_EAST),clamp(z,SNOW_NORTH,SNOW_SOUTH));
 if(ex===0&&ez===0)return edge;
 const blend=smooth(Math.max(ex/255,ez/235));
 let land=-44+fbm(x*.001,z*.001)*60;
 const warpX=84*(terrainNoise(x*.004,z*.004)-.5);
 const warpZ=105*(terrainNoise(x*.003+17,z*.003-11)-.5);
 const buttress=.77+.28*fbm(x*.008,z*.008);
 for(const ridge of ridgeSpines)for(let i=0;i<ridge.points.length-1;i++){
  const a=ridge.points[i],b=ridge.points[i+1],p=segment(x+warpX,z+warpZ,a,b);
  const crest=mix(a[2],b[2],p.t),profile=Math.exp(-Math.pow(p.d/ridge.width,1.65));
  land=Math.max(land,crest*profile*buttress-32);
 }
 for(const channel of drainage){const p=segment(x,z,channel.from,channel.to),taper=Math.sin(p.t*Math.PI)*.65+.35;land-=channel.depth*Math.exp(-Math.pow(p.d/channel.width,2))*taper;}
 const talus=smooth((land-48)/185);
 const rough=(fbm(x*.012,z*.012)-.5)*(22+talus*54)+(fbm(x*.033,z*.033)-.5)*(5+talus*16);
 land+=rough*smooth(Math.max(ex,ez)/200);
 return mix(edge,land,blend);
}
