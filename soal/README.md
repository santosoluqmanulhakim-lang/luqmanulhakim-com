# Bank soal

File di folder ini memuat KUNCI JAWABAN dan **tidak di-commit** ke GitHub (lihat `.gitignore`).
Simpan cadangannya di tempat privat (Google Drive penerbit, dsb.). Hanya `soal/contoh/` yang ikut repo.

Satu file = satu kelas + satu mapel, misalnya `soal/kelas-5/ipas.json`:

```json
{
  "kelas": 5,
  "mapel": "ipas",
  "soal": [
    {
      "id": "k5-ipas-001",
      "tipe": "pg",
      "pertanyaan": "Teks soal…",
      "opsi": { "a": "…", "b": "…", "c": "…", "d": "…" },
      "kunci": "b",
      "rujukan": "IPAS Kelas 5 Smt 1, Bab 1",
      "level": "lots"
    },
    {
      "id": "k5-ipas-003",
      "tipe": "pg",
      "level": "hots",
      "stimulus": "Data percobaan / kasus / jawaban siswa…",
      "pertanyaan": "Kesimpulan yang PALING didukung data tersebut adalah…",
      "opsi": { "a": "…", "b": "…", "c": "…", "d": "…" },
      "kunci": "a"
    },
    {
      "id": "k5-ipas-002",
      "tipe": "bs",
      "pertanyaan": "Pernyataan yang dinilai benar atau salah.",
      "kunci": "benar"
    }
  ]
}
```

- `level`: `lots`, `mots` (bawaan), atau `hots`. `stimulus`: teks kasus/bacaan opsional (maks 1200 karakter; baris baru dipertahankan).
- Contoh HOTS untuk guru: menilai kesimpulan dari data percobaan, memilih cara meluruskan miskonsepsi siswa, menganalisis jawaban siswa yang keliru.
- `mapel`: `ipas`, `mtk`, atau `bi`. `tipe`: `pg` (pilihan ganda, 2–5 opsi a–e) atau `bs` (benar/salah).
- `id` harus unik di seluruh bank. Mengimpor ulang dengan id yang sama akan **memperbarui** soal itu.
- `"aktif": false` menonaktifkan soal tanpa menghapusnya.
- Urutan opsi diacak per peserta, jadi jangan menulis opsi seperti "a dan b benar" atau "semua benar".
- Siapkan minimal 2× jumlah soal per sesi (`SOAL_PER_MAPEL`, default 20), supaya soal tidak sama setiap kali dicoba.

Impor: `npm run soal:import:local` (uji) lalu `npm run soal:import` (produksi).
