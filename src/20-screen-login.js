/* ============ BarTally screens: 'welcome' (first-run + setup wizard) & 'login' (daily unlock) ============ */
(() => {
  'use strict';

  /* ---------- i18n additions ---------- */
  I18N.extend({
    fr: {
      'wiz.heroIntro': 'Le stock compté chaque soir, les ventes suivies en direct, les écarts repérés avant qu’ils ne coûtent cher.',
      'wiz.stepOf': 'Étape {n} sur {total}',
      'wiz.demoLoading': 'Préparation de la démonstration…',
      'wiz.ready': 'Tout est prêt',
      'wiz.readySub': 'Un dernier coup d’œil et c’est parti.',
      'wiz.sumTeam_one': '{n} membre d’équipe',
      'wiz.sumTeam_many': '{n} membres d’équipe',
      'wiz.sumStock_one': '{n} article renseigné',
      'wiz.sumStock_many': '{n} articles renseignés',
      'wiz.teamEmpty': 'Encore personne — ajoutez un prénom ci-dessous, ou passez cette étape.',
      'login.forgotBackup': 'Télécharger une sauvegarde d’abord',
      'login.forgotType': 'Tapez le nom du bar pour confirmer',
    },
    en: {
      'wiz.heroIntro': 'Stock counted every night, sales tracked live, discrepancies caught before they get expensive.',
      'wiz.stepOf': 'Step {n} of {total}',
      'wiz.demoLoading': 'Setting up the demo…',
      'wiz.ready': 'All set',
      'wiz.readySub': 'One last look and you’re off.',
      'wiz.sumTeam_one': '{n} team member',
      'wiz.sumTeam_many': '{n} team members',
      'wiz.sumStock_one': '{n} item filled in',
      'wiz.sumStock_many': '{n} items filled in',
      'wiz.teamEmpty': 'No one yet — add a first name below, or skip this step.',
      'login.forgotBackup': 'Download a backup first',
      'login.forgotType': 'Type the bar name to confirm',
    },
  });

  /* ---------- scoped styles ---------- */
  document.head.appendChild(UI.el(`<style>
/* ===== welcome ===== */
[data-screen=welcome] .wz-hero{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:var(--s3);padding:var(--s8) var(--s2)}
[data-screen=welcome] .wz-hero>*{animation:blw-up .55s cubic-bezier(.2,.8,.25,1) both}
[data-screen=welcome] .wz-hero>*:nth-child(1){animation-delay:.03s}
[data-screen=welcome] .wz-hero>*:nth-child(2){animation-delay:.1s}
[data-screen=welcome] .wz-hero>*:nth-child(3){animation-delay:.17s}
[data-screen=welcome] .wz-hero>*:nth-child(4){animation-delay:.24s}
[data-screen=welcome] .wz-hero>*:nth-child(5){animation-delay:.34s}
[data-screen=welcome] .wz-logo{filter:drop-shadow(0 10px 34px rgba(201,154,75,.28))}
[data-screen=welcome] .wz-logo .logo__mark{width:72px;height:72px}
[data-screen=welcome] .wz-name{font-size:38px;letter-spacing:-.02em;background:var(--gold-grad);-webkit-background-clip:text;background-clip:text;color:transparent}
[data-screen=welcome] .wz-intro{color:var(--text-2);font-size:14.5px;line-height:1.55;max-width:310px;margin-top:var(--s1)}
[data-screen=welcome] .wz-cta{width:100%;max-width:340px;display:flex;flex-direction:column;gap:var(--s3);margin-top:var(--s6)}
[data-screen=welcome] .wz-demohint{line-height:1.5;max-width:300px;margin:0 auto}
[data-screen=welcome] .wz-top{display:flex;align-items:center;gap:var(--s3);margin-bottom:var(--s5)}
[data-screen=welcome] .wz-mid{flex:1;display:flex;flex-direction:column;align-items:center;gap:5px}
[data-screen=welcome] .wz-dots{display:flex;gap:7px}
[data-screen=welcome] .wz-dots i{width:8px;height:8px;border-radius:4px;background:var(--surface-3);transition:all .3s cubic-bezier(.2,.8,.3,1)}
[data-screen=welcome] .wz-dots i.on{width:22px;background:var(--gold-grad);box-shadow:var(--glow-gold)}
[data-screen=welcome] .wz-dots i.done{background:rgba(201,154,75,.5)}
[data-screen=welcome] .wz-spacer{width:48px;flex:none}
[data-screen=welcome] .wz-body{flex:1;display:flex;flex-direction:column;animation:blw-up .3s cubic-bezier(.2,.8,.25,1) both}
[data-screen=welcome] .wz-body h2{font-size:22px;margin-bottom:6px}
[data-screen=welcome] .wz-sub{color:var(--text-2);font-size:13.5px;line-height:1.5;margin-bottom:var(--s5)}
[data-screen=welcome] .wz-next{margin-top:auto;padding-top:var(--s6)}
[data-screen=welcome] .wz-pin{width:100%;max-width:320px;margin:0 auto;display:flex;flex-direction:column}
[data-screen=welcome] .wz-pin h2{text-align:center;font-size:19px;margin:var(--s4) 0 var(--s2)}
[data-screen=welcome] .wz-addrow{display:flex;gap:var(--s2);margin-top:var(--s3)}
[data-screen=welcome] .wz-addrow input{flex:1;min-width:0;min-height:48px;padding:0 14px;border-radius:12px;border:1px solid var(--hairline);background:var(--surface-2);font-size:15px}
[data-screen=welcome] .wz-addrow input:focus{border-color:rgba(201,154,75,.5)}
[data-screen=welcome] .wz-addrow .btn{min-width:56px;padding:0;flex:none}
[data-screen=welcome] .wz-cathead{display:flex;align-items:center;gap:8px;margin:var(--s5) 0 var(--s1)}
[data-screen=welcome] .wz-cathead i{width:8px;height:8px;border-radius:50%;flex:none}
[data-screen=welcome] .wz-qty{width:86px;min-height:48px;text-align:center;border-radius:12px;border:1px solid var(--hairline);background:var(--surface-2);font-size:17px;font-weight:600;flex:none;transition:border-color .15s}
[data-screen=welcome] .wz-qty:focus{border-color:rgba(201,154,75,.55);background:var(--surface-3)}
[data-screen=welcome] .wz-qty::placeholder{color:var(--text-3);font-weight:500}
[data-screen=welcome] .wz-done{flex:1;display:flex;flex-direction:column;padding-top:var(--s6)}
[data-screen=welcome] .wz-check{width:76px;height:76px;border-radius:50%;background:var(--gold-soft);color:var(--gold-hi);display:flex;align-items:center;justify-content:center;margin:0 auto var(--s4);box-shadow:var(--glow-gold);animation:blw-pop .55s cubic-bezier(.2,.9,.3,1.35) both}
[data-screen=welcome] .wz-check svg{width:36px;height:36px}
[data-screen=welcome] .wz-done h2,[data-screen=welcome] .wz-done .wz-sub{text-align:center}
[data-screen=welcome] .wz-sumrow{display:flex;align-items:center;justify-content:space-between;gap:var(--s3);min-height:44px;border-bottom:1px solid var(--hairline);font-size:14px}
[data-screen=welcome] .wz-sumrow:last-child{border-bottom:0}
[data-screen=welcome] .wz-sumrow span{color:var(--text-3)}
[data-screen=welcome] .wz-sumrow b{font-weight:600;text-align:right}
/* shared bits (scoped to both screens) */
[data-screen=welcome] .bt-ava,[data-screen=login] .bt-ava{width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-family:var(--f-display);font-weight:700;font-size:15px;color:#0E0E13;flex:none}
[data-screen=welcome] .bt-perr,[data-screen=login] .bt-perr{min-height:20px;margin-top:2px;text-align:center;color:var(--danger);font-size:13px;font-weight:600;opacity:0;transition:opacity .18s}
[data-screen=welcome] .bt-perr.is-err,[data-screen=login] .bt-perr.is-err{opacity:1}
[data-screen=welcome] .bt-spin,[data-screen=login] .bt-spin{width:18px;height:18px;flex:none;border-radius:50%;border:2.5px solid rgba(128,128,128,.35);border-top-color:currentColor;animation:blw-rot .7s linear infinite}
/* ===== login ===== */
[data-screen=login] .lg-head{display:flex;flex-direction:column;align-items:center;gap:var(--s2);padding:var(--s10) 0 var(--s8);text-align:center}
[data-screen=login] .lg-head .logo__mark{width:56px;height:56px;filter:drop-shadow(0 8px 28px rgba(201,154,75,.25));animation:blw-pop .5s cubic-bezier(.2,.9,.3,1.3) both}
[data-screen=login] .lg-bar{font-size:26px;letter-spacing:-.01em;animation:blw-up .5s .08s cubic-bezier(.2,.8,.25,1) both}
[data-screen=login] .lg-sub{color:var(--text-3);font-size:13.5px;animation:blw-up .5s .15s cubic-bezier(.2,.8,.25,1) both}
[data-screen=login] .lg-grid{display:grid;grid-template-columns:1fr 1fr;gap:var(--s3)}
[data-screen=login] .lg-user{display:flex;flex-direction:column;align-items:center;gap:10px;min-height:112px;padding:var(--s5) var(--s3);border-radius:var(--r-card);background:linear-gradient(180deg,rgba(255,255,255,.03),rgba(255,255,255,0) 45%),var(--glass);backdrop-filter:blur(14px) saturate(1.3);-webkit-backdrop-filter:blur(14px) saturate(1.3);border:1px solid var(--hairline);box-shadow:var(--shadow-1);transition:transform .12s,border-color .18s;animation:blw-up .45s cubic-bezier(.2,.8,.25,1) both;animation-delay:calc(.18s + var(--i,0)*55ms)}
[data-screen=login] .lg-user:active{transform:scale(.96)}
[data-screen=login] .lg-user--owner{grid-column:1/-1;flex-direction:row;justify-content:flex-start;gap:var(--s4);min-height:84px;padding:var(--s4) var(--s5);background:linear-gradient(160deg,rgba(201,154,75,.15),rgba(201,154,75,.02) 60%),var(--glass);border-color:rgba(201,154,75,.32)}
[data-screen=login] .lg-owner-body{flex:1;min-width:0;text-align:left}
[data-screen=login] .lg-name{font-weight:600;font-size:14.5px;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
[data-screen=login] .lg-user--owner .lg-name{font-size:16px}
[data-screen=login] .bt-ava--big{width:54px;height:54px;font-size:19px}
[data-screen=login] .bt-ava--gold{background:var(--gold-grad);color:var(--on-gold);box-shadow:var(--glow-gold)}
[data-screen=login] .bt-ava--gold svg{width:24px;height:24px}
[data-screen=login] .lg-topbar{display:flex;margin-bottom:var(--s2)}
[data-screen=login] .lg-pinwrap{width:100%;max-width:320px;margin:0 auto;display:flex;flex-direction:column;animation:blw-up .3s cubic-bezier(.2,.8,.25,1) both}
[data-screen=login] .lg-pinhead{display:flex;flex-direction:column;align-items:center;gap:8px;margin-bottom:var(--s2);text-align:center}
[data-screen=login] .lg-pin-name{font-family:var(--f-display);font-weight:700;font-size:18px}
[data-screen=login] .lg-pin-title{color:var(--text-3);font-size:13px}
@keyframes blw-up{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
@keyframes blw-pop{from{opacity:0;transform:scale(.55)}to{opacity:1;transform:none}}
@keyframes blw-rot{to{transform:rotate(360deg)}}
</style>`));

  /* ---------- helpers ---------- */
  const esc = UI.esc;
  const AVA_COLORS = ['#D05672', '#3987E5', '#9085E9', '#6FBF8E', '#C97A45', '#B8A94A', '#F49BB5', '#4AA8A0'];
  const avaColor = name => AVA_COLORS[[...String(name || '?')].reduce((a, c) => a + c.charCodeAt(0), 0) % AVA_COLORS.length];
  const initials = name => (String(name || '').trim().split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase()) || '?';
  const dotsHtml = (n, filled) => `<div class="pinDots" data-dots>${Array.from({ length: n }, (_, i) => `<i class="${i < filled ? 'on' : ''}"></i>`).join('')}</div>`;

  /* ================================================================
     WELCOME — hero + in-screen 5-step setup wizard
     (module-level state survives store-driven re-renders) */
  const TOTAL = 5;
  const W = {};
  function resetW() {
    Object.assign(W, {
      step: 0, barName: '', ownerName: '',
      pinPhase: 'set', pin1: '', pinEntry: '', pinErr: '', pin: '',
      empName: '', employees: [], items: null, opening: {}, busy: false,
    });
  }
  resetW();

  function collectOpening() {
    const out = {};
    for (const it of (W.items || [])) {
      const raw = String(W.opening[it.id] ?? '').trim();
      if (!raw) continue; // untouched field = item not served → absent from map
      let v = parseFloat(raw.replace(',', '.'));
      if (!isFinite(v) || v < 0) v = 0;
      out[it.id] = it.allowDecimal ? Math.round(v * 100) / 100 : Math.round(v);
    }
    return out;
  }

  /* FR/EN switch, visible before login so anyone can flip the language */
  function langToggle() {
    return `<div class="lang-tgl" role="group" aria-label="Langue / Language">
      <button type="button" data-lang="fr" class="${I18N.lang === 'fr' ? 'is-on' : ''}">FR</button>
      <button type="button" data-lang="en" class="${I18N.lang === 'en' ? 'is-on' : ''}">EN</button>
    </div>`;
  }
  document.addEventListener('click', e => {
    const b = e.target.closest('.lang-tgl [data-lang]');
    if (!b) return;
    UI.haptic('light');
    Store.setSettings({ lang: b.dataset.lang });
    UI.refresh();
  });

  function paintWelcome(el) {
    el.innerHTML = '';
    el.insertAdjacentHTML('afterbegin', langToggle());
    const view = UI.el('<div class="grow" style="display:flex;flex-direction:column"></div>');
    el.appendChild(view);
    if (W.step === 0) paintHero(view, el);
    else paintStep(view, el);
  }

  /* ---- hero (first launch) ---- */
  function paintHero(view, el) {
    view.innerHTML = `
      <div class="wz-hero">
        <div class="wz-logo">${UI.logoMark(72)}</div>
        <h1 class="wz-name">BarTally</h1>
        <div class="eyebrow">${esc(t('app.tagline'))}</div>
        <p class="wz-intro">${esc(t('wiz.heroIntro'))}</p>
        <div class="wz-cta">
          <button class="btn btn--gold btn--big btn--full" data-a="start">${esc(t('wiz.startReal'))}</button>
          <button class="btn btn--ghost btn--full" data-a="demo">${esc(t('wiz.demo'))}</button>
          <p class="tt wz-demohint">${esc(t('wiz.demoHint'))}</p>
        </div>
      </div>`;
    view.addEventListener('click', async e => {
      const b = e.target.closest('[data-a]');
      if (!b) return;
      if (b.dataset.a === 'start') { UI.haptic('light'); W.step = 1; paintWelcome(el); return; }
      if (b.dataset.a === 'demo') {
        if (W.busy) return;
        W.busy = true;
        b.disabled = true;
        b.innerHTML = `<span class="bt-spin"></span>${esc(t('wiz.demoLoading'))}`;
        try {
          await Store.setupDemo(); // emits 'all' → App.route() takes over
          UI.haptic('success');
          resetW();
        } catch (err) {
          W.busy = false;
          UI.toast(t('g.error'), { type: 'danger' });
          paintWelcome(el);
        }
      }
    });
  }

  /* ---- wizard chrome ---- */
  function wizTop() {
    return `<div class="wz-top">
      <button class="iconbtn" data-a="back" aria-label="${esc(t('g.back'))}">${UI.icon('chevL')}</button>
      <div class="wz-mid">
        <div class="wz-dots" aria-hidden="true">${Array.from({ length: TOTAL }, (_, i) =>
          `<i class="${i + 1 === W.step ? 'on' : i + 1 < W.step ? 'done' : ''}"></i>`).join('')}</div>
        <div class="tt wz-stepof">${esc(t('wiz.stepOf', { n: W.step, total: TOTAL }))}</div>
      </div>
      <span class="wz-spacer"></span>
    </div>`;
  }

  function paintStep(view, el) {
    let body = '';
    if (W.step === 1) {
      body = `
        <h2>${esc(t('wiz.welcome'))}</h2>
        <p class="wz-sub">${esc(t('wiz.intro'))}</p>
        <div class="field"><label for="wz-bar">${esc(t('wiz.barName'))}</label>
          <input id="wz-bar" type="text" data-f="barName" autocomplete="off" enterkeyhint="next" placeholder="${esc(t('wiz.barNamePh'))}" value="${esc(W.barName)}"></div>
        <div class="field"><label for="wz-owner">${esc(t('wiz.ownerName'))}</label>
          <input id="wz-owner" type="text" data-f="ownerName" autocomplete="off" enterkeyhint="next" value="${esc(W.ownerName)}"></div>
        <div class="wz-next"><button class="btn btn--gold btn--big btn--full" data-a="next" ${W.barName.trim() ? '' : 'disabled'}>${esc(t('g.next'))}</button></div>`;
    } else if (W.step === 2) {
      body = `
        <div class="wz-pin">
          <h2>${esc(t(W.pinPhase === 'set' ? 'wiz.ownerPinSet' : 'wiz.ownerPinConfirm'))}</h2>
          ${dotsHtml(4, W.pinEntry.length)}
          <div class="bt-perr${W.pinErr ? ' is-err' : ''}" data-err aria-live="polite">${esc(W.pinErr)}</div>
          <div data-np></div>
        </div>`;
    } else if (W.step === 3) {
      const list = W.employees.length
        ? W.employees.map((n, i) => `
            <div class="row">
              <span class="bt-ava" style="background:${avaColor(n)}">${esc(initials(n))}</span>
              <span class="row__body"><span class="row__t">${esc(n)}</span></span>
              <button class="iconbtn" data-rm="${i}" aria-label="${esc(t('g.delete'))}">${UI.icon('x')}</button>
            </div>`).join('')
        : `<div class="empty" style="padding:var(--s6) var(--s4)">${UI.icon('users')}<div class="empty__s">${esc(t('wiz.teamEmpty'))}</div></div>`;
      body = `
        <h2>${esc(t('wiz.staff'))}</h2>
        <p class="wz-sub">${esc(t('wiz.staffHint'))}</p>
        <div class="card" style="padding:6px 16px">${list}</div>
        <div class="wz-addrow">
          <input type="text" data-f="empName" autocomplete="off" enterkeyhint="done" placeholder="${esc(t('wiz.staffNamePh'))}" value="${esc(W.empName)}">
          <button class="btn btn--ghost" data-a="addEmp" aria-label="${esc(t('wiz.staffAdd'))}">${UI.icon('plus')}</button>
        </div>
        <div class="wz-next"><button class="btn btn--gold btn--big btn--full" data-a="next">${esc(t('g.next'))}</button></div>`;
    } else if (W.step === 4) {
      W.items = W.items || Store.SEED.build();
      const cats = [...Store.SEED.categories].sort((a, b) => a.sort - b.sort);
      const groups = cats.map(c => {
        const its = W.items.filter(i => i.catId === c.id);
        if (!its.length) return '';
        return `
          <div class="wz-cathead"><i style="background:${c.hex}"></i><span class="eyebrow">${esc(I18N.lang === 'en' ? c.nameEn : c.nameFr)}</span></div>
          ${its.map(it => `
            <div class="row">
              <div class="row__art">${UI.art(it)}</div>
              <div class="row__body"><div class="row__t">${esc(it.name)}</div><div class="row__s">${esc(t('u.' + it.unit))}</div></div>
              <input class="wz-qty num" type="text" inputmode="${it.allowDecimal ? 'decimal' : 'numeric'}" placeholder="0" data-item="${it.id}" value="${esc(W.opening[it.id] ?? '')}" aria-label="${esc(it.name)}">
            </div>`).join('')}`;
      }).join('');
      body = `
        <h2>${esc(t('wiz.stock'))}</h2>
        <p class="wz-sub">${esc(t('wiz.stockHint'))}</p>
        ${groups}
        <div class="wz-next"><button class="btn btn--gold btn--big btn--full" data-a="next">${esc(t('g.next'))}</button></div>`;
    } else {
      W.items = W.items || Store.SEED.build();
      const opening = collectOpening();
      const filled = W.items.filter(it => opening[it.id] > 0).length;
      const rows = [
        [t('wiz.barName'), W.barName.trim()],
        [t('wiz.ownerName'), W.ownerName.trim() || t('g.owner')],
        [t('wiz.staff'), I18N.plural('wiz.sumTeam', W.employees.length)],
        [t('wiz.stock'), I18N.plural('wiz.sumStock', filled)],
      ];
      body = `
        <div class="wz-done">
          <div class="wz-check">${UI.icon('check')}</div>
          <h2>${esc(t('wiz.ready'))}</h2>
          <p class="wz-sub">${esc(t('wiz.readySub'))}</p>
          <div class="card">${rows.map(([l, v]) => `<div class="wz-sumrow"><span>${esc(l)}</span><b>${esc(v)}</b></div>`).join('')}</div>
          <div class="wz-next"><button class="btn btn--gold btn--big btn--full" data-a="finish">${esc(t('wiz.finish'))}</button></div>
        </div>`;
    }

    view.innerHTML = wizTop() + `<div class="wz-body" data-step="${W.step}">${body}</div>`;
    if (W.step === 2) UI.numpad(view.querySelector('[data-np]'), { decimal: false, onKey: k => onWizPin(k, view, el) });

    view.addEventListener('click', e => {
      const rm = e.target.closest('[data-rm]');
      if (rm) { W.employees.splice(+rm.dataset.rm, 1); UI.haptic('light'); paintWelcome(el); return; }
      const b = e.target.closest('[data-a]');
      if (!b) return;
      const a = b.dataset.a;
      if (a === 'back') wizBack(el);
      else if (a === 'next') wizNext(el);
      else if (a === 'addEmp') addEmp(view, el);
      else if (a === 'finish') finishSetup(b, el);
    });
    view.addEventListener('input', e => {
      const f = e.target.dataset.f;
      if (f) {
        W[f] = e.target.value;
        if (f === 'barName') { const nb = view.querySelector('[data-a=next]'); if (nb) nb.disabled = !W.barName.trim(); }
      }
      const id = e.target.dataset.item;
      if (id) {
        const itm = (W.items || []).find(i => i.id === id);
        const clean = e.target.value.replace(itm && !itm.allowDecimal ? /[^\d]/g : /[^\d.,]/g, '');
        if (clean !== e.target.value) e.target.value = clean;
        W.opening[id] = clean;
      }
    });
    view.addEventListener('keydown', e => {
      if (e.key !== 'Enter') return;
      const f = e.target.dataset.f;
      if ((f === 'barName' || f === 'ownerName') && W.barName.trim()) wizNext(el);
      else if (f === 'empName') addEmp(view, el);
      else if (e.target.dataset.item) e.target.blur();
    });
  }

  function wizNext(el) {
    UI.haptic('light');
    if (W.step === 1) {
      if (!W.barName.trim()) return;
      W.step = 2; W.pinPhase = 'set'; W.pin1 = ''; W.pinEntry = ''; W.pinErr = '';
    } else if (W.step === 3) W.step = 4;
    else if (W.step === 4) W.step = 5;
    paintWelcome(el);
  }

  function wizBack(el) {
    UI.haptic('light');
    if (W.step === 2) {
      if (W.pinPhase === 'confirm') W.pinPhase = 'set';
      else W.step = 1;
      W.pin1 = ''; W.pinEntry = ''; W.pinErr = '';
    } else if (W.step > 0) {
      W.step -= 1;
      if (W.step === 2) { W.pinPhase = 'set'; W.pin1 = ''; W.pinEntry = ''; W.pinErr = ''; }
    }
    paintWelcome(el);
  }

  function onWizPin(k, view, el) {
    if (W.busy) return;
    if (k === 'del') W.pinEntry = W.pinEntry.slice(0, -1);
    else if (/^\d$/.test(k) && W.pinEntry.length < 4) W.pinEntry += k;
    else return;
    if (W.pinErr) {
      W.pinErr = '';
      const er = view.querySelector('[data-err]');
      if (er) { er.classList.remove('is-err'); er.textContent = ''; }
    }
    const dots = view.querySelector('[data-dots]');
    if (dots) dots.querySelectorAll('i').forEach((d, i) => d.classList.toggle('on', i < W.pinEntry.length));
    if (W.pinEntry.length < 4) return;
    W.busy = true;
    setTimeout(() => {
      if (W.pinPhase === 'set') {
        W.busy = false;
        W.pin1 = W.pinEntry; W.pinPhase = 'confirm'; W.pinEntry = '';
        paintWelcome(el);
      } else if (W.pinEntry === W.pin1) {
        W.busy = false;
        W.pin = W.pinEntry;
        UI.haptic('success');
        W.step = 3;
        paintWelcome(el);
      } else {
        UI.haptic('warn');
        W.pinErr = t('wiz.pinMismatch');
        if (dots && dots.isConnected) {
          dots.classList.add('shake');
          const er = view.querySelector('[data-err]');
          if (er) { er.textContent = W.pinErr; er.classList.add('is-err'); }
        }
        setTimeout(() => {
          W.busy = false;
          W.pinPhase = 'set'; W.pin1 = ''; W.pinEntry = '';
          paintWelcome(el);
        }, 650);
      }
    }, 160);
  }

  function addEmp(view, el) {
    const inp = view.querySelector('[data-f=empName]');
    const name = (inp ? inp.value : W.empName).trim();
    if (!name) { if (inp) inp.focus(); return; }
    W.employees.push(name);
    W.empName = '';
    UI.haptic('light');
    paintWelcome(el);
    const ninp = el.querySelector('[data-f=empName]');
    if (ninp) ninp.focus();
  }

  async function finishSetup(btn, el) {
    if (W.busy) return;
    if (!W.pin || W.pin.length !== 4) { // safety net: PIN somehow missing → back to PIN step
      W.step = 2; W.pinPhase = 'set'; W.pin1 = ''; W.pinEntry = ''; W.pinErr = '';
      paintWelcome(el);
      return;
    }
    W.busy = true;
    btn.disabled = true;
    btn.innerHTML = `<span class="bt-spin"></span>${esc(t('g.loading'))}`;
    try {
      W.items = W.items || Store.SEED.build();
      await Store.setupReal({
        barName: W.barName.trim(),
        ownerName: W.ownerName.trim(),
        pin: W.pin,
        employees: W.employees.map(n => n.trim()).filter(Boolean),
        opening: collectOpening(),
      }); // emits 'all' → App.route() takes over
      UI.haptic('success');
      UI.toast(t('wiz.openingSaved'), { type: 'ok' });
      resetW();
    } catch (err) {
      W.busy = false;
      UI.toast(t('g.error'), { type: 'danger' });
      paintWelcome(el);
    }
  }

  UI.registerScreen({ id: 'welcome', bare: true, render(el) { paintWelcome(el); } });

  /* ================================================================
     LOGIN — daily unlock: user grid → PIN pad */
  const L = { view: 'grid', target: null, pin: '', busy: false };
  function resetL() { L.view = 'grid'; L.target = null; L.pin = ''; L.busy = false; }

  function paintLogin(el) {
    el.innerHTML = '';
    el.insertAdjacentHTML('afterbegin', langToggle());
    if (L.view === 'pin' && L.target && L.target.type === 'emp') {
      const emp = Store.state.employees.find(x => x.id === L.target.id && x.active);
      if (!emp) resetL(); // employee deactivated meanwhile → back to grid
    }
    const view = UI.el('<div class="grow" style="display:flex;flex-direction:column"></div>');
    el.appendChild(view);
    if (L.view === 'grid') paintUserGrid(view, el);
    else paintPinPad(view, el);
  }

  function paintUserGrid(view, el) {
    const s = Store.state.settings;
    const emps = Store.state.employees.filter(e => e.active);
    const ownerName = s.ownerName || t('g.owner');
    view.innerHTML = `
      <header class="lg-head">
        ${UI.logoMark(56)}
        <h1 class="lg-bar">${esc(s.barName || 'BarTally')}</h1>
        <div class="lg-sub">${esc(t('login.title'))}</div>
      </header>
      <div class="lg-grid">
        <button class="lg-user lg-user--owner" data-owner style="--i:0">
          <span class="bt-ava bt-ava--gold bt-ava--big">${UI.icon('user')}</span>
          <span class="lg-owner-body"><span class="lg-name">${esc(ownerName)}</span></span>
          <span class="pill pill--gold">${esc(t('g.owner'))}</span>
        </button>
        ${emps.map((e2, i) => `
          <button class="lg-user" data-emp="${esc(e2.id)}" style="--i:${i + 1}">
            <span class="bt-ava bt-ava--big" style="background:${avaColor(e2.name)}">${esc(initials(e2.name))}</span>
            <span class="lg-name">${esc(e2.name)}</span>
          </button>`).join('')}
      </div>`;
    view.addEventListener('click', async e => {
      if (e.target.closest('[data-owner]')) {
        UI.haptic('light');
        L.view = 'pin'; L.target = { type: 'owner', name: Store.state.settings.ownerName || t('g.owner') }; L.pin = ''; L.busy = false;
        paintLogin(el);
        return;
      }
      const eb = e.target.closest('[data-emp]');
      if (!eb) return;
      const emp = Store.state.employees.find(x => x.id === eb.dataset.emp && x.active);
      if (!emp) return;
      UI.haptic('light');
      if (Store.state.settings.requireStaffPin && emp.pinHash) {
        L.view = 'pin'; L.target = { type: 'emp', id: emp.id, name: emp.name }; L.pin = ''; L.busy = false;
        paintLogin(el);
        return;
      }
      if (Store.state.settings.requireStaffPin && !emp.pinHash) {
        UI.toast(t('login.pinNeeded', { name: emp.name }), { type: 'danger' });
        return;
      }
      if (L.busy) return;
      L.busy = true;
      const ok = await Store.loginEmployee(emp.id); // emits 'session' → App.route()
      if (ok) { UI.haptic('success'); resetL(); }
      else { L.busy = false; UI.toast(t('g.error'), { type: 'danger' }); }
    });
  }

  function paintPinPad(view, el) {
    const isOwner = L.target.type === 'owner';
    const nDots = isOwner ? 4 : Math.min(6, Math.max(4, L.pin.length));
    view.innerHTML = `
      <div class="lg-topbar"><button class="iconbtn" data-a="back" aria-label="${esc(t('g.back'))}">${UI.icon('chevL')}</button></div>
      <div class="lg-pinwrap">
        <div class="lg-pinhead">
          ${isOwner
            ? `<span class="bt-ava bt-ava--gold bt-ava--big">${UI.icon('user')}</span><div class="lg-pin-name">${esc(L.target.name)}</div>`
            : `<span class="bt-ava bt-ava--big" style="background:${avaColor(L.target.name)}">${esc(initials(L.target.name))}</span>`}
          <div class="lg-pin-title">${esc(isOwner ? t('login.ownerPin') : t('login.staffPin', { name: L.target.name }))}</div>
        </div>
        ${dotsHtml(nDots, L.pin.length)}
        <div class="bt-perr" data-err aria-live="polite"></div>
        ${isOwner && Store.state.settings.demoMode ? `<div class="tt" style="text-align:center;margin-bottom:8px;color:var(--gold-hi)">${esc(t('login.demoPin'))}</div>` : ''}
        <div data-np></div>
        ${isOwner ? '' : `<button class="btn btn--gold btn--full mt3" data-a="pinok" ${L.pin.length >= 4 ? '' : 'disabled'}>${esc(t('g.confirm'))}</button>`}
        ${isOwner ? `<button class="btn btn--line btn--full mt3" data-a="forgot" style="border:0;color:var(--text-3);font-size:13px">${esc(t('login.forgot'))}</button>` : ''}
      </div>`;
    UI.numpad(view.querySelector('[data-np]'), { decimal: false, onKey: k => onLoginKey(k, view, el) });
    view.addEventListener('click', async e => {
      const b = e.target.closest('[data-a]');
      if (!b) return;
      if (b.dataset.a === 'back') { UI.haptic('light'); resetL(); paintLogin(el); }
      else if (b.dataset.a === 'pinok') submitPin(view, el);
      else if (b.dataset.a === 'forgot') openForgotSheet();
    });
  }

  /* forgot-PIN: guarded erase sheet — backup offer + type-the-bar-name confirmation */
  function openForgotSheet() {
    const normName = s => String(s || '').normalize('NFD').replace(new RegExp('[\\u0300-\\u036f]', 'g'), '').trim().toLowerCase();
    const c = UI.el(`<div data-screen="login">
      <div class="lg-pin-name" style="text-align:center;margin-bottom:var(--s2)">${esc(t('login.forgot'))}</div>
      <p class="tt" style="line-height:1.5;text-align:center;margin-bottom:var(--s4)">${esc(t('login.forgotHint'))}</p>
      <button class="btn btn--gold btn--full" type="button" data-a="fgdl">${UI.icon('download')}${esc(t('login.forgotBackup'))}</button>
      <div class="field" style="margin-top:var(--s4)"><label for="fg-bar">${esc(t('login.forgotType'))}</label>
        <input id="fg-bar" type="text" data-f="fgbar" autocomplete="off" placeholder="${esc(Store.state.settings.barName || '')}"></div>
      <button class="btn btn--danger btn--full" type="button" data-a="fgerase" disabled>${esc(t('set.reset'))}</button>
    </div>`);
    UI.sheet(c);
    const inp = c.querySelector('[data-f=fgbar]');
    const eraseBtn = c.querySelector('[data-a=fgerase]');
    inp.addEventListener('input', () => {
      eraseBtn.disabled = normName(inp.value) !== normName(Store.state.settings.barName);
    });
    c.addEventListener('click', e => {
      const b = e.target.closest('[data-a]');
      if (!b) return;
      if (b.dataset.a === 'fgdl') {
        UI.haptic('light');
        UI.download('bartally-backup.json', Store.exportJSON(), 'application/json');
      } else if (b.dataset.a === 'fgerase') {
        if (normName(inp.value) !== normName(Store.state.settings.barName)) return;
        UI.haptic('warn');
        Store.resetAll();
      }
    });
  }

  function refreshLoginDots(view) {
    const isOwner = L.target && L.target.type === 'owner';
    const nDots = isOwner ? 4 : Math.min(6, Math.max(4, L.pin.length));
    const dots = view.querySelector('[data-dots]');
    if (dots) dots.outerHTML = dotsHtml(nDots, L.pin.length);
  }

  function onLoginKey(k, view, el) {
    if (L.busy || !L.target) return;
    const isOwner = L.target.type === 'owner';
    const max = isOwner ? 4 : 6;
    if (k === 'del') L.pin = L.pin.slice(0, -1);
    else if (/^\d$/.test(k) && L.pin.length < max) L.pin += k;
    else return;
    const er = view.querySelector('[data-err]');
    if (er && er.classList.contains('is-err')) { er.classList.remove('is-err'); er.textContent = ''; }
    refreshLoginDots(view);
    const okBtn = view.querySelector('[data-a=pinok]');
    if (okBtn) okBtn.disabled = L.pin.length < 4;
    if ((isOwner && L.pin.length === 4) || (!isOwner && L.pin.length === 6)) submitPin(view, el);
  }

  async function submitPin(view, el) {
    if (L.busy || !L.target || L.pin.length < 4) return;
    L.busy = true;
    const okBtn = view.querySelector('[data-a=pinok]');
    if (okBtn) okBtn.disabled = true;
    let ok = false;
    try {
      ok = L.target.type === 'owner'
        ? await Store.loginOwner(L.pin)
        : await Store.loginEmployee(L.target.id, L.pin);
    } catch (e) { ok = false; }
    if (ok) { UI.haptic('success'); resetL(); return; } // 'session' event routes to the app
    L.busy = false;
    UI.haptic('warn');
    if (!view.isConnected) return;
    const dots = view.querySelector('[data-dots]');
    if (dots) dots.classList.add('shake');
    const er = view.querySelector('[data-err]');
    if (er) { er.textContent = t('login.pinWrong'); er.classList.add('is-err'); }
    setTimeout(() => {
      L.pin = '';
      if (!view.isConnected) return;
      refreshLoginDots(view);
      const ob = view.querySelector('[data-a=pinok]');
      if (ob) ob.disabled = true;
    }, 520);
  }

  UI.registerScreen({ id: 'login', bare: true, render(el) { paintLogin(el); } });
})();
