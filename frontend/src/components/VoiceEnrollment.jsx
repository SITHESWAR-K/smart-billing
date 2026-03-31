import { useState, useEffect } from 'react'
import { Mic, CheckCircle, AlertCircle, Loader2, Volume2 } from 'lucide-react'
import { extractVoiceSignature } from '../utils/voiceSignature'

const VoiceEnrollment = ({ dailyCode, onEnrollmentComplete, onSkip }) => {
  const [stage, setStage] = useState('ready') // ready, recording, processing, success, error
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')
  const [countdown, setCountdown] = useState(3)

  const startEnrollment = async () => {
    setStage('countdown')
    setError('')
    
    // Countdown before recording
    for (let i = 3; i > 0; i--) {
      setCountdown(i)
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
    
    setStage('recording')
    setProgress(0)
    
    try {
      // Record for 4 seconds while user reads the daily code
      const signature = await extractVoiceSignature(4000, (p) => setProgress(p))
      
      setStage('processing')
      
      // Small delay for UX
      await new Promise(resolve => setTimeout(resolve, 500))
      
      setStage('success')
      
      // Wait a moment then complete
      setTimeout(() => {
        onEnrollmentComplete(signature)
      }, 1500)
      
    } catch (err) {
      console.error('Enrollment failed:', err)
      setError(err.message || 'Voice enrollment failed. Please try again.')
      setStage('error')
    }
  }

  const retry = () => {
    setStage('ready')
    setError('')
    setProgress(0)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Volume2 size={32} className="text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800">Voice Enrollment</h2>
          <p className="text-gray-600 mt-2">
            Read the daily code aloud to register your voice
          </p>
        </div>

        {/* Daily Code Display */}
        <div className="bg-gradient-to-r from-emerald-50 to-blue-50 border-2 border-emerald-200 rounded-xl p-6 mb-6">
          <p className="text-sm text-emerald-700 text-center mb-2">Today's Code</p>
          <p className="text-4xl font-bold font-mono tracking-widest text-center text-emerald-800">
            {dailyCode || 'LOADING'}
          </p>
        </div>

        {/* Stage: Ready */}
        {stage === 'ready' && (
          <div className="text-center">
            <p className="text-gray-600 mb-6">
              Click the button below, then <strong>read the code aloud clearly</strong>. 
              This registers your voice for today's session.
            </p>
            <button
              onClick={startEnrollment}
              className="w-full bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-600 hover:to-blue-600 text-white font-bold py-4 px-6 rounded-xl flex items-center justify-center gap-3 transition shadow-lg"
            >
              <Mic size={24} />
              Start Voice Enrollment
            </button>
            <button
              onClick={onSkip}
              className="w-full mt-3 text-gray-500 hover:text-gray-700 py-2 transition"
            >
              Skip for now
            </button>
          </div>
        )}

        {/* Stage: Countdown */}
        {stage === 'countdown' && (
          <div className="text-center">
            <div className="w-24 h-24 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
              <span className="text-5xl font-bold text-white">{countdown}</span>
            </div>
            <p className="text-lg text-gray-600">Get ready to read the code...</p>
          </div>
        )}

        {/* Stage: Recording */}
        {stage === 'recording' && (
          <div className="text-center">
            <div className="w-24 h-24 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
              <Mic size={40} className="text-white" />
            </div>
            <p className="text-lg font-semibold text-red-600 mb-4">🎤 Recording...</p>
            <p className="text-gray-600 mb-4">
              Read aloud: <strong className="text-emerald-700">{dailyCode}</strong>
            </p>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-emerald-500 to-blue-500 h-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-sm text-gray-500 mt-2">{progress}%</p>
          </div>
        )}

        {/* Stage: Processing */}
        {stage === 'processing' && (
          <div className="text-center">
            <Loader2 size={48} className="text-emerald-500 animate-spin mx-auto mb-4" />
            <p className="text-lg text-gray-600">Processing your voice...</p>
          </div>
        )}

        {/* Stage: Success */}
        {stage === 'success' && (
          <div className="text-center">
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={48} className="text-green-500" />
            </div>
            <p className="text-xl font-semibold text-green-600 mb-2">Voice Enrolled!</p>
            <p className="text-gray-600">
              Your voice has been registered for this session.
            </p>
          </div>
        )}

        {/* Stage: Error */}
        {stage === 'error' && (
          <div className="text-center">
            <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle size={48} className="text-red-500" />
            </div>
            <p className="text-lg font-semibold text-red-600 mb-2">Enrollment Failed</p>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={retry}
              className="w-full bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-600 hover:to-blue-600 text-white font-bold py-3 px-6 rounded-xl transition"
            >
              Try Again
            </button>
            <button
              onClick={onSkip}
              className="w-full mt-3 text-gray-500 hover:text-gray-700 py-2 transition"
            >
              Skip for now
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default VoiceEnrollment
