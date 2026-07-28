/* ============ Screen: count — guided daily inventory count (owner only) ============ */
(() => {
  I18N.extend({
    fr: {
      'count.ownerOnly': 'Réservé au patron',
      'count.ownerOnlySub': 'Le comptage de fin de journée est géré par le patron.',
      'count.itemsToCount': 'articles à compter',
      'count.startHint': 'Comptez le stock réel, article par article. L’écart avec le stock attendu se calcule tout seul.',
      'count.viewReport': 'Voir le rapport',
      'count.scanMiss': 'Aucun article associé à ce code',
      'count.skipped': 'Passé',
      'count.autofilled': 'Auto-rempli',
      'count.closeConfirm': 'La journée sera clôturée et son rapport ajouté à l’historique. Vous pourrez la rouvrir si besoin.',
      'count.noItems': 'Aucun article à compter',
      'count.noItemsSub': 'Activez ou ajoutez des articles dans Stock pour lancer un comptage.',
    },
    en: {
      'count.ownerOnly': 'Owner only',
      'count.ownerOnlySub': 'The end-of-day count is managed by the owner.',
      'count.itemsToCount': 'items to count',
      'count.startHint': 'Count your real stock, one item at a time. The variance with expected stock is calculated automatically.',
      'count.viewReport': 'View report',
      'count.scanMiss': 'No item matches this code',
      'count.skipped': 'Skipped',
      'count.autofilled': 'Auto-filled',
      'count.closeConfirm': 'The day will be closed and its report added to History. You can reopen it if needed.',
      'count.noItems': 'No items to count',
      'count.noItemsSub': 'Activate or add items in Stock to start a count.',
    },
  });

  /* transient walkthrough state — survives store-driven re-renders */
  const V = { countId: null, mode: null, idx: 0, buf: '', closedId: null, revealed: false };

  const fmtVar = v => v > 0 ? '+' + UI.fmtQty(v) : v < 0 ? '−' + UI.fmtQty(Math.abs(v)) : UI.fmtQty(0);
  const fmtBuf = b => I18N.lang === 'fr' ? b.replace('.', ',') : b;
  const varCls = v => v > 0 ? 'varpos' : v < 0 ? 'varneg' : 'varzero';

  const CSS = `
  [data-screen=count] .btn svg{width:18px;height:18px}
  [data-screen=count] .iconbtn[disabled]{opacity:.4;pointer-events:none}
  [data-screen=count] .cw-top{display:flex;align-items:center;gap:var(--s3);margin-bottom:var(--s4)}
  [data-screen=count] .cw-top__body{flex:1;min-width:0}
  [data-screen=count] .cw-top__cat{font-family:var(--f-display);font-weight:700;font-size:16px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  [data-screen=count] .cw-top__sub{font-size:12px;color:var(--text-3);margin-top:1px}
  [data-screen=count] .cw-stage{display:flex;flex-direction:column;align-items:center;text-align:center;animation:cw-in .3s cubic-bezier(.2,.8,.25,1)}
  @keyframes cw-in{from{opacity:0;transform:translateX(18px)}to{opacity:1;transform:none}}
  [data-screen=count] .cw-art{width:116px;height:140px;filter:drop-shadow(0 14px 28px rgba(0,0,0,.55))}
  [data-screen=count] .cw-art .itemart{width:100%;height:100%}
  [data-screen=count] .cw-art .itemart img{width:100%;height:100%;object-fit:cover;border-radius:18px}
  [data-screen=count] .cw-name{font-size:19px;margin-top:var(--s2)}
  [data-screen=count] .cw-unit{color:var(--text-3);font-size:12px;margin-top:1px}
  [data-screen=count] .cw-duo{display:grid;grid-template-columns:1fr 1.3fr;gap:var(--s3);width:100%;margin-top:var(--s4)}
  [data-screen=count] .cw-exp{background:var(--surface);border:1px solid var(--hairline);border-radius:16px;padding:10px 8px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;min-height:64px}
  [data-screen=count] .cw-exp b{font-size:30px;line-height:1.1;font-weight:700}
  [data-screen=count] .cw-in{background:var(--surface-2);border:1px solid var(--hairline);border-radius:16px;display:flex;align-items:center;justify-content:center;min-height:64px;font-size:30px;font-weight:700;color:var(--text);padding:4px 10px;transition:border-color .15s,box-shadow .15s,color .15s}
  [data-screen=count] .cw-in.has{color:var(--gold-hi);border-color:rgba(245,166,35,.5);box-shadow:var(--glow-gold)}
  [data-screen=count] .cw-pad{width:100%}
  [data-screen=count] .cw-acts{display:flex;gap:var(--s2);width:100%;margin-top:var(--s3)}
  [data-screen=count] .cw-acts .btn--ghost{flex:1}
  [data-screen=count] .cw-acts .btn--gold{flex:1.6}
  [data-screen=count] .rev-row{width:100%;text-align:left;animation:cnt-rev .45s cubic-bezier(.2,.8,.3,1) both}
  [data-screen=count] .rev-row.no-anim{animation:none}
  @keyframes cnt-rev{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
  [data-screen=count] .rev-var{font-family:var(--f-display);font-weight:700;font-size:17px}
  [data-screen=count] .cnt-alert{display:flex;align-items:center;gap:6px;color:var(--warn)}
  [data-screen=count] .cnt-alert svg{width:15px;height:15px;flex:none}
  [data-screen=count] .cnt-spark svg{width:34px;height:34px;color:var(--gold);margin:0 auto}
  [data-screen=count] .cd-wrap{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:var(--s2);padding:var(--s6) 0}
  [data-screen=count] .cd-check{width:88px;height:88px;border-radius:50%;background:var(--gold-grad);color:var(--on-gold);display:flex;align-items:center;justify-content:center;box-shadow:var(--glow-gold);animation:cd-pop .55s cubic-bezier(.2,.9,.3,1.35)}
  [data-screen=count] .cd-check svg{width:42px;height:42px}
  @keyframes cd-pop{from{opacity:0;transform:scale(.5)}60%{transform:scale(1.06)}to{opacity:1;transform:scale(1)}}
  [data-screen=count].cnt-ov{position:fixed;inset:0;z-index:90;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;padding:var(--s6);text-align:center;background:rgba(6,6,10,.9);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);animation:fade-in .25s}
  [data-screen=count].cnt-ov.is-out{animation:fade-out .28s forwards}
  [data-screen=count].cnt-ov .cnt-ov__ring{stroke-dasharray:290;stroke-dashoffset:290;animation:cnt-draw .85s .1s cubic-bezier(.55,0,.3,1) forwards}
  [data-screen=count].cnt-ov .cnt-ov__ck{stroke-dasharray:56;stroke-dashoffset:56;animation:cnt-draw .35s .8s ease-out forwards}
  [data-screen=count].cnt-ov h2{font-size:22px;margin-top:var(--s3);opacity:0;animation:cnt-up .45s .95s forwards}
  [data-screen=count].cnt-ov p{color:var(--text-2);font-size:13.5px;opacity:0;animation:cnt-up .45s 1.05s forwards}
  @keyframes cnt-draw{to{stroke-dashoffset:0}}
  @keyframes cnt-up{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
  @media (prefers-reduced-motion:reduce){
    [data-screen=count] .rev-row,
    [data-screen=count].cnt-ov .cnt-ov__ring,[data-screen=count].cnt-ov .cnt-ov__ck,
    [data-screen=count].cnt-ov h2,[data-screen=count].cnt-ov p{animation-delay:0ms!important}
  }`;

  function ensureStyle() {
    if (document.getElementById('cnt-css')) return;
    document.head.appendChild(UI.el('<style id="cnt-css">' + CSS + '</style>'));
  }

  /* categories by sort, then items by their sort inside each */
  function orderedItems() {
    const cats = [...Store.state.categories].sort((a, b) => a.sort - b.sort);
    const act = Store.activeItems();
    const out = [];
    for (const c of cats) out.push(...act.filter(i => i.catId === c.id));
    out.push(...act.filter(i => !cats.some(c => c.id === i.catId)));
    return out;
  }

  function setPos(i, c, ordered) {
    V.idx = i; V.mode = 'walk'; V.revealed = false;
    const ln = c.lines.find(l => l.itemId === ordered[i].id);
    V.buf = ln ? String(ln.counted) : '';
  }

  function applyKey(buf, k, dec) {
    if (k === 'del') return buf.slice(0, -1);
    if (k === 'dot') { if (!dec || buf.includes('.')) return buf; return (buf === '' ? '0' : buf) + '.'; }
    if (buf.includes('.')) { if (buf.split('.')[1].length >= 2) return buf; return buf + k; }
    if (buf.length >= 5) return buf;
    return buf === '0' ? k : buf + k;
  }

  /* ---------- closing moment: full-screen gold ring draw + check ---------- */
  function showCloseMoment() {
    const ov = UI.el(`<div class="cnt-ov" data-screen="count" role="status">
      <svg viewBox="0 0 100 100" width="118" height="118" aria-hidden="true">
        <defs><linearGradient id="cntOvG" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#F7C14B"/><stop offset="1" stop-color="#E8940A"/>
        </linearGradient></defs>
        <circle cx="50" cy="50" r="46" fill="none" stroke="rgba(255,255,255,.07)" stroke-width="5"/>
        <circle class="cnt-ov__ring" cx="50" cy="50" r="46" fill="none" stroke="url(#cntOvG)" stroke-width="5" stroke-linecap="round" transform="rotate(-90 50 50)"/>
        <path class="cnt-ov__ck" d="M31 52l13 13 25-27" fill="none" stroke="url(#cntOvG)" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      <h2>${UI.esc(t('count.closed'))}</h2>
      <p>${UI.esc(t('count.closedSub'))}</p>
    </div>`);
    document.body.appendChild(ov);
    UI.haptic('success');
    setTimeout(() => ov.classList.add('is-out'), 1800);
    setTimeout(() => ov.remove(), 2120);
  }

  /* ---------- note / edit sheet (lives outside the screen; reads fresh at action time) ---------- */
  function openLineSheet(countId, item) {
    const c0 = Store.state.counts.find(x => x.id === countId);
    if (!c0) return;
    const l0 = c0.lines.find(l => l.itemId === item.id);
    let buf = l0 ? String(l0.counted) : '';
    const exp = l0 ? l0.expected : Store.countExpected(item.id, c0.bd);
    const content = UI.el(`<div data-screen="count">
      <div class="row" style="border:0;padding:0;min-height:0;margin-bottom:var(--s3)">
        <span class="row__art">${UI.art(item)}</span>
        <span class="row__body">
          <span class="row__t">${UI.esc(item.name)}</span>
          <span class="row__s">${UI.esc(t('count.expected'))} ${UI.esc(UI.fmtQty(exp))} · ${UI.esc(t('u.' + item.unit))}</span>
        </span>
      </div>
      <div class="cw-in num" data-el="d" style="font-size:26px;min-height:58px"></div>
      <div class="cw-pad" data-el="p"></div>
      <div class="field mt4"><label>${UI.esc(t('count.note'))}</label>
        <textarea rows="3" placeholder="${UI.esc(t('count.notePh'))}">${UI.esc(l0 ? (l0.note || '') : '')}</textarea></div>
      <button class="btn btn--gold btn--full" data-a="save">${UI.esc(t('g.save'))}</button>
    </div>`);
    const disp = () => {
      const d = content.querySelector('[data-el=d]');
      d.classList.toggle('has', buf !== '');
      d.innerHTML = buf !== ''
        ? UI.esc(fmtBuf(buf))
        : `<span style="font-size:13px;font-weight:500;color:var(--text-3)">${UI.esc(t('count.enterCount'))}</span>`;
    };
    disp();
    UI.numpad(content.querySelector('[data-el=p]'), { decimal: !!item.allowDecimal, onKey: k => { buf = applyKey(buf, k, !!item.allowDecimal); disp(); } });
    const s = UI.sheet(content);
    content.querySelector('[data-a=save]').addEventListener('click', () => {
      const note = content.querySelector('textarea').value.trim();
      const cc = Store.state.counts.find(x => x.id === countId);   // fresh read
      if (!cc || cc.status !== 'open') return s.close();
      const val = Math.round(parseFloat(buf) * 100) / 100;
      const ln = cc.lines.find(l => l.itemId === item.id);
      if (buf !== '' && !isNaN(val)) { Store.setCountLine(countId, item.id, val, note); UI.haptic('light'); }
      else if (ln && note !== (ln.note || '')) Store.setCountNote(countId, item.id, note);
      s.close();
    });
  }

  /* ---------- entry states ---------- */
  function renderLocked(el) {
    el.innerHTML = UI.header(t('count.title')) + `
      <div class="empty grow">${UI.icon('lock')}
        <div class="empty__t">${UI.esc(t('count.ownerOnly'))}</div>
        <div class="empty__s">${UI.esc(t('count.ownerOnlySub'))}</div>
      </div>`;
  }

  function renderNoItems(el) {
    el.innerHTML = UI.header(t('count.title')) + `
      <div class="empty grow">${UI.icon('stock')}
        <div class="empty__t">${UI.esc(t('count.noItems'))}</div>
        <div class="empty__s">${UI.esc(t('count.noItemsSub'))}</div>
      </div>`;
  }

  function renderStart(el, ordered, today) {
    const sumExp = ordered.reduce((s, o) => s + Math.max(0, Store.countExpected(o.id, today)), 0);
    el.innerHTML = UI.header(t('count.title'), t('count.forDay', { date: UI.fmtDate(today) })) + `
      <div class="card card--gold">
        <p style="color:var(--text-2);font-size:14px;line-height:1.55">${UI.esc(t('count.startHint'))}</p>
        <div class="stats mt4">
          <div class="stat"><div class="stat__v num">${ordered.length}</div><div class="stat__l">${UI.esc(t('count.itemsToCount'))}</div></div>
          <div class="stat"><div class="stat__v num">${UI.esc(UI.fmtQty(sumExp))}</div><div class="stat__l">${UI.esc(t('inv.expected'))}</div></div>
        </div>
        <button class="btn btn--gold btn--big btn--full mt4" data-a="start">${UI.icon('count')} ${UI.esc(t('count.start'))}</button>
      </div>`;
    el.addEventListener('click', e => {
      if (!e.target.closest('[data-a=start]')) return;
      if (!Store.isOwner) return;
      UI.haptic('light');
      V.countId = null; V.closedId = null; V.revealed = false;
      Store.openCount();
    });
  }

  /* ---------- walkthrough: one item at a time ---------- */
  function renderWalk(el, c, ordered) {
    const it = ordered[V.idx];
    const catg = Store.cat(it.catId);
    const done = ordered.filter(o => c.lines.some(l => l.itemId === o.id)).length;
    const total = ordered.length;
    const exp = Store.countExpected(it.id, c.bd);
    el.innerHTML = `
      <div class="cw-top">
        ${UI.ring(done / total, done + '/' + total)}
        <div class="cw-top__body">
          <div class="cw-top__cat">${UI.esc(catg ? Store.catName(catg) : '')}</div>
          <div class="cw-top__sub">${UI.esc(t('count.forDay', { date: UI.fmtDate(c.bd) }))}</div>
        </div>
        <button class="iconbtn" data-a="scan" aria-label="${UI.esc(t('sell.scan'))}">${UI.icon('scan')}</button>
        <button class="iconbtn" data-a="exit" aria-label="${UI.esc(t('g.close'))}">${UI.icon('x')}</button>
      </div>
      <div class="card cw-stage">
        <div class="cw-art">${UI.art(it)}</div>
        <h2 class="cw-name">${UI.esc(it.name)}</h2>
        <div class="cw-unit">${UI.esc(t('u.' + it.unit))}</div>
        <div class="cw-duo">
          <div class="cw-exp"><span class="eyebrow">${UI.esc(t('count.expected'))}</span><b class="num">${UI.esc(UI.fmtQty(exp))}</b></div>
          <div class="cw-in num" data-el="disp" aria-label="${UI.esc(t('count.counted'))}"></div>
        </div>
        <div class="cw-pad" data-el="pad"></div>
        <div class="cw-acts">
          <button class="iconbtn" data-a="prev" ${V.idx === 0 ? 'disabled' : ''} aria-label="${UI.esc(t('g.back'))}">${UI.icon('chevL')}</button>
          <button class="btn btn--ghost" data-a="skip">${UI.esc(t('count.skip'))}</button>
          <button class="btn btn--gold" data-a="ok">${UI.icon('check')} ${UI.esc(t('g.confirm'))}</button>
        </div>
      </div>`;
    const disp = () => {
      const d = el.querySelector('[data-el=disp]'); if (!d) return;
      const has = V.buf !== '' && !isNaN(parseFloat(V.buf));
      d.classList.toggle('has', V.buf !== '');
      d.innerHTML = V.buf !== ''
        ? UI.esc(fmtBuf(V.buf))
        : `<span style="font-size:13px;font-weight:500;color:var(--text-3)">${UI.esc(t('count.enterCount'))}</span>`;
      const ok = el.querySelector('[data-a=ok]'); if (ok) ok.disabled = !has;
    };
    disp();
    UI.numpad(el.querySelector('[data-el=pad]'), { decimal: !!it.allowDecimal, onKey: k => { V.buf = applyKey(V.buf, k, !!it.allowDecimal); disp(); } });
    el.addEventListener('click', e => {
      const b = e.target.closest('[data-a]'); if (!b) return;
      const a = b.dataset.a;
      if (a === 'exit') { UI.haptic('light'); return UI.go('dashboard'); }   // confirm-less: count stays open
      if (a === 'scan') {
        return UI.scan({ onCode: code => {
          const found = Store.findByBarcode(code);
          const j = found ? ordered.findIndex(o => o.id === found.id) : -1;
          if (j >= 0) { setPos(j, c, ordered); UI.haptic('light'); UI.refresh(); }
          else { UI.haptic('warn'); UI.toast(t('count.scanMiss'), { type: 'danger' }); }
        } });
      }
      if (a === 'prev') { if (V.idx > 0) { setPos(V.idx - 1, c, ordered); UI.refresh(); } return; }
      if (a === 'skip') {
        UI.haptic('light');
        if (V.idx >= ordered.length - 1) { V.mode = 'review'; V.revealed = false; } else setPos(V.idx + 1, c, ordered);
        return UI.refresh();
      }
      if (a === 'ok') {
        const val = Math.round(parseFloat(V.buf) * 100) / 100;
        if (isNaN(val)) return;
        UI.haptic('light');
        if (V.idx >= ordered.length - 1) { V.mode = 'review'; V.revealed = false; V.buf = ''; }
        else setPos(V.idx + 1, c, ordered);
        Store.setCountLine(c.id, it.id, val);   // emits → screen re-renders on updated V
      }
    });
  }

  /* ---------- review: the variance reveal ---------- */
  function renderReview(el, c, ordered) {
    const lineOf = id => c.lines.find(l => l.itemId === id);
    const done = ordered.filter(o => lineOf(o.id)).length;
    const missing = ordered.length - done;
    const sum = Math.round(c.lines.reduce((s, l) => s + l.variance, 0) * 100) / 100;
    const nonzero = c.lines.filter(l => l.variance !== 0).length;
    const clean = missing === 0 && nonzero === 0 && ordered.length > 0;
    const anim = !V.revealed; V.revealed = true;
    const rows = ordered.map((it2, i) => {
      const l = lineOf(it2.id);
      let sub, end;
      if (l) {
        const parts = [`${UI.esc(UI.fmtQty(l.expected))} → ${UI.esc(UI.fmtQty(l.counted))}`];
        if (l.autofilled) parts.push(UI.esc(t('count.autofilled')));
        if (l.note) parts.push(UI.esc(l.note.length > 26 ? l.note.slice(0, 25) + '…' : l.note));
        sub = parts.join(' · ');
        end = `<span class="rev-var ${varCls(l.variance)}">${UI.esc(fmtVar(l.variance))}</span>`;
      } else {
        sub = `${UI.esc(t('count.expected'))} ${UI.esc(UI.fmtQty(Store.countExpected(it2.id, c.bd)))} · ${UI.esc(t('count.skipped'))}`;
        end = `<span class="rev-var varzero">—</span>`;
      }
      return `<button class="row rev-row ${anim ? '' : 'no-anim'}" data-i="${i}" ${anim ? `style="animation-delay:${Math.min(i * 35, 650)}ms"` : ''}>
        <span class="row__art">${UI.art(it2)}</span>
        <span class="row__body"><span class="row__t">${UI.esc(it2.name)}</span><span class="row__s">${sub}</span></span>
        <span class="row__end">${end}</span>
      </button>`;
    }).join('');
    el.innerHTML = UI.header(t('count.review'), t('count.reviewHint'),
      `<button class="iconbtn" data-a="backwalk" aria-label="${UI.esc(t('g.back'))}">${UI.icon('chevL')}</button>
       <button class="iconbtn" data-a="exit" aria-label="${UI.esc(t('g.close'))}">${UI.icon('x')}</button>`) + `
      <div class="card" style="padding:6px 16px">${rows}</div>
      ${clean ? `
      <div class="card card--gold mt3" style="text-align:center;padding:24px 16px">
        <span class="cnt-spark">${UI.icon('sparkles')}</span>
        <h2 style="font-size:20px;margin-top:8px">${UI.esc(t('count.clean'))}</h2>
        <p style="color:var(--text-2);font-size:13.5px;margin-top:4px">${UI.esc(t('count.cleanSub'))}</p>
      </div>` : `
      <div class="card mt3">
        <div class="card__head" style="margin-bottom:6px">
          <span class="card__title">${UI.esc(t('count.varTotal'))}</span>
          <span class="rev-var ${varCls(sum)}" style="font-size:22px">${UI.esc(fmtVar(sum))}</span>
        </div>
        <div class="tt">${UI.esc(nonzero ? t('dash.varianceIssues', { n: nonzero }) : t('dash.varianceClean'))}</div>
        ${missing ? `<div class="tt mt2 cnt-alert">${UI.icon('alert')}<span>${UI.esc(t('count.missing', { n: missing }))}</span></div>` : ''}
      </div>`}
      <button class="btn btn--gold btn--big btn--full mt4" data-a="close">${UI.icon('check')} ${UI.esc(t('count.closeDay'))}</button>`;
    el.addEventListener('click', async e => {
      const b = e.target.closest('[data-a],[data-i]'); if (!b) return;
      const a = b.dataset.a;
      if (a === 'exit') { UI.haptic('light'); return UI.go('dashboard'); }
      if (a === 'backwalk') { setPos(ordered.length - 1, c, ordered); return UI.refresh(); }
      if (a === 'close') {
        const ok = await UI.confirm(t('count.closeConfirm'), { title: t('count.closeDay'), yes: t('count.closeDay') });
        if (!ok) return;
        const closed = Store.closeCount(c.id);
        if (closed) { V.closedId = closed.id; V.countId = null; V.mode = null; showCloseMoment(); }
        return;
      }
      if (b.dataset.i !== undefined) openLineSheet(c.id, ordered[+b.dataset.i]);
    });
  }

  /* ---------- done state: day closed ---------- */
  function renderDone(el, cc) {
    const nonzero = cc.lines.filter(l => l.variance !== 0).length;
    const sum = Math.round(cc.lines.reduce((s, l) => s + l.variance, 0) * 100) / 100;
    el.innerHTML = UI.header(t('count.title')) + `
      <div class="cd-wrap grow">
        <div class="cd-check">${UI.icon('check')}</div>
        <h1 style="font-size:24px;margin-top:10px">${UI.esc(t('count.closed'))}</h1>
        <div style="color:var(--text-2);font-size:14px">${UI.esc(UI.fmtDate(cc.bd, { weekday: 'long', day: 'numeric', month: 'long' }))}</div>
        <div style="font-size:13.5px">
          ${nonzero
            ? `<span class="num ${varCls(sum)}" style="font-weight:700">${UI.esc(fmtVar(sum))}</span> <span style="color:var(--text-2)">· ${UI.esc(t('dash.varianceIssues', { n: nonzero }))}</span>`
            : `<span style="color:var(--ok);font-weight:600">${UI.esc(t('dash.varianceClean'))}</span>`}
        </div>
        ${cc.closedBy ? `<div class="tt">${UI.esc(t('sell.by', { name: cc.closedBy }))}${cc.closedAt ? ' · ' + UI.esc(UI.fmtTime(cc.closedAt)) : ''}</div>` : ''}
        <div style="width:100%;max-width:340px;display:flex;flex-direction:column;gap:10px;margin-top:var(--s6)">
          <button class="btn btn--gold btn--big btn--full" data-a="report">${UI.icon('calendar')} ${UI.esc(t('count.viewReport'))}</button>
          ${cc.isOpening ? '' : `<button class="btn btn--ghost btn--full" data-a="reopen">${UI.esc(t('count.reopen'))}</button>`}
        </div>
      </div>`;
    el.addEventListener('click', async e => {
      const b = e.target.closest('[data-a]'); if (!b) return;
      if (b.dataset.a === 'report') return UI.go('reports', { day: cc.bd });
      if (b.dataset.a === 'reopen') {
        const ok = await UI.confirm(t('count.reopenWarn'), { danger: true, title: t('count.reopen'), yes: t('count.reopen') });
        if (ok && Store.reopenCount(cc.id)) { V.countId = null; V.closedId = null; UI.haptic('warn'); }
      }
    });
  }

  /* ---------- register ---------- */
  UI.registerScreen({
    id: 'count',
    render(el) {
      ensureStyle();
      if (!Store.isOwner) return renderLocked(el);
      const st = Store.state, today = Store.todayBd();
      const ordered = orderedItems();
      const closedToday = st.counts.find(c => c.status === 'closed' && !c.isOpening && c.bd === today)
        || (V.closedId ? st.counts.find(c => c.id === V.closedId && c.status === 'closed') : null);
      const open = st.counts.find(c => c.status === 'open');
      if (closedToday && !open) return renderDone(el, closedToday);        // (a) day already closed
      if (open) {                                                          // (b) resume where left
        if (!ordered.length) return renderNoItems(el);
        if (V.countId !== open.id) {
          V.countId = open.id; V.closedId = null; V.revealed = false;
          const fi = ordered.findIndex(o => !open.lines.some(l => l.itemId === o.id));
          if (fi === -1) { V.mode = 'review'; V.idx = ordered.length - 1; V.buf = ''; }
          else setPos(fi, open, ordered);
        }
        if (V.idx >= ordered.length) V.idx = ordered.length - 1;
        if (V.mode === 'review') return renderReview(el, open, ordered);
        return renderWalk(el, open, ordered);
      }
      if (!ordered.length) return renderNoItems(el);                       // nothing to count yet
      renderStart(el, ordered, today);                                     // (c) start card
    },
  });
})();
