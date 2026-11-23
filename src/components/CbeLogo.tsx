import React, { useId } from 'react';

interface CbeLogoProps {
  size?: number;
  className?: string;
}

export const CbeLogo: React.FC<CbeLogoProps> = ({ size = 62, className = '' }) => {
  const uid = useId().replace(/:/g, '');
  const wireGradId = `cbeWire-${uid}`;
  const coinFaceId = `cbeFace-${uid}`;
  const coinSheenId = `cbeSheen-${uid}`;
  const rimGradId = `cbeRim-${uid}`;
  const monoGradId = `cbeMono-${uid}`;
  const shadowId = `cbeShadow-${uid}`;
  const topArcId = `cbeTopArc-${uid}`;
  const botArcId = `cbeBotArc-${uid}`;

  // 32-tooth serrated coin bezel around (100, 100)
  const teeth = 32;
  const rOut = 50.5;
  const rIn = 46.8;
  const serratedPoints: string[] = [];
  for (let i = 0; i < teeth * 2; i++) {
    const angle = (i * Math.PI) / teeth;
    const r = i % 2 === 0 ? rOut : rIn;
    const x = 100 + r * Math.cos(angle);
    const y = 100 + r * Math.sin(angle);
    serratedPoints.push(`${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`);
  }
  const serratedPath = `${serratedPoints.join(' ')} Z`;

  // Three sweeping guilloche ribbon wings matching official CBE spiral (top-right, bottom-right, left)
  const wings = [-68, 52, 172];
  const loopIndices = [-4, -3, -2, -1, 0, 1, 2, 3, 4];

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Commercial Bank of Ethiopia logo"
      className={className}
    >
      <defs>
        <linearGradient id={wireGradId} x1="18" y1="18" x2="182" y2="182" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#9A611C" />
          <stop offset="35%" stopColor="#D7A14D" />
          <stop offset="68%" stopColor="#8A5114" />
          <stop offset="100%" stopColor="#C88E3B" />
        </linearGradient>

        <linearGradient id={rimGradId} x1="54" y1="54" x2="146" y2="146" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#F9DFBA" />
          <stop offset="30%" stopColor="#C88B4E" />
          <stop offset="65%" stopColor="#7C4719" />
          <stop offset="100%" stopColor="#E6B27B" />
        </linearGradient>

        <linearGradient id={coinFaceId} x1="62" y1="62" x2="138" y2="138" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#E7B37F" />
          <stop offset="28%" stopColor="#F8D8B3" />
          <stop offset="52%" stopColor="#B6763E" />
          <stop offset="76%" stopColor="#E2AC76" />
          <stop offset="100%" stopColor="#8E5423" />
        </linearGradient>

        <radialGradient id={coinSheenId} cx="35%" cy="32%" r="70%">
          <stop offset="0%" stopColor="#FFF0D9" stopOpacity="0.45" />
          <stop offset="55%" stopColor="#D59A62" stopOpacity="0.1" />
          <stop offset="100%" stopColor="#5D320E" stopOpacity="0.35" />
        </radialGradient>

        <linearGradient id={monoGradId} x1="76" y1="76" x2="126" y2="124" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#4B270C" />
          <stop offset="45%" stopColor="#7A481E" />
          <stop offset="100%" stopColor="#3B1D07" />
        </linearGradient>

        <filter id={shadowId} x="-15%" y="-15%" width="130%" height="130%">
          <feDropShadow dx="0" dy="2" stdDeviation="2.5" floodColor="#3A1D06" floodOpacity="0.38" />
        </filter>

        {/* Top & bottom circular text paths for curved Amharic script */}
        <path id={topArcId} d="M 64,100 A 36,36 0 0,1 136,100" />
        <path id={botArcId} d="M 62,102 A 38,38 0 0,0 138,102" />
      </defs>

      {/* 3-Wing Sweeping Golden Guilloche Spiral Mesh */}
      <g stroke={`url(#${wireGradId})`} strokeWidth="1.25" opacity="0.96">
        {wings.map((baseAngle) => (
          <g key={baseAngle} transform={`rotate(${baseAngle} 100 100)`}>
            {loopIndices.map((idx) => {
              const fanAngle = idx * 4.2;
              const offsetShift = idx * 1.3;
              return (
                <ellipse
                  key={idx}
                  cx={130 + Math.abs(idx) * 0.6}
                  cy={100 + offsetShift}
                  rx={62 - Math.abs(idx) * 1.1}
                  ry={25 + idx * 0.8}
                  transform={`rotate(${fanAngle} 100 100)`}
                />
              );
            })}
          </g>
        ))}
      </g>

      {/* Serrated Metallic Coin Bezel with Subtle Drop Shadow */}
      <g filter={`url(#${shadowId})`}>
        <path d={serratedPath} fill={`url(#${rimGradId})`} stroke="#4A270B" strokeWidth="1.1" />
      </g>

      {/* Main Rose-Gold Metallic Coin Face */}
      <circle cx="100" cy="100" r="44" fill={`url(#${coinFaceId})`} stroke="#7D481A" strokeWidth="1.4" />
      <circle cx="100" cy="100" r="44" fill={`url(#${coinSheenId})`} />
      <circle cx="100" cy="100" r="41.5" fill="none" stroke="#FBE5C7" strokeWidth="0.8" opacity="0.7" />

      {/* Curved Amharic Legend: የኢትዮጵያ (top) & ንግድ ባንክ (bottom) */}
      <text
        fill="#391C07"
        fontSize="9.8"
        fontWeight="700"
        fontFamily="'Noto Sans Ethiopic', sans-serif"
        letterSpacing="2.2"
      >
        <textPath href={`#${topArcId}`} startOffset="50%" textAnchor="middle">
          የኢትዮጵያ
        </textPath>
      </text>
      <text
        fill="#391C07"
        fontSize="9.8"
        fontWeight="700"
        fontFamily="'Noto Sans Ethiopic', sans-serif"
        letterSpacing="2"
      >
        <textPath href={`#${botArcId}`} startOffset="50%" textAnchor="middle">
          ንግድ ባንክ
        </textPath>
      </text>

      {/* Recessed Center Medallion Circle */}
      <circle
        cx="100"
        cy="100"
        r="27"
        fill="#A66A36"
        fillOpacity="0.22"
        stroke="#6B3D14"
        strokeWidth="1"
      />

      {/* Exact Interlocking C - B - E Monogram */}
      {/* Bevel Highlight Layer */}
      <g transform="translate(0.7, 0.7)" fill="#FADDC0" opacity="0.75">
        <path d="M119.5 84.5C114.7 78.9 107.7 75.5 99.7 75.5C85.9 75.5 75.6 86.2 75.6 100C75.6 113.8 85.9 124.5 99.7 124.5C107.8 124.5 114.9 121 119.6 115.2L115.2 111.7C111.5 116.2 106.1 119 99.7 119C89.5 119 81.8 110.9 81.8 100C81.8 89.1 89.5 81 99.7 81C106 81 111.3 83.7 115 88L119.5 84.5Z" />
        <path d="M87.5 84.2H98.8C104.2 84.2 107.8 87.3 107.8 91.8C107.8 95 105.9 97.3 103 98.3C106.4 99.2 108.5 101.8 108.5 105.5C108.5 110.4 104.6 113.4 98.8 113.4H87.5V84.2ZM93 88.6V96.2H98.2C100.8 96.2 102.3 94.8 102.3 92.4C102.3 90 100.8 88.6 98.2 88.6H93ZM93 100.6V109H98.6C101.4 109 103 107.5 103 104.8C103 102.1 101.4 100.6 98.6 100.6H93Z" />
        <path d="M107.2 84.2H118.5V88.6H112.2V96.4H117.5V100.8H112.2V109H118.5V113.4H107.2V84.2Z" />
      </g>

      {/* Main Bronze Monogram */}
      <g fill={`url(#${monoGradId})`}>
        {/* Outer C Arc */}
        <path d="M119.5 84.5C114.7 78.9 107.7 75.5 99.7 75.5C85.9 75.5 75.6 86.2 75.6 100C75.6 113.8 85.9 124.5 99.7 124.5C107.8 124.5 114.9 121 119.6 115.2L115.2 111.7C111.5 116.2 106.1 119 99.7 119C89.5 119 81.8 110.9 81.8 100C81.8 89.1 89.5 81 99.7 81C106 81 111.3 83.7 115 88L119.5 84.5Z" />
        {/* Center B */}
        <path d="M87.5 84.2H98.8C104.2 84.2 107.8 87.3 107.8 91.8C107.8 95 105.9 97.3 103 98.3C106.4 99.2 108.5 101.8 108.5 105.5C108.5 110.4 104.6 113.4 98.8 113.4H87.5V84.2ZM93 88.6V96.2H98.2C100.8 96.2 102.3 94.8 102.3 92.4C102.3 90 100.8 88.6 98.2 88.6H93ZM93 100.6V109H98.6C101.4 109 103 107.5 103 104.8C103 102.1 101.4 100.6 98.6 100.6H93Z" />
        {/* Right E connected into the C opening */}
        <path d="M107.2 84.2H118.5V88.6H112.2V96.4H117.5V100.8H112.2V109H118.5V113.4H107.2V84.2Z" />
      </g>
    </svg>
  );
};
