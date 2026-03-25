import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Calendar, User, DollarSign, Package, Check, Printer, Share2, RefreshCw } from 'lucide-react'
import Navbar from '../components/Navbar'
import api from '../api/api'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'

const Bills = () => {
  const { auth } = useAuth()
  const { t } = useLanguage()
  const location = useLocation()
  const navigate = useNavigate()
  const [bills, setBills] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [expandedBill, setExpandedBill] = useState(null)
  const [lowStockMessage, setLowStockMessage] = useState('')

  useEffect(() => {
    // Check if we came from billing page with a new bill
    if (location.state?.newBillId) {
      setSuccessMessage('Bill created successfully!')
      setExpandedBill(location.state.newBillId)
      if (Array.isArray(location.state?.lowStockAlerts) && location.state.lowStockAlerts.length > 0) {
        const msg = location.state.lowStockAlerts
          .map(item => `${item.productName} (${item.remainingQuantity})`)
          .join(', ')
        setLowStockMessage(`Low stock: ${msg}`)
      }
      // Clear the state so message doesn't show on refresh
      navigate(location.pathname, { replace: true })
    }
  }, [])

  useEffect(() => {
    // Only fetch bills when auth is available
    if (auth?.shopId) {
      fetchBills()
    }
  }, [auth?.shopId])

  useEffect(() => {
    // Clear success message after 5 seconds
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(''), 5000)
      return () => clearTimeout(timer)
    }
  }, [successMessage])

  const fetchBills = async () => {
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
      setError('Failed to fetch bills: ' + (err.response?.data?.error || err.message))
    } finally {
      setLoading(false)
    }
  }

  const handlePrint = (bill) => {
    const printWindow = window.open('', '_blank')
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
          <div class="shop-name">${auth.shopName}</div>
          <div>GrociBill</div>
        </div>
        <div class="bill-info">
          <div><strong>Bill #:</strong> ${bill.id}</div>
          <div><strong>Date:</strong> ${new Date(bill.created_at).toLocaleString()}</div>
          <div><strong>Cashier:</strong> ${bill.created_by}</div>
        </div>
        <div class="items">
          ${bill.items?.map(item => `
            <div class="item">
              <span>${item.productName} x${item.quantity}</span>
              <span>Rs.${(item.price * item.quantity).toFixed(2)}</span>
            </div>
          `).join('')}
        </div>
        <div class="total">Total: Rs.${bill.total?.toFixed(2)}</div>
        <div class="footer">
          <p>Thank you for your purchase!</p>
          <p>Powered by GrociBill</p>
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
*Bill from ${auth.shopName}*
Bill #: ${bill.id}
Date: ${new Date(bill.created_at).toLocaleString()}

*Items:*
${bill.items?.map(item => `- ${item.productName} x${item.quantity} = Rs.${(item.price * item.quantity).toFixed(2)}`).join('\n')}

*Total: Rs.${bill.total?.toFixed(2)}*

Thank you for your purchase!
    `.trim()

    // Try WhatsApp share
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(billText)}`
    window.open(whatsappUrl, '_blank')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold text-gray-800">{t('allBills')}</h1>
          <button
            onClick={fetchBills}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition disabled:opacity-50"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            {t('refresh') || 'Refresh'}
          </button>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-6 py-4 rounded-lg mb-6 flex items-center gap-3 animate-pulse">
            <Check className="text-green-600" size={24} />
            <span className="font-semibold">{successMessage}</span>
          </div>
        )}

        {lowStockMessage && (
          <div className="bg-amber-50 border border-amber-400 text-amber-800 px-6 py-4 rounded-lg mb-6">
            <span className="font-semibold">{lowStockMessage}</span>
          </div>
        )}

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-emerald-500 border-t-transparent"></div>
            <p className="text-gray-600 mt-4">{t('loadingBills')}</p>
          </div>
        ) : bills.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <Package className="mx-auto text-gray-400 mb-4" size={48} />
            <p className="text-gray-600 text-lg">{t('noBillsCreated')}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {bills.map(bill => (
              <div
                key={bill.id}
                className={`bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition ${
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
                      {new Date(bill.created_at).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(bill.created_at).toLocaleTimeString()}
                    </p>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-gray-600 text-sm mb-1">
                      <User size={16} />
                      {t('shopkeeper')}
                    </div>
                    <p className="font-bold text-gray-800">{bill.created_by}</p>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-gray-600 text-sm mb-1">
                      <DollarSign size={16} />
                      {t('total')}
                    </div>
                    <p className="font-bold text-emerald-600 text-xl">Rs.{bill.total?.toFixed(2)}</p>
                  </div>
                  <div className="flex items-center gap-2 justify-end">
                    <button
                      onClick={() => handlePrint(bill)}
                      className="p-2 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-lg transition"
                      title="Print"
                    >
                      <Printer size={20} />
                    </button>
                    <button
                      onClick={() => handleShare(bill)}
                      className="p-2 bg-green-100 hover:bg-green-200 text-green-600 rounded-lg transition"
                      title="Share via WhatsApp"
                    >
                      <Share2 size={20} />
                    </button>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="flex items-center gap-2 text-gray-700 font-semibold mb-3">
                    <Package size={18} />
                    {t('items')} ({bill.items?.length || 0})
                  </div>
                  <div className="grid sm:grid-cols-2 gap-2">
                    {bill.items?.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-gray-600 text-sm bg-gray-50 p-2 rounded">
                        <span>{item.productName} x{item.quantity}</span>
                        <span className="font-semibold">Rs.{(item.price * item.quantity).toFixed(2)}</span>
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
