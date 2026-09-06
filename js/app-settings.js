/**
 * N3 App — UI language settings (ja / en)
 * API lang stays ja+en for bilingual content fields.
 */
(function (global) {
  const STORAGE_KEY = 'n3_ui_lang';
  const API_LANG = 'ja+en';

  const settingsI18n = {
    ja: {
      settingsTitle: '設定',
      language: '表示言語',
      langJa: '日本語',
      langEn: 'English',
      close: '閉じる',
      historySoon: '履歴（準備中）',
    },
    en: {
      settingsTitle: 'Settings',
      language: 'Display language',
      langJa: '日本語',
      langEn: 'English',
      close: 'Close',
      historySoon: 'History (coming soon)',
    },
  };

  function getUiLang() {
    return localStorage.getItem(STORAGE_KEY) === 'en' ? 'en' : 'ja';
  }

  function setUiLang(lang) {
    const next = lang === 'en' ? 'en' : 'ja';
    localStorage.setItem(STORAGE_KEY, next);
    global.dispatchEvent(new CustomEvent('app:langchange', { detail: { lang: next } }));
    syncModalLabels();
    updateLangToggles();
  }

  function getApiLang() {
    return API_LANG;
  }

  function isEn() {
    return getUiLang() === 'en';
  }

  function st(key) {
    return settingsI18n[getUiLang()][key] || settingsI18n.ja[key] || key;
  }

  function t(dict, key, vars) {
    const lang = getUiLang();
    let str = dict[lang]?.[key] || dict.ja?.[key] || key;
    if (vars) {
      Object.entries(vars).forEach(([k, v]) => {
        str = str.replaceAll(`{${k}}`, v);
      });
    }
    return str;
  }

  function ensureModal() {
    if (document.getElementById('appSettingsModal')) return;

    const style = document.createElement('style');
    style.textContent = `
      .app-settings-overlay {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.55);
        z-index: 100;
        display: flex;
        align-items: flex-end;
        justify-content: center;
        padding: 16px;
      }
      .app-settings-overlay.hidden { display: none !important; }
      .app-settings-sheet {
        width: 100%;
        max-width: 480px;
        background: #0d1117;
        border: 1px solid #21262d;
        border-radius: 14px 14px 12px 12px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.45);
        overflow: hidden;
      }
      .app-settings-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 16px 18px;
        border-bottom: 1px solid #21262d;
      }
      .app-settings-title {
        font-size: 1rem;
        font-weight: 700;
        color: #e6edf3;
      }
      .app-settings-close {
        background: none;
        border: none;
        color: #7d8590;
        font-size: 1.4rem;
        cursor: pointer;
        line-height: 1;
        padding: 4px;
      }
      .app-settings-body { padding: 16px 18px 20px; }
      .app-settings-label {
        font-size: 0.82rem;
        color: #7d8590;
        margin-bottom: 10px;
      }
      .app-settings-options {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;
      }
      .app-settings-option {
        padding: 14px 12px;
        border-radius: 10px;
        border: 1px solid #21262d;
        background: #161b22;
        color: #e6edf3;
        font-size: 0.95rem;
        font-weight: 600;
        cursor: pointer;
        font-family: inherit;
      }
      .app-settings-option.active {
        border-color: #14b8a6;
        background: rgba(20, 184, 166, 0.12);
        color: #2dd4bf;
      }
    `;
    document.head.appendChild(style);

    const overlay = document.createElement('div');
    overlay.id = 'appSettingsModal';
    overlay.className = 'app-settings-overlay hidden';
    overlay.innerHTML = `
      <div class="app-settings-sheet" role="dialog" aria-modal="true" aria-labelledby="appSettingsTitle">
        <div class="app-settings-header">
          <span class="app-settings-title" id="appSettingsTitle"></span>
          <button class="app-settings-close" type="button" id="appSettingsClose" aria-label="close">×</button>
        </div>
        <div class="app-settings-body">
          <div class="app-settings-label" id="appSettingsLangLabel"></div>
          <div class="app-settings-options">
            <button class="app-settings-option" type="button" data-lang="ja" id="appSettingsJa"></button>
            <button class="app-settings-option" type="button" data-lang="en" id="appSettingsEn"></button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeSettingsModal();
    });
    document.getElementById('appSettingsClose').addEventListener('click', closeSettingsModal);
    document.getElementById('appSettingsJa').addEventListener('click', () => {
      setUiLang('ja');
      updateModalSelection();
    });
    document.getElementById('appSettingsEn').addEventListener('click', () => {
      setUiLang('en');
      updateModalSelection();
    });
  }

  function syncModalLabels() {
    const title = document.getElementById('appSettingsTitle');
    if (!title) return;
    title.textContent = st('settingsTitle');
    document.getElementById('appSettingsLangLabel').textContent = st('language');
    document.getElementById('appSettingsJa').textContent = st('langJa');
    document.getElementById('appSettingsEn').textContent = st('langEn');
    document.getElementById('appSettingsClose').setAttribute('aria-label', st('close'));
  }

  function updateModalSelection() {
    const lang = getUiLang();
    document.getElementById('appSettingsJa')?.classList.toggle('active', lang === 'ja');
    document.getElementById('appSettingsEn')?.classList.toggle('active', lang === 'en');
  }

  function openSettingsModal() {
    ensureModal();
    syncModalLabels();
    updateModalSelection();
    document.getElementById('appSettingsModal').classList.remove('hidden');
  }

  function closeSettingsModal() {
    document.getElementById('appSettingsModal')?.classList.add('hidden');
  }

  function updateLangToggles() {
    const lang = getUiLang();
    document.querySelectorAll('[data-set-lang]').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.setLang === lang);
    });
  }

  function initLangToggles() {
    document.querySelectorAll('[data-set-lang]').forEach((btn) => {
      btn.addEventListener('click', () => {
        setUiLang(btn.dataset.setLang);
      });
    });
    updateLangToggles();
  }

  function initSettingsButtons() {
    document.querySelectorAll('[data-open-settings]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        openSettingsModal();
      });
    });
  }

  global.AppLang = { getUiLang, setUiLang, getApiLang, isEn, t, st };
  global.AppSettings = { open: openSettingsModal, close: closeSettingsModal, init: initSettingsButtons };

  document.addEventListener('DOMContentLoaded', () => {
    initSettingsButtons();
    initLangToggles();
  });
})(window);
