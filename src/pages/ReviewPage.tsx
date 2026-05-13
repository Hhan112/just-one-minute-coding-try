import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { useUserStore } from '../stores/practiceStore'
import { SessionData, TopicCategory } from '../types/practice'
import { Play, Pause, RefreshCw, Clock, MessageSquare } from 'lucide-react'

const categoryImages: Record<TopicCategory, string> = {
  person: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=600&h=400&fit=crop',
  place: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=600&h=400&fit=crop',
  event: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=600&h=400&fit=crop',
  object: 'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=600&h=400&fit=crop',
  experience: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=400&fit=crop',
}

function AudioPlayer({ base64, duration }: { base64: string; duration: number }) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null)

  useEffect(() => {
    if (base64) {
      const audioEl = new Audio(base64)

      audioEl.addEventListener('timeupdate', () => {
        setCurrentTime(audioEl.currentTime)
      })

      audioEl.addEventListener('ended', () => {
        setIsPlaying(false)
        setCurrentTime(0)
      })

      setAudio(audioEl)
      setCurrentTime(0)

      return () => {
        audioEl.pause()
        audioEl.src = ''
      }
    }
  }, [base64])

  const togglePlay = () => {
    if (!audio) return
    if (isPlaying) {
      audio.pause()
    } else {
      audio.play()
    }
    setIsPlaying(!isPlaying)
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  if (!base64) {
    return (
      <div className="flex items-center gap-3 bg-gray-100 rounded-lg p-3">
        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
          <span className="text-gray-400 text-xs">N/A</span>
        </div>
        <span className="text-gray-400 text-sm">No recording</span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3 bg-blue-50 rounded-lg p-3 border border-blue-100">
      <Button
        size="icon"
        className="bg-blue-500 hover:bg-blue-600"
        onClick={togglePlay}
      >
        {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
      </Button>
      <div className="flex-1">
        <div className="h-2 bg-blue-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 transition-all duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
      <span className="text-sm text-blue-600 font-medium w-12 text-right">{duration}s</span>
    </div>
  )
}

function RoundReviewCard({ round, index }: { round: SessionData['rounds'][0]; index: number }) {
  const roundLabels = ['Round 1 - Free Speaking', 'Round 2 - With Keywords', 'Round 3 - Expanded Details']
  const roundColors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500']

  return (
    <Card className="border-t-4 border-l-0 border-r-0 border-b-0" style={{ borderTopColor: roundColors[index].replace('bg-', '#').replace('500', '') }}>
      <div className="flex items-center gap-3 mb-4">
        <span className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${roundColors[index]}`}>
          {index + 1}
        </span>
        <div>
          <h3 className="font-semibold text-gray-900">{roundLabels[index]}</h3>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Clock className="w-3 h-3" />
            <span>{round.audioDuration}s</span>
          </div>
        </div>
      </div>

      {/* Audio Player */}
      <div className="mb-4">
        <p className="text-xs font-medium text-gray-500 mb-2 flex items-center gap-1">
          <Play className="w-3 h-3" /> Recording
        </p>
        <AudioPlayer base64={round.audioBlob} duration={round.audioDuration} />
      </div>

      {/* Keywords (Round 2 & 3 only) */}
      {index > 0 && (round.keywords || round.keywordCanvas) && (
        <div className="mb-4">
          <p className="text-xs font-medium text-gray-500 mb-2 flex items-center gap-1">
            <MessageSquare className="w-3 h-3" /> Keywords / Notes
          </p>
          <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-100">
            {round.keywords && (
              <p className="text-sm text-yellow-800 whitespace-pre-wrap">{round.keywords}</p>
            )}
            {round.keywordCanvas && (
              <img
                src={round.keywordCanvas}
                alt="Keyword notes"
                className="mt-2 max-h-24 rounded border border-yellow-200"
              />
            )}
          </div>
        </div>
      )}

      {/* Transcript */}
      <div>
        <p className="text-xs font-medium text-gray-500 mb-2">Transcript</p>
        <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 max-h-48 overflow-y-auto">
          <p className="text-sm text-gray-700 leading-relaxed">
            {round.transcript || 'No transcript available'}
          </p>
        </div>
      </div>
    </Card>
  )
}

export default function ReviewPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { sessions, currentStreak, totalSessions } = useUserStore()
  const [session, setSession] = useState<SessionData | null>(null)

  useEffect(() => {
    console.log('ReviewPage: location.state:', location.state)

    if (location.state?.session) {
      console.log('ReviewPage: received session from navigation state')
      setSession(location.state.session)
    } else {
      // Try to find session by ID from URL search params
      const params = new URLSearchParams(location.search)
      const sessionId = params.get('sessionId')

      if (sessionId) {
        const found = sessions.find(s => s.id === sessionId)
        if (found) {
          console.log('ReviewPage: found session by ID:', sessionId)
          setSession(found)
        }
      } else if (sessions.length > 0) {
        // Fallback: use most recent session
        console.log('ReviewPage: using most recent session from store')
        setSession(sessions[0])
      } else {
        console.log('ReviewPage: no session data available')
      }
    }
  }, [location.state, location.search, sessions])

  const handleStartNew = () => {
    navigate('/practice')
  }

  const handleBackToHome = () => {
    navigate('/')
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
        <Card className="text-center max-w-md">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">No Practice Data</h2>
          <p className="text-gray-600 mb-6">
            There is no practice session to review. Please complete a practice first.
          </p>
          <div className="space-y-3">
            <Button size="lg" className="w-full" onClick={handleStartNew}>
              Start New Practice
            </Button>
            <Button variant="outline" size="lg" className="w-full" onClick={handleBackToHome}>
              Back to Home
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  const completedDate = new Date(session.completedAt)
  const formattedDate = completedDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <header className="bg-white border-b">
        <div className="max-w-2xl mx-auto p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Practice Review</h1>
          <p className="text-sm text-gray-500">{formattedDate}</p>
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-6 space-y-6">
        {/* Topic Card */}
        <Card className="overflow-hidden p-0">
          <img
            src={categoryImages[session.topic.category]}
            alt={session.topic.category}
            className="w-full h-40 object-cover"
          />
          <div className="p-4">
            <span className="text-xs font-medium text-blue-500 uppercase tracking-wide">
              {session.topic.category}
            </span>
            <h2 className="text-lg font-semibold text-gray-900 mt-1">
              {session.topic.title}
            </h2>
          </div>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="text-center">
            <div className="text-2xl font-bold text-blue-500">{currentStreak}</div>
            <div className="text-xs text-gray-500">Day Streak</div>
          </Card>
          <Card className="text-center">
            <div className="text-2xl font-bold text-green-500">{totalSessions}</div>
            <div className="text-xs text-gray-500">Total Sessions</div>
          </Card>
          <Card className="text-center">
            <div className="text-2xl font-bold text-purple-500">
              {Math.floor(session.totalDuration / 60)}:{(session.totalDuration % 60).toString().padStart(2, '0')}
            </div>
            <div className="text-xs text-gray-500">Duration</div>
          </Card>
        </div>

        {/* Round Reviews */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800">Your Practice Rounds</h3>
          {session.rounds.map((round, index) => (
            <RoundReviewCard key={index} round={round} index={index} />
          ))}
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 pt-4">
          <Button
            size="lg"
            className="w-full bg-green-500 hover:bg-green-600"
            onClick={handleStartNew}
          >
            <RefreshCw className="w-5 h-5 mr-2" />
            Start New Practice
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="w-full"
            onClick={handleBackToHome}
          >
            Back to Home
          </Button>
        </div>
      </main>
    </div>
  )
}