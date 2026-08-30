/**
 * @file 画像规则引擎
 * @description 基于关键词匹配提取用户画像(playStyle/timeCommit/shipPref/skillLevel)
 * @module server/services/ai/profileEngine
 */

import type { UserProfile } from './sessionStore.js'

interface Rule {
  keywords: string[]
  field: keyof UserProfile
  value: string
}

const PLAY_STYLE_RULES: Rule[] = [
  { keywords: ['pvp', '战斗', '空战', '打架', '狗斗', 'combat', 'fighter'], field: 'playStyle', value: 'pvp' },
  { keywords: ['贸易', '货运', '运货', '跑商', 'trade', 'cargo', 'haul'], field: 'playStyle', value: 'trade' },
  { keywords: ['探索', '探险', '未知', 'discover', 'explore', 'exploration'], field: 'playStyle', value: 'exploration' },
  { keywords: ['挖矿', '矿业', '采矿', '矿船', 'mining', 'mine', 'prospector'], field: 'playStyle', value: 'mining' },
]

const SHIP_NAMES = [
  'F8C Lightning', 'F8C', 'Arrow', 'Gladius', 'Hornet', ' Buccaneer',
  'Cutlass Black', 'Cutlass', 'Freelancer', 'Constellation', 'Andromeda',
  'Aurora', 'Mustang', 'Avenger', '300i', 'Terrapin', 'Exploration',
  'Prospector', 'Mole', 'Vulture',
]

const SKILL_RULES: Rule[] = [
  { keywords: ['老手', '老兵', 'veteran', '3年', '5年', '资深'], field: 'skillLevel', value: 'veteran' },
  { keywords: ['新手', '萌新', '刚入坑', 'beginner', 'new', '初学者'], field: 'skillLevel', value: 'beginner' },
  { keywords: ['中级', '进阶', 'intermediate', '熟练'], field: 'skillLevel', value: 'intermediate' },
]

const TIME_PATTERN = /每周[^\d]*?(\d+)\s*小时|(\d+)\s*小时\s*\/\s*周|(\d+)\s*hours?\s*(?:per|\/)\s*week/i

export class ProfileEngine {
  /**
   * 从用户消息中提取画像信息并合并到已有画像
   */
  extract(existing: UserProfile, message: string): UserProfile {
    const result: UserProfile = {
      playStyle: [...existing.playStyle],
      timeCommit: existing.timeCommit,
      shipPref: [...existing.shipPref],
      skillLevel: existing.skillLevel,
    }

    const lowerMessage = message.toLowerCase()

    // playStyle 匹配
    for (const rule of PLAY_STYLE_RULES) {
      if (rule.field === 'playStyle' && !result.playStyle.includes(rule.value)) {
        const matched = rule.keywords.some(kw => lowerMessage.includes(kw.toLowerCase()))
        if (matched) {
          result.playStyle.push(rule.value)
        }
      }
    }

    // skillLevel 匹配
    if (!result.skillLevel) {
      for (const rule of SKILL_RULES) {
        if (rule.field === 'skillLevel') {
          const matched = rule.keywords.some(kw => lowerMessage.includes(kw.toLowerCase()))
          if (matched) {
            result.skillLevel = rule.value
            break
          }
        }
      }
    }

    // timeCommit 匹配
    if (!result.timeCommit) {
      const match = message.match(TIME_PATTERN)
      if (match) {
        const hours = match[1] || match[2] || match[3]
        result.timeCommit = `每周${hours}小时`
      }
    }

    // shipPref 匹配
    for (const ship of SHIP_NAMES) {
      if (message.includes(ship) && !result.shipPref.includes(ship)) {
        result.shipPref.push(ship)
      }
    }

    return result
  }
}
