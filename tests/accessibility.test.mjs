import test from 'node:test';
import assert from 'node:assert/strict';
import {fieldMarkup,focusView} from '../accessibility.js';

test('treatment help is a description, separate from the label',()=>{
 const html=fieldMarkup('Vet supplied date','<input name="holdUntil" type="date">','<small>Follow the vet’s instructions.</small>');
 assert.match(html,/<label for="field-holdUntil">Vet supplied date<\/label>/);
 assert.match(html,/<input id="field-holdUntil" aria-describedby="field-holdUntil-help" name="holdUntil" type="date">/);
 assert.match(html,/<div id="field-holdUntil-help"><small>/);
});
test('all form-control types retain constraints and receive explicit labels',()=>{
 for(const control of ['<input name="name" maxlength="60" required>','<select name="animalId" required><option value="">Choose</option></select>','<textarea name="instructions" maxlength="500"></textarea>']){
  const html=fieldMarkup('Name & tag',control);
  assert.match(html,/Name &amp; tag/);
  assert.ok(!html.includes('aria-describedby'));
  assert.ok(html.includes(control.match(/name="[^"]+"/)[0]));
  assert.ok(html.includes(control.includes('maxlength')?control.match(/maxlength="\d+"/)[0]:'required'));
 }
 assert.throws(()=>fieldMarkup('Missing name','<input>'));
});
test('field labels escape markup rather than executing it',()=>{
 const html=fieldMarkup('<img src=x onerror=alert(1)>','<input name="name">');
 assert.ok(!html.includes('<img'));assert.ok(html.includes('&lt;img'));
});
test('navigation focuses the new heading without changing scroll position',()=>{
 const calls=[];
 const heading={setAttribute:(...args)=>calls.push(args),focus:options=>calls.push(options)};
 assert.equal(focusView({querySelector:selector=>{assert.equal(selector,'#app-content h1');return heading;}}),true);
 assert.deepEqual(calls,[['tabindex','-1'],{preventScroll:true}]);
});
test('views without a heading do not cause a navigation crash',()=>{
 assert.equal(focusView({querySelector:()=>null}),false);
});
