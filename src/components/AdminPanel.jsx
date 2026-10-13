import { useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { uploadImage, normalizeUrl, getYoutubeId, cleanDescription } from '../lib/helpers.js'
import { safeUrl } from '../lib/supabase.js'
import VariantManager from './VariantManager.jsx'

const EMPTY = { title: '', description: '', thumbnail_url: '', youtube_url: '' }

export default function AdminPanel({ scripts, onChanged, onClose, onLogout }) {
  const [form, setForm] = useState(EMPTY)
  const [editingId, setEditingId] = useState(null)
  const [managingId, setManagingId] = useState(null)
  const [file, setFile] = useState(null)
  const [inputKey, setInputKey] = useState(0)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const managing = scripts.find((s) => s.id === managingId)
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  function reset() {
    setForm(EMPTY)
    setEditingId(null)
    setFile(null)
    setInputKey((k) => k + 1)
  }

  function startEdit(item) {
    setEditingId(item.id)
    setFile(null)
    setInputKey((k) => k + 1)
    setError('')
    setMessage('')
    setForm({
      title: item.title || '',
      description: item.description || '',
      thumbnail_url: item.thumbnail_url || '',
      youtube_url: item.youtube_url || '',
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function submit(e) {
    e.preventDefault()
    setError('')
    setMessage('')

    if (!file && !form.thumbnail_url) {
      setError('Pilih gambar thumbnail dulu.')
      return
    }

    let youtube_url = null
    if (form.youtube_url.trim()) {
      const link = safeUrl(normalizeUrl(form.youtube_url))
      if (!link || !getYoutubeId(link)) {
        setError('Link YouTube tidak valid. Contoh: https://youtu.be/xxxxxxxxxxx')
        return
      }
      youtube_url = link
    }

    setBusy(true)
    try {
      let thumbnail_url = form.thumbnail_url || null
      if (file) thumbnail_url = await uploadImage(file)

      const payload = {
        title: form.title.trim(),
        description: cleanDescription(form.description) || null,
        thumbnail_url,
        youtube_url,
      }

      if (editingId) {
        const { error: dbError } = await supabase.from('scripts').update(payload).eq('id', editingId)
        if (dbError) throw dbError
        setMessage('Script diperbarui.')
        reset()
        await onChanged()
      } else {
        const { data, error: dbError } = await supabase.from('scripts').insert(payload).select().single()
        if (dbError) throw dbError
        reset()
        await onChanged()
        setManagingId(data.id)
        setMessage('Script ditambahkan. Sekarang tambahkan replace-nya di bawah.')
      }
    } catch (err) {
      setError(err.message || 'Gagal menyimpan.')
    } finally {
      setBusy(false)
    }
  }

  async function remove(item) {
    if (!window.confirm(`Hapus "${item.title}" beserta semua replace-nya?`)) return
    const { error: dbError } = await supabase.from('scripts').delete().eq('id', item.id)
    if (dbError) {
      setError(dbError.message)
      return
    }
    if (editingId === item.id) reset()
    if (managingId === item.id) setManagingId(null)
    setError('')
    setMessage('Script dihapus.')
    await onChanged()
  }

  return (
    <section className="admin">
      <div className="admin-head">
        <h2>Panel Admin</h2>
        <div className="row">
          <button className="btn" onClick={onClose}>Tutup</button>
          <button className="btn" onClick={onLogout}>Keluar</button>
        </div>
      </div>

      <form className="admin-form" onSubmit={submit}>
        <h3>{editingId ? 'Edit script' : 'Tambah script baru'}</h3>

        <label>
          Judul script
          <input value={form.title} onChange={set('title')} placeholder="Fanny Legend" required />
        </label>

        <label>
          Deskripsi (opsional)
          <textarea
            rows="4"
            value={form.description}
            onChange={set('description')}
            placeholder={'Fanny Legend Hack Stack 0-400\nHarga? Klik Download untuk menanyakan harga'}
          />
          <small className="hint">Tekan Enter untuk pindah baris. Setiap baris tampil terpisah di beranda.</small>
        </label>

        <label>
          Link YouTube preview (opsional)
          <input
            value={form.youtube_url}
            onChange={set('youtube_url')}
            placeholder="https://youtu.be/xxxxxxxxxxx"
          />
          <small className="hint">Video ini tampil sebagai preview hasil saat kartu script dibuka.</small>
        </label>

        <label>
          {editingId ? 'Ganti thumbnail (opsional)' : 'Upload thumbnail'}
          <input key={inputKey} type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} />
        </label>
        {editingId && form.thumbnail_url && !file && (
          <img className="thumb-preview" src={form.thumbnail_url} alt="Thumbnail saat ini" />
        )}

        {error && <p className="error">{error}</p>}
        {message && <p className="ok">{message}</p>}

        <div className="row">
          {editingId && <button type="button" className="btn" onClick={reset}>Batal edit</button>}
          <button className="btn btn-primary" disabled={busy}>
            {busy ? 'Menyimpan...' : editingId ? 'Simpan perubahan' : 'Tambah script'}
          </button>
        </div>
      </form>

      {managing && (
        <VariantManager
          key={managing.id}
          script={managing}
          onChanged={onChanged}
          onClose={() => setManagingId(null)}
        />
      )}

      <div className="admin-list">
        {scripts.map((item) => (
          <div className="admin-item" key={item.id}>
            {item.thumbnail_url ? <img src={item.thumbnail_url} alt="" /> : <div className="mini-empty" />}
            <div className="admin-item-text">
              <strong>{item.title}</strong>
              <span>{(item.script_variants || []).length} replace</span>
            </div>
            <div className="row">
              <button className="btn btn-primary" onClick={() => { setManagingId(item.id); setMessage('') }}>Replace</button>
              <button className="btn" onClick={() => startEdit(item)}>Edit</button>
              <button className="btn btn-danger" onClick={() => remove(item)}>Hapus</button>
            </div>
          </div>
        ))}
        {scripts.length === 0 && <p className="muted">Belum ada script.</p>}
      </div>
    </section>
  )
}
