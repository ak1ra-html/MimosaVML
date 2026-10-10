import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { supabase, isConfigured } from './lib/supabase.js'
import ScriptCard from './components/ScriptCard.jsx'
import AdminLogin from './components/AdminLogin.jsx'
import AdminPanel from './components/AdminPanel.jsx'

export default function App() {
  const [scripts, setScripts] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [query, setQuery] = useState('')

  const [isAdmin, setIsAdmin] = useState(false)
  const [showLogin, setShowLogin] = useState(false)
  const [showPanel, setShowPanel] = useState(false)

  // Tombol rahasia: ketuk logo 5x dalam 2 detik.
  const taps = useRef({ count: 0, timer: null })

  const load = useCallback(async () => {
    if (!isConfigured) {
      setLoading(false)
      return
    }
    const { data, error } = await supabase
      .from('scripts')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) setLoadError(error.message)
    else {
      setLoadError('')
      setScripts(data)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  // Pulihkan sesi admin jika sebelumnya sudah login.
  useEffect(() => {
    if (!isConfigured) return
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) return
      const { data: ok } = await supabase.rpc('is_admin')
      if (ok) {
        setIsAdmin(true)
      }
    })
  }, [])

  function onLogoTap() {
    const t = taps.current
    t.count += 1
    clearTimeout(t.timer)
    t.timer = setTimeout(() => (t.count = 0), 2000)
    if (t.count >= 5) {
      t.count = 0
      if (isAdmin) setShowPanel(true)
      else setShowLogin(true)
    }
  }

  async function logout() {
    await supabase.auth.signOut()
    setIsAdmin(false)
    setShowPanel(false)
  }

  async function handleDownload(item) {
    setScripts((list) => list.map((s) => (s.id === item.id ? { ...s, downloads: (s.downloads ?? 0) + 1 } : s)))
    supabase.rpc('increment_downloads', { script_id: item.id })
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return scripts
    return scripts.filter((s) => `${s.title} ${s.replace_name || ''}`.toLowerCase().includes(q))
  }, [scripts, query])

  return (
    <div className="app">
      <header className="top">
        <div className="logo" onClick={onLogoTap} role="img" aria-label="Script ML Hub">
          <span className="logo-mark">S</span>
          <span className="logo-text">MimosaVML</b></span>
        </div>
        <input
          className="search"
          type="search"
          placeholder="Cari script atau replace..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </header>

      {!isConfigured && (
        <div className="notice">
          Supabase belum dikonfigurasi. Isi <code>VITE_SUPABASE_URL</code> dan{' '}
          <code>VITE_SUPABASE_ANON_KEY</code> (lihat README).
        </div>
      )}

      {isAdmin && showPanel && (
        <AdminPanel
          scripts={scripts}
          onChanged={load}
          onClose={() => setShowPanel(false)}
          onLogout={logout}
        />
      )}

      <main>
        {loading && <p className="muted center">Memuat...</p>}
        {loadError && <p className="error center">Gagal memuat data: {loadError}</p>}
        {!loading && !loadError && filtered.length === 0 && (
          <p className="muted center">{query ? 'Tidak ada hasil.' : 'Belum ada script.'}</p>
        )}
        <div className="grid">
          {filtered.map((item) => (
            <ScriptCard key={item.id} item={item} onDownload={handleDownload} />
          ))}
        </div>
      </main>

      <footer className="foot">
        <p>MimosaVML</p>
      </footer>

      {showLogin && (
        <AdminLogin
          onClose={() => setShowLogin(false)}
          onSuccess={() => {
            setShowLogin(false)
            setIsAdmin(true)
            setShowPanel(true)
          }}
        />
      )}
    </div>
  )
}
