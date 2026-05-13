import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'file:../prisma/dev.db'
    }
  }
})

export const resolvers = {
  Query: {
    books: () => prisma.book.findMany({ include: { author: true } }),
    book: (_, { id }) => prisma.book.findUnique({ where: { id }, include: { author: true, borrowRecords: true } }),
    authors: () => prisma.author.findMany({ include: { books: true } }),
    author: (_, { id }) => prisma.author.findUnique({ where: { id }, include: { books: true } }),
    users: () => prisma.user.findMany(),
    borrowRecords: () => prisma.borrowRecord.findMany({ include: { user: true, book: true } })
  },

  Mutation: {
    createBook: (_, { title, isbn, publishedYear, authorId }) =>
      prisma.book.create({ data: { title, isbn, publishedYear, authorId } }),

    updateBook: (_, { id, title, isbn, publishedYear }) =>
      prisma.book.update({ where: { id }, data: { title, isbn, publishedYear } }),

    deleteBook: (_, { id }) =>
      prisma.book.delete({ where: { id } }),

    createAuthor: (_, { name, bio }) =>
      prisma.author.create({ data: { name, bio } }),

    createUser: (_, { name, email, password, role }) =>
      prisma.user.create({ data: { name, email, password, role: role || 'user' } }),

    borrowBook: (_, { userId, bookId }) =>
      prisma.borrowRecord.create({ data: { userId, bookId }, include: { user: true, book: true } }),

    returnBook: (_, { id }) =>
      prisma.borrowRecord.update({ where: { id }, data: { returnedAt: new Date().toISOString() } })
  }
}