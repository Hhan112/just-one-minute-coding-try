export interface AIReviewResult {
  overallScore: number
  structure: {
    strengths: string[]
    improvements: string[]
  }
  content: {
    strengths: string[]
    improvements: string[]
  }
  suggestions: string[]
  optimizedText: string
}

export type AIReviewStatus = 'idle' | 'loading' | 'success' | 'error'
