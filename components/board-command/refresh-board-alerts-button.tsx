"use client";

import { useState, useTransition } from "react";
import { refreshBoardAlerts } from "@/app/(app)/board-command/actions";
import { Button } from "@/components/ui/button";

export function RefreshBoardAlertsButton() {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  return (
    <div className="flex flex-col items-start gap-2 sm:items-end">
      <Button
        disabled={isPending}
        onClick={() => {
          startTransition(async () => {
            const result = await refreshBoardAlerts();
            setMessage(result.message);
          });
        }}
        type="button"
        variant="secondary"
      >
        {isPending ? "Refreshing..." : "Refresh Board Alerts"}
      </Button>
      {message ? <p className="max-w-xs text-xs text-muted-foreground">{message}</p> : null}
    </div>
  );
}
