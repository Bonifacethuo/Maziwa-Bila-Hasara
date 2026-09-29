import { STORAGE_KEY, loadState, saveState, todayLocal, validDate, treatmentStatus, animalStatus, formatDate, totalLitres, toCsv } from './domain.js';

let state = loadState(localStorage);
let view = 'home';
let language = localStorage.getItem('maziwa-language') === 'sw' ? 'sw' : 'en';
const $ = selector => document.querySelector(selector);
const clean = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const id = () => globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;

const copy = {
  en: {
    home: 'Overview', animals: 'My animals', treatments: 'Treatment log', check: 'Before collection', deliveries: 'Milk deliveries',
    eyebrow: 'A BETTER DAY AT THE MILK COLLECTION POINT', headline: 'Every litre deserves a fair chance.',
    intro: 'Keep your herd records together, prepare for collection, and learn why milk is accepted or rejected. Built for real farm routines.',
    start: 'Run a collection check', addAnimal: 'Add an animal', recordDelivery: 'Record delivery',
    accepted: 'Accepted litres', rejected: 'Rejected litres', herd: 'Animals on record', held: 'Hold reminders',
    next: 'What to do next', about: 'How this works', reminder: 'A reminder is not a milk safety test. Follow your veterinarian’s instructions and the collection point’s tests.',
    animalTitle: 'Know your herd.', animalSub: 'A simple record helps you link treatments and collection decisions to the right animal.',
    animalName: 'Animal name or tag', animalNote: 'Optional note', saveAnimal: 'Save animal', noAnimals: 'No animals yet. Add your first cow to begin.',
    treatmentTitle: 'Remember the instructions.', treatmentSub: 'Record the date supplied by your veterinarian. Never guess a withdrawal period from this app.',
    chooseAnimal: 'Choose animal', treatmentName: 'Treatment or medicine', vet: 'Veterinarian or animal health provider', treatmentDate: 'Treatment date', holdUntil: 'Do not deliver before / through date (vet supplied)', instructions: 'Vet instructions or reference', saveTreatment: 'Save treatment', noTreatments: 'No treatments recorded yet.',
    checkTitle: 'Before you leave the farm.', checkSub: 'A short preparation check can catch avoidable problems. The collector still decides using actual tests.',
    date: 'Date', cleanContainer: 'Is the milk container clean and suitable for milk?', cleanWater: 'Was safe water used for cleaning?', promptly: 'Was the milk cooled or delivered promptly?',
    yes: 'Yes', no: 'No', unsure: 'Not sure', saveCheck: 'Save check', checkHistory: 'Recent checks', noChecks: 'No checks yet.',
    deliveryTitle: 'See what happened.', deliverySub: 'Record the collection result and reason. Keep the paper or digital receipt from the collector where possible.',
    litres: 'Litres', result: 'Collection result', reason: 'Reason given by collector', acceptedOption: 'Accepted', rejectedOption: 'Rejected',
    reasonPlaceholder: 'e.g. sour milk, antibiotic test, container, other', collector: 'Collection point / collector', saveDelivery: 'Save result', noDeliveries: 'No deliveries recorded yet.',
    backup: 'Back up your records', export: 'Export CSV files', exportDesc: 'Download separate animal, treatment, check, and delivery files. Keep them private.',
    empty: 'Nothing recorded yet', recent: 'Recent deliveries', all: 'All deliveries',
    hold: 'Hold: follow vet instructions', ask: 'Ask your vet: no date recorded', review: 'Date passed: still check with collector', none: 'No treatment recorded',
    readyHeading: 'You are ready to start', readyBody: 'Add your first animal, record any treatment instructions, then use the check before collection.',
    notClear: 'Follow up before delivery', notClearBody: 'Your answers or treatment records need attention. Do not use this app as clearance to sell milk.',
    prepared: 'Preparation recorded', preparedBody: 'Your answers were recorded. Only the collection point’s tests can determine acceptance.',
    invalid: 'Please complete the required fields with valid information.', saved: 'Record saved on this device.', exportDone: 'CSV files downloaded.',
    selected: 'Animals with treatment reminders', noResult: 'No results yet', inUse: 'An animal with linked records cannot be deleted.',
  },
  sw: {
    home: 'Muhtasari', animals: 'Mifugo yangu', treatments: 'Kumbukumbu za matibabu', check: 'Kabla ya kupeleka', deliveries: 'Maziwa yaliyowasilishwa',
    eyebrow: 'MAANDALIZI BORA KITUONI', headline: 'Kila lita ina thamani.', intro: 'Weka kumbukumbu za ng’ombe, jiandae kupeleka maziwa, na fahamu kwa nini yanakubaliwa au kukataliwa.',
    start: 'Kagua kabla ya kupeleka', addAnimal: 'Ongeza ng’ombe', recordDelivery: 'Rekodi matokeo', accepted: 'Lita zilizokubaliwa', rejected: 'Lita zilizokataliwa', herd: 'Ng’ombe waliorekodiwa', held: 'Tahadhari za kusitisha',
    next: 'Hatua inayofuata', about: 'Jinsi inavyofanya kazi', reminder: 'Ukumbusho huu si kipimo cha usalama wa maziwa. Fuata maelekezo ya daktari wa mifugo na vipimo vya kituo.',
    animalTitle: 'Fahamu mifugo yako.', animalSub: 'Kumbukumbu rahisi huunganisha matibabu na matokeo ya maziwa kwa ng’ombe husika.', animalName: 'Jina au nambari ya ng’ombe', animalNote: 'Maelezo ya hiari', saveAnimal: 'Hifadhi ng’ombe', noAnimals: 'Bado hakuna ng’ombe. Ongeza wa kwanza.',
    treatmentTitle: 'Kumbuka maelekezo.', treatmentSub: 'Andika tarehe uliyopewa na daktari wa mifugo. Usikisie muda wa kusitisha maziwa.', chooseAnimal: 'Chagua ng’ombe', treatmentName: 'Dawa au matibabu', vet: 'Daktari au mhudumu wa afya ya mifugo', treatmentDate: 'Tarehe ya matibabu', holdUntil: 'Usipeleke maziwa hadi tarehe hii ipite (ya daktari)', instructions: 'Maelekezo ya daktari', saveTreatment: 'Hifadhi matibabu', noTreatments: 'Hakuna matibabu yaliyorekodiwa.',
    checkTitle: 'Kabla ya kutoka shambani.', checkSub: 'Ukaguzi mfupi unaweza kuonyesha tatizo. Mkaguzi wa kituo bado atafanya vipimo.', date: 'Tarehe', cleanContainer: 'Chombo cha maziwa ni safi na kinafaa?', cleanWater: 'Maji salama yalitumika kusafisha?', promptly: 'Maziwa yamepozwa au yamefikishwa mapema?', yes: 'Ndiyo', no: 'Hapana', unsure: 'Sina uhakika', saveCheck: 'Hifadhi ukaguzi', checkHistory: 'Ukaguzi wa karibuni', noChecks: 'Hakuna ukaguzi bado.',
    deliveryTitle: 'Fahamu matokeo.', deliverySub: 'Rekodi matokeo na sababu uliyopewa. Hifadhi risiti ya kituo ikiwezekana.', litres: 'Lita', result: 'Matokeo ya kituo', reason: 'Sababu iliyotolewa na mkaguzi', acceptedOption: 'Yamekubaliwa', rejectedOption: 'Yamekataliwa', reasonPlaceholder: 'mfano: yamechacha, kipimo cha dawa, chombo', collector: 'Kituo / mkaguzi', saveDelivery: 'Hifadhi matokeo', noDeliveries: 'Hakuna matokeo bado.',
    backup: 'Hifadhi nakala', export: 'Pakua faili za CSV', exportDesc: 'Pakua faili za ng’ombe, matibabu, ukaguzi, na matokeo. Zilinde.', empty: 'Hakuna kumbukumbu bado', recent: 'Matokeo ya karibuni', all: 'Matokeo yote', hold: 'Sitisha: fuata maelekezo ya daktari', ask: 'Uliza daktari: hakuna tarehe', review: 'Tarehe imepita: bado kagua kituoni', none: 'Hakuna matibabu yaliyorekodiwa', readyHeading: 'Unaweza kuanza', readyBody: 'Ongeza ng’ombe, rekodi matibabu, kisha fanya ukaguzi kabla ya kupeleka maziwa.', notClear: 'Fuatilia kabla ya kupeleka', notClearBody: 'Majibu au matibabu yanahitaji kufuatiliwa. Programu hii haithibitishi kuwa maziwa ni salama.', prepared: 'Ukaguzi umerekodiwa', preparedBody: 'Majibu yamehifadhiwa. Vipimo vya kituo pekee ndivyo vinaamua kupokea maziwa.', invalid: 'Jaza sehemu zinazohitajika kwa usahihi.', saved: 'Kumbukumbu imehifadhiwa kwenye kifaa hiki.', exportDone: 'Faili za CSV zimepakuliwa.', selected: 'Ng’ombe wenye tahadhari', noResult: 'Hakuna matokeo bado', inUse: 'Huwezi kufuta ng’ombe mwenye kumbukumbu nyingine.'
  }
};
const t = key => copy[language][key];
const date = value => formatDate(value, language === 'sw' ? 'sw-KE' : 'en-KE');
const nameOf = animalId => state.animals.find(animal => animal.id === animalId)?.name || 'Unknown animal';
const badge = status => `<span class="badge ${status}">${clean(t(status))}</span>`;
const empty = message => `<div class="empty-state"><div class="empty-symbol">◌</div><strong>${clean(message)}</strong></div>`;
const field = (label, input, extra = '') => `<label class="field"><span>${clean(label)}</span>${input}${extra}</label>`;

function layout(content, title) {
  $('#current-view-label').textContent = title;
  $('#app-content').innerHTML = content;
  document.querySelectorAll('.nav-item').forEach(item => { item.classList.toggle('active', item.dataset.view === view); item.innerHTML = `<span aria-hidden="true">${({home:'◫',animals:'♧',treatments:'✚',check:'✓',deliveries:'▤'})[item.dataset.view]}</span>${t(item.dataset.view)}`; });
  document.documentElement.lang = language === 'sw' ? 'sw' : 'en';
  $('#language-toggle').textContent = language === 'sw' ? 'SW / EN' : 'EN / SW';
  $('#language-toggle').setAttribute('aria-label', language === 'sw' ? 'Switch to English' : 'Badili kwa Kiswahili');
}

function deliveryRows(items) {
  if (!items.length) return empty(t('noDeliveries'));
  return `<div class="records-list">${items.map(item => `<div class="record-row"><div class="record-icon ${item.status}">${item.status === 'accepted' ? '✓' : '!'}</div><div class="record-main"><strong>${clean(item.status === 'accepted' ? t('acceptedOption') : t('rejectedOption'))} · ${clean(item.litres)} L</strong><span>${clean(date(item.date))} · ${clean(item.collector || '—')}${item.reason ? ` · ${clean(item.reason)}` : ''}</span></div><span class="row-end">${item.status === 'accepted' ? '↗' : '↘'}</span></div>`).join('')}</div>`;
}

function home() {
  const held = state.animals.filter(animal => ['hold', 'ask'].includes(animalStatus(animal.id, state.treatments))).length;
  layout(`<section class="hero"><div class="hero-text"><div class="eyebrow light"><span class="little-line"></span>${t('eyebrow')}</div><h1>${t('headline')}</h1><p>${t('intro')}</p><button class="button button-gold" data-go="check">${t('start')} <span>↗</span></button></div><div class="hero-art" aria-hidden="true"><div class="sun"></div><div class="hill hill-back"></div><div class="hill hill-front"></div><div class="milk-can"><div class="can-handle"></div><div class="can-neck"></div><div class="can-body"><div class="can-shine"></div></div></div><div class="hero-spark spark-one">✦</div><div class="hero-spark spark-two">✦</div></div></section>
  <section class="metrics" aria-label="Farm totals"><div class="metric"><span>${t('accepted')}</span><strong>${totalLitres(state.deliveries,'accepted').toFixed(1)} <small>L</small></strong><span class="metric-mark green">↗</span></div><div class="metric"><span>${t('rejected')}</span><strong>${totalLitres(state.deliveries,'rejected').toFixed(1)} <small>L</small></strong><span class="metric-mark rust">↘</span></div><div class="metric"><span>${t('herd')}</span><strong>${state.animals.length}</strong><span class="metric-mark leaf">♧</span></div><div class="metric"><span>${t('held')}</span><strong>${held}</strong><span class="metric-mark amber">!</span></div></section>
  <section class="home-grid"><div class="panel"><div class="section-heading"><div><span class="eyebrow">YOUR FARM AT A GLANCE</span><h2>${t('next')}</h2></div></div>${state.animals.length ? `<div class="action-list"><button data-go="check"><span class="action-number">01</span><span><strong>${t('start')}</strong><small>${t('checkSub') || t('checkTitle')}</small></span><b>↗</b></button><button data-go="deliveries"><span class="action-number">02</span><span><strong>${t('recordDelivery')}</strong><small>${t('deliverySub')}</small></span><b>↗</b></button></div>` : `<div class="welcome-action"><span class="welcome-icon">♧</span><h3>${t('readyHeading')}</h3><p>${t('readyBody')}</p><button class="button button-dark" data-go="animals">${t('addAnimal')} <span>↗</span></button></div>`}</div><div class="panel info-panel"><div class="eyebrow">GOOD TO KNOW</div><h2>${t('about')}</h2><div class="steps"><div><span>01</span><p>${t('addAnimal')}</p></div><div><span>02</span><p>${t('saveTreatment')}</p></div><div><span>03</span><p>${t('start')}</p></div><div><span>04</span><p>${t('recordDelivery')}</p></div></div><div class="safety-callout"><strong>✳ ${t('reminder')}</strong></div></div></section>
  <section class="panel recent-panel"><div class="section-heading"><div><span class="eyebrow">COLLECTION HISTORY</span><h2>${t('recent')}</h2></div><button class="text-button" data-go="deliveries">${t('all')} ↗</button></div>${deliveryRows([...state.deliveries].reverse().slice(0,4))}</section>`, t('home'));
}

function animals() {
  layout(`<div class="page-heading"><span class="eyebrow">01 / YOUR HERD</span><h1>${t('animalTitle')}</h1><p>${t('animalSub')}</p></div><div class="two-column"><section class="panel form-panel"><div class="panel-heading"><span class="circle-icon">♧</span><h2>${t('addAnimal')}</h2></div><form id="animal-form">${field(t('animalName'),'<input name="name" maxlength="60" required autocomplete="off" placeholder="e.g. Wanjiku / K-014">')}${field(t('animalNote'),'<input name="note" maxlength="120" autocomplete="off" placeholder="e.g. Friesian, 4 years">')}<button class="button button-dark" type="submit">${t('saveAnimal')} <span>↗</span></button></form></section><section class="panel records-panel"><div class="section-heading"><div><span class="eyebrow">HERD REGISTER</span><h2>${t('animals')} <span class="count">${state.animals.length}</span></h2></div></div>${state.animals.length ? `<div class="records-list">${state.animals.map(animal => `<div class="record-row"><div class="record-icon cow">♧</div><div class="record-main"><strong>${clean(animal.name)}</strong><span>${clean(animal.note || '—')}</span></div>${badge(animalStatus(animal.id,state.treatments))}<button class="icon-button" data-delete-animal="${clean(animal.id)}" aria-label="Delete ${clean(animal.name)}" title="Delete">×</button></div>`).join('')}</div>` : empty(t('noAnimals'))}</section></div>`, t('animals'));
}

function treatments() {
  const options = state.animals.map(animal => `<option value="${clean(animal.id)}">${clean(animal.name)}</option>`).join('');
  layout(`<div class="page-heading"><span class="eyebrow">02 / TREATMENT RECORD</span><h1>${t('treatmentTitle')}</h1><p>${t('treatmentSub')}</p></div><div class="two-column"><section class="panel form-panel"><div class="panel-heading"><span class="circle-icon">✚</span><h2>${t('saveTreatment')}</h2></div><form id="treatment-form">${field(t('chooseAnimal'),`<select name="animalId" required><option value="">${t('chooseAnimal')}</option>${options}</select>`)}${field(t('treatmentName'),'<input name="name" maxlength="100" required autocomplete="off" placeholder="e.g. Treatment as written by vet">')}${field(t('vet'),'<input name="vet" maxlength="100" required autocomplete="off">')}${field(t('treatmentDate'),`<input name="date" type="date" value="${todayLocal()}" required>`)}${field(t('holdUntil'),'<input name="holdUntil" type="date">',`<small>${t('treatmentSub')}</small>`)}${field(t('instructions'),'<textarea name="instructions" rows="3" maxlength="500" placeholder="Record exactly what you were told"></textarea>')}<div class="form-alert">✳ ${t('reminder')}</div><button class="button button-dark" type="submit" ${!state.animals.length?'disabled':''}>${t('saveTreatment')} <span>↗</span></button></form></section><section class="panel records-panel"><div class="section-heading"><div><span class="eyebrow">TREATMENT HISTORY</span><h2>${t('treatments')} <span class="count">${state.treatments.length}</span></h2></div></div>${state.treatments.length ? `<div class="records-list">${[...state.treatments].reverse().map(item => `<div class="record-row treatment-row"><div class="record-icon medicine">✚</div><div class="record-main"><strong>${clean(nameOf(item.animalId))} · ${clean(item.name)}</strong><span>${date(item.date)} · ${clean(item.vet)}</span><span>${t('holdUntil')}: ${date(item.holdUntil)}</span>${item.instructions ? `<small>${clean(item.instructions)}</small>` : ''}</div>${badge(treatmentStatus(item))}</div>`).join('')}</div>` : empty(t('noTreatments'))}</section></div>`, t('treatments'));
}

function radio(name, label) { return `<fieldset class="question"><legend>${label}</legend><div class="radio-set">${[['yes',t('yes')],['no',t('no')],['unsure',t('unsure')]].map(([value,text]) => `<label><input type="radio" name="${name}" value="${value}" required><span>${text}</span></label>`).join('')}</div></fieldset>`; }
function checks() {
  const flagged = state.animals.filter(animal => ['hold','ask'].includes(animalStatus(animal.id, state.treatments)));
  layout(`<div class="page-heading"><span class="eyebrow">03 / PRE-COLLECTION</span><h1>${t('checkTitle')}</h1><p>${t('checkSub')}</p></div><div class="two-column"><section class="panel form-panel"><div class="panel-heading"><span class="circle-icon">✓</span><h2>${t('start')}</h2></div>${flagged.length ? `<div class="warning-block"><strong>${t('selected')}</strong><p>${flagged.map(a=>clean(a.name)).join(', ')}</p><small>${t('reminder')}</small></div>`:''}<form id="check-form">${field(t('date'),`<input name="date" type="date" value="${todayLocal()}" required>`)}${radio('container',t('cleanContainer'))}${radio('water',t('cleanWater'))}${radio('promptly',t('promptly'))}<button class="button button-dark" type="submit">${t('saveCheck')} <span>↗</span></button></form></section><section class="panel records-panel"><div class="section-heading"><div><span class="eyebrow">YOUR PREPARATION</span><h2>${t('checkHistory')}</h2></div></div>${state.checks.length ? `<div class="records-list">${[...state.checks].reverse().map(item => `<div class="record-row"><div class="record-icon ${item.flagged?'rejected':'accepted'}">${item.flagged?'!':'✓'}</div><div class="record-main"><strong>${date(item.date)} · ${item.flagged?t('notClear'):t('prepared')}</strong><span>${t('cleanContainer')}: ${t(item.container)} · ${t('cleanWater')}: ${t(item.water)} · ${t('promptly')}: ${t(item.promptly)}</span></div></div>`).join('')}</div>` : empty(t('noChecks'))}<div class="safety-callout lower"><strong>✳ ${t('reminder')}</strong></div></section></div>`, t('check'));
}

function deliveries() {
  layout(`<div class="page-heading"><span class="eyebrow">04 / COLLECTION RESULTS</span><h1>${t('deliveryTitle')}</h1><p>${t('deliverySub')}</p></div><div class="two-column"><section class="panel form-panel"><div class="panel-heading"><span class="circle-icon">▤</span><h2>${t('recordDelivery')}</h2></div><form id="delivery-form">${field(t('date'),`<input name="date" type="date" value="${todayLocal()}" required>`)}${field(t('litres'),'<input name="litres" type="number" min="0.1" max="100000" step="0.1" required placeholder="e.g. 12.5">')}${field(t('result'),`<select name="status" required><option value="accepted">${t('acceptedOption')}</option><option value="rejected">${t('rejectedOption')}</option></select>`)}${field(t('reason'),`<input name="reason" maxlength="180" placeholder="${t('reasonPlaceholder')}">`)}${field(t('collector'),'<input name="collector" maxlength="100" placeholder="e.g. Mukurweini collection centre">')}<button class="button button-dark" type="submit">${t('saveDelivery')} <span>↗</span></button></form></section><section class="panel records-panel"><div class="section-heading"><div><span class="eyebrow">COLLECTION HISTORY</span><h2>${t('all')} <span class="count">${state.deliveries.length}</span></h2></div></div>${deliveryRows([...state.deliveries].reverse())}<div class="export-box"><div><strong>${t('backup')}</strong><p>${t('exportDesc')}</p></div><button class="button button-outline" id="export-button">${t('export')} ↓</button></div></section></div>`, t('deliveries'));
}

function render() { ({home,animals,treatments,check:checks,deliveries})[view](); }
function toast(message) { const box=$('#toast'); box.textContent=message; box.classList.add('show'); clearTimeout(toast.timer); toast.timer=setTimeout(()=>box.classList.remove('show'),3500); }
function persist() { try { saveState(localStorage,state); render(); toast(t('saved')); } catch { toast('Storage is full or unavailable. Export your records and free space.'); } }

document.addEventListener('click', event => {
  const go=event.target.closest('[data-view],[data-go]');
  if (go) { view=go.dataset.view||go.dataset.go; render(); window.scrollTo(0,0); }
  const del=event.target.closest('[data-delete-animal]');
  if (del) {
    const animalId=del.dataset.deleteAnimal;
    if (state.treatments.some(item=>item.animalId===animalId)) return toast(t('inUse'));
    state.animals=state.animals.filter(item=>item.id!==animalId); persist();
  }
  if (event.target.closest('#language-toggle')) { language=language==='en'?'sw':'en'; localStorage.setItem('maziwa-language',language); render(); }
  if (event.target.closest('#export-button')) exportAll();
});

document.addEventListener('submit', event => {
  if (!['animal-form','treatment-form','check-form','delivery-form'].includes(event.target.id)) return;
  event.preventDefault();
  const data=Object.fromEntries(new FormData(event.target));
  const base={id:id(),createdAt:new Date().toISOString()};
  if (event.target.id==='animal-form') {
    if (!data.name?.trim()) return toast(t('invalid'));
    state.animals.push({...base,name:data.name.trim(),note:data.note.trim()});
  } else if (event.target.id==='treatment-form') {
    if (!state.animals.some(item=>item.id===data.animalId)||!data.name?.trim()||!data.vet?.trim()||!validDate(data.date)|| (data.holdUntil && (!validDate(data.holdUntil)||data.holdUntil<data.date))) return toast(t('invalid'));
    state.treatments.push({...base,animalId:data.animalId,name:data.name.trim(),vet:data.vet.trim(),date:data.date,holdUntil:data.holdUntil||'',instructions:data.instructions.trim()});
  } else if (event.target.id==='check-form') {
    if (!validDate(data.date)||!['container','water','promptly'].every(key=>['yes','no','unsure'].includes(data[key]))) return toast(t('invalid'));
    const flagged=['container','water','promptly'].some(key=>data[key]!=='yes')||state.animals.some(a=>['hold','ask'].includes(animalStatus(a.id,state.treatments,data.date)));
    state.checks.push({...base,...data,flagged});
    persist(); return toast(flagged?t('notClearBody'):t('preparedBody'));
  } else {
    const litres=Number(data.litres);
    if (!validDate(data.date)||!Number.isFinite(litres)||litres<=0||litres>100000||!['accepted','rejected'].includes(data.status)|| (data.status==='rejected'&&!data.reason?.trim())) return toast(t('invalid'));
    state.deliveries.push({...base,date:data.date,litres,status:data.status,reason:data.reason.trim(),collector:data.collector.trim()});
  }
  persist();
});

function download(filename,content) {
  const blob=new Blob(['\uFEFF',content],{type:'text/csv;charset=utf-8'}), url=URL.createObjectURL(blob), a=document.createElement('a');
  a.href=url; a.download=filename; document.body.append(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function exportAll() {
  const tables=[
    ['animals',state.animals,[['id','id'],['name','name'],['note','note'],['created_at','createdAt']]],
    ['treatments',state.treatments,[['id','id'],['animal_id','animalId'],['medicine','name'],['vet','vet'],['treatment_date','date'],['hold_through','holdUntil'],['instructions','instructions']]],
    ['checks',state.checks,[['id','id'],['date','date'],['container','container'],['water','water'],['promptly','promptly'],['flagged','flagged']]],
    ['deliveries',state.deliveries,[['id','id'],['date','date'],['litres','litres'],['status','status'],['reason','reason'],['collector','collector']]]
  ];
  tables.forEach(([name,rows,columns])=>download(`maziwa-${name}-${todayLocal()}.csv`,toCsv(rows,columns)));
  toast(t('exportDone'));
}

render();
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('./sw.js').catch(()=>{});
