import { Link } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import LanguageToggle from './LanguageToggle'

const Navbar = () => {
  const { auth, logout } = useAuth()
  const { t } = useLanguage()

  if (!auth) return null

  return (
    <nav className="bg-white/90 backdrop-blur border-b border-gray-200/70 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <Link to="/dashboard" className="flex items-center gap-2 font-bold text-xl hover:opacity-80">
              <img src="/logo.svg" alt="Logo" className="w-9 h-9" />
              <span className="bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
                {t('smartBilling')}
              </span>
            </Link>
          </div>
          {auth && (
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <Link to="/dashboard" className="text-gray-600 hover:text-emerald-600 transition font-medium">{t('dashboard')}</Link>
              <Link to="/products" className="text-gray-600 hover:text-emerald-600 transition font-medium">{t('products')}</Link>
              <Link to="/price-update" className="text-gray-600 hover:text-emerald-600 transition font-medium">{t('priceUpdate')}</Link>
              <Link to="/billing" className="text-gray-600 hover:text-emerald-600 transition font-medium">{t('billing')}</Link>
              <Link to="/bills" className="text-gray-600 hover:text-emerald-600 transition font-medium">{t('viewBills')}</Link>
              <Link to="/reports" className="text-gray-600 hover:text-emerald-600 transition font-medium">{t('reports')}</Link>
            </div>
          )}
        </div>

        {auth && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <LanguageToggle />
              <div className="text-sm">
                <p className="font-semibold text-gray-800">{auth.name}</p>
                <p className="text-emerald-600 text-xs uppercase tracking-wide">{auth.role}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-full transition"
            >
              <LogOut size={18} />
              <span className="hidden sm:inline">{t('logout')}</span>
            </button>
          </div>
        )}
      </div>
    </nav>
  )
}

export default Navbar
