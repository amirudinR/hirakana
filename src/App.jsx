import { useEffect, useMemo, useRef, useState } from 'react'
import { groups, kanaCards } from './data/kana'

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
        result[id] = Math.max(0, Math.min(MASTERY_CAP, Math.round(value)))
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
    return localStorage.getItem(THEME_KEY) === 'dark' ? 'dark' : 'light'
  } catch {
    return 'light'
  }
}

function readBestStreak() {
  try {
    const saved = Number.parseInt(localStorage.getItem(BEST_STREAK_KEY), 10)
    return Number.isFinite(saved) && saved >= 0 ? saved : 0
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
  if (direction === 'romaji->kana') {
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
  const [view, setView] = useState('dashboard') // 'dashboard' | 'quiz' | 'summary'
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
  const inputRef = useRef(null)
  const nextButtonRef = useRef(null)

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
  }, [mastery])

  useEffect(() => {
    if (!safeSet(THEME_KEY, theme)) setStorageOk(false)
  }, [theme])

  useEffect(() => {
    if (!safeSet(BEST_STREAK_KEY, String(bestStreak))) setStorageOk(false)
  }, [bestStreak])

  useEffect(() => {
    if (!safeSet(GROUPS_KEY, JSON.stringify(activeGroups))) setStorageOk(false)
  }, [activeGroups])

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

  const chooseQuestion = (nextReviewIds = reviewIds, excludeId = null) => {
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
    const direction = mode === 'mixed' && Math.random() < 0.5 ? 'romaji->kana' : 'kana->romaji'
    setQuestion({ ...card, direction })
    setOptions(getOptions(card, pool, direction))
    setSelected(null)
    setAnswerState('idle')
    setTypedAnswer('')
  }

  const startGame = (seed = []) => {
    setView('quiz')
    setStreak(0)
    setRoundScore(0)
    setRoundTotal(0)
    setReviewIds(seed)
    chooseQuestion(seed, null)
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
    ? question.direction === 'romaji->kana' ? question.kana : question.romaji
    : ''

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

  const nextQuestion = () => chooseQuestion(reviewIds, question?.id)

  const currentMastery = question ? mastery[question.id] : 0
  const accuracy = roundTotal > 0 ? Math.round((roundScore / roundTotal) * 100) : 0
  const missedCards = useMemo(
    () => reviewIds.map((id) => kanaCards.find((card) => card.id === id)).filter(Boolean),
    [reviewIds],
  )

  const isMixedDirection = question?.direction === 'romaji->kana'

  return (
    <main className={`app-shell ${theme === 'dark' ? 'theme-dark' : ''}`}>
      <div className="paper-grain" aria-hidden="true" />
      <header className="topbar">
        <button className="brand" type="button" onClick={() => setView('dashboard')} aria-label="Hirakana beranda">
          <span className="brand-mark" lang="ja" aria-hidden="true">ひ</span>
          <span><strong>hirakana</strong><small>kertas latihan kana</small></span>
        </button>
        <div className="header-tools">
          <button className="theme-toggle" onClick={() => setTheme((current) => current === 'dark' ? 'light' : 'dark')} aria-label={theme === 'dark' ? 'Aktifkan mode terang' : 'Aktifkan dark mode'} title={theme === 'dark' ? 'Mode terang' : 'Dark mode'}>
            <span aria-hidden="true">{theme === 'dark' ? '☼' : '☾'}</span>
          </button>
          <div className={`top-note ${storageOk ? '' : 'is-off'}`} role="status"><span className="dot" /> {storageOk ? 'sesi lokal tersimpan' : 'penyimpanan tidak aktif'}</div>
        </div>
      </header>

      {view === 'dashboard' && (
        <section className="dashboard page-enter">
          <div className="intro-copy">
            <p className="eyebrow">studio hafalan / 001</p>
            <h1>Belajar kana,<br /><em>pelan-pelan jadi bisa.</em></h1>
            <p className="intro-text">Sesi kecil, pengulangan cerdas, dan sedikit rasa seperti membuka buku catatan Jepang baru.</p>
            <button className="primary-action" onClick={() => startGame()}>Mulai latihan <span>→</span></button>
          </div>

          <aside className="stats-note">
            <div className="tape" />
            <p className="note-label">catatan hari ini</p>
            <div className="stat-big">{totalProgress}<span>%</span></div>
            <p className="stat-caption">dari semua kana sudah mulai menempel</p>
            <div className="progress-line"><span style={{ width: `${Math.max(MIN_PROGRESS_WIDTH, totalProgress)}%` }} /></div>
            <div className="stat-row"><span>Karakter dikuasai</span><strong>{masteredCount} / {kanaCards.length}</strong></div>
            <div className="stat-row"><span>Sudah tersentuh</span><strong>{touchedCount} kartu</strong></div>
            <div className="stat-row"><span>Streak terbaik</span><strong>{bestStreak} benar</strong></div>
          </aside>

          <div className="mode-section">
            <div className="section-heading"><span>01</span><div><h2>Pilih meja latihan</h2><p>Mulai dari aksara yang ingin kamu kenal hari ini.</p></div></div>
            <div className="mode-grid">
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
            <div className="section-heading"><span>02</span><div><h2>Aksara yang dilatih</h2><p>Nyalakan grup huruf yang ingin kamu hafalkan hari ini.</p></div></div>
            <div className="group-grid">
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

          <div className="tip-strip"><span className="tip-icon">✦</span><p><strong>Ritme kecil lebih kuat.</strong> Lima menit setiap hari lebih berarti daripada maraton sekali seminggu.</p><span className="tip-kana">毎日</span></div>
        </section>
      )}

      {view === 'quiz' && (
        <section className="quiz-page page-enter">
          <div className="quiz-meta">
            <button className="back-button" onClick={() => setView(roundTotal > 0 ? 'summary' : 'dashboard')}>← kembali ke meja</button>
            <span>latihan {modes.find((item) => item.id === mode)?.label ?? mode}</span>
            <button className="back-button end-session" onClick={() => setView('summary')}>selesaikan sesi</button>
            <span className="score-pill">{roundScore} / {roundTotal}</span>
          </div>
          {question === null ? (
            <div className="empty-quiz">
              <p>Belum ada kartu untuk latihan ini.</p>
              <button className="primary-action" onClick={() => setView('dashboard')}>kembali ke meja</button>
            </div>
          ) : (
          <div className="quiz-layout">
            <div className="quiz-main">
              <p className="sr-only" aria-live="polite">
                {`Soal ${roundTotal + 1}. ${isMixedDirection
                  ? `Tulis kana untuk bacaan ${question.romaji}.`
                  : `Kana ${question.kana}, ${question.script}.`}`}
              </p>
              <div className="question-header">
                <div>
                  <p className="eyebrow">lembar latihan / {String(roundTotal + 1).padStart(2, '0')}</p>
                  <h1>{isMixedDirection ? `Tulis dalam ${question.script}...` : 'Huruf ini dibaca...'}</h1>
                </div>
                <div className="streak-stamp"><span>STREAK</span><strong>{streak}</strong></div>
              </div>
              <div className={`kana-sheet answer-${answerState}`}>
                <div className="sheet-corner" lang="ja" aria-hidden="true">練習</div>
                <div className={`kana-character ${isMixedDirection ? 'prompt-romaji' : ''}`} lang={isMixedDirection ? 'en' : 'ja'}>{isMixedDirection ? question.romaji : question.kana}</div>
                {!isMixedDirection && <div className="kana-script">{question.script}</div>}
                <div className="sheet-rule rule-one" /><div className="sheet-rule rule-two" />
              </div>
              <div className="answer-area">
                <p className="answer-label">{isMixedDirection ? 'pilih aksara yang tepat' : 'pilih suara yang tepat'}</p>
                <div className="choices">
                  {options.map((option, index) => {
                    const isChosen = selected === option
                    const isReveal = answerState === 'wrong' && option === expectedAnswer
                    return (
                      <button
                        key={option}
                        type="button"
                        disabled={selected !== null}
                        className={`choice ${isMixedDirection ? 'choice-kana' : ''} ${isChosen ? 'chosen' : ''} ${isChosen && answerState === 'wrong' ? 'wrong-pick' : ''} ${isReveal ? 'reveal' : ''}`}
                        onClick={() => finishAnswer(option)}
                      >
                        <span aria-hidden="true">{String.fromCharCode(65 + index)}</span>
                        <span lang={isMixedDirection ? 'ja' : 'en'}>{option}</span>
                      </button>
                    )
                  })}
                </div>
                {!isMixedDirection && (
                  <form className="typed-form" onSubmit={handleTypedSubmit}><label htmlFor="romaji-answer">atau tulis romaji</label><div><input id="romaji-answer" ref={inputRef} value={typedAnswer} onChange={(event) => setTypedAnswer(event.target.value)} placeholder="ketik di sini..." disabled={selected !== null} autoComplete="off" autoCapitalize="off" autoCorrect="off" spellCheck={false} inputMode="text" maxLength={12} /><button type="submit" disabled={selected !== null || !typedAnswer.trim()}>cek</button></div></form>
                )}
              </div>
              {selected !== null && (
                <div className={`feedback feedback-${answerState}`} role="status">
                  <span>{answerState === 'correct' ? '✓' : '!'}</span>
                  <div>
                    <strong>{answerState === 'correct' ? 'Bagus, masuk satu lagi.' : `Belum tepat. Jawabannya ${expectedAnswer}.`}</strong>
                    <small>{answerState === 'correct' ? `Streak kamu sekarang ${streak}.` : 'Kita simpan untuk diulang sebentar lagi.'}</small>
                  </div>
                  <button ref={nextButtonRef} onClick={nextQuestion}>lanjut →</button>
                </div>
              )}
            </div>
            <aside className="quiz-side">
              <div className="mini-note">
                <p className="note-label">kartu ini</p>
                <div className="mini-kana" lang={isMixedDirection ? 'en' : 'ja'}>{isMixedDirection ? question.romaji : question.kana}</div>
                <p>{currentMastery === 0 ? 'Belum tersentuh' : `${currentMastery} / ${MASTERY_CAP} tingkat ingatan`}</p>
                <div className="dots">{Array.from({ length: MASTERY_CAP }, (_, i) => i + 1).map((dot) => <i className={dot <= currentMastery ? 'filled' : ''} key={dot} />)}</div>
              </div>
              <div className="session-list">
                <p className="note-label">sesi ini</p>
                <div><span className="session-icon">◎</span><p><strong>{roundScore}</strong><small>jawaban benar</small></p></div>
                <div><span className="session-icon">↗</span><p><strong>{reviewIds.length}</strong><small>perlu diulang</small></p></div>
              </div>
            </aside>
          </div>
          )}
        </section>
      )}

      {view === 'summary' && (
        <section className="summary-page page-enter">
          <p className="eyebrow">ringkasan sesi</p>
          <h1>Sesi selesai,<br /><em>sampai jumpa lagi.</em></h1>
          <div className="summary-grid">
            <aside className="stats-note">
              <div className="tape" />
              <p className="note-label">hasil latihan</p>
              <div className="stat-big">{accuracy}<span>%</span></div>
              <p className="stat-caption">{roundTotal > 0 ? `akurasi dari ${roundTotal} soal yang dikerjakan` : 'belum ada soal yang dikerjakan'}</p>
              <div className="progress-line"><span style={{ width: `${roundTotal > 0 ? Math.max(MIN_PROGRESS_WIDTH, accuracy) : 0}%` }} /></div>
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
                <button className="primary-action" onClick={() => startGame(reviewIds)}>Mulai sesi baru</button>
                <button className="back-button" onClick={() => setView('dashboard')}>kembali ke meja</button>
              </div>
            </div>
          </div>
        </section>
      )}

      <footer className="footer"><span>hirakana / ひらかな</span><span>dibuat untuk belajar dengan ringan</span></footer>
    </main>
  )
}

export default App
