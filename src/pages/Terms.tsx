import { SEO } from "@/components/SEO";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";

const Terms = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "terms";
  
  return (
    <>
      <SEO 
        title="Policies & Terms - BelloNecta"
        description="Read our comprehensive policies including terms and conditions, privacy policy, cookie policy, community rules, and refund policy."
      />
      <div className="min-h-screen bg-background overflow-x-hidden">
        <main className="flex-1 bg-background">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
              <button
                onClick={() => navigate('/directory')}
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4 sm:mb-6 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                Back
              </button>
              <h1 className="text-2xl sm:text-4xl font-bold mb-6 sm:mb-8 text-center">Policies & Terms</h1>
              
              <Tabs value={activeTab} onValueChange={(value) => navigate(`/terms?tab=${value}`)} className="w-full">
                <TabsList className="w-full grid grid-cols-1 sm:grid-cols-5 h-auto p-1.5 bg-muted/30 border border-border/50 mb-6 sm:mb-8 rounded-lg gap-1">
                  <TabsTrigger 
                    value="terms" 
                    className="w-full justify-center px-4 py-2.5 text-sm font-medium data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm data-[state=inactive]:text-muted-foreground rounded-md transition-all"
                  >
                    Terms & Conditions
                  </TabsTrigger>
                  <TabsTrigger 
                    value="privacy" 
                    className="w-full justify-center px-4 py-2.5 text-sm font-medium data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm data-[state=inactive]:text-muted-foreground rounded-md transition-all"
                  >
                    Privacy Policy
                  </TabsTrigger>
                  <TabsTrigger 
                    value="cookies" 
                    className="w-full justify-center px-4 py-2.5 text-sm font-medium data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm data-[state=inactive]:text-muted-foreground rounded-md transition-all"
                  >
                    Cookies Policy
                  </TabsTrigger>
                  <TabsTrigger 
                    value="community" 
                    className="w-full justify-center px-4 py-2.5 text-sm font-medium data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm data-[state=inactive]:text-muted-foreground rounded-md transition-all"
                  >
                    Community Rules
                  </TabsTrigger>
                  <TabsTrigger 
                    value="refund" 
                    className="w-full justify-center px-4 py-2.5 text-sm font-medium data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm data-[state=inactive]:text-muted-foreground rounded-md transition-all"
                  >
                    Refund Policy
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="terms">
                  <Card>
                    <CardContent className="p-4 sm:p-8 space-y-6 sm:space-y-8">
                      <div>
                        <h2 className="text-2xl sm:text-3xl font-bold mb-2">Terms and Conditions</h2>
                        <p className="text-muted-foreground text-sm">Last updated: October 1, 2025</p>
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
                        <h3 className="text-2xl font-bold">3. Privacy Policy</h3>
                        <p className="text-muted-foreground leading-relaxed">
                          Your privacy is important to us. Our Privacy Policy explains how we collect, use, and protect your personal information. By using the Platform, you agree to the collection and use of your personal information in accordance with our Privacy Policy.
                        </p>
                      </section>

                      <section className="space-y-4">
                        <h3 className="text-2xl font-bold">4. User Responsibilities</h3>
                        <p className="text-muted-foreground leading-relaxed">
                          As a user of the Platform, you agree to comply with these Terms and all local, state, national, and international laws, and regulations. You are solely responsible for all acts or omissions that occur under your account, including the content of your communications through the Platform. You agree not to engage in any of the following prohibited activities:
                        </p>
                        <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                          <li>Using the Platform for any unlawful purpose or to solicit others to perform or participate in any unlawful acts.</li>
                          <li>Violating any international, federal, provincial, or state regulations, rules, laws, or local ordinances.</li>
                          <li>Infringing upon or violating our intellectual property rights or the intellectual property rights of others.</li>
                          <li>Harassing, abusing, insulting, harming, defaming, slandering, disparaging, intimidating, or discriminating based on gender, sexual orientation, religion, ethnicity, race, age, national origin, or disability.</li>
                          <li>Submitting false or misleading information.</li>
                          <li>Uploading or transmitting viruses or any other type of malicious code.</li>
                        </ul>
                      </section>

                      <section className="space-y-4">
                        <h3 className="text-2xl font-bold">5. Premium Subscriptions and Payments</h3>
                        <p className="text-muted-foreground leading-relaxed">
                          The Platform offers premium subscription services that provide additional features and benefits. Details of these services, including the scope of services, fees, and any other charges, are available on the Platform and are incorporated herein by reference.
                        </p>
                        <p className="text-muted-foreground leading-relaxed">
                          Subscription fees are billed on a recurring basis and will automatically renew at the end of each subscription period, unless you cancel your subscription through your account management page.
                        </p>
                        <p className="text-muted-foreground leading-relaxed">
                          All fees are payable in advance and are non-refundable, except as expressly provided in these Terms or the Refund Policy. You agree to promptly update account and payment information, including email address, payment method, and payment card expiration date, so that we can complete your transactions and contact you as needed.
                        </p>
                        <p className="text-muted-foreground leading-relaxed">
                          We reserve the right to modify subscription services and prices at any time without prior notice. Any changes will be effective immediately and reflected on the Platform.
                        </p>
                      </section>

                      <section className="space-y-4">
                        <h3 className="text-2xl font-bold">6. Booking and Cancellations</h3>
                        <p className="text-muted-foreground leading-relaxed">
                          The Platform allows users to book appointments with beauty professionals. You can make an appointment within the timeframes offered by the professional. Appointments must be cancelled at least 24, 48, or 72 hours before the scheduled time, depending on the professional's policy, to be eligible for a full refund. Cancellations made after these periods will not qualify for a full refund. Specific details of the cancellation policy will be provided at the time of booking and are part of this agreement.
                        </p>
                        <p className="text-muted-foreground leading-relaxed">
                          <strong>Professional Services Disclaimer:</strong> BelloNecta does not endorse or certify beauty professionals listed on the Platform. Users are responsible for selecting their professionals and BelloNecta is not liable for any outcomes of services booked through the Platform.
                        </p>
                        <p className="text-muted-foreground leading-relaxed">
                          <strong>Health and Safety Compliance:</strong> Users and professionals must comply with applicable health and safety laws and regulations. Concerns should be reported to BelloNecta and appropriate authorities.
                        </p>
                      </section>

                      <section className="space-y-4">
                        <h3 className="text-2xl font-bold">7. Refund Policy</h3>
                        <p className="text-muted-foreground leading-relaxed">
                          Our Refund Policy is detailed separately and forms an integral part of these Terms. It outlines the conditions under which refunds are granted, including but not limited to cancellations of bookings as specified in the above section. By using the Platform, you acknowledge that you have read, understood, and agree to be bound by the Refund Policy.
                        </p>
                      </section>

                      <section className="space-y-4">
                        <h3 className="text-2xl font-bold">8. Intellectual Property Rights</h3>
                        <p className="text-muted-foreground leading-relaxed">
                          The content, features, and functionality of the BelloNecta Platform, including all text, graphics, logos, images, audio clips, video clips, and software, are the exclusive property of BelloNecta or its licensors and are protected by copyright, trademark, and other intellectual property laws. You agree not to reproduce, duplicate, copy, sell, resell, or exploit any portion of the Platform without express written permission from BelloNecta.
                        </p>
                      </section>

                      <section className="space-y-4">
                        <h3 className="text-2xl font-bold">9. User Content</h3>
                        <p className="text-muted-foreground leading-relaxed">
                          By posting or submitting content on the Platform, you grant BelloNecta a worldwide, non-exclusive, royalty-free license to use, reproduce, modify, publish, translate, distribute, perform, and display such content on the Platform and in any media now known or hereafter developed. You represent and warrant that you own or control all rights in and to the content you post and that the content is accurate, does not infringe any third party's rights, and complies with these Terms. We reserve the right to remove any content that violates these Terms or is otherwise deemed inappropriate. Users must ensure that content posted does not contain advice perceived as medical advice. BelloNecta is not liable for any reliance on such content.
                        </p>
                        <p className="text-muted-foreground leading-relaxed">
                          By posting content, users grant BelloNecta permission to use their data for promotional and operational purposes, in accordance with our Privacy Policy.
                        </p>
                      </section>

                      <section className="space-y-4">
                        <h3 className="text-2xl font-bold">10. Advertising</h3>
                        <p className="text-muted-foreground leading-relaxed">
                          The Platform may include advertising content provided by third parties. You agree that BelloNecta is not responsible for the accuracy, legality, or decency of any advertising content or the products or services advertised. You acknowledge that any dealings with advertisers or participation in promotions of advertisers found on or through the Platform are solely between you and the advertiser. We encourage you to review the terms and privacy policies of any third-party advertisers.
                        </p>
                      </section>

                      <section className="space-y-4">
                        <h3 className="text-2xl font-bold">11. Community Interaction</h3>
                        <p className="text-muted-foreground leading-relaxed">
                          BelloNecta provides an online forum and community features where users can interact, share content, and participate in discussions. We expect all users to conduct themselves in a respectfully and responsibly. You agree not to:
                        </p>
                        <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                          <li>Post content that is unlawful, harmful, threatening, abusive, harassing, defamatory, vulgar, obscene, libelous, invasive of another's privacy, hateful, or racially, ethnically, or otherwise objectionable.</li>
                          <li>Use the Platform to solicit personal information from minors or to harm minors in any way.</li>
                          <li>Violate any applicable local, state, national, or international law or regulation.</li>
                        </ul>
                        <p className="text-muted-foreground leading-relaxed">
                          We reserve the right to remove any content that violates these terms and condition and to suspend or terminate accounts that engage in prohibited activities.
                        </p>
                      </section>

                      <section className="space-y-4">
                        <h3 className="text-2xl font-bold">12. Events and Ticket Purchases</h3>
                        <p className="text-muted-foreground leading-relaxed">
                          The Platform allows users to purchase tickets for events. All ticket sales are final, and no refunds will be issued except as specified in the Refund Policy. BelloNecta is not liable for any changes, cancellations, or rescheduling of events. Event organizers are solely responsible for all event-related matters. By purchasing a ticket, you agree to comply with the event's terms and conditions and acknowledge that BelloNecta is not responsible for any issues related to the event.
                        </p>
                      </section>

                      <section className="space-y-4">
                        <h3 className="text-2xl font-bold">13. Cookies and Tracking Technologies</h3>
                        <p className="text-muted-foreground leading-relaxed">
                          The BelloNecta Platform uses cookies and similar tracking technologies to enhance your browsing experience, analyze site traffic, and personalize content. By using the Platform, you consent to our use of cookies in accordance with our Cookies Policy. For more information on how we use cookies and how you can manage your cookie preferences, please review our full Cookies Policy.
                        </p>
                      </section>

                      <section className="space-y-4">
                        <h3 className="text-2xl font-bold">14. Service Modifications and Availability</h3>
                        <p className="text-muted-foreground leading-relaxed">
                          BelloNecta reserves the right to modify, suspend, or discontinue any part of the Platform at any time without notice. We strive to maintain the availability of the Platform, but we do not guarantee uninterrupted service. BelloNecta will not be liable for any loss or damage resulting from the modification, suspension, or discontinuation of the Platform or any part thereof.
                        </p>
                        <p className="text-muted-foreground leading-relaxed">
                          BelloNecta does not warrant the accuracy or reliability of third-party services advertised or made available through the Platform.
                        </p>
                      </section>

                      <section className="space-y-4">
                        <h3 className="text-2xl font-bold">15. Termination and Account Cancellation</h3>
                        <p className="text-muted-foreground leading-relaxed">
                          You may terminate your account at any time by following the account deletion procedures on the Platform. BelloNecta reserves the right to suspend or terminate your account and access to the Platform at its sole discretion, without notice, for any reason, including but not limited to a breach of these Terms. Upon termination, all rights and licenses granted to you under these Terms will immediately cease.
                        </p>
                      </section>

                      <section className="space-y-4">
                        <h3 className="text-2xl font-bold">16. Disclaimers and Limitations of Liability</h3>
                        <p className="text-muted-foreground leading-relaxed">
                          BelloNecta provides the Platform and all associated services on an "as is" and "as available" basis without any warranties, express or implied, including but not limited to the implied warranties of merchantability, fitness for a particular purpose, and non-infringement. We do not guarantee the accuracy, completeness, or usefulness of any information on the Platform and do not warrant that the use of the Platform will be secure, uninterrupted, always available, or error-free, or that the Platform will meet your requirements.
                        </p>
                        <p className="text-muted-foreground leading-relaxed">
                          Under no circumstances will BelloNecta or its affiliates be liable for any direct, indirect, incidental, special or consequential damages resulting from your use or inability to use the Platform, including damages for loss of profits, goodwill, use, data, or other intangible losses, whether based on contract, tort, negligence, strict liability or otherwise, even if BelloNecta has been advised of the possibility of such damages.
                        </p>
                      </section>

                      <section className="space-y-4">
                        <h3 className="text-2xl font-bold">17. Indemnification</h3>
                        <p className="text-muted-foreground leading-relaxed">
                          You agree to indemnify, defend, and hold harmless BelloNecta, its officers, directors, employees, agents, licensors, and suppliers from and against all losses, expenses, damages, and costs, including reasonable attorneys' fees, resulting from any violation of these Terms, your use of the Platform, or any activity related to your account (including negligent or wrongful conduct) by you or any other person accessing the Platform using your account.
                        </p>
                      </section>

                      <section className="space-y-4">
                        <h3 className="text-2xl font-bold">18. Dispute Resolution</h3>
                        <p className="text-muted-foreground leading-relaxed">
                          Any disputes arising out of or relating to these Terms, the Privacy Policy, use of the Platform, or the services provided by BelloNecta shall be resolved by mediation first within 30 days, and if unresolved then binding arbitration in accordance with the rules of a recognized Arbitration Association as agreed upon by both parties. The arbitration shall take place in the jurisdiction where BelloNecta is headquartered, and the language of the arbitration shall be English. The decision of the arbitrator shall be final and binding on both parties.
                        </p>
                      </section>

                      <section className="space-y-4">
                        <h3 className="text-2xl font-bold">19. Changes to Terms and Conditions</h3>
                        <p className="text-muted-foreground leading-relaxed">
                          BelloNecta may update these Terms at any time to reflect changes in our practices, technology, legal requirements, or other factors. We will post the revised Terms on the Platform, and they will become effective immediately upon posting. Your continued use of the Platform after any changes to these Terms means you accept those changes. It is your responsibility to review the Terms regularly to ensure you are aware of any updates.
                        </p>
                      </section>

                      <section className="space-y-4">
                        <h3 className="text-2xl font-bold">20. Accessibility</h3>
                        <p className="text-muted-foreground leading-relaxed">
                          BelloNecta is committed to facilitating the accessibility and usability of its Platform for all people. If you experience any difficulty accessing or navigating our Platform or if you have any accessibility concerns, please contact us, and we will strive to provide the content you need in a format accessible to you.
                        </p>
                      </section>

                      <section className="space-y-4">
                        <h3 className="text-2xl font-bold">21. Third-Party Links and Services</h3>
                        <p className="text-muted-foreground leading-relaxed">
                          The Platform may contain links to third-party websites, advertisers, services, special offers, or other events or activities that are not owned or controlled by BelloNecta. We do not endorse or assume any responsibility for any such third-party sites, information, materials, products, or services. If you access a third-party website from the Platform, you do so at your own risk, and you understand that these Terms and our Privacy Policy do not apply to your use of such sites. You expressly relieve BelloNecta from any and all liability arising from your use of any third-party website, service, or content.
                        </p>
                      </section>

                      <section className="space-y-4">
                        <h3 className="text-2xl font-bold">22. Feedback and Complaints</h3>
                        <p className="text-muted-foreground leading-relaxed">
                          Feedback, comments, requests for technical support, and other communications relating to the Platform should be directed to our customer service team. If you send us any feedback or suggestions regarding the Platform, you acknowledge that we may use them without any obligation to compensate you for them (just as you have no obligation to offer them).
                        </p>
                      </section>

                      <section className="space-y-4">
                        <h3 className="text-2xl font-bold">23. Intellectual Property Complaints</h3>
                        <p className="text-muted-foreground leading-relaxed">
                          BelloNecta respects the intellectual property rights of others and expects users of the Platform to do the same. If you believe that your work has been copied on the Platform in a way that constitutes copyright infringement, please notify us by providing our copyright agent with the following information: a description of the copyrighted work that you claim has been infringed, a description of where the material that you claim is infringing is located on the Platform, your address, telephone number, and email address; a written statement that you have a good faith belief that the disputed use is not authorized by the copyright owner, its agents, or the licensee; and a statement by you, made under penalty of perjury, that the above information in your notice is accurate and that you are the copyright owner or authorized to act on the copyright owner's behalf.
                        </p>
                      </section>

                      <section className="space-y-4">
                        <h3 className="text-2xl font-bold">24. Severability</h3>
                        <p className="text-muted-foreground leading-relaxed">
                          If any provision of these Terms is held to be unlawful, void, or for any reason unenforceable by a court of competent jurisdiction, then that provision will be deemed severable from these Terms and will not affect the validity and enforceability of any remaining provisions. The remaining provisions of the Terms will continue in effect.
                        </p>
                      </section>

                      <section className="space-y-4">
                        <h3 className="text-2xl font-bold">25. Entire Agreement</h3>
                        <p className="text-muted-foreground leading-relaxed">
                          These Terms constitute the entire agreement between you and BelloNecta regarding the use of the Platform, superseding any prior agreements between you and BelloNecta relating to your use of the Platform. Any amendments to these Terms must be made in writing and signed by an authorized representative of BelloNecta.
                        </p>
                      </section>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="privacy">
                  <Card>
                    <CardContent className="p-4 sm:p-8 space-y-6 sm:space-y-8">
                      <div>
                        <h2 className="text-2xl sm:text-3xl font-bold mb-2">Privacy Policy</h2>
                        <p className="text-muted-foreground text-sm">Last updated: October 1, 2025</p>
                      </div>

                      <section className="space-y-4">
                        <p className="text-muted-foreground leading-relaxed">
                          BelloNecta ("we", "us", and "our") respects your privacy and is dedicated to protecting your privacy online and managing your information responsibly. This Privacy Policy is designed to inform you about our practices regarding the collection, use, and disclosure of the information that you may provide via our website www.bellonecta.com and through our related services. We are committed to ensuring that your information is secure and managed in accordance with relevant privacy laws, including the EU General Data Protection Regulation (GDPR), the US California Consumer Privacy Act (CCPA), the Children's Online Privacy Protection Act (COPPA), and other applicable privacy regulations.
                        </p>
                        <p className="text-muted-foreground leading-relaxed">
                          As the data controller under the GDPR, we are responsible for the processing of your personal data.
                        </p>
                      </section>

                      <section className="space-y-4">
                        <h3 className="text-2xl font-bold">Consent to Data Practices</h3>
                        <p className="text-muted-foreground leading-relaxed">
                          By using our website, mobile application and services, you acknowledge and consent to the practices described in this policy. Should we amend our privacy policy, changes will be published on this page with an updated revision date.
                        </p>
                      </section>

                      <section className="space-y-4">
                        <h3 className="text-2xl font-bold">Personal Information We Collect</h3>
                        <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                          <li><strong>Contact Data:</strong> Your first and last name, email address, mailing address, phone number, and professional title.</li>
                          <li><strong>Registration Data:</strong> Information you provide to create an account, such as your date of birth, your name, your address and other registration details.</li>
                          <li><strong>Profile Data:</strong> Username and password for account access, and personal preferences.</li>
                          <li><strong>Communications Data:</strong> Information you provide directly to us when you communicate, including questions, feedback, and other correspondence.</li>
                          <li><strong>Marketing Data:</strong> Your preferences for receiving marketing communications and participation details for contests or sweepstakes.</li>
                          <li><strong>Transaction Data:</strong> Details about your purchases and transactions, including billing and shipping details.</li>
                        </ul>
                      </section>

                      <section className="space-y-4">
                        <h3 className="text-2xl font-bold">Data from Other Sources</h3>
                        <p className="text-muted-foreground leading-relaxed">
                          We may obtain information about you from other sources, including:
                        </p>
                        <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                          <li><strong>Partners:</strong> Information from our advertising and joint marketing partners.</li>
                          <li><strong>Data Providers:</strong> Information services and data licensors provide additional data that we may combine with information you provide.</li>
                          <li><strong>Public Sources:</strong> Information available on public databases, social media platforms, or other publicly accessible sources.</li>
                        </ul>
                      </section>

                      <section className="space-y-4">
                        <h3 className="text-2xl font-bold">Automatic Data Collection</h3>
                        <p className="text-muted-foreground leading-relaxed">
                          Our servers and third-party service providers may automatically record certain information about how you interact with our platform, including:
                        </p>
                        <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                          <li><strong>Device Information:</strong> Information about your device, including the operating system, model, browser type, IP address, and general geographic location derived from your IP address.</li>
                          <li><strong>Usage Data:</strong> Details about your interactions with our website, such as the pages you visit, the time spent on those pages, and the links clicked.</li>
                          <li><strong>Cookies and Tracking Technologies:</strong> We use cookies and similar technologies to track activities on our services and hold certain information, enhancing your browsing experience and providing personalized advertisements.</li>
                        </ul>
                      </section>

                      <section className="space-y-4">
                        <h3 className="text-2xl font-bold">How We Use Your Personal Information</h3>
                        <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                          <li><strong>Service Delivery:</strong> We use your information to operate and manage our services, including processing transactions, maintaining your account, and providing customer support.</li>
                          <li><strong>Communication:</strong> To communicate with you about updates, security alerts, and support messages, and to respond to your inquiries.</li>
                          <li><strong>Marketing and Promotions:</strong> To provide you with promotional materials that may be of interest to you and to administer contests and sweepstakes.</li>
                          <li><strong>Security:</strong> To enhance the security of our services, including verifying your identity and preventing fraud.</li>
                        </ul>
                        <p className="text-muted-foreground leading-relaxed">
                          In the event of a personal data breach, we will notify the appropriate supervisory authority within 72 hours unless the breach is unlikely to result in a risk to the rights and freedoms of individuals. Affected individuals will also be notified if the breach is likely to result in a high risk to their rights and freedoms.
                        </p>
                      </section>

                      <section className="space-y-4">
                        <h3 className="text-2xl font-bold">How We Share Your Personal Information</h3>
                        <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                          <li><strong>Affiliates:</strong> We may share your data with BelloNecta affiliates and subsidiaries for purposes consistent with this Privacy Policy.</li>
                          <li><strong>Service Providers:</strong> Third-party companies and individuals that provide services on our behalf or help us operate the Service, such as hosting, analytics, customer service, marketing, and database management services.</li>
                          <li><strong>Advertising Partners:</strong> We may collaborate with third-party advertising companies who may collect information about your activity on our site and other sites to tailor advertising to your interests.</li>
                          <li><strong>Third-Party Platforms:</strong> When you connect your BelloNecta account to third-party platforms, such as social media or Google, be aware that the data shared will be governed by the third-party's privacy policy.</li>
                          <li><strong>Legal Compliance and Protection:</strong> We may disclose your information to law enforcement, government authorities, or private parties as we believe necessary to comply with law, to protect our rights, or to prevent fraud or other illegal activity.</li>
                        </ul>
                      </section>

                      <section className="space-y-4">
                        <h3 className="text-2xl font-bold">Your Rights Under GDPR</h3>
                        <p className="text-muted-foreground leading-relaxed">
                          Under GDPR, you have several rights concerning the processing of your personal data, including:
                        </p>
                        <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                          <li><strong>Right to Access:</strong> You can request access to the personal information we hold about you.</li>
                          <li><strong>Right to Rectification:</strong> You have the right to request that we correct any inaccurate or incomplete personal information.</li>
                          <li><strong>Right to Erasure:</strong> Also known as the right to be forgotten, you can request the deletion or removal of your personal information when there is no compelling reason for us to continue processing it.</li>
                          <li><strong>Right to Restrict Processing:</strong> You have the right to block or suppress further use of your personal information under certain conditions.</li>
                          <li><strong>Right to Data Portability:</strong> You have the right to obtain and reuse your personal data for your own purposes across different services.</li>
                          <li><strong>Right to Object:</strong> You may object to the processing of your personal information on grounds relating to your particular situation, at any time.</li>
                        </ul>
                      </section>

                      <section className="space-y-4">
                        <h3 className="text-2xl font-bold">CCPA (California Consumer Privacy Act)</h3>
                        <p className="text-muted-foreground leading-relaxed">
                          If you are a resident of California, you have specific rights regarding your personal information under the California Consumer Privacy Act (CCPA). These rights include:
                        </p>
                        <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                          <li><strong>The Right to Know:</strong> You have the right to know the personal information we collect, use, disclose, and sell about you.</li>
                          <li><strong>The Right to Request Deletion:</strong> You may request the deletion of your personal information that we have collected.</li>
                          <li><strong>The Right to Opt-Out of Sales:</strong> You have the right to opt-out of the sale of your personal information.</li>
                          <li><strong>The Right to Non-Discrimination:</strong> You have the right not to receive discriminatory treatment for exercising any of your CCPA rights.</li>
                        </ul>
                        <p className="text-muted-foreground leading-relaxed">
                          To exercise any of these rights, please contact us at privacy@bellonecta.com. Please note that to protect your information, we will need to verify your identity before processing your request.
                        </p>
                      </section>

                      <section className="space-y-4">
                        <h3 className="text-2xl font-bold">How to Exercise Your Rights</h3>
                        <p className="text-muted-foreground leading-relaxed">
                          To exercise any of these rights, please contact us at privacy@bellonecta.com. We will respond to your request within two weeks of receipt of the request. In certain circumstances, we may need to extend the response period to two months, and if this is the case, we will inform you of the extension and the reasons for the delay.
                        </p>
                      </section>

                      <section className="space-y-4">
                        <h3 className="text-2xl font-bold">For Compliance, Fraud Prevention and Safety</h3>
                        <p className="text-muted-foreground leading-relaxed">
                          We use personal information as we believe necessary or appropriate to enforce our terms and conditions, protect our rights, privacy, safety or property, and that of users or others. This includes:
                        </p>
                        <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                          <li><strong>Auditing Interactions:</strong> Ensuring compliance with legal and contractual obligations and requirements.</li>
                          <li><strong>Legal Compliance:</strong> Responding to legal requests and preventing harm.</li>
                          <li><strong>Security Measures:</strong> Implementing and maintaining security measures, including ongoing monitoring and evaluation.</li>
                        </ul>
                      </section>

                      <section className="space-y-4">
                        <h3 className="text-2xl font-bold">Data Security</h3>
                        <p className="text-muted-foreground leading-relaxed">
                          We employ appropriate technical and organizational measures to protect personal data from loss, misuse, alteration, or unintentional destruction. However, no security measure is completely secure and we cannot guarantee the security of your personal information. Our liability for any data breaches or unauthorized access to your personal data by third parties will be limited as permitted by applicable law. We are committed to ensuring the security of your data but cannot guarantee that our security measures will prevent all possible breaches.
                        </p>
                      </section>

                      <section className="space-y-4">
                        <h3 className="text-2xl font-bold">International Data Transfers</h3>
                        <p className="text-muted-foreground leading-relaxed">
                          BelloNecta is based in the USA and UK and operates globally, which involves transferring personal data outside of the European Economic Area (EEA). We ensure that such transfers are compliant with the GDPR and covered by legal safeguards, such as standard contractual clauses approved by the European Commission. By providing your personal data, you agree to this transfer, storing, or processing.
                        </p>
                      </section>

                      <section className="space-y-4">
                        <h3 className="text-2xl font-bold">Children's Privacy</h3>
                        <p className="text-muted-foreground leading-relaxed">
                          BelloNecta does not knowingly collect or solicit personal information from children under the age of 13 (COPPA) without obtaining verifiable consent from a parent or legal guardian. If we learn that personal information from users less than 13 years of age has been collected, we will deactivate the account and take reasonable measures to promptly delete such data from our records.
                        </p>
                      </section>

                      <section className="space-y-4">
                        <h3 className="text-2xl font-bold">Changes to This Privacy Policy</h3>
                        <p className="text-muted-foreground leading-relaxed">
                          We may update our Privacy Policy from time to time to reflect changes in our practices, technology, legal requirements, or other factors. We encourage you to review this Privacy Policy frequently to stay informed about how we are protecting the personal information we collect. The date this Privacy Policy was last updated is identified at the top of the page. Your continued use of our services after such modifications to this Privacy Policy will constitute your: (a) acknowledgment of the modified Privacy Policy; and (b) agreement to abide and be bound by that Policy.
                        </p>
                      </section>

                      <section className="space-y-4">
                        <h3 className="text-2xl font-bold">Contact Us</h3>
                        <p className="text-muted-foreground leading-relaxed">
                          For any questions, requests regarding the processing of your personal data, or complaints, please contact us via email at privacy@bellonecta.com. We are dedicated to addressing any concerns about your privacy and resolving any complaints.
                        </p>
                      </section>

                      <section className="space-y-4">
                        <h3 className="text-2xl font-bold">Data Protection Officer</h3>
                        <p className="text-muted-foreground leading-relaxed">
                          Our Data Protection Officer is available for further information regarding our data practices. You can contact our DPO directly at dpo@bellonecta.com for specific information and matters regarding data protection and privacy.
                        </p>
                      </section>

                      <section className="space-y-4">
                        <h3 className="text-2xl font-bold">Supervisory Authority</h3>
                        <p className="text-muted-foreground leading-relaxed">
                          If you are not satisfied with our response to your complaint or believe our processing of your personal data does not comply with data protection laws, you have the right to lodge a complaint with the data protection supervisory authority.
                        </p>
                      </section>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="cookies">
                  <Card>
                    <CardContent className="p-4 sm:p-8 space-y-6 sm:space-y-8">
                      <div>
                        <h2 className="text-2xl sm:text-3xl font-bold mb-2">Cookies Policy</h2>
                        <p className="text-muted-foreground text-sm">Last updated: October 1, 2025</p>
                      </div>

                      <section className="space-y-4">
                        <p className="text-muted-foreground leading-relaxed">
                          This Cookie Policy explains how BelloNecta ("we", "us", or "our") uses cookies and similar technologies in connection with the www.bellonecta.com website.
                        </p>
                      </section>

                      <section className="space-y-4">
                        <h3 className="text-2xl font-bold">What are cookies?</h3>
                        <p className="text-muted-foreground leading-relaxed">
                          Cookies are small text files that are placed on your device by websites that you visit. They are widely used to make websites work, or work more efficiently, as well as to provide information to the owners of the site. We use cookies to enhance our site's performance and to advance your user experience.
                        </p>
                      </section>

                      <section className="space-y-4">
                        <h3 className="text-2xl font-bold">How we use cookies</h3>
                        <p className="text-muted-foreground leading-relaxed">
                          When you visit our website for the first time, you will be prompted to consent to our use of cookies. We recommend that you allow cookies to be active on your device during your visits to our website, which ensures that you receive a comprehensive experience.
                        </p>
                      </section>

                      <section className="space-y-4">
                        <h3 className="text-2xl font-bold">Types of cookies we use</h3>
                        <ul className="list-disc list-inside space-y-3 text-muted-foreground ml-4">
                          <li><strong>Session cookies:</strong> These cookies remain on your device only while your browser is open and are deleted automatically once you close your browser. They help navigate between pages efficiently and generally improve your navigation experience.</li>
                          <li><strong>Persistent cookies:</strong> These cookies remain on your device for a set period specified in the cookie. We use these cookies to analyze user behavior over a longer period or to provide services that you have requested, such as showing you content customized to your interests.</li>
                          <li><strong>Strictly necessary cookies:</strong> Essential to navigate the website and use its features. Without these cookies, functionalities like secure logins and shopping baskets cannot be provided.</li>
                          <li><strong>Performance cookies:</strong> These collect information about how you use our website, like which pages you visited and which links you clicked on. None of this information can be used to identify you. It is all aggregated and, therefore, anonymized.</li>
                          <li><strong>Functionality cookies:</strong> These cookies allow our websites to remember choices you make (such as your user name) and provide enhanced, more personal features.</li>
                          <li><strong>Targeting cookies:</strong> These cookies track your browsing habits to enable us to show advertising which is more likely to be of interest to you. They remember that you visited a website and this information can be shared with other organizations such as advertisers.</li>
                          <li><strong>Third-party cookies:</strong> Our website may set third-party cookies that are not directly controlled by us. These may be used by our third-party service providers to analyze how our site is used or to personalize advertising content for you.</li>
                        </ul>
                      </section>

                      <section className="space-y-4">
                        <h3 className="text-2xl font-bold">Managing Cookies</h3>
                        <p className="text-muted-foreground leading-relaxed">
                          You have the right to decide whether to accept or reject cookies. You can exercise your cookie preferences by setting your browser to delete or refuse some or all cookies. To manage your cookies, visit the 'Help' section of your internet browser.
                        </p>
                        <p className="text-muted-foreground leading-relaxed">
                          Please be aware that if you disable or refuse cookies, some parts of this website may become inaccessible or not function properly.
                        </p>
                      </section>

                      <section className="space-y-4">
                        <h3 className="text-2xl font-bold">Further Information</h3>
                        <p className="text-muted-foreground leading-relaxed">
                          For any further queries regarding our use of cookies, please contact us at privacy@bellonecta.com.
                        </p>
                      </section>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="community">
                  <Card>
                    <CardContent className="p-4 sm:p-8 space-y-6 sm:space-y-8">
                      <div>
                        <h2 className="text-2xl sm:text-3xl font-bold mb-2">Community Policy</h2>
                        <p className="text-muted-foreground text-sm">Last updated: October 1, 2025</p>
                      </div>

                      <section className="space-y-4">
                        <h3 className="text-2xl font-bold">Introduction</h3>
                        <p className="text-muted-foreground leading-relaxed">
                          Welcome to our dedicated social media platform for the beauty industry. This Community Policy outlines the standards and guidelines under which users are expected to engage within our community. Our platform is committed to fostering a safe, respectful, and supportive environment where beauty professionals and enthusiasts can share, learn, and connect.
                        </p>
                      </section>

                      <section className="space-y-4">
                        <h3 className="text-2xl font-bold">Purpose</h3>
                        <p className="text-muted-foreground leading-relaxed">
                          This Policy is designed to support a community where users feel safe to express themselves without fear of harassment or exposure to inappropriate content. It aims to clarify what is expected from our users and the consequences of violating these guidelines.
                        </p>
                      </section>

                      <section className="space-y-4">
                        <h3 className="text-2xl font-bold">Scope</h3>
                        <p className="text-muted-foreground leading-relaxed">
                          This Policy applies to all users of the platform, including guests, registered members, and moderators, across all features of the platform including forums, comments, profiles, and any other interactive sections.
                        </p>
                      </section>

                      <section className="space-y-4">
                        <h3 className="text-2xl font-bold">1. Community Standards</h3>
                        
                        <div className="space-y-4 ml-4">
                          <div>
                            <h4 className="text-xl font-semibold mb-2">Respectful Interaction</h4>
                            <p className="text-muted-foreground leading-relaxed">
                              Users must conduct themselves with respect and honesty towards others at all times. Personal attacks, bullying, threats, and any form of harassment are strictly prohibited. Disparaging comments based on race, ethnic origin, religion, disability, gender, age, veteran status, sexual orientation, or any other form of discrimination will not be tolerated.
                            </p>
                          </div>

                          <div>
                            <h4 className="text-xl font-semibold mb-2">Content Integrity</h4>
                            <p className="text-muted-foreground leading-relaxed">
                              All content posted must be truthful and free from misleading or deceptive information. Contributions should be constructive and relevant to the discussions in which they are posted. Promotions or advertisements must be limited to sections specifically designated for such purposes and must not disrupt community interactions.
                            </p>
                          </div>

                          <div>
                            <h4 className="text-xl font-semibold mb-2">Intellectual Property Rights</h4>
                            <p className="text-muted-foreground leading-relaxed">
                              Users must respect copyright and other intellectual property rights. Sharing or distributing content without proper authorization is prohibited. The reproduction of third-party resources without explicit permission is forbidden.
                            </p>
                          </div>
                        </div>
                      </section>

                      <section className="space-y-4">
                        <h3 className="text-2xl font-bold">2. Use of the Platform</h3>
                        
                        <div className="space-y-4 ml-4">
                          <div>
                            <h4 className="text-xl font-semibold mb-2">User Accounts</h4>
                            <p className="text-muted-foreground leading-relaxed">
                              Users are responsible for maintaining the confidentiality of their account information, including passwords. Account sharing or any form of identity impersonation is prohibited.
                            </p>
                          </div>

                          <div>
                            <h4 className="text-xl font-semibold mb-2">Prohibited Actions</h4>
                            <p className="text-muted-foreground leading-relaxed">
                              Engaging in activities that disrupt the services or interfere with anyone's ability to use the platform is prohibited. Deploying or using malware, viruses, or any other malicious software designed to harm the platform, other users, or their data is forbidden. Utilizing the platform for any unlawful activities or promoting illegal acts is strictly prohibited.
                            </p>
                          </div>
                        </div>
                      </section>

                      <section className="space-y-4">
                        <h3 className="text-2xl font-bold">3. Moderation and Enforcement</h3>
                        
                        <div className="space-y-4 ml-4">
                          <div>
                            <h4 className="text-xl font-semibold mb-2">Monitoring</h4>
                            <p className="text-muted-foreground leading-relaxed">
                              We reserve the right, but not the obligation, to monitor all interactions and content posted on the platform. We may, without notice, edit or remove content that we determine in our sole discretion to be against community standards or harmful to the community.
                            </p>
                          </div>

                          <div>
                            <h4 className="text-xl font-semibold mb-2">Enforcement Actions</h4>
                            <p className="text-muted-foreground leading-relaxed">
                              Violations of this Community Policy may result in a range of enforcement actions, including, but not limited to, temporary suspension of account privileges, permanent account ban, or legal action, depending on the severity of the breach.
                            </p>
                          </div>

                          <div>
                            <h4 className="text-xl font-semibold mb-2">Reports and Complaints</h4>
                            <p className="text-muted-foreground leading-relaxed">
                              Users are encouraged to report any behavior or content that violates our Community Policy using the reporting tools provided on the platform. We commit to reviewing all reports promptly and taking appropriate action to maintain the integrity of our community.
                            </p>
                          </div>
                        </div>
                      </section>

                      <section className="space-y-4">
                        <h3 className="text-2xl font-bold">4. Legal and Regulatory Compliance</h3>
                        <p className="text-muted-foreground leading-relaxed">
                          We comply with all applicable laws and regulations in the jurisdictions where we operate. Cooperation with law enforcement and regulatory authorities will be conducted as legally required.
                        </p>
                      </section>

                      <section className="space-y-4">
                        <h3 className="text-2xl font-bold">5. Modifications to This Policy</h3>
                        <p className="text-muted-foreground leading-relaxed">
                          We reserve the right to modify this Community Policy at any time. All changes will be effective immediately upon posting to the platform. Continued use of the platform after such changes shall constitute your consent to such changes.
                        </p>
                      </section>

                      <section className="space-y-4">
                        <h3 className="text-2xl font-bold">6. Contact Information</h3>
                        <p className="text-muted-foreground leading-relaxed">
                          For further information or to clarify any part of this Community Policy, please contact our support team at support@bellonecta.com.
                        </p>
                      </section>

                      <section className="space-y-4">
                        <p className="text-muted-foreground leading-relaxed font-semibold">
                          By accessing and using the platform, you agree to abide by this Community Policy and to promote these standards within our community. Your commitment helps us maintain the platform as a welcoming and productive environment for all users.
                        </p>
                      </section>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="refund">
                  <Card>
                    <CardContent className="p-4 sm:p-8 space-y-6 sm:space-y-8">
                      <div>
                        <h2 className="text-2xl sm:text-3xl font-bold mb-2">Refund Policy</h2>
                        <p className="text-muted-foreground text-sm">Last updated: October 1, 2025</p>
                      </div>

                      <section className="space-y-4">
                        <p className="text-muted-foreground leading-relaxed">
                          This Refund Policy ("Policy") outlines the circumstances under which BelloNecta (the "Company," "we," "us," or "our") will provide refunds for purchases made on our social media platform (the "Platform"). This Policy applies to all users of the Platform, regardless of location.
                        </p>
                      </section>

                      <section className="space-y-4">
                        <h3 className="text-2xl font-bold">1. Premium Subscriptions</h3>
                        <p className="text-muted-foreground leading-relaxed">
                          BelloNecta offers premium subscriptions (the "Subscriptions") that provide users with access to enhanced features and functionalities on the Platform. Subscriptions are offered on a recurring basis (e.g., monthly, annually).
                        </p>
                        <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                          <li><strong>Full Refunds:</strong> You may be eligible for a full refund within 48 hours of purchasing a Subscription. To request a full refund, please contact our Support Team at support@bellonecta.com with the subject line "Subscription Refund Request" and your account information.</li>
                          <li><strong>Partial Refunds:</strong> After 48 hours of purchasing a Subscription, refunds will not be available unless explicitly stated otherwise in a promotional offer.</li>
                          <li><strong>Free Trials:</strong> We may offer free trials for certain Subscriptions. During the free trial period, you will have full access to the premium features. If you do not cancel your Subscription before the free trial ends, you will be automatically charged for the chosen subscription tier.</li>
                        </ul>
                      </section>

                      <section className="space-y-4">
                        <h3 className="text-2xl font-bold">2. In-App Advertising</h3>
                        <p className="text-muted-foreground leading-relaxed">
                          BelloNecta allows users to purchase advertising placements within the Platform (the "Ads").
                        </p>
                        <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                          <li><strong>No Refunds:</strong> Due to the digital nature of Ads, refunds are not available for Ads once purchased.</li>
                        </ul>
                      </section>

                      <section className="space-y-4">
                        <h3 className="text-2xl font-bold">3. Appointment Booking</h3>
                        <p className="text-muted-foreground leading-relaxed">
                          BelloNecta facilitates booking appointments with professionals (the "Appointments"). Appointments are booked directly with the professionals through the Platform. All refund for service will be handled by the professional and in accordance with the professional's refund policy.
                        </p>
                      </section>

                      <section className="space-y-4">
                        <h3 className="text-2xl font-bold">4. Event Tickets</h3>
                        <p className="text-muted-foreground leading-relaxed">
                          BelloNecta allows users to purchase tickets for beauty related events (the "Tickets"). Refunds will be issued in accordance with the specific requirements of the event organizer. We recommend that you carefully read the event organizer's refund policy prior to purchasing an event ticket.
                        </p>
                      </section>

                      <section className="space-y-4">
                        <h3 className="text-2xl font-bold">5. General Provisions</h3>
                        
                        <div className="space-y-4 ml-4">
                          <div>
                            <h4 className="text-xl font-semibold mb-2">Refunds Processing Time</h4>
                            <p className="text-muted-foreground leading-relaxed">
                              We will process refund request where applicable within 10 business days. Refunds will be issued to the original payment method used for the purchase.
                            </p>
                          </div>

                          <div>
                            <h4 className="text-xl font-semibold mb-2">Non-Refundable Items</h4>
                            <p className="text-muted-foreground leading-relaxed">
                              This Policy does not apply to any non-refundable items or services that may be offered on the Platform.
                            </p>
                          </div>

                          <div>
                            <h4 className="text-xl font-semibold mb-2">Changes to this Policy</h4>
                            <p className="text-muted-foreground leading-relaxed">
                              We reserve the right to modify this Policy at any time. We will post the revised Policy on the Platform and update the "Last Updated" date at the top of this Policy.
                            </p>
                          </div>

                          <div>
                            <h4 className="text-xl font-semibold mb-2">Contact Us</h4>
                            <p className="text-muted-foreground leading-relaxed">
                              If you have any questions about this Policy, please contact us at support@bellonecta.com with the subject line "Refund Policy Inquiry."
                            </p>
                          </div>
                        </div>
                      </section>
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

export default Terms;
