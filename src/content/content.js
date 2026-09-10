/* Form Filler - content script entry point: tracks context and handles commands. */
(function (global) {
  const FF = global.FF;
  if (!FF || !FF.Filler) return;

  let cachedOptions = null;
  let lastFocused = null;
  let lastContextElement = null;

  const STYLE_ID = 'form-filler-style';

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent =
      '.' + FF.Filler.HIGHLIGHT_CLASS + '{' +
      'outline:2px solid #22c55e !important;' +
      'outline-offset:1px !important;' +
      'transition:outline-color .4s ease;' +
      '}' +
      '#form-filler-toast{' +
      'position:fixed;z-index:2147483647;right:16px;bottom:16px;' +
      'background:#111827;color:#f9fafb;font:13px/1.4 system-ui,-apple-system,Segoe UI,sans-serif;' +
      'padding:10px 14px;border-radius:8px;box-shadow:0 8px 24px rgba(0,0,0,.28);' +
      'pointer-events:none;opacity:0;transform:translateY(6px);transition:opacity .18s,transform .18s;' +
      '}' +
      '#form-filler-toast.is-visible{opacity:1;transform:translateY(0);}';
    (document.head || document.documentElement).appendChild(style);
  }

  let toastTimer = null;
  function toast(message) {
    if (!document.body) return;
    injectStyles();
    let node = document.getElementById('form-filler-toast');
    if (!node) {
      node = document.createElement('div');
      node.id = 'form-filler-toast';
      document.body.appendChild(node);
    }
    node.textContent = message;
    requestAnimationFrame(function () {
      node.classList.add('is-visible');
    });
    global.clearTimeout(toastTimer);
    toastTimer = global.setTimeout(function () {
      node.classList.remove('is-visible');
    }, 1800);
  }

  function getOptions() {
    if (cachedOptions) return Promise.resolve(cachedOptions);
    return FF.loadOptions().then(function (options) {
      cachedOptions = options;
      return options;
    });
  }

  FF.onOptionsChanged(function (options) {
    cachedOptions = options;
  });

  document.addEventListener(
    'focusin',
    function (event) {
      lastFocused = event.target;
    },
    true
  );

  document.addEventListener(
    'contextmenu',
    function (event) {
      lastContextElement = event.target;
    },
    true
  );

  /* The right-click target is only meaningful for a context-menu action; a
   * keyboard shortcut must always act on whatever is focused right now. */
  function targetElement(source) {
    if (source === 'menu' && lastContextElement) return lastContextElement;
    const active = document.activeElement;
    if (active && active !== document.body && active !== document.documentElement) return active;
    return lastFocused;
  }

  function run(action, source) {
    return getOptions().then(function (options) {
      injectStyles();
      return dispatch(action, source, options);
    });
  }

  async function dispatch(action, source, options) {
    let count = 0;

    if (action === 'fill-all-fields') {
      if (options.settings.confirmPageFill && !global.confirm('Fill every field on this page?')) {
        return { count: 0, cancelled: true };
      }
      count = await FF.Filler.fillPage(options);
      toast(count ? 'Filled ' + count + ' field' + (count === 1 ? '' : 's') : 'No fillable fields found');
    } else if (action === 'fill-mapped-forms') {
      const maps = FF.FormMap.matchingMaps(options.forms, location.href);
      for (let i = 0; i < maps.length; i++) {
        const formEl = FF.FormMap.findForm(maps[i], document);
        if (!formEl) continue;
        alreadyFilled.delete(formEl); /* an explicit request always runs */
        count += await FF.Filler.fillMap(maps[i], options, formEl);
      }
      toast(count ? 'Filled ' + count + ' mapped field' + (count === 1 ? '' : 's') : 'No saved map matched this page');
    } else if (action === 'fill-this-form') {
      const el = targetElement(source);
      count = await FF.Filler.fillForm(el, options);
      toast(count ? 'Filled ' + count + ' field' + (count === 1 ? '' : 's') + ' in this form' : 'No form found here');
    } else if (action === 'fill-this-input') {
      const el = targetElement(source);
      if (!el) {
        toast('Click a field first');
        return { count: 0 };
      }
      count = await FF.Filler.fillElement(el, options);
      toast(count ? 'Field filled' : 'That field cannot be filled');
    }

    return { count: count };
  }

  /* ---------------------------------------------------------------- *
   * Saved form maps: fill on click, or as soon as the page loads
   * ---------------------------------------------------------------- */
  const alreadyFilled = new WeakSet();
  const wiredForms = new WeakSet();

  function containerIsEmpty(formEl) {
    const nodes = formEl.querySelectorAll('input, textarea, select, [contenteditable=""], [contenteditable="true"]');
    for (let i = 0; i < nodes.length; i++) {
      const el = nodes[i];
      if (el.isContentEditable || el.hasAttribute('contenteditable')) {
        if (el.textContent && el.textContent.trim()) return false;
        continue;
      }
      if (el.type === 'hidden' || el.disabled || el.readOnly) continue;
      if (el.type === 'checkbox' || el.type === 'radio') continue;
      if (el.tagName === 'SELECT' ? el.selectedIndex > 0 : el.value && el.value.trim()) return false;
    }
    return true;
  }

  async function runMap(map, formEl, options) {
    if (map.fillOncePerLoad !== false && alreadyFilled.has(formEl)) return 0;
    if (map.onlyWhenEmpty !== false && !containerIsEmpty(formEl)) return 0;

    /* Claim the form before the first await, so a second click during a slow
     * dependent-dropdown wait cannot start the same map twice. */
    alreadyFilled.add(formEl);
    injectStyles();
    toast('Filling "' + map.name + '"…');
    const count = await FF.Filler.fillMap(map, options, formEl);
    toast(
      count
        ? 'Filled ' + count + ' field' + (count === 1 ? '' : 's') + ' from "' + map.name + '"'
        : 'Nothing to fill in "' + map.name + '"'
    );
    return count;
  }

  function wireMaps(options) {
    const url = location.href;
    const maps = FF.FormMap.matchingMaps(options.forms, url);
    if (!maps.length) return;

    maps.forEach(function (map) {
      if (map.trigger === 'manual') return;
      const formEl = FF.FormMap.findForm(map, document);
      if (!formEl) return;

      if (map.trigger === 'auto') {
        runMap(map, formEl, options);
        return;
      }

      /* trigger === 'click': the first click or focus inside the form fills it */
      if (wiredForms.has(formEl)) return;
      wiredForms.add(formEl);
      const handler = function (event) {
        if (!formEl.contains(event.target)) return;
        runMap(map, formEl, options).catch(function (err) {
          if (global.console) console.warn('[Form Filler] map run failed', err);
        });
      };
      formEl.addEventListener('click', handler, true);
      formEl.addEventListener('focusin', handler, true);
    });
  }

  /* Forms often arrive after load, so look again a few times before giving up. */
  function scheduleMapWiring() {
    getOptions().then(function (options) {
      if (!options.forms || !options.forms.length) return;
      wireMaps(options);
      [400, 1200, 3000].forEach(function (delay) {
        global.setTimeout(function () {
          getOptions().then(wireMaps);
        }, delay);
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', scheduleMapWiring);
  } else {
    scheduleMapWiring();
  }

  chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    if (!message || !message.action) return undefined;

    if (message.action === 'ping') {
      sendResponse({ ok: true, url: location.href });
      return undefined;
    }

    if (message.action === 'capture-forms') {
      try {
        sendResponse({ ok: true, url: location.href, title: document.title, forms: FF.FormMap.describeForms(document) });
      } catch (err) {
        sendResponse({ ok: false, error: String(err) });
      }
      return undefined;
    }

    run(message.action, message.source).then(
      function (result) {
        sendResponse(Object.assign({ ok: true }, result));
      },
      function (err) {
        sendResponse({ ok: false, error: String(err) });
      }
    );
    return true; /* async response */
  });
})(typeof self !== 'undefined' ? self : this);
