import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Trash2, Mic, Square, Search, Volume2 } from 'lucide-react'
import Navbar from '../components/Navbar'
import BillItem from '../components/BillItem'
import VoiceVerification from '../components/VoiceVerification'
import api from '../api/api'
import { useAuth } from '../context/AuthContext'
import { SpeechRecognizer, translateToEnglish } from '../utils/speechRecognition'

const Billing = () => {
  const navigate = useNavigate()
  const { auth } = useAuth()
  const [products, setProducts] = useState([])
  const [billItems, setBillItems] = useState([])
  const [showVerification, setShowVerification] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  
  // Voice states
  const [isListening, setIsListening] = useState(false)
  const [voiceStatus, setVoiceStatus] = useState('')
  const [lastAddedProduct, setLastAddedProduct] = useState(null)
  const recognizerRef = useRef(null)

  useEffect(() => {
    fetchProducts()
    return () => {
      if (recognizerRef.current) {
        recognizerRef.current.abort()
      }
    }
  }, [])

  const fetchProducts = async () => {
    try {
      const response = await api.get(`/products/${auth.shopId}`)
      setProducts(response.data.products || [])
    } catch (err) {
      setError('Failed to fetch products')
    }
  }

  // Find product by name or synonym
  const findProduct = (spokenText) => {
    const searchText = spokenText.toLowerCase().trim()
    
    // Remove common words
    const cleanedText = searchText
      .replace(/\b(add|please|one|two|three|four|five|1|2|3|4|5)\b/gi, '')
      .replace(/\b(piece|pieces|kg|kilo|gram|packet|packets)\b/gi, '')
      .trim()
    
    // Try exact match first
    let found = products.find(p => 
      p.name.toLowerCase() === cleanedText
    )
    
    // Try partial match
    if (!found) {
      found = products.find(p => 
        p.name.toLowerCase().includes(cleanedText) ||
        cleanedText.includes(p.name.toLowerCase())
      )
    }
    
    // Try synonyms
    if (!found) {
      found = products.find(p => {
        if (p.synonyms && Array.isArray(p.synonyms)) {
          return p.synonyms.some(syn => 
            syn.toLowerCase().includes(cleanedText) ||
            cleanedText.includes(syn.toLowerCase())
          )
        }
        return false
      })
    }
    
    // Try word-by-word match
    if (!found) {
      const words = cleanedText.split(' ').filter(w => w.length > 2)
      for (const word of words) {
        found = products.find(p => 
          p.name.toLowerCase().includes(word)
        )
        if (found) break
      }
    }
    
    return found
  }

  // Extract quantity from speech
  const extractQuantity = (text) => {
    const lowerText = text.toLowerCase()
    
    // Number words to digits
    const numberWords = {
      'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
      'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10
    }
    
    for (const [word, num] of Object.entries(numberWords)) {
      if (lowerText.includes(word)) return num
    }
    
    // Try to find a number
    const match = lowerText.match(/(\d+)/)
    if (match) return parseInt(match[1])
    
    return 1
  }

  const handleAddProduct = (product, quantity = 1) => {
    const existingItem = billItems.find(item => item.productId === product.id)
    
    if (existingItem) {
      handleQuantityChange(product.id, existingItem.quantity + quantity)
    } else {
      setBillItems([...billItems, {
        productId: product.id,
        productName: product.name,
        price: product.price,
        quantity: quantity
      }])
    }
    
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
          setIsListening(true)
          setVoiceStatus('🎤 Listening... Say product names!')
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
                await processVoiceBillingWithAI(lastSpokenText)
                lastSpokenText = ''
              }
            }, 1000) // 1 second pause for billing
          }
        },
        onError: (err) => {
          if (err === 'not-allowed') {
            setError('Please allow microphone access')
          }
          setIsListening(false)
          setVoiceStatus('')
          if (silenceTimer) clearTimeout(silenceTimer)
        },
        onEnd: () => {
          // Auto-restart for continuous listening
          if (silenceTimer) clearTimeout(silenceTimer)
          if (isListening && recognizerRef.current) {
            try {
              recognizerRef.current.start()
            } catch (e) {
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
  
  const processVoiceBillingWithAI = async (spokenText) => {
    try {
      // Use AI to match product and extract quantity
      const response = await api.post('/ai-parse/billing', {
        text: spokenText,
        availableProducts: products.map(p => ({ name: p.name, id: p.id }))
      })
      
      const { productName, quantity } = response.data
      
      // Find product by AI-matched name
      const product = products.find(p => 
        p.name.toLowerCase() === productName.toLowerCase()
      )
      
      if (product) {
        handleAddProduct(product, quantity)
        setVoiceStatus(`✅ Added: ${product.name} x${quantity}`)
      } else {
        setVoiceStatus(`❌ Product not found: "${productName}"`)
      }
    } catch (error) {
      console.error('AI billing parse failed, using fallback:', error)
      // Fallback to original method
      const product = findProduct(spokenText)
      if (product) {
        const quantity = extractQuantity(spokenText)
        handleAddProduct(product, quantity)
        setVoiceStatus(`✅ Added: ${product.name} x${quantity}`)
      } else {
        setVoiceStatus(`❌ Product not found: "${spokenText}"`)
      }
    }
  }

  const stopVoiceBilling = () => {
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
    setBillItems(billItems.map(item =>
      item.productId === productId ? { ...item, quantity } : item
    ))
  }

  const handleRemoveItem = (productId) => {
    setBillItems(billItems.filter(item => item.productId !== productId))
  }

  const handleVerificationComplete = (data) => {
    handleCreateBill(data)
  }

  const handleCreateBill = async (voiceData) => {
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
        created_by: auth.name,
        voiceVerification: voiceData
      }

      const response = await api.post('/bills', billData)
      navigate('/bills', { state: { newBillId: response.data.bill_id } })
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create bill')
    } finally {
      setLoading(false)
      setShowVerification(false)
    }
  }

  // Filter products by search
  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.brand && p.brand.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const totalAmount = billItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold text-gray-800">Create Bill</h1>
          
          {/* Voice Billing Button */}
          {!isListening ? (
            <button
              onClick={startVoiceBilling}
              className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg transition"
            >
              <Mic size={24} />
              🎤 Voice Billing
            </button>
          ) : (
            <button
              onClick={stopVoiceBilling}
              className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg transition animate-pulse"
            >
              <Square size={24} />
              Stop Voice
            </button>
          )}
        </div>

        {/* Voice Status Banner */}
        {isListening && (
          <div className="bg-gradient-to-r from-green-100 to-emerald-100 border-2 border-green-400 p-4 rounded-xl mb-6 flex items-center gap-4">
            <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse"></div>
            <div className="flex-1">
              <p className="font-semibold text-green-800">{voiceStatus || 'Listening for product names...'}</p>
              <p className="text-sm text-green-600">Say product names like "Rice", "Sugar", "Amul Butter"</p>
            </div>
          </div>
        )}

        {/* Added Product Notification */}
        {lastAddedProduct && (
          <div className="fixed top-20 right-4 bg-green-500 text-white px-6 py-3 rounded-xl shadow-lg animate-bounce z-50">
            ✅ Added: {lastAddedProduct}
          </div>
        )}

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-800">Products</h2>
                
                {/* Search Box */}
                <div className="relative">
                  <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search products..."
                    className="pl-10 pr-4 py-2 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>
              
              {filteredProducts.length === 0 ? (
                <p className="text-gray-600 text-center py-8">
                  {products.length === 0 ? 'No products available. Add products first.' : 'No matching products found.'}
                </p>
              ) : (
                <div className="grid sm:grid-cols-2 gap-3 max-h-[500px] overflow-y-auto">
                  {filteredProducts.map(product => (
                    <button
                      key={product.id}
                      onClick={() => handleAddProduct(product)}
                      className="flex items-center justify-between bg-gray-50 p-4 rounded-lg border-2 border-gray-200 hover:border-indigo-500 hover:bg-indigo-50 transition text-left"
                    >
                      <div className="flex-1">
                        <p className="font-semibold text-gray-800">{product.name}</p>
                        <p className="text-sm text-gray-600">
                          {product.brand && `${product.brand} • `}₹{product.price}
                        </p>
                      </div>
                      <Plus size={24} className="text-indigo-600" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-lg p-6 sticky top-20">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Bill Summary</h2>

              {billItems.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-2">No items added yet</p>
                  <p className="text-sm text-gray-400">Click products or use voice to add</p>
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
                  <span className="text-gray-600">Items:</span>
                  <span className="font-bold">{billItems.reduce((sum, item) => sum + item.quantity, 0)}</span>
                </div>
                <div className="flex justify-between items-center text-2xl font-bold text-indigo-600 mb-4">
                  <span>Total:</span>
                  <span>₹{totalAmount.toFixed(2)}</span>
                </div>

                {!showVerification ? (
                  <button
                    onClick={() => setShowVerification(true)}
                    disabled={billItems.length === 0 || loading}
                    className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:shadow-lg text-white font-bold py-4 rounded-xl transition disabled:opacity-50 text-lg"
                  >
                    {loading ? 'Processing...' : '✓ Create Bill'}
                  </button>
                ) : (
                  <div className="space-y-3">
                    <VoiceVerification onVerificationComplete={handleVerificationComplete} />
                    <button
                      onClick={() => setShowVerification(false)}
                      className="w-full bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-3 rounded-xl transition"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Billing