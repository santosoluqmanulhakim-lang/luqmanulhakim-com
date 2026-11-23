// Konfeti ringan tanpa pustaka. Tidak jalan bila pengguna memilih "kurangi gerakan".
export function konfeti(durasiMs = 2200) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const c = document.createElement('canvas');
  c.setAttribute('aria-hidden', 'true');
  Object.assign(c.style, { position: 'fixed', inset: '0', width: '100%', height: '100%', pointerEvents: 'none', zIndex: '50' });
  document.body.append(c);
  const ctx = c.getContext('2d')!;
  const dpr = Math.min(devicePixelRatio || 1, 2);
  const W = (c.width = innerWidth * dpr), H = (c.height = innerHeight * dpr);
  const warna = ['#1f6fa8', '#e3a72f', '#2f9466', '#f0b44c', '#a8355a', '#7cc0ef'];
  const p = Array.from({ length: 140 }, () => ({
    x: W / 2 + (Math.random() - 0.5) * W * 0.3, y: H * 0.35,
    vx: (Math.random() - 0.5) * 18 * dpr, vy: (-Math.random() * 16 - 6) * dpr,
    s: (6 + Math.random() * 6) * dpr, r: Math.random() * Math.PI, vr: (Math.random() - 0.5) * 0.3,
    w: warna[(Math.random() * warna.length) | 0],
  }));
  const t0 = performance.now();
  (function frame(t: number) {
    const k = (t - t0) / durasiMs;
    ctx.clearRect(0, 0, W, H);
    ctx.globalAlpha = Math.max(0, 1 - k * k);
    for (const q of p) {
      q.vy += 0.45 * dpr; q.vx *= 0.99; q.x += q.vx; q.y += q.vy; q.r += q.vr;
      ctx.save(); ctx.translate(q.x, q.y); ctx.rotate(q.r); ctx.fillStyle = q.w;
      ctx.fillRect(-q.s / 2, -q.s / 4, q.s, q.s / 2); ctx.restore();
    }
    if (k < 1) requestAnimationFrame(frame); else c.remove();
  })(t0);
}

/** Angka berjalan dari 0 ke `ke`. */
export function hitungNaik(el: HTMLElement, ke: number, ms = 900) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) { el.textContent = String(ke); return; }
  const t0 = performance.now();
  (function f(t: number) {
    const k = Math.min(1, (t - t0) / ms);
    el.textContent = String(Math.round(ke * (1 - Math.pow(1 - k, 3))));
    if (k < 1) requestAnimationFrame(f);
  })(t0);
}
