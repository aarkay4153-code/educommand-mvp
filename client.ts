"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { DataTable } from "@/components/ui/table";
import { createClient } from "@/lib/supabase/client";

type BoardClass = "class_10" | "class_12";
type TabKey = "daily" | "weekly" | "monthly";

export type BoardSubjectOption = {
  id: string;
  board_class: BoardClass;
  subject_name: string;
  teacher_id: string | null;
  teacherName: string;
};

export type BoardInputRow = {
  id: string;
  board_class: BoardClass | null;
  subjectName: string;
  teacherName: string;
  dateLabel: string;
  summary: string;
  status: string;
};

export function TeacherInputsWorkspace({
  currentUserId,
  dailyInputs,
  isTeacher,
  monthlyInputs,
  schoolId,
  subjects,
  weeklyInputs,
}: {
  currentUserId: string;
  dailyInputs: BoardInputRow[];
  isTeacher: boolean;
  monthlyInputs: BoardInputRow[];
  schoolId: string;
  subjects: BoardSubjectOption[];
  weeklyInputs: BoardInputRow[];
}) {
  const [activeTab, setActiveTab] = useState<TabKey>("daily");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {[
          ["daily", "Daily"] as const,
          ["weekly", "Weekly"] as const,
          ["monthly", "Monthly"] as const,
        ].map(([tab, label]) => (
          <Button
            key={tab}
            onClick={() => setActiveTab(tab)}
            type="button"
            variant={activeTab === tab ? "primary" : "secondary"}
          >
            {label}
          </Button>
        ))}
      </div>

      {isTeacher ? (
        subjects.length > 0 ? (
          <>
            {activeTab === "daily" ? (
              <DailyInputForm currentUserId={currentUserId} schoolId={schoolId} subjects={subjects} />
            ) : null}
            {activeTab === "weekly" ? (
              <WeeklyInputForm currentUserId={currentUserId} schoolId={schoolId} subjects={subjects} />
            ) : null}
            {activeTab === "monthly" ? (
              <MonthlyInputForm currentUserId={currentUserId} schoolId={schoolId} subjects={subjects} />
            ) : null}
          </>
        ) : (
          <Card>
            <CardHeader title="No board subjects assigned" description="Your Board Command subjects will appear here once assigned." />
            <CardContent className="text-sm text-muted-foreground">
              Please contact your coordinator or principal to assign board subjects.
            </CardContent>
          </Card>
        )
      ) : (
        <Card>
          <CardHeader
            title="View-only mode"
            description="Principals and coordinators can review all inputs here. Teacher edits are intentionally avoided."
          />
          <CardContent>
            <Badge tone="info">Read-only review</Badge>
          </CardContent>
        </Card>
      )}

      {activeTab === "daily" ? <PreviousInputs title="Previous Daily Inputs" rows={dailyInputs} /> : null}
      {activeTab === "weekly" ? <PreviousInputs title="Previous Weekly Inputs" rows={weeklyInputs} /> : null}
      {activeTab === "monthly" ? <PreviousInputs title="Previous Monthly Inputs" rows={monthlyInputs} /> : null}
    </div>
  );
}

function DailyInputForm({
  currentUserId,
  schoolId,
  subjects,
}: {
  currentUserId: string;
  schoolId: string;
  subjects: BoardSubjectOption[];
}) {
  const router = useRouter();
  const [boardClass, setBoardClass] = useState<BoardClass>("class_10");
  const matchingSubjects = useMatchingSubjects(subjects, boardClass);
  const [subjectId, setSubjectId] = useState(matchingSubjects[0]?.id ?? subjects[0]?.id ?? "");
  const [inputDate, setInputDate] = useState(new Date().toISOString().slice(0, 10));
  const [topic, setTopic] = useState("");
  const [plannedCompleted, setPlannedCompleted] = useState("");
  const [absent, setAbsent] = useState("");
  const [struggled, setStruggled] = useState("");
  const [performedWell, setPerformedWell] = useState("");
  const [urgentConcern, setUrgentConcern] = useState("");
  const [message, setMessage] = useState<FormMessage>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleClassChange(value: BoardClass) {
    setBoardClass(value);
    const firstSubject = subjects.find((subject) => subject.board_class === value) ?? subjects[0];
    setSubjectId(firstSubject?.id ?? "");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    if (!subjectId || !topic.trim() || !plannedCompleted) {
      setMessage({ type: "error", text: "Topic taught and planned syllabus status are required." });
      return;
    }

    setIsSubmitting(true);
    const { error } = await createClient().from("board_daily_inputs").insert({
      school_id: schoolId,
      board_class: boardClass,
      subject_id: subjectId,
      teacher_id: currentUserId,
      input_date: inputDate,
      topic_taught_today: topic.trim(),
      planned_syllabus_completed: plannedCompleted === "yes",
      students_absent: parseList(absent),
      students_struggled: parseList(struggled),
      students_performed_well: parseList(performedWell),
      urgent_concern: urgentConcern.trim() || null,
    });
    setIsSubmitting(false);

    if (error) {
      setMessage({ type: "error", text: error.message });
      return;
    }

    setTopic("");
    setAbsent("");
    setStruggled("");
    setPerformedWell("");
    setUrgentConcern("");
    setMessage({ type: "success", text: "Daily board input submitted." });
    router.refresh();
  }

  return (
    <Card>
      <CardHeader title="Daily Board Input" description="Fast daily update. Designed to finish in under two minutes." />
      <CardContent>
        <form className="grid gap-4 lg:grid-cols-2" onSubmit={submit}>
          <FormMessage message={message} />
          <BoardClassSelect onChange={handleClassChange} value={boardClass} />
          <SubjectSelect onChange={setSubjectId} subjects={matchingSubjects} value={subjectId} />
          <Field label="Date">
            <input className="h-10 w-full rounded-md border bg-card px-3 text-sm" onChange={(e) => setInputDate(e.target.value)} type="date" value={inputDate} />
          </Field>
          <Field label="Planned syllabus completed">
            <select className="h-10 w-full rounded-md border bg-card px-3 text-sm" onChange={(e) => setPlannedCompleted(e.target.value)} required value={plannedCompleted}>
              <option value="">Choose</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </Field>
          <Field className="lg:col-span-2" label="Topic taught today">
            <input className="h-10 w-full rounded-md border bg-card px-3 text-sm" onChange={(e) => setTopic(e.target.value)} placeholder="Example: Quadratic equations revision" required value={topic} />
          </Field>
          <QuickList label="Students absent" onChange={setAbsent} value={absent} />
          <QuickList label="Students who struggled today" onChange={setStruggled} value={struggled} />
          <QuickList label="Students who performed well today" onChange={setPerformedWell} value={performedWell} />
          <Field label="Any urgent concern">
            <textarea className="min-h-20 w-full rounded-md border bg-card px-3 py-2 text-sm" onChange={(e) => setUrgentConcern(e.target.value)} placeholder="Optional, keep it brief" value={urgentConcern} />
          </Field>
          <div className="lg:col-span-2">
            <Button disabled={isSubmitting} type="submit">
              {isSubmitting ? "Submitting..." : "Submit daily input"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function WeeklyInputForm({
  currentUserId,
  schoolId,
  subjects,
}: {
  currentUserId: string;
  schoolId: string;
  subjects: BoardSubjectOption[];
}) {
  const router = useRouter();
  const [boardClass, setBoardClass] = useState<BoardClass>("class_10");
  const matchingSubjects = useMatchingSubjects(subjects, boardClass);
  const [subjectId, setSubjectId] = useState(matchingSubjects[0]?.id ?? subjects[0]?.id ?? "");
  const [weekStart, setWeekStart] = useState("");
  const [weekEnd, setWeekEnd] = useState("");
  const [testTitle, setTestTitle] = useState("");
  const [marksSummary, setMarksSummary] = useState("");
  const [weakStudents, setWeakStudents] = useState("");
  const [improvingStudents, setImprovingStudents] = useState("");
  const [decliningStudents, setDecliningStudents] = useState("");
  const [extraCoaching, setExtraCoaching] = useState("");
  const [highPotential, setHighPotential] = useState("");
  const [weakChapters, setWeakChapters] = useState("");
  const [remedialAttendance, setRemedialAttendance] = useState("");
  const [message, setMessage] = useState<FormMessage>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleClassChange(value: BoardClass) {
    setBoardClass(value);
    const firstSubject = subjects.find((subject) => subject.board_class === value) ?? subjects[0];
    setSubjectId(firstSubject?.id ?? "");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    if (!subjectId || (!marksSummary.trim() && !weakChapters.trim())) {
      setMessage({ type: "error", text: "Add either test marks summary or main weak chapters/topics." });
      return;
    }

    setIsSubmitting(true);
    const { error } = await createClient().from("board_weekly_inputs").insert({
      school_id: schoolId,
      board_class: boardClass,
      subject_id: subjectId,
      teacher_id: currentUserId,
      week_start_date: weekStart || null,
      week_end_date: weekEnd || null,
      test_title: testTitle.trim() || null,
      test_marks_summary: marksSummary.trim() ? { summary: marksSummary.trim() } : null,
      weak_students: parseList(weakStudents),
      improving_students: parseList(improvingStudents),
      declining_students: parseList(decliningStudents),
      students_needing_extra_coaching: parseList(extraCoaching),
      high_score_potential_students: parseList(highPotential),
      main_weak_chapters: weakChapters.trim() || null,
      remedial_class_attendance: parseList(remedialAttendance),
    });
    setIsSubmitting(false);

    if (error) {
      setMessage({ type: "error", text: error.message });
      return;
    }

    setMessage({ type: "success", text: "Weekly board input submitted." });
    setTestTitle("");
    setMarksSummary("");
    setWeakStudents("");
    setImprovingStudents("");
    setDecliningStudents("");
    setExtraCoaching("");
    setHighPotential("");
    setWeakChapters("");
    setRemedialAttendance("");
    router.refresh();
  }

  return (
    <Card>
      <CardHeader title="Weekly Board Input" description="Summarise test movement and student risk groups." />
      <CardContent>
        <form className="grid gap-4 lg:grid-cols-2" onSubmit={submit}>
          <FormMessage message={message} />
          <BoardClassSelect onChange={handleClassChange} value={boardClass} />
          <SubjectSelect onChange={setSubjectId} subjects={matchingSubjects} value={subjectId} />
          <Field label="Week start date"><input className="h-10 w-full rounded-md border bg-card px-3 text-sm" onChange={(e) => setWeekStart(e.target.value)} type="date" value={weekStart} /></Field>
          <Field label="Week end date"><input className="h-10 w-full rounded-md border bg-card px-3 text-sm" onChange={(e) => setWeekEnd(e.target.value)} type="date" value={weekEnd} /></Field>
          <Field label="Test/worksheet title"><input className="h-10 w-full rounded-md border bg-card px-3 text-sm" onChange={(e) => setTestTitle(e.target.value)} value={testTitle} /></Field>
          <Field label="Test marks / worksheet marks summary"><textarea className="min-h-20 w-full rounded-md border bg-card px-3 py-2 text-sm" onChange={(e) => setMarksSummary(e.target.value)} placeholder="Example: Class average 64%, 8 below 40%" value={marksSummary} /></Field>
          <QuickList label="Weak students list" onChange={setWeakStudents} value={weakStudents} />
          <QuickList label="Improving students list" onChange={setImprovingStudents} value={improvingStudents} />
          <QuickList label="Declining students list" onChange={setDecliningStudents} value={decliningStudents} />
          <QuickList label="Students needing extra coaching" onChange={setExtraCoaching} value={extraCoaching} />
          <QuickList label="Students with high-score potential" onChange={setHighPotential} value={highPotential} />
          <Field label="Main weak chapters/topics"><input className="h-10 w-full rounded-md border bg-card px-3 text-sm" onChange={(e) => setWeakChapters(e.target.value)} value={weakChapters} /></Field>
          <QuickList label="Remedial class attendance" onChange={setRemedialAttendance} value={remedialAttendance} />
          <div className="lg:col-span-2">
            <Button disabled={isSubmitting} type="submit">{isSubmitting ? "Submitting..." : "Submit weekly input"}</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function MonthlyInputForm({
  currentUserId,
  schoolId,
  subjects,
}: {
  currentUserId: string;
  schoolId: string;
  subjects: BoardSubjectOption[];
}) {
  const router = useRouter();
  const [boardClass, setBoardClass] = useState<BoardClass>("class_10");
  const matchingSubjects = useMatchingSubjects(subjects, boardClass);
  const [subjectId, setSubjectId] = useState(matchingSubjects[0]?.id ?? subjects[0]?.id ?? "");
  const [month, setMonth] = useState("");
  const [completion, setCompletion] = useState("");
  const [revisionStatus, setRevisionStatus] = useState("");
  const [mockSummary, setMockSummary] = useState("");
  const [predictedResult, setPredictedResult] = useState("");
  const [parentMeeting, setParentMeeting] = useState("");
  const [principalIntervention, setPrincipalIntervention] = useState("");
  const [risks, setRisks] = useState("");
  const [meritProspects, setMeritProspects] = useState("");
  const [message, setMessage] = useState<FormMessage>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleClassChange(value: BoardClass) {
    setBoardClass(value);
    const firstSubject = subjects.find((subject) => subject.board_class === value) ?? subjects[0];
    setSubjectId(firstSubject?.id ?? "");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    const completionNumber = Number(completion);

    if (!subjectId || !revisionStatus || !Number.isFinite(completionNumber) || completionNumber < 0 || completionNumber > 100) {
      setMessage({ type: "error", text: "Completion percentage and revision status are required." });
      return;
    }

    setIsSubmitting(true);
    const { error } = await createClient().from("board_monthly_inputs").insert({
      school_id: schoolId,
      board_class: boardClass,
      subject_id: subjectId,
      teacher_id: currentUserId,
      month: month.trim() || null,
      syllabus_completion_percentage: completionNumber,
      revision_status: revisionStatus,
      mock_preboard_performance_summary: mockSummary.trim() || null,
      predicted_board_result: predictedResult.trim() || null,
      students_needing_parent_meeting: parseList(parentMeeting),
      students_needing_principal_intervention: parseList(principalIntervention),
      top_academic_risks: risks.trim() || null,
      top_merit_prospects: parseList(meritProspects),
    });
    setIsSubmitting(false);

    if (error) {
      setMessage({ type: "error", text: error.message });
      return;
    }

    setMessage({ type: "success", text: "Monthly board input submitted." });
    setCompletion("");
    setRevisionStatus("");
    setMockSummary("");
    setPredictedResult("");
    setParentMeeting("");
    setPrincipalIntervention("");
    setRisks("");
    setMeritProspects("");
    router.refresh();
  }

  return (
    <Card>
      <CardHeader title="Monthly Board Input" description="Monthly readiness update for principal review." />
      <CardContent>
        <form className="grid gap-4 lg:grid-cols-2" onSubmit={submit}>
          <FormMessage message={message} />
          <BoardClassSelect onChange={handleClassChange} value={boardClass} />
          <SubjectSelect onChange={setSubjectId} subjects={matchingSubjects} value={subjectId} />
          <Field label="Month"><input className="h-10 w-full rounded-md border bg-card px-3 text-sm" onChange={(e) => setMonth(e.target.value)} placeholder="May 2026" value={month} /></Field>
          <Field label="Syllabus completion percentage"><input className="h-10 w-full rounded-md border bg-card px-3 text-sm" max="100" min="0" onChange={(e) => setCompletion(e.target.value)} required type="number" value={completion} /></Field>
          <Field label="Revision status">
            <select className="h-10 w-full rounded-md border bg-card px-3 text-sm" onChange={(e) => setRevisionStatus(e.target.value)} required value={revisionStatus}>
              <option value="">Choose</option>
              <option value="not_started">Not started</option>
              <option value="started">Started</option>
              <option value="in_progress">In progress</option>
              <option value="completed">Completed</option>
            </select>
          </Field>
          <Field label="Mock/pre-board performance"><textarea className="min-h-20 w-full rounded-md border bg-card px-3 py-2 text-sm" onChange={(e) => setMockSummary(e.target.value)} value={mockSummary} /></Field>
          <Field label="Predicted board result"><input className="h-10 w-full rounded-md border bg-card px-3 text-sm" onChange={(e) => setPredictedResult(e.target.value)} value={predictedResult} /></Field>
          <QuickList label="Students needing parent meeting" onChange={setParentMeeting} value={parentMeeting} />
          <QuickList label="Students needing principal intervention" onChange={setPrincipalIntervention} value={principalIntervention} />
          <Field label="Top academic risks"><textarea className="min-h-20 w-full rounded-md border bg-card px-3 py-2 text-sm" onChange={(e) => setRisks(e.target.value)} value={risks} /></Field>
          <QuickList label="Top merit prospects" onChange={setMeritProspects} value={meritProspects} />
          <div className="lg:col-span-2">
            <Button disabled={isSubmitting} type="submit">{isSubmitting ? "Submitting..." : "Submit monthly input"}</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function PreviousInputs({ rows, title }: { rows: BoardInputRow[]; title: string }) {
  return (
    <Card>
      <CardHeader title={title} description="Recently submitted Board Command inputs." />
      <CardContent className="p-0">
        <DataTable
          emptyMessage="No previous submissions yet."
          headers={["Class", "Subject", "Teacher", "Date/Period", "Summary", "Status"]}
          rows={rows.map((row) => [
            displayBoardClass(row.board_class),
            row.subjectName,
            row.teacherName,
            row.dateLabel,
            row.summary,
            <Badge key={row.id} tone="info">{row.status}</Badge>,
          ])}
        />
      </CardContent>
    </Card>
  );
}

function BoardClassSelect({ onChange, value }: { onChange: (value: BoardClass) => void; value: BoardClass }) {
  return (
    <Field label="Board Class">
      <select className="h-10 w-full rounded-md border bg-card px-3 text-sm" onChange={(event) => onChange(event.target.value as BoardClass)} value={value}>
        <option value="class_10">Class 10</option>
        <option value="class_12">Class 12</option>
      </select>
    </Field>
  );
}

function SubjectSelect({ onChange, subjects, value }: { onChange: (value: string) => void; subjects: BoardSubjectOption[]; value: string }) {
  return (
    <Field label="Subject">
      <select className="h-10 w-full rounded-md border bg-card px-3 text-sm" onChange={(event) => onChange(event.target.value)} required value={value}>
        {subjects.map((subject) => (
          <option key={subject.id} value={subject.id}>
            {subject.subject_name}
          </option>
        ))}
      </select>
    </Field>
  );
}

function QuickList({ label, onChange, value }: { label: string; onChange: (value: string) => void; value: string }) {
  return (
    <Field label={label}>
      <input
        className="h-10 w-full rounded-md border bg-card px-3 text-sm"
        onChange={(event) => onChange(event.target.value)}
        placeholder="Type names separated by commas"
        value={value}
      />
    </Field>
  );
}

type FormMessage = { type: "success" | "error"; text: string } | null;

function FormMessage({ message }: { message: FormMessage }) {
  if (!message) return null;

  return (
    <div
      className={`rounded-md border px-3 py-2 text-sm lg:col-span-full ${
        message.type === "success"
          ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200"
          : "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-200"
      }`}
    >
      {message.text}
    </div>
  );
}

function Field({ children, className, label }: { children: React.ReactNode; className?: string; label: string }) {
  return (
    <label className={`block text-sm font-medium ${className ?? ""}`}>
      {label}
      <div className="mt-2">{children}</div>
    </label>
  );
}

function useMatchingSubjects(subjects: BoardSubjectOption[], boardClass: BoardClass) {
  return useMemo(() => {
    const filtered = subjects.filter((subject) => subject.board_class === boardClass);
    return filtered.length > 0 ? filtered : subjects;
  }, [boardClass, subjects]);
}

function parseList(value: string) {
  const items = value
    .split(/,|\n/)
    .map((item) => item.trim())
    .filter(Boolean);
  return items.length > 0 ? items : null;
}

function displayBoardClass(boardClass: BoardClass | null) {
  if (boardClass === "class_12") return "Class 12";
  return "Class 10";
}
