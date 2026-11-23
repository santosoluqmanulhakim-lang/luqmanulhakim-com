#!/usr/bin/env node
// Impor bank soal (JSON) ke Cloudflare D1.
//   node scripts/import-soal.mjs --local            → D1 lokal (uji coba)
//   node scripts/import-soal.mjs --remote           → D1 produksi
//   tambahkan --contoh untuk ikut mengimpor soal/contoh/*.json
// File soal ada di folder soal/ yang TIDAK di-commit (lihat .gitignore), karena memuat kunci.
import { readdirSync, readFileSync, writeFileSync, mkdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { execFileSync } from 'node:child_process';
import { csvKeBank } from './csv-soal.mjs';

const args = new Set(process.argv.slice(2));
const target = args.has('--remote') ? '--remote' : args.has('--local') ? '--local' : null;
if (!target) { console.error('Pakai --local atau --remote'); process.exit(1); }
const ikutContoh = args.has('--contoh');

const ROOT = 'soal';
function semuaJson(dir) {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) return (n === 'contoh' && !ikutContoh) ? [] : semuaJson(p);
    return n.endsWith('.json') || n.endsWith('.csv') ? [p] : [];
  });
}

const sql = (v) => (v === null || v === undefined ? 'NULL' : typeof v === 'number' ? String(v) : `'${String(v).replace(/'/g, "''")}'`);
const galat = [];
const baris = [];
const ids = new Set();
const peringatan = [];
const ringkas = {}; // "kelas-mapel" → {lots,mots,hots}
const LEVEL = ['lots', 'mots', 'hots'];

for (const file of semuaJson(ROOT)) {
  const nama = relative('.', file);
  let doc;
  if (file.endsWith('.csv')) doc = csvKeBank(readFileSync(file, 'utf8'), galat, nama); // unduhan CSV dari Google Sheets
  else try { doc = JSON.parse(readFileSync(file, 'utf8')); } catch (e) { galat.push(`${nama}: JSON tidak valid (${e.message})`); continue; }
  // Dua format diterima: format per file (kelas+mapel di atas) dan format bank gabungan
  // seperti bank_soal_k5.json (setiap soal membawa kategori/mapel/kelas sendiri).
  if (!doc.soal?.length && file.endsWith('.csv')) continue;
  const grup = Array.isArray(doc.soal) && doc.soal.some((x) => x && 'kategori' in x) ? dariBankGabungan(doc, nama) : [doc];
  for (const g of grup) prosesFile(g, nama);
}

function prosesFile(doc, nama) {
  const { mapel, soal } = doc;
  // "kelas": 5  atau  "kelas": [5, 6]  (CP per fase)  atau  "kelas": [1,2,3,4,5,6]  (berlaku semua kelas)
  const daftarKelas = Array.isArray(doc.kelas) ? doc.kelas : [doc.kelas];
  // Kompetensi & adab: satu tes untuk semua guru → selalu disimpan sekali dengan kelas 0 (isian kelas diabaikan).
  if (mapel === 'cp' || mapel === 'islam') daftarKelas.splice(0, daftarKelas.length, 0);
  else if (!daftarKelas.length || daftarKelas.some((k) => !Number.isInteger(k) || k < 1 || k > 6)) galat.push(`${nama}: "kelas" harus 1–6 atau daftar seperti [5, 6]`);
  if (!['ipas', 'mtk', 'bi', 'cp', 'islam'].includes(mapel)) galat.push(`${nama}: "mapel" harus ipas, mtk, bi, cp, atau islam`);
  if (!Array.isArray(soal) || !soal.length) { galat.push(`${nama}: "soal" kosong`); return; }

  soal.forEach((s, i) => {
    const di = `${nama} soal #${i + 1}${s.id ? ` (${s.id})` : ''}`;
    if (!s.id || !/^[A-Za-z0-9_-]{3,60}$/.test(s.id)) galat.push(`${di}: "id" wajib, huruf/angka/-/_`);
    else if (ids.has(s.id)) galat.push(`${di}: id ganda`);
    else ids.add(s.id);
    if (!s.pertanyaan?.trim()) galat.push(`${di}: "pertanyaan" kosong`);
    if (s.tipe === 'pg') {
      const kunciOpsi = Object.keys(s.opsi ?? {});
      if (kunciOpsi.length < 2 || kunciOpsi.length > 5 || kunciOpsi.some((k) => !/^[a-e]$/.test(k))) galat.push(`${di}: "opsi" harus 2–5 pilihan berlabel a–e`);
      if (!kunciOpsi.includes(s.kunci)) galat.push(`${di}: "kunci" harus salah satu dari ${kunciOpsi.join(', ')}`);
    } else if (s.tipe === 'bs') {
      if (!['benar', 'salah'].includes(s.kunci)) galat.push(`${di}: "kunci" soal benar-salah harus "benar" atau "salah"`);
    } else galat.push(`${di}: "tipe" harus "pg" atau "bs"`);
    const level = s.level ?? 'mots';
    if (!LEVEL.includes(level)) galat.push(`${di}: "level" harus lots, mots, atau hots`);
    if (s.stimulus !== undefined && (typeof s.stimulus !== 'string' || !s.stimulus.trim())) galat.push(`${di}: "stimulus" harus teks`);
    if (s.stimulus && s.stimulus.length > 1200) galat.push(`${di}: "stimulus" terlalu panjang (maks 1200 karakter)`);
    for (const kelas of daftarKelas) {
    if (s.aktif !== false) {
      const k = kelas === 0 ? `Kompetensi ${mapel === 'cp' ? 'pedagogis' : 'adab'}` : `Kelas ${kelas} ${mapel}`;
      ringkas[k] ??= { lots: 0, mots: 0, hots: 0 };
      if (LEVEL.includes(level)) ringkas[k][level]++;
    }
    // Soal yang berlaku untuk beberapa kelas disimpan sekali per kelas: id + "@k" + kelas.
    const idDb = daftarKelas.length > 1 ? `${s.id}@k${kelas}` : s.id;
    baris.push(`INSERT OR REPLACE INTO soal (id,kelas,mapel,tipe,pertanyaan,opsi,kunci,rujukan,aktif,level,stimulus,bab,judul_bab) VALUES (${[
      sql(idDb), sql(kelas), sql(mapel), sql(s.tipe), sql(s.pertanyaan?.trim()),
      sql(s.tipe === 'pg' ? JSON.stringify(s.opsi) : null), sql(s.kunci), sql(s.rujukan ?? null), sql(s.aktif === false ? 0 : 1),
      sql(s.level ?? 'mots'), sql(s.stimulus?.trim() ?? null), sql(Number.isInteger(s.bab) ? s.bab : null), sql(s.judul_bab?.trim() || null),
    ].join(',')});`);
    }
  });
}

/**
 * Format bank gabungan (bank_soal_k5.json):
 *   kategori materi → mapel ipas/mtk/bi per kelas
 *   kategori kompetensi → 'cp' (CP 2025, pedagogi, asesmen); kategori adab → 'islam' (Adab Guru)
 *   kelas null → berlaku untuk semua kelas 1–6
 *   opsi array → {a,b,c,d}; kunci "B" → "b"; kunci true/false → "benar"/"salah"; level "HOTS" → "hots"
 *   "soal" → pertanyaan, "sumber" → rujukan. "pembahasan" tidak diimpor (tidak pernah dikirim ke peserta).
 */
function dariBankGabungan(doc, nama) {
  const PETA = { IPAS: 'ipas', MTK: 'mtk', BI: 'bi' };
  const kelompok = new Map();
  doc.soal.forEach((x, i) => {
    let mapel;
    if (x.kategori === 'materi') mapel = PETA[String(x.mapel).toUpperCase()];
    else if (x.kategori === 'kompetensi') mapel = 'cp';
    else if (x.kategori === 'adab') mapel = 'islam';
    if (!mapel) { galat.push(`${nama} soal #${i + 1} (${x.id}): kategori/mapel tidak dikenal (${x.kategori}/${x.mapel})`); return; }
    const kelas = mapel === 'cp' || mapel === 'islam' ? [0] : x.kelas == null ? [1, 2, 3, 4, 5, 6] : [x.kelas];
    const kunciK = `${mapel}|${kelas.join(',')}`;
    if (!kelompok.has(kunciK)) kelompok.set(kunciK, { mapel, kelas, soal: [] });
    const opsi = Array.isArray(x.opsi) ? Object.fromEntries(x.opsi.map((t, j) => ['abcde'[j], t])) : x.opsi;
    const pembahasanMenyebutHuruf = /\b[Oo]psi [A-E]\b/.test(x.pembahasan ?? '');
    if (pembahasanMenyebutHuruf) peringatan.push(`${x.id}: pembahasan menyebut huruf opsi, padahal urutan opsi diacak per peserta`);
    kelompok.get(kunciK).soal.push({
      id: x.id, tipe: x.tipe, pertanyaan: x.soal ?? x.pertanyaan, opsi: x.tipe === 'pg' ? opsi : undefined,
      kunci: x.tipe === 'bs' ? (x.kunci === true ? 'benar' : x.kunci === false ? 'salah' : x.kunci) : String(x.kunci).toLowerCase(),
      level: String(x.level ?? 'mots').toLowerCase(), stimulus: x.stimulus, rujukan: x.sumber ?? x.rujukan, aktif: x.aktif,
      bab: x.kategori === 'materi' && Number.isInteger(x.bab) ? x.bab : undefined, judul_bab: x.judul_bab,
    });
  });
  return [...kelompok.values()];
}

for (const p of peringatan) console.warn('  ⚠ ' + p);
if (galat.length) { console.error('Impor dibatalkan:\n- ' + galat.join('\n- ')); process.exit(1); }
if (!baris.length) { console.error('Tidak ada soal ditemukan di folder soal/.'); process.exit(1); }

mkdirSync('.wrangler/tmp', { recursive: true });
const out = '.wrangler/tmp/import-soal.sql';
writeFileSync(out, baris.join('\n') + '\n');
console.log(`${baris.length} soal siap diimpor (${target.slice(2)}).`);
console.table(Object.fromEntries(Object.entries(ringkas).map(([k, v]) => [k, { ...v, total: v.lots + v.mots + v.hots }])));
for (const [k, v] of Object.entries(ringkas)) {
  // Skema B: materi 2 soal × 8 bab = 16 per sesi; kompetensi 10 pedagogis + 10 adab per sesi.
  const perSesi = k.startsWith('Kompetensi') ? 10 : 16;
  const t = v.lots + v.mots + v.hots;
  if (t < perSesi * 2) console.warn(`  ⚠ ${k}: ${t} soal aktif; disarankan ≥ ${perSesi * 2} (2× soal per sesi) supaya soal bervariasi antarsesi.`);
}

execFileSync('npx', ['wrangler', 'd1', 'execute', 'tes-guru', target, '--file', out], { stdio: 'inherit', shell: process.platform === 'win32' });
