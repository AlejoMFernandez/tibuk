// Tibuk · moodboard V2: enredadera, intro, hero B (un día) y la casona
const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const html = document.documentElement;
const celu = () => innerWidth < 768;
const conIntro = html.classList.contains('con-intro');
const heroB = false;

// ---------- plato de la pizarra (template del kit) ----------
const escH = (s) => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
window.tibukItem = (p, c) => {
  const precio = p.precio != null ? c.money(p.precio) : 'Consultar';
  const casa = (p.etiquetas || []).includes('casa') ? '<span class="pl__casa">De la casa</span>' : '';
  const foto = p.foto ? `<button class="pl__foto" type="button" data-ver-foto>Foto</button>` : '';
  return `<div class="pl"><h3 class="pl__nom">${escH(p.nombre)}</h3><span class="pl__precio">${precio}</span>${p.descripcion || casa || foto ? `<p class="pl__desc">${escH(p.descripcion)} <span class="pl__tags">${casa}${foto}</span></p>` : ''}</div>`;
};

// ---------- azar con semilla (siempre la misma enredadera) ----------
function azar(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const OSC = ['#2F4A1E', '#3F5E22', '#4E6E28', '#24391A', '#36531F', '#45652A'];
const VIVAS = ['#6E8F2E', '#86A035', '#A9AE3E', '#5E7F2C'];
const HOJA = '<svg viewBox="0 0 100 100"><use href="#hoja"/></svg>';

// ---------- la enredadera (hero A, marco del hero B y menú) ----------
function enredadera(cont, modo) {
  const W = cont.clientWidth, H = cont.clientHeight; if (!W || !H) return [];
  const r = azar(modo === 'hero' ? 7 : modo === 'marco' ? 11 : 3);
  const c = celu();
  const tMin = c ? 58 : 80, tMax = c ? 88 : 122;
  // el hueco (mismo que la máscara del CSS)
  const hx = W * (c ? .5 : .56), hy = H * (c ? .275 : .41), hw = (c ? .48 : .40) * W, hh = (c ? .23 : .37) * H;
  const zonaTexto = H * (c ? .5 : .62);
  const paso = (tMin + tMax) / 2 * (modo === 'menu' ? .9 : .5);
  const hojas = [];
  const add = (x, y, d) => {
    const t = tMin + r() * (tMax - tMin);
    let tapa = false, dist = 9;
    if (modo === 'hero') { dist = Math.hypot((x - hx) / hw, (y - hy) / hh); if (dist < .9) tapa = true; }
    if (modo === 'marco') { // solo un marco: arriba y a los costados
      const bx = Math.min(x, W - x), by = y; const borde = c ? 46 : 84;
      if (bx > borde && by > borde * 1.1) return;
      if (y > H * .55 && bx > borde * .6) return;
    }
    const enTexto = y + t * .5 > zonaTexto && modo !== 'menu';
    const viva = !enTexto && !tapa && modo !== 'menu' && dist < 1.35 && r() < .38;
    const col = viva ? VIVAS[(r() * VIVAS.length) | 0] : OSC[(r() * OSC.length) | 0];
    const delay = ((x / W) + (1 - y / H)) / 2;
    hojas.push({ x, y, t, rot: (r() * 360) | 0, s: .85 + r() * .3, col, tapa, dist, delay, ang: Math.atan2(y - hy, x - hx) });
  };
  for (let y = -tMax * .3; y < H + tMax * .4; y += paso) {
    for (let x = -tMax * .3; x < W + tMax * .4; x += paso) add(x + (r() - .5) * paso * .9, y + (r() - .5) * paso * .9);
  }
  if (modo === 'hero') { // un borde irregular alrededor del hueco
    const n = c ? 26 : 40;
    for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2 + r() * .1, k = .95 + r() * .1; add(hx + Math.cos(a) * hw * k, hy + Math.sin(a) * hh * k); }
  }
  const lento = c ? .55 : .8;
  const frag = document.createDocumentFragment();
  hojas.forEach((h, i) => {
    const e = document.createElement('i');
    e.className = 'h' + (h.tapa ? ' tapa' : '') + (r() < .35 && !h.tapa ? ' mece' : '');
    const lejos = c ? 340 : 620;
    e.style.cssText = `--x:${h.x.toFixed(0)}px;--y:${h.y.toFixed(0)}px;--t:${h.t.toFixed(0)}px;--r:${h.rot}deg;--s:${h.s.toFixed(2)};--c:${h.col};--d:${(h.delay * lento).toFixed(2)}s;--d2:${(h.dist * .22).toFixed(2)}s;--ox:${(Math.cos(h.ang) * lejos).toFixed(0)}px;--oy:${(Math.sin(h.ang) * lejos).toFixed(0)}px;--m:${(3 + r() * 2.5).toFixed(1)}s;--md:-${(r() * 3).toFixed(1)}s`;
    e.innerHTML = HOJA; h.el = e; frag.appendChild(e);
  });
  cont.replaceChildren(frag);
  return hojas.filter(h => !h.tapa);
}

// ---------- correr las hojas con el mouse o el dedo ----------
function correrHojas(zona, hojas) {
  if (!zona || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  let px = -999, py = -999, raf = 0; const movidas = new Set();
  const R = () => celu() ? 150 : 260;
  const pinta = () => {
    raf = 0; const rad = R();
    for (const h of movidas) { if (Math.hypot(h.x - px, h.y - py) > rad) { h.el.style.removeProperty('--px'); h.el.style.removeProperty('--py'); h.el.style.removeProperty('--pr'); h.el.style.removeProperty('--ps'); movidas.delete(h); } }
    for (const h of hojas) {
      const dx = h.x - px, dy = h.y - py, d = Math.hypot(dx, dy); if (d > rad || d < 1) continue;
      const f = Math.pow(1 - d / rad, .7); const k = f * (celu() ? 90 : 170);
      h.el.style.setProperty('--px', (dx / d * k).toFixed(1) + 'px'); h.el.style.setProperty('--py', (dy / d * k).toFixed(1) + 'px'); h.el.style.setProperty('--pr', (f * 60 * Math.sign(dx || 1)).toFixed(0) + 'deg'); h.el.style.setProperty('--ps', (1 - f * .45).toFixed(2));
      movidas.add(h);
    }
  };
  const mueve = (e) => { const b = zona.getBoundingClientRect(); px = e.clientX - b.left; py = e.clientY - b.top; if (!raf) raf = requestAnimationFrame(pinta); };
  zona.addEventListener('pointermove', mueve, { passive: true });
  zona.addEventListener('pointerdown', mueve, { passive: true });
  zona.addEventListener('touchmove', (e) => { const t = e.touches[0]; if (t) mueve(t); }, { passive: true });
  zona.addEventListener('pointerleave', () => { px = py = -999; if (!raf) raf = requestAnimationFrame(pinta); });
}

// ---------- abierto / cerrado (hora de Buenos Aires) ----------
const HORARIOS = { 0: [['10:00', '17:00']], 1: [['10:00', '23:30']], 2: [], 3: [['10:00', '24:00']], 4: [['10:00', '24:00']], 5: [['10:00', '24:00']], 6: [['10:00', '24:00']] };
function estado() {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: 'America/Argentina/Buenos_Aires', weekday: 'short', hour: 'numeric', minute: 'numeric', hourCycle: 'h23' }).formatToParts(new Date()).map(x => [x.type, x.value]));
  const dia = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(p.weekday); const min = (+p.hour) * 60 + (+p.minute);
  const m = (s) => { const [a, b] = s.split(':'); return a * 60 + +b; };
  const hoy = HORARIOS[dia];
  for (const [a, b] of hoy) if (min >= m(a) && min < m(b)) return { abierto: true, txt: `Abierto hasta las ${b === '24:00' ? '00:00' : b} hs` };
  if (dia === 2) return { abierto: false, txt: 'Hoy cerrado · mañana 10:00 hs' };
  if (hoy.length && min < m(hoy[0][0])) return { abierto: false, txt: `Abre hoy a las ${hoy[0][0]} hs` };
  return { abierto: false, txt: `Cerrado · abre ${dia === 1 ? 'el miércoles' : 'mañana'} 10:00 hs` };
}
const est = estado();
$$('[data-estado]').forEach(e => { e.textContent = est.txt; e.classList.toggle('cerrado', !est.abierto); });

// ---------- arranque ----------
const ha = $('.ha'), hbPin = $('.hb-pin');
let hojasHero = [];
if (!heroB) { hojasHero = enredadera($('[data-hojas="hero"]'), 'hero'); correrHojas(ha, hojasHero); }
else { const m = enredadera($('[data-hojas="marco"]'), 'marco'); correrHojas(hbPin, m); }

function intro() {
  if (!conIntro) return;
  const c = celu();
  const T = c ? { brotar: 40, vuela: 760, abrir: 820, texto: 1150, fin: 1750 } : { brotar: 80, vuela: 1250, abrir: 1250, texto: 1700, fin: 2500 };
  const logo = $('.intro-marca__logo'), destino = $('.nav-marca svg');
  const listo = Promise.race([Promise.all([document.fonts.ready, new Promise(r => { const im = $(heroB ? '.hb-m img' : '.ha-foto img'); if (!im || im.complete) r(); else { im.onload = im.onerror = r; } })]), new Promise(r => setTimeout(r, 900))]);
  listo.then(() => {
    const t0 = performance.now(); const at = (ms, fn) => setTimeout(fn, Math.max(0, ms - (performance.now() - t0)));
    at(T.brotar, () => html.classList.add('brotar'));
    at(T.vuela, () => {
      const a = logo.getBoundingClientRect(), b = destino.getBoundingClientRect();
      const s = b.width / a.width; logo.style.transform = `translate(${(b.left + b.width / 2) - (a.left + a.width / 2)}px,${(b.top + b.height / 2) - (a.top + a.height / 2)}px) scale(${s})`;
    });
    at(T.abrir, () => html.classList.add('abrir'));
    at(T.vuela + 600, () => { html.classList.add('vuela'); $('.nav').style.opacity = '1'; });
    at(T.texto, () => html.classList.add('texto'));
    at(T.fin, () => { html.classList.remove('con-intro', 'brotar', 'abrir', 'vuela', 'texto'); html.classList.add('intro-fin'); $('.nav').style.removeProperty('opacity'); });
  });
}
// escalonado del texto del hero
$$('.ha-tit .ln:nth-child(1)>span, .ha-tit .ln:nth-child(2)>span, .ha-txt .kicker, .ha-sub, .ha-txt .ctas').forEach((e, i) => e.style.setProperty('--e', (i * .08) + 's'));
$$('.hb-txt>*').forEach((e, i) => e.style.setProperty('--e', (i * .08) + 's'));
intro();

// ---------- WOW: la casona ----------
const PARTES = {
  vereda: { foto: 'img/pz-vereda.webp', kicker: 'La veredita', tit: 'La más linda del boulevard', txt: 'Sombrillas rojas, la casa verde de fondo y la mesa al sol. Se llena seguido: mejor reservar.', dato: 'Todos los días desde las 10:00 hs · Martes cerrado', cta: ['Reservar en la vereda', 'reserva', 'vereda'] },
  salon: { foto: 'img/pz-salon.webp', kicker: 'El salón', tit: 'Ladrillo, cuadros y luz baja', txt: 'Mesas de madera, lámparas de cobre y los cuadros de la casa. Para la cena de todos los días o el festejo de fin de año.', dato: 'Cubierto $4.200 · 10% off en efectivo', cta: ['Reservar en el salón', 'reserva', 'salon'] },
  cocina: { foto: 'img/pz-cocina.webp', kicker: 'La cocina de Julián', tit: 'Pan casero y cocina de autor', txt: 'Julián Tiberio, chef y dueño, ganó el Tigre de Oro. Firma las mollejas Tibuk, el rösti de salmón y la carrillera.', dato: 'Rösti de salmón $44.000 · Mollejas $35.000', cta: ['Ver la pizarra del chef', 'carta'] },
  horno: { foto: 'img/pz-horno.webp', kicker: 'El horno de barro', tit: 'Lo que sale del barro', txt: 'El Pollo Tibuk con adobo marroquí y las frutas quemadas con helado se hacen en el horno de barro del fondo.', dato: 'Pollo Tibuk $29.000 · Frutas quemadas $19.000', cta: ['Ver la pizarra del chef', 'carta'] },
  cava: { foto: 'img/pz-cava.webp', kicker: 'La cava', tit: 'Más de 150 vinos y catas', txt: 'Malbec, cabernet franc, espumantes y hasta vinos sin alcohol. Catas con bodegas y degustaciones en la casa.', dato: 'Copa premium $9.000 · Descorche $30.000', cta: ['Ver las próximas catas', 'catas'] },
};
const escena = $('.escena'), piz = $('.pizarra');
function enredaderaCasa() {
  const g = $('[data-enredadera]'); if (!g) return;
  const r = azar(21), evita = [[138, 224, 372, 488], [628, 224, 862, 488], [424, 288, 576, 704], [452, 186, 548, 274], [616, 582, 874, 698], [380, 516, 420, 568]];
  const dentro = (x, y) => evita.some(([a, b, c, d]) => x > a + 8 && x < c - 8 && y > b + 8 && y < d - 8);
  const COLS = ['#2F4A1E', '#3F5E22', '#4E6E28', '#5E7F2C', '#6E8F2E', '#36531F'];
  let out = '';
  const pon = (x, y, t) => { if (dentro(x, y)) return; out += `<use href="#hoja" x="${(x - t / 2).toFixed(0)}" y="${(y - t / 2).toFixed(0)}" width="${t.toFixed(0)}" height="${t.toFixed(0)}" fill="${COLS[(r() * COLS.length) | 0]}" transform="rotate(${(r() * 360) | 0} ${x.toFixed(0)} ${y.toFixed(0)})"/>`; };
  for (let i = 0; i < 230; i++) { const x = 70 + r() * 860, y = 104 + Math.pow(r(), 1.7) * 150; pon(x, y, 30 + r() * 26); }          // la copa de arriba
  for (let i = 0; i < 90; i++) { const lado = r() < .55, x = lado ? 76 + r() * 70 : 868 + r() * 56, y = 180 + Math.pow(r(), .9) * 430; pon(x, y, 28 + r() * 22); } // bajan por los costados
  for (let i = 0; i < 40; i++) { const x = 380 + r() * 250, y = 230 + r() * 60; pon(x, y, 26 + r() * 18); }                            // sobre la puerta
  g.innerHTML = out;
}
enredaderaCasa();
const ioCasa = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { $$('image[data-href]').forEach(i => i.setAttribute('href', i.dataset.href)); ['img/pz-vereda.webp','img/pz-salon.webp','img/pz-cocina.webp','img/pz-horno.webp','img/pz-cava.webp'].forEach(s => { const im = new Image(); im.src = s; }); ioCasa.disconnect(); } }, { rootMargin: '600px 0px' });
ioCasa.observe($('.casona'));
let elegido = null;
function elegir(id, foco) {
  const d = PARTES[id]; if (!d || id === elegido) return; elegido = id;
  escena.classList.add('elegido');
  $$('.parte').forEach(p => p.classList.toggle('on', p.dataset.parte === id));
  piz.classList.add('cambia');
  const img = $('[data-pz="foto"]'); img.classList.add('cambia');
  const pre = new Image(); pre.src = d.foto;
  setTimeout(() => {
    $('[data-pz="kicker"]').textContent = d.kicker; $('[data-pz="tit"]').textContent = d.tit;
    $('[data-pz="txt"]').textContent = d.txt; $('[data-pz="dato"]').textContent = d.dato;
    const [txt, tipo, pref] = d.cta;
    $('[data-pz="cta"]').innerHTML = tipo === 'catas' ? `<a class="chapa chapa--cal" href="#catas">${txt}</a>` : tipo === 'reserva' ? `<button class="chapa chapa--cal" type="button" data-kit-open="reservas" ${pref ? `data-pref="${pref}"` : ''}>${txt}</button>` : `<a class="chapa chapa--cal" href="#carta">${txt}</a>`;
    const muestra = () => { img.src = d.foto; img.alt = d.kicker; img.classList.remove('cambia'); };
    pre.complete ? muestra() : (pre.onload = pre.onerror = muestra);
    piz.classList.remove('cambia');
    if (foco && celu()) piz.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, 230);
}
$$('.parte').forEach(p => {
  p.addEventListener('click', () => elegir(p.dataset.parte, true));
  p.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); elegir(p.dataset.parte, true); } });
});
document.addEventListener('click', e => {
  const ir = e.target.closest('[data-ir]'); if (ir) elegir(ir.dataset.ir, true);
  const pref = e.target.closest('[data-pref]');
  if (pref) setTimeout(() => { const x = document.querySelector(`.kit-pop.is-open input[name="extra"][value="${pref.dataset.pref}"]`); if (x) x.checked = true; }, 80);
});

// ---------- menú ----------
const menu = $('#menu'), bMenu = $('.nav-menu');
let hojasMenu = false;
const cerrarMenu = () => { menu.hidden = true; html.classList.remove('menu-abierto'); bMenu.setAttribute('aria-expanded', 'false'); bMenu.setAttribute('aria-label', 'Abrir menú'); };
bMenu.addEventListener('click', () => {
  if (!menu.hidden) return cerrarMenu();
  menu.hidden = false; html.classList.add('menu-abierto'); bMenu.setAttribute('aria-expanded', 'true'); bMenu.setAttribute('aria-label', 'Cerrar menú');
  if (!hojasMenu) { enredadera($('.menu__hojas'), 'menu'); hojasMenu = true; }
});
menu.addEventListener('click', e => { const a = e.target.closest('a,button'); if (!a) return; cerrarMenu(); if (a.dataset.parte) setTimeout(() => elegir(a.dataset.parte), 500); });
addEventListener('keydown', e => { if (e.key === 'Escape' && !menu.hidden) cerrarMenu(); });

// ---------- entradas: brota ----------
const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visto'); io.unobserve(e.target); } }), { threshold: .18 });
$$('.rv').forEach(e => io.observe(e));

// rehacer la enredadera si cambia mucho el tamaño (girar el celu)
let ancho = innerWidth;
addEventListener('resize', () => { if (Math.abs(innerWidth - ancho) < 80) return; ancho = innerWidth; hojasHero.splice(0, hojasHero.length, ...enredadera($('[data-hojas="hero"]'), 'hero')); });

// ---------- la pizarra del chef: foto del plato ----------
const tabFoto = $('.tablero__foto'), tabImg = $('[data-foto-plato]'), tabCap = $('[data-foto-cap]');
let fotoRaf = 0, fotoId = null;
document.addEventListener('pointerover', (e) => {
  if (e.pointerType !== 'mouse' || innerWidth < 900) return;
  const it = e.target.closest('.tablero .kit-item'); if (!it) return;
  if (fotoRaf) cancelAnimationFrame(fotoRaf);
  fotoRaf = requestAnimationFrame(() => {
    const src = it.dataset.photo; if (!src) return;
    if (fotoId === it.dataset.id) return; fotoId = it.dataset.id;
    tabFoto.classList.remove('on');
    const pre = new Image(); pre.onload = () => { if (fotoId !== it.dataset.id) return; tabImg.src = src; tabCap.textContent = $('.pl__nom', it).textContent; tabFoto.classList.add('on'); }; pre.src = src;
  });
}, { passive: true });
document.addEventListener('click', (e) => {
  const b = e.target.closest('[data-ver-foto]'); if (!b) return;
  const it = b.closest('.kit-item'); if (!it?.dataset.photo) return;
  const pop = document.createElement('div'); pop.className = 'foto-pop'; pop.setAttribute('role', 'dialog'); pop.setAttribute('aria-modal', 'true'); pop.setAttribute('aria-label', 'Foto del plato');
  pop.innerHTML = `<figure><img src="${it.dataset.photo}" alt=""><figcaption>${escH($('.pl__nom', it).textContent)}</figcaption></figure><button type="button" aria-label="Cerrar foto">×</button>`;
  const cerrar = () => { pop.remove(); removeEventListener('keydown', esc); b.focus(); };
  const esc = (ev) => { if (ev.key === 'Escape') cerrar(); };
  pop.addEventListener('click', (ev) => { if (ev.target === pop || ev.target.closest('button')) cerrar(); });
  addEventListener('keydown', esc); document.body.appendChild(pop); $('button', pop).focus();
});

// ---------- agenda de catas ----------
const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const TIPOS = { cata: 'Cata de vinos', noche: 'Noche en el boulevard', degustacion: 'Degustación' };
function pintarAgenda(lista) {
  const ol = $('[data-agenda]'); if (!ol) return;
  const evs = (lista || []).slice(0, 4);
  if (!evs.length) { ol.innerHTML = '<li class="agenda__vacia">Pronto se suman fechas nuevas. Escribinos por WhatsApp para enterarte primero.</li>'; return; }
  ol.innerHTML = evs.map(ev => {
    const [y, m, d] = ev.fecha.split('-').map(Number); const dia = new Date(y, m - 1, d).getDay();
    const precio = ev.precio != null ? ` · ${window.kit?.money ? window.kit.money(ev.precio) : '$' + ev.precio.toLocaleString('es-AR')} por persona` : '';
    return `<li class="ev"><div class="ev__fecha"><span class="ev__dia">${d}</span><span class="ev__mes">${MESES[m - 1]}</span></div>
      <div class="ev__info"><p class="ev__tipo">${escH(TIPOS[ev.tipo] || 'Evento')}</p><h3 class="ev__nom">${escH(ev.nombre)}</h3><p class="ev__dato">${DIAS[dia]} · ${ev.hora} hs · Cupo ${ev.cupo}${precio}</p></div>
      ${ev.reserva ? `<button class="ev__btn" type="button" data-ev-fecha="${ev.fecha}" data-ev-hora="${ev.hora}">Anotarme</button>` : ''}</li>`;
  }).join('');
}
document.addEventListener('kit:eventos', (e) => pintarAgenda(e.detail.proximos));
document.addEventListener('tibuk:kit', () => { if (window.kit?.eventos) pintarAgenda(window.kit.eventos.proximos()); });
document.addEventListener('click', (e) => {
  const b = e.target.closest('[data-ev-fecha]'); if (!b || !window.kit?.reservas) return;
  window.kit.reservas.abrir({ fecha: b.dataset.evFecha, hora: b.dataset.evHora, personas: 2 });
  const nom = b.closest('.ev')?.querySelector('.ev__nom')?.textContent;
  if (nom) setTimeout(() => { const pop = document.querySelector('.kit-pop.is-open'); const tt = pop?.querySelector('.kit-pop__title'); if (tt) { tt.textContent = 'Anotate: ' + nom; pop.setAttribute('aria-label', tt.textContent); } }, 30);
});

// ---------- hojas en la foto del equipo y en el pie ----------
function marcoHojas(cont, semilla, densidad) {
  if (!cont) return; const W = cont.clientWidth, H = cont.clientHeight; if (!W) return;
  const r = azar(semilla), t0 = celu() ? 46 : 64; let s = '';
  for (let y = -20; y < H + 20; y += t0 * .55) for (let x = -20; x < W + 20; x += t0 * .55) {
    const X = x + (r() - .5) * t0 * .5, Y = y + (r() - .5) * t0 * .5;
    const borde = Math.min(X, W - X, Y, H - Y);
    if (borde > densidad * (0.6 + r() * .8)) continue;
    const t = t0 * (.8 + r() * .5);
    s += `<i class="h" style="--x:${X | 0}px;--y:${Y | 0}px;--t:${t | 0}px;--r:${(r() * 360) | 0}deg;--s:1;--c:${OSC[(r() * OSC.length) | 0]}">${HOJA}</i>`;
  }
  cont.innerHTML = s;
}
const ioHojas = new IntersectionObserver(es => es.forEach(e => { if (!e.isIntersecting) return; const c = e.target; marcoHojas(c, c.dataset.hojas === 'pie' ? 31 : c.dataset.hojas === 'foto2' ? 23 : 17, c.dataset.hojas === 'pie' ? 9999 : (celu() ? 40 : 70)); ioHojas.unobserve(c); }), { rootMargin: '400px 0px' });
$$('[data-hojas="foto"], [data-hojas="foto2"], [data-hojas="pie"]').forEach(c => ioHojas.observe(c));

// ---------- horarios: marcar hoy ----------
(() => {
  const d = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Argentina/Buenos_Aires', weekday: 'short' }).format(new Date());
  const fila = { Mon: 0, Tue: 1, Wed: 2, Thu: 2, Fri: 2, Sat: 2, Sun: 3 }[d];
  const filas = $$('[data-horas] > div'); if (filas[fila]) filas[fila].classList.add('hoy');
})();

// ---------- la píldora del panel no tapa el hero ni la casona ----------
(() => {
  const vis = new Set();
  const io = new IntersectionObserver(es => { es.forEach(e => e.isIntersecting ? vis.add(e.target) : vis.delete(e.target)); html.classList.toggle('sin-pill', vis.size > 0); }, { threshold: .12 });
  [$('.ha'), $('.pie'), celu() ? $('.casona') : null].filter(Boolean).forEach(x => io.observe(x));
})();
document.addEventListener('click', (e) => {
  if (!e.target.closest('[data-kit-open="reservas"]')) return;
  setTimeout(() => { const pop = document.querySelector('.kit-pop.is-open'); pop?.classList.remove('es-evento'); const tt = pop?.querySelector('.kit-pop__title'); if (tt && tt.textContent.startsWith('Anotate')) { tt.textContent = 'Reservá tu mesa en la casona'; pop.setAttribute('aria-label', tt.textContent); } }, 30);
});

// ---------- pizarra: la foto acompaña a la pestaña ----------
const FOTO_TAB = { entradas: 'langostinos-crocantes', principales: 'bondiola-braseada', postres: 'volcan-de-chocolate' };
function fotoDeTab(cat) {
  if (!tabFoto || innerWidth < 900) return;
  const it = cat && document.querySelector(`.tablero .kit-item[data-cat="${cat}"][data-photo]`);
  const src = it ? it.dataset.photo : 'img/pz-cocina.webp';
  const cap = it ? $('.pl__nom', it).textContent : 'La panera de la casa';
  fotoId = it ? it.dataset.id : null;
  tabFoto.classList.remove('on');
  const pre = new Image(); pre.onload = () => { tabImg.src = src; tabCap.textContent = cap; tabFoto.classList.add('on'); }; pre.src = src;
}
document.addEventListener('click', (e) => { const t = e.target.closest('.tablero .kit-tab'); if (t) fotoDeTab(t.dataset.cat); });
// la carta no cambia de alto al cambiar de pestaña
function fijarAltoCarta() {
  const box = $('.tablero__carta'); if (!box || innerWidth < 900) return;
  const ps = $$('.kit-carta__panel', box); if (!ps.length) return;
  let max = 0;
  ps.forEach(p => { const oculto = p.hidden; if (oculto) { p.hidden = false; p.style.visibility = 'hidden'; p.style.position = 'absolute'; p.style.width = $('.kit-carta__panel:not([hidden])', box)?.offsetWidth + 'px'; }
    max = Math.max(max, p.offsetHeight); if (oculto) { p.hidden = true; p.style.visibility = ''; p.style.position = ''; p.style.width = ''; } });
  ps.forEach(p => { p.style.minHeight = max + 'px'; });
}
document.addEventListener('kit:carta', (e) => { if (e.detail.el?.closest('.tablero')) requestAnimationFrame(fijarAltoCarta); });
let anchoCarta = innerWidth; addEventListener('resize', () => { if (innerWidth !== anchoCarta) { anchoCarta = innerWidth; $$('.tablero .kit-carta__panel').forEach(p => p.style.minHeight = ''); fijarAltoCarta(); } });

// ---------- el cartel se esconde al bajar (celu) y vuelve al subir ----------
(() => {
  let y0 = scrollY, raf = 0;
  addEventListener('scroll', () => { if (raf) return; raf = requestAnimationFrame(() => { raf = 0; const y = scrollY; const lejos = y > innerHeight * .8; html.classList.toggle('nav-oculta', lejos && y > y0 + 4 && !html.classList.contains('menu-abierto')); if (y < y0 - 4 || !lejos) html.classList.remove('nav-oculta'); html.classList.toggle('nav-chica', lejos); y0 = y; }); }, { passive: true });
})();

// ---------- inscripción a evento: fecha a la vista y confirmación propia ----------
document.addEventListener('click', (e) => {
  const b = e.target.closest('[data-ev-fecha]'); if (!b) return;
  setTimeout(() => {
    const pop = document.querySelector('.kit-pop.is-open'); if (!pop) return;
    pop.classList.add('es-evento');
    const chip = pop.querySelector('[data-dias] input:checked')?.closest('label') || pop.querySelector('[data-dias] .is-on');
    chip?.scrollIntoView({ block: 'nearest', inline: 'center' });
    const mo = new MutationObserver(() => { pop.querySelectorAll('h3, h2, p, strong').forEach(n => { if (n.textContent.trim() === '¡Reserva pedida!') n.textContent = '¡Quedaste anotado!'; }); });
    mo.observe(pop, { childList: true, subtree: true }); setTimeout(() => mo.disconnect(), 120000);
  }, 60);
});

// en el celu, al cambiar de pestaña la fila de pestañas queda a la vista
document.addEventListener('click', (e) => {
  const t = e.target.closest('.tablero .kit-tab'); if (!t || innerWidth >= 900) return;
  t.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
  const tabs = t.parentElement; const top = tabs.getBoundingClientRect().top;
  if (top < 0 || top > innerHeight * .4) scrollTo({ top: scrollY + top - 90, behavior: 'smooth' });
});
