"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { DataTable } from "@/components/ui/table";
import { createClient } from "@/lib/supabase/client";
import type { StatusTone } from "@/lib/types";

export type TimetableProfile = {
  id: string;
  full_name: string;
  role: string | null;
  department: string | null;
};

export type TimetableClass = {
  id: string;
  class_name: string;
  section: string | null;
};

export type TimetableSubject = {
  id: string;
  subject_name: string;
};

export type TimetablePeriod = {
  id: string;
  class_section_id: string | null;
  subject_id: string | null;
  teacher_id: string | null;
  day_of_week: string;
  period_number: number;
  start_time: string | null;
  end_time: string | null;
  room: string | null;
  className: string;
  subjectName: string;
  teacherName: string;
};

export type StaffStatusForSubstitution = {
  staff_id: string;
  status_date: string;
  status: string | null;
};

export type SubstitutionItem = {
  id: string;
  date: string;
  absent_teacher_id: string | null;
  original_period_id: string | null;
  substitute_teacher_id: string | null;
  class_section_id: string | null;
  subject_id: string | null;
  status: string | null;
  remarks: string | null;
  absentTeacherName: string;
  substituteTeacherName: string;
  className: string;
  subjectName: string;
  periodNumber: number | null;
};

const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
const unavailableStatuses = new Set(["absent", "leave", "on_duty", "training", "exam_duty"]);

export function TimetableWorkspace({
  classes,
  currentUserId,
  isLeader,
  periods,
  schoolId,
  staffStatuses,
  subjects,
  substitutions,
  teachers,
  today,
  todayDay,
}: {
  classes: TimetableClass[];
  currentUserId: string;
  isLeader: boolean;
  periods: TimetablePeriod[];
  schoolId: string;
  staffStatuses: StaffStatusForSubstitution[];
  subjects: TimetableSubject[];
  substitutions: SubstitutionItem[];
  teachers: TimetableProfile[];
  today: string;
  todayDay: string;
}) {
  const router = useRouter();
  const [selectedDay, setSelectedDay] = useState(todayDay);
  const [selectedDate, setSelectedDate] = useState(today);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const periodsForSelectedDay = periods
    .filter((period) => period.day_of_week === selectedDay)
    .sort((a, b) => a.period_number - b.period_number || a.className.localeCompare(b.className));
  const periodsForToday = periods.filter((period) => period.day_of_week === dayForDate(selectedDate));
  const unavailableTeacherIds = new Set(
    staffStatuses
      .filter((status) => status.status_date === selectedDate && unavailableStatuses.has(status.status ?? ""))
      .map((status) => status.staff_id),
  );
  const affectedPeriods = periodsForToday
    .filter((period) => period.teacher_id && unavailableTeacherIds.has(period.teacher_id))
    .sort((a, b) => a.period_number - b.period_number);
  const substitutionsForDate = substitutions.filter((substitution) => substitution.date === selectedDate);
  const assignedSubstitutions = substitutionsForDate.filter((substitution) => substitution.status === "assigned" || substitution.status === "acknowledged" || substitution.status === "completed");
  const pendingSubstitutions = substitutionsForDate.filter((substitution) => substitution.status === "suggested" || !substitution.substitute_teacher_id);

  function createPeriod(formData: FormData) {
    setMessage(null);
    startTransition(async () => {
      const { error } = await createClient().from("timetable_periods").insert({
        class_section_id: String(formData.get("class_section_id")),
        day_of_week: String(formData.get("day_of_week")),
        end_time: valueOrNull(formData.get("end_time")),
        period_number: Number(formData.get("period_number")),
        room: valueOrNull(formData.get("room")),
        school_id: schoolId,
        start_time: valueOrNull(formData.get("start_time")),
        subject_id: String(formData.get("subject_id")),
        teacher_id: String(formData.get("teacher_id")),
      });

      if (error) {
        setMessage(error.message);
        return;
      }

      setMessage("Timetable period added.");
      router.refresh();
    });
  }

  function assignSubstitution(period: TimetablePeriod, substituteTeacherId: string) {
    if (!period.teacher_id || !period.class_section_id || !period.subject_id || !substituteTeacherId) {
      setMessage("Choose a substitute teacher first.");
      return;
    }

    setMessage(null);
    startTransition(async () => {
      const { error } = await createClient().from("substitutions").insert({
        absent_teacher_id: period.teacher_id,
        class_section_id: period.class_section_id,
        created_by: currentUserId,
        date: selectedDate,
        original_period_id: period.id,
        remarks: `Period ${period.period_number} substitution`,
        school_id: schoolId,
        status: "assigned",
        subject_id: period.subject_id,
        substitute_teacher_id: substituteTeacherId,
      });

      if (error) {
        setMessage(error.message);
        return;
      }

      setMessage("Substitution assigned.");
      router.refresh();
    });
  }

  function updateSubstitutionStatus(id: string, status: string) {
    setMessage(null);
    startTransition(async () => {
      const { error } = await createClient().from("substitutions").update({ status }).eq("id", id);

      if (error) {
        setMessage(error.message);
        return;
      }

      setMessage("Substitution updated.");
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader
          title="Today’s Substitution Command"
          description="Affected classes and substitution status for the selected date."
        />
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-3">
            <SummaryTile label="Classes affected today" value={String(affectedPeriods.length)} tone="warning" />
            <SummaryTile label="Substitutions assigned" value={String(assignedSubstitutions.length)} tone="success" />
            <SummaryTile label="Substitutions pending" value={String(pendingSubstitutions.length)} tone="danger" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader title="Day-wise Timetable" description="Daily class periods. This is separate from the events calendar." />
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {days.map((day) => (
              <Button
                key={day}
                onClick={() => setSelectedDay(day)}
                type="button"
                variant={selectedDay === day ? "primary" : "secondary"}
              >
                {labelize(day)}
              </Button>
            ))}
          </div>

          <DataTable
            emptyMessage="No timetable periods added for this day yet."
            headers={["Period", "Time", "Class", "Subject", "Teacher", "Room"]}
            rows={periodsForSelectedDay.map((period) => [
              String(period.period_number),
              timeRange(period.start_time, period.end_time),
              period.className,
              period.subjectName,
              period.teacherName,
              period.room || "Not set",
            ])}
          />
        </CardContent>
      </Card>

      {isLeader ? (
        <Card>
          <CardHeader title="Create Weekly Timetable Period" description="Add one class period at a time." />
          <CardContent>
            <form action={createPeriod} className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <SelectField label="Day" name="day_of_week" options={days.map((day) => [day, labelize(day)])} />
              <InputField label="Period number" min="1" name="period_number" type="number" />
              <SelectField label="Class" name="class_section_id" options={classes.map((item) => [item.id, classLabel(item)])} />
              <SelectField label="Subject" name="subject_id" options={subjects.map((item) => [item.id, item.subject_name])} />
              <SelectField label="Teacher" name="teacher_id" options={teachers.map((item) => [item.id, item.full_name])} />
              <InputField label="Start time" name="start_time" type="time" />
              <InputField label="End time" name="end_time" type="time" />
              <InputField label="Room" name="room" type="text" />
              <div className="md:col-span-2 xl:col-span-4">
                <Button disabled={isPending} type="submit">
                  Add Period
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader
          title={isLeader ? "Affected Periods and Substitution Suggestions" : "My Substitution Duties"}
          description={
            isLeader
              ? "Teachers suggested here are free during the same period."
              : "Substitution duties assigned to you."
          }
        />
        <CardContent className="space-y-4">
          {message ? <p className="rounded-md border bg-background p-3 text-sm text-muted-foreground">{message}</p> : null}
          {isLeader ? (
            <div className="space-y-3">
              <div className="grid gap-3 md:grid-cols-[220px_1fr] md:items-end">
                <InputField
                  label="Date"
                  name="substitution_date"
                  onChange={(value) => setSelectedDate(value)}
                  type="date"
                  value={selectedDate}
                />
                <p className="text-sm text-muted-foreground">
                  Affected periods are based on staff marked absent, leave, on duty, training/FDP or exam duty.
                </p>
              </div>
              {affectedPeriods.length > 0 ? (
                affectedPeriods.map((period) => (
                  <AffectedPeriodCard
                    assignSubstitution={assignSubstitution}
                    key={period.id}
                    period={period}
                    suggestedTeachers={suggestTeachers(period, periodsForToday, teachers)}
                  />
                ))
              ) : (
                <p className="rounded-md border bg-background p-5 text-sm text-muted-foreground">
                  No affected periods found for this date.
                </p>
              )}
            </div>
          ) : substitutions.length > 0 ? (
            <DataTable
              headers={["Date", "Period", "Class", "Subject", "Status", "Action"]}
              rows={substitutions.map((substitution) => [
                substitution.date,
                substitution.periodNumber ? String(substitution.periodNumber) : "Period",
                substitution.className,
                substitution.subjectName,
                <Badge key={`${substitution.id}-status`} tone={toneForSubstitution(substitution.status)}>
                  {labelize(substitution.status ?? "assigned")}
                </Badge>,
                substitution.status === "assigned" ? (
                  <Button
                    key={`${substitution.id}-ack`}
                    onClick={() => updateSubstitutionStatus(substitution.id, "acknowledged")}
                    type="button"
                    variant="secondary"
                  >
                    Acknowledge
                  </Button>
                ) : (
                  "No action"
                ),
              ])}
            />
          ) : (
            <p className="rounded-md border bg-background p-5 text-sm text-muted-foreground">
              No substitution duties assigned to you.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function AffectedPeriodCard({
  assignSubstitution,
  period,
  suggestedTeachers,
}: {
  assignSubstitution: (period: TimetablePeriod, substituteTeacherId: string) => void;
  period: TimetablePeriod;
  suggestedTeachers: TimetableProfile[];
}) {
  const [substituteTeacherId, setSubstituteTeacherId] = useState(suggestedTeachers[0]?.id ?? "");

  return (
    <div className="rounded-md border bg-background p-4">
      <div className="grid gap-4 lg:grid-cols-[1fr_260px_120px] lg:items-end">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium">
              Period {period.period_number} - {period.className}
            </p>
            <Badge tone="warning">Affected</Badge>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            {period.subjectName} with {period.teacherName} {timeRange(period.start_time, period.end_time)}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">Room: {period.room || "Not set"}</p>
        </div>
        <label className="grid gap-1 text-sm">
          <span className="font-medium text-muted-foreground">Suggested substitute</span>
          <select
            className="h-10 rounded-md border bg-card px-3 text-sm"
            onChange={(event) => setSubstituteTeacherId(event.target.value)}
            value={substituteTeacherId}
          >
            {suggestedTeachers.length > 0 ? (
              suggestedTeachers.map((teacher) => (
                <option key={teacher.id} value={teacher.id}>
                  {teacher.full_name}
                </option>
              ))
            ) : (
              <option value="">No free teacher found</option>
            )}
          </select>
        </label>
        <Button
          disabled={!substituteTeacherId}
          onClick={() => assignSubstitution(period, substituteTeacherId)}
          type="button"
        >
          Assign
        </Button>
      </div>
    </div>
  );
}

function suggestTeachers(
  period: TimetablePeriod,
  periodsForToday: TimetablePeriod[],
  teachers: TimetableProfile[],
) {
  const busyTeacherIds = new Set(
    periodsForToday
      .filter((candidate) => candidate.period_number === period.period_number)
      .map((candidate) => candidate.teacher_id)
      .filter(Boolean),
  );
  return teachers.filter((teacher) => teacher.id !== period.teacher_id && !busyTeacherIds.has(teacher.id));
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

function SelectField({ label, name, options }: { label: string; name: string; options: string[][] }) {
  return (
    <label className="grid gap-1 text-sm">
      <span className="font-medium text-muted-foreground">{label}</span>
      <select className="h-10 rounded-md border bg-background px-3 text-sm" name={name} required>
        <option value="">Select</option>
        {options.map(([value, text]) => (
          <option key={value} value={value}>
            {text}
          </option>
        ))}
      </select>
    </label>
  );
}

function InputField({
  label,
  min,
  name,
  onChange,
  type,
  value,
}: {
  label: string;
  min?: string;
  name: string;
  onChange?: (value: string) => void;
  type: string;
  value?: string;
}) {
  return (
    <label className="grid gap-1 text-sm">
      <span className="font-medium text-muted-foreground">{label}</span>
      <input
        className="h-10 rounded-md border bg-background px-3 text-sm"
        min={min}
        name={name}
        onChange={onChange ? (event) => onChange(event.target.value) : undefined}
        required={["date", "number"].includes(type)}
        type={type}
        value={value}
      />
    </label>
  );
}

function classLabel(item: TimetableClass) {
  return [item.class_name, item.section].filter(Boolean).join("");
}

function dayForDate(date: string) {
  return new Intl.DateTimeFormat("en", { weekday: "long" }).format(new Date(`${date}T00:00:00`)).toLowerCase();
}

function timeRange(start: string | null, end: string | null) {
  if (!start && !end) return "Time not set";
  return [start?.slice(0, 5), end?.slice(0, 5)].filter(Boolean).join(" - ");
}

function valueOrNull(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  return text || null;
}

function labelize(value: string) {
  return value.replaceAll("_", " ");
}

function toneForSubstitution(status: string | null): StatusTone {
  if (status === "completed") return "success";
  if (status === "missed") return "danger";
  if (status === "assigned" || status === "acknowledged") return "info";
  return "warning";
}
