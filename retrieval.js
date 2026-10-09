/* Verbatim to Signal Workbench — Retrieval lab (group 'retrieval')
   Tools: retrieval-selector, dataset-explorer, smq-algorithm, counting, search-performance.
   Synthetic data only (WB_DATA). Term names are those quoted in the book; hierarchy and SMQ
   placements are the book's illustrative working assumptions, not MedDRA content. */
(function () {
  'use strict';
  const h = WB.h;
  const D = window.WB_DATA;
  const P = D.pa301;
  const ARMS = ['Product A', 'Placebo'];
  const VERSIONS = 'MedDRA v29.0; SMQs v29.0';

  /* ------------------------------------------------------------------ shared helpers */
  (function injectStyle() {
    if (document.getElementById('rt-style')) return;
    const css = [
      '.rt-term i{font-style:italic}',
      'fieldset.rt-radios{border:1px solid var(--line);border-radius:8px;padding:8px 12px 10px;margin:10px 0;background:#fff;min-width:0}',
      'fieldset.rt-radios legend{font-weight:600;font-size:14px;color:var(--navy);padding:0 4px}',
      '.rt-radios label{display:inline-flex;align-items:flex-start;gap:6px;margin:4px 16px 4px 0;font-size:14px;line-height:1.35}',
      '.rt-radios.stack label{display:flex;margin:5px 0}',
      '.rt-radios input,.rt-chk input,.rt-inl input[type=checkbox]{width:auto;margin-top:3px;flex:none}',
      '.rt-step{border-left:4px solid var(--teal);padding-left:10px;margin:6px 0}',
      '.rt-step .rt-num{display:inline-block;background:var(--teal);color:#fff;border-radius:99px;font-size:12px;font-weight:700;padding:0 8px;margin-right:6px}',
      '.rt-rec{font-size:20px;font-weight:700;color:var(--navy);margin:2px 0 6px}',
      '.rt-spec{white-space:pre-wrap;word-break:break-word;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:12.5px;background:var(--mist);padding:12px;border-radius:8px;min-height:220px}',
      'mark.rt-hit{background:#FFE29A;color:inherit;padding:0 3px;border-radius:3px;border-bottom:2px solid var(--amber)}',
      '.rt-muted{color:var(--muted)}',
      '.rt-chk{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:2px 14px;margin:6px 0}',
      '.rt-chk label{display:flex;gap:6px;align-items:flex-start;font-size:14px;padding:3px 0}',
      '.rt-venn{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-top:10px}',
      '.rt-venn>div{background:var(--mist);border-radius:8px;padding:10px 12px;min-width:0}',
      '.rt-venn .both{background:var(--teal-l)}',
      '.rt-venn h3{font-size:14px;margin:0 0 4px}',
      '.rt-ids{font-family:ui-monospace,Menlo,Consolas,monospace;font-size:12.5px;line-height:1.6;word-break:break-word}',
      '.rt-nw{white-space:nowrap;font-family:ui-monospace,Menlo,Consolas,monospace;font-size:12.5px}',
      '.rt-big{font-size:24px;font-weight:700;color:var(--navy)}',
      '.rt-edit td{padding:4px 4px}',
      '.rt-edit input{padding:5px 6px;font-size:13px;min-width:70px}',
      '.rt-edit input[type=radio],.rt-edit input[type=checkbox]{min-width:0;width:auto;padding:0}',
      '.rt-body .tbl .pill{white-space:nowrap}',
      '.rt-edit input.w-s{min-width:56px;max-width:80px}',
      '.rt-edit input.w-l{min-width:230px}',
      '.rt-edit input.w-m{min-width:118px}',
      '.rt-pt{border:1px solid var(--line);border-radius:10px;padding:10px 12px;margin:10px 0;background:#FBFCFD}',
      '.rt-pt-head{display:flex;flex-wrap:wrap;gap:8px;align-items:flex-end;margin-bottom:6px}',
      '.rt-pt-head .field{max-width:220px}',
      '.rt-term-row{display:grid;grid-template-columns:minmax(150px,1fr) auto 84px auto;gap:6px 10px;align-items:center;padding:5px 0;border-bottom:1px solid var(--line)}',
      '.rt-term-row input[type=text],.rt-term-row input[type=number]{padding:5px 7px;font-size:13px}',
      '.rt-term-head{font-size:12.5px;font-weight:700;color:#2B3240;border-bottom:2px solid var(--navy);padding-top:0}',
      '@media (max-width:600px){.rt-term-row{grid-template-columns:1fr 64px auto}.rt-term-row .rt-tname{grid-column:1;grid-row:1}.rt-term-row .rt-day{grid-column:2;grid-row:1}.rt-term-row .rt-del{grid-column:3;grid-row:1}.rt-term-row .rt-cat{grid-column:1/-1;grid-row:2}.rt-term-head{display:none}}',
      '.rt-cat{display:flex;gap:2px;flex-wrap:nowrap}',
      '.rt-cat label{display:inline-flex;align-items:center;gap:2px;font-size:13px;cursor:pointer}',
      '.rt-cat input{width:auto;margin:0 1px 0 4px}',
      '.rt-inl{display:flex;flex-wrap:wrap;gap:8px 16px;align-items:center;margin:8px 0}',
      '.rt-inl label{display:inline-flex;gap:6px;align-items:center;font-size:14px}',
      '.rt-live{font-size:13px;color:var(--ok);min-height:1.2em}',
      '.rt-matrix{border-collapse:collapse;margin:8px 0;font-size:14px}',
      '.rt-matrix th,.rt-matrix td{border:1px solid var(--line);padding:8px 10px;text-align:center}',
      '.rt-matrix th{background:var(--mist);font-size:13px}',
      '.rt-matrix td.tp{background:var(--ok-l)}.rt-matrix td.tn{background:#F3F6F8}.rt-matrix td.fp,.rt-matrix td.fn{background:var(--bad-l)}',
      '.rt-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}',
      '.rt-tl{width:100%;max-width:720px;height:auto;display:block;margin:6px 0}',
      '.rt-tl .rec{fill:var(--navy)}.rt-tl .ep0{fill:#CFE6EA}.rt-tl .ep1{fill:#F6DFB3}.rt-tl .t{font-size:11px;fill:#2B3240}.rt-tl .ax{stroke:#9AA3AE}',
      /* keep wide tables scrolling inside their wrapper instead of widening the page (main is a grid item with min-width:auto) */
      '.rt-body .tbl-wrap{contain:inline-size;max-width:100%}',
      '.rt-body pre,.rt-body .rt-spec{max-width:100%}',
      '.rt-chart-wrap{overflow-x:auto;contain:inline-size;max-width:100%}',
      '@media (max-width:860px){.rt-venn{grid-template-columns:1fr}.rt-pt-head .field{max-width:none}.rt-body .fields>.field{flex-basis:100%}}',
      '@media (max-width:600px){.rt-chart-wrap svg{min-width:560px}.rt-body .result{grid-template-columns:1fr 1fr}.rt-body .stat .v{font-size:19px}}',
    ].join('\n');
    document.head.appendChild(h('style', { id: 'rt-style' }, css));
  })();

  /** MedDRA term in the book's convention: italic name + (LEVEL). */
  function T(name, level) { return h('span', { class: 'rt-term' }, [h('i', {}, name), ' (' + level + ')']); }
  function Tp(name, level) { return name + ' (' + level + ')'; }
  function panel(title, kids, cls) { return h('div', { class: 'panel' + (cls ? ' ' + cls : '') }, [title ? h('h2', {}, title) : null].concat(kids || [])); }
  function howTo(text) { return panel('How to use', [h('p', { style: 'margin:0' }, text)]); }
  function stat(k, v, s, tid) { return h('div', { class: 'stat' }, [h('div', { class: 'k' }, k), h('div', { class: 'v', 'data-testid': tid || null }, String(v)), s ? h('div', { class: 's' }, s) : null]); }
  function bookLink(kids) { return h('p', { class: 'note' }, [h('strong', {}, 'Book link: '), kids]); }
  function interp(paras) { return panel('Interpretation', paras.map((p) => (typeof p === 'string' ? h('p', {}, p) : p))); }
  function uniq(a) { return Array.from(new Set(a)); }
  function pct1(n, d) { return d ? WB.fmt((100 * n) / d, 1) + '%' : '—'; }
  function clear(el) { while (el.firstChild) el.removeChild(el.firstChild); return el; }
  /** Rebuild part of the UI and restore keyboard focus to the same radio/checkbox/select if it was inside host. */
  function keepFocus(host, fn) {
    const a = document.activeElement;
    const inside = a && host.contains(a);
    const key = inside ? { name: a.getAttribute('name'), value: a.value, tid: a.getAttribute('data-testid'), id: a.id, tag: a.tagName } : null;
    fn();
    if (!key) return;
    let t = null;
    if (key.name) t = host.querySelector('input[name="' + key.name + '"][value="' + (window.CSS && CSS.escape ? CSS.escape(key.value) : key.value) + '"]');
    else if (key.tid) t = host.querySelector('[data-testid="' + key.tid + '"]');
    if (t) t.focus({ preventScroll: true });
  }
  function chartWrap(svg) { return svg ? h('div', { class: 'rt-chart-wrap' }, svg) : null; }
  let uid = 0;
  function nid(p) { uid += 1; return (p || 'rt') + uid; }

  function selectField(label, options, value, onChange, opts) {
    opts = opts || {};
    const id = nid('sel');
    const sel = h('select', { id: id, 'data-testid': opts.tid || null });
    options.forEach((o) => {
      const v = typeof o === 'string' ? o : o.value;
      const t = typeof o === 'string' ? o : o.label;
      const op = h('option', { value: v }, t);
      if (v === value) op.selected = true;
      sel.appendChild(op);
    });
    if (onChange) sel.addEventListener('change', () => onChange(sel.value));
    const wrap = h('div', { class: 'field' + (opts.wide ? ' wide' : '') }, [h('label', { for: id }, label), sel, opts.hint ? h('small', {}, opts.hint) : null]);
    return { wrap, input: sel };
  }
  function radios(legend, name, options, value, onChange, opts) {
    opts = opts || {};
    const fs = h('fieldset', { class: 'rt-radios' + (opts.stack ? ' stack' : ''), 'data-testid': opts.tid || null }, [h('legend', {}, legend)]);
    options.forEach((o) => {
      const inp = h('input', { type: 'radio', name: name, value: o.value });
      if (o.value === value) inp.checked = true;
      inp.addEventListener('change', () => { if (inp.checked) onChange(o.value); });
      fs.appendChild(h('label', {}, [inp, h('span', {}, o.label)]));
    });
    if (opts.hint) fs.appendChild(h('small', { class: 'note', style: 'display:block;margin-top:4px' }, opts.hint));
    return fs;
  }
  function copyText(text, liveEl) {
    function fallback() {
      const ta = h('textarea', { style: 'position:fixed;left:-9999px;top:0' });
      ta.value = text; document.body.appendChild(ta); ta.select();
      let ok = false; try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
      ta.remove();
      liveEl.textContent = ok ? 'Copied to clipboard.' : 'Copy not available here: select the text and copy it manually.';
    }
    try {
      if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).then(() => { liveEl.textContent = 'Copied to clipboard.'; }, fallback);
      else fallback();
    } catch (e) { fallback(); }
  }

  /* ================================================================== 1. RETRIEVAL SELECTOR */
  const UNITS = [
    { value: 'patients', label: 'Patients' },
    { value: 'events', label: 'Events (coded AE records)' },
    { value: 'episodes', label: 'Episodes (by a stated rule)' },
    { value: 'cases', label: 'Cases (merged, de-duplicated ICSRs)' },
    { value: 'reports', label: 'Reports (workload)' },
    { value: 'listing', label: 'No count: a listing (coding review)' },
    { value: '', label: '— not yet stated —' },
  ];
  const YN = [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }];
  const SEL_PRESETS = {
    ex81_1: { label: 'Example 8.1, request 1: transaminitis coding', q: { question: 'Did sites code "transaminitis" and "raised transaminases" to the same term?', concept: 'Coding consistency of transaminase verbatims', population: 'PA-301 safety population, all sites', period: 'Controlled period (to Week 24); data cutoff 28 February 2023', sources: 'Coded AE dataset: verbatim, LLT, PT and site', unit: 'listing', terms: 'LLTs used under Transaminases increased (PT) and any other PT that received these verbatims, by site', versions: VERSIONS }, a: { s1: 'yes', lab: 'no' } },
    ex81_2: { label: 'Example 8.1, request 2: nausea', q: { question: 'How many patients reported nausea?', concept: 'Nausea', population: 'PA-301 safety population; Product A N=412, placebo N=206', period: 'Controlled period (to Week 24); data cutoff 28 February 2023', sources: 'Coded AE dataset', unit: 'patients', terms: 'Nausea (PT); sibling Vomiting (PT) checked in Nausea and vomiting symptoms (HLT) and left out', versions: VERSIONS }, a: { s1: 'no', s2: 'yes', s2b: 'no', lab: 'no' } },
    ex81_3: { label: 'Example 8.1, request 3: GI profile', q: { question: 'What does the gastrointestinal adverse event profile look like?', concept: 'Gastrointestinal adverse event profile', population: 'PA-301 safety population; Product A N=412, placebo N=206', period: 'Controlled period (to Week 24); data cutoff 28 February 2023', sources: 'Coded AE dataset', unit: 'patients', terms: 'Gastrointestinal disorders (SOC), displayed by primary SOC, HLGT and PT', versions: VERSIONS }, a: { s1: 'no', s2: 'no', s3: 'yes', s3b: 'socp', lab: 'no' } },
    ex81_4: { label: 'Example 8.1, request 4: severe skin reaction', q: { question: 'Has any patient had a possible severe skin reaction?', concept: 'Severe cutaneous adverse reaction', population: 'PA-301 safety population; Product A N=412, placebo N=206', period: 'Controlled period (to Week 24); data cutoff 28 February 2023', sources: 'Coded AE dataset; narratives for retrieved patients', unit: 'patients', terms: 'Severe cutaneous adverse reactions (SMQ), after reading its Introductory Guide entry', versions: VERSIONS }, a: { s1: 'no', s2: 'no', s3: 'no', s4: 'yes', purpose: 'unspecified', sub: 'no', lab: 'no' } },
    case81: { label: 'Case 8.1: PA-301 hepatic imbalance', q: { question: 'In the PA-301 controlled period, is there an imbalance in hepatic adverse events between Product A and placebo, and which patients need medical review?', concept: 'Potential drug-induced liver injury and hepatic adverse events', population: 'PA-301 safety population; Product A N=412, placebo N=206', period: 'Controlled period (to Week 24); data cutoff 28 February 2023', sources: 'Coded AE dataset and central laboratory data', unit: 'patients', terms: 'Drug related hepatic disorders - comprehensive search (SMQ), with contributing PTs shown underneath', versions: VERSIONS }, a: { s1: 'no', s2: 'no', s3: 'no', s4: 'yes', purpose: 'routine', sub: 'no', lab: 'yes' } },
    case82: { label: 'Case 8.2: Product B blood pressure drops', q: { question: 'In the Product B integrated pool, do patients have reported decreases in blood pressure around the time of infusion?', concept: 'Decreased blood pressure or hypotension around infusion', population: 'Product B integrated trial pool, N=900', period: 'All pooled trials; onset window relative to infusion to be stated', sources: 'Coded AE dataset; vital signs for review', unit: 'patients', terms: 'Blood pressure decreased (PT); Hypotension (PT) — not Vascular tests NEC (incl blood pressure) (HLT), which also holds Blood pressure increased (PT)', versions: VERSIONS }, a: { s1: 'no', s2: 'yes', s2b: 'yes', lab: 'yes' } },
    case101: { label: 'Case 10.1: Product B anaphylaxis', q: { question: 'In the Product B integrated pool, which patients had anaphylaxis, and which configuration should be the standing quarterly search?', concept: 'Anaphylaxis', population: 'Product B integrated trial pool, N=900', period: 'All pooled trials to the current cutoff', sources: 'Coded AE dataset; narratives for retrieved patients', unit: 'patients', terms: 'Anaphylactic reaction (SMQ)', versions: VERSIONS }, a: { s1: 'no', s2: 'no', s3: 'no', s4: 'yes', purpose: 'algorithm', sub: 'no', lab: 'no' } },
    exr81: { label: 'Exercise 8.1: jaundice on Product A', q: { question: 'Has any patient on Product A developed jaundice in the PA-301 open-label extension?', concept: 'Jaundice (visible jaundice or bilirubin rise: to be confirmed with the requester)', population: 'PA-301 patients on Product A in the open-label extension', period: 'Weeks 24–52', sources: 'Coded AE dataset and central laboratory data', unit: 'patients', terms: 'Jaundice (PT); Ocular icterus (PT); Hyperbilirubinaemia (PT); Blood bilirubin increased (PT), built after inspecting Cholestasis and jaundice (HLT)', versions: VERSIONS }, a: { s1: 'no', s2: 'yes', s2b: 'yes', lab: 'yes' } },
  };

  function recommend(a) {
    // returns {key, level, why, cautions[], scope, algorithm}
    const R = { cautions: [] };
    if (a.s1 === 'yes') {
      Object.assign(R, { key: 'llt', level: 'LLT listing (coding review)', why: 'The question is about how reporters’ words were coded, not about patients. List the LLTs used under the relevant PT, by site or source; report patient counts at PT level only if they are also needed.', scope: 'Not applicable (LLT listing; not a patient count)' });
      R.cautions.push('Do not answer a safety-counting question with an LLT search: it counts vocabulary, not events, and silently loses any variant not listed.');
      R.cautions.push('Legacy-converted or non-current LLTs need explicit handling; document why LLT level was used.');
      return R;
    }
    if (a.s1 !== 'no') return null;
    if (a.s2 === 'yes') {
      if (a.s2b === 'no') {
        Object.assign(R, { key: 'pt', level: 'PT', why: 'One precisely defined concept that maps to a single PT, and its HLT siblings do not carry the same concept. A PT search is the most transparent option when it fits.', scope: 'Not applicable (single PT)' });
        R.cautions.push('Record which sibling PTs you checked in the PT’s HLT and why each stays out.');
        R.cautions.push('Coding conventions move PT counts: a diagnosis coded without its consistent test results is invisible to a test-result PT (Case 8.1: PA-301-0147 and -0231).');
      } else if (a.s2b === 'yes') {
        Object.assign(R, { key: 'named', level: 'Named PT list (customized query)', why: 'One concept, but it is spread over sibling PTs or across SOCs. A short list of named PTs, built after inspecting the groupings, answers the question better than one PT or a whole grouping (Case 8.2, Example 8.3).', scope: 'Named PT list; each PT included or excluded with a recorded reason' });
        R.cautions.push('Count the union at patient level and show the overlap you subtracted (Case 8.2: 10 + 14 − 2 = 22 patients).');
        R.cautions.push('Search terms from the non-multiaxial Investigations SOC by name: they never link to a disorder SOC.');
        R.cautions.push('Your organization owns and maintains the list across MedDRA versions; never call it an SMQ.');
      } else return null;
      return R;
    }
    if (a.s2 !== 'no') return null;
    if (a.s3 === 'yes') {
      const v = a.s3b;
      if (v === 'socp') {
        Object.assign(R, { key: 'socp', level: 'SOC display by primary SOC and PT', why: 'An overall profile. In a primary-SOC display each PT appears once, so SOC rows add up to the patient count (Data Retrieval PtC, section 3.2).', scope: 'Primary SOC display (state it in the table title)' });
        R.cautions.push('A primary-SOC view hides secondary links and is unreliable for a targeted concern (Example 8.2: 2 vs 4 vs 5 patients).');
      } else if (v === 'socs') {
        Object.assign(R, { key: 'socs', level: 'SOC, primary plus secondary links', why: 'A focused look at every term linked to one organ system; secondary links recover part of what a primary view hides (Data Retrieval PtC, section 3.2.3.1).', scope: 'Primary plus secondary SOC display' });
        R.cautions.push('Rows double count: never add SOC totals in a primary-plus-secondary display; report each patient once per question.');
        R.cautions.push('Still misses Investigations terms (not multiaxial) and symptoms coded in other SOCs, such as Chromaturia (PT).');
      } else if (v === 'hlt' || v === 'hlgt') {
        const lv = v.toUpperCase();
        Object.assign(R, { key: v, level: lv + ' (after membership inspection)', why: v === 'hlt' ? 'A tight cluster of related terms within one SOC.' : 'A broader area within one SOC.', scope: lv + ' with every member PT marked in scope / review only / out of scope' });
        R.cautions.push('Read every member PT before use: names describe navigation, not your question (Data Retrieval PtC, section 2.5.1.1). Liver function analyses (HLT) mixes transaminase, bilirubin and GGT terms (Example 8.3).');
        R.cautions.push('One SOC only: disorder terms and test terms sit in different SOCs, so no HLT or HLGT holds both.');
      } else return null;
      return R;
    }
    if (a.s3 !== 'no') return null;
    if (a.s4 === 'yes') {
      const P2 = {
        alert: ['SMQ, narrow scope', 'Single case alert or expedited review: each match needs action, and noise wastes urgent time (Table 10.1).', 'Narrow'],
        routine: ['SMQ, broad scope reviewed in two tiers (narrow matches first)', 'Routine trial surveillance while the profile is not established: missing an early case costs more than review time (Table 10.1).', 'Broad (includes narrow); review narrow tier first, then broad-only'],
        signal: ['SMQ, narrow scope or a sub-SMQ', 'Quantitative signal screening: nonspecific matches dilute the comparison (Table 10.1).', 'Narrow, or a named sub-SMQ'],
        algorithm: ['Algorithmic SMQ (algorithm applied at case or episode level)', 'The syndrome presents as symptom combinations and the SMQ has an algorithm: it finds combinations without the full broad workload (Table 10.1; Product B: 8 of 9 cases at 1.9 reviews per case).', 'Algorithmic (broad terms combined by category)'],
        periodic: ['Broad-only tier of the SMQ, sampled or in full', 'A periodic check on what the routine narrow or algorithmic search misses (Table 10.1).', 'Broad minus narrow'],
        unspecified: ['SMQ (scope to be stated)', 'A defined condition that presents through several diagnoses, symptoms and test results, with an SMQ whose scope fits (Example 8.1, request 4).', '[state narrow, broad or algorithmic]'],
      };
      const p = P2[a.purpose] || P2.unspecified;
      Object.assign(R, { key: 'smq', level: p[0] + (a.sub === 'yes' ? '; at the sub-SMQ that matches the question' : ''), why: p[1] + (a.sub === 'yes' ? ' The SMQ is hierarchical and the question concerns one sub-area, so name the sub-SMQ and state the scope at that level (Example 10.2).' : ''), scope: p[2] });
      R.cautions.push('Read the SMQ Introductory Guide entry first: its inclusion and exclusion criteria, not its name, set the scope (Data Retrieval PtC, section 4.1).');
      R.cautions.push('The SMQ version must match the MedDRA version of the data; stamp both on every output (section 4.5).');
      R.cautions.push('State the scope, the level within any hierarchy and whether an algorithm was applied; “we ran the SMQ” is not a complete description.');
      R.cautions.push('Output is query matches (potential cases), not adjudicated cases; “drug related” in an SMQ name is not a causality finding (Case 9.2).');
      if (a.purpose === 'algorithm') {
        R.algorithm = 'Category A; or B and C; or D with B or C — terms combined within one case/episode. Episode rule: [e.g. onset on the infusion day or the next day]';
        R.cautions.push('Apply the algorithm at the case or episode level, never across a patient’s whole trial history (Example 10.3, T4); define and document the episode window.');
        R.cautions.push('Not all software supports algorithmic SMQs. Never run the broad search and label it as the algorithmic SMQ.');
      }
      return R;
    }
    if (a.s4 === 'partly') {
      Object.assign(R, { key: 'mod', level: 'Modified MedDRA query based on the SMQ', why: 'An SMQ fits the condition, but there is a compelling, documented reason to add or remove terms or change a term’s scope (Data Retrieval PtC, section 5.1).', scope: 'State the base SMQ, its scope and each modification' });
      R.cautions.push('Never call it an SMQ: name it “a modified MedDRA query based on …” and document every change (section 4.4). Your organization maintains it across versions.');
      R.cautions.push('Estimate what each exclusion saves in review and loses in sensitivity before adopting it (Case 11.2: dropping Syncope (PT) saved 3 reviews and lost the one unexplained report).');
      return R;
    }
    if (a.s4 === 'no') {
      Object.assign(R, { key: 'custom', level: 'Customized query', why: 'No SMQ fits the question, or the concern is defined differently from any SMQ (for example a protocol-defined AESI). Build a documented query from the clinical concept (Chapter 11).', scope: 'Customized term set with qualifying, pointer and excluded terms' });
      R.cautions.push('Build from PTs and grouping terms, not LLTs; survey top-down and bottom-up; review non-multiaxial SOCs and secondary links (Data Retrieval PtC, section 5.2).');
      R.cautions.push('Specify, test, version and maintain the query (Worksheet 2); never call it an SMQ.');
      return R;
    }
    return null;
  }

  WB.register({
    id: 'retrieval-selector',
    group: 'retrieval',
    title: 'Retrieval level selector',
    summary: 'Write the question first, answer a short decision tree, and get a recommended retrieval level with its cautions and a ready query specification.',
    chapters: [8, 9, 10, 11],
    render(el) {
      el.classList.add('rt-body');
      const saved = WB.store.getJSON('rt-selector', null);
      const st = saved || { q: { question: '', concept: '', population: '', period: '', sources: '', unit: '', terms: '', versions: VERSIONS }, a: {} };
      function save() { WB.store.setJSON('rt-selector', st); }

      el.appendChild(howTo('Write the safety question and its five parts (concept, population, period, data sources, counting unit), then answer the decision-tree questions in order. Each answer opens the next step, mirroring Figure 8.2. The result names a retrieval level, explains why, lists the cautions that apply, and builds a query specification (Worksheet 2 fields) that you can copy or export to Word. Use a book example to see a worked path.'));

      const presetRow = h('div', { class: 'btn-row' });
      Object.keys(SEL_PRESETS).forEach((k) => presetRow.appendChild(h('button', { class: 'btn small', type: 'button', 'data-preset': k, onclick: () => loadPreset(k) }, 'Load book example (' + SEL_PRESETS[k].label + ')')));
      presetRow.appendChild(h('button', { class: 'btn small', type: 'button', onclick: () => { st.q = { question: '', concept: '', population: '', period: '', sources: '', unit: '', terms: '', versions: VERSIONS }; st.a = {}; save(); buildForm(); refresh(); } }, 'Clear'));
      el.appendChild(panel('Book examples', [presetRow]));

      const formHost = h('div');
      const treeHost = h('div', { class: 'panel' });
      const outHost = h('div');
      el.appendChild(formHost);
      el.appendChild(treeHost);
      el.appendChild(outHost);

      function loadPreset(k) { const p = SEL_PRESETS[k]; st.q = Object.assign({}, p.q); st.a = Object.assign({}, p.a); save(); buildForm(); refresh(); }

      function refresh() { keepFocus(treeHost, buildTree); renderOut(); }
      function buildForm() {
        clear(formHost);
        const f = (key, label, opts) => WB.field(label, Object.assign({ type: 'text', value: st.q[key] || '', onInput: (e) => { st.q[key] = e.target.value; save(); renderOut(); } }, opts || {}));
        const qf = f('question', 'Safety question (one sentence)', { textarea: true, rows: 2, wide: true, placeholder: 'e.g. Do patients on Product A have more liver adverse events than patients on placebo?' });
        const fields = h('div', { class: 'fields' }, [
          qf.wrap,
          f('concept', 'Clinical concept', { placeholder: 'e.g. potential drug-induced liver injury' }).wrap,
          f('population', 'Population and denominators', { placeholder: 'e.g. PA-301 safety population; N=412 / 206' }).wrap,
          f('period', 'Period and data cutoff', { placeholder: 'e.g. controlled period; cutoff 28 Feb 2023' }).wrap,
          f('sources', 'Data sources', { placeholder: 'e.g. coded AEs and central laboratory data' }).wrap,
          selectField('Counting unit', UNITS, st.q.unit || '', (v) => { st.q.unit = v; save(); renderOut(); }, { tid: 'sel-unit' }).wrap,
          f('terms', 'Term, grouping or SMQ you intend to use (optional)', { wide: true, placeholder: 'Name it exactly, e.g. Drug related hepatic disorders - comprehensive search (SMQ)' }).wrap,
          f('versions', 'Versions', {}).wrap,
        ]);
        formHost.appendChild(panel('1. Write the question', [fields, h('p', { class: 'note' }, 'In the author’s practice a retrieval request is not accepted until it states the concept, population, period, data sources and counting unit (Chapter 8).')]));
      }

      function buildTree() {
        clear(treeHost);
        treeHost.appendChild(h('h2', {}, '2. Decision tree'));
        const a = st.a;
        const set = (k, v, resets) => { a[k] = v; (resets || []).forEach((r) => delete a[r]); save(); refresh(); };
        const step = (n, node) => h('div', { class: 'rt-step' }, [node]);
        treeHost.appendChild(step(1, radios('Step 1. Is the question about the coding itself (how verbatims were coded, or legacy-converted terms)?', 'rs1', YN, a.s1, (v) => set('s1', v, ['s2', 's2b', 's3', 's3b', 's4', 'purpose', 'sub']), { tid: 'q-s1' })));
        if (a.s1 === 'no') {
          treeHost.appendChild(step(2, radios('Step 2. Is it one precisely defined clinical concept (a single-concept question)?', 'rs2', YN, a.s2, (v) => set('s2', v, ['s2b', 's3', 's3b', 's4', 'purpose', 'sub']), { tid: 'q-s2' })));
          if (a.s2 === 'yes') treeHost.appendChild(step('2b', radios('Step 2b. After opening the PT’s HLT (and checking other SOCs): do sibling PTs or PTs in other SOCs also carry the concept?', 'rs2b', [{ value: 'no', label: 'No — one PT carries it' }, { value: 'yes', label: 'Yes — e.g. ALT, AST and transaminases; or Blood pressure decreased and Hypotension' }], a.s2b, (v) => set('s2b', v), { tid: 'q-s2b', stack: true })));
          if (a.s2 === 'no') {
            treeHost.appendChild(step(3, radios('Step 3. Is the purpose exploratory (what does an organ-system profile look like)?', 'rs3', YN, a.s3, (v) => set('s3', v, ['s3b', 's4', 'purpose', 'sub']), { tid: 'q-s3' })));
            if (a.s3 === 'yes') treeHost.appendChild(step('3b', radios('Step 3b. Which view does the question need?', 'rs3b', [
              { value: 'socp', label: 'Overall profile in which totals must add up (primary SOC and PT)' },
              { value: 'socs', label: 'Every term linked to one organ system (primary plus secondary SOC)' },
              { value: 'hlt', label: 'A tight cluster of terms within one SOC (HLT)' },
              { value: 'hlgt', label: 'A broader area within one SOC (HLGT)' },
            ], a.s3b, (v) => set('s3b', v), { tid: 'q-s3b', stack: true })));
            if (a.s3 === 'no') {
              treeHost.appendChild(step(4, radios('Step 4. It is a defined condition that may present through diagnoses, symptoms and test results across SOCs. Does an SMQ exist whose Introductory Guide scope fits the question?', 'rs4', [
                { value: 'yes', label: 'Yes, as published' },
                { value: 'partly', label: 'Partly — a compelling reason to add or remove terms' },
                { value: 'no', label: 'No SMQ fits (or the definition rests on other data)' },
              ], a.s4, (v) => set('s4', v, ['purpose', 'sub']), { tid: 'q-s4', stack: true })));
              if (a.s4 === 'yes') {
                treeHost.appendChild(step('4b', radios('Step 4b. What is the search for? (Table 10.1)', 'rpur', [
                  { value: 'alert', label: 'Single case alert or expedited review' },
                  { value: 'routine', label: 'Routine surveillance; profile not established' },
                  { value: 'signal', label: 'Quantitative signal screening' },
                  { value: 'algorithm', label: 'Syndrome presenting as symptom combinations, and the SMQ has an algorithm' },
                  { value: 'periodic', label: 'Periodic check on what a narrow search misses' },
                  { value: 'unspecified', label: 'Not decided yet (scope must still be stated)' },
                ], a.purpose, (v) => set('purpose', v), { tid: 'q-purpose', stack: true })));
                treeHost.appendChild(step('4c', radios('Step 4c. Is the SMQ hierarchical, with the question concerning only one of its sub-SMQs?', 'rsub', YN, a.sub, (v) => set('sub', v), { tid: 'q-sub' })));
              }
            }
          }
        }
        treeHost.appendChild(h('div', { class: 'rt-step' }, radios('Every path: is part of the evidence outside coded AEs (laboratory values, ECG, vital signs, narratives)?', 'rlab', [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No / not applicable' }], a.lab, (v) => set('lab', v), { tid: 'q-lab' })));
      }

      function specText(R) {
        const q = st.q;
        const unitL = (UNITS.find((u) => u.value === q.unit) || {}).label;
        const blank = (v, ph) => (v && String(v).trim() ? String(v).trim() : '[' + ph + ']');
        let count = q.unit === 'listing' ? 'No patient count; LLT listing by site/source' : blank(unitL && q.unit ? unitL : '', 'state the counting unit');
        if (q.unit === 'patients') count += ', counted once per arm; events listed separately';
        if (q.unit === 'episodes') count += '; episode rule: [state before looking at the data]';
        if (q.unit === 'cases' || q.unit === 'reports') count += '; latest version of each case; duplicates linked before counting';
        const lab = st.a.lab === 'yes';
        const rows = [
          ['Question', blank(q.question, 'write the question in one sentence')],
          ['Clinical concept', blank(q.concept, 'state the concept')],
          ['Population', blank(q.population, 'dataset, arms, denominators')],
          ['Period / cutoff', blank(q.period, 'period and data cutoff')],
          ['Data sources', blank(q.sources, 'coded AEs, laboratory, narratives…')],
          ['Versions', blank(q.versions, 'MedDRA and SMQ versions')],
          ['Retrieval level', R ? R.level : '[complete the decision tree]'],
          ['Term set or SMQ', blank(q.terms, 'name the PT(s), grouping or SMQ exactly')],
          ['Scope', R ? R.scope : '[scope]'],
          ['Algorithm / logic', R && R.algorithm ? R.algorithm : (lab ? 'Patient qualifies by the coded component OR the laboratory criterion: [state threshold, e.g. ALT >3×ULN]' : 'None')],
          ['Non-coded data', lab ? 'Laboratory/ECG/vital-sign criterion run alongside: [state criterion]; compare patient lists, not totals' : 'None stated'],
          ['Exclusions', '[term-level and case-level exclusions with reasons, or “none”]'],
          ['Counting rules', count],
          ['Review', 'Retrieved items are potential cases for medical review against a written case definition; causality is assessed separately.'],
        ];
        return rows;
      }

      function renderOut() {
        clear(outHost);
        const R = recommend(st.a);
        const q = st.q;
        const missing = [['concept', 'concept'], ['population', 'population'], ['period', 'period'], ['sources', 'data sources'], ['unit', 'counting unit']].filter((m) => !(q[m[0]] && String(q[m[0]]).trim())).map((m) => m[1]);
        const res = panel('3. Recommendation', []);
        if (missing.length) res.appendChild(WB.callout('warn', 'Before running anything', 'The question does not yet state: ' + missing.join(', ') + '. Confirm these with the requester.'));
        if (!R) {
          res.appendChild(h('p', { class: 'muted', 'data-testid': 'rec-level' }, 'Answer the decision-tree questions to get a recommendation.'));
        } else {
          res.appendChild(h('div', { class: 'rt-rec', 'data-testid': 'rec-level' }, R.level));
          res.appendChild(h('p', {}, [h('strong', {}, 'Why: '), R.why]));
          const cautions = R.cautions.slice();
          if (st.a.lab === 'yes') cautions.push('Add the non-coded criterion (for example ALT >3×ULN in central laboratory data) and compare patient lists: in PA-301 no coded search found the 5 laboratory-only patients (Case 8.1).');
          const ul = h('ul', { 'data-testid': 'rec-cautions' }, cautions.map((c) => h('li', {}, c)));
          res.appendChild(h('h3', {}, 'Cautions for this path'));
          res.appendChild(ul);
          res.appendChild(WB.callout('', 'Every path ends the same way (Figure 8.2)', h('ul', { style: 'margin:4px 0 0;padding-left:18px' }, [
            h('li', {}, 'Inspect the membership of any grouping or SMQ before use, and mark each PT in scope, out of scope or review only.'),
            h('li', {}, 'Check the non-multiaxial SOCs (Investigations; Surgical and medical procedures; Social circumstances): their PTs never link to disorder SOCs.'),
            h('li', {}, 'Check non-coded data, especially laboratory values, and write the counting unit and both versions in every output heading.'),
          ])));
        }
        outHost.appendChild(res);

        const rows = specText(R);
        const text = 'QUERY SPECIFICATION (Worksheet 2 fields)\n' + rows.map((r) => r[0] + ': ' + r[1]).join('\n') + '\nPrepared with the Verbatim to Signal Workbench (training tool; synthetic examples).';
        const pre = h('pre', { class: 'rt-spec', 'data-testid': 'spec-text', tabindex: '0', 'aria-label': 'Query specification text' }, text);
        const live = h('p', { class: 'rt-live', 'aria-live': 'polite' });
        const btns = h('div', { class: 'btn-row' }, [
          h('button', { class: 'btn primary', type: 'button', onclick: () => copyText(text, live) }, 'Copy text'),
          h('button', { class: 'btn', type: 'button', onclick: () => {
            const html = '<h1>Query specification</h1><table>' + rows.map((r) => '<tr><th>' + WB.esc(r[0]) + '</th><td>' + WB.esc(r[1]) + '</td></tr>').join('') + '</table>' + (R ? '<h2>Recommended level</h2><p>' + WB.esc(R.level) + '</p><p>' + WB.esc(R.why) + '</p><h2>Cautions</h2><ul>' + R.cautions.map((c) => '<li>' + WB.esc(c) + '</li>').join('') + '</ul>' : '') + '<p class="foot">Verbatim to Signal Workbench — training tool, synthetic examples; not validated software. ' + WB.esc(VERSIONS) + ' as stated.</p>';
            WB.exportDoc('query-specification.doc', 'Query specification', html);
          } }, 'Export to Word (.doc)'),
        ]);
        outHost.appendChild(panel('4. Query specification', [h('p', { class: 'note' }, 'Pre-filled from your answers. Square brackets mark what you still need to decide.'), pre, btns, live]));

        const matrix = WB.table(['Level', 'Use it when', 'Main limitation', 'PA-301 illustration'], [
          ['LLT', 'Auditing coding; legacy-converted data', 'Counts vocabulary, not events', ['Audit of ', T('Transaminitis', 'LLT'), ' use']],
          ['PT', 'One precisely defined concept', 'Related PTs fall outside the search', [T('Alanine aminotransferase increased', 'PT'), ': 10 vs 2']],
          ['HLT', 'A tight cluster within one SOC', 'One SOC only; may mix unrelated results', [T('Liver function analyses', 'HLT'), ': 18 vs 5']],
          ['HLGT', 'A broader area within one SOC', 'Disorders and tests sit in different SOCs', [T('Hepatic and hepatobiliary disorders', 'HLGT'), ': 3 vs 0']],
          ['SOC', 'Overall profile; organ-system exploration', 'Primary view hides secondary and test terms', [T('Hepatobiliary disorders', 'SOC'), ', primary: 4 vs 1']],
          ['SMQ', 'A defined condition across SOCs', 'Coded data only; scope must fit question', [T('Drug related hepatic disorders - comprehensive search', 'SMQ'), ': 21 vs 5']],
          ['Customized query', 'No SMQ fits the question', 'Must be specified and maintained', 'Protocol-defined hepatic events (Chapter 11)'],
        ], { caption: 'Table 8.1 Retrieval selection matrix (patients, Product A vs placebo; synthetic)', compact: true });
        outHost.appendChild(h('details', {}, [h('summary', {}, 'Retrieval selection matrix (Table 8.1)'), matrix]));
        outHost.appendChild(interp([
          'The level decides which patients are counted, so the one-sentence justification belongs in the output. A recommended level is a starting point for retrieval: what it returns are query matches (potential cases), which become cases only after medical review against a written definition, and causality is a separate assessment again.',
          'The tree is the author’s decision aid, consistent with the MedDRA Points to Consider documents; it is not an official algorithm, and your organization’s conventions may fix some choices.',
        ]));
        outHost.appendChild(bookLink('Chapter 8, Figure 8.2 and Table 8.1 (Example 8.1, Cases 8.1–8.2, Exercise 8.1); Chapter 9; Chapter 10, Table 10.1 and Case 10.1; Chapter 11, Worksheet 2.'));
      }

      buildForm();
      refresh();
    },
  });

  /* ================================================================== 2. DATASET EXPLORER */
  const REC = P.records;
  const CODED = REC.filter((r) => r.PT);
  const HIER = P.hierarchy;
  const secSOC = (pt) => ((HIER[pt] || {}).secondarySOC || []);
  const PT_LIST = uniq(CODED.map((r) => r.PT)).sort();
  const HLT_LIST = uniq(CODED.map((r) => r.HLT)).sort();
  const HLGT_LIST = uniq(CODED.map((r) => r.HLGT)).sort();
  const SOC_LIST = uniq(CODED.map((r) => r.primary_SOC).concat(...CODED.map((r) => secSOC(r.PT)))).sort();
  const PATIENTS = (function () {
    const m = new Map();
    REC.forEach((r) => {
      if (!m.has(r.patient_id)) m.set(r.patient_id, { id: r.patient_id, arm: r.arm, recs: [], alt: r.peak_ALT_xULN, tbl: r.peak_TBL_xULN, alp: r.peak_ALP_xULN, note: '' });
      const p = m.get(r.patient_id);
      if (r.PT) p.recs.push(r);
      if (r.note && !p.note) p.note = r.note;
    });
    return Array.from(m.values()).sort((a, b) => (a.arm === b.arm ? a.id.localeCompare(b.id) : a.arm === 'Product A' ? -1 : 1));
  })();

  function strategyDefs(s) {
    const pts = s.pts.length ? s.pts : [];
    return [
      { key: 'pt', short: pts.length === 1 ? 'PT' : 'Named PT list (' + pts.length + ')', long: () => (pts.length === 1 ? T(pts[0], 'PT') : h('span', {}, ['Named PT list: '].concat(pts.map((p, i) => [i ? '; ' : '', T(p, 'PT')]).flat()))), coded: true, m: (r) => pts.includes(r.PT) },
      { key: 'hlt', short: 'HLT', long: () => T(s.hlt, 'HLT'), coded: true, m: (r) => r.HLT === s.hlt },
      { key: 'hlgt', short: 'HLGT', long: () => T(s.hlgt, 'HLGT'), coded: true, m: (r) => r.HLGT === s.hlgt },
      { key: 'socp', short: 'SOC, primary', long: () => h('span', {}, [T(s.soc, 'SOC'), ', primary SOC display']), coded: true, m: (r) => r.primary_SOC === s.soc },
      { key: 'socs', short: 'SOC, primary+secondary', long: () => h('span', {}, [T(s.soc, 'SOC'), ', primary plus secondary links']), coded: true, m: (r) => r.primary_SOC === s.soc || secSOC(r.PT).includes(s.soc) },
      { key: 'smq', short: 'Hepatic SMQ', long: () => T('Drug related hepatic disorders - comprehensive search', 'SMQ'), coded: true, m: (r) => r.in_DRHD_comprehensive_SMQ },
      { key: 'alt3', short: 'Lab: ALT >3×ULN', long: () => 'Laboratory criterion: peak ALT >3×ULN (central laboratory data)', coded: false, p: (p) => p.alt > 3 },
      { key: 'hy', short: 'Lab: ALT >3× & TBL >2×ULN', long: () => 'Laboratory criterion: peak ALT >3×ULN and TBL >2×ULN (biochemical Hy’s law pattern)', coded: false, p: (p) => p.alt > 3 && p.tbl > 2 },
    ];
  }
  function runStrategy(def, arm) {
    const out = { ids: new Set(), events: 0, hits: new Map() };
    PATIENTS.forEach((p) => {
      if (arm && p.arm !== arm) return;
      if (def.coded) {
        const hs = p.recs.filter(def.m);
        if (hs.length) { out.ids.add(p.id); out.events += hs.length; out.hits.set(p.id, hs); }
      } else if (def.p(p)) { out.ids.add(p.id); out.hits.set(p.id, []); }
    });
    return out;
  }

  WB.register({
    id: 'dataset-explorer',
    group: 'retrieval',
    title: 'PA-301 dataset explorer',
    summary: 'Run PT, HLT, HLGT, SOC, SMQ and laboratory strategies on the synthetic PA-301 hepatic dataset and see whom each one finds and misses.',
    chapters: [2, 8, 9, 15],
    render(el) {
      el.classList.add('rt-body');
      const st = { strat: 'pt', pts: ['Alanine aminotransferase increased'], hlt: 'Liver function analyses', hlgt: 'Hepatobiliary investigations', soc: 'Hepatobiliary disorders', arm: '', cmpA: 'hlgt', cmpB: 'alt3' };
      el.appendChild(howTo('Pick a retrieval strategy and, where it applies, the term, grouping or SOC it uses. The tool runs it on the synthetic PA-301 controlled-period dataset and shows patients, events, the percentage of each arm and crude rates per 100 patient-years, then lists every retrieved patient with the matching terms highlighted. The chart compares all eight strategies with your current settings. Use the comparison panel to see which patients two strategies share and which only one finds: identical totals are not identical populations.'));
      el.appendChild(WB.callout('warn', 'About these data', D.meta.note + ' Controlled period; data cutoff 28 February 2023; ' + VERSIONS + '.'));

      const ctl = h('div', { class: 'panel' });
      const out = h('div');
      el.appendChild(ctl);
      el.appendChild(out);

      function buildControls() {
        clear(ctl);
        ctl.appendChild(h('h2', {}, 'Strategy'));
        const defs = strategyDefs(st);
        ctl.appendChild(radios('Retrieval strategy', 'dx-strat', defs.map((d) => ({ value: d.key, label: ({ pt: 'PT or named PT list', hlt: 'HLT', hlgt: 'HLGT', socp: 'SOC, primary only', socs: 'SOC, primary + secondary', smq: 'Hepatic SMQ (comprehensive search)', alt3: 'Lab: ALT >3×ULN', hy: 'Lab: ALT >3×ULN & TBL >2×ULN' })[d.key] })), st.strat, (v) => { st.strat = v; keepFocus(ctl, buildControls); update(); }, { tid: 'dx-strat' }));
        const params = h('div', { class: 'fields' });
        if (st.strat === 'pt') {
          const box = h('fieldset', { class: 'rt-radios', style: 'flex-basis:100%' }, [h('legend', {}, 'PTs to include (select one or more)')]);
          const grid = h('div', { class: 'rt-chk' });
          PT_LIST.forEach((pt) => {
            const cb = h('input', { type: 'checkbox', value: pt, 'data-pt': pt });
            cb.checked = st.pts.includes(pt);
            cb.addEventListener('change', () => { st.pts = PT_LIST.filter((x) => (x === pt ? cb.checked : st.pts.includes(x))); update(); });
            grid.appendChild(h('label', {}, [cb, h('span', {}, [T(pt, 'PT')])]));
          });
          box.appendChild(grid);
          params.appendChild(box);
        }
        if (st.strat === 'hlt') params.appendChild(selectField('HLT', HLT_LIST, st.hlt, (v) => { st.hlt = v; update(); }, { tid: 'dx-hlt' }).wrap);
        if (st.strat === 'hlgt') params.appendChild(selectField('HLGT', HLGT_LIST, st.hlgt, (v) => { st.hlgt = v; update(); }, { tid: 'dx-hlgt' }).wrap);
        if (st.strat === 'socp' || st.strat === 'socs') params.appendChild(selectField('SOC', SOC_LIST, st.soc, (v) => { st.soc = v; update(); }, { tid: 'dx-soc' }).wrap);
        params.appendChild(selectField('Arm', [{ value: '', label: 'Both arms' }, { value: 'Product A', label: 'Product A only (N=412)' }, { value: 'Placebo', label: 'Placebo only (N=206)' }], st.arm, (v) => { st.arm = v; update(); }, { tid: 'dx-arm' }).wrap);
        ctl.appendChild(params);
        const presets = h('div', { class: 'btn-row' }, [
          h('button', { class: 'btn small', type: 'button', onclick: () => { Object.assign(st, { strat: 'pt', pts: ['Alanine aminotransferase increased'] }); buildControls(); update(); } }, 'Load book example (Case 8.1, PT search)'),
          h('button', { class: 'btn small', type: 'button', onclick: () => { Object.assign(st, { strat: 'pt', pts: ['Alanine aminotransferase increased', 'Aspartate aminotransferase increased', 'Transaminases increased'] }); buildControls(); update(); } }, 'Load book example (Example 8.3, transaminase PTs)'),
          h('button', { class: 'btn small', type: 'button', onclick: () => { Object.assign(st, { strat: 'smq', cmpA: 'smq', cmpB: 'alt3' }); buildControls(); update(); } }, 'Load book example (Case 9.1, SMQ vs labs)'),
          h('button', { class: 'btn small', type: 'button', onclick: () => { Object.assign(st, { strat: 'socs', soc: 'Eye disorders' }); buildControls(); update(); } }, 'Secondary link demo (Eye disorders)'),
        ]);
        ctl.appendChild(presets);
      }

      function update() {
        clear(out);
        const defs = strategyDefs(st);
        const def = defs.find((d) => d.key === st.strat);
        const arms = st.arm ? [st.arm] : ARMS;
        if (def.key === 'pt' && !st.pts.length) { out.appendChild(WB.callout('warn', 'No PT selected', 'Tick at least one PT.')); return; }

        // results table
        const rows = arms.map((arm) => {
          const r = runStrategy(def, arm);
          const N = P.N[arm], PY = P.PY[arm];
          const k = arm === 'Product A' ? 'A' : 'P';
          const n = r.ids.size;
          return [
            h('span', {}, [h('span', { style: 'white-space:nowrap' }, arm), h('br'), h('small', { class: 'rt-muted' }, 'N=' + N + '; ' + PY + ' PY')]),
            h('span', { 'data-testid': 'pts-' + k }, String(n)),
            h('span', { 'data-testid': 'pct-' + k }, pct1(n, N)),
            h('span', { 'data-testid': 'ev-' + k }, def.coded ? String(r.events) : '— (lab criterion)'),
            h('span', { 'data-testid': 'irp-' + k }, WB.fmt((n / PY) * 100, 1)),
            h('span', { 'data-testid': 'ire-' + k }, def.coded ? WB.fmt((r.events / PY) * 100, 1) : '—'),
          ];
        });
        const res = panel('Result', [
          h('p', {}, [h('strong', {}, 'Strategy: '), def.long()]),
          WB.table(['Arm', 'Patients', '% of arm', 'Events', 'Patients per 100 PY*', 'Events per 100 PY*'], rows, { caption: 'Retrieved patients and events, PA-301 controlled period (synthetic)' }),
          h('p', { class: 'note' }, '* Crude rates using total controlled-period exposure (Product A 181.6 PY; placebo 86.9 PY), NOT time at risk to first event. A patient-based exposure-adjusted incidence rate needs patient-years at risk to the first event (Chapter 15), which this dataset does not hold.'),
        ]);
        if (def.key === 'hlt' || def.key === 'hlgt') {
          const r1 = runStrategy(defs.find((d) => d.key === 'hlt'), ''), r2 = runStrategy(defs.find((d) => d.key === 'hlgt'), '');
          if (st.hlt === 'Liver function analyses' && st.hlgt === 'Hepatobiliary investigations' && r1.ids.size === r2.ids.size) res.appendChild(WB.note('Liver function analyses (HLT) and Hepatobiliary investigations (HLGT) give identical results here only because every coded investigation PT in this dataset sits in that HLT; in larger datasets they diverge.'));
        }
        if (def.key === 'socp' || def.key === 'socs') res.appendChild(WB.note('The Investigations SOC is not multiaxial: its PTs (e.g. ALT increased) never appear under a disorder SOC, even with secondary links. Symptoms such as Chromaturia sit in their own SOCs.'));
        out.appendChild(res);

        // contributing PTs
        if (def.coded) {
          const ptRows = [];
          const byPt = new Map();
          ARMS.forEach((arm) => {
            const r = runStrategy(def, arm);
            r.hits.forEach((recs, id) => recs.forEach((rec) => {
              if (!byPt.has(rec.PT)) byPt.set(rec.PT, { 'Product A': [new Set(), 0], Placebo: [new Set(), 0] });
              const c = byPt.get(rec.PT)[arm]; c[0].add(id); c[1] += 1;
            }));
          });
          Array.from(byPt.keys()).sort().forEach((pt) => {
            const c = byPt.get(pt);
            ptRows.push([T(pt, 'PT'), c['Product A'][0].size + ' pts / ' + c['Product A'][1] + ' ev', c.Placebo[0].size + ' pts / ' + c.Placebo[1] + ' ev']);
          });
          out.appendChild(h('details', {}, [h('summary', {}, 'Contributing PTs (patients / events by arm)'), WB.table(['PT', 'Product A', 'Placebo'], ptRows, { compact: true, caption: 'Patient rows do not add up to the strategy total when a patient has more than one PT.' })]));
        }

        // chart across strategies
        const items = defs.map((d) => {
          const a = runStrategy(d, 'Product A'), b = runStrategy(d, 'Placebo');
          return { label: d.short, value: (100 * a.ids.size) / P.N['Product A'], value2: (100 * b.ids.size) / P.N.Placebo, text1: a.ids.size + ' (' + pct1(a.ids.size, 412) + ')', text2: b.ids.size + ' (' + pct1(b.ids.size, 206) + ')' };
        });
        const chart = WB.barChart(items, { series: ['Product A (N=412)', 'Placebo (N=206)'], unit: '%', left: 190, aria: 'Patients retrieved by each of eight strategies, as percent of arm, Product A versus placebo. ' + items.map((i) => i.label + ': ' + i.text1 + ' versus ' + i.text2).join('; ') });
        out.appendChild(panel('All strategies with your settings', [chartWrap(chart), h('p', { class: 'note' }, 'Patients, as % of arm. Bars differ in who they count, not only how many: the PT, grouping and SMQ rows are coded AEs; the last two rows are laboratory data. Synthetic PA-301, controlled period.')]));

        // patient list
        const r = runStrategy(def, st.arm || '');
        const prow = PATIENTS.filter((p) => r.ids.has(p.id)).map((p) => {
          const hits = r.hits.get(p.id) || [];
          const matched = def.coded
            ? h('span', {}, hits.map((rec, i) => [i ? ' ' : '', h('mark', { class: 'rt-hit' }, [T(rec.PT, 'PT'), ' D' + rec.study_day])]).flat())
            : h('mark', { class: 'rt-hit' }, 'ALT ' + WB.fmt(p.alt, 1) + '×ULN' + (def.key === 'hy' ? '; TBL ' + WB.fmt(p.tbl, 1) + '×ULN' : ''));
          const others = p.recs.filter((x) => !hits.includes(x));
          const otherNode = others.length ? h('span', { class: 'rt-muted' }, others.map((rec, i) => [i ? '; ' : '', T(rec.PT, 'PT')]).flat()) : h('span', { class: 'rt-muted' }, p.recs.length ? '—' : 'No AE reported');
          return [h('span', { class: 'rt-nw' }, p.id), h('span', { style: 'white-space:nowrap' }, p.arm), matched, otherNode, WB.fmt(p.alt, 1), WB.fmt(p.tbl, 1), p.note || ''];
        });
        out.appendChild(panel('Retrieved patients (' + r.ids.size + (st.arm ? ', ' + st.arm : ', both arms') + ')', [
          prow.length ? WB.table(['Patient', 'Arm', 'Matched (highlighted)', 'Other coded terms', 'Peak ALT ×ULN', 'Peak TBL ×ULN', 'Note'], prow, { compact: true }) : h('p', { class: 'muted' }, 'No patients retrieved.'),
          h('p', { class: 'note' }, 'Matched terms are highlighted and labelled with their study day (D). These are query matches (potential cases), not adjudicated cases.'),
        ]));

        // compare
        const optList = defs.map((d) => ({ value: d.key, label: d.short + (d.key === 'pt' ? ': ' + st.pts.join(', ') : d.key === 'hlt' ? ': ' + st.hlt : d.key === 'hlgt' ? ': ' + st.hlgt : d.key.startsWith('soc') ? ': ' + st.soc : '') }));
        const cmp = panel('Compare two strategies', []);
        cmp.appendChild(h('div', { class: 'fields' }, [
          selectField('Strategy A', optList, st.cmpA, (v) => { st.cmpA = v; update(); }, { tid: 'cmp-a' }).wrap,
          selectField('Strategy B', optList, st.cmpB, (v) => { st.cmpB = v; update(); }, { tid: 'cmp-b' }).wrap,
        ]));
        const ra = runStrategy(defs.find((d) => d.key === st.cmpA), st.arm || '');
        const rb = runStrategy(defs.find((d) => d.key === st.cmpB), st.arm || '');
        const onlyA = [...ra.ids].filter((x) => !rb.ids.has(x)).sort(), both = [...ra.ids].filter((x) => rb.ids.has(x)).sort(), onlyB = [...rb.ids].filter((x) => !ra.ids.has(x)).sort();
        const box = (title, ids, cls, tid) => h('div', { class: cls }, [h('h3', {}, title), h('div', { class: 'rt-big', 'data-testid': tid }, String(ids.length)), h('div', { class: 'rt-ids' }, ids.length ? ids.join(', ') : '—')]);
        cmp.appendChild(h('p', { class: 'note' }, 'Population: ' + (st.arm || 'both arms') + '. A retrieved ' + ra.ids.size + ', B retrieved ' + rb.ids.size + '.'));
        cmp.appendChild(h('div', { class: 'rt-venn' }, [box('Only in A', onlyA, '', 'cmp-onlyA'), box('In both', both, 'both', 'cmp-both'), box('Only in B', onlyB, '', 'cmp-onlyB')]));
        if (ra.ids.size === rb.ids.size && (onlyA.length || onlyB.length)) cmp.appendChild(WB.callout('warn', 'Same total, different patients', 'Both strategies retrieve ' + ra.ids.size + ' patients, but only ' + both.length + ' are in both. Compare patient lists, not totals (Case 8.1).'));
        out.appendChild(cmp);

        out.appendChild(interp([
          'Each strategy answers a different question about the same patients. The PT search misses PA-301-0147, the most severe patient, because her abnormal tests were captured within a diagnosis; the grouping search adds patients with other explanations (PA-301-0312 alcohol, PA-301-0333 Gilbert syndrome); the SMQ gives the most complete coded-data picture but still misses the 5 Product A patients whose ALT rise exists only in laboratory data.',
          'Retrieved patients are potential cases. Whether each is a case of liver injury is a medical-review question, and whether Product A caused it is a separate causality assessment. A more-retrieved-on-drug pattern is a reason to review, not a conclusion.',
        ]));
        out.appendChild(bookLink('Chapter 2, Case 2.2 and Figure 2.3; Chapter 8, Case 8.1, Table 8.2 and Figure 8.4; Chapter 9, Case 9.1; Chapter 12 (events vs patients per 100 PY); Chapter 15 (time at risk).'));
      }
      buildControls();
      update();
    },
  });

  /* ================================================================== 3. SMQ ALGORITHM SIMULATOR */
  const CATS = [
    { k: 'A', label: 'A narrow' },
    { k: 'B', label: 'B upper airway / respiratory' },
    { k: 'C', label: 'C angioedema / urticaria / pruritus / flush' },
    { k: 'D', label: 'D cardiovascular / hypotension' },
  ];
  const ANA_TERMS = { 'Anaphylactic reaction': 'A', 'Throat tightness': 'B', Wheezing: 'B', Angioedema: 'C', Urticaria: 'C', Pruritus: 'C', Flushing: 'C', Hypotension: 'D', 'Blood pressure decreased': 'D' };
  const EX103 = [
    { id: 'T1', terms: [{ name: 'Anaphylactic reaction', cat: 'A', day: 29 }] },
    { id: 'T2', terms: [{ name: 'Throat tightness', cat: 'B', day: 57 }, { name: 'Pruritus', cat: 'C', day: 58 }] },
    { id: 'T3', terms: [{ name: 'Flushing', cat: 'C', day: 85 }, { name: 'Blood pressure decreased', cat: 'D', day: 85 }] },
    { id: 'T4', terms: [{ name: 'Wheezing', cat: 'B', day: 44 }, { name: 'Urticaria', cat: 'C', day: 113 }] },
    { id: 'T5', terms: [{ name: 'Hypotension', cat: 'D', day: 141 }] },
  ];
  const PB_ILLUS = [
    { id: 'PB-0712', terms: [{ name: 'Anaphylactic reaction', cat: 'A', day: 57 }, { name: 'Urticaria', cat: 'C', day: 57 }] },
    { id: 'PB-0388 (as coded)', terms: [{ name: 'Hypotension', cat: 'D', day: 57 }] },
    { id: 'PB-0388 (after coding fix)', terms: [{ name: 'Hypotension', cat: 'D', day: 57 }, { name: 'Urticaria', cat: 'C', day: 57 }] },
    { id: 'Algorithm-only 1', terms: [{ name: 'Throat tightness', cat: 'B', day: 29 }, { name: 'Urticaria', cat: 'C', day: 29 }] },
    { id: 'Algorithm-only 2', terms: [{ name: 'Wheezing', cat: 'B', day: 85 }, { name: 'Hypotension', cat: 'D', day: 85 }] },
    { id: 'Algorithm-only 3', terms: [{ name: 'Angioedema', cat: 'C', day: 113 }, { name: 'Blood pressure decreased', cat: 'D', day: 113 }] },
  ];
  function rulesMet(cats) {
    const s = new Set(cats), out = [];
    if (s.has('A')) out.push('Rule 1 (A)');
    if (s.has('B') && s.has('C')) out.push('Rule 2 (B+C)');
    if (s.has('D') && (s.has('B') || s.has('C'))) out.push('Rule 3 (' + (s.has('B') ? 'B' : 'C') + '+D)');
    return out;
  }
  function episodesFor(terms, cfg) {
    const valid = terms.filter((t) => t.cat);
    if (cfg.rule === 'whole') return [{ label: 'Whole history', terms: valid }];
    const eps = [];
    if (cfg.rule === 'infusion') {
      const inf = cfg.infusions;
      const map = new Map();
      valid.forEach((t) => {
        const d = Number(t.day);
        if (t.day === '' || t.day === null || !isFinite(d)) { eps.push({ label: 'Onset unknown', terms: [t], none: true }); return; }
        const hit = inf.find((x) => d >= x && d <= x + cfg.window);
        if (hit === undefined) { eps.push({ label: 'Day ' + d + ': no infusion episode', terms: [t], none: true, start: d }); return; }
        if (!map.has(hit)) map.set(hit, { label: 'Infusion Day ' + hit, terms: [], start: hit });
        map.get(hit).terms.push(t);
      });
      return Array.from(map.values()).concat(eps).sort((a, b) => (a.start === undefined ? Infinity : a.start) - (b.start === undefined ? Infinity : b.start));
    }
    // gap rule: group terms whose onset is within N days of the episode's first term
    const dated = valid.filter((t) => t.day !== '' && t.day !== null && isFinite(Number(t.day))).sort((a, b) => a.day - b.day);
    valid.filter((t) => !dated.includes(t)).forEach((t) => eps.push({ label: 'Onset unknown', terms: [t], none: true }));
    let cur = null;
    dated.forEach((t) => {
      const d = Number(t.day);
      if (!cur || d - cur.start > cfg.gap) { cur = { label: 'Days ' + d, start: d, end: d, terms: [] }; eps.unshift(cur); }
      cur.terms.push(t); cur.end = d;
    });
    eps.forEach((e) => { if (!e.none && e.end !== e.start) e.label = 'Days ' + e.start + '–' + e.end; });
    return eps.filter((e) => !e.none).sort((a, b) => a.start - b.start).concat(eps.filter((e) => e.none));
  }

  WB.register({
    id: 'smq-algorithm',
    group: 'retrieval',
    title: 'Anaphylaxis algorithm simulator',
    summary: 'Build test patients from category A–D terms and see who the narrow, algorithmic and broad configurations of the anaphylaxis SMQ retrieve, episode by episode.',
    chapters: [10, 12],
    render(el) {
      el.classList.add('rt-body');
      const st = { rule: 'infusion', infusions: '1, 29, 57, 85, 113, 141', window: 1, gap: 1, patients: JSON.parse(JSON.stringify(EX103)) };
      el.appendChild(howTo('Each test patient has one or more coded terms. For each term, tick the algorithm category it belongs to (A narrow; B upper airway or respiratory; C angioedema, urticaria, pruritus or flush; D cardiovascular or hypotension), optionally type the term name, and give its onset study day. Choose how terms are grouped into episodes. The results table shows, per patient, whether the narrow search (any A term), the algorithm (A; or B+C; or D with B or C, within one episode) and the broad search without the algorithm (any A–D term) retrieve them. Load Example 10.3 to check an implementation against the book’s hand-worked answers.'));
      el.appendChild(WB.callout('warn', 'Apply the algorithm at the case or episode level', 'An algorithmic SMQ combines terms within one case. In trial data, one patient accumulates events for months, so the organization must define and document the episode within which terms are combined (the infusion day or next day is the author’s recommendation for an infusion product, not part of the SMQ). Not all software supports algorithmic SMQs; a broad search must never be reported as the algorithmic SMQ. Take the categories and logic from the SMQ Introductory Guide for the version in use.'));

      const cfgHost = h('div', { class: 'panel' });
      const edHost = h('div', { class: 'panel' });
      const resHost = h('div');
      el.appendChild(cfgHost); el.appendChild(edHost); el.appendChild(resHost);

      function cfg() {
        const inf = String(st.infusions).split(/[,;\s]+/).filter((x) => x.trim() !== '').map(Number).filter((x) => isFinite(x)).sort((a, b) => a - b);
        return { rule: st.rule, infusions: uniq(inf), window: Math.max(0, Number(st.window) || 0), gap: Math.max(0, Number(st.gap) || 0) };
      }

      function buildCfg() {
        clear(cfgHost);
        cfgHost.appendChild(h('h2', {}, 'Episode rule'));
        cfgHost.appendChild(radios('How are terms grouped before the algorithm is applied?', 'sa-rule', [
          { value: 'infusion', label: 'Infusion episode: onset on an infusion day or within the window after it' },
          { value: 'gap', label: 'Onset within N days of the first term of the episode' },
          { value: 'whole', label: 'Whole patient history (incorrect for trial data — for demonstration)' },
        ], st.rule, (v) => { st.rule = v; keepFocus(cfgHost, buildCfg); update(); }, { stack: true, tid: 'sa-rule' }));
        const f = h('div', { class: 'fields' });
        if (st.rule === 'infusion') {
          f.appendChild(WB.field('Infusion study days', { type: 'text', value: st.infusions, onInput: (e) => { st.infusions = e.target.value; update(); }, hint: 'Comma-separated, e.g. every 4 weeks from Day 1' }).wrap);
          f.appendChild(WB.field('Window after infusion day (days)', { value: st.window, min: 0, step: 1, onInput: (e) => { st.window = e.target.value; update(); }, hint: '1 = infusion day or the next day' }).wrap);
        }
        if (st.rule === 'gap') f.appendChild(WB.field('N (days)', { value: st.gap, min: 0, step: 1, onInput: (e) => { st.gap = e.target.value; update(); } }).wrap);
        if (f.children.length) cfgHost.appendChild(f);
        cfgHost.appendChild(h('div', { class: 'btn-row' }, [
          h('button', { class: 'btn small', type: 'button', onclick: () => { Object.assign(st, { rule: 'infusion', infusions: '1, 29, 57, 85, 113, 141', window: 1, patients: JSON.parse(JSON.stringify(EX103)) }); buildCfg(); buildEditor(); update(); } }, 'Load book example (Example 10.3, T1–T5)'),
          h('button', { class: 'btn small', type: 'button', onclick: () => { Object.assign(st, { rule: 'infusion', infusions: '1, 29, 57, 85, 113, 141', window: 1, patients: JSON.parse(JSON.stringify(PB_ILLUS)) }); buildCfg(); buildEditor(); update(); } }, 'Product B illustrative patients (Cases 10.1–10.2)'),
          h('button', { class: 'btn small', type: 'button', onclick: () => { st.patients = [{ id: 'P1', terms: [{ name: '', cat: '', day: '' }] }]; buildEditor(); update(); } }, 'Start blank'),
        ]));
        cfgHost.appendChild(h('p', { class: 'note' }, 'Product B illustrative patients use the coded terms the book reports for PB-0712, PB-0388 and the three algorithm-only cases; their onset days are assumed to fall on an infusion day (PB-0388 was in cycle 3, Day 57).'));
      }

      const dlId = nid('dl');
      function buildEditor() {
        clear(edHost);
        edHost.appendChild(h('h2', {}, 'Test patients and coded terms'));
        edHost.appendChild(h('datalist', { id: dlId }, Object.keys(ANA_TERMS).map((t) => h('option', { value: t }))));
        st.patients.forEach((p, pi) => {
          const box = h('div', { class: 'rt-pt', 'data-patient': String(pi) });
          const idF = WB.field('Patient ID', { type: 'text', value: p.id, onInput: (e) => { p.id = e.target.value; update(); } });
          box.appendChild(h('div', { class: 'rt-pt-head' }, [idF.wrap, h('button', { class: 'btn small', type: 'button', 'aria-label': 'Remove patient ' + p.id, onclick: () => { st.patients.splice(pi, 1); buildEditor(); update(); } }, 'Remove patient')]));
          const rows = p.terms.map((t, ti) => {
            const name = h('input', { type: 'text', class: 'rt-tname', value: t.name || '', list: dlId, 'aria-label': 'Term name (optional), ' + p.id + ' term ' + (ti + 1), placeholder: 'optional' });
            const cat = h('div', { class: 'rt-cat', role: 'radiogroup', 'aria-label': 'Category, ' + p.id + ' term ' + (ti + 1) });
            const radioEls = {};
            CATS.forEach((c) => {
              const r = h('input', { type: 'radio', name: 'cat-' + pi + '-' + ti + '-' + uid, value: c.k, 'aria-label': 'Category ' + c.label, 'data-cat': c.k });
              if (t.cat === c.k) r.checked = true;
              r.addEventListener('change', () => { if (r.checked) { t.cat = c.k; update(); } });
              radioEls[c.k] = r;
              cat.appendChild(h('label', { title: c.label }, [r, h('span', { class: 'pill ' + c.k }, c.k)]));
            });
            name.addEventListener('input', () => {
              t.name = name.value;
              const k = ANA_TERMS[name.value];
              if (k && !t.cat) { t.cat = k; radioEls[k].checked = true; }
              update();
            });
            const day = h('input', { type: 'number', class: 'rt-day', step: '1', placeholder: 'day', value: t.day === '' || t.day === undefined ? '' : String(t.day), 'aria-label': 'Onset study day, ' + p.id + ' term ' + (ti + 1) });
            day.addEventListener('input', () => { t.day = day.value === '' ? '' : Number(day.value); update(); });
            const del = h('button', { class: 'btn small rt-del', type: 'button', 'aria-label': 'Remove term ' + (ti + 1) + ' of ' + p.id, onclick: () => { p.terms.splice(ti, 1); buildEditor(); update(); } }, '×');
            return h('div', { class: 'rt-term-row' }, [name, cat, day, del]);
          });
          box.appendChild(h('div', { class: 'rt-term-row rt-term-head', 'aria-hidden': 'true' }, [h('span', {}, 'Term (PT, optional)'), h('span', {}, 'Category'), h('span', {}, 'Onset day'), h('span', {}, '')]));
          rows.forEach((r) => box.appendChild(r));
          box.appendChild(h('button', { class: 'btn small', type: 'button', onclick: () => { p.terms.push({ name: '', cat: '', day: '' }); buildEditor(); update(); } }, 'Add term'));
          edHost.appendChild(box);
        });
        edHost.appendChild(h('div', { class: 'btn-row' }, [h('button', { class: 'btn', type: 'button', onclick: () => { st.patients.push({ id: 'P' + (st.patients.length + 1), terms: [{ name: '', cat: '', day: '' }] }); buildEditor(); update(); } }, 'Add patient')]));
        edHost.appendChild(h('p', { class: 'note' }, 'Category legend: ' + CATS.map((c) => c.label).join('; ') + '. Typing a term the book assigns to a category (e.g. Urticaria) ticks that category for you; check it against the Introductory Guide.'));
      }

      function update() {
        clear(resHost);
        const c = cfg();
        const tally = { n: 0, narrow: 0, algo: 0, broad: 0 };
        const rows = st.patients.map((p, pi) => {
          const terms = p.terms.filter((t) => t.cat);
          const eps = episodesFor(p.terms, c);
          const epNodes = eps.map((e) => {
            const rm = rulesMet(e.terms.map((t) => t.cat));
            return h('div', { style: 'margin:2px 0' }, [h('strong', {}, e.label + ': ')].concat(e.terms.map((t, i) => [i ? ' + ' : '', h('span', { class: 'pill ' + t.cat }, t.cat), t.name ? [' ', h('i', {}, t.name)] : '']).flat(2), [rm.length ? h('span', { class: 'note' }, ' → ' + rm.join(', ')) : null]));
          });
          const narrow = terms.some((t) => t.cat === 'A');
          const algoRules = uniq(eps.map((e) => rulesMet(e.terms.map((t) => t.cat))).flat());
          const algo = algoRules.length > 0;
          const broad = terms.length > 0;
          tally.n += 1; if (narrow) tally.narrow += 1; if (algo) tally.algo += 1; if (broad) tally.broad += 1;
          const pill = (yes, tid, extra) => h('span', { class: 'pill ' + (yes ? 'yes' : 'no'), 'data-testid': tid }, (yes ? 'Retrieved' : 'Not retrieved') + (extra ? ' — ' + extra : ''));
          return [h('span', { class: 'rt-nw' }, p.id || '(no ID)'), h('div', {}, epNodes.length ? epNodes : h('span', { class: 'muted' }, 'No categorized terms')), pill(narrow, 'nar-' + pi), pill(algo, 'alg-' + pi, algoRules.join(', ')), pill(broad, 'brd-' + pi)];
        });
        const res = panel('Results per patient', [
          h('div', { class: 'result' }, [
            stat('Narrow (A)', tally.narrow + ' of ' + tally.n, 'any Category A term', 'tally-narrow'),
            stat('Algorithmic', tally.algo + ' of ' + tally.n, 'A, or B+C, or (B or C)+D in one episode', 'tally-algo'),
            stat('Broad, no algorithm', tally.broad + ' of ' + tally.n, 'any A–D term', 'tally-broad'),
          ]),
          WB.table(['Patient', 'Episodes and categories', 'Narrow', 'Algorithmic', 'Broad, no algorithm'], rows, { compact: true }),
        ]);
        if (c.rule === 'whole') res.appendChild(WB.callout('bad', 'Combining across the whole history', 'This grouping ignores timing: a patient with wheezing in Month 2 and urticaria in Month 8 becomes an algorithmic match (Example 10.3, T4). A program that does this fails validation.'));
        resHost.appendChild(res);

        // Product B summary (canon)
        const S = D.anaphylaxis.strategies;
        const keys = Object.keys(S);
        const ref = 9, N = 900, nonCases = N - ref;
        const prow = keys.map((k, i) => {
          const s = S[k];
          const tn = nonCases - s.false_positive;
          const dg = WB.stats.diag(s.true_cases, s.false_positive, s.missed, tn);
          const tid = ['n', 'a', 'b'][i];
          return [k, h('span', { 'data-testid': 'pb-ret-' + tid }, String(s.retrieved)), h('span', { 'data-testid': 'pb-tp-' + tid }, String(s.true_cases)), String(s.false_positive), String(s.missed), h('span', { 'data-testid': 'pb-sens-' + tid }, WB.fmt(dg.sens * 100, 1) + '%'), h('span', { 'data-testid': 'pb-prec-' + tid }, WB.fmt(dg.ppv * 100, 1) + '%'), WB.fmt(dg.spec * 100, 1) + '%', WB.fmt(s.retrieved / s.true_cases, 1)];
        });
        const chart = WB.barChart(keys.map((k) => ({ label: ['Narrow (A)', 'Algorithmic', 'Broad, no algorithm'][keys.indexOf(k)], value: S[k].retrieved, value2: S[k].true_cases, text1: S[k].retrieved + ' retrieved', text2: S[k].true_cases + ' of 9 true' })), { series: ['Retrieved', 'True cases'], dp: 0, left: 150, aria: 'Product B anaphylaxis retrieval: narrow 6 retrieved, 5 true; algorithmic 15 retrieved, 8 true; broad 74 retrieved, 9 true, against 9 adjudicated cases.' });
        resHost.appendChild(panel('Book reference: Product B anaphylaxis retrieval (Table 10.2, Table 12.2)', [
          h('p', {}, D.anaphylaxis.product + '. Reference set: ' + D.anaphylaxis.reference_set + '.'),
          WB.table(['Configuration', 'Retrieved', 'True cases', 'False pos.', 'Missed', 'Sensitivity', 'Precision', 'Specificity', 'Reviewed per case'], prow, { compact: true, caption: 'Anaphylactic reaction (SMQ), synthetic Product B pool, N=900 patients; ' + VERSIONS }),
          chartWrap(chart),
          h('ul', {}, D.anaphylaxis.notes.map((n) => h('li', {}, n))),
        ]));
        resHost.appendChild(interp([
          'Narrow, algorithmic and broad are three different searches. Moving from narrow to algorithmic found 3 more cases for 9 more reviews; moving from algorithmic to broad found 1 more case for 59 more reviews. The broad search always contains the narrow search.',
          'A match is a retrieved, potential case. Whether it is anaphylaxis is decided by medical review against clinical criteria; whether Product B caused it is a separate causality assessment. A case missed because a reported sign was never coded (PB-0388) is fixed in the coding, not by changing the query.',
        ]));
        resHost.appendChild(bookLink('Chapter 10, Figure 10.3, Example 10.3, Cases 10.1–10.2, Table 10.2; Chapter 12, Case 12.2.'));
      }
      buildCfg();
      buildEditor();
      update();
    },
  });

  /* ================================================================== 4. COUNTING UNITS AND EPISODES */
  const C_PRESETS = {
    c121: { label: 'Case 12.1', gap: 14, pool: true, rows: [
      { report: 'CRF-0388', cs: 'PA-301-0388', dup: '', patient: 'PA-301-0388', pt: 'Alanine aminotransferase increased', on: 29, end: '', note: '"ALT up"' },
      { report: 'CRF-0388', cs: 'PA-301-0388', dup: '', patient: 'PA-301-0388', pt: 'Aspartate aminotransferase increased', on: 29, end: '', note: '"AST up"' },
      { report: 'CRF-0388', cs: 'PA-301-0388', dup: '', patient: 'PA-301-0388', pt: 'Hepatic enzyme increased', on: 113, end: '', note: '"liver enzymes raised again"' },
    ] },
    e122: { label: 'Example 12.2', gap: 14, pool: true, rows: [
      { report: 'R1', cs: 'CASE-01', dup: '', patient: '', pt: 'Hepatitis', on: '', end: '', note: 'Physician; woman aged 54; initial' },
      { report: 'R2', cs: 'CASE-01', dup: '', patient: '', pt: 'Hepatitis', on: '', end: '', note: 'Same physician and case identifier; follow-up' },
      { report: 'R2', cs: 'CASE-01', dup: '', patient: '', pt: 'Jaundice', on: '', end: '', note: 'Follow-up adds jaundice' },
      { report: 'R3', cs: 'CASE-03', dup: 'CASE-01', patient: '', pt: 'Hepatitis', on: '', end: '', note: 'Journal article; woman aged 54; same dates, product, events; no shared identifier' },
      { report: 'R4', cs: 'CASE-04', dup: '', patient: '', pt: 'Alanine aminotransferase increased', on: '', end: '', note: 'Pharmacist; man aged 63' },
      { report: 'R4', cs: 'CASE-04', dup: '', patient: '', pt: 'Aspartate aminotransferase increased', on: '', end: '', note: '' },
      { report: 'R4', cs: 'CASE-04', dup: '', patient: '', pt: 'Blood alkaline phosphatase increased', on: '', end: '', note: '' },
      { report: 'R5', cs: 'CASE-05', dup: '', patient: '', pt: 'Liver function test abnormal', on: '', end: '', note: 'Consumer; woman aged 70' },
    ] },
    e123: { label: 'Example 12.3', gap: 14, pool: true, rows: [
      { report: 'CRF-P1', cs: 'P1', dup: '', patient: 'P1', pt: 'Upper respiratory tract infection', on: 20, end: 27, note: 'Record 1' },
      { report: 'CRF-P1', cs: 'P1', dup: '', patient: 'P1', pt: 'Nasopharyngitis', on: 30, end: 36, note: 'Record 2' },
      { report: 'CRF-P1', cs: 'P1', dup: '', patient: 'P1', pt: 'Upper respiratory tract infection', on: 61, end: 70, note: 'Record 3' },
      { report: 'CRF-P1', cs: 'P1', dup: '', patient: 'P1', pt: 'Upper respiratory tract infection', on: 79, end: 85, note: 'Record 4' },
      { report: 'CRF-P1', cs: 'P1', dup: '', patient: 'P1', pt: 'Upper respiratory tract infection', on: 120, end: 126, note: 'Record 5' },
    ] },
    hlt: { label: 'Liver function analyses (HLT), Product A arm', gap: 14, pool: true, rows: REC.filter((r) => r.arm === 'Product A' && r.HLT === 'Liver function analyses').map((r) => ({ report: 'CRF-' + r.patient_id.slice(-4), cs: r.patient_id, dup: '', patient: r.patient_id, pt: r.PT, on: r.study_day, end: '', note: '"' + r.verbatim + '"' })) },
  };

  function countAll(rows, gap, pool) {
    const R = rows.map((r, i) => Object.assign({ i }, r, { report: String(r.report || '').trim(), cs: String(r.cs || '').trim(), dup: String(r.dup || '').trim(), patient: String(r.patient || '').trim(), pt: String(r.pt || '').trim() })).filter((r) => r.pt || r.report || r.cs);
    const reports = uniq(R.map((r) => r.report).filter(Boolean));
    // case IDs (rows without case ID: treat report as its own case)
    R.forEach((r) => { if (!r.cs) r.cs = r.report ? '(report ' + r.report + ')' : '(row ' + (r.i + 1) + ')'; });
    const caseIds = uniq(R.map((r) => r.cs));
    // union-find for duplicate links
    const parent = {}; caseIds.forEach((c) => (parent[c] = c));
    const find = (x) => (parent[x] === x ? x : (parent[x] = find(parent[x])));
    const warnings = [];
    R.forEach((r) => {
      if (r.dup) {
        if (!(r.dup in parent)) { warnings.push('Duplicate-of “' + r.dup + '” (row ' + (r.i + 1) + ') does not match any case ID; link ignored.'); return; }
        const a = find(r.cs), b = find(r.dup); if (a !== b) parent[a] = b;
      }
    });
    const groups = new Map();
    caseIds.forEach((c) => { const g = find(c); if (!groups.has(g)) groups.set(g, []); groups.get(g).push(c); });
    // latest version per case ID = last report listed for that case ID
    const latestRows = {};
    caseIds.forEach((c) => {
      const rr = R.filter((r) => r.cs === c);
      const reps = uniq(rr.map((r) => r.report));
      const last = reps[reps.length - 1];
      latestRows[c] = rr.filter((r) => r.report === last && r.pt);
    });
    const caseList = [];
    groups.forEach((ids, root) => {
      const ordered = ids.slice().sort((a, b) => (a === root ? -1 : b === root ? 1 : 0));
      const keys = new Set(); const merged = [];
      ordered.forEach((c, idx) => latestRows[c].forEach((r) => {
        const key = r.pt.toLowerCase() + '|' + (r.on === '' || r.on === undefined || r.on === null ? '' : r.on);
        if (idx === 0 || !keys.has(key)) merged.push(r);
        keys.add(key);
      }));
      const pats = uniq(R.filter((r) => ids.includes(r.cs)).map((r) => r.patient).filter(Boolean));
      caseList.push({ root, ids: ordered, rows: merged, patientKey: pats.length ? pats[0] : 'case ' + root, patientGiven: pats.length > 0, reports: uniq(R.filter((r) => ids.includes(r.cs)).map((r) => r.report).filter(Boolean)) });
    });
    const patientKeys = uniq(caseList.map((c) => c.patientKey));
    const anyMissingPatient = caseList.some((c) => !c.patientGiven);
    // episodes per patient (& per PT unless pooled), on merged case rows
    const byPat = new Map();
    caseList.forEach((c) => c.rows.forEach((r) => { if (!byPat.has(c.patientKey)) byPat.set(c.patientKey, []); byPat.get(c.patientKey).push(r); }));
    let episodes = 0; let episodesKnown = true; const patDetail = [];
    byPat.forEach((rows, pk) => {
      const streams = new Map();
      rows.forEach((r) => { const k = pool ? 'all' : r.pt.toLowerCase(); if (!streams.has(k)) streams.set(k, []); streams.get(k).push(r); });
      const eps = [];
      streams.forEach((rs) => {
        if (rs.some((r) => r.on === '' || r.on === undefined || r.on === null || !isFinite(Number(r.on)))) { episodesKnown = false; return; }
        const sorted = rs.slice().sort((a, b) => Number(a.on) - Number(b.on));
        let cur = null;
        sorted.forEach((r) => {
          const s = Number(r.on), e = r.end === '' || r.end === undefined || r.end === null || !isFinite(Number(r.end)) ? s : Number(r.end);
          if (!cur || s - cur.end > gap) { cur = { start: s, end: e, rows: [] }; eps.push(cur); }
          cur.rows.push(r); cur.end = Math.max(cur.end, e);
        });
      });
      episodes += eps.length;
      patDetail.push({ pk, rows, eps: eps.sort((a, b) => a.start - b.start) });
    });
    return {
      reports: reports.length, cases: groups.size, patients: patientKeys.length, anyMissingPatient,
      eventsReport: R.filter((r) => r.pt).length, eventsCase: caseList.reduce((s, c) => s + c.rows.length, 0),
      episodes: episodesKnown ? episodes : null, caseList, patDetail, warnings,
    };
  }

  function timeline(patDetail) {
    const pats = patDetail.filter((p) => p.eps.length);
    if (!pats.length) return null;
    const maxDay = Math.max(...pats.map((p) => Math.max(...p.eps.map((e) => e.end)))) + 10;
    const W = 640, L = 110, R = 16, rowH = 46, T0 = 16, H = T0 + pats.length * rowH + 44;
    const X = (d) => L + ((W - L - R) * d) / maxDay;
    const S = WB.svg;
    const svg = S('svg', { viewBox: `0 0 ${W} ${H}`, class: 'rt-tl', role: 'img', 'aria-label': 'Timeline of records and episodes by patient. ' + pats.map((p) => p.pk + ': ' + p.eps.length + ' episode(s), ' + p.rows.length + ' record(s)').join('; ') });
    pats.forEach((p, i) => {
      const y = T0 + i * rowH;
      svg.appendChild(S('text', { x: L - 8, y: y + 22, 'text-anchor': 'end', class: 't' }, [p.pk.length > 16 ? p.pk.slice(-14) : p.pk]));
      p.eps.forEach((e, k) => {
        svg.appendChild(S('rect', { x: X(e.start) - 3, y: y + 2, width: Math.max(8, X(e.end) - X(e.start) + 6), height: 34, rx: 5, class: 'ep' + (k % 2) }));
        svg.appendChild(S('text', { x: X(e.start), y: y + 46 - 2, class: 't' }, ['E' + (k + 1)]));
        e.rows.forEach((r, j) => {
          const s = Number(r.on), en = r.end === '' || r.end === undefined ? s : Number(r.end);
          svg.appendChild(S('rect', { x: X(s), y: y + 6 + (j % 3) * 9, width: Math.max(4, X(en) - X(s)), height: 7, class: 'rec' }));
        });
      });
    });
    const yA = H - 36;
    svg.appendChild(S('line', { x1: L, x2: W - R, y1: yA, y2: yA, class: 'ax' }));
    const step = maxDay > 150 ? 28 : maxDay > 60 ? 14 : 7;
    for (let d = 0; d <= maxDay; d += step) {
      svg.appendChild(S('line', { x1: X(d), x2: X(d), y1: yA, y2: yA + 4, class: 'ax' }));
      svg.appendChild(S('text', { x: X(d), y: yA + 15, 'text-anchor': 'middle', class: 't' }, [String(d)]));
    }
    svg.appendChild(S('text', { x: (L + W - R) / 2, y: yA + 30, 'text-anchor': 'middle', class: 't' }, ['Study day']));
    return svg;
  }

  WB.register({
    id: 'counting',
    group: 'retrieval',
    title: 'Counting units and episodes',
    summary: 'Turn a retrieval listing into reports, cases, patients, events and episodes, with follow-up, duplicate and gap rules you set.',
    chapters: [12],
    render(el) {
      el.classList.add('rt-body');
      const saved = WB.store.getJSON('rt-counting', null);
      const st = saved && Array.isArray(saved.rows) ? saved : { gap: 14, pool: true, rows: JSON.parse(JSON.stringify(C_PRESETS.c121.rows)) };
      const save = () => WB.store.setJSON('rt-counting', st);
      el.appendChild(howTo('Enter one row per coded term on a report: the report (transmission) ID, the case ID (follow-ups share it), the case ID it duplicates if it is a linked duplicate, the patient ID (leave blank in spontaneous data), the PT and the onset and end study days. The tool counts reports, de-duplicated cases, patients, events (on the latest version of each case, and on every report) and episodes under the gap rule you set: a record that starts no more than N days after the previous record in the same stream ended belongs to the same episode. Load a book example to check the arithmetic.'));

      const ctl = h('div', { class: 'panel' });
      const tblHost = h('div', { class: 'panel' });
      const out = h('div');
      el.appendChild(ctl); el.appendChild(tblHost); el.appendChild(out);

      function buildCtl() {
        clear(ctl);
        ctl.appendChild(h('h2', {}, 'Rules'));
        const gapF = WB.field('Episode gap rule (days)', { value: st.gap, min: 0, step: 1, hint: 'Same episode if start − previous end ≤ N days', onInput: (e) => { const v = WB.num(e.target); if (!isFinite(v)) { e.target.setAttribute('aria-invalid', 'true'); return; } e.target.removeAttribute('aria-invalid'); st.gap = Math.max(0, v); save(); update(); }, attrs: { 'data-testid': 'gap' } });
        const pool = h('input', { type: 'checkbox', id: nid('pool'), 'data-testid': 'pool' }); pool.checked = !!st.pool;
        pool.addEventListener('change', () => { st.pool = pool.checked; save(); update(); });
        ctl.appendChild(h('div', { class: 'fields' }, [gapF.wrap, h('div', { class: 'field' }, [h('label', { for: pool.id }, 'Episode streams'), h('label', { class: 'check', style: 'margin:4px 0;font-weight:400' }, [pool, ' Pool different PTs within the query (otherwise one stream per PT)'])])]));
        const bl = h('div', { class: 'btn-row' });
        Object.keys(C_PRESETS).forEach((k) => bl.appendChild(h('button', { class: 'btn small', type: 'button', 'data-preset': k, onclick: () => { const p = C_PRESETS[k]; st.rows = JSON.parse(JSON.stringify(p.rows)); st.gap = p.gap; st.pool = p.pool; save(); buildCtl(); buildTable(); update(); } }, 'Load book ' + (k === 'hlt' ? 'data (Ch 12: ' + C_PRESETS[k].label + ')' : 'example (' + C_PRESETS[k].label + ')'))));
        bl.appendChild(h('button', { class: 'btn small', type: 'button', onclick: () => { st.rows = [{ report: '', cs: '', dup: '', patient: '', pt: '', on: '', end: '', note: '' }]; save(); buildTable(); update(); } }, 'Clear table'));
        ctl.appendChild(bl);
      }

      const COLS = [['report', 'Report ID', 'w-m'], ['cs', 'Case ID', 'w-m'], ['dup', 'Duplicate of (case ID)', 'w-m'], ['patient', 'Patient ID', 'w-m'], ['pt', 'PT', 'w-l'], ['on', 'Onset day', 'w-s'], ['end', 'End day', 'w-s'], ['note', 'Source / note', 'w-l']];
      function buildTable() {
        clear(tblHost);
        tblHost.appendChild(h('h2', {}, 'Records'));
        const rows = st.rows.map((r, i) => COLS.map((c) => {
          const num = c[0] === 'on' || c[0] === 'end';
          const inp = h('input', { type: num ? 'number' : 'text', step: num ? '1' : null, class: c[2] || null, value: r[c[0]] === undefined || r[c[0]] === null ? '' : String(r[c[0]]), 'aria-label': c[1] + ', row ' + (i + 1), 'data-col': c[0] });
          inp.addEventListener('input', () => { r[c[0]] = num ? (inp.value === '' ? '' : Number(inp.value)) : inp.value; save(); update(); });
          return inp;
        }).concat([h('button', { class: 'btn small', type: 'button', 'aria-label': 'Delete row ' + (i + 1), onclick: () => { st.rows.splice(i, 1); save(); buildTable(); update(); } }, '×')]));
        const tw = WB.table(COLS.map((c) => c[1]).concat(['']), rows, { compact: true });
        tw.querySelector('table').classList.add('rt-edit');
        tblHost.appendChild(tw);
        tblHost.appendChild(h('div', { class: 'btn-row' }, [h('button', { class: 'btn small', type: 'button', onclick: () => { const last = st.rows[st.rows.length - 1] || {}; st.rows.push({ report: last.report || '', cs: last.cs || '', dup: '', patient: last.patient || '', pt: '', on: '', end: '', note: '' }); save(); buildTable(); update(); } }, 'Add row')]));
        tblHost.appendChild(h('p', { class: 'note' }, 'Rows of the same report share a Report ID. The latest version of a case is the last Report ID listed for that Case ID. A linked duplicate contributes only terms (same PT and onset) not already in the case. End day defaults to onset day.'));
      }

      function update() {
        clear(out);
        const r = countAll(st.rows, Number(st.gap) || 0, !!st.pool);
        const res = panel('Counts', [
          h('div', { class: 'result' }, [
            stat('Reports', r.reports, 'every transmission', 'n-reports'),
            stat('Cases', r.cases, 'follow-ups merged, duplicates linked', 'n-cases'),
            stat('Patients', r.patients, r.anyMissingPatient ? 'cases without a patient ID count as one patient each' : 'distinct patient IDs', 'n-patients'),
            stat('Events (per case)', r.eventsCase, 'terms on the latest merged version', 'n-ev-case'),
            stat('Events (per report)', r.eventsReport, 'terms on every report', 'n-ev-report'),
            stat('Episodes', r.episodes === null ? 'n/a' : r.episodes, r.episodes === null ? 'onset day missing' : 'gap ≤ ' + (Number(st.gap) || 0) + ' days; ' + (st.pool ? 'PTs pooled' : 'per PT'), 'n-episodes'),
          ]),
        ]);
        r.warnings.forEach((w) => res.appendChild(WB.callout('warn', 'Check the links', w)));
        if (r.eventsCase !== r.eventsReport) res.appendChild(WB.note('Counting the PTs of every report (' + r.eventsReport + ') instead of the latest merged version of each case (' + r.eventsCase + ') double counts follow-ups and duplicates.'));
        out.appendChild(res);

        const caseRows = r.caseList.map((c) => [h('span', { class: 'rt-nw' }, c.ids.join(' + ')), h('span', { class: 'rt-nw' }, c.reports.join(', ')), c.patientGiven ? h('span', { class: 'rt-nw' }, c.patientKey) : '(one patient per case)', h('span', {}, c.rows.map((x, i) => [i ? '; ' : '', T(x.pt, 'PT'), x.on !== '' && x.on !== undefined ? ' D' + x.on : '']).flat()), String(c.rows.length)]);
        out.appendChild(panel('Cases after merging', [WB.table(['Case ID(s)', 'Reports', 'Patient', 'Terms on latest merged version', 'Events'], caseRows, { compact: true })]));

        const epRows = r.patDetail.map((p) => [h('span', { class: 'rt-nw' }, p.pk), String(p.rows.length), p.eps.length ? String(p.eps.length) : 'n/a', p.eps.map((e, k) => 'E' + (k + 1) + ': Day ' + e.start + (e.end !== e.start ? '–' + e.end : '') + ' (' + e.rows.length + ' record' + (e.rows.length > 1 ? 's' : '') + ')').join('; ') || '—']);
        const tl = timeline(r.patDetail);
        out.appendChild(panel('Episodes by patient', [WB.table(['Patient', 'Events', 'Episodes', 'Episode detail'], epRows, { compact: true }), chartWrap(tl) || h('p', { class: 'muted' }, 'Add onset days to draw the timeline.'), tl ? h('p', { class: 'note' }, 'Dark bars are records (onset to end); shaded blocks are episodes under the current rule.') : null]));

        out.appendChild(interp([
          'The unit follows the question: patients for “how many people”, cases for comparisons of spontaneous data, reports for workload, events for burden and episodes for recurrence. The same records can honestly give different numbers; state the unit in every table title and never compare an event count in one arm with a patient count in the other.',
          'Write the episode rule (gap, and whether different PTs are pooled) before looking at the data and apply it to all arms. A gap rule is one option; for laboratory-defined events, a normalization rule (a new episode after values return to the reference range) is an acceptable alternative (Case 12.1 used it). Counting decisions are not judgments about diagnosis or causality.',
        ]));
        out.appendChild(bookLink('Chapter 12, Table 12.1, Example 12.2 (5 reports, 3 cases, 3 patients, 6 events), Example 12.3 (5 events, 3 episodes at 14 days; 4 at 7 days), Case 12.1 (3 events, 2 episodes, 1 patient); HLT Liver function analyses, Product A: 22 events, 19 episodes, 18 patients. Book examples use synthetic data.'));
      }
      buildCtl();
      buildTable();
      update();
    },
  });

  /* ================================================================== 5. SEARCH PERFORMANCE */
  const PERF_PRESETS = {
    pa301: { label: 'Case 9.1, Exercise 12.1: PA-301 SMQ vs clinical reference', tp: 14, fp: 7, fn: 5, tn: 386, unit: 'patients', tnNote: 'TN = 412 − 26 = 386: the 412 Product A patients minus the 26 who were retrieved by the SMQ or are in the reference set (21 retrieved + 5 reference-only).', ref: 'ALT >3×ULN or a reported diagnosis of jaundice, hepatitis or DILI, defined before comparison (19 patients); Product A arm, N=412.' },
    pa301lab: { label: 'Case 9.1 alternative: PA-301 SMQ vs laboratory-only reference', tp: 13, fp: 8, fn: 5, tn: 386, unit: 'patients', tnNote: 'TN = 412 − 26 = 386: the 412 Product A patients minus the 26 retrieved or in the reference set (21 retrieved + 5 reference-only).', ref: 'ALT >3×ULN in central laboratory data only (18 patients); PA-301-0467 is no longer a true positive.' },
    pbn: { label: 'Case 12.2: Product B narrow', tp: 5, fp: 1, fn: 4, tn: 890, unit: 'patients', tnNote: 'TN = (900 − 9) − FP = 891 − 1 = 890.', ref: 'Full manual review of all AE listings and narratives against Sampson 2006 criteria: 9 adjudicated anaphylaxis cases in N=900.' },
    pba: { label: 'Case 12.2: Product B algorithmic', tp: 8, fp: 7, fn: 1, tn: 884, unit: 'patients', tnNote: 'TN = (900 − 9) − FP = 891 − 7 = 884.', ref: 'Full manual review of all AE listings and narratives against Sampson 2006 criteria: 9 adjudicated anaphylaxis cases in N=900.' },
    pbb: { label: 'Case 12.2: Product B broad, no algorithm', tp: 9, fp: 65, fn: 0, tn: 826, unit: 'patients', tnNote: 'TN = (900 − 9) − FP = 891 − 65 = 826.', ref: 'Full manual review of all AE listings and narratives against Sampson 2006 criteria: 9 adjudicated anaphylaxis cases in N=900.' },
  };
  function perfCalc(tp, fp, fn, tn) {
    const d = WB.stats.diag(tp, fp, fn, tn);
    d.npvCI = WB.stats.wilson(tn, tn + fn);
    d.perCase = tp ? (tp + fp) / tp : NaN;
    d.retrieved = tp + fp; d.ref = tp + fn; d.N = tp + fp + fn + tn;
    return d;
  }
  const pctV = (p) => (isFinite(p) ? WB.fmt(p * 100, 1) + '%' : '—');
  const ciTxt = (ci) => (ci && isFinite(ci[0]) ? '95% CI ' + WB.fmt(ci[0] * 100, 1) + '–' + WB.fmt(ci[1] * 100, 1) + '%. ' : '');

  WB.register({
    id: 'search-performance',
    group: 'retrieval',
    title: 'Search performance calculator',
    summary: 'Score a query against an independent reference set: sensitivity, precision, specificity, NPV and F1 with Wilson intervals, and reviews per true case found.',
    chapters: [9, 10, 12, 20],
    render(el) {
      el.classList.add('rt-body');
      const st = { mode: 'cells', tp: 14, fp: 7, fn: 5, tn: 386, ret: 21, ref: 19, N: 412, preset: 'pa301' };
      el.appendChild(howTo('Enter the four cells of the confusion matrix (true positives, false positives, false negatives, true negatives), or switch to counts and enter how many items the query retrieved, how many of those are in the reference set, the size of the reference set and the population size; the tool derives the cells. Results show sensitivity, precision (positive predictive value), specificity, negative predictive value and F1, each proportion with a 95% Wilson score interval, and the review workload per true case found. Counting units must match in every cell.'));
      const ctl = h('div', { class: 'panel' });
      const out = h('div');
      el.appendChild(ctl); el.appendChild(out);

      function buildCtl() {
        clear(ctl);
        ctl.appendChild(h('h2', {}, 'Inputs'));
        const bl = h('div', { class: 'btn-row' });
        Object.keys(PERF_PRESETS).forEach((k) => bl.appendChild(h('button', { class: 'btn small', type: 'button', 'data-preset': k, onclick: () => { const p = PERF_PRESETS[k]; Object.assign(st, { mode: 'cells', tp: p.tp, fp: p.fp, fn: p.fn, tn: p.tn, ret: p.tp + p.fp, ref: p.tp + p.fn, N: p.tp + p.fp + p.fn + p.tn, preset: k }); buildCtl(); update(); } }, 'Load book example (' + PERF_PRESETS[k].label + ')')));
        ctl.appendChild(bl);
        ctl.appendChild(radios('Input mode', 'sp-mode', [{ value: 'cells', label: '2×2 cells (TP, FP, FN, TN)' }, { value: 'counts', label: 'Counts (retrieved, true positives, reference size, population)' }], st.mode, (v) => { st.mode = v; keepFocus(ctl, buildCtl); update(); }, { tid: 'sp-mode' }));
        const f = h('div', { class: 'fields' });
        const num = (key, label, hint) => { const x = WB.field(label, { value: st[key], min: 0, step: 1, hint, onInput: (e) => { st[key] = WB.num(e.target); st.preset = ''; update(); }, attrs: { 'data-testid': 'in-' + key } }); return x.wrap; };
        if (st.mode === 'cells') {
          f.appendChild(num('tp', 'True positives (TP)', 'retrieved and in the reference set'));
          f.appendChild(num('fp', 'False positives (FP)', 'retrieved, not in the reference set'));
          f.appendChild(num('fn', 'False negatives (FN)', 'in the reference set, not retrieved'));
          f.appendChild(num('tn', 'True negatives (TN)', 'neither retrieved nor in the reference set'));
        } else {
          f.appendChild(num('ret', 'Retrieved by the query'));
          f.appendChild(num('tp', 'Of which in the reference set (TP)'));
          f.appendChild(num('ref', 'Reference set size'));
          f.appendChild(num('N', 'Population size (N)', 'patients (or cases) searched'));
        }
        ctl.appendChild(f);
      }

      function update() {
        clear(out);
        let tp, fp, fn, tn, tnNote;
        if (st.mode === 'cells') {
          tp = st.tp; fp = st.fp; fn = st.fn; tn = st.tn;
          tnNote = st.preset && PERF_PRESETS[st.preset] ? PERF_PRESETS[st.preset].tnNote : 'TN entered directly. Check that it equals the population minus everyone retrieved or in the reference set.';
        } else {
          tp = st.tp; fp = st.ret - st.tp; fn = st.ref - st.tp; tn = st.N - st.ret - fn;
          tnNote = 'Derived: FP = retrieved − TP = ' + st.ret + ' − ' + st.tp + ' = ' + fp + '; FN = reference − TP = ' + st.ref + ' − ' + st.tp + ' = ' + fn + '; TN = N − retrieved − FN = ' + st.N + ' − ' + st.ret + ' − ' + fn + ' = ' + tn + '.';
        }
        const vals = [tp, fp, fn, tn];
        if (vals.some((v) => !isFinite(v) || v < 0 || Math.round(v) !== v)) {
          out.appendChild(WB.callout('bad', 'Check the inputs', 'All cells must be whole numbers of zero or more. Current cells: ' + [['TP', tp], ['FP', fp], ['FN', fn], ['TN', tn]].map((x) => x[0] + ' ' + (isFinite(x[1]) ? x[1] : 'blank or not a number')).join(', ') + '.'));
          return;
        }
        const d = perfCalc(tp, fp, fn, tn);
        const matrix = h('table', { class: 'rt-matrix', 'aria-label': 'Confusion matrix' }, [
          h('thead', {}, h('tr', {}, [h('th', { scope: 'col' }, ''), h('th', { scope: 'col' }, 'In reference set'), h('th', { scope: 'col' }, 'Not in reference set'), h('th', { scope: 'col' }, 'Total')])),
          h('tbody', {}, [
            h('tr', {}, [h('th', { scope: 'row' }, 'Retrieved'), h('td', { class: 'tp' }, 'TP ' + tp), h('td', { class: 'fp' }, 'FP ' + fp), h('td', {}, String(tp + fp))]),
            h('tr', {}, [h('th', { scope: 'row' }, 'Not retrieved'), h('td', { class: 'fn' }, 'FN ' + fn), h('td', { class: 'tn' }, 'TN ' + tn), h('td', {}, String(fn + tn))]),
            h('tr', {}, [h('th', { scope: 'row' }, 'Total'), h('td', {}, String(tp + fn)), h('td', {}, String(fp + tn)), h('td', {}, String(d.N))]),
          ]),
        ]);
        const preset = st.preset && PERF_PRESETS[st.preset];
        out.appendChild(panel('Confusion matrix', [
          preset ? h('p', {}, [h('strong', {}, 'Reference set: '), preset.ref]) : null,
          h('div', { class: 'tbl-wrap' }, matrix),
          h('p', { class: 'note', 'data-testid': 'tn-note' }, tnNote),
        ]));
        const f1 = d.f1;
        out.appendChild(panel('Performance', [
          h('div', { class: 'result' }, [
            stat('Sensitivity', pctV(d.sens), ciTxt(d.sensCI) + 'TP / (TP + FN) = ' + tp + ' / ' + (tp + fn), 'sens'),
            stat('Precision (PPV)', pctV(d.ppv), ciTxt(d.ppvCI) + 'TP / (TP + FP) = ' + tp + ' / ' + (tp + fp), 'prec'),
            stat('Specificity', pctV(d.spec), ciTxt(d.specCI) + 'TN / (TN + FP) = ' + tn + ' / ' + (tn + fp), 'spec'),
            stat('NPV', pctV(d.npv), ciTxt(d.npvCI) + 'TN / (TN + FN) = ' + tn + ' / ' + (tn + fn), 'npv'),
            stat('F1', isFinite(f1) ? WB.fmt(f1, 3) : '—', '2TP / (2TP + FP + FN)', 'f1'),
            stat('Reviewed per true case', isFinite(d.perCase) ? WB.fmt(d.perCase, 1) : '—', 'retrieved / TP = ' + (tp + fp) + ' / ' + tp, 'percase'),
          ]),
          h('p', { class: 'note' }, 'Proportions with 95% Wilson score intervals. Each reference case moves sensitivity by ' + (tp + fn ? WB.fmt(100 / (tp + fn), 1) : '—') + ' percentage points.'),
          chartWrap(WB.barChart([{ label: 'Sensitivity', value: d.sens * 100 || 0 }, { label: 'Precision (PPV)', value: d.ppv * 100 || 0 }, { label: 'Specificity', value: d.spec * 100 || 0 }, { label: 'NPV', value: d.npv * 100 || 0 }], { max: 100, unit: '%', left: 140, aria: 'Sensitivity ' + WB.fmt(d.sens * 100, 1) + '%, precision ' + WB.fmt(d.ppv * 100, 1) + '%, specificity ' + WB.fmt(d.spec * 100, 1) + '%, NPV ' + WB.fmt(d.npv * 100, 1) + '%' })),
        ]));

        const cmpRows = Object.keys(PERF_PRESETS).map((k) => {
          const p = PERF_PRESETS[k], x = perfCalc(p.tp, p.fp, p.fn, p.tn);
          return [p.label, p.tp + '/' + p.fp + '/' + p.fn + '/' + p.tn, WB.fmt(x.sens * 100, 1) + '%', WB.fmt(x.ppv * 100, 1) + '%', WB.fmt(x.spec * 100, 1) + '%', WB.fmt(x.perCase, 1)];
        });
        out.appendChild(h('details', {}, [h('summary', {}, 'Book examples side by side'), WB.table(['Search', 'TP/FP/FN/TN', 'Sensitivity', 'Precision', 'Specificity', 'Reviewed per case'], cmpRows, { compact: true, caption: 'Synthetic data; units are patients' })]));

        const lowSpecInfo = isFinite(d.spec) && d.spec > 0.9 && isFinite(d.ppv) && d.ppv < 0.5;
        out.appendChild(interp([
          'Performance belongs to a stated reference definition. The reference set must be built independently of the query, by medical review of all available data against a written case definition; built from the query’s own output, sensitivity is 100% by construction. Change the definition and the same query “performs” differently (Case 9.1: 73.7% and 66.7% against the clinical definition; 72.2% and 61.9% against laboratory criteria alone).',
          'For a rare event, report sensitivity and precision together. Specificity is dominated by the many true negatives and barely moves' + (lowSpecInfo ? ' — here it is above 90% while precision is below 50%' : '') + '; a query that retrieves nothing has 100% specificity. Precision drives the review workload. Misses are not always query failures: in PA-301 the 5 false negatives had laboratory evidence only, and for Product B the algorithm’s one miss was a coding omission. A true positive is a retrieved patient who meets the reference definition; it is not a causality conclusion.',
        ]));
        out.appendChild(bookLink('Chapter 9, Case 9.1; Chapter 10, Case 10.1; Chapter 12, Case 12.2, Table 12.2 and Exercise 12.1; Chapter 20 (scoring automated suggestions against a reference). Book examples use synthetic data.'));
      }
      buildCtl();
      update();
    },
  });
})();
