import { useState } from 'react'
import axios from 'axios'

const REST_URL = 'http://localhost:4000/api/v1'
const GRAPHQL_URL = 'http://localhost:4000/graphql'

function App() {
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
    const res = await axios.post(GRAPHQL_URL, {
      query: `query { books { title } }`
    })
    const end = performance.now()
    setGraphqlData(res.data.data.books)
    setGraphqlTime((end - start).toFixed(2))
    setGraphqlSize(JSON.stringify(res.data.data.books).length)
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-3xl font-bold text-center mb-2">Library System</h1>
      <p className="text-center text-gray-500 mb-8">RESTful vs GraphQL — Fetching Efficiency Demo</p>

      {/* Comparison Section */}
      <div className="grid grid-cols-2 gap-6 mb-8">
        {/* REST */}
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-xl font-bold text-blue-600 mb-4">REST API</h2>
          <p className="text-sm text-gray-500 mb-2">Endpoint: GET /api/v1/books</p>
          <p className="text-sm text-gray-500 mb-4">Returns ALL fields (over-fetching)</p>
          <button
            onClick={fetchREST}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 w-full mb-4"
          >
            Fetch via REST
          </button>
          {restData && (
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">Response size:</span>
                <span className="text-sm text-red-500 font-bold">{restSize} chars</span>
              </div>
              <div className="flex justify-between mb-4">
                <span className="text-sm font-medium">Response time:</span>
                <span className="text-sm text-red-500 font-bold">{restTime} ms</span>
              </div>
              <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto max-h-48">
                {JSON.stringify(restData, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* GraphQL */}
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-xl font-bold text-pink-600 mb-4">GraphQL</h2>
          <p className="text-sm text-gray-500 mb-2">Endpoint: POST /graphql</p>
          <p className="text-sm text-gray-500 mb-4">Returns ONLY requested fields</p>
          <button
            onClick={fetchGraphQL}
            className="bg-pink-500 text-white px-4 py-2 rounded-lg hover:bg-pink-600 w-full mb-4"
          >
            Fetch via GraphQL
          </button>
          {graphqlData && (
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">Response size:</span>
                <span className="text-sm text-green-500 font-bold">{graphqlSize} chars</span>
              </div>
              <div className="flex justify-between mb-4">
                <span className="text-sm font-medium">Response time:</span>
                <span className="text-sm text-green-500 font-bold">{graphqlTime} ms</span>
              </div>
              <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto max-h-48">
                {JSON.stringify(graphqlData, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>

      {/* Size Comparison Bar */}
      {restSize && graphqlSize && (
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-xl font-bold mb-4 text-center">Payload Size Comparison</h2>
          <div className="mb-3">
            <div className="flex justify-between mb-1">
              <span className="text-sm font-medium text-blue-600">REST</span>
              <span className="text-sm text-blue-600">{restSize} chars</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div className="bg-blue-500 h-4 rounded-full" style={{ width: '100%' }}></div>
            </div>
          </div>
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-sm font-medium text-pink-600">GraphQL</span>
              <span className="text-sm text-pink-600">{graphqlSize} chars</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div
                className="bg-pink-500 h-4 rounded-full"
                style={{ width: `${(graphqlSize / restSize) * 100}%` }}
              ></div>
            </div>
          </div>
          <p className="text-center text-gray-500 mt-4 text-sm">
            GraphQL payload is <span className="font-bold text-green-500">
              {((1 - graphqlSize / restSize) * 100).toFixed(1)}% smaller
            </span> than REST
          </p>
        </div>
      )}
    </div>
  )
}

export default App