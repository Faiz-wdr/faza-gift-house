import { createClient } from "@supabase/supabase-js";

let supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

// Clean up the URL: extract only the base domain (e.g. https://xyz.supabase.co)
// This strips trailing slashes, /rest/v1, or /auth/v1 suffixes that cause "Invalid path specified in request URL" errors
supabaseUrl = supabaseUrl.trim();
if (supabaseUrl.includes(".supabase.co")) {
  const match = supabaseUrl.match(/^(https?:\/\/[a-z0-9-]+\.supabase\.co)/i);
  if (match) {
    supabaseUrl = match[1];
  }
}

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "Supabase configuration missing in environment variables. Real backend requests will fail. Please check your .env file."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
