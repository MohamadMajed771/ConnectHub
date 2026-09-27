# ConnectHub

ConnectHub is a full-stack, real-time social messaging application. It enables people to create accounts, find other users, manage friend requests, start private conversations, and exchange messages instantly.

## Features

- Secure registration and login with JWT authentication
- Password hashing with bcrypt
- User discovery by name or email
- Friend requests: send, accept, decline, and remove
- Private conversations available only between accepted friends
- Real-time chat powered by Socket.IO
- Live online and offline presence
- Last-active labels such as `Active 10m ago`
- Message delivery and read status: `Sent now`, `Sent 10m ago`, and `Seen`
- Responsive React interface for desktop and mobile

## Tech Stack

| Area | Technology |
| --- | --- |
| Frontend | React, Vite, React Router, Axios, Socket.IO Client |
| Backend | Node.js, Express, Socket.IO |
| Database | MySQL |
| Authentication | JSON Web Tokens and bcrypt |

## Project Structure

```text
ConnectHub/
├── backend/
│   ├── database/schema.sql      # MySQL database schema
│   ├── src/
│   │   ├── controllers/         # HTTP request handlers
│   │   ├── middleware/          # JWT authentication middleware
│   │   ├── routes/              # API routes
│   │   ├── services/            # Database and business logic
│   │   └── sockets/             # Real-time chat and presence logic
│   ├── .env.example
│   └── server.js
└── frontend/
    └── src/
        ├── api/                 # Axios API client
        ├── pages/               # Login, register, dashboard, and chat pages
        └── socket/              # Socket.IO client connection
```

## Getting Started

### Prerequisites

- Node.js 18 or newer
- MySQL 8 or newer
- npm

### 1. Create the database

Open MySQL Workbench and run the contents of:

```text
backend/database/schema.sql
```

This creates the `connecthub_db` database and all required tables.

### 2. Configure the backend

Open the `backend` folder and create a `.env` file based on `.env.example`.

```env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=connecthub_db
JWT_SECRET=replace_with_a_long_random_secret
```

Never commit `.env` to GitHub. It contains private database and authentication settings.

### 3. Start the backend

```bash
cd backend
npm install
npm run dev
```

The API starts at `http://localhost:5000`.

### 4. Start the frontend

Open a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open the URL shown by Vite, usually:

```text
http://localhost:5173
```

## Main API Areas

| Area | Base route | Purpose |
| --- | --- | --- |
| Authentication | `/api/auth` | Register, log in, and retrieve the current user |
| Users | `/api/users` | Search users and view profiles |
| Friends | `/api/friends` | Manage friend requests and friendships |
| Conversations | `/api/conversations` | Create and list private conversations |
| Messages | `/api/messages` | Retrieve and send messages |

## Real-Time Events

Socket.IO handles real-time application behavior.

- `user-online` and `user-offline` update live presence.
- `presence-sync` provides the current online-user snapshot after connection.
- `join-conversation` joins a private chat room.
- `send-message` sends and saves a message.
- `receive-message` delivers a message instantly to participants.
- `mark-messages-read` and `messages-read` provide read receipts.

## Usage Flow

1. Create two accounts.
2. Search for the other user.
3. Send and accept a friend request.
4. Select **Message** to create or open a private conversation.
5. Open the conversation in both accounts to test live messages, presence, and read status.

## Security Notes

- Passwords are hashed with bcrypt before storage.
- Protected API routes require a JWT bearer token.
- Socket connections require a valid JWT token.
- The repository excludes `.env`, `node_modules`, and build output.

## Future Improvements

- Profile editing and image uploads
- Typing indicators in the chat interface
- Message reactions, deletion, and editing
- Notifications for new messages and friend requests
- Group conversations
- Automated API and frontend tests
- Deployment configuration for production

## License

This project is intended for learning and portfolio use. Add a license before using it in another context.
