import { useState, useRef, useEffect } from 'react'

const PinInput = ({ onComplete, disabled = false }) => {
  const [pin, setPin] = useState(['', '', '', ''])
  const [hasError, setHasError] = useState(false)
  const inputRefs = useRef([])

  useEffect(() => {
    // Focus first input on mount
    inputRefs.current[0]?.focus()
  }, [])

  const handleChange = (index, value) => {
    if (disabled) return
    if (!/^\d*$/.test(value)) return

    setHasError(false)
    const newPin = [...pin]
    newPin[index] = value.slice(-1) // Only take last character

    setPin(newPin)

    if (value && index < 3) {
      inputRefs.current[index + 1]?.focus()
    }

    if (newPin.every(digit => digit !== '')) {
      onComplete(newPin.join(''))
    }
  }

  const handleKeyDown = (index, e) => {
    if (disabled) return
    
    if (e.key === 'Backspace') {
      if (!pin[index] && index > 0) {
        inputRefs.current[index - 1]?.focus()
      } else {
        const newPin = [...pin]
        newPin[index] = ''
        setPin(newPin)
      }
    }
  }

  const handlePaste = (e) => {
    if (disabled) return
    
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').slice(0, 4)
    
    if (/^\d{1,4}$/.test(pastedData)) {
      const newPin = pastedData.split('').concat(['', '', '', '']).slice(0, 4)
      setPin(newPin)
      
      if (pastedData.length === 4) {
        onComplete(pastedData)
      } else {
        inputRefs.current[pastedData.length]?.focus()
      }
    }
  }

  return (
    <div className="flex flex-col items-center">
      <div className="flex gap-3 justify-center mb-4">
        {pin.map((digit, index) => (
          <input
            key={index}
            ref={el => inputRefs.current[index] = el}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength="1"
            value={digit}
            onChange={e => handleChange(index, e.target.value)}
            onKeyDown={e => handleKeyDown(index, e)}
            onPaste={handlePaste}
            disabled={disabled}
            className={`w-14 h-16 text-center text-3xl font-bold rounded-xl border-2 transition-all
              ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}
              ${hasError 
                ? 'border-red-500 bg-red-50 animate-shake' 
                : digit 
                  ? 'border-indigo-500 bg-indigo-50' 
                  : 'border-gray-300 focus:border-indigo-500 focus:bg-indigo-50'
              }
              focus:outline-none focus:ring-2 focus:ring-indigo-200
            `}
            style={{ caretColor: 'transparent' }}
          />
        ))}
      </div>
      <p className="text-gray-500 text-sm">Enter 4-digit PIN</p>
    </div>
  )
}

export default PinInput