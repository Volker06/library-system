# Library System — RESTful vs GraphQL

 Midterm Project — Web Programming & Applications (503073)  
 Topic #3: API Design: RESTful vs GraphQL

## Team Members
Đỗ Quốc Việt 524H0137
Trần Minh Thái 524H0029
## Live Demo
- **Frontend:** https://library-system-ten-tau.vercel.app
- **Backend API:** https://library-system-backend-eumj.onrender.com
- **GraphQL Endpoint:** https://library-system-backend-eumj.onrender.com/graphql

## Tech Stack
- **Frontend:** React + Vite + TailwindCSS
- **Backend:** Node.js + Express 4
- **REST API:** Express Router
- **GraphQL:** Apollo Server 4
- **ORM:** Prisma 6
- **Database:** SQLite
- **Deploy:** Vercel (frontend) + Render (backend)

## Local Setup

### Prerequisites
- Node.js v18+
- npm v9+

### 1. Clone the repository
```bash
git clone https://github.com/Volker06/library-system.git
cd library-system
```

### 2. Setup Backend
```bash
cd backend
npm install
npx prisma migrate dev
npm run dev
```
Backend runs at: `http://localhost:4000`

### 3. Setup Frontend
```bash
cd ../frontend
npm install
npm run dev
```
Frontend runs at: `http://localhost:5173`

## Environment Variables

### Backend `/backend/.env`
```env
DATABASE_URL="file:./dev.db"
PORT=4000
```

### Frontend `/frontend/.env`
```env
VITE_API_URL=http://localhost:4000
```

## Test Credentials
| Role | Email | Password |
|------|-------|----------|
| Admin | admin@library.com | Admin@123 |

## API Endpoints

### REST API
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/v1/books | Get all books |
| GET | /api/v1/books/:id | Get book by ID |
| POST | /api/v1/books | Create book |
| PUT | /api/v1/books/:id | Update book |
| DELETE | /api/v1/books/:id | Delete book |
| GET | /api/v1/authors | Get all authors |
| POST | /api/v1/authors | Create author |
| GET | /api/v1/users | Get all users |
| POST | /api/v1/users | Create user |
| POST | /api/v1/borrow | Borrow a book |
| PUT | /api/v1/borrow/:id/return | Return a book |

### GraphQL
Endpoint: `POST /graphql`

**Queries:**
```graphql
query { books { id title author { name } } }
query { book(id: 1) { title isbn } }
query { authors { name books { title } } }
query { users { name email } }
query { borrowRecords { book { title } user { name } } }
```

**Mutations:**
```graphql
mutation { createBook(title: "...", isbn: "...", publishedYear: 2024, authorId: 1) { id title } }
mutation { borrowBook(userId: 1, bookId: 1) { id borrowedAt } }
mutation { returnBook(id: 1) { id returnedAt } }
```

## Key Findings
| Criteria | REST | GraphQL |
|----------|------|---------|
| Over-fetching | ❌ Yes | ✅ No |
| Under-fetching | ❌ Yes | ✅ No |
| Endpoints | Multiple | Single (/graphql) |
| Caching | ✅ Easy | ❌ Complex |
| Learning Curve | ✅ Easy | ❌ Steeper |
| Payload Size | 205 chars | 54 chars (73.7% smaller) |