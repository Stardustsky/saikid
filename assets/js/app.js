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
    { id: 'geometry', icon: '🔺', name: '图形小博士', desc: '答对 15 道图形题', goal: 15, cur: s => subCorrect(s, 'geometry') },
    { id: 'lifemath', icon: '⚖️', name: '生活小管家', desc: '答对 15 道生活数学题', goal: 15, cur: s => subCorrect(s, 'lifemath') },
    { id: 'expression', icon: '💬', name: '表达小明星', desc: '答对 15 道表达题', goal: 15, cur: s => subCorrect(s, 'expression') },
    { id: 'animals', icon: '🦁', name: '动物好朋友', desc: '答对 20 道动物题', goal: 20, cur: s => subCorrect(s, 'animals') },
    { id: 'plants', icon: '🌳', name: '植物小园丁', desc: '答对 15 道植物题', goal: 15, cur: s => subCorrect(s, 'plants') },
    { id: 'weather', icon: '🌦️', name: '天气观察员', desc: '答对 15 道天气题', goal: 15, cur: s => subCorrect(s, 'weather') },
    { id: 'space', icon: '🚀', name: '太空探索者', desc: '答对 15 道太空题', goal: 15, cur: s => subCorrect(s, 'space') },
    { id: 'body', icon: '💪', name: '身体小博士', desc: '答对 15 道身体题', goal: 15, cur: s => subCorrect(s, 'body') },
    { id: 'all', icon: '🌈', name: '全能小达人', desc: '体验全部 14 个科目', goal: 14, cur: s => Object.keys(s.stats.played || {}).length },
    // 探索类
    { id: 'stage10', icon: '🎯', name: '闯关先锋', desc: '完成 10 个学习阶段', goal: 10, cur: s => Object.keys(s.stages || {}).filter(k => (s.stages[k] || {}).stars > 0).length },
    { id: 'star30', icon: '✨', name: '星星收藏家', desc: '累计收集 30 颗星', goal: 30, cur: s => {
        const mapStars = Object.values(s.map.stars || {}).reduce((n, v) => n + (Number(v) || 0), 0);
        const stageStars = Object.values(s.stages || {}).reduce((n, v) => n + (Number(v.stars) || 0), 0);
        return mapStars + stageStars;
      } },
    { id: 'atlas4', icon: '📚', name: '知识探索者', desc: '查看 4 类知识总表', goal: 4, cur: s => Object.keys(s.stats.atlas || {}).length },
    { id: 'types10', icon: '🗂️', name: '知识收集者', desc: '练到 10 个知识点', goal: 10, cur: s => Object.keys(s.mastery || {}).length },
    { id: 'types30', icon: '🧩', name: '知识拼图家', desc: '练到 30 个知识点', goal: 30, cur: s => Object.keys(s.mastery || {}).length },
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

  /* 小屋每日心愿：tag 对应装饰的 tags，any 为任意装饰，pet 为和小龙猫互动 */
  const ROOM_WISHES = [
    { id: 'pet1', tag: 'pet', need: 1, icon: '🐾', text: '和小龙猫打个招呼', say: '先来和我打个招呼吧！', reward: 6 },
    { id: 'any1', tag: 'any', need: 1, icon: '🏡', text: '在小屋里摆 1 件装饰', say: '小屋空空的，摆点什么好呢？', reward: 8 },
    { id: 'fly1', tag: 'fly', need: 1, icon: '🎈', text: '想要 1 个会飞的东西', say: '我想要一个会飞的东西！', reward: 10 },
    { id: 'fly2', tag: 'fly', need: 2, icon: '🪁', text: '想要 2 个会飞的东西', say: '两个会飞的东西，一定很好玩！', reward: 16 },
    { id: 'light1', tag: 'light', need: 1, icon: '🌟', text: '想要 1 个会发光的东西', say: '晚上黑黑的，我想要一点光。', reward: 10 },
    { id: 'light2', tag: 'light', need: 2, icon: '🏮', text: '想要 2 个亮亮的东西', say: '再来一个亮亮的，好吗？', reward: 16 },
    { id: 'nature2', tag: 'nature', need: 2, icon: '🌳', text: '想要 2 个植物朋友', say: '我想要绿色的植物朋友！', reward: 15 },
    { id: 'animal1', tag: 'animal', need: 1, icon: '🐇', text: '想和 1 只小动物作伴', say: '一个人有点孤单，想找个小动物。', reward: 10 },
    { id: 'animal2', tag: 'animal', need: 2, icon: '🦆', text: '想要 2 只小动物', say: '两只小动物在一起，一定很热闹！', reward: 16 },
    { id: 'play1', tag: 'play', need: 1, icon: '🎠', text: '想要 1 个能玩的东西', say: '有没有能一起玩的东西呀？', reward: 10 },
    { id: 'play2', tag: 'play', need: 2, icon: '🐴', text: '想要 2 个能玩的东西', say: '两个玩具，我们可以轮流玩！', reward: 16 },
    { id: 'any3', tag: 'any', need: 3, icon: '🏡', text: '想让小屋里有 3 件装饰', say: '小屋再热闹一点点吧！', reward: 14 },
    { id: 'any5', tag: 'any', need: 5, icon: '✨', text: '放 5 件装饰，让小屋满满的', say: '想让小屋变得满满的！', reward: 22 }
  ];

  const ROOM_STAR_AT = [4, 24, 44, 64, 84];
  const ROOM_STAR_NAME = ['空空的', '暖暖的', '热闹的', '闪闪的', '梦幻的', '彩虹小屋'];
  const ROOM_PERKS = [
    { star: 1, icon: '🕯️', name: '小屋亮起暖光', reward: 10 },
    { star: 2, icon: '🌸', name: '花瓣轻轻飘落', reward: 20 },
    { star: 3, icon: '✨', name: '星星眨呀眨眼', reward: 30 },
    { star: 4, icon: '🫧', name: '泡泡慢慢升起', reward: 40 },
    { star: 5, icon: '🌈', name: '彩虹挂上天空', reward: 50 }
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
    { id: 12, subject: 'hanzi', stage: 'hz-listen', name: '汉字王国', node: '👑', need: 7, kind: 'quiz' },
    // 新学科主线：接在原有主线之后，不改变老关卡的位置与解锁关系
    { id: 15, subject: 'geometry', stage: 'math-shape', name: '图形乐园', node: '🔺', need: 5, kind: 'quiz' },
    { id: 16, subject: 'lifemath', stage: 'math-sort', name: '生活数学屋', node: '⚖️', need: 5, kind: 'quiz' },
    { id: 17, subject: 'expression', stage: 'hz-stroke', name: '表达工坊', node: '💬', need: 5, kind: 'quiz' },
    { id: 18, subject: 'animals', stage: 'sci-animal-pic', name: '动物世界', node: '🦁', need: 5, kind: 'quiz' },
    { id: 19, subject: 'plants', stage: 'sci-plant-pic', name: '植物花园', node: '🌳', need: 5, kind: 'quiz' },
    { id: 20, subject: 'weather', stage: 'sci-weather-pic', name: '天气小屋', node: '☀️', need: 5, kind: 'quiz' },
    { id: 21, subject: 'space', stage: 'sci-sky', name: '星空营地', node: '🌙', need: 5, kind: 'quiz' },
    { id: 22, subject: 'body', stage: 'sci-body-part', name: '身体乐园', node: '👁️', need: 5, kind: 'quiz' }
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

  /* 每日任务：每天从任务池里轮换出 5 条，可领取橡果币 */
  const TASK_POOL = [
    { id: 'correct10', type: 'correct', icon: '✅', name: '答对 10 道题', target: 10, reward: 15 },
    { id: 'correct6', type: 'correct', icon: '✅', name: '答对 6 道题', target: 6, reward: 10 },
    { id: 'games2', type: 'games', icon: '🎮', name: '完成 2 局练习', target: 2, reward: 15 },
    { id: 'games3', type: 'games', icon: '🎮', name: '完成 3 局练习', target: 3, reward: 20 },
    { id: 'care1', type: 'care', icon: '💗', name: '照顾小龙猫 1 次', target: 1, reward: 10 },
    { id: 'care2', type: 'care', icon: '🍎', name: '照顾小龙猫 2 次', target: 2, reward: 16 },
    { id: 'review1', type: 'review', icon: '📕', name: '复习 1 道错题', target: 1, reward: 12 },
    { id: 'review2', type: 'review', icon: '📕', name: '复习 2 道错题', target: 2, reward: 18 },
    { id: 'stars3', type: 'stars', icon: '⭐', name: '收集 3 颗新星星', target: 3, reward: 20 },
    { id: 'stars5', type: 'stars', icon: '🌟', name: '收集 5 颗新星星', target: 5, reward: 28 },
    { id: 'practice1', type: 'practice', icon: '✍️', name: '完成 1 次跟读或描红', target: 1, reward: 12 },
    { id: 'practice2', type: 'practice', icon: '✍️', name: '完成 2 次跟读或描红', target: 2, reward: 18 }
  ];

  /* 按日期播种洗牌，保证同一天看到的任务不变，隔天换一批 */
  function dailyTasks() {
    const key = (state && state.daily && state.daily.date) || dateKey(0);
    let seed = 0;
    for (let i = 0; i < key.length; i++) seed = (seed * 31 + key.charCodeAt(i)) % 2147483647;
    const pool = TASK_POOL.slice();
    for (let i = pool.length - 1; i > 0; i--) {
      seed = (seed * 48271) % 2147483647;
      const j = seed % (i + 1);
      const t = pool[i];
      pool[i] = pool[j];
      pool[j] = t;
    }
    const picked = [];
    pool.forEach(t => {
      if (picked.length >= 5 || picked.some(p => p.type === t.type)) return;
      picked.push(t);
    });
    return picked;
  }

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
      pet: { level: 1, exp: 0, hunger: 80, mood: 80, clean: 80, lastCare: Date.now(), since: Date.now() },
      settings: {
        sound: true, voice: true, online: true,
        theme: 'light', font: 'normal', motion: 'auto'
      },
      parent: { pin: '1234', goal: 10, dailyLimit: 30, restEvery: 15 },
      profile: { band: '', placementDone: false, skip: {}, startedAt: 0 },
      mastery: {},
      screen: { date: '', seconds: 0, restAt: 0, limitAt: 0 },
      stats: {
        games: 0, correct: 0, total: 0, bestCombo: 0, perfectGames: 0,
        careCount: 0, streak: 0, lastPlayDate: '', played: {}, bySubject: {}, earned: 0,
        miniGames: 0, miniCorrect: 0, miniTotal: 0, molesHit: 0, atlas: {}, seconds: 0,
        miniBest: {}, stickers: [],
        dailyRun: { date: '', type: '', subject: '', stars: 0, best: 0 }
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
      petPos: { x: 50, y: 2 },
      room: { wishDate: '', wishId: '', wishDone: false, wishStreak: 0, lastDone: '', starMax: 0, doneCount: 0 },
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
    s.pet.level = Math.round(num(p.level, 1, 1, 60));
    s.pet.exp = Math.round(num(p.exp, 0, 0, 999999));
    s.pet.hunger = Math.round(num(p.hunger, 80, 0, 100));
    s.pet.mood = Math.round(num(p.mood, 80, 0, 100));
    s.pet.clean = Math.round(num(p.clean, 80, 0, 100));
    s.pet.lastCare = num(p.lastCare, Date.now(), 0, Date.now() + 86400000);
    // 陪伴起始时间：用来算「在一起第几天」，老存档从今天开始算
    s.pet.since = num(p.since, Date.now(), 0, Date.now() + 86400000);

    const st = isObj(src.settings) ? src.settings : {};
    s.settings.sound = st.sound !== false;
    s.settings.voice = st.voice !== false;
    s.settings.online = st.online !== false;
    s.settings.theme = st.theme === 'dark' ? 'dark' : 'light';
    s.settings.font = st.font === 'large' ? 'large' : 'normal';
    s.settings.motion = st.motion === 'reduce' ? 'reduce' : 'auto';

    const pn = isObj(src.parent) ? src.parent : {};
    // 旧存档没有 pin 字段时给默认密码；家长主动清除密码会存成空字符串，这里保留
    s.parent.pin = pn.pin === undefined
      ? '1234'
      : (/^\d{4}$/.test(String(pn.pin)) ? String(pn.pin) : '');
    s.parent.goal = Math.round(num(pn.goal, 10, 5, 50));
    s.parent.dailyLimit = Math.round(num(pn.dailyLimit, 30, 0, 180));
    s.parent.restEvery = Math.round(num(pn.restEvery, 15, 5, 60));

    // 孩子档案：年龄档 + 起点测评结果 + 跳关记录
    const pf = isObj(src.profile) ? src.profile : {};
    const bands = (DATA.ageBands || []).map(b => b.id);
    s.profile.band = bands.indexOf(pf.band) > -1 ? pf.band : '';
    s.profile.placementDone = pf.placementDone === true;
    s.profile.startedAt = num(pf.startedAt, 0, 0, Date.now() + 86400000);
    if (isObj(pf.skip)) {
      Object.keys(pf.skip).forEach(k => {
        if (!DATA.curriculum[k]) return;
        s.profile.skip[k] = Math.round(num(pf.skip[k], 0, 0, 99));
      });
    }

    // 知识点掌握度：键为「科目|题型」，值 0~5 级
    if (isObj(src.mastery)) {
      Object.keys(src.mastery).forEach(k => {
        if (k.indexOf('|') < 0) return;
        const v = isObj(src.mastery[k]) ? src.mastery[k] : {};
        s.mastery[k] = {
          level: Math.round(num(v.level, 0, 0, 5)),
          right: Math.round(num(v.right, 0, 0, 9999)),
          wrong: Math.round(num(v.wrong, 0, 0, 9999)),
          at: num(v.at, 0, 0, Date.now() + 86400000)
        };
      });
    }

    // 屏幕时间：按天累计秒数
    const sc = isObj(src.screen) ? src.screen : {};
    s.screen.date = typeof sc.date === 'string' ? sc.date : '';
    s.screen.seconds = Math.round(num(sc.seconds, 0, 0, 86400));
    s.screen.restAt = num(sc.restAt, 0, 0, Date.now() + 86400000);
    s.screen.limitAt = num(sc.limitAt, 0, 0, Date.now() + 86400000);
    if (s.screen.date !== dateKey(0)) {
      s.screen.date = dateKey(0);
      s.screen.seconds = 0;
      s.screen.restAt = 0;
      s.screen.limitAt = 0;
    }

    const stats = isObj(src.stats) ? src.stats : {};
    ['games', 'correct', 'total', 'bestCombo', 'perfectGames', 'careCount', 'streak', 'earned',
      'miniGames', 'miniCorrect', 'miniTotal', 'molesHit', 'seconds']
      .forEach(k => { s.stats[k] = Math.round(num(stats[k], 0, 0, 1e9)); });
    s.stats.lastPlayDate = typeof stats.lastPlayDate === 'string' ? stats.lastPlayDate : '';
    s.stats.played = isObj(stats.played) ? stats.played : {};
    s.stats.bySubject = isObj(stats.bySubject) ? stats.bySubject : {};

    // 小游戏：每款玩法的最佳连对 / 今日最佳，以及已收集的贴纸
    if (isObj(stats.miniBest)) {
      Object.keys(stats.miniBest).forEach(k => {
        if (!/^[a-z]+$/.test(k)) return;
        const v = isObj(stats.miniBest[k]) ? stats.miniBest[k] : {};
        s.stats.miniBest[k] = {
          best: Math.round(num(v.best, 0, 0, 1e5)),
          day: Math.round(num(v.day, 0, 0, 1e5)),
          date: typeof v.date === 'string' ? v.date : ''
        };
      });
    }
    if (Array.isArray(stats.stickers)) {
      stats.stickers.forEach(k => {
        if (typeof k !== 'string' || !/^[a-z]+_[a-z]+$/.test(k)) return;
        if (s.stats.stickers.indexOf(k) < 0) s.stats.stickers.push(k);
      });
    }
    if (isObj(stats.atlas)) {
      Object.keys(stats.atlas).forEach(k => {
        if (DATA.curriculum[k]) s.stats.atlas[k] = Math.round(num(stats.atlas[k], 1, 1, 1e6));
      });
    }
    // 今日挑战：当天玩法和成绩，跨天自然失效
    if (isObj(stats.dailyRun)) {
      const dr = stats.dailyRun;
      s.stats.dailyRun = {
        date: typeof dr.date === 'string' ? dr.date : '',
        type: typeof dr.type === 'string' && /^[a-z]+$/.test(dr.type) ? dr.type : '',
        subject: DATA.curriculum[dr.subject] ? dr.subject : '',
        stars: Math.round(num(dr.stars, 0, 0, 3)),
        best: Math.round(num(dr.best, 0, 0, 1e5))
      };
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
      ? daily.claimed.filter(x => TASK_POOL.some(t => t.id === x))
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

    // 小龙猫在小屋里的落脚点：x 为横向百分比，y 为距地面百分比（只让它待在地板附近）
    const pp = isObj(src.petPos) ? src.petPos : {};
    s.petPos = {
      x: Math.round(num(pp.x, 50, 8, 92)),
      y: Math.round(num(pp.y, 2, 1, 13) * 10) / 10
    };

    const badgeIds = BADGES.map(b => b.id);
    s.badges = (Array.isArray(src.badges) ? src.badges : []).filter(x => badgeIds.indexOf(x) > -1);

    // 小屋心愿：跨天后心愿作废，由 ensureRoomWish() 重新抽；星级只记录历史最高，避免反复刷奖励
    const rm = isObj(src.room) ? src.room : {};
    const todayKey = dateKey(0);
    s.room.wishDate = typeof rm.wishDate === 'string' ? rm.wishDate : '';
    s.room.wishId = s.room.wishDate === todayKey && ROOM_WISHES.some(w => w.id === rm.wishId) ? rm.wishId : '';
    s.room.wishDone = s.room.wishDate === todayKey && rm.wishDone === true;
    s.room.wishStreak = Math.round(num(rm.wishStreak, 0, 0, 9999));
    s.room.lastDone = typeof rm.lastDone === 'string' ? rm.lastDone : '';
    s.room.starMax = Math.round(num(rm.starMax, 0, 0, 5));
    s.room.doneCount = Math.round(num(rm.doneCount, 0, 0, 99999));

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
    while (p.exp >= Pet.needExp(p.level) && p.level < 60) {
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

  let activeScreen = 'home';

  function show(name) {
    const prev = activeScreen;
    // 离开家长中心就重新上锁，避免孩子直接翻回来看到学习数据
    if (name !== 'parent' && activeScreen === 'parent') {
      parentUnlocked = false;
      pinBuffer = '';
    }
    activeScreen = name;
    $$('.screen').forEach(s => s.classList.toggle('active', s.id === 'screen-' + name));
    if (name !== 'game') AudioFX.stopSpeak();
    if (name === 'home') {
      ensureDaily();
      refreshHome();
      // 回到首页时把小龙猫的问候读出来，低龄孩子不识字也能听懂
      if (prev !== 'home') {
        const line = $('#pet-speech');
        if (line) AudioFX.speakCat(line.textContent, { soft: true });
      }
    }
    if (name === 'stages') renderStages();
    if (name === 'room') { refreshRoom(); roomBrainStart(1600); }
    else if (prev === 'room') roomBrainStop();
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
    refreshPetSpeech();
    renderTasks();
    renderPlacementCard();
    refreshMapBanner();
    refreshReviewBadge();
    refreshHud();
  }

  /* ---------- 首页：起点测评 / 当前难度 ---------- */

  function renderPlacementCard() {
    const box = $('#placement-card');
    if (!box) return;
    const band = bandInfo();
    const done = state.profile && state.profile.placementDone;
    const minutes = Math.round((state.screen.seconds || 0) / 60);
    const limit = state.parent.dailyLimit || 0;
    const screenTxt = limit > 0 ? `今天已玩 ${minutes}/${limit} 分钟` : '';

    if (!done) {
      box.className = 'placement-card new';
      box.innerHTML = `
        <div class="pl-head"><b>🎯 3 分钟小测评</b><small>先选对难度</small></div>
        <p class="pl-desc">做 9 道小题，帮孩子找到合适的难度，还能顺手解锁对应关卡。</p>
        <button class="btn btn-green btn-sm" type="button" id="btn-placement">开始测评</button>`;
    } else {
      box.className = 'placement-card done';
      box.innerHTML = `
        <div class="pl-head"><b>${band ? Art.em(band.icon) : '🎯'} ${band ? band.name : '难度待定'}</b><small>当前难度</small></div>
        <p class="pl-desc">${band ? band.desc : '还没有选择难度档位'}${screenTxt ? ' · ' + screenTxt : ''}</p>
        <button class="btn btn-ghost btn-sm" type="button" id="btn-placement">重新测一次</button>`;
    }
  }

  /* ---------- 屏幕时间：每日上限 + 护眼提醒 ---------- */

  let screenTimer = 0;
  let restLock = false;
  let restCountdown = 0;

  function resetScreenDay() {
    const today = dateKey(0);
    if (!isObj(state.screen)) state.screen = { date: today, seconds: 0, restAt: 0, limitAt: 0 };
    if (state.screen.date !== today) {
      state.screen.date = today;
      state.screen.seconds = 0;
      state.screen.restAt = 0;
      state.screen.limitAt = 0;
    }
  }

  function screenLimitSec() {
    return Math.max(0, Number(state.parent.dailyLimit) || 0) * 60;
  }

  function minutesToday() {
    resetScreenDay();
    return Math.round(state.screen.seconds / 60);
  }

  /* 今日时长是否已到上限（家长把上限设为 0 表示不限时） */
  function screenBlocked() {
    const limit = screenLimitSec();
    if (limit <= 0) return false;
    resetScreenDay();
    return state.screen.seconds >= limit;
  }

  function startScreenClock() {
    clearInterval(screenTimer);
    screenTimer = setInterval(screenTick, 5000);
  }

  function screenTick() {
    if (document.hidden || restLock) return;
    if (activeScreen === 'parent') return;
    resetScreenDay();
    state.screen.seconds += 5;
    if (state.screen.seconds % 60 === 0) save();

    const limit = screenLimitSec();
    const every = Math.max(0, Number(state.parent.restEvery) || 0) * 60;
    if (limit > 0 && state.screen.seconds >= limit) {
      if (!state.screen.limitAt) {
        state.screen.limitAt = Date.now();
        save();
        openRest('limit');
      } else if (!restLock && (activeScreen === 'game' || activeScreen === 'mini')) {
        // 已经提示过上限，但仍停留在答题/小游戏界面时继续拦截
        openRest('limit');
      }
      return;
    }
    if (every > 0 && state.screen.seconds - (state.screen.restAt || 0) >= every) {
      state.screen.restAt = state.screen.seconds;
      save();
      openRest('eyes');
    }
  }

  function openRest(kind) {
    const modal = $('#rest-modal');
    if (!modal) return;
    restLock = true;
    clearInterval(restCountdown);
    const limitKind = kind === 'limit';
    const title = $('#rest-title');
    const text = $('#rest-text');
    const left = $('#rest-left');
    const ok = $('#btn-rest-ok');
    if (title) title.textContent = limitKind ? '今天的屏幕时间用完啦' : '休息一下小眼睛';
    if (text) {
      text.textContent = limitKind
        ? '先保存好今天的成绩吧。爸爸妈妈可以在家长中心调整每日时长，调高后就能继续玩啦～'
        : '站起来动一动，看看窗外的远处，眨眨眼睛，等一下再回来～';
    }
    const petBox = $('#rest-pet');
    if (petBox) petBox.innerHTML = Pet.svg(state.pet.level, state.pet.mood);
    modal.classList.add('show');

    if (limitKind) {
      if (left) left.textContent = '';
      if (ok) { ok.disabled = false; ok.textContent = '好的，先休息'; }
    } else {
      let n = 20;
      if (left) left.textContent = n + ' 秒';
      if (ok) { ok.disabled = true; ok.textContent = '休息中…'; }
      restCountdown = setInterval(() => {
        n--;
        if (left) left.textContent = Math.max(0, n) + ' 秒';
        if (n <= 0) {
          clearInterval(restCountdown);
          if (ok) { ok.disabled = false; ok.textContent = '继续学习'; }
        }
      }, 1000);
    }
  }

  function closeRest() {
    const modal = $('#rest-modal');
    if (modal) modal.classList.remove('show');
    clearInterval(restCountdown);
    restLock = false;
    renderPlacementCard();
  }

  function petReact(cls, ms) {
    const el = document.querySelector('#home-pet .pet-wrap');
    if (!el) return;
    el.classList.remove(cls);
    void el.offsetWidth;
    el.classList.add(cls);
    setTimeout(() => el.classList.remove(cls), ms || 900);
  }

  // 台词上下文：时段、金币、连续天数、等级，让小龙猫说的话更贴合当下
  function petContext() {
    return {
      hour: new Date().getHours(),
      coins: state.coins,
      streak: state.stats.streak,
      level: state.pet.level
    };
  }

  function refreshPetSpeech() {
    const el = $('#pet-speech');
    if (el) el.textContent = Pet.speakLine(state.pet, petContext());
  }

  // 首页停留时偶尔换一句话：间隔拉长一些，别让孩子觉得小龙猫一直在说话
  let speechTimer = 0;
  function startSpeechLoop() {
    clearInterval(speechTimer);
    speechTimer = setInterval(() => {
      if (activeScreen === 'home' && !document.hidden) {
        refreshPetSpeech();
        // 换一句话时也读出来，不认识字的孩子才知道小龙猫在说什么
        const line = $('#pet-speech');
        if (line) {
          line.classList.remove('say-pop');
          void line.offsetWidth;
          line.classList.add('say-pop');
          setTimeout(() => line.classList.remove('say-pop'), 700);
          AudioFX.speakCat(line.textContent, { soft: true });
        }
        petReact('react-talk', 1600);
      }
    }, 180000);
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
    const list = dailyTasks();
    let done = 0;

    box.innerHTML = list.map(t => {
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
    if (all) all.textContent = done + '/' + list.length;
    const card = $('#daily-card');
    if (card) card.classList.toggle('all-done', done === list.length);
  }

  function claimTask(id) {
    ensureDaily();
    const t = dailyTasks().find(x => x.id === id);
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
    const skip = state && state.profile ? state.profile.skip[subjectKey] : 0;
    if (typeof skip === 'number' && index <= skip) return true;
    const stages = DATA.curriculum[subjectKey].stages;
    return stageInfo(stages[index - 1].id).stars > 0;
  }

  /* ---------- 年龄档 / 掌握度 / 起点与跳关 ---------- */

  function bandInfo() {
    const list = DATA.ageBands || [];
    const id = state && state.profile ? state.profile.band : '';
    return list.find(b => b.id === id) || null;
  }

  /* 最近 20 次作答的准确率，用来微调难度 */
  function recentAccuracy(subjectKey) {
    if (!state || !subjectKey) return null;
    const list = (state.answers || []).filter(a => a.subject === subjectKey).slice(-20);
    if (list.length < 4) return null;
    return list.filter(a => a.ok).length / list.length;
  }

  function masteryKey(subject, type) {
    return subject + '|' + type;
  }

  function noteMastery(subject, type, ok) {
    if (!state || !subject || !type || subject === 'placement') return;
    const key = masteryKey(subject, type);
    const m = state.mastery[key] || { level: 0, right: 0, wrong: 0, at: 0 };
    if (ok) {
      m.right++;
      if (m.right % 2 === 0) m.level = Math.min(5, m.level + 1);
    } else {
      m.wrong++;
      m.level = Math.max(0, m.level - 1);
    }
    m.at = Date.now();
    state.mastery[key] = m;
  }

  function masteryLevel(subject, type) {
    const m = state && state.mastery[masteryKey(subject, type)];
    return m ? m.level : 0;
  }

  /* 薄弱知识点：出过错、掌握等级低，并能找到对应已解锁阶段的，优先推荐 */
  function weakPoints(limit) {
    const n = Math.max(1, limit || 3);
    if (!state || !state.mastery) return [];
    const rows = Object.keys(state.mastery).map(k => {
      const parts = k.split('|');
      const m = state.mastery[k] || {};
      return {
        subject: parts[0], type: parts[1],
        level: Number(m.level) || 0,
        wrong: Number(m.wrong) || 0,
        tries: (Number(m.right) || 0) + (Number(m.wrong) || 0)
      };
    }).filter(r => r.wrong > 0 && r.level < 4 && DATA.curriculum[r.subject])
      .sort((a, b) => a.level - b.level || b.wrong - a.wrong || b.tries - a.tries);

    const out = [];
    rows.forEach(r => {
      if (out.length >= n) return;
      const stages = DATA.curriculum[r.subject].stages;
      let stage = null;
      stages.forEach((s, i) => {
        if (!Array.isArray(s.qtypes) || s.qtypes.indexOf(r.type) < 0) return;
        if (stageUnlocked(r.subject, i)) stage = s;
      });
      if (!stage) return;
      if (out.some(o => o.stageId === stage.id)) return;
      out.push({ subject: r.subject, type: r.type, stageId: stage.id, stageName: stage.name, level: r.level });
    });
    return out;
  }

  /* 知识图鉴：统计每个学科接触过的题型（知识点）数量 */
  function subjectTypes(subjectKey) {
    const c = DATA.curriculum[subjectKey];
    if (!c) return [];
    const list = [];
    c.stages.forEach(s => (s.qtypes || []).forEach(t => {
      if (list.indexOf(t) < 0) list.push(t);
    }));
    return list;
  }

  function knowledgeProgress(subjectKey) {
    const types = subjectTypes(subjectKey);
    const got = types.filter(t => {
      const m = state.mastery[masteryKey(subjectKey, t)];
      return m && (Number(m.right) || 0) + (Number(m.wrong) || 0) > 0;
    }).length;
    return { got, total: types.length };
  }

  /* 直接解锁到某个阶段序号（用于起点测评与跳关） */
  function unlockUpTo(subjectKey, index) {
    if (!state || !DATA.curriculum[subjectKey]) return 0;
    const stages = DATA.curriculum[subjectKey].stages;
    const n = Math.max(0, Math.min(stages.length - 1, Math.round(index)));
    if (n <= 0) return 0;
    const prev = state.profile.skip[subjectKey] || 0;
    if (n > prev) {
      state.profile.skip[subjectKey] = n;
      return n;
    }
    return 0;
  }

  function applyPlacement(r) {
    const total = Math.max(1, Number(r.total) || 1);
    const acc = Math.max(0, Math.min(1, (Number(r.correct) || 0) / total));
    const list = DATA.ageBands || [];
    const band = acc >= 0.8 ? list[2] : acc >= 0.45 ? list[1] : list[0];
    state.profile.band = band ? band.id : '';
    state.profile.placementDone = true;
    if (!state.profile.startedAt) state.profile.startedAt = Date.now();

    const unlock = acc >= 0.8 ? 2 : acc >= 0.45 ? 1 : 0;
    if (unlock > 0) {
      Object.keys(DATA.curriculum).forEach(k => unlockUpTo(k, unlock));
    }

    const coins = 12 + Math.round(acc * 12);
    const exp = 10 + Math.round(acc * 10);
    state.coins += coins;
    const ups = addExp(exp);
    state.stats.games++;
    bumpDaily('games', 1);
    save();
    refreshHud();
    refreshHome();
    renderSubjects();
    if (ups) checkBadges();

    return {
      bandId: band ? band.id : '',
      bandName: band ? band.name : '',
      unlocked: unlock,
      coins,
      exp
    };
  }

  function applySkipTest(r) {
    const subject = r.subject;
    const stages = DATA.curriculum[subject] ? DATA.curriculum[subject].stages : null;
    const idx = stages ? stages.findIndex(s => s.id === r.stageId) : -1;
    const total = Math.max(1, Number(r.total) || 1);
    const need = Math.ceil(total * 0.8);
    const correct = Math.max(0, Number(r.correct) || 0);
    const passed = idx > 0 && correct >= need;

    if (passed) {
      // 解锁到这一关，相当于把前面几关标记为已通过起点
      unlockUpTo(subject, idx);
    }

    const coins = passed ? 16 : 4;
    const exp = passed ? 12 : 4;
    state.coins += coins;
    addExp(exp);
    save();
    refreshHud();

    return {
      passed,
      need,
      unlockedTo: passed ? idx : 0,
      stageName: idx > -1 ? stages[idx].name : '',
      coins,
      exp
    };
  }

  function subjectProgress(key) {
    const stages = DATA.curriculum[key].stages;
    const done = stages.filter(s => stageInfo(s.id).stars > 0).length;
    const stars = stages.reduce((n, s) => n + stageInfo(s.id).stars, 0);
    return { done, total: stages.length, stars, maxStars: stages.length * 3 };
  }

  // 首页大模块：按 DATA.subjectGroups 合并展示，未分组的学科自动单独成组
  function subjectGroups() {
    const groups = (DATA.subjectGroups || []).map(g => ({
      key: g.key,
      name: g.name,
      icon: g.icon,
      color: g.color,
      tag: g.tag,
      subjects: (g.subjects || []).filter(k => DATA.curriculum[k])
    })).filter(g => g.subjects.length);

    const used = new Set();
    groups.forEach(g => g.subjects.forEach(k => used.add(k)));
    Object.keys(DATA.curriculum).forEach(k => {
      if (used.has(k)) return;
      const c = DATA.curriculum[k];
      groups.push({ key: k, name: c.name, icon: c.icon, color: c.color, tag: c.tag, subjects: [k] });
    });
    return groups;
  }

  function groupOf(subjectKey) {
    return subjectGroups().find(g => g.subjects.indexOf(subjectKey) >= 0) || null;
  }

  function groupProgress(subjects) {
    return subjects.reduce((acc, k) => {
      const p = subjectProgress(k);
      acc.done += p.done;
      acc.total += p.total;
      acc.stars += p.stars;
      acc.maxStars += p.maxStars;
      return acc;
    }, { done: 0, total: 0, stars: 0, maxStars: 0 });
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

    // 同一大模块下的子模块用标签切换（数字乐园 / 算术工坊……）
    const hero = $('#stage-hero');
    if (hero) hero.style.setProperty('--c', c.color);
    const tabs = $('#subject-tabs');
    if (tabs) {
      const grp = groupOf(currentSubject);
      const list = grp ? grp.subjects : [];
      tabs.style.display = list.length > 1 ? '' : 'none';
      tabs.innerHTML = list.length > 1 ? list.map(k => {
        const s = Game.SUBJECTS[k];
        const on = k === currentSubject;
        return `<button class="subject-tab${on ? ' active' : ''}" type="button"
          data-subject-tab="${k}" aria-pressed="${on}" style="--c:${s.color}">
          ${Art.em(s.icon)}<span>${s.name}</span></button>`;
      }).join('') : '';
    }

    box.innerHTML = c.stages.map((st, i) => {
      const inf = stageInfo(st.id);
      const unlocked = stageUnlocked(currentSubject, i);
      const isNext = nxt.id === st.id && unlocked;
      const card = `<button class="stage-card ${unlocked ? '' : 'locked'} ${inf.stars ? 'done' : ''} ${isNext ? 'next' : ''}"
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
      // 已经会了的小朋友可以挑战跳关：答对 80% 直接把这一关解锁
      const skip = !unlocked && i > 0
        ? `<button class="stage-skip" type="button" data-skip="${st.id}">🔓 我会这一关，挑战跳关</button>`
        : '';
      return `<div class="stage-item">${card}${skip}</div>`;
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
    grid.innerHTML = subjectGroups().map(g => {
      const prog = groupProgress(g.subjects);
      const subs = g.subjects.map(k => Game.SUBJECTS[k]);
      // 回到首页时，优先回到这个模块上次进入的子模块
      const entry = g.subjects.indexOf(currentSubject) >= 0 ? currentSubject : g.subjects[0];
      const pct = prog.total ? Math.round(prog.done / prog.total * 100) : 0;
      return `<button class="subject-card" data-subject="${entry}" style="--c:${g.color}" aria-label="${g.name}：${subs.map(s => s.name).join('、')}">
        <span class="subject-icon">${Art.em(g.icon)}</span>
        <span class="subject-body">
          <span class="subject-name">${g.name}</span>
          <span class="subject-track"><i style="width:${pct}%"></i></span>
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
      AudioFX.petEat();
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
      AudioFX.petBath();
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
      AudioFX.petPlay();
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
    return true;
  }

  function newBadgeCheck() {
    checkBadges();
    refreshHud();
  }

  const POKE_ANIMS = ['react-happy', 'react-spin', 'react-wiggle', 'react-squish', 'react-jump', 'react-dance', 'react-tilt'];
  let pokeIndex = 0;

  function patPet() {
    const now = Date.now();
    state.pet.mood = Pet.clamp(state.pet.mood + 1);
    state.pet.lastCare = now;
    if (now - patAt > 1600) {
      patAt = now;
      // 每次点击轮换一种动画，避免永远是同一个动作
      petReact(POKE_ANIMS[pokeIndex++ % POKE_ANIMS.length]);
      AudioFX.petVoice(Pet.form(state.pet.level));
      const line = Pet.patLine();
      const bubble = $('#pet-speech');
      bubble.textContent = line;
      bubble.classList.remove('say-pop');
      void bubble.offsetWidth;
      bubble.classList.add('say-pop');
      setTimeout(() => bubble.classList.remove('say-pop'), 700);
      AudioFX.speakCat(line, { force: true });
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
        if (!isObj(a)) return;
        pushAnswer(subj, a.type, a.answer, a.chosen, a.ok);
        noteMastery(subj, a.type, a.ok === true);
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
  function finishMini({ type, subject, correct, total, stars, seconds, bestCombo, levelId, branchId, luckyCoins, daily }) {
    ensureDaily();
    markDay();

    const c = Math.max(0, Math.round(Number(correct) || 0));
    const t = Math.max(c, Math.round(Number(total) || 0));
    const secs = estSeconds(seconds, t);
    const acc = accuracyFactor(c, t);
    const lucky = Math.max(0, Math.round(Number(luckyCoins) || 0));
    const coins = Math.round((c * 2 + (stars === 3 ? 12 : 0)) * acc * repeatFactor() * petBonus()) + lucky;
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

    // 连对纪录：每款玩法独立，今日最佳按日期重置
    const combo = Math.max(0, Math.round(Number(bestCombo) || 0));
    const prev = isObj(s.miniBest[type]) ? s.miniBest[type] : {};
    const prevBest = Math.round(Number(prev.best) || 0);
    const todayKey = dateKey(0);
    const day = prev.date === todayKey ? Math.max(Math.round(Number(prev.day) || 0), combo) : combo;
    s.miniBest[type] = { best: Math.max(prevBest, combo), day, date: todayKey };
    const bestNew = combo > prevBest;

    // 贴纸：玩法 × 当前知识，每玩完一局点亮一枚（混合挑战单独一套）
    const stickerId = type + '_' + (subject === 'mix' ? 'mix' : DATA.curriculum[subject] ? subject : 'numbers');
    const stickerNew = s.stickers.indexOf(stickerId) < 0;
    if (stickerNew) s.stickers.push(stickerId);

    // 今日挑战：只在当天第一次完成时发奖励，之后只刷新纪录
    let dailyBonus = 0;
    if (daily) {
      const dr = isObj(s.dailyRun) ? s.dailyRun : {};
      const day = dateKey(0);
      const first = dr.date !== day;
      const comboDay = Math.max(0, Math.round(Number(bestCombo) || 0));
      s.dailyRun = {
        date: day,
        type,
        subject: subject === 'mix' ? 'mix' : DATA.curriculum[subject] ? subject : 'numbers',
        stars: first ? stars : Math.max(Math.round(Number(dr.stars) || 0), stars),
        best: first ? comboDay : Math.max(Math.round(Number(dr.best) || 0), comboDay)
      };
      if (first) {
        dailyBonus = 15;
        state.coins += dailyBonus;
        s.earned += dailyBonus;
      }
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

    return { coins, exp, leveledUp: ups > 0, level, branchCoins, best: s.miniBest[type].best, bestNew, day, stickerNew, sticker: stickerId, luckyCoins: lucky, dailyBonus };
  }

  /* ---------- 错题本与间隔重复 ----------
     首次入本立刻到期，之后按错误次数 1 / 3 / 7 天拉开，连续答对两次才移出。 */

  const REVIEW_GAPS = [1, 3, 7, 14];
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
      // 该知识点已经掌握（等级 ≥ 4）就不再占用复习时间
      .filter(w => masteryLevel(w.subject, w.type) < 4)
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
    if (id === 'room-modal') roomBrainResume(700);
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
      AudioFX.petEat();
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
  let roomPopTimer = null;

  /* 小屋自主行为：定时器、暂停点、拖动状态 */
  let roomBrainTimer = 0;
  let roomStepTimer = 0;
  let roomActTimer = 0;
  let roomEmoteTimer = 0;
  let roomExprTimer = 0;
  let roomLandTimer = 0;
  let roomWalkTimer = 0;
  let roomBrainPause = 0;
  let roomDragging = false;

  /* 主动推荐：冷却时间与当前气泡上的按钮动作 */
  const ROOM_TIP_GAP = 150000;
  let roomTipAt = Date.now();
  let roomTipAction = null;

  function decorPos(id, i) {
    const saved = state.decorPos[id];
    if (saved) return saved;
    const slot = DECOR_SLOTS[i % DECOR_SLOTS.length];
    return { x: slot.x, y: slot.y };
  }

  /* 装饰实际站在哪里：没拖动过就用默认槽位，和画面保持一致 */
  function decorRoomPos(id) {
    const i = state.decor.indexOf(id);
    if (i < 0) return null;
    return decorPos(id, i);
  }

  function decorById(id) {
    return DATA.shop.decor.find(x => x.id === id) || null;
  }

  function ownedDecor() {
    return DATA.shop.decor.filter(x => state.owned.indexOf(x.id) > -1);
  }

  /* 已摆放装饰里带某个标签的数量；any 表示全部 */
  function placedTagCount(tag) {
    if (tag === 'any') return state.decor.length;
    return state.decor.filter(id => {
      const it = decorById(id);
      return !!it && (it.tags || []).indexOf(tag) > -1;
    }).length;
  }

  /* 已拥有装饰里带某个标签的数量，用来保证抽到的心愿今天做得完 */
  function ownTagCount(tag) {
    if (tag === 'any') return ownedDecor().length;
    return ownedDecor().filter(it => (it.tags || []).indexOf(tag) > -1).length;
  }

  function roomWishById(id) {
    return ROOM_WISHES.find(w => w.id === id) || null;
  }

  /* 按日期固定抽一条心愿：优先还没满足的，避免天天重复同一类 */
  function todayWishId() {
    const pool = ROOM_WISHES.filter(w => w.tag === 'pet' || ownTagCount(w.tag) >= w.need);
    const todo = pool.filter(w => placedTagCount(w.tag) < w.need);
    const list = todo.length ? todo : pool;
    const key = dateKey(0);
    let h = 0;
    for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) % 100003;
    return list[h % list.length].id;
  }

  function ensureRoomWish() {
    const today = dateKey(0);
    const cur = roomWishById(state.room.wishId);
    if (state.room.wishDate !== today || !cur) {
      state.room.wishDate = today;
      state.room.wishId = todayWishId();
      state.room.wishDone = false;
      save();
    }
    return roomWishById(state.room.wishId);
  }

  function wishProgress(w) {
    if (w.tag === 'pet') return state.room.wishDone ? w.need : 0;
    return Math.min(w.need, placedTagCount(w.tag));
  }

  /* 舒适度：装饰数量 + 种类覆盖 + 换非默认背景 */
  function comfortInfo() {
    const placed = state.decor.length;
    const kinds = {};
    state.decor.forEach(id => {
      const it = decorById(id);
      (it && it.tags ? it.tags : []).forEach(t => { kinds[t] = 1; });
    });
    const tagKinds = Object.keys(kinds).length;
    const bgBonus = state.bg !== 'meadow' ? 10 : 0;
    const score = Math.min(100, placed * 4 + tagKinds * 7 + bgBonus);
    const stars = ROOM_STAR_AT.filter(t => score >= t).length;
    return {
      placed, tagKinds, bgBonus, score, stars,
      name: ROOM_STAR_NAME[stars],
      next: stars < 5 ? ROOM_STAR_AT[stars] : 100
    };
  }

  function checkRoomWish() {
    const w = ensureRoomWish();
    if (!w || state.room.wishDone) return false;
    if (wishProgress(w) < w.need) return false;
    completeRoomWish(w);
    return true;
  }

  function completeRoomWish(w) {
    if (state.room.wishDone) return;
    const prevDone = state.room.lastDone;
    state.room.wishDone = true;
    state.room.lastDone = dateKey(0);
    state.room.doneCount++;
    state.room.wishStreak = prevDone === dateKey(-1) ? state.room.wishStreak + 1 : 1;
    let coins = w.reward;
    if (state.room.wishStreak >= 3 && state.room.wishStreak % 3 === 0) coins += 10;
    state.coins += coins;
    state.stats.earned += coins;
    state.pet.mood = Pet.clamp(state.pet.mood + 3);
    save();
    roomCelebrate(w, coins);
    checkBadges();
  }

  /* 一次性撒花：独立图层，不会和星级氛围层互相覆盖 */
  function roomBurst() {
    const layer = $('#room-burst');
    if (!layer) return;
    const faces = ['🎉', '⭐', '✨', '🌟'];
    layer.innerHTML = '';
    for (let i = 0; i < 10; i++) {
      const s = document.createElement('span');
      s.textContent = faces[i % faces.length];
      s.style.setProperty('--bx', (Math.random() * 170 - 85) + 'px');
      s.style.setProperty('--by', (-40 - Math.random() * 100) + 'px');
      s.style.animationDelay = (i * 40) + 'ms';
      layer.appendChild(s);
      setTimeout(() => s.remove(), 1800);
    }
  }

  function roomCelebrate(w, coins) {
    AudioFX.levelUp();
    AudioFX.speakCat('心愿实现啦，谢谢你！', { soft: true });
    const pop = $('#room-wish-pop');
    if (pop) {
      pop.innerHTML = `<span class="rwp-ico">${Art.em(w.icon)}</span>
        <b class="rwp-txt">心愿实现！</b>
        <span class="rwp-coin">+${coins} 🌰</span>`;
      pop.classList.add('show');
      clearTimeout(roomPopTimer);
      roomPopTimer = setTimeout(() => pop.classList.remove('show'), 2600);
    }
    roomBurst();
    toast('心愿实现啦！获得 ' + coins + ' 颗橡果', 2600);
  }

  /* 升星奖励只补发新增的星级，历史最高记录在 state.room.starMax */
  function checkRoomStar(delay) {
    const info = comfortInfo();
    if (info.stars <= state.room.starMax) return;
    const from = state.room.starMax;
    let coins = 0;
    ROOM_PERKS.forEach(p => { if (p.star > from && p.star <= info.stars) coins += p.reward; });
    state.room.starMax = info.stars;
    state.coins += coins;
    state.stats.earned += coins;
    save();
    const perk = ROOM_PERKS[info.stars - 1];
    setTimeout(() => {
      if (!perk) return;
      AudioFX.levelUp();
      AudioFX.speakCat('小屋变得更舒服啦，谢谢你！', { soft: true });
      roomBurst();
      toast(`小屋升到 ${info.stars} 星「${info.name}」，解锁 ${perk.icon}${perk.name}，获得 ${coins} 颗橡果`, 3200);
      renderRoomFx();
      renderRoomHud();
      if (isRoomPanelOpen()) renderRoomPanel();
      checkBadges();
    }, delay || 0);
  }

  function renderRoomHud() {
    const w = ensureRoomWish();
    if (!w) return;
    const info = comfortInfo();
    const done = state.room.wishDone;
    const got = wishProgress(w);

    const card = $('#room-wish-card');
    if (card) {
      card.classList.toggle('done', done);
      const ico = $('#rw-ico');
      if (ico) ico.innerHTML = Art.em(done ? '🎉' : w.icon);
      const title = $('#rw-title');
      if (title) title.textContent = done ? '今天的心愿实现啦' : w.text;
      const sub = $('#rw-sub');
      if (sub) {
        sub.textContent = done
          ? (state.room.wishStreak > 1 ? '已经连续 ' + state.room.wishStreak + ' 天啦！' : '明天再来看看新心愿～')
          : (w.tag === 'pet' ? '点一点小龙猫就好' : '还差 ' + (w.need - got) + ' 个');
      }
      const pips = $('#rw-pips');
      if (pips) {
        pips.innerHTML = Array.from({ length: w.need }, (_, i) =>
          `<i class="${i < got || done ? 'on' : ''}"></i>`).join('');
      }
      const go = $('#rw-go');
      if (go) go.textContent = done ? '看看' : '去布置';
    }

    const stars = $('#rc-stars');
    if (stars) {
      stars.innerHTML = Array.from({ length: 5 }, (_, i) =>
        `<i class="${i < info.stars ? 'on' : ''}">★</i>`).join('');
    }
    const num = $('#rc-num');
    if (num) num.textContent = info.stars + ' 星 · ' + info.name;
    const fill = $('#rc-fill');
    if (fill) fill.style.width = Math.max(4, info.score) + '%';
    const tip = $('#rc-tip');
    if (tip) {
      tip.textContent = info.stars >= 5
        ? '小屋已经超级舒服啦！'
        : ('再舒服 ' + Math.max(1, info.next - info.score) + ' 点就能升星');
    }
  }

  /* 按星级给小屋挂上氛围：暖光、花瓣、星星、泡泡、彩虹 */
  function renderRoomFx() {
    const info = comfortInfo();
    const bg = $('#room-bg');
    if (!bg) return info;
    bg.classList.toggle('room-warm', info.stars >= 1);
    bg.classList.toggle('room-starfull', info.stars >= 5);
    const fx = $('#room-fx');
    if (fx) {
      let html = '';
      if (info.stars >= 2) html += '<i>🌸</i><i>🌷</i><i>🌸</i>';
      if (info.stars >= 3) html += '<i>✨</i><i>⭐</i><i>✨</i>';
      if (info.stars >= 4) html += '<i>🫧</i><i>🫧</i>';
      if (info.stars >= 5) html += '<i>🌈</i>';
      fx.innerHTML = html;
      fx.className = 'room-fx fx-' + info.stars;
    }
    return info;
  }

  function refreshRoom() {
    const bg = $('#room-bg');
    if (!bg) return;
    bg.className = 'room bg-' + state.bg;
    renderRoomPet();
    renderRoomCare();
    $('#room-decor').innerHTML = state.decor.map((id, i) => {
      const item = decorById(id);
      const slot = DECOR_SLOTS[i % DECOR_SLOTS.length];
      if (!item) return '';
      const pos = decorPos(id, i);
      return `<span class="decor-item" data-room-decor="${id}"
        style="left:${pos.x}%;top:${pos.y}%;font-size:${item.size || slot.s}px">${Art.em(item.emoji)}</span>`;
    }).join('');

    const inv = $('#inventory');
    const owned = ownedDecor();
    if (inv) {
      if (!owned.length) {
        inv.innerHTML = '<p class="empty-tip">还没有装饰，去商店看看吧～</p>';
      } else {
        inv.innerHTML = owned.map(it => {
          const placed = state.decor.indexOf(it.id) > -1;
          return `<button class="inv-item ${placed ? 'placed' : ''}" data-decor="${it.id}">
            <span class="inv-emoji">${Art.em(it.emoji)}</span>
            <span class="inv-name">${it.name}</span>
            <span class="inv-state">${placed ? '收起来' : '摆上去'}</span>
          </button>`;
        }).join('');
      }
    }

    afterRoomChange();
  }

  /* 小屋任何变化后统一走这里：结算心愿 → 刷新 HUD/氛围 → 检查升星 */
  function afterRoomChange() {
    ensureRoomWish();
    const justDone = checkRoomWish();
    renderRoomHud();
    renderRoomFx();
    if (isRoomPanelOpen()) renderRoomPanel();
    checkRoomStar(justDone ? 2800 : 0);
    refreshHud();
  }

  /* 只让装饰弹一下，不给奖励：龙猫自己玩玩具时用 */
  function decorBounceEl(id) {
    const el = document.querySelector(`[data-room-decor="${id}"]`);
    if (!el) return;
    el.classList.add('decor-react');
    setTimeout(() => el.classList.remove('decor-react'), 760);
  }

  function decorReact(id) {
    const item = decorById(id);
    decorBounceEl(id);
    AudioFX.pop();
    state.pet.mood = Pet.clamp(state.pet.mood + 1);
    save();
    if (item) toast(item.say || (item.name + '真好玩！'), 1600);
  }

  function roomPetTap() {
    roomTipClear();
    roomAct(null);
    roomSetExpr('happy', 2800);
    roomPoke();
    AudioFX.petVoice(Pet.form(state.pet.level));
    state.pet.mood = Pet.clamp(state.pet.mood + 1);
    save();
    roomSay(Pet.patLine(), 2800);
    roomPetEmote('💗', 1600);
    roomPetAt = Date.now();
    // 今天的心愿如果是「打个招呼」，摸一下就算完成
    const w = ensureRoomWish();
    if (w && w.tag === 'pet' && !state.room.wishDone) completeRoomWish(w);
    afterRoomChange();
    renderRoomCare();
    roomBrainResume(2600);
  }

  /* ---------- 小龙猫自主行为：让它像电子宠物一样自己在屋里活动 ---------- */

  const ROOM_WALK_LINES = [
    '我在小屋里散步～', '这里看看，那里瞧瞧', '今天的小屋真舒服',
    '走到你身边来啦', '地上好像有什么好玩的'
  ];
  const ROOM_PLAY_LINES = [
    '这个玩具好好玩！', '滚呀滚呀滚～', '嘿咻，再来一次',
    '一个人玩也开心'
  ];
  const ROOM_SNIFF_LINES = [
    '这朵花好香呀', '闻一闻，心情变好了', '叶子软软的'
  ];
  const ROOM_LOOK_LINES = [
    '你在做什么呀？', '我在这里陪着你', '嗯……今天玩点什么好呢',
    '房间亮亮的，好舒服'
  ];
  const ROOM_SLEEP_LINES = ['眼皮好重……', '睡一小会儿～', '呼……呼……'];
  const ROOM_BEG_LINES = ['肚子咕咕叫了', '可以给我一点吃的吗', '好想吃果子呀'];
  const ROOM_DIRTY_LINES = ['身上毛毛乱乱的', '想洗香香了', '抖一抖，灰尘飞走'];
  const ROOM_SAD_LINES = ['有点无聊……', '陪我说说话嘛', '今天好像少了点什么'];
  const ROOM_CARE_LINES = {
    feed: ['好好吃！谢谢你～', '肚子饱饱的，好幸福～', '还想再来一口！'],
    bath: ['洗得香香的～', '泡泡好舒服呀！', '我现在干干净净啦！'],
    play: ['一起玩最开心啦！', '再来一次好不好？', '和你玩永远不会累～']
  };
  const ROOM_JUMP_LINES = ['跳得高高的！', '看我蹦一下～', '嘿咻！够到叶子啦'];
  const ROOM_WAVE_LINES = ['嗨～我在这里！', '挥挥小手，你好呀', '看见我了吗？我一直在呢'];
  const ROOM_ROLL_LINES = ['滚一圈，晕乎乎的～', '咕噜咕噜滚起来！', '这样滚最舒服啦'];
  const ROOM_FUNNY_LINES = ['看我做的鬼脸！', '噗～逗你笑一个', '略略略，好玩吗？'];
  const ROOM_BORED_LINES = ['好无聊呀……', '要不我们玩点什么吧？', '你在忙什么呀，理理我嘛'];

  /* 动作 → 表情：做动作时换脸，孩子一眼就能看出它的情绪 */
  const ACT_EXPR = {
    walk: 'happy', play: 'play', sleep: 'sleep', beg: 'sad', shake: 'bored',
    sad: 'sad', look: 'ok', jump: 'wow', wave: 'happy', roll: 'play',
    funny: 'grimace', bored: 'bored'
  };

  function roomPetEl() { return $('#room-pet'); }

  function petPosState() {
    const pp = state && state.petPos ? state.petPos : { x: 50, y: 2 };
    return { x: pp.x, y: pp.y };
  }

  /* 只允许龙猫在地板附近活动，别跑到天花板上去 */
  function roomLimits() { return { xMin: 9, xMax: 91, yMin: 1, yMax: 12.5 }; }

  function motionReduced() {
    return state.settings.motion === 'reduce' ||
      !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }

  function roomMoveTo(x, y) {
    const lim = roomLimits();
    const nx = Math.min(lim.xMax, Math.max(lim.xMin, x));
    const ny = Math.min(lim.yMax, Math.max(lim.yMin, y));
    const from = petPosState();
    const el = roomPetEl();
    if (el) {
      if (Math.abs(nx - from.x) > 0.4) el.dataset.face = nx > from.x ? 'right' : 'left';
      el.style.left = nx + '%';
      el.style.bottom = ny + '%';
    }
    state.petPos = { x: Math.round(nx * 10) / 10, y: Math.round(ny * 10) / 10 };
    return { x: nx, y: ny };
  }

  /* 走路的节奏参数：距离越远走得越久，每步快慢也略有不同 */
  function roomTravel(ms, steps) {
    const el = roomPetEl();
    if (!el) return;
    const slow = motionReduced();
    const total = Math.max(120, Math.round(ms));
    const n = Math.max(2, Math.min(8, steps || 3));
    // 每步时长带一点随机抖动，同一段路也不会踩成一模一样的节拍
    const jitter = 0.86 + Math.random() * 0.28;
    const dur = Math.max(240, Math.min(480, Math.round(total / n * jitter)));
    el.style.setProperty('--walk-ms', slow ? '0ms' : total + 'ms');
    el.style.setProperty('--walk-dur', (slow ? 0 : dur) + 'ms');
  }

  /* 走向某处：位移靠 CSS 的 left 过渡表现，返回大概要走多久 */
  function roomWalkTo(x, y) {
    const from = petPosState();
    const lim = roomLimits();
    const tx = Math.min(lim.xMax, Math.max(lim.xMin, x));
    const ty = Math.min(lim.yMax, Math.max(lim.yMin, y));
    const gap = Math.abs(tx - from.x);
    const ms = gap > 0.8 ? Math.max(560, Math.min(2200, gap * 26)) : 300;
    // 一步大约 380ms，路远就多走几步，节奏才不会被拉成一串碎步
    const steps = Math.max(2, Math.min(8, Math.round(ms / 380)));
    roomTravel(ms, steps);
    roomMoveTo(tx, ty);
    if (gap > 0.8 && !motionReduced()) {
      roomAct('walk', ms + 220);
      clearTimeout(roomWalkTimer);
      roomWalkTimer = setTimeout(() => {
        roomWalkTimer = 0;
        roomAct(null);
        roomLand(420);
      }, Math.max(160, ms - 60));
    }
    save();
    return ms;
  }

  /* 到达后轻轻压一下身体，消掉“突然停住”的机械感 */
  function roomLand(ms) {
    const el = roomPetEl();
    if (!el) return;
    clearTimeout(roomLandTimer);
    el.classList.remove('just-arrived');
    void el.offsetWidth;
    el.classList.add('just-arrived');
    roomLandTimer = setTimeout(() => {
      el.classList.remove('just-arrived');
      roomLandTimer = 0;
    }, Math.max(240, ms || 420));
  }

  /* 原地换表情：不重绘整只龙猫，动作动画不会被打断 */
  function roomSetExpr(expr, ms) {
    const el = roomPetEl();
    if (!el) return;
    clearTimeout(roomExprTimer);
    roomExprTimer = 0;
    Pet.setExpr(el, expr || 'auto', state.pet.mood);
    if (expr && expr !== 'auto' && ms) {
      roomExprTimer = setTimeout(() => {
        roomExprTimer = 0;
        Pet.setExpr(el, 'auto', state.pet.mood);
      }, Math.max(500, ms));
    }
  }

  function roomAct(name, ms) {
    const el = roomPetEl();
    if (!el) return;
    clearTimeout(roomActTimer);
    roomActTimer = 0;
    if (name) el.dataset.act = name;
    else el.removeAttribute('data-act');
    roomSetExpr(name ? (ACT_EXPR[name] || 'auto') : 'auto', 0);
    if (name && ms) {
      roomActTimer = setTimeout(() => {
        el.removeAttribute('data-act');
        roomActTimer = 0;
        roomSetExpr('auto', 0);
      }, ms);
    }
  }

  function roomPetEmote(txt, ms) {
    const el = $('#room-pet-emote');
    if (!el) return;
    clearTimeout(roomEmoteTimer);
    roomEmoteTimer = 0;
    if (!txt) { el.textContent = ''; el.classList.remove('show'); return; }
    el.textContent = txt;
    el.classList.add('show');
    roomEmoteTimer = setTimeout(() => el.classList.remove('show'), Math.max(700, ms || 1600));
  }

  /* 自主说话只出气泡不出声：语音合成太慢，会拖乱节奏
     tip 传入 { label, run } 时，气泡里会出现一个能直接去玩的按钮 */
  function roomSay(text, ms, tip) {
    const speech = $('#room-speech');
    if (!speech || !text) return;
    const hasTip = !!(tip && typeof tip.run === 'function');
    // 推荐气泡还在等孩子点按钮时，别被普通台词顶掉
    if (roomTipAction && !hasTip) return;
    const txt = $('#room-speech-text');
    const go = $('#room-tip-go');
    speech.style.left = Math.min(78, Math.max(22, petPosState().x)) + '%';
    if (txt) txt.textContent = text;
    else speech.textContent = text;
    roomTipAction = hasTip ? tip : null;
    if (go) {
      go.textContent = roomTipAction ? (tip.label || '去玩') : '去玩';
      go.hidden = !roomTipAction;
    }
    speech.classList.add('show');
    clearTimeout(roomSpeechTimer);
    roomSpeechTimer = setTimeout(() => {
      speech.classList.remove('show');
      roomTipAction = null;
      if (go) go.hidden = true;
    }, Math.max(1200, ms || 2400));
  }

  /* 孩子直接动了小龙猫时，先把推荐气泡收起来，让互动优先 */
  function roomTipClear() {
    roomTipAction = null;
    const go = $('#room-tip-go');
    if (go) go.hidden = true;
    const speech = $('#room-speech');
    if (speech) speech.classList.remove('show');
  }

  let roomLastLine = '';
  function roomPick(lines) {
    if (!lines || !lines.length) return '';
    let line = lines[Math.floor(Math.random() * lines.length)];
    if (lines.length > 1 && line === roomLastLine) {
      line = lines[(lines.indexOf(line) + 1) % lines.length];
    }
    roomLastLine = line;
    return line;
  }

  function roomDecorByTag(tag) {
    const list = state.decor.filter(id => {
      const it = decorById(id);
      return it && it.tags && it.tags.indexOf(tag) > -1;
    });
    if (!list.length) return null;
    return list[Math.floor(Math.random() * list.length)];
  }

  function roomBrainCanRun() {
    return !!state && activeScreen === 'room' && !document.hidden && !roomDragging &&
      Date.now() >= roomBrainPause && !isRoomPanelOpen() &&
      !$$('.modal').some(m => m.classList.contains('open'));
  }

  function roomBrainStart(delay) {
    clearTimeout(roomBrainTimer);
    roomBrainTimer = setTimeout(roomBrainTick, Math.max(600, delay || 1600));
  }

  function roomBrainStop() {
    clearTimeout(roomBrainTimer);
    clearTimeout(roomStepTimer);
    clearTimeout(roomWalkTimer);
    clearTimeout(roomLandTimer);
    clearTimeout(roomExprTimer);
    roomBrainTimer = 0;
    roomStepTimer = 0;
    roomWalkTimer = 0;
    roomLandTimer = 0;
    roomExprTimer = 0;
    const el = roomPetEl();
    if (el) el.classList.remove('just-arrived');
    roomAct(null);
    roomPetEmote('');
  }

  function roomBrainResume(delay) {
    const ms = Math.max(400, delay || 900);
    roomBrainPause = Date.now() + ms;
    roomBrainStart(ms);
  }

  function roomBrainSchedule(ms) {
    clearTimeout(roomBrainTimer);
    roomBrainTimer = setTimeout(roomBrainTick, Math.max(800, ms || 4000));
  }

  function roomStep(fn, ms) {
    clearTimeout(roomStepTimer);
    roomStepTimer = setTimeout(fn, Math.max(60, ms || 300));
  }

  function roomBrainTick() {
    roomBrainTimer = 0;
    if (!roomBrainCanRun()) { roomBrainSchedule(2400); return; }
    roomBrainDecide();
  }

  /* ---------- 主动推荐：偶尔拉着孩子去玩一个游戏 / 学一个知识点 ---------- */

  function roomRecommendSubject() {
    const weak = weakPoints(1);
    if (weak.length) {
      return { subject: weak[0].subject, reason: 'weak', stageName: weak[0].stageName || '' };
    }
    let best = null;
    Object.keys(DATA.curriculum).forEach(k => {
      const p = subjectProgress(k);
      if (!p.total || !p.maxStars) return;
      const ratio = p.stars / p.maxStars;
      if (!best || ratio < best.ratio) best = { subject: k, ratio: ratio, reason: 'low' };
    });
    return best;
  }

  function roomRecommendGame(subject) {
    const list = MiniGame.games ? MiniGame.games() : [];
    if (!list.length) return null;
    const got = Array.isArray(state.stats.stickers) ? state.stats.stickers : [];
    const fresh = list.filter(g => got.indexOf(g.id + '_' + subject) < 0);
    const pool = fresh.length ? fresh : list;
    return pool[Math.floor(Math.random() * pool.length)];
  }

  /* 冷却到了、状态不错、又有一阵没被打扰时，才主动开口推荐 */
  function roomMaybeRecommend() {
    const now = Date.now();
    if (now - roomTipAt < ROOM_TIP_GAP) return false;
    if (now - roomPetAt < 45000) return false;
    const p = state.pet;
    if (p.hunger < 40 || p.mood < 40 || p.clean < 45) return false;
    if (Math.random() > 0.45) return false;
    if (!roomBrainCanRun()) return false;

    const target = roomRecommendSubject();
    const subjectKey = target ? target.subject : Object.keys(DATA.curriculum)[0];
    const c = DATA.curriculum[subjectKey];
    if (!c) return false;
    roomTipAt = now;
    roomAct('wave', 1800);
    roomPetEmote('💡', 2400);

    // 一半以上时间拉去玩小游戏，其余去复习知识点
    if (Math.random() < 0.55) {
      const g = roomRecommendGame(subjectKey);
      if (g) {
        roomSay('我想玩「' + g.name + '」！一起吗？', 8600, {
          label: '去玩',
          run: () => MiniGame.start(g.id, { subject: subjectKey })
        });
        roomBrainSchedule(11000 + Math.random() * 4000);
        return true;
      }
    }

    if (target && target.reason === 'weak' && target.stageName) {
      roomSay('上次「' + target.stageName + '」有点难，我们再试一次好不好？', 8600, {
        label: '去复习',
        run: () => showStages(subjectKey)
      });
    } else {
      roomSay('要不要学一点「' + c.name + '」？我陪你！', 8600, {
        label: '去学习',
        run: () => showStages(subjectKey)
      });
    }
    roomBrainSchedule(11000 + Math.random() * 4000);
    return true;
  }

  function roomBrainDecide() {
    const p = state.pet;
    // 有真实需求时优先表达，孩子才知道该照顾它
    if (p.hunger < 26) return roomBrainPerform('beg');
    if (p.clean < 26) return roomBrainPerform('shake');
    if (p.mood < 30) return roomBrainPerform('sad');
    if (roomMaybeRecommend()) return;
    const h = new Date().getHours();
    const night = h >= 21 || h < 7;
    const r = Math.random();
    if (night) {
      if (r < 0.5) return roomBrainPerform('sleep');
      if (r < 0.7) return roomBrainPerform('look');
      if (r < 0.82) return roomBrainPerform('bored');
      if (r < 0.92) return roomBrainPerform('walk');
      return roomBrainPerform('wave');
    }
    if (r < 0.26) return roomBrainPerform('walk');
    if (r < 0.42) return roomBrainPerform('play');
    if (r < 0.52) return roomBrainPerform('sniff');
    if (r < 0.62) return roomBrainPerform('look');
    if (r < 0.71) return roomBrainPerform('jump');
    if (r < 0.79) return roomBrainPerform('wave');
    if (r < 0.87) return roomBrainPerform('roll');
    if (r < 0.94) return roomBrainPerform('funny');
    return roomBrainPerform('bored');
  }

  function roomBrainPerform(act) {
    const lim = roomLimits();
    const pos = petPosState();
    const randX = () => Math.round((lim.xMin + Math.random() * (lim.xMax - lim.xMin)) * 10) / 10;
    const standY = () => Math.round((lim.yMin + Math.random() * (lim.yMax - lim.yMin)) * 10) / 10;

    if (act === 'walk') {
      let tx = randX();
      if (Math.abs(tx - pos.x) < 14) tx = pos.x > 50 ? pos.x - 24 : pos.x + 24;
      const ms = roomWalkTo(tx, standY());
      if (Math.random() < 0.4) roomSay(roomPick(ROOM_WALK_LINES), 2200);
      roomBrainSchedule(ms + 2000 + Math.random() * 2600);
      return;
    }

    if (act === 'play') {
      const toy = roomDecorByTag('play');
      const dp = toy ? decorRoomPos(toy) : null;
      if (toy && dp) {
        const near = Math.min(lim.xMax, Math.max(lim.xMin, dp.x + (pos.x > dp.x ? 11 : -11)));
        const ms = roomWalkTo(near, lim.yMin + 0.5);
        roomStep(() => {
          roomAct('play', 1400);
          decorBounceEl(toy);
          AudioFX.pop();
          roomPetEmote('🎾', 1600);
          roomSay(roomPick(ROOM_PLAY_LINES), 2400);
          roomBrainSchedule(2600 + Math.random() * 1600);
        }, ms);
        return;
      }
      roomAct('play', 1400);
      roomPetEmote('🎾', 1600);
      roomSay(roomPick(ROOM_PLAY_LINES), 2400);
      roomBrainSchedule(4400 + Math.random() * 2400);
      return;
    }

    if (act === 'sniff') {
      const plant = roomDecorByTag('nature');
      const dp = plant ? decorRoomPos(plant) : null;
      if (plant && dp) {
        const near = Math.min(lim.xMax, Math.max(lim.xMin, dp.x + (pos.x > dp.x ? 10 : -10)));
        const ms = roomWalkTo(near, lim.yMin + 0.5);
        roomStep(() => {
          roomAct('look', 1500);
          roomPetEmote('🌿', 1600);
          roomSay(roomPick(ROOM_SNIFF_LINES), 2400);
          roomBrainSchedule(2800 + Math.random() * 1800);
        }, ms);
        return;
      }
      roomAct('look', 1500);
      roomPetEmote('🌿', 1600);
      roomSay(roomPick(ROOM_SNIFF_LINES), 2400);
      roomBrainSchedule(4600 + Math.random() * 2200);
      return;
    }

    if (act === 'sleep') {
      roomAct('sleep', 0);
      roomPetEmote('💤', 3200);
      if (Math.random() < 0.5) roomSay(roomPick(ROOM_SLEEP_LINES), 2600);
      roomBrainSchedule(9000 + Math.random() * 6000);
      return;
    }

    if (act === 'beg') {
      roomAct('beg', 2200);
      roomPetEmote('🍎', 2000);
      roomSay(roomPick(ROOM_BEG_LINES), 2600);
      roomBrainSchedule(7000 + Math.random() * 2600);
      return;
    }

    if (act === 'shake') {
      roomAct('shake', 1800);
      roomPetEmote('💧', 1800);
      roomSay(roomPick(ROOM_DIRTY_LINES), 2600);
      roomBrainSchedule(7000 + Math.random() * 2600);
      return;
    }

    if (act === 'sad') {
      roomAct('sad', 2200);
      roomPetEmote('💭', 1800);
      roomSay(roomPick(ROOM_SAD_LINES), 2600);
      roomBrainSchedule(8000 + Math.random() * 2400);
      return;
    }

    if (act === 'jump') {
      roomAct('jump', 1500);
      roomPetEmote('✨', 1600);
      if (Math.random() < 0.6) roomSay(roomPick(ROOM_JUMP_LINES), 2200);
      roomBrainSchedule(4200 + Math.random() * 2200);
      return;
    }

    if (act === 'wave') {
      roomAct('wave', 1900);
      roomPetEmote('👋', 1900);
      if (Math.random() < 0.7) roomSay(roomPick(ROOM_WAVE_LINES), 2200);
      roomBrainSchedule(4600 + Math.random() * 2200);
      return;
    }

    if (act === 'roll') {
      // 真的横向滚一小段，比原地转更像在玩
      const dir = Math.random() < 0.5 ? -1 : 1;
      const tx = Math.min(lim.xMax, Math.max(lim.xMin, pos.x + dir * (7 + Math.random() * 9)));
      roomTravel(900, 8);
      roomMoveTo(tx, pos.y);
      roomAct('roll', 1800);
      roomPetEmote('🌀', 1800);
      if (Math.random() < 0.6) roomSay(roomPick(ROOM_ROLL_LINES), 2200);
      roomBrainSchedule(4600 + Math.random() * 2000);
      return;
    }

    if (act === 'funny') {
      roomAct('funny', 2000);
      roomPetEmote('😜', 1900);
      if (Math.random() < 0.7) roomSay(roomPick(ROOM_FUNNY_LINES), 2200);
      roomBrainSchedule(4800 + Math.random() * 2200);
      return;
    }

    if (act === 'bored') {
      roomAct('bored', 2600);
      roomPetEmote('💤', 2200);
      if (Math.random() < 0.55) roomSay(roomPick(ROOM_BORED_LINES), 2400);
      roomBrainSchedule(6000 + Math.random() * 3000);
      return;
    }

    // look：原地张望
    roomAct('look', 1800);
    roomPetEmote('👀', 1500);
    if (Math.random() < 0.6) roomSay(roomPick(ROOM_LOOK_LINES), 2200);
    roomBrainSchedule(5200 + Math.random() * 2400);
  }

  function roomPoke() {
    const el = document.querySelector('#room-pet .pet-wrap');
    if (!el) return;
    const cls = POKE_ANIMS[pokeIndex++ % POKE_ANIMS.length];
    el.classList.add(cls);
    setTimeout(() => el.classList.remove(cls), 900);
  }

  function renderRoomPet() {
    const el = roomPetEl();
    if (!el) return;
    const pos = petPosState();
    el.innerHTML = Pet.svg(state.pet.level, state.pet.mood) +
      '<span class="room-pet-emote" id="room-pet-emote"></span>';
    el.style.left = pos.x + '%';
    el.style.bottom = pos.y + '%';
    if (!el.dataset.face) el.dataset.face = 'right';
  }

  function roomDaysTogether() {
    const since = state.pet.since || Date.now();
    return Math.max(1, Math.floor((Date.now() - since) / 86400000) + 1);
  }

  function renderRoomCare() {
    const p = state.pet;
    const title = $('#rcare-title');
    if (title) title.textContent = Pet.title(p.level) + ' · Lv.' + p.level;
    const days = $('#rcare-days');
    if (days) days.textContent = '一起第 ' + roomDaysTogether() + ' 天 · ' + Pet.moodWord(p);
    const face = $('#rcare-face');
    if (face) {
      let icon = '🐾';
      if (p.hunger < 30) icon = '🍎';
      else if (p.clean < 30) icon = '🛁';
      else if (p.mood < 30) icon = '🎾';
      face.textContent = icon;
    }
    [['hunger', 'rcare-hunger'], ['mood', 'rcare-mood'], ['clean', 'rcare-clean']].forEach(([k, id]) => {
      const bar = $('#' + id);
      if (bar) bar.style.width = Math.max(4, Math.round(p[k])) + '%';
    });
  }

  function roomCare(action) {
    const ok = care(action);
    renderRoomCare();
    if (!ok) return;
    roomTipClear();
    renderRoomPet();
    roomAct(null);
    roomSetExpr('happy', 2600);
    roomPoke();
    roomPetEmote(action === 'feed' ? '🍎' : action === 'bath' ? '🫧' : '🎾', 1700);
    roomSay(roomPick(ROOM_CARE_LINES[action] || ROOM_CARE_LINES.play), 2600);
    afterRoomChange();
    roomBrainResume(2800);
  }

  function bindRoom() {
    const room = $('#room-bg');
    if (!room) return;
    let drag = null;

    /* 指针捕获：手指/鼠标滑出小屋范围也不会丢事件 */
    const capture = e => {
      try { room.setPointerCapture(e.pointerId); } catch (err) { /* 老浏览器忽略 */ }
    };

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
        capture(e);
        return;
      }
      if (e.target.closest('#room-pet')) {
        e.preventDefault();
        drag = {
          pet: true,
          rect: room.getBoundingClientRect(),
          moved: false,
          startX: e.clientX,
          startY: e.clientY
        };
        capture(e);
      }
    });

    room.addEventListener('pointermove', e => {
      if (!drag) return;
      const dx = e.clientX - drag.startX;
      const dy = e.clientY - drag.startY;
      if (!drag.moved && Math.sqrt(dx * dx + dy * dy) < 6) return;
      drag.moved = true;

      if (drag.el) {
        const x = Math.min(95, Math.max(5, (e.clientX - drag.rect.left) / drag.rect.width * 100));
        const y = Math.min(90, Math.max(8, (e.clientY - drag.rect.top) / drag.rect.height * 100));
        drag.el.style.left = x + '%';
        drag.el.style.top = y + '%';
        return;
      }

      if (drag.pet) {
        if (!roomDragging) {
          roomDragging = true;
          clearTimeout(roomBrainTimer);
          clearTimeout(roomStepTimer);
          roomAct(null);
          roomPetEmote('');
          const el = roomPetEl();
          if (el) el.classList.add('dragging');
        }
        roomMoveTo(
          (e.clientX - drag.rect.left) / drag.rect.width * 100,
          (drag.rect.bottom - e.clientY) / drag.rect.height * 100
        );
      }
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
        const el = roomPetEl();
        roomDragging = false;
        if (el) el.classList.remove('dragging');
        if (drag.moved) {
          // 搬到新位置：落地后撒个娇，再继续自己活动
          AudioFX.pop();
          roomTipClear();
          roomPetEmote('❤️', 1600);
          roomSay('这里也不错，谢谢你帮我搬家～', 2600);
          save();
          roomPetAt = Date.now();
          renderRoomCare();
          roomBrainResume(2400);
        } else {
          roomPetTap();
        }
      }
      drag = null;
    };
    room.addEventListener('pointerup', end);
    room.addEventListener('pointercancel', end);

    // 触摸/指针事件之外的兜底：直接点击小龙猫也能互动
    room.addEventListener('click', e => {
      if (e.target.closest('#room-pet') && Date.now() - roomPetAt > 320) roomPetTap();
    });

    const planBtn = $('#btn-room-plan');
    if (planBtn) planBtn.addEventListener('click', openRoomPanel);
    const wishCard = $('#room-wish-card');
    if (wishCard) wishCard.addEventListener('click', openRoomPanel);
    const comfortCard = $('#room-comfort');
    if (comfortCard) comfortCard.addEventListener('click', openRoomPanel);

    // 气泡里的推荐按钮：点了就直接去玩 / 去学习
    const tipGo = $('#room-tip-go');
    if (tipGo) {
      tipGo.addEventListener('click', e => {
        e.preventDefault();
        e.stopPropagation();
        const tip = roomTipAction;
        if (!tip || typeof tip.run !== 'function') return;
        AudioFX.click();
        roomTipAction = null;
        const speech = $('#room-speech');
        if (speech) speech.classList.remove('show');
        tipGo.hidden = true;
        try { tip.run(); } catch (err) { /* 页面切换失败也不影响小屋 */ }
      });
    }
  }

  /* ---------- 小屋心愿面板 ---------- */

  function isRoomPanelOpen() {
    const m = $('#room-modal');
    return !!(m && m.classList.contains('open'));
  }

  function openRoomPanel() {
    // 打开面板时暂停自主活动，避免龙猫在背后乱跑
    clearTimeout(roomBrainTimer);
    clearTimeout(roomStepTimer);
    roomBrainPause = Date.now() + 900;
    const w = ensureRoomWish();
    renderRoomPanel();
    const m = $('#room-modal');
    if (m) m.classList.add('open');
    AudioFX.click();
    if (w && !state.room.wishDone) AudioFX.speakCat(w.say, { soft: true });
  }

  /* 面板里只推荐能完成心愿的装饰，避免孩子乱点 */
  function wishDecorList(w) {
    if (w.tag === 'pet') return [];
    return ownedDecor().filter(it => w.tag === 'any' || (it.tags || []).indexOf(w.tag) > -1);
  }

  function renderRoomPanel() {
    const panel = $('#room-panel');
    const w = ensureRoomWish();
    if (!panel || !w) return;
    const info = comfortInfo();
    const got = wishProgress(w);
    const done = state.room.wishDone;
    const left = Math.max(0, w.need - got);
    const decor = wishDecorList(w);

    const decorHtml = w.tag === 'pet'
      ? `<p class="rm-hint">关掉面板，在小屋里点一点 ${Art.em('🐾')} 小龙猫，和它打个招呼就好啦。</p>`
      : (decor.length
        ? `<div class="rm-decor">${decor.map(it => {
          const placed = state.decor.indexOf(it.id) > -1;
          return `<button class="rm-item ${placed ? 'on' : ''}" data-room-place="${it.id}" type="button">
            <span class="rm-ico">${Art.em(it.emoji)}</span>
            <b>${it.name}</b>
            <small>${placed ? '已摆上' : '摆上去'}</small>
          </button>`;
        }).join('')}</div>`
        : '<p class="rm-hint">还没有合适的装饰，去森林商店看看吧～</p>');

    panel.innerHTML = `
      <div class="rm-wish ${done ? 'done' : ''}">
        <div class="rm-wish-ico">${Art.em(done ? '🎉' : w.icon)}</div>
        <div class="rm-wish-main">
          <b>${done ? '今天的心愿实现啦' : w.text}</b>
          <span>${done ? '明天会有新的心愿等着你～'
            : (w.tag === 'pet' ? '点一点小龙猫，和它打个招呼'
              : '还差 ' + left + ' 个 · 完成后 +' + w.reward + ' 🌰')}</span>
          <div class="rm-pips">${Array.from({ length: w.need }, (_, i) =>
            `<i class="${i < got ? 'on' : ''}"></i>`).join('')}</div>
        </div>
        <div class="rm-reward">+${w.reward}<small>🌰</small></div>
      </div>
      ${state.room.wishStreak > 0
        ? `<p class="rm-streak">${Art.em('🔥')} 已经连续完成 ${state.room.wishStreak} 天心愿</p>` : ''}
      <h4 class="rm-title">${w.tag === 'pet' ? '去看看小龙猫' : '心愿推荐'}</h4>
      ${decorHtml}
      <h4 class="rm-title">小屋舒适度</h4>
      <div class="rm-comfort">
        <div class="rm-stars">${Array.from({ length: 5 }, (_, i) =>
          `<i class="${i < info.stars ? 'on' : ''}">★</i>`).join('')}</div>
        <div class="rm-num">${info.stars} 星 · ${info.name}<span>${info.score} 分</span></div>
        <div class="rm-bar"><i style="width:${Math.max(4, info.score)}%"></i></div>
        <p class="rm-hint">装饰越多、种类越全、再换个背景，小屋都会更舒服哦。</p>
      </div>
      <h4 class="rm-title">星级小惊喜</h4>
      <ul class="rm-perks">${ROOM_PERKS.map(p => `
        <li class="${info.stars >= p.star ? 'on' : ''}">
          <span class="rm-perk-ico">${Art.em(p.star <= info.stars ? p.icon : '🔒')}</span>
          <b>${p.star} 星</b>
          <span class="rm-perk-name">${p.name}</span>
          <small>+${p.reward} 🌰</small>
        </li>`).join('')}</ul>
      <button class="btn btn-yellow rm-shop" id="btn-room-panel-shop" type="button">🛒 去商店挑装饰</button>
    `;
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
    show('parent');
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
    const sheetTip = $('#sheet-tip');
    if (sheetTip) {
      sheetTip.textContent = state.wrongBook.length
        ? `错题本共 ${state.wrongBook.length} 道，可挑 ${Math.min(12, state.wrongBook.length)} 道排成练习纸`
        : '还没有错题，先陪孩子练几题吧';
    }
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

  /* ---------- 错题练习纸 ---------- */

  function sheetItems() {
    return state.wrongBook.slice()
      .sort((a, b) => (Number(b.times) || 1) - (Number(a.times) || 1) ||
        (Number(a.dueAt) || 0) - (Number(b.dueAt) || 0))
      .slice(0, 12);
  }

  function buildPracticeSheet() {
    const body = $('#sheet-body');
    if (!body) return;
    const items = sheetItems();
    if (!items.length) {
      body.innerHTML = '<p class="sheet-empty">错题本还是空的。孩子答错题后，这里会自动排成一张练习纸。</p>';
      return;
    }
    const letters = 'ABCDEF';
    const rows = items.map((w, i) => {
      const sub = Game.SUBJECTS[w.subject] || { name: '综合' };
      const opts = (w.options || []).map((o, j) =>
        `<span class="sheet-opt"><i>${letters[j] || j + 1}</i>${o.html || esc(o.label)}</span>`).join('');
      return `<div class="sheet-item">
        <div class="sheet-q"><span class="sheet-no">${i + 1}</span>
          <div class="sheet-qmain">
            <p class="sheet-tag">${esc(sub.name)} · ${esc(typeLabel(w.type))}</p>
            <p class="sheet-title">${esc(w.title)}</p>
            ${w.visual ? `<div class="sheet-visual">${w.visual}</div>` : ''}
            ${opts ? `<div class="sheet-opts">${opts}</div>` : ''}
            <p class="sheet-line">答：<span></span></p>
          </div>
        </div>
      </div>`;
    }).join('');
    const keys = items.map((w, i) => {
      const j = (w.options || []).findIndex(o => String(o.label) === String(w.answer));
      const ans = j >= 0 ? (letters[j] || j + 1) : (w.answer || '见题目');
      return `<span class="sheet-key-item"><b>${i + 1}</b>${esc(ans)}</span>`;
    }).join('');
    body.innerHTML = `
      <div class="sheet-head">
        <p class="sheet-h1">小龙猫错题练习纸</p>
        <p class="sheet-meta">名字：____________　日期：${dateKey(0)}　共 ${items.length} 题</p>
      </div>
      <p class="sheet-help">家长可以先读一遍题目，孩子把答案写在横线上，做完再翻到最后一页对答案。</p>
      ${rows}
      <div class="sheet-key">
        <p class="sheet-key-title">参考答案</p>
        <div class="sheet-key-list">${keys}</div>
      </div>`;
  }

  function openSheet() {
    buildPracticeSheet();
    $('#sheet-modal').classList.add('open');
    AudioFX.click();
  }

  /* ---------- 周报分享图（Canvas 导出 PNG） ---------- */

  function exportShareCard() {
    const days = last7Days();
    const sum = days.reduce((o, d) => {
      o.correct += d.correct;
      o.total += d.total;
      o.seconds += d.seconds;
      return o;
    }, { correct: 0, total: 0, seconds: 0 });
    const rate = sum.total ? Math.round(sum.correct / sum.total * 100) : 0;
    const minutes = Math.round(sum.seconds / 60);

    const W = 1080;
    const H = 1350;
    const cv = document.createElement('canvas');
    cv.width = W;
    cv.height = H;
    const c = cv.getContext('2d');
    if (!c) return toast('当前浏览器不支持生成图片');

    const rr = (x, y, w, h, r) => {
      c.beginPath();
      c.moveTo(x + r, y);
      c.arcTo(x + w, y, x + w, y + h, r);
      c.arcTo(x + w, y + h, x, y + h, r);
      c.arcTo(x, y + h, x, y, r);
      c.arcTo(x, y, x + w, y, r);
      c.closePath();
    };
    const font = (size, weight) => `${weight || 700} ${size}px "PingFang SC","Microsoft YaHei","Segoe UI",sans-serif`;

    const bg = c.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#dff0d6');
    bg.addColorStop(.5, '#fdf8e9');
    bg.addColorStop(1, '#eef7f0');
    c.fillStyle = bg;
    c.fillRect(0, 0, W, H);

    c.fillStyle = 'rgba(255,255,255,.35)';
    c.beginPath();
    c.arc(940, 150, 150, 0, Math.PI * 2);
    c.fill();
    c.beginPath();
    c.arc(110, 1230, 190, 0, Math.PI * 2);
    c.fill();

    c.fillStyle = '#3b4a3e';
    c.font = font(62, 900);
    c.fillText('小龙猫学习周报', 80, 130);
    c.fillStyle = '#66735f';
    c.font = font(28, 600);
    c.fillText(`${days[0].key} 至 ${days[6].key}`, 82, 182);

    const stats = [
      { v: String(sum.correct), t: '答对题数' },
      { v: rate + '%', t: '正确率' },
      { v: String(minutes), t: '学习分钟' },
      { v: String(state.stats.streak || 0), t: '连续天数' }
    ];
    stats.forEach((s, i) => {
      const x = 80 + (i % 2) * 480;
      const y = 230 + Math.floor(i / 2) * 190;
      c.save();
      c.shadowColor = 'rgba(76,104,82,.16)';
      c.shadowBlur = 24;
      c.shadowOffsetY = 10;
      c.fillStyle = 'rgba(255,255,255,.94)';
      rr(x, y, 440, 166, 28);
      c.fill();
      c.restore();
      c.fillStyle = '#2f7d5d';
      c.font = font(60, 900);
      c.fillText(s.v, x + 34, y + 88);
      c.fillStyle = '#66735f';
      c.font = font(26, 600);
      c.fillText(s.t, x + 36, y + 132);
    });

    c.fillStyle = '#3b4a3e';
    c.font = font(34, 900);
    c.fillText('近 7 天', 80, 690);

    const max = Math.max(10, ...days.map(d => d.total));
    const baseY = 900;
    const chartH = 170;
    days.forEach((d, i) => {
      const cx = 80 + i * 131 + 33;
      const h = d.total ? Math.max(6, Math.round(d.correct / max * chartH)) : 4;
      c.fillStyle = 'rgba(255,255,255,.8)';
      rr(cx, baseY - chartH, 64, chartH, 16);
      c.fill();
      c.fillStyle = d.total ? '#5f9e6e' : '#dfe8da';
      rr(cx, baseY - h, 64, h, 16);
      c.fill();
      c.fillStyle = '#66735f';
      c.font = font(24, 700);
      c.textAlign = 'center';
      c.fillText(d.total ? Math.round(d.correct / d.total * 100) + '%' : '—', cx + 32, baseY - chartH - 16);
      c.fillText(d.label, cx + 32, baseY + 40);
      c.textAlign = 'left';
    });

    c.fillStyle = '#3b4a3e';
    c.font = font(34, 900);
    c.fillText('各科表现', 80, 1000);

    const subs = Object.values(Game.SUBJECTS).map(sub => {
      const d = state.stats.bySubject[sub.key] || { correct: 0, total: 0 };
      return { name: sub.name, color: sub.color, correct: d.correct, total: d.total };
    }).filter(s => s.total > 0).sort((a, b) => b.total - a.total).slice(0, 4);

    if (!subs.length) {
      c.fillStyle = '#98a492';
      c.font = font(26, 600);
      c.fillText('这一周还没有练习记录，从最简单的关卡开始吧。', 80, 1050);
    } else {
      subs.forEach((s, i) => {
        const y = 1040 + i * 58;
        c.fillStyle = '#3b4a3e';
        c.font = font(26, 700);
        c.fillText(s.name, 80, y + 26);
        c.fillStyle = 'rgba(255,255,255,.85)';
        rr(260, y, 620, 28, 14);
        c.fill();
        const pct = Math.round(s.correct / s.total * 100);
        c.fillStyle = s.color;
        rr(260, y, Math.max(28, 620 * pct / 100), 28, 14);
        c.fill();
        c.fillStyle = '#66735f';
        c.font = font(24, 700);
        c.fillText(`${pct}% · ${s.total} 题`, 900, y + 23);
      });
    }

    c.fillStyle = '#98a492';
    c.font = font(24, 600);
    c.textAlign = 'center';
    c.fillText('每天一点点，成长看得见 · 小龙猫乐园', W / 2, 1290);
    c.textAlign = 'left';

    cv.toBlob(blob => {
      if (!blob) return toast('分享图生成失败，请重试');
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = '小龙猫周报-' + dateKey(0) + '.png';
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
      toast('分享图已生成，可发给家人');
    }, 'image/png');
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

  /* ---------- 家长中心：周计划 / 掌握度 / 档案 / 屏幕时间 / 内容预览 ---------- */

  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));

  const WEEK_NAMES = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  const LIMIT_OPTIONS = [0, 15, 20, 30, 45, 60];
  const REST_OPTIONS = [0, 10, 15, 20, 30];

  function dayKeyOf(d) {
    return d.getFullYear() + '-' +
      String(d.getMonth() + 1).padStart(2, '0') + '-' +
      String(d.getDate()).padStart(2, '0');
  }

  function typeLabel(type) {
    if (Quiz.TYPE_NAMES && Quiz.TYPE_NAMES[type]) return Quiz.TYPE_NAMES[type];
    const t = Quiz.TITLES && Quiz.TITLES[type];
    return (t && t[0]) || type;
  }

  function renderWeekPlan() {
    const el = $('#parent-plan');
    if (!el) return;

    // 正确率最低、题量足够的一科作为本周重点
    let weak = null;
    let weakRate = 2;
    Object.values(Game.SUBJECTS).forEach(sub => {
      const d = state.stats.bySubject[sub.key] || { correct: 0, total: 0 };
      if (d.total >= 5) {
        const r = d.correct / d.total;
        if (r < weakRate) { weakRate = r; weak = sub; }
      }
    });

    const due = dueReview(999).length;
    const rot = ['math', 'words', 'hanzi'];
    const limit = state.parent.dailyLimit > 0 ? Math.min(15, state.parent.dailyLimit) : 15;
    const now = new Date();
    const dow = now.getDay() === 0 ? 7 : now.getDay();
    const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (dow - 1));
    const todayKey = dayKeyOf(now);

    el.innerHTML = [0, 1, 2, 3, 4, 5, 6].map(i => {
      const d = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i);
      const key = dayKeyOf(d);
      const key0 = rot[i % 3];
      const useWeak = weak && (i === 2 || i === 5);
      const sub = Game.SUBJECTS[useWeak ? weak.key : key0];
      const done = key < todayKey && ((state.history[key] || {}).seconds || 0) > 30;
      const isToday = key === todayKey;
      const review = due > 0 && (i === 2 || i === 5) ? ` · 复习 ${due} 题` : '';
      const flag = done ? '✔ 已完成' : isToday ? '今天' : '待开始';
      return `<div class="plan-row${isToday ? ' today' : ''}${done ? ' done' : ''}">
        <span class="plan-day">${WEEK_NAMES[d.getDay()]}</span>
        <span class="plan-main">${Art.em(sub.icon)} ${esc(sub.name)}</span>
        <span class="plan-min">${limit} 分钟${review}</span>
        <span class="plan-flag">${flag}</span>
      </div>`;
    }).join('') + (weak
      ? `<p class="card-sub">本周重点：${esc(weak.name)}（正确率 ${Math.round(weakRate * 100)}%），周三、周六多练一点。</p>`
      : '<p class="card-sub">再积累几局数据，就能给出更准的本周重点。</p>');
  }

  function renderMastery() {
    const el = $('#parent-mastery');
    if (!el) return;
    const rows = Object.keys(state.mastery).map(k => {
      const parts = k.split('|');
      const m = state.mastery[k] || {};
      return {
        subject: parts[0], type: parts[1],
        level: Number(m.level) || 0,
        right: Number(m.right) || 0,
        wrong: Number(m.wrong) || 0
      };
    }).filter(r => Game.SUBJECTS[r.subject] && r.right + r.wrong > 0)
      .sort((a, b) => a.level - b.level || (b.right + b.wrong) - (a.right + a.wrong));

    if (!rows.length) {
      el.innerHTML = '<p class="card-sub">还没有足够的数据。孩子多练几题后，这里会显示每个知识点的掌握程度。</p>';
      return;
    }

    const weak = weakPoints(3);
    const weakHtml = weak.length
      ? `<div class="weak-box">
        <p class="weak-title">建议先练这几个</p>
        <div class="weak-list">${weak.map(w => {
          const sub = Game.SUBJECTS[w.subject];
          return `<button class="weak-chip" type="button" data-weak="${esc(w.subject)}|${esc(w.stageId)}">${Art.em(sub.icon)} ${esc(sub.name)} · ${esc(typeLabel(w.type))}</button>`;
        }).join('')}</div>
      </div>`
      : '';

    el.innerHTML = weakHtml + rows.slice(0, 12).map(r => {
      const sub = Game.SUBJECTS[r.subject];
      const dots = [1, 2, 3, 4, 5].map(n => `<i class="${n <= r.level ? 'on' : ''}"></i>`).join('');
      return `<div class="mastery-row">
        <span class="mastery-name">${Art.em(sub.icon)} ${esc(sub.name)} · ${esc(typeLabel(r.type))}</span>
        <span class="mastery-dots">${dots}</span>
        <span class="mastery-num">${r.right}/${r.right + r.wrong}</span>
      </div>`;
    }).join('');
  }

  function renderProfiles() {
    const el = $('#profile-row');
    if (!el) return;
    const list = SaveStore.profiles ? SaveStore.profiles() : [];
    const cur = SaveStore.currentSlot ? SaveStore.currentSlot() : 'p1';
    el.innerHTML = list.map(p =>
      `<button class="profile-chip${p.id === cur ? ' active' : ''}" type="button" data-profile="${esc(p.id)}"${p.id === cur ? ' aria-current="true"' : ''}>${esc(p.name)}</button>`
    ).join('');
  }

  function renderBandSeg() {
    const el = $('#seg-band');
    if (!el) return;
    const cur = state.profile.band;
    el.innerHTML = (DATA.ageBands || []).map(b =>
      `<button class="seg-btn${b.id === cur ? ' active' : ''}" type="button" data-band="${b.id}">${esc(b.name)}</button>`
    ).join('');
  }

  function renderScreenSegs() {
    const l = $('#seg-limit');
    if (l) {
      l.innerHTML = LIMIT_OPTIONS.map(v =>
        `<button class="seg-btn${v === state.parent.dailyLimit ? ' active' : ''}" type="button" data-limit="${v}">${v ? v + ' 分' : '不限'}</button>`
      ).join('');
    }
    const r = $('#seg-rest');
    if (r) {
      r.innerHTML = REST_OPTIONS.map(v =>
        `<button class="seg-btn${v === state.parent.restEvery ? ' active' : ''}" type="button" data-rest="${v}">${v ? v + ' 分' : '关闭'}</button>`
      ).join('');
    }
    const tip = $('#screen-tip');
    if (tip) {
      const limit = state.parent.dailyLimit;
      const every = state.parent.restEvery;
      tip.textContent = `今天已使用 ${minutesToday()} 分钟${limit > 0 ? `（上限 ${limit} 分钟）` : '（不限制时长）'}。` +
        (limit > 0 ? '达到上限后孩子会看到“明天见”的提示并被挡住，家长在这里调高上限后即可继续，无需等到明天。' : '') +
        (every > 0 ? ` 每学习 ${every} 分钟会提醒孩子休息 20 秒。` : '');
    }
  }

  function renderContentPreview() {
    const el = $('#parent-content');
    if (!el) return;
    const items = [
      { n: (DATA.letters || []).length, t: '英文字母' },
      { n: (DATA.words || []).length, t: '英文单词' },
      { n: (DATA.pinyin ? DATA.pinyin.initials.length + DATA.pinyin.finals.length : 0), t: '声母韵母' },
      { n: (DATA.pinyin ? DATA.pinyin.syllables.length : 0), t: '音节' },
      { n: (DATA.hanzi || []).length, t: '汉字' },
      { n: (DATA.sentences || []).length, t: '句型' },
      { n: (DATA.rhymes || []).length, t: '儿歌韵律' },
      { n: (DATA.strokes || []).length, t: '笔顺字' },
      { n: (DATA.shapes || []).length, t: '图形' },
      { n: (DATA.sciAnimals || []).length, t: '动物' },
      { n: (DATA.sciPlants || []).length, t: '植物' },
      { n: (DATA.sciWeather || []).length, t: '天气' },
      { n: (DATA.sciSeasons || []).length, t: '四季' },
      { n: (DATA.sciSpaceFacts || []).length, t: '太空常识' },
      { n: (DATA.sciBodyParts || []).length, t: '身体部位' },
      { n: (DATA.sciGrowth || []).length, t: '生长链' },
      { n: (DATA.sciHabits || []).length, t: '生活习惯' },
      { n: Object.keys(Quiz.BUILDERS || {}).length, t: '题型' }
    ];
    const stages = Object.keys(DATA.curriculum).reduce((n, k) => n + DATA.curriculum[k].stages.length, 0);
    el.innerHTML = items.map(i => `<span class="cp-chip"><b>${i.n}</b>${i.t}</span>`).join('') +
      `<span class="cp-chip"><b>${stages}</b>阶段</span>`;
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
    renderWeekPlan();
    renderMastery();
    renderProfiles();
    renderBandSeg();
    renderScreenSegs();
    renderContentPreview();

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
      openParent();
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
    $('#btn-toggle-sound').setAttribute('aria-pressed', state.settings.sound ? 'true' : 'false');
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
    startSpeechLoop();
    startScreenClock();
    setTimeout(showIntro, 520);
  }

  function bind() {
    // 今日时长已到上限：捕获阶段统一拦截，确保各个直达按钮（错题/小游戏/商店/再来一局等）也走同一套规则
    const BLOCKED_SEL = '[data-subject],[data-stage],[data-skip],[data-level],[data-branch],' +
      '#btn-placement,#btn-map-continue,#btn-review,#btn-home-mini,#btn-shop,#btn-again,' +
      '[data-nav="room"],[data-nav="badges"]';
    document.addEventListener('click', e => {
      if (!e.target.closest(BLOCKED_SEL)) return;
      if (!screenBlocked()) return;
      e.preventDefault();
      e.stopPropagation();
      toast('今天的屏幕时间用完啦，休息一下明天再来～');
    }, true);

    // 导航
    document.addEventListener('click', e => {
      const pinKey = e.target.closest('[data-pin]');
      if (pinKey) { pinPress(pinKey.dataset.pin); return; }

      if (e.target.closest('#btn-rest-ok')) {
        const ok = $('#btn-rest-ok');
        if (ok && ok.disabled) return;
        closeRest();
        if (activeScreen !== 'parent') show('home');
        return;
      }

      const goalBtn = e.target.closest('[data-goal]');
      if (goalBtn && !goalBtn.disabled) {
        state.parent.goal = num(state.parent.goal + Number(goalBtn.dataset.goal), 20, 5, 50);
        save();
        AudioFX.click();
        renderGoal();
        return;
      }

      const weakBtn = e.target.closest('[data-weak]');
      if (weakBtn) {
        const parts = (weakBtn.dataset.weak || '').split('|');
        if (parts[0] && parts[1] && Game.startStage) {
          AudioFX.click();
          Game.startStage(parts[0], parts[1]);
        }
        return;
      }

      const profileBtn = e.target.closest('[data-profile]');
      if (profileBtn) {
        const id = profileBtn.dataset.profile;
        if (id && id !== SaveStore.currentSlot()) {
          SaveStore.switchSlot(id);
          location.reload();
        }
        return;
      }

      const bandBtn = e.target.closest('[data-band]');
      if (bandBtn) {
        AudioFX.click();
        state.profile.band = bandBtn.dataset.band || '';
        save();
        renderBandSeg();
        renderPlacementCard();
        return;
      }

      const limitBtn = e.target.closest('[data-limit]');
      if (limitBtn) {
        AudioFX.click();
        state.parent.dailyLimit = Number(limitBtn.dataset.limit) || 0;
        state.screen.limitAt = 0;
        save();
        renderScreenSegs();
        return;
      }

      const restBtn = e.target.closest('[data-rest]');
      if (restBtn) {
        AudioFX.click();
        state.parent.restEvery = Number(restBtn.dataset.rest) || 0;
        state.screen.restAt = 0;
        save();
        renderScreenSegs();
        return;
      }

      if (e.target.closest('#btn-profile-add')) {
        const id = SaveStore.addSlot();
        if (id) { SaveStore.switchSlot(id); location.reload(); }
        return;
      }

      if (e.target.closest('#btn-profile-rename')) {
        const cur = SaveStore.currentSlot();
        const old = (SaveStore.profiles().find(p => p.id === cur) || {}).name || '';
        const name = window.prompt('给这个孩子起个名字：', old);
        if (name && name.trim()) {
          SaveStore.renameSlot(cur, name.trim().slice(0, 8));
          renderProfiles();
          toast('名字已更新');
        }
        return;
      }

      const subTab = e.target.closest('[data-subject-tab]');
      if (subTab) {
        const key = subTab.dataset.subjectTab;
        if (key !== currentSubject) {
          AudioFX.click();
          currentSubject = key;
          renderStages();
        }
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

      const skipBtn = e.target.closest('[data-skip]');
      if (skipBtn && skipBtn.dataset.skip) {
        AudioFX.click();
        Game.startSkip(currentSubject, skipBtn.dataset.skip);
        return;
      }

      if (e.target.closest('#btn-placement')) {
        AudioFX.click();
        Game.startPlacement();
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

      const placeBtn = e.target.closest('[data-room-place]');
      if (placeBtn) { toggleDecor(placeBtn.dataset.roomPlace); return; }

      const roomCareBtn = e.target.closest('[data-room-care]');
      if (roomCareBtn) { roomCare(roomCareBtn.dataset.roomCare); return; }

      if (e.target.closest('#btn-room-panel-shop')) {
        closeModal('room-modal');
        openShop('decor');
        return;
      }

      const inv = e.target.closest('[data-decor]');
      if (inv) { toggleDecor(inv.dataset.decor); return; }

      const closeBtn = e.target.closest('[data-close]');
      if (closeBtn) { closeModal(closeBtn.dataset.close); return; }

      const tab = e.target.closest('.tab');
      if (tab) { shopTab = tab.dataset.tab; renderShop(); AudioFX.click(); return; }

      if (e.target.closest('#pet-speech')) {
        AudioFX.speakCat($('#pet-speech').textContent, { force: true });
        return;
      }

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
      // 起点测评 / 跳关测试不属于任何关卡地图，直接回对应入口
      if (info && info.kind === 'placement') { show('home'); return; }
      if (info && info.kind === 'skip') { showStages(info.subject); return; }
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

    const shareBtn = $('#btn-share');
    if (shareBtn) shareBtn.addEventListener('click', exportShareCard);

    const sheetBtn = $('#btn-sheet');
    if (sheetBtn) sheetBtn.addEventListener('click', openSheet);
    const sheetPrint = $('#btn-sheet-print');
    if (sheetPrint) sheetPrint.addEventListener('click', () => {
      document.body.classList.add('printing-sheet');
      const done = () => document.body.classList.remove('printing-sheet');
      window.addEventListener('afterprint', done, { once: true });
      setTimeout(() => { window.print(); setTimeout(done, 1200); }, 40);
    });
    const sheetClose = $('#btn-sheet-close');
    if (sheetClose) sheetClose.addEventListener('click', () => closeModal('sheet-modal'));

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
      parentUnlocked = false;
      show('home');
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

    // 切到后台就停掉自主行为，回来再继续，别偷偷耗电
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) roomBrainStop();
      else if (activeScreen === 'room') roomBrainStart(1200);
    });
  }

  // 启动
  document.addEventListener('DOMContentLoaded', init);

  return {
    get state() { return state; },
    show, showStages, toast, markDay, finishSession, finishMini, trackAtlas,
    refreshHud, maybeGuide, confirm,
    addWrong, dueReview, reviewWrong, finishReview, finishPractice, refreshReviewBadge,
    bandInfo, recentAccuracy, noteMastery, masteryLevel, weakPoints, knowledgeProgress, unlockUpTo,
    applyPlacement, applySkipTest, stageUnlocked
  };
})();
