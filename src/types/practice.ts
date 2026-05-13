export type TopicCategory = 'person' | 'place' | 'event' | 'object' | 'experience'

export interface Topic {
  id: string
  category: TopicCategory
  title: string
  description?: string
  prompts?: string[]
}

export interface RoundData {
  roundNumber: 1 | 2 | 3
  audioBlob: string
  audioDuration: number
  transcript: string
  interimTranscript: string
  keywords?: string
  keywordCanvas?: string
  timestamp: number
}

export interface SessionData {
  id: string
  date: string
  topic: Topic
  rounds: [RoundData, RoundData, RoundData]
  totalDuration: number
  generatedImageUrl?: string
  completedAt: number
}

export interface CheckIn {
  date: string
  sessionId: string
  topicId: string
  topicTitle: string
  streakDay: number
}