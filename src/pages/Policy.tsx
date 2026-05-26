import { SEO } from "@/components/SEO";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Policy = () => {
  const navigate = useNavigate();
  
  return (
    <>
      <SEO 
        title="Platform Policy - BelloNecta"
        description="Learn about our platform policies and operational guidelines."
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
          <h1 className="text-4xl font-bold mb-6">Platform Policy</h1>
          <div className="prose prose-lg">
            <section className="mb-6">
              <h2 className="text-2xl font-semibold mb-3">User Responsibilities</h2>
              <p className="text-muted-foreground">
                Users are responsible for maintaining the security of their accounts and complying with all platform policies.
              </p>
            </section>
            <section className="mb-6">
              <h2 className="text-2xl font-semibold mb-3">Content Standards</h2>
              <p className="text-muted-foreground">
                All content must be appropriate, accurate, and comply with applicable laws and regulations.
              </p>
            </section>
            <section className="mb-6">
              <h2 className="text-2xl font-semibold mb-3">Service Standards</h2>
              <p className="text-muted-foreground">
                Professionals must maintain high standards of service quality and customer satisfaction.
              </p>
            </section>
          </div>
        </div>
      </div>
    </>
  );
};

export default Policy;
