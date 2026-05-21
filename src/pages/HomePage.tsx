import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { useNavigate } from 'react-router-dom'
import { useUserStore } from '../stores/practiceStore'
import { UserMenu } from '../components/auth/UserMenu'

export function HomePage() {
  const navigate = useNavigate()
  const { currentStreak, totalSessions, checkIns } = useUserStore()

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex flex-col">
      <header className="p-6">
        <div className="max-w-2xl mx-auto">
          <UserMenu />
          <div className="text-center mt-4">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Just a Minute</h1>
            <p className="text-lg text-gray-600">每日 10 分钟，提升英语口语流利度</p>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md space-y-6">
          <Card className="text-center space-y-4">
            <div className="text-6xl">🎯</div>
            <h2 className="text-xl font-semibold">Ready to practice?</h2>
            <p className="text-gray-600">
              三轮递进式练习，从自由说到详细阐述，全面提升口语能力
            </p>
            <Button
              size="lg"
              className="w-full"
              onClick={() => navigate('/practice')}
            >
              Start New Practice
            </Button>
          </Card>

          <div className="grid grid-cols-3 gap-4">
            <Card className="text-center">
              <div className="text-3xl font-bold text-blue-500">{currentStreak}</div>
              <div className="text-sm text-gray-500">Day Streak</div>
            </Card>
            <Card className="text-center">
              <div className="text-3xl font-bold text-green-500">{totalSessions}</div>
              <div className="text-sm text-gray-500">Sessions</div>
            </Card>
            <Card className="text-center">
              <div className="text-3xl font-bold text-orange-500">{checkIns.length}</div>
              <div className="text-sm text-gray-500">Check-ins</div>
            </Card>
          </div>

          <Button
            variant="outline"
            className="w-full"
            onClick={() => navigate('/history')}
          >
            View Practice History
          </Button>
        </div>
      </main>
    </div>
  )
}