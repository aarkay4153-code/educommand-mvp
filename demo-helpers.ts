"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

export function LogoutButton() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  async function handleLogout() {
    setIsLoading(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <Button
      aria-label="Logout"
      disabled={isLoading}
      onClick={handleLogout}
      title="Logout"
      type="button"
      variant="ghost"
    >
      <LogOut className="size-4" aria-hidden="true" />
      <span className="sr-only">Logout</span>
    </Button>
  );
}
