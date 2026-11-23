// POST /api/tes/soal  { sesiId, mapel }
// Mengirim SATU soal: soal yang sedang aktif. Tidak ada cara meminta soal berikutnya
// sebelum soal ini dijawab, sehingga bank soal tidak bisa diunduh sekaligus. Kunci tidak dikirim.
import { type Env, json, gagal, bacaBody, isMapel, isSesiId } from '../../../lib/tes';

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const body = await bacaBody<{ sesiId?: string; mapel?: string }>(request);
  if (!isSesiId(body?.sesiId) || !isMapel(body?.mapel)) return gagal('Permintaan tidak valid');

  const sm = await env.DB.prepare(
    'SELECT soal_ids, urutan_opsi, jawaban, jumlah, selesai, mulai FROM sesi_mapel WHERE sesi_id = ? AND mapel = ?',
  ).bind(body!.sesiId, body!.mapel).first<{ soal_ids: string; urutan_opsi: string; jawaban: string; jumlah: number; selesai: number; mulai: number }>();
  if (!sm) return gagal('Mapel belum dimulai', 404);
  if (sm.selesai) return json({ selesai: true });

  const idx = (JSON.parse(sm.jawaban) as string[]).length;
  const id = (JSON.parse(sm.soal_ids) as string[])[idx];
  const urutan = (JSON.parse(sm.urutan_opsi) as string[][])[idx];

  const s = await env.DB.prepare('SELECT tipe, pertanyaan, opsi, level, stimulus FROM soal WHERE id = ?')
    .bind(id).first<{ tipe: 'pg' | 'bs'; pertanyaan: string; opsi: string | null; level: string; stimulus: string | null }>();
  if (!s) return gagal('Soal tidak ditemukan', 500);

  const teks = s.opsi ? (JSON.parse(s.opsi) as Record<string, string>) : null;
  const opsi = s.tipe === 'pg' && teks
    ? urutan.map((k) => ({ id: k, teks: teks[k] }))
    : [{ id: 'benar', teks: 'Benar' }, { id: 'salah', teks: 'Salah' }];

  return json({
    nomor: idx + 1, jumlah: sm.jumlah, tipe: s.tipe, level: s.level, stimulus: s.stimulus,
    pertanyaan: s.pertanyaan, opsi, mulai: sm.mulai, sekarang: Date.now(),
  });
};
