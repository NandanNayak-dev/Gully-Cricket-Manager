const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const matchController = require('../controllers/matchController');

router.get('/', auth, matchController.getMatches);
router.post('/start', auth, matchController.startMatch);
router.post('/:id/ball', auth, matchController.addBall);
router.put('/:id', auth, matchController.updateMatch);
router.delete('/:id', auth, matchController.deleteMatch);

module.exports = router;
