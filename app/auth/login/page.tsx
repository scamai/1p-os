"use client";

import * as React from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setError(authError.message);
        return;
      }

      router.push("/company");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="mb-1 text-xl font-bold text-zinc-900">
          1P
        </h1>
        <p className="mb-6 text-sm text-zinc-500">
          Sign in to your account
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
          />
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Your password"
            required
          />

          {error && (
            <p className="text-xs text-zinc-700">{error}</p>
          )}

          <Button type="submit" loading={loading}>
            Sign In
          </Button>
        </form>

        <p className="mt-4 text-center text-xs text-zinc-500">
          Don&apos;t have an account?{" "}
          <Link
            href="/auth/signup"
            className="text-zinc-900 underline underline-offset-2"
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
