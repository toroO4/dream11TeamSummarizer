const express = require('express');
const router = express.Router();
const analysisController = require('../controllers/analysisController');

router.post('/analyze', analysisController.analyzeTeam);
router.post('/team-summary', analysisController.teamSummary);
router.post('/overall-team-summary', analysisController.overallTeamSummary);
router.post('/analyze-multiple', analysisController.analyzeMultipleTeams);
router.post('/compare-teams-focused', analysisController.compareTeamsFocused);
router.post('/fantasy-analysis', analysisController.fantasyAnalysis);

module.exports = router; 