# MeetFlow

A full-stack real-time video conferencing platform inspired by Google Meet and Zoom, built using the MERN Stack, Socket.IO, and WebRTC.

MeetFlow enables users to create, join, and schedule meetings, communicate through real-time chat, share screens, and collaborate seamlessly through peer-to-peer video conferencing.

---

## 🌐 Live Demo

🔗 Live Application: https://meetflow-49z7.onrender.com

---

## Folder Structure
```
MeetFlow/
├── .gitignore
├── README.md
├── backend/
│   ├── package-lock.json
│   ├── package.json
│   └── src/
│       ├── config/
│       │   ├── cloudinary.js
│       │   └── db.js
│       ├── controllers/
│       │   ├── auth.controller.js
│       │   └── meeting.controller.js
│       ├── lib/
│       │   ├── arcjet.js
│       │   ├── env.js
│       │   ├── generateMeetingCode.js
│       │   ├── mailer.js
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
    │   │   ├── MeetFlow Logo.png
    │   │   └── upcomming1.png
    │   ├── components/
    │   │   ├── Navbar.jsx
    │   │   ├── ProtectedRoute.jsx
    │   │   ├── Sidebar.jsx
    │   │   └── dashboard/
    │   │       ├── JoinMeetingModal.jsx
    │   │       ├── ScheduleMeetingModal.jsx
    │   │       └── ShareMeetingModal.jsx
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
    │   │   ├── ProfilePage.jsx
    │   │   ├── SignupPage.jsx
    │   │   ├── UpcomingPage.jsx
    │   │   └── VerifyEmailPage.jsx
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

---

## High-Level Architecture Overview : 

<img width="1265" height="737" alt="high-level-architecture-desgin" src="https://github.com/user-attachments/assets/bdeadf8b-d0dc-400f-a48f-17cfc1646bba" />

---

## Request / Data Flow : 
<img width="1432" height="700" alt="request-data-flow" src="https://github.com/user-attachments/assets/9bfe7868-3d12-41ac-a565-96abd608ec61" />

---

## Backend Architecture : 
<img width="1502" height="662" alt="backend_architecture" src="https://github.com/user-attachments/assets/8adea902-a2ee-4f43-bf28-66af7352fe02" />

---

## Frontend Architecture : 
<img width="1491" height="557" alt="frontend_architecture" src="https://github.com/user-attachments/assets/17ffdf3d-7566-4a6e-a67b-d1c58f838314" />

---

## WebRTC Signaling Flow (via Socket.IO) : 
<img width="935" height="722" alt="image" src="https://github.com/user-attachments/assets/b9cee1d9-f4d1-4510-bfe2-5ee12aaf8178" />

---

## Deployment Architecture : 
<img width="1092" height="666" alt="image" src="https://github.com/user-attachments/assets/d8630bfb-7339-4b53-b686-0cd95935999f" />

---

### Authentication Routes

All endpoints in this section are prefixed with `/api/auth`.

| Method | Endpoint | Middleware | Controller | Description |
| :--- | :--- | :--- | :--- | :--- |
| **POST** | `/login` | Arcjet | `login` | Authenticates a user and sets a JWT cookie. |
| **POST** | `/signup` | Arcjet | `signup` | Registers a new user and sets a JWT cookie. |
| **POST** | `/logout` | Arcjet | `logout` | Clears the user's JWT cookie. |
| **GET** | `/me` | Arcjet &rarr; `protectRoute` | `userProfile` | Retrieves the authenticated user's profile details. |

### Meeting Routes

All endpoints in this section are prefixed with `/api/meetings`.

| Method | Endpoint | Middleware | Controller | Description |
| :--- | :--- | :--- | :--- | :--- |
| **POST** | `/create` | `protectRoute` | `createInstantMeeting` | Starts an instant meeting. |
| **POST** | `/join` | `protectRoute` | `joinMeeting` | Joins a meeting using a unique meeting code. |
| **POST** | `/schedule` | `protectRoute` | `scheduleMeeting` | Schedules a meeting for a future date and time. |
| **GET** | `/upcoming` | `protectRoute` | `getUpcomingMeetings` | Lists all scheduled upcoming meetings. |
| **GET** | `/history` | `protectRoute` | `getHistoryMeetings` | Lists all past and ended meetings. |
| **PATCH** | `/:meetingId/end` | `protectRoute` | `endMeeting` | Ends an active meeting (restricted to the host only). |
| **GET** | `/personal-room` | `protectRoute` | `getPersonalRoom` | Retrieves details about the user's personal meeting room. |
| **POST** | `/personal-room/join` | `protectRoute` | `joinPersonalRoom` | Joins a personal meeting room. |

### Socket.IO Event Reference

The real-time events used for managing meeting rooms, chat messages, and WebRTC peer-to-step connections.

| Event | Direction | Payload | Purpose |
| :--- | :--- | :--- | :--- |
| `join-room` | Client &rarr; Server | `{ meetingCode, userId, fullName }` | Joins a meeting room. |
| `leave-room` | Client &rarr; Server | `{ meetingCode, userId }` | Leaves a meeting room. |
| `send-message` | Client &rarr; Server | `{ meetingCode, userId, fullName, message }` | Sends a chat message to the room. |
| `user-joined-alert` | Server &rarr; Client | `{ fullName }` | Notifies the room that a new user has entered. |
| `user-left-alert` | Server &rarr; Client | `{ fullName }` | Notifies the room that a user has departed. |
| `new-peer-joined` | Server &rarr; Client | `{ socketId, userId, fullName }` | Triggers a WebRTC offer to the newly joined peer. |
| `peer-left` | Server &rarr; Client | `{ socketId }` | Closes the WebRTC connection to a disconnected peer. |
| `participants-updated` | Server &rarr; Client | `[{ userId, fullName, socketId }]` | Sends a full roster update of active participants. |
| `receive-message` | Server &rarr; Client | `{ userId, fullName, message, timestamp }` | Broadcasts an incoming chat message to all room members. |
| `webrtc-offer` | Bidirectional | `{ targetSocketId/senderSocketId, offer }` | Relays the Session Description Protocol (SDP) offer. |
| `webrtc-answer` | Bidirectional | `{ targetSocketId/senderSocketId, answer }` | Relays the Session Description Protocol (SDP) answer. |
| `webrtc-ice-candidate` | Bidirectional | `{ targetSocketId/senderSocketId, candidate }` | Relays Interactive Connectivity Establishment (ICE) candidates. |

---


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
