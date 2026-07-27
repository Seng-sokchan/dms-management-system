/** Simple line icons matching mobile MaterialCommunityIcons roles. */
export function TabIcon({ name, active }) {
  const stroke = active ? "currentColor" : "currentColor";
  const common = {
    viewBox: "0 0 24 24",
    width: 24,
    height: 24,
    fill: "none",
    stroke,
    strokeWidth: 1.8,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
  };

  switch (name) {
    case "store":
      return (
        <svg {...common}>
          <path d="M4 9h16l-1 11H5L4 9z" />
          <path d="M4 9l2-5h12l2 5" />
          <path d="M10 13h4" />
        </svg>
      );
    case "receipt":
      return (
        <svg {...common}>
          <path d="M6 3h12v18l-2-1.5L14 21l-2-1.5L10 21l-2-1.5L6 21V3z" />
          <path d="M9 8h6M9 12h6M9 16h3" />
        </svg>
      );
    case "clipboard":
      return (
        <svg {...common}>
          <rect x="6" y="5" width="12" height="16" rx="2" />
          <path d="M9 5V4h6v1M9 11h6M9 15h4" />
        </svg>
      );
    case "package":
      return (
        <svg {...common}>
          <path d="M3 8l9-5 9 5v9l-9 5-9-5V8z" />
          <path d="M3 8l9 5 9-5M12 13v9" />
        </svg>
      );
    case "calendar":
      return (
        <svg {...common}>
          <rect x="3" y="5" width="18" height="16" rx="2" />
          <path d="M8 3v4M16 3v4M3 10h18" />
          <path d="M12 14v3M12 14l2 1" />
        </svg>
      );
    case "map":
      return (
        <svg {...common}>
          <path d="M12 21s7-5.2 7-11a7 7 0 10-14 0c0 5.8 7 11 7 11z" />
          <circle cx="12" cy="10" r="2.5" />
        </svg>
      );
    case "account":
      return (
        <svg {...common}>
          <circle cx="12" cy="8" r="3.5" />
          <path d="M5 20a7 7 0 0114 0" />
        </svg>
      );
    case "cart":
      return (
        <svg {...common}>
          <path d="M4 5h2l2 12h10l2-8H8" />
          <circle cx="10" cy="20" r="1.5" />
          <circle cx="17" cy="20" r="1.5" />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8" />
        </svg>
      );
  }
}
