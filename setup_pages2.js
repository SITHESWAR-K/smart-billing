const fs = require('fs');
const path = require('path');

const basePath = path.join(__dirname, 'frontend', 'src', 'pages');

// Ensure pages directory exists
if (!fs.existsSync(basePath)) {
  fs.mkdirSync(basePath, { recursive: true });
}

const pageFiles = {
  'Dashboard.jsx': `import { Link } from 'react-router-dom'
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

export default Dashboard`,

  'Products.jsx': `import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, X } from 'lucide-react'
import Navbar from '../components/Navbar'
import ProductCard from '../components/ProductCard'
import api from '../api/api'
import { useAuth } from '../context/AuthContext'

const Products = () => {
  const navigate = useNavigate()
  const { auth } = useAuth()
  const [products, setProducts] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (auth?.role !== 'main') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="bg-yellow-50 border-2 border-yellow-400 p-6 rounded-lg">
            <h2 className="text-2xl font-bold text-yellow-800">Access Denied</h2>
            <p className="text-yellow-700 mt-2">Only main shopkeepers can manage products.</p>
          </div>
        </div>
      </div>
    )
  }

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      const response = await api.get(\`/products?shopId=\${auth.shopId}\`)
      setProducts(response.data)
    } catch (err) {
      setError('Failed to fetch products')
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (editingProduct) {
        await api.put(\`/products/\${editingProduct.id}\`, {
          ...formData,
          shopId: auth.shopId
        })
      } else {
        await api.post('/products', {
          ...formData,
          shopId: auth.shopId
        })
      }
      
      setFormData({ name: '', description: '', price: '', category: '' })
      setEditingProduct(null)
      setShowForm(false)
      fetchProducts()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save product')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (product) => {
    setEditingProduct(product)
    setFormData({
      name: product.name,
      description: product.description,
      price: product.price,
      category: product.category
    })
    setShowForm(true)
  }

  const handleDelete = async (productId) => {
    if (!confirm('Are you sure?')) return

    try {
      await api.delete(\`/products/\${productId}\`)
      fetchProducts()
    } catch (err) {
      setError('Failed to delete product')
    }
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingProduct(null)
    setFormData({ name: '', description: '', price: '', category: '' })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold text-gray-800">Manage Products</h1>
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-semibold transition"
            >
              <Plus size={20} />
              Add Product
            </button>
          )}
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {showForm && (
          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h2>
              <button onClick={handleCancel} className="p-2 hover:bg-gray-100 rounded-lg">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Product Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none"
                    placeholder="Product name"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Price (₹)</label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    step="0.01"
                    required
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2">Category</label>
                <input
                  type="text"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none"
                  placeholder="Product category"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none"
                  placeholder="Product description"
                  rows="3"
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg transition disabled:opacity-50"
                >
                  {loading ? 'Saving...' : editingProduct ? 'Update Product' : 'Add Product'}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-3 rounded-lg transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {products.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">No products yet. Add your first product!</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map(product => (
              <ProductCard
                key={product.id}
                product={product}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Products`,

  'Billing.jsx': `import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Trash2 } from 'lucide-react'
import Navbar from '../components/Navbar'
import BillItem from '../components/BillItem'
import VoiceVerification from '../components/VoiceVerification'
import api from '../api/api'
import { useAuth } from '../context/AuthContext'

const Billing = () => {
  const navigate = useNavigate()
  const { auth } = useAuth()
  const [products, setProducts] = useState([])
  const [billItems, setBillItems] = useState([])
  const [showVerification, setShowVerification] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [verificationData, setVerificationData] = useState(null)

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      const response = await api.get(\`/products?shopId=\${auth.shopId}\`)
      setProducts(response.data)
    } catch (err) {
      setError('Failed to fetch products')
    }
  }

  const handleAddProduct = (product) => {
    const existingItem = billItems.find(item => item.productId === product.id)
    
    if (existingItem) {
      handleQuantityChange(product.id, existingItem.quantity + 1)
    } else {
      setBillItems([...billItems, {
        productId: product.id,
        productName: product.name,
        price: product.price,
        quantity: 1
      }])
    }
  }

  const handleQuantityChange = (productId, quantity) => {
    if (quantity <= 0) {
      handleRemoveItem(productId)
      return
    }

    setBillItems(billItems.map(item =>
      item.productId === productId ? { ...item, quantity } : item
    ))
  }

  const handleRemoveItem = (productId) => {
    setBillItems(billItems.filter(item => item.productId !== productId))
  }

  const handleVerificationComplete = (data) => {
    setVerificationData(data)
    handleCreateBill(data)
  }

  const handleCreateBill = async (voiceData) => {
    if (billItems.length === 0) {
      setError('Bill must have at least one item')
      return
    }

    setLoading(true)
    setError('')

    try {
      const billData = {
        shopId: auth.shopId,
        shopkeeperId: auth.shopkeeperId,
        items: billItems,
        voiceVerification: voiceData,
        totalAmount: billItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
      }

      const response = await api.post('/bills', billData)
      
      navigate('/bills', { state: { newBillId: response.data.id } })
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create bill')
    } finally {
      setLoading(false)
      setShowVerification(false)
    }
  }

  const totalAmount = billItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-8">Create Bill</h1>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Available Products</h2>
              
              {products.length === 0 ? (
                <p className="text-gray-600">No products available. Add products first.</p>
              ) : (
                <div className="grid gap-3">
                  {products.map(product => (
                    <div
                      key={product.id}
                      className="flex items-center justify-between bg-gray-50 p-4 rounded-lg border border-gray-200 hover:border-indigo-500 transition"
                    >
                      <div className="flex-1">
                        <p className="font-semibold text-gray-800">{product.name}</p>
                        <p className="text-sm text-gray-600">{product.category} • ₹{product.price}</p>
                      </div>
                      <button
                        onClick={() => handleAddProduct(product)}
                        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition"
                      >
                        <Plus size={18} />
                        Add
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-lg p-8 sticky top-20">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Bill Summary</h2>

              {billItems.length === 0 ? (
                <p className="text-gray-600 text-center py-8">No items added yet</p>
              ) : (
                <div className="space-y-4">
                  {billItems.map(item => (
                    <BillItem
                      key={item.productId}
                      item={item}
                      onQuantityChange={handleQuantityChange}
                      onRemove={handleRemoveItem}
                    />
                  ))}
                </div>
              )}

              <div className="border-t-2 border-gray-200 mt-6 pt-6">
                <div className="flex justify-between items-center mb-6">
                  <span className="text-gray-600">Total Items:</span>
                  <span className="font-bold">{billItems.reduce((sum, item) => sum + item.quantity, 0)}</span>
                </div>
                <div className="flex justify-between items-center text-2xl font-bold text-indigo-600 mb-6">
                  <span>Total:</span>
                  <span>₹{totalAmount.toFixed(2)}</span>
                </div>

                {!showVerification ? (
                  <button
                    onClick={() => setShowVerification(true)}
                    disabled={billItems.length === 0 || loading}
                    className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:shadow-lg text-white font-bold py-3 rounded-lg transition disabled:opacity-50"
                  >
                    {loading ? 'Processing...' : 'Verify & Create Bill'}
                  </button>
                ) : (
                  <div className="space-y-4">
                    <VoiceVerification onVerificationComplete={handleVerificationComplete} />
                    <button
                      onClick={() => setShowVerification(false)}
                      className="w-full bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-3 rounded-lg transition"
                    >
                      Cancel Verification
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Billing`,

  'Bills.jsx': `import { useState, useEffect } from 'react'
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
      const response = await api.get(\`/bills?shopId=\${auth.shopId}\`)
      setBills(response.data)
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
                    <p className="font-bold text-gray-800">{bill.billNumber}</p>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-gray-600 text-sm mb-1">
                      <Calendar size={16} />
                      Date
                    </div>
                    <p className="font-bold text-gray-800">
                      {new Date(bill.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-gray-600 text-sm mb-1">
                      <User size={16} />
                      Shopkeeper
                    </div>
                    <p className="font-bold text-gray-800">{bill.shopkeeperName}</p>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-gray-600 text-sm mb-1">
                      <DollarSign size={16} />
                      Total
                    </div>
                    <p className="font-bold text-indigo-600 text-lg">₹{bill.totalAmount.toFixed(2)}</p>
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

export default Bills`
};

console.log('Creating page files (Part 2)...');
Object.entries(pageFiles).forEach(([fileName, content]) => {
  const fullPath = path.join(basePath, fileName);
  fs.writeFileSync(fullPath, content);
  console.log(`Created: src/pages/${fileName}`);
});

console.log('\n✅ Page files (Part 2) created!');
