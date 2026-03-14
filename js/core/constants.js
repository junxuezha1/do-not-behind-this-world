/**
 * 核心常量表 — 天干地支、五行、八卦、六亲、六神
 */

export const TIAN_GAN = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];
export const DI_ZHI = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];

// 地支五行
export const DZ_WUXING = {
  '子': 'water', '丑': 'earth', '寅': 'wood', '卯': 'wood',
  '辰': 'earth', '巳': 'fire',  '午': 'fire', '未': 'earth',
  '申': 'metal', '酉': 'metal', '戌': 'earth', '亥': 'water',
};

// 天干五行
export const TG_WUXING = {
  '甲': 'wood', '乙': 'wood', '丙': 'fire', '丁': 'fire',
  '戊': 'earth', '己': 'earth', '庚': 'metal', '辛': 'metal',
  '壬': 'water', '癸': 'water',
};

// 五行中文
export const WX_CN = {
  'wood': '木', 'fire': '火', 'earth': '土', 'metal': '金', 'water': '水',
};

// 地支六合
export const LIU_HE = {
  '子':'丑', '丑':'子', '寅':'亥', '亥':'寅',
  '卯':'戌', '戌':'卯', '辰':'酉', '酉':'辰',
  '巳':'申', '申':'巳', '午':'未', '未':'午',
};

// 地支六冲
export const LIU_CHONG = {
  '子':'午', '午':'子', '丑':'未', '未':'丑',
  '寅':'申', '申':'寅', '卯':'酉', '酉':'卯',
  '辰':'戌', '戌':'辰', '巳':'亥', '亥':'巳',
};

// 地支三合局（地支 → 所合五行）
export const SAN_HE = {
  '申': 'water', '子': 'water', '辰': 'water',  // 申子辰合水局
  '寅': 'fire',  '午': 'fire',  '戌': 'fire',   // 寅午戌合火局
  '巳': 'metal', '酉': 'metal', '丑': 'metal',  // 巳酉丑合金局
  '亥': 'wood',  '卯': 'wood',  '未': 'wood',   // 亥卯未合木局
};

// 地支相刑
export const XING = {
  '寅': '巳', '巳': '申', '申': '寅',  // 寅巳申三刑
  '丑': '戌', '戌': '未', '未': '丑',  // 丑戌未三刑
  '子': '卯', '卯': '子',              // 子卯相刑
  '辰': '辰', '午': '午', '酉': '酉', '亥': '亥', // 自刑
};

// 地支相害
export const HAI = {
  '子':'未', '未':'子', '丑':'午', '午':'丑',
  '寅':'巳', '巳':'寅', '卯':'辰', '辰':'卯',
  '申':'亥', '亥':'申', '酉':'戌', '戌':'酉',
};

// 地支相破
export const PO = {
  '子':'酉', '酉':'子', '丑':'辰', '辰':'丑',
  '寅':'亥', '亥':'寅', '卯':'午', '午':'卯',
  '巳':'申', '申':'巳', '未':'戌', '戌':'未',
};

// 六亲
export const LIU_QIN_CN = {
  'brother':  '兄',
  'offspring':'孙',
  'wealth':   '财',
  'officer':  '官',
  'parent':   '父',
};

export const LIU_QIN_FULL = {
  'brother':  '兄弟',
  'offspring':'子孙',
  'wealth':   '妻财',
  'officer':  '官鬼',
  'parent':   '父母',
};

// 六亲简称反查
export const LQ_SHORT_TO_KEY = {
  '兄': 'brother', '孙': 'offspring', '财': 'wealth',
  '官': 'officer', '父': 'parent',
};

// 六神
export const LIU_SHEN = ['青龙','朱雀','勾陈','螣蛇','白虎','玄武'];
export const LIU_SHEN_SHORT = ['龙','雀','勾','蛇','虎','玄'];
export const LIU_SHEN_CSS = {
  '青龙': 'shen-qinglong', '朱雀': 'shen-zhuque', '勾陈': 'shen-gouchen',
  '螣蛇': 'shen-tengshe',  '白虎': 'shen-baihu',  '玄武': 'shen-xuanwu',
  '龙': 'shen-qinglong', '雀': 'shen-zhuque', '勾': 'shen-gouchen',
  '蛇': 'shen-tengshe',  '虎': 'shen-baihu',  '玄': 'shen-xuanwu',
};

// 日天干 → 初爻六神索引
// 甲乙→青龙(0), 丙丁→朱雀(1), 戊→勾陈(2), 己→螣蛇(3), 庚辛→白虎(4), 壬癸→玄武(5)
export const TG_TO_SHEN_START = {
  '甲':0, '乙':0, '丙':1, '丁':1, '戊':2,
  '己':3, '庚':4, '辛':4, '壬':5, '癸':5,
};

// 八卦基础数据
export const BA_GUA = {
  '乾': { wuxing: 'metal',  binary: [1,1,1] },
  '兑': { wuxing: 'metal',  binary: [0,1,1] },
  '离': { wuxing: 'fire',   binary: [1,0,1] },
  '震': { wuxing: 'wood',   binary: [0,0,1] },
  '巽': { wuxing: 'wood',   binary: [1,1,0] },
  '坎': { wuxing: 'water',  binary: [0,1,0] },
  '艮': { wuxing: 'earth',  binary: [1,0,0] },
  '坤': { wuxing: 'earth',  binary: [0,0,0] },
};

// 进神地支对照表（地支进神顺序）
// 进神：同五行中阴进阳、阳进阴，顺序递进
export const JIN_SHEN_MAP = {
  '子':'丑', '丑':'寅', '寅':'卯', '卯':'辰', '辰':'巳', '巳':'午',
  '午':'未', '未':'申', '申':'酉', '酉':'戌', '戌':'亥', '亥':'子',
};

// 退神：反向
export const TUI_SHEN_MAP = {
  '丑':'子', '寅':'丑', '卯':'寅', '辰':'卯', '巳':'辰', '午':'巳',
  '未':'午', '申':'未', '酉':'申', '戌':'酉', '亥':'戌', '子':'亥',
};

// 十二长生（五行对应地支的长生位置）
export const CHANG_SHENG = {
  'wood':  ['亥','子','丑','寅','卯','辰','巳','午','未','申','酉','戌'],
  'fire':  ['寅','卯','辰','巳','午','未','申','酉','戌','亥','子','丑'],
  'metal': ['巳','午','未','申','酉','戌','亥','子','丑','寅','卯','辰'],
  'water': ['申','酉','戌','亥','子','丑','寅','卯','辰','巳','午','未'],
  'earth': ['寅','卯','辰','巳','午','未','申','酉','戌','亥','子','丑'], // 同火
};

// 长生十二宫名称
export const CS_STAGES = ['长生','沐浴','冠带','临官','帝旺','衰','病','死','墓','绝','胎','养'];
