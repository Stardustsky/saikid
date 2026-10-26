/* 音效与语音朗读：音效由 WebAudio 合成；朗读优先使用在线语音（标准发音），失败自动回退系统语音 */
const AudioFX = (() => {
  let ctx = null;
  let master = null;
  let soundOn = true;
  let voiceOn = true;
  let onlineOn = true;
  let lastSpeakKey = '';
  let lastSpeakAt = 0;

  let voices = [];
  let voiceCache = {};
  let queue = [];
  let gen = 0;
  let doneCb = null;
  let catLast = '';
  let catAt = 0;

  // 在线语音（无需任何 Key）：
  // - 中文：百度翻译 TTS，任意句子都能合成，音色自然
  // - 英文：有道词典真人发音（单词最标准），失败再退到百度英文 TTS
  // 每个词条有多个候选地址，全部失败才回退系统语音，并按语言分别冷却
  const ONLINE_TIMEOUT = 8000;
  const DOWN_TTL = { zh: 30000, en: 60000 };
  const downAt = { zh: 0, en: 0 };
  const failCount = { zh: 0, en: 0 };
  const failedUrls = new Set();
  let audioEl = null;
  const preloads = new Map();

  // 本地素材（CC0 音效 + 真人拼音发音）：优先播放素材，缺失或解码失败再退回合成音 / 在线语音
  const SFX_FILES = {
    click: 'assets/audio/sfx/click.wav',
    pop: 'assets/audio/sfx/pop.wav',
    correct: 'assets/audio/sfx/correct.wav',
    wrong: 'assets/audio/sfx/wrong.wav',
    coin: 'assets/audio/sfx/coin.wav',
    care: 'assets/audio/sfx/care.wav',
    levelUp: 'assets/audio/sfx/levelUp.wav'
  };
  const sfxBroken = new Set();

  function playSfx(name, fallback) {
    if (!soundOn) return;
    const src = SFX_FILES[name];
    if (!src || sfxBroken.has(name)) { fallback(); return; }
    let a = null;
    try {
      a = new Audio(src);
      a.volume = 0.5;
    } catch (e) {
      fallback();
      return;
    }
    a.onerror = () => { sfxBroken.add(name); fallback(); };
    const p = a.play();
    if (p && p.catch) {
      p.catch(err => {
        const n = err && err.name;
        // 自动播放限制、被下一次点击打断都属正常，交回合成音也无意义
        if (n === 'NotAllowedError' || n === 'AbortError') return;
        fallback();
      });
    }
  }

  // 音色评分关键词：优先自然音色，排除机械音
  const VOICE_RULES = [
    { re: /(natural|neural)/i, score: 70 },
    { re: /google (us|uk) english/i, score: 55 },
    { re: /(samantha|ava|allison|serena|karen|daniel|moira|tessa|jenny|aria|guy)/i, score: 45 },
    // 中文音色：优先温暖的女声（晓晓/瑶瑶），胡慧、康康排在后面
    { re: /(xiaoxiao|xiaoyi|yaoyao|meijia)/i, score: 64 },
    { re: /(yunxi|yunjian|ting-?ting)/i, score: 52 },
    { re: /(huihui|kangkang)/i, score: 44 },
    { re: /microsoft/i, score: 20 },
    { re: /(compact|robot|legacy)/i, score: -35 },
    { re: /espeak/i, score: -100 }
  ];

  // 不同语言的朗读参数：放慢一点、音调略高，更接近幼儿园老师
  const TUNE = {
    'zh-CN': { rate: 0.88, pitch: 1.08 },
    'en-US': { rate: 0.8, pitch: 1.04 },
    'en-GB': { rate: 0.8, pitch: 1.04 }
  };

  function ensure() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.72;
      master.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function tone(freq, startAt, dur, type = 'sine', vol = 0.14) {
    if (!soundOn) return;
    const c = ensure();
    if (!c) return;
    const t0 = c.currentTime + startAt;
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain);
    gain.connect(master || c.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.06);
  }

  // 滑音：让提示音不那么“电子”
  function glide(from, to, startAt, dur, type = 'sine', vol = 0.1) {
    if (!soundOn) return;
    const c = ensure();
    if (!c) return;
    const t0 = c.currentTime + startAt;
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(from, t0);
    osc.frequency.exponentialRampToValueAtTime(to, t0 + dur);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain);
    gain.connect(master || c.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.06);
  }

  function arp(freqs, gap, dur, type, vol) {
    freqs.forEach((f, i) => tone(f, i * gap, dur, type, vol));
  }

  function loadVoices() {
    if (!('speechSynthesis' in window)) return;
    try {
      voices = window.speechSynthesis.getVoices() || [];
    } catch (e) {
      voices = [];
    }
    voiceCache = {};
  }

  function pickVoice(lang) {
    if (!voices.length) loadVoices();
    if (voiceCache[lang] !== undefined) return voiceCache[lang];
    const base = lang.slice(0, 2).toLowerCase();
    let best = null;
    let bestScore = -Infinity;
    voices.forEach(v => {
      const vl = String(v.lang || '').replace('_', '-').toLowerCase();
      if (vl.slice(0, 2) !== base) return;
      let score = 0;
      if (vl === lang.toLowerCase()) score += 20;
      else if (vl.indexOf(base) === 0) score += 6;
      if (v.localService) score += 4;
      const name = v.name || '';
      VOICE_RULES.forEach(r => { if (r.re.test(name)) score += r.score; });
      if (score > bestScore) {
        bestScore = score;
        best = v;
      }
    });
    voiceCache[lang] = best;
    return best;
  }

  function nextUtterance(myGen) {
    if (myGen !== gen) return;
    const seg = queue.shift();
    if (!seg) { finishAll(); return; }
    const lang = seg.lang || 'zh-CN';
    const tune = TUNE[lang] || (lang.slice(0, 2) === 'zh' ? TUNE['zh-CN'] : TUNE['en-US']);
    try {
      const u = new SpeechSynthesisUtterance(spoken(seg.text, lang));
      u.lang = lang;
      u.rate = seg.rate || tune.rate;
      u.pitch = seg.pitch || tune.pitch;
      u.volume = 1;
      const v = pickVoice(lang);
      if (v) {
        u.voice = v;
        u.lang = v.lang || lang;
      }
      u.onend = () => {
        if (myGen === gen) setTimeout(() => nextUtterance(myGen), seg.gap || 90);
      };
      u.onerror = () => {
        if (myGen === gen) setTimeout(() => nextUtterance(myGen), seg.gap || 90);
      };
      window.speechSynthesis.speak(u);
    } catch (e) {
      queue = [];
    }
  }

  /* ---------- 在线语音（标准发音） ---------- */

  function langKey(lang) {
    return String(lang || 'zh-CN').slice(0, 2).toLowerCase() === 'zh' ? 'zh' : 'en';
  }

  function canOnline(lang) {
    const k = langKey(lang);
    return onlineOn && navigator.onLine !== false && Date.now() - downAt[k] > DOWN_TTL[k];
  }

  function markOk(lang) {
    failCount[langKey(lang)] = 0;
  }

  // 连续 2 次失败才冷却，避免个别词条没录音就把整门语言停掉
  function markFail(lang) {
    const k = langKey(lang);
    failCount[k]++;
    if (failCount[k] >= 2) {
      downAt[k] = Date.now();
      failCount[k] = 0;
    }
  }

  function stopAudio() {
    if (!audioEl) return;
    try { audioEl.pause(); } catch (e) { /* 忽略 */ }
    try { audioEl.removeAttribute('src'); audioEl.load(); } catch (e) { /* 忽略 */ }
    audioEl = null;
  }

  function cleanText(text) {
    return String(text).replace(/["“”]/g, '').trim();
  }

  // 单个字母按「字母名」朗读：
  // 直接送 "A" 给部分语音会被当成冠词 a 读成 /ə/，这就是 A 不读 /eɪ/ 的原因
  const LETTER_NAMES = {
    A: 'ay', B: 'bee', C: 'see', D: 'dee', E: 'ee', F: 'eff', G: 'jee',
    H: 'aitch', I: 'eye', J: 'jay', K: 'kay', L: 'ell', M: 'em', N: 'en',
    O: 'oh', P: 'pee', Q: 'cue', R: 'ar', S: 'ess', T: 'tee', U: 'you',
    V: 'vee', W: 'double you', X: 'ex', Y: 'why', Z: 'zee'
  };

  function spoken(text, lang) {
    const t = cleanText(text);
    if (langKey(lang) === 'en' && LETTER_NAMES[t.toUpperCase()]) return LETTER_NAMES[t.toUpperCase()];
    return t;
  }

  function baiduTTS(lan, text) {
    return 'https://fanyi.baidu.com/gettts?lan=' + lan + '&spd=5&source=web&text=' + encodeURIComponent(text);
  }

  function youdaoTTS(text) {
    return 'https://dict.youdao.com/dictvoice?type=2&audio=' + encodeURIComponent(text);
  }

  // 主地址：
  // - 中文整句 → 百度 TTS
  // - 单字母 → 先换成字母名拼写（ay / bee / see…），保证读的是字母名
  // - 单个英文单词 → 有道真人词典发音
  // - 英文短语/句子 → 百度英文 TTS（词典没有整句发音）
  function onlineUrl(text, lang) {
    const t = spoken(text, lang);
    if (langKey(lang) === 'zh') return baiduTTS('zh', t);
    if (/\s/.test(t)) return baiduTTS('en', t);
    return youdaoTTS(t);
  }

  // 备用地址：两个源互相兜底，全是标准发音
  function backupUrl(text, lang) {
    const t = spoken(text, lang);
    if (langKey(lang) === 'zh') return baiduTTS('zh', t);
    return baiduTTS('en', t);
  }

  // 提前把题目语音下载到浏览器缓存，点开题目时几乎无延迟
  function preload(holder) {
    if (!holder) return;
    const list = Array.isArray(holder) ? holder : [holder];
    list.forEach(seg => {
      if (!seg) return;
      const urls = [];
      if (seg.audio) urls.push(...(Array.isArray(seg.audio) ? seg.audio : [seg.audio]));
      if (seg.text && canOnline(seg.lang)) urls.push(onlineUrl(seg.text, seg.lang));
      urls.forEach(url => {
        if (!url || preloads.has(url) || failedUrls.has(url)) return;
        const a = new Audio();
        a.preload = 'auto';
        a.src = url;
        try { a.load(); } catch (e) { /* 忽略 */ }
        preloads.set(url, a);
        if (preloads.size > 40) {
          const k = preloads.keys().next().value;
          const old = preloads.get(k);
          try { old.src = ''; } catch (e) { /* 忽略 */ }
          preloads.delete(k);
        }
      });
    });
  }

  // 逐段朗读：本地真人素材 → 在线语音 → 系统语音，某一段失败只影响这一段
  function speakQueue(list, myGen) {
    if (myGen !== gen || !list.length) return;
    const seg = list[0];
    const urls = [];
    if (seg.audio) urls.push(...(Array.isArray(seg.audio) ? seg.audio : [seg.audio]));
    if (canOnline(seg.lang)) {
      urls.push(onlineUrl(seg.text, seg.lang), backupUrl(seg.text, seg.lang));
    }
    const uniq = urls.filter((u, i, arr) => u && arr.indexOf(u) === i && !failedUrls.has(u));
    if (!uniq.length) {
      speakLocal(list, myGen);
      return;
    }
    playFrom(list, myGen, uniq);
  }

  // 复用预加载好的音频元素，避免同一句话下载两次，播放几乎零等待
  function takePreload(url) {
    const a = preloads.get(url);
    if (!a) return null;
    preloads.delete(url);
    return a;
  }

  // 依次尝试候选地址，任何一个成功就继续读下一段
  function playFrom(list, myGen, urls) {
    if (myGen !== gen) return;
    const seg = list[0];
    const url = urls[0];
    const rest = urls.slice(1);
    const a = takePreload(url) || new Audio(url);
    a.preload = 'auto';
    a.volume = 1;
    audioEl = a;
    let settled = false;
    let timer = null;

    const finish = ok => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (myGen !== gen) return;
      audioEl = null;
      if (!ok) {
        failedUrls.add(url);
        // 还有备用地址就继续试，全都失败才退回系统语音
        if (rest.length) playFrom(list, myGen, rest);
        else {
          if (url.indexOf('http') === 0) markFail(seg.lang);
          speakLocal(list, myGen);
        }
        return;
      }
      markOk(seg.lang);
      if (list.length === 1) { finishAll(); return; }
      setTimeout(() => speakQueue(list.slice(1), myGen), seg.gap || 90);
    };

    timer = setTimeout(() => finish(false), ONLINE_TIMEOUT);
    // 只要真正开始播放就取消超时，长句不会被误判成“加载失败”
    a.onplaying = () => {
      clearTimeout(timer);
      timer = null;
    };
    a.onended = () => finish(true);
    a.onerror = () => finish(false);
    const p = a.play();
    if (p && p.catch) {
      p.catch(err => {
        // 自动播放限制、或朗读被下一次语音打断（AbortError）都不是网络问题：
        // 静默结束，不降级、也不计入冷却，否则连续答题会把在线语音误判为不可用
        const name = err && err.name;
        if (name === 'NotAllowedError' || name === 'AbortError') {
          settled = true;
          clearTimeout(timer);
          if (audioEl === a) audioEl = null;
          return;
        }
        finish(false);
      });
    }
  }

  /* ---------- 字母歌（ABC Song · 小星星旋律） ---------- */

  // 26 个字母各自唱一个音，按《小星星》的旋律排好，听感是一首歌，而不是一个一个念字母
  const ABC_NOTES = { C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99, A5: 880 };
  const ABC_MELODY = [
    ['A', 'C5', 1], ['B', 'C5', 1], ['C', 'G5', 1], ['D', 'G5', 1],
    ['E', 'A5', 1], ['F', 'A5', 1], ['G', 'G5', 1.8],
    ['H', 'F5', 1], ['I', 'F5', 1], ['J', 'E5', 1], ['K', 'E5', 1],
    ['L', 'D5', 1], ['M', 'D5', 1], ['N', 'C5', 1.8],
    ['O', 'G5', 1], ['P', 'G5', 1], ['Q', 'F5', 1], ['R', 'F5', 1],
    ['S', 'E5', 1], ['T', 'E5', 1.8],
    ['U', 'D5', 1], ['V', 'D5', 1], ['W', 'C5', 1], ['X', 'D5', 1],
    ['Y', 'D5', 1], ['Z', 'C5', 2.2]
  ];
  let songTimers = [];
  let songNodes = [];

  function stopSong() {
    songTimers.forEach(clearTimeout);
    songTimers = [];
    // 已排程的音符也要立刻收声，否则停止后还会继续响十几秒
    songNodes.forEach(n => { try { n.stop(); } catch (e) { /* 忽略 */ } });
    songNodes = [];
  }

  // 字母歌专用发声：把振荡器记下来，随时可以整体掐断
  function songNote(freq, startAt, dur, type, vol) {
    const c = ensure();
    if (!c) return;
    const t0 = c.currentTime + startAt;
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain);
    gain.connect(master || c.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.06);
    songNodes.push(osc);
  }

  // 播放字母歌，逐字母回调给页面做高亮；返回停止函数
  function abcSong(opt) {
    const o = opt || {};
    stopSong();
    if (soundOn) ensure();
    const beat = 0.42;
    let at = 0;
    ABC_MELODY.forEach(([letter, note, beats]) => {
      const freq = ABC_NOTES[note];
      const dur = beat * beats * 0.92;
      if (soundOn) {
        // 主旋律 + 低八度轻垫音，听起来更饱满
        songNote(freq, at, dur, 'triangle', 0.085);
        songNote(freq / 2, at, dur, 'sine', 0.04);
      }
      songTimers.push(setTimeout(() => {
        if (o.onLetter) o.onLetter(letter);
      }, at * 1000));
      at += beat * beats;
    });
    songTimers.push(setTimeout(() => {
      songTimers = [];
      if (o.onDone) o.onDone();
    }, (at + 0.1) * 1000));
    return stopSong;
  }

  /* ---------- 系统语音（离线回退） ---------- */

  /* 一段台词读完后的回调（用在小龙猫故事后自动开局） */
  function finishAll() {
    if (!doneCb) return;
    const cb = doneCb;
    doneCb = null;
    try { cb(); } catch (e) { /* 忽略 */ }
  }

  function speakLocal(list, myGen) {
    if (!('speechSynthesis' in window)) { finishAll(); return; }
    queue = list.slice();
    try { window.speechSynthesis.cancel(); } catch (e) { /* 忽略 */ }
    // cancel 之后立刻 speak，部分浏览器会把新句子吞掉，留一个极短的间隔最稳
    setTimeout(() => nextUtterance(myGen), 30);
  }

  function speakSegments(segments, opt) {
    if (!voiceOn) return;
    const list = (Array.isArray(segments) ? segments : [segments])
      .filter(s => s && s.text !== undefined && s.text !== '');
    if (!list.length) return;
    gen++;
    const myGen = gen;
    doneCb = opt && typeof opt.done === 'function' ? opt.done : null;
    stopAudio();
    try { if (window.speechSynthesis) window.speechSynthesis.cancel(); } catch (e) { /* 忽略 */ }
    // 指定 local 时直接用系统音色：不用等音频下载，点一下就能开口
    if (!(opt && opt.local) && canOnline(list[0].lang)) speakQueue(list, myGen);
    else speakLocal(list, myGen);
  }

  function stopSpeak() {
    gen++;
    queue = [];
    doneCb = null;
    stopAudio();
    stopSong();
    try {
      if (window.speechSynthesis) window.speechSynthesis.cancel();
    } catch (e) { /* 忽略 */ }
  }

  // 长句按标点拆成短句，读出自然的停顿，避免一口气念完的机械感
  function splitClauses(text) {
    return String(text)
      .replace(/([，,。！？；;、])/g, '$1\u0001')
      .split('\u0001')
      .map(s => s.trim())
      .filter(Boolean);
  }

  function speak(text, lang = 'zh-CN', audio = '') {
    if (!voiceOn || !text) return;
    const key = text + '|' + lang;
    const now = Date.now();
    if (key === lastSpeakKey && now - lastSpeakAt < 500) return;
    lastSpeakKey = key;
    lastSpeakAt = now;
    const raw = String(text);
    const parts = (!audio && lang.slice(0, 2) === 'zh' && raw.length >= 10) ? splitClauses(raw) : [raw];
    speakSegments(parts.map((t, i) => ({
      text: t,
      lang: lang,
      audio: i === 0 ? audio : '',
      gap: i === parts.length - 1 ? 90 : 210
    })));
  }

  /* ---------- 小龙猫的台词 ---------- */

  // 只在句号/问号/感叹号处断句：逗号交给语音自己停顿，分批拼接的痕迹最少
  function splitSentences(text) {
    return String(text)
      .replace(/([。！？!?；;])/g, '$1\u0001')
      .split('\u0001')
      .map(s => s.trim())
      .filter(Boolean);
  }

  // 同一句话永远用同一套语气，不同句子之间音高语速略有差别，避免一路平读
  function tuneSeed(text) {
    let h = 7;
    for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) % 9973;
    return h;
  }

  // 离线引擎不认识「～」，换成逗号当气口，读起来不那么像念稿子
  function forSpeech(text) {
    return String(text)
      .replace(/[～~]+/g, '，')
      .replace(/([，、])([。！？!?])/g, '$2')
      .replace(/[，、]+$/, '');
  }

  // 音色更奶、语速更慢；soft 模式在题目朗读时不插嘴，force 用于点按重播
  function speakCat(text, opt) {
    if (!voiceOn || !text) return;
    const t = cleanText(text);
    if (!t) return;
    const o = opt || {};
    const now = Date.now();
    const busy = !!audioEl ||
      !!(window.speechSynthesis && (window.speechSynthesis.speaking || window.speechSynthesis.pending));
    if (!o.force && !o.done && t === catLast && now - catAt < 6000) return;
    if (o.soft && busy) return;
    catLast = t;
    catAt = now;

    // 预先下载好的真人语音包：命中就播本地 mp3，点一下立即出声，断网也照样能说
    const file = (typeof CAT_VOICE !== 'undefined' && CAT_VOICE[t]) ? CAT_VOICE[t] : '';
    if (file) {
      speakSegments({
        text: t,
        lang: 'zh-CN',
        audio: file,
        gap: 110
      }, { done: o.done });
      return;
    }

    // 没收录的台词才退回系统语音：点一下立即开口，也能和气泡文字同步
    const local = 'speechSynthesis' in window;
    // 离线引擎自己懂标点停顿，整句一次读完最连贯；在线语音才需要按句拆
    const say = local ? forSpeech(t) : t;
    const parts = local ? [say] : (t.length >= 18 ? splitSentences(t) : [t]);
    const seed = tuneSeed(t);
    const rate = 0.86 + (seed % 4) * 0.02;      // 0.86 ~ 0.92，像小朋友慢慢说话
    const pitch = 1.06 + (seed % 5) * 0.02;     // 1.06 ~ 1.14，略高一点又不至于失真
    const segs = parts.map((p, i) => ({
      text: p,
      lang: 'zh-CN',
      rate: rate,
      pitch: pitch,
      gap: i === parts.length - 1 ? 110 : 140
    }));
    // 走在线语音时，多句台词先把每句音频并行下好，避免读完一句还要等下一句
    if (!local && segs.length > 1) preload(segs);
    speakSegments(segs, { done: o.done, local: local });
  }

  /* ---------- 真人拼音素材（assets/audio/pinyin） ---------- */

  const TONE_CHARS = {
    'ā': 'a1', 'á': 'a2', 'ǎ': 'a3', 'à': 'a4',
    'ō': 'o1', 'ó': 'o2', 'ǒ': 'o3', 'ò': 'o4',
    'ē': 'e1', 'é': 'e2', 'ě': 'e3', 'è': 'e4',
    'ī': 'i1', 'í': 'i2', 'ǐ': 'i3', 'ì': 'i4',
    'ū': 'u1', 'ú': 'u2', 'ǔ': 'u3', 'ù': 'u4',
    'ǖ': 'v1', 'ǘ': 'v2', 'ǚ': 'v3', 'ǜ': 'v4'
  };

  // bā → ba1，mǎ → ma3，nǚ → nv3
  function syllableKey(p) {
    let base = '';
    let tone = 0;
    for (const ch of String(p)) {
      const t = TONE_CHARS[ch];
      if (t) {
        base += t[0];
        tone = Number(t[1]);
      } else {
        base += ch === 'ü' ? 'v' : ch;
      }
    }
    return base + (tone || 5);
  }

  const pyAudio = {
    sheng: p => 'assets/audio/pinyin/sheng/' + p + '.mp3',
    yun: p => 'assets/audio/pinyin/yun/' + String(p).replace(/ü/g, 'v') + '.mp3',
    yinjie: p => 'assets/audio/pinyin/yinjie/' + syllableKey(p) + '.mp3',
    tone: t => 'assets/audio/pinyin/yinjie/a' + t + '.mp3'
  };

  // 检测本机是否装了对应语言的语音包（离线 TTS 完全取决于系统音色）
  function voiceInfo() {
    if (!('speechSynthesis' in window)) return { supported: false, zh: false, en: false, natural: false, count: 0 };
    loadVoices();
    const has = base => voices.some(v => String(v.lang || '').replace('_', '-').toLowerCase().indexOf(base) === 0);
    const natural = voices.some(v => /(natural|neural)/i.test(v.name || ''));
    return { supported: true, zh: has('zh'), en: has('en'), natural: natural, count: voices.length };
  }

  return {
    setSound(on) { soundOn = on; if (!on) { stopSpeak(); stopSong(); } },
    setVoice(on) { voiceOn = on; if (!on) stopSpeak(); },
    setOnline(on) {
      onlineOn = !!on;
      if (!onlineOn) stopSpeak();
    },

    unlock() {
      ensure();
      loadVoices();
    },

    // —— 音乐化音效（有素材时优先播放素材，否则用合成音） ——
    click() {
      playSfx('click', () => {
        tone(880, 0, 0.055, 'sine', 0.06);
        tone(1320, 0.012, 0.05, 'sine', 0.035);
      });
    },
    pop() {
      playSfx('pop', () => {
        glide(520, 900, 0, 0.09, 'sine', 0.09);
        tone(1180, 0.05, 0.09, 'triangle', 0.05);
      });
    },
    correct() {
      playSfx('correct', () => {
        // C 大调上行琶音 + 高音闪光
        arp([523.25, 659.25, 783.99, 1046.5], 0.065, 0.28, 'sine', 0.1);
        tone(1568, 0.24, 0.22, 'triangle', 0.045);
        tone(783.99, 0.24, 0.3, 'sine', 0.04);
      });
    },
    wrong() {
      playSfx('wrong', () => {
        // 柔和下行，避免刺耳
        tone(392, 0, 0.16, 'sine', 0.075);
        tone(329.63, 0.14, 0.24, 'sine', 0.07);
        tone(261.63, 0.3, 0.26, 'triangle', 0.05);
      });
    },
    coin() {
      playSfx('coin', () => {
        tone(987.77, 0, 0.08, 'triangle', 0.06);
        tone(1318.51, 0.07, 0.12, 'triangle', 0.055);
        tone(1975.53, 0.15, 0.2, 'sine', 0.035);
      });
    },
    care() {
      playSfx('care', () => {
        // 五声音阶上行，温暖可爱
        arp([659.25, 783.99, 987.77, 1174.66], 0.08, 0.26, 'sine', 0.075);
      });
    },
    levelUp() {
      playSfx('levelUp', () => {
        arp([523.25, 659.25, 783.99, 1046.5, 1318.51, 1567.98], 0.085, 0.4, 'triangle', 0.085);
        [523.25, 659.25, 783.99].forEach(f => tone(f, 0.52, 0.55, 'sine', 0.055));
      });
    },

    // —— 小龙猫的声音：按成长形态变声（越小越尖），每次略有变化 ——
    petVoice(form) {
      const PITCH = { baby: 1.5, mini: 1.36, small: 1.22, big: 1.08, guard: 0.98, king: 0.9, myth: 0.82 };
      const k = PITCH[form] || 1.22;
      const base = (540 + Math.random() * 90) * k;
      // 两声「喵呜」：上滑再落下，末尾带一点气声
      glide(base, base * 1.6, 0, 0.1, 'triangle', 0.07);
      glide(base * 1.55, base * 1.15, 0.1, 0.13, 'triangle', 0.055);
      tone(base * 2.1, 0.24, 0.09, 'sine', 0.028);
    },
    petEat() {
      // 三口咀嚼 + 满足的吞咽滑音
      [0, 0.14, 0.28].forEach((t, i) => {
        tone(320 - i * 30, t, 0.06, 'square', 0.03);
        tone(190 - i * 20, t + 0.03, 0.06, 'sine', 0.04);
      });
      glide(420, 210, 0.42, 0.22, 'sine', 0.06);
      tone(660, 0.68, 0.12, 'triangle', 0.03);
    },
    petBath() {
      // 一串往上冒的水泡，最后「啵」一下
      [0, 0.09, 0.19, 0.3, 0.42].forEach((t, i) => {
        const f = 620 + i * 130;
        glide(f, f * 1.65, t, 0.1, 'sine', 0.045);
      });
      tone(1046.5, 0.6, 0.18, 'triangle', 0.04);
    },
    petPlay() {
      // 蹦蹦跳跳的上下琶音
      arp([523.25, 783.99, 1046.5, 1318.51], 0.07, 0.15, 'triangle', 0.07);
      glide(900, 1400, 0.3, 0.12, 'sine', 0.05);
      glide(1400, 900, 0.44, 0.14, 'sine', 0.05);
    },

    speak,
    speakCat,
    speakSegments,
    stopSpeak,
    abcSong,
    stopSong,
    preload,
    pyAudio,
    resetOnline() {
      downAt.zh = 0;
      downAt.en = 0;
      failCount.zh = 0;
      failCount.en = 0;
      failedUrls.clear();
    },
    reloadVoices: loadVoices,
    voiceInfo,
    onlineInfo: () => ({
      enabled: onlineOn,
      online: navigator.onLine !== false,
      cooling: Date.now() - downAt.en < DOWN_TTL.en || Date.now() - downAt.zh < DOWN_TTL.zh
    }),
    hasVoice: () => voiceOn && ('speechSynthesis' in window || canOnline('en-US'))
  };
})();

// 部分浏览器语音列表异步加载
if ('speechSynthesis' in window) {
  const refresh = () => { try { AudioFX.reloadVoices(); } catch (e) {} };
  refresh();
  window.speechSynthesis.onvoiceschanged = refresh;
}

// 网络恢复后重新尝试在线语音
window.addEventListener('online', () => {
  try { AudioFX.resetOnline(); } catch (e) { /* 忽略 */ }
});
