const { chromium } = require('playwright');
const path = require('path'), http = require('http'), fs = require('fs');
exports.open = async function (root, h, opts) {
  opts = opts || {};
  const srv = http.createServer((q, s) => { let f = path.join(root, decodeURIComponent(q.url.split('?')[0])); if (f.endsWith('/')) f += 'index.html';
    fs.readFile(f, (e, d) => { if (e) { s.writeHead(404); s.end(); return; }
      s.writeHead(200, {'Content-Type': f.endsWith('.js') ? 'text/javascript' : f.endsWith('.html') ? 'text/html' : f.endsWith('.json') ? 'application/json' : 'image/png'}); s.end(d); }); }).listen(0);
  const b = await chromium.launch({ executablePath: process.env.CHROME || undefined, args: ['--no-sandbox'] });
  const ctx = await b.newContext({ viewport: { width: 375, height: h || 667 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2, serviceWorkers: 'block' });
  const p = await ctx.newPage(); const errs = [];
  p.on('pageerror', e => errs.push('PAGEERROR ' + String(e)));
  p.on('console', m => { if (m.type() === 'error' && !/404|Ignored attempt to cancel a touchstart/.test(m.text())) errs.push('CONSOLE ' + m.text()); });
  if (opts.init) await p.addInitScript(opts.init);
  await p.goto('http://localhost:' + srv.address().port + '/index.html');
  await p.waitForTimeout(150);
  return { p, b, srv, errs, ctx, close: async () => { await b.close(); srv.close(); } };
};
// stage coords -> client coords
exports.pt = async function (p, id, x, y) {
  return await p.evaluate(([id, x, y]) => { const s = document.getElementById(id), r = s.getBoundingClientRect();
    const vb = s.getAttribute('viewBox').split(/\s+/).map(Number); const sc = Math.min(r.width / vb[2], r.height / vb[3]);
    return [r.left + (r.width - vb[2] * sc) / 2 + x * sc, r.top + (r.height - vb[3] * sc) / 2 + y * sc]; }, [id, x, y]);
};
exports.tap = async function (p, id, x, y) { const c = await exports.pt(p, id, x, y); await p.touchscreen.tap(c[0], c[1]); };
// real touch drag via CDP
exports.drag = async function (p, id, x1, y1, x2, y2, steps, hold) {
  const a = await exports.pt(p, id, x1, y1), b = await exports.pt(p, id, x2, y2);
  const cdp = p._cdp || (p._cdp = await p.context().newCDPSession(p));
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: a[0], y: a[1], id: 1 }] });
  steps = steps || 8;
  for (let i = 1; i <= steps; i++) {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: a[0] + (b[0] - a[0]) * i / steps, y: a[1] + (b[1] - a[1]) * i / steps, id: 1 }] });
    await p.waitForTimeout(12);
  }
  if (hold) await p.waitForTimeout(hold);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
};
exports.path = async function (p, id, pts, pause) {
  const cdp = p._cdp || (p._cdp = await p.context().newCDPSession(p));
  const c0 = await exports.pt(p, id, pts[0][0], pts[0][1]);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: c0[0], y: c0[1], id: 1 }] });
  for (let i = 1; i < pts.length; i++) { const c = await exports.pt(p, id, pts[i][0], pts[i][1]);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: c[0], y: c[1], id: 1 }] }); await p.waitForTimeout(pause || 12); }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
};
exports.geo = async function (p) {
  return await p.evaluate(() => { const bad = []; document.querySelectorAll('svg *').forEach(e => { for (const a of e.attributes) { if (/NaN|undefined|Infinity/.test(a.value)) bad.push(e.tagName + ' ' + a.name + '=' + a.value.slice(0, 40)); } }); return bad; });
};
exports.overflow = async function (p) {
  return await p.evaluate(() => { const out = []; const vh = window.innerHeight, vw = window.innerWidth;
    const scr = document.querySelector('.screen.on'); if (!scr) return ['no screen'];
    scr.querySelectorAll('*').forEach(e => { if (e.closest('svg') && e.tagName !== 'svg') return; if (e.closest('#cards,#nodes') && e.id !== 'cards' && e.id !== 'nodes') return;
      const st = getComputedStyle(e); if (st.display === 'none' || st.visibility === 'hidden') return; if (e.classList.contains('toast') || e.classList.contains('bit')) return;
      if (e.closest('.over') && !e.closest('.over.on')) return; if (e.closest('#hint') && !e.closest('#hint.on')) return;
      const r = e.getBoundingClientRect(); if (r.width === 0 && r.height === 0) return;
      if (r.bottom > vh + 0.5 || r.right > vw + 0.5 || r.left < -0.5 || r.top < -0.5) out.push((e.id || e.className || e.tagName) + ' b=' + Math.round(r.bottom) + ' r=' + Math.round(r.right)); });
    return out; });
};
