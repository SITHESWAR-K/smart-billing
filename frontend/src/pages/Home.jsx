import { Link } from 'react-router-dom'
import { Store, LogIn, Mic, Shield, Clock } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import LanguageToggle from '../components/LanguageToggle'

const Home = () => {
  const { t } = useLanguage()

  const howItWorksSteps = [
    { icon: '1', title: t('step1Title'), desc: t('step1Desc'), emoji: '' },
    { icon: '2', title: t('step2Title'), desc: t('step2Desc'), emoji: '' },
    { icon: '3', title: t('step3Title'), desc: t('step3Desc'), emoji: '' },
    { icon: '4', title: t('step4Title'), desc: t('step4Desc'), emoji: '' },
    { icon: '5', title: t('step5Title'), desc: t('step5Desc'), emoji: '' }
  ]

  const features = [
    { icon: '🎤', title: t('feature1Title'), desc: t('feature1Desc') },
    { icon: '💰', title: t('feature2Title'), desc: t('feature2Desc') },
    { icon: '🔐', title: t('feature3Title'), desc: t('feature3Desc') },
    { icon: '⚡', title: t('feature4Title'), desc: t('feature4Desc') },
    { icon: '🧾', title: t('feature5Title'), desc: t('feature5Desc') },
    { icon: '➕', title: t('feature6Title'), desc: t('feature6Desc') },
    { icon: '📊', title: t('feature7Title'), desc: t('feature7Desc') },
    { icon: '⚠️', title: t('feature8Title'), desc: t('feature8Desc') }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-emerald-50">
      {/* Language Toggle */}
      <div className="absolute top-4 right-4 z-50">
        <LanguageToggle />
      </div>

      {/* Hero Section */}
      <div className="flex flex-col items-center justify-center px-4 py-12">
        <div className="max-w-5xl w-full">
          {/* Logo and Title */}
          <div className="text-center mb-10">
            <div className="flex justify-center mb-4">
              <img src="/logo.svg" alt="GrociBill Logo" className="w-28 h-28 md:w-36 md:h-36 drop-shadow-lg" />
            </div>
            <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent mb-3">{t('smartBilling')}</h1>
            <p className="text-lg md:text-xl text-gray-600 mb-6">{t('tagline')}</p>

            {/* Feature Pills */}
            <div className="flex flex-wrap justify-center gap-3 mb-8">
              <span className="bg-emerald-100 text-emerald-700 px-4 py-2 rounded-full text-sm flex items-center gap-2 font-medium">
                <Mic size={16} /> {t('voiceToText')}
              </span>
              <span className="bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm flex items-center gap-2 font-medium">
                <Shield size={16} /> {t('pinVoiceAuth')}
              </span>
              <span className="bg-teal-100 text-teal-700 px-4 py-2 rounded-full text-sm flex items-center gap-2 font-medium">
                <Clock size={16} /> {t('dailySecurityCodes')}
              </span>
            </div>
          </div>

          {/* Main CTA Cards */}
          <div className="grid md:grid-cols-2 gap-6 mb-12">
            <Link to="/register-shop" className="group">
              <div className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-2xl hover:scale-[1.02] transition-all cursor-pointer h-full border border-gray-100 hover:border-emerald-300">
                <div className="flex items-center justify-center w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl mb-6 group-hover:scale-110 transition shadow-lg">
                  <Store className="text-white" size={40} />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-3">{t('newShop')}</h2>
                <p className="text-gray-600 mb-6 text-lg">{t('newShopDesc')}</p>
                <div className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-center py-4 rounded-xl font-bold text-lg group-hover:shadow-lg transition">
                  {t('registerShop')} →
                </div>
              </div>
            </Link>

            <Link to="/login" className="group">
              <div className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-2xl hover:scale-[1.02] transition-all cursor-pointer h-full border border-gray-100 hover:border-blue-300">
                <div className="flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl mb-6 group-hover:scale-110 transition shadow-lg">
                  <LogIn className="text-white" size={40} />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-3">{t('alreadyRegistered')}</h2>
                <p className="text-gray-600 mb-6 text-lg">{t('alreadyRegisteredDesc')}</p>
                <div className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-center py-4 rounded-xl font-bold text-lg group-hover:shadow-lg transition">
                  {t('login')} →
                </div>
              </div>
            </Link>
          </div>

          {/* How It Works Section */}
          <div className="bg-gradient-to-r from-emerald-500 to-blue-500 rounded-3xl p-8 mb-12 shadow-xl">
            <h2 className="text-3xl font-bold text-white text-center mb-8">{t('howItWorks')}</h2>
            <div className="grid md:grid-cols-5 gap-4">
              {howItWorksSteps.map((step, index) => (
                <div key={index} className="text-center relative">
                  <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg">
                    <span className="text-2xl font-bold text-emerald-600">{step.icon}</span>
                  </div>
                  <h3 className="font-bold text-white mb-1">{step.title}</h3>
                  <p className="text-emerald-100 text-sm">{step.desc}</p>
                  {index < howItWorksSteps.length - 1 && (
                    <div className="hidden md:block absolute -right-2 top-7 text-white/50 text-xl">→</div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Key Features Section */}
          <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
            <h2 className="text-3xl font-bold text-gray-800 text-center mb-8">{t('keyFeatures')}</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature, index) => (
                <div key={index} className="bg-gradient-to-br from-gray-50 to-emerald-50 rounded-xl p-5 hover:shadow-lg transition border border-gray-100 hover:border-emerald-200">
                  <div className="text-3xl mb-3">{feature.icon}</div>
                  <h3 className="font-bold text-gray-800 mb-2">{feature.title}</h3>
                  <p className="text-gray-600 text-sm">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Home
