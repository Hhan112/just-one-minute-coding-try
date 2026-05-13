import { useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { useUserStore } from '../stores/practiceStore'
import { SessionData } from '../types/practice'
import { ArrowLeft, Calendar } from 'lucide-react'

function SessionCard({ session, onClick }: { session: SessionData; onClick: () => void }) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <Card
      className="cursor-pointer hover:border-blue-300 hover:shadow-md transition-all"
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div>
          <span className="text-xs text-blue-500 font-medium">
            {session.topic.category}
          </span>
          <h4 className="font-medium text-gray-900">{session.topic.title}</h4>
          <p className="text-sm text-gray-500 mt-1">{formatDate(session.date)}</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-gray-900">
            {Math.floor(session.totalDuration / 60)}:{(session.totalDuration % 60).toString().padStart(2, '0')}
          </div>
          <div className="text-xs text-gray-400">duration</div>
        </div>
      </div>
    </Card>
  )
}

export default function HistoryPage() {
  const navigate = useNavigate()
  const { sessions, checkIns } = useUserStore()

  const today = new Date()
  const currentMonth = today.getMonth()
  const currentYear = today.getFullYear()
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay()

  const monthDays = Array.from({ length: daysInMonth }, (_, i) => i + 1)
  const checkInDates = new Set(checkIns.map(c => c.date))

  const handleSessionClick = (session: SessionData) => {
    navigate(`/review?sessionId=${session.id}`, { state: { session } })
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="p-4 border-b bg-white">
        <div className="max-w-xl mx-auto flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-semibold">Practice History</h1>
        </div>
      </header>

      <main className="flex-1 p-6">
        <div className="max-w-xl mx-auto space-y-6">
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-5 h-5 text-blue-500" />
              <h2 className="font-semibold">
                {today.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </h2>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center">
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                <div key={day} className="text-xs text-gray-400 py-2">{day}</div>
              ))}
              {[...Array(firstDayOfMonth)].map((_, i) => (
                <div key={`empty-${i}`} />
              ))}
              {monthDays.map(day => {
                const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                const hasCheckIn = checkInDates.has(dateStr)
                const isToday = day === today.getDate()
                return (
                  <div
                    key={day}
                    className={`
                      w-8 h-8 mx-auto rounded-full flex items-center justify-center text-sm
                      ${hasCheckIn ? 'bg-blue-500 text-white' : 'bg-gray-100'}
                      ${isToday ? 'ring-2 ring-blue-300' : ''}
                    `}
                  >
                    {day}
                  </div>
                )
              })}
            </div>
          </Card>

          <div>
            <h3 className="font-semibold text-gray-800 mb-3">Recent Sessions</h3>
            {sessions.length === 0 ? (
              <Card className="text-center text-gray-500 py-8">
                No sessions yet. Start practicing!
              </Card>
            ) : (
              <div className="space-y-3">
                {sessions.slice(0, 10).map(session => (
                  <SessionCard
                    key={session.id}
                    session={session}
                    onClick={() => handleSessionClick(session)}
                  />
                ))}
              </div>
            )}
          </div>

          <Button variant="outline" className="w-full" onClick={() => navigate('/')}>
            Back to Home
          </Button>
        </div>
      </main>
    </div>
  )
}