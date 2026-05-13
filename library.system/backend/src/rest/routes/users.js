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

// GET all users
router.get('/', async (req, res) => {
  const users = await prisma.user.findMany()
  res.json(users)
})

// POST create user
router.post('/', async (req, res) => {
  const { name, email, password, role } = req.body
  const user = await prisma.user.create({
    data: { name, email, password, role }
  })
  res.status(201).json(user)
})

// DELETE user
router.delete('/:id', async (req, res) => {
  try {
    await prisma.user.delete({
      where: { id: parseInt(req.params.id) }
    })
    res.json({ message: 'User deleted' })
  } catch (e) {
    res.status(400).json({ error: 'Cannot delete user with borrow records' })
  }
})

// PUT update user
router.put('/:id', async (req, res) => {
  try {
    const { name, email, password } = req.body
    const user = await prisma.user.update({
      where: { id: parseInt(req.params.id) },
      data: { name, email, password }
    })
    res.json(user)
  } catch (e) {
    res.status(400).json({ error: 'Update failed' })
  }
})

export default router