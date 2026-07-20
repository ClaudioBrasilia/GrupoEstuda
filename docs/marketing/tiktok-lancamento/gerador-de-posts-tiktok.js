const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright-core');

const SCRATCH = __dirname;
const OUT = path.join(SCRATCH, 'out-tiktok');
fs.mkdirSync(OUT, { recursive: true });

const fontCss = fs.readFileSync(path.join(SCRATCH, 'fonts', 'montserrat.css'), 'utf8')
  .replace(/fonts\//g, `file://${SCRATCH}/fonts/`);

// 9:16 canvas. TikTok safe area: keep content away from bottom ~380px (caption/UI)
// and right ~110px (action buttons). We pad accordingly.
const baseCss = `
${fontCss}
* { margin:0; padding:0; box-sizing:border-box; }
html,body { width:100%; height:100%; }
body { font-family:'Montserrat', sans-serif; background:#0d0918; color:#fff; overflow:hidden; }
.canvas {
  position:relative; width:100%; height:100%;
  display:flex; flex-direction:column;
  padding:150px 96px 300px;
  background:
    radial-gradient(1000px 800px at 82% -8%, rgba(155,135,245,.34), transparent 60%),
    radial-gradient(900px 720px at -12% 108%, rgba(59,130,246,.22), transparent 55%),
    radial-gradient(620px 620px at 105% 95%, rgba(168,85,247,.14), transparent 60%),
    #0d0918;
}
.grain { position:absolute; inset:0; opacity:.05; pointer-events:none;
  background-image:repeating-linear-gradient(0deg, rgba(255,255,255,.6) 0 1px, transparent 1px 3px); }
.brand { display:flex; align-items:center; gap:22px; }
.brand .mark {
  width:80px; height:80px; border-radius:22px; flex:0 0 auto;
  background:linear-gradient(135deg,#a855f7,#7c3aed);
  display:flex; align-items:center; justify-content:center;
  box-shadow:0 12px 40px rgba(139,92,246,.45);
}
.brand .mark svg { width:44px; height:44px; }
.brand .name { font-weight:800; font-size:36px; letter-spacing:7px; text-transform:uppercase; color:rgba(255,255,255,.9); }
.spacer { flex:1; }
h1 { font-weight:900; font-size:118px; line-height:1.03; letter-spacing:-3px; }
h1.sm { font-size:96px; }
h1.xs { font-size:82px; }
.grad { background:linear-gradient(100deg,#c4b5fd,#a855f7 45%,#60a5fa);
  -webkit-background-clip:text; background-clip:text; color:transparent; }
.sub { margin-top:48px; font-weight:600; font-size:50px; line-height:1.38; color:rgba(235,232,255,.85); }
.kicker { display:inline-flex; align-items:center; gap:16px; font-weight:800; font-size:34px;
  letter-spacing:5px; text-transform:uppercase; color:#c4b5fd; margin-bottom:44px; }
.kicker::before { content:''; width:64px; height:6px; border-radius:3px; background:linear-gradient(90deg,#a855f7,#60a5fa); }
.chip { display:inline-block; padding:22px 42px; border-radius:100px; border:2px solid rgba(168,85,247,.55);
  background:rgba(168,85,247,.12); font-weight:800; font-size:38px; letter-spacing:3px; text-transform:uppercase; color:#d8b4fe; }
.swipe { display:inline-flex; align-items:center; gap:18px; font-weight:800; font-size:40px; color:#d8b4fe;
  border:2px solid rgba(168,85,247,.4); background:rgba(168,85,247,.1); padding:24px 44px; border-radius:100px; }
.cta-btn { display:inline-flex; align-items:center; gap:20px; background:linear-gradient(100deg,#a855f7,#6d28d9);
  padding:38px 60px; border-radius:30px; font-weight:900; font-size:50px; box-shadow:0 18px 60px rgba(139,92,246,.5); }
.icon-tile { width:190px; height:190px; border-radius:50px;
  background:linear-gradient(135deg,rgba(168,85,247,.95),rgba(59,130,246,.9));
  display:flex; align-items:center; justify-content:center; box-shadow:0 24px 80px rgba(139,92,246,.45); margin-bottom:52px; }
.icon-tile svg { width:100px; height:100px; }
ul.feats { margin-top:56px; list-style:none; display:flex; flex-direction:column; gap:40px; }
ul.feats li { display:flex; gap:28px; align-items:flex-start; font-weight:600; font-size:52px; line-height:1.3; color:rgba(235,232,255,.9); }
ul.feats li::before { content:'✓'; flex:0 0 auto; width:64px; height:64px; border-radius:18px; margin-top:2px;
  background:rgba(168,85,247,.25); border:2px solid rgba(168,85,247,.6); color:#d8b4fe; font-weight:900; font-size:36px;
  display:flex; align-items:center; justify-content:center; }
.big-emoji { font-size:180px; line-height:1; margin-bottom:52px; }
.count { display:inline-block; font-weight:900; font-size:44px; color:rgba(255,255,255,.4); margin-bottom:26px; letter-spacing:4px; }
.foot { display:flex; align-items:center; gap:20px; font-weight:700; font-size:36px; color:rgba(255,255,255,.5); }
.foot .dot { width:10px; height:10px; border-radius:50%; background:rgba(255,255,255,.3); }
`;

const bookSvg = `<svg viewBox="0 0 24 24" fill="none"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H19a1 1 0 0 1 1 1v13.5a1 1 0 0 1-1 1H6.5A2.5 2.5 0 0 0 4 20V5.5Z" fill="#fff" opacity=".95"/><path d="M4 20a2.5 2.5 0 0 1 2.5-2.5H20" stroke="#e9d5ff" stroke-width="1.6" stroke-linecap="round"/></svg>`;
const icons = {
  users: `<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
  trophy: `<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9a6 6 0 0 0 12 0V3H6v6Z"/><path d="M6 5H3v2a4 4 0 0 0 4 4"/><path d="M18 5h3v2a4 4 0 0 1-4 4"/><path d="M12 15v4"/><path d="M8 21h8"/></svg>`,
  zap: `<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.8" stroke-linejoin="round"><path d="M13 2 3 14h7l-1 8 11-13h-7l0-7Z"/></svg>`,
  chart: `<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round"><path d="M4 20V10"/><path d="M10 20V4"/><path d="M16 20v-7"/><path d="M22 20H2"/></svg>`,
};
const brand = `<div class="brand"><div class="mark">${bookSvg}</div><div class="name">Grupo Estuda</div></div>`;
const foot = (n) => `<div class="foot">${n?`<span>${n}</span><span class="dot"></span>`:''}<span>@grupoestuda</span></div>`;

const slides = [
// ===== SLIDESHOW VIRAL 1: "por que você desiste" (8 slides) =====
{ file: 't01-hook.png', body: `
  ${brand}
  <div class="spacer"></div>
  <span class="count">DESLIZA →</span>
  <h1>ninguém te contou por que você <span class="grad">desiste de estudar</span> toda semana</h1>
  <div class="sub">(e não é falta de força de vontade)</div>
  <div class="spacer"></div>
  <div class="swipe">deslize para o lado →</div>
`},
{ file: 't02.png', body: `
  ${brand}
  <div class="spacer"></div>
  <span class="count">1</span>
  <h1 class="sm">Você começa <span class="grad">na segunda</span>…</h1>
  <div class="sub">motivação lá em cima, playlist de foco pronta, caderno novo.</div>
  <div class="spacer"></div>
  ${foot('1 / 7')}
`},
{ file: 't03.png', body: `
  ${brand}
  <div class="spacer"></div>
  <span class="count">2</span>
  <h1 class="sm">…e some <span class="grad">na quinta</span>.</h1>
  <div class="sub">e o pior: ninguém percebe que você parou. sem cobrança, a rotina desmorona.</div>
  <div class="spacer"></div>
  ${foot('2 / 7')}
`},
{ file: 't04.png', body: `
  ${brand}
  <div class="spacer"></div>
  <span class="count">3</span>
  <h1 class="sm">o problema não é você.</h1>
  <div class="sub">estudar sozinho é o <b style="color:#d8b4fe">modo difícil</b>. seu cérebro precisa de gente por perto.</div>
  <div class="spacer"></div>
  ${foot('3 / 7')}
`},
{ file: 't05.png', body: `
  ${brand}
  <div class="spacer"></div>
  <span class="count">4</span>
  <h1 class="xs">a solução: um grupo que <span class="grad">te cobra</span></h1>
  <ul class="feats">
    <li>todo mundo vê o progresso de todo mundo</li>
    <li>sumiu? o grupo percebe na hora</li>
  </ul>
  <div class="spacer"></div>
  ${foot('4 / 7')}
`},
{ file: 't06.png', body: `
  ${brand}
  <div class="spacer"></div>
  <span class="count">5</span>
  <h1 class="xs">e vira <span class="grad">competição</span> 🏆</h1>
  <ul class="feats">
    <li>cada hora estudada vira ponto</li>
    <li>ranking e ligas toda semana</li>
    <li>ninguém quer ficar em último 🔥</li>
  </ul>
  <div class="spacer"></div>
  ${foot('5 / 7')}
`},
{ file: 't07.png', body: `
  ${brand}
  <div class="spacer"></div>
  <span class="count">6</span>
  <h1 class="xs">desafie o grupo ⚡</h1>
  <div class="sub">"quem estuda mais essa semana?" — placar ao vivo. quem perde paga o açaí 😎</div>
  <div class="spacer"></div>
  ${foot('6 / 7')}
`},
{ file: 't08-cta.png', body: `
  ${brand}
  <div class="spacer"></div>
  <div style="text-align:center; width:100%">
    <div class="big-emoji">🚀</div>
    <h1 class="sm">tudo isso num app.<br><span class="grad">grátis.</span></h1>
    <div class="sub">chama-se <b style="color:#fff">Grupo Estuda</b>.<br>link na bio — chama seus amigos 👇</div>
  </div>
  <div class="spacer"></div>
  <div style="width:100%;display:flex;justify-content:center">${foot('7 / 7')}</div>
`},

// ===== CAPAS PARA POSTS AVULSOS (thumbnails de vídeo/slideshow) =====
{ file: 't09-capa-pov.png', body: `
  ${brand}
  <div class="spacer"></div>
  <span class="chip">POV</span>
  <h1 class="sm" style="margin-top:44px">seu amigo que "começa segunda" agora está em <span class="grad">1º no ranking</span> 💀</h1>
  <div class="sub">o app que fez isso acontecer 👇</div>
  <div class="spacer"></div>
  ${foot()}
`},
{ file: 't10-capa-desafio.png', body: `
  ${brand}
  <div class="spacer"></div>
  <span class="chip">Desafio 🔥</span>
  <h1 class="sm" style="margin-top:44px">7 dias estudando com seu grupo.<br><span class="grad">duvido você completar.</span></h1>
  <div class="sub">marca 3 amigos que topam 👇</div>
  <div class="spacer"></div>
  ${foot()}
`},
{ file: 't11-capa-lista.png', body: `
  ${brand}
  <div class="spacer"></div>
  <span class="chip">salva isso 📌</span>
  <h1 class="sm" style="margin-top:44px">5 hábitos de quem <span class="grad">passa</span></h1>
  <div class="sub">o 4º quase ninguém faz…<br>deslize e salva pra semana de prova.</div>
  <div class="spacer"></div>
  ${foot()}
`},
{ file: 't12-capa-lancamento.png', body: `
  ${brand}
  <div class="spacer"></div>
  <div style="text-align:center;width:100%">
    <span class="chip">novo app 🎉</span>
    <h1 style="margin-top:48px">o estudo virou <span class="grad">jogo</span>.</h1>
    <div class="sub">grupos · ranking · ligas · desafios<br>chama a galera e começa hoje.</div>
    <div style="margin-top:80px"><span class="cta-btn">link na bio 🔗</span></div>
  </div>
  <div class="spacer"></div>
  <div style="width:100%;display:flex;justify-content:center">${foot()}</div>
`},
];

function html(s){ return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${baseCss}</style></head><body><div class="canvas">${s.body}<div class="grain"></div></div></body></html>`; }
function findChrome(){ const base='/opt/pw-browsers'; for(const d of fs.readdirSync(base)){ for(const b of ['chrome','headless_shell']){ const p=path.join(base,d,'chrome-linux',b); if(fs.existsSync(p))return p; } } throw new Error('no chromium'); }

(async () => {
  const browser = await chromium.launch({ executablePath: findChrome() });
  for (const s of slides) {
    const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
    await page.setContent(html(s), { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: path.join(OUT, s.file) });
    await page.close();
    console.log('ok', s.file);
  }
  await browser.close();
})();
