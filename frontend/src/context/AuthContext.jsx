import React, { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [auth, setAuth] = useState(() => {
    const saved = localStorage.getItem('auth')
    return saved ? JSON.parse(saved) : null
  })

  useEffect(() => {
    if (auth) {
      localStorage.setItem('auth', JSON.stringify(auth))
    } else {
      localStorage.removeItem('auth')
    }
  }, [auth])

  const login = (shopId, shopName, name, role, token, shopkeeperId = null) => {
    const authData = { 
      shopId, 
      shopName, 
      name, 
      role, 
      token, 
      shopkeeperId,
      loginTime: new Date().toISOString(),
      loginDate: new Date().toDateString()
    }
    setAuth(authData)
    return authData
  }

  const logout = () => {
    setAuth(null)
  }

  const updateAuth = (data) => {
    setAuth(prev => ({ ...prev, ...data }))
  }

  // Check if voice was enrolled today
  const isVoiceEnrolledToday = () => {
    if (!auth?.loginDate) return false
    return auth.loginDate === new Date().toDateString()
  }

  return (
    <AuthContext.Provider value={{ auth, login, logout, updateAuth, isVoiceEnrolledToday }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}