-- Hasil per soal untuk peserta (tanpa kunci & tanpa teks soal): nomor, bab/topik, level, tepat/belum.
ALTER TABLE soal ADD COLUMN judul_bab TEXT;      -- judul bab (materi) atau topik (kompetensi/adab)
ALTER TABLE sesi_mapel ADD COLUMN butir TEXT;    -- JSON [{n, bab, topik, level, ok}] diisi saat bagian selesai
