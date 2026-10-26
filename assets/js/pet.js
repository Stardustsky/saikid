/* 小龙猫：等级、状态与形象绘制 */
const Pet = (() => {
  /* 七个成长形态：幼龙猫 → 小龙猫 → 大龙猫 → 森林小卫士 → 森林守护者 → 森之王 → 森林之神
     等级区间拉长，幼年体型交给 CSS 的 --pet-size 控制，成长过程看得见 */
  const STAGES = [
    {
      min: 1, max: 3, form: 'baby', title: '幼龙猫', scale: 1,
      body: '#dfe5e0', line: '#93a19c', belly: '#fbf7ea', ear: '#f0f3ef', glow: 'rgba(190, 210, 200, .55)'
    },
    {
      min: 4, max: 6, form: 'mini', title: '小龙猫', scale: 1,
      body: '#d3dddb', line: '#87958f', belly: '#fbf8ee', ear: '#e8eeec', glow: 'rgba(185, 203, 198, .55)'
    },
    {
      min: 7, max: 10, form: 'small', title: '大龙猫', scale: 1,
      body: '#c3ced1', line: '#7d8d90', belly: '#fbf7ea', ear: '#e2eaec', glow: 'rgba(180, 200, 205, .55)'
    },
    {
      min: 11, max: 15, form: 'big', title: '森林小卫士', scale: 1,
      body: '#a9b8bd', line: '#6d7f84', belly: '#faf6e8', ear: '#ccd8db', glow: 'rgba(160, 185, 192, .58)'
    },
    {
      min: 16, max: 21, form: 'guard', title: '森林守护者', scale: 1,
      body: '#a5b4cc', line: '#6b7a9e', belly: '#f7f6f2', ear: '#ccd6ea', glow: 'rgba(160, 178, 214, .62)'
    },
    {
      min: 22, max: 28, form: 'king', title: '森之王', scale: 1,
      body: '#b7b2da', line: '#7a74a8', belly: '#fdfbf5', ear: '#dcd8f0', glow: 'rgba(196, 186, 240, .7)'
    },
    {
      min: 29, max: 99, form: 'myth', title: '森林之神', scale: 1,
      body: '#cdbcf0', line: '#8778b8', belly: '#fdfbff', ear: '#e7defa', glow: 'rgba(214, 194, 255, .78)'
    }
  ];

  let gradSeed = 0;

  const clamp = (v, min = 0, max = 100) => Math.max(min, Math.min(max, v));
  const isOneOf = (v, arr) => arr.indexOf(v) > -1;

  function stage(level) {
    return STAGES.find(s => level >= s.min && level <= s.max) || STAGES[STAGES.length - 1];
  }

  function title(level) {
    return stage(level).title;
  }

  function form(level) {
    return stage(level).form;
  }

  // 升级所需经验：比之前更平缓，让成长过程拉长
  function needExp(level) {
    return 55 + (level - 1) * 20;
  }

  /* 表情库：眼睛组 + 嘴巴组分开画，方便原地换脸（不用重绘整只龙猫）
     坐标对应 200x220 画布：左眼(82,96)、右眼(118,96)、嘴(≈100,118-124)
     mood 决定光晕的基础亮度，expr 决定具体五官 */
  const EXPRS = {
    happy: {
      mood: 'happy',
      eyes: '<path d="M72 97 Q82 87 92 97" stroke="#3c4a4d" stroke-width="5.5" fill="none" stroke-linecap="round"/>' +
            '<path d="M108 97 Q118 87 128 97" stroke="#3c4a4d" stroke-width="5.5" fill="none" stroke-linecap="round"/>',
      mouth: '<path d="M91 117 Q100 130 109 117 Q100 122 91 117 Z" fill="#4c5a5d"/>'
    },
    ok: {
      mood: 'ok',
      eyes: '<ellipse cx="82" cy="96" rx="9.5" ry="10.5" fill="#ffffff" stroke="#3c4a4d" stroke-width="2.4"/>' +
            '<ellipse cx="118" cy="96" rx="9.5" ry="10.5" fill="#ffffff" stroke="#3c4a4d" stroke-width="2.4"/>' +
            '<circle cx="83" cy="97" r="5.2" fill="#3c4a4d"/><circle cx="119" cy="97" r="5.2" fill="#3c4a4d"/>' +
            '<circle cx="85" cy="94.5" r="1.8" fill="#ffffff"/><circle cx="121" cy="94.5" r="1.8" fill="#ffffff"/>',
      mouth: '<path d="M93 119 Q100 124 107 119" stroke="#3c4a4d" stroke-width="4.5" fill="none" stroke-linecap="round"/>'
    },
    sad: {
      mood: 'sad',
      eyes: '<ellipse cx="82" cy="98" rx="9.5" ry="10.5" fill="#ffffff" stroke="#3c4a4d" stroke-width="2.4"/>' +
            '<ellipse cx="118" cy="98" rx="9.5" ry="10.5" fill="#ffffff" stroke="#3c4a4d" stroke-width="2.4"/>' +
            '<circle cx="81" cy="100" r="5" fill="#3c4a4d"/><circle cx="117" cy="100" r="5" fill="#3c4a4d"/>' +
            '<path d="M70 80 L90 86" stroke="#3c4a4d" stroke-width="4.5" stroke-linecap="round"/>' +
            '<path d="M130 80 L110 86" stroke="#3c4a4d" stroke-width="4.5" stroke-linecap="round"/>',
      mouth: '<path d="M93 124 Q100 115 107 124" stroke="#3c4a4d" stroke-width="4.5" fill="none" stroke-linecap="round"/>'
    },
    /* 调皮：眨一只眼，吐一点小舌头 */
    play: {
      mood: 'happy',
      eyes: '<ellipse cx="82" cy="96" rx="9.5" ry="10.5" fill="#ffffff" stroke="#3c4a4d" stroke-width="2.4"/>' +
            '<circle cx="84" cy="97" r="5.2" fill="#3c4a4d"/><circle cx="86" cy="94.5" r="1.8" fill="#ffffff"/>' +
            '<path d="M108 98 Q118 89 128 98" stroke="#3c4a4d" stroke-width="5" fill="none" stroke-linecap="round"/>',
      mouth: '<path d="M92 118 Q101 126 108 117" stroke="#3c4a4d" stroke-width="4.2" fill="none" stroke-linecap="round"/>' +
             '<path d="M100 122 Q102 132 108 124 Q104 120 100 122 Z" fill="#ff9db1" stroke="#e0708a" stroke-width="1.4"/>'
    },
    /* 无聊：眼皮耷拉，嘴角平平，旁边飘几个小点 */
    bored: {
      mood: 'ok',
      eyes: '<ellipse cx="82" cy="98" rx="9.5" ry="9" fill="#ffffff" stroke="#3c4a4d" stroke-width="2.2"/>' +
            '<circle cx="83" cy="100" r="4.4" fill="#3c4a4d"/>' +
            '<ellipse cx="118" cy="98" rx="9.5" ry="9" fill="#ffffff" stroke="#3c4a4d" stroke-width="2.2"/>' +
            '<circle cx="119" cy="100" r="4.4" fill="#3c4a4d"/>' +
            '<path d="M72 91 L92 91" stroke="#3c4a4d" stroke-width="3.4" stroke-linecap="round"/>' +
            '<path d="M108 91 L128 91" stroke="#3c4a4d" stroke-width="3.4" stroke-linecap="round"/>',
      mouth: '<path d="M93 122 L107 122" stroke="#3c4a4d" stroke-width="4.2" stroke-linecap="round"/>' +
             '<circle cx="116" cy="127" r="1.7" fill="#95a3a5"/>' +
             '<circle cx="121" cy="129" r="1.4" fill="#95a3a5"/>' +
             '<circle cx="125" cy="131" r="1.1" fill="#95a3a5"/>'
    },
    /* 鬼脸：眼睛变叉叉，张大嘴 + 舌头 */
    grimace: {
      mood: 'ok',
      eyes: '<path d="M73 89 L90 103" stroke="#3c4a4d" stroke-width="4.5" stroke-linecap="round"/>' +
            '<path d="M90 89 L73 103" stroke="#3c4a4d" stroke-width="4.5" stroke-linecap="round"/>' +
            '<path d="M110 89 L127 103" stroke="#3c4a4d" stroke-width="4.5" stroke-linecap="round"/>' +
            '<path d="M127 89 L110 103" stroke="#3c4a4d" stroke-width="4.5" stroke-linecap="round"/>',
      mouth: '<path d="M88 114 Q100 110 112 114 Q112 130 100 132 Q88 130 88 114 Z" fill="#5c4044"/>' +
             '<path d="M93 126 Q100 137 107 126 Z" fill="#ff9db1"/>' +
             '<path d="M91 116 Q100 114 109 116" stroke="#ffffff" stroke-width="2.2" opacity=".6" fill="none" stroke-linecap="round"/>'
    },
    /* 困：眼睛闭上，嘴巴小小的 */
    sleep: {
      mood: 'ok',
      eyes: '<path d="M72 97 Q82 104 92 97" stroke="#3c4a4d" stroke-width="5" fill="none" stroke-linecap="round"/>' +
            '<path d="M108 97 Q118 104 128 97" stroke="#3c4a4d" stroke-width="5" fill="none" stroke-linecap="round"/>',
      mouth: '<ellipse cx="100" cy="121" rx="4" ry="3.4" fill="#4c5a5d"/>'
    },
    /* 惊喜：眼睛瞪圆，嘴巴张成 O */
    wow: {
      mood: 'happy',
      eyes: '<ellipse cx="82" cy="95" rx="11" ry="12.5" fill="#ffffff" stroke="#3c4a4d" stroke-width="2.4"/>' +
            '<ellipse cx="118" cy="95" rx="11" ry="12.5" fill="#ffffff" stroke="#3c4a4d" stroke-width="2.4"/>' +
            '<circle cx="83" cy="95" r="6.4" fill="#3c4a4d"/><circle cx="119" cy="95" r="6.4" fill="#3c4a4d"/>' +
            '<circle cx="85.8" cy="91.5" r="2.2" fill="#ffffff"/><circle cx="121.8" cy="91.5" r="2.2" fill="#ffffff"/>' +
            '<circle cx="80.5" cy="99" r="1.3" fill="#ffffff"/><circle cx="116.5" cy="99" r="1.3" fill="#ffffff"/>',
      mouth: '<ellipse cx="100" cy="122" rx="7.5" ry="9.5" fill="#4c5a5d"/>' +
             '<ellipse cx="100" cy="127" rx="4.4" ry="3" fill="#ff9db1"/>'
    }
  };

  function normMood(mood) {
    return typeof mood === 'number' && isFinite(mood) ? mood : 60;
  }

  // 根据心情生成表情（坐标对应 200x220 画布）
  function face(mood, expr) {
    let key = typeof expr === 'string' && EXPRS[expr] ? expr : '';
    if (!key) {
      const m = normMood(mood);
      key = m >= 60 ? 'happy' : m >= 30 ? 'ok' : 'sad';
    }
    const e = EXPRS[key];
    return {
      name: key,
      cls: 'mood-' + e.mood + ' expr-' + key,
      eyes: e.eyes,
      mouth: e.mouth
    };
  }

  // 生成小龙猫 SVG
  function svg(level, mood, extraClass = '', expr = 'auto') {
    const st = stage(level);
    // 兼容老写法：Pet.svg(level, 'ok') 里的第二个参数其实是表情名
    if (typeof mood === 'string' && EXPRS[mood]) {
      expr = mood;
      mood = 60;
    }
    const f = face(mood, expr);
    const id = 'pg' + (++gradSeed);
    const baby = st.form === 'baby';
    const sproutStage = isOneOf(st.form, ['mini', 'small']);
    const crown = isOneOf(st.form, ['big', 'guard', 'king', 'myth']);
    const wings = isOneOf(st.form, ['guard', 'king', 'myth']);
    const halo = isOneOf(st.form, ['king', 'myth']);
    const mythic = st.form === 'myth';
    const sparkle = level >= 8;

    const earRX = baby ? 11 : st.form === 'mini' ? 13 : st.form === 'small' ? 14 : 16;
    const earRY = baby ? 20 : st.form === 'mini' ? 24 : st.form === 'small' ? 27 : 30;
    const earY = baby ? 58 : st.form === 'mini' ? 56 : 54;

    // 幼龙猫：头顶一小撮绒毛
    const tuft = baby
      ? `<path d="M100 40 Q94 26 103 18 Q110 30 100 40 Z" fill="${st.body}" stroke="${st.line}" stroke-width="3.5" stroke-linejoin="round"/>`
      : '';
    // 小龙猫 / 大龙猫：额头小嫩芽
    const sprout = sproutStage
      ? `<path d="M100 36 Q98 18 108 10 Q112 26 100 36 Z" fill="#9ed897" stroke="#5aa85f" stroke-width="3" stroke-linejoin="round"/>`
      : '';
    // 大龙猫起：三片叶子王冠
    const leafCrown = crown && !halo
      ? `<g class="pet-crown">
          <path d="M100 42 Q88 22 98 12 Q108 24 100 42 Z" fill="#8ed08a" stroke="#5aa85f" stroke-width="3" stroke-linejoin="round"/>
          <path d="M84 48 Q66 36 70 22 Q88 28 84 48 Z" fill="#a6dc9d" stroke="#5aa85f" stroke-width="3" stroke-linejoin="round"/>
          <path d="M116 48 Q134 36 130 22 Q112 28 116 48 Z" fill="#a6dc9d" stroke="#5aa85f" stroke-width="3" stroke-linejoin="round"/>
        </g>`
      : '';
    // 森之王：星星王冠 + 光环
    const tiara = halo
      ? `<g class="pet-tiara">
          <path d="M74 46 L84 20 L93 38 L100 12 L107 38 L116 20 L126 46 Z"
            fill="#ffd76a" stroke="#dca400" stroke-width="3" stroke-linejoin="round"/>
          <circle cx="84" cy="20" r="3.4" fill="#fff6c4" stroke="#dca400" stroke-width="2"/>
          <circle cx="100" cy="12" r="3.8" fill="#fff6c4" stroke="#dca400" stroke-width="2"/>
          <circle cx="116" cy="20" r="3.4" fill="#fff6c4" stroke="#dca400" stroke-width="2"/>
        </g>
        <g class="pet-halo">
          <ellipse cx="100" cy="18" rx="38" ry="9" fill="none" stroke="#ffe08a" stroke-width="5" opacity=".85"/>
          <ellipse cx="100" cy="18" rx="30" ry="6" fill="none" stroke="#fff6c4" stroke-width="2.5" opacity=".9"/>
        </g>`
      : '';
    // 森林守护者起：背后小翅膀
    const wing = wings
      ? `<g class="pet-wings" opacity=".92">
          <path d="M42 104 C12 78, 0 116, 24 146 C28 122, 32 110, 50 108 Z"
            fill="#eaf7e5" stroke="${st.line}" stroke-width="3.4" stroke-linejoin="round"/>
          <path d="M158 104 C188 78, 200 116, 176 146 C172 122, 168 110, 150 108 Z"
            fill="#eaf7e5" stroke="${st.line}" stroke-width="3.4" stroke-linejoin="round"/>
        </g>`
      : '';
    // 身旁闪光
    const sparkles = sparkle
      ? `<g class="pet-sparkle">
          <path d="M170 54 l4 10 10 4 -10 4 -4 10 -4 -10 -10 -4 10 -4z" fill="#fff3bf"/>
          <path d="M26 82 l3 7 7 3 -7 3 -3 7 -3 -7 -7 -3 7 -3z" fill="#fff3bf"/>
          ${halo ? '<path d="M186 120 l3 8 8 3 -8 3 -3 8 -3 -8 -8 -3 8 -3z" fill="#ffe7a8"/>' : ''}
        </g>`
      : '';

    // 森林之神：肚皮上一颗星光宝石 + 环绕光芒
    const mythMark = mythic
      ? `<g class="pet-myth">
          <circle cx="100" cy="156" r="9" fill="#fff6d2" stroke="#dca400" stroke-width="2.6"/>
          <path d="M100 145 l2.6 6.6 6.6 2.6 -6.6 2.6 -2.6 6.6 -2.6 -6.6 -6.6 -2.6 6.6 -2.6z" fill="#ffd76a"/>
          <path d="M52 92 l3 7.4 7.4 3 -7.4 3 -3 7.4 -3 -7.4 -7.4 -3 7.4 -3z" fill="#fff3bf"/>
          <path d="M148 158 l2.6 6.4 6.4 2.6 -6.4 2.6 -2.6 6.4 -2.6 -6.4 -6.4 -2.6 6.4 -2.6z" fill="#ffe7a8"/>
        </g>`
      : '';

    return `
    <div class="pet-wrap ${f.cls} ${extraClass}" data-form="${st.form}" data-expr="${f.name}">
      <div class="pet-glow" style="background:${st.glow}"></div>
      <svg class="pet-svg" viewBox="0 0 200 220" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="${id}" cx="34%" cy="22%" r="86%">
            <stop offset="0%" stop-color="#ffffff"/>
            <stop offset="34%" stop-color="${st.body}"/>
            <stop offset="100%" stop-color="${st.body}"/>
          </radialGradient>
        </defs>
        <ellipse cx="100" cy="208" rx="52" ry="8" fill="rgba(64, 82, 70, .16)"/>
        ${wing}
        <g class="pet-body" transform="translate(100 118) scale(${st.scale}) translate(-100 -118)">
          <!-- 耳朵（圆润蛋形，微微外倾） -->
          <ellipse cx="60" cy="${earY}" rx="${earRX}" ry="${earRY}" transform="rotate(-15 60 ${earY})"
            fill="${st.ear}" stroke="${st.line}" stroke-width="5"/>
          <ellipse cx="140" cy="${earY}" rx="${earRX}" ry="${earRY}" transform="rotate(15 140 ${earY})"
            fill="${st.ear}" stroke="${st.line}" stroke-width="5"/>
          <ellipse cx="60" cy="${earY + 2}" rx="${earRX * 0.5}" ry="${earRY * 0.6}" transform="rotate(-15 60 ${earY})" fill="${st.body}" opacity=".55"/>
          <ellipse cx="140" cy="${earY + 2}" rx="${earRX * 0.5}" ry="${earRY * 0.6}" transform="rotate(15 140 ${earY})" fill="${st.body}" opacity=".55"/>
          <!-- 小脚 -->
          <ellipse cx="76" cy="196" rx="${baby ? 15 : 17}" ry="9" fill="${st.belly}" stroke="${st.line}" stroke-width="4"/>
          <ellipse cx="124" cy="196" rx="${baby ? 15 : 17}" ry="9" fill="${st.belly}" stroke="${st.line}" stroke-width="4"/>
          <!-- 身体 -->
          <ellipse cx="100" cy="122" rx="68" ry="72" fill="url(#${id})" stroke="${st.line}" stroke-width="5"/>
          <!-- 小手 -->
          <ellipse class="pet-hand pet-hand-l" cx="35" cy="132" rx="11" ry="19" transform="rotate(-18 35 132)"
            fill="${st.body}" stroke="${st.line}" stroke-width="4.5"/>
          <ellipse class="pet-hand pet-hand-r" cx="165" cy="132" rx="11" ry="19" transform="rotate(18 165 132)"
            fill="${st.body}" stroke="${st.line}" stroke-width="4.5"/>
          <!-- 肚皮 -->
          <ellipse cx="100" cy="150" rx="45" ry="42" fill="${st.belly}"/>
          <g stroke="${st.line}" stroke-width="4" fill="none" stroke-linecap="round" opacity=".42">
            <path d="M88 133 Q100 141 112 133"/>
            <path d="M86 146 Q100 155 114 146"/>
            <path d="M86 159 Q100 168 114 159"/>
            <path d="M88 172 Q100 180 112 172"/>
          </g>
          ${mythMark}
          ${tuft}
          ${sprout}
          ${leafCrown}
          ${tiara}
          <g class="pet-eyes">${f.eyes}</g>
          <!-- 鼻子 -->
          <path d="M92 108 Q100 103 108 108 Q100 117 92 108 Z" fill="#4c5a5d"/>
          <!-- 胡须 -->
          ${baby ? '' : `<g stroke="${st.line}" stroke-width="2.6" stroke-linecap="round" opacity=".8">
            <path d="M64 102 L44 98"/><path d="M64 110 L42 110"/><path d="M64 118 L44 122"/>
            <path d="M136 102 L156 98"/><path d="M136 110 L158 110"/><path d="M136 118 L156 122"/>
          </g>`}
          <!-- 腮红 -->
          <circle cx="64" cy="116" r="9" fill="#ffb3c1" opacity=".38"/>
          <circle cx="136" cy="116" r="9" fill="#ffb3c1" opacity=".38"/>
          <g class="pet-mouth">${f.mouth}</g>
        </g>
        ${sparkles}
      </svg>
    </div>`;
  }

  /* 原地换表情：只替换眼睛/嘴巴两组，不重绘整只龙猫，动作动画不会被打断
     expr 传 'auto' 时按心情自动选择 */
  function setExpr(rootEl, expr, mood) {
    const wrap = rootEl && (
      (rootEl.classList && rootEl.classList.contains('pet-wrap')) ? rootEl :
        (rootEl.querySelector ? rootEl.querySelector('.pet-wrap') : null)
    );
    if (!wrap) return;
    const f = face(normMood(mood), expr);
    const eyes = wrap.querySelector('.pet-eyes');
    const mouth = wrap.querySelector('.pet-mouth');
    if (eyes) eyes.innerHTML = f.eyes;
    if (mouth) mouth.innerHTML = f.mouth;
    const keep = [];
    wrap.classList.forEach(c => {
      if (c.indexOf('mood-') !== 0 && c.indexOf('expr-') !== 0) keep.push(c);
    });
    wrap.className = keep.join(' ') + ' ' + f.cls;
    wrap.dataset.expr = f.name;
  }

  // 离线衰减：最多按 2 天计算，长时间不回来也不会一次掉光
  function decay(p) {
    const mins = Math.min(2880, Math.max(0, (Date.now() - (p.lastCare || Date.now())) / 60000));
    if (mins < 5) return;
    p.hunger = clamp(p.hunger - Math.floor(mins / 25));
    p.mood = clamp(p.mood - Math.floor(mins / 40));
    p.clean = clamp(p.clean - Math.floor(mins / 32));
    p.lastCare = Date.now();
  }

  function moodWord(p) {
    if (p.hunger < 30) return '肚子饿饿';
    if (p.clean < 30) return '想洗香香';
    if (p.mood < 30) return '有点无聊';
    if (p.hunger > 75 && p.mood > 75 && p.clean > 75) return '超级开心';
    return '心情不错';
  }

  let lastLine = '';

  // 随机取一句，并尽量避免和上一句重复
  function pick(lines) {
    const pool = lines.filter(l => l !== lastLine);
    const from = pool.length ? pool : lines;
    const line = from[Math.floor(Math.random() * from.length)];
    lastLine = line;
    return line;
  }

  function speakLine(p, ctx) {
    const c = ctx || {};
    const hour = typeof c.hour === 'number' ? c.hour : new Date().getHours();

    if (p.hunger < 25) return pick([
      '肚子咕咕叫啦，给我一颗橡果吧～',
      '饿得没力气啦，先吃点东西再学习好不好？',
      '闻到橡果的香味了，是不是给我留了一颗？',
      '我的小肚子在打鼓，咚咚咚，你听见了吗？',
      '先喂饱我，我就有力气陪你一起闯关啦！',
      '好想吃一颗脆脆的橡果呀，咔嚓咔嚓～'
    ]);
    if (p.clean < 25) return pick([
      '我身上脏脏的，想洗个香香澡～',
      '毛毛打结啦，帮我洗一洗嘛～',
      '噗噗，我身上有泥土的味道，快帮我洗香香！',
      '洗完澡我就变成一只香喷喷的团子啦～',
      '森林里的小溪好凉快，我们一起去洗澡吧！'
    ]);
    if (p.mood < 25) return pick([
      '陪我玩一会儿嘛，森林里好安静呀～',
      '我有一点不开心，抱抱我好吗？',
      '我一个人待着有点闷，你回来我就开心啦！',
      '我们玩个游戏吧，玩完心情就好起来啦～',
      '今天的天空灰灰的，我想听你讲个故事。'
    ]);

    if (hour >= 6 && hour < 9) return pick([
      '早上好呀！今天想先学数字还是字母？',
      '太阳出来啦，我们一起做早读吧～',
      '早起的我们有橡果吃，嘿嘿！',
      '伸个懒腰，新的一天开始啦，一起加油！',
      '早晨的脑袋最清楚，学一点新东西刚刚好。'
    ]);
    if (hour >= 11 && hour < 14) return pick([
      '到中午啦，吃完饭再回来找我玩～',
      '午睡醒来，学一点新知识刚刚好。',
      '中午要好好吃饭哦，青菜也要吃～',
      '吃饱饱才有精神，我等你回来。',
      '我先打个盹，你吃完回来叫醒我呀。'
    ]);
    if (hour >= 19 || hour < 5) return pick([
      '天黑啦，今天的星星好亮，学完早点休息哦～',
      '晚上也要记得刷牙呀，明天见！',
      '月亮出来啦，我陪你把今天最后一题做完。',
      '早点睡，明天我们还有新的冒险呢！',
      '晚安之前，跟我挥挥手好不好？'
    ]);

    if (typeof c.coins === 'number' && c.coins >= 120) return pick([
      '我的橡果罐快装满啦，去森林商店看看？',
      '攒了好多的橡果，你想换什么新装饰呀？',
      '橡果叮叮当当响，我们是不是该去逛街啦？',
      '我偷偷算过了，你能换一件漂亮的新家具！',
      '这么多橡果，都是你认真答题赚来的呀！'
    ]);
    if (typeof c.streak === 'number' && c.streak >= 3) return pick([
      '你已经连续来了 ' + c.streak + ' 天啦，真了不起！',
      '连续学习 ' + c.streak + ' 天，我偷偷给你鼓掌～',
      '第 ' + c.streak + ' 天啦！我们已经是老朋友了。',
      '坚持 ' + c.streak + ' 天的你，像小树一样在长大。',
      '我每天都在这儿等你，今天也没白等！'
    ]);
    if (typeof c.level === 'number' && c.level >= 11) return pick([
      '我感觉自己长大了一点点，谢谢你照顾我！',
      '变成现在这个样子，都是和你一起努力的结果呀。',
      '你看我的毛毛，是不是比以前更漂亮啦？',
      '我长大了，可以陪你走更远的路啦！',
      '还记得我们第一次见面吗？那时候我还好小呢。'
    ]);
    if (p.mood >= 80 && p.hunger >= 70) return pick([
      '我今天超有精神，一起去学习吧！',
      '状态满格！今天一定能答对好多题～',
      '吃饱喝足，脑袋也转得特别快！',
      '我现在能跳得比小树还高，你信不信？',
      '心情好得想转圈圈，来陪我转一圈！'
    ]);

    return pick([
      '今天也要加油哦！',
      '学完知识，记得回森林看看我～',
      '我最喜欢和你一起玩啦！',
      '答对题目可以赚星星哦！',
      '猜猜我今天在森林里发现了什么？是一颗会发光的橡果！',
      '数字和字母都在等你呢，我陪你一起去。',
      '累了就休息一下，我在这里等你回来。',
      '你刚才认真做题的样子，超级帅！',
      '遇到不会的题也没关系，慢慢想，我陪着你。',
      '答错一次不要紧，我们再来一次就好啦！',
      '我把今天的勇气都借给你，接着闯关吧！',
      '风把树叶吹得沙沙响，像在给你鼓掌呢。',
      '学一会儿就抬头看看远方，眼睛也要休息哦。',
      '你今天想学点什么？我都可以陪你去。',
      '我把小爪子举高高，为你加油！',
      '等你集满星星，我们就去山顶看日出！'
    ]);
  }

  // 被摸头时说的话
  function patLine() {
    return pick([
      '嘻嘻，好痒呀～',
      '再摸一下嘛，我最喜欢被摸头啦！',
      '咕噜咕噜～舒服得想打滚！',
      '你的手好暖呀，像小太阳一样。',
      '我把自己缩成一颗团子啦！',
      '摸摸头，今天也元气满满！',
      '嘿嘿，被你发现我在偷懒了～',
      '呜哇，毛毛都被你摸顺啦！',
      '我闭上眼睛啦，再多摸三下～',
      '这是今天最开心的时刻！',
      '我的耳朵在抖，你看见了吗？',
      '被你摸头，我就什么都不怕啦。',
      '咕～我好像变成一颗会笑的小面包。',
      '摸摸头，把好运气都传给你！'
    ]);
  }

  return { clamp, stage, form, title, needExp, svg, setExpr, decay, moodWord, speakLine, patLine };
})();
