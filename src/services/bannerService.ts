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
  async getBanners(options?: { forPublic?: boolean }): Promise<DBAdBanner[]> {
    const hasLocalSession = typeof window !== "undefined" && localStorage.getItem("faza_local_session");
    const isSupabaseUnconfigured = !import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY === "your-anon-key-here";

    if ((hasLocalSession && !options?.forPublic) || isSupabaseUnconfigured) {
      const stored = localStorage.getItem("faza_local_banners");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        } catch (e) {
          // ignore
        }
      }
      return [];
    }

    try {
      const { data, error } = await supabase
        .from("ad_banners")
        .select("*")
        .order("created_at", { ascending: true });

      if (error) throw error;

      if (data && data.length > 0) {
        const list = data.map((b: any) => ({
          id: b.id,
          image: b.image_url,
          name: b.name,
          size: b.size
        }));

        localStorage.setItem("faza_local_banners", JSON.stringify(list));
        return list;
      }

      // Supabase returned 0 banners — check localStorage cache (admin may have saved locally)
      const stored = localStorage.getItem("faza_local_banners");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        } catch (e) {
          // ignore
        }
      }
      return [];
    } catch (dbError) {
      console.warn("Supabase fetch banners failed, checking local cache fallback:", dbError);
      const stored = localStorage.getItem("faza_local_banners");
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch (e) {
          // ignore
        }
      }
      return [];
    }
  },

  /**
   * Uploads banner image to storage bucket and adds database row record
   */
  async uploadBanner(file: File): Promise<DBAdBanner> {
    const hasLocalSession = typeof window !== "undefined" && localStorage.getItem("faza_local_session");
    const isSupabaseUnconfigured = !import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY === "your-anon-key-here";

    if (hasLocalSession || isSupabaseUnconfigured) {
      // Convert file to base64 so it persists locally
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const newBanner: DBAdBanner = {
        id: `local-banner-${Date.now()}`,
        image: base64,
        name: file.name,
        size: `${Math.round(file.size / 1024)} KB`
      };

      const stored = localStorage.getItem("faza_local_banners");
      let list: DBAdBanner[] = [];
      if (stored) {
        try {
          list = JSON.parse(stored);
        } catch (e) {
          // ignore
        }
      }
      list.push(newBanner);
      localStorage.setItem("faza_local_banners", JSON.stringify(list));
      return newBanner;
    }

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
    const hasLocalSession = typeof window !== "undefined" && localStorage.getItem("faza_local_session");
    const isSupabaseUnconfigured = !import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY === "your-anon-key-here";

    if (hasLocalSession || isSupabaseUnconfigured) {
      const stored = localStorage.getItem("faza_local_banners");
      if (stored) {
        try {
          let list: DBAdBanner[] = JSON.parse(stored);
          list = list.filter((b) => b.id !== id);
          localStorage.setItem("faza_local_banners", JSON.stringify(list));
        } catch (e) {
          // ignore
        }
      }
      return;
    }

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
