/**
 * 天干地支运算 — 合冲刑害破、旬空计算
 */
import { TIAN_GAN, DI_ZHI, LIU_HE, LIU_CHONG, PO, DZ_WUXING } from './constants.js';

/**
 * 获取天干索引
 */
export function tgIndex(g) { return TIAN_GAN.indexOf(g); }

/**
 * 获取地支索引
 */
export function dzIndex(z) { return DI_ZHI.indexOf(z); }

/**
 * 计算日柱旬空（空亡两个地支）
 * @param {string} dayGan - 日天干
 * @param {string} dayZhi - 日地支
 * @returns {string[]} - 两个空亡地支
 */
export function calcXunKong(dayGan, dayZhi) {
  const gi = tgIndex(dayGan);
  const zi = dzIndex(dayZhi);
  // 旬首地支索引 = (地支索引 - 天干索引 + 12) % 12
  const xunStart = (zi - gi + 12) % 12;
  // 空亡 = 旬内最后两个地支
  const k1 = (xunStart + 10) % 12;
  const k2 = (xunStart + 11) % 12;
  return [DI_ZHI[k1], DI_ZHI[k2]];
}

/**
 * 判断两地支是否六合
 */
export function isLiuHe(a, b) { return LIU_HE[a] === b; }

/**
 * 判断两地支是否六冲
 */
export function isLiuChong(a, b) { return LIU_CHONG[a] === b; }

/**
 * 判断地支是否被另一地支所破
 */
export function isPo(a, b) { return PO[a] === b; }

/**
 * 判断地支是否在空亡列表中
 */
export function isKong(zhi, kongList) { return kongList.includes(zhi); }

/**
 * 获取地支五行
 */
export function getZhiWX(zhi) { return DZ_WUXING[zhi]; }
