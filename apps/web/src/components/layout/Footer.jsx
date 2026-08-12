import { ArrowUpRight, MapPin, Phone } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext.jsx";

export function Footer({ settings = {} }) {
  const { t } = useLanguage();
  const contact = settings.contact || {};
  const company = settings.company || {};
  return <footer id="contact" className="site-footer"><div className="container footer-callout"><div><p>NOVA · LET’S BUILD</p><h2>{t.footerTitle}</h2></div><div><p>{t.footerText}</p><a className="button button--white" href={`mailto:${contact.email || "hello@nova.uz"}`}>{t.footerCta}<ArrowUpRight size={18}/></a></div></div><div className="container footer-main"><div className="footer-brand"><a className="wordmark" href="#top">{company.name || "NOVA"}<i>.</i></a><p>{company.descriptor || "Digital products · Technology · Support"}</p></div><div><strong>{t.footerProducts}</strong><a href="#products">{t.navProducts}</a><a href="#campaigns">{t.navCampaigns}</a><a href="#reviews">{t.navReviews}</a></div><div><strong>{t.footerCompany}</strong><a href="#top">NOVA</a><a href="#contact">{t.navContact}</a><a href={contact.telegramUrl || "https://t.me"}>Telegram</a></div><div className="footer-contact"><strong>{t.footerSupport}</strong><a href={`tel:${(contact.phone || "+998900000000").replace(/\s/g, "")}`}><Phone size={15}/>{contact.phone || "+998 90 000 00 00"}</a><p><MapPin size={15}/>{contact.address || "Toshkent, O‘zbekiston"}</p><a href={`mailto:${contact.email || "hello@nova.uz"}`}>{contact.email || "hello@nova.uz"}</a></div></div><div className="container footer-bottom"><p>© {new Date().getFullYear()} NOVA. ALL RIGHTS RESERVED.</p><a href="#top">TOP ↑</a></div></footer>;
}
