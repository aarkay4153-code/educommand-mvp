import type { StatusTone } from "@/lib/types";

export function statusTone(status: string): StatusTone {
  if (["completed", "done", "on_track", "submitted"].includes(status)) return "success";
  if (["behind", "delayed", "blocked", "at_risk"].includes(status)) return "danger";
  if (["in_progress", "assigned", "planned", "not_started"].includes(status)) return "warning";
  return "neutral";
}
