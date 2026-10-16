import { SOCIALS } from '../lib/links.js'
import { safeUrl } from '../lib/supabase.js'

const ICONS = {
  whatsapp: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
      <path d="M12.04 2a9.9 9.9 0 0 0-8.5 14.9L2 22l5.25-1.38A9.9 9.9 0 1 0 12.04 2Zm0 18.1c-1.5 0-2.9-.4-4.1-1.1l-.3-.18-3.1.82.83-3.03-.2-.31a8.1 8.1 0 1 1 6.87 3.8Zm4.45-6.06c-.24-.12-1.44-.71-1.66-.79-.22-.08-.39-.12-.55.12-.16.24-.63.79-.77.95-.14.16-.28.18-.52.06-.24-.12-1.02-.38-1.94-1.2-.72-.64-1.2-1.43-1.34-1.67-.14-.24-.02-.37.1-.49.11-.11.24-.28.36-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.55-1.32-.75-1.81-.2-.47-.4-.41-.55-.42h-.47c-.16 0-.42.06-.64.3-.22.24-.84.82-.84 2s.86 2.32.98 2.48c.12.16 1.7 2.6 4.12 3.64.58.25 1.03.4 1.38.51.58.18 1.1.16 1.52.1.46-.07 1.44-.59 1.64-1.16.2-.57.2-1.06.14-1.16-.06-.1-.22-.16-.46-.28Z" />
    </svg>
  ),
}

const FALLBACK_ICON = (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="M10 14a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1M14 10a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1" />
  </svg>
)

// variant "icon" = tombol bulat tanpa teks (header), "full" = ikon + nama (footer).
export default function SocialLinks({ variant = 'full' }) {
  const items = SOCIALS.map((s) => ({ ...s, href: safeUrl(s.url) })).filter((s) => s.href)
  if (items.length === 0) return null

  return (
    <div className={`socials socials-${variant}`}>
      {items.map((s) => (
        <a
          key={s.key}
          className={`social social-${s.key}`}
          href={s.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={s.label}
          title={s.label}
        >
          {ICONS[s.key] || FALLBACK_ICON}
          {variant === 'full' && <span>{s.label}</span>}
        </a>
      ))}
    </div>
  )
}
