import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Topic, RoundData, SessionData, CheckIn } from '../types/practice'

interface PracticeState {
  currentRound: 1 | 2 | 3
  status: 'topic' | 'prep' | 'speaking' | 'review' | 'complete'
  selectedTopic: Topic | null
  rounds: [RoundData | null, RoundData | null, RoundData | null]
  sessionStartTime: number | null

  startPractice: (topic: Topic) => void
  setStatus: (status: PracticeState['status']) => void
  saveRound: (roundIndex: number, data: RoundData) => void
  nextRound: () => void
  completePractice: () => SessionData | null
  resetPractice: () => void
}

export const usePracticeStore = create<PracticeState>()((set, get) => ({
  currentRound: 1,
  status: 'topic',
  selectedTopic: null,
  rounds: [null, null, null],
  sessionStartTime: null,

  startPractice: (topic: Topic) => {
    set({
      selectedTopic: topic,
      currentRound: 1,
      status: 'topic',
      rounds: [null, null, null],
      sessionStartTime: Date.now(),
    })
  },

  setStatus: (status) => set({ status }),

  saveRound: (roundIndex, data) => {
    const rounds = [...get().rounds] as [RoundData | null, RoundData | null, RoundData | null]
    rounds[roundIndex] = data
    set({ rounds })
  },

  nextRound: () => {
    const { currentRound } = get()
    if (currentRound < 3) {
      set({ currentRound: (currentRound + 1) as 1 | 2 | 3, status: 'topic' })
    }
  },

  completePractice: () => {
    const { selectedTopic, rounds, sessionStartTime } = get()
    if (!selectedTopic || !sessionStartTime) return null

    const allRoundsComplete = rounds.every(r => r !== null)
    if (!allRoundsComplete) return null

    const session: SessionData = {
      id: crypto.randomUUID(),
      date: new Date().toISOString().split('T')[0],
      topic: selectedTopic,
      rounds: rounds as [RoundData, RoundData, RoundData],
      totalDuration: Math.floor((Date.now() - sessionStartTime) / 1000),
      completedAt: Date.now(),
    }

    set({ status: 'complete' })
    return session
  },

  resetPractice: () => {
    set({
      currentRound: 1,
      status: 'topic',
      selectedTopic: null,
      rounds: [null, null, null],
      sessionStartTime: null,
    })
  },
}))

interface UserState {
  checkIns: CheckIn[]
  currentStreak: number
  longestStreak: number
  totalSessions: number
  sessions: SessionData[]

  recordCheckIn: (session: SessionData) => void
  getCheckInsForMonth: (year: number, month: number) => CheckIn[]
  setSyncData: (sessions: SessionData[], checkIns: CheckIn[]) => void
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      checkIns: [],
      currentStreak: 0,
      longestStreak: 0,
      totalSessions: 0,
      sessions: [],

      recordCheckIn: (session) => {
        const today = new Date().toISOString().split('T')[0]
        const existingCheckIn = get().checkIns.find(c => c.date === today)

        const lastCheckIn = get().checkIns
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]

        let streakDay = 1
        if (lastCheckIn) {
          const lastDate = new Date(lastCheckIn.date)
          const todayDate = new Date(today)
          const diffDays = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24))
          streakDay = diffDays === 1 ? lastCheckIn.streakDay + 1 : 1
        }

        const newStreak = existingCheckIn ? get().currentStreak : streakDay
        const newLongest = Math.max(get().longestStreak, newStreak)

        // Always save the session
        // Only add to checkIns if not already checked in today
        set(state => ({
          checkIns: existingCheckIn
            ? state.checkIns
            : [...state.checkIns, {
                date: today,
                sessionId: session.id,
                topicId: session.topic.id,
                topicTitle: session.topic.title,
                streakDay,
              }],
          currentStreak: newStreak,
          longestStreak: newLongest,
          totalSessions: state.totalSessions + 1,
          sessions: [session, ...state.sessions].slice(0, 30),
        }))
      },

      getCheckInsForMonth: (year, month) => {
        return get().checkIns.filter(c => {
          const d = new Date(c.date)
          return d.getFullYear() === year && d.getMonth() === month
        })
      },

      setSyncData: (cloudSessions, cloudCheckIns) => {
        const existing = get()
        // Merge sessions: combine cloud + local, dedup by id
        const sessionMap = new Map<string, SessionData>()
        for (const s of existing.sessions) sessionMap.set(s.id, s)
        for (const s of cloudSessions) sessionMap.set(s.id, s)
        const mergedSessions = Array.from(sessionMap.values())
          .sort((a, b) => b.completedAt - a.completedAt)
          .slice(0, 30)

        // Merge check-ins: dedup by date
        const checkInMap = new Map<string, CheckIn>()
        for (const c of existing.checkIns) checkInMap.set(c.date, c)
        for (const c of cloudCheckIns) checkInMap.set(c.date, c)
        const mergedCheckIns = Array.from(checkInMap.values())
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

        // Recalculate streaks
        const sortedCheckIns = [...mergedCheckIns]
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

        let currentStreak = 0
        let longestStreak = 0
        const today = new Date()
        let checkDate = new Date(today)

        for (const ci of sortedCheckIns) {
          const ciDate = new Date(ci.date)
          const diffDays = Math.floor((checkDate.getTime() - ciDate.getTime()) / (1000 * 60 * 60 * 24))

          if (diffDays <= 1) {
            currentStreak++
            longestStreak = Math.max(longestStreak, currentStreak)
            checkDate = ciDate
          } else {
            break
          }
        }

        // Only count current streak from today
        const mostRecent = sortedCheckIns[0]
        if (mostRecent) {
          const diffFromToday = Math.floor((today.getTime() - new Date(mostRecent.date).getTime()) / (1000 * 60 * 60 * 24))
          if (diffFromToday > 1) currentStreak = 0
        }

        set({
          sessions: mergedSessions,
          checkIns: mergedCheckIns,
          totalSessions: mergedSessions.length,
          currentStreak,
          longestStreak: Math.max(longestStreak, existing.longestStreak),
        })
      },
    }),
    {
      name: 'jam-user-data',
    }
  )
)