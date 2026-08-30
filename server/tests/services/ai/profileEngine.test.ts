import { describe, it, expect } from '@jest/globals'
import { ProfileEngine } from '../../../src/services/ai/profileEngine.js'

describe('ProfileEngine', () => {
  const engine = new ProfileEngine()

  it('应从 PVP 关键词提取 playStyle=pvp', () => {
    const result = engine.extract({ playStyle: [], timeCommit: '', shipPref: [], skillLevel: '' }, '我喜欢 PVP 战斗和空战')
    expect(result.playStyle).toContain('pvp')
  })

  it('应从贸易关键词提取 playStyle=trade', () => {
    const result = engine.extract({ playStyle: [], timeCommit: '', shipPref: [], skillLevel: '' }, '我主要做货运和贸易赚钱')
    expect(result.playStyle).toContain('trade')
  })

  it('应从探索关键词提取 playStyle=exploration', () => {
    const result = engine.extract({ playStyle: [], timeCommit: '', shipPref: [], skillLevel: '' }, '我喜欢探索未知星系')
    expect(result.playStyle).toContain('exploration')
  })

  it('应从矿业关键词提取 playStyle=mining', () => {
    const result = engine.extract({ playStyle: [], timeCommit: '', shipPref: [], skillLevel: '' }, '我开矿船挖矿')
    expect(result.playStyle).toContain('mining')
  })

  it('应从时间描述提取 timeCommit', () => {
    const result = engine.extract({ playStyle: [], timeCommit: '', shipPref: [], skillLevel: '' }, '我每周能玩 20 小时')
    expect(result.timeCommit).toBe('每周20小时')
  })

  it('应从舰船名称提取 shipPref', () => {
    const result = engine.extract({ playStyle: [], timeCommit: '', shipPref: [], skillLevel: '' }, '我有 F8C Lightning 和 Aurora')
    expect(result.shipPref).toContain('F8C Lightning')
    expect(result.shipPref).toContain('Aurora')
  })

  it('应从技能描述提取 skillLevel', () => {
    const result = engine.extract({ playStyle: [], timeCommit: '', shipPref: [], skillLevel: '' }, '我是老手,玩了 3 年')
    expect(result.skillLevel).toBe('veteran')
  })

  it('应合并到已有画像而非覆盖', () => {
    const existing = { playStyle: ['pvp'], timeCommit: '', shipPref: [], skillLevel: '' }
    const result = engine.extract(existing, '我也喜欢探索')
    expect(result.playStyle).toEqual(['pvp', 'exploration'])
  })

  it('无匹配关键词时应返回原画像', () => {
    const existing = { playStyle: [], timeCommit: '', shipPref: [], skillLevel: '' }
    const result = engine.extract(existing, '今天天气不错')
    expect(result).toEqual(existing)
  })
})
