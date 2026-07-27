# Chat App Backend

A RESTful backend for a real-time chat application built with **Node.js**, **Express.js**, and **MongoDB**. It provides user authentication using JWT stored in HTTP-only cookies and serves as the API for the chat application.

## 🚀 Features

- User Signup
- User Sign In
- JWT Authentication
- HTTP-only Cookie Authentication
- Password Hashing with bcrypt
- MongoDB with Mongoose
- Input Validation using Zod
- Error Handling
- Secure Authentication Middleware
- RESTful API Structure

## 🛠️ Tech Stack

- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT
- bcrypt
- Zod
- Cookie Parser
- CORS
- dotenv

## 📁 Folder Structure

```
backend/
│── controllers/
│── middleware/
│── models/
│── routes/
│── config/
│── .env
│── server.js
│── package.json
```

## ⚙️ Environment Variables

Create a `.env` file in the root directory.

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
NODE_ENV=development
```

## 📦 Installation

Clone the repository

```bash
git clone <repository-url>
```

Navigate to the backend

```bash
cd backend
```

Install dependencies

```bash
npm install
```

Start the development server

```bash
npm run dev
```

Or start normally

```bash
npm start
```

## 🔐 Authentication

Authentication is implemented using **JWT** stored in **HTTP-only cookies**.

After a successful signup or signin, a token is generated and stored securely in the browser cookie.

## 📌 API Endpoints

### Authentication

| Method | Endpoint | Description |
|---------|----------|-------------|
| POST | `/api/user/signup` | Register a new user |
| POST | `/api/user/signin` | Login an existing user |
| POST | `/api/user/logout` | Logout user *(if implemented)* |

## 👤 User Model

```js
{
  name: String,
  email: String,
  password: String,
  pic: String
}
```

## 🔒 Security

- Passwords hashed using bcrypt
- JWT Authentication
- HTTP-only Cookies
- Input Validation with Zod
- Secure Cookie Configuration
- Environment Variables for Secrets

## 📄 License

This project is licensed under the MIT License.