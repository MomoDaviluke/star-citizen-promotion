import { describe, it, expect } from '@jest/globals'
import { buildPrompt, buildSystemPrompt } from '../../../../src/services/ai/rag/promptBuilder.js'

describe('buildSystemPrompt', () => {
  it('应包含公会信息和回答规则', () => {
    const prompt = buildSystemPrompt({ guildName: '星际先锋队', guildFocus: 'PVP/贸易' })
    expect(prompt).toContain('星际先锋队')
    expect(prompt).toContain('PVP/贸易')
    expect(prompt).toContain('基于知识库')
  })

  it('guildFocus 为空时应省略专注领域', () => {
    const prompt = buildSystemPrompt({ guildName: '测试战队' })
    expect(prompt).toContain('测试战队')
    expect(prompt).not.toContain('战队专注于')
  })
})

describe('buildPrompt', () => {
  it('应组装 system + context + history + question', () => {
    const messages = buildPrompt({
      systemPrompt: '你是招募官',
      context: [{ content: '公会信息A' }, { content: '公会信息B' }],
      history: [{ role: 'user', content: '之前的问题' }, { role: 'assistant', content: '之前的回答' }],
      question: '如何加入?',
    })
    expect(messages[0].role).toBe('system')
    expect(messages[0].content).toContain('你是招募官')
    expect(messages[0].content).toContain('公会信息A')
    expect(messages[0].content).toContain('公会信息B')
    expect(messages[1]).toEqual({ role: 'user', content: '之前的问题' })
    expect(messages[2]).toEqual({ role: 'assistant', content: '之前的回答' })
    expect(messages[3]).toEqual({ role: 'user', content: '如何加入?' })
  })

  it('context 为空时也应正常工作', () => {
    const messages = buildPrompt({
      systemPrompt: '你是助手',
      context: [],
      history: [],
      question: '你好',
    })
    expect(messages).toHaveLength(2)
    expect(messages[1]).toEqual({ role: 'user', content: '你好' })
  })

  it('systemPrompt 含 {CONTEXT} 时应替换占位符', () => {
    const messages = buildPrompt({
      systemPrompt: '你是招募官\n知识库:\n{CONTEXT}',
      context: [{ content: '公会信息A' }],
      history: [],
      question: '你好',
    })
    expect(messages[0].content).toBe('你是招募官\n知识库:\n[1] 公会信息A')
    expect(messages[0].content).not.toContain('{CONTEXT}')
  })

  it('buildSystemPrompt 与 buildPrompt 集成应正确替换占位符', () => {
    const sp = buildSystemPrompt({ guildName: '测试战队', guildFocus: 'PVP' })
    const messages = buildPrompt({
      systemPrompt: sp,
      context: [{ content: '知识X' }],
      history: [],
      question: '问',
    })
    expect(messages[0].content).toContain('知识X')
    expect(messages[0].content).not.toContain('{CONTEXT}')
  })
})
