/**
 * N3 App — 共通 UI 翻訳（ja / en）
 */
(function (global) {
  const COMMON_I18N = {
    ja: {
      back: '← 戻る',
      navHome: 'ホーム',
      navStudy: '学習',
      navHistory: '履歴',
      navSettings: '設定',
      loading: '読み込み中...',
      loadError: 'データを読み込めませんでした。再試行してください。',
      retry: '再試行',
      correct: '✓ 正解！',
      incorrect: '✗ 不正解',
      correctAnswer: '正解',
      next: '次へ',
      nextQuestion: '次の問題 →',
      resultTitle: '結果',
      resultRetry: 'もう一度挑戦',
      noQuestions: '問題がありません。',
      tabFlashcard: '単語帳',
      tabPractice: '実戦問題',
      filterAll: 'すべて',
      filterNew: '未学習',
      filterReview: '復習',
      flipHint: 'タップしてめくる ↓',
      prev: '← 前へ',
      nextBtn: '次へ →',
      vocabLabel: '語彙',
      items: '項目',
    },
    en: {
      back: '← Back',
      navHome: 'Home',
      navStudy: 'Study',
      navHistory: 'History',
      navSettings: 'Settings',
      loading: 'Loading...',
      loadError: 'Could not load data. Please retry.',
      retry: 'Retry',
      correct: '✓ Correct!',
      incorrect: '✗ Incorrect',
      correctAnswer: 'Answer',
      next: 'Next',
      nextQuestion: 'Next →',
      resultTitle: 'Results',
      resultRetry: 'Try again',
      noQuestions: 'No questions available.',
      tabFlashcard: 'Flashcards',
      tabPractice: 'Practice',
      filterAll: 'All',
      filterNew: 'New',
      filterReview: 'Review',
      flipHint: 'Tap to flip ↓',
      prev: '← Prev',
      nextBtn: 'Next →',
      vocabLabel: 'Vocabulary',
      items: 'items',
    },
  };

  function mergeI18n(pageDict) {
    const langs = ['ja', 'en'];
    const merged = {};
    langs.forEach((lang) => {
      merged[lang] = Object.assign({}, COMMON_I18N[lang], pageDict[lang] || {});
    });
    return merged;
  }

  function applyI18n(dict, root) {
    const scope = root || document;
    scope.querySelectorAll('[data-i18n]').forEach((el) => {
      el.textContent = global.AppLang.t(dict, el.dataset.i18n);
    });
  }

  global.AppI18n = { COMMON_I18N, mergeI18n, applyI18n };
})(window);
