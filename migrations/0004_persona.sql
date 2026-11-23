-- Peran peserta: 'guru' | 'ortu' (orang tua) | 'umum' (sekadar ingin tahu). Menentukan predikat & kalimat hasil.
ALTER TABLE sesi ADD COLUMN persona TEXT NOT NULL DEFAULT 'guru';
