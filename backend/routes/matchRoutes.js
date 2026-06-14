const express = require('express');
const router = express.Router();
const MatchHistory = require('../models/MatchHistory');
const BallByBall = require('../models/BallByBall');
const auth = require('../middleware/authMiddleware');

router.get('/', auth, async (req, res) => {
  try {
    const matches = await MatchHistory.find({ gullyId: req.gullyId })
      .populate('teamA teamB tossWinner winner')
      .sort({ matchDate: -1 });
    res.json(matches);
  } catch (err) {
    res.status(500).send('Server error');
  }
});

const Player = require('../models/Player');
const Team = require('../models/Team');

router.post('/start', auth, async (req, res) => {
  try {
    const cfg = req.body;
    
    // Helper to create team and players
    const createTeamWithPlayers = async (teamData) => {
      const playerIds = [];
      for (const p of teamData.players) {
        const player = new Player({ gullyId: req.gullyId, playerName: p.name });
        await player.save();
        playerIds.push(player._id);
      }
      const team = new Team({ gullyId: req.gullyId, teamName: teamData.name, players: playerIds });
      await team.save();
      return team._id;
    };

    const teamAId = await createTeamWithPlayers(cfg.teamA);
    const teamBId = await createTeamWithPlayers(cfg.teamB);

    const tossWinnerId = cfg.tossWinnerIndex === 0 ? teamAId : (cfg.tossWinnerIndex === 1 ? teamBId : null);

    const match = new MatchHistory({
      gullyId: req.gullyId,
      teamA: teamAId,
      teamB: teamBId,
      tossWinner: tossWinnerId,
      electedTo: cfg.tossChoice,
      frontendData: cfg.matchData // we'll pass the generated matchData from frontend
    });
    
    await match.save();
    res.json({ matchId: match._id });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

router.post('/:id/ball', auth, async (req, res) => {
  try {
    const matchId = req.params.id;
    const ball = new BallByBall({ matchId, ...req.body });
    await ball.save();
    res.json(ball);
  } catch (err) {
    res.status(500).send('Server error');
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const matchId = req.params.id;
    const updateData = req.body;
    // updateData can contain status, frontendData, etc.
    const match = await MatchHistory.findByIdAndUpdate(matchId, updateData, { new: true });
    res.json(match);
  } catch (err) {
    res.status(500).send('Server error');
  }
});

module.exports = router;
