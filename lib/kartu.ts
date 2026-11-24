// HTML halaman hasil (/tes/hasil/:id) dan kartu gambar Open Graph.
import { KALIMAT, UI, HASIL, SITUS, NAMA_PENDEK } from './teks';
import { type DataHasil, type Mapel, KOMPETENSI, LEVEL, materiUntukKelas, NAMA_LEVEL, NAMA_MAPEL, escapeHtml as e, judulHasil, saranHasil } from './tes';

const WARNA = {
  surface100: '#f5f9fd', surface200: '#e8f2fa', surface300: '#d5e6f3', line: '#b8d2e7',
  ink: '#13304a', inkMuted: '#4d6a80', brand: '#1f6fa8', brandStrong: '#164a6e', onBrand: '#ffffff',
  head: '#154468', biruAdem: '#c4def2', biruLembut: '#edf6fc',
  gold: '#e3a72f', goldTint: '#f7e6bd',
  mapel: { ipas: '#2f9466', mtk: '#f0b44c', bi: '#a8355a', cp: '#3d6fb5', islam: '#7a5aa6' } as Record<string, string>,
};
const SINGKAT: Record<string, string> = NAMA_PENDEK;

const komp = (d: DataHasil) => d.jenis === 'kompetensi';
/** Bagian yang dinilai pada jenis tes ini. */
const bagianDari = (d: DataHasil): readonly Mapel[] => (komp(d) ? KOMPETENSI : materiUntukKelas(d.kelas));

export function labelAtas(d: DataHasil): string {
  if (komp(d)) return HASIL.labelKompetensi;
  const materi = materiUntukKelas(d.kelas);
  const satu = materi.filter((m) => d.mapel[m]);
  if (satu.length === 1) return HASIL.labelSatuMapel(NAMA_MAPEL[satu[0]], d.kelas);
  return HASIL.labelMateri(d.kelas, satu.length, materi.length);
}

// Satori tidak mengurai entitas HTML (&amp;, &nbsp;): cukup buang < dan >.
const teksOg = (s: string) => s.replace(/[<>]/g, '');

/** Kartu 4:5 untuk gambar OG (Satori: setiap div multi-anak wajib display:flex). */
export function kartuOg(d: DataHasil, situs: string): string {
  const e = teksOg;
  const barisMini = (m: Mapel) => {
    const v = d.mapel[m];
    return `<div style="display:flex;align-items:center;gap:14px;font-size:32px;font-weight:700"><div style="display:flex;width:220px">${SINGKAT[m]}</div>${
      v ? `<div style="display:flex;flex:1;height:14px;background:${WARNA.surface300};border-radius:999px"><div style="display:flex;width:${Math.max(v.skor, 2)}%;height:14px;background:${WARNA.mapel[m]};border-radius:999px"></div></div><div style="display:flex;width:56px;justify-content:flex-end;font-weight:800">${v.skor}</div>`
        : `<div style="display:flex;flex:1;color:${WARNA.inkMuted};font-size:22px">belum</div>`}</div>`;
  };
  const kotak = (judul: string, nilai: number | null | undefined, kosong: string, daftar: readonly Mapel[]) =>
    `<div style="display:flex;flex-direction:column;flex:1;background:${WARNA.surface200};border-radius:28px;padding:28px;gap:14px"><div style="display:flex;font-size:24px;font-weight:700;letter-spacing:1px;color:${WARNA.inkMuted}">${judul}</div>${
      nilai == null ? `<div style="display:flex;font-size:52px;line-height:1;font-weight:800;color:${WARNA.inkMuted}">${kosong}</div>`
        : `<div style="display:flex;font-size:96px;line-height:1;font-weight:800">${nilai}%</div>`}<div style="display:flex;flex-direction:column;gap:12px;margin-top:6px">${daftar.map(barisMini).join('')}</div></div>`;
  const baris = `<div style="display:flex">${komp(d)
    ? kotak(HASIL.kotakKompetensi, d.kompetensi, HASIL.belumDiuji, KOMPETENSI)
    : kotak(HASIL.kotakMateri(d.kelas), d.materi, HASIL.belumDiuji, materiUntukKelas(d.kelas))}</div>`;
  const kepala = `<div style="display:flex;font-size:54px;line-height:1.12;font-weight:800;margin-top:24px">${e(judulHasil(d))}</div>`;
  return `<div style="display:flex;flex-direction:column;width:1080px;height:1350px;background:${WARNA.surface100};color:${WARNA.ink};font-family:'Plus Jakarta Sans'">
  <div style="display:flex;flex-direction:column;background:${WARNA.brand};color:${WARNA.onBrand};padding:60px 72px">
    <div style="display:flex;font-size:32px;font-weight:700;letter-spacing:2px">${e(labelAtas(d))}</div>
    ${kepala}
    <div style="display:flex;font-size:32px;line-height:1.3;margin-top:16px;opacity:.92">${e(saranHasil(d))}</div>
    <div style="display:flex;margin-top:28px"><div style="display:flex;background:${WARNA.gold};color:${WARNA.ink};font-size:44px;font-weight:800;padding:14px 36px;border-radius:999px">${e(d.predikat)}</div></div>
  </div>
  <div style="display:flex;flex-direction:column;gap:26px;padding:40px 72px;flex:1">
    ${baris}
    ${d.rincian?.hots?.[1] ? `<div style="display:flex;align-items:center;gap:16px;font-size:32px;font-weight:700;color:${WARNA.inkMuted}"><div style="display:flex;background:${WARNA.gold};color:${WARNA.ink};padding:6px 20px;border-radius:999px;font-weight:800">HOTS</div><div style="display:flex">${e(HASIL.hotsKartu(d.rincian.hots[0], d.rincian.hots[1]))}</div></div>` : ''}
    <div style="display:flex;margin-top:auto;padding-top:12px;font-size:34px;color:${WARNA.inkMuted}"><span>${e(HASIL.ajakanKartu)}</span><span style="color:${WARNA.ink};font-weight:800;margin-left:12px">${e(situs)}</span></div>
  </div>
</div>`;
}

/** Halaman hasil lengkap dengan meta Open Graph. */
export function halamanHasil(d: DataHasil, id: string, asal: string): string {
  const judul = judulHasil(d);
  const deskripsi = `${saranHasil(d)} ${d.predikat}. ${komp(d) ? HASIL.deskripsiKompetensi : HASIL.deskripsiMateri} ${HASIL.ajakanKartu}`;
  const og = `${asal}/api/tes/og/${id}`;
  const urlMapel = (m: Mapel) => komp(d) ? `/tes/kompetensi?mapel=${m}` : `/tes/kelas/${d.kelas}?mapel=${m}`;
  const barisHtml = (m: Mapel) => {
    const s = d.mapel[m];
    const pembanding = s?.persentilAcuan ? HASIL.skorAcuan : komp(d) ? HASIL.pesertaKompetensi(SINGKAT[m]) : HASIL.pesertaMateri(SINGKAT[m], d.kelas);
    return s
      ? `<div class="row"><span>${SINGKAT[m]}</span><div class="bar"><i style="width:${s.skor}%;background:${WARNA.mapel[m]}"></i></div><b>${s.skor}</b></div>${
          typeof s.persentil === 'number' && s.persentil >= 10 ? `<div class="pct">${e(HASIL.lebihTinggi(s.persentil, pembanding))}</div>` : ''}`
      : `<a class="row todo" href="${urlMapel(m)}"><span>${SINGKAT[m]}</span><em>${e(HASIL.belumDikerjakan)} <span aria-hidden="true">→</span></em></a>`;
  };
  const baris = `<h3 class="grp">${e(komp(d) ? HASIL.grupKompetensi : HASIL.grupMateri(d.kelas))}</h3>${bagianDari(d).map(barisHtml).join('')}`;
  const sisa = bagianDari(d).filter((m) => !d.mapel[m]);
  // ?baru → selalu memulai sesi baru, walau tab ini masih menyimpan sesi lama yang sudah selesai.
  const urlTes = komp(d) ? '/tes/kompetensi?baru' : `/tes/kelas/${d.kelas}?baru`;
  const daftarMateri = materiUntukKelas(d.kelas);
  const mapelBuku = daftarMateri.find((m) => d.mapel[m]) ?? daftarMateri[0] ?? 'mtk';
  const saran = saranHasil(d);
  const teksBagikan = `${judul}. ${saranHasil(d)} ${HASIL.ajakanKartu}`;
  const tantang = KALIMAT.tantang(komp(d) ? HASIL.namaTesKompetensi : HASIL.namaTesMateri(d.kelas), (komp(d) ? d.kompetensi : d.materi) ?? d.rata, d.predikat);
  // Soal yang belum tepat: nomor, bab/topik, level — tanpa teks soal dan tanpa kunci.
  let offset = 0;
  const salah = bagianDari(d).flatMap((m) => {
    const v = d.mapel[m]; const off = offset; offset += v?.jumlah ?? 0;
    return (v?.butir ?? []).filter((x) => !x.ok).map((x) => ({ ...x, n: komp(d) ? x.n + off : x.n, label: SINGKAT[m] }));
  });
  const adaButir = bagianDari(d).some((m) => d.mapel[m]?.butir?.length);
  const belumTepat = !adaButir ? '' : !salah.length ? `<p class="ok">${e(UI.semuaTepat)}</p>`
    : `<details class="bt"${salah.length <= 8 ? ' open' : ''}><summary>${e(UI.belumTepatJudul(salah.length))}</summary><p>${e(UI.belumTepatKet)}</p><ol>${
      salah.map((x) => `<li><b>No. ${x.n}</b><span>${e([x.label, x.bab ? `Bab ${x.bab}` : '', x.topik ?? ''].filter(Boolean).join(' · '))}</span><em class="${x.level === 'hots' ? 'hots' : ''}">${e(NAMA_LEVEL[x.level as 'lots'] ?? x.level)}</em></li>`).join('')}</ol></details>`;
  const rinci = d.rincian ? LEVEL.filter((l) => d.rincian![l]?.[1]).map((l) => {
    const [b, n] = d.rincian![l]!;
    return `<div class="rin"><span>${NAMA_LEVEL[l]}</span><div class="bar"><i style="width:${Math.round((b / n) * 100)}%;background:${l === 'hots' ? WARNA.gold : WARNA.brand}"></i></div><b>${b}/${n}</b></div>`;
  }).join('') : '';
  const rayakan = (komp(d) ? d.kompetensi ?? 0 : d.materi ?? 0) >= 80;
  return `<!doctype html><html lang="id"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${e(judul)} · ${e(SITUS.nama)}</title>
<meta name="description" content="${e(deskripsi)}">
<meta property="og:type" content="website">
<meta property="og:title" content="${e(judul)}">
<meta property="og:description" content="${e(deskripsi)}">
<meta property="og:image" content="${og}">
<meta property="og:image:width" content="1080"><meta property="og:image:height" content="1350">
<meta property="og:url" content="${asal}/tes/hasil/${id}">
<meta name="twitter:card" content="summary_large_image">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap">
<style>
*{box-sizing:border-box}html{background:${WARNA.biruAdem}}body{margin:0;min-height:100vh;background:linear-gradient(180deg,${WARNA.biruAdem} 0%,${WARNA.biruLembut} 50%,${WARNA.biruAdem} 100%) fixed;color:${WARNA.ink};font-family:'Plus Jakarta Sans',system-ui,sans-serif}
main{max-width:480px;margin:0 auto;padding:16px 16px 170px;display:grid;gap:20px}
.bawah{position:fixed;left:0;right:0;bottom:0;z-index:20;background:rgba(237,246,252,.9);-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);border-top:1px solid ${WARNA.line};padding:10px 16px calc(10px + env(safe-area-inset-bottom))}
.bawah>div{max-width:480px;margin:0 auto;display:grid;gap:8px}.bawah .btn{min-height:46px;font-size:15px}.bawah .coba{display:grid;grid-template-columns:1fr 1fr;gap:8px}.bawah .sec{background:rgba(255,255,255,.7)}.bawah .share a,.bawah .share button{padding:7px 2px;border-radius:14px;font-size:10.5px;gap:2px}.bawah .share svg{width:20px;height:20px}
.bt{background:${WARNA.surface100};border-radius:20px;padding:14px 16px}.bt summary{font-weight:800;cursor:pointer}.bt p{font-size:13px;color:${WARNA.inkMuted};margin:6px 0 8px}
.bt ol{list-style:none;margin:0;padding:0;display:grid}.bt li{display:grid;grid-template-columns:52px 1fr auto;gap:8px;align-items:center;font-size:14px;padding:7px 0;border-top:1px solid ${WARNA.surface300}}
.bt em{font-style:normal;font-size:11px;font-weight:800;padding:2px 8px;border-radius:999px;background:${WARNA.surface300}}.bt em.hots{background:${WARNA.gold}}
.ok{margin:0;padding:12px 16px;border-radius:16px;background:#d9efe3;font-weight:700}
.card{background:${WARNA.surface100};border-radius:28px;overflow:hidden;box-shadow:0 1px 2px rgba(27,42,47,.06),0 8px 24px rgba(27,42,47,.06)}
.top{background:linear-gradient(160deg,${WARNA.head},${WARNA.brand});color:${WARNA.onBrand};padding:24px}
.lab{font-size:13px;font-weight:600;letter-spacing:.04em}
.score{display:flex;align-items:baseline;gap:8px;margin-top:8px}.score b{font-size:72px;line-height:.95;font-weight:800;letter-spacing:-.02em}.score span{font-weight:600}
.claim{margin:12px 0 0;font-size:22px;line-height:28px;font-weight:800}
.pred{display:inline-block;margin-top:16px;background:${WARNA.gold};color:${WARNA.ink};font-weight:800;font-size:16px;padding:6px 14px;border-radius:999px}
.body{padding:24px;display:grid;gap:16px}
.row{display:grid;grid-template-columns:64px 1fr 36px;align-items:center;gap:8px;font-size:14px;font-weight:600}
.row b{text-align:right}.bar{height:10px;background:${WARNA.surface300};border-radius:999px;overflow:hidden}.bar i{display:block;height:100%;border-radius:999px}
.todo{grid-template-columns:64px 1fr}.todo em{font-style:normal;font-size:13px;color:${WARNA.inkMuted};background:${WARNA.goldTint};border-radius:999px;padding:4px 12px;justify-self:start}
a.row.todo{color:inherit;text-decoration:none}a.row.todo:hover em{text-decoration:underline}a.row.todo:focus-visible{outline:2px solid ${WARNA.brand};outline-offset:4px;border-radius:8px}
.btns{display:grid;gap:8px}
.btn{display:flex;align-items:center;justify-content:center;min-height:52px;border-radius:16px;font:inherit;font-weight:700;font-size:16px;text-decoration:none;cursor:pointer;border:2px solid transparent}
.pri{background:${WARNA.brand};color:${WARNA.onBrand}}.pri:hover{background:${WARNA.brandStrong}}
.sec{background:transparent;border-color:${WARNA.line};color:${WARNA.ink}}
.btn:focus-visible{outline:2px solid ${WARNA.brand};outline-offset:2px}
.dua{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px}
.skor2{background:${WARNA.surface200};border-radius:18px;padding:12px 14px;display:grid;gap:2px}
.skor2 span{font-size:12px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;color:${WARNA.inkMuted}}
.skor2 b{font-size:34px;line-height:1.1;font-weight:800;letter-spacing:-.02em}.skor2 b.kosong{font-size:16px;color:${WARNA.inkMuted}}
.skor2 small{font-size:12px;color:${WARNA.inkMuted};font-weight:600}
.grp{margin:8px 0 0;font-size:12px;letter-spacing:.06em;text-transform:uppercase;color:${WARNA.inkMuted}}
.saran{margin:8px 0 0;font-size:15px;line-height:22px;opacity:.92}
.row{grid-template-columns:80px 1fr 36px!important}.todo{grid-template-columns:80px 1fr!important}
.pct{font-size:12px;color:${WARNA.brand};font-weight:700;margin:-8px 0 0 88px}
.rinci{display:grid;gap:8px;padding:16px;border-radius:16px;background:${WARNA.surface200}}.rinci h3{margin:0 0 4px;font-size:13px;letter-spacing:.04em;text-transform:uppercase;color:${WARNA.inkMuted}}
.rin{display:grid;grid-template-columns:88px 1fr 40px;gap:8px;align-items:center;font-size:13px;font-weight:600}.rin b{text-align:right}
.share{display:grid;grid-template-columns:repeat(5,1fr);gap:8px}.share a,.share button{display:grid;place-items:center;gap:4px;padding:10px 4px;border-radius:16px;border:2px solid ${WARNA.line};background:${WARNA.surface100};color:${WARNA.ink};font:inherit;font-size:11px;font-weight:700;text-decoration:none;cursor:pointer}
.share svg{width:22px;height:22px}.share a:hover,.share button:hover{background:${WARNA.surface300}}
.lbl{font-size:13px;font-weight:600;letter-spacing:.04em;text-transform:uppercase;color:${WARNA.inkMuted};margin:0}
.tantang{background:${WARNA.surface100};border:2px dashed ${WARNA.brand};border-radius:20px;padding:16px;display:grid;gap:8px}.tantang p{margin:0;font-weight:700}
@keyframes masuk{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}.card{animation:masuk .5s cubic-bezier(.2,.8,.2,1) both}
@media (prefers-reduced-motion:reduce){.card{animation:none}}
.cta{background:${WARNA.goldTint};border-radius:28px;padding:24px;display:grid;gap:16px}
.cta p{margin:0;font-size:19px;line-height:27px;font-weight:700}.cta p span{display:block;font-size:16px;font-weight:400;color:${WARNA.inkMuted}}
.cta a{justify-self:start;display:inline-flex;align-items:center;min-height:48px;padding:0 24px;border-radius:999px;background:${WARNA.brand};color:${WARNA.onBrand};font-weight:700;text-decoration:none}
footer{text-align:center;font-size:13px;color:${WARNA.inkMuted}}
</style></head><body><main>
<div class="card"><div class="top"><div class="lab">${e(labelAtas(d))}</div>
<p class="claim">${e(judul)}</p>
<p class="saran">${e(saran)}</p>
<div class="pred">${e(d.predikat)}</div></div>
<div class="body">${baris}</div></div>
${belumTepat}
${rinci ? `<div class="rinci"><h3>${e(HASIL.rincianJudul)}</h3>${rinci}</div>` : ''}
<div class="tantang"><p>${e(HASIL.tantangJudul)}</p><span style="font-size:14px;color:${WARNA.inkMuted}">${e(HASIL.tantangKet)}</span>
<button class="btn pri" id="sh-tantang" type="button">${e(HASIL.tantangTombol)}</button></div>
<div class="btns">
${komp(d) ? '' : `<a class="btn sec" href="/tes/kompetensi">${e(HASIL.ujiKompetensi)}</a>`}
</div>
<div class="cta"><p>${e(UI.bukuJudul)}<span>${e(komp(d) ? UI.bukuKompetensi : UI.bukuMateri(NAMA_MAPEL[mapelBuku], d.kelas))}</span></p>
<a href="${komp(d) ? '/buku' : `/buku?kelas=${d.kelas}&amp;mapel=${mapelBuku}`}">${e(UI.bukuTombol)}</a></div>
${sisa.length ? `<footer>${e(HASIL.belumDikerjakanDaftar(sisa.map((m) => NAMA_MAPEL[m]).join(', ')))}</footer>` : ''}
<footer>${e(SITUS.nama)} · ${e(SITUS.penerbit)}</footer>
<nav class="bawah" aria-label="${e(HASIL.bagikanJudul)}"><div>
<div class="share">
<a id="sh-wa" target="_blank" rel="noopener" aria-label="Bagikan ke WhatsApp"><svg viewBox="0 0 24 24" fill="#25D366"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm5.3 14.2c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .2-3.3-.7-2.8-1.1-4.5-4-4.7-4.2-.1-.2-1.1-1.5-1.1-2.9s.7-2 1-2.3c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 2c.1.2.1.4 0 .5l-.4.6-.4.4c-.1.2-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.3 2.4 1.5.3.1.5.1.6-.1l.9-1c.2-.3.4-.2.6-.1l1.9.9c.3.1.5.2.5.3.1.2.1.7-.1 1.3z"/></svg>WhatsApp</a>
<a id="sh-tg" target="_blank" rel="noopener" aria-label="Bagikan ke Telegram"><svg viewBox="0 0 24 24" fill="#229ED9"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm4.6 6.8-1.6 7.7c-.1.6-.5.7-1 .4l-2.6-1.9-1.3 1.2c-.1.1-.3.3-.6.3l.2-2.7 4.9-4.4c.2-.2 0-.3-.3-.1l-6 3.8-2.6-.8c-.6-.2-.6-.6.1-.8l10.1-3.9c.5-.2.9.1.7.9z"/></svg>Telegram</a>
<a id="sh-fb" target="_blank" rel="noopener" aria-label="Bagikan ke Facebook"><svg viewBox="0 0 24 24" fill="#1877F2"><path d="M24 12a12 12 0 1 0-13.9 11.9v-8.4h-3V12h3V9.4c0-3 1.8-4.7 4.5-4.7 1.3 0 2.7.2 2.7.2v2.9h-1.5c-1.5 0-2 .9-2 1.9V12h3.4l-.5 3.5h-2.9v8.4A12 12 0 0 0 24 12z"/></svg>Facebook</a>
<button id="sh-salin" type="button" aria-label="Salin tautan"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg><span>${e(HASIL.salin)}</span></button>
<a href="/api/tes/og/${id}" download="hasil-tes-guru-sdit.png" aria-label="Unduh kartu hasil untuk status/Instagram"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3v12m0 0-4-4m4 4 4-4M4 21h16"/></svg>${e(HASIL.kartu)}</a>
</div>
<div class="coba"><a class="btn pri" href="${urlTes}">${e(komp(d) ? HASIL.cobaTesIni : HASIL.cobaTesKelas(d.kelas))}</a><a class="btn sec" href="/tes">${e(komp(d) ? HASIL.tesMateri : HASIL.cobaKelasLain)}</a></div></div></nav>
</main>
<script>
(function(){
var url=location.href.split('#')[0], teks=${JSON.stringify(teksBagikan).replace(/</g, '\\u003c')}, tantang=${JSON.stringify(tantang).replace(/</g, '\\u003c')};
var q=encodeURIComponent;
document.getElementById('sh-wa').href='https://wa.me/?text='+q(teks+' '+url);
document.getElementById('sh-tg').href='https://t.me/share/url?url='+q(url)+'&text='+q(teks);
document.getElementById('sh-fb').href='https://www.facebook.com/sharer/sharer.php?u='+q(url);
document.getElementById('sh-salin').addEventListener('click',function(){var b=this.querySelector('span');
  (navigator.clipboard?navigator.clipboard.writeText(url):Promise.reject()).then(function(){b.textContent=${JSON.stringify(HASIL.tersalin)};setTimeout(function(){b.textContent=${JSON.stringify(HASIL.salin)}},2000)},function(){prompt('Salin tautan ini:',url)});});
document.getElementById('sh-tantang').addEventListener('click',function(){var t=tantang+' '+url;
  if(navigator.share){navigator.share({title:document.title,text:tantang,url:url}).catch(function(){});return;}
  location.href='https://wa.me/?text='+q(t);});
${rayakan ? KONFETI : ''}
})();
</script></body></html>`;
}

// Konfeti mini untuk halaman hasil (versi tanpa modul dari src/scripts/konfeti.ts).
const KONFETI = `if(!matchMedia('(prefers-reduced-motion: reduce)').matches)setTimeout(function(){var c=document.createElement('canvas');c.style.cssText='position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:50';document.body.appendChild(c);var x=c.getContext('2d'),d=Math.min(devicePixelRatio||1,2),W=c.width=innerWidth*d,H=c.height=innerHeight*d,C=['#1f6fa8','#e3a72f','#2f9466','#f0b44c','#a8355a'],P=[];for(var i=0;i<140;i++)P.push({x:W/2+(Math.random()-.5)*W*.3,y:H*.3,vx:(Math.random()-.5)*18*d,vy:(-Math.random()*16-6)*d,s:(6+Math.random()*6)*d,r:Math.random()*3,vr:(Math.random()-.5)*.3,w:C[i%5]});var t0=performance.now();(function f(t){var k=(t-t0)/2200;x.clearRect(0,0,W,H);x.globalAlpha=Math.max(0,1-k*k);P.forEach(function(p){p.vy+=.45*d;p.vx*=.99;p.x+=p.vx;p.y+=p.vy;p.r+=p.vr;x.save();x.translate(p.x,p.y);x.rotate(p.r);x.fillStyle=p.w;x.fillRect(-p.s/2,-p.s/4,p.s,p.s/2);x.restore()});if(k<1)requestAnimationFrame(f);else c.remove()})(t0)},400);`;
