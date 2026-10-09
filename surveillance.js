/* Verbatim to Signal Workbench — Surveillance calculators
   Tools: liver-criteria, rates, disproportionality, version-effect, wording.
   Synthetic data only (window.WB_DATA). Numbers reproduce the book's worked examples. */
(function () {
  'use strict';
  const WB = window.WB, D = window.WB_DATA, h = WB.h, F = WB.fmt, S = WB.stats;

  /* ================= shared helpers ================= */
  const fin = (x) => typeof x === 'number' && isFinite(x);
  const nf = (x, dp) => (fin(x) ? Number(x).toLocaleString('en-US', { minimumFractionDigits: dp || 0, maximumFractionDigits: dp || 0 }) : '—');
  const pc = (x, dp) => (fin(x) ? F(x, dp === undefined ? 1 : dp) + '%' : '—');
  const ci = (lo, hi, dp) => (fin(lo) && fin(hi) ? `${F(lo, dp ?? 2)}–${F(hi, dp ?? 2)}` : '—');
  /** Keep SVG charts legible on phones: scroll horizontally instead of shrinking text. */
  const chartWrap = (svg, minW) => { svg.style.minWidth = (minW || 540) + 'px'; svg.style.margin = '8px 0'; return h('div', { class: 'tbl-wrap', 'data-chart': '1' }, svg); };
  /** Three significant figures (60.2, 3.75, 5.00), the book's convention for rates per 100 PY. */
  const g3 = (x) => (!fin(x) ? '—' : Math.abs(x) >= 100 ? F(x, 0) : Math.abs(x) >= 10 ? F(x, 1) : Math.abs(x) >= 1 ? F(x, 2) : F(x, 3));
  const ci3 = (lo, hi) => (fin(lo) && fin(hi) ? `${g3(lo)}–${g3(hi)}` : '—');
  const uid = (p) => (p || 'x') + Math.random().toString(36).slice(2, 9);

  function stat(k, label, v, sub) {
    return h('div', { class: 'stat', 'data-k': k }, [h('div', { class: 'k' }, label), h('div', { class: 'v' }, v), sub ? h('div', { class: 's' }, sub) : null]);
  }
  function panel(title, kids, tag) { return h('div', { class: 'panel' }, [title ? h(tag || 'h2', {}, title) : null].concat(kids)); }
  const howTo = (text) => WB.callout('', 'How to use', text);
  const bookLink = (text) => h('p', { class: 'note', 'data-k': 'booklink' }, 'Book link: ' + text);
  function presetRow(list) {
    return h('div', { class: 'btn-row', role: 'group', 'aria-label': 'Book examples' },
      list.map((p) => h('button', { class: 'btn small', type: 'button', 'data-preset': p[2] || '', onclick: p[1] }, p[0])));
  }
  const numF = (label, value, opts) => WB.field(label, Object.assign({ value: value }, opts || {}));
  const txtF = (label, value, opts) => WB.field(label, Object.assign({ type: 'text', value: value }, opts || {}));
  function selectF(label, options, value, onChange, opts) {
    const id = uid('s');
    const s = h('select', { id: id }, options.map((o) => h('option', { value: o[0] }, o[1])));
    s.value = value;
    if (onChange) s.addEventListener('change', onChange);
    return { wrap: h('div', { class: 'field' + (opts && opts.wide ? ' wide' : '') }, [h('label', { for: id }, label), s, opts && opts.hint ? h('small', {}, opts.hint) : null]), input: s };
  }
  function checkF(label, checked, onChange) {
    const cb = h('input', { type: 'checkbox' });
    cb.checked = !!checked;
    if (onChange) cb.addEventListener('change', onChange);
    return { wrap: h('label', { class: 'check' }, [cb, h('span', {}, label)]), input: cb };
  }
  const yesNo = (yes, text) => h('span', { class: 'pill ' + (yes ? 'yes' : 'no') }, (yes ? 'Yes: ' : 'No: ') + text);
  const alertPill = (y) => h('span', { class: 'pill ' + (y ? 'yes' : 'no') }, y ? 'Alert' : 'No alert');
  const unk = (text) => h('span', { class: 'pill' }, 'Unknown: ' + text);
  const set = (f, v) => { f.input.value = v === null || v === undefined ? '' : v; };
  const val = (f) => WB.num(f.input);
  function onAll(fields, fn) { fields.forEach((f) => f.input.addEventListener('input', fn)); }
  /** Render MedDRA-style label "PT Name" / "SMQ Name (narrow)" as italic term + level. */
  function termHTML(label) {
    const m = /^(LLT|PT|HLT|HLGT|SOC|SMQ)\s+(.+?)(\s*\((narrow|broad)\))?$/.exec(String(label).trim());
    if (!m) return WB.esc(label);
    return '<i>' + WB.esc(m[2]) + '</i> (' + m[1] + ')' + (m[4] ? ', ' + m[4] : '');
  }
  const termNode = (label) => h('span', { html: termHTML(label) });
  function interpretation(paras) { return panel('Interpretation', paras.map((p) => (typeof p === 'string' ? h('p', {}, p) : p))); }
  /** Lines "a, b, c" (comma, semicolon or tab). Returns arrays of trimmed strings; skips blank and # lines. */
  function parseLines(text) {
    return String(text || '').split(/\r?\n/).map((l) => l.trim()).filter((l) => l && !l.startsWith('#')).map((l) => l.split(/\t|;|,/).map((s) => s.trim()));
  }
  const pf = (s) => { const v = parseFloat(String(s ?? '').replace(/[\s,]/g, '')); return isFinite(v) ? v : NaN; };
  async function copyText(text, statusEl) {
    let ok = false;
    try { if (navigator.clipboard && window.isSecureContext) { await navigator.clipboard.writeText(text); ok = true; } } catch (e) { ok = false; }
    if (!ok) {
      const ta = h('textarea', { 'aria-hidden': 'true', style: 'position:fixed;left:-9999px;top:0' });
      ta.value = text; document.body.appendChild(ta); ta.select();
      try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
      ta.remove();
    }
    if (statusEl) statusEl.textContent = ok ? 'Copied to clipboard.' : 'Copy was blocked by the browser; select the text and copy it manually.';
  }

  /* =====================================================================
     1. Liver injury criteria and eDISH (Chapters 13, 15, 22)
     ===================================================================== */
  const EXCLUSIONS = [
    'Acute viral hepatitis excluded (hepatitis A IgM, hepatitis B surface antigen and core IgM, hepatitis C RNA, hepatitis E IgM and RNA)',
    'Other infections considered (for example CMV, EBV, HSV)',
    'Autoimmune hepatitis considered (autoantibodies against baseline, immunoglobulins)',
    'Biliary obstruction excluded by imaging',
    'Alcohol and other toxic exposures considered (including paracetamol)',
    'Other hepatotoxic drugs, herbals and supplements reviewed',
    'Ischaemic or congestive liver injury and other acute liver disease considered',
    'Pre-existing liver disease considered (baseline values, history)',
  ];

  function liverEval(x, cut) {
    const r = { x };
    r.R = fin(x.alt) && fin(x.alp) && x.alp > 0 ? x.alt / x.alp : NaN;
    r.pattern = !fin(r.R) ? 'Not calculable (needs ALT and ALP)' : r.R >= 5 ? 'Hepatocellular' : r.R <= 2 ? 'Cholestatic' : 'Mixed';
    const amino = Math.max(fin(x.alt) ? x.alt : -Infinity, fin(x.ast) ? x.ast : -Infinity);
    r.amino = fin(amino) ? amino : NaN;
    r.c1 = fin(r.amino) ? r.amino > 3 : null; // aminotransferase >3×ULN
    r.c2 = fin(x.tbl) ? x.tbl > 2 : null; // TBL >2×ULN
    r.c3 = fin(x.alp) ? x.alp < cut : null; // no initial cholestasis
    r.naive = r.c1 === true && r.c2 === true;
    r.screen = r.c1 === true && r.c2 === true && r.c3 === true;
    r.dili = [];
    if (fin(x.alt) && x.alt >= 5) r.dili.push('ALT ≥5×ULN');
    if (fin(x.alp) && x.alp >= 2) r.dili.push('ALP ≥2×ULN');
    if (fin(x.alt) && x.alt >= 3 && fin(x.tbl) && x.tbl > 2) r.dili.push('ALT ≥3×ULN with TBL >2×ULN');
    return r;
  }

  function pa301Lines(arm) {
    const seen = new Map();
    D.pa301.records.filter((r) => r.arm === arm).forEach((r) => {
      if (!seen.has(r.patient_id)) seen.set(r.patient_id, { id: r.patient_id, alt: r.peak_ALT_xULN, alp: r.peak_ALP_xULN, tbl: r.peak_TBL_xULN, coded: false });
      if (r.PT) seen.get(r.patient_id).coded = true;
    });
    return '# ID, ALT, AST, ALP, TBL, group  (multiples of ULN; synthetic PA-301 ' + arm + ' arm, controlled period)\n' +
      Array.from(seen.values()).map((p) => [p.id, p.alt, '', p.alp, p.tbl, p.coded ? 'coded AE' : 'lab only'].join(', ')).join('\n');
  }
  const EX132_LINES = '# ID, ALT, AST, ALP, TBL, group  (Example 13.2, fictional antifungal trial)\nPatient 1, 8.0, , 1.2, 2.5, example\nPatient 2, 3.5, , 2.8, 2.9, example\nPatient 3, 12.0, , 1.1, 1.6, example';

  function renderLiver(el) {
    el.appendChild(howTo('Enter one patient’s peak liver tests, either as multiples of the upper limit of normal (×ULN) or as raw values with each ULN. The tool computes the R ratio and injury pattern, checks the international DILI biochemical criteria and the potential Hy’s law biochemical screen, and asks you to document the alternative explanations that Hy’s law also requires. For a whole arm, paste one patient per line in the batch panel to get a screening table and an eDISH plot. Peak values may come from different days: the plot screens, the dated laboratory series confirms.'));

    /* ---------- single patient ---------- */
    const single = h('div', { class: 'panel', id: 'liver-single' });
    single.appendChild(h('h2', {}, 'Single patient'));
    const modeSel = selectF('Enter values as', [['xuln', 'Multiples of ULN (×ULN)'], ['raw', 'Raw values with each ULN']], 'xuln', () => { showMode(); calc(); });
    const idF = txtF('Patient or report ID', '', { placeholder: 'e.g. PA-301-0147' });
    const cutF = numF('ALP cutoff for “no initial cholestasis” (×ULN)', 2, { hint: 'Operational convention (often 2×ULN); state it in your case definition.' });
    const fx = { alt: numF('Peak ALT (×ULN)', ''), ast: numF('Peak AST (×ULN, optional)', ''), alp: numF('Peak ALP (×ULN)', ''), tbl: numF('Peak total bilirubin (×ULN)', '') };
    const fr = {
      alt: numF('ALT (U/L)', ''), altU: numF('ALT ULN (U/L)', ''), ast: numF('AST (U/L, optional)', ''), astU: numF('AST ULN (U/L)', ''),
      alp: numF('ALP (U/L)', ''), alpU: numF('ALP ULN (U/L)', ''), tbl: numF('Total bilirubin (µmol/L)', '', { hint: 'Any unit, if the ULN uses the same unit.' }), tblU: numF('Bilirubin ULN (same unit)', ''),
    };
    const boxX = h('div', { class: 'fields' }, Object.values(fx).map((f) => f.wrap));
    const boxR = h('div', { class: 'grid2' }, [
      h('div', { class: 'fields' }, [fr.alt.wrap, fr.altU.wrap]), h('div', { class: 'fields' }, [fr.ast.wrap, fr.astU.wrap]),
      h('div', { class: 'fields' }, [fr.alp.wrap, fr.alpU.wrap]), h('div', { class: 'fields' }, [fr.tbl.wrap, fr.tblU.wrap]),
    ]);
    function showMode() { const raw = modeSel.input.value === 'raw'; boxX.style.display = raw ? 'none' : ''; boxR.style.display = raw ? '' : 'none'; }

    const exChecks = EXCLUSIONS.map((t) => checkF(t, false, calc));
    const altNote = WB.field('Notes on alternatives and co-suspect drugs', { textarea: true, rows: 2, wide: true, placeholder: 'e.g. methotrexate 15 mg weekly, stable for 2 years' });
    altNote.input.addEventListener('input', calc);
    const preNote = h('p', { class: 'note', 'aria-live': 'polite' });

    function loadSingle(p) {
      modeSel.input.value = p.mode; showMode();
      set(idF, p.id);
      Object.keys(fx).forEach((k) => set(fx[k], p.x ? p.x[k] : ''));
      Object.keys(fr).forEach((k) => set(fr[k], p.r ? p.r[k] : ''));
      exChecks.forEach((c) => (c.input.checked = !!p.allExcluded));
      altNote.input.value = p.note || '';
      preNote.textContent = p.label ? 'Loaded: ' + p.label + '.' : '';
      calc();
    }
    const ex132 = (n, alt, alp, tbl) => () => loadSingle({ mode: 'xuln', id: 'Example 13.2, Patient ' + n, x: { alt, ast: '', alp, tbl }, allExcluded: true, note: 'Viral, autoimmune and imaging work-up negative; no other hepatotoxic drug.', label: 'Example 13.2, Patient ' + n + ' (fictional antifungal trial; peak values ×ULN)' });
    single.appendChild(presetRow([
      ['Load book example (Case 13.1, index case PA-301-0147)', () => loadSingle({ mode: 'raw', id: 'PA-301-0147', r: { alt: 412, altU: 42, ast: 263, astU: 37, alp: 181, alpU: 129, tbl: 67, tblU: 21 }, allExcluded: true,
        note: 'Day 71 values. Work-up Days 74–80 negative (HAV IgM, HBsAg, HBc IgM, HCV RNA, HEV IgM and RNA, CMV/EBV; ANA 1:80 unchanged from baseline; no biliary dilatation). Methotrexate 15 mg weekly, stable 2 years: committee considered it a possible contributor (causality field, not classification).',
        label: 'index case PA-301-0147, Day 71 raw values (Case 13.1; Table 13.2)' }), 'idx'],
      ['Load book example (Example 13.2, Patient 1)', ex132(1, 8.0, 1.2, 2.5), 'ex1'],
      ['Patient 2', ex132(2, 3.5, 2.8, 2.9), 'ex2'],
      ['Patient 3', ex132(3, 12.0, 1.1, 1.6), 'ex3'],
      ['Load book example (Worksheet 3, PM-0733)', () => loadSingle({ mode: 'xuln', id: 'PM-0733', x: { alt: 14, ast: '', alp: 1.5, tbl: 4.1 }, allExcluded: true, note: 'Hepatitis A, B, C and E markers negative; autoantibodies negative; ultrasound normal; minimal alcohol; folic acid only. Positive dechallenge.', label: 'PM-0733 (Worksheet 3, Chapter 13)' }), 'pm0733'],
    ]));
    single.appendChild(preNote);
    single.appendChild(h('div', { class: 'fields' }, [idF.wrap, modeSel.wrap, cutF.wrap]));
    single.appendChild(boxX); single.appendChild(boxR);
    showMode();
    const resS = h('div', { id: 'liver-single-results', 'aria-live': 'polite' });
    single.appendChild(h('h3', { style: 'margin-top:14px' }, 'Results'));
    single.appendChild(resS);
    single.appendChild(h('h3', { style: 'margin-top:14px' }, 'Third Hy’s law component: no other explanation'));
    single.appendChild(h('p', { class: 'muted' }, 'Tick each alternative only when the work-up documents it. A missing test is not an exclusion.'));
    exChecks.forEach((c) => single.appendChild(c.wrap));
    single.appendChild(altNote.wrap);
    const resEx = h('div', { id: 'liver-class', 'aria-live': 'polite' });
    single.appendChild(resEx);
    el.appendChild(single);

    onAll([idF, cutF].concat(Object.values(fx), Object.values(fr)), calc);

    function readX() {
      if (modeSel.input.value === 'raw') {
        const q = (a, b) => { const v = val(fr[a]), u = val(fr[b]); return fin(v) && fin(u) && u > 0 ? v / u : NaN; };
        return { alt: q('alt', 'altU'), ast: q('ast', 'astU'), alp: q('alp', 'alpU'), tbl: q('tbl', 'tblU') };
      }
      return { alt: val(fx.alt), ast: val(fx.ast), alp: val(fx.alp), tbl: val(fx.tbl) };
    }
    function calc() {
      const cut = fin(val(cutF)) ? val(cutF) : 2;
      const x = readX();
      const r = liverEval(x, cut);
      const raw = modeSel.input.value === 'raw';
      resS.innerHTML = '';
      const sub = raw ? 'computed from value ÷ ULN' : 'as entered';
      resS.appendChild(h('div', { class: 'result' }, [
        stat('alt', 'ALT ×ULN', F(x.alt, 1), sub), stat('ast', 'AST ×ULN', F(x.ast, 1), fin(x.ast) ? sub : 'optional'),
        stat('tbl', 'Total bilirubin ×ULN', F(x.tbl, 1), sub), stat('alp', 'ALP ×ULN', F(x.alp, 1), sub),
        stat('r', 'R ratio', F(r.R, 1), fin(r.R) ? `(ALT/ULN) ÷ (ALP/ULN) = ${F(x.alt, 2)} ÷ ${F(x.alp, 2)} = ${F(r.R, 2)}` : 'needs ALT and ALP'),
        stat('pattern', 'Pattern', r.pattern, fin(r.R) && !r.dili.length ? 'hepatocellular ≥5; mixed 2–5; cholestatic ≤2. No DILI criterion is met, so this R describes ratios only, not an injury pattern' : 'hepatocellular ≥5; mixed 2–5; cholestatic ≤2'),
      ]));
      resS.appendChild(h('div', { class: 'fields', style: 'gap:6px 10px;align-items:flex-start' }, [
        h('div', { 'data-k': 'dili' }, [h('strong', {}, 'DILI biochemical criteria: '), r.dili.length ? yesNo(true, r.dili.join('; ')) : (fin(x.alt) ? yesNo(false, 'none met') : unk('enter values'))]),
      ]));
      const comp = h('ul', { 'data-k': 'hy-components' }, [
        h('li', {}, [r.c1 === null ? unk('aminotransferase') : yesNo(r.c1, 'ALT or AST >3×ULN' + (fin(r.amino) ? ` (highest ${F(r.amino, 1)})` : ''))]),
        h('li', {}, [r.c2 === null ? unk('bilirubin') : yesNo(r.c2, 'Total bilirubin >2×ULN' + (fin(x.tbl) ? ` (${F(x.tbl, 1)})` : ''))]),
        h('li', {}, [r.c3 === null ? unk('ALP missing, so cholestasis and pattern cannot be judged') : yesNo(r.c3, `No initial cholestasis: ALP <${F(cut, 1)}×ULN` + (fin(x.alp) ? ` (${F(x.alp, 1)})` : ''))]),
      ]);
      resS.appendChild(h('div', {}, [h('strong', {}, 'Potential Hy’s law biochemical screen'), comp]));
      let screenBox;
      if (r.screen) screenBox = WB.callout('warn', 'Potential Hy’s law: biochemical screen met', 'Aminotransferase >3×ULN with bilirubin >2×ULN and no initial cholestasis. This is a screen, not a Hy’s law case: the alternative explanations below must be documented first.');
      else if (r.naive && r.c3 === false) screenBox = WB.callout('', 'Screen not met: bilirubin rise may reflect cholestasis', `ALT/AST >3×ULN and bilirubin >2×ULN, but ALP ${F(x.alp, 1)}×ULN is at or above the ${F(cut, 1)}×ULN cutoff. A screen on ALT and bilirubin alone would have counted this patient (Example 13.2, Patient 2).`);
      else if (r.naive && r.c3 === null) screenBox = WB.callout('warn', 'Screen incomplete: ALP needed', 'ALT/AST >3×ULN and bilirubin >2×ULN, but without ALP the pattern and the “no initial cholestasis” component cannot be checked (Exercise 13.1, PM-0918).');
      else screenBox = WB.callout('', 'Potential Hy’s law screen not met', fin(x.alt) || fin(x.ast) ? 'One or more biochemical thresholds is not met. The patient may still meet the DILI biochemical criteria and need review.' : 'Enter values or load a book example.');
      screenBox.setAttribute('data-k', 'screen');
      resS.appendChild(screenBox);

      // classification with exclusions
      resEx.innerHTML = '';
      const done = exChecks.filter((c) => c.input.checked).length, left = EXCLUSIONS.filter((_, i) => !exChecks[i].input.checked);
      let cls;
      if (!r.screen) cls = WB.callout('', 'Classification', 'The exclusion checklist applies once the biochemical screen is met.');
      else if (left.length) cls = WB.callout('warn', `Potential Hy’s law case: ${left.length} of ${EXCLUSIONS.length} alternative explanations not yet documented`, h('ul', {}, left.map((t) => h('li', {}, t))));
      else cls = WB.callout('ok', 'Meets the patient-level Hy’s law criteria', 'All biochemical components are met and the listed alternative explanations are documented as excluded. Record the classification in the adjudication record (Worksheet 3) and causality separately (for example RUCAM or committee adjudication). Hy’s law’s first component, more aminotransferase elevations on drug than on control, is judged across the program, not in one patient.');
      cls.setAttribute('data-k', 'classification');
      resEx.appendChild(cls);
      if (r.screen && altNote.input.value.trim()) resEx.appendChild(h('p', { class: 'note' }, 'Recorded note: ' + altNote.input.value.trim()));
      resEx.appendChild(h('p', { class: 'note' }, `${done} of ${EXCLUSIONS.length} alternatives documented.`));
    }

    /* ---------- batch ---------- */
    const batch = h('div', { class: 'panel', id: 'liver-batch' });
    batch.appendChild(h('h2', {}, 'Batch screen and eDISH plot'));
    const ta = WB.field('Patients, one per line: ID, ALT, AST, ALP, TBL, group (values ×ULN; AST may be left blank)', { textarea: true, rows: 9, wide: true, placeholder: 'PA-301-0147, 9.8, 7.1, 1.4, 3.2, coded AE' });
    ta.input.classList.add('mono'); ta.input.setAttribute('wrap', 'off'); ta.input.style.fontFamily = 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';
    ta.input.style.fontSize = '13px';
    const nArm = numF('Patients in the arm (denominator, optional)', '');
    const batchNote = h('p', { class: 'note', 'aria-live': 'polite' });
    batch.appendChild(presetRow([
      ['Load book example (Figure 13.1, PA-301 Product A arm)', () => { ta.input.value = pa301Lines('Product A'); set(nArm, D.pa301.N['Product A']); batchNote.textContent = 'Loaded: synthetic PA-301 Product A arm, controlled period — every patient with a hepatic AE record or ALT >3×ULN (27 patients). AST is not in the teaching dataset.'; calcB(); }, 'pa301'],
      ['PA-301 placebo arm', () => { ta.input.value = pa301Lines('Placebo'); set(nArm, D.pa301.N.Placebo); batchNote.textContent = 'Loaded: synthetic PA-301 placebo arm, controlled period.'; calcB(); }, 'pa301pbo'],
      ['Load book example (Example 13.2, three profiles)', () => { ta.input.value = EX132_LINES; set(nArm, ''); batchNote.textContent = 'Loaded: Example 13.2 (three patients, fictional antifungal trial).'; calcB(); }, 'ex132'],
    ]));
    batch.appendChild(batchNote);
    batch.appendChild(h('div', { class: 'fields' }, [ta.wrap]));
    batch.appendChild(h('div', { class: 'fields' }, [nArm.wrap]));
    const resB = h('div', { id: 'liver-batch-results', 'aria-live': 'polite' });
    batch.appendChild(resB);
    el.appendChild(batch);
    ta.input.addEventListener('input', calcB); nArm.input.addEventListener('input', calcB); cutF.input.addEventListener('input', calcB);

    let lastRows = [];
    function calcB() {
      const cut = fin(val(cutF)) ? val(cutF) : 2;
      const N = val(nArm);
      const lines = parseLines(ta.input.value);
      const bad = [];
      const pts = [];
      lines.forEach((f, i) => {
        const p = { id: f[0], x: { alt: pf(f[1]), ast: pf(f[2]), alp: pf(f[3]), tbl: pf(f[4]) }, group: (f[5] || '').trim() };
        if (!fin(p.x.alt) || !fin(p.x.tbl)) { if (!(i === 0 && /alt/i.test(f[1] || ''))) bad.push(f.join(', ')); return; }
        p.r = liverEval(p.x, cut);
        pts.push(p);
      });
      resB.innerHTML = '';
      if (!pts.length) { resB.appendChild(WB.note('Paste patient lines or load a book example.')); return; }
      const cnt = (fn) => pts.filter(fn).length;
      const share = (n) => (fin(N) && N > 0 ? `${n} of ${N} (${WB.pct(n, N, 1)})` : `${n} patients listed`);
      const n3 = cnt((p) => p.x.alt > 3), n5 = cnt((p) => p.x.alt > 5), nB = cnt((p) => p.r.naive), nH = cnt((p) => p.r.screen);
      resB.appendChild(h('div', { class: 'result' }, [
        stat('b-n', 'Patients listed', String(pts.length), bad.length ? `${bad.length} line(s) skipped` : 'all lines read'),
        stat('b-alt3', 'ALT >3×ULN', String(n3), share(n3)),
        stat('b-alt5', 'ALT >5×ULN', String(n5), share(n5)),
        stat('b-both', 'ALT/AST >3× and TBL >2×ULN', String(nB), share(nB)),
        stat('b-hy', 'Potential Hy’s law screen', String(nH), `also ALP <${F(cut, 1)}×ULN`),
      ]));
      if (bad.length) resB.appendChild(WB.callout('warn', 'Lines not read', h('ul', {}, bad.map((b) => h('li', {}, b)))));
      // eDISH
      const seen = {};
      const points = pts.map((p) => {
        const key = F(p.x.alt, 2) + '|' + F(p.x.tbl, 2);
        const k = (seen[key] = (seen[key] || 0) + 1) - 1;
        const lab = /lab/i.test(p.group);
        const show = pts.length <= 6 || p.r.screen || p.x.tbl >= 1.5;
        return { x: p.x.alt * Math.pow(1.045, k), y: p.x.tbl, kind: p.r.screen ? 'hl' : lab ? 'open' : '', label: show ? String(p.id).replace(/^PA-301-/, '') : '' };
      });
      const maxAlt = Math.max(...pts.map((p) => p.x.alt));
      const svg = WB.logScatter(points, { xLines: [3], yLines: [2], xmax: maxAlt > 25 ? 100 : 30, xLabel: 'Peak ALT (×ULN, log scale)', yLabel: 'Peak total bilirubin (×ULN, log scale)', quadLabel: 'Potential Hy’s law quadrant', aria: `eDISH plot of peak ALT against peak total bilirubin for ${pts.length} patients; ${nB} in the upper right quadrant (ALT >3×ULN and bilirubin >2×ULN).` });
      svg.setAttribute('data-k', 'edish');
      resB.appendChild(chartWrap(svg, 480));
      resB.appendChild(h('p', { class: 'note' }, 'Key: filled circle, coded hepatic AE; open square, laboratory only (no AE reported); amber circle with ID, potential Hy’s law screen met. Dashed lines at ALT 3×ULN and bilirubin 2×ULN; log scales; coincident points offset slightly. Peak ALT and bilirubin may come from different days.'));
      // table
      const head = ['ID', 'ALT', 'AST', 'ALP', 'TBL', 'R', 'Pattern', 'DILI criteria', 'ALT/AST >3 & TBL >2', 'Screen (ALP <' + F(cut, 1) + ')', 'Group'];
      lastRows = pts.map((p) => [p.id, F(p.x.alt, 1), F(p.x.ast, 1), F(p.x.alp, 1), F(p.x.tbl, 1), F(p.r.R, 1), (p.r.dili.length ? p.r.pattern.replace(/ \(.*/, '') : 'No DILI criterion met'), p.r.dili.join('; ') || '—', p.r.naive ? 'Yes' : 'No', p.r.screen ? 'Yes' : 'No', p.group || '']);
      const tbl = WB.table(head, lastRows.map((r) => r.map((c, j) => (j >= 8 && j <= 9 ? h('span', { class: 'pill ' + (c === 'Yes' ? 'yes' : 'no') }, c) : c))), { compact: true, caption: 'Screening table (multiples of ULN)' });
      tbl.querySelectorAll('tbody tr').forEach((tr, i) => { if (pts[i].r.screen) tr.classList.add('hit'); tr.firstChild.style.whiteSpace = 'nowrap'; });
      tbl.setAttribute('data-k', 'batch-table');
      tbl.querySelectorAll('td').forEach((td) => (td.style.whiteSpace = 'nowrap'));
      resB.appendChild(tbl);
      resB.appendChild(h('div', { class: 'btn-row' }, [h('button', { class: 'btn small', type: 'button', onclick: () => WB.exportCSV('liver-screen.csv', head, lastRows) }, 'Export table (CSV)')]));
    }

    el.appendChild(interpretation([
      'The R ratio classifies the pattern of injury; it is not a severity grade. The DILI biochemical criteria define a case of liver injury worth assessing; the Hy’s law screen picks out hepatocellular injury severe enough to raise bilirubin, which predicts serious hepatotoxicity. Meeting the screen is not a Hy’s law case: the third component needs a work-up that excludes other causes, and Hy’s law’s first component is an imbalance against control across the program.',
      'Keep three judgments apart: what the coded terms say (coding), whether the patient meets the case definition (classification), and whether the drug caused it (causality, recorded separately). In PA-301, 5 of the 18 Product A patients with ALT >3×ULN had no hepatic AE reported, so build the eDISH plot from laboratory data, not from the query output.',
    ]));
    el.appendChild(bookLink('Chapter 13, Case 13.1, Example 13.2, Worksheet 3 and Figure 13.1; Chapter 15, Case 15.2; Chapter 22.'));
    single.querySelector('[data-preset="idx"]').click();
    batch.querySelector('[data-preset="pa301"]').click();
  }

  /* =====================================================================
     2. Incidence, EAIR and reporting rates (Chapters 15, 16)
     ===================================================================== */
  function renderRates(el) {
    el.appendChild(howTo('Panel A compares two arms or cohorts. Enter, for each, the number of patients, the patients with at least one event, the events (optional), total exposure in patient-years (PY) and PY at risk up to the first event. The tool gives crude incidence, event rates, the exposure-adjusted incidence rate (EAIR) with an exact Poisson interval, and every ratio side by side. Panel B turns postmarketing report counts into reporting rates per 1,000 PY of estimated exposure, period by period, and shows what happens when surplus duplicates and stimulated reports are set aside (they are never deleted).'));

    /* ---------- Panel A ---------- */
    const pa = h('div', { class: 'panel', id: 'rates-a' });
    pa.appendChild(h('h2', {}, 'A. Two-arm comparison: incidence, event rate and EAIR'));
    const arm = (n) => ({
      label: txtF(`Arm ${n} label`, n === 1 ? 'Active' : 'Comparator'),
      N: numF('Patients (N)', ''), pts: numF('Patients with ≥1 event', ''), ev: numF('Events (optional)', ''),
      py: numF('Total exposure (PY, optional)', ''), pyr: numF('PY at risk to first event', ''),
      aside: numF('Events to set aside (optional)', '', { hint: 'Sensitivity: e.g. recurrent events in a few patients.' }),
    });
    const A1 = arm(1), A2 = arm(2);
    const noteA = h('p', { class: 'note', 'aria-live': 'polite' });
    function loadA(p) {
      [[A1, p.a1], [A2, p.a2]].forEach(([A, v]) => Object.keys(A).forEach((k) => set(A[k], v[k] ?? '')));
      noteA.textContent = 'Loaded: ' + p.label;
      calcA();
    }
    const inf = D.pa301.infections;
    pa.appendChild(presetRow([
      ['Load book example (Case 15.1, infections)', () => loadA({ label: 'Case 15.1, PA-301 controlled-period infections (synthetic; data cutoff 28 February 2023).',
        a1: { label: 'Product A', N: D.pa301.N['Product A'], pts: inf.patients['Product A'][0], ev: inf.events['Product A'], py: D.pa301.PY['Product A'], pyr: inf.PY_at_risk_to_first_event['Product A'], aside: 19 },
        a2: { label: 'Placebo', N: D.pa301.N.Placebo, pts: inf.patients.Placebo[0], ev: inf.events.Placebo, py: D.pa301.PY.Placebo, pyr: inf.PY_at_risk_to_first_event.Placebo, aside: 0 } }), 'c151'],
      ['Load book example (Example 15.2, unequal follow-up)', () => loadA({ label: 'Example 15.2, two cohorts of a fictional long-term extension (first serious infection).',
        a1: { label: 'Cohort 1', N: 300, pts: 18, ev: '', py: '', pyr: 480, aside: '' }, a2: { label: 'Cohort 2', N: 150, pts: 6, ev: '', py: '', pyr: 120, aside: '' } }), 'e152'],
    ]));
    pa.appendChild(noteA);
    const col = (A) => h('div', {}, [h('div', { class: 'fields' }, [A.label.wrap]), h('div', { class: 'fields' }, [A.N.wrap, A.pts.wrap]), h('div', { class: 'fields' }, [A.ev.wrap, A.aside.wrap]), h('div', { class: 'fields' }, [A.py.wrap, A.pyr.wrap])]);
    pa.appendChild(h('div', { class: 'grid2' }, [col(A1), col(A2)]));
    const resA = h('div', { id: 'rates-a-results', 'aria-live': 'polite' });
    pa.appendChild(resA);
    pa.appendChild(WB.callout('warn', 'Assumptions behind the EAIR', 'The EAIR assumes a constant hazard: the risk of a first event per unit time does not change with time on treatment. It also assumes that time at risk is defined the same way in both arms (stopping at the first event, discontinuation or end of period) and that patients who stop early are no more or less likely to have the event. Do not compare EAIRs from periods of different length; check with a cumulative incidence plot or a common time window.'));
    el.appendChild(pa);
    Object.values(A1).concat(Object.values(A2)).forEach((f) => f.input.addEventListener('input', calcA));

    function calcA() {
      const g = (A) => ({ label: A.label.input.value || 'Arm', N: val(A.N), pts: val(A.pts), ev: val(A.ev), py: val(A.py), pyr: val(A.pyr), aside: val(A.aside) });
      const a = g(A1), b = g(A2);
      resA.innerHTML = '';
      const inc = (x) => (fin(x.pts) && x.N > 0 ? (100 * x.pts) / x.N : NaN);
      const er = (x, k) => (fin(k) && x.py > 0 ? (100 * k) / x.py : NaN);
      const ea = (x) => (fin(x.pts) && x.pyr > 0 ? S.rate(x.pts, x.pyr, 100) : { rate: NaN, lo: NaN, hi: NaN });
      const ratio = (p, q) => (fin(p) && fin(q) && q > 0 ? p / q : NaN);
      const eaA = ea(a), eaB = ea(b);
      const rr = fin(a.pts) && fin(b.pts) && a.pts > 0 && b.pts > 0 && a.pyr > 0 && b.pyr > 0 ? S.rateRatio(a.pts, a.pyr, b.pts, b.pyr) : { rr: NaN, lo: NaN, hi: NaN };
      const erA = er(a, a.ev), erB = er(b, b.ev);
      const hasAside = (fin(a.aside) && a.aside > 0) || (fin(b.aside) && b.aside > 0);
      const erA2 = er(a, a.ev - (fin(a.aside) ? a.aside : 0)), erB2 = er(b, b.ev - (fin(b.aside) ? b.aside : 0));
      const fu = (x) => (x.py > 0 && x.N > 0 ? x.py / x.N : x.pyr > 0 && x.N > 0 ? x.pyr / x.N : NaN);
      const fuSrc = a.py > 0 && b.py > 0 ? 'total exposure' : 'PY at risk';
      const rows = [
        ['Patients (N)', nf(a.N), nf(b.N), F(ratio(a.N, b.N), 2) + (fin(ratio(a.N, b.N)) ? ' (randomization)' : '')],
        ['Events', nf(a.ev), nf(b.ev), F(ratio(a.ev, b.ev), 2) + (fin(ratio(a.ev, b.ev)) ? ' (naive count ratio)' : '')],
        [`Events per 100 PY (${nf(a.py, 1)} vs ${nf(b.py, 1)} PY)`, g3(erA), g3(erB), F(ratio(erA, erB), 2)],
      ];
      if (hasAside) rows.push([`Events per 100 PY, setting aside ${nf(a.aside || 0)} and ${nf(b.aside || 0)} events`, g3(erA2), g3(erB2), F(ratio(erA2, erB2), 2)]);
      rows.push(['Patients with ≥1 event, n (%)', fin(a.pts) ? `${nf(a.pts)} (${pc(inc(a))})` : '—', fin(b.pts) ? `${nf(b.pts)} (${pc(inc(b))})` : '—', F(ratio(inc(a), inc(b)), 2)]);
      rows.push([`EAIR per 100 PY at risk (${nf(a.pyr, 1)} vs ${nf(b.pyr, 1)} PY), exact 95% CI`, fin(eaA.rate) ? `${g3(eaA.rate)} (${ci3(eaA.lo, eaA.hi)})` : '—', fin(eaB.rate) ? `${g3(eaB.rate)} (${ci3(eaB.lo, eaB.hi)})` : '—', fin(rr.rr) ? `${F(rr.rr, 2)} (${ci(rr.lo, rr.hi)})` : '—']);
      rows.push([`Follow-up per patient (PY, from ${fuSrc})`, F(fu(a), 2), F(fu(b), 2), F(ratio(fu(a), fu(b)), 2)]);
      const t = WB.table(['Measure', a.label, b.label, 'Ratio'], rows, { caption: 'Each measure answers a different question: events for “how much”, patients for “how many”, EAIR for “how quickly”.' });
      t.setAttribute('data-k', 'a-table');
      t.firstChild.style.minWidth = '620px';
      resA.appendChild(h('div', { class: 'result' }, [
        stat('a-inc', 'Crude incidence', `${pc(inc(a))} vs ${pc(inc(b))}`, `ratio ${F(ratio(inc(a), inc(b)), 2)}`),
        stat('a-eair', 'EAIR per 100 PY', `${g3(eaA.rate)} vs ${g3(eaB.rate)}`, `exact 95% CI ${ci3(eaA.lo, eaA.hi)} and ${ci3(eaB.lo, eaB.hi)}`),
        stat('a-rr', 'EAIR rate ratio', F(rr.rr, 2), `95% CI ${ci(rr.lo, rr.hi)} (log method)`),
        stat('a-er', 'Event rate ratio', F(ratio(erA, erB), 2), fin(erA) ? `${g3(erA)} vs ${g3(erB)} events per 100 PY` : 'needs events and total PY'),
        stat('a-naive', 'Event-count ratio', F(ratio(a.ev, b.ev), 2), fin(ratio(a.ev, b.ev)) ? `naive; randomization alone gives ${F(ratio(a.N, b.N), 2)}` : 'needs events'),
      ]));
      resA.appendChild(t);
      const fr = [];
      if (fin(ratio(a.ev, b.ev))) fr.push({ label: 'Events (count)', est: ratio(a.ev, b.ev), lo: ratio(a.ev, b.ev), hi: ratio(a.ev, b.ev), noci: true });
      if (fin(ratio(erA, erB))) fr.push({ label: 'Events per 100 PY', est: ratio(erA, erB), lo: ratio(erA, erB), hi: ratio(erA, erB), noci: true });
      if (fin(ratio(inc(a), inc(b)))) fr.push({ label: 'Patients with ≥1 event', est: ratio(inc(a), inc(b)), lo: ratio(inc(a), inc(b)), hi: ratio(inc(a), inc(b)), noci: true });
      if (fin(rr.rr)) fr.push({ label: 'EAIR (95% CI)', est: rr.rr, lo: rr.lo, hi: rr.hi });
      if (fr.length) {
        const rnd = ratio(a.N, b.N);
        const svg = WB.forest(fr, { min: 0.1, max: 10, threshold: fin(rnd) && Math.abs(rnd - 1) > 0.01 ? rnd : null, xLabel: 'Ratio, ' + a.label + ' ÷ ' + b.label + ' (log scale)', aria: 'Ratios by counting unit: ' + fr.map((r) => r.label + ' ' + F(r.est, 2)).join('; ') });
        svg.querySelectorAll('text.val').forEach((t, i) => { if (fr[i].noci) t.textContent = F(fr[i].est, 2); });
        resA.appendChild(chartWrap(svg));
        resA.appendChild(h('p', { class: 'note' }, 'Red dashed line at 1: no difference. ' + (fin(rnd) && Math.abs(rnd - 1) > 0.01 ? `Grey dashed line at ${F(rnd, 2)}: the ratio the allocation alone produces when event counts are compared without denominators. ` : '') + 'Squares are point estimates; only the EAIR ratio carries a confidence interval.'));
      }
      const fA = fu(a), fB = fu(b);
      if (fin(fA) && fin(fB) && Math.max(fA, fB) / Math.min(fA, fB) > 1.25) {
        resA.appendChild(WB.callout('warn', 'Follow-up differs between the groups', `${F(fA, 2)} vs ${F(fB, 2)} PY per patient: crude proportions mostly measure how long patients were watched. Prefer the EAIR with its constant-hazard assumption stated, or compare over a common time window.`));
      }
    }

    /* ---------- Panel B ---------- */
    const pb = h('div', { class: 'panel', id: 'rates-b' });
    pb.appendChild(h('h2', {}, 'B. Postmarketing reporting rates by period'));
    pb.appendChild(h('p', { class: 'muted' }, 'Reports = reports retrieved by the same query, version, scope and counting rules in every period. “Surplus duplicates” = reports beyond the first for a patient already in the count (7 reports of one case = 6). “Set aside” = reports excluded in a sensitivity calculation only (for example article-citing reports without clinical data); they stay in the database and in cumulative counts.'));
    const noteB = h('p', { class: 'note', 'aria-live': 'polite' });
    let rowsB = [];
    const cumF = checkF('Show cumulative row', true, () => calcB());
    const refSel = selectF('Reference period for comparison', [['0', 'Row 1']], '0', () => calcB());
    const pm = D.postmarketing;
    function loadB(rows, opts) {
      rowsB = rows.map((r) => Object.assign({ period: '', reports: '', py: '', all: '', dup: '', aside: '' }, r));
      cumF.input.checked = !!opts.cum;
      drawGrid(); refSel.input.value = String(opts.ref || 0);
      noteB.textContent = opts.label ? 'Loaded: ' + opts.label : '';
      if (opts.conv) { set(cv.units, opts.conv.units); set(cv.per, opts.conv.per); set(cv.und, opts.conv.und); set(cv.rep, opts.conv.rep); }
      calcB(); calcConv();
    }
    const pmRows = (h2) => pm.periods.map((p, i) => ({ period: p, reports: pm.hepatic_SMQ_reports[i], py: pm.exposure_PY[i], all: pm.all_reports[i], dup: h2 && p === '2025 H2' ? 6 : '', aside: h2 && p === '2025 H2' ? 19 : '' }));
    pb.appendChild(presetRow([
      ['Load book example (Table 16.1, Product A hepatic half-years)', () => loadB(pmRows(false), { cum: true, label: 'Table 16.1 — Product A hepatic SMQ reports (narrow), synthetic; exposure estimated from sales.' }), 'pm'],
      ['Load book example (Case 16.1, 2025 H2 decomposition)', () => loadB(pmRows(true), { cum: true, ref: 2, label: 'Case 16.1 / Table 16.2 — 2025 H2 with 6 surplus duplicates of the literature case and 19 article-citing reports set aside.' }), 'c161'],
      ['Load book example (Example 16.3, corrected denominator)', () => loadB([
        { period: '2026 H1', reports: 22, py: 13100 }, { period: '2026 Q3, sales', reports: 12, py: 7000 }, { period: '2026 Q3, corrected', reports: 12, py: 5800 },
      ], { cum: false, ref: 0, conv: { units: 2555000, per: 1, und: 438000, rep: 12 }, label: 'Example 16.3 — 2026 Q3 de-duplicated hepatic cases on sales-based and corrected exposure, against 2026 H1.' }), 'e163'],
    ]));
    pb.appendChild(noteB);
    const gridBox = h('div', { class: 'tbl-wrap' });
    pb.appendChild(gridBox);
    pb.appendChild(h('div', { class: 'btn-row' }, [
      h('button', { class: 'btn small', type: 'button', onclick: () => { rowsB.push({ period: 'Period ' + (rowsB.length + 1), reports: '', py: '', all: '', dup: '', aside: '' }); drawGrid(); calcB(); } }, 'Add period'),
    ]));
    pb.appendChild(h('div', { class: 'fields' }, [refSel.wrap, h('div', { class: 'field' }, [cumF.wrap])]));
    const resB = h('div', { id: 'rates-b-results', 'aria-live': 'polite' });
    pb.appendChild(resB);

    // exposure converter
    const cv = { units: numF('Units sold in the period', ''), per: numF('Units per patient-day', 1, { hint: 'Once-daily tablet = 1.' }), und: numF('Units not dispensed in the period (optional)', ''), rep: numF('Reports or cases in the period (optional)', '') };
    const resCv = h('div', { id: 'rates-conv', 'aria-live': 'polite' });
    pb.appendChild(h('details', {}, [h('summary', {}, 'Exposure from sales: units to patient-years'), h('p', { class: 'muted' }, 'PY = units ÷ units per patient-day ÷ 365. Assumes dispensed product is taken as prescribed, in the period it was sold, at the assumed daily dose; it says nothing about who was treated.'), h('div', { class: 'fields' }, Object.values(cv).map((f) => f.wrap)), resCv]));
    onAll(Object.values(cv), calcConv);
    function calcConv() {
      const u = val(cv.units), per = val(cv.per) > 0 ? val(cv.per) : 1, und = fin(val(cv.und)) ? val(cv.und) : 0, k = val(cv.rep);
      const py1 = u / per / 365, py2 = (u - und) / per / 365;
      resCv.innerHTML = '';
      if (!fin(u)) { resCv.appendChild(WB.note('Enter units sold.')); return; }
      resCv.appendChild(h('div', { class: 'result' }, [
        stat('cv-py', 'Exposure on sales', nf(py1) + ' PY', `${nf(u)} ÷ ${per} ÷ 365`),
        und ? stat('cv-py2', 'Exposure corrected', nf(py2) + ' PY', `${nf(u - und)} units dispensed`) : null,
        fin(k) ? stat('cv-r1', 'Rate on sales', F((k / py1) * 1000, 2), 'per 1,000 PY') : null,
        fin(k) && und ? stat('cv-r2', 'Rate corrected', F((k / py2) * 1000, 2), `per 1,000 PY; ${F(py1 / py2, 2)}× the sales-based rate`) : null,
      ]));
    }

    function drawGrid() {
      gridBox.innerHTML = '';
      const cols = [['period', 'Period', 'text'], ['reports', 'Reports'], ['py', 'Exposure (PY)'], ['all', 'All reports (optional)'], ['dup', 'Surplus duplicates'], ['aside', 'Set aside (stimulated)']];
      const t = h('table', { class: 'tbl compact', id: 'rates-grid' });
      t.appendChild(h('caption', {}, 'Editable reporting table'));
      t.appendChild(h('thead', {}, h('tr', {}, cols.map((c) => h('th', { scope: 'col' }, c[1])).concat([h('th', { scope: 'col' }, h('span', { class: 'note' }, 'Remove'))]))));
      const tb = h('tbody');
      rowsB.forEach((r, i) => {
        const tr = h('tr');
        cols.forEach((c) => {
          const inp = h('input', { type: c[2] || 'number', step: 'any', 'aria-label': `${c[1]}, row ${i + 1}`, style: 'min-width:' + (c[2] ? '120px' : '84px'), 'data-col': c[0], 'data-row': String(i) });
          inp.value = r[c[0]] ?? '';
          inp.addEventListener('input', () => { r[c[0]] = c[2] ? inp.value : inp.value === '' ? '' : WB.num(inp); calcB(); });
          tr.appendChild(h('td', {}, inp));
        });
        tr.appendChild(h('td', {}, h('button', { class: 'btn small', type: 'button', 'aria-label': 'Remove row ' + (i + 1), onclick: () => { rowsB.splice(i, 1); drawGrid(); calcB(); } }, '×')));
        tb.appendChild(tr);
      });
      t.appendChild(tb);
      gridBox.appendChild(t);
      const cur = refSel.input.value;
      refSel.input.innerHTML = '';
      rowsB.forEach((r, i) => refSel.input.appendChild(h('option', { value: String(i) }, r.period || 'Row ' + (i + 1))));
      refSel.input.value = Number(cur) < rowsB.length ? cur : '0';
    }

    function calcB() {
      resB.innerHTML = '';
      Array.from(refSel.input.options).forEach((o, i) => { if (rowsB[i]) o.textContent = rowsB[i].period || 'Row ' + (i + 1); });
      const rs = rowsB.map((r) => {
        const k = pf(r.reports), py = pf(r.py), all = pf(r.all), dup = fin(pf(r.dup)) ? pf(r.dup) : 0, aside = fin(pf(r.aside)) ? pf(r.aside) : 0;
        const rate = fin(k) && py > 0 ? (k / py) * 1000 : NaN;
        const c = fin(k) && py > 0 ? S.poissonCI(k) : [NaN, NaN];
        return { r, k, py, all, dup, aside, rate, lo: (c[0] / py) * 1000, hi: (c[1] / py) * 1000, share: fin(all) && all > 0 ? (100 * k) / all : NaN, allRate: fin(all) && py > 0 ? (all / py) * 1000 : NaN, adj1: fin(k) ? k - dup : NaN, adj2: fin(k) ? k - dup - aside : NaN };
      });
      if (!rs.length) { resB.appendChild(WB.note('Add a period or load a book example.')); return; }
      const ref = rs[Number(refSel.input.value) || 0];
      const caseRate = (x) => (x.py > 0 ? (x.adj2 / x.py) * 1000 : NaN); // after both set-asides
      const head = ['Period', 'Reports', 'Exposure (PY)', 'Per 1,000 PY (exact 95% CI)', 'Share of all reports', 'All reports per 1,000 PY', 'vs previous', 'vs reference'];
      const rows = rs.map((x, i) => {
        const prev = i > 0 ? rs[i - 1] : null;
        return [x.r.period || 'Row ' + (i + 1), nf(x.k), nf(x.py), fin(x.rate) ? `${F(x.rate, 2)} (${ci(x.lo, x.hi, 2)})` : '—', pc(x.share), F(x.allRate, 1),
          prev && fin(prev.rate) && fin(x.rate) ? F(x.rate / prev.rate, 2) + '×' : '—', x !== ref && fin(ref.rate) && fin(x.rate) ? F(x.rate / ref.rate, 2) + '×' : x === ref ? 'reference' : '—'];
      });
      if (cumF.input.checked && rs.length > 1) {
        const K = rs.reduce((s, x) => s + (fin(x.k) ? x.k : 0), 0), P = rs.reduce((s, x) => s + (fin(x.py) ? x.py : 0), 0), A = rs.reduce((s, x) => s + (fin(x.all) ? x.all : 0), 0);
        const c = S.poissonCI(K);
        rows.push(['Cumulative', nf(K), nf(P), P > 0 ? `${F((K / P) * 1000, 2)} (${ci((c[0] / P) * 1000, (c[1] / P) * 1000, 2)})` : '—', A > 0 ? pc((100 * K) / A) : '—', A > 0 && P > 0 ? F((A / P) * 1000, 1) : '—', '', '']);
      }
      const t = WB.table(head, rows, { compact: true, caption: 'Reporting rates (reports per 1,000 PY of estimated exposure; not incidence)' });
      t.setAttribute('data-k', 'b-table');
      t.firstChild.style.minWidth = '760px';
      resB.appendChild(t);
      // chart
      const anyAdj = rs.some((x) => x.dup || x.aside);
      const items = rs.filter((x) => fin(x.rate)).map((x) => {
        const it = { label: x.r.period || '', value: x.rate, text1: F(x.rate, 2) };
        if (anyAdj && (x.dup || x.aside)) { it.value2 = caseRate(x); it.text2 = F(caseRate(x), 2) + ' adjusted'; }
        return it;
      });
      if (items.length) {
        const svg = WB.barChart(items, { left: 150, dp: 2, series: anyAdj ? ['All reports', 'After de-duplication and set-asides'] : ['Reports per 1,000 PY'], aria: 'Reporting rate per 1,000 patient-years by period: ' + items.map((i) => `${i.label} ${i.text1}` + (i.text2 ? `, ${i.text2}` : '')).join('; ') });
        resB.appendChild(chartWrap(svg));
      }
      // new-product note
      const first = rs[0];
      if (rs.length > 2 && fin(first.rate) && first.py === Math.min(...rs.map((x) => x.py)) && first.rate === Math.max(...rs.map((x) => (fin(x.rate) ? x.rate : -1)))) {
        resB.appendChild(WB.callout('', 'Early-period rate', `${first.r.period} has the smallest exposure (${nf(first.py)} PY) and the highest rate (${F(first.rate, 2)}). Early post-launch reporting and a small denominator both inflate it (new-product reporting pattern); interpret it cautiously.`));
      }
      // decomposition
      rs.forEach((x, i) => {
        if (!(x.dup || x.aside) || !fin(x.k)) return;
        const prev = i > 0 ? rs[i - 1] : null;
        const drows = [['All reports', nf(x.k), F(x.rate, 2)]];
        drows.push([`After de-duplication (${nf(x.dup)} surplus duplicate${x.dup === 1 ? '' : 's'} removed)`, nf(x.adj1), F((x.adj1 / x.py) * 1000, 2)]);
        if (x.aside) drows.push([`Also setting aside ${nf(x.aside)} report${x.aside === 1 ? '' : 's'}`, nf(x.adj2), F(caseRate(x), 2)]);
        if (prev && fin(prev.rate)) drows.push([`Comparison: ${prev.r.period}` + (prev.dup || prev.aside ? ' (after its own set-asides)' : ', all reports'), nf(prev.adj2), F(caseRate(prev), 2)]);
        const dt = WB.table(['Step', 'Count', 'Per 1,000 PY'], drows, { compact: true, caption: `Decomposing ${x.r.period} (exposure ${nf(x.py)} PY)` });
        dt.setAttribute('data-k', 'decomp');
        resB.appendChild(dt);
        if (prev) {
          const bits = [];
          if (prev.py > 0) bits.push(`exposure grew ${F(x.py / prev.py, 2)}-fold while reports grew ${F(x.k / prev.k, 2)}-fold`);
          if (fin(x.allRate) && fin(prev.allRate)) bits.push(`reporting of all events went from ${F(prev.allRate, 1)} to ${F(x.allRate, 1)} per 1,000 PY`);
          if (fin(x.share) && fin(prev.share)) bits.push(`the share of all reports went from ${pc(prev.share)} to ${pc(x.share)}`);
          if (bits.length) resB.appendChild(h('p', { 'data-k': 'decomp-text' }, `Against ${prev.r.period}, ` + bits.join('; ') + '. Present the full and adjusted rates side by side; set-aside reports are retained, flagged and followed up.'));
        }
      });
    }

    el.appendChild(pb);
    el.appendChild(interpretation([
      'In a randomized trial, compare patients and exposure before calling an imbalance a finding: an event-count ratio mostly reflects the allocation and recurrences. The EAIR answers “how quickly did patients have a first event” and depends on the constant-hazard assumption; its interval shows what the data are compatible with, not whether a risk exists.',
      'A postmarketing reporting rate is not an incidence. Its numerator is incomplete to an unknown and changing degree and its denominator is an estimate, so use it to compare a product with itself over time, with the same query, version and counting rules. Check exposure growth, duplicates, stimulated reporting and new-product patterns before reading a change in reports as a change in risk; none of these steps says anything about causality, which needs case review.',
    ]));
    el.appendChild(bookLink('Chapter 15, Case 15.1 and Example 15.2; Chapter 16, Table 16.1, Case 16.1 (Table 16.2) and Example 16.3.'));
    pa.querySelector('[data-preset="c151"]').click();
    pb.querySelector('[data-preset="c161"]').click();
  }

  /* =====================================================================
     3. Disproportionality screen (Chapter 17)
     ===================================================================== */
  const CANON_DP = Object.entries(D.disproportionality.rows).map(([k, r]) => ({ label: k, a: r.a, b: r.b, c: r.c, d: r.d }));
  const shortLabel = (l) => String(l).replace(' - comprehensive search', '');

  function renderDisp(el) {
    el.appendChild(WB.callout('bad', 'Screening of reporting patterns only', 'Disproportionality compares how often a term is reported for a product, relative to its other reports, with how often it is reported for all other products. It is not an incidence, not a risk and not evidence of causation. A high value can reflect the indication (Case 17.1), and a value below 1 can still hide a series that needs investigation (Case 17.3: two unconfounded, biopsy-supported SJS/TEN cases with ROR 0.48).'));
    el.appendChild(howTo('Enter the four cells of the 2×2 table (or the product, event and database totals) to get the reporting odds ratio (ROR), the proportional reporting ratio (PRR), Yates’ chi-squared, the expected count, observed/expected and a simply shrunk observed/expected, (O + 0.5)/(E + 0.5). Set your organization’s threshold rules to see whether the pair alerts. The screening table at the bottom runs many product–term pairs at once and draws them on a forest plot.'));

    /* thresholds */
    const th = { prr: numF('Evans rule: PRR at least', 2), chi: numF('Evans rule: χ² at least', 4), aE: numF('Evans rule: a at least', 3), lo: numF('ROR rule: lower 95% bound above', 1), aR: numF('ROR rule: a at least', 3) };
    const thP = panel('Threshold rules (your organization’s convention)', [h('div', { class: 'fields' }, Object.values(th).map((f) => f.wrap)), WB.note('Thresholds trade sensitivity against workload; the number has no biological meaning. State the rule, who approved it and when.')]);
    function rules(r, a) {
      const t = { prr: val(th.prr), chi: val(th.chi), aE: val(th.aE), lo: val(th.lo), aR: val(th.aR) };
      return {
        evans: fin(r.prr) && r.prr >= t.prr && r.chi2 >= t.chi && a >= t.aE,
        ror: fin(r.rorLo) && r.rorLo > t.lo && a >= t.aR,
        evansTxt: `PRR ≥${F(t.prr, 1)}, χ² ≥${F(t.chi, 1)}, a ≥${fin(t.aE) ? t.aE : '—'}` + ([t.prr, t.chi, t.aE].every(fin) ? '' : '; a threshold is blank, so the rule cannot alert'),
        rorTxt: `lower 95% bound of ROR >${F(t.lo, 2)} with a ≥${fin(t.aR) ? t.aR : '—'}` + ([t.lo, t.aR].every(fin) ? '' : '; a threshold is blank, so the rule cannot alert'),
      };
    }

    /* single 2×2 */
    const sp = h('div', { class: 'panel', id: 'dp-single' });
    sp.appendChild(h('h2', {}, 'One product–term pair'));
    const modeSel = selectF('Enter as', [['cells', 'Cells a, b, c, d'], ['tot', 'Totals: a, product total, event total, database total']], 'cells', () => { showMode(); calc(); });
    const lab = txtF('Product–term label', '', { placeholder: 'e.g. PT Drug-induced liver injury' });
    const fc = { a: numF('a: product, with term', ''), b: numF('b: product, without term', ''), c: numF('c: other products, with term', ''), d: numF('d: other products, without term', '') };
    const ft = { a: numF('a: product reports with the term', ''), P: numF('Product total reports', ''), E: numF('Reports with the term (all products)', ''), N: numF('Database total reports', '') };
    const boxC = h('div', { class: 'fields' }, Object.values(fc).map((f) => f.wrap));
    const boxT = h('div', { class: 'fields' }, Object.values(ft).map((f) => f.wrap));
    function showMode() { const t = modeSel.input.value === 'tot'; boxC.style.display = t ? 'none' : ''; boxT.style.display = t ? '' : 'none'; }
    const spNote = h('p', { class: 'note', 'aria-live': 'polite' });
    function load(p, note) {
      modeSel.input.value = p.mode || 'cells'; showMode();
      set(lab, p.label);
      if (p.mode === 'tot') { set(ft.a, p.a); set(ft.P, p.P); set(ft.E, p.E); set(ft.N, p.N); }
      else { set(fc.a, p.a); set(fc.b, p.b); set(fc.c, p.c); set(fc.d, p.d); }
      if (p.th) { set(th.prr, 2); set(th.chi, 4); set(th.aE, 3); set(th.lo, 1); set(th.aR, p.th.aR); }
      spNote.textContent = note || '';
      calc();
    }
    const canonSel = selectF('Load a canon row (Product A, 4,200,000 reports, data lock 30 June 2026)', [['', 'Choose a row…']].concat(CANON_DP.map((r, i) => [String(i), r.label])), '', () => {
      const r = CANON_DP[Number(canonSel.input.value)];
      if (r) load({ mode: 'tot', label: r.label, a: r.a, P: r.a + r.b, E: r.a + r.c, N: r.a + r.b + r.c + r.d }, 'Loaded canon row (synthetic spontaneous database; Figure 17.2). Totals mode: product 2,281 reports; database 4,200,000 reports.');
    }, { wide: true });
    sp.appendChild(presetRow([
      ['Load book example (Table 17.1, drug-induced liver injury)', () => load({ mode: 'cells', label: 'PT Drug-induced liver injury', a: 12, b: 2269, c: 9438, d: 4188281 }, 'Table 17.1: Product A, synthetic database of 4,200,000 reports, data lock 30 June 2026.'), 't171'],
      ['Load book example (Example 17.1, pancreatitis)', () => load({ mode: 'tot', label: 'PT Pancreatitis', a: 14, P: 4000, E: 4000, N: 2000000, th: { aR: 3 } }, 'Example 17.1: fictional oral antidiabetic, synthetic database of 2,000,000 reports.'), 'e171'],
      ['Masking check (Chapter 17)', () => load({ mode: 'cells', label: 'PT Drug-induced liver injury', a: 12, b: 2269, c: 6438, d: 4131281 }, 'Hypothetical masking check: one heavily reported hepatotoxic drug (3,000 of the 9,438 DILI reports among its 60,000 reports) removed from the comparator.'), 'mask'],
      ['Stimulated reports excluded (Chapter 17)', () => load({ mode: 'cells', label: 'SMQ Drug related hepatic disorders - comprehensive search (narrow)', a: 83, b: 2173, c: 97892, d: 4099827 }, 'Notoriety sensitivity analysis: 19 article-citing reports and 6 surplus duplicates (25 reports) excluded from a = 108.'), 'notor'],
      ['Exercise 17.1', () => load({ mode: 'cells', label: 'SMQ Severe cutaneous adverse reactions (narrow)', a: 4, b: 2600, c: 11700, d: 4385700 }, 'Exercise 17.1 (hypothetical next data lock).'), 'x171'],
    ]));
    sp.appendChild(h('div', { class: 'fields' }, [canonSel.wrap]));
    sp.appendChild(spNote);
    sp.appendChild(h('div', { class: 'fields' }, [lab.wrap, modeSel.wrap]));
    sp.appendChild(boxC); sp.appendChild(boxT); showMode();
    const resS = h('div', { id: 'dp-results', 'aria-live': 'polite' });
    sp.appendChild(resS);
    el.appendChild(sp);
    el.appendChild(thP);
    onAll([lab].concat(Object.values(fc), Object.values(ft)), calc);
    onAll(Object.values(th), () => { calc(); calcT(); });

    function cells() {
      if (modeSel.input.value === 'tot') {
        const a = val(ft.a), P = val(ft.P), E = val(ft.E), N = val(ft.N);
        return { a, b: P - a, c: E - a, d: N - P - E + a };
      }
      return { a: val(fc.a), b: val(fc.b), c: val(fc.c), d: val(fc.d) };
    }
    function calc() {
      const x = cells();
      resS.innerHTML = '';
      if (![x.a, x.b, x.c, x.d].every(fin)) { resS.appendChild(WB.note('Enter all four values or load a book example.')); return; }
      if (x.a < 0 || x.b <= 0 || x.c <= 0 || x.d <= 0) { resS.appendChild(WB.callout('bad', 'Check the inputs', 'Cells b, c and d must be positive and a cannot be negative; totals must be consistent (product total ≥ a, event total ≥ a).')); return; }
      const P = x.a + x.b, Ct = x.c + x.d, E = x.a + x.c, N = P + Ct;
      const tb = WB.table(['Reports', 'With the term', 'Without the term', 'Total'], [
        ['Product', 'a = ' + nf(x.a), 'b = ' + nf(x.b), nf(P)], ['All other products', 'c = ' + nf(x.c), 'd = ' + nf(x.d), nf(Ct)], ['Total', nf(E), nf(x.b + x.d), nf(N)],
      ], { compact: true, caption: '2×2 table' });
      if (lab.input.value) tb.querySelector('caption').innerHTML = '2×2 table: ' + termHTML(lab.input.value);
      resS.appendChild(tb);
      if (x.a === 0) { resS.appendChild(WB.callout('warn', 'No reports for the pair', 'With a = 0 the ROR is 0 and its interval is undefined. Expected count: ' + F((P * E) / N, 2) + '.')); return; }
      const r = S.disproportionality(x.a, x.b, x.c, x.d);
      const ru = rules(r, x.a);
      resS.appendChild(h('div', { class: 'result' }, [
        stat('ror', 'ROR (95% CI)', F(r.ror, 2), ci(r.rorLo, r.rorHi) + ' (Woolf)'),
        stat('prr', 'PRR (95% CI)', F(r.prr, 2), ci(r.prrLo, r.prrHi)),
        stat('chi2', 'χ² (Yates)', F(r.chi2, 2), '1 degree of freedom'),
        stat('exp', 'Expected count', F(r.expected, 2), `(product total × term total) ÷ database = ${nf(P)} × ${nf(E)} ÷ ${nf(N)}`),
        stat('oe', 'Observed / expected', F(r.oe, 2), `${nf(x.a)} observed vs ${F(r.expected, 1)} expected`),
        stat('oes', 'Shrunk O/E', F(r.oeShrunk, 2), '(O + 0.5) ÷ (E + 0.5)'),
      ]));
      const se = Math.sqrt(1 / x.a + 1 / x.b + 1 / x.c + 1 / x.d);
      resS.appendChild(h('details', {}, [h('summary', {}, 'Show the arithmetic'), h('ul', {}, [
        h('li', {}, `ROR = (a/b) ÷ (c/d) = (${nf(x.a)}/${nf(x.b)}) ÷ (${nf(x.c)}/${nf(x.d)}) = ${(x.a / x.b).toFixed(6)} ÷ ${(x.c / x.d).toFixed(6)} = ${F(r.ror, 2)}`),
        h('li', {}, `SE of ln(ROR) = √(1/a + 1/b + 1/c + 1/d) = ${se.toFixed(4)}; ln(ROR) = ${Math.log(r.ror).toFixed(3)}; ± 1.96 × SE gives ${(Math.log(r.ror) - 1.96 * se).toFixed(3)} to ${(Math.log(r.ror) + 1.96 * se).toFixed(3)}; exponentiated ${ci(r.rorLo, r.rorHi)}`),
        h('li', {}, `PRR = (a/(a+b)) ÷ (c/(c+d)) = (${nf(x.a)}/${nf(P)}) ÷ (${nf(x.c)}/${nf(Ct)}) = ${F(r.prr, 2)}`),
        h('li', {}, `1/a contributes ${(1 / x.a).toFixed(4)} of ${(se * se).toFixed(4)} to the variance: small a makes the estimate unstable.`),
      ])]));
      const verdict = h('div', { 'data-k': 'rules' }, [
        h('p', {}, [h('strong', {}, 'Evans rule '), `(${ru.evansTxt}): `, yesNo(ru.evans, ru.evans ? 'alerts' : 'does not alert')]),
        h('p', {}, [h('strong', {}, 'ROR rule '), `(${ru.rorTxt}): `, yesNo(ru.ror, ru.ror ? 'alerts' : 'does not alert')]),
      ]);
      resS.appendChild(verdict);
      if (ru.evans !== ru.ror) resS.appendChild(WB.note('The two defensible rules disagree for this pair: the threshold is a governance choice with workload consequences (Example 17.1).'));
      const name = lab.input.value ? lab.input.value.replace(/^(PT|SMQ|HLT|HLGT|LLT|SOC)\s+/, '').replace(/\s*\((narrow|broad)\)$/, '') : 'The term';
      resS.appendChild(WB.callout('', 'Correct sentence', `“${name} was reported about ${F(r.ror, 1)} times as often, relative to other terms, for the product as for all other products in the database (ROR ${F(r.ror, 2)}, 95% CI ${ci(r.rorLo, r.rorHi)}; ${nf(x.a)} reports).” Not: “the product increases the risk ${F(r.ror, 1)}-fold” or “the incidence is ${F(r.ror, 2)} times higher”.`));
    }

    /* screening table */
    const tp = h('div', { class: 'panel', id: 'dp-table' });
    tp.appendChild(h('h2', {}, 'Screening table and forest plot'));
    const ta = WB.field('Pairs, one per line: label, a, b, c, d (label may start with PT or SMQ; “(narrow)” for scope)', { textarea: true, rows: 8, wide: true, placeholder: 'PT Drug-induced liver injury, 12, 2269, 9438, 4188281' });
    ta.input.classList.add('mono'); ta.input.setAttribute('wrap', 'off'); ta.input.style.fontFamily = 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace'; ta.input.style.fontSize = '13px';
    const tNote = h('p', { class: 'note', 'aria-live': 'polite' });
    tp.appendChild(presetRow([
      ['Load book example (Figure 17.2, seven canon rows)', () => { ta.input.value = '# label, a, b, c, d — Product A vs all other products; synthetic database 4,200,000 reports; data lock 30 June 2026\n' + CANON_DP.map((r) => [r.label, r.a, r.b, r.c, r.d].join(', ')).join('\n'); tNote.textContent = 'Loaded the seven canon rows (Chapter 17, Figure 17.2; MedDRA v29.0, SMQs v29.0).'; calcT(); }, 'canon7'],
    ]));
    tp.appendChild(tNote);
    tp.appendChild(h('div', { class: 'fields' }, [ta.wrap]));
    const resT = h('div', { id: 'dp-table-results', 'aria-live': 'polite' });
    tp.appendChild(resT);
    el.appendChild(tp);
    ta.input.addEventListener('input', calcT);
    let csvRows = [];
    function calcT() {
      resT.innerHTML = '';
      const lines = parseLines(ta.input.value);
      const rows = [], bad = [];
      lines.forEach((f) => {
        if (f.length < 5) { bad.push(f.join(', ')); return; }
        const n = f.slice(-4).map(pf), label = f.slice(0, f.length - 4).join(', ');
        if (!n.every(fin) || n[0] < 1 || n.slice(1).some((v) => v <= 0)) { bad.push(f.join(', ')); return; }
        const r = S.disproportionality(n[0], n[1], n[2], n[3]);
        rows.push({ label, a: n[0], r, ru: rules(r, n[0]) });
      });
      if (bad.length) resT.appendChild(WB.callout('warn', 'Lines not read (need label and four counts; a ≥ 1)', h('ul', {}, bad.map((b) => h('li', {}, b)))));
      if (!rows.length) { resT.appendChild(WB.note('Paste pairs or load the book rows.')); return; }
      const head = ['Product–term', 'a', 'Expected', 'ROR (95% CI)', 'PRR', 'χ²', 'Shrunk O/E', 'Evans rule', 'ROR rule'];
      csvRows = rows.map((x) => [x.label, x.a, F(x.r.expected, 2), `${F(x.r.ror, 2)} (${ci(x.r.rorLo, x.r.rorHi)})`, F(x.r.prr, 2), F(x.r.chi2, 2), F(x.r.oeShrunk, 2), x.ru.evans ? 'alert' : '—', x.ru.ror ? 'alert' : '—']);
      const t = WB.table(head, rows.map((x, i) => [termNode(x.label)].concat(csvRows[i].slice(1, 7), [alertPill(x.ru.evans), alertPill(x.ru.ror)])), { compact: true, caption: 'Disproportionality screen (reports; Woolf 95% CI)' });
      t.setAttribute('data-k', 'screen-table');
      t.firstChild.style.minWidth = '760px';
      resT.appendChild(t);
      const fr = rows.map((x) => ({ label: shortLabel(x.label), est: x.r.ror, lo: x.r.rorLo, hi: x.r.rorHi }));
      const svg = WB.forest(fr, { min: 0.1, max: 10, xLabel: 'Reporting odds ratio (log scale) with 95% CI', aria: 'Forest plot of reporting odds ratios: ' + fr.map((r) => `${r.label} ${F(r.est, 2)} (${ci(r.lo, r.hi)})`).join('; ') });
      svg.querySelectorAll('text.lbl').forEach((t) => {
        const n = t.textContent.length;
        const fs = Math.max(9, Math.min(12, 236 / (0.53 * n)));
        if (fs < 12) t.setAttribute('style', 'font-size:' + fs.toFixed(1) + 'px');
        if (n * 0.53 * fs > 240) { t.setAttribute('textLength', '236'); t.setAttribute('lengthAdjust', 'spacingAndGlyphs'); }
        const full = t.textContent; t.appendChild(WB.svg('title', {}, [full]));
      });
      svg.setAttribute('data-k', 'forest');
      resT.appendChild(chartWrap(svg));
      resT.appendChild(h('p', { class: 'note' }, 'Squares: ROR point estimates; lines: 95% CI; vertical line at 1. Position on this scale does not decide priority: seriousness, case quality and clinical coherence do.'));
      resT.appendChild(h('div', { class: 'btn-row' }, [h('button', { class: 'btn small', type: 'button', onclick: () => WB.exportCSV('disproportionality-screen.csv', head, csvRows) }, 'Export table (CSV)')]));
    }

    el.appendChild(interpretation([
      'An alert starts validation; it does not conclude it. Validation asks whether clinically coherent cases support the pair (chronology, alternative causes, case quality, previous awareness); prioritization weighs seriousness, reversibility, preventability and the exposed population, not the size of the ROR. Coding, case classification and causality stay separate: the 2×2 counts coded reports, not adjudicated cases.',
      'Watch for sparse data (small a dominates the standard error), multiple testing (about 1 pair in 40 crosses a 95% bound by chance), masking by heavily reported comparator drugs, notoriety after publicity, confounding by indication, and the grouping level: grouping can dilute a specific PT or rescue a concept split across several PTs.',
    ]));
    el.appendChild(bookLink('Chapter 17, Table 17.1, Example 17.1, Figure 17.2, Cases 17.1–17.3 and Exercise 17.1.'));
    sp.querySelector('[data-preset="t171"]').click();
    tp.querySelector('[data-preset="canon7"]').click();
  }

  /* =====================================================================
     4. Version effect decomposition (Chapter 19)
     ===================================================================== */
  function renderVersion(el) {
    el.appendChild(howTo('When a count changes after an upversion or a query revision, run the same frozen dataset four ways: old and new data (rows) crossed with old and new query (columns). Holding one factor constant isolates the other. Enter the four counts; the tool returns the data effect, the query effect and their interaction, and drafts the reconciliation sentence. Optional exposure turns counts into rates, and the optional trend check compares the previous period like with like.'));
    const p = h('div', { class: 'panel', id: 've-inputs' });
    p.appendChild(h('h2', {}, 'Controlled comparison'));
    const rowKind = selectF('What differs between the rows?', [['version', 'MedDRA version of the same frozen data (terminology effect)'], ['lock', 'Data lock (new or changed records)']], 'version', calc);
    const colKind = selectF('What differs between the columns?', [['version', 'SMQ or query in a different MedDRA version'], ['rev', 'Query revision in the same MedDRA version']], 'version', calc);
    const L = { r1: txtF('Row 1 (old data)', 'Data coded in v29.0'), r2: txtF('Row 2 (new data)', 'Data upversioned to N+1'), c1: txtF('Column 1 (old query)', 'SMQ v29.0'), c2: txtF('Column 2 (new query)', 'SMQ N+1') };
    const C = { A: numF('A: old data × old query', ''), B: numF('B: old data × new query', ''), Cc: numF('C: new data × old query', ''), Dd: numF('D: new data × new query', '') };
    const unitF = txtF('Counting unit', 'reports');
    const pyF = numF('Exposure for this period (PY, optional)', '');
    const tr = { lbl: txtF('Previous period label (optional)', ''), p1: numF('Previous period, aligned old (A-type run)', ''), p2: numF('Previous period, aligned new (D-type run)', ''), py: numF('Previous period exposure (PY)', '') };
    const note = h('p', { class: 'note', 'aria-live': 'polite' });
    function load(o) {
      rowKind.input.value = o.rowKind; colKind.input.value = o.colKind;
      Object.keys(L).forEach((k) => set(L[k], o.L[k])); set(C.A, o.n[0]); set(C.B, o.n[1]); set(C.Cc, o.n[2]); set(C.Dd, o.n[3]);
      set(unitF, o.unit || 'reports'); set(pyF, o.py ?? '');
      set(tr.lbl, o.tr ? o.tr.lbl : ''); set(tr.p1, o.tr ? o.tr.p1 : ''); set(tr.p2, o.tr ? o.tr.p2 : ''); set(tr.py, o.tr ? o.tr.py : '');
      note.textContent = 'Loaded: ' + o.label; calc();
    }
    p.appendChild(presetRow([
      ['Load book example (Case 19.2, hepatic trend after upversion)', () => load({ label: 'Case 19.2 — frozen 2026 H2 dataset; narrow hepatic SMQ; hypothetical version N+1 changes; hypothetical 14,600 PY.', rowKind: 'version', colKind: 'version',
        L: { r1: 'Data coded in v29.0', r2: 'Data upversioned to N+1', c1: 'SMQ v29.0', c2: 'SMQ N+1' }, n: [23, 38, 26, 41], py: 14600, tr: { lbl: '2026 H1', p1: 22, p2: 37, py: 13100 } }), 'c192'],
      ['Load book example (Example 19.3, pancreatitis query revision)', () => load({ label: 'Example 19.3 — customized pancreatitis query, fictional antidiabetic; same MedDRA version at both reviews.', rowKind: 'lock', colKind: 'rev',
        L: { r1: 'First-quarter data lock', r2: 'Second-quarter data lock', c1: 'Query rev 2', c2: 'Query rev 3' }, n: [12, 14, 15, 17] }), 'e193'],
    ]));
    p.appendChild(note);
    p.appendChild(h('div', { class: 'fields' }, [rowKind.wrap, colKind.wrap]));
    p.appendChild(h('div', { class: 'fields' }, Object.values(L).map((f) => f.wrap)));
    p.appendChild(h('div', { class: 'fields' }, Object.values(C).map((f) => f.wrap)));
    p.appendChild(h('div', { class: 'fields' }, [unitF.wrap, pyF.wrap]));
    p.appendChild(h('details', {}, [h('summary', {}, 'Trend check against the previous period (optional)'), h('div', { class: 'fields' }, Object.values(tr).map((f) => f.wrap))]));
    el.appendChild(p);
    const res = h('div', { class: 'panel', id: 've-results', 'aria-live': 'polite' });
    el.appendChild(res);
    onAll(Object.values(L).concat(Object.values(C), Object.values(tr), [unitF, pyF]), calc);

    function calc() {
      res.innerHTML = '';
      res.appendChild(h('h2', {}, 'Results'));
      const A = val(C.A), B = val(C.B), Cc = val(C.Cc), Dd = val(C.Dd);
      const u = unitF.input.value || 'reports', py = val(pyF);
      const lb = { r1: L.r1.input.value || 'Old data', r2: L.r2.input.value || 'New data', c1: L.c1.input.value || 'Old query', c2: L.c2.input.value || 'New query' };
      if (![A, B, Cc, Dd].every(fin)) { res.appendChild(WB.note('Enter all four counts or load a book example.')); return; }
      const versions = rowKind.input.value === 'version' && colKind.input.value === 'version';
      const mismatch = rowKind.input.value === 'version' || colKind.input.value === 'version';
      const rate = (n) => (py > 0 ? ` (${F((n / py) * 1000, 2)} per 1,000 PY)` : '');
      const cell = (n, tag, diag) => h('td', { style: 'text-align:center' + (diag ? ';background:#F3F4F6' : '') }, [h('div', { style: 'font-size:22px;font-weight:700;color:var(--navy)' }, nf(n)), h('div', { class: 'note' }, tag + rate(n).replace(/^ /, ' ')), diag ? h('div', { class: 'note' }, h('em', {}, 'diagnostic run, not for reporting')) : null]);
      const grid = h('table', { class: 'tbl', 'data-k': 'grid', style: 'min-width:470px' }, [
        h('caption', {}, `Same frozen dataset, four runs (${u})`),
        h('thead', {}, h('tr', {}, [h('th', { scope: 'col' }, ''), h('th', { scope: 'col' }, lb.c1), h('th', { scope: 'col' }, lb.c2)])),
        h('tbody', {}, [
          h('tr', {}, [h('th', { scope: 'row' }, lb.r1), cell(A, 'A' + (mismatch ? ', aligned' : ''), false), cell(B, 'B' + (versions ? ', mismatched' : ''), versions)]),
          h('tr', {}, [h('th', { scope: 'row' }, lb.r2), cell(Cc, 'C' + (versions ? ', mismatched' : ''), versions), cell(Dd, 'D' + (mismatch ? ', aligned' : ''), false)]),
        ]),
      ]);
      res.appendChild(h('div', { class: 'tbl-wrap' }, grid));
      const q1 = B - A, q2 = Dd - Cc, d1 = Cc - A, d2 = Dd - B, inter = Dd - B - Cc + A, tot = Dd - A;
      const sg = (n) => (n > 0 ? '+' : '') + nf(n);
      const sgp = (x) => (x > 0 ? '+' : '') + F(x, 1) + '%';
      res.appendChild(h('div', { class: 'result' }, [
        stat('ve-query', 'Query effect', sg(q1), `B − A = ${sg(q1)}; D − C = ${sg(q2)}`),
        stat('ve-data', 'Data effect', sg(d1), `C − A = ${sg(d1)}; D − B = ${sg(d2)}`),
        stat('ve-int', 'Interaction', sg(inter), 'D − B − C + A'),
        stat('ve-total', 'Total change', sg(tot), `D − A: ${nf(A)} → ${nf(Dd)}${A > 0 ? ` (${sgp((100 * tot) / A)})` : ''}`),
      ]));
      let concl;
      const additive = inter === 0 ? `The effects add (${nf(A)} ${sg(d1)} ${sg(q1)} = ${nf(Dd)}), with no interaction.` : `The effects do not add exactly (interaction ${sg(inter)}): some records depend on both changes; inspect the record-level difference file before apportioning them.`;
      if (versions) {
        concl = `Of the ${nf(tot)} additional ${u} between the aligned runs (A ${nf(A)} → D ${nf(Dd)}), ${nf(d1)} come from the terminology change in the data (records moved by the new hierarchy) and ${nf(q1)} from the change in the query. ${additive} The difference is a version effect, not a change in the safety data. Report every period in one version, explain the restated figures in a reconciliation note, and keep the mismatched runs B and C as labeled diagnostics only.`;
      } else if (rowKind.input.value === 'lock' && colKind.input.value === 'rev') {
        const ll = B > 0 ? ` Like for like under ${lb.c2}: ${nf(B)} → ${nf(Dd)} (${sgp((100 * d2) / B)}), against a naive ${nf(A)} → ${nf(Dd)} (${sgp((100 * tot) / A)}).` : '';
        concl = `Of the ${nf(tot)} additional ${u}, ${nf(d1)} come from new data and ${nf(q1)} from the query revision. ${additive}${ll} No version effect is possible if the MedDRA version did not change; confirm from the record-level difference file that the new ${u} are new receipts rather than follow-up of existing ones.`;
      } else {
        concl = `Of the ${nf(tot)} additional ${u}, ${nf(d1)} are attributable to the row factor (${lb.r1} → ${lb.r2}) and ${nf(q1)} to the column factor (${lb.c1} → ${lb.c2}). ${additive} Any run that pairs data and query from different MedDRA versions is diagnostic only.`;
      }
      const cbox = WB.callout(versions ? 'warn' : '', 'Plain-language conclusion', concl);
      cbox.setAttribute('data-k', 've-conclusion');
      res.appendChild(cbox);
      // trend check
      const p1 = val(tr.p1), p2 = val(tr.p2), ppy = val(tr.py), pl = tr.lbl.input.value || 'Previous period';
      if (fin(p1) && fin(p2)) {
        const rr = (n, e) => (e > 0 ? F((n / e) * 1000, 2) : '—');
        const t = WB.table(['Comparison', pl, 'This period', 'Reading'], [
          [`Aligned old (${lb.r1} × ${lb.c1})`, `${nf(p1)} (${rr(p1, ppy)})`, `${nf(A)} (${rr(A, py)})`, 'like for like'],
          [`Aligned new (${lb.r2} × ${lb.c2})`, `${nf(p2)} (${rr(p2, ppy)})`, `${nf(Dd)} (${rr(Dd, py)})`, 'like for like'],
          ['Naive: old figure vs new figure', `${nf(p1)} (${rr(p1, ppy)})`, `${nf(Dd)} (${rr(Dd, py)})`, 'mixes versions: not a trend'],
        ], { compact: true, caption: `Trend check: counts with rates per 1,000 PY in brackets` });
        t.setAttribute('data-k', 've-trend');
        res.appendChild(t);
        if (fin(p2) && p2 !== p1) res.appendChild(WB.note(`The previously reported ${pl} figure (${nf(p1)}) is restated as ${nf(p2)} in the new version; explain the difference in a reconciliation note.`));
      }
      res.appendChild(WB.note('Mismatched runs (data and query in different MedDRA versions) violate the version-alignment rule by design. Label them “diagnostic, not for reporting”, keep them with the query specification, and never lift them into a slide.'));
    }
    el.appendChild(interpretation([
      'A change in counts after an upversion can come from the terminology (records moving with the hierarchy), from the query (SMQ membership or scope, or a revised term list), or from the data (new, corrected, followed-up or merged records). Only the last is a change in the safety data, and even then it is a change in what was reported, not in risk.',
      'The decomposition attributes counts; it does not judge them. Review the moved records clinically: a block of non-specific laboratory reports entering a narrow search changes the count without changing the evidence. Run every period of a trend in one version, and state data and query versions on every output.',
    ]));
    el.appendChild(bookLink('Chapter 19, Case 19.2 (Figure 19.3), Example 19.3 and the version reconciliation checklist (Table 19.3). Book examples use synthetic data.'));
    p.querySelector('[data-preset="c192"]').click();
  }

  /* =====================================================================
     5. Evidence-to-wording helper (Chapter 18)
     ===================================================================== */
  const LEVELS = [
    { id: 'retrieved', name: 'Retrieved reports (query output)', use: ['retrieved reports', 'potential cases pending medical review'], avoid: ['cases of [event]', 'patients with [event]'],
      tpl: (c) => `${c.n ?? 'N'} reports were retrieved by ${c.query}; these are potential cases pending medical review.` },
    { id: 'serious', name: 'Serious reports', use: ['serious reports (a regulatory criterion, not causality)'], avoid: ['serious cases of [event] caused by [product]'],
      tpl: (c) => `${c.n ?? 'N'} of the retrieved reports were serious; seriousness is a regulatory classification of outcome, not of causality.` },
    { id: 'confirmed', name: 'Medically confirmed with laboratory data', use: ['cases with laboratory confirmation', 'medically confirmed reports'], avoid: ['confirmed [event]', 'proven cases'],
      tpl: (c) => `${c.n ?? 'N'} were medically confirmed with laboratory data.` },
    { id: 'criteria', name: 'Met biochemical (case-definition) criteria', use: ['met biochemical criteria', 'met the case definition'], avoid: ['Hy’s law cases (before alternatives are excluded)', 'drug-induced [event]'],
      tpl: (c) => `${c.n ?? 'N'} met the biochemical criteria of the case definition; this is not yet a causal finding.` },
    { id: 'noalt', name: 'No alternative explanation identified on work-up', use: ['no alternative explanation identified on the available work-up', 'no other disease identified'], avoid: ['proven', 'definitely caused', 'related'],
      tpl: (c) => `${c.n ?? 'N'} had no other disease identified on the available work-up (co-suspect drugs are stated separately).` },
    { id: 'corroborated', name: 'Corroborated across sources', use: ['consistent across trial, postmarketing and nonclinical data', 'consistent with a causal association'], avoid: ['confirms causation', 'establishes that [product] causes [event]'],
      tpl: (c) => `The findings are consistent across ${c.sources}; this is corroboration, not proof of causation.` },
  ];
  const UNITS = [
    { id: 'patients', name: 'Patients (trial)', use: (c) => `${c.n ?? 'N'} of ${c.den ?? 'N'} patients (${fin(c.n) && fin(c.den) && c.den > 0 ? F((100 * c.n) / c.den, 1) : 'x'}%) had ${c.finding}`, avoid: (c) => `“${fin(c.n) && fin(c.den) && c.den > 0 ? F((100 * c.n) / c.den, 1) : 'x'}% of patients got [diagnosis]”` },
    { id: 'events', name: 'Events', use: (c) => `${c.n ?? 'N'} events in ${c.den ?? 'M'} patients`, avoid: (c) => `“${c.n ?? 'N'} cases”` },
    { id: 'reports', name: 'Reports (spontaneous)', use: (c) => `${c.n ?? 'N'} reports retrieved by ${c.query}`, avoid: (c) => `“${c.n ?? 'N'} patients with [event]”` },
    { id: 'cases', name: 'Cases (de-duplicated)', use: (c) => `no more than ${c.n ?? 'N'} unique cases`, avoid: (c) => `“${c.n ?? 'N'} confirmed cases”` },
    { id: 'adjudicated', name: 'Adjudicated cases', use: (c) => `${c.n ?? 'N'} case${c.n === 1 ? '' : 's'} assessed as ${c.cat} (${c.method})`, avoid: (c) => `“${c.n ?? 'N'} proven case${c.n === 1 ? '' : 's'}”` },
  ];
  const RUNGS = [['close', 'Close with a documented rationale'], ['routine', 'Continue routine monitoring'], ['enhance', 'Enhance monitoring'], ['analyses', 'Further analyses'], ['refer', 'Refer for a risk-management decision']];
  const FLAGS = [
    [/\bproven?\b|\bdefinitely\b|\bconfirms? causation\b|\bestablish(es|ed)? (that|a causal)/i, 'Overstates causality. Use “no alternative explanation identified on the available work-up” or the adjudication category, named with its method.'],
    [/\bincreased risk\b|\b\d+(\.\d+)?[- ]fold (increased )?risk\b|\bdoubles? the risk\b|\brisk ratio\b/i, 'A reporting ratio is not a risk. Write “reported more often than expected relative to other products” and give the ROR as a screening result.'],
    [/\bincidence\b/i, 'Check the quantity: reporting rates and disproportionality are not incidences.'],
    [/\b(is|are|remains?) safe\b|\bsafe for\b/i, '“Safe” is a risk conclusion. Write “no new signal identified in this review”.'],
    [/cannot be (excluded|ruled out)|no causal relationship can be established/i, 'Uninformative or falsely reassuring. State the case-level findings, or “insufficient information to assess”.'],
    [/\bnot related\b|\bunrelated\b/i, 'For incomplete or confounded cases write “insufficient information to assess” or “confounded by [drug]”.'],
    [/\bconfirmed cases?\b|\bconfirming\b|\bconfirms\b/i, '“Confirm” needs a defined basis; for de-duplicated counts write “no more than N unique cases”; for trends, “consistent with”.'],
    [/\bresolved\b/i, 'A falling reporting rate does not show that a risk has resolved; say what the rate is and what it is not.'],
    [/\b(should|must|will) be label(l)?ed\b|\blabel(l)?ing (change|update) (is|was) (required|agreed)\b|\bthe label (should|must|will)\b/i, 'Product information decisions belong to governance. Write “referred to the safety review team for a decision on product information”.'],
    [/\bcontinue to monitor\b|\bmonitor closely\b/i, 'Unbounded recommendation: add the action, owner, due date and the result that would change it.'],
    [/\bsignificant(ly)?\b/i, 'Ambiguous: statistical or clinical? Give the estimate and interval, or the clinical finding.'],
    [/\b(causes?|caused)\b/i, 'Causal verb: check that the evidence level supports it, or use “consistent with a causal association”.'],
  ];

  function renderWording(el) {
    el.appendChild(howTo('Choose the highest level of evidence the review has actually reached and the counting unit you are reporting. The tool proposes sentences calibrated to that level, the wording to avoid, and a bounded recommendation with action, rationale, owner, due date and trigger. Paste a draft sentence to have it checked for inflated or deflated wording. Copy the result or export it to Word. The tool suggests wording; the reviewer remains responsible for every word.'));
    const st = WB.store.getJSON('wording-v1', null);
    const p = h('div', { class: 'panel', id: 'wd-inputs' });
    p.appendChild(h('h2', {}, 'Evidence and context'));
    const ctx = {
      product: txtF('Product', 'Product A'), finding: txtF('Finding or concept', 'hepatocellular liver injury with jaundice'),
      query: txtF('Query, scope and version', 'the narrow scope of Drug related hepatic disorders - comprehensive search (SMQ), MedDRA v29.0', { wide: true }),
      sources: txtF('Sources that agree (for corroboration)', 'trial, postmarketing and nonclinical data', { wide: true }),
    };
    const lvlName = 'lvl' + uid();
    const lvlInputs = [], lvlCounts = [];
    const ladder = h('div', { role: 'radiogroup', 'aria-label': 'Highest evidence level reached', id: 'wd-ladder' });
    LEVELS.forEach((L, i) => {
      const r = h('input', { type: 'radio', name: lvlName, value: L.id, id: lvlName + i, style: 'width:auto' });
      const cnt = h('input', { type: 'number', step: 'any', 'aria-label': 'Count at level: ' + L.name, style: 'width:90px', placeholder: 'count' });
      r.addEventListener('change', calc); cnt.addEventListener('input', calc);
      lvlInputs.push(r); lvlCounts.push(cnt);
      ladder.appendChild(h('div', { style: `display:flex;align-items:center;gap:10px;margin:4px 0 4px calc(${i} * min(14px, 2vw));padding:6px 10px;border:1px solid var(--line);border-radius:8px;background:#fff` }, [
        r, h('label', { for: lvlName + i, style: 'flex:1;font-weight:600' }, `${i + 1}. ${L.name}`), cnt,
      ]));
    });
    const unitSel = selectF('Counting unit for the headline count', UNITS.map((u) => [u.id, u.name]), 'reports', calc);
    const unitN = numF('Headline count', ''), unitDen = numF('Denominator (patients) if any', '');
    const adj = { cat: txtF('Adjudication category (adjudicated cases)', 'probable DILI'), method: txtF('Method or scale', 'independent hepatic adjudication committee') };
    const flags = {
      dp: checkF('A disproportionality result is quoted', false, calc), dpTxt: txtF('ROR (95% CI) as quoted', 'ROR 2.35, 95% CI 1.33–4.14'),
      co: checkF('Some cases have a co-suspect drug', false, calc), coTxt: txtF('Co-suspect drug', 'concomitant leflunomide'),
      inc: checkF('Some cases lack the information to assess them', false, calc), incTxt: txtF('Missing what, in how many', 'laboratory data for 13 of the 31 serious reports'),
      rate: checkF('A reporting rate per estimated exposure is quoted', false, calc),
      neg: checkF('This is a negative review (nothing new found)', false, calc),
    };
    p.appendChild(h('div', { class: 'fields' }, [ctx.product.wrap, ctx.finding.wrap]));
    p.appendChild(h('div', { class: 'fields' }, [ctx.query.wrap, ctx.sources.wrap]));
    p.appendChild(h('h3', { style: 'margin-top:12px' }, 'Highest evidence level reached (counts optional)'));
    p.appendChild(ladder);
    p.appendChild(h('div', { class: 'fields', style: 'margin-top:10px' }, [unitSel.wrap, unitN.wrap, unitDen.wrap]));
    p.appendChild(h('div', { class: 'fields' }, [adj.cat.wrap, adj.method.wrap]));
    p.appendChild(h('h3', { style: 'margin-top:12px' }, 'Context'));
    p.appendChild(h('div', { class: 'grid2' }, [
      h('div', {}, [flags.dp.wrap, flags.dpTxt.wrap, flags.co.wrap, flags.coTxt.wrap]),
      h('div', {}, [flags.inc.wrap, flags.incTxt.wrap, flags.rate.wrap, flags.neg.wrap]),
    ]));

    const rp = h('div', { class: 'panel', id: 'wd-rec' });
    rp.appendChild(h('h2', {}, 'Bounded recommendation'));
    const rec = {
      rung: selectF('Rung of the action ladder', RUNGS, 'refer', calc),
      action: txtF('Action', '', { wide: true }), rationale: txtF('Rationale', '', { wide: true }),
      owner: txtF('Owner', ''), due: txtF('Due date or timing', ''), trigger: txtF('Trigger: the result that would change it', '', { wide: true }),
    };
    rp.appendChild(h('div', { class: 'fields' }, [rec.rung.wrap, rec.owner.wrap, rec.due.wrap]));
    rp.appendChild(h('div', { class: 'fields' }, [rec.action.wrap, rec.rationale.wrap, rec.trigger.wrap]));

    const dp = h('div', { class: 'panel', id: 'wd-draft' });
    dp.appendChild(h('h2', {}, 'Check a draft sentence'));
    const draft = WB.field('Draft sentence or paragraph', { textarea: true, rows: 3, wide: true, placeholder: 'Paste a sentence from your summary' });
    dp.appendChild(draft.wrap);
    const resD = h('div', { id: 'wd-draft-results', 'aria-live': 'polite' });
    dp.appendChild(resD);

    const note = h('p', { class: 'note', 'aria-live': 'polite' });
    function load(o) {
      Object.keys(ctx).forEach((k) => o.ctx && o.ctx[k] !== undefined && set(ctx[k], o.ctx[k]));
      lvlInputs.forEach((r) => (r.checked = r.value === o.level));
      lvlCounts.forEach((c, i) => (c.value = o.counts && o.counts[i] !== undefined ? o.counts[i] : ''));
      unitSel.input.value = o.unit || 'reports'; set(unitN, o.n ?? ''); set(unitDen, o.den ?? '');
      Object.keys(flags).forEach((k) => { if (flags[k].input.type === 'checkbox') flags[k].input.checked = !!(o.flags && o.flags[k]); else if (o.flags && o.flags[k] !== undefined) set(flags[k], o.flags[k]); });
      rec.rung.input.value = o.rec ? o.rec.rung : 'refer';
      ['action', 'rationale', 'owner', 'due', 'trigger'].forEach((k) => set(rec[k], o.rec ? o.rec[k] || '' : ''));
      draft.input.value = o.draft || '';
      note.textContent = 'Loaded: ' + o.label; calc();
    }
    const HEP_Q = 'the narrow scope of Drug related hepatic disorders - comprehensive search (SMQ), MedDRA v29.0; SMQs v29.0';
    const presets = presetRow([
      ['Load book example (Case 18.1, hepatic summary)', () => load({ label: 'Case 18.1 and Figure 18.3 — Product A hepatic finding, data lock 30 June 2026 (synthetic).',
        ctx: { product: 'Product A', finding: 'hepatocellular liver injury with jaundice', query: HEP_Q, sources: 'trial, postmarketing and nonclinical data' },
        level: 'corroborated', counts: [108, 31, 18, 4, 2, ''], unit: 'reports', n: 108, den: '',
        flags: { dp: true, dpTxt: 'ROR 2.35, 95% CI 1.33–4.14, for Drug-induced liver injury (PT)', co: true, coTxt: 'concomitant leflunomide (PM-0918)', inc: true, incTxt: 'laboratory data for 13 of the 31 serious reports', rate: true, neg: false },
        rec: { rung: 'refer', action: 'Committee decision on risk classification and product information, using this summary', rationale: 'Two well-documented cases without an alternative explanation (PA-301-0147, PM-0733), a randomized ALT imbalance and nonclinical transaminase findings', owner: 'safety review team chair', due: 'next scheduled meeting', trigger: 'A new case without an alternative cause triggers ad hoc review; monthly review against Hy’s law criteria until the team decides' } }), 'c181'],
      ['Load book example (Example 18.3, SJS/TEN recommendation)', () => load({ label: 'Example 18.3 — bounding “Continue to monitor SJS/TEN closely” for the validated severe skin reaction signal.',
        ctx: { product: 'Product A', finding: 'Stevens-Johnson syndrome or toxic epidermal necrolysis', query: 'the narrow scope of Severe cutaneous adverse reactions (SMQ), MedDRA v29.0', sources: 'postmarketing case reports' },
        level: 'noalt', counts: [3, 3, 2, '', 2, ''], unit: 'reports', n: 3,
        flags: { dp: true, dpTxt: 'ROR 0.48, 95% CI 0.15–1.49, on 3 reports (uninformative)', co: true, coTxt: 'allopurinol (PM-1107)', inc: true, incTxt: 'BSA detached, biopsy and allopurinol stop date for PM-1107', rate: false, neg: false },
        rec: { rung: 'analyses', action: 'Obtain follow-up for PM-1107 and PM-1188; search trial and literature data for SJS and TEN; review each new narrow-SMQ report within 2 business days', rationale: 'Two biopsy-supported cases without a co-suspect drug and with onset inside the ALDEN suggestive window; the ROR of 0.48 on 3 reports is uninformative', owner: 'case management; signal analytics; product safety physician', due: '31 July 2026 (follow-up); 31 August 2026 (search)', trigger: 'One further unconfounded case with onset Days 5–28 goes to the safety review team within 5 business days for a risk-classification decision' },
        draft: 'Continue to monitor SJS/TEN closely.' }), 'e183'],
      ['Load book example (Exercise 18.1, draft to fix)', () => load({ label: 'Exercise 18.1 — a draft sentence to rewrite (12 reports coded to Drug-induced liver injury).',
        ctx: { product: 'Product A', finding: 'drug-induced liver injury', query: 'Drug-induced liver injury (PT), MedDRA v29.0', sources: 'trial, postmarketing and nonclinical data' },
        level: 'retrieved', counts: [12, '', '', '', '', ''], unit: 'reports', n: 12,
        flags: { dp: true, dpTxt: 'ROR 2.35, 95% CI 1.33–4.14', co: false, inc: false, rate: false, neg: false },
        rec: { rung: 'refer', action: 'Refer the decision on product information to the safety review team', rationale: 'Case review summarized in the findings', owner: 'product safety physician', due: 'next scheduled meeting', trigger: '' },
        draft: 'Twelve patients developed DILI on Product A, a 2.35-fold increased risk; causality cannot be excluded and the drug should be labeled for hepatotoxicity.' }), 'x181'],
      ['Load book example (Example 18.2, reassuring draft)', () => load({ label: 'Example 18.2 — calibrating a reassuring sentence about the 2026 H1 reporting rate.',
        ctx: { product: 'Product A', finding: 'hepatic reports', query: HEP_Q, sources: 'trial, postmarketing and nonclinical data' },
        level: 'retrieved', counts: [22, '', '', '', '', ''], unit: 'reports', n: 22,
        flags: { dp: false, co: false, inc: false, rate: true, neg: false },
        rec: { rung: 'routine', action: '', rationale: '', owner: '', due: '', trigger: '' },
        draft: 'Hepatic reporting fell to 1.68 per 1,000 patient-years in 2026 H1, confirming that the liver risk has resolved; Product A is safe for the liver.' }), 'e182'],
    ]);
    p.insertBefore(note, p.children[1]);
    p.insertBefore(presets, note);
    el.appendChild(p);
    const res = h('div', { class: 'panel', id: 'wd-output', 'aria-live': 'polite' });
    el.appendChild(res);
    el.appendChild(rp);
    const resR = h('div', { id: 'wd-rec-results', 'aria-live': 'polite' });
    rp.appendChild(resR);
    el.appendChild(dp);
    const status = h('p', { class: 'note', 'aria-live': 'polite' });
    let exportHTML = '', exportText = '';
    el.appendChild(h('div', { class: 'panel' }, [h('h2', {}, 'Copy or export'), h('div', { class: 'btn-row' }, [
      h('button', { class: 'btn primary', type: 'button', onclick: () => copyText(exportText, status) }, 'Copy wording'),
      h('button', { class: 'btn', type: 'button', onclick: () => WB.exportDoc('calibrated-wording.doc', 'Calibrated wording', exportHTML) }, 'Export to Word (.doc)'),
      h('button', { class: 'btn', type: 'button', onclick: () => { WB.store.del('wording-v1'); status.textContent = 'Saved inputs cleared.'; } }, 'Clear saved inputs'),
    ]), status]));
    onAll(Object.values(ctx).concat([unitN, unitDen, adj.cat, adj.method, flags.dpTxt, flags.coTxt, flags.incTxt, rec.action, rec.rationale, rec.owner, rec.due, rec.trigger, draft]), calc);

    function save() {
      WB.store.setJSON('wording-v1', {
        ctx: Object.fromEntries(Object.keys(ctx).map((k) => [k, ctx[k].input.value])), level: (lvlInputs.find((r) => r.checked) || {}).value || '', counts: lvlCounts.map((c) => c.value),
        unit: unitSel.input.value, n: unitN.input.value, den: unitDen.input.value,
        flags: Object.fromEntries(Object.keys(flags).map((k) => [k, flags[k].input.type === 'checkbox' ? flags[k].input.checked : flags[k].input.value])),
        rec: { rung: rec.rung.input.value, action: rec.action.input.value, rationale: rec.rationale.input.value, owner: rec.owner.input.value, due: rec.due.input.value, trigger: rec.trigger.input.value },
        draft: draft.input.value, label: 'your saved inputs',
      });
    }

    function calc() {
      const c = { product: ctx.product.input.value || 'the product', finding: ctx.finding.input.value || '[finding]', query: ctx.query.input.value || '[query, scope, version]', sources: ctx.sources.input.value || '[sources]', cat: adj.cat.input.value || '[category]', method: adj.method.input.value || '[method]' };
      const li = lvlInputs.findIndex((r) => r.checked);
      const unit = UNITS.find((u) => u.id === unitSel.input.value);
      const un = val(unitN), uden = val(unitDen);
      res.innerHTML = '';
      res.appendChild(h('h2', {}, 'Proposed wording'));
      const sentences = [], use = [], avoid = [];
      // count phrase
      const cu = Object.assign({}, c, { n: fin(un) ? un : undefined, den: fin(uden) ? uden : undefined });
      const headline = unit.use(cu);
      avoid.push(`${unit.avoid(cu).replace('[event]', c.finding).replace('[diagnosis]', c.finding)} — wrong unit for ${unit.name.toLowerCase()}`);
      if (unit.id === 'reports') use.push('reports, not patients or cases, until de-duplicated');
      // ladder
      if (li < 0) sentences.push('Select the highest evidence level reached to get calibrated findings sentences.');
      else {
        for (let i = 0; i <= li; i++) {
          const n = WB.num(lvlCounts[i]);
          if (i < li && !fin(n)) continue;
          sentences.push(LEVELS[i].tpl(Object.assign({}, c, { n: fin(n) ? n : undefined })));
        }
        LEVELS[li].use.forEach((u) => use.push(u));
        // avoid: wording of this level and every level above it
        for (let i = li; i < LEVELS.length; i++) LEVELS[i].avoid.forEach((a) => avoid.push(a.replace('[product]', c.product).replace('[event]', c.finding)));
        if (li < LEVELS.length - 1) avoid.push(`wording of a higher level (“${LEVELS[li + 1].use[0]}”), which the evidence has not reached`);
      }
      if (flags.dp.input.checked) { sentences.push(`${c.finding.charAt(0).toUpperCase() + c.finding.slice(1)} was reported more often than expected relative to other products (${flags.dpTxt.input.value || 'ROR, 95% CI'}), a screening result of reporting patterns that does not measure risk.`); use.push('reported more often than expected relative to other products'); avoid.push('increased risk'); avoid.push('twice the incidence'); }
      if (flags.co.input.checked) { sentences.push(`One or more cases are confounded by ${flags.coTxt.input.value || '[co-suspect drug]'}.`); use.push(`confounded by ${flags.coTxt.input.value || '[drug]'}`); avoid.push('unrelated'); avoid.push('related'); }
      if (flags.inc.input.checked) { sentences.push(`Insufficient information to assess: ${flags.incTxt.input.value || '[what is missing]'}; this is requested at follow-up.`); use.push('insufficient information to assess'); avoid.push('not related'); avoid.push('data are limited (without saying what is missing)'); }
      if (flags.rate.input.checked) { sentences.push('Rates are reporting rates per 1,000 patient-years of estimated exposure (sales-based); they do not measure incidence.'); use.push('reporting rate per 1,000 PY of estimated exposure'); avoid.push('incidence'); avoid.push('the risk has resolved'); }
      if (flags.neg.input.checked) { sentences.push(`No new signal was identified in this review for ${c.finding} with ${c.product}.`); use.push('no new signal identified in this review'); avoid.push('the product is safe'); avoid.push('no causal relationship can be established'); }
      res.appendChild(h('p', { 'data-k': 'headline' }, [h('strong', {}, 'Headline count, ' + unit.name.toLowerCase() + ': '), headline.charAt(0).toUpperCase() + headline.slice(1) + '.']));
      const ul = h('ol', { 'data-k': 'sentences' }, sentences.map((s) => h('li', {}, s)));
      res.appendChild(ul);
      res.appendChild(h('div', { class: 'grid2' }, [
        h('div', {}, [h('h3', {}, 'Use'), h('ul', { 'data-k': 'use' }, Array.from(new Set(use)).map((u) => h('li', {}, '“' + u + '”')))]),
        h('div', {}, [h('h3', {}, 'Avoid'), h('ul', { 'data-k': 'avoid' }, Array.from(new Set(avoid)).map((a) => h('li', {}, a.startsWith('“') || a.startsWith('wording') ? a : '“' + a + '”')))]),
      ]));
      if (li >= 0) res.appendChild(WB.note(`Level ${li + 1} of ${LEVELS.length}: the summary must not borrow strength from a level the evidence has not reached. Causality for individual cases is reported with its named method (for example WHO-UMC categories or the committee’s scale), separately from the coded term and from the signal conclusion.`));

      // recommendation
      resR.innerHTML = '';
      const R = { action: rec.action.input.value.trim(), rationale: rec.rationale.input.value.trim(), owner: rec.owner.input.value.trim(), due: rec.due.input.value.trim(), trigger: rec.trigger.input.value.trim() };
      const rungName = RUNGS.find((r) => r[0] === rec.rung.input.value)[1];
      const missing = ['action', 'rationale', 'owner', 'due', 'trigger'].filter((k) => !R[k]);
      const recText = `${rungName}. ${R.action || '[Action]'} (owner: ${R.owner || '[owner]'}; due: ${R.due || '[date]'}). Rationale: ${R.rationale || '[rationale]'}. Trigger: ${R.trigger || '[result that would change this recommendation]'}.`;
      resR.appendChild(h('p', { 'data-k': 'rec-text', style: 'background:var(--mist);padding:10px 12px;border-radius:8px' }, recText));
      const names = { action: 'action', rationale: 'rationale', owner: 'owner', due: 'due date', trigger: 'trigger' };
      resR.appendChild(h('div', { 'data-k': 'rec-check' }, ['action', 'rationale', 'owner', 'due', 'trigger'].map((k) => yesNo(!!R[k], names[k]))));
      const rb = missing.length ? WB.callout('warn', `Not yet bounded: ${missing.length} of 5 elements missing`, 'Missing: ' + missing.map((k) => names[k]).join(', ') + '. “Continue to monitor” fails on four of the five.') : WB.callout('ok', 'Bounded: all five elements present', 'Enter it in the action log with an identifier, the source signal, status and the evidence that will close it.');
      rb.setAttribute('data-k', 'rec-verdict');
      resR.appendChild(rb);
      if (rec.rung.input.value === 'refer') resR.appendChild(WB.note('Risk classification, product information and communication are decided by governance; word them as referrals, not as decisions already made.'));

      // draft checker
      resD.innerHTML = '';
      const dt = draft.input.value.trim();
      const hits = [];
      if (dt) {
        FLAGS.forEach(([re, msg]) => { const m = dt.match(re); if (m) hits.push([m[0], msg]); });
        if (unit.id === 'reports' && /\bpatients?\b/i.test(dt)) hits.push(['patients', 'The counting unit is reports: spontaneous counts are reports until de-duplicated, not patients.']);
        if ((unit.id === 'events' || unit.id === 'reports') && /\bcases?\b/i.test(dt) && !/unique cases?|potential cases?/i.test(dt)) hits.push(['cases', `The counting unit is ${unit.id}: they become cases only after de-duplication or adjudication.`]);
        if (/\b(developed|had|got)\b/i.test(dt) && unit.id !== 'patients') hits.push([dt.match(/\b(developed|had|got)\b/i)[0], 'Describes occurrence in patients; a coded term records what was reported, not an adjudicated diagnosis.']);
        const box = hits.length ? WB.callout('warn', `${hits.length} wording issue${hits.length === 1 ? '' : 's'} to review`, h('ul', {}, hits.map(([w, m]) => h('li', {}, [h('strong', {}, '“' + w + '”: '), m])))) : WB.callout('ok', 'No flagged wording', 'No listed pattern found. This is a prompt list, not a guarantee: check the sentence against the findings line by line.');
        box.setAttribute('data-k', 'draft-flags');
        resD.appendChild(box);
      } else resD.appendChild(WB.note('Paste a draft sentence to check it.'));

      // export content
      const esc = WB.esc;
      exportText = ['Calibrated wording — ' + c.product + ', ' + c.finding, '', 'Headline count: ' + headline + '.', '', 'Proposed wording:'].concat(sentences.map((s, i) => `${i + 1}. ${s}`), ['', 'Use: ' + Array.from(new Set(use)).join('; '), 'Avoid: ' + Array.from(new Set(avoid)).join('; '), '', 'Recommendation: ' + recText], hits.length ? ['', 'Draft checked: ' + dt].concat(hits.map(([w, m]) => `- "${w}": ${m}`)) : []).join('\n');
      exportHTML = `<h1>Calibrated wording</h1><p><b>${esc(c.product)}</b>: ${esc(c.finding)}. Query: ${esc(c.query)}.</p>` +
        `<table><tr><th>Evidence level reached</th><td>${li >= 0 ? esc(LEVELS[li].name) : 'not selected'}</td></tr><tr><th>Counting unit</th><td>${esc(unit.name)}</td></tr>` +
        `<tr><th>Headline count</th><td>${esc(headline)}</td></tr><tr><th>Proposed wording</th><td><ol>${sentences.map((s) => '<li>' + esc(s) + '</li>').join('')}</ol></td></tr>` +
        `<tr><th>Use</th><td>${Array.from(new Set(use)).map(esc).join('<br>')}</td></tr><tr><th>Avoid</th><td>${Array.from(new Set(avoid)).map(esc).join('<br>')}</td></tr>` +
        `<tr><th>Recommendation</th><td>${esc(recText)}<br><i>${missing.length ? 'Missing: ' + missing.map((k) => names[k]).join(', ') : 'All five elements present'}</i></td></tr>` +
        (dt ? `<tr><th>Draft checked</th><td>${esc(dt)}<ul>${hits.map(([w, m]) => '<li><b>' + esc(w) + '</b>: ' + esc(m) + '</li>').join('')}</ul></td></tr>` : '') +
        `</table><p class="foot">Verbatim to Signal Workbench — training tool, synthetic data. The reviewer is responsible for the final wording.</p>`;
      save();
    }

    el.appendChild(interpretation([
      'Calibrated wording matches the strength of the verb to the strength of the evidence and names the source and direction of each uncertainty. It avoids inflation (“causes”, “proven”, “increased risk”) and deflation (“no causal relationship can be established”, “safe”), both of which mislead the reader who decides.',
      'Keep finding, assessment and recommendation in separate sentences so each can be challenged. A coded term records what was reported, a case classification records what the evidence meets, and causality is a separate, named judgment. Disproportionality and reporting rates are context, never measures of risk.',
    ]));
    el.appendChild(bookLink('Chapter 18, Tables 18.1 and 18.2, Figure 18.3 (evidence-to-wording ladder), Examples 18.2 and 18.3, Case 18.1 and Exercise 18.1.'));
    if (st) load(st); else presets.querySelector('[data-preset="c181"]').click();
  }

  /* Scoped layout guard: tables and long selects must not widen the page at phone width
     (core .main is a grid item with min-width:auto). Prefixed to this module's tools only. */
  (function injectStyle() {
    if (document.getElementById('sv-style')) return;
    const st = document.createElement('style');
    st.id = 'sv-style';
    st.textContent = '.sv-tool textarea.mono{white-space:pre;overflow-x:auto}.sv-tool .tbl-wrap,.sv-tool select{width:0;min-width:100%}.sv-tool .field{min-width:0}.sv-tool textarea{min-width:0}.sv-tool .fields>.field:not(.wide){flex-basis:140px}';
    document.head.appendChild(st);
  })();
  const scoped = (fn) => function (el) { el.classList.add('sv-tool'); return fn(el); };

  /* ================= registration (order matters) ================= */
  WB.register({ id: 'liver-criteria', group: 'surveillance', title: 'Liver injury criteria and eDISH', summary: 'R ratio and injury pattern, DILI biochemical criteria and the potential Hy’s law screen for one patient or a whole arm, with an eDISH plot.', chapters: [13, 15, 22], render: scoped(renderLiver) });
  WB.register({ id: 'rates', group: 'surveillance', title: 'Incidence, EAIR and reporting rates', summary: 'Compare arms by patients, events and exposure-adjusted incidence; turn postmarketing reports into reporting rates and decompose a rise.', chapters: [15, 16], render: scoped(renderRates) });
  WB.register({ id: 'disproportionality', group: 'surveillance', title: 'Disproportionality screen', summary: 'ROR, PRR, chi-squared and shrunk observed/expected from a 2×2 table, with threshold rules and a forest plot. Screening of reporting patterns only.', chapters: [17], render: scoped(renderDisp) });
  WB.register({ id: 'version-effect', group: 'surveillance', title: 'Version effect decomposition', summary: 'Separate data, terminology and query effects on a count with a 2×2 controlled comparison.', chapters: [19], render: scoped(renderVersion) });
  WB.register({ id: 'wording', group: 'surveillance', title: 'Evidence-to-wording helper', summary: 'Calibrated sentences for the evidence level reached, words to avoid, a draft checker and a bounded recommendation.', chapters: [18], render: scoped(renderWording) });
})();
