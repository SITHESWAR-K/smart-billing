import { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { ArrowLeft, User, Crown } from 'lucide-react'
import api from '../api/api'
import { useLanguage } from '../context/LanguageContext'
import PinInput from '../components/PinInput'
import LanguageToggle from '../components/LanguageToggle'

const RegisterShopkeeper = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { t } = useLanguage()

  // Check if main shopkeeper is adding an alternative (coming from dashboard)
  const isFromDashboard = location.state?.fromDashboard === true

  const [formData, setFormData] = useState({
    shopId: location.state?.shopId || '',
    shopName: location.state?.shopName || '',
    name: '',
    role: isFromDashboard ? 'alternative' : 'alternative' // Force alternative when from dashboard
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

      // If main shopkeeper added alternative, go back to dashboard with success message
      if (isFromDashboard) {
        navigate('/dashboard', { state: { successMessage: `Alternative shopkeeper "${formData.name}" added successfully!` } })
      } else {
        navigate('/login', { state: { shopId: formData.shopId } })
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to register shopkeeper')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-teal-50 flex items-center justify-center px-4 py-8">
      {/* Language Toggle */}
      <div className="absolute top-4 right-4 z-50">
        <LanguageToggle />
      </div>

      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full border border-gray-100">
        <Link to="/dashboard" className="flex items-center gap-2 text-emerald-600 hover:text-emerald-700 mb-6">
          <ArrowLeft size={20} />
          {t('back')}
        </Link>

        <h1 className="text-3xl font-bold text-gray-800 mb-2">{t('addAlternativeShopkeeper')}</h1>
        <p className="text-gray-600 mb-6">{t('addAltShopkeeperDesc')}</p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {!showPinInput ? (
          <form onSubmit={(e) => { e.preventDefault(); setShowPinInput(true); }} className="space-y-4">
            {/* Show shop info as read-only when main shopkeeper is adding alternative */}
            {isFromDashboard ? (
              <div className="bg-gray-50 p-4 rounded-xl border-2 border-gray-200 mb-4">
                <p className="text-sm text-gray-600 mb-1">{t('shopId')}</p>
                <p className="font-mono text-lg font-bold text-gray-800 tracking-widest">{formData.shopId}</p>
                <p className="text-sm text-gray-600 mt-3 mb-1">{t('shopName')}</p>
                <p className="font-bold text-gray-800">{formData.shopName}</p>
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">{t('shopId')}</label>
                  <input
                    type="text"
                    name="shopId"
                    value={formData.shopId}
                    onChange={(e) => handleChange({ target: { name: 'shopId', value: e.target.value.toUpperCase() } })}
                    required
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:outline-none transition text-lg font-mono tracking-widest text-center bg-gray-50"
                    placeholder="ABC123"
                    maxLength={6}
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-2">{t('shopName')}</label>
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
              </>
            )}

            <div>
              <label className="block text-gray-700 font-semibold mb-2">{t('yourName')}</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:outline-none transition text-lg bg-gray-50"
                placeholder={t('yourNamePlaceholder')}
              />
            </div>

            {/* Only show role selection when not coming from dashboard (i.e., standalone registration) */}
            {!isFromDashboard && (
              <div>
                <label className="block text-gray-700 font-semibold mb-2">{t('roleLabel')}</label>
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, role: 'main' }))}
                    className={`w-full p-4 border-2 rounded-xl text-left transition ${
                      formData.role === 'main'
                        ? 'border-emerald-300 bg-emerald-50'
                        : 'border-gray-200 hover:border-emerald-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Crown className={formData.role === 'main' ? 'text-emerald-600' : 'text-gray-400'} size={24} />
                      <div>
                        <p className={`font-bold ${formData.role === 'main' ? 'text-emerald-700' : 'text-gray-700'}`}>
                          {t('mainShopkeeper')}
                        </p>
                        <p className="text-sm text-gray-600">{t('fullAccess')}</p>
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, role: 'alternative' }))}
                    className={`w-full p-4 border-2 rounded-xl text-left transition ${
                      formData.role === 'alternative'
                        ? 'border-blue-300 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <User className={formData.role === 'alternative' ? 'text-blue-600' : 'text-gray-400'} size={24} />
                      <div>
                        <p className={`font-bold ${formData.role === 'alternative' ? 'text-blue-700' : 'text-gray-700'}`}>
                          {t('alternativeShopkeeper')}
                        </p>
                        <p className="text-sm text-gray-600">{t('billingAccessOnly')}</p>
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-emerald-500 to-blue-500 text-white font-bold py-4 rounded-xl hover:shadow-lg transition disabled:opacity-50 text-lg mt-4"
            >
              {t('nextSetPin')} →
            </button>
          </form>
        ) : (
          <div>
            <label className="block text-gray-700 font-semibold mb-4">{t('enterPin')}</label>
            <PinInput onComplete={handlePinComplete} error={error} disabled={loading} />
            {loading && (
              <p className="text-center text-emerald-600 font-medium mt-4">Registering...</p>
            )}
            <button
              onClick={() => setShowPinInput(false)}
              className="w-full text-gray-600 hover:text-gray-800 py-2 mt-4"
            >
              ← {t('back')}
            </button>
          </div>
        )}

        <p className="text-center text-gray-600 mt-6">
          {t('alreadyHaveShop')} <Link to="/login" className="text-emerald-600 hover:text-emerald-700 font-semibold">{t('signIn')}</Link>
        </p>
      </div>
    </div>
  )
}

export default RegisterShopkeeper
