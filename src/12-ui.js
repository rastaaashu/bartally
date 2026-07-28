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

  /* ---------- item art: parametric bottles/plates, unified treatment ---------- */
  function shade(hex, f) { // f -1..1
    const n = parseInt(hex.slice(1), 16);
    let r = n >> 16, g = (n >> 8) & 255, b = n & 255;
    if (f >= 0) { r += (255 - r) * f; g += (255 - g) * f; b += (255 - b) * f; }
    else { r *= 1 + f; g *= 1 + f; b *= 1 + f; }
    return '#' + [r, g, b].map(v => Math.round(v).toString(16).padStart(2, '0')).join('');
  }
  const ART = {
    // [neckW, neckH, shoulderH, bodyW, bodyH, capH, capColor|null(=gold), labelY, labelH, squareness]
    beer:      [10, 22, 10, 26, 52, 6, '#C9A227', 58, 22, .35],
    can:       [0, 0, 0, 30, 62, 0, null, 40, 26, .9],
    wine:      [9, 30, 12, 26, 46, 9, null, 60, 24, .3],
    'wine-w':  [9, 30, 12, 26, 46, 9, null, 60, 24, .3],
    'wine-r':  [9, 30, 12, 26, 46, 9, null, 60, 24, .3],
    half:      [8, 20, 9, 22, 34, 7, null, 52, 18, .3],
    'half-w':  [8, 20, 9, 22, 34, 7, null, 52, 18, .3],
    'half-r':  [8, 20, 9, 22, 34, 7, null, 52, 18, .3],
    champagne: [10, 24, 16, 30, 44, 12, '#C9A227', 60, 22, .45],
    'whisky-sq': [11, 16, 8, 32, 54, 8, '#1A1A1A', 48, 26, .8],
    vodka:     [10, 20, 6, 24, 60, 8, '#D8DEE4', 46, 30, .5],
    gin:       [11, 16, 12, 30, 50, 8, '#1E5438', 50, 26, .6],
    pastis:    [10, 14, 10, 30, 54, 8, '#6A4A14', 48, 26, .55],
    tequila:   [10, 18, 8, 26, 52, 8, '#7A6A24', 50, 24, .5],
    herbal:    [12, 12, 8, 32, 56, 9, '#0E2A0C', 46, 28, .75],
    cognac:    [10, 20, 14, 32, 44, 8, '#2A160A', 56, 22, .5],
    vermouth:  [10, 22, 8, 26, 56, 8, '#8A8A4A', 48, 28, .5],
  };
  const HEX_OK = /^#[0-9a-fA-F]{6}$/;
  function art(item, cls) {
    const id = 'g' + (gradSeq++);
    const cat = Store.cat(item.catId);
    const vig = cat && HEX_OK.test(cat.hex) ? cat.hex : '#F5A623';
    let { g, l } = item.tint || {};
    if (!HEX_OK.test(g || '')) g = '#3B1420';
    if (!HEX_OK.test(l || '')) l = '#E2D5BD';
    let inner = '';
    const spec = ART[item.art];
    // photos only ever come from the in-app camera/gallery pipeline; anything else
    // (e.g. a tampered backup file) is refused so it can't smuggle markup
    if (item.photo && String(item.photo).startsWith('data:image/')) {
      return `<div class="itemart ${cls || ''}"><img src="${esc(item.photo)}" alt="${esc(item.name)}" loading="lazy"></div>`;
    }
    // real product photography bundled at build time (curated, licensed sources)
    const stockPhoto = (typeof ITEM_PHOTOS !== 'undefined') ? ITEM_PHOTOS[item.name] : null;
    if (stockPhoto) {
      return `<div class="itemart ${cls || ''}"><img src="${stockPhoto}" alt="${esc(item.name)}" loading="lazy"></div>`;
    }
    if (spec) {
      const [nw, nh, sh, bw, bh, capH, capC, labelY, labelH, sq] = spec;
      const cx = 50, top = 118 - bh - sh - nh - capH;
      const bodyX = cx - bw / 2, bodyY = 118 - bh;
      const r = 4 + sq * 4;
      if (item.art === 'can') {
        inner = `
          <rect x="${cx - 15}" y="52" width="30" height="62" rx="7" fill="url(#${id}b)"/>
          <rect x="${cx - 15}" y="52" width="30" height="6" rx="3" fill="${shade(g, .35)}"/>
          <rect x="${cx - 13.4}" y="${52 + 40}" width="26.8" height="18" fill="${l}" opacity=".92"/>
          <rect x="${cx - 6}" y="56" width="3.4" height="54" rx="1.7" fill="#fff" opacity=".16"/>`;
      } else {
        const neck = nh ? `<rect x="${cx - nw / 2}" y="${top + capH}" width="${nw}" height="${nh + 2}" fill="url(#${id}b)"/>` : '';
        const capCol = capC || '#C9A227';
        const cap = capH ? `<rect x="${cx - nw / 2 - 1.4}" y="${top}" width="${nw + 2.8}" height="${capH}" rx="2" fill="${capCol}"/><rect x="${cx - nw / 2 - 1.4}" y="${top}" width="${nw + 2.8}" height="${capH * .45}" rx="2" fill="#fff" opacity=".18"/>` : '';
        const shoulder = `<path d="M${cx - nw / 2} ${top + capH + nh} C ${cx - nw / 2} ${top + capH + nh + sh * .8}, ${bodyX} ${bodyY - sh * .6}, ${bodyX} ${bodyY} L ${bodyX} ${bodyY} ${cx + nw / 2} ${top + capH + nh} C ${cx + nw / 2} ${top + capH + nh + sh * .8}, ${bodyX + bw} ${bodyY - sh * .6}, ${bodyX + bw} ${bodyY} Z" fill="url(#${id}b)"/>
          <path d="M${bodyX} ${bodyY - 1} h${bw}" stroke="url(#${id}b)" stroke-width="2"/>`;
        const body = `<rect x="${bodyX}" y="${bodyY - 2}" width="${bw}" height="${bh + 2}" rx="${r}" fill="url(#${id}b)"/>`;
        const label = `<rect x="${bodyX + 2.4}" y="${labelY}" width="${bw - 4.8}" height="${labelH}" rx="2.5" fill="${l}" opacity=".95"/>
          <rect x="${bodyX + 2.4}" y="${labelY + labelH * .42}" width="${bw - 4.8}" height="1.6" fill="${shade(l, -.35)}" opacity=".7"/>`;
        const gloss = `<rect x="${bodyX + 3.2}" y="${bodyY + 3}" width="3.6" height="${bh - 8}" rx="1.8" fill="#fff" opacity=".14"/>`;
        inner = neck + shoulder + body + cap + label + gloss;
      }
    } else {
      // kitchen: plate + glyph
      const glyphs = {
        cheese: `<path d="M32 76 68 62 74 84 H30 Z" fill="${l}"/><circle cx="48" cy="74" r="2.6" fill="${shade(l, -.3)}"/><circle cx="60" cy="76" r="2.2" fill="${shade(l, -.3)}"/><circle cx="54" cy="68" r="1.8" fill="${shade(l, -.3)}"/>`,
        meat: `<ellipse cx="52" cy="74" rx="20" ry="12" fill="${g}"/><ellipse cx="52" cy="71" rx="18" ry="9" fill="${shade(g, .18)}"/>`,
        liver: `<path d="M34 76 q4 -14 20 -12 q16 2 14 12 q-2 10 -18 9 q-14 -1 -16 -9Z" fill="${g}"/><path d="M40 72 q8 -5 20 -2" stroke="${shade(g, .3)}" stroke-width="2" fill="none"/>`,
        brain: `<ellipse cx="52" cy="73" rx="17" ry="11" fill="${l}"/><path d="M40 70 q4 -5 8 0 q4 5 8 0 q4 -5 8 0" stroke="${shade(g, -.1)}" stroke-width="2" fill="none"/>`,
        pizza: `<circle cx="52" cy="73" r="16" fill="${l}"/><circle cx="52" cy="73" r="13" fill="${shade(g, .35)}"/><circle cx="47" cy="69" r="2.4" fill="#B4262A"/><circle cx="57" cy="72" r="2.4" fill="#B4262A"/><circle cx="51" cy="78" r="2.4" fill="#B4262A"/>`,
      };
      inner = `<ellipse cx="52" cy="88" rx="30" ry="8" fill="#fff" opacity=".07"/><ellipse cx="52" cy="84" rx="26" ry="9" fill="${shade('#14141B', .12)}" stroke="rgba(255,255,255,.14)"/>${glyphs[item.art] || glyphs.cheese}`;
    }
    return `<svg class="itemart ${cls || ''}" viewBox="0 0 100 120" role="img" aria-label="${esc(item.name)}">
      <defs>
        <linearGradient id="${id}b" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stop-color="${shade(g, -.25)}"/><stop offset=".38" stop-color="${shade(g, .22)}"/><stop offset=".62" stop-color="${g}"/><stop offset="1" stop-color="${shade(g, -.4)}"/>
        </linearGradient>
      </defs>
      <ellipse cx="50" cy="112" rx="24" ry="4" fill="#4A3A18" opacity=".16"/>
      ${inner}
    </svg>`;
  }

  /* ---------- logo mark: five tally strokes, fifth in gold ---------- */
  function logoMark(size) {
    const id = 'lg' + (gradSeq++);
    return `<svg class="logo__mark" style="width:${size || 38}px;height:${size || 38}px" viewBox="0 0 48 48" role="img" aria-label="BarTally">
      <defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#DFB86A"/><stop offset="1" stop-color="#A87B2F"/></linearGradient></defs>
      <rect width="48" height="48" rx="13" fill="#142320" stroke="rgba(255,255,255,.1)"/>
      <g stroke="#EDEDF2" stroke-width="3.2" stroke-linecap="round">
        <path d="M14 14v20M21 14v20M28 14v20M35 14v20"/>
      </g>
      <path d="M10 31 39 17" stroke="url(#${id})" stroke-width="3.6" stroke-linecap="round"/>
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
        body{font-family:Segoe UI,system-ui,sans-serif;color:#151519;margin:32px;font-size:13px}
        h1{font-size:20px;margin:0 0 2px} .sub{color:#777;font-size:12px;margin-bottom:18px}
        table{width:100%;border-collapse:collapse;margin:10px 0 22px}
        th{font-size:10px;text-transform:uppercase;letter-spacing:.06em;color:#888;text-align:left;padding:6px 8px;border-bottom:2px solid #e8c87a}
        td{padding:6px 8px;border-bottom:1px solid #eee;font-variant-numeric:tabular-nums}
        .neg{color:#C0392B;font-weight:600}.pos{color:#1E8E5A}
        .brand{display:flex;align-items:center;gap:10px;margin-bottom:20px;padding-bottom:14px;border-bottom:3px solid #C99A4B}
        .brand b{font-size:16px} h2{font-size:14px;margin:18px 0 4px}
        .kpis{display:flex;gap:26px;margin:14px 0}.kpis div b{display:block;font-size:19px}
        .kpis div span{font-size:11px;color:#888}
      </style></head><body>
      <div class="brand"><svg width="34" height="34" viewBox="0 0 48 48"><rect width="48" height="48" rx="13" fill="#142320"/><g stroke="#EDEDF2" stroke-width="3.2" stroke-linecap="round"><path d="M14 14v20M21 14v20M28 14v20M35 14v20"/></g><path d="M10 31 39 17" stroke="#C99A4B" stroke-width="3.6" stroke-linecap="round"/></svg>
      <div><b>${esc(Store.state.settings.barName || 'BarTally')}</b><div style="color:#999;font-size:11px">${esc(title)}</div></div></div>
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
  function renderTabs(root) {
    const owner = Store.isOwner;
    const tabs = owner
      ? [['dashboard', 'home', 'tab.home'], ['sell', 'sell', 'tab.sell'], ['count', 'count', 'tab.count'], ['inventory', 'stock', 'tab.stock'], ['more', 'more', 'tab.more']]
      : [['sell', 'sell', 'tab.sell']];
    if (!owner) return; // staff: single screen, no tab chrome
    const lit = ['restock', 'waste', 'reports', 'insights', 'settings'].includes(current) ? 'more' : current;
    const bar = el(`<nav class="tabbar" aria-label="Navigation">${tabs.map(([id, ic, key]) =>
      `<button class="tabbar__btn ${lit === id ? 'is-on' : ''}" data-go="${id}">${icon(ic)}<span>${esc(t(key))}</span></button>`).join('')}</nav>`);
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

/* notification body text for system notifications */
window.__notifText = (type, p) => {
  if (type === 'low') { const it = Store.item(p.itemId); return t('ntf.low', { item: it?.name || '?', qty: UI.fmtQty(p.qty), unit: t('u.' + (p.unit || 'bouteille')) }); }
  if (type === 'variance') return t('ntf.variance', { n: p.n, top: p.top });
  if (type === 'reminder') return t('ntf.countReminder', { date: p.date });
  return '';
};
