import { supabase } from "../lib/supabase";
import { storageService } from "./storageService";

export interface DBAdBanner {
  id: string;
  image: string; // public image url
  name: string;
  size: string;
}

export const bannerService = {
  /**
   * Fetches all banners from database table
   */
  async getBanners(_options?: { forPublic?: boolean }): Promise<DBAdBanner[]> {
    try {
      const { data, error } = await supabase
        .from("ad_banners")
        .select("*")
        .order("created_at", { ascending: true });

      if (error) throw error;

      if (data && data.length > 0) {
        return data.map((b: any) => ({
          id: b.id,
          image: b.image_url,
          name: b.name,
          size: b.size
        }));
      }

      return [];
    } catch (dbError) {
      console.error("Supabase fetch banners failed:", dbError);
      return [];
    }
  },

  /**
   * Uploads banner image to storage bucket and adds database row record
   */
  async uploadBanner(file: File): Promise<DBAdBanner> {
    // 1. Upload to storage bucket
    const publicUrl = await storageService.uploadAsset(file, "banners");

    // 2. Insert record in DB
    const bannerPayload = {
      image_url: publicUrl,
      name: file.name,
      size: `${Math.round(file.size / 1024)} KB`
    };

    const { data, error } = await supabase
      .from("ad_banners")
      .insert(bannerPayload)
      .select("*")
      .single();

    if (error) {
      // Cleanup uploaded asset if DB insert fails
      await storageService.deleteAsset(publicUrl);
      throw error;
    }

    return {
      id: data.id,
      image: data.image_url,
      name: data.name,
      size: data.size
    };
  },

  /**
   * Deletes banner from database and cleans up its storage binary
   */
  async deleteBanner(id: string, publicUrl: string): Promise<void> {
    // 1. Delete from database
    const { error } = await supabase
      .from("ad_banners")
      .delete()
      .eq("id", id);

    if (error) throw error;

    // 2. Delete asset from storage
    await storageService.deleteAsset(publicUrl);
  }
};
