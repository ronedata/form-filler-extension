/* Form Filler - turns a custom-field definition (or a bare element type) into a value. */
(function (global) {
  const FF = (global.FF = global.FF || {});
  const R = FF.random;

  function pad(n, width) {
    return String(n).padStart(width || 2, '0');
  }

  /* Supported tokens: YYYY YY MM M DD D HH H hh h mm ss A a */
  function formatDate(date, format) {
    const hours24 = date.getHours();
    const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
    const map = {
      YYYY: date.getFullYear(),
      YY: pad(date.getFullYear() % 100),
      MM: pad(date.getMonth() + 1),
      M: date.getMonth() + 1,
      DD: pad(date.getDate()),
      D: date.getDate(),
      HH: pad(hours24),
      H: hours24,
      hh: pad(hours12),
      h: hours12,
      mm: pad(date.getMinutes()),
      ss: pad(date.getSeconds()),
      A: hours24 < 12 ? 'AM' : 'PM',
      a: hours24 < 12 ? 'am' : 'pm'
    };
    return String(format || 'YYYY-MM-DD').replace(
      /YYYY|YY|MM|M|DD|D|HH|H|hh|h|mm|ss|A|a/g,
      function (token) {
        return map[token];
      }
    );
  }
  FF.formatDate = formatDate;

  /* Split a textarea value into a clean list: newline and comma separated. */
  function toList(raw) {
    if (Array.isArray(raw)) return raw.filter(Boolean);
    if (!raw) return [];
    return String(raw)
      .split(/[\n,]/)
      .map(function (s) {
        return s.trim();
      })
      .filter(Boolean);
  }
  FF.toList = toList;

  function slug(text) {
    return String(text)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '');
  }

  /* Bangladeshi names keep first name, surname and gender consistent: a
   * female-only surname such as Akter never follows a male first name, and a
   * Hindu first name gets a Hindu surname. */
  function useEnglishNames(settings) {
    return !!settings && settings.nameStyle === 'english';
  }

  function bdGroup() {
    return R.bool(0.85) ? FF.DATA.bd.muslim : FF.DATA.bd.hindu;
  }

  function personName(settings) {
    if (useEnglishNames(settings)) {
      return { first: R.pick(FF.DATA.firstNames), last: R.pick(FF.DATA.lastNames) };
    }
    const group = bdGroup();
    const female = R.bool();
    const first = R.pick(female ? group.female : group.male);
    const gendered = female ? group.femaleSurnames : group.maleSurnames;
    const last = gendered.length && R.bool(0.25) ? R.pick(gendered) : R.pick(group.surnames);
    return { first: first, last: last };
  }
  FF.personName = personName;

  /* A surname on its own has to fit anyone, so only the shared ones qualify. */
  function surnameOnly(settings) {
    if (useEnglishNames(settings)) return R.pick(FF.DATA.lastNames);
    return R.pick(bdGroup().surnames);
  }

  function buildUsername(settings, opts) {
    const mode = (opts && opts.usernameMode && opts.usernameMode !== 'inherit')
      ? opts.usernameMode
      : settings.emailUsernameMode;

    if (mode === 'list') {
      const list = toList((opts && opts.usernameList) || settings.emailUsernameList);
      if (list.length) return R.pick(list);
    }
    if (mode === 'random') {
      return R.alphanumeric(R.int(6, 12));
    }
    /* name based */
    const person = personName(settings);
    const first = slug(person.first);
    const last = slug(person.last);
    const style = R.int(1, 4);
    if (style === 1) return first + '.' + last;
    if (style === 2) return first + last + R.int(1, 99);
    if (style === 3) return first[0] + last;
    return first + '_' + last;
  }

  function buildEmail(settings, opts) {
    const domains = toList((opts && opts.domains) || settings.emailDomains);
    const domain = domains.length ? R.pick(domains) : 'example.com';
    const prefix = (settings.emailPrefix || '').trim();
    return prefix + buildUsername(settings, opts) + '@' + domain.replace(/^@/, '');
  }

  function parseDateInput(value) {
    if (!value) return null;
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  }

  /* --------------------------------------------------------------- *
   * Core: generate a value for an explicit field definition
   * --------------------------------------------------------------- */
  function generateValue(type, opts, settings) {
    opts = opts || {};
    settings = settings || FF.DEFAULT_SETTINGS.settings;

    switch (type) {
      case 'firstName':
        return personName(settings).first;
      case 'lastName':
        return surnameOnly(settings);
      case 'fullName': {
        const person = personName(settings);
        return person.first + ' ' + person.last;
      }
      case 'username':
        return buildUsername(settings, opts);
      case 'email':
        return buildEmail(settings, opts);
      case 'password':
        if (settings.passwordFixedValue) return settings.passwordFixedValue;
        return R.password(opts.length || settings.passwordLength,
          opts.symbols !== undefined ? opts.symbols : settings.passwordUseSymbols);
      case 'phone':
        return R.fromTemplate(opts.template || settings.phoneTemplate || '+8801[3-9]########');

      case 'streetAddress':
        return R.int(1, 9999) + ' ' + R.pick(FF.DATA.streetNames) + ' ' + R.pick(FF.DATA.streetTypes);
      case 'city':
        return R.pick(FF.DATA.cities);
      case 'state':
        return R.pick(FF.DATA.states);
      case 'zipCode':
        return R.fromTemplate('#####');
      case 'country':
        return R.pick(FF.DATA.countries);

      case 'number': {
        const min = numberOr(opts.min, settings.defaultNumberMin);
        const max = numberOr(opts.max, settings.defaultNumberMax);
        const decimals = numberOr(opts.decimalPlaces, 0);
        const value = decimals > 0 ? R.float(min, max, decimals).toFixed(decimals) : R.int(min, max);
        return (opts.prefix || '') + value + (opts.suffix || '');
      }
      case 'date':
        return formatDate(
          R.dateBetween(parseDateInput(opts.minDate), parseDateInput(opts.maxDate)),
          opts.format || settings.dateFormat
        );
      case 'time':
        return formatDate(R.dateBetween(), opts.format || settings.timeFormat || 'HH:mm');

      case 'text': {
        const custom = toList(opts.wordList);
        const min = numberOr(opts.minWords, settings.defaultTextMinWords);
        const max = numberOr(opts.maxWords, settings.defaultTextMaxWords);
        let out;
        if (custom.length) {
          const count = R.int(min, max);
          const picked = [];
          for (let i = 0; i < count; i++) picked.push(R.pick(custom));
          out = picked.join(' ');
        } else {
          out = R.sentence(min, max);
        }
        const cap = numberOr(opts.maxLength, 0);
        return cap > 0 ? out.slice(0, cap) : out;
      }
      case 'alphanumeric':
        return R.fromTemplate(opts.template || 'LLL-####');
      case 'regex':
        return FF.fromRegex(opts.pattern || '');
      case 'randomizedList': {
        const items = toList(opts.items);
        return items.length ? R.pick(items) : '';
      }
      case 'constant':
        return opts.value !== undefined ? String(opts.value) : '';

      case 'url':
        return 'https://www.' + slug(R.pick(FF.DATA.companyWords)) + '.' + R.pick(FF.DATA.tlds);
      case 'ipv4':
        return [R.int(1, 254), R.int(0, 255), R.int(0, 255), R.int(1, 254)].join('.');
      case 'color':
        return '#' + R.chars('0123456789abcdef', 6);
      case 'uuid':
        return R.uuid();
      case 'company':
        return R.pick(FF.DATA.companyWords) + ' ' + R.pick(FF.DATA.companySuffixes);
      case 'jobTitle':
        return R.pick(FF.DATA.jobTitles);

      case 'checked':
        if (opts.mode === 'always') return true;
        if (opts.mode === 'never') return false;
        return R.bool();

      case 'autocomplete':
        /* The filler types this, waits, then picks a suggestion; here we only
         * surface the query so previews show something meaningful. */
        return String(opts.query || '');

      case 'selectOption':
        /* Resolved against the real element by the filler; here we only expose
         * the candidate list so callers can preview it. */
        return R.pick(toList(opts.values));

      case 'skip':
        return null;

      default:
        return R.sentence(3, 8);
    }
  }

  function numberOr(value, fallback) {
    const n = Number(value);
    return Number.isFinite(n) && value !== '' && value !== null ? n : Number(fallback) || 0;
  }
  FF.numberOr = numberOr;

  FF.generateValue = generateValue;

  FF.generateForField = function generateForField(field, settings) {
    return generateValue(field.type, field.options || {}, settings);
  };

  /* --------------------------------------------------------------- *
   * Fallback: guess a sensible value from the element itself
   * --------------------------------------------------------------- */
  const HEURISTICS = [
    { type: 'email', re: /e[-_]?mail/i },
    { type: 'firstName', re: /(first|given|fore)[-_ ]?name|fname/i },
    { type: 'lastName', re: /(last|sur|family)[-_ ]?name|lname/i },
    { type: 'username', re: /\b(username|userid|login|nick(name)?)\b/i },
    { type: 'fullName', re: /\b(full name|your name|display name|name)\b/i },
    { type: 'phone', re: /phone|mobile|tel|contact[-_ ]?number|cell/i },
    { type: 'company', re: /company|organi[sz]ation|employer|business/i },
    { type: 'jobTitle', re: /job[-_ ]?title|position|designation|occupation/i },
    { type: 'streetAddress', re: /address|street|addr(1|ess1)?/i },
    { type: 'city', re: /city|town|locality/i },
    { type: 'state', re: /state|province|region/i },
    { type: 'zipCode', re: /zip|postal|postcode|pincode/i },
    { type: 'country', re: /country/i },
    { type: 'url', re: /website|url|homepage|site/i },
    { type: 'date', re: /\b(date|dob|birthday|birthdate|birth)\b/i },
    { type: 'number', re: /\b(age|quantity|qty|amount|price|cost|count|number|num|year|total)\b/i },
    { type: 'text', re: /comment|message|description|note|bio|about|feedback|remark/i }
  ];

  /* Attribute values arrive as `user_email` or `firstName`; split them into
   * words so the word-boundary heuristics above behave. */
  function normalizeTokens(tokens) {
    return (tokens || [])
      .join(' ')
      .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
      .replace(/[^a-zA-Z0-9]+/g, ' ')
      .trim();
  }

  /* `tokens` is the haystack built by the matcher (name, id, label, ...) */
  FF.guessType = function guessType(inputType, tokens) {
    switch (inputType) {
      case 'email': return 'email';
      case 'password': return 'password';
      case 'tel': return 'phone';
      case 'url': return 'url';
      case 'number': return 'number';
      case 'range': return 'number';
      case 'color': return 'color';
      case 'date':
      case 'month':
      case 'week':
      case 'datetime-local': return 'date';
      case 'time': return 'time';
      /* For these the element itself dictates the answer - a name heuristic
       * must never win, or a <select name="city"> would be handed a random
       * city string that is not one of its options. */
      case 'select':
      case 'select-one':
      case 'select-multiple':
      case 'radio': return 'selectOption';
      case 'checkbox': return 'checked';
      default:
        break;
    }
    const haystack = normalizeTokens(tokens);
    for (let i = 0; i < HEURISTICS.length; i++) {
      if (HEURISTICS[i].re.test(haystack)) return HEURISTICS[i].type;
    }
    return 'text';
  };
})(typeof self !== 'undefined' ? self : this);
