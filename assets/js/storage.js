/* 存档层：schema 版本、旧档迁移、多份快照、防抖写入、异常兜底、导入导出 */
const SaveStore = (() => {
  const KEY = 'xiaolongmao_save';
  const BACKUP_KEYS = ['xiaolongmao_save_b1', 'xiaolongmao_save_b2'];
  const LEGACY_KEYS = ['saikid_save', 'saikid_save_v1'];
  const SLOT_KEY = 'xiaolongmao_slot';       // 当前使用哪个孩子的档案
  const SLOT_LIST = 'xiaolongmao_profiles';  // 档案列表 [{ id, name, at }]
  const DEFAULT_SLOT = 'p1';
  const APP_ID = 'xiaolongmao';
  const VERSION = 5;
  const WRITE_DELAY = 320;

  let timer = null;
  let pending = null;
  let available = probe();
  let lastLoadInfo = { source: 'new', at: 0 };
  let slot = readItem(SLOT_KEY) || DEFAULT_SLOT;

  function probe() {
    try {
      const k = '__saikid_probe__';
      localStorage.setItem(k, '1');
      localStorage.removeItem(k);
      return true;
    } catch (e) {
      return false;
    }
  }

  function readItem(k) {
    try { return localStorage.getItem(k); } catch (e) { return null; }
  }

  // 第一个档案沿用老键名，保证升级后原存档还在
  function suffix(id) { return id === DEFAULT_SLOT ? '' : '@' + id; }
  function mainKey(id) { return KEY + suffix(id || slot); }
  function backupKeys(id) { return BACKUP_KEYS.map(k => k + suffix(id || slot)); }

  function profiles() {
    try {
      const list = JSON.parse(readItem(SLOT_LIST) || 'null');
      if (Array.isArray(list)) {
        const ok = list.filter(p => p && typeof p.id === 'string' && p.id);
        if (ok.length) return ok;
      }
    } catch (e) { /* 忽略 */ }
    return [{ id: DEFAULT_SLOT, name: '宝贝 1', at: 0 }];
  }

  function setProfiles(list) {
    try {
      localStorage.setItem(SLOT_LIST, JSON.stringify(list || []));
      return true;
    } catch (e) { return false; }
  }

  function currentSlot() { return slot; }

  function switchSlot(id) {
    if (!id || id === slot) return false;
    flush();
    try { localStorage.setItem(SLOT_KEY, id); } catch (e) { return false; }
    slot = id;
    return true;
  }

  function readRaw() {
    if (!available) return null;
    try {
      const own = readItem(mainKey());
      if (own) return own;
      // 兼容改名前的旧存档（saikid_save / saikid_save_v1），只对第一个档案生效
      if (slot === DEFAULT_SLOT) {
        for (const k of LEGACY_KEYS) {
          const old = readItem(k);
          if (old) return old;
        }
      }
      return null;
    } catch (e) {
      available = false;
      return null;
    }
  }

  function clearLegacy() {
    try {
      LEGACY_KEYS.forEach(k => {
        if (localStorage.getItem(k)) localStorage.removeItem(k);
      });
    } catch (e) { /* 忽略 */ }
  }

  // 写入前把现有主档轮转成 b1 / b2，主档损坏时还能回到上一份
  function rotateBackups() {
    try {
      const bk = backupKeys();
      const cur = readItem(mainKey());
      if (!cur) return;
      const b1 = readItem(bk[0]);
      if (b1 && b1 !== cur) localStorage.setItem(bk[1], b1);
      localStorage.setItem(bk[0], cur);
    } catch (e) { /* 忽略 */ }
  }

  function writeNow(state) {
    if (!available || !state) return false;
    try {
      rotateBackups();
      localStorage.setItem(mainKey(), JSON.stringify(state));
      if (slot === DEFAULT_SLOT) clearLegacy();
      return true;
    } catch (e) {
      // 配额不足或无痕模式：降级为仅本次会话有效
      available = false;
      return false;
    }
  }

  function migrate(data) {
    if (!data || typeof data !== 'object') return null;
    const v = Number(data.version) || 1;
    // v1 -> v2：闯关进度 / 每日任务 / 引导标记；v2 -> v3：错题本 / 历史 / 家长设置
    // 具体字段由 app.normalizeState 补齐，这里只升级版本号
    if (v < VERSION) data.version = VERSION;
    return data;
  }

  function parse(raw) {
    if (!raw) return null;
    try {
      const v = JSON.parse(raw);
      return v && typeof v === 'object' && !Array.isArray(v) ? v : null;
    } catch (e) {
      return null;
    }
  }

  function load(normalize) {
    let parsed = parse(readRaw());
    lastLoadInfo = { source: 'new', at: Date.now() };
    if (!parsed) {
      for (const k of backupKeys()) {
        const bak = parse(readItem(k));
        if (bak) {
          parsed = bak;
          lastLoadInfo = { source: k, at: Date.now() };
          break;
        }
      }
    }
    return normalize(migrate(parsed));
  }

  function save(state) {
    pending = state;
    clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      if (pending) writeNow(pending);
      pending = null;
    }, WRITE_DELAY);
  }

  function flush() {
    clearTimeout(timer);
    timer = null;
    if (pending) {
      writeNow(pending);
      pending = null;
    }
  }

  function reset() {
    clearTimeout(timer);
    pending = null;
    try {
      localStorage.removeItem(mainKey());
      backupKeys().forEach(k => localStorage.removeItem(k));
      if (slot === DEFAULT_SLOT) clearLegacy();
    } catch (e) { /* 忽略 */ }
  }

  function usage() {
    try {
      let total = 0;
      profiles().forEach(p => {
        total += (readItem(mainKey(p.id)) || '').length;
        backupKeys(p.id).forEach(k => { total += (readItem(k) || '').length; });
      });
      if (!total && slot === DEFAULT_SLOT) {
        for (const k of LEGACY_KEYS) total += (readItem(k) || '').length;
      }
      return total;
    } catch (e) {
      return 0;
    }
  }

  // 备份是否可用（家长中心「恢复上一份存档」按钮据此禁用）
  function backupInfo() {
    const list = backupKeys().map(k => {
      const raw = readItem(k);
      let at = '';
      try {
        const v = JSON.parse(raw || 'null');
        at = v && v.updatedAt ? v.updatedAt : '';
      } catch (e) { /* 忽略 */ }
      return { key: k, size: (raw || '').length, at };
    });
    return list;
  }

  // 用最近一份可用备份覆盖主档；返回是否成功
  function restoreBackup() {
    for (const k of backupKeys()) {
      const raw = readItem(k);
      if (!raw) continue;
      try {
        localStorage.setItem(mainKey(), raw);
        localStorage.removeItem(k);
        return true;
      } catch (e) { /* 试下一份 */ }
    }
    return false;
  }

  // 新建一个孩子的档案（不自动切换）
  function addSlot(name) {
    const list = profiles();
    let n = 1;
    let id = 'p' + (list.length + 1);
    while (list.some(p => p.id === id)) { n++; id = 'p' + (list.length + n); }
    list.push({ id, name: name || ('宝贝 ' + (list.length + 1)), at: Date.now() });
    return setProfiles(list) ? id : '';
  }

  // 删除某个档案的数据（不能删最后一个）
  function removeSlot(id) {
    const list = profiles();
    if (list.length <= 1 || !list.some(p => p.id === id)) return false;
    try {
      localStorage.removeItem(mainKey(id));
      backupKeys(id).forEach(k => localStorage.removeItem(k));
    } catch (e) { /* 忽略 */ }
    return setProfiles(list.filter(p => p.id !== id));
  }

  function renameSlot(id, name) {
    const list = profiles();
    const p = list.find(x => x.id === id);
    if (!p || !name) return false;
    p.name = String(name).slice(0, 12);
    return setProfiles(list);
  }

  function exportText(state) {
    return JSON.stringify({
      app: APP_ID,
      version: VERSION,
      exportedAt: new Date().toISOString(),
      state: state
    }, null, 2);
  }

  function importText(text, normalize) {
    if (typeof text !== 'string' || text.trim().length < 20) {
      return { ok: false, error: '文件内容为空或过小' };
    }
    let parsed = null;
    try { parsed = JSON.parse(text); } catch (e) {
      return { ok: false, error: '不是有效的存档文件' };
    }
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return { ok: false, error: '存档内容不完整' };
    }
    const legacy = parsed.app === 'saikid';
    if (parsed.app && parsed.app !== APP_ID && !legacy) {
      return { ok: false, error: '这不是小龙猫的存档文件' };
    }
    const src = (parsed.app === APP_ID || legacy) ? parsed.state : parsed;
    if (!src || typeof src !== 'object' || Array.isArray(src)) {
      return { ok: false, error: '存档内容不完整' };
    }
    // 至少要有一个我们认识的字段，避免导入任意 JSON
    const known = ['pet', 'settings', 'exp', 'coins', 'map', 'subjects', 'daily', 'stars'];
    const hit = known.filter(k => src[k] !== undefined).length;
    if (!hit) return { ok: false, error: '存档里没有学习记录' };
    const state = normalize(migrate(src));
    if (!state) return { ok: false, error: '存档无法解析' };
    return { ok: true, state: state };
  }

  window.addEventListener('pagehide', flush);
  window.addEventListener('beforeunload', flush);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flush();
  });

  return {
    VERSION,
    load,
    save,
    flush,
    reset,
    usage,
    backupInfo,
    restoreBackup,
    exportText,
    importText,
    isAvailable: () => available,
    lastLoad: () => lastLoadInfo,
    profiles,
    currentSlot,
    switchSlot,
    addSlot,
    removeSlot,
    renameSlot
  };
})();
