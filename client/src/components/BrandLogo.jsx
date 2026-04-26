import { useState } from 'react';

const LOGO_ICON_SRC = '/icon-192.png';
const LOGO_PNG_FALLBACK_SRC = '/logo-dark.png';

function BrandLogo({
  alt = 'GullyCric',
  className = '',
  heightClassName = 'h-10',
  imgClassName = '',
  nameClassName = '',
  priority = false,
}) {
  const [logoSrc, setLogoSrc] = useState(LOGO_ICON_SRC);

  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      <img
        src={logoSrc}
        alt={alt}
        width="192"
        height="192"
        decoding="async"
        loading={priority ? 'eager' : 'lazy'}
        onError={() => {
          if (logoSrc !== LOGO_PNG_FALLBACK_SRC) {
            setLogoSrc(LOGO_PNG_FALLBACK_SRC);
          }
        }}
        className={`${heightClassName} w-auto shrink-0 object-contain ${imgClassName}`}
      />
      <span
        className={`text-2xl font-black tracking-[0.04em] text-slate-50 sm:text-[2rem] ${nameClassName}`}
      >
        GullyCric
      </span>
    </div>
  );
}

export default BrandLogo;
