import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function AdminAnalytics() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Analytics</CardTitle>
        <CardDescription>Platform analytics and insights</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">Advanced analytics coming soon...</p>
      </CardContent>
    </Card>
  );
}
