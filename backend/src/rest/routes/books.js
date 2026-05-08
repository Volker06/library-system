import express from 'express'
import { PrismaClient } from '@prisma/client'

const router = express.Router()
const prisma = new PrismaClient()

// GET all books
router.get('/', async (req, res) => {
  const books = await prisma.book.findMany({
    include: { author: true }
  })
  res.json(books)
})

// GET single book
router.get('/:id', async (req, res) => {
  const book = await prisma.book.findUnique({
    where: { id: parseInt(req.params.id) },
    include: { author: true, borrowRecords: true }
  })
  if (!book) return res.status(404).json({ error: 'Book not found' })
  res.json(book)
})

// POST create book
router.post('/', async (req, res) => {
  const { title, isbn, publishedYear, authorId } = req.body
  const book = await prisma.book.create({
    data: { title, isbn, publishedYear, authorId }
  })
  res.status(201).json(book)
})

// PUT update book
router.put('/:id', async (req, res) => {
  const { title, isbn, publishedYear } = req.body
  const book = await prisma.book.update({
    where: { id: parseInt(req.params.id) },
    data: { title, isbn, publishedYear }
  })
  res.json(book)
})

// DELETE book
router.delete('/:id', async (req, res) => {
  await prisma.book.delete({
    where: { id: parseInt(req.params.id) }
  })
  res.json({ message: 'Book deleted' })
})

export default router