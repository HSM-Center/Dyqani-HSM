function openShitjeModal(){
  cart=[];
  renderCart();
  document.getElementById('s-prod-search').value='';
  document.getElementById('s-prod').value='';
  document.getElementById('s-prod-dropdown').style.display='none';
  document.getElementById('s-cms').value='';
  document.getElementById('s-sasia').value='1';
  sCurrentPriceType='1';
  document.querySelectorAll('.ptype-btn').forEach(b=>b.classList.toggle('active', b.dataset.type==='1'));
  const njeEl=document.getElementById('s-nje');if(njeEl)njeEl.value='Cope';
  document.getElementById('modal-addshitje').classList.add('open');
  document.getElementById('s-data').value=today();
  document.getElementById('s-pag').value='Cash';
  document.getElementById('pjeserisht-row').style.display='none';
  document.getElementById('s-afat').value='';
  document.getElementById('s-paguar').value='';
  document.getElementById('s-borxh').value='';
  document.getElementById('s-fat').value=nextFatNr('sh');
  document.addEventListener('click', closeProdDropdown, true);
  const ov=document.getElementById('modal-addshitje');
  ov.classList.remove('minimized');
  removeTaskbarPill('modal-addshitje');
  const box=document.getElementById('shitje-box');
  box.style.top='';
  box.style.left='';
  box.style.right='';
  box.style.transform='';
  box.style.width='900px';
  box.style.height='';
  box.classList.remove('maximized');
  box._prevStyle=null;
  const maxBtn=ov.querySelector('.modal-header button[title="Rikthe Madhësinë"]');
  if(maxBtn){maxBtn.textContent='□';maxBtn.title='Maksimizo';}
}

function openShitjeModalDirect(btn) {
  openShitjeModal();
}

let svCart = [];
function openServisModalDirect() {
  svCart = [];
  renderServisCart();
  document.getElementById('sv-fat').value = nextFatNr('sv');
  document.getElementById('sv-data').value = today();
  document.getElementById('sv-kli').value = '';
  document.getElementById('sv-desc').value = '';
  document.getElementById('sv-cm').value = '';
  document.getElementById('sv-notes').value = '';
  document.getElementById('modal-addservis').classList.add('open');
}

function svAddRow() {
  const desc = document.getElementById('sv-desc').value.trim();
  const sasia = +document.getElementById('sv-sasia').value || 1;
  const nje = document.getElementById('sv-nje').value;
  const cm = +document.getElementById('sv-cm').value || 0;
  const notes = document.getElementById('sv-notes').value.trim();
  if (!desc) { alert('Shkruaj përshkrimin!'); return; }
  const fullName = notes ? desc + " — " + notes : desc;
  svCart.push({
    name: fullName,
    nje: nje,
    sasia: sasia,
    cm: cm,
    total: Math.round(sasia * cm * 100) / 100
  });
  document.getElementById('sv-desc').value = '';
  document.getElementById('sv-cm').value = '';
  document.getElementById('sv-notes').value = '';
  renderServisCart();
}

function renderServisCart() {
  const el = document.getElementById('sv-cart-items');
  const tot = document.getElementById('sv-cart-total');
  const curr = document.getElementById('sv-curr').value;
  if (!svCart.length) {
    el.innerHTML = '<div style="padding:1.5rem;text-align:center;color:var(--text3)">Nuk ka rreshta të shtuar.</div>';
    tot.innerHTML = '';
    return;
  }
  let rows = svCart.map((c, i) => `
    <tr>
      <td style="padding:10px;border-bottom:1px solid #eee">${c.name}</td>
      <td style="padding:10px;border-bottom:1px solid #eee;text-align:center">${c.sasia} ${c.nje}</td>
      <td style="padding:10px;border-bottom:1px solid #eee;text-align:right">${fmtModal(c.cm, curr)}</td>
      <td style="padding:10px;border-bottom:1px solid #eee;text-align:right;font-weight:700">${fmtModal(c.total, curr)}</td>
      <td style="padding:10px;border-bottom:1px solid #eee;text-align:center"><button class="btn btn-danger btn-sm" onclick="svCart.splice(${i},1);renderServisCart()">✕</button></td>
    </tr>`).join('');
  el.innerHTML = `<table style="width:100%;border-collapse:collapse;font-size:13px"><thead><tr style="background:#f8fafc"><th style="text-align:left;padding:10px">Përshkrimi</th><th style="padding:10px">Sasia</th><th style="text-align:right;padding:10px">Çmimi</th><th style="text-align:right;padding:10px">Totali</th><th></th></tr></thead><tbody>${rows}</tbody></table>`;
  const sub = svCart.reduce((s, c) => s + c.total, 0);
  const tvsh = document.getElementById('sv-tvsh-opt').value === 'po' ? sub * 0.2 : 0;
  tot.innerHTML = `Total: ${fmtModal(sub, curr)}`;
}

async function addServis() {
  if (!svCart.length) { alert('Shto të paktën një shërbim!'); return; }
  const fat = document.getElementById('sv-fat').value.trim();
  const kli = document.getElementById('sv-kli').value.trim();
  const data = document.getElementById('sv-data').value;
  const pag = document.getElementById('sv-pag').value;
  if (!fat || !kli) { alert('Plotëso faturën dhe klientin!'); return; }
  
  const curr = document.getElementById('sv-curr').value;
  const rate = (curr === 'EUR' && exchangeRateEUR > 0) ? exchangeRateEUR : 1;
  const tsNow = Date.now();
  
  const grossTotal = svCart.reduce((s, c) => s + c.total, 0);
  const tvshOpt = document.getElementById('sv-tvsh-opt').value;
  const tvsh = tvshOpt === 'po' ? grossTotal * 0.2 : 0;
  const subtotal = grossTotal - tvsh;
  const totalFat = grossTotal;

  faturatMeta[fat] = { status: 'paguar', paguar: totalFat * rate, borxh: 0, afat: '', kli, data, valuta: curr, tvshOpt };
  
  svCart.forEach(c => {
    shitjet.push({
      id: 'S' + tsNow + Math.random().toString(36).slice(2, 6),
      fat: fat,
      data: data,
      kli: kli,
      prod: 'SERVIS',
      name: c.name,
      nje: c.nje, // Ruajmë njësinë
      sasia: c.sasia,
      cms: Math.round(c.cm * rate * 100) / 100,
      pag: pag,
      ts: tsNow
    });
  });
  
  save();
  renderAll();
  closeModalById('modal-addservis');
  showToast('✓ Servisi u regjistrua me sukses!');
  
  currentFatureData = {
    tipi: 'SHITJEJE',
    fat: fat,
    data: data,
    pale: kli,
    pag: pag,
    items: svCart.map(c => ({ name: c.name, kodi: 'SERVIS', nje: c.nje, sasia: c.sasia, cm: c.cm, total: c.total })),
    subtotal: subtotal,
    tvsh: tvsh,
    total: totalFat,
    status: 'paguar',
    paguar: totalFat,
    borxh: 0,
    afat: '',
    valuta: curr
  };
  showFatureInline();
}

function closeProdDropdown(e){
  const wrap=document.getElementById('s-prod-search')?.closest('[style*="position:relative"]');
  if(wrap&&!wrap.contains(e.target)){
    document.getElementById('s-prod-dropdown').style.display='none';
  }
}

function prodSearchInput(q){
  const dd=document.getElementById('s-prod-dropdown');
  const trimmed=q.trim().toLowerCase();
  const list=products.filter(p=>{
    if(!trimmed)return true;
    return p.name.toLowerCase().includes(trimmed)||p.id.toLowerCase().includes(trimmed)||p.kat.toLowerCase().includes(trimmed);
  }).slice(0,12);
  if(!list.length){
    dd.innerHTML='<div style="padding:10px 14px;font-size:13px;color:var(--text3)">Nuk u gjet asnjë produkt</div>';
    dd.style.display='block';return;
  }
  dd.innerHTML=list.map(p=>`
    <div onclick="selectProd('${p.id}')" style="padding:9px 14px;cursor:pointer;border-bottom:1px solid #f3f4f6;transition:background .1s" onmouseover="this.style.background='#eff2fe'" onmouseout="this.style.background=''">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <div>
          <span style="font-weight:600;font-size:13px;color:var(--text)">${p.name}</span>
          <span style="font-size:10px;color:var(--text3);margin-left:6px" class="mono">${p.id}</span>
          <span style="font-size:11px;font-weight:700;background:#eff2fe;color:#4f6ef7;padding:1px 7px;border-radius:10px;margin-left:6px">${p.nje}</span>
        </div>
        <div style="text-align:right">
          <div style="font-weight:700;color:var(--accent);font-size:13px">${fmtL(p.cms)}<span style="font-size:10px;color:var(--text3);font-weight:400">/${p.nje}</span></div>
          <div style="font-size:11px;color:${p.stok<=p.min?'#dc2626':'#16a34a'}">Stok: ${p.stok} ${p.nje} ${p.stok<=p.min?'⚠':''}</div>
        </div>
      </div>
    </div>`).join('');
  dd.style.display='block';
}

let sCurrentPriceType='1';
function setPriceType(type){
  sCurrentPriceType=type;
  document.querySelectorAll('.ptype-btn').forEach(b=>b.classList.toggle('active', b.dataset.type===type));
  const curr=document.getElementById('s-curr').value;
  if(type==='pref'){
    document.getElementById('s-cms').value='0';
    document.getElementById('s-cms').focus();
    document.getElementById('s-cms').select();
    return;
  }
  const prodId=document.getElementById('s-prod').value;
  if(!prodId)return;
  const p=getProd(prodId);
  if(!p)return;
  let price = type==='2' ? (p.cms2!=null && p.cms2>0 ? p.cms2 : p.cms) : p.cms;
  if(curr === 'EUR' && exchangeRateEUR > 0) price = price / exchangeRateEUR;
  document.getElementById('s-cms').value = price.toFixed(2);
}
function selectProd(id){
  const p=getProd(id);
  if(!p)return;
  const curr = document.getElementById('s-curr').value;
  document.getElementById('s-prod').value=id;
  document.getElementById('s-prod-search').value=p.name+' — '+p.id;
  if(sCurrentPriceType==='pref'){
    document.getElementById('s-cms').value='0';
  } else {
    let price = sCurrentPriceType==='2' ? (p.cms2!=null && p.cms2>0 ? p.cms2 : p.cms) : p.cms;
    if(curr === 'EUR' && exchangeRateEUR > 0) price = price / exchangeRateEUR;
    document.getElementById('s-cms').value = price.toFixed(2);
  }
  document.getElementById('s-prod-dropdown').style.display='none';
  const njeSelect=document.getElementById('s-nje');
  if(njeSelect){
    const opts=[...njeSelect.options].map(o=>o.value);
    if(opts.includes(p.nje))njeSelect.value=p.nje;
    else njeSelect.value='Cope';
  }
  if(sCurrentPriceType==='pref'){
    document.getElementById('s-cms').focus();
    document.getElementById('s-cms').select();
  } else {
    document.getElementById('s-sasia').focus();
  }
}
function openEditShitjeModal(fat){
  const shitjePerFat=shitjet.filter(s=>s.fat===fat);
  const meta=getFatureMeta(fat);
  // Nëse shitja nuk gjendet në array por ka meta (debitor i arkivuar), lejo editimin e meta-s
  const sh=shitjePerFat[0]||null;
  document.getElementById('esh-fat').value=fat;
  document.getElementById('esh-data').value=sh?.data||meta.data||'';
  document.getElementById('esh-kli').value=sh?.kli||meta.kli||'';
  document.getElementById('esh-pag').value=sh?.pag||meta.pag||'Cash';
  document.getElementById('esh-tvsh-opt').value=meta.tvshOpt||'jo';
  document.getElementById('esh-status').value=meta.status||'paguar';
  document.getElementById('esh-borxh').value=meta.borxh||0;
  document.getElementById('esh-paguar').value=meta.paguar||0;
  document.getElementById('esh-afat').value=meta.afat||'';
  document.getElementById('modal-editshitje').classList.add('open');
}

function saveEditShitje(){
  const fat=document.getElementById('esh-fat').value;
  const data=document.getElementById('esh-data').value;
  const kli=document.getElementById('esh-kli').value.trim();
  const pag=document.getElementById('esh-pag').value;
  const tvshOpt=document.getElementById('esh-tvsh-opt').value;
  const status=document.getElementById('esh-status').value;
  const borxh=+document.getElementById('esh-borxh').value||0;
  const paguar=+document.getElementById('esh-paguar').value||0;
  const afat=document.getElementById('esh-afat').value;
  if(!data||!kli){alert('Plotëso fushat e detyrueshme!');return;}
  const shitjePerFat=shitjet.filter(s=>s.fat===fat);
  // Edito shitjet nëse ekzistojnë, përndryshe vetëm meta-n (rast debitori pa shitje)
  if(shitjePerFat.length){
    shitjePerFat.forEach(s=>{
      s.data=data;
      s.kli=kli;
      s.pag=pag;
      if(data === today()) s.ts = Date.now();
    });
  }
  const oldMeta=faturatMeta[fat]||{};
  faturatMeta[fat]={...oldMeta,status,paguar,borxh,afat,kli,data,tvshOpt};
  save();closeModalById('modal-editshitje');renderAll();
  alert('✓ Shitja u ndryshua me sukses!');
}

function updatePrevHeader(){
  const nr = document.getElementById('prev-fat')?.value || '—';
  const data = document.getElementById('prev-data')?.value || '—';
  const kli = document.getElementById('prev-kli')?.value || '—';
  const el_nr = document.getElementById('prev-hdr-nr');
  const el_data = document.getElementById('prev-hdr-data');
  const el_kli = document.getElementById('prev-hdr-kli');
  const el_biz = document.getElementById('prev-hdr-bizname');
  const el_adr = document.getElementById('prev-hdr-adresa');
  const el_nipt = document.getElementById('prev-hdr-nipt');
  if(el_nr) el_nr.textContent = nr || '—';
  if(el_data) el_data.textContent = data || '—';
  if(el_kli) el_kli.textContent = kli || '—';
  if(el_biz) el_biz.textContent = bizCfg.emri || '—';
  const adrParts = [bizCfg.rruga, bizCfg.qyteti].filter(Boolean);
  if(el_adr) el_adr.textContent = adrParts.join(', ') + (bizCfg.tel ? ' · Tel: ' + bizCfg.tel : '');
  if(el_nipt && bizCfg.nipt) el_nipt.textContent = 'NIPT: ' + bizCfg.nipt;
}

function openPreventivModal(){
  prevCart=[];
  renderPrevCart();
  document.getElementById('prev-fat').value='PREV-'+Date.now().toString().slice(-6);
  document.getElementById('prev-data').value=today();
  document.getElementById('prev-kli').value='Klient';
  document.getElementById('prev-prod-search').value='';
  document.getElementById('prev-prod').value='';
  document.getElementById('prev-cms').value='';
  document.getElementById('prev-sasia').value='1';
  document.getElementById('prev-curr').value='ALL';
  document.getElementById('prev-tvsh-opt').value='jo';
  document.getElementById('modal-preventiv').classList.add('open');
  document.addEventListener('click', closeProdDropdownPrev, true);
  updatePrevHeader();
}

function prodSearchInputPrev(val){
  const dd=document.getElementById('prev-prod-dropdown');
  if(!val||!val.trim()){dd.style.display='none';return;}
  const q=val.trim().toLowerCase();
  const match=products.filter(p=>
    (p.name||'').toLowerCase().includes(q)||
    (p.id||'').toLowerCase().includes(q)||
    (p.kat||'').toLowerCase().includes(q)
  ).slice(0,12);
  if(!match.length){
    dd.innerHTML='<div style="padding:10px 14px;font-size:13px;color:#94a3b8">Nuk u gjet asnjë produkt</div>';
    dd.style.display='block';return;
  }
  dd.innerHTML=match.map(p=>`
    <div onclick="selectProdPrev('${p.id}','${(p.name||'').replace(/'/g,"\\'")}',${p.cms})" style="padding:10px 14px;cursor:pointer;border-bottom:1px solid #f1f5f9;transition:background .1s" onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background=''">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <div>
          <span style="font-weight:700;font-size:13px;color:#1e293b">${p.name}</span>
          <span style="font-size:10px;color:#94a3b8;margin-left:6px;font-family:'JetBrains Mono',monospace">${p.id}</span>
        </div>
        <div style="text-align:right">
          <div style="font-weight:800;color:#334155;font-size:13px">${fmtL(p.cms)}</div>
          <div style="font-size:11px;color:${p.stok<=p.min?'#dc2626':'#16a34a'}">Stok: ${p.stok} ${p.nje}</div>
        </div>
      </div>
    </div>`).join('');
  dd.style.display='block';
}

function selectProdPrev(id,name,cms){
  document.getElementById('prev-prod').value=id;
  document.getElementById('prev-prod-search').value=name;
  document.getElementById('prev-cms').value=cms;
  document.getElementById('prev-prod-dropdown').style.display='none';
  const p=getProd(id);
  if(p){
    const njeEl=document.getElementById('prev-nje');
    if(njeEl){const opt=[...njeEl.options].find(o=>o.value===p.nje);if(opt)njeEl.value=opt.value;}
  }
  document.getElementById('prev-sasia').focus();
  document.getElementById('prev-sasia').select();
}

function closeProdDropdownPrev(e){
  const dd=document.getElementById('prev-prod-dropdown');
  if(dd && !dd.contains(e.target)) dd.style.display='none';
}

function prevCartAdd(){
  const id=document.getElementById('prev-prod').value;
  const name=document.getElementById('prev-prod-search').value;
  const sasia=+document.getElementById('prev-sasia').value;
  const cms=+document.getElementById('prev-cms').value;
  const nje=document.getElementById('prev-nje').value;
  if(!name||!sasia||!cms){alert('Zgjidh produktin, sasinë dhe çmimin!');return;}
  prevCart.push({prodId:id,name,sasia,cms,nje,total:sasia*cms});
  renderPrevCart();
  document.getElementById('prev-prod').value='';
  document.getElementById('prev-prod-search').value='';
  document.getElementById('prev-cms').value='';
  document.getElementById('prev-prod-search').focus();
}

function renderPrevCart(){
  const div=document.getElementById('prev-cart-items');
  const totDiv=document.getElementById('prev-cart-total');
  if(!div)return;
  if(!prevCart.length){
    div.innerHTML='<div style="margin:0 0 1rem;padding:2rem;text-align:center;color:#94a3b8;background:#f8fafc;border-radius:12px;border:2px dashed #e2e8f0;font-size:13px;font-weight:600">Nuk ka artikuj të shtuar. Kërko dhe shto produktet sipër.</div>';
    totDiv.innerHTML='';
    return;
  }
  div.innerHTML=`<div style="border-radius:12px;overflow:hidden;border:2px solid #e2e8f0;margin-bottom:.5rem">
    <table style="width:100%;border-collapse:collapse;font-size:13px">
    <thead><tr style="background:#1e293b">
      <th style="text-align:left;padding:11px 16px;color:#cbd5e1;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.07em">Artikulli</th>
      <th style="text-align:center;padding:11px 12px;color:#cbd5e1;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.07em">Sasia</th>
      <th style="text-align:right;padding:11px 16px;color:#cbd5e1;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.07em">Çmimi</th>
      <th style="text-align:right;padding:11px 16px;color:#cbd5e1;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.07em">Total</th>
      <th style="width:44px"></th>
    </tr></thead>
    <tbody>${prevCart.map((c,i)=>`<tr style="border-bottom:1px solid #f1f5f9;background:${i%2===0?'#fff':'#f8fafc'}">
      <td style="padding:12px 16px;font-weight:700;color:#1e293b">${c.name}</td>
      <td style="text-align:center;padding:12px;color:#64748b;font-weight:600">${c.sasia} <span style="font-size:11px;color:#94a3b8">${c.nje}</span></td>
      <td style="text-align:right;padding:12px 16px;color:#475569;font-weight:600">${fmtL(c.cms)}</td>
      <td style="text-align:right;padding:12px 16px;font-weight:800;color:#1e293b;font-size:14px">${fmtL(c.total)}</td>
      <td style="text-align:center;padding:8px"><button class="btn btn-danger btn-sm" onclick="prevCart.splice(${i},1);renderPrevCart()" style="font-size:12px;padding:4px 9px">✕</button></td>
    </tr>`).join('')}</tbody>
  </table></div>`;
  const grossTotal=prevCart.reduce((s,c)=>s+c.total,0);
  const tvshOpt=document.getElementById('prev-tvsh-opt').value;
  const tvsh=tvshOpt==='po'?grossTotal*0.2:0;
  const subtot=grossTotal-tvsh;
  totDiv.innerHTML=`<div style="display:flex;justify-content:flex-end;gap:2rem;align-items:center">
    <span style="font-size:13px;color:#64748b">Nëntotali: <strong style="color:#334155">${fmtL(subtot)}</strong></span>
    <span style="font-size:13px;color:#64748b">TVSH (20%): <strong style="color:#334155">${fmtL(tvsh)}</strong></span>
    <span style="font-size:20px;font-weight:900;color:#1e293b;background:#e2e8f0;padding:10px 20px;border-radius:10px">TOTAL: ${fmtL(grossTotal)}</span>
  </div>`;
}

function updatePrevLabels(){
  const curr=document.getElementById('prev-curr').value;
  document.getElementById('prev-cms-label').textContent=`Çmimi (${curr==='EUR'?'€':'L'})`;
  renderPrevCart();
}

async function addPreventiv(){
  await ensureRealTimeRate();
  const fat=document.getElementById('prev-fat').value.trim() || ('PREV-'+Date.now());
  const data=document.getElementById('prev-data').value;
  const kli=document.getElementById('prev-kli').value.trim();
  const curr=document.getElementById('prev-curr').value;
  const tvshOpt=document.getElementById('prev-tvsh-opt').value;
  if(!prevCart.length){alert('Shto artikuj në preventiv!');return;}
  
  const rate=(curr==='EUR'&&exchangeRateEUR>0)?exchangeRateEUR:1;
  const cartALL=prevCart.map(c=>({...c,cms:c.cms*rate,total:c.sasia*c.cms*rate}));
  const grossTotal=cartALL.reduce((s,c)=>s+c.total,0);
  const tvsh=tvshOpt==='po'?grossTotal*0.2:0;
  const subtotal=grossTotal-tvsh;
  const totalFat=grossTotal;
  
  // Regjistrojmë si preventiv (pa prekur stokun)
  faturatMeta[fat]={status:'preventiv',paguar:0,borxh:0,afat:'',kli,data,valuta:curr,tvshOpt};
  
  const tsNow=Date.now();
  cartALL.forEach(c=>{
    shitjet.push({id:'S'+tsNow+Math.random().toString(36).slice(2,6),fat,data,kli,prod:c.prodId,sasia:c.sasia,cms:c.cms,pag:'Preventiv',ts:tsNow});
  });
  
  save();renderAll();
  
  // Shfaqim faturën për printim
  const items=prevCart.map(c=>({name:c.name,kodi:c.prodId,nje:c.nje,sasia:c.sasia,cm:c.cms,total:c.total}));
  currentFatureData={tipi:'SHITJEJE',fat,data,pale:kli,pag:'Preventiv',items,subtotal,tvsh,total:totalFat,status:'preventiv',paguar:0,borxh:0,afat:'',valuta:curr};
  
  closeModalById('modal-preventiv');
  showFatureInline();
  showToast('✓ Preventivi u regjistrua me sukses!');
}

function toggleInlineShitje(show){
  const el=document.getElementById('dash-shitje-inline');
  const willShow = (show===undefined) ? (el.style.display==='none'||!el.style.display) : show;
  if(willShow){
    const fatEl=document.getElementById('dash-fature-inline');
    if(fatEl) fatEl.style.display='none';
    dsResetForm();
    el.style.display='block';
    // remove taskbar pill if exists
    removeTaskbarPill('inline-shitje');
    setTimeout(()=>{el.scrollIntoView({behavior:'smooth',block:'start'});},60);
  } else {
    el.style.display='none';
    document.removeEventListener('click', dsCloseProdDropdown, true);
    removeTaskbarPill('inline-shitje');
  }
}

function minimizeInlineShitje(){
  const el=document.getElementById('dash-shitje-inline');
  el.style.display='none';
  // Add taskbar pill to restore
  const bar=document.getElementById('window-taskbar');
  if(!document.getElementById('pill-inline-shitje')){
    const pill=document.createElement('div');
    pill.className='taskbar-pill';
    pill.id='pill-inline-shitje';
    pill.style.background='linear-gradient(135deg,#22c55e,#16a34a)';
    pill.innerHTML=`<span>🛒 Shitje e Re</span><span class="pill-x">✕</span>`;
    pill.querySelector('span:first-child').onclick=()=>{
      el.style.display='block';
      pill.remove();
      if(!bar.children.length) bar.classList.remove('show');
      setTimeout(()=>{el.scrollIntoView({behavior:'smooth',block:'start'});},60);
    };
    pill.querySelector('.pill-x').onclick=(e)=>{
      e.stopPropagation();
      toggleInlineShitje(false);
    };
    bar.appendChild(pill);
    bar.classList.add('show');
  }
}

function dsResetForm(){
  dsCart=[];
  dsRenderCart();
  document.getElementById('ds-prod-search').value='';
  document.getElementById('ds-prod').value='';
  document.getElementById('ds-prod-dropdown').style.display='none';
  document.getElementById('ds-cms').value='';
  document.getElementById('ds-sasia').value='1';
  dsPriceType='1';
  document.querySelectorAll('#dash-shitje-inline .ptype-btn').forEach(b=>b.classList.toggle('active', b.dataset.type==='1'));
  const njeEl=document.getElementById('ds-nje'); if(njeEl) njeEl.value='Cope';
  document.getElementById('ds-data').value=today();
  document.getElementById('ds-pag').value='Cash';
  document.getElementById('ds-pjeserisht-row').style.display='none';
  document.getElementById('ds-afat').value='';
  document.getElementById('ds-paguar').value='';
  document.getElementById('ds-borxh').value='';
  document.getElementById('ds-curr').value='ALL';
  document.getElementById('ds-tvsh-opt').value='jo';
  document.getElementById('ds-kli').value='';
  document.getElementById('ds-fat').value=nextFatNr('sh');
  document.addEventListener('click', dsCloseProdDropdown, true);
}

function dsCloseProdDropdown(e){
  const wrap=document.getElementById('ds-prod-search')?.closest('[style*="position:relative"]');
  if(wrap && !wrap.contains(e.target)){
    document.getElementById('ds-prod-dropdown').style.display='none';
  }
}

function dsTogglePjeserisht(){
  const v=document.getElementById('ds-pag').value;
  const row=document.getElementById('ds-pjeserisht-row');
  row.style.display=(v==='Pjesërisht'||v==='Debitor')?'block':'none';
  if(v==='Debitor'){document.getElementById('ds-paguar').value='0';dsCalcBorxh();}
}

function dsCalcBorxh(){
  const tot=dsCart.reduce((s,c)=>s+c.total,0);
  const paguar=+document.getElementById('ds-paguar').value||0;
  document.getElementById('ds-borxh').value=Math.max(0,Math.round(tot-paguar));
}

function dsUpdateLabels(){
  const curr=document.getElementById('ds-curr').value;
  const labels=document.querySelectorAll('#dash-shitje-inline label');
  labels.forEach(l=>{
    if(l.textContent.includes('Çmimi')) l.textContent=curr==='EUR'?'Çmimi (€)':'Çmimi (L)';
    if(l.textContent.includes('Paguar')) l.textContent=curr==='EUR'?'Paguar Tani (€)':'Paguar Tani (L)';
    if(l.textContent.includes('Borxhi')) l.textContent=curr==='EUR'?'Borxhi Mbetur (€)':'Borxhi Mbetur (L)';
  });
  const prodId=document.getElementById('ds-prod').value;
  if(prodId){
    const p=getProd(prodId);
    if(p){
      let price=p.cms;
      if(curr==='EUR' && exchangeRateEUR>0) price=price/exchangeRateEUR;
      document.getElementById('ds-cms').value=price.toFixed(2);
    }
  }
  if(dsCart.length>0) dsRenderCart();
}

function dsSetPriceType(type){
  dsPriceType=type;
  document.querySelectorAll('#dash-shitje-inline .ptype-btn').forEach(b=>b.classList.toggle('active', b.dataset.type===type));
  const curr=document.getElementById('ds-curr').value;
  if(type==='pref'){
    document.getElementById('ds-cms').value='0';
    document.getElementById('ds-cms').focus();
    document.getElementById('ds-cms').select();
    return;
  }
  const prodId=document.getElementById('ds-prod').value;
  if(!prodId)return;
  const p=getProd(prodId);
  if(!p)return;
  let price = type==='2' ? (p.cms2!=null && p.cms2>0 ? p.cms2 : p.cms) : p.cms;
  if(curr==='EUR' && exchangeRateEUR>0) price=price/exchangeRateEUR;
  document.getElementById('ds-cms').value=price.toFixed(2);
}

function dsSelectProd(id){
  const p=getProd(id);
  if(!p)return;
  const curr=document.getElementById('ds-curr').value;
  document.getElementById('ds-prod').value=id;
  document.getElementById('ds-prod-search').value=p.name+' — '+p.id;
  if(dsPriceType==='pref'){
    document.getElementById('ds-cms').value='0';
  } else {
    let price = dsPriceType==='2' ? (p.cms2!=null && p.cms2>0 ? p.cms2 : p.cms) : p.cms;
    if(curr==='EUR' && exchangeRateEUR>0) price=price/exchangeRateEUR;
    document.getElementById('ds-cms').value=price.toFixed(2);
  }
  document.getElementById('ds-prod-dropdown').style.display='none';
  const njeSelect=document.getElementById('ds-nje');
  if(njeSelect && p.nje){
    const opt=[...njeSelect.options].find(o=>o.value===p.nje||o.textContent===p.nje);
    if(opt) njeSelect.value=opt.value;
  }
  document.getElementById('ds-sasia').focus();
  document.getElementById('ds-sasia').select();
}

function dsProdSearchInput(q){
  const dd=document.getElementById('ds-prod-dropdown');
  const trimmed=q.trim().toLowerCase();
  const list=products.filter(p=>{
    if(!trimmed)return true;
    return p.name.toLowerCase().includes(trimmed)||p.id.toLowerCase().includes(trimmed)||p.kat.toLowerCase().includes(trimmed);
  }).slice(0,12);
  if(!list.length){
    dd.innerHTML='<div style="padding:10px 14px;font-size:13px;color:var(--text3)">Nuk u gjet asnjë produkt</div>';
    dd.style.display='block';return;
  }
  dd.innerHTML=list.map(p=>`
    <div onclick="dsSelectProd('${p.id}')" style="padding:9px 14px;cursor:pointer;border-bottom:1px solid #f3f4f6;transition:background .1s" onmouseover="this.style.background='#eff2fe'" onmouseout="this.style.background=''">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <div>
          <span style="font-weight:600;font-size:13px;color:var(--text)">${p.name}</span>
          <span style="font-size:10px;color:var(--text3);margin-left:6px" class="mono">${p.id}</span>
          <span style="font-size:11px;font-weight:700;background:#eff2fe;color:#4f6ef7;padding:1px 7px;border-radius:10px;margin-left:6px">${p.nje}</span>
        </div>
        <div style="text-align:right">
          <div style="font-weight:700;color:var(--accent);font-size:13px">${fmtL(p.cms)}<span style="font-size:10px;color:var(--text3);font-weight:400">/${p.nje}</span></div>
          <div style="font-size:11px;color:${p.stok<=p.min?'#dc2626':'#16a34a'}">Stok: ${p.stok} ${p.nje} ${p.stok<=p.min?'⚠':''}</div>
        </div>
      </div>
    </div>`).join('');
  dd.style.display='block';
}

function dsCartAdd(){
  const prodId=document.getElementById('ds-prod').value;
  const sasia=+document.getElementById('ds-sasia').value;
  const nje=document.getElementById('ds-nje').value;
  const cms=+document.getElementById('ds-cms').value;
  if(!prodId){alert('Zgjidh produktin!');return;}
  if(!sasia||sasia<=0){alert('Sasia duhet të jetë > 0!');return;}
  if(!cms||cms<1){alert('Plotëso çmimin!');return;}
  const p=getProd(prodId);
  if(!p){alert('Produkti nuk u gjet!');return;}
  const avail=p.stok - dsCart.filter(c=>c.prodId===prodId).reduce((s,c)=>s+c.sasia,0);
  if(sasia>avail){alert('Stoku i pamjaftueshëm! Disponibël: '+avail+' '+p.nje);return;}
  const ex=dsCart.findIndex(c=>c.prodId===prodId&&c.cms===cms&&c.nje===nje);
  if(ex>=0){dsCart[ex].sasia+=sasia;dsCart[ex].total=Math.round(dsCart[ex].sasia*dsCart[ex].cms*100)/100;}
  else dsCart.push({prodId,name:p.name,nje,sasia,cms,total:Math.round(sasia*cms*100)/100});
  document.getElementById('ds-sasia').value='1';
  document.getElementById('ds-cms').value='';
  document.getElementById('ds-prod').value='';
  document.getElementById('ds-prod-search').value='';
  document.getElementById('ds-prod-dropdown').style.display='none';
  dsRenderCart();
  const srch = document.getElementById('ds-prod-search');
  if(srch) srch.focus();
}

function dsCartRemove(i){dsCart.splice(i,1);dsRenderCart();}

function dsRenderCart(){
  const el=document.getElementById('ds-cart-items');
  const tot=document.getElementById('ds-cart-total');
  const curr=document.getElementById('ds-curr').value;
  if(!dsCart.length){
    el.innerHTML='<div style="color:var(--text3);font-size:13px;text-align:center;padding:.75rem;border:1px dashed var(--border);border-radius:8px">Nuk ka artikuj. Shto produktet sipër.</div>';
    tot.innerHTML='';
    return;
  }
  el.innerHTML=`<table style="font-size:13px"><thead><tr>${['Produkti','Sasia','Çmimi','Totali',''].map(h=>`<th>${h}</th>`).join('')}</tr></thead><tbody>
    ${dsCart.map((c,i)=>`<tr>
      <td style="font-weight:600;color:var(--text)">${c.name}<br><span class="mono">${c.prodId}</span></td>
      <td style="text-align:center">${c.sasia} ${c.nje}</td>
      <td style="text-align:right">${fmtModal(c.cms, curr)}</td>
      <td style="text-align:right;font-weight:700;color:var(--accent)">${fmtModal(c.total, curr)}</td>
      <td><button class="btn btn-danger btn-sm" onclick="dsCartRemove(${i})">✕</button></td>
    </tr>`).join('')}
  </tbody></table>`;
  const grossTotal=dsCart.reduce((s,c)=>s+c.total,0);
  const tvshOpt=document.getElementById('ds-tvsh-opt').value;
  const tvsh=tvshOpt==='po'?grossTotal*0.2:0;
  const subtot=grossTotal-tvsh;
  const total=grossTotal;
  tot.innerHTML=`Nëntotali: <strong>${fmtModal(subtot, curr)}</strong> &nbsp;|&nbsp; TVSH: <strong>${fmtModal(tvsh, curr)}</strong> &nbsp;|&nbsp; <span style="color:var(--accent);font-size:15px">TOTAL: ${fmtModal(total, curr)}</span>`;
}

// 🔥 FUNKSIONI I RREGULLUAR PËR SHITJE INLINE ME TIMESTAMP
async function dsAddShitje() {
    await ensureRealTimeRate();
    let fat = document.getElementById('ds-fat').value.trim();
    if(!fat) fat = 'AUTO-' + Date.now().toString().slice(-6);
    const kli = document.getElementById('ds-kli').value.trim();
    const data = document.getElementById('ds-data').value;
    const pag = document.getElementById('ds-pag').value;
    if (!kli) { alert('Shkruaj emrin e klientit!'); return; }
    if (!dsCart.length) { alert('Shto të paktën një artikull!'); return; }
    
    if (shitjet.find(s => s.fat === fat)) {
        alert('Gabim: Fatura ' + fat + ' ekziston! Ju lutem përdorni një numër të ri faturë.');
        document.getElementById('ds-fat').value = nextFatNr('sh');
        return;
    }
    
    const curr = document.getElementById('ds-curr').value;
    const rate = (curr === 'EUR' && exchangeRateEUR > 0) ? exchangeRateEUR : 1;
    const cartSnapshot = dsCart.map(c => ({ ...c }));
    const cartALL = dsCart.map(c => ({
        ...c,
        cms: Math.round(c.cms * rate * 100) / 100,
        total: Math.round(c.sasia * c.cms * rate * 100) / 100
    }));
    
    const grossTotal = cartALL.reduce((s, c) => s + c.total, 0);
    const tvshOpt = document.getElementById('ds-tvsh-opt').value;
    const tvsh = (tvshOpt === 'po') ? grossTotal * 0.2 : 0;
    const subtotal = grossTotal - tvsh;
    const totalFat = grossTotal;
    
    let status = 'paguar';
    let paguar = totalFat;
    let borxh = 0;
    let afat = '';
    
    if (pag === 'Debitor') {
        status = 'papaguar';
        paguar = 0;
        borxh = totalFat;
    } else if (pag === 'Pjesërisht') {
        paguar = Math.round((+document.getElementById('ds-paguar').value || 0) * rate * 100) / 100;
        borxh = totalFat - paguar;
        afat = document.getElementById('ds-afat').value || '';
        status = (borxh > 0) ? 'pjeserisht' : 'paguar';
    } else if (pag === 'Preventiv') {
        status = 'preventiv';
        paguar = 0;
        borxh = 0;
    }
    
    faturatMeta[fat] = { status, paguar, borxh, afat, kli, data, valuta: curr, tvshOpt };
    
    // 🔥 NDRYSHIMI KRYESOR - timestamp për xhiron
    const tsNow = Date.now();
    cartALL.forEach(c => {
        shitjet.push({
            id: 'S' + tsNow + Math.random().toString(36).slice(2, 6),
            fat: fat,
            data: data,
            kli: kli,
            prod: c.prodId,
            sasia: c.sasia,
            cms: c.cms,
            pag: pag,
            ts: tsNow
        });
        const p = products.find(x => x.id === c.prodId);
        if (p && pag !== 'Preventiv') p.stok -= c.sasia;
    });
    
    save();
    renderAll();
    
    // Resetimi i plotë për faturë të re
    dsCart = [];
    document.getElementById('ds-kli').value = 'Klient';
    document.getElementById('ds-pag').value = 'Cash';
    document.getElementById('ds-pjeserisht-row').style.display = 'none';
    document.getElementById('ds-fat').value = nextFatNr('sh');
    document.getElementById('ds-paguar').value = '';
    document.getElementById('ds-borxh').value = '';
    document.getElementById('ds-afat').value = '';
    dsRenderCart();
    
    showToast('✓ Shitja u regjistrua me sukses!');
    
    const items = cartSnapshot.map(c => ({
        name: c.name,
        kodi: c.prodId,
        nje: c.nje,
        sasia: c.sasia,
        cm: c.cms,
        total: c.total
    }));
    const grossSnap = items.reduce((s, i) => s + i.total, 0);
    const tvshSnap = (tvshOpt === 'po') ? grossSnap * 0.2 : 0;
    const subSnap = grossSnap - tvshSnap;
    currentFatureData = {
        tipi: 'SHITJEJE',
        fat: fat,
        data: data,
        pale: kli,
        pag: pag,
        items: items,
        subtotal: subSnap,
        tvsh: tvshSnap,
        total: grossSnap,
        status: status,
        paguar: paguar / rate,
        borxh: borxh / rate,
        afat: afat,
        valuta: curr
    };
    showFatureInline();
    // Focus automatik tek search produkti për faturë të re
    setTimeout(function(){
      var srch = document.getElementById('ds-prod-search');
      if(srch){
        srch.value='';
        srch.dispatchEvent(new Event('input'));
        srch.focus();
        srch.scrollIntoView({behavior:'smooth', block:'center'});
      }
    }, 400);
}

function togglePjesërisht(){
  const v=document.getElementById('s-pag').value;
  const row=document.getElementById('pjeserisht-row');
  row.style.display=(v==='Pjesërisht'||v==='Debitor')?'block':'none';
  if(v==='Debitor'){document.getElementById('s-paguar').value='0';calcBorxh();}
}

function calcBorxh(){
  const tot=cart.reduce((s,c)=>s+c.total,0);
  const paguar=+document.getElementById('s-paguar').value||0;
  document.getElementById('s-borxh').value=Math.max(0,Math.round(tot-paguar));
}

function getFatureStatus(fat){
  const meta=faturatMeta[fat];
  if(!meta)return 'paguar';
  return meta.status||'paguar';
}
function getFatureMeta(fat){return faturatMeta[fat]||{};}

function statusBadge(status){
  const map={paguar:['#f0fdf4','#16a34a','✓ Paguar'],papaguar:['#fef2f2','#dc2626','✗ Pa Paguar'],pjeserisht:['#f5f3ff','#7c3aed','◑ Pjesërisht'],preventiv:['#f5f3ff','#7c3aed','📝 Preventiv']};
  const [bg,col,txt]=map[status]||map.paguar;
  return `<span class="badge" style="background:${bg};color:${col}">${txt}</span>`;
}

function updateDebBadge(){
  const n=Object.values(faturatMeta).filter(m=>m.status==='papaguar'||m.status==='pjeserisht').length;
  const el=document.getElementById('deb-badge');
  if(el){el.style.display=n>0?'inline':'none';el.textContent=n;}
}

function servisAdd() {
    const desc = document.getElementById('s-serv-desc').value.trim();
    const sasia = +document.getElementById('s-serv-sasia').value || 1;
    const nje = document.getElementById('s-serv-nje').value || '—';
    const cm = +document.getElementById('s-serv-cm').value || 0;
    const notes = document.getElementById('s-serv-notes').value.trim();
    
    if (!desc) { alert('Shkruaj përshkrimin e shërbimit!'); return; }
    
    const total = Math.round(sasia * cm * 100) / 100;
    const fullName = notes ? desc + " — " + notes : desc;
    cart.push({
        prodId: 'SERVIS',
        name: fullName,
        nje: nje,
        sasia: sasia,
        cms: cm,
        total: total
    });
    
    document.getElementById('s-serv-desc').value = '';
    document.getElementById('s-serv-cm').value = '';
    document.getElementById('s-serv-notes').value = '';
    renderCart();
}

function cartAdd(){
  const prodId=document.getElementById('s-prod').value;
  const sasia=+document.getElementById('s-sasia').value;
  const nje=document.getElementById('s-nje').value;
  const cms=+document.getElementById('s-cms').value;
  if(!prodId){alert('Zgjidh produktin!');return;}
  if(!sasia||sasia<=0){alert('Sasia duhet të jetë > 0!');return;}
  if(!cms||cms<1){alert('Plotëso çmimin!');return;}
  const p=getProd(prodId);
  if(!p){alert('Produkti nuk u gjet!');return;}
  const avail=p.stok - cart.filter(c=>c.prodId===prodId).reduce((s,c)=>s+c.sasia,0);
  if(sasia>avail){alert('Stoku i pamjaftueshëm! Disponibël: '+avail+' '+p.nje);return;}
  const ex=cart.findIndex(c=>c.prodId===prodId&&c.cms===cms&&c.nje===nje);
  if(ex>=0){cart[ex].sasia+=sasia;cart[ex].total=Math.round(cart[ex].sasia*cart[ex].cms*100)/100;}
  else cart.push({prodId,name:p.name,nje,sasia,cms,total:Math.round(sasia*cms*100)/100});
  document.getElementById('s-sasia').value='1';
  document.getElementById('s-cms').value='';
  document.getElementById('s-prod').value='';
  document.getElementById('s-prod-search').value='';
  document.getElementById('s-prod-dropdown').style.display='none';
  renderCart();
  const srch2 = document.getElementById('s-prod-search');
  if(srch2) srch2.focus();
}

function cartRemove(i){cart.splice(i,1);renderCart();}

function renderCart(){
  const el=document.getElementById('cart-items');
  const tot=document.getElementById('cart-total');
  const curr = document.getElementById('s-curr').value;
  if(!cart.length){
    el.innerHTML='<div style="color:var(--text3);font-size:13px;text-align:center;padding:.75rem;border:1px dashed var(--border);border-radius:8px">Nuk ka artikuj. Shto produktet sipër.</div>';
    tot.innerHTML='';
    return;
  }
  el.innerHTML=`<table style="font-size:13px"><thead><tr>${['Produkti','Sasia','Çmimi','Totali',''].map(h=>`<th>${h}</th>`).join('')}</tr></thead><tbody>
    ${cart.map((c,i)=>`<tr>
      <td style="font-weight:600;color:var(--text)">${c.name}<br><span class="mono">${c.prodId}</span></td>
      <td style="text-align:center">${c.sasia} ${c.nje}</td>
      <td style="text-align:right">${fmtModal(c.cms, curr)}</td>
      <td style="text-align:right;font-weight:700;color:var(--accent)">${fmtModal(c.total, curr)}</td>
      <td><button class="btn btn-danger btn-sm" onclick="cartRemove(${i})">✕</button></td>
    </tr>`).join('')}
  </tbody></table>`;
  const grossTotal=cart.reduce((s,c)=>s+c.total,0);
  const tvshOpt = document.getElementById('s-tvsh-opt').value;
  const tvsh = tvshOpt === 'po' ? grossTotal * 0.2 : 0;
  const subtot = grossTotal - tvsh;
  const total = grossTotal;
  tot.innerHTML=`Nëntotali: <strong>${fmtModal(subtot, curr)}</strong> &nbsp;|&nbsp; TVSH: <strong>${fmtModal(tvsh, curr)}</strong> &nbsp;|&nbsp; <span style="color:var(--accent);font-size:15px">TOTAL: ${fmtModal(total, curr)}</span>`;
}

// 🔥 FUNKSIONI I RREGULLUAR PËR SHITJE MODAL ME TIMESTAMP
async function addShitje() {
    await ensureRealTimeRate();
    let fat = document.getElementById('s-fat').value.trim();
    if(!fat) fat = 'AUTO-' + Date.now().toString().slice(-6);
    const kli = document.getElementById('s-kli').value.trim();
    const data = document.getElementById('s-data').value;
    const pag = document.getElementById('s-pag').value;
    if (!kli) { alert('Shkruaj emrin e klientit!'); return; }
    if (!cart.length) { alert('Shto të paktën një artikull!'); return; }
    
    if (shitjet.find(s => s.fat === fat)) {
        alert('Gabim: Fatura ' + fat + ' ekziston! Ju lutem përdorni një numër të ri faturë.');
        document.getElementById('s-fat').value = nextFatNr('sh');
        return;
    }
    
    const curr = document.getElementById('s-curr').value;
    const rate = (curr === 'EUR' && exchangeRateEUR > 0) ? exchangeRateEUR : 1;
    const cartALL = cart.map(c => ({
        ...c,
        cms: Math.round(c.cms * rate * 100) / 100,
        total: Math.round(c.sasia * c.cms * rate * 100) / 100
    }));
    const grossTotal = cartALL.reduce((s, c) => s + c.total, 0);
    const tvshOpt = document.getElementById('s-tvsh-opt').value;
    const tvsh = (tvshOpt === 'po') ? grossTotal * 0.2 : 0;
    const subtotal = grossTotal - tvsh;
    const totalFat = grossTotal;
    const cartSnapshot = cart.map(c => ({ ...c }));
    
    let status = 'paguar';
    let paguar = totalFat;
    let borxh = 0;
    let afat = '';
    
    if (pag === 'Debitor') {
        status = 'papaguar';
        paguar = 0;
        borxh = totalFat;
    } else if (pag === 'Pjesërisht') {
        paguar = Math.round((+document.getElementById('s-paguar').value || 0) * rate * 100) / 100;
        borxh = totalFat - paguar;
        afat = document.getElementById('s-afat').value || '';
        status = (borxh > 0) ? 'pjeserisht' : 'paguar';
    } else if (pag === 'Preventiv') {
        status = 'preventiv';
        paguar = 0;
        borxh = 0;
    }
    
    faturatMeta[fat] = { status, paguar, borxh, afat, kli, data, valuta: curr, tvshOpt };
    
    // 🔥 NDRYSHIMI KRYESOR - timestamp për xhiron
    const tsNow = Date.now();
    cartALL.forEach(c => {
        shitjet.push({
            id: 'S' + tsNow + Math.random().toString(36).slice(2, 6),
            fat: fat,
            data: data,
            kli: kli,
            prod: c.prodId,
            sasia: c.sasia,
            cms: c.cms,
            pag: pag,
            ts: tsNow
        });
        const p = products.find(x => x.id === c.prodId);
        if (p && pag !== 'Preventiv') p.stok -= c.sasia;
    });
    
    save();
    renderAll();
    
    // Resetimi i plotë për faturë të re
    cart = [];
    document.getElementById('s-kli').value = 'Klient';
    document.getElementById('s-pag').value = 'Cash';
    document.getElementById('pjeserisht-row').style.display = 'none';
    document.getElementById('s-fat').value = nextFatNr('sh');
    document.getElementById('s-paguar').value = '';
    document.getElementById('s-borxh').value = '';
    document.getElementById('s-afat').value = '';

    renderCart();
    
    showToast('✓ Shitja u regjistrua me sukses!');
    
    const items = cartSnapshot.map(c => ({
        name: c.name,
        kodi: c.prodId,
        nje: c.nje,
        sasia: c.sasia,
        cm: c.cms,
        total: c.total
    }));
    const grossSnap = items.reduce((s, i) => s + i.total, 0);
    const tvshSnap = (tvshOpt === 'po') ? grossSnap * 0.2 : 0;
    const subSnap = grossSnap - tvshSnap;
    currentFatureData = {
        tipi: 'SHITJEJE',
        fat: fat,
        data: data,
        pale: kli,
        pag: pag,
        items: items,
        subtotal: subSnap,
        tvsh: tvshSnap,
        total: grossSnap,
        status: status,
        paguar: paguar / rate,
        borxh: borxh / rate,
        afat: afat,
        valuta: curr
    };
    showFatureInline();
}

function fshiTeGjithaFaturatAdmin() {
  if(currentRole !== 'admin') { alert('⛔ Vetëm administratori mund të fshijë të gjitha faturat!'); return; }
  const totFatura = [...new Set([...shitjet.map(s=>s.fat), ...blerjet.map(b=>b.fat)])].length;
  if(totFatura === 0) { alert('Nuk ka fatura për të fshirë.'); return; }

  if(!confirm(`⚠️ KUJDES!\n\nDo të fshihen TË GJITHA ${totFatura} faturat.\nKjo veprim NUK mund të kthehet.\n\nNëse vazhdoni, do t'ju kërkohet fjalëkalimi i administratorit.`)) return;

  // Kërko fjalëkalimin e admin-it
  const passInput = prompt('🔑 Vendosni fjalëkalimin e administratorit:');
  if(passInput === null) return;

  const adminUser = users.find(u => u.username === currentUser && u.role === 'admin');
  if(!adminUser || passInput !== adminUser.password) {
    alert('❌ Fjalëkalimi i gabuar! Fshirja u anulua.');
    return;
  }

  // ARKIVIM AUTOMATIK i PLOTË para fshirjes
  const jsonData = buildBackupJSON();
  const blob = new Blob([jsonData], {type:'application/json'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `Arkiv_Fatura_Para_Fshirjes_${today()}.json`;
  a.click();
  URL.revokeObjectURL(a.href);

  // Pastro shitjet, blerjet dhe meta-të
  shitjet = [];
  blerjet = [];
  faturatMeta = {};
  arketimet = [];
  save();
  renderAll();
  showToast('✅ Të gjitha faturat u fshiën! Arkivi u shkarkua automatikisht.');
}

let fatPage=1; const FAT_PER_PAGE=25;

let shitjetPage=1; const SHITJET_PER_PAGE=20;
function renderShitjet(){
  const q=(document.getElementById('shitje-search')?.value||'').toLowerCase();
  const fMuaj=(document.getElementById('shitje-f-muaj')?.value||'');
  const fatMap={};
  shitjet.forEach(s=>{
    if(!fatMap[s.fat])fatMap[s.fat]={fat:s.fat,data:s.data,kli:s.kli,pag:s.pag,items:[],tot:0};
    fatMap[s.fat].items.push(s);
    fatMap[s.fat].tot+=s.sasia*s.cms;
  });
  let rows=Object.values(fatMap).sort((a,b)=>b.data.localeCompare(a.data));
  if(q)rows=rows.filter(f=>f.fat.toLowerCase().includes(q)||f.kli.toLowerCase().includes(q));
  if(fMuaj)rows=rows.filter(f=>(f.data||'').startsWith(fMuaj));

  // Update month dropdown
  const muajSel=document.getElementById('shitje-f-muaj');
  if(muajSel){
    const allMuajt=[...new Set(shitjet.map(s=>(s.data||'').slice(0,7)).filter(Boolean))].sort((a,b)=>b.localeCompare(a));
    const prev=muajSel.value;
    muajSel.innerHTML='<option value="">📅 Të gjitha muajt</option>'+allMuajt.map(k=>`<option value="${k}">${muajLabel(k)}</option>`).join('');
    if(allMuajt.includes(prev))muajSel.value=prev;
  }

  // Period info
  const infoEl=document.getElementById('shitje-period-info');
  if(infoEl){
    infoEl.innerHTML=q||fMuaj
      ? `<span style="background:#f0fdf4;color:#16a34a;padding:3px 10px;border-radius:20px;font-size:11px">🔍 ${[fMuaj?muajLabel(fMuaj):'',q?`"${q}"`:''].filter(Boolean).join(' · ')}</span> <b style="color:var(--text)">${rows.length}</b> fatura`
      : `<b style="color:var(--text)">${rows.length}</b> fatura gjithsej`;
  }

  // Pagination
  const total=rows.length;
  const totalPages=Math.ceil(total/SHITJET_PER_PAGE)||1;
  if(shitjetPage>totalPages)shitjetPage=1;
  const start=(shitjetPage-1)*SHITJET_PER_PAGE;
  const pageRows=rows.slice(start,start+SHITJET_PER_PAGE);

  renderPagination('shitje-pagination',shitjetPage,totalPages,p=>{shitjetPage=p;renderShitjet();});

  if(isMobile()){
    document.getElementById('shitje-head').innerHTML='';
    document.getElementById('shitje-body').innerHTML = pageRows.length ? pageRows.map(f=>{
      const meta=getFatureMeta(f.fat);
      const status=meta.status||'paguar';
      const tvsh=meta.tvshOpt==='po'?f.tot*0.2:0;
      const total=f.tot;
      const statusColors={paguar:['#f0fdf4','#16a34a','✓ Paguar'],papaguar:['#fef2f2','#dc2626','✗ Pa Paguar'],pjeserisht:['#f5f3ff','#7c3aed','◑ Pjesërisht'],preventiv:['#f5f3ff','#7c3aed','📝 Preventiv']};
      const sc=statusColors[status]||statusColors.paguar;
      const pagColors={Cash:['#fefce8','#ca8a04'],Servis:['#fef9c3','#ca8a04'],Debitor:['#fef2f2','#dc2626'],Pjesërisht:['#f5f3ff','#7c3aed'],Preventiv:['#f5f3ff','#7c3aed']};
      const pc=pagColors[f.pag]||['#f8fafc','#6b7280'];
      return `<tr><td style="padding:0;border:none"><div style="background:#fff;border-radius:12px;border:1px solid var(--border);padding:.85rem 1rem;margin-bottom:.55rem;box-shadow:0 1px 4px rgba(0,0,0,.06)">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:.5rem">
          <div>
            <div style="font-size:14px;font-weight:800;color:var(--text)">${f.kli}</div>
            <div style="font-size:11px;color:var(--accent);font-family:'JetBrains Mono',monospace;font-weight:700;margin-top:2px">${f.fat}</div>
            <div style="font-size:11px;color:var(--text3);margin-top:1px">${f.data}</div>
          </div>
          <div style="font-size:15px;font-weight:800;color:#22c55e">${fmtL(total)}</div>
        </div>
        <div style="display:flex;gap:.4rem;flex-wrap:wrap;margin-bottom:.65rem">
          <span style="font-size:11px;font-weight:600;padding:3px 8px;border-radius:20px;background:${pc[0]};color:${pc[1]}">${f.pag}</span>
          <span style="font-size:11px;font-weight:600;padding:3px 8px;border-radius:20px;background:${sc[0]};color:${sc[1]}">${sc[2]}</span>
          <span style="font-size:11px;color:var(--text3)">${f.items.length} artikuj</span>
          ${meta.borxh>0?`<span style="font-size:11px;font-weight:600;color:#7c3aed">Borxh: ${fmtL(meta.borxh)}</span>`:''}
        </div>
        <div style="display:flex;gap:.4rem;flex-wrap:wrap">
          <button class="btn btn-outline btn-sm" style="flex:1" onclick="showFatureByFat('${f.fat}')">🧾 Fatura</button>
          <button class="btn btn-outline btn-sm" style="flex:1" onclick="openEditShitjeModal('${f.fat}')">✏ Ndrysho</button>
          ${status==='preventiv'
            ? `<button class="btn btn-success btn-sm" style="flex:1;background:linear-gradient(135deg,#f59e0b,#d97706);border-color:#d97706;color:#fff" onclick="paguajPreventiv('${f.fat}')">💵 Paguaj</button>`
            : status!=='paguar'?`<button class="btn btn-success btn-sm" style="flex:1" onclick="markPaguar('${f.fat}')">✓ Pagoi</button>`:''
          }
          <button class="btn btn-danger btn-sm" onclick="deleteShitje('${f.fat}')">🗑</button>
        </div>
      </div></td></tr>`;
    }).join('') : '<tr><td style="text-align:center;color:var(--text3);padding:2rem;border:none">Nuk ka shitje.</td></tr>';
    return;
  }

  // Group by month with separators
  let lastM='';
  document.getElementById('shitje-head').innerHTML='<tr>'+['Nr. Faturës','Klienti / Borxhliu','Data','Artikuj','Totali','TVSH','Total+TVSH','Pagesa','Statusi',''].map(h=>`<th>${h}</th>`).join('')+'</tr>';
  document.getElementById('shitje-body').innerHTML=pageRows.map(f=>{
    const meta=getFatureMeta(f.fat);
    const status=meta.status||'paguar';
    const pagBadge=f.pag==='Cash'?badge('Cash','#fefce8','#ca8a04'):f.pag==='Servis'?badge('Servis','#fef9c3','#a16207'):f.pag==='Debitor'?badge('Debitor','#fef2f2','#dc2626'):f.pag==='Preventiv'?badge('Preventiv','#f5f3ff','#7c3aed'):badge('Pjesërisht','#f5f3ff','#7c3aed');
    const tvsh = meta.tvshOpt === 'po' ? f.tot * 0.2 : 0;
    const netTot = f.tot - tvsh;
    const total = f.tot;
    const thisM=(f.data||'').slice(0,7);
    let sep='';
    if(thisM&&thisM!==lastM){
      lastM=thisM;
      sep=`<tr><td colspan="10" style="background:linear-gradient(90deg,#f8fafc,transparent);padding:6px 14px 4px;font-size:10px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.1em;border-bottom:1px solid var(--border)">${muajLabel(thisM)}</td></tr>`;
    }
    return `${sep}<tr>
      <td class="mono" style="font-weight:700;color:var(--accent)">${f.fat}</td>
      <td style="font-weight:700;color:var(--text)">${f.kli}</td>
      <td>${f.data}</td>
      <td style="color:var(--text3)">${f.items.length} artikuj</td>
      <td>${fmtL(netTot)}</td>
      <td style="color:var(--text3)">${fmtL(tvsh)}</td>
      <td style="color:#22c55e;font-weight:700">${fmtL(total)}</td>
      <td>${pagBadge}</td>
      <td>${statusBadge(status)}${meta.borxh>0?`<br><span style="font-size:10px;color:#7c3aed">Borxh: ${fmtL(meta.borxh)}</span>`:''}</td>
      <td style="display:flex;gap:4px;flex-wrap:wrap">
        <button class="btn btn-outline btn-sm" onclick="showFatureByFat('${f.fat}')">🧾</button>
        <button class="btn btn-outline btn-sm" onclick="openEditShitjeModal('${f.fat}')">✏</button>
        ${status==='preventiv'
          ? `<button class="btn btn-success btn-sm" onclick="paguajPreventiv('${f.fat}')" style="background:linear-gradient(135deg,#f59e0b,#d97706);border-color:#d97706;color:#fff">💵 Paguaj</button>`
          : status!=='paguar'?`<button class="btn btn-success btn-sm" onclick="markPaguar('${f.fat}')">✓ Pagoi</button>`:''
        }
        <button class="btn btn-danger btn-sm" onclick="deleteShitje('${f.fat}')">🗑</button>
      </td>
    </tr>`;
  }).join('')||'<tr><td colspan="10" style="color:var(--text3);text-align:center;padding:2rem">Nuk ka shitje.</td></tr>';
}

function paguajPreventiv(fat){
  const meta = faturatMeta[fat] || {};
  const klienti = (shitjet.find(s=>s.fat===fat)||{}).kli || fat;
  const dataFat = (shitjet.find(s=>s.fat===fat)||{}).data || today();
  const totFat = shitjet.filter(s=>s&&s.fat===fat).reduce((s,x)=>s+(x.sasia||0)*(x.cms||0),0);
  const kaTVSH = meta.tvshOpt==='po';
  const totalFat = totFat;

  const existing = document.getElementById('dlg-prev-pay');
  if(existing) existing.remove();

  const dlg = document.createElement('div');
  dlg.id = 'dlg-prev-pay';
  dlg.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:9999;display:flex;align-items:center;justify-content:center;padding:1rem';
  dlg.innerHTML = `
    <div style="background:#fff;border-radius:18px;padding:1.75rem;width:400px;max-width:96vw;box-shadow:0 20px 60px rgba(0,0,0,.3);animation:loginPop .25s cubic-bezier(.16,1,.3,1)">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:1.25rem">
        <div>
          <div style="font-size:15px;font-weight:800;color:var(--text)">💵 Konverto Preventiv → Faturë</div>
          <div style="font-size:12px;color:var(--text3);margin-top:3px">${fat} &nbsp;·&nbsp; <b style="color:var(--text)">${klienti}</b></div>
        </div>
        <button onclick="document.getElementById('dlg-prev-pay').remove()" style="background:var(--bg);border:none;width:28px;height:28px;border-radius:8px;cursor:pointer;font-size:16px;display:flex;align-items:center;justify-content:center;font-weight:700;color:var(--text3)">✕</button>
      </div>
      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:11px;padding:.85rem 1.1rem;margin-bottom:1.25rem;display:flex;justify-content:space-between;align-items:center">
        <span style="font-size:12px;color:#166534;font-weight:600">💰 Totali i preventivit</span>
        <span style="font-size:17px;font-weight:800;color:#16a34a">${fmtL(totalFat)}</span>
      </div>
      <div style="margin-bottom:1rem">
        <div style="font-size:11px;font-weight:700;color:var(--text2);text-transform:uppercase;letter-spacing:.06em;margin-bottom:.6rem">Mënyra e Pagesës</div>
        <div style="display:flex;gap:.5rem;flex-wrap:wrap">
          <button id="ppv-cash" onclick="setPrevPagType('Cash')" style="flex:1;padding:9px;border-radius:9px;border:2px solid var(--accent);background:var(--accent);color:#fff;cursor:pointer;font-size:13px;font-weight:700;font-family:'Inter',sans-serif">💵 Cash</button>
          <button id="ppv-deb" onclick="setPrevPagType('Debitor')" style="flex:1;padding:9px;border-radius:9px;border:2px solid var(--border);background:#fff;color:var(--text2);cursor:pointer;font-size:13px;font-weight:700;font-family:'Inter',sans-serif">🔴 Debitor</button>
          <button id="ppv-pjes" onclick="setPrevPagType('Pjesërisht')" style="flex:1;padding:9px;border-radius:9px;border:2px solid var(--border);background:#fff;color:var(--text2);cursor:pointer;font-size:13px;font-weight:700;font-family:'Inter',sans-serif">◑ Pjesërisht</button>
        </div>
      </div>
      <div id="ppv-pjeserisht-row" style="display:none;margin-bottom:1rem;background:#f5f3ff;border:1px solid #ede9fe;border-radius:10px;padding:.9rem 1rem">
        <div style="font-size:11px;font-weight:700;color:#4c1d95;text-transform:uppercase;letter-spacing:.06em;margin-bottom:.6rem">Shuma e paguar tani (L)</div>
        <input id="ppv-paguar-inp" type="number" placeholder="0" min="0" step="1"
          style="width:100%;border:1.5px solid #ede9fe;border-radius:9px;padding:10px 12px;font-size:15px;font-weight:700;font-family:'Inter',sans-serif;outline:none;color:#1e293b"
          onfocus="this.style.borderColor='#7c3aed'" onblur="this.style.borderColor='#ede9fe'">
      </div>
      <button onclick="doKonvertoPreventiv('${fat}','${klienti}','${dataFat}',${totalFat})"
        style="width:100%;background:linear-gradient(135deg,#22c55e,#16a34a);border:none;color:#fff;border-radius:11px;padding:13px;font-size:14px;font-weight:800;cursor:pointer;font-family:'Inter',sans-serif;margin-top:.25rem">
        ✓ Konfirmo Pagesën
      </button>
    </div>`;
  document.body.appendChild(dlg);
  dlg.addEventListener('click', e => { if(e.target===dlg) dlg.remove(); });
}

function setPrevPagType(tip){
  ['Cash','Debitor','Pjesërisht'].forEach(t=>{
    const id = t==='Cash'?'ppv-cash':t==='Debitor'?'ppv-deb':'ppv-pjes';
    const btn = document.getElementById(id);
    if(!btn) return;
    const active = t===tip;
    btn.style.background = active ? 'var(--accent)' : '#fff';
    btn.style.color = active ? '#fff' : 'var(--text2)';
    btn.style.borderColor = active ? 'var(--accent)' : 'var(--border)';
  });
  document.getElementById('ppv-pjeserisht-row').style.display = tip==='Pjesërisht' ? 'block' : 'none';
  document.getElementById('dlg-prev-pay').dataset.pagTip = tip;
}

function doKonvertoPreventiv(fat, klienti, dataFat, totalFat){
  const dlg = document.getElementById('dlg-prev-pay');
  const pagTip = dlg?.dataset.pagTip || 'Cash';
  let paguar = totalFat;
  let borxh = 0;

  if(pagTip === 'Debitor'){
    paguar = 0;
    borxh = totalFat;
  } else if(pagTip === 'Pjesërisht'){
    const inp = parseFloat(document.getElementById('ppv-paguar-inp')?.value);
    if(isNaN(inp)||inp<0){ alert('Vendos shumën e paguar!'); return; }
    paguar = Math.min(inp, totalFat);
    borxh = Math.max(0, totalFat - paguar);
  }

  // 1. Ndrysho statusin dhe mënyrën e pagesës në meta
  if(!faturatMeta[fat]) faturatMeta[fat] = {};
  faturatMeta[fat].status = borxh > 0 ? (paguar > 0 ? 'pjeserisht' : 'papaguar') : 'paguar';
  faturatMeta[fat].pag = pagTip;
  faturatMeta[fat].paguar = paguar;
  faturatMeta[fat].borxh = borxh;

  // 2. Ndrysho pag dhe përditëso ts/data në çdo rresht shitjeje të kësaj fature
  // ts duhet të jetë momenti i pagesës (jo krijimit të preventivit), që shitja të llogaritet në xhiron e sotme
  const tsPagese = Date.now();
  const dataPagese = today();
  shitjet.forEach(s => {
    if(s.fat === fat) {
      s.pag = pagTip;
      s.ts = tsPagese;
      s.data = dataPagese;
    }
  });

  // 3. Zbrit stokun (preventivi nuk e kishte zbritur)
  shitjet.filter(s => s.fat === fat).forEach(s => {
    const p = products.find(x => x.id === s.prod);
    if(p) p.stok -= s.sasia;
  });

  // 4. Regjistro arkëtim VETËM nëse është Debitor/Pjesërisht (jo Cash)
  // Cash-i llogaritet direkt nga shitjet në xhiro, jo si arkëtim
  if(paguar > 0 && pagTip !== 'Cash'){
    arketimet.push({ id:'ARK-'+Date.now(), fat, kli:klienti, dataFat, data:today(), ts:Date.now(), shuma:paguar });
    localStorage.setItem('tp_arketimet', JSON.stringify(arketimet));
  }

  dlg?.remove();
  save();
  renderAll();

  // 5. Shfaq faturën e re si shitje
  showFatureByFat(fat);
  showToast(`✅ Preventivi ${fat} u konvertua në faturë shitje — ${pagTip}!`);
}

function markPaguar(fat) {
  const meta = faturatMeta[fat] || {};
  const totFat = shitjet.filter(s=>s&&s.fat===fat).reduce((s,x)=>s+(x.sasia||0)*(x.cms||0),0);
  const kaTVSH = meta.tvshOpt==='po';
  const totalFat = totFat;
  const borxhAktual = (Number(meta.borxh) > 0) ? Number(meta.borxh) : Math.max(0, totalFat - Number(meta.paguar || 0));
  const klienti = (shitjet.find(s=>s.fat===fat)||{}).kli || fat;
  const dataFat = (shitjet.find(s=>s.fat===fat)||{}).data || '';

  // Hiq dialog-in ekzistues nëse ka
  const existing = document.getElementById('dlg-ark');
  if(existing) existing.remove();

  const dlg = document.createElement('div');
  dlg.id = 'dlg-ark';
  dlg.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:9999;display:flex;align-items:center;justify-content:center;padding:1rem';
  dlg.innerHTML = `
    <div style="background:#fff;border-radius:18px;padding:1.75rem;width:400px;max-width:96vw;box-shadow:0 20px 60px rgba(0,0,0,.3);animation:loginPop .25s cubic-bezier(.16,1,.3,1)">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:1.25rem">
        <div>
          <div style="font-size:15px;font-weight:800;color:var(--text)">💰 Arkëtim Pagese Debitori</div>
          <div style="font-size:12px;color:var(--text3);margin-top:3px">${fat} &nbsp;·&nbsp; <b style="color:var(--text)">${klienti}</b></div>
        </div>
        <button onclick="document.getElementById('dlg-ark').remove()" style="background:var(--bg);border:none;width:28px;height:28px;border-radius:8px;cursor:pointer;font-size:16px;display:flex;align-items:center;justify-content:center;font-weight:700;color:var(--text3)">✕</button>
      </div>
      <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:11px;padding:.85rem 1.1rem;margin-bottom:1.25rem;display:flex;justify-content:space-between;align-items:center">
        <span style="font-size:12px;color:#dc2626;font-weight:600">🔴 Borxhi mbetur</span>
        <span style="font-size:17px;font-weight:800;color:#dc2626">${fmtL(borxhAktual)}</span>
      </div>
      <div style="display:flex;flex-direction:column;gap:.75rem">
        <button onclick="doArkFull('${fat}','${klienti}','${dataFat}',${borxhAktual})"
          style="width:100%;background:linear-gradient(135deg,#22c55e,#16a34a);border:none;color:#fff;border-radius:11px;padding:13px 16px;font-size:14px;font-weight:800;cursor:pointer;font-family:'Inter',sans-serif;display:flex;justify-content:space-between;align-items:center">
          <span>✓ Pagoi Plotësisht</span>
          <span style="font-size:13px;opacity:.9;background:rgba(255,255,255,.2);border-radius:7px;padding:3px 10px">${fmtL(borxhAktual)}</span>
        </button>
        <div style="background:#f5f3ff;border:1px solid #ede9fe;border-radius:11px;padding:.9rem 1rem">
          <div style="font-size:11px;font-weight:700;color:#4c1d95;text-transform:uppercase;letter-spacing:.06em;margin-bottom:.6rem">◑ Shuma e Saktë (pjesërisht)</div>
          <div style="display:flex;gap:.5rem">
            <input id="ark-shuma-input" type="number" placeholder="Shuma (L)" step="1" min="1"
              style="flex:1;border:1.5px solid #ede9fe;border-radius:9px;padding:10px 12px;font-size:15px;font-weight:700;font-family:'Inter',sans-serif;outline:none;color:#1e293b"
              onfocus="this.style.borderColor='#7c3aed'" onblur="this.style.borderColor='#ede9fe'"
              onkeydown="if(event.key==='Enter')doArkPartial('${fat}','${klienti}','${dataFat}',${borxhAktual})">
            <button onclick="doArkPartial('${fat}','${klienti}','${dataFat}',${borxhAktual})"
              style="background:linear-gradient(135deg,#7c3aed,#4f6ef7);border:none;color:#fff;border-radius:9px;padding:10px 18px;font-size:13px;font-weight:700;cursor:pointer;font-family:'Inter',sans-serif;white-space:nowrap">
              Regjistro
            </button>
          </div>
        </div>
      </div>
    </div>`;
  document.body.appendChild(dlg);
  dlg.addEventListener('click', e => { if(e.target===dlg) dlg.remove(); });
  setTimeout(()=>{ const inp=document.getElementById('ark-shuma-input'); if(inp) inp.focus(); }, 80);
}

function doArkFull(fat, klienti, dataFat, borxhAktual){
  document.getElementById('dlg-ark')?.remove();
  _doArketim(fat, klienti, dataFat, parseFloat(borxhAktual), parseFloat(borxhAktual));
}

function doArkPartial(fat, klienti, dataFat, borxhAktual){
  const shuma = parseFloat(document.getElementById('ark-shuma-input')?.value);
  if(isNaN(shuma)||shuma<=0){
    const inp = document.getElementById('ark-shuma-input');
    if(inp){ inp.style.borderColor='#ef4444'; inp.focus(); }
    return;
  }
  document.getElementById('dlg-ark')?.remove();
  _doArketim(fat, klienti, dataFat, parseFloat(borxhAktual), shuma);
}

function _doArketim(fat, klienti, dataFat, borxhAktual, shuma){
  const meta = faturatMeta[fat] || {};
  const borxhRi = Math.max(0, borxhAktual - shuma);
  if(!faturatMeta[fat]) faturatMeta[fat]={};
  faturatMeta[fat].paguar = (meta.paguar||0) + shuma;
  faturatMeta[fat].borxh = borxhRi;
  faturatMeta[fat].status = borxhRi <= 0 ? 'paguar' : 'pjeserisht';
  const ark = {
    id: 'ARK-'+Date.now(),
    fat: fat,
    kli: klienti,
    dataFat: dataFat,
    data: today(),
    ts: Date.now(),
    shuma: shuma
  };
  arketimet.push(ark);
  localStorage.setItem('tp_arketimet', JSON.stringify(arketimet));
  save();
  renderAll();
  const msg = borxhRi <= 0
    ? `✅ ${fat} u shënua PAGUAR · ${fmtL(shuma)}`
    : `✅ Arkëtim i regjistruar · ${fmtL(shuma)} paguar · Borxh mbetur: ${fmtL(borxhRi)}`;
  showToast(msg);
}

let faturaTab='all';
let fatArkivMuaj='';
let fatScopedCache=[];
const MUAJT_SQ=['Janar','Shkurt','Mars','Prill','Maj','Qershor','Korrik','Gusht','Shtator','Tetor','Nëntor','Dhjetor'];
function muajKey(dataStr){ return (dataStr||'').slice(0,7); }
function muajiAktualKey(){ const d=new Date(); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0'); }
function muajLabel(key){ if(!key)return ''; const parts=key.split('-'); const y=parts[0],m=parts[1]; return (MUAJT_SQ[parseInt(m,10)-1]||m)+' '+y; }
function setArkivMuaj(v){ fatArkivMuaj=v; renderFaturat(); }

function fatResetFilters(){
  fatPage=1;
  document.getElementById('fat-search').value='';
  document.getElementById('fat-f-vit').value='';
  document.getElementById('fat-f-muaj').value='';
  document.getElementById('fat-f-nga').value='';
  document.getElementById('fat-f-deri').value='';
  document.getElementById('fat-f-status').value='';
  setFatTab('all');
  renderFaturat();
}

function setFatTab(t){
  fatPage=1;
  faturaTab=t;
  ['all','sh','bl'].forEach(k=>{
    const b=document.getElementById('fat-f-'+k);
    if(!b)return;
    const active=(k==='all'&&t==='all')||(k==='sh'&&t==='shitje')||(k==='bl'&&t==='blerje');
    b.style.background=active?'var(--accent)':'transparent';
    b.style.color=active?'#fff':'var(--text2)';
  });
  renderFaturat();
}

function renderFaturat(){
  const q=(document.getElementById('fat-search')?.value||'').trim().toLowerCase();
  const fVit=(document.getElementById('fat-f-vit')?.value||'');
  const fMuaj=(document.getElementById('fat-f-muaj')?.value||'');
  const fNga=(document.getElementById('fat-f-nga')?.value||'');
  const fDeri=(document.getElementById('fat-f-deri')?.value||'');
  const fStatus=(document.getElementById('fat-f-status')?.value||'');

  // show/hide clear button on search
  const clrBtn=document.getElementById('fat-search-clear');
  if(clrBtn) clrBtn.style.display=q?'block':'none';

  let all=[
    ...Object.values(blerjet.reduce((m,b)=>{if(!m[b.fat])m[b.fat]={fat:b.fat,data:b.data,tipi:'Blerje',pale:b.furn,vlera:0};m[b.fat].vlera+=b.sasia*b.cmb;return m},{})),
    ...Object.values(shitjet.reduce((m,s)=>{if(!m[s.fat])m[s.fat]={fat:s.fat,data:s.data,tipi:'Shitje',pale:s.kli,vlera:0,pag:s.pag};m[s.fat].vlera+=s.sasia*s.cms;return m},{})),
  ].sort((a,b)=>b.data.localeCompare(a.data));

  if(faturaTab==='shitje') all=all.filter(f=>f.tipi==='Shitje');
  else if(faturaTab==='blerje') all=all.filter(f=>f.tipi==='Blerje');

  // Build year and month dropdowns dynamically
  const vitSet=[...new Set(all.map(f=>(f.data||'').slice(0,4)).filter(Boolean))].sort((a,b)=>b-a);
  const vitSel=document.getElementById('fat-f-vit');
  if(vitSel){
    const prevVit=vitSel.value;
    vitSel.innerHTML='<option value="">📆 Të gjitha vitet</option>'+vitSet.map(v=>`<option value="${v}">${v}</option>`).join('');
    if(vitSet.includes(prevVit)) vitSel.value=prevVit;
  }
  const muajSet=[...new Set(all.filter(f=>!fVit||f.data.startsWith(fVit)).map(f=>(f.data||'').slice(0,7)).filter(Boolean))].sort((a,b)=>b.localeCompare(a));
  const muajSel=document.getElementById('fat-f-muaj');
  if(muajSel){
    const prevMuaj=muajSel.value;
    muajSel.innerHTML='<option value="">📅 Të gjitha muajt</option>'+muajSet.map(k=>`<option value="${k}">${muajLabel(k)}</option>`).join('');
    if(muajSet.includes(prevMuaj)) muajSel.value=prevMuaj;
    else muajSel.value='';
  }
  const fMuajNow=(document.getElementById('fat-f-muaj')?.value||'');

  // Apply filters
  let scoped=all.filter(f=>{
    if(q && !f.fat.toLowerCase().includes(q) && !f.pale.toLowerCase().includes(q)) return false;
    if(fVit && !(f.data||'').startsWith(fVit)) return false;
    if(fMuajNow && !(f.data||'').startsWith(fMuajNow)) return false;
    if(fNga && f.data < fNga) return false;
    if(fDeri && f.data > fDeri) return false;
    if(fStatus && f.tipi==='Shitje'){
      const st=getFatureStatus(f.fat);
      if(st!==fStatus) return false;
    } else if(fStatus && f.tipi==='Blerje' && fStatus!=='paguar') return false;
    return true;
  });

  fatScopedCache=scoped;

  // Period label
  const activeFilters=[];
  if(q) activeFilters.push(`"${q}"`);
  if(fVit) activeFilters.push(fVit);
  if(fMuajNow) activeFilters.push(muajLabel(fMuajNow));
  if(fNga||fDeri) activeFilters.push(`${fNga||'…'} → ${fDeri||'…'}`);
  if(fStatus) activeFilters.push(fStatus);
  const lblEl=document.getElementById('fat-period-label');
  if(lblEl){
    const hasFilter=activeFilters.length>0;
    lblEl.innerHTML=hasFilter
      ? `<span style="background:#eff2fe;color:#4f6ef7;padding:3px 10px;border-radius:20px;font-size:11px">🔍 ${activeFilters.join(' · ')}</span> <b style="color:var(--text)">${scoped.length}</b> fatura`
      : `<b style="color:var(--text)">${scoped.length}</b> fatura gjithsej`;
  }

  // KPIs
  const totB=scoped.filter(f=>f.tipi==='Blerje').reduce((s,f)=>s+f.vlera,0);
  const totS=scoped.filter(f=>f.tipi==='Shitje').reduce((s,f)=>s+f.vlera,0);
  const nDebitor=scoped.filter(f=>f.tipi==='Shitje').filter(f=>{const st=getFatureStatus(f.fat);return st==='papaguar'||st==='pjeserisht';}).length;
  document.getElementById('fat-kpi').innerHTML=
    kpiCard('⬇️',scoped.filter(f=>f.tipi==='Blerje').length,'Fatura Blerje','blue',fmtL(totB))+
    kpiCard('⬆️',scoped.filter(f=>f.tipi==='Shitje').length,'Fatura Shitje','green',fmtL(totS))+
    kpiCard('💰',fmtL(totB+totS),'Vlera Totale','amber','')+
    kpiCard('⚠️',nDebitor,'Pa Paguar','red',nDebitor>0?'Kërkon vëmendje':'');

  // Table
  document.getElementById('fat-head').innerHTML=`<tr style="background:#f8fafc">
    <th style="padding:10px 14px;font-size:11px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.06em;border-bottom:2px solid var(--border);white-space:nowrap">Nr. Faturës</th>
    <th style="padding:10px 14px;font-size:11px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.06em;border-bottom:2px solid var(--border)">Data</th>
    <th style="padding:10px 14px;font-size:11px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.06em;border-bottom:2px solid var(--border)">Tipi</th>
    <th style="padding:10px 14px;font-size:11px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.06em;border-bottom:2px solid var(--border)">Klienti / Furnitori</th>
    <th style="padding:10px 14px;font-size:11px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.06em;border-bottom:2px solid var(--border);text-align:right">Vlera</th>
    <th style="padding:10px 14px;font-size:11px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.06em;border-bottom:2px solid var(--border);text-align:right">TVSH</th>
    <th style="padding:10px 14px;font-size:11px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.06em;border-bottom:2px solid var(--border);text-align:right">Totali</th>
    <th style="padding:10px 14px;font-size:11px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.06em;border-bottom:2px solid var(--border)">Statusi</th>
    <th style="padding:10px 14px;border-bottom:2px solid var(--border)"></th>
  </tr>`;

  if(!scoped.length){
    document.getElementById('fat-body').innerHTML=`<tr><td colspan="9" style="text-align:center;padding:3rem;color:var(--text3);font-size:13px">
      <div style="font-size:36px;margin-bottom:.75rem">📭</div>
      Nuk ka fatura për filtrat e zgjedhur.
    </td></tr>`;
    document.getElementById('fat-pagination').innerHTML='';
    return;
  }

  // Pagination
  const fatTotalPages=Math.ceil(scoped.length/FAT_PER_PAGE)||1;
  if(fatPage>fatTotalPages)fatPage=1;
  const fatStart=(fatPage-1)*FAT_PER_PAGE;
  const pageScoped=scoped.slice(fatStart,fatStart+FAT_PER_PAGE);
  renderPagination('fat-pagination',fatPage,fatTotalPages,p=>{fatPage=p;renderFaturat();});

  // Group by month for visual separation
  let lastMuaj='';
  document.getElementById('fat-body').innerHTML=pageScoped.map(f=>{
    const meta=getFatureMeta(f.fat);
    const status=f.tipi==='Shitje'?getFatureStatus(f.fat):'paguar';
    const tvsh=meta.tvshOpt==='po'?f.vlera*0.2:0;
    const netVlera=f.vlera-tvsh;
    const total=f.vlera;
    const thisMuaj=(f.data||'').slice(0,7);
    let separator='';
    if(thisMuaj && thisMuaj!==lastMuaj){
      lastMuaj=thisMuaj;
      separator=`<tr><td colspan="9" style="background:linear-gradient(90deg,#f8fafc,transparent);padding:8px 14px 4px;font-size:10px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.1em;border-bottom:1px solid var(--border)">${muajLabel(thisMuaj)}</td></tr>`;
    }
    const isBlerje=f.tipi==='Blerje';
    const tipiBadge=isBlerje
      ? `<span style="display:inline-flex;align-items:center;gap:4px;padding:3px 9px;border-radius:20px;font-size:11px;font-weight:700;background:#eff2fe;color:#4f6ef7">⬇ Blerje</span>`
      : `<span style="display:inline-flex;align-items:center;gap:4px;padding:3px 9px;border-radius:20px;font-size:11px;font-weight:700;background:#f0fdf4;color:#16a34a">⬆ Shitje</span>`;
    const statusHtml=isBlerje
      ? `<span style="display:inline-flex;padding:3px 9px;border-radius:20px;font-size:11px;font-weight:600;background:#f0fdf4;color:#16a34a">✓ Paguar</span>`
      : statusBadge(status)+(meta.borxh>0?`<div style="font-size:10px;color:#7c3aed;margin-top:2px;font-weight:600">Borxh: ${fmtL(meta.borxh)}</div>`:'');
    return `${separator}<tr style="border-bottom:1px solid #f3f4f6;transition:background .1s" onmouseover="this.style.background='#fafafa'" onmouseout="this.style.background=''">
      <td style="padding:12px 14px"><span style="font-family:'JetBrains Mono',monospace;font-size:12px;font-weight:700;color:var(--accent)">${f.fat}</span></td>
      <td style="padding:12px 14px;color:var(--text2);font-size:12px;white-space:nowrap">${f.data}</td>
      <td style="padding:12px 14px">${tipiBadge}</td>
      <td style="padding:12px 14px;font-weight:700;color:var(--text);max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${f.pale}</td>
      <td style="padding:12px 14px;text-align:right;color:var(--text2)">${fmtL(netVlera)}</td>
      <td style="padding:12px 14px;text-align:right;color:var(--text3);font-size:12px">${tvsh>0?fmtL(tvsh):'—'}</td>
      <td style="padding:12px 14px;text-align:right;font-weight:800;color:${isBlerje?'#4f6ef7':'#22c55e'};font-size:14px">${fmtL(total)}</td>
      <td style="padding:12px 14px">${statusHtml}</td>
      <td style="padding:12px 14px">
        <div style="display:flex;gap:4px;justify-content:flex-end">
          <button class="btn btn-outline btn-sm" onclick="showFatureByFat('${f.fat}')" title="Shiko Faturën">🧾</button>
          ${isBlerje
            ? `<button class="btn btn-danger btn-sm" onclick="deleteBlerjeFat('${f.fat}')" title="Fshij">🗑</button>`
            : `<button class="btn btn-outline btn-sm" onclick="openEditShitjeModal('${f.fat}')" title="Edito">✏</button>
               <button class="btn btn-danger btn-sm" onclick="deleteShitje('${f.fat}')" title="Fshij">🗑</button>`}
        </div>
      </td>
    </tr>`;
  }).join('');
}

async function deleteShitje(fat){
  const meta=faturatMeta[fat]||{};
  const kli=meta.kli||fat;
  if(!confirm('⚠ Fshi shitjen '+fat+' ('+kli+')?\nStoku do të kthehet automatikisht.'))return;
  const items=shitjet.filter(s=>s.fat===fat);
  const idsToDelete=items.map(s=>s.id).filter(Boolean);
  items.forEach(s=>{const p=products.find(x=>x.id===s.prod);if(p&&s.pag!=='Preventiv')p.stok+=s.sasia;});
  shitjet=shitjet.filter(s=>s.fat!==fat);
  if(faturatMeta[fat])delete faturatMeta[fat];
  save();renderAll();
  // Fshirje DIREKTE te Supabase si masë sigurie — sbSave() e anashkalon fshirjen
  // kur shitjet bëhet array bosh (rasti i shitjes së fundit), prandaj e bëjmë këtu shprehimisht.
  if(idsToDelete.length){
    try{
      const {error}=await sb.from('shitjet').delete().in('id',idsToDelete);
      if(error) console.warn('⚠ Supabase delete (shitje) error:',error);
    }catch(e){ console.warn('⚠ Supabase delete (shitje) error:',e); }
    try{
      const {error:errMeta}=await sb.from('faturat_meta').delete().eq('fat',fat);
      if(errMeta) console.warn('⚠ Supabase delete (faturat_meta) error:',errMeta);
    }catch(e){ console.warn('⚠ Supabase delete (faturat_meta) error:',e); }
  }
}

function eshTogglePjeserisht(){
  const v=document.getElementById('esh-pag').value;
  const row=document.getElementById('esh-pjeserisht-row');
  row.style.display=(v==='Pjesërisht'||v==='Debitor')?'block':'none';
  if(v==='Debitor'){document.getElementById('esh-paguar').value='0';eshCalcBorxh();}
}

function eshCalcBorxh(){
  const vlera=+document.getElementById('esh-vlera').value||0;
  const paguar=+document.getElementById('esh-paguar').value||0;
  document.getElementById('esh-borxh').value=Math.max(0,Math.round(vlera-paguar));
}

// 🔥 FUNKSIONI I RREGULLUAR PËR DEBITORËT
function renderDebitoret(){
  const debs = Object.entries(faturatMeta || {}).filter(([fat, m]) => {
    if (!m) return false;
    return m.status === 'papaguar' || m.status === 'pjeserisht';
  });

  const totBorxh = debs.reduce((s, [, m]) => s + (m.borxh || 0), 0);
  const totPaguar = debs.reduce((s, [, m]) => s + (m.paguar || 0), 0);
  const sot = today();
  const skaduar = debs.filter(([, m]) => m.afat && m.afat < sot).length;

  const el = document.getElementById('deb-kpi');
  if(el) {
    el.innerHTML =
      kpiCard('👤', debs.length, 'Debitorë Aktivë', 'red', skaduar > 0 ? `⚠ ${skaduar} me afat të kaluar` : '') +
      kpiCard('💸', fmtL(totBorxh), 'Borxh Total', 'amber', '') +
      kpiCard('💵', fmtL(totPaguar), 'Paguar Deri Tani', 'green', '') +
      kpiCard('✓', Object.values(faturatMeta || {}).filter(m => m && m.status === 'paguar').length, 'Fatura të Paguara', 'blue', '');
  }

  const head = document.getElementById('deb-head');
  const body = document.getElementById('deb-body');
  if(!head || !body) return;

  // Filters
  const q = (document.getElementById('deb-search')?.value || '').toLowerCase();
  const statusF = document.getElementById('deb-status-filter')?.value || '';

  let filtered = debs.filter(([fat, m]) => {
    const matchQ = !q || (m.kli||'').toLowerCase().includes(q) || fat.toLowerCase().includes(q);
    const matchS = !statusF || m.status === statusF;
    return matchQ && matchS;
  }).sort((a, b) => (b[1]?.data || '').localeCompare(a[1]?.data || ''));

  if(isMobile()){
    head.innerHTML = '';
    if(!filtered.length){
      body.innerHTML = '<tr><td style="padding:0;border:none"><div style="text-align:center;color:var(--text3);padding:2rem;font-size:13px">✓ Nuk ka debitorë aktualë</div></td></tr>';
      return;
    }
    body.innerHTML = filtered.map(([fat, m]) => {
      try {
        const totFat = shitjet.filter(s => s && s.fat === fat).reduce((s,x) => s+(x.sasia||0)*(x.cms||0),0);
        const borxh = m.borxh || 0;
        const paguar = m.paguar || 0;
        const pct = totFat > 0 ? Math.min(100, Math.round(paguar/totFat*100)) : 0;
        const skad = m.afat && m.afat < sot;
        const skadSoon = m.afat && !skad && m.afat <= new Date(Date.now()+7*86400000).toISOString().slice(0,10);
        const emri = m.kli || shitjet.find(s => s && s.fat === fat)?.kli || '—';
        return `<tr><td style="padding:0;border:none">
          <div style="background:#fff;border-radius:14px;border:1.5px solid ${skad?'#fecaca':skadSoon?'#fde68a':'var(--border)'};padding:1rem 1.1rem;margin-bottom:.65rem;box-shadow:0 2px 8px rgba(0,0,0,.06)">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:.6rem">
              <div>
                <div style="font-size:15px;font-weight:800;color:var(--text)">${emri}</div>
                <div style="font-size:11px;color:var(--accent);font-family:'JetBrains Mono',monospace;font-weight:700;margin-top:2px">${fat}</div>
                <div style="font-size:11px;color:var(--text3);margin-top:1px">${m.data||'—'}</div>
              </div>
              <div style="text-align:right">
                ${statusBadge(m.status||'papaguar')}
                <div style="font-size:15px;font-weight:800;color:#dc2626;margin-top:4px">${fmtL(borxh)}</div>
              </div>
            </div>
            <div style="background:#f3f4f6;border-radius:6px;height:6px;margin-bottom:.5rem;overflow:hidden">
              <div style="height:100%;width:${pct}%;background:linear-gradient(90deg,#22c55e,#16a34a);border-radius:6px;transition:width .4s"></div>
            </div>
            <div style="display:flex;justify-content:space-between;font-size:11px;color:var(--text3);margin-bottom:.65rem">
              <span>💵 Paguar: <b style="color:#16a34a">${fmtL(paguar)}</b></span>
              <span>${pct}%</span>
              ${m.afat ? `<span style="color:${skad?'#dc2626':skadSoon?'#d97706':'#7c3aed'}">📅 ${m.afat}${skad?' ⚠':skadSoon?' ⏰':''}</span>` : ''}
            </div>
            <div style="display:flex;gap:.4rem;flex-wrap:wrap">
              <button class="btn btn-sm" style="flex:1;background:linear-gradient(135deg,#f59e0b,#d97706);border-color:#d97706;color:#fff;font-weight:700" onclick="markPaguar('${fat}')">💵 Paguaj</button>
              <button class="btn btn-outline btn-sm" onclick="showFatureByFat('${fat}')">🧾</button>
              <button class="btn btn-outline btn-sm" onclick="openEditShitjeModal('${fat}')">✏️</button>
              <button class="btn btn-outline btn-sm" onclick="openEditAfatModal('${fat}')">📅</button>
            </div>
          </div>
        </td></tr>`;
      } catch(e) { return ''; }
    }).join('');
    return;
  }

  // Desktop table
  head.innerHTML = `<tr>
    <th>Nr. Faturës</th>
    <th>Klienti / Borxhliu</th>
    <th>Data</th>
    <th>Totali Faturës</th>
    <th>Paguar</th>
    <th>Borxhi Mbetur</th>
    <th>Progresi</th>
    <th>Afati</th>
    <th>Statusi</th>
    <th></th>
  </tr>`;

  if(!filtered.length){
    body.innerHTML = '<tr><td colspan="10" style="color:var(--text3);text-align:center;padding:2.5rem;font-size:13px">✓ Nuk ka debitorë aktualë</td></tr>';
    return;
  }

  body.innerHTML = filtered.map(([fat, m]) => {
    try {
      const totFat = shitjet.filter(s => s && s.fat === fat).reduce((s,x) => s+(x.sasia||0)*(x.cms||0),0);
      const borxh = m.borxh || 0;
      const paguar = m.paguar || 0;
      const pct = totFat > 0 ? Math.min(100, Math.round(paguar/totFat*100)) : 0;
      const skad = m.afat && m.afat < sot;
      const skadSoon = m.afat && !skad && m.afat <= new Date(Date.now()+7*86400000).toISOString().slice(0,10);
      const afatHtml = m.afat
        ? `<span style="font-weight:600;color:${skad?'#dc2626':skadSoon?'#d97706':'#7c3aed'}">${m.afat}${skad?' ⚠':skadSoon?' ⏰':''}</span>`
        : '<span style="color:var(--text3)">—</span>';
      const progressBar = `<div style="display:flex;align-items:center;gap:8px;min-width:120px">
        <div style="flex:1;background:#f3f4f6;border-radius:6px;height:7px;overflow:hidden">
          <div style="height:100%;width:${pct}%;background:linear-gradient(90deg,#22c55e,#16a34a);border-radius:6px"></div>
        </div>
        <span style="font-size:11px;color:var(--text3);white-space:nowrap">${pct}%</span>
      </div>`;
      return `<tr style="${skad?'background:#fff5f5;':''}">
        <td class="mono" style="font-weight:700;color:var(--accent)">${fat}</td>
        <td style="font-weight:700;color:var(--text)">${m.kli || '—'}</td>
        <td style="color:var(--text2)">${m.data||'—'}</td>
        <td style="font-weight:600">${fmtL(totFat)}</td>
        <td style="color:#16a34a;font-weight:600">${fmtL(paguar)}</td>
        <td style="color:#dc2626;font-weight:800;font-size:14px">${fmtL(borxh)}</td>
        <td>${progressBar}</td>
        <td>${afatHtml}</td>
        <td>${statusBadge(m.status||'papaguar')}</td>
        <td>
          <div style="display:flex;gap:4px;align-items:center">
            <button class="btn btn-sm" style="background:linear-gradient(135deg,#f59e0b,#d97706);border-color:#d97706;color:#fff;font-weight:700" onclick="markPaguar('${fat}')">💵 Paguaj</button>
            <button class="btn btn-outline btn-sm" title="Shiko Faturën" onclick="showFatureByFat('${fat}')">🧾</button>
            <button class="btn btn-outline btn-sm" title="Edito" onclick="openEditShitjeModal('${fat}')">✏️</button>
            <button class="btn btn-outline btn-sm" title="Ndrysho Afatin" onclick="openEditAfatModal('${fat}')">📅</button>
          </div>
        </td>
      </tr>`;
    } catch(e) {
      console.warn('Gabim në renderDebitoret për faturën:', fat, e);
      return '';
    }
  }).join('');
}

let currentFatureData=null;

