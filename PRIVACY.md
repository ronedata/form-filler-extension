# Privacy Policy — Form Filler

**Last updated: September 2026**

Form Filler is a browser extension that fills web forms with generated or
previously-entered values. This policy describes exactly what the extension
does with your data, matching its actual behavior — not a simplified
summary of it.

## The short version

- **Form Filler never sends anything anywhere.** It makes no network
  requests of any kind. There is no server it talks to — not the
  developer's, not anyone's.
- **It does store data locally**, using the browser's `chrome.storage.local`
  — your custom rules, your saved form maps, and your settings. This is
  never transmitted; it stays on your device.
- **If you use "Remember what is typed in it right now"** while saving a
  form map, the extension stores the actual values that were in the form at
  that moment as part of the map — see [section 2](#2-form-maps-and-remembered-values)
  below for exactly what that can include.
- **Some saved form maps fill automatically**, without you pressing anything
  — see [section 3](#3-when-the-extension-reads-or-changes-a-page) for
  exactly when.

## 1. What gets stored locally, and where

Form Filler uses `chrome.storage.local` — a storage area belonging only to
this extension, on your device. It never uses `chrome.storage.sync`, so
nothing is copied to your browser account or synced to your other devices.
Stored there:

- **Custom field rules** you create (what words to match, what value to
  fill).
- **Form maps** — see section 2.
- **Settings** — your preferences for how filling behaves (password length,
  email domains, name style, and so on).

All of it is removed if you uninstall the extension, or immediately if you
use **Backup → Delete everything** in its settings. None of it is ever read
by the developer or transmitted anywhere.

## 2. Form maps and remembered values

A form map is a saved copy of one form's fields, built two ways:

- **Generated values** (the default): each field gets a freshly made-up
  value — a random name, a random phone number, and so on — every time the
  map fills.
- **Remembered values**, when you tick **"Remember what is typed in it
  right now"** while saving the map: instead of a fresh made-up value, the
  field is pinned to exactly what was in it at the moment you saved the
  map. This is intended for names, phone numbers, and similar — but the
  extension does not distinguish field types when capturing, so **if a
  password field already had something typed into it, that password is
  captured and stored the same way as any other field**, and will be typed
  back in on every future fill. If you don't want a password (or any other
  specific field) remembered, leave that field blank before saving the map,
  or switch that one field back to a generated value in the map's field
  list afterward.

**The capture itself happens as soon as you click "Map this form" in the
popup** — before you've chosen whether to keep the remembered values or
not. At that point, the current value of every fillable field on the page
(again, including a password field if one has something typed into it) is
read and held in local storage temporarily, so the options page can show it
to you while you finish setting up the map. This temporary copy is deleted
as soon as you finish creating the map or press Cancel; if you do neither,
it is removed automatically the next time you open the extension's options
page, provided at least 10 minutes have passed since it was captured.

None of this — captured or remembered — is ever transmitted anywhere. It
stays in `chrome.storage.local` until you delete the map, use **Backup →
Delete everything**, or uninstall the extension.

## 3. When the extension reads or changes a page

**Custom field rules** (Fill all fields, Fill this form, Fill this field,
and the right-click menu) only ever run when you take an explicit action:
pressing a keyboard shortcut, clicking a button in the popup, or using the
right-click menu. Outside of those moments, custom field rules never read
or change anything on a page.

**Form maps behave differently, depending on how you set them up** (this is
a per-map setting, under "Fill it"):

- **"Only when I ask"** — behaves like a custom field rule: nothing happens
  until you explicitly request it (the popup's "Fill it now", or a Fill
  command).
- **"When I click into the form"** (the default when you save a new map) —
  once you've saved a map for a page, the extension automatically checks,
  every time that page loads, whether the mapped form is present. If it is,
  it waits; the first time you click or focus anywhere inside that specific
  form — an ordinary interaction, not a dedicated "fill" action — it reads
  the form's current field values (to check whether the form still looks
  empty, if that guard is on) and, if so, fills it.
- **"Automatically when the page loads"** — the extension reads the form's
  current field values and fills it as soon as the page loads, with no
  click, keystroke, or other action from you at all.

This automatic checking and filling **only ever happens on a page you have
personally mapped** — a URL pattern you set (usually the page you were on
when you created the map). It never happens on a page you haven't mapped,
and it never happens for custom field rules, only for form maps set to
"When I click into the form" or "Automatically when the page loads."

Whether triggered automatically or by your explicit request, reading and
filling a page's fields never leaves the page — nothing about what a page
contains is sent, logged, or reported anywhere.

The values Form Filler generates itself — names, phone numbers, addresses,
and so on — are randomly made up. They do not describe a real person, and
no information about you or the pages you visit is used to produce them.

## 4. What the extension does not do

- It makes no network requests of any kind. (There is no server-side
  component at all — you can verify this by reading the source code, which
  never calls `fetch`, `XMLHttpRequest`, `WebSocket`, or anything similar.)
- It does not use cookies, analytics, or tracking of any kind.
- It does not sell, rent, or share locally-stored data with third parties.
- It does not read a page's field values except as described in sections 2
  and 3 above — deciding what to fill, checking whether a mapped form is
  still empty, or capturing values you asked it to remember.

## 5. Permissions Form Filler asks for, and why

| Permission | Why it's needed |
| --- | --- |
| Read and change data on all websites | Filling forms, and — for saved form maps — automatically detecting a mapped page and checking or filling its fields as described in section 3, requires this on whichever site the form is on. |
| Storage | To save your rules, form maps (including any remembered values) and settings locally, as described in sections 1–2. |
| Context menus | To add the right-click "Form Filler" menu. |
| Active tab / scripting | To run the fill action on the current tab when you ask it to, including on tabs that were already open before the extension was installed. |

## 6. Changes to this policy

If this policy ever changes, the "Last updated" date above will change with
it.

## 7. Contact

Questions about this policy or the extension's data handling can be sent to
the developer at the contact address listed on the extension's store
listing.

---

*A hosted copy of this policy — the version to link from the Edge Add-ons*
*dashboard's privacy policy field — is published at:*
*https://claude.ai/code/artifact/9fe4b3fa-853b-4075-ab33-aebbaa9826d5*
*(open it once and use its share menu to make it publicly viewable before*
*pasting the link into the dashboard — artifacts are private by default).*
