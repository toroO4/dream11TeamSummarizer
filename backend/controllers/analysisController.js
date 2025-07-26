const { analyzeTeam, teamSummary, analyzeMultipleTeams, generateFocusedTeamComparison, generateFantasyAnalysis, overallTeamSummary } = require('../services/analysisService');

exports.analyzeTeam = async (req, res) => {
    try {
        const result = await analyzeTeam(req.body);
        if (!result.success) {
            return res.status(400).json(result);
        }
        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to analyze team', error: error.message });
    }
};

exports.teamSummary = async (req, res) => {
    try {
        const result = await teamSummary(req.body);
        if (!result.success) {
            return res.status(400).json(result);
        }
        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to generate team summary', error: error.message });
    }
};

exports.analyzeMultipleTeams = async (req, res) => {
    try {
        const result = await analyzeMultipleTeams(req.body);
        if (!result.success) {
            return res.status(400).json(result);
        }
        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to analyze multiple teams', error: error.message });
    }
};

exports.compareTeamsFocused = async (req, res) => {
    try {
        const { teams } = req.body;
        const result = generateFocusedTeamComparison(teams);
        if (!result.success) {
            return res.status(400).json(result);
        }
        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to compare teams', error: error.message });
    }
};

exports.fantasyAnalysis = async (req, res) => {
    try {
        const result = await generateFantasyAnalysis(req.body);
        if (!result.success) {
            return res.status(400).json(result);
        }
        res.json(result);
    } catch (error) {
        console.error('Fantasy analysis error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to generate fantasy analysis', 
            error: error.message 
        });
    }
};

exports.overallTeamSummary = async (req, res) => {
    try {
        const result = await overallTeamSummary(req.body);
        if (!result.success) {
            return res.status(400).json(result);
        }
        res.json(result);
    } catch (error) {
        console.error('Overall team summary error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to generate overall team summary', 
            error: error.message 
        });
    }
}; 