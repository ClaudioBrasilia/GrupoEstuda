// Service worker do Grupo Estuda (PWA web).
//
// Estratégia deliberadamente conservadora:
//   * navegação (HTML)  -> rede primeiro, cache só como rede de segurança
//   * assets com hash   -> cache primeiro (o nome muda a cada build, então
//                          nunca servem conteúdo velho)
//   * qualquer outra coisa (API do Supabase, imagens remotas) -> não passa
//     pelo cache
//
// Sem isso o Chrome não oferece "instalar app" — a instalação pela web é um
// canal de distribuição que não depende de aprovação de loja.

const VERSION = "v1";
const SHELL_CACHE = `grupoestuda-shell-${VERSION}`;
const ASSET_CACHE = `grupoestuda-assets-${VERSION}`;

const SHELL_URLS = ["/", "/index.html", "/manifest.json", "/favicon.ico"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => cache.addAll(SHELL_URLS))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== SHELL_CACHE && key !== ASSET_CACHE)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

const isHashedAsset = (url) =>
  url.origin === self.location.origin && url.pathname.startsWith("/assets/");

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Nada de cachear chamadas de dados: o app é colaborativo e em tempo real,
  // ranking servido do cache seria pior do que erro de rede.
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(SHELL_CACHE).then((cache) => cache.put("/index.html", copy));
          return response;
        })
        .catch(() =>
          caches
            .match("/index.html")
            .then((cached) => cached || Response.error()),
        ),
    );
    return;
  }

  if (isHashedAsset(url)) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            if (response.ok) {
              const copy = response.clone();
              caches.open(ASSET_CACHE).then((cache) => cache.put(request, copy));
            }
            return response;
          }),
      ),
    );
  }
});
