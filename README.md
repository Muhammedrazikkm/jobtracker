# Fullstack Authentication Project

This project contains a professional folder structure for a MERN stack application (MongoDB, Express, React, Node.js) with a complete authentication flow.

## Features Included
- **User Registration**: Save hashed passwords securely in MongoDB using `bcrypt`.
- **User Login**: Uses Email and Password, and returns a JWT token for session management.
- **Forgot Password**: Generates a secure reset token and sends an email via `nodemailer`.
- **Reset Password**: Allows users to set a new password using the token sent to their email.
- **Premium UI**: The frontend is built using React with a stunning dark-mode glassmorphism design.

## Folder Structure
```
job/
├── backend/                  # Node.js + Express Server
│   ├── .env                  # Environment Variables
│   ├── package.json
│   └── src/
│       ├── config/           # Database Connection
│       ├── controllers/      # Auth Logic (Register, Login, Forgot Pwd)
│       ├── models/           # Mongoose Models (User Schema with bcrypt)
│       ├── routes/           # Express Routes
│       ├── utils/            # Utilities (Email Sender)
│       └── server.js         # Entry Point
│
└── frontend/                 # React (Vite) Application
    ├── package.json
    └── src/
        ├── App.jsx           # Routing Setup
        ├── index.css         # Premium Vanilla CSS Styling
        ├── main.jsx          # React Entry Point
        └── pages/            # React Components
            ├── Login.jsx
            ├── Register.jsx
            ├── ForgotPassword.jsx
            └── ResetPassword.jsx
```

## How to Run

### 1. Backend
1. Open a terminal and navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Make sure MongoDB is running on your machine (`mongodb://127.0.0.1:27017`).
3. Update the `backend/.env` file with your actual Gmail and App Password to enable the Forgot Password email functionality.
4. Run the backend server:
   ```bash
   node src/server.js
   ```

### 2. Frontend
1. Open another terminal and navigate to the frontend folder:
   ```bash
   cd frontend
   ```
2. Start the development server:
   ```bash
   npm run dev
   ```
3. Open the provided `localhost` URL in your browser to see the beautiful authentication app!
