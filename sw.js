// Skrypt pomocniczy: pozwala zainstalować stronę jak aplikację i otwierać ją bez internetu.
// Strona główna jest pobierana ZAWSZE najpierw z sieci (żeby aktualizacje docierały od razu),
// a kopia z pamięci służy tylko wtedy, gdy nie ma internetu.
const CACHE = "zakupy-v4";
const NA_START = [
  "./", "./index.html", "./manifest.webmanifest",
  "./ikona-192.png", "./ikona-512.png", "./apple-touch-icon.png"
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(NA_START)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((nazwy) => Promise.all(nazwy.filter((n) => n !== CACHE).map((n) => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const zapytanie = e.request;
  if (zapytanie.method !== "GET") return;
  const url = new URL(zapytanie.url);

  // biblioteki Firebase (adres z numerem wersji, więc się nie zmieniają): najpierw pamięć
  if (url.origin === "https://www.gstatic.com" && url.pathname.startsWith("/firebasejs/")) {
    e.respondWith(
      caches.match(zapytanie).then((trafienie) => trafienie || fetch(zapytanie).then((odp) => {
        if (odp && odp.ok) { const kopia = odp.clone(); caches.open(CACHE).then((c) => c.put(zapytanie, kopia)); }
        return odp;
      }))
    );
    return;
  }

  // pliki tej strony: najpierw sieć, a gdy jej brak, kopia z pamięci
  if (url.origin === self.location.origin) {
    e.respondWith(
      fetch(zapytanie).then((odp) => {
        if (odp && odp.ok) { const kopia = odp.clone(); caches.open(CACHE).then((c) => c.put(zapytanie, kopia)); }
        return odp;
      }).catch(() => caches.match(zapytanie).then((t) => t || caches.match("./index.html")))
    );
  }
  // wszystko inne (baza danych, logowanie) przechodzi bez ingerencji
});
