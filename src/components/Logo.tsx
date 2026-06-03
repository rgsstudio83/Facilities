import React from 'react';
import logoUrl from '../assets/images/logo_facilities_1780466808784.png';

interface LogoProps {
  className?: string;     // Sizing class (e.g., "h-11 w-auto")
  showText?: boolean;     // Kept for signature compatibility
  lightText?: boolean;    // Kept for signature compatibility
}

export default function Logo({ className = "h-11 w-auto", showText = true, lightText = false }: LogoProps) {
  return (
    <div className="flex items-center select-none">
      <img
        src={logoUrl}
        alt="Facilities Administração de Condomínios"
        className={className}
        referrerPolicy="no-referrer"
      />
    </div>
  );
}

