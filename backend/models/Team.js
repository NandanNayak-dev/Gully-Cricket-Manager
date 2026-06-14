const mongoose = require('mongoose');

const TeamSchema = new mongoose.Schema({
  gullyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'GullyInfo',
    required: true,
  },
  teamName: {
    type: String,
    required: true,
  },
  players: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Player'
  }]
});

module.exports = mongoose.model('Team', TeamSchema);
