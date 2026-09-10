/* Form Filler - popup */
(function () {
  const hostEl = document.getElementById('siteHost');
  const metaEl = document.getElementById('siteMeta');
  const statusEl = document.getElementById('status');

  let currentTab = null;
  let statusTimer = null;

  function plural(n, word) {
    return n + ' ' + word + (n === 1 ? '' : 's');
  }

  /* tone: success | error | busy | info */
  function status(text, tone) {
    clearTimeout(statusTimer);
    statusEl.textContent = text || '';
    statusEl.dataset.tone = tone || 'info';
    statusEl.hidden = !text;
    if (text && tone !== 'busy') {
      statusTimer = setTimeout(() => {
        statusEl.hidden = true;
      }, 3500);
    }
  }

  function describe(url, options) {
    let host = url;
    try {
      host = new URL(url).hostname || url;
    } catch (err) {
      /* about:blank and friends */
    }
    hostEl.textContent = host;

    const applicable = FF.fieldsForUrl(options.fields, url);
    const specific = applicable.filter(FF.isUrlSpecific).length;
    const maps = FF.FormMap.matchingMaps(options.forms, url);

    metaEl.textContent = applicable.length
      ? plural(applicable.length, 'rule') + ' ready here' +
        (specific ? ' · ' + specific + ' made for this site' : '')
      : 'No rules here yet — values are guessed from field names';
    metaEl.title =
      'Rules switched on for every website, plus any made only for ' + host +
      '. A rule still only fills a field whose name or label it matches.';

    const saved = document.getElementById('fillMapped');
    saved.hidden = !maps.length;
    if (maps.length) {
      document.getElementById('mappedName').textContent =
        maps[0].name + (maps.length > 1 ? ' + ' + (maps.length - 1) + ' more' : '');
    }

    document.getElementById('addSiteRuleDesc').textContent = 'Choose what goes into a field on ' + host;
  }

  async function dispatch(command) {
    try {
      return await chrome.runtime.sendMessage({
        target: 'background',
        action: 'dispatch',
        tabId: currentTab.id,
        command: command
      });
    } catch (err) {
      return null;
    }
  }

  /* Scan the page, stash what we found, and hand it to the options editor. */
  async function captureForms() {
    if (!currentTab) return;
    status('Looking for forms on this page…', 'busy');

    const response = await dispatch('capture-forms');
    const capture = response && response.ok && response.result;
    if (!capture || !capture.ok || !capture.forms || !capture.forms.length) {
      status('No form found on this page. If it just loaded, try again in a moment.', 'error');
      return;
    }

    await chrome.storage.local.set({
      formFillerCapture: {
        url: capture.url,
        title: capture.title,
        forms: capture.forms,
        capturedAt: Date.now()
      }
    });

    await chrome.tabs.create({
      url: chrome.runtime.getURL('src/options/options.html#map-form')
    });
    window.close();
  }

  async function init() {
    const versionEl = document.getElementById('version');
    if (versionEl) versionEl.textContent = 'v' + chrome.runtime.getManifest().version;

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    currentTab = tab;
    const options = await FF.loadOptions();

    if (!tab || !tab.url || /^(chrome|edge|about|chrome-extension|devtools):/.test(tab.url)) {
      hostEl.textContent = 'This page can’t be filled';
      metaEl.textContent = 'Browser pages like Settings and the Web Store are off limits.';
      document.querySelectorAll('.act, .saved, .more-btn').forEach((b) => (b.disabled = true));
      return;
    }
    describe(tab.url, options);
  }

  document.querySelectorAll('[data-command]').forEach((button) => {
    button.addEventListener('click', async () => {
      if (!currentTab) return;
      const command = button.dataset.command;

      button.disabled = true;
      status('Filling…', 'busy');
      const response = await dispatch(command);
      button.disabled = false;

      if (!response || !response.ok) {
        status('Couldn’t fill this page. Reload it and try again.', 'error');
        return;
      }

      const result = response.result || {};
      if (result.cancelled) {
        status('Cancelled.', 'info');
        return;
      }

      const count = typeof result.count === 'number' ? result.count : null;
      if (count === null) {
        status('Done.', 'success');
      } else if (count > 0) {
        status('✓ Filled ' + plural(count, 'field'), 'success');
        if (command === 'fill-all-fields' || command === 'fill-mapped-forms') {
          setTimeout(() => window.close(), 900);
        }
      } else if (command === 'fill-this-input' || command === 'fill-this-form') {
        status('Click into a field on the page first, then try again.', 'info');
      } else {
        status('Nothing to fill on this page.', 'info');
      }
    });
  });

  document.getElementById('mapForm').addEventListener('click', captureForms);

  document.getElementById('openOptions').addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
    window.close();
  });

  document.getElementById('addSiteRule').addEventListener('click', async () => {
    if (!currentTab || !currentTab.url) return;
    let pattern = '';
    try {
      pattern = new URL(currentTab.url).hostname;
    } catch (err) {
      pattern = '';
    }
    await chrome.tabs.create({
      url: chrome.runtime.getURL('src/options/options.html#new-field?url=' + encodeURIComponent(pattern))
    });
    window.close();
  });

  init();
})();
