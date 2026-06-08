import { PageHeader } from "@/components/app/page-header";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  StaffStatusBoard,
  type StaffDailyStatus,
  type StaffMember,
} from "@/components/staff-status/staff-status-board";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

type ProfileRow = {
  id: string;
  role: "principal" | "coordinator" | "teacher" | "management";
  school_id: string | null;
};

function EmptyState({ message }: { message: string }) {
  return <p className="p-5 text-sm text-muted-foreground">{message}</p>;
}

export default async function StaffStatusPage() {
  if (!isSupabaseConfigured()) {
    return (
      <>
        <PageHeader
          title="Staff Status"
          description="Connect Supabase to use the daily staff command board."
        />
        <Card>
          <CardHeader title="Supabase setup needed" description="Live staff status data is not available yet." />
          <EmptyState message="Add Supabase environment variables and sign in to use this module." />
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
          title="Staff Status"
          description="Your staff status board will appear after your profile is configured."
        />
        <Card>
          <CardHeader title="Profile setup needed" description="No institution is linked to this account yet." />
          <EmptyState message="Please contact the institution admin to complete your EduCommand profile." />
        </Card>
      </>
    );
  }

  const isLeader = profile.role === "principal" || profile.role === "coordinator";
  const today = new Date().toISOString().slice(0, 10);

  const staffQuery = supabase
    .from("profiles")
    .select("id, full_name, role, department, designation")
    .eq("school_id", profile.school_id)
    .eq("is_active", true)
    .in("role", ["principal", "coordinator", "teacher"])
    .order("full_name", { ascending: true });

  const statusQuery = supabase
    .from("staff_daily_status")
    .select("id, staff_id, status_date, status, arrival_time, remarks, substitution_required")
    .eq("school_id", profile.school_id)
    .order("status_date", { ascending: false })
    .limit(500);

  if (!isLeader) {
    staffQuery.eq("id", profile.id);
    statusQuery.eq("staff_id", profile.id);
  }

  const [{ data: staffRows }, { data: statusRows }] = await Promise.all([
    staffQuery,
    statusQuery,
  ]);

  const staff = (staffRows ?? []) as StaffMember[];
  const statuses = (statusRows ?? []) as StaffDailyStatus[];

  return (
    <>
      <PageHeader
        title="Staff Status"
        description={
          isLeader
            ? "Daily staff command visibility for presence, duty and substitution needs."
            : "Your own daily staff status records."
        }
      />

      {staff.length > 0 ? (
        <StaffStatusBoard
          currentUserId={profile.id}
          isLeader={isLeader}
          schoolId={profile.school_id}
          staff={staff}
          statuses={statuses}
          today={today}
        />
      ) : (
        <Card>
          <CardHeader title="No staff found" description="Staff profiles are needed before this board can be used." />
          <CardContent>
            <p className="text-sm text-muted-foreground">Create active staff profiles in settings or Supabase.</p>
          </CardContent>
        </Card>
      )}
    </>
  );
}
