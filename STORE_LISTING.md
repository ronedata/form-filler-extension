# Microsoft Edge Add-ons — submission material

Ready-to-paste text for the Edge Add-ons developer dashboard
(`https://partner.microsoft.com/dashboard/microsoftedge/`), plus a short
checklist. None of this needs editing to be usable; adjust the wording only
if you want to.

## Package to upload

`dist/form-filler-v1.10.1.zip` — built from `manifest.json` + `icons/` +
`src/` only. `test/`, `README.md`, `CHANGELOG.md`, `PRIVACY.md` and this file
are deliberately left out; none of them are referenced by the manifest and
they add nothing at runtime.

Rebuilding it after a future change (PowerShell, from the project root):

```powershell
$staging = 'dist\form-filler'
Remove-Item -Recurse -Force dist -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Force -Path $staging | Out-Null
Copy-Item manifest.json,icons,src -Destination $staging -Recurse
Compress-Archive -Path "$staging\*" -DestinationPath "dist\form-filler-v<version>.zip" -Force
```

## Privacy policy URL

Paste the published page's link (see `PRIVACY.md` for the current one, or
republish it) — make sure it's set to public/shareable first, since Edge's
review team and anyone visiting the store listing need to be able to open it
without being signed in as you.

## Single purpose description

> Form Filler fills web forms with realistic placeholder data — names,
> emails, phone numbers, addresses and more — so testers and developers
> don't have to type it by hand. Every value is either made up at random or
> comes from a rule the user configured themselves; nothing is collected or
> sent anywhere.

## Detailed description (store listing body)

> **Stop typing the same test data by hand.**
>
> Form Filler fills in web forms in one click — names, emails, phone
> numbers, addresses, passwords, dates, and whatever else a form asks for.
> Press a keyboard shortcut, or use the toolbar popup or right-click menu,
> and every field on the page fills in with realistic, randomly generated
> values.
>
> **Unlimited custom rules.** Tell Form Filler exactly what a field named
> "email" or "mobile" should get, and it remembers that rule for every site
> — or only the one you specify. Ready-made rule packs cover the basics
> (names, addresses, phone numbers) and Bangladesh-specific fields (BD
> mobile numbers, NID, board roll, GPA) out of the box.
>
> **Map a form once, fill it forever.** For a form you fill in over and over,
> map it once — by hand or automatically — and Form Filler will fill the
> exact same form the same way every time you open it, including dependent
> dropdowns (like Division → District → Thana) and autocomplete/lookup
> fields that need a moment to load.
>
> **Nothing leaves your browser.** Form Filler makes no network requests at
> all — every rule, every saved form, every setting stays in your browser's
> local storage, on your device. See the privacy policy for details.
>
> **Built for real-world forms**, including ones with dropdowns that only
> populate after an earlier choice, autocomplete fields that need a typed
> query before they suggest anything, and forms rendered by frameworks like
> React or Vue.

## Category

Productivity, or Developer Tools — either fits; Productivity is the more
common choice for form-filling utilities.

## Permission justifications

Edge's submission form asks you to justify any permission that isn't
self-explanatory. Suggested wording:

| Permission | Justification |
| --- | --- |
| Read and change all your data on the websites you visit (`host_permissions: <all_urls>`, and the content script's `<all_urls>` match) | The extension's entire purpose is filling in form fields on whatever page the user is using it on. There is no way to know that page in advance, so the permission has to cover every site. |
| `storage` | Saves the user's custom rules, saved form maps and settings locally via `chrome.storage.local`. Nothing is synced or transmitted. |
| `contextMenus` | Adds the "Form Filler" entry to the right-click menu, one of the ways to trigger a fill. |
| `activeTab`, `scripting` | Runs the fill action on the current tab on request, and injects the content script into tabs that were already open before install/update (normally content scripts only attach to tabs opened after installation). |

## Screenshots

The popup and options page were already exercised and screenshotted during
development (light and dark, several panels) — say the word if you want a
fresh set specifically framed for the store listing (Edge wants 1280×800 or
640×400, at least one, up to five).

## Before you click submit

- [ ] Load `dist/form-filler` as an unpacked extension yourself
      (`edge://extensions` → Developer mode → Load unpacked) and click through
      the popup, options page, and a real form once. This project's sandbox
      can't launch a real browser with `--load-extension` to do this last
      check for you — everything else has been verified by other means (see
      `CHANGELOG.md`), but this one step needs a real browser window.
- [ ] Make sure the privacy policy page is set to public/shareable.
- [ ] Have a support/contact email ready — the dashboard requires one.
