import { ArrowDownRight } from "lucide-react";
import { Reveal } from "../common/Reveal.jsx";
import { useLanguage } from "../../context/LanguageContext.jsx";

export function Approach() {
  const { t } = useLanguage();
  return <section className="process-section"><div className="container process-shell"><div className="process-title"><p>THE NOVA WAY</p><h2>{t.trustTitle}</h2><ArrowDownRight/></div><div className="process-list">{t.trustItems.map(([number, label], index) => <Reveal className="process-item" key={number} delay={index * .04}><span>{number}</span><h3>{label}</h3><i/></Reveal>)}</div></div></section>;
}
