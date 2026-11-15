// Times and replays belong to this layout of the slalom.
const storageKey='work-game-ridgeline-slalom-v1';
const poseFields=['x','y','z','angle','speed','yaw','edgeAngle','suspension','skatePhase'];
const drives=['glide','skate','tuck','brake'];

export function readRaceBest(storage){
 try{
  const best=JSON.parse(storage.getItem(storageKey));
  if(!best||!Number.isFinite(best.time)||best.time<=0||!Array.isArray(best.poses)||best.poses.length<2)return null;
  const valid=best.poses.every((pose,i,poses)=>pose&&Number.isFinite(pose.time)&&
   pose.time>=0&&pose.time<=best.time&&(!i||pose.time>poses[i-1].time)&&
   poseFields.every(key=>Number.isFinite(pose[key]))&&typeof pose.air==='boolean'&&drives.includes(pose.drive));
  return valid?best:null;
 }catch{return null;}
}

export function saveRaceBest(storage,best){
 try{storage.setItem(storageKey,JSON.stringify(best));}catch{}
}

export function racePose(p,time){
 const {x,y,z,angle,speed,yaw,edgeAngle,suspension,skatePhase,air,drive}=p;
 return {time,x,y,z,angle,speed,yaw,edgeAngle,suspension,skatePhase,air,drive};
}

export function raceGhostAt(best,time){
 if(!best||time>best.time)return null;
 const {poses}=best;
 let low=0,high=poses.length-1;
 while(high-low>1){
  const mid=Math.floor((high+low)/2);
  if(poses[mid].time<=time)low=mid;
  else high=mid;
 }
 const from=poses[low],to=poses[high];
 const t=Math.max(0,Math.min(1,(time-from.time)/(to.time-from.time)));
 const pose={...(t<.5?from:to),mode:'ski'};
 for(const key of poseFields)pose[key]=from[key]+(to[key]-from[key])*t;
 const turn=to.angle-from.angle;
 pose.angle=from.angle+Math.atan2(Math.sin(turn),Math.cos(turn))*t;
 return pose;
}
