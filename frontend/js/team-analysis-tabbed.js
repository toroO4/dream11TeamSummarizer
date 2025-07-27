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
        
        // Add caching mechanism to prevent repeated API calls
        this.cache = {
            eligiblePlayers: new Map(),
            validationResults: new Map(),
            teamAnalysisData: new Map(),
            lastMatchDetails: null
        };
        this.lastTabSwitchTime = 0;
        this.TAB_SWITCH_DEBOUNCE = 1000; // 1 second debounce
        
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
        document.getElementById('analyze-all-btn').addEventListener('click', () => {
            this.handleAnalyzeAllTeamsWithLoading();
        });

        // Player validation button
        const validatePlayersBtn = document.getElementById('validate-players-btn');
        if (validatePlayersBtn) {
            validatePlayersBtn.addEventListener('click', async () => {
                this.handleValidatePlayersWithLoading();
            });
        }
    }

    async initializeTabs() {
        // Set initial active tab
        await this.switchTab('match-stats');
    }

    async switchTab(tabName) {
        console.log(`Switching to tab: ${tabName}`);
        
        // Add debouncing to prevent rapid API calls
        const now = Date.now();
        if (now - this.lastTabSwitchTime < this.TAB_SWITCH_DEBOUNCE) {
            console.log('Tab switch debounced - preventing rapid API calls');
            return;
        }
        this.lastTabSwitchTime = now;
        
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
                this.displayTeamsSummary().catch(error => {
                    console.error('Error displaying teams summary:', error);
                });
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
            
            // Update teams summary in real-time when team selection changes
            this.displayTeamsSummary().catch(error => {
                console.error('Error updating teams summary after team selection:', error);
            });
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
                                Change
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

        // Create cache key for validation
        const cacheKey = `${JSON.stringify(players.sort())}-${this.currentMatchDetails.teamA}-${this.currentMatchDetails.teamB}`;
        
        // Check if we have cached validation results
        if (this.cache.validationResults.has(cacheKey)) {
            console.log('Using cached validation results - avoiding API call');
            return this.cache.validationResults.get(cacheKey);
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
                // Cache the validation results
                this.cache.validationResults.set(cacheKey, result.validationResults);
                console.log('Validation results cached successfully');
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
        
        // Update teams summary in real-time
        this.displayTeamsSummary().catch(error => {
            console.error('Error updating teams summary after player override:', error);
        });
        
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
        
        // Update teams summary in real-time
        this.displayTeamsSummary().catch(error => {
            console.error('Error updating teams summary after player override:', error);
        });
        
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
            // Update the summary display in real-time
            this.displayTeamsSummary().catch(error => {
                console.error('Error updating teams summary:', error);
            });
        }
    }

    handleViceCaptainSelection(e) {
        if (this.currentTeamData) {
            this.currentTeamData.viceCaptain = e.target.value;
            this.updateTeamData();
            // Update the summary display in real-time
            this.displayTeamsSummary().catch(error => {
                console.error('Error updating teams summary:', error);
            });
        }
    }

    updateTeamData() {
        if (this.selectedTeamIndex >= 0) {
            this.currentTeams[this.selectedTeamIndex] = this.currentTeamData;
            sessionStorage.setItem('uploadedTeams', JSON.stringify(this.currentTeams));
            
            // Update teams summary in real-time
            this.displayTeamsSummary().catch(error => {
                console.error('Error updating teams summary after team data update:', error);
            });
        }
    }

    async displayTeamsSummary() {
        const summaryList = document.getElementById('teams-summary-list');
        
        if (this.currentTeams.length === 0) {
            summaryList.innerHTML = '<div class="text-center text-gray-500">No teams available</div>';
            return;
        }

        // Show loading state
        summaryList.innerHTML = `
            <div class="flex items-center justify-center py-8">
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <span class="ml-3 text-gray-600">Analyzing teams with match data...</span>
            </div>
        `;

        try {
            // Generate comprehensive team analysis with real match data
            const teamAnalysis = await this.generateComprehensiveTeamAnalysis();
            
            summaryList.innerHTML = `
                <!-- Team Categorization -->
                <div class="space-y-4">
                    <!-- Basic Team List -->
                    <div class="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                        <h4 class="font-semibold text-sm text-gray-900 mb-3 flex items-center">
                            <span class="text-primary mr-2"></span>
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
                            <span class="text-primary mr-2"></span>
                            Pre-Match Insights
                        </h4>
                        <div class="space-y-3">
                            ${this.renderTeamCategorization(teamAnalysis)}
                        </div>
                    </div>



                    <!-- Player Analysis -->
                    <div class="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                        <h4 class="font-semibold text-sm text-gray-900 mb-3 flex items-center">
                            <span class="text-primary mr-2"></span>
                            Player Analysis
                        </h4>
                        <div class="space-y-3">
                            ${this.renderPlayerAnalysis(teamAnalysis)}
                        </div>
                    </div>

                    <!-- Suggested Fixes -->
                    <div class="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                        <h4 class="font-semibold text-sm text-gray-900 mb-3 flex items-center">
                            <span class="text-primary mr-2"></span>
                            Suggested Fixes
                        </h4>
                        <div class="space-y-2">
                            ${this.renderSuggestedFixes(teamAnalysis)}
                        </div>
                    </div>
                </div>
            `;
        } catch (error) {
            console.error('Error generating team analysis:', error);
            summaryList.innerHTML = `
                <div class="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div class="text-red-800 font-medium">Error loading analysis</div>
                    <div class="text-red-600 text-sm">Failed to fetch match data. Please try again.</div>
                </div>
            `;
        }
    }

    async generateComprehensiveTeamAnalysis() {
        const allPlayers = [];
        const playerCounts = {};
        const teamCompositions = [];
        const teamAPlayers = [];
        const teamBPlayers = [];
        const battingHeavyTeams = [];
        const bowlingHeavyTeams = [];

        // Fetch eligible players for the specific match
        let eligiblePlayers = [];
        if (this.currentMatchDetails) {
            // Create cache key for eligible players
            const eligibleCacheKey = `${this.currentMatchDetails.teamA}-${this.currentMatchDetails.teamB}-${this.currentMatchDetails.matchDate}`;
            
            // Check cache first
            if (this.cache.eligiblePlayers.has(eligibleCacheKey)) {
                console.log('Using cached eligible players - avoiding API call');
                eligiblePlayers = this.cache.eligiblePlayers.get(eligibleCacheKey);
            } else {
                try {
                    const response = await fetch(`${CONSTANTS.API_BASE_URL}/eligible-players`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            teamA: this.currentMatchDetails.teamA,
                            teamB: this.currentMatchDetails.teamB,
                            matchDate: this.currentMatchDetails.matchDate
                        })
                    });
                
                    if (response.ok) {
                        const result = await response.json();
                        if (result.success) {
                            eligiblePlayers = result.players || [];
                            // Cache the eligible players result
                            this.cache.eligiblePlayers.set(eligibleCacheKey, eligiblePlayers);
                            console.log('Eligible players cached successfully');
                        }
                    }
                } catch (error) {
                    console.error('Failed to fetch eligible players:', error);
                }
            }
        }

        // Collect all players and analyze teams based on validation results
        this.currentTeams.forEach((team, teamIndex) => {
            const teamPlayers = team.players || [];
            const composition = this.analyzeTeamComposition(teamPlayers);
            
            teamCompositions.push({
                teamName: team.name,
                composition,
                players: teamPlayers
            });

            // Count players based on validation results from players tab
            if (team.validationResults && team.validationResults.length > 0) {
                console.log(`Using validation results for team ${teamIndex + 1}:`, team.validationResults);
                team.validationResults.forEach(validationResult => {
                    if (validationResult.isValid && validationResult.team) {
                        // Count based on validated team information
                        if (validationResult.team === this.currentMatchDetails?.teamA) {
                            teamAPlayers.push({ 
                                player: validationResult.validatedName || validationResult.inputName, 
                                team: team.name,
                                role: validationResult.role || 'Unknown'
                            });
                        } else if (validationResult.team === this.currentMatchDetails?.teamB) {
                            teamBPlayers.push({ 
                                player: validationResult.validatedName || validationResult.inputName, 
                                team: team.name,
                                role: validationResult.role || 'Unknown'
                            });
                        }
                    }
                });
            } else {
                console.log(`No validation results for team ${teamIndex + 1}, using fallback categorization`);
                // Fallback: Use original categorization if no validation results
                teamPlayers.forEach(player => {
                    // Check if player belongs to team A or B
                    const eligiblePlayer = eligiblePlayers.find(ep => 
                        ep.player_name.toLowerCase() === player.toLowerCase()
                    );
                    
                    if (eligiblePlayer) {
                        if (eligiblePlayer.team_name === this.currentMatchDetails?.teamA) {
                            teamAPlayers.push({ player, team: team.name });
                        } else if (eligiblePlayer.team_name === this.currentMatchDetails?.teamB) {
                            teamBPlayers.push({ player, team: team.name });
                        }
                    } else {
                        // Fallback: Try to categorize based on known player-team mappings
                        const categorizedTeam = this.categorizePlayerByTeam(player, this.currentMatchDetails?.teamA, this.currentMatchDetails?.teamB);
                        if (categorizedTeam) {
                            if (categorizedTeam === this.currentMatchDetails?.teamA) {
                                teamAPlayers.push({ player, team: team.name });
                            } else if (categorizedTeam === this.currentMatchDetails?.teamB) {
                                teamBPlayers.push({ player, team: team.name });
                            }
                        }
                    }
                });
            }
            
            // Count player occurrences (normalize player names)
            teamPlayers.forEach(player => {
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

        // Find popular players not in any team based on eligible players
        const popularPlayersNotSelected = this.findPopularPlayersNotSelected(playerCounts, eligiblePlayers);

        console.log('Team Analysis Summary:', {
            totalTeams: this.currentTeams.length,
            teamAPlayersCount: teamAPlayers.length,
            teamBPlayersCount: teamBPlayers.length,
            totalPlayers: allPlayers.length,
            eligiblePlayersCount: eligiblePlayers.length,
            teamAPlayers: teamAPlayers.map(p => p.player),
            teamBPlayers: teamBPlayers.map(p => p.player),
            validationBased: 'Using validation results from players tab'
        });

        return {
            totalTeams: this.currentTeams.length,
            playerCounts,
            teamCompositions,
            teamAPlayers,
            teamBPlayers,
            battingHeavyTeams,
            bowlingHeavyTeams,
            popularPlayersNotSelected,
            allPlayers: [...new Set(allPlayers)],
            eligiblePlayers
        };
    }

    categorizePlayerByTeam(playerName, teamA, teamB) {
        // Comprehensive player-team mapping for fallback categorization
        const playerNameLower = playerName.toLowerCase().trim();
        
        // RCB Players
        const rcbPlayers = [
            'virat kohli', 'kohli', 'virat', 'v kohli',
            'faf du plessis', 'du plessis', 'faf',
            'glenn maxwell', 'maxwell', 'g maxwell',
            'dinesh karthik', 'karthik', 'd karthik',
            'rajat patidar', 'patidar', 'r patidar',
            'cameron green', 'green', 'c green',
            'alzarri joseph', 'joseph', 'a joseph',
            'yash dayal', 'dayal', 'y dayal',
            'karn sharma', 'karn', 'k sharma',
            'mahipal lomror', 'lomror', 'm lomror',
            'suyash prabhudessai', 'prabhudessai', 's prabhudessai',
            'anuj rawat', 'rawat', 'a rawat',
            'vijaykumar vyshak', 'vyshak', 'v vyshak',
            'akash deep', 'akash', 'a deep',
            'manoj bhandage', 'bhandage', 'm bhandage',
            'tom curran', 'curran', 't curran',
            'lockie ferguson', 'ferguson', 'l ferguson'
        ];
        
        // PBKS Players
        const pbksPlayers = [
            'shikhar dhawan', 'dhawan', 's dhawan',
            'jonny bairstow', 'bairstow', 'j bairstow',
            'liam livingstone', 'livingstone', 'l livingstone',
            'sam curran', 's curran',
            'kagiso rabada', 'rabada', 'k rabada',
            'rahul chahar', 'chahar', 'r chahar',
            'harpreet brar', 'brar', 'h brar',
            'jitesh sharma', 'jitesh', 'j sharma',
            'shahrukh khan', 'shahrukh', 's khan',
            'prabhsimran singh', 'prabhsimran', 'p singh',
            'atharva taide', 'taide', 'a taide',
            'bhanuka rajapaksa', 'rajapaksa', 'b rajapaksa',
            'rishabh pant', 'pant', 'r pant',
            'arshdeep singh', 'arshdeep', 'a singh',
            'nathan ellis', 'ellis', 'n ellis',
            'kagiso rabada', 'rabada', 'k rabada',
            'rahul chahar', 'chahar', 'r chahar'
        ];
        
        // CSK Players
        const cskPlayers = [
            'ms dhoni', 'dhoni', 'm s dhoni',
            'ravindra jadeja', 'jadeja', 'r jadeja',
            'ruturaj gaikwad', 'gaikwad', 'r gaikwad',
            'devon conway', 'conway', 'd conway',
            'ben stokes', 'stokes', 'b stokes',
            'moeen ali', 'ali', 'm ali',
            'shivam dube', 'dube', 's dube',
            'deepak chahar', 'chahar', 'd chahar',
            'ajinkya rahane', 'rahane', 'a rahane',
            'mitchell santner', 'santner', 'm santner',
            'tushar deshpande', 'deshpande', 't deshpande',
            'rajvardhan hangargekar', 'hangargekar', 'r hangargekar',
            'simarjeet singh', 'simarjeet', 's singh',
            'sisanda magala', 'magala', 's magala',
            'kyle jamieson', 'jamieson', 'k jamieson',
            'ben stokes', 'stokes', 'b stokes'
        ];
        
        // MI Players
        const miPlayers = [
            'rohit sharma', 'sharma', 'r sharma',
            'suryakumar yadav', 'suryakumar', 's yadav',
            'ishan kishan', 'ishan', 'i kishan',
            'tilak varma', 'tilak', 't varma',
            'tim david', 'david', 't david',
            'cameron green', 'green', 'c green',
            'jasprit bumrah', 'bumrah', 'j bumrah',
            'piyush chawla', 'chawla', 'p chawla',
            'hritik shokeen', 'shokeen', 'h shokeen',
            'arjun tendulkar', 'arjun', 'a tendulkar',
            'kumar kartikeya', 'kartikeya', 'k kartikeya',
            'ramandeep singh', 'ramandeep', 'r singh',
            'nehal wadhera', 'nehal', 'n wadhera',
            'tristan stubbs', 'stubbs', 't stubbs',
            'jason behrendorff', 'behrendorff', 'j behrendorff',
            'sandeep warrier', 'warrier', 's warrier'
        ];
        
        // KKR Players
        const kkrPlayers = [
            'andre russell', 'russell', 'a russell',
            'sunil narine', 'narine', 's narine',
            'varun chakravarthy', 'varun', 'v chakravarthy',
            'venkatesh iyer', 'venkatesh', 'v iyer',
            'nitish rana', 'rana', 'n rana',
            'rahmanullah gurbaz', 'gurbaz', 'r gurbaz',
            'shardul thakur', 'shardul', 's thakur',
            'anukul roy', 'anukul', 'a roy',
            'harshit rana', 'harshit', 'h rana',
            'vaibhav arora', 'vaibhav', 'v arora',
            'suyash sharma', 'suyash', 's sharma',
            'narayan jagadeesan', 'jagadeesan', 'n jagadeesan',
            'litton das', 'litton', 'l das',
            'david wiese', 'wiese', 'd wiese',
            'mandeep singh', 'mandeep', 'm singh'
        ];
        
        // Map team names to their player lists
        const teamPlayerMap = {
            'Royal Challengers Bengaluru': rcbPlayers,
            'Punjab Kings': pbksPlayers,
            'Chennai Super Kings': cskPlayers,
            'Mumbai Indians': miPlayers,
            'Kolkata Knight Riders': kkrPlayers
        };
        
        // Check if player belongs to teamA or teamB
        if (teamA && teamPlayerMap[teamA] && teamPlayerMap[teamA].includes(playerNameLower)) {
            return teamA;
        }
        
        if (teamB && teamPlayerMap[teamB] && teamPlayerMap[teamB].includes(playerNameLower)) {
            return teamB;
        }
        
        return null; // Player not found in either team
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
        // Assign each player to their primary role (priority order: WK > AR > Bowler > Batsman)
        const roleAssignments = players.map(player => {
            const playerLower = player.toLowerCase();
            
            // Check in priority order - Wicket Keeper first
            if (this.isWicketKeeper(playerLower)) {
                return { player, role: 'wicketKeeper' };
            }
            // Then All Rounder
            else if (this.isAllRounder(playerLower)) {
                return { player, role: 'allRounder' };
            }
            // Then Bowler
            else if (this.isBowler(playerLower)) {
                return { player, role: 'bowler' };
            }
            // Default to Batsman
            else {
                return { player, role: 'batsman' };
            }
        });
        
        // Count players in each role
        const batsmen = roleAssignments.filter(p => p.role === 'batsman').length;
        const bowlers = roleAssignments.filter(p => p.role === 'bowler').length;
        const allRounders = roleAssignments.filter(p => p.role === 'allRounder').length;
        const wicketKeepers = roleAssignments.filter(p => p.role === 'wicketKeeper').length;
        
        // Debug: Log the assignments to console
        console.log('Role Assignments:', roleAssignments);
        console.log('Counts:', { batsmen, bowlers, allRounders, wicketKeepers, total: batsmen + bowlers + allRounders + wicketKeepers });
        
        return { batsmen, bowlers, allRounders, wicketKeepers };
    }

    isBatsman(player) {
        const playerLower = player.toLowerCase();
        return !this.isBowler(playerLower) && !this.isAllRounder(playerLower) && !this.isWicketKeeper(playerLower);
    }

    isBowler(player) {
        return player.includes('bumrah') || player.includes('chahal') || 
               player.includes('shami') || player.includes('kumar') || 
               player.includes('hazlewood') || player.includes('boult') || 
               player.includes('archer') || player.includes('nortje') ||
               player.includes('rabada') || player.includes('starc') ||
               player.includes('rashid') || player.includes('varun') ||
               player.includes('siraj') || player.includes('natarajan');
    }

    isAllRounder(player) {
        return player.includes('stokes') || player.includes('jadeja') || 
               player.includes('stoinis') || player.includes('pandya') ||
               player.includes('maxwell') || player.includes('russell') ||
               player.includes('curran') || player.includes('holder');
    }

    isWicketKeeper(player) {
        return player.includes('pant') || player.includes('salt') || 
               player.includes('rahul') || player.includes('buttler') ||
               player.includes('kishan') || player.includes('bairstow') ||
               player.includes('pope') || player.includes('foakes');
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

    findPopularPlayersNotSelected(playerCounts, eligiblePlayers = []) {
        // Use eligible players from the specific match instead of hardcoded list
        if (eligiblePlayers.length === 0) {
            // Fallback to some common players if no eligible players found
            const fallbackPlayers = [
                'Virat Kohli', 'Rohit Sharma', 'MS Dhoni', 'Jasprit Bumrah',
                'Ravindra Jadeja', 'Hardik Pandya', 'KL Rahul', 'Rishabh Pant'
            ];
            return fallbackPlayers.filter(player => {
                const normalizedPlayer = this.normalizePlayerName(player);
                return !playerCounts[normalizedPlayer];
            });
        }

        // Get top players from eligible players (limit to 10 most relevant)
        const topEligiblePlayers = eligiblePlayers
            .slice(0, 10)
            .map(ep => ep.player_name);

        // Filter out players that are already selected
        return topEligiblePlayers.filter(player => {
            const normalizedPlayer = this.normalizePlayerName(player);
            return !playerCounts[normalizedPlayer];
        });
    }



    renderTeamCategorization(analysis) {
        const categories = [];

        // Team A vs Team B distribution
        const teamAPlayersCount = analysis.teamAPlayers.length;
        const teamBPlayersCount = analysis.teamBPlayers.length;
        
        if (this.currentMatchDetails) {
            const teamAShort = this.getTeamShortName(this.currentMatchDetails.teamA);
            const teamBShort = this.getTeamShortName(this.currentMatchDetails.teamB);
            
            // Show team distribution count with more detail
            const totalValidatedPlayers = teamAPlayersCount + teamBPlayersCount;
            const totalExpectedPlayers = this.currentTeams.length * 11; // 11 players per team
            
            categories.push({
                type: 'Team Distribution',
                description: `${teamAPlayersCount} ${teamAShort} | ${teamBPlayersCount} ${teamBShort} (${totalValidatedPlayers}/${totalExpectedPlayers} validated)`,
                color: 'bg-purple-100 text-purple-800 border-purple-200'
            });
            
            // Show team balance category
            if (teamAPlayersCount > teamBPlayersCount) {
                categories.push({
                    type: `${teamAShort} Heavy`,
                    description: `${teamAPlayersCount} players favor ${teamAShort}`,
                    color: 'bg-orange-100 text-orange-800 border-orange-200'
                });
            } else if (teamBPlayersCount > teamAPlayersCount) {
                categories.push({
                    type: `${teamBShort} Heavy`,
                    description: `${teamBPlayersCount} players favor ${teamBShort}`,
                    color: 'bg-blue-100 text-blue-800 border-blue-200'
                });
            } else {
                categories.push({
                    type: 'Balanced Teams',
                    description: `Equal mix: ${teamAPlayersCount} ${teamAShort} vs ${teamBPlayersCount} ${teamBShort}`,
                    color: 'bg-green-100 text-green-800 border-green-200'
                });
            }
            
            // Show validation status with improved logic
            let actualUnvalidatedCount = 0;
            
            // Count only players that are not recognized in database
            this.currentTeams.forEach(team => {
                if (team.validationResults && team.validationResults.length > 0) {
                    const unrecognizedPlayers = team.validationResults.filter(result => 
                        !result.isValid && !result.isMissing && result.confidence < 0.8
                    ).length;
                    actualUnvalidatedCount += unrecognizedPlayers;
                }
                // If no validation results yet, don't count them as needing validation
            });
            
            if (actualUnvalidatedCount > 0) {
                categories.push({
                    type: 'Validation Status',
                    description: `${actualUnvalidatedCount} players need validation`,
                    color: 'bg-yellow-100 text-yellow-800 border-yellow-200'
                });
            } else {
                categories.push({
                    type: 'Validation Status',
                    description: 'All players validated',
                    color: 'bg-green-100 text-green-800 border-green-200'
                });
            }
        } else {
            // Fallback if no match details
            categories.push({
                type: 'Team Distribution',
                description: `${teamAPlayersCount} Team A | ${teamBPlayersCount} Team B`,
                color: 'bg-purple-100 text-purple-800 border-purple-200'
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

        // Missing key players - based on eligible players for this match
        if (analysis.popularPlayersNotSelected && analysis.popularPlayersNotSelected.length > 0) {
            const player = analysis.popularPlayersNotSelected[0];
            const suggestedTeams = Math.min(2, analysis.totalTeams);
            fixes.push(`
                <div class="flex items-start space-x-2 p-3 bg-red-50 rounded-lg border border-red-200">
                    <span class="text-red-500 mt-0.5"></span>
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
                    <span class="text-orange-500 mt-0.5"></span>
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
                    <span class="text-blue-500 mt-0.5"></span>
                    <div class="flex-1">
                        <div class="font-semibold text-sm text-blue-800">Captain Selection</div>
                        <div class="text-xs text-blue-700">Select captain for ${teamsWithoutCaptain.length} teams</div>
                    </div>
                </div>
            `);
        }

        // Team distribution suggestions based on match data
        if (this.currentMatchDetails && analysis.teamAPlayers && analysis.teamBPlayers) {
            const teamAPlayersCount = analysis.teamAPlayers.length;
            const teamBPlayersCount = analysis.teamBPlayers.length;
            const totalPlayers = teamAPlayersCount + teamBPlayersCount;
            
            console.log('Team Distribution Analysis:', {
                teamA: this.currentMatchDetails.teamA,
                teamB: this.currentMatchDetails.teamB,
                teamAPlayersCount,
                teamBPlayersCount,
                totalPlayers,
                teamAPlayers: analysis.teamAPlayers.map(p => p.player),
                teamBPlayers: analysis.teamBPlayers.map(p => p.player)
            });
            
            if (totalPlayers > 0) {
                const teamAPercentage = Math.round((teamAPlayersCount / totalPlayers) * 100);
                const teamBPercentage = Math.round((teamBPlayersCount / totalPlayers) * 100);
                
                console.log('Team Percentages:', { teamAPercentage, teamBPercentage, difference: Math.abs(teamAPercentage - teamBPercentage) });
                
                // Only show team distribution suggestion if:
                // 1. There's a significant imbalance (more than 40% difference)
                // 2. There are enough total players to make the suggestion meaningful (at least 6 players)
                // 3. Both teams have some representation (not completely one-sided)
                if (Math.abs(teamAPercentage - teamBPercentage) > 40 && totalPlayers >= 6 && teamAPlayersCount > 0 && teamBPlayersCount > 0) {
                    // If team A is dominant, suggest adding more team B players (and vice versa)
                    const underrepresentedTeam = teamAPercentage > teamBPercentage ? 
                        this.getTeamShortName(this.currentMatchDetails.teamB) : 
                        this.getTeamShortName(this.currentMatchDetails.teamA);
                    
                    const dominantTeam = teamAPercentage > teamBPercentage ? 
                        this.getTeamShortName(this.currentMatchDetails.teamA) : 
                        this.getTeamShortName(this.currentMatchDetails.teamB);
                    
                    fixes.push(`
                        <div class="flex items-start space-x-2 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                            <span class="text-yellow-500 mt-0.5"></span>
                            <div class="flex-1">
                                <div class="font-semibold text-sm text-yellow-800">Team Distribution</div>
                                <div class="text-xs text-yellow-700">Too many ${dominantTeam} players. Consider adding more ${underrepresentedTeam} players for better balance</div>
                            </div>
                        </div>
                    `);
                }
            }
        }

        return fixes.length > 0 ? fixes.join('') : `
            <div class="text-center text-gray-500 text-sm py-4">
                All teams look well-balanced!
            </div>
        `;
    }

    async loadTeamAnalysisData() {
        console.log('Loading additional team analysis data from API...');
        
        if (!this.currentMatchDetails) {
            console.log('No match details available');
            return;
        }

        // Create cache key for this match
        const cacheKey = `${this.currentMatchDetails.teamA}-${this.currentMatchDetails.teamB}-${this.currentMatchDetails.matchDate}`;
        
        // Check if we have cached data for this match
        if (this.cache.teamAnalysisData.has(cacheKey)) {
            console.log('Using cached team analysis data - avoiding API call');
            const cachedData = this.cache.teamAnalysisData.get(cacheKey);
            this.populateTeamFormData(cachedData.teamFormData);
            this.populateHeadToHeadData(cachedData.headToHeadData);
            return;
        }

        try {
            // Fetch real data from APIs
            const [teamFormData, headToHeadData] = await Promise.all([
                this.fetchTeamRecentForm(),
                this.fetchHeadToHead()
            ]);

            // Cache the data for future use
            this.cache.teamAnalysisData.set(cacheKey, {
                teamFormData,
                headToHeadData,
                timestamp: Date.now()
            });

            // Populate with real data
            this.populateTeamFormData(teamFormData);
            this.populateHeadToHeadData(headToHeadData);
            console.log('Additional team analysis data loaded successfully from API and cached');

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
        const comparisonContainer = document.getElementById('comparison-teams-preview');
        
        if (!comparisonContainer) return;
        
        if (this.currentTeams.length === 0) {
            comparisonContainer.innerHTML = `
                <div class="text-center py-12">
                    <div class="text-gray-400 text-6xl mb-4">📊</div>
                    <h3 class="text-lg font-bold text-gray-900 mb-2">No Teams Available</h3>
                    <p class="text-sm text-gray-500">Please upload teams to see the comparison</p>
                </div>
            `;
            return;
        }

        // Generate team preview cards for comparison
        comparisonContainer.innerHTML = `
            <div>
                <div class="flex items-center justify-between mb-4">
                    <h4 class="font-semibold text-sm text-gray-900 flex items-center">
                        <span class="text-primary mr-2">🏆</span>
                        Team Comparison (${this.currentTeams.length})
                    </h4>
                    <button id="comprehensive-compare-btn" class="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center gap-2">
                        <span>🔍</span>
                        Compare All Teams
                    </button>
                </div>
                ${this.generateTeamPreviewCards()}
                <div id="comprehensive-comparison-results" class="mt-6">
                    <!-- Comparison results will be displayed here -->
                </div>
            </div>
        `;

        // Add event listener for the comparison button
        const compareBtn = document.getElementById('comprehensive-compare-btn');
        if (compareBtn) {
            compareBtn.addEventListener('click', () => this.handleComprehensiveComparison());
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
            
            // Fetch common data ONCE for all teams (these don't change per team)
            console.log('Fetching common match data...');
            const [commonTeamFormData, commonHeadToHeadData, commonVenueStatsData] = await Promise.all([
                this.fetchTeamRecentForm(),
                this.fetchHeadToHead(), 
                this.fetchVenueStats()
            ]);
            
            console.log('Common data fetched, analyzing teams...');
            
            // Analyze each team using the common data
            const analysisPromises = this.currentTeams.map(async (team) => {
                if (!team.captain || !team.viceCaptain) {
                    return { team: team.name, error: 'Captain/Vice-captain not selected' };
                }

                try {
                    // Prepare enhanced player data with roles, teams, and validation results
                    const enhancedPlayers = team.validationResults ? 
                        team.validationResults.filter(p => p.isValid).map(player => ({
                            name: player.validatedName || player.inputName,
                            originalName: player.inputName,
                            role: player.role || 'Unknown',
                            team: player.team || 'Unknown', 
                            playerId: player.playerId,
                            confidence: player.confidence || 1.0,
                            autoReplaced: player.autoReplaced || false
                        })) :
                        team.players.map(playerName => ({
                            name: playerName,
                            originalName: playerName,
                            role: 'Unknown',
                            team: 'Unknown',
                            playerId: null,
                            confidence: 0.5,
                            autoReplaced: false
                        }));

                    // Calculate team composition
                    const composition = this.calculateTeamComposition(team);
                    const teamCounts = this.calculateTeamPlayerCounts(team);

                    // Enhanced analysis data with comprehensive context (reusing common data)
                    const enhancedAnalysisData = {
                        // Basic match details
                        teamA: this.currentMatchDetails.teamA,
                        teamB: this.currentMatchDetails.teamB,
                        matchDate: this.currentMatchDetails.matchDate,
                        
                        // Enhanced player data with roles and teams
                        players: enhancedPlayers,
                        captain: team.captain,
                        viceCaptain: team.viceCaptain,
                        
                        // Team composition analysis
                        composition: {
                            wicketKeepers: composition.wk,
                            batsmen: composition.bat,
                            allRounders: composition.ar,
                            bowlers: composition.bowl,
                            teamAPlayers: teamCounts.teamACount,
                            teamBPlayers: teamCounts.teamBCount
                        },
                        
                        // Reuse common data for all teams
                        teamFormData: commonTeamFormData && commonTeamFormData.success ? commonTeamFormData.data : null,
                        headToHeadData: commonHeadToHeadData && commonHeadToHeadData.success ? commonHeadToHeadData.data : null,
                        venueStatsData: commonVenueStatsData && commonVenueStatsData.success ? commonVenueStatsData.data : null,
                        
                        // Additional team metadata
                        teamMetadata: {
                            teamName: team.name,
                            source: team.source || 'manual',
                            validationStatus: team.validationResults ? 'validated' : 'unvalidated',
                            totalValidPlayers: enhancedPlayers.filter(p => p.confidence > 0.7).length
                        }
                    };

                    const summary = await this.components.teamAnalysis.generateTeamSummary(enhancedAnalysisData);
                    return { team: team.name, summary };
                } catch (error) {
                    console.error(`Error analyzing team ${team.name}:`, error);
                    return { team: team.name, error: error.message };
                }
            });

            // Process teams in parallel and show progress
            this.components.toast.showSuccess(`Analyzing ${this.currentTeams.length} teams...`);
            const results = await Promise.all(analysisPromises);
            
            // Display results
            this.displayAnalysisResults(results);
            
            // Show Overall Summary button after individual analysis is complete
            setTimeout(() => {
                this.showOverallSummaryButton();
            }, 500); // Small delay to ensure DOM is updated
            
        } catch (error) {
            console.error('Analysis error:', error);
            this.components.toast.showError('Failed to analyze teams');
        }
    }

    displayAnalysisResults(results) {
        // Create a modal or expand the teams summary to show results
        const summaryList = document.getElementById('teams-summary-list');
        
        if (!summaryList) {
            return;
        }

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

        // Store results for overall summary
        this.lastAnalysisResults = results;
        
        this.components.toast.showSuccess('Analysis completed!');
    }

    showOverallSummaryButton() {
        // Try to find the parent container for the teams summary tab
        const summaryTabContent = document.getElementById('teams-summary-content');
        const summaryList = document.getElementById('teams-summary-list');
        
        if (!summaryTabContent || !summaryList) {
            return;
        }

        // Remove existing overall summary section if it exists
        const existingSection = document.getElementById('overall-summary-section');
        if (existingSection) {
            existingSection.remove();
        }
        
        // Create Overall Summary section
        const overallSummarySection = document.createElement('div');
        overallSummarySection.id = 'overall-summary-section';
        overallSummarySection.className = 'mt-6 pt-4 border-t border-gray-200 bg-blue-50 p-4 rounded-lg';
        overallSummarySection.style.display = 'block';
        overallSummarySection.style.visibility = 'visible';
        
        overallSummarySection.innerHTML = `
            <div class="space-y-3">
                <h3 class="text-lg font-bold text-gray-900 text-center">Portfolio Analysis</h3>
                <button id="overall-summary-btn" class="w-full bg-blue-600 text-white py-3 px-4 rounded font-semibold hover:bg-blue-700 transition-all duration-300 shadow-lg text-sm sm:text-base">
                    Generate Overall Summary
                </button>
                <p class="text-xs text-gray-600 text-center font-inter">Get collective insights across all your teams</p>
            </div>
            <div id="overall-summary-result" class="hidden mt-4"></div>
        `;
        
        // Append to summary list (add as last child)
        summaryList.appendChild(overallSummarySection);
        
        // Add event listener for overall summary button
        const overallBtn = document.getElementById('overall-summary-btn');
        if (overallBtn) {
            overallBtn.addEventListener('click', () => {
                this.generateOverallSummaryWithLoading();
            });
        }
    }

    async generateOverallSummaryWithLoading() {
        const overallBtn = document.getElementById('overall-summary-btn');
        const resultDiv = document.getElementById('overall-summary-result');
        
        if (!overallBtn || !this.lastAnalysisResults) {
            return;
        }

        // Set loading state
        const originalText = overallBtn.textContent;
        overallBtn.disabled = true;
        overallBtn.textContent = 'Generating Overall Summary...';
        overallBtn.classList.add('opacity-50', 'cursor-not-allowed');

                try {
            // Show loading in result area
            if (resultDiv) {
                resultDiv.classList.remove('hidden');
                resultDiv.innerHTML = `
                    <div class="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
                        <div class="flex flex-col items-center justify-center py-4">
                            <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mb-3"></div>
                            <span class="text-gray-600">Analyzing all teams collectively...</span>
                        </div>
                    </div>
                `;
            }

            if (typeof CONSTANTS === 'undefined') {
                throw new Error('CONSTANTS is not defined - check if constants.js is loaded');
            }
            
            const overallSummary = await this.generateOverallSummary();
            this.displayOverallSummary(overallSummary);
            
        } catch (error) {
            this.components.toast.showError(`Failed to generate overall summary: ${error.message}`);
            
            if (resultDiv) {
                resultDiv.innerHTML = `
                    <div class="bg-red-50 rounded-lg p-4 border border-red-200">
                        <div class="text-red-800 font-medium">Failed to generate overall summary</div>
                        <div class="text-red-600 text-sm mt-1">${error.message}</div>
                    </div>
                `;
            }
        } finally {
            // Reset button state
            overallBtn.disabled = false;
            overallBtn.textContent = originalText;
            overallBtn.classList.remove('opacity-50', 'cursor-not-allowed');
        }
    }

    async generateOverallSummary() {
        if (!this.lastAnalysisResults || this.lastAnalysisResults.length === 0) {
            throw new Error('No analysis results available');
        }

        // Prepare comprehensive data for overall analysis
        const overallAnalysisData = {
            // Match context
            teamA: this.currentMatchDetails.teamA,
            teamB: this.currentMatchDetails.teamB,
            matchDate: this.currentMatchDetails.matchDate,
            
            // All teams with their analysis
            teams: this.currentTeams.map((team, index) => {
                const analysisResult = this.lastAnalysisResults.find(r => r.team === team.name);
                
                // Enhanced player data
                const enhancedPlayers = team.validationResults ? 
                    team.validationResults.filter(p => p.isValid).map(player => ({
                        name: player.validatedName || player.inputName,
                        role: player.role || 'Unknown',
                        team: player.team || 'Unknown'
                    })) :
                    team.players.map(playerName => ({
                        name: playerName,
                        role: 'Unknown',
                        team: 'Unknown'
                    }));

                // Team composition
                const composition = this.calculateTeamComposition(team);
                const teamCounts = this.calculateTeamPlayerCounts(team);
                
                return {
                    teamName: team.name,
                    players: enhancedPlayers,
                    captain: team.captain,
                    viceCaptain: team.viceCaptain,
                    composition: {
                        wicketKeepers: composition.wk,
                        batsmen: composition.bat,
                        allRounders: composition.ar,
                        bowlers: composition.bowl,
                        teamAPlayers: teamCounts.teamACount,
                        teamBPlayers: teamCounts.teamBCount
                    },
                    individualSummary: analysisResult ? analysisResult.summary : null,
                    hasError: analysisResult ? !!analysisResult.error : true
                };
            })
        };

        // Call new overall summary API
        const response = await fetch(`${CONSTANTS.API_BASE_URL}/overall-team-summary`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(overallAnalysisData)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API request failed: ${response.status} - ${errorText}`);
        }

        const result = await response.json();

        if (result.success) {
            if (!result.overallSummary || result.overallSummary.trim() === '') {
                throw new Error('API returned empty summary content');
            }
            return result.overallSummary;
        } else {
            throw new Error(result.message || 'Failed to generate overall summary');
        }
    }

    displayOverallSummary(summary) {
        const resultDiv = document.getElementById('overall-summary-result');
        
        if (!resultDiv) {
            return;
        }

        if (!summary) {
            resultDiv.innerHTML = `
                <div class="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                    <div class="text-yellow-800 font-medium">No summary data received</div>
                    <div class="text-yellow-600 text-sm mt-1">The API returned an empty response</div>
                </div>
            `;
            return;
        }

        // Format the summary with better styling
        const formattedSummary = summary
            .replace(/\*\*(.*?)\*\*/g, '<strong class="text-primary font-semibold">$1</strong>')
            .replace(/\n/g, '<br>');

        resultDiv.innerHTML = `
            <div class="bg-gradient-to-r from-primary/5 to-secondary/5 rounded-lg p-6 border border-primary/20 shadow-lg">
                <div class="flex items-center mb-4">
                    
                    <h3 class="text-lg font-bold text-gray-900">Overall Team Portfolio Analysis</h3>
                </div>
                <div class="text-sm text-gray-700 leading-relaxed space-y-3">
                    ${formattedSummary}
                </div>
            </div>
        `;

        this.components.toast.showSuccess('Overall summary generated!');
    }

    // Comparison functionality removed - tab is now empty
    async compareTeams() {
        console.log('Comparison functionality removed');
    }

    async generateComparisonData() {
        console.log('Comparison functionality removed');
        return {};
    }

    calculateTeamBalance() {
        console.log('Comparison functionality removed');
        return 0;
    }

    calculateOverallRating() {
        console.log('Comparison functionality removed');
        return 0;
    }

    displayComparisonResults() {
        console.log('Comparison functionality removed');
    }

    displayCompositionCharts() {
        console.log('Comparison functionality removed');
    }

    displayPlayerOverlap() {
        console.log('Comparison functionality removed');
    }

    displaySummaryAndPatterns() {
        console.log('Comparison functionality removed');
    }

    async generateAIRecommendations() {
        console.log('Comparison functionality removed');
    }

    generateComprehensiveRecommendation() {
        console.log('Comparison functionality removed');
    }

    analyzeTeamPatterns() {
        console.log('Comparison functionality removed');
        return [];
    }

    generateScenarioRecommendations() {
        console.log('Comparison functionality removed');
        return [];
    }

    // Removed duplicate generateOverallSummary function - was overriding the real API function

    generateBestTeamRecommendation() {
        console.log('Comparison functionality removed');
        return '';
    }

    getMostCommonPattern() {
        console.log('Comparison functionality removed');
        return '';
    }

    getCompositionInsight() {
        console.log('Comparison functionality removed');
        return '';
    }

    generateRecommendation() {
        console.log('Comparison functionality removed');
    }

    generateBasicRecommendation() {
        console.log('Comparison functionality removed');
    }

    showComparisonLoading() {
        console.log('Comparison functionality removed');
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

    // Team composition calculation
    calculateTeamComposition(team) {
        if (!team.validationResults) return { wk: 0, bat: 0, ar: 0, bowl: 0 };

        let wk = 0, bat = 0, ar = 0, bowl = 0;

        team.validationResults.forEach(player => {
            if (!player.isValid || !player.role) return;

            const role = player.role.toLowerCase();
            if (role.includes('wicket') || role.includes('keeper') || role.includes('wk')) {
                wk++;
            } else if (role.includes('all') || role.includes('rounder') || role.includes('ar')) {
                ar++;
            } else if (role.includes('bowl') || role.includes('spinner') || role.includes('pacer')) {
                bowl++;
            } else if (role.includes('bat') || role.includes('batsman') || role.includes('batter')) {
                bat++;
            } else {
                // Default classification based on common player names/patterns
                const name = player.validatedName.toLowerCase();
                if (name.includes('pant') || name.includes('dhoni') || name.includes('karthik') || 
                    name.includes('kishan') || name.includes('salt') || name.includes('buttler') || 
                    name.includes('samson') || name.includes('rahul')) {
                    wk++;
                } else if (name.includes('bumrah') || name.includes('chahal') || name.includes('shami') || 
                         name.includes('archer') || name.includes('boult') || name.includes('hazlewood') ||
                         name.includes('malinga') || name.includes('rashid') || name.includes('nortje')) {
                    bowl++;
                } else if (name.includes('jadeja') || name.includes('pandya') || name.includes('russell') || 
                         name.includes('stokes') || name.includes('maxwell') || name.includes('stoinis') ||
                         name.includes('narine') || name.includes('pollard')) {
                    ar++;
                } else {
                    bat++; // Default to batsman
                }
            }
        });

        return { wk, bat, ar, bowl };
    }

    // Calculate how many players are from Team A and Team B
    calculateTeamPlayerCounts(team) {
        if (!team.validationResults) return { teamACount: 0, teamBCount: 0 };

        const teamA = this.currentMatchDetails?.teamA || 'Team A';
        const teamB = this.currentMatchDetails?.teamB || 'Team B';
        
        let teamACount = 0;
        let teamBCount = 0;

        team.validationResults.forEach(player => {
            if (!player.isValid || !player.team) return;

            const playerTeam = player.team;
            if (playerTeam === teamA || (teamA && playerTeam.includes(teamA))) {
                teamACount++;
            } else if (playerTeam === teamB || (teamB && playerTeam.includes(teamB))) {
                teamBCount++;
            }
        });

        return { teamACount, teamBCount };
    }

    // Generate team-based scenario tag
    generateTeamBasedTag(team) {
        const teamCounts = this.calculateTeamPlayerCounts(team);
        const teamA = this.currentMatchDetails?.teamA || 'Team A';
        const teamB = this.currentMatchDetails?.teamB || 'Team B';

        // Check if captain or vice-captain is from specific team
        const captainData = team.validationResults?.find(p => p.validatedName === team.captain);
        const viceCaptainData = team.validationResults?.find(p => p.validatedName === team.viceCaptain);
        
        const captainFromA = captainData?.team === teamA || (teamA && captainData?.team?.includes(teamA));
        const captainFromB = captainData?.team === teamB || (teamB && captainData?.team?.includes(teamB));
        const vcFromA = viceCaptainData?.team === teamA || (teamA && viceCaptainData?.team?.includes(teamA));
        const vcFromB = viceCaptainData?.team === teamB || (teamB && viceCaptainData?.team?.includes(teamB));

        // Adjust counts if captain/vc is from specific team
        let effectiveTeamACount = teamCounts.teamACount + (captainFromA ? 0.5 : 0) + (vcFromA ? 0.5 : 0);
        let effectiveTeamBCount = teamCounts.teamBCount + (captainFromB ? 0.5 : 0) + (vcFromB ? 0.5 : 0);

        if (effectiveTeamACount >= 6) {
            return `${this.getTeamShortName(teamA)} Stack`;
        } else if (effectiveTeamBCount >= 6) {
            return `${this.getTeamShortName(teamB)} Stack`;
        } else {
            return 'Even Spread';
        }
    }

    // Generate match flow scenario tag
    generateMatchFlowTag(team) {
        const composition = this.calculateTeamComposition(team);
        
        // Get captain and vice-captain roles
        const captainData = team.validationResults?.find(p => p.validatedName === team.captain);
        const viceCaptainData = team.validationResults?.find(p => p.validatedName === team.viceCaptain);
        
        const captainRole = captainData?.role || '';
        const vcRole = viceCaptainData?.role || '';
        
        const isCaptainBatter = captainRole.includes('BATSMAN') || captainRole.includes('WK');
        const isVcBatter = vcRole.includes('BATSMAN') || vcRole.includes('WK');
        const isCaptainBowler = captainRole.includes('BOWLER');
        const isVcBowler = vcRole.includes('BOWLER');

        // Calculate total attacking vs defensive players
        const attackingPlayers = composition.bat + composition.wk; // Batsmen + WK
        const bowlingPlayers = composition.bowl;
        const totalPlayers = attackingPlayers + bowlingPlayers + composition.ar;

        // Extreme batting lineup (7+ batsmen/WK)
        if (attackingPlayers >= 7) {
            return 'High Scoring Match';
        }
        
        // Very bowling heavy (6+ bowlers)
        if (bowlingPlayers >= 6) {
            return 'Collapse Scenario';
        }
        
        // Batting dominant with batter captain/VC (6+ attacking players)
        if (attackingPlayers >= 6 && (isCaptainBatter || isVcBatter)) {
            return 'High Scoring Match';
        }
        
        // Bowling dominant with bowler captain/VC (5+ bowlers)
        if (bowlingPlayers >= 5 && (isCaptainBowler || isVcBowler)) {
            return 'Collapse Scenario';
        }
        
        // Bowling setup (4+ bowlers with bowling captain/VC)
        if (bowlingPlayers >= 4 && (isCaptainBowler || isVcBowler)) {
            return "Bowler's Pitch Setup";
        }

        // Check if it's reasonably balanced (3-4 in each major category)
        if (attackingPlayers >= 3 && attackingPlayers <= 5 && bowlingPlayers >= 3 && bowlingPlayers <= 5) {
            return 'Balanced Setup';
        }

        // Default for edge cases
        return 'Balanced Setup';
    }

    // Generate strategy-based tag  
    generateStrategyTag(team) {
        if (!team.validationResults) return 'Unknown Strategy';

        let popularPlayers = 0;
        let differentialPlayers = 0;

        team.validationResults.forEach(player => {
            if (!player.isValid) return;
            
            // Use player role and team status as proxy for popularity
            // Popular picks: Top-order batsmen, regular wicket-keepers, main bowlers
            const role = player.role || '';
            const isMainPlayer = role.includes('BATSMAN') || role.includes('WK') || 
                               (role.includes('BOWLER') && !role.includes('AR'));
            
            // Consider captain/vice-captain as popular picks
            const isCaptainOrVC = player.validatedName === team.captain || 
                                player.validatedName === team.viceCaptain;
            
            if (isMainPlayer || isCaptainOrVC) {
                popularPlayers++;
            } else if (role.includes('AR') || role === '') {
                // All-rounders and unknown roles tend to be differential
                differentialPlayers++;
            }
        });

        if (popularPlayers >= 8) {
            return 'Safe Core Team';
        } else if (differentialPlayers >= 4) {
            return 'Differential Attack';
        } else {
            return 'Balanced Strategy';
        }
    }

    // Generate team preview cards
    generateTeamPreviewCards() {
        if (this.currentTeams.length === 0) {
            return '<div class="text-center text-gray-500 py-8">No teams available</div>';
        }

        const teamA = this.currentMatchDetails?.teamA || 'Team A';
        const teamB = this.currentMatchDetails?.teamB || 'Team B';

        return `
            <div class="space-y-4">
                ${this.currentTeams.map((team, index) => {
                    const composition = this.calculateTeamComposition(team);
                    const teamCounts = this.calculateTeamPlayerCounts(team);
                    const captainName = team.captain || 'Not selected';
                    const viceCaptainName = team.viceCaptain || 'Not selected';
                    
                    // Get captain and vice-captain details
                    const captainData = team.validationResults?.find(p => p.validatedName === captainName);
                    const viceCaptainData = team.validationResults?.find(p => p.validatedName === viceCaptainName);
                    
                    return `
                        <div class="max-w-sm mx-auto">
                            <!-- Team Title -->
                            <div class="text-left mb-2">
                                <h3 class="text-lg font-bold text-gray-900">Team ${index + 1}</h3>
                            </div>
                            
                            <!-- Team Card -->
                            <div class="relative overflow-hidden rounded-lg shadow-lg" style="background-image: url('https://fantasy.cricbuzz11.com/_next/image?url=https%3A%2F%2Ffantasy.cricbuzz11.com%2Fhulk-static-images%2Fassets%2Fimages%2Fteams%2Fbg-card.jpg&w=384&q=75'); background-size: cover; background-position: center;">
                            <!-- Card Content -->
                            <div class="relative p-3">
                                <!-- Main Content Row -->
                                <div class="flex items-center justify-between mb-2">
                                    <!-- Left: Team Names and Counts -->
                                    <div class="flex space-x-6">
                                        <!-- Team A Column -->
                                        <div class="flex flex-col items-center">
                                            <span class="font-bold text-white" style="font-size: 20px;">${teamCounts.teamACount}</span>
                                            <div class="text-white" style="font-size: 12px;">${this.getTeamShortName(teamA) || 'WI'}</div>
                                        </div>
                                        <!-- Team B Column -->
                                        <div class="flex flex-col items-center">
                                            <span class="font-bold text-white" style="font-size: 20px;">${teamCounts.teamBCount}</span>
                                            <div class="text-white" style="font-size: 12px;">${this.getTeamShortName(teamB) || 'AUS'}</div>
                                        </div>
                                    </div>

                                    <!-- Right: Captain and Vice Captain -->
                                    <div class="flex items-center space-x-4">
                                        <!-- Captain -->
                                        <div class="flex flex-col items-center w-16">
                                            <div class="relative mb-1">
                                                <img src="https://fantasy.cricbuzz11.com/_next/image?url=https%3A%2F%2Fd13ir53smqqeyp.cloudfront.net%2Fplayer-images%2Fdefault-player-image.png&w=96&q=75" 
                                                     alt="${captainName}" 
                                                     class="w-10 h-10 rounded-full border-2 border-white object-cover"
                                                     onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
                                                <div class="w-10 h-10 rounded-full border-2 border-white bg-white flex items-center justify-center text-gray-800 font-bold" style="display: none;">
                                                    ${captainName.charAt(0).toUpperCase()}
                                                </div>
                                                <div class="absolute -top-1 -right-1 w-5 h-5 bg-white text-black text-xs font-bold rounded-full flex items-center justify-center shadow-sm">
                                                    C
                                                </div>
                                            </div>
                                            <div class="bg-white bg-opacity-95 rounded px-1 py-0.5 w-full">
                                                <div class="text-xs text-black text-center truncate" title="${captainName}">${captainName.split(' ').length > 1 ? captainName.charAt(0) + ' ' + captainName.split(' ').pop() : captainName}</div>
                                            </div>
                                        </div>

                                        <!-- Vice Captain -->
                                        <div class="flex flex-col items-center w-16">
                                            <div class="relative mb-1">
                                                <img src="https://fantasy.cricbuzz11.com/_next/image?url=https%3A%2F%2Fd13ir53smqqeyp.cloudfront.net%2Fplayer-images%2Fdefault-player-image.png&w=96&q=75" 
                                                     alt="${viceCaptainName}" 
                                                     class="w-10 h-10 rounded-full border-2 border-white object-cover"
                                                     onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
                                                <div class="w-10 h-10 rounded-full border-2 border-white bg-white flex items-center justify-center text-gray-800 font-bold" style="display: none;">
                                                    ${viceCaptainName.charAt(0).toUpperCase()}
                                                </div>
                                                <div class="absolute -top-1 -right-1 w-5 h-5 bg-white text-black text-xs font-bold rounded-full flex items-center justify-center shadow-sm">
                                                    VC
                                                </div>
                                            </div>
                                            <div class="bg-white bg-opacity-95 rounded px-1 py-0.5 w-full">
                                                <div class="text-xs text-black text-center truncate" title="${viceCaptainName}">${viceCaptainName.split(' ').length > 1 ? viceCaptainName.charAt(0) + ' ' + viceCaptainName.split(' ').pop() : viceCaptainName}</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <!-- Bottom: Team Composition Stats -->
                                <div class="flex justify-between text-white mt-1" style="font-size: 12px;">
                                    <span>WK: <strong>${composition.wk}</strong></span>
                                    <span>BAT: <strong>${composition.bat}</strong></span>
                                    <span>AR: <strong>${composition.ar}</strong></span>
                                    <span>BOWL: <strong>${composition.bowl}</strong></span>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Team Analysis Tags (Outside the card) -->
                        <div class="mt-3">
                            <div class="flex flex-wrap gap-2">
                                <span class="bg-gray-200 text-gray-800 text-xs px-2 py-1 rounded font-medium">${this.generateTeamBasedTag(team)}</span>
                                <span class="bg-gray-200 text-gray-800 text-xs px-2 py-1 rounded font-medium">${this.generateMatchFlowTag(team)}</span>
                                <span class="bg-gray-200 text-gray-800 text-xs px-2 py-1 rounded font-medium">${this.generateStrategyTag(team)}</span>
                            </div>
                        </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }

    // Loading state handlers to prevent multiple rapid clicks
    async handleAnalyzeAllTeamsWithLoading() {
        const analyzeBtn = document.getElementById('analyze-all-btn');
        if (!analyzeBtn) return;

        // Check if already loading
        if (analyzeBtn.disabled) {
            console.log('Analysis already in progress');
            return;
        }

        // Set loading state
        const originalText = analyzeBtn.textContent;
        analyzeBtn.disabled = true;
        analyzeBtn.textContent = 'Analyzing...';
        analyzeBtn.classList.add('opacity-50', 'cursor-not-allowed');

        try {
            await this.analyzeAllTeams();
            // Hide the analyze button after successful analysis
            analyzeBtn.style.display = 'none';
            
            // Also hide the description text
            const descriptionText = analyzeBtn.nextElementSibling;
            if (descriptionText && descriptionText.tagName === 'P') {
                descriptionText.style.display = 'none';
            }
        } catch (error) {
            // Reset button state on error
            analyzeBtn.disabled = false;
            analyzeBtn.textContent = originalText;
            analyzeBtn.classList.remove('opacity-50', 'cursor-not-allowed');
        }
    }

    async handleValidatePlayersWithLoading() {
        const validateBtn = document.getElementById('validate-players-btn');
        if (!validateBtn) return;

        // Check if already loading
        if (validateBtn.disabled) {
            console.log('Validation already in progress');
            return;
        }

        // Set loading state
        const originalText = validateBtn.textContent;
        validateBtn.disabled = true;
        validateBtn.textContent = 'Validating...';
        validateBtn.classList.add('opacity-50', 'cursor-not-allowed');

        try {
            await this.displayTeamDetails();
            // Update teams summary in real-time after validation
            await this.displayTeamsSummary().catch(error => {
                console.error('Error updating teams summary after validation:', error);
            });
        } finally {
            // Reset button state
            validateBtn.disabled = false;
            validateBtn.textContent = originalText;
            validateBtn.classList.remove('opacity-50', 'cursor-not-allowed');
        }
    }

    static makeTestAvailable() {
        // Make the app instance available globally for testing and summary updates
        window.tabbedTeamAnalysisApp = this;
        console.log('Tabbed team analysis app instance made available globally as window.tabbedTeamAnalysisApp');
    }

    // Add method to refresh summary in real-time
    async refreshSummaryInRealTime() {
        try {
            console.log('Refreshing team analysis summary in real-time...');
            
            // Regenerate team analysis
            const analysis = await this.generateComprehensiveTeamAnalysis();
            
            // Update the display
            this.displayAnalysisResults(analysis);
            
            console.log('Team analysis summary updated in real-time:', analysis);
        } catch (error) {
            console.error('Error updating team analysis summary in real-time:', error);
        }
    }

    async handleComprehensiveComparison() {
        console.log('Starting comprehensive team comparison...');
        
        if (this.currentTeams.length === 0) {
            this.components.toast.showError('No teams available for comparison');
            return;
        }

        try {
            // Show loading state
            this.showComprehensiveComparisonLoading();
            
            // Get match details
            const currentMatchDetails = this.currentMatchDetails || 
                JSON.parse(sessionStorage.getItem('currentMatchDetails') || '{}');
            
            if (!currentMatchDetails.teamA || !currentMatchDetails.teamB) {
                this.components.toast.showError('Match details not available. Please select a match first.');
                return;
            }

            // Fetch all required data
            const [teamFormData, headToHeadData, venueStatsData] = await Promise.all([
                this.fetchTeamRecentForm(),
                this.fetchHeadToHead(),
                this.fetchVenueStats()
            ]);

            // Perform comprehensive comparison
            const comparisonResults = await this.performComprehensiveComparison(
                this.currentTeams,
                currentMatchDetails,
                teamFormData,
                headToHeadData,
                venueStatsData
            );

            // Display results
            this.displayComprehensiveComparisonResults(comparisonResults);

        } catch (error) {
            console.error('Comprehensive comparison error:', error);
            this.components.toast.showError('Failed to perform comparison. Please try again.');
            this.hideComprehensiveComparisonLoading();
        }
    }

    async performComprehensiveComparison(teams, matchDetails, teamFormData, headToHeadData, venueStatsData) {
        console.log('Performing comprehensive comparison...');
        
        const results = {
            teams: [],
            bestTeam: null,
            summary: {}
        };

        for (let i = 0; i < teams.length; i++) {
            const team = teams[i];
            console.log(`Evaluating team ${i + 1}: ${team.name}`);
            
            const evaluation = {
                teamName: team.name,
                teamIndex: i,
                scores: {},
                totalScore: 0,
                recommendations: []
            };

            // 1. Team Balance (0-5)
            evaluation.scores.teamBalance = this.evaluateTeamBalance(team);
            
            // 2. Captain & Vice-Captain Impact (0-5)
            evaluation.scores.captaincyImpact = this.evaluateCaptaincyImpact(team, matchDetails);
            
            // 3. Matchup Advantage (0-5)
            evaluation.scores.matchupAdvantage = this.evaluateMatchupAdvantage(team, matchDetails, headToHeadData);
            
            // 4. Venue Impact (0-5)
            evaluation.scores.venueImpact = this.evaluateVenueImpact(team, matchDetails, venueStatsData);
            
            // 5. Form and Recency (0-5)
            evaluation.scores.formRecency = this.evaluateFormRecency(team, matchDetails, teamFormData);
            
            // 6. Covariance/Duplication between teams (0-5)
            evaluation.scores.covariance = this.evaluateCovariance(team, teams, i);
            
            // 7. Differential Picks / Uniqueness (0-5)
            evaluation.scores.uniqueness = this.evaluateUniqueness(team, teams, i);

            // Calculate total score
            evaluation.totalScore = Object.values(evaluation.scores).reduce((sum, score) => sum + score, 0);
            
            // Generate recommendations
            evaluation.recommendations = this.generateTeamRecommendations(evaluation, team, matchDetails);
            
            results.teams.push(evaluation);
        }

        // Find best team
        results.bestTeam = results.teams.reduce((best, current) => 
            current.totalScore > best.totalScore ? current : best
        );

        // Generate summary
        results.summary = this.generateComparisonSummary(results);

        console.log('Comprehensive comparison completed:', results);
        return results;
    }

    evaluateTeamBalance(team) {
        if (!team.players || team.players.length === 0) return 0;
        
        const composition = this.analyzeTeamComposition(team.players);
        let score = 0;
        
        // Check for balanced composition
        const hasWicketKeeper = composition.wicketKeepers > 0;
        const hasBatsmen = composition.batsmen >= 3;
        const hasBowlers = composition.bowlers >= 3;
        const hasAllRounders = composition.allRounders >= 1;
        
        if (hasWicketKeeper) score += 1;
        if (hasBatsmen) score += 1;
        if (hasBowlers) score += 1;
        if (hasAllRounders) score += 1;
        
        // Bonus for optimal balance
        if (composition.batsmen >= 4 && composition.bowlers >= 4) score += 1;
        
        return Math.min(score, 5);
    }

    evaluateCaptaincyImpact(team, matchDetails) {
        let score = 0;
        
        // Check if captain is set
        if (team.captain && team.captain !== 'Not specified' && team.captain !== 'Not selected') {
            score += 2;
            
            // Check if captain is from the playing teams
            const captainTeam = this.categorizePlayerByTeam(team.captain, matchDetails.teamA, matchDetails.teamB);
            if (captainTeam) score += 1;
            
            // Check if vice-captain is set
            if (team.viceCaptain && team.viceCaptain !== 'Not specified' && team.viceCaptain !== 'Not selected') {
                score += 1;
                
                // Check if vice-captain is different from captain
                if (team.viceCaptain !== team.captain) score += 1;
            }
        }
        
        return Math.min(score, 5);
    }

    evaluateMatchupAdvantage(team, matchDetails, headToHeadData) {
        if (!headToHeadData || !headToHeadData.success) return 2.5; // Neutral score
        
        let score = 2.5; // Start with neutral score
        
        try {
            const data = headToHeadData.data || headToHeadData;
            
            // Analyze head-to-head data
            if (data.total_matches > 0) {
                const teamAWins = data.team1_wins || 0;
                const teamBWins = data.team2_wins || 0;
                const totalMatches = data.total_matches || 0;
                
                // Calculate win percentage
                const teamAWinRate = totalMatches > 0 ? (teamAWins / totalMatches) * 100 : 50;
                const teamBWinRate = totalMatches > 0 ? (teamBWins / totalMatches) * 100 : 50;
                
                // Count players from each team
                const teamAPlayers = team.players?.filter(player => 
                    this.categorizePlayerByTeam(player, matchDetails.teamA, matchDetails.teamB) === matchDetails.teamA
                ).length || 0;
                
                const teamBPlayers = team.players?.filter(player => 
                    this.categorizePlayerByTeam(player, matchDetails.teamA, matchDetails.teamB) === matchDetails.teamB
                ).length || 0;
                
                // Score based on historical advantage
                if (teamAPlayers > teamBPlayers && teamAWinRate > teamBWinRate) {
                    score += 1.5;
                } else if (teamBPlayers > teamAPlayers && teamBWinRate > teamAWinRate) {
                    score += 1.5;
                }
                
                // Bonus for significant historical advantage
                if (Math.abs(teamAWinRate - teamBWinRate) > 20) {
                    score += 1;
                }
            }
        } catch (error) {
            console.error('Error evaluating matchup advantage:', error);
        }
        
        return Math.min(Math.max(score, 0), 5);
    }

    evaluateVenueImpact(team, matchDetails, venueStatsData) {
        if (!venueStatsData || !venueStatsData.success) return 2.5; // Neutral score
        
        let score = 2.5; // Start with neutral score
        
        try {
            const venueData = venueStatsData.data?.venueStats || venueStatsData.venueStats;
            
            if (venueData) {
                // Analyze venue characteristics
                const avgFirstInnings = venueData.avg_first_innings_score || 0;
                const avgSecondInnings = venueData.avg_second_innings_score || 0;
                const pitchType = venueData.pitch_type || 'neutral';
                
                // Count players by role
                const composition = this.analyzeTeamComposition(team.players || []);
                
                // Score based on venue characteristics
                if (pitchType === 'batting' && composition.batsmen >= 5) {
                    score += 1.5;
                } else if (pitchType === 'bowling' && composition.bowlers >= 5) {
                    score += 1.5;
                }
                
                // Bonus for balanced team on neutral pitch
                if (pitchType === 'neutral' && composition.batsmen >= 4 && composition.bowlers >= 4) {
                    score += 1;
                }
            }
        } catch (error) {
            console.error('Error evaluating venue impact:', error);
        }
        
        return Math.min(Math.max(score, 0), 5);
    }

    evaluateFormRecency(team, matchDetails, teamFormData) {
        if (!teamFormData || !teamFormData.success) return 2.5; // Neutral score
        
        let score = 2.5; // Start with neutral score
        
        try {
            const formData = teamFormData.data || teamFormData;
            
            // Analyze recent form data
            if (formData.recent_matches && formData.recent_matches.length > 0) {
                const recentMatches = formData.recent_matches.slice(0, 5); // Last 5 matches
                const wins = recentMatches.filter(match => match.result === 'W').length;
                const winRate = (wins / recentMatches.length) * 100;
                
                // Score based on recent form
                if (winRate >= 80) score += 2;
                else if (winRate >= 60) score += 1.5;
                else if (winRate >= 40) score += 1;
            }
        } catch (error) {
            console.error('Error evaluating form recency:', error);
        }
        
        return Math.min(Math.max(score, 0), 5);
    }

    evaluateCovariance(team, allTeams, teamIndex) {
        if (allTeams.length <= 1) return 5; // Perfect score for single team
        
        let score = 5; // Start with perfect score
        let totalDuplicates = 0;
        
        // Check for player duplication with other teams
        for (let i = 0; i < allTeams.length; i++) {
            if (i === teamIndex) continue; // Skip self
            
            const otherTeam = allTeams[i];
            const duplicates = this.countPlayerDuplicates(team.players || [], otherTeam.players || []);
            totalDuplicates += duplicates;
        }
        
        // Penalize for duplicates
        if (totalDuplicates >= 6) score -= 3;
        else if (totalDuplicates >= 4) score -= 2;
        else if (totalDuplicates >= 2) score -= 1;
        
        return Math.min(Math.max(score, 0), 5);
    }

    evaluateUniqueness(team, allTeams, teamIndex) {
        if (allTeams.length <= 1) return 5; // Perfect score for single team
        
        let score = 5; // Start with perfect score
        let uniquePlayers = 0;
        
        // Count unique players
        const teamPlayers = team.players || [];
        for (const player of teamPlayers) {
            let isUnique = true;
            
            for (let i = 0; i < allTeams.length; i++) {
                if (i === teamIndex) continue; // Skip self
                
                const otherTeam = allTeams[i];
                const otherPlayers = otherTeam.players || [];
                
                if (otherPlayers.some(otherPlayer => 
                    this.normalizePlayerName(otherPlayer) === this.normalizePlayerName(player)
                )) {
                    isUnique = false;
                    break;
                }
            }
            
            if (isUnique) uniquePlayers++;
        }
        
        // Score based on uniqueness
        const uniquenessPercentage = teamPlayers.length > 0 ? (uniquePlayers / teamPlayers.length) * 100 : 0;
        
        if (uniquenessPercentage >= 80) score = 5;
        else if (uniquenessPercentage >= 60) score = 4;
        else if (uniquenessPercentage >= 40) score = 3;
        else if (uniquenessPercentage >= 20) score = 2;
        else score = 1;
        
        return score;
    }

    countPlayerDuplicates(players1, players2) {
        let duplicates = 0;
        
        for (const player1 of players1) {
            const normalizedPlayer1 = this.normalizePlayerName(player1);
            
            for (const player2 of players2) {
                const normalizedPlayer2 = this.normalizePlayerName(player2);
                
                if (normalizedPlayer1 === normalizedPlayer2) {
                    duplicates++;
                    break;
                }
            }
        }
        
        return duplicates;
    }

    generateTeamRecommendations(evaluation, team, matchDetails) {
        const recommendations = [];
        
        // Team Balance recommendations
        if (evaluation.scores.teamBalance < 3) {
            recommendations.push('Consider adding more balanced player roles');
        } else if (evaluation.scores.teamBalance >= 4) {
            // Well-balanced team - provide venue/pitch recommendations
            const venueRecommendation = this.generateVenueRecommendation(team, matchDetails);
            if (venueRecommendation) {
                recommendations.push(venueRecommendation);
            }
        }
        
        // Captaincy recommendations
        if (evaluation.scores.captaincyImpact < 3) {
            recommendations.push('Set captain and vice-captain for better impact');
        }
        
        // Uniqueness recommendations
        if (evaluation.scores.uniqueness < 3) {
            recommendations.push('Consider more differential picks for uniqueness');
        }
        
        // Covariance recommendations
        if (evaluation.scores.covariance < 3) {
            recommendations.push('Too many duplicate players with other teams');
        }
        
        return recommendations;
    }

    generateVenueRecommendation(team, matchDetails) {
        try {
            // Get venue stats from session storage or fetch if needed
            const venueStatsData = JSON.parse(sessionStorage.getItem('venueStatsData') || '{}');
            
            if (!venueStatsData || !venueStatsData.success) {
                return null;
            }

            const venueData = venueStatsData.data?.venueStats || venueStatsData.venueStats;
            if (!venueData) {
                return null;
            }

            const composition = this.analyzeTeamComposition(team.players || []);
            const pitchType = venueData.pitch_type || 'neutral';
            const avgFirstInnings = venueData.avg_first_innings_score || 0;
            const avgSecondInnings = venueData.avg_second_innings_score || 0;

            // Analyze team composition
            const batsmenCount = composition.batsmen || 0;
            const bowlersCount = composition.bowlers || 0;
            const allRoundersCount = composition.allRounders || 0;

            // Generate venue-specific recommendations
            if (pitchType === 'batting') {
                if (batsmenCount >= 5) {
                    return `🏏 Batting pitch detected - Your batting-heavy team (${batsmenCount} batsmen) is well-suited for this venue`;
                } else if (bowlersCount >= 5) {
                    return `🏏 Batting pitch detected - Consider adding more batsmen for this high-scoring venue`;
                }
            } else if (pitchType === 'bowling') {
                if (bowlersCount >= 5) {
                    return `🏏 Bowling pitch detected - Your bowling-heavy team (${bowlersCount} bowlers) is ideal for this venue`;
                } else if (batsmenCount >= 5) {
                    return `🏏 Bowling pitch detected - Consider adding more bowlers for this low-scoring venue`;
                }
            } else if (pitchType === 'neutral') {
                if (batsmenCount >= 4 && bowlersCount >= 4) {
                    return `🏏 Neutral pitch - Your balanced team (${batsmenCount} batsmen, ${bowlersCount} bowlers) is perfect for this venue`;
                }
            }

            // Score-based recommendations
            if (avgFirstInnings > 180) {
                return `🏏 High-scoring venue (avg: ${avgFirstInnings}) - Your team composition should favor batting`;
            } else if (avgFirstInnings < 150) {
                return `🏏 Low-scoring venue (avg: ${avgFirstInnings}) - Your team composition should favor bowling`;
            }

            return null;
        } catch (error) {
            console.error('Error generating venue recommendation:', error);
            return null;
        }
    }

    generateComparisonSummary(results) {
        const summary = {
            totalTeams: results.teams.length,
            averageScore: 0,
            scoreRange: { min: 0, max: 0 },
            topTeams: [],
            keyInsights: []
        };
        
        if (results.teams.length > 0) {
            const scores = results.teams.map(team => team.totalScore);
            summary.averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
            summary.scoreRange.min = Math.min(...scores);
            summary.scoreRange.max = Math.max(...scores);
            
            // Top 3 teams
            summary.topTeams = results.teams
                .sort((a, b) => b.totalScore - a.totalScore)
                .slice(0, 3);
            
            // Key insights
            if (results.bestTeam) {
                summary.keyInsights.push(`Best team: ${results.bestTeam.teamName} (Score: ${results.bestTeam.totalScore.toFixed(1)})`);
            }
            
            const avgScore = summary.averageScore.toFixed(1);
            summary.keyInsights.push(`Average team score: ${avgScore}/35`);
            
            if (summary.scoreRange.max - summary.scoreRange.min > 10) {
                summary.keyInsights.push('High variance in team quality');
            }
        }
        
        return summary;
    }

    displayComprehensiveComparisonResults(results) {
        console.log('Displaying comprehensive comparison results...');
        
        const resultsContainer = document.getElementById('comprehensive-comparison-results');
        if (!resultsContainer) return;

        // Hide loading state
        this.hideComprehensiveComparisonLoading();

        // Generate results HTML
        const resultsHtml = `
            <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <!-- Summary Section -->
                <div class="mb-6">
                    <h3 class="text-lg font-bold text-gray-900 mb-4 flex items-center">
                        <span class="text-primary mr-2">🏆</span>
                        Comparison Summary
                    </h3>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div class="bg-blue-50 p-4 rounded-lg border border-blue-200 text-center flex flex-col justify-center items-center min-h-[80px]">
                            <div class="text-3xl font-bold text-blue-600 mb-1">${results.summary.totalTeams}</div>
                            <div class="text-sm text-blue-700 font-medium">Teams Analyzed</div>
                        </div>
                        <div class="bg-green-50 p-4 rounded-lg border border-green-200 text-center flex flex-col justify-center items-center min-h-[80px]">
                            <div class="text-3xl font-bold text-green-600 mb-1">${results.summary.averageScore.toFixed(1)}</div>
                            <div class="text-sm text-green-700 font-medium">Average Score</div>
                        </div>
                        <div class="bg-purple-50 p-4 rounded-lg border border-purple-200 text-center flex flex-col justify-center items-center min-h-[80px]">
                            <div class="text-3xl font-bold text-purple-600 mb-1">${results.bestTeam ? results.bestTeam.teamName : 'N/A'}</div>
                            <div class="text-sm text-purple-700 font-medium">Best Team</div>
                        </div>
                    </div>
                    <div class="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                        <h4 class="font-semibold text-sm text-yellow-800 mb-2">Key Insights:</h4>
                        <ul class="text-sm text-yellow-700 space-y-1">
                            ${results.summary.keyInsights.map(insight => `<li>• ${insight}</li>`).join('')}
                        </ul>
                    </div>
                </div>

                <!-- Team Rankings -->
                <div class="mb-6">
                    <h3 class="text-lg font-bold text-gray-900 mb-4">Team Rankings</h3>
                    <div class="space-y-3">
                        ${results.teams
                            .sort((a, b) => b.totalScore - a.totalScore)
                            .map((team, index) => `
                                <div class="flex items-center justify-between p-4 rounded-lg border ${index === 0 ? 'border-yellow-300 bg-yellow-50' : 'border-gray-200 bg-gray-50'}">
                                    <div class="flex items-center gap-3">
                                        <div class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                                            index === 0 ? 'bg-yellow-500 text-white' : 
                                            index === 1 ? 'bg-gray-400 text-white' : 
                                            index === 2 ? 'bg-orange-500 text-white' : 'bg-gray-300 text-gray-700'
                                        }">
                                            ${index + 1}
                                        </div>
                                        <div>
                                            <div class="font-semibold text-gray-900">${team.teamName}</div>
                                            <div class="text-sm text-gray-600">Score: ${team.totalScore.toFixed(1)}/35</div>
                                        </div>
                                    </div>
                                    <div class="text-right">
                                        <div class="text-lg font-bold text-gray-900">${team.totalScore.toFixed(1)}</div>
                                        <div class="text-xs text-gray-500">Total Score</div>
                                    </div>
                                </div>
                            `).join('')}
                    </div>
                </div>

                <!-- Detailed Scores -->
                <div class="mb-6">
                    <h3 class="text-lg font-bold text-gray-900 mb-4">Detailed Scores by Criteria</h3>
                    
                    <!-- Criteria Descriptions -->
                    <div class="space-y-2 mb-4">
                        <div class="bg-blue-50 p-3 rounded-lg border border-blue-200">
                            <div class="font-semibold text-blue-800 text-sm">1. Team Balance</div>
                            <div class="text-xs text-blue-600">Optimal mix of batsmen, bowlers, all-rounders, wicket-keeper</div>
                        </div>
                        <div class="bg-green-50 p-3 rounded-lg border border-green-200">
                            <div class="font-semibold text-green-800 text-sm">2. Captain & Vice-Captain</div>
                            <div class="text-xs text-green-600">Proper captain selection and multiplier impact</div>
                        </div>
                        <div class="bg-purple-50 p-3 rounded-lg border border-purple-200">
                            <div class="font-semibold text-purple-800 text-sm">3. Matchup Advantage</div>
                            <div class="text-xs text-purple-600">Historical head-to-head performance analysis</div>
                        </div>
                        <div class="bg-orange-50 p-3 rounded-lg border border-orange-200">
                            <div class="font-semibold text-orange-800 text-sm">4. Venue Impact</div>
                            <div class="text-xs text-orange-600">Pitch conditions and venue-specific strategy</div>
                        </div>
                        <div class="bg-red-50 p-3 rounded-lg border border-red-200">
                            <div class="font-semibold text-red-800 text-sm">5. Form & Recency</div>
                            <div class="text-xs text-red-600">Recent player and team performance trends</div>
                        </div>
                        <div class="bg-indigo-50 p-3 rounded-lg border border-indigo-200">
                            <div class="font-semibold text-indigo-800 text-sm">6. Covariance</div>
                            <div class="text-xs text-indigo-600">Player overlap and duplication with other teams</div>
                        </div>
                        <div class="bg-teal-50 p-3 rounded-lg border border-teal-200">
                            <div class="font-semibold text-teal-800 text-sm">7. Uniqueness</div>
                            <div class="text-xs text-teal-600">Differential picks and strategic uniqueness</div>
                        </div>
                    </div>
                    
                    <div class="overflow-x-auto">
                        <table class="w-full text-sm">
                            <thead>
                                <tr class="border-b border-gray-200">
                                    <th class="text-left py-2 font-semibold text-gray-700">Team</th>
                                    <th class="text-center py-2 font-semibold text-gray-700">Balance</th>
                                    <th class="text-center py-2 font-semibold text-gray-700">Captaincy</th>
                                    <th class="text-center py-2 font-semibold text-gray-700">Matchup</th>
                                    <th class="text-center py-2 font-semibold text-gray-700">Venue</th>
                                    <th class="text-center py-2 font-semibold text-gray-700">Form</th>
                                    <th class="text-center py-2 font-semibold text-gray-700">Covariance</th>
                                    <th class="text-center py-2 font-semibold text-gray-700">Uniqueness</th>
                                    <th class="text-center py-2 font-semibold text-gray-700">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${results.teams
                                    .sort((a, b) => b.totalScore - a.totalScore)
                                    .map(team => `
                                        <tr class="border-b border-gray-100">
                                            <td class="py-2 font-medium text-gray-900">${team.teamName}</td>
                                            <td class="py-2 text-center">${team.scores.teamBalance.toFixed(1)}</td>
                                            <td class="py-2 text-center">${team.scores.captaincyImpact.toFixed(1)}</td>
                                            <td class="py-2 text-center">${team.scores.matchupAdvantage.toFixed(1)}</td>
                                            <td class="py-2 text-center">${team.scores.venueImpact.toFixed(1)}</td>
                                            <td class="py-2 text-center">${team.scores.formRecency.toFixed(1)}</td>
                                            <td class="py-2 text-center">${team.scores.covariance.toFixed(1)}</td>
                                            <td class="py-2 text-center">${team.scores.uniqueness.toFixed(1)}</td>
                                            <td class="py-2 text-center font-bold text-primary">${team.totalScore.toFixed(1)}</td>
                                        </tr>
                                    `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- Recommendations -->
                <div>
                    <h3 class="text-lg font-bold text-gray-900 mb-4">Team Recommendations</h3>
                    <div class="space-y-4">
                        ${results.teams.map(team => `
                            <div class="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                <h4 class="font-semibold text-gray-900 mb-2">${team.teamName}</h4>
                                ${team.recommendations.length > 0 ? `
                                    <ul class="text-sm text-gray-700 space-y-1">
                                        ${team.recommendations.map(rec => {
                                            // Check if it's a venue recommendation (contains 🏏)
                                            if (rec.includes('🏏')) {
                                                return `<li class="text-blue-600 font-medium">🏏 ${rec.replace('🏏 ', '')}</li>`;
                                            }
                                            return `<li>• ${rec}</li>`;
                                        }).join('')}
                                    </ul>
                                ` : `
                                    <p class="text-sm text-green-600">✅ No major improvements needed</p>
                                `}
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;

        resultsContainer.innerHTML = resultsHtml;
        
        // Scroll to results
        resultsContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
        
        this.components.toast.showSuccess('Comprehensive comparison completed!');
    }

    showComprehensiveComparisonLoading() {
        const resultsContainer = document.getElementById('comprehensive-comparison-results');
        if (!resultsContainer) return;

        resultsContainer.innerHTML = `
            <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div class="flex items-center justify-center py-8">
                    <div class="relative">
                        <div class="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                    </div>
                    <span class="ml-3 text-sm text-gray-600">Performing comprehensive analysis...</span>
                </div>
                <div class="text-center text-sm text-gray-500">
                    Evaluating teams on 7 criteria: Balance, Captaincy, Matchup, Venue, Form, Covariance, and Uniqueness
                </div>
            </div>
        `;
    }

    hideComprehensiveComparisonLoading() {
        // Loading state is replaced by results, so no specific hide action needed
    }
}

// Initialize the tabbed app when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.tabbedApp = new TabbedTeamAnalysisApp();
}); 