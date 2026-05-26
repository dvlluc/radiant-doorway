import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Copy, Check } from "lucide-react";

interface TestAccountResult {
  email: string;
  password?: string;
  accountType: string;
  success: boolean;
  error?: string;
  userId?: string;
}

export default function CreateTestAccounts() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<TestAccountResult[]>([]);
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);

  const createAccounts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-test-accounts");

      if (error) throw error;

      setResults(data.results);
      const successCount = data.results.filter((r: TestAccountResult) => r.success).length;
      toast.success(`Created ${successCount} test accounts successfully!`);
    } catch (error: any) {
      console.error("Error creating test accounts:", error);
      toast.error("Failed to create test accounts: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const copyCredentials = (email: string, password: string) => {
    navigator.clipboard.writeText(`Email: ${email}\nPassword: ${password}`);
    setCopiedEmail(email);
    setTimeout(() => setCopiedEmail(null), 2000);
    toast.success("Credentials copied to clipboard!");
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Create Test Accounts</h1>
          <p className="text-muted-foreground mt-2">
            Generate test accounts for system testing
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Test Account Generator</CardTitle>
            <CardDescription>
              This will create 7 test accounts across all account types:
              <ul className="mt-2 space-y-1 list-disc list-inside">
                <li>3 Individual accounts</li>
                <li>2 Business accounts (Hair Salon & Nail Salon)</li>
                <li>1 Brand account</li>
                <li>1 Charitable Partner account</li>
              </ul>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={createAccounts} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Test Accounts
            </Button>
          </CardContent>
        </Card>

        {results.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Created Accounts</CardTitle>
              <CardDescription>
                Save these credentials for testing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {results.map((result) => (
                  <div
                    key={result.email}
                    className={`p-4 rounded-lg border ${
                      result.success
                        ? "bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-900"
                        : "bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-900"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{result.email}</span>
                          <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
                            {result.accountType}
                          </span>
                        </div>
                        {result.success && result.password && (
                          <div className="text-sm text-muted-foreground">
                            Password: <code className="bg-muted px-2 py-0.5 rounded">{result.password}</code>
                          </div>
                        )}
                        {!result.success && result.error && (
                          <div className="text-sm text-red-600 dark:text-red-400">
                            Error: {result.error}
                          </div>
                        )}
                      </div>
                      {result.success && result.password && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyCredentials(result.email, result.password!)}
                        >
                          {copiedEmail === result.email ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
