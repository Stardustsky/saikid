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
    hzListen: ['听一听，是哪个字？', '听到的是哪个汉字？']
  };
  const tv = (type, base) => pick(TITLES[type] || [base]);

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
    const wrong = shuffle(pool.filter(x => x.en !== item.en)).slice(0, 3).map(x => x.en);
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
    const wrong = shuffle(pool.filter(x => x.en !== item.en)).slice(0, 3);
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
    const wrong = shuffle(pool.filter(x => x.emoji !== item.emoji)).slice(0, 3);
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
    const wrong = shuffle(all.filter(x => x.p !== item.p)).slice(0, 3).map(x => x.p);
    return {
      key: 'py-ini-' + item.p,
      title: tv('pyInitial', '听一听，它的声母是哪个？'),
      visual: `<div class="big-emoji">${pic(item.emoji)}</div><div class="visual-note">${item.word}</div>`,
      speak: { text: item.word, lang: 'zh-CN' },
      speakAnswer: { text: (DATA.pinyin.initialSay || {})[item.p] || item.p, lang: 'zh-CN', audio: AudioFX.pyAudio.sheng(item.p) },
      options: makeOptions(item.p, wrong),
      answer: item.p,
      hint: '「' + item.word + '」开头的声母是 ' + item.p
    };
  }

  function qPyFinal(st) {
    const all = DATA.pinyin.finals;
    const g = st.group || [0, all.length - 1];
    const pool = all.slice(g[0], g[1] + 1);
    const item = pick(pool);
    const wrong = shuffle(all.filter(x => x.p !== item.p)).slice(0, 3).map(x => x.p);
    const local = (DATA.pinyin.localFinals || []).indexOf(item.p) > -1;
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
      options: makeOptions(item.p, wrong.length ? wrong : ['a', 'o', 'e']),
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
    const wrong = shuffle(pool.filter(x => x.p !== item.p)).slice(0, 3).map(x => x.p);
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
    hzListen: qHzListen
  };

  /* 出一题：type 缺省时从阶段的 qtypes 里随机 */
  function build(type, st) {
    const t = type || pick(st.qtypes);
    const b = BUILDERS[t];
    if (!b) return null;
    const q = b(st);
    if (q) q.type = t;
    return q;
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
    findStage,
    BUILDERS,
    build,
    buildSession,
    miniQuestion,
    pySound
  };
})();
