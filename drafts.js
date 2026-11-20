// Unfinished entries live only in this page's memory, never in farm storage/backups.
export const ENTRY_FORMS = Object.freeze({
  'animal-form':'animals', 'treatment-form':'treatments',
  'check-form':'check', 'delivery-form':'deliveries', 'profile-form':'profile'
});
const supported = new Set(['text','tel','date','number','textarea','select-one','radio','checkbox']);
const controls = form => [...form.elements].filter(el => el.name && !el.disabled && supported.has(el.type));
const snapshot = form => controls(form).map(el => ({
  name:el.name, type:el.type, value:el.value,
  ...(['radio','checkbox'].includes(el.type) ? {checked:el.checked} : {})
}));

export function createDrafts() {
  const entries = new Map();
  const baselines = new WeakMap();
  return {
    capture(form) {
      if (!form || !Object.hasOwn(ENTRY_FORMS,form.id) || !baselines.has(form)) return;
      const current = snapshot(form);
      if (JSON.stringify(current) === JSON.stringify(baselines.get(form))) entries.delete(form.id);
      else entries.set(form.id,current);
    },
    restore(form) {
      if (!form || !Object.hasOwn(ENTRY_FORMS,form.id)) return;
      // Compare later edits to the new, empty form, not to the restored draft.
      baselines.set(form,snapshot(form));
      for (const saved of entries.get(form.id) || []) {
        const el = controls(form).find(el => el.name === saved.name && el.type === saved.type &&
          (!['radio','checkbox'].includes(el.type) || el.value === saved.value));
        if (!el) continue;
        if (['radio','checkbox'].includes(el.type)) el.checked = saved.checked;
        else if (el.type === 'select-one') {
          // A deleted/replaced animal must not silently become another selection.
          el.value = [...el.options].some(option => option.value === saved.value) ? saved.value : '';
        } else el.value = saved.value;
      }
    },
    has: formId => entries.has(formId),
    ids: () => [...entries.keys()],
    clear: formId => entries.delete(formId),
    clearAll: () => entries.clear()
  };
}

