import React from 'react';

interface FamilyTreeLogoProps {
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

export const FamilyTreeLogo: React.FC<FamilyTreeLogoProps> = ({
  size = 28,
  className = '',
  style = {},
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }}
    >
      <defs>
        {/* Crisp High-Contrast Emerald & Cyan Gradients */}
        <linearGradient id="mainStemGrad" x1="18" y1="33" x2="18" y2="10" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#059669" />
          <stop offset="60%" stopColor="#10b981" />
          <stop offset="100%" stopColor="#34d399" />
        </linearGradient>

        <linearGradient id="apexGoldGrad" x1="14" y1="4" x2="22" y2="12" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#fef08a" />
          <stop offset="100%" stopColor="#f59e0b" />
        </linearGradient>

        <linearGradient id="leafTealGrad" x1="6" y1="12" x2="30" y2="24" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#10b981" />
        </linearGradient>

        <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodColor="#047857" floodOpacity="0.5" />
        </filter>
      </defs>

      <g filter="url(#softGlow)">
        {/* Ancestral Foundation Arc (Roots) */}
        <path
          d="M12 31C15 29.5 21 29.5 24 31"
          stroke="#059669"
          strokeWidth="2.4"
          strokeLinecap="round"
        />

        {/* Central Lineage Trunk */}
        <path
          d="M18 30V14"
          stroke="url(#mainStemGrad)"
          strokeWidth="3.2"
          strokeLinecap="round"
        />

        {/* Left Generation Branch */}
        <path
          d="M18 22C14 22 10.5 19 9 14.5"
          stroke="url(#mainStemGrad)"
          strokeWidth="2.2"
          strokeLinecap="round"
        />

        {/* Right Generation Branch */}
        <path
          d="M18 22C22 22 25.5 19 27 14.5"
          stroke="url(#mainStemGrad)"
          strokeWidth="2.2"
          strokeLinecap="round"
        />

        {/* Ancestor Apex Node (Top Golden Core) */}
        <circle cx="18" cy="8.5" r="4" fill="url(#apexGoldGrad)" stroke="#ffffff" strokeWidth="1.2" />

        {/* Generation Nodes (Left & Right) */}
        <circle cx="8.5" cy="14" r="3" fill="#10b981" stroke="#ffffff" strokeWidth="1" />
        <circle cx="27.5" cy="14" r="3" fill="#10b981" stroke="#ffffff" strokeWidth="1" />

        {/* Cyan Descendant Buds */}
        <circle cx="5" cy="21" r="1.8" fill="#38bdf8" />
        <path d="M8.5 17C7.5 18.5 6 19.5 5 21" stroke="#38bdf8" strokeWidth="1.4" strokeLinecap="round" />

        <circle cx="31" cy="21" r="1.8" fill="#38bdf8" />
        <path d="M27.5 17C28.5 18.5 30 19.5 31 21" stroke="#38bdf8" strokeWidth="1.4" strokeLinecap="round" />

        {/* Central Union Node */}
        <circle cx="18" cy="21" r="2.5" fill="#34d399" stroke="#064e3b" strokeWidth="1" />
      </g>
    </svg>
  );
};
