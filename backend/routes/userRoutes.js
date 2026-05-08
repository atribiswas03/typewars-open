const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

router.get('/leaderboard', userController.getLeaderboard);
router.get('/stats/:username', userController.getUserStats);
router.post('/stats', userController.updateStats);
router.delete('/guest/:username', userController.deleteGuest);

module.exports = router;
