import { SEO } from "@/components/SEO";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Privacy = () => {
  const navigate = useNavigate();
  
  return (
    <>
      <SEO 
        title="Privacy Policy - BelloNecta"
        description="Learn how BelloNecta collects, uses, and protects your personal information."
      />
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => navigate('/explore-styles')}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
          <h1 className="text-4xl font-bold mb-6">Privacy Policy</h1>
          <div className="prose prose-lg">
            <p className="text-muted-foreground mb-4">
              Last updated: January 2025
            </p>
            <section className="mb-6">
              <h2 className="text-2xl font-semibold mb-3">Information We Collect</h2>
              <p className="text-muted-foreground">
                We collect information that you provide directly to us when using our platform.
              </p>
            </section>
            <section className="mb-6">
              <h2 className="text-2xl font-semibold mb-3">How We Use Your Information</h2>
              <p className="text-muted-foreground">
                Your information is used to provide and improve our services, and to communicate with you.
              </p>
            </section>
          </div>
        </div>
      </div>
    </>
  );
};

export default Privacy;
