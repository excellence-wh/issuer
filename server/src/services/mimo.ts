const MIMO_BASE_URL = 'https://api.xiaomimimo.com/v1'
const MIMO_API_KEY = 'sk-cz2zszvwwktha6sn2a2thqegxttci3jagymk3yichh0g6991'
const MIMO_MODEL = 'mimo-v2-flash'

interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export const mimoService = {
  async complete(messages: LLMMessage[], options?: { temperature?: number; maxTokens?: number }): Promise<{ content: string }> {
    const response = await fetch(`${MIMO_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': MIMO_API_KEY,
      },
      body: JSON.stringify({
        model: MIMO_MODEL,
        messages,
        max_completion_tokens: options?.maxTokens ?? 2000,
        temperature: options?.temperature ?? 0.7,
        top_p: 0.95,
        stream: false,
        thinking: { type: 'disabled' },
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`MiMo API error: ${response.status} - ${error}`)
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content || ''

    return { content }
  },

  async generateModificationFromHg(
    files: { path: string; status: string }[],
    description: string
  ): Promise<string> {
    const systemPrompt = `你是一个代码审查助手，帮助工程师根据代码变更生成修改说明。请根据提供的代码变更信息，生成清晰、简洁的修改描述，用中文回复。

要求：
- 只输出修改说明，不要添加其他内容
- 说明修改了哪些文件，做了什么变更
- 保持简洁，突出重点`

    const fileList = files.map(f => {
      const statusMap: Record<string, string> = {
        A: '新增',
        M: '修改',
        D: '删除',
        R: '重命名',
      }
      return `[${statusMap[f.status] || f.status}] ${f.path}`
    }).join('\n')

    const userPrompt = `请根据以下代码变更信息，生成修改说明：

**问题描述**:
${description || '无'}

**变更的文件**:
${fileList || '无'}

请简要说明这些修改的内容和目的。`

    const result = await this.complete([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ])

    return result.content
  }
}
