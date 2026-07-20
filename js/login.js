const SUPA_URL = 'https://sfcabrvvnvbnccbwnfvi.supabase.co';
const SUPA_KEY = 'sb_publishable_aI6cQDd_9bjXfQ4HRwbiZw_POPTOZlV';
const sb = supabase.createClient(SUPA_URL, SUPA_KEY);

// Numëron ruajtjet drejt Supabase që janë ende "në rrugë".
// Përdoret për të paralajmëruar përdoruesin nëse provon të bëjë refresh/mbyllje
// përpara se ndryshimet e fundit (p.sh. një fshirje) të kenë arritur te databaza.
let _sbPending = 0;
window.addEventListener('beforeunload', function(e){
  if(_sbPending > 0){
    e.preventDefault();
    e.returnValue = 'Ndryshimet e fundit ende po ruhen. Prit pak sekonda para se ta mbyllësh ose rifreskosh faqen.';
    return e.returnValue;
  }
});

async function sbLoad(){
  try {
    const [u,p,bl,sh,shp,fm,cfg] = await Promise.all([
      sb.from('users').select('*'),
      sb.from('products').select('*'),
      sb.from('blerjet').select('*'),
      sb.from('shitjet').select('*'),
      sb.from('shpenzimet').select('*'),
      sb.from('faturat_meta').select('*'),
      sb.from('biz_cfg').select('*').eq('id',1).single()
    ]);
    if(u.data?.length) users = u.data;
    else {
      // Supabase nuk ktheu users, mbaj users lokale
      const saved = localStorage.getItem('tp_users');
      if(saved) users = JSON.parse(saved);
    }
    if(p.data?.length) products = p.data;
    if(bl.data?.length) blerjet = bl.data.map(b=>({...b,cmb:Number(b.cmb),sasia:Number(b.sasia)}));
    if(sh.data?.length) shitjet = sh.data.map(s=>({...s,cms:Number(s.cms),sasia:Number(s.sasia),borxh:Number(s.borxh||0),ts:s.ts?Number(s.ts):null}));
    if(shp.data?.length) shpenzimet = shp.data.map(s=>({...s,vlera:Number(s.vlera)}));
    if(fm.data?.length){
      faturatMeta={};
      fm.data.forEach(f=>faturatMeta[f.fat]={status:f.status,paguar:Number(f.paguar),borxh:Number(f.borxh)});
    }
    if(cfg.data) {
      const adresaStr = cfg.data.adresa||'';
      const parts = adresaStr.split(',').map(s=>s.trim());
      const qytetiGuess = parts.length>1 ? parts[parts.length-1] : '';
      const rrugaGuess = parts.length>1 ? parts.slice(0,-1).join(', ') : adresaStr;
      bizCfg={emri:cfg.data.emri||'',nipt:cfg.data.nipt||'',tel:cfg.data.tel||'',adresa:adresaStr,rruga:rrugaGuess,qyteti:qytetiGuess,footer:cfg.data.footer||'',prefSh:cfg.data.pref_sh||'F',prefBl:cfg.data.pref_bl||'BL',pad:cfg.data.pad||4};
    }
    console.log('✓ Supabase: të dhënat u ngarkuan');
  } catch(e){ console.warn('⚠ Supabase load error:', e); }
}

async function sbSave(){
  _sbPending++;
  // Nëse ka dy a më shumë rreshta me të njëjtin ID, Supabase e refuzon TË GJITHË
  // upsert-in (jo vetëm rreshtin problematik). E pastrojmë këtu, duke mbajtur
  // gjithmonë kopjen e fundit (më të freskët) të secilit ID.
  function dedupeById(arr, key){
    const map = new Map();
    for(const item of arr){ if(item && item[key]!==undefined && item[key]!==null) map.set(String(item[key]), item); }
    return Array.from(map.values());
  }
  try {
    products = dedupeById(products,'id');
    users = dedupeById(users,'username');
    shitjet = dedupeById(shitjet,'id');
    blerjet = dedupeById(blerjet,'id');
    shpenzimet = dedupeById(shpenzimet,'id');
    // Merge shitjet, blerjet, shpenzimet IDs currently in memory
    const shitjetIds = shitjet.map(s=>s.id).filter(Boolean);
    const blerjetIds = blerjet.map(b=>b.id).filter(Boolean);
    const shpenzimetIds = shpenzimet.map(s=>s.id).filter(Boolean);
    const fatMetaFats = Object.keys(faturatMeta);

    // Delete rows from Supabase that no longer exist in memory.
    // E RËNDËSISHME: nëse lista lokale është bosh (0 rreshta), NUK fshijmë gjithçka
    // te Supabase — thjesht anashkalojmë fshirjen për këtë tabelë. Fshirja e plotë
    // e një tabele bazuar vetëm te një gjendje kalimtare lokale bosh ishte shumë e rrezikshme.
    const delOps = [];
    const delLabels = [];
    if(shitjetIds.length > 0){
      delOps.push(sb.from('shitjet').delete().not('id','in','('+shitjetIds.map(x=>`"${x}"`).join(',')+')'));
      delLabels.push('shitjet(del)');
    }
    if(blerjetIds.length > 0){
      delOps.push(sb.from('blerjet').delete().not('id','in','('+blerjetIds.map(x=>`"${x}"`).join(',')+')'));
      delLabels.push('blerjet(del)');
    }
    if(shpenzimetIds.length > 0){
      delOps.push(sb.from('shpenzimet').delete().not('id','in','('+shpenzimetIds.map(x=>`"${x}"`).join(',')+')'));
      delLabels.push('shpenzimet(del)');
    }
    if(fatMetaFats.length > 0){
      delOps.push(sb.from('faturat_meta').delete().not('fat','in','('+fatMetaFats.map(x=>`"${x}"`).join(',')+')'));
      delLabels.push('faturat_meta(del)');
    }
    const delResults = await Promise.allSettled(delOps);
    delResults.forEach((r,i)=>{ if(r.status==='rejected' || r.value?.error) console.warn('⚠ Supabase DELETE dështoi te', delLabels[i], ':', r.reason||r.value.error); });

    // Upsert current data
    const upsertLabels = ['products','users','biz_cfg'];
    const upsertOps = [
      sb.from('products').upsert(products),
      sb.from('users').upsert(users),
      sb.from('biz_cfg').upsert({id:1,emri:bizCfg.emri,nipt:bizCfg.nipt,tel:bizCfg.tel,adresa:bizCfg.adresa,footer:bizCfg.footer,pref_sh:bizCfg.prefSh,pref_bl:bizCfg.prefBl,pad:bizCfg.pad}),
    ];
    if(shitjet.length){ upsertOps.push(sb.from('shitjet').upsert(shitjet)); upsertLabels.push('shitjet'); }
    if(blerjet.length){ upsertOps.push(sb.from('blerjet').upsert(blerjet)); upsertLabels.push('blerjet'); }
    if(shpenzimet.length){ upsertOps.push(sb.from('shpenzimet').upsert(shpenzimet)); upsertLabels.push('shpenzimet'); }
    if(fatMetaFats.length){
      Object.entries(faturatMeta).forEach(([fat,v])=>{
        upsertOps.push(sb.from('faturat_meta').upsert({fat,status:v.status,paguar:v.paguar||0,borxh:v.borxh||0}));
        upsertLabels.push('faturat_meta:'+fat);
      });
    }
    const upsertResults = await Promise.allSettled(upsertOps);
    const failed = [];
    upsertResults.forEach((r,i)=>{
      if(r.status==='rejected'){ console.warn('⚠ Supabase UPSERT dështoi te', upsertLabels[i], ':', r.reason); failed.push(upsertLabels[i]+': '+(r.reason?.message||r.reason)); }
      else if(r.value?.error){ console.warn('⚠ Supabase UPSERT dështoi te', upsertLabels[i], ':', r.value.error); failed.push(upsertLabels[i]+': '+r.value.error.message); }
    });
    if(failed.length){
      throw new Error('Dështoi ruajtja te: '+failed.join(' | '));
    }

    console.log('✓ Supabase: të dhënat u ruajtën');
  } catch(e){
    console.warn('⚠ Supabase save error:', e);
    if(typeof showToast==='function'){
      const t=document.createElement('div');
      t.innerHTML='⚠ Ndryshimet NUK u ruajtën në server! ('+(e.message||e)+')';
      t.style.cssText='position:fixed;bottom:1.5rem;right:1.5rem;background:#fef2f2;border:1.5px solid #fca5a5;color:#b91c1c;padding:10px 18px;border-radius:10px;font-size:13px;font-weight:700;z-index:9999;box-shadow:0 4px 16px rgba(0,0,0,.12);max-width:360px';
      document.body.appendChild(t);
      setTimeout(()=>t.remove(),6000);
    }
  } finally {
    _sbPending--;
  }
}

async function checkSession() {
  try {
    const { data: { session } } = await sb.auth.getSession();
    if (session) {
      currentUser = session.user.email;
      currentRole = session.user.user_metadata?.role || 'admin';
      document.getElementById('login-screen').style.display = 'none';
      const app = document.getElementById('app-wrapper');
      app.style.display = 'flex';
      app.classList.add('visible');
      initSidebar();
      applyBizCfg();
      loadCfgFields();
      _applyRoleUI(currentRole);
      renderAll();
      autoBackupCheck();
      return;
    }
  } catch(e) {
    console.warn('checkSession error:', e);
  }

  try {
    const saved = sessionStorage.getItem('tp_local_session');
    if (saved) {
      const s = JSON.parse(saved);
      const userOk = users.find(u => u.username === s.user && u.role === s.role);
      if (userOk) {
        currentUser = s.user;
        currentRole = s.role;
        document.getElementById('login-screen').style.display = 'none';
        const app = document.getElementById('app-wrapper');
        app.style.display = 'flex';
        app.classList.add('visible');
        initSidebar();
        applyBizCfg();
        loadCfgFields();
        _applyRoleUI(currentRole);
        renderAll();
        autoBackupCheck();
        return;
      } else {
        sessionStorage.removeItem('tp_local_session');
      }
    }
  } catch(e) {
    console.warn('local session check error:', e);
  }

  document.getElementById('login-screen').style.display = 'flex';
}

function toggleSidebar(){
  const sb=document.getElementById('sidebar');
  sb.classList.toggle('collapsed');
  localStorage.setItem('sidebarCollapsed', sb.classList.contains('collapsed')?'1':'0');
}
function initSidebar(){
  if(localStorage.getItem('sidebarCollapsed')==='1'){
    document.getElementById('sidebar').classList.add('collapsed');
  }
}

let currentLoginRole = 'user';
let currentRole = null;
let currentUser = null;
let currentCurrency = 'ALL';
let exchangeRate = 1;
let exchangeRateEUR = 1;

function setLoginRole(role) {
  currentLoginRole = role;
  document.getElementById('role-user-btn').classList.toggle('active', role === 'user');
  document.getElementById('role-admin-btn').classList.toggle('active', role === 'admin');
}
_setLoginRoleReal = setLoginRole;

async function doLogout(){
  if(!confirm('A jeni i sigurt që doni të dilni nga sistemi?'))return;
  try { await sb.auth.signOut(); } catch(e) {}
  sessionStorage.removeItem('tp_local_session');
  currentRole=null;
  currentUser=null;
  document.getElementById('app-wrapper').style.display='none';
  document.getElementById('login-screen').style.display='flex';
  document.getElementById('login-user').value='';
  document.getElementById('login-pass').value='';
  document.getElementById('login-err').style.display='none';
  document.getElementById('login-user').focus();
}

function updateClock(){
  const now=new Date();
  const h=String(now.getHours()).padStart(2,'0');
  const m=String(now.getMinutes()).padStart(2,'0');
  const s=String(now.getSeconds()).padStart(2,'0');
  document.getElementById('topbar-clock').textContent=h+':'+m+':'+s;
}

function updateBlerjeLabels(){
  const curr=document.getElementById('b-curr').value;
  const label=curr==='EUR'?'Çmimi Blerjes (€) *':'Çmimi Blerjes (L) *';
  document.querySelector('label[for="b-cmb"]').textContent=label;
}

function updateShitjeLabels(){
  const curr=document.getElementById('s-curr').value;
  const labels=document.querySelectorAll('#modal-addshitje label');
  labels.forEach(l=>{
    if(l.textContent.includes('Çmimi')) l.textContent=curr==='EUR'?'Çmimi (€)':'Çmimi (L)';
    if(l.textContent.includes('Paguar')) l.textContent=curr==='EUR'?'Paguar Tani (€)':'Paguar Tani (L)';
    if(l.textContent.includes('Borxhi')) l.textContent=curr==='EUR'?'Borxhi Mbetur (€)':'Borxhi Mbetur (L)';
  });
  const prodId=document.getElementById('s-prod').value;
  if(prodId){
    const p=getProd(prodId);
    if(p){
      let price = p.cms;
      if(curr === 'EUR' && exchangeRateEUR > 0) price = price / exchangeRateEUR;
      document.getElementById('s-cms').value = price.toFixed(2);
    }
  }
  if(cart.length > 0) renderCart();
}

function updateShpenzimLabel(){
  const curr=document.getElementById('sh-curr').value;
  document.getElementById('sh-vlera-label').textContent=curr==='EUR'?'Vlera (€) *':'Vlera (L) *';
}

async function fetchExchangeRate(){
  try{
    const res=await fetch('https://api.exchangerate-api.com/v4/latest/EUR');
    const data=await res.json();
    if(data && data.rates && data.rates.ALL){
      exchangeRateEUR=data.rates.ALL;
      console.log('✓ Kursi i EUR/ALL: '+exchangeRateEUR);
      const rateVal = document.getElementById('exchange-rate-value');
      if(rateVal) rateVal.textContent = exchangeRateEUR.toFixed(2);
      updateAllCurrencyLabels();
    }
  }catch(err){
    console.log('⚠ Gabim në marrjen e kursit: '+err.message);
    exchangeRateEUR=94.6;
    const rateVal = document.getElementById('exchange-rate-value');
    if(rateVal) rateVal.textContent = exchangeRateEUR.toFixed(2);
    updateAllCurrencyLabels();
  }
}

function updateAllCurrencyLabels(){
  updateBlerjeLabels();
  updateShitjeLabels();
  updateShpenzimLabel();
}

async function ensureRealTimeRate(){
  await fetchExchangeRate();
}

async function changeCurrency(curr){
  currentCurrency=curr;
  if(curr==='EUR'){
    await ensureRealTimeRate();
    exchangeRate=exchangeRateEUR;
  } else {
    exchangeRate=1;
  }
  localStorage.setItem('tp_currency',curr);
  renderAll();
}

function fmtL(n){
  const val=(n||0)/exchangeRate;
  const symbol=currentCurrency==='EUR'?'€':'L';
  return val.toLocaleString('sq-AL',{maximumFractionDigits:2, minimumFractionDigits:2})+' '+symbol;
}

function fmtModal(n, curr){
  const symbol = curr === 'EUR' ? '€' : 'L';
  return n.toLocaleString('sq-AL',{maximumFractionDigits:2, minimumFractionDigits:2})+' '+symbol;
}

function _applyRoleUI(role) {
  // Emri i përdoruesit në topbar
  const userNameEl = document.getElementById('topbar-user-name');
  const userIconEl = document.getElementById('topbar-user-icon');
  if(userNameEl) {
    const userObj = users.find(u => u.username === currentUser);
    const displayName = userObj?.emri || currentUser || '—';
    userNameEl.textContent = displayName;
    if(userIconEl) userIconEl.textContent = role === 'admin' ? '🔑' : role === 'manager' ? '🛠' : '👤';
  }

  const navBtns = document.querySelectorAll('.nav-btn');
  const navUsers = document.getElementById('nav-users');
  const navCfg = document.getElementById('nav-cfg');

  // Butoni "Fshi të Gjitha Faturat" — vetëm admin
  const btnFshiFaturat = document.getElementById('btn-fshi-te-gjitha-faturat');
  if(btnFshiFaturat) btnFshiFaturat.style.display = role === 'admin' ? 'inline-flex' : 'none';

  // Xhiro — kufizime për user
  const xhiroMbyllKpi = document.getElementById('xhiro-mbyll-kpi');
  const xhiroExportBtns = document.getElementById('xhiro-export-btns');
  if(role === 'user') {
    if(xhiroMbyllKpi) { xhiroMbyllKpi.style.display = 'none'; xhiroMbyllKpi.style.pointerEvents = 'none'; }
    if(xhiroExportBtns) xhiroExportBtns.style.display = 'none';
  } else {
    if(xhiroMbyllKpi) { xhiroMbyllKpi.style.display = ''; xhiroMbyllKpi.style.pointerEvents = ''; }
    if(xhiroExportBtns) xhiroExportBtns.style.display = 'flex';
  }

  if(role === 'admin'){
    navBtns.forEach(b => b.style.display='flex');
    if(navUsers) navUsers.style.display='flex';
    if(navCfg) navCfg.style.display='flex';
    const pBtns=document.getElementById('prod-admin-btns'); if(pBtns) pBtns.style.display='flex';
    const btnDelAll=document.getElementById('btn-delete-all'); if(btnDelAll) btnDelAll.style.display='inline-block';
    const uZone=document.getElementById('upload-zone'); if(uZone) uZone.style.display='block';
    const dBlerje=document.getElementById('dash-blerje-btn'); if(dBlerje) dBlerje.style.display='flex';
    const sBlerje=document.getElementById('sidebar-blerje-btn'); if(sBlerje) sBlerje.style.display='flex';
  } else if(role === 'manager') {
    navBtns.forEach((b,i) => {
      const isBackup = b.getAttribute('onclick')?.includes('doBackup');
      b.style.display = (i===6 && !isBackup) ? 'none' : 'flex';
    });
    if(navUsers) navUsers.style.display = 'none';
    if(navCfg) navCfg.style.display = 'none';
    const pBtns=document.getElementById('prod-admin-btns'); if(pBtns) pBtns.style.display='flex';
    const btnDelAll=document.getElementById('btn-delete-all'); if(btnDelAll) btnDelAll.style.display='none';
    const uZone=document.getElementById('upload-zone'); if(uZone) uZone.style.display='block';
    const dBlerje=document.getElementById('dash-blerje-btn'); if(dBlerje) dBlerje.style.display='flex';
    const sBlerje2=document.getElementById('sidebar-blerje-btn'); if(sBlerje2) sBlerje2.style.display='flex';
  } else {
    navBtns.forEach((b,i) => {
      const isBackup = b.getAttribute('onclick')?.includes('doBackup');
      const isRestore = b.getAttribute('onclick')?.includes('file-restore');
      if(isBackup || isRestore){ b.style.display='none'; return; }
      b.style.display=[3,4,6,7,8,9,10].includes(i)?'none':'flex';
    });
    if(navUsers) navUsers.style.display = 'none';
    if(navCfg) navCfg.style.display = 'none';
    const pBtns=document.getElementById('prod-admin-btns'); if(pBtns) pBtns.style.display='none';
    const btnDelAll=document.getElementById('btn-delete-all'); if(btnDelAll) btnDelAll.style.display='none';
    const uZone=document.getElementById('upload-zone'); if(uZone) uZone.style.display='none';
    const dBlerje=document.getElementById('dash-blerje-btn'); if(dBlerje) dBlerje.style.display='none';
    const sBlerje3=document.getElementById('sidebar-blerje-btn'); if(sBlerje3) sBlerje3.style.display='none';
  }
}

function resetAdminPass(){
  if(!confirm('Kjo do të rivendosë fjalëkalimin e admin-it në "admin123".\nVazhdoj?')) return;
  const idx = users.findIndex(u=>u.username==='admin');
  if(idx>=0){ users[idx].password='admin123'; users[idx].role='admin'; }
  else { users.unshift({username:'admin',password:'admin123',role:'admin'}); }
  localStorage.setItem('tp_users',JSON.stringify(users));
  sessionStorage.removeItem('tp_local_session');
  document.getElementById('login-user').value='admin';
  document.getElementById('login-pass').value='admin123';
  document.getElementById('login-err').style.display='none';
  alert('✅ Fjalëkalimi u rivendos: admin / admin123');
}
_resetAdminPassReal = resetAdminPass;

async function doLogin() {
  const username = document.getElementById('login-user').value.trim();
  const password = document.getElementById('login-pass').value;
  const errEl    = document.getElementById('login-err');
  const submitBtn = document.querySelector('.login-submit');

  if (!username || !password) {
    errEl.textContent = 'Ju lutem plotësoni të dhënat.';
    errEl.style.display = 'block';
    return;
  }

  if (username.includes('@')) {
    if (submitBtn) { submitBtn.disabled=true; submitBtn.innerHTML='Duke u lidhur...'; }
    try {
      const { data, error } = await sb.auth.signInWithPassword({ email: username, password });
      if (!error && data.session) {
        currentUser = data.user.email;
        currentRole = data.user.user_metadata?.role || 'admin';
        errEl.style.display = 'none';
        document.getElementById('login-screen').style.display = 'none';
        const app = document.getElementById('app-wrapper');
        app.style.display = 'flex';
        app.classList.add('visible');
        initSidebar(); applyBizCfg(); loadCfgFields();
        _applyRoleUI(currentRole);
        renderAll(); autoBackupCheck();
        return;
      }
    } catch(e) { /* vazhdo tek login lokal */ }
    if (submitBtn) { submitBtn.disabled=false; submitBtn.innerHTML='🔓 Hyr në Sistem'; }
  }

  const userFound = users.find(u => u.username === username && u.password === password);
  if (userFound) {
    currentRole = userFound.role;
    currentUser = userFound.username;
    sessionStorage.setItem('tp_local_session', JSON.stringify({user:currentUser, role:currentRole}));
    errEl.style.display = 'none';
    document.getElementById('login-screen').style.display = 'none';
    const app = document.getElementById('app-wrapper');
    app.style.display = 'flex';
    app.classList.add('visible');
    initSidebar(); applyBizCfg(); loadCfgFields();
    _applyRoleUI(currentRole);
    renderAll(); autoBackupCheck();
  } else {
    errEl.textContent = '❌ Emri ose fjalëkalimi është i gabuar.';
    errEl.style.display = 'block';
    if (submitBtn) { submitBtn.disabled=false; submitBtn.innerHTML='🔓 Hyr në Sistem'; }
  }
}

// Register real implementations for early stubs
_doLoginReal = doLogin;

