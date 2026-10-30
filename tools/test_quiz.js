/* 出题回归测试：大量抽样，确保选项不会重复、正确选项唯一、图案映射和选项一致
   运行：node tools/test_quiz.js（npm test 会依次跑 audit.js 和本文件） */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const SAMPLES = 200;
const problems = [];
const bad = (msg) => problems.push(msg);

/* ---------- 1. 在沙箱里加载浏览器脚本（只依赖 DATA / Quiz，不碰 DOM） ---------- */
const sandbox = {
  console,
  Art: { em: (s) => String(s == null ? '' : s) },
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

if (!DATA || !DATA.curriculum || !Quiz || !Quiz.build || !Quiz.miniQuestion) {
  console.error('✗ 没有读到 DATA.curriculum / Quiz');
  process.exit(1);
}

const labelOf = (o) => (o && typeof o === 'object' ? o.label : o);

/* 通用校验：选项至少 2 个、标签不重复、正确项唯一；art 只能挂在已有选项上 */
function checkQuestion(tag, q, opts) {
  opts = opts || {};
  if (!q) {
    bad(tag + ' 返回空题');
    return false;
  }
  if (!Array.isArray(q.options) || q.options.length < 2) {
    bad(tag + ' 的选项少于 2 个');
    return false;
  }
  const labels = q.options.map(labelOf);
  const seen = new Set();
  labels.forEach((l) => {
    if (l == null || l === '') bad(tag + ' 出现空选项');
    else if (seen.has(l)) bad(tag + ' 出现重复选项：' + l);
    else seen.add(l);
  });
  if (!opts.plain) {
    const right = q.options.filter((o) => o && o.correct).length;
    if (right !== 1) bad(tag + ' 的正确选项数为 ' + right + '（应为 1）');
    if (q.answer != null && q.answer !== '' && !seen.has(q.answer)) {
      bad(tag + ' 的 answer「' + q.answer + '」不在选项里');
    }
  }
  if (q.art) {
    const keys = Object.keys(q.art);
    if (!keys.length) bad(tag + ' 的 art 是空的');
    keys.forEach((k) => {
      if (!seen.has(k)) bad(tag + ' 的 art 键「' + k + '」不在选项里');
      const v = q.art[k];
      if (typeof v !== 'string' || !v) bad(tag + ' 的 art「' + k + '」内容为空');
    });
    if (opts.artAll && keys.length !== seen.size) {
      bad(tag + ' 的 art 没有覆盖全部选项（' + keys.length + '/' + seen.size + '）');
    }
  }
  return true;
}

/* ---------- 2. 课程：每个阶段 × 每个题型，各抽 200 次 ---------- */
let stageCount = 0;
let buildCount = 0;

Object.keys(DATA.curriculum).forEach((subjectKey) => {
  const subject = DATA.curriculum[subjectKey];
  (subject.stages || []).forEach((st) => {
    stageCount++;
    if (!Array.isArray(st.qtypes)) return;
    st.qtypes.forEach((type) => {
      if (!Quiz.BUILDERS[type]) return;
      for (let i = 0; i < SAMPLES; i++) {
        let q = null;
        try {
          q = Quiz.build(type, st);
        } catch (e) {
          bad('阶段 ' + st.id + ' 的题型 ' + type + ' 出题报错：' + e.message);
          break;
        }
        if (!checkQuestion('阶段 ' + st.id + ' 的题型 ' + type, q)) break;
        buildCount++;
      }
    });
  });
});

/* ---------- 3. 小游戏题目：每个学科各抽 200 次 ---------- */
let miniCount = 0;

Object.keys(DATA.curriculum).forEach((subjectKey) => {
  for (let i = 0; i < SAMPLES; i++) {
    let q = null;
    try {
      q = Quiz.miniQuestion(subjectKey, 3);
    } catch (e) {
      bad('小游戏题目 ' + subjectKey + ' 出题报错：' + e.message);
      break;
    }
    if (!q) {
      bad('小游戏题目 ' + subjectKey + ' 返回空题');
      break;
    }
    if (q.target == null || q.target === '') bad('小游戏题目 ' + subjectKey + ' 缺少 target');
    const labels = (q.options || []).map((x) => String(x));
    if (labels.indexOf(String(q.target)) < 0) {
      bad('小游戏题目 ' + subjectKey + ' 的 target「' + q.target + '」不在选项里');
    }
    // 图形题每个选项都必须有插画；其余学科只校验已有的 art 都挂在选项上
    if (!checkQuestion('小游戏题目 ' + subjectKey, {
      options: (q.options || []).map((x) => ({ label: String(x) })),
      art: q.art
    }, { plain: true, artAll: subjectKey === 'geometry' })) break;
    miniCount++;
  }
});

/* ---------- 4. 两款拖拽小游戏依赖的数据 ---------- */
const KINDS = DATA.sciKinds || {};
const ANIMALS = DATA.sciAnimals || [];
const usedKinds = new Set();
ANIMALS.forEach((a) => {
  if (!a.zh || !a.emoji) bad('动物「' + (a.zh || '?') + '」缺少 zh / emoji');
  if (!a.kind) bad('动物「' + (a.zh || '?') + '」缺少 kind');
  else if (!KINDS[a.kind]) bad('动物「' + a.zh + '」的 kind「' + a.kind + '」不在 sciKinds 里');
  else usedKinds.add(a.kind);
});
Object.keys(KINDS).forEach((k) => {
  if (!KINDS[k] || !KINDS[k].zh) bad('sciKinds.' + k + ' 缺少 zh');
});
if (usedKinds.size < 3) bad('分类小能手至少需要 3 个有动物的种类，实际 ' + usedKinds.size);

/* ---------- 输出 ---------- */
if (problems.length) {
  console.error('✗ 出题回归测试发现 ' + problems.length + ' 个问题：');
  problems.slice(0, 60).forEach((p) => console.error('  - ' + p));
  if (problems.length > 60) console.error('  …还有 ' + (problems.length - 60) + ' 条');
  process.exit(1);
}

console.log(
  '✓ 出题回归测试通过：' + stageCount + ' 个阶段 × ' + SAMPLES + ' 次抽检（' + buildCount +
  ' 道题） / ' + Object.keys(DATA.curriculum).length + ' 个学科小游戏题 × ' + SAMPLES +
  ' 次（' + miniCount + ' 道） / 分类数据 ' + usedKinds.size + ' 类'
);
