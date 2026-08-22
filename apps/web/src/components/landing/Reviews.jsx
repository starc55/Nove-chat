import { useState } from "react";
import { CheckCircle2, ChevronLeft, ChevronRight, LoaderCircle, Quote, Star } from "lucide-react";
import { api } from "../../services/api.js";
import { getVisitorId, getVisitorProfile, saveVisitorProfile } from "../../services/visitor.js";
import { useLanguage } from "../../context/LanguageContext.jsx";
import { useHorizontalScroller } from "../../hooks/useHorizontalScroller.js";

export function Reviews({ reviews = [], loading }) {
  const { language, t } = useLanguage();
  const [form, setForm] = useState(() => {
    const profile = getVisitorProfile();
    return { name: profile?.name || "", phone: profile?.phone || "", rating: 5, comment: "" };
  });
  const [state, setState] = useState({ sending: false, success: false, error: "" });
  const { ref, scroll, canPrev, canNext } = useHorizontalScroller(`${loading}-${reviews.length}`);

  const submit = async (event) => {
    event.preventDefault();
    setState({ sending: true, success: false, error: "" });
    try {
      await api.post("/public/reviews", { ...form, visitorId: getVisitorId() });
      saveVisitorProfile(form);
      setForm((current) => ({ ...current, comment: "" }));
      setState({ sending: false, success: true, error: "" });
    } catch (error) { setState({ sending: false, success: false, error: error.message }); }
  };

  return (
    <section id="reviews" className="section reviews-section"><div className="container">
      <div className="section-line reviews-heading"><div><p className="eyebrow">{t.reviewsEyebrow}</p><h2>{t.reviewsTitle}</h2><span>{t.reviewText}</span></div><div className="slider-controls"><button type="button" onClick={() => scroll(-1)} disabled={!canPrev} aria-label={t.previousReview}><ChevronLeft/></button><button type="button" onClick={() => scroll(1)} disabled={!canNext} aria-label={t.nextReview}><ChevronRight/></button></div></div>
      <div className="reviews-layout"><div className="review-stream" ref={ref}>
        {loading ? [1,2].map((item) => <div className="review-card review-skeleton" key={item}/>) : null}
        {!loading && !reviews.length ? <div className="inline-state"><p>{t.noReviews}</p></div> : null}
        {reviews.slice(0, 4).map((review) => <article className="review-card" key={review.id}><Quote className="review-quote" size={28}/><div className="stars" aria-label={`${review.rating} ${t.starsLabel}`}>{Array.from({ length: 5 }).map((_, index) => <Star key={index} size={14} fill={index < review.rating ? "currentColor" : "none"}/>)}</div><blockquote>{review.comment}</blockquote><footer><span className="review-avatar">{review.customerName.charAt(0)}</span><div><strong>{review.customerName}</strong><time>{new Intl.DateTimeFormat(language === "uz" ? "uz-UZ" : language === "ru" ? "ru-RU" : "en-US", { day: "2-digit", month: "long", year: "numeric" }).format(new Date(review.createdAt))}</time></div></footer></article>)}
      </div><aside className="review-form-card"><p className="eyebrow"><span/>{t.leaveReview}</p><h3>{t.reviewTitle}</h3><p>{t.reviewText}</p>{state.success ? <div className="form-success"><CheckCircle2/><strong>{t.reviewSuccess}</strong><button type="button" onClick={() => setState((current) => ({ ...current, success: false }))}>{t.leaveReview}</button></div> : <form onSubmit={submit}><div className="rating-field"><span>{t.rating}</span><div>{[1,2,3,4,5].map((rating) => <button type="button" key={rating} onClick={() => setForm((current) => ({ ...current, rating }))} aria-label={`${rating}/5`}><Star size={20} fill={rating <= form.rating ? "currentColor" : "none"}/></button>)}</div></div><label><span>{t.name}</span><input required minLength="2" maxLength="100" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}/></label><label><span>{t.phone}</span><input required type="tel" placeholder="+998 90 123 45 67" pattern="[+0-9 ()-]{7,24}" value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}/></label><label><span>{t.comment}</span><textarea required minLength="10" maxLength="1500" rows="5" value={form.comment} onChange={(event) => setForm((current) => ({ ...current, comment: event.target.value }))}/></label>{state.error ? <p className="form-error" role="alert">{state.error}</p> : null}<button className="form-submit" type="submit" disabled={state.sending}>{state.sending ? <LoaderCircle className="spin" size={18}/> : null}{t.sendReview}</button></form>}</aside></div>
    </div></section>
  );
}
