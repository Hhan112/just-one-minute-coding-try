interface TranscriptionDisplayProps {
  transcript: string
  interimTranscript: string
  isListening: boolean
}

export function TranscriptionDisplay({
  transcript,
  interimTranscript,
  isListening,
}: TranscriptionDisplayProps) {
  const hasContent = transcript || interimTranscript

  return (
    <div className="w-full max-w-lg mx-auto">
      <div className="min-h-[120px] p-4 bg-gray-50 rounded-lg border border-gray-200">
        {hasContent ? (
          <div className="text-gray-800 leading-relaxed">
            <span>{transcript}</span>
            {interimTranscript && (
              <span className="text-gray-400 italic">{interimTranscript}</span>
            )}
          </div>
        ) : (
          <div className="text-gray-400 text-center">
            {isListening ? (
              'Listening... speak now'
            ) : (
              'Your speech will appear here'
            )}
          </div>
        )}
      </div>
    </div>
  )
}