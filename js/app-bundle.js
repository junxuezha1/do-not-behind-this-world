/**
 * 四时有序 · 六爻解卦 — 合并单文件版
 * 包含：常量表 + 五行引擎 + 干支运算 + 文本解析器 + 规则引擎 + AI接入 + 归档 + UI
 */

// ╔══════════════════════════════════════════════════╗
// ║               1. 核心常量表                       ║
// ╚══════════════════════════════════════════════════╝

const TIAN_GAN = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];
const DI_ZHI = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];

const DZ_WUXING = {
  '子':'water','丑':'earth','寅':'wood','卯':'wood',
  '辰':'earth','巳':'fire','午':'fire','未':'earth',
  '申':'metal','酉':'metal','戌':'earth','亥':'water',
};

const TG_WUXING = {
  '甲':'wood','乙':'wood','丙':'fire','丁':'fire',
  '戊':'earth','己':'earth','庚':'metal','辛':'metal',
  '壬':'water','癸':'water',
};

const WX_CN = { 'wood':'木','fire':'火','earth':'土','metal':'金','water':'水' };

const LIU_HE_MAP = {
  '子':'丑','丑':'子','寅':'亥','亥':'寅',
  '卯':'戌','戌':'卯','辰':'酉','酉':'辰',
  '巳':'申','申':'巳','午':'未','未':'午',
};

const LIU_CHONG_MAP = {
  '子':'午','午':'子','丑':'未','未':'丑',
  '寅':'申','申':'寅','卯':'酉','酉':'卯',
  '辰':'戌','戌':'辰','巳':'亥','亥':'巳',
};

const PO_MAP = {
  '子':'酉','酉':'子','丑':'辰','辰':'丑',
  '寅':'亥','亥':'寅','卯':'午','午':'卯',
  '巳':'申','申':'巳','未':'戌','戌':'未',
};

// 三合局：三个地支合化为某五行
const SAN_HE_JU = [
  { members:['申','子','辰'], result:'water', name:'申子辰合水局' },
  { members:['寅','午','戌'], result:'fire',  name:'寅午戌合火局' },
  { members:['巳','酉','丑'], result:'metal', name:'巳酉丑合金局' },
  { members:['亥','卯','未'], result:'wood',  name:'亥卯未合木局' },
];

// 三合局半合
const BAN_HE_JU = [
  { members:['申','子'], result:'water', name:'申子半合水局' },
  { members:['子','辰'], result:'water', name:'子辰半合水局' },
  { members:['寅','午'], result:'fire',  name:'寅午半合火局' },
  { members:['午','戌'], result:'fire',  name:'午戌半合火局' },
  { members:['巳','酉'], result:'metal', name:'巳酉半合金局' },
  { members:['酉','丑'], result:'metal', name:'酉丑半合金局' },
  { members:['亥','卯'], result:'wood',  name:'亥卯半合木局' },
  { members:['卯','未'], result:'wood',  name:'卯未半合木局' },
];

// 三刑
const SAN_XING_GROUPS = [
  { members:['丑','未','戌'], name:'丑未戌三刑（恃势之刑）' },
  { members:['寅','巳','申'], name:'寅巳申三刑（无恩之刑）' },
];
// 相刑（两两也算）
const XIANG_XING_MAP = {
  '丑':'未','未':'丑', // 也可以两两触发
  '寅':'巳','巳':'申','申':'寅',
  '子':'卯','卯':'子', // 无礼之刑
  '辰':'辰','午':'午','酉':'酉','亥':'亥', // 自刑
};

// 相害（六害）
const XIANG_HAI_MAP = {
  '子':'未','未':'子','丑':'午','午':'丑',
  '寅':'巳','巳':'寅','卯':'辰','辰':'卯',
  '申':'亥','亥':'申','酉':'戌','戌':'酉',
};

const LQ_SHORT_TO_KEY = {
  '兄':'brother','孙':'offspring','财':'wealth','官':'officer','父':'parent',
};
const LIU_QIN_FULL = {
  'brother':'兄弟','offspring':'子孙','wealth':'妻财','officer':'官鬼','parent':'父母',
};

const LIU_SHEN_CSS = {
  '青龙':'shen-qinglong','朱雀':'shen-zhuque','勾陈':'shen-gouchen',
  '螣蛇':'shen-tengshe','白虎':'shen-baihu','玄武':'shen-xuanwu',
  '龙':'shen-qinglong','雀':'shen-zhuque','勾':'shen-gouchen',
  '蛇':'shen-tengshe','虎':'shen-baihu','玄':'shen-xuanwu',
};

const JIN_SHEN_MAP = {
  '子':'丑','丑':'寅','寅':'卯','卯':'辰','辰':'巳','巳':'午',
  '午':'未','未':'申','申':'酉','酉':'戌','戌':'亥','亥':'子',
};

const CHANG_SHENG = {
  'wood':['亥','子','丑','寅','卯','辰','巳','午','未','申','酉','戌'],
  'fire':['寅','卯','辰','巳','午','未','申','酉','戌','亥','子','丑'],
  'metal':['巳','午','未','申','酉','戌','亥','子','丑','寅','卯','辰'],
  'water':['申','酉','戌','亥','子','丑','寅','卯','辰','巳','午','未'],
  'earth':['寅','卯','辰','巳','午','未','申','酉','戌','亥','子','丑'],
};
const CS_STAGES = ['长生','沐浴','冠带','临官','帝旺','衰','病','死','墓','绝','胎','养'];

// 八卦数据：name → { binary(初→上), wuxing, symbol }
const BA_GUA_DATA = {
  '乾': { binary:[1,1,1], wuxing:'metal',  nature:'天' },
  '兑': { binary:[0,1,1], wuxing:'metal',  nature:'泽' },
  '离': { binary:[1,0,1], wuxing:'fire',   nature:'火' },
  '震': { binary:[0,0,1], wuxing:'wood',   nature:'雷' },
  '巽': { binary:[1,1,0], wuxing:'wood',   nature:'风' },
  '坎': { binary:[0,1,0], wuxing:'water',  nature:'水' },
  '艮': { binary:[1,0,0], wuxing:'earth',  nature:'山' },
  '坤': { binary:[0,0,0], wuxing:'earth',  nature:'地' },
};

// binary(3位) → 卦名
const BIN_TO_GUA = {};
for (const [name, data] of Object.entries(BA_GUA_DATA)) {
  BIN_TO_GUA[data.binary.join('')] = name;
}

// 64卦名称表：上卦+下卦 → 卦名
const GUA64_NAMES = {
  '乾乾':'乾为天','乾兑':'天泽履','乾离':'天火同人','乾震':'天雷无妄',
  '乾巽':'天风姤','乾坎':'天水讼','乾艮':'天山遁','乾坤':'天地否',
  '兑乾':'泽天夬','兑兑':'兑为泽','兑离':'泽火革','兑震':'泽雷随',
  '兑巽':'泽风大过','兑坎':'泽水困','兑艮':'泽山咸','兑坤':'泽地萃',
  '离乾':'火天大有','离兑':'火泽睽','离离':'离为火','离震':'火雷噬嗑',
  '离巽':'火风鼎','离坎':'火水未济','离艮':'火山旅','离坤':'火地晋',
  '震乾':'雷天大壮','震兑':'雷泽归妹','震离':'雷火丰','震震':'震为雷',
  '震巽':'雷风恒','震坎':'雷水解','震艮':'雷山小过','震坤':'雷地豫',
  '巽乾':'风天小畜','巽兑':'风泽中孚','巽离':'风火家人','巽震':'风雷益',
  '巽巽':'巽为风','巽坎':'风水涣','巽艮':'风山渐','巽坤':'风地观',
  '坎乾':'水天需','坎兑':'水泽节','坎离':'水火既济','坎震':'水雷屯',
  '坎巽':'水风井','坎坎':'坎为水','坎艮':'水山蹇','坎坤':'水地比',
  '艮乾':'山天大畜','艮兑':'山泽损','艮离':'山火贲','艮震':'山雷颐',
  '艮巽':'山风蛊','艮坎':'山水蒙','艮艮':'艮为山','艮坤':'山地剥',
  '坤乾':'地天泰','坤兑':'地泽临','坤离':'地火明夷','坤震':'地雷复',
  '坤巽':'地风升','坤坎':'地水师','坤艮':'地山谦','坤坤':'坤为地',
};

/**
 * 从6爻二进制数组获取上下卦名
 * binary: [初爻,二爻,三爻,四爻,五爻,六爻]，1=阳，0=阴
 */
function getUpperLower(binary6) {
  const lowerBin = binary6.slice(0,3).join('');
  const upperBin = binary6.slice(3,6).join('');
  return {
    lower: BIN_TO_GUA[lowerBin] || '?',
    upper: BIN_TO_GUA[upperBin] || '?',
  };
}

/**
 * 计算互卦：取2,3,4爻为下卦，3,4,5爻为上卦
 */
function calcHuGua(binary6) {
  const lower = binary6.slice(1,4); // 2,3,4爻
  const upper = binary6.slice(2,5); // 3,4,5爻
  const ul = getUpperLower([...lower, ...upper]);
  const name = GUA64_NAMES[ul.upper + ul.lower] || `${ul.upper}${ul.lower}`;
  return { upper: ul.upper, lower: ul.lower, name, wuxing: BA_GUA_DATA[ul.upper]?.wuxing || '' };
}

/**
 * 计算错卦：各爻阴阳互换
 */
function calcCuoGua(binary6) {
  const flipped = binary6.map(b => b ? 0 : 1);
  const ul = getUpperLower(flipped);
  const name = GUA64_NAMES[ul.upper + ul.lower] || `${ul.upper}${ul.lower}`;
  return { upper: ul.upper, lower: ul.lower, name, wuxing: BA_GUA_DATA[ul.upper]?.wuxing || '' };
}

/**
 * 计算综卦：上下颠倒（翻转数组）
 */
function calcZongGua(binary6) {
  const reversed = [...binary6].reverse();
  const ul = getUpperLower(reversed);
  const name = GUA64_NAMES[ul.upper + ul.lower] || `${ul.upper}${ul.lower}`;
  return { upper: ul.upper, lower: ul.lower, name, wuxing: BA_GUA_DATA[ul.upper]?.wuxing || '' };
}

/**
 * 从解析结果构建6爻二进制数组
 */
function parsedToBinary(parsed) {
  return parsed.yaos.map(y => y.benYinYang === 'yang' ? 1 : 0);
}

/**
 * 获取卦的五行颜色class
 */
function wxColorClass(wuxing) {
  const map = { 'wood':'wx-wood','fire':'wx-fire','earth':'wx-earth','metal':'wx-metal','water':'wx-water' };
  return map[wuxing] || '';
}
function wxBgClass(wuxing) {
  const map = { 'wood':'wxbg-wood','fire':'wxbg-fire','earth':'wxbg-earth','metal':'wxbg-metal','water':'wxbg-water' };
  return map[wuxing] || '';
}
function yaoColorClass(wuxing) {
  const map = { 'wood':'yao-wood','fire':'yao-fire','earth':'yao-earth','metal':'yao-metal','water':'yao-water' };
  return map[wuxing] || 'yao-metal';
}


// ╔══════════════════════════════════════════════════╗
// ║               2. 五行引擎                        ║
// ╚══════════════════════════════════════════════════╝

const WX_SHENG = { 'wood':'fire','fire':'earth','earth':'metal','metal':'water','water':'wood' };
const WX_KE = { 'wood':'earth','earth':'water','water':'fire','fire':'metal','metal':'wood' };

function wxRelation(a, b) {
  if (a === b) return 'same';
  if (WX_SHENG[a] === b) return 'sheng';
  if (WX_SHENG[b] === a) return 'bei-sheng';
  if (WX_KE[a] === b) return 'ke';
  if (WX_KE[b] === a) return 'bei-ke';
}

function isSheng(a, b) { return WX_SHENG[a] === b; }
function isKe(a, b) { return WX_KE[a] === b; }

function wangShuai(yaoWX, yueWX) {
  if (yaoWX === yueWX) return '旺';
  if (WX_SHENG[yueWX] === yaoWX) return '相';
  if (WX_SHENG[yaoWX] === yueWX) return '休';
  if (WX_KE[yueWX] === yaoWX) return '囚';
  if (WX_KE[yaoWX] === yueWX) return '死';
  return '休';
}


// ╔══════════════════════════════════════════════════╗
// ║               3. 干支运算                        ║
// ╚══════════════════════════════════════════════════╝

function isLiuHe(a, b) { return LIU_HE_MAP[a] === b; }
function isLiuChong(a, b) { return LIU_CHONG_MAP[a] === b; }
function isPo(a, b) { return PO_MAP[a] === b; }


// ╔══════════════════════════════════════════════════╗
// ║               4. 文本解析器                      ║
// ╚══════════════════════════════════════════════════╝

const GONG_ORDER_TYPE = { 1:'六冲', 2:'一世', 3:'二世', 4:'三世', 5:'四世', 6:'五世', 7:'游魂', 8:'归魂' };
function gongOrderToType(order) { return GONG_ORDER_TYPE[order] || ''; }

function parseGuaText(text) {
  if (!text || !text.trim()) return null;

  const lines = text.trim().split('\n').map(l => l.trim()).filter(Boolean);
  const result = {
    source: '',
    dateTime: null,
    question: '',
    ganZhi: { year:{}, month:{}, day:{}, hour:{} },
    kongWang: { nian:[], yue:[], ri:[], shi:[] },
    benGua: { name:'', gong:'', gongOrder:0, type:'' },
    bianGua: { name:'', gong:'', gongOrder:0, type:'' },
    yaos: [],
    rawText: text,
  };

  if (lines[0] && lines[0].includes('灵光象吉')) result.source = 'lingguangxiangji';

  for (const line of lines) {
    if (line.startsWith('时间')) {
      const m = line.match(/(\d{4})年(\d{2})月(\d{2})日\s+(\d{2}:\d{2}:\d{2})/);
      if (m) result.dateTime = `${m[1]}-${m[2]}-${m[3]} ${m[4]}`;
    }

    if (line.startsWith('占问')) {
      result.question = line.replace(/^占问[：:]\s*/, '');
    }

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

    const benMatch = line.match(/本卦[：:]\s*(.+?)\/(.+?)宫[·.](\d+)(?:\s*\((.+?)\))?/);
    if (benMatch) {
      const gongOrder = parseInt(benMatch[3]);
      result.benGua = { name: benMatch[1].trim(), gong: benMatch[2].trim(), gongOrder, type: benMatch[4]?.trim() || gongOrderToType(gongOrder) };
    }

    const bianMatch = line.match(/变卦[：:]\s*(.+?)\/(.+?)宫[·.](\d+)(?:\s*\((.+?)\))?/);
    if (bianMatch) {
      const gongOrder = parseInt(bianMatch[3]);
      result.bianGua = { name: bianMatch[1].trim(), gong: bianMatch[2].trim(), gongOrder, type: bianMatch[4]?.trim() || gongOrderToType(gongOrder) };
    }
  }

  result.yaos = parseYaoLines(lines);
  return result;
}

function parseYaoLines(lines) {
  const shenChars = ['龙','雀','勾','蛇','虎','玄'];
  const yaoLines = [];

  for (const line of lines) {
    if (!shenChars.includes(line.charAt(0))) continue;
    const yao = parseOneYaoLine(line, line.charAt(0));
    if (yao) yaoLines.push(yao);
  }

  yaoLines.reverse();
  yaoLines.forEach((y, i) => { y.position = i + 1; });
  return yaoLines;
}

function parseOneYaoLine(line, shenChar) {
  const shenMap = { '龙':'青龙','雀':'朱雀','勾':'勾陈','蛇':'螣蛇','虎':'白虎','玄':'玄武' };

  const yao = {
    position: 0,
    liuShen: shenMap[shenChar] || shenChar,
    liuShenShort: shenChar,
    gongLiuQin: '', gongDizhi: '',
    benLiuQin: '', benLiuQinKey: '', benDizhi: '', benWuxing: '', benYinYang: '',
    isShi: false, isYing: false,
    isDong: false, dongType: '',
    bianLiuQin: '', bianLiuQinKey: '', bianDizhi: '', bianWuxing: '', bianYinYang: '',
    status: {},
  };

  const rest = line.substring(1).trim();
  const lqdzRegex = /([父兄孙财官])([子丑寅卯辰巳午未申酉戌亥])/g;
  const pairs = [];
  let m;
  while ((m = lqdzRegex.exec(rest)) !== null) {
    pairs.push({ lq: m[1], dz: m[2], index: m.index });
  }

  if (pairs.length >= 2) {
    yao.gongLiuQin = pairs[0].lq;
    yao.gongDizhi = pairs[0].dz;
    yao.benLiuQin = pairs[1].lq;
    yao.benDizhi = pairs[1].dz;
    yao.benLiuQinKey = LQ_SHORT_TO_KEY[pairs[1].lq] || '';
    yao.benWuxing = DZ_WUXING[pairs[1].dz] || '';
  }

  if (pairs.length >= 2) {
    const afterSecondPair = rest.substring(pairs[1].index + 2);
    if (/--|-\s+-/.test(afterSecondPair.substring(0, 10))) {
      yao.benYinYang = 'yin';
    } else if (/—/.test(afterSecondPair.substring(0, 10))) {
      yao.benYinYang = 'yang';
    }
  }

  if (rest.includes('世')) yao.isShi = true;
  if (rest.includes('应')) yao.isYing = true;

  if (rest.includes('Ο') || rest.includes('○') || rest.includes('Ｏ')) { yao.isDong = true; yao.dongType = 'Ο'; }
  if (rest.includes('Χ') || rest.includes('×') || rest.includes('X') || rest.includes('Ｘ')) { yao.isDong = true; yao.dongType = 'Χ'; }

  if (pairs.length >= 3) {
    const lastPair = pairs[pairs.length - 1];
    yao.bianLiuQin = lastPair.lq;
    yao.bianDizhi = lastPair.dz;
    yao.bianLiuQinKey = LQ_SHORT_TO_KEY[lastPair.lq] || '';
    yao.bianWuxing = DZ_WUXING[lastPair.dz] || '';
  }

  if (yao.bianDizhi) {
    const lastSegment = rest.substring(rest.lastIndexOf(yao.bianDizhi) + 1);
    if (/--|-\s+-/.test(lastSegment)) yao.bianYinYang = 'yin';
    else if (/—/.test(lastSegment)) yao.bianYinYang = 'yang';
  }

  return yao;
}

function validateParsed(data) {
  const errors = [];
  if (!data.ganZhi.day.gan) errors.push('缺少日柱干支');
  if (!data.benGua.name) errors.push('缺少本卦名称');
  if (data.yaos.length !== 6) errors.push(`爻数异常：解析到 ${data.yaos.length} 爻`);
  if (!data.yaos.some(y => y.isShi)) errors.push('未找到世爻');
  if (!data.yaos.some(y => y.isYing)) errors.push('未找到应爻');
  return { valid: errors.length === 0, errors };
}


// ╔══════════════════════════════════════════════════╗
// ║               5. 规则引擎                        ║
// ╚══════════════════════════════════════════════════╝

function runEngine(parsed) {
  const report = {
    basic: buildBasicInfo(parsed),
    yaoDetails: [],
    kongWang: analyzeKongWang(parsed),
    yueJian: analyzeYueJian(parsed),
    riChen: analyzeRiChen(parsed),
    dongBian: analyzeDongBian(parsed),
    special: analyzeSpecial(parsed),
    yingQi: [],
    summary: '',
  };
  report.yaoDetails = parsed.yaos.map(yao => analyzeYao(yao, parsed));
  report.summary = buildSummary(report, parsed);
  return report;
}

function buildBasicInfo(p) {
  const shiYao = p.yaos.find(y => y.isShi);
  const yingYao = p.yaos.find(y => y.isYing);
  const dongYaos = p.yaos.filter(y => y.isDong);
  return {
    question: p.question, dateTime: p.dateTime, ganZhi: p.ganZhi,
    benGua: p.benGua, bianGua: p.bianGua,
    shiYao: shiYao ? `${shiYao.position}爻 ${LIU_QIN_FULL[shiYao.benLiuQinKey]||shiYao.benLiuQin}${shiYao.benDizhi}` : '',
    yingYao: yingYao ? `${yingYao.position}爻 ${LIU_QIN_FULL[yingYao.benLiuQinKey]||yingYao.benLiuQin}${yingYao.benDizhi}` : '',
    dongYaoCount: dongYaos.length,
    dongYaoList: dongYaos.map(y => ({ position:y.position, ben:`${y.benLiuQin}${y.benDizhi}`, bian:`${y.bianLiuQin}${y.bianDizhi}` })),
    kongWangRi: p.kongWang.ri.join(''),
    yueJian: p.ganZhi.month ? `${p.ganZhi.month.zhi}(${WX_CN[DZ_WUXING[p.ganZhi.month.zhi]]||''})` : '',
    riChen: p.ganZhi.day ? `${p.ganZhi.day.zhi}(${WX_CN[DZ_WUXING[p.ganZhi.day.zhi]]||''})` : '',
  };
}

function analyzeKongWang(p) {
  const findings = [];
  const riKong = p.kongWang.ri || [];
  for (const yao of p.yaos) {
    if (riKong.includes(yao.benDizhi)) {
      yao.status.kongWang = true;
      findings.push({ yaoPos:yao.position, text:`${yao.position}爻 ${yao.benLiuQin}${yao.benDizhi} 日空亡`, impact:'negative' });
    }
    if (yao.isDong && yao.bianDizhi && riKong.includes(yao.bianDizhi)) {
      yao.status.huaKong = true;
      findings.push({ yaoPos:yao.position, text:`${yao.position}爻 动化${yao.bianLiuQin}${yao.bianDizhi}，化入空亡`, impact:'negative' });
    }
  }
  return findings;
}

function analyzeYueJian(p) {
  const findings = [];
  if (!p.ganZhi.month || !p.ganZhi.month.zhi) return findings;
  const yueZhi = p.ganZhi.month.zhi;
  const yueWX = DZ_WUXING[yueZhi];

  for (const yao of p.yaos) {
    const yaoWX = yao.benWuxing;
    if (!yaoWX) continue;

    if (isSheng(yueWX, yaoWX)) {
      yao.status.yueSheng = true;
      findings.push({ yaoPos:yao.position, text:`${yao.position}爻 ${yao.benLiuQin}${yao.benDizhi} 得月建${yueZhi}${WX_CN[yueWX]}相生，旺`, impact:'positive' });
    }
    if (isKe(yueWX, yaoWX)) {
      yao.status.yueKe = true;
      findings.push({ yaoPos:yao.position, text:`${yao.position}爻 ${yao.benLiuQin}${yao.benDizhi} 受月建${yueZhi}${WX_CN[yueWX]}所克`, impact:'negative' });
    }
    if (yueWX === yaoWX) {
      yao.status.yueSheng = true;
      findings.push({ yaoPos:yao.position, text:`${yao.position}爻 ${yao.benLiuQin}${yao.benDizhi} 与月建${yueZhi}比和，旺相`, impact:'positive' });
    }
    if (isLiuHe(yueZhi, yao.benDizhi)) {
      yao.status.yueHe = true;
      findings.push({ yaoPos:yao.position, text:`${yao.position}爻 ${yao.benLiuQin}${yao.benDizhi} 与月建${yueZhi}相合`, impact:'neutral' });
    }
    if (isLiuChong(yueZhi, yao.benDizhi)) {
      yao.status.yuePo = true;
      findings.push({ yaoPos:yao.position, text:`${yao.position}爻 ${yao.benLiuQin}${yao.benDizhi} 月破（${yueZhi}${yao.benDizhi}相冲）`, impact:'negative' });
    }
    yao.status.wangShuai = wangShuai(yaoWX, yueWX);
  }
  return findings;
}

function analyzeRiChen(p) {
  const findings = [];
  if (!p.ganZhi.day || !p.ganZhi.day.zhi) return findings;
  const riZhi = p.ganZhi.day.zhi;
  const riWX = DZ_WUXING[riZhi];

  for (const yao of p.yaos) {
    const yaoWX = yao.benWuxing;
    if (!yaoWX) continue;

    if (isSheng(riWX, yaoWX)) {
      yao.status.riSheng = true;
      findings.push({ yaoPos:yao.position, text:`${yao.position}爻 ${yao.benLiuQin}${yao.benDizhi} 得日辰${riZhi}${WX_CN[riWX]}相生`, impact:'positive' });
    }
    if (isKe(riWX, yaoWX)) {
      yao.status.riKe = true;
      findings.push({ yaoPos:yao.position, text:`${yao.position}爻 ${yao.benLiuQin}${yao.benDizhi} 受日辰${riZhi}${WX_CN[riWX]}所克`, impact:'negative' });
    }
    if (isLiuHe(riZhi, yao.benDizhi)) {
      yao.status.riHe = true;
      findings.push({ yaoPos:yao.position, text:`${yao.position}爻 ${yao.benLiuQin}${yao.benDizhi} 与日辰${riZhi}六合`, impact:'neutral' });
    }
    if (isLiuChong(riZhi, yao.benDizhi)) {
      yao.status.riChong = true;
      findings.push({ yaoPos:yao.position, text:`${yao.position}爻 ${yao.benLiuQin}${yao.benDizhi} 日冲（${riZhi}${yao.benDizhi}相冲）`, impact: yao.isDong ? 'negative' : 'neutral' });
    }
    if (isPo(riZhi, yao.benDizhi)) {
      yao.status.riPo = true;
      findings.push({ yaoPos:yao.position, text:`${yao.position}爻 ${yao.benLiuQin}${yao.benDizhi} 日破`, impact:'negative' });
    }
  }
  return findings;
}

function analyzeDongBian(p) {
  const findings = [];
  const riKong = p.kongWang.ri || [];

  for (const yao of p.yaos) {
    if (!yao.isDong) continue;
    const benDZ = yao.benDizhi, bianDZ = yao.bianDizhi;
    if (!bianDZ) continue;
    const benWX = yao.benWuxing, bianWX = yao.bianWuxing;

    if (JIN_SHEN_MAP[benDZ] === bianDZ && benWX === bianWX) {
      yao.status.jinShen = true;
      findings.push({ yaoPos:yao.position, text:`${yao.position}爻 ${yao.benLiuQin}${benDZ} 化进神 ${yao.bianLiuQin}${bianDZ}`, impact:'positive' });
    }

    if (benWX && bianDZ) {
      const csOrder = CHANG_SHENG[benWX];
      if (csOrder) {
        const stageIdx = csOrder.indexOf(bianDZ);
        if (stageIdx >= 0) {
          const stage = CS_STAGES[stageIdx];
          if (stage === '绝') {
            yao.status.huaJue = true;
            findings.push({ yaoPos:yao.position, text:`${yao.position}爻 ${yao.benLiuQin}${benDZ} 化绝于${bianDZ}`, impact:'negative' });
          }
          if (stage === '墓') {
            yao.status.huaMu = true;
            findings.push({ yaoPos:yao.position, text:`${yao.position}爻 ${yao.benLiuQin}${benDZ} 化墓于${bianDZ}`, impact:'negative' });
          }
        }
      }
    }

    if (bianWX && benWX) {
      if (isSheng(bianWX, benWX)) {
        yao.status.huiTouSheng = true;
        findings.push({ yaoPos:yao.position, text:`${yao.position}爻 ${yao.benLiuQin}${benDZ} 动化回头生（${yao.bianLiuQin}${bianDZ}${WX_CN[bianWX]}生${WX_CN[benWX]}）`, impact:'positive' });
      }
      if (isKe(bianWX, benWX)) {
        yao.status.huiTouKe = true;
        findings.push({ yaoPos:yao.position, text:`${yao.position}爻 ${yao.benLiuQin}${benDZ} 动化回头克（${yao.bianLiuQin}${bianDZ}${WX_CN[bianWX]}克${WX_CN[benWX]}）`, impact:'negative' });
      }
    }

    if (isLiuChong(benDZ, bianDZ)) {
      yao.status.huaChong = true;
      findings.push({ yaoPos:yao.position, text:`${yao.position}爻 ${yao.benLiuQin}${benDZ} 动化 ${yao.bianLiuQin}${bianDZ}，本变互冲`, impact:'negative' });
    }
  }
  return findings;
}

function analyzeSpecial(p) {
  const findings = [];
  if (p.benGua.type) findings.push({ text:`本卦：${p.benGua.name}（${p.benGua.type}）`, impact:'neutral' });
  if (p.bianGua.name && p.bianGua.type) findings.push({ text:`变卦：${p.bianGua.name}（${p.bianGua.type}）`, impact:'neutral' });
  if (p.benGua.type === '六冲') findings.push({ text:'本卦六冲：事难成，散', impact:'negative' });
  if (p.bianGua.type === '六冲') findings.push({ text:'变卦六冲：先成后败，终散', impact:'warning' });
  if (p.benGua.type === '六合') findings.push({ text:'本卦六合：事可成，合', impact:'positive' });
  if (p.benGua.type === '归魂') findings.push({ text:'归魂卦：事有着落，回归', impact:'neutral' });
  if (p.benGua.type === '游魂') findings.push({ text:'游魂卦：事不定，飘忽', impact:'warning' });
  return findings;
}

function analyzeYao(yao) {
  const detail = {
    position: yao.position,
    posLabel: ['初爻','二爻','三爻','四爻','五爻','六爻'][yao.position-1],
    liuShen: yao.liuShen,
    benLiuQin: yao.benLiuQin, benDizhi: yao.benDizhi,
    benWuxing: yao.benWuxing ? WX_CN[yao.benWuxing] : '',
    isShi: yao.isShi, isYing: yao.isYing, isDong: yao.isDong,
    bianLiuQin: yao.bianLiuQin, bianDizhi: yao.bianDizhi,
    bianWuxing: yao.bianWuxing ? WX_CN[yao.bianWuxing] : '',
    statuses: [], wangShuai: yao.status.wangShuai || '',
  };

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

function buildSummary(report, p) {
  const lines = [];
  lines.push(`【占问】${p.question}`);
  lines.push(`【时间】${p.dateTime||''}`);
  lines.push(`【四柱】${p.ganZhi.year?.gan||''}${p.ganZhi.year?.zhi||''}年 ${p.ganZhi.month?.gan||''}${p.ganZhi.month?.zhi||''}月 ${p.ganZhi.day?.gan||''}${p.ganZhi.day?.zhi||''}日 ${p.ganZhi.hour?.gan||''}${p.ganZhi.hour?.zhi||''}时`);
  lines.push(`【日空】${p.kongWang.ri.join('')}`);
  lines.push(`【月建】${report.basic.yueJian} 【日辰】${report.basic.riChen}`);
  lines.push(`【本卦】${p.benGua.name} / ${p.benGua.gong}宫 (${p.benGua.type})`);
  if (p.bianGua.name) lines.push(`【变卦】${p.bianGua.name} / ${p.bianGua.gong}宫 (${p.bianGua.type})`);
  lines.push(`【世爻】${report.basic.shiYao} 【应爻】${report.basic.yingYao}`);
  lines.push(report.basic.dongYaoCount > 0
    ? `【动爻】${report.basic.dongYaoList.map(d=>`${d.position}爻(${d.ben}→${d.bian})`).join('，')}`
    : '【动爻】无');

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
  for (const f of [...report.kongWang,...report.yueJian,...report.riChen,...report.dongBian,...report.special]) {
    lines.push(`- ${f.text}`);
  }
  return lines.join('\n');
}


// ╔══════════════════════════════════════════════════╗
// ║               6. AI 接入层                       ║
// ╚══════════════════════════════════════════════════╝

const AI_PROVIDERS = {
  openai: {
    name:'OpenAI (GPT)', defaultBaseUrl:'https://api.openai.com/v1/chat/completions', defaultModel:'gpt-4o',
    buildHeaders(k) { return {'Content-Type':'application/json','Authorization':`Bearer ${k}`}; },
    buildBody(model,sys,usr,stream) { return {model,max_tokens:4096,stream,messages:[{role:'system',content:sys},{role:'user',content:usr}]}; },
    parseResponse(d) { return d.choices?.[0]?.message?.content||''; },
    parseStreamChunk(line) {
      if (!line.startsWith('data: ')) return '';
      const json = line.slice(6);
      if (json === '[DONE]') return null;
      try { return JSON.parse(json).choices?.[0]?.delta?.content||''; } catch { return ''; }
    },
  },
  claude: {
    name:'Claude', defaultBaseUrl:'https://api.anthropic.com/v1/messages', defaultModel:'claude-sonnet-4-20250514',
    buildHeaders(k) { return {'Content-Type':'application/json','x-api-key':k,'anthropic-version':'2023-06-01','anthropic-dangerous-direct-browser-access':'true'}; },
    buildBody(model,sys,usr,stream) { return {model,max_tokens:4096,stream,system:sys,messages:[{role:'user',content:usr}]}; },
    parseResponse(d) { return d.content?.[0]?.text||''; },
    parseStreamChunk(line) {
      if (!line.startsWith('data: ')) return '';
      try { const o=JSON.parse(line.slice(6)); return o.type==='content_block_delta'?o.delta?.text||'':''; } catch { return ''; }
    },
  },
  deepseek: {
    name:'DeepSeek', defaultBaseUrl:'https://api.deepseek.com/v1/chat/completions', defaultModel:'deepseek-chat',
    buildHeaders(k) { return {'Content-Type':'application/json','Authorization':`Bearer ${k}`}; },
    buildBody(model,sys,usr,stream) { return {model,max_tokens:4096,stream,messages:[{role:'system',content:sys},{role:'user',content:usr}]}; },
    parseResponse(d) { return d.choices?.[0]?.message?.content||''; },
    parseStreamChunk(line) { return AI_PROVIDERS.openai.parseStreamChunk(line); },
  },
  custom: {
    name:'自定义 (OpenAI兼容)', defaultBaseUrl:'', defaultModel:'',
    buildHeaders(k) { return {'Content-Type':'application/json','Authorization':`Bearer ${k}`}; },
    buildBody(model,sys,usr,stream) { return {model,max_tokens:4096,stream,messages:[{role:'system',content:sys},{role:'user',content:usr}]}; },
    parseResponse(d) { return d.choices?.[0]?.message?.content||''; },
    parseStreamChunk(line) { return AI_PROVIDERS.openai.parseStreamChunk(line); },
  },
};

function getAISystemPrompt() {
  return `你是一位精通六爻纳甲筮法的资深易学大师，具备数十年实战断卦经验。

## 你的角色
- 严格遵循京房纳甲体系进行断卦
- 以用神为核心，结合日辰月建、动变、空亡等因素综合判断
- 给出明确的吉凶判断和具体的时间应期
- 语言风格：专业严谨但通俗易懂

## 断卦原则
1. 先定用神：根据占问事项确定用神六亲
2. 看用神旺衰：月建日辰对用神的生克
3. 看动爻影响：动爻对用神的生克
4. 看特殊状态：空亡、月破、化绝、化空等
5. 综合判断：世应关系、六神含义、卦宫五行

## 应期推断原则
- 用神旺相，应在生旺之时
- 用神休囚，应在生旺之时（待旺有力时应）
- 用神入墓，应在冲墓之时
- 用神空亡，应在出空填实之时
- 用神被合，应在冲合之时
- 用神动化进神，近应
- 用神动化退神，远应或不应

## 输出格式
### 一、卦象概述
### 二、用神分析
### 三、关键爻分析
### 四、综合判断
### 五、应期
### 六、建议`;
}

function getAIUserPrompt(summary, rawText) {
  return `以下是一个六爻卦盘的完整信息和规则引擎预分析结果，请进行专业断卦分析。

## 原始卦盘
\`\`\`
${rawText}
\`\`\`

## 结构化分析
${summary}

请按要求格式进行完整的断卦分析，重点回答占问问题，并推算应期。`;
}

const aiConfig = {
  activeProvider: 'openai',
  providers: { openai:{apiKey:'',model:'',baseUrl:''}, claude:{apiKey:'',model:'',baseUrl:''}, deepseek:{apiKey:'',model:'',baseUrl:''}, custom:{apiKey:'',model:'',baseUrl:''} },
};

function getDefaultApiBaseUrl() {
  if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
    return 'http://localhost:8081';
  }
  return `${location.origin}/api`;
}

const API_BASE_URL = localStorage.getItem('liuguang_api_base') || getDefaultApiBaseUrl();
const SESSION_KEY = 'liuguang_session_id';

function ensureSessionId() {
  let sid = localStorage.getItem(SESSION_KEY);
  if (!sid) {
    sid = `${Date.now().toString(36)}${Math.random().toString(36).slice(2,8)}`;
    localStorage.setItem(SESSION_KEY, sid);
  }
  return sid;
}

function getApiHeaders() {
  return {
    'Content-Type': 'application/json',
    'x-session-id': ensureSessionId(),
  };
}

async function fetchQuotaInfo() {
  const resp = await fetch(`${API_BASE_URL}/api/ai/quota`, {
    headers: { 'x-session-id': ensureSessionId() },
  });
  if (!resp.ok) throw new Error('配额查询失败');
  return resp.json();
}

async function refreshQuotaHint() {
  const el = $('ai-quota-hint');
  if (!el) return;
  try {
    const q = await fetchQuotaInfo();
    el.textContent = `今日剩余 ${q.remaining}/${q.limit} 次`;
  } catch {
    if (location.hostname.includes('github.io')) {
      el.textContent = '在线版当前未连接 AI 服务，规则分析可直接使用';
      return;
    }
    el.textContent = '后端未连接：请双击“启动服务器.bat”后重试';
  }
}

function loadAIConfig() {
  try { const s = localStorage.getItem('liuguang_ai_config'); if (s) Object.assign(aiConfig, JSON.parse(s)); } catch {}
}
function saveAIConfig() { localStorage.setItem('liuguang_ai_config', JSON.stringify(aiConfig)); }

async function streamAIAnalyze(summary, rawText, onChunk, onDone, onError) {
  try {
    const resp = await fetch(`${API_BASE_URL}/api/ai/analyze`, {
      method: 'POST',
      headers: getApiHeaders(),
      body: JSON.stringify({ summary, rawText }),
    });

    if (!resp.ok) {
      let message = `后端错误 (${resp.status})`;
      try {
        const err = await resp.json();
        if (err?.error) message = err.error;
      } catch {}
      onError?.(message);
      return;
    }

    if (!resp.body) {
      onError?.('后端未返回流式内容');
      return;
    }

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data: ')) continue;
        const payload = trimmed.slice(6);
        try {
          const evt = JSON.parse(payload);
          if (evt.type === 'delta' && evt.content) {
            onChunk(evt.content);
          } else if (evt.type === 'quota') {
            const hint = $('ai-quota-hint');
            if (hint) hint.textContent = `今日剩余 ${evt.remaining}/${evt.limit} 次`;
          } else if (evt.type === 'error') {
            onError?.(evt.error || '流式分析中断');
          }
        } catch {
          // ignore chunk parse errors
        }
      }
    }

    onDone?.();
  } catch (err) {
    if (location.hostname.includes('github.io')) {
      onError?.('在线版当前未连接 AI 服务。你仍可直接使用解析、规则分析和归档功能。');
      return;
    }
    onError?.(`请求失败: ${err.message || '未知错误'}，请确认已通过 BAT 启动本地服务`);
  }
}


// ╔══════════════════════════════════════════════════╗
// ║               7. 归档系统                        ║
// ╚══════════════════════════════════════════════════╝

const ARCHIVE_KEY = 'liuguang_archives';

function createArchiveEntry(parsed, report, aiResult) {
  return {
    id: Date.now().toString(36) + Math.random().toString(36).substr(2,4),
    timestamp: new Date().toISOString(),
    archiveDate: new Date().toLocaleDateString('zh-CN'),
    question: parsed.question, dateTime: parsed.dateTime,
    ganZhi: `${parsed.ganZhi.year?.gan||''}${parsed.ganZhi.year?.zhi||''}年 ${parsed.ganZhi.month?.gan||''}${parsed.ganZhi.month?.zhi||''}月 ${parsed.ganZhi.day?.gan||''}${parsed.ganZhi.day?.zhi||''}日 ${parsed.ganZhi.hour?.gan||''}${parsed.ganZhi.hour?.zhi||''}时`,
    benGua: parsed.benGua.name, bianGua: parsed.bianGua.name || '无',
    guaGong: parsed.benGua.gong, guaType: parsed.benGua.type,
    shiYao: report.basic.shiYao, yingYao: report.basic.yingYao,
    dongYao: report.basic.dongYaoList.map(d=>`${d.position}爻(${d.ben}→${d.bian})`).join('，') || '无',
    kongWang: parsed.kongWang.ri.join('') || '无',
    conclusion: '', aiResult: aiResult || '', yingQi: '',
    verified: false, verifyNote: '',
    rawText: parsed.rawText,
  };
}

function loadArchivesListLocal() {
  try { const s = localStorage.getItem(ARCHIVE_KEY); return s ? JSON.parse(s) : []; } catch { return []; }
}
function saveArchiveEntryLocal(a) { const list = loadArchivesListLocal(); list.unshift(a); localStorage.setItem(ARCHIVE_KEY, JSON.stringify(list)); }
function clearAllArchives() { localStorage.removeItem(ARCHIVE_KEY); }
function exportAllArchives() {
  const list = loadArchivesListLocal();
  const blob = new Blob([JSON.stringify(list,null,2)], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `六爻归档_${new Date().toLocaleDateString('zh-CN').replace(/\//g,'-')}.json`;
  a.click(); URL.revokeObjectURL(url);
}

async function loadArchivesList() {
  try {
    const resp = await fetch(`${API_BASE_URL}/api/archive`, { headers: { 'x-session-id': ensureSessionId() } });
    if (!resp.ok) throw new Error('加载归档失败');
    const rows = await resp.json();
    localStorage.setItem(ARCHIVE_KEY, JSON.stringify(rows));
    return rows;
  } catch {
    return loadArchivesListLocal();
  }
}

async function saveArchiveEntry(a) {
  try {
    const resp = await fetch(`${API_BASE_URL}/api/archive`, {
      method: 'POST',
      headers: getApiHeaders(),
      body: JSON.stringify(a),
    });
    if (!resp.ok) throw new Error('保存归档失败');
    await loadArchivesList();
  } catch {
    saveArchiveEntryLocal(a);
  }
}


// ╔══════════════════════════════════════════════════╗
// ║               8. 主应用 (UI + 交互)              ║
// ╚══════════════════════════════════════════════════╝

let currentParsed = null;
let currentReport = null;
let currentAiResult = '';

const $ = id => document.getElementById(id);

document.addEventListener('DOMContentLoaded', () => {
  ensureSessionId();
  bindEvents();
  refreshQuotaHint();
  renderGanZhiCalendar();
});

function bindEvents() {
  const on = (id, event, fn) => {
    const el = $(id);
    if (el) el.addEventListener(event, fn);
  };

  on('btn-parse', 'click', handleParse);
  on('btn-clear', 'click', () => { $('gua-input').value = ''; hideResults(); });

  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  on('btn-ai-analyze', 'click', handleAiAnalyze);
  on('btn-archive', 'click', handleArchive);

  on('btn-history', 'click', () => { renderHistory(); toggleModal('modal-history', true); });
  on('btn-close-history', 'click', () => toggleModal('modal-history', false));
  on('btn-clear-history', 'click', () => { if (confirm('确定清空所有归档记录？')) { clearAllArchives(); renderHistory(); } });
  on('btn-export-history', 'click', exportAllArchives);

  document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', e => { if (e.target === modal) toggleModal(modal.id, false); });
  });

}

function handleParse() {
  const text = $('gua-input').value.trim();
  if (!text) { alert('请粘贴卦盘文本'); return; }

  currentParsed = parseGuaText(text);
  if (!currentParsed) { alert('解析失败：无法识别卦盘格式'); return; }

  const validation = validateParsed(currentParsed);
  if (!validation.valid) {
    if (!confirm(`解析警告：\n${validation.errors.join('\n')}\n\n是否继续？`)) return;
  }

  currentReport = runEngine(currentParsed);
  currentAiResult = '';

  renderGuaPanel();
  renderBasicInfo();
  renderYingQi();
  showResults();
  switchTab('basic');
}

function renderGuaPanel() {
  const p = currentParsed, r = currentReport;
  const binary6 = parsedToBinary(p);

  // 获取上下卦信息
  const benUL = getUpperLower(binary6);
  const benUpperWX = BA_GUA_DATA[benUL.upper]?.wuxing || '';
  const benLowerWX = BA_GUA_DATA[benUL.lower]?.wuxing || '';

  // 变卦二进制
  let bianBinary6 = null, bianUL = null, bianUpperWX = '', bianLowerWX = '';
  if (p.bianGua.name) {
    bianBinary6 = p.yaos.map(y => {
      if (y.isDong && y.bianYinYang) return y.bianYinYang === 'yang' ? 1 : 0;
      return y.benYinYang === 'yang' ? 1 : 0;
    });
    bianUL = getUpperLower(bianBinary6);
    bianUpperWX = BA_GUA_DATA[bianUL.upper]?.wuxing || '';
    bianLowerWX = BA_GUA_DATA[bianUL.lower]?.wuxing || '';
  }

  // 互错综卦
  const huGua = calcHuGua(binary6);
  const cuoGua = calcCuoGua(binary6);
  const zongGua = calcZongGua(binary6);

  let html = '<div class="gua-panel">';

  // ═══ 四柱行（大字彩色）═══
  const gz = p.ganZhi;
  html += '<div class="sizhu-row">';
  for (const [pillar, suffix] of [['year','年'],['month','月'],['day','日'],['hour','时']]) {
    const g = gz[pillar]?.gan || '';
    const z = gz[pillar]?.zhi || '';
    const wx = TG_WUXING[g] || '';
    html += `<span class="sizhu-pillar"><span class="${wxColorClass(wx)}">${g}</span><span class="${wxColorClass(DZ_WUXING[z]||'')}">${z}</span><span class="sizhu-suffix">${suffix}</span></span>`;
  }
  html += '</div>';

  // ═══ 空亡行 ═══
  html += '<div class="kongwang-row">';
  const kwLabels = [['year','年空'],['month','月空'],['day','日空'],['hour','时空']];
  for (const [key, label] of kwLabels) {
    const kw = p.kongWang[key === 'day' ? 'ri' : key === 'month' ? 'yue' : key === 'hour' ? 'shi' : 'nian'] || p.kongWang[key] || [];
    if (kw && kw.length) {
      html += `<span class="kw-item">${label}:<span class="${key==='day'?'kw-highlight':''}">${kw.join('')}</span></span>`;
    }
  }
  html += '</div>';

  // ═══ 占问行 ═══
  if (p.question) {
    html += `<div class="gua-question"><span class="q-label">占问：</span>${p.question}</div>`;
  }

  // ═══ 卦名行 ═══
  html += '<div class="gua-title-row">';
  html += `<div class="gua-name-block"><span class="gua-name">${p.benGua.name}</span><span class="gua-name-sub ${wxColorClass(benUpperWX)}">${p.benGua.gong}宫·${p.benGua.gongOrder}${p.benGua.type ? ' ('+p.benGua.type+')' : ''}</span></div>`;
  if (p.bianGua.name) {
    html += '<span class="gua-arrow">⟶</span>';
    html += `<div class="gua-name-block"><span class="gua-name">${p.bianGua.name}</span><span class="gua-name-sub ${wxColorClass(bianUpperWX)}">${p.bianGua.gong}宫·${p.bianGua.gongOrder}${p.bianGua.type ? ' ('+p.bianGua.type+')' : ''}</span></div>`;
  }
  html += '</div>';

  // ═══ 六爻表格 ═══
  html += '<div class="gua-table-wrap"><table class="gua-table"><thead><tr>';
  html += '<th>六神</th><th colspan="2">本卦</th><th>爻象</th><th></th><th></th>';
  if (p.bianGua.name) {
    html += '<th class="col-divider"></th>';
    html += '<th colspan="2">变卦</th><th>爻象</th>';
  }
  html += '</tr></thead><tbody>';

  for (let i = 5; i >= 0; i--) {
    const yao = p.yaos[i]; if (!yao) continue;
    const shenClass = LIU_SHEN_CSS[yao.liuShen] || LIU_SHEN_CSS[yao.liuShenShort] || '';
    const benWXColor = yaoColorClass(yao.benWuxing);
    const bianWXColor = yao.bianWuxing ? yaoColorClass(yao.bianWuxing) : benWXColor;

    const statusClasses = [];
    if (yao.status.kongWang) statusClasses.push('status-kong');
    if (yao.status.yuePo) statusClasses.push('status-po');
    if (yao.status.jinShen) statusClasses.push('status-jin');
    if (yao.status.tuiShen) statusClasses.push('status-tui');

    html += `<tr class="${yao.isDong ? 'dong-yao' : ''}">`;

    // 六神（全名）
    html += `<td class="col-shen ${shenClass}">${yao.liuShen}</td>`;

    // 本卦六亲
    html += `<td class="col-liuqin-label ${statusClasses.join(' ')}">${yao.benLiuQin === '兄' ? '兄弟' : yao.benLiuQin === '孙' ? '子孙' : yao.benLiuQin === '财' ? '妻财' : yao.benLiuQin === '官' ? '官鬼' : yao.benLiuQin === '父' ? '父母' : yao.benLiuQin}</td>`;

    // 本卦地支（带五行颜色、大字）
    html += `<td class="col-dizhi ${wxColorClass(yao.benWuxing)}">${yao.benDizhi}</td>`;

    // 本卦爻象（带五行颜色）
    html += '<td class="col-yao">';
    if (yao.benYinYang === 'yang') {
      html += `<div class="yao-symbol"><div class="yao-yang ${benWXColor}"></div></div>`;
    } else {
      html += `<div class="yao-symbol"><div class="yao-yin"><div class="yao-yin-half ${benWXColor}"></div><div class="yao-yin-half ${benWXColor}"></div></div></div>`;
    }
    html += '</td>';

    // 世应+动爻（合并一列）
    html += '<td class="col-shiying">';
    if (yao.isShi) html += '<span class="shi-mark">世</span>';
    if (yao.isYing) html += '<span class="ying-mark">应</span>';
    html += '</td>';

    // 动爻标记
    html += `<td class="col-dong">${yao.isDong ? `<span class="dong-mark">${yao.dongType}</span>` : ''}</td>`;

    // 变卦部分
    if (p.bianGua.name) {
      html += '<td class="col-divider"></td>';

      // 变卦六亲
      const bLQ = yao.bianLiuQin || '';
      const bLQFull = bLQ === '兄' ? '兄弟' : bLQ === '孙' ? '子孙' : bLQ === '财' ? '妻财' : bLQ === '官' ? '官鬼' : bLQ === '父' ? '父母' : bLQ;
      html += `<td class="col-liuqin-label">${bLQFull}</td>`;

      // 变卦地支
      const bWXC = yao.bianWuxing ? wxColorClass(yao.bianWuxing) : '';
      html += `<td class="col-dizhi ${bWXC}">${yao.bianDizhi || ''}</td>`;

      // 变卦爻象
      html += '<td class="col-yao">';
      if (yao.bianDizhi) {
        const bYY = yao.isDong ? yao.bianYinYang : yao.benYinYang;
        if (bYY === 'yang') {
          html += `<div class="yao-symbol"><div class="yao-yang ${bianWXColor}"></div></div>`;
        } else {
          html += `<div class="yao-symbol"><div class="yao-yin"><div class="yao-yin-half ${bianWXColor}"></div><div class="yao-yin-half ${bianWXColor}"></div></div></div>`;
        }
      }
      html += '</td>';
    }
    html += '</tr>';
  }
  html += '</tbody></table></div>';

  // ═══ 底部信息栏 ═══
  html += '<div class="gua-footer">';
  html += `<span><span class="label">日空：</span>${p.kongWang.ri.join('')}</span>`;
  html += `<span><span class="label">月建：</span>${r.basic.yueJian}</span>`;
  html += `<span><span class="label">日辰：</span>${r.basic.riChen}</span>`;
  html += '</div>';

  // ═══ 底部5卦卡片 ═══
  html += '<div class="side-gua-section">';
  html += renderSideGuaCard('本卦', { name: p.benGua.name }, binary6);
  html += renderSideGuaCard('互卦', huGua, binary6.slice(1,4).concat(binary6.slice(2,5)));
  if (p.bianGua.name && bianBinary6) {
    html += renderSideGuaCard('变卦', { name: p.bianGua.name }, bianBinary6);
  }
  html += renderSideGuaCard('错卦', cuoGua, binary6.map(b => b ? 0 : 1));
  html += renderSideGuaCard('综卦', zongGua, [...binary6].reverse());
  html += '</div>';

  html += '</div>';
  $('gua-panel').innerHTML = html;
}

function renderSideGuaCard(label, guaData, binary6) {
  const ul = getUpperLower(binary6);
  const upperWX = BA_GUA_DATA[ul.upper]?.wuxing || '';
  const lowerWX = BA_GUA_DATA[ul.lower]?.wuxing || '';
  const mainWX = upperWX;

  let html = `<div class="side-gua-card ${wxBgClass(mainWX)}">`;
  html += `<div class="sgc-label">${label}</div>`;

  // 小卦象图（从上到下：六爻→初爻）
  html += '<div class="mini-gua-icon">';
  for (let i = 5; i >= 0; i--) {
    const wx = i >= 3 ? upperWX : lowerWX;
    const color = yaoColorClass(wx);
    if (binary6[i]) {
      html += `<div class="mini-yao mini-yao-yang ${color}"></div>`;
    } else {
      html += `<div class="mini-yao-yin"><div class="mini-yao-yin-half ${color}"></div><div class="mini-yao-yin-half ${color}"></div></div>`;
    }
  }
  html += '</div>';

  html += `<div class="sgc-name ${wxColorClass(mainWX)}">${guaData.name}</div>`;
  html += `<div class="sgc-detail">${ul.upper}${BA_GUA_DATA[ul.upper]?.nature||''} / ${ul.lower}${BA_GUA_DATA[ul.lower]?.nature||''}</div>`;
  html += '</div>';
  return html;
}

// ═══ 生合刑克冲分析 ═══

function renderShengHeXingKeChong(p, r) {
  let html = '';
  const findings = { liuHe:[], sanHe:[], banHe:[], liuChong:[], sanXing:[], xiangXing:[], xiangHai:[], xiangPo:[], shengKe:[] };

  // 收集所有地支来源：爻、日辰、月建
  const allDZ = [];
  for (const yao of p.yaos) {
    allDZ.push({ dz: yao.benDizhi, label: `${yao.position}爻${yao.benLiuQin}${yao.benDizhi}`, wx: yao.benWuxing, type:'yao', pos: yao.position });
  }
  const riZhi = p.ganZhi.day?.zhi;
  const yueZhi = p.ganZhi.month?.zhi;
  if (riZhi) allDZ.push({ dz: riZhi, label: `日辰${riZhi}`, wx: DZ_WUXING[riZhi], type:'ri' });
  if (yueZhi) allDZ.push({ dz: yueZhi, label: `月建${yueZhi}`, wx: DZ_WUXING[yueZhi], type:'yue' });

  // 动爻变爻也参与
  for (const yao of p.yaos) {
    if (yao.isDong && yao.bianDizhi) {
      allDZ.push({ dz: yao.bianDizhi, label: `${yao.position}爻变${yao.bianLiuQin}${yao.bianDizhi}`, wx: yao.bianWuxing, type:'bian', pos: yao.position });
    }
  }

  const dzSet = allDZ.map(x => x.dz);

  // 1. 六合检测（爻与爻、爻与日月之间）
  const heChecked = new Set();
  for (let i = 0; i < allDZ.length; i++) {
    for (let j = i + 1; j < allDZ.length; j++) {
      const a = allDZ[i], b = allDZ[j];
      const key = [a.label, b.label].sort().join('|');
      if (heChecked.has(key)) continue;
      if (isLiuHe(a.dz, b.dz)) {
        heChecked.add(key);
        findings.liuHe.push(`${a.label} 与 ${b.label} 六合（${a.dz}${b.dz}合）`);
      }
    }
  }

  // 2. 三合局检测
  for (const ju of SAN_HE_JU) {
    const matched = [];
    for (const m of ju.members) {
      const found = allDZ.filter(x => x.dz === m);
      if (found.length > 0) matched.push(...found);
    }
    const uniqueMembers = new Set(matched.map(x => x.dz));
    if (uniqueMembers.size === 3) {
      const labels = ju.members.map(m => {
        const f = allDZ.find(x => x.dz === m);
        return f ? f.label : m;
      });
      findings.sanHe.push(`${labels.join('、')} 构成 ${ju.name}`);
    }
  }

  // 3. 半合局检测
  for (const ju of BAN_HE_JU) {
    const matched = [];
    for (const m of ju.members) {
      const found = allDZ.find(x => x.dz === m);
      if (found) matched.push(found);
    }
    if (matched.length === 2) {
      // 排除已成三合的情况
      const parentSanHe = SAN_HE_JU.find(sh => sh.result === ju.result);
      if (parentSanHe) {
        const allPresent = parentSanHe.members.every(m => dzSet.includes(m));
        if (allPresent) continue; // 已成三合，不再报半合
      }
      findings.banHe.push(`${matched.map(x=>x.label).join('、')} 构成 ${ju.name}`);
    }
  }

  // 4. 六冲检测
  const chongChecked = new Set();
  for (let i = 0; i < allDZ.length; i++) {
    for (let j = i + 1; j < allDZ.length; j++) {
      const a = allDZ[i], b = allDZ[j];
      const key = [a.label, b.label].sort().join('|');
      if (chongChecked.has(key)) continue;
      if (isLiuChong(a.dz, b.dz)) {
        chongChecked.add(key);
        findings.liuChong.push(`${a.label} 与 ${b.label} 六冲（${a.dz}${b.dz}冲）`);
      }
    }
  }

  // 5. 三刑检测
  for (const group of SAN_XING_GROUPS) {
    const matched = [];
    for (const m of group.members) {
      const found = allDZ.find(x => x.dz === m);
      if (found) matched.push(found);
    }
    if (matched.length === 3) {
      findings.sanXing.push(`${matched.map(x=>x.label).join('、')} 构成 ${group.name}`);
    }
  }

  // 相刑（两两）
  const xingChecked = new Set();
  for (let i = 0; i < allDZ.length; i++) {
    for (let j = i + 1; j < allDZ.length; j++) {
      const a = allDZ[i], b = allDZ[j];
      const key = [a.label, b.label].sort().join('|');
      if (xingChecked.has(key)) continue;
      if (XIANG_XING_MAP[a.dz] === b.dz) {
        xingChecked.add(key);
        // 自刑
        if (a.dz === b.dz) {
          findings.xiangXing.push(`${a.label} 与 ${b.label} 自刑（${a.dz}${b.dz}自刑）`);
        } else if ((a.dz==='子'&&b.dz==='卯')||(a.dz==='卯'&&b.dz==='子')) {
          findings.xiangXing.push(`${a.label} 与 ${b.label} 相刑（${a.dz}${b.dz}无礼之刑）`);
        } else {
          findings.xiangXing.push(`${a.label} 与 ${b.label} 相刑（${a.dz}${b.dz}刑）`);
        }
      }
    }
  }

  // 6. 相害检测
  const haiChecked = new Set();
  for (let i = 0; i < allDZ.length; i++) {
    for (let j = i + 1; j < allDZ.length; j++) {
      const a = allDZ[i], b = allDZ[j];
      const key = [a.label, b.label].sort().join('|');
      if (haiChecked.has(key)) continue;
      if (XIANG_HAI_MAP[a.dz] === b.dz) {
        haiChecked.add(key);
        findings.xiangHai.push(`${a.label} 与 ${b.label} 相害（${a.dz}${b.dz}害）`);
      }
    }
  }

  // 7. 相破检测
  const poChecked = new Set();
  for (let i = 0; i < allDZ.length; i++) {
    for (let j = i + 1; j < allDZ.length; j++) {
      const a = allDZ[i], b = allDZ[j];
      const key = [a.label, b.label].sort().join('|');
      if (poChecked.has(key)) continue;
      if (isPo(a.dz, b.dz)) {
        poChecked.add(key);
        findings.xiangPo.push(`${a.label} 与 ${b.label} 相破（${a.dz}${b.dz}破）`);
      }
    }
  }

  // 8. 爻间生克关系（仅爻与爻之间，重点关注动爻对静爻的生克）
  for (const yao of p.yaos) {
    if (!yao.isDong) continue;
    for (const target of p.yaos) {
      if (target.position === yao.position) continue;
      if (!yao.benWuxing || !target.benWuxing) continue;
      if (isSheng(yao.benWuxing, target.benWuxing)) {
        findings.shengKe.push(`${yao.position}爻${yao.benLiuQin}${yao.benDizhi}(动) 生 ${target.position}爻${target.benLiuQin}${target.benDizhi}`);
      }
      if (isKe(yao.benWuxing, target.benWuxing)) {
        findings.shengKe.push(`${yao.position}爻${yao.benLiuQin}${yao.benDizhi}(动) 克 ${target.position}爻${target.benLiuQin}${target.benDizhi}`);
      }
    }
  }

  // 渲染
  const sections = [
    { title:'六合', items:findings.liuHe, impact:'positive' },
    { title:'三合局', items:findings.sanHe, impact:'positive' },
    { title:'半合局', items:findings.banHe, impact:'neutral' },
    { title:'六冲', items:findings.liuChong, impact:'negative' },
    { title:'三刑', items:findings.sanXing, impact:'negative' },
    { title:'相刑', items:findings.xiangXing, impact:'negative' },
    { title:'相害', items:findings.xiangHai, impact:'warning' },
    { title:'相破', items:findings.xiangPo, impact:'warning' },
    { title:'动爻生克', items:findings.shengKe, impact:'neutral' },
  ];

  let hasContent = false;
  for (const sec of sections) {
    if (!sec.items.length) continue;
    hasContent = true;
    const dc = sec.impact==='positive'?'dot-positive':sec.impact==='negative'?'dot-negative':sec.impact==='warning'?'dot-warning':'dot-neutral';
    html += `<div class="rule-block"><div class="rule-block-header">${sec.title} <span class="toggle">${sec.items.length}条</span></div><div class="rule-block-body">`;
    for (const item of sec.items) {
      html += `<div class="rule-item"><span class="dot ${dc}"></span><span>${item}</span></div>`;
    }
    html += '</div></div>';
  }

  if (!hasContent) {
    html += '<div class="rule-block"><div class="rule-block-header">生合刑克冲分析</div><div class="rule-block-body"><p class="empty-hint">无特殊生合刑克冲关系</p></div></div>';
  }

  return html;
}

function renderBasicInfo() {
  const r = currentReport, p = currentParsed;
  let html = '';

  // 逐爻状态一览
  html += '<div class="rule-block"><div class="rule-block-header">逐爻状态一览</div><div class="rule-block-body">';
  for (const yd of r.yaoDetails) {
    const tags = yd.statuses.map(s => {
      let cls = 'tag-gray';
      if (['日生','月生/旺','进神','回头生','日合','月合'].includes(s)) cls = 'tag-green';
      if (['日克','月克','月破','日破','化绝','化墓','化空','回头克','退神','化冲','日冲'].includes(s)) cls = 'tag-red';
      if (s==='日空') cls = 'tag-yellow';
      return `<span class="tag ${cls}">${s}</span>`;
    }).join('');

    let line = `<strong>${yd.posLabel}</strong>：${yd.liuShen} ${yd.benLiuQin}${yd.benDizhi}${yd.benWuxing}`;
    if (yd.isShi) line += ' <span class="tag tag-blue">世</span>';
    if (yd.isYing) line += ' <span class="tag tag-blue">应</span>';
    if (yd.isDong) line += ` → ${yd.bianLiuQin}${yd.bianDizhi}${yd.bianWuxing}`;
    if (yd.wangShuai) line += ` <span class="tag tag-gray">${yd.wangShuai}</span>`;
    if (tags) line += ' ' + tags;
    html += `<div class="rule-item"><span class="dot ${yd.isDong?'dot-warning':'dot-neutral'}"></span><span>${line}</span></div>`;
  }
  html += '</div></div>';

  // 生合刑克冲分析
  html += renderShengHeXingKeChong(p, r);

  $('tab-basic').innerHTML = html;
}

function renderRulesAnalysis() {
  const r = currentReport;
  let html = '';
  const sections = [
    {title:'空亡分析',items:r.kongWang}, {title:'月建影响',items:r.yueJian},
    {title:'日辰影响',items:r.riChen}, {title:'动变分析',items:r.dongBian},
    {title:'特殊格局',items:r.special},
  ];
  for (const sec of sections) {
    if (!sec.items.length) continue;
    html += `<div class="rule-block"><div class="rule-block-header">${sec.title} <span class="toggle">${sec.items.length}条</span></div><div class="rule-block-body">`;
    for (const f of sec.items) {
      const dc = f.impact==='positive'?'dot-positive':f.impact==='negative'?'dot-negative':f.impact==='warning'?'dot-warning':'dot-neutral';
      html += `<div class="rule-item"><span class="dot ${dc}"></span><span>${f.text}</span></div>`;
    }
    html += '</div></div>';
  }
  if (!html) html = '<p class="empty-hint">无特殊规则触发</p>';
  $('tab-rules').innerHTML = html;
}

function renderYingQi() {
  // 应期现在依赖AI分析结果
  if (!currentAiResult || !currentAiResult.trim()) {
    $('tab-yingqi').innerHTML = `
      <div class="yingqi-section">
        <div class="yingqi-title">应期推断</div>
        <div class="yingqi-waiting">
          <p style="color:var(--text-muted);margin-bottom:12px;">应期推断需要先完成 AI 研判分析。</p>
          <button class="btn btn-primary btn-sm" id="btn-go-ai">前往 AI 研判</button>
        </div>
      </div>`;
    const goBtn = document.getElementById('btn-go-ai');
    if (goBtn) {
      goBtn.addEventListener('click', () => switchTab('ai'));
    }
    return;
  }

  // 从AI结果中提取应期相关信息
  const aiText = currentAiResult;
  let html = '<div class="yingqi-section"><div class="yingqi-title">应期推断</div>';

  // 提取AI输出中的应期章节
  const yingqiContent = extractYingQiFromAI(aiText);

  if (yingqiContent) {
    html += `<div class="yingqi-ai-result">${simpleMarkdown(yingqiContent)}</div>`;
  }

  // 补充规则引擎的应期线索
  html += '<div class="yingqi-subtitle">规则引擎辅助线索</div>';
  const p = currentParsed;
  const clues = [];

  for (const yao of p.yaos) {
    if (yao.status.kongWang)
      clues.push({text:`${yao.benLiuQin}${yao.benDizhi} 空亡 → 待出空（过旬）或冲空（${yao.benDizhi}日/月）时应`,condition:'空亡出空'});
  }
  for (const yao of p.yaos) {
    if (!yao.isDong) continue;
    if (yao.status.jinShen) clues.push({text:`${yao.benLiuQin}${yao.benDizhi} 化进神 → 近应，${yao.bianDizhi}日/月应`,condition:'进神近应'});
    if (yao.status.tuiShen) clues.push({text:`${yao.benLiuQin}${yao.benDizhi} 化退神 → 远应或不应`,condition:'退神远应'});
    if (yao.status.huaJue||yao.status.huaMu) clues.push({text:`${yao.benLiuQin}${yao.benDizhi} 化${yao.status.huaJue?'绝':'墓'} → 待生旺之时应`,condition:'化绝/墓待旺'});
  }
  for (const yao of p.yaos) {
    if (yao.status.riHe||yao.status.yueHe) clues.push({text:`${yao.benLiuQin}${yao.benDizhi} 被合 → 待冲开时应`,condition:'逢合待冲'});
  }

  if (clues.length) {
    for (const c of clues) {
      html += `<div class="yingqi-item">${c.text}${c.condition?`<div class="yingqi-condition">${c.condition}</div>`:''}</div>`;
    }
  } else {
    html += '<div class="yingqi-item" style="color:var(--text-muted);">规则引擎未发现明确应期线索</div>';
  }

  html += '</div>';
  $('tab-yingqi').innerHTML = html;
}

function extractYingQiFromAI(aiText) {
  // 尝试提取AI输出中"应期"相关章节
  const patterns = [
    /#{1,3}\s*(?:五[、.]?\s*)?应期([\s\S]*?)(?=#{1,3}\s|$)/i,
    /#{1,3}\s*应期推断([\s\S]*?)(?=#{1,3}\s|$)/i,
    /#{1,3}\s*(?:\d+[、.]\s*)?应期([\s\S]*?)(?=#{1,3}\s|$)/i,
    /应期[：:]([\s\S]*?)(?=#{1,3}\s|$)/i,
  ];

  for (const pat of patterns) {
    const match = aiText.match(pat);
    if (match && match[1] && match[1].trim().length > 10) {
      return match[1].trim();
    }
  }

  // 如果找不到独立章节，搜索包含"应期"的段落
  const lines = aiText.split('\n');
  const yingqiLines = [];
  let capturing = false;
  for (const line of lines) {
    if (line.includes('应期')) {
      capturing = true;
      yingqiLines.push(line);
    } else if (capturing) {
      if (line.trim() === '' || /^#{1,3}\s/.test(line)) {
        if (yingqiLines.length > 0) break;
      } else {
        yingqiLines.push(line);
      }
    }
  }

  if (yingqiLines.length > 0) {
    return yingqiLines.join('\n');
  }

  return null;
}

async function handleAiAnalyze() {
  if (!currentReport || !currentParsed) { alert('请先解析卦盘'); return; }

  // 检测 file:// 协议
  if (location.protocol === 'file:') {
    const msg = '当前通过 file:// 打开页面，浏览器会阻止 API 请求（CORS）。\n\n'
      + '请用以下方式之一打开：\n'
      + '1. 在项目目录运行: npx serve\n'
      + '2. 在项目目录运行: python -m http.server 8080\n'
      + '3. 使用 VSCode Live Server 扩展\n\n'
      + '然后通过 http://localhost:端口 访问。\n\n是否仍要尝试？';
    if (!confirm(msg)) return;
  }

  const outputEl = $('ai-output');
  outputEl.innerHTML = '<div class="loading-text">AI 分析中，请稍候...</div>';
  currentAiResult = '';
  $('btn-ai-analyze').disabled = true;

  try {
    await streamAIAnalyze(currentReport.summary, currentParsed.rawText,
      chunk => { currentAiResult += chunk; outputEl.textContent = currentAiResult; },
      () => {
        $('btn-ai-analyze').disabled = false;
        refreshQuotaHint();
        if (currentAiResult.trim()) {
          outputEl.innerHTML = simpleMarkdown(currentAiResult);
          // AI分析完成后刷新应期页面
          renderYingQi();
        } else {
          outputEl.innerHTML = '<div style="color:var(--warning);">AI 返回了空内容，请稍后再试。</div>';
        }
      },
      err => {
        console.error('[AI] 错误回调:', err);
        outputEl.innerHTML = `<div style="color:var(--danger);white-space:pre-wrap;">错误：${err}</div>`;
        $('btn-ai-analyze').disabled = false;
      }
    );
  } catch (e) {
    outputEl.innerHTML = `<div style="color:var(--danger);">请求异常：${e.message}<br><br>如果你是通过 file:// 打开本页面，请改用本地服务器（见上方提示）。</div>`;
    $('btn-ai-analyze').disabled = false;
  }
}

async function handleArchive() {
  if (!currentParsed || !currentReport) return;
  const conclusion = prompt('请输入简要结论（可留空）：','');
  const archive = createArchiveEntry(currentParsed, currentReport, currentAiResult);
  archive.conclusion = conclusion || '';
  await saveArchiveEntry(archive);
  alert('已归档！');
}

async function renderHistory() {
  const list = await loadArchivesList();
  const el = $('history-list');
  if (!list.length) { el.innerHTML = '<p class="empty-hint">暂无归档记录</p>'; return; }
  let html = '';
  for (const a of list) {
    html += `<div class="history-item" data-id="${a.id}">`;
    html += `<div class="hi-header"><span class="hi-gua">${a.benGua}${a.bianGua!=='无'?' → '+a.bianGua:''}</span><span class="hi-date">${a.archiveDate}</span></div>`;
    html += `<div class="hi-question">${a.question||'无占问'}</div>`;
    if (a.conclusion) html += `<div class="hi-conclusion">${a.conclusion}</div>`;
    html += `<div style="margin-top:6px;font-size:12px;color:var(--text-muted)">${a.ganZhi} | 空亡:${a.kongWang} | ${a.guaType}</div>`;
    html += '</div>';
  }
  el.innerHTML = html;
  el.querySelectorAll('.history-item').forEach(item => {
    item.addEventListener('click', () => {
      const a = list.find(x => x.id === item.dataset.id);
      if (a?.rawText) { $('gua-input').value = a.rawText; toggleModal('modal-history',false); handleParse(); }
    });
  });
}

function switchTab(tabName) {
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.tab===tabName));
  document.querySelectorAll('.tab-panel').forEach(panel => panel.classList.toggle('active', panel.id===`tab-${tabName}`));
}

function toggleModal(id, show) { $(id).classList.toggle('hidden', !show); }
function showResults() { $('gua-display').classList.remove('hidden'); $('report-section').classList.remove('hidden'); $('archive-section').classList.remove('hidden'); }
function hideResults() { $('gua-display').classList.add('hidden'); $('report-section').classList.add('hidden'); $('archive-section').classList.add('hidden'); currentParsed=null; currentReport=null; currentAiResult=''; }

function simpleMarkdown(text) {
  if (!text) return '';
  return text
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/^### (.+)$/gm,'<h3>$1</h3>')
    .replace(/^## (.+)$/gm,'<h2>$1</h2>')
    .replace(/^# (.+)$/gm,'<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>')
    .replace(/\*(.+?)\*/g,'<em>$1</em>')
    .replace(/^- (.+)$/gm,'<li>$1</li>')
    .replace(/\n\n/g,'</p><p>')
    .replace(/\n/g,'<br>')
    .replace(/^/,'<p>').replace(/$/,'</p>');
}

// ╔══════════════════════════════════════════════════╗
// ║               9. 干支日历                         ║
// ╚══════════════════════════════════════════════════╝

// 基准日：1900年1月1日 = 甲戌日
const GZ_BASE_DATE = new Date(1900, 0, 1);
const GZ_BASE_TIANGAN_INDEX = 0;  // 甲
const GZ_BASE_DIZHI_INDEX = 10;   // 戌

function calcDayGanZhi(date) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const base = new Date(1900, 0, 1);
  const diffDays = Math.round((d - base) / 86400000);
  const tgIdx = ((GZ_BASE_TIANGAN_INDEX + diffDays) % 10 + 10) % 10;
  const dzIdx = ((GZ_BASE_DIZHI_INDEX + diffDays) % 12 + 12) % 12;
  return { gan: TIAN_GAN[tgIdx], zhi: DI_ZHI[dzIdx] };
}

function calcMonthGanZhi(year, month) {
  // 月干支以节气为界，此处简化用公历月近似
  // 月支固定：正月寅、二月卯...
  // 月干 = (年干序号 * 2 + 月份) % 10
  // 这里 month 为公历月1-12，近似对应农历月
  const yearGZForMonth = calcYearGanZhiForMonth(year, month);
  const yearGanIdx = TIAN_GAN.indexOf(yearGZForMonth.gan);
  // 月支：从寅(2)开始，正月=1 → 寅(idx=2)
  const monthDzIdx = (month + 1) % 12;  // month=1→2(寅), month=2→3(卯)...
  // 月干：年上起月 甲己之年丙作首
  const base = [2, 4, 6, 8, 0]; // 甲/己→丙(2), 乙/庚→戊(4)...
  const monthTgIdx = (base[yearGanIdx % 5] + month - 1) % 10;
  return { gan: TIAN_GAN[monthTgIdx], zhi: DI_ZHI[monthDzIdx] };
}

function calcYearGanZhiForMonth(year, month) {
  // 立春前算上一年
  const effectiveYear = month <= 1 ? year - 1 : year;  // 简化：2月后算当年
  const tgIdx = ((effectiveYear - 4) % 10 + 10) % 10;
  const dzIdx = ((effectiveYear - 4) % 12 + 12) % 12;
  return { gan: TIAN_GAN[tgIdx], zhi: DI_ZHI[dzIdx] };
}

// 计算旬空
function calcXunKong(gan, zhi) {
  const tgIdx = TIAN_GAN.indexOf(gan);
  const dzIdx = DI_ZHI.indexOf(zhi);
  // 旬首地支 index = (dzIdx - tgIdx + 12) % 12 → 对应空亡为 index+10, index+11
  const kongIdx1 = (dzIdx - tgIdx + 10 + 12) % 12;
  const kongIdx2 = (kongIdx1 + 1) % 12;
  return [DI_ZHI[kongIdx1], DI_ZHI[kongIdx2]];
}

let calendarDate = new Date();

function renderGanZhiCalendar(targetDate) {
  const container = $('ganzhi-calendar');
  if (!container) return;

  const now = targetDate || calendarDate;
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-indexed
  const today = new Date();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startWeekday = firstDay.getDay(); // 0=Sun
  const daysInMonth = lastDay.getDate();

  // 月干支
  const monthGZ = calcMonthGanZhi(year, month + 1);
  const yearGZ = calcYearGanZhiForMonth(year, month + 1);

  let html = '<div class="cal-header">';
  html += `<button id="cal-prev">◀</button>`;
  html += `<span class="cal-title">${year}年${month+1}月 · ${yearGZ.gan}${yearGZ.zhi}年 ${monthGZ.gan}${monthGZ.zhi}月</span>`;
  html += `<button id="cal-next">▶</button>`;
  html += '</div>';

  html += '<div class="cal-grid">';
  const weekdays = ['日','一','二','三','四','五','六'];
  for (const wd of weekdays) {
    html += `<div class="cal-weekday">${wd}</div>`;
  }

  // 空白填充
  for (let i = 0; i < startWeekday; i++) {
    html += '<div class="cal-day empty"></div>';
  }

  // 日期
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d);
    const gz = calcDayGanZhi(date);
    const dayOfWeek = date.getDay();
    const isToday = date.toDateString() === today.toDateString();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const wxColor = wxColorClass(TG_WUXING[gz.gan] || '');

    let cls = 'cal-day';
    if (isToday) cls += ' today';
    if (isWeekend) cls += ' weekend';

    // 旬空
    const kong = calcXunKong(gz.gan, gz.zhi);

    html += `<div class="${cls}" title="${gz.gan}${gz.zhi}日 空亡:${kong.join('')}">`;
    html += `<span class="cal-num">${d}</span>`;
    html += `<span class="cal-gz ${wxColor}">${gz.gan}${gz.zhi}</span>`;
    html += '</div>';
  }

  html += '</div>';
  container.innerHTML = html;

  // 绑定翻页
  $('cal-prev')?.addEventListener('click', () => {
    calendarDate = new Date(year, month - 1, 1);
    renderGanZhiCalendar(calendarDate);
  });
  $('cal-next')?.addEventListener('click', () => {
    calendarDate = new Date(year, month + 1, 1);
    renderGanZhiCalendar(calendarDate);
  });
}
