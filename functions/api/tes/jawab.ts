// POST /api/tes/jawab  { sesiId, mapel, nomor, jawaban }
// Menyimpan jawaban soal aktif. Tidak memberi tahu benar/salah.
// Setelah soal terakhir: menghitung skor mapel dan mengembalikannya.
import { type Env, type Level, type Rincian, type Butir, json, gagal, bacaBody, isMapel, isSesiId, hitungPersentil } from '../../../lib/tes';

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const body = await bacaBody<{ sesiId?: string; mapel?: string; nomor?: number; jawaban?: string }>(request);
  if (!isSesiId(body?.sesiId) || !isMapel(body?.mapel) || typeof body?.jawaban !== 'string') {
    return gagal('Permintaan tidak valid');
  }
  const { sesiId, mapel, nomor, jawaban } = body as { sesiId: string; mapel: string; nomor: number; jawaban: string };

  const sm = await env.DB.prepare(
    'SELECT soal_ids, urutan_opsi, jawaban, jumlah, selesai, mulai, kelas FROM sesi_mapel WHERE sesi_id = ? AND mapel = ?',
  ).bind(sesiId, mapel).first<{ soal_ids: string; urutan_opsi: string; jawaban: string; jumlah: number; selesai: number; mulai: number; kelas: number | null }>();
  if (!sm) return gagal('Mapel belum dimulai', 404);
  if (sm.selesai) return gagal('Mapel ini sudah selesai', 409);

  const jawabanLama = JSON.parse(sm.jawaban) as string[];
  const idx = jawabanLama.length;
  if (Number(nomor) !== idx + 1) return gagal('Nomor soal tidak sesuai; muat ulang halaman', 409);
  const pilihan = (JSON.parse(sm.urutan_opsi) as string[][])[idx];
  if (!pilihan.includes(jawaban)) return gagal('Pilihan jawaban tidak valid');

  const baru = [...jawabanLama, jawaban];
  const terakhir = baru.length === sm.jumlah;

  // Hanya berhasil bila belum ada jawaban lain yang masuk lebih dulu (mencegah kirim ganda).
  const upd = await env.DB.prepare(
    'UPDATE sesi_mapel SET jawaban = ? WHERE sesi_id = ? AND mapel = ? AND json_array_length(jawaban) = ? AND selesai = 0',
  ).bind(JSON.stringify(baru), sesiId, mapel, idx).run();
  if (!upd.meta.changes) return gagal('Jawaban sudah tersimpan sebelumnya; muat ulang halaman', 409);

  if (!terakhir) return json({ ok: true, selesai: false });

  const ids = JSON.parse(sm.soal_ids) as string[];
  const marks = ids.map(() => '?').join(',');
  const { results } = await env.DB.prepare(`SELECT id, kunci, level, bab, judul_bab FROM soal WHERE id IN (${marks})`)
    .bind(...ids).all<{ id: string; kunci: string; level: Level; bab: number | null; judul_bab: string | null }>();
  const info = new Map(results.map((r) => [r.id, r]));
  let benar = 0;
  const rincian: Rincian = {};
  const butir: Butir[] = [];
  ids.forEach((id, i) => {
    const s = info.get(id);
    const lv = s?.level ?? 'mots';
    const ok = s?.kunci === baru[i];
    if (ok) benar++;
    butir.push({ n: i + 1, bab: s?.bab ?? null, topik: s?.judul_bab ?? null, level: lv, ok });
    const o = rincian[lv] ?? [0, 0];
    rincian[lv] = [o[0] + (ok ? 1 : 0), o[1] + 1];
  });
  const skor = Math.round((benar / sm.jumlah) * 100);
  const akhir = Date.now();
  const kelas = sm.kelas ?? (await env.DB.prepare('SELECT kelas FROM sesi WHERE id = ?').bind(sesiId).first<{ kelas: number }>())?.kelas ?? 0;
  // Persentil dihitung terhadap peserta SEBELUMNYA, lalu skor ini ikut disimpan.
  const p = await hitungPersentil(env, kelas, mapel, skor);
  const persentil = p?.persen ?? null;
  const persentilAcuan = p ? (p.acuan ? 1 : 0) : null;

  await env.DB.prepare(
    'UPDATE sesi_mapel SET benar = ?, skor = ?, rincian = ?, persentil = ?, persentil_acuan = ?, akhir = ?, kelas = ?, butir = ?, selesai = 1 WHERE sesi_id = ? AND mapel = ?',
  ).bind(benar, skor, JSON.stringify(rincian), persentil, persentilAcuan, akhir, kelas, JSON.stringify(butir), sesiId, mapel).run();

  return json({
    ok: true, selesai: true, benar, jumlah: sm.jumlah, skor, rincian, persentil, persentilAcuan: persentilAcuan === 1, butir,
    detik: Math.round((akhir - sm.mulai) / 1000),
  });
};
