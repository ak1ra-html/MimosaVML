import { safeUrl } from '../lib/supabase.js'

export default function ScriptCard({ item, onDownload }) {
  const link = safeUrl(item.download_url)

  return (
    <article className="card">
      <div className="card-thumb">
        {item.thumbnail_url ? (
          <img src={item.thumbnail_url} alt={`${item.title} ${item.replace_name || ''}`} loading="lazy" />
        ) : (
          <div className="thumb-empty">Tanpa gambar</div>
        )}
        {item.replace_name && <span className="badge">Replace {item.replace_name}</span>}
      </div>

      <div className="card-body">
        <h3>{item.title}</h3>
        {item.description && <p className="desc">{item.description}</p>}

        <div className="card-foot">
          <span className="count">{item.downloads ?? 0} download</span>
          {link ? (
            <a
              className="btn btn-primary"
              href={link}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => onDownload(item)}
            >
              Download
            </a>
          ) : (
            <span className="count">Link tidak valid</span>
          )}
        </div>
      </div>
    </article>
  )
}
