/**
 * Voice Signature Utility
 * Uses MFCC (Mel-Frequency Cepstral Coefficients) for voice fingerprinting
 * More accurate than simple pitch detection for speaker identification
 */
import Meyda from 'meyda'

// Audio context and analyzer state
let audioContext = null
let analyzer = null
let mediaStream = null

/**
 * Initialize audio context and get microphone access
 */
export const initAudioContext = async () => {
  try {
    audioContext = new (window.AudioContext || window.webkitAudioContext)()
    
    if (audioContext.state === 'suspended') {
      await audioContext.resume()
    }
    
    mediaStream = await navigator.mediaDevices.getUserMedia({ 
      audio: { 
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      } 
    })
    
    const source = audioContext.createMediaStreamSource(mediaStream)
    
    return { audioContext, source, mediaStream }
  } catch (error) {
    console.error('Failed to initialize audio:', error)
    throw error
  }
}

/**
 * Extract voice features (MFCC) from audio for a specified duration
 * @param {number} durationMs - Recording duration in milliseconds
 * @param {function} onProgress - Progress callback (0-100)
 * @returns {Promise<Object>} Voice signature object
 */
export const extractVoiceSignature = async (durationMs = 3000, onProgress = () => {}) => {
  const { audioContext, source, mediaStream } = await initAudioContext()
  
  const mfccFrames = []
  const energyFrames = []
  const pitchFrames = []
  
  // Create Meyda analyzer
  analyzer = Meyda.createMeydaAnalyzer({
    audioContext,
    source,
    bufferSize: 512,
    featureExtractors: ['mfcc', 'rms', 'spectralCentroid', 'zcr'],
    callback: (features) => {
      if (features && features.mfcc) {
        mfccFrames.push([...features.mfcc])
        energyFrames.push(features.rms || 0)
        pitchFrames.push(features.spectralCentroid || 0)
      }
    }
  })
  
  analyzer.start()
  
  // Record for specified duration with progress updates
  const startTime = Date.now()
  await new Promise((resolve) => {
    const progressInterval = setInterval(() => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(100, (elapsed / durationMs) * 100)
      onProgress(Math.round(progress))
      
      if (elapsed >= durationMs) {
        clearInterval(progressInterval)
        resolve()
      }
    }, 100)
  })
  
  analyzer.stop()
  
  // Cleanup
  mediaStream.getTracks().forEach(track => track.stop())
  if (audioContext.state !== 'closed') {
    await audioContext.close()
  }
  
  // Filter out silent frames (low energy)
  const energyThreshold = 0.005 // Lower threshold for better detection
  const validFrames = mfccFrames.filter((_, i) => energyFrames[i] > energyThreshold)
  
  if (validFrames.length < 5) { // Reduced from 10 to 5 for quick captures
    throw new Error('Not enough voice detected. Please speak louder.')
  }
  
  // Calculate average MFCC coefficients
  const numCoeffs = validFrames[0]?.length || 13
  const avgMfcc = new Array(numCoeffs).fill(0)
  const stdMfcc = new Array(numCoeffs).fill(0)
  
  // Mean
  for (const frame of validFrames) {
    for (let i = 0; i < numCoeffs; i++) {
      avgMfcc[i] += frame[i] / validFrames.length
    }
  }
  
  // Standard deviation
  for (const frame of validFrames) {
    for (let i = 0; i < numCoeffs; i++) {
      stdMfcc[i] += Math.pow(frame[i] - avgMfcc[i], 2) / validFrames.length
    }
  }
  for (let i = 0; i < numCoeffs; i++) {
    stdMfcc[i] = Math.sqrt(stdMfcc[i])
  }
  
  // Calculate average energy and pitch
  const validEnergies = energyFrames.filter(e => e > energyThreshold)
  const avgEnergy = validEnergies.reduce((a, b) => a + b, 0) / validEnergies.length
  
  const validPitches = pitchFrames.filter((_, i) => energyFrames[i] > energyThreshold)
  const avgPitch = validPitches.reduce((a, b) => a + b, 0) / validPitches.length
  
  return {
    mfcc: avgMfcc.map(v => Math.round(v * 1000) / 1000), // Round for storage
    mfccStd: stdMfcc.map(v => Math.round(v * 1000) / 1000),
    energy: Math.round(avgEnergy * 1000) / 1000,
    pitch: Math.round(avgPitch * 100) / 100,
    frameCount: validFrames.length,
    timestamp: new Date().toISOString()
  }
}

/**
 * Compare two voice signatures using multiple metrics for better accuracy
 * Uses Euclidean distance instead of cosine similarity for better discrimination
 * @param {Object} signature1 - First voice signature (enrolled)
 * @param {Object} signature2 - Second voice signature (current)
 * @returns {number} Similarity score (0-1, higher is more similar)
 */
export const compareSignatures = (signature1, signature2) => {
  if (!signature1?.mfcc || !signature2?.mfcc) {
    return 0
  }
  
  const mfcc1 = signature1.mfcc
  const mfcc2 = signature2.mfcc
  const std1 = signature1.mfccStd || []
  const std2 = signature2.mfccStd || []
  
  // 1. Euclidean distance for MFCC (more discriminative than cosine)
  let mfccEuclidean = 0
  for (let i = 0; i < Math.min(mfcc1.length, mfcc2.length); i++) {
    mfccEuclidean += Math.pow(mfcc1[i] - mfcc2[i], 2)
  }
  mfccEuclidean = Math.sqrt(mfccEuclidean)
  // Normalize: smaller distance = higher similarity
  // Typical MFCC distance between same speaker: 5-15, different speaker: 15-40+
  const mfccSimilarity = Math.max(0, 1 - (mfccEuclidean / 30))
  
  // 2. Compare standard deviations (voice dynamics)
  let stdEuclidean = 0
  if (std1.length > 0 && std2.length > 0) {
    for (let i = 0; i < Math.min(std1.length, std2.length); i++) {
      stdEuclidean += Math.pow(std1[i] - std2[i], 2)
    }
    stdEuclidean = Math.sqrt(stdEuclidean)
  }
  const stdSimilarity = Math.max(0, 1 - (stdEuclidean / 20))
  
  // 3. Energy comparison (voice loudness pattern)
  const energyRatio = Math.min(signature1.energy, signature2.energy) / 
                      Math.max(signature1.energy, signature2.energy) || 0
  
  // 4. Pitch comparison (fundamental frequency)
  const pitchDiff = Math.abs((signature1.pitch || 0) - (signature2.pitch || 0))
  // Typical pitch difference: same speaker <200, different speaker 200-1000+
  const pitchSimilarity = Math.max(0, 1 - (pitchDiff / 500))
  
  // Weighted combination - more weight on discriminative features
  // MFCC Euclidean (40%) + Std deviation (25%) + Pitch (25%) + Energy (10%)
  const combinedScore = (mfccSimilarity * 0.40) + 
                        (stdSimilarity * 0.25) + 
                        (pitchSimilarity * 0.25) + 
                        (energyRatio * 0.10)
  
  console.log(`Voice comparison: mfcc=${mfccSimilarity.toFixed(2)}, std=${stdSimilarity.toFixed(2)}, pitch=${pitchSimilarity.toFixed(2)}, energy=${energyRatio.toFixed(2)}, combined=${combinedScore.toFixed(2)}`)
  
  return Math.round(combinedScore * 100) / 100
}

/**
 * Verify if current voice matches stored signature
 * @param {Object} storedSignature - Previously stored voice signature
 * @param {Object} currentSignature - Current voice signature to verify
 * @param {number} threshold - Minimum similarity score to consider a match (default: 0.65)
 * @returns {Object} Verification result
 */
export const verifyVoice = (storedSignature, currentSignature, threshold = 0.65) => {
  const similarity = compareSignatures(storedSignature, currentSignature)
  
  return {
    verified: similarity >= threshold,
    similarity,
    threshold,
    confidence: similarity >= 0.80 ? 'high' : similarity >= 0.65 ? 'medium' : 'low'
  }
}

/**
 * Quick voice capture for verification (shorter duration)
 * @param {number} durationMs - Recording duration (default: 1500ms)
 * @returns {Promise<Object>} Voice signature
 */
export const captureQuickSignature = async (durationMs = 1500) => {
  return extractVoiceSignature(durationMs, () => {})
}

/**
 * Continuous Voice Recorder - records audio while speech recognition is active
 * This captures voice DURING speech, not after, solving the timing issue
 */
export class ContinuousVoiceRecorder {
  constructor() {
    this.audioContext = null
    this.mediaStream = null
    this.analyzer = null
    this.mfccFrames = []
    this.energyFrames = []
    this.pitchFrames = []
    this.isRecording = false
  }

  async start() {
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)()
      
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume()
      }
      
      this.mediaStream = await navigator.mediaDevices.getUserMedia({ 
        audio: { 
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      })
      
      const source = this.audioContext.createMediaStreamSource(this.mediaStream)
      
      this.mfccFrames = []
      this.energyFrames = []
      this.pitchFrames = []
      
      this.analyzer = Meyda.createMeydaAnalyzer({
        audioContext: this.audioContext,
        source,
        bufferSize: 512,
        featureExtractors: ['mfcc', 'rms', 'spectralCentroid'],
        callback: (features) => {
          if (features && features.mfcc && this.isRecording) {
            this.mfccFrames.push([...features.mfcc])
            this.energyFrames.push(features.rms || 0)
            this.pitchFrames.push(features.spectralCentroid || 0)
          }
        }
      })
      
      this.analyzer.start()
      this.isRecording = true
      console.log('Voice recorder started')
      return true
    } catch (error) {
      console.error('Failed to start voice recorder:', error)
      return false
    }
  }

  stop() {
    this.isRecording = false
    
    if (this.analyzer) {
      this.analyzer.stop()
      this.analyzer = null
    }
    
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop())
      this.mediaStream = null
    }
    
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close()
      this.audioContext = null
    }
    
    console.log('Voice recorder stopped')
  }

  getSignature() {
    const energyThreshold = 0.005
    const validFrames = this.mfccFrames.filter((_, i) => this.energyFrames[i] > energyThreshold)
    
    console.log(`Voice frames captured: ${this.mfccFrames.length}, valid: ${validFrames.length}`)
    
    if (validFrames.length < 3) {
      return null // Not enough voice data
    }
    
    const numCoeffs = validFrames[0]?.length || 13
    const avgMfcc = new Array(numCoeffs).fill(0)
    const stdMfcc = new Array(numCoeffs).fill(0)
    
    // Calculate mean
    for (const frame of validFrames) {
      for (let i = 0; i < numCoeffs; i++) {
        avgMfcc[i] += frame[i] / validFrames.length
      }
    }
    
    // Calculate standard deviation
    for (const frame of validFrames) {
      for (let i = 0; i < numCoeffs; i++) {
        stdMfcc[i] += Math.pow(frame[i] - avgMfcc[i], 2) / validFrames.length
      }
    }
    for (let i = 0; i < numCoeffs; i++) {
      stdMfcc[i] = Math.sqrt(stdMfcc[i])
    }
    
    const validEnergies = this.energyFrames.filter(e => e > energyThreshold)
    const avgEnergy = validEnergies.length > 0 
      ? validEnergies.reduce((a, b) => a + b, 0) / validEnergies.length 
      : 0
    
    const validPitches = this.pitchFrames.filter((_, i) => this.energyFrames[i] > energyThreshold)
    const avgPitch = validPitches.length > 0 
      ? validPitches.reduce((a, b) => a + b, 0) / validPitches.length 
      : 0
    
    return {
      mfcc: avgMfcc.map(v => Math.round(v * 1000) / 1000),
      mfccStd: stdMfcc.map(v => Math.round(v * 1000) / 1000),
      energy: Math.round(avgEnergy * 1000) / 1000,
      pitch: Math.round(avgPitch * 100) / 100,
      frameCount: validFrames.length
    }
  }

  clear() {
    this.mfccFrames = []
    this.energyFrames = []
    this.pitchFrames = []
  }
}

// Singleton instance for easy use
let recorderInstance = null

export const getVoiceRecorder = () => {
  if (!recorderInstance) {
    recorderInstance = new ContinuousVoiceRecorder()
  }
  return recorderInstance
}

export default {
  extractVoiceSignature,
  compareSignatures,
  verifyVoice,
  captureQuickSignature,
  ContinuousVoiceRecorder,
  getVoiceRecorder
}
