/* Verbatim to Signal Workbench — Fillable worksheets module
   Six Appendix B worksheets plus the Chapter 3 report completeness checklist.
   Fields and hints follow Appendix B exactly; book examples are transcribed from the
   chapters' completed worksheets (term tokens converted to "Term (LEVEL)"). */
(function () {
  'use strict';
  const h = WB.h;
  const FOOTER = 'Prepared with the Verbatim to Signal Workbench — training tool; synthetic examples';
  const UNIT_RE = /\b(patients?|cases?|reports?|events?|episodes?|subjects?|participants?)\b/i;

  /* Convert book markdown to plain text: {PT:Term} -> "Term (PT)", strip emphasis. */
  function md(t) {
    return String(t || '')
      .replace(/\{(LLT|PT|HLT|HLGT|SOC|SMQ):([^}]+)\}/g, '$2 ($1)')
      .replace(/\*\*(.+?)\*\*/g, '$1')
      .replace(/(^|[^*\w])\*([^*\n]+)\*(?!\w)/g, '$1$2');
  }
  const esc = (t) => WB.esc(String(t == null ? '' : t)).replace(/\n/g, '<br>');
  const slug = (t) => String(t || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);
  const filled = (v) => String(v || '').trim().length > 0;
  const today = () => new Date().toISOString().slice(0, 10);

  /* ------------------------------------------------------------------ */
  /* Worksheet definitions: fields = [key, Appendix B field, what to record] */
  const DEFS = [
    {
      id: 'ws-coding', n: 1, name: 'Coding review', chapter: 7,
      summary: 'Document and review a term selection decision so another reviewer can audit it.',
      purpose: 'Use it whenever a code is questioned, changed or reviewed: it records the source words, the candidates considered, the selection and the guidance relied on.',
      fields: [
        ['id', 'Case or record identifier', 'Case number, patient ID, AE line'],
        ['verbatim', 'Verbatim', "The reporter's words exactly as recorded"],
        ['context', 'Context', 'Source document, reporter type, timing, relevant results, diagnostic certainty'],
        ['candidates', 'Candidate LLTs', 'All plausible LLTs considered'],
        ['selected', 'Selected LLT and parent PT', 'With primary SOC; confirm the hierarchy is appropriate'],
        ['rationale', 'Rationale', 'Term Selection PtC section and organization convention applied'],
        ['alternatives', 'Acceptable alternatives', 'Other defensible selections and why they were not chosen'],
        ['followup', 'Follow-up or query', 'Information requested to resolve uncertainty'],
        ['reviewer', 'Reviewer and date', 'Name, role, date of review'],
        ['version', 'MedDRA version', 'Version used for coding and review'],
      ],
      example: {
        label: 'Load book example (Chapter 7, Case 7.2)',
        source: 'Chapter 7, Worksheet 1, completed for Case 7.2 (PA-301-0467)',
        header: { ref: 'Worksheet 1, Case 7.2 (PA-301-0467): gallstones or a bile duct stone?', product: 'Product A (Study PA-301)', author: '', date: '', version: 'MedDRA v29.0' },
        fields: {
          id: 'PA-301-0467 (Case 7.2)',
          verbatim: '"common bile duct stone on ultrasound", CRF, Day 136',
          context: 'Jaundice Day 134; cholestatic pattern; ultrasound report',
          candidates: 'Current {LLT:Gallstones}; proposed {LLT:Choledocholithiasis}',
          selected: '{PT:Cholelithiasis} ({HLGT:Gallbladder disorders}); {PT:Bile duct stone}; both in {SOC:Hepatobiliary disorders}',
          rationale: 'Verbatim names bile duct; PtC 2.4, 2.9, 2.10',
          followup: 'Optional: are gallbladder stones a separate AE?',
          reviewer: 'Coding lead and medical reviewer; approved',
          version: 'MedDRA v29.0',
        },
      },
      bookLink: 'Book link: Chapter 7, Case 7.2 and Worksheet 1; blank version in Appendix B, Table B.2.',
      interp: 'A coding review settles which term best represents what the reporter said. It is not a diagnosis and not a causality judgment: in Case 7.2 the bile duct stone as a plausible cause of the jaundice is a medical conclusion recorded in the case review, not in the code. Record the source facts you relied on, not only the conclusion, so the decision can be audited.',
      checks(f, hd) {
        const out = [];
        if (!filled(f.verbatim)) out.push('Verbatim is empty: record the reporter\'s words exactly as recorded; every term rests on them.');
        if (!filled(f.selected)) out.push('Selected LLT and parent PT is empty: state the selection and its primary SOC.');
        if (!filled(f.rationale)) out.push('Rationale is empty: cite the Term Selection PtC section and the convention applied.');
        if (!filled(f.version) && !filled(hd.version)) out.push('MedDRA version is empty: a code without its version cannot be reproduced.');
        return out;
      },
    },
    {
      id: 'ws-query', n: 2, name: 'Query specification', chapter: 11,
      summary: 'Define a search before it is run, so the count it produces can be reproduced.',
      purpose: 'Complete it before running any retrieval that will feed a table, signal or report, and store it as a controlled document.',
      fields: [
        ['question', 'Question', 'The safety question in one or two sentences'],
        ['population', 'Population', 'Studies, arms, products, sources, inclusion and exclusion'],
        ['cutoff', 'Data cutoff', 'Date and data snapshot'],
        ['versions', 'Versions', 'MedDRA version of data; MedDRA and SMQ version of query'],
        ['termset', 'Term set or SMQ', 'SMQ name, or customized term list with rationale'],
        ['scope', 'Scope', 'Narrow, broad, sub-SMQs selected'],
        ['algorithm', 'Algorithm', 'If applicable, the documented logic and the level (case, patient, episode) at which it is applied'],
        ['exclusions', 'Exclusions', 'Terms or records excluded and why; name a modified query correctly'],
        ['noncoded', 'Non-coded evidence', 'Laboratory, ECG or other data to search alongside coded terms'],
        ['counting', 'Counting rules', 'Unit (patients, cases, reports, events), episode definition, duplicate handling'],
        ['owner', 'Owner and approval', 'Who built, reviewed and approved the specification'],
      ],
      example: {
        label: 'Load book example (Chapter 11, PA-301 hepatic AESI)',
        source: 'Chapter 11, Worksheet 2, completed for the PA-301 hepatic AESI',
        header: { ref: 'Worksheet 2, PA-301 hepatic AESI', product: 'Product A (Study PA-301)', author: '', date: '', version: 'MedDRA v29.0; SMQs v29.0' },
        fields: {
          question: 'Patients meeting the protocol hepatic AESI during the controlled period',
          population: 'PA-301 safety population; Product A N=412, placebo N=206; Weeks 0–24',
          cutoff: '28 February 2023',
          versions: 'MedDRA v29.0; SMQs v29.0; query version 1.0',
          termset: 'Modified MedDRA query based on {SMQ:Drug related hepatic disorders - comprehensive search}; plus central laboratory thresholds',
          scope: 'Narrow and broad terms; investigation PTs used as pointers only',
          algorithm: 'Patient qualifies if ALT or AST >3×ULN, or TBL >2×ULN, or a qualifying hepatic disorder PT; ALT >3×ULN with TBL >2×ULN triggers committee referral',
          exclusions: 'Term-level: gallbladder PTs (not liver injury). Case-level: none for AESI counting; alternative causes recorded, not excluded',
          counting: 'Patients, counted once per arm; first qualifying date; local values used only if no central value; events listed separately',
        },
      },
      bookLink: 'Book link: Chapter 11, Case 11.1 and Worksheet 2 (PA-301 hepatic AESI); blank version in Appendix B, Table B.3.',
      interp: 'A specification makes a number reproducible: the same question, population, cutoff, versions and counting unit give the same count on a rerun. Retrieval finds candidate records; it does not show that each retrieved patient has the condition (that is adjudication, Worksheet 3) or that the product caused it (causality, recorded separately). If you exclude SMQ terms, call the result a modified query based on the SMQ, not the SMQ.',
      checks(f, hd) {
        const out = [];
        if (!filled(f.versions)) out.push('Versions is empty: state the MedDRA version of the data and the MedDRA and SMQ version of the query.');
        else if (!/\d/.test(f.versions)) out.push('Versions has no version number: give e.g. "MedDRA v29.0; SMQs v29.0".');
        if (!filled(f.counting)) out.push('Counting rules is empty: state the unit (patients, cases, reports or events), the episode definition and duplicate handling.');
        else if (!UNIT_RE.test(f.counting)) out.push('Counting rules does not name a unit: say whether you count patients, cases, reports or events.');
        if (!filled(f.cutoff)) out.push('Data cutoff is empty: without it the search cannot be rerun on the same data.');
        if (filled(f.exclusions) && /\bSMQ\b/i.test(f.termset || '') && !/modif|custom/i.test(f.termset || '') && !/^\s*(none|n\/a|no)\b/i.test(f.exclusions)) out.push('Exclusions are recorded but the term set is named as an SMQ: if SMQ terms were removed, name it a modified query based on the SMQ.');
        return out;
      },
    },
    {
      id: 'ws-adjudication', n: 3, name: 'Case adjudication', chapter: 13,
      summary: 'Classify a retrieved case against a stated case definition, with causality recorded separately.',
      purpose: 'Use it for every retrieved case that will be counted as meeting, or not meeting, a case definition.',
      fields: [
        ['id', 'Case identifier and source', ''],
        ['retrieved', 'Retrieved findings', 'The coded terms and data that caused retrieval'],
        ['definition', 'Case definition applied', 'Name and version of the definition'],
        ['evidence', 'Diagnostic evidence', 'Laboratory values, imaging, specialist opinion, biopsy'],
        ['chronology', 'Chronology', 'Exposure start, onset, dechallenge, rechallenge, outcome'],
        ['alternatives', 'Alternative explanations', 'Disease, concomitant products, other causes, and how each was assessed'],
        ['classification', 'Classification', 'Meets definition / does not meet / insufficient information'],
        ['causality', 'Causality (if assessed)', 'Method used and result, recorded separately from classification'],
        ['rationale', 'Rationale', 'Two to four sentences'],
        ['gaps', 'Information gaps and follow-up', ''],
        ['reviewer', 'Reviewer and date', ''],
      ],
      example: {
        label: 'Load book example (Chapter 13, PM-0733)',
        source: 'Chapter 13, Worksheet 3, completed for PM-0733',
        header: { ref: 'Worksheet 3, PM-0733', product: 'Product A', author: '', date: '', version: 'MedDRA v29.0; SMQs v29.0' },
        fields: {
          id: 'PM-0733, postmarketing spontaneous report',
          retrieved: '{SMQ:Drug related hepatic disorders - comprehensive search}, narrow; {PT:Drug-induced liver injury}, {PT:Jaundice}; MedDRA v29.0',
          evidence: 'ALT 14×ULN, bilirubin 4.1×ULN, ALP 1.5×ULN; R = 14 ÷ 1.5 = 9.3 (hepatocellular); hepatitis A, B, C and E markers negative; autoantibodies negative; ultrasound normal',
          chronology: '61-year-old woman; onset Day 52; Product A withdrawn Day 53; ALT 6×ULN three weeks later (a fall of more than 50%); no rechallenge',
          alternatives: 'Viral, autoimmune, biliary: excluded by tests. Alcohol: minimal intake. Other drugs: folic acid only, no new medicine in prior 3 months',
          classification: "Meets DILI biochemical criteria; hepatocellular; meets all three Hy's law components",
          causality: 'Recorded separately as probable',
          rationale: 'Plausible latency, positive dechallenge, documented exclusion of alternatives; a new alternative cause at follow-up would change the classification',
          reviewer: 'Safety physician, date',
        },
      },
      bookLink: 'Book link: Chapter 13, Case 13.1, Table 13.2 and Worksheet 3 (PM-0733); blank version in Appendix B, Table B.4.',
      interp: 'Three records stay distinct: the coded terms (what was reported, left as reported), the classification (does the case meet the stated definition?) and causality (did the product cause it?, by a named method). A case can meet a definition and still have an alternative cause; in Table 13.2, two of the four postmarketing reports meeting biochemical thresholds are explained by hepatitis E and biliary obstruction.',
      checks(f, hd) {
        const out = [];
        if (!filled(f.definition)) out.push('Case definition applied is empty: name the definition and its version, so the classification can be checked.');
        if (!filled(f.classification)) out.push('Classification is empty: record meets definition, does not meet, or insufficient information.');
        else if (/\b(probabl[ey]|possibl[ey]|certain|unlikely|related|causal)/i.test(f.classification)) out.push('Classification contains causality wording: record causality in its own field, separately from classification.');
        if (!filled(f.alternatives)) out.push('Alternative explanations is empty: state each alternative considered and how it was assessed.');
        return out;
      },
    },
    {
      id: 'ws-plan', n: 4, name: 'Surveillance plan', chapter: 14,
      summary: 'Turn monitoring into a documented plan with sources, queries, schedule, roles and triggers.',
      purpose: 'Use it when a product launches, when risks change, or when the plan is revised; version and date every revision.',
      fields: [
        ['product', 'Product and plan version', 'Including effective date'],
        ['sources', 'Sources', 'Trials, spontaneous, literature, registries, healthcare data, partners'],
        ['risks', 'Risks and topics', 'Identified and potential risks, missing information, AESIs'],
        ['queries', 'Queries', 'Query specification for each topic (Worksheet 2), versions'],
        ['schedule', 'Review schedule', 'Frequency per source and topic; data cutoffs'],
        ['roles', 'Roles', 'Who retrieves, reviews, adjudicates, approves'],
        ['triggers', 'Triggers', 'Single-case and aggregate triggers; escalation route and timelines'],
        ['outputs', 'Outputs', 'Documents produced and their audiences'],
        ['tracking', 'Tracking', 'Where actions and decisions are logged'],
      ],
      example: {
        label: 'Load book example (Chapter 14, Product A plan v3)',
        source: 'Chapter 14, Worksheet 4, completed for Product A (plan version 3, effective 1 July 2026)',
        header: { ref: 'Worksheet 4, Product A surveillance plan version 3', product: 'Product A 200 mg', author: '', date: '', version: 'MedDRA v29.0; SMQs v29.0' },
        fields: {
          product: 'Product A 200 mg; plan v3; MedDRA v29.0; SMQs v29.0; effective 1 July 2026',
          sources: 'Safety database (suspect or interacting; all report types); ongoing studies (safety set, treatment-emergent); weekly literature screen; pregnancy follow-up',
          risks: 'DILI and serious infections (important potential risks); SCAR and QT (routine checks); pregnancy and use beyond 2 years (missing information)',
          queries: 'Table 14.1; specifications Q-A-01 to Q-A-06 with versions',
          schedule: 'Serious cases on receipt; monthly general screen (cutoff last day of month); quarterly DILI and infection reviews; semiannual SCAR, QT, pregnancy; periodic report inputs at IBD-anchored data lock points',
          roles: 'Safety scientist runs queries; safety physician reviews cases; safety review team decides escalation; QPPV informed (EU)',
          triggers: "Potential Hy's law case: physician review within 2 business days, safety review team within 5; any SJS or TEN case: physician review on receipt; hepatic rate per 1,000 PY up 50% or more on the previous period: targeted review",
          outputs: 'Dated review memo (Worksheet 6), updated tracker, periodic report and RMP inputs',
          tracking: 'Signal and action tracker; outstanding follow-up (e.g., PM-0702) with due dates',
        },
      },
      bookLink: 'Book link: Chapter 14, Case 14.1, Table 14.1 and Worksheet 4 (Product A plan version 3); blank version in Appendix B, Table B.5.',
      interp: 'A plan makes every review schedulable, frozen at a cutoff and rerunnable. A trigger is an obligation to review within a stated time, not a conclusion that a risk exists; each route should end at one decision point (in the book, the safety review team).',
      checks(f, hd) {
        const out = [];
        if (!filled(f.product) || !/\d/.test(f.product)) out.push('Product and plan version: give the plan version and effective date.');
        if (!filled(f.queries)) out.push('Queries is empty: point to a stored specification (Worksheet 2) for each topic, with versions.');
        if (!filled(f.triggers)) out.push('Triggers is empty: name each single-case and aggregate trigger with its owner and time limit.');
        else if (!/\d|receipt|immediate/i.test(f.triggers)) out.push('Triggers have no time limits: state who reviews each trigger and within what time.');
        if (!filled(f.roles)) out.push('Roles is empty: say who retrieves, reviews, adjudicates and approves.');
        return out;
      },
    },
    {
      id: 'ws-signal', n: 5, name: 'Signal assessment', chapter: 17,
      summary: 'Weigh the evidence for a potential signal and state a bounded conclusion.',
      purpose: 'Use it after a signal is validated, to assemble the evidence, its quality and its limits before a recommendation goes to governance.',
      fields: [
        ['description', 'Signal description', 'Product, event, source of the signal, date detected'],
        ['evidence', 'Evidence assembled', 'Cases, trial data, literature, mechanism, class information'],
        ['quality', 'Case quality', 'Completeness, confirmation, duplicates removed'],
        ['patterns', 'Patterns', 'Time to onset, dose, dechallenge and rechallenge, risk factors'],
        ['quant', 'Quantitative context', 'Disproportionality, rates, comparisons, with their limitations'],
        ['alternatives', 'Alternative explanations', 'Confounding, reporting artifacts, indication'],
        ['uncertainty', 'Uncertainty', 'What is not known and how it could be resolved'],
        ['conclusion', 'Conclusion and recommendation', 'Bounded, with the evidence level it rests on'],
        ['reviewer', 'Reviewer, date, decision body', ''],
      ],
      example: {
        label: 'Load book example (Chapter 17, Product A hepatic signal)',
        source: 'Chapter 17, Worksheet 5, completed for the Product A hepatic signal (data lock 30 June 2026; MedDRA v29.0, SMQs v29.0)',
        header: { ref: 'Worksheet 5, Product A hepatic signal (data lock 30 June 2026)', product: 'Product A', author: '', date: '', version: 'MedDRA v29.0; SMQs v29.0' },
        fields: {
          description: 'Product A hepatic signal; data lock 30 June 2026',
          evidence: 'Spontaneous: 108 narrow SMQ reports, 31 serious. Trial PA-301: ALT >3×ULN 4.4% vs 1.9%; PA-301-0147 probable DILI. Nonclinical: reversible transaminase rises in dogs.',
          quality: "18 of 31 serious reports medically confirmed with labs; 4 meet biochemical Hy's law; 2 with alternative causes; PM-0733 unconfounded; PM-0918 confounded (leflunomide).",
          patterns: 'Hepatocellular; onset Day 38–52 postmarketing, Day 71 in PA-301-0147; positive dechallenge in PM-0733 and PA-301-0147; no rechallenge.',
          quant: '{PT:Drug-induced liver injury} ROR 2.35 (1.33–4.14); narrow SMQ 2.08 (1.72–2.53), or 1.60 (1.28–1.99) without stimulated reports and duplicates. Reporting patterns only.',
          uncertainty: "Under-reporting; 13 serious reports lack labs; concomitant disease-modifying drugs; stimulated reporting in 2025 H2; few Hy's law cases.",
          conclusion: 'Validated, high priority. Follow up PM-0918 and missing labs; refer to safety governance for decision on risk classification and product information (see Chapters 18 and 22).',
        },
      },
      bookLink: 'Book link: Chapter 17, Cases 17.1–17.3, Figure 17.3 and Worksheet 5 (Product A hepatic signal); blank version in Appendix B, Table B.6.',
      interp: 'Disproportionality statistics such as the ROR describe reporting patterns and are screening tools only; they are not incidence or risk estimates and cannot show causation. The conclusion should claim no more, and no less, than the evidence supports, and should recommend, not decide, outcomes that belong to governance (risk classification, product information).',
      checks(f, hd) {
        const out = [];
        if (!filled(f.uncertainty)) out.push('Uncertainty is empty: state what is not known and how it could be resolved; a conclusion without it cannot be bounded.');
        if (/\b(ROR|PRR|IC|EBGM|disproportionality)\b/i.test(f.quant || '') && !/screen|reporting pattern|limit|not (an? )?(incidence|risk)/i.test(f.quant || '')) out.push('Quantitative context cites disproportionality without its limits: say it describes reporting patterns (screening only).');
        if (!filled(f.conclusion)) out.push('Conclusion and recommendation is empty: give a bounded conclusion and the evidence level it rests on.');
        return out;
      },
    },
    {
      id: 'ws-review', n: 6, name: 'Surveillance review', chapter: 18,
      summary: 'Report one review cycle on one page, with every count carrying its unit.',
      purpose: 'Use it at the end of each scheduled review to record coverage, findings, counts, comparisons, limitations and actions in one page.',
      fields: [
        ['coverage', 'Data coverage', 'Sources, period, cutoff, versions, query identifiers'],
        ['findings', 'Findings', 'What was found, in plain words'],
        ['counts', 'Case and patient counts', 'With counting units stated'],
        ['comparisons', 'Comparisons', 'Previous period, control arm, background, with denominators'],
        ['limitations', 'Limitations', 'Data quality, reporting effects, version changes'],
        ['actions', 'Actions', 'New and carried-forward actions with owners and due dates'],
        ['signoff', 'Sign-off', 'Reviewer and approver, dates'],
      ],
      example: {
        label: 'Load book example (Chapter 18, Product A, 30 June 2026)',
        source: 'Chapter 18, Worksheet 6, completed for Product A hepatic surveillance (data lock 30 June 2026; MedDRA v29.0, SMQs v29.0)',
        header: { ref: 'Worksheet 6, Product A hepatic surveillance (data lock 30 June 2026)', product: 'Product A', author: '', date: '', version: 'MedDRA v29.0; SMQs v29.0' },
        fields: {
          coverage: 'Spontaneous and literature, 15 Mar 2024–30 Jun 2026; narrow hepatic SMQ; PA-301 controlled period; exposure sales-based. Gap: 13 serious reports lack labs.',
          findings: "Validated hepatic signal (severity); 4 biochemical Hy's law reports, 1 unconfounded; trial case probable DILI.",
          counts: '108 reports (≤102 cases); 31 serious; 18 confirmed. PA-301: 18/412 vs 4/206 patients.',
          comparisons: 'Placebo in PA-301; half-yearly reporting rates; ROR versus all products (screening only).',
          limitations: 'Under-reporting (down); stimulated reporting 2025 H2 (up); confounding by concomitant drugs (either way).',
          actions: 'Committee decision; follow-up PM-0918 (30 days); questionnaire; sensitivity analyses; monthly Hy\'s law review; PBRER "ongoing".',
        },
      },
      bookLink: 'Book link: Chapter 18, Case 18.1 and Worksheet 6 (Product A, data lock 30 June 2026); blank version in Appendix B, Table B.7.',
      interp: 'Every number needs its counting unit and denominator: reports are not cases, and cases are not patients (108 reports correspond to at most 102 cases). State the direction of each bias in the limitations, and recommend, rather than state, outcomes that governance decides.',
      checks(f, hd) {
        const out = [];
        if (!filled(f.counts)) out.push('Case and patient counts is empty: give each count with its unit and denominator.');
        else if (/\d/.test(f.counts) && !UNIT_RE.test(f.counts)) out.push('Case and patient counts lack a unit word: say whether each number counts patients, cases, reports or events.');
        if (!filled(f.coverage)) out.push('Data coverage is empty: give sources, period, cutoff, versions and query identifiers.');
        else if (!/v\s?\d|version|meddra/i.test(f.coverage) && !filled(hd.version)) out.push('Data coverage does not state the MedDRA/SMQ version (add it here or in the header).');
        if (!filled(f.limitations)) out.push('Limitations is empty: state data quality, reporting effects and version changes, with the direction of each bias.');
        return out;
      },
    },
  ];

  const HEADER = [
    ['ref', 'Worksheet title or reference', 'text', 'e.g. case, query or review identifier'],
    ['product', 'Product', 'text', ''],
    ['author', 'Author', 'text', 'Name and role'],
    ['date', 'Date', 'date', ''],
    ['version', 'MedDRA / SMQ version', 'text', 'e.g. MedDRA v29.0; SMQs v29.0'],
  ];

  /* ------------------------------------------------------------------ */
  function autosize(ta) {
    if (!ta || ta.tagName !== 'TEXTAREA') return;
    ta.style.height = 'auto';
    if (ta.scrollHeight) ta.style.height = ta.scrollHeight + 2 + 'px';
  }
  function linkHint(fw) {
    const sm = fw.wrap.querySelector('small');
    if (sm) {
      sm.id = fw.input.id + '-hint';
      fw.input.setAttribute('aria-describedby', sm.id);
      fw.wrap.insertBefore(sm, fw.input); // "what to record" sits under the field name, as in Appendix B
    }
  }
  function headerTable(rows) {
    return '<table>' + rows.map(([k, v]) => `<tr><th>${esc(k)}</th><td>${esc(v) || '&nbsp;'}</td></tr>`).join('') + '</table>';
  }
  function pickFile(onText, onErr) {
    const fi = h('input', { type: 'file', accept: '.json,application/json', class: 'ws-import', 'aria-label': 'Import JSON file', style: 'display:none' });
    fi.addEventListener('change', () => {
      const f = fi.files && fi.files[0];
      if (!f) return;
      const r = new FileReader();
      r.onload = () => { onText(String(r.result)); fi.value = ''; };
      r.onerror = () => onErr('The file could not be read.');
      r.readAsText(f);
    });
    return fi;
  }
  function statusBar() {
    const saved = h('span', { class: 'ws-saved note', role: 'status', 'aria-live': 'polite' }, 'Not yet saved');
    const msg = h('div', { class: 'ws-msg', 'aria-live': 'polite' });
    return { saved, msg };
  }
  function stamp() { return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }); }

  /* ------------------------------------------------------------------ */
  function renderWorksheet(def, el) {
    const KEY = 'ws-' + def.id;
    const blank = () => ({ header: { ref: '', product: '', author: '', date: '', version: '' }, fields: {} });
    let state = WB.store.getJSON(KEY, null) || blank();
    state.header = Object.assign(blank().header, state.header || {});
    state.fields = state.fields || {};
    let undo = null;

    const inputs = { header: {}, fields: {} };
    const { saved, msg } = statusBar();

    function save() {
      state.savedAt = new Date().toISOString();
      const ok = WB.store.setJSON(KEY, state);
      saved.textContent = ok ? 'Saved in this browser at ' + stamp() : 'Could not save: browser storage is unavailable. Download JSON to keep your work.';
    }
    function collect() {
      HEADER.forEach(([k]) => (state.header[k] = inputs.header[k].value));
      def.fields.forEach(([k]) => (state.fields[k] = inputs.fields[k].value));
    }
    function fill() {
      HEADER.forEach(([k]) => (inputs.header[k].value = state.header[k] || ''));
      def.fields.forEach(([k]) => { inputs.fields[k].value = state.fields[k] || ''; autosize(inputs.fields[k]); });
      update();
    }
    function snapshot() { return JSON.parse(JSON.stringify(state)); }
    function offerUndo(text) {
      msg.innerHTML = '';
      msg.appendChild(h('div', { class: 'callout ok no-print' }, [
        h('span', {}, text + ' '),
        undo ? h('button', { class: 'btn small', type: 'button', onclick: () => { state = undo; undo = null; fill(); save(); msg.innerHTML = ''; msg.appendChild(WB.callout('', null, 'Previous entries restored.')); } }, 'Undo') : null,
      ]));
    }
    function showError(text) { msg.innerHTML = ''; msg.appendChild(WB.callout('bad', 'Import failed', text)); }

    /* --- How to use --- */
    el.appendChild(h('div', { class: 'panel no-print' }, [
      h('h2', {}, 'How to use'),
      h('p', {}, `${def.purpose} Each field follows Appendix B (field name, with what to record beneath it). Entries save automatically in this browser as you type. Load the book's completed example from Chapter ${def.chapter} to see a filled version; fields that the chapter's example does not cover stay blank. Download JSON to keep several filled worksheets and import them later; export to Word or print to PDF when the worksheet is complete.`),
      h('p', { class: 'note' }, 'Synthetic training data only. Do not enter personal or identifiable patient information; entries stay in this browser unless you export them.'),
    ]));

    /* --- Actions --- */
    const fileIn = pickFile((txt) => {
      let obj;
      try { obj = JSON.parse(txt); } catch (e) { return showError('The file is not valid JSON.'); }
      if (!obj || typeof obj !== 'object' || !obj.fields) return showError('The file does not contain worksheet fields.');
      if (obj.worksheet && obj.worksheet !== def.id) {
        const other = DEFS.find((d) => d.id === obj.worksheet);
        return showError(other ? `This file holds Worksheet ${other.n} ${other.name}. Open that worksheet to import it.` : 'This file is for a different tool.');
      }
      undo = snapshot();
      const next = blank();
      Object.keys(next.header).forEach((k) => { if (obj.header && typeof obj.header[k] === 'string') next.header[k] = obj.header[k]; });
      let n = 0;
      def.fields.forEach(([k, label]) => {
        const v = obj.fields[k] !== undefined ? obj.fields[k] : obj.fields[label];
        if (typeof v === 'string') { next.fields[k] = v; if (filled(v)) n++; }
      });
      state = next; fill(); save();
      offerUndo(`Imported ${n} of ${def.fields.length} fields.`);
    }, showError);

    el.appendChild(h('div', { class: 'btn-row' }, [
      h('button', { class: 'btn primary', type: 'button', 'data-act': 'example', onclick: () => {
        undo = snapshot();
        state = { header: Object.assign(blank().header, def.example.header), fields: {} };
        def.fields.forEach(([k]) => (state.fields[k] = md(def.example.fields[k] || '')));
        fill(); save();
        offerUndo(`Loaded the completed example from ${def.example.source}.`);
      } }, def.example.label),
      h('button', { class: 'btn', type: 'button', 'data-act': 'clear', onclick: () => {
        undo = snapshot(); state = blank(); fill(); save(); offerUndo('All fields cleared.');
      } }, 'Clear'),
      h('button', { class: 'btn', type: 'button', 'data-act': 'doc', onclick: exportDoc }, 'Export to Word (.doc)'),
      h('button', { class: 'btn', type: 'button', 'data-act': 'print', onclick: () => window.print() }, 'Print / save as PDF'),
      h('button', { class: 'btn', type: 'button', 'data-act': 'json', onclick: exportJSON }, 'Download JSON'),
      h('button', { class: 'btn', type: 'button', 'data-act': 'import', onclick: () => fileIn.click() }, 'Import JSON'),
      fileIn,
    ]));
    el.appendChild(h('p', { class: 'no-print', style: 'margin:0' }, saved));
    el.appendChild(msg);

    /* --- Header --- */
    const headPanel = h('div', { class: 'panel' }, [h('h2', {}, `Worksheet ${def.n}  ${def.name}`)]);
    const hf = h('div', { class: 'fields' });
    HEADER.forEach(([k, label, type, ph]) => {
      const f = WB.field(label, { type, placeholder: ph, onInput: () => { collect(); save(); update(); } });
      f.input.dataset.key = k;
      inputs.header[k] = f.input;
      if (k === 'ref') f.wrap.classList.add('wide');
      hf.appendChild(f.wrap);
    });
    headPanel.appendChild(hf);
    el.appendChild(headPanel);

    /* --- Fields --- */
    const formFields = h('div', { class: 'fields', style: 'gap:16px 14px' });
    const form = h('div', { class: 'panel ws-form' }, [h('h3', { class: 'no-print' }, 'Worksheet fields'), formFields]);
    def.fields.forEach(([k, label, hint]) => {
      const f = WB.field(label, { textarea: true, rows: 2, wide: true, hint: hint || null, onInput: (e) => { autosize(e.target); collect(); save(); update(); } });
      f.input.dataset.key = k;
      linkHint(f);
      inputs.fields[k] = f.input;
      formFields.appendChild(f.wrap);
    });
    el.appendChild(form);

    /* --- Completeness and quality --- */
    const meterText = h('p', { class: 'ws-meter-text', style: 'margin:6px 0' });
    const bar = h('div');
    const meter = h('div', { class: 'progress', role: 'progressbar', 'aria-label': 'Worksheet completeness', 'aria-valuemin': '0', 'aria-valuemax': String(def.fields.length) }, bar);
    const prompts = h('div', { class: 'ws-prompts' });
    el.appendChild(h('div', { class: 'panel no-print' }, [h('h2', {}, 'Completeness and quality prompts'), meterText, meter, prompts]));

    function update() {
      const n = def.fields.filter(([k]) => filled(state.fields[k])).length;
      const N = def.fields.length;
      bar.style.width = (100 * n) / N + '%';
      meter.setAttribute('aria-valuenow', String(n));
      meter.setAttribute('aria-valuetext', `${n} of ${N} fields filled`);
      const missing = def.fields.filter(([k]) => !filled(state.fields[k])).map(([, l]) => l);
      meterText.innerHTML = '';
      meterText.appendChild(h('strong', { class: 'ws-count' }, `${n} of ${N} fields filled`));
      meterText.appendChild(document.createTextNode(` (${Math.round((100 * n) / N)}%)` + (missing.length ? '. Still empty: ' + missing.join(', ') + '.' : '. All fields filled.')));
      prompts.innerHTML = '';
      const warns = def.checks(state.fields, state.header);
      if (warns.length) prompts.appendChild(WB.callout('warn', 'Check before you sign off', h('ul', { style: 'margin:6px 0 0;padding-left:20px' }, warns.map((w) => h('li', {}, w)))));
      else prompts.appendChild(WB.callout('ok', 'No quality prompts', 'The key fields for this worksheet are filled. Completeness is not correctness: a second reviewer should still read the entries.'));
    }

    /* --- Interpretation --- */
    el.appendChild(h('div', { class: 'panel no-print' }, [
      h('h2', {}, 'Interpretation'),
      h('p', {}, def.interp),
      h('p', { class: 'note' }, def.bookLink),
    ]));

    /* --- Exports --- */
    function baseName() { return `worksheet-${def.n}-${slug(def.name)}` + (filled(state.header.ref) ? '-' + slug(state.header.ref) : ''); }
    function exportDoc() {
      collect();
      const title = `Worksheet ${def.n}  ${def.name}`;
      const html = `<h1>${esc(title)}</h1>` +
        headerTable(HEADER.map(([k, l]) => [l, state.header[k]])) + '<p></p>' +
        '<table><thead><tr><th>Field</th><td><b>Entry</b></td></tr></thead><tbody>' +
        def.fields.map(([k, l]) => `<tr><th>${esc(l)}</th><td>${esc(state.fields[k]) || '&nbsp;'}</td></tr>`).join('') +
        '</tbody></table>' +
        `<p class="foot">${esc(FOOTER)}</p>`;
      WB.exportDoc(baseName() + '.doc', title, html);
      offerUndo('Word file prepared: ' + baseName() + '.doc');
    }
    function exportJSON() {
      collect();
      const out = { tool: 'verbatim-to-signal-workbench', worksheet: def.id, title: `Worksheet ${def.n} ${def.name}`, format: 1, exported: new Date().toISOString(), header: state.header, fields: {} };
      def.fields.forEach(([k]) => (out.fields[k] = state.fields[k] || ''));
      WB.download(baseName() + '.json', JSON.stringify(out, null, 2), 'application/json');
    }

    fill();
    if (state.savedAt) saved.textContent = 'Restored from this browser (last saved ' + new Date(state.savedAt).toLocaleString() + ')';
    requestAnimationFrame(() => def.fields.forEach(([k]) => autosize(inputs.fields[k])));
  }

  /* ------------------------------------------------------------------ */
  /* Report completeness checklist (Chapter 3, Table 3.1) */
  const CHECK = [
    ['verbatim', "Verbatim, in the reporter's words", 'Basis for every term', "Obtain the reporter's own words for each event, in the original language, rather than a paraphrase or summary."],
    ['reporter', 'Reporter type and source of each statement', 'Weight of evidence; medical confirmation', 'Confirm the reporter type and who made each key statement, especially the diagnosis; if information is second-hand, request consent and contact details for the treating physician.'],
    ['diagnosis', 'Diagnosis and its certainty', 'Diagnosis versus signs; provisional versus definitive', 'Ask the treating physician for the working or final diagnosis and whether it is provisional or definitive (e.g. the discharge summary).'],
    ['signs', 'Signs and symptoms with onset dates', 'Coding of unrelated or prodromal symptoms; time to onset', 'Request each sign and symptom with its exact onset date, to establish time to onset.'],
    ['labs', 'Laboratory values, units, reference ranges, dates', 'Specific versus non-specific terms; ×ULN; pattern', 'Request laboratory reports with values, units, reference ranges and dates, so multiples of ULN and the pattern can be calculated.'],
    ['baseline', 'Baseline values and pre-existing conditions', 'History versus new event', 'Request baseline values and relevant medical history from before the product was started.'],
    ['dates', 'Product start, stop and dose dates', 'Chronology; dechallenge', 'Confirm the product start date, dose, stop date (if stopped) and the course after stopping (dechallenge) or restarting (rechallenge).'],
    ['concomitant', 'Concomitant products, alcohol', 'Alternative causes', 'Request all concomitant medicines with start dates, including over-the-counter and herbal products, and alcohol use.'],
    ['workup', 'Work-up for alternative causes', 'Case assessment', 'Request the work-up for alternative causes (e.g. imaging and other tests) and its results.'],
    ['outcome', 'Seriousness and outcome', 'Regulatory classification', 'Confirm the seriousness criteria and the current outcome with its date.'],
    ['language', 'Language and translation route', 'Risk of meaning lost in translation', 'Request the original-language text and record who translated it and how idioms were checked.'],
  ];
  const STATUSES = [['present', 'Present'], ['partial', 'Partial'], ['missing', 'Missing'], ['na', 'Not applicable']];
  const CHECK_EXAMPLE = {
    header: { report: 'PM-1322 (Report Y, Case 3.2)', product: 'Product A', reviewer: '', date: '' },
    items: {
      verbatim: ['present', 'Present (telephone note)'],
      reporter: ['partial', 'Consumer; diagnosis relayed second-hand'],
      diagnosis: ['missing', 'Absent'],
      signs: ['partial', 'Approximate ("about two months")'],
      labs: ['missing', 'Absent'],
      baseline: ['missing', 'Absent'],
      dates: ['partial', 'Start approximate; stop unknown'],
      concomitant: ['missing', 'Absent'],
      workup: ['missing', 'Absent'],
      outcome: ['partial', 'Hospitalized; outcome pending'],
      language: ['present', 'English, no translation'],
    },
  };

  function renderChecklist(el) {
    const KEY = 'ws-ws-completeness';
    const blank = () => ({ header: { report: '', product: '', reviewer: '', date: '' }, items: {} });
    let state = WB.store.getJSON(KEY, null) || blank();
    state.header = Object.assign(blank().header, state.header || {});
    state.items = state.items || {};
    let undo = null;
    const { saved, msg } = statusBar();
    const hIn = {}, radios = {}, notes = {};

    function save() {
      state.savedAt = new Date().toISOString();
      saved.textContent = WB.store.setJSON(KEY, state) ? 'Saved in this browser at ' + stamp() : 'Could not save: browser storage is unavailable.';
    }
    function item(k) { return state.items[k] || (state.items[k] = { status: '', note: '' }); }
    function fill() {
      Object.keys(hIn).forEach((k) => (hIn[k].value = state.header[k] || ''));
      CHECK.forEach(([k]) => {
        const it = state.items[k] || { status: '', note: '' };
        radios[k].forEach((r) => (r.checked = r.value === it.status));
        notes[k].value = it.note || '';
      });
      update();
    }
    function snapshot() { return JSON.parse(JSON.stringify(state)); }
    function offerUndo(text) {
      msg.innerHTML = '';
      msg.appendChild(h('div', { class: 'callout ok no-print' }, [
        h('span', {}, text + ' '),
        undo ? h('button', { class: 'btn small', type: 'button', onclick: () => { state = undo; undo = null; fill(); save(); msg.innerHTML = ''; } }, 'Undo') : null,
      ]));
    }

    el.appendChild(h('div', { class: 'panel no-print' }, [
      h('h2', {}, 'How to use'),
      h('p', {}, 'Use the checklist before coding a non-trivial report, and again before closing follow-up. For each element of Table 3.1, mark whether the report contains it (present, partial, missing or not applicable) and note what is there. The tool builds a targeted follow-up query list from the partial and missing elements, which you can copy, edit into your request, or export to Word. Entries save in this browser as you work.'),
      h('p', { class: 'note' }, 'Synthetic training data only. Do not enter personal or identifiable patient information.'),
    ]));

    const fileIn = pickFile((txt) => {
      let obj;
      try { obj = JSON.parse(txt); } catch (e) { msg.innerHTML = ''; return msg.appendChild(WB.callout('bad', 'Import failed', 'The file is not valid JSON.')); }
      if (!obj || obj.worksheet !== 'ws-completeness' || !obj.items) { msg.innerHTML = ''; return msg.appendChild(WB.callout('bad', 'Import failed', 'The file is not a report completeness checklist.')); }
      undo = snapshot();
      const next = blank();
      Object.keys(next.header).forEach((k) => { if (obj.header && typeof obj.header[k] === 'string') next.header[k] = obj.header[k]; });
      CHECK.forEach(([k]) => { const it = obj.items[k]; if (it) next.items[k] = { status: STATUSES.some(([s]) => s === it.status) ? it.status : '', note: String(it.note || '') }; });
      state = next; fill(); save(); offerUndo('Checklist imported.');
    }, () => {});

    el.appendChild(h('div', { class: 'btn-row' }, [
      h('button', { class: 'btn primary', type: 'button', 'data-act': 'example', onclick: () => {
        undo = snapshot();
        state = { header: Object.assign(blank().header, CHECK_EXAMPLE.header), items: {} };
        CHECK.forEach(([k]) => { const e = CHECK_EXAMPLE.items[k]; state.items[k] = { status: e[0], note: e[1] }; });
        fill(); save(); offerUndo('Loaded Table 3.1, completed for Report Y (PM-1322).');
      } }, 'Load book example (Chapter 3, Table 3.1, Report Y)'),
      h('button', { class: 'btn', type: 'button', 'data-act': 'clear', onclick: () => { undo = snapshot(); state = blank(); fill(); save(); offerUndo('Checklist cleared.'); } }, 'Clear'),
      h('button', { class: 'btn', type: 'button', 'data-act': 'doc', onclick: exportDoc }, 'Export to Word (.doc)'),
      h('button', { class: 'btn', type: 'button', 'data-act': 'print', onclick: () => window.print() }, 'Print / save as PDF'),
      h('button', { class: 'btn', type: 'button', 'data-act': 'json', onclick: exportJSON }, 'Download JSON'),
      h('button', { class: 'btn', type: 'button', 'data-act': 'import', onclick: () => fileIn.click() }, 'Import JSON'),
      fileIn,
    ]));
    el.appendChild(h('p', { class: 'no-print', style: 'margin:0' }, saved));
    el.appendChild(msg);

    const hp = h('div', { class: 'panel' }, [h('h2', {}, 'Report')]);
    const hf = h('div', { class: 'fields' });
    [['report', 'Report identifier', 'text'], ['product', 'Product', 'text'], ['reviewer', 'Reviewer', 'text'], ['date', 'Date', 'date']].forEach(([k, l, t]) => {
      const f = WB.field(l, { type: t, onInput: () => { state.header[k] = f.input.value; save(); update(); } });
      f.input.dataset.key = k; hIn[k] = f.input; hf.appendChild(f.wrap);
    });
    hp.appendChild(hf);
    el.appendChild(hp);

    const list = h('div', { class: 'panel' }, [h('h2', {}, 'Checklist (Table 3.1)')]);
    CHECK.forEach(([k, label, why], i) => {
      const name = 'cc-' + k;
      const fs = h('fieldset', { class: 'cc-item', 'data-key': k, style: 'border:1px solid var(--line);border-radius:8px;padding:10px 12px;margin:10px 0' });
      fs.appendChild(h('legend', { style: 'font-weight:600;color:var(--navy);padding:0 4px' }, `${i + 1}. ${label}`));
      fs.appendChild(h('p', { class: 'note', style: 'margin:0 0 6px' }, 'Why it matters: ' + why));
      const row = h('div', { style: 'display:flex;flex-wrap:wrap;gap:6px 16px;margin-bottom:6px' });
      radios[k] = STATUSES.map(([v, t]) => {
        const id = name + '-' + v;
        const r = h('input', { type: 'radio', name, id, value: v, style: 'width:auto;margin:0 6px 0 0' });
        r.addEventListener('change', () => { item(k).status = v; save(); update(); });
        row.appendChild(h('label', { for: id, style: 'display:inline-flex;align-items:center;font-size:14px;cursor:pointer' }, [r, t]));
        return r;
      });
      fs.appendChild(row);
      const nf = WB.field('Note: what the report contains', { type: 'text', onInput: () => { item(k).note = nf.input.value; save(); update(); } });
      notes[k] = nf.input;
      fs.appendChild(nf.wrap);
      list.appendChild(fs);
    });
    el.appendChild(list);

    /* output */
    const stats = h('div', { class: 'result' });
    const meterText = h('p', { style: 'margin:6px 0' });
    const bar = h('div');
    const meter = h('div', { class: 'progress', role: 'progressbar', 'aria-label': 'Checklist completeness', 'aria-valuemin': '0', 'aria-valuemax': String(CHECK.length) }, bar);
    const outTa = WB.field('Follow-up query list', { textarea: true, rows: 8, wide: true, hint: 'Generated from partial and missing elements. Copy it, then edit it into your request to the right person (the treating physician for a diagnosis, the laboratory report for values).' });
    outTa.input.readOnly = true;
    outTa.input.classList.add('cc-out');
    linkHint(outTa);
    const copyMsg = h('span', { class: 'note', role: 'status', 'aria-live': 'polite' });
    el.appendChild(h('div', { class: 'panel' }, [
      h('h2', {}, 'Result and follow-up queries'), meterText, meter, stats, outTa.wrap,
      h('div', { class: 'btn-row' }, [
        h('button', { class: 'btn', type: 'button', 'data-act': 'copy', onclick: copyList }, 'Copy query list'),
        h('button', { class: 'btn', type: 'button', 'data-act': 'txt', onclick: () => WB.download(baseName() + '-queries.txt', queryText(), 'text/plain;charset=utf-8') }, 'Download as text'),
        copyMsg,
      ]),
    ]));

    el.appendChild(h('div', { class: 'panel no-print' }, [
      h('h2', {}, 'Interpretation'),
      h('p', {}, ['Completeness decides what a report can support, not what it means. A report missing its diagnosis, laboratory values and work-up is coded from what the reporter said (in Case 3.2, Report Y is coded to ', h('i', {}, 'Jaundice'), ' (PT), with no hepatic diagnosis) and counts in a case series only as a retrieved report awaiting information, not as a confirmed case. Causality cannot be assessed until the gaps are closed; targeted follow-up asks the person most likely to know.']),
      h('p', { class: 'note' }, 'Book link: Chapter 3, Case 3.2 and Table 3.1 (Report Y, PM-1322).'),
    ]));

    function counts() {
      const c = { present: 0, partial: 0, missing: 0, na: 0, unchecked: 0 };
      CHECK.forEach(([k]) => { const s = (state.items[k] || {}).status; c[s || 'unchecked']++; });
      return c;
    }
    function queryItems() {
      return CHECK.filter(([k]) => /partial|missing/.test((state.items[k] || {}).status || ''));
    }
    function queryText() {
      const qs = queryItems();
      const id = state.header.report || 'this report';
      if (!qs.length) return CHECK.every(([k]) => (state.items[k] || {}).status) ? `No follow-up queries needed for ${id}: no element is partial or missing.` : 'Mark each element to generate the follow-up query list.';
      const lines = [`Follow-up queries for ${id}` + (state.header.product ? ` (${state.header.product})` : '')];
      qs.forEach(([k, label, , q], i) => {
        const it = state.items[k];
        lines.push(`${i + 1}. [${it.status === 'missing' ? 'Missing' : 'Partial'}] ${label}: ${q}` + (filled(it.note) ? ` Currently: ${it.note.trim()}.` : ''));
      });
      return lines.join('\n');
    }
    function update() {
      const c = counts();
      const done = CHECK.length - c.unchecked;
      bar.style.width = (100 * done) / CHECK.length + '%';
      meter.setAttribute('aria-valuenow', String(done));
      meter.setAttribute('aria-valuetext', `${done} of ${CHECK.length} elements checked`);
      meterText.innerHTML = '';
      meterText.appendChild(h('strong', { class: 'cc-count' }, `${done} of ${CHECK.length} elements checked`));
      stats.innerHTML = '';
      [['Present', c.present], ['Partial', c.partial], ['Missing', c.missing], ['Not applicable', c.na]].forEach(([k, v]) => stats.appendChild(h('div', { class: 'stat', 'data-stat': k }, [h('div', { class: 'k' }, k), h('div', { class: 'v' }, String(v)), h('div', { class: 's' }, 'elements')])));
      outTa.input.value = queryText();
      autosize(outTa.input);
    }
    function copyList() {
      const t = queryText();
      const done = () => (copyMsg.textContent = 'Copied to clipboard.');
      const fallback = () => { outTa.input.focus(); outTa.input.select(); try { document.execCommand('copy'); done(); } catch (e) { copyMsg.textContent = 'Select the text and copy it manually.'; } };
      if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(t).then(done, fallback); else fallback();
    }
    function baseName() { return 'report-completeness' + (filled(state.header.report) ? '-' + slug(state.header.report) : ''); }
    function exportDoc() {
      const lbl = Object.fromEntries(STATUSES);
      const qs = queryItems();
      const html = '<h1>Report completeness checklist</h1>' +
        headerTable([['Report identifier', state.header.report], ['Product', state.header.product], ['Reviewer', state.header.reviewer], ['Date', state.header.date]]) + '<p></p>' +
        '<table><thead><tr><th>Element</th><td><b>Status</b></td><td><b>Note</b></td></tr></thead><tbody>' +
        CHECK.map(([k, l]) => { const it = state.items[k] || {}; return `<tr><th>${esc(l)}</th><td>${esc(lbl[it.status] || 'Not checked')}</td><td>${esc(it.note) || '&nbsp;'}</td></tr>`; }).join('') +
        '</tbody></table><h2>Follow-up queries</h2>' +
        (qs.length ? '<ol>' + qs.map(([k, l, , q]) => { const it = state.items[k]; return `<li><b>${esc(l)}</b> (${esc(lbl[it.status])}): ${esc(q)}${filled(it.note) ? ' Currently: ' + esc(it.note.trim()) + '.' : ''}</li>`; }).join('') + '</ol>' : `<p>${esc(queryText())}</p>`) +
        `<p class="foot">${esc(FOOTER)}</p>`;
      WB.exportDoc(baseName() + '.doc', 'Report completeness checklist', html);
      offerUndo('Word file prepared: ' + baseName() + '.doc');
    }
    function exportJSON() {
      const out = { tool: 'verbatim-to-signal-workbench', worksheet: 'ws-completeness', title: 'Report completeness checklist', format: 1, exported: new Date().toISOString(), header: state.header, items: {} };
      CHECK.forEach(([k]) => { const it = state.items[k] || {}; out.items[k] = { status: it.status || '', note: it.note || '' }; });
      WB.download(baseName() + '.json', JSON.stringify(out, null, 2), 'application/json');
    }

    fill();
    if (state.savedAt) saved.textContent = 'Restored from this browser (last saved ' + new Date(state.savedAt).toLocaleString() + ')';
  }

  /* ------------------------------------------------------------------ */
  DEFS.forEach((def) => WB.register({
    id: def.id, group: 'worksheets', title: `Worksheet ${def.n}: ${def.name}`, summary: def.summary, chapters: [def.chapter],
    render: (el) => renderWorksheet(def, el),
  }));
  WB.register({
    id: 'ws-completeness', group: 'worksheets', title: 'Report completeness checklist',
    summary: 'Tick what a report contains and turn the gaps into a targeted follow-up query list.', chapters: [3],
    render: renderChecklist,
  });
  WB._worksheets = { DEFS, CHECK, md }; // exposed for tests
})();
