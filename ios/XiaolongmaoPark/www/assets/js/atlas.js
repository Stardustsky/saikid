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
    nature2: { name: '自然二', icon: '🌊' },
    animal: { name: '小动物', icon: '🐰' },
    body: { name: '我的身体', icon: '✋' },
    life: { name: '生活用品', icon: '🚪' },
    food: { name: '好吃的', icon: '🍚' },
    color: { name: '颜色', icon: '🌈' },
    family: { name: '家人', icon: '👨‍👩‍👧' },
    school: { name: '在学校', icon: '📚' },
    place: { name: '在哪里', icon: '🏙️' },
    time: { name: '时间汉字', icon: '⏰' },
    action: { name: '动作', icon: '🏃' }
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
    hanzi: Object.keys(HANZI_CATS).map(k => ({ id: k, name: HANZI_CATS[k].name, icon: HANZI_CATS[k].icon })),
    geometry: [
      { id: 'shape', name: '图形表', icon: '🔺' },
      { id: 'space', name: '方位表', icon: '🧭' }
    ],
    lifemath: [
      { id: 'measure', name: '比一比', icon: '📏' },
      { id: 'time', name: '整点表', icon: '🕐' },
      { id: 'money', name: '钱币表', icon: '🪙' }
    ],
    expression: [
      { id: 'sentence', name: '看图说话', icon: '💬' },
      { id: 'rhyme', name: '儿歌童谣', icon: '🎵' },
      { id: 'stroke', name: '笔顺表', icon: '✍️' }
    ],
    animals: [
      { id: 'all', name: '动物大全', icon: '🦁' },
      { id: 'home', name: '动物的家', icon: '🏠' },
      { id: 'food', name: '动物吃什么', icon: '🍖' }
    ],
    plants: [
      { id: 'all', name: '植物大全', icon: '🌳' },
      { id: 'part', name: '吃哪一部分', icon: '🥕' },
      { id: 'grow', name: '生长过程', icon: '🌱' }
    ],
    weather: [
      { id: 'weather', name: '天气表', icon: '☀️' },
      { id: 'season', name: '四季表', icon: '🍂' }
    ],
    space: [
      { id: 'sky', name: '白天和黑夜', icon: '🌙' },
      { id: 'space', name: '太阳和月亮', icon: '☀️' },
      { id: 'earth', name: '保护地球', icon: '♻️' }
    ],
    body: [
      { id: 'part', name: '身体部位', icon: '👁️' },
      { id: 'sense', name: '五官本领', icon: '👂' },
      { id: 'habit', name: '好习惯', icon: '🪥' }
    ]
  };

  let subject = 'numbers';
  let sheet = 'digit';
  let back = 'stages';

  const $ = sel => document.querySelector(sel);
  const $$ = sel => [...document.querySelectorAll(sel)];
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

  /* ---------- 图形空间 ---------- */

  function shapeSheet() {
    return `<p class="atlas-lead">10 个常见图形，点一点听名字。</p>
      <div class="atlas-grid atlas-grid-word">${DATA.shapes.map(s =>
      `<button class="atlas-cell word" ${say([{ text: s.zh, lang: 'zh-CN' }, { text: s.en, lang: 'en-US' }])}>
        <span class="ac-main">${Quiz.shapeSvg(s.id)}</span>
        <span class="ac-sub">${s.zh}<small>${s.en}</small></span>
      </button>`).join('')}</div>`;
  }

  const DIRECTIONS = [
    { zh: '上面', arrow: '⬆️' },
    { zh: '下面', arrow: '⬇️' },
    { zh: '左边', arrow: '⬅️' },
    { zh: '右边', arrow: '➡️' },
    { zh: '左上角', arrow: '↖️' },
    { zh: '右上角', arrow: '↗️' },
    { zh: '左下角', arrow: '↙️' },
    { zh: '右下角', arrow: '↘️' }
  ];

  function spaceSheet() {
    return `<p class="atlas-lead">星星在小猫的哪一边？八个方位点一点听。</p>
      <div class="atlas-grid atlas-grid-word">${DIRECTIONS.map(d =>
      cell(d.arrow, d.zh, [{ text: '小猫的' + d.zh, lang: 'zh-CN' }], 'word')).join('')}</div>`;
  }

  /* ---------- 生活数学 ---------- */

  function measureSheet() {
    const pairs = [
      { zh: '长短', a: '🐍', an: '蛇', b: '🐛', bn: '毛毛虫', word: '长', tip: '一头对齐，多出来的更长' },
      { zh: '高矮', a: '🦒', an: '长颈鹿', b: '🐢', bn: '乌龟', word: '高', tip: '站在一起比一比就知道' },
      { zh: '轻重', a: '🐘', an: '大象', b: '🪶', bn: '羽毛', word: '重', tip: '掂一掂，重的那边会往下沉' }
    ];
    return `<p class="atlas-lead">长短、高矮、轻重，比一比就知道。</p>
      <div class="compare-symbols">${pairs.map(p =>
      `<div class="compare-card"><b>${Art.em(p.a)} ${Art.em(p.b)}</b><span>${p.an}比${p.bn}${p.word}</span></div>`).join('')}</div>
      <div class="atlas-grid atlas-grid-compare">${pairs.map(p =>
      cell(`${p.a} ${p.b}`, `${p.an} · ${p.bn}<small>${p.tip}</small>`,
        [{ text: p.zh + '：' + p.an + '和' + p.bn, lang: 'zh-CN' }], 'wide')).join('')}</div>`;
  }

  function timeSheet() {
    const hours = Array.from({ length: 12 }, (_, i) => i + 1);
    return `<p class="atlas-lead">短针指着几，就是几点整。点一点钟表听时间。</p>
      <div class="atlas-grid atlas-grid-word">${hours.map(h =>
      `<button class="atlas-cell word" ${say([{ text: h + ' 点整', lang: 'zh-CN' }])}>
        <span class="ac-main">${Quiz.clockSvg(h, 0)}</span>
        <span class="ac-sub">${h} 点<small>${h}:00</small></span>
      </button>`).join('')}</div>`;
  }

  function moneySheet() {
    const coins = ['1 角', '2 角', '5 角', '1 元'];
    const examples = [
      { zh: '1 元 = 10 角', say: '一元等于十角' },
      { zh: '5 角 + 5 角 = 1 元', say: '五角加五角等于一元' },
      { zh: '1 元 + 5 角 = 1 元 5 角', say: '一元加五角等于一元五角' },
      { zh: '2 角 + 5 角 = 7 角', say: '两角加五角等于七角' }
    ];
    return `<p class="atlas-lead">买东西要用钱，1 元等于 10 角。</p>
      <div class="atlas-grid atlas-grid-num">${coins.map(c =>
      `<button class="atlas-cell" ${say([{ text: c, lang: 'zh-CN' }])}>
        <span class="ac-main">${Art.em('🪙')}</span><span class="ac-sub">${c}</span>
      </button>`).join('')}</div>
      <div class="atlas-grid atlas-grid-compare" style="margin-top:10px">${examples.map(e =>
      cell(e.zh, '', [{ text: e.say, lang: 'zh-CN' }], 'wide')).join('')}</div>`;
  }

  /* ---------- 表达工坊 ---------- */

  function sentenceSheet() {
    return `<p class="atlas-lead">看图说一句话，先说谁，再说他在做什么。</p>
      <div class="atlas-grid atlas-grid-word">${DATA.sentences.map(s =>
      cell(s.emoji, `${s.zh}<small>${s.en}</small>`,
        [{ text: s.zh, lang: 'zh-CN' }, { text: s.en, lang: 'en-US' }], 'word')).join('')}</div>`;
  }

  function rhymeSheet() {
    return `<p class="atlas-lead">跟着儿歌有节奏地念，越念越顺口。</p>
      <div class="atlas-grid atlas-grid-compare">${DATA.rhymes.map(r =>
      cell('🎵', `${r.name}<small>${r.lines[0]}</small>`,
        [{ text: r.lines.join(''), lang: r.lang === 'en' ? 'en-US' : 'zh-CN' }], 'wide')).join('')}</div>`;
  }

  function strokeSheet() {
    return `<p class="atlas-lead">写字有顺序，点一点听每个字的笔画怎么排。</p>
      <div class="atlas-grid atlas-grid-hz">${DATA.strokes.map(s => {
      const order = s.st && s.st.length ? s.st : [s.first];
      return cell(s.c, `${s.p}<small>${order.join('')}</small>`,
        [{ text: s.c, lang: 'zh-CN' }, { text: '笔顺是' + order.join('、'), lang: 'zh-CN' }], 'hz');
    }).join('')}</div>`;
  }

  /* ---------- 动物世界 ---------- */

  function animalSheet() {
    return `<p class="atlas-lead">动物小百科共 ${DATA.sciAnimals.length} 种，点一点听名字。</p>
      <div class="atlas-grid atlas-grid-word">${DATA.sciAnimals.map(a => {
      const kind = (DATA.sciKinds[a.kind] || {}).zh || '动物';
      return cell(a.emoji, `${a.zh}<small>${kind}</small>`,
        [{ text: a.zh + '，' + kind, lang: 'zh-CN' }], 'word');
    }).join('')}</div>`;
  }

  function animalHomeSheet() {
    return Object.keys(DATA.sciHomes).map(h => {
      const meta = DATA.sciHomes[h];
      const list = DATA.sciAnimals.filter(a => a.home === h);
      if (!list.length) return '';
      return `<p class="atlas-lead">${Art.em(meta.emoji)} ${meta.zh}里的动物（${list.length} 种）</p>
        <div class="atlas-grid atlas-grid-word">${list.map(a =>
        cell(a.emoji, a.zh, [{ text: a.zh + '住在' + meta.zh, lang: 'zh-CN' }], 'word')).join('')}</div>`;
    }).join('');
  }

  function animalFoodSheet() {
    return Object.keys(DATA.sciFoods).map(f => {
      const meta = DATA.sciFoods[f];
      const list = DATA.sciAnimals.filter(a => a.food === f);
      if (!list.length) return '';
      return `<p class="atlas-lead">${Art.em(meta.emoji)} 爱吃${meta.zh}的动物（${list.length} 种）</p>
        <div class="atlas-grid atlas-grid-word">${list.map(a =>
        cell(a.emoji, a.zh, [{ text: a.zh + '爱吃' + meta.zh, lang: 'zh-CN' }], 'word')).join('')}</div>`;
    }).join('');
  }

  /* ---------- 植物花园 ---------- */

  function plantSheet() {
    return `<p class="atlas-lead">植物小百科共 ${DATA.sciPlants.length} 种，点一点听名字。</p>
      <div class="atlas-grid atlas-grid-word">${DATA.sciPlants.map(p =>
      cell(p.emoji, p.zh, [{ text: p.zh, lang: 'zh-CN' }], 'word')).join('')}</div>`;
  }

  function plantPartSheet() {
    return `<p class="atlas-lead">我们吃的蔬菜水果，是植物的哪一部分呢？</p>
      ${DATA.sciPlantParts.map(part => {
      const list = DATA.sciPlantFoods.filter(f => f.part === part);
      if (!list.length) return '';
      return `<p class="atlas-lead">吃${part}的（${list.length} 种）</p>
          <div class="atlas-grid atlas-grid-word">${list.map(f =>
        cell(f.emoji, f.zh, [{ text: f.zh + '，吃' + part, lang: 'zh-CN' }], 'word')).join('')}</div>`;
    }).join('')}`;
  }

  function growthSheet(kind) {
    const list = DATA.sciGrowth.filter(g => g.kind === kind);
    return `<p class="atlas-lead">${kind === 'plant' ? '植物的生长过程' : '动物的生长过程'}：从第一步慢慢长大。</p>
      <div class="atlas-grid atlas-grid-compare">${list.map(g => {
      const steps = g.steps.map(s => s.zh).join(' → ');
      const emojis = g.steps.map(s => s.emoji).join(' ');
      return cell(emojis, `${g.zh}<small>${steps}</small>`,
        [{ text: g.zh + '的生长过程：' + steps, lang: 'zh-CN' }], 'wide');
    }).join('')}</div>`;
  }

  /* ---------- 天气季节 ---------- */

  function weatherSheet() {
    return `<p class="atlas-lead">认识不同的天气，出门前看看要带什么。</p>
      <div class="atlas-grid atlas-grid-word">${DATA.sciWeather.map(w =>
      cell(w.emoji, `${w.zh}${w.need ? '<small>要带' + w.need.zh + '</small>' : ''}`,
        [{ text: w.zh + (w.need ? '，要带' + w.need.zh : ''), lang: 'zh-CN' }], 'word')).join('')}</div>`;
  }

  function seasonSheet() {
    return `<p class="atlas-lead">一年有春、夏、秋、冬，穿的衣服和做的事都不一样。</p>
      <div class="atlas-grid atlas-grid-compare">${DATA.sciSeasons.map(s =>
      cell(`${s.emoji} ${s.wearEmoji}`, `${s.zh}<small>${s.sight}</small>`,
        [{ text: s.zh + '，' + s.sight + '，穿' + s.wear + '，可以' + s.activity.zh, lang: 'zh-CN' }], 'wide')).join('')}</div>`;
  }

  /* ---------- 地球太空 ---------- */

  function spaceFactSheet(topic) {
    const names = { sky: '白天和黑夜', space: '太阳和月亮', earth: '保护地球' };
    const list = DATA.sciSpaceFacts.filter(f => f.topic === topic);
    return `<p class="atlas-lead">${names[topic] || '天空小知识'}：点一点听问题和答案。</p>
      <div class="atlas-grid atlas-grid-compare">${list.map(f => {
      const ans = typeof f.a === 'string' ? f.a : f.a.zh;
      return cell('💡', `${f.q}<small>${ans}</small>`,
        [{ text: f.q, lang: 'zh-CN' }, { text: ans, lang: 'zh-CN' }], 'wide');
    }).join('')}</div>`;
  }

  /* ---------- 身体奥秘 ---------- */

  function bodyPartSheet() {
    return `<p class="atlas-lead">身体部位共 ${DATA.sciBodyParts.length} 个，点一点听名字。</p>
      <div class="atlas-grid atlas-grid-word">${DATA.sciBodyParts.map(b =>
      cell(b.emoji, b.zh, [{ text: b.zh, lang: 'zh-CN' }], 'word')).join('')}</div>`;
  }

  function senseSheet() {
    return `<p class="atlas-lead">眼睛看、耳朵听、鼻子闻、舌头尝，身体本领真不少。</p>
      <div class="atlas-grid atlas-grid-compare">${DATA.sciSenseFacts.map(f =>
      cell('💡', `${f.q}<small>${f.a}</small>`,
        [{ text: f.q, lang: 'zh-CN' }, { text: f.a, lang: 'zh-CN' }], 'wide')).join('')}</div>`;
  }

  function habitSheet() {
    const groups = [
      { good: true, name: '好习惯', icon: '👍' },
      { good: false, name: '要改正', icon: '🙅' }
    ];
    return groups.map(g => {
      const list = DATA.sciHabits.filter(h => !!h.good === g.good);
      return `<p class="atlas-lead">${g.icon} ${g.name}（${list.length} 个）</p>
        <div class="atlas-grid atlas-grid-word">${list.map(h =>
        cell(h.emoji, h.zh, [{ text: h.zh, lang: 'zh-CN' }], 'word')).join('')}</div>`;
    }).join('');
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
    if (subject === 'geometry') return sheet === 'space' ? spaceSheet() : shapeSheet();
    if (subject === 'lifemath') {
      if (sheet === 'time') return timeSheet();
      if (sheet === 'money') return moneySheet();
      return measureSheet();
    }
    if (subject === 'expression') {
      if (sheet === 'rhyme') return rhymeSheet();
      if (sheet === 'stroke') return strokeSheet();
      return sentenceSheet();
    }
    if (subject === 'animals') {
      if (sheet === 'home') return animalHomeSheet();
      if (sheet === 'food') return animalFoodSheet();
      return animalSheet();
    }
    if (subject === 'plants') {
      if (sheet === 'part') return plantPartSheet();
      if (sheet === 'grow') return growthSheet('plant');
      return plantSheet();
    }
    if (subject === 'weather') return sheet === 'season' ? seasonSheet() : weatherSheet();
    if (subject === 'space') return spaceFactSheet(sheet);
    if (subject === 'body') {
      if (sheet === 'sense') return senseSheet();
      if (sheet === 'habit') return habitSheet();
      return bodyPartSheet();
    }
    return hanziSheet(sheet);
  }

  /* ---------- 渲染与交互 ---------- */

  /* 图鉴收集进度：本学科已经练过多少种知识点 */
  function collectBar() {
    const p = App.knowledgeProgress ? App.knowledgeProgress(subject) : null;
    if (!p || !p.total) return '';
    const pct = Math.round(p.got / p.total * 100);
    return `<div class="atlas-collect">
      <span class="atlas-collect-main">${Art.em('🗂️')} 本学科知识点 <b>${p.got}</b> / ${p.total}</span>
      <span class="atlas-collect-bar"><i style="width:${pct}%"></i></span>
    </div>`;
  }

  function render() {
    // 切换知识表 / 重新进入总表时，先收掉正在唱的字母歌
    if (songStop) { songStop(); endSong(); }
    const c = DATA.curriculum[subject];
    if (!c) return;
    const list = SHEETS[subject] || SHEETS.numbers;
    if (!list.some(s => s.id === sheet)) sheet = list[0].id;

    $('#atlas-title').textContent = c.name + ' · 知识总表';
    $('#atlas-count').textContent = c.tag;
    $('#atlas-tabs').innerHTML = list.map(t =>
      `<button class="atlas-tab ${t.id === sheet ? 'active' : ''}" data-atlas-sheet="${t.id}">${Art.em(t.icon)} ${t.name}</button>`).join('');
    $('#atlas-body').innerHTML = collectBar() + bodyFor();
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

  // 字母歌：走 WebAudio 的《小星星》旋律，唱到哪个字母就高亮哪个格子
  let songStop = null;
  let singingCell = null;

  function endSong() {
    if (singingCell) singingCell.classList.remove('singing');
    singingCell = null;
    songStop = null;
  }

  function sing() {
    if (songStop) {
      songStop();
      endSong();
      App.toast('字母歌先停一下～', 1200);
      return;
    }
    AudioFX.stopSpeak();
    const cells = {};
    $$('.atlas-grid-letter .atlas-cell').forEach((el, i) => {
      if (DATA.letters[i]) cells[DATA.letters[i].u] = el;
    });
    songStop = AudioFX.abcSong({
      onLetter(letter) {
        if (singingCell) singingCell.classList.remove('singing');
        singingCell = cells[letter] || null;
        if (singingCell) singingCell.classList.add('singing');
      },
      onDone: endSong
    });
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
      // 点字母听发音时先把字母歌停下，避免两个声音叠在一起
      if (songStop) { songStop(); endSong(); }
      AudioFX.pop();
      cellEl.classList.add('tap');
      setTimeout(() => cellEl.classList.remove('tap'), 420);
      speakPayload(cellEl.dataset.say);
    }
  });

  return { open, render };
})();
