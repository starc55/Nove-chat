import { useEffect, useRef, useState } from "react";
import "../../styles/global.css";
import { useLanguage } from "../../context/LanguageContext.jsx";
import {
  XION_ADDRESS,
  XION_MAP_URL,
  XION_YANDEX_POSITION,
} from "../../config/public-links.js";
import { loadYandexMaps } from "../../services/yandex-maps.js";

const popupCopy = {
  uz: {
    eyebrow: "XION rasmiy ofisi",
    description: "Tibbiy mahsulotlar va mutaxassis yordami",
    action: "Xaritada ochish",
    loading: "Xarita yuklanmoqda…",
    unavailable: "Xarita vaqtincha yuklanmadi",
  },
  ru: {
    eyebrow: "Официальный офис XION",
    description: "Медицинские изделия и помощь специалиста",
    action: "Открыть на карте",
    loading: "Карта загружается…",
    unavailable: "Карта временно недоступна",
  },
  en: {
    eyebrow: "Official XION office",
    description: "Medical products and specialist support",
    action: "Open in maps",
    loading: "Loading map…",
    unavailable: "Map is temporarily unavailable",
  },
};

function createTextElement(tagName, className, text) {
  const element = document.createElement(tagName);
  element.className = className;
  element.textContent = text;
  return element;
}

function createMarkerElement(copy) {
  const marker = document.createElement("div");
  marker.className = "xion-yandex-marker";

  const pulse = document.createElement("span");
  pulse.className = "xion-yandex-marker__pulse";

  const tip = document.createElement("span");
  tip.className = "xion-yandex-marker__tip";

  const button = document.createElement("button");
  button.className = "xion-yandex-marker__surface";
  button.type = "button";
  button.setAttribute("aria-label", "XION");
  button.setAttribute("aria-expanded", "false");

  const logo = document.createElement("span");
  logo.className = "xion-yandex-marker__logo";
  logo.setAttribute("aria-hidden", "true");
  button.appendChild(logo);

  const popup = document.createElement("article");
  popup.className = "xion-yandex-popup";
  popup.append(
    createTextElement("span", "xion-yandex-popup__eyebrow", copy.eyebrow),
    createTextElement("strong", "xion-yandex-popup__title", "XION"),
    createTextElement("p", "xion-yandex-popup__address", XION_ADDRESS),
    createTextElement(
      "small",
      "xion-yandex-popup__description",
      copy.description
    )
  );

  const link = createTextElement("a", "xion-yandex-popup__link", copy.action);
  link.href = XION_MAP_URL;
  link.target = "_blank";
  link.rel = "noreferrer";
  link.appendChild(createTextElement("b", "", "↗"));
  popup.appendChild(link);

  const togglePopup = (event) => {
    event.stopPropagation();
    const isOpen = marker.classList.toggle("is-open");
    button.setAttribute("aria-expanded", String(isOpen));
  };

  button.addEventListener("click", togglePopup);
  marker.append(pulse, tip, button, popup);

  return {
    marker,
    cleanup: () => button.removeEventListener("click", togglePopup),
  };
}

export function XionYandexMap({ className = "" }) {
  const containerRef = useRef(null);
  const { language } = useLanguage();
  const copy = popupCopy[language] || popupCopy.uz;
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    let active = true;
    let map;
    let cleanupMarker;

    setStatus("loading");
    loadYandexMaps()
      .then(async (ymaps3) => {
        if (!active || !containerRef.current) return;

        const {
          YMap,
          YMapDefaultFeaturesLayer,
          YMapDefaultSchemeLayer,
          YMapControls,
          YMapMarker,
        } = ymaps3;

        map = new YMap(containerRef.current, {
          location: {
            center: XION_YANDEX_POSITION,
            zoom: 17,
          },
        });
        map.addChild(new YMapDefaultSchemeLayer({}));
        map.addChild(new YMapDefaultFeaturesLayer({}));

        const markerElement = createMarkerElement(copy);
        cleanupMarker = markerElement.cleanup;
        map.addChild(
          new YMapMarker(
            { coordinates: XION_YANDEX_POSITION },
            markerElement.marker
          )
        );
        setStatus("ready");

        try {
          const { YMapZoomControl } = await ymaps3.import(
            "@yandex/ymaps3-controls@0.0.1"
          );
          if (active) {
            map.addChild(
              new YMapControls({ position: "left" }).addChild(
                new YMapZoomControl({})
              )
            );
          }
        } catch {
          // Drag, wheel, double-click and pinch zoom remain available.
        }
      })
      .catch(() => {
        if (active) setStatus("error");
      });

    return () => {
      active = false;
      cleanupMarker?.();
      map?.destroy();
    };
  }, [copy]);

  return (
    <div
      className={`xion-map xion-yandex-map ${className}`.trim()}
      data-status={status}
    >
      <div className="xion-yandex-map__canvas" ref={containerRef} />
      {status !== "ready" ? (
        <div className="xion-yandex-map__state" role="status">
          <span />
          {status === "error" ? copy.unavailable : copy.loading}
        </div>
      ) : null}
    </div>
  );
}
