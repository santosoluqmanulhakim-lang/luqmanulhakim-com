// POST /api/tes/mapel  { sesiId, mapel }
// Memulai satu mapel: memilih soal, mengacak urutan opsi. Bila sudah berjalan, melanjutkan.
//   Materi (ipas/mtk/bi): SOAL_PER_BAB soal dari SETIAP bab (bawaan 2 × 8 bab = 16), supaya semua bab terwakili.
//   Kompetensi (cp/islam): SOAL_KOMPETENSI soal dengan komposisi level KOMPOSISI_LEVEL (bawaan 10; 30/40/30).
// Urutan tampil: pemahaman → penerapan → HOTS.
import { type Env, type Level, type Mapel, json, gagal, bacaBody, acak, isMapel, isSesiId, kuotaLevel, targetSoal, LEVEL, MATERI, materiUntukKelas } from '../../../lib/tes';

type Baris = { id: string; tipe: string; opsi: string | null; level: Level; bab: number | null };

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const body = await bacaBody<{ sesiId?: string; mapel?: string }>(request);
  if (!isSesiId(body?.sesiId) || !isMapel(body?.mapel)) return gagal('Permintaan tidak valid');
  const { sesiId, mapel } = body as { sesiId: string; mapel: Mapel };

  const sesi = await env.DB.prepare('SELECT kelas, jenis FROM sesi WHERE id = ?').bind(sesiId).first<{ kelas: number; jenis: string }>();
  if (!sesi) return gagal('Sesi tidak ditemukan', 404);
  const materi = (MATERI as readonly string[]).includes(mapel);
  if ((sesi.jenis === 'kompetensi') === materi) return gagal('Bagian ini bukan milik tes ini', 400);
  if (materi && !materiUntukKelas(sesi.kelas).includes(mapel)) return gagal('Mapel ini tidak tersedia untuk kelas tersebut', 400);

  const ada = await env.DB.prepare(
    'SELECT jumlah, selesai, json_array_length(jawaban) AS terjawab FROM sesi_mapel WHERE sesi_id = ? AND mapel = ?',
  ).bind(sesiId, mapel).first<{ jumlah: number; selesai: number; terjawab: number }>();
  if (ada) {
    if (ada.selesai) return gagal('Bagian ini sudah selesai dikerjakan', 409);
    return json({ jumlah: ada.jumlah, terjawab: ada.terjawab });
  }

  const { results: semua } = await env.DB.prepare(
    'SELECT id, tipe, opsi, level, bab FROM soal WHERE kelas = ? AND mapel = ? AND aktif = 1',
  ).bind(sesi.kelas, mapel).all<Baris>();
  if (!semua.length) return gagal('Soal untuk bagian ini belum tersedia', 404);

  const daftarBab = [...new Set(semua.map((s) => s.bab).filter((b): b is number => b !== null))];
  const target = targetSoal(env, mapel, semua.length, materi ? daftarBab.length : 0);
  let pilih: Baris[] = [];

  if (materi && daftarBab.length) {
    const perBab = Number(env.SOAL_PER_BAB ?? 2);
    for (const b of daftarBab) pilih.push(...acak(semua.filter((s) => s.bab === b)).slice(0, perBab));
  } else {
    const kuota = kuotaLevel(target, env.KOMPOSISI_LEVEL);
    for (const l of LEVEL) pilih.push(...acak(semua.filter((s) => s.level === l)).slice(0, kuota[l]));
  }
  // Kekurangan (bab dengan soal < SOAL_PER_BAB, atau level yang kurang) diisi acak dari sisa bank.
  if (pilih.length < target) {
    const sudah = new Set(pilih.map((s) => s.id));
    pilih.push(...acak(semua.filter((s) => !sudah.has(s.id))).slice(0, target - pilih.length));
  }

  const urut = (l: string) => Math.max(0, LEVEL.indexOf(l as Level));
  pilih = acak(pilih).sort((a, b) => urut(a.level) - urut(b.level));

  const soalIds = pilih.map((r) => r.id);
  const urutan = pilih.map((r) => (r.tipe === 'pg' && r.opsi ? acak(Object.keys(JSON.parse(r.opsi))) : ['benar', 'salah']));

  await env.DB.prepare(
    'INSERT INTO sesi_mapel (sesi_id, mapel, kelas, soal_ids, urutan_opsi, jumlah, mulai) VALUES (?, ?, ?, ?, ?, ?, ?)',
  ).bind(sesiId, mapel, sesi.kelas, JSON.stringify(soalIds), JSON.stringify(urutan), soalIds.length, Date.now()).run();

  return json({ jumlah: soalIds.length, terjawab: 0 });
};
