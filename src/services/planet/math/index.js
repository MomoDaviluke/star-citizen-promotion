/**
 * @file Planet 渲染数学工具集
 * @description 提供确定性随机数、倍频噪声和双线性插值等渲染基础算法
 * @module services/planet/math
 */

/**
 * 确定性伪随机生成器
 * 相同 seed 总是产生相同的序列，保证星球外观稳定且可复现
 * @param {number} seed - 随机种子
 * @returns {() => number} 返回 0~1 之间随机数的函数
 */
export function makeRandom(seed) {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296
    return s / 4294967296
  }
}

/**
 * 多层倍频噪声
 * 将多组不同频率/振幅的正弦噪声叠加，形成自然连续的地形/纹理
 * @param {number} x - 采样坐标
 * @param {number} seed - 随机种子，决定相位偏移
 * @param {number} octaves - 倍频数量，默认 5
 * @returns {number} 归一化到 [-1, 1] 的噪声值
 */
export function noise(x, seed, octaves = 5) {
  const rand = makeRandom(seed)
  const primes = [157, 313, 631, 1259, 2521]
  let value = 0
  let amplitude = 1
  let frequency = 1
  let maxValue = 0

  // 预生成每个倍频的相位偏移，使不同倍频之间产生错位
  const phases = primes.slice(0, octaves).map(() => rand() * Math.PI * 2)

  for (let i = 0; i < octaves; i++) {
    const px = x * frequency + phases[i]
    value += Math.sin(px) * amplitude
    maxValue += amplitude
    amplitude *= 0.5
    frequency *= 2.3
  }

  return value / maxValue
}

/**
 * 双线性插值
 * 在四个角点颜色之间进行平滑插值，用于纹理采样放大
 * @param {number} c00 - 左上角颜色值
 * @param {number} c10 - 右上角颜色值
 * @param {number} c01 - 左下角颜色值
 * @param {number} c11 - 右下角颜色值
 * @param {number} fx - 水平插值系数 [0, 1]
 * @param {number} fy - 垂直插值系数 [0, 1]
 * @returns {number} 插值后的颜色值
 */
export function bilerp(c00, c10, c01, c11, fx, fy) {
  return (
    c00 * (1 - fx) * (1 - fy) +
    c10 * fx * (1 - fy) +
    c01 * (1 - fx) * fy +
    c11 * fx * fy
  )
}
