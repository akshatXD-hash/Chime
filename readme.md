# Chime 💬 — Real-time WhatsApp Style Chat Application

Chime is a modern, high-performance, real-time web chat application featuring a sleek **WhatsApp Web 3-column architecture** powered by **Node.js**, **Express.js**, **MongoDB**, **Socket.io**, **React**, **Vite**, and **Tailwind CSS** with a **100xDevs inspired dark slate color palette**.

---

## 🎨 100xDevs Color Palette & Design System

- **Primary Background**: `#050811` (Deep obsidian dark)
- **Sidebar & Surface Container**: `#0B0F19` (Dark slate container)
- **Cards & Chat Panels**: `#121827` (Glassmorphism dark card)
- **Primary Glowing Accent**: `#3B82F6` (Electric Royal Blue) to `#2563EB`
- **Cyan Highlights**: `#38BDF8` (Status & Typing indicators)
- **Outgoing Chat Bubble**: `#1E3A8A` to `#1D4ED8` (Gradient dark blue bubble)
- **Incoming Chat Bubble**: `#121827` with `#202B42` border

---

## ✨ Features

- 🔐 **User Authentication**: JWT-based signin and signup with Cloudinary profile avatar upload.
- 💬 **Real-time Messaging**: Socket.io instant message delivery & auto-scrolling timeline.
- ⚡ **Typing Indicators**: Real-time typing status with animated debounced indicators.
- 👥 **Group Chat Management**: Create groups, rename groups, add members, and remove members with admin controls.
- 🎤 **Voice Notes & Media Attachments**: Send audio messages and image attachments with full-screen lightbox viewer.
- 📞 **Voice & Video Calling UI**: Simulated calling screen overlay with timer and controls.
- 🔔 **Audio Notifications**: Web Audio API sound pop on receiving messages.
- 📱 **Fully Responsive**: WhatsApp Web style 3-column desktop layout with mobile-responsive view drawers.

---

## 📂 Project Structure

```
chime/
├── backend/                # Express & Socket.io server
│   ├── config/             # DB & Cloudinary configuration
│   ├── controllers/        # Auth, Chat, Message, User controllers
│   ├── middleware/         # Auth JWT middleware & upload setup
│   ├── models/             # Mongoose schemas (User, Chat, Message)
│   ├── routers/            # Express routes (/api/auth, /api/user, /api/chat, /api/message)
│   └── index.js            # Server entry point & Socket.io handlers
└── frontend/               # Vite React single page application
    ├── public/             # Assets & Chime logo SVG
    └── src/
        ├── api/            # Axios API service instances
        ├── components/     # NavRail, ChatList, MessageBubble, MessageInput, Modals
        ├── context/        # AuthContext, ChatContext, SocketContext
        ├── index.css       # Tailwind directives & 100xDevs theme rules
        ├── App.jsx         # Main 3-column layout frame
        └── main.jsx        # App mounting entry point
```

---

## 🌐 Deployed Backend Base URL

The application points to the deployed backend server:
```
https://chime-gjoi.onrender.com
```

---

## 🚀 Getting Started

### 1. Clone the repository
```bash
git clone <repository-url>
cd chime
```

### 2. Run Backend (Local fallback)
```bash
cd backend
npm install
npm run dev
```

### 3. Run Frontend
```bash
cd frontend
npm install
npm run dev
```

Access the frontend app at `http://localhost:5173`.

---

## 📜 License

This project is licensed under the **MIT License**.