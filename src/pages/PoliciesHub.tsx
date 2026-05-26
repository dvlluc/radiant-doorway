import { SEO } from "@/components/SEO";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const PoliciesHub = () => {
  const navigate = useNavigate();
  
  return (
    <>
      <SEO 
        title="Policies & Terms - BeautyConnect"
        description="Read our comprehensive policies including terms and conditions, privacy policy, cookie policy, community rules, and refund policy."
      />
      <div className="min-h-screen bg-background flex">
        <Header />
        <div className="flex w-full pt-14">
          <Sidebar />
          <main className="flex-1 bg-background">
            <div className="max-w-5xl mx-auto px-6 py-8">
              <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                Back
              </button>
              <h1 className="text-4xl font-bold text-center mb-8">Policies & Terms</h1>
              
              <Tabs defaultValue="terms" className="w-full">
                <TabsList className="flex justify-center items-center mb-8 h-auto p-0 bg-transparent border-0 gap-8">
                  <TabsTrigger value="terms" className="bg-transparent border-0 shadow-none data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 py-2 text-base font-normal data-[state=active]:font-semibold">Terms and Condition</TabsTrigger>
                  <TabsTrigger value="privacy" className="bg-transparent border-0 shadow-none data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 py-2 text-base font-normal data-[state=active]:font-semibold">Privacy Policy</TabsTrigger>
                  <TabsTrigger value="cookies" className="bg-transparent border-0 shadow-none data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 py-2 text-base font-normal data-[state=active]:font-semibold">Cookies Policy</TabsTrigger>
                  <TabsTrigger value="community" className="bg-transparent border-0 shadow-none data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 py-2 text-base font-normal data-[state=active]:font-semibold">Community Rules</TabsTrigger>
                  <TabsTrigger value="refund" className="bg-transparent border-0 shadow-none data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 py-2 text-base font-normal data-[state=active]:font-semibold">Refund Policy</TabsTrigger>
                </TabsList>

                <TabsContent value="terms">
                  <Card>
                    <CardContent className="p-8 space-y-8">
                      <div>
                        <h2 className="text-3xl font-bold mb-2">Terms and Conditions</h2>
                        <p className="text-muted-foreground text-sm">Last updated: December 1, 2024</p>
                      </div>

                      <section className="space-y-4">
                        <h3 className="text-2xl font-bold">1. Introduction</h3>
                        <p className="text-muted-foreground leading-relaxed">
                          Welcome to BelloNecta, a social media platform dedicated to the beauty industry. By accessing our website at www.bellonecta.com, or any associated services (collectively, the "Platform"), you agree to be bound by these Terms and Conditions (the "Terms"). These Terms govern your access to and use of the Platform and any services, functionalities, and applications offered on or through the Platform. Please read these Terms carefully before using our services. If you do not agree to these Terms, you must not access or use the Platform.
                        </p>
                      </section>

                      <section className="space-y-4">
                        <h3 className="text-2xl font-bold">2. Eligibility and Registration</h3>
                        <p className="text-muted-foreground leading-relaxed">
                          To use the Platform, you must be at least 18 years old, or the age of majority in your jurisdiction, and possess the legal authority, right, and freedom to enter into these Terms as a binding agreement. You are not allowed to use this Platform if doing so is prohibited in your country or under any law or regulation applicable to you.
                        </p>
                        <p className="text-muted-foreground leading-relaxed">
                          When you register to use the Platform, you must provide accurate and complete information as prompted by the registration form and maintain the accuracy of this information throughout your use of the Platform. You are responsible for maintaining the confidentiality of your login credentials and are fully responsible for all activities that occur under your account. You agree to immediately notify us of any unauthorized use of your account or any other breach of security.
                        </p>
                      </section>

                      <section className="space-y-4">
                        <h3 className="text-2xl font-bold">3. User Responsibilities</h3>
                        <p className="text-muted-foreground leading-relaxed">
                          As a user of the Platform, you agree to comply with these Terms and all local, state, national, and international laws, and regulations. You are solely responsible for all acts or omissions that occur under your account, including the content of your communications through the Platform. You agree not to engage in any prohibited activities including using the Platform for unlawful purposes, violating intellectual property rights, or engaging in harassment or discrimination.
                        </p>
                      </section>

                      <section className="space-y-4">
                        <h3 className="text-2xl font-bold">4. Premium Subscriptions and Payments</h3>
                        <p className="text-muted-foreground leading-relaxed">
                          The Platform offers premium subscription services that provide additional features and benefits. Subscription fees are billed on a recurring basis and will automatically renew at the end of each subscription period, unless you cancel your subscription through your account management page. All fees are payable in advance and are non-refundable, except as expressly provided in these Terms or the Refund Policy.
                        </p>
                      </section>

                      <section className="space-y-4">
                        <h3 className="text-2xl font-bold">5. Intellectual Property Rights</h3>
                        <p className="text-muted-foreground leading-relaxed">
                          The content, features, and functionality of the BelloNecta Platform, including all text, graphics, logos, images, audio clips, video clips, and software, are the exclusive property of BelloNecta or its licensors and are protected by copyright, trademark, and other intellectual property laws.
                        </p>
                      </section>

                      <section className="space-y-4">
                        <h3 className="text-2xl font-bold">6. Limitation of Liability</h3>
                        <p className="text-muted-foreground leading-relaxed">
                          BelloNecta provides the Platform and all associated services on an "as is" and "as available" basis without any warranties, express or implied. Under no circumstances will BelloNecta or its affiliates be liable for any direct, indirect, incidental, special or consequential damages resulting from your use or inability to use the Platform.
                        </p>
                      </section>

                      <section className="space-y-4">
                        <h3 className="text-2xl font-bold">7. Changes to Terms</h3>
                        <p className="text-muted-foreground leading-relaxed">
                          We reserve the right to modify or replace these Terms at any time. If a revision is material, we will provide at least 30 days' notice prior to any new terms taking effect. By continuing to access or use our Platform after those revisions become effective, you agree to be bound by the revised terms.
                        </p>
                      </section>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="privacy">
                  <Card>
                    <CardContent className="p-8 space-y-8">
                      <div>
                        <h2 className="text-3xl font-bold mb-2">Privacy Policy</h2>
                        <p className="text-muted-foreground text-sm">Last updated: December 1, 2024</p>
                      </div>

                      <section className="space-y-4">
                        <h3 className="text-2xl font-bold">Personal Information We Collect</h3>
                        <p className="text-muted-foreground leading-relaxed">
                          We collect information that you provide directly to us when using our platform, including:
                        </p>
                        <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                          <li><strong>Contact Data:</strong> Your first and last name, email address, mailing address, phone number, and professional title.</li>
                          <li><strong>Registration Data:</strong> Information you provide to create an account, such as your date of birth, your name, your address and other registration details.</li>
                          <li><strong>Profile Data:</strong> Username and password for account access, and personal preferences.</li>
                          <li><strong>Communications Data:</strong> Information you provide directly to us when you communicate, including questions, feedback, and other correspondence.</li>
                          <li><strong>Transaction Data:</strong> Details about your purchases and transactions, including billing and shipping details.</li>
                        </ul>
                      </section>

                      <section className="space-y-4">
                        <h3 className="text-2xl font-bold">How We Use Your Personal Information</h3>
                        <p className="text-muted-foreground leading-relaxed">
                          We use your information to operate and manage our services, including:
                        </p>
                        <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                          <li>Processing transactions and maintaining your account</li>
                          <li>Providing customer support</li>
                          <li>Communicating updates, security alerts, and support messages</li>
                          <li>Responding to your inquiries</li>
                          <li>Providing promotional materials that may be of interest to you</li>
                          <li>Enhancing the security of our services</li>
                        </ul>
                      </section>

                      <section className="space-y-4">
                        <h3 className="text-2xl font-bold">How We Share Your Personal Information</h3>
                        <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                          <li><strong>Affiliates:</strong> We may share your data with BelloNecta affiliates and subsidiaries for purposes consistent with this Privacy Policy.</li>
                          <li><strong>Service Providers:</strong> Third-party companies and individuals that provide services on our behalf or help us operate the Service, such as hosting, analytics, customer service, marketing, and database management services.</li>
                          <li><strong>Legal Requirements:</strong> We may disclose your information if required by law or in response to valid requests by public authorities.</li>
                        </ul>
                      </section>

                      <section className="space-y-4">
                        <h3 className="text-2xl font-bold">Data Security</h3>
                        <p className="text-muted-foreground leading-relaxed">
                          We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. In the event of a personal data breach, we will notify the appropriate supervisory authority within 72 hours unless the breach is unlikely to result in a risk to the rights and freedoms of individuals.
                        </p>
                      </section>

                      <section className="space-y-4">
                        <h3 className="text-2xl font-bold">Your Rights</h3>
                        <p className="text-muted-foreground leading-relaxed">
                          You have the right to access, correct, update, or request deletion of your personal information. You may also have the right to object to processing of your personal data, ask us to restrict processing, or request portability of your personal information.
                        </p>
                      </section>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="cookies">
                  <Card>
                    <CardContent className="p-8 space-y-8">
                      <div>
                        <h2 className="text-3xl font-bold mb-2">Cookie Policy</h2>
                        <p className="text-muted-foreground text-sm">Last updated: December 1, 2024</p>
                      </div>

                      <section className="space-y-4">
                        <h3 className="text-2xl font-bold">What are cookies?</h3>
                        <p className="text-muted-foreground leading-relaxed">
                          Cookies are small text files that are placed on your device by websites that you visit. They are widely used to make websites work, or work more efficiently, as well as to provide information to the owners of the site. We use cookies to enhance our site's performance and to advance your user experience.
                        </p>
                      </section>

                      <section className="space-y-4">
                        <h3 className="text-2xl font-bold">Types of cookies we use</h3>
                        <ul className="list-disc list-inside space-y-3 text-muted-foreground ml-4">
                          <li><strong>Session cookies:</strong> These cookies remain on your device only while your browser is open and are deleted automatically once you close your browser. They help navigate between pages efficiently and generally improve your navigation experience.</li>
                          <li><strong>Persistent cookies:</strong> These cookies remain on your device for a set period specified in the cookie. We use these cookies to analyze user behavior over a longer period or to provide services that you have requested.</li>
                          <li><strong>Strictly necessary cookies:</strong> Essential to navigate the website and use its features. Without these cookies, functionalities like secure logins and shopping baskets cannot be provided.</li>
                          <li><strong>Performance cookies:</strong> These collect information about how you use our website, like which pages you visited and which links you clicked on. None of this information can be used to identify you.</li>
                          <li><strong>Functionality cookies:</strong> These cookies allow our websites to remember choices you make (such as your user name) and provide enhanced, more personal features.</li>
                          <li><strong>Targeting cookies:</strong> These cookies track your browsing habits to enable us to show advertising which is more likely to be of interest to you.</li>
                          <li><strong>Third-party cookies:</strong> Our website may set third-party cookies that are not directly controlled by us. These may be used by our third-party service providers to analyze how our site is used or to personalize advertising content for you.</li>
                        </ul>
                      </section>

                      <section className="space-y-4">
                        <h3 className="text-2xl font-bold">Managing Cookies</h3>
                        <p className="text-muted-foreground leading-relaxed">
                          Most browsers allow you to control cookies through their settings preferences. However, if you limit the ability of websites to set cookies, you may worsen your overall user experience, since it will no longer be personalized to you. You can find more information about cookies and how to manage them at www.allaboutcookies.org.
                        </p>
                      </section>

                      <section className="space-y-4">
                        <h3 className="text-2xl font-bold">Updates to This Policy</h3>
                        <p className="text-muted-foreground leading-relaxed">
                          We may update this Cookie Policy from time to time in order to reflect, for example, changes to the cookies we use or for other operational, legal or regulatory reasons. We encourage you to review this Cookie Policy periodically to stay informed about our use of cookies.
                        </p>
                      </section>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="community">
                  <Card>
                    <CardContent className="p-8 space-y-8">
                      <div>
                        <h2 className="text-3xl font-bold mb-2">Community Rules</h2>
                        <p className="text-muted-foreground text-sm">Last updated: December 1, 2024</p>
                      </div>

                      <section className="space-y-4">
                        <h3 className="text-2xl font-bold">Our Community Standards</h3>
                        <p className="text-muted-foreground leading-relaxed">
                          BeautyConnect is built on respect, professionalism, and support. We expect all members to contribute positively to our community and maintain a welcoming environment for everyone.
                        </p>
                      </section>

                      <section className="space-y-4">
                        <h3 className="text-2xl font-bold">Respectful Interaction</h3>
                        <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                          <li>Treat all members with respect and professionalism</li>
                          <li>Be constructive in your feedback and criticism</li>
                          <li>Support fellow beauty professionals</li>
                          <li>Celebrate successes and help others learn from challenges</li>
                          <li>Engage in meaningful discussions that benefit the community</li>
                        </ul>
                      </section>

                      <section className="space-y-4">
                        <h3 className="text-2xl font-bold">Prohibited Content</h3>
                        <p className="text-muted-foreground leading-relaxed">
                          The following types of content are not allowed:
                        </p>
                        <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                          <li>Harassment, bullying, or hate speech</li>
                          <li>Discrimination based on race, ethnicity, gender, religion, or sexual orientation</li>
                          <li>Spam or excessive self-promotion</li>
                          <li>False or misleading information</li>
                          <li>Inappropriate or explicit content</li>
                          <li>Content that infringes on intellectual property rights</li>
                          <li>Threats or incitement to violence</li>
                          <li>Doxxing or sharing private information without consent</li>
                        </ul>
                      </section>

                      <section className="space-y-4">
                        <h3 className="text-2xl font-bold">Professional Conduct</h3>
                        <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                          <li>Maintain professional standards in all interactions</li>
                          <li>Honor your commitments and appointments</li>
                          <li>Provide accurate information about your services</li>
                          <li>Respond promptly to inquiries and bookings</li>
                          <li>Handle disputes professionally and privately</li>
                          <li>Respect client confidentiality</li>
                        </ul>
                      </section>

                      <section className="space-y-4">
                        <h3 className="text-2xl font-bold">Content Guidelines</h3>
                        <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                          <li>Share authentic, original content</li>
                          <li>Give credit when sharing others' work</li>
                          <li>Use appropriate tags and descriptions</li>
                          <li>Ensure images are appropriate for all audiences</li>
                          <li>Respect client privacy and obtain consent before sharing their images</li>
                        </ul>
                      </section>

                      <section className="space-y-4">
                        <h3 className="text-2xl font-bold">Reporting Violations</h3>
                        <p className="text-muted-foreground leading-relaxed">
                          If you encounter content or behavior that violates these rules, please report it to our moderation team. We review all reports promptly and take appropriate action. Your reports help us maintain a safe and welcoming community.
                        </p>
                      </section>

                      <section className="space-y-4">
                        <h3 className="text-2xl font-bold">Consequences</h3>
                        <p className="text-muted-foreground leading-relaxed">
                          Violations of community rules may result in:
                        </p>
                        <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                          <li>Warning notice</li>
                          <li>Content removal</li>
                          <li>Temporary suspension</li>
                          <li>Permanent account termination</li>
                          <li>Legal action in severe cases</li>
                        </ul>
                      </section>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="refund">
                  <Card>
                    <CardContent className="p-8 space-y-8">
                      <div>
                        <h2 className="text-3xl font-bold mb-2">Refund Policy</h2>
                        <p className="text-muted-foreground text-sm">Last updated: December 1, 2024</p>
                      </div>

                      <section className="space-y-4">
                        <h3 className="text-2xl font-bold">General Policy</h3>
                        <p className="text-muted-foreground leading-relaxed">
                          We strive to ensure customer satisfaction with all services and products purchased through our platform. This refund policy outlines the conditions under which refunds may be issued.
                        </p>
                      </section>

                      <section className="space-y-4">
                        <h3 className="text-2xl font-bold">Service Bookings</h3>
                        <div className="space-y-3">
                          <p className="text-muted-foreground leading-relaxed font-semibold">Cancellation Timeframes:</p>
                          <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                            <li>24+ hours before appointment: Full refund</li>
                            <li>12-24 hours before appointment: 50% refund</li>
                            <li>Less than 12 hours: No refund</li>
                          </ul>
                          <p className="text-muted-foreground leading-relaxed">
                            Individual professionals may set their own cancellation policies, which will be clearly displayed at the time of booking.
                          </p>
                        </div>
                      </section>

                      <section className="space-y-4">
                        <h3 className="text-2xl font-bold">Subscription Services</h3>
                        <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                          <li>Monthly subscriptions: Refundable within 7 days of initial purchase</li>
                          <li>Annual subscriptions: Prorated refunds available within 30 days</li>
                          <li>No refunds after the specified periods</li>
                          <li>Subscription cancellations take effect at the end of the current billing period</li>
                        </ul>
                      </section>

                      <section className="space-y-4">
                        <h3 className="text-2xl font-bold">Event Tickets</h3>
                        <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                          <li>Refundable up to 7 days before the event</li>
                          <li>Event organizers may offer different refund policies</li>
                          <li>Event cancellations by organizers result in automatic full refunds</li>
                          <li>Event postponements: Original tickets remain valid or refund available</li>
                        </ul>
                      </section>

                      <section className="space-y-4">
                        <h3 className="text-2xl font-bold">Marketplace Purchases</h3>
                        <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                          <li>Returns accepted within 14 days of delivery</li>
                          <li>Items must be unused and in original packaging</li>
                          <li>Customer responsible for return shipping costs</li>
                          <li>Refund processed within 5-7 business days of receiving returned item</li>
                        </ul>
                      </section>

                      <section className="space-y-4">
                        <h3 className="text-2xl font-bold">Refund Process</h3>
                        <p className="text-muted-foreground leading-relaxed">
                          To request a refund:
                        </p>
                        <ol className="list-decimal list-inside space-y-2 text-muted-foreground ml-4">
                          <li>Contact our support team with your order details</li>
                          <li>Provide a reason for the refund request</li>
                          <li>Our team will review your request within 2-3 business days</li>
                          <li>If approved, refunds are processed to the original payment method</li>
                          <li>Allow 5-10 business days for the refund to appear in your account</li>
                        </ol>
                      </section>

                      <section className="space-y-4">
                        <h3 className="text-2xl font-bold">Non-Refundable Items</h3>
                        <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                          <li>Gift cards and promotional credits</li>
                          <li>Downloaded digital content</li>
                          <li>Completed services</li>
                          <li>Custom or personalized products</li>
                          <li>Sale or clearance items (unless defective)</li>
                        </ul>
                      </section>

                      <section className="space-y-4">
                        <h3 className="text-2xl font-bold">Disputes</h3>
                        <p className="text-muted-foreground leading-relaxed">
                          If you have concerns about a service or product that are not resolved through our refund policy, please contact our support team to discuss your options. We are committed to finding a fair resolution for all parties involved.
                        </p>
                      </section>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </main>
        </div>
      </div>
    </>
  );
};

export default PoliciesHub;
