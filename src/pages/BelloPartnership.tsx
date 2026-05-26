import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Heart, FileCheck, Globe, Gift, DollarSign, Calendar, ArrowLeft, ArrowRight } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { formatPhoneForTwilio, formatPhoneInput } from "@/utils/phoneFormat";

const BelloPartnership = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [formData, setFormData] = useState({
    charityName: "",
    contactPerson: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    stateProvince: "",
    zipPostalCode: "",
    country: "",
    telephone: "",
    email: "",
    website: "",
    registrationNumber: "",
    charityOverview: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.functions.invoke('send-partnership-application', {
        body: formData
      });

      if (error) throw error;

      toast({
        title: "Application Submitted!",
        description: "Thank you for your interest. We will review your application and respond within 10 working days.",
      });

      // Reset form
      setFormData({
        charityName: "",
        contactPerson: "",
        addressLine1: "",
        addressLine2: "",
        city: "",
        stateProvince: "",
        zipPostalCode: "",
        country: "",
        telephone: "",
        email: "",
        website: "",
        registrationNumber: "",
        charityOverview: "",
      });
    } catch (error) {
      console.error("Error submitting application:", error);
      toast({
        title: "Submission Failed",
        description: "There was an error submitting your application. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <>
      <SEO 
        title="Bello Partnership - BelloNecta"
        description="Making a positive impact in communities worldwide through our charitable partnership program."
      />
      <div className="min-h-screen bg-background">
        <main className="flex-1 bg-background">
          <div className="max-w-7xl mx-auto px-6 py-12">
            {/* Back Button */}
            <Button 
              variant="ghost" 
              onClick={() => navigate(-1)}
              className="mb-4"
            >
              <ArrowLeft className="mr-2 w-4 h-4" />
              Back
            </Button>

            {/* Header */}
            <div className="flex flex-col items-center text-center gap-4 mb-8">
              <Heart className="w-10 h-10" />
              <div>
                <h1 className="text-4xl font-bold">Bello Partnership</h1>
                <p className="text-muted-foreground">Making a positive impact in communities worldwide</p>
              </div>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="mb-8">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="apply">Apply</TabsTrigger>
              </TabsList>

              <TabsContent value="overview">
                {/* Our Mission */}
                <Card className="mb-8 border-2">
                  <CardContent className="p-8">
                    <div className="flex items-start gap-4 mb-6">
                      <Heart className="w-8 h-8 flex-shrink-0" />
                      <h2 className="text-3xl font-bold">Our Mission</h2>
                    </div>
                    <div className="space-y-4 text-muted-foreground">
                      <p>
                        BelloNecta is the world's first comprehensive and inclusive social networking platform that caters exclusively to the beauty industry. Our mission is to create a vibrant and interactive community where beauty professionals and enthusiasts can connect, collaborate, and share their passion for all things beauty.
                      </p>
                      <p>
                        It is our goal not only to make a significant positive impact in the lives of those who seek to enhance their beauty but also to make a positive impact within all communities across the globe.
                      </p>
                      <div className="bg-muted p-6 rounded-lg border-l-4 border-primary mt-6">
                        <p className="font-medium">
                          To further this goal we have established a charitable program called <strong>Bello Partnership</strong>. Our program seeks to forge formidable partnerships with charitable organizations that share the same values as those aligned with our brand.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* How Bello Partnership Works */}
                <Card className="border-2">
                  <CardContent className="p-8">
                    <div className="flex items-start gap-4 mb-8">
                      <Users className="w-8 h-8 flex-shrink-0" />
                      <h2 className="text-3xl font-bold">How Bello Partnership Works</h2>
                    </div>
                    <div className="space-y-6">
                      <div className="flex gap-6">
                        <div className="w-12 h-12 rounded-full bg-black text-white flex items-center justify-center flex-shrink-0 text-xl font-bold">
                          1
                        </div>
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <FileCheck className="w-5 h-5" />
                            <h3 className="text-xl font-bold">Submit Application</h3>
                          </div>
                          <p className="text-muted-foreground">
                            Prospective partners submit a short application to register interest in our program
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-6">
                        <div className="w-12 h-12 rounded-full bg-black text-white flex items-center justify-center flex-shrink-0 text-xl font-bold">
                          2
                        </div>
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <FileCheck className="w-5 h-5" />
                            <h3 className="text-xl font-bold">Review Process</h3>
                          </div>
                          <p className="text-muted-foreground">
                            All applications are reviewed and if approval is granted, a formal partnership agreement is established
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-6">
                        <div className="w-12 h-12 rounded-full bg-black text-white flex items-center justify-center flex-shrink-0 text-xl font-bold">
                          3
                        </div>
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <Globe className="w-5 h-5" />
                            <h3 className="text-xl font-bold">Platform Listing</h3>
                          </div>
                          <p className="text-muted-foreground">
                            Organization summary, contact details posted under the Impact page on Bello Partnership platform
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-6">
                        <div className="w-12 h-12 rounded-full bg-black text-white flex items-center justify-center flex-shrink-0 text-xl font-bold">
                          4
                        </div>
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <Gift className="w-5 h-5" />
                            <h3 className="text-xl font-bold">Free Advertising</h3>
                          </div>
                          <p className="text-muted-foreground">
                            Partners get 3 free one-week adverts on our Community Forum throughout the year
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-6">
                        <div className="w-12 h-12 rounded-full bg-black text-white flex items-center justify-center flex-shrink-0 text-xl font-bold">
                          5
                        </div>
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <DollarSign className="w-5 h-5" />
                            <h3 className="text-xl font-bold">Financial Contributions</h3>
                          </div>
                          <p className="text-muted-foreground">
                            Brands can make financial contributions to charitable partners when purchasing adverts
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-6">
                        <div className="w-12 h-12 rounded-full bg-black text-white flex items-center justify-center flex-shrink-0 text-xl font-bold">
                          6
                        </div>
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <Calendar className="w-5 h-5" />
                            <h3 className="text-xl font-bold">Monitoring & Payments</h3>
                          </div>
                          <p className="text-muted-foreground">
                            Partners can monitor contributions and receive quarterly payments
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-8 flex justify-center">
                      <Button size="lg" className="gap-2" onClick={() => setActiveTab("apply")}>
                        Apply for Partnership
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="apply">
                <Card className="border-2">
                  <CardContent className="p-8">
                    <div className="flex items-center gap-3 mb-4">
                      <FileCheck className="w-6 h-6" />
                      <h2 className="text-2xl font-bold">Bello Partnership Registration Form</h2>
                    </div>
                    <p className="text-muted-foreground mb-8">
                      Complete the form below to register your interest in our partnership program. We aim to respond to all applications within 10 working days.
                    </p>

                    {/* Partnership Benefits */}
                    <div className="bg-primary/5 border border-primary/20 rounded-lg p-6 mb-8">
                      <h3 className="font-semibold text-lg mb-4">Partnership Benefits</h3>
                      <ul className="space-y-2 text-sm text-primary">
                        <li>• Free listing on our Impact page</li>
                        <li>• Three free one-week advertisements per year</li>
                        <li>• Access to financial contributions from our advertising partners</li>
                        <li>• Quarterly payment processing</li>
                        <li>• Contribution monitoring dashboard</li>
                      </ul>
                      <p className="text-xs text-muted-foreground italic mt-4">*Terms and conditions apply.</p>
                    </div>

                    {/* Registration Form */}
                    <form className="space-y-8" onSubmit={handleSubmit}>
                      {/* Name of Charity and Contact Person */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            Name of Charity <span className="text-destructive">*</span>
                          </label>
                          <input
                            type="text"
                            name="charityName"
                            value={formData.charityName}
                            onChange={handleInputChange}
                            placeholder="Enter charity name"
                            className="w-full px-3 py-2 border border-input rounded-md bg-background"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            Contact Person <span className="text-destructive">*</span>
                          </label>
                          <input
                            type="text"
                            name="contactPerson"
                            value={formData.contactPerson}
                            onChange={handleInputChange}
                            placeholder="Enter contact person name"
                            className="w-full px-3 py-2 border border-input rounded-md bg-background"
                            required
                          />
                        </div>
                      </div>

                      {/* Address Information */}
                      <div>
                        <h3 className="text-lg font-semibold mb-4">Address Information</h3>
                        
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium mb-2">
                              First Line of Address <span className="text-destructive">*</span>
                            </label>
                            <input
                              type="text"
                              name="addressLine1"
                              value={formData.addressLine1}
                              onChange={handleInputChange}
                              placeholder="Enter street address"
                              className="w-full px-3 py-2 border border-input rounded-md bg-background"
                              required
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium mb-2">
                              Second Line of Address (optional)
                            </label>
                            <input
                              type="text"
                              name="addressLine2"
                              value={formData.addressLine2}
                              onChange={handleInputChange}
                              placeholder="Apartment, suite, unit, building, floor, etc."
                              className="w-full px-3 py-2 border border-input rounded-md bg-background"
                            />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <label className="block text-sm font-medium mb-2">
                                City <span className="text-destructive">*</span>
                              </label>
                              <input
                                type="text"
                                name="city"
                                value={formData.city}
                                onChange={handleInputChange}
                                placeholder="Enter city"
                                className="w-full px-3 py-2 border border-input rounded-md bg-background"
                                required
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium mb-2">
                                State/Province/County <span className="text-destructive">*</span>
                              </label>
                              <input
                                type="text"
                                name="stateProvince"
                                value={formData.stateProvince}
                                onChange={handleInputChange}
                                placeholder="Enter state/province/county"
                                className="w-full px-3 py-2 border border-input rounded-md bg-background"
                                required
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium mb-2">
                                Zip/Postal Code <span className="text-destructive">*</span>
                              </label>
                              <input
                                type="text"
                                name="zipPostalCode"
                                value={formData.zipPostalCode}
                                onChange={handleInputChange}
                                placeholder="Enter zip/postal code"
                                className="w-full px-3 py-2 border border-input rounded-md bg-background"
                                required
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-medium mb-2">
                              Country/Region <span className="text-destructive">*</span>
                            </label>
                            <input
                              type="text"
                              name="country"
                              value={formData.country}
                              onChange={handleInputChange}
                              placeholder="Enter country/region"
                              className="w-full px-3 py-2 border border-input rounded-md bg-background"
                              required
                            />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium mb-2">
                                Telephone Number <span className="text-destructive">*</span>
                              </label>
                              <input
                                type="tel"
                                name="telephone"
                                value={formData.telephone}
                                onChange={handleInputChange}
                                placeholder="+1 (302) 538-9413"
                                className="w-full px-3 py-2 border border-input rounded-md bg-background"
                                required
                              />
                              <p className="text-xs text-muted-foreground mt-1">
                                Format: +1 (XXX) XXX-XXXX
                              </p>
                            </div>
                            <div>
                              <label className="block text-sm font-medium mb-2">
                                Email Address <span className="text-destructive">*</span>
                              </label>
                              <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                placeholder="Enter email address"
                                className="w-full px-3 py-2 border border-input rounded-md bg-background"
                                required
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium mb-2">
                                Website
                              </label>
                              <input
                                type="url"
                                name="website"
                                value={formData.website}
                                onChange={handleInputChange}
                                placeholder="Enter website URL (optional)"
                                className="w-full px-3 py-2 border border-input rounded-md bg-background"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium mb-2">
                                Charity Registration # <span className="text-destructive">*</span>
                              </label>
                              <input
                                type="text"
                                name="registrationNumber"
                                value={formData.registrationNumber}
                                onChange={handleInputChange}
                                placeholder="Enter registration number"
                                className="w-full px-3 py-2 border border-input rounded-md bg-background"
                                required
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-medium mb-2">
                              Description of Charitable Purpose <span className="text-destructive">*</span>
                            </label>
                            <textarea
                              name="charityOverview"
                              value={formData.charityOverview}
                              onChange={handleInputChange}
                              placeholder="Please provide a detailed description of your charitable purpose and mission (minimum 50 characters)"
                              className="w-full px-3 py-2 border border-input rounded-md bg-background min-h-[120px]"
                              required
                              minLength={50}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Submit Button */}
                      <div className="flex justify-center">
                        <Button 
                          type="submit" 
                          size="lg" 
                          className="gap-2 px-8"
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? "Submitting..." : "Submit Application"}
                          <ArrowRight className="w-4 h-4" />
                        </Button>
                      </div>

                      {/* Contact Information */}
                      <div className="pt-8 border-t">
                        <h3 className="font-semibold mb-2">Contact Information</h3>
                        <p className="text-sm text-muted-foreground">
                          Email: impact@bellonecta.com
                        </p>
                        <p className="text-sm text-muted-foreground">
                          We aim to respond to all applications within 10 working days.
                        </p>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </>
  );
};

const Users = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

export default BelloPartnership;
