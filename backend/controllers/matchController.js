const MatchHistory = require('../models/MatchHistory');
const BallByBall = require('../models/BallByBall');
const Player = require('../models/Player');
const Team = require('../models/Team');

exports.getMatches = async (req, res) => {
  try {
    const matches = await MatchHistory.find({ gullyId: req.gullyId })
      .populate('teamA teamB tossWinner winner')
      .sort({ matchDate: -1 });
    res.json(matches);
  } catch (err) {
    res.status(500).send('Server error');
  }
};

exports.startMatch = async (req, res) => {
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

    const matchObj = {
      gullyId: req.gullyId,
      teamA: teamAId,
      teamB: teamBId,
      frontendData: cfg.matchData
    };

    if (cfg.tossWinnerIndex !== null && cfg.tossWinnerIndex !== undefined) {
      matchObj.tossWinner = cfg.tossWinnerIndex === 0 ? teamAId : teamBId;
    }
    if (cfg.tossChoice) {
      matchObj.electedTo = cfg.tossChoice;
    }

    const match = new MatchHistory(matchObj);
    
    await match.save();
    res.json({ matchId: match._id });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
};

exports.addBall = async (req, res) => {
  try {
    const matchId = req.params.id;
    const ball = new BallByBall({ matchId, ...req.body });
    await ball.save();
    res.json(ball);
  } catch (err) {
    res.status(500).send('Server error');
  }
};

exports.updateMatch = async (req, res) => {
  try {
    const matchId = req.params.id;
    const updateData = req.body;
    // updateData can contain status, frontendData, etc.
    const match = await MatchHistory.findByIdAndUpdate(matchId, updateData, { new: true });
    res.json(match);
  } catch (err) {
    res.status(500).send('Server error');
  }
};

exports.deleteMatch = async (req, res) => {
  try {
    const matchId = req.params.id;
    await MatchHistory.findByIdAndDelete(matchId);
    await BallByBall.deleteMany({ matchId });
    res.json({ success: true });
  } catch (err) {
    res.status(500).send('Server error');
  }
};
