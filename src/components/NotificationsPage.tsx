import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NotificationSettings } from "./NotificationSettings";
import { AllNotifications } from "./AllNotifications";

export function NotificationsPage() {
  return (
    <Tabs defaultValue="all" className="w-full">
      <TabsList className="w-full justify-start mb-6">
        <TabsTrigger value="all">All Notifications</TabsTrigger>
        <TabsTrigger value="settings">Notification Settings</TabsTrigger>
      </TabsList>
      <TabsContent value="all">
        <AllNotifications />
      </TabsContent>
      <TabsContent value="settings">
        <NotificationSettings />
      </TabsContent>
    </Tabs>
  );
}
