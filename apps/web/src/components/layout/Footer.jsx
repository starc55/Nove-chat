import { ArrowRight, ArrowUp, Instagram, Mail, MapPin, Phone, Send } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext.jsx";
import { BrandLogo } from "../common/BrandLogo.jsx";
import { XION_MAP_URL, XION_TELEGRAM_URL } from "../../config/public-links.js";

export function Footer({ settings = {}, loading = false }) {
  const { t } = useLanguage();
  const contact = settings.contact || {};
  const phones = contact.phones?.length ? contact.phones : contact.phone ? [contact.phone] : [];
  const emails = contact.emails?.length ? contact.emails : contact.email ? [{ label: "", value: contact.email }] : [];

  return <footer id="contact" className="site-footer"><div className="container footer-main">
    <div className="footer-brand"><p className="footer-kicker">XION MEDICAL</p><a className="wordmark" href="/" aria-label={`XION ${t.homeLabel}`}><BrandLogo /></a>{loading ? <span className="footer-skeleton is-description"/> : <p>{settings.company?.descriptor || t.companyDescriptor}</p>}<a className="footer-catalog-link" href="/catalog">{t.searchProducts}<ArrowRight size={17}/></a></div>
    <div><strong>{t.footerCompany}</strong><a href="/company">{t.footerAbout}</a><a href="/medical-institutions">{t.navMedical}</a><a href="/manufacturers">{t.navManufacturers}</a><a href="/career">{t.career}</a><a href="/contact">{t.footerPartnership}</a></div>
    <div><strong>{t.footerProducts}</strong><a href="/catalog">{t.navProducts}</a><a href="#campaigns">{t.navCampaigns}</a><a href="/simurg">Simurg</a><a href="/news">{t.footerNews}</a><a href="#reviews">{t.navReviews}</a></div>
    <div className={`footer-contact ${loading ? "is-loading" : ""}`}><div className="footer-socials"><a href="https://instagram.com" target="_blank" rel="noreferrer" aria-label="Instagram"><Instagram size={19}/></a><a href={XION_TELEGRAM_URL} target="_blank" rel="noreferrer" aria-label="Telegram"><Send size={18}/></a></div><strong>{t.footerSupport}</strong>{loading ? <><span className="footer-skeleton"/><span className="footer-skeleton is-short"/><span className="footer-skeleton"/></> : <>{phones.map((phone) => <a className="footer-phone" key={phone} href={`tel:${phone.replace(/\s/g, "")}`}><Phone size={20}/>{phone}</a>)}{emails.map((email) => <a key={email.value} href={`mailto:${email.value}`} title={email.label || undefined}><Mail size={16}/>{email.value}</a>)}<a className="footer-address" href={XION_MAP_URL} target="_blank" rel="noreferrer"><MapPin size={18}/>{contact.address || t.supportAddress}</a>{contact.workingHours ? <small>{contact.workingHours}</small> : null}</>}</div>
  </div><div className="container footer-legal"><a href="/warranty-return">{t.warranty}</a><a href="/terms">{t.terms}</a><a href="/privacy">{t.privacy}</a></div><div className="container footer-bottom"><p>© {new Date().getFullYear()} XION. {t.footerRights}</p><a href="#top" aria-label={t.backToTop}>{t.backToTop} <ArrowUp size={14}/></a></div></footer>;
}
