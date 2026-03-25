import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Trash2, Mic, Square, Search, Volume2 } from 'lucide-react'
import Navbar from '../components/Navbar'
import BillItem from '../components/BillItem'
import api from '../api/api'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { SpeechRecognizer, translateToEnglish } from '../utils/speechRecognition'

const LOW_STOCK_THRESHOLD = 5

const normalizeVoiceText = (value = '') => value
  .toLowerCase()
  .replace(/[^a-z0-9\s]/gi, ' ')
  .replace(/\s+/g, ' ')
  .trim()

const NUMBER_WORDS = {
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12
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

  // Extract quantity from speech
  const extractQuantity = (text) => {
    const lowerText = text.toLowerCase()

    const prefixedMatch = lowerText.match(/(?:add|put|take)?\s*(\d+)\s+[a-z]/i)
    if (prefixedMatch) return parseInt(prefixedMatch[1], 10)

    const unitMatch = lowerText.match(/(\d+)\s*(?:x|kg|kilo|gram|packet|packets|piece|pieces|unit|units|bottle|box)/i)
    if (unitMatch) return parseInt(unitMatch[1], 10)

    for (const [word, num] of Object.entries(NUMBER_WORDS)) {
      if (new RegExp(`\\b${word}\\b`, 'i').test(lowerText)) return num
    }

    // Try to find a number
    const match = lowerText.match(/(\d+)/)
    if (match) return parseInt(match[1], 10)

    return 1
  }

  const handleAddProduct = (product, quantity = 1) => {
    const added = addOrUpdateBillItem(product, quantity)
    if (!added) return

    // Show feedback
    setLastAddedProduct(product.name)
    setTimeout(() => setLastAddedProduct(null), 2000)
  }

  const startVoiceBilling = () => {
    try {
      let silenceTimer = null;
      let lastSpokenText = '';

      const recognizer = new SpeechRecognizer({
        lang: 'en-IN',
        continuous: true,
        interimResults: true,
        onStart: () => {
          listeningRef.current = true
          setIsListening(true)
          setVoiceStatus(t('listening'))
          setError('')
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
