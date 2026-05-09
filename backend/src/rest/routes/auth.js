import express from 'express'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const router = express.Router()
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'file:../prisma/dev.db'
    }
  }
})
const SECRET = process.env.JWT_SECRET || 'library_secret_key'

// REGISTER
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body
    
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) return res.status(400).json({ error: 'Email already exists' })
    
    const hashed = await bcrypt.hash(password, 10)
    const user = await prisma.user.create({
      data: { name, email, password: hashed, role: role || 'user' }
    })
    res.status(201).json({ 
      message: 'User created', 
      user: { id: user.id, name: user.name, email: user.email, role: user.role } 
    })
  } catch (e) {
    console.log('REGISTER ERROR:', e.message)  
    res.status(500).json({ error: e.message })
  }
})
// LOGIN
router.post('/login', async (req, res) => {
  const { email, password } = req.body
  console.log('LOGIN ATTEMPT:', email, password)
  const user = await prisma.user.findUnique({ where: { email } })
  console.log('USER FOUND:', user)
  if (!user) return res.status(401).json({ error: 'Invalid credentials' })
  const valid = await bcrypt.compare(password, user.password)
  console.log('PASSWORD VALID:', valid)
  if (!valid) return res.status(401).json({ error: 'Invalid credentials' })
  const token = jwt.sign({ id: user.id, role: user.role }, SECRET, { expiresIn: '24h' })
  res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } })
})

export default router