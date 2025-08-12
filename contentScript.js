// contentScript.js - Translate page text in-place using Chrome Translator API, preserving layout

(() => {
  // State
  let enabled = false;
  let translator = null;
  let currentTargetLang = 'zh-Hans';
  const originalText = new Map(); // Text node -> original string (Map so we can iterate/restore)
  let observer = null;

  // Simple inline overlay for status/progress
  let overlayEl = null;
  function showOverlay(msg) {
    if (!overlayEl) {
      overlayEl = document.createElement('div');
      overlayEl.style.cssText = [
        'position:fixed',
        'right:12px',
        'bottom:12px',
        'max-width:40vw',
        'z-index:2147483647',
        'background:#111827',
        'color:#fff',
        'padding:8px 10px',
        'border-radius:8px',
        'font:12px/1.4 -apple-system,system-ui,Segoe UI,Roboto,sans-serif',
        'box-shadow:0 6px 20px rgba(0,0,0,.25)',
        'opacity:.95',
        'pointer-events:none',
      ].join(';');
      document.documentElement.appendChild(overlayEl);
    }
    overlayEl.textContent = String(msg || '');
  }
  function hideOverlay() {
    if (overlayEl) overlayEl.remove();
    overlayEl = null;
  }

  const EXCLUDED = new Set(['SCRIPT','STYLE','NOSCRIPT','IFRAME','CANVAS','SVG','CODE','PRE','TEXTAREA','INPUT','BUTTON','SELECT']);

  function* walkTextNodes(root) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        if (!node) return NodeFilter.FILTER_REJECT;
        if (!node.parentElement) return NodeFilter.FILTER_REJECT;
        const pe = node.parentElement;
        if (EXCLUDED.has(pe.tagName)) return NodeFilter.FILTER_REJECT;
        const txt = node.nodeValue || '';
        if (!txt.trim()) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    let cur;
    while ((cur = walker.nextNode())) {
      yield cur;
    }
  }

  function samplePageText(maxLen = 2000) {
    let acc = '';
    for (const tn of walkTextNodes(document.body || document.documentElement)) {
      const t = (tn.nodeValue || '').trim();
      if (!t) continue;
      if (acc.length + t.length + 1 > maxLen) break;
      acc += (acc ? '\n' : '') + t;
      if (acc.length >= maxLen) break;
    }
    return acc;
  }

  function normalizeLang(code) {
    if (!code) return code;
    if (code === 'zh') return 'zh-Hans';
    return code;
  }

  async function detectSourceLanguage() {
    try {
      if (typeof window.LanguageDetector === 'undefined') return null;
      const text = samplePageText();
      if (!text) return null;
      const detector = await window.LanguageDetector.create({ expectedInputLanguages: ['en','zh-Hans','zh-Hant','ja','ko','fr','de','es','ru','it','pt'] });
      const results = await detector.detect(text);
      detector.destroy?.();
      if (Array.isArray(results) && results.length > 0) {
        return results[0].detectedLanguage || null;
      }
    } catch (e) {
      // ignore
    }
    return null;
  }

  async function ensureTranslator(sourceLang, targetLang) {
    if (translator && currentTargetLang === targetLang) return translator;
    if (typeof window.Translator === 'undefined') {
      throw new Error('此页面上下文不支持 Translator API（需要 Chrome 138+ 且安全上下文）。');
    }
    const src = normalizeLang(sourceLang || 'en');
    const tgt = normalizeLang(targetLang || 'zh-Hans');
    if (translator) {
      try { translator.destroy?.(); } catch {}
    }
    translator = await window.Translator.create({ sourceLanguage: src, targetLanguage: tgt });
    currentTargetLang = tgt;
    return translator;
  }

  async function translateTextNodes(targetLang) {
    enabled = true;
    showOverlay('正在准备页面翻译...');

    let sourceLang = await detectSourceLanguage();
    if (!sourceLang) sourceLang = 'en';

    await ensureTranslator(sourceLang, targetLang);

    const nodes = Array.from(walkTextNodes(document.body || document.documentElement));
    const total = nodes.length;
    let done = 0;

    showOverlay(`正在翻译页面 (${done}/${total})...`);

    for (const tn of nodes) {
      if (!enabled) break; // interrupted
      const orig = tn.nodeValue || '';
      if (!orig.trim()) { done++; continue; }
      if (!originalText.has(tn)) originalText.set(tn, orig);
      try {
        const translated = await translator.translate(orig);
        // only replace if unchanged to reduce race effects
        if (enabled && (tn.nodeValue === orig || !tn.nodeValue)) {
          tn.nodeValue = translated;
        }
      } catch (e) {
        // Skip on error
      } finally {
        done++;
        if (done % 20 === 0 || done === total) {
          showOverlay(`正在翻译页面 (${done}/${total})...`);
        }
      }
    }

    showOverlay('页面翻译完成');
    setTimeout(hideOverlay, 1200);

    // Observe dynamic changes
    setupObserver(targetLang);
  }

  function setupObserver(targetLang) {
    cleanupObserver();
    observer = new MutationObserver(async (mutations) => {
      if (!enabled || !translator) return;
      const newTextNodes = [];
      for (const m of mutations) {
        for (const node of m.addedNodes || []) {
          if (node.nodeType === Node.TEXT_NODE) {
            newTextNodes.push(node);
          } else if (node.nodeType === Node.ELEMENT_NODE) {
            for (const tn of walkTextNodes(node)) newTextNodes.push(tn);
          }
        }
      }
      if (newTextNodes.length === 0) return;
      for (const tn of newTextNodes) {
        const orig = tn.nodeValue || '';
        if (!orig.trim()) continue;
        if (!originalText.has(tn)) originalText.set(tn, orig);
        try {
          const translated = await translator.translate(orig);
          if (enabled && (tn.nodeValue === orig || !tn.nodeValue)) tn.nodeValue = translated;
        } catch {}
      }
    });
    observer.observe(document.body || document.documentElement, { childList: true, subtree: true });
  }

  function cleanupObserver() {
    observer?.disconnect();
    observer = null;
  }

  function restorePage() {
    enabled = false;
    cleanupObserver();
    hideOverlay();
    for (const [tn, orig] of originalText.entries()) {
      try {
        if (tn && tn.nodeType === Node.TEXT_NODE) tn.nodeValue = orig;
      } catch {}
    }
    originalText.clear();
    try { translator?.destroy?.(); } catch {}
    translator = null;
  }

  // Messaging
  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    (async () => {
      try {
        if (msg && msg.type === 'START_PAGE_TRANSLATION') {
          const lang = msg.targetLang || 'zh-Hans';
          if (!enabled) {
            await translateTextNodes(lang);
          } else if (currentTargetLang !== normalizeLang(lang)) {
            // Retarget: re-translate current page to new target
            enabled = true;
            showOverlay('正在切换目标语言...');
            let sourceLang = await detectSourceLanguage();
            if (!sourceLang) sourceLang = 'en';
            await ensureTranslator(sourceLang, lang);
            // Re-run over current text nodes only (no restore)
            const nodes = Array.from(walkTextNodes(document.body || document.documentElement));
            for (const tn of nodes) {
              const now = tn.nodeValue || '';
              if (!now.trim()) continue;
              try {
                const translated = await translator.translate(originalText.get(tn) ?? now);
                if (enabled) tn.nodeValue = translated;
              } catch {}
            }
            showOverlay('切换完成');
            setTimeout(hideOverlay, 1000);
          }
          sendResponse({ ok: true, enabled, targetLang: currentTargetLang });
          return;
        }
        if (msg && msg.type === 'STOP_PAGE_TRANSLATION') {
          restorePage();
          sendResponse({ ok: true });
          return;
        }
        if (msg && msg.type === 'QUERY_STATUS') {
          sendResponse({ ok: true, enabled, targetLang: currentTargetLang });
          return;
        }
      } catch (e) {
        showOverlay(String(e?.message || e || 'Error'));
        setTimeout(hideOverlay, 2000);
        sendResponse({ ok: false, error: String(e?.message || e || 'Error') });
        return;
      }
    })();
    return true; // keep channel open for async
  });
})();

