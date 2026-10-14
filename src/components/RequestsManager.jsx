import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase.js'

const LABEL = { new: 'Baru', processing: 'Diproses', done: 'Selesai' }
const NEXT = { new: 'processing', processing: 'done', done: 'new' }

function fmt(iso) {
  try {
    return new Date(iso).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })
  } catch {
    return ''
  }
}

export default function RequestsManager({ onCount }) {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('all')

  const load = useCallback(async () => {
    const { data, error: dbError } = await supabase
      .from('script_requests')
      .select('*')
      .order('created_at', { ascending: false })
    if (dbError) setError(dbError.message)
    else {
      setError('')
      setRows(data)
      onCount?.(data.filter((r) => r.status === 'new').length)
    }
    setLoading(false)
  }, [onCount])

  useEffect(() => {
    load()
  }, [load])

  // Nomor mengikuti urutan masuk: request pertama = No. 1, dan tidak berubah saat difilter.
  const numbered = useMemo(
    () => [...rows].sort((a, b) => new Date(a.created_at) - new Date(b.created_at)).map((r, i) => ({ ...r, no: i + 1 })),
    [rows]
  )
  const list = useMemo(() => [...numbered].reverse(), [numbered]) // terbaru di atas

  const count = (s) => rows.filter((r) => r.status === s).length
  const shown = filter === 'all' ? list : list.filter((r) => r.status === filter)

  async function cycle(row) {
    const { error: dbError } = await supabase
      .from('script_requests')
      .update({ status: NEXT[row.status] })
      .eq('id', row.id)
    if (dbError) setError(dbError.message)
    else load()
  }

  async function remove(row) {
    if (!window.confirm(`Hapus request No. ${row.no}?`)) return
    const { error: dbError } = await supabase.from('script_requests').delete().eq('id', row.id)
    if (dbError) setError(dbError.message)
    else load()
  }

  const filters = [
    ['all', `Semua (${rows.length})`],
    ['new', `Baru (${count('new')})`],
    ['processing', `Diproses (${count('processing')})`],
    ['done', `Selesai (${count('done')})`],
  ]

  return (
    <div className="variants-box">
      <div className="req-total">
        <span className="req-total-num">{rows.length}</span>
        <span>total request masuk</span>
      </div>

      <div className="row row-left">
        {filters.map(([key, label]) => (
          <button key={key} className={`btn ${filter === key ? 'btn-primary' : ''}`} onClick={() => setFilter(key)}>
            {label}
          </button>
        ))}
      </div>

      {error && <p className="error">{error}</p>}
      {loading && <p className="muted">Memuat...</p>}

      <div className="admin-list">
        {shown.map((r) => (
          <div className={`req req-${r.status}`} key={r.id}>
            <span className="req-no">#{r.no}</span>
            <div className="req-main">
              <p className="req-text">{r.request_text}</p>
              <span className="req-meta">{fmt(r.created_at)}</span>
            </div>
            <div className="row">
              <button className="btn" onClick={() => cycle(r)} title="Klik untuk ganti status">
                {LABEL[r.status]}
              </button>
              <button className="btn btn-danger" onClick={() => remove(r)}>Hapus</button>
            </div>
          </div>
        ))}
        {!loading && shown.length === 0 && <p className="muted">Tidak ada request.</p>}
      </div>
    </div>
  )
}
