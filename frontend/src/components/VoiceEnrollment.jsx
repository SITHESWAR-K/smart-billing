import { useState } from 'react'
import { Mic, Square, ShieldCheck } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import {
	captureVoiceSignature,
	compareVoiceSignatures,
	isVoiceCaptureSupported,
	serializeVoiceSignature
} from '../utils/voiceSignature'

const VoiceEnrollment = ({
	mode = 'verify',
	storedSignature,
	threshold = 0.45,
	promptText,
	code,
	onSuccess,
	onSkip
}) => {
	const { t } = useLanguage()
	const [isRecording, setIsRecording] = useState(false)
	const [status, setStatus] = useState('')
	const [error, setError] = useState('')
	const [score, setScore] = useState(null)

	const handleCapture = async () => {
		if (!isVoiceCaptureSupported()) {
			setError(t('voiceUnsupported'))
			return
		}

		setError('')
		setScore(null)
		setStatus(t('voiceRecording'))
		setIsRecording(true)

		try {
			const signature = await captureVoiceSignature()

			if (mode === 'verify') {
				const result = compareVoiceSignatures(storedSignature, signature, { threshold })
				setScore(result.score)
				if (result.isMatch) {
					setStatus(t('voiceMatchSuccess'))
					onSuccess?.({ signature, score: result.score })
				} else {
					setStatus('')
					setError(t('voiceMatchFail'))
				}
			} else {
				const serialized = serializeVoiceSignature(signature)
				setStatus(t('voiceEnrollSuccess'))
				onSuccess?.({ signature, serialized })
			}
		} catch (err) {
			setStatus('')
			if (err?.message === 'VOICE_NO_CLEAR') {
				setError(t('voiceNoClear'))
			} else {
				setError(t('voiceEnrollFail'))
			}
		} finally {
			setIsRecording(false)
		}
	}

	const title = mode === 'verify' ? t('voiceVerifyTitle') : t('voiceEnrollTitle')
	const description = mode === 'verify' ? t('voiceVerifyDesc') : t('voiceEnrollDesc')
	const resolvedPrompt = promptText || t('voicePrompt')

	return (
		<div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
			<div className="flex items-center gap-3 mb-4">
				<div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
					<ShieldCheck className="text-emerald-600" size={24} />
				</div>
				<div>
					<h2 className="text-xl font-bold text-gray-800">{title}</h2>
					<p className="text-gray-600 text-sm">{description}</p>
				</div>
			</div>

			<div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-4">
				<p className="text-sm text-emerald-700">{resolvedPrompt}</p>
			</div>

			{code && (
				<div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-4">
					<p className="text-xs uppercase tracking-wide text-slate-500 mb-2">
						{t('voiceDailyCodeLabel')}
					</p>
					<p className="font-mono text-2xl text-slate-800 mb-2">{code}</p>
					<p className="text-xs text-slate-500">{t('voiceDailyCodeHint')}</p>
				</div>
			)}

			{error && (
				<div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
					{error}
				</div>
			)}

			{status && (
				<div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg mb-4">
					{status}
				</div>
			)}

			{score !== null && (
				<p className="text-sm text-gray-500 mb-4">
					{t('voiceScore', { score })}
				</p>
			)}

			<div className="flex flex-wrap items-center gap-3">
				{!isRecording ? (
					<button
						type="button"
						onClick={handleCapture}
						className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-3 rounded-xl font-semibold transition"
					>
						<Mic size={20} />
						{t('voiceStart')}
					</button>
				) : (
					<button
						type="button"
						className="flex items-center gap-2 bg-red-500 text-white px-5 py-3 rounded-xl font-semibold transition animate-pulse"
						disabled
					>
						<Square size={20} />
						{t('voiceRecording')}
					</button>
				)}

				{onSkip && (
					<button
						type="button"
						onClick={onSkip}
						className="text-gray-600 hover:text-gray-800 font-semibold"
					>
						{t('voiceSkip')}
					</button>
				)}
			</div>
		</div>
	)
}

export default VoiceEnrollment
