import test from 'node:test';
import assert from 'node:assert/strict';
import {STORAGE_KEY, MAX_BACKUP_BYTES, validateState, parseBackup, readState, commitState, emptyState, loadState, saveState, validDate, treatmentStatus, animalStatus, totalLitres, toCsv} from '../domain.js';

test('a vet-supplied hold date is inclusive and never auto-clears milk', () => {
  const treatment = { animalId:'cow-1', holdUntil:'2026-10-01' };
  assert.equal(treatmentStatus(treatment,'2026-10-01'),'hold');
  assert.equal(treatmentStatus(treatment,'2026-10-02'),'review');
  assert.equal(treatmentStatus({...treatment,holdUntil:''},'2026-10-02'),'ask');
  assert.equal(animalStatus('cow-1',[treatment],'2026-10-01'),'hold');
  assert.equal(animalStatus('cow-2',[treatment],'2026-10-01'),'none');
});

test('invalid dates cannot masquerade as hold dates', () => {
  assert.equal(validDate('2026-02-30'),false);
  assert.equal(validDate('2026-02-28'),true);
  assert.equal(treatmentStatus({holdUntil:'2026-02-30'},'2026-03-01'),'ask');
});

test('accepted and rejected litres are counted separately', () => {
  const rows=[{status:'accepted',litres:12.5},{status:'rejected',litres:4},{status:'accepted',litres:8}];
  assert.equal(totalLitres(rows,'accepted'),20.5);
  assert.equal(totalLitres(rows,'rejected'),4);
});

test('CSV quotes fields and neutralizes spreadsheet formulas', () => {
  const csv=toCsv([{name:'=HYPERLINK("bad")',note:'a,b\nline'}],[['name','name'],['note','note']]);
  assert.match(csv,/"'=HYPERLINK\(""bad""\)"/);
  assert.match(csv,/"a,b\nline"/);
});

test('records round-trip through local storage and corrupted storage resets', () => {
  const memory=new Map();
  const storage={getItem:key=>memory.get(key)??null,setItem:(key,value)=>memory.set(key,value)};
  const state=emptyState(); state.animals.push({id:'a',name:'Wanjiku',note:'',createdAt:'2026-09-30T12:00:00.000Z'});
  saveState(storage,state);
  assert.deepEqual(loadState(storage),state);
  storage.setItem('maziwa-bila-hasara:v1','{broken');
  assert.deepEqual(loadState(storage),emptyState());
});

const record = {id:'a',createdAt:'2026-09-30T12:00:00.000Z',name:'Wanjiku',note:''};
const farm = () => ({...emptyState(), animals:[{...record}]});
const memoryStorage = () => {
  const memory=new Map();
  return {getItem:key=>memory.get(key)??null,setItem:(key,value)=>memory.set(key,value)};
};

test('backup schema rejects duplicate IDs, dangling treatments and oversized input', () => {
  const state=farm();
  state.animals.push({...record});
  assert.throws(()=>validateState(state));
  state.animals.pop();
  state.treatments.push({id:'t',createdAt:record.createdAt,animalId:'missing',name:'Medicine',vet:'Vet',date:'2026-09-30',holdUntil:'',instructions:''});
  assert.throws(()=>validateState(state));
  assert.throws(()=>parseBackup(' '.repeat(MAX_BACKUP_BYTES+1)));
});

test('invalid collection results and hidden fields cannot enter the register', () => {
  const state=farm();
  state.deliveries.push({id:'d',createdAt:record.createdAt,date:'2026-09-30',litres:NaN,status:'accepted',reason:'',collector:''});
  assert.throws(()=>validateState(state));
  state.deliveries[0].litres=12;
  state.deliveries[0].status='rejected';
  assert.throws(()=>validateState(state));
  state.deliveries[0].reason='Sour milk';
  state.animals[0].name='x'.repeat(61);
  assert.throws(()=>validateState(state));
  state.animals[0].name='<img src=x onerror=alert(1)>';
  state.animals[0].secret='unexpected';
  assert.equal(validateState(state).animals[0].secret,undefined);
  assert.equal(validateState(state).animals[0].name,state.animals[0].name);
});

test('failed writes leave the current register intact', () => {
  const current=farm();
  const storage={setItem(){throw new Error('Quota exceeded');}};
  assert.throws(()=>commitState(storage,current,next=>next.animals.push({...record,id:'b'})));
  assert.equal(current.animals.length,1);
  const saved=commitState(memoryStorage(),current,next=>next.animals.push({...record,id:'b'}));
  assert.equal(saved.animals.length,2);
  assert.equal(current.animals.length,1);
});

test('damaged storage is surfaced for recovery without overwriting the raw data', () => {
  const storage=memoryStorage();
  storage.setItem(STORAGE_KEY,'{broken');
  assert.throws(()=>readState(storage));
  assert.equal(storage.getItem(STORAGE_KEY),'{broken');
});
