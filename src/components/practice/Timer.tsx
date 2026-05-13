import { cn } from '../../lib/utils'

interface TimerProps {
  timeLeft: number
  total: number
  isRunning: boolean
}

export function Timer({ timeLeft, total }: TimerProps) {
  const percentage = (timeLeft / total) * 100
  const circumference = 2 * Math.PI * 45
  const strokeDashoffset = circumference - (percentage / 100) * circumference

  return (
    <div className="relative flex items-center justify-center">
      <svg className="w-32 h-32 transform -rotate-90">
        <circle
          cx="64"
          cy="64"
          r="45"
          strokeWidth="8"
          fill="none"
          className="stroke-gray-200"
        />
        <circle
          cx="64"
          cy="64"
          r="45"
          strokeWidth="8"
          fill="none"
          className={cn(
            'transition-all duration-1000',
            timeLeft <= 10 ? 'stroke-red-500' : 'stroke-blue-500'
          )}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn(
          'text-4xl font-bold',
          timeLeft <= 10 ? 'text-red-500' : 'text-gray-900'
        )}>
          {timeLeft}
        </span>
        <span className="text-sm text-gray-500">seconds</span>
      </div>
    </div>
  )
}