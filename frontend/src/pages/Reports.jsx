import { useEffect, useMemo, useState, useCallback } from 'react'
import { BarChart3, CalendarDays, Receipt, IndianRupee, Package } from 'lucide-react'
import Navbar from '../components/Navbar'
import api from '../api/api'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { getLocalizedProductName, toTamilText } from '../utils/tamilTransliteration'

const PERIOD_OPTIONS = [
  { labelKey: 'daily', value: 'daily' },
  { labelKey: 'monthly', value: 'monthly' },
  { labelKey: 'yearly', value: 'yearly' }
]

const Reports = () => {
  const { auth } = useAuth()
  const { t, language } = useLanguage()
  const [period, setPeriod] = useState('daily')
  const [report, setReport] = useState(null)
  const [productReport, setProductReport] = useState(null)
  const [productReportLoading, setProductReportLoading] = useState(false)
  const [productReportError, setProductReportError] = useState('')
  const [products, setProducts] = useState([])
  const [selectedProductId, setSelectedProductId] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchReports = useCallback(async (selectedPeriod) => {
    if (!auth?.shopId) return

    try {
      setLoading(true)
      setError('')
      const response = await api.get(`/reports/${auth.shopId}?period=${selectedPeriod}`)
      setReport(response.data)
    } catch (err) {
      setError(err.response?.data?.error || t('reportsLoadFailed'))
    } finally {
      setLoading(false)
    }
  }, [auth?.shopId, t])

  const fetchProducts = useCallback(async () => {
    if (!auth?.shopId) return
    try {
      const response = await api.get(`/products/${auth.shopId}`)
      setProducts(response.data.products || [])
    } catch (err) {
      setProducts([])
    }
  }, [auth?.shopId])

  const fetchProductReport = useCallback(async () => {
    if (!auth?.shopId || !selectedProductId) return
    try {
      setProductReportLoading(true)
      setProductReportError('')
      const response = await api.get(`/reports/${auth.shopId}/product?period=${period}&productId=${selectedProductId}`)
      setProductReport(response.data)
    } catch (err) {
      setProductReport(null)
      setProductReportError(err.response?.data?.error || t('reportsLoadFailed'))
    } finally {
      setProductReportLoading(false)
    }
  }, [auth?.shopId, period, selectedProductId, t])

  useEffect(() => {
    fetchReports(period)
  }, [fetchReports, period])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  useEffect(() => {
    if (selectedProductId) {
      fetchProductReport()
    } else {
      setProductReport(null)
      setProductReportError('')
    }
  }, [fetchProductReport, selectedProductId])

  const summaryCards = useMemo(() => {
    if (!report?.summary) return []

    return [
      {
        label: t('totalSales'),
        value: `${t('currency')}${report.summary.total_sales?.toFixed(2) || '0.00'}`,
        icon: IndianRupee,
        color: 'text-emerald-700 bg-emerald-100'
      },
      {
        label: t('billsLabel'),
        value: report.summary.total_bills || 0,
        icon: Receipt,
        color: 'text-blue-700 bg-blue-100'
      },
      {
        label: t('itemsSoldLabel'),
        value: report.summary.total_items_sold || 0,
        icon: Package,
        color: 'text-amber-700 bg-amber-100'
      },
      {
        label: t('avgBillLabel'),
        value: `${t('currency')}${report.summary.average_bill_value?.toFixed(2) || '0.00'}`,
        icon: BarChart3,
        color: 'text-purple-700 bg-purple-100'
      }
    ]
  }, [report, t])

  return (
    <div className="min-h-screen bg-gray-50 overflow-hidden">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-800">{t('reportsTitle')}</h1>
            <p className="text-gray-600 mt-1">{t('reportsSubtitle')}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2 bg-white rounded-full border border-gray-200 p-2">
            <CalendarDays size={18} className="text-gray-500" />
            {PERIOD_OPTIONS.map(option => (
              <button
                key={option.value}
                onClick={() => setPeriod(option.value)}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition ${
                  period === option.value
                    ? 'bg-emerald-500 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {t(option.labelKey)}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-emerald-500 border-t-transparent"></div>
            <p className="text-gray-600 mt-3">{t('loadingReports')}</p>
          </div>
        ) : (
          <>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {summaryCards.map(card => {
                const Icon = card.icon
                return (
                  <div key={card.label} className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm text-gray-600">{card.label}</p>
                      <span className={`p-2 rounded-lg ${card.color}`}>
                        <Icon size={18} />
                      </span>
                    </div>
                    <p className="text-2xl font-bold text-gray-800">{card.value}</p>
                  </div>
                )
              })}
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-800">{t('breakdownByPeriod', { period: t(period) })}</h2>
              </div>

              {report?.data?.length ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50 text-gray-600 text-sm">
                      <tr>
                        <th className="px-5 py-3 font-semibold">{t('periodLabel')}</th>
                        <th className="px-5 py-3 font-semibold">{t('salesLabel')}</th>
                        <th className="px-5 py-3 font-semibold">{t('billsLabel')}</th>
                        <th className="px-5 py-3 font-semibold">{t('itemsSoldLabel')}</th>
                        <th className="px-5 py-3 font-semibold">{t('avgBillLabel')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.data.map(row => (
                        <tr key={row.period} className="border-t border-gray-100">
                          <td className="px-5 py-3 font-semibold text-gray-800">{row.period}</td>
                          <td className="px-5 py-3 text-emerald-700 font-semibold">{t('currency')}{row.total_sales.toFixed(2)}</td>
                          <td className="px-5 py-3">{row.bills_count}</td>
                          <td className="px-5 py-3">{row.items_sold}</td>
                          <td className="px-5 py-3">{t('currency')}{row.average_bill_value.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="px-5 py-8 text-gray-500">{t('noReportData')}</p>
              )}
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mt-8">
              <div className="px-5 py-4 border-b border-gray-200 flex flex-wrap items-center gap-4 justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-800">{t('productReportTitle')}</h2>
                  <p className="text-sm text-gray-500">{t('productReportSubtitle')}</p>
                </div>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="">{t('selectProduct')}</option>
                  {products.map(product => (
                    <option key={product.id} value={product.id}>
                      {getLocalizedProductName(product.name, product.brand, language) || (language === 'ta'
                        ? toTamilText(product.brand ? `${product.brand} ${product.name}` : product.name)
                        : (product.brand ? `${product.brand} ${product.name}` : product.name))}
                    </option>
                  ))}
                </select>
              </div>

              {productReportError && (
                <div className="px-5 py-4 text-red-600 text-sm">{productReportError}</div>
              )}

              {productReportLoading && (
                <div className="px-5 py-6 text-gray-500 text-sm">{t('loadingProductReport')}</div>
              )}

              {!productReportLoading && selectedProductId && productReport && (
                <div className="px-5 py-6 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-emerald-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600">{t('totalSales')}</p>
                    <p className="text-xl font-bold text-emerald-700">{t('currency')}{productReport.summary.total_sales.toFixed(2)}</p>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600">{t('itemsSoldLabel')}</p>
                    <p className="text-xl font-bold text-blue-700">{productReport.summary.total_quantity}</p>
                  </div>
                  <div className="bg-amber-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600">{t('billsLabel')}</p>
                    <p className="text-xl font-bold text-amber-700">{productReport.summary.bills_count}</p>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600">{t('avgPriceLabel')}</p>
                    <p className="text-xl font-bold text-purple-700">{t('currency')}{productReport.summary.average_price.toFixed(2)}</p>
                  </div>
                </div>
              )}

              {!selectedProductId && (
                <p className="px-5 py-6 text-gray-500">{t('selectProductHint')}</p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default Reports
