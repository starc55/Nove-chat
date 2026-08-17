export function BrandLogo({ className = "", label = "XION", symbolOnly = false }) {
  return <span className={`brand-logo ${symbolOnly ? "is-symbol" : ""} ${className}`.trim()} role="img" aria-label={label}><span className="brand-logo-mark" aria-hidden="true" /></span>;
}
