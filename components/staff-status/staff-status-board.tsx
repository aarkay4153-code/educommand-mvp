"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import type { StatusTone } from "@/lib/types";

export type StaffStatusValue =
  | "present"
  | "absent"
  | "leave"
  | "late"
  | "half_day"
  | "on_duty"
  | "training"
  | "exam_duty";

export type StaffMember = {
  id: string;
  full_name: string;
  role: string | null;
  department: string | null;
  designation: string | null;
};

export type StaffDailyStatus = {
  id: string;
  staff_id: string;
  status_date: string;
  status: StaffStatusValue;
  arrival_time: string | null;
  remarks: string | null;
  substitution_required: boolean | null;
};

const statusOptions: { label: string; value: StaffStatusValue; tone: StatusTone }[] = [
  { label: "Present", value: "present", tone: "success" },
  { label: "Absent", value: "absent", tone: "danger" },
  { label: "On Leave", value: "leave", tone: "warning" },
  { label: "Late", value: "late", tone: "warning" },
  { label: "Half Day", value: "half_day", tone: "warning" },
  { label: "On Duty", value: "on_duty", tone: "info" },
  { label: "Training/FDP", value: "training", tone: "info" },
  { label: "Exam Duty", value: "exam_duty", tone: "info" },
];

export function StaffStatusBoard({
  currentUserId,
  isLeader,
  schoolId,
  staff,
  statuses,
  today,
}: {
  currentUserId: string;
  isLeader: boolean;
  schoolId: string;
  staff: StaffMember[];
  statuses: StaffDailyStatus[];
  today: string;
}) {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState(today);
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [rowDrafts, setRowDrafts] = useState<Record<string, RowDraft>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const statusesByStaffForDate = useMemo(() => {
    const map = new Map<string, StaffDailyStatus>();
    statuses
      .filter((status) => status.status_date === selectedDate)
      .forEach((status) => map.set(status.staff_id, status));
    return map;
  }, [selectedDate, statuses]);

  const departments = useMemo(
    () => Array.from(new Set(staff.map((member) => member.department || "Unassigned"))).sort(),
    [staff],
  );

  const filteredStaff = staff.filter((member) => {
    const rowStatus = getDraft(rowDrafts, member.id, statusesByStaffForDate.get(member.id));
    const department = member.department || "Unassigned";
    const departmentMatches = departmentFilter === "all" || department === departmentFilter;
    const statusMatches = statusFilter === "all" || rowStatus.status === statusFilter;
    return departmentMatches && statusMatches;
  });

  const summary = buildSummary(staff, statusesByStaffForDate);

  function updateDraft(staffId: string, patch: Partial<RowDraft>) {
    const current = getDraft(rowDrafts, staffId, statusesByStaffForDate.get(staffId));
    setRowDrafts((drafts) => ({
      ...drafts,
      [staffId]: {
        ...current,
        ...patch,
      },
    }));
  }

  function saveStatus(staffId: string) {
    const draft = getDraft(rowDrafts, staffId, statusesByStaffForDate.get(staffId));
    setMessage(null);
    startTransition(async () => {
      const { error } = await createClient().from("staff_daily_status").upsert(
        {
          arrival_time: draft.arrival_time || null,
          recorded_by: currentUserId,
          remarks: draft.remarks || null,
          school_id: schoolId,
          staff_id: staffId,
          status: draft.status,
          status_date: selectedDate,
          substitution_required: draft.substitution_required,
        },
        { onConflict: "school_id,staff_id,status_date" },
      );

      if (error) {
        setMessage(error.message);
        return;
      }

      setMessage("Staff status saved.");
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader
          title="Today's Staff Command Board"
          description="Daily command visibility for staff presence, duty and substitution needs. This is not payroll or biometric attendance."
        />
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-7">
            <SummaryTile label="Total staff" value={String(summary.totalStaff)} tone="neutral" />
            <SummaryTile label="Present today" value={String(summary.present)} tone="success" />
            <SummaryTile label="Absent today" value={String(summary.absent)} tone="danger" />
            <SummaryTile label="On leave" value={String(summary.leave)} tone="warning" />
            <SummaryTile label="Late" value={String(summary.late)} tone="warning" />
            <SummaryTile label="On duty" value={String(summary.onDuty)} tone="info" />
            <SummaryTile label="Substitution required" value={String(summary.substitutionRequired)} tone="danger" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader title="Filters" description="Choose a date, department or status to focus the board." />
        <CardContent>
          <div className="grid gap-3 md:grid-cols-3">
            <Field label="Date">
              <input
                className="h-10 rounded-md border bg-background px-3 text-sm"
                onChange={(event) => setSelectedDate(event.target.value)}
                type="date"
                value={selectedDate}
              />
            </Field>
            <Field label="Department">
              <select
                className="h-10 rounded-md border bg-background px-3 text-sm"
                onChange={(event) => setDepartmentFilter(event.target.value)}
                value={departmentFilter}
              >
                <option value="all">All departments</option>
                {departments.map((department) => (
                  <option key={department} value={department}>
                    {department}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Status">
              <select
                className="h-10 rounded-md border bg-background px-3 text-sm"
                onChange={(event) => setStatusFilter(event.target.value)}
                value={statusFilter}
              >
                <option value="all">All statuses</option>
                {statusOptions.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </Field>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader
          title={isLeader ? "Mark Daily Staff Status" : "My Daily Staff Status"}
          description={isLeader ? "Mark staff status quickly for the selected date." : "Your recorded daily status history."}
        />
        <CardContent className="space-y-3">
          {message ? <p className="rounded-md border bg-background p-3 text-sm text-muted-foreground">{message}</p> : null}

          {filteredStaff.length > 0 ? (
            <div className="space-y-3">
              {filteredStaff.map((member) => {
                const savedStatus = statusesByStaffForDate.get(member.id);
                const draft = getDraft(rowDrafts, member.id, savedStatus);
                const tone = toneForStatus(draft.status);

                return (
                  <div className="rounded-md border bg-background p-4" key={member.id}>
                    <div className="grid gap-4 xl:grid-cols-[1.1fr_180px_150px_1fr_160px_120px] xl:items-end">
                      <div>
                        <p className="font-medium">{member.full_name}</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {[member.designation, member.department, labelize(member.role)].filter(Boolean).join(" - ")}
                        </p>
                        <div className="mt-2">
                          <Badge tone={tone}>{labelForStatus(draft.status)}</Badge>
                          {draft.substitution_required ? (
                            <Badge className="ml-2" tone="danger">
                              Substitution Required
                            </Badge>
                          ) : null}
                        </div>
                      </div>

                      {isLeader ? (
                        <>
                          <Field label="Status">
                            <select
                              className="h-10 rounded-md border bg-card px-3 text-sm"
                              onChange={(event) =>
                                updateDraft(member.id, { status: event.target.value as StaffStatusValue })
                              }
                              value={draft.status}
                            >
                              {statusOptions.map((status) => (
                                <option key={status.value} value={status.value}>
                                  {status.label}
                                </option>
                              ))}
                            </select>
                          </Field>
                          <Field label="Arrival">
                            <input
                              className="h-10 rounded-md border bg-card px-3 text-sm"
                              onChange={(event) => updateDraft(member.id, { arrival_time: event.target.value })}
                              type="time"
                              value={draft.arrival_time}
                            />
                          </Field>
                          <Field label="Remarks">
                            <input
                              className="h-10 rounded-md border bg-card px-3 text-sm"
                              onChange={(event) => updateDraft(member.id, { remarks: event.target.value })}
                              placeholder="Optional"
                              value={draft.remarks}
                            />
                          </Field>
                          <label className="flex h-10 items-center gap-2 text-sm">
                            <input
                              checked={draft.substitution_required}
                              onChange={(event) =>
                                updateDraft(member.id, { substitution_required: event.target.checked })
                              }
                              type="checkbox"
                            />
                            Substitution
                          </label>
                          <Button disabled={isPending} onClick={() => saveStatus(member.id)} type="button">
                            Save
                          </Button>
                        </>
                      ) : (
                        <div className="xl:col-span-5">
                          <p className="text-sm text-muted-foreground">
                            {savedStatus?.remarks || "No remarks recorded for this date."}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="rounded-md border bg-background p-5 text-sm text-muted-foreground">
              No staff status records match these filters.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

type RowDraft = {
  arrival_time: string;
  remarks: string;
  status: StaffStatusValue;
  substitution_required: boolean;
};

function getDraft(
  drafts: Record<string, RowDraft>,
  staffId: string,
  savedStatus?: StaffDailyStatus,
): RowDraft {
  return (
    drafts[staffId] ?? {
      arrival_time: savedStatus?.arrival_time?.slice(0, 5) ?? "",
      remarks: savedStatus?.remarks ?? "",
      status: savedStatus?.status ?? "present",
      substitution_required: savedStatus?.substitution_required ?? false,
    }
  );
}

function buildSummary(staff: StaffMember[], statusesByStaffForDate: Map<string, StaffDailyStatus>) {
  const rows = Array.from(statusesByStaffForDate.values());
  return {
    totalStaff: staff.length,
    present: rows.filter((row) => row.status === "present").length,
    absent: rows.filter((row) => row.status === "absent").length,
    leave: rows.filter((row) => row.status === "leave").length,
    late: rows.filter((row) => row.status === "late").length,
    onDuty: rows.filter((row) => row.status === "on_duty" || row.status === "exam_duty").length,
    substitutionRequired: rows.filter((row) => row.substitution_required).length,
  };
}

function SummaryTile({ label, tone, value }: { label: string; tone: StatusTone; value: string }) {
  return (
    <div className="rounded-md border bg-background p-3">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs text-muted-foreground">{label}</p>
        <Badge tone={tone}>{value}</Badge>
      </div>
      <p className="mt-3 text-3xl font-semibold">{value}</p>
    </div>
  );
}

function Field({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <label className="grid gap-1 text-sm">
      <span className="font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function labelForStatus(status: StaffStatusValue) {
  return statusOptions.find((option) => option.value === status)?.label ?? labelize(status);
}

function toneForStatus(status: StaffStatusValue): StatusTone {
  return statusOptions.find((option) => option.value === status)?.tone ?? "neutral";
}

function labelize(value: string | null | undefined) {
  return value ? value.replaceAll("_", " ") : "";
}
