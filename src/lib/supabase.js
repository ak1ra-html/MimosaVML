import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isConfigured = Boolean(url && key)
// Sesi login admin hanya disimpan di memori (tidak di localStorage),
// jadi setiap kali halaman dibuka ulang admin wajib login lagi.
export const supabase = isConfigured
  ? createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    })
  : null

// Bersihkan sesi lama yang mungkin tersimpan dari versi sebelumnya.
if (typeof window !== 'undefined') {
  try {
    Object.keys(window.localStorage)
      .filter((k) => k.startsWith('sb-') && k.endsWith('-auth-token'))
      .forEach((k) => window.localStorage.removeItem(k))
  } catch {
    /* abaikan */
  }
}

// Hanya izinkan link http/https supaya tidak ada "javascript:" dsb.
export function safeUrl(value) {
  try {
    const u = new URL(value)
    return u.protocol === 'http:' || u.protocol === 'https:' ? u.href : null
  } catch {
    return null
  }
}
