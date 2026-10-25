/* 跟读与描红：录音回放 + 手写覆盖评分，补上「说出来、写出来」的练习闭环 */
const Practice = (() => {
  const $ = sel => document.querySelector(sel);
  const modal = () => $('#practice-modal');

  let recording = null;
  let chunks = [];
  let stream = null;
  let stopTimer = 0;
  let playing = null;

  /* ---------- 通用 ---------- */

  function openPane(which, title) {
    const m = modal();
    if (!m) return false;
    $('#practice-title').textContent = title || '练习';
    $('#pane-follow').classList.toggle('show', which === 'follow');
    $('#pane-trace').classList.toggle('show', which === 'trace');
    m.classList.add('open');
    return true;
  }

  function close() {
    stopAll();
    const m = modal();
    if (m) m.classList.remove('open');
  }

  function stopAll() {
    clearTimeout(stopTimer);
    if (recording && recording.state === 'recording') {
      try { recording.stop(); } catch (e) { /* 忽略 */ }
    }
    recording = null;
    if (stream) {
      stream.getTracks().forEach(t => t.stop());
      stream = null;
    }
    if (playing) {
      try { playing.pause(); } catch (e) { /* 忽略 */ }
      playing = null;
    }
    AudioFX.stopSpeak();
  }

  function starHtml(n, total) {
    return Art.stars(n, total);
  }

  /* ---------- 跟读 ---------- */

  const canRecord = () => !!(window.MediaRecorder && navigator.mediaDevices && navigator.mediaDevices.getUserMedia);

  function openFollow({ text, lang, audio, word, onDone }) {
    if (!openPane('follow', '跟读练习')) return;
    stopAll();

    $('#follow-word').textContent = word || text || '';
    $('#follow-state').textContent = canRecord()
      ? '点下面的按钮，跟着读一遍吧'
      : '这个浏览器不支持录音，可以大声读一遍再点「我读好了」';
    $('#btn-record').textContent = canRecord() ? '🎤 开始跟读' : '✅ 我读好了';
    $('#btn-record').disabled = false;
    $('#follow-result').innerHTML = '';

    const speak = () => {
      AudioFX.unlock();
      if (audio) AudioFX.speak(text, lang, audio);
      else AudioFX.speak(text, lang);
    };

    const listenBtn = $('#follow-listen');
    listenBtn.onclick = speak;

    const btn = $('#btn-record');
    btn.onclick = () => {
      AudioFX.unlock();
      if (!canRecord()) {
        // 无录音能力：自评，仍然完成一次「开口读」
        $('#follow-result').innerHTML =
          '<div class="practice-ok">读得真响亮！</div>' +
          '<div class="practice-stars">' + starHtml(2, 3) + '</div>';
        if (onDone) onDone({ kind: 'follow', score: 0.7, stars: 2 });
        return;
      }
      startRecord(speak, onDone);
    };

    speak();
  }

  function startRecord(speak, onDone) {
    const btn = $('#btn-record');
    const state = $('#follow-state');
    const result = $('#follow-result');
    btn.disabled = true;
    result.innerHTML = '';
    state.textContent = '正在听你读……读完会自动停下';

    chunks = [];
    navigator.mediaDevices.getUserMedia({ audio: true }).then(s => {
      stream = s;
      const type = window.MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : '';
      recording = new MediaRecorder(stream, type ? { mimeType: type } : undefined);
      recording.ondataavailable = e => { if (e.data && e.data.size) chunks.push(e.data); };
      recording.onstop = () => {
        if (stream) {
          stream.getTracks().forEach(t => t.stop());
          stream = null;
        }
        btn.disabled = false;
        btn.textContent = '🎤 再读一次';
        state.textContent = '录好啦，听听自己的声音～';
        const blob = new Blob(chunks, { type: chunks[0] && chunks[0].type || 'audio/webm' });
        const url = URL.createObjectURL(blob);
        result.innerHTML =
          '<audio class="practice-audio" controls src="' + url + '"></audio>' +
          '<div class="practice-rate">' +
            '<button class="btn btn-green btn-sm" type="button" data-rate="good">读得像</button>' +
            '<button class="btn btn-ghost btn-sm" type="button" data-rate="again">再读一次</button>' +
          '</div>' +
          '<div class="practice-tip">录音只在本机播放，不会上传。</div>';
        playing = result.querySelector('audio');
        if (playing) playing.play().catch(() => {});
        result.querySelectorAll('[data-rate]').forEach(b => {
          b.onclick = () => {
            if (b.dataset.rate === 'good') {
              result.innerHTML += '<div class="practice-ok">太棒了，跟着再听一遍原音吧！</div>' +
                '<div class="practice-stars">' + starHtml(3, 3) + '</div>';
              if (onDone) onDone({ kind: 'follow', score: 1, stars: 3 });
              speak();
            } else {
              result.innerHTML = '';
              state.textContent = '慢慢来，先听一遍再读';
              speak();
            }
          };
        });
        setTimeout(() => URL.revokeObjectURL(url), 60000);
      };
      recording.start();
      clearTimeout(stopTimer);
      stopTimer = setTimeout(() => {
        if (recording && recording.state === 'recording') recording.stop();
      }, 4000);
    }).catch(() => {
      btn.disabled = false;
      btn.textContent = '✅ 我读好了';
      state.textContent = '没有拿到麦克风权限，可以大声读一遍再点按钮';
      btn.onclick = () => {
        result.innerHTML = '<div class="practice-ok">读得真响亮！</div>' +
          '<div class="practice-stars">' + starHtml(2, 3) + '</div>';
        if (onDone) onDone({ kind: 'follow', score: 0.7, stars: 2 });
      };
    });
  }

  /* ---------- 描红 ---------- */

  let traceOnDone = null;
  let traceGlyph = '';
  let traceMask = null;
  let traceCtx = null;
  let traceDrawing = false;
  let traceLast = null;
  let traceInk = 0;

  function glyphFont(size) {
    return '700 ' + size + 'px "PingFang SC","Hiragino Sans GB","Microsoft YaHei","Noto Sans SC",sans-serif';
  }

  function buildMask(canvas, glyph) {
    const off = document.createElement('canvas');
    off.width = canvas.width;
    off.height = canvas.height;
    const c = off.getContext('2d');
    c.clearRect(0, 0, off.width, off.height);
    c.fillStyle = '#000';
    c.font = glyphFont(Math.round(off.width * 0.78));
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText(glyph, off.width / 2, off.height / 2);
    const data = c.getImageData(0, 0, off.width, off.height).data;
    const mask = new Uint8Array(off.width * off.height);
    let count = 0;
    for (let i = 0; i < mask.length; i++) {
      // 只取笔画中心区域，避免把描边留白算进去
      if (data[i * 4 + 3] > 110) { mask[i] = 1; count++; }
    }
    return { mask, count, w: off.width, h: off.height };
  }

  function drawGuide() {
    const cv = $('#trace-canvas');
    const ctx = traceCtx;
    ctx.clearRect(0, 0, cv.width, cv.height);
    // 田字格
    ctx.save();
    ctx.strokeStyle = 'rgba(122,160,140,.35)';
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 10]);
    ctx.beginPath();
    ctx.moveTo(cv.width / 2, 10); ctx.lineTo(cv.width / 2, cv.height - 10);
    ctx.moveTo(10, cv.height / 2); ctx.lineTo(cv.width - 10, cv.height / 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.strokeRect(6, 6, cv.width - 12, cv.height - 12);
    ctx.restore();

    ctx.save();
    ctx.fillStyle = 'rgba(150,170,160,.28)';
    ctx.font = glyphFont(Math.round(cv.width * 0.78));
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(traceGlyph, cv.width / 2, cv.height / 2);
    ctx.restore();

    traceInk = 0;
    $('#trace-result').innerHTML = '';
  }

  function openTrace({ glyph, word, onDone }) {
    if (!glyph || !openPane('trace', '描红练习')) return;
    stopAll();
    traceGlyph = glyph;
    traceOnDone = onDone || null;
    const cv = $('#trace-canvas');
    traceCtx = cv.getContext('2d');
    $('#trace-word').textContent = word || glyph;
    $('#trace-result').innerHTML = '';
    traceMask = buildMask(cv, glyph);
    drawGuide();

    if (!cv.dataset.bound) {
      cv.dataset.bound = '1';
      const pos = e => {
        const r = cv.getBoundingClientRect();
        return {
          x: (e.clientX - r.left) * cv.width / r.width,
          y: (e.clientY - r.top) * cv.height / r.height
        };
      };
      cv.addEventListener('pointerdown', e => {
        e.preventDefault();
        cv.setPointerCapture(e.pointerId);
        traceDrawing = true;
        traceLast = pos(e);
      });
      cv.addEventListener('pointermove', e => {
        if (!traceDrawing) return;
        const p = pos(e);
        traceCtx.strokeStyle = '#3d5a4c';
        traceCtx.lineWidth = 16;
        traceCtx.lineCap = 'round';
        traceCtx.lineJoin = 'round';
        traceCtx.beginPath();
        traceCtx.moveTo(traceLast.x, traceLast.y);
        traceCtx.lineTo(p.x, p.y);
        traceCtx.stroke();
        traceInk += Math.hypot(p.x - traceLast.x, p.y - traceLast.y) * 16;
        traceLast = p;
      });
      const end = () => { traceDrawing = false; };
      cv.addEventListener('pointerup', end);
      cv.addEventListener('pointercancel', end);
      cv.addEventListener('pointerleave', end);
    }

    $('#btn-trace-clear').onclick = drawGuide;
    $('#btn-trace-done').onclick = scoreTrace;
  }

  function scoreTrace() {
    const cv = $('#trace-canvas');
    const out = $('#trace-result');
    if (traceInk < 120) {
      out.innerHTML = '<div class="practice-tip">先在灰色的字上描一描，再点「写好了」。</div>';
      return;
    }
    const img = traceCtx.getImageData(0, 0, cv.width, cv.height).data;
    let drawn = 0;
    let hit = 0;
    for (let i = 0; i < traceMask.mask.length; i++) {
      const a = img[i * 4 + 3];
      // 只统计深色笔迹，忽略田字格和灰字
      const r = img[i * 4];
      const g = img[i * 4 + 1];
      const b = img[i * 4 + 2];
      const dark = a > 60 && r < 120 && g < 140 && b < 130;
      if (!dark) continue;
      drawn++;
      if (traceMask.mask[i]) hit++;
    }
    if (!drawn) {
      out.innerHTML = '<div class="practice-tip">还没有看到笔迹，再写一次吧。</div>';
      return;
    }
    const coverage = hit / Math.max(1, traceMask.count);
    const stray = 1 - hit / drawn;
    const score = Math.max(0, Math.min(1, coverage * (1 - stray * 0.55)));
    const stars = score >= 0.62 ? 3 : score >= 0.38 ? 2 : 1;
    out.innerHTML =
      '<div class="practice-stars">' + starHtml(stars, 3) + '</div>' +
      '<div class="practice-tip">描到了 ' + Math.round(coverage * 100) + '% 的笔画，' +
      (stars === 3 ? '写得真准！' : stars === 2 ? '不错，再描一次会更像～' : '慢慢来，跟着灰字一笔一笔描。') + '</div>';
    if (traceOnDone) traceOnDone({ kind: 'trace', score, stars });
  }

  document.addEventListener('DOMContentLoaded', () => {
    const m = modal();
    if (!m) return;
    m.addEventListener('click', e => {
      if (e.target === m) close();
    });
    const closeBtn = m.querySelector('[data-close]');
    if (closeBtn) closeBtn.addEventListener('click', close);
  });

  window.addEventListener('pagehide', stopAll);

  return {
    openFollow,
    openTrace,
    close,
    canRecord
  };
})();
