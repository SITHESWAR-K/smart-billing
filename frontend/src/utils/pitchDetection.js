export class PitchDetector {
  constructor(audioContext, analyser, bufferLength, dataArray) {
    this.audioContext = audioContext
    this.analyser = analyser
    this.bufferLength = bufferLength
    this.dataArray = dataArray
  }

  detectPitch() {
    this.analyser.getByteFrequencyData(this.dataArray)
    
    let maxValue = 0
    let maxIndex = 0
    
    for (let i = 0; i < this.dataArray.length; i++) {
      if (this.dataArray[i] > maxValue) {
        maxValue = this.dataArray[i]
        maxIndex = i
      }
    }
    
    const nyquist = this.audioContext.sampleRate / 2
    const frequency = (maxIndex * nyquist) / this.bufferLength
    
    return {
      frequency: Math.round(frequency),
      magnitude: maxValue
    }
  }

  isPitchInRange(frequency, minFreq = 80, maxFreq = 400) {
    return frequency >= minFreq && frequency <= maxFreq
  }
}

export const initAudioContext = async () => {
  const audioContext = new (window.AudioContext || window.webkitAudioContext)()
  
  if (audioContext.state === 'suspended') {
    await audioContext.resume()
  }
  
  return audioContext
}

export const setupAnalyser = (audioContext, sourceNode) => {
  const analyser = audioContext.createAnalyser()
  analyser.fftSize = 2048
  const bufferLength = analyser.frequencyBinCount
  const dataArray = new Uint8Array(bufferLength)
  
  sourceNode.connect(analyser)
  
  return { analyser, bufferLength, dataArray }
}