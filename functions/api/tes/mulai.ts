// POST /api/tes/mulai  { kelas, jenis: 'materi'|'kompetensi', sesiId?, persona? }
// Membuat sesi baru (atau melanjutkan sesi lama) dan melaporkan bagian yang tersedia untuk jenis tes itu.
import { type Env, json, gagal, bacaBody, idAcak, hashIp, isSesiId, isPersona, isJenis, targetSoal, MATERI, materiUntukKelas, KOMPETENSI } from '../../../lib/tes';

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const body = await bacaBody<{ kelas?: number; sesiId?: string; persona?: string; jenis?: string }>(request);
  const jenis = isJenis((body as { jenis?: string })?.jenis) ? (body as { jenis: 'materi' | 'kompetensi' }).jenis : 'materi';
  // Tes kompetensi khusus guru; peran hanya dipakai pada tes materi.
  let persona: string = jenis === 'kompetensi' ? 'guru' : isPersona(body?.persona) ? body!.persona : 'guru';
  // Tes kompetensi: satu tes untuk semua guru → kelas 0. Tes materi: kelas 1–6.
  const kelas = jenis === 'kompetensi' ? 0 : Number(body?.kelas);
  if (jenis === 'materi' && (!Number.isInteger(kelas) || kelas < 1 || kelas > 6)) return gagal('Kelas tidak valid');

  let sesiId: string | null = null;
  if (isSesiId(body?.sesiId)) {
    const lama = await env.DB.prepare('SELECT id, persona FROM sesi WHERE id = ? AND kelas = ? AND jenis = ?')
      .bind(body!.sesiId, kelas, jenis).first<{ id: string; persona: string }>();
    if (lama) {
      sesiId = lama.id;
      if (jenis === 'kompetensi' || !isPersona(body?.persona)) persona = lama.persona;
      else await env.DB.prepare('UPDATE sesi SET persona = ? WHERE id = ?').bind(persona, sesiId).run();
    }
  }

  if (!sesiId) {
    const ipHash = await hashIp(request, env.IP_SALT);
    const sejak = Date.now() - 24 * 3600 * 1000;
    const batas = Number(env.BATAS_SESI_HARIAN ?? 30);
    const n = await env.DB.prepare('SELECT COUNT(*) AS n FROM sesi WHERE ip_hash = ? AND dibuat > ?')
      .bind(ipHash, sejak).first<{ n: number }>();
    if ((n?.n ?? 0) >= batas) return gagal('Batas percobaan hari ini sudah tercapai. Silakan coba lagi besok.', 429);
    sesiId = idAcak(24);
    await env.DB.prepare('INSERT INTO sesi (id, kelas, ip_hash, dibuat, persona, jenis) VALUES (?, ?, ?, ?, ?, ?)')
      .bind(sesiId, kelas, ipHash, Date.now(), persona, jenis).run();
  }

  const [tersediaRows, progres] = await Promise.all([
    env.DB.prepare('SELECT mapel, COUNT(*) AS n, COUNT(DISTINCT bab) AS b FROM soal WHERE kelas = ? AND aktif = 1 GROUP BY mapel')
      .bind(kelas).all<{ mapel: string; n: number; b: number }>(),
    env.DB.prepare('SELECT mapel, jumlah, benar, selesai, rincian, persentil, persentil_acuan, butir, mulai, akhir, json_array_length(jawaban) AS terjawab FROM sesi_mapel WHERE sesi_id = ?')
      .bind(sesiId).all<{ mapel: string; jumlah: number; benar: number | null; selesai: number; terjawab: number; rincian: string | null; persentil: number | null; persentil_acuan: number | null; butir: string | null; mulai: number; akhir: number | null }>(),
  ]);

  const bagian: readonly string[] = jenis === 'kompetensi' ? KOMPETENSI : materiUntukKelas(kelas);
  const tersedia: Record<string, number> = {};
  for (const m of jenis === 'kompetensi' ? KOMPETENSI : MATERI) tersedia[m] = 0;
  for (const r of tersediaRows.results) if (bagian.includes(r.mapel)) tersedia[r.mapel] = targetSoal(env, r.mapel, r.n, r.b);

  const mapel: Record<string, unknown> = {};
  for (const r of progres.results) {
    if (!bagian.includes(r.mapel)) continue;
    mapel[r.mapel] = r.selesai
      ? {
        status: 'selesai', benar: r.benar, jumlah: r.jumlah, skor: Math.round(((r.benar ?? 0) / r.jumlah) * 100),
        rincian: r.rincian ? JSON.parse(r.rincian) : undefined, persentil: r.persentil, persentilAcuan: r.persentil_acuan === 1, butir: r.butir ? JSON.parse(r.butir) : undefined,
        detik: r.akhir ? Math.round((r.akhir - r.mulai) / 1000) : undefined,
      }
      : { status: 'berjalan', terjawab: r.terjawab, jumlah: r.jumlah };
  }

  return json({ sesiId, kelas, jenis, persona, tersedia, mapel });
};
