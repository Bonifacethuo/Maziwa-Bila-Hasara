import test from 'node:test';
import assert from 'node:assert/strict';
import {createDrafts} from '../drafts.js';

const input=(name,value='',type='text',extra={})=>({name,value,type,disabled:false,...extra});
const form=(id,...elements)=>({id,elements});

test('pristine date/select defaults are not unfinished work; reverting edits removes a draft',()=>{
  const drafts=createDrafts(), f=form('delivery-form',input('date','2026-11-19','date'),input('litres','','number'),input('status','accepted','select-one'));
  drafts.restore(f); drafts.capture(f); assert.deepEqual(drafts.ids(),[]);
  f.elements[1].value='12.5'; drafts.capture(f); assert.equal(drafts.has(f.id),true);
  f.elements[1].value=''; drafts.capture(f); assert.equal(drafts.has(f.id),false);
});
test('entries restore across rebuilt forms without parsing user text as HTML',()=>{
  const drafts=createDrafts(), old=form('animal-form',input('name'),input('note'));
  drafts.restore(old); old.elements[0].value='<img src=x onerror=alert(1)>'; old.elements[1].value='Wanjiku'; drafts.capture(old);
  const rebuilt=form('animal-form',input('name'),input('note'));
  drafts.restore(rebuilt); assert.equal(rebuilt.elements[0].value,old.elements[0].value);
  assert.equal(rebuilt.elements[1].value,'Wanjiku');
  drafts.capture(rebuilt); assert.equal(drafts.has(rebuilt.id),true);
});
test('checklist restores selected and unselected radio states, not just submitted answers',()=>{
  const drafts=createDrafts(), make=()=>form('check-form',input('container','yes','radio',{checked:false}),input('container','no','radio',{checked:false}),input('container','unsure','radio',{checked:false}));
  const old=make(); drafts.restore(old); old.elements[2].checked=true; drafts.capture(old);
  const rebuilt=make(); drafts.restore(rebuilt); assert.deepEqual(rebuilt.elements.map(el=>el.checked),[false,false,true]);
});
test('treatment draft never silently selects a different animal after records change',()=>{
  const drafts=createDrafts(), old=form('treatment-form',input('animalId','','select-one',{options:[{value:''},{value:'cow-a'}]}),input('instructions','','textarea'));
  drafts.restore(old); old.elements[0].value='cow-a'; old.elements[1].value='Exact vet instructions'; drafts.capture(old);
  const rebuilt=form('treatment-form',input('animalId','','select-one',{options:[{value:''},{value:'cow-b'}]}),input('instructions','','textarea'));
  drafts.restore(rebuilt); assert.equal(rebuilt.elements[0].value,''); assert.equal(rebuilt.elements[1].value,'Exact vet instructions');
});
test('saving or discarding one entry keeps other unfinished entries; reset clears all',()=>{
  const drafts=createDrafts();
  for(const id of ['animal-form','delivery-form']){const f=form(id,input('name'));drafts.restore(f);f.elements[0].value='Changed';drafts.capture(f);}
  drafts.clear('animal-form');assert.deepEqual(drafts.ids(),['delivery-form']);
  drafts.clearAll();assert.deepEqual(drafts.ids(),[]);
});
test('backup files, filters, unknown forms and unsupported controls are never retained',()=>{
  const drafts=createDrafts();
  for(const id of ['restore-form','delivery-filter-form']){const f=form(id,input('secret'));drafts.restore(f);f.elements[0].value='Never store';drafts.capture(f);}
  const f=form('animal-form',input('name'),input('file','','file'),input('secret','','password'),input('disabled','','text',{disabled:true}));
  drafts.restore(f); for(const el of f.elements.slice(1))el.value='Never store'; drafts.capture(f);
  assert.deepEqual(drafts.ids(),[]);
});
test('untouched forms cannot be captured before initialization',()=>{
  const drafts=createDrafts();drafts.capture(form('animal-form',input('name','Existing')));assert.deepEqual(drafts.ids(),[]);
});
