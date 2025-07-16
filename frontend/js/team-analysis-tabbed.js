// Tabbed Team Analysis App
class TabbedTeamAnalysisApp {
    constructor() {
        console.log('TabbedTeamAnalysisApp constructor called');
        
        this.components = {};
        this.currentTeams = [];
        this.currentMatchDetails = null;
        this.selectedTeamIndex = -1;
        this.currentTeamData = null;
        this.analysisData = null;
        this.activeTab = 'match-stats';
        
        // Test DOM elements immediately
        this.testDOMElements();
        
        // Initialize components
        this.initializeComponents();
        this.setupEventListeners();
        this.loadDataFromSession();
        
        // Initialize tabs after a short delay to ensure DOM is ready
        setTimeout(() => {
            this.initializeTabs();
        }, 100);
    }
    
    testDOMElements() {
        console.log('Testing DOM elements...');
        const testElements = [
            'h2h-team-a-name',
            'h2h-team-b-name', 
            'h2h-total-matches',
            'recent-form-team-a-name',
            'recent-form-team-b-name'
        ];
        
        testElements.forEach(id => {
            const element = document.getElementById(id);
            console.log(`${id}: ${element ? 'FOUND' : 'NOT FOUND'}`);
        });
    }

    initializeComponents() {
        // Initialize Toast notifications
        this.components.toast = new Toast();
        
        // Initialize other components
        this.components.matchValidation = new MatchValidation(CONSTANTS.API_BASE_URL);
        this.components.playerValidation = new PlayerValidation(CONSTANTS.API_BASE_URL);
        this.components.teamAnalysis = new TeamAnalysis(CONSTANTS.API_BASE_URL);
        
        // Set up component callbacks
        this.setupComponentCallbacks();
    }

    setupComponentCallbacks() {
        // Set up analysis callbacks
        this.components.teamAnalysis.onAnalysisComplete((data) => {
            this.analysisData = data;
            this.populateAnalysisData();
        });

        this.components.teamAnalysis.onAnalysisError((error) => {
            this.components.toast.showError(`Analysis failed: ${error.message}`);
        });
    }

    setupEventListeners() {
        // Tab switching
        document.getElementById('match-stats-tab').addEventListener('click', async () => await this.switchTab('match-stats'));
        document.getElementById('team-details-tab').addEventListener('click', async () => await this.switchTab('team-details'));
        document.getElementById('team-comparison-tab').addEventListener('click', async () => await this.switchTab('team-comparison'));
        document.getElementById('teams-summary-tab').addEventListener('click', async () => await this.switchTab('teams-summary'));

        // Team selector
        document.getElementById('team-selector').addEventListener('change', (e) => this.handleTeamSelection(e));

        // Captain/Vice-captain selection
        document.getElementById('captain-select').addEventListener('change', (e) => this.handleCaptainSelection(e));
        document.getElementById('vice-captain-select').addEventListener('change', (e) => this.handleViceCaptainSelection(e));

        // Analysis buttons
        document.getElementById('analyze-all-btn').addEventListener('click', () => this.analyzeAllTeams());
        document.getElementById('compare-teams-btn').addEventListener('click', () => this.compareTeams());

        // Player validation button
        const validatePlayersBtn = document.getElementById('validate-players-btn');
        if (validatePlayersBtn) {
            validatePlayersBtn.addEventListener('click', () => this.displayTeamDetails());
        }
    }

    async initializeTabs() {
        // Set initial active tab
        await this.switchTab('match-stats');
    }

    async switchTab(tabName) {
        console.log(`Switching to tab: ${tabName}`);
        
        // Update active tab
        this.activeTab = tabName;

        // Update tab button styles
        const tabButtons = [
            'match-stats-tab',
            'team-details-tab',
            'team-comparison-tab',
            'teams-summary-tab'
        ];

        tabButtons.forEach(buttonId => {
            const button = document.getElementById(buttonId);
            if (buttonId === `${tabName}-tab`) {
                button.classList.remove('border-transparent', 'text-gray-500', 'hover:text-gray-700');
                button.classList.add('border-primary', 'text-primary');
            } else {
                button.classList.remove('border-primary', 'text-primary');
                button.classList.add('border-transparent', 'text-gray-500', 'hover:text-gray-700');
            }
        });

        // Show/hide tab content
        const tabContents = [
            'match-stats-content',
            'team-details-content',
            'team-comparison-content', 
            'teams-summary-content'
        ];

        tabContents.forEach(contentId => {
            const content = document.getElementById(contentId);
            if (contentId === `${tabName}-content`) {
                content.classList.remove('hidden');
                content.classList.add('active');
                console.log(`Made ${contentId} visible`);
                
                // Data will be loaded through loadTabData() when tab is activated
            } else {
                content.classList.add('hidden');
                content.classList.remove('active');
            }
        });

        // Load additional data for the active tab
        await this.loadTabData(tabName);
    }

    async loadTabData(tabName) {
        switch(tabName) {
            case 'match-stats':
                await this.loadMatchStatsData();
                break;
            case 'team-details':
                this.loadTeamDetailsData();
                break;
            case 'team-comparison':
                this.loadTeamComparisonData();
                break;
            case 'teams-summary':
                this.loadTeamsSummaryData();
                break;
        }
    }

    loadDataFromSession() {
        try {
            const teamsData = sessionStorage.getItem('uploadedTeams');
            const matchData = sessionStorage.getItem('matchDetails');

            console.log('Loading data from session...');
            console.log('Teams data:', teamsData);
            console.log('Match data:', matchData);

            if (teamsData) {
                this.currentTeams = JSON.parse(teamsData);
                console.log('Parsed teams:', this.currentTeams);
            }

            if (matchData) {
                this.currentMatchDetails = JSON.parse(matchData);
                console.log('Parsed match details:', this.currentMatchDetails);
                this.displayMatchInfo();
            }

            // If no data exists, create sample data for testing
            if (!this.currentMatchDetails) {
                console.log('No match details found, creating sample data for testing');
                this.currentMatchDetails = {
                    teamA: 'Mumbai Indians',
                    teamB: 'Chennai Super Kings',
                    matchDate: '2024-04-15'
                };
                this.displayMatchInfo();
            }

            if (this.currentTeams.length === 0) {
                console.log('No teams found, creating sample data for testing');
                this.currentTeams = [
                    {
                        name: 'Team 1',
                        players: ['Virat Kohli', 'Rohit Sharma', 'MS Dhoni', 'Jasprit Bumrah', 'Ravindra Jadeja'],
                        captain: 'Virat Kohli',
                        viceCaptain: 'Rohit Sharma'
                    },
                    {
                        name: 'Team 2', 
                        players: ['KL Rahul', 'Shikhar Dhawan', 'Hardik Pandya', 'Yuzvendra Chahal', 'Bhuvneshwar Kumar'],
                        captain: 'KL Rahul',
                        viceCaptain: 'Hardik Pandya'
                    }
                ];
            }

            if (this.currentTeams.length > 0) {
                this.populateTeamSelector();
                this.displayTeamsSummary();
            }

        } catch (error) {
            console.error('Error loading session data:', error);
            this.components.toast.showError('Failed to load saved data');
        }
    }

    displayMatchInfo() {
        if (!this.currentMatchDetails) return;

        const matchInfo = document.getElementById('match-info');
        
        // Get team logo data
        const teamA = TabbedTeamAnalysisApp.TEAM_LOGOS[this.currentMatchDetails.teamA] || { 
            short: this.currentMatchDetails.teamA, 
            image: null, 
            fallbackColor: 'bg-gray-500' 
        };
        const teamB = TabbedTeamAnalysisApp.TEAM_LOGOS[this.currentMatchDetails.teamB] || { 
            short: this.currentMatchDetails.teamB, 
            image: null, 
            fallbackColor: 'bg-gray-500' 
        };
        
        matchInfo.innerHTML = `
            <div class="flex justify-between items-center p-4 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg">
                <div class="text-center flex-1">
                    <div class="flex flex-col items-center">
                        <div class="w-12 h-12 rounded-full flex items-center justify-center mb-2 shadow-lg overflow-hidden bg-white">
                            ${teamA.image ? 
                                `<img src="${teamA.image}" alt="${teamA.short}" class="w-full h-full object-contain p-1" 
                                     onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                                 <div class="w-full h-full ${teamA.fallbackColor} flex items-center justify-center" style="display: none;">
                                     <span class="font-bold text-lg text-white">${teamA.short}</span>
                                 </div>` :
                                `<div class="w-full h-full ${teamA.fallbackColor} flex items-center justify-center">
                                     <span class="font-bold text-lg text-white">${teamA.short}</span>
                                 </div>`
                            }
                        </div>
                        <div class="font-bold text-gray-800 text-sm">${teamA.short}</div>
                    </div>
                </div>
                <div class="mx-4 flex items-center">
                    <div class="bg-primary text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg">VS</div>
                </div>
                <div class="text-center flex-1">
                    <div class="flex flex-col items-center">
                        <div class="w-12 h-12 rounded-full flex items-center justify-center mb-2 shadow-lg overflow-hidden bg-white">
                            ${teamB.image ? 
                                `<img src="${teamB.image}" alt="${teamB.short}" class="w-full h-full object-contain p-1" 
                                     onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                                 <div class="w-full h-full ${teamB.fallbackColor} flex items-center justify-center" style="display: none;">
                                     <span class="font-bold text-lg text-white">${teamB.short}</span>
                                 </div>` :
                                `<div class="w-full h-full ${teamB.fallbackColor} flex items-center justify-center">
                                     <span class="font-bold text-lg text-white">${teamB.short}</span>
                                 </div>`
                            }
                        </div>
                        <div class="font-bold text-gray-800 text-sm">${teamB.short}</div>
                    </div>
                </div>
            </div>
            <div class="text-center mt-3">
                <div class="text-sm text-black-600">Match Date: ${this.currentMatchDetails.matchDate}</div>
            </div>
        `;
    }

    populateTeamSelector() {
        const selector = document.getElementById('team-selector');
        selector.innerHTML = '<option value="">Choose a team to configure captain/vice-captain</option>';
        
        this.currentTeams.forEach((team, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = team.name;
            selector.appendChild(option);
        });
    }

    handleTeamSelection(e) {
        const teamIndex = parseInt(e.target.value);
        if (teamIndex >= 0 && teamIndex < this.currentTeams.length) {
            this.selectedTeamIndex = teamIndex;
            this.currentTeamData = this.currentTeams[teamIndex];
            this.displayTeamDetails();
            this.populateCaptainSelectors();
        } else {
            this.selectedTeamIndex = -1;
            this.currentTeamData = null;
            this.hideTeamDetails();
        }
    }

    async displayTeamDetails() {
        const teamDetails = document.getElementById('team-details');
        const playersList = document.getElementById('players-list');
        const overrideSection = document.getElementById('player-override-section');
        
        if (!this.currentTeamData) return;

        // Show loading state
        playersList.innerHTML = `
            <div class="flex items-center justify-center py-4">
                <div class="w-4 h-4 border-2 border-primary/20 border-t-primary rounded-full animate-spin mr-2"></div>
                <span class="text-xs text-gray-600">Validating players...</span>
            </div>
        `;

        try {
            // Validate players against database
            const validationResults = await this.validatePlayers(this.currentTeamData.players);
            
            // Store validation results
            this.currentTeamData.validationResults = validationResults;
            
            // Display players with new card design
            playersList.innerHTML = '';
            let hasInvalidPlayers = false;
            
            validationResults.forEach((result, index) => {
                const playerDiv = document.createElement('div');
                
                
                if (result.isValid) {
                    // Valid player - show with new card design
                    const isAutoReplaced = result.autoReplaced;
                    const bgColor = isAutoReplaced ? 'bg-white border-gray-200' : 'bg-white border-gray-200';
                    const statusColor = isAutoReplaced ? 'text-green-600' : 'text-green-600';
                    const statusText = isAutoReplaced ? 'Validated' : 'Validated';
                    
                    // Check if this player is captain or vice-captain
                    const isCaptain = this.currentTeamData.captain === result.validatedName;
                    const isViceCaptain = this.currentTeamData.viceCaptain === result.validatedName;
                    
                    playerDiv.innerHTML = `
                        <div class="flex items-center p-2 ${bgColor} border rounded-lg shadow-sm hover:shadow-md transition-all duration-200">
                            <!-- Player Image with C/VC Label -->
                            <div class="relative mr-3">
                                <div class="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                                    <img src="https://fantasy.cricbuzz11.com/_next/image?url=https%3A%2F%2Fd13ir53smqqeyp.cloudfront.net%2Fplayer-images%2Fdefault-player-image.png&w=96&q=75" 
                                         alt="${result.validatedName}" 
                                         class="w-full h-full object-cover"
                                         onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                                    <div class="w-full h-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-white font-bold text-lg" style="display: none;">
                                        ${result.validatedName.charAt(0).toUpperCase()}
                                    </div>
                                </div>
                                ${isCaptain ? '<div class="absolute -top-1 -right-1 w-4 h-4 bg-yellow-500 text-white text-xs font-bold rounded-full flex items-center justify-center">C</div>' : ''}
                                ${isViceCaptain ? '<div class="absolute -top-1 -right-1 w-4 h-4 bg-gray-700 text-white text-xs font-bold rounded-full flex items-center justify-center">VC</div>' : ''}
                            </div>
                            
                            <!-- Player Info -->
                            <div class="flex-1 min-w-0">
                                <div class="font-semibold text-gray-900 text-sm truncate">${result.validatedName}</div>
                                <div class="text-xs text-gray-500">
                                    <span class="font-medium">${result.role || 'Unknown'}</span> • 
                                    <span class="font-medium">${this.getTeamShortName(result.team) || 'Unknown'}</span>
                                </div>
                            </div>
                        </div>
                    `;
                } else {
                    // Invalid player - needs override
                    hasInvalidPlayers = true;
                    playerDiv.innerHTML = `
                        <div class="flex items-center p-2 bg-red-50 border border-red-200 rounded-lg shadow-sm hover:shadow-md transition-all duration-200">
                            <!-- Player Image Placeholder -->
                            <div class="relative mr-3">
                                <div class="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center overflow-hidden">
                                    <div class="w-full h-full bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center text-white font-bold text-lg">
                                        ?
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Player Info -->
                            <div class="flex-1 min-w-0">
                                <div class="font-semibold text-gray-900 text-sm truncate">${result.inputName}</div>
                                <div class="text-xs text-red-600 font-medium">Not found in database</div>
                            </div>
                            
                            <!-- Override Button -->
                            <button onclick="window.tabbedApp.showPlayerOverrideModal('${result.inputName}', ${index})" 
                                    class="ml-2 text-xs bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 transition-colors font-medium">
                                🔍 Override
                            </button>
                        </div>
                    `;
                }
                
                playersList.appendChild(playerDiv);
            });

            // Show override section if there are invalid players
            if (hasInvalidPlayers) {
                overrideSection.classList.remove('hidden');
            } else {
                overrideSection.classList.add('hidden');
            }

            // Update team data with validation results
            this.updateTeamData();

        } catch (error) {
            console.error('Player validation error:', error);
            playersList.innerHTML = `
                <div class="text-center py-4">
                    <div class="text-red-600 text-sm mb-2">Failed to validate players</div>
                    <button onclick="window.tabbedApp.displayTeamDetails()" class="text-xs text-primary hover:underline">
                        Try again
                    </button>
                </div>
            `;
        }

        teamDetails.classList.remove('hidden');
    }

    async validatePlayers(players) {
        if (!this.currentMatchDetails) {
            this.components.toast.showError('Please validate match details first');
            return players.map(player => ({
                inputName: player,
                isValid: false,
                validatedName: player,
                suggestions: []
            }));
        }

        try {
            const response = await fetch(`${CONSTANTS.API_BASE_URL}/validate-players`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    players: players,
                    teamA: this.currentMatchDetails.teamA,
                    teamB: this.currentMatchDetails.teamB
                })
            });

            const result = await response.json();
            
            if (result.success) {
                return result.validationResults;
            } else {
                this.components.toast.showError(result.message || 'Validation failed');
                return players.map(player => ({
                    inputName: player,
                    isValid: false,
                    validatedName: player,
                    suggestions: []
                }));
            }
        } catch (error) {
            console.error('Validation error:', error);
            this.components.toast.showError('Failed to validate players');
            return players.map(player => ({
                inputName: player,
                isValid: false,
                validatedName: player,
                suggestions: []
            }));
        }
    }

    showPlayerOverrideModal(playerName, playerIndex) {
        // Create modal if it doesn't exist
        let modal = document.getElementById('player-override-modal');
        if (!modal) {
            modal = this.createPlayerOverrideModal();
        }

        // Find the player's validation result
        const playerResult = this.currentTeamData.validationResults.find(r => r.inputName === playerName);
        if (!playerResult) {
            this.components.toast.showError('Player not found');
            return;
        }

        // Populate modal content
        const content = document.getElementById('override-modal-content');
        let suggestionsHtml = '';

        // Add database suggestions with similarity scores
        if (playerResult.suggestions && playerResult.suggestions.length > 0) {
            playerResult.suggestions.forEach(suggestion => {
                const similarityPercent = Math.round(suggestion.similarity * 100);
                const bgColor = similarityPercent >= 80 ? 'bg-green-50 border-green-200' : 
                               similarityPercent >= 60 ? 'bg-yellow-50 border-yellow-200' : 
                               'bg-gray-50 border-gray-200';
                const scoreColor = similarityPercent >= 80 ? 'text-green-600' : similarityPercent >= 60 ? 'text-yellow-600' : 'text-gray-500';
                
                suggestionsHtml += `
                    <label class="flex items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors ${bgColor} override-suggestion" data-player="${suggestion.playerName}" data-player-id="${suggestion.playerId}" data-role="${suggestion.role}" data-team="${suggestion.team}">
                        <input type="radio" name="override-player" value="${suggestion.playerName}" class="mr-3" tabindex="-1">
                        
                        <!-- Player Image -->
                        <div class="mr-3">
                            <div class="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                                <img src="https://fantasy.cricbuzz11.com/_next/image?url=https%3A%2F%2Fd13ir53smqqeyp.cloudfront.net%2Fplayer-images%2Fdefault-player-image.png&w=96&q=75" 
                                     alt="${suggestion.playerName}" 
                                     class="w-full h-full object-cover"
                                     onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                                <div class="w-full h-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-white font-bold text-sm" style="display: none;">
                                    ${suggestion.playerName.charAt(0).toUpperCase()}
                                </div>
                            </div>
                        </div>
                        
                        <!-- Player Info -->
                        <div class="flex-1 min-w-0">
                            <div class="font-medium text-sm text-gray-800 truncate">${suggestion.playerName}</div>
                            <div class="text-xs text-gray-500">
                                <span class="font-medium">${suggestion.role}</span> • 
                                <span class="font-medium">${this.getTeamShortName(suggestion.team)}</span>
                            </div>
                        </div>
                        
                        <!-- Similarity Score -->
                        <div class="text-xs font-medium ${scoreColor} ml-2 bg-white px-2 py-1 rounded border">
                            ${similarityPercent}%
                        </div>
                    </label>
                `;
            });
        }

        // Add option to keep original
        suggestionsHtml += `
            <label class="flex items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors bg-gray-50 override-suggestion" data-player="${playerName}">
                <input type="radio" name="override-player" value="${playerName}" class="mr-3" tabindex="-1">
                
                <!-- Player Image Placeholder -->
                <div class="mr-3">
                    <div class="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center overflow-hidden">
                        <div class="w-full h-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center text-white font-bold text-sm">
                            ?
                        </div>
                    </div>
                </div>
                
                <!-- Player Info -->
                <div class="flex-1 min-w-0">
                    <div class="font-medium text-sm text-gray-800 truncate">${playerName}</div>
                    <div class="text-xs text-gray-500">Keep Original (Not in Database)</div>
                </div>
                
                <!-- Similarity Score -->
                <div class="text-xs font-medium text-gray-400 ml-2 bg-white px-2 py-1 rounded border">
                    0%
                </div>
            </label>
        `;

        content.innerHTML = `
            <div class="mb-4">
                <h4 class="font-semibold text-gray-800 mb-2">Input Player: ${playerName}</h4>
                <p class="text-sm text-gray-600 mb-4">Select the correct player from the database:</p>
                <div class="space-y-3 max-h-[50vh] overflow-y-auto pr-2">${suggestionsHtml}</div>
            </div>
        `;

        // Store current override context
        this.currentOverridePlayer = playerName;
        this.currentOverrideIndex = playerIndex;

        // Add event listeners
        setTimeout(() => {
            const suggestionLabels = content.querySelectorAll('.override-suggestion');
            suggestionLabels.forEach(label => {
                label.addEventListener('click', (e) => {
                    const player = label.getAttribute('data-player');
                    const playerId = label.getAttribute('data-player-id');
                    const role = label.getAttribute('data-role');
                    const team = label.getAttribute('data-team');
                    this.handlePlayerOverride(player, playerId, role, team);
                });
            });
        }, 50);

        // Show modal
        modal.classList.remove('hidden');

        // ESC key closes modal
        this._escListener = (e) => {
            if (e.key === 'Escape') {
                this.closePlayerOverrideModal();
            }
        };
        document.addEventListener('keydown', this._escListener);

        // Click outside closes modal
        modal.addEventListener('mousedown', this._outsideClickListener = (e) => {
            if (e.target === modal) {
                this.closePlayerOverrideModal();
            }
        });
    }

    createPlayerOverrideModal() {
        const modal = document.createElement('div');
        modal.id = 'player-override-modal';
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 hidden';
        modal.innerHTML = `
            <div class="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-hidden">
                <div class="bg-primary text-white p-4 rounded-t-lg">
                    <div class="flex items-center justify-between">
                        <h3 class="font-semibold text-lg">Player Override</h3>
                        <button onclick="window.tabbedApp.closePlayerOverrideModal()" class="text-white hover:text-gray-200">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                            </svg>
                        </button>
                    </div>
                </div>
                <div class="p-4 flex-1 overflow-hidden">
                    <div id="override-modal-content" class="h-full overflow-y-auto"></div>
                </div>
                <div class="bg-gray-50 px-4 py-3 rounded-b-lg flex justify-end space-x-2">
                    <button onclick="window.tabbedApp.closePlayerOverrideModal()" class="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">
                        Cancel
                    </button>
                    <button onclick="window.tabbedApp.savePlayerOverride()" class="px-4 py-2 text-sm bg-primary text-white rounded hover:bg-primary/90">
                        Save Changes
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        return modal;
    }

    handlePlayerOverride(playerName, playerId, role, team) {
        // Update the player in the current team data
        if (this.currentOverrideIndex !== undefined) {
            this.currentTeamData.players[this.currentOverrideIndex] = playerName;
        }

        // Update validation results
        const validationResult = this.currentTeamData.validationResults.find(r => r.inputName === this.currentOverridePlayer);
        if (validationResult) {
            validationResult.inputName = playerName;
            validationResult.validatedName = playerName;
            validationResult.isValid = true;
            validationResult.playerId = playerId;
            validationResult.role = role;
            validationResult.team = team;
            validationResult.confidence = 1.0;
            validationResult.autoReplaced = false;
        }

        // Update captain/vice-captain if they were the overridden player
        if (this.currentTeamData.captain === this.currentOverridePlayer) {
            this.currentTeamData.captain = playerName;
        }
        if (this.currentTeamData.viceCaptain === this.currentOverridePlayer) {
            this.currentTeamData.viceCaptain = playerName;
        }

        // Update the teams array and sessionStorage
        this.updateTeamData();

        // Close modal and refresh display
        this.closePlayerOverrideModal();
        this.displayTeamDetails();
        this.populateCaptainSelectors();
        
        // Show success toast instead of alert
        this.components.toast.showSuccess(`Player updated to: ${playerName}`);
    }

    savePlayerOverride() {
        const selectedValue = document.querySelector('input[name="override-player"]:checked');
        
        if (!selectedValue) {
            this.components.toast.showError('Please select a player');
            return;
        }

        const newPlayerName = selectedValue.value;
        
        // Find the suggestion data if it's a database player
        const playerResult = this.currentTeamData.validationResults.find(r => r.inputName === this.currentOverridePlayer);
        let selectedSuggestion = null;
        
        if (playerResult && playerResult.suggestions) {
            selectedSuggestion = playerResult.suggestions.find(s => s.playerName === newPlayerName);
        }
        
        // Update the player in the current team data
        if (this.currentOverrideIndex !== undefined) {
            this.currentTeamData.players[this.currentOverrideIndex] = newPlayerName;
        }

        // Update validation results
        const validationResult = this.currentTeamData.validationResults.find(r => r.inputName === this.currentOverridePlayer);
        if (validationResult) {
            validationResult.inputName = newPlayerName;
            validationResult.validatedName = newPlayerName;
            validationResult.isValid = true;
            
            // Update with suggestion data if available
            if (selectedSuggestion) {
                validationResult.playerId = selectedSuggestion.playerId;
                validationResult.role = selectedSuggestion.role;
                validationResult.team = selectedSuggestion.team;
                validationResult.confidence = selectedSuggestion.similarity;
            }
        }

        // Update captain/vice-captain if they were the overridden player
        if (this.currentTeamData.captain === this.currentOverridePlayer) {
            this.currentTeamData.captain = newPlayerName;
        }
        if (this.currentTeamData.viceCaptain === this.currentOverridePlayer) {
            this.currentTeamData.viceCaptain = newPlayerName;
        }

        // Update the teams array and sessionStorage
        this.updateTeamData();

        // Close modal and refresh display
        this.closePlayerOverrideModal();
        this.displayTeamDetails();
        this.populateCaptainSelectors();
        
        // Show success toast instead of alert
        this.components.toast.showSuccess(`Player updated to: ${newPlayerName}`);
    }

    closePlayerOverrideModal() {
        const modal = document.getElementById('player-override-modal');
        if (modal) {
            modal.classList.add('hidden');
        }

        // Remove event listeners
        if (this._escListener) {
            document.removeEventListener('keydown', this._escListener);
            this._escListener = null;
        }
        if (this._outsideClickListener) {
            const modal = document.getElementById('player-override-modal');
            if (modal) {
                modal.removeEventListener('mousedown', this._outsideClickListener);
                this._outsideClickListener = null;
            }
        }

        // Clear override context
        this.currentOverridePlayer = null;
        this.currentOverrideIndex = undefined;
    }

    hideTeamDetails() {
        const teamDetails = document.getElementById('team-details');
        teamDetails.classList.add('hidden');
    }

    populateCaptainSelectors() {
        if (!this.currentTeamData) return;

        const captainSelect = document.getElementById('captain-select');
        const viceCaptainSelect = document.getElementById('vice-captain-select');

        // Clear existing options
        captainSelect.innerHTML = '<option value="">Select Captain</option>';
        viceCaptainSelect.innerHTML = '<option value="">Select Vice-Captain</option>';

        // Get validated players (use validation results if available, otherwise use original players)
        const validatedPlayers = this.currentTeamData.validationResults || 
            this.currentTeamData.players.map(player => ({ validatedName: player, role: 'Unknown', team: 'Unknown' }));

        // Add player options with role and team information
        validatedPlayers.forEach(player => {
            const playerName = player.validatedName || player;
            const role = player.role || 'Unknown';
            const team = player.team || 'Unknown';
            const displayText = `${playerName} (${role} • ${team})`;

            const captainOption = document.createElement('option');
            captainOption.value = playerName;
            captainOption.textContent = displayText;
            captainSelect.appendChild(captainOption);

            const viceCaptainOption = document.createElement('option');
            viceCaptainOption.value = playerName;
            viceCaptainOption.textContent = displayText;
            viceCaptainSelect.appendChild(viceCaptainOption);
        });

        // Set current values if they exist
        if (this.currentTeamData.captain) {
            captainSelect.value = this.currentTeamData.captain;
        }
        if (this.currentTeamData.viceCaptain) {
            viceCaptainSelect.value = this.currentTeamData.viceCaptain;
        }
    }

    handleCaptainSelection(e) {
        if (this.currentTeamData) {
            this.currentTeamData.captain = e.target.value;
            this.updateTeamData();
        }
    }

    handleViceCaptainSelection(e) {
        if (this.currentTeamData) {
            this.currentTeamData.viceCaptain = e.target.value;
            this.updateTeamData();
        }
    }

    updateTeamData() {
        if (this.selectedTeamIndex >= 0) {
            this.currentTeams[this.selectedTeamIndex] = this.currentTeamData;
            sessionStorage.setItem('uploadedTeams', JSON.stringify(this.currentTeams));
        }
    }

    displayTeamsSummary() {
        const summaryList = document.getElementById('teams-summary-list');
        
        if (this.currentTeams.length === 0) {
            summaryList.innerHTML = '<div class="text-center text-gray-500">No teams available</div>';
            return;
        }

        summaryList.innerHTML = this.currentTeams.map((team, index) => `
            <div class="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <div class="flex items-center justify-between mb-2">
                    <h4 class="font-semibold text-sm text-gray-900">${team.name}</h4>
                    <span class="text-xs text-gray-500">${team.players.length} players</span>
                </div>
                <div class="text-xs text-gray-600 mb-2">
                    <div>Captain: ${team.captain || 'Not selected'}</div>
                    <div>Vice-Captain: ${team.viceCaptain || 'Not selected'}</div>
                </div>
                <div class="text-xs text-gray-500">
                    ${team.source === 'screenshot' ? '📸 Screenshot' : '📊 CSV'}
                </div>
            </div>
        `).join('');
    }

    async loadTeamAnalysisData() {
        console.log('Loading additional team analysis data from API...');
        
        if (!this.currentMatchDetails) {
            console.log('No match details available');
            return;
        }

        try {
            // Fetch real data from APIs
            const [teamFormData, headToHeadData] = await Promise.all([
                this.fetchTeamRecentForm(),
                this.fetchHeadToHead()
            ]);

            // Populate with real data
            this.populateTeamFormData(teamFormData);
            this.populateHeadToHeadData(headToHeadData);
            console.log('Additional team analysis data loaded successfully from API');

        } catch (error) {
            console.error('Error loading additional team analysis data:', error);
            this.components.toast.showError('Failed to load additional team analysis data');
        }
    }
    
    populateTeamFormData(data) {
        console.log('Populating team form data with real API data...');
        
        if (!this.currentMatchDetails) return;

        // Helper to get short name
        const getShort = (name) => TabbedTeamAnalysisApp.TEAM_SHORT_NAMES[name] || name;
        const teamAShort = getShort(this.currentMatchDetails.teamA);
        const teamBShort = getShort(this.currentMatchDetails.teamB);

        // Get team logo data
        const teamA = TabbedTeamAnalysisApp.TEAM_LOGOS[this.currentMatchDetails.teamA] || { 
            short: teamAShort, 
            image: null, 
            fallbackColor: 'bg-gray-500' 
        };
        const teamB = TabbedTeamAnalysisApp.TEAM_LOGOS[this.currentMatchDetails.teamB] || { 
            short: teamBShort, 
            image: null, 
            fallbackColor: 'bg-gray-500' 
        };

        // Use real API data or fallback to sample data
        let teamAFormSquares = '';
        let teamBFormSquares = '';
        let teamAWins = 0;
        let teamBWins = 0;

        if (data && data.success && data.data) {
            const teamAData = data.data.teamA;
            const teamBData = data.data.teamB;
            
            // Create form squares for Team A
            if (teamAData && teamAData.matches) {
                teamAFormSquares = teamAData.matches.map(m => {
                    if (m.result === 'Win') {
                        return '<div class="w-4 h-4 bg-green-200 rounded flex items-center justify-center"><span class="text-green-600 font-bold text-xs">W</span></div>';
                    } else if (m.result === 'Loss') {
                        return '<div class="w-4 h-4 bg-red-100 rounded flex items-center justify-center"><span class="text-red-600 font-bold text-xs">L</span></div>';
                    } else {
                        return '<div class="w-4 h-4 bg-gray-100 rounded flex items-center justify-center"><span class="text-gray-500 font-bold text-xs">-</span></div>';
                    }
                }).join('');
                teamAWins = teamAData.matches.filter(m => m.result === 'Win').length;
            }
            
            // Create form squares for Team B
            if (teamBData && teamBData.matches) {
                teamBFormSquares = teamBData.matches.map(m => {
                    if (m.result === 'Win') {
                        return '<div class="w-4 h-4 bg-green-200 rounded flex items-center justify-center"><span class="text-green-600 font-bold text-xs">W</span></div>';
                    } else if (m.result === 'Loss') {
                        return '<div class="w-4 h-4 bg-red-100 rounded flex items-center justify-center"><span class="text-red-600 font-bold text-xs">L</span></div>';
                    } else {
                        return '<div class="w-4 h-4 bg-gray-100 rounded flex items-center justify-center"><span class="text-gray-500 font-bold text-xs">-</span></div>';
                    }
                }).join('');
                teamBWins = teamBData.matches.filter(m => m.result === 'Win').length;
            }
        } else {
            // Fallback to sample data if API fails
            teamAFormSquares = '<div class="w-4 h-4 bg-green-200 rounded flex items-center justify-center"><span class="text-green-600 font-bold text-xs">W</span></div>' +
                              '<div class="w-4 h-4 bg-red-100 rounded flex items-center justify-center"><span class="text-red-600 font-bold text-xs">L</span></div>' +
                              '<div class="w-4 h-4 bg-green-200 rounded flex items-center justify-center"><span class="text-green-600 font-bold text-xs">W</span></div>' +
                              '<div class="w-4 h-4 bg-gray-100 rounded flex items-center justify-center"><span class="text-gray-500 font-bold text-xs">-</span></div>' +
                              '<div class="w-4 h-4 bg-red-100 rounded flex items-center justify-center"><span class="text-red-600 font-bold text-xs">L</span></div>';

            teamBFormSquares = '<div class="w-4 h-4 bg-red-100 rounded flex items-center justify-center"><span class="text-red-600 font-bold text-xs">L</span></div>' +
                              '<div class="w-4 h-4 bg-green-200 rounded flex items-center justify-center"><span class="text-green-600 font-bold text-xs">W</span></div>' +
                              '<div class="w-4 h-4 bg-red-100 rounded flex items-center justify-center"><span class="text-red-600 font-bold text-xs">L</span></div>' +
                              '<div class="w-4 h-4 bg-green-200 rounded flex items-center justify-center"><span class="text-green-600 font-bold text-xs">W</span></div>' +
                              '<div class="w-4 h-4 bg-gray-100 rounded flex items-center justify-center"><span class="text-gray-500 font-bold text-xs">-</span></div>';

            teamAWins = 3;
            teamBWins = 2;
        }

        // Populate team logos and names
        const teamALogoElement = document.getElementById('team-a-logo');
        const teamBLogoElement = document.getElementById('team-b-logo');
        const teamAShortElement = document.getElementById('team-a-short');
        const teamBShortElement = document.getElementById('team-b-short');
        const teamANameElement = document.getElementById('recent-form-team-a-name');
        const teamBNameElement = document.getElementById('recent-form-team-b-name');

        // Update team A logo
        if (teamALogoElement && teamAShortElement) {
            if (teamA.image) {
                teamALogoElement.innerHTML = `<img src="${teamA.image}" alt="${teamA.short}" class="w-full h-full object-contain p-0.5" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"><div class="w-full h-full flex items-center justify-center" style="display: none;"><span class="font-bold text-xs text-gray-700">${teamA.short}</span></div>`;
            } else {
                teamALogoElement.className = `w-full h-full flex items-center justify-center`;
                teamAShortElement.textContent = teamA.short;
            }
        }

        // Update team B logo
        if (teamBLogoElement && teamBShortElement) {
            if (teamB.image) {
                teamBLogoElement.innerHTML = `<img src="${teamB.image}" alt="${teamB.short}" class="w-full h-full object-contain p-0.5" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"><div class="w-full h-full flex items-center justify-center" style="display: none;"><span class="font-bold text-xs text-gray-700">${teamB.short}</span></div>`;
            } else {
                teamBLogoElement.className = `w-full h-full flex items-center justify-center`;
                teamBShortElement.textContent = teamB.short;
            }
        }

        // Populate team names and form data
        if (teamANameElement) teamANameElement.textContent = teamAShort;
        if (teamBNameElement) teamBNameElement.textContent = teamBShort;

        // Populate form squares
        const teamASeqElement = document.getElementById('recent-form-team-a-seq');
        const teamBSeqElement = document.getElementById('recent-form-team-b-seq');
        const teamAWinsElement = document.getElementById('recent-form-team-a-wins');
        const teamBWinsElement = document.getElementById('recent-form-team-b-wins');

        if (teamASeqElement) teamASeqElement.innerHTML = teamAFormSquares;
        if (teamBSeqElement) teamBSeqElement.innerHTML = teamBFormSquares;
        if (teamAWinsElement) teamAWinsElement.textContent = `${teamAWins}/5 wins`;
        if (teamBWinsElement) teamBWinsElement.textContent = `${teamBWins}/5 wins`;

        console.log('Team form data populated successfully');
    }
    
    populateHeadToHeadData(data) {
        console.log('Populating head-to-head data with real API data...');
        if (!this.currentMatchDetails) return;

        // Helper to get short name
        const getShort = (name) => TabbedTeamAnalysisApp.TEAM_SHORT_NAMES[name] || name;
        const teamAShort = getShort(this.currentMatchDetails.teamA);
        const teamBShort = getShort(this.currentMatchDetails.teamB);

        // Use real API data or fallback to sample data
        let teamAWins = 0;
        let teamBWins = 0;
        let totalMatches = 0;
        let teamAWinRate = 0;
        let teamBWinRate = 0;

        if (data && data.success && data.data) {
            teamAWins = data.data.teamAWins || 0;
            teamBWins = data.data.teamBWins || 0;
            totalMatches = data.data.totalMatches || 0;
            
            // Calculate win rates
            if (totalMatches > 0) {
                teamAWinRate = Math.round((teamAWins / totalMatches) * 100);
                teamBWinRate = Math.round((teamBWins / totalMatches) * 100);
            }
        } else {
            // Fallback to sample data if API fails
            teamAWins = 8;
            teamBWins = 7;
            totalMatches = 15;
            teamAWinRate = Math.round((teamAWins / totalMatches) * 100);
            teamBWinRate = Math.round((teamBWins / totalMatches) * 100);
        }

        // Populate individual elements
        const teamAWinsElement = document.getElementById('h2h-team-a-wins');
        const teamBWinsElement = document.getElementById('h2h-team-b-wins');
        const teamANameElement = document.getElementById('h2h-team-a-name');
        const teamBNameElement = document.getElementById('h2h-team-b-name');
        const totalMatchesElement = document.getElementById('h2h-total-matches');
        const teamARateElement = document.getElementById('h2h-team-a-rate');
        const teamBRateElement = document.getElementById('h2h-team-b-rate');

        if (teamAWinsElement) teamAWinsElement.textContent = teamAWins;
        if (teamBWinsElement) teamBWinsElement.textContent = teamBWins;
        if (teamANameElement) teamANameElement.textContent = teamAShort;
        if (teamBNameElement) teamBNameElement.textContent = teamBShort;
        if (totalMatchesElement) totalMatchesElement.textContent = totalMatches;
        if (teamARateElement) teamARateElement.textContent = `${teamAWinRate}% win rate`;
        if (teamBRateElement) teamBRateElement.textContent = `${teamBWinRate}% win rate`;

        console.log('Head-to-head data populated successfully');
    }

    async fetchTeamRecentForm() {
        const response = await fetch(`${CONSTANTS.API_BASE_URL}/team-recent-form`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                teamA: this.currentMatchDetails.teamA,
                teamB: this.currentMatchDetails.teamB,
                matchDate: this.currentMatchDetails.matchDate
            })
        });

        if (!response.ok) throw new Error('Failed to fetch team form data');
        const result = await response.json();
        return result; // Return the full result object
    }

    async fetchHeadToHead() {
        const response = await fetch(`${CONSTANTS.API_BASE_URL}/head-to-head`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                teamA: this.currentMatchDetails.teamA,
                teamB: this.currentMatchDetails.teamB,
                matchDate: this.currentMatchDetails.matchDate
            })
        });

        if (!response.ok) throw new Error('Failed to fetch head-to-head data');
        const result = await response.json();
        return result; // Return the full result object
    }



    async loadVenueAnalysisData() {
        if (!this.currentMatchDetails) return;

        try {
            // Fetch real venue data from API
            const venueStatsData = await this.fetchVenueStats();
            this.displayVenueData(venueStatsData);
        } catch (error) {
            console.error('Error loading venue analysis data:', error);
            this.components.toast.showError('Failed to load venue analysis data');
        }
    }

    async fetchVenueStats() {
        const response = await fetch(`${CONSTANTS.API_BASE_URL}/venue-stats`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                teamA: this.currentMatchDetails.teamA,
                teamB: this.currentMatchDetails.teamB,
                matchDate: this.currentMatchDetails.matchDate
            })
        });

        if (!response.ok) throw new Error('Failed to fetch venue stats');
        const result = await response.json();
        return result; // Return the full result object
    }

    displayVenueData(data) {
        console.log('Displaying venue data...');
        
        try {
            // Helper to get short name
            const getShort = (name) => TabbedTeamAnalysisApp.TEAM_SHORT_NAMES[name] || name;
            const teamAShort = getShort(this.currentMatchDetails.teamA);
            const teamBShort = getShort(this.currentMatchDetails.teamB);
            
            const venueNameElement = document.getElementById('venue-name');
            const venueLocationElement = document.getElementById('venue-location');
            const venuePitchTypeElement = document.getElementById('venue-pitch-type');
            const venue1stInningsElement = document.getElementById('venue-1st-innings');
            const venue2ndInningsElement = document.getElementById('venue-2nd-innings');
            const venueChaseSuccessElement = document.getElementById('venue-chase-success');
            const venueTeamARecordElement = document.getElementById('venue-team-a-record');
            const venueTeamBRecordElement = document.getElementById('venue-team-b-record');
            const venueTossStrategyElement = document.getElementById('venue-toss-strategy');
            const venueTossNoteElement = document.getElementById('venue-toss-note');
            
            if (venueNameElement && venueLocationElement && venuePitchTypeElement && 
                venue1stInningsElement && venue2ndInningsElement && venueChaseSuccessElement &&
                venueTeamARecordElement && venueTeamBRecordElement && venueTossStrategyElement && venueTossNoteElement) {
                
                // Use real API data or fallback to sample data
                if (data && data.success && data.data && data.data.venueStats) {
                    const stats = data.data.venueStats;
                    venueNameElement.textContent = stats.venue_name || 'Unknown Venue';
                    venueLocationElement.textContent = stats.location || 'Unknown Location';
                    venuePitchTypeElement.textContent = `${stats.pitch_type || 'Unknown'} ${stats.pitch_rating ? '(' + stats.pitch_rating + ')' : ''}`;
                    venue1stInningsElement.textContent = stats.avg_first_innings_score || 'N/A';
                    venue2ndInningsElement.textContent = stats.avg_second_innings_score || 'N/A';
                    venueChaseSuccessElement.textContent = stats.chase_success_rate ? stats.chase_success_rate + '%' : 'N/A';
                    
                    // Handle team records from team_venue_performance
                    const teamPerformance = stats.team_venue_performance || {};
                    const teamARecord = teamPerformance[this.currentMatchDetails.teamA]?.record;
                    const teamBRecord = teamPerformance[this.currentMatchDetails.teamB]?.record;
                    
                    venueTeamARecordElement.textContent = teamARecord ? `${teamAShort}: ${teamARecord}` : `${teamAShort}: N/A`;
                    venueTeamBRecordElement.textContent = teamBRecord ? `${teamBShort}: ${teamBRecord}` : `${teamBShort}: N/A`;
                    venueTossStrategyElement.textContent = stats.toss_decision_suggestion || 'N/A';
                    venueTossNoteElement.textContent = stats.chase_success_rate ? `Chase success rate: ${stats.chase_success_rate}%` : 'N/A';
                } else {
                    // Fallback to sample data if API fails
                    venueNameElement.textContent = 'M. Chinnaswamy Stadium';
                    venueLocationElement.textContent = 'Bangalore, Karnataka';
                    venuePitchTypeElement.textContent = 'Batting Friendly';
                    venue1stInningsElement.textContent = '185';
                    venue2ndInningsElement.textContent = '165';
                    venueChaseSuccessElement.textContent = '45%';
                    venueTeamARecordElement.textContent = `${teamAShort}: 8/12`;
                    venueTeamBRecordElement.textContent = `${teamBShort}: 5/10`;
                    venueTossStrategyElement.textContent = 'Prefer Batting First';
                    venueTossNoteElement.textContent = 'Low chase success rate';
                }
                
                console.log('Venue data displayed successfully');
            } else {
                console.error('Some venue elements not found');
            }
        } catch (error) {
            console.error('Error displaying venue data:', error);
        }
    }

    loadTeamDetailsData() {
        // Auto-select the first team if available
        const teamSelector = document.getElementById('team-selector');
        if (teamSelector && teamSelector.options.length > 0) {
            teamSelector.selectedIndex = 1; // Select first team (no placeholder anymore)
            this.handleTeamSelection({ target: teamSelector });
        }
    }

    async loadMatchStatsData() {
        if (!this.currentMatchDetails) return;

        try {
            // Load both team analysis and venue analysis data
            await Promise.all([
                this.loadTeamAnalysisData(),
                this.loadVenueAnalysisData()
            ]);
        } catch (error) {
            console.error('Error loading match stats data:', error);
            this.components.toast.showError('Failed to load match statistics');
        }
    }

    loadTeamComparisonData() {
        // Team comparison data loading logic
        console.log('Loading team comparison data...');
        // This will be implemented when team comparison feature is ready
    }

    loadTeamsSummaryData() {
        // Teams summary is loaded when tab is switched
        // Data is already populated from displayTeamsSummary
    }

    populateAnalysisData() {
        // Populate data for all tabs
        this.loadTeamAnalysisData();
        this.loadVenueAnalysisData();
    }

    async analyzeAllTeams() {
        if (this.currentTeams.length === 0) {
            this.components.toast.showError('No teams available for analysis');
            return;
        }

        try {
            this.components.toast.showSuccess('Starting analysis...');
            
            // Analyze each team
            const analysisPromises = this.currentTeams.map(async (team) => {
                if (!team.captain || !team.viceCaptain) {
                    return { team: team.name, error: 'Captain/Vice-captain not selected' };
                }

                const analysisData = {
                    teamA: this.currentMatchDetails.teamA,
                    teamB: this.currentMatchDetails.teamB,
                    matchDate: this.currentMatchDetails.matchDate,
                    players: team.players,
                    captain: team.captain,
                    viceCaptain: team.viceCaptain
                };

                try {
                    const summary = await this.components.teamAnalysis.generateTeamSummary(analysisData);
                    return { team: team.name, summary };
                } catch (error) {
                    return { team: team.name, error: error.message };
                }
            });

            const results = await Promise.all(analysisPromises);
            
            // Display results
            this.displayAnalysisResults(results);
            
        } catch (error) {
            console.error('Analysis error:', error);
            this.components.toast.showError('Failed to analyze teams');
        }
    }

    displayAnalysisResults(results) {
        // Create a modal or expand the teams summary to show results
        const summaryList = document.getElementById('teams-summary-list');
        
        summaryList.innerHTML = results.map(result => `
            <div class="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                <h4 class="font-semibold text-sm text-gray-900 mb-2">${result.team}</h4>
                ${result.error ? 
                    `<div class="text-red-600 text-xs">${result.error}</div>` :
                    `<div class="text-sm text-gray-700 whitespace-pre-line">${result.summary}</div>`
                }
            </div>
        `).join('');

        this.components.toast.showSuccess('Analysis completed!');
    }

    compareTeams() {
        if (this.currentTeams.length < 2) {
            this.components.toast.showError('Need at least 2 teams to compare');
            return;
        }

        // Implement team comparison logic
        this.components.toast.showSuccess('Team comparison feature coming soon!');
    }

    // Loading and error handling methods
    showTabLoading(tabName) {
        const contentId = `${tabName}-content`;
        const content = document.getElementById(contentId);
        
        if (content) {
            // Store original content if not already stored
            if (!content.dataset.originalContent) {
                content.dataset.originalContent = content.innerHTML;
            }
            
            const loadingHtml = `
                <div class="flex items-center justify-center py-8">
                    <div class="relative">
                        <div class="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                    </div>
                    <span class="ml-3 text-sm text-gray-600">Loading ${tabName.replace('-', ' ')}...</span>
                </div>
            `;
            content.innerHTML = loadingHtml;
        }
    }

    hideTabLoading(tabName) {
        const contentId = `${tabName}-content`;
        const content = document.getElementById(contentId);
        
        if (content && content.dataset.originalContent) {
            // Restore original content if it was stored
            content.innerHTML = content.dataset.originalContent;
            delete content.dataset.originalContent;
        }
    }

    showTabError(tabName) {
        const contentId = `${tabName}-content`;
        const content = document.getElementById(contentId);
        
        if (content) {
            const errorHtml = `
                <div class="flex items-center justify-center py-8">
                    <div class="text-center">
                        <div class="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                            <svg class="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                            </svg>
                        </div>
                        <p class="text-sm text-gray-600">Failed to load data</p>
                        <button onclick="window.location.reload()" class="mt-2 text-xs text-primary hover:underline">Try again</button>
                    </div>
                </div>
            `;
            content.innerHTML = errorHtml;
        }
    }

    // Helper method to get team short name
    getTeamShortName(fullTeamName) {
        return TabbedTeamAnalysisApp.TEAM_SHORT_NAMES[fullTeamName] || fullTeamName;
    }

    // Mapping of full team names to short forms
    static TEAM_SHORT_NAMES = {
        'Chennai Super Kings': 'CSK',
        'Mumbai Indians': 'MI',
        'Royal Challengers Bengaluru': 'RCB',
        'Sunrisers Hyderabad': 'SRH',
        'Rajasthan Royals': 'RR',
        'Delhi Capitals': 'DC',
        'Kolkata Knight Riders': 'KKR',
        'Punjab Kings': 'PBKS',
        'Lucknow Super Giants': 'LSG',
        'Gujarat Titans': 'GT',
        // Add more as needed
    };

    // Team logo and external URL mapping
    static TEAM_LOGOS = {
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
}

// Initialize the tabbed app when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.tabbedApp = new TabbedTeamAnalysisApp();
}); 