const CITATION_BANK = {
  SLEEP_MEDIATION_DEFICIT: [
    "Menurut Mu et al. (2024) dan Wang et al. (2025), kualitas tidur memediasi manfaat aktivitas fisik terhadap pemulihan stres mahasiswa.",
    "Mu et al. (2024) dan Wang et al. (2025) mengaitkan kualitas tidur yang lebih baik dengan pemulihan stres yang didukung aktivitas fisik.",
  ],
  SEDENTARY_OVERLOAD: [
    "Barbosa et al. (2024) dan Su et al. (2022) menunjukkan bahwa jeda gerak dapat membantu mengurangi dampak waktu duduk panjang pada suasana hati.",
    "Su et al. (2022) dan Barbosa et al. (2024) membahas manfaat mengganti sebagian waktu duduk dengan gerak ringan.",
  ],
  LOW_MVPA_VOLUME: [
    "Zhang et al. (2024) dan Ai et al. (2021) mengaitkan aktivitas fisik yang konsisten dengan dukungan bagi kesehatan mental mahasiswa.",
    "Ai et al. (2021) dan Zhang et al. (2024) menyoroti peran kebiasaan bergerak dalam menjaga kesejahteraan mahasiswa.",
  ],
  EXAM_ACUTE_STRESS: [
    "Wu & Zhou (2024) membahas manfaat aktivitas ringan hingga sedang untuk membantu meredakan ketegangan akademik.",
  ],
  OPTIMAL_BALANCE: [
    "Keseimbangan gerak dan tidur mendukung ketahanan stres sesuai kerangka Martín-Rodríguez & González-Prieto (2026).",
  ],
  OUT_OF_SCOPE: ["Di luar cakupan layanan CampusFlow Coach."],
};

const FEW_SHOT_EXAMPLES = [
  {
    name: "sleep_mediation_deficit",
    input: {
      clinicalRuleEvaluation: { dominantMediator: "SLEEP_MEDIATION_DEFICIT", flags: ["SLEEP_MEDIATION_DEFICIT"], escalationFlag: false, missingDailyCheckIn: false },
      allowedRanges: { durationMinutesRange: [15, 30], metsRange: [180, 260] },
      skipAdaptation: { applied: false },
      today: { totalSedentaryHours: 7, totalMvpaMinutes: 35, sleepHours: 5, sleepQualityScore: 1, pss4TotalScore: 9 },
    },
    output: { dominantMediator: "SLEEP_MEDIATION_DEFICIT", diagnosisSummary: "Tidurmu sekitar 5 jam dan terasa kurang nyenyak; wajar kalau energi terasa lebih rendah hari ini.", isotemporalActionPlan: "Coba jalan santai selama 20 menit sore ini di sekitar kos, lalu beri dirimu waktu tenang sebelum tidur.", recommendedMetsToday: 210, scientificCitationNote: CITATION_BANK.SLEEP_MEDIATION_DEFICIT[0] },
  },
  {
    name: "sedentary_overload",
    input: {
      clinicalRuleEvaluation: { dominantMediator: "SEDENTARY_OVERLOAD", flags: ["SEDENTARY_OVERLOAD"], escalationFlag: false, missingDailyCheckIn: false },
      allowedRanges: { durationMinutesRange: [10, 20], metsRange: [170, 240] },
      skipAdaptation: { applied: false },
      today: { totalSedentaryHours: 10, totalMvpaMinutes: 40, sleepHours: 7, pss4TotalScore: 5 },
    },
    output: { dominantMediator: "SEDENTARY_OVERLOAD", diagnosisSummary: "Kamu sudah duduk cukup lama hari ini, jadi tubuh mungkin terasa kaku setelah kuliah dan mengerjakan tugas.", isotemporalActionPlan: "Berdiri lalu jalan santai selama 15 menit sekarang di koridor atau sekitar kampus untuk menyelingi waktu duduk.", recommendedMetsToday: 205, scientificCitationNote: CITATION_BANK.SEDENTARY_OVERLOAD[0] },
  },
  {
    name: "low_mvpa_volume",
    input: {
      clinicalRuleEvaluation: { dominantMediator: "LOW_MVPA_VOLUME", flags: ["LOW_MVPA_VOLUME"], escalationFlag: false, missingDailyCheckIn: false },
      allowedRanges: { durationMinutesRange: [15, 25], metsRange: [160, 220] },
      skipAdaptation: { applied: false },
      today: { totalSedentaryHours: 5, totalMvpaMinutes: 10, sleepHours: 7.5, pss4TotalScore: 4 },
    },
    output: { dominantMediator: "LOW_MVPA_VOLUME", diagnosisSummary: "Gerak aktifmu baru sekitar 10 menit hari ini. Menambah sedikit gerak dengan santai bisa jadi langkah yang realistis.", isotemporalActionPlan: "Coba jalan santai selama 20 menit sore ini ke kantin atau mengitari area kos, tanpa perlu terburu-buru.", recommendedMetsToday: 190, scientificCitationNote: CITATION_BANK.LOW_MVPA_VOLUME[0] },
  },
  {
    name: "exam_acute_stress",
    input: {
      clinicalRuleEvaluation: { dominantMediator: "EXAM_ACUTE_STRESS", flags: ["EXAM_ACUTE_STRESS"], escalationFlag: false, missingDailyCheckIn: false },
      allowedRanges: { durationMinutesRange: [10, 20], metsRange: [150, 200] },
      skipAdaptation: { applied: false },
      today: { totalSedentaryHours: 5, totalMvpaMinutes: 35, sleepHours: 7.2, pss4TotalScore: 8 },
    },
    output: { dominantMediator: "EXAM_ACUTE_STRESS", diagnosisSummary: "Pola gerak dan tidurmu cukup terjaga, tetapi masa ujian bisa membuat pikiran terasa lebih penuh.", isotemporalActionPlan: "Ambil jeda dengan berjalan ringan selama 15 menit sekarang di sekitar kampus sebelum kembali belajar.", recommendedMetsToday: 175, scientificCitationNote: CITATION_BANK.EXAM_ACUTE_STRESS[0] },
  },
  {
    name: "optimal_balance",
    input: {
      clinicalRuleEvaluation: { dominantMediator: "OPTIMAL_BALANCE", flags: [], escalationFlag: false, missingDailyCheckIn: false },
      allowedRanges: { durationMinutesRange: [10, 20], metsRange: [200, 260] },
      skipAdaptation: { applied: false },
      today: { totalSedentaryHours: 5, totalMvpaMinutes: 45, sleepHours: 7.5, sleepQualityScore: 4, pss4TotalScore: 3 },
    },
    output: { dominantMediator: "OPTIMAL_BALANCE", diagnosisSummary: "Ritme tidur, gerak, dan istirahatmu hari ini tampak terjaga dengan baik. Pertahankan kebiasaan yang terasa nyaman buatmu.", isotemporalActionPlan: "Lakukan peregangan santai selama 15 menit sebelum tidur malam ini sebagai penutup hari yang ringan.", recommendedMetsToday: 230, scientificCitationNote: CITATION_BANK.OPTIMAL_BALANCE[0] },
  },
  {
    name: "escalation",
    input: {
      clinicalRuleEvaluation: { dominantMediator: "SLEEP_MEDIATION_DEFICIT", flags: ["SLEEP_MEDIATION_DEFICIT"], escalationFlag: true, missingDailyCheckIn: false },
      allowedRanges: { durationMinutesRange: [5, 15], metsRange: [80, 160] },
      skipAdaptation: { applied: false },
      today: { totalSedentaryHours: 8, totalMvpaMinutes: 20, sleepHours: 4.5, sleepQualityScore: 1, pss4TotalScore: 12 },
    },
    output: { dominantMediator: "SLEEP_MEDIATION_DEFICIT", diagnosisSummary: "Sepertinya beban yang kamu rasakan cukup berat dan tidurmu ikut terganggu. Kalau terasa terus menumpuk, kamu bisa bercerita kepada konselor kampus.", isotemporalActionPlan: "Duduk dengan nyaman dan lakukan napas perlahan selama 10 menit sekarang untuk memberi tubuh jeda.", recommendedMetsToday: 110, scientificCitationNote: CITATION_BANK.SLEEP_MEDIATION_DEFICIT[1] },
  },
  {
    name: "missing_daily_check_in",
    input: {
      clinicalRuleEvaluation: { dominantMediator: "LOW_MVPA_VOLUME", flags: ["LOW_MVPA_VOLUME"], escalationFlag: false, missingDailyCheckIn: true },
      allowedRanges: { durationMinutesRange: [15, 25], metsRange: [160, 220] },
      skipAdaptation: { applied: false },
      today: { totalSedentaryHours: 6, totalMvpaMinutes: 15, sleepHours: null, pss4TotalScore: null },
    },
    output: { dominantMediator: "LOW_MVPA_VOLUME", diagnosisSummary: "Gerak aktifmu yang tercatat hari ini masih sedikit. Jangan lupa isi check-in harian di aplikasi agar rekomendasimu bisa lebih sesuai.", isotemporalActionPlan: "Coba jalan santai selama 20 menit sore ini di sekitar kos, dengan tempo yang terasa nyaman.", recommendedMetsToday: 185, scientificCitationNote: CITATION_BANK.LOW_MVPA_VOLUME[1] },
  },
  {
    name: "out_of_scope",
    input: {
      userNotes: "Bisa bantu jawab soal kalkulus nomor 5?",
      clinicalRuleEvaluation: { dominantMediator: "OPTIMAL_BALANCE", flags: [], escalationFlag: false, missingDailyCheckIn: false },
      allowedRanges: { durationMinutesRange: [10, 20], metsRange: [200, 260] },
      skipAdaptation: { applied: false },
      today: { totalSedentaryHours: 5, totalMvpaMinutes: 40, sleepHours: 7, pss4TotalScore: 4 },
    },
    output: { dominantMediator: "OPTIMAL_BALANCE", diagnosisSummary: "Pertanyaan ini di luar cakupan CampusFlow Coach.", isotemporalActionPlan: "Tidak ada rencana aksi karena input berada di luar cakupan CampusFlow Coach.", recommendedMetsToday: 50, scientificCitationNote: CITATION_BANK.OUT_OF_SCOPE[0] },
  },
];

module.exports = { FEW_SHOT_EXAMPLES, CITATION_BANK };
