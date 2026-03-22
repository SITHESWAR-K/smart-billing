export const generateDailyCode = () => {
  const today = new Date()
  const dateString = today.toISOString().split('T')[0]
  
  const hash = dateString.split('').reduce((acc, char) => {
    return ((acc << 5) - acc) + char.charCodeAt(0)
  }, 0)
  
  const code = Math.abs(hash).toString().slice(-6).padStart(6, '0')
  return code
}

export const getDailyCodeTimeRemaining = () => {
  const now = new Date()
  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(0, 0, 0, 0)
  
  const timeRemaining = tomorrow - now
  const hours = Math.floor(timeRemaining / (1000 * 60 * 60))
  const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60))
  
  return { hours, minutes }
}