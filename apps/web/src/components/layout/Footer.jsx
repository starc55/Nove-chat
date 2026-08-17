import { ArrowUp, MapPin, Phone, Send } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext.jsx";
import { BrandLogo } from "../common/BrandLogo.jsx";

export function Footer({ settings = {}, loading = false }) {
  const { t } = useLanguage();
  const contact = settings.contact || {};
  const phones = contact.phones?.length ? contact.phones : contact.phone ? [contact.phone] : [];
  const emails = contact.emails?.length ? contact.emails : contact.email ? [{ label: "", value: contact.email }] : [];
  return <footer id="contact" className="site-footer"><div className="container footer-main">
    <div className="footer-brand"><a className="wordmark" href="/" aria-label={`XION ${t.homeLabel}`}><BrandLogo /></a>{loading ? <span className="footer-skeleton is-description"/> : <p>{settings.company?.descriptor || t.companyDescriptor}</p>}<div className="footer-socials">{contact.telegramUrl ? <a href={contact.telegramUrl} aria-label="Telegram"><Send size={16}/></a> : null}</div></div>
    <div><strong>{t.footerProducts}</strong><a href="/catalog">{t.navProducts}</a><a href="/medical-institutions">{t.navMedical}</a><a href="/manufacturers">{t.navManufacturers}</a><a href="/simurg">Simurg</a></div>
    <div><strong>{t.footerCompany}</strong><a href="/company">{t.footerAbout}</a><a href="/news">{t.footerNews}</a><a href="/career">{t.career}</a><a href="/contact">{t.footerPartnership}</a></div>
    <div className={`footer-contact ${loading ? "is-loading" : ""}`}><strong>{t.footerSupport}</strong>{loading ? <><span className="footer-skeleton"/><span className="footer-skeleton is-short"/><span className="footer-skeleton"/></> : <>{phones.map((phone) => <a key={phone} href={`tel:${phone.replace(/\s/g, "")}`}><Phone size={15}/>{phone}</a>)}{contact.address ? <p><MapPin size={15}/>{contact.address}</p> : null}{contact.workingHours ? <small>{contact.workingHours}</small> : null}{emails.map((email) => <a key={email.value} href={`mailto:${email.value}`} title={email.label || undefined}>{email.value}</a>)}</>}</div>
  </div><div className="container footer-legal"><a href="/warranty-return">{t.warranty}</a><a href="/terms">{t.terms}</a><a href="/privacy">{t.privacy}</a></div><div className="container footer-bottom"><p>© {new Date().getFullYear()} XION. {t.footerRights}</p><a href="#top" aria-label={t.backToTop}>{t.backToTop} <ArrowUp size={14}/></a></div></footer>;
}
