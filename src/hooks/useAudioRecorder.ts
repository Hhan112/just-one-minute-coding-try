import { useState, useRef, useCallback } from 'react'

interface UseAudioRecorderReturn {
  audioBlob: Blob | null
  audioUrl: string | null
  isRecording: boolean
  recordingTime: number
  startRecording: () => Promise<void>
  stopRecording: () => void
  playAudio: () => void
  pauseAudio: () => void
  resetAudio: () => void
  getBase64: () => Promise<string | null>
}

export function useAudioRecorder(): UseAudioRecorderReturn {
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const audioElementRef = useRef<HTMLAudioElement | null>(null)
  const timerRef = useRef<number | null>(null)

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' })
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        setAudioBlob(blob)
        setAudioUrl(URL.createObjectURL(blob))
        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorder.start(100)
      setIsRecording(true)
      setRecordingTime(0)

      timerRef.current = window.setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)
    } catch (error) {
      console.error('Failed to start recording:', error)
    }
  }, [])

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [isRecording])

  const playAudio = useCallback(() => {
    if (audioUrl && !audioElementRef.current) {
      audioElementRef.current = new Audio(audioUrl)
      audioElementRef.current.play()
    } else if (audioElementRef.current) {
      audioElementRef.current.play()
    }
  }, [audioUrl])

  const pauseAudio = useCallback(() => {
    if (audioElementRef.current) {
      audioElementRef.current.pause()
    }
  }, [])

  const resetAudio = useCallback(() => {
    if (audioElementRef.current) {
      audioElementRef.current.pause()
      audioElementRef.current = null
    }
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl)
    }
    setAudioBlob(null)
    setAudioUrl(null)
    setRecordingTime(0)
  }, [audioUrl])

  const getBase64 = useCallback((): Promise<string | null> => {
    return new Promise((resolve) => {
      if (!audioBlob) {
        resolve(null)
        return
      }
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.readAsDataURL(audioBlob)
    })
  }, [audioBlob])

  return {
    audioBlob,
    audioUrl,
    isRecording,
    recordingTime,
    startRecording,
    stopRecording,
    playAudio,
    pauseAudio,
    resetAudio,
    getBase64,
  }
}