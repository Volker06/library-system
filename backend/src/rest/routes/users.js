import express from 'express'
import { PrismaClient } from '@prisma/client'

const router = express.Router()
const prisma = new PrismaClient()

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
  await prisma.user.delete({
    where: { id: parseInt(req.params.id) }
  })
  res.json({ message: 'User deleted' })
})

export default router