import { useEffect, useState } from 'react'
import { safeUrl } from '../lib/supabase.js'

export default function ScriptModal({ script, onClose, onDownload }) {
  const variants = script.script_variants || []
  const [zoom, setZoom] = useState(null) // { src, alt }

  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== 'Escape') return
      if (zoom) setZoom(null)
      else onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, zoom])

  return (
    <>
      <div className="overlay" onClick={onClose}>
        <div className="sheet" onClick={(e) => e.stopPropagation()}>
          <div className="sheet-head">
            <div>
              <h2>{script.title}</h2>
              {script.description && <p className="desc">{script.description}</p>}
            </div>
            <button className="btn" onClick={onClose}>Tutup</button>
          </div>

          <div className="variant-list">
            {variants.map((v) => {
              const link = safeUrl(v.download_url)
              const img = v.thumbnail_url || script.thumbnail_url
              const alt = `${script.title} replace ${v.replace_name}`
              return (
                <div className="variant" key={v.id}>
                  {img ? (
                    <button
                      type="button"
                      className="variant-img-btn"
                      onClick={() => setZoom({ src: img, alt })}
                      aria-label={`Perbesar gambar ${alt}`}
                    >
                      <img src={img} alt={alt} loading="lazy" />
                    </button>
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
                      onClick={() => onDownload(v)}
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

      {zoom && (
        <div className="lightbox" onClick={() => setZoom(null)} role="dialog" aria-label="Pratinjau gambar">
          <img src={zoom.src} alt={zoom.alt} />
          <button type="button" className="btn lightbox-close" onClick={() => setZoom(null)}>Tutup</button>
        </div>
      )}
    </>
  )
}
