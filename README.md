# Library System — RESTful vs GraphQL

> Midterm Project — Web Programming & Applications (503073)  
> Topic #3: API Design: RESTful vs GraphQL

**GitHub:** https://github.com/Volker06/library-system  
**Live Demo:** https://library-system-ten-tau.vercel.app  
**Backend API:** https://library-system-backend-eumj.onrender.com  

---

## Team Members
| Name | Student ID |
|------|------------|
| Đỗ Quốc Việt | 524H0137 |
| Trần Minh Thái | 524H0029 |

---

## Tech Stack
| Layer | Technology |
|-------|------------|
| Frontend | React + Vite |
| Backend | Node.js + Express 4 |
| REST API | Express Router |
| GraphQL | Apollo Server 4 |
| ORM | Prisma 6 |
| Database | SQLite |
| Deploy Frontend | Vercel |
| Deploy Backend | Render |

---

## Access Online (Vercel + Render)

### Step 1 — Wake up the Backend
The backend runs on Render's free tier and **sleeps after 15 minutes** of inactivity.  
Before using the app, open the link below to wake it up:

👉 https://library-system-backend-eumj.onrender.com/api/v1/books

Wait until the browser displays JSON data (approximately 30–60 seconds).

### Step 2 — Open the Web App
👉 https://library-system-ten-tau.vercel.app

### Step 3 — Log In

| Role  | Email             | Password  |
|-------|-------------------|-----------|
| Admin | admin@library.com | Admin@123 |
| User  | vana@gmail.com    | 123       |

> You can also register a new User account to test.

---

## Local Setup

### Prerequisites
- Node.js v18+
- npm v9+

### Step 1 — Clone the Repository
```bash
git clone https://github.com/Volker06/library-system.git
cd library-system
```

### Step 2 — Set Up Backend
```bash
cd backend
npm install
npx prisma migrate dev
npm run dev
```
Backend runs at: `http://localhost:10000`

### Step 3 — Set Up Frontend
Open a new terminal:
```bash
cd frontend
npm install
npm run dev
```
Frontend runs at: `http://localhost:5173`

### Step 4 — Open the App
Go to 👉 `http://localhost:5173` and log in with the credentials above.

> ⚠️ You need to run **two terminals simultaneously** — one for the backend and one for the frontend.
---

## Environment Variables

### Backend — `backend/.env`
```env
DATABASE_URL="file:./dev.db"
PORT=10000
JWT_SECRET=your_secret_key
```

### Frontend — `frontend/.env`
```env
VITE_API_URL=http://localhost:10000
```

---

## Testing Credentials

| Role  | Email             | Password  | Notes                       |
|-------|-------------------|-----------|-----------------------------|
| Admin | admin@library.com | Admin@123 | Full access to all features |
| User  | vana@gmail.com    | 123       | Can borrow and return books |

> New user accounts can be registered directly from the login page.

---

## Features

### Admin
- Manage books (add, edit, delete) with author dropdown
- Manage authors
- Manage borrow records (view, confirm return, delete)
- Manage users (view, delete)
- Reports & Analytics (stats, charts, top books, top members)
- API Comparison — REST vs GraphQL live demo

### User
- Browse and borrow books
- View rental history
- Fees & Payment — automatic late fee calculation (first 7 days free, 2,000 VND/day after)

---

## API Endpoints

### REST API
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/v1/books | Get all books |
| GET | /api/v1/books/:id | Get book by ID |
| POST | /api/v1/books | Create a book |
| PUT | /api/v1/books/:id | Update a book |
| DELETE | /api/v1/books/:id | Delete a book |
| GET | /api/v1/authors | Get all authors |
| POST | /api/v1/authors | Create an author |
| GET | /api/v1/users | Get all users |
| DELETE | /api/v1/users/:id | Delete a user |
| POST | /api/v1/borrow | Borrow a book |
| PUT | /api/v1/borrow/:id/return | Return a book |
| DELETE | /api/v1/borrow/:id | Delete a borrow record |

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

---

## Key Findings — REST vs GraphQL

| Criteria | REST | GraphQL |
|----------|------|---------|
| Over-fetching | ❌ Yes | ✅ No |
| Under-fetching | ❌ Yes | ✅ No |
| Number of endpoints | Multiple | Single (/graphql) |
| HTTP Caching | ✅ Easy | ❌ Complex |
| Learning Curve | ✅ Easy | ❌ Steeper |
| Payload Size | 205 chars | 54 chars (73.7% smaller) |
