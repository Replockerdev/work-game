const RELEASE=47;
const CACHE='work-game-v'+RELEASE;
const ASSETS=['/','/mountain.css','/mountain.js?v='+RELEASE,'/mountain-core.js','/mountain-view.js','/mountain-environment.js','/skier-model.js','/basin-terrain.js','/vendor/three.module.js','/manifest.webmanifest','/icon.svg','/icon-192.png','/icon-512.png'];

self.addEventListener('install',event=>{
 event.waitUntil((async()=>{
  const cache=await caches.open(CACHE);
  await cache.addAll(ASSETS.map(url=>new Request(url,{cache:'reload'})));
  await self.skipWaiting();
 })());
});

self.addEventListener('activate',event=>{
 event.waitUntil((async()=>{
  for(const key of await caches.keys()){
   if(key.startsWith('work-game-')&&key!==CACHE)await caches.delete(key);
  }
  await self.clients.claim();
 })());
});

self.addEventListener('message',event=>{
 if(event.data==='work-game-release')event.source?.postMessage({type:'work-game-release',release:RELEASE});
});

self.addEventListener('fetch',event=>{
 const request=event.request;
 const url=new URL(request.url);
 if(request.method!=='GET'||url.origin!==self.location.origin)return;
 const page=request.mode==='navigate';
 if(page&&url.pathname!=='/'&&url.pathname!=='/index.html')return;
 event.respondWith((async()=>{
  const cache=await caches.open(CACHE);
  try{
   const response=await fetch(request,page?{cache:'reload'}:undefined);
   if(response.ok){
    event.waitUntil(cache.put(page?'/':request,response.clone()).catch(()=>{}));
   }
   return response;
  }catch{
   return (await cache.match(page?'/':request))||new Response('Reconnect once to prepare the mountain.',{status:503});
  }
 })());
});
