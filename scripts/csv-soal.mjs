// Konversi bank soal antara sheet (CSV) dan JSON.
// Kolom sheet = KOLOM di bawah (sama dengan template "Bank Soal Tes Guru SDIT.xlsx").

export const KOLOM = [
  'id', 'kategori', 'mapel', 'kelas', 'bab', 'judul_bab', 'tipe', 'level', 'stimulus', 'soal',
  'opsi_a', 'opsi_b', 'opsi_c', 'opsi_d', 'kunci', 'pembahasan', 'sumber', 'aktif', 'status_review', 'catatan_review',
];

/** Pengurai CSV (RFC 4180): tanda petik, koma dan baris baru di dalam sel. */
export function bacaCsv(teks) {
  const baris = [];
  let sel = '', row = [], petik = false;
  teks = teks.replace(/^﻿/, '');
  for (let i = 0; i < teks.length; i++) {
    const c = teks[i];
    if (petik) {
      if (c === '"' && teks[i + 1] === '"') { sel += '"'; i++; }
      else if (c === '"') petik = false;
      else sel += c;
    } else if (c === '"') petik = true;
    else if (c === ',') { row.push(sel); sel = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && teks[i + 1] === '\n') i++;
      row.push(sel); baris.push(row); row = []; sel = '';
    } else sel += c;
  }
  if (sel !== '' || row.length) { row.push(sel); baris.push(row); }
  return baris.filter((r) => r.some((x) => x.trim() !== ''));
}

const tulisSel = (v) => {
  const s = v === null || v === undefined ? '' : String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
export const tulisCsv = (rows) => '﻿' + rows.map((r) => r.map(tulisSel).join(',')).join('\r\n') + '\r\n';

/** Baris CSV → objek soal format bank gabungan (seperti bank_soal_k5.json). */
export function csvKeBank(teks, galat, nama) {
  const rows = bacaCsv(teks);
  if (!rows.length) return { soal: [] };
  const kepala = rows[0].map((h) => h.trim().toLowerCase());
  const kurang = ['id', 'kategori', 'tipe', 'soal', 'kunci'].filter((k) => !kepala.includes(k));
  if (kurang.length) { galat.push(`${nama}: kolom wajib tidak ada: ${kurang.join(', ')}`); return { soal: [] }; }
  const soal = [];
  rows.slice(1).forEach((r, i) => {
    const o = Object.fromEntries(kepala.map((k, j) => [k, (r[j] ?? '').trim()]));
    if (!o.id || o.id.startsWith('#')) return;                 // baris kosong / komentar
    if (/^ditolak$/i.test(o.status_review)) return;            // tidak diimpor
    const di = `${nama} baris ${i + 2} (${o.id})`;
    const tipe = o.tipe.toLowerCase();
    let kunci = o.kunci.toUpperCase();
    if (tipe === 'bs') {
      if (kunci === 'BENAR' || kunci === 'B' || kunci === 'TRUE') kunci = true;
      else if (kunci === 'SALAH' || kunci === 'S' || kunci === 'FALSE') kunci = false;
      else galat.push(`${di}: kunci benar-salah harus BENAR atau SALAH`);
    }
    const opsi = ['opsi_a', 'opsi_b', 'opsi_c', 'opsi_d'].map((k) => o[k]).filter((x) => x);
    soal.push({
      id: o.id, kategori: o.kategori.toLowerCase(), mapel: o.mapel,
      kelas: o.kelas === '' ? null : Number(o.kelas),
      bab: o.bab === '' ? null : Number(o.bab), judul_bab: o.judul_bab || undefined,
      tipe, level: o.level || 'MOTS', stimulus: o.stimulus || undefined, soal: o.soal,
      opsi: tipe === 'pg' ? opsi : undefined, kunci,
      pembahasan: o.pembahasan || undefined, sumber: o.sumber || undefined,
      aktif: /^(tidak|no|false|0)$/i.test(o.aktif) ? false : undefined,
    });
  });
  return { soal };
}

/** Objek bank gabungan → baris CSV. */
export function bankKeCsv(bank) {
  const rows = [KOLOM];
  for (const s of bank.soal) {
    const opsi = Array.isArray(s.opsi) ? s.opsi : s.opsi ? Object.values(s.opsi) : [];
    const kunci = s.tipe === 'bs' ? (s.kunci === true || s.kunci === 'benar' ? 'BENAR' : 'SALAH') : String(s.kunci).toUpperCase();
    rows.push([
      s.id, s.kategori, s.mapel, s.kelas ?? '', s.bab ?? '', s.judul_bab ?? '', s.tipe, String(s.level ?? '').toUpperCase(),
      s.stimulus ?? '', s.soal ?? s.pertanyaan, opsi[0] ?? '', opsi[1] ?? '', opsi[2] ?? '', opsi[3] ?? '',
      kunci, s.pembahasan ?? '', s.sumber ?? s.rujukan ?? '', s.aktif === false ? 'TIDAK' : 'YA', 'draf', '',
    ]);
  }
  return tulisCsv(rows);
}

// Dipanggil langsung:  node scripts/csv-soal.mjs soal/bank_soal_k5.json   → soal/bank_soal_k5.csv
//                      node scripts/csv-soal.mjs soal/bank.csv            → soal/bank.json (untuk dicek)
import { pathToFileURL } from 'node:url';
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { readFileSync, writeFileSync } = await import('node:fs');
  const masuk = process.argv[2];
  if (!masuk) { console.error('Pakai: node scripts/csv-soal.mjs <file.json | file.csv>'); process.exit(1); }
  if (masuk.endsWith('.json')) {
    const keluar = masuk.replace(/\.json$/, '.csv');
    const bank = JSON.parse(readFileSync(masuk, 'utf8'));
    writeFileSync(keluar, bankKeCsv(bank));
    console.log(`${bank.soal.length} soal → ${keluar}. Impor ke Google Sheets: File → Impor → Unggah → "Ganti sheet saat ini".`);
  } else {
    const galat = [];
    const bank = csvKeBank(readFileSync(masuk, 'utf8'), galat, masuk);
    if (galat.length) { console.error('- ' + galat.join('\n- ')); process.exit(1); }
    const keluar = masuk.replace(/\.csv$/, '.json');
    writeFileSync(keluar, JSON.stringify({ meta: { sumber: masuk }, soal: bank.soal }, null, 1));
    console.log(`${bank.soal.length} soal → ${keluar}`);
  }
}
