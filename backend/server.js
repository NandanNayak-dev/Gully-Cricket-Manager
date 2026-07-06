const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

if (process.env.MONGO_URI) {
  mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.log(err));
} else {
  const { MongoMemoryServer } = require('mongodb-memory-server');
  MongoMemoryServer.create().then((mongoServer) => {
    const uri = mongoServer.getUri();
    mongoose.connect(uri)
      .then(() => console.log('MongoDB Memory Server Connected'))
      .catch(err => console.log(err));
  });
}

// API Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/players', require('./routes/playerRoutes'));
app.use('/api/teams', require('./routes/teamRoutes'));
app.use('/api/matches', require('./routes/matchRoutes'));

// Serve static frontend in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/dist')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../frontend', 'dist', 'index.html'));
  });
}

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
