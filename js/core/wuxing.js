/**
 * 五行生克关系引擎
 */

// 五行相生：A 生 B
const SHENG = {
  'wood': 'fire', 'fire': 'earth', 'earth': 'metal', 'metal': 'water', 'water': 'wood',
};

// 五行相克：A 克 B
const KE = {
  'wood': 'earth', 'earth': 'water', 'water': 'fire', 'fire': 'metal', 'metal': 'wood',
};

/**
 * 判断两五行关系（以 a 为主体）
 * @returns 'same'|'sheng'(我生)|'ke'(我克)|'bei-sheng'(生我)|'bei-ke'(克我)
 */
export function wxRelation(a, b) {
  if (a === b)          return 'same';      // 比和
  if (SHENG[a] === b)   return 'sheng';     // 我生（泄）
  if (SHENG[b] === a)   return 'bei-sheng'; // 生我
  if (KE[a] === b)      return 'ke';        // 我克
  if (KE[b] === a)      return 'bei-ke';    // 克我
}

/**
 * 根据卦宫五行和爻五行判定六亲
 */
export function getLiuQin(gongWX, yaoWX) {
  const rel = wxRelation(gongWX, yaoWX);
  switch (rel) {
    case 'same':      return 'brother';   // 兄弟
    case 'sheng':     return 'offspring';  // 子孙（我生者）
    case 'ke':        return 'wealth';    // 妻财（我克者）
    case 'bei-sheng': return 'parent';    // 父母（生我者）
    case 'bei-ke':    return 'officer';   // 官鬼（克我者）
  }
}

/**
 * 判断 A 是否生 B
 */
export function isSheng(a, b) { return SHENG[a] === b; }

/**
 * 判断 A 是否克 B
 */
export function isKe(a, b) { return KE[a] === b; }

/**
 * 获取某五行的旺衰状态（根据月令地支五行）
 * @returns '旺'|'相'|'休'|'囚'|'死'
 */
export function wangShuai(yaoWX, yueWX) {
  if (yaoWX === yueWX)         return '旺';   // 同我者旺
  if (SHENG[yaoWX] === yueWX)  return '相';   // 我生者相（存疑，传统是"令生我"为相）
  // 传统：令生我→相，我生令→休，令克我→囚，我克令→死
  if (SHENG[yueWX] === yaoWX)  return '相';   // 令生我
  if (SHENG[yaoWX] === yueWX)  return '休';   // 我生令
  if (KE[yueWX] === yaoWX)     return '囚';   // 令克我
  if (KE[yaoWX] === yueWX)     return '死';   // 我克令
  return '休';
}
