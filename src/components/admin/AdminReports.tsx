import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function AdminReports() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Content Reports</CardTitle>
        <CardDescription>User content reports are not available — the posts feature has been removed.</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">No reports to review.</p>
      </CardContent>
    </Card>
  );
}
