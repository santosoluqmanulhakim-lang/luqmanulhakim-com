// GET /tes/hasil/:id — halaman hasil yang dibagikan, dirender di server supaya
// pratinjau tautan WhatsApp/Facebook menampilkan skor (meta Open Graph).
import { type Env, type DataHasil } from '../../../lib/tes';
import { halamanHasil } from '../../../lib/kartu';

export const onRequestGet: PagesFunction<Env> = async ({ params, env, request }) => {
  const id = String(params.id ?? '');
  if (!/^[A-Za-z0-9]{6,20}$/.test(id)) return new Response('Hasil tidak ditemukan', { status: 404 });
  const row = await env.DB.prepare('SELECT data FROM hasil WHERE id = ?').bind(id).first<{ data: string }>();
  if (!row) return new Response('Hasil tidak ditemukan', { status: 404 });
  const asal = new URL(request.url).origin;
  return new Response(halamanHasil(JSON.parse(row.data) as DataHasil, id, asal), {
    headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'public, max-age=3600' },
  });
};
