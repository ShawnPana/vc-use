export function Logo({ size = 32 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ color: "white" }}
    >
      {/* Minimal geometric polygon design inspired by OpenAI/Cognition */}
      <path
        d="M16 2L28 9.5V22.5L16 30L4 22.5V9.5L16 2Z"
        stroke="white"
        strokeWidth="2"
        strokeLinejoin="miter"
        fill="none"
      />
      <path
        d="M16 8L22 11.5V18.5L16 22L10 18.5V11.5L16 8Z"
        fill="white"
      />
      <line x1="16" y1="2" x2="16" y2="8" stroke="white" strokeWidth="2" />
      <line x1="28" y1="9.5" x2="22" y2="11.5" stroke="white" strokeWidth="2" />
      <line x1="28" y1="22.5" x2="22" y2="18.5" stroke="white" strokeWidth="2" />
      <line x1="16" y1="30" x2="16" y2="22" stroke="white" strokeWidth="2" />
      <line x1="4" y1="22.5" x2="10" y2="18.5" stroke="white" strokeWidth="2" />
      <line x1="4" y1="9.5" x2="10" y2="11.5" stroke="white" strokeWidth="2" />
    </svg>
  );
}
