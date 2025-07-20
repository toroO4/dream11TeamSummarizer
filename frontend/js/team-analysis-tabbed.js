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
        this.components.toast.initialize('error-toast', 'error-message', 'success-toast', 'success-message');
        
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

        // Generate comprehensive team analysis
        const teamAnalysis = this.generateComprehensiveTeamAnalysis();
        
        summaryList.innerHTML = `
            <!-- Team Categorization -->
            <div class="space-y-4">
                <!-- Basic Team List -->
                <div class="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                    <h4 class="font-semibold text-sm text-gray-900 mb-3 flex items-center">
                        <span class="text-primary mr-2">📊</span>
                        Uploaded Teams (${this.currentTeams.length})
                    </h4>
                    <div class="space-y-2">
                        ${this.currentTeams.map((team, index) => `
            <div class="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <div class="flex items-center justify-between mb-2">
                                    <h5 class="font-semibold text-sm text-gray-900">${team.name}</h5>
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
                        `).join('')}
                    </div>
                </div>

                <!-- Team Categorization -->
                <div class="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                    <h4 class="font-semibold text-sm text-gray-900 mb-3 flex items-center">
                        <span class="text-primary mr-2">🏏</span>
                        Pre-Match Insights
                    </h4>
                    <div class="space-y-3">
                        ${this.renderTeamCategorization(teamAnalysis)}
                    </div>
                </div>

                <!-- Player Analysis -->
                <div class="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                    <h4 class="font-semibold text-sm text-gray-900 mb-3 flex items-center">
                        <span class="text-primary mr-2">👥</span>
                        Player Analysis
                    </h4>
                    <div class="space-y-3">
                        ${this.renderPlayerAnalysis(teamAnalysis)}
                    </div>
                </div>

                <!-- Suggested Fixes -->
                <div class="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                    <h4 class="font-semibold text-sm text-gray-900 mb-3 flex items-center">
                        <span class="text-primary mr-2">💡</span>
                        Suggested Fixes
                    </h4>
                    <div class="space-y-2">
                        ${this.renderSuggestedFixes(teamAnalysis)}
                    </div>
                </div>
            </div>
        `;
    }

    generateComprehensiveTeamAnalysis() {
        const allPlayers = [];
        const playerCounts = {};
        const teamCompositions = [];
        const indianPlayers = [];
        const englishPlayers = [];
        const battingHeavyTeams = [];
        const bowlingHeavyTeams = [];

        // Collect all players and analyze teams
        this.currentTeams.forEach((team, teamIndex) => {
            const teamPlayers = team.players || [];
            const composition = this.analyzeTeamComposition(teamPlayers);
            
            teamCompositions.push({
                teamName: team.name,
                composition,
                players: teamPlayers
            });

            // Categorize by nationality and count players
            teamPlayers.forEach(player => {
                const playerLower = player.toLowerCase();
                
                // Check for Indian players
                if (this.isIndianPlayer(playerLower)) {
                    indianPlayers.push({ player, team: team.name });
                }
                
                // Check for English players
                if (this.isEnglishPlayer(playerLower)) {
                    englishPlayers.push({ player, team: team.name });
                }
                
                // Count player occurrences (normalize player names)
                const normalizedPlayer = this.normalizePlayerName(player);
                playerCounts[normalizedPlayer] = (playerCounts[normalizedPlayer] || 0) + 1;
                allPlayers.push(normalizedPlayer);
            });

            // Categorize by playing style
            if (composition.batsmen > composition.bowlers) {
                battingHeavyTeams.push(team.name);
            } else if (composition.bowlers > composition.batsmen) {
                bowlingHeavyTeams.push(team.name);
            }
        });

        // Find popular players not in any team
        const popularPlayersNotSelected = this.findPopularPlayersNotSelected(playerCounts);

        return {
            totalTeams: this.currentTeams.length,
            playerCounts,
            teamCompositions,
            indianPlayers,
            englishPlayers,
            battingHeavyTeams,
            bowlingHeavyTeams,
            popularPlayersNotSelected,
            allPlayers: [...new Set(allPlayers)]
        };
    }

    normalizePlayerName(playerName) {
        // Normalize player names to handle variations
        const name = playerName.toLowerCase().trim();
        
        // Handle common variations
        const nameMap = {
            'v kohli': 'Virat Kohli',
            'virat': 'Virat Kohli',
            'kohli': 'Virat Kohli',
            'r sharma': 'Rohit Sharma',
            'rohit': 'Rohit Sharma',
            'sharma': 'Rohit Sharma',
            'ms dhoni': 'MS Dhoni',
            'dhoni': 'MS Dhoni',
            'j bumrah': 'Jasprit Bumrah',
            'bumrah': 'Jasprit Bumrah',
            'y chahal': 'Yuzvendra Chahal',
            'chahal': 'Yuzvendra Chahal',
            'b stokes': 'Ben Stokes',
            'stokes': 'Ben Stokes',
            'j buttler': 'Jos Buttler',
            'buttler': 'Jos Buttler',
            'p salt': 'Phil Salt',
            'salt': 'Phil Salt',
            'r patidar': 'Rajat Patidar',
            'patidar': 'Rajat Patidar'
        };
        
        return nameMap[name] || playerName;
    }

    analyzeTeamComposition(players) {
        const batsmen = players.filter(p => this.isBatsman(p)).length;
        const bowlers = players.filter(p => this.isBowler(p)).length;
        const allRounders = players.filter(p => this.isAllRounder(p)).length;
        const wicketKeepers = players.filter(p => this.isWicketKeeper(p)).length;
        
        return { batsmen, bowlers, allRounders, wicketKeepers };
    }

    isBatsman(player) {
        const playerLower = player.toLowerCase();
        return !this.isBowler(playerLower) && !this.isAllRounder(playerLower) && !this.isWicketKeeper(playerLower);
    }

    isBowler(player) {
        const playerLower = player.toLowerCase();
        return playerLower.includes('bumrah') || playerLower.includes('chahal') || 
               playerLower.includes('shami') || playerLower.includes('kumar') || 
               playerLower.includes('hazlewood') || playerLower.includes('boult') || 
               playerLower.includes('archer') || playerLower.includes('nortje') ||
               playerLower.includes('rabada') || playerLower.includes('starc') ||
               playerLower.includes('rashid') || playerLower.includes('varun') ||
               playerLower.includes('siraj') || playerLower.includes('natarajan');
    }

    isAllRounder(player) {
        const playerLower = player.toLowerCase();
        return playerLower.includes('stokes') || playerLower.includes('jadeja') || 
               playerLower.includes('stoinis') || playerLower.includes('pandya') ||
               playerLower.includes('maxwell') || playerLower.includes('russell') ||
               playerLower.includes('curran') || playerLower.includes('holder');
    }

    isWicketKeeper(player) {
        const playerLower = player.toLowerCase();
        return playerLower.includes('pant') || playerLower.includes('salt') || 
               playerLower.includes('rahul') || playerLower.includes('buttler') ||
               playerLower.includes('kishan') || playerLower.includes('bairstow') ||
               playerLower.includes('pope') || playerLower.includes('foakes');
    }

    isIndianPlayer(player) {
        return player.includes('kohli') || player.includes('rohit') || player.includes('dhoni') ||
               player.includes('pant') || player.includes('rahul') || player.includes('kishan') ||
               player.includes('jadeja') || player.includes('bumrah') || player.includes('chahal') ||
               player.includes('shami') || player.includes('kumar') || player.includes('pandya') ||
               player.includes('patidar') || player.includes('gill') || player.includes('iyer');
    }

    isEnglishPlayer(player) {
        return player.includes('stokes') || player.includes('buttler') || player.includes('bairstow') ||
               player.includes('pope') || player.includes('foakes') || player.includes('salt') ||
               player.includes('curran') || player.includes('archer') || player.includes('holder') ||
               player.includes('root') || player.includes('morgan') || player.includes('brook');
    }

    findPopularPlayersNotSelected(playerCounts) {
        // Popular players that should be considered but aren't in any team
        // Only include players that are NOT currently selected in any team
        const popularPlayers = [
            'Travis Head', 'Rashid Khan', 'Andre Russell', 'Glenn Maxwell',
            'Jos Buttler', 'Ben Stokes', 'Jasprit Bumrah', 'Yuzvendra Chahal',
            'Hardik Pandya', 'Ravindra Jadeja', 'MS Dhoni', 'Rohit Sharma',
            'Virat Kohli', 'Rohit Sharma', 'KL Rahul', 'Rishabh Pant'
        ];

        // Filter out players that are already selected and normalize names
        return popularPlayers.filter(player => {
            const normalizedPlayer = this.normalizePlayerName(player);
            return !playerCounts[normalizedPlayer];
        });
    }

    renderTeamCategorization(analysis) {
        const categories = [];

        // IND heavy vs ENG heavy
        const indTeams = [...new Set(analysis.indianPlayers.map(p => p.team))];
        const engTeams = [...new Set(analysis.englishPlayers.map(p => p.team))];
        
        if (indTeams.length > engTeams.length) {
            categories.push({
                type: 'IND Heavy',
                description: `${indTeams.length} teams favor Indian players`,
                color: 'bg-orange-100 text-orange-800 border-orange-200'
            });
        } else if (engTeams.length > indTeams.length) {
            categories.push({
                type: 'ENG Heavy',
                description: `${engTeams.length} teams favor English players`,
                color: 'bg-blue-100 text-blue-800 border-blue-200'
            });
        } else {
            categories.push({
                type: 'Balanced',
                description: 'Equal mix of IND and ENG players',
                color: 'bg-green-100 text-green-800 border-green-200'
            });
        }

        // Batting Heavy vs Bowling Heavy
        if (analysis.battingHeavyTeams.length > analysis.bowlingHeavyTeams.length) {
            categories.push({
                type: 'Batting Heavy',
                description: `${analysis.battingHeavyTeams.length} teams favor batsmen`,
                color: 'bg-red-100 text-red-800 border-red-200'
            });
        } else if (analysis.bowlingHeavyTeams.length > analysis.battingHeavyTeams.length) {
            categories.push({
                type: 'Bowling Heavy',
                description: `${analysis.bowlingHeavyTeams.length} teams favor bowlers`,
                color: 'bg-purple-100 text-purple-800 border-purple-200'
            });
        } else {
            categories.push({
                type: 'Balanced',
                description: 'Equal batting and bowling focus',
                color: 'bg-green-100 text-green-800 border-green-200'
            });
        }

        return categories.map(category => `
            <div class="flex items-center justify-between p-3 rounded-lg border ${category.color}">
                <div class="flex items-center">
                    <span class="font-semibold text-sm">${category.type}</span>
                </div>
                <div class="text-xs text-right">${category.description}</div>
            </div>
        `).join('');
    }

    renderPlayerAnalysis(analysis) {
        const sections = [];

        // Picked across all teams
        const pickedInAllTeams = Object.entries(analysis.playerCounts)
            .filter(([player, count]) => count === analysis.totalTeams)
            .map(([player]) => player);

        if (pickedInAllTeams.length > 0) {
            sections.push(`
                <div class="bg-green-50 p-3 rounded-lg border border-green-200">
                    <div class="font-semibold text-sm text-green-800 mb-1">Picked in All Teams</div>
                    <div class="text-xs text-green-700">${pickedInAllTeams.slice(0, 3).join(', ')}${pickedInAllTeams.length > 3 ? '...' : ''}</div>
                </div>
            `);
        }

        // Average selected by %
        const uniquePlayers = Object.keys(analysis.playerCounts).length;
        let totalSelectionRate = 0;
        
        if (uniquePlayers > 0 && analysis.totalTeams > 0) {
            // Calculate selection rate for each player and sum them up
            Object.values(analysis.playerCounts).forEach(count => {
                const playerSelectionRate = (count / analysis.totalTeams) * 100;
                totalSelectionRate += playerSelectionRate;
            });
            
            // Calculate average selection rate
            const averageSelectionRate = totalSelectionRate / uniquePlayers;
            const selectionPercentage = averageSelectionRate.toFixed(1);
            
            sections.push(`
                <div class="bg-blue-50 p-3 rounded-lg border border-blue-200">
                    <div class="font-semibold text-sm text-blue-800 mb-1">Average Selection Rate</div>
                    <div class="text-xs text-blue-700">${selectionPercentage}% of teams pick each player</div>
                </div>
            `);
        } else {
            sections.push(`
                <div class="bg-blue-50 p-3 rounded-lg border border-blue-200">
                    <div class="font-semibold text-sm text-blue-800 mb-1">Average Selection Rate</div>
                    <div class="text-xs text-blue-700">No players selected</div>
                </div>
            `);
        }

        // Not picked but popular
        if (analysis.popularPlayersNotSelected.length > 0) {
            sections.push(`
                <div class="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                    <div class="font-semibold text-sm text-yellow-800 mb-1">Popular but Not Selected</div>
                    <div class="text-xs text-yellow-700">${analysis.popularPlayersNotSelected.slice(0, 3).join(', ')}${analysis.popularPlayersNotSelected.length > 3 ? '...' : ''}</div>
                </div>
            `);
        }

        return sections.join('');
    }

    renderSuggestedFixes(analysis) {
        const fixes = [];

        // Missing key players - dynamic based on current selections
        const keyPlayers = ['Travis Head', 'Rashid Khan', 'Andre Russell', 'Glenn Maxwell'];
        const missingKeyPlayers = keyPlayers.filter(player => {
            const normalizedPlayer = this.normalizePlayerName(player);
            return !analysis.playerCounts[normalizedPlayer];
        });

        if (missingKeyPlayers.length > 0) {
            const player = missingKeyPlayers[0];
            const suggestedTeams = Math.min(2, analysis.totalTeams);
            fixes.push(`
                <div class="flex items-start space-x-2 p-3 bg-red-50 rounded-lg border border-red-200">
                    <span class="text-red-500 mt-0.5">⚠️</span>
                    <div class="flex-1">
                        <div class="font-semibold text-sm text-red-800">Missing Key Player</div>
                        <div class="text-xs text-red-700">Add ${player} to ${suggestedTeams} teams</div>
                    </div>
                </div>
            `);
        }

        // Balance issues with specific reasons
        const unbalancedTeams = analysis.teamCompositions.filter(comp => {
            const balance = Math.abs(comp.composition.batsmen - comp.composition.bowlers);
            return balance > 2;
        });

        if (unbalancedTeams.length > 0) {
            const team = unbalancedTeams[0];
            const batsmenCount = team.composition.batsmen;
            const bowlersCount = team.composition.bowlers;
            let reason = '';
            
            if (batsmenCount > bowlersCount + 2) {
                reason = 'Too many batsmen, need more bowlers';
            } else if (bowlersCount > batsmenCount + 2) {
                reason = 'Too many bowlers, need more batsmen';
            } else {
                reason = 'Unbalanced composition';
            }

            fixes.push(`
                <div class="flex items-start space-x-2 p-3 bg-orange-50 rounded-lg border border-orange-200">
                    <span class="text-orange-500 mt-0.5">⚖️</span>
                    <div class="flex-1">
                        <div class="font-semibold text-sm text-orange-800">Balance Issue</div>
                        <div class="text-xs text-orange-700">${unbalancedTeams.length} teams need better balance - ${reason}</div>
                    </div>
                </div>
            `);
        }

        // Captaincy suggestions
        const teamsWithoutCaptain = this.currentTeams.filter(team => !team.captain || !team.viceCaptain);
        if (teamsWithoutCaptain.length > 0) {
            fixes.push(`
                <div class="flex items-start space-x-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <span class="text-blue-500 mt-0.5">👑</span>
                    <div class="flex-1">
                        <div class="font-semibold text-sm text-blue-800">Captain Selection</div>
                        <div class="text-xs text-blue-700">Select captain for ${teamsWithoutCaptain.length} teams</div>
                    </div>
                </div>
            `);
        }

        return fixes.length > 0 ? fixes.join('') : `
            <div class="text-center text-gray-500 text-sm py-4">
                All teams look well-balanced! 🎉
            </div>
        `;
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
        console.log('Loading team comparison data...');
        
        // Always hide comparison sections initially - they will be shown only after clicking compare button
        document.getElementById('comparison-table-section').classList.add('hidden');
        
        // Check team count and show appropriate message
        if (this.currentTeams.length < 2) {
            document.getElementById('team-count-check').classList.remove('hidden');
        } else {
            document.getElementById('team-count-check').classList.add('hidden');
        }
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
        
        summaryList.innerHTML = results.map(result => {
            if (result.error) {
                return `
                    <div class="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                        <h4 class="font-semibold text-sm text-gray-900 mb-2">${result.team}</h4>
                        <div class="text-red-600 text-xs">${result.error}</div>
                    </div>
                `;
            }
            
            // Convert markdown headers to HTML and format the structured analysis
            const formattedSummary = result.summary
                .replace(/\*\*(.*?)\*\*/g, '<strong class="text-primary font-semibold">$1</strong>')
                .replace(/\n/g, '<br>');
            
            return `
                <div class="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                    <h4 class="font-semibold text-sm text-gray-900 mb-3">${result.team}</h4>
                    <div class="text-sm text-gray-700 space-y-2">${formattedSummary}</div>
                </div>
            `;
        }).join('');

        this.components.toast.showSuccess('Analysis completed!');
    }

    async compareTeams() {
        if (this.currentTeams.length < 2) {
            this.components.toast.showError('Need at least 2 teams to compare');
            return;
        }

        try {
            // Show loading state
            this.showComparisonLoading(true);
            
            // Check if teams have captain/vice-captain selected
            const incompleteTeams = this.currentTeams.filter(team => !team.captain || !team.viceCaptain);
            if (incompleteTeams.length > 0) {
                this.components.toast.showError(`Please select captain and vice-captain for all teams first`);
                return;
            }

            // Generate comparison data
            const comparisonData = await this.generateComparisonData();
            
            // Display comparison results
            this.displayComparisonResults(comparisonData);
            
            // Generate AI recommendations
            await this.generateAIRecommendations(comparisonData);
            
            this.components.toast.showSuccess(`Successfully compared ${this.currentTeams.length} teams`);
            
        } catch (error) {
            console.error('Team comparison error:', error);
            this.components.toast.showError('Failed to compare teams. Please try again.');
        } finally {
            this.showComparisonLoading(false);
        }
    }

    async generateComparisonData() {
        const comparisonData = {
            teams: this.currentTeams.map((team, index) => {
                // Calculate team composition
                const batsmen = team.players.filter(p => 
                    !p.toLowerCase().includes('bumrah') && 
                    !p.toLowerCase().includes('chahal') && 
                    !p.toLowerCase().includes('shami') && 
                    !p.toLowerCase().includes('kumar') && 
                    !p.toLowerCase().includes('hazlewood') &&
                    !p.toLowerCase().includes('boult') &&
                    !p.toLowerCase().includes('archer')
                ).length;
                
                const bowlers = team.players.filter(p => 
                    p.toLowerCase().includes('bumrah') || 
                    p.toLowerCase().includes('chahal') || 
                    p.toLowerCase().includes('shami') || 
                    p.toLowerCase().includes('kumar') || 
                    p.toLowerCase().includes('hazlewood') ||
                    p.toLowerCase().includes('boult') ||
                    p.toLowerCase().includes('archer')
                ).length;
                
                const allRounders = team.players.filter(p => 
                    p.toLowerCase().includes('stokes') || 
                    p.toLowerCase().includes('jadeja') || 
                    p.toLowerCase().includes('stoinis') || 
                    p.toLowerCase().includes('pandya') ||
                    p.toLowerCase().includes('maxwell') ||
                    p.toLowerCase().includes('russell')
                ).length;
                
                const wicketKeepers = team.players.filter(p => 
                    p.toLowerCase().includes('pant') || 
                    p.toLowerCase().includes('salt') || 
                    p.toLowerCase().includes('rahul') ||
                    p.toLowerCase().includes('buttler') ||
                    p.toLowerCase().includes('kishan')
                ).length;

                // Calculate team balance score (1-10)
                const balanceScore = this.calculateTeamBalance(batsmen, bowlers, allRounders, wicketKeepers);
                
                // Calculate overall rating based on composition and captaincy
                const overallRating = this.calculateOverallRating(balanceScore, team.captain, team.viceCaptain);

                return {
                    id: team.id || index + 1,
                    name: team.name || `Team ${index + 1}`,
                    players: team.players,
                    captain: team.captain,
                    viceCaptain: team.viceCaptain,
                    composition: {
                        batsmen,
                        bowlers,
                        allRounders,
                        wicketKeepers
                    },
                    balanceScore,
                    overallRating
                };
            }),
            matchDetails: this.currentMatchDetails
        };

        return comparisonData;
    }

    calculateTeamBalance(batsmen, bowlers, allRounders, wicketKeepers) {
        // Ideal composition: 4-5 batsmen, 3-4 bowlers, 1-2 all-rounders, 1 wicket-keeper
        let score = 5; // Base score
        
        // Batsmen balance (ideal: 4-5)
        if (batsmen >= 4 && batsmen <= 5) score += 2;
        else if (batsmen >= 3 && batsmen <= 6) score += 1;
        else score -= 1;
        
        // Bowlers balance (ideal: 3-4)
        if (bowlers >= 3 && bowlers <= 4) score += 2;
        else if (bowlers >= 2 && bowlers <= 5) score += 1;
        else score -= 1;
        
        // All-rounders balance (ideal: 1-2)
        if (allRounders >= 1 && allRounders <= 2) score += 1;
        else if (allRounders === 0 || allRounders === 3) score += 0.5;
        else score -= 0.5;
        
        // Wicket-keeper balance (ideal: 1)
        if (wicketKeepers === 1) score += 1;
        else if (wicketKeepers === 0) score -= 1;
        else score -= 0.5;
        
        return Math.max(1, Math.min(10, Math.round(score)));
    }

    calculateOverallRating(balanceScore, captain, viceCaptain) {
        let rating = balanceScore;
        
        // Bonus for good captain/vice-captain choices
        if (captain && viceCaptain && captain !== viceCaptain) {
            rating += 1;
        }
        
        // Penalty for missing captain/vice-captain
        if (!captain || !viceCaptain) {
            rating -= 2;
        }
        
        return Math.max(1, Math.min(10, Math.round(rating)));
    }

    displayComparisonResults(comparisonData) {
        // Show comparison table
        document.getElementById('team-count-check').classList.add('hidden');
        document.getElementById('comparison-table-section').classList.remove('hidden');
        
        // Populate comparison table
        const tableBody = document.getElementById('comparison-table-body');
        tableBody.innerHTML = comparisonData.teams.map(team => `
            <tr class="border-b border-gray-100 hover:bg-gray-50">
                <td class="px-4 py-3">
                    <div class="font-semibold text-sm text-gray-900">${team.name}</div>
                    <div class="text-xs text-gray-500">${team.players.length} players</div>
                </td>
                <td class="px-4 py-3 text-center">
                    <div class="text-sm font-medium text-gray-900">${team.players.length}</div>
                </td>
                <td class="px-4 py-3 text-center">
                    <div class="text-sm text-gray-900">${team.captain || 'Not set'}</div>
                </td>
                <td class="px-4 py-3 text-center">
                    <div class="text-sm text-gray-900">${team.viceCaptain || 'Not set'}</div>
                </td>
                <td class="px-4 py-3 text-center">
                    <div class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        team.balanceScore >= 8 ? 'bg-green-100 text-green-800' :
                        team.balanceScore >= 6 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                    }">
                        ${team.balanceScore}/10
                    </div>
                </td>
                <td class="px-4 py-3 text-center">
                    <div class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        team.overallRating >= 8 ? 'bg-green-100 text-green-800' :
                        team.overallRating >= 6 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                    }">
                        ${team.overallRating}/10
                    </div>
                </td>
            </tr>
        `).join('');

        // Display composition charts
        this.displayCompositionCharts(comparisonData.teams);
        
        // Display player overlap analysis
        this.displayPlayerOverlap(comparisonData.teams);
    }

    displayCompositionCharts(teams) {
        const chartContainer = document.getElementById('composition-chart');
        chartContainer.innerHTML = teams.map(team => `
            <div class="bg-gray-50 rounded-lg p-3 sm:p-4">
                <h5 class="font-semibold text-sm sm:text-base text-gray-900 mb-3">${team.name}</h5>
                <div class="space-y-3 sm:space-y-4">
                    <div class="flex justify-between items-center">
                        <span class="text-xs sm:text-sm font-medium text-gray-700">Batsmen</span>
                        <span class="text-sm sm:text-base font-bold text-blue-600">${team.composition.batsmen}</span>
                    </div>
                    <div class="w-full bg-gray-200 rounded-full h-2 sm:h-3">
                        <div class="bg-blue-500 h-2 sm:h-3 rounded-full transition-all duration-300" style="width: ${(team.composition.batsmen / 11) * 100}%"></div>
                    </div>
                    
                    <div class="flex justify-between items-center">
                        <span class="text-xs sm:text-sm font-medium text-gray-700">Bowlers</span>
                        <span class="text-sm sm:text-base font-bold text-red-600">${team.composition.bowlers}</span>
                    </div>
                    <div class="w-full bg-gray-200 rounded-full h-2 sm:h-3">
                        <div class="bg-red-500 h-2 sm:h-3 rounded-full transition-all duration-300" style="width: ${(team.composition.bowlers / 11) * 100}%"></div>
                    </div>
                    
                    <div class="flex justify-between items-center">
                        <span class="text-xs sm:text-sm font-medium text-gray-700">All-Rounders</span>
                        <span class="text-sm sm:text-base font-bold text-green-600">${team.composition.allRounders}</span>
                    </div>
                    <div class="w-full bg-gray-200 rounded-full h-2 sm:h-3">
                        <div class="bg-green-500 h-2 sm:h-3 rounded-full transition-all duration-300" style="width: ${(team.composition.allRounders / 11) * 100}%"></div>
                    </div>
                    
                    <div class="flex justify-between items-center">
                        <span class="text-xs sm:text-sm font-medium text-gray-700">Wicket-Keepers</span>
                        <span class="text-sm sm:text-base font-bold text-purple-600">${team.composition.wicketKeepers}</span>
                    </div>
                    <div class="w-full bg-gray-200 rounded-full h-2 sm:h-3">
                        <div class="bg-purple-500 h-2 sm:h-3 rounded-full transition-all duration-300" style="width: ${(team.composition.wicketKeepers / 11) * 100}%"></div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    displayPlayerOverlap(teams) {
        const overlapContainer = document.getElementById('overlap-analysis');
        
        // Find common players across teams
        const playerCounts = {};
        teams.forEach(team => {
            team.players.forEach(player => {
                playerCounts[player] = (playerCounts[player] || 0) + 1;
            });
        });

        const commonPlayers = Object.entries(playerCounts)
            .filter(([player, count]) => count > 1)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 10);

        if (commonPlayers.length === 0) {
            overlapContainer.innerHTML = `
                <div class="text-center py-4 text-gray-500">
                    <p class="text-sm">No common players found across teams</p>
                </div>
            `;
            return;
        }

        overlapContainer.innerHTML = `
            <div class="text-sm text-gray-700 mb-2">Most commonly selected players:</div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                ${commonPlayers.map(([player, count]) => `
                    <div class="flex justify-between items-center bg-gray-50 rounded px-3 py-2">
                        <span class="text-sm font-medium">${player}</span>
                        <span class="text-xs bg-primary text-white px-2 py-1 rounded-full">${count} teams</span>
                    </div>
                `).join('')}
            </div>
        `;
    }

    async generateAIRecommendations(comparisonData) {
        try {
            // Prepare data for AI analysis
            const teamsData = comparisonData.teams.map(team => ({
                name: team.name,
                players: team.players.join(', '),
                captain: team.captain,
                viceCaptain: team.viceCaptain,
                composition: team.composition,
                balanceScore: team.balanceScore,
                overallRating: team.overallRating
            }));

            const analysisData = {
                teams: teamsData,
                teamA: comparisonData.matchDetails.teamA,
                teamB: comparisonData.matchDetails.teamB,
                matchDate: comparisonData.matchDetails.matchDate
            };

            // Call AI analysis service
            const response = await fetch(`${API_BASE_URL}/analyze-multiple`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(analysisData)
            });

            const result = await response.json();

            if (result.success) {
                this.generateComprehensiveRecommendation(comparisonData, result.analysis);
            } else {
                throw new Error(result.message || 'AI analysis failed');
            }

        } catch (error) {
            console.error('AI recommendation error:', error);
            // Fallback to basic recommendation
            this.generateBasicRecommendation(comparisonData);
        }
    }



    generateComprehensiveRecommendation(comparisonData, aiAnalysis) {
        const recommendationContainer = document.getElementById('recommendation-content');
        
        if (comparisonData.teams.length === 1) {
            recommendationContainer.innerHTML = `
                <p class="text-sm text-gray-700">Only one team uploaded. Please upload more teams for comparison.</p>
            `;
            return;
        }

        // Analyze patterns and create comprehensive summary
        const patterns = this.analyzeTeamPatterns(comparisonData);
        const scenarioRecommendations = this.generateScenarioRecommendations(comparisonData);
        const overallSummary = this.generateOverallSummary(comparisonData, patterns);

        const recommendationText = `
            <div class="space-y-6">
                <!-- Overall Summary -->
                <div class="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                    <div class="bg-gradient-to-r from-green-600 to-green-700 px-6 py-4">
                        <h4 class="font-bold text-xl text-white flex items-center">
                            <svg class="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                            </svg>
                            Expert Analysis Summary
                        </h4>
                    </div>
                    <div class="p-6">
                        <div class="text-sm text-gray-700 leading-relaxed">${overallSummary}</div>
                    </div>
                </div>

                <!-- Team Patterns -->
                <div class="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                    <div class="bg-gradient-to-r from-green-600 to-green-700 px-6 py-4">
                        <h4 class="font-bold text-xl text-white flex items-center">
                            <svg class="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/>
                            </svg>
                            Team Patterns & Strategies
                        </h4>
                    </div>
                    <div class="p-6">
                        <div class="space-y-4">
                            ${patterns.map(pattern => `
                                <div class="bg-gray-50 rounded-lg p-4 border border-gray-100">
                                    <h5 class="font-semibold text-sm text-gray-900 mb-2 flex items-center">
                                        <div class="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                                        ${pattern.title}
                                    </h5>
                                    <p class="text-sm text-gray-700 leading-relaxed">${pattern.description}</p>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>

                <!-- Scenario Recommendations -->
                <div class="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                    <div class="bg-gradient-to-r from-green-600 to-green-700 px-6 py-4">
                        <h4 class="font-bold text-xl text-white flex items-center">
                            <svg class="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                            </svg>
                            Scenario-Based Recommendations
                        </h4>
                    </div>
                    <div class="p-6">
                        <div class="space-y-4">
                            ${scenarioRecommendations.map(scenario => `
                                <div class="bg-gray-50 rounded-lg p-4 border border-gray-100">
                                    <div class="flex justify-between items-start mb-3">
                                        <h5 class="font-semibold text-sm text-gray-900">${scenario.scenario}</h5>
                                        <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800 border border-green-200">
                                            ${scenario.recommendedTeam}
                                        </span>
                                    </div>
                                    <p class="text-sm text-gray-700 leading-relaxed">${scenario.reasoning}</p>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>

                <!-- Best Overall Team -->
                <div class="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                    <div class="bg-gradient-to-r from-green-600 to-green-700 px-6 py-4">
                        <h4 class="font-bold text-xl text-white flex items-center">
                            <svg class="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                            </svg>
                            Best Overall Team
                        </h4>
                    </div>
                    <div class="p-6">
                        ${this.generateBestTeamRecommendation(comparisonData)}
                    </div>
                </div>
            </div>
        `;

        recommendationContainer.innerHTML = recommendationText;
    }

    analyzeTeamPatterns(comparisonData) {
        const patterns = [];
        const teams = comparisonData.teams;

        // Analyze captaincy patterns
        const captainTypes = teams.map(team => {
            const captain = team.captain.toLowerCase();
            if (captain.includes('kohli') || captain.includes('rohit') || captain.includes('dhoni')) {
                return 'experienced-batsman';
            } else if (captain.includes('chahal') || captain.includes('bumrah') || captain.includes('hazlewood')) {
                return 'bowler';
            } else if (captain.includes('stoinis') || captain.includes('jadeja') || captain.includes('pandya')) {
                return 'all-rounder';
            }
            return 'other';
        });

        const captainPattern = this.getMostCommonPattern(captainTypes);
        patterns.push({
            title: 'Captaincy Strategy',
            description: `Most teams prefer ${captainPattern} as captain, indicating a ${captainPattern === 'experienced-batsman' ? 'conservative, stability-focused approach' : captainPattern === 'bowler' ? 'aggressive, wicket-taking strategy' : 'balanced, all-round approach'}.`
        });

        // Analyze team composition patterns
        const avgBatsmen = teams.reduce((sum, team) => sum + team.composition.batsmen, 0) / teams.length;
        const avgBowlers = teams.reduce((sum, team) => sum + team.composition.bowlers, 0) / teams.length;
        const avgAllRounders = teams.reduce((sum, team) => sum + team.composition.allRounders, 0) / teams.length;

        patterns.push({
            title: 'Composition Trends',
            description: `Average composition: ${avgBatsmen.toFixed(1)} batsmen, ${avgBowlers.toFixed(1)} bowlers, ${avgAllRounders.toFixed(1)} all-rounders. ${this.getCompositionInsight(avgBatsmen, avgBowlers, avgAllRounders)}`
        });

        // Analyze rating patterns
        const avgRating = teams.reduce((sum, team) => sum + team.overallRating, 0) / teams.length;
        const ratingSpread = Math.max(...teams.map(t => t.overallRating)) - Math.min(...teams.map(t => t.overallRating));
        
        patterns.push({
            title: 'Quality Assessment',
            description: `Average team rating: ${avgRating.toFixed(1)}/10. ${ratingSpread < 2 ? 'Teams are closely matched' : 'Significant quality differences exist'}. ${avgRating >= 7 ? 'Overall high-quality teams' : avgRating >= 5 ? 'Moderate quality teams' : 'Teams need improvement'}.`
        });

        return patterns;
    }

    generateScenarioRecommendations(comparisonData) {
        const scenarios = [];
        const teams = comparisonData.teams;

        // Scenario 1: Batting first
        const battingFirstTeam = teams.reduce((best, current) => {
            const battingStrength = current.composition.batsmen + (current.composition.allRounders * 0.5);
            const bestBattingStrength = best.composition.batsmen + (best.composition.allRounders * 0.5);
            return battingStrength > bestBattingStrength ? current : best;
        });
        scenarios.push({
            scenario: '🏏 Batting First',
            recommendedTeam: battingFirstTeam.name,
            reasoning: `Strong batting lineup with ${battingFirstTeam.composition.batsmen} specialist batsmen and ${battingFirstTeam.composition.allRounders} all-rounders. Ideal for setting a competitive total.`
        });

        // Scenario 2: Chasing
        const chasingTeam = teams.reduce((best, current) => {
            const chasingStrength = current.composition.bowlers + (current.composition.allRounders * 0.5);
            const bestChasingStrength = best.composition.bowlers + (best.composition.allRounders * 0.5);
            return chasingStrength > bestChasingStrength ? current : best;
        });
        scenarios.push({
            scenario: '🎯 Chasing Target',
            recommendedTeam: chasingTeam.name,
            reasoning: `Strong bowling attack with ${chasingTeam.composition.bowlers} specialist bowlers. Can restrict opposition and chase effectively.`
        });

        // Scenario 3: Spin-friendly pitch
        const spinTeam = teams.reduce((best, current) => {
            const spinStrength = current.players.filter(p => 
                p.toLowerCase().includes('chahal') || 
                p.toLowerCase().includes('jadeja') || 
                p.toLowerCase().includes('ashwin')
            ).length;
            const bestSpinStrength = best.players.filter(p => 
                p.toLowerCase().includes('chahal') || 
                p.toLowerCase().includes('jadeja') || 
                p.toLowerCase().includes('ashwin')
            ).length;
            return spinStrength > bestSpinStrength ? current : best;
        });
        scenarios.push({
            scenario: '🔄 Spin-Friendly Pitch',
            recommendedTeam: spinTeam.name,
            reasoning: `Has the most spin options and players who excel on turning tracks.`
        });

        // Scenario 4: Pace-friendly pitch
        const paceTeam = teams.reduce((best, current) => {
            const paceStrength = current.players.filter(p => 
                p.toLowerCase().includes('bumrah') || 
                p.toLowerCase().includes('hazlewood') || 
                p.toLowerCase().includes('archer') ||
                p.toLowerCase().includes('kumar')
            ).length;
            const bestPaceStrength = best.players.filter(p => 
                p.toLowerCase().includes('bumrah') || 
                p.toLowerCase().includes('hazlewood') || 
                p.toLowerCase().includes('archer') ||
                p.toLowerCase().includes('kumar')
            ).length;
            return paceStrength > bestPaceStrength ? current : best;
        });
        scenarios.push({
            scenario: '⚡ Pace-Friendly Pitch',
            recommendedTeam: paceTeam.name,
            reasoning: `Strong pace bowling attack with multiple fast bowlers who can exploit bouncy conditions.`
        });

        return scenarios;
    }

    generateOverallSummary(comparisonData, patterns) {
        const teams = comparisonData.teams;
        const bestTeam = teams.reduce((best, current) => 
            current.overallRating > best.overallRating ? current : best
        );
        const worstTeam = teams.reduce((worst, current) => 
            current.overallRating < worst.overallRating ? current : worst
        );

        const totalTeams = teams.length;
        const avgRating = teams.reduce((sum, team) => sum + team.overallRating, 0) / totalTeams;
        const ratingSpread = bestTeam.overallRating - worstTeam.overallRating;

        return `Analyzed ${totalTeams} teams with an average rating of ${avgRating.toFixed(1)}/10. ${bestTeam.name} leads with ${bestTeam.overallRating}/10, while ${worstTeam.name} scores ${worstTeam.overallRating}/10. The ${ratingSpread < 2 ? 'teams are closely matched' : 'quality gap is significant'}. Key insights: ${patterns.length > 0 ? patterns[0].description : 'Teams show diverse strategies'}.`;
    }

    generateBestTeamRecommendation(comparisonData) {
        const bestTeam = comparisonData.teams.reduce((best, current) => 
            current.overallRating > best.overallRating ? current : best
        );

        return `
            <div class="bg-white rounded-lg p-6 border border-gray-200">
                <!-- Team Name -->
                <div class="text-center mb-4">
                    <h5 class="font-bold text-2xl text-green-600 mb-1">${bestTeam.name}</h5>
                    <p class="text-sm text-gray-600">Recommended Team</p>
                </div>
                
                <!-- Overall Rating -->
                <div class="text-center mb-6">
                    <div class="text-3xl font-bold text-green-600 mb-1">${bestTeam.overallRating}/10</div>
                    <div class="text-sm text-gray-500">Overall Rating</div>
                </div>
                
                <!-- Stats - Simple Layout -->
                <div class="space-y-3 mb-6">
                    <div class="flex justify-between items-center">
                        <span class="text-sm font-semibold text-gray-600">Captain:</span>
                        <span class="text-lg font-bold text-gray-900">${bestTeam.captain}</span>
                    </div>
                    <div class="flex justify-between items-center">
                        <span class="text-sm font-semibold text-gray-600">Vice-Captain:</span>
                        <span class="text-lg font-bold text-gray-900">${bestTeam.viceCaptain}</span>
                    </div>
                    <div class="flex justify-between items-center">
                        <span class="text-sm font-semibold text-gray-600">Team Balance:</span>
                        <span class="text-lg font-bold text-gray-900">${bestTeam.balanceScore}/10</span>
                    </div>
                </div>
                
                <!-- Why This Team Section -->
                <div class="border-t border-gray-200 pt-4">
                    <div class="font-semibold text-gray-900 mb-2">Why This Team?</div>
                    <p class="text-sm text-gray-700 leading-relaxed">
                        Best overall performance across all criteria and scenarios. Strong composition with ${bestTeam.players.length} players, 
                        excellent balance score, and optimal captain/vice-captain combination for maximum fantasy points.
                    </p>
                </div>
            </div>
        `;
    }

    getMostCommonPattern(types) {
        const counts = {};
        types.forEach(type => {
            counts[type] = (counts[type] || 0) + 1;
        });
        return Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);
    }

    getCompositionInsight(avgBatsmen, avgBowlers, avgAllRounders) {
        if (avgBatsmen > avgBowlers && avgBatsmen > avgAllRounders) {
            return 'Batting-heavy approach dominates.';
        } else if (avgBowlers > avgBatsmen && avgBowlers > avgAllRounders) {
            return 'Bowling-focused strategy preferred.';
        } else {
            return 'Balanced approach with emphasis on all-rounders.';
        }
    }

    generateRecommendation(comparisonData, aiAnalysis) {
        // Legacy function - now calls comprehensive recommendation
        this.generateComprehensiveRecommendation(comparisonData, aiAnalysis);
    }

    generateBasicRecommendation(comparisonData) {
        // Fallback recommendation without AI
        const bestTeam = comparisonData.teams.reduce((best, current) => 
            current.overallRating > best.overallRating ? current : best
        );

        const recommendationContainer = document.getElementById('recommendation-content');
        
        if (comparisonData.teams.length === 1) {
            recommendationContainer.innerHTML = `
                <div class="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
                    <div class="text-center">
                        <svg class="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                        </svg>
                        <p class="text-gray-700 font-medium">Only one team uploaded. Please upload more teams for comparison.</p>
                    </div>
                </div>
            `;
        } else {
            // Use the same comprehensive recommendation structure for consistency
            this.generateComprehensiveRecommendation(comparisonData, null);
        }
    }

    showComparisonLoading(show) {
        const loadingElement = document.getElementById('comparison-loading');
        const tableSection = document.getElementById('comparison-table-section');
        
        if (show) {
            loadingElement.classList.remove('hidden');
            tableSection.classList.add('hidden');
        } else {
            loadingElement.classList.add('hidden');
        }
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