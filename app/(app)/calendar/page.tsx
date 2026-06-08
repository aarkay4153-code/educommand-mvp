import { PageHeader } from "@/components/app/page-header";
import {
  ActionCalendar,
  type CalendarActivityLog,
  type CalendarEvent,
  type CalendarMilestone,
  type CalendarProfile,
} from "@/components/calendar/action-calendar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

type RelatedRow<T> = T | T[] | null;

type ProfileRow = {
  id: string;
  role: "principal" | "coordinator" | "teacher";
  school_id: string | null;
};

type EventRow = {
  id: string;
  school_id: string;
  event_name: string;
  description: string | null;
  event_date: string;
  intensity: "low" | "medium" | "high" | null;
  owner_id: string | null;
  status: string | null;
  completion_percentage: number | null;
  owner?: RelatedRow<{ full_name: string | null }>;
};

type MilestoneRow = {
  id: string;
  school_id: string;
  event_id: string | null;
  title: string;
  description: string | null;
  owner_id: string | null;
  due_date: string | null;
  status: string | null;
  delay_reason: string | null;
  proof_url: string | null;
  owner?: RelatedRow<{ full_name: string | null }>;
};

type ActivityLogRow = {
  id: string;
  entity_type: string | null;
  entity_id: string | null;
  action: string | null;
  created_at: string;
  profiles?: RelatedRow<{ full_name: string | null }>;
};

export default async function CalendarPage() {
  if (!isSupabaseConfigured()) {
    return (
      <>
        <PageHeader
          title="School Calendar"
          description="Connect Supabase to manage school events and action milestones."
        />
        <Card>
          <CardHeader title="Supabase setup needed" description="Live calendar data is not available yet." />
          <CardContent className="text-sm text-muted-foreground">
            Add Supabase environment variables and sign in to use this module.
          </CardContent>
        </Card>
      </>
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role, school_id")
    .eq("id", user.id)
    .maybeSingle<ProfileRow>();

  if (!profile?.school_id) {
    return (
      <>
        <PageHeader
          title="School Calendar"
          description="Your action calendar will appear after your profile is configured."
        />
        <Card>
          <CardHeader title="Profile setup needed" description="No school is linked to this account yet." />
          <CardContent className="text-sm text-muted-foreground">
            Please contact the institution admin to complete your EduCommand profile.
          </CardContent>
        </Card>
      </>
    );
  }

  const isLeader = profile.role === "principal" || profile.role === "coordinator";

  const [{ data: profilesData }, { data: eventsData }, { data: milestonesData }, { data: activityRows }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, role")
      .eq("school_id", profile.school_id)
      .eq("is_active", true)
      .order("full_name", { ascending: true }),
    supabase
      .from("events")
      .select(
        "id, school_id, event_name, description, event_date, intensity, owner_id, status, completion_percentage, owner:profiles!events_owner_id_fkey(full_name)",
      )
      .eq("school_id", profile.school_id)
      .order("event_date", { ascending: true }),
    supabase
      .from("event_milestones")
      .select(
        "id, school_id, event_id, title, description, owner_id, due_date, status, delay_reason, proof_url, owner:profiles!event_milestones_owner_id_fkey(full_name)",
      )
      .eq("school_id", profile.school_id)
      .order("due_date", { ascending: true }),
    supabase
      .from("activity_logs")
      .select("id, entity_type, entity_id, action, created_at, profiles(full_name)")
      .eq("school_id", profile.school_id)
      .in("entity_type", ["event", "event_milestone"])
      .order("created_at", { ascending: false })
      .limit(100),
  ]);

  const profiles = (profilesData ?? []) as CalendarProfile[];
  const events = ((eventsData ?? []) as unknown as EventRow[]).map(toCalendarEvent);
  const allMilestones = ((milestonesData ?? []) as unknown as MilestoneRow[]).map(toCalendarMilestone);
  const activityLogs = ((activityRows ?? []) as unknown as ActivityLogRow[]).map(toActivityLog);
  const visibleMilestones = isLeader
    ? allMilestones
    : allMilestones.filter((milestone) => milestone.owner_id === profile.id);

  return (
    <>
      <PageHeader
        title="School Calendar"
        description={
          isLeader
            ? "Create events, assign owners, track readiness, and manage milestone action work."
            : "View event milestones assigned to you and update readiness evidence."
        }
      />
      <ActionCalendar
        currentUserId={profile.id}
        activityLogs={activityLogs}
        events={events}
        isLeader={isLeader}
        milestones={visibleMilestones}
        profiles={profiles}
        schoolId={profile.school_id}
      />
    </>
  );
}

function toActivityLog(row: ActivityLogRow): CalendarActivityLog {
  return {
    id: row.id,
    entity_type: row.entity_type,
    entity_id: row.entity_id,
    action: row.action,
    created_at: row.created_at,
    actorName: relatedOne(row.profiles)?.full_name ?? "Someone",
  };
}

function toCalendarEvent(row: EventRow): CalendarEvent {
  return {
    id: row.id,
    school_id: row.school_id,
    event_name: row.event_name,
    description: row.description,
    event_date: row.event_date,
    intensity: row.intensity ?? "medium",
    owner_id: row.owner_id,
    ownerName: relatedOne(row.owner)?.full_name ?? "Unassigned",
    status: row.status ?? "planned",
    completion_percentage: row.completion_percentage ?? 0,
  };
}

function toCalendarMilestone(row: MilestoneRow): CalendarMilestone {
  return {
    id: row.id,
    school_id: row.school_id,
    event_id: row.event_id,
    title: row.title,
    description: row.description,
    owner_id: row.owner_id,
    ownerName: relatedOne(row.owner)?.full_name ?? "Unassigned",
    due_date: row.due_date,
    status: row.status ?? "not_started",
    delay_reason: row.delay_reason,
    proof_url: row.proof_url,
  };
}

function relatedOne<T>(row: RelatedRow<T>) {
  if (Array.isArray(row)) return row[0] ?? null;
  return row ?? null;
}
