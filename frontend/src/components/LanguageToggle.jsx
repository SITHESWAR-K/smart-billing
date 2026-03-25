import { Globe } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'

const LanguageToggle = () => {
  const { language, toggleLanguage, t } = useLanguage()

  return (
    <button
      onClick={toggleLanguage}
      className="flex items-center gap-2 bg-gradient-to-r from-emerald-50 to-blue-50 hover:from-emerald-100 hover:to-blue-100 text-gray-700 px-4 py-2 rounded-full border border-gray-200 shadow-sm transition font-medium text-sm"
    >
      <Globe size={18} className="text-emerald-600" />
      {language === 'en' ? t('tamil') : t('english')}
    </button>
  )
}

export default LanguageToggle
