/* ============ 28 — Settings screen (owner only) ============ */
(() => {
  I18N.extend({
    fr: {
      'set.pinCurrent': 'Code actuel',
      'set.pinNew': 'Nouveau code',
      'set.pinFor': 'Nouveau code pour {name}',
      'set.pinLen': '4 à 6 chiffres',
      'set.pinOptional': 'Code PIN (optionnel)',
      'set.memberAdded': 'Membre ajouté',
      'set.teamEmpty': 'Aucun membre pour l’instant',
      'set.teamEmptySub': 'Ajoutez les personnes qui servent au bar.',
      'set.teamDeactivateWarn': '{name} ne pourra plus se connecter. Ses ventes restent visibles. Continuer ?',
      'set.teamReactivateWarn': 'Réactiver {name} ? Le membre pourra de nouveau se connecter.',
      'set.notifHint': 'Stock bas et écarts, directement sur cet appareil.',
      'set.notifDenied': 'Notifications bloquées — autorisez-les dans les réglages du navigateur.',
      'set.notifUnsupported': 'Notifications non prises en charge sur cet appareil.',
      'set.costsShow': 'Saisir les coûts ({n} articles)',
      'set.costsHide': 'Masquer la liste',
      'set.curLen': 'La devise doit faire 3 à 5 caractères (ex. MAD).',
      'set.langFr': 'Français',
      'set.langEn': 'English',
    },
    en: {
      'set.pinCurrent': 'Current PIN',
      'set.pinNew': 'New PIN',
      'set.pinFor': 'New PIN for {name}',
      'set.pinLen': '4 to 6 digits',
      'set.pinOptional': 'PIN (optional)',
      'set.memberAdded': 'Member added',
      'set.teamEmpty': 'No team members yet',
      'set.teamEmptySub': 'Add the people who serve at the bar.',
      'set.teamDeactivateWarn': '{name} won’t be able to sign in anymore. Their sales stay visible. Continue?',
      'set.teamReactivateWarn': 'Reactivate {name}? They will be able to sign in again.',
      'set.notifHint': 'Low stock and variances, right on this device.',
      'set.notifDenied': 'Notifications are blocked — allow them in your browser settings.',
      'set.notifUnsupported': 'Notifications aren’t supported on this device.',
      'set.costsShow': 'Enter costs ({n} items)',
      'set.costsHide': 'Hide the list',
      'set.curLen': 'Currency must be 3–5 characters (e.g. MAD).',
      'set.langFr': 'Français',
      'set.langEn': 'English',
    },
  });

  document.head.appendChild(UI.el(`<style>
    [data-screen=settings] .row__t,[data-screen=settings] .row__s{display:block}
    [data-screen=settings] .stg-logo{width:64px;height:64px;border-radius:16px;overflow:hidden;border:1px solid var(--hairline);background:var(--surface-2);flex:none;display:flex;align-items:center;justify-content:center}
    [data-screen=settings] .stg-logo img{width:100%;height:100%;object-fit:cover}
    [data-screen=settings] .stg-av{width:40px;height:40px;border-radius:50%;background:var(--gold-soft);border:1px solid rgba(201,154,75,.25);color:var(--gold-hi);display:inline-flex;align-items:center;justify-content:center;font-family:var(--f-display);font-weight:700;font-size:13.5px;letter-spacing:.02em;flex:none}
    [data-screen=settings] .row.is-off .stg-av,[data-screen=settings] .row.is-off .row__t{opacity:.45}
    [data-screen=settings] .stg-step{display:flex;align-items:center;gap:8px;flex:none}
    [data-screen=settings] .stg-step__v{font-size:20px;font-weight:700;min-width:30px;text-align:center}
    [data-screen=settings] .iconbtn[disabled]{opacity:.35;pointer-events:none}
    [data-screen=settings] .sw::before{content:'';position:absolute;inset:-11px;border-radius:26px}
    [data-screen=settings] .stg-cost{display:flex;align-items:center;gap:var(--s3);min-height:56px;border-bottom:1px solid var(--hairline)}
    [data-screen=settings] .stg-cost:last-child{border-bottom:0}
    [data-screen=settings] .stg-cost__n{flex:1;min-width:0;font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    [data-screen=settings] .stg-cost input{width:108px;height:48px;text-align:right;padding:0 12px;border-radius:10px;border:1px solid var(--hairline);background:var(--surface-2);font-family:var(--f-display);font-variant-numeric:tabular-nums;font-size:15px}
    [data-screen=settings] .stg-cost input:focus{border-color:rgba(201,154,75,.5)}
    [data-screen=settings] .stg-cost input::-webkit-outer-spin-button,[data-screen=settings] .stg-cost input::-webkit-inner-spin-button{-webkit-appearance:none;margin:0}
    [data-screen=settings] .stg-warnbtn{background:var(--warn-soft);color:var(--warn);border:1px solid rgba(251,146,60,.3)}
    [data-screen=settings] .stg-costs{animation:stg-open .28s cubic-bezier(.2,.8,.3,1)}
    @keyframes stg-open{from{opacity:0;transform:translateY(-6px)}}
  </style>`));

  const VERSION = '1.0.0';
  const esc = UI.esc;
  const S = () => Store.state.settings;
  const pad2 = n => String(n).padStart(2, '0');
  const localBd = iso => { const d = new Date(iso); return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()); };
  const initials = n => {
    const w = String(n || '').trim().split(/\s+/).filter(Boolean);
    if (!w.length) return '?';
    return (w.length === 1 ? w[0].slice(0, 2) : w[0][0] + w[w.length - 1][0]).toUpperCase();
  };

  /* transient UI state that must survive re-renders */
  let costsOpen = false;
  let costFocusId = null;

  let savedAt = 0;
  function saved() {
    const now = Date.now();
    if (now - savedAt < 900) return;
    savedAt = now;
    UI.haptic('light');
    UI.toast(t('set.saved'), { type: 'ok', ms: 1500 });
  }

  /* ---------- sheets ---------- */

  function ownerPinSheet() {
    let step = 0, val = '', newPin = '', busy = false;
    const c = UI.el(`<div>
      <h2 style="font-size:18px;margin-bottom:2px">${esc(t('set.ownerPin'))}</h2>
      <p data-r="step" style="color:var(--text-2);font-size:13.5px">${esc(t('set.pinCurrent'))}</p>
      <div class="pinDots" data-r="dots"><i></i><i></i><i></i><i></i></div>
      <div data-r="pad"></div>
    </div>`);
    const sh = UI.sheet(c);
    const stepEl = c.querySelector('[data-r=step]');
    const dotsEl = c.querySelector('[data-r=dots]');
    const paint = () => {
      stepEl.textContent = [t('set.pinCurrent'), t('set.pinNew'), t('wiz.ownerPinConfirm')][step];
      [...dotsEl.children].forEach((d, i) => d.classList.toggle('on', i < val.length));
    };
    const shake = () => { dotsEl.classList.remove('shake'); void dotsEl.offsetWidth; dotsEl.classList.add('shake'); UI.haptic('warn'); };
    UI.numpad(c.querySelector('[data-r=pad]'), {
      onKey: async k => {
        if (busy) return;
        if (k === 'del') val = val.slice(0, -1);
        else if (k !== 'dot' && val.length < 4) val += k;
        paint();
        if (val.length < 4) return;
        busy = true;
        const pin = val;
        await new Promise(r => setTimeout(r, 160));
        if (step === 0) {
          // verify by re-logging the same owner session (acceptable side effect), then bounce back
          if (await Store.loginOwner(pin)) { UI.go('settings'); step = 1; val = ''; }
          else { shake(); UI.toast(t('login.pinWrong'), { type: 'danger' }); val = ''; }
        } else if (step === 1) {
          newPin = pin; step = 2; val = '';
        } else if (pin === newPin) {
          await Store.setOwnerPin(pin);
          UI.haptic('success'); sh.close(); UI.toast(t('set.pinChanged'), { type: 'ok' });
          busy = false; return;
        } else {
          shake(); UI.toast(t('wiz.pinMismatch'), { type: 'danger' });
          step = 1; newPin = ''; val = '';
        }
        paint(); busy = false;
      },
    });
  }

  function staffPinSheet(empId) {
    const emp = Store.state.employees.find(x => x.id === empId);
    if (!emp) return;
    let val = '';
    const c = UI.el(`<div>
      <h2 style="font-size:18px;margin-bottom:2px">${esc(t('set.teamPinReset'))}</h2>
      <p style="color:var(--text-2);font-size:13.5px">${esc(t('set.pinFor', { name: emp.name }))}</p>
      <div class="pinDots" data-r="dots">${[0, 1, 2, 3, 4, 5].map(i => `<i${i >= 4 ? ' style="opacity:.5"' : ''}></i>`).join('')}</div>
      <p class="tt" style="text-align:center;margin-top:-8px">${esc(t('set.pinLen'))}</p>
      <div data-r="pad"></div>
      <button class="btn btn--gold btn--full mt3" data-a="ok" disabled>${esc(t('g.save'))}</button>
    </div>`);
    const sh = UI.sheet(c);
    const dotsEl = c.querySelector('[data-r=dots]');
    const okBtn = c.querySelector('[data-a=ok]');
    UI.numpad(c.querySelector('[data-r=pad]'), {
      onKey: k => {
        if (k === 'del') val = val.slice(0, -1);
        else if (k !== 'dot' && val.length < 6) val += k;
        [...dotsEl.children].forEach((d, i) => d.classList.toggle('on', i < val.length));
        okBtn.disabled = val.length < 4;
      },
    });
    okBtn.addEventListener('click', async () => {
      if (val.length < 4) return;
      okBtn.disabled = true;
      await Store.setEmployeePin(empId, val);
      UI.haptic('success'); sh.close(); UI.toast(t('set.pinChanged'), { type: 'ok' });
    });
  }

  function addMemberSheet() {
    const c = UI.el(`<div>
      <h2 style="font-size:18px;margin-bottom:14px">${esc(t('set.teamAdd'))}</h2>
      <div class="field"><label>${esc(t('inv.name'))}</label>
        <input data-r="name" type="text" maxlength="30" placeholder="${esc(t('wiz.staffNamePh'))}" autocomplete="off"></div>
      <div class="field"><label>${esc(t('set.pinOptional'))}</label>
        <input data-r="pin" type="password" inputmode="numeric" maxlength="6" placeholder="····" autocomplete="new-password">
        <p class="tt mt2">${esc(t('set.pinLen'))}</p></div>
      <button class="btn btn--gold btn--full" data-a="save">${esc(t('g.save'))}</button>
    </div>`);
    const sh = UI.sheet(c);
    const nameEl = c.querySelector('[data-r=name]');
    setTimeout(() => nameEl.focus(), 350);
    c.querySelector('[data-a=save]').addEventListener('click', async () => {
      const name = nameEl.value.trim();
      const pin = c.querySelector('[data-r=pin]').value.trim();
      if (!name) { UI.haptic('warn'); nameEl.focus(); return; }
      if (pin && !/^\d{4,6}$/.test(pin)) { UI.haptic('warn'); UI.toast(t('set.pinLen'), { type: 'danger' }); return; }
      await Store.addEmployee(name, pin || undefined);
      UI.haptic('success'); sh.close(); UI.toast(t('set.memberAdded'), { type: 'ok' });
    });
  }

  function auditSheet() {
    const rows = Store.state.audit.slice(0, 100);
    const body = rows.length ? rows.map(a => {
      const meta = a.after == null ? '' : (typeof a.after === 'string' ? a.after : JSON.stringify(a.after));
      const metaShort = meta.length > 48 ? meta.slice(0, 48) + '…' : meta;
      return `<div style="padding:9px 0;border-bottom:1px solid var(--hairline)">
        <div style="display:flex;gap:8px;align-items:baseline;min-width:0">
          <span class="num" style="font-size:12.5px;color:var(--gold-hi);flex:none">${esc(UI.fmtTime(a.at))}</span>
          <span class="tt" style="flex:none">${esc(UI.fmtDate(localBd(a.at)))}</span>
          <span class="tt" style="margin-left:auto;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(a.actor)}</span>
        </div>
        <div class="num" style="font-size:12.5px;color:var(--text-2);margin-top:2px;word-break:break-all">${esc(a.action)} · ${esc(a.entity)}${metaShort ? ' · ' + esc(metaShort) : ''}</div>
      </div>`;
    }).join('')
      : `<div class="empty">${UI.icon('book')}<div class="empty__t">${esc(t('set.auditEmpty'))}</div></div>`;
    UI.sheet(`<h2 style="font-size:18px;margin-bottom:10px">${esc(t('set.audit'))}</h2>${body}`);
  }

  function restoreFlow() {
    const inp = document.createElement('input');
    inp.type = 'file';
    inp.accept = '.json,application/json';
    inp.style.display = 'none';
    inp.addEventListener('change', async () => {
      const f = inp.files[0];
      inp.remove();
      if (!f) return;
      let text;
      try { text = await f.text(); }
      catch (e) { UI.toast(t('g.error'), { type: 'danger' }); return; }
      const ok = await UI.confirm(t('set.restoreWarn'), { danger: true, title: t('set.restore'), yes: t('set.restore') });
      if (!ok) return;
      try { Store.importJSON(text); UI.haptic('success'); UI.toast(t('set.restored'), { type: 'ok' }); }
      catch (e) { UI.toast(t('g.error'), { type: 'danger' }); }
    });
    document.body.appendChild(inp);
    inp.click();
  }

  async function toggleNotifs() {
    if (typeof Notification === 'undefined') { UI.toast(t('set.notifUnsupported'), { type: 'danger' }); return; }
    const on = Notification.permission === 'granted' && S().notifGranted;
    if (on) { Store.setSettings({ notifGranted: false }); saved(); return; }
    const perm = await Notification.requestPermission();
    if (perm === 'granted') { Store.setSettings({ notifGranted: true }); UI.haptic('success'); saved(); }
    else { Store.setSettings({ notifGranted: false }); UI.toast(t('set.notifDenied'), { type: 'danger', ms: 4200 }); }
  }

  /* ---------- section cards ---------- */

  function barCard(s) {
    const langBtn = (v, key) => `<button class="seg__btn ${s.lang === v ? 'is-on' : ''}" data-a="lang" data-v="${v}">${esc(t(key))}</button>`;
    const hours = Array.from({ length: 13 }, (_, h) =>
      `<option value="${h}" ${h === s.cutoffHour ? 'selected' : ''}>${pad2(h)}:00</option>`).join('');
    return `<div class="card">
      <div class="card__head"><div class="card__title">${esc(t('set.bar'))}</div></div>
      <div class="field"><label>${esc(t('set.barName'))}</label>
        <input data-r="barname" type="text" maxlength="40" value="${esc(s.barName)}" placeholder="${esc(t('wiz.barNamePh'))}" autocomplete="off"></div>
      <div class="field"><label>${esc(t('set.logo'))}</label>
        <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap">
          <div class="stg-logo">${s.logo ? `<img src="${esc(s.logo)}" alt="${esc(t('set.logo'))}">` : UI.logoMark(64)}</div>
          <button class="btn btn--ghost" data-a="logo-pick">${UI.icon('camera')} ${esc(t('set.logoPick'))}</button>
          ${s.logo ? `<button class="btn btn--line" data-a="logo-rm">${esc(t('set.logoRemove'))}</button>` : ''}
        </div></div>
      <div class="field"><label>${esc(t('set.lang'))}</label>
        <div class="seg">${langBtn('fr', 'set.langFr')}${langBtn('en', 'set.langEn')}</div></div>
      <div class="field" style="margin-bottom:0"><label>${esc(t('set.cutoff'))}</label>
        <select data-r="cutoff" class="num">${hours}</select>
        <p class="tt mt2">${esc(t('set.cutoffHint'))}</p></div>
    </div>`;
  }

  function teamCard(s) {
    const emps = [...Store.state.employees].sort((a, b) => (a.active === b.active ? 0 : a.active ? -1 : 1));
    const rows = emps.map(emp => `
      <div class="row ${emp.active ? '' : 'is-off'}">
        <span class="stg-av">${esc(initials(emp.name))}</span>
        <span class="row__body">
          <span class="row__t">${esc(emp.name)}</span>
          ${emp.pinHash ? `<span class="row__s">${esc(t('set.teamPin'))} ····</span>` : ''}
        </span>
        ${emp.active ? '' : `<span class="pill pill--mut">${esc(t('inv.inactive'))}</span>`}
        ${emp.active ? `<button class="iconbtn" data-a="emp-pin" data-id="${emp.id}" title="${esc(t('set.teamPinReset'))}" aria-label="${esc(t('set.teamPinReset'))}">${UI.icon('lock')}</button>` : ''}
        <button class="iconbtn" data-a="emp-act" data-id="${emp.id}" title="${esc(emp.active ? t('set.teamDeactivate') : t('set.teamReactivate'))}" aria-label="${esc(emp.active ? t('set.teamDeactivate') : t('set.teamReactivate'))}">${UI.icon(emp.active ? 'x' : 'check')}</button>
      </div>`).join('');
    const empty = `<div class="empty" style="padding:var(--s6) var(--s4)">${UI.icon('users')}
      <div class="empty__t">${esc(t('set.teamEmpty'))}</div>
      <div class="empty__s">${esc(t('set.teamEmptySub'))}</div></div>`;
    return `<div class="card">
      <div class="card__head"><div class="card__title">${esc(t('set.team'))}</div>
        <span class="pill pill--mut num">${emps.filter(e => e.active).length}</span></div>
      ${emps.length ? rows : empty}
      <button class="btn btn--ghost btn--full mt3" data-a="team-add">${UI.icon('plus')} ${esc(t('set.teamAdd'))}</button>
      <hr class="divider">
      <div class="switchrow">
        <div style="flex:1;min-width:0"><div class="switchrow__t">${esc(t('set.teamRequirePin'))}</div>
          <div class="switchrow__s">${esc(t('set.teamRequirePinHint'))}</div></div>
        <button class="sw ${s.requireStaffPin ? 'on' : ''}" data-a="requirePin" role="switch" aria-checked="${s.requireStaffPin}" aria-label="${esc(t('set.teamRequirePin'))}"></button>
      </div>
    </div>`;
  }

  function ownerPinCard() {
    return `<div class="card" style="padding:6px 16px">
      <button class="row" style="width:100%;text-align:left" data-a="owner-pin">
        <span class="iconbtn iconbtn--plain" style="color:var(--gold)">${UI.icon('lock')}</span>
        <span class="row__body"><span class="row__t">${esc(t('set.ownerPin'))}</span></span>
        <span style="color:var(--text-3)">${UI.icon('chevR')}</span>
      </button>
    </div>`;
  }

  function alertsCard(s) {
    const hasN = typeof Notification !== 'undefined';
    const perm = hasN ? Notification.permission : 'unsupported';
    const on = hasN && perm === 'granted' && s.notifGranted;
    const sub = !hasN ? t('set.notifUnsupported') : perm === 'denied' ? t('set.notifDenied') : t('set.notifHint');
    return `<div class="card">
      <div class="card__head"><div class="card__title">${esc(t('set.alerts'))}</div></div>
      <div class="switchrow">
        <div style="flex:1;min-width:0"><div class="switchrow__t">${esc(t('set.varThreshold'))}</div>
          <div class="switchrow__s">${esc(t('set.varThresholdHint'))}</div></div>
        <div class="stg-step">
          <button class="iconbtn" data-a="var-" ${s.varThreshold <= 1 ? 'disabled' : ''} aria-label="−1">${UI.icon('minus')}</button>
          <span class="stg-step__v num">${s.varThreshold}</span>
          <button class="iconbtn" data-a="var+" ${s.varThreshold >= 10 ? 'disabled' : ''} aria-label="+1">${UI.icon('plus')}</button>
        </div>
      </div>
      <hr class="divider">
      <div class="switchrow">
        <div style="flex:1;min-width:0"><div class="switchrow__t">${esc(t('set.notifOn'))}</div>
          <div class="switchrow__s"${perm === 'denied' ? ' style="color:var(--warn)"' : ''}>${esc(sub)}</div></div>
        <button class="sw ${on ? 'on' : ''}" data-a="notif" role="switch" aria-checked="${on}" aria-label="${esc(t('set.notifOn'))}"></button>
      </div>
    </div>`;
  }

  function costsCard(s) {
    const items = Store.activeItems();
    const list = costsOpen ? `<div class="stg-costs mt2">${items.map(it => `
      <div class="stg-cost">
        <span class="stg-cost__n">${esc(it.name)}</span>
        <input data-cost="${it.id}" type="number" inputmode="decimal" min="0" step="0.5" value="${it.cost ?? ''}" placeholder="—" aria-label="${esc(t('inv.cost', { cur: s.currency }))}">
      </div>`).join('')}</div>` : '';
    return `<div class="card">
      <div class="card__head"><div class="card__title">${esc(t('set.costs'))}</div></div>
      <p class="tt mb3">${esc(t('set.costsHint', { cur: s.currency }))}</p>
      <div class="field"><label>${esc(t('set.currency'))}</label>
        <input data-r="cur" type="text" maxlength="5" value="${esc(s.currency)}" style="text-transform:uppercase" autocapitalize="characters" autocomplete="off"></div>
      <button class="btn btn--ghost btn--full" data-a="costs">${UI.icon(costsOpen ? 'eye' : 'edit')} ${esc(costsOpen ? t('set.costsHide') : t('set.costsShow', { n: items.length }))}</button>
      ${list}
    </div>`;
  }

  function dataCard(s) {
    return `<div class="card">
      <div class="card__head"><div class="card__title">${esc(t('set.data'))}</div></div>
      <button class="row" style="width:100%;text-align:left" data-a="backup">
        <span class="iconbtn iconbtn--plain" style="color:var(--gold)">${UI.icon('download')}</span>
        <span class="row__body"><span class="row__t">${esc(t('set.backup'))}</span>
          <span class="row__s">${esc(t('set.backupHint'))}</span></span>
        <span style="color:var(--text-3)">${UI.icon('chevR')}</span>
      </button>
      <button class="row" style="width:100%;text-align:left" data-a="restore">
        <span class="iconbtn iconbtn--plain" style="color:var(--gold)">${UI.icon('upload')}</span>
        <span class="row__body"><span class="row__t">${esc(t('set.restore'))}</span></span>
        <span style="color:var(--text-3)">${UI.icon('chevR')}</span>
      </button>
      <hr class="divider">
      ${s.demoMode ? `<button class="btn stg-warnbtn btn--full mb2" data-a="demo-clear">${esc(t('set.demoClear'))}</button>` : ''}
      <button class="btn btn--danger btn--full" data-a="reset">${esc(t('set.reset'))}</button>
    </div>`;
  }

  function auditCard() {
    return `<div class="card" style="padding:6px 16px">
      <button class="row" style="width:100%;text-align:left" data-a="audit">
        <span class="iconbtn iconbtn--plain" style="color:var(--gold)">${UI.icon('book')}</span>
        <span class="row__body"><span class="row__t">${esc(t('set.audit'))}</span></span>
        <span style="color:var(--text-3)">${UI.icon('chevR')}</span>
      </button>
    </div>`;
  }

  function aboutCard() {
    return `<div class="card">
      <div class="card__head"><div class="card__title">${esc(t('set.about'))}</div></div>
      <div class="row">
        <span class="row__body"><span class="row__t">${esc(t('set.version'))}</span></span>
        <span class="row__end num" style="color:var(--text-2)">${VERSION}</span>
      </div>
      <div class="row">
        <span class="iconbtn iconbtn--plain" style="color:var(--gold)">${UI.icon('download')}</span>
        <span class="row__body"><span class="row__t">${esc(t('set.installHint'))}</span></span>
      </div>
      <div class="center mt4" style="gap:2px;padding-bottom:6px">
        ${UI.logoMark(44)}
        <div class="logo__name" style="margin-top:8px">BarTally</div>
        <div class="logo__sub">${esc(t('app.tagline'))}</div>
      </div>
    </div>`;
  }

  /* ---------- delegated handlers ---------- */

  async function onClick(e) {
    const b = e.target.closest('[data-a]');
    if (!b) return;
    const a = b.dataset.a;
    const s = S();
    if (a === 'back') { UI.haptic('light'); UI.go('more'); return; }
    if (a === 'lang') {
      const v = b.dataset.v;
      if (v !== s.lang) { Store.setSettings({ lang: v }); UI.refresh(); saved(); }
      return;
    }
    if (a === 'logo-pick') {
      const uri = await UI.pickImage();
      if (uri) { Store.setSettings({ logo: uri }); saved(); }
      return;
    }
    if (a === 'logo-rm') { Store.setSettings({ logo: null }); saved(); return; }
    if (a === 'team-add') { addMemberSheet(); return; }
    if (a === 'emp-pin') { staffPinSheet(b.dataset.id); return; }
    if (a === 'emp-act') {
      const emp = Store.state.employees.find(x => x.id === b.dataset.id);
      if (!emp) return;
      if (emp.active) {
        if (await UI.confirm(t('set.teamDeactivateWarn', { name: emp.name }), { danger: true, title: t('set.teamDeactivate'), yes: t('set.teamDeactivate') })) {
          Store.setEmployeeActive(emp.id, false); UI.haptic('warn'); saved();
        }
      } else if (await UI.confirm(t('set.teamReactivateWarn', { name: emp.name }), { title: t('set.teamReactivate'), yes: t('set.teamReactivate') })) {
        Store.setEmployeeActive(emp.id, true); UI.haptic('success'); saved();
      }
      return;
    }
    if (a === 'requirePin') { UI.haptic('light'); Store.setSettings({ requireStaffPin: !s.requireStaffPin }); saved(); return; }
    if (a === 'owner-pin') { ownerPinSheet(); return; }
    if (a === 'var-' || a === 'var+') {
      const v = Math.min(10, Math.max(1, (s.varThreshold || 2) + (a === 'var+' ? 1 : -1)));
      if (v !== s.varThreshold) { UI.haptic('light'); Store.setSettings({ varThreshold: v }); }
      return;
    }
    if (a === 'notif') { toggleNotifs(); return; }
    if (a === 'costs') {
      costsOpen = !costsOpen;
      if (!costsOpen) costFocusId = null;
      UI.haptic('light'); UI.refresh();
      return;
    }
    if (a === 'backup') {
      UI.haptic('success');
      UI.download('bartally-backup-' + Store.todayBd() + '.json', Store.exportJSON(), 'application/json');
      return;
    }
    if (a === 'restore') { restoreFlow(); return; }
    if (a === 'demo-clear') {
      if (await UI.confirm(t('set.demoClearWarn'), { danger: true, title: t('set.demoClear'), yes: t('set.demoClear') })) Store.resetAll();
      return;
    }
    if (a === 'reset') {
      if (await UI.confirm(t('set.resetWarn'), { danger: true, title: t('set.reset'), yes: t('set.reset') })) Store.resetAll();
      return;
    }
    if (a === 'audit') { auditSheet(); return; }
  }

  function onChange(e) {
    const tgt = e.target;
    const s = S();
    if (tgt.dataset.r === 'barname') {
      const v = tgt.value.trim();
      if (v && v !== s.barName) { Store.setSettings({ barName: v }); saved(); }
      else if (!v) tgt.value = s.barName;
      return;
    }
    if (tgt.dataset.r === 'cutoff') {
      const v = +tgt.value;
      if (v !== s.cutoffHour) { Store.setSettings({ cutoffHour: v }); saved(); }
      return;
    }
    if (tgt.dataset.r === 'cur') {
      const v = tgt.value.trim().toUpperCase();
      if (v.length < 3 || v.length > 5) { tgt.value = s.currency; UI.toast(t('set.curLen'), { type: 'danger' }); }
      else if (v !== s.currency) { Store.setSettings({ currency: v }); saved(); }
      return;
    }
    if (tgt.dataset.cost) {
      const it = Store.item(tgt.dataset.cost);
      if (!it) return;
      const raw = tgt.value.trim().replace(',', '.');
      let cost = raw === '' ? null : Number(raw);
      if (cost != null && (!isFinite(cost) || cost < 0)) { tgt.value = it.cost ?? ''; return; }
      if (cost != null) cost = Math.round(cost * 100) / 100;
      if (cost !== (it.cost ?? null)) { Store.saveItem({ id: it.id, cost }); saved(); }
    }
  }

  /* ---------- screen ---------- */

  UI.registerScreen({
    id: 'settings',
    render(el) {
      if (!Store.isOwner) {
        el.innerHTML = `<div class="empty grow">${UI.icon('lock')}<div class="empty__t">${esc(t('login.locked'))}</div></div>`;
        return;
      }
      const s = S();
      el.innerHTML = `
        <header class="apphead">
          <button class="iconbtn" data-a="back" aria-label="${esc(t('g.back'))}">${UI.icon('chevL')}</button>
          <div class="apphead__titles"><h1 class="apphead__title">${esc(t('set.title'))}</h1>
            ${s.barName ? `<div class="apphead__sub">${esc(s.barName)}</div>` : ''}</div>
        </header>
        ${barCard(s)}
        ${teamCard(s)}
        ${ownerPinCard()}
        ${alertsCard(s)}
        ${costsCard(s)}
        ${dataCard(s)}
        ${auditCard()}
        ${aboutCard()}`;
      /* keep focus on the cost input the user is moving to across store-driven re-renders */
      if (costsOpen && costFocusId) {
        const inp = el.querySelector(`[data-cost="${costFocusId}"]`);
        if (inp && document.activeElement !== inp) inp.focus();
      }
      el.addEventListener('click', onClick);
      el.addEventListener('change', onChange);
      el.addEventListener('focusin', e => { costFocusId = (e.target.dataset && e.target.dataset.cost) || null; });
    },
  });
})();
