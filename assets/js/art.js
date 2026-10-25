/* 插画素材：用本地 Twemoji SVG 替换 emoji，跨设备显示一致，也更有儿童绘本的感觉 */
const Art = (() => {
  // 与 assets/img/emoji 文件名一致：小写十六进制、去掉变体选择符、保留 ZWJ
  const RE = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}]\uFE0F?(?:\u200D[\u{1F000}-\u{1FAFF}\u2600-\u27BF]\uFE0F?)*/gu;

  function key(emoji) {
    return [...String(emoji)]
      .map(c => c.codePointAt(0))
      .filter(cp => cp !== 0xfe0f)
      .map(cp => cp.toString(16))
      .join('-');
  }

  function img(name, ch) {
    return `<img class="em" src="assets/img/emoji/${name}.svg" alt="${ch}" draggable="false">`;
  }

  // 把字符串里的 emoji 换成插画，其余字符原样保留
  function em(text) {
    const s = text == null ? '' : String(text);
    if (!s) return '';
    return s.replace(RE, m => (EMOJI_SET.has(key(m)) ? img(key(m), m) : m));
  }

  // 界面小图标（星星、对勾），尺寸与颜色由 CSS 控制
  const UI = {
    star: 'star',
    'star-off': 'star-off',
    check: 'check',
    lock: 'lock',
    coin: 'coin'
  };

  function ui(name, cls) {
    const f = UI[name];
    if (!f) return '';
    const extra = cls ? ` ${cls}` : '';
    return `<img class="ui-ic ui-${name}${extra}" src="assets/img/ui/${f}.svg" alt="" draggable="false">`;
  }

  // 一排 3 颗星，亮 n 颗
  function stars(n, total) {
    const t = total || 3;
    let out = '';
    for (let i = 1; i <= t; i++) out += ui(i <= n ? 'star' : 'star-off');
    return `<span class="star-row">${out}</span>`;
  }

  return { em, key, ui, stars };
})();
