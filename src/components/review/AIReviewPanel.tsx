import { useState, useCallback } from 'react'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import {
  Sparkles, Loader2, AlertCircle,
  CheckCircle, Lightbulb, FileText,
} from 'lucide-react'

import type { AIReviewResult, AIReviewStatus } from '../../types/aiReview'
import { requestAIReview } from '../../lib/aiReviewService'
import type { SessionData } from '../../types/practice'

interface AIReviewPanelProps {
  session: SessionData
}

export function AIReviewPanel({ session }: AIReviewPanelProps) {
  const [status, setStatus] = useState<AIReviewStatus>('idle')
  const [result, setResult] = useState<AIReviewResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleStartReview = useCallback(async () => {
    setStatus('loading')
    setError(null)

    try {
      const reviewResult = await requestAIReview(session)
      setResult(reviewResult)
      setStatus('success')
    } catch (err) {
      setError(err instanceof Error ? err.message : '发生未知错误')
      setStatus('error')
    }
  }, [session])

  const getScoreColor = (score: number): string => {
    if (score >= 8) return 'text-green-500'
    if (score >= 6) return 'text-blue-500'
    if (score >= 4) return 'text-yellow-500'
    return 'text-red-500'
  }

  const getScoreBg = (score: number): string => {
    if (score >= 8) return 'bg-green-50 border-green-200'
    if (score >= 6) return 'bg-blue-50 border-blue-200'
    if (score >= 4) return 'bg-yellow-50 border-yellow-200'
    return 'bg-red-50 border-red-200'
  }

  if (status === 'idle') {
    return (
      <Card className="text-center py-8">
        <Sparkles className="w-12 h-12 text-blue-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-800 mb-2">AI 口语分析</h3>
        <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
          基于第 3 轮回答，AI 自动分析你的表达结构和内容丰富度，提供评分、改进建议和优化范文。
        </p>
        <Button
          size="lg"
          className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
          onClick={handleStartReview}
        >
          <Sparkles className="w-5 h-5 mr-2" />
          开始 AI 分析
        </Button>
      </Card>
    )
  }

  if (status === 'loading') {
    return (
      <Card>
        <div className="animate-pulse space-y-4">
          <div className="flex justify-center">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          </div>
          <p className="text-center text-sm text-gray-500">AI 正在分析你的口语表现...</p>
          <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto" />
          <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto" />
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="h-24 bg-gray-100 rounded" />
            <div className="h-24 bg-gray-100 rounded" />
          </div>
        </div>
      </Card>
    )
  }

  if (status === 'error') {
    return (
      <Card className="border-red-200 bg-red-50">
        <div className="text-center py-4">
          <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
          <h3 className="font-semibold text-red-800 mb-2">分析失败</h3>
          <p className="text-sm text-red-600 mb-4">{error}</p>
          <Button variant="outline" size="sm" onClick={handleStartReview}>
            重试
          </Button>
        </div>
      </Card>
    )
  }

  if (!result) return null

  return (
    <div className="space-y-4">
      {/* Overall Score */}
      <Card className={`border-2 ${getScoreBg(result.overallScore)}`}>
        <div className="text-center">
          <p className="text-sm text-gray-500 mb-1">总体评分</p>
          <div className={`text-5xl font-bold ${getScoreColor(result.overallScore)}`}>
            {result.overallScore}
          </div>
          <p className="text-xs text-gray-400 mt-1">/ 10</p>
        </div>
      </Card>

      {/* Structure & Content */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-blue-500" />
            表达结构
          </h4>
          {result.structure.strengths.length > 0 && (
            <div className="mb-3">
              <p className="text-xs font-medium text-green-600 mb-1">优势</p>
              <ul className="text-sm text-gray-700 space-y-1">
                {result.structure.strengths.map((s, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-green-500 mt-1">+</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {result.structure.improvements.length > 0 && (
            <div>
              <p className="text-xs font-medium text-amber-600 mb-1">待改进</p>
              <ul className="text-sm text-gray-700 space-y-1">
                {result.structure.improvements.map((s, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-amber-500 mt-1">-</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Card>

        <Card>
          <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-purple-500" />
            内容丰富度
          </h4>
          {result.content.strengths.length > 0 && (
            <div className="mb-3">
              <p className="text-xs font-medium text-green-600 mb-1">优势</p>
              <ul className="text-sm text-gray-700 space-y-1">
                {result.content.strengths.map((s, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-green-500 mt-1">+</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {result.content.improvements.length > 0 && (
            <div>
              <p className="text-xs font-medium text-amber-600 mb-1">待改进</p>
              <ul className="text-sm text-gray-700 space-y-1">
                {result.content.improvements.map((s, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-amber-500 mt-1">-</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Card>
      </div>

      {/* Suggestions */}
      <Card>
        <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <FileText className="w-4 h-4 text-amber-500" />
          改进建议
        </h4>
        <ol className="list-decimal list-inside space-y-2">
          {result.suggestions.map((suggestion, i) => (
            <li key={i} className="text-sm text-gray-700 leading-relaxed">{suggestion}</li>
          ))}
        </ol>
      </Card>

      {/* Optimized Text */}
      {result.optimizedText && (
        <Card>
          <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <FileText className="w-4 h-4 text-green-500" />
            优化参考文本
          </h4>
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
              {result.optimizedText}
            </p>
          </div>
        </Card>
      )}
    </div>
  )
}
