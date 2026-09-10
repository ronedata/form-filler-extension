/* Form Filler - tiny regular-expression string generator.
 * Supports: literals, escapes (\d \w \s and their negations, \n \t \r),
 * character classes [a-z0-9] incl. negation, ".", groups ( ) and (?: ),
 * alternation |, quantifiers * + ? {n} {n,m} {n,}. Anchors are ignored.
 */
(function (global) {
  const FF = (global.FF = global.FF || {});

  const PRINTABLE = [];
  for (let c = 32; c <= 126; c++) PRINTABLE.push(String.fromCharCode(c));

  const DIGITS = '0123456789'.split('');
  const WORD = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_'.split('');
  const SPACE = [' '];
  const DOT = PRINTABLE.filter((c) => c !== '\n');
  const BACKSLASH = '\\';

  const MAX_REPEAT = 12; /* upper bound used for unbounded * and + */

  function pick(list) {
    return list[Math.floor(Math.random() * list.length)];
  }

  function negate(set) {
    const bad = new Set(set);
    const out = PRINTABLE.filter((c) => !bad.has(c));
    return out.length ? out : ['x'];
  }

  function escapeSet(ch) {
    switch (ch) {
      case 'd': return DIGITS;
      case 'D': return negate(DIGITS);
      case 'w': return WORD;
      case 'W': return negate(WORD);
      case 's': return SPACE;
      case 'S': return negate(SPACE);
      case 'n': return ['\n'];
      case 't': return ['\t'];
      case 'r': return ['\r'];
      default: return [ch];
    }
  }

  function parse(source) {
    let pos = 0;

    function peek() {
      return source[pos];
    }
    function eat(ch) {
      if (source[pos] === ch) {
        pos++;
        return true;
      }
      return false;
    }

    function parseAlternation() {
      const branches = [parseSequence()];
      while (eat('|')) branches.push(parseSequence());
      return branches.length === 1 ? branches[0] : { kind: 'alt', branches: branches };
    }

    function parseSequence() {
      const items = [];
      while (pos < source.length && peek() !== '|' && peek() !== ')') {
        const before = pos;
        const atom = parseAtom();
        if (atom) items.push(parseQuantifier(atom));
        if (pos === before) pos++; /* safety valve, never loop forever */
      }
      return { kind: 'seq', items: items };
    }

    function parseQuantifier(atom) {
      const ch = peek();
      let min = null;
      let max = null;

      if (ch === '*') { pos++; min = 0; max = MAX_REPEAT; }
      else if (ch === '+') { pos++; min = 1; max = MAX_REPEAT; }
      else if (ch === '?') { pos++; min = 0; max = 1; }
      else if (ch === '{') {
        const close = source.indexOf('}', pos);
        const body = close === -1 ? '' : source.slice(pos + 1, close);
        const m = /^(\d+)(,(\d*)?)?$/.exec(body);
        if (m) {
          pos = close + 1;
          min = parseInt(m[1], 10);
          max = m[2] === undefined ? min : m[3] ? parseInt(m[3], 10) : min + MAX_REPEAT;
        }
      }

      if (min === null) return atom;
      /* lazy / possessive markers are accepted and ignored */
      if (peek() === '?' || peek() === '+') pos++;
      if (max < min) max = min;
      return { kind: 'repeat', min: min, max: Math.min(max, 500), node: atom };
    }

    function parseAtom() {
      const ch = source[pos];

      if (ch === '(') {
        pos++;
        if (source[pos] === '?') {
          if (source[pos + 1] === ':') {
            pos += 2;
          } else if (source[pos + 1] === '<' && /[a-zA-Z_]/.test(source[pos + 2] || '')) {
            const gt = source.indexOf('>', pos);
            pos = gt === -1 ? pos + 2 : gt + 1;
          } else {
            /* look-around: consume and contribute nothing */
            let depth = 1;
            pos += 2;
            while (pos < source.length && depth > 0) {
              if (source[pos] === '(') depth++;
              else if (source[pos] === ')') depth--;
              pos++;
            }
            return null;
          }
        }
        const inner = parseAlternation();
        eat(')');
        return inner;
      }

      if (ch === '[') return parseCharClass();

      if (ch === BACKSLASH) {
        pos++;
        const esc = source[pos++];
        if (/[1-9]/.test(esc)) return { kind: 'set', set: [''] }; /* backreference -> empty */
        return { kind: 'set', set: escapeSet(esc) };
      }

      if (ch === '.') { pos++; return { kind: 'set', set: DOT }; }
      if (ch === '^' || ch === '$') { pos++; return null; }

      pos++;
      return { kind: 'set', set: [ch] };
    }

    function parseCharClass() {
      pos++; /* consume [ */
      const negated = eat('^');
      const set = [];
      while (pos < source.length && source[pos] !== ']') {
        let ch = source[pos];
        if (ch === BACKSLASH) {
          pos++;
          const esc = source[pos++];
          const expanded = escapeSet(esc);
          if (expanded.length > 1) {
            set.push.apply(set, expanded);
            continue;
          }
          ch = expanded[0];
        } else {
          pos++;
        }
        if (source[pos] === '-' && source[pos + 1] && source[pos + 1] !== ']') {
          pos++;
          let hi = source[pos];
          if (hi === BACKSLASH) {
            pos++;
            hi = source[pos];
          }
          pos++;
          for (let c = ch.charCodeAt(0); c <= hi.charCodeAt(0); c++) {
            set.push(String.fromCharCode(c));
          }
        } else {
          set.push(ch);
        }
      }
      eat(']');
      const final = negated ? negate(set) : set;
      return { kind: 'set', set: final.length ? final : ['x'] };
    }

    return parseAlternation();
  }

  /* Nested quantifiers a user typed by hand, like `((a{500}){500}){500}`, can
   * multiply into millions of characters. `budget` is how many are left to
   * spend; every kind of node stops as soon as it hits zero, so a pattern
   * like that trails off instead of freezing the tab. */
  function render(node, budget) {
    if (!node || budget.left <= 0) return '';
    switch (node.kind) {
      case 'seq': {
        let out = '';
        for (let i = 0; i < node.items.length && budget.left > 0; i++) {
          out += render(node.items[i], budget);
        }
        return out;
      }
      case 'alt':
        return render(pick(node.branches), budget);
      case 'set': {
        const chosen = pick(node.set);
        budget.left -= chosen.length || 1;
        return chosen;
      }
      case 'repeat': {
        const count = node.min + Math.floor(Math.random() * (node.max - node.min + 1));
        let out = '';
        for (let i = 0; i < count && budget.left > 0; i++) out += render(node.node, budget);
        return out;
      }
      default:
        return '';
    }
  }

  /* Plenty for any real-world pattern; only a pathological one ever hits it. */
  const MAX_OUTPUT_LENGTH = 20000;

  /* Generate a random string matching `pattern`. A wrapping /.../flags is
   * stripped, so both `\d{3}` and `/\d{3}/i` work. */
  FF.fromRegex = function fromRegex(pattern) {
    if (!pattern) return '';
    let src = String(pattern).trim();
    const wrapped = /^\/(.*)\/[gimsuy]*$/.exec(src);
    if (wrapped) src = wrapped[1];
    try {
      return render(parse(src), { left: MAX_OUTPUT_LENGTH });
    } catch (err) {
      return '';
    }
  };
})(typeof self !== 'undefined' ? self : this);
