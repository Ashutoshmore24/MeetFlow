# MeetFlow

A full-stack real-time video conferencing platform inspired by Google Meet and Zoom, built using the MERN Stack, Socket.IO, and WebRTC.

MeetFlow enables users to create, join, and schedule meetings, communicate through real-time chat, share screens, and collaborate seamlessly through peer-to-peer video conferencing.

---

## 🌐 Live Demo

🔗 Live Application: ```https://meetflow-49z7.onrender.com/```

---

## Folder Structure
```
MeetFlow/
├── .gitignore
├── backend/
│   ├── package-lock.json
│   ├── package.json
│   └── src/
│       ├── config/
│       │   └── db.js
│       ├── controllers/
│       │   ├── auth.controller.js
│       │   └── meeting.controller.js
│       ├── lib/
│       │   ├── arcjet.js
│       │   ├── env.js
│       │   ├── generateMeetingCode.js
│       │   └── utils.js
│       ├── middleware/
│       │   ├── arcjet.middleware.js
│       │   └── auth.middleware.js
│       ├── models/
│       │   ├── Meeting.js
│       │   └── User.js
│       ├── routes/
│       │   ├── auth.routes.js
│       │   └── meeting.routes.js
│       ├── server.js
│       └── socket/
│           ├── roomManager.js
│           └── socket.js
└── frontend/
    ├── .gitignore
    ├── README.md
    ├── eslint.config.js
    ├── index.html
    ├── package-lock.json
    ├── package.json
    ├── postcss.config.js
    ├── src/
    │   ├── App.jsx
    │   ├── assets/
    │   │   └── upcomming1.png
    │   ├── components/
    │   │   ├── Navbar.jsx
    │   │   ├── ProtectedRoute.jsx
    │   │   ├── Sidebar.jsx
    │   │   └── dashboard/
    │   │       ├── JoinMeetingModal.jsx
    │   │       └── ScheduleMeetingModal.jsx
    │   ├── index.css
    │   ├── lib/
    │   │   ├── axios.js
    │   │   └── socket.js
    │   ├── main.jsx
    │   ├── pages/
    │   │   ├── DashboardPage.jsx
    │   │   ├── HistoryPage.jsx
    │   │   ├── LoginPage.jsx
    │   │   ├── MeetingRoomPage.jsx
    │   │   ├── PersonalRoomPage.jsx
    │   │   ├── SignupPage.jsx
    │   │   └── UpcomingPage.jsx
    │   └── store/
    │       ├── useAuthStore.js
    │       └── useMeetingStore.js
    ├── tailwind.config.js
    └── vite.config.js

```

## ✨ Features

### 🔐 Authentication & Security

- JWT Authentication
- Secure HTTP-only Cookies
- Protected Routes
- Arcjet Bot Protection & Rate Limiting
- Password Hashing using bcrypt

### 📅 Meeting Management

- Create Instant Meetings
- Join Meetings via Meeting Code
- Schedule Future Meetings
- Upcoming Meetings Dashboard
- Meeting History Tracking
- Personal Meeting Rooms

### ⚡ Real-Time Collaboration

- Live Participant Updates
- Real-Time Chat
- Join/Leave Notifications
- Socket.IO Room Management

### 🎥 Video Conferencing

- Peer-to-Peer Video Calling
- Audio Calling
- Multi-Participant Support
- Camera Toggle
- Microphone Toggle
- Leave Meeting Controls

### 🖥️ Screen Sharing

- Share Entire Screen
- Share Application Window
- Real-Time Screen Streaming

---

## 🛠️ Tech Stack

### Frontend

- React.js
- Vite
- Tailwind CSS
- Zustand
- Axios
- React Router DOM
- Socket.IO Client

### Backend

- Node.js
- Express.js
- MongoDB
- Mongoose
- Arcjet
- Socket.IO

### Realtime & Communication

- WebRTC
- Socket.IO
- STUN Servers

### Deployment

- Render
- MongoDB Atlas
- GitHub

## ⚙️ Environment Variables

### Backend (.env)

```env
PORT=X000

MONGO_URI=your_mongodb_uri

JWT_SECRET=your_jwt_secret

ARCJET_KEY=your_arcjet_key

ARCJET_ENV=development

CLIENT_URL=http://localhost:5173
```

## 🚀 Getting Started

### Clone Repository

```bash
git clone https://github.com/yourusername/MeetFlow.git

cd MeetFlow
```

### Backend Setup

```bash
cd backend

npm install

npm run dev
```

### Frontend Setup

```bash
cd frontend

npm install

npm run dev
```

---

## ⭐ Support

If you found this project helpful, please consider giving it a star ⭐ on GitHub.
