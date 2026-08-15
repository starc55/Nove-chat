import { ArrowUp, MapPin, Phone, Send } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext.jsx";

export function Footer({ settings = {} }) {
  const { t } = useLanguage();
  const contact = settings.contact || {};
  const company = settings.company || {};
  const phones = contact.phones?.length ? contact.phones : [contact.phone || "+998 90 000 00 00"];
  const emails = contact.emails?.length ? contact.emails : [{ label: "", value: contact.email || "hello@nova.uz" }];
  return <footer id="contact" className="site-footer"><div className="container footer-main">
    <div className="footer-brand"><a className="wordmark" href="/">{company.name || "NOVA"}<i>.</i></a><p>{company.descriptor || t.companyDescriptor}</p><div className="footer-socials"><a href={contact.telegramUrl || "https://t.me"} aria-label="Telegram"><Send size={16}/></a></div></div>
    <div><strong>{t.footerProducts}</strong><a href="/catalog">{t.navProducts}</a><a href="/medical-institutions">{t.navMedical}</a><a href="/manufacturers">{t.navManufacturers}</a><a href="/simurg">Simurg</a></div>
    <div><strong>{t.footerCompany}</strong><a href="/company">{t.footerAbout}</a><a href="/news">{t.footerNews}</a><a href="/career">{t.career}</a><a href="/contact">{t.footerPartnership}</a></div>
    <div className="footer-contact"><strong>{t.footerSupport}</strong>{phones.map((phone) => <a key={phone} href={`tel:${phone.replace(/\s/g, "")}`}><Phone size={15}/>{phone}</a>)}<p><MapPin size={15}/>{contact.address || t.supportAddress}</p>{contact.workingHours ? <small>{contact.workingHours}</small> : null}{emails.map((email) => <a key={email.value} href={`mailto:${email.value}`} title={email.label || undefined}>{email.value}</a>)}</div>
  </div><div className="container footer-legal"><a href="/warranty-return">{t.warranty}</a><a href="/terms">{t.terms}</a><a href="/privacy">{t.privacy}</a></div><div className="container footer-bottom"><p>© {new Date().getFullYear()} NOVA. {t.footerRights}</p><a href="#top" aria-label={t.backToTop}>{t.backToTop} <ArrowUp size={14}/></a></div></footer>;
}
