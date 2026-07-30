# Chime 💬 — Real-time Chat Application

Chime is a modern, high-performance, real-time web chat application featuring a sleek **3-column messaging layout** powered by **Node.js**, **Express.js**, **MongoDB**, **Socket.io**, **React**, **Vite**, and **Tailwind CSS** with a polished dark slate color palette.

---

## 🎨 100xDevs Color Palette & Design System

| Purpose | Color | Hex |
|---|---|---|
| Primary Background | Deep obsidian dark | `#050811` |
| Sidebar & Surface Container | Dark slate container | `#0B0F19` |
| Cards & Chat Panels | Glassmorphism dark card | `#121827` |
| Primary Glowing Accent | Electric Royal Blue | `#3B82F6` → `#2563EB` |
| Cyan Highlights | Status & typing indicators | `#38BDF8` |
| Outgoing Chat Bubble | Gradient dark blue bubble | `#1E3A8A` → `#1D4ED8` |
| Incoming Chat Bubble | Neutral dark card with border | `#121827` (border `#202B42`) |

The theme leans on soft glows, subtle glassmorphism, and low-saturation slate tones to keep long chat sessions easy on the eyes while still feeling premium and "dev-tool" polished.

---

## ✨ Features

### 🔐 Authentication & Profile
- JWT-based signup and signin with secure HTTP-only token handling.
- Cloudinary-powered profile avatar upload with live preview before save.
- Persistent sessions via token refresh on app load.

### 💬 Real-time Messaging
- Instant message delivery over Socket.io — no polling, no refresh.
- Auto-scrolling message timeline that tracks new messages and unread position.
- Message delivery and read-receipt style status ticks.
- Timestamped messages grouped by day (Today, Yesterday, date headers).

### ⚡ Typing Indicators
- Real-time "typing…" status broadcast per chat via Socket.io rooms.
- Debounced emit logic so indicators don't spam the socket on every keystroke.
- Animated dot indicator styled with the cyan `#38BDF8` accent.

### 👥 Group Chat Management
- Create groups with a custom name, avatar, and initial member list.
- Rename groups and update the group avatar (admin only).
- Add or remove members with live-updated member lists across all connected clients.
- Admin controls: promote/demote admin status, leave group, delete group.
- System messages for group events (e.g. "Alice added Bob", "Group renamed").

### 🎤 Voice Notes & Media Attachments
- Record and send audio voice notes directly from the message composer.
- Send image attachments with drag-and-drop or file picker upload.
- Full-screen lightbox viewer for images with zoom and swipe-through navigation.
- Upload progress indicators for large media files.

### 🔔 Audio Notifications
- Web Audio API-based notification "pop" sound on receiving a new message.
- Notification sound is suppressed for the currently active/open chat.

### 📱 Fully Responsive Layout
- Desktop: 3-column layout (Nav rail → Chat list → Active chat).
- Mobile: Drawer-based navigation that collapses the 3 columns into a single stacked view.
- Touch-friendly tap targets and swipe gestures on mobile.

---

## 🧱 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React, Vite, Tailwind CSS |
| Backend | Node.js, Express.js |
| Realtime | Socket.io |
| Database | MongoDB (Mongoose ODM) |
| Auth | JSON Web Tokens (JWT) |
| Media Storage | Cloudinary |
| State Management | React Context API (Auth, Chat, Socket) |

---

## 📂 Project Structure

```
chime/
├── backend/                    # Express & Socket.io server
│   ├── config/                 # DB & Cloudinary configuration
│   │   ├── db.js               # MongoDB connection setup
│   │   └── cloudinary.js       # Cloudinary client config
│   ├── controllers/            # Auth, Chat, Message, User controllers
│   ├── middleware/              # Auth JWT middleware & upload (multer) setup
│   ├── models/                 # Mongoose schemas (User, Chat, Message)
│   ├── routers/                # Express routes
│   │   ├── auth.routes.js      # /api/auth
│   │   ├── user.routes.js      # /api/user
│   │   ├── chat.routes.js      # /api/chat
│   │   └── message.routes.js   # /api/message
│   └── index.js                 # Server entry point & Socket.io handlers
└── frontend/                    # Vite React single page application
    ├── public/                  # Assets & Chime logo SVG
    └── src/
        ├── api/                 # Axios API service instances
        ├── components/          # NavRail, ChatList, MessageBubble, MessageInput, Modals
        ├── context/              # AuthContext, ChatContext, SocketContext
        ├── index.css             # Tailwind directives & 100xDevs theme rules
        ├── App.jsx               # Main 3-column layout frame
        └── main.jsx              # App mounting entry point
```

---

## 🔌 Core API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/signup` | Register a new user account |
| `POST` | `/api/auth/signin` | Authenticate and receive a JWT |
| `GET` | `/api/user/profile` | Fetch the logged-in user's profile |
| `PUT` | `/api/user/profile` | Update profile info / avatar |
| `POST` | `/api/chat` | Create or fetch a 1:1 chat |
| `POST` | `/api/chat/group` | Create a new group chat |
| `PUT` | `/api/chat/group/rename` | Rename a group |
| `PUT` | `/api/chat/group/add` | Add a member to a group |
| `PUT` | `/api/chat/group/remove` | Remove a member from a group |
| `GET` | `/api/message/:chatId` | Fetch messages for a chat |
| `POST` | `/api/message` | Send a new message (text/media/voice note) |

---

## 🔊 Key Socket.io Events

| Event | Direction | Purpose |
|---|---|---|
| `setup` | Client → Server | Register the connected user's socket |
| `join chat` | Client → Server | Join a specific chat room |
| `typing` / `stop typing` | Client ↔ Server | Broadcast typing indicator state |
| `new message` | Client → Server → Room | Deliver a new message in real time |
| `group update` | Server → Room | Notify clients of group name/member changes |

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

### 2. Configure environment variables

Create a `.env` file inside `backend/`:
```env
PORT=5000
MONGO_URI=<your-mongodb-connection-string>
JWT_SECRET=<your-jwt-secret>
CLOUDINARY_CLOUD_NAME=<your-cloudinary-cloud-name>
CLOUDINARY_API_KEY=<your-cloudinary-api-key>
CLOUDINARY_API_SECRET=<your-cloudinary-api-secret>
```

Create a `.env` file inside `frontend/`:
```env
VITE_BACKEND_URL=http://localhost:5000
```

### 3. Run Backend (Local fallback)
```bash
cd backend
npm install
npm run dev
```
The backend server starts on `http://localhost:5000` and initializes the Socket.io server alongside the Express API.

### 4. Run Frontend
```bash
cd frontend
npm install
npm run dev
```
Access the frontend app at `http://localhost:5173`.

---

## 🗺️ Roadmap Ideas

- Message search within a chat
- Message reactions and replies/threads
- End-to-end encryption for direct messages
- Push notifications (browser & mobile)

---

## 📜 License

This project is licensed under the **MIT License**.
