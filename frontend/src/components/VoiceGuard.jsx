import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import VoiceEnrollment from './VoiceEnrollment'

const VoiceGuard = ({ children }) => {
  const { auth, markVoiceVerified } = useAuth()
  const { t } = useLanguage()
  const [needsVerify, setNeedsVerify] = useState(true)

  useEffect(() => {
    setNeedsVerify(true)
  }, [auth?.shopkeeperId])

  if (!needsVerify) {
    return children
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-10">
      <div className="max-w-md w-full">
        <VoiceEnrollment
          mode="verify"
          storedSignature={auth?.voiceSignature}
          onSuccess={() => {
            markVoiceVerified()
            setNeedsVerify(false)
          }}
        />
        <p className="text-center text-sm text-gray-500 mt-4">
          {t('voiceVerifyRequired')}
        </p>
      </div>
    </div>
  )
}

export default VoiceGuard