/**
 * 1P Logo — italic falcon mark
 *
 * The "1" forms the falcon's body/wing with a sharp downstroke,
 * and the "P" curves into the head/beak, creating a raptor silhouette
 * when viewed as a whole. All strokes are angular and italic.
 */
function Logo({ className = "h-8 w-auto" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="1P"
    >
      {/* "1" — sharp italic downstroke forming the falcon's body/wing */}
      <path
        d="M28 18L38 8L54 8L36 108L20 108L35 28L28 32Z"
        fill="currentColor"
      />
      {/* "P" — the bowl curves into the falcon's head, the stem merges with body */}
      <path
        d="M50 8L92 8C104 8 112 18 110 32C108 46 96 56 84 56L62 56L54 108L38 108L50 8Z M64 20L58 44L78 44C86 44 93 37 94 28C95 19 90 20 82 20L64 20Z"
        fill="currentColor"
        fillRule="evenodd"
      />
      {/* Falcon beak — sharp angular accent extending from P's bowl */}
      <path
        d="M108 24L120 16L116 28L108 24Z"
        fill="currentColor"
      />
      {/* Eye dot */}
      <circle cx="96" cy="22" r="3" fill="currentColor" opacity="0" />
    </svg>
  );
}

/** Compact inline version for nav/favicon contexts */
function LogoMark({ className = "h-5 w-auto" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="1P"
    >
      <path
        d="M28 18L38 8L54 8L36 108L20 108L35 28L28 32Z"
        fill="currentColor"
      />
      <path
        d="M50 8L92 8C104 8 112 18 110 32C108 46 96 56 84 56L62 56L54 108L38 108L50 8Z M64 20L58 44L78 44C86 44 93 37 94 28C95 19 90 20 82 20L64 20Z"
        fill="currentColor"
        fillRule="evenodd"
      />
      <path
        d="M108 24L120 16L116 28L108 24Z"
        fill="currentColor"
      />
    </svg>
  );
}

export { Logo, LogoMark };
