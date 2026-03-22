import { useState, useRef, useEffect } from 'react'
import { Mic, Square, Globe } from 'lucide-react'
import { SpeechRecognizer, supportedLanguages } from '../utils/speechRecognition'

const VoiceInput = ({ onTranscript, placeholder = "Click mic and speak..." }) => {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [interimTranscript, setInterimTranscript] = useState('')
  const [selectedLang, setSelectedLang] = useState('en-IN')
  const [error, setError] = useState('')
  const recognizerRef = useRef(null)

  useEffect(() => {
    return () => {
      if (recognizerRef.current) {
        recognizerRef.current.abort()
      }
    }
  }, [])

  const startListening = () => {
    setError('')
    try {
      const recognizer = new SpeechRecognizer({
        lang: selectedLang,
        continuous: true,
        interimResults: true,
        onStart: () => {
          setIsListening(true)
          setTranscript('')
          setInterimTranscript('')
        },
        onResult: (result) => {
          if (result.isFinal) {
            const newTranscript = transcript + ' ' + result.final
            setTranscript(newTranscript.trim())
            setInterimTranscript('')
            // Call parent callback with final result
            if (onTranscript) {
              onTranscript(newTranscript.trim())
            }
          } else {
            setInterimTranscript(result.interim)
          }
        },
        onError: (err) => {
          if (err === 'not-allowed') {
            setError('Please allow microphone access')
          } else if (err === 'no-speech') {
            setError('No speech detected. Try again.')
          }
          setIsListening(false)
        },
        onEnd: () => {
          setIsListening(false)
        }
      })

      recognizer.init()
      recognizer.start()
      recognizerRef.current = recognizer
    } catch (err) {
      setError('Speech recognition not supported. Use Chrome or Edge.')
    }
  }

  const stopListening = () => {
    if (recognizerRef.current) {
      recognizerRef.current.stop()
    }
  }

  const clear = () => {
    setTranscript('')
    setInterimTranscript('')
    if (onTranscript) {
      onTranscript('')
    }
  }

  return (
    <div className="w-full">
      <div className="flex items-center gap-2 mb-2">
        <select
          value={selectedLang}
          onChange={(e) => setSelectedLang(e.target.value)}
          className="text-sm border border-gray-300 rounded-lg px-2 py-1 focus:outline-none focus:border-indigo-500"
          disabled={isListening}
        >
          {supportedLanguages.slice(0, 5).map(lang => (
            <option key={lang.code} value={lang.code}>{lang.name}</option>
          ))}
        </select>
        
        {!isListening ? (
          <button
            type="button"
            onClick={startListening}
            className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg transition"
          >
            <Mic size={18} />
            Speak
          </button>
        ) : (
          <button
            type="button"
            onClick={stopListening}
            className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition animate-pulse"
          >
            <Square size={18} />
            Stop
          </button>
        )}

        {transcript && (
          <button
            type="button"
            onClick={clear}
            className="text-gray-500 hover:text-gray-700 text-sm"
          >
            Clear
          </button>
        )}
      </div>

      {/* Transcript display */}
      <div className={`p-3 rounded-lg border-2 min-h-[60px] ${isListening ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50'}`}>
        {transcript || interimTranscript ? (
          <p className="text-gray-800">
            {transcript}
            <span className="text-gray-400 italic">{interimTranscript}</span>
          </p>
        ) : (
          <p className="text-gray-400 italic">
            {isListening ? 'Listening... speak now' : placeholder}
          </p>
        )}
      </div>

      {error && (
        <p className="text-red-500 text-sm mt-1">{error}</p>
      )}

      {isListening && (
        <div className="flex items-center gap-2 mt-2 text-red-600 text-sm">
          <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
          Recording...
        </div>
      )}
    </div>
  )
}

export default VoiceInput
