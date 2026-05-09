import { useState, useEffect } from 'react'
import axios from 'axios'

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000'
const REST_URL = `${API}/api/v1`
const GRAPHQL_URL = `${API}/graphql`

function getToken() { return localStorage.getItem('token') }
function getUser()  { try { return JSON.parse(localStorage.getItem('user')) } catch { return null } }
function authHeader() { return getToken() ? { Authorization: `Bearer ${getToken()}` } : {} }

export default function App() {
  const [user, setUser] = useState(getUser)
  const [page, setPage] = useState('books')
  const [activeRents, setActiveRents] = useState([])
  const [showRentPanel, setShowRentPanel] = useState(false)
  const [toast, setToast] = useState(null)

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const login = (token, userData) => {
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(userData))
    setUser(userData)
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
    setActiveRents([])
  }

  const loadActiveRents = async () => {
    if (!user) return
    try {
      const res = await axios.get(`${REST_URL}/borrow`)
      const active = res.data.filter(r =>
        !r.returnedAt && (user.role === 'admin' || r.userId === user.id)
      )
      setActiveRents(active)
    } catch (e) {}
  }

  useEffect(() => { if (user) loadActiveRents() }, [user])

  const handleReturn = async (recordId) => {
    try {
      await axios.put(`${REST_URL}/borrow/${recordId}/return`, {}, { headers: authHeader() })
      showToast('✅ Book returned successfully!')
      setShowRentPanel(false)
      loadActiveRents()
    } catch (e) {
      showToast('❌ Failed to return book', 'error')
    }
  }

  if (!user) return <LoginPage onLogin={login} />

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-xl shadow-lg text-white text-sm font-medium ${
          toast.type === 'error' ? 'bg-red-500' : 'bg-green-500'
        }`}>
          {toast.msg}
        </div>
      )}

      {/* Active Rent Dropdown */}
      {showRentPanel && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setShowRentPanel(false)} />
          <div className="fixed top-14 right-4 z-40 bg-white rounded-xl shadow-2xl w-80 p-4 border border-gray-100">
            <h3 className="font-bold text-sm mb-3 text-gray-700">📖 Currently Borrowing</h3>
            {activeRents.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-4">No active rentals</p>
            ) : (
              activeRents.map(r => (
                <div key={r.id} className="flex items-center justify-between border-b last:border-0 py-3">
                  <div>
                    <p className="font-medium text-sm">{r.book?.title}</p>
                    <p className="text-xs text-gray-400">Since {new Date(r.borrowedAt).toLocaleDateString()}</p>
                  </div>
                  <button
                    onClick={() => handleReturn(r.id)}
                    className="text-xs bg-orange-500 hover:bg-orange-600 text-white px-3 py-1.5 rounded-lg"
                  >
                    Return
                  </button>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {/* Navbar */}
      <nav className="bg-white shadow-sm sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
          <span className="font-bold text-lg mr-4">📚 Library</span>
          {['books', 'authors', 'compare'].map(p => (
            <button key={p} onClick={() => setPage(p)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium ${
                page === p ? 'bg-blue-500 text-white' : 'text-gray-500 hover:bg-gray-100'
              }`}>
              {p === 'books' ? '📖 Books' : p === 'authors' ? '✍️ Authors' : '⚡ Compare'}
            </button>
          ))}
          {user.role === 'admin' && (
            <button onClick={() => setPage('admin')}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium ${
                page === 'admin' ? 'bg-red-500 text-white' : 'text-gray-500 hover:bg-gray-100'
              }`}>
              🔧 Admin
            </button>
          )}

          <div className="ml-auto flex items-center gap-3">
            {/* Active Rent Badge */}
            <button
              onClick={() => setShowRentPanel(!showRentPanel)}
              className="relative flex items-center gap-2 bg-orange-50 hover:bg-orange-100 border border-orange-200 px-3 py-1.5 rounded-lg text-sm"
            >
              <span>📋 My Rentals</span>
              {activeRents.length > 0 && (
                <span className="bg-orange-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                  {activeRents.length}
                </span>
              )}
            </button>
            <span className="text-sm text-gray-500">
              {user.name}
              <span className={`ml-2 px-2 py-0.5 rounded text-xs font-bold ${
                user.role === 'admin' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
              }`}>{user.role}</span>
            </span>
            <button onClick={logout} className="text-xs text-gray-400 hover:text-red-500">Logout</button>
          </div>
        </div>
      </nav>

      {/* Pages */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {page === 'books'   && <BooksPage user={user} onBorrow={loadActiveRents} showToast={showToast} />}
        {page === 'authors' && <AuthorsPage user={user} showToast={showToast} />}
        {page === 'compare' && <ComparePage />}
        {page === 'admin'   && user.role === 'admin' && <AdminPage showToast={showToast} />}
      </div>
    </div>
  )
}

// ─── Login ────────────────────────────────────────────────────────────────────
function LoginPage({ onLogin }) {
  const [tab, setTab]     = useState('login')
  const [form, setForm]   = useState({ name: '', email: '', password: '', role: 'user' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handle = async () => {
    setError(''); setLoading(true)
    try {
      if (tab === 'login') {
        const res = await axios.post(`${REST_URL}/auth/login`, { email: form.email, password: form.password })
        onLogin(res.data.token, res.data.user)
      } else {
        await axios.post(`${REST_URL}/auth/register`, form)
        setTab('login')
        setError('✅ Account created! Please log in.')
      }
    } catch (e) {
      setError(e.response?.data?.error || 'Something went wrong')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
        <div className="text-center mb-6">
          <div className="text-5xl mb-3">📚</div>
          <h1 className="text-2xl font-bold">Library System</h1>
          <p className="text-gray-400 text-sm mt-1">RESTful vs GraphQL Demo</p>
        </div>

        <div className="flex border rounded-lg overflow-hidden mb-5">
          {['login', 'register'].map(t => (
            <button key={t} onClick={() => { setTab(t); setError('') }}
              className={`flex-1 py-2 text-sm font-medium capitalize ${tab === t ? 'bg-blue-500 text-white' : 'text-gray-500 hover:bg-gray-50'}`}>
              {t}
            </button>
          ))}
        </div>

        {error && (
          <div className={`mb-4 p-3 rounded-lg text-sm ${error.startsWith('✅') ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
            {error}
          </div>
        )}

        <div className="space-y-3">
          {tab === 'register' && (
            <input className="w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
              placeholder="Full name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
          )}
          <input className="w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
            placeholder="Email" type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
          <input className="w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
            placeholder="Password" type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} />
          {tab === 'register' && (
            <select className="w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
              value={form.role} onChange={e => setForm({...form, role: e.target.value})}>
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          )}
        </div>

        <button onClick={handle} disabled={loading}
          className="w-full mt-5 bg-blue-500 hover:bg-blue-600 text-white py-2.5 rounded-lg font-medium text-sm disabled:opacity-60">
          {loading ? 'Please wait...' : tab === 'login' ? 'Login' : 'Create Account'}
        </button>

        {tab === 'login' && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg text-xs text-gray-500">
            <p className="font-semibold mb-1">Test credentials:</p>
            <p>Admin: admin@library.com / Admin@123</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Books Page ───────────────────────────────────────────────────────────────
function BooksPage({ user, onBorrow, showToast }) {
  const [books, setBooks]           = useState([])
  const [selected, setSelected]     = useState(null)
  const [borrowing, setBorrowing]   = useState(false)
  const [successBook, setSuccessBook] = useState(null)

  useEffect(() => { loadBooks() }, [])

  const loadBooks = async () => {
    const res = await axios.get(`${REST_URL}/books`)
    setBooks(res.data)
  }

  const handleBorrow = async (book) => {
    setBorrowing(true)
    try {
      await axios.post(`${REST_URL}/borrow`,
        { userId: user.id, bookId: book.id },
        { headers: authHeader() }
      )
      setSuccessBook(book)
      setSelected(null)
      onBorrow()
      setTimeout(() => setSuccessBook(null), 3000)
    } catch (e) {
      showToast(e.response?.data?.error || 'Failed to borrow', 'error')
    } finally { setBorrowing(false) }
  }

  return (
    <div className="flex gap-6">
      {/* Book List */}
      <div className="flex-1">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-2xl font-bold">📖 Books</h2>
            <p className="text-xs text-gray-400 mt-0.5">Click a book to view details & borrow</p>
          </div>
          <span className="text-sm text-gray-400">{books.length} books available</span>
        </div>

        {/* Success banner */}
        {successBook && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3">
            <span className="text-2xl">✅</span>
            <div>
              <p className="font-semibold text-green-700">Borrowed successfully!</p>
              <p className="text-sm text-green-600">"{successBook.title}" has been added to your rentals.</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-3">
          {books.map(book => (
            <div
              key={book.id}
              onClick={() => setSelected(selected?.id === book.id ? null : book)}
              className={`bg-white rounded-xl shadow-sm border-2 p-4 cursor-pointer transition-all hover:shadow-md ${
                selected?.id === book.id ? 'border-blue-400 shadow-md' : 'border-transparent'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">{book.title}</p>
                  <p className="text-sm text-gray-400">by {book.author?.name} · {book.publishedYear}</p>
                </div>
                <span className="text-gray-300 text-lg">{selected?.id === book.id ? '▲' : '▼'}</span>
              </div>
            </div>
          ))}
          {books.length === 0 && (
            <p className="text-gray-400 text-center py-8">No books available</p>
          )}
        </div>
      </div>

      {/* Book Detail Panel */}
      {selected && (
        <div className="w-72 flex-shrink-0">
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 sticky top-24">
            <div className="w-full h-36 bg-gradient-to-br from-blue-100 to-indigo-200 rounded-lg flex items-center justify-center mb-4">
              <span className="text-5xl">📘</span>
            </div>

            <h3 className="font-bold text-lg leading-snug mb-1">{selected.title}</h3>
            <p className="text-sm text-gray-500 mb-4">by {selected.author?.name}</p>

            <div className="space-y-2 mb-5">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">ISBN</span>
                <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">{selected.isbn}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Published</span>
                <span>{selected.publishedYear}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Author bio</span>
                <span className="text-right text-xs text-gray-500 max-w-36">{selected.author?.bio || 'N/A'}</span>
              </div>
            </div>

            <button
              onClick={() => handleBorrow(selected)}
              disabled={borrowing}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2.5 rounded-lg font-medium text-sm disabled:opacity-60 transition-colors"
            >
              {borrowing ? 'Processing...' : '📖 Borrow This Book'}
            </button>

            <button
              onClick={() => setSelected(null)}
              className="w-full mt-2 text-gray-400 hover:text-gray-600 text-sm py-1"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Authors Page ─────────────────────────────────────────────────────────────
function AuthorsPage({ user, showToast }) {
  const [authors, setAuthors] = useState([])
  const [form, setForm] = useState({ name: '', bio: '' })

  useEffect(() => { load() }, [])

  const load = async () => {
    const res = await axios.get(`${REST_URL}/authors`)
    setAuthors(res.data)
  }

  const create = async () => {
    try {
      await axios.post(`${REST_URL}/authors`, form, { headers: authHeader() })
      setForm({ name: '', bio: '' })
      showToast('Author added!')
      load()
    } catch (e) { showToast('Failed', 'error') }
  }

  const remove = async (id) => {
    if (!window.confirm('Delete this author?')) return
    try {
      await axios.delete(`${REST_URL}/authors/${id}`, { headers: authHeader() })
      showToast('Author deleted!')
      load()
    } catch (e) { showToast('Cannot delete', 'error') }
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-5">✍️ Authors</h2>

      {user.role === 'admin' && (
        <div className="bg-white rounded-xl shadow-sm p-5 mb-5">
          <h3 className="font-bold text-sm mb-3">➕ Add Author <span className="text-red-400">(Admin only)</span></h3>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <input className="border rounded-lg px-3 py-2 text-sm" placeholder="Name"
              value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
            <input className="border rounded-lg px-3 py-2 text-sm" placeholder="Bio"
              value={form.bio} onChange={e => setForm({...form, bio: e.target.value})} />
          </div>
          <button onClick={create} className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-600">Add Author</button>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm p-5">
        {authors.map(a => (
          <div key={a.id} className="flex justify-between items-center border-b last:border-0 py-3">
            <div>
              <p className="font-medium">{a.name}</p>
              <p className="text-xs text-gray-400">{a.bio} · {a.books?.length} books</p>
            </div>
            {user.role === 'admin' && (
              <button onClick={() => remove(a.id)} className="text-xs text-red-400 hover:text-red-600 border border-red-200 px-2 py-1 rounded">Delete</button>
            )}
          </div>
        ))}
        {authors.length === 0 && <p className="text-gray-400 text-sm text-center py-4">No authors yet</p>}
      </div>
    </div>
  )
}

// ─── Admin Page ───────────────────────────────────────────────────────────────
function AdminPage({ showToast }) {
  const [books, setBooks]     = useState([])
  const [records, setRecords] = useState([])
  const [form, setForm]       = useState({ title: '', isbn: '', publishedYear: '', authorId: '' })
  const [tab, setTab]         = useState('books')

  useEffect(() => { loadBooks(); loadRecords() }, [])

  const loadBooks = async () => {
    const res = await axios.get(`${REST_URL}/books`)
    setBooks(res.data)
  }

  const loadRecords = async () => {
    const res = await axios.get(`${REST_URL}/borrow`)
    setRecords(res.data)
  }

  const addBook = async () => {
    try {
      await axios.post(`${REST_URL}/books`,
        { ...form, publishedYear: parseInt(form.publishedYear), authorId: parseInt(form.authorId) },
        { headers: authHeader() }
      )
      setForm({ title: '', isbn: '', publishedYear: '', authorId: '' })
      showToast('Book added!')
      loadBooks()
    } catch (e) { showToast(e.response?.data?.error || 'Failed', 'error') }
  }

  const deleteBook = async (id) => {
    if (!window.confirm('Delete this book?')) return
    try {
      await axios.delete(`${REST_URL}/books/${id}`, { headers: authHeader() })
      showToast('Book deleted!')
      loadBooks()
    } catch (e) { showToast('Cannot delete', 'error') }
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-5">🔧 Admin Panel</h2>

      <div className="flex gap-2 mb-5">
        {['books', 'records'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium ${tab === t ? 'bg-red-500 text-white' : 'text-gray-500 hover:bg-gray-100'}`}>
            {t === 'books' ? '📖 Manage Books' : '📋 All Borrow Records'}
          </button>
        ))}
      </div>

      {tab === 'books' && (
        <>
          <div className="bg-white rounded-xl shadow-sm p-5 mb-5">
            <h3 className="font-bold text-sm mb-3">➕ Add New Book</h3>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <input className="border rounded-lg px-3 py-2 text-sm" placeholder="Title"
                value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
              <input className="border rounded-lg px-3 py-2 text-sm" placeholder="ISBN"
                value={form.isbn} onChange={e => setForm({...form, isbn: e.target.value})} />
              <input className="border rounded-lg px-3 py-2 text-sm" placeholder="Published Year"
                value={form.publishedYear} onChange={e => setForm({...form, publishedYear: e.target.value})} />
              <input className="border rounded-lg px-3 py-2 text-sm" placeholder="Author ID"
                value={form.authorId} onChange={e => setForm({...form, authorId: e.target.value})} />
            </div>
            <button onClick={addBook} className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-600">Add Book</button>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-5">
            {books.map(b => (
              <div key={b.id} className="flex justify-between items-center border-b last:border-0 py-3">
                <div>
                  <p className="font-medium">{b.title}</p>
                  <p className="text-xs text-gray-400">ISBN: {b.isbn} · {b.publishedYear} · {b.author?.name}</p>
                </div>
                <button onClick={() => deleteBook(b.id)} className="text-xs text-red-400 hover:text-red-600 border border-red-200 px-2 py-1 rounded">Delete</button>
              </div>
            ))}
            {books.length === 0 && <p className="text-gray-400 text-center text-sm py-4">No books yet</p>}
          </div>
        </>
      )}

      {tab === 'records' && (
        <div className="bg-white rounded-xl shadow-sm p-5">
          {records.map(r => (
            <div key={r.id} className="flex justify-between items-center border-b last:border-0 py-3">
              <div>
                <p className="font-medium">{r.book?.title}</p>
                <p className="text-xs text-gray-400">User: {r.user?.name} · {new Date(r.borrowedAt).toLocaleDateString()}</p>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${r.returnedAt ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
                {r.returnedAt ? 'Returned' : 'Active'}
              </span>
            </div>
          ))}
          {records.length === 0 && <p className="text-gray-400 text-center text-sm py-4">No records</p>}
        </div>
      )}
    </div>
  )
}

// ─── Compare Page ─────────────────────────────────────────────────────────────
function ComparePage() {
  const [restData, setRestData]       = useState(null)
  const [graphqlData, setGraphqlData] = useState(null)
  const [restSize, setRestSize]       = useState(null)
  const [graphqlSize, setGraphqlSize] = useState(null)
  const [restTime, setRestTime]       = useState(null)
  const [graphqlTime, setGraphqlTime] = useState(null)

  const fetchREST = async () => {
    const start = performance.now()
    const res = await axios.get(`${REST_URL}/books`)
    const end = performance.now()
    setRestData(res.data); setRestTime((end-start).toFixed(2)); setRestSize(JSON.stringify(res.data).length)
  }

  const fetchGraphQL = async () => {
    const start = performance.now()
    const res = await axios.post(GRAPHQL_URL, { query: `query { books { title } }` })
    const end = performance.now()
    setGraphqlData(res.data.data.books); setGraphqlTime((end-start).toFixed(2))
    setGraphqlSize(JSON.stringify(res.data.data.books).length)
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-center mb-1">⚡ RESTful vs GraphQL</h2>
      <p className="text-center text-gray-400 text-sm mb-6">Same data, two different approaches</p>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-white rounded-xl shadow-sm p-5">
          <h3 className="text-lg font-bold text-blue-600 mb-1">REST API</h3>
          <p className="text-xs text-gray-400 mb-1">GET /api/v1/books</p>
          <p className="text-xs text-gray-400 mb-3">Returns ALL fields (over-fetching)</p>
          <button onClick={fetchREST} className="bg-blue-500 text-white px-4 py-2 rounded-lg w-full mb-3 hover:bg-blue-600 text-sm">Fetch via REST</button>
          {restData && (
            <>
              <div className="flex justify-between text-xs mb-1"><span>Size</span><span className="text-red-500 font-bold">{restSize} chars</span></div>
              <div className="flex justify-between text-xs mb-3"><span>Time</span><span className="text-red-500 font-bold">{restTime} ms</span></div>
              <pre className="bg-gray-50 p-2 rounded text-xs overflow-auto max-h-40">{JSON.stringify(restData, null, 2)}</pre>
            </>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm p-5">
          <h3 className="text-lg font-bold text-pink-600 mb-1">GraphQL</h3>
          <p className="text-xs text-gray-400 mb-1">POST /graphql — {'{ books { title } }'}</p>
          <p className="text-xs text-gray-400 mb-3">Returns ONLY requested fields</p>
          <button onClick={fetchGraphQL} className="bg-pink-500 text-white px-4 py-2 rounded-lg w-full mb-3 hover:bg-pink-600 text-sm">Fetch via GraphQL</button>
          {graphqlData && (
            <>
              <div className="flex justify-between text-xs mb-1"><span>Size</span><span className="text-green-500 font-bold">{graphqlSize} chars</span></div>
              <div className="flex justify-between text-xs mb-3"><span>Time</span><span className="text-green-500 font-bold">{graphqlTime} ms</span></div>
              <pre className="bg-gray-50 p-2 rounded text-xs overflow-auto max-h-40">{JSON.stringify(graphqlData, null, 2)}</pre>
            </>
          )}
        </div>
      </div>

      {restSize && graphqlSize && (
        <div className="bg-white rounded-xl shadow-sm p-5">
          <h3 className="font-bold text-center mb-4">Payload Size Comparison</h3>
          <div className="mb-3">
            <div className="flex justify-between text-xs mb-1"><span className="text-blue-600">REST</span><span className="text-blue-600">{restSize} chars</span></div>
            <div className="w-full bg-gray-100 rounded-full h-4"><div className="bg-blue-400 h-4 rounded-full" style={{ width: '100%' }}></div></div>
          </div>
          <div className="mb-2">
            <div className="flex justify-between text-xs mb-1"><span className="text-pink-600">GraphQL</span><span className="text-pink-600">{graphqlSize} chars</span></div>
            <div className="w-full bg-gray-100 rounded-full h-4"><div className="bg-pink-400 h-4 rounded-full" style={{ width: `${(graphqlSize/restSize)*100}%` }}></div></div>
          </div>
          <p className="text-center text-sm mt-3 text-gray-500">
            GraphQL is <span className="text-green-500 font-bold">{((1-graphqlSize/restSize)*100).toFixed(1)}% smaller</span> than REST
          </p>
        </div>
      )}
    </div>
  )
}
