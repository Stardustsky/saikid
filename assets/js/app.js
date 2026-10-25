/* 应用主逻辑：存档、界面切换、闯关地图、每日任务、养成、商店、家园、勋章、家长中心 */
const App = (() => {
  /* 勋章：每枚都有目标值与当前值，界面据此画进度条，避免孩子不知道还差多少 */
  const subCorrect = (s, k) => ((s.stats.bySubject[k] || {}).correct || 0);
  const BADGES = [
    // 学习类
    { id: 'first', icon: '🎉', name: '初次见面', desc: '完成第一局练习', goal: 1, cur: s => s.stats.games },
    { id: 'perfect', icon: '🌟', name: '满星达人', desc: '一局全部答对', goal: 1, cur: s => s.stats.perfectGames },
    { id: 'combo', icon: '⚡', name: '连对高手', desc: '一局连续答对 5 题', goal: 5, cur: s => s.stats.bestCombo },
    { id: 'numbers', icon: '🔢', name: '数数高手', desc: '答对 20 道数字题', goal: 20, cur: s => subCorrect(s, 'numbers') },
    { id: 'letters', icon: '🔤', name: '字母侦探', desc: '答对 20 道字母题', goal: 20, cur: s => subCorrect(s, 'letters') },
    { id: 'words', icon: '🐻', name: '单词小达人', desc: '答对 20 道单词题', goal: 20, cur: s => subCorrect(s, 'words') },
    { id: 'math', icon: '➕', name: '算术小能手', desc: '答对 20 道算术题', goal: 20, cur: s => subCorrect(s, 'math') },
    { id: 'pinyin', icon: '🎵', name: '拼音小百灵', desc: '答对 15 道拼音题', goal: 15, cur: s => subCorrect(s, 'pinyin') },
    { id: 'hanzi', icon: '📖', name: '识字大王', desc: '答对 20 道汉字题', goal: 20, cur: s => subCorrect(s, 'hanzi') },
    { id: 'all', icon: '🌈', name: '全能小达人', desc: '体验全部 6 个科目', goal: 6, cur: s => Object.keys(s.stats.played || {}).length },
    // 探索类
    { id: 'stage10', icon: '🎯', name: '闯关先锋', desc: '完成 10 个学习阶段', goal: 10, cur: s => Object.keys(s.stages || {}).filter(k => (s.stages[k] || {}).stars > 0).length },
    { id: 'star30', icon: '✨', name: '星星收藏家', desc: '累计收集 30 颗星', goal: 30, cur: s => {
        const mapStars = Object.values(s.map.stars || {}).reduce((n, v) => n + (Number(v) || 0), 0);
        const stageStars = Object.values(s.stages || {}).reduce((n, v) => n + (Number(v.stars) || 0), 0);
        return mapStars + stageStars;
      } },
    { id: 'atlas4', icon: '📚', name: '知识探索者', desc: '查看 4 类知识总表', goal: 4, cur: s => Object.keys(s.stats.atlas || {}).length },
    { id: 'explorer', icon: '🧭', name: '森林探险家', desc: '完成 3 条地图支线', goal: 3, cur: s => Object.keys(s.map.branchDone || {}).length },
    // 小游戏
    { id: 'mini5', icon: '🎮', name: '游戏小能手', desc: '玩 5 局小游戏', goal: 5, cur: s => s.stats.miniGames },
    { id: 'mole', icon: '🔨', name: '地鼠克星', desc: '打地鼠敲对 30 只', goal: 30, cur: s => (s.stats.molesHit || 0) },
    // 养成类
    { id: 'care', icon: '💗', name: '爱心饲养员', desc: '照顾小龙猫 10 次', goal: 10, cur: s => s.stats.careCount },
    { id: 'pet5', icon: '🐾', name: '龙猫伙伴', desc: '小龙猫成长到 5 级', goal: 5, cur: s => s.pet.level },
    { id: 'decor4', icon: '🏡', name: '布置小能手', desc: '拥有 4 件小屋装饰', goal: 4, cur: s => (s.owned || []).filter(id => DATA.shop.decor.some(d => d.id === id)).length },
    { id: 'rich', icon: '🌰', name: '橡果富翁', desc: '累计获得 200 颗橡果', goal: 200, cur: s => s.stats.earned },
    { id: 'streak', icon: '📅', name: '坚持之星', desc: '连续 3 天来学习', goal: 3, cur: s => s.stats.streak }
  ];
  BADGES.forEach(b => { b.check = s => b.cur(s) >= b.goal; });

  const DECOR_SLOTS = [
    { x: 12, y: 56, s: 46 }, { x: 82, y: 58, s: 42 }, { x: 20, y: 28, s: 36 },
    { x: 70, y: 24, s: 34 }, { x: 45, y: 18, s: 38 }, { x: 8, y: 76, s: 32 },
    { x: 88, y: 76, s: 34 }, { x: 58, y: 64, s: 30 }, { x: 30, y: 80, s: 30 },
    { x: 74, y: 78, s: 28 }, { x: 48, y: 34, s: 28 }, { x: 92, y: 38, s: 28 }
  ];

  /* 闯关地图：主线里既有关卡问答，也有小游戏；支线给额外的宝箱、故事和小游戏 */
  const LEVELS = [
    { id: 1, subject: 'numbers', stage: 'num-1', name: '数字草地', node: '🌳', need: 4, kind: 'quiz' },
    { id: 2, subject: 'letters', stage: 'let-a', name: '字母小镇', node: '🏘️', need: 4, kind: 'quiz' },
    { id: 3, subject: 'words', stage: 'word-animal', name: '单词花园', node: '🌷', need: 4, kind: 'quiz' },
    { id: 4, subject: 'math', stage: 'math-add5', name: '算术作坊', node: '⚙️', need: 5, kind: 'quiz' },
    { id: 5, subject: 'pinyin', stage: 'py-initial1', name: '拼音小路', node: '🎵', need: 5, kind: 'quiz' },
    { id: 6, subject: 'hanzi', stage: 'hz-num', name: '汉字森林', node: '🌲', need: 5, kind: 'quiz' },
    { id: 13, subject: 'numbers', name: '打地鼠草地', node: '🔨', need: 6, kind: 'mini', mini: 'mole', desc: '60 秒内敲对 6 只地鼠' },
    { id: 7, subject: 'numbers', stage: 'num-4', name: '数字山谷', node: '⛰️', need: 5, kind: 'quiz' },
    { id: 8, subject: 'letters', stage: 'let-f', name: '字母城堡', node: '🏰', need: 5, kind: 'quiz' },
    { id: 9, subject: 'words', stage: 'word-food', name: '单词海湾', node: '🌊', need: 6, kind: 'quiz' },
    { id: 10, subject: 'math', stage: 'math-add10', name: '算术工厂', node: '🏭', need: 6, kind: 'quiz' },
    { id: 14, subject: 'letters', name: '翻翻乐小屋', node: '🃏', need: 4, kind: 'mini', mini: 'memory', desc: '翻开卡片，配成 6 对' },
    { id: 11, subject: 'pinyin', stage: 'py-tone', name: '拼音竹林', node: '🎋', need: 6, kind: 'quiz' },
    { id: 12, subject: 'hanzi', stage: 'hz-listen', name: '汉字王国', node: '👑', need: 7, kind: 'quiz' }
  ];

  /* 支线：不挡主线，通关对应关卡后解锁 */
  const BRANCHES = [
    {
      id: 'b-treasure1', parent: 2, side: 'left', type: 'treasure', name: '树洞宝箱', icon: '🎁',
      reward: 15, color: '#e8a33d'
    },
    {
      id: 'b-story1', parent: 3, side: 'right', type: 'story', name: '龙猫故事', icon: '📖',
      reward: 8, color: '#4fb6ff', title: '小龙猫的星星口袋',
      lines: [
        '小龙猫在单词花园里捡到一颗会发光的星星。',
        '它把星星装进口袋，夜里就给森林里的小动物照路。',
        '原来学会一个新单词，口袋里的星星就会亮一颗。'
      ]
    },
    {
      id: 'b-bubble1', parent: 4, side: 'left', type: 'mini', mini: 'bubble', subject: 'letters',
      name: '字母泡泡', icon: '🫧', reward: 12, color: '#4fb6ff'
    },
    {
      id: 'b-mole1', parent: 5, side: 'left', type: 'mini', mini: 'bubble', subject: 'pinyin',
      name: '拼音泡泡', icon: '🫧', reward: 12, color: '#ff8fc0'
    },
    {
      id: 'b-story2', parent: 8, side: 'right', type: 'story', name: '月亮湖', icon: '🌙',
      reward: 10, color: '#8b6cff', title: '月亮湖的倒影',
      lines: [
        '森林深处有一片月亮湖，湖面像一面大镜子。',
        '小龙猫把学过的字母排成队，倒影里也排成了一模一样的队伍。',
        '它笑着说：原来知识学会了，就会一直跟着你。'
      ]
    },
    {
      id: 'b-memory1', parent: 10, side: 'left', type: 'mini', mini: 'memory', subject: 'hanzi',
      name: '汉字翻翻乐', icon: '🃏', reward: 12, color: '#5f9e6e'
    },
    {
      id: 'b-fish1', parent: 12, side: 'left', type: 'mini', mini: 'fish', subject: 'words',
      name: '单词钓鱼', icon: '🐟', reward: 15, color: '#3ecf8e'
    },
    {
      id: 'b-treasure2', parent: 12, side: 'right', type: 'treasure', name: '山顶宝箱', icon: '💎',
      reward: 25, color: '#e8a33d'
    }
  ];

  /* 每日任务：每天清零，可领取橡果币 */
  const TASKS = [
    { id: 'correct10', type: 'correct', icon: '✅', name: '答对 10 道题', target: 10, reward: 15 },
    { id: 'games2', type: 'games', icon: '🎮', name: '完成 2 局练习', target: 2, reward: 15 },
    { id: 'care1', type: 'care', icon: '💗', name: '照顾小龙猫 1 次', target: 1, reward: 10 },
    { id: 'review1', type: 'review', icon: '📕', name: '复习 1 道错题', target: 1, reward: 12 },
    { id: 'stars3', type: 'stars', icon: '⭐', name: '收集 3 颗新星星', target: 3, reward: 20 },
    { id: 'practice1', type: 'practice', icon: '✍️', name: '完成 1 次跟读或描红', target: 1, reward: 12 }
  ];

  const DAILY_ZERO = () => ({ correct: 0, games: 0, care: 0, review: 0, practice: 0, stars: 0 });

  /* 零基础入门引导：每个学科第一次进入时展示一次 */
  const GUIDES = {
    numbers: {
      icon: '🔢', name: '数字乐园',
      lines: [
        '先伸出小手指，指着图上的东西一个一个数。',
        '数到最后一个，就是一共有几个。',
        '数字排队时，后面的数字总比前面大 1 哦。'
      ]
    },
    letters: {
      icon: '🔤', name: '字母王国',
      lines: [
        '每个字母都有大写和小写，比如 A 和 a。',
        '字母有自己的发音，点小喇叭可以多听几遍。',
        '唱字母歌能帮你记住顺序：A B C D E F G…'
      ]
    },
    words: {
      icon: '🐻', name: '单词花园',
      lines: [
        '先看看图片是什么，再猜猜它在英语里叫什么。',
        '点小喇叭听一听，然后跟着大声读出来。',
        '读错了也没关系，多听几次就会啦。'
      ]
    },
    math: {
      icon: '➕', name: '算术工坊',
      lines: [
        '加法就是把两堆东西合在一起，数一数一共多少。',
        '减法就是从一堆里拿走一些，看看还剩多少。',
        '数不清的时候，可以用手指或者圆点帮忙。'
      ]
    },
    pinyin: {
      icon: '🎵', name: '拼音小路',
      lines: [
        '拼音就像汉字的名字，读准声调很重要。',
        '先听小喇叭，再跟着慢慢读一遍。',
        '看到汉字想拼音，看到拼音找汉字。'
      ]
    },
    hanzi: {
      icon: '📖', name: '汉字森林',
      lines: [
        '汉字像一幅小图画，看看它像什么东西。',
        '先听读音，再看图猜一猜意思。',
        '每天认识 3 个字，慢慢就能认识很多啦。'
      ]
    }
  };

  // 引导文案统一以课程体系为准，避免首页、引导、家长中心三处不一致
  Object.keys(DATA.curriculum).forEach(k => {
    const c = DATA.curriculum[k];
    GUIDES[k] = { icon: c.icon, name: c.name, lines: c.intro || [] };
  });

  let state = null;
  let currentSubject = 'numbers';
  let shopTab = 'food';
  let toastTimer = null;
  let patAt = 0;
  let resetArmed = false;
  let resetTimer = null;
  let guideCallback = null;

  const $ = sel => document.querySelector(sel);
  const $$ = sel => [...document.querySelectorAll(sel)];

  const isObj = v => !!v && typeof v === 'object' && !Array.isArray(v);
  const num = (v, def, min, max) => {
    const n = Number(v);
    if (!isFinite(n)) return def;
    return Math.min(max, Math.max(min, n));
  };

  function dateKey(offset = 0) {
    const d = new Date(Date.now() + offset * 86400000);
    return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
  }

  function defaultState() {
    return {
      version: SaveStore.VERSION,
      updatedAt: 0,
      coins: 20,
      pet: { level: 1, exp: 0, hunger: 80, mood: 80, clean: 80, lastCare: Date.now() },
      settings: {
        sound: true, voice: true, online: true,
        theme: 'light', font: 'normal', motion: 'auto'
      },
      parent: { pin: '', goal: 10 },
      stats: {
        games: 0, correct: 0, total: 0, bestCombo: 0, perfectGames: 0,
        careCount: 0, streak: 0, lastPlayDate: '', played: {}, bySubject: {}, earned: 0,
        miniGames: 0, miniCorrect: 0, miniTotal: 0, molesHit: 0, atlas: {}, seconds: 0
      },
      history: {},
      wrongBook: [],
      answers: [],
      map: { unlocked: 1, clears: 0, stars: {}, branchDone: {} },
      stages: {},
      daily: { date: '', progress: DAILY_ZERO(), claimed: [] },
      flags: { intro: false, guides: [] },
      owned: ['meadow'],
      bg: 'meadow',
      decor: [],
      decorPos: {},
      badges: []
    };
  }

  /* ---------- 状态模型：任何来源的数据都要经过这里校验 ---------- */

  function normalizeState(raw) {
    const s = defaultState();
    if (!isObj(raw)) return s;
    const src = raw;

    s.coins = Math.round(num(src.coins, s.coins, 0, 999999));

    const p = isObj(src.pet) ? src.pet : {};
    s.pet.level = Math.round(num(p.level, 1, 1, 20));
    s.pet.exp = Math.round(num(p.exp, 0, 0, 999999));
    s.pet.hunger = Math.round(num(p.hunger, 80, 0, 100));
    s.pet.mood = Math.round(num(p.mood, 80, 0, 100));
    s.pet.clean = Math.round(num(p.clean, 80, 0, 100));
    s.pet.lastCare = num(p.lastCare, Date.now(), 0, Date.now() + 86400000);

    const st = isObj(src.settings) ? src.settings : {};
    s.settings.sound = st.sound !== false;
    s.settings.voice = st.voice !== false;
    s.settings.online = st.online !== false;
    s.settings.theme = st.theme === 'dark' ? 'dark' : 'light';
    s.settings.font = st.font === 'large' ? 'large' : 'normal';
    s.settings.motion = st.motion === 'reduce' ? 'reduce' : 'auto';

    const pn = isObj(src.parent) ? src.parent : {};
    s.parent.pin = /^\d{4}$/.test(String(pn.pin || '')) ? String(pn.pin) : '';
    s.parent.goal = Math.round(num(pn.goal, 10, 5, 50));

    const stats = isObj(src.stats) ? src.stats : {};
    ['games', 'correct', 'total', 'bestCombo', 'perfectGames', 'careCount', 'streak', 'earned',
      'miniGames', 'miniCorrect', 'miniTotal', 'molesHit', 'seconds']
      .forEach(k => { s.stats[k] = Math.round(num(stats[k], 0, 0, 1e9)); });
    s.stats.lastPlayDate = typeof stats.lastPlayDate === 'string' ? stats.lastPlayDate : '';
    s.stats.played = isObj(stats.played) ? stats.played : {};
    s.stats.bySubject = isObj(stats.bySubject) ? stats.bySubject : {};
    if (isObj(stats.atlas)) {
      Object.keys(stats.atlas).forEach(k => {
        if (DATA.curriculum[k]) s.stats.atlas[k] = Math.round(num(stats.atlas[k], 1, 1, 1e6));
      });
    }

    // 每日历史：只保留最近 60 天，家长中心趋势与周报都读这里
    if (isObj(src.history)) {
      Object.keys(src.history).sort().slice(-60).forEach(k => {
        if (!/^\d{4}-\d{1,2}-\d{1,2}$/.test(k)) return;
        const h = isObj(src.history[k]) ? src.history[k] : {};
        s.history[k] = {
          correct: Math.round(num(h.correct, 0, 0, 1e6)),
          total: Math.round(num(h.total, 0, 0, 1e6)),
          games: Math.round(num(h.games, 0, 0, 1e5)),
          mini: Math.round(num(h.mini, 0, 0, 1e5)),
          care: Math.round(num(h.care, 0, 0, 1e5)),
          practice: Math.round(num(h.practice, 0, 0, 1e5)),
          review: Math.round(num(h.review, 0, 0, 1e5)),
          stars: Math.round(num(h.stars, 0, 0, 1e5)),
          seconds: Math.round(num(h.seconds, 0, 0, 1e6))
        };
      });
    }

    // 错题本：保存题面快照，最多 60 道，超出时丢弃最久未复习的
    if (Array.isArray(src.wrongBook)) {
      s.wrongBook = src.wrongBook.filter(isObj).slice(-60).map(w => {
        const subject = DATA.curriculum[w.subject] ? w.subject : 'numbers';
        const options = Array.isArray(w.options) ? w.options.filter(isObj).slice(0, 6).map(o => ({
          label: String(o.label == null ? '' : o.label),
          html: String(o.html == null ? '' : o.html)
        })) : [];
        return {
          id: String(w.id || ('w' + Math.random().toString(36).slice(2, 10))),
          key: String(w.key || ''),
          subject,
          type: String(w.type || 'choice'),
          title: String(w.title == null ? '' : w.title),
          visual: String(w.visual == null ? '' : w.visual),
          answer: String(w.answer == null ? '' : w.answer),
          speak: isObj(w.speak) ? { text: String(w.speak.text || ''), lang: String(w.speak.lang || 'zh-CN'), audio: String(w.speak.audio || '') } : null,
          hint: String(w.hint == null ? '' : w.hint),
          options,
          chosen: String(w.chosen == null ? '' : w.chosen),
          times: Math.round(num(w.times, 1, 1, 999)),
          right: Math.round(num(w.right, 0, 0, 999)),
          dueAt: num(w.dueAt, Date.now(), 0, Date.now() + 365 * 86400000),
          at: num(w.at, Date.now(), 0, Date.now() + 86400000)
        };
      });
    }

    // 最近作答流水：只用于诊断与家长复盘，最多 200 条
    if (Array.isArray(src.answers)) {
      s.answers = src.answers.filter(isObj).slice(-200).map(a => ({
        subject: String(a.subject || ''),
        type: String(a.type || ''),
        answer: String(a.answer == null ? '' : a.answer),
        chosen: String(a.chosen == null ? '' : a.chosen),
        ok: a.ok === true,
        at: num(a.at, Date.now(), 0, Date.now() + 86400000)
      }));
    }

    const map = isObj(src.map) ? src.map : {};
    const maxLevelId = LEVELS.reduce((n, l) => Math.max(n, Number(l.id) || 0), 1);
    s.map.unlocked = Math.round(num(map.unlocked, 1, 1, maxLevelId));
    s.map.clears = Math.round(num(map.clears, 0, 0, 1e6));
    if (isObj(map.stars)) {
      Object.keys(map.stars).forEach(k => {
        if (!LEVELS.some(l => String(l.id) === String(k))) return;
        s.map.stars[k] = Math.round(num(map.stars[k], 0, 0, 3));
      });
    }
    if (isObj(map.branchDone)) {
      Object.keys(map.branchDone).forEach(k => {
        if (BRANCHES.some(b => b.id === k)) s.map.branchDone[k] = true;
      });
    }

    // 阶段进度：每阶段记录最佳星数与练习次数
    if (isObj(src.stages)) {
      Object.keys(src.stages).forEach(k => {
        if (!findStageById(k)) return;
        const v = isObj(src.stages[k]) ? src.stages[k] : {};
        s.stages[k] = {
          stars: Math.round(num(v.stars, 0, 0, 3)),
          plays: Math.round(num(v.plays, 0, 0, 1e6)),
          best: Math.round(num(v.best, 0, 0, 1e6))
        };
      });
    }

    const daily = isObj(src.daily) ? src.daily : {};
    s.daily.date = typeof daily.date === 'string' ? daily.date : '';
    const dp = isObj(daily.progress) ? daily.progress : {};
    s.daily.progress = DAILY_ZERO();
    Object.keys(s.daily.progress).forEach(k => {
      s.daily.progress[k] = Math.round(num(dp[k], 0, 0, 9999));
    });
    s.daily.claimed = Array.isArray(daily.claimed)
      ? daily.claimed.filter(x => TASKS.some(t => t.id === x))
      : [];
    if (s.daily.date !== dateKey(0)) {
      s.daily.date = dateKey(0);
      s.daily.progress = DAILY_ZERO();
      s.daily.claimed = [];
    }

    const flags = isObj(src.flags) ? src.flags : {};
    s.flags.intro = flags.intro === true;
    s.flags.guides = Array.isArray(flags.guides) ? flags.guides.filter(k => GUIDES[k]) : [];

    const owned = Array.isArray(src.owned) ? src.owned.filter(x => typeof x === 'string') : [];
    s.owned = ['meadow'].concat(owned.filter(x => x !== 'meadow'));

    const bgIds = DATA.shop.bg.map(x => x.id);
    s.bg = bgIds.indexOf(src.bg) > -1 && s.owned.indexOf(src.bg) > -1 ? src.bg : 'meadow';

    const decorIds = DATA.shop.decor.map(x => x.id);
    s.decor = (Array.isArray(src.decor) ? src.decor : [])
      .filter(x => decorIds.indexOf(x) > -1 && s.owned.indexOf(x) > -1)
      .slice(0, DECOR_SLOTS.length);

    if (isObj(src.decorPos)) {
      Object.keys(src.decorPos).forEach(k => {
        if (decorIds.indexOf(k) === -1) return;
        const v = isObj(src.decorPos[k]) ? src.decorPos[k] : {};
        if (!isFinite(Number(v.x)) || !isFinite(Number(v.y))) return;
        s.decorPos[k] = {
          x: Math.round(num(v.x, 50, 5, 95)),
          y: Math.round(num(v.y, 50, 8, 90))
        };
      });
    }

    const badgeIds = BADGES.map(b => b.id);
    s.badges = (Array.isArray(src.badges) ? src.badges : []).filter(x => badgeIds.indexOf(x) > -1);

    s.version = SaveStore.VERSION;
    return s;
  }

  function save() {
    if (!state) return;
    state.updatedAt = Date.now();
    SaveStore.save(state);
  }

  /* ---------- 通用 ---------- */

  function toast(msg, ms = 2000) {
    const el = $('#toast');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), ms);
  }

  function markDay() {
    const today = dateKey(0);
    if (state.stats.lastPlayDate === today) return;
    state.stats.streak = state.stats.lastPlayDate === dateKey(-1) ? state.stats.streak + 1 : 1;
    state.stats.lastPlayDate = today;
    save();
  }

  function addExp(n) {
    const p = state.pet;
    p.exp += n;
    let ups = 0;
    while (p.exp >= Pet.needExp(p.level) && p.level < 20) {
      p.exp -= Pet.needExp(p.level);
      p.level++;
      ups++;
      state.coins += 15;
    }
    return ups;
  }

  function checkBadges() {
    const fresh = [];
    BADGES.forEach(b => {
      if (state.badges.indexOf(b.id) === -1 && b.check(state)) {
        state.badges.push(b.id);
        fresh.push(b);
      }
    });
    if (fresh.length) {
      save();
      const b = fresh[fresh.length - 1];
      setTimeout(() => toast('🏅 获得勋章：' + b.name + '！', 2600), 600);
      AudioFX.levelUp();
    }
    return fresh;
  }

  /* ---------- 界面切换 ---------- */

  function show(name) {
    $$('.screen').forEach(s => s.classList.toggle('active', s.id === 'screen-' + name));
    if (name !== 'game') AudioFX.stopSpeak();
    if (name === 'home') { ensureDaily(); refreshHome(); }
    if (name === 'stages') renderStages();
    if (name === 'room') refreshRoom();
    if (name === 'badges') refreshBadges();
    if (name === 'map') renderMap();
    window.scrollTo(0, 0);
    const main = $('#main-stage');
    if (main && typeof main.focus === 'function') {
      try { main.focus({ preventScroll: true }); } catch (e) { main.focus(); }
    }
  }

  function refreshHud() {
    $('#hud-coins').textContent = state.coins;
    $('#hud-level').textContent = state.pet.level;
    $('#btn-toggle-sound').textContent = state.settings.sound ? '🔊' : '🔇';
  }

  function refreshHome() {
    const p = state.pet;
    $('#home-pet').innerHTML = Pet.svg(p.level, p.mood);
    $('#pet-name').textContent = Pet.title(p.level) + ' · Lv.' + p.level;
    ['hunger', 'mood', 'clean'].forEach(k => {
      const bar = $('#bar-' + k);
      if (bar) bar.style.width = p[k] + '%';
      const num = $('#num-' + k);
      if (num) num.textContent = p[k];
    });
    const word = $('#care-word');
    if (word) word.textContent = Pet.moodWord(p);
    $('#pet-speech').textContent = Pet.speakLine(p);
    renderTasks();
    refreshMapBanner();
    refreshReviewBadge();
    refreshHud();
  }

  function petReact(cls) {
    const el = document.querySelector('#home-pet .pet-wrap');
    if (!el) return;
    el.classList.add(cls);
    setTimeout(() => el.classList.remove(cls), 900);
  }

  /* ---------- 每日任务 ---------- */

  function ensureDaily() {
    const today = dateKey(0);
    if (state.daily.date === today) return false;
    state.daily.date = today;
    state.daily.progress = DAILY_ZERO();
    state.daily.claimed = [];
    return true;
  }

  /* 当天聚合：家长中心趋势、周报、重复刷币衰减都依赖它 */
  function historyToday() {
    const k = dateKey(0);
    if (!isObj(state.history[k])) {
      state.history[k] = {
        correct: 0, total: 0, games: 0, mini: 0, care: 0,
        practice: 0, review: 0, stars: 0, seconds: 0
      };
    }
    return state.history[k];
  }

  function trimHistory() {
    const keys = Object.keys(state.history).sort();
    while (keys.length > 60) {
      delete state.history[keys.shift()];
    }
  }

  /* ---------- 经济系统 ----------
     橡果币 = 基础分 × 正确率 × 当日重复衰减 × 宠物状态。
     答得越准赚得越多，反复刷同一局收益递减，避免把学习变成刷币。 */

  function accuracyFactor(correct, total) {
    if (!total) return 0.5;
    return 0.5 + (correct / total) * 0.5;
  }

  /* 每天前 2 局全额，3–4 局 0.7，5–6 局 0.5，之后再刷只有 0.35 */
  function repeatFactor() {
    const h = historyToday();
    const n = h.games + h.mini;
    if (n < 2) return 1;
    if (n < 4) return 0.7;
    if (n < 6) return 0.5;
    return 0.35;
  }

  function petBonus() {
    const p = state.pet;
    const avg = (p.hunger + p.mood + p.clean) / 3;
    return avg >= 75 ? 1.2 : avg >= 45 ? 1 : 0.9;
  }

  /* 学习也会消耗：每满 4 分钟饱食 -1；正确率 ≥80% 让它心情变好 */
  function petAfterStudy(correct, total, seconds) {
    const p = state.pet;
    const mins = Math.round((Number(seconds) || 0) / 60);
    if (mins >= 4) p.hunger = Pet.clamp(p.hunger - Math.floor(mins / 4));
    if (total && correct / total >= 0.8) p.mood = Pet.clamp(p.mood + 4);
  }

  function estSeconds(seconds, total) {
    const v = Number(seconds);
    if (isFinite(v) && v > 0) return Math.min(3600, Math.round(v));
    return Math.max(30, Math.round((Number(total) || 0) * 12));
  }

  function totalStars() {
    const mapStars = Object.values(state.map.stars || {}).reduce((n, v) => n + (Number(v) || 0), 0);
    const stageStars = Object.values(state.stages || {}).reduce((n, v) => n + (Number(v.stars) || 0), 0);
    return mapStars + stageStars;
  }

  function pushAnswer(subject, type, answer, chosen, ok) {
    state.answers.push({
      subject: String(subject || ''),
      type: String(type || ''),
      answer: String(answer == null ? '' : answer),
      chosen: String(chosen == null ? '' : chosen),
      ok: ok === true,
      at: Date.now()
    });
    if (state.answers.length > 200) state.answers.splice(0, state.answers.length - 200);
  }

  function bumpDaily(type, n = 1) {
    ensureDaily();
    if (typeof state.daily.progress[type] !== 'number') return;
    state.daily.progress[type] += n;
    if ($('#screen-home').classList.contains('active')) renderTasks();
  }

  function renderTasks() {
    ensureDaily();
    const box = $('#daily-list');
    if (!box) return;
    const dp = state.daily.progress;
    let done = 0;

    box.innerHTML = TASKS.map(t => {
      const cur = Math.min(dp[t.type] || 0, t.target);
      const finished = cur >= t.target;
      const claimed = state.daily.claimed.indexOf(t.id) > -1;
      if (finished) done++;
      const pct = Math.round(cur / t.target * 100);
      return `<div class="task ${claimed ? 'done' : finished ? 'ready' : ''}">
        <span class="task-ico">${Art.em(t.icon)}</span>
        <div class="task-main">
          <div class="task-head"><b>${t.name}</b><span class="task-reward">+${t.reward} 🌰</span></div>
          <div class="task-bar"><i style="width:${pct}%"></i></div>
        </div>
        ${claimed
          ? '<span class="task-flag">已领取</span>'
          : finished
            ? `<button class="task-btn" data-task="${t.id}">领取</button>`
            : `<span class="task-num">${cur}/${t.target}</span>`}
      </div>`;
    }).join('');

    const all = $('#daily-all');
    if (all) all.textContent = done + '/' + TASKS.length;
    const card = $('#daily-card');
    if (card) card.classList.toggle('all-done', done === TASKS.length);
  }

  function claimTask(id) {
    ensureDaily();
    const t = TASKS.find(x => x.id === id);
    if (!t) return;
    if (state.daily.claimed.indexOf(id) > -1) return;
    if ((state.daily.progress[t.type] || 0) < t.target) return toast('还没有完成哦，再努力一下～');
    state.daily.claimed.push(id);
    state.coins += t.reward;
    save();
    AudioFX.coin();
    renderTasks();
    refreshHud();
    toast('任务完成！获得 ' + t.reward + ' 橡果币');
  }

  /* ---------- 课程阶段 ---------- */

  function findStageById(id) {
    let found = null;
    Object.keys(DATA.curriculum).some(k => {
      const st = DATA.curriculum[k].stages.find(s => s.id === id);
      if (st) {
        found = Object.assign({ subject: k }, st);
        return true;
      }
      return false;
    });
    return found;
  }

  function stageInfo(id) {
    return state.stages[id] || { stars: 0, plays: 0, best: 0 };
  }

  function stageUnlocked(subjectKey, index) {
    if (index <= 0) return true;
    const stages = DATA.curriculum[subjectKey].stages;
    return stageInfo(stages[index - 1].id).stars > 0;
  }

  function subjectProgress(key) {
    const stages = DATA.curriculum[key].stages;
    const done = stages.filter(s => stageInfo(s.id).stars > 0).length;
    const stars = stages.reduce((n, s) => n + stageInfo(s.id).stars, 0);
    return { done, total: stages.length, stars, maxStars: stages.length * 3 };
  }

  function nextStage(key) {
    const stages = DATA.curriculum[key].stages;
    for (let i = 0; i < stages.length; i++) {
      if (stageInfo(stages[i].id).stars === 0 && stageUnlocked(key, i)) return stages[i];
    }
    return stages[stages.length - 1];
  }

  function showStages(subjectKey) {
    if (!DATA.curriculum[subjectKey]) subjectKey = 'numbers';
    currentSubject = subjectKey;
    show('stages');
    maybeGuide(subjectKey, () => {});
  }

  function renderStages() {
    const c = DATA.curriculum[currentSubject];
    if (!c) return;
    const box = $('#stage-list');
    if (!box) return;

    const prog = subjectProgress(currentSubject);
    const nxt = nextStage(currentSubject);
    $('#stage-icon').innerHTML = Art.em(c.icon);
    $('#stage-name-title').textContent = c.name;
    $('#stage-tag').textContent = c.tag;
    $('#stage-summary').innerHTML =
      `已完成 <b>${prog.done}/${prog.total}</b> 个阶段 · ${Art.ui('star')} <b>${prog.stars}/${prog.maxStars}</b>`;
    $('#stage-progress-fill').style.width = (prog.done / prog.total * 100) + '%';

    box.innerHTML = c.stages.map((st, i) => {
      const inf = stageInfo(st.id);
      const unlocked = stageUnlocked(currentSubject, i);
      const isNext = nxt.id === st.id && unlocked;
      return `<button class="stage-card ${unlocked ? '' : 'locked'} ${inf.stars ? 'done' : ''} ${isNext ? 'next' : ''}"
        data-stage="${unlocked ? st.id : ''}" ${unlocked ? '' : 'disabled'} style="--c:${c.color}">
        <span class="stage-index">${unlocked ? (inf.stars ? Art.ui('check') : i + 1) : Art.ui('lock')}</span>
        <span class="stage-emoji">${Art.em(st.icon)}</span>
        <span class="stage-main">
          <b>${st.name}</b>
          <small>${st.desc}</small>
          <span class="stage-stars">${[1, 2, 3].map(n => `<i class="${n <= inf.stars ? 'on' : ''}">${Art.ui(n <= inf.stars ? 'star' : 'star-off')}</i>`).join('')}</span>
        </span>
        ${isNext ? '<span class="stage-badge">从这里开始</span>'
          : inf.stars ? '<span class="stage-badge done">已完成</span>' : ''}
      </button>`;
    }).join('');
  }

  /* ---------- 闯关地图 ---------- */

  function levelStars(id) { return state.map.stars[id] || 0; }

  function levelIndex(id) {
    return LEVELS.findIndex(l => String(l.id) === String(id));
  }

  // 通关上一关就解锁下一关（按地图顺序，不依赖关卡编号）
  function levelUnlocked(id) {
    const i = levelIndex(id);
    if (i <= 0) return i === 0;
    return levelStars(LEVELS[i - 1].id) > 0;
  }

  function branchOpen(id) {
    const b = BRANCHES.find(x => x.id === id);
    return !!b && levelStars(b.parent) > 0;
  }

  function branchDoneCount() {
    return BRANCHES.filter(b => state.map.branchDone[b.id]).length;
  }

  function clearedCount() {
    return LEVELS.filter(l => levelStars(l.id) > 0).length;
  }

  function nextLevel() {
    const open = LEVELS.filter(l => levelUnlocked(l.id) && levelStars(l.id) === 0);
    return open.length ? open[0] : LEVELS[LEVELS.length - 1];
  }

  /* 地图走向：宽屏蛇形棋盘，横向铺满，支线插在主线节点旁边 */
  const MAP_SCENERY = [
    { e: '🌲', x: 6, y: 6, s: 40 }, { e: '☁️', x: 92, y: 4, s: 30 },
    { e: '🪨', x: 94, y: 30, s: 24 }, { e: '🌻', x: 5, y: 32, s: 26 },
    { e: '🌲', x: 95, y: 56, s: 32 }, { e: '🍄', x: 4, y: 58, s: 22 },
    { e: '🐿️', x: 93, y: 82, s: 26 }, { e: '🌾', x: 6, y: 84, s: 26 },
    { e: '🦋', x: 50, y: 8, s: 22 }, { e: '🌸', x: 48, y: 92, s: 22 }
  ];

  function mapCols() {
    const w = Math.min(window.innerWidth || 1180, 1180);
    return w >= 980 ? 5 : w >= 700 ? 4 : 3;
  }

  function renderMap() {
    const path = $('#map-path');
    if (!path) return;

    const cols = mapCols();
    const rows = Math.ceil(LEVELS.length / cols);
    const ROW = 186;
    const TOP = 96;
    const step = cols > 1 ? 80 / (cols - 1) : 0;
    const xs = Array.from({ length: cols }, (_, c) => 10 + c * step);

    const pts = LEVELS.map((lv, i) => {
      const r = Math.floor(i / cols);
      const c = i % cols;
      const col = r % 2 === 0 ? c : cols - 1 - c;
      return { x: xs[col], y: TOP + r * ROW };
    });
    const H = (rows - 1) * ROW + TOP + 140;

    const branchPts = BRANCHES.map(b => {
      const idx = levelIndex(b.parent);
      const p = idx > -1 ? pts[idx] : pts[0];
      const dir = b.side === 'left' ? -1 : b.side === 'right' ? 1 : (p.x < 50 ? 1 : -1);
      let x = p.x + dir * 11;
      if (x < 7 || x > 93) x = p.x - dir * 11;
      x = Math.min(93, Math.max(7, x));
      return {
        b,
        x,
        y: Math.max(30, p.y - 68),
        parent: p,
        open: levelStars(b.parent) > 0,
        done: !!state.map.branchDone[b.id]
      };
    });

    let d = 'M ' + pts[0].x + ' ' + pts[0].y;
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1];
      const b = pts[i];
      const mx = (a.x + b.x) / 2;
      const my = (a.y + b.y) / 2;
      const cx = a.y === b.y ? mx : a.x;
      const cy = a.y === b.y ? a.y : my;
      d += ' Q ' + cx + ' ' + cy + ' ' + b.x + ' ' + b.y;
    }

    const branchD = branchPts.map(bp => {
      const c1x = bp.parent.x + (bp.x - bp.parent.x) * 0.32;
      const c1y = bp.parent.y - 22;
      return '<path class="map-branch-shadow" d="M ' + bp.parent.x + ' ' + bp.parent.y +
        ' Q ' + c1x + ' ' + c1y + ', ' + bp.x + ' ' + bp.y + '"></path>' +
        '<path class="map-branch-road" d="M ' + bp.parent.x + ' ' + bp.parent.y +
        ' Q ' + c1x + ' ' + c1y + ', ' + bp.x + ' ' + bp.y + '"></path>';
    }).join('');

    const svg = '<svg class="map-svg" viewBox="0 0 100 ' + H + '" preserveAspectRatio="none" aria-hidden="true">' +
      '<path class="map-road-shadow" d="' + d + '"></path>' +
      '<path class="map-road" d="' + d + '"></path>' +
      '<path class="map-trail" d="' + d + '"></path>' +
      branchD +
      '</svg>';

    const scenery = MAP_SCENERY.map(s =>
      '<span class="map-scenery" style="left:' + s.x + '%;top:' + s.y + '%;font-size:' + s.s + 'px">' + s.e + '</span>').join('');

    const nodes = LEVELS.map((lv, i) => {
      const sub = Game.SUBJECTS[lv.subject];
      const stars = levelStars(lv.id);
      const unlocked = levelUnlocked(lv.id);
      const p = pts[i];
      const info = !unlocked ? '先通过上一关'
        : lv.kind === 'mini' ? '小游戏 · ' + lv.desc
          : sub.name;
      return '<button class="map-node ' + (unlocked ? 'unlocked' : 'locked') + ' ' + (stars ? 'cleared' : '') + ' ' +
        (lv.kind === 'mini' ? 'mini-node' : '') + '" data-level="' + (unlocked ? lv.id : '') +
        '" style="left:' + p.x + '%;top:' + p.y + 'px;--c:' + sub.color + '" ' + (unlocked ? '' : 'disabled') + '>' +
        '<span class="node-bubble"><span class="node-emoji">' + Art.em(unlocked ? lv.node : '🔒') + '</span>' +
        '<span class="node-no">' + (i + 1) + '</span></span>' +
        '<span class="node-info"><b>' + lv.name + '</b><small>' + info + '</small>' +
        '<span class="node-stars">' + [1, 2, 3].map(n => '<i class="' + (n <= stars ? 'on' : '') + '">' +
          Art.ui(n <= stars ? 'star' : 'star-off') + '</i>').join('') + '</span></span>' +
        '</button>';
    }).join('');

    const branches = branchPts.map(bp => {
      const b = bp.b;
      const label = bp.open ? (bp.done ? '已探索' : b.name) : '先过第 ' + (levelIndex(b.parent) + 1) + ' 关';
      return '<button class="map-branch ' + (bp.open ? 'unlocked' : 'locked') + ' ' + (bp.done ? 'done' : '') + '" data-branch="' +
        (bp.open ? b.id : '') + '" style="left:' + bp.x + '%;top:' + bp.y + 'px;--c:' + b.color + '" ' + (bp.open ? '' : 'disabled') + '>' +
        '<span class="branch-bubble">' + Art.em(bp.open ? (bp.done ? '✓' : b.icon) : '🔒') + '</span>' +
        '<span class="branch-label">' + label + '</span></button>';
    }).join('');

    path.style.height = H + 'px';
    path.innerHTML = svg + scenery + nodes + branches;

    const count = $('#map-count');
    if (count) count.textContent = '主线 ' + clearedCount() + '/' + LEVELS.length;
    const starsEl = $('#map-stars');
    if (starsEl) {
      const stars = LEVELS.reduce((n, l) => n + levelStars(l.id), 0);
      starsEl.innerHTML = Art.ui('star') + ' ' + stars + '/' + LEVELS.length * 3 +
        ' · ' + Art.em('🎁') + ' ' + branchDoneCount() + '/' + BRANCHES.length;
    }

    const nxt = nextLevel();
    const name = $('#map-next-name');
    if (name) name.textContent = '下一关：' + nxt.name;
    const sub = $('#map-next-sub');
    if (sub) {
      sub.textContent = nxt.kind === 'mini'
        ? '小游戏：' + nxt.desc
        : '答对 ' + nxt.need + ' 题就能过关，加油！';
    }
  }

  function refreshMapBanner() {
    const sub = $('#map-banner-sub');
    if (!sub) return;
    const cleared = clearedCount();
    const nxt = nextLevel();
    sub.textContent = cleared === 0
      ? '从第 1 关开始冒险吧！'
      : `已通关 ${cleared}/${LEVELS.length} 关 · 支线 ${branchDoneCount()}/${BRANCHES.length} · 下一关：${nxt.name}`;
  }

  function playLevel(id) {
    const lv = LEVELS.find(l => l.id === Number(id));
    if (!lv) return;
    if (!levelUnlocked(lv.id)) return toast('先通过前面的关卡吧～');
    AudioFX.click();
    if (lv.kind === 'mini') {
      MiniGame.start(lv.mini, { subject: lv.subject, levelId: lv.id });
    } else {
      Game.start(lv.subject, lv.stage, lv.id);
    }
  }

  /* ---------- 地图支线 ---------- */

  function enterBranch(id) {
    const b = BRANCHES.find(x => x.id === id);
    if (!b) return;
    if (!branchOpen(id)) return toast('先通过第 ' + (levelIndex(b.parent) + 1) + ' 关吧～');

    if (b.type === 'treasure') {
      if (state.map.branchDone[id]) return toast('这个宝箱已经打开啦～');
      state.map.branchDone[id] = true;
      state.coins += b.reward;
      AudioFX.coin();
      save();
      checkBadges();
      refreshHud();
      renderMap();
      toast('打开宝箱，获得 ' + b.reward + ' 颗橡果！');
      return;
    }
    if (b.type === 'story') {
      showStory(b);
      return;
    }
    if (b.type === 'mini') {
      AudioFX.click();
      MiniGame.start(b.mini, { subject: b.subject, branchId: b.id });
    }
  }

  function showStory(b) {
    if (!b || b.type !== 'story') return;
    const first = !state.map.branchDone[b.id];
    $('#story-icon').innerHTML = Art.em(b.icon);
    $('#story-title').textContent = b.title || b.name;
    $('#story-body').innerHTML = b.lines.map((t, i) =>
      `<p><span>${i + 1}</span>${t}</p>`).join('');
    $('#story-reward').textContent = first
      ? `首次阅读，获得 +${b.reward} 🌰`
      : '这个故事已经听过啦，可以再听一遍～';

    if (first) {
      state.map.branchDone[b.id] = true;
      state.coins += b.reward;
      save();
      checkBadges();
      refreshHud();
      renderMap();
      AudioFX.coin();
    }
    $('#story-modal').classList.add('open');
    AudioFX.speakSegments(b.lines.map(t => ({ text: t, lang: 'zh-CN' })));
  }

  function closeStory() {
    closeModal('story-modal');
    AudioFX.stopSpeak();
    AudioFX.click();
  }

  /* ---------- 首次入门 ---------- */

  function showIntro() {
    if (state.flags.intro) return;
    const pet = $('#intro-pet');
    if (pet) pet.innerHTML = Pet.svg(1, 90);
    $('#intro-modal').classList.add('open');
  }

  function closeIntro() {
    if (!state.flags.intro) {
      state.flags.intro = true;
      save();
    }
    closeModal('intro-modal');
    AudioFX.click();
    AudioFX.speak('我们出发吧', 'zh-CN');
  }

  function maybeGuide(subjectKey, onStart) {
    if (state.flags.guides.indexOf(subjectKey) > -1) return onStart();
    const g = GUIDES[subjectKey];
    if (!g) return onStart();

    state.flags.guides.push(subjectKey);
    save();
    guideCallback = onStart;
    $('#guide-icon').innerHTML = Art.em(g.icon);
    $('#guide-title').textContent = g.name;
    $('#guide-lines').innerHTML = g.lines.map((t, i) =>
      `<div class="guide-line"><span>${i + 1}</span><p>${t}</p></div>`).join('');
    $('#guide-modal').classList.add('open');
    AudioFX.speakSegments([{ text: g.name + '，第一次来，先看看小提示吧', lang: 'zh-CN' }]);
  }

  function startGuided() {
    closeModal('guide-modal');
    const cb = guideCallback;
    guideCallback = null;
    if (cb) cb();
  }

  /* ---------- 首页 ---------- */

  function renderSubjects() {
    const grid = $('#subject-grid');
    if (!grid) return;
    grid.innerHTML = Object.keys(DATA.curriculum).map(k => {
      const s = Game.SUBJECTS[k];
      const prog = subjectProgress(k);
      return `<button class="subject-card" data-subject="${k}" style="--c:${s.color}">
        <span class="subject-icon">${Art.em(s.icon)}</span>
        <span class="subject-body">
          <span class="subject-name">${s.name}</span>
          <span class="subject-tag">${s.tag}</span>
          <span class="subject-track"><i style="width:${Math.round(prog.done / prog.total * 100)}%"></i></span>
          <span class="subject-meta">${prog.done}/${prog.total} 阶段${prog.stars ? ' · ' + Art.ui('star') + ' ' + prog.stars : ''}</span>
        </span>
        <span class="subject-go">进入 →</span>
      </button>`;
    }).join('');
  }

  /* ---------- 养成 ---------- */

  function care(action) {
    const p = state.pet;
    AudioFX.unlock();

    if (action === 'feed') {
      if (p.hunger >= 96) return toast('小龙猫已经吃得饱饱的啦～');
      if (state.coins < 5) return toast('橡果币不够啦，去学习赚橡果吧～');
      state.coins -= 5;
      p.hunger = Pet.clamp(p.hunger + 28);
      p.mood = Pet.clamp(p.mood + 6);
      p.exp += 2;
      state.stats.careCount++;
      newBadgeCheck();
      petReact('react-happy');
      AudioFX.care();
      AudioFX.speak('好吃！谢谢你～', 'zh-CN');
      toast('小龙猫吃得很开心！（-5🌰）');
    } else if (action === 'bath') {
      if (p.clean >= 96) return toast('小龙猫已经很干净啦～');
      if (state.coins < 4) return toast('橡果币不够啦，去学习赚橡果吧～');
      state.coins -= 4;
      p.clean = Pet.clamp(p.clean + 40);
      p.mood = Pet.clamp(p.mood + 8);
      p.exp += 1;
      state.stats.careCount++;
      newBadgeCheck();
      petReact('react-happy');
      AudioFX.care();
      AudioFX.speak('洗香香，好舒服～', 'zh-CN');
      toast('洗得干干净净！（-4🌰）');
    } else if (action === 'play') {
      if (p.mood >= 96) return toast('它玩得超开心，先休息一下吧～');
      if (state.coins < 3) return toast('橡果币不够啦，去学习赚橡果吧～');
      state.coins -= 3;
      p.mood = Pet.clamp(p.mood + 22);
      p.hunger = Pet.clamp(p.hunger - 6);
      p.clean = Pet.clamp(p.clean - 8);
      p.exp += 3;
      state.stats.careCount++;
      newBadgeCheck();
      petReact('react-happy');
      AudioFX.pop();
      AudioFX.speak('哈哈，再来一次！', 'zh-CN');
      toast('玩得真开心！（-3🌰）');
    }

    p.lastCare = Date.now();
    const h = historyToday();
    h.care += 1;
    trimHistory();
    bumpDaily('care', 1);
    save();
    refreshHome();
  }

  function newBadgeCheck() {
    checkBadges();
    refreshHud();
  }

  function patPet() {
    const now = Date.now();
    state.pet.mood = Pet.clamp(state.pet.mood + 1);
    state.pet.lastCare = now;
    if (now - patAt > 1600) {
      patAt = now;
      petReact('react-happy');
      AudioFX.pop();
      $('#pet-speech').textContent = '嘻嘻，好痒呀～';
    }
    $('#bar-mood').style.width = state.pet.mood + '%';
    save();
  }

  /* ---------- 学科与结算 ---------- */

  function applyLevel(levelId, correct, stars) {
    const id = Number(levelId);
    const lv = LEVELS.find(l => l.id === id);
    if (!lv) return null;

    const passed = correct >= lv.need;
    const prev = state.map.stars[id] || 0;
    let bonus = 0;
    let newClear = false;

    if (passed) {
      state.map.stars[id] = Math.max(prev, Math.min(3, Math.max(1, stars || 1)));
      if (prev === 0) {
        newClear = true;
        bonus = 20;
        state.coins += bonus;
        state.map.clears++;
      }
    }

    const idx = levelIndex(id);
    return {
      id,
      name: lv.name,
      need: lv.need,
      passed,
      newClear,
      bonus,
      stars: state.map.stars[id] || 0,
      next: idx > -1 && idx < LEVELS.length - 1 ? LEVELS[idx + 1] : null
    };
  }

  /* 阶段进度：过关（≥1 星）才算完成，并解锁下一阶段 */
  function applyStage(stageId, correct, stars, total) {
    const st = stageId ? findStageById(stageId) : null;
    if (!st) return null;
    const passed = stars > 0;
    const cur = stageInfo(stageId);
    const newClear = passed && cur.stars === 0;
    state.stages[stageId] = {
      stars: Math.max(cur.stars, passed ? Math.min(3, stars) : 0),
      plays: cur.plays + 1,
      best: Math.max(cur.best, correct)
    };
    if (newClear) state.coins += 10;
    return {
      id: stageId,
      name: st.name,
      icon: st.icon,
      passed,
      newClear,
      stars: state.stages[stageId].stars,
      need: Math.ceil(total * 0.6)
    };
  }

  function finishSession({ subject, correct, total, bestCombo, stars, seconds, levelId, stageId, answers }) {
    ensureDaily();
    markDay();

    const subj = DATA.curriculum[subject] ? subject : 'numbers';
    const c = Math.max(0, Math.round(Number(correct) || 0));
    const t = Math.max(c, Math.round(Number(total) || 0));
    const secs = estSeconds(seconds, t);
    const acc = accuracyFactor(c, t);
    const coins = Math.round((c * 2 + (stars === 3 ? 12 : 0) + ((Number(bestCombo) || 0) >= 3 ? 3 : 0)) * acc * repeatFactor() * petBonus());
    const exp = Math.round((c * 4 + (stars === 3 ? 10 : 0)) * acc);

    state.coins += coins;
    const ups = addExp(exp);

    const s = state.stats;
    s.games++;
    s.correct += c;
    s.total += t;
    s.seconds += secs;
    s.earned += coins;
    s.bestCombo = Math.max(s.bestCombo, Number(bestCombo) || 0);
    if (t && c === t) s.perfectGames++;
    s.played[subj] = (s.played[subj] || 0) + 1;
    const bs = s.bySubject[subj] || { correct: 0, total: 0 };
    bs.correct += c;
    bs.total += t;
    s.bySubject[subj] = bs;

    const h = historyToday();
    h.games += 1;
    h.correct += c;
    h.total += t;
    h.seconds += secs;
    trimHistory();

    if (Array.isArray(answers)) {
      answers.slice(-80).forEach(a => {
        if (isObj(a)) pushAnswer(subj, a.type, a.answer, a.chosen, a.ok);
      });
    }

    const beforeStars = totalStars();
    const level = applyLevel(levelId, c, stars);
    const stage = applyStage(stageId, c, stars, t);
    const gainedStars = Math.max(0, totalStars() - beforeStars);
    if (gainedStars) {
      bumpDaily('stars', gainedStars);
      h.stars += gainedStars;
    }

    bumpDaily('correct', c);
    bumpDaily('games', 1);
    petAfterStudy(c, t, secs);

    save();
    checkBadges();
    refreshHud();
    refreshHome();
    renderSubjects();

    return { coins, exp, leveledUp: ups > 0, level, stage };
  }

  /* 小游戏结算：和答题分开统计，但同样能拿橡果、成长值和地图星 */
  function finishMini({ type, subject, correct, total, stars, seconds, levelId, branchId }) {
    ensureDaily();
    markDay();

    const c = Math.max(0, Math.round(Number(correct) || 0));
    const t = Math.max(c, Math.round(Number(total) || 0));
    const secs = estSeconds(seconds, t);
    const acc = accuracyFactor(c, t);
    const coins = Math.round((c * 2 + (stars === 3 ? 12 : 0)) * acc * repeatFactor() * petBonus());
    const exp = Math.round((c * 4 + (stars === 3 ? 10 : 0)) * acc);

    state.coins += coins;
    const ups = addExp(exp);

    const s = state.stats;
    s.miniGames++;
    s.miniCorrect += c;
    s.miniTotal += t;
    s.seconds += secs;
    s.earned += coins;
    if (type === 'mole') s.molesHit += c;
    if (subject && DATA.curriculum[subject]) {
      s.played[subject] = (s.played[subject] || 0) + 1;
    }

    const h = historyToday();
    h.mini += 1;
    h.seconds += secs;
    trimHistory();

    const beforeStars = totalStars();
    const level = applyLevel(levelId, c, stars);
    const gainedStars = Math.max(0, totalStars() - beforeStars);
    if (gainedStars) {
      bumpDaily('stars', gainedStars);
      h.stars += gainedStars;
    }
    bumpDaily('games', 1);
    petAfterStudy(c, t, secs);

    let branchCoins = 0;
    if (branchId) {
      const b = BRANCHES.find(x => x.id === branchId);
      if (b && !state.map.branchDone[branchId]) {
        state.map.branchDone[branchId] = true;
        state.coins += b.reward;
        branchCoins = b.reward;
      }
    }

    save();
    checkBadges();
    refreshHud();
    refreshHome();
    renderSubjects();

    return { coins, exp, leveledUp: ups > 0, level, branchCoins };
  }

  /* ---------- 错题本与间隔重复 ----------
     首次入本立刻到期，之后按错误次数 1 / 3 / 7 天拉开，连续答对两次才移出。 */

  const REVIEW_GAPS = [1, 3, 7];
  let confirmResolve = null;

  function wrongKey(q) {
    return [q.subject || '', q.type || '', q.answer == null ? '' : q.answer, q.title || ''].join('|');
  }

  function addWrong(q) {
    if (!isObj(q)) return;
    const key = wrongKey(q);
    let item = state.wrongBook.find(w => w.key === key);
    if (item) {
      item.times = Math.min(999, (Number(item.times) || 1) + 1);
      item.right = 0;
      item.chosen = String(q.chosen == null ? '' : q.chosen);
      item.at = Date.now();
      item.dueAt = Date.now() + REVIEW_GAPS[Math.min(item.times - 1, REVIEW_GAPS.length - 1)] * 86400000;
    } else {
      item = {
        id: 'w' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        key,
        subject: DATA.curriculum[q.subject] ? q.subject : 'numbers',
        type: String(q.type || 'choice'),
        title: String(q.title == null ? '' : q.title),
        visual: String(q.visual == null ? '' : q.visual),
        answer: String(q.answer == null ? '' : q.answer),
        speak: isObj(q.speak) ? {
          text: String(q.speak.text || ''),
          lang: String(q.speak.lang || 'zh-CN'),
          audio: String(q.speak.audio || '')
        } : null,
        hint: String(q.hint == null ? '' : q.hint),
        options: Array.isArray(q.options)
          ? q.options.filter(isObj).slice(0, 6).map(o => ({
            label: String(o.label == null ? '' : o.label),
            html: String(o.html == null ? '' : o.html)
          }))
          : [],
        chosen: String(q.chosen == null ? '' : q.chosen),
        times: 1,
        right: 0,
        dueAt: Date.now(),
        at: Date.now()
      };
      state.wrongBook.push(item);
      if (state.wrongBook.length > 60) state.wrongBook.shift();
    }
    save();
    refreshReviewBadge();
  }

  function dueReview(limit = 12) {
    const now = Date.now();
    return state.wrongBook
      .filter(w => (Number(w.dueAt) || 0) <= now)
      .sort((a, b) => (Number(a.dueAt) || 0) - (Number(b.dueAt) || 0))
      .slice(0, Math.max(1, Math.round(Number(limit) || 12)))
      .map(w => ({
        id: w.id,
        subject: w.subject,
        type: w.type,
        title: w.title,
        visual: w.visual,
        answer: w.answer,
        speak: w.speak,
        hint: w.hint,
        options: w.options
      }));
  }

  function reviewWrong(id, ok) {
    const i = state.wrongBook.findIndex(w => w.id === id);
    if (i === -1) return;
    const w = state.wrongBook[i];
    if (ok) {
      w.right = (Number(w.right) || 0) + 1;
      if (w.right >= 2) {
        state.wrongBook.splice(i, 1);
      } else {
        w.dueAt = Date.now() + REVIEW_GAPS[Math.min((Number(w.times) || 1) - 1, REVIEW_GAPS.length - 1)] * 86400000;
      }
    } else {
      w.times = Math.min(999, (Number(w.times) || 1) + 1);
      w.right = 0;
      w.at = Date.now();
      w.dueAt = Date.now() + REVIEW_GAPS[Math.min(w.times - 1, REVIEW_GAPS.length - 1)] * 86400000;
    }
    save();
    refreshReviewBadge();
  }

  /* 复习局结算：不和主线比星，只给小额橡果和经验 */
  function finishReview({ correct, total, firstTry, seconds }) {
    ensureDaily();
    markDay();
    const c = Math.max(0, Math.round(Number(correct) || 0));
    const t = Math.max(c, Math.round(Number(total) || 0));
    const secs = estSeconds(seconds, t);
    const acc = accuracyFactor(c, t);
    const coins = Math.round((6 + c * 3) * acc * petBonus());
    const exp = Math.round(c * 3 * acc);

    state.coins += coins;
    const ups = addExp(exp);
    const s = state.stats;
    s.seconds += secs;
    s.earned += coins;
    s.correct += c;
    s.total += t;

    const h = historyToday();
    h.review += 1;
    h.correct += c;
    h.total += t;
    h.seconds += secs;
    trimHistory();

    bumpDaily('review', 1);
    bumpDaily('correct', c);
    petAfterStudy(c, t, secs);

    save();
    checkBadges();
    refreshHud();
    refreshHome();
    refreshReviewBadge();

    return { coins, exp, leveledUp: ups > 0, level: null, stage: null };
  }

  /* 跟读 / 描红：按完成度给小额奖励，不参与正确率统计 */
  function finishPractice({ kind, score, stars }) {
    ensureDaily();
    const sp = Math.max(0, Math.min(1, Number(score) || 0));
    const coins = Math.round((5 + sp * 9) * petBonus());
    const exp = Math.round(5 + sp * 7);
    const secs = kind === 'trace' ? 60 : 20;

    state.coins += coins;
    const ups = addExp(exp);
    state.stats.earned += coins;
    state.stats.seconds += secs;

    const h = historyToday();
    h.practice += 1;
    h.seconds += secs;
    trimHistory();

    bumpDaily('practice', 1);
    save();
    checkBadges();
    refreshHud();
    refreshHome();
    toast('练习完成，获得 ' + coins + ' 颗橡果币');

    return { coins, exp, leveledUp: ups > 0, level: null, stars: stars || 0 };
  }

  function dueCount() {
    const now = Date.now();
    return state.wrongBook.filter(w => (Number(w.dueAt) || 0) <= now).length;
  }

  function refreshReviewBadge() {
    const badge = $('#review-badge');
    if (!badge) return;
    const n = dueCount();
    badge.textContent = n > 99 ? '99+' : String(n);
    badge.classList.toggle('empty', n === 0);
  }

  /* 通用确认框：返回 Promise<boolean>，支持 Esc / 遮罩取消 */
  function confirm(opts) {
    const o = isObj(opts) ? opts : { text: String(opts || '') };
    const modal = $('#confirm-modal');
    if (!modal) return Promise.resolve(true);
    $('#confirm-title').textContent = o.title || '确定吗？';
    $('#confirm-text').textContent = o.text || '';
    $('#btn-confirm-ok').textContent = o.ok || '确定';
    $('#btn-confirm-cancel').textContent = o.cancel || '取消';
    if (confirmResolve) confirmResolve(false);
    modal.classList.add('open');
    AudioFX.click();
    return new Promise(res => { confirmResolve = res; });
  }

  function closeConfirm(v) {
    const modal = $('#confirm-modal');
    if (modal) modal.classList.remove('open');
    const r = confirmResolve;
    confirmResolve = null;
    if (r) r(v === true);
  }

  function trackAtlas(key) {
    if (!DATA.curriculum[key]) return;
    state.stats.atlas[key] = (state.stats.atlas[key] || 0) + 1;
    save();
    checkBadges();
  }

  /* ---------- 商店 ---------- */

  function openShop(tab) {
    if (tab) shopTab = tab;
    renderShop();
    $('#shop-modal').classList.add('open');
    AudioFX.click();
  }

  function closeModal(id) {
    const el = $('#' + id);
    if (el) el.classList.remove('open');
  }

  function renderShop() {
    $$('.tab').forEach(t => t.classList.toggle('active', t.dataset.tab === shopTab));
    const list = $('#shop-list');

    if (shopTab === 'food') {
      list.innerHTML = DATA.shop.food.map(it => `
        <div class="shop-item">
          <div class="shop-emoji">${Art.em(it.emoji)}</div>
          <div class="shop-info">
            <b>${it.name}</b>
            <span>饱食 +${it.hunger} · 心情 +${it.mood}</span>
          </div>
          <button class="buy-btn" data-buy="food:${it.id}">${it.price} 🌰</button>
        </div>`).join('');
    } else if (shopTab === 'decor') {
      list.innerHTML = DATA.shop.decor.map(it => {
        const owned = state.owned.indexOf(it.id) > -1;
        return `
        <div class="shop-item">
          <div class="shop-emoji">${Art.em(it.emoji)}</div>
          <div class="shop-info">
            <b>${it.name}</b>
            <span>${owned ? '已拥有 · 去小屋摆放' : '小屋装饰'}</span>
          </div>
          ${owned
            ? '<button class="buy-btn owned" disabled>已拥有</button>'
            : `<button class="buy-btn" data-buy="decor:${it.id}">${it.price} 🌰</button>`}
        </div>`;
      }).join('');
    } else {
      list.innerHTML = DATA.shop.bg.map(it => {
        const owned = state.owned.indexOf(it.id) > -1;
        const using = state.bg === it.id;
        return `
        <div class="shop-item">
          <div class="shop-emoji">${Art.em(it.emoji)}</div>
          <div class="shop-info">
            <b>${it.name}</b>
            <span>${using ? '正在使用' : owned ? '已拥有' : '小屋背景'}</span>
          </div>
          ${using
            ? '<button class="buy-btn owned" disabled>使用中</button>'
            : owned
              ? `<button class="buy-btn use" data-buy="bguse:${it.id}">使用</button>`
              : `<button class="buy-btn" data-buy="bg:${it.id}">${it.price} 🌰</button>`}
        </div>`;
      }).join('');
    }
  }

  function buy(kind, id) {
    AudioFX.unlock();

    if (kind === 'food') {
      const item = DATA.shop.food.find(x => x.id === id);
      if (!item) return;
      if (state.coins < item.price) return toast('橡果币不够，去学习赚橡果吧～');
      if (state.pet.hunger >= 96) return toast('小龙猫已经吃饱啦～');
      state.coins -= item.price;
      state.pet.hunger = Pet.clamp(state.pet.hunger + item.hunger);
      state.pet.mood = Pet.clamp(state.pet.mood + item.mood);
      state.pet.exp += 2;
      state.pet.lastCare = Date.now();
      state.stats.careCount++;
      bumpDaily('care', 1);
      save();
      checkBadges();
      closeModal('shop-modal');
      show('home');
      refreshHome();
      petReact('react-happy');
      AudioFX.care();
      AudioFX.speak(item.say, 'zh-CN');
      $('#pet-speech').textContent = item.say;
      toast('小龙猫吃得真开心！');
      return;
    }

    const item = DATA.shop[shopTab === 'bg' ? 'bg' : 'decor'].find(x => x.id === id);
    if (!item) return;

    if (kind === 'decor') {
      if (state.owned.indexOf(id) > -1) return;
      if (state.coins < item.price) return toast('橡果币不够，去学习赚橡果吧～');
      state.coins -= item.price;
      state.owned.push(id);
      AudioFX.coin();
      save();
      renderShop();
      refreshHud();
      toast('买到啦！去小屋摆上它吧～');
      return;
    }

    if (kind === 'bg') {
      if (state.owned.indexOf(id) > -1) return;
      if (state.coins < item.price) return toast('橡果币不够，去学习赚橡果吧～');
      state.coins -= item.price;
      state.owned.push(id);
      state.bg = id;
      AudioFX.coin();
      save();
      renderShop();
      refreshHud();
      refreshRoom();
      toast('小屋换新背景啦！');
      return;
    }

    if (kind === 'bguse') {
      state.bg = id;
      save();
      renderShop();
      refreshRoom();
      toast('小屋换新背景啦！');
    }
  }

  /* ---------- 小屋 ---------- */

  let roomSpeechTimer = null;
  let roomPetAt = 0;

  function decorPos(id, i) {
    const saved = state.decorPos[id];
    if (saved) return saved;
    const slot = DECOR_SLOTS[i % DECOR_SLOTS.length];
    return { x: slot.x, y: slot.y };
  }

  function refreshRoom() {
    const p = state.pet;
    $('#room-bg').className = 'room bg-' + state.bg;
    $('#room-pet').innerHTML = Pet.svg(p.level, p.mood);
    $('#room-decor').innerHTML = state.decor.map((id, i) => {
      const item = DATA.shop.decor.find(x => x.id === id);
      const slot = DECOR_SLOTS[i % DECOR_SLOTS.length];
      if (!item) return '';
      const pos = decorPos(id, i);
      return `<span class="decor-item" data-room-decor="${id}"
        style="left:${pos.x}%;top:${pos.y}%;font-size:${item.size || slot.s}px">${Art.em(item.emoji)}</span>`;
    }).join('');

    const ownedDecor = DATA.shop.decor.filter(x => state.owned.indexOf(x.id) > -1);
    if (!ownedDecor.length) {
      $('#inventory').innerHTML = '<p class="empty-tip">还没有装饰，去商店看看吧～</p>';
    } else {
      $('#inventory').innerHTML = ownedDecor.map(it => {
        const placed = state.decor.indexOf(it.id) > -1;
        return `<button class="inv-item ${placed ? 'placed' : ''}" data-decor="${it.id}">
          <span class="inv-emoji">${Art.em(it.emoji)}</span>
          <span class="inv-name">${it.name}</span>
          <span class="inv-state">${placed ? '收起来' : '摆上去'}</span>
        </button>`;
      }).join('');
    }
    refreshHud();
  }

  function decorReact(id) {
    const item = DATA.shop.decor.find(x => x.id === id);
    const el = document.querySelector(`[data-room-decor="${id}"]`);
    if (el) {
      el.classList.add('decor-react');
      setTimeout(() => el.classList.remove('decor-react'), 760);
    }
    AudioFX.pop();
    state.pet.mood = Pet.clamp(state.pet.mood + 1);
    save();
    if (item) toast(item.say || (item.name + '真好玩！'), 1600);
  }

  function roomPetTap() {
    const el = document.querySelector('#room-pet .pet-wrap');
    if (el) {
      el.classList.add('react-happy');
      setTimeout(() => el.classList.remove('react-happy'), 760);
    }
    AudioFX.pop();
    state.pet.mood = Pet.clamp(state.pet.mood + 1);
    save();
    const speech = $('#room-speech');
    if (speech) {
      speech.textContent = Pet.speakLine(state.pet);
      speech.classList.add('show');
      clearTimeout(roomSpeechTimer);
      roomSpeechTimer = setTimeout(() => speech.classList.remove('show'), 2600);
    }
    roomPetAt = Date.now();
  }

  function bindRoom() {
    const room = $('#room-bg');
    if (!room) return;
    let drag = null;

    room.addEventListener('pointerdown', e => {
      const item = e.target.closest('[data-room-decor]');
      if (item) {
        e.preventDefault();
        drag = {
          id: item.dataset.roomDecor,
          el: item,
          rect: room.getBoundingClientRect(),
          moved: false,
          startX: e.clientX,
          startY: e.clientY
        };
        item.classList.add('dragging');
        return;
      }
      if (e.target.closest('#room-pet')) {
        drag = { pet: true, startX: e.clientX, startY: e.clientY };
      }
    });

    room.addEventListener('pointermove', e => {
      if (!drag || !drag.el) return;
      const dx = e.clientX - drag.startX;
      const dy = e.clientY - drag.startY;
      if (!drag.moved && Math.sqrt(dx * dx + dy * dy) < 6) return;
      drag.moved = true;
      const x = Math.min(95, Math.max(5, (e.clientX - drag.rect.left) / drag.rect.width * 100));
      const y = Math.min(90, Math.max(8, (e.clientY - drag.rect.top) / drag.rect.height * 100));
      drag.el.style.left = x + '%';
      drag.el.style.top = y + '%';
    });

    const end = () => {
      if (!drag) return;
      if (drag.el) {
        drag.el.classList.remove('dragging');
        if (drag.moved) {
          const x = parseFloat(drag.el.style.left);
          const y = parseFloat(drag.el.style.top);
          if (isFinite(x) && isFinite(y)) {
            state.decorPos[drag.id] = { x: Math.round(x), y: Math.round(y) };
            save();
            AudioFX.pop();
            toast('摆放好啦！');
          }
        } else {
          decorReact(drag.id);
        }
      } else if (drag.pet) {
        roomPetTap();
      }
      drag = null;
    };
    room.addEventListener('pointerup', end);
    room.addEventListener('pointercancel', end);

    // 触摸/指针事件之外的兜底：直接点击小龙猫也能互动
    room.addEventListener('click', e => {
      if (e.target.closest('#room-pet') && Date.now() - roomPetAt > 320) roomPetTap();
    });
  }

  function toggleDecor(id) {
    const i = state.decor.indexOf(id);
    if (i > -1) {
      state.decor.splice(i, 1);
      AudioFX.click();
      toast('收进收藏箱啦～');
    } else {
      if (state.decor.length >= DECOR_SLOTS.length) return toast('小屋放不下更多啦～');
      state.decor.push(id);
      AudioFX.pop();
      toast('摆到小屋里啦，还能拖动位置哦～');
    }
    save();
    refreshRoom();
  }

  /* ---------- 勋章 ---------- */

  function refreshBadges() {
    $('#badge-count').textContent = state.badges.length + '/' + BADGES.length;
    $('#badge-grid').innerHTML = BADGES.map(b => {
      const got = state.badges.indexOf(b.id) > -1;
      const cur = Math.min(b.goal, Math.max(0, Math.round(b.cur(state) || 0)));
      const pct = Math.round(cur / b.goal * 100);
      return `<div class="badge ${got ? 'got' : 'locked'}">
        <div class="badge-icon">${Art.em(got ? b.icon : '🔒')}</div>
        <b>${b.name}</b>
        <span>${b.desc}</span>
        <span class="badge-bar"><i style="width:${pct}%"></i></span>
        <span class="badge-prog">${got ? '已获得' : cur + '/' + b.goal}</span>
      </div>`;
    }).join('');
  }

  /* ---------- 家长中心 ---------- */

  let parentUnlocked = false;
  let pinBuffer = '';
  let pinTimer = 0;

  function openParent() {
    const needPin = /^\d{4}$/.test(state.parent.pin);
    const unlocked = !needPin || parentUnlocked;
    const gate = $('#pin-gate');
    const body = $('#parent-body');
    if (gate) gate.style.display = unlocked ? 'none' : '';
    if (body) body.style.display = unlocked ? '' : 'none';
    if (!unlocked) {
      pinBuffer = '';
      renderPinPad();
      updatePinDots();
      const tip = $('#pin-tip');
      if (tip) tip.textContent = '';
    }
    refreshParent();
    $('#parent-modal').classList.add('open');
  }

  function renderPinPad() {
    const pad = $('#pin-pad');
    if (!pad) return;
    const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'del', '0', 'ok'];
    pad.innerHTML = keys.map(k => {
      if (k === 'del') return '<button class="pin-key pin-fn" type="button" data-pin="del">⌫</button>';
      if (k === 'ok') return '<button class="pin-key pin-fn" type="button" data-pin="ok">✓</button>';
      return '<button class="pin-key" type="button" data-pin="' + k + '">' + k + '</button>';
    }).join('');
  }

  function updatePinDots() {
    const dots = $('#pin-dots');
    if (!dots) return;
    let html = '';
    for (let i = 0; i < 4; i++) html += '<i class="' + (i < pinBuffer.length ? 'on' : '') + '"></i>';
    dots.innerHTML = html;
  }

  function pinPress(k) {
    const tip = $('#pin-tip');
    if (k === 'ok') { checkPin(); return; }
    if (k === 'del') {
      pinBuffer = pinBuffer.slice(0, -1);
      if (tip) tip.textContent = '';
    } else if (/^\d$/.test(k)) {
      if (pinBuffer.length >= 4) return;
      pinBuffer += k;
      AudioFX.click();
    }
    updatePinDots();
    clearTimeout(pinTimer);
    if (pinBuffer.length === 4) pinTimer = setTimeout(checkPin, 180);
  }

  function checkPin() {
    const tip = $('#pin-tip');
    if (pinBuffer.length !== 4) {
      if (tip) tip.textContent = '请输入 4 位数字';
      return;
    }
    if (pinBuffer === state.parent.pin) {
      parentUnlocked = true;
      pinBuffer = '';
      AudioFX.levelUp();
      openParent();
      return;
    }
    pinBuffer = '';
    updatePinDots();
    AudioFX.wrong();
    if (tip) tip.textContent = '密码不对，再试一次吧';
  }

  function openPinModal() {
    const input = $('#pin-input');
    if (input) input.value = '';
    const tip = $('#pin-modal-tip');
    if (tip) tip.textContent = state.parent.pin ? '已设置密码，输入新的 4 位数字可修改。' : '设置后进入家长中心需要输入这 4 位数字。';
    $('#pin-modal').classList.add('open');
    setTimeout(() => { if (input) input.focus(); }, 60);
  }

  function savePin() {
    const input = $('#pin-input');
    const v = ((input && input.value) || '').trim();
    const tip = $('#pin-modal-tip');
    if (!/^\d{4}$/.test(v)) {
      if (tip) tip.textContent = '请输入 4 位数字';
      return;
    }
    state.parent.pin = v;
    save();
    parentUnlocked = true;
    closeModal('pin-modal');
    toast('家长密码已设置');
  }

  function clearPin() {
    state.parent.pin = '';
    save();
    parentUnlocked = true;
    closeModal('pin-modal');
    toast('已取消家长密码');
  }

  function last7Days() {
    const out = [];
    for (let i = 6; i >= 0; i--) {
      const k = dateKey(-i);
      const h = state.history[k] || {};
      const parts = k.split('-');
      out.push({
        key: k,
        label: Number(parts[1]) + '/' + Number(parts[2]),
        correct: Number(h.correct) || 0,
        total: Number(h.total) || 0,
        seconds: Number(h.seconds) || 0
      });
    }
    return out;
  }

  function renderTrend() {
    const el = $('#parent-trend');
    if (!el) return;
    const days = last7Days();
    const max = Math.max(10, ...days.map(d => d.total));
    el.innerHTML = days.map(d => {
      const pct = d.total ? Math.round(d.correct / d.total * 100) : 0;
      const h = Math.round(d.correct / max * 100);
      return `<div class="trend-col" title="${d.key}：答对 ${d.correct} / ${d.total} 题">
        <i class="trend-bar"><b style="height:${h}%"></b></i>
        <span class="trend-num">${d.total ? pct + '%' : '—'}</span>
        <span class="trend-day">${d.label}</span>
      </div>`;
    }).join('');
  }

  function renderWrong() {
    const el = $('#parent-wrong');
    if (!el) return;
    const counts = {};
    state.wrongBook.forEach(w => {
      const k = w.subject || 'other';
      counts[k] = (counts[k] || 0) + 1;
    });
    const rows = Object.values(Game.SUBJECTS).map(sub => {
      const n = counts[sub.key] || 0;
      delete counts[sub.key];
      return { name: sub.name, icon: sub.icon, color: sub.color, n };
    });
    const extra = Object.keys(counts).reduce((n, k) => n + counts[k], 0);
    if (extra) rows.push({ name: '其他', icon: '📘', color: '#9aa6b2', n: extra });
    const due = dueCount();
    el.innerHTML = rows.map(r =>
      `<span class="wrong-pill" style="--c:${r.color}">${Art.em(r.icon)} ${r.name} <b>${r.n}</b></span>`
    ).join('') + `<p class="wrong-tip">今天有 ${due} 道错题到复习时间${due ? '，建议先做一轮复习' : ''}。</p>`;
  }

  function renderGoal() {
    const el = $('#goal-row');
    if (!el) return;
    const goal = state.parent.goal;
    const h = historyToday();
    const done = Math.min(goal, h.correct || 0);
    el.innerHTML = `
      <button class="btn btn-ghost btn-sm" type="button" data-goal="-5" ${goal <= 5 ? 'disabled' : ''}>−</button>
      <span class="goal-num">每天 <b>${goal}</b> 题</span>
      <button class="btn btn-ghost btn-sm" type="button" data-goal="5" ${goal >= 50 ? 'disabled' : ''}>+</button>
      <span class="goal-progress">今天 ${done}/${goal}</span>`;
  }

  function renderAdvice() {
    const el = $('#parent-advice');
    if (!el) return;
    const lines = [];
    const subs = Object.values(Game.SUBJECTS);
    const untried = subs.filter(sub => {
      const d = state.stats.bySubject[sub.key];
      return !d || !d.total;
    });
    if (untried.length) lines.push('还没有练习过：' + untried.map(s => s.name).join('、') + '，可以从最简单的关卡开始。');
    subs.forEach(sub => {
      const d = state.stats.bySubject[sub.key];
      if (d && d.total >= 10) {
        const pct = Math.round(d.correct / d.total * 100);
        if (pct < 70) lines.push(sub.name + '正确率 ' + pct + '%，建议放慢速度、多做错题复习。');
      }
    });
    const due = dueCount();
    if (due) lines.push('错题本有 ' + due + ' 道题到了复习时间，复习能明显提升记忆效果。');
    if (!lines.length) lines.push('各科练习比较均衡，继续保持每天固定的学习节奏就很好。');
    el.innerHTML = lines.map(t => '· ' + t).join('<br>');
  }

  function download(name, text, type) {
    const blob = new Blob([text], { type: type || 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  }

  function exportWeekly() {
    const days = last7Days();
    const sum = days.reduce((o, d) => {
      o.correct += d.correct;
      o.total += d.total;
      o.seconds += d.seconds;
      return o;
    }, { correct: 0, total: 0, seconds: 0 });
    const rate = sum.total ? Math.round(sum.correct / sum.total * 100) : 0;
    const rows = days.map(d => `<tr><td>${d.key}</td><td>${d.correct}/${d.total}</td>
      <td>${d.total ? Math.round(d.correct / d.total * 100) + '%' : '—'}</td>
      <td>${Math.round(d.seconds / 60)} 分钟</td></tr>`).join('');
    const subs = Object.values(Game.SUBJECTS).map(sub => {
      const d = state.stats.bySubject[sub.key] || { correct: 0, total: 0 };
      const pct = d.total ? Math.round(d.correct / d.total * 100) : 0;
      return `<tr><td>${sub.name}</td><td>${d.correct}/${d.total}</td><td>${d.total ? pct + '%' : '—'}</td></tr>`;
    }).join('');
    const html = `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8">
<title>小龙猫周报</title><style>
body{font-family:"PingFang SC","Microsoft YaHei",sans-serif;background:#fbf7ea;color:#3b4a45;padding:28px;line-height:1.7}
h1{font-size:22px;margin:0 0 6px}h2{font-size:16px;margin:24px 0 8px;color:#2f7d5d}
table{border-collapse:collapse;width:100%;max-width:640px;background:#fff;border-radius:10px;overflow:hidden}
th,td{padding:8px 12px;border-bottom:1px solid #eee;text-align:left;font-size:14px}
th{background:#eef6f0}.meta{color:#7a8a83;font-size:13px}
.card{display:inline-block;background:#fff;border-radius:12px;padding:12px 18px;margin:0 12px 12px 0}
.card b{font-size:20px;color:#2f7d5d;display:block}
</style></head><body>
<h1>小龙猫周报 · ${dateKey(0)}</h1>
<p class="meta">统计区间：${days[0].key} 至 ${days[6].key}</p>
<div><div class="card"><b>${sum.correct}</b>答对题数</div>
<div class="card"><b>${rate}%</b>正确率</div>
<div class="card"><b>${Math.round(sum.seconds / 60)}</b>学习分钟</div>
<div class="card"><b>${state.stats.streak}</b>连续天数</div></div>
<h2>每天表现</h2><table><tr><th>日期</th><th>答对/总数</th><th>正确率</th><th>学习时长</th></tr>${rows}</table>
<h2>各科掌握度</h2><table><tr><th>科目</th><th>答对/总数</th><th>正确率</th></tr>${subs}</table>
<h2>待关注</h2><p>错题本共 ${state.wrongBook.length} 道，其中今天该复习 ${dueCount()} 道。</p>
</body></html>`;
    download('小龙猫周报-' + dateKey(0) + '.html', html, 'text/html;charset=utf-8');
    toast('周报已导出，可用浏览器打开');
  }

  function restoreSave() {
    if (!SaveStore.restoreBackup()) return toast('没有可用的备份存档');
    state = SaveStore.load(normalizeState);
    ensureDaily();
    applySettings();
    renderSubjects();
    refreshHome();
    refreshBadges();
    refreshRoom();
    refreshParent();
    toast('已恢复到上一次存档');
    AudioFX.levelUp();
  }

  function refreshParent() {
    const s = state.stats;
    const rate = s.total ? Math.round(s.correct / s.total * 100) : 0;
    $('#parent-summary').innerHTML = `
      <div class="sum-item"><b>${s.games}</b><span>完成局数</span></div>
      <div class="sum-item"><b>${rate}%</b><span>总体正确率</span></div>
      <div class="sum-item"><b>${s.earned}</b><span>累计获得橡果</span></div>
      <div class="sum-item"><b>${s.streak}</b><span>连续学习天数</span></div>`;

    $('#report-list').innerHTML = Object.values(Game.SUBJECTS).map(sub => {
      const d = s.bySubject[sub.key] || { correct: 0, total: 0 };
      const pct = d.total ? Math.round(d.correct / d.total * 100) : 0;
      return `<div class="report-row">
        <div class="report-name">${Art.em(sub.icon)} ${sub.name}</div>
        <div class="report-bar"><i style="width:${pct}%;background:${sub.color}"></i></div>
        <div class="report-num">${d.correct}/${d.total}</div>
      </div>`;
    }).join('');

    const tip = $('#storage-tip');
    if (tip) {
      tip.textContent = SaveStore.isAvailable()
        ? `存档保存在本机浏览器（localStorage · schema v${SaveStore.VERSION}），当前约 ${SaveStore.usage()} 字符。更换设备或清理浏览器数据前，请先导出备份。`
        : '当前浏览器无法写入本地存档（可能处于无痕模式），本局进度不会被保存。';
    }

    $('#sw-sound').classList.toggle('on', state.settings.sound);
    $('#sw-voice').classList.toggle('on', state.settings.voice);
    const swOnline = $('#sw-online');
    if (swOnline) swOnline.classList.toggle('on', state.settings.online);

    // 在线语音优先；失败后自动回退系统语音，这里把当前实际状态告诉家长
    const vt = $('#voice-tip');
    if (vt) {
      const v = AudioFX.voiceInfo();
      const o = AudioFX.onlineInfo();
      if (!state.settings.voice) {
        vt.textContent = '语音朗读已关闭，孩子答题时不会自动发音。';
      } else if (!o.enabled) {
        vt.textContent = v.en
          ? '已关闭在线语音，使用本机系统语音包朗读。'
          : '已关闭在线语音，且本机没有英文语音包，英语发音会不标准。建议打开在线语音。';
      } else if (o.online && !o.cooling) {
        vt.textContent = '在线语音已开启：中英文都由标准音色朗读。网络不稳定时会自动改用本机语音。';
      } else if (o.online) {
        vt.textContent = '网络不稳定，部分语音暂时改用本机音色，稍后会自动重试在线语音。';
      } else {
        vt.textContent = v.en
          ? '当前设备离线，使用本机英文语音包朗读。'
          : '当前设备离线，且本机没有英文语音包，英语发音会不标准。联网后会自动恢复标准发音。';
      }
    }

    renderTrend();
    renderWrong();
    renderAdvice();
    renderGoal();

    const swTheme = $('#sw-theme');
    if (swTheme) swTheme.classList.toggle('on', state.settings.theme === 'dark');
    const swFont = $('#sw-font');
    if (swFont) swFont.classList.toggle('on', state.settings.font === 'large');
    const swMotion = $('#sw-motion');
    if (swMotion) swMotion.classList.toggle('on', state.settings.motion === 'reduce');

    const restoreBtn = $('#btn-restore');
    if (restoreBtn) restoreBtn.disabled = !SaveStore.backupInfo().some(b => b.size > 0);
  }

  function exportSave() {
    try {
      const blob = new Blob([SaveStore.exportText(state)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = '小龙猫乐园存档-' + dateKey(0) + '.json';
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
      toast('存档已导出，请妥善保存');
    } catch (e) {
      toast('导出失败，请换一个浏览器试试');
    }
  }

  function importSave(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const res = SaveStore.importText(String(reader.result || ''), normalizeState);
      if (!res.ok) return toast(res.error || '导入失败');
      state = res.state;
      SaveStore.save(state);
      applySettings();
      renderSubjects();
      refreshHome();
      refreshBadges();
      refreshRoom();
      refreshParent();
      closeModal('parent-modal');
      toast('存档导入成功');
      AudioFX.levelUp();
    };
    reader.onerror = () => toast('读取文件失败');
    reader.readAsText(file);
  }

  function applySettings() {
    AudioFX.setSound(state.settings.sound);
    AudioFX.setVoice(state.settings.voice);
    AudioFX.setOnline(state.settings.online);
    const root = document.documentElement;
    root.dataset.theme = state.settings.theme === 'dark' ? 'dark' : 'light';
    root.dataset.font = state.settings.font === 'large' ? 'large' : 'normal';
    root.dataset.motion = state.settings.motion === 'reduce' ? 'reduce' : 'auto';
    $('#btn-toggle-sound').textContent = state.settings.sound ? '🔊' : '🔇';
  }

  /* ---------- 初始化与事件 ---------- */

  function init() {
    state = SaveStore.load(normalizeState);
    ensureDaily();
    Pet.decay(state.pet);
    applySettings();
    renderSubjects();
    refreshHome();
    refreshHud();
    refreshReviewBadge();
    save();
    bind();
    setTimeout(showIntro, 520);
  }

  function bind() {
    // 导航
    document.addEventListener('click', e => {
      const pinKey = e.target.closest('[data-pin]');
      if (pinKey) { pinPress(pinKey.dataset.pin); return; }

      const goalBtn = e.target.closest('[data-goal]');
      if (goalBtn && !goalBtn.disabled) {
        state.parent.goal = num(state.parent.goal + Number(goalBtn.dataset.goal), 20, 5, 50);
        save();
        AudioFX.click();
        renderGoal();
        return;
      }

      const sub = e.target.closest('[data-subject]');
      if (sub) { AudioFX.click(); showStages(sub.dataset.subject); return; }

      const stageBtn = e.target.closest('[data-stage]');
      if (stageBtn && !stageBtn.disabled && stageBtn.dataset.stage) {
        AudioFX.click();
        Game.startStage(currentSubject, stageBtn.dataset.stage);
        return;
      }

      const lv = e.target.closest('[data-level]');
      if (lv && !lv.disabled) { playLevel(lv.dataset.level); return; }

      const br = e.target.closest('[data-branch]');
      if (br && !br.disabled) { enterBranch(br.dataset.branch); return; }

      const task = e.target.closest('[data-task]');
      if (task) { claimTask(task.dataset.task); return; }

      const nav = e.target.closest('[data-nav]');
      if (nav) { AudioFX.click(); show(nav.dataset.nav); return; }

      const careBtn = e.target.closest('[data-care]');
      if (careBtn) { care(careBtn.dataset.care); return; }

      const buyBtn = e.target.closest('[data-buy]');
      if (buyBtn && !buyBtn.disabled) {
        const [kind, id] = buyBtn.dataset.buy.split(':');
        buy(kind, id);
        return;
      }

      const inv = e.target.closest('[data-decor]');
      if (inv) { toggleDecor(inv.dataset.decor); return; }

      const closeBtn = e.target.closest('[data-close]');
      if (closeBtn) { closeModal(closeBtn.dataset.close); return; }

      const tab = e.target.closest('.tab');
      if (tab) { shopTab = tab.dataset.tab; renderShop(); AudioFX.click(); return; }

      if (e.target.closest('#home-pet')) { patPet(); return; }
    });

    $('#btn-go-home').addEventListener('click', () => {
      const inGame = $('#screen-game').classList.contains('active');
      if (inGame) Game.quit(); else show('home');
    });
    $('#btn-quit').addEventListener('click', () => Game.quit());
    $('#btn-listen').addEventListener('click', () => Game.listen());
    $('#btn-again').addEventListener('click', () => Game.replay());
    $('#btn-back-home').addEventListener('click', () => show('home'));
    $('#btn-back-map').addEventListener('click', () => {
      const info = Game.info();
      if (info && !info.levelId) showStages(info.subject);
      else show('map');
    });
    $('#btn-map-continue').addEventListener('click', () => playLevel(nextLevel().id));
    $('#btn-intro-start').addEventListener('click', closeIntro);
    $('#btn-guide-start').addEventListener('click', startGuided);

    $('#btn-shop').addEventListener('click', () => openShop('food'));
    $('#btn-room-shop').addEventListener('click', () => openShop('decor'));

    $('#btn-open-atlas').addEventListener('click', () => {
      AudioFX.click();
      Atlas.open(currentSubject, 'stages');
    });
    $('#btn-home-mini').addEventListener('click', () => {
      AudioFX.click();
      MiniGame.open();
    });
    $('#btn-story-close').addEventListener('click', closeStory);
    bindRoom();

    $('#btn-parent').addEventListener('click', openParent);

    const reviewBtn = $('#btn-review');
    if (reviewBtn) reviewBtn.addEventListener('click', () => {
      AudioFX.click();
      Game.startReview();
    });

    const weeklyBtn = $('#btn-weekly');
    if (weeklyBtn) weeklyBtn.addEventListener('click', exportWeekly);

    const restoreBtn = $('#btn-restore');
    if (restoreBtn) restoreBtn.addEventListener('click', restoreSave);

    const pinBtn = $('#btn-pin');
    if (pinBtn) pinBtn.addEventListener('click', openPinModal);
    const pinSaveBtn = $('#btn-pin-save');
    if (pinSaveBtn) pinSaveBtn.addEventListener('click', savePin);
    const pinClearBtn = $('#btn-pin-clear');
    if (pinClearBtn) pinClearBtn.addEventListener('click', clearPin);

    const confirmOk = $('#btn-confirm-ok');
    if (confirmOk) confirmOk.addEventListener('click', () => closeConfirm(true));
    const confirmCancel = $('#btn-confirm-cancel');
    if (confirmCancel) confirmCancel.addEventListener('click', () => closeConfirm(false));

    const homePet = $('#home-pet');
    if (homePet) homePet.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); patPet(); }
    });

    [['#sw-theme', 'theme', 'dark'], ['#sw-font', 'font', 'large'], ['#sw-motion', 'motion', 'reduce']].forEach(([sel, key, onVal]) => {
      const el = $(sel);
      if (!el) return;
      el.addEventListener('click', () => {
        const def = key === 'theme' ? 'light' : key === 'font' ? 'normal' : 'auto';
        state.settings[key] = state.settings[key] === onVal ? def : onVal;
        applySettings();
        save();
        refreshParent();
        AudioFX.click();
      });
    });

    $('#btn-toggle-sound').addEventListener('click', () => {
      state.settings.sound = !state.settings.sound;
      applySettings();
      save();
      toast(state.settings.sound ? '音效已开启' : '音效已关闭');
    });

    $('#sw-sound').addEventListener('click', () => {
      state.settings.sound = !state.settings.sound;
      applySettings();
      save();
      refreshParent();
      if (state.settings.sound) AudioFX.click();
    });

    $('#sw-voice').addEventListener('click', () => {
      state.settings.voice = !state.settings.voice;
      applySettings();
      save();
      refreshParent();
      if (state.settings.voice) AudioFX.speak('语音已开启', 'zh-CN');
    });

    $('#sw-online').addEventListener('click', () => {
      state.settings.online = !state.settings.online;
      applySettings();
      save();
      refreshParent();
      if (state.settings.online) AudioFX.speak('在线语音已开启', 'zh-CN');
    });

    $('#btn-export').addEventListener('click', exportSave);
    $('#btn-import').addEventListener('click', () => $('#import-file').click());
    $('#import-file').addEventListener('change', e => {
      importSave(e.target.files[0]);
      e.target.value = '';
    });

    $('#btn-reset').addEventListener('click', () => {
      if (!resetArmed) {
        resetArmed = true;
        $('#btn-reset').textContent = '再点一次确认清空';
        $('#reset-tip').textContent = '会删除全部学习记录、闯关进度和小屋收藏';
        clearTimeout(resetTimer);
        resetTimer = setTimeout(() => {
          resetArmed = false;
          $('#btn-reset').textContent = '清空学习记录';
          $('#reset-tip').textContent = '';
        }, 4000);
        return;
      }
      SaveStore.reset();
      state = defaultState();
      state.flags.intro = true;
      ensureDaily();
      save();
      resetArmed = false;
      $('#btn-reset').textContent = '清空学习记录';
      $('#reset-tip').textContent = '';
      closeModal('parent-modal');
      applySettings();
      renderSubjects();
      refreshHome();
      refreshBadges();
      refreshRoom();
      toast('学习记录已清空');
    });

    // 点击遮罩关闭弹窗（学科引导需要按按钮开始，不响应遮罩）
    $$('.modal').forEach(m => {
      m.addEventListener('click', e => {
        if (e.target !== m || m.id === 'guide-modal') return;
        if (m.id === 'confirm-modal') { closeConfirm(false); return; }
        m.classList.remove('open');
      });
    });

    // Esc 关闭最上层弹窗
    document.addEventListener('keydown', e => {
      if (e.key !== 'Escape') return;
      const open = $$('.modal').filter(m => m.classList.contains('open'));
      if (!open.length) return;
      const top = open[open.length - 1];
      if (top.id === 'confirm-modal') { closeConfirm(false); return; }
      if (top.id === 'guide-modal') return;
      top.classList.remove('open');
    });

    // 地图是响应式棋盘，窗口尺寸变化时按当前宽度重新排布
    let mapResizeTimer = 0;
    window.addEventListener('resize', () => {
      clearTimeout(mapResizeTimer);
      mapResizeTimer = setTimeout(() => {
        const mapScreen = $('#screen-map');
        if (mapScreen && mapScreen.classList.contains('active')) renderMap();
      }, 180);
    });

    // 首次交互解锁音频
    ['pointerdown', 'keydown'].forEach(t => {
      document.addEventListener(t, () => AudioFX.unlock(), { once: true });
    });
  }

  // 启动
  document.addEventListener('DOMContentLoaded', init);

  return {
    get state() { return state; },
    show, showStages, toast, markDay, finishSession, finishMini, trackAtlas,
    refreshHud, maybeGuide, confirm,
    addWrong, dueReview, reviewWrong, finishReview, finishPractice, refreshReviewBadge
  };
})();
