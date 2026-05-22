import { supabase } from './supabase'
import type { AIReviewResult } from '../types/aiReview'
import type { SessionData } from '../types/practice'

export async function requestAIReview(session: SessionData): Promise<AIReviewResult> {
  // Only analyze Round 3 (the detailed expansion round)
  const round3 = session.rounds[2]
  const round2 = session.rounds[1]

  const { data, error } = await supabase.functions.invoke('ai-review', {
    body: {
      transcript: round3.transcript || '',
      topic: session.topic.title,
      keywords: round2?.keywords || '',
    },
  })

  if (error) {
    throw new Error(data?.error || error.message || 'AI 分析请求失败')
  }

  const result = data as AIReviewResult
  if (!result || typeof result.overallScore !== 'number') {
    throw new Error('AI 返回的响应格式不正确')
  }

  return result
}
