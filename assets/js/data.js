/* 小龙猫乐园 · 课程体系、题库与商店数据 */
const DATA = {
  // 数数用的小图案
  countEmojis: ['🍎', '🐣', '⭐', '🎈', '🍓', '🐟', '🌸', '🦋', '🍊', '🐞', '🍭', '🐳'],

  // 26 个字母 + 例词
  letters: [
    { u: 'A', l: 'a', word: 'apple', zh: '苹果', emoji: '🍎' },
    { u: 'B', l: 'b', word: 'bear', zh: '小熊', emoji: '🐻' },
    { u: 'C', l: 'c', word: 'cat', zh: '小猫', emoji: '🐱' },
    { u: 'D', l: 'd', word: 'duck', zh: '鸭子', emoji: '🦆' },
    { u: 'E', l: 'e', word: 'egg', zh: '鸡蛋', emoji: '🥚' },
    { u: 'F', l: 'f', word: 'fish', zh: '小鱼', emoji: '🐟' },
    { u: 'G', l: 'g', word: 'grapes', zh: '葡萄', emoji: '🍇' },
    { u: 'H', l: 'h', word: 'hat', zh: '帽子', emoji: '👒' },
    { u: 'I', l: 'i', word: 'ice', zh: '冰块', emoji: '🧊' },
    { u: 'J', l: 'j', word: 'juice', zh: '果汁', emoji: '🧃' },
    { u: 'K', l: 'k', word: 'key', zh: '钥匙', emoji: '🔑' },
    { u: 'L', l: 'l', word: 'lion', zh: '狮子', emoji: '🦁' },
    { u: 'M', l: 'm', word: 'moon', zh: '月亮', emoji: '🌙' },
    { u: 'N', l: 'n', word: 'nose', zh: '鼻子', emoji: '👃' },
    { u: 'O', l: 'o', word: 'orange', zh: '橙子', emoji: '🍊' },
    { u: 'P', l: 'p', word: 'panda', zh: '熊猫', emoji: '🐼' },
    { u: 'Q', l: 'q', word: 'queen', zh: '女王', emoji: '👑' },
    { u: 'R', l: 'r', word: 'rabbit', zh: '兔子', emoji: '🐰' },
    { u: 'S', l: 's', word: 'sun', zh: '太阳', emoji: '☀️' },
    { u: 'T', l: 't', word: 'tiger', zh: '老虎', emoji: '🐯' },
    { u: 'U', l: 'u', word: 'umbrella', zh: '雨伞', emoji: '☂️' },
    { u: 'V', l: 'v', word: 'violin', zh: '小提琴', emoji: '🎻' },
    { u: 'W', l: 'w', word: 'whale', zh: '鲸鱼', emoji: '🐳' },
    { u: 'X', l: 'x', word: 'fox', zh: '狐狸', emoji: '🦊' },
    { u: 'Y', l: 'y', word: 'yarn', zh: '毛线', emoji: '🧶' },
    { u: 'Z', l: 'z', word: 'zebra', zh: '斑马', emoji: '🦓' }
  ],

  // 英文单词：按主题分组，方便分阶段学习
  words: [
    // 动物
    { en: 'cat', zh: '小猫', emoji: '🐱', theme: 'animal' },
    { en: 'dog', zh: '小狗', emoji: '🐶', theme: 'animal' },
    { en: 'bird', zh: '小鸟', emoji: '🐦', theme: 'animal' },
    { en: 'fish', zh: '小鱼', emoji: '🐟', theme: 'animal' },
    { en: 'bear', zh: '小熊', emoji: '🐻', theme: 'animal' },
    { en: 'duck', zh: '鸭子', emoji: '🦆', theme: 'animal' },
    { en: 'frog', zh: '青蛙', emoji: '🐸', theme: 'animal' },
    { en: 'pig', zh: '小猪', emoji: '🐷', theme: 'animal' },
    { en: 'cow', zh: '奶牛', emoji: '🐮', theme: 'animal' },
    { en: 'rabbit', zh: '兔子', emoji: '🐰', theme: 'animal' },
    { en: 'lion', zh: '狮子', emoji: '🦁', theme: 'animal' },
    { en: 'tiger', zh: '老虎', emoji: '🐯', theme: 'animal' },
    // 食物
    { en: 'apple', zh: '苹果', emoji: '🍎', theme: 'food' },
    { en: 'banana', zh: '香蕉', emoji: '🍌', theme: 'food' },
    { en: 'milk', zh: '牛奶', emoji: '🥛', theme: 'food' },
    { en: 'cake', zh: '蛋糕', emoji: '🍰', theme: 'food' },
    { en: 'egg', zh: '鸡蛋', emoji: '🥚', theme: 'food' },
    { en: 'bread', zh: '面包', emoji: '🍞', theme: 'food' },
    { en: 'rice', zh: '米饭', emoji: '🍚', theme: 'food' },
    { en: 'water', zh: '水', emoji: '💧', theme: 'food' },
    { en: 'grapes', zh: '葡萄', emoji: '🍇', theme: 'food' },
    { en: 'orange', zh: '橙子', emoji: '🍊', theme: 'food' },
    // 身边物品
    { en: 'ball', zh: '皮球', emoji: '⚽', theme: 'item' },
    { en: 'book', zh: '书本', emoji: '📖', theme: 'item' },
    { en: 'hat', zh: '帽子', emoji: '👒', theme: 'item' },
    { en: 'shoe', zh: '鞋子', emoji: '👟', theme: 'item' },
    { en: 'chair', zh: '椅子', emoji: '🪑', theme: 'item' },
    { en: 'bed', zh: '小床', emoji: '🛏️', theme: 'item' },
    { en: 'cup', zh: '杯子', emoji: '🥤', theme: 'item' },
    { en: 'key', zh: '钥匙', emoji: '🔑', theme: 'item' },
    { en: 'pencil', zh: '铅笔', emoji: '✏️', theme: 'item' },
    { en: 'bag', zh: '书包', emoji: '🎒', theme: 'item' },
    // 大自然
    { en: 'sun', zh: '太阳', emoji: '☀️', theme: 'nature' },
    { en: 'moon', zh: '月亮', emoji: '🌙', theme: 'nature' },
    { en: 'star', zh: '星星', emoji: '⭐', theme: 'nature' },
    { en: 'tree', zh: '大树', emoji: '🌳', theme: 'nature' },
    { en: 'flower', zh: '花朵', emoji: '🌸', theme: 'nature' },
    { en: 'cloud', zh: '白云', emoji: '☁️', theme: 'nature' },
    { en: 'rain', zh: '下雨', emoji: '🌧️', theme: 'nature' },
    { en: 'sky', zh: '天空', emoji: '🌤️', theme: 'nature' },
    { en: 'grass', zh: '小草', emoji: '🌿', theme: 'nature' },
    { en: 'leaf', zh: '叶子', emoji: '🍃', theme: 'nature' },
    // 车车与家
    { en: 'car', zh: '汽车', emoji: '🚗', theme: 'vehicle' },
    { en: 'bus', zh: '公交车', emoji: '🚌', theme: 'vehicle' },
    { en: 'train', zh: '火车', emoji: '🚂', theme: 'vehicle' },
    { en: 'bike', zh: '自行车', emoji: '🚲', theme: 'vehicle' },
    { en: 'plane', zh: '飞机', emoji: '✈️', theme: 'vehicle' },
    { en: 'boat', zh: '小船', emoji: '⛵', theme: 'vehicle' },
    { en: 'house', zh: '房子', emoji: '🏠', theme: 'vehicle' },
    { en: 'door', zh: '大门', emoji: '🚪', theme: 'vehicle' }
  ],

  // 汉字：按类别分组
  hanzi: [
    // 数字
    { c: '一', p: 'yī', word: '一个', emoji: '1️⃣', cat: 'num' },
    { c: '二', p: 'èr', word: '两个', emoji: '2️⃣', cat: 'num' },
    { c: '三', p: 'sān', word: '三个', emoji: '3️⃣', cat: 'num' },
    { c: '四', p: 'sì', word: '四个', emoji: '4️⃣', cat: 'num' },
    { c: '五', p: 'wǔ', word: '五个', emoji: '5️⃣', cat: 'num' },
    { c: '六', p: 'liù', word: '六个', emoji: '6️⃣', cat: 'num' },
    { c: '七', p: 'qī', word: '七个', emoji: '7️⃣', cat: 'num' },
    { c: '八', p: 'bā', word: '八个', emoji: '8️⃣', cat: 'num' },
    { c: '九', p: 'jiǔ', word: '九个', emoji: '9️⃣', cat: 'num' },
    { c: '十', p: 'shí', word: '十个', emoji: '🔟', cat: 'num' },
    // 大自然
    { c: '日', p: 'rì', word: '太阳', emoji: '☀️', cat: 'nature' },
    { c: '月', p: 'yuè', word: '月亮', emoji: '🌙', cat: 'nature' },
    { c: '山', p: 'shān', word: '大山', emoji: '⛰️', cat: 'nature' },
    { c: '水', p: 'shuǐ', word: '水滴', emoji: '💧', cat: 'nature' },
    { c: '火', p: 'huǒ', word: '火焰', emoji: '🔥', cat: 'nature' },
    { c: '木', p: 'mù', word: '木头', emoji: '🪵', cat: 'nature' },
    { c: '花', p: 'huā', word: '花朵', emoji: '🌸', cat: 'nature' },
    { c: '草', p: 'cǎo', word: '小草', emoji: '🌿', cat: 'nature' },
    { c: '云', p: 'yún', word: '白云', emoji: '☁️', cat: 'nature' },
    { c: '星', p: 'xīng', word: '星星', emoji: '⭐', cat: 'nature' },
    { c: '雨', p: 'yǔ', word: '下雨', emoji: '🌧️', cat: 'nature' },
    { c: '石', p: 'shí', word: '石头', emoji: '🪨', cat: 'nature' },
    // 小动物
    { c: '鸟', p: 'niǎo', word: '小鸟', emoji: '🐦', cat: 'animal' },
    { c: '鱼', p: 'yú', word: '小鱼', emoji: '🐟', cat: 'animal' },
    { c: '马', p: 'mǎ', word: '小马', emoji: '🐴', cat: 'animal' },
    { c: '牛', p: 'niú', word: '奶牛', emoji: '🐮', cat: 'animal' },
    { c: '羊', p: 'yáng', word: '小羊', emoji: '🐑', cat: 'animal' },
    { c: '兔', p: 'tù', word: '小兔', emoji: '🐰', cat: 'animal' },
    { c: '猫', p: 'māo', word: '小猫', emoji: '🐱', cat: 'animal' },
    { c: '狗', p: 'gǒu', word: '小狗', emoji: '🐶', cat: 'animal' },
    { c: '猪', p: 'zhū', word: '小猪', emoji: '🐷', cat: 'animal' },
    { c: '鸡', p: 'jī', word: '小鸡', emoji: '🐔', cat: 'animal' },
    { c: '虫', p: 'chóng', word: '小虫', emoji: '🐛', cat: 'animal' },
    // 我的身体
    { c: '人', p: 'rén', word: '小朋友', emoji: '🧒', cat: 'body' },
    { c: '口', p: 'kǒu', word: '嘴巴', emoji: '👄', cat: 'body' },
    { c: '手', p: 'shǒu', word: '小手', emoji: '✋', cat: 'body' },
    { c: '目', p: 'mù', word: '眼睛', emoji: '👁️', cat: 'body' },
    { c: '耳', p: 'ěr', word: '耳朵', emoji: '👂', cat: 'body' },
    { c: '心', p: 'xīn', word: '爱心', emoji: '❤️', cat: 'body' },
    { c: '头', p: 'tóu', word: '脑袋', emoji: '🧠', cat: 'body' },
    { c: '足', p: 'zú', word: '小脚', emoji: '🦶', cat: 'body' },
    // 生活用品
    { c: '车', p: 'chē', word: '汽车', emoji: '🚗', cat: 'life' },
    { c: '门', p: 'mén', word: '大门', emoji: '🚪', cat: 'life' },
    { c: '书', p: 'shū', word: '书本', emoji: '📖', cat: 'life' },
    { c: '笔', p: 'bǐ', word: '铅笔', emoji: '✏️', cat: 'life' },
    { c: '米', p: 'mǐ', word: '大米', emoji: '🍚', cat: 'life' },
    { c: '果', p: 'guǒ', word: '苹果', emoji: '🍎', cat: 'life' },
    { c: '灯', p: 'dēng', word: '灯笼', emoji: '🏮', cat: 'life' },
    { c: '树', p: 'shù', word: '大树', emoji: '🌳', cat: 'life' },
    { c: '田', p: 'tián', word: '田地', emoji: '🌾', cat: 'life' },
    { c: '床', p: 'chuáng', word: '小床', emoji: '🛏️', cat: 'life' }
  ],

  // 拼音：声母、韵母、音节
  pinyin: {
    initials: [
      { p: 'b', word: '爸爸', emoji: '👨' },
      { p: 'p', word: '苹果', emoji: '🍎' },
      { p: 'm', word: '妈妈', emoji: '👩' },
      { p: 'f', word: '风车', emoji: '🎡' },
      { p: 'd', word: '大象', emoji: '🐘' },
      { p: 't', word: '兔子', emoji: '🐰' },
      { p: 'n', word: '牛奶', emoji: '🥛' },
      { p: 'l', word: '老虎', emoji: '🐯' },
      { p: 'g', word: '哥哥', emoji: '👦' },
      { p: 'k', word: '蝌蚪', emoji: '🐸' },
      { p: 'h', word: '喝水', emoji: '🥤' },
      { p: 'j', word: '小鸡', emoji: '🐔' },
      { p: 'q', word: '西瓜', emoji: '🍉' },
      { p: 'x', word: '星星', emoji: '⭐' },
      { p: 'zh', word: '蜘蛛', emoji: '🕷️' },
      { p: 'ch', word: '吃饭', emoji: '🍚' },
      { p: 'sh', word: '狮子', emoji: '🦁' },
      { p: 'r', word: '太阳', emoji: '☀️' },
      { p: 'z', word: '写字', emoji: '✍️' },
      { p: 'c', word: '小草', emoji: '🌿' },
      { p: 's', word: '丝瓜', emoji: '🥒' },
      { p: 'y', word: '衣服', emoji: '👕' },
      { p: 'w', word: '乌鸦', emoji: '🐦' }
    ],
    /* 韵母：单韵母 6 + 复韵母 9 + 鼻韵母 9，顺序必须与课程 group 下标一致 */
    finals: [
      { p: 'a', word: '啊', emoji: '😮', kind: 'single' },
      { p: 'o', word: '喔', emoji: '🐓', kind: 'single' },
      { p: 'e', word: '鹅', emoji: '🦢', kind: 'single' },
      { p: 'i', word: '衣服', emoji: '👕', kind: 'single' },
      { p: 'u', word: '乌鸦', emoji: '🐦', kind: 'single' },
      { p: 'ü', word: '小鱼', emoji: '🐟', kind: 'single' },
      { p: 'ai', word: '爱心', emoji: '❤️', kind: 'compound' },
      { p: 'ei', word: '妹妹', emoji: '👧', kind: 'compound' },
      { p: 'ui', word: '水杯', emoji: '🥤', kind: 'compound' },
      { p: 'ao', word: '桃子', emoji: '🍑', kind: 'compound' },
      { p: 'ou', word: '海鸥', emoji: '🕊️', kind: 'compound' },
      { p: 'iu', word: '气球', emoji: '🎈', kind: 'compound' },
      { p: 'ie', word: '鞋子', emoji: '👟', kind: 'compound' },
      { p: 'üe', word: '月亮', emoji: '🌙', kind: 'compound' },
      { p: 'er', word: '耳朵', emoji: '👂', kind: 'compound' },
      { p: 'an', word: '大山', emoji: '⛰️', kind: 'nasal' },
      { p: 'en', word: '大门', emoji: '🚪', kind: 'nasal' },
      { p: 'in', word: '爱心', emoji: '💗', kind: 'nasal' },
      { p: 'un', word: '轮子', emoji: '🛞', kind: 'nasal' },
      { p: 'ün', word: '白云', emoji: '☁️', kind: 'nasal' },
      { p: 'ang', word: '糖果', emoji: '🍬', kind: 'nasal' },
      { p: 'eng', word: '台灯', emoji: '💡', kind: 'nasal' },
      { p: 'ing', word: '星星', emoji: '⭐', kind: 'nasal' },
      { p: 'ong', word: '闹钟', emoji: '⏰', kind: 'nasal' }
    ],
    /* 本地有 mp3 的韵母（24 个已全部下载到 assets/audio/pinyin/yun） */
    localFinals: ['a', 'o', 'e', 'i', 'u', 'ü',
      'ai', 'ei', 'ui', 'ao', 'ou', 'iu', 'ie', 'üe', 'er',
      'an', 'en', 'in', 'un', 'ün', 'ang', 'eng', 'ing', 'ong'],
    /* 中文同音字：让朗读发出声母、韵母本身的声音，而不是英文字母名 */
    initialSay: {
      b: '玻', p: '坡', m: '摸', f: '佛', d: '得', t: '特', n: '讷', l: '勒',
      g: '哥', k: '科', h: '喝', j: '鸡', q: '七', x: '西',
      zh: '知', ch: '吃', sh: '诗', r: '日', z: '资', c: '刺', s: '丝', y: '衣', w: '乌'
    },
    finalSay: {
      a: '啊', o: '喔', e: '鹅', i: '衣', u: '乌', 'ü': '鱼',
      ai: '哀', ei: '诶', ui: '威', ao: '凹', ou: '欧', iu: '优', ie: '耶', 'üe': '约', er: '儿',
      an: '安', en: '恩', in: '因', un: '温', 'ün': '晕',
      ang: '昂', eng: '鞥', ing: '英', ong: '翁'
    },
    syllables: [
      { p: 'bā', c: '八', emoji: '8️⃣', tone: 1 },
      { p: 'mā', c: '妈', emoji: '👩', tone: 1 },
      { p: 'mǎ', c: '马', emoji: '🐴', tone: 3 },
      { p: 'má', c: '麻', emoji: '🌿', tone: 2 },
      { p: 'mà', c: '骂', emoji: '😠', tone: 4 },
      { p: 'bǐ', c: '笔', emoji: '✏️', tone: 3 },
      { p: 'bí', c: '鼻', emoji: '👃', tone: 2 },
      { p: 'bì', c: '壁', emoji: '🧱', tone: 4 },
      { p: 'mǐ', c: '米', emoji: '🍚', tone: 3 },
      { p: 'mì', c: '蜜', emoji: '🍯', tone: 4 },
      { p: 'dà', c: '大', emoji: '🐘', tone: 4 },
      { p: 'dā', c: '搭', emoji: '🧱', tone: 1 },
      { p: 'tù', c: '兔', emoji: '🐰', tone: 4 },
      { p: 'tǔ', c: '土', emoji: '🪨', tone: 3 },
      { p: 'nǎi', c: '奶', emoji: '🥛', tone: 3 },
      { p: 'nǎ', c: '哪', emoji: '❓', tone: 3 },
      { p: 'shū', c: '书', emoji: '📖', tone: 1 },
      { p: 'shǔ', c: '鼠', emoji: '🐭', tone: 3 },
      { p: 'shù', c: '树', emoji: '🌳', tone: 4 },
      { p: 'huā', c: '花', emoji: '🌸', tone: 1 },
      { p: 'huǒ', c: '火', emoji: '🔥', tone: 3 },
      { p: 'xuě', c: '雪', emoji: '❄️', tone: 3 },
      { p: 'yǔ', c: '雨', emoji: '🌧️', tone: 3 },
      { p: 'yú', c: '鱼', emoji: '🐟', tone: 2 },
      /* 以下音节没有本地录音，local:false → 交给在线语音，避免 404 */
      { p: 'zhǐ', c: '纸', emoji: '🧻', tone: 3, local: false },
      { p: 'chī', c: '吃', emoji: '🍚', tone: 1, local: false },
      { p: 'shī', c: '狮', emoji: '🦁', tone: 1, local: false },
      { p: 'rì', c: '日', emoji: '☀️', tone: 4, local: false },
      { p: 'zì', c: '字', emoji: '🔤', tone: 4, local: false },
      { p: 'cǎo', c: '草', emoji: '🌿', tone: 3, local: false },
      { p: 'sī', c: '丝', emoji: '🧵', tone: 1, local: false },
      { p: 'yī', c: '衣', emoji: '👕', tone: 1, local: false },
      { p: 'wū', c: '乌', emoji: '🐦', tone: 1, local: false },
      { p: 'bái', c: '白', emoji: '⚪', tone: 2, local: false },
      { p: 'hǎo', c: '好', emoji: '👍', tone: 3, local: false },
      { p: 'māo', c: '猫', emoji: '🐱', tone: 1, local: false },
      { p: 'gǒu', c: '狗', emoji: '🐶', tone: 3, local: false },
      { p: 'niú', c: '牛', emoji: '🐮', tone: 2, local: false },
      { p: 'xié', c: '鞋', emoji: '👟', tone: 2, local: false },
      { p: 'yuè', c: '月', emoji: '🌙', tone: 4, local: false },
      { p: 'ěr', c: '耳', emoji: '👂', tone: 3, local: false },
      { p: 'shān', c: '山', emoji: '⛰️', tone: 1, local: false },
      { p: 'mén', c: '门', emoji: '🚪', tone: 2, local: false },
      { p: 'xīn', c: '心', emoji: '💗', tone: 1, local: false },
      { p: 'chūn', c: '春', emoji: '🌸', tone: 1, local: false },
      { p: 'yún', c: '云', emoji: '☁️', tone: 2, local: false },
      { p: 'táng', c: '糖', emoji: '🍬', tone: 2, local: false },
      { p: 'dēng', c: '灯', emoji: '💡', tone: 1, local: false },
      { p: 'xīng', c: '星', emoji: '⭐', tone: 1, local: false },
      { p: 'hóng', c: '红', emoji: '🔴', tone: 2, local: false },
      { p: 'guā', c: '瓜', emoji: '🍉', tone: 1, local: false },
      { p: 'fēng', c: '风', emoji: '🌬️', tone: 1, local: false },
      { p: 'lǎo', c: '老', emoji: '👴', tone: 3, local: false },
      { p: 'pǎo', c: '跑', emoji: '🏃', tone: 3, local: false },
      { p: 'bēi', c: '杯', emoji: '🥤', tone: 1, local: false },
      { p: 'shuǐ', c: '水', emoji: '💧', tone: 3, local: false },
      { p: 'yáng', c: '羊', emoji: '🐑', tone: 2, local: false }
    ]
  },

  /* 课程体系：每个学科由若干阶段组成，从认知识记到综合运用 */
  curriculum: {
    numbers: {
      key: 'numbers',
      name: '数字乐园',
      icon: '🔢',
      color: '#4fb6ff',
      tag: '数一数 · 认数字',
      intro: [
        '先伸出小手指，指着图上的东西一个一个数。',
        '数到最后一个，就是一共有几个。',
        '数字排队时，后面的数字总比前面大 1 哦。'
      ],
      stages: [
        { id: 'num-1', name: '认识 1~3', desc: '看着图片数一数，认识 1、2、3', icon: '1️⃣', qtypes: ['count', 'quantity'], min: 1, max: 3 },
        { id: 'num-2', name: '认识 4~6', desc: '更大的数字也能数清楚', icon: '4️⃣', qtypes: ['count', 'quantity'], min: 3, max: 6 },
        { id: 'num-3', name: '认识 7~10', desc: '一直数到十，不重不漏', icon: '🔟', qtypes: ['count', 'quantity'], min: 6, max: 10 },
        { id: 'num-7', name: '认识 11~20', desc: '从十一一直数到二十', icon: '🔟', qtypes: ['count', 'next'], min: 11, max: 20 },
        { id: 'num-4', name: '数字接龙', desc: '后面跟着的数字是几呢', icon: '🔗', qtypes: ['next'], max: 20 },
        { id: 'num-5', name: '比一比大小', desc: '谁多谁少，谁大谁小', icon: '⚖️', qtypes: ['compare'], max: 20 },
        { id: 'num-6', name: '找规律', desc: '发现排队的小秘密', icon: '🧩', qtypes: ['pattern'], max: 20 }
      ]
    },
    letters: {
      key: 'letters',
      name: '字母王国',
      icon: '🔤',
      color: '#8b6cff',
      tag: 'ABC · 认字母',
      intro: [
        '每个字母都有大写和小写，比如 A 和 a。',
        '字母有自己的名字和发音，点小喇叭可以多听几遍。',
        '一次只学 5 个字母，记住以后再学下一组。'
      ],
      stages: [
        { id: 'let-a', name: 'A B C D E', desc: '先认识最前面的 5 个字母', icon: '🅰️', qtypes: ['letterListen', 'letterCase'], range: [0, 4] },
        { id: 'let-b', name: 'F G H I J', desc: '接着认识第 6~10 个字母', icon: '🅱️', qtypes: ['letterListen', 'letterCase'], range: [5, 9] },
        { id: 'let-c', name: 'K L M N O', desc: '跟着字母歌唱下去', icon: '🔠', qtypes: ['letterListen', 'letterCase'], range: [10, 14] },
        { id: 'let-d', name: 'P Q R S T', desc: '再认识 5 个新朋友', icon: '🔡', qtypes: ['letterListen', 'letterCase'], range: [15, 19] },
        { id: 'let-e', name: 'U V W X Y Z', desc: '最后 6 个字母也学会啦', icon: '🔤', qtypes: ['letterListen', 'letterCase'], range: [20, 25] },
        { id: 'let-f', name: '大小写配对', desc: '把大写和小写配成一对', icon: '🔁', qtypes: ['letterCase'], range: [0, 25] },
        { id: 'let-g', name: '字母排队', desc: 'A B C… 下一个是谁', icon: '🚂', qtypes: ['letterOrder'], range: [0, 23] }
      ]
    },
    words: {
      key: 'words',
      name: '单词花园',
      icon: '🐻',
      color: '#ff9f43',
      tag: '看图 · 学英语',
      intro: [
        '先看看图片是什么，再猜猜它在英语里叫什么。',
        '点小喇叭听一听，然后跟着大声读出来。',
        '读错了也没关系，多听几次就会啦。'
      ],
      stages: [
        { id: 'word-animal', name: '动物朋友', desc: '猫、狗、鱼、熊……', icon: '🐱', qtypes: ['wordPic', 'wordListen'], theme: 'animal' },
        { id: 'word-food', name: '好吃的', desc: '苹果、香蕉、牛奶……', icon: '🍎', qtypes: ['wordPic', 'wordListen'], theme: 'food' },
        { id: 'word-item', name: '身边的东西', desc: '书、帽子、小床……', icon: '📖', qtypes: ['wordPic', 'wordListen'], theme: 'item' },
        { id: 'word-nature', name: '大自然', desc: '太阳、月亮、大树……', icon: '🌳', qtypes: ['wordPic', 'wordListen'], theme: 'nature' },
        { id: 'word-vehicle', name: '车车与家', desc: '汽车、火车、房子……', icon: '🚗', qtypes: ['wordPic', 'wordListen'], theme: 'vehicle' },
        { id: 'word-all', name: '听音选图', desc: '综合复习全部单词', icon: '👂', qtypes: ['wordMeaning'], theme: 'all' }
      ]
    },
    math: {
      key: 'math',
      name: '算术工坊',
      icon: '➕',
      color: '#3ecf8e',
      tag: '加减 · 乘除',
      intro: [
        '加法就是把两堆东西合在一起，数一数一共多少。',
        '减法就是从一堆里拿走一些，看看还剩多少。',
        '数不清的时候，可以用手指或者圆点帮忙。',
        '乘法就是几个一样的数加在一起，比如 3 个 2 就是 2 + 2 + 2。',
        '除法就是把东西平均分成几份，看看每份有几个。'
      ],
      stages: [
        { id: 'math-add5', name: '5 以内加法', desc: '用圆点帮忙数一数', icon: '➕', qtypes: ['add'], max: 5 },
        { id: 'math-sub5', name: '5 以内减法', desc: '拿走一些，还剩几个', icon: '➖', qtypes: ['sub'], max: 5 },
        { id: 'math-add10', name: '10 以内加法', desc: '两只手就能数清楚', icon: '🔟', qtypes: ['add'], max: 10 },
        { id: 'math-sub10', name: '10 以内减法', desc: '十以内的减法练习', icon: '9️⃣', qtypes: ['sub'], max: 10 },
        { id: 'math-add20', name: '20 以内加法', desc: '挑战更大的数字', icon: '💪', qtypes: ['add'], max: 20 },
        { id: 'math-mix', name: '加减混合', desc: '加法和减法一起来', icon: '🌀', qtypes: ['add', 'sub'], max: 10 },
        { id: 'math-mul5', name: '乘法口诀 2~5', desc: '几个相同的数加在一起', icon: '✖️', qtypes: ['mul'], max: 5 },
        { id: 'math-mul9', name: '乘法口诀 2~9', desc: '九九乘法表挑战', icon: '✳️', qtypes: ['mul'], max: 9 },
        { id: 'math-div5', name: '5 以内除法', desc: '平均分一分，每份有几个', icon: '➗', qtypes: ['div'], max: 5 },
        { id: 'math-div9', name: '9 以内除法', desc: '用乘法口诀反着想', icon: '🔢', qtypes: ['div'], max: 9 }
      ]
    },
    pinyin: {
      key: 'pinyin',
      name: '拼音小路',
      icon: '🎵',
      color: '#ff7fb5',
      tag: '声母 · 拼读',
      intro: [
        '拼音就像汉字的名字，读准声调很重要。',
        '先听小喇叭，再跟着慢慢读一遍。',
        '声母和韵母手拉手，就能拼出一个字。'
      ],
      stages: [
        { id: 'py-initial1', name: '声母 b p m f', desc: '最常用的 4 个声母', icon: '🅱️', qtypes: ['pyInitial'], group: [0, 3] },
        { id: 'py-initial2', name: '声母 d t n l', desc: '再来 4 个声母', icon: '🅳', qtypes: ['pyInitial'], group: [4, 7] },
        { id: 'py-initial3', name: '声母 g k h j q x', desc: '一口气认识 6 个', icon: '🅶', qtypes: ['pyInitial'], group: [8, 13] },
        { id: 'py-initial4', name: '声母 zh ch sh r', desc: '翘舌音要卷起小舌头', icon: '🔤', qtypes: ['pyInitial'], group: [14, 17] },
        { id: 'py-initial5', name: '声母 z c s y w', desc: '平舌音和半元音', icon: '🔡', qtypes: ['pyInitial'], group: [18, 22] },
        { id: 'py-final1', name: '单韵母', desc: 'a o e i u ü 六个韵母', icon: '🅰️', qtypes: ['pyFinal'], group: [0, 5] },
        { id: 'py-final2', name: '复韵母', desc: 'ai ei ui ao ou iu ie üe er', icon: '🌈', qtypes: ['pyFinal'], group: [6, 14] },
        { id: 'py-final3', name: '鼻韵母', desc: 'an en in un ün ang eng ing ong', icon: '🎵', qtypes: ['pyFinal'], group: [15, 23] },
        { id: 'py-syllable', name: '拼一拼', desc: '声母 + 韵母 = 一个字', icon: '🧩', qtypes: ['pySyllable'] },
        { id: 'py-tone', name: '四声调', desc: '一声平、二声扬、三声拐弯、四声降', icon: '🎶', qtypes: ['pyTone'] },
        { id: 'py-char', name: '看字选拼音', desc: '认识的字，拼音是哪个', icon: '📖', qtypes: ['pyChar'], cat: 'all' }
      ]
    },
    hanzi: {
      key: 'hanzi',
      name: '汉字森林',
      icon: '📖',
      color: '#ff8a5c',
      tag: '认字 · 汉字',
      intro: [
        '汉字像一幅小图画，看看它像什么东西。',
        '先听读音，再看图猜一猜意思。',
        '每天认识几个字，慢慢就能认识很多啦。'
      ],
      stages: [
        { id: 'hz-num', name: '数字汉字', desc: '一、二、三……十', icon: '🔢', qtypes: ['hzPic', 'hzMeaning'], cat: 'num' },
        { id: 'hz-nature', name: '大自然', desc: '日月山水火木花草', icon: '🌿', qtypes: ['hzPic', 'hzMeaning'], cat: 'nature' },
        { id: 'hz-animal', name: '小动物', desc: '鸟鱼马牛羊兔猫狗', icon: '🐰', qtypes: ['hzPic', 'hzMeaning'], cat: 'animal' },
        { id: 'hz-body', name: '我的身体', desc: '人口手目耳心头足', icon: '✋', qtypes: ['hzPic', 'hzMeaning'], cat: 'body' },
        { id: 'hz-life', name: '生活用品', desc: '车门书笔米果灯树', icon: '🚪', qtypes: ['hzPic', 'hzMeaning'], cat: 'life' },
        { id: 'hz-listen', name: '听音找字', desc: '听到哪个字，就点哪个字', icon: '👂', qtypes: ['hzListen'], cat: 'all' }
      ]
    }
  },

  // 商店
  shop: {
    food: [
      { id: 'acorn', name: '小橡果', emoji: '🌰', price: 3, hunger: 15, mood: 8, say: '橡果香香的，谢谢你！' },
      { id: 'apple', name: '红苹果', emoji: '🍎', price: 4, hunger: 22, mood: 6, say: '苹果脆脆的，真好吃！' },
      { id: 'carrot', name: '胡萝卜', emoji: '🥕', price: 6, hunger: 28, mood: 3, say: '吃了胡萝卜，眼睛亮晶晶！' },
      { id: 'milk', name: '热牛奶', emoji: '🥛', price: 8, hunger: 18, mood: 10, say: '喝牛奶，长高高～' },
      { id: 'cake', name: '小蛋糕', emoji: '🍰', price: 12, hunger: 20, mood: 22, say: '哇！是甜甜的蛋糕！' },
      { id: 'banana', name: '香蕉', emoji: '🍌', price: 5, hunger: 20, mood: 7, say: '香蕉软软的，一口一口吃掉啦～' },
      { id: 'bread', name: '小面包', emoji: '🍞', price: 7, hunger: 24, mood: 8, say: '面包香喷喷，肚子饱饱的！' },
      { id: 'berry', name: '小草莓', emoji: '🍓', price: 10, hunger: 16, mood: 14, say: '草莓酸酸甜甜，好喜欢！' },
      { id: 'juice', name: '果汁', emoji: '🧃', price: 9, hunger: 14, mood: 12, say: '咕嘟咕嘟，果汁喝光啦～' },
      { id: 'cookie', name: '小饼干', emoji: '🍪', price: 11, hunger: 18, mood: 18, say: '咔嚓咔嚓，饼干真脆！' },
      { id: 'icecream', name: '冰淇淋', emoji: '🍦', price: 15, hunger: 12, mood: 24, say: '冰冰凉凉，好开心呀！' }
    ],
    decor: [
      { id: 'balloon', name: '气球', emoji: '🎈', price: 20, size: 42, say: '气球飘呀飘，小龙猫追着跑～' },
      { id: 'flower', name: '小花', emoji: '🌸', price: 25, size: 36, say: '小花摇一摇，香味飘满小屋！' },
      { id: 'starLamp', name: '星星灯', emoji: '🌟', price: 35, size: 38, say: '星星灯亮起来，小屋暖融融的～' },
      { id: 'tree', name: '小树', emoji: '🌳', price: 40, size: 56, say: '小树沙沙响，像在和你打招呼～' },
      { id: 'horse', name: '摇摇马', emoji: '🐴', price: 50, size: 50, say: '摇摇马晃呀晃，要不要坐上来？' },
      { id: 'rainbow', name: '彩虹', emoji: '🌈', price: 60, size: 48, say: '彩虹弯弯的，像一座小桥！' },
      { id: 'castle', name: '小城堡', emoji: '🏰', price: 90, size: 58, say: '城堡里住着一位小龙猫国王～' },
      { id: 'kite', name: '风筝', emoji: '🪁', price: 30, size: 44, say: '风筝飞得高高的，线要抓紧哦！' },
      { id: 'duck', name: '小黄鸭', emoji: '🦆', price: 32, size: 40, say: '嘎嘎嘎，小黄鸭在和你说话～' },
      { id: 'mushroom', name: '小蘑菇', emoji: '🍄', price: 28, size: 34, say: '蘑菇伞下凉凉的，很适合躲雨～' },
      { id: 'bunny', name: '小兔子', emoji: '🐇', price: 45, size: 42, say: '小兔子蹦蹦跳，想和你做朋友！' },
      { id: 'carousel', name: '旋转木马', emoji: '🎠', price: 70, size: 52, say: '旋转木马转呀转，音乐响起来啦～' },
      { id: 'plant', name: '小盆栽', emoji: '🪴', price: 22, size: 36, say: '小盆栽喝饱水，叶子绿油油！' },
      { id: 'butterfly', name: '小蝴蝶', emoji: '🦋', price: 38, size: 32, say: '小蝴蝶拍了拍翅膀，落在你手上～' },
      { id: 'lantern', name: '小灯笼', emoji: '🏮', price: 34, size: 40, say: '灯笼红红的，小屋亮堂堂！' },
      { id: 'piano', name: '小钢琴', emoji: '🎹', price: 75, size: 50, say: '叮咚叮咚，弹一首给你听～' },
      { id: 'rocket', name: '小火箭', emoji: '🚀', price: 85, size: 46, say: '三、二、一，火箭要发射啦！' },
      { id: 'tent', name: '小帐篷', emoji: '⛺', price: 55, size: 54, say: '钻进帐篷里，就像去露营～' }
    ],
    bg: [
      { id: 'meadow', name: '青青草地', emoji: '🌿', price: 0 },
      { id: 'night', name: '星空夜晚', emoji: '🌙', price: 50 },
      { id: 'sea', name: '海底世界', emoji: '🐠', price: 80 },
      { id: 'candy', name: '糖果乐园', emoji: '🍭', price: 120 },
      { id: 'forest', name: '森林清晨', emoji: '🌲', price: 100 },
      { id: 'snow', name: '雪地小镇', emoji: '⛄', price: 140 }
    ]
  }
};
