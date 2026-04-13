import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { Mic, Square, Globe, BadgeCheck } from 'lucide-react'
import Navbar from '../components/Navbar'
import VoiceVerifyModal from '../components/VoiceVerifyModal'
import api from '../api/api'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import {
  SpeechRecognizer,
  translateToEnglish,
  supportedLanguages,
  isMobileDevice,
  stopActiveRecognition
} from '../utils/speechRecognition'
import { getLocalizedProductName } from '../utils/tamilTransliteration'

const normalizeSpeechText = (value = '') => value
  .toLowerCase()
  .replace(/[^a-z0-9\s]/gi, ' ')
  .replace(/\s+/g, ' ')
  .trim()

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

  return aliases.map(alias => normalizeSpeechText(alias || '')).filter(Boolean)
}

const findProductMatch = (spokenText, products) => {
  const searchText = normalizeSpeechText(spokenText)
  if (!searchText) return null

  const words = searchText.split(' ').filter(word => word.length > 1)
  let best = null
  let bestScore = 0
  let secondBest = 0

  for (const product of products) {
    const aliases = buildAliases(product)
    const brandText = normalizeSpeechText(product.brand || '')
    const nameText = normalizeSpeechText(product.name || '')

    for (const alias of aliases) {
      let score = 0

      if (alias === searchText) score = 100
      else if (alias.startsWith(searchText) || searchText.startsWith(alias)) score = 85
      else if (alias.includes(searchText) || searchText.includes(alias)) score = 75
      else {
        const aliasWords = alias.split(' ').filter(Boolean)
        const overlap = words.filter(word => aliasWords.some(aliasWord => aliasWord.includes(word) || word.includes(aliasWord))).length
        if (overlap > 0) score = Math.min(70, 45 + overlap * 10)
      }

      if (brandText && searchText.includes(brandText)) score += 20
      if (nameText && searchText.includes(nameText)) score += 10

      if (score > bestScore) {
        secondBest = bestScore
        bestScore = score
        best = product
      } else if (score > secondBest) {
        secondBest = score
      }
    }
  }

  if (bestScore < 58) return null
  if (bestScore - secondBest < 8) return null
  return best
}

const PriceUpdate = () => {
  const { auth, isVoiceVerifiedForSession } = useAuth()
  const { t, language } = useLanguage()
  const [products, setProducts] = useState([])
  const [selectedLang, setSelectedLang] = useState('en-IN')
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [interimTranscript, setInterimTranscript] = useState('')
  const [voiceStatus, setVoiceStatus] = useState('')
  const [pendingUpdate, setPendingUpdate] = useState(null)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [loading, setLoading] = useState(false)
  const recognizerRef = useRef(null)
  const listeningRef = useRef(false)
  const pendingActionRef = useRef(null)
  const isMobile = useMemo(() => isMobileDevice(), [])
  const [voiceVerifyOpen, setVoiceVerifyOpen] = useState(false)

  const localizeName = useCallback((name, brand) => (
    getLocalizedProductName(name, brand, language)
  ), [language])

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

  const processVoiceUpdate = async (text) => {
    if (!text) return

    setError('')
    setSuccessMsg('')
    setVoiceStatus(t('processing'))

    try {
      const translated = translateToEnglish(text)
      const response = await api.post('/ai-parse/update-price', {
        text: translated,
        availableProducts: products.map(product => ({
          id: product.id,
          name: product.name,
          brand: product.brand,
          synonyms: product.synonyms,
          price: product.price
        }))
      })

      if (!response.data?.isUpdate) {
        setVoiceStatus('')
        setError(t('priceUpdateNotDetected'))
        return
      }

      const newPrice = Number(response.data?.newPrice)
      if (!Number.isFinite(newPrice) || newPrice <= 0) {
        setVoiceStatus('')
        setError(t('priceUpdateInvalid'))
        return
      }

      let matchedProduct = null
      if (response.data?.productId) {
        matchedProduct = products.find(product => String(product.id) === String(response.data.productId))
      }

      if (!matchedProduct) {
        matchedProduct = findProductMatch(response.data?.productName || translated, products)
      }

      if (!matchedProduct) {
        setVoiceStatus('')
        setError(t('productNotFound', { segment: response.data?.productName || text }))
        return
      }

      setPendingUpdate({ product: matchedProduct, newPrice })
      setVoiceStatus(t('priceUpdateDetected', {
        name: localizeName(matchedProduct.name, matchedProduct.brand),
        price: newPrice
      }))
    } catch (err) {
      setVoiceStatus('')
      setError(t('priceUpdateFailed'))
    }
  }

  const startListeningInternal = () => {
    setError('')
    setSuccessMsg('')
    setVoiceStatus('')

    try {
      stopActiveRecognition()
      const recognizer = new SpeechRecognizer({
        lang: selectedLang,
        continuous: !isMobile,
        interimResults: true,
        onStart: () => {
          listeningRef.current = true
          setIsListening(true)
          setTranscript('')
          setInterimTranscript('')
        },
        onResult: (result) => {
          if (result.isFinal) {
            const newTranscript = (transcript + ' ' + result.final).trim()
            setTranscript(newTranscript)
            setInterimTranscript('')
            processVoiceUpdate(newTranscript)
          } else {
            setInterimTranscript(result.interim)
          }
        },
        onError: (err) => {
          if (err === 'not-allowed') {
            setError(t('micAccessDenied'))
          } else if (err === 'audio-capture') {
            setError(t('micBusy'))
          } else if (err !== 'no-speech') {
            setError(`${t('speechError')}: ${err}`)
          }
          listeningRef.current = false
          setIsListening(false)
        },
        onEnd: () => {
          listeningRef.current = false
          setIsListening(false)
        }
      })

      recognizer.init()
      recognizer.start()
      recognizerRef.current = recognizer
    } catch (err) {
      if (err?.message === 'SPEECH_UNSUPPORTED') {
        setError(`${t('voiceStartFailed')}. ${t('useChrome')}`)
      } else {
        setError(t('voiceStartFailed'))
      }
    }
  }

  const startListening = () => {
    requireVoiceVerification(() => {
      startListeningInternal()
    })
  }

  const stopListening = () => {
    listeningRef.current = false
    if (recognizerRef.current) {
      recognizerRef.current.stop()
      setIsListening(false)
    }
  }

  const applyUpdateInternal = async () => {
    if (!pendingUpdate) return

    setLoading(true)
    setError('')

    try {
      const { product, newPrice } = pendingUpdate
      await api.put(`/products/${auth.shopId}/${product.id}`, { price: newPrice })
      setSuccessMsg(t('priceUpdatedSuccess', {
        name: localizeName(product.name, product.brand),
        price: newPrice
      }))
      setPendingUpdate(null)
      await fetchProducts()
    } catch (err) {
      setError(t('priceUpdateFailed'))
    } finally {
      setLoading(false)
    }
  }

  const applyUpdate = () => {
    requireVoiceVerification(() => {
      applyUpdateInternal()
    })
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

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-4xl font-bold text-gray-800">{t('priceUpdateTitle')}</h1>
            <p className="text-gray-600 mt-2">{t('priceUpdateDesc')}</p>
          </div>
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-full px-3 py-2 shadow-sm">
            <Globe size={16} className="text-gray-500" />
            <select
              value={selectedLang}
              onChange={(e) => setSelectedLang(e.target.value)}
              className="text-sm border border-gray-300 rounded-full px-2 py-1 focus:outline-none focus:border-emerald-500"
            >
              {supportedLanguages.map(lang => (
                <option key={lang.code} value={lang.code}>{lang.name}</option>
              ))}
            </select>
          </div>
        </div>

        {isMobile && (
          <div className="text-xs text-emerald-700 font-semibold bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-full mb-4 inline-flex">
            {t('mobileVoiceHint')}
          </div>
        )}

        {error && (
          <div className="bg-red-100 border border-red-200 text-red-700 px-4 py-3 rounded-2xl mb-4">
            {error}
          </div>
        )}

        {successMsg && (
          <div className="bg-green-100 border border-green-200 text-green-700 px-4 py-3 rounded-2xl mb-4">
            {successMsg}
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800 mb-2">{t('priceUpdateVoiceTitle')}</h2>
          <p className="text-sm text-gray-600 mb-4">{t('priceUpdateHint')}</p>

          <div className="flex flex-wrap items-center gap-4 mb-4">
            {!isListening ? (
              <button
                type="button"
                onClick={startListening}
                className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-full transition"
              >
                <Mic size={20} />
                {t('voiceStart')}
              </button>
            ) : (
              <button
                type="button"
                onClick={stopListening}
                className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-full transition animate-pulse"
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

          {(transcript || interimTranscript) && (
            <div className="mt-4 p-4 bg-emerald-50 rounded-2xl border border-emerald-200">
              <p className="text-sm text-gray-500 mb-1">{t('youSaid')}</p>
              <p className="text-gray-800 font-medium">
                {transcript}
                <span className="text-gray-400 italic">{interimTranscript}</span>
              </p>
            </div>
          )}

          {voiceStatus && (
            <div className="mt-4 p-4 bg-blue-50 rounded-2xl border border-blue-200 text-blue-700 text-sm">
              {voiceStatus}
            </div>
          )}
        </div>

        {pendingUpdate && (
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center gap-3 mb-4">
              <BadgeCheck className="text-emerald-600" size={24} />
              <div>
                <p className="text-sm text-gray-600">{t('priceUpdateDetectedTitle')}</p>
                <p className="text-lg font-semibold text-gray-800">
                  {localizeName(pendingUpdate.product.name, pendingUpdate.product.brand)}
                </p>
              </div>
            </div>
            <p className="text-gray-700 mb-4">
              {t('currentPriceLabel')}: {t('currency')}{pendingUpdate.product.price} → {t('currency')}{pendingUpdate.newPrice}
            </p>
            <button
              type="button"
              onClick={applyUpdate}
              disabled={loading}
              className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-full transition disabled:opacity-50"
            >
              {loading ? t('saving') : t('applyPriceUpdate')}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default PriceUpdate
