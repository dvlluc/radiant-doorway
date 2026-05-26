import { supabase } from "@/integrations/supabase/client";

export interface DirectoryBusiness {
  id: string;
  user_id: string;
  business_name: string;
  category: string | null;
  address: string;
  avatar_url: string | null;
  about_us: string | null;
  directory_photo?: string | null;
  appointment_booking_enabled?: boolean;
  averageRating?: number;
  reviewCount?: number;
}

/** Один батч запросов вместо N+1 на каждый бизнес */
export async function fetchDirectoryBusinesses(): Promise<DirectoryBusiness[]> {
  const { data, error } = await supabase
    .from("business_profiles")
    .select("id, user_id, business_name, category, address, avatar_url, about_us")
    .order("created_at", { ascending: false });

  if (error) throw error;
  if (!data?.length) return [];

  const userIds = data.map((b) => b.user_id);

  const [photosResult, settingsResult, reviewsResult, reviewPostsResult] = await Promise.all([
    supabase
      .from("business_photos")
      .select("user_id, photo_url, display_order")
      .in("user_id", userIds)
      .eq("photo_type", "directory")
      .order("display_order", { ascending: true }),
    supabase
      .from("business_settings")
      .select("user_id, appointment_booking_enabled")
      .in("user_id", userIds),
    supabase.from("reviews").select("business_id, rating").in("business_id", userIds),
    supabase
      .from("posts")
      .select("business_id, rating")
      .in("business_id", userIds)
      .eq("post_type", "review"),
  ]);

  const photoByUser = new Map<string, string>();
  photosResult.data?.forEach((row) => {
    if (!photoByUser.has(row.user_id)) {
      photoByUser.set(row.user_id, row.photo_url);
    }
  });

  const settingsByUser = new Map(
    settingsResult.data?.map((s) => [s.user_id, s.appointment_booking_enabled]) ?? [],
  );

  const ratingsByUser = new Map<string, number[]>();
  const addRating = (userId: string, rating: number) => {
    const list = ratingsByUser.get(userId) ?? [];
    list.push(rating);
    ratingsByUser.set(userId, list);
  };

  reviewsResult.data?.forEach((r) => addRating(r.business_id, r.rating));
  reviewPostsResult.data?.forEach((p) => addRating(p.business_id, p.rating ?? 5));

  return data.map((business) => {
    const ratings = ratingsByUser.get(business.user_id) ?? [];
    const averageRating =
      ratings.length > 0 ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length : 0;

    return {
      ...business,
      directory_photo: photoByUser.get(business.user_id) ?? null,
      appointment_booking_enabled: settingsByUser.get(business.user_id) ?? false,
      averageRating,
      reviewCount: ratings.length,
    };
  });
}
