let cachedVoices = []

export function speechSupported() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}

function refreshVoices() {
  if (!speechSupported()) return
  try {
    cachedVoices = window.speechSynthesis.getVoices()
  } catch {
    cachedVoices = []
  }
}

export function trackVoices() {
  if (!speechSupported()) return () => {}
  refreshVoices()
  const handler = () => refreshVoices()
  window.speechSynthesis.addEventListener?.('voiceschanged', handler)
  return () => window.speechSynthesis.removeEventListener?.('voiceschanged', handler)
}

export function getJapaneseVoice() {
  refreshVoices()
  return cachedVoices.find((voice) => voice.lang?.toLowerCase().startsWith('ja')) ?? null
}

export function hasJapaneseVoice() {
  return getJapaneseVoice() !== null
}

export function cancelSpeech() {
  try {
    window.speechSynthesis?.cancel()
  } catch {
    // ignore
  }
}

export function speakKana(text, options = {}) {
  if (!speechSupported()) return 'unsupported'
  try {
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'ja-JP'
    utterance.rate = options.rate ?? 0.85
    utterance.pitch = options.pitch ?? 1
    const voice = getJapaneseVoice()
    if (voice) utterance.voice = voice
    utterance.onerror = (event) => {
      if (event.error !== 'canceled' && event.error !== 'interrupted') {
        options.onError?.(event.error)
      }
    }
    utterance.onend = () => options.onEnd?.()
    window.speechSynthesis.speak(utterance)
    return voice ? 'playing' : 'playing-no-japanese-voice'
  } catch {
    return 'error'
  }
}
