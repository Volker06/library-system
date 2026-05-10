import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import axios from 'axios'

const REST_URL = `${import.meta.env.VITE_API_URL}/api/v1`
const GRAPHQL_URL = `${import.meta.env.VITE_API_URL}/graphql`

// ─── Shared helpers ───────────────────────────────────────────────────────────
function Toast({ message, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t) }, [onClose])
  const bg = type === 'success' ? '#EAF3DE' : '#FCEBEB'
  const color = type === 'success' ? '#27500A' : '#791F1F'
  const icon = type === 'success' ? 'ti-circle-check' : 'ti-circle-x'
  return (
    <div style={{ position: 'fixed', bottom: '24px', right: '24px', background: bg, color, border: `1px solid ${color}40`, borderRadius: '10px', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 500, zIndex: 999, boxShadow: '0 4px 20px rgba(0,0,0,0.12)' }}>
      <i className={`ti ${icon}`} style={{ fontSize: '18px' }} />
      {message}
    </div>
  )
}

function Card({ children, style }) {
  return (
    <div style={{ background: 'var(--color-background-primary)', border: '0.5px solid var(--color-border-tertiary)', borderRadius: '12px', padding: '1.25rem', ...style }}>
      {children}
    </div>
  )
}

function Badge({ children, color = 'blue' }) {
  const map = {
    blue:   { bg: '#E6F1FB', text: '#0C447C' },
    green:  { bg: '#EAF3DE', text: '#27500A' },
    orange: { bg: '#FAEEDA', text: '#633806' },
    red:    { bg: '#FCEBEB', text: '#791F1F' },
    gray:   { bg: 'var(--color-background-secondary)', text: 'var(--color-text-secondary)' },
  }
  const c = map[color] || map.blue
  return <span style={{ background: c.bg, color: c.text, fontSize: '11px', fontWeight: 500, padding: '2px 8px', borderRadius: '6px', display: 'inline-block' }}>{children}</span>
}

// ─── Sidebar layout ───────────────────────────────────────────────────────────
function Sidebar({ items, active, onSelect, accentColor, header, footer }) {
  return (
    <aside style={{ width: '220px', minHeight: '100vh', background: accentColor, display: 'flex', flexDirection: 'column', flexShrink: 0, position: 'sticky', top: 0, alignSelf: 'flex-start', height: '100vh' }}>
      {/* Logo */}
      <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid rgba(255,255,255,0.12)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: 36, height: 36, background: 'rgba(255,255,255,0.15)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <i className="ti ti-books" style={{ fontSize: '20px', color: 'white' }} />
          </div>
          <div>
            <p style={{ color: 'white', fontWeight: 600, fontSize: '14px', margin: 0 }}>LibraryMS</p>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '11px', margin: 0 }}>{header}</p>
          </div>
        </div>
      </div>

      {/* Nav items */}
      <nav style={{ flex: 1, padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {items.map(item => {
          const isActive = active === item.id
          return (
            <button key={item.id} onClick={() => onSelect(item.id)} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 12px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: isActive ? 600 : 400, background: isActive ? 'rgba(255,255,255,0.18)' : 'transparent', color: isActive ? 'white' : 'rgba(255,255,255,0.7)', textAlign: 'left', width: '100%', transition: 'all 0.15s' }}>
              <i className={`ti ${item.icon}`} style={{ fontSize: '17px', flexShrink: 0 }} />
              <span>{item.label}</span>
              {item.badge > 0 && <span style={{ marginLeft: 'auto', background: '#FF6B35', color: 'white', fontSize: '10px', fontWeight: 700, padding: '1px 6px', borderRadius: '99px' }}>{item.badge}</span>}
            </button>
          )
        })}
      </nav>

      {/* Footer */}
      {footer && <div style={{ padding: '12px 10px', borderTop: '1px solid rgba(255,255,255,0.12)' }}>{footer}</div>}
    </aside>
  )
}

// ─── App root ─────────────────────────────────────────────────────────────────
export default function App() {
  const [token, setToken]           = useState(localStorage.getItem('token'))
  const [currentUser, setCurrentUser] = useState(JSON.parse(localStorage.getItem('user') || 'null'))
  const [page, setPage]             = useState('books')
  const [toast, setToast]           = useState(null)
  const [activeRentals, setActiveRentals] = useState([])
  const [showRentals, setShowRentals] = useState(false)
  const rentalsRef = useRef(null)

  const showToast = (message, type = 'success') => setToast({ message, type })

  const login = (t, u) => {
    localStorage.setItem('token', t)
    localStorage.setItem('user', JSON.stringify(u))
    setToken(t); setCurrentUser(u)
    setPage(u.role === 'admin' ? 'books' : 'books')
  }

  const logout = () => {
    localStorage.removeItem('token'); localStorage.removeItem('user')
    setToken(null); setCurrentUser(null); setActiveRentals([])
  }

  const loadRentals = async () => {
    if (!token || !currentUser) return
    try {
      const res = await axios.get(`${REST_URL}/borrow`, { headers: { Authorization: `Bearer ${token}` } })
      setActiveRentals(res.data.filter(r => r.userId === currentUser.id && !r.returnedAt))
    } catch {}
  }

  useEffect(() => { if (token && currentUser?.role === 'user') loadRentals() }, [token])

  useEffect(() => {
    const h = (e) => { if (rentalsRef.current && !rentalsRef.current.contains(e.target)) setShowRentals(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const returnBook = async (id) => {
    await axios.put(`${REST_URL}/borrow/${id}/return`, {}, { headers: { Authorization: `Bearer ${token}` } })
    showToast('Book returned successfully!'); loadRentals()
  }

  if (!token) return <LoginPage onLogin={login} />

  const isAdmin = currentUser?.role === 'admin'

  // Sidebar config
  const adminNav = [
    { id: 'books',   label: 'Books',        icon: 'ti-books' },
    { id: 'authors', label: 'Authors',      icon: 'ti-user-edit' },
    { id: 'borrow',  label: 'Borrow Records', icon: 'ti-clipboard-list' },
    { id: 'users',   label: 'Users',        icon: 'ti-users' },
    { id: 'report',  label: 'Reports',      icon: 'ti-chart-bar' },
    { id: 'compare', label: 'API Compare',  icon: 'ti-arrows-exchange' },
  ]

  const userNav = [
    { id: 'books',   label: 'Browse Books', icon: 'ti-books' },
    { id: 'history', label: 'My Rentals',   icon: 'ti-book-2', badge: activeRentals.length },
    { id: 'payment', label: 'Fees & Payment', icon: 'ti-receipt' },
  ]

  const sidebarColor = isAdmin ? '#1a2744' : '#185FA5'

  const sidebarFooter = (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', marginBottom: '4px' }}>
        <div style={{ width: 30, height: 30, background: 'rgba(255,255,255,0.15)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <i className="ti ti-user" style={{ fontSize: '14px', color: 'white' }} />
        </div>
        <div style={{ overflow: 'hidden' }}>
          <p style={{ color: 'white', fontSize: '12px', fontWeight: 500, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{currentUser?.name}</p>
          <Badge color={isAdmin ? 'red' : 'blue'}>{currentUser?.role}</Badge>
        </div>
      </div>
      <button onClick={logout} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '13px', color: 'rgba(255,255,255,0.7)', background: 'transparent', width: '100%' }}>
        <i className="ti ti-logout" style={{ fontSize: '16px' }} />
        Sign out
      </button>
    </div>
  )

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--color-background-secondary)', overflow: 'auto' }}>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/tabler-icons.min.css" />

      <Sidebar
        items={isAdmin ? adminNav : userNav}
        active={page}
        onSelect={setPage}
        accentColor={sidebarColor}
        header={isAdmin ? 'Admin Panel' : 'Member Portal'}
        footer={sidebarFooter}
      />

      {/* Main content */}
      <div style={{ flex: 1, padding: '2rem', overflow: 'visible' }}>
        {/* Top bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
              {page === 'books'   && (isAdmin ? 'Books Management' : 'Browse Books')}
              {page === 'authors' && 'Authors'}
              {page === 'borrow'  && 'Borrow Records'}
              {page === 'compare' && 'API Comparison'}
              {page === 'history' && 'My Rentals'}
              {page === 'users'   && 'Users Management'}
              {page === 'report'  && 'Reports & Analytics'}
              {page === 'payment' && 'Fees & Payment'}
            </h1>
            <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--color-text-secondary)' }}>
              {page === 'books'   && (isAdmin ? 'Manage the book catalogue' : 'Find and borrow books from our collection')}
              {page === 'authors' && 'Manage author profiles'}
              {page === 'borrow'  && 'All borrow & return activity'}
              {page === 'compare' && 'REST vs GraphQL fetching efficiency demo'}
              {page === 'history' && 'Books you are currently borrowing'}
              {page === 'users'   && 'Manage member accounts'}
              {page === 'report'  && 'Overview of library activity and statistics'}
              {page === 'payment' && 'View and pay outstanding late fees'}
            </p>
          </div>

          {/* My Rentals quick access — user only, in topbar */}
          {!isAdmin && (
            <div ref={rentalsRef} style={{ position: 'relative' }}>
              <button onClick={() => setShowRentals(v => !v)} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'var(--color-background-primary)', border: '0.5px solid var(--color-border-secondary)', borderRadius: '8px', padding: '7px 14px', fontSize: '13px', fontWeight: 500, cursor: 'pointer', color: 'var(--color-text-primary)' }}>
                <i className="ti ti-book-2" style={{ fontSize: '15px' }} />
                Active Rentals
                {activeRentals.length > 0 && (
                  <span style={{ background: '#185FA5', color: 'white', fontSize: '10px', fontWeight: 700, padding: '1px 7px', borderRadius: '99px' }}>
                    {activeRentals.length}
                  </span>
                )}
              </button>
              {showRentals && (
                <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 8px)', background: 'var(--color-background-primary)', border: '0.5px solid var(--color-border-tertiary)', borderRadius: '12px', width: '340px', boxShadow: '0 8px 32px rgba(0,0,0,0.14)', zIndex: 100, overflow: 'hidden' }}>
                  <div style={{ padding: '12px 16px', borderBottom: '0.5px solid var(--color-border-tertiary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <p style={{ fontWeight: 600, margin: 0, fontSize: '13px' }}>Active Rentals</p>
                    <Badge color="blue">{activeRentals.length} active</Badge>
                  </div>
                  {activeRentals.length === 0
                    ? <p style={{ padding: '1.25rem', color: 'var(--color-text-secondary)', fontSize: '13px', textAlign: 'center', margin: 0 }}>No active rentals</p>
                    : activeRentals.map(r => (
                      <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px', borderBottom: '0.5px solid var(--color-border-tertiary)' }}>
                        <div>
                          <p style={{ fontWeight: 500, margin: '0 0 2px', fontSize: '13px' }}>{r.book?.title}</p>
                          <p style={{ fontSize: '11px', color: 'var(--color-text-secondary)', margin: 0 }}>Since {new Date(r.borrowedAt).toLocaleDateString()}</p>
                        </div>
                        <button onClick={() => { returnBook(r.id); setShowRentals(false) }} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#EAF3DE', color: '#27500A', border: 'none', borderRadius: '6px', padding: '5px 10px', fontSize: '12px', cursor: 'pointer', fontWeight: 500 }}>
                          <i className="ti ti-check" style={{ fontSize: '13px' }} /> Return
                        </button>
                      </div>
                    ))
                  }
                </div>
              )}
            </div>
          )}
        </div>

        {/* Page content */}
        {page === 'books'   && !isAdmin && <UserBooksPage token={token} currentUser={currentUser} onBorrow={() => { showToast('Borrowed successfully!'); loadRentals() }} />}
        {page === 'books'   && isAdmin  && <AdminBooksPage token={token} showToast={showToast} />}
        {page === 'authors' && isAdmin  && <AuthorsPage token={token} showToast={showToast} />}
        {page === 'borrow'  && isAdmin  && <AdminBorrowPage token={token} />}
        {page === 'compare' && isAdmin  && <ComparePage />}
        {page === 'users'   && isAdmin  && <AdminUsersPage token={token} showToast={showToast} />}
        {page === 'report'  && isAdmin  && <ReportPage token={token} />}
        {page === 'history' && !isAdmin && <UserHistoryPage token={token} currentUser={currentUser} onReturn={() => { showToast('Returned successfully!'); loadRentals() }} />}
        {page === 'payment' && !isAdmin && <UserPaymentPage token={token} currentUser={currentUser} onReturn={() => { showToast('Returned & paid successfully!'); loadRentals() }} />}
      </div>

      {toast && <Toast message={toast.message} type={toast.type || 'success'} onClose={() => setToast(null)} />}
    </div>
  )
}

// ─── Login ────────────────────────────────────────────────────────────────────
function LoginPage({ onLogin }) {
  const [form, setForm]           = useState({ email: '', password: '' })
  const [error, setError]         = useState('')
  const [loading, setLoading]     = useState(false)
  const [showRegister, setShowRegister] = useState(false)
  const [regForm, setRegForm]     = useState({ name: '', email: '', password: '' })

  const handleLogin = async () => {
    setLoading(true); setError('')
    try {
      const res = await axios.post(`${REST_URL}/auth/login`, form)
      onLogin(res.data.token, res.data.user)
    } catch { setError('Invalid email or password') }
    setLoading(false)
  }

  const handleRegister = async () => {
    setLoading(true); setError('')
    try {
      await axios.post(`${REST_URL}/auth/register`, { ...regForm, role: 'user' })
      setShowRegister(false)
      setForm({ email: regForm.email, password: regForm.password })
    } catch { setError('Email already exists') }
    setLoading(false)
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex' }}>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/tabler-icons.min.css" />

      {/* Left panel — decorative */}
      <div style={{ flex: 1, background: 'linear-gradient(135deg, #1a2744 0%, #185FA5 60%, #0f4a8a 100%)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '3rem', position: 'relative', overflow: 'hidden' }}>
        {/* Background pattern */}
        <div style={{ position: 'absolute', inset: 0, opacity: 0.06, backgroundImage: 'repeating-linear-gradient(45deg, white 0, white 1px, transparent 0, transparent 50%)', backgroundSize: '20px 20px' }} />

        <div style={{ position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '3rem' }}>
            <div style={{ width: 44, height: 44, background: 'rgba(255,255,255,0.15)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="ti ti-books" style={{ fontSize: '24px', color: 'white' }} />
            </div>
            <span style={{ color: 'white', fontWeight: 600, fontSize: '18px' }}>LibraryMS</span>
          </div>

          <h2 style={{ color: 'white', fontSize: '32px', fontWeight: 700, margin: '0 0 12px', lineHeight: 1.3 }}>
            Your gateway to<br />knowledge
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '15px', margin: 0, lineHeight: 1.6 }}>
            Borrow books, track your reading,<br />and explore our collection.
          </p>
        </div>

        {/* Stats */}
        <div style={{ position: 'relative', display: 'flex', gap: '1.5rem' }}>
          {[['ti-book', 'Books Available', 'Curated collection'], ['ti-users', 'Members', 'Active readers'], ['ti-arrows-exchange', 'REST + GraphQL', 'Dual API demo']].map(([icon, title, sub]) => (
            <div key={title} style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '10px', padding: '14px 16px', flex: 1 }}>
              <i className={`ti ${icon}`} style={{ fontSize: '22px', color: 'rgba(255,255,255,0.8)', display: 'block', marginBottom: '6px' }} />
              <p style={{ color: 'white', fontWeight: 600, fontSize: '13px', margin: '0 0 2px' }}>{title}</p>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', margin: 0 }}>{sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — form */}
      <div style={{ width: '420px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', background: 'var(--color-background-secondary)' }}>
        <div style={{ width: '100%' }}>
          <h2 style={{ fontSize: '22px', fontWeight: 600, margin: '0 0 4px', color: 'var(--color-text-primary)' }}>
            {showRegister ? 'Create account' : 'Welcome back'}
          </h2>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '13px', margin: '0 0 1.75rem' }}>
            {showRegister ? 'Register to access the library' : 'Sign in to your library account'}
          </p>

          {error && (
            <div style={{ background: '#FCEBEB', border: '0.5px solid #F0BBBB', borderRadius: '8px', padding: '10px 12px', fontSize: '13px', color: '#791F1F', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <i className="ti ti-alert-circle" style={{ fontSize: '16px' }} />
              {error}
            </div>
          )}

          {!showRegister ? (
            <>
              {[['Email', 'email', 'your@email.com', 'email'], ['Password', 'password', '••••••••', 'password']].map(([label, key, ph, type]) => (
                <div key={key} style={{ marginBottom: '14px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--color-text-secondary)', display: 'block', marginBottom: '5px' }}>{label}</label>
                  <input type={type} placeholder={ph} value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} onKeyDown={e => e.key === 'Enter' && handleLogin()}
                    style={{ width: '100%', boxSizing: 'border-box', fontSize: '13px', padding: '9px 12px', borderRadius: '8px', border: '0.5px solid var(--color-border-secondary)', background: 'var(--color-background-primary)', color: 'var(--color-text-primary)', outline: 'none' }} />
                </div>
              ))}
              <button onClick={handleLogin} disabled={loading}
                style={{ width: '100%', background: '#185FA5', color: 'white', border: 'none', borderRadius: '8px', padding: '10px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', marginBottom: '14px', opacity: loading ? 0.7 : 1 }}>
                {loading ? 'Signing in...' : 'Sign in →'}
              </button>
              <p style={{ textAlign: 'center', fontSize: '13px', color: 'var(--color-text-secondary)', margin: 0 }}>
                No account? <button onClick={() => { setShowRegister(true); setError('') }} style={{ background: 'none', border: 'none', color: '#185FA5', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>Register here</button>
              </p>
            </>
          ) : (
            <>
              {[['Full name', 'name', 'John Doe', 'text'], ['Email', 'email', 'your@email.com', 'email'], ['Password', 'password', '••••••••', 'password']].map(([label, key, ph, type]) => (
                <div key={key} style={{ marginBottom: '14px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--color-text-secondary)', display: 'block', marginBottom: '5px' }}>{label}</label>
                  <input type={type} placeholder={ph} value={regForm[key]} onChange={e => setRegForm({ ...regForm, [key]: e.target.value })}
                    style={{ width: '100%', boxSizing: 'border-box', fontSize: '13px', padding: '9px 12px', borderRadius: '8px', border: '0.5px solid var(--color-border-secondary)', background: 'var(--color-background-primary)', color: 'var(--color-text-primary)', outline: 'none' }} />
                </div>
              ))}
              <button onClick={handleRegister} disabled={loading}
                style={{ width: '100%', background: '#0F6E56', color: 'white', border: 'none', borderRadius: '8px', padding: '10px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', marginBottom: '14px', opacity: loading ? 0.7 : 1 }}>
                {loading ? 'Creating...' : 'Create account →'}
              </button>
              <p style={{ textAlign: 'center', fontSize: '13px', color: 'var(--color-text-secondary)', margin: 0 }}>
                Already registered? <button onClick={() => { setShowRegister(false); setError('') }} style={{ background: 'none', border: 'none', color: '#185FA5', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>Sign in</button>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── User: Browse Books ───────────────────────────────────────────────────────
function UserBooksPage({ token, currentUser, onBorrow }) {
  const [books, setBooks]     = useState([])
  const [search, setSearch]   = useState('')
  const [selected, setSelected] = useState(null)
  const [borrowing, setBorrowing] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => { axios.get(`${REST_URL}/books`).then(r => setBooks(r.data)) }, [])

  const filtered = books.filter(b =>
    b.title.toLowerCase().includes(search.toLowerCase()) ||
    b.author?.name.toLowerCase().includes(search.toLowerCase())
  )

  const borrow = async () => {
    setBorrowing(true)
    try {
      await axios.post(`${REST_URL}/borrow`, { userId: currentUser.id, bookId: selected.id }, { headers: { Authorization: `Bearer ${token}` } })
      setSuccess(true)
      onBorrow()
      setTimeout(() => { setSuccess(false); setSelected(null) }, 2500)
    } catch {}
    setBorrowing(false)
  }

  const thStyle = { background: 'var(--color-background-secondary)', color: 'var(--color-text-secondary)', fontWeight: 500, fontSize: '12px', padding: '9px 14px', textAlign: 'left', borderBottom: '0.5px solid var(--color-border-tertiary)' }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 300px' : '1fr', gap: '1.25rem', alignItems: 'start' }}>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <p style={{ fontWeight: 600, fontSize: '14px', margin: 0 }}>{books.length} books in collection</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--color-background-secondary)', border: '0.5px solid var(--color-border-tertiary)', borderRadius: '8px', padding: '6px 12px' }}>
            <i className="ti ti-search" style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search title or author..." style={{ border: 'none', background: 'none', outline: 'none', fontSize: '13px', color: 'var(--color-text-primary)', width: '200px' }} />
          </div>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr>
              <th style={thStyle}>Title</th>
              <th style={thStyle}>Author</th>
              <th style={thStyle}>Year</th>
              <th style={thStyle}></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(b => (
              <tr key={b.id} onClick={() => setSelected(b)} style={{ borderBottom: '0.5px solid var(--color-border-tertiary)', cursor: 'pointer', background: selected?.id === b.id ? 'var(--color-background-secondary)' : 'transparent', transition: 'background 0.1s' }}>
                <td style={{ padding: '11px 14px', fontWeight: 500 }}>{b.title}</td>
                <td style={{ padding: '11px 14px' }}><Badge color="blue">{b.author?.name}</Badge></td>
                <td style={{ padding: '11px 14px', color: 'var(--color-text-secondary)' }}>{b.publishedYear}</td>
                <td style={{ padding: '11px 14px' }}>
                  <button onClick={e => { e.stopPropagation(); setSelected(b) }} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'var(--color-background-secondary)', border: '0.5px solid var(--color-border-secondary)', borderRadius: '6px', padding: '4px 10px', fontSize: '12px', cursor: 'pointer', color: 'var(--color-text-primary)' }}>
                    <i className="ti ti-eye" style={{ fontSize: '13px' }} /> View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* Detail panel */}
      {selected && (
        <Card style={{ position: 'sticky', top: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <p style={{ fontWeight: 600, fontSize: '14px', margin: 0 }}>Book details</p>
            <button onClick={() => { setSelected(null); setSuccess(false) }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)', padding: '2px' }}>
              <i className="ti ti-x" style={{ fontSize: '16px' }} />
            </button>
          </div>

          <div style={{ background: 'linear-gradient(135deg, #E6F1FB 0%, #d4e8f8 100%)', borderRadius: '10px', padding: '20px', textAlign: 'center', marginBottom: '1rem' }}>
            <i className="ti ti-book-2" style={{ fontSize: '40px', color: '#185FA5', display: 'block', marginBottom: '8px' }} />
            <p style={{ fontWeight: 600, fontSize: '14px', margin: '0 0 4px', color: '#0C447C' }}>{selected.title}</p>
            <Badge color="blue">{selected.author?.name}</Badge>
          </div>

          {[['ti-barcode', 'ISBN', selected.isbn], ['ti-calendar', 'Published', selected.publishedYear], ['ti-file-description', 'Author bio', selected.author?.bio || '—']].map(([icon, label, value]) => (
            <div key={label} style={{ display: 'flex', gap: '10px', marginBottom: '10px', fontSize: '13px' }}>
              <i className={`ti ${icon}`} style={{ fontSize: '15px', color: 'var(--color-text-secondary)', flexShrink: 0, marginTop: '1px' }} />
              <div>
                <span style={{ color: 'var(--color-text-secondary)', fontSize: '11px', display: 'block' }}>{label}</span>
                <span>{value}</span>
              </div>
            </div>
          ))}

          {success ? (
            <div style={{ background: '#EAF3DE', borderRadius: '8px', padding: '12px', textAlign: 'center' }}>
              <i className="ti ti-circle-check" style={{ fontSize: '24px', color: '#27500A', display: 'block', marginBottom: '4px' }} />
              <p style={{ color: '#27500A', fontWeight: 600, fontSize: '13px', margin: 0 }}>Borrowed successfully!</p>
              <p style={{ color: '#3d6b1a', fontSize: '12px', margin: '2px 0 0' }}>Check "My Rentals" above</p>
            </div>
          ) : (
            <button onClick={borrow} disabled={borrowing} style={{ width: '100%', background: '#185FA5', color: 'white', border: 'none', borderRadius: '8px', padding: '10px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', marginTop: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', opacity: borrowing ? 0.7 : 1 }}>
              <i className="ti ti-book-upload" style={{ fontSize: '15px' }} />
              {borrowing ? 'Processing...' : 'Borrow This Book'}
            </button>
          )}
        </Card>
      )}
    </div>
  )
}

// ─── User: My Rentals history ─────────────────────────────────────────────────
function UserHistoryPage({ token, currentUser, onReturn }) {
  const [records, setRecords] = useState([])
  const [loaded, setLoaded]   = useState(false)

  const load = async () => {
    const res = await axios.get(`${REST_URL}/borrow`, { headers: { Authorization: `Bearer ${token}` } })
    setRecords(res.data.filter(r => r.userId === currentUser.id))
    setLoaded(true)
  }

  useEffect(() => { load() }, [])

  const returnBook = async (id) => {
    await axios.put(`${REST_URL}/borrow/${id}/return`, {}, { headers: { Authorization: `Bearer ${token}` } })
    onReturn(); load()
  }

  const active = records.filter(r => !r.returnedAt)
  const done   = records.filter(r => r.returnedAt)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
        {[
          { label: 'Total Borrowed', value: records.length, icon: 'ti-books', color: '#185FA5', bg: '#E6F1FB' },
          { label: 'Currently Active', value: active.length, icon: 'ti-book-2', color: '#633806', bg: '#FAEEDA' },
          { label: 'Returned', value: done.length, icon: 'ti-circle-check', color: '#27500A', bg: '#EAF3DE' },
        ].map(s => (
          <Card key={s.label} style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: 44, height: 44, background: s.bg, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <i className={`ti ${s.icon}`} style={{ fontSize: '22px', color: s.color }} />
            </div>
            <div>
              <p style={{ fontSize: '22px', fontWeight: 700, margin: 0, color: 'var(--color-text-primary)' }}>{s.value}</p>
              <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', margin: 0 }}>{s.label}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Active rentals */}
      {active.length > 0 && (
        <Card>
          <p style={{ fontWeight: 600, fontSize: '14px', margin: '0 0 1rem' }}>Currently Borrowing</p>
          {active.map(r => (
            <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '0.5px solid var(--color-border-tertiary)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: 36, height: 36, background: '#E6F1FB', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i className="ti ti-book" style={{ fontSize: '18px', color: '#185FA5' }} />
                </div>
                <div>
                  <p style={{ fontWeight: 500, margin: '0 0 2px', fontSize: '13px' }}>{r.book?.title}</p>
                  <p style={{ fontSize: '11px', color: 'var(--color-text-secondary)', margin: 0 }}>Borrowed {new Date(r.borrowedAt).toLocaleDateString()}</p>
                </div>
              </div>
              <button onClick={() => returnBook(r.id)} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#EAF3DE', color: '#27500A', border: 'none', borderRadius: '6px', padding: '6px 12px', fontSize: '12px', cursor: 'pointer', fontWeight: 500 }}>
                <i className="ti ti-check" style={{ fontSize: '13px' }} /> Return
              </button>
            </div>
          ))}
        </Card>
      )}

      {/* History */}
      <Card>
        <p style={{ fontWeight: 600, fontSize: '14px', margin: '0 0 1rem' }}>Borrow History</p>
        {!loaded && <p style={{ color: 'var(--color-text-secondary)', textAlign: 'center', padding: '1.5rem 0', fontSize: '13px' }}>Loading...</p>}
        {done.length === 0 && loaded && <p style={{ color: 'var(--color-text-secondary)', textAlign: 'center', padding: '1.5rem 0', fontSize: '13px' }}>No returned books yet</p>}
        {done.map(r => (
          <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '0.5px solid var(--color-border-tertiary)' }}>
            <div>
              <p style={{ fontWeight: 500, margin: '0 0 2px', fontSize: '13px' }}>{r.book?.title}</p>
              <p style={{ fontSize: '11px', color: 'var(--color-text-secondary)', margin: 0 }}>
                {new Date(r.borrowedAt).toLocaleDateString()} → {new Date(r.returnedAt).toLocaleDateString()}
              </p>
            </div>
            <Badge color="green">Returned</Badge>
          </div>
        ))}
      </Card>
    </div>
  )
}

// ─── Admin: Books ─────────────────────────────────────────────────────────────
function AdminBooksPage({ token, showToast }) {
  const [books, setBooks]       = useState([])
  const [loaded, setLoaded]     = useState(false)
  const [search, setSearch]     = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editBook, setEditBook] = useState(null)
  const [form, setForm]         = useState({ title: '', isbn: '', publishedYear: '', authorId: '' })
  const headers = { Authorization: `Bearer ${token}` }

  const load = async () => { const res = await axios.get(`${REST_URL}/books`); setBooks(res.data); setLoaded(true) }
  useEffect(() => { load() }, [])

  const openAdd  = () => { setEditBook(null); setForm({ title: '', isbn: '', publishedYear: '', authorId: '' }); setShowModal(true) }
  const openEdit = (b) => { setEditBook(b); setForm({ title: b.title, isbn: b.isbn, publishedYear: b.publishedYear, authorId: b.authorId }); setShowModal(true) }

  const save = async () => {
    const data = { ...form, publishedYear: parseInt(form.publishedYear), authorId: parseInt(form.authorId) }
    if (editBook) await axios.put(`${REST_URL}/books/${editBook.id}`, data, { headers })
    else await axios.post(`${REST_URL}/books`, data, { headers })
    setShowModal(false); load()
    showToast(editBook ? 'Book updated!' : 'Book added!')
  }

  const remove = async (id) => {
    if (!window.confirm('Delete this book?')) return
    await axios.delete(`${REST_URL}/books/${id}`, { headers })
    load(); showToast('Book deleted!', 'error')
  }

  const filtered = books.filter(b => b.title.toLowerCase().includes(search.toLowerCase()) || b.author?.name.toLowerCase().includes(search.toLowerCase()))
  const thStyle = { background: 'var(--color-background-secondary)', color: 'var(--color-text-secondary)', fontWeight: 500, fontSize: '12px', padding: '9px 14px', textAlign: 'left', borderBottom: '0.5px solid var(--color-border-tertiary)' }

  return (
    <div>
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1rem', marginBottom: '1.25rem' }}>
        {[{ label: 'Total Books', value: books.length, icon: 'ti-books', color: '#185FA5', bg: '#E6F1FB' }, { label: 'Authors', value: [...new Set(books.map(b => b.authorId))].length, icon: 'ti-users', color: '#0F6E56', bg: '#EAF3DE' }, { label: 'Latest Year', value: books.length ? Math.max(...books.map(b => b.publishedYear)) : '—', icon: 'ti-calendar', color: '#633806', bg: '#FAEEDA' }].map(s => (
          <Card key={s.label} style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: 44, height: 44, background: s.bg, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <i className={`ti ${s.icon}`} style={{ fontSize: '22px', color: s.color }} />
            </div>
            <div>
              <p style={{ fontSize: '22px', fontWeight: 700, margin: 0 }}>{s.value}</p>
              <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', margin: 0 }}>{s.label}</p>
            </div>
          </Card>
        ))}
      </div>

      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <p style={{ fontWeight: 600, fontSize: '14px', margin: 0 }}>All books</p>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--color-background-secondary)', border: '0.5px solid var(--color-border-tertiary)', borderRadius: '8px', padding: '6px 12px' }}>
              <i className="ti ti-search" style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." style={{ border: 'none', background: 'none', outline: 'none', fontSize: '13px', color: 'var(--color-text-primary)', width: '160px' }} />
            </div>
            <button onClick={load} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'var(--color-background-primary)', border: '0.5px solid var(--color-border-secondary)', borderRadius: '8px', padding: '6px 12px', fontSize: '13px', cursor: 'pointer', color: 'var(--color-text-primary)' }}>
              <i className="ti ti-refresh" style={{ fontSize: '14px' }} /> Refresh
            </button>
            <button onClick={openAdd} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#185FA5', color: 'white', border: 'none', borderRadius: '8px', padding: '6px 14px', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}>
              <i className="ti ti-plus" style={{ fontSize: '14px' }} /> Add book
            </button>
          </div>
        </div>
        {!loaded && <p style={{ color: 'var(--color-text-secondary)', fontSize: '13px', textAlign: 'center', padding: '2rem 0' }}>Loading...</p>}
        {loaded && (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', tableLayout: 'fixed' }}>
            <colgroup><col style={{ width: '30%' }} /><col style={{ width: '20%' }} /><col style={{ width: '10%' }} /><col style={{ width: '25%' }} /><col style={{ width: '15%' }} /></colgroup>
            <thead><tr>{[['ti-book','Title'],['ti-user','Author'],['ti-calendar','Year'],['ti-barcode','ISBN'],['ti-settings','Actions']].map(([icon,label]) => <th key={label} style={thStyle}><i className={`ti ${icon}`} style={{ fontSize: '12px', marginRight: '4px' }} />{label}</th>)}</tr></thead>
            <tbody>
              {filtered.map(b => (
                <tr key={b.id} style={{ borderBottom: '0.5px solid var(--color-border-tertiary)' }}>
                  <td style={{ padding: '11px 14px', fontWeight: 500 }}>{b.title}</td>
                  <td style={{ padding: '11px 14px' }}><Badge color="blue">{b.author?.name}</Badge></td>
                  <td style={{ padding: '11px 14px', color: 'var(--color-text-secondary)' }}>{b.publishedYear}</td>
                  <td style={{ padding: '11px 14px', fontSize: '12px', color: 'var(--color-text-secondary)' }}>{b.isbn}</td>
                  <td style={{ padding: '11px 14px' }}>
                    <button onClick={() => openEdit(b)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', borderRadius: '6px', color: 'var(--color-text-secondary)' }}><i className="ti ti-edit" style={{ fontSize: '16px' }} /></button>
                    <button onClick={() => remove(b.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', borderRadius: '6px', color: '#A32D2D' }}><i className="ti ti-trash" style={{ fontSize: '16px' }} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {showModal && createPortal(
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#ffffff', border: '0.5px solid var(--color-border-tertiary)', borderRadius: '14px', padding: '1.5rem', width: '440px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <i className="ti ti-book-plus" style={{ fontSize: '18px', color: '#185FA5' }} />
                <p style={{ fontWeight: 600, margin: 0 }}>{editBook ? 'Edit book' : 'Add new book'}</p>
              </div>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)' }}><i className="ti ti-x" style={{ fontSize: '18px' }} /></button>
            </div>
            {[['Title', 'title', 'Book title'], ['ISBN', 'isbn', '978-...'], ['Published Year', 'publishedYear', '2024'], ['Author ID', 'authorId', '1']].map(([label, key, ph]) => (
              <div key={key}>
                <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--color-text-secondary)', display: 'block', marginBottom: '4px' }}>{label}</label>
                <input value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} placeholder={ph}
                  style={{ width: '100%', boxSizing: 'border-box', marginBottom: '12px', fontSize: '13px', padding: '8px 10px', borderRadius: '8px', border: '0.5px solid var(--color-border-secondary)', background: 'var(--color-background-primary)', color: 'var(--color-text-primary)', outline: 'none' }} />
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: '0.5px solid var(--color-border-secondary)', borderRadius: '8px', padding: '7px 16px', fontSize: '13px', cursor: 'pointer', color: 'var(--color-text-primary)' }}>Cancel</button>
              <button onClick={save} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#185FA5', color: 'white', border: 'none', borderRadius: '8px', padding: '7px 16px', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}>
                <i className="ti ti-check" style={{ fontSize: '13px' }} /> {editBook ? 'Save changes' : 'Add book'}
              </button>
            </div>
          </div>
        </div>,
        document.body   
      )}
    </div>
  )
}

// ─── Admin: Authors ───────────────────────────────────────────────────────────
function AuthorsPage({ token, showToast }) {
  const [authors, setAuthors] = useState([])
  const [loaded, setLoaded]   = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm]       = useState({ name: '', bio: '' })
  const headers = { Authorization: `Bearer ${token}` }

  const load = async () => { const res = await axios.get(`${REST_URL}/authors`); setAuthors(res.data); setLoaded(true) }
  useEffect(() => { load() }, [])

  const save = async () => {
    await axios.post(`${REST_URL}/authors`, form, { headers })
    setShowModal(false); setForm({ name: '', bio: '' }); load()
    showToast('Author added!')
  }

  const remove = async (id) => {
    if (!window.confirm('Delete this author?')) return
    await axios.delete(`${REST_URL}/authors/${id}`, { headers })
    load(); showToast('Author deleted!', 'error')
  }

  const thStyle = { background: 'var(--color-background-secondary)', color: 'var(--color-text-secondary)', fontWeight: 500, fontSize: '12px', padding: '9px 14px', textAlign: 'left', borderBottom: '0.5px solid var(--color-border-tertiary)' }

  return (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <p style={{ fontWeight: 600, fontSize: '14px', margin: 0 }}>{authors.length} authors</p>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={load} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'var(--color-background-primary)', border: '0.5px solid var(--color-border-secondary)', borderRadius: '8px', padding: '6px 12px', fontSize: '13px', cursor: 'pointer', color: 'var(--color-text-primary)' }}>
            <i className="ti ti-refresh" style={{ fontSize: '14px' }} /> Refresh
          </button>
          <button onClick={() => setShowModal(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#185FA5', color: 'white', border: 'none', borderRadius: '8px', padding: '6px 14px', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}>
            <i className="ti ti-plus" style={{ fontSize: '14px' }} /> Add author
          </button>
        </div>
      </div>
      {!loaded && <p style={{ color: 'var(--color-text-secondary)', fontSize: '13px', textAlign: 'center', padding: '2rem 0' }}>Loading...</p>}
      {loaded && (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', tableLayout: 'fixed' }}>
          <colgroup><col style={{ width: '25%' }} /><col style={{ width: '45%' }} /><col style={{ width: '15%' }} /><col style={{ width: '15%' }} /></colgroup>
          <thead><tr>{[['ti-user','Name'],['ti-info-circle','Bio'],['ti-book','Books'],['ti-settings','Actions']].map(([icon,label]) => <th key={label} style={thStyle}><i className={`ti ${icon}`} style={{ fontSize: '12px', marginRight: '4px' }} />{label}</th>)}</tr></thead>
          <tbody>
            {authors.map(a => (
              <tr key={a.id} style={{ borderBottom: '0.5px solid var(--color-border-tertiary)' }}>
                <td style={{ padding: '11px 14px', fontWeight: 500 }}>{a.name}</td>
                <td style={{ padding: '11px 14px', color: 'var(--color-text-secondary)', fontSize: '12px' }}>{a.bio}</td>
                <td style={{ padding: '11px 14px' }}><Badge color="green">{a.books?.length} books</Badge></td>
                <td style={{ padding: '11px 14px' }}>
                  <button onClick={() => remove(a.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', borderRadius: '6px', color: '#A32D2D' }}><i className="ti ti-trash" style={{ fontSize: '16px' }} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {showModal && createPortal(
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#ffffff', border: '0.5px solid var(--color-border-tertiary)', borderRadius: '14px', padding: '1.5rem', width: '380px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <i className="ti ti-user-plus" style={{ fontSize: '18px', color: '#185FA5' }} />
                <p style={{ fontWeight: 600, margin: 0 }}>Add new author</p>
              </div>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)' }}><i className="ti ti-x" style={{ fontSize: '18px' }} /></button>
            </div>
            {[['Name', 'name', 'Author name'], ['Bio', 'bio', 'Short biography']].map(([label, key, ph]) => (
              <div key={key}>
                <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--color-text-secondary)', display: 'block', marginBottom: '4px' }}>{label}</label>
                <input value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} placeholder={ph}
                  style={{ width: '100%', boxSizing: 'border-box', marginBottom: '12px', fontSize: '13px', padding: '8px 10px', borderRadius: '8px', border: '0.5px solid var(--color-border-secondary)', background: 'var(--color-background-primary)', color: 'var(--color-text-primary)', outline: 'none' }} />
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: '0.5px solid var(--color-border-secondary)', borderRadius: '8px', padding: '7px 16px', fontSize: '13px', cursor: 'pointer', color: 'var(--color-text-primary)' }}>Cancel</button>
              <button onClick={save} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#185FA5', color: 'white', border: 'none', borderRadius: '8px', padding: '7px 16px', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}>
                <i className="ti ti-check" style={{ fontSize: '13px' }} /> Add author
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </Card>
  )
}

// ─── Admin: Borrow records ────────────────────────────────────────────────────
function AdminBorrowPage({ token }) {
  const [records, setRecords] = useState([])
  const [loaded, setLoaded]   = useState(false)
  const headers = { Authorization: `Bearer ${token}` }

  const load = async () => { const res = await axios.get(`${REST_URL}/borrow`, { headers }); setRecords(res.data); setLoaded(true) }
  const returnBook = async (id) => { await axios.put(`${REST_URL}/borrow/${id}/return`, {}, { headers }); load() }
  const deleteRecord = async (id) => { if (!window.confirm("Delete this record?")) return; await axios.delete(`${REST_URL}/borrow/${id}`, { headers }); load() }
  useEffect(() => { load() }, [])

  const active = records.filter(r => !r.returnedAt)
  const done   = records.filter(r => r.returnedAt)
  const thStyle = { background: 'var(--color-background-secondary)', color: 'var(--color-text-secondary)', fontWeight: 500, fontSize: '12px', padding: '9px 14px', textAlign: 'left', borderBottom: '0.5px solid var(--color-border-tertiary)' }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1rem' }}>
        {[{ label: 'Total Records', value: records.length, icon: 'ti-clipboard-list', color: '#185FA5', bg: '#E6F1FB' }, { label: 'Active', value: active.length, icon: 'ti-book-2', color: '#633806', bg: '#FAEEDA' }, { label: 'Returned', value: done.length, icon: 'ti-circle-check', color: '#27500A', bg: '#EAF3DE' }].map(s => (
          <Card key={s.label} style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: 44, height: 44, background: s.bg, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <i className={`ti ${s.icon}`} style={{ fontSize: '22px', color: s.color }} />
            </div>
            <div>
              <p style={{ fontSize: '22px', fontWeight: 700, margin: 0 }}>{s.value}</p>
              <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', margin: 0 }}>{s.label}</p>
            </div>
          </Card>
        ))}
      </div>

      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <p style={{ fontWeight: 600, fontSize: '14px', margin: 0 }}>All borrow records</p>
          <button onClick={load} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'var(--color-background-primary)', border: '0.5px solid var(--color-border-secondary)', borderRadius: '8px', padding: '6px 12px', fontSize: '13px', cursor: 'pointer', color: 'var(--color-text-primary)' }}>
            <i className="ti ti-refresh" style={{ fontSize: '14px' }} /> Refresh
          </button>
        </div>
        {!loaded && <p style={{ color: 'var(--color-text-secondary)', fontSize: '13px', textAlign: 'center', padding: '2rem 0' }}>Loading...</p>}
        {loaded && (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', tableLayout: 'fixed' }}>
            <colgroup><col style={{ width: '27%' }} /><col style={{ width: '17%' }} /><col style={{ width: '15%' }} /><col style={{ width: '15%' }} /><col style={{ width: '12%' }} /><col style={{ width: '14%' }} /></colgroup>
            <thead><tr>{[['ti-book','Book'],['ti-user','User'],['ti-calendar','Borrowed'],['ti-calendar-check','Returned'],['ti-flag','Status'],['ti-settings','Action']].map(([icon,label]) => <th key={label} style={thStyle}><i className={`ti ${icon}`} style={{ fontSize: '12px', marginRight: '4px' }} />{label}</th>)}</tr></thead>
            <tbody>
              {records.map(r => (
                <tr key={r.id} style={{ borderBottom: '0.5px solid var(--color-border-tertiary)' }}>
                  <td style={{ padding: '11px 14px', fontWeight: 500 }}>{r.book?.title}</td>
                  <td style={{ padding: '11px 14px', color: 'var(--color-text-secondary)' }}>{r.user?.name}</td>
                  <td style={{ padding: '11px 14px', fontSize: '12px', color: 'var(--color-text-secondary)' }}>{new Date(r.borrowedAt).toLocaleDateString()}</td>
                  <td style={{ padding: '11px 14px', fontSize: '12px', color: 'var(--color-text-secondary)' }}>{r.returnedAt ? new Date(r.returnedAt).toLocaleDateString() : '—'}</td>
                  <td style={{ padding: '11px 14px' }}>
                    {r.returnedAt ? <Badge color="green">Done</Badge> : <Badge color="orange">Active</Badge>}
                  </td>
                  <td style={{ padding: '11px 14px' }}>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      {!r.returnedAt && (
                        <button onClick={() => returnBook(r.id)} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#EAF3DE', color: '#27500A', border: 'none', borderRadius: '6px', padding: '5px 10px', fontSize: '12px', cursor: 'pointer', fontWeight: 500 }}>
                          <i className="ti ti-check" style={{ fontSize: '13px' }} /> Return
                        </button>
                      )}
                      <button onClick={() => deleteRecord(r.id)} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#FCEBEB', color: '#791F1F', border: 'none', borderRadius: '6px', padding: '5px 10px', fontSize: '12px', cursor: 'pointer', fontWeight: 500 }}>
                        <i className="ti ti-trash" style={{ fontSize: '13px' }} /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  )
}

// ─── Compare (admin only) ─────────────────────────────────────────────────────
const QUERY_TESTS = [
  { id: 'q1', label: 'Query 1 — Title only',     gql: `query { books { title } }`,                                                    restEndpoint: '/books', extract: d => d.books, desc: 'Fetch only book titles' },
  { id: 'q2', label: 'Query 2 — Title + Author',  gql: `query { books { title author { name } } }`,                                   restEndpoint: '/books', extract: d => d.books, desc: 'Nested query: title + author name' },
  { id: 'q3', label: 'Query 3 — Full data',       gql: `query { books { id title isbn publishedYear author { name bio } } }`,         restEndpoint: '/books', extract: d => d.books, desc: 'All available fields' },
]

function DarkBox({ data }) {
  return (
    <pre style={{ background: '#1a1a2e', color: '#e2e8f0', border: '1.5px solid #2d2d4e', borderRadius: '8px', padding: '12px', fontSize: '11px', overflow: 'auto', maxHeight: '200px', margin: 0, fontFamily: 'monospace', lineHeight: 1.6 }}>
      {JSON.stringify(data, null, 2)}
    </pre>
  )
}

function ComparePage() {
  const [activeTest, setActiveTest] = useState('q1')
  const [results, setResults]       = useState({})
  const [loading, setLoading]       = useState(null)

  const test = QUERY_TESTS.find(t => t.id === activeTest)

  const runREST = async () => {
    setLoading('rest')
    try {
      const start = performance.now()
      const res = await axios.get(`${REST_URL}${test.restEndpoint}`)
      const time = (performance.now() - start).toFixed(2)
      setResults(p => ({ ...p, [activeTest]: { ...p[activeTest], rest: { data: res.data, size: JSON.stringify(res.data).length, time } } }))
    } catch {}
    setLoading(null)
  }

  const runGQL = async () => {
    setLoading('gql')
    try {
      const start = performance.now()
      const res = await axios.post(GRAPHQL_URL, { query: test.gql })
      const data = test.extract(res.data.data)
      const time = (performance.now() - start).toFixed(2)
      setResults(p => ({ ...p, [activeTest]: { ...p[activeTest], gql: { data, size: JSON.stringify(data).length, time } } }))
    } catch {}
    setLoading(null)
  }

  const r = results[activeTest] || {}

  return (
    <div>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        {QUERY_TESTS.map(t => (
          <button key={t.id} onClick={() => setActiveTest(t.id)} style={{ padding: '7px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 500, cursor: 'pointer', border: activeTest === t.id ? 'none' : '0.5px solid var(--color-border-secondary)', background: activeTest === t.id ? '#185FA5' : 'var(--color-background-primary)', color: activeTest === t.id ? 'white' : 'var(--color-text-primary)' }}>
            {t.label}
          </button>
        ))}
      </div>

      <Card style={{ marginBottom: '1rem', padding: '10px 14px' }}>
        <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>{test.desc} — </span>
        <code style={{ fontSize: '11px', background: 'var(--color-background-secondary)', padding: '2px 8px', borderRadius: '6px', color: '#993556' }}>{test.gql}</code>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
        {[
          { key: 'rest', label: 'REST API', desc: `GET ${test.restEndpoint}`, sub: 'Returns ALL fields — over-fetching', color: '#185FA5', icon: 'ti-api', run: runREST, btnLabel: 'Fetch via REST', sizeColor: '#A32D2D', timeColor: '#A32D2D' },
          { key: 'gql',  label: 'GraphQL',  desc: 'POST /graphql',           sub: 'Returns ONLY requested fields',    color: '#993556', icon: 'ti-binary-tree', run: runGQL, btnLabel: 'Fetch via GraphQL', sizeColor: '#0F6E56', timeColor: '#0F6E56' },
        ].map(c => (
          <Card key={c.key}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <i className={`ti ${c.icon}`} style={{ fontSize: '18px', color: c.color }} />
              <p style={{ fontWeight: 600, color: c.color, margin: 0 }}>{c.label}</p>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', margin: '0 0 2px' }}>{c.desc}</p>
            <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', margin: '0 0 1rem' }}>{c.sub}</p>
            <button onClick={c.run} disabled={loading === c.key} style={{ background: c.color, color: 'white', border: 'none', borderRadius: '8px', padding: '8px 16px', fontSize: '13px', fontWeight: 500, cursor: 'pointer', width: '100%', marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', opacity: loading === c.key ? 0.7 : 1 }}>
              <i className="ti ti-player-play" style={{ fontSize: '13px' }} />
              {loading === c.key ? 'Fetching...' : c.btnLabel}
            </button>
            {r[c.key] && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>Response size</span>
                  <span style={{ fontSize: '12px', color: c.sizeColor, fontWeight: 500 }}>{r[c.key].size} chars</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>Response time</span>
                  <span style={{ fontSize: '12px', color: c.timeColor, fontWeight: 500 }}>{r[c.key].time} ms</span>
                </div>
                <DarkBox data={r[c.key].data} />
              </div>
            )}
          </Card>
        ))}
      </div>

      {r.rest && r.gql && (
        <Card>
          <p style={{ fontWeight: 600, textAlign: 'center', margin: '0 0 1rem' }}>Payload size comparison — {test.label}</p>
          {[{ label: 'REST API', size: r.rest.size, color: '#185FA5' }, { label: 'GraphQL', size: r.gql.size, color: '#993556' }].map(b => (
            <div key={b.label} style={{ marginBottom: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontSize: '12px', color: b.color, fontWeight: 500 }}>{b.label}</span>
                <span style={{ fontSize: '12px', color: b.color }}>{b.size} chars</span>
              </div>
              <div style={{ background: 'var(--color-background-secondary)', borderRadius: '99px', height: '8px' }}>
                <div style={{ background: b.color, height: '8px', borderRadius: '99px', width: b.label === 'REST API' ? '100%' : `${(r.gql.size / r.rest.size) * 100}%`, transition: 'width 0.5s' }} />
              </div>
            </div>
          ))}
          <p style={{ textAlign: 'center', fontSize: '13px', color: 'var(--color-text-secondary)', margin: '12px 0 0' }}>
            GraphQL payload is <span style={{ fontWeight: 600, color: '#0F6E56' }}>{((1 - r.gql.size / r.rest.size) * 100).toFixed(1)}% smaller</span> than REST
          </p>
        </Card>
      )}
    </div>
  )
}

// ─── Admin: Reports ───────────────────────────────────────────────────────────
function ReportPage({ token }) {
  const [records, setRecords] = useState([])
  const [books, setBooks]     = useState([])
  const [loaded, setLoaded]   = useState(false)

  useEffect(() => {
    const headers = { Authorization: `Bearer ${token}` }
    Promise.all([
      axios.get(`${REST_URL}/borrow`, { headers }),
      axios.get(`${REST_URL}/books`),
    ]).then(([r1, r2]) => {
      setRecords(r1.data)
      setBooks(r2.data)
      setLoaded(true)
    })
  }, [])

  const active   = records.filter(r => !r.returnedAt)
  const returned = records.filter(r => r.returnedAt)

  // Most borrowed books
  const bookCount = {}
  records.forEach(r => {
    const title = r.book?.title || `Book #${r.bookId}`
    bookCount[title] = (bookCount[title] || 0) + 1
  })
  const topBooks = Object.entries(bookCount).sort((a, b) => b[1] - a[1]).slice(0, 5)

  // Most active users
  const userCount = {}
  records.forEach(r => {
    const name = r.user?.name || `User #${r.userId}`
    userCount[name] = (userCount[name] || 0) + 1
  })
  const topUsers = Object.entries(userCount).sort((a, b) => b[1] - a[1]).slice(0, 5)

  // Monthly borrow trend (last 6 months)
  const monthMap = {}
  records.forEach(r => {
    const d = new Date(r.borrowedAt)
    const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`
    monthMap[key] = (monthMap[key] || 0) + 1
  })
  const months = Object.entries(monthMap).sort((a,b) => a[0].localeCompare(b[0])).slice(-6)
  const maxMonth = Math.max(...months.map(m => m[1]), 1)

  const statCards = [
    { label: 'Total Borrows', value: records.length, icon: 'ti-clipboard-list', color: '#185FA5', bg: '#E6F1FB' },
    { label: 'Active Rentals', value: active.length, icon: 'ti-book-2', color: '#633806', bg: '#FAEEDA' },
    { label: 'Returned', value: returned.length, icon: 'ti-circle-check', color: '#27500A', bg: '#EAF3DE' },
    { label: 'Books Available', value: books.length, icon: 'ti-books', color: '#185FA5', bg: '#E6F1FB' },
  ]

  if (!loaded) return <Card><p style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-secondary)', fontSize: '13px' }}>Loading report...</p></Card>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '1rem' }}>
        {statCards.map(s => (
          <Card key={s.label} style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: 44, height: 44, background: s.bg, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <i className={`ti ${s.icon}`} style={{ fontSize: '22px', color: s.color }} />
            </div>
            <div>
              <p style={{ fontSize: '22px', fontWeight: 700, margin: 0 }}>{s.value}</p>
              <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', margin: 0 }}>{s.label}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Monthly trend */}
      <Card>
        <p style={{ fontWeight: 600, fontSize: '14px', margin: '0 0 1.25rem' }}>Monthly Borrow Trend</p>
        {months.length === 0
          ? <p style={{ textAlign: 'center', color: 'var(--color-text-secondary)', fontSize: '13px', padding: '1rem 0' }}>No data yet</p>
          : (
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '12px', height: '140px' }}>
              {months.map(([month, count]) => (
                <div key={month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: '#185FA5' }}>{count}</span>
                  <div style={{ width: '100%', background: '#185FA5', borderRadius: '6px 6px 0 0', height: `${(count / maxMonth) * 100}px`, minHeight: '4px', transition: 'height 0.4s' }} />
                  <span style={{ fontSize: '10px', color: 'var(--color-text-secondary)' }}>{month.slice(5)}/{month.slice(2,4)}</span>
                </div>
              ))}
            </div>
          )
        }
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
        {/* Top books */}
        <Card>
          <p style={{ fontWeight: 600, fontSize: '14px', margin: '0 0 1rem' }}>Most Borrowed Books</p>
          {topBooks.length === 0
            ? <p style={{ color: 'var(--color-text-secondary)', fontSize: '13px' }}>No data yet</p>
            : topBooks.map(([title, count], i) => (
              <div key={title} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <span style={{ width: 22, height: 22, background: i === 0 ? '#FAEEDA' : 'var(--color-background-secondary)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, color: i === 0 ? '#633806' : 'var(--color-text-secondary)', flexShrink: 0 }}>{i+1}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: '0 0 3px', fontSize: '13px', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</p>
                  <div style={{ background: 'var(--color-background-secondary)', borderRadius: '99px', height: '5px' }}>
                    <div style={{ background: '#185FA5', height: '5px', borderRadius: '99px', width: `${(count / (topBooks[0]?.[1] || 1)) * 100}%` }} />
                  </div>
                </div>
                <Badge color="blue">{count}x</Badge>
              </div>
            ))
          }
        </Card>

        {/* Top users */}
        <Card>
          <p style={{ fontWeight: 600, fontSize: '14px', margin: '0 0 1rem' }}>Most Active Members</p>
          {topUsers.length === 0
            ? <p style={{ color: 'var(--color-text-secondary)', fontSize: '13px' }}>No data yet</p>
            : topUsers.map(([name, count], i) => (
              <div key={name} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <div style={{ width: 32, height: 32, background: i === 0 ? '#E6F1FB' : 'var(--color-background-secondary)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <i className="ti ti-user" style={{ fontSize: '14px', color: i === 0 ? '#185FA5' : 'var(--color-text-secondary)' }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: '0 0 3px', fontSize: '13px', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</p>
                  <div style={{ background: 'var(--color-background-secondary)', borderRadius: '99px', height: '5px' }}>
                    <div style={{ background: '#0F6E56', height: '5px', borderRadius: '99px', width: `${(count / (topUsers[0]?.[1] || 1)) * 100}%` }} />
                  </div>
                </div>
                <Badge color="green">{count} borrows</Badge>
              </div>
            ))
          }
        </Card>
      </div>

      {/* Recent activity */}
      <Card>
        <p style={{ fontWeight: 600, fontSize: '14px', margin: '0 0 1rem' }}>Recent Activity</p>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr>
              {['Book', 'Member', 'Borrowed', 'Returned', 'Status'].map(h => (
                <th key={h} style={{ background: 'var(--color-background-secondary)', color: 'var(--color-text-secondary)', fontWeight: 500, fontSize: '12px', padding: '9px 14px', textAlign: 'left', borderBottom: '0.5px solid var(--color-border-tertiary)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {records.slice().reverse().slice(0, 10).map(r => (
              <tr key={r.id} style={{ borderBottom: '0.5px solid var(--color-border-tertiary)' }}>
                <td style={{ padding: '10px 14px', fontWeight: 500 }}>{r.book?.title || '—'}</td>
                <td style={{ padding: '10px 14px', color: 'var(--color-text-secondary)' }}>{r.user?.name || '—'}</td>
                <td style={{ padding: '10px 14px', fontSize: '12px', color: 'var(--color-text-secondary)' }}>{new Date(r.borrowedAt).toLocaleDateString()}</td>
                <td style={{ padding: '10px 14px', fontSize: '12px', color: 'var(--color-text-secondary)' }}>{r.returnedAt ? new Date(r.returnedAt).toLocaleDateString() : '—'}</td>
                <td style={{ padding: '10px 14px' }}>{r.returnedAt ? <Badge color="green">Returned</Badge> : <Badge color="orange">Active</Badge>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  )
}

// ─── User: Fees & Payment ─────────────────────────────────────────────────────
const DAILY_RATE = 2000   // 2,000 VND per day
const FREE_DAYS  = 7      // first 7 days free

function calcFee(borrowedAt, returnedAt) {
  const end   = returnedAt ? new Date(returnedAt) : new Date()
  const start = new Date(borrowedAt)
  const days  = Math.floor((end - start) / (1000 * 60 * 60 * 24))
  const lateDays = Math.max(0, days - FREE_DAYS)
  return { days, lateDays, fee: lateDays * DAILY_RATE }
}

function UserPaymentPage({ token, currentUser, onReturn }) {
  const [records, setRecords] = useState([])
  const [loaded, setLoaded]   = useState(false)
  const [paying, setPaying]   = useState(null)
  const [showReceipt, setShowReceipt] = useState(null)

  const load = async () => {
    const res = await axios.get(`${REST_URL}/borrow`, { headers: { Authorization: `Bearer ${token}` } })
    setRecords(res.data.filter(r => r.userId === currentUser.id))
    setLoaded(true)
  }
  useEffect(() => { load() }, [])

  const handleReturn = async (r) => {
    const { fee } = calcFee(r.borrowedAt)
    setPaying(r.id)
    await axios.put(`${REST_URL}/borrow/${r.id}/return`, {}, { headers: { Authorization: `Bearer ${token}` } })
    setShowReceipt({ ...r, fee, returnedAt: new Date().toISOString() })
    onReturn()
    load()
    setPaying(null)
  }

  const active   = records.filter(r => !r.returnedAt)
  const returned = records.filter(r => r.returnedAt)
  const totalOwed = active.reduce((sum, r) => sum + calcFee(r.borrowedAt).fee, 0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Receipt modal */}
      {showReceipt && createPortal(
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#ffffff', borderRadius: '16px', padding: '2rem', width: '360px', boxShadow: '0 24px 64px rgba(0,0,0,0.2)', textAlign: 'center' }}>
            <div style={{ width: 56, height: 56, background: '#EAF3DE', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
              <i className="ti ti-circle-check" style={{ fontSize: '28px', color: '#27500A' }} />
            </div>
            <p style={{ fontWeight: 700, fontSize: '16px', margin: '0 0 4px' }}>Return Receipt</p>
            <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', margin: '0 0 1.5rem' }}>{new Date().toLocaleDateString('vi-VN', { dateStyle: 'long' })}</p>
            <div style={{ background: '#F8F9FA', borderRadius: '10px', padding: '1rem', textAlign: 'left', marginBottom: '1.25rem' }}>
              {[
                ['Book', showReceipt.book?.title || '—'],
                ['Borrowed', new Date(showReceipt.borrowedAt).toLocaleDateString()],
                ['Returned', new Date(showReceipt.returnedAt).toLocaleDateString()],
                ['Days kept', `${calcFee(showReceipt.borrowedAt, showReceipt.returnedAt).days} days`],
                ['Free period', `${FREE_DAYS} days`],
                ['Late days', `${calcFee(showReceipt.borrowedAt, showReceipt.returnedAt).lateDays} days`],
              ].map(([label, value]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '13px' }}>
                  <span style={{ color: 'var(--color-text-secondary)' }}>{label}</span>
                  <span style={{ fontWeight: 500 }}>{value}</span>
                </div>
              ))}
              <div style={{ borderTop: '1px dashed var(--color-border-secondary)', marginTop: '8px', paddingTop: '8px', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 700 }}>Total Fee</span>
                <span style={{ fontWeight: 700, color: showReceipt.fee > 0 ? '#A32D2D' : '#27500A', fontSize: '15px' }}>
                  {showReceipt.fee > 0 ? `${showReceipt.fee.toLocaleString('vi-VN')} VND` : 'Free ✓'}
                </span>
              </div>
            </div>
            <button onClick={() => setShowReceipt(null)} style={{ width: '100%', background: '#185FA5', color: 'white', border: 'none', borderRadius: '8px', padding: '10px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
              Done
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1rem' }}>
        {[
          { label: 'Active Rentals', value: active.length, icon: 'ti-book-2', color: '#633806', bg: '#FAEEDA' },
          { label: 'Total Outstanding', value: totalOwed > 0 ? `${totalOwed.toLocaleString('vi-VN')} đ` : 'Free', icon: 'ti-receipt', color: totalOwed > 0 ? '#A32D2D' : '#27500A', bg: totalOwed > 0 ? '#FCEBEB' : '#EAF3DE' },
          { label: 'Free Period', value: `${FREE_DAYS} days`, icon: 'ti-calendar-check', color: '#185FA5', bg: '#E6F1FB' },
        ].map(s => (
          <Card key={s.label} style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: 44, height: 44, background: s.bg, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <i className={`ti ${s.icon}`} style={{ fontSize: '22px', color: s.color }} />
            </div>
            <div>
              <p style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: s.color }}>{s.value}</p>
              <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', margin: 0 }}>{s.label}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Fee info */}
      <Card style={{ background: '#E6F1FB', border: '0.5px solid #b3d1f0' }}>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
          <i className="ti ti-info-circle" style={{ fontSize: '18px', color: '#185FA5', flexShrink: 0, marginTop: '1px' }} />
          <div style={{ fontSize: '13px', color: '#0C447C' }}>
            <strong>Fee policy:</strong> First {FREE_DAYS} days are free. After that, a late fee of <strong>{DAILY_RATE.toLocaleString('vi-VN')} VND/day</strong> applies. Fees are calculated automatically when you return the book.
          </div>
        </div>
      </Card>

      {/* Active rentals with fees */}
      <Card>
        <p style={{ fontWeight: 600, fontSize: '14px', margin: '0 0 1rem' }}>Active Rentals & Fees</p>
        {active.length === 0
          ? <p style={{ color: 'var(--color-text-secondary)', fontSize: '13px', textAlign: 'center', padding: '1.5rem 0' }}>No active rentals</p>
          : active.map(r => {
            const { days, lateDays, fee } = calcFee(r.borrowedAt)
            const isLate = lateDays > 0
            return (
              <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: '0.5px solid var(--color-border-tertiary)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: 40, height: 40, background: isLate ? '#FCEBEB' : '#E6F1FB', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <i className="ti ti-book" style={{ fontSize: '18px', color: isLate ? '#A32D2D' : '#185FA5' }} />
                  </div>
                  <div>
                    <p style={{ fontWeight: 500, margin: '0 0 3px', fontSize: '13px' }}>{r.book?.title}</p>
                    <p style={{ fontSize: '11px', color: 'var(--color-text-secondary)', margin: '0 0 2px' }}>Borrowed {new Date(r.borrowedAt).toLocaleDateString()} · {days} days ago</p>
                    {isLate
                      ? <Badge color="red">Late {lateDays} days — {fee.toLocaleString('vi-VN')} VND</Badge>
                      : <Badge color="green">{FREE_DAYS - days} days remaining (free)</Badge>
                    }
                  </div>
                </div>
                <button
                  onClick={() => handleReturn(r)}
                  disabled={paying === r.id}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: isLate ? '#A32D2D' : '#185FA5', color: 'white', border: 'none', borderRadius: '8px', padding: '8px 14px', fontSize: '12px', fontWeight: 500, cursor: 'pointer', opacity: paying === r.id ? 0.7 : 1, flexShrink: 0 }}>
                  <i className="ti ti-check" style={{ fontSize: '13px' }} />
                  {paying === r.id ? 'Processing...' : isLate ? `Return & Pay ${fee.toLocaleString('vi-VN')} đ` : 'Return (Free)'}
                </button>
              </div>
            )
          })
        }
      </Card>

      {/* Return history with fees */}
      {returned.length > 0 && (
        <Card>
          <p style={{ fontWeight: 600, fontSize: '14px', margin: '0 0 1rem' }}>Payment History</p>
          {returned.map(r => {
            const { lateDays, fee } = calcFee(r.borrowedAt, r.returnedAt)
            return (
              <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '0.5px solid var(--color-border-tertiary)' }}>
                <div>
                  <p style={{ fontWeight: 500, margin: '0 0 2px', fontSize: '13px' }}>{r.book?.title}</p>
                  <p style={{ fontSize: '11px', color: 'var(--color-text-secondary)', margin: 0 }}>
                    {new Date(r.borrowedAt).toLocaleDateString()} → {new Date(r.returnedAt).toLocaleDateString()}
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ margin: '0 0 3px', fontSize: '13px', fontWeight: 600, color: fee > 0 ? '#A32D2D' : '#27500A' }}>
                    {fee > 0 ? `${fee.toLocaleString('vi-VN')} VND` : 'Free'}
                  </p>
                  {fee > 0 && <Badge color="red">Late {lateDays}d</Badge>}
                  {fee === 0 && <Badge color="green">On time</Badge>}
                </div>
              </div>
            )
          })}
        </Card>
      )}
    </div>
  )
}

// ─── Admin: Users Management ──────────────────────────────────────────────────
function AdminUsersPage({ token, showToast }) {
  const [users, setUsers]   = useState([])
  const [loaded, setLoaded] = useState(false)
  const headers = { Authorization: `Bearer ${token}` }

  const load = async () => {
    const res = await axios.get(`${REST_URL}/users`, { headers })
    setUsers(res.data)
    setLoaded(true)
  }
  useEffect(() => { load() }, [])

  const deleteUser = async (id, name) => {
    if (!window.confirm(`Delete user "${name}"? This cannot be undone.`)) return
    try {
      await axios.delete(`${REST_URL}/users/${id}`, { headers })
      showToast('User deleted!', 'error')
      load()
    } catch {
      showToast('Cannot delete user with active borrow records', 'error')
    }
  }

  const thStyle = { background: 'var(--color-background-secondary)', color: 'var(--color-text-secondary)', fontWeight: 500, fontSize: '12px', padding: '9px 14px', textAlign: 'left', borderBottom: '0.5px solid var(--color-border-tertiary)' }

  const admins  = users.filter(u => u.role === 'admin')
  const members = users.filter(u => u.role === 'user')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1rem' }}>
        {[
          { label: 'Total Users', value: users.length, icon: 'ti-users', color: '#185FA5', bg: '#E6F1FB' },
          { label: 'Members', value: members.length, icon: 'ti-user', color: '#0F6E56', bg: '#EAF3DE' },
          { label: 'Admins', value: admins.length, icon: 'ti-shield', color: '#633806', bg: '#FAEEDA' },
        ].map(s => (
          <Card key={s.label} style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: 44, height: 44, background: s.bg, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <i className={`ti ${s.icon}`} style={{ fontSize: '22px', color: s.color }} />
            </div>
            <div>
              <p style={{ fontSize: '22px', fontWeight: 700, margin: 0 }}>{s.value}</p>
              <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', margin: 0 }}>{s.label}</p>
            </div>
          </Card>
        ))}
      </div>

      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <p style={{ fontWeight: 600, fontSize: '14px', margin: 0 }}>All users</p>
          <button onClick={load} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'var(--color-background-primary)', border: '0.5px solid var(--color-border-secondary)', borderRadius: '8px', padding: '6px 12px', fontSize: '13px', cursor: 'pointer', color: 'var(--color-text-primary)' }}>
            <i className="ti ti-refresh" style={{ fontSize: '14px' }} /> Refresh
          </button>
        </div>
        {!loaded && <p style={{ color: 'var(--color-text-secondary)', fontSize: '13px', textAlign: 'center', padding: '2rem 0' }}>Loading...</p>}
        {loaded && (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr>
                {[['ti-hash','ID'],['ti-user','Name'],['ti-mail','Email'],['ti-shield','Role'],['ti-settings','Action']].map(([icon, label]) => (
                  <th key={label} style={thStyle}><i className={`ti ${icon}`} style={{ fontSize: '12px', marginRight: '4px' }} />{label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} style={{ borderBottom: '0.5px solid var(--color-border-tertiary)' }}>
                  <td style={{ padding: '11px 14px', color: 'var(--color-text-secondary)', fontSize: '12px' }}>#{u.id}</td>
                  <td style={{ padding: '11px 14px', fontWeight: 500 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: 28, height: 28, background: u.role === 'admin' ? '#FAEEDA' : '#E6F1FB', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <i className="ti ti-user" style={{ fontSize: '13px', color: u.role === 'admin' ? '#633806' : '#185FA5' }} />
                      </div>
                      {u.name}
                    </div>
                  </td>
                  <td style={{ padding: '11px 14px', color: 'var(--color-text-secondary)' }}>{u.email}</td>
                  <td style={{ padding: '11px 14px' }}>
                    <Badge color={u.role === 'admin' ? 'orange' : 'blue'}>{u.role}</Badge>
                  </td>
                  <td style={{ padding: '11px 14px' }}>
                    {u.role !== 'admin' && (
                      <button onClick={() => deleteUser(u.id, u.name)} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#FCEBEB', color: '#791F1F', border: 'none', borderRadius: '6px', padding: '5px 10px', fontSize: '12px', cursor: 'pointer', fontWeight: 500 }}>
                        <i className="ti ti-trash" style={{ fontSize: '13px' }} /> Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  )
}

