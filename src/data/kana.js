const hiragana = [
  ['あ', 'a'], ['い', 'i'], ['う', 'u'], ['え', 'e'], ['お', 'o'],
  ['か', 'ka'], ['き', 'ki'], ['く', 'ku'], ['け', 'ke'], ['こ', 'ko'],
  ['さ', 'sa'], ['し', 'shi'], ['す', 'su'], ['せ', 'se'], ['そ', 'so'],
  ['た', 'ta'], ['ち', 'chi'], ['つ', 'tsu'], ['て', 'te'], ['と', 'to'],
  ['な', 'na'], ['に', 'ni'], ['ぬ', 'nu'], ['ね', 'ne'], ['の', 'no'],
  ['は', 'ha'], ['ひ', 'hi'], ['ふ', 'fu'], ['へ', 'he'], ['ほ', 'ho'],
  ['ま', 'ma'], ['み', 'mi'], ['む', 'mu'], ['め', 'me'], ['も', 'mo'],
  ['や', 'ya'], ['ゆ', 'yu'], ['よ', 'yo'], ['ら', 'ra'], ['り', 'ri'],
  ['る', 'ru'], ['れ', 're'], ['ろ', 'ro'], ['わ', 'wa'], ['を', 'wo'], ['ん', 'n'],
]

const katakana = [
  ['ア', 'a'], ['イ', 'i'], ['ウ', 'u'], ['エ', 'e'], ['オ', 'o'],
  ['カ', 'ka'], ['キ', 'ki'], ['ク', 'ku'], ['ケ', 'ke'], ['コ', 'ko'],
  ['サ', 'sa'], ['シ', 'shi'], ['ス', 'su'], ['セ', 'se'], ['ソ', 'so'],
  ['タ', 'ta'], ['チ', 'chi'], ['ツ', 'tsu'], ['テ', 'te'], ['ト', 'to'],
  ['ナ', 'na'], ['ニ', 'ni'], ['ヌ', 'nu'], ['ネ', 'ne'], ['ノ', 'no'],
  ['ハ', 'ha'], ['ヒ', 'hi'], ['フ', 'fu'], ['ヘ', 'he'], ['ホ', 'ho'],
  ['マ', 'ma'], ['ミ', 'mi'], ['ム', 'mu'], ['メ', 'me'], ['モ', 'mo'],
  ['ヤ', 'ya'], ['ユ', 'yu'], ['ヨ', 'yo'], ['ラ', 'ra'], ['リ', 'ri'],
  ['ル', 'ru'], ['レ', 're'], ['ロ', 'ro'], ['ワ', 'wa'], ['ヲ', 'wo'], ['ン', 'n'],
]

const dakutenHiragana = [
  ['が', 'ga'], ['ぎ', 'gi'], ['ぐ', 'gu'], ['げ', 'ge'], ['ご', 'go'],
  ['ざ', 'za'], ['じ', 'ji'], ['ず', 'zu'], ['ぜ', 'ze'], ['ぞ', 'zo'],
  ['だ', 'da'], ['ぢ', 'ji'], ['づ', 'zu'], ['で', 'de'], ['ど', 'do'],
  ['ば', 'ba'], ['び', 'bi'], ['ぶ', 'bu'], ['べ', 'be'], ['ぼ', 'bo'],
]

const dakutenKatakana = [
  ['ガ', 'ga'], ['ギ', 'gi'], ['グ', 'gu'], ['ゲ', 'ge'], ['ゴ', 'go'],
  ['ザ', 'za'], ['ジ', 'ji'], ['ズ', 'zu'], ['ゼ', 'ze'], ['ゾ', 'zo'],
  ['ダ', 'da'], ['ヂ', 'ji'], ['ヅ', 'zu'], ['デ', 'de'], ['ド', 'do'],
  ['バ', 'ba'], ['ビ', 'bi'], ['ブ', 'bu'], ['ベ', 'be'], ['ボ', 'bo'],
]

const handakutenHiragana = [
  ['ぱ', 'pa'], ['ぴ', 'pi'], ['ぷ', 'pu'], ['ぺ', 'pe'], ['ぽ', 'po'],
]

const handakutenKatakana = [
  ['パ', 'pa'], ['ピ', 'pi'], ['プ', 'pu'], ['ペ', 'pe'], ['ポ', 'po'],
]

const yoonHiragana = [
  ['きゃ', 'kya'], ['きゅ', 'kyu'], ['きょ', 'kyo'], ['しゃ', 'sha'], ['しゅ', 'shu'], ['しょ', 'sho'],
  ['ちゃ', 'cha'], ['ちゅ', 'chu'], ['ちょ', 'cho'], ['にゃ', 'nya'], ['にゅ', 'nyu'], ['にょ', 'nyo'],
  ['ひゃ', 'hya'], ['ひゅ', 'hyu'], ['ひょ', 'hyo'], ['みゃ', 'mya'], ['みゅ', 'myu'], ['みょ', 'myo'],
  ['りゃ', 'rya'], ['りゅ', 'ryu'], ['りょ', 'ryo'], ['ぎゃ', 'gya'], ['ぎゅ', 'gyu'], ['ぎょ', 'gyo'],
  ['じゃ', 'ja'], ['じゅ', 'ju'], ['じょ', 'jo'], ['びゃ', 'bya'], ['びゅ', 'byu'], ['びょ', 'byo'],
  ['ぴゃ', 'pya'], ['ぴゅ', 'pyu'], ['ぴょ', 'pyo'],
]

const yoonKatakana = [
  ['キャ', 'kya'], ['キュ', 'kyu'], ['キョ', 'kyo'], ['シャ', 'sha'], ['シュ', 'shu'], ['ショ', 'sho'],
  ['チャ', 'cha'], ['チュ', 'chu'], ['チョ', 'cho'], ['ニャ', 'nya'], ['ニュ', 'nyu'], ['ニョ', 'nyo'],
  ['ヒャ', 'hya'], ['ヒュ', 'hyu'], ['ヒョ', 'hyo'], ['ミャ', 'mya'], ['ミュ', 'myu'], ['ミョ', 'myo'],
  ['リャ', 'rya'], ['リュ', 'ryu'], ['リョ', 'ryo'], ['ギャ', 'gya'], ['ギュ', 'gyu'], ['ギョ', 'gyo'],
  ['ジャ', 'ja'], ['ジュ', 'ju'], ['ジョ', 'jo'], ['ビャ', 'bya'], ['ビュ', 'byu'], ['ビョ', 'byo'],
  ['ピャ', 'pya'], ['ピュ', 'pyu'], ['ピョ', 'pyo'],
]

const mnemonicExamples = {
  a: 'kata "apa"',
  i: 'kata "ikan"',
  u: 'kata "ulang"',
  e: 'kata "enak"',
  o: 'kata "orang"',
  ka: 'kata "kaki"',
  ki: 'kata "kiri"',
  ku: 'kata "kuda"',
  ke: 'kata "kereta"',
  ko: 'kata "kota"',
  sa: 'kata "sapu"',
  shi: 'kata "shio"',
  su: 'kata "susu"',
  se: 'kata "sendok"',
  so: 'kata "sore"',
  ta: 'kata "tari"',
  chi: 'kata "cicak"',
  tsu: 'kata "tsunami"',
  te: 'kata "teh"',
  to: 'kata "toko"',
  na: 'kata "nanas"',
  ni: 'kata "nina"',
  nu: 'kata "nusa"',
  ne: 'kata "neko"',
  no: 'kata "nomor"',
  ha: 'kata "hari"',
  hi: 'kata "hijau"',
  fu: 'kata "fufu"',
  he: 'kata "helikopter"',
  ho: 'kata "hotel"',
  ma: 'kata "makan"',
  mi: 'kata "mimpi"',
  mu: 'kata "muka"',
  me: 'kata "meja"',
  mo: 'kata "moto"',
  ya: 'kata "yaya"',
  yu: 'kata "yuk"',
  yo: 'kata "yoga"',
  ra: 'kata "rambut"',
  ri: 'kata "rindu"',
  ru: 'kata "rumah"',
  re: 'kata "rebus"',
  ro: 'kata "roti"',
  wa: 'kata "wajah"',
  wo: 'kata "wore"',
  n: 'kata "nadi"',
  ga: 'kata "gadis"',
  gi: 'kata "gigi"',
  gu: 'kata "gula"',
  ge: 'kata "gelas"',
  go: 'kata "gobang"',
  za: 'kata "zaman"',
  ji: 'kata "jijik"',
  zu: 'kata "zurai"',
  ze: 'kata "zebra"',
  zo: 'kata "zoo"',
  da: 'kata "dada"',
  de: 'kata "dekor"',
  do: 'kata "domba"',
  ba: 'kata "baju"',
  bi: 'kata "bibi"',
  bu: 'kata "buku"',
  be: 'kata "bentuk"',
  bo: 'kata "bola"',
  pa: 'kata "padi"',
  pi: 'kata "pintu"',
  pu: 'kata "pupuk"',
  pe: 'kata "pena"',
  po: 'kata "pohon"',
  kya: 'kata "kyy"',
  kyu: 'kata "kyu"',
  kyo: 'kata "kyon"',
  sha: 'kata "sha"',
  shu: 'kata "shu"',
  sho: 'kata "sho"',
  cha: 'kata "cha"',
  chu: 'kata "chu"',
  cho: 'kata "cho"',
  nya: 'kata "nya"',
  nyu: 'kata "nyu"',
  nyo: 'kata "nyo"',
  hya: 'kata "hya"',
  hyu: 'kata "hyu"',
  hyo: 'kata "hyo"',
  mya: 'kata "mya"',
  myu: 'kata "myu"',
  myo: 'kata "myo"',
  rya: 'kata "rya"',
  ryu: 'kata "ryu"',
  ryo: 'kata "ryo"',
  gya: 'kata "gya"',
  gyu: 'kata "gyu"',
  gyo: 'kata "gyo"',
  ja: 'kata "jajan"',
  ju: 'kata "juru"',
  jo: 'kata "joki"',
  bya: 'kata "bya"',
  byu: 'kata "byu"',
  byo: 'kata "byo"',
  pya: 'kata "pya"',
  pyu: 'kata "pyu"',
  pyo: 'kata "pyo"',
}

function buildMnemonic(kana, romaji) {
  const key = romaji.toLowerCase()
  const sample = mnemonicExamples[key]
  if (sample) return `Ingat ${kana} seperti bunyi ${romaji} di ${sample}.`
  return `Ingat ${kana} sebagai bunyi ${romaji}, seperti suku kata baru yang gampang diingat.`
}

export const groups = [
  { id: 'seion', label: 'Seion', note: 'dasar · あいうえお' },
  { id: 'dakuten', label: 'Tenten', note: 'dakuten · がぎぐげご' },
  { id: 'handakuten', label: 'Maru', note: 'handakuten · ぱぴぷぺぽ' },
  { id: 'yoon', label: 'Yoon', note: 'kombinasi · きゃきゅきょ' },
]

// Bangun kartu. Seion mempertahankan id lama `${script}-${index}` agar progres
// di localStorage (hirakana-mastery-v1) dari versi sebelumnya tetap terpetakan.
const toCards = (items, script, group) => items.map(([kana, romaji], index) => ({
  id: group === 'seion' ? `${script}-${index}` : `${script}-${group}-${index}`,
  kana,
  romaji,
  script,
  group,
  mnemonic: buildMnemonic(kana, romaji),
}))

export const kanaCards = [
  ...toCards(hiragana, 'hiragana', 'seion'),
  ...toCards(katakana, 'katakana', 'seion'),
  ...toCards(dakutenHiragana, 'hiragana', 'dakuten'),
  ...toCards(dakutenKatakana, 'katakana', 'dakuten'),
  ...toCards(handakutenHiragana, 'hiragana', 'handakuten'),
  ...toCards(handakutenKatakana, 'katakana', 'handakuten'),
  ...toCards(yoonHiragana, 'hiragana', 'yoon'),
  ...toCards(yoonKatakana, 'katakana', 'yoon'),
]
