import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Check, LoaderCircle, Send } from "lucide-react";
import { Link } from "react-router-dom";
import { Header } from "../components/layout/Header.jsx";
import { Footer } from "../components/layout/Footer.jsx";
import { ChatWidget } from "../components/chat/ChatWidget.jsx";
import { api } from "../services/api.js";
import { getVisitorId, getVisitorProfile } from "../services/visitor.js";
import { useLanguage } from "../context/LanguageContext.jsx";

const initialForm = { name: "", phone: "", email: "", company: "", message: "" };

export function InfoPage({ slug }) {
  const { language, t } = useLanguage();
  const [state, setState] = useState({ page: null, settings: {}, loading: true, error: "" });
  const [form, setForm] = useState(() => ({ ...initialForm, ...(getVisitorProfile() || {}) }));
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    setState((current) => ({ ...current, loading: true, error: "" }));
    Promise.all([api.get(`/public/pages/${slug}`), api.get("/public/settings")])
      .then(([pageResponse, settingsResponse]) => setState({ page: pageResponse.data.data, settings: settingsResponse.data.data, loading: false, error: "" }))
      .catch((error) => setState({ page: null, settings: {}, loading: false, error: error.message }));
  }, [slug]);

  const content = useMemo(() => state.page?.content?.[language] || state.page?.content?.uz || null, [language, state.page]);
  const formSource = state.page?.content?.form;
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
    <main className="info-page">
      {state.loading ? <div className="info-loading"><LoaderCircle className="admin-spin"/>{t.loading}</div> : null}
      {state.error ? <div className="container inline-state"><h1>{t.pageNotFound}</h1><p>{state.error}</p><Link className="back-link" to="/"><ArrowLeft size={17}/>{t.backHome}</Link></div> : null}
      {content ? <>
        <section className="info-hero"><div className="container"><p className="eyebrow"><span/>{content.eyebrow}</p><h1>{content.title}</h1><p>{content.excerpt}</p></div></section>
        <div className="container info-sections">{content.sections?.map((section, index) => <article className="info-section" key={`${section.title}-${index}`}>
          <div className="info-section-number">{String(index + 1).padStart(2, "0")}</div><div>{section.date ? <time>{new Intl.DateTimeFormat(language === "ru" ? "ru-RU" : language === "en" ? "en-US" : "uz-UZ", { dateStyle: "long" }).format(new Date(section.date))}</time> : null}<h2>{section.title}</h2>{section.text ? <p>{section.text}</p> : null}{section.items?.length ? <ul>{section.items.map((item) => <li key={item}><Check size={17}/><span>{item}</span></li>)}</ul> : null}</div>
        </article>)}</div>
        {formSource ? <section className="info-form-section"><div className="container info-form-shell"><div><p className="eyebrow"><span/>{t.inquiryEyebrow}</p><h2>{t.inquiryTitle}</h2><p>{t.inquiryText}</p></div><form onSubmit={submit}>
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
