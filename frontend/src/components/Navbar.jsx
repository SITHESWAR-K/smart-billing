import { Link } from 'react-router-dom'
import { LogOut, Home as HomeIcon } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const Navbar = () => {
  const { auth, logout } = useAuth()
  
  if (!auth) return null
  
  return (
    <nav className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link to="/dashboard" className="flex items-center gap-2 font-bold text-xl hover:opacity-80">
            <HomeIcon size={28} />
            Smart Billing
          </Link>
          {auth && (
            <div className="hidden sm:flex gap-6">
              <Link to="/dashboard" className="hover:opacity-80 transition">Dashboard</Link>
              <Link to="/products" className="hover:opacity-80 transition">Products</Link>
              <Link to="/billing" className="hover:opacity-80 transition">Billing</Link>
              <Link to="/bills" className="hover:opacity-80 transition">View Bills</Link>
            </div>
          )}
        </div>
        {auth && (
          <div className="flex items-center gap-4">
            <div className="text-sm">
              <p className="font-semibold">{auth.name}</p>
              <p className="text-indigo-100">{auth.role}</p>
            </div>
            <button
              onClick={logout}
              className="flex items-center gap-2 bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg transition"
            >
              <LogOut size={18} />
              Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  )
}

export default Navbar