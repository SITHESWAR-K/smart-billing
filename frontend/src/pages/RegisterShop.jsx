import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Copy, Check } from 'lucide-react'
import api from '../api/api'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import PinInput from '../components/PinInput'
import LanguageToggle from '../components/LanguageToggle'

const RegisterShop = () => {
  const navigate = useNavigate()
  const { login } = useAuth()
  const { t } = useLanguage()
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
    <div className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-emerald-50 flex items-center justify-center px-4 py-8">
      {/* Language Toggle */}
      <div className="absolute top-4 right-4 z-50">
        <LanguageToggle />
      </div>

      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full border border-gray-100">
        {step !== 'success' && (
          <Link to="/" className="flex items-center gap-2 text-emerald-600 hover:text-emerald-700 mb-6">
            <ArrowLeft size={20} />
            {t('backToHome')}
          </Link>
        )}

        {step === 'details' && (
          <>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">{t('registerYourShop')}</h1>
            <p className="text-gray-600 mb-6">{t('createNewShop')}</p>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                {error}
              </div>
            )}

            <form onSubmit={handleDetailsSubmit} className="space-y-4">
              <div>
                <label className="block text-gray-700 font-semibold mb-2">{t('shopName')} *</label>
                <input
                  type="text"
                  name="shopName"
                  value={formData.shopName}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:outline-none transition text-lg bg-gray-50"
                  placeholder={t('shopNamePlaceholder')}
                />
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2">{t('yourName')} *</label>
                <input
                  type="text"
                  name="shopkeeperName"
                  value={formData.shopkeeperName}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:outline-none transition text-lg bg-gray-50"
                  placeholder={t('yourNamePlaceholder')}
                />
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2">{t('location')}</label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:outline-none transition text-lg bg-gray-50"
                  placeholder={t('locationPlaceholder')}
                />
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-emerald-500 to-blue-500 text-white font-bold py-4 rounded-xl hover:shadow-lg transition text-lg mt-6"
              >
                {t('nextSetPin')} →
              </button>
            </form>
          </>
        )}

        {step === 'pin' && (
          <>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">{t('setYourPin')}</h1>
            <p className="text-gray-600 mb-6">{t('createPinFor')} {formData.shopkeeperName}</p>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                {error}
              </div>
            )}

            <div className="mb-6">
              <PinInput onComplete={handlePinComplete} disabled={loading} />
            </div>

            {loading && (
              <p className="text-center text-emerald-600 font-medium">{t('creatingShop')}</p>
            )}

            <button
              onClick={() => setStep('details')}
              className="w-full text-gray-600 hover:text-gray-800 py-2 mt-4"
            >
              ← {t('backToDetails')}
            </button>
          </>
        )}

        {step === 'success' && (
          <div className="text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-emerald-100 to-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check className="text-emerald-600" size={40} />
            </div>

            <h1 className="text-3xl font-bold text-gray-800 mb-2">{t('shopCreated')}</h1>
            <p className="text-gray-600 mb-6">{t('shopReady')}</p>

            <div className="bg-gradient-to-r from-emerald-50 to-blue-50 p-6 rounded-xl mb-6 border border-emerald-100">
              <p className="text-sm text-gray-600 mb-2">{t('yourShopId')}</p>
              <div className="flex items-center justify-center gap-2">
                <code className="text-3xl font-mono font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent tracking-widest">{shopId}</code>
                <button
                  onClick={copyShopId}
                  className="p-2 hover:bg-white rounded-lg transition"
                >
                  {copied ? <Check size={20} className="text-emerald-600" /> : <Copy size={20} className="text-gray-500" />}
                </button>
              </div>
              {copied && <p className="text-emerald-600 text-sm mt-2">{t('copied')}</p>}
            </div>

            <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl mb-6 text-left">
              <p className="text-blue-800 font-semibold">{t('important')}</p>
              <p className="text-blue-700 text-sm mt-1">
                {t('saveShopId')}
              </p>
            </div>

            <button
              onClick={goToDashboard}
              className="w-full bg-gradient-to-r from-emerald-500 to-blue-500 text-white font-bold py-4 rounded-xl hover:shadow-lg transition text-lg"
            >
              {t('goToDashboard')} →
            </button>
          </div>
        )}

        {step !== 'success' && (
          <p className="text-center text-gray-600 mt-6">
            {t('alreadyHaveShop')} <Link to="/login" className="text-emerald-600 hover:text-emerald-700 font-semibold">{t('signIn')}</Link>
          </p>
        )}
      </div>
    </div>
  )
}

export default RegisterShop
