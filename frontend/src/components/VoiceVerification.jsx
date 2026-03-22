import { useState, useRef } from 'react'
import { Mic, Volume2 } from 'lucide-react'
import { PitchDetector, initAudioContext, setupAnalyser } from '../utils/pitchDetection'

const VoiceVerification = ({ onVerificationComplete }) => {
  const [isVerifying, setIsVerifying] = useState(false)
  const [pitchData, setPitchData] = useState(null)
  const [status, setStatus] = useState('')
  const audioContextRef = useRef(null)
  const analyserRef = useRef(null)
  const mediaStreamSourceRef = useRef(null)
  const detectorRef = useRef(null)
  const animationFrameRef = useRef(null)

  const startVerification = async () => {
    try {
      setIsVerifying(true)
      setStatus('Initializing audio...')

      const audioContext = await initAudioContext()
      audioContextRef.current = audioContext

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const source = audioContext.createMediaStreamSource(stream)
      mediaStreamSourceRef.current = source

      const { analyser, bufferLength, dataArray } = setupAnalyser(audioContext, source)
      analyserRef.current = analyser

      const detector = new PitchDetector(audioContext, analyser, bufferLength, dataArray)
      detectorRef.current = detector

      setStatus('Listening for pitch... Speak steadily for 3 seconds')

      const frequencies = []
      let frameCount = 0
      const maxFrames = audioContext.sampleRate / 2048 * 3 // 3 seconds

      const analyzePitch = () => {
        const pitchInfo = detector.detectPitch()
        if (pitchInfo.frequency > 0) {
          frequencies.push(pitchInfo.frequency)
        }
        frameCount++

        if (frameCount < maxFrames) {
          animationFrameRef.current = requestAnimationFrame(analyzePitch)
        } else {
          finalizeMeasurement(frequencies)
        }
      }

      analyzePitch()
    } catch (error) {
      setStatus('Error: ' + error.message)
      setIsVerifying(false)
    }
  }

  const finalizeMeasurement = (frequencies) => {
    if (frequencies.length > 0) {
      const avgFrequency = frequencies.reduce((a, b) => a + b) / frequencies.length
      setPitchData({
        frequency: Math.round(avgFrequency),
        magnitude: frequencies.length
      })
      setStatus('Verification complete!')
      onVerificationComplete({
        frequency: Math.round(avgFrequency),
        timestamp: new Date()
      })
    } else {
      setStatus('No pitch detected. Please try again.')
    }

    stopVerification()
  }

  const stopVerification = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }
    if (mediaStreamSourceRef.current?.mediaStream) {
      mediaStreamSourceRef.current.mediaStream.getTracks().forEach(track => track.stop())
    }
    setIsVerifying(false)
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <button
        onClick={startVerification}
        disabled={isVerifying}
        className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg transition"
      >
        <Mic size={20} />
        {isVerifying ? 'Listening...' : 'Start Verification'}
      </button>

      {status && (
        <p className="text-center text-sm text-gray-600">{status}</p>
      )}

      {pitchData && (
        <div className="bg-green-50 border-2 border-green-500 p-4 rounded-lg text-center">
          <div className="flex items-center justify-center gap-2 text-green-600 font-semibold mb-2">
            <Volume2 size={20} />
            Pitch Detected
          </div>
          <p className="text-2xl font-bold text-green-700">{pitchData.frequency} Hz</p>
        </div>
      )}
    </div>
  )
}

export default VoiceVerification