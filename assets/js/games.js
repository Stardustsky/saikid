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

  const $ = sel => document.querySelector(sel);
  const $$ = sel => [...document.querySelectorAll(sel)];

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

  function begin(stage, levelId) {
    AudioFX.unlock();
    const total = levelId ? MAP_TOTAL : STAGE_TOTAL;
    const questions = Quiz.buildSession(stage, total).map(q => {
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
    App.show('game');
    renderQuestion();
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
    App.show('game');
    renderQuestion();
  }

  function renderQuestion() {
    const q = session.questions[session.index];
    if (!q) return finish();

    locked = false;
    const card = $('#q-card');
    card.classList.remove('shake');
    $('#q-title').textContent = q.title;
    $('#q-visual').innerHTML = q.visual || '';
    setProgress(session.index / session.questions.length * 100);
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
      b.addEventListener('click', () => answer(b, o));
      wrap.appendChild(b);
    });

    const listen = $('#btn-listen');
    listen.classList.toggle('show', !!q.speak);

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
      showTip('再想一想，还有一次机会～', 'bad');
    } else {
      // 第二次答错：公布答案并记入错题本
      locked = true;
      $$('.option').forEach(b => b.classList.add('disabled'));
      btn.classList.add('wrong');
      const buttons = $$('.option');
      const ci = q.options.findIndex(o => o.correct);
      if (buttons[ci]) buttons[ci].classList.add('correct');
      session.combo = 0;
      recordAnswer(q, false, opt);
      AudioFX.wrong();
      const card = $('#q-card');
      card.classList.add('shake');
      setTimeout(() => card.classList.remove('shake'), 520);
      showTip(q.hint || '没关系，看看正确答案吧～', 'bad');
      if (q.speakAnswer) setTimeout(() => Quiz.say(q.speakAnswer), 280);
      advanceTimer = setTimeout(nextQuestion, 2200);
    }

    $('#game-score').textContent = '✅ ' + session.correct;
    $('#game-combo').innerHTML = session.combo >= 2 ? `<span>连对 ${session.combo} 🔥</span>` : '';
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
    if (!ok) {
      App.addWrong({
        subject: session.key,
        type: q.type,
        title: q.title,
        visual: q.visual || '',
        answer: q.answer,
        speak: q.speak || null,
        hint: q.hint || '',
        options: q.options.map(o => ({ label: o.label, html: o.html || '' })),
        chosen: opt ? opt.label : ''
      });
    }
  }

  function nextQuestion() {
    if (!session) return;
    session.index++;
    if (session.index >= session.questions.length) finish();
    else renderQuestion();
  }

  function setProgress(pct) {
    const fill = $('#game-progress-fill');
    if (fill) fill.style.width = pct + '%';
    const bar = $('#game-progress');
    if (bar) bar.setAttribute('aria-valuenow', String(Math.round(pct)));
  }

  function finish() {
    if (!session) return;
    clearTimeout(mainTimer);
    clearTimeout(advanceTimer);
    AudioFX.stopSpeak();

    const total = session.questions.length || 1;
    const accuracy = session.correct / total;
    const need = Math.ceil(total * 0.6);
    const passed = session.correct >= need;
    // 星星看「第一次就答对」的题数，重试答对不计入满星
    const stars = session.firstTry === total ? 3
      : session.firstTry / total >= 0.8 ? 2
        : passed ? 1 : 0;
    const seconds = Math.round((Date.now() - session.startedAt) / 1000);

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

    $('#result-rewards').innerHTML = `
      <div class="reward">🌰 <b>+${result.coins}</b> 橡果币</div>
      <div class="reward">💗 <b>+${result.exp}</b> 成长值</div>
      ${level && level.newClear ? '<div class="reward newclear">🗺️ 首次通关 <b>+20</b> 橡果币</div>' : ''}
      ${stage && stage.newClear ? '<div class="reward newclear">🎯 首次完成 <b>+10</b> 橡果币</div>' : ''}
      ${result.leveledUp ? '<div class="reward levelup">🎉 小龙猫升级啦！</div>' : ''}`;

    const backBtn = $('#btn-back-map');
    if (backBtn) backBtn.textContent = session.review ? '回到乐园' : session.levelId ? '回到地图' : '返回关卡';

    AudioFX.levelUp();
    App.show('result');
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
    cleanup();
    if (wasReview) App.show('home');
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
    const answer = String(q.answer == null ? '' : q.answer);
    const canFollow = !!(q.speakAnswer && answer && answer.length <= 6);
    const canTrace = HANZI_ONE.test(answer) || /^[a-zA-Z]$/.test(answer);
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
    quit,
    replay,
    listen,
    burst,
    cleanup,
    info: () => (session ? {
      subject: session.key,
      stageId: session.stageId,
      levelId: session.levelId,
      review: session.review
    } : null)
  };
})();
