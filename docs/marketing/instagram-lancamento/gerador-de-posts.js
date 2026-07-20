const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright-core');

const SCRATCH = __dirname;
const OUT = path.join(SCRATCH, 'out');
fs.mkdirSync(OUT, { recursive: true });

const fontCss = fs.readFileSync(path.join(SCRATCH, 'fonts', 'montserrat.css'), 'utf8')
  .replace(/fonts\//g, `file://${SCRATCH}/fonts/`);

const baseCss = `
${fontCss}
* { margin:0; padding:0; box-sizing:border-box; }
html,body { width:100%; height:100%; }
body {
  font-family:'Montserrat', sans-serif;
  background:#0d0918;
  color:#fff;
  overflow:hidden;
}
.canvas {
  position:relative; width:100%; height:100%;
  display:flex; flex-direction:column;
  padding:88px 84px 72px;
  background:
    radial-gradient(900px 700px at 85% -10%, rgba(155,135,245,.32), transparent 60%),
    radial-gradient(800px 640px at -10% 105%, rgba(59,130,246,.22), transparent 55%),
    radial-gradient(560px 560px at 100% 100%, rgba(168,85,247,.14), transparent 60%),
    #0d0918;
}
.grain { position:absolute; inset:0; opacity:.05; pointer-events:none;
  background-image:repeating-linear-gradient(0deg, rgba(255,255,255,.6) 0 1px, transparent 1px 3px); }
.brand {
  display:flex; align-items:center; gap:22px;
}
.brand .mark {
  width:84px; height:84px; border-radius:24px; flex:0 0 auto;
  background:linear-gradient(135deg,#a855f7,#7c3aed);
  display:flex; align-items:center; justify-content:center;
  box-shadow:0 12px 40px rgba(139,92,246,.45);
}
.brand .mark svg { width:46px; height:46px; }
.brand .name {
  font-weight:800; font-size:40px; letter-spacing:8px; text-transform:uppercase;
  color:rgba(255,255,255,.92);
}
.spacer { flex:1; }
h1 {
  font-weight:900; font-size:104px; line-height:1.04; letter-spacing:-3px;
}
h1.smaller { font-size:88px; }
.grad {
  background:linear-gradient(100deg,#c4b5fd,#a855f7 45%,#60a5fa);
  -webkit-background-clip:text; background-clip:text; color:transparent;
}
.sub {
  margin-top:44px; font-weight:600; font-size:44px; line-height:1.4;
  color:rgba(235,232,255,.82);
}
.kicker {
  display:inline-flex; align-items:center; gap:16px;
  font-weight:800; font-size:32px; letter-spacing:5px; text-transform:uppercase;
  color:#c4b5fd; margin-bottom:46px;
}
.kicker::before { content:''; width:64px; height:6px; border-radius:3px;
  background:linear-gradient(90deg,#a855f7,#60a5fa); }
.footer {
  display:flex; align-items:center; justify-content:space-between;
  font-weight:600; font-size:32px; color:rgba(255,255,255,.55);
}
.dots { display:flex; gap:14px; }
.dots i { width:16px; height:16px; border-radius:50%; background:rgba(255,255,255,.22); }
.dots i.on { background:#a855f7; width:44px; border-radius:8px; }
.chip {
  display:inline-block; padding:20px 36px; border-radius:100px;
  border:2px solid rgba(168,85,247,.55); background:rgba(168,85,247,.12);
  font-weight:800; font-size:34px; letter-spacing:3px; text-transform:uppercase; color:#d8b4fe;
}
.cta-btn {
  display:inline-flex; align-items:center; gap:20px;
  background:linear-gradient(100deg,#a855f7,#6d28d9);
  padding:34px 56px; border-radius:28px;
  font-weight:900; font-size:44px; box-shadow:0 18px 60px rgba(139,92,246,.5);
}
.icon-tile {
  width:200px; height:200px; border-radius:52px;
  background:linear-gradient(135deg,rgba(168,85,247,.95),rgba(59,130,246,.9));
  display:flex; align-items:center; justify-content:center;
  box-shadow:0 24px 80px rgba(139,92,246,.45); margin-bottom:56px;
}
.icon-tile svg { width:104px; height:104px; }
ul.feats { margin-top:52px; list-style:none; display:flex; flex-direction:column; gap:34px; }
ul.feats li {
  display:flex; gap:26px; align-items:flex-start;
  font-weight:600; font-size:40px; line-height:1.35; color:rgba(235,232,255,.88);
}
ul.feats li::before {
  content:'✓'; flex:0 0 auto; width:56px; height:56px; border-radius:16px; margin-top:2px;
  background:rgba(168,85,247,.25); border:2px solid rgba(168,85,247,.6);
  color:#d8b4fe; font-weight:900; font-size:32px;
  display:flex; align-items:center; justify-content:center;
}
.big-emoji { font-size:150px; line-height:1; margin-bottom:48px; }
`;

// simple white book icon
const bookSvg = `<svg viewBox="0 0 24 24" fill="none"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H19a1 1 0 0 1 1 1v13.5a1 1 0 0 1-1 1H6.5A2.5 2.5 0 0 0 4 20V5.5Z" fill="#fff" opacity=".95"/><path d="M4 20a2.5 2.5 0 0 1 2.5-2.5H20" stroke="#e9d5ff" stroke-width="1.6" stroke-linecap="round"/></svg>`;

const icons = {
  users: `<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
  trophy: `<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9a6 6 0 0 0 12 0V3H6v6Z"/><path d="M6 5H3v2a4 4 0 0 0 4 4"/><path d="M18 5h3v2a4 4 0 0 1-4 4"/><path d="M12 15v4"/><path d="M8 21h8"/></svg>`,
  target: `<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5.5"/><circle cx="12" cy="12" r="2" fill="#fff"/></svg>`,
  zap: `<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.8" stroke-linejoin="round"><path d="M13 2 3 14h7l-1 8 11-13h-7l0-7Z"/></svg>`,
  chart: `<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round"><path d="M4 20V10"/><path d="M10 20V4"/><path d="M16 20v-7"/><path d="M22 20H2"/></svg>`,
};

const brand = `<div class="brand"><div class="mark">${bookSvg}</div><div class="name">Grupo Estuda</div></div>`;
const footer = (dot, total) => {
  let dots = '';
  if (total) {
    dots = '<div class="dots">' + Array.from({length: total}, (_, i) =>
      `<i${i === dot ? ' class="on"' : ''}></i>`).join('') + '</div>';
  }
  return `<div class="footer"><span>@grupoestuda</span>${dots}<span>grupoestuda.app</span></div>`;
};

const featureSlide = (icon, kicker, title, bullets, dot) => `
  ${brand}
  <div class="spacer"></div>
  <div class="icon-tile">${icons[icon]}</div>
  <div class="kicker">${kicker}</div>
  <h1 class="smaller">${title}</h1>
  <ul class="feats">${bullets.map(b => `<li>${b}</li>`).join('')}</ul>
  <div class="spacer"></div>
  ${footer(dot, 7)}
`;

const slides = [
// ---------- FASE 1: TEASERS ----------
{ file: '01-teaser-1.png', w: 1080, h: 1350, body: `
  ${brand}
  <div class="spacer"></div>
  <div class="kicker">Verdade inconveniente</div>
  <h1>Estudar sozinho é jogar no <span class="grad">modo difícil</span>.</h1>
  <div class="sub">Sem ninguém cobrando, a rotina desmorona na primeira semana.<br><br>Em breve, isso muda. 👀</div>
  <div class="spacer"></div>
  ${footer()}
`},
{ file: '02-teaser-2.png', w: 1080, h: 1350, body: `
  ${brand}
  <div class="spacer"></div>
  <div class="kicker">Imagina só</div>
  <h1>E se estudar fosse tão <span class="grad">viciante</span> quanto um jogo?</h1>
  <div class="sub">Ranking entre amigos. Ligas. Desafios semanais.<br>Cada hora estudada vira ponto.<br><br>Está chegando. 🚀</div>
  <div class="spacer"></div>
  ${footer()}
`},
{ file: '03-teaser-countdown.png', w: 1080, h: 1350, body: `
  ${brand}
  <div class="spacer"></div>
  <div style="text-align:center">
    <div class="chip">Lançamento</div>
    <h1 style="font-size:210px; margin:40px 0 10px" class="grad">AMANHÃ</h1>
    <div class="sub" style="margin-top:10px">O app que transforma estudo<br>em competição entre amigos.</div>
    <div class="sub" style="font-size:36px; margin-top:56px; color:rgba(255,255,255,.6)">Ativa as notificações pra não perder 🔔</div>
  </div>
  <div class="spacer"></div>
  ${footer()}
`},

// ---------- FASE 2: CARROSSEL DE LANÇAMENTO ----------
{ file: '04-carrossel-1-capa.png', w: 1080, h: 1350, body: `
  ${brand}
  <div class="spacer"></div>
  <div class="chip">É hoje 🎉</div>
  <h1 style="margin-top:44px">Chegou o app que transforma estudo em <span class="grad">competição</span>.</h1>
  <div class="sub">Estude com seus amigos. Suba no ranking.<br>Vença os desafios.</div>
  <div class="spacer"></div>
  <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:60px">
    <div class="cta-btn">Arrasta pro lado →</div>
  </div>
  ${footer(0, 7)}
`},
{ file: '05-carrossel-2-problema.png', w: 1080, h: 1350, body: `
  ${brand}
  <div class="spacer"></div>
  <div class="kicker">O problema</div>
  <h1 class="smaller">Todo mundo começa motivado. Quase ninguém <span class="grad">continua</span>.</h1>
  <ul class="feats">
    <li>Você promete que "segunda-feira eu começo"</li>
    <li>Estuda 3 dias com tudo… e some no quarto</li>
    <li>Ninguém percebe quando você desiste</li>
  </ul>
  <div class="sub" style="font-size:38px">O que falta não é força de vontade.<br>É <b style="color:#d8b4fe">gente cobrando você</b>. →</div>
  <div class="spacer"></div>
  ${footer(1, 7)}
`},
{ file: '06-carrossel-3-grupos.png', w: 1080, h: 1350, body: featureSlide(
  'users', 'A solução · 1 de 4', 'Grupos de estudo com seus <span class="grad">amigos</span>',
  ['Crie seu grupo em segundos e convide a galera', 'Todo mundo vê o progresso de todo mundo', 'Sumiu? O grupo percebe. E cobra. 😅'], 2)},
{ file: '07-carrossel-4-ranking.png', w: 1080, h: 1350, body: featureSlide(
  'trophy', 'A solução · 2 de 4', 'Ranking e <span class="grad">ligas</span> semanais',
  ['Cada hora de estudo vira pontos', 'Suba de liga estudando com constância', 'Ninguém quer terminar a semana em último 🔥'], 3)},
{ file: '08-carrossel-5-desafios.png', w: 1080, h: 1350, body: featureSlide(
  'zap', 'A solução · 3 de 4', '<span class="grad">Desafios</span> que viram apostas',
  ['Desafie o grupo: quem estuda mais essa semana?', 'Metas com prazo e placar ao vivo', 'Perdeu? Paga o açaí. As regras são de vocês 😎'], 4)},
{ file: '09-carrossel-6-metas.png', w: 1080, h: 1350, body: featureSlide(
  'chart', 'A solução · 4 de 4', 'Metas e progresso <span class="grad">visíveis</span>',
  ['Defina metas por matéria, páginas ou horas', 'Acompanhe sua evolução dia a dia', 'Constância que você consegue VER'], 5)},
{ file: '10-carrossel-7-cta.png', w: 1080, h: 1350, body: `
  ${brand}
  <div class="spacer"></div>
  <div style="text-align:center">
    <div class="big-emoji">🚀</div>
    <h1 class="smaller">Grátis. Sem desculpa.<br><span class="grad">Chama os amigos.</span></h1>
    <div class="sub">Quem entra em grupo, estuda.<br>Quem estuda junto, passa junto.</div>
    <div style="margin-top:72px"><span class="cta-btn">🔗 Link na bio</span></div>
    <div class="sub" style="font-size:36px; margin-top:64px; color:rgba(255,255,255,.65)">Marca nos comentários quem vai<br>estudar com você 👇</div>
  </div>
  <div class="spacer"></div>
  ${footer(6, 7)}
`},

// ---------- FASE 3: POSTS VIRAIS ----------
{ file: '11-meme-marque-o-amigo.png', w: 1080, h: 1350, body: `
  ${brand}
  <div class="spacer"></div>
  <div style="text-align:center">
    <div class="big-emoji">😭</div>
    <h1 class="smaller">Marca o amigo que fala<br><span class="grad">"segunda eu começo"</span><br>toda semana.</h1>
    <div class="sub" style="margin-top:56px">A gente criou um app pra ele não ter mais desculpa.</div>
  </div>
  <div class="spacer"></div>
  ${footer()}
`},
{ file: '12-frase-motivacional.png', w: 1080, h: 1350, body: `
  ${brand}
  <div class="spacer"></div>
  <div class="kicker">Anota isso</div>
  <h1 class="smaller">Você não precisa de mais motivação.<br><br>Precisa de um grupo que <span class="grad">não te deixa desistir</span>.</h1>
  <div class="sub" style="font-size:36px; margin-top:64px; color:rgba(255,255,255,.6)">Compartilha com quem precisa ler isso hoje 📤</div>
  <div class="spacer"></div>
  ${footer()}
`},
{ file: '13-checklist-aprovacao.png', w: 1080, h: 1350, body: `
  ${brand}
  <div class="spacer"></div>
  <div class="kicker">Salva esse post 📌</div>
  <h1 class="smaller">A fórmula de quem <span class="grad">passa</span>:</h1>
  <ul class="feats" style="margin-top:60px">
    <li>Constância &gt; intensidade — 2h todo dia vence 10h no domingo</li>
    <li>Meta com prazo — "estudar mais" não é meta</li>
    <li>Grupo que cobra — accountability é o segredo dos aprovados</li>
    <li>Progresso visível — o que você mede, você melhora</li>
    <li>Revisão em dia — quem não revisa, esquece</li>
  </ul>
  <div class="spacer"></div>
  ${footer()}
`},

// ---------- STORY ----------
{ file: '14-story-lancamento.png', w: 1080, h: 1920, body: `
  ${brand}
  <div class="spacer"></div>
  <div style="text-align:center">
    <div class="chip">Lançamento 🎉</div>
    <h1 style="margin-top:52px">O estudo virou <span class="grad">jogo</span>.</h1>
    <div class="sub">Grupos · Ranking · Ligas · Desafios<br><br>Chame seus amigos e comece hoje.</div>
    <div style="margin-top:96px"><span class="cta-btn">👆 Toque no link</span></div>
  </div>
  <div class="spacer"></div>
  ${footer()}
`},
];

function html(slide) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${baseCss}</style></head>
  <body><div class="canvas">${slide.body}<div class="grain"></div></div></body></html>`;
}

function findChrome() {
  const base = '/opt/pw-browsers';
  for (const d of fs.readdirSync(base)) {
    const p = path.join(base, d, 'chrome-linux', 'chrome');
    if (fs.existsSync(p)) return p;
    const q = path.join(base, d, 'chrome-linux', 'headless_shell');
    if (fs.existsSync(q)) return q;
  }
  throw new Error('chromium not found');
}

(async () => {
  const browser = await chromium.launch({ executablePath: findChrome() });
  for (const slide of slides) {
    const page = await browser.newPage({ viewport: { width: slide.w, height: slide.h } });
    await page.setContent(html(slide), { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: path.join(OUT, slide.file) });
    await page.close();
    console.log('ok', slide.file);
  }
  await browser.close();
})();
