
import jwt from 'jsonwebtoken'
const SECRET = process.env.JWT_SECRET || 'library_secret_key'

export const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) return res.status(401).json({ error: 'No token provided' })
  try {
    req.user = jwt.verify(token, SECRET)
    next()
  } catch {
    res.status(401).json({ error: 'Invalid token' })
  }
}

export const adminOnly = (req, res, next) => {
  if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Admin only' })
  next()
}