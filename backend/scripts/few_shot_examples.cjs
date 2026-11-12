const CITATION_BANK = {
  SLEEP_MEDIATION_DEFICIT: [
    "Menurut Mu et al. (2024) dan Wang et al. (2025), kualitas tidur memediasi manfaat aktivitas fisik terhadap pemulihan stres mahasiswa.",
    "Mu et al. (2024) dan Wang et al. (2025) mengaitkan kualitas tidur yang lebih baik dengan pemulihan stres yang didukung aktivitas fisik.",
    "Penelitian Mu et al. (2024) menunjukkan pemulihan kualitas tidur memperkuat efek gerak aktif dalam meredakan ketegangan akademik.",
  ],
  SEDENTARY_OVERLOAD: [
    "Barbosa et al. (2024) dan Su et al. (2022) menunjukkan bahwa jeda gerak dapat membantu mengurangi dampak waktu duduk panjang pada suasana hati.",
    "Su et al. (2022) dan Barbosa et al. (2024) membahas manfaat mengganti sebagian waktu duduk dengan gerak ringan.",
    "Menurut Su et al. (2022), substitusi duduk statis dengan gerak ringan secara berkala membantu menjaga ketahanan stres harian.",
  ],
  LOW_MVPA_VOLUME: [
    "Zhang et al. (2024) dan Ai et al. (2021) mengaitkan aktivitas fisik yang konsisten dengan dukungan bagi kesehatan mental mahasiswa.",
    "Ai et al. (2021) dan Zhang et al. (2024) menyoroti peran kebiasaan bergerak dalam menjaga kesejahteraan mahasiswa.",
    "Pedoman 24-Hour Movement dalam Zhang et al. (2024) menegaskan aktivitas fisik harian bertahap membantu menjaga ketahanan mental.",
  ],
  EXAM_ACUTE_STRESS: [
    "Wu & Zhou (2024) membahas manfaat aktivitas ringan hingga sedang untuk membantu meredakan ketegangan akademik.",
    "Penelitian Wu & Zhou (2024) menunjukkan sesi relaksasi dan aerobik singkat membantu menurunkan respons stres akademik akut.",
  ],
  OPTIMAL_BALANCE: [
    "Keseimbangan gerak dan tidur mendukung ketahanan stres sesuai kerangka Martín-Rodríguez & González-Prieto (2026).",
    "Martín-Rodríguez & González-Prieto (2026) menyoroti sinergi gerak aktif, jeda duduk, dan tidur cukup bagi kesejahteraan mahasiswa.",
  ],
  OUT_OF_SCOPE: ["Di luar cakupan layanan CampusFlow Coach."],
};

const OUT_OF_SCOPE_TEMPLATE = {
  dominantMediator: "OPTIMAL_BALANCE",
  diagnosisSummary: "Pertanyaan ini di luar cakupan CampusFlow Coach.",
  isotemporalActionPlan: "Tidak ada rencana aksi karena input berada di luar cakupan CampusFlow Coach.",
  recommendedMetsToday: 50,
  scientificCitationNote: CITATION_BANK.OUT_OF_SCOPE[0],
};

// Catatan: Contoh out_of_scope dipisah ke OUT_OF_SCOPE_TEMPLATE agar tidak pernah bocor ke data wellbeing valid.
const FEW_SHOT_EXAMPLES = [
  {
    name: "sleep_mediation_deficit",
    input: {
      activeDirectives: [],
      clinicalRuleEvaluation: { dominantMediator: "SLEEP_MEDIATION_DEFICIT", flags: ["SLEEP_MEDIATION_DEFICIT"], escalationFlag: false, missingDailyCheckIn: false },
      allowedRanges: { durationMinutesRange: [15, 30], metsRange: [180, 260] },
      skipAdaptation: { applied: false, consecutiveSkips: 0, previousRecommendedMets: null },
      today: { totalSedentaryHours: 7, totalMvpaMinutes: 35, mvpaPerSedentaryRatio: 5.0, sleepHours: 5, sleepQualityScore: 1, pss4TotalScore: 9, triadPillarsMet: 1 },
      userNotes: null,
    },
    output: {
      dominantMediator: "SLEEP_MEDIATION_DEFICIT",
      diagnosisSummary: "Tidurmu sekitar 5 jam dan terasa kurang nyenyak; wajar kalau energi terasa lebih rendah hari ini.",
      isotemporalActionPlan: "Coba jalan santai selama 20 menit sore ini di sekitar kos, lalu beri dirimu waktu tenang sebelum tidur.",
      recommendedMetsToday: 215,
      scientificCitationNote: CITATION_BANK.SLEEP_MEDIATION_DEFICIT[0],
    },
  },
  {
    name: "sedentary_overload",
    input: {
      activeDirectives: [],
      clinicalRuleEvaluation: { dominantMediator: "SEDENTARY_OVERLOAD", flags: ["SEDENTARY_OVERLOAD"], escalationFlag: false, missingDailyCheckIn: false },
      allowedRanges: { durationMinutesRange: [10, 20], metsRange: [170, 240] },
      skipAdaptation: { applied: false, consecutiveSkips: 0, previousRecommendedMets: null },
      today: { totalSedentaryHours: 10, totalMvpaMinutes: 40, mvpaPerSedentaryRatio: 4.0, sleepHours: 7, sleepQualityScore: 4, pss4TotalScore: 5, triadPillarsMet: 2 },
      userNotes: null,
    },
    output: {
      dominantMediator: "SEDENTARY_OVERLOAD",
      diagnosisSummary: "Kamu sudah duduk cukup lama sekitar 10 jam hari ini, jadi tubuh mungkin terasa kaku setelah kuliah dan mengerjakan tugas.",
      isotemporalActionPlan: "Berdiri lalu jalan santai selama 15 menit sekarang di koridor atau sekitar kampus untuk menyelingi waktu duduk.",
      recommendedMetsToday: 205,
      scientificCitationNote: CITATION_BANK.SEDENTARY_OVERLOAD[0],
    },
  },
  {
    name: "low_mvpa_volume",
    input: {
      activeDirectives: [],
      clinicalRuleEvaluation: { dominantMediator: "LOW_MVPA_VOLUME", flags: ["LOW_MVPA_VOLUME"], escalationFlag: false, missingDailyCheckIn: false },
      allowedRanges: { durationMinutesRange: [15, 25], metsRange: [160, 220] },
      skipAdaptation: { applied: false, consecutiveSkips: 0, previousRecommendedMets: null },
      today: { totalSedentaryHours: 5, totalMvpaMinutes: 10, mvpaPerSedentaryRatio: 2.0, sleepHours: 7.5, sleepQualityScore: 4, pss4TotalScore: 4, triadPillarsMet: 2 },
      userNotes: null,
    },
    output: {
      dominantMediator: "LOW_MVPA_VOLUME",
      diagnosisSummary: "Gerak aktifmu baru sekitar 10 menit hari ini. Menambah sedikit gerak dengan santai bisa jadi langkah yang realistis.",
      isotemporalActionPlan: "Coba jalan santai selama 20 menit sore ini ke kantin atau mengitari area kos, tanpa perlu terburu-buru.",
      recommendedMetsToday: 190,
      scientificCitationNote: CITATION_BANK.LOW_MVPA_VOLUME[0],
    },
  },
  {
    name: "exam_acute_stress",
    input: {
      activeDirectives: [],
      clinicalRuleEvaluation: { dominantMediator: "EXAM_ACUTE_STRESS", flags: ["EXAM_ACUTE_STRESS"], escalationFlag: false, missingDailyCheckIn: false },
      allowedRanges: { durationMinutesRange: [10, 20], metsRange: [150, 200] },
      skipAdaptation: { applied: false, consecutiveSkips: 0, previousRecommendedMets: null },
      today: { totalSedentaryHours: 5, totalMvpaMinutes: 35, mvpaPerSedentaryRatio: 7.0, sleepHours: 7.2, sleepQualityScore: 4, pss4TotalScore: 8, triadPillarsMet: 3 },
      userNotes: null,
    },
    output: {
      dominantMediator: "EXAM_ACUTE_STRESS",
      diagnosisSummary: "Pola gerak dan tidurmu cukup terjaga, tetapi tekanan kuliah atau ujian hari ini membuat pikiran terasa lebih penuh.",
      isotemporalActionPlan: "Ambil jeda dengan berjalan ringan selama 15 menit sekarang di sekitar kampus sebelum kembali belajar.",
      recommendedMetsToday: 175,
      scientificCitationNote: CITATION_BANK.EXAM_ACUTE_STRESS[0],
    },
  },
  {
    name: "optimal_balance",
    input: {
      activeDirectives: [],
      clinicalRuleEvaluation: { dominantMediator: "OPTIMAL_BALANCE", flags: [], escalationFlag: false, missingDailyCheckIn: false },
      allowedRanges: { durationMinutesRange: [10, 20], metsRange: [200, 260] },
      skipAdaptation: { applied: false, consecutiveSkips: 0, previousRecommendedMets: null },
      today: { totalSedentaryHours: 5, totalMvpaMinutes: 45, mvpaPerSedentaryRatio: 9.0, sleepHours: 7.5, sleepQualityScore: 4, pss4TotalScore: 3, triadPillarsMet: 3 },
      userNotes: null,
    },
    output: {
      dominantMediator: "OPTIMAL_BALANCE",
      diagnosisSummary: "Ritme tidur, gerak, dan istirahatmu hari ini tampak terjaga dengan baik. Pertahankan kebiasaan yang terasa nyaman buatmu.",
      isotemporalActionPlan: "Lakukan peregangan santai selama 15 menit sebelum tidur malam ini sebagai penutup hari yang ringan.",
      recommendedMetsToday: 230,
      scientificCitationNote: CITATION_BANK.OPTIMAL_BALANCE[0],
    },
  },
  {
    name: "escalation",
    input: {
      activeDirectives: ["ESKALASI_AKTIF: WAJIB tulis kalimat penutup konselor kampus; aksi hanya relaksasi ringan."],
      clinicalRuleEvaluation: { dominantMediator: "SLEEP_MEDIATION_DEFICIT", flags: ["SLEEP_MEDIATION_DEFICIT"], escalationFlag: true, missingDailyCheckIn: false },
      allowedRanges: { durationMinutesRange: [5, 15], metsRange: [80, 160] },
      skipAdaptation: { applied: false, consecutiveSkips: 0, previousRecommendedMets: null },
      today: { totalSedentaryHours: 8, totalMvpaMinutes: 20, mvpaPerSedentaryRatio: 2.5, sleepHours: 4.5, sleepQualityScore: 1, pss4TotalScore: 12, triadPillarsMet: 1 },
      userNotes: null,
    },
    output: {
      dominantMediator: "SLEEP_MEDIATION_DEFICIT",
      diagnosisSummary: "Sepertinya beban yang kamu rasakan cukup berat dan tidurmu ikut terganggu. Kalau terasa terus menumpuk, nggak apa-apa cerita ke konselor kampus.",
      isotemporalActionPlan: "Duduk dengan nyaman dan lakukan napas perlahan selama 8 menit sekarang untuk memberi tubuh jeda.",
      recommendedMetsToday: 105,
      scientificCitationNote: CITATION_BANK.SLEEP_MEDIATION_DEFICIT[1],
    },
  },
  {
    name: "missing_daily_check_in",
    input: {
      activeDirectives: ["BELUM_CHECKIN_HARIAN: WAJIB ajak mengisi 'check-in harian' di diagnosisSummary; dilarang mengarang skor stres atau tidur."],
      clinicalRuleEvaluation: { dominantMediator: "LOW_MVPA_VOLUME", flags: ["LOW_MVPA_VOLUME"], escalationFlag: false, missingDailyCheckIn: true },
      allowedRanges: { durationMinutesRange: [15, 25], metsRange: [160, 220] },
      skipAdaptation: { applied: false, consecutiveSkips: 0, previousRecommendedMets: null },
      today: { totalSedentaryHours: 6, totalMvpaMinutes: 15, mvpaPerSedentaryRatio: 2.5, sleepHours: null, sleepQualityScore: null, pss4TotalScore: null, triadPillarsMet: 1 },
      userNotes: null,
    },
    output: {
      dominantMediator: "LOW_MVPA_VOLUME",
      diagnosisSummary: "Gerak aktifmu yang tercatat hari ini baru 15 menit. Jangan lupa lengkapi check-in harian di aplikasi ya supaya rekomendasinya makin pas.",
      isotemporalActionPlan: "Coba jalan santai selama 20 menit sore ini di sekitar kos, dengan tempo yang terasa nyaman.",
      recommendedMetsToday: 185,
      scientificCitationNote: CITATION_BANK.LOW_MVPA_VOLUME[1],
    },
  },
  {
    name: "skip_adaptation",
    input: {
      activeDirectives: ["ADAPTASI_SKIP: turunkan target ke rentang ringan dalam allowedRanges (maks -40%)."],
      clinicalRuleEvaluation: { dominantMediator: "LOW_MVPA_VOLUME", flags: ["LOW_MVPA_VOLUME"], escalationFlag: false, missingDailyCheckIn: false },
      allowedRanges: { durationMinutesRange: [9, 19], metsRange: [132, 165] },
      skipAdaptation: { applied: true, consecutiveSkips: 3, previousRecommendedMets: 220 },
      today: { totalSedentaryHours: 4.5, totalMvpaMinutes: 10, mvpaPerSedentaryRatio: 2.22, sleepHours: 7.5, sleepQualityScore: 4, pss4TotalScore: 5, triadPillarsMet: 2 },
      userNotes: null,
    },
    output: {
      dominantMediator: "LOW_MVPA_VOLUME",
      diagnosisSummary: "Nggak masalah kalau target beberapa hari terakhir sempat terlewat, kita mulai pelan dari langkah yang lebih ringan hari ini.",
      isotemporalActionPlan: "Cukup jalan kaki santai di koridor atau sekitar kos selama 10 menit sekarang supaya tetap realistis dicoba.",
      recommendedMetsToday: 145,
      scientificCitationNote: CITATION_BANK.LOW_MVPA_VOLUME[2],
    },
  },
];

module.exports = { FEW_SHOT_EXAMPLES, OUT_OF_SCOPE_TEMPLATE, CITATION_BANK };
