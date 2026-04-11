import { useEffect, useState } from "react";

/**
 * VigiLoc Animated Logo Component
 * Features:
 * - Eye blinking animation every 3 seconds
 * - Red iris
 * - Customizable colors for different backgrounds
 */
const VigiLocLogo = ({ 
  size = 40, 
  variant = "header", // "header" (white bg) or "footer" (dark bg)
  showText = false,
  textColor = null,
  className = ""
}) => {
  const [isBlinking, setIsBlinking] = useState(false);

  // Blinking animation every 3 seconds
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 150); // Blink duration
    }, 3000);

    return () => clearInterval(blinkInterval);
  }, []);

  // Colors based on variant
  const colors = variant === "header" 
    ? {
        // For white background - use footer colors (gray-900)
        outer: "#111827", // gray-900
        inner: "#1f2937", // gray-800
        eyeWhite: "#ffffff",
        iris: "#dc2626", // red-600
        pupil: "#000000",
        vLetter: "#111827",
        text: textColor || "#111827"
      }
    : {
        // For dark background (footer) - lighter version
        outer: "#3b82f6", // blue-500
        inner: "#60a5fa", // blue-400
        eyeWhite: "#ffffff",
        iris: "#dc2626", // red-600
        pupil: "#000000",
        vLetter: "#ffffff",
        text: textColor || "#ffffff"
      };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <svg 
        width={size} 
        height={size} 
        viewBox="0 0 100 100" 
        className="vigiloc-animated-logo"
      >
        <defs>
          {/* Gradient for the outer shape */}
          <linearGradient id={`logoGradient-${variant}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={colors.outer} />
            <stop offset="100%" stopColor={colors.inner} />
          </linearGradient>
          
          {/* Glow effect */}
          <filter id={`glow-${variant}`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          
          {/* Shadow for eye */}
          <filter id={`eyeShadow-${variant}`}>
            <feDropShadow dx="0" dy="1" stdDeviation="1" floodOpacity="0.3"/>
          </filter>
        </defs>
        
        {/* Background rounded square */}
        <rect 
          x="5" 
          y="5" 
          width="90" 
          height="90" 
          rx="16" 
          fill={`url(#logoGradient-${variant})`}
          className="transition-all duration-300"
        />
        
        {/* V Letter - stylized as an eye shape */}
        <g transform="translate(50, 52)">
          {/* Eye white (sclera) */}
          <ellipse 
            cx="0" 
            cy="0" 
            rx="28" 
            ry={isBlinking ? "2" : "18"}
            fill={colors.eyeWhite}
            filter={`url(#eyeShadow-${variant})`}
            className="transition-all duration-150"
            style={{
              transformOrigin: 'center',
            }}
          />
          
          {/* Iris - RED */}
          {!isBlinking && (
            <circle 
              cx="0" 
              cy="0" 
              r="12" 
              fill={colors.iris}
              className="animate-pulse"
              style={{ animationDuration: '2s' }}
            />
          )}
          
          {/* Pupil */}
          {!isBlinking && (
            <circle 
              cx="0" 
              cy="0" 
              r="5" 
              fill={colors.pupil}
            />
          )}
          
          {/* Light reflection */}
          {!isBlinking && (
            <circle 
              cx="4" 
              cy="-4" 
              r="2" 
              fill="#ffffff"
              opacity="0.8"
            />
          )}
        </g>
        
        {/* V letter on top of eye (subtle) */}
        <text 
          x="50" 
          y="75" 
          textAnchor="middle" 
          fill={variant === "header" ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.15)"}
          fontSize="48" 
          fontWeight="bold" 
          fontFamily="Space Grotesk, sans-serif"
        >
          V
        </text>
      </svg>
      
      {/* Text */}
      {showText && (
        <span 
          className="font-bold text-xl"
          style={{ color: colors.text }}
        >
          VigiLoc
        </span>
      )}
      
      <style>{`
        @keyframes pulse-iris {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }
        
        .vigiloc-animated-logo {
          filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1));
        }
      `}</style>
    </div>
  );
};

export default VigiLocLogo;
