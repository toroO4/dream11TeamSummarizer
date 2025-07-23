// Team Summary Page Handler
class TeamSummaryApp {
    constructor() {
        console.log('TeamSummaryApp constructor called');
        
        this.csvData = null;
        this.uploadedTeams = [];
        this.components = {};
        
        // Initialize components and event listeners
        this.initializeComponents();
        this.setupEventListeners();
        
        console.log('TeamSummaryApp initialized successfully');
    }

    initializeComponents() {
        // Initialize Toast notifications
        this.components.toast = new Toast();
        this.components.toast.initialize(
            'error-toast', 'error-message',
            'success-toast', 'success-message'
        );
    }

    setupEventListeners() {
        // Back to home button
        const backToHomeBtn = document.getElementById('back-to-home');
        if (backToHomeBtn) {
            backToHomeBtn.addEventListener('click', () => {
                window.location.href = 'index.html';
            });
        }

        // CSV upload area click
        const csvUploadArea = document.getElementById('csv-upload-area');
        const csvFileInput = document.getElementById('csv-file-input');
        
        if (csvUploadArea && csvFileInput) {
            csvUploadArea.addEventListener('click', () => csvFileInput.click());
            csvFileInput.addEventListener('change', (e) => this.handleCSVUpload(e));
        }

        // Download CSV template
        const downloadTemplateBtn = document.getElementById('download-csv-template');
        if (downloadTemplateBtn) {
            downloadTemplateBtn.addEventListener('click', () => this.downloadCSVTemplate());
        }

        // Form validation
        this.setupFormValidation();

        // Generate analysis button
        const generateAnalysisBtn = document.getElementById('generate-analysis-btn');
        if (generateAnalysisBtn) {
            generateAnalysisBtn.addEventListener('click', () => this.generateAnalysis());
        }
    }

    setupFormValidation() {
        // Form inputs for validation
        const inputs = [
            'team-a', 'team-b', 'match-date', 'venue', 
            'pitch-condition', 'weather-condition'
        ];

        inputs.forEach(inputId => {
            const input = document.getElementById(inputId);
            if (input) {
                input.addEventListener('input', () => this.validateForm());
                input.addEventListener('change', () => this.validateForm());
            }
        });
    }

    async handleCSVUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        // Validate file type
        if (!file.name.toLowerCase().endsWith('.csv')) {
            this.components.toast.showError('Please upload a CSV file');
            return;
        }

        // Validate file size (2MB limit)
        if (file.size > 2 * 1024 * 1024) {
            this.components.toast.showError('File size must be less than 2MB');
            return;
        }

        this.showCSVLoading(true);

        try {
            const csvText = await this.readFileAsText(file);
            await this.parseCSV(csvText);
            this.showCSVPreview();
            this.validateForm();
            this.components.toast.showSuccess(`Successfully uploaded ${this.uploadedTeams.length} teams`);
        } catch (error) {
            console.error('CSV upload error:', error);
            this.components.toast.showError('Failed to parse CSV file. Please check the format.');
        } finally {
            this.showCSVLoading(false);
        }
    }

    readFileAsText(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = e => resolve(e.target.result);
            reader.onerror = reject;
            reader.readAsText(file);
        });
    }

    parseCSV(csvText) {
        try {
            // Clean and split CSV text
            const lines = csvText.trim().split('\n').filter(line => line.trim());
            if (lines.length < 2) {
                throw new Error('CSV must have at least header and one data row');
            }

            // Parse headers with better CSV handling
            const headers = this.parseCSVLine(lines[0]);
            
            // Validate headers against expected format
            const expectedHeaders = [
                'Team Name', 'Captain', 'Vice Captain', 
                'Player1', 'Player2', 'Player3', 'Player4', 'Player5', 'Player6',
                'Player7', 'Player8', 'Player9', 'Player10', 'Player11',
                'Credits', 'Confidence'
            ];

            const missingHeaders = expectedHeaders.filter(header => 
                !headers.some(h => h.toLowerCase().includes(header.toLowerCase()))
            );
            
            if (missingHeaders.length > 0) {
                throw new Error(`Missing required columns: ${missingHeaders.join(', ')}`);
            }

            // Parse and validate data rows
            this.uploadedTeams = [];
            const errors = [];
            
            for (let i = 1; i < lines.length; i++) {
                try {
                    const values = this.parseCSVLine(lines[i]);
                    if (values.length < expectedHeaders.length) {
                        errors.push(`Row ${i + 1}: Insufficient columns (${values.length}/${expectedHeaders.length})`);
                        continue;
                    }

                    const team = this.createTeamObject(headers, values, i + 1);
                    if (team) {
                        this.uploadedTeams.push(team);
                    }
                } catch (rowError) {
                    errors.push(`Row ${i + 1}: ${rowError.message}`);
                }
            }

            // Report parsing summary
            if (this.uploadedTeams.length === 0) {
                throw new Error('No valid teams found in CSV. ' + (errors.length > 0 ? `Errors: ${errors.slice(0, 3).join(', ')}` : ''));
            }

            if (errors.length > 0 && errors.length < lines.length - 1) {
                console.warn(`CSV parsed with ${errors.length} errors:`, errors);
                this.components.toast.showSuccess(`Loaded ${this.uploadedTeams.length} teams (${errors.length} rows skipped)`);
            }

            this.csvData = csvText;
            this.validateTeamsData();
            
        } catch (error) {
            console.error('CSV parsing error:', error);
            throw new Error(`CSV parsing failed: ${error.message}`);
        }
    }

    // Enhanced CSV line parser that handles quoted values and commas
    parseCSVLine(line) {
        const result = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                result.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        
        result.push(current.trim());
        return result.map(val => val.replace(/^"(.*)"$/, '$1')); // Remove surrounding quotes
    }

    // Create and validate team object
    createTeamObject(headers, values, rowNumber) {
        const team = { rowNumber };
        
        headers.forEach((header, index) => {
            team[header] = values[index] ? values[index].trim() : '';
        });

        // Validate required fields
        if (!team['Team Name'] || team['Team Name'].length < 2) {
            throw new Error('Team Name is required and must be at least 2 characters');
        }

        if (!team['Captain'] || team['Captain'].length < 2) {
            throw new Error('Captain name is required and must be at least 2 characters');
        }

        if (!team['Vice Captain'] || team['Vice Captain'].length < 2) {
            throw new Error('Vice Captain name is required and must be at least 2 characters');
        }

        // Validate credits
        const credits = parseFloat(team['Credits']);
        if (isNaN(credits) || credits < 80 || credits > 105) {
            throw new Error('Credits must be a number between 80 and 105');
        }
        team['Credits'] = credits;

        // Validate confidence
        const confidence = parseInt(team['Confidence']);
        if (isNaN(confidence) || confidence < 1 || confidence > 10) {
            team['Confidence'] = 1; // Default confidence
        } else {
            team['Confidence'] = confidence;
        }

        // Validate players (at least 8 players should be filled)
        const players = [];
        for (let i = 1; i <= 11; i++) {
            const playerKey = `Player${i}`;
            if (team[playerKey] && team[playerKey].length > 1) {
                players.push(team[playerKey]);
            }
        }

        if (players.length < 8) {
            throw new Error(`At least 8 players required, found ${players.length}`);
        }

        // Check for duplicate players
        const uniquePlayers = new Set(players.map(p => p.toLowerCase()));
        if (uniquePlayers.size !== players.length) {
            throw new Error('Duplicate players found in team');
        }

        // Ensure Captain and Vice Captain are in the team
        const playerNames = players.map(p => p.toLowerCase());
        if (!playerNames.includes(team['Captain'].toLowerCase())) {
            throw new Error('Captain must be one of the 11 players in the team');
        }
        if (!playerNames.includes(team['Vice Captain'].toLowerCase())) {
            throw new Error('Vice Captain must be one of the 11 players in the team');
        }

        return team;
    }

    // Additional validation for overall teams data
    validateTeamsData() {
        if (this.uploadedTeams.length < 10) {
            this.components.toast.showSuccess(`Note: Only ${this.uploadedTeams.length} teams loaded. For better analysis, consider uploading 15+ teams.`);
        }

        // Check for team name duplicates
        const teamNames = this.uploadedTeams.map(t => t['Team Name'].toLowerCase());
        const duplicateNames = teamNames.filter((name, index) => teamNames.indexOf(name) !== index);
        if (duplicateNames.length > 0) {
            console.warn('Duplicate team names found:', [...new Set(duplicateNames)]);
        }

        // Generate additional statistics
        this.generateTeamStats();
    }

    // Generate detailed team statistics
    generateTeamStats() {
        if (!this.uploadedTeams.length) return;

        const stats = {
            totalTeams: this.uploadedTeams.length,
            captains: {},
            viceCaptains: {},
            players: {},
            avgCredits: 0,
            creditRange: { min: 105, max: 80 },
            uniquePlayers: new Set()
        };

        // Analyze teams
        this.uploadedTeams.forEach(team => {
            // Captain frequency
            stats.captains[team.Captain] = (stats.captains[team.Captain] || 0) + 1;
            
            // Vice Captain frequency
            stats.viceCaptains[team['Vice Captain']] = (stats.viceCaptains[team['Vice Captain']] || 0) + 1;
            
            // Credits analysis
            stats.avgCredits += team.Credits;
            stats.creditRange.min = Math.min(stats.creditRange.min, team.Credits);
            stats.creditRange.max = Math.max(stats.creditRange.max, team.Credits);

            // Player frequency
            for (let i = 1; i <= 11; i++) {
                const player = team[`Player${i}`];
                if (player && player.length > 1) {
                    stats.players[player] = (stats.players[player] || 0) + 1;
                    stats.uniquePlayers.add(player);
                }
            }
        });

        stats.avgCredits = (stats.avgCredits / stats.totalTeams).toFixed(1);
        this.teamStats = stats;
    }

    showCSVLoading(show) {
        const uploadContent = document.getElementById('csv-upload-content');
        const loadingContent = document.getElementById('csv-loading');
        
        if (uploadContent && loadingContent) {
            uploadContent.style.display = show ? 'none' : 'block';
            loadingContent.style.display = show ? 'block' : 'none';
        }
    }

    showCSVPreview() {
        const preview = document.getElementById('csv-preview');
        const statsContainer = document.getElementById('csv-stats');
        const teamsPreview = document.getElementById('csv-teams-preview');

        if (!preview || !statsContainer || !teamsPreview) return;

        // Show preview section
        preview.classList.remove('hidden');

        // Use enhanced team statistics
        const stats = this.teamStats;
        if (!stats) return;

        // Top captains and players for quick insights
        const topCaptains = Object.entries(stats.captains)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 2);
            
        const topPlayers = Object.entries(stats.players)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 3);

        statsContainer.innerHTML = `
            <div class="text-center bg-purple-50 rounded p-2">
                <div class="text-lg font-bold text-purple-600">${stats.totalTeams}</div>
                <div class="text-xs text-purple-700 font-medium">Teams</div>
            </div>
            <div class="text-center bg-indigo-50 rounded p-2">
                <div class="text-lg font-bold text-indigo-600">${stats.uniquePlayers.size}</div>
                <div class="text-xs text-indigo-700 font-medium">Players</div>
            </div>
            <div class="text-center bg-emerald-50 rounded p-2">
                <div class="text-lg font-bold text-emerald-600">${stats.avgCredits}</div>
                <div class="text-xs text-emerald-700 font-medium">Avg Credits</div>
            </div>
            <div class="text-center bg-blue-50 rounded p-2">
                <div class="text-lg font-bold text-blue-600">${stats.creditRange.min}-${stats.creditRange.max}</div>
                <div class="text-xs text-blue-700 font-medium">Credit Range</div>
            </div>
        `;

        // Enhanced teams preview with insights
        const previewTeams = this.uploadedTeams.slice(0, 4);
        teamsPreview.innerHTML = `
            <div class="space-y-3">
                <!-- Quick Insights -->
                <div class="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg p-3 border border-purple-100">
                    <div class="text-xs font-semibold text-purple-700 mb-2">📊 Quick Insights</div>
                    <div class="grid grid-cols-1 gap-2 text-xs">
                        <div class="flex justify-between">
                            <span class="text-gray-600">Most Popular Captain:</span>
                            <span class="font-medium text-purple-600">${topCaptains[0] ? `${topCaptains[0][0]} (${topCaptains[0][1]} teams)` : 'Various'}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-600">Most Picked Player:</span>
                            <span class="font-medium text-indigo-600">${topPlayers[0] ? `${topPlayers[0][0]} (${Math.round(topPlayers[0][1]/stats.totalTeams*100)}%)` : 'Various'}</span>
                        </div>
                    </div>
                </div>

                <!-- Sample Teams -->
                <div>
                    <div class="text-xs font-medium text-gray-700 mb-2">📋 Sample Teams:</div>
                    ${previewTeams.map((team, index) => `
                        <div class="flex items-center justify-between py-2 px-3 bg-white rounded border mb-1 hover:bg-gray-50">
                            <div class="flex items-center space-x-2">
                                <div class="w-5 h-5 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-full flex items-center justify-center text-xs font-bold text-purple-600">
                                    ${index + 1}
                                </div>
                                <div class="min-w-0 flex-1">
                                    <div class="text-sm font-medium text-gray-900 truncate">${team['Team Name']}</div>
                                    <div class="text-xs text-gray-500 truncate">C: ${team.Captain} | VC: ${team['Vice Captain']}</div>
                                </div>
                            </div>
                            <div class="flex flex-col items-end">
                                <div class="text-xs font-medium text-gray-900">${team.Credits} cr</div>
                                <div class="text-xs text-gray-500">Conf: ${team.Confidence}</div>
                            </div>
                        </div>
                    `).join('')}
                    ${stats.totalTeams > 4 ? `
                        <div class="text-center text-xs text-gray-500 mt-2 py-2 border-t border-gray-100">
                            ... and ${stats.totalTeams - 4} more teams ready for analysis
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    validateForm() {
        const requiredFields = [
            'team-a', 'team-b', 'match-date', 'venue', 
            'pitch-condition', 'weather-condition'
        ];

        const allFilled = requiredFields.every(fieldId => {
            const field = document.getElementById(fieldId);
            return field && field.value.trim() !== '';
        });

        const hasCSV = this.csvData !== null;
        const isValid = allFilled && hasCSV;

        // Update button state
        const generateBtn = document.getElementById('generate-analysis-btn');
        if (generateBtn) {
            generateBtn.disabled = !isValid;
        }

        return isValid;
    }

    async generateAnalysis() {
        if (!this.validateForm()) {
            this.components.toast.showError('Please fill all required fields and upload CSV');
            return;
        }

        // Show results section and loading
        const resultsSection = document.getElementById('analysis-results');
        const loadingDiv = document.getElementById('analysis-loading');
        
        if (resultsSection) {
            resultsSection.classList.remove('hidden');
            resultsSection.scrollIntoView({ behavior: 'smooth' });
        }
        
        if (loadingDiv) {
            loadingDiv.classList.remove('hidden');
        }

        try {
            // Collect form data
            const matchDetails = {
                teamA: document.getElementById('team-a').value.trim(),
                teamB: document.getElementById('team-b').value.trim(),
                matchDate: document.getElementById('match-date').value,
                format: document.getElementById('match-format').value,
                venue: document.getElementById('venue').value.trim(),
                pitchCondition: document.getElementById('pitch-condition').value,
                weatherCondition: document.getElementById('weather-condition').value
            };

            // Prepare API request
            const requestData = {
                matchDetails,
                teams: this.uploadedTeams
            };

            console.log('Sending analysis request:', requestData);

            // Make API call
            const response = await fetch(`${CONSTANTS.API_BASE_URL}/fantasy-analysis`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestData)
            });

            if (!response.ok) {
                throw new Error(`API request failed: ${response.status}`);
            }

            const result = await response.json();
            this.displayAnalysisResults(result);
            this.components.toast.showSuccess('Analysis completed successfully!');

        } catch (error) {
            console.error('Analysis error:', error);
            this.components.toast.showError('Failed to generate analysis. Please try again.');
        } finally {
            if (loadingDiv) {
                loadingDiv.classList.add('hidden');
            }
        }
    }

    displayAnalysisResults(result) {
        const contentDiv = document.getElementById('analysis-content');
        if (!contentDiv) return;

        // Display simple text analysis without visual elements
        const analysisText = result.analysis || result.summary || 'No analysis available';
        
        contentDiv.innerHTML = `
            <div class="space-y-4">
                <!-- Analysis Header -->
                <div class="bg-gradient-to-r from-primary to-secondary rounded-xl p-4 text-white">
                    <div class="flex items-center justify-between mb-2">
                        <div class="flex items-center space-x-2">
                            <span class="text-2xl">🏏</span>
                            <h3 class="text-lg font-bold">Fantasy Teams Analysis</h3>
                        </div>
                        <div class="text-right">
                            <div class="text-xs opacity-90">Teams Analyzed</div>
                            <div class="text-lg font-bold">${result.metadata?.totalTeams || 'Multiple'}</div>
                        </div>
                    </div>
                    <p class="text-sm opacity-90">Comprehensive fantasy sports analysis</p>
                </div>

                <!-- Simple Text Analysis -->
                <div class="bg-white rounded-xl border border-gray-200 p-6">
                    <div class="prose prose-sm max-w-none">
                        <div class="whitespace-pre-line text-gray-800 leading-relaxed">${this.formatAnalysisText(analysisText)}</div>
                    </div>
                </div>

                <!-- Action Cards -->
                <div class="grid grid-cols-2 gap-2">
                    <button id="export-analysis" class="flex items-center justify-center space-x-2 bg-primary text-white py-2 px-3 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
                        <span>📊</span>
                        <span>Export</span>
                    </button>
                    <button id="new-analysis" class="flex items-center justify-center space-x-2 bg-white border border-primary text-primary py-2 px-3 rounded-lg text-sm font-medium hover:bg-primary/5 transition-colors">
                        <span>🔄</span>
                        <span>New Analysis</span>
                    </button>
                </div>
            </div>
        `;

        // Add interactive functionality
        this.setupAnalysisInteractions(result);
        contentDiv.classList.remove('hidden');
    }

    formatAnalysisText(text) {
        if (!text) return 'No analysis available';
        
        // Basic formatting for better readability
        return text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold text
            .replace(/\*(.*?)\*/g, '<em>$1</em>') // Italic text
            .replace(/###(.*?)$/gm, '<h3 class="text-lg font-bold text-gray-900 mt-4 mb-2">$1</h3>') // H3 headers
            .replace(/##(.*?)$/gm, '<h2 class="text-xl font-bold text-gray-900 mt-6 mb-3">$1</h2>') // H2 headers
            .replace(/#(.*?)$/gm, '<h1 class="text-2xl font-bold text-gray-900 mt-8 mb-4">$1</h1>') // H1 headers
            .replace(/\[Rating: (.*?)\]/g, '<span class="inline-block bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded">Rating: $1</span>') // Rating badges
            .replace(/\n\n/g, '<br><br>') // Double line breaks
            .replace(/\n/g, '<br>'); // Single line breaks
    }

    // Removed - createVisualAnalysis() function no longer needed
    // All visual chart functions have been replaced with simple text formatting

    // Removed - parseAnalysisContent() function no longer needed
    // This was used for parsing content for visual charts which have been removed

    // Removed all visual chart creation functions:
    // - createTeamDistributionSection()
    // - createPlayerAnalysisSection() 
    // - createStrategySection()
    // - createRecommendationsSection()
    // - createMockBarChart()
    // - formatSectionContent()
    // - extractStatistic()
    // - setupAnalysisInteractions()
    // These have been replaced with simple text formatting

    setupAnalysisInteractions(result) {
        // Set up export functionality
        const exportBtn = document.getElementById('export-analysis');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportAnalysis(result));
        }

        // New analysis functionality
        const newAnalysisBtn = document.getElementById('new-analysis');
        if (newAnalysisBtn) {
            newAnalysisBtn.addEventListener('click', () => {
                // Reset form and hide results
                document.getElementById('analysis-results').classList.add('hidden');
                document.getElementById('csv-preview').classList.add('hidden');
                document.getElementById('csv-file-input').value = '';
                this.uploadedTeams = [];
                this.csvData = null;
                this.validateForm();
                this.components.toast.showSuccess('Ready for new analysis');
            });
        }
    }

    // All visual chart creation functions have been removed and replaced with simple text formatting

    exportAnalysis(result) {
        try {
            const analysisData = {
                analysis: result.analysis,
                metadata: result.metadata,
                exportedAt: new Date().toISOString(),
                teams: this.uploadedTeams?.length || 0
            };

            const blob = new Blob([JSON.stringify(analysisData, null, 2)], { 
                type: 'application/json' 
            });
            const url = window.URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `fantasy-analysis-${new Date().toISOString().split('T')[0]}.json`;
            a.style.display = 'none';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            
            window.URL.revokeObjectURL(url);
            this.components.toast.showSuccess('Analysis exported successfully');
        } catch (error) {
            console.error('Export error:', error);
            this.components.toast.showError('Failed to export analysis');
        }
    }

    downloadCSVTemplate() {
        const templateData = [
            ['Team Name', 'Captain', 'Vice Captain', 'Player1', 'Player2', 'Player3', 'Player4', 'Player5', 'Player6', 'Player7', 'Player8', 'Player9', 'Player10', 'Player11', 'Credits', 'Confidence'],
            ['Aggressive Team', 'Shaheen Afridi', 'Jofra Archer', 'Sarfaraz Ahmed', 'Babar Azam', 'Joe Root', 'Fakhar Zaman', 'Harry Brook', 'Moeen Ali', 'Ben Stokes', 'Shaheen Afridi', 'Jofra Archer', 'Mark Wood', 'Adil Rashid', '95.5', '1'],
            ['Balanced Squad', 'Ben Stokes', 'Babar Azam', 'Mohammad Rizwan', 'Babar Azam', 'Joe Root', 'Fakhar Zaman', 'Harry Brook', 'Moeen Ali', 'Ben Stokes', 'Shaheen Afridi', 'Jofra Archer', 'Mark Wood', 'Adil Rashid', '97.0', '2'],
            ['Bowling Heavy', 'Jofra Archer', 'Shaheen Afridi', 'Sarfaraz Ahmed', 'Babar Azam', 'Joe Root', 'Moeen Ali', 'Ben Stokes', 'Shadab Khan', 'Chris Woakes', 'Shaheen Afridi', 'Jofra Archer', 'Mark Wood', 'Adil Rashid', '96.0', '1'],
            ['Batting Focus', 'Babar Azam', 'Joe Root', 'Mohammad Rizwan', 'Babar Azam', 'Joe Root', 'Fakhar Zaman', 'Harry Brook', 'Imam-ul-Haq', 'Moeen Ali', 'Ben Stokes', 'Shaheen Afridi', 'Jofra Archer', 'Mark Wood', '93.5', '3']
        ];

        const csvContent = templateData.map(row => 
            row.map(cell => 
                // Quote cells that contain commas or special characters
                typeof cell === 'string' && (cell.includes(',') || cell.includes('"')) 
                    ? `"${cell.replace(/"/g, '""')}"` 
                    : cell
            ).join(',')
        ).join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = 'fantasy_teams_template.csv';
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        window.URL.revokeObjectURL(url);
        this.components.toast.showSuccess('CSV template downloaded successfully');
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.teamSummaryApp = new TeamSummaryApp();
}); 