/* Form Filler - options persistence (chrome.storage.local, so field count is unbounded). */
(function (global) {
  const FF = (global.FF = global.FF || {});

  function deepClone(value) {
    return JSON.parse(JSON.stringify(value));
  }
  FF.deepClone = deepClone;

  /* Fills in anything a stored blob is missing and repairs obviously bad rows. */
  FF.normalizeOptions = function normalizeOptions(raw) {
    const defaults = FF.DEFAULT_SETTINGS;
    const data = raw && typeof raw === 'object' ? raw : {};

    const settings = Object.assign({}, defaults.settings, data.settings || {});
    if (!Array.isArray(settings.ignoredTypes)) {
      settings.ignoredTypes = defaults.settings.ignoredTypes.slice();
    }

    const fields = (Array.isArray(data.fields) ? data.fields : []).map(function (f) {
      const field = Object.assign(FF.newField(), f || {});
      field.id = field.id || FF.uid();
      field.matchValues = Array.isArray(field.matchValues)
        ? field.matchValues.filter(Boolean)
        : FF.toList(field.matchValues);
      field.matchTypes = Array.isArray(field.matchTypes) && field.matchTypes.length
        ? field.matchTypes
        : ['name', 'id', 'placeholder', 'label'];
      field.urlPatterns = Array.isArray(field.urlPatterns)
        ? field.urlPatterns.filter(Boolean)
        : FF.toList(field.urlPatterns);
      field.options = field.options && typeof field.options === 'object' ? field.options : {};
      field.enabled = field.enabled !== false;
      return field;
    });

    const forms = (Array.isArray(data.forms) ? data.forms : []).map(function (m) {
      const map = Object.assign(FF.newFormMap(), m || {});
      map.id = map.id || FF.uid();
      map.urlPatterns = Array.isArray(map.urlPatterns)
        ? map.urlPatterns.filter(Boolean)
        : FF.toList(map.urlPatterns);
      map.entries = (Array.isArray(map.entries) ? map.entries : []).map(function (entry) {
        return Object.assign(
          {
            selector: '', multi: false, name: '', label: '', inputType: 'text',
            type: 'text', choices: [], choiceMatchBy: 'value', capturedValue: '',
            options: {}, enabled: true
          },
          entry || {}
        );
      });
      map.enabled = map.enabled !== false;
      map.stepDelayMs = FF.numberOr(map.stepDelayMs, 350);
      map.waitForOptionsMs = FF.numberOr(map.waitForOptionsMs, 3000);
      return map;
    });

    return { version: FF.SCHEMA_VERSION, settings: settings, fields: fields, forms: forms };
  };

  FF.loadOptions = function loadOptions() {
    return new Promise(function (resolve) {
      try {
        chrome.storage.local.get(FF.STORAGE_KEY, function (result) {
          if (chrome.runtime.lastError) {
            resolve(FF.normalizeOptions(null));
            return;
          }
          resolve(FF.normalizeOptions(result && result[FF.STORAGE_KEY]));
        });
      } catch (err) {
        resolve(FF.normalizeOptions(null));
      }
    });
  };

  FF.saveOptions = function saveOptions(options) {
    const payload = {};
    payload[FF.STORAGE_KEY] = FF.normalizeOptions(options);
    return new Promise(function (resolve, reject) {
      chrome.storage.local.set(payload, function () {
        if (chrome.runtime.lastError) reject(new Error(chrome.runtime.lastError.message));
        else resolve(payload[FF.STORAGE_KEY]);
      });
    });
  };

  FF.onOptionsChanged = function onOptionsChanged(callback) {
    chrome.storage.onChanged.addListener(function (changes, area) {
      if (area === 'local' && changes[FF.STORAGE_KEY]) {
        callback(FF.normalizeOptions(changes[FF.STORAGE_KEY].newValue));
      }
    });
  };
})(typeof self !== 'undefined' ? self : this);
