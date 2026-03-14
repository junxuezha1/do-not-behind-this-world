/**
 * 归档系统 — JSON 存储 + 历史管理
 */

const STORAGE_KEY = 'liuguang_archives';

/**
 * 创建归档条目
 */
export function createArchive(parsed, report, aiResult) {
  return {
    id: Date.now().toString(36) + Math.random().toString(36).substr(2, 4),
    timestamp: new Date().toISOString(),
    archiveDate: new Date().toLocaleDateString('zh-CN'),

    // 卦象摘要
    question: parsed.question,
    dateTime: parsed.dateTime,
    ganZhi: `${parsed.ganZhi.year?.gan||''}${parsed.ganZhi.year?.zhi||''}年 ${parsed.ganZhi.month?.gan||''}${parsed.ganZhi.month?.zhi||''}月 ${parsed.ganZhi.day?.gan||''}${parsed.ganZhi.day?.zhi||''}日 ${parsed.ganZhi.hour?.gan||''}${parsed.ganZhi.hour?.zhi||''}时`,
    benGua: parsed.benGua.name,
    bianGua: parsed.bianGua.name || '无',
    guaGong: parsed.benGua.gong,
    guaType: parsed.benGua.type,

    // 世应
    shiYao: report.basic.shiYao,
    yingYao: report.basic.yingYao,

    // 动爻
    dongYao: report.basic.dongYaoList.map(d => `${d.position}爻(${d.ben}→${d.bian})`).join('，') || '无',

    // 关键状态
    kongWang: parsed.kongWang.ri.join('') || '无',

    // AI 分析结论（用户可编辑）
    conclusion: '',
    aiResult: aiResult || '',

    // 应期
    yingQi: '',

    // 验证（后续可回来补填）
    verified: false,
    verifyNote: '',

    // 原始文本
    rawText: parsed.rawText,
  };
}

/**
 * 保存归档
 */
export function saveArchive(archive) {
  const list = loadArchives();
  list.unshift(archive);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

/**
 * 加载所有归档
 */
export function loadArchives() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

/**
 * 删除归档
 */
export function deleteArchive(id) {
  const list = loadArchives().filter(a => a.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

/**
 * 清空所有归档
 */
export function clearArchives() {
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * 导出归档为 JSON 文件
 */
export function exportArchives() {
  const list = loadArchives();
  const json = JSON.stringify(list, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `六爻归档_${new Date().toLocaleDateString('zh-CN').replace(/\//g, '-')}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * 更新归档
 */
export function updateArchive(id, updates) {
  const list = loadArchives();
  const idx = list.findIndex(a => a.id === id);
  if (idx >= 0) {
    list[idx] = { ...list[idx], ...updates };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  }
}
