/* Form Filler - ready-made rule packs.
 *
 * A pack is just a list of custom fields. One is seeded on a fresh install;
 * the rest can be added from Options -> Custom fields at any time. Each entry
 * is passed straight to FF.newField, so anything a hand-made rule can do, a
 * packed one can do too.
 */
(function (global) {
  const FF = (global.FF = global.FF || {});

  FF.RULE_PACKS = [
    {
      id: 'essentials',
      name: 'Essentials',
      description: 'Names, email, phone, address and the other fields almost every form has.',
      fields: [
        { name: 'Email', matchValues: ['email', 'e-mail'], type: 'email' },
        {
          name: 'First name',
          matchValues: ['first name', 'firstname', 'fname', 'given name'],
          type: 'firstName'
        },
        {
          name: 'Last name',
          matchValues: ['last name', 'lastname', 'lname', 'surname', 'family name'],
          type: 'lastName'
        },
        {
          name: 'Full name',
          matchValues: ['full name', 'fullname', 'your name', 'student name', 'applicant name'],
          type: 'fullName'
        },
        { name: 'Username', matchValues: ['username', 'user name', 'login id'], type: 'username' },
        { name: 'Password', matchValues: ['password', 'passwd'], type: 'password' },
        { name: 'Phone', matchValues: ['phone', 'mobile', 'tel', 'contact number'], type: 'phone' },
        {
          name: 'Street address',
          matchValues: ['address', 'street', 'road', 'village', 'holding'],
          type: 'streetAddress'
        },
        { name: 'City', matchValues: ['city', 'town'], type: 'city' },
        { name: 'Country', matchValues: ['country'], type: 'country' },
        { name: 'Website', matchValues: ['website', 'homepage', 'site url'], type: 'url' },
        { name: 'Company', matchValues: ['company', 'organization', 'organisation'], type: 'company' },
        {
          name: 'Comments',
          matchValues: ['comment', 'message', 'remark', 'note', 'description', 'details'],
          type: 'text',
          options: { minWords: 6, maxWords: 18 }
        }
      ]
    },

    {
      id: 'bangladesh',
      name: 'Bangladesh',
      description:
        'BD mobile numbers, 4-digit post codes, NID, birth registration, board roll and results.',
      fields: [
        {
          name: 'BD mobile number',
          matchValues: ['mobile', 'mobile no', 'mobile number', 'phone', 'contact no'],
          type: 'phone',
          options: { template: '+8801[3-9]########' }
        },
        {
          name: 'Guardian / parent name',
          matchValues: ['father', 'mother', 'guardian', 'parent name'],
          type: 'fullName'
        },
        {
          name: 'Nick name',
          matchValues: ['nick name', 'nickname', 'daak naam'],
          type: 'firstName'
        },
        {
          name: 'NID number',
          matchValues: ['nid', 'national id', 'national identity'],
          type: 'alphanumeric',
          options: { template: '##########' }
        },
        {
          name: 'Birth registration no',
          matchValues: ['birth registration', 'birth certificate', 'brn'],
          type: 'alphanumeric',
          options: { template: '#################' }
        },
        {
          name: 'Post code (4 digit)',
          matchValues: ['post code', 'postcode', 'postal code', 'zip'],
          type: 'alphanumeric',
          options: { template: '####' }
        },
        {
          name: 'Board roll',
          matchValues: ['board roll', 'roll no', 'roll number', 'roll'],
          type: 'alphanumeric',
          options: { template: '######' }
        },
        {
          name: 'Registration no',
          matchValues: ['registration no', 'reg no', 'reg. no', 'registration number'],
          type: 'alphanumeric',
          options: { template: '##########' }
        },
        {
          name: 'Passing year',
          matchValues: ['passing year', 'year of passing', 'session year', 'year'],
          type: 'number',
          options: { min: 2015, max: 2025 }
        },
        {
          name: 'GPA / result',
          matchValues: ['gpa', 'cgpa', 'result', 'grade point'],
          type: 'number',
          options: { min: 2, max: 5, decimalPlaces: 2 }
        },
        {
          name: 'District / division',
          matchValues: ['district', 'division', 'thana', 'upazila', 'upazilla'],
          type: 'selectOption'
        }
      ]
    },

    {
      id: 'money',
      name: 'Money and numbers',
      description: 'Fees, amounts, discounts and quantities, kept to sensible ranges.',
      fields: [
        {
          name: 'Course / total fee',
          matchValues: ['course fee', 'total fee', 'tuition', 'admission fee'],
          type: 'number',
          options: { min: 5000, max: 50000 }
        },
        {
          name: 'Discount amount',
          matchValues: ['discount', 'waiver', 'rebate'],
          type: 'number',
          options: { min: 0, max: 2000 }
        },
        {
          name: 'Received / paid amount',
          matchValues: ['received amount', 'paid amount', 'payment amount', 'deposit'],
          type: 'number',
          options: { min: 500, max: 20000 }
        },
        {
          name: 'Amount',
          matchValues: ['amount', 'price', 'cost', 'charge', 'salary'],
          type: 'number',
          options: { min: 100, max: 10000 }
        },
        {
          name: 'Quantity',
          matchValues: ['quantity', 'qty', 'number of', 'count'],
          type: 'number',
          options: { min: 1, max: 20 }
        },
        {
          name: 'Percentage',
          matchValues: ['percent', 'percentage', 'rate'],
          type: 'number',
          options: { min: 1, max: 100 }
        }
      ]
    },

    {
      id: 'protect',
      name: 'Leave these alone',
      description:
        'Never touch captchas, OTPs, coupon codes or search boxes. Put this pack at the top.',
      fields: [
        {
          name: 'Never fill: captcha',
          /* "human" would swallow Human Resources, so spell the phrase out */
          matchValues: ['captcha', 'security code', 'not a robot'],
          type: 'skip'
        },
        {
          name: 'Never fill: OTP / verification',
          /* deliberately no "pin code" - here that means a postal code */
          matchValues: ['otp', 'one time', 'verification code', 'confirmation code'],
          type: 'skip'
        },
        {
          name: 'Never fill: coupon / promo',
          matchValues: ['coupon', 'promo', 'voucher', 'referral code', 'gift card'],
          type: 'skip'
        },
        {
          name: 'Never fill: search boxes',
          /* plain "search" also matches Research, Researcher, ... */
          matchMode: 'regex',
          matchValues: ['(?<!re)search', 'query'],
          type: 'skip'
        }
      ]
    }
  ];

  FF.getRulePack = function getRulePack(id) {
    return FF.RULE_PACKS.filter(function (pack) {
      return pack.id === id;
    })[0];
  };

  /* Build real field objects (fresh ids) from a pack. */
  FF.rulePackFields = function rulePackFields(id) {
    const pack = FF.getRulePack(id);
    if (!pack) return [];
    return pack.fields.map(function (spec) {
      const field = FF.newField(spec);
      field.options = Object.assign(
        {},
        FF.DEFAULT_TYPE_OPTIONS[field.type] || {},
        spec.options || {}
      );
      return field;
    });
  };
})(typeof self !== 'undefined' ? self : this);
