/**
 * 灵光象吉 · 六爻解卦 — 主应用入口
 */
import { parseGuaText, validateParsed } from './parser/text-parser.js';
import { runEngine } from './engine/engine.js';
import { AIManager } from './ai/ai-manager.js';
import { createArchive, saveArchive, loadArchives, clearArchives, exportArchives, deleteArchive } from './utils/archive.js';
import { LIU_SHEN_CSS, WX_CN, LIU_QIN_FULL } from './core/constants.js';

// ═══ 全局状态 ═══
let currentParsed = null;
let currentReport = null;
let currentAiResult = '';
const aiManager = new AIManager();

// ═══ DOM 元素 ═══
const $ = id => document.getElementById(id);

// ═══ 初始化 ═══
document.addEventListener('DOMContentLoaded', () => {
  bindEvents();
  loadSettingsToUI();
});

function bindEvents() {
  // 解析按钮
  $('btn-parse').addEventListener('click', handleParse);
  $('btn-clear').addEventListener('click', () => {
    $('gua-input').value = '';
    hideResults();
  });

  // Tab 切换
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  // AI 断卦
  $('btn-ai-analyze').addEventListener('click', handleAiAnalyze);

  // 归档
  $('btn-archive').addEventListener('click', handleArchive);

  // 设置
  $('btn-settings').addEventListener('click', () => toggleModal('modal-settings', true));
  $('btn-close-settings').addEventListener('click', () => toggleModal('modal-settings', false));
  $('btn-save-settings').addEventListener('click', handleSaveSettings);

  // 历史
  $('btn-history').addEventListener('click', () => {
    renderHistory();
    toggleModal('modal-history', true);
  });
  $('btn-close-history').addEventListener('click', () => toggleModal('modal-history', false));
  $('btn-clear-history').addEventListener('click', () => {
    if (confirm('确定清空所有归档记录？')) {
      clearArchives();
      renderHistory();
    }
  });
  $('btn-export-history').addEventListener('click', exportArchives);

  // 点击模态框背景关闭
  document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', e => {
      if (e.target === modal) toggleModal(modal.id, false);
    });
  });

  // AI provider 切换同步
  $('ai-provider-select').addEventListener('change', e => {
    $('settings-provider').value = e.target.value;
  });
}

// ═══ 解析卦盘 ═══
function handleParse() {
  const text = $('gua-input').value.trim();
  if (!text) {
    alert('请粘贴卦盘文本');
    return;
  }

  currentParsed = parseGuaText(text);
  if (!currentParsed) {
    alert('解析失败：无法识别卦盘格式');
    return;
  }

  const validation = validateParsed(currentParsed);
  if (!validation.valid) {
    const proceed = confirm(`解析警告：\n${validation.errors.join('\n')}\n\n是否继续？`);
    if (!proceed) return;
  }

  // 运行规则引擎
  currentReport = runEngine(currentParsed);
  currentAiResult = '';

  // 渲染结果
  renderGuaPanel();
  renderBasicInfo();
  renderRulesAnalysis();
  renderYingQi();
  showResults();
  switchTab('basic');
}

// ═══ 卦盘展示 ═══
function renderGuaPanel() {
  const p = currentParsed;
  const r = currentReport;

  let html = '<div class="gua-panel">';

  // 卦名行
  html += '<div class="gua-title-row">';
  html += `<div><span class="gua-name">${p.benGua.name}</span><span class="gua-name-sub">${p.benGua.gong}宫 · ${p.benGua.type}</span></div>`;
  if (p.bianGua.name) {
    html += '<span class="gua-arrow">→</span>';
    html += `<div><span class="gua-name">${p.bianGua.name}</span><span class="gua-name-sub">${p.bianGua.gong}宫 · ${p.bianGua.type}</span></div>`;
  }
  html += '</div>';

  // 卦盘表格
  html += '<table class="gua-table">';
  html += '<tr><th>六神</th><th>六亲</th><th>本卦</th><th></th><th></th>';
  if (p.bianGua.name) html += '<th></th><th>变卦</th><th>六亲</th>';
  html += '</tr>';

  // 从六爻到初爻渲染（上到下）
  for (let i = 5; i >= 0; i--) {
    const yao = p.yaos[i];
    if (!yao) continue;

    const shenClass = LIU_SHEN_CSS[yao.liuShenShort] || '';
    const isDong = yao.isDong;
    const statusClasses = [];
    if (yao.status.kongWang) statusClasses.push('status-kong');
    if (yao.status.yuePo) statusClasses.push('status-po');
    if (yao.status.jinShen) statusClasses.push('status-jin');
    if (yao.status.tuiShen) statusClasses.push('status-tui');

    html += `<tr class="${isDong ? 'dong-yao' : ''}">`;

    // 六神
    html += `<td class="col-shen ${shenClass}">${yao.liuShenShort}</td>`;

    // 本卦六亲+地支
    html += `<td class="col-liuqin ${statusClasses.join(' ')}">${yao.benLiuQin}${yao.benDizhi}</td>`;

    // 本卦爻象
    html += '<td class="col-yao">';
    if (yao.benYinYang === 'yang') {
      html += '<div class="yao-symbol"><div class="yao-yang"></div></div>';
    } else {
      html += '<div class="yao-symbol"><div class="yao-yin"><div class="yao-yin-half"></div><div class="yao-yin-half"></div></div></div>';
    }
    html += '</td>';

    // 世应
    html += '<td class="col-shiying">';
    if (yao.isShi) html += '<span class="shi-mark">世</span>';
    if (yao.isYing) html += '<span class="ying-mark">应</span>';
    html += '</td>';

    // 动爻标记
    html += '<td class="col-dong">';
    if (isDong) html += `<span class="dong-mark">${yao.dongType}</span>`;
    html += '</td>';

    // 变卦
    if (p.bianGua.name) {
      if (isDong && yao.bianDizhi) {
        html += '<td class="col-arrow">→</td>';
        html += `<td class="col-yao">`;
        if (yao.bianYinYang === 'yang') {
          html += '<div class="yao-symbol"><div class="yao-yang"></div></div>';
        } else {
          html += '<div class="yao-symbol"><div class="yao-yin"><div class="yao-yin-half"></div><div class="yao-yin-half"></div></div></div>';
        }
        html += '</td>';
        html += `<td class="col-bian">${yao.bianLiuQin}${yao.bianDizhi}</td>`;
      } else {
        html += '<td></td><td class="col-yao">';
        // 非动爻的变卦位显示同本卦
        if (yao.bianDizhi) {
          if (yao.bianYinYang === 'yang') {
            html += '<div class="yao-symbol"><div class="yao-yang"></div></div>';
          } else {
            html += '<div class="yao-symbol"><div class="yao-yin"><div class="yao-yin-half"></div><div class="yao-yin-half"></div></div></div>';
          }
        }
        html += '</td>';
        html += `<td class="col-bian">${yao.bianLiuQin || ''}${yao.bianDizhi || ''}</td>`;
      }
    }

    html += '</tr>';
  }

  html += '</table>';

  // 底部信息栏
  html += '<div class="gua-footer">';
  html += `<span><span class="label">日空：</span>${p.kongWang.ri.join('')}</span>`;
  html += `<span><span class="label">月建：</span>${r.basic.yueJian}</span>`;
  html += `<span><span class="label">日辰：</span>${r.basic.riChen}</span>`;
  html += `<span><span class="label">四柱：</span>${p.ganZhi.year?.gan||''}${p.ganZhi.year?.zhi||''}年 ${p.ganZhi.month?.gan||''}${p.ganZhi.month?.zhi||''}月 ${p.ganZhi.day?.gan||''}${p.ganZhi.day?.zhi||''}日 ${p.ganZhi.hour?.gan||''}${p.ganZhi.hour?.zhi||''}时</span>`;
  html += '</div>';

  html += '</div>';
  $('gua-panel').innerHTML = html;
}

// ═══ 基本信息 Tab ═══
function renderBasicInfo() {
  const r = currentReport;
  const p = currentParsed;

  let html = '<div class="info-grid">';
  const cards = [
    ['占问', p.question],
    ['时间', p.dateTime || ''],
    ['本卦', `${p.benGua.name} / ${p.benGua.gong}宫 (${p.benGua.type})`],
    ['变卦', p.bianGua.name ? `${p.bianGua.name} / ${p.bianGua.gong}宫 (${p.bianGua.type})` : '无'],
    ['世爻', r.basic.shiYao],
    ['应爻', r.basic.yingYao],
    ['动爻', r.basic.dongYaoCount > 0 ? r.basic.dongYaoList.map(d => `${d.position}爻(${d.ben}→${d.bian})`).join('，') : '无'],
    ['日空亡', p.kongWang.ri.join('') || '无'],
  ];

  for (const [label, value] of cards) {
    html += `<div class="info-card"><div class="label">${label}</div><div class="value">${value}</div></div>`;
  }
  html += '</div>';

  // 逐爻状态一览
  html += '<div class="rule-block"><div class="rule-block-header">逐爻状态一览</div><div class="rule-block-body">';
  for (const yd of r.yaoDetails) {
    const tags = yd.statuses.map(s => {
      let cls = 'tag-gray';
      if (['日生','月生/旺','进神','回头生','日合','月合'].includes(s)) cls = 'tag-green';
      if (['日克','月克','月破','日破','化绝','化墓','化空','回头克','退神','化冲','日冲'].includes(s)) cls = 'tag-red';
      if (s === '日空') cls = 'tag-yellow';
      return `<span class="tag ${cls}">${s}</span>`;
    }).join('');

    let line = `<strong>${yd.posLabel}</strong>：${yd.liuShen} ${yd.benLiuQin}${yd.benDizhi}${yd.benWuxing}`;
    if (yd.isShi) line += ' <span class="tag tag-blue">世</span>';
    if (yd.isYing) line += ' <span class="tag tag-blue">应</span>';
    if (yd.isDong) line += ` → ${yd.bianLiuQin}${yd.bianDizhi}${yd.bianWuxing}`;
    if (yd.wangShuai) line += ` <span class="tag tag-gray">${yd.wangShuai}</span>`;
    if (tags) line += ' ' + tags;

    html += `<div class="rule-item"><span class="dot ${yd.isDong ? 'dot-warning' : 'dot-neutral'}"></span><span>${line}</span></div>`;
  }
  html += '</div></div>';

  $('tab-basic').innerHTML = html;
}

// ═══ 规则分析 Tab ═══
function renderRulesAnalysis() {
  const r = currentReport;
  let html = '';

  const sections = [
    { title: '空亡分析', items: r.kongWang },
    { title: '月建影响', items: r.yueJian },
    { title: '日辰影响', items: r.riChen },
    { title: '动变分析', items: r.dongBian },
    { title: '特殊格局', items: r.special },
  ];

  for (const sec of sections) {
    if (sec.items.length === 0) continue;
    html += `<div class="rule-block">`;
    html += `<div class="rule-block-header">${sec.title} <span class="toggle">${sec.items.length}条</span></div>`;
    html += '<div class="rule-block-body">';
    for (const f of sec.items) {
      const dotClass = f.impact === 'positive' ? 'dot-positive'
        : f.impact === 'negative' ? 'dot-negative'
        : f.impact === 'warning' ? 'dot-warning'
        : 'dot-neutral';
      html += `<div class="rule-item"><span class="dot ${dotClass}"></span><span>${f.text}</span></div>`;
    }
    html += '</div></div>';
  }

  if (!html) html = '<p class="empty-hint">无特殊规则触发</p>';
  $('tab-rules').innerHTML = html;
}

// ═══ 应期 Tab ═══
function renderYingQi() {
  const r = currentReport;
  const p = currentParsed;

  let html = '<div class="yingqi-section">';
  html += '<div class="yingqi-title">应期推断线索</div>';

  const clues = [];

  // 基于空亡推应期
  for (const yao of p.yaos) {
    if (yao.status.kongWang) {
      clues.push({
        text: `${yao.benLiuQin}${yao.benDizhi} 空亡 → 待出空（过旬）或冲空（${yao.benDizhi}日/月）时应`,
        condition: '空亡出空',
      });
    }
  }

  // 基于动变推应期
  for (const yao of p.yaos) {
    if (!yao.isDong) continue;
    if (yao.status.jinShen) {
      clues.push({
        text: `${yao.benLiuQin}${yao.benDizhi} 化进神 → 近应，${yao.bianDizhi}日/月应`,
        condition: '进神近应',
      });
    }
    if (yao.status.tuiShen) {
      clues.push({
        text: `${yao.benLiuQin}${yao.benDizhi} 化退神 → 远应或不应`,
        condition: '退神远应',
      });
    }
    if (yao.status.huaJue || yao.status.huaMu) {
      clues.push({
        text: `${yao.benLiuQin}${yao.benDizhi} 化${yao.status.huaJue ? '绝' : '墓'} → 待生旺之时应`,
        condition: '化绝/墓待旺',
      });
    }
  }

  // 基于合推应期
  for (const yao of p.yaos) {
    if (yao.status.riHe || yao.status.yueHe) {
      clues.push({
        text: `${yao.benLiuQin}${yao.benDizhi} 被合 → 待冲开时应`,
        condition: '逢合待冲',
      });
    }
  }

  if (clues.length === 0) {
    clues.push({ text: '暂无明确应期线索，建议结合 AI 分析', condition: '' });
  }

  for (const c of clues) {
    html += '<div class="yingqi-item">';
    html += c.text;
    if (c.condition) html += `<div class="yingqi-condition">${c.condition}</div>`;
    html += '</div>';
  }

  html += '</div>';
  $('tab-yingqi').innerHTML = html;
}

// ═══ AI 断卦 ═══
async function handleAiAnalyze() {
  if (!currentReport || !currentParsed) {
    alert('请先解析卦盘');
    return;
  }

  // 同步 provider 选择
  const selectedProvider = $('ai-provider-select').value;
  aiManager.config.activeProvider = selectedProvider;

  const outputEl = $('ai-output');
  outputEl.innerHTML = '<div class="loading-text">AI 分析中，请稍候...</div>';
  currentAiResult = '';

  $('btn-ai-analyze').disabled = true;

  await aiManager.streamAnalyze(
    currentReport.summary,
    currentParsed.rawText,
    // onChunk
    (chunk) => {
      currentAiResult += chunk;
      outputEl.textContent = currentAiResult;
    },
    // onDone
    () => {
      $('btn-ai-analyze').disabled = false;
      // 简单 Markdown 渲染
      outputEl.innerHTML = simpleMarkdown(currentAiResult);
    },
    // onError
    (err) => {
      outputEl.innerHTML = `<div style="color: var(--danger);">错误：${err}</div>`;
      $('btn-ai-analyze').disabled = false;
    }
  );
}

// ═══ 归档 ═══
function handleArchive() {
  if (!currentParsed || !currentReport) return;

  const conclusion = prompt('请输入简要结论（可留空，后续可在归档中编辑）：', '');
  const archive = createArchive(currentParsed, currentReport, currentAiResult);
  archive.conclusion = conclusion || '';

  saveArchive(archive);
  alert('已归档！');
}

// ═══ 历史列表渲染 ═══
function renderHistory() {
  const list = loadArchives();
  const el = $('history-list');

  if (list.length === 0) {
    el.innerHTML = '<p class="empty-hint">暂无归档记录</p>';
    return;
  }

  let html = '';
  for (const a of list) {
    html += `<div class="history-item" data-id="${a.id}">`;
    html += '<div class="hi-header">';
    html += `<span class="hi-gua">${a.benGua}${a.bianGua !== '无' ? ' → ' + a.bianGua : ''}</span>`;
    html += `<span class="hi-date">${a.archiveDate}</span>`;
    html += '</div>';
    html += `<div class="hi-question">${a.question || '无占问'}</div>`;
    if (a.conclusion) {
      html += `<div class="hi-conclusion">${a.conclusion}</div>`;
    }
    html += `<div style="margin-top:6px;font-size:12px;color:var(--text-muted)">${a.ganZhi} | 空亡:${a.kongWang} | ${a.guaType}</div>`;
    html += '</div>';
  }

  el.innerHTML = html;

  // 点击归档项 → 加载到输入框
  el.querySelectorAll('.history-item').forEach(item => {
    item.addEventListener('click', () => {
      const a = list.find(x => x.id === item.dataset.id);
      if (a && a.rawText) {
        $('gua-input').value = a.rawText;
        toggleModal('modal-history', false);
        handleParse();
      }
    });
  });
}

// ═══ 设置 ═══
function loadSettingsToUI() {
  const config = aiManager.config;
  $('settings-provider').value = config.activeProvider;
  $('ai-provider-select').value = config.activeProvider;

  const pc = config.providers[config.activeProvider] || {};
  $('settings-apikey').value = pc.apiKey || '';
  $('settings-model').value = pc.model || '';
  $('settings-baseurl').value = pc.baseUrl || '';

  // 切换 provider 时更新字段
  $('settings-provider').addEventListener('change', () => {
    const pn = $('settings-provider').value;
    const c = config.providers[pn] || {};
    $('settings-apikey').value = c.apiKey || '';
    $('settings-model').value = c.model || '';
    $('settings-baseurl').value = c.baseUrl || '';
  });
}

function handleSaveSettings() {
  const provider = $('settings-provider').value;
  aiManager.setProvider(provider, {
    apiKey: $('settings-apikey').value.trim(),
    model: $('settings-model').value.trim(),
    baseUrl: $('settings-baseurl').value.trim(),
  });
  $('ai-provider-select').value = provider;
  toggleModal('modal-settings', false);
  alert('设置已保存');
}

// ═══ 工具函数 ═══
function switchTab(tabName) {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tabName);
  });
  document.querySelectorAll('.tab-panel').forEach(panel => {
    panel.classList.toggle('active', panel.id === `tab-${tabName}`);
  });
}

function toggleModal(id, show) {
  $(id).classList.toggle('hidden', !show);
}

function showResults() {
  $('gua-display').classList.remove('hidden');
  $('report-section').classList.remove('hidden');
  $('archive-section').classList.remove('hidden');
}

function hideResults() {
  $('gua-display').classList.add('hidden');
  $('report-section').classList.add('hidden');
  $('archive-section').classList.add('hidden');
  currentParsed = null;
  currentReport = null;
  currentAiResult = '';
}

/**
 * 简易 Markdown → HTML 转换（不引入外部库）
 */
function simpleMarkdown(text) {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    // 标题
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    // 粗体和斜体
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // 列表
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/^(\d+)\. (.+)$/gm, '<li>$2</li>')
    // 段落
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>')
    .replace(/^/, '<p>')
    .replace(/$/, '</p>');
}
