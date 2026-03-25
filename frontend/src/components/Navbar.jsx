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
    <nav className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link to="/dashboard" className="flex items-center gap-2 font-bold text-xl hover:opacity-80">
            <img src="/logo.svg" alt="Logo" className="w-8 h-8" />
            <span className="bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">{t('smartBilling')}</span>
          </Link>
          {auth && (
            <div className="hidden sm:flex gap-6">
              <Link to="/dashboard" className="text-gray-600 hover:text-emerald-600 transition font-medium">{t('dashboard')}</Link>
              <Link to="/products" className="text-gray-600 hover:text-emerald-600 transition font-medium">{t('products')}</Link>
              <Link to="/billing" className="text-gray-600 hover:text-emerald-600 transition font-medium">{t('billing')}</Link>
              <Link to="/bills" className="text-gray-600 hover:text-emerald-600 transition font-medium">{t('viewBills')}</Link>
              <Link to="/reports" className="text-gray-600 hover:text-emerald-600 transition font-medium">{t('reports')}</Link>
            </div>
          )}
        </div>
        {auth && (
          <div className="flex items-center gap-4">
            <LanguageToggle />
            <div className="text-sm hidden sm:block">
              <p className="font-semibold text-gray-800">{auth.name}</p>
              <p className="text-emerald-600 text-xs uppercase">{auth.role}</p>
            </div>
            <button
              onClick={logout}
              className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition"
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
