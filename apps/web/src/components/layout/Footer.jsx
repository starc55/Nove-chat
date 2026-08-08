import { ArrowUpRight } from "lucide-react";

export function Footer({ settings = {} }) {
  const contact = settings.contact || {};
  const company = settings.company || {};
  return (
    <footer id="contact" className="site-footer">
      <div className="container footer-lead">
        <p className="eyebrow"><span />Keyingi yaxshi loyiha</p>
        <h2>Fikringiz bor?<br/><em>Keling, uni kuchaytiramiz.</em></h2>
        <a className="footer-mail" href={`mailto:${contact.email || "hello@nova.uz"}`}>{contact.email || "hello@nova.uz"}<ArrowUpRight /></a>
      </div>
      <div className="container footer-grid">
        <div><a className="wordmark" href="#top">{company.name || "NOVA"}<i>.</i></a><p>{company.descriptor || "Independent digital studio"}</p></div>
        <div><span>Manzil</span><p>{contact.address || "Toshkent, O‘zbekiston"}</p><p>{contact.phone || "+998 90 000 00 00"}</p></div>
        <div><span>Sahifalar</span><a href="#services">Xizmatlar</a><a href="#approach">Yondashuv</a><a href="#reviews">Mijozlar</a></div>
        <div><span>Bog‘lanish</span><a href={contact.telegramUrl || "https://t.me"}>Telegram</a><a href="/privacy">Maxfiylik</a></div>
      </div>
      <div className="container footer-bottom"><p>© {new Date().getFullYear()} NOVA Studio</p><a href="#top">Yuqoriga ↑</a></div>
    </footer>
  );
}
