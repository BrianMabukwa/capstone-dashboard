import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://eumogdbtmkaoqdglqhti.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV1bW9nZGJ0bWthb3FkZ2xxaHRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkyOTQ1OTUsImV4cCI6MjA2NDg3MDU5NX0.5WzFrosYf60XC8HOChDw5SkA0EdDqot3PDPuHbT9grE";
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export default supabase;
