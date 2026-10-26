/* 小龙猫离线语音包构建脚本
 * 用法：node tools/build_cat_voice.js
 * 从 pet.js / games.js / minigames.js 里抽出小龙猫要说的中文台词，
 * 逐句下载成 mp3 存到 assets/audio/cat/，并生成 assets/js/cat-voice.js 清单。
 * 已存在的句子会跳过，改了台词再跑一次即可增量更新。
 */
const fs = require('fs');
const path = require('path');
const https = require('https');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'assets/audio/cat');
const OUT_JS = path.join(ROOT, 'assets/js/cat-voice.js');
const SPD = 4; // 1-9，越小越慢；4 是适合小朋友听的速度

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

function petLines() {
  const src = read('assets/js/pet.js');
  const start = src.indexOf('function speakLine');
  const end = src.indexOf('return { clamp');
  return cjkLines(src.slice(start, end));
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
  '小屋变得更舒服啦，谢谢你！'
];

/* ---------- 下载 ---------- */

function fileName(text) {
  return crypto.createHash('sha1').update(text).digest('hex').slice(0, 12) + '.mp3';
}

function ttsUrl(text) {
  return 'https://fanyi.baidu.com/gettts?lan=zh&spd=' + SPD + '&source=web&text=' + encodeURIComponent(text);
}

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
        Referer: 'https://fanyi.baidu.com/translate'
      }
    }, res => {
      if (res.statusCode !== 200) {
        res.resume();
        reject(new Error('HTTP ' + res.statusCode));
        return;
      }
      const chunks = [];
      res.on('data', d => chunks.push(d));
      res.on('end', () => {
        const buf = Buffer.concat(chunks);
        // 正常 mp3 至少几 KB；太小的多半是错误页
        if (buf.length < 1500) { reject(new Error('音频过小 ' + buf.length)); return; }
        fs.writeFileSync(dest, buf);
        resolve(buf.length);
      });
    });
    req.on('error', reject);
    req.setTimeout(20000, () => req.destroy(new Error('超时')));
  });
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function fetchOne(text, file) {
  const dest = path.join(OUT_DIR, file);
  if (fs.existsSync(dest) && fs.statSync(dest).size > 1500) return 'skip';
  for (let i = 0; i < 3; i++) {
    try {
      await download(ttsUrl(text), dest);
      return 'ok';
    } catch (e) {
      if (i === 2) return 'fail: ' + e.message;
      await sleep(600 * (i + 1));
    }
  }
  return 'fail';
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const lines = uniq(petLines().concat(configLines(), streakLines(), EXTRA));
  console.log('待生成台词：' + lines.length + ' 句');

  const map = {};
  let ok = 0, skip = 0, fail = 0;
  const queue = lines.slice();
  const workers = Array.from({ length: 4 }, async () => {
    for (;;) {
      const text = queue.shift();
      if (text === undefined) return;
      const file = fileName(text);
      const r = await fetchOne(text, file);
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

  console.log('新增 ' + ok + ' 句，已存在 ' + skip + ' 句，失败 ' + fail + ' 句，清理 ' + removed + ' 个旧文件');
  console.log('清单已写入 assets/js/cat-voice.js');
}

main().catch(e => { console.error(e); process.exit(1); });
