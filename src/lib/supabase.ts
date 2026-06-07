import { createClient } from "@supabase/supabase-js";

let supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

// Safety check: strip any trailing slash that might cause "Invalid path specified in request URL"
if (supabaseUrl.endsWith("/")) {
  supabaseUrl = supabaseUrl.slice(0, -1);
}

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "Supabase configuration missing in environment variables. Real backend requests will fail. Please check your .env file."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
