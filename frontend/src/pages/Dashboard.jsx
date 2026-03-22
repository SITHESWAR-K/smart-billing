import { Link } from 'react-router-dom'
import { Package, FileText, LogOut } from 'lucide-react'
import Navbar from '../components/Navbar'
import DailyCode from '../components/DailyCode'
import { useAuth } from '../context/AuthContext'

const Dashboard = () => {
  const { auth } = useAuth()

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Navbar />
      
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Dashboard</h1>
          <p className="text-gray-600">Welcome back, {auth?.name}!</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-8">
          <div className="md:col-span-2">
            <DailyCode />
          </div>
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Account Info</h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Shop ID</p>
                <p className="font-bold text-gray-800">{auth?.shopId}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Shop Name</p>
                <p className="font-bold text-gray-800">{auth?.shopName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Role</p>
                <p className="font-bold text-indigo-600 uppercase text-sm">{auth?.role}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {auth?.role === 'main' && (
            <Link to="/products" className="group">
              <div className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl hover:scale-105 transition-all cursor-pointer h-full">
                <div className="flex items-center justify-center w-16 h-16 bg-blue-100 rounded-lg mb-4 group-hover:bg-blue-200 transition">
                  <Package className="text-blue-600" size={32} />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Manage Products</h2>
                <p className="text-gray-600 mb-4">Add, edit, or remove products from your inventory</p>
                <div className="flex items-center text-blue-600 font-semibold group-hover:gap-2 transition-all">
                  Go to Products <span>→</span>
                </div>
              </div>
            </Link>
          )}

          <Link to="/billing" className="group">
            <div className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl hover:scale-105 transition-all cursor-pointer h-full">
              <div className="flex items-center justify-center w-16 h-16 bg-green-100 rounded-lg mb-4 group-hover:bg-green-200 transition">
                <FileText className="text-green-600" size={32} />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Create Bill</h2>
              <p className="text-gray-600 mb-4">Create a new bill with dual verification</p>
              <div className="flex items-center text-green-600 font-semibold group-hover:gap-2 transition-all">
                New Bill <span>→</span>
              </div>
            </div>
          </Link>

          <Link to="/bills" className="group">
            <div className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl hover:scale-105 transition-all cursor-pointer h-full">
              <div className="flex items-center justify-center w-16 h-16 bg-purple-100 rounded-lg mb-4 group-hover:bg-purple-200 transition">
                <FileText className="text-purple-600" size={32} />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">View All Bills</h2>
              <p className="text-gray-600 mb-4">View history of all bills created</p>
              <div className="flex items-center text-purple-600 font-semibold group-hover:gap-2 transition-all">
                View Bills <span>→</span>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default Dashboard