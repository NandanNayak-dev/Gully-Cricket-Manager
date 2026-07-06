const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const teamController = require('../controllers/teamController');

router.get('/', auth, teamController.getTeams);
router.post('/', auth, teamController.createTeam);

module.exports = router;
