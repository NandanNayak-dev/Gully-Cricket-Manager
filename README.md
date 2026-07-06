# Gully Cricket Manager

**Live Demo:** [https://gullycricket-management.netlify.app/](https://gullcricket.netlify.app/)

Gully Cricket Manager is a full-stack web application designed to help you organize, track, and manage your local cricket tournaments. Keep track of players, build teams, schedule matches, and maintain scores easily.

## 🌟 Key Features

- **Player Management**: Add, view, and manage cricket players and their stats.
- **Team Creation**: Group players into custom teams and manage rosters.
- **Match Tracking**: Schedule matches between teams, record scores, and track match outcomes.
- **Authentication**: Secure login and registration for managing your own tournaments.
- **Zero-Config Database**: The backend automatically falls back to an in-memory MongoDB instance for easy local development without requiring a separate MongoDB setup.

## 💻 Tech Stack

### Frontend

- **Framework**: React 19 with Vite
- **State Management**: Zustand
- **Styling**: Tailwind CSS 4
- **Utilities**: clsx, tailwind-merge

### Backend

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB (Mongoose) & `mongodb-memory-server` for local dev
- **Environment**: dotenv, cors

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- npm or yarn

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/NandanNayak-dev/Gully-Cricket-Manager.git
   cd Gully-Cricket-Manager
   ```

2. **Backend Setup**

   ```bash
   cd backend
   npm install
   ```

   _(Optional)_ Create a `.env` file in the `backend` directory to use a real MongoDB:

   ```env
   PORT=5000
   MONGO_URI=your_mongodb_connection_string
   ```

   _Start the backend server:_

   ```bash
   npm run dev
   ```

   _(If `MONGO_URI` is missing, the server will connect to an in-memory database automatically!)_

3. **Frontend Setup**
   ```bash
   cd ../frontend
   npm install
   ```
   _Start the frontend development server:_
   ```bash
   npm run dev
   ```
