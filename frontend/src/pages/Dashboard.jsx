import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Package, FileText, UserPlus, Check, BarChart3, IndianRupee } from 'lucide-react'
import Navbar from '../components/Navbar'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'

const Dashboard = () => {
  const { auth } = useAuth()
  const { t } = useLanguage()
  const location = useLocation()
  const navigate = useNavigate()
  const [successMessage, setSuccessMessage] = useState('')

  useEffect(() => {
    // Check if we came back with a success message
    if (location.state?.successMessage) {
      setSuccessMessage(location.state.successMessage)
      // Clear the state so message doesn't show on refresh
      navigate(location.pathname, { replace: true })
    }
  }, [location.pathname, location.state, navigate])

  useEffect(() => {
    // Clear success message after 5 seconds
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(''), 5000)
      return () => clearTimeout(timer)
    }
  }, [successMessage])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-emerald-50">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Success Message */}
        {successMessage && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-6 py-4 rounded-lg mb-6 flex items-center gap-3 animate-pulse">
            <Check className="text-green-600" size={24} />
            <span className="font-semibold">{successMessage}</span>
          </div>
        )}

        <div className="mb-10">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">{t('dashboard')}</h1>
          <p className="text-gray-600">{t('welcomeBackName')} {auth?.name}!</p>
        </div>

        <div className="grid md:grid-cols-1 gap-8 mb-10">
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">{t('accountInfo')}</h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">{t('shopIdLabel')}</p>
                <p className="font-bold text-gray-800 font-mono tracking-wider">{auth?.shopId}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">{t('shopNameLabel')}</p>
                <p className="font-bold text-gray-800">{auth?.shopName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">{t('roleLabel')}</p>
                <p className="font-bold text-emerald-600 uppercase text-sm">{auth?.role}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link to="/products" className="group">
            <div className="bg-white rounded-2xl shadow-lg p-7 hover:shadow-xl hover:scale-[1.02] transition-all cursor-pointer h-full border border-gray-100">
              <div className="flex items-center justify-center w-16 h-16 bg-blue-100 rounded-lg mb-4 group-hover:bg-blue-200 transition">
                <Package className="text-blue-600" size={32} />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">{t('manageProducts')}</h2>
              <p className="text-gray-600 mb-4">{t('manageProductsDesc')}</p>
              <div className="flex items-center text-blue-600 font-semibold group-hover:gap-2 transition-all">
                {t('goToProducts')} <span>→</span>
              </div>
            </div>
          </Link>

          <Link to="/billing" className="group">
            <div className="bg-white rounded-2xl shadow-lg p-7 hover:shadow-xl hover:scale-[1.02] transition-all cursor-pointer h-full border border-gray-100">
              <div className="flex items-center justify-center w-16 h-16 bg-emerald-100 rounded-lg mb-4 group-hover:bg-emerald-200 transition">
                <FileText className="text-emerald-600" size={32} />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">{t('createBill')}</h2>
              <p className="text-gray-600 mb-4">{t('createBillDesc')}</p>
              <div className="flex items-center text-emerald-600 font-semibold group-hover:gap-2 transition-all">
                {t('newBill')} <span>→</span>
              </div>
            </div>
          </Link>

          <Link to="/bills" className="group">
            <div className="bg-white rounded-2xl shadow-lg p-7 hover:shadow-xl hover:scale-[1.02] transition-all cursor-pointer h-full border border-gray-100">
              <div className="flex items-center justify-center w-16 h-16 bg-blue-100 rounded-lg mb-4 group-hover:bg-blue-200 transition">
                <FileText className="text-blue-600" size={32} />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">{t('viewAllBills')}</h2>
              <p className="text-gray-600 mb-4">{t('viewBillsDesc')}</p>
              <div className="flex items-center text-blue-600 font-semibold group-hover:gap-2 transition-all">
                {t('viewBills')} <span>→</span>
              </div>
            </div>
          </Link>

          <Link to="/price-update" className="group">
            <div className="bg-white rounded-2xl shadow-lg p-7 hover:shadow-xl hover:scale-[1.02] transition-all cursor-pointer h-full border border-gray-100">
              <div className="flex items-center justify-center w-16 h-16 bg-rose-100 rounded-lg mb-4 group-hover:bg-rose-200 transition">
                <IndianRupee className="text-rose-600" size={32} />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">{t('priceUpdate')}</h2>
              <p className="text-gray-600 mb-4">{t('priceUpdateDesc')}</p>
              <div className="flex items-center text-rose-600 font-semibold group-hover:gap-2 transition-all">
                {t('priceUpdateAction')} <span>→</span>
              </div>
            </div>
          </Link>

          <Link to="/reports" className="group">
            <div className="bg-white rounded-2xl shadow-lg p-7 hover:shadow-xl hover:scale-[1.02] transition-all cursor-pointer h-full border border-gray-100">
              <div className="flex items-center justify-center w-16 h-16 bg-amber-100 rounded-lg mb-4 group-hover:bg-amber-200 transition">
                <BarChart3 className="text-amber-600" size={32} />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">{t('reports')}</h2>
              <p className="text-gray-600 mb-4">{t('reportsDesc')}</p>
              <div className="flex items-center text-amber-600 font-semibold group-hover:gap-2 transition-all">
                {t('viewReports')} <span>→</span>
              </div>
            </div>
          </Link>

          {/* Add Alternative Shopkeeper - Only visible to main shopkeeper */}
          {auth?.role === 'main' && (
            <Link to="/register-shopkeeper" state={{ shopId: auth?.shopId, shopName: auth?.shopName, fromDashboard: true }} className="group">
              <div className="bg-white rounded-2xl shadow-lg p-7 hover:shadow-xl hover:scale-[1.02] transition-all cursor-pointer h-full border-2 border-dashed border-teal-300 hover:border-teal-500">
                <div className="flex items-center justify-center w-16 h-16 bg-teal-100 rounded-lg mb-4 group-hover:bg-teal-200 transition">
                  <UserPlus className="text-teal-600" size={32} />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">{t('addAlternativeShopkeeper')}</h2>
                <p className="text-gray-600 mb-4">{t('addAltShopkeeperDesc')}</p>
                <div className="flex items-center text-teal-600 font-semibold group-hover:gap-2 transition-all">
                  {t('addShopkeeper')} <span>→</span>
                </div>
              </div>
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}

export default Dashboard
