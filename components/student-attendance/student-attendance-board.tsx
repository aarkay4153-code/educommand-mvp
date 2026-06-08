"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CopyMessageButton } from "@/components/workflow/copy-message-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { DataTable } from "@/components/ui/table";
import { createClient } from "@/lib/supabase/client";
import type { StatusTone } from "@/lib/types";

export type AttendanceStatus = "present" | "absent" | "late" | "leave";

export type AttendanceClass = {
  id: string;
  label: string;
};

export type AttendanceStudent = {
  id: string;
  full_name: string | null;
  admission_number: string | null;
  class_section_id: string | null;
  parent_name: string | null;
  parent_phone: string | null;
  className: string;
};

export type AttendanceRow = {
  id: string;
  student_id: string;
  class_section_id: string | null;
  attendance_date: string;
  status: AttendanceStatus;
  remarks: string | null;
  studentName: string;
  className: string;
};

const statusOptions: { label: string; value: AttendanceStatus; tone: StatusTone }[] = [
  { label: "Present", value: "present", tone: "success" },
  { label: "Absent", value: "absent", tone: "danger" },
  { label: "Late", value: "late", tone: "warning" },
  { label: "Leave", value: "leave", tone: "info" },
];

const parentAlertMessage =
  "Your ward was absent today. Kindly contact the class teacher if required.";

export function StudentAttendanceBoard({
  classes,
  currentUserId,
  schoolId,
  students,
  attendance,
  today,
}: {
  classes: AttendanceClass[];
  currentUserId: string;
  schoolId: string;
  students: AttendanceStudent[];
  attendance: AttendanceRow[];
  today: string;
}) {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState(today);
  const [selectedClassId, setSelectedClassId] = useState(classes[0]?.id ?? "");
  const [drafts, setDrafts] = useState<Record<string, AttendanceDraft>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const attendanceForDate = useMemo(() => {
    const map = new Map<string, AttendanceRow>();
    attendance
      .filter((row) => row.attendance_date === selectedDate)
      .forEach((row) => map.set(row.student_id, row));
    return map;
  }, [attendance, selectedDate]);

  const selectedClassStudents = students.filter((student) => student.class_section_id === selectedClassId);
  const summary = buildTodaySummary(students, attendanceForDate);
  const classPercentages = buildClassPercentages(classes, students, attendanceForDate);
  const chronicAbsentees = buildChronicAbsentees(students, attendance);
  const historyRows = attendance
    .filter((row) => !selectedClassId || row.class_section_id === selectedClassId)
    .slice(0, 30);

  function updateDraft(studentId: string, patch: Partial<AttendanceDraft>) {
    const current = getDraft(drafts, studentId, attendanceForDate.get(studentId));
    setDrafts((existing) => ({
      ...existing,
      [studentId]: { ...current, ...patch },
    }));
  }

  function markClassAttendance() {
    setMessage(null);
    const rows = selectedClassStudents.map((student) => {
      const draft = getDraft(drafts, student.id, attendanceForDate.get(student.id));
      return {
        attendance_date: selectedDate,
        class_section_id: student.class_section_id,
        marked_by: currentUserId,
        remarks: draft.remarks || null,
        school_id: schoolId,
        status: draft.status,
        student_id: student.id,
      };
    });

    startTransition(async () => {
      const { error } = await createClient().from("student_daily_attendance").upsert(rows, {
        onConflict: "school_id,student_id,attendance_date",
      });

      if (error) {
        setMessage(error.message);
        return;
      }

      setMessage("Attendance saved for this class.");
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader
          title="Attendance Command Summary"
          description="Command-level visibility for today. This is not ERP attendance."
        />
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <SummaryTile label="Total students" value={String(summary.totalStudents)} tone="neutral" />
            <SummaryTile label="Present today" value={String(summary.present)} tone="success" />
            <SummaryTile label="Absent today" value={String(summary.absent)} tone="danger" />
            <SummaryTile label="Attendance %" value={`${summary.percentage}%`} tone={summary.percentage < 85 ? "warning" : "success"} />
            <SummaryTile label="Low attendance classes" value={String(summary.lowAttendanceClasses)} tone="warning" />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
        <Card>
          <CardHeader title="Class-wise Attendance Percentage" description="Quick class visibility for the selected date." />
          <CardContent>
            <DataTable
              emptyMessage="No classes available yet."
              headers={["Class", "Students", "Present", "Absent", "Attendance"]}
              rows={classPercentages.map((row) => [
                row.className,
                String(row.total),
                String(row.present),
                String(row.absent),
                <Badge key={row.className} tone={row.percentage < 85 ? "warning" : "success"}>
                  {row.percentage}%
                </Badge>,
              ])}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader title="Chronic Absentee Alert" description="Students absent 3 or more days in the last 7 recorded school days." />
          <CardContent className="space-y-4">
            {chronicAbsentees.length > 0 ? (
              <DataTable
                headers={["Student", "Class", "Absent days"]}
                rows={chronicAbsentees.map((row) => [row.studentName, row.className, String(row.absentDays)])}
              />
            ) : (
              <p className="rounded-md border bg-background p-5 text-sm text-muted-foreground">
                No chronic absentee alerts from recent attendance records.
              </p>
            )}
            <div className="rounded-md border bg-background p-3">
              <p className="text-sm font-medium">Parent alert message</p>
              <p className="mt-2 text-sm text-muted-foreground">{parentAlertMessage}</p>
              <div className="mt-3">
                <CopyMessageButton message={parentAlertMessage} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader title="Mark Class Attendance" description="Select a class and mark attendance quickly." />
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="Date">
              <input
                className="h-10 rounded-md border bg-background px-3 text-sm"
                onChange={(event) => setSelectedDate(event.target.value)}
                type="date"
                value={selectedDate}
              />
            </Field>
            <Field label="Class">
              <select
                className="h-10 rounded-md border bg-background px-3 text-sm"
                onChange={(event) => setSelectedClassId(event.target.value)}
                value={selectedClassId}
              >
                {classes.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          {message ? <p className="rounded-md border bg-background p-3 text-sm text-muted-foreground">{message}</p> : null}

          {selectedClassStudents.length > 0 ? (
            <div className="space-y-3">
              {selectedClassStudents.map((student) => {
                const draft = getDraft(drafts, student.id, attendanceForDate.get(student.id));
                return (
                  <div className="rounded-md border bg-background p-4" key={student.id}>
                    <div className="grid gap-4 lg:grid-cols-[1fr_180px_1fr] lg:items-end">
                      <div>
                        <p className="font-medium">{student.full_name}</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Admission: {student.admission_number || "Not set"} | Parent: {student.parent_name || "Not set"}
                        </p>
                        <div className="mt-2">
                          <Badge tone={toneForStatus(draft.status)}>{labelForStatus(draft.status)}</Badge>
                        </div>
                      </div>
                      <Field label="Status">
                        <select
                          className="h-10 rounded-md border bg-card px-3 text-sm"
                          onChange={(event) =>
                            updateDraft(student.id, { status: event.target.value as AttendanceStatus })
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
                      <Field label="Remarks">
                        <input
                          className="h-10 rounded-md border bg-card px-3 text-sm"
                          onChange={(event) => updateDraft(student.id, { remarks: event.target.value })}
                          placeholder="Optional"
                          value={draft.remarks}
                        />
                      </Field>
                    </div>
                  </div>
                );
              })}
              <Button disabled={isPending} onClick={markClassAttendance} type="button">
                Save Class Attendance
              </Button>
            </div>
          ) : (
            <p className="rounded-md border bg-background p-5 text-sm text-muted-foreground">
              No students found for this class.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader title="Student-wise Attendance History" description="Recent attendance records for the selected class." />
        <CardContent>
          <DataTable
            emptyMessage="No attendance history found yet."
            headers={["Date", "Student", "Class", "Status", "Remarks"]}
            rows={historyRows.map((row) => [
              row.attendance_date,
              row.studentName,
              row.className,
              <Badge key={row.id} tone={toneForStatus(row.status)}>
                {labelForStatus(row.status)}
              </Badge>,
              row.remarks || "No remarks",
            ])}
          />
        </CardContent>
      </Card>
    </div>
  );
}

type AttendanceDraft = {
  remarks: string;
  status: AttendanceStatus;
};

function getDraft(
  drafts: Record<string, AttendanceDraft>,
  studentId: string,
  saved?: AttendanceRow,
): AttendanceDraft {
  return drafts[studentId] ?? { remarks: saved?.remarks ?? "", status: saved?.status ?? "present" };
}

function buildTodaySummary(students: AttendanceStudent[], attendanceForDate: Map<string, AttendanceRow>) {
  const rows = Array.from(attendanceForDate.values());
  const present = rows.filter((row) => row.status === "present" || row.status === "late").length;
  const absent = rows.filter((row) => row.status === "absent").length;
  const classRows = buildClassPercentages(
    uniqueClasses(students),
    students,
    attendanceForDate,
  );
  const totalStudents = students.length;
  const percentage = totalStudents ? Math.round((present / totalStudents) * 100) : 0;

  return {
    absent,
    lowAttendanceClasses: classRows.filter((row) => row.total > 0 && row.percentage < 85).length,
    percentage,
    present,
    totalStudents,
  };
}

function buildClassPercentages(
  classes: AttendanceClass[],
  students: AttendanceStudent[],
  attendanceForDate: Map<string, AttendanceRow>,
) {
  return classes.map((classItem) => {
    const classStudents = students.filter((student) => student.class_section_id === classItem.id);
    const rows = classStudents.map((student) => attendanceForDate.get(student.id)).filter(Boolean) as AttendanceRow[];
    const present = rows.filter((row) => row.status === "present" || row.status === "late").length;
    const absent = rows.filter((row) => row.status === "absent").length;
    const percentage = classStudents.length ? Math.round((present / classStudents.length) * 100) : 0;
    return {
      absent,
      className: classItem.label,
      percentage,
      present,
      total: classStudents.length,
    };
  });
}

function buildChronicAbsentees(students: AttendanceStudent[], attendance: AttendanceRow[]) {
  const recentDates = Array.from(new Set(attendance.map((row) => row.attendance_date)))
    .sort()
    .slice(-7);
  const recentDateSet = new Set(recentDates);

  return students
    .map((student) => {
      const absentDays = attendance.filter(
        (row) => row.student_id === student.id && row.status === "absent" && recentDateSet.has(row.attendance_date),
      ).length;
      return {
        absentDays,
        className: student.className,
        studentName: student.full_name || "Student",
      };
    })
    .filter((row) => row.absentDays >= 3)
    .sort((a, b) => b.absentDays - a.absentDays);
}

function uniqueClasses(students: AttendanceStudent[]): AttendanceClass[] {
  const map = new Map<string, string>();
  students.forEach((student) => {
    if (student.class_section_id) map.set(student.class_section_id, student.className);
  });
  return Array.from(map.entries()).map(([id, label]) => ({ id, label }));
}

function Field({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <label className="grid gap-1 text-sm">
      <span className="font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function SummaryTile({ label, tone, value }: { label: string; tone: StatusTone; value: string }) {
  return (
    <div className="rounded-md border bg-background p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-2 text-3xl font-semibold">{value}</p>
      <Badge className="mt-2" tone={tone}>
        {label}
      </Badge>
    </div>
  );
}

function labelForStatus(status: AttendanceStatus) {
  return statusOptions.find((option) => option.value === status)?.label ?? status;
}

function toneForStatus(status: AttendanceStatus): StatusTone {
  return statusOptions.find((option) => option.value === status)?.tone ?? "neutral";
}
