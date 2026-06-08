"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured, supabaseConfigError } from "@/lib/supabase/config";

const missingProfileMessage =
  "Your account exists, but your EduCommand profile has not been configured. Please contact the institution admin.";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!isSupabaseConfigured()) {
      setError(supabaseConfigError);
      return;
    }

    setIsLoading(true);

    const supabase = createClient();
    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !data.user) {
      setIsLoading(false);
      setError(authError?.message ?? "Unable to log in. Check your email and password.");
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, role")
      .eq("id", data.user.id)
      .maybeSingle();

    if (profileError || !profile) {
      await supabase.auth.signOut();
      setIsLoading(false);
      setError(missingProfileMessage);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      {error ? (
        <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-200">
          {error}
        </div>
      ) : null}

      <label className="block text-sm font-medium">
        Email
        <input
          className="mt-2 h-10 w-full rounded-md border bg-card px-3 text-sm"
          disabled={isLoading}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@school.edu"
          required
          type="email"
          value={email}
        />
      </label>

      <label className="block text-sm font-medium">
        Password
        <input
          className="mt-2 h-10 w-full rounded-md border bg-card px-3 text-sm"
          disabled={isLoading}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Password"
          required
          type="password"
          value={password}
        />
      </label>

      <Button className="w-full" disabled={isLoading} type="submit">
        {isLoading ? "Logging in..." : "Login"}
      </Button>

      <Button className="w-full" disabled={isLoading} type="button" variant="ghost">
        Forgot password
      </Button>
    </form>
  );
}
