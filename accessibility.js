const escapeText = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

// Each view contains a single form. Stable IDs associate each label and its help.
export function fieldMarkup(label, control, help = '') {
  const name = control.match(/\bname="([a-zA-Z][\w-]*)"/)?.[1];
  if (!name) throw new Error('Form control requires a name');
  const id = `field-${name}`;
  const description = help ? ` aria-describedby="${id}-help"` : '';
  const input = control.replace(/<(input|select|textarea)\b/, `<$1 id="${id}"${description}`);
  return `<div class="field"><label for="${id}">${escapeText(label)}</label>${input}${help ? `<div id="${id}-help">${help}</div>` : ''}</div>`;
}

// Run only after deliberate navigation, never during a save or language switch.
export function focusView(doc = document) {
  const heading = doc.querySelector('#app-content h1');
  if (!heading) return false;
  heading.setAttribute('tabindex','-1');
  heading.focus({preventScroll:true});
  return true;
}
