/* 知识总表：把每一类知识完整地摊开给孩子看 —— 数字表、字母表、加减乘除表、拼音表、汉字表 */
const Atlas = (() => {
  const NUM_ZH = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十',
    '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十'];

  const WORD_THEMES = {
    animal: { name: '动物朋友', icon: '🐱' },
    food: { name: '好吃的', icon: '🍎' },
    item: { name: '身边的东西', icon: '📖' },
    nature: { name: '大自然', icon: '🌳' },
    vehicle: { name: '车车与家', icon: '🚗' }
  };

  const HANZI_CATS = {
    num: { name: '数字汉字', icon: '🔢' },
    nature: { name: '大自然', icon: '🌿' },
    animal: { name: '小动物', icon: '🐰' },
    body: { name: '我的身体', icon: '✋' },
    life: { name: '生活用品', icon: '🚪' }
  };

  const SHEETS = {
    numbers: [
      { id: 'digit', name: '数字表', icon: '🔢' },
      { id: 'count', name: '数量对照', icon: '🍎' },
      { id: 'compare', name: '比大小', icon: '⚖️' }
    ],
    letters: [
      { id: 'abc', name: '字母表', icon: '🔤' },
      { id: 'examples', name: '例词表', icon: '🐻' }
    ],
    words: Object.keys(WORD_THEMES).map(k => ({ id: k, name: WORD_THEMES[k].name, icon: WORD_THEMES[k].icon })),
    math: [
      { id: 'add', name: '加法表', icon: '➕' },
      { id: 'sub', name: '减法表', icon: '➖' },
      { id: 'mul', name: '乘法表', icon: '✖️' },
      { id: 'div', name: '除法表', icon: '➗' }
    ],
    pinyin: [
      { id: 'initial', name: '声母表', icon: '🅱️' },
      { id: 'final', name: '韵母表', icon: '🅰️' },
      { id: 'syllable', name: '音节表', icon: '🧩' },
      { id: 'tone', name: '声调', icon: '🎶' }
    ],
    hanzi: Object.keys(HANZI_CATS).map(k => ({ id: k, name: HANZI_CATS[k].name, icon: HANZI_CATS[k].icon }))
  };

  let subject = 'numbers';
  let sheet = 'digit';
  let back = 'stages';

  const $ = sel => document.querySelector(sel);
  const say = parts => `data-say="${encodeURIComponent(JSON.stringify(parts))}"`;

  function cell(main, sub, parts, cls = '') {
    return `<button class="atlas-cell ${cls}" ${say(parts)}>
      <span class="ac-main">${Art.em(main)}</span>
      ${sub ? `<span class="ac-sub">${Art.em(sub)}</span>` : ''}
    </button>`;
  }

  /* ---------- 各知识表 ---------- */

  function digitSheet() {
    return `<p class="atlas-lead">从 0 数到 20，点一点数字就能听发音。</p>
      <div class="atlas-grid atlas-grid-num">${NUM_ZH.map((zh, n) =>
      cell(n, zh, [{ text: String(n), lang: 'zh-CN' }, { text: zh, lang: 'zh-CN' }])).join('')}</div>`;
  }

  function countSheet() {
    const emojis = ['🍎', '🐣', '⭐', '🎈', '🍓', '🐟', '🌸', '🦋', '🍊', '🐞'];
    return `<p class="atlas-lead">数字和数量手拉手：几个东西，就是几。</p>
      <div class="atlas-count-grid">${[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n =>
      `<button class="atlas-count-card" ${say([{ text: n + ' 个', lang: 'zh-CN' }])}>
        <b>${n}</b>
        <span>${Art.em(emojis[n - 1].repeat(n))}</span>
        <small>${NUM_ZH[n]}个</small>
      </button>`).join('')}</div>`;
  }

  function compareSheet() {
    const pairs = [[5, 3], [2, 7], [6, 6], [10, 4], [3, 8], [9, 9]];
    const symbol = (a, b) => a > b ? '>' : a < b ? '<' : '=';
    const word = (a, b) => a > b ? '大于' : a < b ? '小于' : '等于';
    return `<p class="atlas-lead">开口大的那边数字大，尖尖指向小的数字。</p>
      <div class="compare-symbols">
        <div class="compare-card"><b>3 &lt; 5</b><span>3 小于 5</span></div>
        <div class="compare-card"><b>7 &gt; 4</b><span>7 大于 4</span></div>
        <div class="compare-card"><b>6 = 6</b><span>6 等于 6</span></div>
      </div>
      <div class="atlas-grid atlas-grid-compare">${pairs.map(([a, b]) =>
      cell(`${a} ${symbol(a, b)} ${b}`, word(a, b),
        [{ text: `${a} ${word(a, b)} ${b}`, lang: 'zh-CN' }], 'wide')).join('')}</div>`;
  }

  function abcSheet() {
    return `<div class="atlas-song">
        <span>${Art.em('🎵')} 把 26 个字母连起来唱一遍</span>
        <button class="btn btn-yellow btn-sm" data-atlas-song>播放字母歌</button>
      </div>
      <div class="atlas-grid atlas-grid-letter">${DATA.letters.map(l =>
      cell(l.u, l.l + ' · ' + l.word,
        [{ text: l.u, lang: 'en-US' }, { text: l.word + '，' + l.zh, lang: 'zh-CN' }], 'letter')).join('')}</div>`;
  }

  function letterExamples() {
    return `<p class="atlas-lead">每个字母都带一个小单词，看图就能记住。</p>
      <div class="atlas-grid atlas-grid-word">${DATA.letters.map(l =>
      cell(l.emoji, `${l.u}${l.l} · ${l.word}<small>${l.zh}</small>`,
        [{ text: l.word, lang: 'en-US' }, { text: l.zh, lang: 'zh-CN' }], 'word')).join('')}</div>`;
  }

  function wordSheet(theme) {
    const list = DATA.words.filter(w => w.theme === theme);
    return `<p class="atlas-lead">${WORD_THEMES[theme].name}共 ${list.length} 个单词，点一点听发音。</p>
      <div class="atlas-grid atlas-grid-word">${list.map(w =>
      cell(w.emoji, `${w.en}<small>${w.zh}</small>`,
        [{ text: w.en, lang: 'en-US' }, { text: w.zh, lang: 'zh-CN' }], 'word')).join('')}</div>`;
  }

  function mathSheet(kind) {
    const max = kind === 'add' || kind === 'sub' ? 10 : 9;
    const head = ['+', ...Array.from({ length: max }, (_, i) => i + 1)];
    let html = `<div class="atlas-lead">${kind === 'add' ? '横着看：第一个数；竖着看：第二个数；交叉的地方就是答案。'
      : kind === 'sub' ? '被减数在左边，减数在右边，交叉处是还剩多少。'
        : kind === 'mul' ? '乘法口诀表，横竖交叉就是积。'
          : '除法表：横竖交叉就是商。'}</div>
      <div class="atlas-table-wrap"><div class="atlas-table">`;

    html += '<div class="math-row math-head"><span class="math-head-cell"></span>' +
      head.slice(1).map(n => `<span class="math-head-cell">${n}</span>`).join('') + '</div>';

    for (let a = 1; a <= max; a++) {
      html += `<div class="math-row"><span class="math-head-cell">${a}</span>`;
      for (let b = 1; b <= max; b++) {
        if (kind === 'sub' && b > a) {
          html += '<span class="math-cell blank"></span>';
          continue;
        }
        let big = 0;
        let small = '';
        let parts = [];
        if (kind === 'add') {
          big = a + b; small = `${a}+${b}`;
          parts = [{ text: `${a} 加 ${b} 等于 ${big}`, lang: 'zh-CN' }];
        } else if (kind === 'sub') {
          big = a - b; small = `${a}-${b}`;
          parts = [{ text: `${a} 减 ${b} 等于 ${big}`, lang: 'zh-CN' }];
        } else if (kind === 'mul') {
          big = a * b; small = `${a}×${b}`;
          parts = [{ text: `${a} 乘 ${b} 等于 ${big}`, lang: 'zh-CN' }];
        } else {
          big = a * b; small = `${big}÷${a}`;
          parts = [{ text: `${big} 除以 ${a} 等于 ${b}`, lang: 'zh-CN' }];
        }
        html += `<button class="math-cell" ${say(parts)}><b>${kind === 'div' ? b : big}</b><i>${small}</i></button>`;
      }
      html += '</div>';
    }
    return html + '</div></div>';
  }

  /* 声母、韵母本身没有汉字，用中文同音字来朗读，避免读成英文字母名 */
  function pySay(p, word) {
    const say = (DATA.pinyin.initialSay || {})[p] || (DATA.pinyin.finalSay || {})[p] || '';
    if (!say) return word;
    return word && word !== say ? `${say}，${word}` : say;
  }

  function pinyinInitial() {
    return `<p class="atlas-lead">23 个声母，每个都配一个熟悉的词。</p>
      <div class="atlas-grid atlas-grid-py">${DATA.pinyin.initials.map(p =>
      cell(p.p, `${p.emoji} ${p.word}`,
        [{ text: pySay(p.p, p.word), lang: 'zh-CN', audio: AudioFX.pyAudio.sheng(p.p) },
          { text: p.word, lang: 'zh-CN' }], 'py')).join('')}</div>`;
  }

  function pyFinalParts(p) {
    const seg = { text: pySay(p.p, p.word), lang: 'zh-CN' };
    if (DATA.pinyin.localFinals.indexOf(p.p) > -1) seg.audio = AudioFX.pyAudio.yun(p.p);
    return [seg, { text: p.word, lang: 'zh-CN' }];
  }

  function pinyinFinal() {
    const groups = [
      { kind: 'single', name: '单韵母', tip: '读音要圆润饱满' },
      { kind: 'compound', name: '复韵母', tip: '两个音滑到一起' },
      { kind: 'nasal', name: '鼻韵母', tip: '结尾带鼻音' }
    ];
    return groups.map(g => {
      const list = DATA.pinyin.finals.filter(p => p.kind === g.kind);
      return `<p class="atlas-lead">${g.name} ${list.length} 个：${g.tip}。</p>
        <div class="atlas-grid atlas-grid-py">${list.map(p =>
        cell(p.p, `${p.emoji} ${p.word}`, pyFinalParts(p), 'py big')).join('')}</div>`;
    }).join('');
  }

  function pinyinSyllable() {
    return `<p class="atlas-lead">声母和韵母手拉手，就能拼出一个字。</p>
      <div class="atlas-grid atlas-grid-py">${DATA.pinyin.syllables.map(s => {
      const seg = { text: s.c, lang: 'zh-CN' };
      if (s.local !== false) seg.audio = AudioFX.pyAudio.yinjie(s.p);
      return cell(s.p, `${s.emoji} ${s.c}`, [seg], 'py');
    }).join('')}</div>`;
  }

  function pinyinTone() {
    const tones = [
      { m: 'ā', n: '一声', d: '又平又长', e: '🐷', t: 1 },
      { m: 'á', n: '二声', d: '往上扬', e: '🐦', t: 2 },
      { m: 'ǎ', n: '三声', d: '先降再拐弯', e: '🐸', t: 3 },
      { m: 'à', n: '四声', d: '干脆往下落', e: '🥁', t: 4 }
    ];
    return `<p class="atlas-lead">同一个 a，声调不同，就是四个不同的音。</p>
      <div class="tone-grid">${tones.map(t =>
      `<button class="tone-card" ${say([{ text: t.n + '，' + t.d, lang: 'zh-CN' },
        { text: t.m, lang: 'zh-CN', audio: AudioFX.pyAudio.tone(t.t) }])}>
        <b>${t.m}</b>
        <span>${t.n}</span>
        <small>${Art.em(t.e)} ${t.d}</small>
      </button>`).join('')}</div>
      <p class="atlas-note">小口诀：一声平、二声扬、三声拐弯、四声降。</p>`;
  }

  function hanziSheet(cat) {
    const list = DATA.hanzi.filter(h => h.cat === cat);
    return `<p class="atlas-lead">${HANZI_CATS[cat].name}共 ${list.length} 个字，先看图，再读字。</p>
      <div class="atlas-grid atlas-grid-hz">${list.map(h =>
      cell(h.c, `${h.emoji} ${h.p}<small>${h.word}</small>`,
        [{ text: h.c, lang: 'zh-CN' }, { text: h.word, lang: 'zh-CN' }], 'hz')).join('')}</div>`;
  }

  function bodyFor() {
    if (subject === 'numbers') {
      return sheet === 'count' ? countSheet() : sheet === 'compare' ? compareSheet() : digitSheet();
    }
    if (subject === 'letters') return sheet === 'examples' ? letterExamples() : abcSheet();
    if (subject === 'words') return wordSheet(sheet);
    if (subject === 'math') return mathSheet(sheet);
    if (subject === 'pinyin') {
      if (sheet === 'final') return pinyinFinal();
      if (sheet === 'syllable') return pinyinSyllable();
      if (sheet === 'tone') return pinyinTone();
      return pinyinInitial();
    }
    return hanziSheet(sheet);
  }

  /* ---------- 渲染与交互 ---------- */

  function render() {
    const c = DATA.curriculum[subject];
    if (!c) return;
    const list = SHEETS[subject] || SHEETS.numbers;
    if (!list.some(s => s.id === sheet)) sheet = list[0].id;

    $('#atlas-title').textContent = c.name + ' · 知识总表';
    $('#atlas-count').textContent = c.tag;
    $('#atlas-tabs').innerHTML = list.map(t =>
      `<button class="atlas-tab ${t.id === sheet ? 'active' : ''}" data-atlas-sheet="${t.id}">${Art.em(t.icon)} ${t.name}</button>`).join('');
    $('#atlas-body').innerHTML = bodyFor();
  }

  function open(subjectKey, from) {
    subject = DATA.curriculum[subjectKey] ? subjectKey : 'numbers';
    back = from || 'stages';
    sheet = (SHEETS[subject] || SHEETS.numbers)[0].id;
    render();
    App.trackAtlas(subject);
    App.show('atlas');
  }

  function speakPayload(raw) {
    let parts;
    try { parts = JSON.parse(decodeURIComponent(raw)); } catch (e) { return; }
    if (Array.isArray(parts)) AudioFX.speakSegments(parts);
  }

  function sing() {
    const segs = DATA.letters.map(l => ({ text: l.u, lang: 'en-US' }));
    AudioFX.speakSegments(segs);
    App.toast('跟着字母歌一起唱吧～', 1800);
  }

  document.addEventListener('click', e => {
    const tab = e.target.closest('[data-atlas-sheet]');
    if (tab) {
      sheet = tab.dataset.atlasSheet;
      AudioFX.click();
      render();
      return;
    }
    const song = e.target.closest('[data-atlas-song]');
    if (song) { sing(); return; }
    if (e.target.closest('#btn-atlas-back')) {
      AudioFX.click();
      App.show(back);
      return;
    }
    const cellEl = e.target.closest('[data-say]');
    if (cellEl) {
      AudioFX.pop();
      cellEl.classList.add('tap');
      setTimeout(() => cellEl.classList.remove('tap'), 420);
      speakPayload(cellEl.dataset.say);
    }
  });

  return { open, render };
})();
