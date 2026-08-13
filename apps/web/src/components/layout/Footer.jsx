import { ArrowUp, MapPin, Phone, Send } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext.jsx";

export function Footer({ settings = {} }) {
  const { t } = useLanguage();
  const contact = settings.contact || {};
  const company = settings.company || {};
  return <footer id="contact" className="site-footer"><div className="container footer-main">
    <div className="footer-brand"><a className="wordmark" href="#top">{company.name || "NOVA"}<i>.</i></a><p>{company.descriptor || "Digital products · Technology · Support"}</p><div className="footer-socials"><a href={contact.telegramUrl || "https://t.me"} aria-label="Telegram"><Send size={16}/></a></div></div>
    <div><strong>{t.footerProducts}</strong><a href="#products">{t.navProducts}</a><a href="#campaigns">{t.navCampaigns}</a><a href="#reviews">{t.navReviews}</a></div>
    <div><strong>{t.footerCompany}</strong><a href="#top">NOVA haqida</a><a href="#campaigns">Yangiliklar</a><a href="#contact">Hamkorlik</a></div>
    <div className="footer-contact"><strong>{t.footerSupport}</strong><a href={`tel:${(contact.phone || "+998900000000").replace(/\s/g, "")}`}><Phone size={15}/>{contact.phone || "+998 90 000 00 00"}</a><p><MapPin size={15}/>{contact.address || "Toshkent, O‘zbekiston"}</p><a href={`mailto:${contact.email || "hello@nova.uz"}`}>{contact.email || "hello@nova.uz"}</a></div>
  </div><div className="container footer-bottom"><p>© {new Date().getFullYear()} NOVA. Barcha huquqlar himoyalangan.</p><a href="#top" aria-label="Yuqoriga">Yuqoriga <ArrowUp size={14}/></a></div></footer>;
}
