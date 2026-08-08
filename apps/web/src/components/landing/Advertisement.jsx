import { ArrowUpRight } from "lucide-react";
import { Reveal } from "../common/Reveal.jsx";

export function Advertisement({ advertisements = [] }) {
  const ad = advertisements.find((item) => item.placement === "AFTER_HERO");
  if (!ad) return null;
  return (
    <section className="container ad-wrap" aria-label="Maxsus taklif">
      <Reveal className="ad-banner">
        <div><span>Limited availability</span><h2>{ad.title}</h2><p>{ad.description}</p></div>
        {ad.ctaLabel && <a className="button button--dark" href={ad.ctaUrl || "#contact"}>{ad.ctaLabel}<ArrowUpRight size={17}/></a>}
      </Reveal>
    </section>
  );
}
