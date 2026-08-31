const YANDEX_SCRIPT_ID = "xion-yandex-maps-v3";
let yandexMapsPromise;

function waitUntilReady(resolve, reject) {
  if (!window.ymaps3) {
    reject(new Error("Yandex Maps JS API yuklanmadi."));
    return;
  }

  window.ymaps3.ready
    .then(() => resolve(window.ymaps3))
    .catch(() => reject(new Error("Yandex Maps JS API ishga tushmadi.")));
}

export function loadYandexMaps() {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Yandex Maps faqat brauzerda ishlaydi."));
  }

  if (window.ymaps3) {
    return window.ymaps3.ready.then(() => window.ymaps3);
  }

  if (yandexMapsPromise) return yandexMapsPromise;

  const apiKey = import.meta.env.VITE_YANDEX_MAPS_API_KEY?.trim();
  if (!apiKey) {
    return Promise.reject(
      new Error("VITE_YANDEX_MAPS_API_KEY sozlanmagan.")
    );
  }

  yandexMapsPromise = new Promise((resolve, reject) => {
    const existingScript =
      document.getElementById(YANDEX_SCRIPT_ID) ||
      document.querySelector('script[src*="api-maps.yandex.ru/v3/"]');

    if (existingScript) {
      existingScript.addEventListener(
        "load",
        () => waitUntilReady(resolve, reject),
        { once: true }
      );
      existingScript.addEventListener(
        "error",
        () => reject(new Error("Yandex Maps JS API yuklanmadi.")),
        { once: true }
      );
      if (window.ymaps3) waitUntilReady(resolve, reject);
      return;
    }

    const script = document.createElement("script");
    script.id = YANDEX_SCRIPT_ID;
    script.async = true;
    script.src = `https://api-maps.yandex.ru/v3/?apikey=${encodeURIComponent(
      apiKey
    )}&lang=ru_RU`;
    script.addEventListener(
      "load",
      () => waitUntilReady(resolve, reject),
      { once: true }
    );
    script.addEventListener(
      "error",
      () => reject(new Error("Yandex Maps JS API yuklanmadi.")),
      { once: true }
    );
    document.head.appendChild(script);
  });

  return yandexMapsPromise;
}
