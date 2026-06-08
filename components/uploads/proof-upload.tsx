"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

const bucketName = "proof-uploads";
const maxFileSizeBytes = 5 * 1024 * 1024;
const allowedMimeTypes = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

export function ProofUpload({
  disabled,
  module,
  onUploaded,
  recordId,
  schoolId,
  value,
}: {
  disabled?: boolean;
  module: "tasks" | "syllabus_updates" | "event_milestones";
  onUploaded: (path: string) => void | Promise<void>;
  recordId: string;
  schoolId: string;
  value: string | null;
}) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedPublicUrl, setUploadedPublicUrl] = useState<string | null>(null);
  const linkUrl = useMemo(() => {
    if (!value) return uploadedPublicUrl;
    if (value.startsWith("http://") || value.startsWith("https://")) return value;

    const supabase = createClient();
    const { data } = supabase.storage.from(bucketName).getPublicUrl(value);
    return data.publicUrl;
  }, [uploadedPublicUrl, value]);

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    setError(null);

    if (!file) return;

    if (!allowedMimeTypes.has(file.type)) {
      setError("Allowed files: PDF, JPG, PNG, DOC, or DOCX.");
      return;
    }

    if (file.size > maxFileSizeBytes) {
      setError("File must be 5 MB or smaller.");
      return;
    }

    setIsUploading(true);
    const supabase = createClient();
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
    const path = `${schoolId}/${module}/${recordId}/${Date.now()}-${safeName}`;
    const { error: uploadError } = await supabase.storage.from(bucketName).upload(path, file, {
      upsert: true,
    });
    setIsUploading(false);

    if (uploadError) {
      setError(uploadError.message);
      return;
    }

    const { data } = supabase.storage.from(bucketName).getPublicUrl(path);
    setUploadedPublicUrl(data.publicUrl);
    await onUploaded(path);
  }

  return (
    <div className="space-y-2">
      {value ? (
        <a
          className="text-sm font-medium text-primary underline-offset-4 hover:underline"
          href={linkUrl ?? "#"}
          rel="noreferrer"
          target="_blank"
        >
          View uploaded proof
        </a>
      ) : (
        <p className="text-sm text-muted-foreground">No proof uploaded yet.</p>
      )}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <input
          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,application/pdf,image/jpeg,image/png,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          className="w-full rounded-md border bg-card px-3 py-2 text-sm"
          disabled={disabled || isUploading}
          onChange={handleFileChange}
          type="file"
        />
        <Button disabled type="button" variant="ghost">
          {isUploading ? "Uploading..." : "Max 5 MB"}
        </Button>
      </div>
      {error ? <p className="text-sm text-rose-700 dark:text-rose-300">{error}</p> : null}
    </div>
  );
}
