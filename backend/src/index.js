import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { ApolloServer } from '@apollo/server'
import { expressMiddleware } from '@apollo/server/express4'
import { typeDefs } from './graphql/typeDefs.js'
import { resolvers } from './graphql/resolvers.js'

dotenv.config()

const app = express()

const server = new ApolloServer({ typeDefs, resolvers })
await server.start()

app.get('/', (req, res) => res.json({ message: 'Library API is running!' }))

app.use('/graphql', cors(), express.json(), expressMiddleware(server))

const PORT = process.env.PORT || 4000
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
  console.log(`GraphQL at http://localhost:${PORT}/graphql`)
})