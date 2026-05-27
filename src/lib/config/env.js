let savedConfig = {};
try {
  savedConfig = JSON.parse(localStorage.getItem('bls_config') || '{}');
} catch (e) {
  // ignore
}

export const ENV = {
  GOOGLE_CLIENT_ID: savedConfig.googleClientId || import.meta.env.VITE_GOOGLE_CLIENT_ID,
  GOOGLE_API_KEY: import.meta.env.VITE_GOOGLE_API_KEY,
  SUPABASE_URL: savedConfig.apiUrl || import.meta.env.VITE_SUPABASE_URL,
  SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
  SCRIPT_URL: savedConfig.sheetUrl || import.meta.env.VITE_SCRIPT_URL || "https://script.google.com/macros/s/AKfycbxUN4BZX6pXpcABnTwvXRoMmhYiBvH444HL97AkfXKGx0oclJFPqbJtjC-YEfrQV96Pfw/exec",
};
