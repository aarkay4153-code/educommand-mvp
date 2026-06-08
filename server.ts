"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { DataTable } from "@/components/ui/table";
import { ProofUpload } from "@/components/uploads/proof-upload";
import { writeActivityLog } from "@/lib/activity-log";
import { eventTemplates } from "@/lib/event-templates";
import { createClient } from "@/lib/supabase/client";

export type CalendarProfile = {
  id: string;
  full_name: string;
  role: "principal" | "coordinator" | "teacher";
};

export type CalendarEvent = {
  id: string;
  school_id: string;
  event_name: string;
  description: string | null;
  event_date: string;
  intensity: "low" | "medium" | "high";
  owner_id: string | null;
  ownerName: string;
  status: string;
  completion_percentage: number;
};

export type CalendarMilestone = {
  id: string;
  school_id: string;
  event_id: string | null;
  title: string;
  description: string | null;
  owner_id: string | null;
  ownerName: string;
  due_date: string | null;
  status: string;
  delay_reason: string | null;
  proof_url: string | null;
};

export type CalendarActivityLog = {
  id: string;
  entity_type: string | null;
  entity_id: string | null;
  action: string | null;
  created_at: string;
  actorName: string;
};

const intensityOptions = ["low", "medium", "high"] as const;
const eventStatusOptions = ["planned", "in_progress", "completed", "delayed", "at_risk", "cancelled"];
const milestoneStatusOptions = ["not_started", "in_progress", "completed", "delayed", "blocked"];
const doneMilestones = new Set(["completed"]);

export function ActionCalendar({
  currentUserId,
  events,
  isLeader,
  milestones,
  profiles,
  schoolId,
  activityLogs,
}: {
  activityLogs: CalendarActivityLog[];
  currentUserId: string;
  events: CalendarEvent[];
  isLeader: boolean;
  milestones: CalendarMilestone[];
  profiles: CalendarProfile[];
  schoolId: string;
}) {
  const [selectedEventId, setSelectedEventId] = useState(events[0]?.id ?? "");
  const selectedEvent = events.find((event) => event.id === selectedEventId) ?? events[0] ?? null;
  const selectedMilestones = selectedEvent
    ? milestones.filter((milestone) => milestone.event_id === selectedEvent.id)
    : [];
  const assignedMilestones = milestones.filter((milestone) => milestone.owner_id === currentUserId);

  return (
    <div className="space-y-6">
      {isLeader ? <EventForm currentUserId={currentUserId} profiles={profiles} schoolId={schoolId} /> : null}

      <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
        <Card>
          <CardHeader title="Monthly View" description="Action calendar for this month." />
          <CardContent>
            <MonthGrid events={events} onSelect={setSelectedEventId} selectedEventId={selectedEvent?.id ?? ""} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader
            title={isLeader ? "Event List" : "My Milestones"}
            description={isLeader ? "Select an event to inspect readiness." : "Milestones assigned to you."}
          />
          <CardContent className="space-y-3">
            {isLeader ? (
              events.length > 0 ? (
                events.map((event) => (
                  <button
                    className={`w-full rounded-md border p-3 text-left transition hover:bg-muted ${
                      selectedEvent?.id === event.id ? "border-primary bg-accent" : "bg-background"
                    }`}
                    key={event.id}
                    onClick={() => setSelectedEventId(event.id)}
                    type="button"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium">{event.event_name}</p>
                        <p className="mt-1 text-sm text-muted-foreground">{formatDate(event.event_date)}</p>
                      </div>
                      <Badge tone={intensityTone(event.intensity)}>{event.intensity}</Badge>
                    </div>
                  </button>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No events created yet.</p>
              )
            ) : assignedMilestones.length > 0 ? (
              assignedMilestones.map((milestone) => (
                <MilestoneUpdateCard currentUserId={currentUserId} key={milestone.id} milestone={milestone} />
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No milestones are assigned to you yet.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <EventDetail
        event={selectedEvent}
        currentUserId={currentUserId}
        activityLogs={activityLogs}
        isLeader={isLeader}
        milestones={selectedMilestones}
      />
    </div>
  );
}

function EventForm({
  currentUserId,
  profiles,
  schoolId,
}: {
  currentUserId: string;
  profiles: CalendarProfile[];
  schoolId: string;
}) {
  const router = useRouter();
  const [eventName, setEventName] = useState("");
  const [description, setDescription] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [intensity, setIntensity] = useState<"low" | "medium" | "high">("medium");
  const [ownerId, setOwnerId] = useState(profiles[0]?.id ?? "");
  const [completion, setCompletion] = useState("0");
  const [createMode, setCreateMode] = useState<"blank" | "template">("blank");
  const [selectedTemplateName, setSelectedTemplateName] = useState(eventTemplates[0]?.name ?? "");
  const [milestoneDrafts, setMilestoneDrafts] = useState([
    emptyMilestoneDraft(profiles[0]?.id ?? ""),
  ]);
  const [message, setMessage] = useState<FormMessage>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    const progress = Number(completion);
    const validMilestones = milestoneDrafts.filter((milestone) => milestone.title.trim());

    if (!eventName.trim() || !eventDate || !ownerId) {
      setMessage({ type: "error", text: "Event name, date, and owner are required." });
      return;
    }

    if (!Number.isFinite(progress) || progress < 0 || progress > 100) {
      setMessage({ type: "error", text: "Readiness percentage must be between 0 and 100." });
      return;
    }

    setIsSubmitting(true);
    const supabase = createClient();
    const { data: createdEvent, error: eventError } = await supabase
      .from("events")
      .insert({
        school_id: schoolId,
        event_name: eventName.trim(),
        description: description.trim() || null,
        event_date: eventDate,
        intensity,
        owner_id: ownerId,
        status: "planned",
        completion_percentage: progress,
      })
      .select("id")
      .single();

    if (eventError || !createdEvent) {
      setIsSubmitting(false);
      setMessage({ type: "error", text: eventError?.message ?? "Could not create event." });
      return;
    }

    if (validMilestones.length > 0) {
      const { error: milestoneError } = await supabase.from("event_milestones").insert(
        validMilestones.map((milestone) => ({
          school_id: schoolId,
          event_id: createdEvent.id,
          title: milestone.title.trim(),
          description: milestone.description.trim() || null,
          owner_id: milestone.owner_id,
          due_date: milestone.due_date || null,
          status: "not_started",
        })),
      );

      if (milestoneError) {
        setIsSubmitting(false);
        setMessage({ type: "error", text: milestoneError.message });
        return;
      }
    }

    await writeActivityLog({
      action: "created",
      actorId: currentUserId,
      entityId: createdEvent.id,
      entityType: "event",
      newValue: {
        event_name: eventName.trim(),
        event_date: eventDate,
        intensity,
        milestone_count: validMilestones.length,
      },
      schoolId,
    });

    setIsSubmitting(false);
    setEventName("");
    setDescription("");
    setEventDate("");
    setIntensity("medium");
    setCompletion("0");
    setCreateMode("blank");
    setSelectedTemplateName(eventTemplates[0]?.name ?? "");
    setMilestoneDrafts([emptyMilestoneDraft(profiles[0]?.id ?? "")]);
    setMessage({ type: "success", text: "Event created." });
    router.refresh();
  }

  function applyBlankMode() {
    setCreateMode("blank");
    setEventName("");
    setDescription("");
    setIntensity("medium");
    setMilestoneDrafts([emptyMilestoneDraft(profiles[0]?.id ?? "")]);
  }

  function applyTemplate(templateName: string) {
    const template = eventTemplates.find((candidate) => candidate.name === templateName) ?? eventTemplates[0];
    setCreateMode("template");
    setSelectedTemplateName(template.name);
    setEventName(template.name);
    setDescription(template.description);
    setIntensity(template.intensity);
    setMilestoneDrafts(
      template.milestones.map((milestone) => ({
        title: milestone.title,
        description: milestone.description ?? "",
        owner_id: ownerId || profiles[0]?.id || "",
        due_date: "",
      })),
    );
  }

  function handleOwnerChange(nextOwnerId: string) {
    setOwnerId(nextOwnerId);
    setMilestoneDrafts((drafts) =>
      drafts.map((draft) => ({
        ...draft,
        owner_id: draft.owner_id || nextOwnerId,
      })),
    );
  }

  return (
    <Card>
      <CardHeader title="Create Event" description="Create the event and its first action milestones." />
      <CardContent>
        <form className="grid gap-4 lg:grid-cols-2" onSubmit={handleSubmit}>
          <FormMessage message={message} />
          <div className="rounded-md border bg-background p-3 lg:col-span-2">
            <p className="text-sm font-medium">Start with</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                onClick={applyBlankMode}
                type="button"
                variant={createMode === "blank" ? "primary" : "secondary"}
              >
                Create blank event
              </Button>
              <Button
                onClick={() => applyTemplate(selectedTemplateName)}
                type="button"
                variant={createMode === "template" ? "primary" : "secondary"}
              >
                Create from template
              </Button>
            </div>
            {createMode === "template" ? (
              <label className="mt-4 block text-sm font-medium">
                Template
                <select
                  className="mt-2 h-10 w-full rounded-md border bg-card px-3 text-sm"
                  onChange={(event) => applyTemplate(event.target.value)}
                  value={selectedTemplateName}
                >
                  {eventTemplates.map((template) => (
                    <option key={template.name} value={template.name}>
                      {template.name}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
          </div>
          <Field label="Event name">
            <input
              className="h-10 w-full rounded-md border bg-card px-3 text-sm"
              onChange={(event) => setEventName(event.target.value)}
              required
              value={eventName}
            />
          </Field>
          <Field label="Event date">
            <input
              className="h-10 w-full rounded-md border bg-card px-3 text-sm"
              onChange={(event) => setEventDate(event.target.value)}
              required
              type="date"
              value={eventDate}
            />
          </Field>
          <Field label="Intensity">
            <select
              className="h-10 w-full rounded-md border bg-card px-3 text-sm"
              onChange={(event) => setIntensity(event.target.value as "low" | "medium" | "high")}
              value={intensity}
            >
              {intensityOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Owner">
            <select
              className="h-10 w-full rounded-md border bg-card px-3 text-sm"
              onChange={(event) => handleOwnerChange(event.target.value)}
              value={ownerId}
            >
              {profiles.map((profile) => (
                <option key={profile.id} value={profile.id}>
                  {profile.full_name} ({profile.role})
                </option>
              ))}
            </select>
          </Field>
          <Field label="Readiness percentage">
            <input
              className="h-10 w-full rounded-md border bg-card px-3 text-sm"
              max="100"
              min="0"
              onChange={(event) => setCompletion(event.target.value)}
              type="number"
              value={completion}
            />
          </Field>
          <Field className="lg:col-span-2" label="Description">
            <textarea
              className="min-h-20 w-full rounded-md border bg-card px-3 py-2 text-sm"
              onChange={(event) => setDescription(event.target.value)}
              value={description}
            />
          </Field>

          <div className="space-y-3 lg:col-span-2">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium">Milestones</p>
              <Button
                onClick={() => setMilestoneDrafts([...milestoneDrafts, emptyMilestoneDraft(profiles[0]?.id ?? "")])}
                type="button"
                variant="secondary"
              >
                Add milestone
              </Button>
            </div>
            {milestoneDrafts.map((milestone, index) => (
              <div className="grid gap-3 rounded-md border bg-background p-3 lg:grid-cols-2" key={index}>
                <Field label="Title">
                  <input
                    className="h-10 w-full rounded-md border bg-card px-3 text-sm"
                    onChange={(event) => updateMilestoneDraft(index, { title: event.target.value }, setMilestoneDrafts)}
                    value={milestone.title}
                  />
                </Field>
                <Field label="Owner">
                  <select
                    className="h-10 w-full rounded-md border bg-card px-3 text-sm"
                    onChange={(event) => updateMilestoneDraft(index, { owner_id: event.target.value }, setMilestoneDrafts)}
                    value={milestone.owner_id}
                  >
                    {profiles.map((profile) => (
                      <option key={profile.id} value={profile.id}>
                        {profile.full_name}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Due date">
                  <input
                    className="h-10 w-full rounded-md border bg-card px-3 text-sm"
                    onChange={(event) => updateMilestoneDraft(index, { due_date: event.target.value }, setMilestoneDrafts)}
                    type="date"
                    value={milestone.due_date}
                  />
                </Field>
                <Field label="Description">
                  <input
                    className="h-10 w-full rounded-md border bg-card px-3 text-sm"
                    onChange={(event) => updateMilestoneDraft(index, { description: event.target.value }, setMilestoneDrafts)}
                    value={milestone.description}
                  />
                </Field>
              </div>
            ))}
          </div>

          <div className="lg:col-span-2">
            <Button disabled={isSubmitting} type="submit">
              {isSubmitting ? "Creating..." : "Create event"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function EventDetail({
  event,
  currentUserId,
  activityLogs,
  isLeader,
  milestones,
}: {
  event: CalendarEvent | null;
  activityLogs: CalendarActivityLog[];
  currentUserId: string;
  isLeader: boolean;
  milestones: CalendarMilestone[];
}) {
  const router = useRouter();
  const [eventStatus, setEventStatus] = useState(event?.status ?? "planned");
  const [eventProgress, setEventProgress] = useState(String(event?.completion_percentage ?? 0));
  const [message, setMessage] = useState<FormMessage>(null);
  const [isSaving, setIsSaving] = useState(false);

  if (!event) {
    return (
      <Card>
        <CardHeader title="Event Detail" description="Select an event to see readiness and milestones." />
        <CardContent className="text-sm text-muted-foreground">No events available yet.</CardContent>
      </Card>
    );
  }

  const pendingMilestones = milestones.filter((milestone) => !doneMilestones.has(milestone.status));
  const delayedMilestones = milestones.filter((milestone) => milestone.status === "delayed" || milestone.status === "blocked");
  const reminderDates = getReminderDates(event.event_date, event.intensity);
  const eventId = event.id;
  const eventSchoolId = event.school_id;
  const previousEventStatus = event.status;
  const eventLogs = activityLogs.filter(
    (log) =>
      (log.entity_type === "event" && log.entity_id === event.id) ||
      (log.entity_type === "event_milestone" && milestones.some((milestone) => milestone.id === log.entity_id)),
  );

  async function saveEventStatus() {
    setMessage(null);
    const progress = Number(eventProgress);

    if (!Number.isFinite(progress) || progress < 0 || progress > 100) {
      setMessage({ type: "error", text: "Readiness percentage must be between 0 and 100." });
      return;
    }

    setIsSaving(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("events")
      .update({
        status: eventStatus,
        completion_percentage: progress,
      })
      .eq("id", eventId);
    setIsSaving(false);

    if (error) {
      setMessage({ type: "error", text: error.message });
      return;
    }

    if (previousEventStatus !== eventStatus) {
      await writeActivityLog({
        action: "status_changed",
        actorId: currentUserId,
        entityId: eventId,
        entityType: "event",
        oldValue: { status: previousEventStatus },
        newValue: { status: eventStatus, completion_percentage: progress },
        schoolId: eventSchoolId,
      });
    }

    setMessage({ type: "success", text: "Event updated." });
    router.refresh();
  }

  return (
    <Card>
      <CardHeader
        title={event.event_name}
        description={`${formatDate(event.event_date)} · Owner: ${event.ownerName}`}
        action={<Badge tone={intensityTone(event.intensity)}>{event.intensity}</Badge>}
      />
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          <MiniMetric label="Readiness" value={`${event.completion_percentage}%`} />
          <MiniMetric label="Pending milestones" value={String(pendingMilestones.length)} />
          <MiniMetric label="Delayed milestones" value={String(delayedMilestones.length)} danger={delayedMilestones.length > 0} />
          <MiniMetric label="Milestone owners" value={String(new Set(milestones.map((m) => m.owner_id).filter(Boolean)).size)} />
        </div>

        {event.description ? <p className="text-sm leading-6 text-muted-foreground">{event.description}</p> : null}

        {isLeader ? (
          <div className="grid gap-3 rounded-md border bg-background p-3 md:grid-cols-[1fr_1fr_auto]">
            <FormMessage message={message} />
            <Field label="Event status">
              <select
                className="h-10 w-full rounded-md border bg-card px-3 text-sm"
                onChange={(changeEvent) => setEventStatus(changeEvent.target.value)}
                value={eventStatus}
              >
                {eventStatusOptions.map((status) => (
                  <option key={status} value={status}>
                    {labelize(status)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Readiness percentage">
              <input
                className="h-10 w-full rounded-md border bg-card px-3 text-sm"
                max="100"
                min="0"
                onChange={(changeEvent) => setEventProgress(changeEvent.target.value)}
                type="number"
                value={eventProgress}
              />
            </Field>
            <div className="self-end">
              <Button disabled={isSaving} onClick={saveEventStatus} type="button">
                {isSaving ? "Saving..." : "Update event"}
              </Button>
            </div>
          </div>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
          <div>
            <h3 className="mb-3 text-sm font-semibold">Event Milestones</h3>
            {milestones.length > 0 ? (
              <div className="space-y-3">
                {milestones.map((milestone) => (
                  <MilestoneUpdateCard
                    currentUserId={currentUserId}
                    editable={!isLeader}
                    eventIntensity={event.intensity}
                    key={milestone.id}
                    milestone={milestone}
                  />
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No milestones added yet.</p>
            )}
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold">Reminder Dates</h3>
            <div className="space-y-2">
              {reminderDates.map((date) => (
                <div className="rounded-md border bg-background p-3 text-sm" key={date}>
                  {formatDate(date)}
                </div>
              ))}
            </div>
          </div>
        </div>

        {isLeader && milestones.length > 0 ? (
          <DataTable
            headers={["Milestone", "Owner", "Due", "Status", "Proof"]}
            rows={milestones.map((milestone) => [
              milestone.title,
              milestone.ownerName,
              formatDate(milestone.due_date),
              <Badge key={milestone.id} tone={milestoneTone(milestone.status)}>
                {labelize(milestone.status)}
              </Badge>,
              milestone.proof_url ? (
                <a
                  className="text-primary underline-offset-4 hover:underline"
                  href={milestone.proof_url.startsWith("http") ? milestone.proof_url : "#"}
                  key={`${milestone.id}-proof`}
                  rel="noreferrer"
                  target="_blank"
                >
                  Added
                </a>
              ) : (
                "Pending"
              ),
            ])}
          />
        ) : null}
        <ActivityLogList logs={eventLogs} />
      </CardContent>
    </Card>
  );
}

function MilestoneUpdateCard({
  currentUserId,
  editable = true,
  eventIntensity,
  milestone,
}: {
  currentUserId: string;
  editable?: boolean;
  eventIntensity?: CalendarEvent["intensity"];
  milestone: CalendarMilestone;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(milestone.status);
  const [delayReason, setDelayReason] = useState(milestone.delay_reason ?? "");
  const [proofUrl, setProofUrl] = useState(milestone.proof_url ?? "");
  const [message, setMessage] = useState<FormMessage>(null);
  const [isSaving, setIsSaving] = useState(false);

  async function saveMilestone() {
    setMessage(null);

    if ((status === "delayed" || status === "blocked") && !delayReason.trim()) {
      setMessage({ type: "error", text: "Add a reason for delayed or blocked milestones." });
      return;
    }

    setIsSaving(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("event_milestones")
      .update({
        status,
        delay_reason: status === "delayed" || status === "blocked" ? delayReason.trim() : delayReason.trim() || null,
        proof_url: proofUrl.trim() || null,
      })
      .eq("id", milestone.id);
    setIsSaving(false);

    if (error) {
      setMessage({ type: "error", text: error.message });
      return;
    }

    if (milestone.status !== status) {
      await writeActivityLog({
        action: "status_changed",
        actorId: currentUserId,
        entityId: milestone.id,
        entityType: "event_milestone",
        oldValue: { status: milestone.status },
        newValue: { status },
        schoolId: milestone.school_id,
      });
    }

    setMessage({ type: "success", text: "Milestone updated." });
    router.refresh();
  }

  return (
    <div className="rounded-md border bg-background p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium">{milestone.title}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {milestone.ownerName} · Due {formatDate(milestone.due_date)}
          </p>
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          {eventIntensity === "high" ? <Badge tone="warning">proof recommended</Badge> : null}
          <Badge tone={milestoneTone(status)}>{labelize(status)}</Badge>
        </div>
      </div>
      {milestone.description ? (
        <p className="mt-3 text-sm leading-6 text-muted-foreground">{milestone.description}</p>
      ) : null}

      {editable ? (
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <FormMessage message={message} />
          <Field label="Status">
            <select
              className="h-10 w-full rounded-md border bg-card px-3 text-sm"
              onChange={(event) => setStatus(event.target.value)}
              value={status}
            >
              {milestoneStatusOptions.map((option) => (
                <option key={option} value={option}>
                  {labelize(option)}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Proof URL">
            <ProofUpload
              module="event_milestones"
              onUploaded={async (path) => {
                setProofUrl(path);
                await createClient().from("event_milestones").update({ proof_url: path }).eq("id", milestone.id);
                await writeActivityLog({
                  action: "proof_uploaded",
                  actorId: currentUserId,
                  entityId: milestone.id,
                  entityType: "event_milestone",
                  newValue: { proof_url: path },
                  schoolId: milestone.school_id,
                });
              }}
              recordId={milestone.id}
              schoolId={milestone.school_id}
              value={proofUrl}
            />
          </Field>
          {(status === "delayed" || status === "blocked") ? (
            <Field className="md:col-span-2" label="Delay reason">
              <textarea
                className="min-h-20 w-full rounded-md border bg-card px-3 py-2 text-sm"
                onChange={(event) => setDelayReason(event.target.value)}
                value={delayReason}
              />
            </Field>
          ) : null}
          <div className="md:col-span-2">
            <Button disabled={isSaving} onClick={saveMilestone} type="button">
              {isSaving ? "Saving..." : "Update milestone"}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ActivityLogList({ logs }: { logs: CalendarActivityLog[] }) {
  return (
    <div className="rounded-md border bg-background p-3">
      <p className="text-sm font-semibold">Recent activity</p>
      {logs.length > 0 ? (
        <div className="mt-3 space-y-2">
          {logs.slice(0, 6).map((log) => (
            <div key={log.id} className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{log.actorName}</span> {labelize(log.action ?? "updated")} · {formatDate(log.created_at)}
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-2 text-sm text-muted-foreground">No activity logged yet.</p>
      )}
    </div>
  );
}

type FormMessage = {
  type: "success" | "error";
  text: string;
} | null;

type MilestoneDraft = {
  title: string;
  description: string;
  owner_id: string;
  due_date: string;
};

function emptyMilestoneDraft(ownerId: string): MilestoneDraft {
  return {
    title: "",
    description: "",
    owner_id: ownerId,
    due_date: "",
  };
}

function updateMilestoneDraft(
  index: number,
  patch: Partial<MilestoneDraft>,
  setMilestoneDrafts: React.Dispatch<React.SetStateAction<MilestoneDraft[]>>,
) {
  setMilestoneDrafts((drafts) =>
    drafts.map((draft, draftIndex) => (draftIndex === index ? { ...draft, ...patch } : draft)),
  );
}

function MonthGrid({
  events,
  onSelect,
  selectedEventId,
}: {
  events: CalendarEvent[];
  onSelect: (eventId: string) => void;
  selectedEventId: string;
}) {
  const month = new Date();
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const firstDay = new Date(year, monthIndex, 1);
  const startOffset = firstDay.getDay();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const cells = [
    ...Array.from({ length: startOffset }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
  ];

  return (
    <div>
      <div className="mb-3 text-sm font-semibold">
        {new Intl.DateTimeFormat("en", { month: "long", year: "numeric" }).format(month)}
      </div>
      <div className="grid grid-cols-7 gap-2 text-xs text-muted-foreground">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div key={day}>{day}</div>
        ))}
      </div>
      <div className="mt-2 grid grid-cols-7 gap-2">
        {cells.map((day, index) => {
          const date = day ? toDateKey(year, monthIndex, day) : "";
          const dayEvents = events.filter((event) => event.event_date === date);
          return (
            <div className="min-h-24 rounded-md border bg-background p-2" key={`${day ?? "blank"}-${index}`}>
              {day ? <p className="text-xs font-medium">{day}</p> : null}
              <div className="mt-2 space-y-1">
                {dayEvents.slice(0, 2).map((event) => (
                  <button
                    className={`w-full truncate rounded px-2 py-1 text-left text-xs ${
                      selectedEventId === event.id ? "bg-primary text-primary-foreground" : "bg-muted"
                    }`}
                    key={event.id}
                    onClick={() => onSelect(event.id)}
                    type="button"
                  >
                    {event.event_name}
                  </button>
                ))}
                {dayEvents.length > 2 ? (
                  <p className="text-xs text-muted-foreground">+{dayEvents.length - 2} more</p>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MiniMetric({ danger, label, value }: { danger?: boolean; label: string; value: string }) {
  return (
    <div className="rounded-md border bg-background p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`mt-2 text-2xl font-semibold ${danger ? "text-rose-700 dark:text-rose-300" : ""}`}>{value}</p>
    </div>
  );
}

function FormMessage({ message }: { message: FormMessage }) {
  if (!message) return null;
  return (
    <div
      className={`rounded-md border px-3 py-2 text-sm lg:col-span-2 md:col-span-2 ${
        message.type === "success"
          ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200"
          : "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-200"
      }`}
    >
      {message.text}
    </div>
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

function getReminderDates(eventDate: string, intensity: CalendarEvent["intensity"]) {
  const offsetsByIntensity = {
    low: [3, 1, 0],
    medium: [14, 7, 3, 1],
    high: [30, 21, 14, 7, 3, 1],
  };

  return offsetsByIntensity[intensity].map((offset) => {
    const date = new Date(eventDate);
    date.setDate(date.getDate() - offset);
    return date.toISOString().slice(0, 10);
  });
}

function toDateKey(year: number, monthIndex: number, day: number) {
  const date = new Date(year, monthIndex, day);
  return date.toISOString().slice(0, 10);
}

function formatDate(date: string | null) {
  if (!date) return "Not set";
  return new Intl.DateTimeFormat("en", { day: "2-digit", month: "short" }).format(new Date(date));
}

function labelize(value: string) {
  return value.replaceAll("_", " ");
}

function intensityTone(intensity: string) {
  if (intensity === "high") return "danger" as const;
  if (intensity === "medium") return "warning" as const;
  return "neutral" as const;
}

function milestoneTone(status: string) {
  if (status === "completed") return "success" as const;
  if (status === "delayed" || status === "blocked") return "danger" as const;
  if (status === "in_progress") return "info" as const;
  return "warning" as const;
}
