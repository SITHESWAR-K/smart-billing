import { useState, useEffect, useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Calendar, User, DollarSign, Package, Check, Printer, Share2, RefreshCw } from 'lucide-react'
import Navbar from '../components/Navbar'
import api from '../api/api'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { getLocalizedProductName, toTamilText } from '../utils/tamilTransliteration'

const Bills = () => {
  const { auth } = useAuth()
  const { t, language } = useLanguage()
  const location = useLocation()
  const navigate = useNavigate()
  const [bills, setBills] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [expandedBill, setExpandedBill] = useState(null)
  const [lowStockMessage, setLowStockMessage] = useState('')
  const [expiryMessage, setExpiryMessage] = useState('')

  const localizeText = (value) => (language === 'ta' ? toTamilText(value || '') : value || '')
  const getBillItemDisplayName = (item = {}) => {
    const baseName = item.displayName || [item.productBrand, item.productName].filter(Boolean).join(' ') || item.productName || ''
    if (!baseName) return t('item')
    if (language !== 'ta') return baseName
    return getLocalizedProductName(item.productName, item.productBrand, language) || localizeText(baseName)
  }

  const fetchBills = useCallback(async () => {
    if (!auth?.shopId) {
      console.error('No shopId available for fetching bills')
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError('')
      console.log('Fetching bills for shop:', auth.shopId)
      const response = await api.get(`/bills/${auth.shopId}`)
      console.log('Bills response:', response.data)

      // Handle both response formats: array directly or {bills: [...]} 
      const billsData = Array.isArray(response.data)
        ? response.data
        : (response.data.bills || [])

      console.log('Bills data to display:', billsData)
      setBills(billsData)
    } catch (err) {
      console.error('Error fetching bills:', err)
      setError(t('billsFetchFailed', { message: err.response?.data?.error || err.message }))
    } finally {
      setLoading(false)
    }
  }, [auth?.shopId, t])

  useEffect(() => {
    // Check if we came from billing page with a new bill
    if (location.state?.newBillId) {
      setSuccessMessage(t('billCreatedSuccess'))
      setExpandedBill(location.state.newBillId)
      if (Array.isArray(location.state?.lowStockAlerts) && location.state.lowStockAlerts.length > 0) {
        const msg = location.state.lowStockAlerts
          .map(item => t('lowStockAlertItem', {
            name: getLocalizedProductName(item.productName, item.productBrand, language) || item.productName,
            qty: item.remainingQuantity
          }))
          .join(', ')
        setLowStockMessage(`${t('lowStockAlertTitle')}: ${msg}`)
      }
      if (Array.isArray(location.state?.expiryAlerts) && location.state.expiryAlerts.length > 0) {
        const expired = location.state.expiryAlerts.filter(item => item.status === 'expired')
        const near = location.state.expiryAlerts.filter(item => item.status === 'near')
        const expiredNames = expired
          .map(item => getLocalizedProductName(item.productName, item.productBrand, language) || item.productName)
          .join(', ')
        const nearNames = near
          .map(item => t('expiringItem', {
            name: getLocalizedProductName(item.productName, item.productBrand, language) || item.productName,
            days: item.daysLeft
          }))
          .join(', ')

        const parts = []
        if (expiredNames) {
          parts.push(`${t('expiredLabel')}: ${expiredNames}`)
        }
        if (nearNames) {
          parts.push(`${t('expiringSoonLabel')}: ${nearNames}`)
        }
        setExpiryMessage(parts.join(' | '))
      }
      // Clear the state so message doesn't show on refresh
      navigate(location.pathname, { replace: true })
    }
  }, [language, location.pathname, location.state?.expiryAlerts, location.state?.lowStockAlerts, location.state?.newBillId, navigate, t])

  useEffect(() => {
    if (auth?.shopId) {
      fetchBills()
    }
  }, [auth?.shopId, fetchBills])

  useEffect(() => {
    // Clear success message after 5 seconds
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(''), 5000)
      return () => clearTimeout(timer)
    }
  }, [successMessage])

  const handlePrint = (bill) => {
    const printWindow = window.open('', '_blank')
    const locale = language === 'ta' ? 'ta-IN' : 'en-IN'
    const shopName = localizeText(auth.shopName)
    const cashierName = localizeText(bill.created_by)
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Bill #${bill.id}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; max-width: 400px; margin: 0 auto; }
          .header { text-align: center; margin-bottom: 20px; border-bottom: 2px dashed #000; padding-bottom: 10px; }
          .shop-name { font-size: 24px; font-weight: bold; }
          .bill-info { margin: 15px 0; }
          .items { border-top: 1px solid #000; border-bottom: 1px solid #000; padding: 10px 0; margin: 10px 0; }
          .item { display: flex; justify-content: space-between; margin: 5px 0; }
          .total { font-size: 20px; font-weight: bold; text-align: right; margin-top: 10px; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="shop-name">${shopName}</div>
          <div>${localizeText(t('smartBilling'))}</div>
        </div>
        <div class="bill-info">
          <div><strong>${t('billNumber')}:</strong> ${bill.id}</div>
          <div><strong>${t('date')}:</strong> ${new Date(bill.created_at).toLocaleString(locale)}</div>
          <div><strong>${t('shopkeeper')}:</strong> ${cashierName}</div>
        </div>
        <div class="items">
          ${bill.items?.map(item => `
            <div class="item">
              <span>${getBillItemDisplayName(item)} x${item.quantity}</span>
              <span>${t('currency')}${(item.price * item.quantity).toFixed(2)}</span>
            </div>
          `).join('')}
        </div>
        <div class="total">${t('total')}: ${t('currency')}${bill.total?.toFixed(2)}</div>
        <div class="footer">
          <p>${t('thankYou')}</p>
          <p>${t('poweredBy')}</p>
        </div>
      </body>
      </html>
    `
    printWindow.document.write(printContent)
    printWindow.document.close()
    printWindow.print()
  }

  const handleShare = async (bill) => {
    const billText = `
*${t('billFrom')} ${localizeText(auth.shopName)}*
${t('billNumber')}: ${bill.id}
${t('date')}: ${new Date(bill.created_at).toLocaleString(language === 'ta' ? 'ta-IN' : 'en-IN')}

*${t('items')}:*
${bill.items?.map(item => `- ${getBillItemDisplayName(item)} x${item.quantity} = ${t('currency')}${(item.price * item.quantity).toFixed(2)}`).join('\n')}

*${t('total')}: ${t('currency')}${bill.total?.toFixed(2)}*

${t('thankYou')}
    `.trim()

    // Try WhatsApp share
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(billText)}`
    window.open(whatsappUrl, '_blank')
  }

  return (
    <div className="min-h-screen bg-gray-50 overflow-hidden">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-800">{t('allBills')}</h1>
            <p className="text-sm text-gray-500 mt-1">{t('viewBillsDesc')}</p>
          </div>
          <button
            onClick={fetchBills}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full transition disabled:opacity-50"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            {t('refresh') || 'Refresh'}
          </button>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="bg-green-100 border border-green-200 text-green-700 px-6 py-4 rounded-2xl mb-6 flex items-center gap-3 animate-pulse">
            <Check className="text-green-600" size={24} />
            <span className="font-semibold">{successMessage}</span>
          </div>
        )}

        {lowStockMessage && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 px-6 py-4 rounded-2xl mb-6">
            <span className="font-semibold">{lowStockMessage}</span>
          </div>
        )}

        {expiryMessage && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 px-6 py-4 rounded-2xl mb-6">
            <span className="font-semibold">{expiryMessage}</span>
          </div>
        )}

        {error && (
          <div className="bg-red-100 border border-red-200 text-red-700 px-4 py-3 rounded-2xl mb-6">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-emerald-500 border-t-transparent"></div>
            <p className="text-gray-600 mt-4">{t('loadingBills')}</p>
          </div>
        ) : bills.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl shadow">
            <Package className="mx-auto text-gray-400 mb-4" size={48} />
            <p className="text-gray-600 text-lg">{t('noBillsCreated')}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {bills.map(bill => (
              <div
                key={bill.id}
                className={`bg-white rounded-2xl shadow-md p-6 hover:shadow-lg transition ${
                  expandedBill === bill.id ? 'ring-2 ring-green-500 ring-offset-2' : ''
                }`}
              >
                <div className="grid md:grid-cols-5 gap-4 mb-4">
                  <div>
                    <div className="flex items-center gap-2 text-gray-600 text-sm mb-1">
                      <Calendar size={16} />
                      {t('billNumber')}
                    </div>
                    <p className="font-bold text-gray-800">#{bill.id}</p>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-gray-600 text-sm mb-1">
                      <Calendar size={16} />
                      {t('date')}
                    </div>
                    <p className="font-bold text-gray-800">
                      {new Date(bill.created_at).toLocaleDateString(language === 'ta' ? 'ta-IN' : 'en-IN')}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(bill.created_at).toLocaleTimeString(language === 'ta' ? 'ta-IN' : 'en-IN')}
                    </p>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-gray-600 text-sm mb-1">
                      <User size={16} />
                      {t('shopkeeper')}
                    </div>
                    <p className="font-bold text-gray-800">{localizeText(bill.created_by)}</p>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-gray-600 text-sm mb-1">
                      <DollarSign size={16} />
                      {t('total')}
                    </div>
                    <p className="font-bold text-emerald-600 text-xl">{t('currency')}{bill.total?.toFixed(2)}</p>
                  </div>
                  <div className="flex items-center gap-2 justify-start md:justify-end">
                    <button
                      onClick={() => handlePrint(bill)}
                      className="p-2 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-full transition"
                      title={t('print')}
                    >
                      <Printer size={20} />
                    </button>
                    <button
                      onClick={() => handleShare(bill)}
                      className="p-2 bg-green-100 hover:bg-green-200 text-green-600 rounded-full transition"
                      title={t('shareViaWhatsapp')}
                    >
                      <Share2 size={20} />
                    </button>
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-4">
                  <div className="flex items-center gap-2 text-gray-700 font-semibold mb-3">
                    <Package size={18} />
                    {t('items')} ({bill.items?.length || 0})
                  </div>
                  <div className="grid sm:grid-cols-2 gap-2">
                    {bill.items?.map((item, idx) => (
                      <div key={idx} className="flex items-start justify-between gap-3 text-gray-600 text-sm bg-gray-50 p-2 rounded-2xl">
                        <span className="min-w-0 break-words">
                          {getBillItemDisplayName(item)} x{item.quantity}
                        </span>
                        <span className="font-semibold whitespace-nowrap">
                          {t('currency')}{(item.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Bills
