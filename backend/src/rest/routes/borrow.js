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

// Borrow a book
router.post('/', async (req, res) => {
  const { userId, bookId } = req.body
  const record = await prisma.borrowRecord.create({
    data: { userId, bookId },
    include: { user: true, book: true }
  })
  res.status(201).json(record)
})

// Return a book
router.put('/:id/return', async (req, res) => {
  const record = await prisma.borrowRecord.update({
    where: { id: parseInt(req.params.id) },
    data: { returnedAt: new Date() }
  })
  res.json(record)
})

// GET all borrow records
router.get('/', async (req, res) => {
  const records = await prisma.borrowRecord.findMany({
    include: { user: true, book: true }
  })
  res.json(records)
})

export default router