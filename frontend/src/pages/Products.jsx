import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, X, Mic, Square, Globe } from 'lucide-react'
import Navbar from '../components/Navbar'
import ProductCard from '../components/ProductCard'
import VoiceVerifyModal from '../components/VoiceVerifyModal'
import api from '../api/api'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { SpeechRecognizer, parseProductFromSpeech, translateToEnglish, supportedLanguages, isMobileDevice, stopActiveRecognition } from '../utils/speechRecognition'
import { toTamilText } from '../utils/tamilTransliteration'
import { formatExpiryInputValue } from '../utils/expiry'

const PRODUCT_KEYWORDS = [
  'rice', 'sugar', 'milk', 'curd', 'yogurt', 'butter', 'ghee', 'oil', 'salt', 'tea', 'coffee',
  'flour', 'atta', 'soap', 'shampoo', 'biscuit', 'noodles', 'detergent', 'masala', 'dal',
  'toor', 'urad', 'chilli', 'turmeric', 'wheat', 'bread', 'eggs', 'juice', 'tomato', 'onion', 'potato'
]

const normalizeToken = (value) => value.toLowerCase().replace(/[^a-z0-9\s]/gi, '').trim()

const toTitleCase = (value) => value
  .split(' ')
  .filter(Boolean)
  .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
  .join(' ')

const deriveBrandAndName = (rawName, spokenText, existingBrand, availableProducts = []) => {
  const cleanedName = normalizeToken(rawName)
  if (!cleanedName) {
    return { productName: '', brandName: existingBrand || '' }
  }

  const exactExisting = availableProducts.find(product => normalizeToken(product.name || '') === cleanedName)
  if (exactExisting) {
    return {
      productName: toTitleCase(normalizeToken(exactExisting.name || cleanedName)),
      brandName: toTitleCase(normalizeToken(exactExisting.brand || existingBrand || ''))
    }
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

const normalizeSpeechText = (value = '') => value
  .toLowerCase()
  .replace(/[^a-z0-9\s]/gi, ' ')
  .replace(/\s+/g, ' ')
  .trim()

const mapTamilNumbersToDigits = (value = '') => {
  return (value || '')
    .replace(/\u0B92\u0BB0\u0BC1/g, '1')
    .replace(/\u0B92\u0BA9\u0BCD\u0BA9\u0BC1/g, '1')
    .replace(/\u0B87\u0BB0\u0BA3\u0BCD\u0B9F\u0BC1/g, '2')
    .replace(/\u0BB0\u0BC6\u0BA3\u0BCD\u0B9F\u0BC1/g, '2')
    .replace(/\u0BAE\u0BC2\u0BA9\u0BC1/g, '3')
    .replace(/\u0BAE\u0BC2\u0BA9\u0BCD\u0BB1\u0BC1/g, '3')
    .replace(/\u0BA8\u0BBE\u0BB2\u0BC1/g, '4')
    .replace(/\u0B85\u0B9E\u0BCD\u0B9A\u0BC1/g, '5')
    .replace(/\u0B86\u0BB1\u0BC1/g, '6')
    .replace(/\u0B8F\u0BB4\u0BC1/g, '7')
    .replace(/\u0B8E\u0B9F\u0BCD\u0B9F\u0BC1/g, '8')
    .replace(/\u0B92\u0BAE\u0BCD\u0BAA\u0BA4\u0BC1/g, '9')
    .replace(/\u0BAA\u0BA4\u0BCD\u0BA4\u0BC1/g, '10')
}

const buildProductAliases = (product) => {
  const aliases = [product.name]

  if (product.brand) {
    aliases.push(`${product.brand} ${product.name}`)
    aliases.push(`${product.name} ${product.brand}`)
  }

  if (Array.isArray(product.synonyms)) {
    aliases.push(...product.synonyms)
  }

  return aliases
    .map(alias => normalizeSpeechText(alias || ''))
    .filter(Boolean)
}

const detectVoiceUpdateFields = (rawText = '', translatedText = '') => {
  const combined = `${rawText} ${translatedText}`.toLowerCase()

  const hasPriceMentioned = /\b(rupees?|rs\.?|₹|price|விலை|ரூபா|ரூபாய்)\b/i.test(combined)
    || /\d+\s*(?:rs\.?|rupees?|₹)/i.test(combined)

  const hasQuantityMentioned = /\b(qty|quantity|kg|kilo|kilogram|g|gram|grams|l|liter|litre|liters|litres|ml|milliliter|milliliters|piece|pieces|pcs|packet|packets|unit|units|கிலோ|கிராம்|லிட்டர்|பீஸ்)\b/i.test(combined)
    || /\b(?:one|two|three|four|five|six|seven|eight|nine|ten|onnu|rendu|moonu|naalu|anju|aaru|ezhu|yettu|ombathu|pathu)\b/i.test(combined)
    || /(\d+(?:\.\d+)?)\s*(?:kg|kilo|kilogram|g|gram|grams|l|liter|litre|liters|litres|ml|milliliter|milliliters|piece|pieces|pcs|packet|packets|unit|units|கிலோ|கிராம்|லிட்டர்|பீஸ்)/i.test(combined)

  return { hasPriceMentioned, hasQuantityMentioned }
}

const parseVoiceQuantity = (text = '') => {
  const normalized = normalizeSpeechText(text)
  if (!normalized) return null

  const unitMatch = normalized.match(/(\d+(?:\.\d+)?)\s*(kg|kgs|kilo|kilos|kilogram|grams?|g|liters?|litres?|l|ml|pieces?|pcs?|units?|packets?|packs?)/i)
  if (unitMatch) return Number.parseFloat(unitMatch[1])

  const trailingNumberMatch = normalized.match(/\b(\d+(?:\.\d+)?)\b/)
  if (trailingNumberMatch) return Number.parseFloat(trailingNumberMatch[1])

  return null
}

const parseVoiceCommandWithAI = async (text, availableProducts = []) => {
  const response = await api.post('/ai-parse/product', {
    text,
    availableProducts: availableProducts.map(p => ({
      name: p.name,
      brand: p.brand,
      synonyms: p.synonyms
    }))
  })

  return {
    name: response.data?.name || null,
    price: Number.isFinite(Number(response.data?.price)) ? Number(response.data.price) : null,
    quantity: Number.isFinite(Number(response.data?.quantity)) ? Number(response.data.quantity) : null
  }
}

const INVALID_PRODUCT_NAME_TOKENS = new Set(['rupees', 'rupee', 'rs', 'price', 'qty', 'quantity', 'unknown'])

const isValidProductName = (value = '') => {
  const normalized = normalizeToken(value)
  return Boolean(normalized) && !INVALID_PRODUCT_NAME_TOKENS.has(normalized)
}

const Products = () => {
  const navigate = useNavigate()
  const { auth, isVoiceVerifiedForSession } = useAuth()
  const { t } = useLanguage()
  const [products, setProducts] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    price: '',
    quantity: '',
    synonyms: '',
    expiryDate: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [voiceVerifyOpen, setVoiceVerifyOpen] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [interimTranscript, setInterimTranscript] = useState('')
  const [selectedLang, setSelectedLang] = useState('en-IN')
  const recognizerRef = useRef(null)
  const listeningRef = useRef(false)
  const pendingActionRef = useRef(null)
  const isMobile = useMemo(() => isMobileDevice(), [])

  const fetchProducts = useCallback(async () => {
    if (!auth?.shopId) return

    try {
      const response = await api.get(`/products/${auth.shopId}`)
      setProducts(response.data.products || [])
    } catch (err) {
      setError(t('failedToFetchProducts'))
    }
  }, [auth?.shopId, t])

  useEffect(() => {
    fetchProducts()

    // Cleanup speech recognition on unmount
    return () => {
      if (recognizerRef.current) {
        recognizerRef.current.abort()
      }
    }
  }, [fetchProducts])

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

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const startListeningInternal = async () => {
    setError('')
    setSuccessMsg('')
    
    try {
      setSuccessMsg('')
      stopActiveRecognition()
      
      let silenceTimer = null
      let lastTranscript = ''

      const recognizer = new SpeechRecognizer({
        lang: selectedLang,
        continuous: !isMobile,
        interimResults: true,
        onStart: () => {
          listeningRef.current = true
          setIsListening(true)
          setTranscript('')
          setInterimTranscript('')
          console.log('Speech recognition started')
        },
        onResult: (result) => {
          if (silenceTimer) clearTimeout(silenceTimer)

          if (result.isFinal) {
            const newTranscript = (transcript + ' ' + result.final).trim()
            setTranscript(newTranscript)
            setInterimTranscript('')
            lastTranscript = newTranscript

            // Process after 1.5 second pause
            silenceTimer = setTimeout(async () => {
              if (lastTranscript && recognizerRef.current) {
                console.log('Processing:', lastTranscript)
                await processWithAI(lastTranscript)
                setTranscript('')
                lastTranscript = ''
              }
            }, 1500)
          } else {
            setInterimTranscript(result.interim)
          }
        },
        onError: (error) => {
          console.error('Speech recognition error:', error)
          if (error === 'not-allowed') {
            setError(t('micAccessDenied'))
          } else if (error === 'audio-capture') {
            setError(t('micBusy'))
          } else if (error === 'no-speech') {
            // Ignore no-speech errors, they're normal
            console.log('No speech detected, continuing...')
          } else {
            setError(`${t('speechError')}: ${error}`)
          }
          
          // Don't stop on no-speech errors
          if (error !== 'no-speech') {
            listeningRef.current = false
            setIsListening(false)
          }
          
          if (silenceTimer) clearTimeout(silenceTimer)
        },
        onEnd: () => {
          if (silenceTimer) clearTimeout(silenceTimer)
          
          // Process any remaining transcript
          if (lastTranscript) {
            processWithAI(lastTranscript)
            lastTranscript = ''
          }

          // Auto-restart if still listening
          if (listeningRef.current && recognizerRef.current && !isMobile) {
            try {
              console.log('Restarting speech recognition...')
              recognizerRef.current.start()
            } catch (e) {
              console.error('Failed to restart:', e)
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
      console.error('Start listening error:', err)
      if (err?.message === 'SPEECH_UNSUPPORTED') {
        setError(`${t('voiceStartFailed')}. ${t('useChrome')}`)
      } else {
        setError(t('voiceStartFailed'))
      }
      setSuccessMsg('')
    }
  }

  const startListening = () => {
    requireVoiceVerification(() => {
      startListeningInternal()
    })
  }

  const processChunkWithAI = async (text) => {
    if (!text || text.trim().length === 0) return

    const normalizedText = mapTamilNumbersToDigits(text)
    const translatedText = translateToEnglish(normalizedText)
    const localParsed = parseProductFromSpeech(translatedText)
    let parsed = localParsed
    const spokenFields = detectVoiceUpdateFields(text, translatedText)

    try {
      const aiParsed = await parseVoiceCommandWithAI(translatedText, products)
      if (aiParsed.name || aiParsed.price !== null || aiParsed.quantity !== null) {
        parsed = {
          name: aiParsed.name || localParsed.name,
          price: aiParsed.price !== null ? aiParsed.price : localParsed.price,
          quantity: aiParsed.quantity !== null ? aiParsed.quantity : localParsed.quantity
        }
      }

      const parsedName = isValidProductName(parsed.name || '') ? parsed.name : ''
      const fallbackMatch = findExistingProduct(parsedName, formData.brand, translatedText)
        || findExistingProduct('', formData.brand, translatedText)
      const derivedBaseName = parsedName || fallbackMatch?.name || ''
      const derivedBaseBrand = fallbackMatch?.brand || formData.brand
      const { productName, brandName } = deriveBrandAndName(derivedBaseName, translatedText, derivedBaseBrand, products)
      const altNames = extractAlternativeNames(text, productName)

      const newFormData = {
        name: productName || '',
        price: parsed.price !== null && parsed.price !== undefined ? parsed.price.toString() : '',
        quantity: parsed.quantity !== null && parsed.quantity !== undefined ? parsed.quantity.toString() : '',
        brand: brandName || '',
        synonyms: altNames.join(', '),
        expiryDate: formData.expiryDate || ''
      }

      setFormData(newFormData)

      // Auto-submit if we have name and quantity/price signal from voice.
      if (parsed.name && (parsed.price !== null || parsed.quantity !== null)) {
        await submitVoiceProduct(newFormData, {
          sourceText: translatedText,
          ...spokenFields
        })
      } else if (parsed.name && !parsed.price && !parsed.quantity) {
        // Just name, no price/qty - show helpful error
        setError(t('voiceNeedPriceQuantity', { name: parsed.name }))
      }
    } catch (error) {
      console.error('AI parsing failed:', error)
      // Fallback to local parsing
      fillFormFromSpeech(text)
    }
  }

  const processWithAI = async (text) => {
    if (!text || text.trim().length === 0) return

    const chunks = splitProductSpeechChunks(text)
    for (const chunk of chunks) {
      await processChunkWithAI(chunk)
    }
  }

  const fillFormFromSpeech = (text) => {
    if (!text) return

    const translated = translateToEnglish(mapTamilNumbersToDigits(text))
    const parsed = parseProductFromSpeech(translated)
    const spokenFields = detectVoiceUpdateFields(text, translated)

    console.log('Parsed from speech:', parsed) // Debug log

    const { productName, brandName } = deriveBrandAndName(parsed.name || formData.name, translated, formData.brand, products)
    const altNames = extractAlternativeNames(translated, productName)

    const newFormData = {
      name: productName || formData.name,
      price: parsed.price ? parsed.price.toString() : formData.price,
      quantity: parsed.quantity ? parsed.quantity.toString() : formData.quantity,
      brand: brandName || formData.brand,
        synonyms: mergeSynonymText(formData.synonyms, altNames),
        expiryDate: formData.expiryDate || ''
    }

    setFormData(newFormData)

    // Auto-submit if name and any update signal are present.
    if (
      parsed.name &&
      (
        spokenFields.hasPriceMentioned ||
        spokenFields.hasQuantityMentioned ||
        parsed.price !== null ||
        parsed.quantity !== null
      )
    ) {
      setTimeout(() => {
        submitVoiceProduct(newFormData, {
          sourceText: translated,
          ...spokenFields
        })
      }, 500)
    }
  }

  const findExistingProduct = (name, brand = '', sourceText = '') => {
    const cleanName = normalizeSpeechText(name)
    const cleanBrand = normalizeSpeechText(brand)
    const cleanSource = normalizeSpeechText(sourceText)

    if (!cleanName && !cleanSource) return null

    const scored = []

    for (const product of products) {
      const aliases = buildProductAliases(product)
      const productName = normalizeSpeechText(product.name || '')
      const productBrand = normalizeSpeechText(product.brand || '')

      if (cleanBrand && productBrand && cleanBrand !== productBrand) {
        continue
      }

      for (const alias of aliases) {
        let score = 0

        if (cleanName && alias === cleanName) score = 100
        else if (cleanName && (alias.includes(cleanName) || cleanName.includes(alias))) score = 80
        else if (cleanSource && (cleanSource.includes(alias) || alias.includes(cleanSource))) score = 75

        if (productName && cleanSource.includes(productName)) score += 15
        if (productBrand && cleanSource.includes(productBrand)) score += 20
        if (cleanBrand && productBrand && cleanBrand === productBrand) score += 20

        if (score > 0) {
          scored.push({ product, score, productName, productBrand })
        }
      }
    }

    if (scored.length === 0) return null

    scored.sort((a, b) => b.score - a.score)
    if (scored[0].score < 60) return null

    const top = scored.filter(item => item.score === scored[0].score)
    if (top.length === 1) return top[0].product

    const brandMentionedTop = top.filter(item => item.productBrand && cleanSource.includes(item.productBrand))
    if (brandMentionedTop.length === 1) return brandMentionedTop[0].product

    const sameNameTop = top.filter(item => item.productName && item.productName === cleanName)
    const uniqueBrandsForName = new Set(sameNameTop.map(item => item.productBrand || '__no_brand__'))
    if (sameNameTop.length > 1 && uniqueBrandsForName.size > 1 && !cleanBrand) {
      return null
    }

    return top[0].product
  }

  const submitVoiceProduct = async (data, speechMeta = {}) => {
    if (!data.name) return

    setLoading(true)
    setError('')

    try {
      const sourceText = mapTamilNumbersToDigits(speechMeta.sourceText || '')
      const hasPriceMentioned = speechMeta.hasPriceMentioned === true
      const hasQuantityMentioned = speechMeta.hasQuantityMentioned === true
      const fallbackSpeechParse = parseProductFromSpeech(speechMeta.sourceText || '')
      let parsedPrice = Number.parseFloat(data.price)
      let parsedQuantity = Number.parseFloat(data.quantity)
      const expiryDate = data.expiryDate || null

      if (hasPriceMentioned && Number.isFinite(fallbackSpeechParse.price)) {
        parsedPrice = Number.parseFloat(fallbackSpeechParse.price)
      }

      if (hasQuantityMentioned && Number.isFinite(fallbackSpeechParse.quantity)) {
        parsedQuantity = Number.parseFloat(fallbackSpeechParse.quantity)
      }

      if (!Number.isFinite(parsedQuantity) && hasQuantityMentioned) {
        const extractedQty = parseVoiceQuantity(speechMeta.sourceText || '')
        if (Number.isFinite(extractedQty)) {
          parsedQuantity = extractedQty
        }
      }

      const hasPrice = hasPriceMentioned || Number.isFinite(parsedPrice)
      const hasQuantity = hasQuantityMentioned || Number.isFinite(parsedQuantity)

      const matchedProduct = findExistingProduct(data.name, data.brand, sourceText)
        || findExistingProduct('', data.brand, sourceText)

      if (matchedProduct) {
        if (hasPriceMentioned && !hasQuantity) {
          setError(t('voicePriceUpdateSeparate', { name: matchedProduct.name }))
          return
        }

        if (!hasQuantity || !Number.isFinite(parsedQuantity) || parsedQuantity <= 0) {
          setError(t('voiceNeedQuantityExisting', { name: matchedProduct.name }))
          return
        }

        const existingQty = Number.parseFloat(matchedProduct.quantity) || 0
        const newQty = Number((existingQty + parsedQuantity).toFixed(2))
        const updateData = { quantity: newQty }

        if (expiryDate) {
          updateData.expiry_date = expiryDate
        }

        await api.put(`/products/${auth.shopId}/${matchedProduct.id}`, updateData)

        const messageKey = hasPriceMentioned
          ? 'voiceQuantityAddedPriceIgnored'
          : 'voiceQuantityAdded'

        setSuccessMsg(t(messageKey, {
          name: matchedProduct.name,
          qty: parsedQuantity,
          total: newQty
        }))
      } else {
        if (!hasPrice || !hasQuantity) {
          setError(t('voiceNeedPriceQuantity', { name: data.name }))
          return
        }

        const safePrice = Number.isFinite(parsedPrice) && parsedPrice > 0 ? parsedPrice : 0
        const safeQuantity = Number.isFinite(parsedQuantity) && parsedQuantity > 0 ? parsedQuantity : 0

        if (safePrice <= 0 || safeQuantity <= 0) {
          setError(t('voiceNeedPriceQuantity', { name: data.name }))
          return
        }

        const submitData = {
          name: data.name,
          price: safePrice,
          quantity: safeQuantity,
          brand: data.brand || null,
          synonyms: data.synonyms ? data.synonyms.split(',').map(s => s.trim()) : [],
          shop_id: auth.shopId,
          expiry_date: expiryDate
        }

        await api.post('/products', submitData)
        setSuccessMsg(t('voiceProductAdded', {
          name: data.name,
          qty: safeQuantity,
          price: safePrice
        }))
      }

      // Clear form but DON'T close it, keep voice active
      setFormData({ name: '', brand: '', price: '', quantity: '', synonyms: '', expiryDate: '' })
      setTranscript('')
      setInterimTranscript('')
      await fetchProducts()

      setTimeout(() => setSuccessMsg(''), 3000)
    } catch (err) {
      setError(err.response?.data?.message || t('saveProductFailed'))
    } finally {
      setLoading(false)
    }
  }

  const stopListening = () => {
    listeningRef.current = false
    if (recognizerRef.current) {
      recognizerRef.current.stop()
      setIsListening(false)

      // Parse the transcript and fill form
      const fullTranscript = (transcript + ' ' + interimTranscript).trim()
      if (fullTranscript) {
        fillFormFromSpeech(fullTranscript)
      }
    }
    
  }

  const submitProduct = async () => {
    setLoading(true)
    setError('')

    try {
      const submitData = {
        name: formData.name,
        price: parseFloat(formData.price),
        quantity: parseFloat(formData.quantity) || 1,
        brand: formData.brand || null,
        synonyms: formData.synonyms ? formData.synonyms.split(',').map(s => s.trim()) : [],
        shop_id: auth.shopId,
        expiry_date: formData.expiryDate || null
      }

      if (editingProduct) {
        await api.put(`/products/${auth.shopId}/${editingProduct.id}`, submitData)
      } else {
        // Prevent duplicates in add mode: update matching product if it already exists.
        const existing = findExistingProduct(formData.name, formData.brand, `${formData.brand || ''} ${formData.name}`)

        if (existing) {
          const existingQty = Number.parseFloat(existing.quantity) || 0
          const qtyToAdd = Number.parseFloat(formData.quantity) || 0

          const updateData = {
            name: existing.name,
            brand: existing.brand,
            synonyms: existing.synonyms,
            quantity: Number((existingQty + qtyToAdd).toFixed(2)),
            price: Number.isFinite(Number.parseFloat(formData.price))
              ? Number.parseFloat(formData.price)
              : existing.price,
            expiry_date: formData.expiryDate || existing.expiry_date || null
          }

          await api.put(`/products/${auth.shopId}/${existing.id}`, updateData)
          setSuccessMsg(t('productUpdated', { name: existing.name }))
          setTimeout(() => setSuccessMsg(''), 3000)
        } else {
          await api.post('/products', submitData)
        }
      }

      setFormData({ name: '', brand: '', price: '', quantity: '', synonyms: '', expiryDate: '' })
      setEditingProduct(null)
      setShowForm(false)
      fetchProducts()
    } catch (err) {
      setError(err.response?.data?.message || t('saveProductFailed'))
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    requireVoiceVerification(() => {
      submitProduct()
    })
  }

  const handleEdit = (product) => {
    setEditingProduct(product)
    setFormData({
      name: product.name || '',
      brand: product.brand || '',
      price: product.price?.toString() || '',
      quantity: product.quantity?.toString() || '',
      synonyms: Array.isArray(product.synonyms) ? product.synonyms.join(', ') : '',
      expiryDate: formatExpiryInputValue(product.expiry_date)
    })
    setShowForm(true)
  }

  const handleDelete = async (productId) => {
    if (!confirm(t('confirmDelete'))) return

    try {
      await api.delete(`/products/${auth.shopId}/${productId}`)
      fetchProducts()
    } catch (err) {
      setError(t('deleteProductFailed'))
    }
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingProduct(null)
    setFormData({ name: '', brand: '', price: '', quantity: '', synonyms: '', expiryDate: '' })
  }

  return (
    <div className="min-h-screen bg-gray-50 overflow-hidden">
      <Navbar />

      <VoiceVerifyModal
        open={voiceVerifyOpen}
        onSuccess={handleVoiceVerified}
        onCancel={handleVoiceVerifyCancel}
        threshold={0.3}
      />

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-800">{t('manageProducts')}</h1>
            <p className="text-sm text-gray-500 mt-1">{t('addProductByVoice')}</p>
          </div>
          {!showForm && (
            <button
              onClick={() => requireVoiceVerification(() => setShowForm(true))}
              className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-full font-semibold transition"
            >
              <Plus size={20} />
              {t('addProduct')}
            </button>
          )}
        </div>

        {error && (
          <div className="bg-red-100 border border-red-200 text-red-700 px-4 py-3 rounded-2xl mb-6">
            {error}
          </div>
        )}

        {successMsg && (
          <div className="bg-green-100 border border-green-200 text-green-700 px-4 py-3 rounded-2xl mb-6 animate-pulse">
            {successMsg}
          </div>
        )}

        {showForm && (
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-8 border border-gray-100">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
              <h2 className="text-2xl font-bold text-gray-800">
                {editingProduct ? t('editProductTitle') : t('addNewProduct')}
              </h2>
              <button onClick={handleCancel} className="p-2 hover:bg-gray-100 rounded-lg">
                <X size={24} />
              </button>
            </div>

            {/* Voice Recording Section */}
            <div className="bg-gradient-to-r from-emerald-50 to-blue-50 p-6 rounded-lg mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-800">{t('addProductByVoice')}</h3>
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
              <div className="text-sm text-gray-600 mb-4 space-y-1">
                <p>{t('voiceAddHintAdd')}</p>
                <p>{t('voiceAddHintQuantity')}</p>
                <p>{t('voiceAddHintPrice')}</p>
              </div>
              {isMobile && (
                <p className="text-xs text-emerald-700 mb-4">{t('mobileVoiceHint')}</p>
              )}

              <div className="flex flex-wrap items-center gap-4">
                {!isListening ? (
                  <button
                    type="button"
                    onClick={startListening}
                    className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-lg transition"
                  >
                    <Mic size={20} />
                    {t('startSpeaking')}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={stopListening}
                    className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg transition animate-pulse"
                  >
                    <Square size={20} />
                    {t('stopListening')}
                  </button>
                )}

                {isListening && (
                  <span className="text-red-600 font-medium flex items-center gap-2">
                    <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
                    {t('listening')}
                  </span>
                )}

              </div>

              {/* Live transcript display */}
              {(transcript || interimTranscript) && (
                <div className="mt-4 p-4 bg-white rounded-lg border border-emerald-200">
                  <p className="text-sm text-gray-500 mb-1">{t('youSaid')}</p>
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
                  <label className="block text-gray-700 font-semibold mb-2">{t('productNameLabel')} *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-emerald-500 focus:outline-none"
                    placeholder={t('productNamePlaceholder')}
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-2">{t('brandLabel')}</label>
                  <input
                    type="text"
                    name="brand"
                    value={formData.brand}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-emerald-500 focus:outline-none"
                    placeholder={t('brandPlaceholder')}
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">{t('priceLabel')} *</label>
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
                  <label className="block text-gray-700 font-semibold mb-2">{t('quantityLabel')}</label>
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
                <label className="block text-gray-700 font-semibold mb-2">{t('expiryDateLabel')}</label>
                <input
                  type="date"
                  name="expiryDate"
                  value={formData.expiryDate}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-emerald-500 focus:outline-none"
                />
                <p className="text-sm text-gray-500 mt-1">{t('expiryDateHelp')}</p>
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2">{t('synonymsLabel')}</label>
                <input
                  type="text"
                  name="synonyms"
                  value={formData.synonyms}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-emerald-500 focus:outline-none"
                  placeholder={t('synonymsPlaceholder')}
                />
                <p className="text-sm text-gray-500 mt-1">
                  {t('synonymsHelp')}
                </p>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 rounded-lg transition disabled:opacity-50"
                >
                  {loading ? t('saving') : editingProduct ? t('updateProduct') : t('addProduct')}
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
