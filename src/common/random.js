/* Form Filler - random primitives and the word lists the generators draw from. */
(function (global) {
  const FF = (global.FF = global.FF || {});

  const DATA = {
    firstNames: [
      'James', 'Mary', 'Robert', 'Patricia', 'John', 'Jennifer', 'Michael', 'Linda',
      'David', 'Elizabeth', 'William', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica',
      'Thomas', 'Sarah', 'Charles', 'Karen', 'Daniel', 'Nancy', 'Matthew', 'Lisa',
      'Anthony', 'Betty', 'Mark', 'Margaret', 'Donald', 'Sandra', 'Steven', 'Ashley',
      'Paul', 'Kimberly', 'Andrew', 'Emily', 'Joshua', 'Donna', 'Kenneth', 'Michelle',
      'Kevin', 'Carol', 'Brian', 'Amanda', 'George', 'Dorothy', 'Timothy', 'Melissa',
      'Ronald', 'Deborah', 'Jason', 'Stephanie', 'Edward', 'Rebecca', 'Jeffrey', 'Sharon',
      'Ryan', 'Laura', 'Jacob', 'Cynthia', 'Gary', 'Amy', 'Nicholas', 'Kathleen',
      'Eric', 'Angela', 'Jonathan', 'Shirley', 'Stephen', 'Brenda', 'Larry', 'Pamela',
      'Justin', 'Nicole', 'Scott', 'Katherine', 'Adam', 'Samantha', 'Nathan', 'Christine'
    ],
    lastNames: [
      'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
      'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson',
      'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson',
      'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker',
      'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores',
      'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell',
      'Carter', 'Roberts', 'Gomez', 'Phillips', 'Evans', 'Turner', 'Diaz', 'Parker',
      'Cruz', 'Edwards', 'Collins', 'Reyes', 'Stewart', 'Morris', 'Morales', 'Murphy',
      'Cook', 'Rogers', 'Gutierrez', 'Ortiz', 'Morgan', 'Cooper', 'Peterson', 'Bailey'
    ],
    cities: [
      'Springfield', 'Riverside', 'Fairview', 'Greenville', 'Bristol', 'Clinton',
      'Georgetown', 'Salem', 'Madison', 'Arlington', 'Ashland', 'Burlington', 'Dover',
      'Franklin', 'Kingston', 'Lexington', 'Milton', 'Newport', 'Oxford', 'Auburn',
      'Manchester', 'Marion', 'Oakland', 'Winchester', 'Cleveland', 'Dayton', 'Hudson'
    ],
    states: [
      'Alabama', 'Arizona', 'California', 'Colorado', 'Connecticut', 'Delaware',
      'Florida', 'Georgia', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky',
      'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Missouri',
      'Nebraska', 'Nevada', 'New Jersey', 'New York', 'Ohio', 'Oregon',
      'Pennsylvania', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'Wisconsin'
    ],
    countries: [
      'United States', 'Canada', 'United Kingdom', 'Australia', 'Germany', 'France',
      'Netherlands', 'Sweden', 'Norway', 'Denmark', 'Spain', 'Italy', 'Portugal',
      'Ireland', 'New Zealand', 'Japan', 'Singapore', 'India', 'Bangladesh', 'Brazil'
    ],
    streetNames: [
      'Main', 'Oak', 'Pine', 'Maple', 'Cedar', 'Elm', 'Washington', 'Lake', 'Hill',
      'Park', 'Walnut', 'Spring', 'Highland', 'Sunset', 'Chestnut', 'Willow', 'Church'
    ],
    streetTypes: ['Street', 'Avenue', 'Road', 'Lane', 'Drive', 'Court', 'Boulevard', 'Way'],
    companySuffixes: ['Inc.', 'LLC', 'Group', 'Labs', 'Systems', 'Solutions', 'Partners', 'Studio'],
    companyWords: [
      'Northwind', 'Contoso', 'Acme', 'Globex', 'Initech', 'Umbrella', 'Stark',
      'Wayne', 'Cyberdyne', 'Vandelay', 'Soylent', 'Hooli', 'Pied Piper', 'Aperture'
    ],
    jobTitles: [
      'Software Engineer', 'Product Manager', 'Data Analyst', 'Designer', 'Accountant',
      'Marketing Lead', 'Support Specialist', 'Project Manager', 'QA Engineer',
      'Operations Manager', 'Sales Executive', 'Technical Writer', 'Recruiter'
    ],
    lorem: (
      'lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor ' +
      'incididunt ut labore et dolore magna aliqua enim ad minim veniam quis nostrud ' +
      'exercitation ullamco laboris nisi aliquip ex ea commodo consequat duis aute ' +
      'irure in reprehenderit voluptate velit esse cillum eu fugiat nulla pariatur ' +
      'excepteur sint occaecat cupidatat non proident sunt culpa qui officia deserunt ' +
      'mollit anim id est laborum'
    ).split(' '),
    tlds: ['com', 'net', 'org', 'io', 'dev', 'co'],

    /* Bangladeshi names, romanised the way they are usually typed into forms.
     * Kept apart by community and gender so a generated person is coherent. */
    bd: {
      muslim: {
        male: [
          'Tanvir', 'Rakib', 'Sakib', 'Nayeem', 'Mahmud', 'Arif', 'Imran', 'Farhan', 'Shakil',
          'Rafiq', 'Jahid', 'Hasan', 'Mehedi', 'Sabbir', 'Rashed', 'Tahmid', 'Ashik', 'Fahim',
          'Nahid', 'Sumon', 'Anik', 'Sajid', 'Rifat', 'Tushar', 'Asif', 'Zahid', 'Monir', 'Kamal',
          'Faisal', 'Riyad', 'Shahriar', 'Towhid', 'Emon', 'Arman', 'Parvez', 'Sohel', 'Rubel',
          'Hridoy', 'Ayon', 'Nafis', 'Saif', 'Tamim', 'Mushfiq', 'Mizan', 'Sujon', 'Masud',
          'Habib', 'Nazmul', 'Shohag', 'Mamun', 'Jewel', 'Tanim', 'Siam', 'Abir', 'Fardin'
        ],
        female: [
          'Nusrat', 'Farzana', 'Sadia', 'Tasnim', 'Sumaiya', 'Jannatul', 'Mim', 'Tania', 'Shirin',
          'Nasrin', 'Ayesha', 'Fatema', 'Sharmin', 'Rumana', 'Mahmuda', 'Taslima', 'Sabrina',
          'Afsana', 'Lamia', 'Nabila', 'Tahmina', 'Shanta', 'Lima', 'Mitu', 'Rupa', 'Shila', 'Jui',
          'Oishi', 'Tisha', 'Anika', 'Raisa', 'Maliha', 'Zarin', 'Nadia', 'Ishrat', 'Sanjida',
          'Rehana', 'Sathi', 'Bristy', 'Urmi', 'Mahi', 'Nishat', 'Tanjila', 'Afia', 'Sinthia',
          'Rabeya', 'Munira', 'Faria', 'Samia', 'Nowshin', 'Tabassum', 'Humaira'
        ],
        surnames: [
          'Hossain', 'Rahman', 'Ahmed', 'Islam', 'Chowdhury', 'Khan', 'Alam', 'Sarkar', 'Talukder',
          'Bhuiyan', 'Sheikh', 'Siddique', 'Haque', 'Karim', 'Molla', 'Mondal', 'Hasan', 'Mahmud',
          'Kabir', 'Majumder', 'Howlader', 'Patwary', 'Sikder', 'Munshi', 'Mridha', 'Kazi'
        ],
        maleSurnames: ['Uddin', 'Miah'],
        femaleSurnames: ['Akter', 'Begum', 'Khatun', 'Sultana', 'Jahan', 'Nahar']
      },
      hindu: {
        male: [
          'Sourav', 'Pranto', 'Arnob', 'Joy', 'Dipto', 'Protik', 'Anup', 'Suman', 'Rajib', 'Tapos',
          'Partha', 'Shuvo', 'Ashim', 'Bishwajit', 'Ratan', 'Gobinda'
        ],
        female: [
          'Priya', 'Moumita', 'Arpita', 'Sraboni', 'Keya', 'Puja', 'Riya', 'Tithi', 'Shampa',
          'Nandini', 'Dipa', 'Rupali', 'Mitali'
        ],
        surnames: [
          'Das', 'Roy', 'Saha', 'Paul', 'Chakraborty', 'Dey', 'Biswas', 'Ghosh', 'Dutta', 'Nath',
          'Sarkar', 'Bhattacharjee', 'Mondal', 'Sen', 'Karmakar', 'Debnath'
        ],
        maleSurnames: [],
        femaleSurnames: []
      }
    }
  };

  FF.DATA = DATA;

  const LOWER = 'abcdefghijklmnopqrstuvwxyz';
  const UPPER = LOWER.toUpperCase();
  const DIGITS = '0123456789';
  const SYMBOLS = '!@#$%^&*_-+=?';

  const R = {
    int: function (min, max) {
      min = Math.ceil(min);
      max = Math.floor(max);
      if (max < min) {
        const t = min;
        min = max;
        max = t;
      }
      return min + Math.floor(Math.random() * (max - min + 1));
    },
    float: function (min, max, decimals) {
      const value = min + Math.random() * (max - min);
      return Number(value.toFixed(Math.max(0, decimals || 0)));
    },
    pick: function (list) {
      if (!list || !list.length) return '';
      return list[Math.floor(Math.random() * list.length)];
    },
    bool: function (chance) {
      return Math.random() < (typeof chance === 'number' ? chance : 0.5);
    },
    chars: function (pool, length) {
      let out = '';
      for (let i = 0; i < length; i++) out += pool[Math.floor(Math.random() * pool.length)];
      return out;
    },
    letters: function (length) {
      return R.chars(LOWER, length);
    },
    alphanumeric: function (length) {
      return R.chars(LOWER + DIGITS, length);
    },
    words: function (min, max) {
      const count = R.int(min, max);
      const out = [];
      for (let i = 0; i < count; i++) out.push(R.pick(DATA.lorem));
      return out;
    },
    sentence: function (minWords, maxWords) {
      const words = R.words(minWords, maxWords);
      if (!words.length) return '';
      const text = words.join(' ');
      return text.charAt(0).toUpperCase() + text.slice(1) + '.';
    },
    /* Expand the body of a [...] template set: "3-9" or "013" or "a-f0-9". */
    expandSet: function (body) {
      const out = [];
      for (let i = 0; i < body.length; i++) {
        if (body[i + 1] === '-' && body[i + 2] !== undefined) {
          const lo = body.charCodeAt(i);
          const hi = body.charCodeAt(i + 2);
          for (let c = Math.min(lo, hi); c <= Math.max(lo, hi); c++) {
            out.push(String.fromCharCode(c));
          }
          i += 2;
        } else {
          out.push(body[i]);
        }
      }
      return out;
    },

    /* "LLL-###" style templates:
     *   L = uppercase letter, l = lowercase letter, C = either case letter
     *   # = digit, * = letter or digit, ? = any printable
     *   [3-9] / [013] = one character from that set, \x = literal x */
    fromTemplate: function (template) {
      let out = '';
      for (let i = 0; i < template.length; i++) {
        const ch = template[i];
        if (ch === '\\' && i + 1 < template.length) {
          out += template[++i];
          continue;
        }
        if (ch === '[') {
          const end = template.indexOf(']', i + 1);
          if (end > i + 1) {
            const set = R.expandSet(template.slice(i + 1, end));
            if (set.length) {
              out += R.pick(set);
              i = end;
              continue;
            }
          }
        }
        switch (ch) {
          case 'L': out += R.pick(UPPER.split('')); break;
          case 'l': out += R.pick(LOWER.split('')); break;
          case 'C': out += R.pick((UPPER + LOWER).split('')); break;
          case '#': out += R.pick(DIGITS.split('')); break;
          case '*': out += R.pick((LOWER + DIGITS).split('')); break;
          case '?': out += R.pick((LOWER + UPPER + DIGITS + SYMBOLS).split('')); break;
          default: out += ch;
        }
      }
      return out;
    },
    password: function (length, useSymbols) {
      const len = Math.max(4, length || 12);
      const pool = LOWER + UPPER + DIGITS + (useSymbols ? SYMBOLS : '');
      /* guarantee at least one of each required class */
      let out =
        R.pick(LOWER.split('')) + R.pick(UPPER.split('')) + R.pick(DIGITS.split('')) +
        (useSymbols ? R.pick(SYMBOLS.split('')) : R.pick(LOWER.split('')));
      out += R.chars(pool, len - out.length);
      return out
        .split('')
        .sort(function () {
          return Math.random() - 0.5;
        })
        .join('');
    },
    dateBetween: function (min, max) {
      const start = min instanceof Date && !isNaN(min) ? min.getTime() : Date.now() - 5 * 365 * 864e5;
      const end = max instanceof Date && !isNaN(max) ? max.getTime() : Date.now() + 365 * 864e5;
      return new Date(R.int(Math.min(start, end), Math.max(start, end)));
    },
    uuid: function () {
      if (global.crypto && typeof global.crypto.randomUUID === 'function') {
        return global.crypto.randomUUID();
      }
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = (Math.random() * 16) | 0;
        return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
      });
    }
  };

  FF.random = R;
})(typeof self !== 'undefined' ? self : this);
