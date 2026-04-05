import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, X, Mic, Square, Globe, ShieldCheck, ShieldX } from 'lucide-react'
import Navbar from '../components/Navbar'
import ProductCard from '../components/ProductCard'
import api from '../api/api'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { SpeechRecognizer, parseProductFromSpeech, translateToEnglish, supportedLanguages } from '../utils/speechRecognition'
import { getVoiceRecorder, compareSignatures } from '../utils/voiceSignature'

const PRODUCT_KEYWORDS = [
  'rice', 'sugar', 'milk', 'curd', 'yogurt', 'butter', 'ghee', 'oil', 'salt', 'tea', 'coffee',
  'flour', 'atta', 'soap', 'shampoo', 'biscuit', 'noodles', 'detergent', 'masala', 'dal',
  'toor', 'urad', 'chilli', 'turmeric', 'wheat', 'bread', 'eggs', 'juice'
]

const normalizeToken = (value) => value.toLowerCase().replace(/[^a-z0-9\s]/gi, '').trim()

const toTitleCase = (value) => value
  .split(' ')
  .filter(Boolean)
  .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
  .join(' ')

const deriveBrandAndName = (rawName, spokenText, existingBrand) => {
  const cleanedName = normalizeToken(rawName)
  if (!cleanedName) {
    return { productName: '', brandName: existingBrand || '' }
  }

  const explicitBrandMatch = spokenText.match(/\bbrand\s+(?:is\s+)?([a-z0-9\s]+)/i)
  if (explicitBrandMatch && explicitBrandMatch[1]) {
    return {
      productName: toTitleCase(cleanedName),
      brandName: toTitleCase(normalizeToken(explicitBrandMatch[1]))
    }
  }

  const words = cleanedName.split(' ').filter(Boolean)
  if (words.length < 2) {
    return { productName: toTitleCase(cleanedName), brandName: existingBrand || '' }
  }

  const keywordIndex = words.findIndex(word => PRODUCT_KEYWORDS.includes(word))
  if (keywordIndex > 0) {
    return {
      productName: toTitleCase(words.slice(keywordIndex).join(' ')),
      brandName: toTitleCase(words.slice(0, keywordIndex).join(' '))
    }
  }

  if (!existingBrand) {
    return {
      productName: toTitleCase(words.slice(1).join(' ')),
      brandName: toTitleCase(words[0])
    }
  }

  return { productName: toTitleCase(cleanedName), brandName: existingBrand }
}

const extractAlternativeNames = (spokenText, canonicalName) => {
  const lowerText = spokenText.toLowerCase()
  const hints = ['also called', 'aka', 'alias', 'alternative name', 'alternative names', 'called']
  const hint = hints.find(value => lowerText.includes(value))

  if (!hint) return []

  const segment = lowerText.split(hint)[1] || ''
  const canonical = normalizeToken(canonicalName)

  return Array.from(new Set(
    segment
      .split(/,|\/|\bor\b|\band\b/gi)
      .map(token => token.replace(/[^a-z0-9\s]/gi, '').trim())
      .filter(token => token && token.length > 1 && token !== canonical)
      .map(toTitleCase)
  )).slice(0, 8)
}

const mergeSynonymText = (existingText, extraList) => {
  const existingList = (existingText || '')
    .split(',')
    .map(value => value.trim())
    .filter(Boolean)

  const merged = Array.from(new Set([...existingList, ...extraList]))
  return merged.join(', ')
}

const splitProductSpeechChunks = (text = '') => text
  .split(/,|\band\b|\bthen\b|\bnext\b|\balso\b/gi)
  .map(part => part.trim())
  .filter(Boolean)

const Products = () => {
  const navigate = useNavigate()
  const { auth } = useAuth()
  const { t } = useLanguage()
  const [products, setProducts] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    price: '',
    quantity: '',
    synonyms: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [interimTranscript, setInterimTranscript] = useState('')
  const [selectedLang, setSelectedLang] = useState('en-IN')
  const recognizerRef = useRef(null)
  const listeningRef = useRef(false)

  // Voice verification states
  const [voiceVerified, setVoiceVerified] = useState(null)
  const [verificationEnabled, setVerificationEnabled] = useState(false)
  const lastVerificationRef = useRef(0)

  useEffect(() => {
    fetchProducts()

    // Cleanup speech recognition on unmount
    return () => {
      if (recognizerRef.current) {
        recognizerRef.current.abort()
      }
    }
  }, [])

  // Voice verification state
  const [storedSignature, setStoredSignature] = useState(null)
  
  // Check if voice verification is enabled
  useEffect(() => {
    const checkVoiceStatus = async () => {
      if (!auth?.shopkeeperId) return
      
      try {
        const response = await api.get(`/shopkeepers/${auth.shopkeeperId}/voice-status`)
        // Enable if voice signature exists (enrolled this session)
        if (response.data.hasVoiceEnrolled && response.data.voiceSignature) {
          setStoredSignature(response.data.voiceSignature)
          setVerificationEnabled(true)
          console.log('Products: Voice verification enabled')
        }
      } catch (err) {
        console.log('Voice verification not available')
      }
    }
    
    checkVoiceStatus()
  }, [auth])

  const fetchProducts = async () => {
    try {
      const response = await api.get(`/products/${auth.shopId}`)
      setProducts(response.data.products || [])
    } catch (err) {
      setError('Failed to fetch products')
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  // Verify voice using continuously captured audio
  const verifyVoiceBeforeAction = () => {
    if (!verificationEnabled || !auth?.shopkeeperId || !storedSignature) return true
    
    const voiceRecorder = getVoiceRecorder()
    const currentSignature = voiceRecorder.getSignature()
    
    if (!currentSignature) {
      console.log('No voice captured for verification')
      // If no voice captured, check if we have recent verification
      const now = Date.now()
      if (voiceVerified === true && now - lastVerificationRef.current < 30000) {
        return true
      }
      setError('Please speak louder for voice verification')
      return false
    }
    
    const similarity = compareSignatures(storedSignature, currentSignature)
    console.log(`Products voice verification: similarity = ${similarity}`)
    
    // With stretched cosine comparison, same speaker: 0.55-1.0, different: 0.20-0.50
    const verified = similarity >= 0.65
    setVoiceVerified(verified)
    lastVerificationRef.current = Date.now()
    
    if (!verified) {
      setError(`Voice not recognized (${Math.round(similarity * 100)}% match). Only the enrolled shopkeeper can use voice commands.`)
      return false
    }
    
    return true
  }

  const startListening = async () => {
    try {
      let silenceTimer = null;
      let lastTranscript = '';

      // Start continuous voice recording for verification
      const voiceRecorder = getVoiceRecorder()
      await voiceRecorder.start()
      console.log('Products: Voice recorder started')

      const recognizer = new SpeechRecognizer({
        lang: selectedLang,
        continuous: true,
        interimResults: true,
        onStart: () => {
          listeningRef.current = true
          setIsListening(true)
          setTranscript('')
          setInterimTranscript('')
          voiceRecorder.clear() // Clear previous voice data
        },
        onResult: (result) => {
          // Clear existing silence timer
          if (silenceTimer) clearTimeout(silenceTimer);

          if (result.isFinal) {
            const newTranscript = (transcript + ' ' + result.final).trim()
            setTranscript(newTranscript)
            setInterimTranscript('')
            lastTranscript = newTranscript

            // Start silence detection - if no speech for 1.5 seconds, process it
            silenceTimer = setTimeout(async () => {
              if (lastTranscript && recognizerRef.current) {
                await processWithAI(lastTranscript)
                setTranscript('')
                lastTranscript = ''
                voiceRecorder.clear() // Clear for next command
              }
            }, 1500) // 1.5 second pause detection
          } else {
            setInterimTranscript(result.interim)
          }
        },
        onError: (error) => {
          console.error('Speech error:', error)
          if (error === 'not-allowed') {
            setError('Microphone access denied. Please allow microphone access.')
          }
          listeningRef.current = false
          setIsListening(false)
          if (silenceTimer) clearTimeout(silenceTimer)
        },
        onEnd: () => {
          if (silenceTimer) clearTimeout(silenceTimer)
          // Process any remaining transcript
          if (lastTranscript) {
            processWithAI(lastTranscript)
            lastTranscript = ''
          }

          // Keep listening continuously until user stops manually.
          if (listeningRef.current && recognizerRef.current) {
            try {
              recognizerRef.current.start()
            } catch (e) {
              listeningRef.current = false
              setIsListening(false)
            }
          } else {
            setIsListening(false)
          }
        }
      })

      recognizer.init()
      recognizer.start()
      recognizerRef.current = recognizer
    } catch (err) {
      setError('Speech recognition not supported. Please use Chrome or Edge browser.')
    }
  }

  // Check if text is a price update command
  const isPriceUpdateCommand = (text) => {
    const lowerText = text.toLowerCase()
    const updatePatterns = [
      /\b(update|change|set|modify)\s+\w+\s+price/i,
      /\b\w+\s+price\s+\d+/i,
      /\b\w+\s+price\s+(to|is|now)\s+\d+/i,
      /\bprice\s+(of|for)\s+\w+/i,
      /\b\w+\s+ka\s+price/i, // Hindi: "rice ka price"
      /\b\w+\s+\d+\s*rupees?\b/i
    ]
    return updatePatterns.some(pattern => pattern.test(lowerText))
  }

  // Handle voice price update
  const handleVoicePriceUpdate = async (text) => {
    try {
      const response = await api.post('/ai-parse/update-price', {
        text,
        availableProducts: products.map(p => ({
          name: p.name,
          id: p.id,
          brand: p.brand,
          price: p.price,
          synonyms: p.synonyms
        }))
      })

      const { isUpdate, productName, newPrice } = response.data

      if (!isUpdate || !productName || newPrice === null) {
        return false
      }

      // Find the product
      const product = products.find(p => 
        p.name.toLowerCase() === productName.toLowerCase() ||
        (p.brand && `${p.brand} ${p.name}`.toLowerCase() === productName.toLowerCase())
      )

      if (!product) {
        setError(`Product "${productName}" not found`)
        return false
      }

      // Update the product price
      const updateData = {
        name: product.name,
        price: newPrice,
        quantity: product.quantity,
        brand: product.brand,
        synonyms: product.synonyms
      }

      await api.put(`/products/${auth.shopId}/${product.id}`, updateData)
      fetchProducts()
      
      setSuccessMsg(`✓ Updated ${product.name} price to ₹${newPrice}`)
      setTimeout(() => setSuccessMsg(''), 3000)
      return true
    } catch (error) {
      console.error('Price update failed:', error)
      return false
    }
  }

  const processChunkWithAI = async (text) => {
    if (!text || text.trim().length === 0) return

    // Voice verification before processing
    const verified = await verifyVoiceBeforeAction()
    if (!verified) {
      setError('⚠️ Voice not recognized - command ignored. Please try again.')
      return
    }

    // First check if this is a price update command
    if (isPriceUpdateCommand(text)) {
      const updated = await handleVoicePriceUpdate(text)
      if (updated) return
    }

    try {
      const response = await api.post('/ai-parse/product', { text })
      const parsed = response.data

      console.log('AI parsed:', parsed)

      const { productName, brandName } = deriveBrandAndName(parsed.name || formData.name, text, formData.brand)
      const altNames = extractAlternativeNames(text, productName)

      const newFormData = {
        name: productName || formData.name,
        price: parsed.price ? parsed.price.toString() : formData.price,
        quantity: parsed.quantity ? parsed.quantity.toString() : formData.quantity,
        brand: brandName || formData.brand,
        synonyms: mergeSynonymText(formData.synonyms, altNames)
      }

      setFormData(newFormData)

      // Auto-submit if we have name and price
      if (parsed.name && parsed.price) {
        await submitVoiceProduct(newFormData)
      }
    } catch (error) {
      console.error('AI parsing failed, using fallback:', error)
      fillFormFromSpeech(text)
    }
  }

  const processWithAI = async (text) => {
    if (!text || text.trim().length === 0) return

    // Verify voice before processing
    if (!verifyVoiceBeforeAction()) {
      console.log('Voice verification failed - blocking command')
      return
    }

    const chunks = splitProductSpeechChunks(text)
    for (const chunk of chunks) {
      await processChunkWithAI(chunk)
    }
  }

  const fillFormFromSpeech = (text) => {
    if (!text) return

    const translated = translateToEnglish(text)
    const parsed = parseProductFromSpeech(translated)

    console.log('Parsed from speech:', parsed) // Debug log

    const { productName, brandName } = deriveBrandAndName(parsed.name || formData.name, translated, formData.brand)
    const altNames = extractAlternativeNames(translated, productName)

    const newFormData = {
      name: productName || formData.name,
      price: parsed.price ? parsed.price.toString() : formData.price,
      quantity: parsed.quantity ? parsed.quantity.toString() : formData.quantity,
      brand: brandName || formData.brand,
      synonyms: mergeSynonymText(formData.synonyms, altNames)
    }

    setFormData(newFormData)

    // Auto-submit if we have name and price
    if (parsed.name && parsed.price) {
      setTimeout(() => {
        submitVoiceProduct(newFormData)
      }, 500)
    }
  }

  const submitVoiceProduct = async (data) => {
    if (!data.name || !data.price) return

    setLoading(true)
    setError('')

    try {
      const submitData = {
        name: data.name,
        price: parseFloat(data.price),
        quantity: parseFloat(data.quantity) || 1,
        brand: data.brand || null,
        synonyms: data.synonyms ? data.synonyms.split(',').map(s => s.trim()) : [],
        shop_id: auth.shopId
      }

      await api.post('/products', submitData)

      // Clear form but DON'T close it, keep voice active
      setFormData({ name: '', brand: '', price: '', quantity: '', synonyms: '' })
      setTranscript('')
      setInterimTranscript('')
      fetchProducts()

      // Show success message
      setSuccessMsg(`${t('added')} ${data.name}!`)
      setTimeout(() => setSuccessMsg(''), 3000)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save product')
    } finally {
      setLoading(false)
    }
  }

  const stopListening = () => {
    listeningRef.current = false
    if (recognizerRef.current) {
      recognizerRef.current.stop()
      setIsListening(false)

      // Stop the voice recorder
      const voiceRecorder = getVoiceRecorder()
      voiceRecorder.stop()

      // Parse the transcript and fill form
      const fullTranscript = (transcript + ' ' + interimTranscript).trim()
      if (fullTranscript) {
        fillFormFromSpeech(fullTranscript)
      }
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const submitData = {
        name: formData.name,
        price: parseFloat(formData.price),
        quantity: parseFloat(formData.quantity) || 1,
        brand: formData.brand || null,
        synonyms: formData.synonyms ? formData.synonyms.split(',').map(s => s.trim()) : [],
        shop_id: auth.shopId
      }

      if (editingProduct) {
        await api.put(`/products/${auth.shopId}/${editingProduct.id}`, submitData)
      } else {
        await api.post('/products', submitData)
      }

      setFormData({ name: '', brand: '', price: '', quantity: '', synonyms: '' })
      setEditingProduct(null)
      setShowForm(false)
      fetchProducts()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save product')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (product) => {
    setEditingProduct(product)
    setFormData({
      name: product.name || '',
      brand: product.brand || '',
      price: product.price?.toString() || '',
      quantity: product.quantity?.toString() || '',
      synonyms: Array.isArray(product.synonyms) ? product.synonyms.join(', ') : ''
    })
    setShowForm(true)
  }

  const handleDelete = async (productId) => {
    if (!confirm('Are you sure?')) return

    try {
      await api.delete(`/products/${auth.shopId}/${productId}`)
      fetchProducts()
    } catch (err) {
      setError('Failed to delete product')
    }
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingProduct(null)
    setFormData({ name: '', brand: '', price: '', quantity: '', synonyms: '' })
  }

  if (auth?.role !== 'main') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="bg-yellow-50 border-2 border-yellow-400 p-6 rounded-lg">
            <h2 className="text-2xl font-bold text-yellow-800">Access Denied</h2>
            <p className="text-yellow-700 mt-2">Only main shopkeepers can manage products.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold text-gray-800">{t('manageProducts')}</h1>
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-lg font-semibold transition"
            >
              <Plus size={20} />
              Add Product
            </button>
          )}
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {successMsg && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg mb-6 animate-pulse">
            {successMsg}
          </div>
        )}

        {showForm && (
          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h2>
              <button onClick={handleCancel} className="p-2 hover:bg-gray-100 rounded-lg">
                <X size={24} />
              </button>
            </div>

            {/* Voice Recording Section */}
            <div className="bg-gradient-to-r from-emerald-50 to-blue-50 p-6 rounded-lg mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-800">Add Product by Voice</h3>
                <div className="flex items-center gap-2">
                  <Globe size={16} className="text-gray-500" />
                  <select
                    value={selectedLang}
                    onChange={(e) => setSelectedLang(e.target.value)}
                    className="text-sm border border-gray-300 rounded-lg px-2 py-1 focus:outline-none focus:border-emerald-500"
                  >
                    {supportedLanguages.map(lang => (
                      <option key={lang.code} value={lang.code}>{lang.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Say: "<strong>Rice 50 rupees</strong>" - pause 1.5s - "<strong>Sugar 80</strong>" - pause 1.5s - keeps adding!
              </p>

              <div className="flex flex-wrap items-center gap-4">
                {!isListening ? (
                  <button
                    type="button"
                    onClick={startListening}
                    className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-lg transition"
                  >
                    <Mic size={20} />
                    Start Speaking
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={stopListening}
                    className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg transition animate-pulse"
                  >
                    <Square size={20} />
                    Stop Listening
                  </button>
                )}

                {isListening && (
                  <span className="text-red-600 font-medium flex items-center gap-2">
                    <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
                    {t('listening')}
                  </span>
                )}

                {/* Voice verification indicator */}
                {isListening && verificationEnabled && (
                  <span className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm ${
                    voiceVerified === true ? 'bg-green-100 text-green-700' :
                    voiceVerified === false ? 'bg-red-100 text-red-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {voiceVerified === true ? (
                      <><ShieldCheck size={14} /> Verified</>
                    ) : voiceVerified === false ? (
                      <><ShieldX size={14} /> Unknown</>
                    ) : (
                      <><ShieldCheck size={14} /> Checking...</>
                    )}
                  </span>
                )}
              </div>

              {/* Live transcript display */}
              {(transcript || interimTranscript) && (
                <div className="mt-4 p-4 bg-white rounded-lg border border-emerald-200">
                  <p className="text-sm text-gray-500 mb-1">You said:</p>
                  <p className="text-gray-800 font-medium">
                    {transcript}
                    <span className="text-gray-400 italic">{interimTranscript}</span>
                  </p>
                </div>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Product Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-emerald-500 focus:outline-none"
                    placeholder="Product name"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Brand</label>
                  <input
                    type="text"
                    name="brand"
                    value={formData.brand}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-emerald-500 focus:outline-none"
                    placeholder="Brand name (optional)"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Price (Rs.) *</label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    step="0.01"
                    required
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-emerald-500 focus:outline-none"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Quantity</label>
                  <input
                    type="number"
                    name="quantity"
                    value={formData.quantity}
                    onChange={handleChange}
                    step="0.01"
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-emerald-500 focus:outline-none"
                    placeholder="1"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2">Synonyms / Alternative Names</label>
                <input
                  type="text"
                  name="synonyms"
                  value={formData.synonyms}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-emerald-500 focus:outline-none"
                  placeholder="e.g., curd, dahi, yogurt (comma separated)"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Add alternative names for this product so it can be found when spoken differently
                </p>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 rounded-lg transition disabled:opacity-50"
                >
                  {loading ? 'Saving...' : editingProduct ? 'Update Product' : 'Add Product'}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-3 rounded-lg transition"
                >
                  {t('cancel')}
                </button>
              </div>
            </form>
          </div>
        )}

        {products.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">{t('noProducts')}</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map(product => (
              <ProductCard
                key={product.id}
                product={product}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Products
