export function SectionHeading({ eyebrow, title, copy, align = "left" }) {
  return (
    <div className={`section-heading section-heading--${align}`}>
      <p className="eyebrow"><span />{eyebrow}</p>
      <h2>{title}</h2>
      {copy && <p className="section-copy">{copy}</p>}
    </div>
  );
}
