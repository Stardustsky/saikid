/* 小龙猫乐园 Service Worker：离线可用 + 静态资源缓存 */
const VERSION = 'xiaolongmao-v43';

/* 读取题库、本地插画清单与小龙猫语音清单，用它们生成离线预缓存列表（都只导出常量，不访问 DOM） */
importScripts('./assets/js/data.js', './assets/js/emoji-map.js', './assets/js/cat-voice.js');

const CORE = [
  './',
  './index.html',
  './manifest.json',
  './assets/css/base.css',
  './assets/css/screens.css',
  './assets/css/features.css',
  './assets/css/theme.css',
  './assets/css/minigames.css',
  './assets/css/mobile.css',
  './assets/js/data.js',
  './assets/js/emoji-map.js',
  './assets/js/art.js',
  './assets/js/storage.js',
  './assets/js/cat-voice.js',
  './assets/js/audio.js',
  './assets/js/pet.js',
  './assets/js/atlas.js',
  './assets/js/quiz-core.js',
  './assets/js/practice.js',
  './assets/js/minigames.js',
  './assets/js/games.js',
  './assets/js/app.js',
  './assets/js/pwa.js',
  './assets/fonts/zcool-kuaile.woff2',
  './assets/img/icon-192.png',
  './assets/img/icon-512.png',
  './assets/img/icon-maskable-512.png',
  './assets/img/ui/star.svg',
  './assets/img/ui/star-off.svg',
  './assets/img/ui/check.svg',
  './assets/img/ui/lock.svg',
  './assets/img/ui/coin.svg'
];

/* 拼音音节 → 本地录音文件名（与 audio.js 的 syllableKey 保持一致） */
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

/* 首次安装只缓存「打开就要用」的东西：拼音真人录音随点随听。
   童声台词包和几千张插画体积太大，改为用到时缓存，安装从 8MB+ 降到 1MB 左右 */
const PINYIN = [];
(function collectPinyin() {
  const py = (typeof DATA !== 'undefined' && DATA.pinyin) || null;
  if (!py) return;
  (py.initials || []).forEach((i) => PINYIN.push('./assets/audio/pinyin/sheng/' + i.p + '.mp3'));
  (py.localFinals || (py.finals || []).map((f) => f.p)).forEach((f) => {
    PINYIN.push('./assets/audio/pinyin/yun/' + String(f).replace(/ü/g, 'v') + '.mp3');
  });
  (py.syllables || []).forEach((s) => {
    if (s.local === false) return;
    PINYIN.push('./assets/audio/pinyin/yinjie/' + syllableKey(s.p) + '.mp3');
  });
  [1, 2, 3, 4].forEach((t) => PINYIN.push('./assets/audio/pinyin/yinjie/a' + t + '.mp3'));
})();

/* 空闲预取：童声台词 + 插画在装好之后分批补齐，不参与首屏等待 */
const WARM = [];
(function collectWarm() {
  if (typeof CAT_VOICE !== 'undefined') {
    Object.keys(CAT_VOICE).forEach((k) => WARM.push('./' + CAT_VOICE[k]));
  }
  if (typeof EMOJI_SET !== 'undefined') {
    EMOJI_SET.forEach((code) => WARM.push('./assets/img/emoji/' + code + '.svg'));
  }
})();

/* 分批缓存：单个文件缺失不影响整体安装；已经在缓存里的直接跳过，避免每次启动重复下载 */
async function precache(cache, urls, size) {
  const step = size || 24;
  for (let i = 0; i < urls.length; i += step) {
    await Promise.all(urls.slice(i, i + step).map(async (url) => {
      try {
        if (await cache.match(url)) return;
        await cache.add(url);
      } catch (err) {
        /* 忽略单个资源失败，不影响其它资源 */
      }
    }));
  }
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(VERSION).then(async (cache) => {
      await precache(cache, CORE, 8);
      await precache(cache, PINYIN);
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  const data = event.data || {};
  if (data.type === 'SKIP_WAITING') self.skipWaiting();
  // 页面空闲时补缓存童声台词与插画，装好后再慢慢补齐，不阻塞首屏
  if (data.type === 'WARM_MEDIA') {
    const offset = Math.max(0, Math.round(Number(data.offset) || 0));
    const limit = Math.max(1, Math.round(Number(data.limit) || 60));
    event.waitUntil(
      caches.open(VERSION).then((cache) => precache(cache, WARM.slice(offset, offset + limit), 12))
    );
  }
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // 在线 TTS 等跨域请求不缓存

  // 页面导航：先走网络，断网时回退到缓存的首页
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(VERSION).then((c) => c.put('./index.html', copy));
          return res;
        })
        .catch(() => caches.match('./index.html').then((r) => r || caches.match('./')))
    );
    return;
  }

  // 静态资源：先用缓存，同时后台更新（stale-while-revalidate）
  event.respondWith(
    caches.match(req).then((cached) => {
      const network = fetch(req)
        .then((res) => {
          if (res && res.status === 200 && res.type === 'basic') {
            const copy = res.clone();
            caches.open(VERSION).then((c) => c.put(req, copy));
          }
          return res;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
