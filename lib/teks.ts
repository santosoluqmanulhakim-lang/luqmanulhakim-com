// ============================================================================
//  SEMUA KATA-KATA TES GURU SDIT ADA DI FILE INI.
//  Ubah teks di antara tanda kutip, simpan, lalu commit & push (Cloudflare membangun ulang otomatis).
//  Dipakai bersama oleh halaman tes (browser) dan halaman hasil / kartu WhatsApp (server).
//  Bagian bertanda `(x) =>` berisi isian otomatis, mis. ${kelas}; jangan hapus tanda ${...}-nya.
//  Teks beranda ada di src/pages/tes/index.astro (HTML biasa).
//  Setelah mengubah: hentikan `npm run cf:dev` (Ctrl+C) lalu jalankan lagi — perubahan tidak otomatis terbaca.
// ============================================================================

export type Mapel = 'ipas' | 'mtk' | 'bi' | 'cp' | 'islam';
export type Level = 'lots' | 'mots' | 'hots';
export type Persona = 'guru' | 'ortu' | 'umum';

// ---- Nama mapel / bagian -----------------------------------------------------
export const NAMA_MAPEL: Record<Mapel, string> = {
  ipas: 'IPAS', mtk: 'Matematika', bi: 'Bahasa Indonesia', cp: 'Pedagogis', islam: 'Adab Guru',
};
export const NAMA_PENDEK: Record<Mapel, string> = {
  ipas: 'IPAS', mtk: 'MTK', bi: 'B. Indo', cp: 'Pedagogis', islam: 'Adab',
};
export const IKON: Record<Mapel, string> = { ipas: '🌱', mtk: '📐', bi: '📖', cp: '🎯', islam: '🤲' };
export const KET_KOMPETENSI: Record<'cp' | 'islam', string> = {
  cp: 'CP 2025, pembelajaran mendalam, asesmen',
  islam: "Tadzkiratus Sami' wal Mutakallim, Tuhfatul Maudud",
};
export const NAMA_LEVEL: Record<Level, string> = { lots: 'Pemahaman', mots: 'Penerapan', hots: 'HOTS' };

// ---- Peran peserta (tes materi) ------------------------------------------------
export const PERSONA: { id: Persona; label: string }[] = [
  { id: 'guru', label: 'Guru' },
  { id: 'ortu', label: 'Orang tua' },
  { id: 'umum', label: 'Ingin tahu' },
];

// ---- Predikat -------------------------------------------------------------------
const SEBUTAN: Record<Persona, string> = { guru: 'Guru', ortu: 'Orang Tua', umum: 'Pembelajar' };
export function predikat(skor: number, persona: Persona = 'guru'): string {
  const s = SEBUTAN[persona];
  if (skor >= 90) return `${s} Hebat`;
  if (skor >= 75) return `${s} Teladan`;
  if (skor >= 60) return `${s} Bertumbuh`;
  return 'Terus Belajar';
}

// ---- Sapaan di layar skor ---------------------------------------------------------
export function sapaan(skor: number): string {
  if (skor >= 90) return 'MasyaAllah, luar biasa!';
  if (skor >= 75) return 'Alhamdulillah, bagus sekali!';
  if (skor >= 60) return 'Alhamdulillah, terus bertumbuh!';
  return 'Tetap semangat belajar!';
}

// ---- Kalimat hasil (halaman hasil & kartu WhatsApp) ---------------------------------
/** Dipakai dalam kalimat "Selanjutnya perlu menambah pengetahuan terkait …" */
export const FRASA_SARAN: Record<Mapel, string> = {
  ipas: 'materi IPAS', mtk: 'materi Matematika', bi: 'materi Bahasa Indonesia',
  cp: 'pedagogis (CP 2025, pembelajaran, asesmen)', islam: 'adab guru',
};
export const KALIMAT = {
  menguasaiMateri: (persen: number, lingkup: string, kelas: number) => `Alhamdulillah, saya menguasai ${persen}% ${lingkup} Kelas ${kelas}`,
  skorMateriRendah: (persen: number, lingkup: string, kelas: number) => `Skor ${lingkup} Kelas ${kelas} saya: ${persen}`,
  skorKompetensi: (skor: number) => `Alhamdulillah, skor Kompetensi Guru saya ${skor}`,
  skorKompetensiRendah: (skor: number) => `Skor Kompetensi Guru saya: ${skor}`,
  perluMenambah: (daftar: string) => `Selanjutnya perlu menambah pengetahuan terkait ${daftar}.`,
  kompetensiKuat: 'MasyaAllah, kompetensi pedagogis dan adab guru sudah kuat.',
  lanjutMapelLain: (kelas: number) => `Selanjutnya: selesaikan mapel lain Kelas ${kelas}.`,
  materiKuat: {
    guru: (kelas: number) => `MasyaAllah, materi Kelas ${kelas} sudah kuat. Uji juga Kompetensi Guru.`,
    ortu: (kelas: number) => `MasyaAllah, siap mendampingi anak belajar Kelas ${kelas}.`,
    umum: (kelas: number) => `MasyaAllah, materi SD Kelas ${kelas} masih melekat kuat. Anda berani coba?`,
  } as Record<Persona, (kelas: number) => string>,
  tantang: (namaTes: string, skor: number, pred: string) =>
    `Assalamu'alaikum, saya baru ikut ${namaTes} dan dapat ${skor}/100 (${pred}). Berani coba dan kalahkan skor saya?`,
  ajakanBagikan: 'Berani coba juga?',
};

// ---- Tombol & label di layar tes -----------------------------------------------------
export const UI = {
  judulMateri: (kelas: number) => `Kelas ${kelas} · Penguasaan Materi`,
  judulKompetensi: 'Tes Kompetensi Guru',
  sayaAdalah: 'Saya:',
  pilihMapel: 'Pilih mapel — tes langsung dimulai',
  infoMapel: (n: number) => `${n} soal · 2 dari setiap bab`,
  soalSegera: 'Fase A IPAS terintegrasi',
  selesaiSkor: (skor: number) => `Selesai · skor ${skor}`,
  lanjutkan: (terjawab: number, jumlah: number) => `Lanjutkan · ${terjawab}/${jumlah}`,
  soalKe: (n: number, total: number) => `Soal ${n} dari ${total}`,
  cermati: 'Cermati',
  simpanLanjut: 'Simpan & lanjut',
  simpanSelesai: 'Simpan & lihat skor',
  menyimpan: 'Menyimpan…',
  petunjukPg: 'A–D atau 1–4 untuk memilih · Enter untuk menyimpan',
  petunjukBs: 'B = benar · S = salah · Enter untuk menyimpan',
  jawabanTerkunci: 'Jawaban terkunci setelah disimpan.',
  tepat: (benar: number, jumlah: number) => `${benar} dari ${jumlah} soal tepat`,
  waktu: (m: string) => `Waktu ${m}`,
  persentilAcuan: (p: number) => `Lebih tinggi dari ${p}% skor acuan`,
  persentilPeserta: (p: number, lingkup: string) => `Lebih tinggi dari ${p}% peserta ${lingkup}`,
  belumTepatJudul: (n: number) => `${n} soal belum tepat`,
  semuaTepat: 'Semua soal terjawab tepat. MasyaAllah!',
  belumTepatKet: 'Kunci jawaban tidak ditampilkan. Pelajari ulang bab berikut di buku.',
  lanjutKe: (nama: string) => `Lanjut ${nama}`,
  bagikanSkor: (nama: string) => `Bagikan skor ${nama}`,
  bagikanSejauhIni: 'Bagikan skor sejauh ini',
  bagikanKelas: (kelas: number) => `🎉 Bagikan hasil Kelas ${kelas}`,
  bagikanHasil: '🎉 Lihat & bagikan hasil',
  kembaliPilihMapel: 'Pilih mapel lain',
  ulangi: '↻ Ulangi tes (soal baru)',
  ulangiYakin: 'Mulai tes baru dengan soal acak baru? Hasil sebelumnya tetap tersimpan di tautan yang sudah dibagikan.',
  ujiKompetensi: 'Tes Kompetensi Guru →',
  ujiMateri: 'Tes penguasaan materi →',
  memuatSoal: (nama: string) => `Menyiapkan soal ${nama}…`,
  memuatKartu: 'Menyiapkan kartu hasil…',
  cobaLagi: 'Coba lagi',
  galatKoneksi: 'Koneksi terputus. Periksa internet Anda lalu coba lagi.',
  galatUmum: 'Terjadi kesalahan. Silakan coba lagi.',
  bukuJudul: 'Ingin mendalami lebih lanjut? Ingin tahu jawabannya?',
  bukuMateri: (mapel: string, kelas: number) => `Materi tes ini ada di buku ${mapel} Kelas ${kelas} terbitan Penerbit Luqmanulhakim.`,
  bukuKompetensi: 'Panduan guru, CP, Ringkasan Tadzkiratus Sami dan  catatan untuk guru bisa di download di situs Penerbit Luqmanulhakim.',
  bukuTombol: 'Lihat buku kami →',
};

// ---- Header, footer, kotak buku (semua halaman tes) -----------------------------------
export const SITUS = {
  nama: 'Uji Materi SDIT',
  penerbit: 'Penerbit Luqmanulhakim',
  tautanBuku: 'Materi Uji',
  footer: 'Uji Materi SDIT · Penerbit Luqmanulhakim · Kunci jawaban tidak ditampilkan agar tes tetap adil.',
  bukuJudul: 'Ingin mendalami lebih lanjut? Ingin tahu jawabannya?',
  bukuKetUmum: 'Semua materi tes ini ada di buku SDIT terbitan Penerbit Luqmanulhakim.',
  bukuTombol: 'Lihat buku kami →',
};

// ---- Halaman hasil yang dibagikan & kartu gambar WhatsApp ------------------------------
export const HASIL = {
  labelKompetensi: 'TES KOMPETENSI GURU',
  labelSatuMapel: (mapel: string, kelas: number) => `TES GURU SDIT · ${mapel.toUpperCase()} · KELAS ${kelas}`,
  labelMateri: (kelas: number, selesai: number, total: number) => `TES GURU SDIT · MATERI KELAS ${kelas} · ${selesai} DARI ${total} MAPEL`,
  kotakKompetensi: 'KOMPETENSI GURU · PEDAGOGIS & ADAB',
  kotakMateri: (kelas: number) => `PENGUASAAN MATERI KELAS ${kelas}`,
  belumDiuji: 'Belum diuji',
  belumDikerjakan: 'Belum dikerjakan',
  hotsKartu: (benar: number, jumlah: number) => `${benar} dari ${jumlah} soal berpikir tingkat tinggi`,
  ajakanKartu: 'Berani coba juga?',
  deskripsiKompetensi: 'Tes Kompetensi Guru SDIT: pedagogis (CP 2025, pembelajaran, asesmen) dan adab guru.',
  deskripsiMateri: 'Tes Guru SDIT: penguasaan materi IPAS, Matematika, dan Bahasa Indonesia.',
  namaTesKompetensi: 'Tes Kompetensi Guru SDIT',
  namaTesMateri: (kelas: number) => `Tes Guru SDIT Kelas ${kelas}`,
  skorAcuan: 'skor acuan',
  pesertaKompetensi: (bagian: string) => `peserta ${bagian}`,
  pesertaMateri: (mapel: string, kelas: number) => `peserta ${mapel} Kelas ${kelas}`,
  lebihTinggi: (persen: number, pembanding: string) => `Lebih tinggi dari ${persen}% ${pembanding}`,
  grupKompetensi: 'Kompetensi guru · pedagogis & adab',
  grupMateri: (kelas: number) => `Materi Kelas ${kelas}`,
  rincianJudul: 'Rincian per jenis soal',
  bagikanJudul: 'Bagikan hasil',
  salin: 'Salin',
  tersalin: 'Tersalin ✓',
  kartu: 'Kartu',
  tantangJudul: '⚔️ Ajak rekan guru',
  tantangKet: 'Kirim ke grup KKG/MGMP sekolah Anda. Siapa yang skornya paling tinggi?',
  tantangTombol: 'Kirim ajakan',
  ujiMateri: 'Uji penguasaan materi',
  ujiKompetensi: 'Uji Kompetensi Guru (pedagogis & adab)',
  cobaKelasLain: 'Kelas lain',
  tesMateri: 'Tes materi',
  belumDikerjakanDaftar: (daftar: string) => `Belum dikerjakan: ${daftar}.`,
  cobaTesIni: 'Coba tes ini',
  cobaTesKelas: (kelas: number) => `Ulangi tes Kelas ${kelas}`,
  bagikanTombol: 'Bagikan hasil',
};
