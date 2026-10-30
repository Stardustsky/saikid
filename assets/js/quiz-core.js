/* 公共题库：阶段练习与小游戏共用同一套出题逻辑，避免两处规则不一致 */
const Quiz = (() => {
  const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];
  const shuffle = arr => {
    const r = arr.slice();
    for (let i = r.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [r[i], r[j]] = [r[j], r[i]];
    }
    return r;
  };
  const normOpt = x => (x && typeof x === 'object' ? Object.assign({}, x) : { label: String(x) });
  const pic = s => Art.em(s);
  const makeOptions = (correct, wrongs) => shuffle([
    Object.assign(normOpt(correct), { correct: true }),
    ...wrongs.map(w => Object.assign(normOpt(w), { correct: false }))
  ]);

  function say(holder) {
    if (!holder) return;
    if (Array.isArray(holder)) AudioFX.speakSegments(holder);
    else AudioFX.speak(holder.text, holder.lang, holder.audio);
  }

  /* 同一个题干准备几种说法，避免每次都是同一句话 */
  const TITLES = {
    count: ['数一数，一共有几个呀？', '一共有多少个呢？', '用小手指着，数数看'],
    next: ['接下来是哪个数字呢？', '后面跟着的数字是几？', '按顺序往下数，该谁了？'],
    compare: ['哪个数字更大？', '比一比，谁更大一些？'],
    pattern: ['找规律，接下来是几？', '发现小秘密了吗？下一个是几？'],
    letterListen: ['听一听，是哪个字母？', '耳朵竖起来，是哪个字母？'],
    wordPic: ['这个用英语怎么说？', '看看图片，英语叫什么？'],
    wordListen: ['听一听，是哪个？', '听到的单词是哪一个？'],
    wordMeaning: ['这个单词是什么意思？', '这个单词说的是什么？'],
    math: ['算一算，等于几？', '这道题等于多少呢？', '用圆点帮帮忙，算一算'],
    pyInitial: ['听一听，它的声母是哪个？', '这个词开头的声母是什么？'],
    pyFinal: ['听一听，它的韵母是哪个？', '这个词的韵母是什么？'],
    pySyllable: ['拼一拼，读出来是哪个字？', '把声母韵母拼起来，是哪个字？'],
    pyTone: ['这个音是第几声？', '听一听，它是第几声？'],
    hzPic: ['这是什么字？', '认一认，这个字念什么？'],
    hzMeaning: ['这个字是什么东西？', '这个字表示什么？'],
    hzListen: ['听一听，是哪个字？', '听到的是哪个汉字？'],
    phonics: ['听一听，开头是哪个字母？', '这个单词的第一个字母是什么？'],
    sentence: ['看图，哪句话是对的？', '哪一句话说的是这张图？'],
    rhyme: ['儿歌下一句是什么？', '接着唱，下一句是？'],
    reader: ['读一读，这句话是什么意思？', '这句英语说的是什么？'],
    story: ['读一读，算一算', '这道小故事里，答案是多少？'],
    stroke: ['这个字的第一笔是什么？', '写这个字，先写哪一笔？'],
    shape: ['这是什么图形？', '认一认，它是什么形状？'],
    space: ['它在哪一边呢？', '看一看，它在哪个方向？'],
    sort: ['哪一个和其他不一样？', '仔细看，谁不是一伙的？'],
    measure: ['比一比，哪个更长？', '哪一个最大呢？'],
    time: ['现在是几点？', '看看钟表，几点了？'],
    money: ['一共是多少钱？', '算一算，一共几元几角？'],
    sciPic: ['看图认一认，这是什么？', '这是谁呀？', '看一看，你认识它吗？'],
    sciName: ['「这是什么」的图片是哪一张？', '哪张图是它呢？'],
    sciRiddle: ['猜一猜，它是谁？', '听听它的小秘密，猜猜是谁？'],
    sciHome: ['它住在哪里呢？', '它的家在哪里？'],
    sciFood: ['它爱吃什么？', '猜猜它吃什么？'],
    sciBaby: ['它的宝宝叫什么？', '动物宝宝叫什么名字？'],
    sciClass: ['哪一个不是一伙的？', '谁和它们不是一类？'],
    sciPlantPart: ['我们吃的是它的哪一部分？', '这是植物的哪个部分？'],
    sciFact: ['想一想，应该选哪个？', '你知道答案吗？'],
    sciGrowth: ['接下来会变成什么样？', '按生长顺序，下一步是？'],
    sciWeather: ['这是什么天气？', '看看天气怎么样？'],
    sciGear: ['这种天气出门要带什么？', '这样的天气要用到什么？'],
    sciSeason: ['这是哪个季节？', '猜猜现在是什么季节？'],
    sciSpace: ['想一想，选一选', '动动小脑筋，答案是哪个？'],
    sciBodyPart: ['这是我们身体的哪里？', '认一认，这是哪个部位？'],
    sciSense: ['我们用身体的哪里来做这件事？', '想一想，用哪个部位？'],
    sciHabit: ['哪个是好习惯？', '这样做对不对呢？']
  };
  const tv = (type, base) => pick(TITLES[type] || [base]);

  // 知识点短名：家长中心掌握度里显示，比整句问法更适合当标签
  const TYPE_NAMES = {
    count: '数数',
    quantity: '数量配对',
    next: '数字顺序',
    compare: '比大小',
    pattern: '找规律',
    letterListen: '认字母',
    letterCase: '大小写',
    letterOrder: '字母顺序',
    wordPic: '看图说词',
    wordListen: '听词选图',
    wordMeaning: '词义',
    math: '算术',
    add: '加法',
    sub: '减法',
    mul: '乘法',
    div: '除法',
    pyInitial: '声母',
    pyFinal: '韵母',
    pySyllable: '拼读',
    pyTone: '声调',
    pyChar: '拼音认字',
    hzPic: '认字',
    hzMeaning: '字义',
    hzListen: '听字选字',
    phonics: '首字母',
    sentence: '看图说话',
    rhyme: '儿歌',
    reader: '读本理解',
    story: '应用题',
    stroke: '笔顺',
    shape: '认图形',
    space: '方位',
    sort: '分类',
    measure: '比较',
    time: '认钟表',
    money: '认钱币',
    sciPic: '认自然',
    sciName: '找图片',
    sciRiddle: '猜一猜',
    sciHome: '动物住所',
    sciFood: '动物食物',
    sciBaby: '动物宝宝',
    sciClass: '科学分类',
    sciPlantPart: '植物部位',
    sciFact: '自然常识',
    sciGrowth: '生长过程',
    sciWeather: '认天气',
    sciGear: '天气用品',
    sciSeason: '认季节',
    sciSpace: '太空常识',
    sciBodyPart: '身体部位',
    sciSense: '五感',
    sciHabit: '生活习惯'
  };

  function findStage(subjectKey, stageId) {
    const c = DATA.curriculum[subjectKey];
    if (!c) return null;
    const st = c.stages.find(s => s.id === stageId);
    return st ? Object.assign({ subject: subjectKey }, st) : null;
  }

  /* ---------- 取题池 ---------- */

  function poolWords(st) {
    return st.theme && st.theme !== 'all'
      ? DATA.words.filter(w => w.theme === st.theme)
      : DATA.words.slice();
  }

  function poolHanzi(st) {
    return st.cat && st.cat !== 'all'
      ? DATA.hanzi.filter(h => h.cat === st.cat)
      : DATA.hanzi.slice();
  }

  function poolLetters(st) {
    const r = st.range || [0, DATA.letters.length - 1];
    return DATA.letters.slice(r[0], r[1] + 1);
  }

  function uniqueLabels(list, key, exclude) {
    const seen = new Set(exclude ? [exclude] : []);
    return list.filter(x => {
      if (seen.has(x[key])) return false;
      seen.add(x[key]);
      return true;
    });
  }

  /* 围绕正确答案取干扰项，数字范围随题目上限放大（支持 20 以内） */
  function nearbyWrongs(answer, count, min, max) {
    const out = [];
    const lo = Math.max(min, answer - 4);
    const hi = Math.min(max, answer + 4);
    for (let c = lo; c <= hi && out.length < count * 3; c++) {
      if (c !== answer) out.push(c);
    }
    if (out.length < count) {
      for (let c = min; c <= max && out.length < count * 3; c++) {
        if (c !== answer && out.indexOf(c) === -1) out.push(c);
      }
    }
    return shuffle(out).slice(0, count);
  }

  /* ---------- 数字乐园 ---------- */

  function qCount(st) {
    const max = st.max || 10;
    const min = st.min || 1;
    const n = rnd(min, max);
    const emoji = pick(DATA.countEmojis);
    const wrong = nearbyWrongs(n, 3, 1, Math.max(12, Math.min(20, max + 4)));
    const items = Array.from({ length: n }, (_, i) =>
      `<span style="animation-delay:${i * 70}ms">${pic(emoji)}</span>`).join('');
    return {
      key: 'n-count-' + n + emoji,
      title: tv('count', '数一数，一共有几个呀？'),
      visual: `<div class="count-grid">${items}</div>`,
      speak: { text: '数一数，一共有几个呀？', lang: 'zh-CN' },
      speakAnswer: { text: String(n), lang: 'zh-CN' },
      options: makeOptions(String(n), wrong.map(String)),
      answer: String(n),
      hint: '用小手指着，一个一个慢慢数～'
    };
  }

  function qQuantity(st) {
    const max = Math.min(10, st.max || 6);
    const min = st.min || 1;
    const n = rnd(min, max);
    const emoji = pick(DATA.countEmojis);
    const wrong = nearbyWrongs(n, 3, 1, Math.min(10, max + 2));
    return {
      key: 'n-qty-' + n + emoji,
      title: '哪个盘子里正好有 ' + n + ' 个？',
      visual: `<div class="digit-big">${n}</div>`,
      speak: { text: '哪个盘子里正好有 ' + n + ' 个？', lang: 'zh-CN' },
      speakAnswer: { text: '这里有 ' + n + ' 个', lang: 'zh-CN' },
      options: makeOptions(
        { label: emoji.repeat(n), html: `<span class="mini-count">${pic(emoji.repeat(n))}</span>` },
        wrong.map(c => ({ label: emoji.repeat(c), html: `<span class="mini-count">${pic(emoji.repeat(c))}</span>` }))
      ),
      answer: emoji.repeat(n),
      hint: `数一数，${n} 个就是 ${n} 个哦～`
    };
  }

  function qNext(st) {
    const max = st.max || 10;
    const start = rnd(1, Math.max(1, max - 3));
    const seq = [start, start + 1, start + 2];
    const answer = start + 3;
    const wrong = nearbyWrongs(answer, 3, 1, max + 2);
    return {
      key: 'n-next-' + answer,
      title: tv('next', '接下来是哪个数字呢？'),
      visual: `<div class="seq">${seq.map(n => `<span>${n}</span>`).join('')}<span class="seq-q">?</span></div>`,
      speak: { text: '接下来是哪个数字呢？', lang: 'zh-CN' },
      speakAnswer: { text: String(answer), lang: 'zh-CN' },
      options: makeOptions(String(answer), wrong.map(String)),
      answer: String(answer),
      hint: '后面的数字，总比前面的大 1 哦～'
    };
  }

  function qCompare(st) {
    const max = st.max || 10;
    let a = rnd(2, max);
    let b = rnd(1, max);
    let guard = 0;
    while (a === b && guard++ < 30) b = rnd(1, max);
    if (a === b) b = a === max ? a - 1 : a + 1;
    const bigger = a > b;
    const wrong = new Set();
    while (wrong.size < 2) {
      const c = rnd(1, max + 1);
      if (c !== a && c !== b) wrong.add(c);
    }
    return {
      key: 'n-cmp-' + a + '-' + b,
      title: tv('compare', '哪个数字更大？'),
      visual: `<div class="seq compare"><span>${a}</span><span class="vs">和</span><span>${b}</span></div>`,
      speak: { text: `${a} 和 ${b}，哪个数字更大？`, lang: 'zh-CN' },
      speakAnswer: { text: `更大的数字是 ${bigger ? a : b}`, lang: 'zh-CN' },
      options: makeOptions(String(bigger ? a : b), [String(bigger ? b : a), ...[...wrong].map(String)]),
      answer: String(bigger ? a : b),
      hint: '数字越大，就排在越后面哦～'
    };
  }

  function qPattern(st) {
    const max = st.max || 10;
    const step = Math.random() < 0.65 ? 1 : 2;
    const start = rnd(1, Math.max(1, max - step * 3));
    const seq = [start, start + step, start + step * 2];
    const answer = start + step * 3;
    const wrong = new Set();
    let guard = 0;
    while (wrong.size < 3 && guard++ < 60) {
      const c = Math.max(1, answer + rnd(-4, 4));
      if (c !== answer) wrong.add(c);
    }
    return {
      key: 'n-pat-' + start + '-' + step,
      title: tv('pattern', '找规律，接下来是几？'),
      visual: `<div class="seq">${seq.map(n => `<span>${n}</span>`).join('')}<span class="seq-q">?</span></div>`,
      speak: { text: '找一找规律，接下来是哪个数字？', lang: 'zh-CN' },
      speakAnswer: { text: String(answer), lang: 'zh-CN' },
      options: makeOptions(String(answer), [...wrong].map(String)),
      answer: String(answer),
      hint: step === 1
        ? '每次都多 1，接着数下去就好啦～'
        : '每次都多 2，看看能发现吗？'
    };
  }

  /* ---------- 字母王国 ---------- */

  function qLetterListen(st) {
    const pool = poolLetters(st);
    const item = pick(pool);
    const wrong = shuffle(uniqueLabels(pool, 'u', item.u)).slice(0, 3).map(x => x.u);
    return {
      key: 'l-listen-' + item.u,
      title: tv('letterListen', '听一听，是哪个字母？'),
      visual: `<div class="sound-orb">🔊</div><div class="visual-note">点喇叭可以再听一遍</div>`,
      speak: { text: item.u, lang: 'en-US' },
      speakAnswer: { text: item.u, lang: 'en-US' },
      options: makeOptions(item.u, wrong.length ? wrong : ['X', 'Y', 'Z']),
      answer: item.u,
      hint: '字母 ' + item.u + ' 就像「' + item.zh + '」的 ' + item.word + ' 开头～'
    };
  }

  function qLetterCase(st) {
    const pool = poolLetters(st);
    const item = pick(pool);
    const wrong = shuffle(uniqueLabels(pool, 'l', item.l)).slice(0, 3).map(x => x.l);
    const askLower = Math.random() < 0.6;
    if (askLower) {
      return {
        key: 'l-caseL-' + item.u,
        title: '它的小写字母是哪个？',
        visual: `<div class="big-letter">${item.u}</div><div class="letter-hint">${pic(item.emoji)} ${item.word} · ${item.zh}</div>`,
        speak: { text: item.u, lang: 'en-US' },
        speakAnswer: { text: item.l, lang: 'en-US' },
        options: makeOptions(item.l, wrong.length ? wrong : ['x', 'y', 'z']),
        answer: item.l,
        hint: '大写 ' + item.u + '，小写 ' + item.l + ' 长得像它的缩小版～'
      };
    }
    const wrongU = shuffle(uniqueLabels(pool, 'u', item.u)).slice(0, 3).map(x => x.u);
    return {
      key: 'l-caseU-' + item.u,
      title: '它的大写字母是哪个？',
      visual: `<div class="big-letter lower">${item.l}</div><div class="letter-hint">${pic(item.emoji)} ${item.word} · ${item.zh}</div>`,
      speak: { text: item.l, lang: 'en-US' },
      speakAnswer: { text: item.u, lang: 'en-US' },
      options: makeOptions(item.u, wrongU.length ? wrongU : ['X', 'Y', 'Z']),
      answer: item.u,
      hint: '小写 ' + item.l + '，大写就是 ' + item.u + '～'
    };
  }

  function qLetterOrder(st) {
    const pool = poolLetters(st);
    const idx = rnd(0, Math.max(0, pool.length - 3));
    const seq = [pool[idx], pool[idx + 1]];
    const answer = pool[idx + 2].u;
    const wrong = shuffle(DATA.letters.filter(x => x.u !== answer)).slice(0, 3).map(x => x.u);
    return {
      key: 'l-next-' + answer,
      title: '字母排队，接下来是谁？',
      visual: `<div class="seq">${seq.map(x => `<span>${x.u}</span>`).join('')}<span class="seq-q">?</span></div>`,
      speak: [{ text: seq[0].u, lang: 'en-US' }, { text: seq[1].u, lang: 'en-US' }],
      speakAnswer: { text: answer, lang: 'en-US' },
      options: makeOptions(answer, wrong),
      answer: answer,
      hint: '一起唱字母歌：A B C D E F G…'
    };
  }

  /* ---------- 单词花园 ---------- */

  function qWordPic(st) {
    const pool = poolWords(st);
    const item = pick(pool);
    /* 同一单词可能分属多个主题，先按英文去重，避免选项重复 */
    const wrong = shuffle(uniqueLabels(pool, 'en', item.en)).slice(0, 3).map(x => x.en);
    return {
      key: 'w-en-' + item.en,
      title: tv('wordPic', '这个用英语怎么说？'),
      visual: `<div class="big-emoji">${pic(item.emoji)}</div><div class="visual-note">${item.zh}</div>`,
      speak: { text: item.zh, lang: 'zh-CN' },
      speakAnswer: { text: item.en, lang: 'en-US' },
      options: makeOptions(item.en, wrong),
      answer: item.en,
      hint: '跟我读：' + item.en
    };
  }

  function qWordListen(st) {
    const pool = poolWords(st);
    const item = pick(pool);
    const wrong = shuffle(uniqueLabels(pool, 'zh', item.zh)).slice(0, 3);
    return {
      key: 'w-listen-' + item.en,
      title: tv('wordListen', '听一听，是哪个？'),
      visual: `<div class="sound-orb">🔊</div><div class="visual-note">点喇叭可以再听一遍</div>`,
      speak: { text: item.en, lang: 'en-US' },
      speakAnswer: { text: item.en, lang: 'en-US' },
      options: makeOptions(
        { label: item.zh, html: `<span class="opt-pic">${pic(item.emoji)}</span><span class="opt-sub">${item.zh}</span>` },
        wrong.map(x => ({ label: x.zh, html: `<span class="opt-pic">${pic(x.emoji)}</span><span class="opt-sub">${x.zh}</span>` }))
      ),
      answer: item.zh,
      hint: item.en + ' 就是「' + item.zh + '」～'
    };
  }

  function qWordMeaning(st) {
    const pool = poolWords(st);
    const item = pick(pool);
    const wrong = shuffle(uniqueLabels(pool.filter(x => x.emoji !== item.emoji), 'zh', item.zh)).slice(0, 3);
    return {
      key: 'w-zh-' + item.en,
      title: tv('wordMeaning', '这个单词是什么意思？'),
      visual: `<div class="word-big">${item.en}</div><div class="visual-note">听一听，选出正确的图片</div>`,
      speak: { text: item.en, lang: 'en-US' },
      speakAnswer: { text: item.en, lang: 'en-US' },
      options: makeOptions(
        { label: item.zh, html: `<span class="opt-pic">${pic(item.emoji)}</span><span class="opt-sub">${item.zh}</span>` },
        wrong.map(x => ({ label: x.zh, html: `<span class="opt-pic">${pic(x.emoji)}</span><span class="opt-sub">${x.zh}</span>` }))
      ),
      answer: item.zh,
      hint: item.en + ' 就是「' + item.zh + '」的意思～'
    };
  }

  /* ---------- 算术工坊：加、减、乘、除 ---------- */

  function qMath(st, force) {
    const max = st.max || 10;
    const mode = force || pick(st.qtypes);
    const isSub = mode === 'sub';
    const isMul = mode === 'mul';
    const isDiv = mode === 'div';
    let a, b, answer, sign, sayWord;

    if (isMul) {
      a = rnd(2, max);
      b = rnd(2, max);
      answer = a * b;
      sign = '×';
      sayWord = '乘';
    } else if (isDiv) {
      b = rnd(2, max);
      answer = rnd(1, max);
      a = b * answer;
      sign = '÷';
      sayWord = '除以';
    } else if (isSub) {
      a = rnd(2, max);
      b = rnd(1, a - 1);
      answer = a - b;
      sign = '−';
      sayWord = '减';
    } else {
      a = rnd(1, max - 1);
      b = rnd(1, max - a);
      answer = a + b;
      sign = '+';
      sayWord = '加';
    }

    const ceil = isMul ? max * max : isDiv ? max : max + 2;
    const wrong = new Set();
    let guard = 0;
    while (wrong.size < 3 && guard++ < 80) {
      const c = Math.max(0, answer + rnd(-5, 5));
      if (c !== answer && c <= ceil) wrong.add(c);
    }

    let dots = '';
    if (isMul && a * b <= 30) {
      const rows = Array.from({ length: a }, () =>
        `<div class="dot-row">${Array.from({ length: b }, () => '<i class="dot dot-b"></i>').join('')}</div>`).join('');
      dots = `<div class="dots mul-dots">${rows}</div>`;
    } else if (isDiv && a <= 30) {
      const groups = Array.from({ length: b }, () =>
        `<div class="dot-row">${Array.from({ length: answer }, () => '<i class="dot"></i>').join('')}</div>`).join('');
      dots = `<div class="dots mul-dots">${groups}</div>`;
    } else if (!isMul && !isDiv && a <= 10 && b <= 10) {
      const dotA = Array.from({ length: a }, () => '<i class="dot"></i>').join('');
      if (isSub) {
        const keep = Array.from({ length: a - b }, () => '<i class="dot"></i>').join('');
        const gone = Array.from({ length: b }, () => '<i class="dot dot-gone"></i>').join('');
        dots = `<div class="dots">${keep}${gone}</div>`;
      } else {
        const dotB = Array.from({ length: b }, () => '<i class="dot dot-b"></i>').join('');
        dots = `<div class="dots">${dotA}<span class="dot-plus">+</span>${dotB}</div>`;
      }
    }

    const hint = isMul
      ? `${a} 个 ${b} 相加，就是 ${a} × ${b} 啦～`
      : isDiv
        ? `把 ${a} 个平均分成 ${b} 份，每份有几个呢？`
        : isSub
          ? '从 ' + a + ' 个里拿走 ' + b + ' 个，剩下几个呢？'
          : a + ' 个加上 ' + b + ' 个，一起数一数～';

    return {
      key: 'm-' + a + sign + b,
      title: tv('math', '算一算，等于几？'),
      visual: `<div class="equation">${a} ${sign} ${b} = <span class="eq-q">?</span></div>${dots}`,
      speak: { text: `${a} ${sayWord} ${b} 等于几？`, lang: 'zh-CN' },
      speakAnswer: { text: `等于 ${answer}`, lang: 'zh-CN' },
      options: makeOptions(String(answer), [...wrong].map(String)),
      answer: String(answer),
      hint: hint
    };
  }

  /* ---------- 拼音小路 ---------- */

  function qPyInitial(st) {
    const all = DATA.pinyin.initials;
    const g = st.group || [0, all.length - 1];
    const pool = all.slice(g[0], g[1] + 1);
    const item = pick(pool);
    const say = (DATA.pinyin.initialSay || {})[item.p] || item.p;
    // 三种问法轮换：听词语找声母 / 看声母找词语 / 认声母自己的读音
    const roll = Math.random();
    if (roll < 0.34) {
      const sayOf = p => (DATA.pinyin.initialSay || {})[p] || p;
      const optOf = x => ({
        label: sayOf(x.p),
        say: sayOf(x.p),
        lang: 'zh-CN',
        audio: AudioFX.pyAudio.sheng(x.p)
      });
      const others = shuffle(all.filter(x => x.p !== item.p)).slice(0, 3).map(optOf);
      return {
        key: 'py-ini-say-' + item.p,
        title: '这个声母读什么音？',
        visual: `<div class="pinyin-big">${item.p}</div><div class="visual-note">点一点喇叭，听听它怎么读</div>`,
        speak: { text: say, lang: 'zh-CN', audio: AudioFX.pyAudio.sheng(item.p) },
        speakAnswer: { text: say, lang: 'zh-CN', audio: AudioFX.pyAudio.sheng(item.p) },
        options: makeOptions(optOf(item), others),
        answer: say,
        hint: '声母 ' + item.p + ' 读作「' + say + '」，跟着念一念～'
      };
    }
    if (roll < 0.67) {
      const wrong = shuffle(pool.filter(x => x.p !== item.p)).slice(0, 3);
      return {
        key: 'py-ini-pic-' + item.p,
        title: '哪个词语的开头是「' + item.p + '」？',
        visual: `<div class="pinyin-big">${item.p}</div><div class="visual-note">听一听，找出开头是这个声母的词语</div>`,
        speak: { text: say + '，哪个词语的开头是它？', lang: 'zh-CN' },
        speakAnswer: { text: item.word, lang: 'zh-CN' },
        options: makeOptions(
          { label: item.word, html: `<span class="opt-pic">${pic(item.emoji)}</span><span class="opt-sub">${item.word}</span>` },
          wrong.map(x => ({ label: x.word, html: `<span class="opt-pic">${pic(x.emoji)}</span><span class="opt-sub">${x.word}</span>` }))
        ),
        answer: item.word,
        hint: '「' + item.word + '」开头的声母就是 ' + item.p
      };
    }
    const iniOpt = x => ({
      label: x.p,
      say: (DATA.pinyin.initialSay || {})[x.p] || x.p,
      lang: 'zh-CN',
      audio: AudioFX.pyAudio.sheng(x.p)
    });
    const wrong = shuffle(all.filter(x => x.p !== item.p)).slice(0, 3).map(iniOpt);
    return {
      key: 'py-ini-' + item.p,
      title: tv('pyInitial', '听一听，它的声母是哪个？'),
      visual: `<div class="big-emoji">${pic(item.emoji)}</div><div class="visual-note">${item.word}</div>`,
      speak: { text: item.word, lang: 'zh-CN' },
      speakAnswer: { text: (DATA.pinyin.initialSay || {})[item.p] || item.p, lang: 'zh-CN', audio: AudioFX.pyAudio.sheng(item.p) },
      options: makeOptions(iniOpt(item), wrong),
      answer: item.p,
      hint: '「' + item.word + '」开头的声母是 ' + item.p
    };
  }

  function qPyFinal(st) {
    const all = DATA.pinyin.finals;
    const g = st.group || [0, all.length - 1];
    const pool = all.slice(g[0], g[1] + 1);
    const item = pick(pool);
    // 一半「听词语找韵母」，一半反过来「看韵母找词语」，让每个韵母都能出两道不同的题
    if (Math.random() < 0.5) {
      const wrong = shuffle(pool.filter(x => x.p !== item.p)).slice(0, 3);
      const say = (DATA.pinyin.finalSay || {})[item.p] || item.p;
      return {
        key: 'py-fin-pic-' + item.p,
        title: '哪个词语的读音里有韵母「' + item.p + '」？',
        visual: `<div class="pinyin-big">${item.p}</div><div class="visual-note">听一听，找出读起来有这个韵母的词语</div>`,
        speak: { text: say + '，哪个词语里有它？', lang: 'zh-CN' },
        speakAnswer: { text: item.word, lang: 'zh-CN' },
        options: makeOptions(
          { label: item.word, html: `<span class="opt-pic">${pic(item.emoji)}</span><span class="opt-sub">${item.word}</span>` },
          wrong.map(x => ({ label: x.word, html: `<span class="opt-pic">${pic(x.emoji)}</span><span class="opt-sub">${x.word}</span>` }))
        ),
        answer: item.word,
        hint: '「' + item.word + '」的读音里就有韵母 ' + item.p
      };
    }
    const finOpt = x => ({
      label: x.p,
      say: (DATA.pinyin.finalSay || {})[x.p] || x.p,
      lang: 'zh-CN',
      audio: (DATA.pinyin.localFinals || []).indexOf(x.p) > -1 ? AudioFX.pyAudio.yun(x.p) : ''
    });
    const local = (DATA.pinyin.localFinals || []).indexOf(item.p) > -1;
    const wrong = shuffle(all.filter(x => x.p !== item.p)).slice(0, 3);
    return {
      key: 'py-fin-' + item.p,
      title: tv('pyFinal', '听一听，它的韵母是哪个？'),
      visual: `<div class="big-emoji">${pic(item.emoji)}</div><div class="visual-note">${item.word}</div>`,
      speak: { text: item.word, lang: 'zh-CN' },
      speakAnswer: {
        text: (DATA.pinyin.finalSay || {})[item.p] || item.p,
        lang: 'zh-CN',
        audio: local ? AudioFX.pyAudio.yun(item.p) : ''
      },
      options: makeOptions(finOpt(item), wrong.length ? wrong.map(finOpt) : [
        { label: 'a', say: '啊', lang: 'zh-CN', audio: AudioFX.pyAudio.yun('a') },
        { label: 'o', say: '喔', lang: 'zh-CN', audio: AudioFX.pyAudio.yun('o') },
        { label: 'e', say: '鹅', lang: 'zh-CN', audio: AudioFX.pyAudio.yun('e') }
      ]),
      answer: item.p,
      hint: '「' + item.word + '」的韵母是 ' + item.p
    };
  }

  function syllableAudio(item) {
    return item.local === false ? '' : AudioFX.pyAudio.yinjie(item.p);
  }

  function qPySyllable(st) {
    const pool = DATA.pinyin.syllables;
    const item = pick(pool);
    const wrong = shuffle(pool.filter(x => x.c !== item.c)).slice(0, 3).map(x => x.c);
    return {
      key: 'py-syl-' + item.p,
      title: tv('pySyllable', '拼一拼，读出来是哪个字？'),
      visual: `<div class="pinyin-big">${item.p}</div><div class="big-emoji small">${pic(item.emoji)}</div>`,
      speak: { text: item.c, lang: 'zh-CN', audio: syllableAudio(item) },
      speakAnswer: { text: item.c, lang: 'zh-CN', audio: syllableAudio(item) },
      options: makeOptions(item.c, wrong),
      answer: item.c,
      hint: '拼一拼 ' + item.p + '，就是「' + item.c + '」'
    };
  }

  function qPyTone(st) {
    const pool = DATA.pinyin.syllables.filter(x => x.tone);
    const item = pick(pool);
    const TONES = ['一声 ˉ', '二声 ˊ', '三声 ˇ', '四声 ˋ'];
    return {
      key: 'py-tone-' + item.p,
      title: tv('pyTone', '这个音是第几声？'),
      visual: `<div class="pinyin-big">${item.p}</div><div class="big-hanzi small">${item.c}</div><div class="visual-note">${pic(item.emoji)} ${item.c}</div>`,
      speak: { text: item.c, lang: 'zh-CN', audio: syllableAudio(item) },
      speakAnswer: { text: item.c, lang: 'zh-CN', audio: syllableAudio(item) },
      options: makeOptions(TONES[item.tone - 1], TONES.filter((_, i) => i !== item.tone - 1)),
      answer: TONES[item.tone - 1],
      hint: '一声平、二声扬、三声拐弯、四声降'
    };
  }

  function qPyChar(st) {
    const pool = poolHanzi(st);
    const item = pick(pool);
    // 不同汉字的拼音可能相同，先按拼音去重，避免选项里出现两个 shí
    const wrong = uniqueLabels(shuffle(pool.filter(x => x.p !== item.p)), 'p').slice(0, 3).map(x => x.p);
    return {
      key: 'py-char-' + item.c,
      title: '这个字的拼音是哪个？',
      visual: `<div class="big-hanzi">${item.c}</div><div class="visual-note">${pic(item.emoji)} ${item.word}</div>`,
      speak: { text: item.c, lang: 'zh-CN' },
      speakAnswer: { text: item.c, lang: 'zh-CN' },
      options: makeOptions(item.p, wrong.length ? wrong : ['mā', 'bā', 'dà']),
      answer: item.p,
      hint: '它读作 ' + item.p + '，跟着读一读～'
    };
  }

  /* ---------- 汉字森林 ---------- */

  function qHzPic(st) {
    const pool = poolHanzi(st);
    const item = pick(pool);
    const wrong = shuffle(pool.filter(x => x.c !== item.c && x.emoji !== item.emoji)).slice(0, 3).map(x => x.c);
    return {
      key: 'h-char-' + item.c,
      title: tv('hzPic', '这是什么字？'),
      visual: `<div class="big-emoji">${pic(item.emoji)}</div><div class="visual-note">${item.word}</div>`,
      speak: { text: item.word, lang: 'zh-CN' },
      speakAnswer: { text: item.c, lang: 'zh-CN' },
      options: makeOptions(item.c, wrong.length ? wrong : ['山', '水', '火']),
      answer: item.c,
      hint: '「' + item.word + '」的「' + item.c + '」，读作 ' + item.p
    };
  }

  function qHzMeaning(st) {
    const pool = poolHanzi(st);
    const item = pick(pool);
    const wrong = shuffle(pool.filter(x => x.c !== item.c && x.emoji !== item.emoji)).slice(0, 3);
    return {
      key: 'h-pic-' + item.c,
      title: tv('hzMeaning', '这个字是什么东西？'),
      visual: `<div class="big-hanzi">${item.c}</div><div class="pinyin-small">${item.p}</div>`,
      speak: { text: item.c, lang: 'zh-CN' },
      speakAnswer: { text: item.c, lang: 'zh-CN' },
      options: makeOptions(
        { label: item.word, html: `<span class="opt-pic">${pic(item.emoji)}</span><span class="opt-sub">${item.word}</span>` },
        wrong.map(x => ({ label: x.word, html: `<span class="opt-pic">${pic(x.emoji)}</span><span class="opt-sub">${x.word}</span>` }))
      ),
      answer: item.word,
      hint: item.c + ' 就是「' + item.word + '」～'
    };
  }

  function qHzListen(st) {
    const pool = poolHanzi(st);
    const item = pick(pool);
    const wrong = shuffle(pool.filter(x => x.c !== item.c)).slice(0, 3).map(x => x.c);
    return {
      key: 'h-listen-' + item.c,
      title: tv('hzListen', '听一听，是哪个字？'),
      visual: `<div class="sound-orb">🔊</div><div class="visual-note">点喇叭可以再听一遍</div>`,
      speak: { text: item.word, lang: 'zh-CN' },
      speakAnswer: { text: item.c, lang: 'zh-CN' },
      options: makeOptions(item.c, wrong),
      answer: item.c,
      hint: '「' + item.word + '」写成一个字就是 ' + item.c
    };
  }

  /* ---------- 图形与空间 ---------- */

  const SHAPE_COLORS = ['#ffd166', '#ef476f', '#06d6a0', '#4cc9f0', '#b388ff', '#ff9f43'];

  function shapeSvg(id, color) {
    const fill = color || pick(SHAPE_COLORS);
    const box = body => `<svg class="shape-svg" viewBox="0 0 100 100" aria-hidden="true">${body}</svg>`;
    if (id === 'square') return box(`<rect x="12" y="12" width="76" height="76" rx="6" fill="${fill}"/>`);
    if (id === 'triangle') return box(`<polygon points="50,8 93,90 7,90" fill="${fill}"/>`);
    if (id === 'rect') return box(`<rect x="7" y="27" width="86" height="46" rx="6" fill="${fill}"/>`);
    if (id === 'star') return box(`<polygon points="50,6 62,37 95,37 68,57 78,91 50,71 22,91 32,57 5,37 38,37" fill="${fill}"/>`);
    if (id === 'heart') return box(`<path d="M50 86 C16 62 8 43 17 29 C26 16 44 18 50 33 C56 18 74 16 83 29 C92 43 84 62 50 86 Z" fill="${fill}"/>`);
    if (id === 'oval') return box(`<ellipse cx="50" cy="50" rx="45" ry="27" fill="${fill}"/>`);
    if (id === 'diamond') return box(`<polygon points="50,5 88,50 50,95 12,50" fill="${fill}"/>`);
    if (id === 'pentagon') return box(`<polygon points="50,8 90,37 75,84 25,84 10,37" fill="${fill}"/>`);
    if (id === 'hexagon') return box(`<polygon points="50,6 86,29 86,71 50,94 14,71 14,29" fill="${fill}"/>`);
    return box(`<circle cx="50" cy="50" r="41" fill="${fill}"/>`);
  }

  /* 图形题：st.shapes 限定本关出现的图形，st.mode 固定「说名字」或「找图形」 */
  function qShape(st) {
    const ids = st && Array.isArray(st.shapes) ? st.shapes : null;
    const pool = ids ? DATA.shapes.filter(s => ids.indexOf(s.id) > -1) : DATA.shapes;
    const item = pick(pool);
    const wrong = shuffle(pool.filter(s => s.id !== item.id)).slice(0, 3);
    const mode = (st && st.mode) || (Math.random() < 0.6 ? 'name' : 'pick');
    if (mode === 'name') {
      return {
        key: 'sh-name-' + item.id,
        title: tv('shape', '这是什么图形？'),
        visual: `<div class="shape-stage">${shapeSvg(item.id)}</div>`,
        speak: { text: '这是什么图形？', lang: 'zh-CN' },
        speakAnswer: { text: item.zh, lang: 'zh-CN' },
        options: makeOptions(item.zh, wrong.map(s => s.zh)),
        answer: item.zh,
        hint: '它的名字叫「' + item.zh + '」～'
      };
    }
    return {
      key: 'sh-pick-' + item.id,
      title: '哪一个才是' + item.zh + '？',
      visual: `<div class="visual-note">找出「${item.zh}」</div>`,
      speak: { text: '哪一个才是' + item.zh + '？', lang: 'zh-CN' },
      speakAnswer: { text: item.zh, lang: 'zh-CN' },
      options: makeOptions(
        { label: item.zh, html: shapeSvg(item.id) },
        wrong.map(s => ({ label: s.zh, html: shapeSvg(s.id) }))
      ),
      answer: item.zh,
      hint: '找一找，' + item.zh + '是什么样子的～'
    };
  }

  /* 八个方位：cell 是 3×3 九宫格里的格子下标，opp 是相反方位 */
  const DIRECTIONS = [
    { id: 'up', zh: '上面', arrow: '⬆️', cell: 1, opp: 'down' },
    { id: 'down', zh: '下面', arrow: '⬇️', cell: 7, opp: 'up' },
    { id: 'left', zh: '左边', arrow: '⬅️', cell: 3, opp: 'right' },
    { id: 'right', zh: '右边', arrow: '➡️', cell: 5, opp: 'left' },
    { id: 'upLeft', zh: '左上角', arrow: '↖️', cell: 0, opp: 'downRight' },
    { id: 'upRight', zh: '右上角', arrow: '↗️', cell: 2, opp: 'downLeft' },
    { id: 'downLeft', zh: '左下角', arrow: '↙️', cell: 6, opp: 'upRight' },
    { id: 'downRight', zh: '右下角', arrow: '↘️', cell: 8, opp: 'upLeft' }
  ];

  /* 方位题：st.dirs 限定本关出现的方位，干扰项始终从八个方位里取 */
  function qSpace(st) {
    const ids = st && Array.isArray(st.dirs) ? st.dirs : null;
    const pool = ids ? DIRECTIONS.filter(d => ids.indexOf(d.id) > -1) : DIRECTIONS;
    const dir = pick(pool);
    // 正向：小猫站中间，星星在某个方位；反向：星星站中间，问小猫在哪边
    const inverse = Math.random() < 0.5;
    const catCell = inverse ? dir.cell : 4;
    const starCell = inverse ? 4 : dir.cell;
    const cells = Array.from({ length: 9 }, (_, i) => {
      if (i === catCell) return `<span class="space-cell">${pic('🐱')}</span>`;
      if (i === starCell) return `<span class="space-cell">${pic('⭐')}</span>`;
      return '<span class="space-cell"></span>';
    }).join('');
    const answerDir = inverse ? DIRECTIONS.find(d => d.id === dir.opp) : dir;
    const wrongPool = shuffle(DIRECTIONS.filter(d => d.id !== answerDir.id));
    const wrong = wrongPool.slice(0, 3);
    const title = inverse ? '小猫在星星的哪一边？' : '星星在小猫的哪一边？';
    return {
      key: (inverse ? 'sp-inv-' : 'sp-') + dir.id,
      title: title,
      visual: `<div class="space-grid">${cells}</div>`,
      speak: { text: title, lang: 'zh-CN' },
      speakAnswer: { text: answerDir.zh, lang: 'zh-CN' },
      options: makeOptions(
        { label: answerDir.zh, html: `<span class="opt-arrow">${answerDir.arrow}</span><span class="opt-sub">${answerDir.zh}</span>` },
        wrong.map(d => ({
          label: d.zh,
          html: `<span class="opt-arrow">${d.arrow}</span><span class="opt-sub">${d.zh}</span>`
        }))
      ),
      answer: answerDir.zh,
      hint: inverse
        ? '小猫在中间星星的' + answerDir.zh + '哦～'
        : '星星在中间小猫的' + answerDir.zh + '哦～'
    };
  }

  /* ---------- 分类、排序、测量 ---------- */

  const SORT_THEMES = ['animal', 'food', 'item', 'nature', 'vehicle', 'color', 'body', 'action', 'weather'];

  function threeDistinct(lo, hi) {
    const set = new Set();
    while (set.size < 3) set.add(rnd(lo, hi));
    return [...set];
  }

  /* 分类题：st.mode 固定「odd（找不同）」或「size（比大小）」 */
  function qSort(st) {
    const mode = (st && st.mode) || (Math.random() < 0.6 ? 'odd' : 'size');
    if (mode === 'odd') {
      const t1 = pick(SORT_THEMES);
      let t2 = pick(SORT_THEMES);
      while (t2 === t1) t2 = pick(SORT_THEMES);
      const same = shuffle(uniqueLabels(DATA.words.filter(w => w.theme === t1), 'zh')).slice(0, 3);
      const odd = pick(DATA.words.filter(w => w.theme === t2));
      return {
        key: 'sort-odd-' + t1 + '-' + odd.en,
        title: tv('sort', '哪一个和其他不一样？'),
        visual: `<div class="visual-note">仔细看看，谁不是一伙的？</div>`,
        speak: { text: '哪一个和其他不一样？', lang: 'zh-CN' },
        speakAnswer: { text: odd.zh, lang: 'zh-CN' },
        options: makeOptions(
          { label: odd.zh, html: `<span class="opt-pic">${pic(odd.emoji)}</span><span class="opt-sub">${odd.zh}</span>` },
          same.map(w => ({ label: w.zh, html: `<span class="opt-pic">${pic(w.emoji)}</span><span class="opt-sub">${w.zh}</span>` }))
        ),
        answer: odd.zh,
        hint: '把同一类的放在一起，只有「' + odd.zh + '」不是这一类～'
      };
    }
    const pool = shuffle(uniqueLabels(DATA.words.filter(w => w.theme === 'food'), 'zh')).slice(0, 3);
    const sizes = [28, 40, 54];
    const askBig = Math.random() < 0.5;
    const best = askBig ? 2 : 0;
    const options = pool.map((w, i) => ({
      label: w.zh,
      html: `<span class="opt-pic" style="font-size:${sizes[i]}px">${pic(w.emoji)}</span><span class="opt-sub">${w.zh}</span>`
    }));
    return {
      key: 'sort-size-' + pool.map(w => w.en).join('-'),
      title: askBig ? '哪一个最大？' : '哪一个最小？',
      visual: `<div class="visual-note">比一比它们的大小</div>`,
      speak: { text: askBig ? '哪一个最大？' : '哪一个最小？', lang: 'zh-CN' },
      speakAnswer: { text: pool[best].zh, lang: 'zh-CN' },
      options: makeOptions(options[best], options.filter((_, i) => i !== best)),
      answer: pool[best].zh,
      hint: (askBig ? '最大' : '最小') + '的是「' + pool[best].zh + '」～'
    };
  }

  const HEAVY = [
    { emoji: '🐘', zh: '大象', w: 100 },
    { emoji: '🐳', zh: '鲸鱼', w: 120 },
    { emoji: '🐻', zh: '小熊', w: 60 },
    { emoji: '🐱', zh: '小猫', w: 10 },
    { emoji: '🐭', zh: '老鼠', w: 5 },
    { emoji: '🐦', zh: '小鸟', w: 3 },
    { emoji: '🐜', zh: '蚂蚁', w: 1 },
    { emoji: '🪶', zh: '羽毛', w: 0.5 }
  ];

  /* 测量题：st.mode 固定「long（长短）」「tall（高矮）」「heavy（轻重）」 */
  function qMeasure(st) {
    const mode = (st && st.mode) || pick(['long', 'tall', 'heavy']);
    if (mode === 'heavy') {
      const pool = shuffle(HEAVY).slice(0, 4);
      const askHeavy = Math.random() < 0.5;
      const sorted = pool.slice().sort((a, b) => a.w - b.w);
      const best = askHeavy ? sorted[sorted.length - 1] : sorted[0];
      return {
        key: 'ms-heavy-' + (askHeavy ? 'max-' : 'min-') + best.zh,
        title: askHeavy ? '哪个最重？' : '哪个最轻？',
        visual: `<div class="visual-note">想一想，它们谁更重呢？</div>`,
        speak: { text: askHeavy ? '哪个最重？' : '哪个最轻？', lang: 'zh-CN' },
        speakAnswer: { text: best.zh, lang: 'zh-CN' },
        options: makeOptions(
          { label: best.zh, html: `<span class="opt-pic">${pic(best.emoji)}</span><span class="opt-sub">${best.zh}</span>` },
          pool.filter(x => x.zh !== best.zh).map(x => ({ label: x.zh, html: `<span class="opt-pic">${pic(x.emoji)}</span><span class="opt-sub">${x.zh}</span>` }))
        ),
        answer: best.zh,
        hint: (askHeavy ? '最重' : '最轻') + '的是「' + best.zh + '」～'
      };
    }
    const pool = shuffle(DATA.words.filter(w => w.theme === 'food')).slice(0, 3);
    const values = threeDistinct(30, 100);
    const askLong = Math.random() < 0.5;
    const best = askLong ? values.indexOf(Math.max(...values)) : values.indexOf(Math.min(...values));
    const isTall = mode === 'tall';
    const rows = pool.map((w, i) => isTall
      ? `<div class="measure-col"><span class="measure-bar" style="height:${values[i]}%"></span><span class="measure-pic">${pic(w.emoji)}</span></div>`
      : `<div class="measure-row"><span class="measure-bar" style="width:${values[i]}%"></span><span class="measure-pic">${pic(w.emoji)}</span></div>`).join('');
    return {
      key: 'ms-' + mode + '-' + pool.map(w => w.en).join('-'),
      title: mode === 'long' ? (askLong ? '哪一条最长？' : '哪一条最短？') : (askLong ? '哪一座最高？' : '哪一座最矮？'),
      visual: `<div class="measure-bars ${mode}">${rows}</div>`,
      speak: { text: mode === 'long' ? (askLong ? '哪一条最长？' : '哪一条最短？') : (askLong ? '哪一座最高？' : '哪一座最矮？'), lang: 'zh-CN' },
      speakAnswer: { text: pool[best].zh, lang: 'zh-CN' },
      options: makeOptions(
        { label: pool[best].zh, html: `<span class="opt-pic">${pic(pool[best].emoji)}</span><span class="opt-sub">${pool[best].zh}</span>` },
        pool.filter((_, i) => i !== best).map(w => ({ label: w.zh, html: `<span class="opt-pic">${pic(w.emoji)}</span><span class="opt-sub">${w.zh}</span>` }))
      ),
      answer: pool[best].zh,
      hint: '仔细比一比，最' + (askLong ? (isTall ? '高' : '长') : (isTall ? '矮' : '短')) + '的是「' + pool[best].zh + '」～'
    };
  }

  /* ---------- 时间与钱币 ---------- */

  /* minute 传 30 时画半点：分针指向 6，时针偏半格 */
  function clockSvg(hour, minute) {
    const min = minute === 30 ? 30 : 0;
    const hRad = ((hour % 12) * 30 + min * 0.5) * Math.PI / 180;
    const hx = 50 + 25 * Math.sin(hRad);
    const hy = 50 - 25 * Math.cos(hRad);
    const mRad = min * 6 * Math.PI / 180;
    const mx = 50 + 31 * Math.sin(mRad);
    const my = 50 - 31 * Math.cos(mRad);
    return `<svg class="clock-svg" viewBox="0 0 100 100" aria-hidden="true">
      <circle cx="50" cy="50" r="45" fill="#fff" stroke="#ffb703" stroke-width="5"/>
      <text x="50" y="22" text-anchor="middle" font-size="11" fill="#3d405b">12</text>
      <text x="82" y="55" text-anchor="middle" font-size="11" fill="#3d405b">3</text>
      <text x="50" y="91" text-anchor="middle" font-size="11" fill="#3d405b">6</text>
      <text x="18" y="55" text-anchor="middle" font-size="11" fill="#3d405b">9</text>
      <line x1="50" y1="50" x2="${hx.toFixed(1)}" y2="${hy.toFixed(1)}" stroke="#3d405b" stroke-width="7" stroke-linecap="round"/>
      <line x1="50" y1="50" x2="${mx.toFixed(1)}" y2="${my.toFixed(1)}" stroke="#ef476f" stroke-width="4" stroke-linecap="round"/>
      <circle cx="50" cy="50" r="4" fill="#3d405b"/>
    </svg>`;
  }

  /* 时间题：st.half 为真只出半点，否则只出整点 */
  function qTime(st) {
    const half = !!(st && st.half);
    const hour = rnd(1, 12);
    const suffix = half ? ' 点半' : ' 点';
    const wrong = new Set();
    let guard = 0;
    while (wrong.size < 3 && guard++ < 60) {
      const h = ((hour - 1 + rnd(1, 6)) % 12) + 1;
      if (h !== hour) wrong.add(h);
    }
    return {
      key: 'tm-' + hour + (half ? '-half' : ''),
      title: tv('time', '现在是几点？'),
      visual: `<div class="clock-stage">${clockSvg(hour, half ? 30 : 0)}</div>`,
      speak: { text: '看看钟表，现在是几点？', lang: 'zh-CN' },
      speakAnswer: { text: hour + suffix, lang: 'zh-CN' },
      options: makeOptions(hour + suffix, [...wrong].map(h => h + suffix)),
      answer: hour + suffix,
      hint: half ? '短针在 ' + hour + ' 和 ' + (hour % 12 + 1) + ' 中间，长针指着 6，就是 ' + hour + ' 点半～' : '短针指着 ' + hour + '，就是 ' + hour + ' 点整～'
    };
  }

  const COINS = [
    { label: '1 角', v: 1 },
    { label: '2 角', v: 2 },
    { label: '5 角', v: 5 },
    { label: '1 元', v: 10 }
  ];

  function moneyText(v) {
    if (v < 10) return v + ' 角';
    const y = Math.floor(v / 10);
    const j = v % 10;
    return j ? y + ' 元 ' + j + ' 角' : y + ' 元';
  }

  /* 钱币题：st.level 1=元角换算，2=两枚硬币，3=三枚硬币 */
  function qMoney(st) {
    const level = (st && st.level) || rnd(1, 3);
    if (level === 1) {
      return {
        key: 'mn-yuan',
        title: '1 元等于几角？',
        visual: `<div class="coin-row"><span class="coin-badge">1 元</span><span class="coin-eq">=</span><span class="coin-badge ghost">? 角</span></div>`,
        speak: { text: '一元等于几角？', lang: 'zh-CN' },
        speakAnswer: { text: '一元等于十角', lang: 'zh-CN' },
        options: makeOptions('10 角', ['5 角', '2 角', '100 角']),
        answer: '10 角',
        hint: '1 元 = 10 角，记住啦～'
      };
    }
    const count = level >= 3 ? 3 : 2;
    const coins = [];
    for (let i = 0; i < count; i++) coins.push(pick(COINS));
    const total = coins.reduce((sum, c) => sum + c.v, 0);
    const wrong = new Set();
    let guard = 0;
    while (wrong.size < 3 && guard++ < 60) {
      const v = total + rnd(-4, 4);
      if (v > 0 && v !== total) wrong.add(v);
    }
    const speakParts = coins.map(c => c.v < 10 ? c.v + ' 角' : '一元');
    const badge = coins.map(c => `<span class="coin-badge">${c.label}</span>`).join('<span class="coin-plus">+</span>');
    return {
      key: 'mn-' + coins.map(c => c.v).join('-'),
      title: count === 3 ? '三枚硬币一共多少钱？' : '两枚硬币一共多少钱？',
      visual: `<div class="coin-row">${badge}</div>`,
      speak: { text: speakParts.join(' 加 ') + '，一共多少钱？', lang: 'zh-CN' },
      speakAnswer: { text: '一共 ' + moneyText(total), lang: 'zh-CN' },
      options: makeOptions(moneyText(total), [...wrong].map(moneyText)),
      answer: moneyText(total),
      hint: '把它们合起来数一数，一共 ' + moneyText(total) + '～'
    };
  }

  /* ---------- 英语：自然拼读、看图说句、儿歌 ---------- */

  function qPhonics(st) {
    const pool = poolWords(st).filter(w => /^[a-z]+$/i.test(w.en));
    const item = pick(pool);
    const letter = item.en[0].toUpperCase();
    const letters = [...new Set(pool.map(w => w.en[0].toUpperCase()))].filter(x => x !== letter);
    const extra = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').filter(x => x !== letter && letters.indexOf(x) === -1);
    const wrong = shuffle(letters).concat(shuffle(extra)).slice(0, 3);
    return {
      key: 'ph-' + item.en,
      title: tv('phonics', '听一听，开头是哪个字母？'),
      visual: `<div class="big-emoji">${pic(item.emoji)}</div><div class="word-blank"><span class="blank-mark">?</span>${item.en.slice(1)}</div>`,
      speak: { text: item.en, lang: 'en-US' },
      speakAnswer: { text: letter, lang: 'en-US' },
      options: makeOptions(letter, wrong),
      answer: letter,
      hint: item.en + ' 的第一个字母是 ' + letter + '～'
    };
  }

  /* 看图说句：st.minLen / st.maxLen 按句子长度（去标点）限定难易 */
  function qSentence(st) {
    const lang = st && st.lang === 'zh' ? 'zh' : 'en';
    const lenOf = s => s[lang].replace(/[。，！？,.!?\s]/g, '').length;
    let pool = DATA.sentences;
    if (st && (st.minLen || st.maxLen)) {
      const lo = st.minLen || 0;
      const hi = st.maxLen || 999;
      const part = pool.filter(s => lenOf(s) >= lo && lenOf(s) <= hi);
      if (part.length >= 4) pool = part;
    }
    const item = pick(pool);
    const wrong = shuffle(pool.filter(s => s.emoji !== item.emoji)).slice(0, 3);
    return {
      key: 'se-' + lang + '-' + item.emoji,
      title: tv('sentence', '看图，哪句话是对的？'),
      visual: `<div class="big-emoji">${pic(item.emoji)}</div>`,
      speak: { text: '看图，哪句话是对的？', lang: 'zh-CN' },
      speakAnswer: { text: item[lang], lang: lang === 'zh' ? 'zh-CN' : 'en-US' },
      options: makeOptions(
        { label: item[lang], html: `<span class="opt-text opt-long">${item[lang]}</span>` },
        wrong.map(s => ({ label: s[lang], html: `<span class="opt-text opt-long">${s[lang]}</span>` }))
      ),
      answer: item[lang],
      hint: '图片上的是「' + item.zh + '」～'
    };
  }

  /* 儿歌接句：st.minLines / st.maxLines 按儿歌长度限定难易 */
  function qRhyme(st) {
    const lang = st && st.lang === 'zh' ? 'zh' : 'en';
    let pool = DATA.rhymes.filter(r => r.lang === lang);
    if (st && (st.minLines || st.maxLines)) {
      const lo = st.minLines || 0;
      const hi = st && st.maxLines ? st.maxLines : 999;
      const part = pool.filter(r => r.lines.length >= lo && r.lines.length <= hi);
      if (part.length >= 2) pool = part;
    }
    const rhyme = pick(pool);
    const idx = rnd(1, rhyme.lines.length - 1);
    const answer = rhyme.lines[idx];
    const others = [];
    DATA.rhymes.forEach(r => {
      if (r === rhyme) r.lines.forEach((line, i) => { if (i !== idx) others.push(line); });
      else others.push(r.lines[r.lines.length - 1]);
    });
    const wrong = shuffle([...new Set(others)].filter(x => x !== answer)).slice(0, 3);
    const shown = rhyme.lines.slice(0, idx);
    return {
      key: 'rh-' + rhyme.name + '-' + idx,
      title: tv('rhyme', '儿歌下一句是什么？') + '（' + rhyme.name + '）',
      visual: `<div class="rhyme-box"><div class="rhyme-name">🎵 ${rhyme.name}</div>${shown.map(l => `<div class="rhyme-line">${l}</div>`).join('')}<div class="rhyme-line rhyme-q">？</div></div>`,
      speak: shown.map(l => ({ text: l, lang: lang === 'zh' ? 'zh-CN' : 'en-US' })).concat([{ text: '下一句是什么呢？', lang: 'zh-CN' }]),
      speakAnswer: { text: answer, lang: lang === 'zh' ? 'zh-CN' : 'en-US' },
      options: makeOptions(
        { label: answer, html: `<span class="opt-text opt-long">${answer}</span>` },
        wrong.map(l => ({ label: l, html: `<span class="opt-text opt-long">${l}</span>` }))
      ),
      answer: answer,
      hint: '跟着《' + rhyme.name + '》一起念，下一句是「' + answer + '」'
    };
  }

  /* ---------- 汉字：笔顺 ---------- */

  const STROKE_NAMES = ['横', '竖', '撇', '点', '折', '提', '钩', '捺'];

  // 笔顺题随机抽问第几笔，避免每次都只考第一笔
  const STROKE_TITLES = [
    (n, c) => '「' + c + '」的第 ' + n + ' 笔是什么？',
    (n, c) => '写「' + c + '」的时候，第 ' + n + ' 笔写哪一笔？',
    (n, c) => '数一数，「' + c + '」的第 ' + n + ' 笔是哪个笔画？'
  ];

  function qStroke() {
    const pool = DATA.strokes.filter(s => Array.isArray(s.st) && s.st.length);
    const item = pick(pool.length ? pool : DATA.strokes);
    const order = item.st || [item.first];
    const idx = rnd(0, order.length - 1);
    const answer = order[idx];
    const wrong = shuffle(STROKE_NAMES.filter(s => s !== answer)).slice(0, 3);
    return {
      key: 'st-' + item.c + '-' + idx,
      title: pick(STROKE_TITLES)(idx + 1, item.c),
      visual: `<div class="big-hanzi">${item.c}</div><div class="pinyin-small">${item.p}</div><div class="stroke-seq">${order.map((s, i) => `<span class="${i === idx ? 'stroke-ask' : ''}">${i === idx ? '?' : s}</span>`).join('')}</div>`,
      speak: { text: item.c, lang: 'zh-CN' },
      speakAnswer: { text: '第' + (idx + 1) + '笔是' + answer, lang: 'zh-CN' },
      options: makeOptions(answer, wrong),
      answer: answer,
      hint: '「' + item.c + '」的笔顺是：' + order.join('、')
    };
  }

  /* ---------- 英语分级读本：读一句，选出中文意思 ---------- */

  function qReader() {
    const book = pick(DATA.readers);
    const idx = rnd(0, book.lines.length - 1);
    const line = book.lines[idx];
    const others = [];
    DATA.readers.forEach(b => b.lines.forEach((l, i) => {
      if (!(b === book && i === idx)) others.push(l.zh);
    }));
    const wrong = shuffle([...new Set(others)].filter(z => z !== line.zh)).slice(0, 3);
    return {
      key: 'rd-' + book.id + '-' + idx,
      title: tv('reader', '读一读，这句话是什么意思？') + '（' + book.title + '）',
      visual: `<div class="reader-box"><div class="reader-emoji">${pic(book.emoji)}</div><div class="reader-line">${line.en}</div></div>`,
      speak: { text: line.en, lang: 'en-US' },
      speakAnswer: { text: line.zh, lang: 'zh-CN' },
      options: makeOptions(
        { label: line.zh, html: `<span class="opt-text opt-long">${line.zh}</span>` },
        wrong.map(z => ({ label: z, html: `<span class="opt-text opt-long">${z}</span>` }))
      ),
      answer: line.zh,
      hint: line.en + ' 的意思是「' + line.zh + '」'
    };
  }

  /* ---------- 数学应用题：模板生成 10 以内加减 ---------- */

  function qStory(st) {
    const tpl = pick(DATA.storyTemplates);
    const cap = Math.min(10, (st && st.max) || 10);
    let a, b, answer;
    if (tpl.op === '+') {
      a = rnd(1, Math.max(1, cap - 1));
      b = rnd(1, Math.max(1, cap - a));
      answer = a + b;
    } else {
      a = rnd(2, Math.max(2, cap));
      b = rnd(1, Math.max(1, a - 1));
      answer = a - b;
    }
    const who = Array.isArray(tpl.who) && tpl.who.length ? pick(tpl.who) : '';
    const text = tpl.text.replace('{who}', who).replace('{a}', a).replace('{b}', b);
    const wrongs = [...new Set([answer + 1, answer - 1, answer + 2])].filter(n => n >= 0 && n !== answer).slice(0, 3);
    while (wrongs.length < 3) {
      const n = rnd(0, cap);
      if (n !== answer && wrongs.indexOf(n) < 0) wrongs.push(n);
    }
    return {
      key: 'sy-' + tpl.name + '-' + a + '-' + b,
      title: tv('story', '读一读，算一算'),
      visual: `<div class="story-box"><div class="story-emoji">${pic(tpl.emoji)}</div><div class="story-text">${text}</div></div>`,
      speak: { text: text, lang: 'zh-CN' },
      speakAnswer: { text: String(answer), lang: 'zh-CN' },
      options: makeOptions(String(answer), wrongs.map(String)),
      answer: String(answer),
      hint: a + (tpl.op === '+' ? ' + ' : ' - ') + b + ' = ' + answer
    };
  }

  /* ---------- 自然科学 ---------- */

  const sciPicOpt = it => ({
    label: it.zh,
    html: `<span class="opt-pic">${pic(it.emoji)}</span><span class="opt-sub">${it.zh}</span>`
  });

  // 事实类题目：选项可能是纯文字，也可能是带图的小卡片
  const sciTextOpt = x => (typeof x === 'string'
    ? { label: x, html: `<span class="opt-text opt-long">${x}</span>` }
    : sciPicOpt(x));

  // 生长顺序：前面的步骤依次排开，最后一步留问号
  function growthRow(steps) {
    const cells = steps.map(s => `<div class="growth-cell"><span class="growth-pic">${pic(s.emoji)}</span><span class="growth-name">${s.zh}</span></div>`);
    cells.push('<div class="growth-cell is-q"><span class="growth-pic">❓</span><span class="growth-name">下一步</span></div>');
    return `<div class="growth-row">${cells.join('<span class="growth-arrow">→</span>')}</div>`;
  }

  function sciPool(st) {
    return st && st.group === 'plant' ? DATA.sciPlants : DATA.sciAnimals;
  }

  // 看图认名字（动物 / 植物共用，靠阶段的 group 区分）
  function qSciPic(st) {
    const pool = sciPool(st);
    const item = pick(pool);
    const wrong = shuffle(pool.filter(x => x.zh !== item.zh)).slice(0, 3).map(x => x.zh);
    return {
      key: 'sci-pic-' + item.zh,
      title: tv('sciPic', '看图认一认，这是什么？'),
      visual: `<div class="big-emoji">${pic(item.emoji)}</div>`,
      speak: { text: '看图认一认，这是什么呀？', lang: 'zh-CN' },
      speakAnswer: { text: item.zh, lang: 'zh-CN' },
      options: makeOptions(item.zh, wrong),
      answer: item.zh,
      hint: '它是「' + item.zh + '」哦～'
    };
  }

  // 看名字挑图片
  function qSciName(st) {
    const pool = sciPool(st);
    const item = pick(pool);
    const wrong = shuffle(pool.filter(x => x.zh !== item.zh)).slice(0, 3);
    return {
      key: 'sci-name-' + item.zh,
      title: tv('sciName', '哪张图是它呢？'),
      visual: `<div class="word-big">${item.zh}</div><div class="visual-note">看文字，选出对应的图片</div>`,
      speak: { text: '哪一张图片是' + item.zh + '？', lang: 'zh-CN' },
      speakAnswer: { text: item.zh, lang: 'zh-CN' },
      options: makeOptions(
        { label: item.zh, html: `<span class="opt-pic" style="font-size:44px">${pic(item.emoji)}</span>` },
        wrong.map(x => ({ label: x.zh, html: `<span class="opt-pic" style="font-size:44px">${pic(x.emoji)}</span>` }))
      ),
      answer: item.zh,
      hint: '「' + item.zh + '」就是这张图片～'
    };
  }

  // 猜谜：用「住在哪里 + 爱吃什么」做线索，干扰项避开同样的组合
  function qSciRiddle() {
    const item = pick(DATA.sciAnimals);
    const home = DATA.sciHomes[item.home];
    const food = DATA.sciFoods[item.food];
    const wrong = shuffle(DATA.sciAnimals.filter(a => a.zh !== item.zh && (a.home !== item.home || a.food !== item.food))).slice(0, 3);
    const clue = '我住在' + home.zh + '，我爱吃' + food.zh + '。';
    return {
      key: 'sci-riddle-' + item.zh,
      title: tv('sciRiddle', '猜一猜，它是谁？'),
      visual: `<div class="sci-question">${clue}<br>猜猜我是谁？</div>`,
      speak: { text: clue + '猜猜我是谁？', lang: 'zh-CN' },
      speakAnswer: { text: item.zh, lang: 'zh-CN' },
      options: makeOptions(sciPicOpt(item), wrong.map(sciPicOpt)),
      answer: item.zh,
      hint: '住在' + home.zh + '、爱吃' + food.zh + '的是「' + item.zh + '」～'
    };
  }

  function qSciHome() {
    const item = pick(DATA.sciAnimals);
    const home = DATA.sciHomes[item.home];
    const wrongKeys = shuffle(Object.keys(DATA.sciHomes).filter(k => k !== item.home)).slice(0, 3);
    return {
      key: 'sci-home-' + item.zh,
      title: tv('sciHome', '它住在哪里呢？'),
      visual: `<div class="big-emoji">${pic(item.emoji)}</div><div class="visual-note">${item.zh}</div>`,
      speak: { text: item.zh + '住在哪里呀？', lang: 'zh-CN' },
      speakAnswer: { text: home.zh, lang: 'zh-CN' },
      options: makeOptions(sciPicOpt(home), wrongKeys.map(k => sciPicOpt(DATA.sciHomes[k]))),
      answer: home.zh,
      hint: item.zh + '住在' + home.zh + '～'
    };
  }

  function qSciFood() {
    const item = pick(DATA.sciAnimals);
    const food = DATA.sciFoods[item.food];
    const wrongKeys = shuffle(Object.keys(DATA.sciFoods).filter(k => k !== item.food)).slice(0, 3);
    return {
      key: 'sci-food-' + item.zh,
      title: tv('sciFood', '它爱吃什么？'),
      visual: `<div class="big-emoji">${pic(item.emoji)}</div><div class="visual-note">${item.zh}</div>`,
      speak: { text: item.zh + '爱吃什么呀？', lang: 'zh-CN' },
      speakAnswer: { text: food.zh, lang: 'zh-CN' },
      options: makeOptions(sciPicOpt(food), wrongKeys.map(k => sciPicOpt(DATA.sciFoods[k]))),
      answer: food.zh,
      hint: item.zh + '爱吃' + food.zh + '～'
    };
  }

  function qSciBaby() {
    const pool = DATA.sciAnimals.filter(a => a.baby);
    const item = pick(pool);
    const used = new Set([item.baby]);
    const wrong = [];
    shuffle(pool).forEach(a => {
      if (wrong.length < 3 && !used.has(a.baby)) {
        used.add(a.baby);
        wrong.push(a.baby);
      }
    });
    return {
      key: 'sci-baby-' + item.baby,
      title: tv('sciBaby', '它的宝宝叫什么？'),
      visual: `<div class="big-emoji">${pic(item.emoji)}</div><div class="visual-note">${item.zh}</div>`,
      speak: { text: item.zh + '的宝宝叫什么呀？', lang: 'zh-CN' },
      speakAnswer: { text: item.baby, lang: 'zh-CN' },
      options: makeOptions(item.baby, wrong),
      answer: item.baby,
      hint: item.zh + '的宝宝叫「' + item.baby + '」。'
    };
  }

  // 动物分类：三个同类 + 一个异类
  const SCI_KINDS = ['mammal', 'bird', 'fish', 'bug', 'reptile'];

  function qSciClass() {
    const groups = SCI_KINDS
      .map(k => ({ key: k, list: DATA.sciAnimals.filter(a => a.kind === k) }))
      .filter(g => g.list.length >= 3);
    const same = pick(groups);
    const odd = pick(DATA.sciAnimals.filter(a => a.kind !== same.key));
    const three = shuffle(same.list).slice(0, 3);
    const sameName = DATA.sciKinds[same.key].zh;
    return {
      key: 'sci-class-' + odd.zh,
      title: tv('sciClass', '哪一个不是一伙的？'),
      visual: `<div class="visual-note">仔细看看，谁和它们不是一类？</div>`,
      speak: { text: '哪一个和它们不是一类？', lang: 'zh-CN' },
      speakAnswer: { text: odd.zh + '，' + DATA.sciKinds[odd.kind].zh, lang: 'zh-CN' },
      options: makeOptions(sciPicOpt(odd), three.map(sciPicOpt)),
      answer: odd.zh,
      hint: three.map(a => a.zh).join('、') + '都是' + sameName + '，只有「' + odd.zh + '」不是～'
    };
  }

  function qSciPlantPart() {
    const item = pick(DATA.sciPlantFoods);
    const wrong = shuffle(DATA.sciPlantParts.filter(p => p !== item.part)).slice(0, 3);
    return {
      key: 'sci-part-' + item.zh,
      title: tv('sciPlantPart', '我们吃的是它的哪一部分？'),
      visual: `<div class="big-emoji">${pic(item.emoji)}</div><div class="visual-note">${item.zh}</div>`,
      speak: { text: '我们吃' + item.zh + '，吃的是它的哪一部分？', lang: 'zh-CN' },
      speakAnswer: { text: item.part, lang: 'zh-CN' },
      options: makeOptions(item.part, wrong),
      answer: item.part,
      hint: '我们吃' + item.zh + '，吃的是它的' + item.part + '。'
    };
  }

  // 通用「小知识」题：题干 + 正确答案 + 三个干扰项
  function qSciFact(st) {
    const pool = DATA[(st && st.pool) || 'sciPlantFacts'] || DATA.sciPlantFacts;
    const fact = pick(pool);
    return {
      key: 'sci-fact-' + fact.q,
      title: tv('sciFact', '想一想，应该选哪个？'),
      visual: `<div class="sci-question">${fact.q}</div>`,
      speak: { text: fact.q, lang: 'zh-CN' },
      speakAnswer: { text: fact.a, lang: 'zh-CN' },
      options: makeOptions(fact.a, fact.w),
      answer: fact.a,
      hint: fact.hint
    };
  }

  function qSciGrowth(st) {
    const kind = (st && st.group) || 'animal';
    const pool = DATA.sciGrowth.filter(g => g.kind === kind);
    const g = pick(pool);
    const last = g.steps[g.steps.length - 1];
    const shown = g.steps.slice(0, -1);
    return {
      key: 'sci-grow-' + g.id,
      title: tv('sciGrowth', '接下来会变成什么样？'),
      visual: growthRow(shown),
      speak: { text: g.zh + '是怎样长大的？接下来会变成什么样？', lang: 'zh-CN' },
      speakAnswer: { text: last.zh, lang: 'zh-CN' },
      options: makeOptions(sciPicOpt(last), shown.map(sciPicOpt)),
      answer: last.zh,
      hint: g.zh + '会慢慢长成「' + last.zh + '」～'
    };
  }

  function qSciWeather() {
    const item = pick(DATA.sciWeather);
    const wrong = shuffle(DATA.sciWeather.filter(w => w.id !== item.id)).slice(0, 3).map(w => w.zh);
    return {
      key: 'sci-weather-' + item.id,
      title: tv('sciWeather', '这是什么天气？'),
      visual: `<div class="big-emoji">${pic(item.emoji)}</div>`,
      speak: { text: '这是什么天气呀？', lang: 'zh-CN' },
      speakAnswer: { text: item.zh, lang: 'zh-CN' },
      options: makeOptions(item.zh, wrong),
      answer: item.zh,
      hint: '这是' + item.zh + '。'
    };
  }

  function qSciGear() {
    const pool = DATA.sciWeather.filter(w => w.need);
    const item = pick(pool);
    const wrong = shuffle(pool.filter(w => w.id !== item.id)).slice(0, 3).map(w => w.need);
    return {
      key: 'sci-gear-' + item.id,
      title: tv('sciGear', '这种天气出门要带什么？'),
      visual: `<div class="big-emoji">${pic(item.emoji)}</div><div class="visual-note">${item.zh}</div>`,
      speak: { text: item.zh + '出门，要带什么？', lang: 'zh-CN' },
      speakAnswer: { text: item.need.zh, lang: 'zh-CN' },
      options: makeOptions(sciPicOpt(item.need), wrong.map(sciPicOpt)),
      answer: item.need.zh,
      hint: item.zh + '出门要带上' + item.need.zh + '。'
    };
  }

  function qSciSeason() {
    const item = pick(DATA.sciSeasons);
    const wrong = shuffle(DATA.sciSeasons.filter(s => s.id !== item.id)).slice(0, 3);
    const mode = pick(['sight', 'wear', 'activity']);
    let clue, speak, hint;
    if (mode === 'sight') {
      clue = item.sight;
      speak = item.sight + '，这是哪个季节？';
      hint = item.sight + '，是' + item.zh + '。';
    } else if (mode === 'wear') {
      clue = '这个时候，我们会穿' + item.wear;
      speak = '我们会穿' + item.wear + '，这是哪个季节？';
      hint = '穿' + item.wear + '的时候，是' + item.zh + '。';
    } else {
      clue = '这个时候，我们可以' + item.activity.zh;
      speak = '我们可以' + item.activity.zh + '，这是哪个季节？';
      hint = '可以' + item.activity.zh + '的时候，是' + item.zh + '。';
    }
    return {
      key: 'sci-season-' + item.id + '-' + mode,
      title: tv('sciSeason', '这是哪个季节？'),
      visual: `<div class="sci-question">${clue}</div>`,
      speak: { text: speak, lang: 'zh-CN' },
      speakAnswer: { text: item.zh, lang: 'zh-CN' },
      options: makeOptions(sciPicOpt(item), wrong.map(sciPicOpt)),
      answer: item.zh,
      hint: hint
    };
  }

  // 天空 / 太空 / 地球：按阶段的 topic 取题，st.topics 可混合多个主题
  function qSciSpace(st) {
    const topics = st && Array.isArray(st.topics) ? st.topics : [(st && st.topic) || 'sky'];
    const pool = DATA.sciSpaceFacts.filter(f => topics.indexOf(f.topic) > -1);
    const fact = pick(pool);
    const answer = typeof fact.a === 'string' ? fact.a : fact.a.zh;
    return {
      key: 'sci-space-' + fact.q,
      title: tv('sciSpace', '想一想，选一选'),
      visual: `<div class="sci-question">${fact.q}</div>`,
      speak: { text: fact.q, lang: 'zh-CN' },
      speakAnswer: { text: answer, lang: 'zh-CN' },
      options: makeOptions(sciTextOpt(fact.a), fact.w.map(sciTextOpt)),
      answer: answer,
      hint: fact.hint
    };
  }

  function qSciBodyPart() {
    const item = pick(DATA.sciBodyParts);
    const wrong = shuffle(DATA.sciBodyParts.filter(b => b.zh !== item.zh)).slice(0, 3);
    if (Math.random() < 0.45) {
      return {
        key: 'sci-body-name-' + item.zh,
        title: tv('sciBodyPart', '哪张图是它呢？'),
        visual: `<div class="word-big">${item.zh}</div>`,
        speak: { text: '哪一张图片是' + item.zh + '？', lang: 'zh-CN' },
        speakAnswer: { text: item.zh, lang: 'zh-CN' },
        options: makeOptions(
          { label: item.zh, html: `<span class="opt-pic" style="font-size:42px">${pic(item.emoji)}</span>` },
          wrong.map(b => ({ label: b.zh, html: `<span class="opt-pic" style="font-size:42px">${pic(b.emoji)}</span>` }))
        ),
        answer: item.zh,
        hint: '「' + item.zh + '」就是这张图～'
      };
    }
    return {
      key: 'sci-body-pic-' + item.zh,
      title: tv('sciBodyPart', '这是我们身体的哪里？'),
      visual: `<div class="big-emoji">${pic(item.emoji)}</div>`,
      speak: { text: '这是我们身体的哪里呀？', lang: 'zh-CN' },
      speakAnswer: { text: item.zh, lang: 'zh-CN' },
      options: makeOptions(item.zh, wrong.map(b => b.zh)),
      answer: item.zh,
      hint: '这是我们的' + item.zh + '。'
    };
  }

  function qSciSense() {
    const fact = pick(DATA.sciSenseFacts);
    const answer = DATA.sciBodyParts.find(p => p.zh === fact.a) || DATA.sciBodyParts[0];
    const wrong = shuffle(DATA.sciBodyParts.filter(p => p.zh !== fact.a)).slice(0, 3);
    return {
      key: 'sci-sense-' + fact.q,
      title: tv('sciSense', '我们用身体的哪里来做这件事？'),
      visual: `<div class="sci-question">${fact.q}</div>`,
      speak: { text: fact.q, lang: 'zh-CN' },
      speakAnswer: { text: fact.a, lang: 'zh-CN' },
      options: makeOptions(sciPicOpt(answer), wrong.map(sciPicOpt)),
      answer: fact.a,
      hint: fact.hint
    };
  }

  function qSciHabit() {
    const askGood = Math.random() < 0.5;
    const good = DATA.sciHabits.filter(h => h.good);
    const bad = DATA.sciHabits.filter(h => !h.good);
    const item = pick(askGood ? good : bad);
    const wrong = shuffle(askGood ? bad : good).slice(0, 3);
    const title = askGood ? '哪个是好习惯？' : '哪个不是好习惯？';
    return {
      key: 'sci-habit-' + (askGood ? 'g-' : 'b-') + item.zh,
      title: title,
      visual: `<div class="sci-question">${title}</div>`,
      speak: { text: title, lang: 'zh-CN' },
      speakAnswer: { text: item.zh, lang: 'zh-CN' },
      options: makeOptions(sciPicOpt(item), wrong.map(sciPicOpt)),
      answer: item.zh,
      hint: askGood ? '「' + item.zh + '」是好习惯，要坚持做哦。' : '「' + item.zh + '」对身体不好，不要这样做。'
    };
  }

  const BUILDERS = {
    count: qCount,
    quantity: qQuantity,
    next: qNext,
    compare: qCompare,
    pattern: qPattern,
    letterListen: qLetterListen,
    letterCase: qLetterCase,
    letterOrder: qLetterOrder,
    wordPic: qWordPic,
    wordListen: qWordListen,
    wordMeaning: qWordMeaning,
    add: st => qMath(st, 'add'),
    sub: st => qMath(st, 'sub'),
    mul: st => qMath(st, 'mul'),
    div: st => qMath(st, 'div'),
    pyInitial: qPyInitial,
    pyFinal: qPyFinal,
    pySyllable: qPySyllable,
    pyTone: qPyTone,
    pyChar: qPyChar,
    hzPic: qHzPic,
    hzMeaning: qHzMeaning,
    hzListen: qHzListen,
    phonics: qPhonics,
    sentence: qSentence,
    rhyme: qRhyme,
    reader: qReader,
    story: qStory,
    stroke: qStroke,
    shape: qShape,
    space: qSpace,
    sort: qSort,
    measure: qMeasure,
    time: qTime,
    money: qMoney,
    sciPic: qSciPic,
    sciName: qSciName,
    sciRiddle: qSciRiddle,
    sciHome: qSciHome,
    sciFood: qSciFood,
    sciBaby: qSciBaby,
    sciClass: qSciClass,
    sciPlantPart: qSciPlantPart,
    sciFact: qSciFact,
    sciGrowth: qSciGrowth,
    sciWeather: qSciWeather,
    sciGear: qSciGear,
    sciSeason: qSciSeason,
    sciSpace: qSciSpace,
    sciBodyPart: qSciBodyPart,
    sciSense: qSciSense,
    sciHabit: qSciHabit
  };

  /* 自适应难度：结合年龄档与最近正确率微调数值上限，同一阶段不会突然变得过难或过易 */
  function adapt(st, accuracy, band) {
    const out = Object.assign({}, st);
    const diff = (band && band.difficulty) || 1;
    if (typeof out.max === 'number') {
      let max = out.max;
      if (accuracy != null) {
        if (accuracy < 0.6) max = Math.round(max * 0.75);
        else if (accuracy > 0.9) max = Math.round(max * 1.15);
      }
      out.max = Math.max(1, Math.round(max * diff));
      if (typeof out.min === 'number') out.min = Math.max(1, Math.min(out.min, out.max));
    }
    if (band && band.id === 'age-3' && Array.isArray(out.qtypes)) {
      // 3 岁先跳过乘除、笔顺，以及需要推理的谜语 / 分类 / 生长过程 / 常识判断和抽象的生活数学
      const HARD = ['mul', 'div', 'stroke', 'sciRiddle', 'sciClass', 'sciGrowth',
        'sciFact', 'measure', 'time', 'money', 'sort', 'space'];
      const keep = out.qtypes.filter(t => HARD.indexOf(t) < 0);
      // 整关只考难题时保留原题型，避免退化成与主题无关的题
      out.qtypes = keep.length ? keep : st.qtypes.slice();
      if (!out.qtypes.length) out.qtypes = ['count'];
    }
    return out;
  }

  /* 出一题：type 缺省时从阶段的 qtypes 里随机 */
  function build(type, st) {
    const t = type || pick(st.qtypes);
    const b = BUILDERS[t];
    if (!b) return null;
    const q = b(st);
    if (q) q.type = t;
    // easy 变体：只留一个干扰项，变成二选一（非数值学科也能用同一套自适应）
    if (q && st && st.easy && Array.isArray(q.options) && q.options.length > 2) {
      const ci = q.options.findIndex(o => o.correct);
      const wrongs = q.options.filter((o, i) => i !== ci && !o.correct);
      if (ci > -1 && wrongs.length) {
        const keep = wrongs[Math.floor(Math.random() * wrongs.length)];
        q.options = q.options.filter((o, i) => i === ci || o === keep);
        q.easy = true;
      }
    }
    return q;
  }

  /* 知识点标识：把题干 key 去掉图案与随机痕迹，保留到「具体是哪个数字/字母/汉字」这一级 */
  function skillOf(key, type) {
    const raw = String(key || '')
      .replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}\u{200D}]/gu, '')
      .replace(/\s+/g, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    return raw || String(type || 'choice');
  }

  /* 生成一整局：先去重，题池不够时补重复题，保证题量不会静默变少 */
  function buildSession(st, total) {
    const list = [];
    const seen = new Set();
    let guard = 0;
    while (list.length < total && guard++ < total * 30) {
      const q = build(null, st);
      if (!q || seen.has(q.key)) continue;
      seen.add(q.key);
      list.push(q);
    }
    guard = 0;
    while (list.length < total && guard++ < total * 10) {
      const q = build(null, st);
      if (q) list.push(q);
    }
    return list;
  }

  /* ---------- 小游戏用：把同一批知识包装成「找目标」的题目 ---------- */

  function pySound(p) {
    const py = DATA.pinyin;
    return (py.initialSay || {})[p] || (py.finalSay || {})[p] || p;
  }

  function miniQuestion(subject, count = 3) {
    const need = Math.max(1, count - 1);

    // 生活数学沿用算术题、表达工坊沿用认字题，图形空间单独出「认图形」
    if (subject === 'lifemath') subject = 'math';
    if (subject === 'expression') subject = 'hanzi';

    if (subject === 'letters') {
      const target = pick(DATA.letters);
      const wrongs = shuffle(DATA.letters.filter(x => x.u !== target.u)).slice(0, need);
      return {
        prompt: '找出字母 ' + target.u,
        speak: { text: '找出字母 ' + target.u, lang: 'zh-CN' },
        answerSay: { text: target.u + ', ' + target.word, lang: 'en-US' },
        target: target.u,
        options: shuffle([target.u, ...wrongs.map(x => x.u)])
      };
    }

    if (subject === 'pinyin') {
      const useFinal = Math.random() < 0.3;
      const group = useFinal ? DATA.pinyin.finals : DATA.pinyin.initials;
      const target = pick(group);
      const wrongs = shuffle(group.filter(x => x.p !== target.p)).slice(0, need);
      const sound = pySound(target.p);
      const local = useFinal && (DATA.pinyin.localFinals || []).indexOf(target.p) > -1;
      const audio = useFinal
        ? (local ? AudioFX.pyAudio.yun(target.p) : '')
        : AudioFX.pyAudio.sheng(target.p);
      return {
        prompt: (useFinal ? '找出韵母 ' : '找出声母 ') + target.p,
        speak: { text: (useFinal ? '找出韵母 ' : '找出声母 ') + sound, lang: 'zh-CN' },
        answerSay: { text: sound + '，' + target.word, lang: 'zh-CN', audio: audio },
        target: target.p,
        options: shuffle([target.p, ...wrongs.map(x => x.p)])
      };
    }

    if (subject === 'words') {
      const target = pick(DATA.words);
      const wrongs = shuffle(DATA.words.filter(x => x.en !== target.en)).slice(0, need);
      return {
        prompt: '找出「' + target.zh + '」的英文',
        speak: { text: '找出 ' + target.zh + ' 的英文', lang: 'zh-CN' },
        answerSay: { text: target.en, lang: 'en-US' },
        target: target.en,
        options: shuffle([target.en, ...wrongs.map(x => x.en)])
      };
    }

    if (subject === 'geometry') {
      const target = pick(DATA.shapes);
      const wrongs = shuffle(DATA.shapes.filter(s => s.id !== target.id)).slice(0, need);
      // 图形题必须给插画：小游戏里显示图形本身，而不是「爱心」这样的汉字
      const fill = pick(SHAPE_COLORS);
      const art = {};
      [target, ...wrongs].forEach(s => { art[s.zh] = shapeSvg(s.id, fill); });
      return {
        prompt: '找出「' + target.zh + '」',
        speak: { text: '找出' + target.zh, lang: 'zh-CN' },
        answerSay: { text: target.zh, lang: 'zh-CN' },
        target: target.zh,
        options: shuffle([target.zh, ...wrongs.map(s => s.zh)]),
        art: art
      };
    }

    if (subject === 'hanzi') {
      const target = pick(DATA.hanzi);
      const wrongs = shuffle(DATA.hanzi.filter(x => x.c !== target.c)).slice(0, need);
      return {
        prompt: '找出汉字 ' + target.c,
        speak: { text: '找出汉字 ' + target.c, lang: 'zh-CN' },
        answerSay: { text: target.c + '，' + target.word, lang: 'zh-CN' },
        target: target.c,
        options: shuffle([target.c, ...wrongs.map(x => x.c)])
      };
    }

    /* 自然科学：认动物 / 认植物 / 认天气 / 认身体部位 / 太空常识 */
    if (subject === 'animals' || subject === 'plants' || subject === 'body') {
      const pool = subject === 'animals' ? DATA.sciAnimals
        : subject === 'plants' ? DATA.sciPlants
          : DATA.sciBodyParts;
      const target = pick(pool);
      const wrongs = shuffle(uniqueLabels(pool.filter(x => x.zh !== target.zh), 'zh')).slice(0, need);
      const art = {};
      [target, ...wrongs].forEach(x => { if (x.emoji) art[x.zh] = x.emoji; });
      return {
        prompt: '找出「' + target.zh + '」',
        speak: { text: '找出' + target.zh, lang: 'zh-CN' },
        answerSay: { text: target.zh, lang: 'zh-CN' },
        target: target.zh,
        options: shuffle([target.zh, ...wrongs.map(x => x.zh)]),
        art: art
      };
    }

    if (subject === 'weather') {
      const target = pick(DATA.sciWeather);
      const wrongs = shuffle(DATA.sciWeather.filter(w => w.id !== target.id)).slice(0, need);
      const art = {};
      [target, ...wrongs].forEach(w => { if (w.emoji) art[w.zh] = w.emoji; });
      return {
        prompt: '找出「' + target.zh + '」',
        speak: { text: '找出' + target.zh, lang: 'zh-CN' },
        answerSay: { text: target.zh, lang: 'zh-CN' },
        target: target.zh,
        options: shuffle([target.zh, ...wrongs.map(w => w.zh)]),
        art: art
      };
    }

    if (subject === 'space') {
      const fact = pick(DATA.sciSpaceFacts);
      const label = o => (typeof o === 'string' ? o : o.zh);
      const answer = label(fact.a);
      // 干扰项用这道题自带的 w：别的题的答案可能是一整句话，混进来就不像选项了
      const wrongItems = shuffle(fact.w || []).filter(o => label(o) !== answer).slice(0, need);
      const wrongs = wrongItems.map(label);
      // 只给真正出现在选项里的图案做映射，避免多余的 art 键
      const art = {};
      [fact.a].concat(wrongItems).forEach(o => {
        if (o && typeof o === 'object' && o.emoji) art[o.zh] = o.emoji;
      });
      const q = {
        prompt: fact.q,
        speak: { text: fact.q, lang: 'zh-CN' },
        answerSay: { text: answer, lang: 'zh-CN' },
        target: answer,
        options: shuffle([answer, ...wrongs])
      };
      if (Object.keys(art).length) q.art = art;
      return q;
    }

    if (subject === 'math') {
      const kind = pick(['add', 'add', 'sub', 'mul']);
      let a, b, result, expr, sayText;
      if (kind === 'mul') {
        a = rnd(2, 5);
        b = rnd(2, 5);
        result = a * b;
        expr = a + ' × ' + b;
        sayText = a + ' 乘 ' + b + ' 等于几';
      } else if (kind === 'sub') {
        a = rnd(3, 10);
        b = rnd(1, a - 1);
        result = a - b;
        expr = a + ' - ' + b;
        sayText = a + ' 减 ' + b + ' 等于几';
      } else {
        a = rnd(1, 8);
        b = rnd(1, 10 - a);
        result = a + b;
        expr = a + ' + ' + b;
        sayText = a + ' 加 ' + b + ' 等于几';
      }
      const max = kind === 'mul' ? 25 : 12;
      const wrongs = nearbyWrongs(result, need, 0, max);
      return {
        prompt: expr + ' = ?',
        speak: { text: sayText, lang: 'zh-CN' },
        answerSay: { text: '等于 ' + result, lang: 'zh-CN' },
        target: String(result),
        options: shuffle([String(result), ...wrongs.map(String)])
      };
    }

    /* numbers：一半认数字，一半数数量 */
    const n = rnd(1, 9);
    if (Math.random() < 0.45) {
      const emoji = pick(DATA.countEmojis);
      const wrongs = nearbyWrongs(n, need, 1, 12);
      return {
        prompt: emoji.repeat(n) + ' 有几个？',
        // 小游戏棋盘只显示数字，题目区域必须把要数的图形摆出来
        promptHtml: '<span class="mini-count-row">' + pic(emoji.repeat(n)) + '</span>' +
          '<span class="mini-count-q">有几个？</span>',
        speak: { text: '数一数，有几个', lang: 'zh-CN' },
        answerSay: { text: n + ' 个', lang: 'zh-CN' },
        target: String(n),
        options: shuffle([String(n), ...wrongs.map(String)])
      };
    }
    const wrongs = nearbyWrongs(n, need, 1, 12);
    return {
      prompt: '找出数字 ' + n,
      speak: { text: '找出数字 ' + n, lang: 'zh-CN' },
      answerSay: { text: String(n), lang: 'zh-CN' },
      target: String(n),
      options: shuffle([String(n), ...wrongs.map(String)])
    };
  }

  return {
    rnd,
    pick,
    shuffle,
    normOpt,
    pic,
    makeOptions,
    say,
    TITLES,
    TYPE_NAMES,
    findStage,
    BUILDERS,
    build,
    buildSession,
    skillOf,
    adapt,
    miniQuestion,
    pySound,
    shapeSvg,
    clockSvg
  };
})();
