-- Skema B: soal materi diambil per bab (2 per bab). Kompetensi Guru menjadi tes tersendiri.
ALTER TABLE soal ADD COLUMN bab INTEGER;                          -- nomor bab (materi); NULL untuk kompetensi/adab
CREATE INDEX IF NOT EXISTS idx_soal_bab ON soal (kelas, mapel, aktif, bab);
ALTER TABLE sesi ADD COLUMN jenis TEXT NOT NULL DEFAULT 'materi'; -- 'materi' | 'kompetensi'
