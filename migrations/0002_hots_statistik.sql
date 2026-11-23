-- Level kognitif soal (LOTS/MOTS/HOTS) + stimulus kasus/bacaan untuk soal HOTS.
ALTER TABLE soal ADD COLUMN level TEXT NOT NULL DEFAULT 'mots';  -- 'lots' | 'mots' | 'hots'
ALTER TABLE soal ADD COLUMN stimulus TEXT;                        -- teks kasus/bacaan/data, opsional
CREATE INDEX IF NOT EXISTS idx_soal_level ON soal (kelas, mapel, aktif, level);

-- Data untuk persentil ("lebih tinggi dari X% guru") dan rincian per level.
ALTER TABLE sesi_mapel ADD COLUMN kelas INTEGER;
ALTER TABLE sesi_mapel ADD COLUMN skor INTEGER;
ALTER TABLE sesi_mapel ADD COLUMN rincian TEXT;      -- JSON {"lots":[benar,jumlah],...}
ALTER TABLE sesi_mapel ADD COLUMN persentil INTEGER; -- dihitung saat mapel selesai; NULL bila peserta masih sedikit
ALTER TABLE sesi_mapel ADD COLUMN akhir INTEGER;     -- waktu selesai (ms)
CREATE INDEX IF NOT EXISTS idx_sm_statistik ON sesi_mapel (kelas, mapel, selesai, skor);
