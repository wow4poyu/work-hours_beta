// 更新網頁內容後，請把版本號 +1，使用者就會取得新版
const VER='wh3b-v1';
const FILES=['./','index.html','style.css','app.js','config.js','manifest.json','icon-180.png','icon-192.png','icon-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(VER).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==VER).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  const u=new URL(e.request.url);
  // 只處理本站檔案；後台 API（script.google.com）一律直接連網，不可快取，否則會拿到上一次的查詢結果
  if(u.origin!==self.location.origin)return;
  // config.js 優先抓最新的（改過後台網址就能馬上生效），沒網路才用舊的
  if(u.pathname.endsWith('/config.js')){
    e.respondWith(fetch(e.request,{cache:'no-store'}).then(r=>{if(r&&r.ok){const cp=r.clone();caches.open(VER).then(c=>c.put(e.request,cp))}return r}).catch(()=>caches.match(e.request,{ignoreSearch:true})));
    return;
  }
  e.respondWith(caches.match(e.request,{ignoreSearch:true}).then(hit=>{
    const net=fetch(e.request).then(r=>{if(r&&r.ok){const cp=r.clone();caches.open(VER).then(c=>c.put(e.request,cp))}return r}).catch(()=>hit||caches.match('index.html'));
    return hit||net;
  }));
});
