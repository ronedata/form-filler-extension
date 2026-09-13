# Changelog

Versions follow [semantic versioning](https://semver.org): `MAJOR.MINOR.PATCH` — a breaking change
bumps MAJOR, a new feature bumps MINOR, a fix or tweak bumps PATCH. The number here always matches
`version` in [manifest.json](manifest.json).

## 1.10.9 — 2026-09-13

### Fixed

- "Fill all fields" could throw "Cannot read properties of undefined
  (reading 'ownerDocument')" and skip a radio button on any page with a
  `<input type="radio">` that has neither a `name` nor an `id` (rare, but
  exactly the case on pauljadam.com's HTML5 input-types demo page, and any
  other bare unnamed radio). Radios are grouped for filling by a key built
  from their name/id, falling back to `Math.random()` when both are
  missing - but that fallback was called twice for the same element and
  returned two different values each time, so the group-membership check
  found nothing (not even the element itself), leaving an empty group and
  crashing a few calls later. The fallback identity is now cached per
  element so repeated calls agree. Reproduced end-to-end against the real
  page (crash before, clean fill after) with a negative-control run
  against the old code confirming the before state.

## 1.10.8 — 2026-09-13

### Fixed

- A generated phone number (or NID, or any other digit code) written into an
  `<input type="number">` field could lose its leading zero. Local-format BD
  mobile numbers (`01XXXXXXXXX`) go through `parseFloat`/`String` when the
  target field is numeric, and numbers can't have leading zeros - a valid
  11-digit number silently became an invalid 10-digit one. Reported by the
  user on `ums-student-1.osl.team/Registration`, whose mobile field takes
  exactly this shape (`type="number"`, no min/max/step) and re-validates the
  value on input; the shortened number failed that page's own check and got
  flagged invalid. The value is now left exactly as generated whenever the
  field's own min/max/step don't actually require reshaping it into a plain
  number - reproduced against the live page (10-digit invalid value before,
  correct 11+ digit value with no invalid state after) and confirmed with a
  negative-control run against the old code.

## 1.10.7 — 2026-09-13

### Fixed

- `edge://extensions` could show six "Cannot create item with duplicate id"
  errors (`form-filler-root`, `fill-all-fields`, `fill-this-form`,
  `fill-this-input`, `form-filler-sep`, `form-filler-options`) right after
  install. On a fresh install, seeding the starter fields writes to storage,
  which fires `chrome.storage.onChanged` and rebuilds the context menu — at
  the same moment `onInstalled`'s own code was already rebuilding it. Both
  rebuilds called `contextMenus.removeAll()` and re-created the same six
  items at once, and whichever finished last collided with items the other
  had just created. Context menu rebuilds are now chained through a single
  queue so only one ever runs at a time, however many triggers fire close
  together. No behavior change — the menu ends up the same either way, this
  just stops the duplicate-id errors.

## 1.10.6 — 2026-09-10

### Fixed

- The Form maps table's "Details" column could reserve far more width than
  its content needed on a wide, real-world form (many fields, long field
  names) — leaving a large empty gap next to short dropdown/constant-value
  boxes instead of a clean row. The table now uses fixed, predictable column
  widths instead of letting the browser guess them from content, and each
  Details control has a sensible maximum width instead of stretching to fill
  whatever space is left over. Reported by the user with a screenshot of a
  159-field admission form. No behavior change — layout only.

## 1.10.5 — 2026-09-10

### Changed

- The in-app Options → Help "Privacy" card now links to
  `https://ronedata.github.io/form-filler-extension/privacy/`, a standalone
  public webpage published via GitHub Pages, instead of the GitHub blob view
  of `PRIVACY.md`. Microsoft Partner Center's privacy-policy field expects an
  actual public webpage rather than a rendered file view or a
  private-by-default page, so this is the URL used there too. `PRIVACY.md`
  and `STORE_LISTING.md` were updated to match; no behavior change.

## 1.10.4 — 2026-09-11

### Added

- A **Privacy** card at the bottom of Options → Help, with a one-paragraph
  summary and a link to the full privacy policy. Previously, once installed,
  nothing in the extension's own UI pointed to the privacy policy — it was
  only reachable via the Edge store listing or `edge://extensions` → Details
  → the homepage link → the GitHub repo → its README. This is purely an
  added link; no existing card, tab, or behavior changed.

## 1.10.3 — 2026-09-11

Documentation-only pass to make the privacy policy and store listing text
match actual code behavior exactly, ahead of Edge Add-ons submission. No
code changed — `manifest.json`'s permissions, `src/`, and every existing
feature (custom fields, form maps, remember-values, automatic triggers) are
unchanged; only `PRIVACY.md`, `STORE_LISTING.md`, and the published privacy
policy page were rewritten.

### Fixed (wording, not behavior)

- **"Only when you ask it to" was inaccurate.** A form map set to "When I
  click into the form" (the default) reads the form's current field values
  on the user's first ordinary click or focus inside it — not a dedicated
  fill action. A map set to "Automatically when the page loads" reads and
  fills with no user action at all. Both are now described precisely, and
  distinguished from custom field rules (which genuinely only ever run on
  an explicit shortcut/popup/menu action).
- **The "remember values" disclosure was incomplete.** The code does not
  distinguish field types when capturing a form's current values, so if a
  password field already has something typed into it when a form is
  mapped with "remember what is typed in it right now," that password is
  captured and stored the same as any other field. This was previously
  described only as "names, phone numbers, institute names, and similar" —
  it now says so explicitly, along with the fact that capture happens the
  moment "Map this form" is clicked (before the remember-values choice is
  made), and is held locally for up to 10 minutes if the map is never
  finished.
- **"Form Filler collects nothing" was ambiguous** and is removed from
  every listing surface. Replaced with precise, separately-verifiable
  claims: no network requests (checkable by reading the source), settings
  and rules stored locally, and remembered values stored locally when that
  feature is explicitly used — never "nothing is collected."

## 1.10.2 — 2026-09-11

### Added

- `homepage_url` in the manifest, pointing at the project's GitHub repo
  (https://github.com/ronedata/form-filler-extension). Shows as a "website"
  link on the store listing; no effect on behaviour.

## 1.10.1 — 2026-09-11

Production-readiness pass ahead of publishing to the Microsoft Edge Add-ons store: a full read
through every file for correctness, security and store-policy compliance. No user-visible feature
changes; everything below is a fix or piece of hardening found during that review.

### Fixed

- A pathological hand-typed regular expression such as `((a{500}){500}){500}` could generate an
  output millions of characters long and freeze the tab. Generation now stops once it has produced
  20,000 characters — far more than any real pattern needs — instead of running unbounded.
- `containerIsEmpty()` (the "only fill when the form is still empty" guard for form maps) did not
  look at rich-text (`contenteditable`) fields, so a map could still fire on a form that was empty
  everywhere except a rich-text box that already had content in it.
- A dead `? 'text' : 'text'` ternary in the type-guessing fallback was simplified to `'text'` — no
  behaviour change, just a leftover from an earlier refactor.
- Two option-editor placeholders referenced a specific third-party organisation's real web address
  (left over from testing); replaced with generic `example.com` placeholders.

### Added

- `PRIVACY.md` — a plain-language privacy policy for the store listing. Short version: the extension
  makes no network requests at all (verified by grepping the whole codebase for `fetch`, `XHR`,
  `WebSocket` — there are none), so nothing is collected, sent, or shared. Everything is stored
  locally via `chrome.storage.local`.

### Verified, not changed

A line-by-line pass over every file found no `innerHTML`/`outerHTML` assignment with dynamic
content, no `eval`, no inline scripts or event-handler attributes, and no external resource loading
— the extension is fully compliant with Manifest V3's default content-security-policy with no
changes needed. All 12 local test suites (120+ cases) still pass.

## 1.10.0 — 2026-09-10

### Added

- **Settings → Dropdowns and suggestion lists** now controls how the automatic suggestion lookup
  searches: *Type at least this many letters first* (1–4, default 2) sets how long each trial search
  is. Many suggestion widgets (jQuery UI's `minLength`, typeahead's, etc.) simply never search below
  their own minimum — if the automatic lookup never finds anything on a particular site, raising this
  to 3 or 4 is usually why. Each try still uses different letters to raise the odds of a real match;
  raising the number only changes how long they are, not what gets typed.
- **Never randomly pick a dropdown or radio option containing…** (one per line, under the same
  section) blocks specific choices — "Other", "N/A", "Prefer not to say" — from ever being picked when
  a field has no rule telling it what to choose. Checked against both the option's value and its
  visible text. If every remaining option is on the list, the field is left alone rather than forced
  onto a blocked choice. A rule or form map that names an option on purpose is never affected — the
  list only limits the "pick anything" fallback.
- The **Advanced** card under Settings now explains what each control does, and what the whole card
  is for (fine-tuning for tricky pages; most forms never need it touched).

## 1.9.0 — 2026-09-10

### Added

- **Dependent dropdowns work in every fill**, not only in form maps: *Fill all fields*, *Fill this
  form*, *Fill this field* and custom fields now wait for a dropdown that loads after an earlier
  choice. After each dropdown, radio or checkbox the page is watched; if it reacts — another
  dropdown's options change, a list empties, a loading overlay such as blockUI appears — the fill
  waits until it goes quiet. If nothing happens it moves on straight away, so ordinary forms are no
  slower. An empty dropdown is only waited on while something is actually loading.
- **Lookup fields are filled automatically.** When no rule covers a field and it looks like a lookup
  — a standard autocomplete box (`role="combobox"`, `aria-autocomplete`, typeahead or autocomplete
  classes) or a name box with an empty hidden `…Id` field beside it — Form Filler types short searches
  until suggestions appear and takes one, so the hidden id gets set. `<input list>` boxes get one of
  their own options.
- **Settings → Dropdowns and suggestion lists** controls both: switch each on or off, the longest wait,
  which suggestion to take, how to choose it, and a custom suggestion-list selector.

### Changed

- An *Autocomplete* rule's wait, "choose it by" and suggestion selector now default to the Settings
  values when left empty. Rules saved earlier keep their own values.
- A custom field or form map for a field always wins over the automatic lookup.

## 1.8.0 — 2026-09-10

### Added

- **Bangladeshi names.** First name, last name and full name fields, and usernames and email
  addresses made from a name, now use Bangladeshi names — `tanvir.hossain`, `nusrat_jahan`,
  `sourav.das42@…` — instead of English ones like `dorothyreyes57`.
- A **Names** setting under *Settings* switches between Bangladeshi (the default) and English.

### Notes

- Generated people are kept coherent: a female-only surname such as *Akter*, *Begum* or *Khatun* is
  never paired with a male first name, *Uddin* and *Miah* never with a female one, and a Hindu first
  name gets a Hindu surname.
- A last-name field on its own only ever gets a surname that suits anyone, since the matching first
  name is filled separately.

## 1.7.0 — 2026-09-10

### Changed — a friendlier interface

**Popup**

- Every button now says what it fills: *Every field on this page*, *Only the form you last clicked in*,
  *Only the field you last clicked in*. "Fill focused field" is now **Fill this field**, the same name
  the right-click menu uses.
- "5 of 7 rules apply here" now reads "5 rules ready here · 2 made for this site", with a tooltip that
  explains it.
- When a form map matches the page it sits at the top as a card with **Fill it now**.
- The result shows as a clear line — "✓ Filled 12 fields", or what to try when nothing could be filled.
- "Map a form on this page…" is now **Map this form**, with a one-line description.

**Custom fields**

- The rule editor is laid out as three steps: *Which fields?*, *What should go in?*, *On which
  websites?* The last one is a choice between **Every website** and **Only these websites**, rather
  than a bare list of URL patterns. Match mode and the attribute chips moved under **Advanced matching**.
- Rarely needed value options (decimal places, text before/after, date format, suggestion selector
  and similar) are folded under **More options**; the rest have plain labels such as From and To.
- Rules read in words ("Email address · for fields like email, e-mail"), use an on/off switch, and
  show a regex rule as "2 patterns" instead of the raw expression.
- Deleting a rule or form map shows **Undo** instead of a confirmation dialog. Adding a ready-made
  pack can be undone the same way.
- Ready-made rules and the website tester open from two toolbar buttons instead of taking up the top
  of the page. Packs are shown as cards with a description and an Add button.
- **+ Add field** clears any search or filter first, so the new rule is never hidden.

**Form maps**

- The details for each field are labelled — *From / To* instead of three unlabelled boxes — with the
  rarely used ones under More options.
- Web addresses, the form selector, fill-once, only-when-empty and the dropdown timings moved under
  **Advanced**. The chosen *Fill it* option is explained in a sentence.

**Settings**

- The *General* tab is now **Settings**, with plainer wording and the technical options in their own
  *Advanced* card.

### Fixed

- The `hidden` attribute was ignored wherever the stylesheet gave an element a `display`. That is why
  the popup showed **Fill saved map** on every page, even with no form map, and why the rule editor
  always showed a CSS-selector box when matching by words. Both pages now respect `hidden`.

## 1.6.0 — 2026-09-09

### Added

- **Rule packs.** A picker above the rule list adds a whole set of custom fields at once. Rules you
  already have by the same name are skipped, and everything stays editable afterwards.
  - *Essentials* (13) — names, email, phone, address, comments. Seeded on a fresh install.
  - *Bangladesh* (11) — BD mobile numbers, 4-digit post codes, NID, birth registration, board roll,
    registration no, passing year, GPA, guardian name.
  - *Money and numbers* (6) — course fees, discounts, received amounts, quantities.
  - *Leave these alone* (4) — captchas, OTPs, coupon codes and search boxes are never filled. Added
    at the top of the list, since a protective rule only works if it is checked first.
- A fresh install now seeds the Essentials pack instead of five hardcoded rules.

### Notes

Protective rules are matched carefully so they do not swallow real fields: the search guard uses a
regex so it skips *Research* and *Researcher*, "PIN code" is left out of the OTP rule because it
means a postal code here, and the captcha rule spells out "not a robot" rather than matching "human"
and hitting *Human Resources*.

## 1.5.1 — 2026-09-09

### Fixed

Both found by testing against a real Bootstrap-typeahead form:

- **Autocomplete always committed the first suggestion**, whatever you asked for. Bootstrap-style
  widgets commit whichever item carries the `active` class and only set that class on hover, so a
  bare click took the default. The wanted item is now hovered before it is clicked.
- **Suggestions were counted twice** when the markup nests, as `<li><a role="option">` does — the
  built-in selector matched both the `li` and the `a`. Only the innermost match of a nest is kept
  now, which also fixes *Arrow down + Enter* arrowing past the item it wanted.
- *Arrow down + Enter* pressed one arrow too many when the widget already highlights the first
  suggestion. It now counts from wherever the highlight already sits, and arrows up when that is
  past the target.

## 1.5.0 — 2026-09-09

### Added

- **Map a form you already filled in.** The capture now records what each field currently holds, and
  the map editor offers *Remember the values that are on the page right now* (ticked automatically
  when the page has values). Every field is pinned to what you entered: text becomes a constant, a
  dropdown locks to the option you chose, a checkbox keeps its state.
- **Hidden ids are captured too.** An autocomplete widget usually writes the visible text in one
  field and the real id in a hidden one; the server reads the hidden one. Hidden inputs that hold a
  value are now mappable and are filled on replay, so a lookup resolves correctly without the
  suggestion list being involved at all. This is the most reliable way to handle AJAX fields.
- Hidden fields whose name looks like a CSRF token, nonce, viewstate, captcha or timestamp are never
  captured — replaying a stale one would break the submit.

### Notes

- Without the toggle, behaviour is unchanged: fields get generated values and hidden inputs stay off.
- The entry table marks a hidden field as *hidden id* so it is obvious what it is.

## 1.4.0 — 2026-09-09

### Added

- **Dependent dropdowns now work.** A form map fills its fields in the order they were captured and
  waits along the way: after each dropdown or radio the run pauses (*Pause after each dropdown*,
  350ms by default) so a dependent field below can reload, and a dropdown that is still empty is
  waited on (*Wait for an empty dropdown to load*, 3s by default) instead of being skipped. A chain
  like Division to District to Thana needs no configuration.
- **Autocomplete fields.** New value type **Autocomplete (type, then pick)**: it types your query,
  waits for the suggestion list, then commits one — the first, a random one, or the one containing
  text you name. The list is auto-detected for the common widgets (jQuery UI, Select2, typeahead,
  Awesomplete, anything using `role="option"`); a custom CSS selector can be given instead. If
  clicking does not commit, switch to *Arrow down + Enter*.
- The bundled test page gained a form whose dropdowns cascade and whose guardian field suggests
  after a delay, so both features can be tried for real.

### Changed

- Filling is now asynchronous throughout (`fillPage`, `fillForm`, `fillElement`, `fillMap` all
  return promises). Nothing changes for the shortcuts, popup or menu — they simply wait for the fill
  to finish before reporting a count.
- A form map claims its form before the first wait, so a second click during a slow dependent-dropdown
  load cannot start the same map twice.

### Notes

- Waits are bounded: if a dropdown never loads or a suggestion list never appears, the run gives up
  on that field and carries on rather than hanging.

## 1.3.0 — 2026-09-09

### Fixed

- **Dropdowns were not recognised.** `<select>` had no case in the type guesser, so a captured
  dropdown fell through to the name heuristics and came out as *Words / sentences*. Worse, a
  `<select name="city">` was typed as *City* and handed a random city string that was not one of its
  options. The element's own type now outranks any name heuristic for `select`, `radio` and
  `checkbox`, so dropdowns and radio groups capture as **Dropdown / radio option** and checkboxes as
  **Checkbox state**.
- A checkbox named something like `agree_to_newsletter_email` no longer captures as an email field.

### Added

- Capturing a form now records the dropdown's and radio group's **real options**. The map editor
  shows them in a picker — choose *(any option, at random)* or one specific option — instead of an
  empty "allowed options" text box. An option that later disappears from the page is kept in the list
  and marked, rather than silently reset.

## 1.2.0 — 2026-09-09

### Added

- **Form maps.** Capture a form once and pin a value type to each of its fields; the form then fills
  itself on a later visit. Capture from the popup (**Map a form on this page**), edit under
  **Options → Form maps**.
- Per-map trigger: on click into the form (default), automatically on page load, or manual only.
- Guards so a map never gets in the way: fill only once per page load, and only when the form is
  empty. Both on by default.
- Popup shows how many saved maps apply to the current page, plus a **Fill saved map** button.
- Maps are included in backup export/import.

### Notes

- A form map takes priority over every custom field rule for the fields it covers.
- Pages with no `<form>` element can still be mapped — they appear as **Whole page**.

## 1.1.0 — 2026-09-09

### Added

- Template sets: `[3-9]` and `[013]` pick one character from a range or list. Works in both the
  **Phone** template and the **Alphanumeric** type, alongside `L l C # * ?` and `\` escaping.

### Changed

- The default phone template is now Bangladeshi: `+8801[3-9]########` → `+8801712345678`.
  The set notation keeps the operator digit valid (013–019), which a plain `#` could not.

Existing installs keep whatever template they already saved — change it under
**Options → General → Defaults → Phone template**, or use **Backup → Reset**.

## 1.0.0 — 2026-09-09

First release.

- Fill all fields, one form, or a single field — via keyboard shortcut, toolbar popup, or the
  right-click menu.
- Unlimited custom field rules stored in `chrome.storage.local`.
- Per-rule URL patterns in wildcard, domain, or regex mode; a site-specific rule always overrides a
  global one.
- Match modes: contains, exactly matches, starts with, ends with, regular expression, CSS selector —
  against `name`, `id`, `class`, `placeholder`, label text, `aria-label`, `title`, `type`, `data-*`.
- 29 data types including regex-generated strings, ranged numbers, formatted dates, random list
  items, constants, dropdown/radio choices, and **Never fill**.
- Heuristic fallback that splits `user_email` and `firstName` into words when no rule matches.
- Options UI with search, filtering, drag-to-reorder, live value preview, a URL tester, and JSON
  import/export.
