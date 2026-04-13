import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import VoiceEnrollment from './VoiceEnrollment'

const VoiceVerifyModal = ({ open, onSuccess, onCancel, threshold = 0.3 }) => {
  const { auth, markVoiceVerified } = useAuth()
  const { t } = useLanguage()

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
      <div className="w-full max-w-md">
        <VoiceEnrollment
          mode="verify"
          storedSignature={auth?.voiceSignature}
          threshold={threshold}
          onSuccess={() => {
            markVoiceVerified()
            onSuccess?.()
          }}
        />
        {onCancel && (
          <div className="flex justify-center mt-4">
            <button
              type="button"
              onClick={onCancel}
              className="text-gray-600 hover:text-gray-800 font-semibold"
            >
              {t('cancel')}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default VoiceVerifyModal
