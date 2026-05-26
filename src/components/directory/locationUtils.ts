export interface DirectoryLocationSource {
  address: string;
  avatar_url: string | null;
  directory_photo?: string | null;
}

export interface DirectoryLocationOption {
  name: string;
  slug: string;
  image: string | null;
}

const STREET_KEYWORDS = [
  "street",
  "st",
  "road",
  "rd",
  "lane",
  "ln",
  "avenue",
  "ave",
  "close",
  "drive",
  "dr",
  "way",
  "court",
  "ct",
  "place",
  "pl",
  "boulevard",
  "blvd",
  "terrace",
  "crescent",
];

const NON_CITY_TERMS = new Set([
  "united kingdom",
  "england",
  "scotland",
  "wales",
  "northern ireland",
]);

export const getLocationLabelFromSlug = (slug: string) => {
  if (!slug) return "";
  return slug.charAt(0).toUpperCase() + slug.slice(1);
};

export const extractCityFromAddress = (address: string) => {
  const parts = address
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  const cityCandidate = parts.find((part) => {
    const lower = part.toLowerCase();
    const hasStreetKeyword = STREET_KEYWORDS.some(
      (keyword) => lower === keyword || lower.includes(` ${keyword}`),
    );
    const looksLikePostcode = /[a-z]{1,2}\d/i.test(lower);

    return !hasStreetKeyword && !/\d/.test(part) && !looksLikePostcode && !NON_CITY_TERMS.has(lower);
  });

  return cityCandidate ?? parts[0] ?? "";
};

export const buildLocationOptions = (
  businesses: DirectoryLocationSource[],
): DirectoryLocationOption[] => {
  const locations = new Map<string, DirectoryLocationOption>();

  businesses.forEach((business) => {
    const city = extractCityFromAddress(business.address);
    if (!city) return;

    const slug = city.toLowerCase();

    if (!locations.has(slug)) {
      locations.set(slug, {
        name: city,
        slug,
        image: business.directory_photo || business.avatar_url || null,
      });
    }
  });

  return Array.from(locations.values()).sort((a, b) => a.name.localeCompare(b.name));
};
