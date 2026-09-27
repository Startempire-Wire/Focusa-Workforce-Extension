import { createEvidenceCandidate, createIncomingWorkDraft, pageContextFromCapture, captureId } from './lib/page-context.mjs';

const PAGE_CAPTURES_KEY = 'focusa.workforce.page_captures.v1';
const MENU = Object.freeze({
  createWork: 'wfx:create-work',
  askForeman: 'wfx:ask-foreman',
  captureEvidence: 'wfx:capture-evidence',
});

async function configureSidePanel() {
  await chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
}

function ensureMenus() {
  if (!chrome.contextMenus) return;
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({ id: MENU.createWork, title: 'Create Work from this selection (Focusa Workforce)', contexts: ['selection'] });
    chrome.contextMenus.create({ id: MENU.askForeman, title: 'Ask Foreman about this page (Focusa Workforce)', contexts: ['page'] });
    chrome.contextMenus.create({ id: MENU.captureEvidence, title: 'Capture evidence candidate from this page (Focusa Workforce)', contexts: ['page'] });
  });
}

async function readSelectedText(tabId) {
  try {
    const results = await chrome.scripting.executeScript({ target: { tabId }, func: () => window.getSelection()?.toString() ?? '' });
    return (results?.[0]?.result ?? '').trim();
  } catch { return ''; }
}

async function persistCapture(record) {
  const raw = (await chrome.storage.local.get(PAGE_CAPTURES_KEY))[PAGE_CAPTURES_KEY] ?? [];
  await chrome.storage.local.set({ [PAGE_CAPTURES_KEY]: [record, ...raw].slice(0, 40) });
}

async function handleContextMenu({ menuItemId, info, tab }) {
  try {
    if (!tab) throw new Error('no active tab context');
    const url = info.pageUrl ?? tab.url;
    const selectedText = typeof info.selectionText === 'string' && info.selectionText.trim() ? info.selectionText : await readSelectedText(tab.id);
    const context = pageContextFromCapture({ url, title: tab.title, selectedText, capturedAt: new Date().toISOString() });
    const record = menuItemId === MENU.captureEvidence ? createEvidenceCandidate(context) : createIncomingWorkDraft(context);
    record.id = captureId(menuItemId === MENU.captureEvidence ? 'ev' : 'work');
    await persistCapture(record);
    const face = menuItemId === MENU.captureEvidence ? 'evidence' : 'work';
    await chrome.tabs.create({ url: chrome.runtime.getURL('workforce.html') + `#/${face}?intent=inspect` });
  } catch (error) {
    console.error('Focusa Workforce could not stage the page capture', error);
  }
}

chrome.contextMenus?.onClicked.addListener(async (info, tab) => {
  await handleContextMenu({ menuItemId: info.menuItemId, info, tab });
});

chrome.runtime.onInstalled.addListener(() => {
  configureSidePanel().catch((error) => {
    console.error('Focusa Workforce could not configure the side panel', error);
  });
  ensureMenus();
});

chrome.runtime.onStartup.addListener(() => {
  configureSidePanel().catch((error) => {
    console.error('Focusa Workforce could not restore side-panel behavior', error);
  });
  ensureMenus();
});

// Keyboard command surfaces: wall and the full Workforce page open as tabs;
// the side panel opens via the action key.
chrome.commands?.onCommand.addListener((command) => {
  if (command === 'open-wall') {
    chrome.tabs.create({ url: chrome.runtime.getURL('wall.html') });
  }
  if (command === 'open-workforce') {
    chrome.tabs.create({ url: chrome.runtime.getURL('workforce.html') });
  }
});
