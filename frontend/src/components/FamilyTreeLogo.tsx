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
    <img
      src="/favicon-64x64.png?v=20261024"
      alt="Famlykin Logo"
      width={size}
      height={size}
      className={className}
      style={{
        display: 'inline-block',
        verticalAlign: 'middle',
        flexShrink: 0,
        borderRadius: '8px',
        objectFit: 'contain',
        ...style,
      }}
    />
  );
};
