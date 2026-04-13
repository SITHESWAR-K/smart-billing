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

  const login = (shopId, shopName, name, role, token, shopkeeperId = null, options = {}) => {
    let resolvedShopkeeperId = shopkeeperId
    let resolvedOptions = options

    if (shopkeeperId && typeof shopkeeperId === 'object') {
      resolvedOptions = shopkeeperId
      resolvedShopkeeperId = null
    }

    const { voiceSignature = null, voiceEnrolledAt = null } = resolvedOptions || {}
    const authData = { 
      shopId, 
      shopName, 
      name, 
      role, 
      token, 
      shopkeeperId: resolvedShopkeeperId,
      voiceSignature,
      voiceEnrolledAt,
      voiceVerifiedAt: null,
      voiceVerifiedDate: null,
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

  const markVoiceVerified = () => {
    const now = new Date()
    setAuth(prev => ({
      ...prev,
      voiceVerifiedAt: now.toISOString(),
      voiceVerifiedDate: now.toDateString()
    }))
  }

  const isVoiceVerifiedForSession = () => {
    if (!auth?.voiceVerifiedAt || !auth?.loginTime) return false
    return new Date(auth.voiceVerifiedAt).getTime() >= new Date(auth.loginTime).getTime()
  }

  // Check if voice was enrolled today
  const isVoiceEnrolledToday = () => {
    if (!auth?.loginDate) return false
    return auth.loginDate === new Date().toDateString()
  }

  return (
    <AuthContext.Provider value={{ auth, login, logout, updateAuth, isVoiceEnrolledToday, markVoiceVerified, isVoiceVerifiedForSession }}>
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}