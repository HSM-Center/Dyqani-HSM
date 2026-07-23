let bizCfg = JSON.parse(localStorage.getItem('tp_bizcfg')||'null') || {
  emri: 'Emri i Biznesit',
  nipt: 'L12345678A',
  tel: '+355 692098539',
  rruga: 'Rruga Sheshi Demokracia',
  qyteti: 'Shkodër',
  adresa: 'Rruga Sheshi Demokracia, Shkodër',
  footer: 'Faleminderit për bashkëpunimin!',
  prefSh: 'F',
  prefBl: 'BL',
  pad: 4
};

function saveCfg(){
  bizCfg.emri   = document.getElementById('cfg-emri').value.trim() || 'Biznesi Im';
  bizCfg.nipt   = document.getElementById('cfg-nipt').value.trim();
  bizCfg.tel    = document.getElementById('cfg-tel').value.trim();
  bizCfg.rruga  = document.getElementById('cfg-rruga').value.trim();
  bizCfg.qyteti = document.getElementById('cfg-qyteti').value.trim();
  bizCfg.adresa = [bizCfg.rruga, bizCfg.qyteti].filter(Boolean).join(', ');
  bizCfg.footer = document.getElementById('cfg-footer').value.trim();
  bizCfg.prefSh = document.getElementById('cfg-pref-sh').value.trim() || 'F';
  bizCfg.prefBl = document.getElementById('cfg-pref-bl').value.trim() || 'BL';
  bizCfg.pad    = +document.getElementById('cfg-pad').value || 4;
  localStorage.setItem('tp_bizcfg', JSON.stringify(bizCfg));
  applyBizCfg();
  save();
  showToast('✓ Konfigurimet u ruajtën!');
}

function loadCfgFields(){
  document.getElementById('cfg-emri').value   = bizCfg.emri;
  document.getElementById('cfg-nipt').value   = bizCfg.nipt;
  document.getElementById('cfg-tel').value    = bizCfg.tel;
  document.getElementById('cfg-rruga').value  = bizCfg.rruga || '';
  document.getElementById('cfg-qyteti').value = bizCfg.qyteti || '';
  document.getElementById('cfg-footer').value = bizCfg.footer;
  document.getElementById('cfg-pref-sh').value= bizCfg.prefSh;
  document.getElementById('cfg-pref-bl').value= bizCfg.prefBl;
  document.getElementById('cfg-pad').value    = bizCfg.pad;
  previewBiznes();
}

function previewBiznes(){
  const emri   = document.getElementById('cfg-emri').value||'Biznesi Im';
  const nipt   = document.getElementById('cfg-nipt').value;
  const tel    = document.getElementById('cfg-tel').value;
  const rruga  = document.getElementById('cfg-rruga').value;
  const qyteti = document.getElementById('cfg-qyteti').value;
  const adresa = [rruga, qyteti].filter(Boolean).join(', ');
  const footer = document.getElementById('cfg-footer').value;
  const prefSh = document.getElementById('cfg-pref-sh').value||'F';
  const prefBl = document.getElementById('cfg-pref-bl').value||'BL';
  const pad    = +document.getElementById('cfg-pad').value||4;
  const num    = '1'.padStart(pad,'0');
  document.getElementById('prev-emri').textContent = emri;
  document.getElementById('prev-info').innerHTML = `${adresa}${nipt?'  ·  NIPT: '+nipt:''}${tel?'  ·  Tel: '+tel:''}`;
  document.getElementById('prev-footer').textContent = footer;
  document.getElementById('prev-sh').textContent = prefSh+'-'+num;
  document.getElementById('prev-bl').textContent = prefBl+'-'+num;
}

function applyBizCfg(){
  const emri = bizCfg.emri || 'Biznesi Im';
  document.title = emri + ' — Sistemi i Menaxhimit';
  const ids = ['sidebar-biz-name','login-biz-title','topbar-biz-name','sf-bizname'];
  ids.forEach(id => { const el=document.getElementById(id); if(el) el.textContent=emri; });
}

function nextFatNr(tipi){
  let prefix = tipi === 'sh' ? bizCfg.prefSh : bizCfg.prefBl;
  if (tipi === 'sv') prefix = 'SV'; // Prefiks fiks për servisin
  const pad = bizCfg.pad || 4;
  const re = new RegExp('^' + prefix.replace(/[.*+?^${}()|[\]\\]/g,'\\$&') + '-(\\d+)$');
  
  if(tipi === 'sh' || tipi === 'sv'){
    const nums = shitjet.map(s=>{ const m=s.fat.match(re); return m?+m[1]:0; });
    const maxN = nums.length ? Math.max(...nums) : 0;
    return prefix+'-'+(maxN+1).toString().padStart(pad,'0');
  } else {
    const nums = blerjet.map(b=>{ const m=b.fat.match(re); return m?+m[1]:0; });
    const maxN = nums.length ? Math.max(...nums) : 0;
    return prefix+'-'+(maxN+1).toString().padStart(pad,'0');
  }
}

function showToast(msg){
  const t=document.createElement('div');
  t.innerHTML=msg;
  t.style.cssText='position:fixed;bottom:1.5rem;right:1.5rem;background:#f0fdf4;border:1.5px solid #86efac;color:#15803d;padding:10px 18px;border-radius:10px;font-size:13px;font-weight:700;z-index:9999;box-shadow:0 4px 16px rgba(0,0,0,.12);animation:loginPop .3s ease';
  document.body.appendChild(t);
  setTimeout(()=>t.remove(),3000);
}

let users = JSON.parse(localStorage.getItem('tp_users')||'null')||[
  {username: 'admin', password: 'admin123', role: 'admin'},
  {username: 'user', password: '1234', role: 'user'}
];
// Sigurohu gjithmonë që admin ekziston
if(!users.find(u=>u.username==='admin')){
  users.unshift({username:'admin',password:'admin123',role:'admin'});
  localStorage.setItem('tp_users',JSON.stringify(users));
}
let products = JSON.parse(localStorage.getItem('tp_products')||'null')||[];
let blerjet = JSON.parse(localStorage.getItem('tp_blerjet')||'null')||[];
let shitjet = JSON.parse(localStorage.getItem('tp_shitjet')||'null')||[];
let faturatMeta = JSON.parse(localStorage.getItem('tp_faturat_meta')||'null')||{};
let shpenzimet = JSON.parse(localStorage.getItem('tp_shpenzimet')||'null')||[];

const TABS=["Dashboard","Produktet","Blerjet","Shitjet","Faturat","Magazine","Bilanci","Shpenzimet","Debitorët","Xhiro Ditore","Përdoruesit","Konfigurimet"];
const TOPBAR_ADD=[null,"Produkt","Blerje","Shitje",null,null,null,"Shpenzim",null,null,null,null];
const MODALS=[null,"modal-addprod","modal-addblerje","modal-addshitje",null,null,null,"modal-addshpenzim",null,null,"modal-adduser","modal-addcfg",null];
let currentView = 'list';
let mainChart=null, donutChart=null;

function save(){
  localStorage.setItem('tp_products',JSON.stringify(products));
  localStorage.setItem('tp_blerjet',JSON.stringify(blerjet));
  localStorage.setItem('tp_shitjet',JSON.stringify(shitjet));
  localStorage.setItem('tp_shpenzimet',JSON.stringify(shpenzimet));
  localStorage.setItem('tp_faturat_meta',JSON.stringify(faturatMeta));
  localStorage.setItem('tp_users',JSON.stringify(users));
  localStorage.setItem('tp_xhiro_historiku', JSON.stringify(xhiroHistoriku));
  localStorage.setItem('tp_arketimet', JSON.stringify(arketimet));
  sbSave();
}

function today(){
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
}
function toLocalISODate(d){
  return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
}
function getProd(id){return products.find(p=>String(p.id)===String(id))}
function badge(txt,bg,color){return `<span class="badge" style="background:${bg};color:${color}">${txt}</span>`}
function prodEmoji(kat){
  const m={'Laptop':'💻','PC Desktop':'🖥️','Monitor':'🖥','Kamera':'📷','Switch':'🔌','NVR':'📹','Rrjet':'📡','UPS':'🔋','Aksesore':'🖱️','Kablë':'🔗','Printer':'🖨️','Tablet':'📱','Server':'🗄️','Tjetër':'📦'};
  return m[kat]||'📦';
}

let currentTab=0;
function isStaffUser(){return currentRole==='user';}
function goTab(i,btn){
  if(isStaffUser()&&(i===2||i===5||i===6||i===7)){alert('⚠ Ju nuk keni qasje në këto seksione!');return;}
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b=>b.classList.remove('active'));
  const tabId = typeof i === 'string' ? 'tab-'+i : 'tab-'+i;
  document.getElementById(tabId).classList.add('active');
  btn.classList.add('active');
  const titleIdx = typeof i === 'string' ? TABS.indexOf(i) : i;
  document.getElementById('page-title').textContent = typeof i === 'string' ? i : TABS[i];
  currentTab = typeof i === 'string' ? i : i;
  const addBtn=document.getElementById('topbar-add-btn');
  const srch=document.getElementById('topbar-search-wrap');
  if(TOPBAR_ADD[titleIdx] && typeof i !== 'string'){
    if(isStaffUser() && i===1) {
      addBtn.style.display='none';
    } else {
      addBtn.textContent='+ '+TOPBAR_ADD[titleIdx];
      addBtn.style.display='flex';
    }
  } else {
    addBtn.style.display='none';
  }
  srch.style.display=(i===1)?'flex':'none';
  renderAll();
}
function goToDebitoret(){
  const btns=document.querySelectorAll('.nav-btn');
  for(const b of btns){if(b.textContent.includes('Debitorët')){goTab(8,b);return;}}
}

function topbarAdd(){
  const m=MODALS[currentTab];
  if(m==='modal-addshitje')openShitjeModal();
  else if(m)openModal(m);
}

function openModal(id){
  if(id==='modal-addblerje'){
    blerjeCart=[];
    renderBlerjeCart();
    document.getElementById('b-prod-search').value='';
    document.getElementById('b-prod').value='';
    document.getElementById('b-prod-dropdown').style.display='none';
    document.getElementById('b-cmb').value='';
    document.getElementById('b-sasia').value='1';
    const njeEl=document.getElementById('b-nje');if(njeEl)njeEl.value='Cope';
    document.getElementById('b-curr').value='ALL';
    document.getElementById('b-tvsh-opt').value='jo';
    document.getElementById('b-furn').value='';
    document.getElementById('b-fat').value=nextFatNr('bl');
    document.addEventListener('click', closeProdDropdownBlerje, true);
  }
  const ov=document.getElementById(id);
  ov.classList.remove('minimized');
  ov.classList.add('open');
  removeTaskbarPill(id);
  const box=ov.querySelector('.modal-box');
  if(box){
    box.style.top='';
    box.style.left='';
    box.style.right='';
    box.style.transform='';
    box.style.height='';
    box.classList.remove('maximized');
    box._prevStyle=null;
    const maxBtn=ov.querySelector('.modal-header button[title="Rikthe Madhësinë"]');
    if(maxBtn){maxBtn.textContent='□';maxBtn.title='Maksimizo';}
  }
  if(id==='modal-addblerje')document.getElementById('b-data').value=today();
  if(id==='modal-addshitje')document.getElementById('s-data').value=today();
  if(id==='modal-addshpenzim')document.getElementById('sh-data').value=today();
}

function closeModal(e,id){if(e.target===e.currentTarget){document.getElementById(id).classList.remove('open','minimized');removeTaskbarPill(id);}}
function closeModalById(id){document.getElementById(id).classList.remove('open','minimized');removeTaskbarPill(id);}

function minimizeModal(id,title){
  const ov=document.getElementById(id);
  ov.classList.add('minimized');
  addTaskbarPill(id,title||'Dritare');
}
function restoreModal(id){
  document.getElementById(id).classList.remove('minimized');
}
function toggleMaximize(id,btn){
  const ov=document.getElementById(id);
  const box=ov.querySelector('.modal-box');
  if(!box)return;
  if(box.classList.contains('maximized')){
    box.classList.remove('maximized');
    if(box._prevStyle){
      box.style.top=box._prevStyle.top;
      box.style.left=box._prevStyle.left;
      box.style.right=box._prevStyle.right;
      box.style.transform=box._prevStyle.transform;
      box.style.width=box._prevStyle.width;
      box.style.height=box._prevStyle.height;
    }
    if(btn)btn.textContent='□';
    if(btn)btn.title='Maksimizo';
  } else {
    box._prevStyle={top:box.style.top,left:box.style.left,right:box.style.right,transform:box.style.transform,width:box.style.width,height:box.style.height};
    box.classList.add('maximized');
    if(btn)btn.textContent='❐';
    if(btn)btn.title='Rikthe Madhësinë';
  }
}
function addTaskbarPill(id,title){
  const bar=document.getElementById('window-taskbar');
  if(document.getElementById('pill-'+id))return;
  const pill=document.createElement('div');
  pill.className='taskbar-pill';
  pill.id='pill-'+id;
  pill.innerHTML=`<span>🗗 ${title}</span><span class="pill-x">✕</span>`;
  pill.querySelector('span:first-child').onclick=()=>restoreModal(id);
  pill.querySelector('.pill-x').onclick=(e)=>{e.stopPropagation();closeModalById(id);};
  bar.appendChild(pill);
  bar.classList.add('show');
}
function removeTaskbarPill(id){
  const p=document.getElementById('pill-'+id);
  if(p)p.remove();
  const bar=document.getElementById('window-taskbar');
  if(bar && !bar.children.length)bar.classList.remove('show');
}
function makeDraggable(boxEl, handleEl){
  if(!boxEl||!handleEl)return;
  let offsetX=0, offsetY=0, dragging=false;
  function start(clientX, clientY){
    if(window.innerWidth<=768)return;
    dragging=true;
    const rect=boxEl.getBoundingClientRect();
    offsetX=clientX-rect.left;
    offsetY=clientY-rect.top;
    boxEl.style.transform='none';
    boxEl.style.left=rect.left+'px';
    boxEl.style.top=rect.top+'px';
    boxEl.style.right='auto';
    document.body.style.userSelect='none';
  }
  function move(clientX, clientY){
    if(!dragging)return;
    let x=clientX-offsetX;
    let y=clientY-offsetY;
    x=Math.max(4,Math.min(x, window.innerWidth-80));
    y=Math.max(4,Math.min(y, window.innerHeight-60));
    boxEl.style.left=x+'px';
    boxEl.style.top=y+'px';
  }
  function end(){dragging=false;document.body.style.userSelect='';}
  handleEl.addEventListener('mousedown', e=>{
    if(e.target.closest('.modal-close'))return;
    start(e.clientX, e.clientY);
  });
  document.addEventListener('mousemove', e=>move(e.clientX, e.clientY));
  document.addEventListener('mouseup', end);
  handleEl.addEventListener('touchstart', e=>{
    if(e.target.closest('.modal-close'))return;
    const t=e.touches[0];start(t.clientX, t.clientY);
  },{passive:true});
  document.addEventListener('touchmove', e=>{
    if(!dragging)return;
    const t=e.touches[0];move(t.clientX, t.clientY);
  },{passive:true});
  document.addEventListener('touchend', end);
}
function initDraggableModals(){
  document.querySelectorAll('.modal-overlay').forEach(ov=>{
    const box=ov.querySelector('.modal-box');
    const handle=ov.querySelector('.modal-header');
    makeDraggable(box,handle);
  });
}
let cart=[];
let blerjeCart=[];
let dsCart=[];
let dsPriceType='1';
let prevCart=[];

function renderAll(){
  renderDashboard();
  renderProducts();
  renderBlerjet();
  renderShitjet();
  renderFaturat();
  renderMagazine();
  renderBilanci();
  renderShpenzimet();
  renderDebitoret();
  renderUsers();
  renderXhiro();
  updateAlarmBadge();
  updateDebBadge();
}

function renderUsers(){
  const body = document.getElementById('users-body');
  if(!body) return;
  body.innerHTML = users.map(u => `
    <tr>
      <td style="font-weight:600">${u.username}</td>
      <td>${badge(u.role, u.role==='admin'?'#eff2fe':u.role==='manager'?'#f0fdf4':'#f8fafc', u.role==='admin'?'#4f6ef7':u.role==='manager'?'#16a34a':'#64748b')}</td>
      <td class="mono">${'•'.repeat(u.password.length)}</td>
      <td style="display:flex;gap:6px;align-items:center">
        <button class="btn btn-outline btn-sm" onclick="openEditUserModal('${u.username}')">✏ Ndrysho</button>
        ${u.username !== 'admin' ? `<button class="btn btn-danger btn-sm" onclick="deleteUser('${u.username}')">🗑</button>` : ''}
      </td>
    </tr>
  `).join('');
}

function addUser(){
  const emri = document.getElementById('u-emri').value.trim();
  const user = document.getElementById('u-username').value.trim();
  const pass = document.getElementById('u-password').value;
  const role = document.getElementById('u-role').value;
  if(!user || !pass){alert('Plotëso fushat e detyrueshme!');return;}
  if(users.find(u => u.username === user)){alert('Ky përdorues ekziston!');return;}
  users.push({username: user, password: pass, role: role, emri: emri || user});
  save(); closeModalById('modal-adduser'); renderAll();
  document.getElementById('u-emri').value = '';
  document.getElementById('u-username').value = '';
  document.getElementById('u-password').value = '';
}

function openEditUserModal(username){
  const u = users.find(x => x.username === username);
  if(!u) return;
  document.getElementById('eu-old-username').value = username;
  document.getElementById('eu-username').value = username;
  document.getElementById('eu-password').value = '';
  document.getElementById('eu-role').value = u.role;
  document.getElementById('eu-role').disabled = (username === 'admin');
  document.getElementById('modal-edituser').classList.add('open');
}

function saveEditUser(){
  const oldUsername = document.getElementById('eu-old-username').value;
  const newUsername = document.getElementById('eu-username').value.trim();
  const newPass = document.getElementById('eu-password').value;
  const newRole = document.getElementById('eu-role').value;
  if(!newUsername){alert('Emri nuk mund të jetë bosh!');return;}
  if(newUsername !== oldUsername && users.find(u => u.username === newUsername)){
    alert('Ky emër përdoruesi ekziston tashmë!'); return;
  }
  const idx = users.findIndex(u => u.username === oldUsername);
  if(idx === -1) return;
  users[idx].username = newUsername;
  if(newPass) users[idx].password = newPass;
  if(oldUsername !== 'admin') users[idx].role = newRole;
  save(); renderAll();
  closeModalById('modal-edituser');
  if(oldUsername === currentUser){
    alert('Të dhënat tuaja ndryshuan. Hyni sërish.');
    doLogout();
  }
}

function deleteUser(username){
  if(!confirm(`A jeni i sigurt që doni të fshini përdoruesin "${username}"?`)) return;
  users = users.filter(u => u.username !== username);
  save(); renderAll();
}

function isMobile(){ return window.innerWidth <= 768; }

// ── Pagination helper ──────────────────────────────────────────────
function renderPagination(containerId, currentPage, totalPages, onPageChange){
  const el=document.getElementById(containerId);
  if(!el)return;
  if(totalPages<=1){el.innerHTML='';return;}
  const btnStyle=(active)=>`style="padding:6px 12px;border:1.5px solid ${active?'var(--accent)':'var(--border)'};border-radius:8px;background:${active?'var(--accent)':'#fff'};color:${active?'#fff':'var(--text2)'};font-size:12px;font-weight:700;cursor:${active?'default':'pointer'};font-family:'Inter',sans-serif"`;
  let html=`<button ${btnStyle(false)} onclick="(${onPageChange.toString()})(${currentPage-1})" ${currentPage===1?'disabled style="opacity:.4;cursor:default"':''}>‹</button>`;
  const range=[];
  for(let i=1;i<=totalPages;i++){
    if(i===1||i===totalPages||Math.abs(i-currentPage)<=2)range.push(i);
    else if(range[range.length-1]!=='…')range.push('…');
  }
  range.forEach(p=>{
    if(p==='…')html+=`<span style="padding:6px 4px;color:var(--text3);font-size:12px">…</span>`;
    else html+=`<button ${btnStyle(p===currentPage)} onclick="${p!==currentPage?`(${onPageChange.toString()})(${p})`:''}">${p}</button>`;
  });
  html+=`<button ${btnStyle(false)} onclick="(${onPageChange.toString()})(${currentPage+1})" ${currentPage===totalPages?'disabled style="opacity:.4;cursor:default"':''}>›</button>`;
  html+=`<span style="font-size:11px;color:var(--text3);margin-left:4px">Faqja ${currentPage} / ${totalPages}</span>`;
  el.innerHTML=html;
}

function shTogglePjeserisht(){
  const v=document.getElementById('sh-pag').value;
  const row=document.getElementById('sh-pjeserisht-row');
  row.style.display=(v==='Pjesërisht'||v==='Debitor')?'block':'none';
  if(v==='Debitor'){document.getElementById('sh-paguar').value='0';shCalcBorxh();}
}

function shCalcBorxh(){
  let vlera=+document.getElementById('sh-vlera').value||0;
  const curr=document.getElementById('sh-curr').value;
  if(curr==='EUR' && exchangeRateEUR > 0) vlera = vlera * exchangeRateEUR;
  const paguar=+document.getElementById('sh-paguar').value||0;
  document.getElementById('sh-borxh').value=Math.max(0,Math.round(vlera-paguar));
}

function addShpenzim(){
  const kat=document.getElementById('sh-kat').value;
  const pershkrim=document.getElementById('sh-pershkrim').value.trim();
  let vlera=+document.getElementById('sh-vlera').value;
  const curr=document.getElementById('sh-curr').value;
  const data=document.getElementById('sh-data').value;
  const pag=document.getElementById('sh-pag').value;
  if(!pershkrim||!vlera||!data){alert('Plotëso fushat me yll!');return;}
  
  const rate = (curr==='EUR' && exchangeRateEUR > 0) ? exchangeRateEUR : 1;
  const vleraALL = vlera * rate;
  
  let status = 'paguar';
  let paguar = vleraALL;
  let borxh = 0;
  let afat = '';
  
  if(pag==='Debitor'){
    status='papaguar'; paguar=0; borxh=vleraALL;
  } else if(pag==='Pjesërisht'){
    paguar = (+document.getElementById('sh-paguar').value||0) * rate;
    borxh = vleraALL - paguar;
    afat = document.getElementById('sh-afat').value || '';
    status = borxh > 0 ? 'pjeserisht' : 'paguar';
  }
  
  const shId = 'SH'+Date.now();
  shpenzimet.push({id:shId,data,kat,pershkrim,vlera:vleraALL,pag});
  
  // Regjistrojmë në faturatMeta për arkivin
  faturatMeta[shId] = {status, paguar, borxh, afat, kli:'FURNIZUES (SHPENZIM)', data, valuta:curr, tvshOpt:'jo'};
  
  save();closeModalById('modal-addshpenzim');renderAll();
  ['sh-pershkrim','sh-vlera','sh-paguar','sh-borxh','sh-afat'].forEach(x=>{
    const el=document.getElementById(x); if(el) el.value='';
  });
  document.getElementById('sh-pag').value='Cash';
  document.getElementById('sh-pjeserisht-row').style.display='none';
}

function renderShpenzimet(){
  const totSh=shpenzimet.reduce((s,x)=>s+x.vlera,0);
  const totBl=blerjet.reduce((s,x)=>s+x.sasia*x.cmb,0);
  const kpi=document.getElementById('shp-kpi');
  if(kpi)kpi.innerHTML=kpiCard('💸',fmtL(totSh),'Total Shpenzime','red','')+kpiCard('📄',shpenzimet.length,'Numri i Shpenzimeve','amber','')+kpiCard('📦',fmtL(totBl),'Blerje (Kosto Mallrash)','amber','');
  const head=document.getElementById('shpenzime-head');
  const body=document.getElementById('shpenzime-body');
  if(!head||!body)return;
  head.innerHTML='<tr>'+['Data','Kategoria','Përshkrimi','Vlera','Pagesa',''].map(h=>`<th>${h}</th>`).join('')+'</tr>';

  // Grupojmë blerjet sipas faturës për t'i shfaqur si rreshta informues (nuk hyjnë te "Total Shpenzime")
  const blerjeByFat={};
  blerjet.forEach(b=>{
    if(!blerjeByFat[b.fat])blerjeByFat[b.fat]={fat:b.fat,furn:b.furn,data:b.data,total:0};
    blerjeByFat[b.fat].total+=b.sasia*b.cmb;
  });
  const blerjeGrouped=Object.values(blerjeByFat).sort((a,b)=>(a.data||'').localeCompare(b.data||''));

  const shpenzimeRows=shpenzimet.slice().reverse().map(s=>`
    <tr>
      <td>${s.data}</td>
      <td>${badge(s.kat,'#fffbeb','#d97706')}</td>
      <td style="font-weight:600;color:var(--text)">${s.pershkrim}</td>
      <td style="color:#dc2626;font-weight:700">${fmtL(s.vlera)}</td>
      <td>${badge(s.pag,'#f3f4f6','#6b7280')}</td>
      <td style="display:flex;gap:4px">
        <button class="btn btn-outline btn-sm" onclick="openEditShpenzimModal('${s.id}')">✏</button>
        <button class="btn btn-danger btn-sm" onclick="deleteShpenzim('${s.id}')">🗑</button>
      </td>
    </tr>`).join('');

  const blerjeSepRow=blerjeGrouped.length>0?`<tr><td colspan="6" style="background:linear-gradient(90deg,#fffbeb,transparent);padding:8px 14px;font-size:10.5px;font-weight:700;color:#b45309;text-transform:uppercase;letter-spacing:.08em;border-bottom:1px solid var(--border)">📦 Blerje (mallra për rishitje) — informacion, llogariten si Kosto Mallrash jo si Total Shpenzime</td></tr>`:'';
  const blerjeRows=blerjeGrouped.slice().reverse().map(b=>`
    <tr style="opacity:.85">
      <td>${b.data}</td>
      <td>${badge('Blerje','#fff7ed','#b45309')}</td>
      <td style="font-weight:600;color:var(--text)">${b.furn} <span class="mono" style="font-size:11px;color:var(--text3)">(${b.fat})</span></td>
      <td style="color:#dc2626;font-weight:700">${fmtL(b.total)}</td>
      <td>${badge('Kosto Mallrash','#f3f4f6','#6b7280')}</td>
      <td style="display:flex;gap:4px">
        <button class="btn btn-outline btn-sm" onclick="showFatureByFat('${b.fat}')" title="Shiko Faturën">🧾</button>
      </td>
    </tr>`).join('');

  body.innerHTML=(shpenzimeRows+blerjeSepRow+blerjeRows)||'<tr><td colspan="6" style="color:var(--text3);text-align:center;padding:2rem">Nuk ka shpenzime të regjistruara.</td></tr>';
}

function openEditShpenzimModal(id){
  const s=shpenzimet.find(x=>x.id===id);if(!s)return;
  document.getElementById('esh-id').value=id;
  document.getElementById('esh-data').value=s.data;
  document.getElementById('esh-kat').value=s.kat;
  document.getElementById('esh-pershkrim').value=s.pershkrim;
  document.getElementById('esh-vlera').value=s.vlera;
  document.getElementById('esh-pag').value=s.pag;
  
  const m = faturatMeta[id] || {};
  if(s.pag==='Pjesërisht' || s.pag==='Debitor'){
    document.getElementById('esh-pjeserisht-row').style.display='block';
    document.getElementById('esh-paguar').value=m.paguar||0;
    document.getElementById('esh-borxh').value=m.borxh||0;
    document.getElementById('esh-afat').value=m.afat||'';
  } else {
    document.getElementById('esh-pjeserisht-row').style.display='none';
  }
  
  document.getElementById('modal-editshpenzim').classList.add('open');
}

function saveEditShpenzim(){
  const id=document.getElementById('esh-id').value;
  const idx=shpenzimet.findIndex(x=>x.id===id);if(idx===-1)return;
  const data=document.getElementById('esh-data').value;
  const kat=document.getElementById('esh-kat').value;
  const pershkrim=document.getElementById('esh-pershkrim').value.trim();
  const vlera=+document.getElementById('esh-vlera').value;
  const pag=document.getElementById('esh-pag').value;
  
  shpenzimet[idx].data=data;
  shpenzimet[idx].kat=kat;
  shpenzimet[idx].pershkrim=pershkrim;
  shpenzimet[idx].vlera=vlera;
  shpenzimet[idx].pag=pag;
  
  let status = 'paguar';
  let paguar = vlera;
  let borxh = 0;
  let afat = '';
  
  if(pag==='Debitor'){
    status='papaguar'; paguar=0; borxh=vlera;
  } else if(pag==='Pjesërisht'){
    paguar = +document.getElementById('esh-paguar').value||0;
    borxh = vlera - paguar;
    afat = document.getElementById('esh-afat').value || '';
    status = borxh > 0 ? 'pjeserisht' : 'paguar';
  }
  
  faturatMeta[id] = {status, paguar, borxh, afat, kli:'FURNIZUES (SHPENZIM)', data, valuta:'ALL', tvshOpt:'jo'};
  
  save();closeModalById('modal-editshpenzim');renderAll();
}

function openEditAfatModal(fat){
  const m=getFatureMeta(fat);
  document.getElementById('eaf-fat').value=fat;
  document.getElementById('eaf-afat').value=m.afat||'';
  document.getElementById('eaf-borxh').value=m.borxh||0;
  document.getElementById('eaf-kli').textContent=m.kli||fat;
  document.getElementById('modal-editafat').classList.add('open');
}

function saveEditAfat(){
  const fat=document.getElementById('eaf-fat').value;
  if(!faturatMeta[fat])faturatMeta[fat]={};
  faturatMeta[fat].afat=document.getElementById('eaf-afat').value;
  faturatMeta[fat].borxh=+document.getElementById('eaf-borxh').value;
  save();closeModalById('modal-editafat');renderAll();
}

async function deleteShpenzim(id){
  const s=shpenzimet.find(x=>x.id===id);
  if(!confirm('⚠ Fshi shpenzimin: '+(s?'"'+s.pershkrim+'" — '+fmtL(s.vlera):id)+'?'))return;
  shpenzimet=shpenzimet.filter(s=>s.id!==id);
  save();renderAll();
  // Fshirje DIREKTE te Supabase si masë sigurie — sbSave() e anashkalon fshirjen
  // kur shpenzimet bëhet array bosh (rasti i shpenzimit të fundit), prandaj e bëjmë këtu shprehimisht.
  if(id){
    try{
      const {error}=await sb.from('shpenzimet').delete().eq('id',id);
      if(error) console.warn('⚠ Supabase delete (shpenzim) error:',error);
    }catch(e){ console.warn('⚠ Supabase delete (shpenzim) error:',e); }
  }
}

function buildBackupJSON(){
  return JSON.stringify({
    exportDate: today(),
    exportTime: new Date().toLocaleTimeString('sq-AL'),
    version: 'HSM Center v3 — Backup i Plotë',
    products, blerjet, shitjet, shpenzimet, faturatMeta, arketimet,
    xhiroHistoriku, xhiroDataFunditMbyllje, xhiroTsFundit,
    users, bizCfg
  }, null, 2);
}

async function doBackup(silent=false){
  const d = today();
  const filename = 'HSMCenter_Backup_'+d+'.json';
  const jsonData = buildBackupJSON();
  const blob = new Blob([jsonData], {type:'application/json'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
  if(!silent) alert('✓ Backup u shkarkua: '+filename);
  localStorage.setItem('tp_last_backup', d);
}

function handleRestoreFile(input){
  const file = input.files[0];
  if(!file) return;
  if(currentRole !== 'admin'){
    alert('⛔ Vetëm administratori mund të rikthejë një backup!');
    input.value = '';
    return;
  }
  const reader = new FileReader();
  reader.onload = function(e){
    let data;
    try{
      data = JSON.parse(e.target.result);
    }catch(err){
      alert('❌ Skedari i zgjedhur nuk është backup i vlefshëm (.json i dëmtuar).');
      input.value = '';
      return;
    }
    if(!data || typeof data !== 'object' || !('products' in data && 'shitjet' in data)){
      alert('❌ Ky skedar nuk duket si backup i HSM Center. Sigurohu që po zgjedh skedarin e duhur (HSMCenter_Backup_....json).');
      input.value = '';
      return;
    }
    const infoData = `📅 Data: ${data.exportDate||'—'}  🕐 Ora: ${data.exportTime||'—'}\n📦 Produkte: ${(data.products||[]).length}   🧾 Shitje: ${(data.shitjet||[]).length}\n⬇ Blerje: ${(data.blerjet||[]).length}   💸 Shpenzime: ${(data.shpenzimet||[]).length}\n👥 Përdorues: ${(data.users||[]).length}   📋 Mbyllje Xhiro: ${(data.xhiroHistoriku||[]).length}`;

    // Ofro zgjedhjen: Bashkim ose Zëvendësim
    const choice = window.confirm(
      `📂 BACKUP U GJI:\n${infoData}\n\n` +
      `Zgjidhni mënyrën e rikthimit:\n\n` +
      `✅ OK  →  BASHKIM (i sigurt)\n` +
      `        Ruan të dhënat aktuale + shton nga backup ato që mungojnë.\n\n` +
      `❌ Anulo  →  ZËVENDËSIM i plotë\n` +
      `        Fshin gjithçka aktuale dhe vendos backup-in.`
    );

    if(choice === true){
      // Konfirmo bashkimin
      if(!confirm('✅ Do të bëhet BASHKIM:\n• Të dhënat aktuale RUHEN\n• Nga backup shtohen vetëm ato që mungojnë (sipas ID/kodit)\n\nVazhdoni?')){
        input.value=''; return;
      }
      doMerge(data);
    } else {
      // Konfirmo zëvendësimin
      if(!confirm('⚠️ KUJDES! Do të ZËVENDËSOHET gjithçka!\n\nTë dhënat aktuale do të HUMBASIN. Jeni i sigurt?')){
        input.value=''; return;
      }
      doRestore(data);
    }
    input.value = '';
  };
  reader.onerror = function(){
    alert('❌ Gabim gjatë leximit të skedarit.');
    input.value = '';
  };
  reader.readAsText(file);
}

function doMerge(data){
  let stats = { products:0, shitjet:0, blerjet:0, shpenzimet:0, arketimet:0, xhiro:0, users:0 };

  // PRODUKTET — merge sipas id
  if(Array.isArray(data.products)){
    const existingIds = new Set(products.map(p => p.id));
    data.products.forEach(p => {
      if(!existingIds.has(p.id)){ products.push(p); stats.products++; }
    });
  }

  // SHITJET — merge sipas id
  if(Array.isArray(data.shitjet)){
    const existingIds = new Set(shitjet.map(s => s.id));
    data.shitjet.forEach(s => {
      if(!existingIds.has(s.id)){ shitjet.push(s); stats.shitjet++; }
    });
  }

  // BLERJET — merge sipas id
  if(Array.isArray(data.blerjet)){
    const existingIds = new Set(blerjet.map(b => b.id));
    data.blerjet.forEach(b => {
      if(!existingIds.has(b.id)){ blerjet.push(b); stats.blerjet++; }
    });
  }

  // SHPENZIMET — merge sipas id
  if(Array.isArray(data.shpenzimet)){
    const existingIds = new Set(shpenzimet.map(s => s.id));
    data.shpenzimet.forEach(s => {
      if(!existingIds.has(s.id)){ shpenzimet.push(s); stats.shpenzimet++; }
    });
  }

  // ARKETIMET — merge sipas id
  if(Array.isArray(data.arketimet)){
    const existingIds = new Set(arketimet.map(a => a.id));
    data.arketimet.forEach(a => {
      if(!existingIds.has(a.id)){ arketimet.push(a); stats.arketimet++; }
    });
  }

  // FATURAT META — merge sipas çelës (numri faturës)
  if(data.faturatMeta && typeof data.faturatMeta === 'object'){
    Object.keys(data.faturatMeta).forEach(key => {
      if(!(key in faturatMeta)){ faturatMeta[key] = data.faturatMeta[key]; }
    });
  }

  // XHIRO HISTORIKU — merge sipas ts (timestamp unik)
  if(Array.isArray(data.xhiroHistoriku)){
    const existingTs = new Set(xhiroHistoriku.map(x => x.ts));
    data.xhiroHistoriku.forEach(x => {
      if(!existingTs.has(x.ts)){ xhiroHistoriku.push(x); stats.xhiro++; }
    });
    // Rirendit kronologjikisht
    xhiroHistoriku.sort((a,b) => (a.ts||0)-(b.ts||0));
  }

  // USERS — merge sipas username (nuk ndryshon userin ekzistues)
  if(Array.isArray(data.users)){
    const existingUsernames = new Set(users.map(u => u.username));
    data.users.forEach(u => {
      if(!existingUsernames.has(u.username)){ users.push(u); stats.users++; }
    });
  }

  // bizCfg — nuk e prek nëse aktualja ekziston
  // (konfigurimet e biznesit aktual kanë prioritet)

  save();
  localStorage.setItem('tp_xhiro_data_fundit', xhiroDataFunditMbyllje);
  localStorage.setItem('tp_xhiro_ts_fundit', String(xhiroTsFundit));
  renderAll();

  alert(
    `✅ BASHKIMI U KRY ME SUKSES!\n\n` +
    `U shtuan nga backup:\n` +
    `📦 Produkte të reja: ${stats.products}\n` +
    `🧾 Shitje të reja: ${stats.shitjet}\n` +
    `⬇ Blerje të reja: ${stats.blerjet}\n` +
    `💸 Shpenzime të reja: ${stats.shpenzimet}\n` +
    `💰 Arkëtime të reja: ${stats.arketimet}\n` +
    `📋 Mbyllje xhiro të reja: ${stats.xhiro}\n` +
    `👥 Përdorues të rinj: ${stats.users}\n\n` +
    `Të dhënat ekzistuese mbetën të paprekura.`
  );
}

function doRestore(data){
  if('products' in data) products = data.products || [];
  if('blerjet' in data) blerjet = data.blerjet || [];
  if('shitjet' in data) shitjet = data.shitjet || [];
  if('shpenzimet' in data) shpenzimet = data.shpenzimet || [];
  if('faturatMeta' in data) faturatMeta = data.faturatMeta || {};
  if('arketimet' in data) arketimet = data.arketimet || [];
  if('xhiroHistoriku' in data) xhiroHistoriku = data.xhiroHistoriku || [];
  if('xhiroDataFunditMbyllje' in data) xhiroDataFunditMbyllje = data.xhiroDataFunditMbyllje || '';
  if('xhiroTsFundit' in data) xhiroTsFundit = data.xhiroTsFundit || 0;
  if('users' in data && Array.isArray(data.users) && data.users.length) users = data.users;
  if('bizCfg' in data && data.bizCfg) bizCfg = data.bizCfg;
  save();
  localStorage.setItem('tp_xhiro_data_fundit', xhiroDataFunditMbyllje);
  localStorage.setItem('tp_xhiro_ts_fundit', String(xhiroTsFundit));
  localStorage.setItem('tp_bizcfg', JSON.stringify(bizCfg));
  renderAll();
  alert('✅ Backup-i u rikthye me sukses! Çdo e dhënë (produkte, fatura, shitje, blerje, debitorë, shpenzime, përdorues, xhiro, konfigurime) u rifreskua.');
}

async function autoBackupCheck(){
  const last = localStorage.getItem('tp_last_backup')||'';
  const now = new Date();
  const firstOfMonth = now.getDate()===1;
  const thisMonth = now.toISOString().slice(0,7);
  const lastMonth = last.slice(0,7);
  if(firstOfMonth && lastMonth !== thisMonth){
    console.log('Auto-backup çdo fillim muaji...');
    await doBackup(true);
    const notif = document.createElement('div');
    notif.innerHTML = '💾 Auto-backup i muajit u krye! <span onclick="this.parentNode.remove()" style="cursor:pointer;float:right">×</span>';
    notif.style.cssText = 'position:fixed;bottom:1rem;right:1rem;background:#f0fdf4;border:1px solid #bbf7d0;color:#16a34a;padding:10px 16px;border-radius:10px;font-size:13px;font-weight:600;z-index:9999;box-shadow:0 4px 12px rgba(0,0,0,.1)';
    document.body.appendChild(notif);
    setTimeout(()=>notif.remove(), 6000);
  }
}
function getAlbanianDate() {
  const months = ["janar", "shkurt", "mars", "prill", "maj", "qershor", "korrik", "gusht", "shtator", "tetor", "nëntor", "dhjetor"];
  const now = new Date();
  const day = now.getDate();
  const month = months[now.getMonth()];
  const year = now.getFullYear();
  return `${day} ${month} ${year}`;
}

const now2=new Date();
document.getElementById('topbar-date').textContent=getAlbanianDate();
document.getElementById('sf-date').textContent=now2.getFullYear();
const savedCurr=localStorage.getItem('tp_currency')||'ALL';
if(savedCurr==='EUR')document.getElementById('currency-selector').value='EUR';
changeCurrency(savedCurr);
fetchExchangeRate();
updateClock();
setInterval(updateClock,1000);
initDraggableModals();
applyBizCfg();

(async()=>{
  const loginScreen=document.getElementById('login-screen');
  const loader=document.createElement('div');
  loader.style.cssText='position:fixed;inset:0;z-index:99999;background:linear-gradient(135deg,#0f1117,#1a1d2e);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1rem';
  loader.innerHTML=`<div style="width:52px;height:52px;background:linear-gradient(135deg,#4f6ef7,#7c5cfc);border-radius:16px;display:flex;align-items:center;justify-content:center;font-size:26px">💻</div>
    <div style="color:#fff;font-size:15px;font-weight:700">Duke u lidhur me bazën e të dhënave...</div>
    <div style="width:200px;height:4px;background:rgba(255,255,255,.1);border-radius:4px;overflow:hidden">
      <div style="height:100%;background:linear-gradient(90deg,#4f6ef7,#7c5cfc);animation:loadBar 1.5s ease-in-out infinite;width:60%" id="load-bar"></div>
    </div>`;
  const style=document.createElement('style');
  style.textContent='@keyframes loadBar{0%{transform:translateX(-100%)}100%{transform:translateX(200%)}}';
  document.head.appendChild(style);
  document.body.appendChild(loader);
  await sbLoad();
  applyBizCfg();
  loader.remove();
  await checkSession();
})();

function initMobile() {
  if (window.innerWidth > 768) return;

  if (!document.getElementById('mobile-menu-btn')) {
    const btn = document.createElement('button');
    btn.id = 'mobile-menu-btn';
    btn.innerHTML = '☰';
    btn.title = 'Menu';
    btn.onclick = toggleMobileSidebar;
    document.body.appendChild(btn);
  }

  if (!document.getElementById('mobile-overlay')) {
    const ov = document.createElement('div');
    ov.id = 'mobile-overlay';
    ov.onclick = closeMobileSidebar;
    document.body.appendChild(ov);
  }

  if (!document.getElementById('mobile-bottom-nav')) {
    const nav = document.createElement('nav');
    nav.id = 'mobile-bottom-nav';
    const items = [
      { icon: '📊', label: 'Dashboard', tab: 0 },
      { icon: '🛒', label: 'Shitje', action: 'shitje' },
      { icon: '📦', label: 'Produkte', tab: 1 },
      { icon: '👤', label: 'Debitorë', tab: 8 },
      { icon: '☰',  label: 'Menu', action: 'menu' },
    ];
    nav.innerHTML = items.map((it, i) =>
      `<button class="mob-btn${i===0?' active':''}" onclick="handleMobNav(this,${it.tab!==undefined?it.tab:'null'},'${it.action||''}')">
        <span class="mob-icon">${it.icon}</span>
        <span>${it.label}</span>
      </button>`
    ).join('');
    document.body.appendChild(nav);
  }

  document.querySelectorAll('#sidebar .nav-btn').forEach(btn => {
    if (!btn._mobileClose) {
      btn._mobileClose = true;
      btn.addEventListener('click', () => {
        if (window.innerWidth <= 768) closeMobileSidebar();
      });
    }
  });
}

function toggleMobileSidebar() {
  const sb  = document.getElementById('sidebar');
  const ov  = document.getElementById('mobile-overlay');
  const btn = document.getElementById('mobile-menu-btn');
  const open = sb.classList.toggle('mobile-open');
  ov.classList.toggle('show', open);
  if (btn) btn.innerHTML = open ? '✕' : '☰';
  if (open) {
    document.body.dataset.scrollY = String(window.scrollY || window.pageYOffset || 0);
    document.body.style.position = 'fixed';
    document.body.style.top = '-' + document.body.dataset.scrollY + 'px';
    document.body.style.left = '0';
    document.body.style.right = '0';
    document.body.style.width = '100%';
  } else {
    restoreBodyScroll();
  }
}

function restoreBodyScroll() {
  const y = parseInt(document.body.dataset.scrollY || '0', 10);
  document.body.style.position = '';
  document.body.style.top = '';
  document.body.style.left = '';
  document.body.style.right = '';
  document.body.style.width = '';
  window.scrollTo(0, y);
}

function closeMobileSidebar() {
  const sb  = document.getElementById('sidebar');
  const ov  = document.getElementById('mobile-overlay');
  const btn = document.getElementById('mobile-menu-btn');
  if (sb)  sb.classList.remove('mobile-open');
  if (ov)  ov.classList.remove('show');
  if (btn) btn.innerHTML = '☰';
  restoreBodyScroll();
}

function handleMobNav(el, tab, action) {
  document.querySelectorAll('#mobile-bottom-nav .mob-btn').forEach(b => b.classList.remove('active'));

  if (action === 'shitje') {
    el.classList.add('active');
    openShitjeModalDirect(null);
    return;
  }
  if (action === 'menu') {
    toggleMobileSidebar();
    return;
  }
  if (tab !== null) {
    el.classList.add('active');
    const navBtns = document.querySelectorAll('#sidebar .nav-btn');
    for (const b of navBtns) {
      const oc = b.getAttribute('onclick') || '';
      if (oc.includes('goTab(' + tab + ',')) {
        goTab(tab, b);
        break;
      }
    }
    closeMobileSidebar();
  }
}

const _origGoTab = goTab;
goTab = function(i, btn) {
  _origGoTab(i, btn);
  const mobBtns = document.querySelectorAll('#mobile-bottom-nav .mob-btn');
  const tabMap = { 0: 0, 1: 2, 8: 3 };
  mobBtns.forEach(b => b.classList.remove('active'));
  if (tabMap[i] !== undefined && mobBtns[tabMap[i]]) {
    mobBtns[tabMap[i]].classList.add('active');
  }
};

new MutationObserver(() => {
  const app = document.getElementById('app-wrapper');
  if (app && (app.style.display === 'flex' || app.classList.contains('visible'))) {
    setTimeout(initMobile, 100);
  }
}).observe(document.getElementById('app-wrapper'), { attributes: true, attributeFilter: ['style', 'class'] });

window.addEventListener('resize', initMobile);

// ---- Auto-update: kontrollon çdo 60 sek nëse ka version të ri dhe rifreskon vetë faqen ----
let _lastKnownAppVersion = null;
async function _checkAppVersion(){
  try{
    const res = await fetch('version.txt?_=' + Date.now(), { cache: 'no-store' });
    if(!res.ok) return;
    const v = (await res.text()).trim();
    if(_lastKnownAppVersion === null){
      _lastKnownAppVersion = v; // vendos bazën në kontrollin e parë
      return;
    }
    if(v !== _lastKnownAppVersion){
      location.reload(); // versioni ndryshoi -> rifresko automatikisht
    }
  }catch(e){ /* injoro gabimet e rrjetit */ }
}
_checkAppVersion();
setInterval(_checkAppVersion, 60000);

