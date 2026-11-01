import { fieldMarkup, focusView } from './accessibility.js?v=6';
import { mountCarousel } from './carousel.js?v=6';
import { collectionSummary, STORAGE_KEY, emptyState, readState, saveState, commitState, parseBackup, MAX_BACKUP_BYTES, todayLocal, validDate, treatmentStatus, animalStatus, formatDate, totalLitres, toCsv } from './domain.js?v=6';

let storage, storageIssue = false, savedRaw = null;
let state = emptyState();
try { storage = window.localStorage; savedRaw = storage.getItem(STORAGE_KEY); state = readState(storage); } catch { storageIssue = true; }
let view = 'home';
let offlineReady = false;
let farmSlide = 0;
let carouselPaused = false;
let disposeCarousel = () => {};

let language = 'en';
try { language = storage.getItem('maziwa-language') === 'sw' ? 'sw' : 'en'; } catch {}
const $ = selector => document.querySelector(selector);
const clean = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const id = () => globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;

const iconPaths = {"home": "<rect x=\"3\" y=\"3\" width=\"7\" height=\"7\" rx=\"1.5\"/><rect x=\"14\" y=\"3\" width=\"7\" height=\"7\" rx=\"1.5\"/><rect x=\"3\" y=\"14\" width=\"7\" height=\"7\" rx=\"1.5\"/><rect x=\"14\" y=\"14\" width=\"7\" height=\"7\" rx=\"1.5\"/>", "animals": "<path d=\"M7 8 4 5 2 8l4 4m11-4 3-3 2 3-4 4M7 8h10l2 10-4 3H9l-4-3Z\"/><path d=\"M9 8 8 3m7 5 1-5M9 16h.01M15 16h.01\"/>", "treatments": "<path d=\"m8 16 8-8m-10 2 8 8M5 19a5 5 0 0 1 0-7l7-7a5 5 0 0 1 7 7l-7 7a5 5 0 0 1-7 0Z\"/>", "check": "<rect x=\"5\" y=\"4\" width=\"14\" height=\"17\" rx=\"2\"/><path d=\"M9 4V2h6v2m-6 9 2 2 4-5\"/>", "deliveries": "<path d=\"M8 3h8v4l3 4v10H5V11l3-4V3Zm-3 9h14M8 6h8m-7 9h6\"/>", "data": "<path d=\"m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6Z\"/><path d=\"m8 12 3 3 5-6\"/>", "arrow": "<path d=\"M5 12h14m-5-5 5 5-5 5\"/>", "alert": "<path d=\"m12 3 10 18H2Z\"/><path d=\"M12 9v5m0 3h.01\"/>", "accepted": "<path d=\"m5 12 4 4L19 6\"/>", "rejected": "<path d=\"m6 6 12 12M6 18 18 6\"/>", "leaf": "<path d=\"M20 4C9 2 3 7 5 14s14 8 15-10Z\"/><path d=\"M4 21 15 9\"/>"};
const icon = name => `<svg class="ui-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${iconPaths[name] || iconPaths.home}</svg>`;

const copy = {
  en: {
    navHome: 'Home', navAnimals: 'Herd', navTreatments: 'Care', navCheck: 'Check', navDeliveries: 'Milk', navData: 'Data',
    topReasons: 'Up to three leading reasons by rejected litres. View all deliveries for the full record.',
    dailyTitle: 'Today’s collection', dailyEyebrow: 'YOUR NEXT STEP', recentWeek: 'Last seven days', weekNote: 'From your saved collection results. Reasons are reported by you, not independently verified.', noWeek: 'No collection results in this period. Record a result after the collector tests your milk.', noRejections: 'No rejected deliveries recorded in this period.', reasonsTitle: 'Reasons entered for rejected milk', reasonCount: 'deliveries', todayResults: 'Results recorded today', checkMissing: 'No preparation check today', checkFollowup: 'Latest check needs follow-up', checkRecorded: 'Preparation check recorded', currentReminders: 'Animals needing vet follow-up', nextAnimal: 'Start with your herd record.', nextTreatment: 'Review treatment reminders before collection.', nextCheck: 'Record your preparation before leaving.', nextFollowup: 'Follow up on the latest preparation check.', nextDelivery: 'Record the collector’s actual result.', reviewResults: 'Review today’s collection results.', noClearance: 'A recorded check is not clearance to sell milk. Follow vet instructions and collection-point testing.',
    data: 'Data & privacy', dataTitle: 'Keep control of your records.', dataSub: 'Records stay in this browser and are not encrypted. Anyone using this browser can read them. Use a device screen lock and keep backups private.', jsonExport: 'Download complete backup', restore: 'Restore JSON backup', restoreHint: 'Choose a backup made by this app (up to 2 MB). Restore replaces all current records after confirmation.', reset: 'Delete device records', resetConfirm: 'Delete all farm records from this browser? Download a backup first. This cannot be undone.', restoreConfirm: 'Replace current records with this backup?', records: 'records', storageProblem: 'Records could not be loaded, or another tab changed them. Saving is paused to protect your data. Reload this page; for damaged records, download a recovery copy in Data & privacy before resetting.', saveFailed: 'Not saved. Storage is full, blocked, or changed in another tab. Your form has been kept.', badBackup: 'Backup rejected. Choose a valid app backup under 2 MB. Current records were kept.', recovery: 'Download recovery copy', deleteConfirm: 'Delete this animal?', online: 'Online only', offline: 'Offline ready',
    youthMilkingCaption: 'Dairy farming is for your generation, too.', youthCollectionCaption: 'Young farmers. Shared ambition.', youthMilkingAlt: 'AI-created illustration of a young adult Kenyan woman hand-milking a Friesian cow while a young adult man assists in a tidy dairy shed', youthCollectionAlt: 'AI-created illustration of a young adult Kenyan man closing a milk can while a young adult woman checks a notebook beside dairy cows', aiImage: 'AI-created illustration', documentaryImage: 'Kenyan dairy photograph', galleryLabel: 'Dairy farming across generations', previousImage: 'Previous image', nextImage: 'Next image', showImage: 'Show image', pauseImages: 'Pause', playImages: 'Play', reducedImages: 'Auto-play off', imageNumber: 'Image',
    welcome: 'Your farm, in focus.', today: 'YOUR DAILY FARM COMPANION', heroTag: 'BUILT AROUND YOUR HERD', photoAlt: 'A Kenyan dairy farmer standing beside black and white cows in a farm shed', photoCaption: 'Real farms. Everyday progress.', overviewLabel: 'FARM OVERVIEW', glanceLabel: 'A SIMPLE ROUTINE', knowLabel: 'CARE IN EVERY STEP', historyLabel: 'YOUR RECORDS', photoCredits: 'Photo credits', photoNote: 'Illustrative farm photography. No affiliation or endorsement implied.', deviceTitle: 'Your farm, your records', deviceNote: 'Saved in this browser. Keep a private backup before changing devices.', workspace: 'FARM WORKSPACE', footerLine: 'Made for everyday dairy farming in Kenya.', herdLabel: 'YOUR HERD', treatmentLabel: 'TREATMENT RECORD', preparationLabel: 'BEFORE COLLECTION', resultsLabel: 'COLLECTION RESULTS', dataLabel: 'DATA & PRIVACY',
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
    navHome: 'Mwanzo', navAnimals: 'Mifugo', navTreatments: 'Tiba', navCheck: 'Kagua', navDeliveries: 'Maziwa', navData: 'Data',
    topReasons: 'Hadi sababu tatu kuu kulingana na lita zilizokataliwa. Tazama matokeo yote kwa kumbukumbu kamili.',
    dailyTitle: 'Mkusanyiko wa maziwa leo', dailyEyebrow: 'HATUA INAYOFUATA', recentWeek: 'Siku saba zilizopita', weekNote: 'Kutoka kwenye matokeo uliyohifadhi. Sababu umeziandika wewe; hazijathibitishwa kwa kujitegemea.', noWeek: 'Hakuna matokeo katika kipindi hiki. Rekodi matokeo baada ya mkaguzi kupima maziwa.', noRejections: 'Hakuna maziwa yaliyokataliwa yaliyorekodiwa katika kipindi hiki.', reasonsTitle: 'Sababu zilizoandikwa za maziwa kukataliwa', reasonCount: 'uwasilishaji', todayResults: 'Matokeo yaliyorekodiwa leo', checkMissing: 'Hakuna ukaguzi wa maandalizi leo', checkFollowup: 'Ukaguzi wa mwisho unahitaji ufuatiliaji', checkRecorded: 'Ukaguzi wa maandalizi umerekodiwa', currentReminders: 'Ng’ombe wanaohitaji ufuatiliaji wa daktari', nextAnimal: 'Anza kwa kurekodi mifugo yako.', nextTreatment: 'Pitia tahadhari za matibabu kabla ya kupeleka.', nextCheck: 'Rekodi maandalizi kabla ya kuondoka.', nextFollowup: 'Fuatilia ukaguzi wa mwisho wa maandalizi.', nextDelivery: 'Rekodi matokeo halisi ya mkaguzi.', reviewResults: 'Pitia matokeo ya maziwa ya leo.', noClearance: 'Ukaguzi uliorekodiwa si ruhusa ya kuuza maziwa. Fuata maelekezo ya daktari na vipimo vya kituo.',
    data: 'Data na faragha', dataTitle: 'Dhibiti kumbukumbu zako.', dataSub: 'Kumbukumbu hubaki kwenye kivinjari hiki bila usimbaji fiche. Mtu anayetumia kivinjari hiki anaweza kuzisoma. Funga skrini ya kifaa na linda nakala zako.', jsonExport: 'Pakua nakala kamili', restore: 'Rejesha nakala ya JSON', restoreHint: 'Chagua nakala ya programu hii (hadi MB 2). Urejeshaji hubadilisha kumbukumbu zote baada ya uthibitisho.', reset: 'Futa kumbukumbu za kifaa', resetConfirm: 'Futa kumbukumbu zote kwenye kivinjari hiki? Pakua nakala kwanza. Huwezi kutengua hatua hii.', restoreConfirm: 'Badilisha kumbukumbu zilizopo kwa nakala hii?', records: 'kumbukumbu', storageProblem: 'Kumbukumbu hazikupakiwa au zimebadilishwa kwenye kichupo kingine. Uhifadhi umesitishwa kulinda data. Pakia ukurasa tena; data iliyoharibika, pakua nakala ya urejeshaji kabla ya kufuta.', saveFailed: 'Haijahifadhiwa. Hifadhi imejaa, imezuiwa au imebadilishwa kwenye kichupo kingine. Fomu yako imebaki.', badBackup: 'Nakala imekataliwa. Chagua nakala halali ya programu chini ya MB 2. Data iliyopo imehifadhiwa.', recovery: 'Pakua nakala ya urejeshaji', deleteConfirm: 'Futa ng’ombe huyu?', online: 'Mtandaoni pekee', offline: 'Tayari bila mtandao',
    youthMilkingCaption: 'Ufugaji wa maziwa ni kwa kizazi chako pia.', youthCollectionCaption: 'Wafugaji vijana. Malengo ya pamoja.', youthMilkingAlt: 'Picha iliyoundwa kwa AI ya mwanamke kijana Mkenya akikamua ng’ombe huku mwanamume kijana akimsaidia kwenye zizi safi', youthCollectionAlt: 'Picha iliyoundwa kwa AI ya mwanamume kijana Mkenya akifunga kopo la maziwa huku mwanamke kijana akiangalia daftari karibu na ng’ombe', aiImage: 'Picha iliyoundwa kwa AI', documentaryImage: 'Picha ya ufugaji nchini Kenya', galleryLabel: 'Ufugaji wa maziwa kwa vizazi vyote', previousImage: 'Picha iliyotangulia', nextImage: 'Picha inayofuata', showImage: 'Onyesha picha', pauseImages: 'Sitisha', playImages: 'Endelea', reducedImages: 'Mzunguko umezimwa', imageNumber: 'Picha',
    welcome: 'Shamba lako, kwa karibu.', today: 'MSAIDIZI WAKO WA KILA SIKU', heroTag: 'KWA AJILI YA MIFUGO YAKO', photoAlt: 'Mfugaji wa maziwa nchini Kenya akiwa karibu na ng’ombe kwenye zizi', photoCaption: 'Shamba halisi. Maendeleo kila siku.', overviewLabel: 'MUHTASARI WA SHAMBA', glanceLabel: 'UTARATIBU RAHISI', knowLabel: 'UTUNZAJI KILA HATUA', historyLabel: 'KUMBUKUMBU ZAKO', photoCredits: 'Picha', photoNote: 'Picha za kuonyesha ufugaji. Hakuna ushirika au udhamini unaodaiwa.', deviceTitle: 'Shamba lako, kumbukumbu zako', deviceNote: 'Zimehifadhiwa kwenye kivinjari hiki. Weka nakala ya faragha kabla ya kubadili kifaa.', workspace: 'SHAMBA LANGU', footerLine: 'Kwa ufugaji wa maziwa wa kila siku nchini Kenya.', herdLabel: 'MIFUGO YAKO', treatmentLabel: 'MATIBABU', preparationLabel: 'KABLA YA KUPELEKA', resultsLabel: 'MATOKEO YA KITUO', dataLabel: 'DATA NA FARAGHA',
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
const field = fieldMarkup;

function layout(content, title) {
  disposeCarousel(); disposeCarousel = () => {};
  $('#current-view-label').textContent = title;
  $('#offline-status').textContent=t(offlineReady?'offline':'online');
  $('#app-content').innerHTML = (storageIssue ? `<div class="warning-block" role="alert">${t('storageProblem')} <button class="text-button" data-go="data">${t('data')} ↗</button></div>` : '') + content;
  document.querySelectorAll('.nav-item').forEach(item => {
    const active = item.dataset.view === view;
    item.classList.toggle('active',active);
    if(active) item.setAttribute('aria-current','page'); else item.removeAttribute('aria-current');
    item.setAttribute('aria-label',t(item.dataset.view));
    item.title=t(item.dataset.view);
    const shortLabel = {home:'navHome',animals:'navAnimals',treatments:'navTreatments',check:'navCheck',deliveries:'navDeliveries',data:'navData'}[item.dataset.view];
    item.innerHTML=`${icon(item.dataset.view)}<span class="nav-label nav-long">${t(item.dataset.view)}</span><span class="nav-label nav-short" aria-hidden="true">${t(shortLabel)}</span>`;
  });
  $('#device-title').textContent=t('deviceTitle');
  $('#device-note').textContent=t('deviceNote');
  $('#workspace-label').textContent=t('workspace');
  $('#footer-line').textContent=t('footerLine');
  $('#photo-credit-label').textContent=t('photoCredits');
  $('#photo-note').textContent=t('photoNote');
  document.documentElement.lang = language === 'sw' ? 'sw' : 'en';
  $('#language-toggle').textContent = language === 'sw' ? 'SW / EN' : 'EN / SW';
  $('#language-toggle').setAttribute('aria-label', language === 'sw' ? 'Switch to English' : 'Badili kwa Kiswahili');
}

function deliveryRows(items) {
  if (!items.length) return empty(t('noDeliveries'));
  return `<div class="records-list">${items.map(item => `<div class="record-row"><div class="record-icon ${item.status}">${item.status === 'accepted' ? '✓' : '!'}</div><div class="record-main"><strong>${clean(item.status === 'accepted' ? t('acceptedOption') : t('rejectedOption'))} · ${clean(item.litres)} L</strong><span>${clean(date(item.date))} · ${clean(item.collector || '—')}${item.reason ? ` · ${clean(item.reason)}` : ''}</span></div><span class="row-end">${item.status === 'accepted' ? '↗' : '↘'}</span></div>`).join('')}</div>`;
}

const farmImages = [
  {src:'assets/youth-milking.webp',width:1536,height:1024,alt:'youthMilkingAlt',caption:'youthMilkingCaption',source:'aiImage'},
  {src:'assets/youth-collection.webp',width:1536,height:1024,alt:'youthCollectionAlt',caption:'youthCollectionCaption',source:'aiImage'},
  {src:'assets/kenya-dairy.webp',width:1600,height:1067,alt:'photoAlt',caption:'photoCaption',source:'documentaryImage'}
];
function farmGallery() {
  return `<div class="hero-gallery" id="farm-carousel" role="region" aria-roledescription="carousel" aria-label="${t('galleryLabel')}" tabindex="0"><div class="carousel-slides" aria-live="off">${farmImages.map((item,i)=>`<figure class="hero-photo" data-carousel-slide role="group" aria-roledescription="slide" aria-label="${i+1} / ${farmImages.length}" ${i===farmSlide?'':'hidden'}><img src="${item.src}" width="${item.width}" height="${item.height}" ${i===farmSlide?'fetchpriority="high"':'loading="lazy"'} decoding="async" alt="${t(item.alt)}"><figcaption><strong>${t(item.caption)}</strong><small>${t(item.source)}</small></figcaption></figure>`).join('')}</div><div class="carousel-controls"><button type="button" class="carousel-arrow previous" data-carousel-prev aria-label="${t('previousImage')}">${icon('arrow')}</button><div class="carousel-dots">${farmImages.map((item,i)=>`<button type="button" class="carousel-dot" data-carousel-index="${i}" aria-label="${t('showImage')} ${i+1}: ${t(item.caption)}" ${i===farmSlide?'aria-current="true"':''}><span aria-hidden="true"></span></button>`).join('')}</div><button type="button" class="carousel-arrow" data-carousel-next aria-label="${t('nextImage')}">${icon('arrow')}</button><button type="button" class="carousel-toggle" data-carousel-toggle aria-pressed="false">${t('pauseImages')}</button></div><span class="sr-only" data-carousel-announcement role="status" aria-live="polite"></span></div>`;
}

function collectionOverview() {
  if (storageIssue) return '';
  const summary = collectionSummary(state);
  const actionText = summary.action === 'animals' ? 'nextAnimal' : summary.action === 'treatments' ? 'nextTreatment' : summary.action === 'check' ? (summary.checkStatus === 'followup' ? 'nextFollowup' : 'nextCheck') : summary.todayCount ? 'reviewResults' : 'nextDelivery';
  const actionLabel = summary.action === 'deliveries' && summary.todayCount ? 'all' : {animals:'addAnimal',treatments:'treatments',check:'start',deliveries:'recordDelivery'}[summary.action];
  const checkLabel = {missing:'checkMissing',followup:'checkFollowup',recorded:'checkRecorded'}[summary.checkStatus];
  return `<section class="collection-overview" aria-label="${t('dailyTitle')}"><div class="panel daily-panel"><div class="section-heading"><div><span class="eyebrow">${t('dailyEyebrow')}</span><h2>${t('dailyTitle')}</h2></div></div><p class="daily-next">${t(actionText)}</p><ul class="collection-status"><li>${icon('treatments')}<span>${t('currentReminders')}</span><strong>${summary.reminders}</strong></li><li>${icon('check')}<span>${t(checkLabel)}</span></li><li>${icon('deliveries')}<span>${t('todayResults')}</span><strong>${summary.todayCount}</strong></li></ul><button class="button button-dark" data-go="${summary.action}">${t(actionLabel)} <span>↗</span></button><p class="safety-callout">${t('noClearance')}</p></div><div class="panel week-panel"><div class="section-heading"><div><span class="eyebrow">${date(summary.from)} – ${date(summary.to)}</span><h2>${t('recentWeek')}</h2></div></div><p class="summary-note">${t('weekNote')}</p>${summary.count ? `<dl class="week-totals"><div><dt>${t('accepted')}</dt><dd>${summary.accepted.toFixed(1)} <small>L</small></dd></div><div><dt>${t('rejected')}</dt><dd>${summary.rejected.toFixed(1)} <small>L</small></dd></div></dl><h3 class="reason-heading">${t('reasonsTitle')}</h3>${summary.reasons.length ? `<ul class="reason-list">${summary.reasons.slice(0,3).map(row=>`<li><div><strong>${clean(row.reason)}</strong><small>${row.count} ${t('reasonCount')}</small></div><span>${row.litres.toFixed(1)} L</span></li>`).join('')}</ul><p class="summary-note">${t('topReasons')}</p>` : `<p class="summary-empty">${t('noRejections')}</p>`}` : `<p class="summary-empty">${t('noWeek')}</p>`}<button class="text-button" data-go="deliveries">${t('all')} ↗</button></div></section>`;
}

function home() {
  const held = state.animals.filter(animal => ['hold', 'ask'].includes(animalStatus(animal.id, state.treatments))).length;
  layout(`<div class="overview-heading"><div><span class="eyebrow">${t('today')}</span><h2>${t('welcome')}</h2></div><time datetime="${todayLocal()}">${new Intl.DateTimeFormat(language==='sw'?'sw-KE':'en-KE',{weekday:'short',day:'numeric',month:'short'}).format(new Date())}</time></div><section class="hero"><div class="hero-text"><div class="eyebrow light"><span class="little-line"></span>${t('heroTag')}</div><h1>${t('headline')}</h1><p>${t('intro')}</p><button class="button button-gold" data-go="check">${t('start')} <span>↗</span></button></div>${farmGallery()}</section>
  <section class="metrics" aria-label="Farm totals"><div class="metric"><span>${t('accepted')}</span><strong>${totalLitres(state.deliveries,'accepted').toFixed(1)} <small>L</small></strong><span class="metric-mark green">${icon('accepted')}</span></div><div class="metric"><span>${t('rejected')}</span><strong>${totalLitres(state.deliveries,'rejected').toFixed(1)} <small>L</small></strong><span class="metric-mark rust">${icon('rejected')}</span></div><div class="metric"><span>${t('herd')}</span><strong>${state.animals.length}</strong><span class="metric-mark leaf">${icon('animals')}</span></div><div class="metric"><span>${t('held')}</span><strong>${held}</strong><span class="metric-mark amber">${icon('alert')}</span></div></section>
  ${collectionOverview()}
  <section class="panel recent-panel"><div class="section-heading"><div><span class="eyebrow">${t('historyLabel')}</span><h2>${t('recent')}</h2></div><button class="text-button" data-go="deliveries">${t('all')} ↗</button></div>${deliveryRows([...state.deliveries].reverse().slice(0,4))}</section>`, t('home'));
  disposeCarousel = mountCarousel($('#farm-carousel'), {initialIndex:farmSlide, initialPaused:carouselPaused, onIndexChange:index=>{farmSlide=index;}, onPauseChange:paused=>{carouselPaused=paused;}, labels:{pause:t('pauseImages'),play:t('playImages'),reduced:t('reducedImages'),image:t('imageNumber')}});
}

function animals() {
  layout(`<div class="page-heading"><span class="eyebrow">${t('herdLabel')}</span><h1>${t('animalTitle')}</h1><p>${t('animalSub')}</p></div><div class="two-column"><section class="panel form-panel"><div class="panel-heading"><span class="circle-icon">${icon('animals')}</span><h2>${t('addAnimal')}</h2></div><form id="animal-form">${field(t('animalName'),'<input name="name" maxlength="60" required autocomplete="off" placeholder="e.g. Wanjiku / K-014">')}${field(t('animalNote'),'<input name="note" maxlength="120" autocomplete="off" placeholder="e.g. Friesian, 4 years">')}<button class="button button-dark" type="submit">${t('saveAnimal')} <span>↗</span></button></form></section><section class="panel records-panel"><div class="section-heading"><div><span class="eyebrow">${t('herdLabel')}</span><h2>${t('animals')} <span class="count">${state.animals.length}</span></h2></div></div>${state.animals.length ? `<div class="records-list">${state.animals.map(animal => `<div class="record-row"><div class="record-icon cow">${icon('animals')}</div><div class="record-main"><strong>${clean(animal.name)}</strong><span>${clean(animal.note || '—')}</span></div>${badge(animalStatus(animal.id,state.treatments))}<button class="icon-button" data-delete-animal="${clean(animal.id)}" aria-label="Delete ${clean(animal.name)}" title="Delete">×</button></div>`).join('')}</div>` : empty(t('noAnimals'))}</section></div>`, t('animals'));
}

function treatments() {
  const options = state.animals.map(animal => `<option value="${clean(animal.id)}">${clean(animal.name)}</option>`).join('');
  layout(`<div class="page-heading"><span class="eyebrow">${t('treatmentLabel')}</span><h1>${t('treatmentTitle')}</h1><p>${t('treatmentSub')}</p></div><div class="two-column"><section class="panel form-panel"><div class="panel-heading"><span class="circle-icon">${icon('treatments')}</span><h2>${t('saveTreatment')}</h2></div><form id="treatment-form">${field(t('chooseAnimal'),`<select name="animalId" required><option value="">${t('chooseAnimal')}</option>${options}</select>`)}${field(t('treatmentName'),'<input name="name" maxlength="100" required autocomplete="off" placeholder="e.g. Treatment as written by vet">')}${field(t('vet'),'<input name="vet" maxlength="100" required autocomplete="off">')}${field(t('treatmentDate'),`<input name="date" type="date" value="${todayLocal()}" required>`)}${field(t('holdUntil'),'<input name="holdUntil" type="date">',`<small>${t('treatmentSub')}</small>`)}${field(t('instructions'),'<textarea name="instructions" rows="3" maxlength="500" placeholder="Record exactly what you were told"></textarea>')}<div class="form-alert">✳ ${t('reminder')}</div><button class="button button-dark" type="submit" ${!state.animals.length?'disabled':''}>${t('saveTreatment')} <span>↗</span></button></form></section><section class="panel records-panel"><div class="section-heading"><div><span class="eyebrow">${t('treatmentLabel')}</span><h2>${t('treatments')} <span class="count">${state.treatments.length}</span></h2></div></div>${state.treatments.length ? `<div class="records-list">${[...state.treatments].reverse().map(item => `<div class="record-row treatment-row"><div class="record-icon medicine">✚</div><div class="record-main"><strong>${clean(nameOf(item.animalId))} · ${clean(item.name)}</strong><span>${date(item.date)} · ${clean(item.vet)}</span><span>${t('holdUntil')}: ${date(item.holdUntil)}</span>${item.instructions ? `<small>${clean(item.instructions)}</small>` : ''}</div>${badge(treatmentStatus(item))}</div>`).join('')}</div>` : empty(t('noTreatments'))}</section></div>`, t('treatments'));
}

function radio(name, label) { return `<fieldset class="question"><legend>${label}</legend><div class="radio-set">${[['yes',t('yes')],['no',t('no')],['unsure',t('unsure')]].map(([value,text]) => `<label><input type="radio" name="${name}" value="${value}" required><span>${text}</span></label>`).join('')}</div></fieldset>`; }
function checks() {
  const flagged = state.animals.filter(animal => ['hold','ask'].includes(animalStatus(animal.id, state.treatments)));
  layout(`<div class="page-heading"><span class="eyebrow">${t('preparationLabel')}</span><h1>${t('checkTitle')}</h1><p>${t('checkSub')}</p></div><div class="two-column"><section class="panel form-panel"><div class="panel-heading"><span class="circle-icon">${icon('check')}</span><h2>${t('start')}</h2></div>${flagged.length ? `<div class="warning-block"><strong>${t('selected')}</strong><p>${flagged.map(a=>clean(a.name)).join(', ')}</p><small>${t('reminder')}</small></div>`:''}<form id="check-form">${field(t('date'),`<input name="date" type="date" value="${todayLocal()}" required>`)}${radio('container',t('cleanContainer'))}${radio('water',t('cleanWater'))}${radio('promptly',t('promptly'))}<button class="button button-dark" type="submit">${t('saveCheck')} <span>↗</span></button></form></section><section class="panel records-panel"><div class="section-heading"><div><span class="eyebrow">${t('preparationLabel')}</span><h2>${t('checkHistory')}</h2></div></div>${state.checks.length ? `<div class="records-list">${[...state.checks].reverse().map(item => `<div class="record-row"><div class="record-icon ${item.flagged?'rejected':'accepted'}">${item.flagged?'!':'✓'}</div><div class="record-main"><strong>${date(item.date)} · ${item.flagged?t('notClear'):t('prepared')}</strong><span>${t('cleanContainer')}: ${t(item.container)} · ${t('cleanWater')}: ${t(item.water)} · ${t('promptly')}: ${t(item.promptly)}</span></div></div>`).join('')}</div>` : empty(t('noChecks'))}<div class="safety-callout lower"><strong>✳ ${t('reminder')}</strong></div></section></div>`, t('check'));
}

function deliveries() {
  layout(`<div class="page-heading"><span class="eyebrow">${t('resultsLabel')}</span><h1>${t('deliveryTitle')}</h1><p>${t('deliverySub')}</p></div><div class="two-column"><section class="panel form-panel"><div class="panel-heading"><span class="circle-icon">${icon('deliveries')}</span><h2>${t('recordDelivery')}</h2></div><form id="delivery-form">${field(t('date'),`<input name="date" type="date" value="${todayLocal()}" required>`)}${field(t('litres'),'<input name="litres" type="number" min="0.1" max="100000" step="0.1" required placeholder="e.g. 12.5">')}${field(t('result'),`<select name="status" required><option value="accepted">${t('acceptedOption')}</option><option value="rejected">${t('rejectedOption')}</option></select>`)}${field(t('reason'),`<input name="reason" maxlength="180" placeholder="${t('reasonPlaceholder')}">`)}${field(t('collector'),'<input name="collector" maxlength="100" placeholder="e.g. Mukurweini collection centre">')}<button class="button button-dark" type="submit">${t('saveDelivery')} <span>↗</span></button></form></section><section class="panel records-panel"><div class="section-heading"><div><span class="eyebrow">${t('historyLabel')}</span><h2>${t('all')} <span class="count">${state.deliveries.length}</span></h2></div></div>${deliveryRows([...state.deliveries].reverse())}<div class="export-box"><div><strong>${t('backup')}</strong><p>${t('exportDesc')}</p></div><button class="button button-outline" id="export-button">${t('export')} ↓</button></div></section></div>`, t('deliveries'));
}

function dataPrivacy() {
  layout(`<div class="page-heading"><span class="eyebrow">${t('dataLabel')}</span><h1>${t('dataTitle')}</h1><p>${t('dataSub')}</p></div><div class="two-column"><section class="panel form-panel"><h2>${t('backup')}</h2><p>${t('restoreHint')}</p><button class="button button-dark" id="json-export">${storageIssue?t('recovery'):t('jsonExport')} ↓</button><div class="export-box"><label class="field"><span>${t('restore')}</span><input id="restore-file" type="file" accept=".json,application/json" ${storageIssue?'disabled':''}></label></div><button class="button button-outline" id="export-button" ${storageIssue?'disabled':''}>${t('export')} ↓</button></section><section class="panel form-panel"><h2>${t('data')}</h2><p>${t('dataSub')}</p><div class="warning-block">${t('resetConfirm')}</div><button class="button button-outline danger" id="reset-records">${t('reset')}</button></section></div>`,t('data'));
}
function render() { ({home,animals,treatments,check:checks,deliveries,data:dataPrivacy})[view](); }
function toast(message) { const box=$('#toast'); box.textContent=message; box.classList.add('show'); clearTimeout(toast.timer); toast.timer=setTimeout(()=>box.classList.remove('show'),3500); }
function persist(change) {
  try {
    if (storageIssue || storage.getItem(STORAGE_KEY) !== savedRaw) throw new Error('Storage changed');
    state = commitState(storage,state,change);
    savedRaw = storage.getItem(STORAGE_KEY);
    render(); toast(t('saved')); return true;
  } catch { toast(t('saveFailed')); return false; }
}

document.addEventListener('click', event => {
  const go=event.target.closest('[data-view],[data-go]');
  if (go) { view=go.dataset.view||go.dataset.go; render(); window.scrollTo(0,0); focusView(); }
  const del=event.target.closest('[data-delete-animal]');
  if (del) {
    const animalId=del.dataset.deleteAnimal;
    if (state.treatments.some(item=>item.animalId===animalId)) return toast(t('inUse'));
    if (confirm(t('deleteConfirm'))) persist(next => { next.animals=next.animals.filter(item=>item.id!==animalId); });
  }
  if (event.target.closest('#language-toggle')) { language=language==='en'?'sw':'en'; try { storage.setItem('maziwa-language',language); } catch {} render(); }
  if (event.target.closest('#export-button')) exportAll();
  if (event.target.closest('#json-export')) {
    try { const raw=storageIssue?storage.getItem(STORAGE_KEY):JSON.stringify(state,null,2); if(raw===null) throw new Error(); download(`maziwa-backup-${todayLocal()}.json`,raw,'application/json'); } catch { toast(t('saveFailed')); }
  }
  if (event.target.closest('#reset-records') && confirm(t('resetConfirm'))) {
    try { state=saveState(storage,emptyState()); savedRaw=storage.getItem(STORAGE_KEY); storageIssue=false; render(); toast(t('saved')); } catch { toast(t('saveFailed')); }
  }
});

document.addEventListener('submit', event => {
  if (!['animal-form','treatment-form','check-form','delivery-form'].includes(event.target.id)) return;
  event.preventDefault();
  const data=Object.fromEntries(new FormData(event.target));
  const base={id:id(),createdAt:new Date().toISOString()};
  const next=structuredClone(state);
  if (event.target.id==='animal-form') {
    if (!data.name?.trim()) return toast(t('invalid'));
    next.animals.push({...base,name:data.name.trim(),note:data.note.trim()});
  } else if (event.target.id==='treatment-form') {
    if (!state.animals.some(item=>item.id===data.animalId)||!data.name?.trim()||!data.vet?.trim()||!validDate(data.date)|| (data.holdUntil && (!validDate(data.holdUntil)||data.holdUntil<data.date))) return toast(t('invalid'));
    next.treatments.push({...base,animalId:data.animalId,name:data.name.trim(),vet:data.vet.trim(),date:data.date,holdUntil:data.holdUntil||'',instructions:data.instructions.trim()});
  } else if (event.target.id==='check-form') {
    if (!validDate(data.date)||!['container','water','promptly'].every(key=>['yes','no','unsure'].includes(data[key]))) return toast(t('invalid'));
    const flagged=['container','water','promptly'].some(key=>data[key]!=='yes')||state.animals.some(a=>['hold','ask'].includes(animalStatus(a.id,state.treatments,data.date)));
    next.checks.push({...base,...data,flagged});
    if(persist(draft => Object.assign(draft,next))) toast(flagged?t('notClearBody'):t('preparedBody')); return;
  } else {
    const litres=Number(data.litres);
    if (!validDate(data.date)||!Number.isFinite(litres)||litres<=0||litres>100000||!['accepted','rejected'].includes(data.status)|| (data.status==='rejected'&&!data.reason?.trim())) return toast(t('invalid'));
    next.deliveries.push({...base,date:data.date,litres,status:data.status,reason:data.reason.trim(),collector:data.collector.trim()});
  }
  persist(draft => Object.assign(draft,next));
});

function download(filename,content,type='text/csv;charset=utf-8') {
  const blob=new Blob([type.startsWith('text/csv')?'\uFEFF':'',content],{type}), url=URL.createObjectURL(blob), a=document.createElement('a');
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

document.addEventListener('change', async event => {
  if (event.target.matches('#delivery-form [name="status"]')) $('#delivery-form [name="reason"]').required = event.target.value === 'rejected';
  if (event.target.id !== 'restore-file') return;
  const file=event.target.files[0]; if(!file) return;
  try {
    if(file.size > MAX_BACKUP_BYTES) throw new Error();
    const imported=parseBackup(await file.text());
    const count=['animals','treatments','checks','deliveries'].reduce((sum,key)=>sum+imported[key].length,0);
    if(confirm(`${count} ${t('records')}. ${t('restoreConfirm')}`)) persist(draft=>Object.assign(draft,imported));
  } catch { toast(t('badBackup')); }
  event.target.value='';
});
window.addEventListener('storage', event => {
  if(event.key===STORAGE_KEY || event.key===null) { storageIssue=true; render(); }
});
render();
if ('serviceWorker'  in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('./sw.js').then(() => navigator.serviceWorker.ready).then(() => { offlineReady=true; $('#offline-status').textContent=t('offline'); }).catch(()=>{});



