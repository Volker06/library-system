import { useState } from 'react'
import axios from 'axios'

const REST_URL = `${import.meta.env.VITE_API_URL}/api/v1`
const GRAPHQL_URL = `${import.meta.env.VITE_API_URL}/graphql`

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'))
  const [currentUser, setCurrentUser] = useState(JSON.parse(localStorage.getItem('user') || 'null'))
  const [page, setPage] = useState('compare')

  const login = (token, user) => {
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(user))
    setToken(token)
    setCurrentUser(user)
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setToken(null)
    setCurrentUser(null)
    setPage('compare')
  }

  if (!token) return <LoginPage onLogin={login} />

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow mb-6">
        <div className="max-w-6xl mx-auto px-4 py-3 flex gap-4 items-center">
          <h1 className="font-bold text-lg mr-6">📚 Library System</h1>
          {['compare', 'books', 'authors', 'borrow'].map(p => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`px-4 py-1 rounded-lg capitalize font-medium ${page === p ? 'bg-blue-500 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              {p === 'compare' ? '⚡ Compare' : p === 'books' ? '📖 Books' : p === 'authors' ? '✍️ Authors' : '📋 Borrow'}
            </button>
          ))}
          <div className="ml-auto flex items-center gap-3">
            <span className="text-sm text-gray-500">
              👤 {currentUser?.name}
              <span className={`ml-2 px-2 py-0.5 rounded text-xs font-bold ${currentUser?.role === 'admin' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                {currentUser?.role}
              </span>
            </span>
            <button onClick={logout} className="text-sm text-gray-400 hover:text-red-500">Logout</button>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4">
        {page === 'compare' && <ComparePage />}
        {page === 'books' && <BooksPage token={token} isAdmin={currentUser?.role === 'admin'} />}
        {page === 'authors' && <AuthorsPage token={token} isAdmin={currentUser?.role === 'admin'} />}
        {page === 'borrow' && <BorrowPage token={token} currentUser={currentUser} />}
      </div>
    </div>
  )
}

function LoginPage({ onLogin }) {
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showRegister, setShowRegister] = useState(false)
  const [regForm, setRegForm] = useState({ name: '', email: '', password: '' })

  const handleLogin = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await axios.post(`${REST_URL}/auth/login`, form)
      onLogin(res.data.token, res.data.user)
    } catch {
      setError('Invalid email or password')
    }
    setLoading(false)
  }

  const handleRegister = async () => {
    setLoading(true)
    setError('')
    try {
      await axios.post(`${REST_URL}/auth/register`, { ...regForm, role: 'user' })
      setShowRegister(false)
      setForm({ email: regForm.email, password: regForm.password })
    } catch {
      setError('Email already exists')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white rounded-xl shadow p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-2">📚 Library System</h1>
        <p className="text-center text-gray-500 text-sm mb-6">RESTful vs GraphQL Demo</p>

        {!showRegister ? (
          <>
            <h2 className="text-lg font-bold mb-4">Login</h2>
            {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
            <input
              className="border rounded px-3 py-2 w-full mb-3 text-sm"
              placeholder="Email"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
            />
            <input
              className="border rounded px-3 py-2 w-full mb-4 text-sm"
              placeholder="Password"
              type="password"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
            />
            <button
              onClick={handleLogin}
              disabled={loading}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg w-full hover:bg-blue-600 mb-3"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
            <p className="text-center text-sm text-gray-500">
              No account?{' '}
              <button onClick={() => setShowRegister(true)} className="text-blue-500 hover:underline">Register</button>
            </p>
            <div className="mt-4 p-3 bg-gray-50 rounded text-xs text-gray-500">
              <p className="font-bold mb-1">Test credentials:</p>
              <p>Admin: admin@library.com / Admin@123</p>
            </div>
          </>
        ) : (
          <>
            <h2 className="text-lg font-bold mb-4">Register</h2>
            {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
            <input
              className="border rounded px-3 py-2 w-full mb-3 text-sm"
              placeholder="Name"
              value={regForm.name}
              onChange={e => setRegForm({ ...regForm, name: e.target.value })}
            />
            <input
              className="border rounded px-3 py-2 w-full mb-3 text-sm"
              placeholder="Email"
              value={regForm.email}
              onChange={e => setRegForm({ ...regForm, email: e.target.value })}
            />
            <input
              className="border rounded px-3 py-2 w-full mb-4 text-sm"
              placeholder="Password"
              type="password"
              value={regForm.password}
              onChange={e => setRegForm({ ...regForm, password: e.target.value })}
            />
            <button
              onClick={handleRegister}
              disabled={loading}
              className="bg-green-500 text-white px-4 py-2 rounded-lg w-full hover:bg-green-600 mb-3"
            >
              {loading ? 'Registering...' : 'Register'}
            </button>
            <p className="text-center text-sm text-gray-500">
              Already have account?{' '}
              <button onClick={() => setShowRegister(false)} className="text-blue-500 hover:underline">Login</button>
            </p>
          </>
        )}
      </div>
    </div>
  )
}

function ComparePage() {
  const [restData, setRestData] = useState(null)
  const [graphqlData, setGraphqlData] = useState(null)
  const [restSize, setRestSize] = useState(null)
  const [graphqlSize, setGraphqlSize] = useState(null)
  const [restTime, setRestTime] = useState(null)
  const [graphqlTime, setGraphqlTime] = useState(null)

  const fetchREST = async () => {
    const start = performance.now()
    const res = await axios.get(`${REST_URL}/books`)
    const end = performance.now()
    setRestData(res.data)
    setRestTime((end - start).toFixed(2))
    setRestSize(JSON.stringify(res.data).length)
  }

  const fetchGraphQL = async () => {
    const start = performance.now()
    const res = await axios.post(GRAPHQL_URL, { query: `query { books { title } }` })
    const end = performance.now()
    setGraphqlData(res.data.data.books)
    setGraphqlTime((end - start).toFixed(2))
    setGraphqlSize(JSON.stringify(res.data.data.books).length)
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-center mb-2">RESTful vs GraphQL — Fetching Efficiency Demo</h2>
      <p className="text-center text-gray-500 mb-6">Same data, different approaches</p>
      <div className="grid grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="text-xl font-bold text-blue-600 mb-2">REST API</h3>
          <p className="text-sm text-gray-500 mb-1">GET /api/v1/books</p>
          <p className="text-sm text-gray-500 mb-4">Returns ALL fields (over-fetching)</p>
          <button onClick={fetchREST} className="bg-blue-500 text-white px-4 py-2 rounded-lg w-full mb-4 hover:bg-blue-600">Fetch via REST</button>
          {restData && (
            <div>
              <div className="flex justify-between mb-1"><span className="text-sm">Response size:</span><span className="text-sm text-red-500 font-bold">{restSize} chars</span></div>
              <div className="flex justify-between mb-3"><span className="text-sm">Response time:</span><span className="text-sm text-red-500 font-bold">{restTime} ms</span></div>
              <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto max-h-48">{JSON.stringify(restData, null, 2)}</pre>
            </div>
          )}
        </div>
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="text-xl font-bold text-pink-600 mb-2">GraphQL</h3>
          <p className="text-sm text-gray-500 mb-1">POST /graphql</p>
          <p className="text-sm text-gray-500 mb-4">Returns ONLY requested fields</p>
          <button onClick={fetchGraphQL} className="bg-pink-500 text-white px-4 py-2 rounded-lg w-full mb-4 hover:bg-pink-600">Fetch via GraphQL</button>
          {graphqlData && (
            <div>
              <div className="flex justify-between mb-1"><span className="text-sm">Response size:</span><span className="text-sm text-green-500 font-bold">{graphqlSize} chars</span></div>
              <div className="flex justify-between mb-3"><span className="text-sm">Response time:</span><span className="text-sm text-green-500 font-bold">{graphqlTime} ms</span></div>
              <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto max-h-48">{JSON.stringify(graphqlData, null, 2)}</pre>
            </div>
          )}
        </div>
      </div>
      {restSize && graphqlSize && (
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="text-xl font-bold mb-4 text-center">Payload Size Comparison</h3>
          <div className="mb-3">
            <div className="flex justify-between mb-1"><span className="text-sm font-medium text-blue-600">REST</span><span className="text-sm text-blue-600">{restSize} chars</span></div>
            <div className="w-full bg-gray-200 rounded-full h-4"><div className="bg-blue-500 h-4 rounded-full" style={{ width: '100%' }}></div></div>
          </div>
          <div>
            <div className="flex justify-between mb-1"><span className="text-sm font-medium text-pink-600">GraphQL</span><span className="text-sm text-pink-600">{graphqlSize} chars</span></div>
            <div className="w-full bg-gray-200 rounded-full h-4"><div className="bg-pink-500 h-4 rounded-full" style={{ width: `${(graphqlSize / restSize) * 100}%` }}></div></div>
          </div>
          <p className="text-center text-gray-500 mt-4 text-sm">
            GraphQL payload is <span className="font-bold text-green-500">{((1 - graphqlSize / restSize) * 100).toFixed(1)}% smaller</span> than REST
          </p>
        </div>
      )}
    </div>
  )
}

function BooksPage({ token, isAdmin }) {
  const [books, setBooks] = useState([])
  const [form, setForm] = useState({ title: '', isbn: '', publishedYear: '', authorId: '' })
  const [loaded, setLoaded] = useState(false)

  const headers = { Authorization: `Bearer ${token}` }

  const load = async () => {
    const res = await axios.get(`${REST_URL}/books`)
    setBooks(res.data)
    setLoaded(true)
  }

  const create = async () => {
    await axios.post(`${REST_URL}/books`, {
      ...form,
      publishedYear: parseInt(form.publishedYear),
      authorId: parseInt(form.authorId)
    }, { headers })
    setForm({ title: '', isbn: '', publishedYear: '', authorId: '' })
    load()
  }

  const remove = async (id) => {
    await axios.delete(`${REST_URL}/books/${id}`, { headers })
    load()
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">📖 Books Management <span className="text-sm text-gray-400 font-normal">(via REST API)</span></h2>
      {isAdmin && (
        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <h3 className="font-bold mb-4">Add New Book <span className="text-xs text-red-500 font-normal">Admin only</span></h3>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <input className="border rounded px-3 py-2 text-sm" placeholder="Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
            <input className="border rounded px-3 py-2 text-sm" placeholder="ISBN" value={form.isbn} onChange={e => setForm({ ...form, isbn: e.target.value })} />
            <input className="border rounded px-3 py-2 text-sm" placeholder="Published Year" value={form.publishedYear} onChange={e => setForm({ ...form, publishedYear: e.target.value })} />
            <input className="border rounded px-3 py-2 text-sm" placeholder="Author ID" value={form.authorId} onChange={e => setForm({ ...form, authorId: e.target.value })} />
          </div>
          <button onClick={create} className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 text-sm">Add Book</button>
        </div>
      )}
      <div className="bg-white rounded-xl shadow p-6">
        <div className="flex justify-between mb-4">
          <h3 className="font-bold">Book List</h3>
          <button onClick={load} className="bg-gray-100 px-3 py-1 rounded text-sm hover:bg-gray-200">Load Books</button>
        </div>
        {!loaded && <p className="text-gray-400 text-sm">Click "Load Books" to fetch data via REST API</p>}
        {books.map(b => (
          <div key={b.id} className="flex justify-between items-center border-b py-3">
            <div>
              <p className="font-medium">{b.title}</p>
              <p className="text-sm text-gray-500">ISBN: {b.isbn} | Year: {b.publishedYear} | Author: {b.author?.name}</p>
            </div>
            {isAdmin && (
              <button onClick={() => remove(b.id)} className="text-red-400 hover:text-red-600 text-sm">Delete</button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function AuthorsPage({ token, isAdmin }) {
  const [authors, setAuthors] = useState([])
  const [form, setForm] = useState({ name: '', bio: '' })
  const [loaded, setLoaded] = useState(false)

  const headers = { Authorization: `Bearer ${token}` }

  const load = async () => {
    const res = await axios.get(`${REST_URL}/authors`)
    setAuthors(res.data)
    setLoaded(true)
  }

  const create = async () => {
    await axios.post(`${REST_URL}/authors`, form, { headers })
    setForm({ name: '', bio: '' })
    load()
  }

  const remove = async (id) => {
    await axios.delete(`${REST_URL}/authors/${id}`, { headers })
    load()
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">✍️ Authors Management <span className="text-sm text-gray-400 font-normal">(via REST API)</span></h2>
      {isAdmin && (
        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <h3 className="font-bold mb-4">Add New Author <span className="text-xs text-red-500 font-normal">Admin only</span></h3>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <input className="border rounded px-3 py-2 text-sm" placeholder="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            <input className="border rounded px-3 py-2 text-sm" placeholder="Bio" value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} />
          </div>
          <button onClick={create} className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 text-sm">Add Author</button>
        </div>
      )}
      <div className="bg-white rounded-xl shadow p-6">
        <div className="flex justify-between mb-4">
          <h3 className="font-bold">Author List</h3>
          <button onClick={load} className="bg-gray-100 px-3 py-1 rounded text-sm hover:bg-gray-200">Load Authors</button>
        </div>
        {!loaded && <p className="text-gray-400 text-sm">Click "Load Authors" to fetch data via REST API</p>}
        {authors.map(a => (
          <div key={a.id} className="flex justify-between items-center border-b py-3">
            <div>
              <p className="font-medium">{a.name}</p>
              <p className="text-sm text-gray-500">{a.bio} | Books: {a.books?.length}</p>
            </div>
            {isAdmin && (
              <button onClick={() => remove(a.id)} className="text-red-400 hover:text-red-600 text-sm">Delete</button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function BorrowPage({ token, currentUser }) {
  const [records, setRecords] = useState([])
  const [form, setForm] = useState({ bookId: '' })
  const [loaded, setLoaded] = useState(false)

  const headers = { Authorization: `Bearer ${token}` }

  const load = async () => {
    const res = await axios.get(`${REST_URL}/borrow`, { headers })
    setRecords(res.data)
    setLoaded(true)
  }

  const borrow = async () => {
    await axios.post(`${REST_URL}/borrow`, {
      userId: currentUser.id,
      bookId: parseInt(form.bookId)
    }, { headers })
    setForm({ bookId: '' })
    load()
  }

  const returnBook = async (id) => {
    await axios.put(`${REST_URL}/borrow/${id}/return`, {}, { headers })
    load()
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">📋 Borrow Management <span className="text-sm text-gray-400 font-normal">(via REST API)</span></h2>
      <div className="bg-white rounded-xl shadow p-6 mb-6">
        <h3 className="font-bold mb-4">Borrow a Book</h3>
        <div className="flex gap-3">
          <input
            className="border rounded px-3 py-2 text-sm flex-1"
            placeholder="Book ID"
            value={form.bookId}
            onChange={e => setForm({ bookId: e.target.value })}
          />
          <button onClick={borrow} className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 text-sm">Borrow</button>
        </div>
      </div>
      <div className="bg-white rounded-xl shadow p-6">
        <div className="flex justify-between mb-4">
          <h3 className="font-bold">Borrow Records</h3>
          <button onClick={load} className="bg-gray-100 px-3 py-1 rounded text-sm hover:bg-gray-200">Load Records</button>
        </div>
        {!loaded && <p className="text-gray-400 text-sm">Click "Load Records" to fetch data via REST API</p>}
        {records.map(r => (
          <div key={r.id} className="flex justify-between items-center border-b py-3">
            <div>
              <p className="font-medium">{r.book?.title}</p>
              <p className="text-sm text-gray-500">
                User: {r.user?.name} | Borrowed: {new Date(r.borrowedAt).toLocaleDateString()}
              </p>
              <p className="text-sm">
                {r.returnedAt
                  ? <span className="text-green-500">Returned</span>
                  : <span className="text-orange-400">Not returned</span>
                }
              </p>
            </div>
            {!r.returnedAt && (
              <button
                onClick={() => returnBook(r.id)}
                className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600"
              >
                Return
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default App
