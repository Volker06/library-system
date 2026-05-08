import { useState } from 'react'
import axios from 'axios'

const REST_URL = `${import.meta.env.VITE_API_URL}/api/v1`
const GRAPHQL_URL = `${import.meta.env.VITE_API_URL}/graphql`

function App() {
    const [page, setPage] = useState('compare')

    return (
        <div className="min-h-screen bg-gray-100">
            {/* Navbar */}
            <nav className="bg-white shadow mb-6">
                <div className="max-w-6xl mx-auto px-4 py-3 flex gap-4">
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
                </div>
            </nav>

            <div className="max-w-6xl mx-auto px-4">
  <div style={{ display: page === 'compare' ? 'block' : 'none' }}><ComparePage /></div>
  <div style={{ display: page === 'books' ? 'block' : 'none' }}><BooksPage /></div>
  <div style={{ display: page === 'authors' ? 'block' : 'none' }}><AuthorsPage /></div>
  <div style={{ display: page === 'borrow' ? 'block' : 'none' }}><BorrowPage /></div>
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
                    <p className="text-center text-gray-500 mt-4 text-sm">GraphQL payload is <span className="font-bold text-green-500">{((1 - graphqlSize / restSize) * 100).toFixed(1)}% smaller</span> than REST</p>
                </div>
            )}
        </div>
    )
}

function BooksPage() {
    const [books, setBooks] = useState([])
    const [form, setForm] = useState({ title: '', isbn: '', publishedYear: '', authorId: '' })
    const [loaded, setLoaded] = useState(false)

    const load = async () => {
        const res = await axios.get(`${REST_URL}/books`)
        setBooks(res.data)
        setLoaded(true)
    }

    const create = async () => {
        await axios.post(`${REST_URL}/books`, { ...form, publishedYear: parseInt(form.publishedYear), authorId: parseInt(form.authorId) })
        setForm({ title: '', isbn: '', publishedYear: '', authorId: '' })
        load()
    }

    const remove = async (id) => {
        await axios.delete(`${REST_URL}/books/${id}`)
        load()
    }

    return (
        <div>
            <h2 className="text-2xl font-bold mb-6">📖 Books Management <span className="text-sm text-gray-400 font-normal">(via REST API)</span></h2>
            <div className="bg-white rounded-xl shadow p-6 mb-6">
                <h3 className="font-bold mb-4">Add New Book</h3>
                <div className="grid grid-cols-2 gap-3 mb-3">
                    <input className="border rounded px-3 py-2 text-sm" placeholder="Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
                    <input className="border rounded px-3 py-2 text-sm" placeholder="ISBN" value={form.isbn} onChange={e => setForm({ ...form, isbn: e.target.value })} />
                    <input className="border rounded px-3 py-2 text-sm" placeholder="Published Year" value={form.publishedYear} onChange={e => setForm({ ...form, publishedYear: e.target.value })} />
                    <input className="border rounded px-3 py-2 text-sm" placeholder="Author ID" value={form.authorId} onChange={e => setForm({ ...form, authorId: e.target.value })} />
                </div>
                <button onClick={create} className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 text-sm">Add Book</button>
            </div>
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
                        <button onClick={() => remove(b.id)} className="text-red-400 hover:text-red-600 text-sm">Delete</button>
                    </div>
                ))}
            </div>
        </div>
    )
}

function AuthorsPage() {
    const [authors, setAuthors] = useState([])
    const [form, setForm] = useState({ name: '', bio: '' })
    const [loaded, setLoaded] = useState(false)

    const load = async () => {
        const res = await axios.get(`${REST_URL}/authors`)
        setAuthors(res.data)
        setLoaded(true)
    }

    const create = async () => {
        await axios.post(`${REST_URL}/authors`, form)
        setForm({ name: '', bio: '' })
        load()
    }

    const remove = async (id) => {
        await axios.delete(`${REST_URL}/authors/${id}`)
        load()
    }

    return (
        <div>
            <h2 className="text-2xl font-bold mb-6">✍️ Authors Management <span className="text-sm text-gray-400 font-normal">(via REST API)</span></h2>
            <div className="bg-white rounded-xl shadow p-6 mb-6">
                <h3 className="font-bold mb-4">Add New Author</h3>
                <div className="grid grid-cols-2 gap-3 mb-3">
                    <input className="border rounded px-3 py-2 text-sm" placeholder="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                    <input className="border rounded px-3 py-2 text-sm" placeholder="Bio" value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} />
                </div>
                <button onClick={create} className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 text-sm">Add Author</button>
            </div>
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
                        <button onClick={() => remove(a.id)} className="text-red-400 hover:text-red-600 text-sm">Delete</button>
                    </div>
                ))}
            </div>
        </div>
    )
}

function BorrowPage() {
    const [records, setRecords] = useState([])
    const [form, setForm] = useState({ userId: '', bookId: '' })
    const [loaded, setLoaded] = useState(false)

    const load = async () => {
        const res = await axios.get(`${REST_URL}/borrow`)
        setRecords(res.data)
        setLoaded(true)
    }

    const borrow = async () => {
        await axios.post(`${REST_URL}/borrow`, { userId: parseInt(form.userId), bookId: parseInt(form.bookId) })
        setForm({ userId: '', bookId: '' })
        load()
    }

    const returnBook = async (id) => {
        await axios.put(`${REST_URL}/borrow/${id}/return`)
        load()
    }

    return (
        <div>
            <h2 className="text-2xl font-bold mb-6">📋 Borrow Management <span className="text-sm text-gray-400 font-normal">(via REST API)</span></h2>
            <div className="bg-white rounded-xl shadow p-6 mb-6">
                <h3 className="font-bold mb-4">Borrow a Book</h3>
                <div className="grid grid-cols-2 gap-3 mb-3">
                    <input className="border rounded px-3 py-2 text-sm" placeholder="User ID" value={form.userId} onChange={e => setForm({ ...form, userId: e.target.value })} />
                    <input className="border rounded px-3 py-2 text-sm" placeholder="Book ID" value={form.bookId} onChange={e => setForm({ ...form, bookId: e.target.value })} />
                </div>
                <button onClick={borrow} className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 text-sm">Borrow Book</button>
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