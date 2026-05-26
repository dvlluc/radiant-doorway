import { FileText, Sparkles, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const BusinessForms = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[500px] px-4">
      <div className="max-w-2xl w-full text-center space-y-6">
        {/* Icon Container */}
        <div className="relative inline-flex items-center justify-center">
          <div className="absolute inset-0 bg-primary/10 rounded-full blur-2xl animate-pulse" />
          <div className="relative bg-gradient-to-br from-primary/20 to-primary/5 p-8 rounded-full">
            <FileText className="w-16 h-16 text-primary" />
          </div>
        </div>

        {/* Badge */}
        <Badge variant="secondary" className="gap-2 text-sm px-4 py-2">
          <Sparkles className="w-4 h-4" />
          Coming Soon
        </Badge>

        {/* Heading */}
        <div className="space-y-3">
          <h2 className="text-3xl font-bold tracking-tight">
            Custom Form Builder
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Create custom intake forms, consultation questionnaires, and client information sheets tailored to your business needs.
          </p>
        </div>

        {/* Features List */}
        <div className="grid gap-4 pt-4">
          <div className="flex items-start gap-3 text-left p-4 rounded-lg bg-muted/30 border border-muted">
            <div className="mt-0.5">
              <div className="w-2 h-2 rounded-full bg-primary" />
            </div>
            <div>
              <h4 className="font-semibold mb-1">Drag & Drop Form Builder</h4>
              <p className="text-sm text-muted-foreground">
                Easily create custom forms with an intuitive interface
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 text-left p-4 rounded-lg bg-muted/30 border border-muted">
            <div className="mt-0.5">
              <div className="w-2 h-2 rounded-full bg-primary" />
            </div>
            <div>
              <h4 className="font-semibold mb-1">Client Pre-Appointment Forms</h4>
              <p className="text-sm text-muted-foreground">
                Send forms automatically before appointments to save time
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 text-left p-4 rounded-lg bg-muted/30 border border-muted">
            <div className="mt-0.5">
              <div className="w-2 h-2 rounded-full bg-primary" />
            </div>
            <div>
              <h4 className="font-semibold mb-1">Digital Signatures & Consent</h4>
              <p className="text-sm text-muted-foreground">
                Collect legal agreements and waivers electronically
              </p>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="flex items-center justify-center gap-2 pt-4 text-sm text-muted-foreground">
          <Clock className="w-4 h-4" />
          <span>Expected launch: Q2 2025</span>
        </div>
      </div>
    </div>
  );
};