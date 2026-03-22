import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Copy, Check } from 'lucide-react'
import api from '../api/api'
import { useAuth } from '../context/AuthContext'
import PinInput from '../components/PinInput'

const RegisterShop = () => {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [step, setStep] = useState('details') // details, pin, success
  const [formData, setFormData] = useState({
    shopName: '',
    shopkeeperName: '',
    location: ''
  })
  const [pin, setPin] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [shopId, setShopId] = useState('')
  const [copied, setCopied] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleDetailsSubmit = (e) => {
    e.preventDefault()
    if (!formData.shopName || !formData.shopkeeperName) {
      setError('Please fill all required fields')
      return
    }
    setError('')
    setStep('pin')
  }

  const handlePinComplete = async (enteredPin) => {
    setPin(enteredPin)
    setLoading(true)
    setError('')

    try {
      const response = await api.post('/shops', {
        shop_name: formData.shopName,
        shopkeeper_name: formData.shopkeeperName,
        location: formData.location,
        pin: enteredPin
      })
      
      const { shop_id, token } = response.data
      setShopId(shop_id)
      setStep('success')
      
      // Auto login the user
      login(shop_id, formData.shopName, formData.shopkeeperName, 'main', token)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to register shop')
    } finally {
      setLoading(false)
    }
  }

  const copyShopId = () => {
    navigator.clipboard.writeText(shopId)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const goToDashboard = () => {
    navigate('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center px-4 py-8">
      <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full">
        {step !== 'success' && (
          <Link to="/" className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 mb-6">
            <ArrowLeft size={20} />
            Back to Home
          </Link>
        )}

        {step === 'details' && (
          <>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Register Your Shop</h1>
            <p className="text-gray-600 mb-6">Create a new shop and become the main shopkeeper</p>

            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6">
                {error}
              </div>
            )}

            <form onSubmit={handleDetailsSubmit} className="space-y-4">
              <div>
                <label className="block text-gray-700 font-semibold mb-2">Shop Name *</label>
                <input
                  type="text"
                  name="shopName"
                  value={formData.shopName}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none transition text-lg"
                  placeholder="e.g., Kumar Grocery Store"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2">Your Name *</label>
                <input
                  type="text"
                  name="shopkeeperName"
                  value={formData.shopkeeperName}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none transition text-lg"
                  placeholder="e.g., Ravi Kumar"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2">Location</label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none transition text-lg"
                  placeholder="e.g., Chennai, Tamil Nadu"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold py-4 rounded-lg hover:shadow-lg transition text-lg mt-6"
              >
                Next: Set Your PIN →
              </button>
            </form>
          </>
        )}

        {step === 'pin' && (
          <>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Set Your PIN</h1>
            <p className="text-gray-600 mb-6">Create a 4-digit PIN for {formData.shopkeeperName}</p>

            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6">
                {error}
              </div>
            )}

            <div className="mb-6">
              <PinInput onComplete={handlePinComplete} disabled={loading} />
            </div>

            {loading && (
              <p className="text-center text-indigo-600 font-medium">Creating your shop...</p>
            )}

            <button
              onClick={() => setStep('details')}
              className="w-full text-gray-600 hover:text-gray-800 py-2 mt-4"
            >
              ← Back to details
            </button>
          </>
        )}

        {step === 'success' && (
          <div className="text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check className="text-green-600" size={40} />
            </div>
            
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Shop Created! 🎉</h1>
            <p className="text-gray-600 mb-6">Your shop is ready. Save your Shop ID:</p>

            <div className="bg-gray-100 p-4 rounded-lg mb-6">
              <p className="text-sm text-gray-600 mb-2">Your Shop ID</p>
              <div className="flex items-center justify-center gap-2">
                <code className="text-lg font-mono font-bold text-indigo-600 break-all">{shopId}</code>
                <button
                  onClick={copyShopId}
                  className="p-2 hover:bg-gray-200 rounded-lg transition"
                >
                  {copied ? <Check size={20} className="text-green-600" /> : <Copy size={20} />}
                </button>
              </div>
              {copied && <p className="text-green-600 text-sm mt-2">Copied!</p>}
            </div>

            <div className="bg-yellow-50 border border-yellow-300 p-4 rounded-lg mb-6 text-left">
              <p className="text-yellow-800 font-semibold">⚠️ Important!</p>
              <p className="text-yellow-700 text-sm mt-1">
                Save this Shop ID! You'll need it to login and to add alternative shopkeepers.
              </p>
            </div>

            <button
              onClick={goToDashboard}
              className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white font-bold py-4 rounded-lg hover:shadow-lg transition text-lg"
            >
              Go to Dashboard →
            </button>
          </div>
        )}

        {step !== 'success' && (
          <p className="text-center text-gray-600 mt-6">
            Already have a shop? <Link to="/login" className="text-indigo-600 hover:text-indigo-700 font-semibold">Sign in</Link>
          </p>
        )}
      </div>
    </div>
  )
}

export default RegisterShop