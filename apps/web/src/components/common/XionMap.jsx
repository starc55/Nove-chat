import { XionLeafletMap } from "./XionLeafletMap.jsx";
import { XionYandexMap } from "./XionYandexMap.jsx";

const MAP_PROVIDER = (
  import.meta.env.VITE_MAP_PROVIDER || "leaflet"
).toLowerCase();

export function XionMap(props) {
  if (MAP_PROVIDER === "yandex") {
    return <XionYandexMap {...props} />;
  }

  return <XionLeafletMap {...props} />;
}
