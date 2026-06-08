"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function CopyMessageButton({ message }: { message: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(message);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <Button onClick={copy} type="button" variant="secondary">
      {copied ? "Copied" : "Copy message"}
    </Button>
  );
}
