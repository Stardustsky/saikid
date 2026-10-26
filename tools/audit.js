/* 题库自检：用 Node 直接加载 data.js + quiz-core.js，检查课程、题型、笔顺、读本、应用题
   运行：npm test（或 node tools/audit.js），有问题时退出码为 1 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const problems = [];
const bad = (msg) => problems.push(msg);

/* ---------- 1. 在沙箱里加载浏览器脚本 ---------- */
const sandbox = {
  console,
  // 只用到这几个接口，给最小桩即可
  Art: { em: (s) => '<span class="em">' + s + '</span>' },
  AudioFX: {
    speak() {},
    speakSegments() {},
    pyAudio: { sheng: () => '', yun: () => '', yinjie: () => '' }
  }
};
sandbox.globalThis = sandbox;
sandbox.window = sandbox;
vm.createContext(sandbox);

['assets/js/data.js', 'assets/js/quiz-core.js'].forEach((f) => {
  const file = path.join(ROOT, f);
  const code = fs.readFileSync(file, 'utf8');
  try {
    vm.runInContext(code, sandbox, { filename: f });
  } catch (e) {
    console.error('✗ 加载失败 ' + f + '：' + e.message);
    process.exit(1);
  }
});
vm.runInContext('globalThis.DATA = DATA; globalThis.Quiz = Quiz;', sandbox);
const DATA = sandbox.DATA;
const Quiz = sandbox.Quiz;

if (!DATA || !DATA.curriculum) {
  console.error('✗ 没有读到 DATA.curriculum');
  process.exit(1);
}
if (!Quiz || !Quiz.BUILDERS) {
  console.error('✗ 没有读到 Quiz.BUILDERS');
  process.exit(1);
}

/* ---------- 2. 课程与题型 ---------- */
const subjectKeys = Object.keys(DATA.curriculum);
const stageIds = new Set();
const qtypes = new Set();
const namedTypes = new Set();
let stageCount = 0;

subjectKeys.forEach((key) => {
  const subject = DATA.curriculum[key];
  if (subject.key !== key) bad('学科 ' + key + ' 的 key 字段不一致');
  if (!subject.name) bad('学科 ' + key + ' 缺少 name');
  if (!Array.isArray(subject.stages) || !subject.stages.length) {
    bad('学科 ' + key + ' 没有阶段');
    return;
  }
  subject.stages.forEach((st) => {
    stageCount++;
    if (!st.id) bad('学科 ' + key + ' 有阶段缺少 id');
    else if (stageIds.has(st.id)) bad('阶段 id 重复：' + st.id);
    else stageIds.add(st.id);
    if (!st.name || !st.desc) bad('阶段 ' + (st.id || '?') + ' 缺少 name/desc');
    if (!Array.isArray(st.qtypes) || !st.qtypes.length) {
      bad('阶段 ' + st.id + ' 的 qtypes 为空');
      return;
    }
    st.qtypes.forEach((t) => {
      qtypes.add(t);
      if (!Quiz.BUILDERS[t]) bad('阶段 ' + st.id + ' 引用了不存在的题型：' + t);
      if (!Quiz.TYPE_NAMES[t] && !namedTypes.has(t)) {
        bad('题型 ' + t + ' 缺少 TYPE_NAMES 短名');
        namedTypes.add(t);
      }
    });
  });
});

/* ---------- 3. 每个阶段的题目都能生成 ---------- */
const REQUIRED = ['key', 'title', 'visual', 'answer', 'options'];
let questionCount = 0;

subjectKeys.forEach((key) => {
  DATA.curriculum[key].stages.forEach((st) => {
    if (!Array.isArray(st.qtypes)) return;
    st.qtypes.forEach((type) => {
      if (!Quiz.BUILDERS[type]) return;
      for (let i = 0; i < 6; i++) {
        let q = null;
        try {
          q = Quiz.build(type, st);
        } catch (e) {
          bad('阶段 ' + st.id + ' 的题型 ' + type + ' 出题报错：' + e.message);
          break;
        }
        if (!q) {
          bad('阶段 ' + st.id + ' 的题型 ' + type + ' 返回空题');
          break;
        }
        questionCount++;
        REQUIRED.forEach((k) => {
          if (q[k] == null || q[k] === '') bad('题型 ' + type + ' 的题目缺少 ' + k);
        });
        if (!Array.isArray(q.options) || q.options.length < 2) {
          bad('题型 ' + type + ' 的选项少于 2 个');
          break;
        }
        const right = q.options.filter((o) => o && o.correct).length;
        if (right !== 1) bad('题型 ' + type + ' 的正确选项数为 ' + right + '（应为 1）');
      }
    });
  });
});

/* ---------- 4. 笔顺 ---------- */
const STROKES = ['横', '竖', '撇', '点', '折', '钩', '捺', '提'];
const chars = new Set();
(DATA.strokes || []).forEach((s) => {
  if (chars.has(s.c)) bad('笔顺字重复：' + s.c);
  chars.add(s.c);
  if (!s.p) bad('笔顺「' + s.c + '」缺少拼音');
  if (!Array.isArray(s.st) || !s.st.length) {
    bad('笔顺「' + s.c + '」缺少 st 数组');
    return;
  }
  if (s.st[0] !== s.first) bad('笔顺「' + s.c + '」首笔 st[0] 与 first 不一致');
  s.st.forEach((n) => {
    if (STROKES.indexOf(n) < 0) bad('笔顺「' + s.c + '」出现未知笔画：' + n);
  });
});

/* ---------- 5. 分级读本 ---------- */
const readerIds = new Set();
(DATA.readers || []).forEach((r) => {
  if (!r.id) bad('读本缺少 id');
  else if (readerIds.has(r.id)) bad('读本 id 重复：' + r.id);
  else readerIds.add(r.id);
  if (!r.title) bad('读本 ' + r.id + ' 缺少 title');
  if (!Array.isArray(r.lines) || r.lines.length < 2) bad('读本 ' + r.id + ' 少于 2 行');
  (r.lines || []).forEach((l, i) => {
    if (!l.en || !l.zh) bad('读本 ' + r.id + ' 第 ' + (i + 1) + ' 行缺少中英文');
  });
});

/* ---------- 6. 应用题模板 ---------- */
(DATA.storyTemplates || []).forEach((t, i) => {
  const name = '应用题模板 #' + (i + 1);
  if (t.op !== '+' && t.op !== '-') bad(name + ' 的 op 只能是 + 或 -');
  if (!t.text || t.text.indexOf('{a}') < 0 || t.text.indexOf('{b}') < 0) {
    bad(name + ' 的文本缺少 {a} / {b} 占位符');
  }
  if (!Array.isArray(t.who) || !t.who.length) bad(name + ' 缺少 who 列表');
  if (!t.emoji || !t.unit) bad(name + ' 缺少 emoji / unit');
});

/* ---------- 7. 分组与素材 ---------- */
const grouped = new Set();
(DATA.subjectGroups || []).forEach((g) => {
  (g.subjects || []).forEach((s) => {
    if (!DATA.curriculum[s]) bad('分组 ' + g.key + ' 引用了不存在的学科：' + s);
    grouped.add(s);
  });
});
subjectKeys.forEach((k) => {
  if (!grouped.has(k)) bad('学科 ' + k + ' 没有出现在任何 subjectGroups 里');
});
if ((DATA.letters || []).length !== 26) bad('字母表应为 26 个，实际 ' + (DATA.letters || []).length);
(DATA.words || []).forEach((w) => {
  if (!w.en || !w.zh || !w.emoji || !w.theme) bad('单词 ' + (w.en || '?') + ' 字段不完整');
});

/* ---------- 8. 本地音频素材 ---------- */
function syllableKey(p) {
  let base = '';
  let tone = 0;
  for (const ch of String(p).normalize('NFD')) {
    if (ch === '\u0304') tone = 1;
    else if (ch === '\u0301') tone = 2;
    else if (ch === '\u030C') tone = 3;
    else if (ch === '\u0300') tone = 4;
    else if (ch === '\u0308') base = base.slice(0, -1) + 'v';
    else if (ch >= '\u0300' && ch <= '\u036f') continue;
    else base += ch;
  }
  return base + (tone || 5);
}

const missingAudio = [];
const hasAudio = (rel) => fs.existsSync(path.join(ROOT, rel));
const py = DATA.pinyin || {};
(py.initials || []).forEach((i) => {
  const rel = 'assets/audio/pinyin/sheng/' + i.p + '.mp3';
  if (!hasAudio(rel)) missingAudio.push(rel);
});
(py.localFinals || []).forEach((f) => {
  const rel = 'assets/audio/pinyin/yun/' + String(f).replace(/ü/g, 'v') + '.mp3';
  if (!hasAudio(rel)) missingAudio.push(rel);
});
(py.syllables || []).forEach((s) => {
  if (s.local === false) return;
  const rel = 'assets/audio/pinyin/yinjie/' + syllableKey(s.p) + '.mp3';
  if (!hasAudio(rel)) missingAudio.push(rel);
});
['click', 'correct', 'wrong', 'coin', 'pop', 'levelUp', 'care'].forEach((n) => {
  const rel = 'assets/audio/sfx/' + n + '.wav';
  if (!hasAudio(rel)) missingAudio.push(rel);
});
missingAudio.forEach((rel) => bad('缺少音频文件：' + rel));

/* ---------- 输出 ---------- */
if (problems.length) {
  console.error('✗ 题库自检发现 ' + problems.length + ' 个问题：');
  problems.slice(0, 80).forEach((p) => console.error('  - ' + p));
  if (problems.length > 80) console.error('  …还有 ' + (problems.length - 80) + ' 条');
  process.exit(1);
}

console.log(
  '✓ 题库自检通过：' + subjectKeys.length + ' 个学科 / ' + stageCount + ' 个阶段 / ' +
  qtypes.size + ' 种题型 / ' + questionCount + ' 道抽检题 / ' +
  (DATA.strokes || []).length + ' 个笔顺字 / ' + (DATA.readers || []).length + ' 篇读本'
);
