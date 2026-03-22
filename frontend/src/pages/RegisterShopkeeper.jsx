import { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import api from '../api/api'
import PinInput from '../components/PinInput'

const RegisterShopkeeper = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [formData, setFormData] = useState({
    shopId: location.state?.shopId || '',
    shopName: location.state?.shopName || '',
    name: '',
    role: 'alternative'
  })
  const [pin, setPin] = useState('')
  const [showPinInput, setShowPinInput] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handlePinComplete = (enteredPin) => {
    setPin(enteredPin)
    handleSubmit(enteredPin)
  }

  const handleSubmit = async (enteredPin) => {
    if (!formData.shopId || !formData.name || !enteredPin) {
      setError('Please fill all fields')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await api.post('/shopkeepers/register', {
        shop_id: formData.shopId,
        shop_name: formData.shopName,
        name: formData.name,
        role: formData.role,
        pin: enteredPin
      })

      localStorage.removeItem('tempShopData')
      navigate('/login', { state: { shopId: formData.shopId } })
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to register shopkeeper')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center px-4 py-8">
      <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full">
        <Link to="/" className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 mb-6">
          <ArrowLeft size={20} />
          Back to Home
        </Link>

        <h1 className="text-3xl font-bold text-gray-800 mb-2">Register Shopkeeper</h1>
        <p className="text-gray-600 mb-6">Add yourself as a shopkeeper</p>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {!showPinInput ? (
          <form onSubmit={(e) => { e.preventDefault(); setShowPinInput(true); }} className="space-y-4">
            <div>
              <label className="block text-gray-700 font-semibold mb-2">Shop ID</label>
              <input
                type="text"
                name="shopId"
                value={formData.shopId}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none transition"
                placeholder="Enter your shop ID"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-2">Shop Name</label>
              <input
                type="text"
                name="shopName"
                value={formData.shopName}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none transition"
                placeholder="Your shop name"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-2">Your Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none transition"
                placeholder="Enter your name"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-2">Role</label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none transition"
              >
                <option value="main">Main Shopkeeper</option>
                <option value="alternative">Alternative Shopkeeper</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold py-3 rounded-lg hover:shadow-lg transition disabled:opacity-50"
            >
              Next: Set PIN
            </button>
          </form>
        ) : (
          <div>
            <label className="block text-gray-700 font-semibold mb-4">Enter 4-Digit PIN</label>
            <PinInput onComplete={handlePinComplete} error={error} />
          </div>
        )}

        <p className="text-center text-gray-600 mt-6">
          Already have an account? <Link to="/login" className="text-indigo-600 hover:text-indigo-700 font-semibold">Sign in</Link>
        </p>
      </div>
    </div>
  )
}

export default RegisterShopkeeper