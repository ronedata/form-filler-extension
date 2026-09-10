/* Form Filler - capturing a form's layout and finding it again on a later visit.
 *
 * A saved map pins a value type to each individual field of one specific form,
 * so the whole thing can be replayed in one go. Selectors are built to survive
 * re-renders: a unique [name] first, a stable #id next, a structural path last,
 * with a name/label signature as the final fallback.
 */
(function (global) {
  const FF = (global.FF = global.FF || {});

  const FIELD_SELECTOR =
    'input, textarea, select, [contenteditable=""], [contenteditable="true"]';
  const SKIP_TYPES = ['submit', 'reset', 'button', 'image', 'file', 'hidden'];

  /* Root key used when a page has no <form> element at all. */
  const PAGE_KEY = ':page';

  function esc(value) {
    if (global.CSS && typeof global.CSS.escape === 'function') return global.CSS.escape(value);
    return String(value).replace(/["\\]/g, '\\$&');
  }

  function quote(value) {
    return '"' + String(value).replace(/["\\]/g, '\\$&') + '"';
  }

  /* Framework-generated ids change on every render - never pin to them. */
  function isStableId(id) {
    if (!id || typeof id !== 'string') return false;
    if (/^[:.\d]/.test(id)) return false;
    if (/\d{4,}/.test(id)) return false;
    if (/^(ember|yui|ext-gen|mui-|radix-|headlessui-|react-aria)/i.test(id)) return false;
    return true;
  }

  function fieldType(el) {
    if (el.isContentEditable || el.hasAttribute('contenteditable')) return 'contenteditable';
    if (el.tagName === 'TEXTAREA') return 'textarea';
    if (el.tagName === 'SELECT') return 'select';
    return (el.type || 'text').toLowerCase();
  }

  /* Replaying a stale CSRF token would break the submit, so never map one. */
  const TOKEN_RE = /csrf|xsrf|token|nonce|viewstate|authenticity|captcha|requestverification|timestamp/i;

  function isMappable(el) {
    const type = fieldType(el);

    /* A hidden field is worth mapping only when it already holds something -
     * that is where an autocomplete widget stores the id it resolved to. */
    if (type === 'hidden') {
      const naming = (el.getAttribute('name') || '') + ' ' + (el.id || '');
      if (TOKEN_RE.test(naming)) return false;
      return !!(el.value && String(el.value).trim());
    }

    if (SKIP_TYPES.indexOf(type) !== -1) return false;
    return true;
  }

  /* ---------------------------------------------------------------- *
   * Selectors
   * ---------------------------------------------------------------- */
  function structuralPath(el, root) {
    const parts = [];
    let node = el;
    while (node && node !== root && node.parentElement) {
      const parent = node.parentElement;
      const index = Array.prototype.indexOf.call(parent.children, node) + 1;
      parts.unshift(node.tagName.toLowerCase() + ':nth-child(' + index + ')');
      node = parent;
      if (parts.length > 8) break;
    }
    return parts.join(' > ');
  }

  /* Returns { selector, multi } - `multi` marks a radio group, where the
   * selector deliberately matches every button in the group. */
  function buildSelector(el, root) {
    const tag = el.tagName.toLowerCase();
    const name = el.getAttribute('name');
    const type = fieldType(el);

    if (name) {
      const byName = tag + '[name=' + quote(name) + ']';
      if (type === 'radio') return { selector: byName + '[type="radio"]', multi: true };
      if (root.querySelectorAll(byName).length === 1) return { selector: byName, multi: false };
      if (el.type) {
        const byNameType = byName + '[type=' + quote(el.type) + ']';
        if (root.querySelectorAll(byNameType).length === 1) {
          return { selector: byNameType, multi: false };
        }
      }
    }

    if (isStableId(el.id)) {
      const byId = '#' + esc(el.id);
      try {
        if (root.querySelectorAll(byId).length === 1) return { selector: byId, multi: false };
      } catch (err) {
        /* an id CSS cannot express - fall through to the path */
      }
    }

    return { selector: structuralPath(el, root), multi: false };
  }

  /* ---------------------------------------------------------------- *
   * Describing what is on the page
   * ---------------------------------------------------------------- */
  function formLabel(formEl, index) {
    if (formEl === PAGE_KEY) return 'Whole page';
    const heading = formEl.querySelector('legend, h1, h2, h3');
    /* A visible heading reads better than a raw id, so prefer it. */
    const named =
      formEl.getAttribute('aria-label') ||
      (heading && heading.textContent.trim()) ||
      formEl.getAttribute('name') ||
      formEl.id;
    if (named) return String(named).replace(/\s+/g, ' ').trim().slice(0, 60);
    const action = formEl.getAttribute('action');
    if (action) return action.slice(0, 60);
    return 'Form ' + (index + 1);
  }

  function formKey(formEl, index, doc) {
    if (isStableId(formEl.id)) return '#' + esc(formEl.id);
    const name = formEl.getAttribute('name');
    if (name && doc.querySelectorAll('form[name=' + quote(name) + ']').length === 1) {
      return 'form[name=' + quote(name) + ']';
    }
    const action = formEl.getAttribute('action');
    if (action && doc.querySelectorAll('form[action=' + quote(action) + ']').length === 1) {
      return 'form[action=' + quote(action) + ']';
    }
    return 'form:nth-of-type(' + (index + 1) + ')';
  }

  /* The real choices a dropdown or radio group offers, so the options editor
   * can present them instead of an empty text box. */
  function describeChoices(el, root, selector) {
    const type = fieldType(el);
    let raw = [];

    if (type === 'select') {
      raw = Array.prototype.filter.call(el.options, function (opt) {
        return !opt.disabled;
      }).map(function (opt) {
        return { value: opt.value, label: (opt.text || '').replace(/\s+/g, ' ').trim() };
      });
      /* drop the leading "-- Choose --" placeholder */
      if (raw.length && raw[0].value === '' && /select|choose|pick|--|^$/i.test(raw[0].label)) {
        raw = raw.slice(1);
      }
    } else if (type === 'radio') {
      let nodes = [];
      try {
        nodes = Array.prototype.slice.call(root.querySelectorAll(selector));
      } catch (err) {
        nodes = [el];
      }
      raw = nodes.map(function (node) {
        const t = FF.elementTokens(node);
        return { value: node.value, label: (t.label || t['aria-label'] || node.value || '').trim() };
      });
    } else {
      return null;
    }

    if (!raw.length) return null;

    /* Match on the option value when every option has one, otherwise on text. */
    const everyHasValue = raw.every(function (c) {
      return c.value !== '' && c.value !== undefined && c.value !== null;
    });
    return {
      matchBy: everyHasValue ? 'value' : 'text',
      choices: raw.map(function (c) {
        return {
          value: everyHasValue ? String(c.value) : c.label,
          label: c.label || String(c.value)
        };
      })
    };
  }

  /* What the field holds right now. Mapping a form you already filled by hand
   * is the most reliable way to handle AJAX widgets: whatever the widget
   * resolved to, including the hidden id it wrote, is what we replay. */
  function currentValue(el, type, root, selector) {
    if (type === 'checkbox') return el.checked;
    if (type === 'radio') {
      let nodes = [];
      try {
        nodes = Array.prototype.slice.call(root.querySelectorAll(selector));
      } catch (err) {
        nodes = [el];
      }
      const checked = nodes.filter(function (n) {
        return n.checked;
      })[0];
      return checked ? checked.value : '';
    }
    if (type === 'contenteditable') return (el.textContent || '').trim();
    if (type === 'select') {
      const opt = el.options[el.selectedIndex];
      return opt && opt.value !== undefined ? String(opt.value) : '';
    }
    return el.value === undefined || el.value === null ? '' : String(el.value);
  }

  function hasRealValue(value, type) {
    if (type === 'checkbox') return true; /* both states are meaningful */
    return value !== '' && value !== null && value !== undefined;
  }

  function describeField(el, root) {
    const tokens = FF.elementTokens(el);
    const built = buildSelector(el, root);
    const type = fieldType(el);
    const label =
      tokens.label || tokens['aria-label'] || tokens.placeholder || tokens.name || tokens.id || type;
    const picked = describeChoices(el, root, built.selector);
    const value = currentValue(el, type, root, built.selector);

    return {
      selector: built.selector,
      multi: built.multi,
      name: tokens.name || '',
      label: String(label).replace(/\s+/g, ' ').trim().slice(0, 80),
      inputType: type,
      /* what Form Filler would pick on its own - a sensible starting point */
      type: FF.guessType(type === 'textarea' ? 'textarea' : type, FF.tokenList(tokens)),
      choices: picked ? picked.choices : [],
      choiceMatchBy: picked ? picked.matchBy : 'value',
      value: value,
      hasValue: hasRealValue(value, type),
      options: {},
      enabled: true
    };
  }

  function describeContainer(root, doc, filter) {
    const seenRadioGroups = new Set();
    const fields = [];

    Array.prototype.forEach.call(root.querySelectorAll(FIELD_SELECTOR), function (el) {
      if (!isMappable(el)) return;
      if (filter && !filter(el)) return;
      const described = describeField(el, root);
      if (described.multi) {
        const key = described.selector;
        if (seenRadioGroups.has(key)) return;
        seenRadioGroups.add(key);
      }
      if (!described.selector) return;
      fields.push(described);
    });

    return fields;
  }

  /* Everything on the page a user could map, ready to send to the options UI. */
  FF.FormMap = {
    PAGE_KEY: PAGE_KEY,

    describeForms: function describeForms(doc) {
      const out = [];
      const forms = Array.prototype.slice.call(doc.querySelectorAll('form'));

      forms.forEach(function (formEl, index) {
        const fields = describeContainer(formEl, doc);
        if (!fields.length) return;
        out.push({
          key: formKey(formEl, index, doc),
          label: formLabel(formEl, index),
          action: formEl.getAttribute('action') || '',
          fields: fields
        });
      });

      /* Plenty of modern pages have inputs but no <form> - offer the page.
       * Anything already inside a <form> is covered above. */
      const body = doc.body || doc.documentElement;
      const loose = describeContainer(body, doc, function (el) {
        return !el.closest('form');
      });
      if (loose.length) {
        out.push({
          key: PAGE_KEY,
          label: forms.length ? 'Fields outside any form' : 'Whole page',
          action: '',
          fields: loose
        });
      }

      return out;
    },

    /* Locate the mapped container in the current document. */
    findForm: function findForm(map, doc) {
      if (!map || !map.formKey) return null;
      if (map.formKey === PAGE_KEY) return doc.body || doc.documentElement;

      try {
        const direct = doc.querySelector(map.formKey);
        if (direct) return direct;
      } catch (err) {
        /* a selector that no longer parses - fall back to the signature */
      }

      /* The form moved or was renamed: find whichever form holds the most of
       * the fields we mapped. */
      const forms = Array.prototype.slice.call(doc.querySelectorAll('form'));
      let best = null;
      let bestScore = 0;
      forms.forEach(function (formEl) {
        let score = 0;
        (map.entries || []).forEach(function (entry) {
          try {
            if (formEl.querySelector(entry.selector)) score++;
          } catch (err) {
            /* ignore an entry whose selector is invalid */
          }
        });
        if (score > bestScore) {
          bestScore = score;
          best = formEl;
        }
      });

      const needed = Math.max(1, Math.ceil((map.entries || []).length / 2));
      return bestScore >= needed ? best : null;
    },

    /* Resolve one entry to the element(s) it should fill. */
    resolveEntry: function resolveEntry(entry, formEl) {
      if (!entry || !entry.selector || !formEl) return [];
      let nodes = [];
      try {
        nodes = Array.prototype.slice.call(formEl.querySelectorAll(entry.selector));
      } catch (err) {
        nodes = [];
      }

      /* Selector went stale - fall back to matching by name, then by label. */
      if (!nodes.length && (entry.name || entry.label)) {
        const all = Array.prototype.slice.call(formEl.querySelectorAll(FIELD_SELECTOR));
        nodes = all.filter(function (el) {
          if (entry.name && el.getAttribute('name') === entry.name) return true;
          if (!entry.name && entry.label) {
            const tokens = FF.elementTokens(el);
            const label = tokens.label || tokens['aria-label'] || tokens.placeholder;
            return label && label.trim().toLowerCase() === entry.label.toLowerCase();
          }
          return false;
        });
      }

      return entry.multi ? nodes : nodes.slice(0, 1);
    },

    /* Saved maps that apply to this URL, most specific first. */
    matchingMaps: function matchingMaps(maps, url) {
      return (maps || []).filter(function (map) {
        return map.enabled !== false && FF.fieldAppliesToUrl(map, url);
      });
    },

    /* A map entry behaves exactly like a custom field when generating. */
    entryAsField: function entryAsField(entry) {
      return { type: entry.type, options: entry.options || {}, name: entry.label };
    }
  };
})(typeof self !== 'undefined' ? self : this);
