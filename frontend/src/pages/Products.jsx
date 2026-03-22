import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, X, Mic, Square, Globe } from 'lucide-react'
import Navbar from '../components/Navbar'
import ProductCard from '../components/ProductCard'
import api from '../api/api'
import { useAuth } from '../context/AuthContext'
import { SpeechRecognizer, parseProductFromSpeech, translateToEnglish, supportedLanguages } from '../utils/speechRecognition'

const Products = () => {
  const navigate = useNavigate()
  const { auth } = useAuth()
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

  useEffect(() => {
    fetchProducts()
    
    // Cleanup speech recognition on unmount
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

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const startListening = () => {
    try {
      let silenceTimer = null;
      let lastTranscript = '';
      
      const recognizer = new SpeechRecognizer({
        lang: selectedLang,
        continuous: true,
        interimResults: true,
        onStart: () => {
          setIsListening(true)
          setTranscript('')
          setInterimTranscript('')
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
          setIsListening(false)
          if (silenceTimer) clearTimeout(silenceTimer)
        },
        onEnd: () => {
          setIsListening(false)
          if (silenceTimer) clearTimeout(silenceTimer)
          // Process any remaining transcript
          if (lastTranscript) {
            processWithAI(lastTranscript)
            lastTranscript = ''
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
  
  const processWithAI = async (text) => {
    if (!text || text.trim().length === 0) return
    
    try {
      // Try AI parsing first
      const response = await api.post('/ai-parse/product', { text })
      const parsed = response.data
      
      console.log('AI parsed:', parsed)
      
      const newFormData = {
        name: parsed.name || formData.name,
        price: parsed.price ? parsed.price.toString() : formData.price,
        quantity: parsed.quantity ? parsed.quantity.toString() : formData.quantity,
        brand: formData.brand,
        synonyms: formData.synonyms
      }
      
      setFormData(newFormData)
      
      // Auto-submit if we have name and price
      if (parsed.name && parsed.price) {
        setTimeout(() => {
          submitVoiceProduct(newFormData)
        }, 300)
      }
    } catch (error) {
      console.error('AI parsing failed, using fallback:', error)
      // Fallback to original parsing
      fillFormFromSpeech(text)
    }
  }

  const fillFormFromSpeech = (text) => {
    if (!text) return
    
    const translated = translateToEnglish(text)
    const parsed = parseProductFromSpeech(translated)
    
    console.log('Parsed from speech:', parsed) // Debug log
    
    const newFormData = {
      name: parsed.name || formData.name,
      price: parsed.price ? parsed.price.toString() : formData.price,
      quantity: parsed.quantity ? parsed.quantity.toString() : formData.quantity,
      brand: formData.brand,
      synonyms: formData.synonyms
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
      setSuccessMsg(`✅ Added ${data.name}! Keep speaking for next product...`)
      setTimeout(() => setSuccessMsg(''), 3000)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save product')
    } finally {
      setLoading(false)
    }
  }

  const stopListening = () => {
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold text-gray-800">Manage Products</h1>
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-semibold transition"
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
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-6 rounded-lg mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-800">🎤 Add Product by Voice (FREE)</h3>
                <div className="flex items-center gap-2">
                  <Globe size={16} className="text-gray-500" />
                  <select
                    value={selectedLang}
                    onChange={(e) => setSelectedLang(e.target.value)}
                    className="text-sm border border-gray-300 rounded-lg px-2 py-1 focus:outline-none focus:border-indigo-500"
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
                    className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg transition"
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
                    Listening...
                  </span>
                )}
              </div>

              {/* Live transcript display */}
              {(transcript || interimTranscript) && (
                <div className="mt-4 p-4 bg-white rounded-lg border border-indigo-200">
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
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none"
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
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none"
                    placeholder="Brand name (optional)"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Price (₹) *</label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    step="0.01"
                    required
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none"
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
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none"
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
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none"
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
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg transition disabled:opacity-50"
                >
                  {loading ? 'Saving...' : editingProduct ? 'Update Product' : 'Add Product'}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-3 rounded-lg transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {products.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">No products yet. Add your first product!</p>
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