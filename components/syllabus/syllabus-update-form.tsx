"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ProofUpload } from "@/components/uploads/proof-upload";
import { writeActivityLog } from "@/lib/activity-log";
import { createClient } from "@/lib/supabase/client";

export type TeacherAssignmentOption = {
  id: string;
  school_id: string;
  teacher_id: string;
  class_section_id: string;
  subject_id: string;
  class_name: string;
  section: string | null;
  subject_name: string;
};

type SubmitState = {
  type: "success" | "error";
  message: string;
} | null;

const statusOptions = [
  { value: "on_track", label: "On track" },
  { value: "behind", label: "Behind" },
  { value: "completed", label: "Completed" },
  { value: "not_started", label: "Not started" },
];

export function SyllabusUpdateForm({
  assignments,
  teacherId,
  schoolId,
}: {
  assignments: TeacherAssignmentOption[];
  teacherId: string;
  schoolId: string;
}) {
  const router = useRouter();
  const [classSectionId, setClassSectionId] = useState(assignments[0]?.class_section_id ?? "");
  const [subjectId, setSubjectId] = useState(assignments[0]?.subject_id ?? "");
  const [weekStartDate, setWeekStartDate] = useState("");
  const [weekEndDate, setWeekEndDate] = useState("");
  const [plannedPortion, setPlannedPortion] = useState("");
  const [completedPortion, setCompletedPortion] = useState("");
  const [completionPercentage, setCompletionPercentage] = useState("0");
  const [status, setStatus] = useState("on_track");
  const [delayReason, setDelayReason] = useState("");
  const [nextWeekTarget, setNextWeekTarget] = useState("");
  const [submitState, setSubmitState] = useState<SubmitState>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastCreatedUpdateId, setLastCreatedUpdateId] = useState<string | null>(null);
  const [lastProofUrl, setLastProofUrl] = useState<string | null>(null);

  const classOptions = useMemo(() => {
    const options = new Map<string, TeacherAssignmentOption>();
    assignments.forEach((assignment) => {
      options.set(assignment.class_section_id, assignment);
    });
    return Array.from(options.values());
  }, [assignments]);

  const subjectOptions = useMemo(
    () => assignments.filter((assignment) => assignment.class_section_id === classSectionId),
    [assignments, classSectionId],
  );

  const needsDelayReason = status === "behind" || status === "not_started";

  function handleClassChange(nextClassSectionId: string) {
    setClassSectionId(nextClassSectionId);
    const nextSubject = assignments.find(
      (assignment) => assignment.class_section_id === nextClassSectionId,
    );
    setSubjectId(nextSubject?.subject_id ?? "");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitState(null);

    const selectedAssignment = assignments.find(
      (assignment) =>
        assignment.class_section_id === classSectionId && assignment.subject_id === subjectId,
    );
    const progress = Number(completionPercentage);

    if (!selectedAssignment) {
      setSubmitState({ type: "error", message: "Select one of your assigned class and subject pairs." });
      return;
    }

    if (!weekStartDate || !weekEndDate || weekEndDate < weekStartDate) {
      setSubmitState({ type: "error", message: "Choose a valid week start and end date." });
      return;
    }

    if (!plannedPortion.trim()) {
      setSubmitState({ type: "error", message: "Add the planned portion for the week." });
      return;
    }

    if (!Number.isFinite(progress) || progress < 0 || progress > 100) {
      setSubmitState({ type: "error", message: "Completion percentage must be between 0 and 100." });
      return;
    }

    if (needsDelayReason && !delayReason.trim()) {
      setSubmitState({ type: "error", message: "Add a delay reason for behind or not started updates." });
      return;
    }

    setIsSubmitting(true);

    const supabase = createClient();
    const { data: createdUpdate, error } = await supabase
      .from("syllabus_updates")
      .insert({
        school_id: schoolId,
        teacher_id: teacherId,
        class_section_id: classSectionId,
        subject_id: subjectId,
        week_start_date: weekStartDate,
        week_end_date: weekEndDate,
        planned_portion: plannedPortion.trim(),
        completed_portion: completedPortion.trim() || null,
        completion_percentage: progress,
        status,
        delay_reason: needsDelayReason ? delayReason.trim() : null,
        next_week_target: nextWeekTarget.trim() || null,
        submitted_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    setIsSubmitting(false);

    if (error) {
      setSubmitState({ type: "error", message: error.message });
      return;
    }

    await writeActivityLog({
      action: "submitted",
      actorId: teacherId,
      entityId: createdUpdate.id,
      entityType: "syllabus_update",
      newValue: {
        class_section_id: classSectionId,
        subject_id: subjectId,
        completion_percentage: progress,
        status,
      },
      schoolId,
    });

    setCompletedPortion("");
    setCompletionPercentage("0");
    setDelayReason("");
    setNextWeekTarget("");
    setPlannedPortion("");
    setStatus("on_track");
    setLastCreatedUpdateId(createdUpdate.id);
    setLastProofUrl(null);
    setSubmitState({ type: "success", message: "Syllabus update submitted. You can optionally upload proof now." });
    router.refresh();
  }

  async function saveProofPath(path: string) {
    if (!lastCreatedUpdateId) return;
    setLastProofUrl(path);
    const supabase = createClient();
    const { error } = await supabase
      .from("syllabus_updates")
      .update({ proof_url: path })
      .eq("id", lastCreatedUpdateId);

    if (error) {
      setSubmitState({ type: "error", message: error.message });
      return;
    }

    await writeActivityLog({
      action: "proof_uploaded",
      actorId: teacherId,
      entityId: lastCreatedUpdateId,
      entityType: "syllabus_update",
      newValue: { proof_url: path },
      schoolId,
    });

    setSubmitState({ type: "success", message: "Proof uploaded and linked to the update." });
    router.refresh();
  }

  if (assignments.length === 0) {
    return (
      <Card>
        <CardHeader title="Weekly Update" description="No assigned classes or subjects found." />
        <CardContent className="text-sm text-muted-foreground">
          Ask your coordinator to add your teacher assignment before submitting syllabus progress.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader
        title="Add Weekly Syllabus Update"
        description="A compact update form for the current teaching week."
        action={<Badge tone="info">Teacher</Badge>}
      />
      <CardContent>
        <form className="grid gap-4 lg:grid-cols-2" onSubmit={handleSubmit}>
          {submitState ? (
            <div
              className={`rounded-md border px-3 py-2 text-sm lg:col-span-2 ${
                submitState.type === "success"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200"
                  : "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-200"
              }`}
            >
              {submitState.message}
            </div>
          ) : null}

          <Field label="Class section">
            <select
              className="h-10 w-full rounded-md border bg-card px-3 text-sm"
              onChange={(event) => handleClassChange(event.target.value)}
              value={classSectionId}
            >
              {classOptions.map((assignment) => (
                <option key={assignment.class_section_id} value={assignment.class_section_id}>
                  {classLabel(assignment)}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Subject">
            <select
              className="h-10 w-full rounded-md border bg-card px-3 text-sm"
              onChange={(event) => setSubjectId(event.target.value)}
              value={subjectId}
            >
              {subjectOptions.map((assignment) => (
                <option key={`${assignment.class_section_id}-${assignment.subject_id}`} value={assignment.subject_id}>
                  {assignment.subject_name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Week start date">
            <input
              className="h-10 w-full rounded-md border bg-card px-3 text-sm"
              onChange={(event) => setWeekStartDate(event.target.value)}
              required
              type="date"
              value={weekStartDate}
            />
          </Field>

          <Field label="Week end date">
            <input
              className="h-10 w-full rounded-md border bg-card px-3 text-sm"
              onChange={(event) => setWeekEndDate(event.target.value)}
              required
              type="date"
              value={weekEndDate}
            />
          </Field>

          <Field label="Planned portion">
            <textarea
              className="min-h-20 w-full rounded-md border bg-card px-3 py-2 text-sm"
              onChange={(event) => setPlannedPortion(event.target.value)}
              placeholder="Chapter, unit, pages, or learning goal"
              required
              value={plannedPortion}
            />
          </Field>

          <Field label="Completed portion">
            <textarea
              className="min-h-20 w-full rounded-md border bg-card px-3 py-2 text-sm"
              onChange={(event) => setCompletedPortion(event.target.value)}
              placeholder="What was completed this week"
              value={completedPortion}
            />
          </Field>

          <Field label="Completion percentage">
            <input
              className="h-10 w-full rounded-md border bg-card px-3 text-sm"
              max="100"
              min="0"
              onChange={(event) => setCompletionPercentage(event.target.value)}
              required
              type="number"
              value={completionPercentage}
            />
          </Field>

          <Field label="Status">
            <select
              className="h-10 w-full rounded-md border bg-card px-3 text-sm"
              onChange={(event) => setStatus(event.target.value)}
              value={status}
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </Field>

          {needsDelayReason ? (
            <Field className="lg:col-span-2" label="Delay reason">
              <textarea
                className="min-h-20 w-full rounded-md border bg-card px-3 py-2 text-sm"
                onChange={(event) => setDelayReason(event.target.value)}
                placeholder="Briefly explain what blocked progress"
                required
                value={delayReason}
              />
            </Field>
          ) : null}

          <Field className="lg:col-span-2" label="Next week target">
            <textarea
              className="min-h-20 w-full rounded-md border bg-card px-3 py-2 text-sm"
              onChange={(event) => setNextWeekTarget(event.target.value)}
              placeholder="Target for the next teaching week"
              value={nextWeekTarget}
            />
          </Field>

          <div className="lg:col-span-2">
            <Button disabled={isSubmitting} type="submit">
              {isSubmitting ? "Submitting..." : "Submit update"}
            </Button>
          </div>

          {lastCreatedUpdateId ? (
            <Field className="lg:col-span-2" label="Optional proof upload">
              <ProofUpload
                module="syllabus_updates"
                onUploaded={saveProofPath}
                recordId={lastCreatedUpdateId}
                schoolId={schoolId}
                value={lastProofUrl}
              />
            </Field>
          ) : null}
        </form>
      </CardContent>
    </Card>
  );
}

function Field({
  children,
  className,
  label,
}: {
  children: React.ReactNode;
  className?: string;
  label: string;
}) {
  return (
    <label className={`block text-sm font-medium ${className ?? ""}`}>
      {label}
      <div className="mt-2">{children}</div>
    </label>
  );
}

function classLabel(assignment: TeacherAssignmentOption) {
  return [assignment.class_name, assignment.section].filter(Boolean).join("");
}
