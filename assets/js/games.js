/* 六大学科的游戏引擎：按「阶段」出题，从认识 → 练习 → 综合 */
const Game = (() => {
  // 学科元信息直接来自课程体系，保证首页、关卡、家长中心一致
  const SUBJECTS = {};
  Object.keys(DATA.curriculum).forEach(k => {
    const c = DATA.curriculum[k];
    SUBJECTS[k] = { key: k, name: c.name, icon: c.icon, color: c.color, tag: c.tag };
  });

  const STAGE_TOTAL = 8;   // 阶段练习：比闯关略短，幼儿更容易完成
  const MAP_TOTAL = 10;    // 闯关模式
  const PRAISE = [
    '太棒啦！', '答对啦！', '真聪明！', '好厉害！', '完全正确！',
    '你真棒！', '想得真快！', '这道题难不倒你！', '眼睛真亮！', '继续保持！'
  ];

  let session = null;
  let locked = false;
  let mainTimer = null;
  let advanceTimer = null;

  // 每关的场景：让「数字草地」「字母小镇」这些名字真的能看见
  // 数组项 = [emoji, left%, bottom%, 字号]
  const SCENES = {
    numbers: [
      ['☁️', 12, 62, 26], ['☁️', 76, 68, 20], ['🌳', 86, 6, 38],
      ['🌼', 24, 6, 26], ['🌱', 48, 4, 22], ['🦋', 62, 48, 22]
    ],
    letters: [
      ['☁️', 16, 64, 24], ['🌳', 92, 4, 32],
      ['🏠', 18, 4, 34], ['🏘️', 45, 7, 40], ['🏫', 72, 4, 36], ['🚲', 60, 30, 20]
    ],
    words: [
      ['☁️', 22, 66, 22],
      ['🌷', 12, 5, 30], ['🌻', 33, 4, 32], ['🌸', 54, 6, 28],
      ['🌷', 74, 5, 30], ['🦋', 88, 44, 24]
    ],
    math: [
      ['☁️', 82, 64, 22],
      ['⚙️', 16, 5, 34], ['🔧', 40, 8, 28], ['🪵', 64, 4, 34],
      ['🧮', 86, 8, 30], ['📐', 30, 42, 22]
    ],
    pinyin: [
      ['☁️', 14, 64, 22],
      ['🎵', 16, 38, 26], ['🎶', 40, 50, 22], ['🍃', 8, 4, 26],
      ['🌿', 30, 4, 24], ['🪵', 70, 5, 30]
    ],
    hanzi: [
      ['☁️', 82, 66, 20],
      ['🌲', 10, 3, 40], ['🌳', 32, 5, 36], ['🌲', 58, 3, 44],
      ['🍄', 74, 5, 24], ['🦌', 90, 8, 28]
    ],
    review: [
      ['☁️', 20, 64, 20],
      ['📕', 16, 5, 30], ['✏️', 40, 6, 26], ['📚', 62, 4, 32],
      ['🧽', 84, 7, 24], ['⭐', 52, 42, 22]
    ],
    geometry: [
      ['☁️', 14, 66, 22],
      ['🔺', 12, 6, 30], ['🟦', 34, 4, 28], ['🟡', 56, 7, 26],
      ['📐', 78, 5, 30], ['📏', 90, 32, 24]
    ],
    lifemath: [
      ['☁️', 84, 64, 22],
      ['🕐', 14, 6, 28], ['🪙', 34, 5, 26], ['⚖️', 56, 6, 28],
      ['📏', 76, 5, 28], ['🛒', 90, 34, 26]
    ],
    expression: [
      ['☁️', 18, 66, 22],
      ['💬', 14, 6, 30], ['🎤', 36, 5, 28], ['🎵', 58, 7, 26],
      ['📖', 78, 5, 30], ['✍️', 90, 34, 24]
    ],
    animals: [
      ['☁️', 16, 68, 22],
      ['🌳', 90, 4, 36], ['🦁', 14, 5, 30], ['🐰', 36, 6, 26],
      ['🐘', 58, 4, 32], ['🦋', 48, 46, 22]
    ],
    plants: [
      ['☁️', 22, 66, 22],
      ['🌳', 12, 4, 38], ['🌻', 36, 6, 30], ['🌱', 56, 4, 26],
      ['🍄', 74, 5, 24], ['🌷', 88, 6, 28]
    ],
    weather: [
      ['☀️', 14, 62, 34], ['☁️', 40, 68, 30],
      ['🌧️', 68, 60, 28], ['🌈', 90, 40, 32], ['❄️', 20, 30, 22]
    ],
    space: [
      ['🌙', 14, 60, 28], ['⭐', 36, 70, 20], ['🚀', 58, 40, 30],
      ['🪐', 82, 62, 28], ['🌍', 90, 34, 24]
    ],
    body: [
      ['☁️', 80, 66, 20],
      ['👁️', 14, 6, 28], ['👂', 36, 5, 28], ['👃', 56, 7, 26],
      ['🖐️', 76, 5, 28], ['🦷', 90, 32, 24]
    ]
  };

  function paintScene(key) {
    const scr = $('#screen-game');
    if (!scr) return;
    const scene = SCENES[key] ? key : 'numbers';
    scr.dataset.scene = scene;
    const deco = $('#scene-deco');
    if (!deco) return;
    deco.innerHTML = SCENES[scene].map(([e, x, y, s]) =>
      '<span class="scene-item" style="left:' + x + '%;bottom:' + y + '%;font-size:' + s + 'px">' + Art.em(e) + '</span>'
    ).join('');
  }

  const $ = sel => document.querySelector(sel);
  const $$ = sel => [...document.querySelectorAll(sel)];

  /* ---------- 开场剧情：先由小龙猫交任务，再开始答题 ---------- */
  // 不识字的孩子也能玩：语音把任务讲一遍，图形步骤代替文字说明
  const INTROS = {
    numbers: { tag: '🐾 数一数任务', line: '小龙猫的橡果滚得满地都是，快帮我数一数吧！', steps: ['👂 听题目', '👆 点数字', '⭐ 得星星'] },
    letters: { tag: '🐾 字母小镇', line: '字母小镇的路牌乱啦，帮我找出正确的字母吧！', steps: ['👂 听发音', '👆 点字母', '⭐ 得星星'] },
    words: { tag: '🐾 词语花园', line: '词语花园开花啦，看看图片说的是哪个词？', steps: ['👂 听词语', '👆 点图片', '⭐ 得星星'] },
    math: { tag: '🐾 算术工坊', line: '小扳手和小钉子都准备好啦，我们一起来算一算！', steps: ['👂 听题目', '👆 点数字', '⭐ 得星星'] },
    geometry: { tag: '🐾 图形王国', line: '图形王国在开派对，帮我找出正确的形状吧！', steps: ['👀 看形状', '👆 点图片', '⭐ 得星星'] },
    lifemath: { tag: '🐾 生活小帮手', line: '买东西、看时间，生活里到处都有小本领哦！', steps: ['👂 听情景', '👆 点答案', '⭐ 得星星'] },
    pinyin: { tag: '🐾 拼音小路', line: '拼音小路上有好多声音，跟着我一起读一读！', steps: ['👂 听声音', '👆 点拼音', '⭐ 得星星'] },
    hanzi: { tag: '🐾 汉字小站', line: '这些小汉字在躲猫猫，我念你来找！', steps: ['👂 听字音', '👆 点汉字', '⭐ 得星星'] },
    expression: { tag: '🐾 小小表达家', line: '心里的话怎么说出来？我们一起练一练！', steps: ['👂 听情景', '👆 点图片', '⭐ 得星星'] },
    animals: { tag: '🐾 动物朋友', line: '动物朋友们来玩啦，你认识它们吗？', steps: ['👀 看图片', '👆 点答案', '⭐ 得星星'] },
    plants: { tag: '🐾 植物小园丁', line: '花花草草都长大啦，帮我认一认它们！', steps: ['👀 看图片', '👆 点答案', '⭐ 得星星'] },
    weather: { tag: '🐾 天气观察员', line: '今天是什么天气？我们一起去看看！', steps: ['👀 看天空', '👆 点答案', '⭐ 得星星'] },
    space: { tag: '🐾 太空探险', line: '飞船要出发啦，答对问题就能飞到下一颗星球！', steps: ['👂 听任务', '👆 点答案', '⭐ 得星星'] },
    body: { tag: '🐾 身体小秘密', line: '我们的身体真神奇，一起来认识它吧！', steps: ['👀 看图片', '👆 点答案', '⭐ 得星星'] },
    review: { tag: '📕 错题小复习', line: '这几道题上次没答对，我们再来试一次，你一定可以的！', steps: ['👂 听题目', '👆 点答案', '💪 越练越棒'] },
    placement: { tag: '🎯 起点小测评', line: '我们先玩几道小题，看看从哪里开始最合适～', steps: ['👂 听题目', '👆 点答案', '🎯 找到起点'] },
    skip: { tag: '🚩 跳关挑战', line: '这一关有点难，答对大半就能直接解锁！', steps: ['👂 听题目', '👆 点答案', '🔓 解锁关卡'] }
  };

  let intro = null;
  // 同一段剧情只详细讲一次，之后再来就只留一句招呼，避免每次都挡路
  let introSeen = {};

  function petLevelSafe() {
    const p = App.state && App.state.pet;
    return Math.max(1, (p && p.level) || 1);
  }

  function introFor(sess) {
    if (sess.review) return INTROS.review;
    if (sess.kind === 'placement') return INTROS.placement;
    if (sess.kind === 'skip') {
      return {
        tag: '🚩 跳关挑战',
        line: '这一关叫「' + sess.stage.name + '」，答对大半就能直接解锁！',
        steps: INTROS.skip.steps
      };
    }
    return INTROS[sess.key] || INTROS.numbers;
  }

  function cancelIntro() {
    if (!intro) return;
    clearTimeout(intro.timer);
    clearTimeout(intro.auto);
    clearTimeout(intro.auto2);
    intro = null;
    const box = $('#quest-intro');
    if (box) {
      box.hidden = true;
      box.classList.remove('show', 'out');
    }
  }

  function showIntro(cfg, done) {
    const box = $('#quest-intro');
    if (!box || !cfg) { done(); return; }
    cancelIntro();

    const seenKey = (cfg.tag || '') + '|' + (cfg.line || '');
    const repeat = !!introSeen[seenKey];
    introSeen[seenKey] = true;

    const pet = $('#quest-pet');
    if (pet) pet.innerHTML = Pet.svg(petLevelSafe(), 'ok');
    const tag = $('#quest-tag');
    if (tag) tag.textContent = cfg.tag || '🐾 小龙猫的任务';
    const line = $('#quest-line');
    if (line) line.textContent = cfg.line;
    const steps = $('#quest-steps');
    if (steps) {
      // 第二次起不再重复三步演示，卡片更短
      const list = repeat ? [] : (cfg.steps && cfg.steps.length ? cfg.steps : ['👂 听题目', '👆 点答案', '⭐ 得星星']);
      steps.innerHTML = list.map((s, i) =>
        '<span class="quest-step" style="animation-delay:' + (0.18 + i * 0.14).toFixed(2) + 's">' + s + '</span>'
      ).join('');
      steps.hidden = !list.length;
    }

    box.hidden = false;
    void box.offsetWidth;
    box.classList.remove('out');
    box.classList.add('show');

    const self = { timer: null, auto: null, auto2: null, done: false, finish: null };
    intro = self;

    function finish() {
      if (self.done) return;
      self.done = true;
      clearTimeout(self.timer);
      clearTimeout(self.auto);
      clearTimeout(self.auto2);
      AudioFX.stopSpeak();
      if (intro === self) intro = null;
      box.classList.remove('show');
      box.classList.add('out');
      setTimeout(() => {
        // 期间若已经开始了新的一局，就别把它藏起来
        if (!box.classList.contains('show')) {
          box.hidden = true;
          box.classList.remove('out');
        }
      }, 300);
      setTimeout(done, 260);
    }
    self.finish = finish;

    // 整块都可以点，孩子不用去找按钮
    box.onclick = finish;

    if (AudioFX.hasVoice()) {
      self.timer = setTimeout(() => {
        AudioFX.speakCat(cfg.line, { done: () => { self.auto = setTimeout(finish, 900); } });
      }, 260);
      self.auto2 = setTimeout(finish, 14000);
    } else {
      self.auto2 = setTimeout(finish, 6500);
    }
  }

  /* ---------- 会话流程 ---------- */

  // stageId：课程阶段；levelId：闯关关卡（0 表示自由练习）
  function start(subjectKey, stageId, levelId) {
    const st = Quiz.findStage(subjectKey, stageId);
    if (!st) return;
    App.maybeGuide(subjectKey, () => begin(st, levelId || 0));
  }

  function startStage(subjectKey, stageId) {
    start(subjectKey, stageId, 0);
  }

  /* 按年龄档 + 近期正确率微调难度，并限制一局题量 */
  function tuneStage(stage) {
    const band = App.bandInfo ? App.bandInfo() : null;
    const accuracy = App.recentAccuracy ? App.recentAccuracy(stage.subject) : null;
    return Quiz.adapt ? Quiz.adapt(stage, accuracy, band) : stage;
  }

  function bandCap(base) {
    const band = App.bandInfo ? App.bandInfo() : null;
    const cap = (band && band.cap) || base;
    return Math.max(3, Math.min(base, cap));
  }

  function begin(stage, levelId) {
    AudioFX.unlock();
    const tuned = tuneStage(stage);
    const total = bandCap(levelId ? MAP_TOTAL : STAGE_TOTAL);
    const questions = Quiz.buildSession(tuned, total).map(q => {
      q.subject = stage.subject;
      q.tries = 0;
      return q;
    });
    if (!questions.length) {
      App.toast('这个关卡暂时没有题目，换一个试试吧～');
      return;
    }

    session = {
      key: stage.subject,
      subject: SUBJECTS[stage.subject],
      stage,
      tunedStage: tuned,
      stageId: stage.id,
      levelId: levelId || 0,
      index: 0,
      correct: 0,
      firstTry: 0,
      combo: 0,
      bestCombo: 0,
      startedAt: Date.now(),
      answers: [],
      questions,
      review: false
    };
    locked = false;
    App.markDay();

    const head = $('#stage-name');
    if (head) head.textContent = stage.name;
    paintScene(stage.subject);
    App.show('game');
    showIntro(introFor(session), renderQuestion);
  }

  /* 错题复习：用错题本里的题目快照重建一局 */
  function startReview() {
    const items = App.dueReview(12);
    if (!items.length) {
      App.toast('现在没有要复习的错题，真棒！');
      return;
    }
    AudioFX.unlock();
    const questions = items.map(it => {
      const pool = (it.options && it.options.length ? it.options : [{ label: it.answer }]);
      return {
        key: 'rv-' + it.id,
        wrongId: it.id,
        type: it.type || 'review',
        subject: it.subject,
        answer: it.answer,
        title: it.title,
        visual: it.visual || '',
        speak: it.speak || null,
        speakAnswer: it.speak || null,
        hint: it.hint || '',
        tries: 0,
        options: Quiz.shuffle(pool.map(o => ({
          label: o.label,
          html: o.html || '',
          say: o.say || '',
          lang: o.lang || '',
          audio: o.audio || '',
          correct: o.label === it.answer
        })))
      };
    });

    session = {
      key: 'review',
      subject: { name: '错题复习', icon: '📕', color: '#e2705a' },
      stage: { id: 'review', name: '错题复习', icon: '📕' },
      stageId: 'review',
      levelId: 0,
      index: 0,
      correct: 0,
      firstTry: 0,
      combo: 0,
      bestCombo: 0,
      startedAt: Date.now(),
      answers: [],
      questions,
      review: true
    };
    locked = false;
    App.markDay();

    const head = $('#stage-name');
    if (head) head.textContent = '错题复习';
    paintScene('review');
    App.show('game');
    showIntro(introFor(session), renderQuestion);
  }

  /* 起点测评：每个科目抽几题，判断适合的年龄档与起点 */
  function startPlacement() {
    AudioFX.unlock();
    const picks = [];
    ['math', 'hanzi', 'words'].forEach(key => {
      const c = DATA.curriculum[key];
      const st = c && c.stages[0];
      if (!st) return;
      const tuned = tuneStage(Object.assign({ subject: key }, st));
      Quiz.buildSession(tuned, 3).forEach(q => {
        q.subject = key;
        q.tries = 0;
        picks.push(q);
      });
    });
    if (!picks.length) {
      App.toast('暂时没法开始测评，先去玩一关吧～');
      return;
    }
    session = {
      key: 'placement',
      subject: { name: '起点测评', icon: '🎯', color: '#7aa7d8' },
      stage: { id: 'placement', name: '起点测评', icon: '🎯' },
      stageId: 'placement',
      levelId: 0,
      index: 0,
      correct: 0,
      firstTry: 0,
      combo: 0,
      bestCombo: 0,
      startedAt: Date.now(),
      answers: [],
      questions: picks,
      review: false,
      kind: 'placement'
    };
    locked = false;
    App.markDay();

    const head = $('#stage-name');
    if (head) head.textContent = '起点测评';
    paintScene('numbers');
    App.show('game');
    showIntro(introFor(session), renderQuestion);
  }

  /* 跳关测评：直接挑战某个阶段，答对够多就解锁到这一关 */
  function startSkip(subjectKey, stageId) {
    const st = Quiz.findStage(subjectKey, stageId);
    if (!st) return;
    AudioFX.unlock();
    const tuned = tuneStage(st);
    const questions = Quiz.buildSession(tuned, bandCap(MAP_TOTAL)).map(q => {
      q.subject = st.subject;
      q.tries = 0;
      return q;
    });
    if (!questions.length) {
      App.toast('这个关卡暂时没有题目，换一个试试吧～');
      return;
    }
    session = {
      key: st.subject,
      subject: SUBJECTS[st.subject],
      stage: st,
      tunedStage: tuned,
      stageId: st.id,
      levelId: 0,
      index: 0,
      correct: 0,
      firstTry: 0,
      combo: 0,
      bestCombo: 0,
      startedAt: Date.now(),
      answers: [],
      questions,
      review: false,
      kind: 'skip'
    };
    locked = false;
    App.markDay();

    const head = $('#stage-name');
    if (head) head.textContent = '跳关测评 · ' + st.name;
    paintScene(st.subject);
    App.show('game');
    showIntro(introFor(session), renderQuestion);
  }

  /* 选项点读：不识字的孩子点小喇叭就能听，不用大人陪 */
  function sayLang(text) {
    return /^[A-Za-z][A-Za-z'’\- ]*$/.test(String(text || '')) ? 'en-US' : 'zh-CN';
  }

  function sayBadge(opt) {
    const label = String(opt && opt.label != null ? opt.label : '').trim();
    const frag = document.createElement('span');
    // 图片型 / 长句选项不加喇叭，避免读出乱码（ü 与声调符号属于拼音，要放行）
    if (!label || label.length > 12 || /[^\w\u4e00-\u9fa5üÜāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ'’\- ]/.test(label)) return frag;
    frag.className = 'opt-say';
    frag.setAttribute('role', 'button');
    frag.setAttribute('tabindex', '0');
    frag.setAttribute('aria-label', '读一读 ' + label);
    frag.textContent = '🔊';
    // 拼音选项会自带中文读音与真人音频，避免裸字母被当成英文读成「B」
    const speakText = String(opt.say || label);
    const speakLang = opt.lang || sayLang(speakText);
    const speakAudio = opt.audio || '';
    const fire = e => {
      e.preventDefault();
      e.stopPropagation();
      AudioFX.speak(speakText, speakLang, speakAudio);
    };
    frag.addEventListener('click', fire);
    frag.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') fire(e);
    });
    return frag;
  }

  /* 答错后补一道同类小题，当场把知识点补回来 */
  function remedialFor(q) {
    const st = session && session.tunedStage;
    if (!st || !Array.isArray(st.qtypes) || st.qtypes.indexOf(q.type) < 0) return null;
    const band = App.bandInfo ? App.bandInfo() : null;
    const low = Quiz.adapt ? Quiz.adapt(st, 0.4, band) : st;
    const easy = Object.assign({}, low, {
      max: Math.max(1, Math.round((low.max || 5) * 0.6))
    });
    for (let i = 0; i < 5; i++) {
      const extra = Quiz.build(q.type, easy);
      if (!extra || extra.key === q.key) continue;
      extra.subject = session.key;
      extra.tries = 0;
      extra.remedial = true;
      return extra;
    }
    return null;
  }

  /* 局内自适应：最近几题的表现决定下一题难度，整局不会一路太难或一路太简单 */
  function sessionAcc(n) {
    const list = session.answers.slice(-n);
    if (!list.length) return null;
    return list.filter(a => a.ok).length / list.length;
  }

  function retuneNext() {
    if (!session || session.review || session.kind) return;
    const st = session.tunedStage;
    if (!st || typeof st.max !== 'number') return;
    const i = session.index + 1;
    const q = session.questions[i];
    if (!q || q.remedial || q.tuned) return;
    if (!Array.isArray(st.qtypes) || st.qtypes.indexOf(q.type) < 0) return;
    if (session.answers.length < 3) return;

    const acc = sessionAcc(4);
    if (acc == null) return;
    const band = App.bandInfo ? App.bandInfo() : null;
    let stage = null;

    if (acc <= 0.5) {
      // 连错：换成同一知识点的小数字题
      const low = Quiz.adapt ? Quiz.adapt(st, 0.4, band) : st;
      stage = Object.assign({}, low, { max: Math.max(2, Math.round((low.max || 5) * 0.75)) });
      if (!session.softened) {
        session.softened = true;
        App.toast('小龙猫把题目变简单一点点啦～');
      }
    } else if (acc >= 1 && session.answers.length >= 4) {
      // 连续一次答对：小幅加难，但不越过年龄档上限
      const base = typeof session.stage.max === 'number' ? session.stage.max : st.max;
      const cap = (band && band.cap) || 99;
      const max = Math.min(cap, Math.max(st.max, Math.round(base * 1.15)));
      if (max <= st.max) return;
      stage = Object.assign({}, st, { max: max });
    } else {
      return;
    }

    for (let n = 0; n < 5; n++) {
      const alt = Quiz.build(q.type, stage);
      if (!alt || alt.key === q.key) continue;
      alt.subject = q.subject;
      alt.tries = 0;
      alt.tuned = true;
      session.questions[i] = alt;
      return;
    }
  }

  /* ---------- 题中向导：告诉孩子「这一步要做什么」 ---------- */
  const GUIDE = {
    listen: { icon: '👂', line: '听一听，选出你听到的' },
    count: { icon: '🔢', line: '数一数，点出正确的答案' },
    science: { icon: '👀', line: '看一看，选出你知道的' },
    story: { icon: '📖', line: '听我读，再选出答案' },
    stroke: { icon: '✍️', line: '想一想笔顺，点出正确的答案' },
    read: { icon: '👉', line: '看一看，点出正确的答案' }
  };

  let guideKey = '';
  let guideTimer = null;

  function guideFor(q) {
    const t = (q && q.type) || '';
    if (/^stroke$/i.test(t)) return 'stroke';
    if (/py|tone|syllable|initial|final|phonics|listen|audio|say/i.test(t)) return 'listen';
    if (/^(sci|animal|plant|weather|body|space)/i.test(t)) return 'science';
    if (/story|sentence|rhyme|reader|read/i.test(t)) return 'story';
    if (/count|quantity|compare|pattern|next|add|sub|mul|div|shape|time|money|math|number|calc/i.test(t)) return 'count';
    return 'read';
  }

  function paintGuide(q) {
    const el = $('#q-guide');
    if (!el) return;
    const key = guideFor(q);
    const g = GUIDE[key];
    const icon = $('#q-guide-icon');
    if (icon) icon.textContent = g.icon;
    const text = $('#q-guide-text');
    if (text) text.textContent = g.line;
    const pet = $('#q-guide-pet');
    if (pet && !pet.innerHTML) pet.innerHTML = Pet.svg(petLevelSafe(), 'ok');

    clearTimeout(guideTimer);
    if (key !== guideKey) {
      guideKey = key;
      el.classList.remove('pop');
      void el.offsetWidth;
      el.classList.add('pop');
    }
    // 题目本身没有语音时，由小龙猫把「怎么做」说一遍
    if (!q.speak) {
      guideTimer = setTimeout(() => AudioFX.speakCat(g.line, { soft: true }), 620);
    }
  }

  function sayGuide() {
    if (!session) return;
    const q = session.questions[session.index];
    if (!q) return;
    if (q.speak) Quiz.say(q.speak);
    else AudioFX.speak(q.title, 'zh-CN');
  }

  // 第一次答错时划掉一个错误选项，降低下一次尝试的难度
  function eliminateOne(chosenBtn) {
    if (!session) return false;
    const q = session.questions[session.index];
    if (!q) return false;
    const buttons = $$('.option');
    if (buttons.length < 3) return false;
    const pool = [];
    buttons.forEach((b, i) => {
      const o = q.options[i];
      if (!o || o.correct) return;
      if (b === chosenBtn || b.disabled || b.classList.contains('ruled')) return;
      pool.push(b);
    });
    if (!pool.length) return false;
    const pick = pool[Math.floor(Math.random() * pool.length)];
    pick.classList.add('ruled');
    pick.disabled = true;
    return true;
  }

  // 连对奖励：连击条跳一下，关键节点撒星星
  function celebrateCombo(n) {
    if (!n || n < 3) return;
    const combo = $('#game-combo');
    if (combo) {
      combo.classList.remove('pop');
      void combo.offsetWidth;
      combo.classList.add('pop');
    }
    if ([3, 5, 8, 12].indexOf(n) < 0) return;
    const layer = $('#fx-layer');
    if (layer) {
      for (let i = 0; i < 18; i++) {
        const s = document.createElement('span');
        s.className = 'star-rain';
        s.textContent = i % 3 === 0 ? '🌟' : '⭐';
        s.style.left = (Math.random() * 100).toFixed(1) + 'vw';
        s.style.fontSize = (18 + Math.random() * 22).toFixed(0) + 'px';
        s.style.animationDelay = (Math.random() * 0.5).toFixed(2) + 's';
        s.style.animationDuration = (1.6 + Math.random() * 0.8).toFixed(2) + 's';
        s.style.setProperty('--sx', (Math.random() * 120 - 60).toFixed(0) + 'px');
        layer.appendChild(s);
        setTimeout(() => s.remove(), 2600);
      }
    }
    AudioFX.coin();
    AudioFX.speakCat(n >= 5 ? '连对' + n + '题，太厉害啦！' : '连对三道，好棒！', { soft: true });
  }

  // 结算页也有语音：不识字的孩子知道自己是赢了还是还要再试
  function speakResult(passed, stars, isReview) {
    const scr = $('#screen-result');
    if (!scr) return;
    setTimeout(() => {
      if (!scr.classList.contains('active')) return;
      const line = isReview
        ? '复习完成，错的题越来越少啦！'
        : stars === 3 ? '全部一次答对，你太厉害啦！'
          : passed ? '过关啦，我们继续往前走！'
            : '没关系，小龙猫陪你再试一次！';
      AudioFX.speakCat(line, { force: true });
    }, 520);
  }

  function paintNextStop(level, passed, isReview) {
    const el = $('#result-next');
    if (!el) return;
    let text = '';
    if (!isReview) {
      if (!passed) text = '💪 再来一次，小龙猫陪着你';
      else if (level && level.next) text = '🚩 下一站 · ' + level.next.name;
      else if (level) text = '🎉 这一科的关卡都走完啦';
    }
    el.textContent = text;
    el.hidden = !text;
  }

  function renderQuestion() {
    const q = session.questions[session.index];
    if (!q) return finish();

    locked = false;
    const card = $('#q-card');
    card.classList.remove('shake');
    $('#q-title').textContent = q.title;
    $('#q-visual').innerHTML = q.visual || '';
    paintGuide(q);
    const plan = session.questions.filter(x => !x.remedial).length || 1;
    setProgress(Math.min(100, session.index / plan * 100));
    $('#game-score').textContent = '✅ ' + session.correct;
    $('#game-combo').innerHTML = session.combo >= 2 ? `<span>连对 ${session.combo} 🔥</span>` : '';
    $('#game-tip').textContent = '';
    $('#game-tip').className = 'game-tip';

    const wrap = $('#options');
    wrap.innerHTML = '';
    q.options.forEach((o, i) => {
      const b = document.createElement('button');
      b.className = 'option';
      b.type = 'button';
      b.style.animationDelay = (i * 55) + 'ms';
      b.innerHTML = o.html || `<span class="opt-text">${o.label}</span>`;
      b.appendChild(sayBadge(o));
      b.addEventListener('click', () => answer(b, o));
      wrap.appendChild(b);
    });

    const listen = $('#btn-listen');
    listen.classList.toggle('show', !!q.speak);

    // 切题后把焦点交回题目卡：读屏会念出新题，键盘也不会停在已被移除的按钮上
    card.focus({ preventScroll: true });

    syncPracticeTools();

    clearTimeout(mainTimer);
    if (q.speak) {
      AudioFX.preload(q.speak);
      mainTimer = setTimeout(() => Quiz.say(q.speak), 420);
    }
    if (q.speakAnswer) AudioFX.preload(q.speakAnswer);
  }

  function answer(btn, opt) {
    if (locked || !session) return;
    clearTimeout(mainTimer);
    AudioFX.unlock();

    const q = session.questions[session.index];
    if (!q) return;

    if (opt.correct) {
      locked = true;
      $$('.option').forEach(b => b.classList.add('disabled'));
      btn.classList.add('correct');
      if (q.remedial) {
        // 补救题只做当场巩固，不计入本局成绩
        AudioFX.correct();
        burst(btn);
        showTip('就是这样！这一类题会做啦～', 'good');
        advanceTimer = setTimeout(nextQuestion, 1150);
        return;
      }
      session.correct++;
      if (!q.tries) session.firstTry++;
      session.combo++;
      session.bestCombo = Math.max(session.bestCombo, session.combo);
      recordAnswer(q, true, opt);
      AudioFX.correct();
      burst(btn);
      showTip(Quiz.pick(PRAISE), 'good');
      if (q.speakAnswer) setTimeout(() => Quiz.say(q.speakAnswer), 280);
      advanceTimer = setTimeout(nextQuestion, 1150);
    } else if (!q.tries) {
      // 第一次答错：给一次重试机会，不直接公布答案
      q.tries = 1;
      btn.disabled = true;
      btn.classList.add('wrong');
      session.combo = 0;
      AudioFX.wrong();
      const card = $('#q-card');
      card.classList.add('shake');
      setTimeout(() => card.classList.remove('shake'), 520);
      // 先划掉一个错的，剩下的更像「二选一」，孩子不容易挫败
      const ruled = eliminateOne(btn);
      const retryTip = ruled ? '再想一想，我帮你划掉一个错的～' : '再想一想，还有一次机会～';
      showTip(retryTip, 'bad');
      AudioFX.speak(retryTip, 'zh-CN');
    } else {
      // 第二次答错：公布答案并记入错题本
      locked = true;
      $$('.option').forEach(b => b.classList.add('disabled'));
      btn.classList.add('wrong');
      const buttons = $$('.option');
      const ci = q.options.findIndex(o => o.correct);
      if (buttons[ci]) buttons[ci].classList.add('correct');
      session.combo = 0;
      AudioFX.wrong();
      const card = $('#q-card');
      card.classList.add('shake');
      setTimeout(() => card.classList.remove('shake'), 520);
      const tip = q.hint || '没关系，看看正确答案吧～';
      showTip(tip, 'bad');
      // 把错因讲给孩子听；答错的题再补一道同类小题
      AudioFX.speak(tip, 'zh-CN');
      if (!q.remedial) {
        recordAnswer(q, false, opt);
        const extra = remedialFor(q);
        if (extra) session.questions.splice(session.index + 1, 0, extra);
      }
      advanceTimer = setTimeout(nextQuestion, q.remedial ? 2000 : 3000);
    }

    $('#game-score').textContent = '✅ ' + session.correct;
    $('#game-combo').innerHTML = session.combo >= 2 ? `<span>连对 ${session.combo} 🔥</span>` : '';
    if (opt.correct) celebrateCombo(session.combo);
  }

  function recordAnswer(q, ok, opt) {
    session.answers.push({
      type: q.type,
      subject: session.key,
      title: q.title,
      answer: q.answer,
      ok,
      tries: q.tries,
      chosen: opt ? opt.label : ''
    });
    if (session.review) {
      App.reviewWrong(q.wrongId, ok);
      return;
    }
    if (session.kind === 'placement') return;
    if (!ok) {
      App.addWrong({
        subject: session.key,
        type: q.type,
        title: q.title,
        visual: q.visual || '',
        answer: q.answer,
        speak: q.speak || null,
        hint: q.hint || '',
        options: q.options.map(o => ({ label: o.label, html: o.html || '', say: o.say || '', lang: o.lang || '', audio: o.audio || '' })),
        chosen: opt ? opt.label : ''
      });
    }
  }

  function nextQuestion() {
    if (!session) return;
    session.index++;
    if (session.index >= session.questions.length) { finish(); return; }
    retuneNext();
    renderQuestion();
  }

  function setProgress(pct) {
    const fill = $('#game-progress-fill');
    if (fill) fill.style.width = pct + '%';
    const bar = $('#game-progress');
    if (bar) bar.setAttribute('aria-valuenow', String(Math.round(pct)));
  }

  /* 结算页：按知识点回顾本局表现，答得不太好的排在前面 */
  function renderReview() {
    const el = $('#result-review');
    if (!el) return;
    const groups = {};
    session.answers.forEach(a => {
      if (!a.type) return;
      const g = groups[a.type] || (groups[a.type] = { right: 0, total: 0 });
      g.total++;
      if (a.ok) g.right++;
    });
    const names = Quiz.TYPE_NAMES || {};
    const rows = Object.keys(groups).map(type => {
      const g = groups[type];
      return { type, right: g.right, total: g.total, rate: g.right / g.total };
    }).sort((a, b) => a.rate - b.rate || b.total - a.total);

    if (!rows.length) {
      el.hidden = true;
      el.innerHTML = '';
      return;
    }

    const wrong = session.answers.filter(a => !a.ok).length;
    el.hidden = false;
    el.innerHTML = `<p class="review-title">${Art.em('📋')} 这一局学到了什么</p>
      <div class="review-list">${rows.slice(0, 4).map(r => `<div class="review-row">
        <span class="review-name">${names[r.type] || r.type}</span>
        <span class="review-bar"><i style="width:${Math.round(r.rate * 100)}%"></i></span>
        <span class="review-num">${r.right}/${r.total}</span>
      </div>`).join('')}</div>
      <p class="review-tip">${wrong
        ? '答错的题已经放进错题本，明天会再提醒你练一次。'
        : '这几类题都答对了，可以往下挑战更难的啦！'}</p>`;
  }

  function finish() {
    if (!session) return;
    clearTimeout(mainTimer);
    clearTimeout(advanceTimer);
    AudioFX.stopSpeak();

    const total = session.questions.filter(q => !q.remedial).length || 1;
    const accuracy = session.correct / total;
    const need = Math.ceil(total * 0.6);
    const passed = session.correct >= need;
    const seconds = Math.round((Date.now() - session.startedAt) / 1000);

    if (session.kind === 'placement' || session.kind === 'skip') {
      finishSpecial(total, accuracy);
      return;
    }

    // 星星看「第一次就答对」的题数，重试答对不计入满星
    const stars = session.firstTry === total ? 3
      : session.firstTry / total >= 0.8 ? 2
        : passed ? 1 : 0;

    const result = session.review
      ? App.finishReview({
        correct: session.correct,
        total,
        firstTry: session.firstTry,
        seconds
      })
      : App.finishSession({
        subject: session.key,
        correct: session.correct,
        total,
        firstTry: session.firstTry,
        bestCombo: session.bestCombo,
        stars,
        seconds,
        levelId: session.levelId,
        stageId: session.stageId,
        answers: session.answers
      });

    const level = result.level;
    const stage = result.stage;

    setProgress(100);
    const starIcon = Art.ui ? Art.ui('star') : '⭐';
    const starOff = Art.ui ? Art.ui('star-off') : '☆';
    $('#result-stars').innerHTML = [1, 2, 3].map(i =>
      `<span class="rstar ${i <= stars ? 'on' : ''}" style="animation-delay:${i * 160}ms">${i <= stars ? starIcon : starOff}</span>`).join('');

    $('#result-title').textContent = passed
      ? (stars === 3 ? '完美通关！' : '闯关成功！')
      : '还差一点点～';
    $('#result-sub').textContent = session.review
      ? `复习了 ${total} 道错题，答对 ${session.correct} 道。答对后会减少复习次数哦～`
      : passed
        ? (stars === 3
          ? '全部一次答对，小龙猫为你骄傲～'
          : '成功过关啦，再来一次挑战满星吧！')
        : `答对 ${need} 题就能过关，你答对了 ${session.correct} 题，再挑战一次吧！`;

    if (session.review) {
      $('#result-level').innerHTML =
        `<span class="rlv ok">${Art.em('📕')} 错题复习 · 一次答对 ${session.firstTry}/${total}</span>`;
    } else if (level) {
      $('#result-level').innerHTML = level.passed
        ? `<span class="rlv ok">🗺️ 第 ${level.id} 关 · ${level.name} · 最佳 ${level.stars} 星</span>`
        : `<span class="rlv fail">🗺️ 第 ${level.id} 关 · ${level.name} · 差 ${level.need - session.correct} 题</span>`;
    } else if (stage) {
      $('#result-level').innerHTML = passed
        ? `<span class="rlv ok">${Art.em(stage.icon)} ${stage.name} · 最佳 ${stage.stars} 星</span>`
        : `<span class="rlv fail">${Art.em(stage.icon)} ${stage.name} · 再试一次吧</span>`;
    } else {
      $('#result-level').innerHTML = '';
    }

    $('#result-stats').innerHTML = `
      <div class="rstat"><b>${session.correct}<i>/${total}</i></b><span>答对题数</span></div>
      <div class="rstat"><b>${session.firstTry}<i>/${total}</i></b><span>一次答对</span></div>
      <div class="rstat"><b>${Math.round(accuracy * 100)}%</b><span>正确率</span></div>`;

    renderReview();

    $('#result-rewards').innerHTML = `
      <div class="reward">🌰 <b>+${result.coins}</b> 橡果币</div>
      <div class="reward">💗 <b>+${result.exp}</b> 成长值</div>
      ${level && level.newClear ? '<div class="reward newclear">🗺️ 首次通关 <b>+20</b> 橡果币</div>' : ''}
      ${stage && stage.newClear ? '<div class="reward newclear">🎯 首次完成 <b>+10</b> 橡果币</div>' : ''}
      ${result.leveledUp ? '<div class="reward levelup">🎉 小龙猫升级啦！</div>' : ''}`;

    const backBtn = $('#btn-back-map');
    if (backBtn) backBtn.textContent = session.review ? '回到乐园' : session.levelId ? '回到地图' : '返回关卡';

    paintNextStop(level, passed, session.review);
    AudioFX.levelUp();
    App.show('result');
    speakResult(passed, stars, session.review);
    App.refreshHud();
  }

  /* 起点测评 / 跳关测评的结算页 */
  function finishSpecial(total, accuracy) {
    const stars = accuracy >= 0.9 ? 3 : accuracy >= 0.7 ? 2 : accuracy >= 0.4 ? 1 : 0;
    const passed = stars > 0;
    let title = '测评完成！';
    let sub = '';
    let levelHtml = '';
    let coins = 8;
    let exp = 8;

    if (session.kind === 'placement') {
      const res = (App.applyPlacement && App.applyPlacement({
        correct: session.correct,
        total,
        firstTry: session.firstTry,
        answers: session.answers
      })) || {};
      coins = res.coins || 10;
      exp = res.exp || 10;
      title = '测评完成！';
      sub = `一共 ${total} 道题，答对 ${session.correct} 道。建议从「${res.bandName || '4–5 岁'}」的难度开始${res.unlocked ? '，前面的关卡已经帮你打开啦' : '，先从最简单的关卡开始吧'}。`;
      levelHtml = `<span class="rlv ok">🎯 建议难度 · ${res.bandName || '4–5 岁'}</span>`;
    } else {
      const res = (App.applySkipTest && App.applySkipTest({
        subject: session.key,
        stageId: session.stageId,
        correct: session.correct,
        total
      })) || {};
      coins = res.coins || 8;
      exp = res.exp || 8;
      title = res.passed ? '跳关成功！' : '再练一练吧～';
      sub = res.passed
        ? `答对 ${session.correct}/${total} 道，已经解锁到「${res.stageName || session.stage.name}」。接下来回到关卡继续往下闯吧！`
        : `答对 ${Math.ceil(total * 0.8)} 道就能跳关，这次答对了 ${session.correct} 道。先按顺序练熟再来挑战吧～`;
      levelHtml = res.passed
        ? `<span class="rlv ok">🔓 ${Art.em(session.stage.icon || '🎯')} ${session.stage.name} · 已解锁</span>`
        : `<span class="rlv fail">🔒 ${session.stage.name} · 差 ${Math.max(0, Math.ceil(total * 0.8) - session.correct)} 题</span>`;
    }

    setProgress(100);
    const starIcon = Art.ui ? Art.ui('star') : '⭐';
    const starOff = Art.ui ? Art.ui('star-off') : '☆';
    $('#result-stars').innerHTML = [1, 2, 3].map(i =>
      `<span class="rstar ${i <= stars ? 'on' : ''}" style="animation-delay:${i * 160}ms">${i <= stars ? starIcon : starOff}</span>`).join('');
    $('#result-title').textContent = title;
    $('#result-sub').textContent = sub;
    $('#result-level').innerHTML = levelHtml;
    $('#result-stats').innerHTML = `
      <div class="rstat"><b>${session.correct}<i>/${total}</i></b><span>答对题数</span></div>
      <div class="rstat"><b>${session.firstTry}<i>/${total}</i></b><span>一次答对</span></div>
      <div class="rstat"><b>${Math.round(accuracy * 100)}%</b><span>正确率</span></div>`;
    const rv = $('#result-review');
    if (rv) { rv.hidden = true; rv.innerHTML = ''; }
    $('#result-rewards').innerHTML = `
      <div class="reward">🌰 <b>+${coins}</b> 橡果币</div>
      <div class="reward">💗 <b>+${exp}</b> 成长值</div>`;

    const backBtn = $('#btn-back-map');
    if (backBtn) backBtn.textContent = session.kind === 'placement' ? '回到乐园' : '返回关卡';

    if (passed) AudioFX.levelUp();
    paintNextStop(null, passed, false);
    App.show('result');
    speakResult(passed, stars, false);
    App.refreshHud();
  }

  function showTip(text, type) {
    const el = $('#game-tip');
    if (!el) return;
    el.textContent = text;
    el.className = 'game-tip show ' + (type || '');
  }

  function cleanup() {
    clearTimeout(mainTimer);
    clearTimeout(advanceTimer);
    clearTimeout(guideTimer);
    cancelIntro();
    guideKey = '';
    AudioFX.stopSpeak();
    session = null;
    locked = false;
    toggleTool('#btn-follow', false);
    toggleTool('#btn-trace', false);
  }

  function doQuit() {
    const wasLevel = session && session.levelId;
    const key = session && session.key;
    const wasReview = session && session.review;
    const kind = session && session.kind;
    cleanup();
    if (kind === 'placement' || wasReview) App.show('home');
    else if (wasLevel) App.show('map');
    else if (key) App.showStages(key);
    else App.show('home');
  }

  function quit() {
    if (!session) return;
    // 还没答题就直接退出，不必打扰
    const answered = session.answers.length > 0;
    if (!answered || !App.confirm) return doQuit();
    App.confirm({
      title: '结束本局？',
      text: '这一局的成绩不会保存，确定要离开吗？',
      ok: '结束',
      cancel: '继续答题'
    }).then(ok => { if (ok) doQuit(); });
  }

  function replay() {
    if (!session) return;
    if (session.review) return startReview();
    const key = session.key;
    const stageId = session.stageId;
    const levelId = session.levelId;
    if (session.kind === 'placement') return startPlacement();
    if (session.kind === 'skip') return startSkip(key, stageId);
    start(key, stageId, levelId);
  }

  function listen() {
    if (!session) return;
    const q = session.questions[session.index];
    if (q && q.speak) Quiz.say(q.speak);
  }

  /* ---------- 跟读 / 描红 ---------- */

  function toggleTool(sel, on) {
    const el = $(sel);
    if (el) el.classList.toggle('show', !!on);
  }

  const HANZI_ONE = /^[\u4e00-\u9fa5]$/;

  function syncPracticeTools() {
    const q = session && session.questions[session.index];
    if (!q) {
      toggleTool('#btn-follow', false);
      toggleTool('#btn-trace', false);
      return;
    }
    const answer = String(q.answer == null ? '' : q.answer).trim();
    // 跟读：只要题目有可读文本、且不是长段落就能练（原来限制 6 字，很多单词短句都用不上）
    const canFollow = !!(q.speakAnswer || q.speak) && !!answer && answer.length <= 12;
    // 描红：单个汉字、单个字母、单个数字都能练
    const canTrace = HANZI_ONE.test(answer) || /^[a-zA-Z0-9]$/.test(answer);
    toggleTool('#btn-follow', canFollow);
    toggleTool('#btn-trace', canTrace);
  }

  function openFollow() {
    if (!session) return;
    const q = session.questions[session.index];
    if (!q) return;
    clearTimeout(mainTimer);
    const src = q.speakAnswer || q.speak || {};
    Practice.openFollow({
      text: String(q.answer == null ? q.title : q.answer),
      word: String(q.answer == null ? q.title : q.answer),
      lang: src.lang || 'zh-CN',
      audio: src.audio || '',
      onDone: r => App.finishPractice({
        kind: 'follow',
        score: r.score,
        stars: r.stars,
        subject: session ? session.key : '',
        word: String(q.answer == null ? '' : q.answer)
      })
    });
  }

  function openTrace() {
    if (!session) return;
    const q = session.questions[session.index];
    if (!q) return;
    Practice.openTrace({
      glyph: String(q.answer == null ? '' : q.answer),
      word: q.title,
      onDone: r => App.finishPractice({
        kind: 'trace',
        score: r.score,
        stars: r.stars,
        subject: session ? session.key : '',
        word: String(q.answer == null ? '' : q.answer)
      })
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    const f = $('#btn-follow');
    if (f) f.addEventListener('click', openFollow);
    const t = $('#btn-trace');
    if (t) t.addEventListener('click', openTrace);
    const g = $('#q-guide-say');
    if (g) g.addEventListener('click', e => { e.stopPropagation(); sayGuide(); });
  });

  /* 星星粒子 */
  function burst(el) {
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const layer = document.getElementById('fx-layer');
    if (!layer) return;
    const chars = ['⭐', '✨', '🌟', '💫', '🎉'];
    for (let i = 0; i < 9; i++) {
      const s = document.createElement('span');
      s.className = 'spark';
      s.innerHTML = Art.em(Quiz.pick(chars));
      s.style.left = (rect.left + rect.width / 2) + 'px';
      s.style.top = (rect.top + rect.height / 2) + 'px';
      const ang = Math.random() * Math.PI * 2;
      const dist = 45 + Math.random() * 80;
      s.style.setProperty('--dx', Math.cos(ang) * dist + 'px');
      s.style.setProperty('--dy', Math.sin(ang) * dist - 50 + 'px');
      s.style.fontSize = (16 + Math.random() * 18) + 'px';
      layer.appendChild(s);
      setTimeout(() => s.remove(), 950);
    }
  }

  return {
    SUBJECTS,
    start,
    startStage,
    startReview,
    startPlacement,
    startSkip,
    quit,
    replay,
    listen,
    burst,
    cleanup,
    info: () => (session ? {
      subject: session.key,
      stageId: session.stageId,
      levelId: session.levelId,
      review: session.review,
      kind: session.kind || ''
    } : null)
  };
})();
