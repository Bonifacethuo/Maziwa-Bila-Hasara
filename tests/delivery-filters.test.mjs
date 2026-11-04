import test from 'node:test';
import assert from 'node:assert/strict';
import {filterDeliveries,totalLitres} from '../domain.js';
const rows=[
 {id:'a',date:'2026-11-01',status:'accepted',litres:12,createdAt:'2026-11-01T08:00:00Z'},
 {id:'b',date:'2026-11-04',status:'rejected',litres:3,createdAt:'2026-11-04T08:00:00Z'},
 {id:'c',date:'2026-11-04',status:'accepted',litres:8.5,createdAt:'2026-11-04T09:00:00Z'},
 {id:'d',date:'2026-11-05',status:'rejected',litres:2,createdAt:'2026-11-05T08:00:00Z'}
];

test('default filters include every result, sorted by delivery date without mutation',()=>{
 const before=structuredClone(rows);const result=filterDeliveries(rows);
 assert.deepEqual(result.map(x=>x.id),['d','c','b','a']);
 assert.deepEqual(rows,before);assert.notEqual(result,rows);
});
test('both date boundaries are inclusive and combine with collection result',()=>{
 const result=filterDeliveries(rows,{from:'2026-11-01',to:'2026-11-04',status:'rejected'});
 assert.deepEqual(result.map(x=>x.id),['b']);
 assert.equal(totalLitres(result,'rejected'),3);assert.equal(totalLitres(result,'accepted'),0);
 assert.equal(filterDeliveries(rows,{from:'2026-11-04',to:'2026-11-04'}).length,2);
});
test('one-sided ranges and status-only selections work independently',()=>{
 assert.deepEqual(filterDeliveries(rows,{to:'2026-11-01'}).map(x=>x.id),['a']);
 assert.deepEqual(filterDeliveries(rows,{from:'2026-11-05'}).map(x=>x.id),['d']);
 assert.equal(totalLitres(filterDeliveries(rows,{status:'accepted'}),'accepted'),20.5);
});
test('empty registers and unmatched filters return no fabricated results',()=>{
 assert.deepEqual(filterDeliveries([]),[]);
 assert.deepEqual(filterDeliveries(rows,{to:'2026-10-31'}),[]);
 assert.deepEqual(filterDeliveries(rows,{from:'2026-11-05',status:'accepted'}),[]);
});
test('invalid dates, reversed ranges, result values and non-text boundaries are rejected',()=>{
 for(const filters of [{from:'2026-02-30'},{to:'04/11/2026'},{from:'2026-11-05',to:'2026-11-01'},{status:'unknown'},{from:0},{to:[]},{status:'__proto__'}])assert.throws(()=>filterDeliveries(rows,filters));
 assert.doesNotThrow(()=>filterDeliveries(rows,{from:'2024-02-29'}));
});
test('same-day entry order handles timezone offsets and keeps exact ties stable',()=>{
 const records=[{id:'a',date:'2026-11-04',createdAt:'2026-11-04T11:00:00+03:00'}, {id:'b',date:'2026-11-04',createdAt:'2026-11-04T09:00:00Z'}, {id:'c',date:'2026-11-04',createdAt:'2026-11-04T09:00:00Z'}];
 assert.deepEqual(filterDeliveries(records).map(x=>x.id),['b','c','a']);
});
