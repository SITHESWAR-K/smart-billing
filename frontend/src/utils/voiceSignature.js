import { PitchDetector, initAudioContext, setupAnalyser } from './pitchDetection'
import { stopActiveRecognition, stopSpeechSynthesis } from './speechRecognition'

const DEFAULT_CAPTURE_MS = 2200
const DEFAULT_SAMPLE_MS = 120
const MIN_SAMPLES = 6
const MIN_MAGNITUDE = 12
const DAILY_CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

export const isVoiceCaptureSupported = () => {
	return Boolean(navigator?.mediaDevices?.getUserMedia)
}

const cleanupAudio = async (audioContext, stream) => {
	try {
		stream?.getTracks().forEach(track => track.stop())
	} catch (error) {
		// Ignore cleanup errors.
	}

	try {
		if (audioContext?.state !== 'closed') {
			await audioContext?.close()
		}
	} catch (error) {
		// Ignore close errors.
	}
}

const summarizeSamples = (samples) => {
	const filtered = samples.filter(sample => (
		Number.isFinite(sample.frequency)
		&& sample.frequency > 50
		&& sample.frequency < 500
		&& sample.magnitude >= MIN_MAGNITUDE
	))

	if (filtered.length < MIN_SAMPLES) {
		return null
	}

	const totalFreq = filtered.reduce((sum, sample) => sum + sample.frequency, 0)
	const totalMag = filtered.reduce((sum, sample) => sum + sample.magnitude, 0)
	const avgFreq = totalFreq / filtered.length
	const avgMag = totalMag / filtered.length
	const variance = filtered.reduce((sum, sample) => sum + Math.pow(sample.frequency - avgFreq, 2), 0) / filtered.length

	return {
		avgFreq: Math.round(avgFreq),
		avgMag: Math.round(avgMag),
		variance: Math.round(variance),
		sampleCount: filtered.length,
		capturedAt: new Date().toISOString()
	}
}

export const captureVoiceSignature = async (options = {}) => {
	const durationMs = options.durationMs || DEFAULT_CAPTURE_MS
	const sampleIntervalMs = options.sampleIntervalMs || DEFAULT_SAMPLE_MS

	if (!isVoiceCaptureSupported()) {
		throw new Error('Microphone is not supported in this browser.')
	}

	stopSpeechSynthesis()
	stopActiveRecognition()

	const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
	const audioContext = await initAudioContext()
	const source = audioContext.createMediaStreamSource(stream)
	const { analyser, bufferLength, dataArray } = setupAnalyser(audioContext, source)
	const detector = new PitchDetector(audioContext, analyser, bufferLength, dataArray)
	const samples = []

	try {
		await new Promise((resolve) => {
			const startedAt = Date.now()
			const interval = setInterval(() => {
				const { frequency, magnitude } = detector.detectPitch()
				samples.push({ frequency, magnitude })

				if (Date.now() - startedAt >= durationMs) {
					clearInterval(interval)
					resolve()
				}
			}, sampleIntervalMs)
		})
	} finally {
		await cleanupAudio(audioContext, stream)
	}

	const signature = summarizeSamples(samples)
	if (!signature) {
		throw new Error('VOICE_NO_CLEAR')
	}

	return signature
}

export const normalizeVoiceSignature = (signature) => {
	if (!signature) return null
	if (typeof signature === 'string') {
		try {
			return JSON.parse(signature)
		} catch (error) {
			return null
		}
	}
	return signature
}

export const compareVoiceSignatures = (storedSignature, currentSignature, options = {}) => {
	const stored = normalizeVoiceSignature(storedSignature)
	const current = normalizeVoiceSignature(currentSignature)

	if (!stored || !current) {
		return { score: 0, isMatch: false }
	}

	const freqDiff = Math.abs(current.avgFreq - stored.avgFreq) / Math.max(stored.avgFreq || 1, 1)
	const magDiff = Math.abs(current.avgMag - stored.avgMag) / Math.max(stored.avgMag || 1, 1)
	const varianceDiff = Math.abs((current.variance || 0) - (stored.variance || 0)) / Math.max(stored.variance || 1, 1)

	const rawScore = 1 - (0.6 * freqDiff + 0.3 * magDiff + 0.1 * varianceDiff)
	const score = Math.max(0, Math.min(1, rawScore))
	const threshold = typeof options.threshold === 'number' ? options.threshold : 0.45

	return {
		score: Number(score.toFixed(2)),
		isMatch: score >= threshold
	}
}

export const serializeVoiceSignature = (signature) => {
	try {
		return JSON.stringify(signature)
	} catch (error) {
		return ''
	}
}

export const getDailyVoiceCode = (seed = '') => {
	const dateStamp = new Date().toISOString().slice(0, 10)
	const base = `${seed}-${dateStamp}`
	let hash = 0
	for (let i = 0; i < base.length; i += 1) {
		hash = Math.imul(31, hash) + base.charCodeAt(i)
		hash >>>= 0
	}

	let code = ''
	let state = hash || 1
	for (let i = 0; i < 6; i += 1) {
		state = (Math.imul(1664525, state) + 1013904223) >>> 0
		code += DAILY_CODE_CHARS[state % DAILY_CODE_CHARS.length]
	}

	return code
}
