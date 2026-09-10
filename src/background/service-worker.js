/* Form Filler - background service worker: menus, shortcuts, message routing. */
importScripts(
  '../common/constants.js',
  '../common/regexgen.js',
  '../common/random.js',
  '../common/generator.js',
  '../common/matcher.js',
  '../common/rulepacks.js',
  '../common/formmap.js',
  '../common/storage.js'
);

const CONTENT_SCRIPTS = [
  'src/common/constants.js',
  'src/common/regexgen.js',
  'src/common/random.js',
  'src/common/generator.js',
  'src/common/matcher.js',
  'src/common/formmap.js',
  'src/common/storage.js',
  'src/content/filler.js',
  'src/content/content.js'
];

const MENU = {
  root: 'form-filler-root',
  all: 'fill-all-fields',
  form: 'fill-this-form',
  input: 'fill-this-input',
  options: 'form-filler-options'
};

/* ------------------------------------------------------------------ *
 * Context menu
 * ------------------------------------------------------------------ */
async function buildContextMenu() {
  await chrome.contextMenus.removeAll();
  const options = await FF.loadOptions();
  if (!options.settings.showContextMenu) return;

  chrome.contextMenus.create({
    id: MENU.root,
    title: 'Form Filler',
    contexts: ['page', 'editable']
  });
  chrome.contextMenus.create({
    id: MENU.all,
    parentId: MENU.root,
    title: 'Fill all fields',
    contexts: ['page', 'editable']
  });
  chrome.contextMenus.create({
    id: MENU.form,
    parentId: MENU.root,
    title: 'Fill this form',
    contexts: ['page', 'editable']
  });
  chrome.contextMenus.create({
    id: MENU.input,
    parentId: MENU.root,
    title: 'Fill this field',
    contexts: ['editable']
  });
  chrome.contextMenus.create({
    id: 'form-filler-sep',
    parentId: MENU.root,
    type: 'separator',
    contexts: ['page', 'editable']
  });
  chrome.contextMenus.create({
    id: MENU.options,
    parentId: MENU.root,
    title: 'Options',
    contexts: ['page', 'editable']
  });
}

chrome.runtime.onInstalled.addListener(async (details) => {
  const options = await FF.loadOptions();
  if (details.reason === 'install' && !options.fields.length) {
    options.fields = starterFields();
    await FF.saveOptions(options);
  }
  await buildContextMenu();
});

chrome.runtime.onStartup.addListener(buildContextMenu);

/* Options save on every keystroke, so only touch the menus when the setting
 * that governs them actually flips. */
chrome.storage.onChanged.addListener((changes, area) => {
  const change = area === 'local' && changes[FF.STORAGE_KEY];
  if (!change) return;
  const was = change.oldValue && change.oldValue.settings;
  const now = change.newValue && change.newValue.settings;
  const before = was ? was.showContextMenu !== false : null;
  const after = now ? now.showContextMenu !== false : true;
  if (before !== after) buildContextMenu();
});

/* ------------------------------------------------------------------ *
 * Dispatch
 * ------------------------------------------------------------------ */
async function sendToTab(tabId, action, source, frameId) {
  const message = { action, source };
  const target = typeof frameId === 'number' ? { frameId } : undefined;
  try {
    return await chrome.tabs.sendMessage(tabId, message, target);
  } catch (err) {
    /* The content script is not there yet (page predates the install, or the
     * tab was never reloaded) - inject it and try once more. */
    await chrome.scripting.executeScript({
      target: { tabId, allFrames: true },
      files: CONTENT_SCRIPTS
    });
    return chrome.tabs.sendMessage(tabId, message, target);
  }
}

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === MENU.options) {
    chrome.runtime.openOptionsPage();
    return;
  }
  if (!tab || !tab.id) return;
  try {
    await sendToTab(tab.id, info.menuItemId, 'menu', info.frameId);
  } catch (err) {
    console.warn('[Form Filler]', err);
  }
});

chrome.commands.onCommand.addListener(async (command) => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab || !tab.id) return;
  try {
    await sendToTab(tab.id, command, 'command');
  } catch (err) {
    console.warn('[Form Filler]', err);
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || message.target !== 'background') return undefined;

  if (message.action === 'open-options') {
    chrome.runtime.openOptionsPage();
    sendResponse({ ok: true });
    return undefined;
  }

  if (message.action === 'dispatch') {
    sendToTab(message.tabId, message.command, 'popup').then(
      (result) => sendResponse({ ok: true, result }),
      (err) => sendResponse({ ok: false, error: String(err && err.message ? err.message : err) })
    );
    return true;
  }

  return undefined;
});

/* ------------------------------------------------------------------ *
 * Seed rules so a fresh install is useful immediately
 * ------------------------------------------------------------------ */
function starterFields() {
  return FF.rulePackFields('essentials');
}
