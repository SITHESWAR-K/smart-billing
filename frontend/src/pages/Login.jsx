import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Store, User, Crown } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import api from '../api/api'
import PinInput from '../components/PinInput'
import LanguageToggle from '../components/LanguageToggle'
import VoiceEnrollment from '../components/VoiceEnrollment'

const Login = () => {
  const navigate = useNavigate()
  const { login } = useAuth()
  const { t } = useLanguage()
  const [step, setStep] = useState('shopId') // shopId, role, selectName, pin, voiceEnroll
  const [shopId, setShopId] = useState('')
  const [shopInfo, setShopInfo] = useState(null)
  const [role, setRole] = useState('main')
  const [shopkeeperInfo, setShopkeeperInfo] = useState(null)
  const [alternativeShopkeepers, setAlternativeShopkeepers] = useState([]) // For multiple alternatives
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [dailyCode, setDailyCode] = useState('')
  const [pendingLoginData, setPendingLoginData] = useState(null) // Store login data during voice enrollment

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
      setError(t('shopNotFound'))
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

      // Check if multiple shopkeepers returned
      if (response.data.multiple) {
        setAlternativeShopkeepers(response.data.shopkeepers)
        setStep('selectName')
      } else {
        setShopkeeperInfo(response.data)
        setStep('pin')
      }
    } catch (err) {
      setError(`No ${selectedRole} shopkeeper found for this shop.`)
    } finally {
      setLoading(false)
    }
  }

  const handleShopkeeperSelect = (shopkeeper) => {
    setShopkeeperInfo(shopkeeper)
    setStep('pin')
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
      
      // Store login data for after voice enrollment
      const loginData = { 
        shopId, 
        shopName: shop.name, 
        shopkeeperName: shopkeeperInfo.name, 
        role, 
        token,
        shopkeeperId: shopkeeperInfo.id 
      }
      
      // Always require voice enrollment on every login for security
      try {
        const codeResponse = await api.get(`/daily-codes/${shopId}`)
        setDailyCode(codeResponse.data.code)
        setPendingLoginData(loginData)
        setStep('voiceEnroll')
      } catch (codeErr) {
        // If daily code fetch fails, still proceed with enrollment using a generated code
        setDailyCode(Math.random().toString(36).substring(2, 8).toUpperCase())
        setPendingLoginData(loginData)
        setStep('voiceEnroll')
      }
    } catch (err) {
      setError(t('wrongPin'))
    } finally {
      setLoading(false)
    }
  }

  const handleVoiceEnrollmentComplete = async (voiceSignature) => {
    try {
      // Save voice signature to backend
      await api.post('/shopkeepers/enroll-voice', {
        shopkeeperId: pendingLoginData.shopkeeperId,
        voiceSignature
      })
      
      // Complete login
      login(
        pendingLoginData.shopId, 
        pendingLoginData.shopName, 
        pendingLoginData.shopkeeperName, 
        pendingLoginData.role, 
        pendingLoginData.token,
        pendingLoginData.shopkeeperId
      )
      navigate('/dashboard')
    } catch (err) {
      console.error('Voice enrollment save failed:', err)
      // Still proceed with login even if save fails
      login(
        pendingLoginData.shopId, 
        pendingLoginData.shopName, 
        pendingLoginData.shopkeeperName, 
        pendingLoginData.role, 
        pendingLoginData.token,
        pendingLoginData.shopkeeperId
      )
      navigate('/dashboard')
    }
  }

  const handleVoiceEnrollmentSkip = () => {
    // Proceed without voice enrollment
    login(
      pendingLoginData.shopId, 
      pendingLoginData.shopName, 
      pendingLoginData.shopkeeperName, 
      pendingLoginData.role, 
      pendingLoginData.token,
      pendingLoginData.shopkeeperId
    )
    navigate('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-blue-50 flex items-center justify-center px-4 py-8">
      {/* Language Toggle */}
      <div className="absolute top-4 right-4 z-50">
        <LanguageToggle />
      </div>

      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full border border-gray-100">
        <Link to="/" className="flex items-center gap-2 text-emerald-600 hover:text-emerald-700 mb-6">
          <ArrowLeft size={20} />
          {t('backToHome')}
        </Link>

        {/* Step 1: Enter Shop ID */}
        {step === 'shopId' && (
          <>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">{t('welcomeBack')}</h1>
            <p className="text-gray-600 mb-6">{t('enterShopId')}</p>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                {error}
              </div>
            )}

            <form onSubmit={handleShopIdSubmit} className="space-y-4">
              <div>
                <label className="block text-gray-700 font-semibold mb-2">{t('shopId')}</label>
                <input
                  type="text"
                  value={shopId}
                  onChange={(e) => setShopId(e.target.value.toUpperCase())}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:outline-none transition text-lg font-mono tracking-widest text-center bg-gray-50"
                  placeholder="ABC123"
                  maxLength={6}
                  autoFocus
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-emerald-500 to-blue-500 text-white font-bold py-4 rounded-xl hover:shadow-lg transition text-lg disabled:opacity-50"
              >
                {loading ? t('checking') : `${t('continue')} →`}
              </button>
            </form>
          </>
        )}

        {/* Step 2: Select Role */}
        {step === 'role' && shopInfo && (
          <>
            <div className="flex items-center gap-3 mb-6 p-4 bg-emerald-50 rounded-xl border border-emerald-100">
              <Store className="text-emerald-600" size={32} />
              <div>
                <p className="font-bold text-gray-800">{shopInfo.shop_name}</p>
                <p className="text-sm text-gray-600">{shopInfo.location}</p>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-gray-800 mb-2">{t('selectRole')}</h2>
            <p className="text-gray-600 mb-6">{t('whoAreYou')}</p>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                {error}
              </div>
            )}

            <div className="space-y-3">
              <button
                onClick={() => handleRoleSelect('main')}
                disabled={loading}
                className="w-full p-4 border-2 border-emerald-200 bg-emerald-50 hover:bg-emerald-100 rounded-xl text-left transition disabled:opacity-50"
              >
                <div className="flex items-center gap-3">
                  <Crown className="text-emerald-600" size={24} />
                  <div>
                    <p className="font-bold text-emerald-700">{t('mainShopkeeper')}</p>
                    <p className="text-sm text-gray-600">{t('fullAccess')}</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => handleRoleSelect('alternative')}
                disabled={loading}
                className="w-full p-4 border-2 border-gray-200 hover:border-blue-300 hover:bg-blue-50 rounded-xl text-left transition disabled:opacity-50"
              >
                <div className="flex items-center gap-3">
                  <User className="text-gray-500" size={24} />
                  <div>
                    <p className="font-bold text-gray-700">{t('alternativeShopkeeper')}</p>
                    <p className="text-sm text-gray-600">{t('billingAccessOnly')}</p>
                  </div>
                </div>
              </button>
            </div>

            <button
              onClick={() => { setStep('shopId'); setError(''); }}
              className="w-full text-gray-600 hover:text-gray-800 py-2 mt-4"
            >
              ← {t('back')}
            </button>
          </>
        )}

        {/* Step 2.5: Select Name (when multiple alternative shopkeepers) */}
        {step === 'selectName' && alternativeShopkeepers.length > 0 && (
          <>
            <div className="flex items-center gap-3 mb-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
              <User className="text-blue-600" size={32} />
              <div>
                <p className="font-bold text-gray-800">{shopInfo?.shop_name}</p>
                <p className="text-sm text-gray-600">{t('alternativeShopkeeper')}</p>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-gray-800 mb-2">{t('selectYourName') || 'Select Your Name'}</h2>
            <p className="text-gray-600 mb-6">{t('multipleShopkeepersFound') || 'Multiple shopkeepers found. Please select your name.'}</p>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                {error}
              </div>
            )}

            <div className="space-y-3">
              {alternativeShopkeepers.map((shopkeeper) => (
                <button
                  key={shopkeeper.id}
                  onClick={() => handleShopkeeperSelect(shopkeeper)}
                  className="w-full p-4 border-2 border-gray-200 hover:border-blue-300 hover:bg-blue-50 rounded-xl text-left transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-bold text-lg">{shopkeeper.name.charAt(0).toUpperCase()}</span>
                    </div>
                    <p className="font-bold text-gray-700">{shopkeeper.name}</p>
                  </div>
                </button>
              ))}
            </div>

            <button
              onClick={() => { setStep('role'); setError(''); setAlternativeShopkeepers([]); }}
              className="w-full text-gray-600 hover:text-gray-800 py-2 mt-4"
            >
              ← {t('back')}
            </button>
          </>
        )}

        {/* Step 3: Enter PIN */}
        {step === 'pin' && shopkeeperInfo && (
          <>
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-100 to-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                {role === 'main' ? (
                  <Crown className="text-emerald-600" size={32} />
                ) : (
                  <User className="text-blue-600" size={32} />
                )}
              </div>
              <h2 className="text-2xl font-bold text-gray-800">Hi, {shopkeeperInfo.name}!</h2>
              <p className="text-gray-600">{t('enterPin')}</p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-center">
                {error}
              </div>
            )}

            <PinInput onComplete={handlePinComplete} disabled={loading} />

            {loading && (
              <p className="text-center text-emerald-600 font-medium mt-4">{t('verifying')}</p>
            )}

            <button
              onClick={() => {
                setError('')
                // Go back to selectName if there were multiple alternatives, otherwise go to role
                if (alternativeShopkeepers.length > 0) {
                  setStep('selectName')
                } else {
                  setStep('role')
                }
              }}
              className="w-full text-gray-600 hover:text-gray-800 py-2 mt-4"
            >
              ← {t('back')}
            </button>
          </>
        )}

        <p className="text-center text-gray-600 mt-6">
          {t('newHere')} <Link to="/register-shop" className="text-emerald-600 hover:text-emerald-700 font-semibold">{t('registerAShop')}</Link>
        </p>
      </div>

      {/* Voice Enrollment Modal */}
      {step === 'voiceEnroll' && (
        <VoiceEnrollment
          dailyCode={dailyCode}
          onEnrollmentComplete={handleVoiceEnrollmentComplete}
          onSkip={handleVoiceEnrollmentSkip}
        />
      )}
    </div>
  )
}

export default Login
