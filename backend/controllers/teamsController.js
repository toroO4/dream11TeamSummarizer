const supabase = require('../services/supabaseClient');

exports.getTeams = async (req, res) => {
    try {
        // Hardcoded IPL teams
        const iplTeams = [
            'Chennai Super Kings',
            'Mumbai Indians',
            'Royal Challengers Bengaluru',
            'Kolkata Knight Riders',
            'Delhi Capitals',
            'Punjab Kings',
            'Rajasthan Royals',
            'Sunrisers Hyderabad',
            'Gujarat Titans',
            'Lucknow Super Giants'
        ];
        res.json({
            success: true,
            teams: iplTeams,
            message: 'IPL 2025 teams list'
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to get teams', error: error.message });
    }
};

exports.getTeamsSupabase = async (req, res) => {
    try {
        const { data: teams, error } = await supabase
            .from('teams')
            .select('team_id, team_name, short_name')
            .order('team_name', { ascending: true });
        if (error) throw error;
        res.json({
            success: true,
            message: 'Supabase is working!',
            teams: teams,
            count: teams.length,
            supabaseWorking: true
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Supabase connection failed',
            error: error.message,
            supabaseWorking: false
        });
    }
};

// Fetch eligible players for Add Player modal
exports.eligiblePlayers = async (req, res) => {
    try {
        const { teamA, teamB, matchDate } = req.body;
        console.log('ELIGIBLE PLAYERS: Request received:', { teamA, teamB, matchDate });
        
        if (!teamA || !teamB || !matchDate) {
            return res.status(400).json({ success: false, message: 'teamA, teamB, and matchDate are required' });
        }
        // Calculate date 2 years before matchDate
        const matchDateObj = new Date(matchDate);
        const twoYearsAgo = new Date(matchDateObj);
        twoYearsAgo.setFullYear(matchDateObj.getFullYear() - 2);
        const twoYearsAgoStr = twoYearsAgo.toISOString().split('T')[0];
        // Get team IDs
        const { data: teams, error: teamsError } = await supabase
            .from('teams')
            .select('team_id, team_name')
            .in('team_name', [teamA, teamB]);
        if (teamsError) throw teamsError;
        if (!teams || teams.length < 2) {
            return res.status(400).json({ success: false, message: 'One or both teams not found' });
        }
        const teamAId = teams.find(t => t.team_name === teamA)?.team_id;
        const teamBId = teams.find(t => t.team_name === teamB)?.team_id;
        if (!teamAId || !teamBId) {
            return res.status(400).json({ success: false, message: 'Team IDs not found' });
        }
        // Helper to get recent unique players for a team
        async function getRecentPlayers(teamId) {
            // Get recent matches for the team
            const { data: matches, error: matchError } = await supabase
                .from('matches')
                .select('match_id, match_date')
                .or(`team1_id.eq.${teamId},team2_id.eq.${teamId}`)
                .gte('match_date', twoYearsAgoStr)
                .lte('match_date', matchDate)
                .order('match_date', { ascending: false })
                .limit(20); // Get last 20 matches
            if (matchError || !matches || matches.length === 0) return [];
            const matchIds = matches.map(m => m.match_id);
            // Get players from those matches
            const { data: playerRows, error: playerError } = await supabase
                .from('player_match_stats')
                .select('player_id, team_id, players!inner(player_name)')
                .in('match_id', matchIds)
                .eq('team_id', teamId);
            if (playerError || !playerRows) return [];
            // Only unique players (by player_id for this team)
            const seen = new Set();
            const uniquePlayers = [];
            for (const row of playerRows) {
                if (!seen.has(row.player_id)) {
                    seen.add(row.player_id);
                    uniquePlayers.push({
                        player_id: row.player_id,
                        player_name: row.players.player_name,
                        team_id: row.team_id
                    });
                }
                if (uniquePlayers.length >= 15) break;
            }
            return uniquePlayers;
        }
        // Get recent players for both teams
        const [recentA, recentB] = await Promise.all([
            getRecentPlayers(teamAId),
            getRecentPlayers(teamBId)
        ]);
        // Fetch team names for mapping
        const teamIdToName = {};
        teams.forEach(t => { teamIdToName[t.team_id] = t.team_name; });
        // Merge and map to output format
        const merged = [...recentA, ...recentB].map(p => ({
            player_id: p.player_id,
            player_name: p.player_name,
            team_name: teamIdToName[p.team_id] || ''
        }));
        console.log('ELIGIBLE PLAYERS: Returning', merged.length, 'players');
        console.log('ELIGIBLE PLAYERS: Sample players:', merged.slice(0, 5).map(p => `${p.player_name} (${p.team_name})`));
        res.json({ success: true, players: merged });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch eligible players', error: error.message });
    }
}; 

exports.getRecentMatches = async (req, res) => {
    try {
        const { limit = 20 } = req.query;
        
        // Get recent matches with team and venue information
        const { data: matches, error: matchesError } = await supabase
            .from('matches')
            .select(`
                match_id,
                match_date,
                team1_id,
                team2_id,
                teams!team1_id(team_name, short_name),
                teams_team2:teams!team2_id(team_name, short_name),
                venues(venue_name, city)
            `)
            .order('match_date', { ascending: false })
            .limit(parseInt(limit));

        if (matchesError) throw matchesError;

        // Process matches to include team logos and format data
        const processedMatches = matches.map(match => {
            const team1 = match.teams;
            const team2 = match.teams_team2;
            
            return {
                match_id: match.match_id,
                match_date: match.match_date,
                team1: {
                    name: team1.team_name,
                    short_name: team1.short_name
                },
                team2: {
                    name: team2.team_name,
                    short_name: team2.short_name
                },
                venue: {
                    name: match.venues?.venue_name || 'TBD',
                    city: match.venues?.city || 'TBD'
                },
                is_upcoming: new Date(match.match_date) > new Date()
            };
        });

        res.json({
            success: true,
            data: processedMatches,
            count: processedMatches.length
        });

    } catch (error) {
        console.error('Get recent matches error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch recent matches',
            error: error.message
        });
    }
};

exports.getPlayerRoles = async (req, res) => {
    try {
        const { playerNames } = req.body;
        
        if (!playerNames || !Array.isArray(playerNames) || playerNames.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'playerNames array is required'
            });
        }

        // Fetch player roles from database
        const { data: players, error: playersError } = await supabase
            .from('players')
            .select('player_name, role')
            .in('player_name', playerNames);

        if (playersError) throw playersError;

        // Create a map of player names to roles
        const playerRoles = {};
        players.forEach(player => {
            playerRoles[player.player_name] = player.role || 'unknown';
        });

        // For players not found in database, mark as unknown
        playerNames.forEach(name => {
            if (!playerRoles[name]) {
                playerRoles[name] = 'unknown';
            }
        });

        res.json({
            success: true,
            data: playerRoles,
            message: `Found roles for ${players.length} out of ${playerNames.length} players`
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch player roles',
            error: error.message
        });
    }
};

 