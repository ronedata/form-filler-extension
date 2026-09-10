# Privacy Policy — Form Filler

**Last updated: September 2026**

Form Filler is a browser extension that fills web forms with generated or
previously-entered values. This policy explains, plainly, what the extension
does and does not do with your data.

## The short version

**Form Filler collects nothing, sends nothing, and talks to no server.**
Every rule, form map, and setting you create lives only in your own browser,
on your own computer. Nothing is uploaded anywhere — not to the developer,
not to any analytics service, not to anyone.

## What the extension stores, and where

Form Filler uses the browser's built-in `chrome.storage.local` — a private
storage area belonging only to this extension, on your device. It never uses
`chrome.storage.sync`, so nothing is copied to your browser account or synced
to your other devices. It is stored there:

- **Custom field rules** you create (what words to match, what value to fill).
- **Form maps** — a saved copy of one form's fields and the values you told
  the extension to put in them. If you choose "Remember what is typed in it
  right now" while saving a map, whatever was on the page at that moment
  (names, phone numbers, institute names, and similar) is saved as part of
  that map, on your device only.
- **Settings** — your preferences for how filling behaves (password length,
  email domains, name style, and so on).

This data is never transmitted anywhere. It is not read by the developer. It
is removed if you uninstall the extension, or immediately if you use the
**Backup → Delete everything** button.

## What the extension does on web pages

To do its job, Form Filler needs permission to read and modify the content of
pages you visit — that is how it finds form fields and types values into
them. This happens **only when you ask it to** (pressing a keyboard shortcut,
clicking a button in the popup, using the right-click menu, or opening a form
you previously mapped). It never reads page content in the background for any
other purpose, and it never reports what is on a page to anyone.

The values Form Filler generates — names, phone numbers, addresses, and so
on — are randomly made up. They do not describe a real person, and no
information about you or the pages you visit is used to generate them.

## What the extension does not do

- It does not make network requests of any kind. (There is no server-side
  component at all — you can verify this yourself by reading the source code,
  which never calls `fetch`, `XMLHttpRequest`, or anything similar.)
- It does not use cookies, analytics, or tracking of any kind.
- It does not sell, rent, or share data with third parties, because it never
  collects any in the first place.
- It does not read passwords or other field values for any purpose beyond
  filling them when you ask it to.

## Permissions Form Filler asks for, and why

| Permission | Why it's needed |
| --- | --- |
| Read and change data on all websites | To find form fields and fill them in, on whichever page you're using the extension on. |
| Storage | To save your rules, form maps and settings locally, as described above. |
| Context menus | To add the right-click "Form Filler" menu. |
| Active tab / scripting | To run the fill action on the current tab when you ask it to, including on tabs that were already open before the extension was installed. |

## Changes to this policy

If this policy ever changes, the "Last updated" date above will change with
it. Given the extension's design — no server, no accounts, no network access
— there is little reason to expect that to happen.

## Contact

Questions about this policy or the extension's data handling can be sent to
the developer at the contact address listed on the extension's store listing.

---

*A hosted copy of this policy — the version to link from the Edge Add-ons*
*dashboard's privacy policy field — is published at:*
*https://claude.ai/code/artifact/9fe4b3fa-853b-4075-ab33-aebbaa9826d5*
*(open it once and use its share menu to make it publicly viewable before*
*pasting the link into the dashboard — artifacts are private by default).*
