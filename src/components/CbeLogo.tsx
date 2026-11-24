import React from 'react';

interface CbeLogoProps {
  size?: number;
  className?: string;
}

export const CbeLogo: React.FC<CbeLogoProps> = ({ size = 62, className = '' }) => {
  return (
    <img
      src="/cbe-logo.png"
      alt="Commercial Bank of Ethiopia logo"
      width={size}
      height={size}
      style={{ width: size, height: size }}
      className={`object-contain select-none ${className}`}
      draggable={false}
    />
  );
};
