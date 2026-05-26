import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface Report {
  id: string;
  post_id: string;
  reporter_id: string;
  reason: string;
  created_at: string;
  profiles: {
    first_name: string;
    last_name: string;
  };
}

export function AdminReports() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const { data, error } = await supabase
        .from("post_reports")
        .select("id, post_id, reporter_id, reason, created_at")
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;

      // Fetch reporter profiles separately
      const reportsWithProfiles = await Promise.all(
        (data || []).map(async (report) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("first_name, last_name")
            .eq("id", report.reporter_id)
            .single();

          return {
            ...report,
            profiles: profile || { first_name: "Unknown", last_name: "User" },
          };
        })
      );

      setReports(reportsWithProfiles as Report[]);
    } catch (error) {
      console.error("Error fetching reports:", error);
      toast.error("Failed to load reports");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Content Reports</CardTitle>
        <CardDescription>Review and manage user reports</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div>Loading reports...</div>
        ) : reports.length === 0 ? (
          <p className="text-muted-foreground">No reports to review</p>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reporter</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell>
                      {report.profiles?.first_name} {report.profiles?.last_name}
                    </TableCell>
                    <TableCell>{report.reason}</TableCell>
                    <TableCell>{new Date(report.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm">
                          View Post
                        </Button>
                        <Button variant="outline" size="sm">
                          Dismiss
                        </Button>
                        <Button variant="destructive" size="sm">
                          Remove Post
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
