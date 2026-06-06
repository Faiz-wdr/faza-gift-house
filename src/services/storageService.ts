import { supabase } from "../lib/supabase";

const BUCKET_NAME = "faza-assets";

export const storageService = {
  /**
   * Uploads a file to the Supabase faza-assets storage bucket
   * @param file The file binary to upload
   * @param folder Destination folder within the bucket (e.g. 'products', 'banners')
   * @returns Public URL of the uploaded image
   */
  async uploadAsset(file: File, folder: "products" | "banners"): Promise<string> {

    // Generate unique name for file
    const fileExt = file.name.split(".").pop();
    const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;

    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      throw error;
    }

    // Get public URL
    const { data } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(fileName);

    return data.publicUrl;
  },

  /**
   * Deletes a file from the bucket using its public URL
   * @param publicUrl Public URL of the image to remove
   */
  async deleteAsset(publicUrl: string): Promise<void> {

    try {
      const parts = publicUrl.split(`/public/${BUCKET_NAME}/`);
      if (parts.length > 1) {
        const filePath = parts[1];
        const { error } = await supabase.storage
          .from(BUCKET_NAME)
          .remove([filePath]);
        
        if (error) {
          throw error;
        }
      }
    } catch (e) {
      console.error("Error deleting asset from Supabase Storage:", e);
    }
  }
};

