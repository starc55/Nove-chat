import { ArrowRight, MapPin } from "lucide-react";
import { Reveal } from "../common/Reveal.jsx";
import { useLanguage } from "../../context/LanguageContext.jsx";
import { localizeProduct } from "../../utils/localize-product.js";
import { XionMap } from "../common/XionMap.jsx";

export function Approach({ newsItems = [], loading = false }) {
  const { language, t } = useLanguage();
  const locale =
    language === "uz" ? "uz-UZ" : language === "ru" ? "ru-RU" : "en-US";
  const mapAddress = t.supportAddress;
  const entries = newsItems.length
    ? newsItems
        .slice(0, 3)
        .map((item) => (item.slug ? localizeProduct(item, language) : item))
    : t.trustItems.slice(0, 3).map(([id, title], index) => ({
        id,
        title,
        createdAt: new Date(Date.now() - index * 86400000 * 4),
      }));
  return (
    <section className="section news-section" id="location-map">
      <div className="container news-panel">
        <div className="news-list">
          <div className="news-tabs">
            <strong>{t.news}</strong>
            <span>{t.xionLife}</span>
          </div>
          {entries.map((item, index) => (
            <Reveal
              className="news-row"
              key={item.id || item.slug || item.title}
              delay={index * 0.04}
            >
              <div>
                <time>
                  {new Intl.DateTimeFormat(locale, {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  }).format(
                    new Date(item.startAt || item.createdAt || Date.now())
                  )}
                </time>
                <h3>{item.title}</h3>
              </div>
              <ArrowRight size={18} />
            </Reveal>
          ))}
        </div>
        <aside className="location-map">
          <div className="location-map-heading">
            <span>
              <MapPin />
            </span>
            <div>
              <p>{t.location}</p>
              <h2>{mapAddress}</h2>
            </div>
          </div>
          {loading ? (
            <div className="map-skeleton" aria-label={t.loading} />
          ) : (
            <XionMap />
          )}
        </aside>
      </div>
    </section>
  );
}
