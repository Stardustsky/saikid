/* PWA 注册：离线缓存 + 版本更新提示 */
(function () {
  if (!('serviceWorker' in navigator)) return;
  // 本地双击（file://）和原生壳（appassets:// 自定义协议）都不注册 Service Worker
  if (location.protocol !== 'http:' && location.protocol !== 'https:') return;
  // 安卓壳用自己的资源拦截提供页面，Service Worker 在这里不可靠
  if (/\.androidplatform\.net$/.test(location.hostname)) return;

  // 首装只缓存核心资源，童声台词与插画等页面空闲后再分批补进缓存。
  // 进度记在本地，Service Worker 侧遇到已缓存的文件直接跳过，所以重启不会重复下载。
  var WARM_KEY = 'xiaolongmao_warm_offset';

  function warmTotal() {
    var total = 0;
    if (typeof CAT_VOICE !== 'undefined' && CAT_VOICE) total += Object.keys(CAT_VOICE).length;
    if (typeof EMOJI_SET !== 'undefined' && EMOJI_SET) total += EMOJI_SET.size || 0;
    return total;
  }

  function readWarmOffset(total) {
    try {
      var saved = JSON.parse(localStorage.getItem(WARM_KEY) || 'null');
      // 素材清单变了（版本升级、新插画）就从头补，避免旧进度对不上
      if (!saved || saved.total !== total) return 0;
      var offset = Number(saved.offset) || 0;
      return offset >= 0 && offset <= total ? offset : 0;
    } catch (e) {
      return 0;
    }
  }

  function saveWarmOffset(total, offset) {
    try {
      localStorage.setItem(WARM_KEY, JSON.stringify({ total: total, offset: offset }));
    } catch (e) {
      /* 存不了就退回每次全量检查，跳过逻辑仍然生效 */
    }
  }

  function warmMedia() {
    var total = warmTotal();
    if (total <= 0) return;
    var step = 60;
    var offset = readWarmOffset(total);
    var idle = window.requestIdleCallback || function (fn) { return setTimeout(fn, 1200); };
    function next() {
      var ctl = navigator.serviceWorker.controller;
      if (!ctl || offset >= total) return;
      ctl.postMessage({ type: 'WARM_MEDIA', offset: offset, limit: step });
      offset = Math.min(total, offset + step);
      saveWarmOffset(total, offset);
      setTimeout(next, 2600);
    }
    idle(next);
  }

  window.addEventListener('load', function () {
    navigator.serviceWorker.register('sw.js').then(function (reg) {
      reg.addEventListener('updatefound', function () {
        var sw = reg.installing;
        if (!sw) return;
        sw.addEventListener('statechange', function () {
          // 已有版本在运行，说明这是更新包：留给下次打开生效，避免打断游戏
          if (sw.state === 'installed' && navigator.serviceWorker.controller) {
            if (window.App && App.toast) App.toast('新版本已就绪，下次打开会自动更新');
          }
        });
      });
      navigator.serviceWorker.ready.then(function () {
        setTimeout(warmMedia, 1500);
      });
    }).catch(function (err) {
      console.warn('[pwa] Service Worker 注册失败', err);
    });
  });
})();
