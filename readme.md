# Chat App Backend 💬

Backend API for a real-time chat application built with **Node.js**, **Express.js**, and **MongoDB**. It provides secure user authentication using JWT stored in HTTP-only cookies and exposes REST APIs for managing users and chat functionality.

## ✨ Features

- 🔐 User Authentication (Signup & Signin)
- 🍪 JWT Authentication with HTTP-only Cookies
- 🔒 Password Hashing using bcrypt
- ✅ Request Validation using Zod
- 🗄️ MongoDB Database with Mongoose
- ⚡ RESTful API Architecture
- 🛡️ Secure Authentication Middleware
- 🌐 CORS Configuration
- ⚠️ Centralized Error Handling

---

## 🛠️ Tech Stack

- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT (jsonwebtoken)
- bcrypt
- Zod
- Cookie Parser
- CORS
- dotenv

---

## 📂 Project Structure

```
backend/
├── controllers/
├── middleware/
├── models/
├── routes/
├── config/
├── .env
├── server.js
└── package.json
```

---

## ⚙️ Environment Variables

Create a `.env` file in the project root.

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
NODE_ENV=development
```

---

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone <repository-url>
```

### 2. Navigate into the backend folder

```bash
cd backend
```

### 3. Install dependencies

```bash
npm install
```

### 4. Start the development server

```bash
npm run dev
```

The server will run on:

```
http://localhost:5000
```

---

## 📌 API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/user/signup` | Register a new user |
| POST | `/api/user/signin` | Login an existing user |

---

## 👤 User Schema

```javascript
{
  name: String,
  email: String,
  password: String,
  pic: String
}
```

---

## 🔐 Authentication Flow

1. User signs up or signs in.
2. Password is securely hashed and verified using **bcrypt**.
3. A JWT is generated upon successful authentication.
4. The JWT is stored in an **HTTP-only cookie**.
5. Protected routes verify the token before granting access.

---

## 🛡️ Security

- Password hashing with bcrypt
- JWT-based authentication
- HTTP-only cookies
- Zod request validation
- Environment variables for sensitive data
- Secure cookie configuration for production

---

## 📜 License

This project is licensed under the **MIT License**.