const express = require('express');
const router = express.Router();
const Team = require('../models/Team');
const auth = require('../middleware/authMiddleware');

router.get('/', auth, async (req, res) => {
  try {
    const teams = await Team.find({ gullyId: req.gullyId }).populate('players');
    res.json(teams);
  } catch (err) {
    res.status(500).send('Server error');
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { teamName, players } = req.body;
    const team = new Team({ gullyId: req.gullyId, teamName, players });
    await team.save();
    res.json(team);
  } catch (err) {
    res.status(500).send('Server error');
  }
});

module.exports = router;
