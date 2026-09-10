/* Form Filler - the DOM side: find fillable elements, decide a value, apply it. */
(function (global) {
  const FF = (global.FF = global.FF || {});
  const R = FF.random;

  const FILLABLE_SELECTOR =
    'input, textarea, select, [contenteditable=""], [contenteditable="true"]';

  const TERMS_RE = /agree|terms|accept|consent|privacy|policy|confirm|i am|opt[-_ ]?in/i;
  const HIGHLIGHT_CLASS = 'form-filler-highlight';

  /* ---------------------------------------------------------------- *
   * Element eligibility
   * ---------------------------------------------------------------- */
  function isVisible(el) {
    if (el.type === 'hidden') return false;
    if (el.offsetParent !== null) return true;
    if (el.getClientRects().length) return true;
    const style = el.ownerDocument.defaultView.getComputedStyle(el);
    return !(style.display === 'none' || style.visibility === 'hidden');
  }

  /* `isContentEditable` is not implemented everywhere, and we only ever collect
   * hosts that carry the attribute, so read the attribute directly. */
  function isEditableHost(el) {
    if (el.isContentEditable) return true;
    const attr = el.getAttribute && el.getAttribute('contenteditable');
    return attr === '' || attr === 'true';
  }

  function hasContent(el) {
    if (isEditableHost(el)) return !!el.textContent.trim();
    if (el.type === 'checkbox' || el.type === 'radio') return el.checked;
    if (el.tagName === 'SELECT') return el.selectedIndex > 0;
    return !!(el.value && el.value.trim());
  }

  function elementType(el) {
    if (isEditableHost(el)) return 'contenteditable';
    if (el.tagName === 'TEXTAREA') return 'textarea';
    if (el.tagName === 'SELECT') return 'select';
    return (el.type || 'text').toLowerCase();
  }

  /* `allowHidden` is set for fields a form map names explicitly - the user
   * mapped that hidden input on purpose, usually to carry a resolved id. */
  function isEligible(el, settings, allowHidden) {
    const type = elementType(el);

    if (!allowHidden && settings.ignoredTypes.indexOf(type) !== -1) return false;
    if (type === 'password' && !settings.fillPasswordFields) return false;
    if (settings.ignoreDisabledFields && (el.disabled || el.readOnly)) return false;
    if (!allowHidden && settings.ignoreHiddenFields && !isVisible(el)) return false;
    if (settings.ignoreFieldsWithContent && hasContent(el)) return false;

    const ignored = (settings.ignoredSelectors || '').trim();
    if (ignored) {
      try {
        if (el.matches(ignored)) return false;
      } catch (err) {
        /* a malformed selector should never block filling */
      }
    }
    return true;
  }

  /* ---------------------------------------------------------------- *
   * Value application (React/Vue friendly)
   * ---------------------------------------------------------------- */
  function setNativeValue(el, value) {
    const proto = Object.getPrototypeOf(el);
    const desc = Object.getOwnPropertyDescriptor(proto, 'value');
    if (desc && desc.set) desc.set.call(el, value);
    else el.value = value;
  }

  function setNativeChecked(el, checked) {
    const proto = Object.getPrototypeOf(el);
    const desc = Object.getOwnPropertyDescriptor(proto, 'checked');
    if (desc && desc.set) desc.set.call(el, checked);
    else el.checked = checked;
  }

  function fire(el, type, EventCtor) {
    const win = el.ownerDocument.defaultView || global;
    const Ctor = (EventCtor && win[EventCtor]) || win.Event;
    el.dispatchEvent(new Ctor(type, { bubbles: true, cancelable: true, composed: true }));
  }

  function fireInputEvents(el) {
    fire(el, 'input', 'InputEvent');
    fire(el, 'change');
  }

  function fireClickEvents(el, settings) {
    if (!settings.triggerClickEvents) return;
    ['pointerdown', 'mousedown', 'mouseup', 'click'].forEach(function (type) {
      const ctor = type.indexOf('pointer') === 0 ? 'PointerEvent' : 'MouseEvent';
      fire(el, type, ctor);
    });
  }

  function highlight(el, settings) {
    if (!settings.highlightFilled) return;
    el.classList.add(HIGHLIGHT_CLASS);
    global.setTimeout(function () {
      el.classList.remove(HIGHLIGHT_CLASS);
    }, 1400);
  }

  /* ---------------------------------------------------------------- *
   * Type-specific writers
   * ---------------------------------------------------------------- */
  function clampNumber(el, value) {
    let n = parseFloat(String(value).replace(/[^0-9.\-]/g, ''));
    if (!Number.isFinite(n)) n = R.int(1, 100);
    const min = el.min !== '' ? parseFloat(el.min) : null;
    const max = el.max !== '' ? parseFloat(el.max) : null;
    if (min !== null && n < min) n = min;
    if (max !== null && n > max) n = max;
    const step = parseFloat(el.step);
    if (Number.isFinite(step) && step > 0 && min !== null) {
      n = min + Math.round((n - min) / step) * step;
      n = Number(n.toFixed(6));
    }
    return String(n);
  }

  const NATIVE_FORMATS = {
    date: /^\d{4}-\d{2}-\d{2}$/,
    month: /^\d{4}-\d{2}$/,
    week: /^\d{4}-W\d{2}$/,
    time: /^\d{2}:\d{2}(:\d{2})?$/,
    'datetime-local': /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/,
    color: /^#[0-9a-fA-F]{6}$/
  };

  function nativeValue(type) {
    const d = R.dateBetween();
    switch (type) {
      case 'date': return FF.formatDate(d, 'YYYY-MM-DD');
      case 'month': return FF.formatDate(d, 'YYYY-MM');
      case 'week': return FF.formatDate(d, 'YYYY') + '-W' + String(R.int(1, 52)).padStart(2, '0');
      case 'time': return FF.formatDate(d, 'HH:mm');
      case 'datetime-local': return FF.formatDate(d, 'YYYY-MM-DDTHH:mm');
      case 'color': return '#' + R.chars('0123456789abcdef', 6);
      default: return '';
    }
  }

  /* Native pickers only accept one shape - regenerate if the custom value
   * would be rejected by the browser. */
  function coerce(el, type, value) {
    if (value === null || value === undefined) return value;
    const format = NATIVE_FORMATS[type];
    if (format && !format.test(String(value))) return nativeValue(type);
    if (type === 'number' || type === 'range') return clampNumber(el, value);

    let text = String(value);
    const maxLength = parseInt(el.getAttribute('maxlength'), 10);
    if (Number.isFinite(maxLength) && maxLength > 0) text = text.slice(0, maxLength);
    return text;
  }

  function writeText(el, value, settings) {
    el.focus({ preventScroll: true });
    if (isEditableHost(el)) {
      el.textContent = value;
    } else {
      setNativeValue(el, value);
    }
    fire(el, 'keydown', 'KeyboardEvent');
    fireInputEvents(el);
    fire(el, 'keyup', 'KeyboardEvent');
    fire(el, 'blur');
    highlight(el, settings);
  }

  function writeChecked(el, checked, settings) {
    if (el.checked === checked) {
      highlight(el, settings);
      return;
    }
    setNativeChecked(el, checked);
    fireClickEvents(el, settings);
    if (el.checked !== checked) setNativeChecked(el, checked);
    fireInputEvents(el);
    highlight(el, settings);
  }

  function optionCandidates(el) {
    return Array.prototype.filter.call(el.options, function (opt, index) {
      if (opt.disabled) return false;
      if (index === 0 && (opt.value === '' || /select|choose|pick|--/i.test(opt.text))) return false;
      return opt.value !== '' || opt.text.trim() !== '';
    });
  }

  /* Settings' "never randomly pick" list - a substring match against both the
   * option's value and its visible text, so "n/a" catches value="NA" and
   * text="N/A" alike. Never applied to a rule or map entry naming an option
   * on purpose - only to the "pick anything" fallback. */
  function excludedOptionWords(settings) {
    return FF.toList(settings && settings.excludedOptionWords).map(function (w) {
      return w.toLowerCase();
    });
  }

  function isExcludedOption(value, text, excluded) {
    if (!excluded.length) return false;
    const v = String(value || '').toLowerCase();
    const t = String(text || '').toLowerCase();
    return excluded.some(function (word) {
      return word && (v.indexOf(word) !== -1 || t.indexOf(word) !== -1);
    });
  }

  function writeSelect(el, field, settings) {
    const candidates = optionCandidates(el);
    if (!candidates.length) return false;

    let chosen = null;
    if (field && field.type === 'selectOption') {
      const wanted = FF.toList(field.options && field.options.values);
      const matchBy = (field.options && field.options.matchBy) || 'value';
      if (wanted.length) {
        const pool = candidates.filter(function (opt) {
          const hay = matchBy === 'text' ? opt.text : opt.value;
          return wanted.some(function (w) {
            return String(hay).trim().toLowerCase() === w.toLowerCase();
          });
        });
        chosen = pool.length ? R.pick(pool) : null;
      }
    } else if (field && (field.type === 'constant' || field.type === 'randomizedList')) {
      const value = FF.generateForField(field, settings);
      chosen =
        candidates.find(function (opt) {
          return opt.value === value || opt.text.trim() === value;
        }) || null;
    }

    if (!chosen) {
      const excluded = excludedOptionWords(settings);
      const pool = excluded.length
        ? candidates.filter(function (opt) {
            return !isExcludedOption(opt.value, opt.text, excluded);
          })
        : candidates;
      /* Everything left is on the block list - leave the field alone rather
       * than pick one of the options the user said never to choose. */
      if (!pool.length) return false;
      chosen = R.pick(pool);
    }
    if (!chosen) return false;

    if (el.multiple) {
      Array.prototype.forEach.call(el.options, function (o) {
        o.selected = false;
      });
      chosen.selected = true;
    } else {
      setNativeValue(el, chosen.value);
      if (el.value !== chosen.value) el.selectedIndex = chosen.index;
    }
    fireInputEvents(el);
    highlight(el, settings);
    return true;
  }

  function writeRadioGroup(radios, field, settings) {
    const usable = radios.filter(function (r) {
      return !r.disabled;
    });
    if (!usable.length) return false;

    let chosen = null;
    if (field && (field.type === 'selectOption' || field.type === 'constant' || field.type === 'randomizedList')) {
      const wanted =
        field.type === 'selectOption'
          ? FF.toList(field.options && field.options.values)
          : [FF.generateForField(field, settings)];
      const matchBy = (field.options && field.options.matchBy) || 'value';
      const pool = usable.filter(function (r) {
        const hay = matchBy === 'text' ? (FF.elementTokens(r).label || r.value) : r.value;
        return wanted.some(function (w) {
          return String(hay).trim().toLowerCase() === String(w).trim().toLowerCase();
        });
      });
      chosen = pool.length ? R.pick(pool) : null;
    }

    if (!chosen) {
      const excluded = excludedOptionWords(settings);
      const pool = excluded.length
        ? usable.filter(function (r) {
            const label = FF.elementTokens(r).label || r.value;
            return !isExcludedOption(r.value, label, excluded);
          })
        : usable;
      /* Everything left is on the block list - leave the group alone rather
       * than pick one of the options the user said never to choose. */
      if (!pool.length) return false;
      chosen = R.pick(pool);
    }

    writeChecked(chosen, true, settings);
    return true;
  }

  /* ---------------------------------------------------------------- *
   * Deciding what a single element should get
   * ---------------------------------------------------------------- */
  function valueForElement(el, field, settings, tokens) {
    const type = elementType(el);

    if (field) {
      const generated = FF.generateForField(field, settings);
      return coerce(el, type, generated);
    }

    if (NATIVE_FORMATS[type]) return nativeValue(type);
    if (type === 'number' || type === 'range') {
      const min = el.min !== '' ? parseFloat(el.min) : settings.defaultNumberMin;
      const max = el.max !== '' ? parseFloat(el.max) : settings.defaultNumberMax;
      return clampNumber(el, R.int(min, max));
    }

    const guessed = FF.guessType(type === 'textarea' ? 'textarea' : type, FF.tokenList(tokens));
    const opts = {};
    if (guessed === 'text' && type === 'textarea') {
      opts.minWords = settings.defaultTextMinWords;
      opts.maxWords = settings.defaultTextMaxWords;
    } else if (guessed === 'text') {
      opts.minWords = 1;
      opts.maxWords = 3;
    }
    if (settings.defaultMaxLength > 0) opts.maxLength = settings.defaultMaxLength;

    return coerce(el, type, FF.generateValue(guessed, opts, settings));
  }

  function checkboxState(el, field, settings, tokens) {
    if (field) {
      if (field.type === 'checked') {
        const mode = (field.options && field.options.mode) || 'random';
        if (mode === 'always') return true;
        if (mode === 'never') return false;
        return R.bool();
      }
      const value = FF.generateForField(field, settings);
      if (typeof value === 'boolean') return value;
      return /^(true|yes|1|on|checked)$/i.test(String(value));
    }
    if (settings.agreeToTerms && TERMS_RE.test(FF.tokenList(tokens).join(' '))) return true;
    return R.bool();
  }

  /* ---------------------------------------------------------------- *
   * Waiting - dependent dropdowns and suggestion lists load over the wire
   * ---------------------------------------------------------------- */
  function sleep(ms) {
    return new Promise(function (resolve) {
      global.setTimeout(resolve, ms);
    });
  }

  /* Resolves with the first truthy result of `test`, or null on timeout. */
  function waitFor(test, timeoutMs, intervalMs) {
    return new Promise(function (resolve) {
      const started = Date.now();
      const interval = intervalMs || 100;
      (function poll() {
        let result = null;
        try {
          result = test();
        } catch (err) {
          result = null;
        }
        if (result) {
          resolve(result);
          return;
        }
        if (Date.now() - started >= timeoutMs) {
          resolve(null);
          return;
        }
        global.setTimeout(poll, interval);
      })();
    });
  }

  /* A dropdown whose parent has just changed is usually empty while its AJAX
   * request is in flight. Give it a moment rather than skipping it. */
  function awaitOptions(el, timeoutMs) {
    if (optionCandidates(el).length) return Promise.resolve(true);
    return waitFor(
      function () {
        return optionCandidates(el).length > 0;
      },
      timeoutMs,
      100
    ).then(function (found) {
      return !!found;
    });
  }

  /* Loading overlays that mean "a request is in flight". blockUI is what the
   * big jQuery back-office apps use; aria-busy is the standard way. */
  const BUSY_SELECTOR = '.blockUI, .blockOverlay, [aria-busy="true"]';

  /* How long the page must stay still before a choice counts as settled:
   * briefly if it never reacted, longer once it has started changing. */
  const QUIET_IF_NOTHING_MS = 60;
  const QUIET_AFTER_REACTION_MS = 250;

  function busyIndicatorShown(doc) {
    let nodes = [];
    try {
      nodes = Array.prototype.slice.call(doc.querySelectorAll(BUSY_SELECTOR));
    } catch (err) {
      return false;
    }
    return nodes.some(function (node) {
      return node.getClientRects().length > 0 || node.offsetParent !== null;
    });
  }

  /* Watch the form while a choice is made. If the page reacts - swaps another
   * dropdown's options, empties a list, puts up a loading overlay - wait until
   * it goes quiet. If nothing happens straight away, carry on at full speed. */
  function watchForReaction(el) {
    const doc = el.ownerDocument;
    const win = doc.defaultView || global;
    const Observer = win.MutationObserver || global.MutationObserver;
    const root = el.form || (el.closest && el.closest('form')) || doc.body || doc.documentElement;
    let lastChange = 0;
    let observer = null;

    if (Observer) {
      observer = new Observer(function (records) {
        for (let i = 0; i < records.length; i++) {
          const target = records[i].target;
          /* the dropdown's own option list changing is not a reaction */
          if (target === el || el.contains(target)) continue;
          lastChange = Date.now();
          return;
        }
      });
      observer.observe(root, { childList: true, subtree: true });
    }

    function stop() {
      if (observer) observer.disconnect();
    }

    return {
      stop: stop,
      /* Resolves true if the page reacted at all. */
      settle: function (maxMs) {
        const started = Date.now();
        let sawBusy = false;
        return new Promise(function (resolve) {
          (function check() {
            const now = Date.now();
            const busy = busyIndicatorShown(doc);
            if (busy) sawBusy = true;
            const quietFor = now - (lastChange || started);
            const needed = lastChange ? QUIET_AFTER_REACTION_MS : QUIET_IF_NOTHING_MS;
            if (now - started >= maxMs || (!busy && quietFor >= needed)) {
              stop();
              resolve(sawBusy || lastChange > 0);
              return;
            }
            global.setTimeout(check, 40);
          })();
        });
      }
    };
  }

  /* Per-run state shared by every element in one fill. */
  function fillContext(settings, map) {
    const mapWait = map ? FF.numberOr(map.waitForOptionsMs, 3000) : 0;
    return {
      settings: settings,
      waitForDropdowns: map ? mapWait > 0 : settings.waitForDropdowns !== false,
      dropdownWaitMs: map ? mapWait : FF.numberOr(settings.dropdownWaitMs, 3000),
      /* a saved map was captured in page order on purpose - trust it */
      alwaysWaitForEmpty: !!map,
      lastReactionAt: 0
    };
  }

  function shouldWaitForOptions(el, ctx) {
    if (!ctx || !ctx.waitForDropdowns || optionCandidates(el).length) return false;
    if (ctx.alwaysWaitForEmpty) return true;
    /* On a quiet page an empty dropdown stays empty - only wait while
     * something is actually loading. */
    return Date.now() - ctx.lastReactionAt < ctx.dropdownWaitMs || busyIndicatorShown(el.ownerDocument);
  }

  /* Make a choice that may cause other fields to reload, then give the page
   * time to finish reacting before anything further is filled. */
  function chooseAndSettle(el, ctx, write) {
    if (!ctx || !ctx.waitForDropdowns) return Promise.resolve(write());
    const watcher = watchForReaction(el);
    const result = write();
    if (!result) {
      watcher.stop();
      return Promise.resolve(result);
    }
    return watcher.settle(ctx.dropdownWaitMs).then(function (reacted) {
      if (reacted) ctx.lastReactionAt = Date.now();
      return result;
    });
  }

  /* ---------------------------------------------------------------- *
   * Lookup fields: type, wait for the suggestion list, take one
   * ---------------------------------------------------------------- */

  /* Widgets that render their own suggestion list, in rough order of how
   * common they are. Used when neither the rule nor Settings names one. */
  const SUGGESTION_SELECTOR = [
    '[role="option"]',
    '.ui-autocomplete li',
    '.ui-menu-item',
    '.tt-suggestion',
    '.autocomplete-suggestion',
    '.autocomplete-items div',
    '.select2-results__option',
    '.typeahead li',
    '.awesomplete li',
    '.suggestions li',
    '.dropdown-menu li',
    '.autocomplete-result'
  ].join(', ');

  function visibleSuggestions(selector, source) {
    let nodes = [];
    try {
      nodes = Array.prototype.slice.call(document.querySelectorAll(selector));
    } catch (err) {
      return [];
    }

    const usable = nodes.filter(function (node) {
      if (node === source || node.contains(source)) return false;
      if (node.getAttribute && node.getAttribute('aria-disabled') === 'true') return false;
      if (!node.textContent || !node.textContent.trim()) return false;
      return node.getClientRects().length > 0 || node.offsetParent !== null;
    });

    /* Markup like `<li><a role="option">` matches the built-in selector twice,
     * which would list every suggestion two times and throw the numbering off.
     * Keep only the innermost match of each nest. */
    return usable.filter(function (node) {
      return !usable.some(function (other) {
        return other !== node && node.contains(other);
      });
    });
  }

  const HIGHLIGHT_RE = /(^|\s)(active|selected|highlighted|is-selected|focused)(\s|$)/;

  /* Which suggestion the widget currently treats as chosen, or -1. */
  function highlightedIndex(items) {
    for (let i = 0; i < items.length; i++) {
      let node = items[i];
      /* the marker often sits on the <li> wrapping an <a role="option"> */
      for (let hop = 0; node && hop < 3; hop++) {
        const cls = typeof node.className === 'string' ? node.className : '';
        if (HIGHLIGHT_RE.test(cls) || node.getAttribute('aria-selected') === 'true') return i;
        node = node.parentElement;
      }
    }
    return -1;
  }

  /* Bootstrap-style typeaheads commit whichever item carries the `active`
   * class, and set that class on hover - so a bare click always takes the
   * first suggestion. Hover the one we actually want first. */
  function hoverOver(el) {
    const win = el.ownerDocument.defaultView || global;
    const Ctor = win.MouseEvent || win.Event;
    const body = el.ownerDocument.body;
    [
      ['mouseover', true],
      ['mouseenter', false],
      ['mousemove', true]
    ].forEach(function (pair) {
      let event;
      try {
        event = new Ctor(pair[0], { bubbles: pair[1], cancelable: true, relatedTarget: body });
      } catch (err) {
        event = new win.Event(pair[0], { bubbles: pair[1], cancelable: true });
      }
      el.dispatchEvent(event);
    });
  }

  function typeInto(el, text) {
    el.focus({ preventScroll: true });
    /* clear first - a stale value stops some widgets from searching again */
    setNativeValue(el, '');
    fire(el, 'input', 'InputEvent');
    setNativeValue(el, text);
    fire(el, 'keydown', 'KeyboardEvent');
    fire(el, 'input', 'InputEvent');
    fire(el, 'keyup', 'KeyboardEvent');
  }

  function pressKey(el, name, code) {
    const win = el.ownerDocument.defaultView || global;
    const Ctor = win.KeyboardEvent || win.Event;
    ['keydown', 'keyup'].forEach(function (type) {
      let event;
      try {
        event = new Ctor(type, {
          key: name,
          code: name,
          keyCode: code,
          which: code,
          bubbles: true,
          cancelable: true
        });
      } catch (err) {
        event = new win.Event(type, { bubbles: true, cancelable: true });
      }
      el.dispatchEvent(event);
    });
  }

  /* Type one query and commit a suggestion. Resolves 1 when one was taken. */
  function trySuggestion(el, settings, opts) {
    const query = String(opts.query || '').trim();
    if (!query) return Promise.resolve(0);

    const selector = String(opts.suggestionSelector || '').trim() || SUGGESTION_SELECTOR;
    typeInto(el, query);

    return waitFor(
      function () {
        const found = visibleSuggestions(selector, el);
        return found.length ? found : null;
      },
      opts.waitMs,
      120
    ).then(function (items) {
      if (!items) return 0;

      let chosen = items[0];
      if (opts.pick === 'random') {
        chosen = R.pick(items);
      } else if (opts.pick === 'match' && opts.matchText) {
        const wanted = String(opts.matchText).toLowerCase();
        chosen =
          items.find(function (item) {
            return item.textContent.toLowerCase().indexOf(wanted) !== -1;
          }) || items[0];
      }

      if (opts.commit === 'keyboard') {
        /* Some widgets pre-select the first suggestion, others select nothing
         * until the first arrow press. Count from wherever the list already is. */
        const from = highlightedIndex(items);
        const to = items.indexOf(chosen);
        const steps = from < 0 ? to + 1 : to - from;
        for (let i = 0; i < Math.abs(steps); i++) {
          if (steps > 0) pressKey(el, 'ArrowDown', 40);
          else pressKey(el, 'ArrowUp', 38);
        }
        pressKey(el, 'Enter', 13);
      } else {
        hoverOver(chosen);
        /* Most widgets commit on mousedown, before the input loses focus. */
        fireClickEvents(chosen, settings);
      }

      highlight(el, settings);
      return 1;
    });
  }

  function suggestionDefaults(settings) {
    return {
      waitMs: FF.numberOr(settings.suggestionWaitMs, 3500),
      commit: settings.suggestionCommit || 'click',
      suggestionSelector: settings.suggestionSelector || '',
      pick: settings.suggestionPick || 'first'
    };
  }

  /* An Autocomplete rule: its own options, anything left empty from Settings. */
  function fillAutocomplete(el, field, settings) {
    const own = (field && field.options) || {};
    const defaults = suggestionDefaults(settings);
    const ownWait = own.waitMs === '' || own.waitMs === undefined || own.waitMs === null;

    return trySuggestion(el, settings, {
      query: own.query,
      pick: own.pick || 'first',
      matchText: own.matchText,
      waitMs: ownWait ? defaults.waitMs : FF.numberOr(own.waitMs, defaults.waitMs),
      commit: own.commit || defaults.commit,
      suggestionSelector: own.suggestionSelector || defaults.suggestionSelector
    }).then(function (taken) {
      /* No list appeared. The typed text is still there, which is the best we
       * can do, but it never resolved to a real choice. */
      if (!taken) highlight(el, settings);
      return taken;
    });
  }

  /* Short searches to try against a lookup we know nothing about, grouped by
   * length. A query has to be at least as long as the widget's own minimum
   * (jQuery UI's `minLength`, typeahead's, etc.) or it never even searches -
   * but a longer query is less likely to be a substring of whatever the real
   * suggestions say, so once the length satisfies that minimum there is no
   * benefit to going longer. Settings decides the length; this picks several
   * different tries at that length to raise the odds one of them hits. */
  const QUERY_POOL_BY_LENGTH = {
    1: ['a', 'e', 'i', 'o', 'r', 'n', 's', 'm', 'k', 'h', 'd', 'b', 't', 'l'],
    2: ['ra', 'na', 'ka', 'ma', 'ta', 'sa', 'la', 'ha', 'da', 'ba', 'an', 'ar', 'al', 'in', 'on', 'ah'],
    3: ['dha', 'col', 'isl', 'rah', 'ahm', 'kha', 'hos', 'nus', 'far', 'jah', 'tan', 'sha', 'ban', 'mia'],
    4: ['rahm', 'ahme', 'khan', 'akte', 'dhak', 'isla', 'nusr', 'jaha', 'hoss', 'fari']
  };
  const MAX_QUERY_TRIES = 6;

  function buildAutoQueries(minChars) {
    const min = Math.max(1, Math.min(4, Math.round(FF.numberOr(minChars, 2))));
    const queries = [];
    for (let len = min; len <= 4 && queries.length < MAX_QUERY_TRIES; len++) {
      (QUERY_POOL_BY_LENGTH[len] || []).forEach(function (q) {
        if (queries.length < MAX_QUERY_TRIES) queries.push(q);
      });
    }
    return queries;
  }
  FF.buildAutoQueries = buildAutoQueries;

  /* A lookup box no rule covers: find any real suggestion and take it, so the
   * id the widget stores behind the scenes gets set. */
  async function fillLookup(el, settings) {
    const defaults = suggestionDefaults(settings);
    const queries = buildAutoQueries(settings.suggestionMinChars);
    const perTry = Math.max(700, Math.round(defaults.waitMs / queries.length));

    for (let i = 0; i < queries.length; i++) {
      const taken = await trySuggestion(el, settings, {
        query: queries[i],
        pick: defaults.pick,
        waitMs: perTry,
        commit: defaults.commit,
        suggestionSelector: defaults.suggestionSelector
      });
      if (taken) return 1;
    }

    /* Nothing came back. Leave the box empty rather than holding a fragment
     * that never resolved to a real choice. */
    setNativeValue(el, '');
    fireInputEvents(el);
    return 0;
  }

  const LOOKUP_CLASS_RE = /(^|[\s_-])(typeahead|autocomplete|autosuggest|tt-input|awesomplete|combobox)([\s_-]|$)/i;

  function commonPrefixLength(a, b) {
    let i = 0;
    while (i < a.length && i < b.length && a[i] === b[i]) i++;
    return i;
  }

  /* The pattern behind most home-grown lookups: a visible box for the name and
   * an empty hidden input beside it for the id, e.g. LastInstituteName and
   * LastInstituteId. Kept strict so ordinary forms are not mistaken for one. */
  function hasCompanionIdField(el) {
    const parent = el.parentElement;
    const name = String(el.name || el.id || '').toLowerCase();
    if (!parent || name.length < 4) return false;

    const controls = parent.querySelectorAll('input, select, textarea');
    if (controls.length > 4) return false;

    return Array.prototype.some.call(controls, function (other) {
      if (other === el || other.type !== 'hidden' || other.value) return false;
      const otherName = String(other.name || other.id || '').toLowerCase();
      return /id$/.test(otherName) && commonPrefixLength(name, otherName) >= 4;
    });
  }

  function looksLikeLookup(el) {
    const attr = function (n) {
      return String((el.getAttribute && el.getAttribute(n)) || '').toLowerCase();
    };
    if (attr('role') === 'combobox') return true;
    if (['list', 'both', 'inline'].indexOf(attr('aria-autocomplete')) !== -1) return true;
    if (attr('aria-haspopup') === 'listbox') return true;
    if (attr('data-provide') === 'typeahead') return true;
    if (LOOKUP_CLASS_RE.test(typeof el.className === 'string' ? el.className : '')) return true;
    return hasCompanionIdField(el);
  }

  /* <input list="…"> offers its own choices - take one directly. */
  function datalistValues(el) {
    const id = el.getAttribute && el.getAttribute('list');
    const list = id && el.ownerDocument.getElementById(id);
    if (!list) return [];
    return Array.prototype.map
      .call(list.querySelectorAll('option'), function (opt) {
        return opt.value || opt.textContent.trim();
      })
      .filter(Boolean);
  }

  /* One element, one decision. Shared by every kind of fill.
   * Returns a promise: suggestion lists and dependent dropdowns have to wait. */
  function applyValue(el, field, settings, radioGroup, ctx) {
    if (field && field.type === 'skip') return Promise.resolve(0);

    const type = elementType(el);
    const tokens = FF.elementTokens(el);

    if (field && field.type === 'autocomplete') {
      return fillAutocomplete(el, field, settings);
    }

    if (type === 'radio') {
      return chooseAndSettle(radioGroup ? radioGroup[0] : el, ctx, function () {
        return writeRadioGroup(radioGroup || [el], field, settings) ? 1 : 0;
      });
    }
    if (type === 'checkbox') {
      return chooseAndSettle(el, ctx, function () {
        writeChecked(el, checkboxState(el, field, settings, tokens), settings);
        return 1;
      });
    }
    if (type.indexOf('select') === 0) {
      const ready = shouldWaitForOptions(el, ctx) ? awaitOptions(el, ctx.dropdownWaitMs) : Promise.resolve(true);
      return ready.then(function () {
        return chooseAndSettle(el, ctx, function () {
          return writeSelect(el, field, settings) ? 1 : 0;
        });
      });
    }

    /* Without a rule, a lookup box gets a real suggestion rather than made-up
     * text the page would never accept. A rule always wins. */
    if (!field && settings.autoPickSuggestions !== false && (type === 'text' || type === 'search')) {
      const listed = datalistValues(el);
      if (listed.length) {
        writeText(el, R.pick(listed), settings);
        return Promise.resolve(1);
      }
      if (looksLikeLookup(el)) return fillLookup(el, settings);
    }

    const value = valueForElement(el, field, settings, tokens);
    if (value === null || value === undefined || value === '') return Promise.resolve(0);
    writeText(el, value, settings);
    return Promise.resolve(1);
  }

  /* Selects and radios are what make a dependent field reload, so a form map
   * pauses after those only - plain text fields need no settling time. */
  function cascades(type) {
    return type === 'radio' || type.indexOf('select') === 0;
  }

  /* ---------------------------------------------------------------- *
   * Public API
   * ---------------------------------------------------------------- */
  function collect(root) {
    const nodes = [];
    const push = function (list) {
      Array.prototype.push.apply(nodes, Array.prototype.slice.call(list));
    };
    if (root.matches && root.matches(FILLABLE_SELECTOR)) nodes.push(root);
    push(root.querySelectorAll(FILLABLE_SELECTOR));

    /* reach into open shadow roots too */
    const hosts = root.querySelectorAll('*');
    for (let i = 0; i < hosts.length; i++) {
      if (hosts[i].shadowRoot) push(hosts[i].shadowRoot.querySelectorAll(FILLABLE_SELECTOR));
    }
    return nodes;
  }

  function radioKey(el) {
    const form = el.form ? el.form.name || el.form.id || 'form' : 'noform';
    return form + '::' + (el.name || el.id || Math.random());
  }

  /* element -> pseudo field, for every element a saved map pins down. */
  function mappedFields(root, options, url) {
    const out = new Map();
    if (!FF.FormMap) return out;

    FF.FormMap.matchingMaps(options.forms, url).forEach(function (map) {
      const formEl = FF.FormMap.findForm(map, document);
      if (!formEl) return;
      if (root !== document.documentElement && !root.contains(formEl) && !formEl.contains(root)) return;

      (map.entries || []).forEach(function (entry) {
        if (entry.enabled === false) return;
        FF.FormMap.resolveEntry(entry, formEl).forEach(function (el) {
          if (!out.has(el)) out.set(el, FF.FormMap.entryAsField(entry));
        });
      });
    });
    return out;
  }

  /* Fill every eligible element inside `root`, in page order. Resolves with
   * the count. */
  async function fillRoot(root, options) {
    const settings = options.settings;
    const fields = options.fields || [];
    const url = global.location ? global.location.href : '';
    const mapped = mappedFields(root, options, url);
    const ctx = fillContext(settings);

    const elements = collect(root);
    const handledRadioGroups = new Set();
    let filled = 0;

    for (let i = 0; i < elements.length; i++) {
      const el = elements[i];
      const mappedField = mapped.get(el);
      if (!isEligible(el, settings, !!mappedField)) continue;

      /* A saved map is the most specific thing there is, so it wins. */
      const field = mappedField || FF.findMatchingField(fields, el, url);
      if (field && field.type === 'skip') continue;

      const type = elementType(el);

      try {
        let group = null;
        if (type === 'radio') {
          const key = radioKey(el);
          if (handledRadioGroups.has(key)) continue;
          handledRadioGroups.add(key);
          group = elements.filter(function (other) {
            return other.type === 'radio' && radioKey(other) === key;
          });
        }
        filled += await applyValue(el, field, settings, group, ctx);
      } catch (err) {
        /* one bad element must never abort the whole page */
        if (global.console) console.warn('[Form Filler] could not fill an element', el, err);
      }
    }

    return filled;
  }

  FF.Filler = {
    fillPage: function (options) {
      return fillRoot(document.documentElement, options);
    },
    fillForm: function (el, options) {
      const root = (el && (el.closest('form') || el.parentElement)) || document.documentElement;
      return fillRoot(root, options);
    },
    fillElement: async function (el, options) {
      if (!el) return 0;
      const settings = options.settings;
      const url = global.location ? global.location.href : '';
      const mapped = mappedFields(document.documentElement, options, url);
      const field = mapped.get(el) || FF.findMatchingField(options.fields || [], el, url);
      if (field && field.type === 'skip') return 0;

      return applyValue(el, field, settings, null, fillContext(settings));
    },

    /* Replay one saved map against the form it describes.
     *
     * Entries run in the order they were captured, and the run pauses after a
     * dropdown or radio so a dependent field downstream has time to reload.
     * An empty dropdown is waited on rather than skipped. */
    fillMap: async function (map, options, formEl) {
      const settings = options.settings;
      const target = formEl || FF.FormMap.findForm(map, document);
      if (!target) return 0;

      const ctx = fillContext(settings, map);
      const settleMs = FF.numberOr(map.stepDelayMs, 350);
      const entries = map.entries || [];
      let filled = 0;

      for (let i = 0; i < entries.length; i++) {
        const entry = entries[i];
        if (entry.enabled === false || entry.type === 'skip') continue;

        const field = FF.FormMap.entryAsField(entry);

        try {
          /* The element may not exist yet if an earlier choice reveals it. */
          let nodes = FF.FormMap.resolveEntry(entry, target);
          if (!nodes.length && settleMs > 0) {
            await waitFor(function () {
              const found = FF.FormMap.resolveEntry(entry, target);
              return found.length ? found : null;
            }, ctx.dropdownWaitMs, 100);
            nodes = FF.FormMap.resolveEntry(entry, target);
          }
          if (!nodes.length) continue;

          let added = 0;
          if (entry.multi) {
            const usable = nodes.filter(function (el) {
              return isEligible(el, settings, true);
            });
            if (usable.length) added = await applyValue(usable[0], field, settings, usable, ctx);
          } else {
            const el = nodes[0];
            if (!isEligible(el, settings, true)) continue;
            added = await applyValue(el, field, settings, null, ctx);
          }

          filled += added;

          /* Give the page a beat to load whatever this choice unlocks. */
          if (settleMs > 0 && (cascades(entry.inputType || '') || entry.type === 'autocomplete')) {
            await sleep(settleMs);
          }
        } catch (err) {
          if (global.console) console.warn('[Form Filler] map entry failed', entry, err);
        }
      }
      return filled;
    },

    findForm: function (map) {
      return FF.FormMap ? FF.FormMap.findForm(map, document) : null;
    },
    isEligible: isEligible,
    elementType: elementType,
    looksLikeLookup: looksLikeLookup,
    HIGHLIGHT_CLASS: HIGHLIGHT_CLASS
  };
})(typeof self !== 'undefined' ? self : this);
