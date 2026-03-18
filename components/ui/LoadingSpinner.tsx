const sizes = {
  sm: "h-4 w-4",
  md: "h-6 w-6",
  lg: "h-8 w-8",
} as const;

interface LoadingSpinnerProps {
  size?: keyof typeof sizes;
  className?: string;
}

function LoadingSpinner({ size = "md", className = "" }: LoadingSpinnerProps) {
  return (
    <svg
      className={`animate-spin text-slate-400 ${sizes[size]} ${className}`}
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
      />
    </svg>
  );
}

export { LoadingSpinner };
