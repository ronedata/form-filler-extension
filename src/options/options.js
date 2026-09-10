/* Form Filler - options page */
(function () {
  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

  const saveState = $('#saveState');
  const listEl = $('#fieldList');
  const emptyEl = $('#fieldsEmpty');
  const template = $('#fieldTemplate');

  let options = null;
  const openIds = new Set();
  let dragId = null;

  /* ---------------------------------------------------------------- *
   * Small helpers
   * ---------------------------------------------------------------- */
  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function plural(n, word) {
    return n + ' ' + word + (n === 1 ? '' : 's');
  }

  function linesOf(text) {
    return String(text || '')
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);
  }

  /* "https://acme.io/signup*" reads better in a badge as "acme.io/signup". */
  function prettyUrl(pattern) {
    const text = String(pattern || '')
      .replace(/^[a-z*]+:\/\//i, '')
      .replace(/\*+$/, '')
      .replace(/\/$/, '');
    return text || String(pattern || '');
  }

  function revealCard(card) {
    if (card && typeof card.scrollIntoView === 'function') {
      card.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  /* ---------------------------------------------------------------- *
   * Type-specific option editors
   *
   * `advanced` options are tucked under "More options" so the common
   * case stays short; everything else is shown with a plain label.
   * ---------------------------------------------------------------- */
  const TYPE_OPTIONS = {
    number: [
      { key: 'min', label: 'From', control: 'number' },
      { key: 'max', label: 'To', control: 'number' },
      { key: 'decimalPlaces', label: 'Decimal places', control: 'number', advanced: true },
      { key: 'prefix', label: 'Text before', control: 'text', advanced: true },
      { key: 'suffix', label: 'Text after', control: 'text', advanced: true }
    ],
    date: [
      { key: 'minDate', label: 'From', control: 'date' },
      { key: 'maxDate', label: 'To', control: 'date' },
      { key: 'format', label: 'Format', control: 'text', placeholder: 'YYYY-MM-DD', advanced: true }
    ],
    time: [{ key: 'format', label: 'Format', control: 'text', placeholder: 'HH:mm' }],
    text: [
      { key: 'minWords', label: 'At least', control: 'number', suffix: 'words' },
      { key: 'maxWords', label: 'At most', control: 'number', suffix: 'words' },
      {
        key: 'maxLength',
        label: 'Cut off after (characters, 0 = never)',
        control: 'number',
        advanced: true
      },
      {
        key: 'wordList',
        label: 'Only use these words (one per line)',
        control: 'textarea',
        wide: true,
        advanced: true
      }
    ],
    alphanumeric: [
      {
        key: 'template',
        label: 'Pattern',
        control: 'text',
        placeholder: 'LLL-####',
        wide: true,
        help: 'L = capital letter, l = small letter, # = digit, [3-9] = one digit from 3 to 9'
      }
    ],
    regex: [
      {
        key: 'pattern',
        label: 'Regular expression',
        control: 'text',
        placeholder: '[A-Z]{2}-\\d{6}',
        wide: true
      }
    ],
    randomizedList: [
      { key: 'items', label: 'Pick one of these (one per line)', control: 'textarea', wide: true }
    ],
    constant: [{ key: 'value', label: 'Always type', control: 'text', wide: true }],
    email: [
      {
        key: 'usernameMode',
        label: 'The part before @',
        control: 'select',
        choices: [
          { value: 'inherit', label: 'As in Settings' },
          { value: 'name', label: 'Made from a random name' },
          { value: 'random', label: 'Random letters and numbers' },
          { value: 'list', label: 'Picked from my list' }
        ]
      },
      { key: 'usernameList', label: 'My list (one per line)', control: 'textarea', advanced: true },
      { key: 'domains', label: 'The part after @ (empty = as in Settings)', control: 'textarea', advanced: true }
    ],
    password: [
      { key: 'length', label: 'Length', control: 'number' },
      { key: 'symbols', label: 'Include symbols', control: 'checkbox' }
    ],
    phone: [
      {
        key: 'template',
        label: 'Pattern (empty = as in Settings)',
        control: 'text',
        placeholder: '+8801[3-9]########',
        wide: true,
        help: '# = any digit, [3-9] = one digit from 3 to 9'
      }
    ],
    selectOption: [
      {
        key: 'values',
        label: 'Choose one of (one per line, empty = any)',
        control: 'textarea',
        wide: true
      },
      {
        key: 'matchBy',
        label: 'Compare with',
        control: 'select',
        advanced: true,
        choices: [
          { value: 'value', label: 'Option value' },
          { value: 'text', label: 'Option text' }
        ]
      }
    ],
    autocomplete: [
      { key: 'query', label: 'Type', control: 'text', placeholder: 'e.g. DHAKA' },
      {
        key: 'pick',
        label: 'Then pick',
        control: 'select',
        choices: [
          { value: 'first', label: 'The first suggestion' },
          { value: 'random', label: 'A random suggestion' },
          { value: 'match', label: 'The one containing…' }
        ]
      },
      { key: 'matchText', label: 'Containing', control: 'text', placeholder: 'e.g. COMMERCE' },
      {
        key: 'suggestionSelector',
        label: 'Suggestion list selector (empty = as in Settings)',
        control: 'text',
        placeholder: '.ui-autocomplete li',
        advanced: true
      },
      { key: 'waitMs', label: 'Wait up to (ms, empty = as in Settings)', control: 'number', advanced: true },
      {
        key: 'commit',
        label: 'Choose it by',
        control: 'select',
        advanced: true,
        choices: [
          { value: '', label: 'As in Settings' },
          { value: 'click', label: 'Clicking it' },
          { value: 'keyboard', label: 'Arrow keys + Enter' }
        ]
      }
    ],
    checked: [
      {
        key: 'mode',
        label: 'Tick it',
        control: 'select',
        choices: [
          { value: 'random', label: 'Sometimes (random)' },
          { value: 'always', label: 'Always' },
          { value: 'never', label: 'Never' }
        ]
      }
    ]
  };

  const MATCH_TYPE_NAMES = {
    name: 'name',
    id: 'id',
    class: 'class',
    placeholder: 'placeholder',
    label: 'label text',
    'aria-label': 'screen-reader label',
    title: 'tooltip',
    type: 'input type',
    'data-*': 'data attributes'
  };

  const URL_MODE_CHOICES = [
    { value: 'domain', label: 'Websites, like example.com' },
    { value: 'wildcard', label: 'Addresses with *, like example.com/signup*' },
    { value: 'regex', label: 'Regular expressions' }
  ];

  /* ---------------------------------------------------------------- *
   * Saving and feedback
   * ---------------------------------------------------------------- */
  let saveTimer = null;
  let savedTimer = null;

  function scheduleSave() {
    saveState.classList.remove('is-done');
    saveState.textContent = 'Saving…';
    clearTimeout(saveTimer);
    clearTimeout(savedTimer);
    saveTimer = setTimeout(async () => {
      try {
        await FF.saveOptions(options);
        saveState.textContent = '✓ All changes saved';
        saveState.classList.add('is-done');
        savedTimer = setTimeout(() => {
          saveState.textContent = '';
          saveState.classList.remove('is-done');
        }, 2500);
      } catch (err) {
        saveState.textContent = 'Couldn’t save — try again';
        console.error(err);
      }
    }, 250);
  }

  let toastTimer = null;

  function hideToast() {
    $('#toast').hidden = true;
  }

  /* A short message at the bottom of the page, optionally with Undo. */
  function showToast(text, undo) {
    $('#toastText').textContent = text;
    const undoBtn = $('#toastUndo');
    undoBtn.hidden = !undo;
    undoBtn.onclick = undo
      ? () => {
          hideToast();
          undo();
        }
      : null;
    $('#toast').hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(hideToast, undo ? 8000 : 3500);
  }

  /* ---------------------------------------------------------------- *
   * Tabs
   * ---------------------------------------------------------------- */
  function showTab(name) {
    $$('.tab').forEach((t) => t.classList.toggle('is-active', t.dataset.tab === name));
    $$('.panel').forEach((p) => p.classList.toggle('is-active', p.id === 'panel-' + name));
  }

  $('#tabs').addEventListener('click', (event) => {
    const tab = event.target.closest('.tab');
    if (tab) showTab(tab.dataset.tab);
  });

  /* ---------------------------------------------------------------- *
   * Settings binding
   * ---------------------------------------------------------------- */
  function readSettingsIntoForm() {
    $$('[data-setting]').forEach((node) => {
      const key = node.dataset.setting;
      const value = options.settings[key];
      if (node.type === 'checkbox') node.checked = !!value;
      else if (Array.isArray(value)) node.value = value.join(', ');
      else node.value = value === undefined || value === null ? '' : value;
    });
  }

  function bindSettings() {
    $$('[data-setting]').forEach((node) => {
      const key = node.dataset.setting;
      const handler = () => {
        if (node.type === 'checkbox') {
          options.settings[key] = node.checked;
        } else if (Array.isArray(FF.DEFAULT_SETTINGS.settings[key])) {
          options.settings[key] = FF.toList(node.value).map((s) => s.toLowerCase());
        } else if (node.type === 'number') {
          options.settings[key] = node.value === '' ? 0 : Number(node.value);
        } else {
          options.settings[key] = node.value;
        }
        scheduleSave();
      };
      node.addEventListener(node.tagName === 'SELECT' || node.type === 'checkbox' ? 'change' : 'input', handler);
    });
  }

  /* ---------------------------------------------------------------- *
   * Shared form controls
   * ---------------------------------------------------------------- */
  function typeLabel(type) {
    const found = FF.DATA_TYPES.find((t) => t.value === type);
    return found ? found.label : type;
  }

  function fillSelect(select, list, value) {
    select.innerHTML = '';
    const groups = new Map();
    list.forEach((item) => {
      const group = item.group || '';
      if (!groups.has(group)) groups.set(group, []);
      groups.get(group).push(item);
    });
    groups.forEach((items, groupName) => {
      const parent = groupName ? document.createElement('optgroup') : select;
      if (groupName) {
        parent.label = groupName;
        select.appendChild(parent);
      }
      items.forEach((item) => {
        const opt = document.createElement('option');
        opt.value = item.value;
        opt.textContent = item.label;
        parent.appendChild(opt);
      });
    });
    select.value = value;
  }

  /* One labelled input for a single type option. */
  function optionControl(item, value, onChange, compact) {
    if (item.control === 'checkbox') {
      const wrap = el('label', 'check');
      const box = document.createElement('input');
      box.type = 'checkbox';
      box.checked = value === undefined ? true : !!value;
      box.addEventListener('change', () => onChange(box.checked));
      wrap.append(box, document.createTextNode(item.label));
      return wrap;
    }

    const wrap = el(
      'label',
      (compact ? 'mini' : 'field') + (item.wide ? (compact ? ' wide' : ' grow') : '')
    );
    wrap.appendChild(el('span', compact ? 'mini-label' : 'label', item.label));

    let input;
    if (item.control === 'textarea' && !compact) {
      input = document.createElement('textarea');
      input.rows = 2;
    } else if (item.control === 'select') {
      input = document.createElement('select');
      item.choices.forEach((choice) => {
        const opt = document.createElement('option');
        opt.value = choice.value;
        opt.textContent = choice.label;
        input.appendChild(opt);
      });
    } else {
      input = document.createElement('input');
      input.type = item.control === 'textarea' ? 'text' : item.control;
    }

    input.className = 'control';
    if (item.placeholder) input.placeholder = item.placeholder;
    input.value = value === undefined || value === null ? '' : value;
    input.addEventListener(input.tagName === 'SELECT' ? 'change' : 'input', () => {
      if (item.control === 'number') onChange(input.value === '' ? '' : Number(input.value));
      else onChange(input.value);
    });
    wrap.appendChild(input);

    if (item.suffix) wrap.appendChild(el('span', compact ? 'mini-label' : 'field-help', item.suffix));
    if (item.help) {
      if (compact) input.title = item.help;
      else wrap.appendChild(el('span', 'field-help', item.help));
    }
    return wrap;
  }

  /* All of a type's options, the rarely needed ones folded away. */
  function renderOptionSet(container, type, opts, compact) {
    container.innerHTML = '';
    const spec = TYPE_OPTIONS[type];
    if (!spec) return;

    const defaults = FF.DEFAULT_TYPE_OPTIONS[type] || {};
    const basic = el('div', compact ? 'entry-opts' : 'row');
    const extra = el('div', compact ? 'entry-opts' : 'row');

    spec.forEach((item) => {
      const stored = opts[item.key];
      const value = stored === undefined ? defaults[item.key] : stored;
      const control = optionControl(
        item,
        value,
        (next) => {
          opts[item.key] = next;
          scheduleSave();
        },
        compact
      );
      (item.advanced ? extra : basic).appendChild(control);
    });

    if (basic.childNodes.length) container.appendChild(basic);
    if (extra.childNodes.length) {
      const more = el('details', compact ? 'mini-more' : 'more-options');
      more.append(el('summary', '', 'More options'), extra);
      container.appendChild(more);
    }
  }

  /* ---------------------------------------------------------------- *
   * Custom field list
   * ---------------------------------------------------------------- */
  function summarize(field) {
    const what = field.type === 'skip' ? 'Never filled' : typeLabel(field.type);
    if (field.matchMode === 'selector') {
      return field.selector ? what + ' · for ' + field.selector : 'Not set up yet — add a CSS selector';
    }
    const values = (field.matchValues || []).filter(Boolean);
    if (!values.length) return 'Not set up yet — add words to look for';
    if (field.matchMode === 'regex') {
      return what + ' · for fields matching ' + plural(values.length, 'pattern');
    }
    const which =
      values.slice(0, 4).join(', ') + (values.length > 4 ? ' +' + (values.length - 4) + ' more' : '');
    return what + ' · for fields like ' + which;
  }

  function scopeText(urls) {
    const list = urls || [];
    if (!list.length) return '';
    return list.length === 1 ? 'Only on ' + prettyUrl(list[0]) : 'Only on ' + list.length + ' websites';
  }

  function visibleFields() {
    const query = $('#fieldSearch').value.trim().toLowerCase();
    const filter = $('#fieldFilter').value;

    return options.fields.filter((field) => {
      if (filter === 'global' && FF.isUrlSpecific(field)) return false;
      if (filter === 'site' && !FF.isUrlSpecific(field)) return false;
      if (filter === 'enabled' && field.enabled === false) return false;
      if (filter === 'disabled' && field.enabled !== false) return false;
      if (!query) return true;

      const haystack = [
        field.name,
        field.type,
        typeLabel(field.type),
        (field.matchValues || []).join(' '),
        (field.urlPatterns || []).join(' '),
        field.selector
      ]
        .join(' ')
        .toLowerCase();
      return haystack.indexOf(query) !== -1;
    });
  }

  function renderCard(field) {
    field.options = field.options || {};

    const node = template.content.firstElementChild.cloneNode(true);
    node.dataset.id = field.id;

    const body = $('.field-body', node);
    const titleBtn = $('.field-title', node);
    const nameEl = $('.f-name', node);
    const summaryEl = $('.f-summary', node);
    const scopeBadge = $('.f-scope', node);

    function refreshHeader() {
      nameEl.textContent = field.name || 'Untitled rule';
      summaryEl.textContent = summarize(field);
      scopeBadge.textContent = scopeText(field.urlPatterns);
      scopeBadge.title = (field.urlPatterns || []).join('\n');
      node.classList.toggle('is-disabled', field.enabled === false);
    }

    function setOpen(open) {
      body.hidden = !open;
      node.classList.toggle('is-open', open);
      titleBtn.setAttribute('aria-expanded', String(open));
      if (open) openIds.add(field.id);
      else openIds.delete(field.id);
    }

    /* --- header --- */
    const enabled = $('.f-enabled', node);
    enabled.checked = field.enabled !== false;
    enabled.addEventListener('change', () => {
      field.enabled = enabled.checked;
      refreshHeader();
      scheduleSave();
    });

    titleBtn.addEventListener('click', () => setOpen(body.hidden));
    $('.f-up', node).addEventListener('click', () => move(field.id, -1));
    $('.f-down', node).addEventListener('click', () => move(field.id, 1));
    $('.f-dup', node).addEventListener('click', () => duplicate(field.id));
    $('.f-del', node).addEventListener('click', () => remove(field.id));

    const nameInput = $('.f-name-input', node);
    nameInput.value = field.name || '';
    nameInput.addEventListener('input', () => {
      field.name = nameInput.value;
      refreshHeader();
      scheduleSave();
    });

    /* --- step 1: which fields --- */
    const values = $('.f-values', node);
    values.value = (field.matchValues || []).join('\n');
    values.addEventListener('input', () => {
      field.matchValues = linesOf(values.value);
      refreshHeader();
      scheduleSave();
    });

    const selector = $('.f-selector', node);
    selector.value = field.selector || '';
    selector.addEventListener('input', () => {
      field.selector = selector.value;
      refreshHeader();
      scheduleSave();
    });

    const matchMode = $('.f-matchmode', node);
    fillSelect(matchMode, FF.MATCH_MODES, field.matchMode || 'contains');
    const valuesHelp = $('.f-values-help', node);

    function syncMatchMode() {
      const mode = matchMode.value;
      const bySelector = mode === 'selector';
      $('.f-values-wrap', node).hidden = bySelector;
      $('.f-selector-wrap', node).hidden = !bySelector;
      $('.f-matchtypes-wrap', node).hidden = bySelector;
      valuesHelp.textContent =
        mode === 'regex'
          ? 'Regular expressions to test against the field’s name, label or placeholder. One per line.'
          : 'Words to look for in the field’s name, label or placeholder. One per line.';
    }

    matchMode.addEventListener('change', () => {
      field.matchMode = matchMode.value;
      syncMatchMode();
      refreshHeader();
      scheduleSave();
    });
    syncMatchMode();

    const chips = $('.f-matchtypes', node);
    FF.MATCH_TYPES.forEach((matchType) => {
      const chip = el('label', 'chip');
      const box = document.createElement('input');
      box.type = 'checkbox';
      box.checked = (field.matchTypes || []).indexOf(matchType.value) !== -1;
      chip.classList.toggle('is-on', box.checked);
      box.addEventListener('change', () => {
        const set = new Set(field.matchTypes || []);
        if (box.checked) set.add(matchType.value);
        else set.delete(matchType.value);
        field.matchTypes = Array.from(set);
        chip.classList.toggle('is-on', box.checked);
        scheduleSave();
      });
      chip.append(box, document.createTextNode(MATCH_TYPE_NAMES[matchType.value] || matchType.label));
      chips.appendChild(chip);
    });

    /* Anything changed from the defaults should not stay hidden. */
    if (field.matchMode && field.matchMode !== 'contains') $('details.advanced', node).open = true;

    /* --- step 2: what goes in --- */
    const typeSelect = $('.f-type-input', node);
    const typeOptions = $('.f-typeoptions', node);
    const previewOut = $('.f-preview-out', node);
    fillSelect(typeSelect, FF.DATA_TYPES, field.type);

    typeSelect.addEventListener('change', () => {
      field.type = typeSelect.value;
      field.options = Object.assign({}, FF.DEFAULT_TYPE_OPTIONS[field.type] || {});
      renderOptionSet(typeOptions, field.type, field.options, false);
      previewOut.textContent = '';
      refreshHeader();
      scheduleSave();
    });
    renderOptionSet(typeOptions, field.type, field.options, false);

    $('.f-preview', node).addEventListener('click', () => {
      const samples = [];
      for (let i = 0; i < 4; i++) {
        const value = FF.generateForField(field, options.settings);
        samples.push(value === null ? '(left empty)' : value === '' ? '(empty)' : String(value));
      }
      previewOut.textContent = samples.join('   ·   ');
    });

    /* --- step 3: which websites --- */
    const whereRadios = $$('.f-where', node);
    const urlsWrap = $('.f-urls-wrap', node);
    const urls = $('.f-urls', node);
    const urlMode = $('.f-urlmode', node);

    let scoped = (field.urlPatterns || []).length > 0;
    let parkedUrls = (field.urlPatterns || []).join('\n');

    whereRadios.forEach((radio) => {
      radio.name = 'where-' + field.id;
    });
    fillSelect(urlMode, URL_MODE_CHOICES, field.urlMode || 'wildcard');
    urls.value = parkedUrls;

    function syncWhere() {
      whereRadios.forEach((radio) => {
        radio.checked = (radio.value === 'some') === scoped;
      });
      urlsWrap.hidden = !scoped;
    }

    whereRadios.forEach((radio) => {
      radio.addEventListener('change', () => {
        scoped = radio.value === 'some';
        if (scoped) {
          urls.value = parkedUrls;
          field.urlPatterns = linesOf(parkedUrls);
        } else {
          parkedUrls = urls.value;
          field.urlPatterns = [];
        }
        syncWhere();
        if (scoped) urls.focus();
        refreshHeader();
        scheduleSave();
        refreshUrlTest();
      });
    });

    urls.addEventListener('input', () => {
      parkedUrls = urls.value;
      field.urlPatterns = linesOf(urls.value);
      refreshHeader();
      scheduleSave();
      refreshUrlTest();
    });

    urlMode.addEventListener('change', () => {
      field.urlMode = urlMode.value;
      scheduleSave();
      refreshUrlTest();
    });
    syncWhere();

    /* --- drag to reorder --- */
    const handle = $('.handle', node);
    handle.addEventListener('dragstart', (event) => {
      dragId = field.id;
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', field.id);
    });
    node.addEventListener('dragover', (event) => {
      if (!dragId || dragId === field.id) return;
      event.preventDefault();
      node.classList.add('drag-over');
    });
    node.addEventListener('dragleave', () => node.classList.remove('drag-over'));
    node.addEventListener('drop', (event) => {
      event.preventDefault();
      node.classList.remove('drag-over');
      if (!dragId || dragId === field.id) return;
      reorder(dragId, field.id);
      dragId = null;
    });

    refreshHeader();
    setOpen(openIds.has(field.id));
    return node;
  }

  function renderFields() {
    const fields = visibleFields();
    listEl.innerHTML = '';
    fields.forEach((field) => listEl.appendChild(renderCard(field)));

    const total = options.fields.length;
    const on = options.fields.filter((f) => f.enabled !== false).length;
    const meta = $('#listMeta');
    meta.hidden = !total;
    meta.textContent = total
      ? plural(total, 'rule') +
        (on !== total ? ' (' + on + ' switched on)' : '') +
        ' · checked from the top · drag ⠿ to reorder'
      : '';

    emptyEl.innerHTML = '';
    if (!total) {
      emptyEl.hidden = false;
      emptyEl.append(
        el('h3', '', 'No rules yet'),
        el('p', '', 'Press “+ Add field” to make one, or open “Ready-made rules” to add a whole set at once.')
      );
    } else if (!fields.length) {
      emptyEl.hidden = false;
      emptyEl.append(el('p', '', 'No rules match this search or filter.'));
    } else {
      emptyEl.hidden = true;
    }

    refreshUrlTest();
  }

  /* ---------------------------------------------------------------- *
   * Ready-made rule packs
   * ---------------------------------------------------------------- */
  function renderPackCards() {
    const grid = $('#packCards');
    grid.innerHTML = '';
    FF.RULE_PACKS.forEach((pack) => {
      const card = el('div', 'pack-card');
      card.dataset.pack = pack.id;

      const top = el('div', 'pack-top');
      top.append(el('span', 'pack-name', pack.name), el('span', 'pack-count', plural(pack.fields.length, 'rule')));

      const add = el('button', 'btn small pack-add', 'Add');
      add.type = 'button';
      add.addEventListener('click', () => addPack(pack.id));

      card.append(top, el('p', 'pack-desc', pack.description), add);
      grid.appendChild(card);
    });
  }

  function addPack(id) {
    const pack = FF.getRulePack(id);
    if (!pack) return;
    const hint = $('#packHint');

    const have = new Set(options.fields.map((f) => (f.name || '').trim().toLowerCase()));
    const incoming = FF.rulePackFields(pack.id).filter(
      (field) => !have.has((field.name || '').trim().toLowerCase())
    );
    const skipped = pack.fields.length - incoming.length;

    if (!incoming.length) {
      hint.textContent = 'You already have every rule in “' + pack.name + '”.';
      return;
    }

    /* "Leave these alone" only works if it is consulted first. */
    if (pack.id === 'protect') options.fields.unshift(...incoming);
    else options.fields.push(...incoming);

    scheduleSave();
    renderFields();

    const message =
      'Added ' + plural(incoming.length, 'rule') + ' from “' + pack.name + '”' +
      (skipped ? ', skipped ' + skipped + ' you already had' : '') + '.';
    hint.textContent = message;

    const added = new Set(incoming.map((f) => f.id));
    showToast(message, () => {
      options.fields = options.fields.filter((f) => !added.has(f.id));
      hint.textContent = '';
      scheduleSave();
      renderFields();
    });
  }

  /* A toolbar button that opens and closes a panel below it. */
  function bindDrawer(buttonSelector, drawerSelector, onClose) {
    const button = $(buttonSelector);
    const drawer = $(drawerSelector);
    button.addEventListener('click', () => {
      const open = drawer.hidden;
      drawer.hidden = !open;
      button.setAttribute('aria-expanded', String(open));
      button.classList.toggle('is-on', open);
      if (open) {
        const input = drawer.querySelector('input');
        if (input) input.focus();
      } else if (onClose) {
        onClose();
      }
    });
  }

  /* ---------------------------------------------------------------- *
   * Custom field list changes
   * ---------------------------------------------------------------- */
  function indexOf(id) {
    return options.fields.findIndex((f) => f.id === id);
  }

  function move(id, delta) {
    const from = indexOf(id);
    const to = from + delta;
    if (from < 0 || to < 0 || to >= options.fields.length) return;
    const [field] = options.fields.splice(from, 1);
    options.fields.splice(to, 0, field);
    scheduleSave();
    renderFields();
  }

  function reorder(sourceId, targetId) {
    const from = indexOf(sourceId);
    const to = indexOf(targetId);
    if (from < 0 || to < 0) return;
    const [field] = options.fields.splice(from, 1);
    options.fields.splice(to, 0, field);
    scheduleSave();
    renderFields();
  }

  function duplicate(id) {
    const index = indexOf(id);
    if (index < 0) return;
    const copy = FF.deepClone(options.fields[index]);
    copy.id = FF.uid();
    copy.name = copy.name + ' (copy)';
    options.fields.splice(index + 1, 0, copy);
    openIds.add(copy.id);
    scheduleSave();
    renderFields();
    showToast('Made a copy of “' + (options.fields[index].name || 'rule') + '”.');
  }

  function remove(id) {
    const index = indexOf(id);
    if (index < 0) return;
    const [field] = options.fields.splice(index, 1);
    openIds.delete(id);
    scheduleSave();
    renderFields();
    showToast('Deleted “' + (field.name || 'Untitled rule') + '”.', () => {
      options.fields.splice(Math.min(index, options.fields.length), 0, field);
      scheduleSave();
      renderFields();
    });
  }

  function addField(overrides) {
    /* A search or filter could hide the new rule - clear them first. */
    $('#fieldSearch').value = '';
    $('#fieldFilter').value = 'all';

    const field = FF.newField(overrides);
    field.options = Object.assign({}, FF.DEFAULT_TYPE_OPTIONS[field.type] || {});
    options.fields.unshift(field);
    openIds.add(field.id);
    scheduleSave();
    renderFields();

    const card = listEl.querySelector('[data-id="' + field.id + '"]');
    if (card) {
      revealCard(card);
      const input = card.querySelector('.f-values');
      if (input) input.focus();
    }
  }

  /* ---------------------------------------------------------------- *
   * Form maps
   * ---------------------------------------------------------------- */
  const formListEl = $('#formList');
  const formsEmptyEl = $('#formsEmpty');
  const formTemplate = $('#formTemplate');
  const openMapIds = new Set();
  let capture = null;

  const TRIGGER_BADGE = { click: 'on click', auto: 'auto', manual: 'manual' };
  const TRIGGER_HELP = {
    click: 'The first time you click into this form on the page, every field below is filled.',
    auto: 'Filled as soon as the page opens — no click needed.',
    manual: 'Filled only when you press “Fill it now” in the toolbar popup.'
  };

  const INPUT_KIND = {
    select: 'dropdown',
    tel: 'phone',
    radio: 'radio buttons',
    checkbox: 'checkbox',
    hidden: 'hidden id',
    contenteditable: 'rich text',
    textarea: 'text box'
  };

  function renderEntryOptions(cell, entry) {
    cell.innerHTML = '';
    entry.options = entry.options || {};

    /* A dropdown or radio group we captured knows its own options - offer
     * them, rather than asking the user to retype one. */
    if (entry.type === 'selectOption' && entry.choices && entry.choices.length) {
      const picker = el('select', 'control');
      picker.appendChild(Object.assign(el('option', '', 'Any option, at random'), { value: '' }));
      entry.choices.forEach((choice) => {
        picker.appendChild(Object.assign(el('option', '', choice.label || choice.value), { value: choice.value }));
      });

      const current = FF.toList(entry.options.values);
      picker.value = current.length === 1 ? current[0] : '';
      /* a value the page no longer offers - keep it visible rather than silently resetting */
      if (current.length === 1 && picker.value !== current[0]) {
        picker.appendChild(Object.assign(el('option', '', current[0] + ' (not on the page)'), { value: current[0] }));
        picker.value = current[0];
      }

      picker.addEventListener('change', () => {
        entry.options.values = picker.value;
        entry.options.matchBy = entry.choiceMatchBy || 'value';
        scheduleSave();
      });

      const wrap = el('label', 'mini wide');
      wrap.append(el('span', 'mini-label', 'Choose'), picker);
      const box = el('div', 'entry-opts');
      box.appendChild(wrap);
      cell.appendChild(box);
      return;
    }

    if (!TYPE_OPTIONS[entry.type]) {
      cell.appendChild(
        el('span', 'entry-note', entry.type === 'skip' ? 'Left as it is' : 'A random ' + typeLabel(entry.type).toLowerCase())
      );
      return;
    }

    renderOptionSet(cell, entry.type, entry.options, true);
  }

  function renderEntries(tbody, map) {
    tbody.innerHTML = '';

    map.entries.forEach((entry) => {
      const row = document.createElement('tr');
      row.classList.toggle('is-off', entry.enabled === false);

      const onCell = document.createElement('td');
      const onBox = document.createElement('input');
      onBox.type = 'checkbox';
      onBox.checked = entry.enabled !== false;
      onBox.title = 'Fill this field';
      onBox.setAttribute('aria-label', 'Fill ' + (entry.label || entry.name || 'this field'));
      onBox.addEventListener('change', () => {
        entry.enabled = onBox.checked;
        row.classList.toggle('is-off', !onBox.checked);
        scheduleSave();
      });
      onCell.appendChild(onBox);

      const labelCell = document.createElement('td');
      labelCell.appendChild(el('span', 'entry-label', entry.label || entry.name || entry.selector));
      const kind = entry.multi ? 'radio group' : INPUT_KIND[entry.inputType] || entry.inputType;
      const meta = el('span', 'entry-meta', [kind].concat(entry.name ? [entry.name] : []).join(' · '));
      meta.title = entry.selector;
      labelCell.appendChild(meta);

      const typeCell = document.createElement('td');
      const typeSelect = el('select', 'control');
      fillSelect(typeSelect, FF.DATA_TYPES, entry.type);
      typeCell.appendChild(typeSelect);

      const optsCell = document.createElement('td');
      typeSelect.addEventListener('change', () => {
        entry.type = typeSelect.value;
        entry.options = Object.assign({}, FF.DEFAULT_TYPE_OPTIONS[entry.type] || {});
        renderEntryOptions(optsCell, entry);
        scheduleSave();
      });
      renderEntryOptions(optsCell, entry);

      row.append(onCell, labelCell, typeCell, optsCell);
      tbody.appendChild(row);
    });
  }

  function renderMapCard(map) {
    const node = formTemplate.content.firstElementChild.cloneNode(true);
    node.dataset.id = map.id;

    const body = $('.field-body', node);
    const titleBtn = $('.field-title', node);
    const nameEl = $('.m-name', node);
    const triggerBadge = $('.m-trigger', node);
    const scopeBadge = $('.m-scope', node);
    const summaryEl = $('.m-summary', node);
    const triggerHelp = $('.m-trigger-help', node);

    function refreshHeader() {
      nameEl.textContent = map.name || 'Untitled form map';
      triggerBadge.textContent = TRIGGER_BADGE[map.trigger] || TRIGGER_BADGE.click;
      const urls = map.urlPatterns || [];
      scopeBadge.textContent = urls.length
        ? urls.length === 1
          ? prettyUrl(urls[0])
          : urls.length + ' web addresses'
        : 'any website';
      scopeBadge.title = urls.join('\n');
      const on = map.entries.filter((e) => e.enabled !== false && e.type !== 'skip').length;
      summaryEl.textContent =
        'Fills ' + on + ' of ' + plural(map.entries.length, 'field') + ' · ' + (map.formLabel || map.formKey || 'form');
      triggerHelp.textContent = TRIGGER_HELP[map.trigger] || TRIGGER_HELP.click;
      node.classList.toggle('is-disabled', map.enabled === false);
    }

    function setOpen(open) {
      body.hidden = !open;
      node.classList.toggle('is-open', open);
      titleBtn.setAttribute('aria-expanded', String(open));
      if (open) openMapIds.add(map.id);
      else openMapIds.delete(map.id);
    }

    const enabled = $('.m-enabled', node);
    enabled.checked = map.enabled !== false;
    enabled.addEventListener('change', () => {
      map.enabled = enabled.checked;
      refreshHeader();
      scheduleSave();
    });

    titleBtn.addEventListener('click', () => setOpen(body.hidden));

    $('.m-dup', node).addEventListener('click', () => {
      const copy = FF.deepClone(map);
      copy.id = FF.uid();
      copy.name = copy.name + ' (copy)';
      options.forms.splice(options.forms.indexOf(map) + 1, 0, copy);
      openMapIds.add(copy.id);
      scheduleSave();
      renderForms();
      showToast('Made a copy of “' + (map.name || 'form map') + '”.');
    });

    $('.m-del', node).addEventListener('click', () => {
      const index = options.forms.indexOf(map);
      if (index < 0) return;
      options.forms.splice(index, 1);
      openMapIds.delete(map.id);
      scheduleSave();
      renderForms();
      showToast('Deleted “' + (map.name || 'form map') + '”.', () => {
        options.forms.splice(Math.min(index, options.forms.length), 0, map);
        scheduleSave();
        renderForms();
      });
    });

    const nameInput = $('.m-name-input', node);
    nameInput.value = map.name || '';
    nameInput.addEventListener('input', () => {
      map.name = nameInput.value;
      refreshHeader();
      scheduleSave();
    });

    const trigger = $('.m-trigger-input', node);
    fillSelect(trigger, FF.FORM_TRIGGERS, map.trigger || 'click');
    trigger.addEventListener('change', () => {
      map.trigger = trigger.value;
      refreshHeader();
      scheduleSave();
    });

    const urlMode = $('.m-urlmode', node);
    fillSelect(urlMode, URL_MODE_CHOICES, map.urlMode || 'wildcard');
    urlMode.addEventListener('change', () => {
      map.urlMode = urlMode.value;
      scheduleSave();
    });

    const urls = $('.m-urls', node);
    urls.value = (map.urlPatterns || []).join('\n');
    urls.addEventListener('input', () => {
      map.urlPatterns = linesOf(urls.value);
      refreshHeader();
      scheduleSave();
    });

    const formKey = $('.m-formkey', node);
    formKey.value = map.formKey || '';
    formKey.addEventListener('input', () => {
      map.formKey = formKey.value.trim();
      scheduleSave();
    });

    const once = $('.m-once', node);
    once.checked = map.fillOncePerLoad !== false;
    once.addEventListener('change', () => {
      map.fillOncePerLoad = once.checked;
      scheduleSave();
    });

    const onlyEmpty = $('.m-empty', node);
    onlyEmpty.checked = map.onlyWhenEmpty !== false;
    onlyEmpty.addEventListener('change', () => {
      map.onlyWhenEmpty = onlyEmpty.checked;
      scheduleSave();
    });

    const stepDelay = $('.m-stepdelay', node);
    stepDelay.value = FF.numberOr(map.stepDelayMs, 350);
    stepDelay.addEventListener('input', () => {
      map.stepDelayMs = stepDelay.value === '' ? 0 : Number(stepDelay.value);
      scheduleSave();
    });

    const waitOptions = $('.m-waitoptions', node);
    waitOptions.value = FF.numberOr(map.waitForOptionsMs, 3000);
    waitOptions.addEventListener('input', () => {
      map.waitForOptionsMs = waitOptions.value === '' ? 0 : Number(waitOptions.value);
      scheduleSave();
    });

    renderEntries($('.m-entries', node), map);

    const previewOut = $('.m-preview-out', node);
    $('.m-preview', node).addEventListener('click', () => {
      previewOut.textContent = map.entries
        .filter((e) => e.enabled !== false && e.type !== 'skip')
        .slice(0, 6)
        .map((e) => {
          const value = FF.generateForField(e, options.settings);
          const shown =
            value === '' || value === null
              ? e.type === 'selectOption'
                ? '(an option on the page)'
                : '(empty)'
              : value;
          return (e.label || e.name) + ': ' + shown;
        })
        .join('   ·   ');
    });

    refreshHeader();
    setOpen(openMapIds.has(map.id));
    return node;
  }

  function renderForms() {
    formListEl.innerHTML = '';
    options.forms.forEach((map) => formListEl.appendChild(renderMapCard(map)));
    formsEmptyEl.hidden = options.forms.length > 0;
  }

  /* --- turning a popup capture into a map --- */
  function renderCapture() {
    const pane = $('#capturePane');
    if (!capture) {
      pane.hidden = true;
      return;
    }
    pane.hidden = false;
    $('#captureMeta').textContent =
      'From ' + (capture.title ? '“' + capture.title + '” · ' : '') + capture.url;

    const filledCount = capture.forms.reduce(
      (total, form) => total + form.fields.filter((f) => f.hasValue).length,
      0
    );
    $('#captureUseValues').checked = filledCount > 0;
    $('#captureValueHint').textContent = filledCount
      ? plural(filledCount, 'field') +
        ' on that page already had something in them. Keep this ticked to save exactly those values — ' +
        'including the hidden id behind any lookup field — so the form comes out the same every time.'
      : 'Nothing was filled in on that page, so each field will get a made-up value. Tip: fill the form ' +
        'in by hand first, then map it again, and your exact entries will be kept.';

    const select = $('#captureSelect');
    select.innerHTML = '';
    capture.forms.forEach((form, index) => {
      const opt = document.createElement('option');
      opt.value = String(index);
      opt.textContent = form.label + '  (' + form.fields.length + ' fields)';
      select.appendChild(opt);
    });
  }

  function urlPatternFor(rawUrl) {
    try {
      const url = new URL(rawUrl);
      return url.origin + url.pathname + '*';
    } catch (err) {
      return rawUrl;
    }
  }

  function hostOf(rawUrl) {
    try {
      return new URL(rawUrl).hostname;
    } catch (err) {
      return rawUrl;
    }
  }

  /* Turn one captured field into a map entry.
   *
   * With `useValues` on, whatever was on the page is pinned: a text box becomes
   * a constant, a dropdown is locked to the option that was chosen, a checkbox
   * keeps its state. That is what makes AJAX lookups work — the value the
   * widget resolved to (and the hidden id it wrote) is replayed verbatim,
   * with no need to retype a query and wait for suggestions. */
  function entryFromCapture(field, useValues) {
    const entry = {
      selector: field.selector,
      multi: !!field.multi,
      name: field.name || '',
      label: field.label || '',
      inputType: field.inputType,
      choices: field.choices || [],
      choiceMatchBy: field.choiceMatchBy || 'value',
      capturedValue: field.hasValue ? field.value : '',
      type: field.type,
      options: {},
      /* A hidden field is only ever useful as a remembered value. */
      enabled: field.inputType !== 'hidden' || (useValues && field.hasValue)
    };

    const pin = useValues && field.hasValue;

    if (pin && field.inputType === 'checkbox') {
      entry.type = 'checked';
      entry.options = { mode: field.value ? 'always' : 'never' };
      return entry;
    }

    if (pin && (field.inputType === 'select' || field.multi)) {
      entry.type = 'selectOption';
      entry.options = { values: String(field.value), matchBy: field.choiceMatchBy || 'value' };
      return entry;
    }

    if (pin) {
      entry.type = 'constant';
      entry.options = { value: String(field.value) };
      return entry;
    }

    entry.options = Object.assign({}, FF.DEFAULT_TYPE_OPTIONS[field.type] || {});
    if (field.choices && field.choices.length) {
      entry.options.matchBy = field.choiceMatchBy || 'value';
    }
    return entry;
  }

  function createMapFromCapture() {
    if (!capture) return;
    const form = capture.forms[Number($('#captureSelect').value) || 0];
    if (!form) return;
    const useValues = $('#captureUseValues').checked;

    const map = FF.newFormMap({
      name: form.label + ' — ' + hostOf(capture.url),
      urlMode: 'wildcard',
      urlPatterns: [urlPatternFor(capture.url)],
      formKey: form.key,
      formLabel: form.label,
      entries: form.fields.map((field) => entryFromCapture(field, useValues))
    });

    options.forms.unshift(map);
    openMapIds.add(map.id);
    dismissCapture();
    scheduleSave();
    renderForms();

    revealCard(formListEl.querySelector('[data-id="' + map.id + '"]'));
    showToast('Saved “' + map.name + '”. Check the values below.');
  }

  function dismissCapture() {
    capture = null;
    chrome.storage.local.remove('formFillerCapture');
    renderCapture();
  }

  async function loadCapture() {
    const stored = await chrome.storage.local.get('formFillerCapture');
    const found = stored && stored.formFillerCapture;
    /* a capture older than 10 minutes is stale - drop it */
    if (found && Date.now() - (found.capturedAt || 0) < 10 * 60 * 1000) {
      capture = found;
    } else if (found) {
      chrome.storage.local.remove('formFillerCapture');
    }
    renderCapture();
    if (capture) showTab('forms');
  }

  /* ---------------------------------------------------------------- *
   * Website tester
   * ---------------------------------------------------------------- */
  function refreshUrlTest() {
    const url = $('#urlTest').value.trim();
    const out = $('#urlTestResult');
    const cards = $$('#fieldList .field-card');

    if (!url) {
      out.textContent = '';
      cards.forEach((card) => (card.style.opacity = ''));
      return;
    }

    const applicable = FF.fieldsForUrl(options.fields, url);
    const ids = new Set(applicable.map((f) => f.id));
    out.textContent = applicable.length + ' of ' + plural(options.fields.length, 'rule') + ' would run there';
    cards.forEach((card) => {
      card.style.opacity = ids.has(card.dataset.id) ? '' : '0.35';
    });
  }

  /* ---------------------------------------------------------------- *
   * Backup
   * ---------------------------------------------------------------- */
  function exportBackup() {
    const blob = new Blob([JSON.stringify(options, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'form-filler-backup-' + FF.formatDate(new Date(), 'YYYY-MM-DD') + '.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    showToast('Backup downloaded.');
  }

  function importBackup(file) {
    const status = $('#importStatus');
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        const incoming = FF.normalizeOptions(parsed);
        const mode = $('input[name="importMode"]:checked').value;

        if (mode === 'append') {
          incoming.fields.forEach((f) => {
            f.id = FF.uid();
            options.fields.push(f);
          });
          incoming.forms.forEach((m) => {
            m.id = FF.uid();
            options.forms.push(m);
          });
        } else {
          options = incoming;
        }
        await FF.saveOptions(options);
        readSettingsIntoForm();
        renderFields();
        renderForms();
        status.textContent =
          '✓ Restored ' + plural(incoming.fields.length, 'rule') + ' and ' + plural(incoming.forms.length, 'form map') + '.';
      } catch (err) {
        status.textContent = 'That file couldn’t be read. Is it a Form Filler backup? (' + err.message + ')';
      }
    };
    reader.readAsText(file);
  }

  /* ---------------------------------------------------------------- *
   * Boot
   * ---------------------------------------------------------------- */
  function handleDeepLink() {
    const hash = location.hash || '';
    if (hash.indexOf('new-field') === -1) return;
    const match = /url=([^&]*)/.exec(hash);
    const pattern = match ? decodeURIComponent(match[1]) : '';
    addField({
      name: pattern ? 'Rule for ' + pattern : 'New field',
      urlMode: 'domain',
      urlPatterns: pattern ? [pattern] : []
    });
    history.replaceState(null, '', location.pathname);
  }

  async function init() {
    const versionEl = $('#version');
    if (versionEl) versionEl.textContent = 'v' + chrome.runtime.getManifest().version;

    options = await FF.loadOptions();
    readSettingsIntoForm();
    bindSettings();
    renderPackCards();
    renderFields();
    renderForms();
    handleDeepLink();
    await loadCapture();

    $('#captureCreate').addEventListener('click', createMapFromCapture);
    $('#captureDismiss').addEventListener('click', dismissCapture);

    bindDrawer('#togglePacks', '#packDrawer', () => {
      $('#packHint').textContent = '';
    });
    bindDrawer('#toggleUrlTest', '#urlDrawer', () => {
      $('#urlTest').value = '';
      refreshUrlTest();
    });

    $('#addField').addEventListener('click', () => addField());
    $('#fieldSearch').addEventListener('input', renderFields);
    $('#fieldFilter').addEventListener('change', renderFields);
    $('#urlTest').addEventListener('input', refreshUrlTest);
    $('#exportBtn').addEventListener('click', exportBackup);
    $('#importFile').addEventListener('change', (event) => {
      const file = event.target.files && event.target.files[0];
      if (file) importBackup(file);
      event.target.value = '';
    });
    $('#resetBtn').addEventListener('click', async () => {
      if (!confirm('Delete every rule and form map, and reset all settings? This can’t be undone.')) return;
      options = FF.normalizeOptions(null);
      await FF.saveOptions(options);
      openIds.clear();
      openMapIds.clear();
      readSettingsIntoForm();
      renderFields();
      renderForms();
      showToast('Everything has been reset.');
    });
  }

  init();
})();
