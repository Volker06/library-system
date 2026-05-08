import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { ApolloServer } from '@apollo/server'
import { expressMiddleware } from '@apollo/server/express4'
import { typeDefs } from './graphql/typeDefs.js'
import { resolvers } from './graphql/resolvers.js'
import bookRoutes from './rest/routes/books.js'
import authorRoutes from './rest/routes/authors.js'
import userRoutes from './rest/routes/users.js'
import borrowRoutes from './rest/routes/borrow.js'

dotenv.config()

const app = express()

const server = new ApolloServer({ 
  typeDefs, 
  resolvers,
  introspection: true
})
await server.start()

app.get('/', (req, res) => res.json({ message: 'Library API is running!' }))

app.use('/api/v1/books', cors(), express.json(), bookRoutes)
app.use('/api/v1/authors', cors(), express.json(), authorRoutes)
app.use('/api/v1/users', cors(), express.json(), userRoutes)
app.use('/api/v1/borrow', cors(), express.json(), borrowRoutes)
app.use('/graphql', cors(), express.json(), expressMiddleware(server))

const PORT = process.env.PORT || 4000
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
  console.log(`GraphQL at http://localhost:${PORT}/graphql`)
})