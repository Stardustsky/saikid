/* 小游戏乐园：同一套知识，装进不同的游戏里玩
   —— 打地鼠、戳泡泡、翻翻乐、钓鱼听音、火箭冲关、连线配对、接果子、火眼金睛
   手感三件套：
     1. Ease + anim：统一缓动，位移/缩放都不再是硬切
     2. FX：canvas 粒子层（迸溅、光环），命中/失败都有"东西飞出来"
     3. 场景：每款玩法都有自己的舞台（天空、水池、太空、果园……），不是一排按钮 */
const MiniGame = (() => {
  const GAMES = {
    mole: {
      name: '打地鼠', icon: '🔨', color: '#e8a33d', tag: '反应力', desc: '地鼠冒出来，敲中正确答案',
      sticker: '🌰', story: '小龙猫的粮仓被地鼠偷啦！敲中正确答案，把地鼠赶回洞里～'
    },
    bubble: {
      name: '戳泡泡', icon: '🫧', color: '#4fb6ff', tag: '观察力', desc: '戳破写着正确答案的泡泡',
      sticker: '🫧', story: '海底的泡泡里藏着答案，戳破正确的那一个，帮小龙猫收集起来！'
    },
    memory: {
      name: '翻翻乐', icon: '🃏', color: '#8b6cff', tag: '记忆力', desc: '翻开卡片，配成一对',
      sticker: '🍃', story: '一阵风把叶片卡片吹乱了，帮小龙猫把成对的图案找回来～'
    },
    fish: {
      name: '钓鱼听音', icon: '🐟', color: '#3ecf8e', tag: '听力', desc: '先听声音，再钓上正确的鱼',
      sticker: '🐟', story: '小鱼叼走了答案，先听一听，再把正确的那条钓上来！'
    },
    rocket: {
      name: '火箭冲关', icon: '🚀', color: '#ff7a59', tag: '速度', desc: '答对一题，火箭就往前冲一格',
      sticker: '🌟', story: '火箭要飞向新的星球，每答对一题，就能往前冲一格！'
    },
    match: {
      name: '连线配对', icon: '🧩', color: '#5d8bf4', tag: '配对', desc: '左右各点一个，拉一条线连起来',
      sticker: '🧩', story: '左边和右边的图案走散了，拉一条线，帮它们重新牵上手～'
    },
    catch: {
      name: '接果子', icon: '🍎', color: '#ff9f1c', tag: '专注力', desc: '拖动篮子，接住正确答案',
      sticker: '🍎', story: '果子熟了往下掉，撑好篮子，接住写着正确答案的那个！'
    },
    odd: {
      name: '火眼金睛', icon: '🔍', color: '#a06cd5', tag: '观察力', desc: '用放大镜找出不一样的那个',
      sticker: '🔍', story: '草丛里混进了一个不一样的图案，用放大镜把它找出来！'
    }
  };

  /* 难度三档：题量与干扰项随档位递增 */
  const ROUNDS = {
    mole: [8, 10, 12],
    bubble: [8, 9, 10],
    memory: [6, 7, 8],
    fish: [6, 7, 8],
    rocket: [8, 10, 12],
    match: [4, 5, 6],
    catch: [8, 9, 10],
    odd: [6, 7, 8]
  };
  const OPTS = {
    mole: [3, 4, 5],
    bubble: [4, 5, 6],
    fish: [4, 5, 6],
    rocket: [3, 4, 5],
    catch: [3, 4, 5]
  };
  const MEMORY_PAIRS = 6;
  const ODD_CELLS = [6, 9, 12];

  /* 幸运目标：偶尔有一个答案是金色的，命中拿额外奖励（配对类玩法不适用） */
  const LUCKY_GAMES = { mole: 1, bubble: 1, fish: 1, rocket: 1, catch: 1 };
  const LUCKY_RATE = 0.3;
  const LUCKY_COINS = 5;
  const SVG_NS = 'http://www.w3.org/2000/svg';

  const $ = sel => document.querySelector(sel);
  const isObj = v => !!v && typeof v === 'object' && !Array.isArray(v);
  const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
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
  let arcadeSubject = 'mix';
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

  function clearWaitsOnly() {
    waits.forEach(w => clearTimeout(w.id));
    waits = [];
  }

  /* ---------- 缓动与逐帧调度 ---------- */

  const Ease = {
    linear: t => t,
    outQuad: t => 1 - (1 - t) * (1 - t),
    outCubic: t => 1 - Math.pow(1 - t, 3),
    inOutCubic: t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
    outBack: t => 1 + 2.2 * Math.pow(t - 1, 3) + 1.2 * Math.pow(t - 1, 2)
  };

  let tickers = [];
  let frameCb = null;
  let lastTs = 0;
  let rafId = 0;

  function kick() {
    if (rafId || paused || !run || run.done) return;
    if (!tickers.length && !frameCb && !FX.live()) return;
    rafId = requestAnimationFrame(loop);
  }

  function loop(ts) {
    rafId = 0;
    if (paused || !run || run.done) { lastTs = 0; return; }
    const dt = lastTs ? Math.min(48, ts - lastTs) : 16;
    lastTs = ts;
    const k = dt / 16;
    if (frameCb) {
      try { frameCb(k, dt); } catch (err) { frameCb = null; }
    }
    if (tickers.length) {
      const list = tickers;
      tickers = [];
      for (let i = 0; i < list.length; i++) {
        const it = list[i];
        if (it.dead) continue;
        it.t += dt;
        const raw = Math.min(1, it.t / it.ms);
        it.step(it.ease(raw), raw, dt);
        if (raw < 1) tickers.push(it);
      }
    }
    FX.step(dt);
    if (tickers.length || frameCb || FX.live()) kick();
    else lastTs = 0;
  }

  /* 补间：ms 毫秒内把 0→1 交给 step(eased, raw, dt) */
  function anim(ms, step, ease) {
    const it = { t: 0, ms: Math.max(1, ms), step, ease: ease || Ease.linear, dead: false };
    tickers.push(it);
    kick();
    return it;
  }

  function setTick(fn) {
    frameCb = fn;
    kick();
  }

  function clearTicks() {
    tickers = [];
    frameCb = null;
  }

  /* ---------- 粒子层 ---------- */

  const FX = (() => {
    const api = {
      cv: null, ctx: null, W: 0, H: 0, dpr: 1,
      parts: [], rings: []
    };

    api.reduced = () => {
      if (document.documentElement.getAttribute('data-motion') === 'reduce') return true;
      return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    };

    api.mount = board => {
      api.detach();
      if (!board) return;
      const cv = document.createElement('canvas');
      cv.className = 'fx-canvas';
      cv.setAttribute('aria-hidden', 'true');
      board.appendChild(cv);
      api.cv = cv;
      api.ctx = cv.getContext('2d');
      api.resize();
      window.addEventListener('resize', api.resize);
    };

    api.detach = () => {
      window.removeEventListener('resize', api.resize);
      if (api.cv && api.cv.parentNode) api.cv.parentNode.removeChild(api.cv);
      api.cv = null;
      api.ctx = null;
      api.W = 0;
      api.H = 0;
      api.parts.length = 0;
      api.rings.length = 0;
    };

    api.resize = () => {
      if (!api.cv || !api.ctx) return;
      const host = api.cv.parentElement;
      if (!host) return;
      const r = host.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      api.W = r.width;
      api.H = r.height;
      api.dpr = dpr;
      api.cv.width = Math.max(1, Math.round(r.width * dpr));
      api.cv.height = Math.max(1, Math.round(r.height * dpr));
      api.cv.style.width = r.width + 'px';
      api.cv.style.height = r.height + 'px';
      api.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    api.burst = (x, y, o) => {
      if (api.reduced() || !api.ctx) return;
      o = o || {};
      const n = o.count == null ? 12 : o.count;
      const colors = o.colors || ['#ffffff'];
      const speed = o.speed == null ? 200 : o.speed;
      const gravity = o.gravity == null ? 700 : o.gravity;
      const size = o.size == null ? 4 : o.size;
      const life = o.life == null ? 620 : o.life;
      const spread = o.spread == null ? Math.PI * 2 : o.spread;
      for (let i = 0; i < n; i++) {
        const ang = o.dir == null
          ? Math.random() * Math.PI * 2
          : o.dir + (Math.random() - 0.5) * spread;
        const sp = speed * (0.55 + Math.random() * 0.75);
        const lf = life * (0.7 + Math.random() * 0.6);
        api.parts.push({
          x, y,
          vx: Math.cos(ang) * sp,
          vy: Math.sin(ang) * sp - (o.lift || 0),
          g: gravity,
          size: size * (0.6 + Math.random() * 0.8),
          life: lf, max: lf,
          color: colors[(Math.random() * colors.length) | 0],
          shape: o.shape || 'dot',
          rot: Math.random() * 6.283,
          vr: (Math.random() - 0.5) * 0.3
        });
      }
      kick();
    };

    api.ring = (x, y, o) => {
      if (api.reduced() || !api.ctx) return;
      o = o || {};
      api.rings.push({
        x, y, t: 0,
        r0: o.r0 == null ? 8 : o.r0,
        r1: o.r1 == null ? 52 : o.r1,
        life: o.life == null ? 520 : o.life,
        color: o.color || '#ffffff',
        lw: o.lw == null ? 3 : o.lw
      });
      kick();
    };

    api.step = dt => {
      const ctx = api.ctx;
      if (!ctx) return;
      ctx.clearRect(0, 0, api.W, api.H);

      let parts = api.parts;
      if (parts.length) {
        const keep = [];
        for (let i = 0; i < parts.length; i++) {
          const p = parts[i];
          p.life -= dt;
          if (p.life <= 0) continue;
          p.vx *= 0.992;
          p.vy += p.g * dt / 1000;
          p.x += p.vx * dt / 1000;
          p.y += p.vy * dt / 1000;
          p.rot += p.vr;
          const a = clamp(p.life / p.max, 0, 1);
          ctx.globalAlpha = a;
          ctx.fillStyle = p.color;
          if (p.shape === 'spark') {
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rot);
            ctx.fillRect(-p.size / 2, -p.size * 1.7, p.size, p.size * 3.4);
            ctx.restore();
          } else {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * (0.4 + 0.6 * a), 0, 6.283, false);
            ctx.fill();
          }
          keep.push(p);
        }
        api.parts = keep;
      }

      let rings = api.rings;
      if (rings.length) {
        const keep = [];
        for (let i = 0; i < rings.length; i++) {
          const rn = rings[i];
          rn.t += dt;
          const raw = rn.t / rn.life;
          if (raw >= 1) continue;
          const r = rn.r0 + (rn.r1 - rn.r0) * Ease.outCubic(raw);
          ctx.globalAlpha = (1 - raw) * 0.85;
          ctx.strokeStyle = rn.color;
          ctx.lineWidth = rn.lw * (1 - raw * 0.4);
          ctx.beginPath();
          ctx.arc(rn.x, rn.y, r, 0, 6.283, false);
          ctx.stroke();
          keep.push(rn);
        }
        api.rings = keep;
      }
      ctx.globalAlpha = 1;
    };

    api.live = () => api.parts.length > 0 || api.rings.length > 0;
    return api;
  })();

  /* ---------- 手感小工具 ---------- */

  function shake(power) {
    const board = $('#mini-board');
    if (!board || FX.reduced()) return;
    const p = power || 1;
    anim(320, (e, raw) => {
      const amp = (1 - raw) * 7 * p;
      board.style.setProperty('--sk-x', (Math.cos(raw * Math.PI * 11) * amp).toFixed(2) + 'px');
      board.style.setProperty('--sk-y', (Math.sin(raw * Math.PI * 9) * amp * 0.65).toFixed(2) + 'px');
      if (raw >= 1) {
        board.style.setProperty('--sk-x', '0px');
        board.style.setProperty('--sk-y', '0px');
      }
    }, Ease.outQuad);
  }

  function centerOf(el) {
    const board = $('#mini-board');
    if (!board || !el || !el.getBoundingClientRect) return null;
    const b = board.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    if (!r.width && !r.height) return null;
    return { x: r.left - b.left + r.width / 2, y: r.top - b.top + r.height / 2 };
  }

  function burstAt(p, colors, o) {
    if (!p) return;
    FX.burst(p.x, p.y, Object.assign({
      count: 12, colors: colors || ['#ffffff'], speed: 210, gravity: 760, size: 4, life: 640
    }, o || {}));
  }

  function ringAt(p, color) {
    if (!p) return;
    FX.ring(p.x, p.y, { r0: 8, r1: 54, color: color || '#ffffff', life: 520, lw: 3 });
  }

  /* 命中统一反馈：粒子 + 光环 + 飘字 */
  function celebrate(el, text, hot) {
    const c = centerOf(el);
    if (c) {
      burstAt(c, ['#ffe08a', '#7bd6a3', '#ffffff', '#ffb3c7'], { count: 16, speed: 240, gravity: 780, size: 5 });
      ringAt(c, '#ffe9a8');
    }
    if (text) floatFx(el, text, hot ? 'hot' : '');
  }

  /* 命中时在棋盘上飘一个 +1 / 连对提示，手感更明显 */
  function floatFx(el, text, cls) {
    const board = $('#mini-board');
    if (!board || !el || !el.getBoundingClientRect) return;
    const b = board.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    const span = document.createElement('span');
    span.className = 'mini-fx' + (cls ? ' ' + cls : '');
    span.textContent = text;
    span.style.left = (r.left - b.left + r.width / 2) + 'px';
    span.style.top = (r.top - b.top + r.height / 2) + 'px';
    board.appendChild(span);
    setTimeout(() => span.remove(), 820);
  }

  /* ---------- 小龙猫陪伴：角落里的角色 + 情绪反应 ---------- */

  const CAT_WORDS = {
    hello: ['我们一起玩吧！', '我陪着你～', '慢慢来，不着急'],
    ok: ['嗯嗯，继续～', '我在这里哦'],
    happy: ['对啦！', '真棒！', '就是这样～', '好厉害！'],
    hot: ['连对啦，太厉害了！', '停不下来～', '哇，太稳了！'],
    sad: ['没关系，再试一次', '差一点点，再来～', '别急，我陪着你']
  };

  function petLevel() {
    const st = (typeof App !== 'undefined' && App.state) ? App.state : null;
    return st && st.pet ? Math.max(1, Number(st.pet.level) || 1) : 1;
  }

  function catSvg(mood) {
    if (typeof Pet === 'undefined' || !Pet.svg) return Art.em('🐹');
    return Pet.svg(petLevel(), mood, 'mini-cat-pet');
  }

  function catAdd(board) {
    const host = board || $('#mini-board');
    if (!host) return null;
    const old = host.querySelector('.mini-cat');
    if (old) old.remove();
    const el = document.createElement('div');
    el.className = 'mini-cat mood-ok';
    el.setAttribute('aria-hidden', 'true');
    el.innerHTML = '<span class="mini-cat-av">' + catSvg(70) + '</span>' +
      '<span class="mini-cat-bubble"></span>';
    host.appendChild(el);
    return el;
  }

  /* mood: happy / hot / sad / ok */
  function catMood(mood, text) {
    const el = document.querySelector('#mini-board .mini-cat');
    if (!el) return;
    const av = el.querySelector('.mini-cat-av');
    const bub = el.querySelector('.mini-cat-bubble');
    const m = mood === 'happy' ? 92 : mood === 'hot' ? 96 : mood === 'sad' ? 12 : mood === 'ok' ? 55 : 60;
    if (av) {
      av.innerHTML = catSvg(m);
      av.classList.remove('is-hop', 'is-shake');
      void av.offsetWidth;
      if (mood === 'happy' || mood === 'hot') av.classList.add('is-hop');
      else if (mood === 'sad') av.classList.add('is-shake');
    }
    el.classList.remove('mood-happy', 'mood-sad', 'mood-hot', 'mood-ok');
    el.classList.add('mood-' + (mood || 'ok'));
    if (bub) {
      const line = text || pick(CAT_WORDS[mood] || CAT_WORDS.hello);
      bub.textContent = line;
      bub.classList.remove('show');
      void bub.offsetWidth;
      bub.classList.add('show');
      clearTimeout(catMood.hide);
      catMood.hide = setTimeout(() => bub.classList.remove('show'), 2300);
    }
  }
  catMood.hide = 0;

  /* 答对：普通欢呼；连对 3 次以上进入发光撒星状态 */
  function catOk() {
    if (!run) return;
    const n = run.combo || 0;
    catMood(n >= 3 ? 'hot' : 'happy');
    if (n >= 3) {
      const p = centerOf(document.querySelector('#mini-board .mini-cat'));
      if (p) burstAt(p, ['#ffe08a', '#fff3bf', '#ffd76a'], {
        count: 10, speed: 130, gravity: -30, size: 4, lift: 50, life: 820
      });
    }
  }

  function catNo() {
    catMood('sad', '没关系，再试一次');
    AudioFX.speakCat('没关系，再试一次');
  }

  /* ---------- 首回合教学：先指一次，再放手 ---------- */
  // 第一回合小龙猫会指给孩子看「点哪里」，并说一句怎么做
  const COACH = {
    mole: { sel: '.whack-hole', line: '敲亮起来的地鼠，上面写着答案哦' },
    bubble: { sel: '.bub', line: '戳破写着答案的那个泡泡' },
    fish: { sel: '.fishie', line: '钓起写着答案的那条小鱼' },
    rocket: { sel: '.rocket-pod', line: '点写着答案的星球，让火箭飞过去' },
    catch: { sel: '.basket', line: '左右移动小篮子，接住写着答案的果子' },
    odd: { sel: '.odd-cell[data-odd="1"]', line: '点那个不一样的图案' }
  };

  let coachTimer = 0;

  function clearCoach() {
    clearTimeout(coachTimer);
    coachTimer = 0;
    const board = $('#mini-board');
    if (!board) return;
    board.querySelectorAll('.coach-target').forEach(el => el.classList.remove('coach-target'));
    board.querySelectorAll('.coach-tip').forEach(el => el.remove());
  }

  function coachFirstRound() {
    if (!run || run.done || run.round !== 0) return;
    const cfg = COACH[run.type];
    const board = $('#mini-board');
    if (!cfg || !board) return;
    clearCoach();

    const target = run.question ? run.question.target : null;
    let el = null;
    if (run.type === 'odd' || run.type === 'catch') {
      el = board.querySelector(cfg.sel);
    } else if (target != null) {
      el = [...board.querySelectorAll(cfg.sel)].find(n => n.dataset.value === String(target)) || null;
    }

    catMood('ok', cfg.line);
    later(() => {
      if (!run || run.done || run.round !== 0) return;
      AudioFX.speakCat(cfg.line, { soft: true });
    }, 1400);

    if (!el) return;
    el.classList.add('coach-target');
    const br = board.getBoundingClientRect();
    const er = el.getBoundingClientRect();
    const tip = document.createElement('span');
    tip.className = 'coach-tip';
    tip.textContent = '👆';
    tip.style.left = (er.left - br.left + er.width / 2) + 'px';
    tip.style.top = (er.top - br.top) + 'px';
    board.appendChild(tip);
    coachTimer = later(clearCoach, 14000);
  }

  /* 开局故事条：把这一局「为什么要玩」讲清楚 */
  function storyHtml(type) {
    const g = GAMES[type];
    return '<div class="mini-story">' +
      '<div class="mini-story-cat">' + catSvg(94) + '</div>' +
      '<div class="mini-story-main">' +
        '<span class="mini-story-tag">🐾 小龙猫的任务</span>' +
        '<p class="mini-story-text">' + g.story + '</p>' +
        '<span class="mini-story-go">轻点一下，马上开始 →</span>' +
      '</div>' +
    '</div>';
  }

  /* 开局统一重置棋盘：清帧、清粒子、换场景类名、挂 canvas */
  function boardSetup(cls, html, sub, noCat) {
    const board = $('#mini-board');
    if (!board) return null;
    clearTicks();
    FX.detach();
    board.className = 'mini-board ' + cls;
    board.removeAttribute('style');
    board.onclick = null;
    board.onpointermove = null;
    board.onpointerdown = null;
    board.onpointerup = null;
    board.onpointerleave = null;
    board.innerHTML = html;
    if (sub) board.style.setProperty('--sub', sub);
    if (!noCat) catAdd(board);
    FX.mount(board);
    lastTs = 0;
    return board;
  }

  /* ---------- 暂停 / 恢复 ---------- */

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
    const board = $('#mini-board');
    if (board) board.classList.add('paused');
    AudioFX.stopSpeak();
  }

  function resumeRun() {
    if (!paused) return;
    paused = false;
    const board = $('#mini-board');
    if (board) board.classList.remove('paused');
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
    if (run && !run.done && run.timed && !timer) startTimer();
    lastTs = 0;
    kick();
  }

  function subjectName(key) {
    return (typeof Game !== 'undefined' && Game.SUBJECTS[key]) ? Game.SUBJECTS[key].name : '';
  }

  /* 混合挑战：每道题从这些学科里换着抽，练的是「切换」而不是单一学科 */
  const MIX_SUBJECTS = ['numbers', 'letters', 'pinyin', 'hanzi', 'words', 'math',
    'geometry', 'animals', 'plants', 'weather', 'space', 'body'];

  function subjectLabel(key) {
    if (key === 'mix') return '混合挑战';
    return subjectName(key) || '数字乐园';
  }

  function mixPick(last) {
    const pool = MIX_SUBJECTS.filter(k => k !== last);
    return pick(pool.length ? pool : MIX_SUBJECTS);
  }

  function mixTag(key) {
    const c = DATA.curriculum[key];
    if (!c) return '';
    return '<span class="q-mix" style="--c:' + c.color + '">' + Art.em(c.icon) + c.name + '</span>';
  }

  function noteMix(real) {
    if (!run) return;
    run.mixUsed = run.mixUsed || {};
    run.mixUsed[real] = (run.mixUsed[real] || 0) + 1;
  }

  /* ---------- 知识 → 题目：统一复用 Quiz.miniQuestion ---------- */

  function makeQuestion(subject, count) {
    if (subject !== 'mix') return Quiz.miniQuestion(subject, count);
    // 混合模式：随机换学科，尽量不和上一题重样
    const real = mixPick(run && run.mixLast);
    const q = Quiz.miniQuestion(real, count);
    if (!q) return q;
    if (run) {
      run.mixLast = real;
      noteMix(real);
    }
    q.subject = real;
    q.promptHtml = mixTag(real) + (q.promptHtml || q.prompt);
    return q;
  }

  /* 卡片/连线项里的图形：单个 emoji 放大，多个 emoji 排成小行，
     纯文字按长度分档 —— 避免「🍎🍎🍎🍎🍎」这类重复图案撑破卡片 */
  const LABEL_RE = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}]\uFE0F?(?:\u200D[\u{1F000}-\u{1FAFF}\u2600-\u27BF]\uFE0F?)*/gu;

  function artHtml(label) {
    const s = String(label);
    if (s.indexOf('<svg') === 0) {
      return '<span class="art-wrap is-svg"><span class="art-svg">' + s + '</span></span>';
    }
    const glyphs = s.match(LABEL_RE) || [];
    const bare = s.replace(LABEL_RE, '').replace(/[\uFE0F\u200D\s]/g, '');
    if (!glyphs.length) {
      return '<span class="art-wrap ' + (bare.length <= 4 ? 'is-char' : 'is-text') + '">' + Art.em(s) + '</span>';
    }
    if (!bare) {
      return '<span class="art-wrap ' + (glyphs.length === 1 ? 'is-solo' : 'is-multi') + '">' + Art.em(s) + '</span>';
    }
    return '<span class="art-wrap is-mixed">' + Art.em(s) + '</span>';
  }

  /* 选项的展示图案：题目带了 art 映射（动物/植物/天气/图形…）就画图案，
     否则退回选项文字 —— 保证「题目问什么，盘面上就是什么」 */
  function hasOptArt(val) {
    const map = run && run.question && run.question.art;
    return !!(map && map[val]);
  }

  function optHtml(val) {
    const map = run && run.question && run.question.art;
    return artHtml(map && map[val] ? map[val] : val);
  }

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

  const pairGame = () => !!(run && (run.type === 'memory' || run.type === 'match'));

  function setScore() {
    const el = $('#mini-score');
    if (!el || !run) return;
    if (pairGame()) {
      el.textContent = (run.type === 'match' ? '🧩 ' : '🃏 ') + run.matched + '/' + run.total;
      return;
    }
    const icon = { fish: '🐟 ', rocket: '🚀 ', catch: '🧺 ', odd: '🔍 ' }[run.type] || '✅ ';
    el.textContent = icon + run.correct + '/' + run.total;
  }

  function setProgress() {
    const fill = $('#mini-progress-fill');
    if (!fill || !run) return;
    const done = pairGame() ? run.matched : run.round;
    fill.style.width = Math.min(100, done / run.total * 100) + '%';
  }

  function cheer(el) {
    if (!run) return;
    const n = run.combo || 0;
    floatFx(el, n >= 2 ? '连对 ×' + n : '+1', n >= 3 ? 'hot' : '');
    if (run.lucky && el && el.classList && el.classList.contains('lucky')) {
      run.lucky = false;
      run.luckyHits = (run.luckyHits || 0) + 1;
      run.luckyCoins = (run.luckyCoins || 0) + LUCKY_COINS;
      const c = centerOf(el);
      if (c) {
        burstAt(c, ['#ffe066', '#fff3bf', '#ffd43b'], { count: 16, speed: 190, gravity: -30, size: 5, lift: 60, life: 900, shape: 'spark' });
        ringAt(c, '#ffe066');
      }
      floatFx(el, '✨ 幸运 +' + LUCKY_COINS, 'hot');
    }
  }

  /* 一题结束：答错也算过了这一题，避免孩子卡在同一题 */
  function roundDone(ok) {
    if (!run || run.done) return;
    clearCoach();
    if (ok) {
      run.correct++;
      run.combo = (run.combo || 0) + 1;
      run.bestCombo = Math.max(run.bestCombo || 0, run.combo);
      catOk();
    } else {
      run.wrong++;
      run.combo = 0;
      catNo();
    }
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

  function sayQuestion(delay) {
    if (!run || !run.question || !run.question.speak) return;
    const s = run.question.speak;
    later(() => {
      if (run && !run.done) AudioFX.speak(s.text, s.lang, s.audio);
    }, delay);
  }

  function nextRound() {
    if (!run || run.done || paused) return;
    if (run.type !== 'odd') run.question = makeQuestion(run.subject, run.optCount);
    // 第一题不打幸运标记，让孩子先看懂规则
    run.lucky = !!(LUCKY_GAMES[run.type] && run.round > 0 && Math.random() < LUCKY_RATE);
    const start = {
      mole: moleRound,
      bubble: bubbleRound,
      fish: fishRound,
      rocket: rocketRound,
      catch: catchRound,
      odd: oddRound
    }[run.type];
    if (start) {
      start();
      markLucky();
      if (run.round === 0) coachFirstRound();
    }
  }

  /* 把正确答案染成金色，并在提示条上说明「有额外奖励」 */
  function markLucky() {
    if (!run || run.done || !run.lucky) return;
    const board = $('#mini-board');
    const target = run.question && run.question.target;
    if (!board || target == null) return;
    let hit = false;
    board.querySelectorAll('[data-value]').forEach(el => {
      if (el.dataset.value !== String(target)) return;
      el.classList.add('lucky');
      hit = true;
    });
    if (!hit) { run.lucky = false; return; }
    const prompt = $('#mini-hint .mini-prompt');
    if (prompt) prompt.insertAdjacentHTML('beforeend', '<span class="lucky-tip">✨ 金色的有奖励</span>');
  }

  /* ---------- 计时（打地鼠整局倒计时 / 接果子每题倒计时） ---------- */

  function leftSeconds() {
    if (!run || !run.deadline) return 0;
    return Math.max(0, Math.ceil((run.deadline - Date.now()) / 1000));
  }

  function startTimer() {
    if (timer) clearInterval(timer);
    timer = setInterval(() => {
      if (!run || run.done) return;
      const left = leftSeconds();
      const el = $('#mini-hint .mini-timer');
      if (el) {
        el.textContent = '⏱ ' + left + 's';
        el.classList.toggle('low', left <= 10);
      }
      if (left > 0) return;
      if (run.type === 'catch') catchTimeout();
      else finishMini();
    }, 400);
  }

  /* ---------- 打地鼠 ---------- */

  const MOLE_FACES = ['🐹', '🐰', '🦊', '🐻'];

  function startMole() {
    const holes = Array.from({ length: 9 }, (_, i) =>
      '<button class="whack-hole" data-hole="' + i + '" aria-label="地鼠洞">' +
        '<span class="whack-pit"></span>' +
        '<span class="whack-body"><span class="whack-face">🐹</span><span class="whack-val"></span></span>' +
        '<span class="whack-rim"></span>' +
      '</button>').join('');

    const board = boardSetup('whack-board',
      '<div class="whack-scene">' +
        '<div class="whack-sky"><i class="whack-sun"></i><i class="whack-cloud a"></i><i class="whack-cloud b"></i></div>' +
        '<div class="whack-field">' + holes + '</div>' +
        '<div class="whack-mallet" aria-hidden="true"><span class="whack-mallet-i">🔨</span></div>' +
      '</div>', GAMES.mole.color);

    run.round = 0;
    run.correct = 0;
    run.wrong = 0;
    run.combo = 0;
    run.timed = true;
    run.deadline = Date.now() + ((run.round === 0 ? 72 : 60) + run.tier * 2) * 1000;
    setScore();
    setProgress();

    board.onpointermove = e => {
      if (!run || run.done) return;
      const r = board.getBoundingClientRect();
      board.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      board.style.setProperty('--my', (e.clientY - r.top) + 'px');
      const m = board.querySelector('.whack-mallet');
      if (m) m.classList.add('show');
    };
    board.onpointerdown = () => {
      const m = board.querySelector('.whack-mallet');
      if (!m) return;
      m.classList.remove('swing');
      void m.offsetWidth;
      m.classList.add('swing');
    };

    board.onclick = e => {
      const hole = e.target.closest('.whack-hole');
      if (!hole || !run || run.done || run.locked || !hole.classList.contains('up')) return;
      const c = centerOf(hole);
      if (hole.dataset.value === run.question.target) {
        run.locked = true;
        hole.classList.add('hit');
        AudioFX.correct();
        burstAt(c, ['#ffe08a', '#ffb703', '#ffffff'], { count: 18, speed: 250, gravity: 900, size: 5, shape: 'spark' });
        ringAt(c, '#fff2b8');
        shake(0.55);
        roundDone(true);
        cheer(hole);
        if (run.question.answerSay) later(() => {
          if (run && !run.done) AudioFX.speak(run.question.answerSay.text, run.question.answerSay.lang, run.question.answerSay.audio);
        }, 120);
      } else {
        run.locked = true;
        wrongTap(hole);
        shake(1.1);
        burstAt(c, ['#c9d3d9', '#e7eef2'], { count: 9, speed: 130, gravity: 640, size: 3 });
        hole.classList.add('hit');
        setHint('🔨 答案是 ' + run.question.target, '⏱ ' + leftSeconds() + 's');
        roundDone(false);
      }
    };

    nextRound();
    startTimer();
  }

  function moleRound() {
    run.locked = false;
    const board = $('#mini-board');
    const holes = [...board.querySelectorAll('.whack-hole')];
    holes.forEach(h => {
      h.classList.remove('up', 'hit', 'lucky');
      h.dataset.value = '';
      h.style.removeProperty('--d');
      const v = h.querySelector('.whack-val');
      if (v) v.textContent = '';
    });

    const spots = shuffle([0, 1, 2, 3, 4, 5, 6, 7, 8]).slice(0, run.optCount);
    spots.forEach((spot, i) => {
      const hole = holes[spot];
      const value = run.question.options[i];
      hole.dataset.value = value;
      hole.querySelector('.whack-face').innerHTML = hasOptArt(value) ? optHtml(value) : pick(MOLE_FACES);
      hole.querySelector('.whack-val').textContent = value;
      hole.style.setProperty('--d', (i * 90) + 'ms');
      hole.classList.add('up');
    });

    setHint('🔨 ' + (run.question.promptHtml || run.question.prompt), '⏱ ' + leftSeconds() + 's');
    sayQuestion(180);
    setProgress();
  }

  /* ---------- 戳泡泡 ---------- */

  function startBubble() {
    const board = boardSetup('bub-board',
      '<div class="bub-tank">' +
        '<i class="bub-ray"></i>' +
        '<i class="bub-weed a"></i><i class="bub-weed b"></i>' +
        '<div class="bub-field"></div>' +
      '</div>', GAMES.bubble.color);

    run.round = 0;
    run.correct = 0;
    run.wrong = 0;
    run.combo = 0;
    run.locked = false;
    setScore();
    setProgress();

    board.onclick = e => {
      const b = e.target.closest('.bub');
      if (!b || !run || run.done || run.locked || b.classList.contains('pop')) return;
      const c = centerOf(b);
      if (b.dataset.value === run.question.target) {
        run.locked = true;
        b.classList.add('pop');
        AudioFX.pop();
        AudioFX.correct();
        burstAt(c, ['#ffffff', '#bfe9ff', '#8fd8ff'], { count: 16, speed: 210, gravity: 520, size: 6 });
        ringAt(c, '#bdeaff');
        roundDone(true);
        cheer(b);
        if (run.question.answerSay) later(() => {
          if (run && !run.done) AudioFX.speak(run.question.answerSay.text, run.question.answerSay.lang, run.question.answerSay.audio);
        }, 160);
      } else {
        run.locked = true;
        wrongTap(b);
        shake(0.85);
        burstAt(c, ['#9fb8c8', '#d7e7ef'], { count: 8, speed: 110, gravity: 540, size: 3 });
        setHint('🫧 答案是 ' + run.question.target);
        roundDone(false);
      }
    };

    nextRound();
  }

  function bubbleRound() {
    run.locked = false;
    const field = document.querySelector('#mini-board .bub-field');
    if (!field) return;

    const n = run.optCount;
    const rows = n <= 4 ? 2 : 3;
    const cols = Math.ceil(n / rows);
    const slots = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) slots.push({ r, c });
    }
    const chosen = shuffle(slots).slice(0, n);

    field.innerHTML = chosen.map((s, i) => {
      const val = run.question.options[i];
      const x = ((s.c + 0.5) / cols * 100 + rnd(-5, 5)).toFixed(1);
      const y = ((s.r + 0.5) / rows * 100 + rnd(-6, 6)).toFixed(1);
      const sz = rnd(78, 98);
      const dur = (4.2 + Math.random() * 1.8).toFixed(2);
      const delay = (-Math.random() * 3).toFixed(2);
      return '<button class="bub" data-value="' + val + '" aria-label="泡泡"' +
        ' style="--x:' + x + '%;--y:' + y + '%;--sz:' + sz + 'px;--dur:' + dur + 's;--d:' + delay + 's">' +
        '<span class="bub-body"><span class="bub-val">' + optHtml(val) + '</span></span></button>';
    }).join('');

    setHint('🫧 ' + (run.question.promptHtml || run.question.prompt));
    sayQuestion(150);
    setProgress();
  }

  /* ---------- 翻翻乐 ---------- */

  function memoryPairs(subject, count) {
    const total = count || MEMORY_PAIRS;
    const pairs = [];
    if (subject === 'mix') {
      // 混合翻牌：从不同学科各取一对，左右标签也做去重，避免两张卡长得一样
      const used = new Set();
      let guard = 0;
      while (pairs.length < total && guard++ < total * 8) {
        const s = pick(MIX_SUBJECTS);
        const one = memoryPairs(s, 1)[0];
        if (!one) continue;
        const la = String(one.a);
        const lb = String(one.b);
        if (used.has(la) || used.has(lb)) continue;
        used.add(la); used.add(lb);
        pairs.push(Object.assign(one, { id: pairs.length, subject: s }));
      }
      return pairs;
    }
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
    } else if (subject === 'geometry') {
      // 图形空间：图形插画 ↔ 图形名称（插画用 Quiz.shapeSvg 直接渲染）
      shuffle(DATA.shapes.slice()).slice(0, total).forEach((s, i) => {
        pairs.push({ id: i, a: Quiz.shapeSvg(s.id, '#ffb703'), b: s.zh, say: { text: s.zh, lang: 'zh-CN' } });
      });
    } else if (subject === 'expression') {
      // 表达工坊：图片 ↔ 句子
      shuffle(DATA.sentences.slice()).slice(0, total).forEach((s, i) => {
        pairs.push({ id: i, a: s.emoji, b: s.zh, say: { text: s.zh, lang: 'zh-CN' } });
      });
    } else if (subject === 'animals') {
      shuffle(DATA.sciAnimals.slice()).slice(0, total).forEach((a, i) => {
        pairs.push({ id: i, a: a.emoji, b: a.zh, say: { text: a.zh + '，它的宝宝叫' + a.baby, lang: 'zh-CN' } });
      });
    } else if (subject === 'plants') {
      shuffle(DATA.sciPlants.slice()).slice(0, total).forEach((p, i) => {
        pairs.push({ id: i, a: p.emoji, b: p.zh, say: { text: p.zh, lang: 'zh-CN' } });
      });
    } else if (subject === 'weather') {
      shuffle(DATA.sciWeather.slice()).slice(0, total).forEach((w, i) => {
        pairs.push({ id: i, a: w.emoji, b: w.zh, say: { text: w.zh, lang: 'zh-CN' } });
      });
    } else if (subject === 'space') {
      // 地球太空：从天空/太空题目答案里取出带图的名词，按名称去重
      const seen = new Set();
      const pool = [];
      (DATA.sciSpaceFacts || []).forEach(f => {
        const a = f.a;
        if (a && typeof a === 'object' && a.emoji && !seen.has(a.zh)) {
          seen.add(a.zh);
          pool.push(a);
        }
      });
      shuffle(pool).slice(0, total).forEach((a, i) => {
        pairs.push({ id: i, a: a.emoji, b: a.zh, say: { text: a.zh, lang: 'zh-CN' } });
      });
    } else if (subject === 'body') {
      shuffle(DATA.sciBodyParts.slice()).slice(0, total).forEach((b, i) => {
        pairs.push({ id: i, a: b.emoji, b: b.zh, say: { text: b.zh, lang: 'zh-CN' } });
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
    const pairs = memoryPairs(run.subject, run.total);
    run.total = Math.max(1, pairs.length);
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
    run.combo = 0;
    run.first = null;
    run.locked = false;

    const board = boardSetup('mem-board',
      '<div class="mem-grid">' + deck.map((c, i) =>
        '<button class="mcard" data-card="' + i + '" aria-label="翻牌">' +
          '<span class="mcard-in">' +
            '<span class="mcard-face mcard-cover"><span class="mcard-paw">' + Art.em('🌿') + '</span></span>' +
            '<span class="mcard-face mcard-back">' + artHtml(c.label) + '</span>' +
          '</span>' +
        '</button>').join('') + '</div>', GAMES.memory.color);

    board.onclick = e => {
      const card = e.target.closest('.mcard');
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
      const firstCard = document.querySelector('.mcard[data-card="' + firstIdx + '"]');
      const first = run.cards[firstIdx];

      if (first.pair === data.pair) {
        firstCard.classList.add('matched');
        card.classList.add('matched');
        run.matched++;
        run.correct = run.matched;
        run.combo = (run.combo || 0) + 1;
        run.bestCombo = Math.max(run.bestCombo || 0, run.combo);
        AudioFX.correct();
        const c1 = centerOf(firstCard);
        const c2 = centerOf(card);
        if (c1) burstAt(c1, ['#ffe08a', '#8ce8a8', '#ffffff'], { count: 12, speed: 200, gravity: 700 });
        if (c2) burstAt(c2, ['#ffe08a', '#8ce8a8', '#ffffff'], { count: 12, speed: 200, gravity: 700 });
        if (c2) ringAt(c2, '#c8f7d6');
        setScore();
        setProgress();
        setHint('🎉 配对成功！' + data.label, '已翻 ' + run.moves + ' 次');
        floatFx(card, run.combo >= 2 ? '连对 ×' + run.combo : '配对 +1', run.combo >= 3 ? 'hot' : '');
        catOk();
        if (run.matched >= run.total) later(finishMini, 700);
      } else {
        run.locked = true;
        run.wrong++;
        run.combo = 0;
        catNo();
        AudioFX.wrong();
        shake(0.7);
        firstCard.classList.add('miss');
        card.classList.add('miss');
        later(() => {
          if (!run || run.done) return;
          firstCard.classList.remove('flipped', 'miss');
          card.classList.remove('flipped', 'miss');
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

  function hookTo(el) {
    const board = $('#mini-board');
    if (!board) return;
    const rod = board.querySelector('.pond-rod');
    const line = board.querySelector('.fish-line');
    if (!rod || !line) return;
    const a = centerOf(rod);
    const p = centerOf(el);
    if (!a || !p) return;
    const dx = p.x - a.x;
    const dy = p.y - a.y;
    line.style.left = a.x + 'px';
    line.style.top = a.y + 'px';
    line.style.height = Math.hypot(dx, dy) + 'px';
    line.style.transform = 'rotate(' + (Math.atan2(dx, dy) * 180 / Math.PI) + 'deg)';
    line.classList.add('show');
    later(() => line.classList.remove('show'), 1100);
  }

  function startFish() {
    const board = boardSetup('pond-board',
      '<div class="pond">' +
        '<div class="pond-surface"></div>' +
        '<i class="pond-weed a"></i><i class="pond-weed b"></i>' +
        '<div class="pond-lanes"></div>' +
        '<i class="fish-line"></i>' +
        '<span class="pond-rod">🎣</span>' +
      '</div>', GAMES.fish.color);

    run.round = 0;
    run.correct = 0;
    run.wrong = 0;
    run.combo = 0;
    run.locked = false;
    setScore();
    setProgress();

    run.relayout = () => {
      const lanes = document.querySelector('#mini-board .pond-lanes');
      if (!lanes) return;
      const w = lanes.clientWidth || 0;
      (run.swimmers || []).forEach(f => {
        f.span = Math.max(40, w - f.w - 14);
        f.x = clamp(f.x, 6, f.span);
      });
    };

    board.onclick = e => {
      const f = e.target.closest('.fishie');
      if (!f || !run || run.done || run.locked || f.classList.contains('caught')) return;
      const swimmer = (run.swimmers || []).find(x => x.el === f);
      if (!swimmer) return;
      const c = centerOf(f);

      if (f.dataset.value === run.question.target) {
        run.locked = true;
        swimmer.alive = false;
        hookTo(f);
        AudioFX.correct();
        burstAt(c, ['#ffffff', '#a8e6ff', '#7bd6a3'], { count: 16, speed: 210, gravity: 640, size: 5 });
        ringAt(c, '#c8f0ff');
        const fromX = swimmer.x;
        const fromY = swimmer.bob || 0;
        anim(620, (en) => {
          f.style.transform = 'translate3d(' + fromX.toFixed(1) + 'px,' + (fromY - 90 * en).toFixed(1) + 'px,0) rotate(' + (en * 14).toFixed(1) + 'deg)';
        }, Ease.outCubic);
        f.classList.add('caught');
        roundDone(true);
        cheer(f);
        if (run.question.answerSay) later(() => {
          if (run && !run.done) AudioFX.speak(run.question.answerSay.text, run.question.answerSay.lang, run.question.answerSay.audio);
        }, 140);
      } else {
        run.locked = true;
        swimmer.alive = false;
        wrongTap(f);
        shake(0.9);
        burstAt(c, ['#9fd4e6', '#d8f0f8'], { count: 8, speed: 110, gravity: 560, size: 3 });
        setHint('🎣 正确答案是 ' + run.question.target);
        roundDone(false);
      }
    };

    nextRound();
  }

  function fishRound() {
    run.locked = false;
    const lanes = document.querySelector('#mini-board .pond-lanes');
    if (!lanes) return;
    lanes.innerHTML = '';
    const pondW = lanes.clientWidth || 600;
    const laneH = 100 / Math.max(1, run.optCount);
    const faces = ['🐟', '🐠', '🐡'];

    run.swimmers = run.question.options.map((val, i) => {
      const el = document.createElement('button');
      el.className = 'fishie';
      el.dataset.value = val;
      el.setAttribute('aria-label', '小鱼');
      el.style.top = 'calc(' + (laneH * i + laneH / 2) + '% - 31px)';
      // 鱼身优先显示选项自己的图案（图形/动物），文字仍保留在下方小标签
      const body = hasOptArt(val)
        ? '<span class="fishie-art">' + optHtml(val) + '</span>'
        : '<span class="fishie-face">' + faces[i % faces.length] + '</span>';
      el.innerHTML = '<span class="fishie-body">' + body +
        '<span class="fishie-val">' + val + '</span></span>';
      lanes.appendChild(el);

      const w = el.offsetWidth || 128;
      const span = Math.max(40, pondW - w - 14);
      const vx = (24 + run.tier * 12) * (Math.random() < 0.5 ? -1 : 1);
      return {
        el, val, w, span,
        x: rnd(0, Math.max(1, Math.floor(span))),
        vx,
        ph: Math.random() * 6.283,
        bob: 0,
        alive: true
      };
    });

    setTick((k, dt) => {
      if (!run || run.done) return;
      (run.swimmers || []).forEach(f => {
        if (!f.alive) return;
        f.x += f.vx * dt / 1000;
        if (f.x < 6) { f.x = 6; f.vx = Math.abs(f.vx); }
        if (f.x > f.span) { f.x = f.span; f.vx = -Math.abs(f.vx); }
        f.ph += dt / 420;
        f.bob = Math.sin(f.ph) * 7;
        f.el.style.setProperty('--dir', f.vx >= 0 ? 1 : -1);
        f.el.style.transform = 'translate3d(' + f.x.toFixed(1) + 'px,' + f.bob.toFixed(1) + 'px,0)';
      });
    });

    const hint = $('#mini-hint');
    if (hint) {
      hint.innerHTML = '<span class="mini-prompt">' +
        (run.question.promptHtml || '🎧 听一听，钓上正确的答案') + '</span>' +
        '<button class="mini-replay" data-mini-replay>🔊 再听一遍</button>';
    }
    sayQuestion(320);
    setProgress();
  }

  function replayFish() {
    if (!run || run.done || !run.question || !run.question.speak) return;
    AudioFX.speak(run.question.speak.text, run.question.speak.lang, run.question.speak.audio);
  }

  /* ---------- 火箭冲关 ---------- */

  function startRocket() {
    const dots = Array.from({ length: run.total + 1 }, (_, i) =>
      '<i class="route-dot' + (i === 0 ? ' lit' : '') + '" data-dot="' + i + '"></i>').join('');
    const pods = Array.from({ length: run.optCount }, (_, i) =>
      '<button class="rocket-pod" data-idx="' + i + '" aria-label="燃料舱"><span></span></button>').join('');

    const board = boardSetup('space-board',
      '<div class="space-scene">' +
        '<div class="star-layer a"></div><div class="star-layer b"></div>' +
        '<div class="route">' +
          '<i class="route-line"></i>' +
          '<div class="route-dots">' + dots + '</div>' +
          '<span class="planet">🪐</span>' +
          '<span class="ship"><span class="ship-i">🚀</span></span>' +
        '</div>' +
        '<div class="pods">' + pods + '</div>' +
      '</div>', GAMES.rocket.color);

    run.round = 0;
    run.correct = 0;
    run.wrong = 0;
    run.combo = 0;
    run.locked = false;
    run.shipPos = 0;
    setScore();
    setProgress();

    board.onclick = e => {
      const pod = e.target.closest('.rocket-pod');
      if (!pod || !run || run.done || run.locked) return;
      if (pod.dataset.value === run.question.target) {
        run.locked = true;
        pod.classList.add('boost');
        AudioFX.correct();
        burstAt(centerOf(pod), ['#ffd166', '#ff8b5a', '#ffffff'], { count: 14, speed: 220, gravity: 620, size: 4, shape: 'spark' });
        roundDone(true);
        flyShip(run.correct);
        cheer(pod);
        if (run.question.answerSay) later(() => {
          if (run && !run.done) AudioFX.speak(run.question.answerSay.text, run.question.answerSay.lang, run.question.answerSay.audio);
        }, 130);
      } else {
        run.locked = true;
        wrongTap(pod);
        shake(1);
        setHint('🚀 答案是 ' + run.question.target);
        roundDone(false);
      }
    };

    nextRound();
  }

  function flyShip(toIdx) {
    const board = $('#mini-board');
    if (!board) return;
    const ship = board.querySelector('.ship');
    if (!ship) return;
    const dots = [...board.querySelectorAll('.route-dot')];
    const total = Math.max(1, run.total);
    const from = clamp(run.shipPos || 0, 0, total);
    const to = clamp(toIdx, 0, total);
    dots.forEach((d, i) => { if (i <= to) d.classList.add('lit'); });
    if (FX.reduced()) {
      ship.style.left = (6 + (to / total) * 88) + '%';
      run.shipPos = to;
      return;
    }
    anim(680, (e) => {
      const pct = (from + (to - from) * e) / total;
      ship.style.left = (6 + pct * 88) + '%';
      if (Math.random() < 0.45) {
        const c = centerOf(ship);
        if (c) FX.burst(c.x - 12, c.y + 8, { count: 1, colors: ['#ffd166', '#ff8b5a'], speed: 40, gravity: 90, size: 3, life: 420, lift: 30 });
      }
    }, Ease.inOutCubic);
    run.shipPos = to;
  }

  function rocketRound() {
    run.locked = false;
    const pods = [...document.querySelectorAll('#mini-board .rocket-pod')];
    pods.forEach((p, i) => {
      const val = run.question.options[i];
      p.classList.remove('boost', 'miss', 'lucky');
      p.dataset.value = val;
      p.innerHTML = '<span>' + optHtml(val) + '</span>';
    });
    setHint('🚀 ' + (run.question.promptHtml || run.question.prompt));
    sayQuestion(190);
    setProgress();
  }

  /* ---------- 连线配对 ---------- */

  function labelHtml(label) {
    return artHtml(label);
  }

  function anchorOf(el) {
    const wrap = document.querySelector('#mini-board .link-wrap');
    if (!wrap || !el) return null;
    const r = wrap.getBoundingClientRect();
    const b = el.getBoundingClientRect();
    return { x: b.left - r.left + b.width / 2, y: b.top - r.top + b.height / 2 };
  }

  function linkPath(a, b) {
    if (!a || !b) return '';
    const dx = Math.max(30, Math.abs(b.x - a.x) * 0.42);
    return 'M ' + a.x.toFixed(1) + ' ' + a.y.toFixed(1) +
      ' C ' + (a.x + dx).toFixed(1) + ' ' + a.y.toFixed(1) +
      ', ' + (b.x - dx).toFixed(1) + ' ' + b.y.toFixed(1) +
      ', ' + b.x.toFixed(1) + ' ' + b.y.toFixed(1);
  }

  function startMatch() {
    const pairs = memoryPairs(run.subject, run.total);
    run.total = Math.max(1, pairs.length);
    const left = shuffle(pairs);
    const right = shuffle(pairs.slice());

    run.matched = 0;
    run.round = 0;
    run.correct = 0;
    run.wrong = 0;
    run.combo = 0;
    run.pick = null;
    run.locked = false;
    run.links = [];

    const board = boardSetup('link-board',
      '<div class="link-wrap">' +
        '<svg class="link-svg" aria-hidden="true">' +
          '<defs><linearGradient id="linkGrad" x1="0" y1="0" x2="1" y2="0">' +
            '<stop offset="0" stop-color="#7bd6a3"></stop>' +
            '<stop offset="1" stop-color="#5d8bf4"></stop>' +
          '</linearGradient></defs>' +
          '<g class="link-paths"></g>' +
          '<path class="link-rubber" d=""></path>' +
        '</svg>' +
        '<div class="link-col">' + left.map((c, i) =>
          '<button class="link-item" data-side="left" data-pair="' + c.id + '" data-idx="' + i + '" aria-label="左边第 ' + (i + 1) + ' 项">' +
          labelHtml(c.a) + '</button>').join('') + '</div>' +
        '<div class="link-col">' + right.map((c, i) =>
          '<button class="link-item" data-side="right" data-pair="' + c.id + '" data-idx="' + i + '" aria-label="右边第 ' + (i + 1) + ' 项">' +
          labelHtml(c.b) + '</button>').join('') + '</div>' +
      '</div>', GAMES.match.color);

    const wrap = board.querySelector('.link-wrap');
    const rubber = board.querySelector('.link-rubber');
    const gPaths = board.querySelector('.link-paths');

    const hideRubber = () => { if (rubber) { rubber.classList.remove('show'); rubber.setAttribute('d', ''); } };

    board.onpointermove = e => {
      if (!run || run.done || !run.pick || !rubber) return;
      const r = wrap.getBoundingClientRect();
      const a = anchorOf(run.pick.el);
      const p = { x: e.clientX - r.left, y: e.clientY - r.top };
      rubber.setAttribute('d', linkPath(a, p));
      rubber.classList.add('show');
    };

    run.relayout = () => {
      (run.links || []).forEach(l => {
        l.path.setAttribute('d', linkPath(anchorOf(l.leftEl), anchorOf(l.rightEl)));
        l.path.style.strokeDasharray = String(l.path.getTotalLength());
        l.path.style.strokeDashoffset = '0';
      });
      hideRubber();
    };

    setHint('🧩 左右各点一个，把好朋友配成一对', '0/' + run.total);
    setScore();
    setProgress();

    board.onclick = e => {
      const item = e.target.closest('.link-item');
      if (!item || !run || run.done || run.locked || item.classList.contains('paired')) return;
      AudioFX.pop();

      if (!run.pick) {
        run.pick = { el: item, side: item.dataset.side, pair: item.dataset.pair };
        item.classList.add('sel');
        setHint('🧩 再点另一边的好朋友', run.matched + '/' + run.total);
        return;
      }
      if (run.pick.el === item) {
        item.classList.remove('sel');
        run.pick = null;
        hideRubber();
        setHint('🧩 左右各点一个，把好朋友配成一对', run.matched + '/' + run.total);
        return;
      }
      if (run.pick.side === item.dataset.side) {
        run.pick.el.classList.remove('sel');
        run.pick = { el: item, side: item.dataset.side, pair: item.dataset.pair };
        item.classList.add('sel');
        return;
      }

      const first = run.pick;
      run.pick = null;
      first.el.classList.remove('sel');
      hideRubber();

      if (first.pair === item.dataset.pair) {
        first.el.classList.add('paired');
        item.classList.add('paired');
        run.matched++;
        run.correct = run.matched;
        run.combo = (run.combo || 0) + 1;
        run.bestCombo = Math.max(run.bestCombo || 0, run.combo);
        AudioFX.correct();

        const a = anchorOf(first.el);
        const b = anchorOf(item);
        const path = document.createElementNS(SVG_NS, 'path');
        path.setAttribute('class', 'link-line');
        path.setAttribute('d', linkPath(a, b));
        gPaths.appendChild(path);
        const len = path.getTotalLength();
        path.style.strokeDasharray = String(len);
        path.style.strokeDashoffset = String(len);
        requestAnimationFrame(() => { path.style.strokeDashoffset = '0'; });
        run.links.push({ path, leftEl: first.el, rightEl: item });

        burstAt(centerOf(item), ['#7bd6a3', '#5d8bf4', '#ffffff'], { count: 14, speed: 200, gravity: 660, size: 4 });
        if (a) burstAt({ x: a.x, y: a.y }, ['#7bd6a3', '#ffffff'], { count: 8, speed: 150, gravity: 600, size: 3 });

        setScore();
        setProgress();
        setHint('🎉 配对成功！', run.matched + '/' + run.total);
        floatFx(item, run.combo >= 2 ? '连对 ×' + run.combo : '配对 +1', run.combo >= 3 ? 'hot' : '');
        catOk();
        const pair = pairs.find(p => String(p.id) === item.dataset.pair);
        if (pair && pair.say) later(() => {
          if (run && !run.done) AudioFX.speak(pair.say.text, pair.say.lang, pair.say.audio);
        }, 120);
        if (run.matched >= run.total) later(finishMini, 700);
      } else {
        run.locked = true;
        run.wrong++;
        run.combo = 0;
        catNo();
        AudioFX.wrong();
        shake(0.8);
        first.el.classList.add('miss');
        item.classList.add('miss');
        later(() => {
          if (!run || run.done) return;
          first.el.classList.remove('miss');
          item.classList.remove('miss');
          run.locked = false;
          setHint('🧩 再找找看，它们不是一对', run.matched + '/' + run.total);
        }, 720);
      }
    };
  }

  /* ---------- 接果子 ---------- */

  /* 下落手感：重力缓增，但末端限速，避免果子到篮子前突然变快 */
  const catchVy = () => 10 + (run ? run.tier : 0) * 2;
  const catchGravity = () => 300 + (run ? run.tier : 0) * 40;
  const catchMaxVy = () => 200 + (run ? run.tier : 0) * 40;

  function startCatch() {
    const board = boardSetup('orchard-board',
      '<div class="orchard">' +
        '<i class="orchard-sun"></i>' +
        '<i class="orchard-hill a"></i><i class="orchard-hill b"></i>' +
        '<div class="orchard-field"></div>' +
        '<div class="orchard-tip">按住并左右拖动篮子</div>' +
        '<div class="basket"><span class="basket-emoji">🧺</span></div>' +
      '</div>', GAMES.catch.color);

    run.round = 0;
    run.correct = 0;
    run.wrong = 0;
    run.combo = 0;
    run.locked = false;
    run.timed = true;
    setScore();
    setProgress();

    const setTarget = e => {
      if (!run || run.done) return;
      const r = board.getBoundingClientRect();
      run.baskTarget = clamp(e.clientX - r.left, 30, r.width - 30);
    };
    board.onpointermove = setTarget;
    board.onpointerdown = setTarget;

    run.relayout = () => {
      const field = document.querySelector('#mini-board .orchard-field');
      if (!field) return;
      run.fieldW = field.clientWidth || 600;
      run.fieldH = field.clientHeight || 380;
    };

    nextRound();
  }

  function catchRound() {
    run.locked = false;
    const board = $('#mini-board');
    const field = board && board.querySelector('.orchard-field');
    const basket = board && board.querySelector('.basket');
    if (!field || !basket) return;

    field.innerHTML = '';
    run.fruits = [];
    run.fieldW = field.clientWidth || 600;
    run.fieldH = field.clientHeight || 380;
    run.baskX = run.fieldW / 2;
    run.baskTarget = run.baskX;
    basket.style.left = run.baskX + 'px';

    // 第一回合慢一点、久一点，让孩子先看清规则
    const first = run.round === 0;
    const limit = first ? 20 : 14;
    run.question.options.forEach((val, i) => {
      const el = document.createElement('div');
      el.className = 'fruit-drop';
      el.dataset.value = val;
      // 掉落物就是选项本身：有图案先画图案（动物/图形…），没有就放大文字
      el.innerHTML = '<span class="fruit-face">' + optHtml(val) + '</span>' +
        (hasOptArt(val) ? '<span class="fruit-val">' + val + '</span>' : '');
      field.appendChild(el);
      run.fruits.push({
        el, val,
        x: 40 + Math.random() * Math.max(1, run.fieldW - 80),
        y: -90 - i * 110,
        vy: catchVy(),
        delay: i * 420 + (first ? 1400 : 0),
        state: 'fall'
      });
      el.style.transform = 'translate3d(' + (run.fruits[run.fruits.length - 1].x - 34) + 'px,' +
        run.fruits[run.fruits.length - 1].y + 'px,0)';
    });

    run.deadline = Date.now() + limit * 1000;
    startTimer();
    setHint('🍎 ' + (run.question.promptHtml || run.question.prompt), '⏱ ' + limit + 's');
    sayQuestion(220);

    setTick((k, dt) => {
      if (!run || run.done || !run.fruits) return;
      const W = run.fieldW || field.clientWidth || 600;
      const H = run.fieldH || field.clientHeight || 380;
      const bw = basket.offsetWidth || 96;
      const floor = H - 16;

      run.baskX += (run.baskTarget - run.baskX) * Math.min(1, 0.22 * k);
      run.baskX = clamp(run.baskX, bw / 2, W - bw / 2);
      basket.style.left = run.baskX.toFixed(1) + 'px';

      for (let i = 0; i < run.fruits.length; i++) {
        const f = run.fruits[i];
        if (f.state !== 'fall') continue;
        if (f.delay > 0) { f.delay -= dt; continue; }
        f.vy = Math.min(catchMaxVy(), f.vy + catchGravity() * dt / 1000);
        f.y += f.vy * dt / 1000;
        f.el.style.transform = 'translate3d(' + (f.x - 34).toFixed(1) + 'px,' +
          f.y.toFixed(1) + 'px,0) rotate(' + (f.vy * 0.02).toFixed(1) + 'deg)';

        if (run.locked) continue;
        if (f.y > floor - 96 && f.y < floor + 16 && Math.abs(f.x - run.baskX) < bw * 0.6) {
          catchFruit(f);
        } else if (f.y > floor + 26) {
          dropFruit(f);
        }
      }
    });
  }

  function catchFruit(f) {
    if (!run || run.locked) return;
    f.state = 'gone';
    const c = centerOf(f.el);
    if (f.val === run.question.target) {
      run.locked = true;
      AudioFX.correct();
      burstAt(c, ['#ffe08a', '#ffb703', '#ffffff'], { count: 18, speed: 250, gravity: 820, size: 5, shape: 'spark' });
      ringAt(c, '#ffe9a8');
      const basket = document.querySelector('#mini-board .basket');
      if (basket) {
        basket.classList.add('bump');
        later(() => basket.classList.remove('bump'), 360);
      }
      roundDone(true);
      cheer(f.el);
      if (run.question.answerSay) later(() => {
        if (run && !run.done) AudioFX.speak(run.question.answerSay.text, run.question.answerSay.lang, run.question.answerSay.audio);
      }, 140);
    } else {
      run.locked = true;
      AudioFX.wrong();
      shake(1);
      f.el.classList.add('splat');
      burstAt(c, ['#c9b39a', '#e2d3bd'], { count: 10, speed: 140, gravity: 760, size: 3 });
      setHint('🍎 正确答案是 ' + run.question.target, '⏱ ' + leftSeconds() + 's');
      roundDone(false);
    }
  }

  function dropFruit(f) {
    if (!run) return;
    f.state = 'gone';
    const c = centerOf(f.el);
    f.el.classList.add('splat');
    burstAt(c, ['#c9b39a', '#b7d38f'], { count: 7, speed: 120, gravity: 760, size: 3 });
    later(() => {
      if (!run || run.done || run.locked || !run.fruits) return;
      const W = run.fieldW || 600;
      f.state = 'fall';
      f.y = -80;
      f.vy = catchVy();
      f.x = 40 + Math.random() * Math.max(1, W - 80);
      f.delay = 420;
      f.el.classList.remove('splat');
      f.el.style.opacity = '1';
    }, 480);
  }

  function catchTimeout() {
    if (!run || run.done || run.locked) return;
    run.locked = true;
    AudioFX.wrong();
    shake(0.9);
    setHint('🍎 正确答案是 ' + run.question.target);
    roundDone(false);
  }

  /* ---------- 火眼金睛 ---------- */

  function startOdd() {
    const board = boardSetup('eye-board',
      '<div class="odd-wrap">' +
        '<div class="odd-grid"></div>' +
        '<div class="lens" aria-hidden="true"><div class="lens-inner"></div></div>' +
      '</div>', GAMES.odd.color);

    run.round = 0;
    run.correct = 0;
    run.wrong = 0;
    run.combo = 0;
    run.locked = false;
    setScore();
    setProgress();

    const wrap = board.querySelector('.odd-wrap');

    board.onpointermove = e => {
      if (!run || run.done) return;
      const r = wrap.getBoundingClientRect();
      moveLens(e.clientX - r.left, e.clientY - r.top);
    };
    board.onpointerleave = () => {
      const lens = wrap.querySelector('.lens');
      if (lens) lens.classList.remove('show');
    };

    run.relayout = () => { syncLens(); };

    board.onclick = e => {
      const cell = e.target.closest('.odd-cell');
      if (!cell || !run || run.done || run.locked || cell.classList.contains('found')) return;
      const c = centerOf(cell);
      if (cell.dataset.odd === '1') {
        run.locked = true;
        cell.classList.add('found');
        AudioFX.correct();
        burstAt(c, ['#e0c7ff', '#a06cd5', '#ffffff'], { count: 18, speed: 230, gravity: 700, size: 5, shape: 'spark' });
        ringAt(c, '#d9c2ff');
        roundDone(true);
        cheer(cell);
        if (run.question && run.question.answerSay) later(() => {
          if (run && !run.done) AudioFX.speak(run.question.answerSay.text, run.question.answerSay.lang, run.question.answerSay.audio);
        }, 140);
      } else {
        run.locked = true;
        wrongTap(cell);
        shake(0.9);
        burstAt(c, ['#cbb8e0', '#efe6ff'], { count: 8, speed: 120, gravity: 620, size: 3 });
        setHint('🔍 再看看，不一样的那个藏在哪儿？');
        roundDone(false);
      }
    };

    oddRound();
  }

  function syncLens() {
    const wrap = document.querySelector('#mini-board .odd-wrap');
    if (!wrap) return;
    const grid = wrap.querySelector('.odd-grid');
    const inner = wrap.querySelector('.lens-inner');
    if (!grid || !inner) return;
    inner.style.width = grid.offsetWidth + 'px';
    inner.style.height = grid.offsetHeight + 'px';
    inner.innerHTML = grid.outerHTML;
  }

  function moveLens(px, py) {
    const wrap = document.querySelector('#mini-board .odd-wrap');
    if (!wrap) return;
    const lens = wrap.querySelector('.lens');
    const inner = wrap.querySelector('.lens-inner');
    const grid = wrap.querySelector('.odd-grid');
    if (!lens || !inner || !grid) return;
    const S = 1.9;
    const R = (lens.offsetWidth || 108) / 2;
    const gr = grid.getBoundingClientRect();
    const wr = wrap.getBoundingClientRect();
    // 网格在放大镜里的坐标原点比 wrap 多了内边距，先换算再放大
    const ox = gr.left - wr.left;
    const oy = gr.top - wr.top;
    lens.style.left = px + 'px';
    lens.style.top = py + 'px';
    inner.style.transform = 'translate(' + (R - S * (px - ox)).toFixed(1) + 'px,' +
      (R - S * (py - oy)).toFixed(1) + 'px) scale(' + S + ')';
    lens.classList.add('show');
  }

  function oddRound() {
    run.locked = false;
    const cells = ODD_CELLS[run.tier] || 6;
    const cols = cells === 12 ? 4 : 3;
    const mixed = run.subject === 'mix';
    const base = mixed ? (run.oddSubject = mixPick(run.oddSubject)) : run.subject;
    if (mixed) noteMix(base);
    const cur = DATA.curriculum[base] || {};
    const others = Object.keys(DATA.curriculum)
      .filter(k => k !== base)
      .map(k => DATA.curriculum[k].icon);
    const same = cur.icon || '⭐';
    let diff = pick(others);
    if (!diff || diff === same) diff = '🎈';
    const oddIdx = rnd(0, cells - 1);
    const board = $('#mini-board');
    board.style.setProperty('--cols', String(cols));

    const grid = board.querySelector('.odd-grid');
    if (!grid) return;
    grid.innerHTML = Array.from({ length: cells }, (_, i) =>
      '<button class="odd-cell' + (i === oddIdx ? ' odd' : '') + '" data-odd="' + (i === oddIdx ? '1' : '0') + '" aria-label="图案">' +
      Art.em(i === oddIdx ? diff : same) + '</button>').join('');

    syncLens();
    setHint((mixed ? mixTag(base) : '') + '🔍 移动放大镜，找出不一样的那个图案');
    setProgress();
    // startOdd 直接调用 oddRound，不经过 nextRound，所以首回合教学挂在这里
    if (run.round === 0) coachFirstRound();
  }

  /* ---------- 启动与结算 ---------- */

  function start(type, opts = {}) {
    cleanup();
    if (!GAMES[type]) type = 'mole';
    const subject = (opts.subject === 'mix' || DATA.curriculum[opts.subject]) ? opts.subject : 'numbers';
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
      moves: 0,
      combo: 0,
      bestCombo: 0,
      lucky: false,
      luckyHits: 0,
      luckyCoins: 0,
      daily: !!opts.daily,
      pick: null,
      mixLast: '',
      mixUsed: {},
      tier: 0,
      total: MEMORY_PAIRS,
      optCount: 3,
      done: false,
      stars: 0,
      startAt: Date.now(),
      pausedMs: 0,
      timed: false,
      locked: false,
      relayout: null,
      started: false,
      begin: null
    };
    run.tier = diffTier();
    run.total = ROUNDS[type][run.tier];
    run.optCount = OPTS[type] ? OPTS[type][run.tier] : 0;
    if (!opts.daily) arcadeSubject = subject;

    $('#mini-result').className = 'mini-result';
    $('#mini-result').innerHTML = '';
    $('#mini-progress-fill').style.width = '0%';
    $('#mini-name').textContent = GAMES[type].name + ' · ' + subjectLabel(subject);

    App.show('minigame');
    setScore();

    /* 先演一段故事条，把任务读给孩子听，读完自动开局 */
    const begin = () => {
      if (!run || run.done || run.started) return;
      run.started = true;
      ({
        mole: startMole,
        bubble: startBubble,
        memory: startMemory,
        fish: startFish,
        rocket: startRocket,
        match: startMatch,
        catch: startCatch,
        odd: startOdd
      })[type]();
    };
    run.begin = begin;
    boardSetup('story-board', storyHtml(type), GAMES[type].color, true);
    setHint('🐾 ' + GAMES[type].name + ' · ' + subjectLabel(subject));
    AudioFX.speakCat(GAMES[type].story, { done: begin });
    // 语音读完立即开局；万一语音不可用，也有兜底时间
    later(begin, AudioFX.hasVoice() ? 10000 : 2400);
  }

  function starsFor() {
    const total = run.total;
    if (run.type === 'memory') {
      return run.moves <= total + 3 ? 3 : run.moves <= total + 7 ? 2 : 1;
    }
    if (run.type === 'mole' || run.type === 'rocket') {
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
    clearTicks();
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
      bestCombo: run.bestCombo || 0,
      levelId: run.levelId,
      branchId: run.branchId,
      luckyCoins: run.luckyCoins || 0,
      daily: !!run.daily
    });

    const detail = {
      memory: '翻了 ' + run.moves + ' 次，配成 ' + run.matched + '/' + run.total + ' 对',
      match: '配成 ' + run.matched + '/' + run.total + ' 对，点错 ' + run.wrong + ' 次',
      fish: '钓上 ' + correct + '/' + run.total + ' 条小鱼，失误 ' + run.wrong + ' 次',
      bubble: '戳破 ' + correct + '/' + run.total + ' 个泡泡，失误 ' + run.wrong + ' 次',
      rocket: '火箭冲了 ' + correct + '/' + run.total + ' 格，失误 ' + run.wrong + ' 次',
      catch: '接住 ' + correct + '/' + run.total + ' 个果子，失误 ' + run.wrong + ' 次',
      odd: '找出 ' + correct + '/' + run.total + ' 个不同，失误 ' + run.wrong + ' 次'
    }[run.type] || ('敲对 ' + correct + '/' + run.total + ' 只地鼠');
    const mixed = run.subject === 'mix';
    const done = mixed
      ? '跨 ' + Math.max(1, Object.keys(run.mixUsed || {}).length) + ' 个知识点 · ' + detail
      : detail;

    const backLabel = run.fromArcade ? '换一个游戏' : (run.levelId || run.branchId) ? '回到地图' : '回到乐园';
    const box = $('#mini-result');
    const catLine = stars === 3
      ? '三颗星！你把这一局学得明明白白～'
      : stars > 0
        ? '完成啦！再玩一次，我们一起冲三颗星～'
        : '没关系，我陪你再来一次，慢慢就会啦～';
    box.innerHTML = '<div class="mini-result-card">' +
      '<div class="mini-result-stars">' + [1, 2, 3].map(i =>
        Art.ui(i <= stars ? 'star' : 'star-off')).join('') + '</div>' +
      '<div class="mini-result-cat">' +
        '<div class="mini-result-cat-av">' + catSvg(stars >= 2 ? 92 : stars > 0 ? 60 : 14) + '</div>' +
        '<div class="mini-result-cat-say">' + catLine + '</div>' +
      '</div>' +
      '<h3>' + (stars === 3 ? '完美！' : stars > 0 ? '玩得真棒！' : '再来一次吧～') + '</h3>' +
      '<p>' + done + '</p>' +
      '<div class="mini-result-rewards">' +
        '<span>🌰 +' + res.coins + '</span><span>💗 +' + res.exp + '</span>' +
        (res.level && res.level.newClear ? '<span>🗺️ 首次通关 +20</span>' : '') +
        (res.branchCoins ? '<span>🎁 支线奖励 +' + res.branchCoins + '</span>' : '') +
        (res.leveledUp ? '<span>🎉 升级啦</span>' : '') +
        (res.stickerNew ? '<span>🎁 新贴纸 ' + Art.em(GAMES[run.type].sticker) + '</span>' : '') +
        (res.bestNew && res.best > 1 ? '<span>🔥 新纪录 连对 ×' + res.best + '</span>' : '') +
        (res.day >= 3 ? '<span>⚡ 今日最佳 连对 ×' + res.day + '</span>' : '') +
        (res.luckyCoins ? '<span>✨ 幸运奖励 +' + res.luckyCoins + '</span>' : '') +
        (res.dailyBonus ? '<span>📅 今日挑战 +' + res.dailyBonus + '</span>' : '') +
      '</div>' +
      '<div class="mini-result-actions">' +
        '<button class="btn btn-green" id="mini-again">再玩一次</button>' +
        '<button class="btn btn-yellow" id="mini-back">' + backLabel + '</button>' +
      '</div>' +
    '</div>';
    box.classList.add('show');
    AudioFX.levelUp();
    AudioFX.speakCat(catLine);
  }

  /* ---------- 小游戏乐园 ---------- */

  /* 今日挑战：日期决定玩法和知识，同一天所有人拿到同一关 */
  function hashDay(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  function todayKey() {
    const d = new Date();
    return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
  }

  function dailyPick() {
    const date = todayKey();
    const seed = hashDay(date + '|xiaolongmao');
    const games = Object.keys(GAMES);
    const subs = Object.keys(DATA.curriculum);
    return {
      date,
      type: games[seed % games.length],
      subject: subs[Math.floor(seed / 31) % subs.length]
    };
  }

  function renderDaily(stats) {
    const box = $('#arcade-daily');
    if (!box) return;
    const p = dailyPick();
    const g = GAMES[p.type];
    const dr = isObj(stats.dailyRun) ? stats.dailyRun : {};
    const done = dr.date === p.date;
    const stars = done ? Math.round(Number(dr.stars) || 0) : 0;
    const best = done ? Math.round(Number(dr.best) || 0) : 0;
    const stateHtml = done
      ? '<span class="daily-stars">' + [1, 2, 3].map(i => Art.ui(i <= stars ? 'star' : 'star-off')).join('') + '</span>' +
        '<small>' + (best > 1 ? '连对 ×' + best + ' · 还能刷新' : '今天已完成') + '</small>'
      : '<b class="daily-go">开始 →</b><small>完成 +15 🌰</small>';
    box.innerHTML = '<button class="daily-card' + (done ? ' done' : '') + '" data-daily style="--c:' + g.color + '">' +
      '<span class="daily-top"><i>📅 今日挑战</i><i>' + (done ? '已完成' : '新的一关') + '</i></span>' +
      '<span class="daily-row">' +
        '<span class="daily-icon">' + Art.em(g.icon) + '</span>' +
        '<span class="daily-main"><b>' + g.name + '</b><small>' + (subjectName(p.subject) || '数字乐园') + ' · ' + g.desc + '</small></span>' +
        '<span class="daily-state">' + stateHtml + '</span>' +
      '</span>' +
    '</button>';
  }

  function renderArcade() {
    const subs = $('#arcade-subjects');
    const grid = $('#arcade-grid');
    const tip = $('#arcade-tip');
    if (!subs || !grid) return;

    subs.innerHTML =
      '<button class="arcade-subject is-mix ' + (arcadeSubject === 'mix' ? 'active' : '') + '" data-arcade-subject="mix">' +
        '<span>🎲</span>混合挑战</button>' +
      Object.keys(DATA.curriculum).map(k => {
        const c = DATA.curriculum[k];
        return '<button class="arcade-subject ' + (k === arcadeSubject ? 'active' : '') + '" data-arcade-subject="' + k + '" style="--c:' + c.color + '">' +
          '<span>' + Art.em(c.icon) + '</span>' + c.name + '</button>';
      }).join('');

    const st = (typeof App !== 'undefined' && App.state) ? App.state : null;
    const stats = (st && st.stats) ? st.stats : {};
    const stickers = Array.isArray(stats.stickers) ? stats.stickers : [];
    const bests = isObj(stats.miniBest) ? stats.miniBest : {};
    const today = (() => {
      const d = new Date();
      return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
    })();

    grid.innerHTML = Object.keys(GAMES).map(k => {
      const g = GAMES[k];
      const b = isObj(bests[k]) ? bests[k] : {};
      const best = Math.round(Number(b.best) || 0);
      const day = b.date === today ? Math.round(Number(b.day) || 0) : 0;
      const bestLine = best
        ? '<span class="arcade-best">🔥 最好连对 ×' + best + (day ? ' · 今日 ×' + day : '') + '</span>'
        : '<span class="arcade-best none">还没玩过，试试看 →</span>';
      return '<button class="arcade-card" data-arcade-game="' + k + '" style="--c:' + g.color + '">' +
        '<span class="arcade-badge">' + Art.em(g.icon) + '</span>' +
        '<b>' + g.name + '</b>' +
        '<small>' + g.desc + '</small>' +
        '<span class="arcade-tag">' + g.tag + '</span>' +
        bestLine +
        '<span class="arcade-go">开始 →</span>' +
      '</button>';
    }).join('');

    renderDaily(stats);
    renderStickerWall(stickers);

    if (tip) {
      if (arcadeSubject === 'mix') {
        tip.textContent = '共 ' + Object.keys(GAMES).length + ' 款玩法 · 混合挑战：每道题都会换一门知识（' +
          MIX_SUBJECTS.length + ' 个学科轮着来），练的是随时切换';
      } else {
        const c = DATA.curriculum[arcadeSubject];
        tip.textContent = '共 ' + Object.keys(GAMES).length + ' 款玩法 · 现在装进游戏的知识：' + (c ? c.name + ' · ' + c.tag : '数字乐园');
      }
    }
  }

  /* 贴纸墙：当前知识下，每玩完一局点亮一枚 */
  function renderStickerWall(stickers) {
    const wall = $('#sticker-wall');
    if (!wall) return;
    const keys = Object.keys(GAMES);
    const got = keys.map(k => stickers.indexOf(k + '_' + arcadeSubject) > -1);
    const n = got.filter(Boolean).length;
    wall.innerHTML = '<div class="sticker-head">' +
        '<b>🏅 我的贴纸墙</b>' +
        '<span class="sticker-count">' + n + '/' + keys.length + '</span>' +
        '<small>' + subjectLabel(arcadeSubject) + ' · 每玩完一局得 1 枚</small>' +
      '</div>' +
      '<div class="sticker-row">' + keys.map((k, i) =>
        '<span class="sticker ' + (got[i] ? 'on' : 'off') + '" title="' + GAMES[k].name + '">' +
          Art.em(GAMES[k].sticker) +
          '<i>' + GAMES[k].name + '</i>' +
        '</span>').join('') + '</div>';
  }

  function open() {
    cleanup();
    if (arcadeSubject !== 'mix' && !DATA.curriculum[arcadeSubject]) arcadeSubject = 'mix';
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

    window.addEventListener('resize', () => {
      if (run && run.relayout) run.relayout();
    });

    document.addEventListener('click', e => {
      if (e.target.closest('.mini-story')) {
        if (run && run.begin) run.begin();
        return;
      }

      const sub = e.target.closest('[data-arcade-subject]');
      if (sub) {
        arcadeSubject = sub.dataset.arcadeSubject;
        AudioFX.click();
        renderArcade();
        return;
      }

      const daily = e.target.closest('[data-daily]');
      if (daily) {
        AudioFX.click();
        const p = dailyPick();
        start(p.type, { subject: p.subject, fromArcade: true, daily: true });
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
        const { type, subject, levelId, branchId, fromArcade, daily } = run;
        start(type, { subject, levelId, branchId, fromArcade, daily });
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
    clearCoach();
    clearWaits();
    clearTicks();
    FX.detach();
    paused = false;
    pausedWaits = [];
    AudioFX.stopSpeak();
    run = null;
    const board = $('#mini-board');
    if (board) {
      board.onclick = null;
      board.onpointermove = null;
      board.onpointerdown = null;
      board.onpointerup = null;
      board.onpointerleave = null;
      board.classList.remove('paused');
      board.style.setProperty('--sk-x', '0px');
      board.style.setProperty('--sk-y', '0px');
    }
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
    games: () => Object.keys(GAMES).map(k => ({
      id: k,
      name: GAMES[k].name,
      icon: GAMES[k].icon,
      tag: GAMES[k].tag,
      desc: GAMES[k].desc
    })),
    info: () => (run ? { type: run.type, subject: run.subject, levelId: run.levelId } : null)
  };
})();
