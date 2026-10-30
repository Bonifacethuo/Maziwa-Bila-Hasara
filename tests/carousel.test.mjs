import test from 'node:test';
import assert from 'node:assert/strict';
import {mountCarousel} from '../carousel.js';

class Element extends EventTarget {
  constructor(attrs={}) { super(); this.attrs=new Map(Object.entries(attrs)); this.dataset={carouselIndex:attrs['data-carousel-index']}; this.hidden=false; this.disabled=false; this.textContent=''; }
  setAttribute(key,value){this.attrs.set(key,value);}
  removeAttribute(key){this.attrs.delete(key);}
  hasAttribute(key){return this.attrs.has(key);}
  closest(){return this;}
}
function fixture({reduced=false,initialIndex=0,initialPaused=false}={}) {
  const slides=Array.from({length:3},()=>new Element());
  const dots=slides.map((_,i)=>new Element({'data-carousel-index':String(i)}));
  const toggle=new Element({'data-carousel-toggle':''});
  const previous=new Element({'data-carousel-prev':''});
  const next=new Element({'data-carousel-next':''});
  const announcement=new Element();
  const root=new Element();
  const members=[...slides,...dots,toggle,previous,next,announcement,root];
  root.contains=node=>members.includes(node);
  root.querySelectorAll=selector=>selector==='[data-carousel-slide]'?slides:dots;
  root.querySelector=selector=>selector==='[data-carousel-toggle]'?toggle:announcement;
  const doc=Object.assign(new EventTarget(),{hidden:false,activeElement:null});
  const media=Object.assign(new EventTarget(),{matches:reduced});
  const timers=new Map();let timerId=0;
  const dispose=mountCarousel(root,{document:doc,media,initialIndex,initialPaused,schedule:(fn,delay)=>{assert.equal(delay,8000);timers.set(++timerId,fn);return timerId;},cancel:id=>timers.delete(id)});
  const fire=(target,name,props={})=>{
    const event=new Event(name,{cancelable:true});
    for(const [key,value] of Object.entries(props))Object.defineProperty(event,key,{value});
    target.dispatchEvent(event);return event;
  };
  return {slides,dots,toggle,previous,next,root,doc,media,timers,dispose,announcement,fire,
    click:button=>fire(root,'click',{target:button}),
    tick:()=>{assert.equal(timers.size,1);const [key,fn]=timers.entries().next().value;timers.delete(key);fn();},
    selected:()=>slides.findIndex(slide=>!slide.hidden)};
}

test('auto-advance shows one full slide at a time and wraps without noisy announcements',()=>{
  const f=fixture();assert.equal(f.selected(),0);
  f.tick();assert.equal(f.selected(),1);assert.equal(f.dots[1].attrs.get('aria-current'),'true');
  f.tick();f.tick();assert.equal(f.selected(),0);
  assert.equal(f.slides.filter(slide=>!slide.hidden).length,1);
  assert.equal(f.announcement.textContent,'');f.dispose();
});

test('manual selection pauses rotation until explicitly played',()=>{
  const f=fixture();f.click(f.next);assert.equal(f.selected(),1);assert.equal(f.timers.size,0);
  assert.equal(f.toggle.textContent,'Play');assert.equal(f.announcement.textContent,'Image 2 / 3');
  f.click(f.dots[2]);assert.equal(f.selected(),2);assert.equal(f.timers.size,0);
  f.click(f.toggle);assert.equal(f.timers.size,1);f.tick();assert.equal(f.selected(),0);f.dispose();
});

test('mouse hover, keyboard focus and a hidden tab suspend autoplay',()=>{
  const f=fixture();
  f.fire(f.root,'pointerenter',{pointerType:'touch'});assert.equal(f.timers.size,1);
  f.fire(f.root,'pointerenter',{pointerType:'mouse'});assert.equal(f.timers.size,0);
  f.fire(f.root,'pointerleave',{pointerType:'mouse'});assert.equal(f.timers.size,1);
  f.fire(f.root,'focusin');assert.equal(f.timers.size,0);
  f.fire(f.root,'focusout',{relatedTarget:f.next});assert.equal(f.timers.size,0);
  f.fire(f.root,'focusout',{relatedTarget:null});assert.equal(f.timers.size,1);
  f.doc.hidden=true;f.fire(f.doc,'visibilitychange');assert.equal(f.timers.size,0);
  f.doc.hidden=false;f.fire(f.doc,'visibilitychange');assert.equal(f.timers.size,1);f.dispose();
});

test('reduced-motion preference disables autoplay, including after preference changes',()=>{
  const f=fixture({reduced:true});assert.equal(f.timers.size,0);assert.equal(f.toggle.disabled,true);
  f.click(f.toggle);assert.equal(f.timers.size,0);
  f.click(f.next);assert.equal(f.selected(),1);
  f.media.matches=false;f.fire(f.media,'change');assert.equal(f.toggle.disabled,false);
  assert.equal(f.timers.size,0); // Manual pause survives the preference change.
  f.click(f.toggle);assert.equal(f.timers.size,1);
  f.media.matches=true;f.fire(f.media,'change');assert.equal(f.timers.size,0);f.dispose();
});

test('arrow keys wrap in both directions and announce only manual changes',()=>{
  const f=fixture();const event=f.fire(f.root,'keydown',{key:'ArrowLeft'});
  assert.equal(event.defaultPrevented,true);assert.equal(f.selected(),2);
  f.fire(f.root,'keydown',{key:'ArrowRight'});assert.equal(f.selected(),0);
  assert.equal(f.announcement.textContent,'Image 1 / 3');assert.equal(f.timers.size,0);f.dispose();
});

test('view cleanup removes timers and event listeners; restored selection stays paused',()=>{
  const f=fixture({initialIndex:2,initialPaused:true});assert.equal(f.selected(),2);assert.equal(f.timers.size,0);
  f.click(f.toggle);assert.equal(f.timers.size,1);f.dispose();assert.equal(f.timers.size,0);
  f.fire(f.root,'pointerleave',{pointerType:'mouse'});f.fire(f.doc,'visibilitychange');f.click(f.next);
  assert.equal(f.timers.size,0);assert.equal(f.selected(),2);
});
