export default function HowItWorks() {
  const steps = [
    { step: 1, title: "Discover beauty professionals" },
    { step: 2, title: "Explore styles and services" },
    { step: 3, title: "Book an appointment instantly" },
  ];

  return (
    <section className="space-y-10">
      <h2 className="text-2xl md:text-3xl font-bold font-playfair text-foreground text-center">
        Simple and Seamless Booking
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-10 max-w-3xl mx-auto">
        {steps.map((s) => (
          <div key={s.step} className="text-center space-y-4">
            <div className="mx-auto w-12 h-12 rounded-full border-2 border-foreground/20 flex items-center justify-center">
              <span className="text-lg font-semibold text-foreground">{s.step}</span>
            </div>
            <p className="text-sm font-medium text-muted-foreground">{s.title}</p>
          </div>
        ))}
      </div>
    </section>
  );
}