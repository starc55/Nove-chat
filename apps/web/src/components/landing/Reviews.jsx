import { Star } from "lucide-react";
import { Reveal } from "../common/Reveal.jsx";
import { SectionHeading } from "../common/SectionHeading.jsx";

export function Reviews({ reviews = [], loading }) {
  return (
    <section id="reviews" className="section reviews-section">
      <div className="container">
        <Reveal><SectionHeading eyebrow="Mijozlar" title="Yaxshi hamkorlik ortidan yaxshi gaplar qoladi." /></Reveal>
        <div className="review-grid">
          {loading && [1,2,3].map((n) => <div className="review-card review-skeleton" key={n}/>) }
          {!loading && reviews.length === 0 && <div className="inline-state"><p>Yangi sharhlar yo‘q.</p></div>}
          {reviews.slice(0, 3).map((review, index) => (
            <Reveal className="review-card" delay={index * .08} key={review.id}>
              <div className="stars" aria-label={`${review.rating} yulduz`}>{Array.from({ length: review.rating }).map((_, i) => <Star key={i} size={14} fill="currentColor" />)}</div>
              <blockquote>“{review.comment}”</blockquote>
              <footer><strong>{review.customerName}</strong><span>{new Intl.DateTimeFormat("uz-UZ", { year: "numeric", month: "short" }).format(new Date(review.createdAt))}</span></footer>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
