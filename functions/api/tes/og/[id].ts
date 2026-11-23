// GET /api/tes/og/:id — gambar kartu hasil 1080×1350 (PNG) untuk pratinjau tautan & unduhan.
// Memakai workers-og (Satori + resvg). Bila gagal, dialihkan ke gambar umum /tes/og-umum.png.
import { ImageResponse } from 'workers-og';
import { type Env, type DataHasil } from '../../../../lib/tes';

// Font dilayani dari situs sendiri (public/tes/fonts), tanpa bergantung ke Google Fonts.
async function font(env: Env & { ASSETS: Fetcher }, url: URL, berat: number): Promise<ArrayBuffer> {
  const r = await env.ASSETS.fetch(new URL(`/tes/fonts/plus-jakarta-sans-latin-${berat}-normal.woff`, url));
  if (!r.ok) throw new Error(`font ${berat} tidak ditemukan`);
  return r.arrayBuffer();
}
import { kartuOg } from '../../../../lib/kartu';

export const onRequestGet: PagesFunction<Env & { ASSETS: Fetcher }> = async ({ params, env, request }) => {
  const id = String(params.id ?? '');
  const umum = Response.redirect(new URL('/tes/og-umum.png', request.url).toString(), 302);
  if (!/^[A-Za-z0-9]{6,20}$/.test(id)) return umum;
  const row = await env.DB.prepare('SELECT data FROM hasil WHERE id = ?').bind(id).first<{ data: string }>();
  if (!row) return umum;
  try {
    const situs = new URL(request.url).host + '/tes';
    const html = kartuOg(JSON.parse(row.data) as DataHasil, situs);
    const url = new URL(request.url);
    const [f700, f800] = await Promise.all([font(env, url, 700), font(env, url, 800)]);
    return new ImageResponse(html, {
      width: 1080,
      height: 1350,
      fonts: [
        { name: 'Plus Jakarta Sans', data: f700, weight: 700, style: 'normal' },
        { name: 'Plus Jakarta Sans', data: f800, weight: 800, style: 'normal' },
      ],
      headers: { 'cache-control': 'public, max-age=86400, immutable' },
    });
  } catch (err) {
    console.error('og gagal', err);
    return umum;
  }
};
