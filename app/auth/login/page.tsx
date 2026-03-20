"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

function LoginContent() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    const err = searchParams.get("error");
    const errCode = searchParams.get("error_code");
    const errDesc = searchParams.get("error_description");
    if (err === "auth_failed") {
      setError("Login failed. Please try again.");
      window.history.replaceState({}, "", "/auth/login");
    } else if (err) {
      setError(`Auth error: ${errCode || err} — ${errDesc || ""}`);
      window.history.replaceState({}, "", "/auth/login");
    }
  }, [searchParams]);

  const handleGoogle = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/google", { method: "POST" });
      const { url, error: apiError } = await res.json();
      if (apiError || !url) {
        setError("Login failed. Please try again.");
        setLoading(false);
        return;
      }
      window.location.assign(url);
    } catch {
      setError("Connection failed. Check your internet.");
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm text-center">
      <Link href="/" className="mb-10 inline-block font-heading text-2xl italic font-extralight tracking-[-0.02em] text-black">
        1P
      </Link>

      {error && (
        <p className="mb-6 text-xs text-black/70 bg-black/[0.03] px-4 py-3 text-left">{error}</p>
      )}

      <button
        onClick={handleGoogle}
        disabled={loading}
        className="flex h-12 w-full items-center justify-center gap-3 border border-black/10 bg-white text-sm font-medium text-black transition-colors duration-150 hover:bg-black/[0.02] disabled:opacity-50"
      >
        {loading ? (
          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
        ) : (
          <GoogleIcon />
        )}
        {loading ? "Redirecting..." : "Continue with Google"}
      </button>

      <p className="mt-8 text-[11px] text-black/30 leading-relaxed">
        Sign in or create an account automatically.
        <br />
        By continuing, you agree to our terms of service.
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4">
      <React.Suspense fallback={
        <div className="w-full max-w-sm text-center">
          <span className="font-heading text-2xl italic font-extralight tracking-[-0.02em] text-black">1P</span>
        </div>
      }>
        <LoginContent />
      </React.Suspense>
    </div>
  );
}
