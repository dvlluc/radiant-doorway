import { Helmet } from "react-helmet-async";

interface OrganizationData {
  name: string;
  url: string;
  logo: string;
  description: string;
  sameAs: string[];
}

interface LocalBusinessData {
  name: string;
  description: string;
  image: string;
  address?: {
    streetAddress: string;
    addressLocality: string;
    addressRegion: string;
    postalCode: string;
    addressCountry: string;
  };
  telephone?: string;
  priceRange?: string;
  openingHours?: string[];
}

interface EventData {
  name: string;
  description: string;
  startDate: string;
  endDate?: string;
  location: string;
  image?: string;
  price?: number;
}

interface PersonData {
  name: string;
  jobTitle?: string;
  image?: string;
  description?: string;
  url?: string;
}

interface StructuredDataProps {
  type: "Organization" | "LocalBusiness" | "Event" | "Person" | "WebSite";
  data: OrganizationData | LocalBusinessData | EventData | PersonData | any;
}

export function StructuredData({ type, data }: StructuredDataProps) {
  const getStructuredData = () => {
    const baseData = {
      "@context": "https://schema.org",
      "@type": type,
    };

    switch (type) {
      case "Organization":
        return {
          ...baseData,
          ...data,
        };

      case "LocalBusiness":
        return {
          ...baseData,
          "@type": "BeautySalon",
          ...data,
        };

      case "Event":
        return {
          ...baseData,
          ...data,
          eventStatus: "https://schema.org/EventScheduled",
          eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
        };

      case "Person":
        return {
          ...baseData,
          ...data,
        };

      case "WebSite":
        return {
          ...baseData,
          url: window.location.origin,
          potentialAction: {
            "@type": "SearchAction",
            target: {
              "@type": "EntryPoint",
              urlTemplate: `${window.location.origin}/discover?q={search_term_string}`,
            },
            "query-input": "required name=search_term_string",
          },
        };

      default:
        return baseData;
    }
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(getStructuredData())}
      </script>
    </Helmet>
  );
}

// Default organization structured data for site-wide use
export function OrganizationStructuredData() {
  const organizationData: OrganizationData = {
    name: "BelloNecta",
    url: window.location.origin,
    logo: `${window.location.origin}/favicon.ico`,
    description: "Connect with beauty professionals, book appointments, and discover beauty services.",
    sameAs: [
      // Add social media links here when available
    ],
  };

  return (
    <>
      <StructuredData type="Organization" data={organizationData} />
      <StructuredData type="WebSite" data={{}} />
    </>
  );
}
