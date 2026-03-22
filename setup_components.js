const fs = require('fs');
const path = require('path');

const basePath = path.join(__dirname, 'frontend', 'src');

const componentFiles = {
  'components/ProtectedRoute.jsx': `import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const ProtectedRoute = ({ children }) => {
  const { auth } = useAuth()
  
  if (!auth) {
    return <Navigate to="/login" replace />
  }
  
  return children
}

export default ProtectedRoute`,

  'components/Navbar.jsx': `import { Link } from 'react-router-dom'
import { LogOut, Home as HomeIcon } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const Navbar = () => {
  const { auth, logout } = useAuth()
  
  if (!auth) return null
  
  return (
    <nav className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link to="/dashboard" className="flex items-center gap-2 font-bold text-xl hover:opacity-80">
            <HomeIcon size={28} />
            Smart Billing
          </Link>
          {auth && (
            <div className="hidden sm:flex gap-6">
              <Link to="/dashboard" className="hover:opacity-80 transition">Dashboard</Link>
              <Link to="/products" className="hover:opacity-80 transition">Products</Link>
              <Link to="/billing" className="hover:opacity-80 transition">Billing</Link>
              <Link to="/bills" className="hover:opacity-80 transition">View Bills</Link>
            </div>
          )}
        </div>
        {auth && (
          <div className="flex items-center gap-4">
            <div className="text-sm">
              <p className="font-semibold">{auth.name}</p>
              <p className="text-indigo-100">{auth.role}</p>
            </div>
            <button
              onClick={logout}
              className="flex items-center gap-2 bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg transition"
            >
              <LogOut size={18} />
              Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  )
}

export default Navbar`,

  'components/DailyCode.jsx': `import { useState, useEffect } from 'react'
import { generateDailyCode, getDailyCodeTimeRemaining } from '../utils/generateDailyCode'
import { RefreshCw } from 'lucide-react'

const DailyCode = () => {
  const [code, setCode] = useState('')
  const [timeRemaining, setTimeRemaining] = useState({ hours: 0, minutes: 0 })

  useEffect(() => {
    setCode(generateDailyCode())
    updateTimeRemaining()

    const interval = setInterval(updateTimeRemaining, 60000)
    return () => clearInterval(interval)
  }, [])

  const updateTimeRemaining = () => {
    setTimeRemaining(getDailyCodeTimeRemaining())
  }

  return (
    <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white p-6 rounded-lg shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Daily Code</h3>
        <button
          onClick={() => setCode(generateDailyCode())}
          className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition"
        >
          <RefreshCw size={20} />
        </button>
      </div>
      <p className="text-5xl font-bold font-mono tracking-widest mb-4">{code}</p>
      <p className="text-blue-100">
        Changes in {timeRemaining.hours}h {timeRemaining.minutes}m
      </p>
    </div>
  )
}

export default DailyCode`,

  'components/PinInput.jsx': `import { useState, useRef } from 'react'

const PinInput = ({ onComplete, error }) => {
  const [pin, setPin] = useState(['', '', '', ''])
  const inputRefs = useRef([])

  const handleChange = (index, value) => {
    if (!/^\\d*$/.test(value)) return

    const newPin = [...pin]
    newPin[index] = value

    setPin(newPin)

    if (value && index < 3) {
      inputRefs.current[index + 1]?.focus()
    }

    if (newPin.every(digit => digit !== '')) {
      onComplete(newPin.join(''))
    }
  }

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  return (
    <div>
      <div className="flex gap-4 justify-center mb-4">
        {pin.map((digit, index) => (
          <input
            key={index}
            ref={el => inputRefs.current[index] = el}
            type="password"
            maxLength="1"
            value={digit}
            onChange={e => handleChange(index, e.target.value)}
            onKeyDown={e => handleKeyDown(index, e)}
            className={\`w-16 h-16 text-center text-3xl font-bold rounded-lg border-2 transition \${
              error ? 'border-red-500 bg-red-50' : 'border-gray-300 focus:border-indigo-500 focus:outline-none'
            }\`}
          />
        ))}
      </div>
      {error && <p className="text-red-500 text-center text-sm">{error}</p>}
    </div>
  )
}

export default PinInput`,

  'components/VoiceRecorder.jsx': `import { useState, useRef } from 'react'
import { Mic, Square } from 'lucide-react'

const VoiceRecorder = ({ onRecordingComplete, isRecording: parentIsRecording }) => {
  const [isRecording, setIsRecording] = useState(false)
  const [audioURL, setAudioURL] = useState(null)
  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data)
      }

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' })
        const url = URL.createObjectURL(audioBlob)
        setAudioURL(url)
        onRecordingComplete(audioBlob)
        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorder.start()
      setIsRecording(true)
    } catch (error) {
      console.error('Error accessing microphone:', error)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex gap-4">
        <button
          onClick={startRecording}
          disabled={isRecording || parentIsRecording}
          className="flex items-center gap-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg transition"
        >
          <Mic size={20} />
          Record
        </button>
        <button
          onClick={stopRecording}
          disabled={!isRecording}
          className="flex items-center gap-2 bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg transition"
        >
          <Square size={20} />
          Stop
        </button>
      </div>
      {audioURL && (
        <audio controls src={audioURL} className="mt-4 w-full max-w-sm" />
      )}
    </div>
  )
}

export default VoiceRecorder`,

  'components/VoiceVerification.jsx': `import { useState, useRef } from 'react'
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

export default VoiceVerification`,

  'components/ProductCard.jsx': `import { Edit2, Trash2 } from 'lucide-react'

const ProductCard = ({ product, onEdit, onDelete }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition">
      <h3 className="font-semibold text-lg mb-2">{product.name}</h3>
      <p className="text-gray-600 text-sm mb-4">{product.description}</p>
      <div className="flex justify-between items-center mb-4">
        <span className="text-2xl font-bold text-indigo-600">₹{product.price}</span>
        <span className="text-xs bg-gray-100 text-gray-700 px-3 py-1 rounded-full">
          {product.category}
        </span>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => onEdit(product)}
          className="flex-1 flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition"
        >
          <Edit2 size={16} />
          Edit
        </button>
        <button
          onClick={() => onDelete(product.id)}
          className="flex-1 flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition"
        >
          <Trash2 size={16} />
          Delete
        </button>
      </div>
    </div>
  )
}

export default ProductCard`,

  'components/BillItem.jsx': `import { Trash2 } from 'lucide-react'

const BillItem = ({ item, onQuantityChange, onRemove }) => {
  return (
    <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg border border-gray-200">
      <div className="flex-1">
        <p className="font-semibold">{item.productName}</p>
        <p className="text-sm text-gray-600">₹{item.price} each</p>
      </div>
      <div className="flex items-center gap-3 mx-4">
        <button
          onClick={() => onQuantityChange(item.productId, item.quantity - 1)}
          className="px-2 py-1 bg-gray-300 hover:bg-gray-400 rounded"
        >
          -
        </button>
        <span className="font-semibold w-8 text-center">{item.quantity}</span>
        <button
          onClick={() => onQuantityChange(item.productId, item.quantity + 1)}
          className="px-2 py-1 bg-gray-300 hover:bg-gray-400 rounded"
        >
          +
        </button>
      </div>
      <div className="text-right">
        <p className="font-bold text-lg">₹{(item.price * item.quantity).toFixed(2)}</p>
      </div>
      <button
        onClick={() => onRemove(item.productId)}
        className="ml-4 p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
      >
        <Trash2 size={20} />
      </button>
    </div>
  )
}

export default BillItem`
};

console.log('Creating component files...');
Object.entries(componentFiles).forEach(([filePath, content]) => {
  const fullPath = path.join(basePath, filePath);
  const dir = path.dirname(fullPath);
  
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  fs.writeFileSync(fullPath, content);
  console.log(`Created: src/${filePath}`);
});

console.log('\n✅ Component files created!');
