// background.js - MV3 service worker to support auto-translate on tab load

const KEY = {
  auto: 'autoTranslateEnabled',
  target: 'autoTranslateTargetLang',
};

chrome.runtime.onInstalled.addListener(async () => {
  const s = await chrome.storage.sync.get([KEY.auto, KEY.target]);
  if (typeof s[KEY.auto] === 'undefined') {
    await chrome.storage.sync.set({ [KEY.auto]: false });
  }
  if (typeof s[KEY.target] === 'undefined') {
    await chrome.storage.sync.set({ [KEY.target]: 'zh-Hans' });
  }
});

// When a tab finishes loading and auto-translate is on, inject and start translation
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status !== 'complete') return;
  try {
    const url = tab?.url || '';
    if (!/^https?:|^file:|^chrome-extension:/.test(url)) return;
    const s = await chrome.storage.sync.get([KEY.auto, KEY.target]);
    if (!s[KEY.auto]) return;
    const targetLang = s[KEY.target] || 'zh-Hans';
    await chrome.scripting.executeScript({ target: { tabId }, files: ['contentScript.js'] });
    await chrome.tabs.sendMessage(tabId, { type: 'START_PAGE_TRANSLATION', targetLang: targetLang });
  } catch (e) {
    // ignore
  }
});

