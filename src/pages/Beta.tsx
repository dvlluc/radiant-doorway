import { useState } from "react";
import { Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";
import { AlertCircle, Beaker, MessageSquare, Rocket } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const feedbackSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  email: z.string().trim().email("Invalid email address").max(255),
  feedback: z.string().trim().min(10, "Feedback must be at least 10 characters").max(2000, "Feedback must be less than 2000 characters"),
  category: z.enum(["bug", "feature", "usability", "other"]),
  subject: z.string().trim().min(1, "Subject is required").max(200)
});

const Beta = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [feedback, setFeedback] = useState("");
  const [category, setCategory] = useState("feature");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const validatedData = feedbackSchema.parse({ name, email, subject, feedback, category });
      setIsSubmitting(true);

      // Send feedback email to support@bellonecta.com
      const { error } = await supabase.functions.invoke('support-email', {
        body: {
          fullName: validatedData.name,
          email: validatedData.email,
          subject: validatedData.subject,
          category: `Beta Feedback - ${validatedData.category}`,
          message: validatedData.feedback,
          priority: 'normal'
        }
      });

      if (error) throw error;

      toast({
        title: "Feedback Submitted",
        description: "Thank you for helping us improve BelloNecta! We'll get back to you soon.",
      });

      // Reset form
      setName("");
      setEmail("");
      setSubject("");
      setFeedback("");
      setCategory("feature");
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Validation Error",
          description: error.errors[0].message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to submit feedback. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <SEO
        title="Beta Program - BelloNecta"
        description="Join the BelloNecta beta program and help us shape the future of beauty connections. Provide feedback and be part of our journey."
        keywords="BelloNecta beta, beta testing, feedback, beauty platform beta"
      />
      <div className="min-h-screen w-full bg-background">
        <Header />
        <div className="flex pt-16">
          <Sidebar />
          <main className="flex-1 ml-64 p-8">
            <div className="max-w-4xl mx-auto space-y-8">
              {/* Hero Section */}
              <div className="text-center space-y-4">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-muted rounded-full text-foreground">
                  <Beaker className="w-5 h-5" />
                  <span className="font-semibold">Beta Program</span>
                </div>
                <h1 className="text-4xl md:text-5xl font-bold">Welcome to BelloNecta Beta</h1>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                  You're experiencing the future of beauty connections. Your feedback shapes our platform.
                </p>
              </div>

              {/* Beta Notice Alert */}
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Beta Testing in Progress</AlertTitle>
                <AlertDescription>
                  This platform is currently in beta. Some features may be incomplete or experimental. 
                  We appreciate your patience and feedback as we work to improve your experience.
                </AlertDescription>
              </Alert>

              {/* About the Beta Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Rocket className="w-5 h-5 text-foreground" />
                    About BelloNecta Beta
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">Our Mission</h3>
                    <p className="text-muted-foreground">
                      BelloNecta is revolutionizing how beauty professionals connect with clients, 
                      brands, and opportunities. We're building a comprehensive platform that combines social networking, 
                      booking services, marketplace functionality, and career development tools—all in one place.
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold mb-2">Beta Program Purpose</h3>
                    <p className="text-muted-foreground">
                      During this beta phase, we're testing core features, gathering user insights, and refining 
                      the platform based on real-world usage. Your participation helps us identify issues, 
                      understand user needs, and prioritize feature development.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">What to Expect</h3>
                    <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                      <li>Regular updates and new feature releases</li>
                      <li>Occasional bugs or performance issues as we optimize</li>
                      <li>Changes to features based on user feedback</li>
                      <li>Early access to new tools before public release</li>
                      <li>Direct impact on the platform's evolution</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              {/* Feedback Form */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-foreground" />
                    Share Your Feedback
                  </CardTitle>
                  <CardDescription>
                    Your insights are invaluable. Tell us about your experience, report bugs, or suggest features.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Name *</Label>
                        <Input
                          id="name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Your name"
                          required
                          maxLength={100}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email *</Label>
                        <Input
                          id="email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="your.email@example.com"
                          required
                          maxLength={255}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="subject">Subject *</Label>
                      <Input
                        id="subject"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        placeholder="Brief summary of your feedback"
                        required
                        maxLength={200}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="category">Feedback Type *</Label>
                      <select
                        id="category"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        required
                      >
                        <option value="feature">Feature Request</option>
                        <option value="bug">Bug Report</option>
                        <option value="usability">Usability Issue</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="feedback">Your Feedback *</Label>
                      <Textarea
                        id="feedback"
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        placeholder="Tell us about your experience, report an issue, or suggest a feature..."
                        className="min-h-[150px]"
                        required
                        maxLength={2000}
                      />
                      <p className="text-xs text-muted-foreground">
                        {feedback.length}/2000 characters
                      </p>
                    </div>

                    <Button type="submit" disabled={isSubmitting} className="w-full">
                      {isSubmitting ? "Submitting..." : "Submit Feedback"}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Additional Resources */}
              <Card>
                <CardHeader>
                  <CardTitle>Need More Help?</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-muted-foreground">
                    For technical support, billing questions, or general inquiries, visit our{" "}
                    <Link to="/help" className="text-foreground hover:underline">Help Center</Link>.
                  </p>
                  <p className="text-muted-foreground">
                    Review our{" "}
                    <Link to="/terms" className="text-foreground hover:underline">Terms of Service</Link> and{" "}
                    <Link to="/privacy" className="text-foreground hover:underline">Privacy Policy</Link>.
                  </p>
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>
    </>
  );
};

export default Beta;
