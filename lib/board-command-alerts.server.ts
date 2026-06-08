import { revalidatePath } from "next/cache";
import { generateBoardAlertsForMvp, type GeneratedBoardAlert } from "@/lib/board-command-scoring";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

type ProfileRow = {
  id: string;
  role: string | null;
  school_id: string | null;
};

type ExistingAlertRow = {
  alert_type: string | null;
  board_class: string | null;
  title: string | null;
};

export type BoardAlertRow = {
  id: string;
  alert_type: string | null;
  board_class: "class_10" | "class_12" | null;
  severity: "red" | "amber" | "green" | "blue" | null;
  title: string | null;
  message: string | null;
  status: string | null;
  created_at: string | null;
};

export type BoardAlertRefreshResult = {
  inserted: number;
  skipped: number;
  message: string;
};

export async function refreshBoardAlertsForCurrentUser({
  revalidate = false,
}: {
  revalidate?: boolean;
} = {}): Promise<BoardAlertRefreshResult> {
  if (!isSupabaseConfigured()) {
    return {
      inserted: 0,
      message: "Supabase is not configured yet.",
      skipped: 0,
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      inserted: 0,
      message: "Please log in to refresh Board Command alerts.",
      skipped: 0,
    };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role, school_id")
    .eq("id", user.id)
    .maybeSingle<ProfileRow>();

  if (!profile?.school_id) {
    return {
      inserted: 0,
      message: "Your EduCommand profile is not linked to an institution.",
      skipped: 0,
    };
  }

  if (profile.role !== "principal") {
    return {
      inserted: 0,
      message: "Only the principal can refresh stored Board Command alerts.",
      skipped: 0,
    };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { data: existingRows } = await supabase
    .from("board_alerts")
    .select("board_class, alert_type, title")
    .eq("school_id", profile.school_id)
    .gte("created_at", today.toISOString())
    .returns<ExistingAlertRow[]>();

  const existingKeys = new Set(
    (existingRows ?? []).map((alert) => alertKey(alert.board_class, alert.alert_type, alert.title)),
  );
  const generatedAlerts = generateBoardAlertsForMvp();
  const newAlerts = generatedAlerts.filter(
    (alert) => !existingKeys.has(alertKey(alert.board_class, alert.alert_type, alert.title)),
  );

  if (newAlerts.length > 0) {
    const rows = newAlerts.map((alert) => toInsertRow(profile.school_id!, alert));
    const { error } = await supabase.from("board_alerts").insert(rows);

    if (error) {
      return {
        inserted: 0,
        message: error.message,
        skipped: generatedAlerts.length,
      };
    }
  }

  if (revalidate) {
    revalidatePath("/board-command");
    revalidatePath("/board-command/class-10");
    revalidatePath("/board-command/class-12");
  }

  return {
    inserted: newAlerts.length,
    message:
      newAlerts.length > 0
        ? `${newAlerts.length} Board Command alerts refreshed.`
        : "Board Command alerts are already up to date for today.",
    skipped: generatedAlerts.length - newAlerts.length,
  };
}

export async function getBoardAlertsForCurrentUser(limit = 8) {
  if (!isSupabaseConfigured()) return [] as BoardAlertRow[];

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [] as BoardAlertRow[];

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role, school_id")
    .eq("id", user.id)
    .maybeSingle<ProfileRow>();

  if (!profile?.school_id || profile.role === "teacher") return [] as BoardAlertRow[];

  const { data } = await supabase
    .from("board_alerts")
    .select("id, board_class, alert_type, severity, title, message, status, created_at")
    .eq("school_id", profile.school_id)
    .order("created_at", { ascending: false })
    .limit(limit)
    .returns<BoardAlertRow[]>();

  return data ?? [];
}

function toInsertRow(schoolId: string, alert: GeneratedBoardAlert) {
  return {
    ...alert,
    school_id: schoolId,
  };
}

function alertKey(boardClass: string | null, alertType: string | null, title: string | null) {
  return `${boardClass ?? ""}:${alertType ?? ""}:${title ?? ""}`.toLowerCase();
}
