import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, FileText, Briefcase, Calendar, TrendingUp } from "lucide-react";

interface Stats {
  totalUsers: number;
  totalPosts: number;
  totalJobs: number;
  totalEvents: number;
  newUsersToday: number;
  newPostsToday: number;
}

export function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalPosts: 0,
    totalJobs: 0,
    totalEvents: 0,
    newUsersToday: 0,
    newPostsToday: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Get total users
        const { count: totalUsers } = await supabase
          .from("profiles")
          .select("*", { count: "exact", head: true });

        // Get total posts
        const { count: totalPosts } = await supabase
          .from("posts")
          .select("*", { count: "exact", head: true });

        // Get total jobs
        const { count: totalJobs } = await supabase
          .from("jobs")
          .select("*", { count: "exact", head: true });

        // Get total events
        const { count: totalEvents } = await supabase
          .from("events")
          .select("*", { count: "exact", head: true });

        // Get new users today
        const { count: newUsersToday } = await supabase
          .from("profiles")
          .select("*", { count: "exact", head: true })
          .gte("created_at", today.toISOString());

        // Get new posts today
        const { count: newPostsToday } = await supabase
          .from("posts")
          .select("*", { count: "exact", head: true })
          .gte("created_at", today.toISOString());

        setStats({
          totalUsers: totalUsers || 0,
          totalPosts: totalPosts || 0,
          totalJobs: totalJobs || 0,
          totalEvents: totalEvents || 0,
          newUsersToday: newUsersToday || 0,
          newPostsToday: newPostsToday || 0,
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const statCards = [
    {
      title: "Total Users",
      value: stats.totalUsers,
      icon: Users,
      description: `+${stats.newUsersToday} today`,
    },
    {
      title: "Total Posts",
      value: stats.totalPosts,
      icon: FileText,
      description: `+${stats.newPostsToday} today`,
    },
    {
      title: "Total Jobs",
      value: stats.totalJobs,
      icon: Briefcase,
      description: "Active listings",
    },
    {
      title: "Total Events",
      value: stats.totalEvents,
      icon: Calendar,
      description: "Upcoming events",
    },
  ];

  if (loading) {
    return <div>Loading stats...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Platform Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">User Growth</span>
              <span className="text-sm text-muted-foreground">
                {stats.newUsersToday > 0 ? `+${((stats.newUsersToday / stats.totalUsers) * 100).toFixed(1)}%` : "0%"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Content Activity</span>
              <span className="text-sm text-muted-foreground">
                {stats.newPostsToday > 0 ? `+${((stats.newPostsToday / stats.totalPosts) * 100).toFixed(1)}%` : "0%"}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
