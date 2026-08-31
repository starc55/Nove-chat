import L from "leaflet";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "../../styles/global.css";
import { useLanguage } from "../../context/LanguageContext.jsx";
import {
  XION_ADDRESS,
  XION_MAP_URL,
  XION_POSITION,
} from "../../config/public-links.js";

const MARKER_WIDTH = 60;
const MARKER_HEIGHT = 68;

const xionIcon = L.divIcon({
  className: "xion-map-icon",
  html: `
    <span class="xion-map-marker" aria-hidden="true">
      <span class="xion-map-marker__pulse"></span>
      <span class="xion-map-marker__tip"></span>
      <span class="xion-map-marker__surface">
        <span class="xion-map-marker__logo"></span>
      </span>
    </span>
  `,
  iconSize: [MARKER_WIDTH, MARKER_HEIGHT],
  iconAnchor: [MARKER_WIDTH / 2, MARKER_HEIGHT],
  popupAnchor: [0, -MARKER_HEIGHT + 2],
});

const popupCopy = {
  uz: {
    eyebrow: "XION rasmiy ofisi",
    description: "Tibbiy mahsulotlar va mutaxassis yordami",
    action: "Xaritada ochish",
  },
  ru: {
    eyebrow: "Официальный офис XION",
    description: "Медицинские изделия и помощь специалиста",
    action: "Открыть на карте",
  },
  en: {
    eyebrow: "Official XION office",
    description: "Medical products and specialist support",
    action: "Open in maps",
  },
};

export function XionLeafletMap({ className = "" }) {
  const { language } = useLanguage();
  const copy = popupCopy[language] || popupCopy.uz;

  return (
    <MapContainer
      center={XION_POSITION}
      zoom={17}
      minZoom={4}
      maxZoom={19}
      scrollWheelZoom
      className={`xion-map xion-leaflet-map ${className}`.trim()}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker
        position={XION_POSITION}
        icon={xionIcon}
        keyboard
        riseOnHover
        title="XION"
      >
        <Popup closeButton className="xion-map-popup-shell">
          <article className="xion-map-popup">
            <span>{copy.eyebrow}</span>
            <strong>XION</strong>
            <p>{XION_ADDRESS}</p>
            <small>{copy.description}</small>
            <a href={XION_MAP_URL} target="_blank" rel="noreferrer">
              {copy.action}
              <b aria-hidden="true">↗</b>
            </a>
          </article>
        </Popup>
      </Marker>
    </MapContainer>
  );
}
