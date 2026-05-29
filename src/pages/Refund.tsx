import { SEO } from "@/components/SEO";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Refund = () => {
  const navigate = useNavigate();
  
  return (
    <>
      <SEO 
        title="Refund Policy - BelloNecta"
        description="Learn about our refund and cancellation policies for services and products."
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
          <h1 className="text-4xl font-bold mb-6">Refund Policy</h1>
          <div className="prose prose-lg">
            <section className="mb-6">
              <h2 className="text-2xl font-semibold mb-3">General Policy</h2>
              <p className="text-muted-foreground">
                We strive to ensure customer satisfaction with all services and products purchased through our platform.
              </p>
            </section>
            <section className="mb-6">
              <h2 className="text-2xl font-semibold mb-3">Cancellations</h2>
              <p className="text-muted-foreground">
                Bookings can be cancelled according to the provider's cancellation policy.
              </p>
            </section>
          </div>
        </div>
      </div>
    </>
  );
};

export default Refund;
