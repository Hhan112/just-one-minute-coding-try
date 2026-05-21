export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: ProfileRow
        Insert: ProfileInsert
      }
      sessions: {
        Row: SessionRow
        Insert: SessionInsert
      }
      rounds: {
        Row: RoundRow
        Insert: RoundInsert
      }
      check_ins: {
        Row: CheckInRow
        Insert: CheckInInsert
      }
    }
  }
}

export interface ProfileRow {
  id: string
  email: string
  display_name: string | null
  created_at: string
}

export interface ProfileInsert {
  id: string
  email: string
  display_name?: string | null
}

export interface SessionRow {
  id: string
  user_id: string
  date: string
  topic_id: string
  topic_category: string
  topic_title: string
  topic_description: string | null
  total_duration: number
  completed_at: number
  created_at: string
}

export interface SessionInsert {
  id?: string
  user_id: string
  date: string
  topic_id: string
  topic_category: string
  topic_title: string
  topic_description?: string | null
  total_duration: number
  completed_at: number
}

export interface RoundRow {
  id: string
  session_id: string
  round_number: number
  audio_base64: string
  audio_duration: number
  transcript: string
  keywords: string | null
  keyword_canvas: string | null
  timestamp: number
  created_at: string
}

export interface RoundInsert {
  id?: string
  session_id: string
  round_number: number
  audio_base64: string
  audio_duration: number
  transcript?: string
  keywords?: string | null
  keyword_canvas?: string | null
  timestamp: number
}

export interface CheckInRow {
  id: string
  user_id: string
  date: string
  session_id: string
  topic_id: string
  topic_title: string
  streak_day: number
  created_at: string
}

export interface CheckInInsert {
  id?: string
  user_id: string
  date: string
  session_id: string
  topic_id: string
  topic_title: string
  streak_day: number
}
