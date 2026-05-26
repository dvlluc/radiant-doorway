import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Save, Eye } from "lucide-react";

export function AdminPolicies() {
  const [termsContent, setTermsContent] = useState("");
  const [privacyContent, setPrivacyContent] = useState("");
  const [refundContent, setRefundContent] = useState("");
  const [communityContent, setCommunityContent] = useState("");

  const handleSave = (policyType: string) => {
    // In a real implementation, this would save to the database
    toast.success(`${policyType} policy updated successfully`);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Policy Management</CardTitle>
        <CardDescription>Manage platform policies and terms</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="terms" className="space-y-4">
          <TabsList>
            <TabsTrigger value="terms">Terms of Service</TabsTrigger>
            <TabsTrigger value="privacy">Privacy Policy</TabsTrigger>
            <TabsTrigger value="refund">Refund Policy</TabsTrigger>
            <TabsTrigger value="community">Community Guidelines</TabsTrigger>
          </TabsList>

          <TabsContent value="terms" className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Terms of Service Content</Label>
                <Button variant="outline" size="sm">
                  <Eye className="h-4 w-4 mr-2" />
                  Preview
                </Button>
              </div>
              <Textarea
                placeholder="Enter terms of service content..."
                value={termsContent}
                onChange={(e) => setTermsContent(e.target.value)}
                className="min-h-[400px] font-mono text-sm"
              />
              <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">
                  Last updated: {new Date().toLocaleDateString()}
                </p>
                <Button onClick={() => handleSave("Terms of Service")}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="privacy" className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Privacy Policy Content</Label>
                <Button variant="outline" size="sm">
                  <Eye className="h-4 w-4 mr-2" />
                  Preview
                </Button>
              </div>
              <Textarea
                placeholder="Enter privacy policy content..."
                value={privacyContent}
                onChange={(e) => setPrivacyContent(e.target.value)}
                className="min-h-[400px] font-mono text-sm"
              />
              <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">
                  Last updated: {new Date().toLocaleDateString()}
                </p>
                <Button onClick={() => handleSave("Privacy Policy")}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="refund" className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Refund Policy Content</Label>
                <Button variant="outline" size="sm">
                  <Eye className="h-4 w-4 mr-2" />
                  Preview
                </Button>
              </div>
              <Textarea
                placeholder="Enter refund policy content..."
                value={refundContent}
                onChange={(e) => setRefundContent(e.target.value)}
                className="min-h-[400px] font-mono text-sm"
              />
              <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">
                  Last updated: {new Date().toLocaleDateString()}
                </p>
                <Button onClick={() => handleSave("Refund Policy")}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="community" className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Community Guidelines Content</Label>
                <Button variant="outline" size="sm">
                  <Eye className="h-4 w-4 mr-2" />
                  Preview
                </Button>
              </div>
              <Textarea
                placeholder="Enter community guidelines content..."
                value={communityContent}
                onChange={(e) => setCommunityContent(e.target.value)}
                className="min-h-[400px] font-mono text-sm"
              />
              <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">
                  Last updated: {new Date().toLocaleDateString()}
                </p>
                <Button onClick={() => handleSave("Community Guidelines")}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
