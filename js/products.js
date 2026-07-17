function prodSearchInputBlerje(q){
  const dd=document.getElementById('b-prod-dropdown');
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
    <div onclick="selectProdBlerje('${p.id}')" style="padding:9px 14px;cursor:pointer;border-bottom:1px solid #f3f4f6;transition:background .1s" onmouseover="this.style.background='#eff2fe'" onmouseout="this.style.background=''">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <div>
          <span style="font-weight:600;font-size:13px;color:var(--text)">${p.name}</span>
          <span style="font-size:10px;color:var(--text3);margin-left:6px" class="mono">${p.id}</span>
          <span style="font-size:11px;font-weight:700;background:#eff2fe;color:#4f6ef7;padding:1px 7px;border-radius:10px;margin-left:6px">${p.nje}</span>
        </div>
        <div style="text-align:right">
          <div style="font-weight:700;color:#4f6ef7;font-size:13px">${fmtL(p.cmb)}<span style="font-size:10px;color:var(--text3);font-weight:400">/${p.nje}</span></div>
          <div style="font-size:11px;color:${p.stok<=p.min?'#dc2626':'#16a34a'}">Stok: ${p.stok} ${p.nje} ${p.stok<=p.min?'⚠':''}</div>
        </div>
      </div>
    </div>`).join('');
  dd.style.display='block';
}

function selectProdBlerje(id){
  const p=getProd(id);
  if(!p)return;
  const curr = document.getElementById('b-curr').value;
  document.getElementById('b-prod').value=id;
  document.getElementById('b-prod-search').value=p.name+' — '+p.id;
  let price = p.cmb;
  if(curr === 'EUR' && exchangeRateEUR > 0) price = price / exchangeRateEUR;
  document.getElementById('b-cmb').value = price.toFixed(2);
  document.getElementById('b-prod-dropdown').style.display='none';
  const njeEl=document.getElementById('b-nje');
  if(njeEl){
    const opts=[...njeEl.options].map(o=>o.value);
    if(opts.includes(p.nje))njeEl.value=p.nje;
    else njeEl.value='Cope';
  }
  document.getElementById('b-sasia').focus();
}

function closeProdDropdownBlerje(e){
  const wrap=document.getElementById('b-prod-search')?.closest('[style*="position:relative"]');
  if(wrap&&!wrap.contains(e.target)){
    document.getElementById('b-prod-dropdown').style.display='none';
  }
}

function blerjeCartAdd(){
  const prodId=document.getElementById('b-prod').value;
  const sasia=+document.getElementById('b-sasia').value;
  const nje=document.getElementById('b-nje').value;
  const cmb=+document.getElementById('b-cmb').value;
  if(!prodId){alert('Zgjidh produktin!');return;}
  if(!sasia||sasia<=0){alert('Sasia duhet të jetë > 0!');return;}
  if(!cmb||cmb<0){alert('Plotëso çmimin!');return;}
  const p=getProd(prodId);
  if(!p){alert('Produkti nuk u gjet!');return;}
  const ex=blerjeCart.findIndex(c=>c.prodId===prodId&&c.cmb===cmb&&c.nje===nje);
  if(ex>=0){blerjeCart[ex].sasia+=sasia;blerjeCart[ex].total=Math.round(blerjeCart[ex].sasia*blerjeCart[ex].cmb*100)/100;}  else blerjeCart.push({prodId,name:p.name,nje,sasia,cmb,total:Math.round(sasia*cmb*100)/100});
  document.getElementById('b-sasia').value='1';
  document.getElementById('b-cmb').value='';
  document.getElementById('b-prod').value='';
  document.getElementById('b-prod-search').value='';
  document.getElementById('b-prod-dropdown').style.display='none';
  renderBlerjeCart();
  const srchB = document.getElementById('b-prod-search');
  if(srchB) srchB.focus();
}

function blerjeCartRemove(i){blerjeCart.splice(i,1);renderBlerjeCart();}

function renderBlerjeCart(){
  const el=document.getElementById('blerje-cart-items');
  const tot=document.getElementById('blerje-cart-total');
  const curr = document.getElementById('b-curr').value;
  if(!blerjeCart.length){
    el.innerHTML='<div style="color:var(--text3);font-size:13px;text-align:center;padding:.75rem;border:1px dashed var(--border);border-radius:8px">Nuk ka artikuj. Shto produktet sipër.</div>';
    tot.innerHTML='';
    return;
  }
  el.innerHTML=`<table style="font-size:13px"><thead><tr>${['Produkti','Sasia','Çmimi','Totali',''].map(h=>`<th>${h}</th>`).join('')}</tr></thead><tbody>
    ${blerjeCart.map((c,i)=>`<tr>
      <td style="font-weight:600;color:var(--text)">${c.name}<br><span class="mono">${c.prodId}</span></td>
      <td style="text-align:center">${c.sasia} ${c.nje}</td>
      <td style="text-align:right">${fmtModal(c.cmb, curr)}</td>
      <td style="text-align:right;font-weight:700;color:var(--accent)">${fmtModal(c.total, curr)}</td>
      <td><button class="btn btn-danger btn-sm" onclick="blerjeCartRemove(${i})">✕</button></td>
    </tr>`).join('')}
  </tbody></table>`;
  const subtot=blerjeCart.reduce((s,c)=>s+c.total,0);
  const tvshOpt = document.getElementById('b-tvsh-opt').value;
  const tvsh = tvshOpt === 'po' ? subtot * 0.2 : 0;
  const total = subtot + tvsh;
  tot.innerHTML=`Nëntotali: <strong>${fmtModal(subtot, curr)}</strong> &nbsp;|&nbsp; TVSH: <strong>${fmtModal(tvsh, curr)}</strong> &nbsp;|&nbsp; <span style="color:var(--accent);font-size:15px">TOTAL: ${fmtModal(total, curr)}</span>`;
}

function fillProdSelect(sel){
  document.getElementById(sel).innerHTML='<option value="">-- Zgjidh produktin --</option>'+
    products.map(p=>`<option value="${p.id}">${p.id} — ${p.name} (Stok: ${p.stok} ${p.nje})</option>`).join('');
}

function addProduct(){
  const id=document.getElementById('p-id').value.trim();
  const name=document.getElementById('p-name').value.trim();
  const cmb=+document.getElementById('p-cmb').value;
  const cms=+document.getElementById('p-cms').value;
  const cms2=+document.getElementById('p-cms2').value||0;
  const stok=+document.getElementById('p-stok').value;
  if(!id||!name||!cmb||!cms){alert('Plotëso fushat e detyrueshme!');return;}
  if(products.find(p=>String(p.id)===String(id))){alert('Kodi ekziston tashmë!');return;}
  products.push({id,name,kat:document.getElementById('p-kat').value||'Tjetër',nje:document.getElementById('p-nje').value,cmb,cms,cms2,stok,min:+document.getElementById('p-min').value||1,foto:document.getElementById('p-foto').value||''});
  save();closeModalById('modal-addprod');renderAll();
  ['p-id','p-name','p-kat','p-cmb','p-cms','p-cms2','p-stok','p-foto'].forEach(x=>document.getElementById(x).value='');
  document.getElementById('p-min').value='1';
}
function openQuickStok(id){
  const p = getProd(id);
  if(!p) return;
  document.getElementById('qs-id').value = id;
  document.getElementById('qs-info').textContent = p.name + ' [' + p.id + ']';
  document.getElementById('qs-stok-current').textContent = 'Stoku aktual: ' + p.stok + ' ' + p.nje + (p.stok <= p.min ? ' ⚠ I Ulët!' : '');
  document.getElementById('qs-op').value = 'shto';
  document.getElementById('qs-sasia').value = '1';
  updateQsPreview();
  document.getElementById('modal-quickstok').classList.add('open');
  setTimeout(()=>document.getElementById('qs-sasia').focus(), 200);
}

function updateQsPreview(){
  const id = document.getElementById('qs-id').value;
  const p = getProd(id); if(!p) return;
  const op = document.getElementById('qs-op').value;
  const sasia = +document.getElementById('qs-sasia').value || 0;
  let newStok, label, color, bg;
  if(op==='shto'){ newStok=p.stok+sasia; label='Shto sasi'; color='#15803d'; bg='#f0fdf4'; }
  else if(op==='hiq'){ newStok=Math.max(0,p.stok-sasia); label='Hiq sasi'; color='#b45309'; bg='#fffbeb'; }
  else { newStok=sasia; label='Vendos saktë'; color='#1d4ed8'; bg='#eff6ff'; }
  document.getElementById('qs-sasia-label').textContent = label;
  const preview = document.getElementById('qs-preview');
  preview.style.background = bg;
  preview.style.borderColor = color+'44';
  preview.style.color = color;
  preview.textContent = p.stok + ' ' + p.nje + '  →  ' + newStok + ' ' + p.nje;
}

function saveQuickStok(){
  const id = document.getElementById('qs-id').value;
  const p = getProd(id); if(!p) return;
  const op = document.getElementById('qs-op').value;
  const sasia = +document.getElementById('qs-sasia').value || 0;
  if(op==='shto') p.stok += sasia;
  else if(op==='hiq') p.stok = Math.max(0, p.stok - sasia);
  else p.stok = sasia;
  save(); renderAll();
  closeModalById('modal-quickstok');
  showToast('✓ Stoku u përditësua: ' + p.name + ' → ' + p.stok + ' ' + p.nje);
}

function openEditProdModal(id){
  const p=getProd(id);
  if(!p)return;
  document.getElementById('ep-id').value=p.id;
  document.getElementById('ep-id-orig').value=p.id;
  document.getElementById('ep-name').value=p.name;
  document.getElementById('ep-kat').value=p.kat||'';
  document.getElementById('ep-nje').value=p.nje||'Cope';
  document.getElementById('ep-cmb').value=p.cmb;
  document.getElementById('ep-cms').value=p.cms;
  document.getElementById('ep-cms2').value=p.cms2||'';
  document.getElementById('ep-stok').value=p.stok;
  document.getElementById('ep-min').value=p.min;
  document.getElementById('ep-foto').value=p.foto||'';
  document.getElementById('modal-editprod').classList.add('open');
}
async function saveEditProd(){
  const origId=document.getElementById('ep-id-orig').value;
  const p=getProd(origId);
  if(!p)return;
  const newId=document.getElementById('ep-id').value.trim();
  const name=document.getElementById('ep-name').value.trim();
  const cmb=+document.getElementById('ep-cmb').value;
  const cms=+document.getElementById('ep-cms').value;
  if(!newId||!name||!cmb||!cms){alert('Plotëso fushat e detyrueshme!');return;}
  if(String(newId)!==String(origId) && products.find(x=>String(x.id)===String(newId))){
    alert('Ky kod ekziston tashmë te një produkt tjetër! Zgjidh një kod tjetër.');
    return;
  }
  if(String(newId)!==String(origId)){
    // Përditëso çdo shitje/blerje të vjetër që i referohej kodit të vjetër,
    // që të mos e humbasin lidhjen me këtë produkt.
    blerjet.forEach(b=>{ if(String(b.prod)===String(origId)) b.prod=newId; });
    shitjet.forEach(s=>{ if(String(s.prod)===String(origId)) s.prod=newId; });
    p.id=newId;
    // Fshi rreshtin e vjetër në Supabase, përndryshe upsert-i i mëposhtëm
    // do të krijonte një rresht të ri pa e hequr të vjetrin (duplikat).
    try{ await sb.from('products').delete().eq('id',origId); }catch(e){ console.warn('⚠ Supabase delete (rename kodi) error:',e); }
  }
  p.name=name;
  p.kat=document.getElementById('ep-kat').value||'Tjetër';
  p.nje=document.getElementById('ep-nje').value;
  p.cmb=cmb;
  p.cms=cms;
  p.cms2=+document.getElementById('ep-cms2').value||0;
  p.stok=+document.getElementById('ep-stok').value||0;
  p.min=+document.getElementById('ep-min').value||1;
  p.foto=document.getElementById('ep-foto').value||'';
  save();closeModalById('modal-editprod');renderAll();
}
async function deleteProduct(id){if(!confirm('Fshi produktin '+id+'?'))return;products=products.filter(p=>String(p.id)!==String(id));try{await sb.from('products').delete().eq('id',id);}catch(e){console.warn('⚠ Supabase delete error:',e);}save();renderAll();}

async function deleteAllProducts(){
  const pass = prompt('Për të fshirë të gjithë inventarin, ju lutem vendosni fjalëkalimin e Administratorit:');
  if(pass === null) return;
  
  const adminUser = users.find(u => u.username === 'admin');
  if(adminUser && pass === adminUser.password) {
    if(confirm('⚠ KUJDES: Jeni gati të fshini TË GJITHA produktet. Ky veprim nuk mund të kthehet mbrapsht. Vazhdoni?')){
      products = [];
      localStorage.setItem('tp_products', JSON.stringify([]));
      try {
        await sb.from('products').delete().neq('id', '__nuk_ekziston__');
        console.log('✓ Supabase: produktet u fshinë');
      } catch(e){ console.warn('⚠ Supabase delete error:', e); }
      save();
      renderAll();
      alert('Të gjitha produktet u fshinë me sukses.');
    }
  } else {
    alert('Fjalëkalim i gabuar! Veprimi u anulua.');
  }
}

async function addBlerje(){
  await ensureRealTimeRate();
  let fat=document.getElementById('b-fat').value.trim();
  if(!fat) fat = 'AUTO-' + Date.now().toString().slice(-6);
  const furn=document.getElementById('b-furn').value.trim();
  const data=document.getElementById('b-data').value;
  const curr=document.getElementById('b-curr').value;
  const tvshOpt=document.getElementById('b-tvsh-opt').value;
  if(!furn){alert('Shkruaj emrin e furnitorit!');return;}
  if(!data){alert('Zgjidh datën!');return;}
  if(!blerjeCart.length){alert('Shto të paktën një artikull!');return;}
  if(blerjet.find(b=>b.fat===fat)){
    if(!confirm('Fatura '+fat+' ekziston. Shto artikuj të rinj?'))return;
  }
  const cartSnapshot=[...blerjeCart];
  if(curr==='EUR'){
    blerjeCart.forEach(c=>{
      c.cmb = c.cmb * exchangeRateEUR;
      c.total = c.cmb * c.sasia;
    });
  }
  blerjeCart.forEach(c=>{
    blerjet.push({id:'B'+Date.now()+Math.random().toString(36).slice(2,6),fat,data,furn,prod:c.prodId,sasia:c.sasia,cmb:c.cmb});
    const p=products.find(x=>x.id===c.prodId);if(p)p.stok+=c.sasia;
  });
  if(!faturatMeta[fat]) faturatMeta[fat] = {status:'paguar', valuta:curr, tvshOpt, data, pale:furn};
  blerjeCart=[];
  save();
  closeModalById('modal-addblerje');
  document.removeEventListener('click', closeProdDropdownBlerje, true);
  renderAll();
  document.getElementById('b-furn').value='';
  const items=cartSnapshot.map(c=>({name:c.name,kodi:c.prodId,nje:c.nje,sasia:c.sasia,cm:c.cmb,total:c.total}));
  const subtotal=cartSnapshot.reduce((s,c)=>s+c.total,0);
  const tvsh = tvshOpt==='po' ? subtotal*0.2 : 0;
  currentFatureData={tipi:'BLERJES',fat,data,pale:furn,pag:'Transfer',items,subtotal,tvsh,total:subtotal+tvsh,status:'paguar',paguar:subtotal+tvsh,borxh:0,afat:'',valuta:curr};
  showFatureInline();
}

function openEditBlerjeModal(id){
  const bl=blerjet.find(b=>b.id===id);
  if(!bl){alert('Blerja nuk u gjet!');return;}
  document.getElementById('ebl-id').value=id;
  document.getElementById('ebl-fat').value=bl.fat;
  document.getElementById('ebl-data').value=bl.data;
  document.getElementById('ebl-furn').value=bl.furn;
  document.getElementById('ebl-sasia').value=bl.sasia;
  document.getElementById('ebl-cmb').value=bl.cmb;
  document.getElementById('modal-editblerje').classList.add('open');
}

function saveEditBlerje(){
  const id=document.getElementById('ebl-id').value;
  const data=document.getElementById('ebl-data').value;
  const furn=document.getElementById('ebl-furn').value.trim();
  const sasia=+document.getElementById('ebl-sasia').value;
  const cmb=+document.getElementById('ebl-cmb').value;
  if(!data||!furn||!sasia||!cmb){alert('Plotëso të gjitha fushat!');return;}
  const bl=blerjet.find(b=>b.id===id);
  if(!bl){alert('Blerja nuk u gjet!');return;}
  const prod=bl.prod;
  const p=products.find(x=>x.id===prod);
  if(p){p.stok-=bl.sasia;p.stok+=sasia;}
  bl.data=data;bl.furn=furn;bl.sasia=sasia;bl.cmb=cmb;
  save();closeModalById('modal-editblerje');renderAll();
  alert('✓ Blerja u ndryshua me sukses!');
}

function handleExcelFile(input){
  const file=input.files[0];if(!file)return;
  const reader=new FileReader();
  reader.onload=e=>{
    try{
      const wb=XLSX.read(e.target.result,{type:'binary'});
      const ws=wb.Sheets[wb.SheetNames[0]];
      
      // Kjo është pjesa kryesore: Lexojmë duke filluar nga rreshti i dytë (range: 1)
      // sepse rreshti i parë në Excel-in tuaj është titulli "MENAXHIMI I INVENTARIT..."
      const data=XLSX.utils.sheet_to_json(ws, {range: 1});
      
      if(!data.length){showUploadMsg('Skedari është bosh ose formati nuk njihet.',false);return;}
      
      let count=0;
      data.forEach((row,i)=>{
        // Marrim emrin e artikullit
        const name = row['Artikulli'] || row['Emri'] || row['name'] || '';
        
        // Injorojmë rreshtat bosh ose rreshtin TOTAL
        if(!name || name.toString().includes('TOTAL')) return; 
        
        const id = row['Kodi'] || row['id'] || 'P'+String(products.length + 1).padStart(3,'0');
        const ex = products.findIndex(p=>String(p.id)===String(id));
        
        // Funksion ndihmës për të pastruar numrat nga presjet (format shqip/europian: 1.150,00)
        const parseNum = (val) => {
            if(val === null || val === undefined || val === '') return 0;
            // Nëse është tashmë numër (XLSX e lexoi direkt si numër)
            if(typeof val === 'number') return val;
            let s = String(val).trim();
            // Format europian: 1.150,00 → hiqim pikat e mijëshes, presjen e bëjmë pikë
            if(s.includes(',') && s.includes('.')) {
                // p.sh. 1.150,00
                s = s.replace(/\./g, '').replace(',', '.');
            } else if(s.includes(',')) {
                // p.sh. 1150,00 ose 1,5
                s = s.replace(',', '.');
            }
            return parseFloat(s) || 0;
        };

        const prod = {
          id: id.toString(),
          name: name.toString(),
          kat: (row['Kategoria'] || row['kat'] || 'Tjetër').toString(),
          nje: (row['Njësia Shitje'] || row['Njesia'] || row['nje'] || 'copë').toString(),
          cmb: parseNum(row['Kosto'] || row['Kosto (L)'] || row['Cmimi Blerjes'] || row['cmb']),
          cms: parseNum(row['Çmimi'] || row['Çmimi (L)'] || row['Cmimi Shitjes'] || row['cms']),
          stok: parseNum(row['Sasia'] || row['Stoku'] || row['stok']),
          min: parseNum(row['Sasia Kritike'] || row['Stok Minimal'] || row['min']),
          foto: (row['Foto'] || row['foto'] || '').toString()
        };
        
        if(ex>=0) products[ex]=prod; else products.push(prod);
        count++;
      });
      
      save();
      renderAll();
      showUploadMsg('✓ '+count+' produkte u importuan me sukses!',true);
    }catch(err){
      console.error("Gabim gjatë importit:", err);
      showUploadMsg('Gabim: Kontrolloni formatin e skedarit.',false);
    }
    input.value='';
  };
  reader.readAsBinaryString(file);
}
function showUploadMsg(msg,ok){
  document.getElementById('upload-msg').innerHTML=`<div class="${ok?'alert-success':'alert-danger'} upload-msg" onclick="this.remove()">${msg} <span style="float:right;opacity:.5">×</span></div>`;
}
function exportToExcel(){
  const data = products.map(p => ({
    'Kodi': p.id,
    'Artikulli': p.name,
    'Kategoria': p.kat,
    'Sasia': p.stok,
    'Kosto': p.cmb,
    'VLEFTA': p.stok * p.cmb,
    'Çmimi': p.cms,
    'Vlera Shitjes': p.stok * p.cms,
    'Sasia Kritike': p.min,
    'Njësia Shitje': p.nje
  }));
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Produktet');
  XLSX.writeFile(wb, 'HSMCenter_Produktet_' + today() + '.xlsx');
}

function downloadTemplate(){
  const ws=XLSX.utils.aoa_to_sheet([
    ['TEMPLATE PER IMPORTIN E PRODUKTEVE'],
    ['Kodi','Artikulli','Kategoria','Sasia','Kosto','VLEFTA','Çmimi','Vlera Shitjes','Sasia Kritike','Njësia Shitje'],
    ['P001','Laptop Lenovo IdeaPad 15','Laptop','Cope',65000,80000,8,2,''],
    ['P002','Monitor Samsung 24" FHD','Monitor','Cope',18000,24000,12,3,''],
    ['P003','Kamera IP Hikvision 4MP','Kamera','Cope',4500,6500,20,5,''],
    ['P004','Switch TP-Link 8 Port','Switch','Cope',3500,5000,15,4,''],
    ['P005','NVR Hikvision 8 Channel','NVR','Cope',12000,17000,7,2,''],
  ]);
  const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,ws,'Produktet');XLSX.writeFile(wb,'Template_Produktet_Elektronike.xlsx');
}

const uz=document.getElementById('upload-zone');
uz.addEventListener('dragover',e=>{e.preventDefault();uz.classList.add('dragover')});
uz.addEventListener('dragleave',()=>uz.classList.remove('dragover'));
uz.addEventListener('drop',e=>{e.preventDefault();uz.classList.remove('dragover');handleExcelFile({files:[e.dataTransfer.files[0]],value:''});});

function globalSearch(q){goTab(1,document.querySelectorAll('.nav-btn')[1]);document.getElementById('prod-search').value=q;filterProducts();}
function setView(v){
  currentView=v;
  document.getElementById('view-grid-btn').classList.toggle('active',v==='grid');
  document.getElementById('view-list-btn').classList.toggle('active',v==='list');
  renderProductGrid(getFilteredProducts());
}
function getFilteredProducts(){
  const q=(document.getElementById('prod-search')?.value||'').toLowerCase();
  const kat=document.getElementById('prod-kat-filter')?.value||'';
  const sort=document.getElementById('prod-sort')?.value||'name';
  let list=products.filter(p=>{
    const matchQ=!q||p.name.toLowerCase().includes(q)||p.id.toLowerCase().includes(q)||p.kat.toLowerCase().includes(q);
    const matchK=!kat||p.kat===kat;
    return matchQ&&matchK;
  });
  list.sort((a,b)=>{
    if(sort==='stok')return b.stok-a.stok;
    if(sort==='cms')return b.cms-a.cms;
    if(sort==='marzha')return(b.cms-b.cmb)/b.cmb-(a.cms-a.cmb)/a.cmb;
    return a.name.localeCompare(b.name);
  });
  return list;
}
function filterProducts(){
  const list=getFilteredProducts();
  document.getElementById('prod-count').textContent=`${list.length} produkte`;
  renderProductGrid(list);
}

function renderProducts(){
  const kats=[...new Set(products.map(p=>p.kat))].sort();
  const kf=document.getElementById('prod-kat-filter');
  const cur=kf.value;
  kf.innerHTML='<option value="">Të gjitha kategorit</option>'+kats.map(k=>`<option value="${k}" ${k===cur?'selected':''}>${k}</option>`).join('');

  const list=getFilteredProducts();
  document.getElementById('prod-count').textContent=`${list.length} produkte`;
  renderProductGrid(list);
}

function renderProductGrid(list){
  const cont=document.getElementById('prod-grid-container');
  if(currentView==='grid'){
    cont.innerHTML=`<div class="prod-grid">${list.map(p=>{
      const low=p.stok<=p.min;
      const marzha=p.cmb>0?((p.cms-p.cmb)/p.cmb*100).toFixed(0):0;
      const imgHtml=p.foto?`<img src="${p.foto}" onerror="this.style.display='none';this.nextSibling.style.display='flex'" alt="">`:'';
      const emojiHtml=`<span style="${p.foto?'display:none':'display:flex'};align-items:center;justify-content:center;width:100%;height:100%;font-size:48px">${prodEmoji(p.kat)}</span>`;
      return `<div class="prod-card">
        ${low?'<div class="prod-card-low-badge">⚠ I ulët</div>':''}
        <div class="prod-card-kat">${p.kat}</div>
        <div class="prod-card-img">${imgHtml}${emojiHtml}</div>
        <div class="prod-card-body">
          <div class="prod-card-id">${p.id}</div>
          <div class="prod-card-name">${p.name}</div>
          <div class="prod-card-prices">
            <div class="prod-card-sale">${fmtL(p.cms)}</div>
            <div class="prod-card-buy">Blerje: ${fmtL(p.cmb)}</div>
          </div>
          <div class="prod-card-footer">
            <span class="prod-card-stok ${low?'stok-low':'stok-ok'}">${p.stok} ${p.nje}</span>
            <span class="prod-card-marzha">Marzha: ${marzha}%</span>
          </div>
        </div>
        <div style="padding:8px 12px 12px;display:flex;gap:6px">
          <button class="btn btn-outline btn-sm" style="flex:1" onclick="openShitjeModal();setTimeout(()=>selectProd('${p.id}'),80)">⬆ Shit</button>
          ${currentRole==='admin'?`<button class="btn btn-outline btn-sm" onclick="openEditProdModal('${p.id}')">✏</button><button class="btn btn-danger btn-sm" onclick="deleteProduct('${p.id}')">✕</button>`:''}
        </div>
      </div>`;
    }).join('')}</div>`;
  } else {
    cont.innerHTML=`<div class="card"><table><thead><tr>${['Kodi','Artikulli','Kategoria','Sasia','Kosto','VLEFTA','Çmimi','Vlera Shitjes','Sasia Kritike','Njësia Shitje',''].map(h=>`<th>${h}</th>`).join('')}</tr></thead><tbody>
    ${list.map(p=>{
      const low=p.stok<=p.min;
      const vlera=p.stok*p.cmb;
      const vleraShitjes=p.stok*p.cms;
      return `<tr>
        <td class="mono">${p.id}</td>
        <td style="font-weight:600;color:var(--text)">${p.name}</td>
        <td><span style="font-size:11px;color:var(--text3)">${p.kat}</span></td>
        <td style="color:${low?'#dc2626':'#16a34a'};font-weight:700">${p.stok} ${low?'⚠':''}</td>
        <td>${fmtL(p.cmb)}</td>
        <td style="font-weight:600;color:var(--accent)">${fmtL(vlera)}</td>
        <td style="font-weight:600">${fmtL(p.cms)}</td>
        <td style="font-weight:600;color:#16a34a">${fmtL(vleraShitjes)}</td>
        <td style="color:${low?'#dc2626':'var(--text3)'};font-weight:${low?'700':'400'}">${p.min}</td>
        <td><span style="font-size:11px;color:var(--text3)">${p.nje}</span></td>
        ${currentRole==='admin'?`<td style="display:flex;gap:4px"><button class="btn btn-outline btn-sm" onclick="openEditProdModal('${p.id}')">✏</button><button class="btn btn-danger btn-sm" onclick="deleteProduct('${p.id}')">✕</button></td>`:'<td></td>'}
      </tr>`;
    }).join('')}</tbody></table></div>`;
  }
}

let blerjetPage=1; const BLERJET_PER_PAGE=20;
function renderBlerjet(){
  const q=(document.getElementById('blerje-search')?.value||'').toLowerCase();
  const fMuaj=(document.getElementById('blerje-f-muaj')?.value||'');
  let list=blerjet.slice().reverse();
  if(q)list=list.filter(b=>{const p=getProd(b.prod);return b.fat.toLowerCase().includes(q)||b.furn.toLowerCase().includes(q)||(p&&p.name.toLowerCase().includes(q));});
  if(fMuaj)list=list.filter(b=>(b.data||'').startsWith(fMuaj));

  // Update month dropdown
  const muajSel=document.getElementById('blerje-f-muaj');
  if(muajSel){
    const allMuajt=[...new Set(blerjet.map(b=>(b.data||'').slice(0,7)).filter(Boolean))].sort((a,b)=>b.localeCompare(a));
    const prev=muajSel.value;
    muajSel.innerHTML='<option value="">📅 Të gjitha muajt</option>'+allMuajt.map(k=>`<option value="${k}">${muajLabel(k)}</option>`).join('');
    if(allMuajt.includes(prev))muajSel.value=prev;
  }

  // Period info
  const infoEl=document.getElementById('blerje-period-info');
  if(infoEl){
    infoEl.innerHTML=q||fMuaj
      ? `<span style="background:#eff2fe;color:#4f6ef7;padding:3px 10px;border-radius:20px;font-size:11px">🔍 ${[fMuaj?muajLabel(fMuaj):'',q?`"${q}"`:''].filter(Boolean).join(' · ')}</span> <b style="color:var(--text)">${list.length}</b> regjistrime`
      : `<b style="color:var(--text)">${list.length}</b> regjistrime gjithsej`;
  }

  // Pagination
  const total=list.length;
  const totalPages=Math.ceil(total/BLERJET_PER_PAGE)||1;
  if(blerjetPage>totalPages)blerjetPage=1;
  const start=(blerjetPage-1)*BLERJET_PER_PAGE;
  const pageList=list.slice(start,start+BLERJET_PER_PAGE);

  renderPagination('blerje-pagination',blerjetPage,totalPages,p=>{blerjetPage=p;renderBlerjet();});

  if(isMobile()){
    document.getElementById('blerje-head').innerHTML='';
    document.getElementById('blerje-body').innerHTML = pageList.length ? pageList.map(b=>{
      const p=getProd(b.prod);
      return `<tr><td style="padding:0;border:none"><div style="background:#fff;border-radius:12px;border:1px solid var(--border);padding:.85rem 1rem;margin-bottom:.55rem;box-shadow:0 1px 4px rgba(0,0,0,.06)">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:.5rem">
          <div>
            <div style="font-size:14px;font-weight:800;color:var(--text)">${b.furn}</div>
            <div style="font-size:11px;color:var(--accent);font-family:'JetBrains Mono',monospace;font-weight:700;margin-top:2px">${b.fat}</div>
            <div style="font-size:11px;color:var(--text3);margin-top:1px">${b.data}</div>
          </div>
          <div style="font-size:15px;font-weight:800;color:#4f6ef7">${fmtL(b.sasia*b.cmb)}</div>
        </div>
        <div style="font-size:12px;color:var(--text2);margin-bottom:.65rem">${p?p.name:b.prod} &nbsp;·&nbsp; Sasia: <b>${b.sasia}</b> &nbsp;·&nbsp; Çmimi: <b>${fmtL(b.cmb)}</b></div>
        <div style="display:flex;gap:.4rem">
          <button class="btn btn-outline btn-sm" style="flex:1" onclick="showFatureByFat('${b.fat}')">🧾 Fatura</button>
          <button class="btn btn-outline btn-sm" style="flex:1" onclick="openEditBlerjeModal('${b.id}')">✏ Ndrysho</button>
          <button class="btn btn-danger btn-sm" style="flex:1" onclick="deleteBlerje('${b.id}')">🗑 Fshij</button>
        </div>
      </div></td></tr>`;
    }).join('') : '<tr><td style="text-align:center;color:var(--text3);padding:2rem;border:none">Nuk ka blerje.</td></tr>';
    return;
  }

  // Group by month with separators
  let lastM='';
  document.getElementById('blerje-head').innerHTML='<tr>'+['Nr. Faturës','Furnitori','Data','Produkti','Sasia','Çm. Blerje','Totali',''].map(h=>`<th>${h}</th>`).join('')+'</tr>';
  document.getElementById('blerje-body').innerHTML=pageList.map(b=>{
    const p=getProd(b.prod);
    const thisM=(b.data||'').slice(0,7);
    let sep='';
    if(thisM&&thisM!==lastM){
      lastM=thisM;
      sep=`<tr><td colspan="8" style="background:linear-gradient(90deg,#f8fafc,transparent);padding:6px 14px 4px;font-size:10px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.1em;border-bottom:1px solid var(--border)">${muajLabel(thisM)}</td></tr>`;
    }
    return `${sep}<tr>
      <td class="mono" style="font-weight:700;color:var(--accent)">${b.fat}</td>
      <td style="font-weight:700;color:var(--text)">${b.furn}</td>
      <td>${b.data}</td>
      <td>${p?p.name:b.prod}</td><td>${b.sasia}</td><td>${fmtL(b.cmb)}</td>
      <td style="color:#4f6ef7;font-weight:700">${fmtL(b.sasia*b.cmb)}</td>
      <td style="display:flex;gap:4px">
        <button class="btn btn-outline btn-sm" onclick="showFatureByFat('${b.fat}')" title="Shiko Faturën">🧾</button>
        <button class="btn btn-outline btn-sm" onclick="openEditBlerjeModal('${b.id}')">✏</button>
        <button class="btn btn-danger btn-sm" onclick="deleteBlerje('${b.id}')">🗑</button>
      </td>
    </tr>`;
  }).join('')||'<tr><td colspan="8" style="color:var(--text3);text-align:center;padding:2rem">Nuk ka blerje.</td></tr>';
}

function renderMagazine(){
  const alarme=products.filter(p=>p.stok<=p.min);
  const vlTot=products.reduce((s,p)=>s+p.stok*p.cmb,0);
  document.getElementById('mag-kpi').innerHTML=
    kpiCard('📦',products.length,'Produkte','purple','')+
    kpiCard('💰',fmtL(vlTot),'Vlera Stoku','blue','')+
    kpiCard('⚠️',alarme.length,'Alarme','red',alarme.length>0?'Kërkon vëmendje':'');

  // SEARCH BAR magazinë
  const magSearchEl = document.getElementById('mag-search-bar');
  const magQ = magSearchEl ? magSearchEl.value.toLowerCase() : '';

  const alEl=document.getElementById('mag-alarme');
  alEl.innerHTML=alarme.length>0?`<div class="card" style="border-left:4px solid #ef4444;margin-bottom:1rem">
    <div class="section-title" style="color:#ef4444;margin-bottom:.75rem">⚠ Produkte me Stok të Ulët</div>
    ${alarme.map(p=>`<div class="alert-warn" style="display:flex;justify-content:space-between;align-items:center">
      <span><span>📦</span> <strong>${p.name}</strong> — <span style="color:#dc2626;font-weight:700">${p.stok} ${p.nje}</span> (min: ${p.min})</span>
      <button class="btn btn-outline btn-sm" onclick="openQuickStok('${p.id}')" style="white-space:nowrap;margin-left:12px">➕ Shto Stok</button>
    </div>`).join('')}
  </div>`:'';

  // Filtro produktet me search
  const filteredProds = magQ ? products.filter(p=>
    p.name.toLowerCase().includes(magQ) || p.id.toLowerCase().includes(magQ) || (p.kat||'').toLowerCase().includes(magQ)
  ) : products;

  document.getElementById('mag-head').innerHTML='<tr>'+['Kodi','Emri','Njësia','Stoku','Min.','Vlera Stoku','Statusi',''].map(h=>`<th>${h}</th>`).join('')+'</tr>';
  document.getElementById('mag-body').innerHTML=filteredProds.length===0?`<tr><td colspan="8" style="text-align:center;color:var(--text3);padding:2rem">Nuk u gjet asnjë produkt</td></tr>`:filteredProds.map(p=>{
    const low=p.stok<=p.min;
    return `<tr>
      <td class="mono">${p.id}</td>
      <td style="font-weight:600;color:var(--text)">${p.name}</td>
      <td style="color:var(--text3)">${p.nje}</td>
      <td style="color:${low?'#dc2626':'#16a34a'};font-weight:700">${p.stok}</td>
      <td>${p.min}</td>
      <td style="font-weight:600">${fmtL(p.stok*p.cmb)}</td>
      <td>${badge(low?'⚠ I Ulët':'✓ Normal',low?'#fef2f2':'#f0fdf4',low?'#dc2626':'#16a34a')}</td>
      <td style="display:flex;gap:4px">
        <button class="btn btn-outline btn-sm" onclick="openQuickStok('${p.id}')" title="Shto Stok">➕</button>
        <button class="btn btn-outline btn-sm" onclick="openEditProdModal('${p.id}')">✏</button>
      </td>
    </tr>`;
  }).join('');
}

async function deleteBlerje(id){
  const b=blerjet.find(x=>x.id===id);
  const prodName=b?((getProd(b.prod)||{}).name||b.prod):'';
  if(!confirm('⚠ Fshi blerjen '+(b?b.fat:id)+(prodName?' — '+prodName:'')+'\nStoku do të ulet automatikisht.'))return;
  if(b){const p=products.find(x=>x.id===b.prod);if(p)p.stok=Math.max(0,p.stok-b.sasia);}
  blerjet=blerjet.filter(x=>x.id!==id);
  save();renderAll();
  // Fshirje DIREKTE te Supabase si masë sigurie — sbSave() e anashkalon fshirjen
  // kur blerjet bëhet array bosh (rasti i blerjes së fundit), prandaj e bëjmë këtu shprehimisht.
  if(id){
    try{
      const {error}=await sb.from('blerjet').delete().eq('id',id);
      if(error) console.warn('⚠ Supabase delete (blerje) error:',error);
    }catch(e){ console.warn('⚠ Supabase delete (blerje) error:',e); }
  }
}

async function deleteBlerjeFat(fat){
  if(!confirm('Fshi të gjitha blerjet e faturës '+fat+'?'))return;
  const items=blerjet.filter(b=>b.fat===fat);
  const idsToDelete=items.map(b=>b.id).filter(Boolean);
  items.forEach(b=>{const p=products.find(x=>x.id===b.prod);if(p)p.stok=Math.max(0,p.stok-b.sasia);});
  blerjet=blerjet.filter(b=>b.fat!==fat);
  save();renderAll();
  // Fshirje DIREKTE te Supabase si masë sigurie — sbSave() e anashkalon fshirjen
  // kur blerjet bëhet array bosh (rasti i blerjes së fundit), prandaj e bëjmë këtu shprehimisht.
  if(idsToDelete.length){
    try{
      const {error}=await sb.from('blerjet').delete().in('id',idsToDelete);
      if(error) console.warn('⚠ Supabase delete (blerje fat) error:',error);
    }catch(e){ console.warn('⚠ Supabase delete (blerje fat) error:',e); }
  }
}

