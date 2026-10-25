/* 小龙猫：等级、状态与形象绘制 */
const Pet = (() => {
  /* 五个成长形态：幼龙猫 → 小龙猫 → 大龙猫 → 森林守护者 → 森之王 */
  const STAGES = [
    {
      min: 1, max: 2, form: 'baby', title: '幼龙猫', scale: 0.88,
      body: '#dfe5e0', line: '#93a19c', belly: '#fbf7ea', ear: '#f0f3ef', glow: 'rgba(190, 210, 200, .55)'
    },
    {
      min: 3, max: 4, form: 'small', title: '小龙猫', scale: 0.95,
      body: '#c3ced1', line: '#7d8d90', belly: '#fbf7ea', ear: '#e2eaec', glow: 'rgba(180, 200, 205, .55)'
    },
    {
      min: 5, max: 6, form: 'big', title: '大龙猫', scale: 1,
      body: '#a9b8bd', line: '#6d7f84', belly: '#faf6e8', ear: '#ccd8db', glow: 'rgba(160, 185, 192, .58)'
    },
    {
      min: 7, max: 9, form: 'guard', title: '森林守护者', scale: 1.02,
      body: '#a5b4cc', line: '#6b7a9e', belly: '#f7f6f2', ear: '#ccd6ea', glow: 'rgba(160, 178, 214, .62)'
    },
    {
      min: 10, max: 99, form: 'king', title: '森之王', scale: 1.05,
      body: '#b7b2da', line: '#7a74a8', belly: '#fdfbf5', ear: '#dcd8f0', glow: 'rgba(196, 186, 240, .7)'
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

  // 升级所需经验
  function needExp(level) {
    return 60 + (level - 1) * 40;
  }

  // 根据心情生成表情（坐标对应 200x220 画布）
  function face(mood) {
    if (mood >= 60) {
      return {
        cls: 'mood-happy',
        eyes: '<path d="M72 97 Q82 87 92 97" stroke="#3c4a4d" stroke-width="5.5" fill="none" stroke-linecap="round"/>' +
              '<path d="M108 97 Q118 87 128 97" stroke="#3c4a4d" stroke-width="5.5" fill="none" stroke-linecap="round"/>',
        mouth: '<path d="M92 118 Q100 127 108 118" stroke="#3c4a4d" stroke-width="4.5" fill="none" stroke-linecap="round"/>'
      };
    }
    if (mood >= 30) {
      return {
        cls: 'mood-ok',
        eyes: '<ellipse cx="82" cy="96" rx="9.5" ry="10.5" fill="#ffffff" stroke="#3c4a4d" stroke-width="2.4"/>' +
              '<ellipse cx="118" cy="96" rx="9.5" ry="10.5" fill="#ffffff" stroke="#3c4a4d" stroke-width="2.4"/>' +
              '<circle cx="83" cy="97" r="5.2" fill="#3c4a4d"/><circle cx="119" cy="97" r="5.2" fill="#3c4a4d"/>' +
              '<circle cx="85" cy="94.5" r="1.8" fill="#ffffff"/><circle cx="121" cy="94.5" r="1.8" fill="#ffffff"/>',
        mouth: '<path d="M93 119 Q100 124 107 119" stroke="#3c4a4d" stroke-width="4.5" fill="none" stroke-linecap="round"/>'
      };
    }
    return {
      cls: 'mood-sad',
      eyes: '<ellipse cx="82" cy="98" rx="9.5" ry="10.5" fill="#ffffff" stroke="#3c4a4d" stroke-width="2.4"/>' +
            '<ellipse cx="118" cy="98" rx="9.5" ry="10.5" fill="#ffffff" stroke="#3c4a4d" stroke-width="2.4"/>' +
            '<circle cx="81" cy="100" r="5" fill="#3c4a4d"/><circle cx="117" cy="100" r="5" fill="#3c4a4d"/>' +
            '<path d="M70 80 L90 86" stroke="#3c4a4d" stroke-width="4.5" stroke-linecap="round"/>' +
            '<path d="M130 80 L110 86" stroke="#3c4a4d" stroke-width="4.5" stroke-linecap="round"/>',
      mouth: '<path d="M93 124 Q100 115 107 124" stroke="#3c4a4d" stroke-width="4.5" fill="none" stroke-linecap="round"/>'
    };
  }

  // 生成小龙猫 SVG
  function svg(level, mood, extraClass = '') {
    const st = stage(level);
    const f = face(mood);
    const id = 'pg' + (++gradSeed);
    const baby = st.form === 'baby';
    const crown = isOneOf(st.form, ['big', 'guard', 'king']);
    const wings = isOneOf(st.form, ['guard', 'king']);
    const halo = st.form === 'king';
    const sparkle = level >= 3;

    const earRX = baby ? 12 : 16;
    const earRY = baby ? 22 : 30;
    const earY = baby ? 58 : 54;

    // 幼龙猫：头顶一小撮绒毛
    const tuft = baby
      ? `<path d="M100 40 Q94 26 103 18 Q110 30 100 40 Z" fill="${st.body}" stroke="${st.line}" stroke-width="3.5" stroke-linejoin="round"/>`
      : '';
    // 小龙猫起：额头小嫩芽
    const sprout = st.form === 'small'
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

    return `
    <div class="pet-wrap ${f.cls} ${extraClass}" data-form="${st.form}">
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
          <ellipse cx="35" cy="132" rx="11" ry="19" transform="rotate(-18 35 132)"
            fill="${st.body}" stroke="${st.line}" stroke-width="4.5"/>
          <ellipse cx="165" cy="132" rx="11" ry="19" transform="rotate(18 165 132)"
            fill="${st.body}" stroke="${st.line}" stroke-width="4.5"/>
          <!-- 肚皮 -->
          <ellipse cx="100" cy="150" rx="45" ry="42" fill="${st.belly}"/>
          <g stroke="${st.line}" stroke-width="4" fill="none" stroke-linecap="round" opacity=".42">
            <path d="M88 133 Q100 141 112 133"/>
            <path d="M86 146 Q100 155 114 146"/>
            <path d="M86 159 Q100 168 114 159"/>
            <path d="M88 172 Q100 180 112 172"/>
          </g>
          ${tuft}
          ${sprout}
          ${leafCrown}
          ${tiara}
          ${f.eyes}
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
          ${f.mouth}
        </g>
        ${sparkles}
      </svg>
    </div>`;
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

  function speakLine(p) {
    if (p.hunger < 25) return '肚子咕咕叫啦，给我一颗橡果吧～';
    if (p.clean < 25) return '我身上脏脏的，想洗个香香澡～';
    if (p.mood < 25) return '陪我玩一会儿嘛，森林里好安静呀～';
    if (p.mood >= 80 && p.hunger >= 70) return '我今天超有精神，一起去学习吧！';
    const lines = [
      '今天也要加油哦！',
      '学完知识，记得回森林看看我～',
      '我最喜欢和你一起玩啦！',
      '答对题目可以赚星星哦！'
    ];
    return lines[Math.floor(Math.random() * lines.length)];
  }

  return { clamp, stage, form, title, needExp, svg, decay, moodWord, speakLine };
})();
