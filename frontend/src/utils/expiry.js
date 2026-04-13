const DEFAULT_EXPIRY_ALERT_DAYS = 7

export const normalizeExpiryDate = (value) => {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  date.setHours(0, 0, 0, 0)
  return date
}

export const getExpiryStatus = (productOrValue, thresholdDays = DEFAULT_EXPIRY_ALERT_DAYS) => {
  const value = productOrValue?.expiry_date ?? productOrValue
  const expiryDate = normalizeExpiryDate(value)
  if (!expiryDate) return null

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const diffMs = expiryDate.getTime() - today.getTime()
  const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

  if (daysLeft < 0) {
    return { status: 'expired', daysLeft, date: expiryDate }
  }

  if (daysLeft <= thresholdDays) {
    return { status: 'near', daysLeft, date: expiryDate }
  }

  return null
}

export const formatExpiryInputValue = (value) => {
  const expiryDate = normalizeExpiryDate(value)
  if (!expiryDate) return ''
  return expiryDate.toISOString().slice(0, 10)
}

export const formatExpiryDisplay = (value, locale = 'en-IN') => {
  const expiryDate = normalizeExpiryDate(value)
  if (!expiryDate) return ''
  return expiryDate.toLocaleDateString(locale)
}

export const getExpiryAlertDays = () => DEFAULT_EXPIRY_ALERT_DAYS
