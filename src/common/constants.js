/* Form Filler - shared constants (classic script, attaches to global FF namespace) */
(function (global) {
  const FF = (global.FF = global.FF || {});

  FF.STORAGE_KEY = 'formFillerOptions';
  FF.SCHEMA_VERSION = 1;

  /* ---------------------------------------------------------------- *
   * Data types a custom field can generate
   * ---------------------------------------------------------------- */
  FF.DATA_TYPES = [
    { value: 'firstName', label: 'First name', group: 'Person' },
    { value: 'lastName', label: 'Last name', group: 'Person' },
    { value: 'fullName', label: 'Full name', group: 'Person' },
    { value: 'username', label: 'Username', group: 'Person' },
    { value: 'email', label: 'Email address', group: 'Person' },
    { value: 'password', label: 'Password', group: 'Person' },
    { value: 'phone', label: 'Phone number', group: 'Person' },

    { value: 'streetAddress', label: 'Street address', group: 'Address' },
    { value: 'city', label: 'City', group: 'Address' },
    { value: 'state', label: 'State / Province', group: 'Address' },
    { value: 'zipCode', label: 'Zip / Postal code', group: 'Address' },
    { value: 'country', label: 'Country', group: 'Address' },

    { value: 'number', label: 'Number (range)', group: 'Values' },
    { value: 'date', label: 'Date', group: 'Values' },
    { value: 'time', label: 'Time', group: 'Values' },
    { value: 'text', label: 'Words / sentences', group: 'Values' },
    { value: 'alphanumeric', label: 'Alphanumeric (template)', group: 'Values' },
    { value: 'regex', label: 'Regular expression', group: 'Values' },
    { value: 'randomizedList', label: 'Random item from list', group: 'Values' },
    { value: 'constant', label: 'Constant value', group: 'Values' },

    { value: 'url', label: 'Website URL', group: 'Misc' },
    { value: 'ipv4', label: 'IPv4 address', group: 'Misc' },
    { value: 'color', label: 'Color (hex)', group: 'Misc' },
    { value: 'uuid', label: 'UUID v4', group: 'Misc' },
    { value: 'company', label: 'Company name', group: 'Misc' },
    { value: 'jobTitle', label: 'Job title', group: 'Misc' },

    { value: 'selectOption', label: 'Dropdown / radio option', group: 'Choices' },
    { value: 'autocomplete', label: 'Autocomplete (type, then pick)', group: 'Choices' },
    { value: 'checked', label: 'Checkbox state', group: 'Choices' },
    { value: 'skip', label: 'Never fill (skip field)', group: 'Choices' }
  ];

  /* Attributes that can be inspected when matching an element */
  FF.MATCH_TYPES = [
    { value: 'name', label: 'name' },
    { value: 'id', label: 'id' },
    { value: 'class', label: 'class' },
    { value: 'placeholder', label: 'placeholder' },
    { value: 'label', label: 'label text' },
    { value: 'aria-label', label: 'aria-label' },
    { value: 'title', label: 'title' },
    { value: 'type', label: 'type' },
    { value: 'data-*', label: 'data-* attributes' }
  ];

  FF.MATCH_MODES = [
    { value: 'contains', label: 'Contains' },
    { value: 'exact', label: 'Exactly matches' },
    { value: 'startsWith', label: 'Starts with' },
    { value: 'endsWith', label: 'Ends with' },
    { value: 'regex', label: 'Regular expression' },
    { value: 'selector', label: 'CSS selector' }
  ];

  FF.URL_MODES = [
    { value: 'wildcard', label: 'Wildcard (use * )' },
    { value: 'domain', label: 'Domain / subdomain' },
    { value: 'regex', label: 'Regular expression' }
  ];

  FF.EMAIL_USERNAME_MODES = [
    { value: 'random', label: 'Random string' },
    { value: 'name', label: 'Based on a random name' },
    { value: 'list', label: 'Random item from my list' }
  ];

  /* A brand new custom field */
  FF.newField = function newField(overrides) {
    return Object.assign(
      {
        id: FF.uid(),
        name: 'New field',
        enabled: true,
        matchMode: 'contains',
        matchTypes: ['name', 'id', 'placeholder', 'label', 'aria-label'],
        matchValues: [],
        selector: '',
        urlMode: 'wildcard',
        urlPatterns: [],
        type: 'text',
        options: {}
      },
      overrides || {}
    );
  };

  FF.AUTOCOMPLETE_PICKS = [
    { value: 'first', label: 'First suggestion' },
    { value: 'random', label: 'A random suggestion' },
    { value: 'match', label: 'The one containing my text' }
  ];

  FF.AUTOCOMPLETE_COMMITS = [
    { value: 'click', label: 'Click the suggestion' },
    { value: 'keyboard', label: 'Arrow down + Enter' }
  ];

  FF.FORM_TRIGGERS = [
    { value: 'click', label: 'When I click into the form' },
    { value: 'auto', label: 'Automatically when the page loads' },
    { value: 'manual', label: 'Only when I ask (popup or shortcut)' }
  ];

  /* A saved form mapping: which form, on which URLs, and what each field gets. */
  FF.newFormMap = function newFormMap(overrides) {
    return Object.assign(
      {
        id: FF.uid(),
        name: 'New form map',
        enabled: true,
        trigger: 'click',
        urlMode: 'wildcard',
        urlPatterns: [],
        formKey: '',
        formLabel: '',
        fillOncePerLoad: true,
        onlyWhenEmpty: true,
        stepDelayMs: 350,
        waitForOptionsMs: 3000,
        entries: []
      },
      overrides || {}
    );
  };

  FF.DEFAULT_TYPE_OPTIONS = {
    number: { min: 1, max: 100, decimalPlaces: 0, prefix: '', suffix: '' },
    date: { format: 'YYYY-MM-DD', minDate: '', maxDate: '' },
    time: { format: 'HH:mm' },
    text: { minWords: 5, maxWords: 20, maxLength: 0, wordList: '' },
    alphanumeric: { template: 'LLL-####' },
    regex: { pattern: '[A-Z]{3}-[0-9]{4}' },
    randomizedList: { items: '' },
    constant: { value: '' },
    email: { usernameMode: 'inherit', domains: '' },
    password: { length: 12, symbols: true },
    phone: { template: '' },
    selectOption: { values: '', matchBy: 'value' },
    autocomplete: {
      query: '',
      suggestionSelector: '',
      pick: 'first',
      matchText: '',
      /* empty = use the Settings value */
      waitMs: '',
      commit: ''
    },
    checked: { mode: 'random' }
  };

  /* ---------------------------------------------------------------- *
   * Global settings
   * ---------------------------------------------------------------- */
  FF.DEFAULT_SETTINGS = {
    version: FF.SCHEMA_VERSION,
    settings: {
      ignoreHiddenFields: true,
      ignoreDisabledFields: true,
      ignoreFieldsWithContent: false,
      confirmPageFill: false,
      highlightFilled: true,
      triggerClickEvents: true,
      ignoredTypes: ['file', 'image', 'submit', 'reset', 'button', 'hidden'],
      ignoredSelectors: '',
      defaultMaxLength: 0,
      agreeToTerms: true,
      fillPasswordFields: true,
      showContextMenu: true,

      waitForDropdowns: true,
      dropdownWaitMs: 3000,
      excludedOptionWords: '',
      autoPickSuggestions: true,
      suggestionPick: 'first',
      suggestionMinChars: 2,
      suggestionWaitMs: 3500,
      suggestionCommit: 'click',
      suggestionSelector: '',

      nameStyle: 'bangladeshi',

      emailUsernameMode: 'name',
      emailUsernameList: '',
      emailDomains: 'example.com, mailinator.com, test.dev',
      emailPrefix: '',

      passwordLength: 12,
      passwordUseSymbols: true,
      passwordFixedValue: '',

      phoneTemplate: '+8801[3-9]########',

      defaultNumberMin: 1,
      defaultNumberMax: 1000,
      defaultTextMinWords: 5,
      defaultTextMaxWords: 25,

      dateFormat: 'YYYY-MM-DD',
      timeFormat: 'HH:mm'
    },
    fields: [],
    forms: []
  };

  FF.uid = function uid() {
    if (global.crypto && typeof global.crypto.randomUUID === 'function') {
      return global.crypto.randomUUID();
    }
    return 'f-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
  };
})(typeof self !== 'undefined' ? self : this);
