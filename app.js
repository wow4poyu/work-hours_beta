const MONTHS=['2026-09','2026-10','2026-11','2026-12','2027-01'],K='wh3b-tracker';
const ML=m=>m.slice(0,4)+'年'+(+m.slice(5))+'月';
const FD=d=>d.slice(0,4)+'年'+(+d.slice(5,7))+'月'+(+d.slice(8,10))+'日';
function seed(){return{carry:0,declared:{},todos:[],active:null,logs:[]}}
let S;try{S=JSON.parse(localStorage.getItem(K))}catch(e){}S=S||seed();
const persist=()=>{try{localStorage.setItem(K,JSON.stringify(S))}catch(e){}};
const save=()=>{try{if(S.user&&S.synced&&S.base&&syncDiff())S.dirty=true}catch(e){}persist();if(S.dirty)pushSoon()};

let tab='home',confirm=false,done=false,mode=null,im=curM(),sm=curM();
if(!semMons().includes(sm))sm=semMons()[5];
const f=n=>String(Math.round(n*100)/100);
const act=m=>S.logs.filter(l=>l.date.startsWith(m)).reduce((a,l)=>a+l.hours,0);
const win6=()=>{const n=new Date();return[-4,-3,-2,-1,0,1].map(k=>{const d=new Date(n.getFullYear(),n.getMonth()+k,1);return d.getFullYear()+'-'+pad(d.getMonth()+1)})};
function semMons(){const R=new Date(Date.now()-14*864e5),m=R.getMonth()+1;let y=R.getFullYear(),sm=m>=8?8:m>=2?2:8;if(m<2)y--;return[0,1,2,3,4,5].map(k=>{const d=new Date(y,sm-1+k,1);return d.getFullYear()+'-'+('0'+(d.getMonth()+1)).slice(-2)})}
const mons=()=>semMons();
const tot=()=>({d:S.carry+mons().reduce((a,m)=>a+(S.declared[m]||0),0),a:mons().reduce((a,m)=>a+act(m),0)});
const pad=n=>String(n).padStart(2,'0'),hm=t=>{const d=new Date(t);return pad(d.getHours())+':'+pad(d.getMinutes())};
const ld=t=>{const d=new Date(t);return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate())};
const opts=(sel)=>mons().map(m=>`<option value="${m}" ${m==sel?'selected':''}>${ML(m)}</option>`).join('');

function dev(){return `<div class="c" style="padding:40px 16px"><div class="big" style="font-size:22px">開發中</div><p class="sm">敬請期待</p></div>`}
let imp=null,impMsg='',expo=false;
function settings(){
 const p=imp,rg=p&&p.logs.length?p.logs.map(l=>l.date).sort():[];
 return `<div class="c" style="text-align:left;padding:12px 14px"><div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:8px"><b style="font-size:15px">備份與還原</b><span class="sm">匯出／匯入</span></div>
 <div class="row" style="gap:8px"><button class="sb" onclick="exportJSON()">匯出 .json</button><button class="sb" onclick="exportCSV()">匯出 .csv</button><button class="sb" onclick="document.getElementById('impf').click()">匯入檔案</button></div>
 <input type="file" id="impf" accept=".json,.csv,application/json,text/csv" style="display:none" onchange="readImp(this)">
 ${impMsg?`<p class="sm" style="margin:8px 0 0">${esc(impMsg)}</p>`:''}
 ${p?`<div style="margin-top:10px;border-top:1px solid var(--line);padding-top:10px"><div class="sm" style="line-height:1.7">檔案：${esc(p.name)}<br>打卡 <b>${p.logs.length}</b> 筆${p.dropped?`（略過 ${p.dropped} 筆舊學期）`:''}${rg.length?`・${FD(rg[0])} ～ ${FD(rg[rg.length-1])}`:''}<br>加保 <b>${Object.keys(p.declared).length}</b> 個月・上期累計 <b>${f(p.carry)}</b> hr</div><div class="row" style="gap:8px;margin-top:8px"><button class="sb ok2" onclick="applyImp('merge')">合併</button><button class="sb bad2" onclick="applyImp('replace')">覆蓋</button><button class="sb" onclick="imp=null;render()">取消</button></div></div>`:''}
 <details style="margin-top:8px"><summary class="sm" style="cursor:pointer">說明</summary><p class="sm" style="margin:6px 0 0;line-height:1.7">匯出：把紀錄存成檔案，可備份或換手機。<br>匯入：選取本 App 匯出的 .json 或 .csv，確認筆數後選擇方式。<br><b>合併</b>：保留現有資料，只新增沒有的打卡紀錄與尚未設定的月份。<br><b>覆蓋</b>：用檔案內容取代現有的打卡、加保時數與上期累計。</p></details></div>
 ${themeCard()}
 ${S.user?`<div class="c" style="text-align:left"><b>目前身分</b><div class="sm" style="margin:4px 0 10px">${esc(S.user.name)}（${esc(S.user.id)}）· 暱稱：${esc(S.user.nick||'')}<br>組別：${esc(S.user.group||'—')}${S.user.admin?' · <b style="color:var(--bad)">管理員</b>':''}<br>${syncLine()}</div><button class="gh" style="margin-bottom:10px" onclick="syncNow().then(()=>render())">立即同步</button><button class="gh" onclick="if(confirm_('登出後需要重新驗證學號，打卡紀錄不會被刪除。確定登出？')){S.user=null;save();render()}">登出</button></div>`:''}<button class="c" style="text-align:left;color:var(--bad);border-color:var(--bad)" onclick="resetLocal()">清除本機資料並重新從雲端同步<div class="sm" style="margin-top:4px;color:var(--mu)">只清除這支手機的資料，雲端紀錄不會被刪除；資料有問題時用這個。</div></button>
 <div class="foot">於 ${S.first.replace(/-/g,'.')} 首次使用<br>版本：beta.1<hr>開發者：PoYu</div>`}
function dl(name,text,type){try{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([text],{type}));a.download=name;document.body.appendChild(a);a.click();a.remove()}catch(e){alert('匯出失敗，請用手機瀏覽器或已安裝的 App 開啟')}}
function exportJSON(){dl('上班時數備份_'+ld(Date.now())+'.json',JSON.stringify({app:'work-hours',v:1,exported:new Date().toISOString(),data:{carry:S.carry,declared:S.declared,logs:S.logs}},null,1),'application/json')}
function exportCSV(){const rows=[['學號','日期','上班','下班','完成時數']];S.logs.slice().sort((a,b)=>a.date<b.date?-1:1).forEach(l=>rows.push([S.user?S.user.id:'',l.date,l.start||'',l.end||'',l.hours]));rows.push([],['月份','加保時數'],['上期累計',S.carry]);Object.keys(S.declared).sort().forEach(m=>rows.push([m,S.declared[m]]));
 dl('上班時數_'+ld(Date.now())+'.csv','\ufeff'+rows.map(r=>r.join(',')).join('\r\n'),'text/csv;charset=utf-8')}
function parseImp(txt,name){txt=txt.replace(/^\ufeff/,'').trim();let carry=0,dec={},logs=[];
 if(txt[0]=='{'||txt[0]=='['){const j=JSON.parse(txt),d=j.data||j;carry=+d.carry||0;dec=d.declared||{};logs=d.logs||[]}
 else{let m=0,o=0;txt.split(/\r?\n/).map(l=>l.split(',').map(c=>c.trim())).forEach(r=>{if(r[0]=='日期'||r[0]=='學號'){m=1;o=r[0]=='學號'?1:0;return}if(r[0]=='月份'){m=2;return}if(!r[0])return;
  if(m==1)logs.push({date:r[o],start:r[o+1]||undefined,end:r[o+2]||undefined,hours:parseFloat(r[o+3])});
  else if(m==2){if(r[0]=='上期累計')carry=parseFloat(r[1])||0;else dec[r[0]]=parseFloat(r[1])}})}
 const okD=/^\d{4}-\d{2}-\d{2}$/,d2={};
 logs=logs.filter(l=>l&&okD.test(l.date)&&l.hours!==''&&l.hours!==null&&isFinite(l.hours)&&+l.hours>=0).map((l,i)=>({id:l.id||'i'+l.date+(l.start||'')+i,date:l.date,...(l.start?{start:l.start,end:l.end}:{}),hours:+l.hours}));
 Object.keys(dec).forEach(k=>{if(/^\d{4}-\d{2}$/.test(k)&&dec[k]!==''&&dec[k]!==null&&isFinite(dec[k]))d2[k]=+dec[k]});
 const cut=semMons()[0]+'-01',n0=logs.length;logs=logs.filter(l=>l.date>=cut);const dropped=n0-logs.length;
 if(!logs.length&&!Object.keys(d2).length&&!carry)throw new Error('找不到可匯入的資料，請確認檔案是本 App 匯出的備份檔');
 return{carry:isFinite(carry)?carry:0,declared:d2,logs,name,dropped}}
function readImp(el){const f=el.files[0];if(!f)return;const r=new FileReader();
 r.onload=()=>{try{imp=parseImp(String(r.result),f.name);impMsg=''}catch(e){imp=null;impMsg='⚠️ '+(e instanceof SyntaxError?'檔案格式不正確，無法讀取':e.message)}el.value='';render()};
 r.onerror=()=>{impMsg='⚠️ 讀取檔案失敗';render()};r.readAsText(f)}
function applyImp(md){if(!imp)return;let n=0;
 if(md=='replace'){if(!confirm_('覆蓋會取代目前所有打卡、加保時數與上期累計，確定嗎？'))return;S.logs=imp.logs;S.declared=imp.declared;S.carry=imp.carry;n=imp.logs.length}
 else{const k=l=>l.date+'|'+(l.start||'')+'|'+(l.end||'')+'|'+l.hours,have=new Set(S.logs.map(k)),ids=new Set(S.logs.map(l=>l.id));
  imp.logs.forEach(l=>{if(have.has(k(l)))return;have.add(k(l));if(ids.has(l.id))l={...l,id:l.id+'_'+Date.now()+n};S.logs.push(l);n++});
  Object.keys(imp.declared).forEach(m=>{if(!(m in S.declared))S.declared[m]=imp.declared[m]});if(!S.carry&&imp.carry)S.carry=imp.carry}
 save();impMsg='✅ 匯入完成'+(md=='replace'?'（覆蓋）':'（合併）')+'：新增 '+n+' 筆打卡紀錄';imp=null;render()}
let anim=false;
function navShape(){const n=document.querySelector('nav');if(!n)return;const w=n.offsetWidth,H=84,bh=20,bw=40,r=22,cx=w/2,
 d=`M${r},${bh}L${cx-bw-14},${bh}C${cx-bw+6},${bh} ${cx-bw+6},0 ${cx},0C${cx+bw-6},0 ${cx+bw-6},${bh} ${cx+bw+14},${bh}L${w-r},${bh}A${r},${r} 0 0 1 ${w},${bh+r}L${w},${H-r}A${r},${r} 0 0 1 ${w-r},${H}L${r},${H}A${r},${r} 0 0 1 0,${H-r}L0,${bh+r}A${r},${r} 0 0 1 ${r},${bh}Z`;
 document.getElementById('navbg').style.clipPath=`path('${d}')`;
 document.getElementById('navsvg').innerHTML=`<defs><linearGradient id="ng" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".6"/><stop offset="1" stop-color="#fff" stop-opacity=".12"/></linearGradient></defs><path d="${d}" fill="none" style="stroke:var(--line)" stroke-width="1"/><path d="${d}" fill="none" stroke="url(#ng)" stroke-width="1.2"/>`}
function pillMove(){navShape();const b=document.querySelector('nav button.on'),p=document.getElementById('pill');if(!b||!p)return;if(b.dataset.t=='home'){p.style.opacity=0;return}p.style.opacity=1;p.style.width=b.offsetWidth+'px';p.style.transform='translateX('+b.offsetLeft+'px)'}
window.addEventListener('resize',pillMove);
let tk=0;
function fx(pg){const v=document.getElementById('v');if(v&&pg){v.style.scrollBehavior='auto';v.scrollTop=0;v.style.scrollBehavior=''}}
function scrollFx(){const v=document.getElementById('v');if(v)window.__sy=v.scrollTop}
document.getElementById('v')?.addEventListener?.('scroll',()=>{if(!tk){tk=1;requestAnimationFrame(()=>{tk=0;scrollFx()})}},{passive:true});

// ===== 登入 =====
// API 網址改放在 config.js
const DEMO={S0001:['王小明','','櫃檯'],S0002:['陳美玲','','期刊'],S0003:['林志豪','','期刊'],S0004:['張雅婷','','SSS'],S0005:['李佳穎','','櫃檯'],S0006:['黃冠宇','','期刊']};
const LG0=()=>({id:'',name:'',res:'',nick:'',group:'',admin:false,hasPin:false,pin:'',pin2:'',busy:false,msg:'',step:1,note:''});
let lg=LG0();
function demoAdm(b){const ms=semMons(),c=curM();
 if(b.op=='overview')return{ok:true,months:ms,now:Date.now(),duty:[{id:'S0001',name:'王小明',group:'櫃檯',start:Date.now()-5*36e5,seen:Date.now()}],people:[['S0001','王小明','櫃檯',20,12,true],['S0002','陳美玲','期刊',20,21,false],['S0003','林志豪','期刊',16,6,false],['S0004','張雅婷','SSS',10,10,false]].map(x=>({id:x[0],name:x[1],group:x[2],nick:'',admin:x[2]=='SSS',hasPin:true,carry:0,declared:{[c]:x[3]},actual:{[c]:x[4]},on:x[5]}))};
 if(b.op=='person')return{ok:true,id:b.target,name:'示範人員',group:'櫃檯',nick:'',hasPin:true,months:ms,carry:0,declared:{[c]:20},logs:[{row:2,date:c+'-05',start:'09:00',end:'12:00',hours:3}]};
 if(b.op=='ann_list')return{ok:true,items:[],presets:['⚠️請盡快填寫出勤表']};
 if(b.op=='task_list')return{ok:true,items:[]};
 return{ok:true}}
function demoCall(b){const a=b.action;
 if(a=='login'||a=='register'||a=='me'){const d=DEMO[String(b.id||'').toUpperCase()];return d?{ok:true,found:true,saved:true,name:d[0],nick:b.nick||(S.user&&S.user.nick)||'',group:d[2],admin:d[2]=='SSS'}:{ok:false,err:'nouser'}}
 if(a=='pull')return{ok:true,found:true,logs:[],hasRow:false,months:[]};
 if(a=='config')return{ok:true,ann:[],rules:[],tasks:[]};
 if(a=='adm')return demoAdm(b);
 return{ok:true,saved:true}}
// 公開查詢（只有 lookup，不含 PIN）
async function api(q){
 if(!API){await new Promise(r=>setTimeout(r,350));const d=DEMO[String(q.id||'').trim().toUpperCase()];return d?{ok:true,found:true,name:d[0],nick:'',group:d[2],admin:d[2]=='SSS',hasPin:false}:{ok:true,found:false}}
 const c=new AbortController(),t=setTimeout(()=>c.abort(),12000);
 try{const r=await fetch(API+'?'+new URLSearchParams({...q,_:Date.now()}),{signal:c.signal,cache:'no-store'});return await r.json()}finally{clearTimeout(t)}}
// 需要驗證的呼叫：一律 POST，附上學號與 PIN；PIN 失效時自動登出
async function call(body){
 if(!API){await new Promise(r=>setTimeout(r,200));return demoCall(body)}
 const u=S.user,pre=body.action=='login'||body.action=='register',j=await post({...body,id:pre?body.id:(u&&u.id),pin:pre?body.pin:(u&&u.pin)});
 if(j&&!j.ok&&S.user&&['pin','nopin','nouser'].includes(j.err)&&body.action!=='login'&&body.action!=='register')kickOut(j.err);
 return j}
function kickOut(err){S.user=null;lg=LG0();lg.note=err=='nouser'?'帳號已從名單移除，請重新驗證學號':'PIN 已變更或被重設，請重新登入';persist();render()}
const loginErr=j=>!j?'無法連線，請檢查網路後再試':j.err=='pin'?'PIN 錯誤，還有 '+j.left+' 次機會':j.err=='locked'?'錯誤次數過多，已鎖定 10 分鐘，請稍後再試或洽管理員':j.err=='nopin'?'此帳號的 PIN 已被重設，請設定新的 PIN':j.err=='haspin'?'此帳號已設定過 PIN，請改輸入 PIN 登入':j.err=='busy'?'系統忙碌，請再試一次':'登入失敗，請稍後再試或洽管理員';
function loginGate(){const L=!S.user;document.body.classList.toggle('login',L);if(!L)return false;
 document.getElementById('h').textContent='Welcome';const v=document.getElementById('v');v.className='';v.innerHTML=loginView();return true}
const pinIn=(id,key,ph)=>`<input id="${id}" class="pin" type="password" inputmode="numeric" autocomplete="off" maxlength="4" placeholder="${ph}" value="${esc(lg[key])}" oninput="this.value=this.value.replace(/\\D/g,'');lg.${key}=this.value" onkeydown="if(event.key=='Enter')${lg.hasPin?'doLogin':'doRegister'}()">`;
function loginView(){
 const b=lg.busy,hint=API?'':'<p class="sm" style="margin:12px 0 0">示範模式（尚未連接後台）：可用學號 S0001 測試；S0004 為管理員</p>';
 const back=`<button class="gh" style="margin-top:12px" ${b?'disabled':''} onclick="lg=LG0();render()">← 重新輸入學號</button>`,msg=lg.msg?`<p class="sm" style="color:var(--bad);margin:0 0 10px;text-align:center">${esc(lg.msg)}</p>`:'';
 if(lg.step==2&&lg.hasPin)return `<div class="c" style="text-align:left"><div class="t" style="text-align:center">步驟 2／2：輸入 PIN</div><div class="lg-name" style="text-align:center">${esc(lg.name)}</div>
  <label>4 位數 PIN</label>${pinIn('lpin','pin','••••')}${msg}
  <button class="pri" style="font-size:16px;padding:13px" ${b?'disabled':''} onclick="doLogin()">${b?'驗證中…':'登入'}</button><p class="sm" style="margin:10px 0 0;text-align:center">忘記 PIN？請洽管理員重設</p>${back}</div>`;
 if(lg.step==2)return `<div class="c" style="text-align:left"><div class="t" style="text-align:center">步驟 2／2：設定暱稱與 PIN</div><div class="lg-name" style="text-align:center">${esc(lg.name)}</div>
  <label>暱稱</label><input id="lnick" type="text" maxlength="12" placeholder="例如 PoYu" value="${esc(lg.nick)}" oninput="lg.nick=this.value">
  <label>設定 4 位數 PIN</label>${pinIn('lpin','pin','••••')}<label>再輸入一次 PIN</label>${pinIn('lpin2','pin2','••••')}
  <p class="sm" style="margin:0 0 10px">之後在其他裝置登入需要輸入這組 PIN；忘記請洽管理員重設。</p>${msg}
  <button class="pri" style="font-size:16px;padding:13px" ${b?'disabled':''} onclick="doRegister()">${b?'儲存中…':'完成設定'}</button>${back}</div>`;

 let res='';
 if(lg.res=='found')res=`<div style="margin-top:14px;border-top:1px solid var(--line);padding-top:14px;text-align:center"><div class="sm">姓名</div><div class="lg-name">${esc(lg.name)}</div><div class="row"><button class="gh" onclick="lg=LG0();render()">取消</button><button class="pri" style="font-size:16px;padding:13px" onclick="lg.step=2;lg.msg='';render()">確認</button></div></div>`;
 else if(lg.res=='none')res=`<div style="margin-top:14px;border-top:1px solid var(--line);padding-top:14px;text-align:center"><div style="color:var(--bad);font-weight:600">查無此人</div><p class="sm" style="margin:6px 0 12px">請再試一次，或聯絡管理員</p><button class="lb" onclick="lg=LG0();render()">再試一次</button></div>`;
 else if(lg.res=='err')res=`<div style="margin-top:14px;border-top:1px solid var(--line);padding-top:14px;text-align:center"><div style="color:var(--bad);font-weight:600">無法連線</div><p class="sm" style="margin:6px 0 12px">請檢查網路後再試一次，或聯絡管理員</p><button class="lb" onclick="lg.res='';render()">再試一次</button></div>`;
 return `<div class="c" style="text-align:left"><div class="t" style="text-align:center">步驟 1／2：驗證身分</div>${lg.note?`<p class="sm" style="color:var(--dec);text-align:center;margin:0 0 10px">${esc(lg.note)}</p>`:''}<label>學號</label>
  <input id="lid" type="text" autocapitalize="characters" autocomplete="off" inputmode="text" placeholder="請輸入學號" value="${esc(lg.id)}" ${b||lg.res=='found'?'readonly':''} onkeydown="if(event.key=='Enter')doLookup()">
  ${lg.res?'':`<button class="pri" style="font-size:16px;padding:13px" ${b?'disabled':''} onclick="doLookup()">${b?'查詢中…':'查詢'}</button>`}${res}${hint}</div>`}
async function doLookup(){const id=document.getElementById('lid').value.trim();if(!id)return;lg.id=id;lg.note='';lg.busy=true;lg.res='';render();
 try{const j=await api({action:'lookup',id});lg.res=j&&j.ok?(j.found?'found':'none'):'err';lg.name=(j&&j.name)||'';lg.nick=(j&&j.nick)||'';lg.group=(j&&j.group)||'';lg.admin=!!(j&&j.admin);lg.hasPin=!!(j&&j.hasPin)}catch(e){lg.res='err'}
 lg.busy=false;render()}
async function doLogin(){const pin=(lg.pin||'').trim();if(!/^\d{4}$/.test(pin)){lg.msg='請輸入 4 位數 PIN';render();return}lg.busy=true;lg.msg='';render();
 try{const j=await call({action:'login',id:lg.id,pin});if(j&&j.ok&&j.found)return finishLogin(j,pin);lg.msg=loginErr(j);if(j&&j.err=='nopin'){lg.hasPin=false}}catch(e){lg.msg=loginErr(null)}
 lg.pin='';lg.pin2='';lg.busy=false;render()}
async function doRegister(){const nick=(lg.nick||'').trim().replace(/^[=+\-@\s]+/,'').slice(0,12),pin=(lg.pin||'').trim();
 if(!nick){lg.msg='請輸入暱稱';render();return}if(!/^\d{4}$/.test(pin)){lg.msg='PIN 必須是 4 位數字';render();return}if(pin!==lg.pin2){lg.msg='兩次輸入的 PIN 不一致';render();return}
 lg.busy=true;lg.msg='';render();
 try{const j=await call({action:'register',id:lg.id,nick,pin});if(j&&j.ok&&j.saved)return finishLogin(j,pin,nick);lg.msg=loginErr(j);if(j&&j.err=='haspin')lg.hasPin=true}catch(e){lg.msg=loginErr(null)}
 lg.pin='';lg.pin2='';lg.busy=false;render()}
function finishLogin(j,pin,nick){const uid=lg.id.trim().toUpperCase();
 if(S.uid&&S.uid!==uid){S.carry=0;S.declared={};S.logs=[];S.todos=[];S.active=null;S.presOn=false}
 S.uid=uid;S.synced=false;S.dirty=false;S.base=null;S.user={id:uid,name:j.name||lg.name,nick:j.nick||nick||'',group:j.group||lg.group,admin:!!j.admin,pin};
 TASKS=[];RULES=[];ADM=ADM0();cfgSave();persist();lg=LG0();go('home');if(!S.user.admin){syncNow();loadCfg()}}
// ===== 雲端同步（Google 試算表 ⇄ App）=====
// 原則：只傳「上次同步之後有變動的項目」，所以你在試算表改的其他資料不會被覆蓋。
const lk=l=>[l.date,l.start||'',l.end||'',String(+l.hours)].join('|');
const cutDate=()=>semMons()[0]+'-01';
let syncBusy=false,pushT=null;
function snap(){const m={};(S.logs||[]).forEach(l=>{const k=lk(l);m[k]=(m[k]||0)+1});return{carry:+S.carry||0,declared:{...(S.declared||{})},logs:m}}
function syncDiff(){const b=S.base;if(!b)return null;const n=snap(),adds=[],dels=[],dec={};let carry;
 new Set([...Object.keys(n.logs),...Object.keys(b.logs||{})]).forEach(k=>{const d=(n.logs[k]||0)-((b.logs||{})[k]||0),p=k.split('|');
  for(let i=0;i<Math.abs(d);i++){if(d>0)adds.push({date:p[0],start:p[1],end:p[2],hours:+p[3]});else dels.push(k)}});
 new Set([...Object.keys(n.declared),...Object.keys(b.declared||{})]).forEach(k=>{const nv=n.declared[k],bv=(b.declared||{})[k];if(nv!==bv)dec[k]=nv===undefined?null:nv});
 if(n.carry!==(+b.carry||0))carry=n.carry;
 return adds.length||dels.length||Object.keys(dec).length||carry!==undefined?{adds,dels,dec,carry}:null}
async function post(body){const c=new AbortController(),t=setTimeout(()=>c.abort(),25000);
 try{const r=await fetch(API,{method:'POST',body:JSON.stringify(body),headers:{'Content-Type':'text/plain;charset=utf-8'},signal:c.signal,cache:'no-store',redirect:'follow'});return await r.json()}finally{clearTimeout(t)}}
function applyServer(j,first){
 const cut=cutDate(),srv=(j.logs||[]).filter(l=>l&&l.date>=cut&&isFinite(l.hours)).map((l,i)=>({id:'s'+i+'_'+l.date+(l.start||''),date:l.date,...(l.start?{start:l.start}:{}),...(l.end?{end:l.end}:{}),hours:+l.hours}));
 const sd={};if(j.hasRow)(j.months||[]).forEach(k=>{if(j.declared&&k in j.declared)sd[k]=j.declared[k]});
 if(first){
  const bl={},cnt={};srv.forEach(l=>{const k=lk(l);bl[k]=(bl[k]||0)+1});S.logs.forEach(l=>{const k=lk(l);cnt[k]=(cnt[k]||0)+1});
  srv.forEach(l=>{const k=lk(l);if(cnt[k]>0)cnt[k]--;else S.logs.push(l)});
  const sc=j.hasRow&&j.carry?+j.carry:0;S.declared={...S.declared,...sd};if(sc)S.carry=sc;
  S.base={carry:sc,declared:sd,logs:bl};
 }else{
  S.logs=srv;
  if(j.hasRow){if(j.carry!=null)S.carry=+j.carry;(j.months||[]).forEach(k=>{if(k in sd)S.declared[k]=sd[k];else delete S.declared[k]})}
  S.base=snap();
 }
 persist()}
async function doPush(d){const s=snap();const j=await call({action:'push',adds:d.adds,dels:d.dels,dec:d.dec,carry:d.carry});if(!(j&&j.ok&&j.saved))throw 0;S.base=s;persist()}
async function refreshUser(){try{const j=await call({action:'me'});if(!S.user)return'out';if(!j||!j.ok||j.found===false)return;
 const u=S.user,n={name:j.name||u.name,nick:j.nick||'',group:j.group||'',admin:!!j.admin};
 if(n.name!==u.name||n.nick!==(u.nick||'')||n.group!==(u.group||'')||n.admin!==!!u.admin){Object.assign(u,n);persist()}}catch(e){}}
async function syncNow(){if(!API||!S.user||syncBusy)return;syncBusy=true;const before=JSON.stringify(snap()),ub=JSON.stringify(S.user);
 try{
  if(await refreshUser()==='out')return;
  if(S.user.admin)return;
  if(!S.synced){const j=await call({action:'pull'});if(!(j&&j.ok&&j.found))throw 0;applyServer(j,true);S.synced=true;persist()}
  const d=syncDiff();if(d)await doPush(d);
  if(!syncDiff()){const j=await call({action:'pull'});if(!(j&&j.ok&&j.found))throw 0;if(!syncDiff())applyServer(j,false)}
  S.lastSync=Date.now();S.dirty=!!syncDiff();persist()
 }catch(e){S.dirty=!!(S.synced&&syncDiff());persist()}
 try{if(S.user&&!S.user.admin&&(S.active||S.presOn)){const j=await call({action:'presence',on:!!S.active,start:S.active&&S.active.start});if(j&&j.ok){S.presOn=!!S.active;persist()}}}catch(e){}
 finally{syncBusy=false}
 if(JSON.stringify(snap())!==before||JSON.stringify(S.user)!==ub){const a=document.activeElement;if(!(a&&/^(INPUT|SELECT|TEXTAREA)$/.test(a.tagName)))render()}}
function pushSoon(){clearTimeout(pushT);pushT=setTimeout(syncNow,1200)}
function syncLine(){if(!API)return'雲端同步：示範模式（未連接）';return'雲端同步：'+(S.dirty?'<b style="color:var(--dec)">待上傳（連上網路會自動重試）</b>':'已同步')+(S.lastSync?'（'+hm(S.lastSync)+'）':'')}
addEventListener('online',()=>syncNow());
document.addEventListener('visibilitychange',()=>{if(!document.hidden)syncNow()});
setInterval(()=>{if(!document.hidden){syncNow();if(isAdm()&&tab=='home')admLoad('home')}},60000);
const IC={set:'M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.488.488 0 0 0-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 0 0-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z',dev:'M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7z',home:'M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z',inp:'M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a.996.996 0 0 0 0-1.41l-2.34-2.34a.996.996 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z',st:'M5 9.2h3V19H5zM10.6 5h2.8v14h-2.8zm5.6 8H19v6h-2.8z',ann:'M18 11v2h4v-2h-4zm-2 6.61c.96.71 2.21 1.65 3.2 2.39.4-.53.8-1.07 1.2-1.6-.99-.74-2.24-1.68-3.2-2.4-.4.54-.8 1.08-1.2 1.61zM20.4 5.6c-.4-.53-.8-1.07-1.2-1.6-.99.74-2.24 1.68-3.2 2.4.4.53.8 1.07 1.2 1.6.96-.72 2.21-1.65 3.2-2.4zM4 9c-1.1 0-2 .9-2 2v2c0 1.1.9 2 2 2h1v4h2v-4h1l5 3V6L8 9H4zm11.5 3c0-1.33-.58-2.53-1.5-3.35v6.69c.92-.81 1.5-2.01 1.5-3.34z',ppl:'M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z',task:'M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-9 14l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z'};
const NAVS={u:[['settings','設定','set'],['dev','開發中','dev'],['home','首頁','home'],['input','輸入','inp'],['stats','統計','st']],a:[['settings','設定','set'],['ann','公告','ann'],['home','總覽','home'],['staff','人員','ppl'],['tasks','任務','task']]};
let navRole=null;
function buildNav(){const r=isAdm()?'a':'u';if(!NAVS[r].some(x=>x[0]==tab))tab='home';if(navRole===r)return;navRole=r;const n=document.querySelector('nav');n.querySelectorAll('button').forEach(b=>b.remove());NAVS[r].forEach(x=>n.insertAdjacentHTML('beforeend',`<button data-t="${x[0]}"><svg viewBox="0 0 24 24"><path d="${IC[x[2]]}"/></svg><span>${x[1]}</span></button>`))}
function go(t){tab=t;mode=null;editId=null;edKeep=null;edDraft=null;anim=true;expo=false;imp=null;impMsg='';render();if(isAdm())admLoad(t)}
function render(){
 if(typeof loginGate=='function'&&loginGate())return;
 buildNav();document.querySelectorAll('nav button').forEach(b=>{b.className=b.dataset.t==tab?'on':'';b.onclick=()=>{if(b.dataset.t=='staff'){ADM.sel=null;ADM.ed=null}go(b.dataset.t)}});
 {const T0=(isAdm()?{home:'Overview',staff:'Staff',ann:'Announcements',tasks:'Tasks',settings:'Settings'}:{home:'Work Hours',input:'Manual Input',stats:'Statistics',settings:'Settings',dev:'In Development'})[tab];document.getElementById('h').innerHTML=esc(T0)+(tab=='home'&&S.user?'<span class="nick">'+esc(S.user.nick||S.user.name)+'</span>':'')}const v=document.getElementById('v');const pg=anim;v.className=(pg?'pg':'');anim=false;v.innerHTML=(isAdm()?{home:admHome,staff:admStaff,ann:admAnn,tasks:admTasks,settings:admSettings}:{home,input,stats,settings,dev})[tab]();tick();pillMove();fx(pg)}
function tick(){sync();{const ms=S.active?Date.now()-S.active.start:0,mm=Math.max(0,Math.floor(ms/6e4)),w=document.getElementById('wk'),w2=document.getElementById('wk2');if(S.active&&w)w.textContent='已 '+Math.floor(mm/60)+' 小時 '+(mm%60)+' 分 · 目前結算 '+f(calc(ms))+' hr';if(S.active&&w2)w2.textContent='本次結算：'+f(calc(ms))+' hr（已打卡 '+Math.floor(mm/60)+' 小時 '+(mm%60)+' 分）'}const e=document.getElementById('clk');if(e){const d=new Date();e.innerHTML=`<div class="big">${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}</div><div class="sm">${d.getFullYear()}年${d.getMonth()+1}月${d.getDate()}日 週${'日一二三四五六'[d.getDay()]}</div>`}}
setInterval(tick,1000);
function home(){
 let h='<div class="c" id="clk"></div>',a=S.active;
 if(!a){h+=done?`<div class="c pri" style="cursor:default">下班囉</div>`:`<button class="pri" onclick="inn()">上班</button>`;
  if(done){const td=ld(Date.now()),L=S.logs.filter(l=>l.date==td);
   h+=`<div class="c"><div class="t">打卡時間紀錄</div>${L.map(l=>`<div class="li"><span>${FD(l.date)}${l.start?` <span class="sm">${rng(l)}</span>`:''}</span><b>${f(l.hours)} hr</b></div>`).join('')||'<p class="sm">今天尚無紀錄</p>'}</div><p class="sm" style="text-align:center;margin:0">6 秒後自動回到首頁</p><button class="lb" onclick="done=false;render()">回到首頁</button>`}
  else{h+=annCard()+taskCard()}}
 else{h+=confirm?`<div class="c"><div class="t">下班？</div><div class="sm" id="wk2" style="margin:-2px 0 10px"></div><div class="row"><button class="bad" onclick="out()">確定下班</button><button class="gh" onclick="confirm=false;render()">取消</button></div></div>`
  :`<button class="pri" style="background:var(--s1);color:var(--ok);border-color:var(--ok)" onclick="confirm=true;render()">● 上班中 · ${hm(a.start)} 起<span id="wk" style="display:block;font-size:13px;font-weight:500;color:var(--mu);margin-top:3px"></span></button>`;
  h+=(Date.now()-a.start>12*36e5?fgtCard():'')+`<div class="c"><div class="t">待辦事項</div>${TASKS.length?taskRows()+'<hr class="sep">':''}${S.todos.map((t,i)=>`<div class="li"><span style="${t.d?'text-decoration:line-through;opacity:.6':''}" data-act="tdt" data-id="${i}">${t.d?'☑':'☐'} ${esc(t.t)}</span><button class="x gh" data-act="tdx" data-id="${i}">✕</button></div>`).join('')}
   <div class="row" style="margin-top:8px"><input id="td" placeholder="新增待辦…" style="margin:0;flex:3"><button style="flex:1" onclick="addT()">＋</button></div></div>`+annCard()}
 return h}
const esc=s=>s.replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function addT(){const i=document.getElementById('td');if(i.value.trim()){S.todos.push({t:i.value.trim(),d:false});save();render()}}
// ===== 後台設定：公告、待辦推送規則、指派任務（來自 Google 試算表）=====
let ANN=[],RULES=[],TASKS=[],annOpen={};
(function(){try{const c=JSON.parse(localStorage.getItem('wh3b-cfg'));if(c){ANN=c.ann||[];RULES=c.rules||[];TASKS=c.tasks||[]}}catch(e){}})();
const cfgSave=()=>{try{localStorage.setItem('wh3b-cfg',JSON.stringify({ann:ANN,rules:RULES,tasks:TASKS}))}catch(e){}};
const busyEl=()=>{const a=document.activeElement;return a&&/^(INPUT|SELECT|TEXTAREA)$/.test(a.tagName)};
async function loadCfg(){if(!API)return;
 try{if(!S.user||S.user.admin)return;const j=await call({action:'config'});
  if(j&&j.ok&&Array.isArray(j.ann)){
   const a=j.ann.filter(x=>x&&x.t).map(x=>({pin:!!x.pin,t:String(x.t),note:x.note?String(x.note):''})),
    rl=(j.rules||[]).filter(r=>r&&Array.isArray(r.d)&&Array.isArray(r.items)),tk=(j.tasks||[]).map(String);
   if(JSON.stringify([a,rl,tk])===JSON.stringify([ANN,RULES,TASKS]))return;
   ANN=a;RULES=rl;TASKS=tk;annOpen={};cfgSave();if(tab=='home'&&S.user&&!busyEl())render();return}
  }catch(e){}}
document.addEventListener?.('visibilitychange',()=>{if(!document.hidden)loadCfg()});
setInterval(()=>{if(!document.hidden)loadCfg()},300000);
function annTog(i){annOpen[i]=!annOpen[i];render()}
function annHTML(){return ANN.length?ANN.map((x,i)=>`<div class="an${x.note?' hn':''}"${x.note?` onclick="annTog(${i})"`:''}><div class="ar"><span>${x.pin?'📌 ':''}${esc(x.t)}</span>${x.note?`<span class="ch">${annOpen[i]?'▾':'▸'}</span>`:''}</div>${x.note&&annOpen[i]?`<div class="nt">${esc(x.note)}</div>`:''}</div>`).join(''):'<p class="sm" style="text-align:center;margin:8px 0">目前沒有公告</p>'}
const annCard=()=>`<div class="c ann" style="text-align:left"><div class="t" style="text-align:center">公告欄</div>${annHTML()}</div>`;
const taskRows=()=>TASKS.map(t=>`<div class="li"><span>🔸 ${esc(t)}</span></div>`).join('');
const taskCard=()=>TASKS.length?`<div class="c ann" style="text-align:left"><div class="t" style="text-align:center">指派任務</div>${taskRows()}</div>`:'';
// 待辦推送：依組別規則（星期＋時段，含開始、不含結束）決定現在該有哪些待辦
const EARLY=14;   // 打卡寬限（分鐘）：時段開始前 14 分鐘起就算該時段，例如 19:00-21:00 → 18:46～20:45 打卡都會收到
const nowHits=(early)=>{const n=new Date(),m=n.getHours()*60+n.getMinutes()+(early?EARLY:0),d=n.getDay(),h=[];RULES.forEach((r,i)=>{if(r.d.includes(d)&&m>=r.s&&m<r.e)h.push(i)});return h};
const ruleItems=h=>{const o=[];h.forEach(i=>RULES[i].items.forEach(t=>{if(!o.includes(t))o.push(t)}));return o};
function inn(){if(!guard())return;const h=nowHits(true);S.todos=ruleItems(h).map(t=>({t,d:false}));S.lastP=nowHits().join(',');S.active={start:Date.now()};confirm=false;done=false;save();render();pushSoon()}
function sync(){if(!S.active)return;const h=nowHits(),k=h.join(',');if(k===S.lastP)return;S.lastP=k;let add=0;ruleItems(h).forEach(t=>{if(!S.todos.some(x=>x.t===t)){S.todos.push({t,d:false});add++}});save();if(add&&tab=='home'&&!busyEl())render()}
let _g=0;const guard=()=>{if(_g)return false;_g=1;setTimeout(()=>_g=0,900);return true};
let doneT=0,editId=null,edKeep=null,edDraft=null;
function curM(){const d=new Date();return d.getFullYear()+'-'+('0'+(d.getMonth()+1)).slice(-2)}
const curTheme=()=>{try{return localStorage.getItem('wh3b-theme')||''}catch(e){return''}};
function applyTheme(){const t=curTheme(),h=document.documentElement;if(!h||!h.removeAttribute)return;h.removeAttribute('data-theme');if(t)h.setAttribute('data-theme',t)}
function setTheme(t){try{t?localStorage.setItem('wh3b-theme',t):localStorage.removeItem('wh3b-theme')}catch(e){}applyTheme();render()}
applyTheme();
const rng=l=>l.start+'–'+(l.end&&l.end<l.start?'次日 ':'')+l.end;
const hOpts=(max,sel)=>'<option value="">時</option>'+Array.from({length:max+1},(_,i)=>`<option value="${i}"${sel===i?' selected':''}>${pad(i)}</option>`).join('');
const mOpts=sel=>'<option value="">分</option>'+[0,30].map(m=>`<option value="${m}"${sel===m?' selected':''}>${pad(m)}</option>`).join('');
const pr=t=>{const m=/^(\d{1,2}):(\d{2})$/.exec(t||'');return m&&(+m[2]==0||+m[2]==30)?{h:+m[1],m:+m[2]}:null};
function timeCalc(){const g=i=>document.getElementById(i).value,a=g('tsh'),b=g('tsm'),c=g('teh'),d=g('tem');
 if(a===''||b===''||c===''||(d===''&&c!='24'))return;let df=(+c*60+(c=='24'?0:+d))-(+a*60+ +b);if(df<=0)df+=1440;document.getElementById('lh').value=f(calc(df*6e4))}
const fgtCard=()=>`<div class="c" style="text-align:left;border-color:var(--dec)"><div class="t" style="color:var(--dec);text-align:left">⚠️ 已連續打卡超過 12 小時，是否忘記下班？</div><label>實際下班時間</label><div class="row"><select id="fh">${hOpts(24)}</select><select id="fm">${mOpts()}</select></div><button class="pri" style="font-size:16px;padding:13px" onclick="fixOut()">補登下班時間</button><p class="sm" style="margin:8px 0 0">若確實一直在上班，直接按上方「上班中」按鈕下班即可。</p></div>`;
function fixOut(){const h=document.getElementById('fh').value,m=document.getElementById('fm').value;if(h===''||(m===''&&h!='24'))return alert('請選擇實際下班的「時」與「分」');
 const s=new Date(S.active.start);let e=new Date(s.getFullYear(),s.getMonth(),s.getDate(),+h,h=='24'?0:+m,0,0);if(e.getTime()<=S.active.start)e=new Date(e.getTime()+864e5);
 if(e.getTime()>Date.now())return alert('下班時間不能晚於現在');if(!confirm_('補登下班時間 '+hm(e.getTime())+'，確定嗎？'))return;outAt(e.getTime())}
const calc=ms=>{const m=Math.max(0,Math.round(ms/6e4)),r=m%60;return Math.floor(m/60)+(r<=15?0:r<=45?.5:1)};
function outAt(e){if(!guard()||!S.active)return;const s=S.active.start;if(e<=s)e=s+60000;
 S.logs.push({id:'l'+Date.now(),date:ld(s),start:hm(s),end:hm(e),hours:calc(e-s)});S.active=null;confirm=false;done=true;save();render();
 clearTimeout(doneT);doneT=setTimeout(()=>{if(done&&!S.active){done=false;if(tab=='home')render()}},6000)}
function out(){outAt(Date.now())}
function resetLocal(){
 if(!API||!S.user){if(!confirm_('目前未連接雲端，清除後這支手機上的資料會消失且無法復原。確定清除？'))return;
  S={carry:0,declared:{},todos:[],active:null,logs:[],first:S.first,user:S.user,uid:S.uid};persist();confirm=false;done=false;render();return}
 if(!confirm_((S.dirty?'⚠️ 有尚未上傳到雲端的變動，清除後會遺失。\n':'')+'這會清除這支手機上的資料，並重新從雲端下載。雲端的紀錄不會被刪除。確定嗎？'))return;
 S={carry:0,declared:{},todos:[],active:null,logs:[],first:S.first,user:S.user,uid:S.uid,synced:false,base:null,dirty:false};persist();confirm=false;done=false;render();syncNow().then(()=>render())}
function numOnly(el){const v=el.value.replace(/[^0-9.]/g,''),i=v.indexOf('.');el.value=i<0?v:v.slice(0,i+1)+v.slice(i+1).replace(/\./g,'')}
function input(){
 const bk=`<div class="row"><button class="gh" onclick="mode=null;editId=null;edKeep=null;edDraft=null;render()">返回</button>`;
 if(!mode)return `<div class="c"><div class="t">新增or修改哪一項？</div><div class="opt"><button class="lb" onclick="mode='d';render()">加保時數</button><button class="lb" onclick="mode='l';render()">打卡時間</button></div></div>`+`<details class="c" style="text-align:left;margin-top:18px"><summary class="sm" style="cursor:pointer">其他設定：上期累計</summary><div style="margin-top:12px"><label>上期累計加保時數 (hr)</label><input id="cy" type="number" inputmode="decimal" step="0.5" value="${S.carry}"><button class="gh" onclick="svC()">儲存上期累計</button></div></details>`;
 if(mode=='d')return `<div class="c" style="text-align:left"><div class="row"><div><label>年</label><input id="iy" type="text" inputmode="numeric" maxlength="4" value="${im.slice(0,4)}" style="text-align:center" oninput="this.value=this.value.replace(/\\D/g,'')" onchange="setIM()"></div><div><label>月</label><select id="imo" onchange="setIM()">${[...Array(12)].map((_,i)=>`<option value="${i+1}" ${i+1==+im.slice(5)?'selected':''}>${i+1}月</option>`).join('')}</select></div></div><label>${ML(im)}加保時數 (hr)</label><input id="dv" type="text" inputmode="decimal" oninput="numOnly(this)" value="${S.declared[im]??''}">${bk}<button class="pri" style="font-size:16px;padding:13px" onclick="svD()">儲存</button></div></div>`;
 const d=edDraft||{},S0=d.s||{},E0=d.e||{};
 return `<div class="c" style="text-align:left"><label>日期</label><input id="ld" type="date" value="${d.date||ld(Date.now())}">
  <label>上班時間（選填）</label><div class="row"><select id="tsh" onchange="timeCalc()">${hOpts(23,S0.h)}</select><select id="tsm" onchange="timeCalc()">${mOpts(S0.m)}</select></div>
  <label>下班時間（選填，24 時＝午夜）</label><div class="row"><select id="teh" onchange="timeCalc()">${hOpts(24,E0.h)}</select><select id="tem" onchange="timeCalc()">${mOpts(E0.m)}</select></div>
  <label>時數 (hr)</label><input id="lh" type="text" inputmode="decimal" oninput="numOnly(this)" placeholder="選了上下班時間會自動計算，也可手動修改" value="${d.hours!==undefined?d.hours:''}">
  ${editId&&edKeep&&edKeep.start&&!d.s?`<p class="sm" style="margin:0 0 10px">原本的打卡時間 ${rng(edKeep)} 會保留；要更改請在上面重新選擇。</p>`:''}
  ${bk}<button class="pri" style="font-size:16px;padding:13px" onclick="svL()">${editId?'儲存修改':'新增'}</button></div></div>`}
function svC(){const n=parseFloat(document.getElementById('cy').value);S.carry=isNaN(n)?0:n;save();go('stats')}
function setIM(){const y=parseInt(document.getElementById('iy').value),m=+document.getElementById('imo').value;if(!(y>=1990&&y<=2100)){alert('請輸入正確的年份');return render()}im=y+'-'+pad(m);render()}
function svD(){if(!guard())return;const d=parseFloat(document.getElementById('dv').value);if(!isNaN(d))S.declared[im]=d;save();mode=null;go('stats')}
function svL(){if(!guard())return;const $=i=>document.getElementById(i).value;const d=$('ld');let h=parseFloat($('lh'));
 const sH=$('tsh'),sM=$('tsm'),eH=$('teh'),eM=$('tem'),any=[sH,sM,eH,eM].some(x=>x!==''),all=sH!==''&&sM!==''&&eH!==''&&(eM!==''||eH=='24');
 if(any&&!all)return alert('上班與下班的「時」和「分」請都選好，或全部留空');
 let st,en;
 if(all){st=pad(+sH)+':'+pad(+sM);en=(eH=='24'?'00':pad(+eH))+':'+(eH=='24'?'00':pad(+eM));
  if(!(h>0)){let df=(+eH*60+(eH=='24'?0:+eM))-(+sH*60+ +sM);if(df<=0)df+=1440;h=calc(df*6e4)}}
 else if(editId&&edKeep&&edKeep.start){st=edKeep.start;en=edKeep.end}
 if(!d||!(h>0))return alert('請輸入日期與時數，或選擇上下班時間');
 if(d<semMons()[0]+'-01')return alert('只保留本學期的打卡紀錄，這個日期早於 '+ML(semMons()[0])+'，無法新增');
 if(editId)S.logs=S.logs.filter(l=>String(l.id)!==String(editId));
 const o={id:'l'+Date.now(),date:d,hours:h};if(st){o.start=st;o.end=en}
 S.logs.push(o);editId=null;edKeep=null;edDraft=null;save();sm=d.slice(0,7);im=sm;mode=null;go('stats')}
function stats(){const t=tot(),diff=t.a-t.d;
 const L=S.logs.filter(l=>l.date.startsWith(sm)).sort((a,b)=>a.date<b.date?-1:1);
 return `<div class="c"><div class="row"><div><div class="t">總加保時數</div><div class="big dec" style="font-size:26px">${f(t.d)}</div></div><div><div class="t">已完成時數</div><div class="big ok" style="font-size:26px">${f(t.a)}</div></div><div><div class="t">本月已上班</div><div class="big ac" style="font-size:26px">${f(act(curM()))}</div></div></div>
 <div class="sm" style="margin-top:10px">${diff>=0?'已超過加保 '+f(diff)+' hr':'還需補 '+f(-diff)+' hr'}</div></div>
 <div class="c"><div class="t">明細表</div><table><tr><th></th><th>加保時數</th><th>完成時數</th></tr>
 <tr><td style="font-size:10pt">上期累計</td><td>${f(S.carry)}</td><td></td></tr>
 ${mons().map(m=>`<tr><td>${ML(m)}</td><td class="dec">${S.declared[m]??''}</td><td class="ok">${S.logs.some(l=>l.date.startsWith(m))?f(act(m)):''}</td></tr>`).join('')}
 <tr><th>加總</th><th class="dec">${f(t.d)}</th><th class="ok">${f(t.a)}</th></tr></table></div>
 <div class="c"><div class="t">上班時數</div><select id="sm" onchange="sm=this.value;render()" style="margin-bottom:6px">${opts(sm)}</select>
 ${L.map(l=>`<div class="li"><span>${FD(l.date)}${l.start?` <span class="sm">${rng(l)}</span>`:''}</span><span><b>${f(l.hours)} hr</b><button class="x gh" data-act="ed" data-id="${esc(String(l.id))}">✎</button><button class="x gh" data-act="del" data-id="${esc(String(l.id))}">✕</button></span></div>`).join('')||'<p class="sm">本月尚無紀錄</p>'}
 <div class="li" style="border:0"><b>小計</b><b class="ok">${f(act(sm))} hr</b></div></div>`}
const confirm_=m=>window.confirm(m);
function del(id){S.logs=S.logs.filter(l=>String(l.id)!==String(id));save();render()}
function delLog(id){if(confirm_('確定要刪除這筆紀錄嗎？'))del(id)}
function edLog(id){const l=S.logs.find(x=>String(x.id)===String(id));if(!l)return;editId=l.id;edKeep=l.start?{start:l.start,end:l.end}:null;edDraft={date:l.date,hours:l.hours,s:pr(l.start),e:pr(l.end)};tab='input';mode='l';anim=true;render()}
const ACT={ed:edLog,del:delLog,tdt:i=>{const t=S.todos[+i];if(t){t.d=!t.d;save();render()}},tdx:i=>{S.todos.splice(+i,1);save();render()}};
document.getElementById('v')?.addEventListener?.('click',e=>{const b=e.target&&e.target.closest&&e.target.closest('[data-act]');if(!b)return;const fn=ACT[b.getAttribute('data-act')];if(fn)fn(b.getAttribute('data-id'),b)});
(function(){if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
const c=document.createElement('canvas');c.setAttribute('aria-hidden','true');c.style.cssText='position:fixed;left:0;top:0;width:100%;height:100%;pointer-events:none;z-index:0';document.body.prepend(c);
const x=c.getContext('2d');let W,H,F=[],col='255,255,255',n=0,last=0;
const mk=r=>({x:Math.random()*W,y:r?Math.random()*H:-8,r:Math.random()*2.2+.8,v:Math.random()*25+18,p:Math.random()*6.28,s:Math.random()*.6+.3});
function size(){const d=Math.min(devicePixelRatio||1,2);W=innerWidth;H=innerHeight;c.width=W*d;c.height=H*d;x.setTransform(d,0,0,d,0,0);const N=Math.round(Math.min(70,W*H/14000));while(F.length<N)F.push(mk(true));F.length=N}
function f(t){requestAnimationFrame(f);if(document.hidden){last=t;return}const dt=Math.min((t-last)/1000||0,.05);last=t;
 if(!(n++%120))col=getComputedStyle(document.documentElement).getPropertyValue('--snow').trim()||col;
 x.clearRect(0,0,W,H);for(const s of F){s.y+=s.v*dt;s.p+=dt*s.s;s.x+=Math.sin(s.p)*12*dt;if(s.y>H+8){Object.assign(s,mk(false))}
  x.beginPath();x.fillStyle='rgba('+col+','+(.3+s.r*.18)+')';x.arc(s.x,((s.y-(window.__sy||0)*s.r*.15)%H+H)%H,s.r,0,6.283);x.fill()}}
size();addEventListener('resize',size);requestAnimationFrame(f)})();
const themeCard=()=>`<div class="c" style="text-align:left;padding:12px 14px"><b style="font-size:15px">外觀主題</b><div class="row" style="gap:8px;margin-top:8px">${[['','跟隨系統'],['dark','深色'],['light','淺色']].map(x=>`<button class="sb ${curTheme()===x[0]?'ok2':''}" onclick="setTheme('${x[0]}')">${x[1]}</button>`).join('')}</div></div>`;
// ===== 管理員介面 =====
const isAdm=()=>!!(S.user&&S.user.admin);
const ADM0=()=>({ov:null,p:null,ann:null,tk:null,grp:'',q:'',sel:null,ed:null,pm:curM(),err:''});
let ADM=ADM0();
async function admCall(op,x){const j=await call({action:'adm',op,...(x||{})});if(!j||!j.ok)throw new Error(!j?'無法連線':(j.err||'失敗'));return j}
async function admLoad(t){t=t||tab;if(!isAdm())return;
 try{if(t=='home'||t=='staff'||t=='tasks'){ADM.ov=await admCall('overview')}
  if(t=='staff'&&ADM.sel)ADM.p=await admCall('person',{target:ADM.sel});
  if(t=='ann')ADM.ann=await admCall('ann_list');
  if(t=='tasks')ADM.tk=await admCall('task_list');
  ADM.err=''}catch(e){ADM.err=e.message}
 if(isAdm()&&tab==t&&!busyEl())render()}
async function admRun(op,x,after){if(!guard())return;try{await admCall(op,x);if(after)after();await admLoad()}catch(e){alert('操作失敗：'+e.message)}}
const pbar=(a,d)=>`<div class="bar ${d>0&&a>=d?'full':''}"><i style="width:${d>0?Math.min(100,a/d*100):0}%"></i></div>`;
const ptot=p=>{const ms=ADM.ov.months;return{d:p.carry+ms.reduce((s,m)=>s+(p.declared[m]||0),0),a:ms.reduce((s,m)=>s+(p.actual[m]||0),0)}};
const hrmin=ms=>{const m=Math.max(0,Math.floor(ms/6e4));return Math.floor(m/60)+' 小時 '+(m%60)+' 分'};
const gtag=g=>`<span class="tag">${esc(g||'—')}</span>`;
const admLoading=()=>`<div class="c"><p class="sm" style="margin:0">${ADM.err?'⚠️ '+esc(ADM.err)+'<br><br><button class="gh" onclick="admLoad()">重試</button>':'載入中…'}</p></div>`;
const dayIn=(id,v)=>`<input id="${id}" type="date" value="${esc(v||'')}">`;

function admHome(){const o=ADM.ov;if(!o)return admLoading();const c=curM(),all=o.people,tots=all.map(ptot);
 const list=all.filter(p=>!ADM.grp||p.group==ADM.grp),ok=tots.filter(t=>t.d>0&&t.a>=t.d).length;
 const duty=o.duty.map(x=>{const ms=Date.now()-x.start;return `<div class="li"><span>${esc(x.name)} ${gtag(x.group)}</span><span class="sm">${hm(x.start)} 起 · ${hrmin(ms)}${ms>12*36e5?' <span class="tag w">超過12小時</span>':''}</span></div>`}).join('')||'<p class="sm" style="margin:6px 0;text-align:center">目前沒有人在上班</p>';
 const rows=list.map(p=>{const t=ptot(p),d=p.declared[c],a=p.actual[c]||0;
  return `<div class="pr" data-act="pick" data-id="${esc(p.id)}"><div class="h"><span><b>${esc(p.name)}</b>${gtag(p.group)}${p.on?'<span class="tag on">上班中</span>':''}</span><span class="sm">本月 ${f(a)} / ${d==null?'—':f(d)} hr</span></div>${pbar(a,d||0)}<div class="sm" style="margin-top:6px">本學期 ${f(t.a)} / ${f(t.d)} hr${t.d>0?'（'+Math.round(t.a/t.d*100)+'%）':''}</div>${pbar(t.a,t.d)}</div>`}).join('')||'<p class="sm">沒有人員</p>';
 return `<div class="c"><div class="row" style="gap:0;text-align:center"><div style="flex:1"><div class="big" style="font-size:30px">${all.length}</div><div class="sm">全館人數</div></div><div style="flex:1"><div class="big" style="font-size:30px">${o.duty.length}</div><div class="sm">上班中</div></div><div style="flex:1"><div class="big" style="font-size:30px">${ok}</div><div class="sm">學期達標</div></div></div></div>
 <div class="c" style="text-align:left"><div class="t">目前上班中</div>${duty}</div>
 <div class="c" style="text-align:left"><div class="t">加保 vs 已完成（${ML(c)}）</div><div class="chips" style="margin:6px 0 10px">${['','櫃檯','期刊','SSS'].map(g=>`<button class="chip ${ADM.grp==g?'on':''}" data-act="grp" data-id="${g}">${g||'全部'}</button>`).join('')}</div>${rows}<button class="gh" style="margin-top:10px" onclick="admLoad('home')">重新整理</button></div>`}

const admListHTML=()=>{const q=ADM.q.trim().toLowerCase();return ADM.ov.people.filter(p=>!q||p.name.toLowerCase().includes(q)||p.id.toLowerCase().includes(q)).map(p=>`<div class="pr" data-act="pick" data-id="${esc(p.id)}"><div class="h"><span><b>${esc(p.name)}</b>${gtag(p.group)}${p.on?'<span class="tag on">上班中</span>':''}${p.hasPin?'':'<span class="tag">未設定PIN</span>'}</span><span class="sm">${esc(p.id)}</span></div></div>`).join('')||'<p class="sm">沒有符合的人員</p>'};
function admList(){const e=document.getElementById('adl');if(e)e.innerHTML=admListHTML()}
function admStaff(){if(ADM.sel)return admPerson();const o=ADM.ov;if(!o)return admLoading();
 return `<div class="c" style="text-align:left"><input id="aq" placeholder="搜尋姓名或學號" value="${esc(ADM.q)}" oninput="ADM.q=this.value;admList()" style="margin-bottom:6px"><div id="adl">${admListHTML()}</div></div>
 <details class="c" style="text-align:left"><summary class="sm" style="cursor:pointer">＋ 新增人員</summary><div style="margin-top:12px"><label>學號</label><input id="nuid" autocapitalize="characters" autocomplete="off"><label>姓名</label><input id="nunm"><label>組別</label><select id="nugp"><option>櫃檯</option><option>期刊</option><option>SSS</option></select><button class="pri" style="font-size:16px;padding:13px" onclick="admAddUser()">新增</button><p class="sm" style="margin:8px 0 0">新人第一次登入時，會自己設定暱稱與 PIN。</p></div></details>`}
function admAddUser(){const g=i=>document.getElementById(i).value.trim();if(!g('nuid')||!g('nunm'))return alert('請輸入學號與姓名');admRun('user_add',{newId:g('nuid'),name:g('nunm'),group:g('nugp')})}

function admPerson(){const p=ADM.p;const back=`<button class="gh" style="margin-bottom:10px" onclick="ADM.sel=null;ADM.ed=null;render()">← 返回名單</button>`;
 if(!p||p.id!==ADM.sel)return back+admLoading();
 const ms=p.months;if(!ms.includes(ADM.pm))ADM.pm=ms[ms.length-1];
 const L=p.logs.filter(l=>l.date.startsWith(ADM.pm)).sort((a,b)=>a.date<b.date?1:-1),e=ADM.ed,S0=e&&pr(e.start),E0=e&&pr(e.end),sum=L.reduce((s,l)=>s+l.hours,0);
 const dv=e?e.date:(ADM.pm==curM()?ld(Date.now()):ADM.pm+'-01');
 return back+`<div class="c" style="text-align:left"><div class="h" style="display:flex;justify-content:space-between;align-items:baseline"><b style="font-size:19px">${esc(p.name)}</b><span class="sm">${esc(p.id)}</span></div>
 <div class="sm" style="margin:4px 0 10px">暱稱：${esc(p.nick||'（未設定）')} · PIN：${p.hasPin?'已設定':'未設定'}</div>
 <label>組別</label><select id="pgp">${['櫃檯','期刊','SSS'].map(g=>`<option ${g==p.group?'selected':''}>${g}</option>`).join('')}</select>
 <div class="row" style="gap:8px"><button class="gh" data-act="pgp" data-id="${esc(p.id)}">儲存組別</button><button class="gh" data-act="ppin" data-id="${esc(p.id)}">重設 PIN</button></div>
 <button class="gh" style="margin-top:8px;color:var(--bad);border-color:var(--bad)" data-act="pdelu" data-id="${esc(p.id)}">移除此人員</button></div>
 <div class="c" style="text-align:left"><div class="t">加保時數</div><label>上期累計</label><input id="dcar" inputmode="decimal" value="${p.carry||''}">${ms.map((m,i)=>`<label>${ML(m)}</label><input id="dm${i}" inputmode="decimal" placeholder="未設定" value="${p.declared[m]!=null?p.declared[m]:''}">`).join('')}<button class="pri" style="font-size:16px;padding:13px" onclick="admSaveDecl()">儲存加保時數</button></div>
 <div class="c" style="text-align:left"><div class="t">打卡紀錄</div><select onchange="ADM.pm=this.value;ADM.ed=null;render()">${ms.map(m=>`<option value="${m}" ${m==ADM.pm?'selected':''}>${ML(m)}</option>`).join('')}</select>
 ${L.map(l=>`<div class="li"><span>${FD(l.date)}${l.start?` <span class="sm">${rng(l)}</span>`:''}</span><span><b>${f(l.hours)} hr</b><button class="x gh" data-act="ped" data-id="${l.row}">✎</button><button class="x gh" data-act="pdel" data-id="${l.row}">✕</button></span></div>`).join('')||'<p class="sm" style="margin:8px 0">這個月沒有紀錄</p>'}
 <div class="sm" style="margin:8px 0">本月合計 <b>${f(sum)}</b> hr</div><hr class="sep">
 <div class="t">${e?'修改紀錄':'新增紀錄'}</div><label>日期</label>${dayIn('ald',dv)}
 <label>上班時間（選填）</label><div class="row" style="gap:8px"><select id="ash" onchange="admCalc()">${hOpts(23,S0&&S0.h)}</select><select id="asm" onchange="admCalc()">${mOpts(S0&&S0.m)}</select></div>
 <label>下班時間（選填）</label><div class="row" style="gap:8px"><select id="aeh" onchange="admCalc()">${hOpts(24,E0&&E0.h)}</select><select id="aem" onchange="admCalc()">${mOpts(E0&&E0.m)}</select></div>
 <label>時數</label><input id="alh" inputmode="decimal" value="${e?e.hours:''}">
 <div class="row" style="gap:8px">${e?'<button class="gh" onclick="ADM.ed=null;render()">取消</button>':''}<button class="pri" style="font-size:16px;padding:13px" onclick="admSaveLog()">${e?'儲存修改':'新增'}</button></div></div>`}
function admCalc(){const g=i=>document.getElementById(i).value,a=g('ash'),b=g('asm'),c=g('aeh'),d=g('aem');if(a===''||b===''||c===''||d==='')return;
 const s=+a*60+ +b,en=+c*60+ +d;document.getElementById('alh').value=f(calc((en>s?en-s:en+1440-s)*6e4))}
function admSaveLog(){const g=i=>document.getElementById(i).value,e=ADM.ed,date=g('ald'),a=g('ash'),b=g('asm'),c=g('aeh'),d=g('aem');let h=parseFloat(g('alh'));
 if(!date)return alert('請選擇日期');const any=[a,b,c,d].some(x=>x!==''),all=[a,b,c,d].every(x=>x!=='');if(any&&!all)return alert('上下班時間請完整選擇，或全部留空');
 let st='',en='';if(all){st=pad(+a)+':'+pad(+b);en=(c=='24'?'00':pad(+c))+':'+(c=='24'?'00':pad(+d));if(isNaN(h))h=calc(((+c*60+ +d>+a*60+ +b?+c*60+ +d-(+a*60+ +b):+c*60+ +d+1440-(+a*60+ +b)))*6e4)}else if(e&&e.start){st=e.start;en=e.end}
 if(isNaN(h)||h<0)return alert('請輸入時數');
 admRun(e?'log_edit':'log_add',{target:ADM.sel,row:e&&e.row,date,start:st,end:en,hours:h},()=>{ADM.ed=null;ADM.pm=date.slice(0,7)})}
function admSaveDecl(){const g=i=>document.getElementById(i).value.trim(),dec={};ADM.p.months.forEach((m,i)=>{const v=g('dm'+i);dec[m]=v===''?null:parseFloat(v)});const carry=g('dcar')===''?0:parseFloat(g('dcar'));
 if(isNaN(carry)||Object.values(dec).some(v=>v!==null&&isNaN(v)))return alert('請輸入數字');admRun('decl_set',{target:ADM.sel,dec,carry})}

function admAnn(){const a=ADM.ann;if(!a)return admLoading();
 const rows=a.items.map(x=>`<div class="pr" style="cursor:default"><div>${x.pin?'📌 ':''}${esc(x.t)}</div>${x.note?`<div class="sm">備註：${esc(x.note)}</div>`:''}<div class="sm" style="margin-top:6px;display:flex;justify-content:space-between;align-items:center;gap:6px"><span>${esc(x.status||'')}${x.start?' · '+esc(x.start)+' 起':''}${x.end?' · 至 '+esc(x.end):''}</span><span style="white-space:nowrap"><button class="mini gh" data-act="annT" data-id="${x.row}" data-on="${x.on?1:0}">${x.on?'停用':'啟用'}</button><button class="mini gh" data-act="annD" data-id="${x.row}">刪除</button></span></div></div>`).join('')||'<p class="sm">目前沒有公告</p>';
 return `<div class="c" style="text-align:left"><div class="t">公告列表</div>${rows}</div>
 <div class="c" style="text-align:left"><div class="t">新增公告</div>${a.presets&&a.presets.length?`<select onchange="if(this.value)document.getElementById('at').value=this.value"><option value="">常用公告…</option>${a.presets.map(x=>`<option value="${esc(x)}">${esc(x)}</option>`).join('')}</select>`:''}
 <label>內容</label><input id="at" maxlength="120"><label>類型</label><select id="ap"><option value="">一般</option><option value="1">置頂</option></select><label>開始日期（選填）</label>${dayIn('as','')}<label>結束日期（選填）</label>${dayIn('ae','')}<label>備註（選填，點公告展開）</label><input id="an">
 <button class="pri" style="font-size:16px;padding:13px" onclick="admAddAnn()">發送公告</button></div>`}
function admAddAnn(){const g=i=>document.getElementById(i).value.trim();if(!g('at'))return alert('請輸入公告內容');admRun('ann_add',{t:g('at'),top:!!g('ap'),start:g('as'),end:g('ae'),note:g('an')})}

function admTasks(){const t=ADM.tk,o=ADM.ov;if(!t||!o)return admLoading();
 const rows=t.items.map(x=>`<div class="pr" style="cursor:default"><div><b>${esc(x.name)}</b>　${esc(x.t)}</div><div class="sm" style="margin-top:6px;display:flex;justify-content:space-between;align-items:center;gap:6px"><span>${esc(x.status||'')}${x.due?' · 到期 '+esc(x.due):''}</span><span style="white-space:nowrap"><button class="mini gh" data-act="tkT" data-id="${x.row}" data-on="${x.on?1:0}">${x.on?'停用':'啟用'}</button><button class="mini gh" data-act="tkD" data-id="${x.row}">刪除</button></span></div></div>`).join('')||'<p class="sm">目前沒有任務</p>';
 return `<div class="c" style="text-align:left"><div class="t">已指派任務</div>${rows}</div>
 <div class="c" style="text-align:left"><div class="t">指派新任務</div><label>人員</label><select id="tp">${o.people.map(p=>`<option value="${esc(p.id)}">${esc(p.name)}（${esc(p.group)}）</option>`).join('')}</select>
 <label>任務內容</label><input id="tt" maxlength="120"><label>到期日（選填）</label>${dayIn('td','')}<button class="pri" style="font-size:16px;padding:13px" onclick="admAddTask()">指派</button></div>`}
function admAddTask(){const g=i=>document.getElementById(i).value.trim();if(!g('tt'))return alert('請輸入任務內容');admRun('task_add',{target:g('tp'),t:g('tt'),due:g('td')})}

function admSettings(){return `${themeCard()}<div class="c" style="text-align:left"><b>目前身分</b><div class="sm" style="margin:4px 0 10px">${esc(S.user.name)}（${esc(S.user.id)}）· 暱稱：${esc(S.user.nick||'')}<br>組別：${esc(S.user.group||'—')} · <b style="color:var(--bad)">管理員</b></div><button class="gh" style="margin-bottom:10px" onclick="admLoad('home')">重新整理資料</button><button class="gh" onclick="if(confirm_('確定登出？')){S.user=null;save();render()}">登出</button></div><div class="foot">版本：beta.1<hr>開發者：PoYu</div>`}

Object.assign(ACT,{
 pick:id=>{ADM.sel=id;ADM.p=null;ADM.ed=null;ADM.pm=curM();if(tab!='staff')go('staff');else{render();admLoad('staff')}},
 grp:g=>{ADM.grp=g;render()},
 ped:row=>{ADM.ed=ADM.p.logs.find(l=>String(l.row)===String(row))||null;if(ADM.ed)ADM.pm=ADM.ed.date.slice(0,7);render();document.getElementById('ald')?.scrollIntoView({block:'center'})},
 pdel:row=>{if(confirm_('確定要刪除這筆紀錄嗎？'))admRun('log_del',{target:ADM.sel,row:+row})},
 pgp:id=>admRun('user_edit',{target:id,group:document.getElementById('pgp').value}),
 ppin:id=>{if(confirm_('確定重設 '+ADM.p.name+' 的 PIN？對方所有裝置會被登出，下次登入需重新設定。'))admRun('pin_reset',{target:id})},
 pdelu:id=>{if(confirm_('確定移除 '+ADM.p.name+'？對方將無法登入；打卡與加保紀錄仍保留在試算表。'))admRun('user_del',{target:id},()=>{ADM.sel=null;ADM.p=null})},
 annT:(id,el)=>admRun('ann_toggle',{row:+id,on:el.dataset.on!='1'}),
 annD:id=>{if(confirm_('確定刪除這則公告？'))admRun('ann_del',{row:+id})},
 tkT:(id,el)=>admRun('task_toggle',{row:+id,on:el.dataset.on!='1'}),
 tkD:id=>{if(confirm_('確定刪除這個任務？'))admRun('task_del',{row:+id})}
});
if(!S.first){S.first=ld(Date.now());save()}
S.logs=S.logs.filter(l=>l.date>=semMons()[0]+'-01');save();
loadCfg();
render();
syncNow();
if('serviceWorker' in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(()=>{}));

