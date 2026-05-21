import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Progress } from '../components/ui/Progress'
import { TopicDisplay } from '../components/practice/TopicDisplay'
import { Timer } from '../components/practice/Timer'
import { RecordingControls } from '../components/practice/RecordingControls'
import { SpeakingIndicator } from '../components/practice/SpeakingIndicator'
import { TranscriptionDisplay } from '../components/practice/TranscriptionDisplay'
import { KeywordCanvas } from '../components/practice/KeywordCanvas'
import { KeywordInput } from '../components/practice/KeywordInput'
import { usePracticeStore, useUserStore } from '../stores/practiceStore'
import { useAuthStore } from '../stores/authStore'
import { syncService } from '../stores/syncService'
import { useSpeechRecognition } from '../hooks/useSpeechRecognition'
import { useAudioRecorder } from '../hooks/useAudioRecorder'
import { useTimer } from '../hooks/useTimer'
import { getRandomTopic } from '../data/topics'
import { RoundData } from '../types/practice'
import { Mic, ArrowRight, Pencil, Type, Volume2, Eye, BookOpen } from 'lucide-react'

type PracticeStep = 'topic' | 'intro' | 'record' | 'prep'

export default function PracticePage() {
  const navigate = useNavigate()
  const { selectedTopic, startPractice, currentRound, rounds, saveRound, nextRound, resetPractice } = usePracticeStore()
  const { recordCheckIn } = useUserStore()

  const [step, setStep] = useState<PracticeStep>('topic')
  const [keywords, setKeywords] = useState('')
  const [keywordCanvas, setKeywordCanvas] = useState('')
  const [previousTranscript, setPreviousTranscript] = useState('')
  const [inputMode, setInputMode] = useState<'draw' | 'type'>('type')
  const [isRecordingActive, setIsRecordingActive] = useState(false)

  const speech = useSpeechRecognition()
  const recorder = useAudioRecorder()
  const timer = useTimer()

  useEffect(() => {
    if (!selectedTopic) {
      const topic = getRandomTopic()
      startPractice(topic)
    }
  }, [selectedTopic, startPractice])

  useEffect(() => {
    if (timer.timeLeft === 0 && timer.isRunning) {
      handleStopRecording()
    }
  }, [timer.timeLeft, timer.isRunning])

  const handleProceedToIntro = () => {
    setStep('intro')
  }

  const handleStartRecording = async () => {
    setStep('record')
    setIsRecordingActive(true)
    await recorder.startRecording()
    speech.startListening()
    timer.start(60)
  }

  const handleStopRecording = useCallback(() => {
    recorder.stopRecording()
    speech.stopListening()
    timer.stop()
    setIsRecordingActive(false)
    // IMPORTANT: Save the round data when recording stops (timer or manual)
    handleSaveRound()
    setStep('prep')
  }, [recorder, speech, timer])

  const handleSaveRound = useCallback(async () => {
    const audioBase64 = await recorder.getBase64()

    const roundData: RoundData = {
      roundNumber: currentRound,
      audioBlob: audioBase64 || '',
      audioDuration: recorder.recordingTime,
      transcript: speech.transcript,
      interimTranscript: speech.interimTranscript,
      keywords: currentRound > 1 ? keywords : undefined,
      keywordCanvas: currentRound > 1 ? keywordCanvas : undefined,
      timestamp: Date.now(),
    }

    console.log(`[handleSaveRound] Saving round ${currentRound}:`, {
      hasAudio: !!audioBase64,
      transcriptLength: speech.transcript.length,
      audioDuration: recorder.recordingTime
    })
    saveRound(currentRound - 1, roundData)
    setPreviousTranscript(speech.transcript)
  }, [currentRound, recorder, speech, keywords, keywordCanvas, saveRound])

  const handleNextRound = async () => {
    console.log(`[handleNextRound] Called for round ${currentRound}`)

    // Save current round before transitioning
    await handleSaveRound()

    if (currentRound < 3) {
      nextRound()
      setStep('intro')
      // Clear keywords for next round
      setKeywords('')
      setKeywordCanvas('')
      // Reset speech and recorder for next round
      speech.resetTranscript()
      recorder.resetAudio()
      timer.reset()
    }
  }

  const handleCompletePractice = async () => {
    console.log('=== handleCompletePractice called ===')

    // Step 1: Save the current (3rd) round data
    await handleSaveRound()
    console.log('handleSaveRound completed')

    // Step 2: Get fresh state directly from store
    const storeState = usePracticeStore.getState()
    console.log('[handleCompletePractice] Fresh rounds from store:', storeState.rounds)
    console.log('[handleCompletePractice] All rounds saved?:', storeState.rounds.every(r => r !== null))

    // Step 3: Complete the practice
    const session = storeState.completePractice()
    console.log('completePractice returned:', session)

    if (session) {
      console.log('Session created successfully, navigating to /review')
      recordCheckIn(session)

      // Sync to cloud if authenticated
      if (useAuthStore.getState().user) {
        syncService.pushSession(session).catch(console.error)
      }

      navigate('/review', { state: { session } })
    } else {
      console.error('FAILURE: completePractice returned null')
      console.log('selectedTopic:', storeState.selectedTopic)
      console.log('sessionStartTime:', storeState.sessionStartTime)
    }
  }

  const handleQuit = () => {
    resetPractice()
    navigate('/')
  }

  const roundProgress = ((currentRound - 1) / 3) * 100

  // Compute keywords to show during recording
  const getKeywordsForDisplay = () => {
    if (currentRound === 2) {
      return { text: keywords, canvas: keywordCanvas }
    } else if (currentRound === 3) {
      const prevRound = rounds[1]
      const r2Keywords = prevRound?.keywords || ''
      const r2Canvas = prevRound?.keywordCanvas || ''
      return {
        text: [r2Keywords, keywords].filter(Boolean).join('\n---\n'),
        canvas: keywordCanvas || r2Canvas
      }
    }
    return { text: '', canvas: '' }
  }

  const showKeywords = currentRound > 1 && isRecordingActive
  const keywordDisplay = getKeywordsForDisplay()

  if (!selectedTopic) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="p-4 border-b bg-white">
        <div className="max-w-xl mx-auto">
          <div className="flex items-center justify-between mb-2">
            <Button variant="ghost" size="sm" onClick={handleQuit}>
              Quit
            </Button>
            <span className="text-sm text-gray-500">
              Round {currentRound} of 3
            </span>
          </div>
          <Progress value={roundProgress + (step === 'record' ? 11 : step === 'prep' ? 22 : 0)} />
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-6">
        <AnimatePresence mode="wait">
          {step === 'topic' && (
            <motion.div
              key="topic"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full max-w-lg space-y-6"
            >
              <div className="text-center">
                <span className="text-sm text-blue-500 font-medium">IELTS Speaking Practice</span>
              </div>
              <TopicDisplay topic={selectedTopic} />
              <Card className="bg-amber-50 border-amber-200">
                <h3 className="font-medium text-amber-800 mb-2">Instructions:</h3>
                <ul className="text-amber-700 text-sm space-y-1">
                  <li>• Round 1: Speak freely for 1 minute about the topic</li>
                  <li>• Round 2: Write keywords, then speak with your notes</li>
                  <li>• Round 3: Add more details, speak for 1+ minute</li>
                </ul>
              </Card>
              <div className="text-center">
                <Button size="lg" onClick={handleProceedToIntro}>
                  Start Practice
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
            </motion.div>
          )}

          {step === 'intro' && (
            <motion.div
              key="intro"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full max-w-lg space-y-6"
            >
              <div className="text-center space-y-2">
                <span className="text-sm text-blue-500 font-medium">
                  {currentRound === 1 ? 'Round 1: Free Speaking' :
                   currentRound === 2 ? 'Round 2: With Keywords' :
                   'Round 3: Expand & Detail'}
                </span>
              </div>

              <TopicDisplay topic={selectedTopic} />

              {currentRound > 1 && previousTranscript && (
                <Card>
                  <h3 className="font-medium text-gray-700 mb-2">Your previous response:</h3>
                  <p className="text-gray-600 text-sm">{previousTranscript.slice(0, 200)}...</p>
                </Card>
              )}

              {currentRound > 1 && (
                <Card className="bg-blue-50 border-blue-200">
                  <h3 className="font-medium text-blue-800 mb-2">Preparation time:</h3>
                  <p className="text-blue-700 text-sm mb-4">
                    Write 3-5 keywords or draw a mind map to help you expand.
                  </p>
                  <div className="flex gap-2 mb-4">
                    <Button
                      variant={inputMode === 'type' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setInputMode('type')}
                    >
                      <Type className="w-4 h-4 mr-1" />
                      Type
                    </Button>
                    <Button
                      variant={inputMode === 'draw' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setInputMode('draw')}
                    >
                      <Pencil className="w-4 h-4 mr-1" />
                      Draw
                    </Button>
                  </div>
                  {inputMode === 'type' ? (
                    <KeywordInput
                      onSave={setKeywords}
                      initialValue={keywords}
                      placeholder="Enter keywords that will help you expand..."
                    />
                  ) : (
                    <KeywordCanvas onSave={setKeywordCanvas} initialValue={keywordCanvas} />
                  )}
                </Card>
              )}

              <div className="text-center">
                {currentRound === 1 ? (
                  <Button size="lg" onClick={handleStartRecording}>
                    <Mic className="w-5 h-5 mr-2" />
                    Start Speaking
                  </Button>
                ) : (
                  <Button size="lg" onClick={handleStartRecording}>
                    <Volume2 className="w-5 h-5 mr-2" />
                    Start Speaking
                  </Button>
                )}
              </div>
            </motion.div>
          )}

          {step === 'record' && (
            <motion.div
              key="record"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full max-w-lg space-y-6"
            >
              {/* 显示话题 */}
              <Card className="bg-slate-50 border-slate-200">
                <div className="flex items-center gap-2 mb-1">
                  <BookOpen className="w-4 h-4 text-slate-600" />
                  <span className="text-xs font-medium text-slate-600">TOPIC</span>
                </div>
                <h3 className="font-semibold text-slate-800">{selectedTopic.title}</h3>
              </Card>

              {/* 显示关键词（第二轮和第三轮）- 全程显示 */}
              {showKeywords && (keywordDisplay.text || keywordDisplay.canvas) && (
                <Card className="bg-yellow-50 border-yellow-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Eye className="w-4 h-4 text-yellow-600" />
                    <span className="text-sm font-medium text-yellow-800">
                      {currentRound === 2 ? 'Your Keywords:' : 'Keywords from Round 2 & 3:'}
                    </span>
                  </div>
                  {keywordDisplay.text && (
                    <p className="text-yellow-700 whitespace-pre-wrap text-sm">{keywordDisplay.text}</p>
                  )}
                  {keywordDisplay.canvas && (
                    <img src={keywordDisplay.canvas} alt="Keywords canvas" className="max-h-24 mt-2 rounded border border-yellow-200" />
                  )}
                </Card>
              )}

              <div className="text-center">
                <h2 className="text-xl font-semibold text-gray-800 mb-2">
                  {currentRound === 1 ? 'Speak freely for 1 minute' : 'Speak with your keywords'}
                </h2>
                <SpeakingIndicator isListening={speech.isListening} />
              </div>

              <div className="flex justify-center">
                <Timer timeLeft={timer.timeLeft} total={60} isRunning={timer.isRunning} />
              </div>

              <TranscriptionDisplay
                transcript={speech.transcript}
                interimTranscript={speech.interimTranscript}
                isListening={speech.isListening}
              />

              <div className="flex justify-center">
                <RecordingControls
                  isRecording={recorder.isRecording}
                  isPlaying={false}
                  hasRecording={false}
                  onStartRecording={handleStartRecording}
                  onStopRecording={handleStopRecording}
                  onPlay={() => {}}
                  onPause={() => {}}
                />
              </div>

              {timer.timeLeft < 60 && (
                <div className="text-center">
                  <Button variant="outline" onClick={handleStopRecording}>
                    Finish Early
                  </Button>
                </div>
              )}
            </motion.div>
          )}

          {step === 'prep' && (
            <motion.div
              key="prep"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full max-w-lg space-y-6"
            >
              <Card className="text-center space-y-4">
                <div className="text-4xl">
                  {currentRound < 3 ? '✅' : '🎉'}
                </div>
                <h2 className="text-xl font-semibold">
                  {currentRound < 3 ? `Round ${currentRound} Complete!` : 'All Rounds Complete!'}
                </h2>
                <p className="text-gray-600">
                  {recorder.recordingTime > 0 ? `${recorder.recordingTime} seconds recorded` : 'Recording saved'}
                </p>
                {speech.transcript && (
                  <div className="text-left bg-gray-50 p-3 rounded-lg max-h-40 overflow-y-auto">
                    <p className="text-sm text-gray-700">{speech.transcript}</p>
                  </div>
                )}
              </Card>

              {currentRound < 3 ? (
                <Button size="lg" className="w-full" onClick={handleNextRound}>
                  Next Round
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              ) : (
                <Button
                  size="lg"
                  className="w-full"
                  onClick={handleCompletePractice}
                >
                  Complete Practice
                </Button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  )
}