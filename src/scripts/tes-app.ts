// Aplikasi kuis Tes Guru SDIT (berjalan di browser).
// Browser tidak pernah menerima kunci jawaban: soal diminta satu per satu ke /api/tes/soal,
// jawaban dikirim ke /api/tes/jawab, skor dihitung di server.
// SEMUA KATA-KATA ada di lib/teks.ts.
//
// Tata letak setiap layar: .layar-atas (lengket di atas) · .layar-isi (bisa digulir) · .layar-bawah (tombol tetap di bawah).
import { konfeti } from './konfeti';
import {
  type Mapel, type Level, type Persona,
  NAMA_MAPEL as NAMA, IKON, KET_KOMPETENSI, NAMA_LEVEL, PERSONA, UI, predikat, sapaan,
} from '../../lib/teks';

const MATERI: Mapel[] = ['ipas', 'mtk', 'bi'];
const KOMPETENSI: Mapel[] = ['cp', 'islam'];
const BATAS_MENGUASAI = 80;

type Rincian = Partial<Record<Level, [number, number]>>;
interface Butir { n: number; bab: number | null; topik: string | null; level: string; ok: boolean }
type Selesai = {
  status: 'selesai'; benar: number; jumlah: number; skor: number; rincian?: Rincian;
  persentil?: number | null; persentilAcuan?: boolean; detik?: number; butir?: Butir[];
};
type StatusMapel = Selesai | { status: 'berjalan'; terjawab: number; jumlah: number };

interface Sesi {
  sesiId: string;
  kelas: number;
  persona: Persona;
  tersedia: Record<Mapel, number>;
  mapel: Partial<Record<Mapel, StatusMapel>>;
}
interface Soal {
  nomor: number; jumlah: number; tipe: 'pg' | 'bs'; level?: Level; stimulus?: string | null;
  pertanyaan: string; opsi: { id: string; teks: string }[]; mulai: number; sekarang: number;
}

class GagalApi extends Error {}

async function api<T>(path: string, body: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
  } catch {
    throw new GagalApi(UI.galatKoneksi);
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new GagalApi((data as { error?: string }).error ?? UI.galatUmum);
  return data as T;
}

// Pembuat elemen kecil — teks selalu lewat textContent, tidak pernah innerHTML.
type Anak = Node | string | null | false | undefined;
function h<K extends keyof HTMLElementTagNameMap>(
  tag: K, attrs: Record<string, string | boolean | ((e: Event) => void)> = {}, ...anak: Anak[]
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (typeof v === 'function') el.addEventListener(k.replace(/^on/, ''), v);
    else if (v === true) el.setAttribute(k, '');
    else if (v !== false) el.setAttribute(k, v);
  }
  for (const a of anak) if (a !== null && a !== false && a !== undefined) el.append(a);
  return el;
}

const simpan = {
  ambil(kunci: string): string | undefined {
    try { return sessionStorage.getItem(`tes-guru-sesi-${kunci}`) ?? undefined; } catch { return undefined; }
  },
  taruh(kunci: string, id: string) {
    try { sessionStorage.setItem(`tes-guru-sesi-${kunci}`, id); } catch { /* mode privat: abaikan */ }
  },
  hapus(kunci: string) {
    try { sessionStorage.removeItem(`tes-guru-sesi-${kunci}`); } catch { /* abaikan */ }
  },
};
const personaTersimpan = {
  ambil(): Persona | undefined {
    try { const p = localStorage.getItem('tes-guru-persona'); return p === 'guru' || p === 'ortu' || p === 'umum' ? p : undefined; } catch { return undefined; }
  },
  taruh(p: Persona) { try { localStorage.setItem('tes-guru-persona', p); } catch { /* abaikan */ } },
};

const menit = (detik: number) => `${Math.floor(detik / 60)}:${String(detik % 60).padStart(2, '0')}`;

/** Kartu skor seperti kartu hasil akhir: panel atas (skor, kalimat, predikat) + isi (bar). */
function kartuSkor(o: { label: string; skor: number; judul: string; predikat: string; info: (Node | string | null | false)[]; isi: (Node | null | false)[] }) {
  const angka = h('b', {}, '0');
  const mulaiT = performance.now();
  const naik = (t: number) => { const k = Math.min(1, (t - mulaiT) / 900); angka.textContent = String(Math.round(o.skor * (1 - Math.pow(1 - k, 3)))); if (k < 1) requestAnimationFrame(naik); };
  requestAnimationFrame(naik);
  return h('div', { class: 'kartu-skor', role: 'group', 'aria-label': `Skor ${o.skor} dari 100` },
    h('div', { class: 'ks-atas' },
      h('p', { class: 'ks-lab' }, o.label),
      h('div', { class: 'ks-skor' }, angka, h('span', {}, '/100')),
      h('p', { class: 'ks-judul' }, o.judul),
      h('div', { class: 'ks-info' }, h('span', { class: 'predikat' }, o.predikat), ...o.info.filter(Boolean).map((x) => (typeof x === 'string' ? h('span', {}, x) : x)))),
    h('div', { class: 'ks-isi' }, ...o.isi));
}
const barSkor = (label: string, skor: number, warna: string) =>
  h('div', { class: 'rin' }, h('span', {}, label), h('div', { class: 'bar' }, h('i', { style: `width:${skor}%;background:${warna}` })), h('b', {}, String(skor)));

function barisRincian(r?: Rincian) {
  if (!r) return null;
  const lv = (['lots', 'mots', 'hots'] as Level[]).filter((l) => r[l]?.[1]);
  if (!lv.length) return null;
  return h('div', { class: 'rincian' }, ...lv.map((l) => {
    const [b, n] = r[l]!;
    return h('div', { class: `rin rin-${l}` },
      h('span', {}, NAMA_LEVEL[l]),
      h('div', { class: 'bar' }, h('i', { style: `width:${Math.round((b / n) * 100)}%` })),
      h('b', {}, `${b}/${n}`));
  }));
}

/** Daftar soal yang belum tepat: nomor, bab/topik, level. Tanpa teks soal dan tanpa kunci. */
function daftarBelumTepat(bagian: { butir?: Butir[]; label?: string; offset?: number }[]) {
  const salah = bagian.flatMap((b) => (b.butir ?? []).filter((x) => !x.ok).map((x) => ({ ...x, n: x.n + (b.offset ?? 0), label: b.label })));
  const ada = bagian.some((b) => b.butir?.length);
  if (!ada) return null;
  if (!salah.length) return h('p', { class: 'pesan pesan-ok' }, UI.semuaTepat);
  return h('details', { class: 'belum-tepat', open: salah.length <= 6 },
    h('summary', {}, UI.belumTepatJudul(salah.length)),
    h('p', { class: 't-muted' }, UI.belumTepatKet),
    h('ol', {}, ...salah.map((x) => h('li', {},
      h('b', {}, `No. ${x.n}`),
      h('span', {}, [x.label, x.bab ? `Bab ${x.bab}` : null, x.topik].filter(Boolean).join(' · ') || '—'),
      h('em', { class: `lv lv-${x.level}` }, NAMA_LEVEL[x.level as Level] ?? x.level)))));
}

export function jalankanTes(root: HTMLElement, kelas: number, jenis: 'materi' | 'kompetensi' = 'materi') {
  const KOMP = jenis === 'kompetensi';
  const BAGIAN = KOMP ? KOMPETENSI : MATERI;
  const kunciSesi = `${jenis}-${kelas}`;
  if (new URLSearchParams(location.search).has('baru')) {
    simpan.hapus(kunciSesi);
    history.replaceState(null, '', location.pathname);
  }
  let sesi: Sesi;
  let pembersih: (() => void) | null = null; // melepas timer & pintasan keyboard layar sebelumnya
  const buku = document.getElementById('tes-buku');

  // Mempersulit salin-tempel soal (tidak bisa mencegah tangkapan layar).
  for (const ev of ['copy', 'cut', 'contextmenu', 'dragstart'] as const) {
    root.addEventListener(ev, (e) => {
      if ((e.target as HTMLElement).closest?.('.soal-area')) e.preventDefault();
    });
  }

  /** Menampilkan satu layar: atas (lengket), isi, bawah (tombol tetap). */
  function layar(o: { atas?: Anak[]; isi: Anak[]; bawah?: Anak[]; kelas?: string }) {
    pembersih?.(); pembersih = null;
    const bawah = o.bawah?.filter(Boolean) ?? [];
    document.body.classList.toggle('ada-bawah', bawah.length > 0);
    // Animasi hanya di .layar-isi: transform pada pembungkus akan membuat .layar-bawah (fixed) ikut menempel ke pembungkus, bukan ke layar.
    root.replaceChildren(h('div', { class: `layar ${o.kelas ?? ''}` },
      o.atas?.length ? h('div', { class: 'layar-atas' }, ...o.atas) : null,
      h('div', { class: 'layar-isi masuk' }, ...o.isi),
      bawah.length ? h('div', { class: 'layar-bawah' }, h('div', { class: 'layar-bawah-dalam' }, ...bawah)) : null,
    ));
    window.scrollTo({ top: 0 });
  }
  function tampilBuku(on: boolean) { if (buku) buku.hidden = !on; }

  function galat(err: unknown, ulang: () => void) {
    const pesan = err instanceof GagalApi ? err.message : UI.galatUmum;
    layar({ isi: [h('p', { class: 'pesan', role: 'alert' }, pesan)], bawah: [h('button', { class: 'btn btn-pri btn-block', type: 'button', onclick: ulang }, UI.cobaLagi)] });
  }
  function memuat(teks: string) {
    layar({ isi: [h('div', { class: 'memuat', role: 'status' }, h('span', { class: 'spin', 'aria-hidden': 'true' }), teks)] });
  }

  async function mulai(personaBaru?: Persona) {
    const persona = KOMP ? 'guru' : personaBaru ?? personaTersimpan.ambil() ?? 'guru';
    try {
      sesi = await api<Sesi>('/api/tes/mulai', { kelas, jenis, sesiId: simpan.ambil(kunciSesi), persona });
      simpan.taruh(kunciSesi, sesi.sesiId);
      if (KOMP) mulaiKompetensi(); else layarMateri();
    } catch (e) { galat(e, () => mulai(personaBaru)); }
  }

  /** Mulai tes baru (soal acak baru). Sesi & hasil lama tetap tersimpan di server. */
  function ulangi() {
    if (!confirm(UI.ulangiYakin)) return;
    simpan.hapus(kunciSesi);
    memuat('…');
    mulai(sesi?.persona);
  }
  const tombolUlangi = () => h('button', { class: 'tautan', type: 'button', onclick: ulangi }, UI.ulangi);

  const bagianTersedia = () => BAGIAN.filter((m) => sesi.tersedia[m] > 0);
  const selesaiSemua = () => bagianTersedia().filter((m) => sesi.mapel[m]?.status === 'selesai');
  const sisaBagian = () => BAGIAN.filter((x) => sesi.mapel[x]?.status !== 'selesai' && sesi.tersedia[x] > 0);

  // ---------- Tes materi: satu layar — pilih peran (chip) lalu ketuk mapel = langsung mulai ----------
  function layarMateri() {
    const done = selesaiSemua();
    tampilBuku(false);
    const chip = h('div', { class: 'chips', role: 'radiogroup', 'aria-label': 'Peran' },
      h('span', { class: 'chips-label' }, UI.sayaAdalah),
      ...PERSONA.map((p) => h('button', {
        type: 'button', role: 'radio', class: 'chip-btn', 'aria-checked': String(sesi.persona === p.id),
        onclick: () => {
          if (sesi.persona === p.id) return;
          personaTersimpan.taruh(p.id);
          sesi.persona = p.id;
          for (const b of chip.querySelectorAll<HTMLButtonElement>('.chip-btn')) b.setAttribute('aria-checked', String(b.textContent === p.label));
          api('/api/tes/mulai', { kelas, jenis, sesiId: sesi.sesiId, persona: p.id }).catch(() => {});
          layarMateri();
        },
      }, p.label)));

    const kartu = (m: Mapel) => {
      const st = sesi.mapel[m];
      const ada = sesi.tersedia[m] > 0;
      const sudah = st?.status === 'selesai';
      const ket = sudah ? UI.selesaiSkor(st.skor) : st?.status === 'berjalan' ? UI.lanjutkan(st.terjawab, st.jumlah)
        : ada ? UI.infoMapel(sesi.tersedia[m]) : UI.soalSegera;
      return h('button', { class: `card-link mapel-card mc-${m}`, type: 'button', disabled: sudah || !ada, onclick: () => mulaiMapel(m) },
        h('span', { class: 'mc-ikon', 'aria-hidden': 'true' }, sudah ? '✓' : IKON[m]),
        h('span', { class: 'mc-teks' }, h('span', { class: 'mc-nama' }, NAMA[m]), h('span', { class: 'status' }, ket)),
        !sudah && ada && h('span', { class: 'mc-panah', 'aria-hidden': 'true' }, '→'));
    };

    layar({
      atas: [h('p', { class: 't-label' }, UI.judulMateri(kelas)), chip],
      isi: [
        h('p', { class: 't-muted kecil' }, UI.pilihMapel),
        h('div', { class: 'grid' }, ...MATERI.map(kartu)),
        sesi.persona === 'guru' && h('a', { class: 'tautan-blok', href: '/tes/kompetensi' }, UI.ujiKompetensi),
        done.length > 0 && tombolUlangi(),
      ],
      bawah: done.length ? [h('button', { class: `btn ${done.length === bagianTersedia().length ? 'btn-gold' : 'btn-sec'} btn-block`, type: 'button', onclick: bagikan },
        done.length === bagianTersedia().length ? UI.bagikanKelas(kelas) : UI.bagikanSejauhIni)] : [],
    });
  }

  // ---------- Tes kompetensi: langsung mulai; pedagogis lalu adab sebagai satu rangkaian ----------
  function mulaiKompetensi() {
    const berikut = KOMPETENSI.find((m) => sesi.mapel[m]?.status !== 'selesai' && sesi.tersedia[m] > 0);
    if (berikut) { mulaiMapel(berikut); return; }
    if (selesaiSemua().length) { layarHasilKompetensi(); return; }
    layar({ atas: [h('p', { class: 't-label' }, UI.judulKompetensi)], isi: [h('p', { class: 'pesan' }, UI.soalSegera)] });
  }

  async function mulaiMapel(m: Mapel) {
    memuat(UI.memuatSoal(NAMA[m]));
    try {
      await api('/api/tes/mapel', { sesiId: sesi.sesiId, mapel: m });
      await soalBerikut(m);
    } catch (e) { galat(e, () => mulaiMapel(m)); }
  }

  async function soalBerikut(m: Mapel) {
    tampilBuku(false);
    try {
      const s = await api<Soal | { selesai: true }>('/api/tes/soal', { sesiId: sesi.sesiId, mapel: m });
      if ('selesai' in s) { await mulai(); return; }
      layarSoal(m, s);
    } catch (e) { galat(e, () => soalBerikut(m)); }
  }

  // Nomor soal kompetensi bersambung: soal adab melanjutkan nomor soal pedagogis.
  const offsetKomp = (m: Mapel) => KOMPETENSI.slice(0, KOMPETENSI.indexOf(m)).reduce((n, x) => n + (sesi.tersedia[x] ?? 0), 0);
  const totalKomp = () => KOMPETENSI.reduce((n, x) => n + (sesi.tersedia[x] ?? 0), 0);

  // ---------- Layar soal ----------
  function layarSoal(m: Mapel, s: Soal) {
    let pilihan: string | null = null;
    let tombolOpsi: HTMLButtonElement[] = [];
    const selisihJam = Date.now() - s.sekarang;
    const nomor = (KOMP ? offsetKomp(m) : 0) + s.nomor;
    const total = KOMP ? totalKomp() : s.jumlah;

    const simpanBtn = h('button', { class: 'btn btn-pri btn-block', type: 'button', disabled: true, onclick: kirim },
      nomor === total ? UI.simpanSelesai : UI.simpanLanjut);

    function pilih(id: string) {
      pilihan = id;
      for (const b of tombolOpsi) b.setAttribute('aria-checked', String(b.dataset.id === id));
      simpanBtn.disabled = false;
    }
    function navPanah(e: KeyboardEvent) {
      if (!['ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight'].includes(e.key)) return;
      e.preventDefault();
      const i = tombolOpsi.indexOf(document.activeElement as HTMLButtonElement);
      const maju = e.key === 'ArrowDown' || e.key === 'ArrowRight';
      const j = (i + (maju ? 1 : -1) + tombolOpsi.length) % tombolOpsi.length;
      tombolOpsi[j].focus();
      pilih(tombolOpsi[j].dataset.id!);
    }

    let kontrol: HTMLElement;
    if (s.tipe === 'pg') {
      tombolOpsi = s.opsi.map((o, i) => h('button', {
        class: 'opt', type: 'button', role: 'radio', 'aria-checked': 'false', 'data-id': o.id, onclick: () => pilih(o.id),
      }, h('span', { class: 'key', 'aria-hidden': 'true' }, 'ABCDE'[i]), h('span', {}, o.teks)));
      kontrol = h('div', { class: 'opts', role: 'radiogroup', 'aria-label': 'Pilihan jawaban', onkeydown: navPanah as (e: Event) => void }, ...tombolOpsi);
    } else {
      tombolOpsi = s.opsi.map((o) => h('button', {
        type: 'button', role: 'radio', 'aria-checked': 'false', 'data-id': o.id, onclick: () => pilih(o.id),
      }, o.id === 'benar' ? '✓ ' : '✗ ', o.teks));
      kontrol = h('div', { class: 'tf', role: 'radiogroup', 'aria-label': 'Benar atau salah', onkeydown: navPanah as (e: Event) => void }, ...tombolOpsi);
    }

    async function kirim() {
      if (!pilihan || simpanBtn.disabled) return;
      simpanBtn.disabled = true;
      simpanBtn.textContent = UI.menyimpan;
      try {
        const r = await api<{ selesai: boolean } & Partial<Selesai>>('/api/tes/jawab', { sesiId: sesi.sesiId, mapel: m, nomor: s.nomor, jawaban: pilihan });
        if (r.selesai) {
          sesi.mapel[m] = { status: 'selesai', benar: r.benar!, jumlah: r.jumlah!, skor: r.skor!, rincian: r.rincian, persentil: r.persentil, persentilAcuan: r.persentilAcuan, detik: r.detik, butir: r.butir };
          const lanjut = KOMP && KOMPETENSI.find((x) => sesi.mapel[x]?.status !== 'selesai' && sesi.tersedia[x] > 0);
          if (lanjut) await mulaiMapel(lanjut);
          else if (KOMP) layarHasilKompetensi();
          else layarSkorMapel(m);
        } else {
          await soalBerikut(m);
        }
      } catch (e) {
        if (e instanceof GagalApi && /muat ulang/i.test(e.message)) { await soalBerikut(m); return; }
        galat(e, () => layarSoal(m, s));
      }
    }

    // Pintasan: A–E / 1–5 memilih opsi, B/S untuk benar-salah, Enter menyimpan.
    function tombol(e: KeyboardEvent) {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const k = e.key.toLowerCase();
      if (k === 'enter') { if (!simpanBtn.disabled) { e.preventDefault(); kirim(); } return; }
      let idx = -1;
      if (s.tipe === 'pg') idx = 'abcde'.indexOf(k) >= 0 ? 'abcde'.indexOf(k) : '12345'.indexOf(k);
      else idx = k === 'b' ? 0 : k === 's' ? 1 : -1;
      if (idx >= 0 && idx < tombolOpsi.length) { e.preventDefault(); tombolOpsi[idx].focus(); pilih(tombolOpsi[idx].dataset.id!); }
    }

    const jam = h('span', { class: 'jam', 'aria-label': 'Waktu berjalan' }, '0:00');
    const tik = () => { jam.textContent = '⏱ ' + menit(Math.max(0, Math.floor((Date.now() - selisihJam - s.mulai) / 1000))); };
    tik();

    const tanda = `${sesi.sesiId.slice(0, 6)} · ${KOMP ? m : `${kelas}${m}`}`;
    const judul = KOMP ? `${UI.judulKompetensi} · ${NAMA[m]}` : `${NAMA[m]} · Kelas ${kelas}`;
    layar({
      kelas: `soal-area mc-${m}`,
      atas: [
        h('div', { class: 'soal-atas' }, h('span', { class: 'chip' }, h('span', { class: `dot dot-${m}` }), judul), jam),
        h('div', { class: 'progress', role: 'progressbar', 'aria-valuemin': '0', 'aria-valuemax': String(total), 'aria-valuenow': String(nomor - 1) },
          h('i', { style: `width:${((nomor - 1) / total) * 100}%` })),
        h('div', { class: 'soal-nomor' },
          h('span', { class: 't-label' }, UI.soalKe(nomor, total)),
          s.level === 'hots' && h('span', { class: 'badge-hots' }, '🧠 HOTS')),
      ],
      isi: [
        h('div', { class: 'watermark', 'aria-hidden': 'true' }, Array(60).fill(tanda).join(' ')),
        s.stimulus && h('div', { class: 'stimulus' }, h('p', { class: 't-label' }, UI.cermati), h('p', {}, s.stimulus)),
        h('p', { class: 't-question' }, s.pertanyaan),
        kontrol,
      ],
      bawah: [simpanBtn, h('p', { class: 'petunjuk' }, s.tipe === 'pg' ? UI.petunjukPg : UI.petunjukBs)],
    });
    const id = setInterval(tik, 1000);
    document.addEventListener('keydown', tombol);
    pembersih = () => { clearInterval(id); document.removeEventListener('keydown', tombol); };
  }

  // ---------- Skor satu mapel (tes materi) ----------
  function layarSkorMapel(m: Mapel) {
    const st = sesi.mapel[m] as Selesai;
    const done = selesaiSemua();
    const sisa = sisaBagian();
    const warna = getComputedStyle(root).getPropertyValue(`--subject-${m}`).trim() || '#1f6fa8';
    tampilBuku(true);
    const semua = done.length === bagianTersedia().length;
    layar({
      kelas: 'checkpoint',
      atas: [h('p', { class: 't-label' }, `${NAMA[m]} · Kelas ${kelas} · ${done.length}/${bagianTersedia().length} mapel`)],
      isi: [
        kartuSkor({
          label: `${NAMA[m]} · Kelas ${kelas}`, skor: st.skor, judul: sapaan(st.skor), predikat: predikat(st.skor, sesi.persona),
          info: [UI.tepat(st.benar, st.jumlah), !!st.detik && UI.waktu(menit(st.detik!))],
          isi: [
            barSkor(NAMA[m], st.skor, warna),
            barisRincian(st.rincian),
            typeof st.persentil === 'number' && st.persentil >= 10
              && h('p', { class: 'persentil' }, st.persentilAcuan ? UI.persentilAcuan(st.persentil) : UI.persentilPeserta(st.persentil, `${NAMA[m]} Kelas ${kelas}`)),
          ],
        }),
        daftarBelumTepat([{ butir: st.butir }]),
        sisa.length > 1 && h('button', { class: 'tautan-blok', type: 'button', onclick: layarMateri }, UI.kembaliPilihMapel),
        semua && tombolUlangi(),
      ],
      bawah: [
        sisa.length > 0 && h('button', { class: 'btn btn-pri btn-block', type: 'button', onclick: () => mulaiMapel(sisa[0]) },
          h('span', { 'aria-hidden': 'true' }, IKON[sisa[0]]), UI.lanjutKe(NAMA[sisa[0]])),
        h('button', { class: `btn ${semua ? 'btn-gold' : 'btn-sec'} btn-block`, type: 'button', onclick: bagikan },
          semua ? UI.bagikanKelas(kelas) : done.length === 1 ? UI.bagikanSkor(NAMA[m]) : UI.bagikanSejauhIni),
      ],
    });
    if (st.skor >= BATAS_MENGUASAI) setTimeout(() => konfeti(), 500);
  }

  // ---------- Hasil tes kompetensi: skor gabungan + dua sub-skor ----------
  function layarHasilKompetensi() {
    const sel = KOMPETENSI.map((m) => [m, sesi.mapel[m]] as const).filter((x): x is readonly [Mapel, Selesai] => x[1]?.status === 'selesai');
    const skor = Math.round(sel.reduce((n, [, st]) => n + st.skor, 0) / Math.max(1, sel.length));
    const rinci: Rincian = {};
    for (const [, st] of sel) for (const l of ['lots', 'mots', 'hots'] as Level[]) {
      const v = st.rincian?.[l]; if (!v) continue;
      const o = rinci[l] ?? [0, 0]; rinci[l] = [o[0] + v[0], o[1] + v[1]];
    }
    const detik = sel.reduce((n, [, st]) => n + (st.detik ?? 0), 0);
    tampilBuku(true);
    layar({
      kelas: 'checkpoint',
      atas: [h('p', { class: 't-label' }, UI.judulKompetensi)],
      isi: [
        kartuSkor({
          label: UI.judulKompetensi, skor, judul: sapaan(skor), predikat: predikat(skor, 'guru'),
          info: [UI.tepat(sel.reduce((n, [, st]) => n + st.benar, 0), sel.reduce((n, [, st]) => n + st.jumlah, 0)), !!detik && UI.waktu(menit(detik))],
          isi: [
            ...sel.map(([m, st]) => barSkor(NAMA[m], st.skor, getComputedStyle(root).getPropertyValue(`--subject-${m}`).trim() || '#3d6fb5')),
            barisRincian(rinci),
          ],
        }),
        daftarBelumTepat(sel.map(([m, st]) => ({ butir: st.butir, label: NAMA[m], offset: offsetKomp(m) }))),
        h('p', { class: 't-muted kecil' }, KET_KOMPETENSI.cp + ' · ' + KET_KOMPETENSI.islam),
        tombolUlangi(),
      ],
      bawah: [
        h('button', { class: 'btn btn-gold btn-block', type: 'button', onclick: bagikan }, UI.bagikanHasil),
        h('a', { class: 'btn btn-sec btn-block', href: '/tes' }, UI.ujiMateri),
      ],
    });
    if (skor >= BATAS_MENGUASAI) setTimeout(() => konfeti(), 500);
  }

  async function bagikan() {
    memuat(UI.memuatKartu);
    try {
      const r = await api<{ url: string }>('/api/tes/bagikan', { sesiId: sesi.sesiId });
      location.href = r.url;
    } catch (e) { galat(e, bagikan); }
  }

  mulai();
}
