import { useId } from "react";

const BrandMark = ({ className = "" }) => {
  const gradientId = useId().replace(/:/g, "");

  return (
    <span className={`inline-flex items-center justify-center rounded-[22px] ${className}`}>
      <svg viewBox="0 0 72 72" className="h-[72%] w-[72%]" aria-hidden="true">
        <defs>
          <linearGradient id={`lion-mane-${gradientId}`} x1="10" y1="8" x2="60" y2="64" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ffe5aa" />
            <stop offset="55%" stopColor="#d48b29" />
            <stop offset="100%" stopColor="#7b4617" />
          </linearGradient>
          <linearGradient id={`lion-face-${gradientId}`} x1="24" y1="18" x2="48" y2="52" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#fff7e2" />
            <stop offset="100%" stopColor="#efd39b" />
          </linearGradient>
        </defs>

        <path
          d="M36 6l6.2 6.3 8.9-2.2 2.4 8.8 8.9 2.5-2.3 8.8 6.3 6.3-6.3 6.3 2.3 8.8-8.9 2.5-2.4 8.8-8.9-2.2L36 66l-6.2-6.3-8.9 2.2-2.4-8.8-8.9-2.5 2.3-8.8L5.6 36l6.3-6.3-2.3-8.8 8.9-2.5 2.4-8.8 8.9 2.2L36 6Z"
          fill={`url(#lion-mane-${gradientId})`}
        />

        <circle cx="36" cy="37" r="14.5" fill={`url(#lion-face-${gradientId})`} />
        <path d="M30 28.5l-4.5-6.5M42 28.5l4.5-6.5" stroke="#7b4617" strokeWidth="3.2" strokeLinecap="round" />
        <circle cx="31" cy="35" r="2.2" fill="#28170b" />
        <circle cx="41" cy="35" r="2.2" fill="#28170b" />
        <path d="M36 37.5l-3.2 4.8h6.4L36 37.5Z" fill="#7b4617" />
        <path d="M31 45c1.7 2.3 3.7 3.2 5 3.2s3.3-.9 5-3.2" stroke="#7b4617" strokeWidth="2.8" strokeLinecap="round" />
        <path d="M26 40.5l-5 1.2M26 44.5l-4.6 3M46 40.5l5 1.2M46 44.5l4.6 3" stroke="#a96522" strokeWidth="2" strokeLinecap="round" />
        <path d="M28.2 20.2c2.2-2.5 4.9-3.8 7.8-3.8s5.6 1.3 7.8 3.8" stroke="#fce9bd" strokeWidth="3.8" strokeLinecap="round" opacity="0.72" />
      </svg>
    </span>
  );
};

export default BrandMark;
