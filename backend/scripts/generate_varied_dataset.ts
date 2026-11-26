import fs from "node:fs";
import path from "node:path";
import type { DominantMediator } from "../../shared/contracts/index.ts";
import { evaluateInsightResponse, type EvalExpectation } from "./eval-checks.ts";

const SCRIPTS_DIR = path.resolve(import.meta.dirname);
const TRAIN_OUT = path.join(SCRIPTS_DIR, "balanced_dataset_narratives_train_messages.jsonl");
const VAL_OUT = path.join(SCRIPTS_DIR, "balanced_dataset_narratives_val_messages.jsonl");

const SYSTEM_PROMPT =
  "Kamu adalah CampusFlow AI Coach: asisten kesehatan mental-fisik mahasiswa Indonesia berbasis Martín-Rodríguez & González-Prieto (2026). Tugasmu HANYA menyusun narasi empatik non-diagnostik dan rencana aksi dari data input, bukan mengambil keputusan klinis. Salin dominantMediator persis dari clinicalRuleEvaluation, jaga recommendedMetsToday dan durasi menit di dalam allowedRanges, patuhi activeDirectives (eskalasi menyebut konselor kampus dengan aksi ringan; missingDailyCheckIn mengajak check-in harian tanpa menebak tidur/stres; skipAdaptation menurunkan target secara wajar), pilih sitasi tervalidasi tanpa mengarang angka baru, dan tolak input non-wellbeing dengan template out-of-scope baku.";

// Seeded PRNG (mulberry32) agar hasil deterministik namun sangat bervariasi
function createRng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(rng: () => number, arr: readonly T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}

function randInt(rng: () => number, min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}

function randFloat(rng: () => number, min: number, max: number, decimals = 1): number {
  const val = min + rng() * (max - min);
  return Number(val.toFixed(decimals));
}

function shuffle<T>(rng: () => number, arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

interface ScenarioTemplate {
  subtheme: string;
  notes: string[];
  summaryOpeners: string[];
  summaryClosers: string[];
  actionVerbs: string[];
  actionBenefits: string[];
  timings: Array<"sekarang" | "sore ini" | "sebelum tidur">;
}

// ============================================================================
// BANK SKENARIO KAYA VARIASI PER MEDIATOR (Burnout, Pegal, Lelah, Begadang, dll.)
// ============================================================================
const MEDIATOR_SCENARIOS: Record<DominantMediator, ScenarioTemplate[]> = {
  SLEEP_MEDIATION_DEFICIT: [
    {
      subtheme: "begadang_tugas",
      notes: [
        "Semalam begadang sampai jam 3 ngerjain laporan praktikum, pagi ini kepala terasa berat banget.",
        "Baru tidur jam 2 lewat gara-gara ngejar revisi makalah kelompok, badan rasanya remuk.",
        "Tadi malam lembur ngerjain proyek web sampai subuh, sekarang mata sepet dan susah fokus.",
        "Habis begadang dua malam berturut-turut buat laporan lab, energi rasanya habis total.",
        "Tidur cuma sebentar banget karena deadline tugas mepet jam 8 pagi, bawaannya ngantuk terus.",
        "Semalam ketiduran di depan laptop jam 3 pagi, bangun-bangun leher pegal dan kepala puyeng.",
        "Ngebut ngerjain coding sampai dini hari, sekarang di kelas rasanya melayang dan capek sekali.",
        "Begadang selesain slide presentasi pagi ini, tubuh kerasa lemas dan gampang kesel.",
      ],
      summaryOpeners: [
        "Wajar banget tubuhmu terasa berat setelah begadang mengejar tenggat semalam.",
        "Kurang tidur karena lembur tugas memang langsung bikin fokus dan stamina hari ini menurun drastis.",
        "Tenaga yang terkuras akibat tidur terlalu larut membuat badan terasa lemas dan pikiran cepat lelah.",
        "Sesi begadang yang panjang kemarin jelas membuat ritme pemulihanmu belum sempat penuh.",
        "Rasa kantuk dan kepala berat hari ini adalah sinyal jelas kalau tubuhmu butuh pemulihan tidur yang lebih tenang.",
      ],
      summaryClosers: [
        "Kita jaga ritme hari ini tetap ringan supaya kualitas tidurmu malam nanti bisa pulih lebih cepat.",
        "Prioritaskan langkah kecil yang menenangkan agar tubuhmu tidak makin kewalahan sampai malam.",
        "Fokus utama hari ini adalah bantu sistem sarafmu turun pelan-pelan supaya tidur malam ini jauh lebih nyenyak.",
        "Tidak perlu memaksakan target berat hari ini, cukup beri jeda gerak ringan agar energi tidak makin anjlok.",
      ],
      actionVerbs: [
        "jalan santai pelan di sekitar kos atau koridor sambil mengatur napas",
        "lakukan peregangan leher, bahu, dan punggung secara lembut tanpa terburu-buru",
        "ambil jeda jalan ringan di ruang terbuka sambil menjauh sejenak dari layar",
        "lakukan stretching ringan seluruh badan diikuti pernapasan dalam yang tenang",
        "berjalan kaki santai dengan tempo rileks untuk melancarkan aliran darah",
      ],
      actionBenefits: [
        "agar ketegangan tubuh mereda dan malam nanti kamu lebih mudah tidur pulas.",
        "supaya rasa kantuk berat berkurang tanpa memicu kelelahan tambahan.",
        "untuk membantu ritme sirkadianmu kembali stabil menjelang waktu istirahat malam.",
        "agar bahu yang kaku mengendur dan pikiran terasa sedikit lebih segar.",
      ],
      timings: ["sore ini", "sebelum tidur", "sekarang"],
    },
    {
      subtheme: "insomnia_overthinking",
      notes: [
        "Susah tidur semalam karena kepikiran nilai dan tumpukan tugas minggu depan.",
        "Sudah rebahan dari jam 11 tapi mata baru merem jam 3, pikiran muter terus soal kuliah.",
        "Tidur sering kebangun tengah malam, rasanya capek mental padahal sudah di kasur lama.",
        "Belakangan jadwal tidur berantakan banget, susah merem kalau belum lewat tengah malam.",
        "Overthinking soal skripsi bikin tidur nggak nyenyak dan bangun dengan badan masih lelah.",
        "Tadi malam gelisah banget sampai susah tidur, pagi ini badan terasa pegal dan kurang semangat.",
        "Kualitas tidurku lagi jelek banget minggu ini, bangun tidur rasanya tetap capek.",
        "Pikiran nggak bisa berhenti mikirin revisi dosen pas mau tidur, akhirnya tidur cuma 4 jam.",
      ],
      summaryOpeners: [
        "Tidur yang terputus-putus saat pikiran sedang ramai memang bikin bangun pagi tetap terasa lelah.",
        "Ketika kepala masih penuh oleh urusan kuliah menjelang malam, tubuh jadi sulit masuk ke fase istirahat dalam.",
        "Gelisah di jam tidur membuat pemulihan mentalmu belum optimal meskipun kamu sudah mencoba beristirahat.",
        "Pola tidur yang terganggu belakangan ini wajar membuat energimu terasa cepat habis di siang hari.",
      ],
      summaryClosers: [
        "Hari ini kita bantu tubuhmu melepaskan ketegangan secara bertahap agar malam nanti lebih tenang.",
        "Aktivitas fisik ringan di waktu yang pas bisa jadi jembatan alami supaya tidurmu nanti lebih pulas.",
        "Mari fokus menurunkan beban pikiran lewat gerak santai yang ramah untuk kondisi tubuhmu saat ini.",
      ],
      actionVerbs: [
        "lakukan jalan santai sore tanpa menatap ponsel sambil menikmati udara luar",
        "praktikkan peregangan relaksasi bahu dan punggung dengan napas lambat",
        "berjalan ringan dengan langkah tenang lalu lanjutkan peregangan otot kaki",
        "lakukan yoga ringan atau peregangan lembut di kamar dengan lampu redup",
      ],
      actionBenefits: [
        "supaya ketegangan pikiran menurun dan tubuh lebih siap tidur nyenyak.",
        "untuk membantu menurunkan hormon stres sebelum kamu naik ke kasur.",
        "agar sistem sarafmu lebih rileks dan siklus tidur kembali teratur.",
      ],
      timings: ["sore ini", "sebelum tidur"],
    },
    {
      subtheme: "burnout_kurang_tidur",
      notes: [
        "Lagi ngerasa burnout banget, tidur kurang, tugas datang terus nggak ada habisnya.",
        "Capek fisik sama capek pikiran campur aduk, semalam cuma tidur 4 jam lebih dikit.",
        "Rasanya lelah banget menjalani minggu ini, kurang tidur bikin semua tugas terasa dua kali lebih berat.",
        "Badan udah protes pegel-pegel dan ngantuk berat, tapi kerjaan organisasi sama kuliah masih numpuk.",
        "Burnout mulai kerasa, jam tidur kacau dan bangun pagi selalu nggak bertenaga.",
        "Lelah sekali hari ini, mata berat banget dan susah konsentrasi baca materi kuliah.",
      ],
      summaryOpeners: [
        "Rasa burnout dan lelah yang bercampur dengan kurang tidur memang membuat segalanya terasa jauh lebih berat.",
        "Ketika tidur terus terpotong di tengah kesibukan kuliah, wajar kalau tubuh dan pikiran mulai memberi sinyal kewalahan.",
        "Kelelahan berlapis seperti ini bukan tanda kamu lemah, melainkan pengingat bahwa tubuhmu butuh jeda pemulihan nyata.",
        "Beban harian yang padat ditambah tidur singkat membuat cadangan energimu menipis dengan cepat.",
      ],
      summaryClosers: [
        "Ambil napas dulu, hari ini cukup lakukan gerak pemulihan ringan dan jaga jam tidurmu lebih awal.",
        "Kita mulai dari langkah paling ringan supaya stres tidak makin menumpuk dan tidurmu membaik malam ini.",
        "Beri dirimu izin untuk melambat sejenak agar pemulihan fisik dan mental bisa berjalan beriringan.",
      ],
      actionVerbs: [
        "lakukan jalan santai pelan di halaman atau lorong yang tenang",
        "kerjakan peregangan seluruh tubuh dengan tempo lambat sambil tarik napas dalam",
        "ambil jeda berdiri dan berjalan ringan tanpa membawa gawai",
        "lakukan relaksasi otot bahu, leher, dan punggung secara bergantian",
      ],
      actionBenefits: [
        "untuk membantu menurunkan ketegangan dan memperbaiki kualitas tidur malam ini.",
        "agar tubuh yang pegal terasa lebih lega dan pikiran bisa sedikit beristirahat.",
        "supaya energi pulih bertahap tanpa membebani tubuh yang sedang lelah.",
      ],
      timings: ["sekarang", "sore ini", "sebelum tidur"],
    },
  ],

  SEDENTARY_OVERLOAD: [
    {
      subtheme: "pegal_leher_punggung",
      notes: [
        "Leher sama bahu pegal banget habis duduk di depan laptop dari pagi sampai sore.",
        "Punggung bawah mulai nyut-nyutan karena kelamaan duduk ngerjain laporan praktikum.",
        "Badan kaku semua, seharian cuma pindah dari kursi belajar ke kursi lab komputer.",
        "Pundak terasa berat dan tegang gara-gara ngetik skripsi berjam-jam tanpa bangun.",
        "Pinggang pegel banget, baru sadar udah duduk lebih dari 9 jam hari ini.",
        "Tengkuk rasanya kaku dan kepala agak tegang setelah maraton ngoding tugas besar.",
        "Paha sama punggung terasa pegal karena kelas online sambung-menyambung terus.",
        "Habis duduk lama di perpustakaan bikin badan rasanya kaku dan gampang capek.",
      ],
      summaryOpeners: [
        "Duduk terlalu lama tanpa jeda memang cepat membuat leher, bahu, dan punggung bawah terasa kaku serta pegal.",
        "Wajar badanmu terasa tegang setelah berjam-jam bertahan di posisi duduk yang sama di depan layar.",
        "Pegal di pundak dan pinggang hari ini adalah alarm alami tubuh bahwa ototmu butuh segera digerakkan.",
        "Maraton duduk di depan laptop memang menguras kenyamanan fisik sekaligus bikin konsentrasi ikut menurun.",
        "Tubuh yang terlalu lama diam di kursi membuat sirkulasi melambat dan otot punggung cepat terasa kaku.",
      ],
      summaryClosers: [
        "Memecah waktu duduk dengan gerak aktif singkat jauh lebih efektif meredakan pegal daripada terus memaksakan duduk.",
        "Yuk beri jeda bergerak sebentar supaya ketegangan otot mereda dan pikiran kembali jernih.",
        "Langkah kecil berdiri dan bergerak sekarang akan langsung membantu melepas rasa kaku di tubuhmu.",
      ],
      actionVerbs: [
        "berdiri lalu lakukan peregangan leher, bahu, dan punggung atas dilanjutkan jalan santai keliling ruangan",
        "bangkit dari kursi untuk berjalan kaki santai di koridor sambil mengayunkan lengan secara rileks",
        "lakukan peregangan overhead stretch, putar bahu perlahan, lalu jalan ringan di sekitar meja",
        "jauhkan diri dari kursi dan lakukan jalan santai plus peregangan pinggang serta betis",
        "ambil jeda berdiri aktif dengan jalan ringan dan peregangan punggung bawah secara lembut",
      ],
      actionBenefits: [
        "untuk melancarkan aliran darah dan melepaskan rasa pegal di area leher serta punggung.",
        "agar kekakuan otot berkurang dan fokus belajarmu kembali segar.",
        "supaya tekanan pada tulang belakang berkurang sebelum kamu lanjut beraktivitas.",
        "untuk meredakan ketegangan fisik sekaligus menjaga suasana hati tetap stabil.",
      ],
      timings: ["sekarang", "sore ini"],
    },
    {
      subtheme: "mata_lelah_screen_overload",
      notes: [
        "Mata perih dan lelah banget habis menatap layar laptop hampir seharian penuh.",
        "Seharian mantengin layar buat ngedit presentasi sama baca jurnal, kepala jadi penat.",
        "Screen time hari ini tinggi banget karena kuliah hybrid lanjut ngerjain tugas kelompok.",
        "Mata rasanya kering dan fokus mulai buyar gara-gara terlalu lama di depan monitor.",
        "Dari pagi sampai malam di depan komputer terus, rasanya jenuh dan capek banget.",
        "Habis debug kode berjam-jam tanpa istirahat, mata lelah dan badan rasanya lemas.",
        "Kelamaan duduk di depan layar bikin kepala terasa penuh dan mood turun.",
      ],
      summaryOpeners: [
        "Paparan layar yang panjang tanpa jeda membuat mata cepat lelah dan pikiran terasa penat.",
        "Wajar kepalamu terasa penuh setelah berjam-jam fokus di depan monitor dengan minim pergerakan.",
        "Kombinasi duduk lama dan menatap layar terus-menerus memang cepat memicu kelelahan visual maupun mental.",
        "Rasa jenuh dan mata perih hari ini menandakan kamu butuh rehat layar sambil menggerakkan tubuh.",
      ],
      summaryClosers: [
        "Mengalihkan pandangan dari layar sambil berjalan ringan bisa segera menyegarkan ulang fokusmu.",
        "Beri mata dan ototmu jeda singkat agar beban layar tidak menumpuk sampai malam.",
        "Istirahat aktif singkat jauh lebih membantu memulihkan energi daripada sekadar scroll ponsel di kursi.",
      ],
      actionVerbs: [
        "tinggalkan layar sejenak, pandang objek jauh, lalu berjalan santai di luar ruangan atau koridor",
        "matikan fokus dari monitor dan lakukan jalan ringan sambil peregangan bahu serta leher",
        "lakukan jeda jalan kaki santai tanpa gawai sambil merilekskan otot mata dan punggung",
        "berdiri dan berjalan santai mengitari area kampus atau kos untuk menyegarkan mata dan tubuh",
      ],
      actionBenefits: [
        "agar mata yang perih lebih rileks dan sirkulasi tubuh kembali lancar.",
        "supaya kepenatan mental mereda dan produktivitasmu pulih lebih cepat.",
        "untuk memecah kejenuhan duduk lama sekaligus menyegarkan pandangan.",
      ],
      timings: ["sekarang", "sore ini"],
    },
    {
      subtheme: "burnout_duduk_maraton",
      notes: [
        "Lagi capek banget ngerjain tugas akhir, duduk terus dari pagi sampai lupa gerak.",
        "Rasanya burnout lihat tumpukan tab browser, badan pegel semua gara-gara duduk terus.",
        "Hari ini full rapat daring dan ngerjain laporan, lelah fisik dan mental banget.",
        "Duduk terlalu lama bikin otak rasanya buntu dan badan terasa berat sekali.",
        "Sudah duduk berjam-jam tapi kerjaan rasanya makin lambat karena badan udah capek.",
      ],
      summaryOpeners: [
        "Duduk maraton tanpa jeda sering bikin otak terasa buntu sekaligus badan pegal dan berat.",
        "Saat kelelahan mental bertemu waktu duduk yang panjang, memaksakan diri di kursi justru membuat kerjaan makin terasa lambat.",
        "Rasa jenuh dan lelah setelah duduk terlalu lama adalah tanda kamu perlu mengganti suasana dengan gerak aktif singkat.",
      ],
      summaryClosers: [
        "Beranjak sebentar dari meja kerja bisa membantu memutus rasa buntu dan mengendurkan tubuh.",
        "Mari selipkan gerak ringan agar tubuh kembali bugar dan pikiran lebih lapang.",
      ],
      actionVerbs: [
        "bangkit dari meja kerja dan jalan santai dengan ritme nyaman sambil melemaskan tangan dan bahu",
        "lakukan jalan kaki ringan keluar ruangan diikuti peregangan punggung serta dada",
        "ambil jeda berdiri aktif dengan jalan santai keliling gedung atau halaman kos",
      ],
      actionBenefits: [
        "supaya pikiran yang buntu terasa lebih segar dan pegal di badan mereda.",
        "agar ketegangan fisik terurai dan kamu bisa melanjutkan tugas dengan lebih tenang.",
      ],
      timings: ["sekarang", "sore ini"],
    },
  ],

  LOW_MVPA_VOLUME: [
    {
      subtheme: "kurang_gerak_lemas",
      notes: [
        "Seharian cuma di kamar kos, rasanya badan lemas dan nggak bertenaga sama sekali.",
        "Minggu ini jarang banget olahraga atau jalan kaki, tubuh terasa berat dan gampang capek.",
        "Ke kampus naik motor terus dan pulang langsung rebahan, rasanya kebugaran mulai turun.",
        "Langkah harianku hari ini sedikit banget, badan jadi kerasa lesu dan mood agak datar.",
        "Lagi mager parah gerak karena cuaca mendung, tapi badan malah jadi makin lemas.",
        "Belum sempat olahraga beberapa hari ini, rasanya cepat ngos-ngosan dan kurang segar.",
        "Aktivitas fisikku minim banget hari ini, padahal pengen badan lebih bugar buat kuliah.",
        "Cuma bolak-balik kasur sama meja belajar hari ini, badan terasa kaku dan kurang bersemangat.",
      ],
      summaryOpeners: [
        "Kurang bergerak seharian memang sering membuat badan terasa lesu, berat, dan kurang bersemangat.",
        "Wajar energimu terasa datar ketika volume aktivitas fisik harian masih sangat rendah.",
        "Saat tubuh jarang diajak bergerak aktif, aliran energi dan suasana hati biasanya ikut melambat.",
        "Minimnya gerak hari ini bisa bikin badan terasa makin lemas meski kamu tidak sedang melakukan pekerjaan fisik berat.",
        "Tubuhmu sebenarnya sedang butuh dorongan gerak ringan agar rasa lesu bisa perlahan hilang.",
      ],
      summaryClosers: [
        "Mulai saja dari sesi gerak singkat yang ringan dan menyenangkan agar ritme aktifmu kembali terbentuk.",
        "Tidak perlu langsung olahraga berat—langkah kecil yang konsisten sudah cukup membangkitkan energi.",
        "Tambahan gerak sederhana hari ini akan sangat membantu menaikkan stamina dan ketahanan stresmu.",
      ],
      actionVerbs: [
        "lakukan jalan cepat santai keliling area kampus atau sekitar kos",
        "berjalan kaki aktif sambil naik-turun tangga ringan dengan tempo teratur",
        "lakukan sesi peregangan dinamis dilanjutkan jalan santai di ruang terbuka",
        "coba jalan kaki energik sore hari atau bersepeda santai di sekitar lingkungan",
        "kerjakan latihan mobilitas ringan seperti jalan di tempat, squat ringan, dan peregangan lengan",
      ],
      actionBenefits: [
        "untuk membangkitkan energi tubuh dan memperbaiki suasana hati.",
        "agar peredaran darah lebih lancar dan rasa lesu perlahan berkurang.",
        "supaya kebugaran harianmu tetap terjaga dan pikiran lebih siap belajar.",
        "untuk membantu tubuh memproduksi endorfin alami penunjang ketahanan mental.",
      ],
      timings: ["sekarang", "sore ini"],
    },
    {
      subtheme: "capek_mental_butuh_gerak",
      notes: [
        "Pikiran suntuk banget habis kuliah seharian, tapi hari ini hampir nggak ada aktivitas fisik.",
        "Lagi stres ringan sama tugas, biasanya habis jalan sore enakan tapi hari ini belum gerak sama sekali.",
        "Badan rasanya kurang fit karena sudah seminggu absen jogging atau jalan kaki.",
        "Pengen refresh otak biar nggak jenuh di kos terus, tapi bingung mulai gerak dari mana.",
        "Hari ini jadwal agak longgar tapi malah kebanyakan rebahan, badan malah jadi pegal dan lemas.",
        "Ngerasa capek tanpa sebab jelas padahal seharian cuma santai di kamar, mungkin kurang gerak.",
      ],
      summaryOpeners: [
        "Rasa suntuk dan lemas meski sedang tidak banyak beraktivitas sering muncul saat tubuh kekurangan gerak aktif.",
        "Ketika rutinitas hanya berkutat di dalam kamar, tubuh kehilangan stimulasi fisik yang membantu menjaga kejernihan pikiran.",
        "Menghidupkan kembali kebiasaan gerak ringan adalah cara paling sederhana untuk menyegarkan badan dan pikiran yang jenuh.",
      ],
      summaryClosers: [
        "Yuk ajak tubuhmu bergerak dengan intensitas ringan-sedang supaya rasa suntuk segera terurai.",
        "Satu sesi gerak singkat hari ini sudah sangat berarti untuk memutus rasa mager dan menaikkan mood.",
      ],
      actionVerbs: [
        "jalan kaki santai menuju taman kampus atau keliling kompleks sambil menghirup udara segar",
        "lakukan jalan cepat ringan diselingi peregangan bahu dan kaki",
        "coba senam peregangan aktif atau jalan santai dengan musik favorit",
      ],
      actionBenefits: [
        "agar rasa suntuk berkurang dan tubuh kembali terasa ringan.",
        "supaya stamina meningkat dan suasana hatimu lebih cerah.",
      ],
      timings: ["sore ini", "sekarang"],
    },
  ],

  EXAM_ACUTE_STRESS: [
    {
      subtheme: "tegang_ujian_kuis",
      notes: [
        "Besok UTS mata kuliah paling susah, deg-degan banget dan materi rasanya belum nempel.",
        "Pekan UAS bikin kepala tegang terus, takut hasil ujian nggak maksimal.",
        "Sebentar lagi kuis mendadak dan live coding, tangan sampai dingin karena panik ringan.",
        "Stres banget menghadapi jadwal ujian yang mepet dalam satu minggu penuh.",
        "Otak rasanya penuh banget habis ngebut baca slide ujian dari pagi, mulai susah fokus.",
        "Deg-degan parah menjelang sidang proposal besok pagi, dada terasa sedikit tegang.",
        "Tekanan ujian praktikum bikin badan ikutan kaku dan gampang capek pikiran.",
        "Lagi tertekan banget sama target nilai semester ini, rasanya tegang terus sepanjang hari.",
      ],
      summaryOpeners: [
        "Merasa tegang dan berdebar menjelang ujian atau sidang adalah respons yang sangat wajar saat tekanan akademik memuncak.",
        "Otak yang dipaksa menyerap banyak materi dalam waktu singkat memang cepat terasa penuh dan lelah.",
        "Wajar kalau kamu merasa tertekan di pekan ujian seperti ini, tubuhmu sedang bekerja keras menghadapi situasi penting.",
        "Ketegangan menjelang evaluasi kuliah sering membuat bahu ikutan kaku dan pikiran jadi sulit tenang.",
      ],
      summaryClosers: [
        "Memberi jeda gerak ringan sebentar justru membantu menurunkan ketegangan dan membuat ingatan lebih jernih.",
        "Mari bantu tubuhmu melepas adrenalin berlebih lewat aktivitas singkat yang menenangkan.",
        "Rehat aktif beberapa menit akan membuatmu kembali belajar dengan kepala yang jauh lebih tenang.",
      ],
      actionVerbs: [
        "lakukan jalan santai dengan ritme teratur sambil mengatur napas panjang",
        "kerjakan peregangan bahu, dada, dan leher diikuti jalan ringan di luar ruangan",
        "ambil jeda berjalan kaki santai tanpa membuka catatan ujian sambil tarik napas perlahan",
        "lakukan kombinasi jalan ringan dan relaksasi napas dalam untuk menurunkan detak tegang",
      ],
      actionBenefits: [
        "untuk meredakan ketegangan akademik akut agar konsentrasi belajarmu kembali tajam.",
        "supaya rasa gugup berkurang dan materi lebih mudah dicerna saat kembali belajar.",
        "agar tubuh lebih rileks dan pikiran terasa lebih tenang menghadapi ujian.",
      ],
      timings: ["sekarang", "sore ini"],
    },
    {
      subtheme: "tekanan_deadline_presentasi",
      notes: [
        "Deadline proyek akhir tinggal 2 hari lagi, stres banget dan rasanya dikejar waktu terus.",
        "Hari ini presentasi di depan dosen penguji, badan terasa tegang dan capek mental.",
        "Tumpukan tugas besar yang barengan sama minggu ujian bikin kepala rasanya mau pecah.",
        "Stres berat sama revisi tugas kelompok yang belum kelar padahal besok dikumpulkan.",
        "Beban ujian dan laporan praktikum bersamaan bikin aku gampang panik dan lelah.",
      ],
      summaryOpeners: [
        "Tekanan deadline yang menumpuk bersamaan memang membuat pikiran mudah tegang dan cepat terkuras.",
        "Saat tenggat semakin dekat, tubuh sering masuk ke mode siaga yang bikin dada dan bahu terasa kaku.",
        "Wajar kamu merasa kelelahan mental ketika harus mengejar presentasi dan ujian sekaligus.",
      ],
      summaryClosers: [
        "Selipkan jeda gerak singkat untuk menurunkan ketegangan sebelum kamu melanjutkan persiapan.",
        "Menenangkan tubuh terlebih dahulu akan membantumu berpikir lebih rapi dan strategis.",
      ],
      actionVerbs: [
        "berdiri sejenak lalu jalan santai di koridor sambil melemaskan rahang dan bahu",
        "lakukan jalan ringan disertai latihan pernapasan perlahan agar ketegangan turun",
        "ambil jeda peregangan ringan seluruh tubuh dan jalan kaki santai menjauh dari meja",
      ],
      actionBenefits: [
        "agar stres akut mereda dan kamu bisa kembali fokus menyusun langkah prioritas.",
        "supaya tubuh tidak makin tegang dan energi tetap terjaga sampai tugas tuntas.",
      ],
      timings: ["sekarang", "sore ini"],
    },
  ],

  OPTIMAL_BALANCE: [
    {
      subtheme: "ritme_sehat_terjaga",
      notes: [
        "Hari ini tidur cukup, sudah sempat jalan kaki pagi, dan tugas kuliah masih terkendali.",
        "Alhamdulillah ritme belajarku minggu ini lumayan seimbang, pengen jaga konsistensi terus.",
        "Badan terasa cukup segar hari ini, tidur semalam nyenyak dan sudah gerak aktif.",
        "Jadwal kuliah lumayan padat tapi masih bisa diselipin istirahat dan olahraga ringan.",
        "Mood hari ini stabil dan fokus enak, mau tahu aktivitas ringan apa yang pas buat menjaga performa.",
        "Sudah rutin jalan kaki ke kampus dan tidur sebelum jam 11, badan rasanya jauh lebih enak.",
        "Hari ini nggak terlalu capek, pengen tetap aktif biar streak sehatku nggak putus.",
        "Semua pilar harian lagi bagus hari ini, tinggal jaga ritme sampai malam.",
      ],
      summaryOpeners: [
        "Keren, keseimbangan tidur, gerak aktif, dan ritme belajarmu hari ini berada di jalur yang sangat baik.",
        "Senang melihat tubuh dan pikiranmu sedang dalam kondisi bugar serta terkendali hari ini.",
        "Konsistensimu menjaga pola tidur dan aktivitas fisik sudah terlihat hasilnya pada kestabilan energimu.",
        "Ritme harianmu hari ini sangat positif—tubuhmu mendapatkan pemulihan sekaligus gerak yang seimbang.",
      ],
      summaryClosers: [
        "Pertahankan momentum baik ini dengan sesi gerak santai yang menyenangkan agar daya tahan stres tetap kuat.",
        "Cukup tambahkan aktivitas pemeliharaan ringan supaya kebugaran dan fokusmu tetap prima besok.",
        "Teruskan kebiasaan baik ini tanpa perlu berlebihan agar keseimbangan jangka panjangmu tetap awet.",
      ],
      actionVerbs: [
        "lakukan jalan santai sore atau bersepeda ringan untuk menjaga kebugaran",
        "nikmati sesi jalan kaki aktif di sekitar kampus diikuti peregangan ringan",
        "lakukan peregangan mobilitas dan jalan santai dengan tempo nyaman",
        "selipkan jalan santai sambil menikmati udara sore untuk menjaga konsistensi gerak",
      ],
      actionBenefits: [
        "agar momentum sehat dan ketahanan stresmu tetap terjaga optimal.",
        "supaya kualitas tidur malam ini tetap nyenyak dan energi besok stabil.",
        "untuk mempertahankan kebugaran fisik sekaligus kejernihan fokus belajarmu.",
      ],
      timings: ["sore ini", "sekarang"],
    },
  ],
};

// Bank skenario KHUSUS ESKALASI (distres tinggi / PSS-4 >= 10 / kata kunci berat)
const ESCALATION_NOTES = [
  "Capek banget sampai rasanya nggak sanggup lanjut kuliah semester ini, pengen menyerah aja.",
  "Cemas berlebihan terus dari kemarin, dada sesak mikirin semua masalah dan tugas.",
  "Rasanya putus asa banget, udah usaha tapi tetap ketinggalan dan nggak ada yang ngerti.",
  "Hari ini panik berat di kamar kos, nangis terus dan nggak sanggup pegang laptop.",
  "Burnout parah banget, merasa kosong, capek mental, dan nggak sanggup menghadapi hari ini.",
  "Jujur lagi merasa terpuruk dan cemas berlebihan, tidur berantakan dan pikiran berat sekali.",
  "Ngerasa sendirian dan nggak kuat lagi nanggung beban kuliah sama ekspektasi orang tua.",
  "Pikiran rasanya penuh sampai panik berat, capek sekali dan bingung harus mulai dari mana.",
  "Sudah beberapa hari merasa putus asa, badan lemas total dan rasanya ingin menyerah.",
  "Stres banget sampai gemetar dan cemas berlebihan setiap kali buka grup kelas.",
];

const ESCALATION_OPENERS = [
  "Berat sekali rasanya menanggung semua tekanan itu sendirian, dan sangat wajar kalau kamu merasa benar-benar terkuras saat ini.",
  "Terima kasih sudah mau jujur tentang apa yang kamu rasakan—beban yang menumpuk seperti ini memang bisa terasa sangat menyesakkan.",
  "Kamu tidak harus menyelesaikan semuanya hari ini; wajar tubuh dan pikiranmu terasa kewalahan saat tekanan datang bertubi-tubi.",
  "Rasa lelah dan cemas yang begitu berat ini pantas mendapatkan ruang istirahat dan dukungan yang hangat.",
  "Saat segalanya terasa terlalu berat untuk dipikul sendiri, melambat dan mencari dukungan adalah langkah yang berani.",
];

const ESCALATION_COUNSELOR_CLOSERS = [
  "Kalau rasanya terus menumpuk, nggak apa-apa cerita ke konselor kampus supaya kamu tidak menanggungnya sendirian.",
  "Jika beban ini terasa terlalu berat ditampung sendiri, pertimbangkan untuk berbicara dengan konselor kampus yang siap mendengarkanmu dengan aman.",
  "Kamu berhak mendapat dukungan—kalau perasaan berat ini terus bertahan, nggak apa-apa menghubungi konselor kampus untuk teman berbagi.",
  "Jangan ragu menjangkau konselor kampus bila rasa cemas atau lelah ini terasa makin menekan hari ini.",
];

const ESCALATION_GENTLE_PLANS = [
  "duduk atau bersandar dengan nyaman dan lakukan latihan pernapasan perlahan (tarik 4 detik, embuskan 6 detik)",
  "lakukan relaksasi napas dalam di tempat tenang sambil melemaskan bahu dan rahang secara perlahan",
  "berjalan sangat santai di dalam ruangan atau dekat jendela sambil menarik napas pelan",
  "lakukan peregangan duduk super ringan pada leher dan bahu diikuti pernapasan tenang",
  "ambil jeda menjauh dari layar, duduk rileks, dan fokus pada teknik relaksasi napas lembut",
];

// Bank skenario KHUSUS MISSING CHECK-IN (pss4TotalScore: null, sleepHours: null -> DILARANG sebut kata "tidur" atau "semalam")
const MISSING_CHECKIN_NOTES = [
  "Baru buka aplikasi siang ini, badan agak pegal habis kuliah pagi tapi belum sempat isi laporan.",
  "Hari ini sibuk banget dari pagi di kampus, badan terasa capek dan punggung agak kaku.",
  "Belum sempat catat kondisi harian, cuma kerasa agak lelah dan kurang gerak hari ini.",
  "Baru selesai praktikum panjang, mata agak lelah dan bahu terasa pegal.",
  "Lagi agak suntuk sama tugas minggu ini, pengen cari saran aktivitas ringan dulu.",
  "Hari ini duduk cukup lama di perpustakaan, badan mulai kerasa kaku.",
  "Baru sempat buka CampusFlow sore ini setelah kelas penuh dari pagi.",
  "Merasa agak lemas dan kurang fokus, tapi belum sempat mengisi data harian hari ini.",
];

const MISSING_CHECKIN_OPENERS = [
  "Dari data gerak dan waktu dudukmu hari ini, tubuhmu tampaknya butuh sedikit penyegaran agar tetap nyaman.",
  "Aktivitasmu hari ini menunjukkan perlunya jeda gerak ringan untuk menjaga stamina dan kenyamanan tubuh.",
  "Terima kasih sudah membuka CampusFlow di sela kesibukan kuliahmu hari ini.",
  "Wajar badan terasa agak kaku atau lelah setelah rangkaian kegiatan kampus yang padat.",
];

const MISSING_CHECKIN_PROMPTS = [
  "Agar rekomendasi yang diberikan makin akurat, sempatkan mengisi check-in harian singkat hari ini ya.",
  "Yuk luangkan sebentar untuk mengisi check-in harian supaya panduan kesejahteraanmu bisa lebih personal.",
  "Jangan lupa lengkapi check-in harian hari ini agar CampusFlow bisa memantau kondisimu dengan lebih menyeluruh.",
  "Bila ada waktu sejenak, silakan isi check-in harian supaya rekomendasi pemulihanmu makin tepat sasaran.",
];

// Bank sitasi tervalidasi (100% cocok dengan MEDIATOR_ALLOWED_AUTHORS & KNOWN_NORMALIZED_CITATIONS di eval-checks.ts)
const VALIDATED_CITATIONS: Record<DominantMediator, string[]> = {
  SLEEP_MEDIATION_DEFICIT: [
    "Mu et al. (2024) dan Wang et al. (2025) menunjukkan kualitas tidur memediasi sekitar 41% manfaat aktivitas fisik terhadap pemulihan stres mahasiswa.",
    "Wang et al. (2025) menemukan bahwa aktivitas fisik ringan-sedang berkorelasi positif dengan peningkatan kualitas tidur dan pemulihan stres akademik.",
    "Menurut Mu et al. (2024), menjaga kualitas tidur memperkuat peran gerak aktif dalam meredakan kelelahan mental mahasiswa.",
    "Mu et al. (2024) dan Wang et al. (2025) menegaskan bahwa pemulihan tidur adalah jalur penting agar aktivitas fisik optimal menekan stres.",
  ],
  SEDENTARY_OVERLOAD: [
    "Barbosa et al. (2024) dan Su et al. (2022) menunjukkan bahwa memecah durasi duduk panjang dengan gerak singkat membantu memperbaiki suasana hati dan mengurangi ketegangan.",
    "Su et al. (2022) menemukan jeda berdiri atau berjalan singkat di sela waktu duduk berkorelasi dengan penurunan keluhan fisik dan stres.",
    "Menurut Barbosa et al. (2024), mengurangi waktu duduk beruntun lewat jeda aktif membantu menjaga kenyamanan tubuh dan fokus mahasiswa.",
    "Barbosa et al. (2024) dan Su et al. (2022) menekankan pentingnya memutus duduk statis berkepanjangan dengan aktivitas ringan secara berkala.",
  ],
  LOW_MVPA_VOLUME: [
    "Zhang et al. (2024) dan Ai et al. (2021) menunjukkan aktivitas fisik rutin, termasuk intensitas ringan-sedang, membantu menjaga ketahanan mental mahasiswa.",
    "Ai et al. (2021) menemukan bahwa volume gerak harian yang konsisten berkorelasi dengan suasana hati yang lebih stabil.",
    "Menurut Zhang et al. (2024), meningkatkan aktivitas fisik harian secara bertahap efektif mendukung kesehatan psikologis mahasiswa.",
    "Zhang et al. (2024) dan Ai et al. (2021) menegaskan bahwa gerak aktif teratur membantu mengurangi rasa lesu dan memperkuat daya tahan stres.",
  ],
  EXAM_ACUTE_STRESS: [
    "Wu & Zhou (2024) menunjukkan sesi aktivitas fisik ringan-sedang yang singkat membantu menurunkan ketegangan akademik akut secara efektif.",
    "Menurut Wu & Zhou (2024), jeda gerak singkat di masa ujian berperan meredakan stres akut dan menjaga kestabilan emosi mahasiswa.",
    "Wu & Zhou (2024) menemukan bahwa aktivitas aerobik ringan singkat dapat membantu menenangkan respons stres saat beban ujian meningkat.",
  ],
  OPTIMAL_BALANCE: [
    "Keseimbangan gerak, tidur, dan jeda aktif yang terjaga mendukung ketahanan stres mahasiswa sesuai kerangka Martín-Rodríguez & González-Prieto (2026).",
    "Martín-Rodríguez & González-Prieto (2026) menekankan bahwa menjaga harmoni tiga pilar harian memperkuat kesehatan mental-fisik mahasiswa secara berkelanjutan.",
    "Sesuai kerangka Martín-Rodríguez & González-Prieto (2026), konsistensi ritme harian yang seimbang membantu mempertahankan ketahanan terhadap tekanan kuliah.",
  ],
};

// Bank pertanyaan Out-of-Scope beragam
const OUT_OF_SCOPE_PROMPTS = [
  "Tolong buatkan kode Python untuk sorting array pakai quicksort.",
  "Gimana cara memperbaiki error CORS di Express.js?",
  "Resep nasi goreng kampung yang enak dan cepat dong.",
  "Siapa pemenang Liga Champions tahun 2024?",
  "Tolong terjemahkan paragraf bahasa Inggris ini ke bahasa Jepang.",
  "Rekomendasi HP 3 jutaan terbaik buat main game berat apa ya?",
  "Hitung integral dari x^2 + 3x dx langkah demi langkah.",
  "Menurutmu saham bank mana yang paling cuan bulan ini?",
  "Buatkan caption Instagram estetik buat foto sunset di pantai.",
  "Apa ramalan zodiak Leo minggu ini soal percintaan?",
  "Bantu aku bikin surat lamaran kerja untuk posisi backend engineer.",
  "Kenapa Wi-Fi laptopku sering putus nyambung di Windows 11?",
  "Rekomendasi film horor Indonesia terbaru yang seru dong.",
  "Jelaskan perbedaan hukum Newton 1, 2, dan 3 beserta contohnya.",
  "Gimana cara top up diamond Mobile Legends yang paling murah?",
  "Buatkan ringkasan sejarah Perang Dunia II dalam 5 poin.",
  "Apa bedanya SQL dan NoSQL untuk database skala besar?",
  "Tolong bikinkan pantun lucu buat acara makrab himpunan.",
  "Harga tiket pesawat Jakarta ke Bali bulan depan berapa ya?",
  "Bagaimana cara merawat tanaman monstera supaya daunnya nggak kuning?",
  "Tolong selesaikan soal matriks determinan 3x3 ini.",
  "Rekomendasi cafe estetik buat nongkrong di Bandung dong.",
  "Buatkan query MySQL JOIN 3 tabel untuk sistem kasir.",
  "Siapa presiden pertama Republik Indonesia dan kapan lahirnya?",
  "Kasih tips menang main catur pembukaan Sicilian Defense.",
  "Bagaimana cara install Docker di Ubuntu 24.04?",
  "Tolong buatkan puisi romantis tentang hujan di bulan November.",
  "Apa spesifikasi lengkap RTX 4060 vs RTX 3050?",
  "Bantu bikin ide bisnis modal kecil untuk anak kos.",
  "Jelaskan proses fotosintesis pada tumbuhan tingkat tinggi.",
];

const OUT_OF_SCOPE_SUMMARIES = [
  "Pertanyaan ini di luar cakupan CampusFlow Coach. Saya fokus mendampingi keseimbangan belajar, aktivitas fisik, tidur, dan pengelolaan stres mahasiswa.",
  "Topik tersebut di luar cakupan CampusFlow Coach. Kamu bisa bertanya seputar jeda aktif, kualitas tidur, rasa lelah, pegal, atau cara mengelola stres kuliah.",
  "Maaf, permintaan ini di luar cakupan layanan CampusFlow Coach yang berfokus pada kesehatan fisik-mental dan ritme belajar mahasiswa.",
  "Hal tersebut di luar cakupan CampusFlow Coach. Kalau kamu ingin berdiskusi soal burnout, kurang tidur, pegal duduk lama, atau stres ujian, saya siap bantu.",
];

const OUT_OF_SCOPE_PLANS = [
  "Tidak ada rencana aksi kesehatan karena topik di luar cakupan CampusFlow Coach.",
  "Silakan ajukan pertanyaan terkait kesejahteraan mahasiswa, jeda gerak, tidur, atau stres akademik untuk mendapatkan rencana aksi.",
  "Rencana aksi tidak dibuat karena permintaan ini di luar cakupan wellbeing kampus.",
];

const OUT_OF_SCOPE_CITATIONS = [
  "Tidak ada sitasi klinis karena pertanyaan berada di luar cakupan CampusFlow Coach.",
  "Sitasi wellbeing tidak diterapkan karena topik berada di luar cakupan layanan.",
];

const MEDIATOR_BASE_RANGES: Record<
  DominantMediator,
  { durationMinutesRange: [number, number]; metsRange: [number, number] }
> = {
  SLEEP_MEDIATION_DEFICIT: { durationMinutesRange: [15, 30], metsRange: [180, 260] },
  SEDENTARY_OVERLOAD: { durationMinutesRange: [10, 20], metsRange: [170, 240] },
  LOW_MVPA_VOLUME: { durationMinutesRange: [15, 25], metsRange: [160, 220] },
  EXAM_ACUTE_STRESS: { durationMinutesRange: [10, 20], metsRange: [150, 200] },
  OPTIMAL_BALANCE: { durationMinutesRange: [10, 20], metsRange: [200, 260] },
};

interface BuiltRow {
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>;
  expectation: EvalExpectation;
}

function buildWellbeingRow(
  rng: () => number,
  mediator: DominantMediator,
  opts: { escalation: boolean; missingCheckIn: boolean; skipApplied: boolean }
): BuiltRow {
  const { escalation, missingCheckIn, skipApplied } = opts;

  // Hitung allowedRanges sesuai aturan klinis CampusFlow
  const base = MEDIATOR_BASE_RANGES[mediator];
  let durRange: [number, number] = [...base.durationMinutesRange];
  let metsRange: [number, number] = [...base.metsRange];

  if (escalation) {
    durRange = [5, 12];
    metsRange = [80, 160];
  }

  let consecutiveSkips = 0;
  let previousRecommendedMets: number | null = null;
  if (skipApplied) {
    consecutiveSkips = randInt(rng, 2, 4);
    const reduction = Math.min(0.4, 0.15 + (consecutiveSkips - 2) * 0.1);
    previousRecommendedMets = randInt(rng, base.metsRange[0], base.metsRange[1]);
    metsRange = [
      Math.max(80, Math.round(metsRange[0] * (1 - reduction))),
      Math.max(100, Math.round(metsRange[1] * (1 - reduction))),
    ];
    durRange = [
      Math.max(5, Math.round(durRange[0] * (1 - reduction))),
      Math.max(8, Math.round(durRange[1] * (1 - reduction))),
    ];
  }

  const chosenDuration = randInt(rng, durRange[0], durRange[1]);
  const chosenMets = randInt(rng, metsRange[0], metsRange[1]);

  // Bangun telemetri realistis sesuai mediator
  const totalSedentaryHours =
    mediator === "SEDENTARY_OVERLOAD"
      ? randFloat(rng, 9.0, 12.5)
      : randFloat(rng, 4.0, 8.2);
  const totalMvpaMinutes =
    mediator === "LOW_MVPA_VOLUME"
      ? randInt(rng, 0, 18)
      : mediator === "OPTIMAL_BALANCE"
      ? randInt(rng, 35, 65)
      : randInt(rng, 10, 35);
  const sleepHours = missingCheckIn
    ? null
    : mediator === "SLEEP_MEDIATION_DEFICIT"
    ? randFloat(rng, 3.5, 5.8)
    : mediator === "OPTIMAL_BALANCE"
    ? randFloat(rng, 7.2, 8.6)
    : randFloat(rng, 6.2, 7.8);
  const sleepQualityScore = missingCheckIn
    ? null
    : mediator === "SLEEP_MEDIATION_DEFICIT"
    ? randInt(rng, 1, 2)
    : mediator === "OPTIMAL_BALANCE"
    ? randInt(rng, 4, 5)
    : randInt(rng, 3, 4);
  const pss4TotalScore = missingCheckIn
    ? null
    : escalation
    ? randInt(rng, 10, 15)
    : mediator === "EXAM_ACUTE_STRESS"
    ? randInt(rng, 7, 9)
    : mediator === "OPTIMAL_BALANCE"
    ? randInt(rng, 1, 4)
    : randInt(rng, 4, 8);

  const flags: DominantMediator[] = mediator === "OPTIMAL_BALANCE" ? [] : [mediator];
  if (!missingCheckIn && mediator !== "OPTIMAL_BALANCE" && rng() < 0.35) {
    const extraCandidates: DominantMediator[] = [
      "SLEEP_MEDIATION_DEFICIT",
      "SEDENTARY_OVERLOAD",
      "LOW_MVPA_VOLUME",
    ].filter((m) => m !== mediator) as DominantMediator[];
    if (extraCandidates.length > 0) {
      flags.push(pick(rng, extraCandidates));
    }
  }

  const activeDirectives: string[] = [];
  if (escalation) {
    activeDirectives.push(
      "ESKALASI_AKTIF: WAJIB sebutkan ajakan lembut berbicara dengan konselor kampus di diagnosisSummary dan isi isotemporalActionPlan hanya dengan relaksasi ringan."
    );
  }
  if (missingCheckIn) {
    activeDirectives.push(
      "CHECKIN_BELUM_DIISI: pss4TotalScore null. Jangan mengasumsikan kondisi tidur atau stres dan WAJIB ajak mengisi check-in harian di diagnosisSummary."
    );
  }
  if (skipApplied) {
    activeDirectives.push(
      "ADAPTASI_SKIP: turunkan target ke rentang ringan dalam allowedRanges (penurunan wajar maks -40%)."
    );
  }

  // Pilih skenario & susun narasi yang bervariasi
  const scenarios = MEDIATOR_SCENARIOS[mediator];
  const scenario = pick(rng, scenarios);

  let userNotes: string;
  let diagnosisSummary: string;
  let isotemporalActionPlan: string;

  if (escalation) {
    userNotes = pick(rng, ESCALATION_NOTES);
    const opener = pick(rng, ESCALATION_OPENERS);
    const closer = pick(rng, ESCALATION_COUNSELOR_CLOSERS);
    diagnosisSummary = `${opener} ${closer}`;
    const gentleAction = pick(rng, ESCALATION_GENTLE_PLANS);
    const timing = pick(rng, ["sekarang", "sore ini", "sebelum tidur"] as const);
    const gentleEnd = pick(rng, [
      "untuk memberi tubuh dan pikiranmu ruang jeda yang aman.",
      "agar detak ketegangan turun perlahan tanpa memaksakan diri.",
      "supaya napas dan tubuhmu terasa sedikit lebih tenang.",
    ]);
    isotemporalActionPlan = `Coba ${gentleAction} selama ${chosenDuration} menit ${timing} ${gentleEnd}`;
  } else if (missingCheckIn) {
    userNotes = pick(rng, MISSING_CHECKIN_NOTES);
    const opener = pick(rng, MISSING_CHECKIN_OPENERS);
    const prompt = pick(rng, MISSING_CHECKIN_PROMPTS);
    diagnosisSummary = `${opener} ${prompt}`;
    const verb = pick(rng, scenario.actionVerbs);
    const timing = pick(rng, ["sekarang", "sore ini"] as const);
    const benefit = pick(rng, [
      "agar badan terasa lebih segar dan sirkulasi kembali lancar.",
      "supaya kekakuan otot berkurang dan fokus belajarmu terjaga.",
      "untuk menjaga energi tetap stabil di sela kegiatan kampus.",
    ]);
    // Pastikan tidak ada kata "tidur" atau "semalam" jika sleepHours null
    isotemporalActionPlan = `Yuk ${verb} selama ${chosenDuration} menit ${timing} ${benefit}`.replace(
      /\b(tidur|semalam)\b/gi,
      "istirahat"
    );
  } else {
    userNotes = pick(rng, scenario.notes);
    const opener = pick(rng, scenario.summaryOpeners);
    const closer = pick(rng, scenario.summaryClosers);
    diagnosisSummary = `${opener} ${closer}`;
    const verb = pick(rng, scenario.actionVerbs);
    const timing = pick(rng, scenario.timings);
    const benefit = pick(rng, scenario.actionBenefits);
    const lead = pick(rng, [
      "Coba",
      "Yuk",
      "Luangkan waktu untuk",
      "Mulai dengan",
      "Sisihkan waktu untuk",
    ]);
    const skipNote = skipApplied
      ? pick(rng, [
          " Target hari ini sengaja dibuat lebih ringan agar tetap nyaman dijalani.",
          " Kita mulai dari porsi yang lebih ramah dulu supaya mudah diselesaikan.",
          "",
        ])
      : "";
    isotemporalActionPlan = `${lead} ${verb} selama ${chosenDuration} menit ${timing} ${benefit}${skipNote}`;
  }

  const scientificCitationNote = pick(rng, VALIDATED_CITATIONS[mediator]);

  const userPayload = {
    activeDirectives,
    clinicalRuleEvaluation: {
      dominantMediator: mediator,
      priorityMediator: mediator,
      flags,
      escalationFlag: escalation,
      missingDailyCheckIn: missingCheckIn,
    },
    allowedRanges: {
      durationMinutesRange: durRange,
      metsRange,
    },
    skipAdaptation: {
      applied: skipApplied,
      consecutiveSkips,
      previousRecommendedMets,
    },
    today: {
      totalSedentaryHours,
      totalMvpaMinutes,
      mvpaPerSedentaryRatio: Number((totalMvpaMinutes / Math.max(1, totalSedentaryHours)).toFixed(2)),
      sleepHours,
      sleepQualityScore,
      pss4TotalScore,
      triadPillarsMet: mediator === "OPTIMAL_BALANCE" ? 3 : randInt(rng, 0, 2),
      dailySteps:
        mediator === "LOW_MVPA_VOLUME"
          ? randInt(rng, 600, 2600)
          : mediator === "OPTIMAL_BALANCE"
          ? randInt(rng, 6200, 10500)
          : randInt(rng, 1800, 5500),
    },
    userNotes,
  };

  const assistantPayload = {
    dominantMediator: mediator,
    diagnosisSummary,
    isotemporalActionPlan,
    recommendedMetsToday: chosenMets,
    scientificCitationNote,
  };

  return {
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: JSON.stringify(userPayload) },
      { role: "assistant", content: JSON.stringify(assistantPayload) },
    ],
    expectation: {
      expectedMediator: mediator,
      metsRange,
      durationMinutesRange: durRange,
      escalationFlag: escalation,
      missingDailyCheckIn: missingCheckIn,
      sleepHoursIsNull: sleepHours === null,
      outOfScope: false,
      skipApplied,
    },
  };
}

function buildOutOfScopeRow(rng: () => number): BuiltRow {
  const userNotes = pick(rng, OUT_OF_SCOPE_PROMPTS);
  const userPayload = {
    activeDirectives: ["OUT_OF_SCOPE: Tolak sopan karena pertanyaan di luar cakupan wellbeing kampus."],
    clinicalRuleEvaluation: {
      dominantMediator: "OPTIMAL_BALANCE" as DominantMediator,
      priorityMediator: "OPTIMAL_BALANCE" as DominantMediator,
      flags: [],
      escalationFlag: false,
      missingDailyCheckIn: false,
    },
    allowedRanges: {
      durationMinutesRange: [10, 20] as [number, number],
      metsRange: [0, 100] as [number, number],
    },
    skipAdaptation: {
      applied: false,
      consecutiveSkips: 0,
      previousRecommendedMets: null,
    },
    today: {
      totalSedentaryHours: randFloat(rng, 4.0, 7.5),
      totalMvpaMinutes: randInt(rng, 25, 45),
      mvpaPerSedentaryRatio: 5.5,
      sleepHours: randFloat(rng, 7.0, 8.0),
      sleepQualityScore: 4,
      pss4TotalScore: randInt(rng, 2, 5),
      triadPillarsMet: 3,
      dailySteps: randInt(rng, 4500, 7500),
    },
    userNotes,
  };

  const assistantPayload = {
    dominantMediator: "OPTIMAL_BALANCE" as DominantMediator,
    diagnosisSummary: pick(rng, OUT_OF_SCOPE_SUMMARIES),
    isotemporalActionPlan: pick(rng, OUT_OF_SCOPE_PLANS),
    recommendedMetsToday: 0,
    scientificCitationNote: pick(rng, OUT_OF_SCOPE_CITATIONS),
  };

  return {
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: JSON.stringify(userPayload) },
      { role: "assistant", content: JSON.stringify(assistantPayload) },
    ],
    expectation: {
      expectedMediator: "OPTIMAL_BALANCE",
      metsRange: [0, 100],
      durationMinutesRange: [10, 20],
      escalationFlag: false,
      missingDailyCheckIn: false,
      sleepHoursIsNull: false,
      outOfScope: true,
      skipApplied: false,
    },
  };
}

function generateSet(targetTotal: number, seed: number): BuiltRow[] {
  const rng = createRng(seed);
  const mediators: DominantMediator[] = [
    "SLEEP_MEDIATION_DEFICIT",
    "SEDENTARY_OVERLOAD",
    "LOW_MVPA_VOLUME",
    "EXAM_ACUTE_STRESS",
    "OPTIMAL_BALANCE",
  ];

  const oosCount = Math.round(targetTotal * 0.14); // 14% out-of-scope
  const wellbeingCount = targetTotal - oosCount;
  const rows: BuiltRow[] = [];
  const seenPairs = new Set<string>();

  for (let i = 0; i < wellbeingCount; i++) {
    const mediator = mediators[i % mediators.length];
    // Distribusi skenario edge-case realistis:
    // ~18% escalation, ~12% missingCheckIn (non-SLEEP agar konsisten), ~22% skipAdaptation
    const r = rng();
    const escalation = mediator !== "OPTIMAL_BALANCE" && r < 0.22;
    const missingCheckIn =
      !escalation &&
      (mediator === "SEDENTARY_OVERLOAD" || mediator === "LOW_MVPA_VOLUME") &&
      r >= 0.22 &&
      r < 0.45;
    const skipApplied = rng() < 0.25;

    let built: BuiltRow | null = null;
    for (let attempt = 0; attempt < 25; attempt++) {
      const candidate = buildWellbeingRow(rng, mediator, {
        escalation,
        missingCheckIn,
        skipApplied,
      });
      const ans = JSON.parse(candidate.messages[2].content);
      const key = `${ans.diagnosisSummary}|||${ans.isotemporalActionPlan}`;
      if (!seenPairs.has(key) || attempt === 24) {
        seenPairs.add(key);
        built = candidate;
        break;
      }
    }
    if (built) rows.push(built);
  }

  for (let i = 0; i < oosCount; i++) {
    rows.push(buildOutOfScopeRow(rng));
  }

  return shuffle(rng, rows);
}

function validateAll(name: string, rows: BuiltRow[]) {
  let failed = 0;
  const uniqueNotes = new Set<string>();
  const uniqueSummaries = new Set<string>();
  const uniquePlans = new Set<string>();
  const mediatorCounts: Record<string, number> = {};
  let oos = 0;
  let esc = 0;
  let missing = 0;
  let skip = 0;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const u = JSON.parse(row.messages[1].content);
    const a = JSON.parse(row.messages[2].content);
    const check = evaluateInsightResponse(a, true, row.expectation);
    if (!check.specialistPass) {
      failed++;
      if (failed <= 5) {
        console.error(`[FAIL ${name} #${i}]`, check.failedRules, a);
      }
    }
    uniqueNotes.add(u.userNotes);
    uniqueSummaries.add(a.diagnosisSummary);
    uniquePlans.add(a.isotemporalActionPlan);
    const m = row.expectation.outOfScope ? "OUT_OF_SCOPE" : a.dominantMediator;
    mediatorCounts[m] = (mediatorCounts[m] || 0) + 1;
    if (row.expectation.outOfScope) oos++;
    if (row.expectation.escalationFlag) esc++;
    if (row.expectation.missingDailyCheckIn) missing++;
    if (row.expectation.skipApplied) skip++;
  }

  console.log(`\n=== ${name} ===`);
  console.log({
    total: rows.length,
    specialistPass: rows.length - failed,
    failed,
    uniqueNotes: uniqueNotes.size,
    uniqueSummaries: uniqueSummaries.size,
    uniquePlans: uniquePlans.size,
    oos,
    esc,
    missing,
    skip,
    mediatorCounts,
  });

  if (failed > 0) {
    throw new Error(`${name} memiliki ${failed} baris yang gagal specialistPass!`);
  }
}

function main() {
  // Backup file lama sekali saja jika belum ada .v1.bak
  if (fs.existsSync(TRAIN_OUT) && !fs.existsSync(`${TRAIN_OUT}.v1.bak`)) {
    fs.copyFileSync(TRAIN_OUT, `${TRAIN_OUT}.v1.bak`);
  }
  if (fs.existsSync(VAL_OUT) && !fs.existsSync(`${VAL_OUT}.v1.bak`)) {
    fs.copyFileSync(VAL_OUT, `${VAL_OUT}.v1.bak`);
  }

  const trainRows = generateSet(1000, 20261126);
  const valRows = generateSet(120, 99991126);

  validateAll("TRAIN", trainRows);
  validateAll("VAL", valRows);

  fs.writeFileSync(
    TRAIN_OUT,
    trainRows.map((r) => JSON.stringify({ messages: r.messages })).join("\n") + "\n",
    "utf8"
  );
  fs.writeFileSync(
    VAL_OUT,
    valRows.map((r) => JSON.stringify({ messages: r.messages })).join("\n") + "\n",
    "utf8"
  );

  console.log(`\nBerhasil menulis:\n- ${TRAIN_OUT} (${trainRows.length} baris)\n- ${VAL_OUT} (${valRows.length} baris)`);
}

main();
