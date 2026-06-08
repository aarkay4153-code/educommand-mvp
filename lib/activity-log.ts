import { createClient } from "@/lib/supabase/client";

export type ActivityLogInput = {
  schoolId: string;
  actorId: string;
  entityType: "task" | "syllabus_update" | "event" | "event_milestone";
  entityId: string;
  action: string;
  oldValue?: Record<string, unknown> | null;
  newValue?: Record<string, unknown> | null;
};

export async function writeActivityLog({
  action,
  actorId,
  entityId,
  entityType,
  newValue = null,
  oldValue = null,
  schoolId,
}: ActivityLogInput) {
  const supabase = createClient();
  await supabase.from("activity_logs").insert({
    school_id: schoolId,
    actor_id: actorId,
    entity_type: entityType,
    entity_id: entityId,
    action,
    old_value: oldValue,
    new_value: newValue,
  });
}
