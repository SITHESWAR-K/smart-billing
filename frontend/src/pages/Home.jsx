import { Link } from 'react-router-dom'
import { Store, LogIn, UserPlus, Mic, Shield, Clock } from 'lucide-react'

const Home = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500">
      {/* Hero Section */}
      <div className="flex items-center justify-center px-4 py-16">
        <div className="max-w-4xl w-full">
          <div className="text-center mb-12">
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-4">🧾 Smart Billing</h1>
            <p className="text-xl text-indigo-100 mb-8">Voice-Enabled Secure Billing for Your Shop</p>
            
            {/* Feature Pills */}
            <div className="flex flex-wrap justify-center gap-3 mb-8">
              <span className="bg-white/20 text-white px-4 py-2 rounded-full text-sm flex items-center gap-2">
                <Mic size={16} /> Voice to Text
              </span>
              <span className="bg-white/20 text-white px-4 py-2 rounded-full text-sm flex items-center gap-2">
                <Shield size={16} /> PIN + Voice Auth
              </span>
              <span className="bg-white/20 text-white px-4 py-2 rounded-full text-sm flex items-center gap-2">
                <Clock size={16} /> Daily Security Codes
              </span>
            </div>
          </div>

          {/* Main CTA Cards */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <Link to="/register-shop" className="group">
              <div className="bg-white rounded-2xl shadow-xl p-8 hover:shadow-2xl hover:scale-[1.02] transition-all cursor-pointer h-full border-4 border-transparent hover:border-indigo-300">
                <div className="flex items-center justify-center w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-2xl mb-6 group-hover:scale-110 transition">
                  <Store className="text-white" size={40} />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-3">🆕 New Shop?</h2>
                <p className="text-gray-600 mb-6 text-lg">Register your shop and become the main shopkeeper in 2 simple steps</p>
                <div className="bg-indigo-600 text-white text-center py-4 rounded-xl font-bold text-lg group-hover:bg-indigo-700 transition">
                  Register Shop →
                </div>
              </div>
            </Link>

            <Link to="/login" className="group">
              <div className="bg-white rounded-2xl shadow-xl p-8 hover:shadow-2xl hover:scale-[1.02] transition-all cursor-pointer h-full border-4 border-transparent hover:border-green-300">
                <div className="flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl mb-6 group-hover:scale-110 transition">
                  <LogIn className="text-white" size={40} />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-3">👋 Already Registered?</h2>
                <p className="text-gray-600 mb-6 text-lg">Login with your Shop ID and 4-digit PIN</p>
                <div className="bg-green-600 text-white text-center py-4 rounded-xl font-bold text-lg group-hover:bg-green-700 transition">
                  Login →
                </div>
              </div>
            </Link>
          </div>

          {/* Secondary CTA */}
          <div className="bg-white/10 backdrop-blur rounded-2xl p-6 text-center">
            <p className="text-white mb-4">
              <UserPlus className="inline mr-2" size={20} />
              Need to add an alternative shopkeeper to an existing shop?
            </p>
            <Link 
              to="/register-shopkeeper" 
              className="inline-block bg-white text-indigo-600 px-6 py-3 rounded-xl font-semibold hover:bg-indigo-50 transition"
            >
              Add Alternative Shopkeeper
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Home