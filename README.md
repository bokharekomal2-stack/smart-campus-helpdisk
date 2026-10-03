# Smart Campus Helpdesk 🏛️

A fast, clean, production-ready web application for campus complaints, facility repairs, and service requests.

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Setup Database & Seed Data
```bash
npm run setup
```
*(Runs SQLite database migrations and populates sample categories, complaints, and test accounts)*

### 3. Start the Server
```bash
npm start
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## 👥 Demo Accounts

The application is pre-seeded with test accounts for immediate verification:

| Role | Email | Password | Details |
|---|---|---|---|
| **Admin** | `admin@campus.edu` | `admin123` | Full administrative control, status management |
| **Student** | `student@campus.edu` | `student123` | Alex Johnson (CS Dept, ID: STU-2026-101) |
| **Student** | `sarah@campus.edu` | `student123` | Sarah Connor (EE Dept, ID: STU-2026-102) |

> 💡 *Note: The login page includes 1-click **"Student Demo"** and **"Admin Demo"** buttons for quick testing.*

---

## 🏗️ Architecture & Technology Stack

- **Runtime & Backend:** Node.js (v20+) with Express
- **Database:** Persistent SQLite (`node:sqlite` DatabaseSync with WAL journal mode and foreign keys enabled)
- **Authentication:** JWT tokens via HTTP-only Cookies and Bearer Authorization headers, with `bcryptjs` password hashing
- **Frontend:** Responsive modern web client with modular ES components, clean CSS design system, and zero build tool overhead
- **Storage Path:** `./data/campus_helpdesk.db`

---

## 📂 Project Structure

```
smart-campus-helpdesk/
├── .env.example              # Environment variables template
├── .env                      # Local environment configuration
├── package.json              # Project scripts and dependencies
├── src/
│   ├── index.js              # Express server entry point
│   ├── config/
│   │   └── env.js            # Environment config loader
│   ├── db/
│   │   ├── connection.js     # SQLite connection manager
│   │   ├── migrate.js        # Table migrations & indexes
│   │   └── seed.js           # Sample users, categories, & tickets
│   ├── middleware/
│   │   ├── auth.js           # JWT authentication & role authorization
│   │   └── errorHandler.js   # Centralized error handling
│   ├── models/
│   │   ├── User.js           # User model (auth, lookup)
│   │   ├── Category.js       # Category queries
│   │   └── Complaint.js      # Complaint queries, ticket generator, stats
│   └── routes/
│       ├── authRoutes.js     # /api/auth (register, login, logout, me)
│       ├── categoryRoutes.js # /api/categories
│       ├── complaintRoutes.js# /api/complaints
│       └── statsRoutes.js    # /api/stats (metrics & breakdown)
└── public/
    ├── index.html            # Single-page container
    ├── css/
    │   └── styles.css        # Responsive CSS styling & design system
    └── js/
        ├── app.js            # Router & lifecycle manager
        ├── api.js            # REST API client
        ├── state.js          # Centralized client state
        ├── components/       # Navbar, modals, toast alerts
        └── views/            # Student & Admin dashboards, Auth views
```

---

## 📡 API Reference

### Authentication
- `POST /api/auth/register` - Create a student or admin account
- `POST /api/auth/login` - Authenticate and receive JWT cookie / token
- `POST /api/auth/logout` - Clear session cookie
- `GET /api/auth/me` - Get profile of authenticated user

### Categories
- `GET /api/categories` - List all campus service categories

### Complaints & Requests
- `GET /api/complaints` - List complaints (filtered for students, all for admins)
- `GET /api/complaints/:id` - View single ticket details
- `POST /api/complaints` - Submit a new complaint (student)
- `PATCH /api/complaints/:id/status` - Update ticket status and notes (admin only)

### Statistics
- `GET /api/stats` - Summary counters and category breakdown

---

## ⚙️ Environment Variables

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3000` | Port the Express server listens on |
| `NODE_ENV` | `development` | Environment mode (`development` or `production`) |
| `JWT_SECRET` | *(Random dev secret)* | Secret key for signing JSON Web Tokens |
| `DB_PATH` | `./data/campus_helpdesk.db` | File path for persistent SQLite database |
