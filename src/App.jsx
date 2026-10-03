import { useEffect, useMemo, useRef, useState } from 'react'
import { groups, kanaCards } from './data/kana'
import { cancelSpeech, speakKana, speechSupported, trackVoices } from './speech'

const STORAGE_KEY = 'hirakana-mastery-v1'
const THEME_KEY = 'hirakana-theme-v1'
const BEST_STREAK_KEY = 'hirakana-beststreak-v1'
const GROUPS_KEY = 'hirakana-groups-v1'
const MASTERY_CAP = 5
const MASTERED_THRESHOLD = 3
const OPTION_COUNT = 4
const MIN_PROGRESS_WIDTH = 4
const modes = [
  { id: 'mixed', label: 'Campur', note: 'Hiragana + Katakana' },
  { id: 'hiragana', label: 'Hiragana', note: 'あいうえお' },
  { id: 'katakana', label: 'Katakana', note: 'アイウエオ' },
]

const practiceStyles = [
  { id: 'standard', label: 'Standar', note: 'soal biasa' },
  { id: 'listening', label: 'Dengarkan', note: 'jawab dari suara' },
  { id: 'typing', label: 'Mengetik', note: 'latihan kecepatan' },
]

const freshMastery = () => Object.fromEntries(kanaCards.map((card) => [card.id, 0]))

function readMastery() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY))
    if (!saved || typeof saved !== 'object' || Array.isArray(saved)) return freshMastery()
    // Simpan key yang tidak dikenal agar progres dari versi lain tidak hilang
    // (AGENTS.md: jangan hapus progres user). Nilai di luar rentang diabaikan.
    const result = {}
    for (const [id, value] of Object.entries(saved)) {
      if (typeof value === 'number' && Number.isFinite(value)) {
        if (id !== '__proto__' && id !== 'constructor' && id !== 'prototype') result[id] = Math.max(0, Math.min(MASTERY_CAP, Math.round(value)))
      }
    }
    for (const [id, value] of Object.entries(freshMastery())) {
      if (!(id in result)) result[id] = value
    }
    return result
  } catch {
    return freshMastery()
  }
}

function readTheme() {
  try {
    const saved = localStorage.getItem(THEME_KEY)
    if (saved === 'dark' || saved === 'light') return saved
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  } catch {
    return 'light'
  }
}

function readBestStreak() {
  try {
    const saved = localStorage.getItem(BEST_STREAK_KEY)
    if (!saved || !/^\d+$/.test(saved.trim())) return 0
    const value = Number(saved.trim())
    return Number.isSafeInteger(value) ? value : 0
  } catch {
    return 0
  }
}

function readActiveGroups() {
  try {
    const saved = JSON.parse(localStorage.getItem(GROUPS_KEY))
    if (!Array.isArray(saved)) return ['seion']
    const valid = saved.filter((id) => groups.some((group) => group.id === id))
    return valid.length > 0 ? [...new Set(valid)] : ['seion']
  } catch {
    return ['seion']
  }
}

function safeSet(key, value) {
  try {
    localStorage.setItem(key, value)
    return true
  } catch {
    // storage penuh atau dinonaktifkan; abaikan tanpa menumbangkan UI
    return false
  }
}

function shuffle(items) {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

// Arah soal: 'kana->romaji' (tebak bacaan) atau 'romaji->kana' (tebak aksara).
function getOptions(card, pool, direction) {
  if (direction === 'romaji->kana' || direction === 'audio->kana') {
    // Opsi berupa kana dari script yang sama, tanpa romaji yang sama dengan jawaban.
    const distractorPool = [...new Set(
      pool
        .filter((item) => item.script === card.script && item.romaji !== card.romaji)
        .map((item) => item.kana),
    )]
    const options = [card.kana, ...shuffle(distractorPool).slice(0, OPTION_COUNT - 1)]
    return shuffle(options)
  }
  // Opsi berupa romaji unik, jawaban benar selalu diikutkan, distraktor dikecualikan.
  const distractorPool = [...new Set(
    pool
      .filter((item) => item.romaji !== card.romaji)
      .map((item) => item.romaji),
  )]
  const options = [card.romaji, ...shuffle(distractorPool).slice(0, OPTION_COUNT - 1)]
  return shuffle(options)
}

function App() {
  const [mode, setMode] = useState('mixed')
  const [theme, setTheme] = useState(readTheme)
  const [mastery, setMastery] = useState(readMastery)
  const [view, setView] = useState('dashboard') // 'dashboard' | 'quiz' | 'summary' | 'table'
  const [question, setQuestion] = useState(null)
  const [options, setOptions] = useState([])
  const [selected, setSelected] = useState(null)
  const [answerState, setAnswerState] = useState('idle') // 'idle' | 'correct' | 'wrong'
  const [typedAnswer, setTypedAnswer] = useState('')
  const [streak, setStreak] = useState(0)
  const [bestStreak, setBestStreak] = useState(readBestStreak)
  const [roundScore, setRoundScore] = useState(0)
  const [roundTotal, setRoundTotal] = useState(0)
  const [reviewIds, setReviewIds] = useState([])
  const [storageOk, setStorageOk] = useState(true)
  const [activeGroups, setActiveGroups] = useState(readActiveGroups)
  const [practiceStyle, setPracticeStyle] = useState('standard')
  const [audioMessage, setAudioMessage] = useState('')
  const [audioSupported] = useState(speechSupported())
  const [showMnemonic, setShowMnemonic] = useState(true)
  const [showTableMnemonics, setShowTableMnemonics] = useState(true)
  const [typingCards, setTypingCards] = useState([])
  const [typingIndex, setTypingIndex] = useState(0)
  const [typingResults, setTypingResults] = useState([])

  const inputRef = useRef(null)
  const nextButtonRef = useRef(null)
  const pageTitleRef = useRef(null)
  const playButtonRef = useRef(null)
  const isMixedDirection = question?.direction === 'romaji->kana'
  const isListening = question?.direction === 'audio->kana'
  const picksKana = question?.direction === 'romaji->kana' || isListening

  const pool = useMemo(
    () => kanaCards.filter(
      (card) => (mode === 'mixed' || card.script === mode) && activeGroups.includes(card.group),
    ),
    [mode, activeGroups],
  )

  const masteredCount = useMemo(
    () => kanaCards.filter((card) => (mastery[card.id] ?? 0) >= MASTERED_THRESHOLD).length,
    [mastery],
  )
  const touchedCount = useMemo(
    () => kanaCards.filter((card) => (mastery[card.id] ?? 0) > 0).length,
    [mastery],
  )
  const totalProgress = Math.round((masteredCount / kanaCards.length) * 100)

  useEffect(() => {
    if (!safeSet(STORAGE_KEY, JSON.stringify(mastery))) setStorageOk(false)
    else setStorageOk(true)
  }, [mastery])

  useEffect(() => {
    if (!safeSet(THEME_KEY, theme)) setStorageOk(false)
    else setStorageOk(true)
  }, [theme])

  useEffect(() => {
    if (!safeSet(BEST_STREAK_KEY, String(bestStreak))) setStorageOk(false)
    else setStorageOk(true)
  }, [bestStreak])

  useEffect(() => {
    if (!safeSet(GROUPS_KEY, JSON.stringify(activeGroups))) setStorageOk(false)
    else setStorageOk(true)
  }, [activeGroups])

  useEffect(() => () => {
    cancelSpeech()
  }, [])

  useEffect(() => trackVoices(), [])

  useEffect(() => {
    cancelSpeech()
    setAudioMessage('')
  }, [view, question?.id, practiceStyle, mode, activeGroups])

  // Sinkronkan warna browser dengan tema agar address bar tidak tetap terang.
  useEffect(() => {
    const meta = document.querySelector('meta[name="theme-color"]')
    if (meta) meta.setAttribute('content', theme === 'dark' ? '#252522' : '#f4efe5')
  }, [theme])

  // Pindahkan fokus ke tombol lanjut setiap kali jawaban terisi, sehingga Enter
  // memakai aktivasi native tombol (bukan listener global yang bisa salah sasaran).
  useEffect(() => {
    if (view !== 'quiz' || selected === null) return
    nextButtonRef.current?.focus({ preventScroll: true })
  }, [view, selected])

  useEffect(() => {
    document.documentElement.classList.toggle('theme-dark', theme === 'dark')
  }, [theme])

  useEffect(() => {
    pageTitleRef.current?.focus({ preventScroll: true })
  }, [view])

  useEffect(() => {
    if (view === 'typing-quiz') {
      inputRef.current?.focus({ preventScroll: true })
    }
  }, [view, typingIndex])

  useEffect(() => {
    if (view !== 'quiz' || !question || selected !== null) return
    if (isListening) playButtonRef.current?.focus({ preventScroll: true })
    else if (picksKana) document.querySelector('.choices button')?.focus({ preventScroll: true })
    else inputRef.current?.focus({ preventScroll: true })
  }, [view, question?.id, isListening, picksKana, selected])

  const chooseQuestion = (nextReviewIds = reviewIds, excludeId = null) => {
    setShowMnemonic(true)
    if (pool.length === 0) {
      setQuestion(null)
      setOptions([])
      setSelected(null)
      setAnswerState('idle')
      return
    }
    const reviewPool = pool.filter(
      (card) => nextReviewIds.includes(card.id) && card.id !== excludeId,
    )
    const fallbackSource = pool.filter((card) => card.id !== excludeId)
    const source = fallbackSource.length > 0 ? fallbackSource : pool
    const card = reviewPool.length > 0
      ? shuffle(reviewPool)[0]
      : source[Math.floor(Math.random() * source.length)]
    const direction = practiceStyle === 'listening'
      ? 'audio->kana'
      : mode === 'mixed' && Math.random() < 0.5 ? 'romaji->kana' : 'kana->romaji'
    setQuestion({ ...card, direction })
    setOptions(getOptions(card, pool, direction))
    setSelected(null)
    setAnswerState('idle')
    setTypedAnswer('')
  }

  const startGame = (seed = []) => {
    if (practiceStyle === 'typing') {
      setView('typing-quiz')
      setStreak(0)
      setRoundScore(0)
      setRoundTotal(0)
      setReviewIds([])
      const count = 30
      const newCards = []
      const source = pool.length > 0 ? pool : kanaCards
      for (let i = 0; i < count; i++) {
        newCards.push(source[Math.floor(Math.random() * source.length)])
      }
      setTypingCards(newCards)
      setTypingIndex(0)
      setTypingResults([])
      setTypedAnswer('')
    } else {
      setView('quiz')
      setShowMnemonic(true)
      setStreak(0)
      setRoundScore(0)
      setRoundTotal(0)
      setReviewIds(seed)
      chooseQuestion(seed, null)
    }
  }

  const handleModeChange = (nextMode) => {
    if (nextMode === mode) return
    setMode(nextMode)
    // Buang soal & antrean lama agar label mode tidak mismatch dengan kartu lama.
    setQuestion(null)
    setOptions([])
    setSelected(null)
    setAnswerState('idle')
    setReviewIds([])
  }

  const handlePracticeStyleChange = (nextStyle) => {
    if (nextStyle === practiceStyle) return
    setPracticeStyle(nextStyle)
    setShowMnemonic(true)
    cancelSpeech()
    setQuestion(null)
    setOptions([])
    setSelected(null)
    setAnswerState('idle')
    setReviewIds([])
    setTypedAnswer('')
    setAudioMessage('')
  }

  // Ganti grup aktif: buang soal & antrean agar kartu di luar grup tidak
  // menggantung di review queue (mereka tidak pernah terambil sebagai soal).
  const toggleGroup = (groupId) => {
    setActiveGroups((current) => {
      if (current.includes(groupId)) {
        return current.length > 1 ? current.filter((id) => id !== groupId) : current
      }
      return [...current, groupId]
    })
    setQuestion(null)
    setOptions([])
    setSelected(null)
    setAnswerState('idle')
    setReviewIds([])
  }

  const expectedAnswer = question
    ? question.direction === 'kana->romaji' ? question.romaji : question.kana
    : ''

  const playKana = (text) => {
    const result = speakKana(text, {
      onError: () => setAudioMessage('Audio tidak dapat diputar di browser ini.'),
      onEnd: () => setAudioMessage(''),
    })
    if (result === 'unsupported') setAudioMessage('Audio tidak tersedia di browser ini.')
    else if (result === 'playing-no-japanese-voice') setAudioMessage('Suara Jepang tidak tersedia di perangkat ini.')
    else if (result === 'error') setAudioMessage('Audio tidak dapat diputar di browser ini.')
    else setAudioMessage('')
  }

  // Samakan bentuk jawaban sebelum dibandingkan & disimpan agar jawaban dari
  // input ketik (mis. "KA" atau " ka ") tetap menyorot tombol pilihannya.
  const normalizeAnswer = (value) => value.normalize('NFKC').trim().toLowerCase()

  const finishAnswer = (answer) => {
    if (!question || selected !== null) return
    const isCorrect = normalizeAnswer(answer) === normalizeAnswer(expectedAnswer)
    setSelected(answer)
    setAnswerState(isCorrect ? 'correct' : 'wrong')
    setRoundTotal((total) => total + 1)

    if (isCorrect) {
      setRoundScore((score) => score + 1)
      // Hitung di luar updater agar updater tetap pure (StrictMode memanggil dua kali).
      const nextStreak = streak + 1
      setStreak(nextStreak)
      setBestStreak((best) => Math.max(best, nextStreak))
      setMastery((current) => ({ ...current, [question.id]: Math.min(MASTERY_CAP, (current[question.id] ?? 0) + 1) }))
      setReviewIds((ids) => ids.filter((id) => id !== question.id))
    } else {
      setStreak(0)
      setMastery((current) => ({ ...current, [question.id]: Math.max(0, (current[question.id] ?? 0) - 1) }))
      setReviewIds((ids) => [...new Set([...ids, question.id])])
    }
    setTypedAnswer('')
  }

  const handleTypedSubmit = (event) => {
    event.preventDefault()
    if (typedAnswer.trim()) finishAnswer(typedAnswer)
  }

  const processTypingAnswer = (val) => {
    const ans = normalizeAnswer(val)
    if (!ans) {
      setTypedAnswer('')
      return
    }
    const currentCard = typingCards[typingIndex]
    const expected = normalizeAnswer(currentCard.romaji)
    const isCorrect = ans === expected
    
    const newResults = [...typingResults, { answer: ans, correct: isCorrect }]
    setTypingResults(newResults)
    setTypedAnswer('')
    
    if (isCorrect) {
      setRoundScore((s) => s + 1)
      const nextStreak = streak + 1
      setStreak(nextStreak)
      setBestStreak((best) => Math.max(best, nextStreak))
      setMastery((current) => ({ ...current, [currentCard.id]: Math.min(MASTERY_CAP, (current[currentCard.id] ?? 0) + 1) }))
    } else {
      setStreak(0)
      setMastery((current) => ({ ...current, [currentCard.id]: Math.max(0, (current[currentCard.id] ?? 0) - 1) }))
      setReviewIds((ids) => [...new Set([...ids, currentCard.id])])
    }
    setRoundTotal((t) => t + 1)
    
    if (typingIndex + 1 >= typingCards.length) {
      setView('summary')
    } else {
      setTypingIndex(typingIndex + 1)
    }
  }

  const handleTypingChange = (e) => {
    const val = e.target.value
    if (val.endsWith(' ')) {
      processTypingAnswer(val)
    } else {
      setTypedAnswer(val)
    }
  }

  const handleTypingKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      processTypingAnswer(typedAnswer)
    }
  }

  const nextQuestion = () => chooseQuestion(reviewIds, question?.id)

  const currentMastery = question ? mastery[question.id] : 0
  const accuracy = roundTotal > 0 ? Math.round((roundScore / roundTotal) * 100) : 0
  const missedCards = useMemo(
    () => reviewIds.map((id) => kanaCards.find((card) => card.id === id)).filter(Boolean),
    [reviewIds],
  )

  const questionNumber = roundTotal + (selected === null ? 1 : 0)

  const questionNumberText = String(questionNumber).padStart(2, '0')

  return (
    <main className={`app-shell ${theme === 'dark' ? 'theme-dark' : ''}`}>
      <div className="paper-grain" aria-hidden="true" />
      <header className="topbar">
        <button className="brand" type="button" onClick={() => setView('dashboard')} aria-label="Hirakana beranda">
          <span className="brand-mark" lang="ja" aria-hidden="true">ひ</span>
          <span><strong>hirakana</strong><small>kertas latihan kana</small></span>
        </button>
        <div className="header-tools">
          <button className="theme-toggle" type="button" aria-pressed={theme === 'dark'} onClick={() => setTheme((current) => current === 'dark' ? 'light' : 'dark')} aria-label={theme === 'dark' ? 'Aktifkan mode terang' : 'Aktifkan dark mode'} title={theme === 'dark' ? 'Mode terang' : 'Dark mode'}>
            <span aria-hidden="true">{theme === 'dark' ? '☼' : '☾'}</span>
          </button>
          <div className={`top-note ${storageOk ? '' : 'is-off'}`} role="status"><span className="dot" /> {storageOk ? 'sesi lokal tersimpan' : 'penyimpanan tidak aktif'}</div>
        </div>
      </header>

      {view === 'dashboard' && (
        <section className="dashboard page-enter">
          <div className="intro-copy">
            <p className="eyebrow">studio hafalan / 001</p>
            <h1 ref={pageTitleRef} tabIndex={-1}>Belajar kana,<br /><em>pelan-pelan jadi bisa.</em></h1>
            <p className="intro-text">Sesi kecil, pengulangan cerdas, dan sedikit rasa seperti membuka buku catatan Jepang baru.</p>
            <button className="primary-action" type="button" onClick={() => startGame()}>Mulai latihan <span aria-hidden="true">→</span></button>
            <button className="text-link" type="button" onClick={() => setView('table')}>Lihat tabel lengkap</button>
          </div>

          <aside className="stats-note">
            <div className="tape" />
            <p className="note-label">catatan hari ini</p>
            <div className="stat-big">{totalProgress}<span>%</span></div>
            <p className="stat-caption">dari semua kana sudah mulai menempel</p>
            <div className="progress-line" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={totalProgress} aria-label="Kemajuan belajar"><span style={{ width: `${Math.max(MIN_PROGRESS_WIDTH, totalProgress)}%` }} /></div>
            <div className="stat-row"><span>Karakter dikuasai</span><strong>{masteredCount} / {kanaCards.length}</strong></div>
            <div className="stat-row"><span>Sudah tersentuh</span><strong>{touchedCount} kartu</strong></div>
            <div className="stat-row"><span>Streak terbaik</span><strong>{bestStreak} benar</strong></div>
          </aside>

          <div className="mode-section">
            <div className="section-heading"><span>01</span><div><h2 id="mode-heading">Pilih meja latihan</h2><p>Mulai dari aksara yang ingin kamu kenal hari ini.</p></div></div>
            <div className="mode-grid" role="group" aria-labelledby="mode-heading">
              {modes.map((item) => (
                <button className={`mode-card ${mode === item.id ? 'active' : ''}`} key={item.id} type="button" aria-pressed={mode === item.id} onClick={() => handleModeChange(item.id)}>
                  <span className="mode-check" aria-hidden="true">{mode === item.id ? '✓' : ''}</span>
                  <strong>{item.label}</strong><small>{item.note}</small>
                  <b aria-hidden="true">{item.id === 'mixed' ? 'あ ア' : item.id === 'hiragana' ? 'あ' : 'ア'}</b>
                </button>
              ))}
            </div>
          </div>

          <div className="group-section">
            <div className="section-heading"><span>02</span><div><h2 id="group-heading">Aksara yang dilatih</h2><p>Nyalakan grup huruf yang ingin kamu hafalkan hari ini.</p></div></div>
            <div className="group-grid" role="group" aria-labelledby="group-heading">
              {groups.map((group) => {
                const active = activeGroups.includes(group.id)
                return (
                  <button className={`group-chip ${active ? 'active' : ''}`} key={group.id} type="button" aria-pressed={active} onClick={() => toggleGroup(group.id)}>
                    <span className="group-check" aria-hidden="true">{active ? '✓' : ''}</span>
                    <strong>{group.label}</strong>
                    <small>{group.note}</small>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="style-section">
            <div className="section-heading"><span>03</span><div><h2 id="style-heading">Cara berlatih</h2><p>Standar tetap mengandalkan lihat-tulis, listening melatih telinga.</p></div></div>
            <div className="style-grid" role="group" aria-labelledby="style-heading">
              {practiceStyles.map((item) => (
                <button className={`group-chip ${practiceStyle === item.id ? 'active' : ''}`} key={item.id} type="button" aria-pressed={practiceStyle === item.id} onClick={() => handlePracticeStyleChange(item.id)}>
                  <span className="group-check" aria-hidden="true">{practiceStyle === item.id ? '✓' : ''}</span>
                  <strong>{item.label}</strong><small>{item.note}</small>
                </button>
              ))}
            </div>
          </div>

          <div className="tip-strip"><span className="tip-icon" aria-hidden="true">✦</span><p><strong>Ritme kecil lebih kuat.</strong> Lima menit setiap hari lebih berarti daripada maraton sekali seminggu.</p><span className="tip-kana" lang="ja" aria-hidden="true">毎日</span></div>
        </section>
      )}

      {view === 'quiz' && (
        <section className="quiz-page page-enter">
          <div className="quiz-meta">
            <button className="back-button" type="button" onClick={() => setView(roundTotal > 0 ? 'summary' : 'dashboard')}>← kembali ke meja</button>
            <span>latihan {modes.find((item) => item.id === mode)?.label ?? mode} · {practiceStyle === 'listening' ? 'dengar' : 'standar'}</span>
            <button className="back-button end-session" type="button" onClick={() => setView('summary')}>selesaikan sesi</button>
            <span className="score-pill" aria-label={`Skor ${roundScore} dari ${roundTotal}`}>{roundScore} / {roundTotal}</span>
          </div>
          {question === null ? (
            <div className="empty-quiz">
              <p>Belum ada kartu untuk latihan ini.</p>
              <button className="primary-action" type="button" onClick={() => setView('dashboard')}>kembali ke meja</button>
            </div>
          ) : (
          <div className="quiz-layout">
            <div className="quiz-main">
              <p className="sr-only" aria-live="polite">
                {`Soal ${questionNumber}. ${isListening
                  ? 'Dengarkan audio, lalu pilih aksara yang tepat.'
                  : isMixedDirection
                    ? `Pilih aksara yang tepat untuk bacaan ${question.romaji}.`
                    : `Kana ${question.kana}, ${question.script}.`}`}
              </p>
              <div className="question-header">
                <div>
                  <p className="eyebrow">lembar latihan / {questionNumberText}</p>
                  <h1 ref={pageTitleRef} tabIndex={-1}>{isListening ? 'Dengarkan, lalu jawab.' : isMixedDirection ? `Tulis dalam ${question.script}...` : 'Huruf ini dibaca...'}</h1>
                </div>
                <div className="streak-stamp"><span>STREAK</span><strong>{streak}</strong></div>
              </div>
              <div className={`kana-sheet answer-${answerState}`}>
                <div className="sheet-corner" lang="ja" aria-hidden="true">練習</div>
                {isListening ? (
                  <div className="listen-sheet">
                    <button ref={playButtonRef} className="listen-button listen-button-large" type="button" onClick={() => playKana(question.kana)} disabled={!audioSupported} aria-label="Dengarkan audio kana">🔊 Dengarkan</button>
                    <p className="listen-prompt" aria-hidden="true">Putar audio, lalu pilih aksaranya.</p>
                    {audioMessage && <p className="audio-status" role="status">{audioMessage}</p>}
                  </div>
                ) : (
                  <div className={`kana-character ${isMixedDirection ? 'prompt-romaji' : ''}`} lang={isMixedDirection ? 'en' : 'ja'}>{isMixedDirection ? question.romaji : question.kana}</div>
                )}
                {!isListening && !isMixedDirection && <div className="kana-script">{question.script}</div>}
                {!isListening && (
                  <button className="listen-button listen-button-small" type="button" onClick={() => playKana(question.kana)} disabled={!audioSupported} aria-label="Dengarkan bacaan kana ini">🔊 dengarkan</button>
                )}
                {audioMessage && !isListening && <p className="audio-status" role="status">{audioMessage}</p>}
                <div className="sheet-rule rule-one" /><div className="sheet-rule rule-two" />
              </div>
              <div>
                <p className="answer-label" id="answer-label">{isListening ? 'pilih aksara yang kamu dengar' : picksKana ? 'pilih aksara yang tepat' : 'pilih suara yang tepat'}</p>
                <div className="choices" role="group" aria-labelledby="answer-label">
                  {options.map((option, index) => {
                    const isChosen = selected !== null && normalizeAnswer(selected) === normalizeAnswer(option)
                    const isReveal = answerState === 'wrong' && option === expectedAnswer
                    return (
                      <button
                        key={option}
                        type="button"
                        disabled={selected !== null}
                        className={`choice ${picksKana ? 'choice-kana' : ''} ${isChosen ? 'chosen' : ''} ${isChosen && answerState === 'wrong' ? 'wrong-pick' : ''} ${isChosen && answerState === 'correct' ? 'correct' : ''} ${isReveal ? 'reveal' : ''}`}
                        onClick={() => finishAnswer(option)}
                      >
                        <span aria-hidden="true">{String.fromCharCode(65 + index)}</span>
                        <span lang={picksKana ? 'ja' : 'en'}>{option}</span>
                      </button>
                    )
                  })}
                </div>
                {!picksKana && (
                  <form className="typed-form" onSubmit={handleTypedSubmit}><label htmlFor="romaji-answer">atau tulis romaji</label><div><input id="romaji-answer" name="romaji" ref={inputRef} value={typedAnswer} onChange={(event) => setTypedAnswer(event.target.value)} placeholder="ketik di sini..." disabled={selected !== null} autoComplete="off" autoCapitalize="off" autoCorrect="off" spellCheck={false} inputMode="text" maxLength={12} /><button type="submit" disabled={selected !== null || !typedAnswer.trim()}>cek</button></div></form>
                )}
              </div>
              {selected !== null && (
                <div className={`feedback feedback-${answerState}`} role="status">
                  <span aria-hidden="true">{answerState === 'correct' ? '✓' : '!'}</span>
                  <div>
                    <strong>{answerState === 'correct' ? 'Bagus, masuk satu lagi.' : (<>Belum tepat. Jawabannya <span lang="en">{expectedAnswer}</span>.</>)}</strong>
                    <small>{answerState === 'correct' ? `Streak kamu sekarang ${streak}.` : 'Kita simpan untuk diulang sebentar lagi.'}</small>
                  </div>
                  <button ref={nextButtonRef} type="button" onClick={nextQuestion}>lanjut <span aria-hidden="true">→</span></button>
                </div>
              )}
            </div>
            <aside className="quiz-side">
              <div className="mini-note">
                <p className="note-label">kartu ini</p>
                <div className="mini-kana" lang={isListening ? 'ja' : isMixedDirection ? 'en' : 'ja'}>{isListening ? (selected === null ? '♪' : question.kana) : isMixedDirection ? question.romaji : question.kana}</div>
                <p>{currentMastery === 0 ? 'Belum tersentuh' : `${currentMastery} / ${MASTERY_CAP} tingkat ingatan`}</p>
                <div className="dots" aria-hidden="true">{Array.from({ length: MASTERY_CAP }, (_, i) => i + 1).map((dot) => <i className={dot <= currentMastery ? 'filled' : ''} key={dot} />)}</div>
                <button className="mnemonic-toggle" type="button" onClick={() => setShowMnemonic((current) => !current)}>
                  {showMnemonic ? 'Sembunyikan' : 'Tampilkan'} mnemonik
                </button>
                {showMnemonic && <p className="mnemonic-note"><span>mnemonik</span> {question.mnemonic}</p>}
              </div>
              <div className="session-list">
                <p className="note-label">sesi ini</p>
                <div><span className="session-icon" aria-hidden="true">◎</span><p><strong>{roundScore}</strong><small>jawaban benar</small></p></div>
                <div><span className="session-icon" aria-hidden="true">↗</span><p><strong>{reviewIds.length}</strong><small>perlu diulang</small></p></div>
              </div>
            </aside>
          </div>
          )}
        </section>
      )}

      {view === 'typing-quiz' && (
        <section className="typing-page page-enter">
          <div className="typing-banner">
            <div className="typing-track" style={{ transform: `translateX(calc(50% - ${typingIndex * 64}px - 32px))` }}>
              {typingCards.map((card, i) => {
                const isPast = i < typingIndex
                const isCurrent = i === typingIndex
                const result = isPast ? typingResults[i] : null
                
                return (
                  <div key={`${card.id}-${i}`} className={`typing-char ${isPast ? 'past' : ''} ${isCurrent ? 'current' : ''} ${isPast && result?.correct ? 'correct' : ''} ${isPast && !result?.correct ? 'wrong' : ''}`}>
                    {isPast && (
                      <span className={`typing-romaji ${result?.correct ? 'correct' : 'wrong'}`}>
                        {result?.correct ? card.romaji : card.romaji}
                      </span>
                    )}
                    <span className="typing-kana" lang="ja">
                      {card.kana}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
          <div className="typing-input-area">
            <input 
              ref={inputRef}
              className="typing-input"
              value={typedAnswer}
              onChange={handleTypingChange}
              onKeyDown={handleTypingKeyDown}
              placeholder=" "
              autoComplete="off"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              inputMode="text"
            />
          </div>
          <div className="typing-actions">
            <button className="text-link" type="button" onClick={() => setView('dashboard')}>Pilih kana</button>
            <button className="primary-action" type="button" onClick={() => startGame()}>Mulai ulang</button>
          </div>
        </section>
      )}

      {view === 'summary' && (
        <section className="summary-page page-enter">
          <p className="eyebrow">ringkasan sesi</p>
          <h1 ref={pageTitleRef} tabIndex={-1}>Sesi selesai,<br /><em>sampai jumpa lagi.</em></h1>
          <div className="summary-grid">
            <aside className="stats-note">
              <div className="tape" />
              <p className="note-label">hasil latihan</p>
              <div className="stat-big">{accuracy}<span>%</span></div>
              <p className="stat-caption">{roundTotal > 0 ? `akurasi dari ${roundTotal} soal yang dikerjakan` : 'belum ada soal yang dikerjakan'}</p>
              <div className="progress-line" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={accuracy} aria-label="Kemajuan sesi"><span style={{ width: `${roundTotal > 0 ? Math.max(MIN_PROGRESS_WIDTH, accuracy) : 0}%` }} /></div>
              <div className="stat-row"><span>Jawaban benar</span><strong>{roundScore} / {roundTotal}</strong></div>
              <div className="stat-row"><span>Streak terbaik</span><strong>{bestStreak} benar</strong></div>
              <div className="stat-row"><span>Perlu diulang</span><strong>{reviewIds.length} kartu</strong></div>
            </aside>
            <div className="summary-review">
              <p className="note-label">kartu untuk diulang</p>
              {missedCards.length === 0 ? (
                <p className="summary-empty">{roundTotal > 0 ? 'Tidak ada kartu yang tersisa. Kerja bagus!' : 'Sesi ini belum berisi soal. Coba lagi kapan saja.'}</p>
              ) : (
                <div className="review-kana-grid">
                  {missedCards.map((card) => (
                    <div className="review-kana" key={card.id}>
                      <span className="review-kana-char" lang="ja">{card.kana}</span>
                      <small>{card.romaji} · {card.script}</small>
                    </div>
                  ))}
                </div>
              )}
              <div className="summary-actions">
                <button className="primary-action" type="button" onClick={() => startGame(reviewIds)}>Mulai sesi baru</button>
                <button className="back-button" type="button" onClick={() => setView('dashboard')}>kembali ke meja</button>
              </div>
            </div>
          </div>
        </section>
      )}

      {view === 'table' && (
        <section className="table-page page-enter">
          <div className="quiz-meta">
            <button className="back-button" type="button" onClick={() => setView('dashboard')}>← kembali ke meja</button>
            <button className="back-button end-session" type="button" onClick={() => startGame()}>mulai latihan</button>
            <span className="score-pill" aria-label={`Sudah tersentuh ${touchedCount} kartu`}>{touchedCount} kartu</span>
          </div>
          <h1 ref={pageTitleRef} tabIndex={-1}>Tabel lengkap kana</h1>
          <div className="table-toolbar">
            <p className="intro-text">Hiragana dan katakana berdampingan. Klik sel untuk mendengar bunyinya.</p>
            <button className="mnemonic-toggle table-toggle" type="button" onClick={() => setShowTableMnemonics((current) => !current)}>
              {showTableMnemonics ? 'Sembunyikan' : 'Tampilkan'} mnemonik
            </button>
          </div>
          {audioMessage && <p className="audio-status" role="status">{audioMessage}</p>}
          <div className="table-grid">
            {groups.map((group) => (
              <article className="table-card" key={group.id}>
                <h2>{group.label}</h2>
                <p>{group.note}</p>
                <div className="kana-table-columns">
                  {['hiragana', 'katakana'].map((script) => (
                    <div className="kana-table-script" key={script}>
                      <p className="script-label">{script}</p>
                      <div className="kana-table-grid">
                        {kanaCards.filter((card) => card.script === script && card.group === group.id).map((card) => (
                          <button className="kana-cell" key={card.id} type="button" aria-label={`Dengarkan ${card.kana}, baca ${card.romaji}`} onClick={() => playKana(card.kana)}>
                            <span className="kana-cell-char" lang="ja">{card.kana}</span>
                            <small className="kana-cell-romaji" lang="en">{card.romaji}</small>
                            {showTableMnemonics && <small className="kana-cell-mnemonic">{card.mnemonic}</small>}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      <footer className="footer"><span>hirakana / ひらかな</span><span>dibuat untuk belajar dengan ringan</span></footer>
    </main>
  )
}

export default App
