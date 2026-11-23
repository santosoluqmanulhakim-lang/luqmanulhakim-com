-- Tes Kompetensi Guru menjadi SATU tes untuk semua guru (tanpa fase/kelas).
-- Soal pedagogis ('cp') dan adab ('islam') disimpan sekali dengan kelas = 0 ("semua").
-- Salinan lama per kelas (id "KG-01@k1" … "KG-01@k6") digabung kembali menjadi "KG-01".
CREATE TABLE soal_baru (
  id          TEXT PRIMARY KEY,
  kelas       INTEGER NOT NULL CHECK (kelas BETWEEN 0 AND 6),   -- 0 = semua (kompetensi & adab)
  mapel       TEXT NOT NULL CHECK (mapel IN ('ipas','mtk','bi','cp','islam')),
  tipe        TEXT NOT NULL CHECK (tipe IN ('pg','bs')),
  pertanyaan  TEXT NOT NULL,
  opsi        TEXT,
  kunci       TEXT NOT NULL,
  rujukan     TEXT,
  aktif       INTEGER NOT NULL DEFAULT 1,
  level       TEXT NOT NULL DEFAULT 'mots',
  stimulus    TEXT,
  bab         INTEGER,
  judul_bab   TEXT
);
INSERT INTO soal_baru (id, kelas, mapel, tipe, pertanyaan, opsi, kunci, rujukan, aktif, level, stimulus, bab, judul_bab)
  SELECT id, kelas, mapel, tipe, pertanyaan, opsi, kunci, rujukan, aktif, level, stimulus, bab, judul_bab
  FROM soal WHERE mapel NOT IN ('cp','islam');
INSERT OR IGNORE INTO soal_baru (id, kelas, mapel, tipe, pertanyaan, opsi, kunci, rujukan, aktif, level, stimulus, bab, judul_bab)
  SELECT CASE WHEN instr(id, '@k') > 0 THEN substr(id, 1, instr(id, '@k') - 1) ELSE id END,
         0, mapel, tipe, pertanyaan, opsi, kunci, rujukan, aktif, level, stimulus, NULL, judul_bab
  FROM soal WHERE mapel IN ('cp','islam') ORDER BY id;
DROP TABLE soal;
ALTER TABLE soal_baru RENAME TO soal;
CREATE INDEX IF NOT EXISTS idx_soal_kelas_mapel ON soal (kelas, mapel, aktif);
CREATE INDEX IF NOT EXISTS idx_soal_level ON soal (kelas, mapel, aktif, level);
CREATE INDEX IF NOT EXISTS idx_soal_bab ON soal (kelas, mapel, aktif, bab);
