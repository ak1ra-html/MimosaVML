import { useState } from 'react'
import { supabase, safeUrl } from '../lib/supabase.js'

const EMPTY = { title: '', replace_name: '', description: '', thumbnail_url: '', download_url: '' }

// Tambahkan https:// otomatis kalau link diketik tanpa awalan.
function normalizeUrl(value) {
  const v = value.trim()
  if (!v) return v
  return /^[a-z][a-z0-9+.-]*:/i.test(v) ? v : `https://${v}`
}

// Perkecil gambar besar (mis. wallpaper 4K) sebelum diupload, supaya semua gambar bisa dipakai.
async function prepareImage(file) {
  if (!file.type.startsWith('image/') || file.type === 'image/gif' || file.type === 'image/svg+xml') return file
  try {
    const bitmap = await createImageBitmap(file)
    const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(bitmap.width * scale)
    canvas.height = Math.round(bitmap.height * scale)
    canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/webp', 0.85))
    return blob ? new File([blob], 'thumb.webp', { type: 'image/webp' }) : file
  } catch {
    return file
  }
}

export default function AdminPanel({ scripts, onChanged, onClose, onLogout }) {
  const [form, setForm] = useState(EMPTY)
  const [editingId, setEditingId] = useState(null)
  const [file, setFile] = useState(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  function reset() {
    setForm(EMPTY)
    setEditingId(null)
    setFile(null)
    setError('')
  }

  function startEdit(item) {
    setEditingId(item.id)
    setFile(null)
    setError('')
    setMessage('')
    setForm({
      title: item.title || '',
      replace_name: item.replace_name || '',
      description: item.description || '',
      thumbnail_url: item.thumbnail_url || '',
      download_url: item.download_url || '',
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function uploadThumbnail(raw) {
    const file = await prepareImage(raw)
    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '')
    const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
    const { error: upError } = await supabase.storage
      .from('thumbnails')
      .upload(path, file, { cacheControl: '31536000', contentType: file.type })
    if (upError) throw upError
    return supabase.storage.from('thumbnails').getPublicUrl(path).data.publicUrl
  }

  async function submit(e) {
    e.preventDefault()
    setError('')
    setMessage('')

    const downloadUrl = safeUrl(normalizeUrl(form.download_url))
    if (!downloadUrl) {
      setError('Link download tidak valid.')
      return
    }
    if (!file && !form.thumbnail_url) {
      setError('Pilih gambar thumbnail dulu.')
      return
    }

    setBusy(true)
    try {
      let thumbnail_url = form.thumbnail_url || null
      if (file) thumbnail_url = await uploadThumbnail(file)

      const payload = {
        title: form.title.trim(),
        replace_name: form.replace_name.trim() || null,
        description: form.description.trim() || null,
        thumbnail_url,
        download_url: downloadUrl,
      }

      const query = editingId
        ? supabase.from('scripts').update(payload).eq('id', editingId)
        : supabase.from('scripts').insert(payload)
      const { error: dbError } = await query
      if (dbError) throw dbError

      setMessage(editingId ? 'Script berhasil diperbarui.' : 'Script berhasil ditambahkan.')
      reset()
      await onChanged()
    } catch (err) {
      setError(err.message || 'Gagal menyimpan.')
    } finally {
      setBusy(false)
    }
  }

  async function remove(item) {
    if (!window.confirm(`Hapus "${item.title}"?`)) return
    const { error: dbError } = await supabase.from('scripts').delete().eq('id', item.id)
    if (dbError) {
      setError(dbError.message)
      return
    }
    if (editingId === item.id) reset()
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

        <div className="grid2">
          <label>
            Judul script
            <input value={form.title} onChange={set('title')} placeholder="Script Fanny Legend" required />
          </label>
          <label>
            Replace
            <input value={form.replace_name} onChange={set('replace_name')} placeholder="Elite" />
          </label>
        </div>

        <label>
          Link download
          <input value={form.download_url} onChange={set('download_url')} placeholder="https://..." required />
        </label>

        <label>
          Deskripsi (opsional)
          <textarea rows="3" value={form.description} onChange={set('description')} />
        </label>

        <label>
          {editingId ? 'Ganti thumbnail (opsional)' : 'Upload thumbnail'}
          <input
            key={editingId || 'new'}
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
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

      <div className="admin-list">
        {scripts.map((item) => (
          <div className="admin-item" key={item.id}>
            {item.thumbnail_url ? <img src={item.thumbnail_url} alt="" /> : <div className="mini-empty" />}
            <div className="admin-item-text">
              <strong>{item.title}</strong>
              <span>{item.replace_name ? `Replace ${item.replace_name}` : '-'}</span>
            </div>
            <div className="row">
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
