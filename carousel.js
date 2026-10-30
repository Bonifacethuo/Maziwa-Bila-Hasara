// The carousel never moves the page or changes farm records.
export function mountCarousel(root, options = {}) {
  if (!root) return () => {};
  const doc = options.document ?? document;
  const media = options.media ?? window.matchMedia('(prefers-reduced-motion: reduce)');
  const schedule = options.schedule ?? setTimeout;
  const cancel = options.cancel ?? clearTimeout;
  const slides = [...root.querySelectorAll('[data-carousel-slide]')];
  const dots = [...root.querySelectorAll('[data-carousel-index]')];
  const toggle = root.querySelector('[data-carousel-toggle]');
  const announcement = root.querySelector('[data-carousel-announcement]');
  const labels = options.labels ?? {pause:'Pause',play:'Play',reduced:'Auto-play off',image:'Image'};
  let index = Math.max(0, Math.min(slides.length - 1, options.initialIndex ?? 0));
  let paused = options.initialPaused ?? false;
  let hovered = false;
  let focused = root.contains(doc.activeElement);
  let timer;
  let disposed = false;
  const listeners = [];
  function listen(target, name, handler) {
    target.addEventListener(name,handler);
    listeners.push(() => target.removeEventListener(name,handler));
  }
  function restart() {
    cancel(timer); timer = undefined;
    if (!disposed && slides.length > 1 && !paused && !hovered && !focused && !doc.hidden && !media.matches) {
      timer = schedule(() => show(index + 1), options.delay ?? 8000);
    }
  }
  function paint() {
    slides.forEach((slide,i) => { slide.hidden = i !== index; });
    dots.forEach((dot,i) => {
      if (i === index) dot.setAttribute('aria-current','true');
      else dot.removeAttribute('aria-current');
    });
    toggle.textContent = media.matches ? labels.reduced : paused ? labels.play : labels.pause;
    toggle.disabled = media.matches;
    toggle.setAttribute('aria-pressed',String(paused || media.matches));
  }
  function show(next, manual = false) {
    index = ((next % slides.length) + slides.length) % slides.length;
    if (manual) {
      paused = true;
      options.onPauseChange?.(true);
      announcement.textContent = `${labels.image} ${index + 1} / ${slides.length}`;
    }
    paint(); options.onIndexChange?.(index); restart();
  }
  listen(root,'click',event => {
    const target = event.target.closest('[data-carousel-prev],[data-carousel-next],[data-carousel-index],[data-carousel-toggle]');
    if (!target || !root.contains(target)) return;
    if (target.hasAttribute('data-carousel-toggle')) {
      if (media.matches) return;
      paused = !paused; options.onPauseChange?.(paused); paint(); restart();
    } else if (target.hasAttribute('data-carousel-prev')) show(index - 1,true);
    else if (target.hasAttribute('data-carousel-next')) show(index + 1,true);
    else show(Number(target.dataset.carouselIndex),true);
  });
  listen(root,'keydown',event => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault(); show(index + (event.key === 'ArrowLeft' ? -1 : 1),true);
    }
  });
  listen(root,'pointerenter',event => { if (event.pointerType === 'mouse') { hovered = true; restart(); } });
  listen(root,'pointerleave',event => { if (event.pointerType === 'mouse') { hovered = false; restart(); } });
  listen(root,'focusin',() => { focused = true; restart(); });
  listen(root,'focusout',event => { if (!root.contains(event.relatedTarget)) { focused = false; restart(); } });
  listen(doc,'visibilitychange',restart);
  listen(media,'change',() => { paint(); restart(); });
  paint(); restart();
  return () => { disposed = true; cancel(timer); listeners.forEach(remove => remove()); };
}
