/**

 * N3 App — 学習進捗（localStorage）

 */

(function (global) {

  const STORAGE_KEY = 'n3_progress_v1';



  const MODULE_META = {

    vocab: { icon: '📚', color: 'amber', ja: '語彙', en: 'Vocabulary' },

    grammar: { icon: '✏️', color: 'blue', ja: '文法', en: 'Grammar' },

    kanji: { icon: '🈳', color: 'accent', ja: '漢字', en: 'Kanji' },

    reading: { icon: '📖', color: 'purple', ja: '読解', en: 'Reading' },

    listening: { icon: '🎧', color: 'teal', ja: '聴解', en: 'Listening' },

    diagnostic: { icon: '🎯', color: 'red', ja: '診断テスト', en: 'Diagnostic' },

  };



  const PROGRESS_CATEGORIES = [

    'vocab',

    'grammar',

    'kanji',

    'reading',

    'listening',

    'diagnostic',

  ];



  const MODULE_SECTIONS = {

    vocab: [

      { mode: 'flashcard', ja: '単語帳', en: 'Flashcards', itemType: 'single' },

      { mode: 'practice', ja: '実戦問題', en: 'Practice', itemType: 'weeks', items: [1, 2, 3, 4, 5, 6] },

    ],

    grammar: [

      { mode: 'flashcard', ja: '文法カード', en: 'Grammar cards', itemType: 'single' },

      { mode: 'practice', ja: '実戦問題', en: 'Practice', itemType: 'weeks', items: [1, 2] },

    ],

    kanji: [

      { mode: 'drill_meaning', ja: '意味', en: 'Meaning', itemType: 'single' },

      { mode: 'drill_reading', ja: '読み方', en: 'Reading', itemType: 'single' },

      { mode: 'drill_kanji', ja: '漢字', en: 'Kanji', itemType: 'single' },

      { mode: 'exam', ja: '実戦問題', en: 'Exam', itemType: 'single' },

    ],

    reading: [

      { mode: 'practice', ja: '読解練習', en: 'Practice', itemType: 'weeks', items: [1, 2, 3, 4, 5, 6] },

      { mode: 'exam', ja: '実戦問題', en: 'Exam', itemType: 'weeks', items: [1, 2, 3, 4, 5, 6] },

    ],

    listening: [

      { mode: 'summary', ja: 'まとめ問題', en: 'Summary', itemType: 'chapters', items: [1, 2, 3, 4, 5] },

      { mode: 'drill', ja: '練習問題', en: 'Practice', itemType: 'chapters', items: [1, 2, 3, 4] },

      { mode: 'figure-summary', ja: '図版（まとめ）', en: 'Figures (Summary)', itemType: 'chapters', items: [1, 2, 3, 4, 5] },

      { mode: 'figure-drill', ja: '図版（練習）', en: 'Figures (Practice)', itemType: 'chapters', items: [1, 2, 3, 4] },

    ],

    diagnostic: [

      { mode: 'test', ja: '診断テスト', en: 'Diagnostic test', itemType: 'single', comingSoon: true },

    ],

  };



  const LISTENING_SECTIONS = MODULE_SECTIONS.listening;



  function todayKey(date = new Date()) {

    const y = date.getFullYear();

    const m = String(date.getMonth() + 1).padStart(2, '0');

    const d = String(date.getDate()).padStart(2, '0');

    return `${y}-${m}-${d}`;

  }



  function load() {

    try {

      const raw = localStorage.getItem(STORAGE_KEY);

      if (!raw) return { sessions: [], streak: { count: 0, lastDate: null } };

      const data = JSON.parse(raw);

      return {

        sessions: Array.isArray(data.sessions) ? data.sessions : [],

        streak: data.streak || { count: 0, lastDate: null },

      };

    } catch (err) {

      return { sessions: [], streak: { count: 0, lastDate: null } };

    }

  }



  function save(data) {

    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

    global.dispatchEvent(new CustomEvent('app:progresschange'));

  }



  function updateStreak(streak, dateKey) {

    if (!streak.lastDate) {

      return { count: 1, lastDate: dateKey };

    }

    if (streak.lastDate === dateKey) return streak;



    const last = new Date(`${streak.lastDate}T12:00:00`);

    const today = new Date(`${dateKey}T12:00:00`);

    const diffDays = Math.round((today - last) / 86400000);



    if (diffDays === 1) {

      return { count: streak.count + 1, lastDate: dateKey };

    }

    return { count: 1, lastDate: dateKey };

  }



  function recordSession({ module, mode = '', chapter = null, label = '', score = 0, total = 0 }) {

    if (!module || !total) return null;



    const data = load();

    const pct = Math.round((score / total) * 100);

    const session = {

      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,

      module,

      mode,

      chapter,

      label,

      score,

      total,

      pct,

      at: new Date().toISOString(),

    };



    data.sessions.unshift(session);

    data.sessions = data.sessions.slice(0, 200);

    data.streak = updateStreak(data.streak, todayKey());

    save(data);

    return session;

  }



  function getSessions(module) {

    const { sessions } = load();

    if (!module) return sessions;

    return sessions.filter((s) => s.module === module);

  }



  function matchesItem(session, item) {

    if (item == null) {

      return session.chapter == null || session.chapter === '';

    }

    return Number(session.chapter) === Number(item);

  }



  function buildProgressFromSessions(sessions) {

    if (!sessions.length) {

      return { pct: 0, attempts: 0, bestScore: null, bestTotal: null, done: false };

    }

    const best = sessions.reduce((a, b) => (a.pct >= b.pct ? a : b));

    return {

      pct: best.pct,

      attempts: sessions.length,

      bestScore: best.score,

      bestTotal: best.total,

      done: true,

    };

  }



  function getItemProgress(module, mode, item = null) {

    const sessions = getSessions(module).filter(

      (s) => s.mode === mode && matchesItem(s, item),

    );

    return buildProgressFromSessions(sessions);

  }



  function getChapterProgress(module, mode, chapter) {

    return getItemProgress(module, mode, chapter);

  }



  function getMastery(module) {

    const sessions = getSessions(module);

    if (!sessions.length) return 0;

    const recent = sessions.slice(0, 10);

    const sum = recent.reduce((acc, s) => acc + s.pct, 0);

    return Math.round(sum / recent.length);

  }



  function getOverallMastery() {

    const modules = PROGRESS_CATEGORIES.filter((m) => m !== 'diagnostic');

    const values = modules.map((m) => getMastery(m)).filter((v) => v > 0);

    if (!values.length) return 0;

    return Math.round(values.reduce((a, b) => a + b, 0) / values.length);

  }



  function getStreak() {

    return load().streak.count || 0;

  }



  function getRecentSessions(limit = 20) {

    return load().sessions.slice(0, limit);

  }



  function resetAll() {

    localStorage.removeItem(STORAGE_KEY);

    localStorage.removeItem('bb_vocab_practice_scores');

    global.dispatchEvent(new CustomEvent('app:progresschange'));

  }



  function getModuleMeta(module) {

    return MODULE_META[module] || { icon: '📝', color: 'accent', ja: module, en: module };

  }



  function getProgressCategories() {

    return PROGRESS_CATEGORIES.slice();

  }



  function getModuleSections(module) {

    return MODULE_SECTIONS[module] ? MODULE_SECTIONS[module].slice() : [];

  }



  function getListeningSections() {

    return getModuleSections('listening');

  }



  function getSectionRows(section) {

    if (section.comingSoon) return [];

    if (section.itemType === 'single') return [null];

    if (Array.isArray(section.items) && section.items.length) {
      if (section.itemType === 'weeks') return [null, ...section.items];
      return section.items.slice();
    }

    return [null];

  }



  function formatItemLabel(itemType, item, lang) {

    if (item == null) {

      return lang === 'en' ? 'Overall' : '全体';

    }

    if (itemType === 'weeks') {

      return lang === 'en' ? `Wk ${item}` : `第${item}週`;

    }

    return `CH${item}`;

  }



  function formatSessionTime(iso, lang) {

    const at = new Date(iso);

    const now = new Date();

    const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const startAt = new Date(at.getFullYear(), at.getMonth(), at.getDate());

    const dayDiff = Math.round((startToday - startAt) / 86400000);



    if (dayDiff === 0) {

      return lang === 'en'

        ? at.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })

        : at.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });

    }

    if (dayDiff === 1) return lang === 'en' ? 'Yesterday' : '昨日';

    if (lang === 'en') return at.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    return `${at.getMonth() + 1}/${at.getDate()}`;

  }



  global.AppProgress = {

    recordSession,

    getSessions,

    getItemProgress,

    getChapterProgress,

    getMastery,

    getOverallMastery,

    getStreak,

    getRecentSessions,

    resetAll,

    getModuleMeta,

    getProgressCategories,

    getModuleSections,

    getSectionRows,

    getListeningSections,

    formatItemLabel,

    formatSessionTime,

    MODULE_META,

    PROGRESS_CATEGORIES,

    MODULE_SECTIONS,

    LISTENING_SECTIONS,

  };

})(window);

