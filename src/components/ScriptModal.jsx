import { useEffect } from 'react'
import { safeUrl } from '../lib/supabase.js'
import { getYoutubeId, normalizeUrl } from '../lib/helpers.js'

export default function ScriptModal({ script, onClose }) {
  const variants = script.script_variants || []
  const ytId = getYoutubeId(script.youtube_url)
  const ytLink = script.youtube_url ? safeUrl(normalizeUrl(script.youtube_url)) : null

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="overlay" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-head">
          <div>
            <h2>{script.title}</h2>
            {script.description && <p className="desc">{script.description}</p>}
          </div>
          <button className="btn" onClick={onClose}>Tutup</button>
        </div>

        {ytId ? (
          <div className="yt-wrap">
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${ytId}`}
              title={`Preview ${script.title}`}
              loading="lazy"
              allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
            />
          </div>
        ) : (
          ytLink && (
            <a className="btn yt-link" href={ytLink} target="_blank" rel="noopener noreferrer">
              ▶ Lihat preview di YouTube
            </a>
          )
        )}

        <div className="variant-list">
          {variants.map((v) => {
            const link = safeUrl(v.download_url)
            const img = v.thumbnail_url || script.thumbnail_url
            return (
              <div className="variant" key={v.id}>
                {img ? (
                  <img src={img} alt={`${script.title} replace ${v.replace_name}`} loading="lazy" />
                ) : (
                  <div className="variant-empty" />
                )}
                <div className="variant-text">
                  <strong>Replace {v.replace_name}</strong>
                </div>
                {link ? (
                  <a
                    className="btn btn-primary"
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Download
                  </a>
                ) : (
                  <span className="count">Link tidak valid</span>
                )}
              </div>
            )
          })}
          {variants.length === 0 && <p className="muted">Belum ada replace untuk script ini.</p>}
        </div>
      </div>
    </div>
  )
}
