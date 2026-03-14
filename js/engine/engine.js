/**
 * 规则引擎 — 编排所有分析规则，生成结构化报告
 */
import { DZ_WUXING, WX_CN, LIU_QIN_FULL, LIU_CHONG, LIU_HE, JIN_SHEN_MAP, TUI_SHEN_MAP, CHANG_SHENG, CS_STAGES } from '../core/constants.js';
import { wxRelation, isSheng, isKe, wangShuai, getLiuQin } from '../core/wuxing.js';
import { isLiuHe, isLiuChong, isPo, isKong } from '../core/tiangan-dizhi.js';

/**
 * 运行规则引擎，返回完整分析报告
 */
export function runEngine(parsed) {
  const report = {
    basic: buildBasicInfo(parsed),
    yaoDetails: [],
    kongWang: analyzeKongWang(parsed),
    yueJian: analyzeYueJian(parsed),
    riChen: analyzeRiChen(parsed),
    dongBian: analyzeDongBian(parsed),
    yongShen: null,
    special: analyzeSpecial(parsed),
    yingQi: [],
    summary: '',
  };

  // 逐爻详细分析
  report.yaoDetails = parsed.yaos.map(yao => analyzeYao(yao, parsed));

  // 综合摘要（给 AI 用）
  report.summary = buildSummary(report, parsed);

  return report;
}

/**
 * 基本信息
 */
function buildBasicInfo(p) {
  const shiYao = p.yaos.find(y => y.isShi);
  const yingYao = p.yaos.find(y => y.isYing);
  const dongYaos = p.yaos.filter(y => y.isDong);

  return {
    question: p.question,
    dateTime: p.dateTime,
    ganZhi: p.ganZhi,
    benGua: p.benGua,
    bianGua: p.bianGua,
    shiYao: shiYao ? `${shiYao.position}爻 ${LIU_QIN_FULL[shiYao.benLiuQinKey] || shiYao.benLiuQin}${shiYao.benDizhi}` : '',
    yingYao: yingYao ? `${yingYao.position}爻 ${LIU_QIN_FULL[yingYao.benLiuQinKey] || yingYao.benLiuQin}${yingYao.benDizhi}` : '',
    dongYaoCount: dongYaos.length,
    dongYaoList: dongYaos.map(y => ({
      position: y.position,
      ben: `${y.benLiuQin}${y.benDizhi}`,
      bian: `${y.bianLiuQin}${y.bianDizhi}`,
    })),
    kongWangRi: p.kongWang.ri.join(''),
    yueJian: p.ganZhi.month ? `${p.ganZhi.month.zhi}(${WX_CN[DZ_WUXING[p.ganZhi.month.zhi]] || ''})` : '',
    riChen: p.ganZhi.day ? `${p.ganZhi.day.zhi}(${WX_CN[DZ_WUXING[p.ganZhi.day.zhi]] || ''})` : '',
  };
}

/**
 * 空亡分析
 */
function analyzeKongWang(p) {
  const findings = [];
  const riKong = p.kongWang.ri || [];

  for (const yao of p.yaos) {
    if (riKong.includes(yao.benDizhi)) {
      yao.status.kongWang = true;
      findings.push({
        yaoPos: yao.position,
        text: `${yao.position}爻 ${yao.benLiuQin}${yao.benDizhi} 日空亡`,
        impact: 'negative',
      });
    }
    // 变爻空亡
    if (yao.isDong && yao.bianDizhi && riKong.includes(yao.bianDizhi)) {
      yao.status.huaKong = true;
      findings.push({
        yaoPos: yao.position,
        text: `${yao.position}爻 动化${yao.bianLiuQin}${yao.bianDizhi}，化入空亡`,
        impact: 'negative',
      });
    }
  }
  return findings;
}

/**
 * 月建分析
 */
function analyzeYueJian(p) {
  const findings = [];
  if (!p.ganZhi.month || !p.ganZhi.month.zhi) return findings;

  const yueZhi = p.ganZhi.month.zhi;
  const yueWX = DZ_WUXING[yueZhi];

  for (const yao of p.yaos) {
    const yaoWX = yao.benWuxing;
    if (!yaoWX) continue;

    // 月建生
    if (isSheng(yueWX, yaoWX)) {
      yao.status.yueSheng = true;
      findings.push({
        yaoPos: yao.position,
        text: `${yao.position}爻 ${yao.benLiuQin}${yao.benDizhi} 得月建${yueZhi}${WX_CN[yueWX]}相生，旺`,
        impact: 'positive',
      });
    }

    // 月建克
    if (isKe(yueWX, yaoWX)) {
      yao.status.yueKe = true;
      findings.push({
        yaoPos: yao.position,
        text: `${yao.position}爻 ${yao.benLiuQin}${yao.benDizhi} 受月建${yueZhi}${WX_CN[yueWX]}所克`,
        impact: 'negative',
      });
    }

    // 比和
    if (yueWX === yaoWX) {
      yao.status.yueSheng = true;
      findings.push({
        yaoPos: yao.position,
        text: `${yao.position}爻 ${yao.benLiuQin}${yao.benDizhi} 与月建${yueZhi}比和，旺相`,
        impact: 'positive',
      });
    }

    // 月合
    if (isLiuHe(yueZhi, yao.benDizhi)) {
      yao.status.yueHe = true;
      findings.push({
        yaoPos: yao.position,
        text: `${yao.position}爻 ${yao.benLiuQin}${yao.benDizhi} 与月建${yueZhi}相合`,
        impact: 'neutral',
      });
    }

    // 月冲（月破）
    if (isLiuChong(yueZhi, yao.benDizhi)) {
      yao.status.yuePo = true;
      findings.push({
        yaoPos: yao.position,
        text: `${yao.position}爻 ${yao.benLiuQin}${yao.benDizhi} 月破（${yueZhi}${yao.benDizhi}相冲）`,
        impact: 'negative',
      });
    }

    // 旺衰
    yao.status.wangShuai = wangShuai(yaoWX, yueWX);
  }

  return findings;
}

/**
 * 日辰分析
 */
function analyzeRiChen(p) {
  const findings = [];
  if (!p.ganZhi.day || !p.ganZhi.day.zhi) return findings;

  const riZhi = p.ganZhi.day.zhi;
  const riWX = DZ_WUXING[riZhi];

  for (const yao of p.yaos) {
    const yaoWX = yao.benWuxing;
    if (!yaoWX) continue;

    // 日生
    if (isSheng(riWX, yaoWX)) {
      yao.status.riSheng = true;
      findings.push({
        yaoPos: yao.position,
        text: `${yao.position}爻 ${yao.benLiuQin}${yao.benDizhi} 得日辰${riZhi}${WX_CN[riWX]}相生`,
        impact: 'positive',
      });
    }

    // 日克
    if (isKe(riWX, yaoWX)) {
      yao.status.riKe = true;
      findings.push({
        yaoPos: yao.position,
        text: `${yao.position}爻 ${yao.benLiuQin}${yao.benDizhi} 受日辰${riZhi}${WX_CN[riWX]}所克`,
        impact: 'negative',
      });
    }

    // 日合
    if (isLiuHe(riZhi, yao.benDizhi)) {
      yao.status.riHe = true;
      findings.push({
        yaoPos: yao.position,
        text: `${yao.position}爻 ${yao.benLiuQin}${yao.benDizhi} 与日辰${riZhi}六合`,
        impact: 'neutral',
      });
    }

    // 日冲
    if (isLiuChong(riZhi, yao.benDizhi)) {
      yao.status.riChong = true;
      findings.push({
        yaoPos: yao.position,
        text: `${yao.position}爻 ${yao.benLiuQin}${yao.benDizhi} 日冲（${riZhi}${yao.benDizhi}相冲）`,
        impact: yao.isDong ? 'negative' : 'neutral',
      });
    }

    // 日破
    if (isPo(riZhi, yao.benDizhi)) {
      yao.status.riPo = true;
      findings.push({
        yaoPos: yao.position,
        text: `${yao.position}爻 ${yao.benLiuQin}${yao.benDizhi} 日破`,
        impact: 'negative',
      });
    }
  }

  return findings;
}

/**
 * 动变分析（含进退神、化绝、化空）
 */
function analyzeDongBian(p) {
  const findings = [];
  const riKong = p.kongWang.ri || [];

  for (const yao of p.yaos) {
    if (!yao.isDong) continue;

    const benDZ = yao.benDizhi;
    const bianDZ = yao.bianDizhi;
    if (!bianDZ) continue;

    const benWX = yao.benWuxing;
    const bianWX = yao.bianWuxing;

    // 进神判定
    if (JIN_SHEN_MAP[benDZ] === bianDZ && benWX === bianWX) {
      yao.status.jinShen = true;
      findings.push({
        yaoPos: yao.position,
        text: `${yao.position}爻 ${yao.benLiuQin}${benDZ} 化进神 ${yao.bianLiuQin}${bianDZ}`,
        impact: 'positive',
      });
    }

    // 退神判定
    if (TUI_SHEN_MAP[benDZ] === bianDZ && benWX === bianWX) {
      yao.status.tuiShen = true;
      findings.push({
        yaoPos: yao.position,
        text: `${yao.position}爻 ${yao.benLiuQin}${benDZ} 化退神 ${yao.bianLiuQin}${bianDZ}`,
        impact: 'negative',
      });
    }

    // 化绝：变爻地支为本爻五行的绝地
    if (benWX && bianDZ) {
      const csOrder = CHANG_SHENG[benWX];
      if (csOrder) {
        const stageIdx = csOrder.indexOf(bianDZ);
        if (stageIdx >= 0) {
          const stage = CS_STAGES[stageIdx];
          if (stage === '绝') {
            yao.status.huaJue = true;
            findings.push({
              yaoPos: yao.position,
              text: `${yao.position}爻 ${yao.benLiuQin}${benDZ} 化绝于${bianDZ}`,
              impact: 'negative',
            });
          }
          if (stage === '墓') {
            yao.status.huaMu = true;
            findings.push({
              yaoPos: yao.position,
              text: `${yao.position}爻 ${yao.benLiuQin}${benDZ} 化墓于${bianDZ}`,
              impact: 'negative',
            });
          }
        }
      }
    }

    // 回头生/克
    if (bianWX && benWX) {
      if (isSheng(bianWX, benWX)) {
        yao.status.huiTouSheng = true;
        findings.push({
          yaoPos: yao.position,
          text: `${yao.position}爻 ${yao.benLiuQin}${benDZ} 动化回头生（${yao.bianLiuQin}${bianDZ}${WX_CN[bianWX]}生${WX_CN[benWX]}）`,
          impact: 'positive',
        });
      }
      if (isKe(bianWX, benWX)) {
        yao.status.huiTouKe = true;
        findings.push({
          yaoPos: yao.position,
          text: `${yao.position}爻 ${yao.benLiuQin}${benDZ} 动化回头克（${yao.bianLiuQin}${bianDZ}${WX_CN[bianWX]}克${WX_CN[benWX]}）`,
          impact: 'negative',
        });
      }
    }

    // 化冲（本变互冲）
    if (isLiuChong(benDZ, bianDZ)) {
      yao.status.huaChong = true;
      findings.push({
        yaoPos: yao.position,
        text: `${yao.position}爻 ${yao.benLiuQin}${benDZ} 动化 ${yao.bianLiuQin}${bianDZ}，本变互冲`,
        impact: 'negative',
      });
    }
  }

  return findings;
}

/**
 * 特殊格局分析
 */
function analyzeSpecial(p) {
  const findings = [];

  // 卦型
  if (p.benGua.type) {
    findings.push({ text: `本卦：${p.benGua.name}（${p.benGua.type}）`, impact: 'neutral' });
  }
  if (p.bianGua.name && p.bianGua.type) {
    findings.push({ text: `变卦：${p.bianGua.name}（${p.bianGua.type}）`, impact: 'neutral' });
  }

  // 六冲卦
  if (p.benGua.type === '六冲') {
    findings.push({ text: '本卦六冲：事难成，散', impact: 'negative' });
  }
  if (p.bianGua.type === '六冲') {
    findings.push({ text: '变卦六冲：先成后败，终散', impact: 'warning' });
  }

  // 六合卦
  if (p.benGua.type === '六合') {
    findings.push({ text: '本卦六合：事可成，合', impact: 'positive' });
  }

  // 归魂游魂
  if (p.benGua.type === '归魂') {
    findings.push({ text: '归魂卦：事有着落，回归', impact: 'neutral' });
  }
  if (p.benGua.type === '游魂') {
    findings.push({ text: '游魂卦：事不定，飘忽', impact: 'warning' });
  }

  return findings;
}

/**
 * 逐爻详细分析
 */
function analyzeYao(yao, p) {
  const detail = {
    position: yao.position,
    posLabel: ['初爻','二爻','三爻','四爻','五爻','六爻'][yao.position - 1],
    liuShen: yao.liuShen,
    benLiuQin: yao.benLiuQin,
    benDizhi: yao.benDizhi,
    benWuxing: yao.benWuxing ? WX_CN[yao.benWuxing] : '',
    isShi: yao.isShi,
    isYing: yao.isYing,
    isDong: yao.isDong,
    bianLiuQin: yao.bianLiuQin,
    bianDizhi: yao.bianDizhi,
    bianWuxing: yao.bianWuxing ? WX_CN[yao.bianWuxing] : '',
    statuses: [],
    wangShuai: yao.status.wangShuai || '',
  };

  // 收集所有状态标签
  const s = yao.status;
  if (s.kongWang) detail.statuses.push('日空');
  if (s.yuePo) detail.statuses.push('月破');
  if (s.riPo) detail.statuses.push('日破');
  if (s.riChong) detail.statuses.push('日冲');
  if (s.riHe) detail.statuses.push('日合');
  if (s.riSheng) detail.statuses.push('日生');
  if (s.riKe) detail.statuses.push('日克');
  if (s.yueSheng) detail.statuses.push('月生/旺');
  if (s.yueKe) detail.statuses.push('月克');
  if (s.yueHe) detail.statuses.push('月合');
  if (s.jinShen) detail.statuses.push('进神');
  if (s.tuiShen) detail.statuses.push('退神');
  if (s.huaJue) detail.statuses.push('化绝');
  if (s.huaMu) detail.statuses.push('化墓');
  if (s.huaKong) detail.statuses.push('化空');
  if (s.huiTouSheng) detail.statuses.push('回头生');
  if (s.huiTouKe) detail.statuses.push('回头克');
  if (s.huaChong) detail.statuses.push('化冲');

  return detail;
}

/**
 * 构建综合摘要（给 AI 参考）
 */
function buildSummary(report, p) {
  const lines = [];

  lines.push(`【占问】${p.question}`);
  lines.push(`【时间】${p.dateTime || ''}`);
  lines.push(`【四柱】${p.ganZhi.year?.gan||''}${p.ganZhi.year?.zhi||''}年 ${p.ganZhi.month?.gan||''}${p.ganZhi.month?.zhi||''}月 ${p.ganZhi.day?.gan||''}${p.ganZhi.day?.zhi||''}日 ${p.ganZhi.hour?.gan||''}${p.ganZhi.hour?.zhi||''}时`);
  lines.push(`【日空】${p.kongWang.ri.join('')}`);
  lines.push(`【月建】${report.basic.yueJian} 【日辰】${report.basic.riChen}`);
  lines.push(`【本卦】${p.benGua.name} / ${p.benGua.gong}宫 (${p.benGua.type})`);
  if (p.bianGua.name) {
    lines.push(`【变卦】${p.bianGua.name} / ${p.bianGua.gong}宫 (${p.bianGua.type})`);
  }
  lines.push(`【世爻】${report.basic.shiYao} 【应爻】${report.basic.yingYao}`);

  if (report.basic.dongYaoCount > 0) {
    lines.push(`【动爻】${report.basic.dongYaoList.map(d => `${d.position}爻(${d.ben}→${d.bian})`).join('，')}`);
  } else {
    lines.push('【动爻】无');
  }

  lines.push('');
  lines.push('=== 逐爻状态 ===');
  for (const yd of report.yaoDetails) {
    let line = `${yd.posLabel}：${yd.liuShen} ${yd.benLiuQin}${yd.benDizhi}${yd.benWuxing}`;
    if (yd.isShi) line += ' [世]';
    if (yd.isYing) line += ' [应]';
    if (yd.isDong) line += ` →动→ ${yd.bianLiuQin}${yd.bianDizhi}${yd.bianWuxing}`;
    if (yd.statuses.length) line += ` 【${yd.statuses.join('、')}】`;
    if (yd.wangShuai) line += ` (${yd.wangShuai})`;
    lines.push(line);
  }

  lines.push('');
  lines.push('=== 规则分析要点 ===');

  const allFindings = [
    ...report.kongWang,
    ...report.yueJian,
    ...report.riChen,
    ...report.dongBian,
    ...report.special,
  ];
  for (const f of allFindings) {
    lines.push(`- ${f.text}`);
  }

  return lines.join('\n');
}
