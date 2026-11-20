import test from 'node:test';
import assert from 'node:assert/strict';
import {PROFILE_LIMITS,emptyProfile,hasProfile,validateProfile,emptyState,validateState,parseBackup,readState,saveState,commitState,STORAGE_KEY,toCsv} from '../domain.js';

const profile=()=>({...emptyProfile(),farmerName:'Wanjiku',farmName:'Karibu Dairy',phone:'+254 712 345 678',county:'Kiambu',locality:'Githunguri',collectionPoint:'Local cooperative'});
const storage=()=>{const memory=new Map();return {getItem:key=>memory.get(key)??null,setItem:(key,value)=>memory.set(key,value)};};
const register=()=>({...emptyState(),animals:[{id:'a',createdAt:'2026-11-20T08:00:00.000Z',name:'Ayrshire 01',note:''}],treatments:[{id:'t',createdAt:'2026-11-20T08:00:00.000Z',animalId:'a',name:'Vet record',vet:'Vet',date:'2026-11-20',holdUntil:'',instructions:'Call vet'}],checks:[{id:'c',createdAt:'2026-11-20T08:00:00.000Z',date:'2026-11-20',container:'yes',water:'yes',promptly:'yes',flagged:false}],deliveries:[{id:'d',createdAt:'2026-11-20T08:00:00.000Z',date:'2026-11-20',litres:12.5,status:'accepted',reason:'',collector:'Cooperative'}]});

test('profile fields are optional, trimmed and independent for each new farm',()=>{
  assert.equal(hasProfile(emptyProfile()),false);
  const saved=validateProfile({...emptyProfile(),county:'  Kiambu  '});
  assert.equal(saved.county,'Kiambu');assert.equal(hasProfile(saved),true);
  const first=emptyState(),second=emptyState();first.profile.farmName='My farm';assert.equal(second.profile.farmName,'');
});
test('legacy v1 registers and backups gain empty profile defaults without changing records or storage',()=>{
  const old=register();delete old.profile;const raw=JSON.stringify(old), device=storage();device.setItem(STORAGE_KEY,raw);
  const loaded=readState(device);assert.deepEqual(loaded.profile,emptyProfile());assert.equal(device.getItem(STORAGE_KEY),raw);
  const expected={...loaded};delete expected.profile;assert.deepEqual(expected,old);
  assert.deepEqual(parseBackup(raw),loaded);
});
test('profile saves, later collection saves and full backups preserve every existing farm record',()=>{
  const original=register(),device=storage();
  const saved=commitState(device,original,next=>{next.profile=profile();});
  for(const key of ['animals','treatments','checks','deliveries'])assert.deepEqual(saved[key],original[key]);
  assert.deepEqual(original.profile,emptyProfile());assert.deepEqual(readState(device),saved);
  const later=commitState(device,saved,next=>next.animals[0].note='Updated note');
  assert.deepEqual(later.profile,profile());assert.deepEqual(parseBackup(JSON.stringify(later)),later);
});
test('profile validation rejects malformed, oversized and control-character fields and strips metadata',()=>{
  for(const value of [null,[],{},'profile',{...profile(),county:42},{...profile(),farmerName:'Bad\u0000Name'}])assert.throws(()=>validateProfile(value));
  for(const [key,max] of Object.entries(PROFILE_LIMITS))assert.throws(()=>validateProfile({...profile(),[key]:'x'.repeat(max+1)}));
  const safe=validateProfile({...profile(),role:'admin',password:'not retained'});assert.deepEqual(safe,profile());
  assert.throws(()=>validateState({...register(),profile:null}));
});
test('optional phone accepts common Kenyan formats and rejects ambiguous or invalid characters and digit counts',()=>{
  for(const phone of ['','0712345678','+254712345678','(0712) 345-678','+1 202 555 0123'])assert.equal(validateProfile({...emptyProfile(),phone}).phone,phone);
  for(const phone of ['123','+254HELLO123','++254712345678','254+712345678','1234567890123456','<script>'])assert.throws(()=>validateProfile({...emptyProfile(),phone}));
});
test('failed profile writes preserve the entire register and previous saved profile',()=>{
  const original={...register(),profile:profile()},before=structuredClone(original);
  assert.throws(()=>commitState({setItem(){throw Error('Quota');}},original,next=>{next.profile.farmName='Changed';}));
  assert.deepEqual(original,before);
});
test('malformed stored profiles fail closed without overwriting recovery data',()=>{
  const device=storage(),raw=JSON.stringify({...register(),profile:{...profile(),phone:'invalid'}});device.setItem(STORAGE_KEY,raw);
  assert.throws(()=>readState(device));assert.equal(device.getItem(STORAGE_KEY),raw);
});
test('older backup replacement and reset deliberately clear the profile as documented',()=>{
  const device=storage(),current={...register(),profile:profile()},old=register();delete old.profile;
  const restored=commitState(device,current,next=>Object.assign(next,parseBackup(JSON.stringify(old))));
  assert.deepEqual(restored.profile,emptyProfile());assert.deepEqual(restored.animals,current.animals);
  assert.deepEqual(saveState(device,emptyState()),emptyState());
});
test('profile text remains literal and its CSV uses the existing spreadsheet protections',()=>{
  const saved=validateProfile({...emptyProfile(),farmerName:'<img src=x onerror=alert(1)>',farmName:'=HYPERLINK("bad")',phone:'+254712345678'});
  assert.equal(saved.farmerName,'<img src=x onerror=alert(1)>');
  const csv=toCsv([saved],[['farmer_name','farmerName'],['farm_name','farmName'],['phone','phone']]);
  assert.match(csv,/"'=HYPERLINK/);assert.match(csv,/"'\+254712345678"/);
});
