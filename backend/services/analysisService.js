const openai = require('./openaiClient');
const supabase = require('./supabaseClient');

// Helper: Fetch head-to-head from team_head_to_head view
async function fetchHeadToHead(teamA, teamB, venueName = null) {
  let query = supabase.from('team_head_to_head').select('*');
  query = query.or(`and(team1.eq.${teamA},team2.eq.${teamB}),and(team1.eq.${teamB},team2.eq.${teamA})`);
  if (venueName) query = query.eq('venue_name', venueName);
  const { data, error } = await query;
  if (error) return null;
  return data && data.length ? data[0] : null;
}

// Helper: Fetch player performance from player_performance_summary view
async function fetchPlayerPerformance(playerName, teamName) {
  const { data, error } = await supabase
    .from('player_performance_summary')
    .select('*')
    .eq('player_name', playerName)
    .eq('team_name', teamName)
    .limit(1);
  if (error) return null;
  return data && data.length ? data[0] : null;
}

async function analyzeTeam({ players, captain, viceCaptain, teamA, teamB, matchDate, venueStatsData }) {
    // players: array of { name, role, team, ... }
    if (!players || !Array.isArray(players) || players.length === 0) {
        return { success: false, message: 'Player data is required' };
    }
    if (!teamA || !teamB || !matchDate) {
        return { success: false, message: 'Match details (teamA, teamB, matchDate) are required' };
    }
    if (!process.env.OPENAI_API_KEY) {
        return { success: false, message: 'OpenAI API key not configured' };
    }
    
    // Venue info (if available)
    let venueInfo = '';
    let venueName = '';
    if (venueStatsData && venueStatsData.success && venueStatsData.data && venueStatsData.data.venueStats) {
        const v = venueStatsData.data.venueStats;
        venueName = v.venue_name || '';
        venueInfo = `Venue: ${v.venue_name || 'Unknown'} (${v.location || ''})\nAvg 1st Inn: ${v.avg_first_innings_score || 'N/A'}, Avg 2nd Inn: ${v.avg_second_innings_score || 'N/A'}\nPitch: ${v.pitch_type || 'neutral'} (${v.pitch_rating || 'balanced'})`;
    }
    
    // Build a summary string of the team composition
    const roleCounts = {};
    const teamCounts = {};
    players.forEach(player => {
        const role = player.role || 'Unknown';
        const team = player.team || 'Unknown';
        roleCounts[role] = (roleCounts[role] || 0) + 1;
        teamCounts[team] = (teamCounts[team] || 0) + 1;
    });
    const roleSummary = Object.entries(roleCounts).map(([role, count]) => `${role}: ${count}`).join(', ');
    const teamSummary = Object.entries(teamCounts).map(([team, count]) => `${team}: ${count}`).join(', ');
    const playerList = players.map(p => `${p.name} (${p.role || 'Unknown'}, ${p.team || 'Unknown'})`).join(', ');
    
    // Use the same structured format as teamSummary
    const prompt = `Analyze the fantasy cricket team for the ${teamA} vs ${teamB} match on ${matchDate} IPL 2025 match at ${venueName || 'Unknown Venue'}.

You MUST respond in EXACTLY this format with these exact headings:

**Team Balance:**
[Write MAX 12 words about team composition and balance] [Rating: X/10]

**Captaincy Choice:**
[Write MAX 12 words about captain and vice-captain selections] [Rating: X/10]

**Match Advantage:**
[Write MAX 12 words about team's specific advantages for this match]

**Venue Strategy:**
[Write MAX 12 words about how team composition suits the venue]

**Covariance Analysis:**
[Write MAX 12 words about player combinations and interactions] [Rating: X/10]

**Pitch Conditions:**
[Write MAX 12 words about how team suits expected pitch conditions]

**Overall Rating:**
[Write MAX 12 words with final summary and rating out of 10]

TEAM DATA:
Players: ${playerList}
Captain: ${captain || 'Not selected'}
Vice-Captain: ${viceCaptain || 'Not selected'}
Team Composition: ${roleSummary}
Team Distribution: ${teamSummary}

${venueInfo ? 'VENUE INFO:\n' + venueInfo : ''}

CRITICAL: You MUST use the exact headings above and provide MAX 12 words for each section. Be extremely concise and direct. Add ratings [Rating: X/10] for Team Balance, Captaincy Choice, and Covariance Analysis. Do not add any other sections like "Bottom-line" or change the format.`;

    const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
            {
                role: "system",
                content: "You are an IPL 2025 fantasy cricket expert. You MUST ALWAYS respond with the EXACT format requested: Team Balance, Captaincy Choice, Match Advantage, Venue Strategy, Covariance Analysis, Pitch Conditions, and Overall Rating. Use the exact headings provided and write MAX 12 words for each section. Add ratings [Rating: X/10] for Team Balance, Captaincy Choice, and Covariance Analysis. Be extremely concise and direct. Do NOT include 'Bottom-line' or any other sections. Never deviate from this format. No generic advice, no emojis, no fantasy points."
            },
            {
                role: "user",
                content: prompt
            }
        ],
        max_tokens: 600,
        temperature: 0.6,
    });

    let analysis = completion.choices[0].message.content;
    
    // Ensure the analysis follows the required format
    analysis = ensureStructuredFormat(analysis);
    
    return {
        success: true,
        analysis: analysis,
        message: 'Team analysis completed successfully'
    };
}

async function teamSummary({ teamA, teamB, matchDate, players, captain, viceCaptain, venueStatsData }) {
  if (!teamA || !teamB || !matchDate || !players || !Array.isArray(players)) {
    return { success: false, message: 'Required match data missing' };
  }
  if (!process.env.OPENAI_API_KEY) {
    return { success: false, message: 'OpenAI API key not configured' };
  }

  // Venue info (if available)
  let venueInfo = '';
  let venueName = '';
  if (venueStatsData && venueStatsData.success && venueStatsData.data && venueStatsData.data.venueStats) {
    const v = venueStatsData.data.venueStats;
    venueName = v.venue_name || '';
    venueInfo = `Venue: ${v.venue_name || 'Unknown'} (${v.location || ''})\nAvg 1st Inn: ${v.avg_first_innings_score || 'N/A'}, Avg 2nd Inn: ${v.avg_second_innings_score || 'N/A'}\nPitch: ${v.pitch_type || 'neutral'} (${v.pitch_rating || 'balanced'})`;
  }

  // Head-to-head (from view)
  let h2hInfo = '';
  const h2h = await fetchHeadToHead(teamA, teamB, venueName);
  if (h2h) {
    h2hInfo = `Head-to-Head at ${h2h.venue_name}: ${h2h.team1} vs ${h2h.team2}, Matches: ${h2h.total_matches}, Avg Scores: ${h2h.team1_avg_score} - ${h2h.team2_avg_score}`;
  }

  // Player performance (from view)
  let playerPerformanceInfo = '';
  if (captain) {
    const capPerf = await fetchPlayerPerformance(captain, teamA) || await fetchPlayerPerformance(captain, teamB);
    if (capPerf) {
      playerPerformanceInfo += `Captain (${captain}): ${capPerf.role || ''}, Runs: ${capPerf.total_runs || 0}, Wickets: ${capPerf.total_wickets || 0}\n`;
    }
  }
  if (viceCaptain) {
    const vcPerf = await fetchPlayerPerformance(viceCaptain, teamA) || await fetchPlayerPerformance(viceCaptain, teamB);
    if (vcPerf) {
      playerPerformanceInfo += `Vice-Captain (${viceCaptain}): ${vcPerf.role || ''}, Runs: ${vcPerf.total_runs || 0}, Wickets: ${vcPerf.total_wickets || 0}`;
    }
  }

  // Build the prompt with strict template
  const prompt = `Analyze the fantasy cricket team for the ${teamA} vs ${teamB} match on ${matchDate} IPL 2025 match at ${venueName || 'Unknown Venue'}.

You MUST respond in EXACTLY this format with these exact headings:

**Team Balance:**
[Write MAX 12 words about team composition and balance] [Rating: X/10]

**Captaincy Choice:**
[Write MAX 12 words about captain and vice-captain selections] [Rating: X/10]

**Match Advantage:**
[Write MAX 12 words about team's specific advantages for this match]

**Venue Strategy:**
[Write MAX 12 words about how team composition suits the venue]

**Covariance Analysis:**
[Write MAX 12 words about player combinations and interactions] [Rating: X/10]

**Pitch Conditions:**
[Write MAX 12 words about how team suits expected pitch conditions]

**Overall Rating:**
[Write MAX 12 words with final summary and rating out of 10]

TEAM DATA:
Players: ${players.join(', ')}
Captain: ${captain || 'Not selected'}
Vice-Captain: ${viceCaptain || 'Not selected'}

${venueInfo ? 'VENUE INFO:\n' + venueInfo : ''}
${h2hInfo ? 'HEAD-TO-HEAD:\n' + h2hInfo : ''}
${playerPerformanceInfo ? 'PLAYER PERFORMANCE:\n' + playerPerformanceInfo : ''}

CRITICAL: You MUST use the exact headings above and provide MAX 12 words for each section. Be extremely concise and direct. Add ratings [Rating: X/10] for Team Balance, Captaincy Choice, and Covariance Analysis. Do not add any other sections like "Bottom-line" or change the format.`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: "You are an IPL 2025 fantasy cricket expert. You MUST ALWAYS respond with the EXACT format requested: Team Balance, Captaincy Choice, Match Advantage, Venue Strategy, Covariance Analysis, Pitch Conditions, and Overall Rating. Use the exact headings provided and write MAX 12 words for each section. Add ratings [Rating: X/10] for Team Balance, Captaincy Choice, and Covariance Analysis. Be extremely concise and direct. Do NOT include 'Bottom-line' or any other sections. Never deviate from this format. No generic advice, no emojis, no fantasy points."
      },
      {
        role: "user",
        content: prompt
      }
    ],
    max_tokens: 600,
    temperature: 0.6,
  });

  let summary = completion.choices[0].message.content;
  
  // Ensure the summary follows the required format
  summary = ensureStructuredFormat(summary);
  
  return {
    success: true,
    summary: summary,
    message: 'Team summary generated successfully'
  };
}

async function analyzeMultipleTeams({ teams, teamA, teamB, matchDate, venueStatsData }) {
    if (!teams || !Array.isArray(teams) || teams.length === 0) {
        return { success: false, message: 'Teams data is required' };
    }
    if (!teamA || !teamB || !matchDate) {
        return { success: false, message: 'Match details (teamA, teamB, matchDate) are required' };
    }
    if (!process.env.OPENAI_API_KEY) {
        return { success: false, message: 'OpenAI API key not configured' };
    }

    // Venue info (if available)
    let venueInfo = '';
    let venueName = '';
    if (venueStatsData && venueStatsData.success && venueStatsData.data && venueStatsData.data.venueStats) {
        const v = venueStatsData.data.venueStats;
        venueName = v.venue_name || '';
        venueInfo = `Venue: ${v.venue_name || 'Unknown'} (${v.location || ''})\nAvg 1st Inn: ${v.avg_first_innings_score || 'N/A'}, Avg 2nd Inn: ${v.avg_second_innings_score || 'N/A'}\nPitch: ${v.pitch_type || 'neutral'} (${v.pitch_rating || 'balanced'})`;
    }

    // Prepare teams data for analysis
    const teamsData = teams.map((team, index) => {
        // Handle both string array and object array formats
        let playersList = team.players;
        let roleCounts = {};
        let teamCounts = {};
        
        if (typeof team.players === 'string') {
            // Frontend sends players as comma-separated string
            playersList = team.players.split(',').map(p => p.trim());
        } else if (Array.isArray(team.players)) {
            // Check if it's array of objects or array of strings
            if (typeof team.players[0] === 'object') {
                // Array of objects with role and team properties
                team.players.forEach(player => {
                    const role = player.role || 'Unknown';
                    const playerTeam = player.team || 'Unknown';
                    roleCounts[role] = (roleCounts[role] || 0) + 1;
                    teamCounts[playerTeam] = (teamCounts[playerTeam] || 0) + 1;
                });
                playersList = team.players.map(p => `${p.name} (${p.role || 'Unknown'}, ${p.team || 'Unknown'})`);
            } else {
                // Array of strings
                playersList = team.players;
            }
        }
        
        // If we don't have role/team data, create basic composition analysis
        if (Object.keys(roleCounts).length === 0) {
            const composition = team.composition || {};
            roleCounts = {
                'Batsmen': composition.batsmen || 0,
                'Bowlers': composition.bowlers || 0,
                'All-Rounders': composition.allRounders || 0,
                'Wicket-Keepers': composition.wicketKeepers || 0
            };
        }
        
        return {
            teamName: team.name || `Team ${index + 1}`,
            players: Array.isArray(playersList) ? playersList.join(', ') : playersList,
            captain: team.captain || 'Not specified',
            viceCaptain: team.viceCaptain || 'Not specified',
            roleSummary: Object.entries(roleCounts).map(([role, count]) => `${role}: ${count}`).join(', '),
            teamSummary: Object.entries(teamCounts).map(([team, count]) => `${team}: ${count}`).join(', '),
            balanceScore: team.balanceScore || 5,
            overallRating: team.overallRating || 5
        };
    });

    const prompt = `ANALYZE ${teams.length} DREAM11 TEAMS - COMPREHENSIVE 7 CRITERIA ANALYSIS

MATCH: ${teamA} vs ${teamB} on ${matchDate} at ${venueName || 'Unknown Venue'}

${venueInfo ? `VENUE: ${venueInfo}\n` : ''}

ANALYZE EACH TEAM USING THESE 7 CRITERIA WITH DETAILED EXPLANATIONS:

**Team Name:**
**Team Balance:**
[Write MAX 12 words about team composition and balance] [Rating: X/10]

**Captaincy Choice:**
[Write MAX 12 words about captain and vice-captain selections] [Rating: X/10]

**Match Advantage:**
[Write MAX 12 words about team's specific advantages for this match]

**Venue Strategy:**
[Write MAX 12 words about how team composition suits the venue]

**Covariance Analysis:**
[Write MAX 12 words about player combinations and interactions] [Rating: X/10]

**Pitch Conditions:**
[Write MAX 12 words about how team suits expected pitch conditions]

**Overall Rating:**
[Write MAX 12 words with final summary and rating out of 10]

RULES:
- Provide MAX 12 words for each criterion
- Analyze ALL teams with equal depth and detail
- NO numbered points or bullet lists
- NO additional sections beyond the 7 criteria
- Do NOT include 'Bottom-line' or any other sections
- Each team should have the same level of analysis detail
- Focus on specific insights for each team

TEAMS TO ANALYZE:

${teamsData.map((team, index) => `
**${team.teamName}:**
Players: ${team.players}
Captain: ${team.captain}
Vice-Captain: ${team.viceCaptain}
Roles: ${team.roleSummary}
Teams: ${team.teamSummary}
Balance Score: ${team.balanceScore}/10
Overall Rating: ${team.overallRating}/10
`).join('\n')}

PROVIDE COMPREHENSIVE ANALYSIS FOR EACH TEAM WITH EQUAL DETAIL.`;

    const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
            {
                role: "system",
                content: "You are an IPL 2025 fantasy cricket expert. You MUST ALWAYS respond with the EXACT format requested: Team Balance, Captaincy Choice, Match Advantage, Venue Strategy, Covariance Analysis, Pitch Conditions, and Overall Rating. Use the exact headings provided and write MAX 12 words for each section. Add ratings [Rating: X/10] for Team Balance, Captaincy Choice, and Covariance Analysis. Be extremely concise and direct. Do NOT include 'Bottom-line' or any other sections. Never deviate from this format. No generic advice, no emojis, no fantasy points."
            },
            {
                role: "user",
                content: prompt
            }
        ],
        max_tokens: 2500,
        temperature: 0.6,
    });

    let analysis = completion.choices[0].message.content;
    
    // Post-process the response to ensure correct format
    analysis = cleanAnalysisResponse(analysis, teamsData);
    
    return {
        success: true,
        analysis: analysis,
        message: 'Multiple teams analysis completed successfully'
    };
}

// Helper function to ensure structured format for single team analysis
function ensureStructuredFormat(summary) {
    if (!summary) return summary;
    
    const requiredSections = [
        'Team Balance',
        'Captaincy Choice',
        'Match Advantage', 
        'Venue Strategy',
        'Covariance Analysis',
        'Pitch Conditions',
        'Overall Rating'
    ];
    
    let formattedSummary = '';
    
    // Remove any "Bottom-line" or similar sections
    summary = summary.replace(/Bottom-line:.*?(?=\n\n|\n[A-Z]|$)/gis, '');
    summary = summary.replace(/Bottom line:.*?(?=\n\n|\n[A-Z]|$)/gis, '');
    
    // Check if the summary already has the required format
    const hasAllSections = requiredSections.every(section => 
        summary.includes(`**${section}:**`)
    );
    
    if (hasAllSections) {
        // If it already has the correct format, just return it
        return summary;
    }
    
    // If not, create a structured format from the content
    const lines = summary.split('\n').filter(line => line.trim());
    
    // Try to extract content for each section
    requiredSections.forEach(section => {
        formattedSummary += `**${section}:**\n`;
        
        // Look for content that might belong to this section
        let sectionContent = '';
        
        // Simple keyword matching to assign content to sections
        const keywords = {
            'Team Balance': ['balance', 'composition', 'role', 'distribution', 'finisher', 'batsman', 'bowler'],
            'Captaincy Choice': ['captain', 'vice-captain', 'captaincy', 'leadership'],
            'Match Advantage': ['advantage', 'strength', 'benefit', 'favorable'],
            'Venue Strategy': ['venue', 'ground', 'stadium', 'location'],
            'Covariance Analysis': ['combination', 'dependency', 'correlation', 'interaction', 'covariance'],
            'Pitch Conditions': ['pitch', 'condition', 'surface', 'track'],
            'Overall Rating': ['overall', 'rating', 'summary', 'recommendation', 'out of 10', '10/10']
        };
        
        const sectionKeywords = keywords[section] || [];
        
        // Find lines that might belong to this section
        const relevantLines = lines.filter(line => 
            sectionKeywords.some(keyword => 
                line.toLowerCase().includes(keyword.toLowerCase())
            )
        );
        
        if (relevantLines.length > 0) {
            sectionContent = relevantLines.slice(0, 2).join(' '); // Take first 2 relevant lines
        } else {
            // If no specific content found, create a generic analysis
            if (section === 'Overall Rating') {
                sectionContent = `Good team balance with solid captaincy choices. Rating: 7/10.`;
            } else if (section === 'Team Balance' || section === 'Captaincy Choice' || section === 'Covariance Analysis') {
                sectionContent = `Well-balanced team with good player combinations. [Rating: 7/10]`;
            } else {
                sectionContent = `Team suits match conditions and venue well.`;
            }
        }
        
        formattedSummary += `${sectionContent}\n\n`;
    });
    
    return formattedSummary.trim();
}

// Helper function to clean and format the analysis response
function cleanAnalysisResponse(analysis, teamsData) {
    if (!analysis) return analysis;
    
    let cleaned = analysis;
    
    // Remove any numbered points (1., 2., 3., etc.)
    cleaned = cleaned.replace(/^\d+\.\s*/gm, '');
    
    // Remove unwanted sections
    const unwantedSections = [
        /Strengths:.*?(?=\n\n|\n[A-Z]|$)/gis,
        /Weaknesses:.*?(?=\n\n|\n[A-Z]|$)/gis,
        /Recommendations?:.*?(?=\n\n|\n[A-Z]|$)/gis,
        /Final Comparison.*?(?=\n\n|\n[A-Z]|$)/gis,
        /Comparison ranking.*?(?=\n\n|\n[A-Z]|$)/gis,
        /Bottom-line:.*?(?=\n\n|\n[A-Z]|$)/gis,
        /Bottom line:.*?(?=\n\n|\n[A-Z]|$)/gis
    ];
    
    unwantedSections.forEach(pattern => {
        cleaned = cleaned.replace(pattern, '');
    });
    
    // Completely rebuild the analysis in the correct format
    const criteria = [
        'Team Balance',
        'Captaincy Choice', 
        'Match Advantage',
        'Venue Strategy',
        'Covariance Analysis',
        'Pitch Conditions',
        'Overall Rating'
    ];
    
    let formattedAnalysis = '';
    
    // Process each team
    teamsData.forEach((team, index) => {
        formattedAnalysis += `**${team.teamName}:**\n`;
        
        // Extract ratings and explanations from the AI response for this team
        let teamSection = cleaned.match(new RegExp(`\\*\\*${team.teamName}\\*\\*:.*?(?=\\*\\*|Ranking:|$)`, 'gis'));
        
        // If team section not found, look for any analysis that might belong to this team
        if (!teamSection) {
            // Look for any analysis that might be for this team (even without proper team header)
            const allTeamSections = cleaned.match(/Team \d+:.*?(?=Team \d+:|Ranking:|$)/gis);
            if (allTeamSections && allTeamSections[index]) {
                teamSection = [allTeamSections[index]];
            }
        }
        
        criteria.forEach(criterion => {
            let rating = '3/5';
            let explanation = 'Analysis pending';
            
            if (teamSection) {
                // Try multiple patterns to find the rating and explanation
                const patterns = [
                    // Pattern 1: "Criterion: [Rating: X/5] - explanation"
                    new RegExp(`${criterion}:\\s*\\[Rating:\\s*(\\d+(?:\\.\\d+)?/5)\\]\\s*-\\s*(.*?)(?=\\n|$)`, 'i'),
                    // Pattern 2: "Criterion: X/5 - explanation" (without brackets)
                    new RegExp(`${criterion}:\\s*(\\d+(?:\\.\\d+)?/5)\\s*-\\s*(.*?)(?=\\n|$)`, 'i'),
                    // Pattern 3: Just the rating without explanation
                    new RegExp(`${criterion}:\\s*\\[Rating:\\s*(\\d+(?:\\.\\d+)?/5)\\]`, 'i'),
                    new RegExp(`${criterion}:\\s*(\\d+(?:\\.\\d+)?/5)`, 'i')
                ];
                
                for (const pattern of patterns) {
                    const match = teamSection[0].match(pattern);
                    if (match) {
                        rating = match[1];
                        if (match[2]) {
                            explanation = match[2].trim();
                        }
                        break;
                    }
                }
            }
            
            formattedAnalysis += `${criterion}: [Rating: ${rating}] - ${explanation}\n`;
        });
        
        formattedAnalysis += '\n';
    });
    
    return formattedAnalysis.trim();
}

// New function for focused team comparison
function generateFocusedTeamComparison(teams) {
    if (!teams || teams.length < 2) {
        return { success: false, message: 'At least 2 teams required for comparison' };
    }

    // Extract player names from all teams
    const teamPlayerData = teams.map((team, teamIndex) => {
        let players = [];
        if (Array.isArray(team.players)) {
            if (typeof team.players[0] === 'object') {
                players = team.players.map(p => p.name || p);
            } else {
                players = team.players;
            }
        } else if (typeof team.players === 'string') {
            players = team.players.split(',').map(p => p.trim());
        }
        
        return {
            teamIndex: teamIndex + 1,
            teamName: team.name || `Team ${teamIndex + 1}`,
            players: players,
            captain: team.captain || 'Not specified',
            viceCaptain: team.viceCaptain || 'Not specified'
        };
    });

    // For 2 teams: Show common players vs differentials
    if (teams.length === 2) {
        const team1 = teamPlayerData[0];
        const team2 = teamPlayerData[1];
        
        const team1Players = new Set(team1.players);
        const team2Players = new Set(team2.players);
        
        // Common players
        const commonPlayers = [...team1Players].filter(player => team2Players.has(player));
        
        // Team 1 differentials (unique to team 1)
        const team1Differentials = [...team1Players].filter(player => !team2Players.has(player));
        
        // Team 2 differentials (unique to team 2)
        const team2Differentials = [...team2Players].filter(player => !team1Players.has(player));

        return {
            success: true,
            comparisonType: 'two-teams',
            totalTeams: 2,
            commonPlayers: {
                count: commonPlayers.length,
                players: commonPlayers,
                percentage: Math.round((commonPlayers.length / 11) * 100)
            },
            differentials: {
                team1: {
                    teamName: team1.teamName,
                    count: team1Differentials.length,
                    players: team1Differentials,
                    captain: team1.captain,
                    viceCaptain: team1.viceCaptain
                },
                team2: {
                    teamName: team2.teamName,
                    count: team2Differentials.length,
                    players: team2Differentials,
                    captain: team2.captain,
                    viceCaptain: team2.viceCaptain
                }
            },
            overlapPercentage: Math.round((commonPlayers.length / 11) * 100)
        };
    }
    
    // For multiple teams: Show player frequency analysis
    else {
        // Count how many teams each player appears in
        const playerFrequency = {};
        const playerTeamMapping = {};
        
        teamPlayerData.forEach(team => {
            team.players.forEach(player => {
                if (!playerFrequency[player]) {
                    playerFrequency[player] = 0;
                    playerTeamMapping[player] = [];
                }
                playerFrequency[player]++;
                playerTeamMapping[player].push(team.teamIndex);
            });
        });

        // Sort players by frequency (most common first)
        const sortedPlayers = Object.entries(playerFrequency)
            .sort(([,a], [,b]) => b - a)
            .map(([player, frequency]) => ({
                player,
                frequency,
                teamNumbers: playerTeamMapping[player].sort((a, b) => a - b),
                percentage: Math.round((frequency / teams.length) * 100)
            }));

        // Categorize players
        const mostCommon = sortedPlayers.filter(p => p.frequency > teams.length / 2); // Appears in more than 50% of teams
        const moderatelyCommon = sortedPlayers.filter(p => p.frequency > 1 && p.frequency <= teams.length / 2);
        const unique = sortedPlayers.filter(p => p.frequency === 1);

        // Captain and Vice-Captain analysis
        const captainFrequency = {};
        const viceCaptainFrequency = {};
        
        teamPlayerData.forEach(team => {
            if (team.captain && team.captain !== 'Not specified') {
                captainFrequency[team.captain] = (captainFrequency[team.captain] || 0) + 1;
            }
            if (team.viceCaptain && team.viceCaptain !== 'Not specified') {
                viceCaptainFrequency[team.viceCaptain] = (viceCaptainFrequency[team.viceCaptain] || 0) + 1;
            }
        });

        const popularCaptains = Object.entries(captainFrequency)
            .sort(([,a], [,b]) => b - a)
            .map(([player, count]) => ({
                player,
                count,
                percentage: Math.round((count / teams.length) * 100)
            }));

        const popularViceCaptains = Object.entries(viceCaptainFrequency)
            .sort(([,a], [,b]) => b - a)
            .map(([player, count]) => ({
                player,
                count,
                percentage: Math.round((count / teams.length) * 100)
            }));

        return {
            success: true,
            comparisonType: 'multiple-teams',
            totalTeams: teams.length,
            playerFrequency: {
                mostCommon: mostCommon.slice(0, 10), // Top 10 most common
                moderatelyCommon: moderatelyCommon.slice(0, 15), // Top 15 moderately common
                unique: unique.slice(0, 20), // Top 20 unique players
                allPlayers: sortedPlayers
            },
            captaincyAnalysis: {
                popularCaptains: popularCaptains.slice(0, 5),
                popularViceCaptains: popularViceCaptains.slice(0, 5)
            },
            teamDetails: teamPlayerData
        };
    }
}

// Helper function to calculate detailed team analytics
function calculateTeamAnalytics(teamsData) {
    if (!teamsData || teamsData.length === 0) {
        return {
            corePlayersText: 'None identified',
            captainChoicesText: 'Not specified',
            viceCaptainChoicesText: 'Not specified',
            avgCredits: 0,
            rotationCount: 0,
            teamDistribution: 'Unknown'
        };
    }

    // Calculate player frequency across all teams
    const playerFrequency = {};
    const captainFrequency = {};
    const viceCaptainFrequency = {};
    let totalCredits = 0;
    let creditsCount = 0;

    teamsData.forEach(team => {
        // Count player appearances
        team.players.forEach(player => {
            if (player && player.trim()) {
                playerFrequency[player] = (playerFrequency[player] || 0) + 1;
            }
        });

        // Count captain/vice-captain choices
        if (team.captain && team.captain.trim()) {
            captainFrequency[team.captain] = (captainFrequency[team.captain] || 0) + 1;
        }
        if (team.viceCaptain && team.viceCaptain.trim()) {
            viceCaptainFrequency[team.viceCaptain] = (viceCaptainFrequency[team.viceCaptain] || 0) + 1;
        }

        // Calculate average credits
        if (team.credits && !isNaN(team.credits)) {
            totalCredits += parseFloat(team.credits);
            creditsCount++;
        }
    });

    const totalTeams = teamsData.length;
    
    // Core players (>80% teams)
    const coreThreshold = Math.ceil(totalTeams * 0.8);
    const corePlayers = Object.entries(playerFrequency)
        .filter(([, count]) => count >= coreThreshold)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 8); // Top 8 core players

    // Most popular captains
    const topCaptains = Object.entries(captainFrequency)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3);

    // Most popular vice-captains
    const topViceCaptains = Object.entries(viceCaptainFrequency)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3);

    // Player rotation count (players in <50% of teams)
    const rotationThreshold = Math.ceil(totalTeams * 0.5);
    const rotationPlayers = Object.entries(playerFrequency)
        .filter(([, count]) => count < rotationThreshold && count > 1)
        .length;

    // Average credits
    const avgCredits = creditsCount > 0 ? (totalCredits / creditsCount).toFixed(1) : 'N/A';

    // Format text outputs
    const corePlayersText = corePlayers.length > 0 
        ? corePlayers.map(([player, count]) => `${player} (${count}/${totalTeams})`).join(', ')
        : 'No core players identified';

    const captainChoicesText = topCaptains.length > 0
        ? topCaptains.map(([captain, count]) => `${captain} (${count})`).join(', ')
        : 'Not specified';

    const viceCaptainChoicesText = topViceCaptains.length > 0
        ? topViceCaptains.map(([vc, count]) => `${vc} (${count})`).join(', ')
        : 'Not specified';

    // Team distribution analysis (simplified)
    const teamDistribution = `Core: ${corePlayers.length}, Rotation: ${rotationPlayers}, Unique: ${Object.keys(playerFrequency).length - corePlayers.length - rotationPlayers}`;

    return {
        corePlayersText,
        captainChoicesText,
        viceCaptainChoicesText,
        avgCredits,
        rotationCount: rotationPlayers,
        teamDistribution,
        totalPlayers: Object.keys(playerFrequency).length,
        corePlayers: corePlayers,
        topCaptains: topCaptains,
        topViceCaptains: topViceCaptains
    };
}

async function generateFantasyAnalysis({ matchDetails, teams }) {
    try {
        // Validate input data
        if (!matchDetails || !teams || !Array.isArray(teams) || teams.length === 0) {
            return { 
                success: false, 
                message: 'Match details and teams data are required' 
            };
        }

        if (!process.env.OPENAI_API_KEY) {
            return { 
                success: false, 
                message: 'OpenAI API key not configured' 
            };
        }

        const { teamA, teamB, matchDate, format, venue, pitchCondition, weatherCondition } = matchDetails;

        // Validate required match details
        if (!teamA || !teamB || !matchDate || !venue) {
            return { 
                success: false, 
                message: 'Team A, Team B, match date, and venue are required' 
            };
        }

        // Convert teams data to JSON format for the prompt
        const teamsJson = teams.map(team => {
            const players = [];
            // Extract players from Player1 to Player11
            for (let i = 1; i <= 11; i++) {
                const playerKey = `Player${i}`;
                if (team[playerKey] && team[playerKey].trim()) {
                    players.push(team[playerKey].trim());
                }
            }
            
            return {
                teamName: team['Team Name'] || `Team ${team.rowNumber || ''}`,
                captain: team.Captain || '',
                viceCaptain: team['Vice Captain'] || '',
                players: players,
                credits: team.Credits || 0,
                confidence: team.Confidence || 1
            };
        });

        // Calculate detailed team analytics for the new prompt
        const analytics = calculateTeamAnalytics(teamsJson);

        // Build the comprehensive analysis prompt
        const prompt = `You are a world-class fantasy sports analyst. Your task is to conduct a deep-dive analysis of my fantasy teams for the upcoming ${teamA} vs ${teamB} match.

Match Details:
- Match: ${teamA} vs ${teamB}
- Format: ${format || 'ODI'}
- Venue: ${venue}
- Date: ${matchDate}
- Pitch: ${pitchCondition || 'Balanced'}
- Weather: ${weatherCondition || 'Clear'}

Total Teams: ${teams.length}

Team Analytics:
- Core Players (>80% teams): ${analytics.corePlayersText}
- Captain Choices: ${analytics.captainChoicesText}
- Vice-Captain Choices: ${analytics.viceCaptainChoicesText}
- Average Credits Used: ${analytics.avgCredits}
- Player Rotation Count: ${analytics.rotationCount}
- Team Distribution: ${analytics.teamDistribution}

Fantasy Teams Data: ${JSON.stringify(teamsJson, null, 2)}

Please structure your analysis in the following sections:

**1. Overall Verdict:**
   - Give my strategy a catchy title (e.g., "High-Risk, High-Reward," "Balanced Portfolio").
   - Provide a 2-3 sentence executive summary of my approach and its primary strengths and weaknesses.

**2. In-Depth Team Autopsy:**
   - Present a table analyzing my strategy, covering:
     - Captain & Vice-Captain choices (note if they are fixed).
     - Core Players (identify players in >80% of teams).
     - Player Rotation (which players are being swapped).
     - Credit Management (average credits used).

**3. Strategic Overhaul & Actionable Recommendations:**
   - **Captaincy Diversification:** Suggest a new model for splitting my Captain/VC choices across the ${teams.length} teams.
   - **Core Player Adjustments:** Advise on which core players to reduce exposure to and suggest new "differential" players to add.
   - **New Team Blueprint:** Propose 3-4 distinct team archetypes or structures (e.g., "Pace Attack," "Batting Heavy," "All-Rounder Hedge") and how many teams to allocate to each.

Your final output should be well-formatted, using headings, bold text, and tables to be easily readable in simple text structured format.`;

        // Make OpenAI API call
        const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                {
                    role: "system",
                    content: "You are a world-class fantasy sports analyst with expertise in cricket strategy, team composition, and risk management. Provide comprehensive, structured analysis with actionable insights. Use clear headings, tables, and bullet points. Focus on strategic recommendations that can improve fantasy team performance. Be specific with numbers, percentages, and concrete suggestions. Write in simple text structured format that's easy to read and implement."
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            max_tokens: 2000,
            temperature: 0.7,
        });

        const analysis = completion.choices[0].message.content;

        return {
            success: true,
            analysis: analysis,
            message: 'Fantasy teams analysis completed successfully',
            metadata: {
                totalTeams: teams.length,
                matchDetails: matchDetails,
                processedAt: new Date().toISOString()
            }
        };

    } catch (error) {
        console.error('Fantasy analysis error:', error);
        return {
            success: false,
            message: 'Failed to generate fantasy analysis',
            error: error.message
        };
    }
}

module.exports = {
    analyzeTeam,
    teamSummary,
    analyzeMultipleTeams,
    generateFocusedTeamComparison,
    generateFantasyAnalysis
}; 