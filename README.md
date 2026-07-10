# 🏏 Gully Cricket Manager

**Live Demo:** [https://gully-cricket-manager-84jl.vercel.app/](https://gully-cricket-manager-84jl.vercel.app/)

Gully Cricket Manager is a full-stack web application designed to help you organize, track, and manage your local neighborhood ("Mohalla") cricket tournaments. Keep track of players, build teams, schedule matches, and maintain live ball-by-ball scores easily!

---

## 🌟 Key Features

- **🔐 Mohalla Authentication**: Secure signup and login to manage your specific neighborhood's cricket data.
- **🏃‍♂️ Player Management**: Add, view, and manage local cricket players and their statistics.
- **🛡️ Team Builder**: Draft players and create custom teams for your matches.
- **🏏 Live Match Tracking**: Start matches and track the score ball-by-ball. Includes intelligent calculations for overs, runs, and wickets.
- **📊 Stats & History**: View historical match results and player performance metrics.

---

## 🛠️ Technology Stack

**Frontend:**
- **React.js** (Vite) for a blazing fast user interface.
- **Tailwind CSS** for beautiful, responsive, and modern styling.
- **Zustand / React Context** for state management.

**Backend:**
- **Node.js & Express.js** for building a robust RESTful API.
- **MongoDB & Mongoose** for flexible NoSQL data storage.
- **JSON Web Tokens (JWT)** for secure, stateless authentication.

**Deployment:**
- Frontend hosted on **Vercel**
- Backend hosted on **Render**
- Database hosted on **MongoDB Atlas**

---

## 🚀 How to Run Locally

Want to run the project on your own machine? Follow these steps:

### 1. Clone the repository
```bash
git clone https://github.com/NandanNayak-dev/Gully-Cricket-Manager.git
cd Gully-Cricket-Manager
```

### 2. Setup the Backend
Open a terminal and navigate to the backend directory:
```bash
cd backend
npm install
```
Create a `.env` file in the `backend` folder and add the following variables:
```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
```
Start the backend server:
```bash
npm run dev
# The server will start on http://localhost:5000
```

### 3. Setup the Frontend
Open a new terminal and navigate to the frontend directory:
```bash
cd frontend
npm install
```
Create a `.env` file in the `frontend` folder (if it doesn't exist) and add:
```env
VITE_API_URL=http://localhost:5000/api
```
Start the frontend development server:
```bash
npm run dev
# The app will start on http://localhost:5173 (or similar)
```

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/NandanNayak-dev/Gully-Cricket-Manager/issues).

## 📝 License

This project is open source and available under the [MIT License](LICENSE).
