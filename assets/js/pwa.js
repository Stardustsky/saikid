/* PWA 注册：离线缓存 + 版本更新提示 */
(function () {
  if (!('serviceWorker' in navigator)) return;
  if (location.protocol === 'file:') return; // 本地双击打开时不注册

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
    }).catch(function (err) {
      console.warn('[pwa] Service Worker 注册失败', err);
    });
  });
})();
