import { SEO } from "@/components/SEO";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Community = () => {
  const navigate = useNavigate();
  
  return (
    <>
      <SEO 
        title="Community Guidelines - BelloNecta"
        description="Read our community guidelines and standards for the BelloNecta platform."
      />
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => navigate('/directory')}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
          <h1 className="text-4xl font-bold mb-6">Community Guidelines</h1>
          <div className="prose prose-lg">
            <p className="text-muted-foreground mb-4">
              Our community is built on respect, professionalism, and shared passion for beauty and wellness.
            </p>
            <section className="mb-6">
              <h2 className="text-2xl font-semibold mb-3">Respectful Communication</h2>
              <p className="text-muted-foreground">
                Treat all members with respect and courtesy. Harassment and discrimination are not tolerated.
              </p>
            </section>
            <section className="mb-6">
              <h2 className="text-2xl font-semibold mb-3">Professional Conduct</h2>
              <p className="text-muted-foreground">
                Maintain professional standards in all interactions and service delivery.
              </p>
            </section>
          </div>
        </div>
      </div>
    </>
  );
};

export default Community;
