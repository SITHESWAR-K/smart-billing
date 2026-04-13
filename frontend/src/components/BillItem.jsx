import { Trash2 } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import { getLocalizedProductName } from '../utils/tamilTransliteration'

const BillItem = ({ item, onQuantityChange, onRemove }) => {
  const { t, language } = useLanguage()
  const rawName = item.displayName || [item.productBrand, item.productName].filter(Boolean).join(' ') || item.productName
  const displayName = language === 'ta'
    ? getLocalizedProductName(item.productName, item.productBrand, language) || rawName
    : rawName

  return (
    <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg border border-gray-200">
      <div className="flex-1">
        <p className="font-semibold">{displayName}</p>
        <p className="text-sm text-gray-600">{t('currency')}{item.price} {t('each')}</p>
      </div>
      <div className="flex items-center gap-3 mx-4">
        <button
          onClick={() => onQuantityChange(item.productId, item.quantity - 1)}
          className="px-2 py-1 bg-emerald-200 hover:bg-emerald-300 rounded font-bold"
        >
          -
        </button>
        <span className="font-semibold w-8 text-center">{item.quantity}</span>
        <button
          onClick={() => onQuantityChange(item.productId, item.quantity + 1)}
          className="px-2 py-1 bg-emerald-200 hover:bg-emerald-300 rounded font-bold"
        >
          +
        </button>
      </div>
      <div className="text-right">
        <p className="font-bold text-lg text-emerald-600">{t('currency')}{(item.price * item.quantity).toFixed(2)}</p>
      </div>
      <button
        onClick={() => onRemove(item.productId)}
        className="ml-4 p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
      >
        <Trash2 size={20} />
      </button>
    </div>
  )
}

export default BillItem
