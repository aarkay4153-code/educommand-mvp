"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { DataTable } from "@/components/ui/table";

export type SyllabusReviewUpdate = {
  id: string;
  teacher_id: string | null;
  class_section_id: string | null;
  subject_id: string | null;
  teacher_name: string;
  class_label: string;
  subject_name: string;
  week_start_date: string | null;
  week_end_date: string | null;
  planned_portion: string | null;
  completed_portion: string | null;
  completion_percentage: number;
  status: string;
  delay_reason: string | null;
  next_week_target: string | null;
  proof_url: string | null;
  submitted_at: string | null;
};

export type MissingTeacher = {
  teacher_id: string;
  teacher_name: string;
};

type AverageRow = {
  label: string;
  average: number;
  count: number;
};

const statusOptions = ["on_track", "behind", "completed", "not_started"];

export function SyllabusReview({
  updates,
  missingTeachers,
}: {
  updates: SyllabusReviewUpdate[];
  missingTeachers: MissingTeacher[];
}) {
  const [classFilter, setClassFilter] = useState("all");
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [teacherFilter, setTeacherFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [weekFilter, setWeekFilter] = useState("all");

  const classOptions = uniqueOptions(updates.map((update) => update.class_label));
  const subjectOptions = uniqueOptions(updates.map((update) => update.subject_name));
  const teacherOptions = uniqueOptions(updates.map((update) => update.teacher_name));
  const weekOptions = uniqueOptions(
    updates.map((update) => update.week_start_date).filter(Boolean) as string[],
  );

  const filteredUpdates = useMemo(
    () =>
      updates.filter((update) => {
        return (
          (classFilter === "all" || update.class_label === classFilter) &&
          (subjectFilter === "all" || update.subject_name === subjectFilter) &&
          (teacherFilter === "all" || update.teacher_name === teacherFilter) &&
          (statusFilter === "all" || update.status === statusFilter) &&
          (weekFilter === "all" || update.week_start_date === weekFilter)
        );
      }),
    [classFilter, subjectFilter, statusFilter, teacherFilter, updates, weekFilter],
  );

  const averagesByClass = buildAverages(updates, (update) => update.class_label);
  const averagesBySubject = buildAverages(updates, (update) => update.subject_name);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader title="Syllabus Review" description="Filter weekly submissions by class, subject, teacher, status, and week." />
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            <FilterSelect label="Class" onChange={setClassFilter} options={classOptions} value={classFilter} />
            <FilterSelect label="Subject" onChange={setSubjectFilter} options={subjectOptions} value={subjectFilter} />
            <FilterSelect label="Teacher" onChange={setTeacherFilter} options={teacherOptions} value={teacherFilter} />
            <FilterSelect label="Status" onChange={setStatusFilter} options={statusOptions} value={statusFilter} />
            <FilterSelect label="Week" onChange={setWeekFilter} options={weekOptions} value={weekFilter} />
          </div>
        </CardContent>
        <CardContent className="p-0">
          {filteredUpdates.length > 0 ? (
            <DataTable
              headers={["Teacher", "Class", "Subject", "Week", "Progress", "Status", "Proof"]}
              rows={filteredUpdates.map((update) => [
                update.teacher_name,
                update.class_label,
                update.subject_name,
                formatWeek(update.week_start_date, update.week_end_date),
                <Badge key={`${update.id}-progress`} tone={progressTone(update.completion_percentage)}>
                  {update.completion_percentage}%
                </Badge>,
                <Badge key={update.id} tone={statusTone(update.status)}>
                  {labelize(update.status)}
                </Badge>,
                proofCell(update.proof_url),
              ])}
            />
          ) : (
            <EmptyState message="No syllabus updates match the selected filters." />
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-3">
        <AverageCard title="Average Completion by Class" rows={averagesByClass} />
        <AverageCard title="Average Completion by Subject" rows={averagesBySubject} />
        <Card>
          <CardHeader title="Missing This Week" description="Assigned teachers without a current-week update." />
          <CardContent>
            {missingTeachers.length > 0 ? (
              <div className="space-y-2">
                {missingTeachers.map((teacher) => (
                  <div
                    className="flex items-center justify-between gap-3 rounded-md border bg-background p-3 text-sm"
                    key={teacher.teacher_id}
                  >
                    <span className="font-medium">{teacher.teacher_name}</span>
                    <Badge tone="warning">Pending</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">All assigned teachers have submitted this week.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function FilterSelect({
  label,
  onChange,
  options,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  options: string[];
  value: string;
}) {
  return (
    <label className="block text-sm font-medium">
      {label}
      <select
        className="mt-2 h-10 w-full rounded-md border bg-card px-3 text-sm"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        <option value="all">All</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {labelize(option)}
          </option>
        ))}
      </select>
    </label>
  );
}

function AverageCard({ rows, title }: { rows: AverageRow[]; title: string }) {
  return (
    <Card>
      <CardHeader title={title} description="Based on visible school updates." />
      <CardContent>
        {rows.length > 0 ? (
          <div className="space-y-3">
            {rows.map((row) => (
              <div key={row.label} className="rounded-md border bg-background p-3">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="font-medium">{row.label}</span>
                  <Badge tone={progressTone(row.average)}>{Math.round(row.average)}%</Badge>
                </div>
                <div className="mt-2 h-2 rounded-full bg-muted">
                  <div
                    className="h-2 rounded-full bg-primary"
                    style={{ width: `${Math.min(100, Math.max(0, row.average))}%` }}
                  />
                </div>
                <p className="mt-2 text-xs text-muted-foreground">{row.count} update(s)</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No updates available yet.</p>
        )}
      </CardContent>
    </Card>
  );
}

function EmptyState({ message }: { message: string }) {
  return <div className="p-5 text-sm text-muted-foreground">{message}</div>;
}

function uniqueOptions(values: string[]) {
  return Array.from(new Set(values.filter(Boolean))).sort();
}

function buildAverages(
  updates: SyllabusReviewUpdate[],
  getLabel: (update: SyllabusReviewUpdate) => string,
) {
  const groups = new Map<string, { sum: number; count: number }>();

  updates.forEach((update) => {
    const label = getLabel(update);
    const current = groups.get(label) ?? { sum: 0, count: 0 };
    groups.set(label, {
      sum: current.sum + update.completion_percentage,
      count: current.count + 1,
    });
  });

  return Array.from(groups.entries())
    .map(([label, group]) => ({
      label,
      average: group.sum / group.count,
      count: group.count,
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

function formatWeek(start: string | null, end: string | null) {
  if (!start && !end) return "Not set";
  if (!end) return formatDate(start);
  return `${formatDate(start)} - ${formatDate(end)}`;
}

function formatDate(date: string | null) {
  if (!date) return "Not set";
  return new Intl.DateTimeFormat("en", { day: "2-digit", month: "short" }).format(new Date(date));
}

function labelize(value: string) {
  return value.replaceAll("_", " ");
}

function statusTone(status: string) {
  if (status === "completed" || status === "on_track") return "success" as const;
  if (status === "behind" || status === "not_started") return "danger" as const;
  return "neutral" as const;
}

function progressTone(value: number) {
  if (value >= 80) return "success" as const;
  if (value >= 50) return "warning" as const;
  return "danger" as const;
}

function proofCell(path: string | null) {
  if (!path) return "Pending";
  if (!path.startsWith("http")) return "Uploaded";
  return (
    <a className="text-primary underline-offset-4 hover:underline" href={path} rel="noreferrer" target="_blank">
      View
    </a>
  );
}
