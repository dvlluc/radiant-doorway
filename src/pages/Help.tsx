import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { SupportForm } from "@/components/SupportForm";
import { Mail, HelpCircle, ArrowLeft } from "lucide-react";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { useNavigate, useSearchParams } from "react-router-dom";

const Help = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const defaultTab = searchParams.get("tab") || "whatsapp";

  const faqs = [
    {
      question: "How do I book an appointment with a beauty professional?",
      answer: "Navigate to the Directory page, browse professionals, and click on their profile. You'll find a 'Book Appointment' button that will guide you through selecting services, date, and time."
    },
    {
      question: "How can I join BelloNecta as a beauty professional?",
      answer: "Click 'Sign Up' in the top right corner and create your account. Once registered, you can set up your professional profile, list your services, and start accepting bookings."
    },
    {
      question: "What services are available on BelloNecta?",
      answer: "BelloNecta offers a wide range of beauty services including hair styling, makeup, nails, skincare, massage, and more. You can browse all available services in our Directory."
    },
    {
      question: "How do I cancel or reschedule an appointment?",
      answer: "Go to your Account page and navigate to your bookings. Select the appointment you want to modify and choose either 'Reschedule' or 'Cancel'. Please note our cancellation policy."
    },
    {
      question: "What payment methods do you accept?",
      answer: "We accept all major credit cards, debit cards, and secure online payment methods. Payment is processed at the time of booking."
    },
    {
      question: "How does the Virtual Try-On feature work?",
      answer: "Navigate to the Virtual Try-On page, allow camera access, and try different beauty products virtually on your face in real-time using AR technology."
    },
    {
      question: "Can I sell products on the Marketplace?",
      answer: "Yes! Beauty professionals can list products for sale in our Marketplace. Contact our support team to learn more about becoming a seller."
    },
    {
      question: "How do I find beauty industry jobs?",
      answer: "Visit our Jobs page to browse current openings, filter by location and specialization, and apply directly through the platform."
    }
  ];

  return (
    <>
      <SEO 
        title="Help & Support - BelloNecta"
        description="Get help and support for using the BelloNecta platform. Live chat, email support, and FAQs available."
      />
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate(-1)}
            className="gap-2 mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
        </div>
        <div className="max-w-7xl mx-auto px-4 pb-12">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold mb-4">Help & Support</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              We're here to help you with any questions or issues you might have. Choose how you'd like to get support.
            </p>
          </div>

          {/* Support Options Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {/* WhatsApp Support Card */}
            <Card className="text-center hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="pt-8 pb-6 flex flex-col h-full">
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center">
                    <WhatsAppIcon className="w-8 h-8 text-green-600" />
                  </div>
                </div>
                <h3 className="text-xl font-semibold mb-2">WhatsApp Support</h3>
                <p className="text-muted-foreground mb-4 flex-grow">
                  Message us directly on WhatsApp
                </p>
                <Badge variant="secondary" className="bg-foreground text-background hover:bg-foreground/90 mx-auto text-xs px-3 py-1">
                  Available Now
                </Badge>
              </CardContent>
            </Card>

            {/* Email Support Card */}
            <Card className="text-center hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="pt-8 pb-6 flex flex-col h-full">
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <Mail className="w-8 h-8 text-primary" />
                  </div>
                </div>
                <h3 className="text-xl font-semibold mb-2">Email Support</h3>
                <p className="text-muted-foreground mb-4 flex-grow">
                  Send us a detailed message
                </p>
                <Badge variant="secondary" className="bg-foreground text-background hover:bg-foreground/90 mx-auto text-xs px-3 py-1">
                  24h Response
                </Badge>
              </CardContent>
            </Card>

            {/* FAQ Card */}
            <Card className="text-center hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="pt-8 pb-6 flex flex-col h-full">
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <HelpCircle className="w-8 h-8 text-primary" />
                  </div>
                </div>
                <h3 className="text-xl font-semibold mb-2">FAQ</h3>
                <p className="text-muted-foreground mb-4 flex-grow">
                  Find answers to common questions
                </p>
                <Badge variant="secondary" className="bg-foreground text-background hover:bg-foreground/90 mx-auto text-xs px-3 py-1">
                  Instant Answers
                </Badge>
              </CardContent>
            </Card>
          </div>

          {/* Tabbed Content */}
          <Tabs defaultValue={defaultTab} className="w-full">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-3 mb-8">
              <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
              <TabsTrigger value="email">Email Support</TabsTrigger>
              <TabsTrigger value="faq">FAQ</TabsTrigger>
            </TabsList>

            {/* WhatsApp Support Tab */}
            <TabsContent value="whatsapp" className="space-y-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 mb-4">
                    <WhatsAppIcon className="w-5 h-5 text-green-600" />
                    <h3 className="text-xl font-semibold">WhatsApp Support</h3>
                    <Badge variant="secondary" className="ml-2 bg-green-500/10 text-green-600">
                      Online
                    </Badge>
                  </div>
                  <div className="text-center py-8 space-y-4">
                    <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mx-auto">
                      <WhatsAppIcon className="w-10 h-10 text-green-600" />
                    </div>
                    <h4 className="text-lg font-semibold">Chat with us on WhatsApp</h4>
                    <p className="text-muted-foreground max-w-md mx-auto">
                      Get quick support by messaging us directly on WhatsApp. Our team is ready to help you with any questions.
                    </p>
                    <Button
                      className="bg-green-600 hover:bg-green-700 text-white gap-2"
                      onClick={() => window.open("https://wa.me/13025389413", "_blank")}
                    >
                      <WhatsAppIcon className="w-4 h-4" />
                      Open WhatsApp
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Email Support Tab */}
            <TabsContent value="email" className="space-y-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 mb-6">
                    <Mail className="w-5 h-5 text-primary" />
                    <h3 className="text-xl font-semibold">Email Support</h3>
                  </div>
                  <SupportForm />
                </CardContent>
              </Card>
            </TabsContent>

            {/* FAQ Tab */}
            <TabsContent value="faq" className="space-y-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 mb-6">
                    <HelpCircle className="w-5 h-5 text-primary" />
                    <h3 className="text-xl font-semibold">Frequently Asked Questions</h3>
                  </div>
                  <Accordion type="single" collapsible className="w-full">
                    {faqs.map((faq, index) => (
                      <AccordionItem key={index} value={`item-${index}`}>
                        <AccordionTrigger className="text-left">
                          {faq.question}
                        </AccordionTrigger>
                        <AccordionContent className="text-muted-foreground">
                          {faq.answer}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
};

export default Help;
