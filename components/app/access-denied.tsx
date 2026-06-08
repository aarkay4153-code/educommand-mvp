import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function AccessDenied({
  message = "Your current role does not have access to this section.",
  title = "Access denied",
}: {
  message?: string;
  title?: string;
}) {
  return (
    <Card>
      <CardHeader title={title} description="EduCommand keeps each workspace scoped by role." />
      <CardContent className="text-sm leading-6 text-muted-foreground">{message}</CardContent>
    </Card>
  );
}
