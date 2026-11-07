function required(name: string, value: string | undefined) {
  if (!value) throw new Error(`Missing environment variable: ${name}. Check .env.local and restart the dev server.`);
  return value;
}

// process.env.NEXT_PUBLIC_* must be written out literally so Next can inline them.
export const supabaseUrl = () => required("NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL);
export const supabaseKey = () => required("NEXT_PUBLIC_SUPABASE_ANON_KEY", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
export const siteUrl = () => process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";