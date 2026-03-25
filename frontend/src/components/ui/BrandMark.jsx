import { useId } from "react";

const BrandMark = ({ className = "h-12 w-12" }) => {
  const gradientId = useId();
  const glowId = useId();

  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" className={className}>
      <defs>
        <linearGradient id={gradientId} x1="10" y1="8" x2="54" y2="56" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#1f1a16" />
          <stop offset="0.55" stopColor="#5b4730" />
          <stop offset="1" stopColor="#a77a46" />
        </linearGradient>
        <radialGradient id={glowId} cx="0" cy="0" r="1" gradientTransform="translate(47 17) rotate(90) scale(18)">
          <stop offset="0" stopColor="#f4ddaf" stopOpacity="0.9" />
          <stop offset="1" stopColor="#f4ddaf" stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect x="4" y="4" width="56" height="56" rx="18" fill={`url(#${gradientId})`} />
      <rect x="6.5" y="6.5" width="51" height="51" rx="15.5" fill="none" stroke="rgba(255,255,255,0.18)" />
      <circle cx="46" cy="18" r="14" fill={`url(#${glowId})`} />
      <path
        d="M24 16.5C24 15.12 25.12 14 26.5 14H31.5C32.88 14 34 15.12 34 16.5V38H43.5C44.88 38 46 39.12 46 40.5V45.5C46 46.88 44.88 48 43.5 48H26.5C25.12 48 24 46.88 24 45.5V16.5Z"
        fill="#fffaf2"
      />
      <path
        d="M44.5 15.5L47.5 18.5L44.5 21.5L41.5 18.5L44.5 15.5Z"
        fill="#f7d38e"
        opacity="0.95"
      />
    </svg>
  );
};

export default BrandMark;
