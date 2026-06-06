import { createClient } from "@supabase/supabase-js";
import fs from "fs";

// Read and parse .env file manually
const envPath = ".env";
const envContent = fs.readFileSync(envPath, "utf-8");
const envVars = {};
envContent.split("\n").forEach((line) => {
  const match = line.match(/^\s*([^#=]+)\s*=\s*(.*)\s*$/);
  if (match) {
    const key = match[1].trim();
    let val = match[2].trim();
    if (val.startsWith('"') && val.endsWith('"')) {
      val = val.slice(1, -1);
    }
    envVars[key] = val;
  }
});

const supabaseUrl = envVars.VITE_SUPABASE_URL;
const supabaseAnonKey = envVars.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  try {
    const { data, error } = await supabase.auth.signUp({
      email: "faza@fazagifthouse.com",
      password: "123",
    });
    if (error) {
      console.error("Registration failed:", error.message);
    } else {
      console.log("Registration successful! User:", data.user);
    }
  } catch (err) {
    console.error("Unexpected error:", err);
  }
}

run();
