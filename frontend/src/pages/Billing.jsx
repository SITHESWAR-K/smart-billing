import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Mic, Square, Search, Globe } from 'lucide-react'
import Navbar from '../components/Navbar'
import BillItem from '../components/BillItem'
import VoiceVerifyModal from '../components/VoiceVerifyModal'
import api from '../api/api'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { SpeechRecognizer, translateToEnglish, supportedLanguages, isMobileDevice, stopActiveRecognition } from '../utils/speechRecognition'
import { getLocalizedProductName, toTamilText } from '../utils/tamilTransliteration'
import { getExpiryStatus, getExpiryAlertDays } from '../utils/expiry'

const LOW_STOCK_THRESHOLD = 5
const EXPIRY_ALERT_DAYS = getExpiryAlertDays()

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
  onnu: 1, oru: 1, rendu: 2, randu: 2, irandu: 2, moonu: 3, moondru: 3, naalu: 4, anju: 5,
  aaru: 6, yezhu: 7, yettu: 8, ombathu: 9, pathu: 10,
  // Telugu
  okati: 1, moodu: 3, naalugu: 4, aidu: 5,
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

const buildDisplayName = (productName = '', productBrand = '') => {
  if (productBrand && productName) return `${productBrand} ${productName}`
  return productName || productBrand || ''
}


const Billing = () => {
  const navigate = useNavigate()
  const { auth, isVoiceVerifiedForSession } = useAuth()
  const { t, language } = useLanguage()
  const [products, setProducts] = useState([])
  const [billItems, setBillItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedLang, setSelectedLang] = useState('en-IN')
  const isMobile = useMemo(() => isMobileDevice(), [])

  // Voice states
  const [isListening, setIsListening] = useState(false)
  const [voiceStatus, setVoiceStatus] = useState('')
  const [lastAddedProduct, setLastAddedProduct] = useState(null)
  const [lowStockAlerts, setLowStockAlerts] = useState([])
  const [expiryAlerts, setExpiryAlerts] = useState([])
  const recognizerRef = useRef(null)
  const listeningRef = useRef(false)
  const pendingActionRef = useRef(null)
  const billItemsRef = useRef([])
  const productsRef = useRef([])
  const silenceTimerRef = useRef(null)
  const restartTimerRef = useRef(null)
  const lastSpokenTextRef = useRef('')
  const shouldRestartRef = useRef(false)
  const lastRestartAtRef = useRef(0)
  const restartBurstCountRef = useRef(0)
  const [voiceVerifyOpen, setVoiceVerifyOpen] = useState(false)

  const fetchProducts = useCallback(async () => {
    if (!auth?.shopId) return

    try {
      const response = await api.get(`/products/${auth.shopId}`)
      const productList = response.data.products || []
      setProducts(productList)
      setLowStockAlerts(
        productList.filter(product => Number.isFinite(Number(product.quantity)) && Number(product.quantity) <= LOW_STOCK_THRESHOLD)
      )
      setExpiryAlerts(
        productList
          .map(product => ({ product, expiry: getExpiryStatus(product, EXPIRY_ALERT_DAYS) }))
          .filter(item => item.expiry)
      )
    } catch (err) {
      setError(t('failedToFetchProducts'))
    }
  }, [auth?.shopId, t])

  useEffect(() => {
    fetchProducts()
    return () => {
      shouldRestartRef.current = false
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current)
        silenceTimerRef.current = null
      }
      if (restartTimerRef.current) {
        clearTimeout(restartTimerRef.current)
        restartTimerRef.current = null
      }
      if (recognizerRef.current) {
        recognizerRef.current.abort()
        recognizerRef.current = null
      }
    }
  }, [fetchProducts])

  useEffect(() => {
    billItemsRef.current = billItems
  }, [billItems])

  const requireVoiceVerification = (action) => {
    if (isVoiceVerifiedForSession()) {
      action()
      return
    }
    pendingActionRef.current = action
    setVoiceVerifyOpen(true)
  }

  const handleVoiceVerified = () => {
    setVoiceVerifyOpen(false)
    const action = pendingActionRef.current
    pendingActionRef.current = null
    if (action) action()
  }

  const handleVoiceVerifyCancel = () => {
    pendingActionRef.current = null
    setVoiceVerifyOpen(false)
  }

  useEffect(() => {
    productsRef.current = products
  }, [products])

  // Find product by name or synonym
  const findProduct = (spokenText) => {
    const searchText = normalizeVoiceText(spokenText)

    // Remove common words
    const cleanedText = normalizeVoiceText(
      searchText
        .replace(/\b(add|please|one|two|three|four|five|1|2|3|4|5|x)\b/gi, '')
        .replace(/\b(quantity|qty|number|nos?)\b/gi, '')
        .replace(/\b(piece|pieces|kg|kilo|gram|packet|packets|bottle|box|unit|units)\b/gi, '')
    )

    if (!cleanedText) return null

    const words = cleanedText.split(' ').filter(word => word.length > 1)
    const brandMatches = productsRef.current.filter(product => {
      const brandText = normalizeVoiceText(product.brand || '')
      return brandText && searchText.includes(brandText)
    })
    const candidates = brandMatches.length > 0 ? brandMatches : productsRef.current

    let best = null
    let bestScore = 0
    let secondBestScore = 0

    for (const product of candidates) {
      const aliases = buildAliases(product)
      const brandText = normalizeVoiceText(product.brand || '')
      const productText = normalizeVoiceText(product.name || '')

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

        // Strongly prioritize phrases that contain both brand and product name.
        if (brandText && productText) {
          const fullBrandName = `${brandText} ${productText}`
          if (searchText.includes(fullBrandName)) {
            score += 40
          }
        }

        if (brandText && (searchText.includes(brandText) || cleanedText.includes(brandText))) {
          score += 25
        }

        if (productText && (searchText.includes(productText) || cleanedText.includes(productText))) {
          score += 15
        }

        if (score > bestScore) {
          secondBestScore = bestScore
          bestScore = score
          best = product
        } else if (score > secondBestScore) {
          secondBestScore = score
        }
      }
    }

    const minimumScore = brandMatches.length > 0 ? 60 : 58
    if (bestScore < minimumScore) return null
    if (bestScore - secondBestScore < 8) return null
    return best
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
      setError(t('onlyStockLeft', { available, product: localizeName(product.name, product.brand) }))
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
        productBrand: product.brand || '',
        displayName: buildDisplayName(product.name, product.brand),
        price: product.price,
        quantity: quantityToAdd
      }])
    }

    setError('')
    return true
  }

  // Extract quantity from speech - improved patterns
  const extractQuantity = (text) => {
    const workText = (text || '').trim()
    if (!workText) return { quantity: 1, isExplicit: false }

    const lowerText = workText.toLowerCase()

    const qtyLabelMatch = lowerText.match(/\b(?:qty|quantity)\s*(?:is\s*)?(\d+(?:\.\d+)?)/i)
    if (qtyLabelMatch) {
      const qty = Number.parseFloat(qtyLabelMatch[1])
      if (Number.isFinite(qty) && qty > 0 && qty < 1000) return { quantity: qty, isExplicit: true }
    }

    const unitMatch = lowerText.match(/(\d+(?:\.\d+)?)\s*(?:kg|kilo|kilogram|g|gram|grams|l|liter|litre|liters|litres|ml|milliliter|pieces?|pcs?|units?|packets?|packs?)/i)
    if (unitMatch) {
      const qty = Number.parseFloat(unitMatch[1])
      if (Number.isFinite(qty) && qty > 0 && qty < 1000) return { quantity: qty, isExplicit: true }
    }

    const numericMatches = [...lowerText.matchAll(/\b(\d+(?:\.\d+)?)\b/g)]
    for (const match of numericMatches) {
      const index = match.index ?? -1
      if (index < 0) continue
      const context = lowerText.slice(Math.max(0, index - 12), index + match[0].length + 12)
      const isPriceContext = /(?:rs\.?|rupees?|₹|price)/i.test(context)
      if (isPriceContext) continue
      const qty = Number.parseFloat(match[1])
      if (Number.isFinite(qty) && qty > 0 && qty < 1000) return { quantity: qty, isExplicit: true }
    }

    for (const [word, num] of Object.entries(NUMBER_WORDS)) {
      const regex = new RegExp(`\\b${word}\\b`, 'i')
      if (regex.test(lowerText)) {
        if (/\b(?:price|rs\.?|rupees?|₹)\b/i.test(lowerText)) {
          continue
        }
        return { quantity: num, isExplicit: true }
      }
    }

    return { quantity: 1, isExplicit: false }
  }

  const handleAddProduct = (product, quantity = 1) => {
    const added = addOrUpdateBillItem(product, quantity)
    if (!added) return

    // Show feedback
    setLastAddedProduct({ name: product.name, brand: product.brand })
    setTimeout(() => setLastAddedProduct(null), 2000)
  }

  const startVoiceBillingInternal = async () => {
    setError('')
    setVoiceStatus('')
    
    try {
      stopActiveRecognition()
      shouldRestartRef.current = true
      restartBurstCountRef.current = 0
      lastRestartAtRef.current = Date.now()
      setVoiceStatus(t('listening'))
      lastSpokenTextRef.current = ''

      const recognizer = new SpeechRecognizer({
        lang: selectedLang,
        continuous: true,
        interimResults: true,
        onStart: () => {
          listeningRef.current = true
          setIsListening(true)
          setError('')
          console.log('Billing speech recognition started')
        },
        onResult: (result) => {
          if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current)
            silenceTimerRef.current = null
          }

          if (result.isFinal && result.final.trim()) {
            const spokenText = translateToEnglish(result.final.trim())
            lastSpokenTextRef.current = spokenText
            setVoiceStatus(t('voiceHeard', { text: spokenText }))

            // Process after 1 second pause
            silenceTimerRef.current = setTimeout(async () => {
              if (lastSpokenTextRef.current) {
                const pendingText = lastSpokenTextRef.current
                lastSpokenTextRef.current = ''
                console.log('Processing billing:', pendingText)
                await processVoiceBilling(pendingText)
              }
            }, 1000)
          }
        },
        onError: (err) => {
          console.error('Billing speech error:', err)
          if (err === 'not-allowed') {
            setError(t('micAccessDenied'))
          } else if (err === 'audio-capture') {
            setError(t('micBusy'))
          } else if (err === 'no-speech') {
            // Ignore, it's normal
            console.log('No speech detected')
          } else {
            setError(`${t('speechError')}: ${err}`)
          }
          
          // On mobile, transient audio errors are common. Keep session alive for these.
          if (!['no-speech', 'aborted', 'audio-capture'].includes(err)) {
            shouldRestartRef.current = false
            listeningRef.current = false
            setIsListening(false)
            setVoiceStatus('')
          }
          
          if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current)
            silenceTimerRef.current = null
          }
        },
        onEnd: () => {
          if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current)
            silenceTimerRef.current = null
          }

          // Controlled restart to avoid rapid on/off loops on mobile.
          if (shouldRestartRef.current && recognizerRef.current) {
            const now = Date.now()
            const sinceLastRestart = now - lastRestartAtRef.current
            const maxBurst = isMobile ? 50 : 6
            if (sinceLastRestart < 4000) {
              restartBurstCountRef.current += 1
            } else {
              restartBurstCountRef.current = 1
            }

            if (restartBurstCountRef.current >= maxBurst) {
              shouldRestartRef.current = false
              listeningRef.current = false
              setIsListening(false)
              setVoiceStatus('')
              setError(t('voiceRestartStopped'))
              return
            }

            const restartDelay = sinceLastRestart < 1000
              ? (isMobile ? 900 : 1200)
              : (isMobile ? 500 : 600)
            if (restartTimerRef.current) {
              clearTimeout(restartTimerRef.current)
            }

            restartTimerRef.current = setTimeout(() => {
              if (!shouldRestartRef.current || !recognizerRef.current) return
              try {
                lastRestartAtRef.current = Date.now()
                recognizerRef.current.start()
              } catch (e) {
                console.error('Failed to restart:', e)
                shouldRestartRef.current = false
                listeningRef.current = false
                setIsListening(false)
                setVoiceStatus('')
              }
            }, restartDelay)
          } else {
            listeningRef.current = false
            setIsListening(false)
            setVoiceStatus('')
          }
        }
      })

      recognizer.init()
      recognizer.start()
      recognizerRef.current = recognizer
      
    } catch (err) {
      console.error('Start billing voice error:', err)
      if (err?.message === 'SPEECH_UNSUPPORTED') {
        setError(`${t('voiceStartFailed')}. ${t('useChrome')}`)
      } else {
        setError(t('voiceStartFailed'))
      }
      setVoiceStatus('')
    }
  }

  const startVoiceBilling = () => {
    requireVoiceVerification(() => {
      startVoiceBillingInternal()
    })
  }

  const processSingleVoiceSegment = async (segment) => {
    const normalized = normalizeVoiceText(segment)
    if (!normalized) return { matched: false }

    if (/\b(clear|reset)\s+bill\b/i.test(normalized)) {
      setBillItems([])
      return { matched: true, status: t('billCleared') }
    }

    if (/\b(remove|delete)\b/i.test(normalized)) {
      const productToRemove = findProduct(normalized)
      if (productToRemove) {
        setBillItems(prev => prev.filter(item => item.productId !== productToRemove.id))
        return {
          matched: true,
          status: `${t('removed')}: ${localizeName(productToRemove.name, productToRemove.brand)}`
        }
      }
    }

    const localMatch = findProduct(normalized)
    if (localMatch) {
      const quantityInfo = extractQuantity(segment)
      handleAddProduct(localMatch, quantityInfo.quantity)
      return {
        matched: true,
        status: `${t('added')}: ${localizeName(localMatch.name, localMatch.brand)} x${quantityInfo.quantity}`
      }
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
      const quantityInfo = extractQuantity(segment)
      for (const aiItem of aiItems) {
        const product = findProduct(aiItem.productName || '')
        if (product) {
          const aiQty = Number(aiItem.quantity)
          const quantityToAdd = quantityInfo.isExplicit
            ? quantityInfo.quantity
            : (Number.isFinite(aiQty) && aiQty > 0 ? aiQty : quantityInfo.quantity)
          if (aiAction === 'remove') {
            setBillItems(prev => prev.filter(item => item.productId !== product.id))
          } else {
            handleAddProduct(product, quantityToAdd)
          }
          matchedAny = true
        }
      }

      if (matchedAny) {
        return {
          matched: true,
          status: aiAction === 'remove'
            ? `${t('removed')}: ${aiItems.map(item => localizeName(item.productName, '')).join(', ')}`
            : `${t('added')}: ${aiItems.map(item => {
              const fallbackQty = quantityInfo.isExplicit ? quantityInfo.quantity : 1
              const aiValue = Number(item.quantity)
              const displayQty = Number.isFinite(aiValue) && aiValue > 0 ? aiValue : fallbackQty
              return `${localizeName(item.productName, '')} x${displayQty}`
            }).join(', ')}`
        }
      }

      return { matched: false, status: t('productNotFound', { segment }) }
    } catch (error) {
      return { matched: false, status: t('productNotFound', { segment }) }
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
    shouldRestartRef.current = false
    listeningRef.current = false
    lastSpokenTextRef.current = ''
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current)
      silenceTimerRef.current = null
    }
    if (restartTimerRef.current) {
      clearTimeout(restartTimerRef.current)
      restartTimerRef.current = null
    }
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
      setError(t('onlyStockLeft', { available, product: localizeName(product.name, product.brand) }))
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

  const createBill = async () => {
    if (billItems.length === 0) {
      setError(t('billNeedsItem'))
      return
    }

    setLoading(true)
    setError('')

    try {
      const normalizedItems = billItems.map(item => ({
        ...item,
        displayName: item.displayName || buildDisplayName(item.productName, item.productBrand)
      }))

      const billData = {
        shop_id: auth.shopId,
        items: normalizedItems,
        total: normalizedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        created_by: auth.name
      }

      const response = await api.post('/bills', billData)
      const lowStock = response.data.low_stock_alerts || []
      const expiryAlertPayload = expiryAlerts.map(entry => {
        const product = entry.product
        return {
          productId: product.id,
          productName: product.name,
          productBrand: product.brand || '',
          expiryDate: product.expiry_date,
          status: entry.expiry?.status || 'near',
          daysLeft: entry.expiry?.daysLeft ?? null
        }
      })
      navigate('/bills', {
        state: {
          newBillId: response.data.bill?.id || response.data.bill_id,
          lowStockAlerts: lowStock,
          expiryAlerts: expiryAlertPayload
        }
      })
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || t('billCreateFailed'))
    } finally {
      setLoading(false)
    }
  }

  const handleCreateBill = () => {
    requireVoiceVerification(() => {
      createBill()
    })
  }

  // Filter products by search
  const filteredProducts = products.filter(p => {
    const query = searchQuery.toLowerCase()
    if (!query) return true
    return (
      p.name.toLowerCase().includes(query) ||
      (p.brand && p.brand.toLowerCase().includes(query)) ||
      (Array.isArray(p.synonyms) && p.synonyms.some(syn => syn.toLowerCase().includes(query)))
    )
  })

  const totalAmount = billItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const localizeName = (name, brand) => getLocalizedProductName(name, brand, language)
  const localizeText = (value) => (language === 'ta' ? toTamilText(value || '') : value || '')
  const lastAddedDisplay = lastAddedProduct
    ? localizeName(lastAddedProduct.name || '', lastAddedProduct.brand || '')
    : ''
  const expiredItems = expiryAlerts.filter(entry => entry.expiry?.status === 'expired')
  const nearExpiryItems = expiryAlerts.filter(entry => entry.expiry?.status === 'near')

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <VoiceVerifyModal
        open={voiceVerifyOpen}
        onSuccess={handleVoiceVerified}
        onCancel={handleVoiceVerifyCancel}
        threshold={0.3}
      />

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-800">{t('createBill')}</h1>
            <p className="text-sm text-gray-500 mt-1">{t('sayProductNames')}</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2 shadow-sm">
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

            {/* Voice Billing Button */}
            {!isListening ? (
              <button
                onClick={startVoiceBilling}
                className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-600 hover:to-blue-600 text-white px-6 py-3 rounded-full font-semibold shadow-lg transition"
              >
                <Mic size={24} />
                {t('voiceBilling')}
              </button>
            ) : (
              <button
                onClick={stopVoiceBilling}
                className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-full font-semibold shadow-lg transition animate-pulse"
              >
                <Square size={24} />
                {t('stopVoice')}
              </button>
            )}

            {isMobile && (
              <span className="text-xs text-emerald-700 font-semibold bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-full">
                {t('mobileVoiceHint')}
              </span>
            )}
          </div>
        </div>

        {/* Voice Status Banner */}
        {isListening && (
          <div className="bg-gradient-to-r from-emerald-100 to-blue-100 border border-emerald-200 p-4 rounded-2xl mb-6 flex items-center gap-4 shadow-sm">
            <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse"></div>
            <div className="flex-1">
              <p className="font-semibold text-emerald-800">{voiceStatus || t('listening')}</p>
              <p className="text-sm text-emerald-600">{t('sayProductNames')}</p>
            </div>
          </div>
        )}

        {/* Added Product Notification */}
        {lastAddedProduct && (
          <div className="fixed top-20 right-4 max-w-[90vw] bg-green-600 text-white px-4 py-3 rounded-2xl shadow-lg animate-bounce z-50">
            {t('added')}: {lastAddedDisplay}
          </div>
        )}

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {lowStockAlerts.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 text-amber-900 px-4 py-3 rounded-2xl mb-6">
            <p className="font-semibold mb-1">{t('lowStockAlertTitle')}</p>
            <p className="text-sm">
              {lowStockAlerts
                .map(product => t('lowStockAlertItem', {
                  name: localizeName(product.name, product.brand),
                  qty: product.quantity
                }))
                .join(', ')}
            </p>
          </div>
        )}

        {expiryAlerts.length > 0 && (
          <div className="bg-rose-50 border border-rose-200 text-rose-900 px-4 py-3 rounded-2xl mb-6">
            <p className="font-semibold mb-1">{t('expiryAlertTitle', { days: EXPIRY_ALERT_DAYS })}</p>
            {expiredItems.length > 0 && (
              <p className="text-sm mb-1">
                {t('expiredLabel')}: {expiredItems
                  .map(entry => localizeName(entry.product.name, entry.product.brand))
                  .join(', ')}
              </p>
            )}
            {nearExpiryItems.length > 0 && (
              <p className="text-sm">
                {t('expiringSoonLabel')}: {nearExpiryItems
                  .map(entry => t('expiringItem', {
                    name: localizeName(entry.product.name, entry.product.brand),
                    days: entry.expiry?.daysLeft
                  }))
                  .join(', ')}
              </p>
            )}
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 min-w-0">
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-gray-100">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <h2 className="text-2xl font-bold text-gray-800">{t('productsLabel')}</h2>

                {/* Search Box */}
                <div className="relative w-full sm:w-auto">
                  <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t('searchProducts')}
                    className="pl-10 pr-4 py-2 border-2 border-gray-200 rounded-full focus:border-emerald-500 focus:outline-none w-full sm:w-72"
                  />
                </div>
              </div>

              {filteredProducts.length === 0 ? (
                <p className="text-gray-600 text-center py-8">
                  {products.length === 0 ? t('noProducts') : t('noMatchingProducts')}
                </p>
              ) : (
                <div className="grid sm:grid-cols-2 gap-3 max-h-[500px] overflow-y-auto overflow-x-hidden">
                  {filteredProducts.map(product => {
                    const expiryInfo = getExpiryStatus(product, EXPIRY_ALERT_DAYS)
                    return (
                    <button
                      key={product.id}
                      onClick={() => handleAddProduct(product)}
                      className="flex items-center justify-between bg-gray-50 p-4 rounded-2xl border-2 border-gray-200 hover:border-emerald-500 hover:bg-emerald-50 transition text-left"
                    >
                      <div className="flex-1">
                        <p className="font-semibold text-gray-800">{localizeName(product.name, product.brand)}</p>
                        <p className="text-sm text-gray-600">
                          {product.brand && `${localizeText(product.brand)} • `}{t('currency')}{product.price}
                        </p>
                        {Number.isFinite(Number(product.quantity)) && Number(product.quantity) <= LOW_STOCK_THRESHOLD && (
                          <p className="text-xs text-amber-700 font-semibold">{t('lowStockInline', { qty: product.quantity })}</p>
                        )}
                        {expiryInfo?.status === 'expired' && (
                          <p className="text-xs text-rose-700 font-semibold">{t('expiredLabel')}</p>
                        )}
                        {expiryInfo?.status === 'near' && (
                          <p className="text-xs text-rose-600 font-semibold">
                            {t('expiringInDays', { days: expiryInfo?.daysLeft })}
                          </p>
                        )}
                      </div>
                      <Plus size={24} className="text-emerald-600" />
                    </button>
                  )})}
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-1 min-w-0">
            <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-20 border border-gray-100">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">{t('billSummary')}</h2>

              {billItems.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-2">{t('noItemsAdded')}</p>
                  <p className="text-sm text-gray-400">{t('clickOrVoice')}</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[300px] overflow-y-auto overflow-x-hidden">
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

              <div className="border-t border-gray-200 mt-4 pt-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">{t('items')}:</span>
                  <span className="font-bold">{billItems.reduce((sum, item) => sum + item.quantity, 0)}</span>
                </div>
                <div className="flex justify-between items-center text-2xl font-bold text-emerald-600 mb-4">
                  <span>{t('total')}:</span>
                  <span>{t('currency')}{totalAmount.toFixed(2)}</span>
                </div>

                <button
                  onClick={handleCreateBill}
                  disabled={billItems.length === 0 || loading}
                  className="w-full bg-gradient-to-r from-emerald-500 to-blue-500 hover:shadow-lg text-white font-bold py-4 rounded-full transition disabled:opacity-50 text-lg"
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
