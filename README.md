# 小龙猫乐园（saikid）

给 **3–6 岁孩子** 的幼儿启蒙游戏，纯静态 PWA：数字、字母、单词、算术、生活数学、图形、拼音、汉字、表达，以及动物、植物、天气、太空、身体等自然探索内容。

- **无框架、无构建**：原生 HTML/CSS/JavaScript，克隆下来起个静态服务器就能玩。
- **不识字也能玩**：每道题都有插画、朗读和语音提示，龙猫会用中文把题目念出来。
- **没有账号和后端**：学习记录只保存在浏览器 `localStorage`，不收集任何个人信息。
- **可离线安装**：Service Worker 预缓存全部代码、插画、音效和小龙猫语音。

## 快速开始

项目没有任何依赖，但 **不能用 `file://` 直接双击打开**（Service Worker、录音等功能需要 http/https）。在项目根目录起一个静态服务器即可：

```powershell
# 方式一：Python 自带
python -m http.server 8130 --bind 127.0.0.1

# 方式二：Node
npx serve .
```

然后打开 <http://127.0.0.1:8130/>。

> `file://` 下页面仍可运行，但 PWA 注册会被跳过（见 [pwa.js](assets/js/pwa.js)），离线缓存与「添加到主屏幕」不可用。
> 跟读录音使用 `getUserMedia`，需要 `localhost` 或 HTTPS 环境。

## 自检与工具

```powershell
# 题库自检：校验课程结构、题型、选项、笔顺、读本、应用题模板与音频素材是否齐全
npm test
# 等价于
node tools/audit.js
```

通过时会输出类似：

```
✓ 题库自检通过：14 个学科 / 134 个阶段 / 52 种题型 / 1128 道抽检题 / 45 个笔顺字 / 5 篇读本
```

重新生成小龙猫离线语音（修改台词后运行，增量更新，已存在的句子会跳过）：

```powershell
node tools/build_cat_voice.js
```

该脚本会抓取 `pet.js` / `games.js` / `minigames.js` / `app.js` 中的中文台词，用微软 Edge 在线朗读的儿童音色（`zh-CN-XiaoyiNeural`，略抬高音调）逐句合成 mp3 到 `assets/audio/cat/`，并重写 [cat-voice.js](assets/js/cat-voice.js) 清单。需要联网和 `pip install edge-tts`；改音色只改脚本顶部的 `VOICE` / `PITCH` / `RATE`，再运行 `node tools/build_cat_voice.js --force` 全部重录。

## 玩什么

### 学习内容

14 个学科，均由 [data.js](assets/js/data.js) 的 `DATA.curriculum` 定义：

| 学科 | 名称 | 学科 | 名称 |
| --- | --- | --- | --- |
| `numbers` | 数字乐园 | `hanzi` | 汉字森林 |
| `letters` | 字母王国 | `expression` | 表达工坊 |
| `words` | 单词花园 | `animals` | 动物世界 |
| `math` | 算术工坊 | `plants` | 植物花园 |
| `geometry` | 图形空间 | `weather` | 天气季节 |
| `lifemath` | 生活数学 | `space` | 地球太空 |
| `pinyin` | 拼音小路 | `body` | 身体奥秘 |

每个学科按「认识 → 练习 → 综合」拆分阶段；题目由 [quiz-core.js](assets/js/quiz-core.js) 的题型构建器实时生成，而不是固定题库。

### 闯关与练习

- **闯关地图**：22 个主线关卡（问答 + 小游戏混排），另有 8 条支线（宝箱、龙猫故事、小游戏），按顺序解锁，每关 1–3 颗星。
- **学科关卡**：按学科浏览阶段，自由练习，不影响地图进度。
- **混合挑战**：连续出题时跨学科切换（数字、字母、拼音、汉字、单词、算术、图形、动物、植物、天气、太空、身体），并避免与上一题同科，练习知识切换。
- **错题复习**：自动收集错题，可随时重做；家长中心还能把错题导出成练习纸。
- **知识总表**：数字表、字母表、加减乘除表、拼音表、汉字表、单词主题等完整摊开，方便随时查阅。
- **跟读与描红**：录音回放 + 手写覆盖评分，补上「说出来、写出来」的练习闭环。

### 小游戏乐园

8 种玩法共用同一套学科题：

打地鼠、戳泡泡、翻翻乐、钓鱼听音、火箭冲关、连线配对、接果子、火眼金睛。

支持按学科选择，也有「混合」模式；每局开始前有剧情条和语音引导。题目若带图案（动物、植物、天气、图形等），盘面上就画图案，否则退回选项文字，保证「题目问什么，盘面上就是什么」。

### 小龙猫与小屋

- **七个成长形态**：幼龙猫 → 小龙猫 → 大龙猫 → 森林小卫士 → 森林守护者 → 森之王 → 森林之神。
- **电子宠物行为**：会在小屋里自由走动、玩玩具、睡觉、挥手、跳跃、做鬼脸，有高兴 / 难过 / 调皮 / 无聊等表情，空闲时主动推荐玩什么、学什么。
- **三条舒适度**：饥饿、心情、清洁；喂食、洗澡、陪玩会改变状态。
- **每日心愿 + 舒适度星级**：每天刷新心愿，完成后给奖励；舒适度综合星级影响小屋氛围。
- **橡果商店**：用闯关获得的橡果买食物、玩具和小屋装饰，装饰可自由摆放。

### 成长激励

31 枚勋章，覆盖学习、探索、小游戏、养成四类，每枚都有目标值与进度条；配合连击、星级、等级、每日任务、贴纸墙和每日推荐。

### 家长中心

入口在右上角，默认家长密码 **1234**（可在家长中心修改）：

- 本周学习计划、近 7 天趋势、各科掌握度、知识点掌握度、错题分布
- 生成练习纸、每日目标、孩子档案与难度
- 屏幕时间（默认每日 30 分钟、每 15 分钟提醒休息，可按需调整）
- 内容预览、深色模式 / 大字号 / 降低动画
- 音效、朗读、在线语音开关
- 存档导出 / 导入、周报、分享图、修改家长密码、恢复历史存档、清空数据

## 目录结构

```
saikid/
├─ index.html            # 单页应用：所有屏幕与弹窗
├─ manifest.json         # PWA 清单
├─ sw.js                 # Service Worker：离线缓存
├─ package.json          # 仅用于 npm test，无依赖
├─ _smoke.html           # 本地冒烟测试页（iframe 加载 index.html，需要服务器）
├─ assets/
│  ├─ css/               # base / screens / features / theme / minigames
│  ├─ js/                # 全部业务模块，见下表
│  ├─ audio/
│  │  ├─ cat/            # 小龙猫台词 mp3（由构建脚本生成）
│  │  ├─ pinyin/         # 声母 / 韵母 / 音节读音
│  │  └─ sfx/            # 点击、答对、答错、金币等音效
│  ├─ img/
│  │  ├─ emoji/          # Twemoji SVG，文件名即码点（如 1f431.svg）
│  │  └─ ui/             # 星星、金币、锁等界面图标
│  └─ fonts/             # 站酷快乐体
└─ tools/
   ├─ audit.js           # 题库与素材自检
   └─ build_cat_voice.js # 小龙猫离线语音构建
```

## 技术架构

### 模块

所有脚本都是普通 `<script>`（不是 ES Module）。业务模块用 IIFE 导出一个常量（如 `const Quiz = (() => { ... })()`），数据类文件直接导出普通常量（如 `DATA`、`CAT_VOICE`）。模块之间通过全局词法作用域共享，**不挂到 `window` 上**。因此脚本顺序不能随意调整。

| 模块 | 文件 | 职责 |
| --- | --- | --- |
| `DATA` | [data.js](assets/js/data.js) | 课程体系、单词、字母、拼音、笔顺、读本、自然科学、商店等静态数据 |
| `EMOJI_MAP` | [emoji-map.js](assets/js/emoji-map.js) | emoji → 本地 SVG 文件名映射，供离线预缓存使用 |
| `Art` | [art.js](assets/js/art.js) | 把文本中的 emoji 替换为本地插画（`em`），并提供界面图标（`ui`）与星级（`stars`） |
| `SaveStore` | [storage.js](assets/js/storage.js) | 存档读写、schema 迁移、双备份、防抖写入、多孩子档案、导入导出 |
| `CAT_VOICE` | [cat-voice.js](assets/js/cat-voice.js) | 台词 → 本地 mp3 清单（自动生成，勿手改） |
| `AudioFX` | [audio.js](assets/js/audio.js) | 音效播放、中文朗读队列、在线语音与系统语音回退 |
| `Pet` | [pet.js](assets/js/pet.js) | 小龙猫等级、成长形态、状态与形象绘制 |
| `Atlas` | [atlas.js](assets/js/atlas.js) | 知识总表 |
| `Quiz` | [quiz-core.js](assets/js/quiz-core.js) | 公共出题/判题：`build()`、`miniQuestion()`、`BUILDERS`、`TYPE_NAMES`、`shapeSvg()` |
| `Practice` | [practice.js](assets/js/practice.js) | 跟读录音与描红 |
| `MiniGame` | [minigames.js](assets/js/minigames.js) | 8 种小游戏 |
| `Game` | [games.js](assets/js/games.js) | 阶段练习、闯关答题流程、连击与结算 |
| `App` | [app.js](assets/js/app.js) | 界面切换、地图、每日任务、养成、商店、小屋、勋章、家长中心 |
| `—` | [pwa.js](assets/js/pwa.js) | 注册 Service Worker、新版本提示 |

### 加载顺序

`index.html` 中脚本顺序固定为：

```
data → emoji-map → art → storage → cat-voice → audio → pet → atlas
→ quiz-core → practice → minigames → games → app → pwa
```

CSS 顺序：

```
base → screens → features → theme → minigames
```

### 出题与判题

1. `Quiz.build(type, stage)` / `Quiz.miniQuestion(subject, count)` 生成题目：

   ```js
   {
     key, title, visual, answer,
     options: [{ label, correct }],      // 阶段练习
     prompt, target, options: [..], art  // 小游戏
   }
   ```

2. 小游戏的 `art` 是「选项文本 → 图案字符串」的映射：动物/植物/身体/天气取 emoji，图形用 `Quiz.shapeSvg()` 生成同一配色的 SVG；文字本身就是答案的学科（字母、拼音、汉字、单词、算术、数字）不加图案。
3. 小游戏用内部 `artHtml()` 统一渲染：SVG → `is-svg`，单个 emoji → `is-solo`，多个 emoji → `is-multi`，纯文字按长度分 `is-char` / `is-text`，图文混排 → `is-mixed`。
4. 判题以选项的 `data-value` 文本与 `target` 比对。

### 存档

- 主键 `xiaolongmao_save`，另有两份自动备份 `xiaolongmao_save_b1` / `_b2`。
- 当前 schema `VERSION = 4`，读取旧档时自动迁移；旧版 `saikid_save*` 也会被识别。
- 支持多个孩子档案：`xiaolongmao_profiles` 保存列表，`xiaolongmao_slot` 记录当前档案。
- 写入防抖 320ms；存储不可用（隐私模式等）时自动降级为内存态。

### 离线与版本

`sw.js` 顶部的 `VERSION` 决定缓存版本，当前为 `xiaolongmao-v41`。它会 `importScripts()` 读取题库、emoji 清单和语音清单，自动生成预缓存列表。

缓存策略：页面导航网络优先、断网回退首页；静态资源 stale-while-revalidate（先读缓存、后台更新）。

**改动任何被缓存的静态资源后，请把 `VERSION` 递增**，否则老用户可能继续用旧缓存。新版本会在下次打开时生效，不会打断正在进行的游戏。

### 语音链路

1. **小龙猫台词**：优先播放 `assets/audio/cat/` 中的本地 mp3（儿童音色），时间轴与文字同步。
2. **普通朗读**：默认请求在线中文 TTS（自然音色），可被家长关闭。
3. **兜底**：在线语音失败或关闭时，回退到浏览器 `speechSynthesis`。
4. **音效**：优先播放 `assets/audio/sfx/` 的 wav，缺失时用 WebAudio 合成。

声母、韵母和音节读音同样存放在 `assets/audio/pinyin/`，由 `AudioFX.pyAudio` 使用。

## 给内容维护者

- **加题**：优先在 `data.js` 补充数据；若需要新题型，在 `quiz-core.js` 注册 `Quiz.BUILDERS[type]`，并在 `Quiz.TYPE_NAMES` 里给短名，否则 `npm test` 会报错。
- **改台词**：修改 `pet.js` / `games.js` / `minigames.js` 中的单行中文字符串后，运行 `node tools/build_cat_voice.js`，再递增 `sw.js` 的 `VERSION`。
- **改素材**：`assets/img/emoji/` 用 Twemoji 命名规则（小写码点、去掉 `FE0F`、ZWJ 用 `-` 连接）。
- **提交前**：至少跑一次 `npm test`，再在浏览器里手动过一遍受影响的页面。

## 浏览器支持

- Chrome / Edge / Safari / Firefox 的近年版本（需要 Service Worker、CSS 自定义属性、ES6+）。
- 建议在平板或桌面浏览器使用；手机竖屏也可玩。
- 跟读录音需要麦克风权限与安全上下文（`localhost` 或 HTTPS）；不授权不影响其他功能。

## 许可证

[MIT](LICENSE) © 2026 Stardustsky
