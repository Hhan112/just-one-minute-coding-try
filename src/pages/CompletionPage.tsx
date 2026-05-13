import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { useUserStore } from '../stores/practiceStore'
import { SessionData, TopicCategory } from '../types/practice'
import { Play, Pause } from 'lucide-react'

const categoryImages: Record<TopicCategory, string> = {
  person: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=600&h=400&fit=crop',
  place: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=600&h=400&fit=crop',
  event: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=600&h=400&fit=crop',
  object: 'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=600&h=400&fit=crop',
  experience: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=400&fit=crop',
}

function AudioPlayer({ base64, duration }: { base64: string; duration: number }) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null)

  useEffect(() => {
    if (base64) {
      const audioEl = new Audio(base64)
      audioEl.onended = () => setIsPlaying(false)
      setAudio(audioEl)
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

  if (!base64) return null

  return (
    <div className="flex items-center gap-3 bg-gray-100 rounded-lg p-2">
      <Button size="icon" variant="ghost" onClick={togglePlay}>
        {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
      </Button>
      <div className="flex-1">
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 transition-all duration-300"
            style={{ width: isPlaying ? '100%' : '0%' }}
          />
        </div>
      </div>
      <span className="text-xs text-gray-500">{duration}s</span>
    </div>
  )
}

function RoundCard({ round, index }: { round: SessionData['rounds'][0]; index: number }) {
  const [isExpanded, setIsExpanded] = useState(false)

  const roundLabels = ['Free Speaking', 'With Keywords', 'Expanded Details']
  const roundColors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500']

  return (
    <Card>
      <div
        className="flex items-center gap-3 mb-3 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white ${roundColors[index]}`}>
          {index + 1}
        </span>
        <div className="flex-1">
          <h4 className="font-medium text-gray-900">{roundLabels[index]}</h4>
          <p className="text-xs text-gray-500">{round.audioDuration}s</p>
        </div>
        <Button size="sm" variant="ghost">
          {isExpanded ? 'Hide' : 'Show'}
        </Button>
      </div>

      {isExpanded && (
        <div className="space-y-3">
          {round.audioBlob && (
            <AudioPlayer base64={round.audioBlob} duration={round.audioDuration} />
          )}

          {(round.keywords || round.keywordCanvas) && (
            <div className="bg-yellow-50 p-3 rounded-lg">
              <p className="text-xs font-medium text-yellow-800 mb-1">Keywords:</p>
              {round.keywords && <p className="text-sm text-yellow-700">{round.keywords}</p>}
              {round.keywordCanvas && (
                <img src={round.keywordCanvas} alt="Keywords" className="mt-2 max-h-20 rounded border border-yellow-200" />
              )}
            </div>
          )}

          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-xs font-medium text-gray-600 mb-1">Transcript:</p>
            <p className="text-sm text-gray-700">{round.transcript || 'No transcript available'}</p>
          </div>
        </div>
      )}
    </Card>
  )
}

export default function CompletionPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { currentStreak, totalSessions, checkIns } = useUserStore()
  const [session, setSession] = useState<SessionData | null>(null)
  const [showConfetti, setShowConfetti] = useState(true)

  useEffect(() => {
    if (location.state?.session) {
      setSession(location.state.session)
    }
    const timer = setTimeout(() => setShowConfetti(false), 3000)
    return () => clearTimeout(timer)
  }, [location.state])

  const handleFinish = () => {
    navigate('/')
  }

  if (!session) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <p className="text-gray-600 mb-4">No session data found</p>
        <Button onClick={handleFinish}>Back to Home</Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex flex-col">
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          {[...Array(50)].map((_, i) => (
            <motion.div
              key={i}
              initial={{
                x: Math.random() * window.innerWidth,
                y: -20,
                rotate: Math.random() * 360,
              }}
              animate={{
                y: window.innerHeight + 20,
                rotate: Math.random() * 360,
              }}
              transition={{
                duration: 2 + Math.random() * 2,
                delay: Math.random() * 0.5,
              }}
              className="absolute w-3 h-3 rounded-full"
              style={{
                backgroundColor: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'][Math.floor(Math.random() * 5)],
              }}
            />
          ))}
        </div>
      )}

      <header className="p-6 text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', duration: 0.5 }}
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Well Done!</h1>
          <p className="text-gray-600">You've completed today's practice</p>
        </motion.div>
      </header>

      <main className="flex-1 p-6">
        <div className="max-w-2xl mx-auto space-y-6">
          <Card className="overflow-hidden p-0">
            <img
              src={categoryImages[session.topic.category]}
              alt={session.topic.category}
              className="w-full h-48 object-cover"
            />
            <div className="p-4">
              <span className="text-sm text-blue-500 font-medium">{session.topic.category}</span>
              <h2 className="text-xl font-semibold text-gray-900 mt-1">{session.topic.title}</h2>
            </div>
          </Card>

          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Your Progress</h3>
            <div className="grid grid-cols-3 gap-4">
              <Card className="text-center">
                <div className="text-2xl font-bold text-blue-500">{currentStreak}</div>
                <div className="text-sm text-gray-500">Day Streak</div>
              </Card>
              <Card className="text-center">
                <div className="text-2xl font-bold text-green-500">{totalSessions}</div>
                <div className="text-sm text-gray-500">Total Sessions</div>
              </Card>
              <Card className="text-center">
                <div className="text-2xl font-bold text-orange-500">{checkIns.length}</div>
                <div className="text-sm text-gray-500">Check-ins</div>
              </Card>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Your Practice Recording</h3>
            <div className="space-y-4">
              {session.rounds.map((round, index) => (
                <RoundCard key={index} round={round} index={index} />
              ))}
            </div>
          </div>

          <Button size="lg" className="w-full" onClick={handleFinish}>
            Back to Home
          </Button>
        </div>
      </main>
    </div>
  )
}