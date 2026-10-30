/* 小龙猫离线语音包构建脚本
 * 用法：node tools/build_cat_voice.js [--force]
 * 从 pet.js / games.js / minigames.js / app.js 里抽出小龙猫要说的中文台词，
 * 用微软 Edge 在线朗读的儿童音色逐句合成 mp3，存到 assets/audio/cat/，
 * 并生成 assets/js/cat-voice.js 清单。
 * 依赖：Python 3 + `pip install edge-tts`（只在本机构建时用，产物是纯静态 mp3）
 * 已存在的句子会跳过；改了音色参数会自动全部重录，改了台词再跑一次即可增量更新。
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFile } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'assets/audio/cat');
const OUT_JS = path.join(ROOT, 'assets/js/cat-voice.js');

/* 音色：zh-CN-YunxiaNeural 是卡通可爱的男童音，配 pitch +30Hz、语速 -8%
 * 听起来像幼儿园小男孩；想换音色只改这三行，然后跑 node tools/build_cat_voice.js --force */
const VOICE = 'zh-CN-YunxiaNeural';
const PITCH = '+30Hz';
const RATE = '-8%';
const VOICE_KEY = VOICE + '|' + PITCH + '|' + RATE;

/* ---------- 抽取台词 ---------- */

function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), 'utf8');
}

function uniq(list) {
  return list.filter((s, i) => s && list.indexOf(s) === i);
}

// 从一段源码里抽出「中文句子」：只认独占一行的完整字面量，
// 拼接出来的半截句子（'…' + name + '…'）自然被排除
function cjkLines(src) {
  const out = [];
  src.split('\n').forEach(line => {
    const m = line.match(/^\s*'([^'\n]*)',?\s*$/);
    if (!m) return;
    const s = m[1];
    if (!/[\u4e00-\u9fa5]/.test(s)) return;
    if (s.length < 2 || s.length > 60) return;
    out.push(s);
  });
  return out;
}

// 从某个标记块里搜集所有中文短字面量：题库问法、向导口令、表扬语这类数组/对象
function blockLines(src, startMark, endMark) {
  const start = src.indexOf(startMark);
  const end = endMark ? src.indexOf(endMark, start) : -1;
  if (start < 0) return [];
  const block = src.slice(start, end > 0 ? end : src.length);
  const out = [];
  const re = /'([^'\n]*)'/g;
  let m;
  while ((m = re.exec(block))) {
    const s = m[1];
    if (!/[\u4e00-\u9fa5]/.test(s)) continue;
    if (s.length < 2 || s.length > 60) continue;
    if (/[「（(]$/.test(s) || /^[」）)]/.test(s)) continue;
    out.push(s);
  }
  return out;
}

// 题目问法表与「这一步要做什么」向导
function quizTitleLines() {
  return blockLines(read('assets/js/quiz-core.js'), 'const TITLES = {', 'const tv =');
}

function guideLines() {
  return blockLines(read('assets/js/games.js'), 'const GUIDE = {', 'let guideKey');
}

function praiseLines() {
  return blockLines(read('assets/js/games.js'), 'const PRAISE = [', 'let session');
}

// 答错提示、答对鼓励用 AudioFX.speak / showTip 直接念出来，也要用同一套童声
function speakTipLines() {
  const out = [];
  ['assets/js/games.js', 'assets/js/minigames.js', 'assets/js/app.js', 'assets/js/quiz-core.js'].forEach(rel => {
    const src = read(rel);
    ['AudioFX\\.speak\\(\\s*\'', 'showTip\\(\\s*\''].forEach(prefix => {
      const re = new RegExp(prefix + '([^\'\\n]*)', 'g');
      let m;
      while ((m = re.exec(src))) {
        const s = m[1];
        if (!/[\u4e00-\u9fa5]/.test(s)) continue;
        if (s.length < 2 || s.length > 60) continue;
        out.push(s);
      }
    });
  });
  return out;
}

function petLines() {
  const src = read('assets/js/pet.js');
  const start = src.indexOf('function speakLine');
  const end = src.indexOf('return { clamp');
  return cjkLines(src.slice(start, end));
}

// 小屋里龙猫的自主台词与照顾台词：ROOM_*_LINES 数组、ROOM_CARE_LINES 对象
function roomLines() {
  const src = read('assets/js/app.js');
  const start = src.indexOf('const ROOM_WALK_LINES');
  const end = src.indexOf('/* 动作 → 表情');
  if (start < 0 || end < 0) return [];
  const out = [];
  const re = /'([^'\n]*)'/g;
  let m;
  while ((m = re.exec(src.slice(start, end)))) {
    const s = m[1];
    if (!/[\u4e00-\u9fa5]/.test(s)) continue;
    if (s.length < 2 || s.length > 60) continue;
    out.push(s);
  }
  return out;
}

// 直接写死在 speakCat('…') 里的台词（喂养、洗澡、玩耍等即时反馈）
function speakCatLines() {
  const out = [];
  ['assets/js/app.js', 'assets/js/games.js', 'assets/js/minigames.js', 'assets/js/pet.js'].forEach(rel => {
    const src = read(rel);
    const re = /speakCat\(\s*'([^'\n]*)'/g;
    let m;
    while ((m = re.exec(src))) {
      const s = m[1];
      if (!/[\u4e00-\u9fa5]/.test(s)) continue;
      if (s.length < 2 || s.length > 60) continue;
      out.push(s);
    }
  });
  return out;
}

// 商店食物被喂下去时的台词（data.js 里带 hunger 字段的那些）
function shopFoodLines() {
  const out = [];
  read('assets/js/data.js').split('\n').forEach(line => {
    if (!/hunger:/.test(line)) return;
    const m = line.match(/say:\s*'([^'\n]*)'/);
    if (m) out.push(m[1]);
  });
  return out;
}

function configLines() {
  // games.js / minigames.js 里 line: '…' 与 story: '…'、app.js 里小屋心愿的 say: '…'
  const out = [];
  ['assets/js/games.js', 'assets/js/minigames.js', 'assets/js/app.js'].forEach(rel => {
    const src = read(rel);
    const re = /(?:line|story|say):\s*'([^'\n]*)'/g;
    let m;
    while ((m = re.exec(src))) {
      const s = m[1];
      if (!/[\u4e00-\u9fa5]/.test(s)) continue;
      // 后面紧跟 + 说明是拼接句，跳过
      if (/^\s*\+/.test(src.slice(re.lastIndex))) continue;
      if (/[「『（(]$/.test(s) || /^[」』）)]/.test(s)) continue;
      out.push(s);
    }
  });
  return out;
}

// 连续学习天数是拼出来的，常见的 3~12 天先录好，超出范围就用系统语音兜底
function streakLines() {
  const out = [];
  for (let n = 3; n <= 12; n++) {
    out.push('你已经连续来了 ' + n + ' 天啦，真了不起！');
    out.push('连续学习 ' + n + ' 天，我偷偷给你鼓掌～');
    out.push('第 ' + n + ' 天啦！我们已经是老朋友了。');
    out.push('坚持 ' + n + ' 天的你，像小树一样在长大。');
  }
  return out;
}

// 代码里拼出来的句子，单独列出来
const EXTRA = [
  '连对三道，好棒！',
  '连对五题，太厉害啦！',
  '连对八题，太厉害啦！',
  '连对十二题，太厉害啦！',
  '复习完成，错的题越来越少啦！',
  '全部一次答对，你太厉害啦！',
  '过关啦，我们继续往前走！',
  '没关系，小龙猫陪你再试一次！',
  '没关系，再试一次',
  '三颗星！你把这一局学得明明白白～',
  '完成啦！再玩一次，我们一起冲三颗星～',
  '没关系，我陪你再来一次，慢慢就会啦～',
  '心愿实现啦，谢谢你！',
  '小屋变得更舒服啦，谢谢你！',
  '这里也不错，谢谢你帮我搬家～'
];

/* ---------- 合成 ---------- */

function fileName(text) {
  return crypto.createHash('sha1').update(text).digest('hex').slice(0, 12) + '.mp3';
}

// 调 Python 的 edge-tts，把一句台词合成到指定文件
function synth(text, dest) {
  return new Promise((resolve, reject) => {
    execFile(process.env.PYTHON || 'python', [
      '-m', 'edge_tts',
      '--voice=' + VOICE,
      '--pitch=' + PITCH,
      '--rate=' + RATE,
      '--text=' + text,
      '--write-media=' + dest
    ], { timeout: 40000, windowsHide: true }, err => {
      if (err) { reject(err); return; }
      resolve();
    });
  });
}

// 真正的 mp3 至少几 KB；开头是 ID3 或帧同步字，防止把错误页当音频存下来
function looksLikeMp3(file) {
  if (!fs.existsSync(file)) return false;
  const size = fs.statSync(file).size;
  if (size < 1500) return false;
  const head = fs.readFileSync(file, { encoding: null, flag: 'r' }).slice(0, 3);
  if (head.toString('ascii') === 'ID3') return true;
  return head[0] === 0xff && (head[1] & 0xe0) === 0xe0;
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function fetchOne(text, file, force) {
  const dest = path.join(OUT_DIR, file);
  if (!force && looksLikeMp3(dest)) return 'skip';
  for (let i = 0; i < 3; i++) {
    try {
      if (fs.existsSync(dest)) fs.unlinkSync(dest);
      await synth(text, dest);
      if (!looksLikeMp3(dest)) throw new Error('音频不完整');
      return 'ok';
    } catch (e) {
      if (i === 2) return 'fail: ' + (e.message || e);
      await sleep(800 * (i + 1));
    }
  }
  return 'fail';
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  // 音色参数变了就全部重录，避免新旧音色混在一起
  const stampFile = path.join(OUT_DIR, '.voice');
  const oldKey = fs.existsSync(stampFile) ? fs.readFileSync(stampFile, 'utf8').trim() : '';
  const force = process.argv.indexOf('--force') >= 0 || oldKey !== VOICE_KEY;

  const lines = uniq(
    petLines().concat(roomLines(), quizTitleLines(), guideLines(), praiseLines(),
      speakTipLines(), configLines(), speakCatLines(), shopFoodLines(), streakLines(), EXTRA)
  );
  console.log('音色：' + VOICE + ' pitch=' + PITCH + ' rate=' + RATE);
  console.log('待生成台词：' + lines.length + ' 句' + (force ? '（音色变更，全部重录）' : ''));

  const map = {};
  let ok = 0, skip = 0, fail = 0;
  const queue = lines.slice();
  const workers = Array.from({ length: 3 }, async () => {
    for (;;) {
      const text = queue.shift();
      if (text === undefined) return;
      const file = fileName(text);
      const r = await fetchOne(text, file, force);
      if (r === 'ok') { ok++; map[text] = 'assets/audio/cat/' + file; }
      else if (r === 'skip') { skip++; map[text] = 'assets/audio/cat/' + file; }
      else { fail++; console.log('  失败：' + text + ' → ' + r); }
      await sleep(120);
    }
  });
  await Promise.all(workers);

  const keys = Object.keys(map).sort();
  const body = keys.map(k => '  ' + JSON.stringify(k) + ': ' + JSON.stringify(map[k])).join(',\n');
  const js = '/* 小龙猫离线语音清单：台词 → 本地音频，由 tools/build_cat_voice.js 生成，请勿手改 */\n' +
    'const CAT_VOICE = {\n' + body + '\n};\n';
  fs.writeFileSync(OUT_JS, js);

  // 清掉台词改动后遗留的旧音频
  const keep = new Set(keys.map(k => path.basename(map[k])));
  let removed = 0;
  fs.readdirSync(OUT_DIR).forEach(f => {
    if (!/\.mp3$/.test(f) || keep.has(f)) return;
    fs.unlinkSync(path.join(OUT_DIR, f));
    removed++;
  });

  if (fail === 0) fs.writeFileSync(stampFile, VOICE_KEY + '\n');

  console.log('新增 ' + ok + ' 句，已存在 ' + skip + ' 句，失败 ' + fail + ' 句，清理 ' + removed + ' 个旧文件');
  console.log('清单已写入 assets/js/cat-voice.js');
}

main().catch(e => { console.error(e); process.exit(1); });
