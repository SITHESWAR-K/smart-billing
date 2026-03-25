import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { LanguageProvider } from './context/LanguageContext'
import Home from './pages/Home'
import RegisterShop from './pages/RegisterShop'
import RegisterShopkeeper from './pages/RegisterShopkeeper'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Products from './pages/Products'
import Billing from './pages/Billing'
import Bills from './pages/Bills'
import Reports from './pages/Reports'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  return (
    <Router>
      <LanguageProvider>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/register-shop" element={<RegisterShop />} />
            <Route path="/register-shopkeeper" element={<RegisterShopkeeper />} />
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/products" element={<ProtectedRoute><Products /></ProtectedRoute>} />
            <Route path="/billing" element={<ProtectedRoute><Billing /></ProtectedRoute>} />
            <Route path="/bills" element={<ProtectedRoute><Bills /></ProtectedRoute>} />
            <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
          </Routes>
        </AuthProvider>
      </LanguageProvider>
    </Router>
  )
}

export default App
