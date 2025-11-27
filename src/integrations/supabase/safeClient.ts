import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types";

let cachedClient: SupabaseClient<Database> | null = null;

/**
 * Lazy, safe access to the Supabase client.
 *
 * We check that the frontend environment has the required
 * backend variables before importing the auto-generated client.
 * This prevents hard crashes like "supabaseUrl is required" from
 * breaking the entire app when the backend is still provisioning.
 */
export const getSupabaseClient = async (): Promise<SupabaseClient<Database>> => {
  if (cachedClient) return cachedClient;

  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    throw new Error("Backend is not fully configured yet. Please try again in a moment.");
  }

  const module = await import("./client");
  cachedClient = module.supabase as SupabaseClient<Database>;
  return cachedClient;
};
