export const typeDefs = `#graphql
  type Author {
    id: Int
    name: String
    bio: String
    books: [Book]
  }

  type Book {
    id: Int
    title: String
    isbn: String
    publishedYear: Int
    author: Author
    borrowRecords: [BorrowRecord]
  }

  type User {
    id: Int
    name: String
    email: String
    role: String
  }

  type BorrowRecord {
    id: Int
    borrowedAt: String
    returnedAt: String
    user: User
    book: Book
  }

  type Query {
    books: [Book]
    book(id: Int!): Book
    authors: [Author]
    author(id: Int!): Author
    users: [User]
    borrowRecords: [BorrowRecord]
  }

  type Mutation {
    createBook(title: String!, isbn: String!, publishedYear: Int!, authorId: Int!): Book
    updateBook(id: Int!, title: String, isbn: String, publishedYear: Int): Book
    deleteBook(id: Int!): Book
    createAuthor(name: String!, bio: String): Author
    createUser(name: String!, email: String!, password: String!, role: String): User
    borrowBook(userId: Int!, bookId: Int!): BorrowRecord
    returnBook(id: Int!): BorrowRecord
  }
`