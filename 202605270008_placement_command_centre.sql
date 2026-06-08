"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

export type ReportPayload = {
  title: string;
  report_type: string;
  generated_by: string;
  school_id: string;
  content: Record<string, unknown>;
};

export function SaveReportButton({ report }: { report: ReportPayload }) {
  const [message, setMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  async function saveReport() {
    setMessage(null);
    setIsSaving(true);
    const supabase = createClient();
    const { error } = await supabase.from("reports").insert(report);
    setIsSaving(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("Saved");
  }

  return (
    <div className="flex items-center gap-3 print:hidden">
      <Button disabled={isSaving} onClick={saveReport} type="button" variant="secondary">
        {isSaving ? "Saving..." : "Save Report"}
      </Button>
      {message ? <span className="text-xs text-muted-foreground">{message}</span> : null}
    </div>
  );
}
