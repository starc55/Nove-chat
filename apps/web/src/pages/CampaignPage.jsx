import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowUpRight, CalendarDays } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { api } from "../services/api.js";
import { Header } from "../components/layout/Header.jsx";
import { Footer } from "../components/layout/Footer.jsx";
import { ChatWidget } from "../components/chat/ChatWidget.jsx";
import { Seo } from "../components/common/Seo.jsx";
import { useLandingData } from "../hooks/useLandingData.js";
import { useLanguage } from "../context/LanguageContext.jsx";
import { localizeAdvertisement } from "../utils/localize-advertisement.js";
import { landingAdvertisementImage } from "../utils/landing-assets.js";
import { localizedPath } from "../config/seo.js";

export function CampaignPage() {
  const { id } = useParams();
  const { language, t } = useLanguage();
  const landing = useLandingData();
  const [remote, setRemote] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let alive = true;
    setRemote(null);
    setLoading(true);
    api.get(`/public/advertisements/${id}`).then(({ data }) => alive && setRemote(data.data)).catch(() => {}).finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [id]);
  const source = remote || landing.data.advertisements?.find((item) => item.id === id) || null;
  const campaign = useMemo(() => source ? localizeAdvertisement(source, language) : null, [language, source]);
  const image = campaign ? landingAdvertisementImage(campaign) : "";
  const date = campaign?.startAt || campaign?.createdAt;
  const copy = language === "ru"
    ? { loading: "Загрузка...", missing: "Предложение не найдено", home: "Вернуться на главную" }
    : language === "en"
      ? { loading: "Loading...", missing: "Offer not found", home: "Return to home" }
      : { loading: "Yuklanmoqda...", missing: "Aksiya topilmadi", home: "Bosh sahifaga qaytish" };
  const rawCta = campaign?.ctaUrl || "";
  const ctaUrl = rawCta.startsWith("#") ? `${localizedPath("/", language)}${rawCta}` : rawCta.startsWith("/") ? localizedPath(rawCta, language) : rawCta;
  const internalCta = ctaUrl.startsWith("/");
  return <div className="site-shell">
    {campaign ? <Seo title={`${campaign.title} | XION`} description={campaign.description || campaign.title} canonicalPath={`/campaigns/${id}`} language={language} image={image}/> : null}
    <Header contact={landing.data.settings.contact} loading={landing.loading}/>
    <main className="campaign-detail-page"><div className="container">
      <Link className="campaign-detail-back" to={localizedPath("/", language)}><ArrowLeft size={17}/>{t.campaignsTitle}</Link>
      {loading && !campaign ? <div className="campaign-detail-state">{copy.loading}</div> : null}
      {!loading && !campaign ? <div className="campaign-detail-state"><h1>{copy.missing}</h1><Link to={localizedPath("/", language)}>{copy.home}</Link></div> : null}
      {campaign ? <article className="campaign-detail-card">{image ? <img src={image} alt={campaign.title}/> : null}<div><p className="eyebrow"><span/>{t.campaignsEyebrow}</p><h1>{campaign.title}</h1>{date ? <time><CalendarDays size={16}/>{new Intl.DateTimeFormat(language === "ru" ? "ru-RU" : language === "en" ? "en-US" : "uz-UZ", { dateStyle: "long" }).format(new Date(date))}</time> : null}<p>{campaign.description}</p>{ctaUrl ? internalCta ? <Link className="button button--primary" to={ctaUrl}>{campaign.ctaLabel || t.learnMore}<ArrowUpRight size={17}/></Link> : <a className="button button--primary" href={ctaUrl} target="_blank" rel="noreferrer">{campaign.ctaLabel || t.learnMore}<ArrowUpRight size={17}/></a> : <Link className="button button--primary" to={localizedPath("/catalog", language)}>{t.navProducts}<ArrowUpRight size={17}/></Link>}</div></article> : null}
    </div></main><Footer settings={landing.data.settings} loading={landing.loading}/><ChatWidget/>
  </div>;
}
