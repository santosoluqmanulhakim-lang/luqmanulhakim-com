import { NAMA_MAPEL, FRASA_SARAN, NAMA_LEVEL, KALIMAT, predikat, type Persona } from './teks';
export { NAMA_MAPEL, FRASA_SARAN, NAMA_LEVEL, predikat, type Persona };

// Pustaka bersama untuk Pages Functions Tes Guru SDIT. Kata-kata ada di lib/teks.ts.
// Berjalan di server Cloudflare saja — jangan diimpor dari kode browser.

export interface Env {
  DB: D1Database;
  IP_SALT?: string;
  SOAL_PER_MAPEL?: string;
  BATAS_MENGUASAI?: string;
  BATAS_SESI_HARIAN?: string;
  KOMPOSISI_LEVEL?: string;      // mis. "lots:30,mots:40,hots:30" (persen) — untuk tes kompetensi
  SOAL_PER_BAB?: string;         // materi: soal per bab per sesi (bawaan 2 → 8 bab = 16 soal)
  SOAL_KOMPETENSI?: string;      // kompetensi: soal pedagogis dan soal adab per sesi (bawaan 10 + 10)
  MIN_PESERTA_PERSENTIL?: string;
  ACUAN_SKOR?: string;   // "75-90"
  ACUAN_JUMLAH?: string; // "50"
}

export const LEVEL = ['lots', 'mots', 'hots'] as const;
export type Level = (typeof LEVEL)[number];

/** Kuota soal per level untuk n soal, dari KOMPOSISI_LEVEL (persen). Sisa pembulatan masuk ke 'mots'. */
export function kuotaLevel(n: number, komposisi = 'lots:30,mots:40,hots:30'): Record<Level, number> {
  const pct: Record<Level, number> = { lots: 0, mots: 0, hots: 0 };
  for (const bagian of komposisi.split(',')) {
    const [k, v] = bagian.split(':').map((x) => x.trim());
    if ((LEVEL as readonly string[]).includes(k)) pct[k as Level] = Math.max(0, Number(v) || 0);
  }
  const total = pct.lots + pct.mots + pct.hots || 100;
  const q: Record<Level, number> = { lots: 0, mots: 0, hots: 0 };
  for (const l of LEVEL) q[l] = Math.floor((n * pct[l]) / total);
  q.mots += n - (q.lots + q.mots + q.hots);
  return q;
}

export type Rincian = Partial<Record<Level, [number, number]>>; // [benar, jumlah]

export const JENIS = ['materi', 'kompetensi'] as const;
export type Jenis = (typeof JENIS)[number];
export const isJenis = (j: unknown): j is Jenis => j === 'materi' || j === 'kompetensi';

/** Jumlah soal per sesi untuk satu mapel, dari isi bank (n soal aktif, b bab berbeda). */
export function targetSoal(env: Env, mapel: string, n: number, b: number): number {
  if (mapel === 'cp' || mapel === 'islam') return Math.min(n, Number(env.SOAL_KOMPETENSI ?? 10));
  if (b > 0) return Math.min(n, b * Number(env.SOAL_PER_BAB ?? 2));
  return Math.min(n, Number(env.SOAL_PER_MAPEL ?? 16)); // bank tanpa nomor bab
}

// Dua jenis penilaian:
//  1. MATERI kelas  — IPAS, Matematika, Bahasa Indonesia (dari naskah buku per kelas)
//  2. KOMPETENSI guru — 'cp': CP 2025, pembelajaran mendalam, asesmen; 'islam': adab guru (Tadzkiratus Sami')
export const MATERI = ['ipas', 'mtk', 'bi'] as const;
export const KOMPETENSI = ['cp', 'islam'] as const;
export const MAPEL = [...MATERI, ...KOMPETENSI] as const;
export type Mapel = (typeof MAPEL)[number];
export const materiUntukKelas = (kelas: number): readonly Mapel[] =>
  kelas <= 2 ? MATERI.filter((mapel) => mapel !== 'ipas') : MATERI;
export const fase = (kelas: number) => (kelas <= 2 ? 'A' : kelas <= 4 ? 'B' : 'C');

export function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    },
  });
}

export const gagal = (pesan: string, status = 400) => json({ error: pesan }, status);

export async function bacaBody<T>(request: Request): Promise<T | null> {
  try {
    return (await request.json()) as T;
  } catch {
    return null;
  }
}

const ABJAD = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export function idAcak(panjang: number): string {
  const b = crypto.getRandomValues(new Uint8Array(panjang));
  let s = '';
  for (const x of b) s += ABJAD[x % ABJAD.length];
  return s;
}

export function acak<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const r = crypto.getRandomValues(new Uint32Array(1))[0] % (i + 1);
    [a[i], a[r]] = [a[r], a[i]];
  }
  return a;
}

export async function hashIp(request: Request, salt = ''): Promise<string> {
  const ip = request.headers.get('cf-connecting-ip') ?? 'lokal';
  const data = new TextEncoder().encode(ip + '|' + salt);
  const h = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(h)].slice(0, 16).map((x) => x.toString(16).padStart(2, '0')).join('');
}

export const isMapel = (m: unknown): m is Mapel => typeof m === 'string' && (MAPEL as readonly string[]).includes(m);
export const isSesiId = (s: unknown): s is string => typeof s === 'string' && /^[A-Za-z0-9]{20,40}$/.test(s);

export const PERSONA = ['guru', 'ortu', 'umum'] as const;
export const isPersona = (p: unknown): p is Persona => typeof p === 'string' && (PERSONA as readonly string[]).includes(p);


/** Hasil satu soal untuk peserta: tanpa kunci dan tanpa teks soal. */
export interface Butir { n: number; bab: number | null; topik: string | null; level: string; ok: boolean }

export interface SkorMapel {
  skor: number; benar: number; jumlah: number;
  rincian?: Rincian;
  persentil?: number | null; // % skor pembanding yang lebih rendah
  persentilAcuan?: boolean;  // true = pembandingnya skor acuan, belum peserta asli
  detik?: number;            // lama mengerjakan
  butir?: Butir[];
}

/**
 * Persentase skor yang berada di bawah `skor`.
 * Selama peserta asli < MIN_PESERTA_PERSENTIL, pembandingnya SKOR ACUAN (ACUAN_SKOR, mis. "75-90" sebanyak
 * ACUAN_JUMLAH) dan hasilnya ditandai acuan=true, supaya tampilan menulis "dibanding skor acuan", bukan "guru".
 */
export async function hitungPersentil(env: Env, kelas: number, mapel: string, skor: number):
  Promise<{ persen: number; acuan: boolean } | null> {
  const min = Number(env.MIN_PESERTA_PERSENTIL ?? 30);
  const r = await env.DB.prepare(
    `SELECT COUNT(*) AS n, SUM(CASE WHEN skor < ? THEN 1 ELSE 0 END) AS bawah
     FROM sesi_mapel WHERE kelas = ? AND mapel = ? AND selesai = 1 AND skor IS NOT NULL`,
  ).bind(skor, kelas, mapel).first<{ n: number; bawah: number | null }>();
  if (r && r.n >= min) return { persen: Math.min(99, Math.round(((r.bawah ?? 0) / r.n) * 100)), acuan: false };
  const acuan = skorAcuan(env);
  if (!acuan.length) return null;
  const bawah = acuan.filter((x) => x < skor).length;
  return { persen: Math.min(99, Math.round((bawah / acuan.length) * 100)), acuan: true };
}

/** Sebaran skor acuan yang rata, mis. 50 skor dari 75 sampai 90. */
export function skorAcuan(env: Env): number[] {
  const m = /^(\d+)\s*-\s*(\d+)$/.exec(env.ACUAN_SKOR ?? '75-90');
  const n = Number(env.ACUAN_JUMLAH ?? 50);
  if (!m || !n) return [];
  const [a, b] = [Number(m[1]), Number(m[2])];
  return Array.from({ length: n }, (_, i) => Math.round(a + ((b - a) * i) / Math.max(1, n - 1)));
}

export function gabungRincian(list: (Rincian | undefined)[]): Rincian {
  const out: Rincian = {};
  for (const r of list) for (const l of LEVEL) {
    const v = r?.[l]; if (!v) continue;
    const o = out[l] ?? [0, 0];
    out[l] = [o[0] + v[0], o[1] + v[1]];
  }
  return out;
}
export interface DataHasil {
  kelas: number;
  mapel: Partial<Record<Mapel, SkorMapel>>;
  selesai: number;     // jumlah bagian yang selesai
  rata: number;        // rata-rata semua bagian yang selesai
  predikat: string;
  menguasai: boolean;  // semua mapel materi untuk kelas ini selesai dan >= BATAS_MENGUASAI
  rincian?: Rincian;   // gabungan semua bagian yang selesai
  materi?: number | null;     // rata-rata skor mapel materi yang selesai
  kompetensi?: number | null; // rata-rata skor Pedagogis + Adab Guru yang selesai
  perluDitambah?: Mapel[];    // bagian selesai dengan skor < BATAS_MENGUASAI
  persona?: Persona;
  jenis?: Jenis;              // 'materi' (IPAS/MTK/BI) | 'kompetensi' (pedagogis + adab)
}

const rataDari = (d: DataHasil, daftar: readonly Mapel[]) => {
  const s = daftar.map((m) => d.mapel[m]?.skor).filter((x): x is number => typeof x === 'number');
  return s.length ? Math.round(s.reduce((a, b) => a + b, 0) / s.length) : null;
};

export function susunHasil(kelas: number, mapel: DataHasil['mapel'], batas: number, persona: Persona = 'guru', jenis: Jenis = 'materi'): DataHasil {
  const bagian: readonly Mapel[] = jenis === 'kompetensi' ? KOMPETENSI : materiUntukKelas(kelas);
  const mapelValid: DataHasil['mapel'] = {};
  for (const m of bagian) if (mapel[m]) mapelValid[m] = mapel[m];
  const semua = Object.values(mapelValid).map((m) => m!.skor);
  const rata = Math.round(semua.reduce((a, b) => a + b, 0) / semua.length);
  const d: DataHasil = {
    kelas, mapel: mapelValid, selesai: semua.length, rata, predikat: predikat(rata, persona), persona, jenis,
    menguasai: materiUntukKelas(kelas).every((m) => (mapelValid[m]?.skor ?? -1) >= batas),
    rincian: gabungRincian(Object.values(mapelValid).map((m) => m!.rincian)),
    perluDitambah: MAPEL.filter((m) => mapelValid[m] && mapelValid[m]!.skor < batas),
  };
  d.materi = rataDari(d, materiUntukKelas(kelas));
  d.kompetensi = rataDari(d, KOMPETENSI);
  // Predikat mengikuti kalimat utama (materi); kekurangan kompetensi disampaikan lewat saranHasil().
  d.predikat = predikat(d.materi ?? d.kompetensi ?? rata, persona);
  return d;
}

// PUEBI: "a dan b", "a, b, dan c"
const gabungKata = (xs: string[]) => xs.length <= 1 ? xs.join('') : xs.length === 2 ? `${xs[0]} dan ${xs[1]}` : `${xs.slice(0, -1).join(', ')}, dan ${xs[xs.length - 1]}`;

/** Kalimat utama. Materi: "Alhamdulillah, saya menguasai 80% materi Kelas 1". Kompetensi: skor kompetensi guru. */
export function judulHasil(d: DataHasil): string {
  if (d.jenis === 'kompetensi') {
    return d.kompetensi! >= 60 ? KALIMAT.skorKompetensi(d.kompetensi!) : KALIMAT.skorKompetensiRendah(d.kompetensi!);
  }
  const materiTersedia = materiUntukKelas(d.kelas);
  const materi = materiTersedia.filter((m) => d.mapel[m]);
  const lingkup = materi.length === materiTersedia.length ? 'materi' : `materi ${gabungKata(materi.map((m) => NAMA_MAPEL[m]))}`;
  return d.materi! >= 60 ? KALIMAT.menguasaiMateri(d.materi!, lingkup, d.kelas) : KALIMAT.skorMateriRendah(d.materi!, lingkup, d.kelas);
}

/** Kalimat lanjutan, mis. "Selanjutnya perlu menambah pengetahuan terkait materi Bahasa Indonesia." */
export function saranHasil(d: DataHasil): string {
  const persona = d.persona ?? 'guru';
  const perlu = d.perluDitambah ?? [];
  if (perlu.length) return KALIMAT.perluMenambah(gabungKata(perlu.map((m) => FRASA_SARAN[m])));
  if (d.jenis === 'kompetensi') return KALIMAT.kompetensiKuat;
  if (materiUntukKelas(d.kelas).some((m) => !d.mapel[m])) return KALIMAT.lanjutMapelLain(d.kelas);
  return KALIMAT.materiKuat[persona](d.kelas);
}

export const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
