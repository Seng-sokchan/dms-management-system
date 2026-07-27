/** Visual match for mobile-app PaymentSuccessIllustration */
export function PaymentSuccessIllustration() {
  const CX = 140;
  const BADGE_CY = 78;
  const BADGE_R = 30;

  return (
    <div className="pay-success-illu" aria-hidden="true">
      <svg width="280" height="200" viewBox="0 0 280 200" role="img">
        <rect x="0" y="0" width="280" height="200" fill="#D9ECF2" rx="20" />

        <ellipse cx="72" cy="52" rx="28" ry="14" fill="#FFFFFF" opacity="0.85" />
        <ellipse cx="210" cy="44" rx="34" ry="16" fill="#FFFFFF" opacity="0.85" />
        <ellipse cx="150" cy="36" rx="22" ry="11" fill="#FFFFFF" opacity="0.7" />

        <ellipse cx={CX} cy="168" rx="150" ry="40" fill="#B8D9E8" />
        <path d="M48 158 C 64 132, 92 140, 108 158 Z" fill="#9CC7D8" />
        <path d="M196 158 C 212 130, 238 138, 252 158 Z" fill="#9CC7D8" />

        <rect x="48" y="118" width="10" height="42" rx="3" fill="#9CC7D8" />
        <rect x="38" y="128" width="30" height="8" rx="4" fill="#9CC7D8" />
        <rect x="222" y="112" width="10" height="48" rx="3" fill="#9CC7D8" />
        <rect x="212" y="122" width="30" height="8" rx="4" fill="#9CC7D8" />

        <rect x={CX - 2} y="54" width="4" height="104" rx="2" fill="#8AA4BF" />
        <path d={`M${CX + 2} 56 L${CX + 2} 100 L${CX + 38} ${BADGE_CY} Z`} fill="#FFFFFF" />

        <circle cx={CX} cy={BADGE_CY} r={BADGE_R} fill="#42B56E" />
        <path
          d={`M${CX - 12} ${BADGE_CY} L${CX - 4} ${BADGE_CY + 8} L${CX + 12} ${BADGE_CY - 8}`}
          stroke="#FFFFFF"
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
    </div>
  );
}
