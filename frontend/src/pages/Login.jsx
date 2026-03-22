import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Store } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import api from '../api/api'
import PinInput from '../components/PinInput'

const Login = () => {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [step, setStep] = useState('shopId') // shopId, role, pin
  const [shopId, setShopId] = useState('')
  const [shopInfo, setShopInfo] = useState(null)
  const [role, setRole] = useState('main')
  const [shopkeeperInfo, setShopkeeperInfo] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleShopIdSubmit = async (e) => {
    e.preventDefault()
    if (!shopId.trim()) {
      setError('Please enter your Shop ID')
      return
    }

    setLoading(true)
    setError('')

    try {
      // Get shop info
      const response = await api.get(`/shops/${shopId}`)
      setShopInfo(response.data)
      setStep('role')
    } catch (err) {
      setError('Shop not found. Please check your Shop ID.')
    } finally {
      setLoading(false)
    }
  }

  const handleRoleSelect = async (selectedRole) => {
    setRole(selectedRole)
    setLoading(true)
    setError('')

    try {
      const response = await api.post('/shopkeepers/get-by-shop', {
        shopId: shopId,
        role: selectedRole
      })
      setShopkeeperInfo(response.data)
      setStep('pin')
    } catch (err) {
      setError(`No ${selectedRole} shopkeeper found for this shop.`)
    } finally {
      setLoading(false)
    }
  }

  const handlePinComplete = async (enteredPin) => {
    setLoading(true)
    setError('')

    try {
      const response = await api.post('/shopkeepers/verify-pin', {
        shopkeeperId: shopkeeperInfo.id,
        pin: enteredPin
      })

      const { token, shop } = response.data
      login(shopId, shop.name, shopkeeperInfo.name, role, token)
      navigate('/dashboard')
    } catch (err) {
      setError('Wrong PIN. Please try again.')
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

        {/* Step 1: Enter Shop ID */}
        {step === 'shopId' && (
          <>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Welcome Back!</h1>
            <p className="text-gray-600 mb-6">Enter your Shop ID to login</p>

            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6">
                {error}
              </div>
            )}

            <form onSubmit={handleShopIdSubmit} className="space-y-4">
              <div>
                <label className="block text-gray-700 font-semibold mb-2">Shop ID</label>
                <input
                  type="text"
                  value={shopId}
                  onChange={(e) => setShopId(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none transition text-lg font-mono"
                  placeholder="Paste your Shop ID here"
                  autoFocus
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold py-4 rounded-lg hover:shadow-lg transition text-lg disabled:opacity-50"
              >
                {loading ? 'Checking...' : 'Continue →'}
              </button>
            </form>
          </>
        )}

        {/* Step 2: Select Role */}
        {step === 'role' && shopInfo && (
          <>
            <div className="flex items-center gap-3 mb-6 p-4 bg-indigo-50 rounded-lg">
              <Store className="text-indigo-600" size={32} />
              <div>
                <p className="font-bold text-gray-800">{shopInfo.shop_name}</p>
                <p className="text-sm text-gray-600">{shopInfo.location}</p>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-gray-800 mb-2">Select Your Role</h2>
            <p className="text-gray-600 mb-6">Who are you?</p>

            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6">
                {error}
              </div>
            )}

            <div className="space-y-3">
              <button
                onClick={() => handleRoleSelect('main')}
                disabled={loading}
                className="w-full p-4 border-2 border-indigo-500 bg-indigo-50 hover:bg-indigo-100 rounded-lg text-left transition disabled:opacity-50"
              >
                <p className="font-bold text-indigo-700">👑 Main Shopkeeper</p>
                <p className="text-sm text-gray-600">Full access to all features</p>
              </button>

              <button
                onClick={() => handleRoleSelect('alternative')}
                disabled={loading}
                className="w-full p-4 border-2 border-gray-300 hover:border-purple-500 hover:bg-purple-50 rounded-lg text-left transition disabled:opacity-50"
              >
                <p className="font-bold text-gray-700">👤 Alternative Shopkeeper</p>
                <p className="text-sm text-gray-600">Billing access only</p>
              </button>
            </div>

            <button
              onClick={() => { setStep('shopId'); setError(''); }}
              className="w-full text-gray-600 hover:text-gray-800 py-2 mt-4"
            >
              ← Back
            </button>
          </>
        )}

        {/* Step 3: Enter PIN */}
        {step === 'pin' && shopkeeperInfo && (
          <>
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">{role === 'main' ? '👑' : '👤'}</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-800">Hi, {shopkeeperInfo.name}!</h2>
              <p className="text-gray-600">Enter your 4-digit PIN</p>
            </div>

            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6 text-center">
                {error}
              </div>
            )}

            <PinInput onComplete={handlePinComplete} disabled={loading} />

            {loading && (
              <p className="text-center text-indigo-600 font-medium mt-4">Verifying...</p>
            )}

            <button
              onClick={() => { setStep('role'); setError(''); }}
              className="w-full text-gray-600 hover:text-gray-800 py-2 mt-4"
            >
              ← Back
            </button>
          </>
        )}

        <p className="text-center text-gray-600 mt-6">
          New here? <Link to="/register-shop" className="text-indigo-600 hover:text-indigo-700 font-semibold">Register a shop</Link>
        </p>
      </div>
    </div>
  )
}

export default Login