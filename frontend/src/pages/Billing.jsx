import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Trash2, Mic, Square, Search, Volume2, ShieldCheck, ShieldX } from 'lucide-react'
import Navbar from '../components/Navbar'
import BillItem from '../components/BillItem'
import api from '../api/api'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { SpeechRecognizer, translateToEnglish } from '../utils/speechRecognition'
import { getVoiceRecorder, compareSignatures } from '../utils/voiceSignature'

const LOW_STOCK_THRESHOLD = 5

const normalizeVoiceText = (value = '') => value
  .toLowerCase()
  .replace(/[^a-z0-9\s]/gi, ' ')
  .replace(/\s+/g, ' ')
  .trim()

const NUMBER_WORDS = {
  // English
  one: 1, two: 2, three: 3, four: 4, five: 5,
  six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15,
  twenty: 20, thirty: 30, forty: 40, fifty: 50,
  // Hindi
  ek: 1, do: 2, teen: 3, char: 4, panch: 5,
  chhe: 6, saat: 7, aath: 8, nau: 9, das: 10,
  gyarah: 11, barah: 12, terah: 13, chaudah: 14, pandrah: 15,
  bees: 20, tees: 30, chalis: 40, pachaas: 50,
  // Tamil
  onnu: 1, rendu: 2, moonu: 3, naalu: 4, anju: 5,
  aaru: 6, yezhu: 7, yettu: 8, ombathu: 9, pathu: 10,
  // Telugu
  okati: 1, rendu: 2, moodu: 3, naalugu: 4, aidu: 5,
  // Common variations
  'double': 2, 'triple': 3, 'half': 0.5
}

const splitSpeechIntoChunks = (text = '') => text
  .split(/,|\band\b|\bthen\b|\bnext\b|\balso\b/gi)
  .map(part => part.trim())
  .filter(Boolean)

const buildAliases = (product) => {
  const aliases = [product.name]

  if (product.brand) {
    aliases.push(product.brand)
    aliases.push(`${product.brand} ${product.name}`)
    aliases.push(`${product.name} ${product.brand}`)
  }

  if (Array.isArray(product.synonyms)) {
    aliases.push(...product.synonyms)
  }

  return aliases.map(alias => normalizeVoiceText(alias || '')).filter(Boolean)
}

const Billing = () => {
  const navigate = useNavigate()
  const { auth } = useAuth()
  const { t } = useLanguage()
  const [products, setProducts] = useState([])
  const [billItems, setBillItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  // Voice states
  const [isListening, setIsListening] = useState(false)
  const [voiceStatus, setVoiceStatus] = useState('')
  const [lastAddedProduct, setLastAddedProduct] = useState(null)
  const [lowStockAlerts, setLowStockAlerts] = useState([])
  const recognizerRef = useRef(null)
  const listeningRef = useRef(false)
  const billItemsRef = useRef([])
  const productsRef = useRef([])

  // Voice verification states
  const [voiceVerified, setVoiceVerified] = useState(null) // null = not checked, true/false = result
  const [storedSignature, setStoredSignature] = useState(null)
  const [verificationEnabled, setVerificationEnabled] = useState(false)
  const lastVerificationRef = useRef(0)

  useEffect(() => {
    // Fetch stored voice signature for verification
    const fetchVoiceSignature = async () => {
      if (!auth?.shopkeeperId) return
      
      try {
        const response = await api.get(`/shopkeepers/${auth.shopkeeperId}/voice-status`)
        // Enable if voice signature exists (enrolled this session)
        if (response.data.hasVoiceEnrolled && response.data.voiceSignature) {
          setStoredSignature(response.data.voiceSignature)
          setVerificationEnabled(true)
          console.log('Voice verification enabled')
        }
      } catch (err) {
        console.log('Voice verification not available:', err.message)
      }
    }
    
    fetchVoiceSignature()
  }, [auth])

  useEffect(() => {
    fetchProducts()
    return () => {
      if (recognizerRef.current) {
        recognizerRef.current.abort()
      }
    }
  }, [])

  useEffect(() => {
    billItemsRef.current = billItems
  }, [billItems])

  useEffect(() => {
    productsRef.current = products
  }, [products])

  const fetchProducts = async () => {
    try {
      const response = await api.get(`/products/${auth.shopId}`)
      const productList = response.data.products || []
      setProducts(productList)
      setLowStockAlerts(
        productList.filter(product => Number.isFinite(Number(product.quantity)) && Number(product.quantity) <= LOW_STOCK_THRESHOLD)
      )
    } catch (err) {
      setError('Failed to fetch products')
    }
  }

  // Find product by name or synonym
  const findProduct = (spokenText) => {
    const searchText = normalizeVoiceText(spokenText)

    // Remove common words
    const cleanedText = normalizeVoiceText(
      searchText
        .replace(/\b(add|please|one|two|three|four|five|1|2|3|4|5|x)\b/gi, '')
        .replace(/\b(piece|pieces|kg|kilo|gram|packet|packets|bottle|box|unit|units)\b/gi, '')
    )

    if (!cleanedText) return null

    const words = cleanedText.split(' ').filter(word => word.length > 1)
    let best = null
    let bestScore = 0

    for (const product of productsRef.current) {
      const aliases = buildAliases(product)

      for (const alias of aliases) {
        let score = 0

        if (alias === cleanedText) score = 100
        else if (alias.startsWith(cleanedText) || cleanedText.startsWith(alias)) score = 85
        else if (alias.includes(cleanedText) || cleanedText.includes(alias)) score = 75
        else {
          const aliasWords = alias.split(' ').filter(Boolean)
          const overlap = words.filter(word => aliasWords.some(aliasWord => aliasWord.includes(word) || word.includes(aliasWord))).length
          if (overlap > 0) score = Math.min(70, 45 + overlap * 10)
        }

        if (score > bestScore) {
          bestScore = score
          best = product
        }
      }
    }

    return bestScore >= 55 ? best : null
  }

  const getAvailableQuantity = (product) => {
    const quantity = Number(product.quantity)
    return Number.isFinite(quantity) ? quantity : null
  }

  const canSetQuantity = (product, targetQuantity) => {
    const available = getAvailableQuantity(product)
    if (available === null) return true
    return targetQuantity <= available
  }

  const addOrUpdateBillItem = (product, quantityToAdd = 1) => {
    const existingItem = billItemsRef.current.find(item => item.productId === product.id)
    const currentQuantity = existingItem ? existingItem.quantity : 0
    const targetQuantity = currentQuantity + quantityToAdd

    if (!canSetQuantity(product, targetQuantity)) {
      const available = getAvailableQuantity(product)
      setError(`Only ${available} left in stock for ${product.name}`)
      return false
    }

    if (existingItem) {
      setBillItems(prev => prev.map(item =>
        item.productId === product.id ? { ...item, quantity: targetQuantity } : item
      ))
    } else {
      setBillItems(prev => [...prev, {
        productId: product.id,
        productName: product.name,
        price: product.price,
        quantity: quantityToAdd
      }])
    }

    setError('')
    return true
  }

  // Extract quantity from speech - improved patterns
  const extractQuantity = (text) => {
    const lowerText = text.toLowerCase().trim()

    // Pattern 1: "2 rice", "3 milk" - number at start followed by product name
    const startNumberMatch = lowerText.match(/^(\d+)\s+[a-z]/i)
    if (startNumberMatch) return parseInt(startNumberMatch[1], 10)

    // Pattern 2: "rice 2", "milk 3" - product name followed by number at end
    const endNumberMatch = lowerText.match(/[a-z]\s+(\d+)$/i)
    if (endNumberMatch) return parseInt(endNumberMatch[1], 10)

    // Pattern 3: "add 2 rice", "put 5 milk" - command + number + product
    const commandMatch = lowerText.match(/(?:add|put|take|give|get)\s+(\d+)\s+[a-z]/i)
    if (commandMatch) return parseInt(commandMatch[1], 10)

    // Pattern 4: "2x rice", "3x milk" - multiplier format
    const multiplierMatch = lowerText.match(/(\d+)\s*[x×]\s*[a-z]/i)
    if (multiplierMatch) return parseInt(multiplierMatch[1], 10)

    // Pattern 5: "2 kg rice", "3 packets milk" - number with unit
    const unitMatch = lowerText.match(/(\d+)\s*(?:x|kg|kgs|kilo|kilos|gram|grams|g|packet|packets|piece|pieces|pcs|unit|units|bottle|bottles|box|boxes|litre|litres|liter|liters|l)\b/i)
    if (unitMatch) return parseInt(unitMatch[1], 10)

    // Pattern 6: Word numbers at start - "two rice", "three milk"
    for (const [word, num] of Object.entries(NUMBER_WORDS)) {
      const wordStartRegex = new RegExp(`^${word}\\s+[a-z]`, 'i')
      if (wordStartRegex.test(lowerText)) return num
    }

    // Pattern 7: Word numbers at end - "rice two", "milk three"
    for (const [word, num] of Object.entries(NUMBER_WORDS)) {
      const wordEndRegex = new RegExp(`[a-z]\\s+${word}$`, 'i')
      if (wordEndRegex.test(lowerText)) return num
    }

    // Pattern 8: Word numbers with commands - "add two rice", "do packet milk"
    for (const [word, num] of Object.entries(NUMBER_WORDS)) {
      const wordCommandRegex = new RegExp(`(?:add|put|take|give|get)\\s+${word}\\s+[a-z]`, 'i')
      if (wordCommandRegex.test(lowerText)) return num
    }

    // Pattern 9: Any number in the text (fallback)
    const anyNumberMatch = lowerText.match(/\b(\d+)\b/)
    if (anyNumberMatch) return parseInt(anyNumberMatch[1], 10)

    // Pattern 10: Any word number in the text (fallback)
    for (const [word, num] of Object.entries(NUMBER_WORDS)) {
      if (new RegExp(`\\b${word}\\b`, 'i').test(lowerText)) return num
    }

    return 1
  }

  const handleAddProduct = (product, quantity = 1) => {
    const added = addOrUpdateBillItem(product, quantity)
    if (!added) return

    // Show feedback
    setLastAddedProduct(product.name)
    setTimeout(() => setLastAddedProduct(null), 2000)
  }

  const startVoiceBilling = async () => {
    try {
      let silenceTimer = null;
      let lastSpokenText = '';

      // Start continuous voice recording for verification
      const voiceRecorder = getVoiceRecorder()
      const recorderStarted = await voiceRecorder.start()
      if (recorderStarted) {
        console.log('Voice recorder started for verification')
      }

      const recognizer = new SpeechRecognizer({
        lang: 'en-IN',
        continuous: true,
        interimResults: true,
        onStart: () => {
          listeningRef.current = true
          setIsListening(true)
          setVoiceStatus(t('listening'))
          setError('')
          // Clear any previous voice data
          voiceRecorder.clear()
        },
        onResult: (result) => {
          // Clear existing timer
          if (silenceTimer) clearTimeout(silenceTimer);

          if (result.isFinal && result.final.trim()) {
            const spokenText = translateToEnglish(result.final.trim())
            lastSpokenText = spokenText
            setVoiceStatus(`Heard: "${spokenText}"`)

            // Detect pause - if no speech for 1 second, process it
            silenceTimer = setTimeout(async () => {
              if (lastSpokenText) {
                await processVoiceBilling(lastSpokenText)
                lastSpokenText = ''
                // Clear voice data for next command
                voiceRecorder.clear()
              }
            }, 1000) // 1 second pause for billing
          }
        },
        onError: (err) => {
          if (err === 'not-allowed') {
            setError('Please allow microphone access')
          }
          listeningRef.current = false
          setIsListening(false)
          setVoiceStatus('')
          if (silenceTimer) clearTimeout(silenceTimer)
        },
        onEnd: () => {
          // Auto-restart for continuous listening
          if (silenceTimer) clearTimeout(silenceTimer)
          if (listeningRef.current && recognizerRef.current) {
            try {
              recognizerRef.current.start()
            } catch (e) {
              listeningRef.current = false
              setIsListening(false)
              setVoiceStatus('')
            }
          }
        }
      })

      recognizer.init()
      recognizer.start()
      recognizerRef.current = recognizer
    } catch (err) {
      setError('Speech recognition not supported. Use Chrome or Edge.')
    }
  }

  const processSingleVoiceSegment = async (segment) => {
    const normalized = normalizeVoiceText(segment)
    if (!normalized) return { matched: false }

    if (/\b(clear|reset)\s+bill\b/i.test(normalized)) {
      setBillItems([])
      return { matched: true, status: 'Bill cleared' }
    }

    if (/\b(remove|delete)\b/i.test(normalized)) {
      const productToRemove = findProduct(normalized)
      if (productToRemove) {
        setBillItems(prev => prev.filter(item => item.productId !== productToRemove.id))
        return { matched: true, status: `Removed: ${productToRemove.name}` }
      }
    }

    const localMatch = findProduct(normalized)
    if (localMatch) {
      const quantity = extractQuantity(normalized)
      handleAddProduct(localMatch, quantity)
      return { matched: true, status: `${t('added')}: ${localMatch.name} x${quantity}` }
    }

    try {
      const response = await api.post('/ai-parse/billing', {
        text: segment,
        availableProducts: productsRef.current.map(p => ({
          name: p.name,
          id: p.id,
          brand: p.brand,
          synonyms: p.synonyms
        }))
      })

      const aiItems = Array.isArray(response.data?.items)
        ? response.data.items
        : [{ productName: response.data?.productName, quantity: response.data?.quantity || 1 }]
      const aiAction = response.data?.action === 'remove' ? 'remove' : 'add'

      let matchedAny = false
      for (const aiItem of aiItems) {
        const product = findProduct(aiItem.productName || '')
        if (product) {
          if (aiAction === 'remove') {
            setBillItems(prev => prev.filter(item => item.productId !== product.id))
          } else {
            handleAddProduct(product, Number(aiItem.quantity) || 1)
          }
          matchedAny = true
        }
      }

      if (matchedAny) {
        return {
          matched: true,
          status: aiAction === 'remove'
            ? `Removed: ${aiItems.map(item => item.productName).join(', ')}`
            : `${t('added')}: ${aiItems.map(item => `${item.productName} x${Number(item.quantity) || 1}`).join(', ')}`
        }
      }

      return { matched: false, status: `Product not found: "${segment}"` }
    } catch (error) {
      return { matched: false, status: `Product not found: "${segment}"` }
    }
  }

  const processVoiceBilling = async (spokenText) => {
    const chunks = splitSpeechIntoChunks(spokenText)
    if (chunks.length === 0) return

    // Voice verification using ALREADY CAPTURED audio
    if (verificationEnabled && auth?.shopkeeperId && storedSignature) {
      const voiceRecorder = getVoiceRecorder()
      const currentSignature = voiceRecorder.getSignature()
      
      if (currentSignature) {
        // Compare locally first for speed
        const similarity = compareSignatures(storedSignature, currentSignature)
        console.log(`Voice verification: similarity = ${similarity}`)
        
        // With the new Euclidean distance based comparison:
        // Same speaker typically: 0.65-0.90
        // Different speaker typically: 0.30-0.60
        const verified = similarity >= 0.70
        setVoiceVerified(verified)
        lastVerificationRef.current = Date.now()
        
        if (!verified) {
          setVoiceStatus(`🚫 Voice not recognized (${Math.round(similarity * 100)}% match) - only shopkeeper can add items`)
          setError('Voice verification failed. This doesn\'t sound like the enrolled shopkeeper.')
          return // BLOCK - Don't process if voice doesn't match
        }
        
        setVoiceStatus(`✓ Voice verified (${Math.round(similarity * 100)}%) - processing...`)
      } else {
        // No voice captured - might be too quiet
        console.log('No voice signature captured - voice too quiet?')
        setVoiceStatus('⚠️ Voice too quiet - speak louder')
        // Still allow if we previously verified (within time window)
        const now = Date.now()
        if (voiceVerified !== true || now - lastVerificationRef.current > 30000) {
          setError('Please speak louder for voice verification')
          return // BLOCK
        }
      }
    }

    const statuses = []
    for (const chunk of chunks) {
      const result = await processSingleVoiceSegment(chunk)
      if (result?.status) statuses.push(result.status)
    }

    if (statuses.length > 0) {
      setVoiceStatus(statuses[statuses.length - 1])
    }
  }

  const stopVoiceBilling = () => {
    listeningRef.current = false
    if (recognizerRef.current) {
      recognizerRef.current.abort()
      recognizerRef.current = null
    }
    // Stop the voice recorder
    const voiceRecorder = getVoiceRecorder()
    voiceRecorder.stop()
    
    setIsListening(false)
    setVoiceStatus('')
  }

  const handleQuantityChange = (productId, quantity) => {
    if (quantity <= 0) {
      handleRemoveItem(productId)
      return
    }

    const product = products.find(item => item.id === productId)
    if (product && !canSetQuantity(product, quantity)) {
      const available = getAvailableQuantity(product)
      setError(`Only ${available} left in stock for ${product.name}`)
      return
    }

    setBillItems(billItems.map(item =>
      item.productId === productId ? { ...item, quantity } : item
    ))
    setError('')
  }

  const handleRemoveItem = (productId) => {
    setBillItems(billItems.filter(item => item.productId !== productId))
  }

  const handleCreateBill = async () => {
    if (billItems.length === 0) {
      setError('Bill must have at least one item')
      return
    }

    setLoading(true)
    setError('')

    try {
      const billData = {
        shop_id: auth.shopId,
        items: billItems,
        total: billItems.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        created_by: auth.name
      }

      const response = await api.post('/bills', billData)
      const lowStock = response.data.low_stock_alerts || []
      navigate('/bills', { state: { newBillId: response.data.bill?.id || response.data.bill_id, lowStockAlerts: lowStock } })
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Failed to create bill')
    } finally {
      setLoading(false)
    }
  }

  // Filter products by search
  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.brand && p.brand.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (Array.isArray(p.synonyms) && p.synonyms.some(syn => syn.toLowerCase().includes(searchQuery.toLowerCase())))
  )

  const totalAmount = billItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold text-gray-800">{t('createBill')}</h1>

          {/* Voice Billing Button */}
          {!isListening ? (
            <button
              onClick={startVoiceBilling}
              className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-600 hover:to-blue-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg transition"
            >
              <Mic size={24} />
              {t('voiceBilling')}
            </button>
          ) : (
            <button
              onClick={stopVoiceBilling}
              className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg transition animate-pulse"
            >
              <Square size={24} />
              {t('stopVoice')}
            </button>
          )}
        </div>

        {/* Voice Status Banner */}
        {isListening && (
          <div className="bg-gradient-to-r from-emerald-100 to-blue-100 border-2 border-emerald-400 p-4 rounded-xl mb-6 flex items-center gap-4">
            <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse"></div>
            <div className="flex-1">
              <p className="font-semibold text-emerald-800">{voiceStatus || t('listening')}</p>
              <p className="text-sm text-emerald-600">{t('sayProductNames')}</p>
            </div>
            {/* Voice verification indicator */}
            {verificationEnabled && (
              <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${
                voiceVerified === true ? 'bg-green-100 text-green-700' :
                voiceVerified === false ? 'bg-red-100 text-red-700' :
                'bg-gray-100 text-gray-600'
              }`}>
                {voiceVerified === true ? (
                  <><ShieldCheck size={16} /> Voice verified</>
                ) : voiceVerified === false ? (
                  <><ShieldX size={16} /> Unknown voice</>
                ) : (
                  <><ShieldCheck size={16} /> Verifying...</>
                )}
              </div>
            )}
          </div>
        )}

        {/* Added Product Notification */}
        {lastAddedProduct && (
          <div className="fixed top-20 right-4 bg-green-500 text-white px-6 py-3 rounded-xl shadow-lg animate-bounce z-50">
            {t('added')}: {lastAddedProduct}
          </div>
        )}

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {lowStockAlerts.length > 0 && (
          <div className="bg-amber-50 border border-amber-400 text-amber-800 px-4 py-3 rounded-lg mb-6">
            <p className="font-semibold mb-1">Low stock alert</p>
            <p className="text-sm">
              {lowStockAlerts.map(product => `${product.name} (${product.quantity})`).join(', ')}
            </p>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-800">{t('productsLabel')}</h2>

                {/* Search Box */}
                <div className="relative">
                  <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t('searchProducts')}
                    className="pl-10 pr-4 py-2 border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              {filteredProducts.length === 0 ? (
                <p className="text-gray-600 text-center py-8">
                  {products.length === 0 ? t('noProducts') : t('noMatchingProducts')}
                </p>
              ) : (
                <div className="grid sm:grid-cols-2 gap-3 max-h-[500px] overflow-y-auto">
                  {filteredProducts.map(product => (
                    <button
                      key={product.id}
                      onClick={() => handleAddProduct(product)}
                      className="flex items-center justify-between bg-gray-50 p-4 rounded-lg border-2 border-gray-200 hover:border-emerald-500 hover:bg-emerald-50 transition text-left"
                    >
                      <div className="flex-1">
                        <p className="font-semibold text-gray-800">{product.name}</p>
                        <p className="text-sm text-gray-600">
                          {product.brand && `${product.brand} • `}Rs.{product.price}
                        </p>
                        {Number.isFinite(Number(product.quantity)) && Number(product.quantity) <= LOW_STOCK_THRESHOLD && (
                          <p className="text-xs text-amber-700 font-semibold">Low stock: {product.quantity}</p>
                        )}
                      </div>
                      <Plus size={24} className="text-emerald-600" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-lg p-6 sticky top-20">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">{t('billSummary')}</h2>

              {billItems.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-2">{t('noItemsAdded')}</p>
                  <p className="text-sm text-gray-400">{t('clickOrVoice')}</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[300px] overflow-y-auto">
                  {billItems.map(item => (
                    <BillItem
                      key={item.productId}
                      item={item}
                      onQuantityChange={handleQuantityChange}
                      onRemove={handleRemoveItem}
                    />
                  ))}
                </div>
              )}

              <div className="border-t-2 border-gray-200 mt-4 pt-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">{t('items')}:</span>
                  <span className="font-bold">{billItems.reduce((sum, item) => sum + item.quantity, 0)}</span>
                </div>
                <div className="flex justify-between items-center text-2xl font-bold text-emerald-600 mb-4">
                  <span>{t('total')}:</span>
                  <span>Rs.{totalAmount.toFixed(2)}</span>
                </div>

                <button
                  onClick={handleCreateBill}
                  disabled={billItems.length === 0 || loading}
                  className="w-full bg-gradient-to-r from-emerald-500 to-blue-500 hover:shadow-lg text-white font-bold py-4 rounded-xl transition disabled:opacity-50 text-lg"
                >
                  {loading ? t('processing') : t('createBillBtn')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Billing
