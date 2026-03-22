const fs = require('fs');
const path = require('path');

const basePath = path.join(__dirname, 'frontend', 'src', 'pages');

// Ensure pages directory exists
if (!fs.existsSync(basePath)) {
  fs.mkdirSync(basePath, { recursive: true });
}

const pageFiles = {
  'Home.jsx': `import { Link } from 'react-router-dom'
import { Store, LogIn, UserPlus } from 'lucide-react'

const Home = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center px-4">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-4">Smart Billing</h1>
          <p className="text-xl text-indigo-100">Secure Voice-Authenticated Billing System</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-8">
          <Link to="/register-shop" className="group">
            <div className="bg-white rounded-xl shadow-xl p-8 hover:shadow-2xl hover:scale-105 transition-all cursor-pointer h-full">
              <div className="flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-lg mb-4 group-hover:bg-indigo-200 transition">
                <Store className="text-indigo-600" size={32} />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Register Shop</h2>
              <p className="text-gray-600 mb-4">Create a new shop account and get your shop ID</p>
              <div className="flex items-center text-indigo-600 font-semibold group-hover:gap-2 transition-all">
                Get Started <span>→</span>
              </div>
            </div>
          </Link>

          <Link to="/login" className="group">
            <div className="bg-white rounded-xl shadow-xl p-8 hover:shadow-2xl hover:scale-105 transition-all cursor-pointer h-full">
              <div className="flex items-center justify-center w-16 h-16 bg-green-100 rounded-lg mb-4 group-hover:bg-green-200 transition">
                <LogIn className="text-green-600" size={32} />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Login</h2>
              <p className="text-gray-600 mb-4">Access your existing shop account with PIN verification</p>
              <div className="flex items-center text-green-600 font-semibold group-hover:gap-2 transition-all">
                Sign In <span>→</span>
              </div>
            </div>
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow-xl p-8">
          <h3 className="text-2xl font-bold text-gray-800 mb-4">New Shopkeeper?</h3>
          <p className="text-gray-600 mb-6">If you've already registered your shop but need to add additional staff, use the shopkeeper registration form.</p>
          <Link to="/register-shopkeeper" className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-3 rounded-lg font-semibold hover:shadow-lg transition">
            <UserPlus size={20} />
            Register as Shopkeeper
          </Link>
        </div>
      </div>
    </div>
  )
}

export default Home`,

  'RegisterShop.jsx': `import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import api from '../api/api'

const RegisterShop = () => {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    shopName: '',
    shopkeeperName: '',
    location: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await api.post('/shops/register', formData)
      const { shop_id } = response.data
      
      localStorage.setItem('tempShopData', JSON.stringify({
        shopId: shop_id,
        shopName: formData.shopName,
        timestamp: new Date()
      }))
      
      navigate('/register-shopkeeper', { state: { shopId: shop_id, shopName: formData.shopName } })
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to register shop')
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

        <h1 className="text-3xl font-bold text-gray-800 mb-2">Register Shop</h1>
        <p className="text-gray-600 mb-6">Create a new shop account</p>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-700 font-semibold mb-2">Shop Name</label>
            <input
              type="text"
              name="shopName"
              value={formData.shopName}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none transition"
              placeholder="Enter shop name"
            />
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-2">Shopkeeper Name</label>
            <input
              type="text"
              name="shopkeeperName"
              value={formData.shopkeeperName}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none transition"
              placeholder="Enter shopkeeper name"
            />
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-2">Location</label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none transition"
              placeholder="Enter shop location"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold py-3 rounded-lg hover:shadow-lg transition disabled:opacity-50"
          >
            {loading ? 'Registering...' : 'Register Shop'}
          </button>
        </form>

        <p className="text-center text-gray-600 mt-6">
          Already registered? <Link to="/login" className="text-indigo-600 hover:text-indigo-700 font-semibold">Sign in</Link>
        </p>
      </div>
    </div>
  )
}

export default RegisterShop`,

  'RegisterShopkeeper.jsx': `import { useState } from 'react'
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
        ...formData,
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

export default RegisterShopkeeper`,

  'Login.jsx': `import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import api from '../api/api'
import PinInput from '../components/PinInput'

const Login = () => {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [step, setStep] = useState('credentials') // credentials, pin
  const [formData, setFormData] = useState({
    shopId: '',
    role: 'main'
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [shopkeeperData, setShopkeeperData] = useState(null)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleCredentialsSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await api.post('/shopkeepers/get-by-shop', {
        shopId: formData.shopId,
        role: formData.role
      })
      
      setShopkeeperData(response.data)
      setStep('pin')
    } catch (err) {
      setError(err.response?.data?.message || 'Shop or shopkeeper not found')
    } finally {
      setLoading(false)
    }
  }

  const handlePinSubmit = async (enteredPin) => {
    setLoading(true)
    setError('')

    try {
      const response = await api.post('/shopkeepers/verify-pin', {
        shopkeeperId: shopkeeperData.id,
        pin: enteredPin
      })

      const { token, shop } = response.data
      
      login(formData.shopId, shop.name, shopkeeperData.name, formData.role, token)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid PIN')
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

        <h1 className="text-3xl font-bold text-gray-800 mb-2">Login</h1>
        <p className="text-gray-600 mb-6">Access your shop account</p>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {step === 'credentials' ? (
          <form onSubmit={handleCredentialsSubmit} className="space-y-4">
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
              {loading ? 'Loading...' : 'Next: Enter PIN'}
            </button>
          </form>
        ) : (
          <div>
            <p className="text-gray-700 mb-4 font-semibold">
              Welcome, {shopkeeperData?.name}
            </p>
            <label className="block text-gray-700 font-semibold mb-4">Enter Your PIN</label>
            <PinInput onComplete={handlePinSubmit} error={error} />
          </div>
        )}

        <p className="text-center text-gray-600 mt-6">
          New here? <Link to="/register-shop" className="text-indigo-600 hover:text-indigo-700 font-semibold">Register a shop</Link>
        </p>
      </div>
    </div>
  )
}

export default Login`
};

console.log('Creating page files (Part 1)...');
Object.entries(pageFiles).forEach(([fileName, content]) => {
  const fullPath = path.join(basePath, fileName);
  fs.writeFileSync(fullPath, content);
  console.log(`Created: src/pages/${fileName}`);
});

console.log('\n✅ Page files (Part 1) created!');
