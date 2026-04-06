import { useEffect, useMemo, useState, useCallback } from 'react'
import { BarChart3, CalendarDays, Receipt, IndianRupee, Package } from 'lucide-react'
import Navbar from '../components/Navbar'
import api from '../api/api'
import { useAuth } from '../context/AuthContext'

const PERIOD_OPTIONS = [
  { label: 'Daily', value: 'daily' },
  { label: 'Monthly', value: 'monthly' },
  { label: 'Yearly', value: 'yearly' }
]

const Reports = () => {
  const { auth } = useAuth()
  const [period, setPeriod] = useState('daily')
  const [report, setReport] = useState(null)
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
      setError(err.response?.data?.error || 'Failed to load reports')
    } finally {
      setLoading(false)
    }
  }, [auth?.shopId])

  useEffect(() => {
    fetchReports(period)
  }, [fetchReports, period])

  const summaryCards = useMemo(() => {
    if (!report?.summary) return []

    return [
      {
        label: 'Total Sales',
        value: `Rs.${report.summary.total_sales?.toFixed(2) || '0.00'}`,
        icon: IndianRupee,
        color: 'text-emerald-700 bg-emerald-100'
      },
      {
        label: 'Bills Count',
        value: report.summary.total_bills || 0,
        icon: Receipt,
        color: 'text-blue-700 bg-blue-100'
      },
      {
        label: 'Items Sold',
        value: report.summary.total_items_sold || 0,
        icon: Package,
        color: 'text-amber-700 bg-amber-100'
      },
      {
        label: 'Average Bill Value',
        value: `Rs.${report.summary.average_bill_value?.toFixed(2) || '0.00'}`,
        icon: BarChart3,
        color: 'text-purple-700 bg-purple-100'
      }
    ]
  }, [report])

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-800">Sales Reports</h1>
            <p className="text-gray-600 mt-1">Track shop performance by day, month, and year.</p>
          </div>

          <div className="flex items-center gap-2 bg-white rounded-xl border border-gray-200 p-2">
            <CalendarDays size={18} className="text-gray-500" />
            {PERIOD_OPTIONS.map(option => (
              <button
                key={option.value}
                onClick={() => setPeriod(option.value)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                  period === option.value
                    ? 'bg-emerald-500 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {option.label}
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
            <p className="text-gray-600 mt-3">Loading reports...</p>
          </div>
        ) : (
          <>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {summaryCards.map(card => {
                const Icon = card.icon
                return (
                  <div key={card.label} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
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

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-800">Breakdown by {period}</h2>
              </div>

              {report?.data?.length ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50 text-gray-600 text-sm">
                      <tr>
                        <th className="px-5 py-3 font-semibold">Period</th>
                        <th className="px-5 py-3 font-semibold">Sales</th>
                        <th className="px-5 py-3 font-semibold">Bills</th>
                        <th className="px-5 py-3 font-semibold">Items Sold</th>
                        <th className="px-5 py-3 font-semibold">Avg Bill</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.data.map(row => (
                        <tr key={row.period} className="border-t border-gray-100">
                          <td className="px-5 py-3 font-semibold text-gray-800">{row.period}</td>
                          <td className="px-5 py-3 text-emerald-700 font-semibold">Rs.{row.total_sales.toFixed(2)}</td>
                          <td className="px-5 py-3">{row.bills_count}</td>
                          <td className="px-5 py-3">{row.items_sold}</td>
                          <td className="px-5 py-3">Rs.{row.average_bill_value.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="px-5 py-8 text-gray-500">No bill data available for this period.</p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default Reports
