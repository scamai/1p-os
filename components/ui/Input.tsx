import * as React from "react";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = "", label, error, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-zinc-900"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`h-9 w-full rounded-md border bg-transparent px-3 text-sm text-zinc-900 placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-300 disabled:cursor-not-allowed disabled:opacity-50 ${
            error
              ? "border-zinc-300"
              : "border-zinc-200"
          } ${className}`}
          {...props}
        />
        {error && (
          <p className="text-xs text-zinc-700">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export { Input };
