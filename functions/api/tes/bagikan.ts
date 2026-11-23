// POST /api/tes/bagikan  { sesiId }
// Membuat snapshot hasil sesuai progres saat ini dan mengembalikan tautan yang bisa dibagikan.
import { type Env, json, gagal, bacaBody, idAcak, isSesiId, susunHasil, isPersona, type DataHasil, type Mapel } from '../../../lib/tes';

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const body = await bacaBody<{ sesiId?: string }>(request);
  if (!isSesiId(body?.sesiId)) return gagal('Permintaan tidak valid');

  const sesi = await env.DB.prepare('SELECT kelas, persona, jenis FROM sesi WHERE id = ?').bind(body!.sesiId).first<{ kelas: number; persona: string; jenis: string }>();
  if (!sesi) return gagal('Sesi tidak ditemukan', 404);

  const { results } = await env.DB.prepare('SELECT mapel, benar, jumlah, rincian, persentil, persentil_acuan, butir, mulai, akhir FROM sesi_mapel WHERE sesi_id = ? AND selesai = 1')
    .bind(body!.sesiId).all<{ mapel: Mapel; benar: number; jumlah: number; rincian: string | null; persentil: number | null; persentil_acuan: number | null; butir: string | null; mulai: number; akhir: number | null }>();
  if (!results.length) return gagal('Selesaikan minimal satu mapel sebelum membagikan hasil');

  const batas = Number(env.BATAS_MENGUASAI ?? 80);
  const mapel: DataHasil['mapel'] = {};
  for (const r of results) {
    mapel[r.mapel] = {
      benar: r.benar, jumlah: r.jumlah, skor: Math.round((r.benar / r.jumlah) * 100),
      rincian: r.rincian ? JSON.parse(r.rincian) : undefined,
      persentil: r.persentil, persentilAcuan: r.persentil_acuan === 1, butir: r.butir ? JSON.parse(r.butir) : undefined,
      detik: r.akhir ? Math.round((r.akhir - r.mulai) / 1000) : undefined,
    };
  }
  const data: DataHasil = susunHasil(sesi.kelas, mapel, batas, isPersona(sesi.persona) ? sesi.persona : 'guru', sesi.jenis === 'kompetensi' ? 'kompetensi' : 'materi');

  const id = idAcak(10);
  await env.DB.prepare('INSERT INTO hasil (id, sesi_id, kelas, data, dibuat) VALUES (?, ?, ?, ?, ?)')
    .bind(id, body!.sesiId, sesi.kelas, JSON.stringify(data), Date.now()).run();

  return json({ id, url: new URL(`/tes/hasil/${id}`, request.url).toString() });
};
