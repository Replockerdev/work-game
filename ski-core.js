export const TRAILS={meadow:{name:'Sunbeam Meadow',length:680,width:38,slope:.12,color:'#a8c7c8',gates:5},pines:{name:'Whispering Pines',length:950,width:29,slope:.17,color:'#8caebd',gates:7}};
export const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const center=(z,area='meadow')=>Math.sin(z*.009)*(area==='pines'?21:14)+Math.sin(z*.003)*12;
export function height(x,z,area='meadow'){return 100-z*TRAILS[area].slope+Math.sin(x*.027+z*.012)*1.4+Math.cos(z*.025)*.5;}
export function freshSave(){return {version:1,coins:0,quest:0,accepted:false,forest:false,boots:0,wax:0,runs:0,best:{},stars:[],landings:0,meadowDone:false,forestDone:false,gateBest:0,deliveryDone:false};}
export const QUESTS=[{name:'Your first tracks',person:'Mira · Mountain guide',text:'Welcome to Juniper! Follow five mint trail ribbons down Sunbeam Meadow, then reach the lodge. There’s no rush.',goal:'Pass 5 ribbons & finish the meadow',reward:60},{name:'Something warm',person:'Otto · Lodge keeper',text:'The little lodge is out of cocoa. Take this flask down Sunbeam Meadow. I’ll get the old forest lift running while you’re gone.',goal:'Deliver cocoa to the meadow lodge',reward:85},{name:'A little air',person:'Ivy · Local rider',text:'The forest’s open! Find your own line through the pines. Try a jump, land it, and meet me at the bottom.',goal:'Finish the pines & land one jump',reward:100},{name:'The mountain remembers',person:'Mira · Mountain guide',text:'Someone left three brass bells along the forest trail. Listen for the quiet places off the main run. Bring their stories home.',goal:'Find 3 hidden bells in the pines',reward:150}];
export function questComplete(s){return [s.meadowDone&&s.gateBest>=5,s.deliveryDone,s.forestDone&&s.landings>=1,s.stars.length>=3][s.quest]||false;}
export function claim(s){if(!s.accepted||!questComplete(s)||s.quest>=QUESTS.length)return false;s.coins+=QUESTS[s.quest].reward;if(s.quest===1)s.forest=true;s.quest++;s.accepted=false;return true;}
export function startRun(area,s){return {area,x:center(0,area),z:0,y:height(center(0,area),0,area),angle:0,speed:0,vy:0,air:false,time:0,gates:0,gatesHit:[],coins:0,coinHit:[],bells:[],landings:0,airtime:0,bump:0,finished:false,recorded:false,hasParcel:s.quest===1&&s.accepted};}
export function gatesFor(area){const a=TRAILS[area];return Array.from({length:a.gates},(_,i)=>{const z=85+i*(a.length-170)/(a.gates-1);return {x:center(z,area),z};});}
export function coinsFor(area){return Array.from({length:24},(_,i)=>{const z=35+i*(TRAILS[area].length-70)/24;return {x:center(z,area)+Math.sin(i*1.9)*11,z};});}
export function bellsFor(area){return area==='pines'?[{id:0,z:210,x:center(210,area)-24},{id:1,z:490,x:center(490,area)+24},{id:2,z:775,x:center(775,area)-22}]:[];}
export function stepRun(r,input,dt,s,obstacles=[]){if(r.finished)return [];const events=[];r.time+=dt;r.bump=Math.max(0,r.bump-dt);const turn=(input.left?1:0)-(input.right?1:0),brake=input.brake;
 const target=turn*(brake?1.32:.98);r.angle+=(target-r.angle)*(1-Math.exp(-dt*(4.1+s.boots*.65)));const acceleration=(brake?-13:input.tuck?7.5:4.5)*Math.cos(r.angle);r.speed=clamp(r.speed+acceleration*dt-(.018*r.speed*r.speed+Math.abs(r.angle)*1.5)*dt,brake?1:0,(input.tuck?29:23)+s.wax*2);
 const beforeY=r.y;r.x+=Math.sin(r.angle)*r.speed*dt;r.z+=Math.max(.15,Math.cos(r.angle))*r.speed*dt;
 const route=center(r.z,r.area),limit=TRAILS[r.area].width+22;if(Math.abs(r.x-route)>limit){r.x=clamp(r.x,route-limit,route+limit);r.speed*=Math.pow(.4,dt);}
 const ground=height(r.x,r.z,r.area);if(input.jump&&!r.air&&r.speed>2){r.air=true;r.vy=7.6;r.airtime=0;events.push('jump');}
 if(r.air){r.airtime+=dt;r.vy-=18*dt;r.y+=r.vy*dt;if(r.y<=ground){r.y=ground;r.air=false;if(r.airtime>.25){r.landings++;events.push('land');}r.vy=0;}}else r.y=ground;
 for(const o of obstacles){if(Math.abs(o.z-r.z)<2.2&&Math.abs(o.x-r.x)<1.8&&r.bump===0&&r.y-ground<2){r.speed=Math.max(2,r.speed*.4);r.bump=1.2;r.x+=r.x>o.x?2:-2;events.push('bump');}}
 for(const [i,g] of gatesFor(r.area).entries())if(!r.gatesHit.includes(i)&&Math.abs(g.z-r.z)<4&&Math.abs(g.x-r.x)<11){r.gatesHit.push(i);r.gates++;events.push('ribbon');}
 for(const [i,c] of coinsFor(r.area).entries())if(!r.coinHit.includes(i)&&Math.hypot(c.x-r.x,c.z-r.z)<3.2){r.coinHit.push(i);r.coins+=2;events.push('coin');}
 for(const b of bellsFor(r.area))if(!s.stars.includes(b.id)&&!r.bells.includes(b.id)&&Math.hypot(b.x-r.x,b.z-r.z)<5){r.bells.push(b.id);events.push('bell');}
 if(r.z>=TRAILS[r.area].length){r.finished=true;events.push('finish');}return events;}
export function recordRun(s,r){if(!r.finished||r.recorded)return false;r.recorded=true;s.coins+=r.coins+15;s.runs++;s.landings+=r.landings;if(r.area==='meadow'){s.meadowDone=true;s.gateBest=Math.max(s.gateBest,r.gates);if(r.hasParcel)s.deliveryDone=true;}else s.forestDone=true;s.stars=[...new Set([...s.stars,...r.bells])];s.best[r.area]=Math.min(s.best[r.area]||Infinity,r.time);return true;}
export function upgrade(s,type){if(!['boots','wax'].includes(type)||s[type]>=3)return false;const cost=45+s[type]*40;if(s.coins<cost)return false;s.coins-=cost;s[type]++;return true;}

