import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

interface NotificationSetting {
  id: string;
  title: string;
  description: string;
  enabled: boolean;
}

export function NotificationSettings() {
  const [settings, setSettings] = useState<NotificationSetting[]>([
    {
      id: "email",
      title: "Email Notifications",
      description: "Receive updates about bookings and messages",
      enabled: true
    },
    {
      id: "sms",
      title: "SMS Notifications",
      description: "Get appointment reminders via text",
      enabled: true
    },
    {
      id: "push",
      title: "Push Notifications",
      description: "Browser notifications for real-time updates",
      enabled: false
    },
    {
      id: "bookings",
      title: "Booking Notifications",
      description: "Updates about your appointments and bookings",
      enabled: true
    }
  ]);

  const handleToggleSetting = (id: string) => {
    setSettings(settings.map(setting => 
      setting.id === id ? { ...setting, enabled: !setting.enabled } : setting
    ));
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-muted-foreground">
          Customize how and when you receive notifications
        </p>
      </div>

      <Card>
        <CardContent className="p-6">
          <h2 className="text-xl font-semibold mb-6">Notification Preferences</h2>
          
          <div className="space-y-6">
            {settings.map((setting) => (
              <div key={setting.id} className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-medium mb-1">{setting.title}</h3>
                  <p className="text-sm text-muted-foreground">{setting.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "text-sm font-medium",
                    setting.enabled ? "text-green-600" : "text-muted-foreground"
                  )}>
                    {setting.enabled ? "Enabled" : "Disabled"}
                  </span>
                  <Switch
                    checked={setting.enabled}
                    onCheckedChange={() => handleToggleSetting(setting.id)}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <h2 className="text-xl font-semibold mb-4">Notification Delivery</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Control how quickly you receive notifications
          </p>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h3 className="font-medium">Instant Notifications</h3>
                <p className="text-sm text-muted-foreground">Receive notifications immediately</p>
              </div>
              <Switch defaultChecked />
            </div>
            
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h3 className="font-medium">Daily Digest</h3>
                <p className="text-sm text-muted-foreground">Get a summary once per day</p>
              </div>
              <Switch />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
