/* 小游戏乐园：同一套知识，装进不同的游戏里玩 —— 打地鼠、戳泡泡、翻翻乐、钓鱼听音 */
const MiniGame = (() => {
  const GAMES = {
    mole: { name: '打地鼠', icon: '🔨', color: '#e8a33d', tag: '反应力', desc: '地鼠冒出来，敲中正确答案' },
    bubble: { name: '戳泡泡', icon: '🫧', color: '#4fb6ff', tag: '观察力', desc: '戳破写着正确答案的泡泡' },
    memory: { name: '翻翻乐', icon: '🃏', color: '#8b6cff', tag: '记忆力', desc: '翻开卡片，配成一对' },
    fish: { name: '钓鱼听音', icon: '🐟', color: '#3ecf8e', tag: '听力', desc: '先听声音，再钓上正确的鱼' }
  };

  /* 难度三档：题量与干扰项随档位递增 */
  const ROUNDS = {
    mole: [8, 10, 12],
    bubble: [8, 9, 10],
    memory: [6, 7, 8],
    fish: [6, 7, 8]
  };
  const OPTS = {
    mole: [3, 4, 5],
    bubble: [4, 5, 6],
    fish: [4, 5, 6]
  };
  const MEMORY_PAIRS = 6;

  const $ = sel => document.querySelector(sel);
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

  let run = null;
  let timer = null;
  let waits = [];
  let arcadeSubject = 'numbers';
  let paused = false;
  let pausedWaits = [];

  function later(fn, ms) {
    const item = { fn, due: Date.now() + ms, id: 0 };
    item.id = setTimeout(() => {
      waits = waits.filter(x => x !== item);
      if (paused) return;
      fn();
    }, ms);
    waits.push(item);
    return item.id;
  }

  function clearWaits() {
    waits.forEach(w => clearTimeout(w.id));
    waits = [];
    pausedWaits = [];
  }

  /* 切到后台时暂停所有计时，回来再接着走，避免孩子离开时被判超时 */
  function pauseRun() {
    if (paused || !run || run.done) return;
    paused = true;
    if (timer) { clearInterval(timer); timer = null; }
    const now = Date.now();
    pausedWaits = waits.map(w => ({ fn: w.fn, left: Math.max(0, w.due - now) }));
    clearWaitsOnly();
    if (run.deadline) run.pauseLeft = Math.max(0, run.deadline - now);
    run.pauseStart = now;
    AudioFX.stopSpeak();
  }

  function resumeRun() {
    if (!paused) return;
    paused = false;
    if (run && run.pauseStart) {
      run.pausedMs = (run.pausedMs || 0) + (Date.now() - run.pauseStart);
      run.pauseStart = 0;
    }
    if (run && run.deadline && typeof run.pauseLeft === 'number') {
      run.deadline = Date.now() + run.pauseLeft;
      run.pauseLeft = 0;
    }
    const list = pausedWaits;
    pausedWaits = [];
    list.forEach(w => later(w.fn, w.left));
    if (run && !run.done && run.type === 'mole' && !timer) startMoleTimer();
  }

  function clearWaitsOnly() {
    waits.forEach(w => clearTimeout(w.id));
    waits = [];
  }

  function subjectName(key) {
    return (typeof Game !== 'undefined' && Game.SUBJECTS[key]) ? Game.SUBJECTS[key].name : '';
  }

  /* ---------- 知识 → 题目：统一复用 Quiz.miniQuestion ---------- */

  const makeQuestion = (subject, count) => Quiz.miniQuestion(subject, count);

  /* 难度：按累计玩过的小游戏局数分三档，关卡越靠后也会加一档 */
  function diffTier() {
    const st = (typeof App !== 'undefined' && App.state) ? App.state : null;
    const played = st && st.stats ? (Number(st.stats.miniGames) || 0) : 0;
    let tier = played < 8 ? 0 : played < 24 ? 1 : 2;
    if (run && Number(run.levelId) >= 10) tier = Math.min(2, tier + 1);
    return tier;
  }

  /* ---------- 通用状态 ---------- */

  function setHint(html, extra) {
    const hint = $('#mini-hint');
    if (!hint) return;
    hint.innerHTML = '<span class="mini-prompt">' + html + '</span>' +
      (extra ? '<span class="mini-timer">' + extra + '</span>' : '');
  }

  function setScore() {
    const el = $('#mini-score');
    if (!el || !run) return;
    if (run.type === 'memory') el.textContent = '🃏 ' + run.matched + '/' + run.total;
    else el.textContent = (run.type === 'fish' ? '🐟 ' : '✅ ') + run.correct + '/' + run.total;
  }

  function setProgress() {
    const fill = $('#mini-progress-fill');
    if (!fill || !run) return;
    const done = run.type === 'memory' ? run.matched : run.round;
    fill.style.width = Math.min(100, done / run.total * 100) + '%';
  }

  /* 一题结束：答错也算过了这一题，避免孩子卡在同一题 */
  function roundDone(ok) {
    if (!run || run.done) return;
    if (ok) run.correct++;
    else run.wrong++;
    run.round++;
    setScore();
    setProgress();
    if (run.round >= run.total) later(finishMini, 700);
    else later(nextRound, ok ? 560 : 980);
  }

  /* 答错：抖动 + 音效 + 说出正确答案，然后照常进入下一题 */
  function wrongTap(el) {
    if (!run || run.done) return;
    AudioFX.wrong();
    if (el) {
      el.classList.add('miss');
      later(() => el.classList.remove('miss'), 420);
    }
    if (run.question && run.question.answerSay) {
      const a = run.question.answerSay;
      later(() => {
        if (run && !run.done) AudioFX.speak(a.text, a.lang, a.audio);
      }, 240);
    }
  }

  function nextRound() {
    if (!run || run.done) return;
    if (paused) return;
    run.question = makeQuestion(run.subject, run.optCount);
    const start = {
      mole: moleRound,
      bubble: bubbleRound,
      fish: fishRound
    }[run.type];
    if (start) start();
  }

  /* ---------- 打地鼠 ---------- */

  function startMole() {
    const board = $('#mini-board');
    board.className = 'mini-board mole-board';
    board.innerHTML = Array.from({ length: 9 }, (_, i) =>
      '<button class="mole-hole" data-hole="' + i + '" aria-label="地鼠洞"><span class="mole"><em>🐹</em><b></b></span></button>').join('');

    run.round = 0;
    run.correct = 0;
    run.wrong = 0;
    run.deadline = Date.now() + (60 + run.tier * 2) * 1000;
    setScore();
    setProgress();

    board.onclick = e => {
      const hole = e.target.closest('.mole-hole');
      if (!hole || !run || run.done || run.locked || !hole.classList.contains('up')) return;
      if (hole.dataset.value === run.question.target) {
        run.locked = true;
        hole.classList.add('hit');
        AudioFX.correct();
        if (run.question.answerSay) later(() => {
          if (run && !run.done) AudioFX.speak(run.question.answerSay.text, run.question.answerSay.lang, run.question.answerSay.audio);
        }, 120);
        roundDone(true);
      } else {
        run.locked = true;
        wrongTap(hole);
        setHint('🐹 答案是 ' + run.question.target, '⏱ ' + leftSeconds() + 's');
        roundDone(false);
      }
    };

    nextRound();
    startMoleTimer();
  }

  function startMoleTimer() {
    if (timer) clearInterval(timer);
    timer = setInterval(() => {
      if (!run || run.done) return;
      const left = leftSeconds();
      const timerEl = $('#mini-hint .mini-timer');
      if (timerEl) {
        timerEl.textContent = '⏱ ' + left + 's';
        timerEl.classList.toggle('low', left <= 10);
      }
      if (left <= 0) finishMini();
    }, 500);
  }

  function leftSeconds() {
    return Math.max(0, Math.ceil((run.deadline - Date.now()) / 1000));
  }

  function moleRound() {
    run.locked = false;
    const holes = [...document.querySelectorAll('.mole-hole')];
    holes.forEach(h => {
      h.className = 'mole-hole';
      h.dataset.value = '';
      h.querySelector('b').textContent = '';
    });

    const spots = shuffle([0, 1, 2, 3, 4, 5, 6, 7, 8]).slice(0, run.optCount);
    spots.forEach((spot, i) => {
      const hole = holes[spot];
      const value = run.question.options[i];
      hole.dataset.value = value;
      hole.querySelector('em').textContent = pick(['🐹', '🐰', '🦊', '🐻']);
      hole.querySelector('b').textContent = value;
      hole.querySelector('.mole').style.animationDelay = (i * 90) + 'ms';
      hole.classList.add('up');
    });

    setHint('🔨 ' + run.question.prompt, '⏱ ' + leftSeconds() + 's');
    later(() => {
      if (run && !run.done && run.question.speak) AudioFX.speak(run.question.speak.text, run.question.speak.lang, run.question.speak.audio);
    }, 180);
    setProgress();
  }

  /* ---------- 戳泡泡 ---------- */

  function startBubble() {
    const board = $('#mini-board');
    board.className = 'mini-board bubble-board';
    board.innerHTML = Array.from({ length: run.optCount }, (_, i) =>
      '<button class="bubble" data-bubble="' + i + '" aria-label="泡泡"><span></span></button>').join('');

    run.round = 0;
    run.correct = 0;
    run.wrong = 0;
    run.locked = false;
    setScore();
    setProgress();

    board.onclick = e => {
      const b = e.target.closest('.bubble');
      if (!b || !run || run.done || run.locked || !b.classList.contains('up')) return;
      if (b.dataset.value === run.question.target) {
        run.locked = true;
        b.classList.add('pop');
        AudioFX.pop();
        AudioFX.correct();
        if (run.question.answerSay) later(() => {
          if (run && !run.done) AudioFX.speak(run.question.answerSay.text, run.question.answerSay.lang, run.question.answerSay.audio);
        }, 160);
        later(() => { if (run && !run.done) b.classList.remove('pop', 'up'); }, 520);
        roundDone(true);
      } else {
        run.locked = true;
        wrongTap(b);
        setHint('🫧 答案是 ' + run.question.target);
        roundDone(false);
      }
    };

    nextRound();
  }

  function bubbleRound() {
    run.locked = false;
    const bubbles = [...document.querySelectorAll('.bubble')];
    bubbles.forEach((b, i) => {
      b.className = 'bubble up';
      b.style.animationDelay = (i * 130) + 'ms';
      b.dataset.value = run.question.options[i];
      b.querySelector('span').textContent = run.question.options[i];
    });
    setHint('🫧 ' + run.question.prompt);
    later(() => {
      if (run && !run.done && run.question.speak) AudioFX.speak(run.question.speak.text, run.question.speak.lang, run.question.speak.audio);
    }, 150);
    setProgress();
  }

  /* ---------- 翻翻乐 ---------- */

  function memoryPairs(subject, count) {
    const total = count || MEMORY_PAIRS;
    const pairs = [];
    if (subject === 'letters') {
      shuffle(DATA.letters.slice()).slice(0, total).forEach((l, i) => {
        pairs.push({ id: i, a: l.u, b: l.l, say: { text: l.u, lang: 'en-US' } });
      });
    } else if (subject === 'words') {
      shuffle(DATA.words.slice()).slice(0, total).forEach((w, i) => {
        pairs.push({ id: i, a: w.emoji, b: w.en, say: { text: w.en, lang: 'en-US' } });
      });
    } else if (subject === 'pinyin') {
      shuffle(DATA.pinyin.syllables.slice()).slice(0, total).forEach((s, i) => {
        const audio = s.local === false ? '' : AudioFX.pyAudio.yinjie(s.p);
        pairs.push({ id: i, a: s.p, b: s.c, say: { text: s.c, lang: 'zh-CN', audio } });
      });
    } else if (subject === 'hanzi') {
      shuffle(DATA.hanzi.slice()).slice(0, total).forEach((h, i) => {
        pairs.push({ id: i, a: h.c, b: h.emoji + ' ' + h.word, say: { text: h.c + '，' + h.word, lang: 'zh-CN' } });
      });
    } else if (subject === 'math') {
      const used = new Set();
      let guard = 0;
      while (pairs.length < total && guard++ < 80) {
        const a = rnd(1, 9);
        const b = rnd(1, 10 - a);
        const key = a + '+' + b;
        if (used.has(key)) continue;
        used.add(key);
        pairs.push({
          id: pairs.length, a: a + '+' + b, b: String(a + b),
          say: { text: a + ' 加 ' + b + ' 等于 ' + (a + b), lang: 'zh-CN' }
        });
      }
    } else {
      const emojis = ['🍎', '🐣', '⭐', '🎈', '🍓', '🐟', '🌸', '🦋'];
      shuffle([1, 2, 3, 4, 5, 6, 7, 8]).slice(0, total).forEach((n, i) => {
        pairs.push({ id: i, a: String(n), b: emojis[i].repeat(n), say: { text: n + ' 个', lang: 'zh-CN' } });
      });
    }
    return pairs;
  }

  function startMemory() {
    const board = $('#mini-board');
    const pairs = memoryPairs(run.subject, run.total);
    const deck = shuffle(pairs.flatMap(p => ([
      { pair: p.id, label: p.a, say: p.say },
      { pair: p.id, label: p.b, say: p.say }
    ])));

    run.cards = deck;
    run.matched = 0;
    run.round = 0;
    run.correct = 0;
    run.wrong = 0;
    run.moves = 0;
    run.first = null;
    run.locked = false;

    board.className = 'mini-board memory-board';
    board.innerHTML = deck.map((c, i) =>
      '<button class="mem-card" data-card="' + i + '" aria-label="翻牌">' +
      '<span class="mem-inner"><span class="mem-front">' + Art.em('🌿') + '</span><span class="mem-back">' + Art.em(c.label) + '</span></span></button>').join('');

    board.onclick = e => {
      const card = e.target.closest('.mem-card');
      if (!card || !run || run.done || run.locked) return;
      if (card.classList.contains('flipped') || card.classList.contains('matched')) return;

      const idx = Number(card.dataset.card);
      const data = run.cards[idx];
      card.classList.add('flipped');
      AudioFX.pop();
      later(() => { if (run && !run.done) AudioFX.speak(data.say.text, data.say.lang, data.say.audio); }, 80);

      if (run.first === null) {
        run.first = idx;
        setHint('🌿 再翻一张，找到它的好朋友', '已翻 ' + run.moves + ' 次');
        return;
      }

      run.moves++;
      const firstIdx = run.first;
      run.first = null;
      const firstCard = document.querySelector('.mem-card[data-card="' + firstIdx + '"]');
      const first = run.cards[firstIdx];

      if (first.pair === data.pair) {
        firstCard.classList.add('matched');
        card.classList.add('matched');
        run.matched++;
        run.correct = run.matched;
        AudioFX.correct();
        setScore();
        setProgress();
        setHint('🎉 配对成功！' + data.label, '已翻 ' + run.moves + ' 次');
        if (run.matched >= run.total) later(finishMini, 700);
      } else {
        run.locked = true;
        run.wrong++;
        AudioFX.wrong();
        later(() => {
          if (!run || run.done) return;
          firstCard.classList.remove('flipped');
          card.classList.remove('flipped');
          run.locked = false;
          setHint('🌿 再找找看，它们不是一对', '已翻 ' + run.moves + ' 次');
        }, 780);
      }
    };

    setHint('🌿 翻开两张卡片，找出配对的好朋友', '已翻 0 次');
    setScore();
    setProgress();
  }

  /* ---------- 钓鱼听音 ---------- */

  function startFish() {
    const board = $('#mini-board');
    board.className = 'mini-board fish-board';
    board.innerHTML = Array.from({ length: run.optCount }, (_, i) =>
      '<button class="fish-cell" data-fish="' + i + '" aria-label="小鱼">' +
      '<span class="fish-emoji">🐟</span><span class="fish-value"></span></button>').join('');

    run.round = 0;
    run.correct = 0;
    run.wrong = 0;
    run.locked = false;
    setScore();
    setProgress();

    board.onclick = e => {
      const cell = e.target.closest('.fish-cell');
      if (!cell || !run || run.done || run.locked || !cell.classList.contains('up')) return;
      if (cell.dataset.value === run.question.target) {
        run.locked = true;
        cell.classList.add('caught');
        cell.querySelector('.fish-emoji').textContent = '🎣';
        AudioFX.correct();
        if (run.question.answerSay) later(() => {
          if (run && !run.done) AudioFX.speak(run.question.answerSay.text, run.question.answerSay.lang, run.question.answerSay.audio);
        }, 140);
        roundDone(true);
      } else {
        run.locked = true;
        wrongTap(cell);
        setHint('🎣 正确答案是 ' + run.question.target);
        roundDone(false);
      }
    };

    nextRound();
  }

  function fishRound() {
    run.locked = false;
    const cells = [...document.querySelectorAll('.fish-cell')];
    cells.forEach((c, i) => {
      c.className = 'fish-cell up';
      c.style.animationDelay = (i * 150) + 'ms';
      c.dataset.value = run.question.options[i];
      c.querySelector('.fish-emoji').textContent = '🐟';
      c.querySelector('.fish-value').textContent = run.question.options[i];
    });

    const hint = $('#mini-hint');
    if (hint) {
      hint.innerHTML = '<span class="mini-prompt">🎧 听一听，钓上正确的答案</span>' +
        '<button class="mini-replay" data-mini-replay>🔊 再听一遍</button>';
    }
    later(() => {
      if (run && !run.done && run.question.speak) AudioFX.speak(run.question.speak.text, run.question.speak.lang, run.question.speak.audio);
    }, 320);
    setProgress();
  }

  function replayFish() {
    if (!run || run.done || !run.question) return;
    AudioFX.speak(run.question.speak.text, run.question.speak.lang, run.question.speak.audio);
  }

  /* ---------- 启动与结算 ---------- */

  function start(type, opts = {}) {
    cleanup();
    if (!GAMES[type]) type = 'mole';
    const subject = DATA.curriculum[opts.subject] ? opts.subject : 'numbers';
    run = {
      type,
      subject,
      levelId: opts.levelId || 0,
      branchId: opts.branchId || '',
      fromArcade: !!opts.fromArcade,
      round: 0,
      correct: 0,
      wrong: 0,
      matched: 0,
      tier: 0,
      total: MEMORY_PAIRS,
      optCount: 3,
      done: false,
      stars: 0,
      startAt: Date.now(),
      pausedMs: 0
    };
    run.tier = diffTier();
    run.total = ROUNDS[type][run.tier];
    run.optCount = OPTS[type] ? OPTS[type][run.tier] : 0;
    arcadeSubject = subject;

    $('#mini-result').className = 'mini-result';
    $('#mini-result').innerHTML = '';
    $('#mini-progress-fill').style.width = '0%';
    $('#mini-score').textContent = type === 'memory' ? '🃏 0/' + run.total : '✅ 0/' + run.total;
    $('#mini-name').textContent = GAMES[type].name + (subjectName(subject) ? ' · ' + subjectName(subject) : '');

    App.show('minigame');
    ({ mole: startMole, bubble: startBubble, memory: startMemory, fish: startFish })[type]();
  }

  function starsFor() {
    const total = run.total;
    if (run.type === 'memory') {
      return run.moves <= total + 3 ? 3 : run.moves <= total + 7 ? 2 : 1;
    }
    if (run.type === 'mole') {
      if (run.correct >= total) return 3;
      if (run.correct >= total - 1) return 2;
      if (run.correct >= total - 2) return 1;
      return 0;
    }
    if (run.type === 'bubble') {
      return run.wrong <= 1 ? 3 : run.wrong <= 3 ? 2 : run.wrong <= 6 ? 1 : 0;
    }
    return run.wrong === 0 ? 3 : run.wrong <= 2 ? 2 : 1;
  }

  function finishMini() {
    if (!run || run.done) return;
    run.done = true;
    paused = false;
    clearInterval(timer);
    timer = null;
    clearWaits();
    AudioFX.stopSpeak();

    const stars = starsFor();
    run.stars = stars;
    const correct = Math.min(run.correct, run.total);
    const seconds = Math.max(1, Math.round((Date.now() - run.startAt - (run.pausedMs || 0)) / 1000));

    const res = App.finishMini({
      type: run.type,
      subject: run.subject,
      correct,
      total: run.total,
      stars,
      seconds,
      levelId: run.levelId,
      branchId: run.branchId
    });

    const detail = run.type === 'memory'
      ? '翻了 ' + run.moves + ' 次，配成 ' + run.matched + '/' + run.total + ' 对'
      : run.type === 'fish'
        ? '钓上 ' + correct + '/' + run.total + ' 条小鱼，失误 ' + run.wrong + ' 次'
        : run.type === 'bubble'
          ? '戳破 ' + correct + '/' + run.total + ' 个泡泡，失误 ' + run.wrong + ' 次'
          : '敲对 ' + correct + '/' + run.total + ' 只地鼠';

    const backLabel = run.fromArcade ? '换一个游戏' : (run.levelId || run.branchId) ? '回到地图' : '回到乐园';
    const box = $('#mini-result');
    box.innerHTML = '<div class="mini-result-card">' +
      '<div class="mini-result-stars">' + [1, 2, 3].map(i =>
        Art.ui(i <= stars ? 'star' : 'star-off')).join('') + '</div>' +
      '<h3>' + (stars === 3 ? '完美！' : stars > 0 ? '玩得真棒！' : '再来一次吧～') + '</h3>' +
      '<p>' + detail + '</p>' +
      '<div class="mini-result-rewards">' +
        '<span>🌰 +' + res.coins + '</span><span>💗 +' + res.exp + '</span>' +
        (res.level && res.level.newClear ? '<span>🗺️ 首次通关 +20</span>' : '') +
        (res.branchCoins ? '<span>🎁 支线奖励 +' + res.branchCoins + '</span>' : '') +
        (res.leveledUp ? '<span>🎉 升级啦</span>' : '') +
      '</div>' +
      '<div class="mini-result-actions">' +
        '<button class="btn btn-green" id="mini-again">再玩一次</button>' +
        '<button class="btn btn-yellow" id="mini-back">' + backLabel + '</button>' +
      '</div>' +
    '</div>';
    box.classList.add('show');
    AudioFX.levelUp();
  }

  /* ---------- 小游戏乐园 ---------- */

  function renderArcade() {
    const subs = $('#arcade-subjects');
    const grid = $('#arcade-grid');
    const tip = $('#arcade-tip');
    if (!subs || !grid) return;

    subs.innerHTML = Object.keys(DATA.curriculum).map(k => {
      const c = DATA.curriculum[k];
      return '<button class="arcade-subject ' + (k === arcadeSubject ? 'active' : '') + '" data-arcade-subject="' + k + '" style="--c:' + c.color + '">' +
        '<span>' + Art.em(c.icon) + '</span>' + c.name + '</button>';
    }).join('');

    grid.innerHTML = Object.keys(GAMES).map(k => {
      const g = GAMES[k];
      return '<button class="arcade-card" data-arcade-game="' + k + '" style="--c:' + g.color + '">' +
        '<span class="arcade-emoji">' + Art.em(g.icon) + '</span>' +
        '<b>' + g.name + '</b>' +
        '<small>' + g.desc + '</small>' +
        '<span class="arcade-tag">' + g.tag + '</span>' +
        '<span class="arcade-go">开始 →</span>' +
      '</button>';
    }).join('');

    if (tip) {
      const c = DATA.curriculum[arcadeSubject];
      tip.textContent = '现在装进游戏的知识：' + (c ? c.name + ' · ' + c.tag : '数字乐园');
    }
  }

  function open() {
    cleanup();
    if (!DATA.curriculum[arcadeSubject]) arcadeSubject = 'numbers';
    renderArcade();
    App.show('arcade');
  }

  /* ---------- 事件 ---------- */

  function bind() {
    document.addEventListener('visibilitychange', () => {
      if (!run || run.done) return;
      if (document.hidden) pauseRun();
      else resumeRun();
    });

    document.addEventListener('click', e => {
      const sub = e.target.closest('[data-arcade-subject]');
      if (sub) {
        arcadeSubject = sub.dataset.arcadeSubject;
        AudioFX.click();
        renderArcade();
        return;
      }

      const game = e.target.closest('[data-arcade-game]');
      if (game) {
        AudioFX.click();
        start(game.dataset.arcadeGame, { subject: arcadeSubject, fromArcade: true });
        return;
      }

      if (e.target.closest('[data-mini-replay]')) {
        replayFish();
        return;
      }

      if (e.target.closest('#btn-mini-quit')) {
        if (!run) { App.show('home'); return; }
        const fromArcade = run.fromArcade;
        const fromMap = !!(run.levelId || run.branchId);
        if (run.done) {
          cleanup();
          if (fromArcade) { renderArcade(); App.show('arcade'); }
          else App.show(fromMap ? 'map' : 'home');
          return;
        }
        pauseRun();
        App.confirm({
          title: '要退出这一局吗？',
          text: '这一局的成绩不会保存哦',
          ok: '退出',
          cancel: '继续玩'
        }).then(ok => {
          if (!ok) { resumeRun(); return; }
          cleanup();
          if (fromArcade) { renderArcade(); App.show('arcade'); }
          else App.show(fromMap ? 'map' : 'home');
        });
        return;
      }

      if (e.target.closest('#mini-again')) {
        if (!run) return App.show('home');
        const { type, subject, levelId, branchId, fromArcade } = run;
        start(type, { subject, levelId, branchId, fromArcade });
        return;
      }

      if (e.target.closest('#mini-back')) {
        const goArcade = run && run.fromArcade;
        const fromMap = run && (run.levelId || run.branchId);
        cleanup();
        if (goArcade) { renderArcade(); App.show('arcade'); }
        else App.show(fromMap ? 'map' : 'home');
      }
    });
  }

  function cleanup() {
    clearInterval(timer);
    timer = null;
    clearWaits();
    paused = false;
    pausedWaits = [];
    AudioFX.stopSpeak();
    run = null;
    const board = $('#mini-board');
    if (board) board.onclick = null;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bind);
  } else {
    bind();
  }

  return {
    open,
    start,
    cleanup,
    info: () => (run ? { type: run.type, subject: run.subject, levelId: run.levelId } : null)
  };
})();
