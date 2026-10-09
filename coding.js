/* Verbatim to Signal Workbench — Coding trainer module
   Tools: coding-trainer (Chapters 3–6), coding-review (Chapters 7, 20).
   All scenarios are the book's own synthetic cases, examples and exercises. Term names are
   written as book tokens ({PT:Name}) and appear in the book; they are not MedDRA content. */
(function () {
  'use strict';
  const h = WB.h;

  /* ---------------- shared helpers ---------------- */
  const TOK = /\{(LLT|PT|HLT|HLGT|SOC|SMQ):([^}]+)\}/g;
  /** Render book tokens as italic term name plus level, e.g. <i>Ocular icterus</i> (PT). Input must be trusted or escaped. */
  const T = (s) => String(s || '').replace(TOK, (m, lvl, name) => '<i>' + name + '</i> (' + lvl + ')');
  /** Escape user text, then render any tokens it contains. */
  const tt = (s) => T(WB.esc(String(s || '')));
  const span = (html, cls) => h('span', { class: cls || null, html: html });
  const today = () => new Date().toISOString().slice(0, 10);

  function injectCSS() {
    if (document.getElementById('cx-css')) return;
    const css = [
      '.cx-scope{contain:inline-size}',
      '.cx-prev{font-size:13px;color:#2B3240}.cx-prev:empty{display:none}',
      '.cx-verbatim{background:var(--mist);border-left:4px solid var(--amber);border-radius:8px;padding:10px 14px;margin:8px 0}',
      '.cx-verbatim q{font-style:italic}',
      '.cx-meta{display:flex;flex-wrap:wrap;gap:6px;align-items:center;font-size:13px;color:var(--muted);margin-bottom:6px}',
      '.cx-opt-note{display:block;font-size:13px;color:#3A4250;margin-top:4px}',
      '.cx-tag{display:block;font-size:12px;font-weight:700;letter-spacing:.02em;margin-bottom:2px;color:var(--navy)}',
      '.choice.cx-multi{display:flex;gap:10px;align-items:flex-start;cursor:pointer}',
      '.choice.cx-multi input{width:auto;margin-top:4px;flex:none}',
      '.choice[aria-disabled="true"]{cursor:default}',
      '.cx-nav{display:flex;flex-wrap:wrap;gap:6px;margin:8px 0}',
      '.cx-nav button{font:inherit;font-size:13px;min-width:44px;padding:4px 6px;border:1px solid var(--line);background:#fff;border-radius:6px;cursor:pointer;color:var(--ink)}',
      '.cx-nav button.s1{background:var(--ok-l);border-color:var(--ok)}',
      '.cx-nav button.s05{background:var(--amber-l);border-color:var(--amber)}',
      '.cx-nav button.s0{background:var(--bad-l);border-color:var(--bad)}',
      '.cx-nav button[aria-current="true"]{outline:3px solid var(--navy);outline-offset:1px;font-weight:700}',
      '.cx-controls{display:flex;flex-wrap:wrap;gap:10px 14px;align-items:flex-end}',
      '.cx-controls .field{max-width:320px}',
      '.cx-fb{outline:none}',
      '.cx-fb dl{margin:6px 0 0}.cx-fb dt{font-weight:700;margin-top:6px;color:var(--navy)}.cx-fb dd{margin:2px 0 0}',
      '.cx-tabs{display:flex;flex-wrap:wrap;gap:6px;margin:4px 0 12px;border-bottom:2px solid var(--line);padding-bottom:8px}',
      '.cx-tabs button[aria-selected="true"]{background:var(--navy);color:#fff}',
      '.cx-q{border:1px solid var(--line);border-radius:8px;padding:8px 12px 10px;margin:8px 0;background:#fff}',
      '.cx-q legend{font-weight:700;color:var(--navy);padding:0 4px;font-size:14px}',
      '.cx-q .cx-ask{font-size:13.5px;margin:0 0 4px}',
      '.cx-q-row{display:grid;grid-template-columns:auto 1fr;gap:6px 16px;align-items:center}',
      '.cx-radios{display:flex;gap:14px;flex-wrap:wrap}',
      '.cx-radios label{display:flex;align-items:center;gap:5px;font-weight:500;font-size:14px;cursor:pointer}',
      '.cx-radios input{width:auto;margin:0}',
      '.cx-q input.cx-note{padding:5px 8px;font-size:13.5px}',
      '.cx-q .cx-ifno{font-size:12.5px;color:var(--muted);margin-top:4px}',
      '.cx-q.no{border-color:var(--bad);background:#FFFBFA}',
      '.cx-verdict{font-size:20px;font-weight:800;margin:2px 0}',
      '.cx-sticky-actions{display:flex;flex-wrap:wrap;gap:8px}',
      '@media (max-width:640px){.cx-q-row{grid-template-columns:1fr}.cx-controls .field{max-width:none}}',
    ].join('\n');
    document.head.appendChild(h('style', { id: 'cx-css' }, css));
  }

  /* ================================================================
     TOOL 1 — Term selection trainer
     ================================================================ */
  const TOPICS = [
    { id: 'term', label: 'Term selection' },
    { id: 'dx', label: 'Diagnoses vs symptoms' },
    { id: 'inv', label: 'Investigations' },
    { id: 'prov', label: 'Provisional diagnosis' },
    { id: 'me', label: 'Medication errors' },
    { id: 'od', label: 'Overdose / misuse' },
    { id: 'ol', label: 'Off-label use' },
    { id: 'preg', label: 'Pregnancy' },
    { id: 'pq', label: 'Product quality' },
    { id: 'loe', label: 'Lack of effect' },
    { id: 'out', label: 'Death / outcomes' },
  ];
  const topicLabel = (id) => (TOPICS.find((t) => t.id === id) || {}).label || id;
  const TYPE_LABEL = { single: 'Single best answer', multi: 'Select all that apply', error: 'What’s wrong with this coding?' };

  /** Error classes of Chapter 7 (Figure 7.2) — used by the "what's wrong" drills and the taxonomy panel. */
  const ERR = [
    { id: 'omission', name: 'Omission', def: 'A reported concept is not coded.', ex: '“off food” not coded in Case 4.2 (PA-301-0147, Day 64).' },
    { id: 'inference', name: 'Inference', def: 'The code adds a diagnosis, severity or cause that was not reported.', ex: '{PT:Hepatic failure} for “LFTs very high” in Case 4.1.' },
    { id: 'specificity', name: 'Specificity', def: 'The code is less specific than the report supports, or more specific than it supports.', ex: '{LLT:Gallstones} for “common bile duct stone” in Case 7.2.' },
    { id: 'category', name: 'Category', def: 'The wrong kind of term: a condition for a result, a disorder for a test, an event for an outcome, a medication error for an intentional act.', ex: '“LFTs raised” mapped to {PT:Hepatic function abnormal} instead of {PT:Liver function test increased} (Chapter 7).' },
    { id: 'process', name: 'Process', def: 'The code was right once but is wrong now, or was never checked: a stale provisional diagnosis, a non-current LLT, a version mismatch, a convention not applied, an automated suggestion accepted without review.', ex: '{PT:Hepatitis} left beside {PT:Drug-induced liver injury} after the update (Case 5.2).' },
  ];
  const ERR_NONE = { id: 'none', name: 'No error', def: 'The coding is acceptable as it stands.' };

  /* Option kinds: req = should be selected / best answer; alt = defensible alternative (partial credit);
     opt = optional either way (multi only); wrong = not supported.  g = concept group (an alt in the same
     group covers a missed req for partial credit); missOk = omitting this req is a defensible alternative. */
  const DRILLS = [
    /* ---------- Term selection ---------- */
    {
      id: 'ts1', topic: 'term', type: 'single', ref: 'Example 4.1', ptc: '2.4 and 2.10', title: 'Burning upper abdominal pain',
      scenario: `A patient taking a fictional non-steroidal anti-inflammatory drug reports: <q>burning pain in the upper part of my stomach, under the ribs, most days since I started the tablets.</q> No examination, endoscopy or physician diagnosis is reported.`,
      prompt: `Which candidate LLT should be selected?`,
      options: [
        { t: `{LLT:Dyspepsia}`, k: 'wrong', n: `Names a syndrome a physician might conclude; the reporter described pain, not indigestion. It sits above the ceiling.` },
        { t: `{LLT:Abdominal pain upper}`, k: 'req', n: `Records the symptom and its site and nothing more; links to {PT:Abdominal pain upper}.` },
        { t: `{LLT:Gastric ulcer}`, k: 'wrong', n: `A diagnosis that needs endoscopy or imaging, and nobody made it (added diagnosis).` },
        { t: `{LLT:Abdominal pain}`, k: 'wrong', n: `Drops the site the reporter gave, so it records less than was said (below the floor).` },
      ],
      explain: `The report sets both the floor (everything reported) and the ceiling (nothing more). Only {LLT:Abdominal pain upper} sits between them. “Burning” and the timing stay in the verbatim and the narrative.`,
      alts: `{LLT:Dyspepsia} becomes a defensible alternative only if the reporter’s wider account describes indigestion.`,
    },
    {
      id: 'ts2', topic: 'term', type: 'single', ref: 'Example 4.2', ptc: '2.9', title: 'Dizzy on standing',
      scenario: `Trial CRF AE line: <q>dizzy on standing up from chair</q>. No blood pressure was measured during the episodes. An autocoder proposes {LLT:Postural hypotension}, because “postural” matches the sense of the verbatim.`,
      prompt: `Which LLT should be accepted after the parent PT check?`,
      options: [
        { t: `{LLT:Postural hypotension}, which links to {PT:Orthostatic hypotension}`, k: 'wrong', n: `The PT means a fall in blood pressure on standing, a finding nobody measured. Rejected at the PT check.` },
        { t: `{LLT:Dizziness postural}, which links to {PT:Dizziness postural}`, k: 'req', n: `Keeps the symptom and its trigger; a symptom term in {SOC:Nervous system disorders}.` },
        { t: `{PT:Syncope}`, k: 'wrong', n: `No loss of consciousness was reported; this adds an event.` },
        { t: `{PT:Dizziness}`, k: 'wrong', n: `Drops the postural trigger the reporter gave (below the floor).` },
      ],
      explain: `Ask the hierarchy question: would the PT, alone in an AE table, tell a physician what the reporter said? {PT:Orthostatic hypotension} would report a haemodynamic finding that was never measured, overstating that effect in any orthostatic hypotension count.`,
      alts: `If the investigator later documents a blood pressure fall, {PT:Orthostatic hypotension} is added then, as reported. Follow-up: orthostatic blood pressure readings.`,
    },
    {
      id: 'ts3', topic: 'term', type: 'multi', ref: 'Case 3.2 (Report Y)', ptc: '2.10 and 3.2', title: 'Consumer report: “went yellow”',
      scenario: `Report Y (PM-1322), from the patient’s wife by telephone: <q>My husband’s skin and eyes went yellow about two months after he started Product A. The hospital did tests and said it was his liver. He is still in hospital.</q>`,
      prompt: `Select all terms you would code as events.`,
      options: [
        { t: `{PT:Hepatitis}`, k: 'wrong', n: `No hepatic diagnosis was reported; “said it was his liver” is not a diagnosis.` },
        { t: `{PT:Jaundice}`, k: 'req', n: `Matches “skin and eyes went yellow”.` },
        { t: `{PT:Drug-induced liver injury}`, k: 'wrong', n: `Adds a diagnosis and a cause that nobody stated.` },
        { t: `{LLT:Eyes yellow}, under {PT:Ocular icterus}`, k: 'opt', n: `An acceptable addition; not required.` },
        { t: `{PT:Hepatic function abnormal}`, k: 'wrong', n: `A disorder term that adds an interpretation; no test results were reported.` },
      ],
      explain: `Code what the consumer described and no hepatic diagnosis, because none was reported. Hospitalization is recorded as a seriousness criterion, not as an event term (section 3.2). Report Y is serious but unassessable until follow-up obtains the treating physician’s details, laboratory values with units and ranges, imaging and the working diagnosis.`,
      alts: `{LLT:Eyes yellow} under {PT:Ocular icterus} as an addition. Coding a hepatic disorder term on the strength of “said it was his liver” would make Report Y look like a diagnosed liver injury beside Report X.`,
    },
    {
      id: 'ts4', topic: 'term', type: 'error', ref: 'Case 4.1', ptc: '2.10', title: 'Index case phone report: a severe term',
      scenario: `PA-301-0147, site to sponsor safety, Day 71: <q>Pt called with yellow eyes and dark urine. LFTs very high. ? hepatitis. Study drug being held.</q> Follow-up later shows INR 1.2 and no encephalopathy.`,
      coded: `{PT:Hepatic failure}`,
      prompt: `What kind of coding error is this?`,
      answer: 'inference',
      explain: `The term adds a severity nobody reported. Hepatic failure is a clinical diagnosis with coagulopathy and usually encephalopathy; the INR of 1.2 and the absence of encephalopathy show it was wrong as well as unsupported. The error would travel into the expedited report and every later hepatic failure search.`,
      alts: `The reviewed coding is {LLT:Eyes yellow} → {PT:Ocular icterus}, {LLT:Dark urine} → {PT:Chromaturia} and {LLT:Hepatitis} → {PT:Hepatitis} as a provisional diagnosis, with {LLT:Liver function test increased} recommended for “LFTs very high”; “study drug being held” goes to the action-taken field.`,
    },
    {
      id: 'ts5', topic: 'term', type: 'error', ref: 'Case 4.2', ptc: '2.10 and 3.5', title: '“Tired, off food”',
      scenario: `PA-301-0147, CRF AE line, Day 64: <q>tired, off food</q>. A separate line reads <q>nausea</q>.`,
      coded: `{LLT:Fatigue} → {PT:Fatigue} only`,
      prompt: `What kind of coding error is this?`,
      answer: 'omission',
      explain: `“Off food” is a colloquial phrase for loss of appetite, and it was not represented in the coded data. A PT search for {PT:Decreased appetite} would miss this patient. One omission matters little; the same omission repeated across a database silently lowers counts of a common symptom.`,
      alts: `Code {LLT:Loss of appetite} → {PT:Decreased appetite} against the same verbatim if your conventions allow several LLTs per verbatim, or query the site to split the line. Under a one-LLT-per-verbatim convention, query promptly rather than code the stronger concept and drop the weaker.`,
    },
    {
      id: 'ts6', topic: 'term', type: 'error', ref: 'Case 7.2', ptc: '2.4 and 2.9', title: 'Common bile duct stone',
      scenario: `PA-301-0467, CRF AE line, Day 136: <q>common bile duct stone on ultrasound</q>. Separate line, Day 134: <q>jaundice</q>. Ultrasound: dilated common bile duct with a distal stone; small calculi in the gallbladder.`,
      coded: `{LLT:Gallstones} → {PT:Cholelithiasis}`,
      prompt: `What kind of coding error is this?`,
      answer: 'specificity',
      explain: `The verbatim names the bile duct, and the LLT that most accurately reflects it is {LLT:Choledocholithiasis}, which links to {PT:Bile duct stone} (section 2.4). The hierarchy check confirms the problem: {PT:Cholelithiasis} sits under {HLGT:Gallbladder disorders}, which is not where a bile duct stone belongs (section 2.9). No hepatic count changes, but a search for bile duct disorders would miss the patient.`,
      alts: `None for the bile duct line. The gallbladder stones are not added, because the investigator did not report them as an AE (section 2.10); a query can ask.`,
    },

    /* ---------- Diagnoses vs symptoms ---------- */
    {
      id: 'dx1', topic: 'dx', type: 'multi', ref: 'Case 4.3', ptc: '2.4 and 2.10', title: 'Swollen legs, breathless lying flat',
      scenario: `Consumer report for a fictional calcium-channel-blocking antihypertensive: <q>Three weeks after starting the new blood pressure pill my legs swelled right up and I can’t lie flat at night without getting out of breath. Going to see my doctor.</q> No physician diagnosis or examination findings.`,
      prompt: `Select all terms you would code.`,
      options: [
        { t: `{PT:Cardiac failure}`, k: 'wrong', n: `Not supported: the reporter did not name it, and dependent oedema is a known effect of this drug class (added diagnosis).` },
        { t: `{LLT:Leg swelling}, under {PT:Peripheral swelling}`, k: 'req', g: 'legs', n: `Matches “legs swelled”.` },
        { t: `{PT:Orthopnoea}`, k: 'req', g: 'breath', n: `“Can’t lie flat without getting out of breath” is the definition of orthopnoea.` },
        { t: `{PT:Oedema peripheral}`, k: 'alt', g: 'legs', n: `A reasonable alternative for some coders, but oedema is a sign usually established on examination; the reporter described swelling.` },
        { t: `{PT:Dyspnoea}`, k: 'alt', g: 'breath', n: `Acceptable, less specific alternative to {PT:Orthopnoea}.` },
      ],
      explain: `Code the two reported symptoms at the specificity the words support. Whether a cardiac failure query should find this case is the query designer’s decision (Chapter 11), not the coder’s.`,
      alts: `{PT:Oedema peripheral} for the swelling; {PT:Dyspnoea} for the breathlessness. If the physician later diagnoses heart failure, the diagnosis is added then, with an audit trail.`,
    },
    {
      id: 'dx2', topic: 'dx', type: 'multi', ref: 'Example 5.1', ptc: '3.1 and 3.14', title: 'Acute pancreatitis with an itchy rash',
      scenario: `A hospital physician reports for a fictional lipid-lowering drug: <q>Acute pancreatitis, lipase 6×ULN, confirmed on CT. Severe epigastric pain radiating to the back, repeated vomiting. Also an itchy rash on both forearms since the same morning.</q>`,
      prompt: `Select all terms you would code.`,
      options: [
        { t: `{PT:Abdominal pain upper}`, k: 'alt', n: `Added only under the PtC alternative option (diagnosis plus signs and symptoms).` },
        { t: `{PT:Pancreatitis acute}`, k: 'req', n: `The definitive diagnosis, confirmed by laboratory and imaging.` },
        { t: `{PT:Pancreatitis}`, k: 'wrong', n: `Less specific than the confirmed diagnosis the reporter gave.` },
        { t: `{LLT:Itchy rash}, which links to {PT:Rash pruritic}`, k: 'req', n: `Not a feature of pancreatitis and not linked by the reporter, so it is coded under both options.` },
        { t: `{PT:Vomiting}`, k: 'alt', n: `Added only under the PtC alternative option.` },
      ],
      explain: `Under the PtC preferred option for a definitive diagnosis, select the diagnosis only: {PT:Pancreatitis acute} and {PT:Rash pruritic}, 2 events. The alternative adds {PT:Abdominal pain upper} and {PT:Vomiting}, 2 + 2 = 4 events. The lipase result is consistent with the diagnosis and is not coded separately (section 3.14).`,
      alts: `The PtC alternative option (diagnosis plus associated signs and symptoms) is defensible if it is your written convention. The pancreatitis count is the same either way; the pain and vomiting rows each gain an event.`,
    },
    {
      id: 'dx3', topic: 'dx', type: 'multi', ref: 'Case 5.1', ptc: '3.1', title: 'Product B infusion reaction acquires a diagnosis',
      scenario: `PB-0254, third Product B infusion: <q>About 20 min into her third Product B infusion she became flushed and itchy over the face and chest and felt cold and shivery. Temp 38.1. BP 128/80, sats 98%. No wheeze, no swelling, no rash.</q> Day 2: <q>Headache that evening; her usual migraine.</q> CRF, Day 9: AE term <q>infusion-related reaction, grade 2</q> with flushing, pruritus, chills and fever listed as its features; separate AE line <q>migraine</q>, assessed as unrelated.`,
      prompt: `After the Day 9 update, select all terms the coded record should hold.`,
      options: [
        { t: `{PT:Infusion site reaction}`, k: 'wrong', n: `Describes a local reaction at the infusion site, not a systemic one.` },
        { t: `{PT:Infusion related reaction}`, k: 'req', n: `The investigator’s definitive diagnosis.` },
        { t: `{PT:Flushing}`, k: 'alt', n: `Retained only under the PtC alternative option (diagnosis plus signs and symptoms).` },
        { t: `{PT:Migraine}`, k: 'req', n: `An unrelated symptom, always coded whichever option is used.` },
        { t: `{PT:Anaphylactic reaction}`, k: 'wrong', n: `No hypotension, respiratory compromise or mucosal involvement; nobody diagnosed anaphylaxis.` },
        { t: `{PT:Pruritus}`, k: 'alt', n: `Retained only under the PtC alternative option.` },
      ],
      explain: `Under the PtC preferred option for a definitive diagnosis, the symptom terms ({PT:Flushing}, {PT:Pruritus}, {PT:Chills}, {PT:Body temperature increased}) are replaced by {PT:Infusion related reaction}; {PT:Migraine} stays in every convention. Whether the reaction meets anaphylaxis criteria is a medical conclusion recorded in the review, not in the codes.`,
      alts: `Retaining the symptom terms alongside the diagnosis (PtC alternative) is defensible if written down, but it brings the case into the broad, non-algorithmic {SMQ:Anaphylactic reaction} search as a case to review and exclude.`,
    },
    {
      id: 'dx4', topic: 'dx', type: 'error', ref: 'Example 7.2', ptc: '3.1', title: 'Acute bronchitis: two reviewers disagree',
      scenario: `Product B trial; the investigator reports <q>acute bronchitis, with cough and wheeze; chest X-ray clear</q>. The program’s written conventions adopt the PtC preferred option for definitive diagnoses.`,
      coded: `Reviewer A: {PT:Bronchitis} + {PT:Cough} + {PT:Wheezing}`,
      prompt: `What kind of coding error is Reviewer A’s coding in this program?`,
      answer: 'process',
      explain: `Both answers are permitted by the PtC (section 3.1), so the source and the guidance do not decide; the written convention does. This program adopted the preferred option, so the diagnosis only, {PT:Bronchitis}, stands. Reviewer A’s coding is a convention not applied. It also matters: {PT:Wheezing} is a respiratory term in the broad search of {SMQ:Anaphylactic reaction}, adding a case to read and exclude.`,
      alts: `In a program whose conventions adopt the PtC alternative, Reviewer A’s coding would be correct. Reviewer B’s coding stands because of the written convention, not seniority.`,
    },

    /* ---------- Investigations ---------- */
    {
      id: 'inv1', topic: 'inv', type: 'single', ref: 'Example 3.2 (a)', ptc: '3.14', title: 'Glucose 54 mg/dL, below range',
      scenario: `Trial of a fictional oral antidiabetic, AE line: <q>Glucose 54 mg/dL, below range</q> (laboratory reference range 70–99 mg/dL). No symptoms or diagnosis reported.`,
      prompt: `Which term should be selected?`,
      options: [
        { t: `{PT:Hypoglycaemia}`, k: 'wrong', n: `A condition; the reporter gave a result and named no condition.` },
        { t: `{PT:Blood glucose abnormal}`, k: 'wrong', n: `The non-specific term is for results without units or range; here value, unit and range establish the direction.` },
        { t: `{PT:Blood glucose decreased}`, k: 'req', n: `An unambiguous result with value, unit and range.` },
      ],
      explain: `54 mg/dL ÷ 18.0 = 3.0 mmol/L, using the approximate glucose factor of 18.0 mg/dL per mmol/L. With value, unit and range all stated, the result is coded as a specific investigation term.`,
      alts: `None. A review of low glucose that searched only {PT:Hypoglycaemia} would miss this line.`,
    },
    {
      id: 'inv2', topic: 'inv', type: 'single', ref: 'Example 3.2 (b)', ptc: '3.14', title: '“Glucose 3.0” with no unit',
      scenario: `Same trial, AE line: <q>Glucose 3.0</q>, with no unit, range or comment.`,
      prompt: `Which term should be selected now?`,
      options: [
        { t: `{PT:Blood glucose decreased}`, k: 'alt', n: `Some conventions accept this when only one unit is physiologically plausible; an organization-specific choice that must be documented.` },
        { t: `{PT:Blood glucose abnormal}`, k: 'req', n: `The non-specific term for a result reported without units, with a query for the unit and range.` },
        { t: `{PT:Hypoglycaemia}`, k: 'wrong', n: `A condition nobody named, and a direction the report does not establish.` },
      ],
      explain: `The figure would be low in mmol/L and implausible in mg/dL, but the coder should not supply a unit the reporter did not give. Use the non-specific term and query the unit and range.`,
      alts: `{PT:Blood glucose decreased}, if your written convention allows it when only one unit is physiologically plausible.`,
    },
    {
      id: 'inv3', topic: 'inv', type: 'single', ref: 'Exercise 3.1', ptc: '3.14', title: '“Bilirubin 2.4, ? Gilbert’s”',
      scenario: `Trial site AE line: <q>Bilirubin 2.4, ? Gilbert’s.</q> The laboratory upload is delayed.`,
      prompt: `What can be coded now?`,
      options: [
        { t: `{PT:Blood bilirubin increased}`, k: 'wrong', n: `Becomes appropriate once units and range confirm an increase; “2.4” is unremarkable in µmol/L and about twice the ULN in mg/dL.` },
        { t: `{PT:Gilbert's syndrome} as an event`, k: 'wrong', n: `A provisional explanation, not an event; it belongs in the narrative and, if confirmed as pre-existing, in medical history.` },
        { t: `{PT:Blood bilirubin abnormal}`, k: 'req', n: `The non-specific term for a result without units or range.` },
        { t: `{PT:Hyperbilirubinaemia}`, k: 'wrong', n: `A condition term with a direction the report cannot establish.` },
      ],
      explain: `Without units or range the value cannot be interpreted. Query the units and range, conjugated and unconjugated fractions, baseline values and whether Gilbert syndrome was known before randomization. The coder does not remove the AE line unilaterally; only the investigator can withdraw it.`,
      alts: `None now. If the answers show a new conjugated hyperbilirubinemia, the case moves to medical review as a possible liver injury.`,
    },
    {
      id: 'inv4', topic: 'inv', type: 'multi', ref: 'Chapter 4 (text), “Multiple concepts, procedures and investigations”', ptc: '3.14', title: 'Three liver tests on one line',
      scenario: `AE line: <q>ALT 3 times normal, AST 2 times normal, ALP raised</q>. No diagnosis reported.`,
      prompt: `Select all terms you would code.`,
      options: [
        { t: `{PT:Alanine aminotransferase increased}`, k: 'req', n: `One reported result.` },
        { t: `{PT:Transaminases increased}`, k: 'wrong', n: `Groups two separately reported results into one inclusive term.` },
        { t: `{PT:Aspartate aminotransferase increased}`, k: 'req', n: `A second reported result.` },
        { t: `{PT:Hepatic function abnormal}`, k: 'wrong', n: `A disorder term; the reporter gave test results.` },
        { t: `{PT:Blood alkaline phosphatase increased}`, k: 'req', n: `A third reported result.` },
        { t: `{PT:Liver function test increased}`, k: 'wrong', n: `An inclusive term that bundles three specific results.` },
      ],
      explain: `Results are not bundled into one inclusive term; each is coded separately. These PTs sit in {SOC:Investigations}, which is not multiaxial, so they never appear in a disorder SOC display.`,
      alts: `None.`,
    },
    {
      id: 'inv5', topic: 'inv', type: 'single', ref: 'Exercise 4.1', ptc: '3.14 and 3.13', title: '“Hb dropped, transfused 2 units”',
      scenario: `Product A trial, CRF AE line: <q>Hb dropped, transfused 2 units.</q> No values are given.`,
      prompt: `Which term or terms would you select?`,
      options: [
        { t: `{PT:Haemoglobin decreased} + {PT:Transfusion}`, k: 'wrong', n: `The transfusion treats the event; it belongs in the procedures or concomitant therapy record.` },
        { t: `{PT:Anaemia}`, k: 'wrong', n: `A condition the investigator did not name (added diagnosis).` },
        { t: `{PT:Haemoglobin decreased}`, k: 'req', n: `A result with a direction but no value.` },
        { t: `{PT:Transfusion}`, k: 'wrong', n: `A procedure term is selected when only a procedure is reported; here a result is reported.` },
      ],
      explain: `“Hb dropped” reports a result with a direction, so {PT:Haemoglobin decreased} is supported. Query the haemoglobin values before and after, the reason for the drop, and whether the investigator considers this anaemia.`,
      alts: `If the investigator replies “anaemia”, code {PT:Anaemia}; whether the result term is kept alongside depends on whether the values are consistent with the diagnosis (Chapter 5).`,
    },
    {
      id: 'inv6', topic: 'inv', type: 'error', ref: 'Chapter 7 (text) and Figure 7.2', ptc: '3.14', title: '“LFTs raised” in the synonym list',
      scenario: `An automated coder’s synonym list maps every verbatim <q>LFTs raised</q> the same way. No values or diagnosis accompany these verbatims.`,
      coded: `{PT:Hepatic function abnormal}, a disorder term in {SOC:Hepatobiliary disorders}`,
      prompt: `What kind of coding error is this?`,
      answer: 'category', altAnswer: ['process'],
      explain: `A disorder term was used for a test result. The correct choice, {PT:Liver function test increased}, sits in {SOC:Investigations}. Each such case is missing from a review based on {HLGT:Hepatobiliary investigations} and appears instead among hepatic disorders, where it overstates what was reported.`,
      alts: `Process is also arguable, because the error recurs through the synonym list. Fix the synonym list and the convention, then make a documented retrospective correction with an impact assessment.`,
    },

    /* ---------- Provisional diagnosis ---------- */
    {
      id: 'pr1', topic: 'prov', type: 'multi', ref: 'Case 4.1', ptc: '3.1', title: 'Index case telephone report',
      scenario: `PA-301-0147, site to sponsor safety, Day 71: <q>Pt called with yellow eyes and dark urine. LFTs very high. ? hepatitis. Study drug being held.</q>`,
      prompt: `Select all terms you would code as events.`,
      options: [
        { t: `{LLT:Eyes yellow} → {PT:Ocular icterus}`, k: 'req', n: `Matches the words and the site.` },
        { t: `{LLT:Jaundice} → {PT:Jaundice}`, k: 'wrong', n: `Adds skin yellowing that nobody reported.` },
        { t: `{LLT:Hepatitis} → {PT:Hepatitis}`, k: 'req', missOk: true, n: `The provisional diagnosis, coded with its signs under the PtC preferred option.` },
        { t: `{LLT:Dark urine} → {PT:Chromaturia}`, k: 'req', n: `Matches the words; its primary SOC is {SOC:Renal and urinary disorders}, which is correct for the term.` },
        { t: `{LLT:Hepatic failure} → {PT:Hepatic failure}`, k: 'wrong', n: `Adds severity; INR 1.2 and no encephalopathy.` },
        { t: `{LLT:Liver function test increased} → {PT:Liver function test increased}`, k: 'req', missOk: true, n: `The author’s recommendation for “LFTs very high”: it keeps the direction and stays true if the diagnosis changes.` },
        { t: `{LLT:Drug-induced liver injury} → {PT:Drug-induced liver injury}`, k: 'wrong', n: `Adds a cause; not yet diagnosed.` },
      ],
      explain: `For a provisional diagnosis, the PtC preferred option is the provisional diagnosis plus its signs and symptoms, because the diagnosis may change and the signs will not. “Study drug being held” is an action taken, recorded in its own field.`,
      alts: `Omitting {PT:Liver function test increased} (treating the result as consistent with the provisional diagnosis) is defensible. The PtC alternative for a provisional diagnosis codes the signs only, leaving “? hepatitis” to the verbatim and narrative.`,
    },
    {
      id: 'pr2', topic: 'prov', type: 'multi', ref: 'Example 5.2', ptc: '3.1', title: '“? pulmonary embolism”: initial report',
      scenario: `Emergency department report for a fictional oral contraceptive: <q>Breathless, sharp chest pain on breathing in. ? pulmonary embolism. CT pulmonary angiogram requested.</q>`,
      prompt: `Select all terms for the initial report.`,
      options: [
        { t: `{PT:Dyspnoea}`, k: 'req', n: `A reported symptom.` },
        { t: `{PT:Musculoskeletal chest pain}`, k: 'wrong', n: `Adds a cause for the pain that nobody reported.` },
        { t: `{PT:Pulmonary embolism}`, k: 'req', missOk: true, n: `The provisional diagnosis (“?”), coded with its signs under the preferred option.` },
        { t: `{PT:Chest pain}`, k: 'alt', g: 'cp', n: `An acceptable, less specific alternative.` },
        { t: `{PT:Pleuritic pain}`, k: 'req', g: 'cp', n: `“Sharp chest pain on breathing in” describes pleuritic pain.` },
      ],
      explain: `Provisional diagnosis plus signs and symptoms: {PT:Pulmonary embolism}, {PT:Dyspnoea} and {PT:Pleuritic pain}. The requested scan is a plan, not an event.`,
      alts: `{PT:Chest pain} for the pain. Under the PtC alternative for provisional diagnoses (symptoms only), the embolism term would never enter the data.`,
    },
    {
      id: 'pr3', topic: 'prov', type: 'single', ref: 'Example 5.2', ptc: '3.1', title: '“? pulmonary embolism”: follow-up',
      scenario: `Same report. Follow-up two days later: <q>CTPA negative, no PE. No other diagnosis made. Symptoms settled over 48 hours.</q> Initial coding: {PT:Pulmonary embolism}, {PT:Dyspnoea}, {PT:Pleuritic pain}.`,
      prompt: `What should the coded record hold after the follow-up?`,
      options: [
        { t: `No terms: the diagnosis was ruled out, so there is no event`, k: 'wrong', n: `The symptoms were reported and remain true; removing them loses the illness.` },
        { t: `{PT:Pulmonary embolism}, {PT:Dyspnoea} and {PT:Pleuritic pain}, unchanged`, k: 'wrong', n: `Keeps a diagnosis that follow-up ruled out.` },
        { t: `{PT:Dyspnoea} and {PT:Pleuritic pain}, with the removal logged`, k: 'req', n: `Remove the ruled-out diagnosis; the symptoms stay; record previous term, reason, source, date and person.` },
      ],
      explain: `When a provisional diagnosis is ruled out and nothing replaces it, the signs and symptoms remain as the coded record. The negative scan is not coded. A thromboembolism review run before the update would retrieve the case and one run after would not; the audit trail explains the difference.`,
      alts: `None.`,
    },
    {
      id: 'pr4', topic: 'prov', type: 'single', ref: 'Case 5.2', ptc: '3.1 and 3.14', title: 'From “? hepatitis” to DILI',
      scenario: `PA-301-0147. Day 71 telephone report: <q>? hepatitis</q> (coded {PT:Hepatitis}). Day 73 hepatologist: <q>drug-induced liver injury, hepatocellular pattern</q>; the investigator updates the CRF AE term. Separate CRF lines for fatigue, nausea, yellow eyes and dark urine; a sponsor query asking whether they are part of the diagnosis is open.`,
      prompt: `How should the coded record change?`,
      options: [
        { t: `Add {PT:Drug-induced liver injury} and keep {PT:Hepatitis}`, k: 'wrong', n: `Two diagnoses for one illness: {HLGT:Hepatic and hepatobiliary disorders} would show 5 events, not 4.` },
        { t: `Replace {PT:Hepatitis} with {PT:Drug-induced liver injury} and delete the four symptom lines`, k: 'wrong', n: `Only the site can retire investigator-entered AE records, usually after a sponsor query.` },
        { t: `Replace {PT:Hepatitis} with {PT:Drug-induced liver injury}; the symptom lines stay while the query is open`, k: 'req', n: `Replace, do not accumulate; log the recode with source and date.` },
        { t: `Replace the diagnosis and add {PT:Alanine aminotransferase increased} and the other liver test results`, k: 'wrong', n: `The results are consistent with the diagnosis; adding them makes the ALT count 11 rather than 10 and mixes conventions.` },
      ],
      explain: `{PT:Hepatitis} is replaced, not retained. {PT:Drug-induced liver injury} records the hepatologist’s diagnosis, including its attribution; it is not the sponsor’s causality assessment. After the update {HLGT:Hepatic and hepatobiliary disorders} shows 3 Product A patients with 4 events.`,
      alts: `None for the diagnosis line. The symptom lines ({PT:Fatigue}, {PT:Nausea}, {PT:Ocular icterus}, {PT:Chromaturia}) stay until the site answers.`,
    },
    {
      id: 'pr5', topic: 'prov', type: 'multi', ref: 'Exercise 20.1', ptc: '3.1 and 3.2', title: '“Query MI, troponin pending”',
      scenario: `Spontaneous report from a hospital pharmacist: <q>Admitted with chest pain, query MI, troponin pending.</q> The coding tool proposes {PT:Myocardial infarction} with a score of 0.97.`,
      prompt: `Select all terms you would record as events.`,
      options: [
        { t: `{PT:Chest pain}`, k: 'req', missOk: true, n: `The reported sign, kept with the provisional diagnosis.` },
        { t: `An event term for the hospital admission`, k: 'wrong', n: `Admission is a seriousness criterion recorded in the outcome fields.` },
        { t: `{PT:Myocardial infarction}`, k: 'req', n: `The provisional diagnosis (“query MI”).` },
        { t: `{PT:Musculoskeletal chest pain}`, k: 'wrong', n: `Adds a cause nobody reported.` },
      ],
      explain: `“Query MI” is a provisional diagnosis: code it with its signs, {PT:Myocardial infarction} and {PT:Chest pain}. Accepting the tool’s single term would silently turn a provisional diagnosis into what looks like a confirmed one. The 0.97 reflects textual similarity, not whether the patient had an infarction. Log the action as “modified: provisional diagnosis plus signs per convention”.`,
      alts: `An organization whose convention codes the provisional diagnosis alone could record {PT:Myocardial infarction} only, but if follow-up excludes infarction the chest pain is lost unless the case is recoded.`,
    },

    /* ---------- Medication errors ---------- */
    {
      id: 'me1', topic: 'me', type: 'multi', ref: 'Case 6.1', ptc: '3.15 and 3.18', title: 'Product C: 16 units instead of 6',
      scenario: `General practitioner report (PC-0031): <q>78-year-old man with type 2 diabetes on basal insulin and Product C 6 units with meals. His daughter gave 16 units instead of 6 at lunch; she says she misread the pen dose window without her glasses. About 90 minutes later he was sweaty and confused. Paramedics found capillary glucose 2.4 mmol/L (43 mg/dL), recorded hypoglycaemia, gave IV glucose. Recovered within the hour.</q>`,
      prompt: `Select all terms you would code.`,
      options: [
        { t: `{PT:Blood glucose decreased}`, k: 'wrong', n: `The paramedics recorded hypoglycaemia; a result consistent with the diagnosis is not coded separately.` },
        { t: `{PT:Incorrect dose administered}`, k: 'req', n: `The circumstance: an error that reached the patient.` },
        { t: `{PT:Accidental overdose}`, k: 'alt', n: `Not the first choice: overdose is more than the maximum recommended dose, and insulin is individually titrated. Defensible only under a written convention.` },
        { t: `{PT:Hypoglycaemia}`, k: 'req', n: `The consequence, diagnosed with value and typical symptoms.` },
        { t: `{PT:Hyperhidrosis}`, k: 'alt', n: `Added only under the PtC alternative option (diagnosis plus signs and symptoms).` },
        { t: `{PT:Confusional state}`, k: 'alt', n: `Added only under the PtC alternative option.` },
      ],
      explain: `Code both layers: the error for medication-safety review and the consequence for AE tables and the hypoglycaemia query. Sweating and confusion are characteristic of hypoglycaemia and are not coded separately under the preferred option.`,
      alts: `{PT:Hyperhidrosis} and {PT:Confusional state} under the PtC alternative; {PT:Accidental overdose} under a written convention applied to every insulin report. A contributing-factor term may be added if your conventions capture contributing factors.`,
    },
    {
      id: 'me2', topic: 'me', type: 'single', ref: 'Case 6.2', ptc: '3.15', title: 'Product C: “6.0 units” caught at dispensing',
      scenario: `Hospital pharmacist report (PC-0047): <q>Discharge prescription read ‘Product C 6.0 units with meals’. Checking before dispensing, I was concerned the decimal could be read as 60 units. Prescriber contacted; prescription rewritten as 6 units. Nothing was dispensed incorrectly; patient not exposed to the wrong dose.</q>`,
      prompt: `Which term records this report?`,
      options: [
        { t: `{PT:Intercepted product dispensing error}`, k: 'wrong', n: `Names the stage where the error was caught, not where it occurred.` },
        { t: `{PT:Incorrect dose administered}`, k: 'wrong', n: `Claims an exposure that never happened.` },
        { t: `{PT:Intercepted product prescribing error}`, k: 'req', n: `The error occurred at prescribing and was intercepted.` },
        { t: `{PT:Circumstance or information capable of leading to medication error}`, k: 'wrong', n: `For a potential error; here an error was actually made.` },
      ],
      explain: `An intercepted-error term reflects the stage at which the error occurred, even though it was detected at the dispensing check. No event term is selected; the case is found only by medication-error queries.`,
      alts: `None. In the EU, medication errors without a suspected adverse reaction are not submitted as ICSRs but are considered in periodic safety reporting (GVP Module VI).`,
    },
    {
      id: 'me3', topic: 'me', type: 'single', ref: 'Example 6.1', ptc: '3.15', title: 'Missed doses: in error or by choice?',
      scenario: `Two Product A reports, neither with any symptom. Report 1: a patient <q>forgot to take Product A for three days while travelling</q>. Report 2: a patient <q>stopped Product A for two days before a tooth extraction, as her dentist advised</q>.`,
      prompt: `Which coding is correct?`,
      options: [
        { t: `Report 1: no term. Report 2: {LLT:Product dose omission in error}`, k: 'wrong', n: `Reverses the definition: forgetting is the error; the planned interruption is not.` },
        { t: `Both reports: {LLT:Product dose omission in error}`, k: 'wrong', n: `Intentional omission on professional advice is not a medication error.` },
        { t: `Report 1: {LLT:Product dose omission in error} alone. Report 2: no medication-error term; record the interruption in the dosage fields`, k: 'req', n: `Unintentional and preventable versus deliberate.` },
        { t: `Report 1: {LLT:Product dose omission in error} + {PT:Drug ineffective}`, k: 'wrong', n: `No event and no lack of effect was reported.` },
      ],
      explain: `A medication error is unintentional and preventable. Forgetting qualifies; a deliberate interruption on a dentist’s advice does not. Without a clinical consequence, the error term alone is the preferred option.`,
      alts: `If your conventions capture deliberate interruptions as terms, use one without the “in error” sense for Report 2.`,
    },
    {
      id: 'me4', topic: 'me', type: 'multi', ref: 'Exercise 6.1', ptc: '3.14 and 3.15', title: 'A mealtime dose given twice',
      scenario: `A nurse reports: <q>Patient on Product C was given her mealtime dose, then the next nurse on shift, not seeing it charted, gave it again. Glucose 3.1 mmol/L an hour later, treated with oral glucose, no symptoms.</q>`,
      prompt: `Select all terms you would code.`,
      options: [
        { t: `{PT:Hypoglycaemia}`, k: 'wrong', n: `The nurse reported a value without symptoms and named no condition.` },
        { t: `{PT:Extra dose administered}`, k: 'req', g: 'err', n: `Describes the error most specifically.` },
        { t: `{PT:Blood glucose decreased}`, k: 'req', n: `Fits the reported words: a value, no diagnosis.` },
        { t: `{PT:Incorrect dose administered}`, k: 'alt', g: 'err', n: `A less specific alternative.` },
        { t: `{PT:Accidental overdose}`, k: 'alt', n: `Some organizations treat a duplicated full dose as accidental overdose; others reserve overdose for doses above the maximum recommended dose.` },
      ],
      explain: `The second dose is an unintentional, preventable administration error that reached the patient; the consequence is a reported glucose value. The charting omission is a contributing factor if your conventions capture contributing factors.`,
      alts: `If the nurse writes “hypoglycaemia”, select {PT:Hypoglycaemia}. {PT:Incorrect dose administered} for the error; {PT:Accidental overdose} under a written convention.`,
    },

    /* ---------- Overdose / misuse ---------- */
    {
      id: 'od1', topic: 'od', type: 'single', ref: 'Chapter 6 (text), “Overdose, misuse, abuse and off-label use”', ptc: '3.18 and 3.3', title: '“Took 30 of his sleeping tablets”',
      scenario: `A report states that a man <q>took 30 of his sleeping tablets</q>. No intent is stated, and no consequence is reported.`,
      prompt: `Which term should be selected?`,
      options: [
        { t: `{PT:Intentional overdose}`, k: 'wrong', n: `Assumes intent from the quantity; that is inference.` },
        { t: `{PT:Overdose}`, k: 'req', n: `The term for an overdose when intent is unknown.` },
        { t: `{PT:Accidental overdose}`, k: 'wrong', n: `Also assumes an intent the report does not state.` },
        { t: `{PT:Overdose} + {PT:Incorrect dose administered}`, k: 'wrong', n: `No medication error was reported; do not infer one.` },
      ],
      explain: `Overdose is more than the maximum recommended dose. When intent is unknown, select {PT:Overdose}; without consequences the overdose term alone is preferred. An overdose is not assumed to be a suicide attempt (section 3.3).`,
      alts: `None until intent is known. Ask the reporter directly before the case is closed: the answer decides whether it belongs with accidental or intentional overdoses.`,
    },
    {
      id: 'od2', topic: 'od', type: 'error', ref: 'Figure 6.3 and Chapter 7 error classes', ptc: '3.16', title: 'Misuse with an extra error term',
      scenario: `A patient tells his pharmacist that, on purpose and against his prescriber’s instructions, he has been injecting his Product C at bedtime instead of with meals, believing it controls his morning sugars better. No adverse event is reported.`,
      coded: `{PT:Intentional product misuse} + {PT:Wrong technique in product usage process}`,
      prompt: `What kind of coding error is this?`,
      answer: 'category',
      explain: `The use was intended and its purpose therapeutic, but it departs from the prescription: misuse, coded {PT:Intentional product misuse}. Medication-error terms describe unintentional, preventable events; adding one to the same intentional act is a category error (Figure 6.3: intentional branches never also get medication-error terms).`,
      alts: `None. Without a consequence, the misuse term alone records the circumstance.`,
    },

    /* ---------- Off-label use ---------- */
    {
      id: 'ol1', topic: 'ol', type: 'multi', ref: 'Example 6.2', ptc: '3.27 and 3.16', title: 'Psoriatic arthritis and herpes zoster',
      scenario: `A rheumatologist reports that she prescribed Product A 200 mg once daily (the authorized dose) for a 44-year-old man with psoriatic arthritis, an indication for which Product A is not authorized. Six weeks later he developed herpes zoster on the left chest wall, treated with an oral antiviral.`,
      prompt: `Select all terms you would code as reaction/event terms.`,
      options: [
        { t: `{PT:Herpes zoster}`, k: 'req', n: `The event.` },
        { t: `{PT:Intentional product misuse}`, k: 'wrong', n: `The use follows a prescriber’s decision; the patient did not depart from a prescription.` },
        { t: `{PT:Off label use}`, k: 'req', n: `Use outside the authorized indication.` },
        { t: `{PT:Psoriatic arthropathy} as an event`, k: 'wrong', n: `The indication is coded in the indication field, not as a reaction.` },
        { t: `{PT:Incorrect dose administered}`, k: 'wrong', n: `Nothing was unintended; the dose was the authorized dose.` },
      ],
      explain: `Rule out a medication error first, then misuse. The prescriber chose product and indication deliberately, so this is off-label use: {PT:Off label use} and {PT:Herpes zoster} as reaction terms, with {PT:Psoriatic arthropathy} in the indication field.`,
      alts: `None. Had the rheumatologist selected Product A by mistake, the case would carry a medication-error term instead.`,
    },
    {
      id: 'ol2', topic: 'ol', type: 'single', ref: 'Chapter 6 (text), “Overdose, misuse, abuse and off-label use”', ptc: '3.27', title: 'A 15-year-old with juvenile idiopathic arthritis',
      scenario: `A 15-year-old with juvenile idiopathic arthritis is prescribed Product A, which is authorized for adults with rheumatoid arthritis. The report describes the prescription; no event is reported.`,
      prompt: `How is the exposure circumstance classified and coded?`,
      options: [
        { t: `A medication error`, k: 'wrong', n: `Nothing was unintended; the prescriber chose the product deliberately.` },
        { t: `{PT:Drug use for unknown indication}`, k: 'wrong', n: `The indication was reported.` },
        { t: `Off-label use: {PT:Off label use}, with the indication coded in the indication field`, k: 'req', n: `Intentional use outside the authorized age group and indication.` },
        { t: `{PT:Intentional product misuse}`, k: 'wrong', n: `The use follows a prescriber’s decision.` },
      ],
      explain: `Off-label use is intentional use outside the authorized product information, for example in an unapproved indication or age group. Rule out a medication error first: a pharmacist dispensing Product A instead of a similarly named product would be a medication error, not off-label use.`,
      alts: `None.`,
    },

    /* ---------- Pregnancy ---------- */
    {
      id: 'pg1', topic: 'preg', type: 'single', ref: 'Chapter 6 (text) and Table 6.1', ptc: '3.10', title: 'Pregnancy on Product A, no event',
      scenario: `A woman taking Product A for rheumatoid arthritis reports that she is pregnant. She feels well; no event in the mother or the pregnancy is reported.`,
      prompt: `Which coding follows the Term Selection PtC preferred option?`,
      options: [
        { t: `No term: nothing has gone wrong`, k: 'wrong', n: `The exposure is the circumstance to record, and for Product A use in pregnancy is missing information in the risk management plan.` },
        { t: `{PT:Maternal exposure during pregnancy} alone`, k: 'req', n: `Without a consequence, the exposure term alone is preferred.` },
        { t: `{PT:Intentional product misuse}`, k: 'wrong', n: `Pregnancy exposure is not misuse; nothing departs from a prescription.` },
      ],
      explain: `Exposure during pregnancy is coded with an exposure term, together with any event in the mother or the child; when no consequence is reported the exposure term alone is preferred. Follow every Product A pregnancy report to outcome, with dates set for delivery outcome and the infant’s early health.`,
      alts: `If an event is later reported in the mother or the child, add the event terms to the exposure term (Table 6.1).`,
    },

    /* ---------- Product quality ---------- */
    {
      id: 'pq1', topic: 'pq', type: 'multi', ref: 'Case 6.3', ptc: '3.28, 3.14 and 3.23', title: 'Product C: a jammed pen',
      scenario: `Patient report (PC-0058): <q>The dose button on my Product C pen stuck halfway and wouldn’t go down, so I didn’t get my dinner dose. Sugar was 19.4 two hours later (349 mg/dL). Used a new pen and it came down overnight.</q> The manufacturer’s complaint investigation of the returned pen confirmed a defect in the dose mechanism.`,
      prompt: `Select all terms you would code.`,
      options: [
        { t: `{PT:Drug ineffective}`, k: 'wrong', n: `Infers lack of effect when the product was never delivered.` },
        { t: `{PT:Device malfunction}`, k: 'req', n: `The circumstance, from {SOC:Product issues}.` },
        { t: `{LLT:Product dose omission in error}`, k: 'wrong', n: `Misclassifies a device failure as a medication error.` },
        { t: `{PT:Blood glucose increased}`, k: 'req', n: `The reported value; no condition was named.` },
        { t: `{PT:Hyperglycaemia}`, k: 'wrong', n: `Correct only if the reporter had named the condition.` },
        { t: `{PT:Product quality issue}`, k: 'wrong', n: `The general term is used only when nothing more specific is reported.` },
      ],
      explain: `A confirmed device defect with a clinical consequence: code the quality issue and the event. The device constituent usually also needs device problem coding outside MedDRA for device reporting obligations (section 3.19).`,
      alts: `Whether to record the missed dose with a dose omission term without the “in error” sense is an organization-specific convention. Had the needle never been attached, the circumstance would be a medication error such as {PT:Wrong technique in product usage process}.`,
    },
    {
      id: 'pq2', topic: 'pq', type: 'single', ref: 'Chapter 6 (text), “Pregnancy exposure, lack of efficacy and product quality”', ptc: '3.28', title: 'Wrong labels: pharmacy or shipment?',
      scenario: `Two reports concern wrong labels. Report 1: a wrong label was attached by a pharmacist. Report 2: wrong labels were found on packs in a manufacturer’s shipment.`,
      prompt: `How are the two circumstances classified?`,
      options: [
        { t: `Both are product quality issues`, k: 'wrong', n: `Report 1 originated in the medication-use process.` },
        { t: `Report 1: medication error. Report 2: product quality issue`, k: 'req', n: `The PtC distinguishes them by origin.` },
        { t: `Report 1: product quality issue. Report 2: medication error`, k: 'wrong', n: `Reversed.` },
        { t: `Both are medication errors`, k: 'wrong', n: `Report 2 originated in manufacturing.` },
      ],
      explain: `Origin decides the category: a wrong label attached by a pharmacist is a medication error; wrong labels found in a manufacturer’s shipment are a quality issue, navigated from {SOC:Product issues}.`,
      alts: `None.`,
    },

    /* ---------- Lack of effect ---------- */
    {
      id: 'le1', topic: 'loe', type: 'single', ref: 'Example 6.3 (Report 1)', ptc: '3.23 and 3.14', title: 'High sugars after a holiday dinner',
      scenario: `Product C patient report: <q>My sugars were 15 to 18 after a big holiday dinner and for the next two days. I ate far more than usual.</q> Values in mmol/L (270–324 mg/dL). No symptoms or pen problem mentioned.`,
      prompt: `Which coding is correct?`,
      options: [
        { t: `{PT:Drug ineffective}`, k: 'wrong', n: `Infers lack of effect the reporter did not state.` },
        { t: `{PT:Blood glucose increased}`, k: 'req', n: `Codes the reported result.` },
        { t: `{PT:Hyperglycaemia}`, k: 'wrong', n: `A condition the reporter did not name.` },
        { t: `{PT:Drug ineffective} + {PT:Blood glucose increased}`, k: 'wrong', n: `Still infers lack of effect.` },
      ],
      explain: `The report gives high values and an explanation, a large meal, but does not say the product failed. Lack of effect is not inferred from an outcome the reporter did not attribute to it.`,
      alts: `None. Lack-of-effect counts should hold reports in which someone said the product failed.`,
    },
    {
      id: 'le2', topic: 'loe', type: 'single', ref: 'Example 6.3 (Report 2)', ptc: '3.23', title: '“Product C isn’t working any more”',
      scenario: `Product C patient report: <q>Product C isn’t working any more. Same doses, same food, and my sugars are 15 to 18 after meals all week.</q> No symptoms or pen problem mentioned.`,
      prompt: `Which coding follows the PtC preferred option?`,
      options: [
        { t: `{PT:Drug ineffective} + {PT:Blood glucose increased}`, k: 'alt', n: `The PtC alternative adds the consequence.` },
        { t: `{PT:Blood glucose increased}`, k: 'wrong', n: `Loses the reporter’s statement that the product failed.` },
        { t: `{PT:Product storage error}`, k: 'wrong', n: `Not reported; added only if follow-up finds, for example, a pen left in a hot car.` },
        { t: `{PT:Drug ineffective}`, k: 'req', n: `The preferred option is the lack-of-effect term only, even with consequences.` },
      ],
      explain: `The reporter states the product is not working, so a lack-of-effect term is coded. Lack of effect is the one special situation where the PtC prefers the circumstance term alone even when consequences are reported. Follow up storage, injection technique and batch number.`,
      alts: `{PT:Drug ineffective} plus {PT:Blood glucose increased} under the PtC alternative option.`,
    },

    /* ---------- Death / outcomes ---------- */
    {
      id: 'ou1', topic: 'out', type: 'multi', ref: 'Example 4.3', ptc: '3.2 and 3.13', title: 'A fall, stitches and an overnight stay',
      scenario: `Product A trial, CRF AE line: <q>Fell in bathroom at night, cut forehead, 4 stitches in ED, CT head normal, kept in overnight for observation. Study drug continued.</q>`,
      prompt: `Select all concepts that receive AE terms.`,
      options: [
        { t: `{PT:Syncope}`, k: 'wrong', n: `Adds a cause for the fall that nobody reported; query the circumstances.` },
        { t: `{PT:Fall}`, k: 'req', n: `A reported event.` },
        { t: `A procedure term for the 4 stitches`, k: 'wrong', n: `The stitches treat a reported event; they are not reported in place of a diagnosis.` },
        { t: `{PT:Skin laceration}`, k: 'req', g: 'cut', n: `The cut, choosing the LLT beneath it that best names the wound.` },
        { t: `An event term for the overnight stay`, k: 'wrong', n: `An outcome and possible seriousness criterion, recorded in its own fields.` },
        { t: `{PT:Head injury}`, k: 'alt', g: 'cut', n: `Some organizations accept it for the cut; it implies more than a skin wound and needs a written convention.` },
        { t: `{PT:Dizziness}`, k: 'wrong', n: `Not reported; do not infer a cause.` },
      ],
      explain: `Classify each concept first: fall and cut are events; the stitches are a procedure treating the cut; the normal CT is a test result for the test record; the overnight stay is an outcome; “continued” is the action taken. Only the two events receive AE terms.`,
      alts: `{PT:Head injury} for the cut under a written convention.`,
    },
    {
      id: 'ou2', topic: 'out', type: 'multi', ref: 'Case 9.2', ptc: '3.18, 3.2 and 3.3', title: 'Fatal paracetamol overdose',
      scenario: `Hospital physician report (PM-0655): <q>Patient on [Product A] for RA admitted after taking an intentional overdose of paracetamol tablets. Paracetamol level 210 mg/L at 8 hours. Developed liver failure and died.</q>`,
      prompt: `Select all terms you would code as events.`,
      options: [
        { t: `{PT:Hepatic failure}`, k: 'req', n: `The reported event.` },
        { t: `An event term for the death`, k: 'wrong', n: `Death is recorded as the outcome rather than as an event term (section 3.2).` },
        { t: `{PT:Overdose}`, k: 'wrong', n: `For unknown intent; here the intent was stated.` },
        { t: `{PT:Intentional overdose}`, k: 'req', n: `Intent was stated by the reporter.` },
        { t: `A suicide or self-harm term`, k: 'wrong', n: `Not added unless the reporter states it; an overdose is not assumed to be a suicide attempt (section 3.3).` },
        { t: `{PT:Incorrect dose administered}`, k: 'wrong', n: `A medication-error term for an intentional act.` },
      ],
      explain: `{PT:Intentional overdose} and {PT:Hepatic failure} describe what was reported. Death goes to the outcome field. The case is retrieved by {SMQ:Drug related hepatic disorders - comprehensive search}; the query name says nothing about whether Product A caused it, and the adjudicated classification is an alternative cause (paracetamol overdose).`,
      alts: `None. Death terms that add clinical information may be selected when reported; none was here.`,
    },
  ];

  // error-type drills get the shared option list
  DRILLS.forEach((d) => {
    if (d.type !== 'error') return;
    d.options = ERR.concat([ERR_NONE]).map((e) => ({
      t: '<strong>' + e.name + '</strong> — ' + e.def,
      k: e.id === d.answer ? 'req' : (d.altAnswer || []).includes(e.id) ? 'alt' : 'wrong',
      eid: e.id,
    }));
  });
  WB.codingDrills = DRILLS; // exposed for tests and for other modules

  /** Grade a drill: returns 1, 0.5 or 0. picked = array of option indices. */
  function grade(d, picked) {
    if (d.type === 'multi') {
      let fail = false, partial = false;
      d.options.forEach((o, i) => {
        const sel = picked.includes(i);
        if (o.k === 'wrong' && sel) fail = true;
        if (o.k === 'alt' && sel) partial = true;
        if (o.k === 'req' && !sel) {
          const covered = o.g && d.options.some((p, j) => p.k === 'alt' && p.g === o.g && picked.includes(j));
          if (covered || o.missOk) partial = true; else fail = true;
        }
      });
      return fail ? 0 : partial ? 0.5 : 1;
    }
    const o = d.options[picked[0]];
    return !o ? 0 : o.k === 'req' ? 1 : o.k === 'alt' ? 0.5 : 0;
  }
  WB.codingGrade = grade;

  const TKEY = 'coding-trainer-v1';
  function loadState() {
    const s = WB.store.getJSON(TKEY, null) || {};
    return { answers: s.answers || {}, order: Array.isArray(s.order) ? s.order : null, topic: s.topic || 'all', cur: s.cur || null, missed: Array.isArray(s.missed) ? s.missed : null };
  }

  function renderTrainer(root) {
    injectCSS();
    root.classList.add('cx-scope'); // keep wide tables from widening the page grid at phone width
    let st = loadState();
    const save = () => WB.store.setJSON(TKEY, st);
    let resetArmed = false;
    let pendingMulti = {}; // id -> Set of indices (unchecked answer in progress)

    const intro = h('div', { class: 'panel' }, [
      h('h2', {}, 'How to use'),
      h('p', {}, 'Each drill is one of the book’s own cases, solved examples or exercises from Chapters 3 to 7, 9 and 20. Read the verbatim and its context, then choose the best term, select every term you would code, or name the error in a coding someone else chose. After each answer you see why, the acceptable alternatives, the Term Selection Points to Consider (PtC) section and the book reference. An amber “defensible alternative” earns half credit: the book accepts it only under a written convention. Filter by topic, shuffle the order, or review the drills you missed. Your progress is saved in this browser only.'),
    ]);
    const controls = h('div', { class: 'panel no-print' });
    const status = h('div', { class: 'panel', 'aria-live': 'polite' });
    const card = h('div');
    const byTopic = h('div');
    const interp = WB.callout('', 'Interpretation', 'Answers follow the Term Selection PtC preferred options as the book applies them. A coded term records what the reporter said: it does not confirm a diagnosis, and it is not a causality assessment. Where the PtC offers a preferred option and an alternative, either is defensible only if your organization writes the choice into its coding conventions and applies it consistently, because conventions change counts and what a later search can find (Chapter 5).');
    const book = WB.note('Book link: Chapters 3–6 (term selection, diagnoses and investigations, special situations); error classes from Chapter 7, Figure 7.2. Term names are the book’s illustrative examples, not MedDRA content; check them against the licensed MedDRA version you use.');
    root.append(intro, controls, status, card, byTopic, interp, book);

    function baseOrder() { return st.order && st.order.length === DRILLS.length ? st.order : DRILLS.map((d) => d.id); }
    function currentList() {
      let ids = baseOrder();
      if (st.missed) ids = ids.filter((id) => st.missed.includes(id));
      if (st.topic !== 'all') ids = ids.filter((id) => DRILLS.find((d) => d.id === id).topic === st.topic);
      return ids.map((id) => DRILLS.find((d) => d.id === id));
    }
    function shuffledIds() {
      const a = DRILLS.map((d) => d.id);
      for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
      return a;
    }

    function renderControls() {
      controls.innerHTML = '';
      const sel = h('select', { id: 'cx-topic' }, [h('option', { value: 'all' }, `All topics (${DRILLS.length})`)].concat(TOPICS.map((t) => h('option', { value: t.id }, `${t.label} (${DRILLS.filter((d) => d.topic === t.id).length})`))));
      sel.value = st.topic;
      sel.addEventListener('change', () => { st.topic = sel.value; st.cur = null; save(); renderAll(); });
      const missedCount = DRILLS.filter((d) => st.answers[d.id] && st.answers[d.id].score < 1).length;
      const shuffled = !!(st.order && st.order.join() !== DRILLS.map((d) => d.id).join());
      controls.appendChild(h('div', { class: 'cx-controls' }, [
        h('div', { class: 'field' }, [h('label', { for: 'cx-topic' }, 'Filter by topic'), sel]),
        h('div', { class: 'btn-row', style: 'margin:0' }, [
          h('button', { class: 'btn', id: 'cx-shuffle', onclick: () => { st.order = shuffled ? null : shuffledIds(); st.cur = null; save(); renderAll(); } }, shuffled ? 'Restore book order' : 'Shuffle drills'),
          st.missed
            ? h('button', { class: 'btn', id: 'cx-missed', onclick: () => { st.missed = null; st.cur = null; save(); renderAll(); } }, 'Show all drills')
            : h('button', { class: 'btn', id: 'cx-missed', disabled: missedCount ? null : true, 'aria-disabled': missedCount ? null : 'true', title: missedCount ? null : 'No missed drills yet', onclick: () => {
              const ids = DRILLS.filter((d) => st.answers[d.id] && st.answers[d.id].score < 1).map((d) => d.id);
              if (!ids.length) return;
              ids.forEach((id) => delete st.answers[id]);
              st.missed = ids; st.topic = 'all'; st.cur = null; save(); renderAll();
            } }, `Review missed drills (${missedCount})`),
          resetArmed
            ? h('span', { style: 'display:inline-flex;gap:8px;align-items:center;flex-wrap:wrap' }, [
              h('strong', {}, 'Clear all answers?'),
              h('button', { class: 'btn primary', id: 'cx-reset-confirm', onclick: () => { st = { answers: {}, order: null, topic: 'all', cur: null, missed: null }; resetArmed = false; pendingMulti = {}; save(); renderAll(); } }, 'Yes, reset'),
              h('button', { class: 'btn', onclick: () => { resetArmed = false; renderControls(); } }, 'Cancel'),
            ])
            : h('button', { class: 'btn', id: 'cx-reset', onclick: () => { resetArmed = true; renderControls(); const b = document.getElementById('cx-reset-confirm'); if (b) b.focus(); } }, 'Reset progress'),
        ]),
      ]));
      if (st.missed) controls.appendChild(WB.callout('warn', 'Reviewing missed drills', `You are re-attempting the ${st.missed.length} drill(s) you missed or answered with a partial-credit alternative. Your earlier answers on these drills were cleared so you can try them again.`));
    }

    function stats(list) {
      const ans = list.filter((d) => st.answers[d.id]);
      const pts = ans.reduce((s, d) => s + st.answers[d.id].score, 0);
      return { n: list.length, answered: ans.length, pts, full: ans.filter((d) => st.answers[d.id].score === 1).length, half: ans.filter((d) => st.answers[d.id].score === 0.5).length, zero: ans.filter((d) => st.answers[d.id].score === 0).length };
    }
    const fmtPts = (p) => (p % 1 ? WB.fmt(p, 1) : String(p));

    function renderStatus() {
      const list = currentList();
      const s = stats(list);
      const all = stats(DRILLS);
      status.innerHTML = '';
      const pctDone = s.n ? (100 * s.answered) / s.n : 0;
      status.append(
        h('h2', {}, st.missed ? 'Progress: missed-drill review' : st.topic === 'all' ? 'Progress: all drills' : 'Progress: ' + topicLabel(st.topic)),
        h('div', { class: 'result', style: 'margin-top:4px' }, [
          h('div', { class: 'stat' }, [h('div', { class: 'k' }, 'Answered'), h('div', { class: 'v', id: 'cx-answered' }, `${s.answered} / ${s.n}`), h('div', { class: 's' }, 'in this set')]),
          h('div', { class: 'stat' }, [h('div', { class: 'k' }, 'Score'), h('div', { class: 'v', id: 'cx-score' }, `${fmtPts(s.pts)} / ${s.answered}`), h('div', { class: 's' }, s.answered ? WB.pct(s.pts, s.answered) + ' of answered' : 'no answers yet')]),
          h('div', { class: 'stat' }, [h('div', { class: 'k' }, 'Breakdown'), h('div', { class: 'v', style: 'font-size:16px;padding-top:4px' }, `✓ ${s.full} · ≈ ${s.half} · ✗ ${s.zero}`), h('div', { class: 's' }, 'correct · partial · incorrect')]),
          h('div', { class: 'stat' }, [h('div', { class: 'k' }, 'Score, all 36 drills'), h('div', { class: 'v', id: 'cx-overall' }, `${fmtPts(all.pts)} / ${DRILLS.length}`), h('div', { class: 's' }, `${all.answered} answered overall`)]),
        ]),
        h('div', { class: 'progress', role: 'progressbar', 'aria-label': 'Drills answered in this set', 'aria-valuemin': '0', 'aria-valuemax': String(s.n), 'aria-valuenow': String(s.answered) }, h('div', { style: `width:${pctDone.toFixed(1)}%` })),
      );
      // navigator
      const nav = h('div', { class: 'cx-nav', role: 'list', 'aria-label': 'Drills in this set' });
      const cur = currentId(list);
      list.forEach((d, i) => {
        const a = st.answers[d.id];
        const cls = a ? (a.score === 1 ? 's1' : a.score === 0.5 ? 's05' : 's0') : '';
        const mark = a ? (a.score === 1 ? ' ✓' : a.score === 0.5 ? ' ≈' : ' ✗') : '';
        const state = a ? (a.score === 1 ? 'correct' : a.score === 0.5 ? 'partly correct' : 'incorrect') : 'not answered';
        nav.appendChild(h('div', { role: 'listitem' }, h('button', { class: cls, 'aria-current': d.id === cur ? 'true' : null, 'aria-label': `Drill ${i + 1}: ${d.title}, ${state}`, 'data-id': d.id, onclick: () => { st.cur = d.id; save(); renderAll(); focusCard(); } }, String(i + 1) + mark)));
      });
      status.appendChild(nav);
    }

    function currentId(list) {
      if (!list.length) return null;
      if (st.cur && list.some((d) => d.id === st.cur)) return st.cur;
      const firstOpen = list.find((d) => !st.answers[d.id]);
      return (firstOpen || list[0]).id;
    }

    function focusCard() { const t = document.getElementById('cx-card-title'); if (t) t.focus(); }

    function optionLabel(d, o) {
      if (d.type === 'error') return o.k === 'req' ? '✓ The error class' : o.k === 'alt' ? '≈ Also arguable' : '✗ Not the main error';
      if (d.type === 'single') return o.k === 'req' ? '✓ Best answer' : o.k === 'alt' ? '≈ Defensible alternative' : '✗ Not supported';
      if (o.k === 'req') return o.missOk ? '✓ Code (preferred; omitting it is defensible)' : '✓ Code';
      if (o.k === 'alt') return '≈ Defensible alternative';
      if (o.k === 'opt') return '○ Optional';
      return '✗ Do not code';
    }

    function renderCard() {
      card.innerHTML = '';
      const list = currentList();
      if (!list.length) { card.appendChild(h('div', { class: 'panel' }, h('p', {}, 'No drills in this set.'))); return; }
      const id = currentId(list);
      st.cur = id;
      const idx = list.findIndex((d) => d.id === id);
      const d = list[idx];
      const ans = st.answers[d.id];
      const art = h('article', { class: 'panel', id: 'cx-card', 'data-drill': d.id, 'aria-labelledby': 'cx-card-title' });
      art.appendChild(h('div', { class: 'cx-meta' }, [
        h('span', {}, `Drill ${idx + 1} of ${list.length}`),
        h('span', { class: 'pill' }, topicLabel(d.topic)),
        h('span', { class: 'pill D' }, TYPE_LABEL[d.type]),
      ]));
      art.appendChild(h('h2', { id: 'cx-card-title', tabindex: '-1' }, d.title));
      art.appendChild(h('div', { class: 'cx-verbatim', html: T(d.scenario) }));
      if (d.coded) art.appendChild(h('p', { html: '<strong>Coded as:</strong> ' + T(d.coded) }));
      art.appendChild(h('p', {}, h('strong', {}, d.prompt)));

      const optWrap = h('div', { role: d.type === 'multi' ? 'group' : null, 'aria-label': d.type === 'multi' ? 'Options' : null });
      const picked = ans ? ans.picked : [];
      d.options.forEach((o, i) => {
        const sel = picked.includes(i);
        let cls = 'choice';
        if (ans) {
          if (d.type === 'multi') {
            if (o.k === 'req') cls += ' correct';
            else if (o.k === 'alt' || o.k === 'opt') cls += ' partial';
            else if (sel) cls += ' wrong';
          } else {
            if (o.k === 'req') cls += ' correct';
            else if (o.k === 'alt') cls += ' partial';
            else if (sel) cls += ' wrong';
          }
        }
        const fb = ans ? [
          h('span', { class: 'cx-tag' }, optionLabel(d, o) + (sel ? (d.type === 'multi' ? ' — you selected this' : ' — your answer') : (d.type === 'multi' && o.k === 'req' ? ' — not selected' : ''))),
        ] : [];
        const note = ans && o.n ? h('span', { class: 'cx-opt-note', html: T(o.n) }) : null;
        if (d.type === 'multi') {
          const pend = pendingMulti[d.id] || (pendingMulti[d.id] = new Set());
          const cb = h('input', { type: 'checkbox', 'data-opt': String(i), disabled: ans ? true : null });
          cb.checked = ans ? sel : pend.has(i);
          cb.addEventListener('change', () => { if (cb.checked) pend.add(i); else pend.delete(i); });
          optWrap.appendChild(h('label', { class: cls + ' cx-multi', 'aria-disabled': ans ? 'true' : null }, [cb, h('span', {}, fb.concat([h('span', { html: T(o.t) }), note]))]));
        } else {
          optWrap.appendChild(h('button', { type: 'button', class: cls, 'data-opt': String(i), 'aria-disabled': ans ? 'true' : null, 'aria-pressed': ans ? String(sel) : null, onclick: () => { if (st.answers[d.id]) return; answer(d, [i]); } }, fb.concat([h('span', { html: T(o.t) }), note])));
        }
      });
      art.appendChild(optWrap);
      if (d.type === 'multi' && !ans) {
        art.appendChild(h('div', { class: 'btn-row' }, h('button', { class: 'btn primary', id: 'cx-check', onclick: () => { const p = Array.from(pendingMulti[d.id] || []).sort((a, b) => a - b); answer(d, p); } }, 'Check answer')));
      }
      if (ans) {
        const kind = ans.score === 1 ? 'ok' : ans.score === 0.5 ? 'warn' : 'bad';
        const title = ans.score === 1 ? 'Correct' : ans.score === 0.5 ? 'Partly correct: a defensible alternative (half credit)' : 'Not quite';
        const dl = h('dl', {}, [
          h('dt', {}, 'Why'), h('dd', { html: T(d.explain) }),
          h('dt', {}, 'Acceptable alternatives'), h('dd', { html: T(d.alts) }),
          h('dt', {}, 'Guidance'), h('dd', {}, 'Term Selection PtC, section ' + d.ptc),
          h('dt', {}, 'Source'), h('dd', {}, 'Book: ' + d.ref),
        ]);
        const fb = h('div', { class: 'callout cx-fb ' + kind, id: 'cx-feedback', tabindex: '-1' }, [h('strong', {}, title), dl]);
        art.appendChild(fb);
      }
      const prev = list[idx - 1], next = list[idx + 1];
      art.appendChild(h('div', { class: 'btn-row' }, [
        h('button', { class: 'btn', id: 'cx-prev', disabled: prev ? null : true, onclick: () => { st.cur = prev.id; save(); renderAll(); focusCard(); } }, '← Previous'),
        h('button', { class: 'btn primary', id: 'cx-next', disabled: next ? null : true, onclick: () => { st.cur = next.id; save(); renderAll(); focusCard(); } }, 'Next drill →'),
        ans ? h('button', { class: 'btn', id: 'cx-retry', onclick: () => { delete st.answers[d.id]; pendingMulti[d.id] = new Set(); save(); renderAll(); focusCard(); } }, 'Try again') : null,
      ]));
      card.appendChild(art);
    }

    function answer(d, picked) {
      st.answers[d.id] = { score: grade(d, picked), picked: picked, at: Date.now() };
      st.cur = d.id;
      save();
      renderAll();
      const fb = document.getElementById('cx-feedback'); if (fb) fb.focus();
    }

    function renderByTopic() {
      byTopic.innerHTML = '';
      const rows = TOPICS.map((t) => {
        const s = stats(DRILLS.filter((d) => d.topic === t.id));
        return [t.label, String(s.n), String(s.answered), fmtPts(s.pts), s.answered ? WB.pct(s.pts, s.answered, 0) : '—'];
      });
      const a = stats(DRILLS);
      rows.push([h('strong', {}, 'All topics'), h('strong', {}, String(a.n)), h('strong', {}, String(a.answered)), h('strong', {}, fmtPts(a.pts)), h('strong', {}, a.answered ? WB.pct(a.pts, a.answered, 0) : '—')]);
      byTopic.appendChild(h('details', {}, [h('summary', {}, 'Score by topic'), WB.table(['Topic', 'Drills', 'Answered', 'Points', 'Score'], rows, { compact: true, caption: 'Saved in this browser; partial credit counts 0.5' })]));
    }

    function renderAll() { renderControls(); renderStatus(); renderCard(); renderByTopic(); save(); }
    renderAll();
  }

  /* ================================================================
     TOOL 2 — Coding review checklist
     ================================================================ */
  const LINE_CHECKS = [
    { id: 'src', name: 'Source clear enough to code', ask: 'Are the meaning, units and diagnostic certainty clear from the source and its context?', ifno: 'Query the reporter with a specific, non-leading question (PtC 2.1); code nothing more specific than the report supports meanwhile.', cls: null, query: true },
    { id: 'rep', name: 'Reported, not inferred', ask: 'Does the term add no diagnosis, severity or cause that the reporter did not state?', ifno: 'Recode to what was reported (PtC 2.10).', cls: 'Inference' },
    { id: 'comp', name: 'Every reported concept coded', ask: 'Is every reported event coded, with outcomes, procedures treating an event and actions taken in their own fields?', ifno: 'Add the missing term, or query to split the line (PtC 2.10, 3.2, 3.13).', cls: 'Omission' },
    { id: 'spec', name: 'Specificity supported', ask: 'Does the LLT match the words: nothing dropped (floor) and nothing added (ceiling)?', ifno: 'Select the LLT that most accurately reflects the verbatim (PtC 2.4).', cls: 'Specificity' },
    { id: 'pt', name: 'Parent PT checked', ask: 'Do the PT, HLT, HLGT and SOC above the LLT express the reported concept? (SOC is not used to encode a causal belief.)', ifno: 'Re-select after the hierarchy check (PtC 2.9).', cls: 'Specificity or category' },
    { id: 'dx', name: 'Signs and symptoms vs diagnosis', ask: 'Is a definitive or provisional diagnosis handled per the PtC option in use, with unrelated symptoms coded?', ifno: 'Apply PtC 3.1 and the written convention; replace, do not accumulate, updated diagnoses.', cls: 'Omission or process' },
    { id: 'inv', name: 'Investigation vs condition', ask: 'Is a result coded as a result (condition only when named), non-specific when units are missing, and are separate results kept separate?', ifno: 'Recode per PtC 3.14.', cls: 'Category' },
    { id: 'spc', name: 'Special situation captured', ask: 'Are the circumstance (error, overdose, misuse, off-label use, pregnancy, quality issue, lack of effect) and any consequence both coded, without inferring intent?', ifno: 'Code circumstance and consequence (PtC 3.10–3.28).', cls: 'Omission or category' },
    { id: 'conv', name: 'Convention applied', ask: 'Where the PtC offers options, was the written convention followed, and is the synonym-list entry sound?', ifno: 'Apply the convention; refer recurring problems to the convention or synonym-list owner (Chapter 7).', cls: 'Process' },
    { id: 'ver', name: 'Version recorded', ask: 'Is the MedDRA version recorded, and is the LLT current in that version?', ifno: 'Record the version; select a current LLT (PtC 2.5).', cls: 'Process' },
  ];
  const AUTO_CHECKS = [
    { id: 'source', name: 'Source', ask: 'Was the suggestion based on the full verbatim and its field?', ifno: 'Code from the source', tag: 'context missing' },
    { id: 'fidelity', name: 'Fidelity', ask: 'Does the LLT reflect only what was reported?', ifno: 'Reject; note “added information”', tag: 'added information' },
    { id: 'qual', name: 'Qualifiers', ask: 'Are “?”, “possible”, negation and history preserved?', ifno: 'Apply the provisional-diagnosis convention', tag: 'qualifier lost' },
    { id: 'comp', name: 'Completeness', ask: 'Are all reported concepts coded, not just the first?', ifno: 'Add missing terms', tag: 'missing concept' },
    { id: 'results', name: 'Results', ask: 'Are separate laboratory results coded separately?', ifno: 'Split the terms', tag: 'results grouped' },
    { id: 'currency', name: 'Currency', ask: 'Is the LLT current in the data’s MedDRA version?', ifno: 'Select a current LLT', tag: 'non-current LLT' },
    { id: 'hier', name: 'Hierarchy', ask: 'Do the parent PT and system organ class make clinical sense?', ifno: 'Re-select; check Chapter 4 aid', tag: 'hierarchy mismatch' },
    { id: 'score', name: 'Score', ask: 'Is the score being read as similarity, not certainty?', ifno: 'Ignore the score; review fully', tag: null },
    { id: 'record', name: 'Record', ask: 'Are action and reason logged?', ifno: 'Complete the audit entry', tag: null },
  ];
  const AUTO_DECIDING = ['source', 'fidelity', 'qual', 'comp', 'results', 'currency', 'hier'];

  const LINE_PRESETS = {
    case72: {
      label: 'Load book example (Case 7.2)',
      v: {
        verbatim: '"common bile duct stone on ultrasound", CRF AE line, PA-301-0467, Day 136',
        context: 'Jaundice Day 134 (separate line); cholestatic pattern (ALP 2.9×ULN); ultrasound: dilated common bile duct with an echogenic focus in the distal duct consistent with a stone; small calculi in the gallbladder (not reported as an AE).',
        llt: '{LLT:Gallstones}', pt: '{PT:Cholelithiasis} ({HLGT:Gallbladder disorders}; {SOC:Hepatobiliary disorders})',
        rationale: 'Coded at the controlled-period data cutoff; Reviewer A: stones are stones, the PT is in Hepatobiliary disorders either way.',
        version: 'MedDRA v29.0',
        proposed: '{LLT:Choledocholithiasis} → {PT:Bile duct stone} ({SOC:Hepatobiliary disorders})',
        query: 'Optional: are the gallbladder stones a separate AE, or pre-existing?',
        reviewer: 'Coding lead and medical reviewer; approved', date: '',
        checks: { src: 'yes', rep: 'yes', comp: 'yes', spec: 'no', pt: 'no', dx: 'na', inv: 'na', spc: 'na', conv: 'yes', ver: 'yes' },
        notes: { spec: 'Verbatim names the bile duct; LLT that most accurately reflects it is the bile duct term (PtC 2.4).', pt: 'Cholelithiasis sits under HLGT Gallbladder disorders, not where a bile duct stone belongs (PtC 2.9).', comp: 'Gallbladder stones not added: not reported as an AE (PtC 2.10).' },
      },
    },
    ex71: {
      label: 'Load book example (Example 7.1)',
      v: {
        verbatim: '"cold", CRF AE line, Product B trial, Day 1',
        context: 'Infusion narrative: "During the infusion she felt cold all over and started shivering; temperature 37.2 °C; no nasal or throat symptoms."',
        llt: '{LLT:Common cold} (synonym list)', pt: '{PT:Nasopharyngitis} (primary SOC {SOC:Infections and infestations})',
        rationale: 'Automated code from the synonym list: "cold" → Common cold.',
        version: 'MedDRA v29.0',
        proposed: '{PT:Feeling cold}',
        query: 'Shivering appears only in the narrative: should it be recorded as an AE? If yes, {LLT:Shivering} → {PT:Chills}.',
        reviewer: 'Coding reviewer', date: '',
        checks: { src: 'yes', rep: 'no', comp: 'yes', spec: 'yes', pt: 'no', dx: 'na', inv: 'na', spc: 'na', conv: 'no', ver: 'yes' },
        notes: { rep: 'Nothing supports an infection; temperature normal, no upper respiratory symptoms.', pt: 'Nasopharyngitis is an infection term; Feeling cold and Chills sit in General disorders and administration site conditions.', conv: 'Synonym entry "cold" is ambiguous; refer to its owner so it does not map automatically.' },
      },
    },
  };

  const AUTO_PRESETS = {
    a: { label: 'Example 20.1 (a)', v: { verbatim: '"Pt denies chest pain; palpitations since Day 12"', context: 'Trial verbatim; no diagnosis reported.', suggestion: '{PT:Chest pain}', score: '0.84', tool: '', checks: { source: 'yes', fidelity: 'no', qual: 'no', comp: 'no', results: 'na', currency: 'yes', hier: 'yes', score: 'yes', record: 'yes' }, final: '{PT:Palpitations}', reason: 'negation lost; missing concept' } },
    b: { label: 'Example 20.1 (b)', v: { verbatim: '"Haemoglobin 82 g/L (ref 120–160)"', context: 'Trial verbatim; no diagnosis reported.', suggestion: '{PT:Anaemia}', score: '0.89', tool: '', checks: { source: 'yes', fidelity: 'no', qual: 'na', comp: 'yes', results: 'yes', currency: 'yes', hier: 'yes', score: 'yes', record: 'yes' }, final: '{PT:Haemoglobin decreased}', reason: 'unsupported diagnosis' } },
    c: { label: 'Example 20.1 (c)', v: { verbatim: '"hedache since this morning"', context: 'Trial verbatim; no diagnosis reported.', suggestion: '{PT:Headache}', score: '0.62', tool: '', checks: { source: 'yes', fidelity: 'yes', qual: 'na', comp: 'yes', results: 'na', currency: 'yes', hier: 'yes', score: 'yes', record: 'yes' }, final: '{PT:Headache}', reason: 'accepted' } },
    r1: { label: 'Case 20.1, rank 1', v: { verbatim: '"Pt called with yellow eyes and dark urine. LFTs very high. ? hepatitis. Study drug being held."', context: 'PA-301-0147, Day 71 telephone report. Values obtained the same day: ALT 9.8×ULN, total bilirubin 3.2×ULN, INR 1.2; no encephalopathy.', suggestion: '{PT:Hepatic failure}', score: '0.91', tool: '', checks: { source: 'yes', fidelity: 'no', qual: 'no', comp: 'no', results: 'na', currency: 'yes', hier: 'yes', score: 'yes', record: 'yes' }, final: '{PT:Hepatitis} + {PT:Ocular icterus} + {PT:Chromaturia} (+ {PT:Liver function test increased} per convention)', reason: 'unsupported severity' } },
    r2: { label: 'Case 20.1, rank 2', v: { verbatim: '"Pt called with yellow eyes and dark urine. LFTs very high. ? hepatitis. Study drug being held."', context: 'PA-301-0147, Day 71 telephone report.', suggestion: '{PT:Hepatitis} alone', score: '0.88', tool: '', checks: { source: 'yes', fidelity: 'yes', qual: 'no', comp: 'no', results: 'na', currency: 'yes', hier: 'yes', score: 'yes', record: 'yes' }, final: '{PT:Hepatitis} + {PT:Ocular icterus} + {PT:Chromaturia} (+ {PT:Liver function test increased} per convention)', reason: 'incomplete: drops the signs and the "?" qualifier' } },
    x201: { label: 'Exercise 20.1', v: { verbatim: '"Admitted with chest pain, query MI, troponin pending."', context: 'Spontaneous report from a hospital pharmacist. Admission is a seriousness criterion (outcome fields).', suggestion: '{PT:Myocardial infarction}', score: '0.97', tool: '', checks: { source: 'yes', fidelity: 'yes', qual: 'no', comp: 'no', results: 'na', currency: 'yes', hier: 'yes', score: 'yes', record: 'yes' }, final: '{PT:Myocardial infarction} + {PT:Chest pain}', reason: 'modified: provisional diagnosis plus signs per convention' } },
  };

  function lineVerdict(checks) {
    const vals = LINE_CHECKS.map((c) => checks[c.id] || '');
    const failed = LINE_CHECKS.filter((c) => checks[c.id] === 'no');
    if (checks.src === 'no') return { key: 'query', label: 'Query site', kind: 'warn', failed, text: 'The source does not settle the question. Query the reporter before recoding; hold the code at the specificity the report supports.' };
    if (failed.length) return { key: 'recode', label: 'Recode', kind: 'bad', failed, text: 'The current code does not reflect the report on ' + failed.length + ' check(s). Recode, and record the previous and new terms, version, reason and source in the audit trail.' };
    if (vals.some((v) => !v)) return { key: 'incomplete', label: 'Review incomplete', kind: '', failed, text: 'Answer every check (yes, no or not applicable) to reach a verdict.' };
    return { key: 'accept', label: 'Accept', kind: 'ok', failed, text: 'The code reflects the report on every applicable check. Record the review and its basis.' };
  }
  function autoVerdict(checks) {
    const failed = AUTO_CHECKS.filter((c) => checks[c.id] === 'no');
    const deciding = failed.filter((c) => AUTO_DECIDING.includes(c.id));
    const unanswered = AUTO_CHECKS.filter((c) => !checks[c.id]);
    if (deciding.length) return { key: 'override', label: 'Override', kind: 'bad', failed, deciding, text: 'Modify or reject the suggestion and record the code from the source.' };
    if (unanswered.length) return { key: 'incomplete', label: 'Review incomplete', kind: '', failed, deciding, text: 'Answer every check to reach a verdict.' };
    return { key: 'accept', label: 'Accept', kind: 'ok', failed, deciding, text: 'The suggestion reflects the report. Accept it and log the action.' };
  }
  WB.codingVerdicts = { line: lineVerdict, auto: autoVerdict };

  function renderReview(root) {
    injectCSS();
    root.classList.add('cx-scope');
    const MKEY = 'coding-review-mode';
    let mode = WB.store.get(MKEY) || 'line';
    root.appendChild(h('div', { class: 'panel' }, [
      h('h2', {}, 'How to use'),
      h('p', {}, 'Choose a mode. “Coded-line review” follows Worksheet 1 (Chapter 7): enter the verbatim and its context, the LLT and parent PT selected and the coder’s rationale, then answer each check yes, no or not applicable with a note. The tool gives a verdict (accept, query site or recode), names the error class for each failed check and exports a Word review record. “Automated suggestion check” applies the Chapter 20 reviewer checklist (Table 20.3) to an autocoder’s suggestion and score, gives accept or override with a reason, and keeps an audit log you can export. Load a book example to see a completed review. Entries are saved in this browser only; do not enter identifiable patient information.'),
    ]));
    const tabs = h('div', { class: 'cx-tabs no-print', role: 'tablist', 'aria-label': 'Review mode' });
    const body = h('div');
    root.append(tabs, body, taxonomyPanel(), WB.callout('', 'Interpretation', 'A review verdict says whether the code reflects what was reported. It does not confirm the diagnosis, assess causality or turn a retrieved case into a confirmed one; those belong to medical review. Resolve disagreements in the order source, MedDRA guidance and hierarchy, written convention, then documented medical judgment, never seniority or habit. A suggestion score measures textual similarity, not whether the code is right.'),
    WB.note('Book link: Chapter 7, Worksheet 1 and Case 7.2, Example 7.1, Figure 7.2; Chapter 20, Table 20.3, Example 20.1, Case 20.1, Exercise 20.1. Term names are the book’s illustrative examples, not MedDRA content; book examples use synthetic data.'));

    function renderTabs() {
      tabs.innerHTML = '';
      [['line', 'Coded-line review'], ['auto', 'Automated suggestion check']].forEach(([k, label]) => {
        tabs.appendChild(h('button', { class: 'btn', role: 'tab', id: 'cx-tab-' + k, 'aria-selected': String(mode === k), 'aria-controls': 'cx-panel', tabindex: mode === k ? '0' : '-1', onclick: () => { mode = k; WB.store.set(MKEY, k); renderTabs(); renderBody(); }, onkeydown: (e) => { if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { mode = mode === 'line' ? 'auto' : 'line'; WB.store.set(MKEY, mode); renderTabs(); renderBody(); document.getElementById('cx-tab-' + mode).focus(); } } }, label));
      });
    }
    function renderBody() {
      body.innerHTML = '';
      const panel = h('div', { id: 'cx-panel', role: 'tabpanel', 'aria-labelledby': 'cx-tab-' + mode });
      body.appendChild(panel);
      if (mode === 'line') renderLine(panel); else renderAuto(panel);
    }
    renderTabs(); renderBody();
  }

  function taxonomyPanel() {
    const rows = ERR.map((e) => [h('strong', {}, e.name), e.def, h('span', { html: T(e.ex) })]);
    return h('div', { class: 'panel', id: 'cx-taxonomy' }, [
      h('h2', {}, 'Error taxonomy (Chapter 7, Figure 7.2)'),
      WB.table(['Class', 'What it means', 'Example from the book'], rows, { compact: true }),
      h('p', {}, [h('strong', {}, 'Impact question that sets priority: '), 'does the error change the PT, the SOC or a query result? Measure quality by impact, not volume: report the change rate by error class, the share of changes that alter the PT, primary SOC or a predefined query result, and review high-impact terms (deaths, AESIs, terms implying severity) in full.']),
      h('details', {}, [h('summary', {}, 'Failure modes of automated suggestions (Chapter 20)'), h('ul', {}, [
        h('li', {}, [h('strong', {}, 'Missing context: '), 'the tool saw one verbatim field, not the narrative, values or later corrections.']),
        h('li', {}, [h('strong', {}, 'Unsupported specificity: '), 'it added a diagnosis or severity nobody reported.']),
        h('li', {}, [h('strong', {}, 'Lost qualifiers: '), 'it dropped “?”, “possible”, “rule out”, negation (“denies”, “no”) or “history of”.']),
        h('li', {}, [h('strong', {}, 'False confidence: '), 'a high score reflects textual similarity; the most fluent wrong answer can score highest.']),
      ])]),
    ]);
  }

  /** Live rendering of {LEVEL:Name} tokens typed into a field, shown under it. */
  function addPreview(f) {
    const pv = h('div', { class: 'cx-prev' });
    const upd = () => { const val = f.input.value; pv.innerHTML = TOK.test(val) ? 'Shows as: ' + tt(val) : ''; TOK.lastIndex = 0; };
    f.input.addEventListener('input', upd); upd();
    f.wrap.appendChild(pv);
  }

  function radioGroup(name, value, onChange) {
    const wrap = h('div', { class: 'cx-radios' });
    [['yes', 'Yes'], ['no', 'No'], ['na', 'N/A']].forEach(([v, l]) => {
      const r = h('input', { type: 'radio', name: name, value: v, 'data-val': v });
      r.checked = value === v;
      r.addEventListener('change', () => onChange(v));
      wrap.appendChild(h('label', {}, [r, l]));
    });
    return wrap;
  }

  /* ---------- mode (i): coded-line review ---------- */
  function renderLine(root) {
    const DK = 'coding-review-draft-v1';
    const blank = () => ({ verbatim: '', context: '', llt: '', pt: '', rationale: '', version: 'MedDRA v29.0', proposed: '', query: '', reviewer: '', date: today(), checks: {}, notes: {}, preset: '' });
    let v = Object.assign(blank(), WB.store.getJSON(DK, {}) || {});
    v.checks = v.checks || {}; v.notes = v.notes || {};
    const save = () => WB.store.setJSON(DK, v);

    const presetRow = h('div', { class: 'btn-row no-print' }, [
      ...Object.keys(LINE_PRESETS).map((k) => h('button', { class: 'btn small', 'data-preset': k, onclick: () => { v = Object.assign(blank(), JSON.parse(JSON.stringify(LINE_PRESETS[k].v)), { preset: k }); v.date = v.date || today(); save(); build(); } }, LINE_PRESETS[k].label)),
      h('button', { class: 'btn small', id: 'cx-line-clear', onclick: () => { v = blank(); save(); build(); } }, 'Clear form'),
    ]);
    const formBox = h('div');
    const verdictBox = h('div', { 'aria-live': 'polite' });
    root.append(presetRow, formBox, verdictBox);

    function tf(label, key, opts) {
      opts = opts || {};
      const f = WB.field(label, { type: 'text', textarea: opts.ta, rows: opts.rows || 2, value: v[key], hint: opts.hint, wide: opts.wide, placeholder: opts.ph, attrs: { 'data-key': key } });
      f.input.addEventListener('input', () => { v[key] = f.input.value; save(); renderVerdict(); });
      if (opts.preview) addPreview(f);
      return f.wrap;
    }

    function build() {
      formBox.innerHTML = '';
      formBox.appendChild(h('div', { class: 'panel' }, [
        h('h2', {}, 'The coded line'),
        h('div', { class: 'fields' }, [
          tf('Verbatim', 'verbatim', { ta: true, wide: true, hint: 'Exact reported words, source and date' }),
          tf('Context', 'context', { ta: true, rows: 3, wide: true, hint: 'Facts that bear on meaning: narrative, values with units, timing' }),
          tf('Selected LLT (current code)', 'llt', { preview: true, hint: 'Write terms as typed, or as {LLT:Name} to italicize' }),
          tf('Parent PT and hierarchy above it', 'pt', { preview: true, hint: 'PT, and HLT/HLGT/SOC if relevant' }),
          tf('Coder rationale', 'rationale', { ta: true, wide: true, hint: 'Why the coder chose this term' }),
          tf('MedDRA version', 'version', { hint: 'Version of the data and of both codes' }),
        ]),
      ]));
      const ck = h('div', { class: 'panel' }, [h('h2', {}, 'Review checklist'), WB.note('Answer each check for the selected code. “No” on the first check routes the line to a query; “no” on any other check means recode.')]);
      LINE_CHECKS.forEach((c, i) => {
        const note = h('input', { type: 'text', class: 'cx-note', 'aria-label': 'Note: ' + c.name, placeholder: 'Note (evidence or reason)', 'data-note': c.id });
        note.value = v.notes[c.id] || '';
        note.addEventListener('input', () => { v.notes[c.id] = note.value; save(); renderVerdict(); });
        const fs = h('fieldset', { class: 'cx-q' + (v.checks[c.id] === 'no' ? ' no' : ''), 'data-check': c.id }, [
          h('legend', {}, `${i + 1}. ${c.name}`),
          h('p', { class: 'cx-ask' }, c.ask),
          h('div', { class: 'cx-q-row' }, [radioGroup('cx-l-' + c.id, v.checks[c.id], (val) => { v.checks[c.id] = val; fs.classList.toggle('no', val === 'no'); save(); renderVerdict(); }), note]),
          h('div', { class: 'cx-ifno' }, 'If no: ' + c.ifno + (c.cls ? ' Error class: ' + c.cls + '.' : '')),
        ]);
        ck.appendChild(fs);
      });
      formBox.appendChild(ck);
      formBox.appendChild(h('div', { class: 'panel' }, [
        h('h2', {}, 'Decision and audit trail'),
        h('div', { class: 'fields' }, [
          tf('Proposed LLT and PT (if recode)', 'proposed', { wide: true, preview: true }),
          tf('Follow-up query (if needed)', 'query', { ta: true, wide: true, hint: 'Quote the verbatim and date, ask one question, do not lead' }),
          tf('Reviewer(s), roles and approver', 'reviewer'),
          tf('Review date', 'date', { hint: 'YYYY-MM-DD' }),
        ]),
      ]));
      renderVerdict();
    }

    function renderVerdict() {
      verdictBox.innerHTML = '';
      const vd = lineVerdict(v.checks);
      const classes = Array.from(new Set(vd.failed.filter((c) => c.cls).map((c) => c.cls)));
      const answered = LINE_CHECKS.filter((c) => v.checks[c.id]).length;
      const box = h('div', { class: 'panel', id: 'cx-line-verdict' }, [
        h('h2', {}, 'Review verdict'),
        h('div', { class: 'callout ' + vd.kind }, [
          h('div', { class: 'cx-verdict', id: 'cx-line-verdict-label' }, vd.label),
          h('p', {}, vd.text),
          vd.failed.length ? h('p', {}, [h('strong', {}, 'Failed checks: '), vd.failed.map((c) => c.name).join('; ')]) : null,
          classes.length ? h('p', { id: 'cx-line-classes' }, [h('strong', {}, 'Error class(es): '), classes.join('; ')]) : null,
          vd.key === 'recode' && v.proposed ? h('p', { html: '<strong>Recode to:</strong> ' + tt(v.proposed) }) : null,
          v.query ? h('p', { html: '<strong>Follow-up query:</strong> ' + tt(v.query) }) : null,
        ]),
        WB.note(`${answered} of ${LINE_CHECKS.length} checks answered.`),
        h('div', { class: 'btn-row' }, [
          h('button', { class: 'btn primary', id: 'cx-line-export', onclick: () => exportLine(v, vd, classes) }, 'Export review record (.doc)'),
          h('button', { class: 'btn', onclick: () => window.print() }, 'Print'),
        ]),
      ]);
      verdictBox.appendChild(box);
    }
    build();
  }

  function exportLine(v, vd, classes) {
    const e = tt;
    const row = (k, val) => `<tr><th>${WB.esc(k)}</th><td>${val}</td></tr>`;
    const checks = LINE_CHECKS.map((c, i) => `<tr><td>${i + 1}. ${WB.esc(c.name)}</td><td>${({ yes: 'Yes', no: 'No', na: 'N/A' })[v.checks[c.id]] || '—'}</td><td>${e(v.notes[c.id] || '')}</td></tr>`).join('');
    const html = `<h1>Coding review record (Worksheet 1)</h1>
<table>
${row('Verbatim', e(v.verbatim))}
${row('Context', e(v.context))}
${row('Candidate LLT (current)', e(v.llt))}
${row('Parent PT', e(v.pt))}
${row('Coder rationale', e(v.rationale))}
${row('Proposed LLT and PT', e(v.proposed) || '—')}
${row('Follow-up', e(v.query) || '—')}
${row('Reviewer', e(v.reviewer))}
${row('Date', e(v.date))}
${row('Version', e(v.version))}
</table>
<h2>Review checklist</h2>
<table><tr><th style="width:40%">Check</th><th style="width:10%">Answer</th><th>Note</th></tr>${checks}</table>
<h2>Verdict: ${WB.esc(vd.label)}</h2>
<p>${WB.esc(vd.text)}</p>
${classes.length ? `<p><b>Error class(es):</b> ${WB.esc(classes.join('; '))}</p>` : ''}
<p class="foot">Generated by the Verbatim to Signal Workbench (training tool; synthetic data; not validated software). Term names are illustrative and must be checked against the licensed MedDRA version in use. Book: Chapter 7, Worksheet 1.</p>`;
    WB.exportDoc('coding-review-' + (v.date || today()) + '.doc', 'Coding review record', html);
  }

  /* ---------- mode (ii): automated suggestion check ---------- */
  function renderAuto(root) {
    const DK = 'coding-auto-draft-v1', LK = 'coding-autolog-v1';
    const blank = () => ({ verbatim: '', context: '', suggestion: '', score: '', threshold: '0.80', tool: '', checks: {}, final: '', reason: '', reasonEdited: false });
    let v = Object.assign(blank(), WB.store.getJSON(DK, {}) || {});
    v.checks = v.checks || {};
    let log = WB.store.getJSON(LK, []) || [];
    const save = () => WB.store.setJSON(DK, v);
    const saveLog = () => WB.store.setJSON(LK, log);

    const presetSel = h('select', { id: 'cx-auto-preset' }, [h('option', { value: '' }, 'Choose a book example…')].concat(Object.keys(AUTO_PRESETS).map((k) => h('option', { value: k }, AUTO_PRESETS[k].label))));
    const presetRow = h('div', { class: 'panel no-print' }, [
      h('div', { class: 'cx-controls' }, [
        h('div', { class: 'field' }, [h('label', { for: 'cx-auto-preset' }, 'Load book example (Example 20.1, Case 20.1, Exercise 20.1)'), presetSel]),
        h('div', { class: 'btn-row', style: 'margin:0' }, [
          h('button', { class: 'btn', id: 'cx-auto-load', onclick: () => { const k = presetSel.value; if (!k) return; const p = JSON.parse(JSON.stringify(AUTO_PRESETS[k].v)); v = Object.assign(blank(), p, { threshold: v.threshold || '0.80', preset: k, reasonEdited: true }); save(); build(); } }, 'Load'),
          h('button', { class: 'btn', id: 'cx-auto-clear', onclick: () => { v = Object.assign(blank(), { threshold: v.threshold || '0.80' }); save(); build(); } }, 'Clear form'),
        ]),
      ]),
    ]);
    const formBox = h('div');
    const verdictBox = h('div', { 'aria-live': 'polite' });
    const logBox = h('div');
    root.append(presetRow, formBox, verdictBox, logBox);

    function tf(label, key, opts) {
      opts = opts || {};
      const f = WB.field(label, { type: opts.type || 'text', textarea: opts.ta, rows: opts.rows || 2, value: v[key], hint: opts.hint, wide: opts.wide, step: opts.step, min: opts.min, attrs: Object.assign({ 'data-key': key }, opts.attrs || {}) });
      f.input.addEventListener('input', () => { v[key] = f.input.value; if (key === 'reason') v.reasonEdited = true; save(); renderVerdict(); });
      if (opts.preview) addPreview(f);
      return f.wrap;
    }

    function build() {
      formBox.innerHTML = '';
      formBox.appendChild(h('div', { class: 'panel' }, [
        h('h2', {}, 'The suggestion'),
        h('div', { class: 'fields' }, [
          tf('Verbatim', 'verbatim', { ta: true, wide: true, hint: 'The full verbatim and the field it came from' }),
          tf('Context available to the reviewer', 'context', { ta: true, wide: true, hint: 'Narrative, values, later corrections' }),
          tf('Suggested term', 'suggestion', { preview: true, hint: 'Write terms as typed, or as {PT:Name}' }),
          tf('Tool score', 'score', { type: 'number', step: '0.01', min: '0', attrs: { max: '1' }, hint: '0 to 1' }),
          tf('Auto-accept threshold (illustration)', 'threshold', { type: 'number', step: '0.01', min: '0', attrs: { max: '1' }, hint: 'Example 20.1 uses 0.80' }),
          tf('Tool, model and synonym-list version', 'tool', { hint: 'For the audit trail' }),
        ]),
      ]));
      const ck = h('div', { class: 'panel' }, [h('h2', {}, 'Reviewer checklist (Table 20.3)'), WB.note('A “no” on any of checks 1–7 means override (modify or reject). Checks 8 and 9 govern how you review and record, not the code itself.')]);
      AUTO_CHECKS.forEach((c, i) => {
        const fs = h('fieldset', { class: 'cx-q' + (v.checks[c.id] === 'no' ? ' no' : ''), 'data-check': c.id }, [
          h('legend', {}, `${i + 1}. ${c.name}`),
          h('div', { class: 'cx-q-row' }, [h('p', { class: 'cx-ask', style: 'margin:0' }, c.ask), radioGroup('cx-a-' + c.id, v.checks[c.id], (val) => { v.checks[c.id] = val; fs.classList.toggle('no', val === 'no'); save(); renderVerdict(); })]),
          h('div', { class: 'cx-ifno' }, 'If no: ' + c.ifno + '.'),
        ]);
        ck.appendChild(fs);
      });
      formBox.appendChild(ck);
      formBox.appendChild(h('div', { class: 'panel' }, [
        h('h2', {}, 'Action'),
        h('div', { class: 'fields' }, [
          tf('Final code recorded', 'final', { wide: true, preview: true, hint: 'The code from the source (the suggestion itself if accepted)' }),
          tf('Reason logged', 'reason', { wide: true, hint: 'Suggested from the failed checks; edit as needed' }),
        ]),
      ]));
      renderVerdict();
    }

    function suggestedReason(vd) {
      if (vd.key === 'accept') return 'accepted';
      return vd.deciding.map((c) => c.tag).filter(Boolean).join('; ');
    }

    function renderVerdict() {
      verdictBox.innerHTML = '';
      const vd = autoVerdict(v.checks);
      if (!v.reasonEdited) {
        const r = suggestedReason(vd);
        if (r !== v.reason) { v.reason = r; save(); const inp = formBox.querySelector('[data-key="reason"]'); if (inp) inp.value = r; }
      }
      const sc = parseFloat(v.score), th = parseFloat(v.threshold);
      let scoreNote = null;
      if (isFinite(sc) && isFinite(th)) {
        const above = sc >= th;
        const clash = (above && vd.key === 'override') || (!above && vd.key === 'accept');
        scoreNote = h('p', { id: 'cx-score-note' }, [h('strong', {}, `Score ${WB.fmt(sc, 2)} is ${above ? 'at or above' : 'below'} the ${WB.fmt(th, 2)} threshold: `),
          above ? 'a threshold rule would have auto-accepted this suggestion.' : 'a threshold rule would have sent it to manual review.',
          clash ? ' Here the score and the review point in opposite directions, as in Figure 20.1: the score measures textual similarity, not correctness.' : '']);
      }
      verdictBox.appendChild(h('div', { class: 'panel', id: 'cx-auto-verdict' }, [
        h('h2', {}, 'Verdict'),
        h('div', { class: 'callout ' + vd.kind }, [
          h('div', { class: 'cx-verdict', id: 'cx-auto-verdict-label' }, vd.key === 'override' ? 'Override (modify or reject)' : vd.label),
          h('p', {}, vd.text),
          vd.deciding.length ? h('p', {}, [h('strong', {}, 'Actions: '), vd.deciding.map((c) => c.name + ': ' + c.ifno).join('; ') + '.']) : null,
          v.final ? h('p', { html: '<strong>Final code:</strong> ' + tt(v.final) }) : null,
          v.reason ? h('p', { id: 'cx-auto-reason' }, [h('strong', {}, 'Reason: '), v.reason]) : null,
          v.checks.record === 'no' ? h('p', {}, 'Complete the audit entry before closing: action, reason, model and synonym-list versions.') : null,
        ]),
        scoreNote,
        h('div', { class: 'btn-row' }, [
          h('button', { class: 'btn primary', id: 'cx-auto-add', disabled: vd.key === 'incomplete' ? true : null, onclick: () => {
            log.push({ when: today(), verbatim: v.verbatim, suggestion: v.suggestion, score: v.score, action: vd.key === 'override' ? 'Override' : 'Accept', reason: v.reason, final: v.final || (vd.key === 'accept' ? v.suggestion : ''), tool: v.tool });
            saveLog(); renderLog();
          } }, 'Add to audit log'),
          h('button', { class: 'btn', id: 'cx-auto-export', onclick: () => exportAuto(v, vd) }, 'Export this check (.doc)'),
        ]),
      ]));
    }

    function renderLog() {
      logBox.innerHTML = '';
      const th = parseFloat(v.threshold);
      const thr = isFinite(th) ? th : 0.8;
      const n = log.length;
      const acc = log.filter((r) => r.action === 'Accept').length;
      const above = log.filter((r) => parseFloat(r.score) >= thr);
      const aboveOver = above.filter((r) => r.action === 'Override').length;
      const below = log.filter((r) => isFinite(parseFloat(r.score)) && parseFloat(r.score) < thr);
      const belowAcc = below.filter((r) => r.action === 'Accept').length;
      const panel = h('div', { class: 'panel', id: 'cx-log' }, [h('h2', {}, 'Audit log of reviewed suggestions')]);
      if (!n) { panel.appendChild(WB.note('No suggestions logged yet. Review a suggestion and choose “Add to audit log”. Load the five Figure 20.1 suggestions (Example 20.1 a–c and Case 20.1 ranks 1 and 2) to reproduce the figure.')); logBox.appendChild(panel); return; }
      panel.appendChild(h('div', { class: 'result' }, [
        h('div', { class: 'stat' }, [h('div', { class: 'k' }, 'Reviewed'), h('div', { class: 'v', id: 'cx-log-n' }, String(n)), h('div', { class: 's' }, `${acc} accepted, ${n - acc} overridden`)]),
        h('div', { class: 'stat' }, [h('div', { class: 'k' }, `Score ≥ ${WB.fmt(thr, 2)}`), h('div', { class: 'v', id: 'cx-log-above' }, `${aboveOver} of ${above.length}`), h('div', { class: 's' }, 'overridden on review')]),
        h('div', { class: 'stat' }, [h('div', { class: 'k' }, `Score < ${WB.fmt(thr, 2)}`), h('div', { class: 'v', id: 'cx-log-below' }, `${belowAcc} of ${below.length}`), h('div', { class: 's' }, 'accepted on review')]),
      ]));
      if (above.length && aboveOver) panel.appendChild(WB.callout('warn', 'What a threshold would have done', `A ${WB.fmt(thr, 2)} auto-accept rule would have recorded ${above.length} suggestion(s) unreviewed, of which ${aboveOver} needed to be changed. Validate on your own verbatims and pre-specify a limit on meaning-changing errors (Case 20.2).`));
      panel.appendChild(WB.table(['#', 'Verbatim', 'Suggestion (score)', 'Action', 'Reason', 'Final code'], log.map((r, i) => [String(i + 1), r.verbatim, h('span', { html: tt(r.suggestion) + ' (' + WB.esc(r.score || '—') + ')' }), r.action, r.reason, h('span', { html: tt(r.final) })]), { compact: true }));
      panel.appendChild(h('div', { class: 'btn-row' }, [
        h('button', { class: 'btn', id: 'cx-log-csv', onclick: () => WB.exportCSV('autocoder-review-log.csv', ['Date', 'Verbatim', 'Suggestion', 'Score', 'Action', 'Reason', 'Final code', 'Tool/version'], log.map((r) => [r.when, r.verbatim, r.suggestion, r.score, r.action, r.reason, r.final, r.tool])) }, 'Export log (CSV)'),
        h('button', { class: 'btn', id: 'cx-log-doc', onclick: () => {
          const rows = log.map((r, i) => `<tr><td>${i + 1}</td><td>${WB.esc(r.when)}</td><td>${WB.esc(r.verbatim)}</td><td>${tt(r.suggestion)} (${WB.esc(r.score)})</td><td>${WB.esc(r.action)}</td><td>${WB.esc(r.reason)}</td><td>${tt(r.final)}</td></tr>`).join('');
          WB.exportDoc('autocoder-review-log.doc', 'Automated suggestion review log', `<h1>Automated suggestion review log</h1><p>${n} reviewed; ${acc} accepted, ${n - acc} overridden. Score ≥ ${WB.fmt(thr, 2)}: ${aboveOver} of ${above.length} overridden.</p><table><tr><th>#</th><th>Date</th><th>Verbatim</th><th>Suggestion (score)</th><th>Action</th><th>Reason</th><th>Final code</th></tr>${rows}</table><p class="foot">Verbatim to Signal Workbench (training tool; synthetic data). Book: Chapter 20, Table 20.3.</p>`);
        } }, 'Export log (.doc)'),
        h('button', { class: 'btn', id: 'cx-log-clear', onclick: () => { log = []; saveLog(); renderLog(); } }, 'Clear log'),
      ]));
      logBox.appendChild(panel);
    }

    build();
    renderLog();
  }

  function exportAuto(v, vd) {
    const row = (k, val) => `<tr><th>${WB.esc(k)}</th><td>${val}</td></tr>`;
    const checks = AUTO_CHECKS.map((c, i) => `<tr><td>${i + 1}. ${WB.esc(c.name)}: ${WB.esc(c.ask)}</td><td>${({ yes: 'Yes', no: 'No', na: 'N/A' })[v.checks[c.id]] || '—'}</td><td>${v.checks[c.id] === 'no' ? WB.esc(c.ifno) : ''}</td></tr>`).join('');
    const html = `<h1>Automated suggestion review</h1>
<table>
${row('Verbatim', tt(v.verbatim))}
${row('Context', tt(v.context))}
${row('Suggested term', tt(v.suggestion))}
${row('Score', WB.esc(v.score || '—') + ' (similarity, not certainty)')}
${row('Tool / model / synonym-list version', tt(v.tool) || '—')}
${row('Action', vd.key === 'override' ? 'Override (modify or reject)' : WB.esc(vd.label))}
${row('Reason', tt(v.reason) || '—')}
${row('Final code', tt(v.final) || '—')}
${row('Date', today())}
</table>
<h2>Reviewer checklist (Table 20.3)</h2>
<table><tr><th style="width:50%">Check</th><th style="width:10%">Answer</th><th>If no</th></tr>${checks}</table>
<p class="foot">Generated by the Verbatim to Signal Workbench (training tool; synthetic data; not validated software). Book: Chapter 20.</p>`;
    WB.exportDoc('autocoder-check-' + today() + '.doc', 'Automated suggestion review', html);
  }

  /* ---------------- registration (order matters) ---------------- */
  WB.register({
    id: 'coding-trainer', group: 'coding', title: 'Term selection trainer',
    summary: '36 drills from the book’s cases and examples: choose the best term, select every term you would code, or name the coding error.',
    chapters: [3, 4, 5, 6], render: renderTrainer,
  });
  WB.register({
    id: 'coding-review', group: 'coding', title: 'Coding review checklist',
    summary: 'Review a coded line against Worksheet 1, or check an autocoder suggestion against the Chapter 20 checklist; export the record.',
    chapters: [7, 20], render: renderReview,
  });
})();
