/* ============ BarTally UI kit — router, components, icons, item art, scanner, exports ============ */
const UI = (() => {
  const screens = {};
  let current = null, currentParams = {};
  let gradSeq = 0;

  /* ---------- utils ---------- */
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const el = html => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };
  const fmtQty = n => {
    if (n == null || isNaN(n)) return '—';
    const v = Math.round(n * 100) / 100;
    return (I18N.lang === 'fr' ? String(v).replace('.', ',') : String(v));
  };
  const locale = () => I18N.lang === 'fr' ? 'fr-FR' : 'en-GB';
  const fmtDate = (bd, opts) => {
    const d = new Date(bd + 'T12:00:00');
    return new Intl.DateTimeFormat(locale(), opts || { weekday: 'short', day: 'numeric', month: 'short' }).format(d);
  };
  const fmtTime = iso => new Intl.DateTimeFormat(locale(), { hour: '2-digit', minute: '2-digit' }).format(new Date(iso));
  const money = n => `${fmtQty(Math.round(n * 100) / 100)} ${Store.state.settings.currency}`;
  const haptic = kind => {
    if (!navigator.vibrate) return;
    navigator.vibrate(kind === 'success' ? [18, 60, 24] : kind === 'warn' ? [40, 60, 40] : 12);
  };

  /* ---------- icons (24x24, stroke) ---------- */
  const P = {
    home: 'M3 10.5 12 3l9 7.5M5 9.5V21h14V9.5M9 21v-6h6v6',
    sell: 'M8 21h8M12 15v6M7 3h10l-1 7a4 4 0 0 1-8 0L7 3ZM7 3H4c0 3 1.5 5 3.5 5M17 3h3c0 3-1.5 5-3.5 5',
    stock: 'M4 7.5 12 3l8 4.5v9L12 21l-8-4.5v-9ZM4 7.5 12 12m0 0 8-4.5M12 12v9',
    count: 'M9 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Zm0 4h6M10 11h.01M14 11h.01M10 14h.01M14 14h.01M10 17h4',
    more: 'M5 12h.01M12 12h.01M19 12h.01',
    search: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14Zm9 16-4-4',
    scan: 'M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3M7 12h.5M11 12h2M16.5 12h.5',
    camera: 'M4 8h3l2-3h6l2 3h3v11H4V8Zm8 9a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z',
    bell: 'M6 9a6 6 0 1 1 12 0c0 5 2 6 2 6H4s2-1 2-6Zm4 9a2 2 0 0 0 4 0',
    gear: 'M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6Zm8 3-.9-.5.1-1.9-1.7-1-1.6 1-1.7-1V6l-1.7-1-1.6 1h-1.8L7.5 5 5.8 6v1.9L4.1 9l-1.6-1L2 9.9l1.5 1.3v1.9L2 14.4l.5 1.9 1.6-.9 1.7 1.1V18l1.7 1 1.6-1h1.8l1.6 1 1.7-1v-1.9l1.7-1.1 1.6.9.5-1.9-1.5-1.3v-1.9L20 12Z',
    chart: 'M4 20V10M10 20V4M16 20v-8M21 20H3',
    calendar: 'M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Zm-1 5h16M8 3v4M16 3v4',
    clock: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm0 4v5l3.5 2',
    download: 'M12 3v11m0 0 4-4m-4 4-4-4M4 17v3h16v-3',
    upload: 'M12 14V3m0 0 4 4m-4-4L8 7M4 17v3h16v-3',
    lock: 'M7 11V8a5 5 0 0 1 10 0v3M6 11h12v9H6v-9Zm6 3v3',
    user: 'M12 3a4.5 4.5 0 1 1 0 9 4.5 4.5 0 0 1 0-9ZM4 21c0-4 3.5-6.5 8-6.5s8 2.5 8 6.5',
    users: 'M9 4a4 4 0 1 1 0 8 4 4 0 0 1 0-8Zm-6 17c0-4 2.5-6 6-6s6 2 6 6M16 4.5a4 4 0 0 1 0 7.5M17 15.5c2.5.6 4 2.4 4 5.5',
    logout: 'M14 4H6a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h8M10 12h11m0 0-3.5-3.5M21 12l-3.5 3.5',
    chevL: 'm14 5-7 7 7 7', chevR: 'm10 5 7 7-7 7',
    plus: 'M12 5v14M5 12h14', minus: 'M6 12h12', x: 'M6 6l12 12M18 6 6 18', check: 'm4 12.5 5.5 5.5L20 6.5',
    edit: 'M4 20l4-1L20 7l-3-3L5 16l-1 4ZM14 6l3 3',
    trash: 'M4 7h16M9 7V4h6v3m-9 0 1 13h10l1-13M10 11v6M14 11v6',
    alert: 'M12 3 2 20h20L12 3Zm0 7v4m0 3.5h.01',
    truck: 'M2 6h12v11H2V6Zm12 4h4l3 3v4h-3m-14 0h2m8 0h3M6.5 20a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm11 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z',
    spill: 'M8 3h8m-6 0v4L5 20a1.5 1.5 0 0 0 1.4 2h11.2a1.5 1.5 0 0 0 1.4-2L14 7V3M8 14h8',
    wine: 'M8 3h8c0 5-1 8-4 9v6m0 0h4m-4 0H8m1-12h6',
    beer: 'M7 4h8v3c2 0 3 1 3 3v5c0 2-1 3-3 3v3H7V4Zm8 5v6M10 8v9',
    sparkles: 'M12 4l1.5 4.5L18 10l-4.5 1.5L12 16l-1.5-4.5L6 10l4.5-1.5L12 4ZM19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15ZM5 4l.6 1.9L7.5 6.5 5.6 7.1 5 9l-.6-1.9L2.5 6.5l1.9-.6L5 4Z',
    utensils: 'M7 3v7a2 2 0 0 0 4 0V3M9 3v18M16 3c-1.5 1-2 3-2 5s.5 4 2 4v9m0-9c1.5 0 2-2 2-4s-.5-4-2-4Z',
    glass: 'M8 3h8l-1 9a3 3 0 0 1-6 0L8 3Zm4 12v6m-3 0h6',
    eye: 'M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Zm10 2.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z',
    note: 'M5 4h14a1 1 0 0 1 1 1v10l-5 5H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Zm10 16v-5h5M8 9h8M8 13h4',
    pin: 'M12 3l2.5 5 5.5.8-4 3.9.9 5.5-4.9-2.6-4.9 2.6.9-5.5-4-3.9L9.5 8 12 3Z',
    globe: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm-9 9h18M12 3c2.5 2.4 4 5.5 4 9s-1.5 6.6-4 9c-2.5-2.4-4-5.5-4-9s1.5-6.6 4-9Z',
    book: 'M5 4h11a2 2 0 0 1 2 2v14H7a2 2 0 0 1-2-2V4Zm0 13.5A2.5 2.5 0 0 1 7.5 15H18M9 8h5',
  };
  const icon = (name, cls) => `<svg class="${cls || ''}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${P[name] || P.more}"/></svg>`;

  /* ---------- item visuals: photo (owner/generated) inside the standard tile
     treatment, monogram tile as the automatic fallback. No drawn art, ever. ---------- */
  const HEX_OK = /^#[0-9a-fA-F]{6}$/;
  /** 2–4 significant chars; dot style for two-word names; accents kept */
  function deriveMono(name) {
    const clean = String(name).replace(/^1\/2\s+/, '').trim();
    const words = clean.split(/\s+/).filter(w => /[A-Za-zÀ-ÿ]/.test(w));
    if (words.length >= 2) return (words[0][0] + '.' + words[1][0]).toUpperCase();
    return clean.replace(/[^A-Za-zÀ-ÿ]/g, '').slice(0, 3).toUpperCase();
  }
  /**
   * Item visual, reference anatomy. Fills its container (.icard__art / .row__art / .tile).
   * Photo (owner camera or generated catalog) → cover image + bottom scrim + category tick.
   * Otherwise → monogram in the category accent + tick. opts.qty renders the tabular corner qty.
   */
  function art(item, cls, opts = {}) {
    const cat = Store.cat(item.catId);
    const color = (cat && HEX_OK.test(cat.hex)) ? cat.hex : 'var(--brass)';
    const mono = item.mono || deriveMono(item.name);
    const half = item.isDemi ? `<span class="mono--half">½</span>` : '';
    const tick = `<span class="tick" style="background:${color}"></span>`;
    const qty = opts.qty != null ? `<span class="tqty">${esc(opts.qty)}</span>` : '';
    const photo = (item.photo && String(item.photo).startsWith('data:image/')) ? item.photo
      : (typeof ITEM_PHOTOS !== 'undefined' && ITEM_PHOTOS[item.name]) ? ITEM_PHOTOS[item.name] : null;
    if (photo) {
      return `<div class="itemart ${cls || ''}"><img src="${esc(photo)}" alt="${esc(item.name)}" loading="lazy"><span class="scrim"></span>${tick}${half}${qty}</div>`;
    }
    return `<div class="itemart ${cls || ''}" role="img" aria-label="${esc(item.name)}">${tick}${half}<span class="mono" style="color:${color}">${esc(mono)}</span>${qty}</div>`;
  }

  /* ---------- logo mark: reference construction — 4 upright strokes + brass diagonal ---------- */
  function logoMark(size) {
    const id = 'lg' + (gradSeq++);
    const w = size || 26, h = Math.round(w * 22 / 30);
    return `<svg class="logo__mark" viewBox="0 0 30 22" width="${w}" height="${h}" fill="none" stroke-linecap="round" role="img" aria-label="BarTally">
      <defs><linearGradient id="${id}" x1="0" y1="1" x2="1" y2="0">
        <stop offset="0" stop-color="#D89A2B"/><stop offset="1" stop-color="#F0C468"/>
      </linearGradient></defs>
      <line x1="4" y1="3" x2="4" y2="19" stroke="#F4F2ED" stroke-width="2.4"/>
      <line x1="10" y1="3" x2="10" y2="19" stroke="#F4F2ED" stroke-width="2.4"/>
      <line x1="16" y1="3" x2="16" y2="19" stroke="#F4F2ED" stroke-width="2.4"/>
      <line x1="22" y1="3" x2="22" y2="19" stroke="#F4F2ED" stroke-width="2.4"/>
      <line x1="1" y1="17" x2="26" y2="4" stroke="url(#${id})" stroke-width="2.6"/>
    </svg>`;
  }

  /* ---------- toast ---------- */
  let toastWrap = null;
  function toast(msg, opts = {}) {
    if (!toastWrap) { toastWrap = el('<div class="toasts"></div>'); document.body.appendChild(toastWrap); }
    const tEl = el(`<div class="toast ${opts.type ? 'toast--' + opts.type : ''}">
      <div class="toast__msg">${esc(msg)}</div>
      ${opts.action ? `<button class="toast__act">${esc(opts.action.label)}</button>` : ''}
    </div>`);
    if (opts.action) tEl.querySelector('.toast__act').addEventListener('click', () => { opts.action.fn(); kill(); });
    toastWrap.appendChild(tEl);
    let killed = false;
    const kill = () => { if (killed) return; killed = true; tEl.classList.add('is-out'); setTimeout(() => tEl.remove(), 220); };
    setTimeout(kill, opts.ms || (opts.action ? 6000 : 2600));
    return kill;
  }

  /* ---------- sheet / confirm ---------- */
  const sheetStack = [];
  let suppressPop = 0; // programmatic history.back() must not close the next sheet
  function sheet(contentEl, opts = {}) {
    const wrap = el(`<div class="sheet-wrap"><div class="sheet-wrap__bg"></div><div class="sheet" role="dialog" aria-modal="true"><div class="sheet__grip"></div></div></div>`);
    const body = wrap.querySelector('.sheet');
    if (typeof contentEl === 'string') body.insertAdjacentHTML('beforeend', contentEl);
    else body.appendChild(contentEl);
    document.body.appendChild(wrap);
    history.pushState({ sheet: true }, '');
    let closed = false;
    const close = (viaPop) => {
      if (closed) return; closed = true;
      sheetStack.splice(sheetStack.indexOf(close), 1);
      body.classList.add('is-closing'); wrap.querySelector('.sheet-wrap__bg').classList.add('is-closing');
      setTimeout(() => wrap.remove(), 210);
      if (!viaPop && history.state?.sheet) { suppressPop++; history.back(); }
      opts.onClose && opts.onClose();
    };
    wrap.querySelector('.sheet-wrap__bg').addEventListener('click', () => close());
    sheetStack.push(close);
    return { close, body };
  }
  function confirmBox(msg, opts = {}) {
    return new Promise(res => {
      const c = el(`<div>
        <h2 style="font-size:18px;margin-bottom:8px">${esc(opts.title || t('g.confirm'))}</h2>
        <p style="color:var(--text-2);font-size:14px;margin-bottom:20px">${esc(msg)}</p>
        <div style="display:flex;gap:10px">
          <button class="btn btn--ghost" style="flex:1" data-a="no">${esc(t('g.cancel'))}</button>
          <button class="btn ${opts.danger ? 'btn--danger' : 'btn--gold'}" style="flex:1" data-a="yes">${esc(opts.yes || t('g.confirm'))}</button>
        </div></div>`);
      const s = sheet(c, { onClose: () => res(false) });
      c.querySelector('[data-a=no]').addEventListener('click', () => { s.close(); });
      c.querySelector('[data-a=yes]').addEventListener('click', () => { res(true); s.close(); });
    });
  }

  /* ---------- numpad ---------- */
  function numpad(container, { decimal = false, onKey }) {
    const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', decimal ? (I18N.lang === 'fr' ? ',' : '.') : '', '0', '⌫'];
    const np = el(`<div class="numpad">${keys.map(k => k === '' ? '<span></span>' : `<button type="button" data-k="${k === ',' || k === '.' ? 'dot' : k === '⌫' ? 'del' : k}">${k}</button>`).join('')}</div>`);
    np.addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return;
      haptic('light'); onKey(b.dataset.k);
    });
    container.appendChild(np);
    return np;
  }

  /* ---------- progress ring ---------- */
  function ring(pct, label) {
    const r = 26, c = 2 * Math.PI * r, off = c * (1 - Math.min(1, Math.max(0, pct)));
    return `<div class="ring"><svg viewBox="0 0 64 64" width="64" height="64">
      <defs><linearGradient id="goldGrad" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#DFB86A"/><stop offset="1" stop-color="#A87B2F"/></linearGradient></defs>
      <circle class="ring__bg" cx="32" cy="32" r="${r}"/>
      <circle class="ring__fg" cx="32" cy="32" r="${r}" stroke-dasharray="${c.toFixed(1)}" stroke-dashoffset="${off.toFixed(1)}"/>
    </svg><div class="ring__t">${label ?? Math.round(pct * 100) + '%'}</div></div>`;
  }

  /* ---------- barcode scanning ---------- */
  const canScan = 'BarcodeDetector' in window && !!navigator.mediaDevices?.getUserMedia;
  async function scan({ onCode }) {
    const c = el(`<div><h2 style="font-size:18px;margin-bottom:12px">${esc(t('sell.scan'))}</h2>
      <div style="position:relative;border-radius:16px;overflow:hidden;background:#000;aspect-ratio:3/4">
        <video autoplay playsinline muted style="width:100%;height:100%;object-fit:cover"></video>
        <div style="position:absolute;inset:0;border:2px solid rgba(201,154,75,.6);border-radius:16px;margin:14%;pointer-events:none"></div>
      </div>
      <div class="field mt4"><label>${esc(t('inv.barcode'))}</label><input type="text" inputmode="numeric" placeholder="0000000000000"></div>
      <button class="btn btn--gold btn--full" data-a="manual">${esc(t('g.confirm'))}</button></div>`);
    const s = sheet(c, { onClose: stop });
    const video = c.querySelector('video');
    let stream = null, timer = null;
    function stop() { clearInterval(timer); stream?.getTracks().forEach(tk => tk.stop()); }
    c.querySelector('[data-a=manual]').addEventListener('click', () => {
      const v = c.querySelector('input').value.trim();
      if (v) { onCode(v); s.close(); }
    });
    if (canScan) {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        video.srcObject = stream;
        const det = new BarcodeDetector({ formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'qr_code'] });
        timer = setInterval(async () => {
          try {
            const codes = await det.detect(video);
            if (codes.length) { haptic('success'); onCode(codes[0].rawValue); stop(); s.close(); }
          } catch (e) {}
        }, 300);
      } catch (e) { video.parentElement.style.display = 'none'; }
    } else { video.parentElement.style.display = 'none'; }
    return s;
  }

  /* ---------- image pick + compress ---------- */
  function pickImage({ capture } = {}) {
    return new Promise(res => {
      const inp = document.createElement('input');
      inp.type = 'file'; inp.accept = 'image/*';
      if (capture) inp.capture = 'environment';
      inp.addEventListener('change', () => {
        const f = inp.files[0]; if (!f) return res(null);
        const img = new Image();
        img.onload = () => {
          const max = 512, k = Math.min(1, max / Math.max(img.width, img.height));
          const cv = document.createElement('canvas');
          cv.width = Math.round(img.width * k); cv.height = Math.round(img.height * k);
          cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
          res(cv.toDataURL('image/jpeg', .72));
        };
        img.src = URL.createObjectURL(f);
      });
      inp.click();
    });
  }

  /* ---------- exports ---------- */
  function download(filename, content, mime) {
    const blob = content instanceof Blob ? content : new Blob([content], { type: mime || 'text/plain;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = filename;
    document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 400);
  }
  function csv(rows, filename) {
    const sep = ';';
    const body = rows.map(r => r.map(v => {
      let s = String(v ?? '');
      // Excel formula-injection guard: neutralize leading =,+,@ (and non-numeric -)
      if (/^[=+@]/.test(s) || (/^-/.test(s) && !/^-?\d+([.,]\d+)?$/.test(s))) s = "'" + s;
      if (/[";\n]/.test(s)) s = '"' + s.replaceAll('"', '""') + '"';
      return s;
    }).join(sep)).join('\r\n');
    download(filename, '﻿sep=;\r\n' + body, 'text/csv;charset=utf-8');
  }
  function printHTML(title, bodyHtml) {
    const f = document.createElement('iframe');
    f.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0';
    document.body.appendChild(f);
    f.srcdoc = `<!doctype html><html><head><meta charset="utf-8"><title>${esc(title)}</title>
      <style>
        body{font-family:Inter,Segoe UI,system-ui,sans-serif;color:#15161A;margin:36px;font-size:12.5px}
        h1{font-size:19px;margin:0 0 2px;letter-spacing:-.01em} .sub{color:#8A8F98;font-size:11px;margin-bottom:18px}
        table{width:100%;border-collapse:collapse;margin:10px 0 22px}
        th{font-size:10px;text-transform:uppercase;letter-spacing:.07em;color:#8A8F98;text-align:left;padding:7px 8px;border-bottom:1px solid #D9DBDF}
        td{padding:7px 8px;border-bottom:1px solid #ECEDEF;font-variant-numeric:tabular-nums}
        .neg{color:#C2483E;font-weight:600}.pos{color:#1E8E5A;font-weight:600}
        .brand{display:flex;align-items:center;gap:10px;margin-bottom:22px;padding-bottom:14px;border-bottom:1px solid #D9DBDF}
        .brand b{font-size:15px} h2{font-size:11px;text-transform:uppercase;letter-spacing:.07em;color:#8A8F98;margin:20px 0 4px}
        .kpis{display:flex;gap:32px;margin:14px 0}.kpis div b{display:block;font-size:19px;font-variant-numeric:tabular-nums}
        .kpis div span{font-size:10px;color:#8A8F98;text-transform:uppercase;letter-spacing:.07em}
      </style></head><body>
      <div class="brand"><svg width="30" height="22" viewBox="0 0 30 22" fill="none" stroke-linecap="round"><line x1="4" y1="3" x2="4" y2="19" stroke="#15161A" stroke-width="2.4"/><line x1="10" y1="3" x2="10" y2="19" stroke="#15161A" stroke-width="2.4"/><line x1="16" y1="3" x2="16" y2="19" stroke="#15161A" stroke-width="2.4"/><line x1="22" y1="3" x2="22" y2="19" stroke="#15161A" stroke-width="2.4"/><line x1="1" y1="17" x2="26" y2="4" stroke="#D89A2B" stroke-width="2.6"/></svg>
      <div><b>${esc(Store.state.settings.barName || 'BarTally')}</b><div style="color:#8A8F98;font-size:11px">${esc(title)}</div></div></div>
      ${bodyHtml}</body></html>`;
    f.addEventListener('load', () => setTimeout(() => { f.contentWindow.print(); setTimeout(() => f.remove(), 2000); }, 150));
  }

  /* ---------- router / shell ---------- */
  function registerScreen(def) { screens[def.id] = def; }
  function go(id, params = {}) {
    if (!screens[id]) return console.error('no screen', id);
    current = id; currentParams = params;
    render();
    window.scrollTo({ top: 0 });
  }
  function refresh() { if (current) render(); }
  function render() {
    const root = document.getElementById('app');
    const def = screens[current];
    root.innerHTML = '';
    const wrap = el(`<div class="screen ${def.bare ? 'screen--bare' : ''}" data-screen="${def.id}"></div>`);
    root.appendChild(wrap);
    def.render(wrap, currentParams);
    if (!def.bare) renderTabs(root);
  }
  /* reference: text-only bar, 4 root destinations; pushed screens carry a back link instead */
  const TAB_ROOTS = ['dashboard', 'inventory', 'reports', 'settings'];
  function renderTabs(root) {
    if (!Store.isOwner) return;              // staff: single screen, no tab chrome
    if (!TAB_ROOTS.includes(current)) return; // pushed screens: no bar (per reference frame 02)
    const tabs = [['dashboard', 'tab.home'], ['inventory', 'tab.stock'], ['reports', 'tab.reports'], ['settings', 'set.title']];
    const bar = el(`<nav class="tabbar" aria-label="Navigation">${tabs.map(([id, key]) =>
      `<button class="tabbar__btn ${current === id ? 'is-on' : ''}" data-go="${id}"><span>${esc(t(key))}</span></button>`).join('')}</nav>`);
    bar.addEventListener('click', e => {
      const b = e.target.closest('[data-go]'); if (!b) return;
      haptic('light'); go(b.dataset.go);
    });
    root.appendChild(bar);
  }
  window.addEventListener('popstate', () => {
    if (suppressPop > 0) { suppressPop--; return; }
    if (sheetStack.length) { sheetStack[sheetStack.length - 1](true); }
  });

  /* header helper */
  function header(title, sub, actionsHtml) {
    return `<header class="apphead">
      <div class="apphead__titles"><h1 class="apphead__title">${esc(title)}</h1>${sub ? `<div class="apphead__sub">${esc(sub)}</div>` : ''}</div>
      ${actionsHtml || ''}</header>`;
  }

  return {
    esc, el, t, icon, art, logoMark, toast, sheet, confirm: confirmBox, numpad, ring,
    canScan, scan, pickImage, download, csv, printHTML,
    fmtQty, fmtDate, fmtTime, money, haptic,
    registerScreen, go, refresh, header,
    get current() { return current; }, get params() { return currentParams; },
  };
})();

/**
 * Show a phone notification. Uses the service worker when there is one — that is the
 * path Android actually honours for an installed PWA; falls back to the page API.
 */
window.__notify = (title, body, tag) => {
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted' || !body) return false;
  const opts = { body, tag, icon: 'icons/icon-192.png', badge: 'icons/icon-192.png', renotify: false };
  try {
    if (navigator.serviceWorker && navigator.serviceWorker.getRegistration) {
      navigator.serviceWorker.getRegistration()
        .then(reg => { if (reg && reg.showNotification) reg.showNotification(title, opts); else new Notification(title, opts); })
        .catch(() => { try { new Notification(title, opts); } catch (e) {} });
      return true;
    }
    new Notification(title, opts);
    return true;
  } catch (e) { return false; }
};

/* notification body text for system notifications */
window.__notifText = (type, p) => {
  if (type === 'low') { const it = Store.item(p.itemId); return t('ntf.low', { item: it?.name || '?', qty: UI.fmtQty(p.qty), unit: t('u.' + (p.unit || 'bouteille')) }); }
  if (type === 'variance') return t('ntf.variance', { n: p.n, top: p.top });
  if (type === 'reminder') return t('ntf.countReminder', { date: p.date });
  return '';
};
