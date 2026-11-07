import * as T from './vendor/three.module.js';
import {height,baseHeight,pathX,routes,smooth} from './mountain-core.js';
import {basinHeight,terrainNoise} from './basin-terrain.js';
const fract=x=>x-Math.floor(x),lerp=(a,b,t)=>a+(b-a)*t;
function hash(x,z){return fract(Math.sin(x*127.1+z*311.7)*43758.5453);}
function noise(x,z){const ix=Math.floor(x),iz=Math.floor(z),u=fract(x),v=fract(z),sx=u*u*(3-2*u),sz=v*v*(3-2*v);return lerp(lerp(hash(ix,iz),hash(ix+1,iz),sx),lerp(hash(ix,iz+1),hash(ix+1,iz+1),sx),sz);}
function fbm(x,z){let sum=0,amp=.5;for(let i=0;i<5;i++){sum+=noise(x,z)*amp;x=x*2.03+11;z=z*2.01-13;amp*=.5;}return sum;}
export function snowMaterial(renderer){
 const c=document.createElement('canvas');c.width=c.height=1024;const ctx=c.getContext('2d'),im=ctx.createImageData(1024,1024);let seed=12388;for(let y=0;y<1024;y++)for(let x=0;x<1024;x++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;const grain=(seed/4294967296-.5)*32,wind=Math.sin(x*.033+Math.sin(y*.016)*3)*4+Math.sin(y*.063+x*.009)*2,n=232+grain+wind,k=(y*1024+x)*4;im.data[k]=n-3;im.data[k+1]=n;im.data[k+2]=Math.min(255,n+5);im.data[k+3]=255;}ctx.putImageData(im,0,0);const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;tex.wrapS=tex.wrapT=T.RepeatWrapping;tex.repeat.set(86,146);tex.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());
 const bump=tex.clone();bump.colorSpace=T.NoColorSpace;bump.needsUpdate=true;const material=new T.MeshStandardMaterial({vertexColors:true,map:tex,bumpMap:bump,bumpScale:.16,roughness:.96});
 material.onBeforeCompile=shader=>{shader.vertexShader='varying vec3 vSnowWorld;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <worldpos_vertex>','#include <worldpos_vertex>\nvSnowWorld=(modelMatrix*vec4(transformed,1.0)).xyz;');shader.fragmentShader='varying vec3 vSnowWorld;\n'+shader.fragmentShader;shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
float tz=clamp((vSnowWorld.z-60.0)/530.0,0.0,1.0);float groom=-103.0*sin(3.14159265*tz);float dist=abs(vSnowWorld.x-groom);float inGroom=(1.0-smoothstep(20.5,23.0,dist))*smoothstep(85.0,100.0,vSnowWorld.z)*(1.0-smoothstep(555.0,575.0,vSnowWorld.z));float cord=sin(vSnowWorld.x*48.0);float aa=exp(-fwidth(vSnowWorld.x)*28.0);diffuseColor.rgb*=1.0-inGroom*(0.025+cord*aa*0.035);
`);};return material;
}
export const rangeHeight=basinHeight;
export function addRange(scene){
 // An irregular heightfield with connected ridgelines and exposed rock faces,
 // surrounding an exact hole for the playable snow surface.
 const xs=[];for(let x=-4200;x<-1200;x+=80)xs.push(x);for(let x=-1200;x<-215;x+=15)xs.push(x);xs.push(-215);for(let x=-190;x<215;x+=25)xs.push(x);xs.push(215);for(let x=230;x<1200;x+=15)xs.push(x);for(let x=1200;x<=4200;x+=80)xs.push(x);
 const zs=[];for(let z=-3400;z<-900;z+=80)zs.push(z);for(let z=-900;z<-40;z+=15)zs.push(z);zs.push(-40);for(let z=-20;z<690;z+=20)zs.push(z);zs.push(690);for(let z=705;z<1800;z+=15)zs.push(z);for(let z=1800;z<=3900;z+=80)zs.push(z);
 const verts=[],cols=[],normals=[];const snow=new T.Color('#d6e4ed'),rock=new T.Color('#58666f'),rockWarm=new T.Color('#8b8074');const cache=new Map();
 function point(x,z){const key=x+','+z;if(cache.has(key))return cache.get(key);const y=rangeHeight(x,z),e=6,n=new T.Vector3(rangeHeight(x-e,z)-rangeHeight(x+e,z),e*2,rangeHeight(x,z-e)-rangeHeight(x,z+e)).normalize(),wind=noise(x*.023,z*.023),steep=1-n.y,snowAmount=T.MathUtils.clamp((.45-steep)*3.2+(y>650?.12:0)+(wind-.4)*.45,0,1),color=rock.clone().lerp(rockWarm,wind*.5).lerp(snow,snowAmount);color.multiplyScalar(.86+fbm(x*.009,z*.009)*.26);const p={x,y,z,n,color};cache.set(key,p);return p;}function tri(a,b,c){for(const p of[a,b,c]){verts.push(p.x,p.y,p.z);normals.push(p.n.x,p.n.y,p.n.z);cols.push(p.color.r,p.color.g,p.color.b);}}
 for(let j=0;j<zs.length-1;j++)for(let i=0;i<xs.length-1;i++){const x=xs[i],xx=xs[i+1],z=zs[j],zz=zs[j+1];if(x>=-215&&xx<=215&&z>=-40&&zz<=690)continue;const a=point(x,z),b=point(xx,z),c=point(x,zz),d=point(xx,zz);tri(a,c,b);tri(b,c,d);}
 const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(verts,3));geo.setAttribute('color',new T.Float32BufferAttribute(cols,3));geo.setAttribute('normal',new T.Float32BufferAttribute(normals,3));const rangeMat=new T.MeshStandardMaterial({vertexColors:true,roughness:1});rangeMat.onBeforeCompile=shader=>{shader.vertexShader='varying vec3 vRangeWorld;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <worldpos_vertex>','#include <worldpos_vertex>\nvRangeWorld=(modelMatrix*vec4(transformed,1.0)).xyz;');shader.fragmentShader='varying vec3 vRangeWorld;\n'+shader.fragmentShader;shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\nfloat rocky=1.0-smoothstep(.28,.55,dot(diffuseColor.rgb,vec3(.333)));float strata=sin(vRangeWorld.x*.19+vRangeWorld.y*.23+vRangeWorld.z*.07)*sin(vRangeWorld.y*.31-vRangeWorld.z*.11);float fleck=fract(sin(dot(floor(vRangeWorld.xz*2.0),vec2(12.9898,78.233)))*43758.5453);diffuseColor.rgb*=1.0-rocky*(.035+.045*strata+.025*fleck);');};const terrain=new T.Mesh(geo,rangeMat);terrain.receiveShadow=true;scene.add(terrain);
 const sky=new T.Mesh(new T.SphereGeometry(7800,32,16),new T.ShaderMaterial({side:T.BackSide,depthWrite:false,vertexShader:'varying vec3 vDir; void main(){vDir=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',fragmentShader:`varying vec3 vDir;void main(){vec3 d=normalize(vDir);float h=max(d.y,0.0);vec3 color=mix(vec3(.80,.88,.92),vec3(.29,.58,.79),pow(h,.42));float sun=pow(max(dot(d,normalize(vec3(-.7,.5,.25))),0.0),650.0);color+=vec3(1.0,.86,.60)*sun*.45;float streak=sin(d.x*28.0+d.z*14.0+sin(d.z*35.0)*.5);float cloud=smoothstep(.75,1.0,streak)*smoothstep(.15,.4,h)*(1.0-smoothstep(.4,.56,h));color=mix(color,vec3(.91,.94,.94),cloud*.24);gl_FragColor=vec4(color,1.0);}`}));sky.renderOrder=-100;scene.add(sky);
 const rocks=new T.InstancedMesh(new T.IcosahedronGeometry(1,1),new T.MeshStandardMaterial({color:'#7f888b',roughness:1,flatShading:true}),100);const o=new T.Object3D();let count=0;for(let i=0;i<100;i++){const side=i%2?-1:1,z=60+hash(i,17)*530,x=side*(160+hash(i,19)*45);if(routes.some(r=>Math.abs(x-pathX(z,r))<r.width+5)||Math.abs(x+30)<15)continue;const s=1+hash(i,4)*2.3;o.position.set(x,height(x,z)-.3,z);o.scale.set(s,s*.65,s*.8);o.rotation.set(i*.3,i*.8,.2);o.updateMatrix();rocks.setMatrixAt(count++,o.matrix);}rocks.count=count;rocks.castShadow=true;rocks.receiveShadow=true;scene.add(rocks);
}
function combine(geometries){const ps=[],ns=[];for(const g0 of geometries){const g=g0.toNonIndexed();ps.push(...g.attributes.position.array);ns.push(...g.attributes.normal.array);g.dispose();g0.dispose();}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(ps,3));g.setAttribute('normal',new T.Float32BufferAttribute(ns,3));return g;}
export function detailedTrees(scene,items){
 const foliage=[],snowy=[];function tri(arr,a,b,c){arr.push(...a,...b,...c);}function vertex(r,a,y){return [Math.cos(a)*r,y,Math.sin(a)*r];}
 for(let layer=0;layer<9;layer++){const r=3.25*Math.pow(1-layer/10,.8),y=2.5+layer*1.05,count=9-layer%2;for(let j=0;j<count;j++){const angle=j/count*Math.PI*2+layer*1.67,w=.34+hash(j,layer)*.09,rr=r*(.87+hash(layer,j)*.23),base=vertex(.1,angle,y+.35),left=vertex(rr*.62,angle-w,y-.16),right=vertex(rr*.62,angle+w,y-.16),tip=vertex(rr,angle,y-.55);tri(foliage,base,left,tip);tri(foliage,base,tip,right);tri(foliage,left,vertex(rr*.97,angle,y-.72),tip);tri(foliage,tip,vertex(rr*.97,angle,y-.72),right);if(hash(layer+4,j)>.42){const sb=vertex(.14,angle,y+.39),sl=vertex(rr*.44,angle-w*.75,y+.035),sr=vertex(rr*.44,angle+w*.75,y+.035),st=vertex(rr*.58,angle,y-.12);tri(snowy,sb,sl,st);tri(snowy,sb,st,sr);}}}
 function geometry(a){const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(a,3));g.computeVertexNormals();return g;}
 const barkCanvas=document.createElement('canvas');barkCanvas.width=128;barkCanvas.height=256;const bx=barkCanvas.getContext('2d');bx.fillStyle='#847261';bx.fillRect(0,0,128,256);for(let i=0;i<130;i++){bx.strokeStyle=i%2?'#665749':'#a28d74';bx.lineWidth=.5+hash(i,2)*2;bx.beginPath();const x=hash(i,3)*128,y=hash(i,4)*256;bx.moveTo(x,y);bx.lineTo(x+hash(i,7)*3,y+12+hash(i,8)*60);bx.stroke();}const bark=new T.CanvasTexture(barkCanvas);bark.colorSpace=T.SRGBColorSpace;bark.wrapT=T.RepeatWrapping;bark.repeat.y=3;
 const trunk=new T.InstancedMesh(new T.CylinderGeometry(.15,.4,9,7),new T.MeshStandardMaterial({map:bark,roughness:1}),items.length),leaves=new T.InstancedMesh(geometry(foliage),new T.MeshStandardMaterial({color:'#e3eadd',side:T.DoubleSide,roughness:1}),items.length),snow=new T.InstancedMesh(geometry(snowy),new T.MeshStandardMaterial({color:'#dce8ef',side:T.DoubleSide,roughness:.96}),items.length);const d=new T.Object3D();items.forEach((p,i)=>{const scale=p.s||1;d.position.set(p.x,p.y??height(p.x,p.z),p.z);d.scale.set(scale*(.8+hash(i,10)*.35),scale*(.85+hash(i,15)*.3),scale*(.8+hash(i,12)*.35));d.rotation.y=hash(i,33)*Math.PI*2;d.updateMatrix();leaves.setMatrixAt(i,d.matrix);snow.setMatrixAt(i,d.matrix);d.position.y+=4.5*d.scale.y;d.updateMatrix();trunk.setMatrixAt(i,d.matrix);leaves.setColorAt(i,new T.Color().setHSL(.38+hash(i,18)*.07,.23+hash(i,8)*.12,.25+hash(i,24)*.12));});leaves.castShadow=leaves.receiveShadow=snow.castShadow=true;scene.add(trunk,leaves,snow);
 const visibility=new Float32Array(items.length).fill(1);
 const visibilityAttribute=new T.InstancedBufferAttribute(visibility,1);
 visibilityAttribute.setUsage(T.DynamicDrawUsage);
 for(const mesh of [trunk,leaves,snow]){
  mesh.geometry.setAttribute('treeVisibility',visibilityAttribute);
  mesh.material.onBeforeCompile=shader=>{
   shader.vertexShader='attribute float treeVisibility; varying float vTreeVisibility;\n'+shader.vertexShader;
   shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvTreeVisibility=treeVisibility;');
   shader.fragmentShader='varying float vTreeVisibility;\n'+shader.fragmentShader;
   shader.fragmentShader=shader.fragmentShader.replace('#include <clipping_planes_fragment>', `#include <clipping_planes_fragment>
    if(vTreeVisibility < 1.0){
     float threshold=fract(52.9829189*fract(dot(gl_FragCoord.xy,vec2(.06711056,.00583715))));
     if(threshold >= vTreeVisibility) discard;
    }`);
  };
 }
 const trees=items.map(tree=>({...tree,ground:tree.y??height(tree.x,tree.z),scale:tree.s||1}));
 return {
  clearSightline(camera,skier,dt){
   const dx=skier.x-camera.x,dz=skier.z-camera.z,dy=skier.y+1.3-camera.y;
   const lengthSquared=Math.max(.001,dx*dx+dz*dz);
   const fadeBack=1-Math.exp(-dt*9);
   let changed=false;
   for(let i=0;i<trees.length;i++){
    const tree=trees[i];
    const x=tree.x-camera.x,z=tree.z-camera.z;
    const along=(x*dx+z*dz)/lengthSquared;
    const closest=T.MathUtils.clamp(along,0,1);
    const rayY=camera.y+closest*dy;
    let target=1;
    if(along<1&&rayY>tree.ground-.5&&rayY<tree.ground+13*tree.scale){
     const distance=Math.hypot(x-closest*dx,z-closest*dz);
     target=T.MathUtils.smoothstep(distance,2.9*tree.scale,4.2*tree.scale);
    }
    const current=visibility[i];
    const next=target<current?target:current+(target-current)*fadeBack;
    if(Math.abs(next-current)>.001||target===1&&current>.999&&current!==1){
     visibility[i]=next>.999?1:next;
     changed=true;
    }
   }
   if(changed)visibilityAttribute.needsUpdate=true;
  }
 };
}
export function surroundingForest(){const a=[];for(let i=0;i<2300;i++){const x=(hash(i,26)-.5)*2000,z=-300+hash(i,55)*2150;if(Math.abs(x)<215&&z>-40&&z<690)continue;const y=rangeHeight(x,z),sx=(rangeHeight(x+6,z)-rangeHeight(x-6,z))/12,sz=(rangeHeight(x,z+6)-rangeHeight(x,z-6))/12;if(y>430||y<-20||Math.hypot(sx,sz)>.7)continue;a.push({x,z,y,s:.65+hash(i,43)*.9});}return a;}



