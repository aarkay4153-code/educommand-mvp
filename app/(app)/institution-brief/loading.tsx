import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function InstitutionBriefLoading() {
  return (
    <div className="space-y-6">
      <div>
        <div className="h-8 w-56 rounded-md bg-muted" />
        <div className="mt-3 h-4 w-full max-w-3xl rounded-md bg-muted" />
      </div>
      <Card>
        <CardHeader title="Loading institution brief" description="Preparing the printable institution snapshot." />
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <div className="h-20 rounded-md bg-muted" key={index} />
            ))}
          </div>
        </CardContent>
      </Card>
      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardContent>
            <div className="h-40 rounded-md bg-muted" />
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <div className="h-40 rounded-md bg-muted" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
