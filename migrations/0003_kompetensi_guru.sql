-- Penilaian kedua: kompetensi guru — 'cp' (Capaian Pembelajaran 2025 sesuai fase) dan 'islam' (wawasan keislaman).
-- SQLite tidak bisa mengubah CHECK, jadi tabel soal dibangun ulang dengan data tetap utuh.
CREATE TABLE soal_baru (
  id          TEXT PRIMARY KEY,
  kelas       INTEGER NOT NULL CHECK (kelas BETWEEN 1 AND 6),
  mapel       TEXT NOT NULL CHECK (mapel IN ('ipas','mtk','bi','cp','islam')),
  tipe        TEXT NOT NULL CHECK (tipe IN ('pg','bs')),
  pertanyaan  TEXT NOT NULL,
  opsi        TEXT,
  kunci       TEXT NOT NULL,
  rujukan     TEXT,
  aktif       INTEGER NOT NULL DEFAULT 1,
  level       TEXT NOT NULL DEFAULT 'mots',
  stimulus    TEXT
);
INSERT INTO soal_baru (id, kelas, mapel, tipe, pertanyaan, opsi, kunci, rujukan, aktif, level, stimulus)
  SELECT id, kelas, mapel, tipe, pertanyaan, opsi, kunci, rujukan, aktif, level, stimulus FROM soal;
DROP TABLE soal;
ALTER TABLE soal_baru RENAME TO soal;
CREATE INDEX IF NOT EXISTS idx_soal_kelas_mapel ON soal (kelas, mapel, aktif);
CREATE INDEX IF NOT EXISTS idx_soal_level ON soal (kelas, mapel, aktif, level);

-- 1 bila persentil dihitung terhadap skor ACUAN (peserta asli belum cukup), 0 bila terhadap peserta asli.
ALTER TABLE sesi_mapel ADD COLUMN persentil_acuan INTEGER;
