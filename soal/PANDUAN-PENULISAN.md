# Panduan menulis bank soal Tes Guru SDIT

Tempel isi file ini ke **instruksi proyek** Claude, lalu unggah naskah per kelas/mapel ke pengetahuan proyek.
Satu percakapan = satu kelas + satu mapel. Hasil percakapan berupa satu file JSON → simpan ke `soal/kelas-N/<mapel>.json`.

## Aturan umum
- Peserta tes adalah **guru**, bukan siswa. Soal menguji penguasaan materi dan kemampuan mengajarkannya.
- Materi: **10 soal per bab** (8 bab = 80 per mapel per kelas). Tes mengambil 2 soal per bab, jadi `bab` wajib diisi.
- Kompetensi & adab: kumpulan terpisah, ≥ 20 pedagogis dan ≥ 20 adab (tes mengambil 10 + 10).
- Campuran tipe: ±70% `pg` (4 opsi a–d), ±30% `bs`.
- Setiap soal wajib punya `rujukan` (mis. "IPAS K5 Smt 2 Bab 6 — Sub-bab B"), dan isinya harus bisa dibuktikan dari naskah.
- Opsi diacak per peserta: jangan pakai "semua benar", "a dan b benar", atau opsi yang merujuk huruf.
- Pengecoh harus masuk akal (miskonsepsi yang sering muncul), panjangnya setara dengan kunci.
- Hindari kata "bayangkan". Ayat/hadits ditulis dengan nomor surah:ayat atau perawinya; jangan menafsirkan berlebihan.

## Arti level
- `lots` — mengingat/memahami istilah, fakta, konsep inti di naskah.
- `mots` — menerapkan konsep pada contoh baru, menghitung, mengklasifikasi.
- `hots` — memakai `stimulus` (data percobaan, kasus kelas, jawaban siswa yang keliru, rancangan pembelajaran),
  lalu guru menganalisis, menilai, atau memilih tindakan pedagogis terbaik.

## Mapel kompetensi
- `cp`: berdasarkan dokumen **CP 2025** (unggah dokumennya). `"kelas": [5, 6]` untuk Fase C, `[3, 4]` Fase B, `[1, 2]` Fase A.
  Uji: pembagian fase, elemen tiap mapel, rumusan capaian akhir fase, kesesuaian kegiatan dengan CP.
- `islam`: wawasan keislaman yang dibutuhkan guru SDIT untuk integrasi materi (aqidah, adab, sirah, ayat/hadits
  yang relevan dengan materi sains & bahasa). `"kelas": [1,2,3,4,5,6]` bila umum.

## Format
Lihat `soal/README.md` dan contoh di `soal/contoh/`. Validasi akhir: `npm run soal:import:local`.
