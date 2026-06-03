import React from 'react';

interface LogoProps {
  className?: string;     // SVG container sizing class (e.g., "h-11 w-auto")
  showText?: boolean;     // Whether to display the text portion
  lightText?: boolean;    // Whether to invert text/building colors for dark backgrounds
}

export default function Logo({ className = "h-11 w-auto", showText = true, lightText = false }: LogoProps) {
  const grayColor = lightText ? "#FFFFFF" : "#1e2229"; // Dark charcoal or crisp white
  const redColor = "#af101a"; // Brand facilities red
  const subtextColor = lightText ? "rgba(255, 255, 255, 0.82)" : "#4A5568"; // Refined subtext contrast

  // Render unified SVG
  return (
    <div className="flex items-center select-none">
      <svg
        className={className}
        viewBox={showText ? "0 0 520 125" : "0 0 135 110"}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* === BUILDING 1: Leftmost (Dark Charcoal / White) === */}
        <path
          d="M 22 93 
             L 22 52 
             L 64 47 
             L 64 82"
          stroke={grayColor}
          strokeWidth="4.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="transition-colors duration-300"
        />

        {/* === BUILDING 2: Middle / Tallest (Facilities Brand Red) === */}
        {/* If text is shown, the right leg turns at y=93 and runs horizontally under the text */}
        <path
          d={
            showText
              ? "M 48 80 L 48 35 L 84 25 L 84 93 L 510 93"
              : "M 48 80 L 48 35 L 84 25 L 84 93 L 115 93"
          }
          stroke={redColor}
          strokeWidth="4.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* === BUILDING 3: Rightmost (Dark Charcoal / White) === */}
        <path
          d="M 72 93 
             L 72 58 
             L 108 66 
             L 108 93"
          stroke={grayColor}
          strokeWidth="4.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="transition-colors duration-300"
        />

        {/* === TYPOGRAPHY (Rendered only when showText is active) === */}
        {showText && (
          <>
            {/* FACILITIES (Uppercase Display) */}
            <text
              x="122"
              y="80"
              fill={grayColor}
              fontFamily="system-ui, -apple-system, sans-serif"
              fontWeight="800"
              fontSize="45"
              letterSpacing="0.04em"
              className="transition-colors duration-300"
            >
              FACILITIES
            </text>

            {/* ADMINISTRAÇÃO DE CONDOMÍNIOS (Smaller Subtext under the Red Line) */}
            <text
              x="124"
              y="114"
              fill={subtextColor}
              fontFamily="system-ui, -apple-system, sans-serif"
              fontWeight="600"
              fontSize="12.2"
              letterSpacing="0.165em"
              className="transition-colors duration-300"
            >
              ADMINISTRAÇÃO DE CONDOMÍNIOS
            </text>
          </>
        )}
      </svg>
    </div>
  );
}
