# Form Filler

A Chrome/Edge extension (Manifest V3) that fills forms with realistic fake data in one click —
built around **unlimited custom fields** and **per-URL rules**.

## Install (unpacked)

1. Open `chrome://extensions` (or `edge://extensions`).
2. Turn on **Developer mode**.
3. Click **Load unpacked** and pick this folder.
4. Open `test/test-page.html` in a tab and press **Alt+Shift+F**.

## Using it

| Action | Shortcut | Also available from |
| --- | --- | --- |
| Fill all fields on the page | `Alt+Shift+F` | popup, right-click menu |
| Fill the form you're in | `Alt+Shift+D` | popup, right-click menu |
| Fill just the focused field | `Alt+Shift+E` | popup, right-click menu (on an input) |

Shortcuts can be remapped at `chrome://extensions/shortcuts`.

## Custom fields

There is no cap on how many rules you create — they live in `chrome.storage.local`, not the
size-limited sync area. Each rule has three parts.

**1. What it matches.** Pick the match mode (contains, exactly matches, starts with, ends with,
regular expression, or a raw CSS selector) and list your match values, one per line. Then tick which
parts of the element to inspect: `name`, `id`, `class`, `placeholder`, label text, `aria-label`,
`title`, `type`, `data-*`. A hit on any one of them wins.

**2. Where it applies.** Leave the URL list empty and the rule is global. Otherwise add as many
patterns as you like, one per line, in one of three modes:

| Mode | Example | Matches |
| --- | --- | --- |
| Wildcard | `example.com/signup*` | any URL containing that, `*` = anything |
| Wildcard | `https://*.shop.com/*` | anchored, because it starts with a scheme |
| Domain | `example.com` | `example.com` and `app.example.com` |
| Regex | `^https://(stage\|prod)\.acme\.io/` | full regular expression against the URL |

**3. What it generates.** Names, emails, usernames, passwords, phone numbers, addresses, numbers
with a range, dates and times with a format, lorem text, alphanumeric templates, regex-generated
strings, a random item from your list, a constant, URLs, IPs, colours, UUIDs, company names, job
titles, dropdown/radio choices, checkbox states — or **Never fill** to protect a field.

### Rule packs

**Ready-made rules**, in the Custom fields toolbar, drops in a set of rules at once. Rules you already
have by the same name are skipped, so adding twice is harmless, and everything stays editable.

| Pack | What it covers |
| --- | --- |
| Essentials | names, email, phone, address, comments — seeded on install |
| Bangladesh | BD mobiles, 4-digit post codes, NID, birth registration, board roll, registration no, passing year, GPA |
| Money and numbers | course fees, discounts, received amounts, quantities |
| Leave these alone | captchas, OTPs, coupon codes and search boxes are never filled |

The protective pack is added at the *top* of the list, because a rule only guards a field if it is
checked before anything else.

### Rule priority

Rules are evaluated top to bottom, and **a site-specific rule always beats a global one**. So you
can keep a global `email → random address` rule and still force `email → qa@acme.io` on `acme.io`
alone. Drag the handle to reorder; use **Test a website** in the toolbar to see which rules would run
on a given address.

When no rule matches, the extension falls back to heuristics: it splits `user_email` and `firstName`
into words and reads the input's own `type`, so most forms fill sensibly with no configuration.

### Value templates

- **Alphanumeric** — `L` uppercase letter, `l` lowercase, `C` either, `#` digit, `*` letter or digit,
  `?` any character, `[3-9]` or `[013]` one character from that set, `\` escapes the next
  character. Example: `LL-####` → `QP-8134`.
- **Regex** — character classes, groups, alternation and quantifiers. Example: `[A-Z]{2}-\d{6}`.
- **Date/time** — `YYYY YY MM M DD D HH H hh h mm ss A a`.

## Form maps

A custom field rule matches by pattern. A **form map** goes further: it pins a value to every single
field of one specific form, so the same form fills identically every time.

1. Open the page with the form on it.
2. Click the Form Filler toolbar icon → **Map this form**.
3. The options page opens with the captured form; pick which form, then set each field's value type.
   Dropdowns and radio groups arrive with their real options already listed, so you just pick one
   (or leave it on *any option, at random*).
4. Save. From then on the form fills itself.

When it fires is up to you, per map:

| Trigger | Behaviour |
| --- | --- |
| When I click into the form | the first click or focus inside the form fills all of it (default) |
| Automatically when the page loads | fills as soon as the form is on the page |
| Only when I ask | from **Fill it now** in the popup, or any of the Fill commands |

### Remembering a form you filled in yourself

Tick **Remember what is typed in it right now** when saving the form and every field is
pinned to what is currently on the page — text as a constant, a dropdown locked to the chosen option,
a checkbox to its state.

This is the most reliable way to deal with **AJAX lookup fields**, the ones where you type, wait for
suggestions and pick one. Such a widget normally writes the visible text into one field and the real
id into a *hidden* one, and the server only reads the hidden one. Form Filler captures both and
replays both, so the lookup comes out resolved without the suggestion list being involved at all:

1. Fill the form by hand once, using the widgets as you normally would.
2. Map it with the toggle on.
3. Every later visit replays your exact entry, hidden ids included.

Hidden fields that look like a CSRF token, nonce, viewstate, captcha or timestamp are never captured
— replaying a stale one would break the submit.

### Dependent dropdowns and autocomplete

Both work in **every** fill — *Fill all fields*, *Fill this form*, *Fill this field*, custom fields
and form maps — and are controlled under **Settings → Dropdowns and suggestion lists**.

After each dropdown, radio or checkbox the page is watched. If it reacts (another dropdown's options
change, a loading overlay such as blockUI appears) the fill waits until it goes quiet; if nothing
happens it carries on immediately, so ordinary forms stay fast.

A lookup field that no rule covers is recognised — a standard autocomplete box, or a name box with an
empty hidden `…Id` field beside it — and filled by typing a short search and taking a suggestion, so
the hidden id is set too. A rule or form map for the field always wins.

Two more settings in that section tune the automatic lookup itself:

- **Type at least this many letters first** (1–4, default 2) — many suggestion widgets refuse to
  search below their own minimum length (jQuery UI's `minLength`, typeahead's, etc.). If the automatic
  lookup never finds anything on a given site, this is usually why; raise it to 3 or 4 to match. Each
  try still uses different letters to raise the odds of a real hit — raising the number only changes
  how long they are.
- **Never randomly pick a dropdown or radio option containing…** (one per line) — options such as
  "Other", "N/A" or "Prefer not to say" that should never be chosen when a field has no rule of its
  own. Checked against both the option's value and its visible text. If every remaining option is on
  the list, the field is left alone rather than forced onto one of them. A rule or form map that names
  an option on purpose is unaffected — the list only limits the "pick anything" fallback.

A form map fills its fields **in the order they were captured** and has its own timings.

**Dependent dropdowns** (Division → District → Thana) need no setup. After each dropdown the run
pauses so the next one can reload, and a dropdown that is still empty is waited on rather than
skipped. If a chain is slow, raise two numbers under the map's **Advanced**: *Pause after each
dropdown* (350ms) and *Wait for a dropdown to load* (3s).

**Autocomplete** fields — type something, a suggestion list appears, you pick one — use the
**Autocomplete (type, then pick)** value type:

| Option | What it does |
| --- | --- |
| Type | the query, e.g. `017` or a known ID |
| Then pick | the first suggestion, a random one, or the one containing your text |
| Suggestion list selector *(More options)* | empty auto-detects jQuery UI, Select2, typeahead, Awesomplete and `role="option"` widgets; give a CSS selector for anything else |
| Wait up to *(More options)* | how long to wait for the list (4s by default) |
| Choose it by *(More options)* | clicking the suggestion, or Arrow keys + Enter if clicking does not take |

Every wait is bounded — if the list never appears the field keeps the typed text and the run moves
on, it never hangs.

Two guards under **Advanced** keep a map from getting in your way: **Fill only once each time the page
loads**, and **Only fill when the form is still empty** — so it never overwrites something you were
typing. Both are on by default.

Selectors are built to survive re-renders — a unique `[name]` first, a stable `#id` next, a
structural path last — and if the form itself is renamed, the map is re-found by whichever form on
the page holds most of its fields. A map beats every custom field rule for the fields it covers.

## Settings

Skip hidden, disabled, or already-filled fields; protect elements with a CSS selector
(`.no-autofill, #captcha`); ignore whole input types; confirm before filling a page; highlight what
was filled; auto-tick "I agree" checkboxes; set email domains and username style, password rules,
a phone template, and default number/text/date formats.

Names default to Bangladeshi — *Tanvir Hossain*, *Nusrat Jahan* — for name fields and for usernames and
email addresses made from a name. Switch to English under **Settings → Names**.

The phone template defaults to Bangladeshi mobile numbers, `+8801[3-9]########` → `+8801712345678`;
the `[3-9]` set keeps the operator digit valid. For a US number use `+1 (###) ###-####`.

**Backup** exports everything as JSON and imports it back, either replacing your setup or appending
the fields to it.

## Layout

```
manifest.json             version lives here, bumped on every change
CHANGELOG.md              what changed in each version
PRIVACY.md                privacy policy for the store listing
STORE_LISTING.md          submission text and checklist for Edge Add-ons
icons/                    generated PNGs
src/common/               shared, DOM-free logic
  constants.js            data types, match modes, defaults
  regexgen.js             random string from a regular expression
  random.js               word lists and random primitives
  generator.js            field definition -> value, plus fallback heuristics
  matcher.js              URL rules and element matching
  formmap.js              capturing a form and finding it again later
  rulepacks.js            ready-made rule packs (Essentials, Bangladesh, ...)
  storage.js              chrome.storage.local persistence
src/content/
  filler.js               finds elements, decides a value, applies it
  content.js              tracks focus/right-click context, handles commands
src/background/
  service-worker.js       context menus, shortcuts, message routing
src/options/              the settings and rules UI
src/popup/                toolbar popup
test/test-page.html       a form covering every input type
```

`src/common` is plain, DOM-free JavaScript, so it runs identically in the page, the popup, the
options page, the service worker — and under Node for testing.

## দ্রুত শুরু

1. `chrome://extensions` → **Developer mode** চালু → **Load unpacked** → এই ফোল্ডারটা দিন।
2. `test/test-page.html` খুলে **Alt+Shift+F** চাপুন।
3. নতুন রুল বানাতে: টুলবার আইকন → **Options** → **Custom fields** → **+ Add field**। তৈরি রুল
   চাইলে ঐ পাতাতেই **Ready-made rules** থেকে Essentials / Bangladesh / Money and numbers /
   Leave these alone প্যাক এক ক্লিকে যোগ করুন — যেগুলো আগে থেকেই আছে সেগুলো বাদ পড়বে।
4. কোনো একটা সাইটের জন্যই রুল চাইলে রুলের ৩ নম্বর ধাপে **Only these websites** বেছে ডোমেইন লিখুন —
   **Every website** রাখলে রুলটা সব সাইটে কাজ করবে। সাইট-নির্দিষ্ট রুল সবসময় গ্লোবাল রুলকে ওভাররাইড করে।

### একটা ফর্ম ম্যাপ করে রাখা

একই ফর্ম বারবার ভরতে হলে ম্যাপ করে রাখুন — প্রতিটা ফিল্ডে ঠিক কী বসবে তা একবার ঠিক করে দিলে
পরেরবার আর কিছু করতে হবে না।

1. যে পেজে ফর্মটা আছে সেটা খুলুন → টুলবার আইকন → **Map this form**।
2. Options পেজ খুলবে; কোন ফর্মটা ম্যাপ করবেন বেছে নিন → **Save form**।
3. টেবিলে প্রতিটা ফিল্ডের পাশে **What goes in** ঠিক করুন (যেমন ইমেইলে `Constant value` দিয়ে
   নির্দিষ্ট একটা ঠিকানা, বা কোনো ফিল্ডে `Never fill`)। নিজে থেকেই সেভ হয়ে যায়।
4. এরপর ঐ পেজে গিয়ে ফর্মে ক্লিক করলেই পুরোটা ভরে যাবে।

#### ডিপেন্ডেন্ট ড্রপডাউন ও অটোকমপ্লিট

এখন দুটোই **সব জায়গায়** কাজ করে: Fill all fields, Fill this form, Fill this field, custom field ও form map।
নিয়ন্ত্রণ করবেন **Settings → Dropdowns and suggestion lists** থেকে। কোনো রুল না থাকলেও lookup ঘর
(যেমন institute সার্চ, পাশে খালি `…Id` hidden ঘর) নিজে থেকে চিনে নিয়ে একটা suggestion বেছে নেয়।

ঐ একই সেটিংসে আরও দুটো নিয়ন্ত্রণ আছে:

- **Type at least this many letters first** (১–৪, ডিফল্ট ২) — অনেক suggestion widget নিজের নির্দিষ্ট
  সংখ্যক অক্ষরের নিচে সার্চই করে না। কোনো সাইটে lookup কিছুই খুঁজে না পেলে সাধারণত এটাই কারণ — ৩ বা ৪
  করে দেখুন। প্রতিবার ভিন্ন অক্ষর দিয়ে চেষ্টা হয়, শুধু দৈর্ঘ্যটা বদলায়।
- **Never randomly pick a dropdown or radio option containing…** (প্রতি লাইনে একটা) — "Other",
  "N/A", "Prefer not to say"-এর মতো option, যেগুলো কোনো রুল না থাকলে কখনো র‍্যান্ডমে বাছা উচিত নয়।
  option-এর value আর দেখা-যাওয়া টেক্সট দুটোতেই চেক হয়। সব option বাদের তালিকায় পড়ে গেলে ফিল্ডটা
  খালিই থাকবে, জোর করে কিছু বসবে না। কোনো রুল বা form map নির্দিষ্ট option চাইলে এই তালিকা তাতে বাধা
  দেয় না।

**ডিপেন্ডেন্ট ড্রপডাউন** (বিভাগ → জেলা → থানা) আলাদা কোনো সেটিং ছাড়াই কাজ করে। ফিল্ডগুলো যে
ক্রমে ক্যাপচার হয়েছে সেই ক্রমেই ভরে, প্রতিটা ড্রপডাউনের পর একটু থামে যাতে পরেরটা লোড হতে পারে, আর
পরের ড্রপডাউন তখনও খালি থাকলে অপেক্ষা করে — বাদ দিয়ে যায় না। চেইন ধীর হলে ম্যাপের দুটো সংখ্যা
বাড়িয়ে নিন (ম্যাপের **Advanced**-এ): *Pause after each dropdown* আর *Wait for a dropdown to load*।

**যে ফিল্ডে কিছু লিখলে সাজেশন আসে** সেগুলোর জন্য Value type-এ **Autocomplete (type, then pick)**
বেছে নিন। কী লিখবে (যেমন `017`), তারপর কোন সাজেশনটা নেবে — প্রথমটা, র‍্যান্ডম একটা, নাকি আপনার
দেওয়া শব্দ আছে এমনটা — ঠিক করে দিন। সাজেশনের তালিকা সাধারণ উইজেটগুলোর (jQuery UI, Select2,
typeahead, Awesomplete, `role="option"`) জন্য নিজে থেকেই খুঁজে নেয়; আলাদা কিছু হলে তার CSS selector
দিন। ক্লিকে কাজ না হলে **More options**-এ *Choose it by* বদলে *Arrow keys + Enter* করুন।

সব অপেক্ষারই সময়সীমা আছে — সাজেশন না এলে বা ড্রপডাউন লোড না হলে ঐ ফিল্ড বাদ দিয়ে পরেরটায় চলে
যায়, আটকে থাকে না।

#### সবচেয়ে সহজ উপায়: একবার হাতে ভরে নিয়ে ম্যাপ করা

AJAX ফিল্ডের জন্য এটাই সবচেয়ে নির্ভরযোগ্য। ফর্ম সেভ করার সময় **Remember what is typed in it right
now** টিক দিন — তাহলে পেজে এখন যা আছে ঠিক তাই সেভ হয়ে যাবে।

1. ফর্মটা একবার নিজের হাতে ভরুন — লিখে, সাজেশন থেকে বেছে, স্বাভাবিকভাবে যেভাবে ভরেন।
2. এরপর ম্যাপ করুন, টিকটা দেওয়া রেখে।
3. পরেরবার হুবহু ঐ মানগুলোই বসে যাবে।

কেন কাজ করে: সাজেশন থেকে বাছার পর widget সাধারণত দেখা-যায় এমন ঘরে নামটা আর একটা **hidden**
ঘরে আসল ID বসায় — সার্ভার ঐ hidden ID-টাই পড়ে। এক্সটেনশন দুটোই ধরে রাখে ও ফেরত বসায়, তাই
সাজেশনের তালিকা ছাড়াই লুকআপটা ঠিকঠাক হয়ে যায়।

তবে CSRF token, nonce, viewstate, captcha বা timestamp জাতীয় নামের hidden ঘর কখনো সেভ হয় না —
পুরোনো টোকেন ফেরত বসালে সাবমিটই ভেঙে যেত।

**Fill it** ড্রপডাউনে ঠিক করবেন কখন ভরবে — ক্লিক করলে (ডিফল্ট), পেজ লোড হলেই, নাকি শুধু বললে।
দুটো সুরক্ষা ডিফল্টে চালু: প্রতি পেজ লোডে একবারই ভরবে, আর ফর্ম খালি থাকলেই ভরবে — তাই আপনার
টাইপ করা কিছু মুছে যাবে না। ফর্ম ম্যাপ সবসময় custom field রুলের চেয়ে বেশি প্রাধান্য পায়।
