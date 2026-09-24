import { useEffect, useState } from "react";
import { ArrowLeft, Check, ExternalLink, LoaderCircle, Phone, Send } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { Header } from "../components/layout/Header.jsx";
import { Footer } from "../components/layout/Footer.jsx";
import { ChatWidget } from "../components/chat/ChatWidget.jsx";
import { Seo } from "../components/common/Seo.jsx";
import { api } from "../services/api.js";
import { useLanguage } from "../context/LanguageContext.jsx";
import { localizedPath, XION_SITE_URL } from "../config/seo.js";
import { xionAssetUrl } from "../utils/landing-assets.js";
import { localizeBlogPost } from "../utils/localize-blog-post.js";
import { landingFallback } from "../data/landing-fallback.js";

const copy = { uz: { back: "Barcha yangiliklar", video: "Videoni ko‘rish", contact: "Buyurtma va qo‘shimcha ma’lumot uchun", missing: "Yangilik topilmadi" }, ru: { back: "Все новости", video: "Смотреть видео", contact: "Для заказа и дополнительной информации", missing: "Материал не найден" }, en: { back: "All news", video: "Watch video", contact: "For orders and further information", missing: "Article not found" } };

export function BlogPostPage() {
  const { slug } = useParams();
  const { language } = useLanguage();
  const c = copy[language] || copy.uz;
  const [state, setState] = useState({ post: null, settings: {}, loading: true, error: "" });
  useEffect(() => {
    let active = true;
    const fallbackPost = landingFallback.blogPosts.find((item) => item.slug === slug) || null;
    Promise.allSettled([api.get(`/public/pages/${slug}`), api.get("/public/settings")]).then(([postResult, settingsResult]) => {
      if (!active) return;
      const post = postResult.status === "fulfilled" && postResult.value.data.data?.content?.type === "blog" ? postResult.value.data.data : fallbackPost;
      const settings = settingsResult.status === "fulfilled" ? settingsResult.value.data.data : landingFallback.settings;
      setState({ post, settings, loading: false, error: post ? "" : postResult.reason?.message || c.missing });
    });
    return () => { active = false; };
  }, [c.missing, slug]);
  const post = state.post ? localizeBlogPost(state.post, language) : null;
  const locale = language === "ru" ? "ru-RU" : language === "en" ? "en-US" : "uz-UZ";
  return <div className="site-shell">{post ? <Seo title={post.title} description={post.excerpt} canonicalPath={`/news/${post.slug}`} language={language} image={post.coverImage} jsonLd={{ "@context": "https://schema.org", "@type": "NewsArticle", headline: post.title, description: post.excerpt, image: post.coverImage ? [new URL(xionAssetUrl(post.coverImage), XION_SITE_URL).href] : undefined, datePublished: post.publishedAt, dateModified: post.updatedAt, author: { "@type": "Organization", name: "XION" }, publisher: { "@type": "Organization", name: "XION", logo: { "@type": "ImageObject", url: `${XION_SITE_URL}/xion-logo.svg` } } }}/>: null}<Header contact={state.settings.contact} loading={state.loading}/><main className="blog-post-page">
    {state.loading ? <div className="blog-state"><LoaderCircle className="admin-spin"/>Yuklanmoqda...</div> : null}
    {!state.loading && !post ? <div className="blog-state"><h1>{c.missing}</h1><p>{state.error}</p><Link to={localizedPath("/news", language)}><ArrowLeft size={17}/>{c.back}</Link></div> : null}
    {post ? <article><header className="blog-post-hero"><div className="container"><Link to={localizedPath("/news", language)}><ArrowLeft size={16}/>{c.back}</Link><p className="eyebrow"><span/>{post.eyebrow}</p><h1>{post.title}</h1><p>{post.excerpt}</p><time>{new Intl.DateTimeFormat(locale, { dateStyle: "long" }).format(new Date(post.publishedAt || Date.now()))}</time></div></header>{post.coverImage ? <div className="container blog-post-cover"><img src={xionAssetUrl(post.coverImage)} alt={post.title}/></div> : null}<div className="container blog-post-content">{post.sections.map((section, index) => <section key={`${section.title}-${index}`}><span>{String(index + 1).padStart(2, "0")}</span><div><h2>{section.title}</h2>{section.text ? <p>{section.text}</p> : null}{section.items?.length ? <ul>{section.items.map((item) => <li key={item}><Check size={18}/><span>{item}</span></li>)}</ul> : null}</div></section>)}<aside><h2>{c.contact}</h2><div>{post.telegramUrl ? <a href={post.telegramUrl} target="_blank" rel="noreferrer"><Send size={18}/>@xion_office</a> : null}{post.phones.map((phone) => <a href={`tel:${phone.replace(/\s/g, "")}`} key={phone}><Phone size={18}/>{phone}</a>)}{post.videoUrl ? <a className="blog-video-link" href={post.videoUrl} target="_blank" rel="noreferrer">{c.video}<ExternalLink size={17}/></a> : null}</div></aside></div></article> : null}
  </main><Footer settings={state.settings} loading={state.loading}/><ChatWidget/></div>;
}
