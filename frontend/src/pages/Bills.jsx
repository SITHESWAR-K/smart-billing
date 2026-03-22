import { useState, useEffect } from 'react'
import { Calendar, User, DollarSign, Package } from 'lucide-react'
import Navbar from '../components/Navbar'
import api from '../api/api'
import { useAuth } from '../context/AuthContext'

const Bills = () => {
  const { auth } = useAuth()
  const [bills, setBills] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchBills()
  }, [])

  const fetchBills = async () => {
    try {
      const response = await api.get(`/bills/${auth.shopId}`)
      setBills(response.data.bills || [])
    } catch (err) {
      setError('Failed to fetch bills')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-8">All Bills</h1>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Loading bills...</p>
          </div>
        ) : bills.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">No bills created yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {bills.map(bill => (
              <div key={bill.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
                <div className="grid md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <div className="flex items-center gap-2 text-gray-600 text-sm mb-1">
                      <Calendar size={16} />
                      Bill #
                    </div>
                    <p className="font-bold text-gray-800">{bill.id}</p>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-gray-600 text-sm mb-1">
                      <Calendar size={16} />
                      Date
                    </div>
                    <p className="font-bold text-gray-800">
                      {new Date(bill.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-gray-600 text-sm mb-1">
                      <User size={16} />
                      Shopkeeper
                    </div>
                    <p className="font-bold text-gray-800">{bill.created_by}</p>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-gray-600 text-sm mb-1">
                      <DollarSign size={16} />
                      Total
                    </div>
                    <p className="font-bold text-indigo-600 text-lg">₹{bill.total?.toFixed(2)}</p>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="flex items-center gap-2 text-gray-700 font-semibold mb-3">
                    <Package size={18} />
                    Items ({bill.items?.length || 0})
                  </div>
                  <div className="space-y-2">
                    {bill.items?.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-gray-600 text-sm">
                        <span>{item.productName} x{item.quantity}</span>
                        <span>₹{(item.price * item.quantity).toFixed(2)}</span>
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