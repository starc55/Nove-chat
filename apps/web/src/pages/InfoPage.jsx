import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, BadgeCheck, Building2, Check, Clock, ExternalLink, Headphones, LoaderCircle, Mail, Phone, Send, Truck } from "lucide-react";
import { Link } from "react-router-dom";
import { Header } from "../components/layout/Header.jsx";
import { Footer } from "../components/layout/Footer.jsx";
import { ChatWidget } from "../components/chat/ChatWidget.jsx";
import { XionMap } from "../components/common/XionMap.jsx";
import { api } from "../services/api.js";
import { getVisitorId, getVisitorProfile } from "../services/visitor.js";
import { useLanguage } from "../context/LanguageContext.jsx";
import { infoFallback } from "../data/info-fallback.js";
import { XION_ADDRESS, XION_MAP_URL, XION_TELEGRAM_URL } from "../config/public-links.js";

const initialForm = { name: "", phone: "", email: "", company: "", message: "" };

const visualPages = {
  about: { image: "/media/xion-products/hero-catalog.webp", secondary: "/media/xion-products/xion-003.webp" },
  "medical-institutions": { image: "/media/products/product-5.jpg", secondary: "/media/xion-products/xion-001.webp", contain: true },
  contact: { image: "/media/xion-products/hero-catalog.webp", secondary: "/media/catalog/c3.png" },
};

const proofCopy = {
  uz: [["10+", "yillik tajriba"], ["47+", "tibbiy mahsulot"], ["25+", "hamkor bozor"]],
  ru: [["10+", "лет опыта"], ["47+", "медицинских изделий"], ["25+", "партнёрских рынков"]],
  en: [["10+", "years of experience"], ["47+", "medical products"], ["25+", "partner markets"]],
};

const heroActionCopy = {
  uz: { catalog: "Katalogni ko‘rish", inquiry: "Murojaat qoldirish", visual: "Nazorat qilingan tibbiy ta’minot" },
  ru: { catalog: "Открыть каталог", inquiry: "Оставить заявку", visual: "Контролируемые медицинские поставки" },
  en: { catalog: "Explore catalogue", inquiry: "Send an enquiry", visual: "Controlled medical supply" },
};

function normalizeContent(content) {
  if (!content) return null;
  return JSON.parse(JSON.stringify(content).replace(/NOVA/gi, "XION"));
}

export function InfoPage({ slug }) {
  const { language, t } = useLanguage();
  const [state, setState] = useState({ page: null, settings: {}, loading: true, error: "" });
  const [form, setForm] = useState(() => ({ ...initialForm, ...(getVisitorProfile() || {}) }));
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    let active = true;
    setState((current) => ({ ...current, loading: true, error: "" }));
    Promise.all([api.get(`/public/pages/${slug}`), api.get("/public/settings")])
      .then(([pageResponse, settingsResponse]) => active && setState({ page: pageResponse.data.data, settings: settingsResponse.data.data, loading: false, error: "" }))
      .catch((error) => active && setState((current) => ({ page: null, settings: current.settings, loading: false, error: error.message })));
    return () => { active = false; };
  }, [slug]);

  const localContent = infoFallback(slug, language);
  const remoteContent = state.page?.content?.[language] || state.page?.content?.uz || null;
  const content = useMemo(() => normalizeContent(localContent || remoteContent), [localContent, remoteContent]);
  const formSource = localContent?.form || state.page?.content?.form;
  const visual = visualPages[slug];
  const actions = heroActionCopy[language] || heroActionCopy.uz;
  const contact = state.settings.contact || {};
  const phone = contact.phones?.[0] || contact.phone || "+998 99 556 06 60";
  const email = contact.email || "info@xion.uz";
  const address = contact.address || XION_ADDRESS;

  const submit = async (event) => {
    event.preventDefault();
    setSending(true);
    try {
      await api.post("/public/inquiries", { ...form, visitorId: getVisitorId(), source: formSource || "contact" });
      setSent(true);
      setForm((current) => ({ ...initialForm, name: current.name, phone: current.phone }));
    } finally { setSending(false); }
  };

  return <div className="site-shell">
    <Header contact={state.settings.contact} loading={state.loading}/>
    <main className={`info-page info-page--${slug}`}>
      {state.loading && !content ? <div className="info-loading"><LoaderCircle className="admin-spin"/>{t.loading}</div> : null}
      {state.error && !content ? <div className="container inline-state"><h1>{t.pageNotFound}</h1><p>{state.error}</p><Link className="back-link" to="/"><ArrowLeft size={17}/>{t.backHome}</Link></div> : null}
      {content ? <>
        <section className={`info-hero ${visual ? "info-hero--visual" : ""}`}>
          <div className={`container ${visual ? "info-hero-grid" : ""}`}>
            <div className="info-hero-copy">
              <Link className="info-breadcrumb" to="/"><ArrowLeft size={15}/>{t.backHome}</Link>
              <p className="eyebrow"><span/>{content.eyebrow}</p>
              <h1>{content.title}</h1>
              <p>{content.excerpt}</p>
              {visual ? <div className="info-hero-actions"><Link className="button button--primary" to="/catalog">{actions.catalog}<ArrowRight size={17}/></Link>{formSource ? <a className="info-text-action" href="#inquiry">{actions.inquiry}<ArrowRight size={16}/></a> : null}</div> : null}
            </div>
            {visual ? <div className={`info-hero-visual ${visual.contain ? "is-contained" : ""}`}>
              <img className="info-hero-main-image" src={visual.image} alt="" width="760" height="680" decoding="async"/>
              <div className="info-hero-product"><img src={visual.secondary} alt="" width="240" height="220" loading="lazy" decoding="async"/></div>
              <div className="info-visual-badge"><BadgeCheck size={20}/><span><small>XION STANDARD</small><strong>{actions.visual}</strong></span></div>
            </div> : null}
          </div>
        </section>

        {visual ? <section className="info-proof-strip"><div className="container">{proofCopy[language].map(([value, label]) => <div key={label}><strong>{value}</strong><span>{label}</span></div>)}</div></section> : null}

        {slug === "contact" ? <section className="container contact-direct-section">
          <div className="contact-direct-grid">
            <a href={`tel:${phone.replace(/\s/g, "")}`}><span><Phone/></span><small>{t.phone}</small><strong>{phone}</strong><i>{contact.workingHours || "Dushanba–Juma, 08:00–17:00"}</i></a>
            <a href={XION_TELEGRAM_URL} target="_blank" rel="noreferrer"><span><Send/></span><small>TELEGRAM</small><strong>@xion_office</strong><i>{actions.inquiry}</i></a>
            <a href={`mailto:${email}`}><span><Mail/></span><small>EMAIL</small><strong>{email}</strong><i>{t.footerSupport}</i></a>
          </div>
          <div className="contact-map-card"><div><p className="eyebrow"><span/>{t.location}</p><h2>{address}</h2><div className="contact-map-meta"><span><Clock size={17}/>{contact.workingHours || "Dushanba–Juma, 08:00–17:00"}</span><a href={XION_MAP_URL} target="_blank" rel="noreferrer">{t.location}<ExternalLink size={15}/></a></div></div><XionMap className="contact-xion-map"/></div>
        </section> : null}

        <div className="container info-sections">{content.sections?.map((section, index) => <article className={`info-section ${section.faqs?.length ? "is-faq" : ""}`} key={`${section.title}-${index}`}>
          <div className="info-section-number">{String(index + 1).padStart(2, "0")}</div>
          <div>{section.date ? <time>{new Intl.DateTimeFormat(language === "ru" ? "ru-RU" : language === "en" ? "en-US" : "uz-UZ", { dateStyle: "long" }).format(new Date(section.date))}</time> : null}<h2>{section.title}</h2>{section.text ? <p>{section.text}</p> : null}{section.items?.length ? <ul>{section.items.map((item) => <li key={item}><Check size={17}/><span>{item}</span></li>)}</ul> : null}{section.faqs?.length ? <div className="info-faqs">{section.faqs.map((faq, faqIndex) => <details key={faq.question} open={faqIndex === 0}><summary><span>{faq.question}</span><i>+</i></summary><p>{faq.answer}</p></details>)}</div> : null}</div>
        </article>)}</div>

        {formSource ? <section id="inquiry" className="info-form-section"><div className="container info-form-shell"><div><p className="eyebrow"><span/>{t.inquiryEyebrow}</p><h2>{t.inquiryTitle}</h2><p>{t.inquiryText}</p><div className="info-form-benefits"><span><Building2 size={17}/>{t.company}</span><span><Truck size={17}/>{t.location}</span><span><Headphones size={17}/>{t.footerSupport}</span></div></div><form onSubmit={submit}>
          <label><span>{t.name}</span><input required minLength="2" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}/></label>
          <label><span>{t.phone}</span><input required inputMode="tel" value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}/></label>
          <label><span>{t.email}</span><input type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}/></label>
          <label><span>{t.company}</span><input value={form.company} onChange={(event) => setForm((current) => ({ ...current, company: event.target.value }))}/></label>
          <label className="is-wide"><span>{t.message}</span><textarea required minLength="5" rows="5" value={form.message} onChange={(event) => setForm((current) => ({ ...current, message: event.target.value }))}/></label>
          <button className="button button--primary" type="submit" disabled={sending}>{sending ? <LoaderCircle className="admin-spin" size={17}/> : <Send size={17}/>} {sending ? t.sending : t.sendInquiry}</button>{sent ? <p className="info-form-success">{t.inquirySuccess}</p> : null}
        </form></div></section> : null}
      </> : null}
    </main>
    <Footer settings={state.settings} loading={state.loading}/><ChatWidget/>
  </div>;
}
