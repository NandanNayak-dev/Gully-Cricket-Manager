const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const playerController = require('../controllers/playerController');

router.get('/', auth, playerController.getPlayers);
router.post('/', auth, playerController.createPlayer);

module.exports = router;
