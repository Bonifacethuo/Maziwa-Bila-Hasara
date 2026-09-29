import test from 'node:test';
import assert from 'node:assert/strict';
import {emptyState, loadState, saveState, validDate, treatmentStatus, animalStatus, totalLitres, toCsv} from '../domain.js';

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
  const state=emptyState(); state.animals.push({id:'a',name:'Wanjiku'});
  saveState(storage,state);
  assert.deepEqual(loadState(storage),state);
  storage.setItem('maziwa-bila-hasara:v1','{broken');
  assert.deepEqual(loadState(storage),emptyState());
});
