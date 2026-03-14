/**
 * 卦盘文本解析器 — 解析灵光象吉等排盘软件输出
 */
import { LQ_SHORT_TO_KEY, DZ_WUXING, LIU_QIN_CN, LIU_QIN_FULL } from '../core/constants.js';

/**
 * 解析排盘文本，返回结构化卦象数据
 */
export function parseGuaText(text) {
  if (!text || !text.trim()) return null;

  const lines = text.trim().split('\n').map(l => l.trim()).filter(Boolean);
  const result = {
    source: '',
    dateTime: null,
    question: '',
    ganZhi: { year: {}, month: {}, day: {}, hour: {} },
    kongWang: { nian: [], yue: [], ri: [], shi: [] },
    benGua: { name: '', gong: '', gongOrder: 0, type: '' },
    bianGua: { name: '', gong: '', gongOrder: 0, type: '' },
    yaos: [],  // 6爻，从初爻(0)到六爻(5)
    rawText: text,
  };

  // 来源识别
  if (lines[0] && lines[0].includes('灵光象吉')) {
    result.source = 'lingguangxiangji';
  }

  for (const line of lines) {
    // 时间行
    if (line.startsWith('时间')) {
      const m = line.match(/(\d{4})年(\d{2})月(\d{2})日\s+(\d{2}:\d{2}:\d{2})/);
      if (m) {
        result.dateTime = `${m[1]}-${m[2]}-${m[3]} ${m[4]}`;
      }
    }

    // 占问行
    if (line.startsWith('占问')) {
      result.question = line.replace(/^占问[：:]\s*/, '');
    }

    // 四柱干支行
    const gzMatch = line.match(
      /([甲乙丙丁戊己庚辛壬癸])([子丑寅卯辰巳午未申酉戌亥])年\s*([甲乙丙丁戊己庚辛壬癸])([子丑寅卯辰巳午未申酉戌亥])月\s*([甲乙丙丁戊己庚辛壬癸])([子丑寅卯辰巳午未申酉戌亥])日\s*([甲乙丙丁戊己庚辛壬癸])([子丑寅卯辰巳午未申酉戌亥])时/
    );
    if (gzMatch) {
      result.ganZhi = {
        year:  { gan: gzMatch[1], zhi: gzMatch[2] },
        month: { gan: gzMatch[3], zhi: gzMatch[4] },
        day:   { gan: gzMatch[5], zhi: gzMatch[6] },
        hour:  { gan: gzMatch[7], zhi: gzMatch[8] },
      };
    }

    // 空亡行
    const kwMatch = line.match(
      /([子丑寅卯辰巳午未申酉戌亥])([子丑寅卯辰巳午未申酉戌亥])空\s+([子丑寅卯辰巳午未申酉戌亥])([子丑寅卯辰巳午未申酉戌亥])空\s+([子丑寅卯辰巳午未申酉戌亥])([子丑寅卯辰巳午未申酉戌亥])空\s+([子丑寅卯辰巳午未申酉戌亥])([子丑寅卯辰巳午未申酉戌亥])空/
    );
    if (kwMatch) {
      result.kongWang = {
        nian: [kwMatch[1], kwMatch[2]],
        yue:  [kwMatch[3], kwMatch[4]],
        ri:   [kwMatch[5], kwMatch[6]],
        shi:  [kwMatch[7], kwMatch[8]],
      };
    }

    // 本卦行
    const benMatch = line.match(/本卦[：:]\s*(.+?)\/(.+?)宫[·.](\d+)\s*\((.+?)\)/);
    if (benMatch) {
      result.benGua = {
        name: benMatch[1].trim(),
        gong: benMatch[2].trim(),
        gongOrder: parseInt(benMatch[3]),
        type: benMatch[4].trim(),
      };
    }

    // 变卦行
    const bianMatch = line.match(/变卦[：:]\s*(.+?)\/(.+?)宫[·.](\d+)\s*\((.+?)\)/);
    if (bianMatch) {
      result.bianGua = {
        name: bianMatch[1].trim(),
        gong: bianMatch[2].trim(),
        gongOrder: parseInt(bianMatch[3]),
        type: bianMatch[4].trim(),
      };
    }
  }

  // 解析六爻行（最关键部分）
  result.yaos = parseYaoLines(lines);

  return result;
}

/**
 * 解析六爻行数据
 * 格式示例：
 * "玄 财戌 财未 - -     应 财未 - - "
 * "雀 兄寅 兄寅 - -Χ 　 兄卯 — "
 */
function parseYaoLines(lines) {
  const shenChars = ['龙','雀','勾','蛇','虎','玄'];
  const liuqinChars = '父兄孙财官';
  const dizhiChars = '子丑寅卯辰巳午未申酉戌亥';

  const yaoLines = [];

  for (const line of lines) {
    // 判断是否为爻行：以六神简称开头
    const firstChar = line.charAt(0);
    if (!shenChars.includes(firstChar)) continue;

    const yao = parseOneYaoLine(line, firstChar);
    if (yao) yaoLines.push(yao);
  }

  // 灵光象吉格式：从上到下是 六爻→初爻，需要反转
  yaoLines.reverse();

  // 设定爻位
  yaoLines.forEach((y, i) => { y.position = i + 1; });

  return yaoLines;
}

/**
 * 解析单行爻数据
 */
function parseOneYaoLine(line, shenChar) {
  const shenMap = {
    '龙': '青龙', '雀': '朱雀', '勾': '勾陈',
    '蛇': '螣蛇', '虎': '白虎', '玄': '玄武',
  };

  const yao = {
    position: 0,
    liuShen: shenMap[shenChar] || shenChar,
    liuShenShort: shenChar,

    // 本卦宫六亲+地支（纳甲来源于宫）
    gongLiuQin: '',
    gongDizhi: '',

    // 本卦六亲+地支
    benLiuQin: '',
    benLiuQinKey: '',
    benDizhi: '',
    benWuxing: '',
    benYinYang: '',  // 'yang' | 'yin'

    // 世应
    isShi: false,
    isYing: false,

    // 动爻
    isDong: false,
    dongType: '',  // 'Ο'(老阳动) | 'Χ'(老阴动)

    // 变卦六亲+地支
    bianLiuQin: '',
    bianLiuQinKey: '',
    bianDizhi: '',
    bianWuxing: '',
    bianYinYang: '',

    // 状态标记（由规则引擎填充）
    status: {},
  };

  // 移除六神字符后的内容
  let rest = line.substring(1).trim();

  // 用正则提取关键信息
  // 模式：六亲+地支(宫) 六亲+地支(卦) 阴阳 [世/应] [动标记] [变卦六亲+地支 阴阳]
  const lqChars = '父兄孙财官';
  const dzChars = '子丑寅卯辰巳午未申酉戌亥';

  // 提取所有"六亲+地支"对
  const lqdzRegex = new RegExp(`([${lqChars}])([${dzChars}])`, 'g');
  const pairs = [];
  let m;
  while ((m = lqdzRegex.exec(rest)) !== null) {
    pairs.push({ lq: m[1], dz: m[2], index: m.index });
  }

  if (pairs.length >= 2) {
    // 第一对：宫的六亲+地支
    yao.gongLiuQin = pairs[0].lq;
    yao.gongDizhi = pairs[0].dz;

    // 第二对：本卦的六亲+地支
    yao.benLiuQin = pairs[1].lq;
    yao.benDizhi = pairs[1].dz;
    yao.benLiuQinKey = LQ_SHORT_TO_KEY[pairs[1].lq] || '';
    yao.benWuxing = DZ_WUXING[pairs[1].dz] || '';
  }

  // 判断阴阳（本卦）
  // "—" 或连续横线 = 阳爻，"- -" 或 "- -" = 阴爻
  // 在第二对之后、世应/动标记之前的区域查找
  if (pairs.length >= 2) {
    const afterSecondPair = rest.substring(pairs[1].index + 2);
    // 先看是否有阴爻标记
    if (/--|-\s+-/.test(afterSecondPair.substring(0, 10))) {
      yao.benYinYang = 'yin';
    } else if (/—/.test(afterSecondPair.substring(0, 10))) {
      yao.benYinYang = 'yang';
    }
  }

  // 判断世应
  if (rest.includes('世')) yao.isShi = true;
  if (rest.includes('应')) yao.isYing = true;

  // 判断动爻
  if (rest.includes('Ο') || rest.includes('○')) {
    yao.isDong = true;
    yao.dongType = 'Ο'; // 老阳动
  }
  if (rest.includes('Χ') || rest.includes('×') || rest.includes('X')) {
    yao.isDong = true;
    yao.dongType = 'Χ'; // 老阴动
  }

  // 变卦六亲+地支（第3对或第4对，取最后一对之后还有的）
  if (pairs.length >= 3) {
    const lastPair = pairs[pairs.length - 1];
    // 如果最后一对在动标记之后，则为变卦
    yao.bianLiuQin = lastPair.lq;
    yao.bianDizhi = lastPair.dz;
    yao.bianLiuQinKey = LQ_SHORT_TO_KEY[lastPair.lq] || '';
    yao.bianWuxing = DZ_WUXING[lastPair.dz] || '';
  }

  // 变卦阴阳
  if (yao.bianDizhi) {
    // 查找最后的阴阳标记
    const lastSegment = rest.substring(rest.lastIndexOf(yao.bianDizhi) + 1);
    if (/--|-\s+-/.test(lastSegment)) {
      yao.bianYinYang = 'yin';
    } else if (/—/.test(lastSegment)) {
      yao.bianYinYang = 'yang';
    }
  }

  return yao;
}

/**
 * 验证解析结果完整性
 */
export function validateParsed(data) {
  const errors = [];
  if (!data.ganZhi.day.gan) errors.push('缺少日柱干支');
  if (!data.benGua.name) errors.push('缺少本卦名称');
  if (data.yaos.length !== 6) errors.push(`爻数异常：解析到 ${data.yaos.length} 爻`);

  const hasShi = data.yaos.some(y => y.isShi);
  const hasYing = data.yaos.some(y => y.isYing);
  if (!hasShi) errors.push('未找到世爻');
  if (!hasYing) errors.push('未找到应爻');

  return { valid: errors.length === 0, errors };
}
