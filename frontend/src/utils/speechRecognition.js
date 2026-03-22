// Web Speech API - FREE browser-based speech recognition
// Supports multiple languages including English, Tamil, Hindi

export class SpeechRecognizer {
  constructor(options = {}) {
    this.lang = options.lang || 'en-IN' // Default to Indian English
    this.continuous = options.continuous || false
    this.interimResults = options.interimResults || true
    this.recognition = null
    this.isListening = false
    this.onResult = options.onResult || (() => {})
    this.onError = options.onError || (() => {})
    this.onEnd = options.onEnd || (() => {})
    this.onStart = options.onStart || (() => {})
  }

  isSupported() {
    return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window
  }

  init() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    
    if (!SpeechRecognition) {
      throw new Error('Speech Recognition not supported in this browser. Please use Chrome or Edge.')
    }

    this.recognition = new SpeechRecognition()
    this.recognition.lang = this.lang
    this.recognition.continuous = this.continuous
    this.recognition.interimResults = this.interimResults

    this.recognition.onstart = () => {
      this.isListening = true
      this.onStart()
    }

    this.recognition.onresult = (event) => {
      let finalTranscript = ''
      let interimTranscript = ''

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          finalTranscript += transcript
        } else {
          interimTranscript += transcript
        }
      }

      this.onResult({
        final: finalTranscript,
        interim: interimTranscript,
        isFinal: finalTranscript.length > 0
      })
    }

    this.recognition.onerror = (event) => {
      this.isListening = false
      this.onError(event.error)
    }

    this.recognition.onend = () => {
      this.isListening = false
      this.onEnd()
    }

    return this
  }

  start() {
    if (!this.recognition) {
      this.init()
    }
    this.recognition.start()
  }

  stop() {
    if (this.recognition) {
      this.recognition.stop()
    }
  }

  abort() {
    if (this.recognition) {
      this.recognition.abort()
    }
  }

  setLanguage(lang) {
    this.lang = lang
    if (this.recognition) {
      this.recognition.lang = lang
    }
  }
}

// Parse spoken product info
// Examples: "rice 50 rupees", "Sugar 2 kg 80 rupees", "Amul butter 55", "Wheat ₹50"
// "rice 2 kg 2 pieces" - for quantity
export const parseProductFromSpeech = (text) => {
  const lowerText = text.toLowerCase().trim()
  
  // Extract price (looks for various formats)
  let price = null
  const pricePatterns = [
    /₹\s*(\d+(?:\.\d+)?)/i,                    // ₹50 or ₹ 50
    /(\d+(?:\.\d+)?)\s*₹/i,                    // 50₹
    /(\d+(?:\.\d+)?)\s*(?:rupees?|rs\.?)/i,   // 50 rupees, 50 rs, 50rs
    /(?:rupees?|rs\.?)\s*(\d+(?:\.\d+)?)/i,   // rupees 50, rs 50
    /price\s*(?:is)?\s*(\d+(?:\.\d+)?)/i,     // price is 50
    /(?:for|at|costs?|worth)\s*₹?\s*(\d+(?:\.\d+)?)/i, // for 50, at 50
    /(\d+(?:\.\d+)?)\s*(?:only)?$/i           // 50 at the end
  ]
  
  for (const pattern of pricePatterns) {
    const match = lowerText.match(pattern)
    if (match) {
      price = parseFloat(match[1])
      break
    }
  }

  // Extract quantity - look for the LAST number with units
  let quantity = 1
  const quantityPatterns = [
    /(\d+(?:\.\d+)?)\s*(?:kg|kilo|kilogram|kilos)/i,
    /(\d+(?:\.\d+)?)\s*(?:g|gram|grams)/i,
    /(\d+(?:\.\d+)?)\s*(?:l|liter|litre|litres)/i,
    /(\d+(?:\.\d+)?)\s*(?:ml|milliliter)/i,
    /(\d+(?:\.\d+)?)\s*(?:pieces?|pcs?|units?|items?|packets?|pack)/i,
    /quantity\s*(?:is)?\s*(\d+(?:\.\d+)?)/i
  ]
  
  // Find all quantity matches and use the last one
  let allQuantities = []
  for (const pattern of quantityPatterns) {
    let match
    const regex = new RegExp(pattern, 'gi')
    while ((match = regex.exec(lowerText)) !== null) {
      allQuantities.push(parseFloat(match[1]))
    }
  }
  
  // If we have multiple quantities, use the last one (e.g., "2 kg 2 pieces" -> 2 pieces)
  if (allQuantities.length > 0) {
    quantity = allQuantities[allQuantities.length - 1]
  }

  // Extract product name (remove price and quantity mentions)
  let name = text
    // Remove price patterns
    .replace(/₹\s*\d+(?:\.\d+)?/gi, '')
    .replace(/\d+(?:\.\d+)?\s*₹/gi, '')
    .replace(/(\d+(?:\.\d+)?)\s*(?:rupees?|rs\.?)/gi, '')
    .replace(/(?:rupees?|rs\.?)\s*(\d+(?:\.\d+)?)/gi, '')
    .replace(/price\s*(?:is)?\s*(\d+(?:\.\d+)?)/gi, '')
    .replace(/(?:for|at|costs?|worth)\s*₹?\s*(\d+(?:\.\d+)?)/gi, '')
    // Remove quantity patterns
    .replace(/(\d+(?:\.\d+)?)\s*(?:kg|kilo|kilogram|kilos|g|gram|grams|l|liter|litre|litres|ml|milliliter|pieces?|pcs?|units?|items?|packets?|pack)/gi, '')
    .replace(/quantity\s*(?:is)?\s*(\d+(?:\.\d+)?)/gi, '')
    // Remove trailing numbers and punctuation
    .replace(/\d+(?:\.\d+)?\s*$/g, '')
    .replace(/[.,!?]+$/g, '')
    // Remove "only" at end
    .replace(/\s+only\s*$/gi, '')
    .replace(/\s+/g, ' ')
    .trim()

  // Capitalize first letter of each word
  name = name.split(' ')
    .filter(word => word.length > 0)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')

  return {
    name: name || null,
    price,
    quantity
  }
}

// Common product synonyms (Tamil/Hindi to English)
export const productSynonyms = {
  'arisi': 'Rice',
  'chawal': 'Rice',
  'சாதம்': 'Rice',
  'sakkarai': 'Sugar',
  'cheeni': 'Sugar',
  'சர்க்கரை': 'Sugar',
  'paal': 'Milk',
  'doodh': 'Milk',
  'பால்': 'Milk',
  'thayir': 'Curd',
  'dahi': 'Curd',
  'தயிர்': 'Curd',
  'vengayam': 'Onion',
  'pyaz': 'Onion',
  'வெங்காயம்': 'Onion',
  'urulai': 'Potato',
  'aloo': 'Potato',
  'உருளை': 'Potato',
  'thakkali': 'Tomato',
  'tamatar': 'Tomato',
  'தக்காளி': 'Tomato',
  'muttai': 'Egg',
  'anda': 'Egg',
  'முட்டை': 'Egg',
  'enna': 'Oil',
  'tel': 'Oil',
  'எண்ணெய்': 'Oil',
  'maavu': 'Flour',
  'atta': 'Flour',
  'மாவு': 'Flour',
  'uppu': 'Salt',
  'namak': 'Salt',
  'உப்பு': 'Salt'
}

// Translate common regional words to English
export const translateToEnglish = (text) => {
  let result = text
  for (const [regional, english] of Object.entries(productSynonyms)) {
    const regex = new RegExp(regional, 'gi')
    result = result.replace(regex, english)
  }
  return result
}

// Supported languages
export const supportedLanguages = [
  { code: 'en-IN', name: 'English (India)' },
  { code: 'en-US', name: 'English (US)' },
  { code: 'ta-IN', name: 'Tamil' },
  { code: 'hi-IN', name: 'Hindi' },
  { code: 'te-IN', name: 'Telugu' },
  { code: 'kn-IN', name: 'Kannada' },
  { code: 'ml-IN', name: 'Malayalam' },
  { code: 'mr-IN', name: 'Marathi' },
  { code: 'bn-IN', name: 'Bengali' },
  { code: 'gu-IN', name: 'Gujarati' }
]
