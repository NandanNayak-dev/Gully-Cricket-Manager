const mongoose = require('mongoose');

const PlayerSchema = new mongoose.Schema({
  gullyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'GullyInfo',
    required: true,
  },
  playerName: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    default: 'Player'
  }
});

module.exports = mongoose.model('Player', PlayerSchema);
