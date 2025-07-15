// Enhanced Cricket Analyzer App - Unified Single & Multiple Team Analysis
class EnhancedCricketAnalyzerApp {
    constructor() {
        this.components = {};
        this.currentTeams = [];
        this.currentMatchDetails = null;
        this.selectedTeamIndex = -1;
        this.currentTeamData = null;
        this.analysisMode = 'single'; // 'single' or 'multiple'
        this.matches = [];
        this.selectedMatch = null;
        
        // Initialize components
        this.initializeComponents();
        this.setupEventListeners();
        this.loadMatches();
    }

    initializeComponents() {
        // Initialize Toast notifications
        this.components.toast = new Toast();
        this.components.toast.initialize(
            'error-toast', 'error-message',
            'success-toast', 'success-message'
        );

        // Initialize Match Validation (for session management)
        this.components.matchValidation = new MatchValidation(CONSTANTS.API_BASE_URL);

        // Initialize Player Validation
        this.components.playerValidation = new PlayerValidation(CONSTANTS.API_BASE_URL);

        // Initialize Team Analysis
        this.components.teamAnalysis = new TeamAnalysis(CONSTANTS.API_BASE_URL);

        // Setup component callbacks
        this.setupComponentCallbacks();
    }

    setupComponentCallbacks() {
        // Match validation callbacks (for session management)
        this.components.matchValidation.onValidationSuccess((matchDetails) => {
            this.currentMatchDetails = matchDetails;
            this.components.toast.showSuccess(`Match validated successfully!`);
            this.showUploadSection();
        });

        this.components.matchValidation.onValidationError((message) => {
            this.components.toast.showError(message);
        });
    }

    setupEventListeners() {
        // Retry matches button
        const retryMatchesBtn = document.getElementById('retry-matches-btn');
        if (retryMatchesBtn) {
            retryMatchesBtn.addEventListener('click', () => this.loadMatches());
        }

        // Change match button
        const changeMatchBtn = document.getElementById('change-match-btn');
        if (changeMatchBtn) {
            changeMatchBtn.addEventListener('click', () => this.showMatchSelection());
        }

        // Tab switching
        const screenshotTab = document.getElementById('screenshot-tab');
        const csvTab = document.getElementById('csv-tab');

        if (screenshotTab && csvTab) {
            screenshotTab.addEventListener('click', () => this.switchTab('screenshots'));
            csvTab.addEventListener('click', () => this.switchTab('csv'));
        }

        // Screenshots upload
        const screenshotsUploadArea = document.getElementById('screenshots-upload-area');
        const screenshotsInput = document.getElementById('screenshots-input');
        
        if (screenshotsUploadArea && screenshotsInput) {
            screenshotsUploadArea.addEventListener('click', () => screenshotsInput.click());
            screenshotsInput.addEventListener('change', (e) => this.handleScreenshotsUpload(e));
        }

        // CSV upload
        const csvUploadArea = document.getElementById('csv-upload-area');
        const csvInput = document.getElementById('csv-input');
        const downloadTemplateBtn = document.getElementById('download-template');
        
        if (csvUploadArea && csvInput) {
            csvUploadArea.addEventListener('click', () => csvInput.click());
            csvInput.addEventListener('change', (e) => this.handleCSVUpload(e));
        }
        
        if (downloadTemplateBtn) {
            downloadTemplateBtn.addEventListener('click', () => this.downloadCSVTemplate());
        }
    }

    async loadMatches() {
        this.showMatchesLoading(true);
        this.showMatchesError(false);
        this.showMatchesGrid(false);
        this.showNoMatches(false);

        try {
            const response = await fetch(`${CONSTANTS.API_BASE_URL}/recent-matches?limit=20`);
            const result = await response.json();

            if (result.success && result.data) {
                this.matches = result.data;
                this.displayMatches();
            } else {
                throw new Error(result.message || 'Failed to load matches');
            }
        } catch (error) {
            console.error('Load matches error:', error);
            this.showMatchesError(true);
            this.components.toast.showError('Failed to load matches. Please try again.');
        } finally {
            this.showMatchesLoading(false);
        }
    }

    displayMatches() {
        const matchesGrid = document.getElementById('matches-grid');
        if (!matchesGrid) return;

        // Clear existing content
        matchesGrid.innerHTML = '';

        if (this.matches.length === 0) {
            this.showNoMatches(true);
            return;
        }

        // Create match cards
        const matchCards = MatchCard.createCards(this.matches, (matchData) => {
            this.handleMatchSelection(matchData);
        });

        // Add cards to grid
        matchCards.forEach(card => {
            matchesGrid.appendChild(card);
        });

        this.showMatchesGrid(true);
    }

    handleMatchSelection(matchData) {
        this.selectedMatch = matchData;
        this.displaySelectedMatch(matchData);
        this.showSelectedMatchInfo(true);
        this.showMatchSelection(false);
        
        // Store match data in session and call validation functions
        this.processSelectedMatch(matchData);
    }

    displaySelectedMatch(matchData) {
        const selectedMatchDetails = document.getElementById('selected-match-details');
        if (!selectedMatchDetails) return;

        const matchDate = new Date(matchData.match_date);
        const formattedDate = matchDate.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        // Get team logo data using the same logic as MatchCard
        const team1Logo = this.getTeamLogo(matchData.team1.name);
        const team2Logo = this.getTeamLogo(matchData.team2.name);

        selectedMatchDetails.innerHTML = `
            <div class="flex items-center justify-center space-x-4 mb-3">
                <!-- Team 1 -->
                <div class="flex flex-col items-center space-y-1">
                    <div class="w-12 h-12 rounded-full flex items-center justify-center shadow-md overflow-hidden bg-white border border-gray-100">
                        ${team1Logo.image ? 
                            `<img src="${team1Logo.image}" alt="${team1Logo.short}" class="w-full h-full object-contain p-0.5" 
                                 onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                             <div class="w-full h-full ${team1Logo.fallbackColor} flex items-center justify-center" style="display: none;">
                                 <span class="font-bold text-sm text-white">${team1Logo.short}</span>
                             </div>` :
                            `<div class="w-full h-full ${team1Logo.fallbackColor} flex items-center justify-center">
                                 <span class="font-bold text-sm text-white">${team1Logo.short}</span>
                             </div>`
                        }
                    </div>
                    <div class="text-sm font-semibold text-gray-900 text-center">${team1Logo.short}</div>
                </div>
                
                <!-- VS -->
                <div class="bg-primary text-white px-3 py-1 rounded-full text-xs font-bold shadow-md">
                    VS
                </div>
                
                <!-- Team 2 -->
                <div class="flex flex-col items-center space-y-1">
                    <div class="w-12 h-12 rounded-full flex items-center justify-center shadow-md overflow-hidden bg-white border border-gray-100">
                        ${team2Logo.image ? 
                            `<img src="${team2Logo.image}" alt="${team2Logo.short}" class="w-full h-full object-contain p-0.5" 
                                 onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                             <div class="w-full h-full ${team2Logo.fallbackColor} flex items-center justify-center" style="display: none;">
                                 <span class="font-bold text-sm text-white">${team2Logo.short}</span>
                             </div>` :
                            `<div class="w-full h-full ${team2Logo.fallbackColor} flex items-center justify-center">
                                 <span class="font-bold text-sm text-white">${team2Logo.short}</span>
                             </div>`
                        }
                    </div>
                    <div class="text-sm font-semibold text-gray-900 text-center">${team2Logo.short}</div>
                </div>
            </div>
            
            <div class="text-center">
                <div class="text-sm text-gray-700">${formattedDate}</div>
            </div>
        `;
    }

    async processSelectedMatch(matchData) {
        try {
            // Clear existing session data first
            this.clearSessionData();

            // Store match data in session with the correct key expected by team analysis
            const matchDetails = {
                teamA: matchData.team1.name,
                teamB: matchData.team2.name,
                matchDate: matchData.match_date,
                matchId: matchData.match_id,
                venue: matchData.venue
            };

            // Store in session storage with the key expected by team analysis page
            sessionStorage.setItem('matchDetails', JSON.stringify(matchDetails));
            sessionStorage.setItem('selectedMatch', JSON.stringify(matchDetails));
            this.currentMatchDetails = matchDetails;

            console.log('Match data stored in session:', matchDetails);

            // Call validation functions (without actual validation since data is from DB)
            await this.callValidationFunctions(matchDetails);

            this.components.toast.showSuccess(`Match selected: ${matchData.team1.name} vs ${matchData.team2.name}`);
            this.showUploadSection();

        } catch (error) {
            console.error('Process selected match error:', error);
            this.components.toast.showError('Failed to process match selection. Please try again.');
        }
    }

    async callValidationFunctions(matchDetails) {
        // Call the same functions that the validate button would call
        // but skip the actual validation since we know the data is valid from DB
        
        // Store team and player data in session (this would normally come from validation)
        const sessionData = {
            matchDetails: matchDetails,
            teams: [],
            players: [],
            validationComplete: true
        };

        sessionStorage.setItem('sessionData', JSON.stringify(sessionData));
    }

    clearSessionData() {
        // Clear existing session data
        sessionStorage.removeItem('selectedMatch');
        sessionStorage.removeItem('matchDetails');
        sessionStorage.removeItem('uploadedTeams');
        sessionStorage.removeItem('sessionData');
        sessionStorage.removeItem('currentTeams');
        sessionStorage.removeItem('currentTeamData');
        sessionStorage.removeItem('analysisMode');
    }

    showMatchSelection(show) {
        const matchSelectionSection = document.querySelector('section:first-of-type');
        if (matchSelectionSection) {
            matchSelectionSection.style.display = show ? 'block' : 'none';
        }
    }

    showSelectedMatchInfo(show) {
        const selectedMatchInfo = document.getElementById('selected-match-info');
        if (selectedMatchInfo) {
            selectedMatchInfo.classList.toggle('hidden', !show);
        }
    }

    showMatchesLoading(show) {
        const loading = document.getElementById('matches-loading');
        if (loading) {
            loading.classList.toggle('hidden', !show);
        }
    }

    showMatchesError(show) {
        const error = document.getElementById('matches-error');
        if (error) {
            error.classList.toggle('hidden', !show);
        }
    }

    showMatchesGrid(show) {
        const grid = document.getElementById('matches-grid');
        if (grid) {
            grid.classList.toggle('hidden', !show);
        }
    }

    showNoMatches(show) {
        const noMatches = document.getElementById('no-matches');
        if (noMatches) {
            noMatches.classList.toggle('hidden', !show);
        }
    }

    switchTab(tabName) {
        const screenshotTab = document.getElementById('screenshot-tab');
        const csvTab = document.getElementById('csv-tab');
        const screenshotsSection = document.getElementById('screenshots-section');
        const csvSection = document.getElementById('csv-section');

        if (tabName === 'screenshots') {
            screenshotTab.classList.add('border-primary', 'text-primary');
            screenshotTab.classList.remove('border-transparent', 'text-gray-500');
            csvTab.classList.remove('border-primary', 'text-primary');
            csvTab.classList.add('border-transparent', 'text-gray-500');
            
            screenshotsSection.classList.remove('hidden');
            csvSection.classList.add('hidden');
        } else {
            csvTab.classList.add('border-primary', 'text-primary');
            csvTab.classList.remove('border-transparent', 'text-gray-500');
            screenshotTab.classList.remove('border-primary', 'text-primary');
            screenshotTab.classList.add('border-transparent', 'text-gray-500');
            
            csvSection.classList.remove('hidden');
            screenshotsSection.classList.add('hidden');
        }
    }

    showUploadSection() {
        const uploadSection = document.getElementById('upload-section');
        if (uploadSection) {
            uploadSection.classList.remove('hidden');
            uploadSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    async handleScreenshotsUpload(e) {
        const files = Array.from(e.target.files);
        
        if (files.length === 0) return;

        // Validate files
        if (files.length > 10) {
            this.components.toast.showError('Maximum 10 screenshots allowed');
            return;
        }

        const validFiles = files.filter(file => {
            if (file.size > 5 * 1024 * 1024) {
                this.components.toast.showError(`${file.name} is too large (max 5MB)`);
                return false;
            }
            if (!file.type.startsWith('image/')) {
                this.components.toast.showError(`${file.name} is not an image file`);
                return false;
            }
            return true;
        });

        if (validFiles.length === 0) return;

        // Show preview
        this.showScreenshotsPreview(validFiles);

        // Process screenshots
        this.showScreenshotsLoading(true);
        
        try {
            const teams = [];
            
            for (let i = 0; i < validFiles.length; i++) {
                const file = validFiles[i];
                const formData = new FormData();
                formData.append('image', file);

                const response = await fetch(`${CONSTANTS.API_BASE_URL}/ocr/process`, {
                    method: 'POST',
                    body: formData
                });

                const result = await response.json();
                
                if (result.success) {
                    teams.push({
                        name: `Team ${i + 1}`,
                        players: result.data.players,
                        captain: result.data.captain || '',
                        viceCaptain: result.data.vice_captain || '',
                        source: 'screenshot',
                        fileName: file.name
                    });
                } else {
                    this.components.toast.showError(`Failed to process ${file.name}: ${result.message}`);
                }
            }

            if (teams.length > 0) {
                this.currentTeams = teams;
                this.analysisMode = 'multiple';
                this.displayTeamsSummary();
                this.components.toast.showSuccess(`Successfully processed ${teams.length} team(s)`);
            }

        } catch (error) {
            console.error('Screenshots upload error:', error);
            this.components.toast.showError('Failed to process screenshots. Please try again.');
        } finally {
            this.showScreenshotsLoading(false);
        }
    }

    async handleCSVUpload(e) {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file
        if (file.size > 1024 * 1024) {
            this.components.toast.showError('File size must be less than 1MB');
            return;
        }

        if (!file.name.endsWith('.csv')) {
            this.components.toast.showError('Please upload a CSV file');
            return;
        }

        // Show loading state
        this.showCSVLoading(true);

        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch(`${CONSTANTS.API_BASE_URL}/teams/process-csv`, {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (result.success) {
                this.currentTeams = result.data.teams;
                this.analysisMode = 'multiple';
                this.displayTeamsSummary();
                this.components.toast.showSuccess(`Successfully processed ${result.data.teams.length} team(s)`);
            } else {
                this.components.toast.showError(result.message);
            }

        } catch (error) {
            console.error('CSV upload error:', error);
            this.components.toast.showError('Failed to process CSV file. Please try again.');
        } finally {
            this.showCSVLoading(false);
        }
    }

    showScreenshotsPreview(files) {
        const preview = document.getElementById('screenshots-preview');
        const grid = document.getElementById('screenshots-grid');
        
        if (preview && grid) {
            grid.innerHTML = '';
            
            files.forEach(file => {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const div = document.createElement('div');
                    div.className = 'relative';
                    div.innerHTML = `
                        <img src="${e.target.result}" alt="${file.name}" class="w-full h-24 object-cover rounded border">
                        <div class="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 truncate">
                            ${file.name}
                        </div>
                    `;
                    grid.appendChild(div);
                };
                reader.readAsDataURL(file);
            });
            
            preview.classList.remove('hidden');
        }
    }

    showScreenshotsLoading(show) {
        const content = document.getElementById('screenshots-upload-content');
        const loading = document.getElementById('screenshots-loading');
        
        if (content && loading) {
            content.classList.toggle('hidden', show);
            loading.classList.toggle('hidden', !show);
        }
    }

    showCSVLoading(show) {
        const content = document.getElementById('csv-upload-content');
        const loading = document.getElementById('csv-loading');
        
        if (content && loading) {
            content.classList.toggle('hidden', show);
            loading.classList.toggle('hidden', !show);
        }
    }

    displayTeamsSummary() {
        // Store teams data with the correct key expected by team analysis page
        sessionStorage.setItem('uploadedTeams', JSON.stringify(this.currentTeams));
        
        const summaryContainer = document.createElement('div');
        summaryContainer.className = 'mt-4 p-4 bg-gray-50 rounded-lg';
        summaryContainer.innerHTML = `
            <h3 class="text-sm font-semibold text-gray-700 mb-3">Uploaded Teams (${this.currentTeams.length})</h3>
            <div class="space-y-2">
                ${this.currentTeams.map((team, index) => `
                    <div class="flex items-center justify-between p-2 bg-white rounded border">
                        <div>
                            <div class="font-medium text-sm">${team.name}</div>
                            <div class="text-xs text-gray-500">${team.players.length} players</div>
                        </div>
                        <div class="text-xs text-gray-500">
                            ${team.captain ? `C: ${team.captain}` : ''} ${team.viceCaptain ? `VC: ${team.viceCaptain}` : ''}
                        </div>
                    </div>
                `).join('')}
            </div>
            <div class="mt-4 flex space-x-2">
                <button onclick="window.location.href='team-analysis-tabbed.html'" class="flex-1 bg-primary text-white py-2 px-3 rounded text-sm font-semibold hover:bg-primary/90 transition-all duration-200">
                    🏆 Analyze Teams
                </button>
            </div>
        `;

        const uploadSection = document.getElementById('upload-section');
        if (uploadSection) {
            // Remove existing summary if any
            const existingSummary = uploadSection.querySelector('.mt-4.p-4.bg-gray-50');
            if (existingSummary) {
                existingSummary.remove();
            }
            uploadSection.appendChild(summaryContainer);
        }
    }

    downloadCSVTemplate() {
        const csvContent = `Team Name,Player Name,Role,Captain,Vice Captain
Team 1,Virat Kohli,Batsman,Yes,No
Team 1,Rohit Sharma,Batsman,No,Yes
Team 1,Jasprit Bumrah,Bowler,No,No
Team 2,MS Dhoni,Wicket Keeper,Yes,No
Team 2,Ravindra Jadeja,All Rounder,No,Yes
Team 2,Mohammed Shami,Bowler,No,No`;

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'fantasy_teams_template.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }

    getTeamLogo(teamName) {
        // Team logo and external URL mapping (same as MatchCard component)
        const TEAM_LOGOS = {
            'Chennai Super Kings': { 
                short: 'CSK', 
                image: 'https://r2.thesportsdb.com/images/media/team/badge/okceh51487601098.png/medium', 
                fallbackColor: 'bg-yellow-500' 
            },
            'Mumbai Indians': { 
                short: 'MI', 
                image: 'https://r2.thesportsdb.com/images/media/team/badge/l40j8p1487678631.png/medium',
                fallbackColor: 'bg-blue-600' 
            },
            'Royal Challengers Bengaluru': { 
                short: 'RCB', 
                image: 'https://r2.thesportsdb.com/images/media/team/badge/kynj5v1588331757.png/medium',
                fallbackColor: 'bg-red-600' 
            },
            'Royal Challengers Bangalore': { 
                short: 'RCB', 
                image: 'https://r2.thesportsdb.com/images/media/team/badge/kynj5v1588331757.png/medium',
                fallbackColor: 'bg-red-600' 
            },
            'Sunrisers Hyderabad': { 
                short: 'SRH', 
                image: 'https://r2.thesportsdb.com/images/media/team/badge/sc7m161487419327.png/medium',
                fallbackColor: 'bg-orange-500' 
            },
            'Rajasthan Royals': { 
                short: 'RR', 
                image: 'https://r2.thesportsdb.com/images/media/team/badge/lehnfw1487601864.png/medium',
                fallbackColor: 'bg-pink-500' 
            },
            'Delhi Capitals': { 
                short: 'DC', 
                image: 'https://r2.thesportsdb.com/images/media/team/badge/dg4g0z1587334054.png/medium',
                fallbackColor: 'bg-blue-500' 
            },
            'Kolkata Knight Riders': { 
                short: 'KKR', 
                image: 'https://r2.thesportsdb.com/images/media/team/badge/ows99r1487678296.png/medium',
                fallbackColor: 'bg-purple-600' 
            },
            'Punjab Kings': { 
                short: 'PBKS', 
                image: 'https://r2.thesportsdb.com/images/media/team/badge/r1tcie1630697821.png/medium',
                fallbackColor: 'bg-red-500' 
            },
            'Lucknow Super Giants': { 
                short: 'LSG', 
                image: 'https://r2.thesportsdb.com/images/media/team/badge/4tzmfa1647445839.png/medium',
                fallbackColor: 'bg-green-600' 
            },
            'Gujarat Titans': { 
                short: 'GT', 
                image: 'https://r2.thesportsdb.com/images/media/team/badge/6qw4r71654174508.png/medium',
                fallbackColor: 'bg-blue-400' 
            },
        };

        return TEAM_LOGOS[teamName] || { 
            short: teamName.substring(0, 3).toUpperCase(), 
            image: null, 
            fallbackColor: 'bg-gray-500' 
        };
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new EnhancedCricketAnalyzerApp();
}); 