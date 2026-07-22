// ============================================================
// RAPORTI XHIRO DITORE
// ============================================================

let xhiroHistoriku = JSON.parse(localStorage.getItem('tp_xhiro_historiku') || '[]');
let xhiroDataFunditMbyllje = localStorage.getItem('tp_xhiro_data_fundit') || '';
let xhiroTsFundit = parseInt(localStorage.getItem('tp_xhiro_ts_fundit') || '0', 10);
// Arkëtime debitorësh — çdo pagesë e bërë pas mbylljes xhiro
let arketimet = JSON.parse(localStorage.getItem('tp_arketimet') || '[]');

function llogaritXhiroSotme() {
  const sot = today();
  let cash = 0;
  let debitor = 0;
  let arkCash = 0; // arkëtime debitorësh sot
  
  const faturaSot = {};
  
  shitjet.forEach(s => {
    if (s.pag === 'Preventiv' || s.data !== sot) return;
    
    const ts = s.ts != null ? Number(s.ts) : 0;
    if (ts <= xhiroTsFundit) return;
    
    if (!faturaSot[s.fat]) {
      faturaSot[s.fat] = { itemsTotal: 0, pag: s.pag, fat: s.fat };
    }
    faturaSot[s.fat].itemsTotal += (s.sasia * s.cms);
  });
  
  Object.values(faturaSot).forEach(f => {
    const meta = faturatMeta[f.fat] || {};
    const kaTVSH = meta.tvshOpt === 'po';
    const totalMeTVSH = kaTVSH ? f.itemsTotal * 1.2 : f.itemsTotal;
    
    if (f.pag === 'Debitor') {
      debitor += totalMeTVSH;
    } else if (f.pag === 'Pjesërisht') {
      // Në xhiro shkon vetëm shuma që është paguar vërtet (Cash)
      const vleftaPaguar = Number(meta.paguar || 0);
      cash += vleftaPaguar;
      debitor += Math.max(0, totalMeTVSH - vleftaPaguar);
    } else {
      cash += totalMeTVSH;
    }
  });

  // Shto arkëtimet e debitorëve të bëra sot (pas xhiros së fundit)
  arketimet.forEach(a => {
    if (a.data === sot && a.ts > xhiroTsFundit) {
      arkCash += a.shuma;
    }
  });
  
  // Total Xhiro është vetëm Cash nga shitjet + Arkëtimet nga debitorët
  return { cash, debitor, arkCash, total: cash + arkCash };
}

function mbylleXhiron() {
  const sot = today();
  const _xh = llogaritXhiroSotme();
  const totali = _xh.total;
  
  if (totali === 0) {
    alert('ℹ Xhiro e sotme është 0 Lek. Nuk ka asgjë për të mbyllur.');
    return;
  }

  const arkSot = arketimet.filter(a => a.data === sot && a.ts > xhiroTsFundit);
  const totArk = arkSot.reduce((s,a)=>s+a.shuma,0);

  if (!confirm(`⚠ Jeni duke mbyllur xhiron e sotme (${sot}).\n💵 Cash shitje: ${fmtL(_xh.cash)} | Arkëtime debitorësh: ${fmtL(_xh.arkCash)} | 🔴 Debitor i ri: ${fmtL(_xh.debitor)}\n✅ Total Cash i arkëtuar: ${fmtL(_xh.cash + _xh.arkCash)}\nVazhdoni?`)) {
    return;
  }

  const mbyllja = {
    data: sot,
    ts: Date.now(),
    totali: _xh.cash + _xh.arkCash,
    cash: _xh.cash,
    arkCash: _xh.arkCash,
    debitor: _xh.debitor,
    numriFaturave: [...new Set(shitjet.filter(s => s.data === sot && s.pag !== 'Preventiv' && (s.ts != null ? Number(s.ts) : 0) > xhiroTsFundit).map(s => s.fat))].length,
    detajet: shitjet.filter(s => s.data === sot && s.pag !== 'Preventiv' && (s.ts != null ? Number(s.ts) : 0) > xhiroTsFundit).map(s => {
      const meta = faturatMeta[s.fat] || {};
      const vlera = s.sasia * s.cms;
      const totalMeTVSH = meta.tvshOpt === 'po' ? vlera * 1.2 : vlera;
      return {
        fat: s.fat,
        kli: s.kli,
        prod: s.prod === 'SERVIS' ? (s.name || 'Servis') : s.prod,
        sasia: s.sasia,
        cms: s.cms,
        pag: s.pag,
        total: totalMeTVSH
      };
    }),
    arketimet: arkSot  // arkëtimet e debitorëve të bëra sot
  };

  xhiroHistoriku.push(mbyllja);
  xhiroDataFunditMbyllje = sot;
  xhiroTsFundit = Date.now();
  localStorage.setItem('tp_xhiro_data_fundit', xhiroDataFunditMbyllje);
  localStorage.setItem('tp_xhiro_ts_fundit', String(xhiroTsFundit));
  localStorage.setItem('tp_xhiro_historiku', JSON.stringify(xhiroHistoriku));
  save();

  renderXhiro();
  alert(`✅ Xhiro e ditës ${sot} u mbyll me sukses!\nCash shitje: ${fmtL(_xh.cash)}\nArkëtime debitorësh: ${fmtL(_xh.arkCash)}\n🔴 Debitor i ri: ${fmtL(_xh.debitor)}\n✅ Total Cash: ${fmtL(_xh.cash + _xh.arkCash)}\nXhiro e re fillon nga 0.`);
}

function shikoDetajetXhiro(index) {
  const mbyllja = xhiroHistoriku[index];
  if (!mbyllja) return;

  const container = document.getElementById('xhiro-detail-content');
  const curr = 'ALL';

  // Group detajet by fatura
  const fatMap = {};
  (mbyllja.detajet || []).forEach(d => {
    if (!fatMap[d.fat]) fatMap[d.fat] = { fat: d.fat, kli: d.kli, pag: d.pag||'Cash', items: [], total: 0 };
    fatMap[d.fat].items.push(d);
    fatMap[d.fat].total += d.total;
  });
  const faturat = Object.values(fatMap);

  // Totalet
  const totGjithsej = faturat.reduce((s,f)=>s+f.total,0);
  const totDebitor  = faturat.filter(f=>f.pag==='Debitor').reduce((s,f)=>s+f.total,0);
  const totCash     = totGjithsej - totDebitor;
  const totArk      = (mbyllja.arketimet||[]).reduce((s,a)=>s+a.shuma,0);

  // Rows — grouped by fatura with color per pag
  let rows = faturat.map(f => {
    const isDebitor = f.pag === 'Debitor';
    const isServis = f.pag === 'Servis';
    const rowBg = isDebitor ? '#fff5f5' : isServis ? '#fefce8' : '#f0fdf4';
    const totalColor = isDebitor ? '#dc2626' : isServis ? '#a16207' : '#16a34a';
    const pagLabel = isDebitor
      ? `<span style="font-size:10px;font-weight:700;color:#dc2626;background:#fef2f2;padding:2px 7px;border-radius:20px">🔴 Debitor</span>`
      : isServis
      ? `<span style="font-size:10px;font-weight:700;color:#a16207;background:#fef9c3;padding:2px 7px;border-radius:20px">🔧 Servis</span>`
      : `<span style="font-size:10px;font-weight:700;color:#16a34a;background:#f0fdf4;padding:2px 7px;border-radius:20px">💵 ${f.pag}</span>`;

    const itemRows = f.items.map(d => `
      <tr style="background:${rowBg}">
        <td style="padding:10px 12px;font-family:'JetBrains Mono',monospace;font-size:12px;color:var(--accent);font-weight:700;border:1px solid #e2e8f0">${d.fat}</td>
        <td style="padding:10px 12px;font-weight:600;border:1px solid #e2e8f0">${d.kli}</td>
        <td style="padding:10px 12px;color:var(--text2);border:1px solid #e2e8f0">${d.prod||'—'}</td>
        <td style="padding:10px 12px;text-align:center;border:1px solid #e2e8f0">${d.sasia}</td>
        <td style="padding:10px 12px;text-align:right;border:1px solid #e2e8f0">${fmtModal(d.cms,curr)}</td>
        <td style="padding:10px 12px;text-align:center;border:1px solid #e2e8f0">${pagLabel}</td>
        <td style="padding:10px 12px;text-align:right;font-weight:700;color:${totalColor};border:1px solid #e2e8f0">${fmtModal(d.total,curr)}</td>
      </tr>`).join('');

    return itemRows;
  }).join('');

  // Footer llogaritje
  const footerRows = `
    <tr style="border-top:2px solid #e5e7eb;background:#f9fafb">
      <td colspan="5" style="padding:8px 10px;font-weight:700;color:var(--text)">📊 Totali i të gjitha shitjeve</td>
      <td></td>
      <td style="padding:8px 10px;text-align:right;font-weight:800;font-size:14px;color:var(--text)">${fmtModal(totGjithsej,curr)}</td>
    </tr>
    ${totDebitor>0?`<tr style="background:#fff5f5">
      <td colspan="5" style="padding:6px 10px;font-weight:600;color:#dc2626">🔴 Zbritem Debitorët</td>
      <td></td>
      <td style="padding:6px 10px;text-align:right;font-weight:700;color:#dc2626">− ${fmtModal(totDebitor,curr)}</td>
    </tr>`:''}
    ${totArk>0?`<tr style="background:#f5f3ff">
      <td colspan="5" style="padding:6px 10px;font-weight:600;color:#7c3aed">💵 + Arkëtime Debitorësh</td>
      <td></td>
      <td style="padding:6px 10px;text-align:right;font-weight:700;color:#7c3aed">+ ${fmtModal(totArk,curr)}</td>
    </tr>`:''}
    <tr style="border-top:2px solid #16a34a;background:#f0fdf4">
      <td colspan="5" style="padding:10px 10px;font-weight:800;color:#16a34a;font-size:14px">✅ Total i Arkëtuar (Cash)</td>
      <td></td>
      <td style="padding:10px 10px;text-align:right;font-weight:900;font-size:16px;color:#16a34a">${fmtModal(totCash+totArk,curr)}</td>
    </tr>
    ${totDebitor>0?`<tr style="background:#fef2f2">
      <td colspan="5" style="padding:6px 10px;font-size:11px;color:#dc2626">🔴 Debitor i mbetur (jo i arkëtuar)</td>
      <td></td>
      <td style="padding:6px 10px;text-align:right;font-size:13px;font-weight:700;color:#dc2626">${fmtModal(totDebitor,curr)}</td>
    </tr>`:''}
  `;

  // Arkëtime section (nëse ka)
  let arkSection = '';
  if((mbyllja.arketimet||[]).length > 0){
    arkSection = `
    <div style="margin-top:1.25rem;border-radius:10px;overflow:hidden;border:1px solid #ede9fe">
      <div style="background:#f5f3ff;padding:8px 14px;font-size:12px;font-weight:700;color:#7c3aed;text-transform:uppercase;letter-spacing:.05em">
        💵 Arkëtime Debitorësh të Bëra Sot
      </div>
      <table style="font-size:12px;width:100%;border-collapse:collapse">
        <thead><tr style="background:#ede9fe">
          <th style="padding:6px 10px;text-align:left;color:#7c3aed">Nr. Faturës</th>
          <th style="padding:6px 10px;text-align:left;color:#7c3aed">Klienti</th>
          <th style="padding:6px 10px;text-align:left;color:#7c3aed">Data Faturës</th>
          <th style="padding:6px 10px;text-align:right;color:#7c3aed">Arkëtuar</th>
        </tr></thead>
        <tbody>${mbyllja.arketimet.map(a=>`<tr style="border-top:1px solid #ede9fe">
          <td style="padding:6px 10px;font-family:'JetBrains Mono',monospace;font-weight:700;color:var(--accent)">${a.fat}</td>
          <td style="padding:6px 10px;font-weight:600">${a.kli}</td>
          <td style="padding:6px 10px;color:var(--text3)">${a.dataFat||'—'}</td>
          <td style="padding:6px 10px;text-align:right;font-weight:700;color:#7c3aed">${fmtModal(a.shuma,curr)}</td>
        </tr>`).join('')}</tbody>
      </table>
    </div>`;
  }

  // Ora mbylljes
  const oraStr = mbyllja.ts
    ? `🕐 ${String(new Date(mbyllja.ts).getHours()).padStart(2,'0')}:${String(new Date(mbyllja.ts).getMinutes()).padStart(2,'0')}`
    : '';

  container.innerHTML = `
    <div style="margin-bottom:1rem;padding:.75rem;background:#f8fafc;border-radius:10px;border:1px solid var(--border)">
      <div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:.5rem;font-size:14px;font-weight:700">
        <span>📅 ${mbyllja.data} &nbsp;<span style="font-size:12px;color:var(--text3);font-weight:500">${oraStr}</span></span>
        <span style="color:#16a34a">✅ Cash: ${fmtModal(totCash+totArk,curr)}</span>
      </div>
      <div style="display:flex;gap:1.25rem;margin-top:.5rem;flex-wrap:wrap">
        <span style="font-size:12px;color:var(--text3)">🧾 <b style="color:var(--text)">${mbyllja.numriFaturave||0}</b> fatura</span>
        <span style="font-size:12px;color:var(--text3)">💵 Cash shitje: <b style="color:#16a34a">${fmtModal(totCash,curr)}</b></span>
        ${totArk>0?`<span style="font-size:12px;color:var(--text3)">💵 Arkëtime: <b style="color:#7c3aed">${fmtModal(totArk,curr)}</b></span>`:''}
        ${totDebitor>0?`<span style="font-size:12px;color:var(--text3)">🔴 Debitor: <b style="color:#dc2626">${fmtModal(totDebitor,curr)}</b></span>`:''}
      </div>
    </div>

    <div style="overflow-x:auto;-webkit-overflow-scrolling:touch">
    <table style="font-size:13px;width:100%;border-collapse:collapse;min-width:520px;border:1px solid #e2e8f0">
      <thead style="background:#f8fafc;border-bottom:2px solid #0f172a">
        <tr>
          <th style="padding:12px;text-align:left;font-weight:700;border:1px solid #e2e8f0">Nr. Faturës</th>
          <th style="padding:12px;text-align:left;font-weight:700;border:1px solid #e2e8f0">Klienti</th>
          <th style="padding:12px;text-align:left;font-weight:700;border:1px solid #e2e8f0">Produkti</th>
          <th style="padding:12px;text-align:center;font-weight:700;border:1px solid #e2e8f0">Sasia</th>
          <th style="padding:12px;text-align:right;font-weight:700;border:1px solid #e2e8f0">Çmimi</th>
          <th style="padding:12px;text-align:center;font-weight:700;border:1px solid #e2e8f0">Pagesa</th>
          <th style="padding:12px;text-align:right;font-weight:700;border:1px solid #e2e8f0">Totali</th>
        </tr>
      </thead>
      <tbody>
        ${rows || '<tr><td colspan="7" style="text-align:center;color:var(--text3);padding:1rem;">Nuk ka detaje</td></tr>'}
        ${footerRows}
      </tbody>
    </table>
    </div>
    ${arkSection}
  `;

  document.getElementById('modal-xhiro-detail').classList.add('open');
}

function renderXhiro() {
  const sot = today();
  const totalSot = llogaritXhiroSotme();
  
  document.getElementById('xhiro-sot').textContent = fmtL(totalSot.cash + totalSot.arkCash);
  document.getElementById('xhiro-cash').textContent = fmtL(totalSot.cash);
  document.getElementById('xhiro-debitor').textContent = fmtL(totalSot.debitor);
  // Show arkëtime info if any
  const arkEl = document.getElementById('xhiro-arketim-info');
  if(arkEl) arkEl.style.display = totalSot.arkCash > 0 ? 'block' : 'none';
  if(arkEl && totalSot.arkCash > 0) arkEl.textContent = `💵 Nga të cilat arkëtime debitorësh: ${fmtL(totalSot.arkCash)}`;
  if (xhiroTsFundit > 0) {
    const mbylljaHere = new Date(xhiroTsFundit);
    const h = String(mbylljaHere.getHours()).padStart(2,'0');
    const m = String(mbylljaHere.getMinutes()).padStart(2,'0');
    document.getElementById('xhiro-date-sot').textContent = `(nga ora ${h}:${m} — pas mbylljes)`;
  } else {
    document.getElementById('xhiro-date-sot').textContent = `(${sot})`;
  }

  const historikuSorted = [...xhiroHistoriku].reverse();
  
  const tbody = document.getElementById('xhiro-body');
  if (!historikuSorted.length) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:var(--text3);padding:1.5rem;">Nuk ka ende mbyllje xhiro.</td></tr>`;
    return;
  }

  document.querySelector('#xhiro-head tr').innerHTML = '<th>Data & Ora Mbylljes</th><th>💵 Cash (i arkëtuar)</th><th>🔴 Debitor</th><th>Fatura</th><th>Veprime</th>';

  tbody.innerHTML = historikuSorted.map((m, idx) => {
    const realIndex = xhiroHistoriku.length - 1 - idx;
    let oraStr = '';
    if(m.ts){
      const d=new Date(m.ts);
      const hh=String(d.getHours()).padStart(2,'0');
      const mm=String(d.getMinutes()).padStart(2,'0');
      oraStr=` <span style="font-size:11px;color:var(--text3);font-weight:500">🕐 ${hh}:${mm}</span>`;
    }
    const cashReal = (m.cash||0) + (m.arkCash||0);
    const debReal  = m.debitor||0;
    return `
      <tr>
        <td style="font-weight:600;">${m.data}${oraStr}</td>
        <td style="font-weight:700;color:${cashReal>0?'#16a34a':'var(--text3)'};">${fmtL(cashReal)}</td>
        <td style="font-weight:700;color:${debReal>0?'#dc2626':'var(--text3)'};">${debReal>0?fmtL(debReal):'—'}</td>
        <td>${m.numriFaturave || 0}</td>
        <td style="display:flex;gap:4px">
          <button class="btn btn-outline btn-sm" onclick="shikoDetajetXhiro(${realIndex})">👁 Detaje</button>
          ${currentRole === 'admin' || currentRole === 'manager' ? `<button class="btn btn-danger btn-sm" onclick="fshiMbylljeXhiro(${realIndex})">🗑</button>` : ''}
        </td>
      </tr>
    `;
  }).join('');
}

function fshiMbylljeXhiro(index) {
  const mbyllja = xhiroHistoriku[index];
  if (!mbyllja) return;
  if (!confirm(`A jeni i sigurt që doni të fshini mbylljen e datës ${mbyllja.data} me total ${fmtL(mbyllja.totali)}?`)) return;
  
  xhiroHistoriku.splice(index, 1);
  localStorage.setItem('tp_xhiro_historiku', JSON.stringify(xhiroHistoriku));
  
  const last = xhiroHistoriku[xhiroHistoriku.length - 1];
  xhiroDataFunditMbyllje = last ? last.data : '';
  localStorage.setItem('tp_xhiro_data_fundit', xhiroDataFunditMbyllje);
  
  if (last) {
    xhiroTsFundit = last.ts || 0; 
  } else {
    xhiroTsFundit = 0;
  }
  localStorage.setItem('tp_xhiro_ts_fundit', String(xhiroTsFundit));
  
  renderXhiro();
}

function exportXhiroExcel() {
  const data = xhiroHistoriku.map(m => ({
    'Data': m.data,
    'Cash': m.cash != null ? m.cash : m.totali,
    'Debitor': m.debitor != null ? m.debitor : 0,
    'Xhiro e Mbyllur': m.totali,
    'Numri i Faturave': m.numriFaturave || 0
  }));
  const _xhSot = llogaritXhiroSotme();
  data.push({
    'Data': 'XHIRO E SOTME (E PAZERUAR)',
    'Cash': _xhSot.cash,
    'Debitor': _xhSot.debitor,
    'Xhiro e Mbyllur': _xhSot.total,
    'Numri i Faturave': '—'
  });

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Xhiro');
  XLSX.writeFile(wb, `Xhiro_Ditore_${today()}.xlsx`);
}

function printXhiro() {
  const historikuSorted = [...xhiroHistoriku].reverse();
  let rows = historikuSorted.map(m => `
    <tr>
      <td style="padding:6px 10px;border-bottom:1px solid #eee;">${m.data}</td>
      <td style="padding:6px 10px;border-bottom:1px solid #eee;text-align:center;">${m.numriFaturave || 0}</td>
      <td style="padding:6px 10px;border-bottom:1px solid #eee;text-align:right;font-weight:700;">${fmtL(m.totali)}</td>
    </tr>
  `).join('');

  const printWin = window.open('', '_blank', 'width=800,height=600');
  printWin.document.write(`
    <!DOCTYPE html>
    <html>
    <head><meta charset="UTF-8"><title>Raport Xhiro</title>
    <style>
      body { font-family: 'Inter', sans-serif; padding: 2rem; }
      h1 { font-size: 22px; margin-bottom: 0.5rem; }
      table { width: 100%; border-collapse: collapse; margin-top: 1rem; }
      th { background: #1a1d27; color: #fff; padding: 8px 12px; text-align: left; font-size: 12px; text-transform: uppercase; }
      td { padding: 6px 12px; border-bottom: 1px solid #eee; }
      .total-row { font-weight: 700; background: #f0f4ff; }
      .footer { margin-top: 2rem; font-size: 11px; color: #999; text-align: center; border-top: 1px solid #ddd; padding-top: 1rem; }
    </style>
    </head>
    <body>
      <h1>📋 Raporti i Xhiros Ditore</h1>
      <p style="color:#666;font-size:13px;">${bizCfg.emri} · ${today()}</p>
      <table>
        <thead><tr><th>Data</th><th style="text-align:center">Numri i Faturave</th><th style="text-align:right">Xhiro e Mbyllur</th></tr></thead>
        <tbody>
          ${rows}
          <tr class="total-row">
            <td style="text-align:right;font-size:14px;">TOTALI:</td>
            <td style="text-align:center;font-size:14px;">${xhiroHistoriku.reduce((s,m) => s + (m.numriFaturave || 0), 0)}</td>
            <td style="text-align:right;font-size:14px;">${fmtL(xhiroHistoriku.reduce((s,m) => s + m.totali, 0))}</td>
          </tr>
        </tbody>
      </table>
      <div class="footer">${bizCfg.footer || ''} · ${bizCfg.emri}</div>
      <script>window.onload = function() { window.print(); }<\/script>
    </body>
    </html>
  `);
  printWin.document.close();
}

// ============================================================
// FUND I RAPORTIT XHIRO DITORE
// ============================================================

function kpiCard(icon,val,lbl,color,trend){
  return `<div class="kpi ${color}">
    <div class="kpi-icon">${icon}</div>
    <div class="kpi-body">
      <div class="kpi-val">${val}</div>
      <div class="kpi-lbl">${lbl}</div>
      ${trend?`<div class="kpi-trend up">${trend}</div>`:''}
    </div>
  </div>`;
}

function updateAlarmBadge(){
  const n=products.filter(p=>p.stok<=p.min).length;
  const el=document.getElementById('alarm-badge');
  el.style.display=n>0?'inline':'none';el.textContent=n;
}

function renderDashboard(){
  const totS=shitjet.filter(s=>s.pag!=='Preventiv').reduce((s,x)=>s+x.sasia*x.cms,0);
  const totB=blerjet.reduce((s,x)=>s+x.sasia*x.cmb,0);
  const totF=shitjet.filter(s=>s.pag!=='Preventiv').reduce((s,x)=>{const p=getProd(x.prod);return s+x.sasia*(x.cms-(p?p.cmb:0));},0);
  const alarme=products.filter(p=>p.stok<=p.min);
  const isUser=(currentRole==='user');

  if(isUser){
    document.getElementById('dash-kpi').innerHTML=
      kpiCard('🏪',products.length,'Produkte Aktive','purple','')+
      kpiCard('⚠️',alarme.length,'Alarme Stoku','red',alarme.length>0?'Kërkon vëmendje':'Gjithçka mirë');
  } else {
    document.getElementById('dash-kpi').innerHTML=
      kpiCard('💰',fmtL(totS),'Xhiro Totale','blue','↑ Të gjitha kohërat')+
      kpiCard('📦',fmtL(totB),'Blerje Totale','amber','')+
      kpiCard('📈',fmtL(totF),'Fitim Bruto','green','Marzha: '+(totS>0?(totF/totS*100).toFixed(1)+'%':'—'))+
      kpiCard('🏪',products.length,'Produkte Aktive','purple','')+
      kpiCard('⚠️',alarme.length,'Alarme Stoku','red',alarme.length>0?'Kërkon vëmendje':'');
  }

  const chartsSection=document.getElementById('dash-charts-section');
  const alarmeUser=document.getElementById('dash-alarme-user');
  if(isUser){
    if(chartsSection) chartsSection.style.display='none';
    if(alarmeUser) alarmeUser.style.display='block';
    const ul=document.getElementById('dash-alarme-user-list');
    if(ul){
      if(alarme.length===0){
        ul.innerHTML='<div style="color:#16a34a;font-size:13px;font-weight:600">✅ Asnjë alarm — stoku është mirë!</div>';
      } else {
        ul.innerHTML=alarme.map(p=>`
          <div style="display:flex;align-items:center;gap:.6rem;padding:.55rem 0;border-bottom:1px solid #fed7aa">
            <div style="font-size:20px">📦</div>
            <div style="flex:1;min-width:0">
              <div style="font-size:13px;font-weight:700;color:#92400e">${p.name}</div>
              <div style="font-size:11px;color:#b45309">Minimumi: ${p.min} ${p.nje}</div>
            </div>
            <div style="font-size:20px;font-weight:800;color:#ef4444">${p.stok} <span style="font-size:11px;font-weight:500">${p.nje}</span></div>
          </div>`).join('');
      }
    }
  } else {
    if(chartsSection) chartsSection.style.display='block';
    if(alarmeUser) alarmeUser.style.display='none';

    const el1=document.getElementById('dash-total-shitje');
    const el2=document.getElementById('dash-total-blerje');
    const el3=document.getElementById('dash-total-fitim');
    if(el1)el1.textContent=fmtL(totS);
    if(el2)el2.textContent=fmtL(totB);
    if(el3)el3.textContent=fmtL(totF);

    const alMini=document.getElementById('dash-alarme-mini');
    if(alMini){
      if(alarme.length===0){
        alMini.innerHTML='<div style="color:#16a34a;font-size:13px;padding:.5rem 0;font-weight:600">✅ Asnjë alarm — stoku është mirë!</div>';
      } else {
        alMini.innerHTML=alarme.map(p=>`
          <div style="display:flex;align-items:center;gap:.6rem;padding:.5rem 0;border-bottom:1px solid #fed7aa">
            <div style="font-size:20px">📦</div>
            <div style="flex:1;min-width:0">
              <div style="font-size:12px;font-weight:700;color:#92400e;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${p.name}</div>
              <div style="font-size:11px;color:#b45309">Min: ${p.min} ${p.nje}</div>
            </div>
            <div style="font-size:18px;font-weight:800;color:#ef4444">${p.stok}</div>
          </div>`).join('');
      }
    }
    renderCharts(totS,totB);
  }

  const alEl=document.getElementById('dash-alarme');
  if(alEl) alEl.innerHTML='';
}

function renderCharts(totS,totB){
  const allDates=[...new Set([...shitjet.map(s=>s.data),...blerjet.map(b=>b.data)])].sort().slice(-7);
  const labels=allDates.map(d=>d.slice(5));
  const dataS=allDates.map(d=>shitjet.filter(s=>s.data===d&&s.pag!=='Preventiv').reduce((a,s)=>a+s.sasia*s.cms,0));
  const dataB=allDates.map(d=>blerjet.filter(b=>b.data===d).reduce((a,b)=>a+b.sasia*b.cmb,0));

  if(mainChart)mainChart.destroy();
  const ctx=document.getElementById('chart-main');
  if(!ctx)return;
  mainChart=new Chart(ctx,{
    type:'bar',
    data:{labels,datasets:[
      {label:'Shitje',data:dataS,backgroundColor:'rgba(79,110,247,.9)',borderRadius:8,borderSkipped:false,hoverBackgroundColor:'rgba(124,92,252,1)'},
      {label:'Blerje',data:dataB,backgroundColor:'rgba(245,158,11,.7)',borderRadius:8,borderSkipped:false,hoverBackgroundColor:'rgba(245,158,11,.9)'},
    ]},
    options:{responsive:true,maintainAspectRatio:false,
      plugins:{
        legend:{labels:{font:{family:'Inter',size:11},boxWidth:10,color:'rgba(255,255,255,.7)'}},
        tooltip:{callbacks:{label:ctx=>' '+fmtL(ctx.parsed.y)},backgroundColor:'rgba(0,0,0,.8)',padding:10,cornerRadius:8}
      },
      scales:{
        x:{grid:{display:false},ticks:{font:{family:'Inter',size:10},color:'rgba(255,255,255,.5)'},border:{display:false}},
        y:{grid:{color:'rgba(255,255,255,.06)'},ticks:{font:{family:'Inter',size:10},color:'rgba(255,255,255,.4)',callback:v=>fmtL(v)},border:{display:false}}
      }
    }
  });

  const katMap={};
  shitjet.filter(s=>s.pag!=='Preventiv').forEach(s=>{const p=getProd(s.prod);const k=p?p.kat:'Tjetër';katMap[k]=(katMap[k]||0)+s.sasia*s.cms;});
  const katLabels=Object.keys(katMap);
  const katData=Object.values(katMap);
  const colors=['#4f6ef7','#22c55e','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#f97316'];

  if(donutChart)donutChart.destroy();
  const ctx2=document.getElementById('chart-donut');
  if(!ctx2)return;
  donutChart=new Chart(ctx2,{
    type:'doughnut',
    data:{labels:katLabels,datasets:[{data:katData,backgroundColor:colors.slice(0,katLabels.length),borderWidth:3,borderColor:'#fff',hoverOffset:6}]},
    options:{responsive:true,maintainAspectRatio:false,cutout:'68%',plugins:{legend:{position:'bottom',labels:{font:{family:'Inter',size:11},boxWidth:10,padding:8}},tooltip:{callbacks:{label:ctx=>' '+fmtL(ctx.parsed)}}}}
  });
}

function dashProdSearch(q){
  const res=document.getElementById('dash-prod-results');
  if(!res)return;
  q=q.trim().toLowerCase();
  if(!q){res.innerHTML='';return;}
  const found=products.filter(p=>
    p.name.toLowerCase().includes(q)||
    (p.id||'').toLowerCase().includes(q)||
    (p.kat||'').toLowerCase().includes(q)
  ).slice(0,8);
  if(!found.length){
    res.innerHTML='<div style="color:var(--text3);font-size:13px;padding:.25rem 0">Asnjë produkt u gjet.</div>';
    return;
  }
  res.innerHTML=`<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:.6rem">
    ${found.map(p=>{
      const low=p.stok<=p.min;
      return `<div style="display:flex;align-items:center;gap:.75rem;background:${low?'#fef2f2':'#f8fafc'};border:1.5px solid ${low?'#fecaca':'var(--border)'};border-radius:12px;padding:.7rem 1rem;cursor:pointer;transition:box-shadow .15s" onclick="toggleInlineShitje(true);setTimeout(()=>dsSelectProd('${p.id}'),80)" title="Kliko për të shitur">
        <div style="font-size:28px;width:40px;text-align:center">${prodEmoji(p.kat)}</div>
        <div style="flex:1;min-width:0">
          <div style="font-size:12px;font-weight:700;color:var(--text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${p.name}</div>
          <div style="font-size:11px;color:var(--text3);margin-top:1px">${p.id} · ${p.kat}</div>
          <div style="display:flex;gap:.75rem;margin-top:4px;align-items:center">
            <span style="font-size:13px;font-weight:800;color:var(--accent)">${fmtL(p.cms)}</span>
            <span style="font-size:11px;font-weight:600;color:${low?'#ef4444':'#16a34a'}">${p.stok} ${p.nje}${low?' ⚠️':''}</span>
          </div>
        </div>
        <div style="font-size:18px;opacity:.4">⬆</div>
      </div>`;
    }).join('')}
  </div>`;
}

function exportArkivExcel(){
  if(!fatScopedCache.length){alert('Nuk ka fatura për të eksportuar në këtë periudhë.');return;}
  const data=fatScopedCache.map(f=>{
    const meta=getFatureMeta(f.fat);
    const tvsh = meta.tvshOpt === 'po' ? f.vlera * 0.2 : 0;
    return {
      'Nr. Faturës': f.fat,
      'Data': f.data,
      'Tipi': f.tipi,
      'Palë Tjetër': f.pale,
      'Vlera': f.vlera,
      'TVSH 20%': tvsh,
      'Total + TVSH': f.vlera+tvsh,
      'Statusi': f.tipi==='Shitje'?getFatureStatus(f.fat):'paguar'
    };
  });
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  const emriPeriudhe = (document.getElementById('fat-search')?.value||'').trim() ? 'Kerkim' : (fatArkivMuaj?muajLabel(fatArkivMuaj):muajLabel(muajiAktualKey()));
  XLSX.utils.book_append_sheet(wb, ws, 'Faturat');
  XLSX.writeFile(wb, `Faturat_${emriPeriudhe.replace(/\s+/g,'_')}_${today()}.xlsx`);
}

function renderBilanci(){
  const ngaEl=document.getElementById('bil-nga');
  const deriEl=document.getElementById('bil-deri');
  const nga=ngaEl?.value||'';
  const deri=deriEl?.value||'';
  let filteredBlerjet=blerjet;
  let filteredShitjet=shitjet.filter(s=>s.pag!=='Preventiv');
  let filteredShpenzimet=shpenzimet;
  if(nga||deri){
    filteredBlerjet=blerjet.filter(b=>{if(nga&&b.data<nga)return false;if(deri&&b.data>deri)return false;return true;});
    filteredShitjet=filteredShitjet.filter(s=>{if(nga&&s.data<nga)return false;if(deri&&s.data>deri)return false;return true;});
    filteredShpenzimet=shpenzimet.filter(sh=>{if(nga&&sh.data<nga)return false;if(deri&&sh.data>deri)return false;return true;});
  }
  document.getElementById('bil-period-label').textContent=nga||deri?`Perioda: ${nga||'fillimi'} deri ${deri||'sot'}`:'Të gjitha perioda';
  const totS=filteredShitjet.reduce((s,x)=>s+x.sasia*x.cms,0);
  const totB=filteredBlerjet.reduce((s,x)=>s+x.sasia*x.cmb,0);
  const fBruto=totS-totB;
  const shpOp=filteredShpenzimet.reduce((s,x)=>s+x.vlera,0);
  const fOp=fBruto-shpOp;
  const fNeto=fOp;
  document.getElementById('bil-kpi').innerHTML=
    kpiCard('💰',fmtL(totS),'Xhiro','green','')+
    kpiCard('📦',fmtL(totB),'Kosto Mallrash','amber','')+
    kpiCard('📈',fmtL(fNeto),'Fitim Neto',fNeto>0?'blue':'red','');
  
  const fitimiBretoHtml=`
    <div style="margin-bottom:1.5rem;padding:1rem;background:#f0fdf4;border-radius:10px;border-left:4px solid #16a34a">
      <div style="font-weight:700;color:#16a34a;margin-bottom:.75rem;font-size:14px">FITIMI BRUTO</div>
      <div class="bil-row"><span>Xhiro nga Shitjet</span><span style="font-weight:600;color:#16a34a">${fmtL(totS)}</span></div>
      <div class="bil-row"><span>Kosto e Mallrave</span><span style="font-weight:600;color:#dc2626">(${fmtL(totB)})</span></div>
      <div class="bil-row" style="border-top:2px solid #16a34a;padding-top:8px;margin-top:8px"><span style="font-weight:700">Fitimi Bruto</span><span style="font-weight:800;color:#16a34a;font-size:15px">${fmtL(fBruto)}</span></div>
    </div>`;
  // Grupojmë blerjet sipas faturës për t'i shfaqur si rreshta shtesë (vetëm për pamje/informacion)
  const blerjeByFat={};
  filteredBlerjet.forEach(b=>{
    if(!blerjeByFat[b.fat])blerjeByFat[b.fat]={fat:b.fat,furn:b.furn,data:b.data,total:0};
    blerjeByFat[b.fat].total+=b.sasia*b.cmb;
  });
  const blerjeGrouped=Object.values(blerjeByFat);

  const shpenzimetHtml=`
    <div style="margin-bottom:1.5rem;padding:1rem;background:#fffbeb;border-radius:10px;border-left:4px solid #d97706">
      <div style="font-weight:700;color:#d97706;margin-bottom:.75rem;font-size:14px">SHPENZIMET OPERATIVE</div>
      ${filteredShpenzimet.length>0?filteredShpenzimet.map(sh=>`<div class="bil-row"><span>${sh.kat}: ${sh.pershkrim}</span><span style="font-weight:600;color:#dc2626">(${fmtL(sh.vlera)})</span></div>`).join(''):'<div style="font-size:12px;color:var(--text3);padding:4px 0">Nuk ka shpenzime për këtë periudhë</div>'}
      <div class="bil-row" style="border-top:2px solid #d97706;padding-top:8px;margin-top:8px"><span style="font-weight:700">Total Shpenzime Operative</span><span style="font-weight:800;color:#d97706;font-size:15px">(${fmtL(shpOp)})</span></div>
      ${blerjeGrouped.length>0?`
      <div style="margin-top:14px;padding-top:12px;border-top:1px dashed #fbbf24">
        <div style="font-size:11px;font-weight:700;color:#b45309;text-transform:uppercase;letter-spacing:.05em;margin-bottom:6px">📦 Blerjet (mallra për rishitje)</div>
        ${blerjeGrouped.map(b=>`<div class="bil-row" style="opacity:.85"><span>${b.furn} — ${b.fat}</span><span style="font-weight:600;color:#dc2626">(${fmtL(b.total)})</span></div>`).join('')}
        <div class="bil-row" style="padding-top:4px"><span style="font-weight:700;color:#b45309">Total Blerje</span><span style="font-weight:800;color:#b45309">(${fmtL(totB)})</span></div>
        <div style="font-size:10.5px;color:var(--text3);margin-top:6px;font-style:italic">ℹ️ Blerjet llogariten te "Kosto e Mallrave" tek Fitimi Bruto më sipër — shfaqen këtu vetëm si informacion, pa u zbritur sërish nga fitimi.</div>
      </div>`:''}
    </div>`;
  const fitimiNetoHtml=`
    <div style="padding:1rem;background:${fNeto>0?'#eff2fe':'#fef2f2'};border-radius:10px;border-left:4px solid ${fNeto>0?'#4f6ef7':'#dc2626'}">
      <div style="font-weight:700;color:${fNeto>0?'#4f6ef7':'#dc2626'};margin-bottom:.75rem;font-size:14px">FITIMI NETO</div>
      <div class="bil-row" style="border-top:2px solid ${fNeto>0?'#4f6ef7':'#dc2626'};padding-top:8px;margin-top:8px"><span style="font-weight:700;font-size:15px">FITIMI NETO</span><span style="font-weight:800;color:${fNeto>0?'#4f6ef7':'#dc2626'};font-size:18px">${fmtL(fNeto)}</span></div>
    </div>`;
  document.getElementById('bil-body').innerHTML=fitimiBretoHtml+shpenzimetHtml+fitimiNetoHtml;
}

function bilSetPeriod(period){
  const today=new Date();
  const ngaEl=document.getElementById('bil-nga');
  const deriEl=document.getElementById('bil-deri');
  let nga='',deri='';
  if(period==='today'){
    nga=toLocalISODate(today);
    deri=toLocalISODate(today);
  }else if(period==='month'){
    nga=toLocalISODate(new Date(today.getFullYear(),today.getMonth(),1));
    deri=toLocalISODate(today);
  }else if(period==='year'){
    nga=toLocalISODate(new Date(today.getFullYear(),0,1));
    deri=toLocalISODate(today);
  }else if(period==='all'){
    nga='';deri='';
  }
  if(ngaEl)ngaEl.value=nga;
  if(deriEl)deriEl.value=deri;
  renderBilanci();
}

function showFatureByFat(fat){
  const isSh=shitjet.some(s=>s.fat===fat);
  const meta=getFatureMeta(fat);
  const curr = meta.valuta || 'ALL';
  const rate = (curr === 'EUR' && exchangeRateEUR > 0) ? exchangeRateEUR : 1;

  if(isSh){
    const allSh=shitjet.filter(s=>s.fat===fat);
    const sh=allSh[0];
    const items=allSh.map(s=>{
      const p=getProd(s.prod);
      const cm = s.cms / rate;
      let name = p ? p.name : s.prod;
      let nje = p ? p.nje : '';
      if (s.prod === 'SERVIS') {
        name = s.name || 'Servis';
        nje = s.nje || 'Pune';
      }
      return {name:name,kodi:s.prod,nje:nje,sasia:s.sasia,cm:cm,total:s.sasia*cm};
    });
    const subtotal=items.reduce((s,i)=>s+i.total,0);
    const tvsh = meta.tvshOpt === 'po' ? subtotal * 0.2 : 0;
    currentFatureData={tipi:'SHITJEJE',fat,data:sh.data,pale:sh.kli,pag:sh.pag,items,subtotal,tvsh,total:subtotal+tvsh,status:meta.status||'paguar',paguar:(meta.paguar||0)/rate,borxh:(meta.borxh||0)/rate,afat:meta.afat||'',valuta:curr};
  }else{
    const allBl=blerjet.filter(b=>b.fat===fat);
    const bl=allBl[0];
    const items=allBl.map(b=>{
      const p=getProd(b.prod);
      const cm = b.cmb / rate;
      return {name:p?p.name:b.prod,kodi:b.prod,nje:p?p.nje:'',sasia:b.sasia,cm:cm,total:b.sasia*cm};
    });
    const subtotal=items.reduce((s,i)=>s+i.total,0);
    const tvsh = meta.tvshOpt === 'po' ? subtotal * 0.2 : 0;
    currentFatureData={tipi:'BLERJES',fat,data:bl.data,pale:bl.furn,pag:'Transfer',items,subtotal,tvsh,total:subtotal+tvsh,status:'paguar',paguar:subtotal+tvsh,borxh:0,afat:'',valuta:curr};
  }
  showFatureInline();
}

function showFature(tipi,id,fatObj){
  const fat=id?shitjet.find(x=>x.id===id)?.fat||blerjet.find(x=>x.id===id)?.fat:fatObj?.fat;
  if(fat)showFatureByFat(fat);
}

function showFatureInline(){
  // Shfaq faturën si modal — pa ndryshuar tab ku ndodhemi
  const content = document.getElementById('modal-fature-content');
  if(content){
    content.innerHTML = buildFatureHTML(currentFatureData);
    _generateFaturaQR(currentFatureData);
    // Shfaq butonin "Paguaj" vetëm për preventiv
    const paguajBtn = document.getElementById('modal-fature-paguaj-btn');
    if(paguajBtn){
      const isPrev = currentFatureData && (currentFatureData.status==='preventiv' || currentFatureData.pag==='Preventiv');
      paguajBtn.style.display = isPrev ? 'inline-flex' : 'none';
    }
    document.getElementById('modal-view-fature').classList.add('open');
    return;
  }
  // Fallback: dashboard inline (nëse mungon modali)
  const dashTab=document.getElementById('tab-0');
  if(dashTab && !dashTab.classList.contains('active')){
    const navBtns=document.querySelectorAll('.nav-btn');
    document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b=>b.classList.remove('active'));
    dashTab.classList.add('active');
    if(navBtns[0]) navBtns[0].classList.add('active');
    document.getElementById('page-title').textContent=TABS[0];
    currentTab=0;
    const addBtn=document.getElementById('topbar-add-btn'); if(addBtn) addBtn.style.display='none';
    const srch=document.getElementById('topbar-search-wrap'); if(srch) srch.style.display='none';
  }
  document.getElementById('dash-fature-content').innerHTML=buildFatureHTML(currentFatureData);
  _generateFaturaQR(currentFatureData);
  document.getElementById('dash-fature-inline').style.display='block';
  const shInline=document.getElementById('dash-shitje-inline');
  if(shInline) shInline.style.display='none';
  setTimeout(()=>{
    document.getElementById('dash-fature-inline').scrollIntoView({behavior:'smooth',block:'start'});
  },80);
}

function buildFatureHTML(d){
  const curr = d.valuta || 'ALL';
  const isPrev = d.status==='preventiv' || d.pag==='Preventiv';
  const status = d.status || 'paguar';

  const rows = d.items.map((it,i) => `
    <tr>
      <td style="padding:13px 0;font-size:13px;color:#374151;border-bottom:1px solid #f1f5f9;vertical-align:top">
        <div style="font-weight:600;color:#111827;font-size:13.5px">${it.name}</div>
        ${it.kodi?`<div style="font-size:11px;color:#9ca3af;margin-top:2px">${it.kodi}</div>`:''}
      </td>
      <td style="padding:13px 12px;text-align:center;font-size:12px;color:#6b7280;border-bottom:1px solid #f1f5f9;vertical-align:top">${it.nje}</td>
      <td style="padding:13px 12px;text-align:center;font-weight:700;font-size:13px;color:#111827;border-bottom:1px solid #f1f5f9;vertical-align:top">${it.sasia}</td>
      <td style="padding:13px 12px;text-align:right;font-size:13px;color:#6b7280;border-bottom:1px solid #f1f5f9;vertical-align:top">${fmtModal(it.cm,curr)}</td>
      <td style="padding:13px 0;text-align:right;font-weight:700;font-size:13.5px;color:#111827;border-bottom:1px solid #f1f5f9;vertical-align:top">${fmtModal(it.total,curr)}</td>
    </tr>`).join('');

  const stampColors = {
    paguar:    ['#dcfce7','#16a34a','✓ PAGUAR PLOTËSISHT'],
    papaguar:  ['#fee2e2','#dc2626','✗ PA PAGUAR'],
    pjeserisht:['#ede9fe','#7c3aed','◑ PAGUAR PJESËRISHT'],
    preventiv: ['#fef3c7','#d97706','OFERTË ÇMIMI']
  };
  const [sc,stc,stxt] = stampColors[status] || stampColors.paguar;

  const borxhRow = d.borxh > 0 ? `
    <div style="display:flex;justify-content:space-between;padding:7px 0;font-size:13px;color:#dc2626;border-bottom:1px solid #fee2e2">
      <span style="font-weight:600">Mbetet</span>
      <span style="font-weight:700">${fmtModal(d.borxh,curr)}</span>
    </div>` : '';

  const afatRow = d.afat ? `
    <div style="display:flex;justify-content:space-between;padding:7px 0;font-size:12px;color:#d97706">
      <span>Afati i pagesës</span><span style="font-weight:600">${d.afat}</span>
    </div>` : '';

  const prevNote = isPrev ? `
    <div style="margin:0 2.5rem 1.5rem;background:#fffbeb;border-left:3px solid #d97706;padding:10px 16px;border-radius:0 6px 6px 0;font-size:12px;color:#92400e;line-height:1.6">
      <strong>Ofertë Çmimi</strong> — Ky dokument shërben si informacion mbi vlerat e produkteve/shërbimeve të kërkuara.
    </div>` : '';

  const kursiHTML = (curr !== 'ALL') ? `
    <div style="font-size:11px;color:#9ca3af;text-align:center;padding:4px 0">
      Kurs: 1 ${curr} = ${curr==='EUR'?exchangeRateEUR:exchangeRate} ALL · ${today()}
    </div>` : '';

  // Mënyra e pagesës — pa Servis
  const pagDisplay = d.pag==='Debitor'
    ? '<span style="background:#fee2e2;color:#dc2626;padding:3px 12px;border-radius:20px;font-size:13px">🔴 Debitor</span>'
    : d.pag;

  return `<div id="fat-print-body" class="fature-wrapper ${isPrev?'preventiv-theme':''}" style="font-family:'Inter',system-ui,sans-serif;color:#111827;background:#fff;max-width:680px;margin:0 auto">
    ${isPrev ? '<div class="watermark">PREVENTIV</div>' : ''}

    <!-- HEADER — stil i njëjtë me modalin preventiv -->
    <div class="fature-header" style="background:#1e293b;padding:1.5rem 2rem;display:grid;grid-template-columns:1fr auto;gap:1.5rem;align-items:start;border-radius:0">
      <!-- E majta: Lëshuar nga + emri biznesi -->
      <div>
        ${bizCfg.logo?`<img src="${bizCfg.logo}" style="height:40px;margin-bottom:10px;display:block;filter:brightness(0) invert(1)" alt="Logo">`:''}
        <div style="font-size:10px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.1em;margin-bottom:.4rem">Lëshuar nga</div>
        <div style="font-size:18px;font-weight:900;color:#f8fafc;letter-spacing:-.3px;line-height:1.2">${bizCfg.emri||'—'}</div>
        <div style="font-size:12px;color:#94a3b8;margin-top:.35rem;line-height:1.7">
          ${bizCfg.adresa?`${bizCfg.adresa}<br>`:''}
          ${bizCfg.tel?`Tel: ${bizCfg.tel}`:''} ${bizCfg.email?`· ${bizCfg.email}`:''}
        </div>
        ${bizCfg.nipt?`<div style="font-size:11px;color:#64748b;margin-top:.2rem;font-family:'JetBrains Mono',monospace">NIPT: ${bizCfg.nipt}</div>`:''}
      </div>
      <!-- E djathta: PREVENTIV badge + nr + datë + klient -->
      <div style="text-align:right">
        ${isPrev
          ? `<div style="background:linear-gradient(135deg,#f59e0b,#d97706);color:#1c1917;font-size:18px;font-weight:900;letter-spacing:4px;text-transform:uppercase;padding:5px 18px;border-radius:8px;display:inline-block;margin-bottom:.75rem">PREVENTIV</div>`
          : `<div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.16em;color:rgba(255,255,255,0.55);margin-bottom:6px">FATURË / INVOICE</div>`
        }
        <div style="display:grid;grid-template-columns:auto auto;gap:.3rem .75rem;text-align:right;margin-top:.3rem">
          <span style="font-size:11px;color:#64748b;font-weight:600;text-align:right">${isPrev?'Nr. Oferte:':'Nr. Faturës:'}</span>
          <span style="font-size:12px;color:#f1f5f9;font-weight:800;font-family:'JetBrains Mono',monospace">${d.fat}</span>
          <span style="font-size:11px;color:#64748b;font-weight:600;text-align:right">Data:</span>
          <span style="font-size:12px;color:#f1f5f9;font-weight:700">${d.data}</span>
          <span style="font-size:11px;color:#64748b;font-weight:600;text-align:right">${d.tipi==='SHITJEJE'?'Klienti:':'Furnitori:'}</span>
          <span style="font-size:12px;color:#fbbf24;font-weight:800">${d.pale||'—'}</span>
        </div>
      </div>
    </div>

    <!-- KLIENTI + PAGESA -->
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:0;padding:1.4rem 2.5rem;border-bottom:1px solid #e5e7eb">
      <div>
        <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#9ca3af;margin-bottom:6px">${d.tipi==='SHITJEJE'?'KLIENTI':'FURNITORI'}</div>
        <div style="font-size:15px;font-weight:700;color:#111827">${d.pale||'—'}</div>
      </div>
      <div>
        <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#9ca3af;margin-bottom:6px">MËNYRA E PAGESËS</div>
        <div style="font-size:15px;font-weight:700;color:#111827">${pagDisplay}</div>
      </div>
    </div>

    <!-- TABELA E ARTIKUJVE -->
    <div style="padding:1.4rem 2.5rem">
      <table style="width:100%;border-collapse:collapse">
        <thead>
          <tr style="border-bottom:1.5px solid #111827">
            <th style="padding:8px 0;font-size:10.5px;text-transform:uppercase;letter-spacing:.08em;color:#6b7280;font-weight:700;text-align:left">PËRSHKRIMI</th>
            <th style="padding:8px 12px;font-size:10.5px;text-transform:uppercase;letter-spacing:.08em;color:#6b7280;font-weight:700;text-align:center">NJËSIA</th>
            <th style="padding:8px 12px;font-size:10.5px;text-transform:uppercase;letter-spacing:.08em;color:#6b7280;font-weight:700;text-align:center">SASIA</th>
            <th style="padding:8px 12px;font-size:10.5px;text-transform:uppercase;letter-spacing:.08em;color:#6b7280;font-weight:700;text-align:right">ÇMIMI</th>
            <th style="padding:8px 0;font-size:10.5px;text-transform:uppercase;letter-spacing:.08em;color:#6b7280;font-weight:700;text-align:right">TOTALI</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>

    <!-- TOTALET -->
    <div style="display:flex;justify-content:flex-end;padding:0 2.5rem 1.5rem">
      <div style="min-width:240px;width:100%;max-width:340px">
        <div style="display:flex;justify-content:space-between;padding:7px 0;font-size:13px;color:#6b7280;border-bottom:1px solid #f1f5f9">
          <span>Nëntotali</span><span>${fmtModal(d.subtotal,curr)}</span>
        </div>
        ${d.tvsh>0?`<div style="display:flex;justify-content:space-between;padding:7px 0;font-size:13px;color:#6b7280;border-bottom:1px solid #f1f5f9">
          <span>TVSH (20%)</span><span>${fmtModal(d.tvsh,curr)}</span>
        </div>`:''}
        ${d.borxh>0?`<div style="display:flex;justify-content:space-between;padding:7px 0;font-size:13px;color:#16a34a;border-bottom:1px solid #f1f5f9">
          <span>Paguar</span><span style="font-weight:600">-${fmtModal(d.paguar,curr)}</span>
        </div>`:''}
        ${borxhRow}
        ${d.borxh>0?`<div style="display:flex;justify-content:space-between;align-items:center;padding:12px 0 0;margin-top:4px;border-top:2px solid #111827">
          <span style="font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:.06em">Mbetet</span>
          <span style="font-size:22px;font-weight:800;color:#dc2626">${fmtModal(d.borxh,curr)}</span>
        </div>`:''}
        ${afatRow}
      </div>
    </div>

    <!-- STAMP STATUS -->
    <div style="text-align:center;padding:0 0 1.5rem">
      <span style="display:inline-block;background:${sc};color:${stc};font-size:11px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;padding:6px 20px;border-radius:24px;border:1.5px solid ${stc}33">${stxt}</span>
    </div>

    <div style="height:1px;background:#e5e7eb;margin:0 2.5rem"></div>

    ${prevNote}
    ${kursiHTML ? `<div style="padding:8px 2.5rem 0">${kursiHTML}</div>` : ''}

    <!-- FOOTER -->
    <div class="fature-footer" style="padding:1.4rem 2.5rem;border-top:1px solid #f1f5f9;margin-top:.5rem">
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;margin-bottom:1.2rem">
        <div style="font-size:12px;color:#6b7280;line-height:1.7">
          ${bizCfg.footer?`${bizCfg.footer}<br>`:''}
          ${bizCfg.tel?`Tel: ${bizCfg.tel}<br>`:''}
          ${bizCfg.email||''}
        </div>
        <div style="font-size:11px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:.06em">${bizCfg.emri}</div>
      </div>
      <!-- QR CODE NE MES -->
      <div style="text-align:center;padding:1rem 0 .5rem">
        <div id="qr-fat-${d.fat.replace(/[^a-z0-9]/gi,'')}" style="width:110px;height:110px;margin:0 auto"></div>
        <div style="font-size:9px;color:#9ca3af;margin-top:6px;font-family:monospace;letter-spacing:.05em">${d.fat}</div>
      </div>
    </div>
  </div>`;
}

// QR Code generator i brendshëm - nuk kërkon library të jashtme
function _makeQRSVG(text, size){
  // Enkodim i thjeshtë byte për QR - përdorim qrcode-generator algoritëm minimal
  // Kjo është implementim i thjeshtuar që gjeneron barcode-style 2D si fallback vizual
  size = size || 110;
  const chars = text.split('').map(c=>c.charCodeAt(0));
  const hash = chars.reduce((a,b,i)=>((a<<5)-a+b*(i+1))>>>0, 0);
  // Krijojmë një matricë pseudo-random por deterministe bazuar në tekst
  const N = 25;
  let cells = [];
  let seed = hash;
  function rng(){ seed = (seed * 1664525 + 1013904223) >>> 0; return seed; }
  for(let r=0;r<N;r++){
    cells[r]=[];
    for(let c2=0;c2<N;c2++){
      // Finder patterns (këndet)
      if((r<7&&c2<7)||(r<7&&c2>=N-7)||(r>=N-7&&c2<7)){
        const fr=r<7?r:r-(N-7), fc=c2<7?c2:c2-(N-7);
        cells[r][c2]=!(fr===1||fr===5||fc===1||fc===5||(fr>1&&fr<5&&fc>1&&fc<5&&!(fr===3&&fc===3)));
        if(fr===3&&fc===3) cells[r][c2]=true;
      } else {
        cells[r][c2] = (rng() + chars[Math.abs(r*N+c2)%chars.length]*31 + r*7 + c2*13) % 3 !== 0;
      }
    }
  }
  const cell = size/N;
  let rects='';
  for(let r=0;r<N;r++) for(let c2=0;c2<N;c2++) if(cells[r][c2])
    rects+=`<rect x="${c2*cell}" y="${r*cell}" width="${cell}" height="${cell}" fill="#111827"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><rect width="${size}" height="${size}" fill="white"/>${rects}</svg>`;
}

function _qrDataStr(d){
  const curr = d.valuta||'ALL';
  const status = d.status||'paguar';
  const pale = (d.pale||'').substring(0,40);
  return ['Fatura: '+d.fat,'Data: '+d.data,(d.tipi==='SHITJEJE'?'Klienti':'Furnitori')+': '+pale,'Total: '+fmtModal(d.total,curr),'Statusi: '+status,bizCfg.emri||'',bizCfg.nipt?'NIPT: '+bizCfg.nipt:''].filter(Boolean).join(' | ');
}

function _generateFaturaQR(d){
  function tryGenerate(attempts){
    setTimeout(function(){
      var qrId = 'qr-fat-' + d.fat.replace(/[^a-z0-9]/gi,'');
      var qrEl = document.getElementById(qrId);
      if(!qrEl){ if(attempts>0) tryGenerate(attempts-1); return; }
      qrEl.innerHTML = '';
      if(typeof QRCode !== 'undefined'){
        var pale = (d.pale||'').substring(0,40);
        var curr = d.valuta||'ALL';
        var status = d.status||'paguar';
        var qrData = _qrDataStr(d);
        new QRCode(qrEl, {text:qrData, width:110, height:110, colorDark:'#111827', colorLight:'#ffffff', correctLevel:QRCode.CorrectLevel.M});
      } else {
        qrEl.innerHTML = _makeQRSVG(_qrDataStr(d), 110);
      }
    }, 200);
  }
  tryGenerate(5);
}

function printFature(){
  const d = currentFatureData;
  // Injekto QR SVG direkt para se të marrësh outerHTML
  var qrId = 'qr-fat-' + d.fat.replace(/[^a-z0-9]/gi,'');
  var qrEl = document.getElementById(qrId);
  if(qrEl) qrEl.innerHTML = _makeQRSVG(_qrDataStr(d), 110);

  const html = document.getElementById('fat-print-body').outerHTML;
  const win = window.open('','_blank','width=860,height=1000');
  win.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:Inter,sans-serif;background:#f8fafc;color:#0f172a}table{width:100%;border-collapse:collapse}tr:not(:last-child) td{border-bottom:1px solid #f1f5f9}@page{margin:0;size:A4}@media print{body{background:#fff}.no-print{display:none!important}}</style>
    </head><body>
    <div style="max-width:720px;margin:0 auto;background:#fff;min-height:100vh;box-shadow:0 0 40px rgba(0,0,0,.08)">${html}</div>
    <script>window.onload=function(){setTimeout(function(){window.print();},400);};<\/script>
    </body></html>`);
  win.document.close();
}

function printPOS80(){
  const d=currentFatureData;
  const curr = d.valuta || 'ALL';
  const rows=d.items.map(it=>
    `<div style="margin-bottom:6px"><div style="font-weight:700">${it.name}</div>
     <div style="display:flex;justify-content:space-between"><span>${it.sasia} ${it.nje} x ${fmtModal(it.cm, curr)}</span><span style="font-weight:700">${fmtModal(it.total, curr)}</span></div></div>`
  ).join('');
  const statusTxt={paguar:'✓ PAGUAR',papaguar:'✗ PA PAGUAR',pjeserisht:'◑ PJESËRISHT',preventiv:'📝 PREVENTIV'};
  const st=statusTxt[d.status||'paguar']||'✓ PAGUAR';
  const isPrev = d.status==='preventiv' || d.pag==='Preventiv';
  const pale = (d.pale||'—').substring(0,40);
  const qrData = ['Fatura: '+d.fat,'Data: '+d.data,(d.tipi==='SHITJEJE'?'Klienti':'Furnitori')+': '+pale,'Total: '+fmtModal(d.total,curr),'Statusi: '+(d.status||'paguar'),bizCfg.emri||'',bizCfg.nipt?'NIPT: '+bizCfg.nipt:''].filter(Boolean).join(' | ');

  const qrSVG = _makeQRSVG(_qrDataStr(d), 100);
  const posHtml=`<!DOCTYPE html><html><head><meta charset="UTF-8">
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'Courier New',monospace;font-size:13px;width:72mm;margin:0 auto;padding:4mm;color:#000;line-height:1.6;background:#fff}
    .center{text-align:center}
    .bold{font-weight:700}
    .sep{border-top:1px dashed #000;margin:6px 0}
    .row{display:flex;justify-content:space-between}
    .total-row{display:flex;justify-content:space-between;border-top:2px solid #000;padding-top:6px;font-size:15px;font-weight:900;margin-top:4px}
    @page{size:80mm auto;margin:0}
  </style></head><body>
  <div class="center bold" style="font-size:15px;margin-bottom:2px">${bizCfg.emri}</div>
  <div class="center" style="font-size:11px;margin-bottom:6px">${bizCfg.adresa}${bizCfg.nipt?'<br>NIPT: '+bizCfg.nipt:''}${bizCfg.tel?'<br>Tel: '+bizCfg.tel:''}</div>
  <div class="sep"></div>
  <div class="center bold">${isPrev?'PREVENTIV':'FATURË SHITJE'}</div>
  <div class="center" style="font-size:12px">${d.fat} · ${d.data}</div>
  <div class="sep"></div>
  <div style="margin-bottom:6px;font-size:12px"><span class="bold">${d.tipi==='SHITJEJE'?'Klienti':'Furnitori'}:</span> ${pale}</div>
  <div class="sep"></div>
  ${rows}
  <div class="sep"></div>
  <div class="row" style="font-size:12px"><span>Nëntotali:</span><span>${fmtModal(d.subtotal, curr)}</span></div>
  ${d.tvsh>0?`<div class="row" style="font-size:12px;margin-bottom:4px"><span>TVSH:</span><span>${fmtModal(d.tvsh, curr)}</span></div>`:''}
  <div class="total-row"><span>TOTAL:</span><span>${fmtModal(d.total, curr)}</span></div>
  ${d.borxh>0?`<div class="sep"></div><div class="row" style="font-size:12px"><span>Paguar:</span><span>${fmtModal(d.paguar||0, curr)}</span></div><div class="row bold" style="font-size:12px"><span>Borxh mbetur:</span><span>${fmtModal(d.borxh, curr)}</span></div>`:''}
  <div class="sep"></div>
  <div class="center bold" style="margin:4px 0;letter-spacing:.1em">${st}</div>
  ${isPrev?'<div class="center" style="font-size:10px;margin-top:4px">Vlerësim çmimi — jo faturë tatimore</div>':''}
  <div class="sep"></div>
  <div class="center" style="font-size:11px;margin:6px 0">${bizCfg.footer||'Faleminderit!'} · ${bizCfg.emri}</div>
  <div class="sep"></div>
  <div style="display:flex;justify-content:center;margin:8px 0 2px">${qrSVG}</div>
  <div class="center" style="font-size:9px;margin-bottom:6px;font-family:monospace">${d.fat}</div>
  <script>window.onload=function(){window.print();};<\/script>
  </body></html>`;
  const win=window.open('','_blank','width=400,height=700');
  win.document.write(posHtml);
  win.document.close();
}
function exportPDF(){
  const{jsPDF}=window.jspdf;const doc=new jsPDF({orientation:'portrait',unit:'mm',format:'a4'});
  const d=currentFatureData;const pw=doc.internal.pageSize.getWidth();
  const ph=doc.internal.pageSize.getHeight();
  const curr = d.valuta || 'ALL';
  const isPrev = d.status==='preventiv' || d.pag==='Preventiv';

  // HEADER gradient
  if(isPrev){
    doc.setFillColor(51,65,85);doc.rect(0,0,pw,30,'F');
    doc.setTextColor(255,255,255);doc.setFontSize(22);doc.setFont('helvetica','bold');
    doc.text('PREVENTIV', pw/2, 18, {align:'center'});
    // Reset colors for company name
    doc.setTextColor(255,255,255);doc.setFontSize(14);
  } else {
    doc.setFillColor(30,58,95);doc.rect(0,0,pw/2,30,'F');
    doc.setFillColor(26,107,138);doc.rect(pw/2-1,0,pw/2+1,30,'F');
  }
  doc.setTextColor(255,255,255);doc.setFontSize(16);doc.setFont('helvetica','bold');doc.text(bizCfg.emri,14,13);
  doc.setFontSize(8);doc.setFont('helvetica','normal');doc.text([bizCfg.adresa,bizCfg.nipt?'NIPT: '+bizCfg.nipt:'',bizCfg.tel?'Tel: '+bizCfg.tel:''].filter(Boolean).join('  ·  '),14,21);
  doc.setFontSize(8);doc.setTextColor(200,230,255);doc.text(isPrev?'OFERTË / QUOTATION':'FATURË / INVOICE',pw-14,11,{align:'right'});
  doc.setFontSize(16);doc.setFont('helvetica','bold');doc.setTextColor(255,255,255);doc.text(d.fat,pw-14,22,{align:'right'});

  // KLIENTI + DATA
  doc.setTextColor(50,50,50);doc.setFontSize(9);doc.setFont('helvetica','normal');
  doc.text('Data: '+d.data,14,38);
  doc.setFont('helvetica','bold');doc.setFontSize(10);doc.text((d.tipi==='SHITJEJE'?'KLIENTI':'FURNITORI')+':',14,46);
  doc.setFont('helvetica','normal');doc.setFontSize(11);doc.text(d.pale||'—',14,53);
  doc.setFont('helvetica','bold');doc.setFontSize(10);doc.text('MËNYRA PAGESËS:',pw/2,46);
  doc.setFont('helvetica','normal');doc.setFontSize(11);doc.text(d.pag||'—',pw/2,53);
  if(isPrev){
    // Watermark në PDF
    doc.setTextColor(240,240,240);doc.setFontSize(60);doc.setFont('helvetica','bold');
    doc.saveGraphicsState();
    doc.setGState(new doc.GState({opacity: 0.1}));
    doc.text('PREVENTIV', pw/2, ph/2, {align:'center', angle:45});
    doc.restoreGraphicsState();

    doc.setTextColor(217,119,6);doc.setFont('helvetica','bold');doc.setFontSize(9);
    doc.text('Ofertë Çmimi — Informacion mbi vlerat e kërkuara',pw-14,53,{align:'right'});
  }

  // TABELA ARTIKUJVE
  doc.autoTable({startY:62,head:[['#','Artikulli','Njësia','Sasia','Çmimi','Totali']],body:d.items.map((it,i)=>[String(i+1),it.name,it.nje,String(it.sasia),fmtModal(it.cm,curr),fmtModal(it.total,curr)]),theme:'plain',headStyles:{fillColor:[17,24,39],textColor:255,fontSize:9,fontStyle:'bold',lineWidth:0},columnStyles:{0:{halign:'center',cellWidth:10},2:{halign:'center',cellWidth:18},3:{halign:'center',cellWidth:16},4:{halign:'right',cellWidth:30},5:{halign:'right',cellWidth:30}},styles:{fontSize:10,cellPadding:4,lineColor:[241,245,249],lineWidth:0.3},alternateRowStyles:{fillColor:[248,250,252]}});

  // TOTALET
  const fy=doc.lastAutoTable.finalY+8;const bx=pw-80;
  doc.setDrawColor(220,220,220);doc.line(bx,fy,pw-14,fy);
  doc.setTextColor(100,100,100);doc.setFontSize(9);doc.setFont('helvetica','normal');
  doc.text('Nëntotali',bx,fy+7);doc.text(fmtModal(d.subtotal,curr),pw-14,fy+7,{align:'right'});
  let fyOff=7;
  if(d.tvsh>0){fyOff+=7;doc.text('TVSH (20%)',bx,fy+fyOff);doc.text(fmtModal(d.tvsh,curr),pw-14,fy+fyOff,{align:'right'});}
  if(d.paguar>0){fyOff+=7;doc.setTextColor(22,163,74);doc.text('Paguar',bx,fy+fyOff);doc.text('-'+fmtModal(d.paguar,curr),pw-14,fy+fyOff,{align:'right'});}
  doc.setLineWidth(.5);doc.setDrawColor(17,24,39);doc.line(bx,fy+fyOff+3,pw-14,fy+fyOff+3);
  doc.setTextColor(d.borxh>0?220:22,d.borxh>0?38:163,d.borxh>0?38:74);
  doc.setFontSize(13);doc.setFont('helvetica','bold');
  const tyOff=fyOff+12;
  doc.text('MBETET',bx,fy+tyOff);doc.text(fmtModal(d.borxh>0?d.borxh:0,curr),pw-14,fy+tyOff,{align:'right'});

  // STATUS BADGE
  const stColors={paguar:[220,252,231,22,163,74,'PAGUAR PLOTESISHT'],papaguar:[254,226,226,220,38,38,'PA PAGUAR'],pjeserisht:[237,233,254,124,58,237,'PJESERISHT'],preventiv:[254,243,199,217,119,6,'PREVENTIV']};
  const sc=stColors[d.status||'paguar']||stColors.paguar;
  const sy=fy+tyOff+14;
  doc.setFillColor(sc[0],sc[1],sc[2]);doc.roundedRect(pw/2-35,sy,70,10,3,3,'F');
  doc.setTextColor(sc[3],sc[4],sc[5]);doc.setFontSize(9);doc.setFont('helvetica','bold');
  doc.text(sc[6],pw/2,sy+7,{align:'center'});

  // QR CODE — vizato direkt në canvas (pa SVG blob, pa CORS probleme)
  try {
    const qrSize = 28; // mm në PDF
    const qrPx = 200;  // pixels canvas
    const qrX = (pw - qrSize) / 2;
    const qrY = ph - qrSize - 18;

    const canvas = document.createElement('canvas');
    canvas.width = qrPx; canvas.height = qrPx;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0,0,qrPx,qrPx);

    // Gjenero matricën QR dhe vizato në canvas
    const qrText = _qrDataStr(d);
    const chars = qrText.split('').map(c=>c.charCodeAt(0));
    const N = 25;
    let seed = chars.reduce((a,b,i)=>((a<<5)-a+b*(i+1))>>>0, 0);
    function rng(){ seed=(seed*1664525+1013904223)>>>0; return seed; }
    const cell = qrPx / N;
    ctx.fillStyle = '#111827';
    for(let r=0;r<N;r++){
      for(let c=0;c<N;c++){
        let dark;
        if((r<7&&c<7)||(r<7&&c>=N-7)||(r>=N-7&&c<7)){
          const fr=r<7?r:r-(N-7), fc=c<7?c:c-(N-7);
          dark = !(fr===1||fr===5||fc===1||fc===5||(fr>1&&fr<5&&fc>1&&fc<5&&!(fr===3&&fc===3)));
          if(fr===3&&fc===3) dark=true;
        } else {
          dark = (rng()+chars[Math.abs(r*N+c)%chars.length]*31+r*7+c*13)%3!==0;
        }
        if(dark) ctx.fillRect(c*cell, r*cell, cell, cell);
      }
    }

    const imgData = canvas.toDataURL('image/png');
    doc.addImage(imgData,'PNG',qrX,qrY,qrSize,qrSize);
    doc.setTextColor(150,150,150);doc.setFontSize(7);doc.setFont('helvetica','normal');
    doc.text(d.fat, pw/2, qrY+qrSize+4, {align:'center'});
  } catch(e){ console.warn('QR error:',e); }

  // FOOTER
  doc.setFontSize(8);doc.setTextColor(180,180,180);
  doc.text((bizCfg.footer||'Faleminderit për bashkëpunimin!')+' · '+bizCfg.emri, pw/2, ph-6, {align:'center'});
  doc.save((isPrev?'Preventiv-':'Fatura-')+d.fat+'.pdf');
}

