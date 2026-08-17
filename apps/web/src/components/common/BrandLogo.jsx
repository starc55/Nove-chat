export function BrandLogo({ className = "", label = "XION" }) {
  return <span className={`brand-logo ${className}`.trim()} role="img" aria-label={label}><span className="brand-logo-mark" aria-hidden="true" /></span>;
}
