import {height,smooth,clamp,SNOW_WEST,SNOW_EAST} from './mountain-core.js';
const frac=x=>x-Math.floor(x),mix=(a,b,t)=>a+(b-a)*t;
const hash=(x,z)=>frac(Math.sin(x*127.1+z*311.7)*43758.5453);
export function terrainNoise(x,z){const a=Math.floor(x),b=Math.floor(z),u=smooth(frac(x)),v=smooth(frac(z));return mix(mix(hash(a,b),hash(a+1,b),u),mix(hash(a,b+1),hash(a+1,b+1),u),v);}
function fbm(x,z){let h=0,amp=.5;for(let i=0;i<5;i++){h+=terrainNoise(x,z)*amp;x=x*2.07+7;z=z*2.03-17;amp*=.5;}return h;}
// Unequal spines, saddles and drainage channels; no continuous circular wall.
export const ridgeSpines=[
 {width:260,points:[[-480,-480,360],[-690,-120,630],[-790,320,710],[-700,760,590],[-510,1130,400]]},
 {width:290,points:[[480,-460,430],[640,-170,720],[820,270,810],[760,720,640],[570,1240,410]]},
 {width:225,points:[[-690,-520,530],[-470,-740,535],[-240,-890,315],[30,-930,235],[275,-880,300],[510,-720,550],[690,-470,590]]},
 {width:320,points:[[-690,1240,390],[-350,1420,490],[90,1300,360],[420,1430,470],[810,1240,510]]},
 {width:530,points:[[-1800,-300,850],[-1550,800,1060],[-1000,1800,800]]},
 {width:600,points:[[1800,-800,1000],[2150,800,1200],[1500,2200,950]]},
 {width:430,points:[[-2200,-1920,1020],[-1430,-2290,1180],[-980,-2070,725],[-540,-2410,990]]},
 {width:490,points:[[160,-2720,785],[760,-2600,1270],[1270,-2240,960],[1810,-1970,1070]]}
];
export const drainage=[
 {name:'West Chute',from:[-690,-70],to:[-245,175],width:22,depth:64},
 {name:'West Snow Bowl',from:[-740,610],to:[-240,675],width:96,depth:96},
 {name:'North Couloir',from:[-240,-890],to:[-80,-55],width:23,depth:61},
 {name:'East Chute',from:[710,65],to:[240,280],width:21,depth:70},
 {name:'East Alpine Bowl',from:[800,530],to:[245,600],width:100,depth:112},
 {name:'Split Chute',from:[730,920],to:[250,850],width:24,depth:62},
 {name:'Lower Snow Bowl',from:[60,1300],to:[0,705],width:112,depth:75}
];
function segment(x,z,a,b){const vx=b[0]-a[0],vz=b[1]-a[1],t=Math.max(0,Math.min(1,((x-a[0])*vx+(z-a[1])*vz)/(vx*vx+vz*vz)));return {t,d:Math.hypot(x-a[0]-vx*t,z-a[1]-vz*t)};}
export function basinHeight(x,z){const ex=Math.max(0,SNOW_WEST-x,x-SNOW_EAST),ez=Math.max(0,-40-z,z-690),blend=smooth(Math.max(ex/205,ez/235)),edge=height(clamp(x,SNOW_WEST,SNOW_EAST),clamp(z,-40,690));let land=-44+fbm(x*.001,z*.001)*60;
 for(const ridge of ridgeSpines)for(let i=0;i<ridge.points.length-1;i++){const a=ridge.points[i],b=ridge.points[i+1],p=segment(x,z,a,b),crest=mix(a[2],b[2],p.t),buttress=.84+.16*fbm(x*.008,z*.008),profile=Math.exp(-Math.pow(p.d/ridge.width,1.65));land=Math.max(land,crest*profile*buttress-32);}
 for(const channel of drainage){const p=segment(x,z,channel.from,channel.to),taper=Math.sin(p.t*Math.PI)*.65+.35;land-=channel.depth*Math.exp(-Math.pow(p.d/channel.width,2))*taper;}
 const rough=(fbm(x*.014,z*.014)-.5)*32+(fbm(x*.042,z*.042)-.5)*6;land+=rough*smooth(Math.max(ex,ez)/260);
 const rear=segment(x,z,[-42,-55],[96,-365]);
 // Below the summit ridge, a shaded basin drops away before the far peaks rise.
 land-=64*Math.exp(-Math.pow(rear.d/235,2))*smooth((-z-40)/145)*(1-smooth((-z-315)/155));
 return mix(edge,land,blend);
}
