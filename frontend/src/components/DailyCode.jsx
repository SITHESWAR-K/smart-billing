import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import api from '../api/api'
import { RefreshCw } from 'lucide-react'

const DailyCode = () => {
  const { auth } = useAuth()
  const { t } = useLanguage()
  const [code, setCode] = useState('')
  const [timeRemaining, setTimeRemaining] = useState({ hours: 0, minutes: 0 })
  const [loading, setLoading] = useState(true)

  const fetchDailyCode = useCallback(async () => {
    if (!auth?.shopId) return

    try {
      setLoading(true)
      const response = await api.get(`/daily-codes/${auth.shopId}`)
      setCode(response.data.code)
    } catch (err) {
      console.error('Failed to fetch daily code:', err)
      // Fallback to local generation
      const date = new Date()
      const hash = (auth.shopId + date.toISOString().split('T')[0]).split('').reduce((a, b) => {
        a = ((a << 5) - a) + b.charCodeAt(0)
        return a & a
      }, 0)
      setCode(((Math.abs(hash) % 90) + 10).toString())
    } finally {
      setLoading(false)
    }
  }, [auth?.shopId])

  useEffect(() => {
    fetchDailyCode()
    updateTimeRemaining()

    const interval = setInterval(updateTimeRemaining, 60000)
    return () => clearInterval(interval)
  }, [fetchDailyCode])

  const updateTimeRemaining = () => {
    const now = new Date()
    const midnight = new Date(now)
    midnight.setDate(midnight.getDate() + 1)
    midnight.setHours(0, 0, 0, 0)

    const diff = midnight - now
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

    setTimeRemaining({ hours, minutes })
  }

  return (
    <div className="bg-gradient-to-r from-emerald-500 to-blue-500 text-white p-6 rounded-xl shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">{t('dailySecurityCodes')}</h3>
        <button
          onClick={fetchDailyCode}
          className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition"
          disabled={loading}
        >
          <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>
      <p className="text-5xl font-bold font-mono tracking-widest mb-4">
        {loading ? '...' : code}
      </p>
      <p className="text-emerald-100">
        Changes in {timeRemaining.hours}h {timeRemaining.minutes}m
      </p>
    </div>
  )
}

export default DailyCode
