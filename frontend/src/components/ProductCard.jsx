import { Edit2, Trash2 } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import { getLocalizedProductName, toTamilText } from '../utils/tamilTransliteration'
import { getExpiryStatus, formatExpiryDisplay, getExpiryAlertDays } from '../utils/expiry'

const ProductCard = ({ product, onEdit, onDelete }) => {
  const { t, language } = useLanguage()
  const displayName = getLocalizedProductName(product.name, product.brand, language)
  const brandLabel = product.brand ? (language === 'ta' ? toTamilText(product.brand) : product.brand) : ''
  const expiryInfo = getExpiryStatus(product, getExpiryAlertDays())
  const expiryText = product.expiry_date
    ? formatExpiryDisplay(product.expiry_date, language === 'ta' ? 'ta-IN' : 'en-IN')
    : ''

  return (
    <div className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition">
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-semibold text-lg">{displayName}</h3>
        {brandLabel && (
          <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">
            {brandLabel}
          </span>
        )}
      </div>

      {product.synonyms && product.synonyms.length > 0 && (
        <p className="text-gray-500 text-xs mb-2">
          Also known as: {Array.isArray(product.synonyms) ? product.synonyms.join(', ') : product.synonyms}
        </p>
      )}

      <div className="flex justify-between items-center mb-4">
        <span className="text-2xl font-bold text-emerald-600">{t('currency')}{product.price}</span>
        {product.quantity && (
          <div className="text-right">
            <span className="text-sm text-gray-600 block">
              {t('quantityLabel')}: {product.quantity}
            </span>
            {Number(product.quantity) <= 5 && (
              <span className="text-xs font-semibold text-amber-700">{t('lowStockInline', { qty: product.quantity })}</span>
            )}
          </div>
        )}
      </div>

      {expiryText && (
        <div className="text-xs text-gray-600 mb-3">
          <p>{t('expiryDateValue', { date: expiryText })}</p>
          {expiryInfo?.status === 'expired' && (
            <p className="text-rose-700 font-semibold">{t('expiredLabel')}</p>
          )}
          {expiryInfo?.status === 'near' && (
            <p className="text-rose-600 font-semibold">{t('expiringInDays', { days: expiryInfo.daysLeft })}</p>
          )}
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={() => onEdit(product)}
          className="flex-1 flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg transition"
        >
          <Edit2 size={16} />
          {t('edit')}
        </button>
        <button
          onClick={() => onDelete(product.id)}
          className="flex-1 flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition"
        >
          <Trash2 size={16} />
          {t('delete')}
        </button>
      </div>
    </div>
  )
}

export default ProductCard
