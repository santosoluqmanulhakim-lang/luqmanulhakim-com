-- Bank soal. Kolom kunci HANYA dibaca oleh Pages Function, tidak pernah dikirim ke browser.
CREATE TABLE IF NOT EXISTS soal (
  id          TEXT PRIMARY KEY,
  kelas       INTEGER NOT NULL CHECK (kelas BETWEEN 1 AND 6),
  mapel       TEXT NOT NULL CHECK (mapel IN ('ipas','mtk','bi')),
  tipe        TEXT NOT NULL CHECK (tipe IN ('pg','bs')),
  pertanyaan  TEXT NOT NULL,
  opsi        TEXT,            -- JSON {"a":"..","b":"..",...} untuk pg; NULL untuk bs
  kunci       TEXT NOT NULL,   -- "a".."e" untuk pg; "benar"/"salah" untuk bs
  rujukan     TEXT,            -- bab/halaman buku, untuk BookCTA (tidak ditampilkan per soal)
  aktif       INTEGER NOT NULL DEFAULT 1
);
CREATE INDEX IF NOT EXISTS idx_soal_kelas_mapel ON soal (kelas, mapel, aktif);

CREATE TABLE IF NOT EXISTS sesi (
  id       TEXT PRIMARY KEY,
  kelas    INTEGER NOT NULL,
  ip_hash  TEXT,
  dibuat   INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sesi_ip ON sesi (ip_hash, dibuat);

CREATE TABLE IF NOT EXISTS sesi_mapel (
  sesi_id      TEXT NOT NULL,
  mapel        TEXT NOT NULL,
  soal_ids     TEXT NOT NULL,              -- JSON array id soal terpilih
  urutan_opsi  TEXT NOT NULL,              -- JSON array urutan opsi acak per soal
  jawaban      TEXT NOT NULL DEFAULT '[]', -- JSON array jawaban peserta
  jumlah       INTEGER NOT NULL,
  benar        INTEGER,
  selesai      INTEGER NOT NULL DEFAULT 0,
  mulai        INTEGER NOT NULL,
  PRIMARY KEY (sesi_id, mapel)
);

-- Snapshot hasil yang dibagikan. Isinya tetap walau peserta lanjut mengerjakan.
CREATE TABLE IF NOT EXISTS hasil (
  id       TEXT PRIMARY KEY,
  sesi_id  TEXT NOT NULL,
  kelas    INTEGER NOT NULL,
  data     TEXT NOT NULL,
  dibuat   INTEGER NOT NULL
);
