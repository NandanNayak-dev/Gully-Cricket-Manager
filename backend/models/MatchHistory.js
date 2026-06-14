const mongoose = require('mongoose');

const InningsSchema = new mongoose.Schema({
  battingTeam: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
  },
  runs: {
    type: Number,
    default: 0
  },
  wickets: {
    type: Number,
    default: 0
  },
  overs: {
    type: Number,
    default: 0
  }
});

const MatchHistorySchema = new mongoose.Schema({
  gullyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'GullyInfo',
    required: true,
  },
  teamA: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    required: true
  },
  teamB: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    required: true
  },
  tossWinner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
  },
  electedTo: {
    type: String,
    enum: ['bat', 'bowl'],
  },
  innings1: InningsSchema,
  innings2: InningsSchema,
  winner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
  },
  matchDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['in-progress', 'completed'],
    default: 'in-progress'
  },
  frontendData: {
    type: Object
  }
});

module.exports = mongoose.model('MatchHistory', MatchHistorySchema);
