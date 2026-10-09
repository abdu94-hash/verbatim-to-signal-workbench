/* Verbatim to Signal Workbench — shared core
   Modules call WB.register({...}) and use the helpers below. No external dependencies. */
(function () {
  'use strict';
  const WB = (window.WB = window.WB || {});
  WB.modules = [];
  WB.groups = [
    { id: 'coding', title: 'Coding trainer', blurb: 'Practice turning reporters’ words into terms, and reviewing that coding.' },
    { id: 'retrieval', title: 'Retrieval lab', blurb: 'Choose a retrieval level, run it on synthetic data, and count and score what it returns.' },
    { id: 'surveillance', title: 'Surveillance calculators', blurb: 'Rates, disproportionality, liver criteria, version effects and calibrated wording.' },
    { id: 'worksheets', title: 'Fillable worksheets', blurb: 'The book’s six worksheets and the report completeness checklist, as forms that save in your browser and export to Word.' },
  ];

  /* ---------------- registry and router ---------------- */
  WB.register = function (m) {
    // m: {id, group, title, summary, chapters:[n], render(container)}
    WB.modules.push(m);
  };
  WB.find = (id) => WB.modules.find((m) => m.id === id);

  function route() {
    const id = (location.hash || '#/').replace(/^#\/?/, '').split('?')[0];
    const main = document.getElementById('main');
    main.innerHTML = '';
    document.querySelectorAll('.nav a').forEach((a) => a.classList.toggle('active', a.dataset.id === id));
    if (!id) return renderHome(main);
    const m = WB.find(id);
    if (!m) { main.appendChild(h('p', {}, 'Tool not found. ')); return; }
    document.title = m.title + ' — Verbatim to Signal Workbench';
    const head = h('header', { class: 'tool-head' }, [
      h('div', { class: 'crumb' }, [WB.groups.find((g) => g.id === m.group).title]),
      h('h1', {}, m.title),
      m.summary ? h('p', { class: 'lead' }, m.summary) : null,
      m.chapters && m.chapters.length ? h('p', { class: 'chapters' }, (m.chapters.length > 1 ? 'Book chapters: ' : 'Book chapter: ') + m.chapters.join(', ')) : null,
    ]);
    main.appendChild(head);
    const body = h('section', { class: 'tool-body' });
    main.appendChild(body);
    try { m.render(body); } catch (e) { body.appendChild(h('pre', { class: 'error' }, String(e && e.stack || e))); console.error(e); }
    main.focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }

  function renderHome(main) {
    document.title = 'Verbatim to Signal Workbench';
    main.appendChild(h('header', { class: 'tool-head home' }, [
      h('h1', {}, 'Verbatim to Signal Workbench'),
      h('p', { class: 'lead' }, 'Hands-on companion tools for the book From Verbatim to Signal: MedDRA Coding, SMQs, and Safety Surveillance. Practice each step from the reporter’s words to a justified recommendation, on synthetic data that matches the book’s worked examples.'),
    ]));
    WB.groups.forEach((g) => {
      const mods = WB.modules.filter((m) => m.group === g.id);
      const sec = h('section', { class: 'group' }, [h('h2', {}, g.title), h('p', { class: 'muted' }, g.blurb)]);
      const grid = h('div', { class: 'cards' });
      mods.forEach((m) => grid.appendChild(h('a', { class: 'card', href: '#/' + m.id }, [
        h('strong', {}, m.title), h('span', {}, m.summary || ''),
        m.chapters && m.chapters.length ? h('em', {}, (m.chapters.length > 1 ? 'Chapters ' : 'Chapter ') + m.chapters.join(', ')) : null,
      ])));
      sec.appendChild(grid);
      main.appendChild(sec);
    });
    main.appendChild(h('section', { class: 'group' }, [
      h('h2', {}, 'About the data'),
      h('p', {}, WB_DATA.meta.note),
      h('p', { class: 'muted' }, 'MedDRA® the Medical Dictionary for Regulatory Activities terminology is the international medical terminology developed under the auspices of ICH. MedDRA® is a registered trademark of ICH. This workbench does not contain the MedDRA terminology; it uses only individual term names quoted in the book for teaching.'),
    ]));
  }

  function buildNav() {
    const nav = document.getElementById('nav');
    nav.innerHTML = '';
    nav.appendChild(h('a', { href: '#/', 'data-id': '', class: 'home-link' }, 'Overview'));
    WB.groups.forEach((g) => {
      nav.appendChild(h('div', { class: 'nav-group' }, g.title));
      WB.modules.filter((m) => m.group === g.id).forEach((m) => nav.appendChild(h('a', { href: '#/' + m.id, 'data-id': m.id }, m.title)));
    });
  }

  /* ---------------- acceptance gate ---------------- */
  function gate(done) {
    if (WB.store.get('gate-v1') === 'ok') return done();
    const ov = h('div', { class: 'gate', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'gate-t' });
    const cb = h('input', { type: 'checkbox', id: 'gate-cb' });
    const btn = h('button', { class: 'btn primary', disabled: true }, 'Begin');
    cb.addEventListener('change', () => (btn.disabled = !cb.checked));
    btn.addEventListener('click', () => { WB.store.set('gate-v1', 'ok'); ov.remove(); done(); });
    ov.appendChild(h('div', { class: 'gate-card' }, [
      h('h2', { id: 'gate-t' }, 'Before you start'),
      h('ul', {}, [
        h('li', {}, 'This is a training tool. All products, patients, reports and numbers are synthetic.'),
        h('li', {}, 'It does not contain the MedDRA terminology. Term names and hierarchy placements are the book’s illustrative examples; check every term against the licensed MedDRA version you use.'),
        h('li', {}, 'Calculators show methods. They are not validated software and must not be used as the sole basis for regulatory, clinical or reporting decisions.'),
        h('li', {}, 'Do not enter identifiable patient information. Anything you type stays in this browser only.'),
      ]),
      h('label', { class: 'check' }, [cb, ' I understand and agree to use the workbench for learning and practice only.']),
      btn,
    ]));
    ov.addEventListener('keydown', (e) => { if (e.key === 'Tab') { const f = [cb, btn].filter((x) => !x.disabled); const i = f.indexOf(document.activeElement); e.preventDefault(); f[(i + (e.shiftKey ? f.length - 1 : 1)) % f.length].focus(); } });
    document.body.appendChild(ov);
    cb.focus();
  }

  /* ---------------- DOM helpers ---------------- */
  function h(tag, attrs, children) {
    const el = document.createElement(tag);
    if (attrs) for (const k in attrs) {
      const v = attrs[k];
      if (v === null || v === undefined || v === false) continue;
      if (k === 'class') el.className = v;
      else if (k === 'html') el.innerHTML = v;
      else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
      else if (v === true) el.setAttribute(k, '');
      else el.setAttribute(k, v);
    }
    (Array.isArray(children) ? children : [children]).forEach((c) => {
      if (c === null || c === undefined || c === false) return;
      el.appendChild(typeof c === 'string' || typeof c === 'number' ? document.createTextNode(String(c)) : c);
    });
    return el;
  }
  WB.h = h;

  /** Labeled numeric/text input. Returns {wrap, input}. */
  WB.field = function (label, opts) {
    opts = opts || {};
    const id = 'f' + Math.random().toString(36).slice(2, 9);
    const input = h(opts.textarea ? 'textarea' : 'input', Object.assign({ id: id, type: opts.textarea ? null : (opts.type || 'number'), step: opts.step || 'any', min: opts.min, value: opts.textarea ? null : (opts.value ?? ''), placeholder: opts.placeholder || '', rows: opts.rows }, opts.attrs || {}));
    if (opts.textarea && opts.value) input.value = opts.value;
    const wrap = h('div', { class: 'field' + (opts.wide ? ' wide' : '') }, [h('label', { for: id }, label), input, opts.hint ? h('small', {}, opts.hint) : null]);
    if (opts.onInput) input.addEventListener('input', opts.onInput);
    return { wrap, input };
  };
  WB.num = (input) => { const v = parseFloat(String(input.value).replace(',', '.')); return isFinite(v) ? v : NaN; };

  /** Simple table from header array and rows (arrays of strings/nodes). */
  WB.table = function (head, rows, opts) {
    opts = opts || {};
    const t = h('table', { class: 'tbl' + (opts.compact ? ' compact' : '') });
    if (opts.caption) t.appendChild(h('caption', {}, opts.caption));
    t.appendChild(h('thead', {}, h('tr', {}, head.map((c) => h('th', { scope: 'col' }, c)))));
    t.appendChild(h('tbody', {}, rows.map((r) => h('tr', {}, r.map((c) => h('td', {}, c))))));
    return h('div', { class: 'tbl-wrap' }, t);
  };

  WB.callout = (kind, title, body) => h('div', { class: 'callout ' + (kind || '') }, [title ? h('strong', {}, title) : null, typeof body === 'string' ? h('p', {}, body) : body]);
  WB.note = (text) => h('p', { class: 'note' }, text);

  /* ---------------- formatting ---------------- */
  WB.fmt = function (x, d) {
    if (x === null || x === undefined || !isFinite(x)) return '—';
    d = d === undefined ? 2 : d;
    return Number(x).toFixed(d);
  };
  WB.pct = (n, d, dp) => (d > 0 ? WB.fmt((100 * n) / d, dp === undefined ? 1 : dp) + '%' : '—');

  /* ---------------- statistics ---------------- */
  const S = (WB.stats = {});
  const Z = 1.959963984540054;
  /** ROR, PRR, CIs (Woolf / log method), expected, O/E, simple shrunk O/E. a=product&event, b=product&other, c=other&event, d=other&other */
  S.disproportionality = function (a, b, c, d) {
    const N = a + b + c + d;
    const ror = (a * d) / (b * c);
    const seR = Math.sqrt(1 / a + 1 / b + 1 / c + 1 / d);
    const prr = (a / (a + b)) / (c / (c + d));
    const seP = Math.sqrt(1 / a - 1 / (a + b) + 1 / c - 1 / (c + d));
    const E = ((a + b) * (a + c)) / N;
    return {
      ror, rorLo: Math.exp(Math.log(ror) - Z * seR), rorHi: Math.exp(Math.log(ror) + Z * seR),
      prr, prrLo: Math.exp(Math.log(prr) - Z * seP), prrHi: Math.exp(Math.log(prr) + Z * seP),
      expected: E, oe: a / E, oeShrunk: (a + 0.5) / (E + 0.5),
      chi2: chi2Yates(a, b, c, d), N,
    };
  };
  function chi2Yates(a, b, c, d) {
    const N = a + b + c + d;
    const num = N * Math.pow(Math.max(0, Math.abs(a * d - b * c) - N / 2), 2);
    const den = (a + b) * (c + d) * (a + c) * (b + d);
    return den ? num / den : NaN;
  }
  /** Exact Poisson CI for a count k (Garwood), via chi-square quantiles computed numerically. */
  S.poissonCI = function (k, conf) {
    conf = conf || 0.95;
    const alpha = 1 - conf;
    const lo = k === 0 ? 0 : gammaInv(alpha / 2, k);
    const hi = gammaInv(1 - alpha / 2, k + 1);
    return [lo, hi];
  };
  // inverse of regularized lower incomplete gamma P(a, x) = p, by bisection
  function gammaInv(p, a) {
    let lo = 0, hi = Math.max(10, a * 10 + 50);
    for (let i = 0; i < 200; i++) { const mid = (lo + hi) / 2; if (gammaP(a, mid) < p) lo = mid; else hi = mid; }
    return (lo + hi) / 2;
  }
  function gammaP(a, x) {
    if (x <= 0) return 0;
    if (x < a + 1) { let sum = 1 / a, del = sum, ap = a; for (let n = 0; n < 500; n++) { ap += 1; del *= x / ap; sum += del; if (Math.abs(del) < Math.abs(sum) * 1e-14) break; } return sum * Math.exp(-x + a * Math.log(x) - lgamma(a)); }
    let b = x + 1 - a, c = 1 / 1e-300, d = 1 / b, hh = d;
    for (let i = 1; i < 500; i++) { const an = -i * (i - a); b += 2; d = an * d + b; if (Math.abs(d) < 1e-300) d = 1e-300; c = b + an / c; if (Math.abs(c) < 1e-300) c = 1e-300; d = 1 / d; const del = d * c; hh *= del; if (Math.abs(del - 1) < 1e-14) break; }
    return 1 - Math.exp(-x + a * Math.log(x) - lgamma(a)) * hh;
  }
  function lgamma(z) {
    const g = 7, c = [0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
    if (z < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * z)) - lgamma(1 - z);
    z -= 1; let x = c[0]; for (let i = 1; i < g + 2; i++) x += c[i] / (z + i);
    const t = z + g + 0.5; return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(x);
  }
  /** Rate per `per` units with exact Poisson CI. */
  S.rate = function (k, T, per) { per = per || 100; const ci = S.poissonCI(k); return { rate: (k / T) * per, lo: (ci[0] / T) * per, hi: (ci[1] / T) * per }; };
  /** Rate ratio with log-method CI (two independent Poisson counts). */
  S.rateRatio = function (k1, T1, k2, T2) {
    const rr = (k1 / T1) / (k2 / T2); const se = Math.sqrt(1 / k1 + 1 / k2);
    return { rr, lo: Math.exp(Math.log(rr) - Z * se), hi: Math.exp(Math.log(rr) + Z * se) };
  };
  /** Wilson score CI for a proportion. */
  S.wilson = function (x, n) {
    if (!n) return [NaN, NaN];
    const p = x / n, z2 = Z * Z, den = 1 + z2 / n, cen = (p + z2 / (2 * n)) / den, half = (Z * Math.sqrt((p * (1 - p)) / n + z2 / (4 * n * n))) / den;
    return [Math.max(0, cen - half), Math.min(1, cen + half)];
  };
  /** Diagnostic 2x2: tp, fp, fn, tn */
  S.diag = function (tp, fp, fn, tn) {
    return { sens: tp / (tp + fn), spec: tn / (tn + fp), ppv: tp / (tp + fp), npv: tn / (tn + fn), f1: (2 * tp) / (2 * tp + fp + fn), sensCI: S.wilson(tp, tp + fn), ppvCI: S.wilson(tp, tp + fp), specCI: S.wilson(tn, tn + fp) };
  };

  /* ---------------- SVG charts ---------------- */
  const NS = 'http://www.w3.org/2000/svg';
  function s(tag, attrs, kids) { const el = document.createElementNS(NS, tag); for (const k in attrs || {}) el.setAttribute(k, attrs[k]); (kids || []).forEach((c) => c && el.appendChild(typeof c === 'string' ? document.createTextNode(c) : c)); return el; }
  WB.svg = s;
  /** Horizontal bar chart. items: [{label, value, value2?, note?}] ; opts: {max, unit, series:[name1,name2]} */
  WB.barChart = function (items, opts) {
    opts = opts || {};
    const W = 640, rowH = opts.value2 ? 34 : 26, left = opts.left || 220, top = 24, H = top + items.length * rowH + 30;
    const max = opts.max || Math.max(...items.map((i) => Math.max(i.value || 0, i.value2 || 0))) * 1.15 || 1;
    const x = (v) => left + ((W - left - 70) * v) / max;
    const svg = s('svg', { viewBox: `0 0 ${W} ${H}`, class: 'chart', role: 'img', 'aria-label': opts.aria || 'Bar chart' });
    items.forEach((it, i) => {
      const y = top + i * rowH;
      svg.appendChild(s('text', { x: left - 8, y: y + rowH / 2 + 4, 'text-anchor': 'end', class: 'lbl' }, [it.label]));
      const bh = opts.value2 !== undefined || it.value2 !== undefined ? 12 : 16;
      svg.appendChild(s('rect', { x: left, y: y + 4, width: Math.max(0, x(it.value) - left), height: bh, class: 'bar1' }));
      svg.appendChild(s('text', { x: x(it.value) + 4, y: y + 4 + bh - 3, class: 'val' }, [it.text1 || WB.fmt(it.value, opts.dp ?? 1) + (opts.unit || '')]));
      if (it.value2 !== undefined) {
        svg.appendChild(s('rect', { x: left, y: y + 4 + bh + 2, width: Math.max(0, x(it.value2) - left), height: bh, class: 'bar2' }));
        svg.appendChild(s('text', { x: x(it.value2) + 4, y: y + 4 + 2 * bh - 1, class: 'val' }, [it.text2 || WB.fmt(it.value2, opts.dp ?? 1) + (opts.unit || '')]));
      }
    });
    if (opts.series) {
      svg.appendChild(s('rect', { x: left, y: H - 18, width: 12, height: 10, class: 'bar1' }));
      svg.appendChild(s('text', { x: left + 16, y: H - 9, class: 'lbl' }, [opts.series[0]]));
      if (opts.series[1]) { svg.appendChild(s('rect', { x: left + 170, y: H - 18, width: 12, height: 10, class: 'bar2' })); svg.appendChild(s('text', { x: left + 186, y: H - 9, class: 'lbl' }, [opts.series[1]])); }
    }
    return svg;
  };
  /** Log-log scatter (for eDISH). points: [{x, y, label, kind}] ; opts: {xLines:[3], yLines:[2], xLabel, yLabel} */
  WB.logScatter = function (points, opts) {
    opts = opts || {};
    const W = 560, H = 420, L = 60, R = 20, T = 20, B = 50;
    const xmin = opts.xmin || 0.3, xmax = opts.xmax || 30, ymin = opts.ymin || 0.1, ymax = opts.ymax || 10;
    const X = (v) => L + ((Math.log10(Math.max(v, xmin)) - Math.log10(xmin)) / (Math.log10(xmax) - Math.log10(xmin))) * (W - L - R);
    const Y = (v) => H - B - ((Math.log10(Math.max(v, ymin)) - Math.log10(ymin)) / (Math.log10(ymax) - Math.log10(ymin))) * (H - T - B);
    const svg = s('svg', { viewBox: `0 0 ${W} ${H}`, class: 'chart', role: 'img', 'aria-label': opts.aria || 'Scatter plot' });
    svg.appendChild(s('rect', { x: L, y: T, width: W - L - R, height: H - T - B, class: 'plotbg' }));
    [0.3, 1, 3, 10, 30].filter((v) => v >= xmin && v <= xmax).forEach((v) => { svg.appendChild(s('line', { x1: X(v), x2: X(v), y1: T, y2: H - B, class: 'grid' })); svg.appendChild(s('text', { x: X(v), y: H - B + 16, 'text-anchor': 'middle', class: 'tick' }, [String(v)])); });
    [0.1, 0.3, 1, 3, 10].filter((v) => v >= ymin && v <= ymax).forEach((v) => { svg.appendChild(s('line', { x1: L, x2: W - R, y1: Y(v), y2: Y(v), class: 'grid' })); svg.appendChild(s('text', { x: L - 6, y: Y(v) + 4, 'text-anchor': 'end', class: 'tick' }, [String(v)])); });
    (opts.xLines || []).forEach((v) => svg.appendChild(s('line', { x1: X(v), x2: X(v), y1: T, y2: H - B, class: 'thr' })));
    (opts.yLines || []).forEach((v) => svg.appendChild(s('line', { x1: L, x2: W - R, y1: Y(v), y2: Y(v), class: 'thr' })));
    if (opts.quadLabel) svg.appendChild(s('text', { x: W - R - 6, y: T + 16, 'text-anchor': 'end', class: 'quad' }, [opts.quadLabel]));
    points.forEach((p) => {
      const cls = 'pt ' + (p.kind || '');
      if (p.kind === 'open') svg.appendChild(s('rect', { x: X(p.x) - 5, y: Y(p.y) - 5, width: 10, height: 10, class: cls }));
      else svg.appendChild(s('circle', { cx: X(p.x), cy: Y(p.y), r: 5.5, class: cls }));
      if (p.label) svg.appendChild(s('text', { x: X(p.x) + 8, y: Y(p.y) - 6, class: 'ptlbl' }, [p.label]));
    });
    svg.appendChild(s('text', { x: (L + W - R) / 2, y: H - 10, 'text-anchor': 'middle', class: 'axl' }, [opts.xLabel || 'x']));
    svg.appendChild(s('text', { x: 14, y: (T + H - B) / 2, 'text-anchor': 'middle', class: 'axl', transform: `rotate(-90 14 ${(T + H - B) / 2})` }, [opts.yLabel || 'y']));
    return svg;
  };
  /** Forest-style interval plot on a log axis. rows: [{label, est, lo, hi}] */
  WB.forest = function (rows, opts) {
    opts = opts || {};
    const W = 640, rowH = 28, L = 250, R = 110, T = 16, H = T + rows.length * rowH + 40;
    const lo = opts.min || 0.1, hi = opts.max || 10;
    const X = (v) => L + ((Math.log10(Math.min(Math.max(v, lo), hi)) - Math.log10(lo)) / (Math.log10(hi) - Math.log10(lo))) * (W - L - R);
    const svg = s('svg', { viewBox: `0 0 ${W} ${H}`, class: 'chart', role: 'img', 'aria-label': opts.aria || 'Interval plot' });
    svg.appendChild(s('line', { x1: X(1), x2: X(1), y1: T - 4, y2: H - 34, class: 'thr' }));
    if (opts.threshold) svg.appendChild(s('line', { x1: X(opts.threshold), x2: X(opts.threshold), y1: T - 4, y2: H - 34, class: 'grid dash' }));
    [0.1, 0.3, 1, 3, 10].filter((v) => v >= lo && v <= hi).forEach((v) => svg.appendChild(s('text', { x: X(v), y: H - 18, 'text-anchor': 'middle', class: 'tick' }, [String(v)])));
    rows.forEach((r, i) => {
      const y = T + i * rowH + rowH / 2;
      svg.appendChild(s('text', { x: L - 8, y: y + 4, 'text-anchor': 'end', class: 'lbl' }, [r.label]));
      svg.appendChild(s('line', { x1: X(r.lo), x2: X(r.hi), y1: y, y2: y, class: 'ci' }));
      svg.appendChild(s('rect', { x: X(r.est) - 5, y: y - 5, width: 10, height: 10, class: 'est' }));
      svg.appendChild(s('text', { x: W - R + 8, y: y + 4, class: 'val' }, [`${WB.fmt(r.est)} (${WB.fmt(r.lo)}–${WB.fmt(r.hi)})`]));
    });
    svg.appendChild(s('text', { x: (L + W - R) / 2, y: H - 2, 'text-anchor': 'middle', class: 'axl' }, [opts.xLabel || 'Ratio (log scale)']));
    return svg;
  };

  /* ---------------- storage and export ---------------- */
  WB.store = {
    get(k) { try { return localStorage.getItem('v2s-' + k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem('v2s-' + k, v); return true; } catch (e) { return false; } },
    del(k) { try { localStorage.removeItem('v2s-' + k); } catch (e) {} },
    getJSON(k, dflt) { try { const v = this.get(k); return v ? JSON.parse(v) : dflt; } catch (e) { return dflt; } },
    setJSON(k, v) { return this.set(k, JSON.stringify(v)); },
  };
  WB.download = function (filename, content, mime) {
    const blob = new Blob([content], { type: mime || 'text/plain;charset=utf-8' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = filename;
    document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  };
  /** Export an HTML fragment as a Word-openable .doc file. */
  WB.exportDoc = function (filename, title, innerHtml) {
    const doc = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${esc(title)}</title><style>body{font-family:Calibri,Arial,sans-serif;font-size:11pt}h1{font-size:16pt;color:#1F2A44}table{border-collapse:collapse;width:100%}td,th{border:1px solid #999;padding:5px;vertical-align:top;text-align:left}th{background:#EEF1F5;width:30%}.foot{color:#666;font-size:9pt}</style></head><body>${innerHtml}</body></html>`;
    WB.download(filename, '﻿' + doc, 'application/msword');
  };
  WB.exportCSV = function (filename, head, rows) {
    const q = (v) => '"' + String(v ?? '').replace(/"/g, '""') + '"';
    WB.download(filename, '﻿' + [head.map(q).join(','), ...rows.map((r) => r.map(q).join(','))].join('\r\n'), 'text/csv;charset=utf-8');
  };
  function esc(t) { return String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
  WB.esc = esc;

  /* ---------------- boot ---------------- */
  WB.boot = function () {
    buildNav();
    window.addEventListener('hashchange', route);
    document.getElementById('menu-btn').addEventListener('click', () => document.body.classList.toggle('nav-open'));
    document.getElementById('nav').addEventListener('click', (e) => { if (e.target.tagName === 'A') document.body.classList.remove('nav-open'); });
    gate(route);
  };
})();
