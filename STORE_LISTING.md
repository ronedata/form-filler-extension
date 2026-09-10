# Microsoft Edge Add-ons — submission material

Ready-to-paste text for the Edge Add-ons developer dashboard
(`https://partner.microsoft.com/dashboard/microsoftedge/`), plus a short
checklist. None of this needs editing to be usable; adjust the wording only
if you want to.

## Package to upload

`dist/form-filler-v1.10.3.zip` — matches the version currently in
`manifest.json`. Built from `manifest.json` + `icons/` + `src/` only, with
`manifest.json` sitting at the zip's top level (not nested inside another
folder or zip). `test/`, `README.md`, `CHANGELOG.md`, `PRIVACY.md` and this
file are deliberately left out; none of them are referenced by the manifest
and they add nothing at runtime.

Rebuilding it after a future change (PowerShell, from the project root):

```powershell
$staging = 'dist\form-filler'
Remove-Item -Recurse -Force dist -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Force -Path $staging | Out-Null
Copy-Item manifest.json,icons,src -Destination $staging -Recurse
Compress-Archive -Path "$staging\*" -DestinationPath "dist\form-filler-v<version>.zip" -Force
```

## Privacy policy URL

```
https://github.com/ronedata/form-filler-extension/blob/main/PRIVACY.md
```

Already public — the repo is public, so this needs no extra setup and works
right now. It stays in sync automatically: whatever `PRIVACY.md` says at the
time someone opens the link is what they see.

A more visually designed standalone copy of the same policy also exists (see
`PRIVACY.md` for the link) if you'd rather use that instead — just open it
once and use its share menu to make it public first, since that one is
private until you do.

## Single purpose description

> Form Filler fills web forms with realistic placeholder data — names,
> emails, phone numbers, addresses and more — so testers and developers
> don't have to type it by hand. Every value is either made up at random or
> comes from a rule the user configured themselves. The extension makes no
> network requests; the user's rules, saved forms and settings are stored
> only in the browser's local storage and are never transmitted anywhere.

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
> fields that need a moment to load. A mapped form can fill itself the
> moment you click into it, or as soon as the page loads, with no further
> action from you — you choose which, per form, when you save it.
>
> **No external transmission, ever.** Form Filler makes no network requests
> of any kind — nothing it does ever leaves your device. Your rules, saved
> forms and settings are kept only in the browser's local storage; if you
> choose to remember a form's values while saving it, those values are
> stored the same way, locally, never sent anywhere. Full details, including
> exactly when a saved form fills itself automatically, are in the privacy
> policy.
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
| Read and change all your data on the websites you visit (`host_permissions: <all_urls>`, and the content script's `<all_urls>` match) | The extension's entire purpose is filling in form fields on whatever page the user is using it on, so the permission has to cover every site. It's also what lets a saved form map detect a page the user has mapped and — depending on the trigger the user chose for that map — check or fill it automatically, without a fresh action each visit. |
| `storage` | Saves the user's custom rules, saved form maps (including any field values the user chose to remember while saving one) and settings via `chrome.storage.local`. Local only — nothing is synced to the user's account or transmitted anywhere. |
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
- [x] Privacy policy URL is already public (the GitHub link above needs no
      extra step) — only relevant if you choose the standalone designed page
      instead, which does need its share menu used once.
- [ ] Have a support/contact email ready — the dashboard requires one.
