export function getServicePhotoUrls(service: {
  image_urls?: string[] | null;
  image_url?: string | null;
}): string[] {
  if (service.image_urls?.length) return service.image_urls;
  if (service.image_url) return [service.image_url];
  return [];
}
