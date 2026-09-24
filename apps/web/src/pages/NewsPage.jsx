import { useMemo, useState } from "react";
import { ArrowRight, CalendarDays } from "lucide-react";
import { Link } from "react-router-dom";
import { Header } from "../components/layout/Header.jsx";
import { Footer } from "../components/layout/Footer.jsx";
import { ChatWidget } from "../components/chat/ChatWidget.jsx";
import { Seo } from "../components/common/Seo.jsx";
import { useLandingData } from "../hooks/useLandingData.js";
import { useLanguage } from "../context/LanguageContext.jsx";
import { localizedPath } from "../config/seo.js";
import { xionAssetUrl } from "../utils/landing-assets.js";
import { localizeBlogPost } from "../utils/localize-blog-post.js";

const copy = {
  uz: { eyebrow: "XION MEDIA", title: "Yangiliklar va kompaniya hayoti", intro: "Mahsulotlar, tibbiy yangiliklar va XION faoliyatidagi muhim voqealar.", news: "Yangiliklar", life: "XION hayoti", read: "Batafsil o‘qish", empty: "Bu bo‘limda hozircha material yo‘q." },
  ru: { eyebrow: "XION MEDIA", title: "Новости и жизнь компании", intro: "Продукты, медицинские материалы и важные события в жизни XION.", news: "Новости", life: "Жизнь XION", read: "Читать подробнее", empty: "В этом разделе пока нет материалов." },
  en: { eyebrow: "XION MEDIA", title: "News and company life", intro: "Products, medical insights and important events from XION.", news: "News", life: "XION life", read: "Read more", empty: "There are no articles in this section yet." },
};

export function NewsPage() {
  const { data, loading } = useLandingData();
  const { language } = useLanguage();
  const c = copy[language] || copy.uz;
  const [category, setCategory] = useState("NEWS");
  const posts = useMemo(() => (data.blogPosts || []).filter((post) => (post.content?.category || "NEWS") === category).map((post) => localizeBlogPost(post, language)), [category, data.blogPosts, language]);
  const locale = language === "ru" ? "ru-RU" : language === "en" ? "en-US" : "uz-UZ";

  return <div className="site-shell"><Seo title={c.title} description={c.intro} canonicalPath="/news" language={language}/><Header contact={data.settings.contact} loading={loading}/><main className="news-index-page">
    <section className="news-index-hero"><div className="container"><p className="eyebrow"><span/>{c.eyebrow}</p><h1>{c.title}</h1><p>{c.intro}</p></div></section>
    <section className="container news-index-shell"><div className="news-index-tabs" role="tablist"><button type="button" className={category === "NEWS" ? "is-active" : ""} onClick={() => setCategory("NEWS")}>{c.news}</button><button type="button" className={category === "XION_LIFE" ? "is-active" : ""} onClick={() => setCategory("XION_LIFE")}>{c.life}</button></div>
      {posts.length ? <div className="news-index-grid">{posts.map((post, index) => <Link className={`news-index-card ${index === 0 ? "is-featured" : ""}`} to={localizedPath(`/news/${post.slug}`, language)} key={post.id}><div className="news-index-image">{post.coverImage ? <img src={xionAssetUrl(post.coverImage)} alt={post.title} loading={index ? "lazy" : "eager"} decoding="async"/> : <span>XION</span>}</div><div><time><CalendarDays size={15}/>{new Intl.DateTimeFormat(locale, { dateStyle: "long" }).format(new Date(post.publishedAt || Date.now()))}</time><h2>{post.title}</h2><p>{post.excerpt}</p><strong>{c.read}<ArrowRight size={16}/></strong></div></Link>)}</div> : <div className="news-index-empty">{c.empty}</div>}
    </section>
  </main><Footer settings={data.settings} loading={loading}/><ChatWidget/></div>;
}
