import { Mic, Square, Play, Pause } from 'lucide-react'
import { Button } from '../ui/Button'

interface RecordingControlsProps {
  isRecording: boolean
  isPlaying: boolean
  hasRecording: boolean
  onStartRecording: () => void
  onStopRecording: () => void
  onPlay: () => void
  onPause: () => void
}

export function RecordingControls({
  isRecording,
  isPlaying,
  hasRecording,
  onStartRecording,
  onStopRecording,
  onPlay,
  onPause,
}: RecordingControlsProps) {
  return (
    <div className="flex items-center gap-4 justify-center">
      {!isRecording && !hasRecording && (
        <Button
          size="lg"
          onClick={onStartRecording}
          className="rounded-full w-20 h-20 bg-red-500 hover:bg-red-600"
        >
          <Mic className="w-8 h-8" />
        </Button>
      )}

      {isRecording && (
        <Button
          size="lg"
          onClick={onStopRecording}
          className="rounded-full w-20 h-20 bg-red-500 hover:bg-red-600 animate-pulse"
        >
          <Square className="w-8 h-8" />
        </Button>
      )}

      {!isRecording && hasRecording && (
        <>
          <Button
            size="lg"
            onClick={isPlaying ? onPause : onPlay}
            className="rounded-full w-16 h-16"
          >
            {isPlaying ? (
              <Pause className="w-6 h-6" />
            ) : (
              <Play className="w-6 h-6" />
            )}
          </Button>
          <Button
            size="lg"
            onClick={onStartRecording}
            className="rounded-full w-16 h-16 bg-red-500 hover:bg-red-600"
          >
            <Mic className="w-6 h-6" />
          </Button>
        </>
      )}
    </div>
  )
}