import React from 'react';

interface LogoProps {
  className?: string;     // Sizing class (e.g., "h-11 w-auto")
  showText?: boolean;     // Kept for signature compatibility
  lightText?: boolean;    // Kept for signature compatibility
}

export default function Logo({ className = "h-11 w-auto", showText = true, lightText = false }: LogoProps) {
  return (
    <div className="flex items-center select-none">
      <img
        src="https://ejpjtpteycckydrorjpr.supabase.co/storage/v1/object/public/images/facilitieslogoheader.png"
        alt="Facilities Administração de Condomínios"
        className={className}
        referrerPolicy="no-referrer"
      />
    </div>
  );
}

