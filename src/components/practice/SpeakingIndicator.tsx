import { cn } from '../../lib/utils'

interface SpeakingIndicatorProps {
  isListening: boolean
}

export function SpeakingIndicator({ isListening }: SpeakingIndicatorProps) {
  return (
    <div className="flex items-center gap-2 justify-center">
      <div
        className={cn(
          'w-3 h-3 rounded-full transition-colors',
          isListening ? 'bg-green-500 animate-pulse' : 'bg-gray-300'
        )}
      />
      {isListening && (
        <>
          <div className="flex gap-0.5 items-end h-6">
            {[1, 2, 3, 4, 5].map(i => (
              <div
                key={i}
                className="w-1 bg-green-500 rounded-full animate-bounce"
                style={{
                  height: `${Math.random() * 20 + 8}px`,
                  animationDelay: `${i * 0.1}s`,
                }}
              />
            ))}
          </div>
          <span className="text-green-600 text-sm font-medium">Speaking...</span>
        </>
      )}
      {!isListening && (
        <span className="text-gray-500 text-sm">Ready to speak</span>
      )}
    </div>
  )
}