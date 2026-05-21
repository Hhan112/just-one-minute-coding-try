import { supabase } from '../lib/supabase'
import type { SessionData, RoundData, CheckIn } from '../types/practice'

const BATCH_SIZE = 50

class SyncService {
  private isPushing = false

  /** Push a completed session to Supabase */
  async pushSession(session: SessionData): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    if (this.isPushing) return
    this.isPushing = true

    try {
      // Insert session
      const { data: sessionRow, error: sessionError } = await supabase
        .from('sessions')
        .insert({
          id: session.id,
          user_id: user.id,
          date: session.date,
          topic_id: session.topic.id,
          topic_category: session.topic.category,
          topic_title: session.topic.title,
          topic_description: session.topic.description ?? null,
          total_duration: session.totalDuration,
          completed_at: session.completedAt,
        })
        .select('id')
        .single()

      if (sessionError) throw sessionError

      // Insert rounds
      const roundsToInsert = session.rounds.map((round: RoundData) => ({
        session_id: sessionRow.id,
        round_number: round.roundNumber,
        audio_base64: round.audioBlob,
        audio_duration: round.audioDuration,
        transcript: round.transcript,
        keywords: round.keywords ?? null,
        keyword_canvas: round.keywordCanvas ?? null,
        timestamp: round.timestamp,
      }))

      const { error: roundsError } = await supabase
        .from('rounds')
        .insert(roundsToInsert)

      if (roundsError) throw roundsError

      // Upsert check-in
      const { error: checkInError } = await supabase
        .from('check_ins')
        .upsert({
          user_id: user.id,
          date: session.date,
          session_id: session.id,
          topic_id: session.topic.id,
          topic_title: session.topic.title,
          streak_day: 1, // will be recalculated on pull
        }, {
          onConflict: 'user_id,date',
        })

      if (checkInError) throw checkInError
    } catch (err) {
      console.error('[SyncService] Failed to push session:', err)
    } finally {
      this.isPushing = false
    }
  }

  /** Pull all user data from Supabase */
  async pullAllData(): Promise<{ sessions: SessionData[]; checkIns: CheckIn[] } | null> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    try {
      // Fetch sessions in batches
      const allSessions: SessionData[] = []
      let from = 0
      let hasMore = true

      while (hasMore) {
        const { data: sessionRows, error: sessionError } = await supabase
          .from('sessions')
          .select('*')
          .eq('user_id', user.id)
          .order('completed_at', { ascending: false })
          .range(from, from + BATCH_SIZE - 1)

        if (sessionError) throw sessionError
        if (!sessionRows || sessionRows.length === 0) break

        // Fetch rounds for each session batch
        const sessionIds = sessionRows.map(s => s.id)
        const { data: roundRows, error: roundsError } = await supabase
          .from('rounds')
          .select('*')
          .in('session_id', sessionIds)

        if (roundsError) throw roundsError

        // Group rounds by session_id
        const roundsBySession = new Map<string, typeof roundRows>()
        roundRows?.forEach(r => {
          const existing = roundsBySession.get(r.session_id) || []
          existing.push(r)
          roundsBySession.set(r.session_id, existing)
        })

        // Reconstruct SessionData
        for (const row of sessionRows) {
          const rounds = (roundsBySession.get(row.id) || [])
            .sort((a, b) => a.round_number - b.round_number)

          if (rounds.length !== 3) continue

          const roundData: [RoundData, RoundData, RoundData] = [
            {
              roundNumber: 1,
              audioBlob: rounds[0].audio_base64,
              audioDuration: rounds[0].audio_duration,
              transcript: rounds[0].transcript,
              interimTranscript: '',
              keywords: rounds[0].keywords ?? undefined,
              keywordCanvas: rounds[0].keyword_canvas ?? undefined,
              timestamp: rounds[0].timestamp,
            },
            {
              roundNumber: 2,
              audioBlob: rounds[1].audio_base64,
              audioDuration: rounds[1].audio_duration,
              transcript: rounds[1].transcript,
              interimTranscript: '',
              keywords: rounds[1].keywords ?? undefined,
              keywordCanvas: rounds[1].keyword_canvas ?? undefined,
              timestamp: rounds[1].timestamp,
            },
            {
              roundNumber: 3,
              audioBlob: rounds[2].audio_base64,
              audioDuration: rounds[2].audio_duration,
              transcript: rounds[2].transcript,
              interimTranscript: '',
              keywords: rounds[2].keywords ?? undefined,
              keywordCanvas: rounds[2].keyword_canvas ?? undefined,
              timestamp: rounds[2].timestamp,
            },
          ]

          allSessions.push({
            id: row.id,
            date: row.date,
            topic: {
              id: row.topic_id,
              category: row.topic_category as SessionData['topic']['category'],
              title: row.topic_title,
              description: row.topic_description ?? undefined,
            },
            rounds: roundData,
            totalDuration: row.total_duration,
            completedAt: row.completed_at,
          })
        }

        from += BATCH_SIZE
        if ((sessionRows?.length || 0) < BATCH_SIZE) hasMore = false
      }

      // Fetch check-ins
      const { data: checkInRows, error: checkInError } = await supabase
        .from('check_ins')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false })

      if (checkInError) throw checkInError

      const checkIns: CheckIn[] = (checkInRows || []).map(r => ({
        date: r.date,
        sessionId: r.session_id,
        topicId: r.topic_id,
        topicTitle: r.topic_title,
        streakDay: r.streak_day,
      }))

      return { sessions: allSessions, checkIns }
    } catch (err) {
      console.error('[SyncService] Failed to pull data:', err)
      return null
    }
  }
}

export const syncService = new SyncService()
