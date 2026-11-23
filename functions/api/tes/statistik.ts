// GET /api/tes/statistik — jumlah guru yang sudah menyelesaikan minimal satu mapel (untuk "bukti sosial" di beranda).
// Di-cache 10 menit di edge supaya murah.
import { type Env, json } from '../../../lib/tes';

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  const { results } = await env.DB.prepare(
    'SELECT kelas, COUNT(DISTINCT sesi_id) AS n FROM sesi_mapel WHERE selesai = 1 AND kelas IS NOT NULL GROUP BY kelas',
  ).all<{ kelas: number; n: number }>();
  const perKelas: Record<string, number> = {};
  let total = 0;
  for (const r of results) { perKelas[r.kelas] = r.n; total += r.n; }
  const res = json({ total, perKelas });
  res.headers.set('cache-control', 'public, max-age=600');
  return res;
};
