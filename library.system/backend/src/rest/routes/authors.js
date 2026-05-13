import express from 'express'
import { PrismaClient } from '@prisma/client'

const router = express.Router()
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'file:../prisma/dev.db'
    }
  }
})

// GET all authors
router.get('/', async (req, res) => {
  const authors = await prisma.author.findMany({
    include: { books: true }
  })
  res.json(authors)
})

// GET single author
router.get('/:id', async (req, res) => {
  const author = await prisma.author.findUnique({
    where: { id: parseInt(req.params.id) },
    include: { books: true }
  })
  if (!author) return res.status(404).json({ error: 'Author not found' })
  res.json(author)
})

// POST create author
router.post('/', async (req, res) => {
  const { name, bio } = req.body
  const author = await prisma.author.create({
    data: { name, bio }
  })
  res.status(201).json(author)
})

// PUT update author
router.put('/:id', async (req, res) => {
  const { name, bio } = req.body
  const author = await prisma.author.update({
    where: { id: parseInt(req.params.id) },
    data: { name, bio }
  })
  res.json(author)
})

// DELETE author
router.delete('/:id', async (req, res) => {
  await prisma.author.delete({
    where: { id: parseInt(req.params.id) }
  })
  res.json({ message: 'Author deleted' })
})

export default router