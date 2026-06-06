import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || "";

let supabase: any = null;
if (supabaseUrl && supabaseAnonKey) {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
}

export default async function handler(req: any, res: any) {
  // Allow health route to be accessed without authentication
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (!supabase) {
    return res.status(500).json({
      status: "error",
      message: "Supabase environment variables are missing."
    });
  }

  try {
    // Run a tiny heartbeat query to keep Supabase active
    const { error } = await supabase
      .from("products")
      .select("id")
      .limit(1);

    if (error) {
      console.error("Supabase ping error:", error);
      return res.status(500).json({
        status: "error",
        message: "Failed to connect to Supabase database: " + error.message
      });
    }

    // Set header to prevent caching
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");

    return res.status(200).json({
      status: "ok",
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    console.error("Keep-alive function exception:", err);
    return res.status(500).json({
      status: "error",
      message: err.message || "Unknown error occurred"
    });
  }
}
