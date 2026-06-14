const express = require('express');
const router = express.Router();
const Player = require('../models/Player');
const auth = require('../middleware/authMiddleware');

router.get('/', auth, async (req, res) => {
  try {
    const players = await Player.find({ gullyId: req.gullyId });
    res.json(players);
  } catch (err) {
    res.status(500).send('Server error');
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { playerName, role } = req.body;
    const player = new Player({ gullyId: req.gullyId, playerName, role });
    await player.save();
    res.json(player);
  } catch (err) {
    res.status(500).send('Server error');
  }
});

module.exports = router;
