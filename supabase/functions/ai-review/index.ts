import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'

interface AIReviewRequest {
  transcript: string
  topic: string
  keywords: string
}

interface DeepSeekMessage {
  role: 'system' | 'user'
  content: string
}

interface DeepSeekResponse {
  choices: Array<{
    message: {
      content: string
    }
  }>
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { transcript, topic, keywords }: AIReviewRequest = await req.json()

    if (!transcript || transcript.trim().length < 10) {
      return new Response(
        JSON.stringify({ error: '转录文本太短或为空，请完成第 3 轮录音后再试' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const apiKey = Deno.env.get('DEEPSEEK_API_KEY')
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: '服务器配置错误：缺少 API 密钥' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const systemPrompt =
      '你是一位专业的雅思口语考官和教练。请分析用户的口语练习回答，从以下两个维度评分：\n' +
      '1. 表达结构（Structure）：逻辑清晰度、组织连贯性、衔接自然度\n' +
      '2. 内容丰富度（Content Richness）：细节展开、词汇多样性、观点深度\n' +
      '\n' +
      '请严格按照以下 JSON 格式输出，不要包含任何其他文字：\n' +
      '{\n' +
      '  "overallScore": <1-10 的整数>,\n' +
      '  "structure": {\n' +
      '    "strengths": ["优点1", "优点2"],\n' +
      '    "improvements": ["不足1", "不足2"]\n' +
      '  },\n' +
      '  "content": {\n' +
      '    "strengths": ["优点1", "优点2"],\n' +
      '    "improvements": ["不足1", "不足2"]\n' +
      '  },\n' +
      '  "suggestions": ["建议1", "建议2", "建议3"],\n' +
      '  "optimizedText": "<基于用户原始内容优化后的示范回答>"\n' +
      '}\n' +
      '\n' +
      '评分标准：\n' +
      '- 1-3：需要大量改进\n' +
      '- 4-5：基础水平\n' +
      '- 6-7：良好\n' +
      '- 8-9：优秀\n' +
      '- 10：典范\n' +
      '\n' +
      '在 optimizedText 中，基于用户的原始内容提供一个改进版本，展示如何更好地组织语言和展开细节。建议保持 3-5 条。'

    const userPrompt =
      '【话题】' + topic + '\n' +
      '【关键词参考】' + (keywords || '无') + '\n' +
      '【第 3 轮回答转录】' + transcript

    const deepseekBody = {
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ] satisfies DeepSeekMessage[],
      response_format: { type: 'json_object' } as const,
      max_tokens: 4096,
      temperature: 0.7,
    }

    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + apiKey,
      },
      body: JSON.stringify(deepseekBody),
    })

    if (!response.ok) {
      const errorBody = await response.text()
      console.error('DeepSeek API error:', response.status, errorBody)
      return new Response(
        JSON.stringify({ error: 'AI 服务调用失败，请稍后重试' }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const result: DeepSeekResponse = await response.json()
    const textContent = result.choices?.[0]?.message?.content

    if (!textContent) {
      return new Response(
        JSON.stringify({ error: 'AI 返回内容为空' }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse JSON with fallbacks
    let parsed: Record<string, unknown>
    try {
      parsed = JSON.parse(textContent)
    } catch {
      const jsonMatch = textContent.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[1])
      } else {
        const start = textContent.indexOf('{')
        const end = textContent.lastIndexOf('}')
        if (start !== -1 && end > start) {
          parsed = JSON.parse(textContent.slice(start, end + 1))
        } else {
          throw new Error('无法从 AI 响应中提取 JSON')
        }
      }
    }

    // Validate and normalize
    const overallScore = Math.max(1, Math.min(10, Math.round(parsed.overallScore as number || 5)))
    const suggestions = Array.isArray(parsed.suggestions) ? parsed.suggestions : []
    const structure = parsed.structure as { strengths: string[]; improvements: string[] } || { strengths: [], improvements: [] }
    const content = parsed.content as { strengths: string[]; improvements: string[] } || { strengths: [], improvements: [] }

    return new Response(
      JSON.stringify({
        overallScore,
        structure: {
          strengths: Array.isArray(structure.strengths) ? structure.strengths : [],
          improvements: Array.isArray(structure.improvements) ? structure.improvements : [],
        },
        content: {
          strengths: Array.isArray(content.strengths) ? content.strengths : [],
          improvements: Array.isArray(content.improvements) ? content.improvements : [],
        },
        suggestions: suggestions.slice(0, 5),
        optimizedText: typeof parsed.optimizedText === 'string' ? parsed.optimizedText : '',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('ai-review function error:', error)
    return new Response(
      JSON.stringify({ error: '分析过程发生错误', detail: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
