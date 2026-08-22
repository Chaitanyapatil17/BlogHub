# BlogHub — Full-Stack Blog Management System

A full-stack blog platform built for the **Intern CRUD Assignment**, featuring Role-Based Access Control (RBAC), Approval Workflows, Social & Engagement tools, and **Socket.io Real-Time Push Notifications**.

---

## 🛠 Tech Stack

- **Frontend**: React 19, Tailwind CSS v4, Vite, React Router, Lucide Icons, Socket.io-client
- **Backend**: Node.js, Express.js, Socket.io Server, HTTP
- **Database**: PostgreSQL (`pg` node-postgres connection pool)
- **Authentication & Security**: JWT (JSON Web Tokens) & `bcryptjs` password hashing

---

## ⚡ Socket.io Real-Time Notifications

BlogHub uses **Socket.io** for live bidirectional push notifications paired with PostgreSQL persistence:

1. **🔔 Notification Bell & Interactive Dropdown in Navbar**:
   - Live pulsating unread badge counter (`1`, `2`, `9+`).
   - Interactive dropdown with timestamps, direct links to view content, and 1-click "Mark all as read".
   - In-app floating toast alerts when a real-time event triggers.
2. **📡 Real-Time Event Triggers**:
   - **Unverified Post Submission** ➔ Real-time push alert to all Admins (`"New blog approval request from <Author>"`).
   - **Admin Approves Blog** ➔ Real-time push alert to Author (`"Your blog '<Title>' has been approved & published! 🎉"`).
   - **Admin Rejects Blog** ➔ Real-time push alert to Author (`"Your blog '<Title>' was rejected: <Feedback note>"`).
   - **New Comment** ➔ Real-time push alert to Blog Author (`"<User> commented on your article"`).
   - **New Like** ➔ Real-time push alert to Blog Author (`"<User> liked your article ❤️"`).
   - **User Verification** ➔ Real-time push alert to User (`"Your account is now Verified!"`).

---

## 👥 Roles & Access Permissions

| Role | Permissions & Behavior |
|---|---|
| **Admin** | Full CRUD on blogs, comments & users. Approve or reject blog requests with review notes. Verify/unverify users. Access to Admin Dashboard. Real-time alerts for review requests. |
| **Verified User** | Create, edit, and delete own blogs. Submissions are **published directly** with no approval needed. Post & moderate comments on own blogs. |
| **Unverified User** | Submits blog as a request; goes into the **Admin Approval Queue**. Status trackable under *My Requests*. Can like, comment, and bookmark. |
| **Guest** | Public browsing of published blogs, reading, searching, and viewing discussions. |

---

## 📊 Database Schema (PostgreSQL)

- **`users`**: `id`, `name`, `email`, `password_hash`, `role`, `is_verified`, `created_at`
- **`blogs`**: `id`, `title`, `slug`, `content`, `author_id`, `status`, `created_at`, `updated_at`
- **`blog_requests`**: `id`, `blog_id`, `user_id`, `status`, `reviewed_by`, `review_note`, `created_at`, `updated_at`
- **`comments`**: `id`, `blog_id`, `user_id`, `content`, `created_at`
- **`blog_likes`**: `id`, `blog_id`, `user_id`, `created_at`, `UNIQUE (blog_id, user_id)`
- **`blog_bookmarks`**: `id`, `blog_id`, `user_id`, `created_at`, `UNIQUE (blog_id, user_id)`
- **`notifications`**: `id`, `user_id`, `title`, `message`, `link`, `is_read`, `created_at`

---

## 🚀 How to Run the Project

### 1. Backend
```bash
cd backend
npm run dev
```
Backend runs with Socket.io on: `http://localhost:5000`

### 2. Frontend
```bash
cd frontend
npm run dev
```
Frontend runs on: `http://localhost:5173`
