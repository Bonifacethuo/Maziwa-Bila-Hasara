import test from 'node:test';
import assert from 'node:assert/strict';
import {collectionSummary,emptyState} from '../domain.js';
const delivery=(date,status,litres,reason='')=>({date,status,litres,reason});
const animal={id:'cow-1',name:'Test cow'};

test('empty farms get an honest empty summary and herd action',()=>{
  const result=collectionSummary(emptyState(),'2026-10-31');
  assert.equal(result.from,'2026-10-25');assert.equal(result.count,0);
  assert.equal(result.accepted,0);assert.equal(result.rejected,0);
  assert.equal(result.action,'animals');assert.equal(result.checkStatus,'missing');
  assert.deepEqual(result.reasons,[]);
});
test('seven-day window is inclusive and excludes old and future deliveries',()=>{
  const state=emptyState();state.deliveries=[delivery('2026-10-24','rejected',100,'Old'),delivery('2026-10-25','accepted',10.5),delivery('2026-10-31','rejected',2,'Container'),delivery('2026-11-01','accepted',90)];
  const before=JSON.stringify(state);const result=collectionSummary(state,'2026-10-31');
  assert.equal(result.count,2);assert.equal(result.accepted,10.5);assert.equal(result.rejected,2);
  assert.equal(result.todayCount,1);assert.equal(result.todayRejected,2);
  assert.equal(JSON.stringify(state),before);
});
test('collector reasons group only case and spacing variants, sorted by rejected litres',()=>{
  const state=emptyState();state.deliveries=[delivery('2026-10-31','rejected',2,' Sour   milk '),delivery('2026-10-30','rejected',3,'sour milk'),delivery('2026-10-30','rejected',8,'Container'),delivery('2026-10-31','accepted',20,'Sour milk'),delivery('2026-10-31','rejected',1,'__proto__')];
  const result=collectionSummary(state,'2026-10-31');
  assert.deepEqual(result.reasons,[{reason:'Container',count:1,litres:8},{reason:'Sour milk',count:2,litres:5},{reason:'__proto__',count:1,litres:1}]);
});
test('latest check controls next action without implying safety clearance',()=>{
  const state=emptyState();state.animals=[animal];
  state.checks=[{date:'2026-10-31',createdAt:'2026-10-31T09:00:00Z',flagged:true},{date:'2026-10-31',createdAt:'2026-10-31T08:00:00Z',flagged:false}];
  assert.equal(collectionSummary(state,'2026-10-31').checkStatus,'followup');
  assert.equal(collectionSummary(state,'2026-10-31').action,'check');
  state.checks.push({date:'2026-10-31',createdAt:'2026-10-31T10:00:00Z',flagged:false});
  assert.equal(collectionSummary(state,'2026-10-31').action,'deliveries');
  assert.equal(collectionSummary(state,'2026-11-01').checkStatus,'missing');
});
test('current holds and missing dates take priority; future treatment entries do not',()=>{
  const state=emptyState();state.animals=[animal];
  state.treatments=[{animalId:animal.id,date:'2026-11-01',holdUntil:'2026-11-05'}];
  assert.equal(collectionSummary(state,'2026-10-31').reminders,0);
  state.treatments.push({animalId:animal.id,date:'2026-10-30',holdUntil:'2026-10-31'});
  assert.equal(collectionSummary(state,'2026-10-31').reminders,1);
  assert.equal(collectionSummary(state,'2026-10-31').action,'treatments');
  assert.equal(collectionSummary(state,'2026-11-06').reminders,0);
  state.treatments.push({animalId:animal.id,date:'2026-10-30',holdUntil:''});
  assert.equal(collectionSummary(state,'2026-11-06').reminders,1);
});
test('date window crosses leap days and invalid summary dates fail',()=>{
  assert.equal(collectionSummary(emptyState(),'2024-03-02').from,'2024-02-25');
  assert.throws(()=>collectionSummary(emptyState(),'2026-02-30'));
});
