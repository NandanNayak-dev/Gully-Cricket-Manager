const mongoose = require('mongoose');

const BallByBallSchema = new mongoose.Schema({
  matchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MatchHistory',
    required: true
  },
  over: {
    type: Number,
    required: true
  },
  ball: {
    type: Number,
    required: true
  },
  batsman: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Player',
  },
  bowler: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Player',
  },
  runs: {
    type: Number,
    default: 0
  },
  wicket: {
    type: Boolean,
    default: false
  },
  event: {
    type: String, // e.g. "0", "1", "W", "wd", "nb"
  }
});

module.exports = mongoose.model('BallByBall', BallByBallSchema);
