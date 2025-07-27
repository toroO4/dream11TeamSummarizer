// Enhanced Cricket Analyzer App - Unified Single & Multiple Team Analysis
class EnhancedCricketAnalyzerApp {
    constructor() {
        console.log('EnhancedCricketAnalyzerApp constructor called');
        
        this.components = {};
        this.currentTeams = [];
        this.currentMatchDetails = null;
        this.analysisMode = 'single';
        this.matches = [];
        this.selectedMatch = null;
        this.allMatches = []; // Store all matches for filtering
        this.activeFilters = {
            search: null,
            date: null
        };
        
        // Initialize components
        this.initializeComponents();
        this.setupEventListeners();
        this.loadMatches();
        
        // Make test function available
        EnhancedCricketAnalyzerApp.makeTestAvailable();
        
        console.log('EnhancedCricketAnalyzerApp initialized successfully');
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
        // Tour selection
        this.setupTourSelection();

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

        // Search and Filter Event Listeners
        this.setupSearchAndFilterListeners();

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

        // Generate Teams Summary button
        const generateSummaryBtn = document.getElementById('generate-summary-btn');
        if (generateSummaryBtn) {
            generateSummaryBtn.addEventListener('click', () => this.navigateToTeamSummary());
        }


    }

    setupSearchAndFilterListeners() {
        // Search input click
        const searchInput = document.getElementById('match-search');
        if (searchInput) {
            searchInput.addEventListener('click', () => this.toggleSearchDropdown());
            searchInput.addEventListener('focus', () => this.toggleSearchDropdown());
        }

        // Search button click
        const searchBtn = document.getElementById('search-btn');
        if (searchBtn) {
            searchBtn.addEventListener('click', () => this.toggleSearchDropdown());
        }

        // Date filter button click
        const dateFilterBtn = document.getElementById('date-filter-btn');
        if (dateFilterBtn) {
            dateFilterBtn.addEventListener('click', () => this.toggleDatePicker());
        }

        // Apply search
        const applySearchBtn = document.getElementById('apply-search');
        if (applySearchBtn) {
            applySearchBtn.addEventListener('click', () => this.applySearchFilter());
        }

        // Clear search
        const clearSearchBtn = document.getElementById('clear-search');
        if (clearSearchBtn) {
            clearSearchBtn.addEventListener('click', () => this.clearSearchFilter());
        }

        // Apply date
        const applyDateBtn = document.getElementById('apply-date');
        if (applyDateBtn) {
            applyDateBtn.addEventListener('click', () => this.applyDateFilter());
        }

        // Clear date
        const clearDateBtn = document.getElementById('clear-date');
        if (clearDateBtn) {
            clearDateBtn.addEventListener('click', () => this.clearDateFilter());
        }

        // Remove filter tags
        const removeSearchFilterBtn = document.getElementById('remove-search-filter');
        if (removeSearchFilterBtn) {
            removeSearchFilterBtn.addEventListener('click', () => this.clearSearchFilter());
        }

        const removeDateFilterBtn = document.getElementById('remove-date-filter');
        if (removeDateFilterBtn) {
            removeDateFilterBtn.addEventListener('click', () => this.clearDateFilter());
        }

        // Close dropdowns when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('#search-dropdown') && !e.target.closest('#search-btn') && !e.target.closest('#match-search')) {
                this.hideSearchDropdown();
            }
            if (!e.target.closest('#date-picker') && !e.target.closest('#date-filter-btn')) {
                this.hideDatePicker();
            }
        });
    }

    setupTourSelection() {
        // Tour data configuration
        this.tourData = {
            ipl: {
                name: 'IPL 2025',
                description: 'Indian Premier League 2025 - The biggest T20 cricket tournament',
                teamsCount: 10,
                teams: ['Chennai Super Kings', 'Mumbai Indians', 'Royal Challengers Bangalore', 'Kolkata Knight Riders', 'Delhi Capitals', 'Punjab Kings', 'Rajasthan Royals', 'Sunrisers Hyderabad', 'Gujarat Titans', 'Lucknow Super Giants']
            },
            t20: {
                name: 'T20 International',
                description: 'International T20 cricket matches - Fast-paced cricket format',
                teamsCount: 12,
                teams: ['India', 'Australia', 'England', 'Pakistan', 'South Africa', 'West Indies', 'New Zealand', 'Sri Lanka', 'Bangladesh', 'Afghanistan', 'Ireland', 'Netherlands']
            },
            odi: {
                name: 'ODI International',
                description: 'One Day International cricket - 50-over format',
                teamsCount: 12,
                teams: ['India', 'Australia', 'England', 'Pakistan', 'South Africa', 'West Indies', 'New Zealand', 'Sri Lanka', 'Bangladesh', 'Afghanistan', 'Ireland', 'Netherlands']
            },
            test: {
                name: 'Test Match',
                description: 'Test cricket - The traditional 5-day format',
                teamsCount: 12,
                teams: ['India', 'Australia', 'England', 'Pakistan', 'South Africa', 'West Indies', 'New Zealand', 'Sri Lanka', 'Bangladesh', 'Afghanistan', 'Ireland', 'Zimbabwe']
            }
        };

        // Set default tour
        this.selectedTour = 'ipl';
        this.updateTourInfo();

        // Add event listeners to tour pills
        const tourPills = document.querySelectorAll('.tour-pill');
        tourPills.forEach(pill => {
            pill.addEventListener('click', (e) => {
                const tourId = e.target.dataset.tour;
                this.selectTour(tourId);
            });
        });
    }

    selectTour(tourId) {
        // Update active pill
        const tourPills = document.querySelectorAll('.tour-pill');
        tourPills.forEach(pill => {
            pill.classList.remove('active', 'bg-primary', 'text-white');
            pill.classList.add('bg-gray-100', 'text-gray-700');
        });

        const selectedPill = document.querySelector(`[data-tour="${tourId}"]`);
        if (selectedPill) {
            selectedPill.classList.add('active', 'bg-primary', 'text-white');
            selectedPill.classList.remove('bg-gray-100', 'text-gray-700');
        }

        // Update selected tour
        this.selectedTour = tourId;
        this.updateTourInfo();

        // Reload matches for the selected tour
        this.loadMatches();

        // Show success message
        const tourName = this.tourData[tourId]?.name || tourId.toUpperCase();
        this.components.toast.showSuccess(`Switched to ${tourName}`);
    }

    updateTourInfo() {
        const tourInfo = this.tourData[this.selectedTour];
        if (!tourInfo) return;

        const tourDescription = document.getElementById('tour-description');
        const teamsCount = document.getElementById('teams-count');

        if (tourDescription) {
            tourDescription.textContent = tourInfo.description;
        }

        if (teamsCount) {
            teamsCount.textContent = `${tourInfo.teamsCount} Teams`;
        }
    }

    generateDummyMatches() {
        const tourTeams = this.tourData[this.selectedTour]?.teams || [];
        const matches = [];
        const currentDate = new Date();

        // Generate 15 dummy matches for the selected tour
        for (let i = 0; i < 15; i++) {
            const team1Index = i % tourTeams.length;
            const team2Index = (i + 1) % tourTeams.length;
            
            // Create match date (spread over the next 30 days)
            const matchDate = new Date(currentDate);
            matchDate.setDate(currentDate.getDate() + Math.floor(i / 2));

            const match = {
                id: `dummy_${this.selectedTour}_${i + 1}`,
                match_date: matchDate.toISOString(),
                venue: this.getDummyVenue(),
                team1: {
                    name: tourTeams[team1Index],
                    short: this.getTeamShortName(tourTeams[team1Index])
                },
                team2: {
                    name: tourTeams[team2Index],
                    short: this.getTeamShortName(tourTeams[team2Index])
                },
                match_type: this.selectedTour.toUpperCase(),
                status: 'upcoming',
                tour: this.selectedTour
            };

            matches.push(match);
        }

        return matches;
    }

    getDummyVenue() {
        const venues = {
            t20: [
                'Eden Gardens, Kolkata, India',
                'Wankhede Stadium, Mumbai, India',
                'Arun Jaitley Stadium, Delhi, India',
                'M. Chinnaswamy Stadium, Bangalore, India',
                'Rajiv Gandhi Stadium, Hyderabad, India',
                'Punjab Cricket Association Stadium, Mohali, India',
                'Sawai Mansingh Stadium, Jaipur, India',
                'Holkar Stadium, Indore, India',
                'Brabourne Stadium, Mumbai, India',
                'Green Park Stadium, Kanpur, India',
                'JSCA Stadium, Ranchi, India',
                'Barabati Stadium, Cuttack, India',
                'Vidarbha Cricket Association Stadium, Nagpur, India',
                'Dr. Y.S. Rajasekhara Reddy Stadium, Visakhapatnam, India',
                'Maharashtra Cricket Association Stadium, Pune, India'
            ],
            odi: [
                'Lord\'s Cricket Ground, London, England',
                'The Oval, London, England',
                'Old Trafford, Manchester, England',
                'Edgbaston, Birmingham, England',
                'Headingley, Leeds, England',
                'Trent Bridge, Nottingham, England',
                'Rose Bowl, Southampton, England',
                'Riverside Ground, Chester-le-Street, England',
                'Sophia Gardens, Cardiff, Wales',
                'County Ground, Bristol, England',
                'Kennington Oval, London, England',
                'Emirates Old Trafford, Manchester, England'
            ],
            test: [
                'Melbourne Cricket Ground, Melbourne, Australia',
                'Sydney Cricket Ground, Sydney, Australia',
                'Adelaide Oval, Adelaide, Australia',
                'The Gabba, Brisbane, Australia',
                'WACA Ground, Perth, Australia',
                'Bellerive Oval, Hobart, Australia',
                'Manuka Oval, Canberra, Australia',
                'Blundstone Arena, Hobart, Australia',
                'Carrara Oval, Gold Coast, Australia',
                'Traeger Park, Alice Springs, Australia',
                'Cazaly\'s Stadium, Cairns, Australia',
                'Townsville Cricket Ground, Townsville, Australia'
            ]
        };

        // Get venues for the selected tour, fallback to a general list if not found
        const tourVenues = venues[this.selectedTour] || venues.t20;
        return tourVenues[Math.floor(Math.random() * tourVenues.length)];
    }

    getTeamShortName(teamName) {
        const shortNames = {
            'India': 'IND',
            'Australia': 'AUS',
            'England': 'ENG',
            'Pakistan': 'PAK',
            'South Africa': 'SA',
            'West Indies': 'WI',
            'New Zealand': 'NZ',
            'Sri Lanka': 'SL',
            'Bangladesh': 'BAN',
            'Afghanistan': 'AFG',
            'Ireland': 'IRE',
            'Netherlands': 'NED',
            'Zimbabwe': 'ZIM'
        };
        return shortNames[teamName] || teamName.substring(0, 3).toUpperCase();
    }

    async loadMatches() {
        this.showMatchesLoading(true);
        this.showMatchesError(false);
        this.showMatchesGrid(false);
        this.showNoMatches(false);

        try {
            // For non-IPL tours, use dummy matches
            if (this.selectedTour !== 'ipl') {
                this.allMatches = this.generateDummyMatches();
                console.log('Loaded dummy matches for tour:', this.selectedTour, this.allMatches.length);
                this.applyFilters();
                return;
            }

            // For IPL, fetch from API
            const tourParam = this.selectedTour ? `&tour=${this.selectedTour}` : '';
            console.log('Loading matches from:', `${CONSTANTS.API_BASE_URL}/recent-matches?limit=80${tourParam}`);
            const response = await fetch(`${CONSTANTS.API_BASE_URL}/recent-matches?limit=80${tourParam}`);
            console.log('Response status:', response.status);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            console.log('API response:', result);

            if (result.success && result.data) {
                this.allMatches = result.data; // Store all matches
                console.log('Loaded matches:', this.allMatches.length);
                this.applyFilters(); // Apply any active filters
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
        if (!matchesGrid) {
            console.error('Matches grid element not found!');
            return;
        }
    
        // Clear existing content
        matchesGrid.innerHTML = '';
    
        if (this.matches.length === 0) {
            console.log('No matches to display, showing no matches message');
            this.showNoMatches(true);
            return;
        }
    
        // Limit to top 5 matches
        const topMatches = this.matches.slice(0, 5);
        console.log('Creating match cards for:', topMatches.length, 'matches (limited to top 5)');
        
        // Create match cards for top 5 matches only
        const matchCards = MatchCard.createCards(topMatches, (matchData) => {
            this.handleMatchSelection(matchData);
        });
    
        
        // Add cards to grid
        matchCards.forEach(card => {
            matchesGrid.appendChild(card);
        });
    
        this.showMatchesGrid(true);
        console.log('Match grid should now be visible with top 5 matches');
    }

    // Search and Filter Methods
    toggleSearchDropdown() {
        const dropdown = document.getElementById('search-dropdown');
        const searchContainer = document.querySelector('.flex.flex-col.sm\\:flex-row.gap-3.mb-4.relative');
        
        if (dropdown && searchContainer) {
            dropdown.classList.toggle('hidden');
            if (!dropdown.classList.contains('hidden')) {
                this.populateTeamSelects();
                this.hideDatePicker();
                
                // Position dropdown relative to the search container
                const containerRect = searchContainer.getBoundingClientRect();
                
                // Position the dropdown to the right of the search bar, beside the date button
                dropdown.style.position = 'absolute';
                dropdown.style.top = '0';
                dropdown.style.right = '0';
                dropdown.style.zIndex = '50';
            }
        }
    }

    hideSearchDropdown() {
        const dropdown = document.getElementById('search-dropdown');
        if (dropdown) {
            dropdown.classList.add('hidden');
        }
    }

    toggleDatePicker() {
        const picker = document.getElementById('date-picker');
        if (picker) {
            picker.classList.toggle('hidden');
            if (!picker.classList.contains('hidden')) {
                this.hideSearchDropdown();
            }
        }
    }

    hideDatePicker() {
        const picker = document.getElementById('date-picker');
        if (picker) {
            picker.classList.add('hidden');
        }
    }

    populateTeamSelects() {
        const teamASelect = document.getElementById('team-a-select');
        const teamBSelect = document.getElementById('team-b-select');
        
        if (!teamASelect || !teamBSelect) return;

        // Get teams for the selected tour
        const tourTeams = this.tourData[this.selectedTour]?.teams || [];
        
        // If tour teams are available, use them; otherwise fall back to matches
        let teams;
        if (tourTeams.length > 0) {
            teams = tourTeams;
        } else {
            // Get unique team names from all matches
            const teamsSet = new Set();
            this.allMatches.forEach(match => {
                teamsSet.add(match.team1.name);
                teamsSet.add(match.team2.name);
            });
            teams = Array.from(teamsSet);
        }

        const teamOptions = teams.sort().map(teamName => {
            const logo = this.getTeamLogo(teamName);
            return `<option value="${teamName}">${logo.short} - ${teamName}</option>`;
        }).join('');

        teamASelect.innerHTML = '<option value="">Team A</option>' + teamOptions;
        teamBSelect.innerHTML = '<option value="">Team B</option>' + teamOptions;
    }

    applySearchFilter() {
        const teamA = document.getElementById('team-a-select')?.value;
        const teamB = document.getElementById('team-b-select')?.value;

        if (!teamA && !teamB) {
            this.components.toast.showError('Please select at least one team');
            return;
        }

        this.activeFilters.search = { teamA, teamB };
        this.hideSearchDropdown();
        this.applyFilters();
        this.updateActiveFiltersDisplay();
    }

    clearSearchFilter() {
        this.activeFilters.search = null;
        this.hideSearchDropdown();
        this.applyFilters();
        this.updateActiveFiltersDisplay();
        
        // Clear select values
        const teamASelect = document.getElementById('team-a-select');
        const teamBSelect = document.getElementById('team-b-select');
        if (teamASelect) teamASelect.value = '';
        if (teamBSelect) teamBSelect.value = '';
    }

    applyDateFilter() {
        const dateInput = document.getElementById('match-date');
        const selectedDate = dateInput?.value;

        if (!selectedDate) {
            this.components.toast.showError('Please select a date');
            return;
        }

        this.activeFilters.date = selectedDate;
        this.hideDatePicker();
        this.applyFilters();
        this.updateActiveFiltersDisplay();
    }

    clearDateFilter() {
        this.activeFilters.date = null;
        this.hideDatePicker();
        this.applyFilters();
        this.updateActiveFiltersDisplay();
        
        // Clear date input
        const dateInput = document.getElementById('match-date');
        if (dateInput) dateInput.value = '';
    }

    applyFilters() {
        console.log('Applying filters. All matches:', this.allMatches.length);
        console.log('Active filters:', this.activeFilters);
        
        let filteredMatches = [...this.allMatches];

        // Apply search filter
        if (this.activeFilters.search) {
            const { teamA, teamB } = this.activeFilters.search;
            console.log('Applying search filter:', { teamA, teamB });
            filteredMatches = filteredMatches.filter(match => {
                const matchTeam1 = match.team1.name;
                const matchTeam2 = match.team2.name;
                
                if (teamA && teamB) {
                    return (matchTeam1 === teamA && matchTeam2 === teamB) || 
                           (matchTeam1 === teamB && matchTeam2 === teamA);
                } else if (teamA) {
                    return matchTeam1 === teamA || matchTeam2 === teamA;
                } else if (teamB) {
                    return matchTeam1 === teamB || matchTeam2 === teamB;
                }
                return false;
            });
        }

        // Apply date filter
        if (this.activeFilters.date) {
            console.log('Applying date filter:', this.activeFilters.date);
            filteredMatches = filteredMatches.filter(match => {
                const matchDate = new Date(match.match_date).toISOString().split('T')[0];
                return matchDate === this.activeFilters.date;
            });
        }

        this.matches = filteredMatches;
        console.log('Filtered matches:', this.matches.length);
        this.displayMatches();
    }

    updateActiveFiltersDisplay() {
        const activeFiltersContainer = document.getElementById('active-filters');
        const searchFilterTag = document.getElementById('search-filter-tag');
        const dateFilterTag = document.getElementById('date-filter-tag');
        const searchFilterText = document.getElementById('search-filter-text');
        const dateFilterText = document.getElementById('date-filter-text');

        if (!activeFiltersContainer) return;

        let hasActiveFilters = false;

        // Update search filter tag
        if (this.activeFilters.search) {
            const { teamA, teamB } = this.activeFilters.search;
            const teamALogo = teamA ? this.getTeamLogo(teamA).short : '';
            const teamBLogo = teamB ? this.getTeamLogo(teamB).short : '';
            
            if (teamA && teamB) {
                searchFilterText.textContent = `${teamALogo} vs ${teamBLogo}`;
            } else if (teamA) {
                searchFilterText.textContent = `${teamALogo} matches`;
            } else if (teamB) {
                searchFilterText.textContent = `${teamBLogo} matches`;
            }
            
            searchFilterTag.classList.remove('hidden');
            hasActiveFilters = true;
        } else {
            searchFilterTag.classList.add('hidden');
        }

        // Update date filter tag
        if (this.activeFilters.date) {
            const date = new Date(this.activeFilters.date);
            const formattedDate = date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            });
            dateFilterText.textContent = formattedDate;
            dateFilterTag.classList.remove('hidden');
            hasActiveFilters = true;
        } else {
            dateFilterTag.classList.add('hidden');
        }

        // Show/hide active filters container
        activeFiltersContainer.classList.toggle('hidden', !hasActiveFilters);
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
        const validFiles = files.filter(file => {
            const isValidType = ['image/jpeg', 'image/jpg', 'image/png'].includes(file.type);
            const isValidSize = file.size <= 5 * 1024 * 1024; // 5MB
            
            if (!isValidType) {
                this.components.toast.showError(`${file.name}: Invalid file type. Please upload JPG or PNG images only.`);
                return false;
            }
            
            if (!isValidSize) {
                this.components.toast.showError(`${file.name}: File too large. Maximum size is 5MB.`);
                return false;
            }
            
            return true;
        });

        if (validFiles.length === 0) {
            this.components.toast.showError('No valid files selected. Please upload JPG or PNG images under 5MB each.');
            return;
        }

        if (validFiles.length > 10) {
            this.components.toast.showError('Too many files. Please upload a maximum of 10 screenshots.');
            return;
        }
        
        try {
            this.showScreenshotsLoading(true);
            
            const teams = [];
            const errors = [];
            
            for (let i = 0; i < validFiles.length; i++) {
                const file = validFiles[i];
                try {
                    console.log(`Processing file ${i + 1}/${validFiles.length}:`, file.name);
                    
                    const formData = new FormData();
                    formData.append('image', file);

                    const response = await fetch(`${CONSTANTS.API_BASE_URL}/ocr/process`, {
                        method: 'POST',
                        body: formData
                    });

                    console.log(`OCR response for ${file.name}:`, response.status);

                    if (!response.ok) {
                        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                    }

                    const result = await response.json();
                    console.log(`OCR result for ${file.name}:`, result);
                    
                    if (result.success) {
                        teams.push({
                            name: `Team ${i + 1}`,
                            players: result.data.players,
                            captain: result.data.captain || '',
                            viceCaptain: result.data.vice_captain || '',
                            source: 'screenshot',
                            fileName: file.name
                        });
                        console.log(`Successfully processed ${file.name}: ${result.data.players.length} players`);
                    } else {
                        const errorMsg = result.message || 'Failed to extract team data';
                        const suggestion = result.suggestion || 'Please try again with a clear Dream11 screenshot.';
                        errors.push({
                            file: file.name,
                            error: `${errorMsg}. ${suggestion}`
                        });
                        console.error(`Failed to process ${file.name}:`, errorMsg);
                    }
                } catch (error) {
                    console.error(`Error processing ${file.name}:`, error);
                    let errorMessage = 'Processing failed';
                    
                    if (error.message.includes('Failed to fetch')) {
                        errorMessage = 'Unable to connect to server. Check your internet connection.';
                    } else if (error.message.includes('HTTP 400')) {
                        errorMessage = 'Invalid image format. Please upload a clear Dream11 screenshot.';
                    } else if (error.message.includes('HTTP 500')) {
                        errorMessage = 'Server error. Please try again later.';
                    } else if (error.message.includes('OCR API key')) {
                        errorMessage = 'OCR service not configured. Please contact support.';
                    }
                    
                    errors.push({
                        file: file.name,
                        error: errorMessage
                    });
                }
            }

            // Show results
            if (teams.length > 0) {
                this.currentTeams = teams;
                this.analysisMode = 'multiple';
                this.displayTeamsSummary();
                
                // Display mini summary
                await this.displayMiniSummary(teams);
                
                const successMsg = `Successfully processed ${teams.length} team(s)`;
                if (errors.length > 0) {
                    this.components.toast.showWarning(`${successMsg}. ${errors.length} file(s) failed.`);
                } else {
                    this.components.toast.showSuccess(successMsg);
                }
            } else {
                this.components.toast.showError('No teams could be processed. Please check your screenshots and try again.');
            }

            // Log any errors for debugging
            if (errors.length > 0) {
                console.error('Processing errors:', errors);
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
                
                // Display mini summary
                await this.displayMiniSummary(result.data.teams);
                
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
                            Captain: ${team.captain || 'Not selected'}<br>
                            Vice-Captain: ${team.viceCaptain || 'Not selected'}
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

    async displayMiniSummary(teamsData) {
        console.log('Displaying mini summary for teams:', teamsData);
        
        const miniSummarySection = document.getElementById('mini-summary-section');
        if (!miniSummarySection) {
            console.error('Mini summary section not found!');
            return;
        }

        // Show loading state
        miniSummarySection.classList.remove('hidden');
        miniSummarySection.innerHTML = `
            <div class="flex items-center justify-center py-8">
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <span class="ml-3 text-gray-600">Fetching player roles from database...</span>
            </div>
        `;

        try {
            // Generate mini summary data (now async)
            const summaryData = await this.generateMiniSummaryData(teamsData);
            
            // Restore the original HTML structure
            miniSummarySection.innerHTML = `
                <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div class="flex items-center gap-3 mb-6">
                        <div class="w-8 h-8 bg-gradient-to-br from-green-400 to-pink-500 rounded-lg flex items-center justify-center">
                            <span class="text-white text-sm font-bold">📊</span>
                        </div>
                        <h3 class="text-lg font-bold text-gray-900">Upload Insights</h3>
                    </div>

                    <!-- Quick Stats -->
                    <div id="quick-stats" class="grid grid-cols-2 gap-4 mb-6">
                        <!-- Quick stats will be populated here -->
                    </div>

                    <!-- Role Breakdown -->
                    <div id="role-breakdown" class="bg-gray-50 rounded-xl p-4">
                        <h4 class="text-sm font-semibold text-gray-700 mb-3">Role Breakdown</h4>
                        <div id="role-breakdown-content" class="grid grid-cols-2 gap-3">
                            <!-- Role breakdown will be populated here -->
                        </div>
                    </div>
                </div>
            `;
            
            // Display quick stats
            this.displayQuickStats(summaryData);
            
            // Display role breakdown
            this.displayRoleBreakdown(summaryData);
            
            // Scroll to mini summary
            miniSummarySection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } catch (error) {
            console.error('Error generating mini summary:', error);
            miniSummarySection.innerHTML = `
                <div class="bg-red-50 border border-red-200 rounded-xl p-4">
                    <div class="flex items-center gap-2 text-red-700">
                        <span>⚠️</span>
                        <span class="text-sm">Failed to load player roles. Please try again.</span>
                    </div>
                </div>
            `;
        }
    }

    async generateMiniSummaryData(teamsData) {
        const summary = {
            totalTeams: teamsData.length,
            totalPlayers: 0,
            captains: [],
            viceCaptains: [],
            roleBreakdown: {
                batsmen: 0,
                bowlers: 0,
                allRounders: 0,
                wicketKeepers: 0
            },
            teamStats: [],
            teamDistribution: {
                teamA: 0,
                teamB: 0,
                unvalidated: 0
            }
        };

        // Collect all player names and team distribution
        const allPlayerNames = [];
        teamsData.forEach((team, index) => {
            const teamStats = {
                teamNumber: index + 1,
                playerCount: team.players ? team.players.length : 0,
                captain: team.captain || 'Not specified',
                viceCaptain: team.viceCaptain || 'Not specified',
                roles: {
                    batsmen: 0,
                    bowlers: 0,
                    allRounders: 0,
                    wicketKeepers: 0
                },
                validatedPlayers: 0,
                teamAPlayers: 0,
                teamBPlayers: 0
            };

            // Count players and collect names
            if (team.players) {
                console.log('Team players structure:', team.players);
                summary.totalPlayers += team.players.length;
                
                team.players.forEach(player => {
                    // Debug: Log each player to see its structure
                    console.log('Processing player:', player);
                    
                    const playerName = player.name || player.player_name || player.Name || player.PlayerName || 
                                      player.playerName || player.Player || player.player || 
                                      (typeof player === 'string' ? player : null);
                    
                    if (playerName) {
                        allPlayerNames.push(playerName);
                    } else {
                        console.warn('Could not extract player name from:', player);
                    }
                });
            }

            // Count validated players and team distribution
            if (team.validationResults && team.validationResults.length > 0) {
                console.log(`Processing validation results for team ${index + 1}:`, team.validationResults);
                team.validationResults.forEach(validationResult => {
                    if (validationResult.isValid && validationResult.team) {
                        teamStats.validatedPlayers++;
                        
                        // Get current match details for team comparison
                        const currentMatchDetails = this.currentMatchDetails || 
                            JSON.parse(sessionStorage.getItem('currentMatchDetails') || '{}');
                        
                        if (validationResult.team === currentMatchDetails.teamA) {
                            teamStats.teamAPlayers++;
                            summary.teamDistribution.teamA++;
                        } else if (validationResult.team === currentMatchDetails.teamB) {
                            teamStats.teamBPlayers++;
                            summary.teamDistribution.teamB++;
                        }
                    }
                });
                
                // Calculate unvalidated players
                const unvalidatedCount = team.players ? team.players.length - teamStats.validatedPlayers : 0;
                summary.teamDistribution.unvalidated += unvalidatedCount;
            } else {
                // If no validation results, count all as unvalidated
                summary.teamDistribution.unvalidated += team.players ? team.players.length : 0;
            }

            // Track captains and vice captains
            if (team.captain) summary.captains.push(team.captain);
            if (team.viceCaptain) summary.viceCaptains.push(team.viceCaptain);

            summary.teamStats.push(teamStats);
        });

        // Use hardcoded role detection directly (no database API call)
        console.log('Using hardcoded role detection for:', allPlayerNames);
        
        // Count by role using hardcoded detection
        teamsData.forEach((team, index) => {
            if (team.players) {
                team.players.forEach(player => {
                    // Debug: Log the entire player object to see its structure
                    console.log('Player object:', player);
                    
                    // Try multiple possible name fields
                    const playerName = player.name || player.player_name || player.Name || player.PlayerName || 
                                      player.playerName || player.Player || player.player || 
                                      (typeof player === 'string' ? player : 'Unknown Player');
                    
                    const role = this.getPlayerRole(player);
                    console.log(`Player: ${playerName}, Detected Role: ${role}`);
                    summary.roleBreakdown[role]++;
                    summary.teamStats[index].roles[role]++;
                });
            }
        });

        return summary;
    }

    getPlayerRole(player) {
        // Handle case where player might be a string directly
        let name, role;
        if (typeof player === 'string') {
            name = player;
            role = '';
        } else {
            name = player.name || player.player_name || player.Name || player.PlayerName || 
                  player.playerName || player.Player || player.player || '';
            role = player.role || player.player_role || player.Role || player.PlayerRole || '';
        }
        
        // Convert to lowercase for comparison
        const lowerRole = role.toLowerCase();
        const lowerName = name.toLowerCase();
        
        // First check if role is explicitly provided
        if (lowerRole) {
            if (lowerRole.includes('wk') || lowerRole.includes('keeper') || lowerRole.includes('wicket')) {
                return 'wicketKeepers';
            }
            if (lowerRole.includes('bowl') || lowerRole.includes('bowler') || lowerRole.includes('fast') || lowerRole.includes('spin')) {
                return 'bowlers';
            }
            if (lowerRole.includes('all') || lowerRole.includes('rounder') || lowerRole.includes('allrounder')) {
                return 'allRounders';
            }
            if (lowerRole.includes('bat') || lowerRole.includes('batsman') || lowerRole.includes('opener') || lowerRole.includes('middle')) {
                return 'batsmen';
            }
        }
        
        // Comprehensive hardcoded player role mapping
        const playerRoles = {
            // Indian Batsmen
            'virat kohli': 'batsmen', 'kohli': 'batsmen', 'virat': 'batsmen',
            'rohit sharma': 'batsmen', 'sharma': 'batsmen', 'rohit': 'batsmen',
            'kl rahul': 'batsmen', 'rahul': 'batsmen',
            'shubman gill': 'batsmen', 'gill': 'batsmen', 'shubman': 'batsmen',
            'shreyas iyer': 'batsmen', 'iyer': 'batsmen', 'shreyas': 'batsmen',
            'suryakumar yadav': 'batsmen', 'suryakumar': 'batsmen', 'surya': 'batsmen',
            'rishabh pant': 'wicketKeepers', 'pant': 'wicketKeepers', 'rishabh': 'wicketKeepers',
            'ishan kishan': 'wicketKeepers', 'kishan': 'wicketKeepers', 'ishan': 'wicketKeepers',
            'sanju samson': 'wicketKeepers', 'samson': 'wicketKeepers', 'sanju': 'wicketKeepers',
            'ms dhoni': 'wicketKeepers', 'dhoni': 'wicketKeepers', 'mahendra singh dhoni': 'wicketKeepers',
            'dinesh karthik': 'wicketKeepers', 'karthik': 'wicketKeepers', 'dinesh': 'wicketKeepers',
            
            // Indian Bowlers
            'jasprit bumrah': 'bowlers', 'bumrah': 'bowlers', 'jasprit': 'bowlers',
            'mohammed shami': 'bowlers', 'shami': 'bowlers', 'mohammed': 'bowlers',
            'mohammed siraj': 'bowlers', 'siraj': 'bowlers',
            'yuzvendra chahal': 'bowlers', 'chahal': 'bowlers', 'yuzvendra': 'bowlers',
            'kuldeep yadav': 'bowlers', 'kuldeep': 'bowlers', 'yadav': 'bowlers',
            'ravichandran ashwin': 'bowlers', 'ashwin': 'bowlers', 'ravichandran': 'bowlers',
            'ravindra jadeja': 'allRounders', 'jadeja': 'allRounders', 'ravindra': 'allRounders',
            'bhuvneshwar kumar': 'bowlers', 'bhuvneshwar': 'bowlers', 'bhuvi': 'bowlers',
            'axar patel': 'allRounders', 'axar': 'allRounders', 'patel': 'allRounders',
            'shardul thakur': 'allRounders', 'shardul': 'allRounders', 'thakur': 'allRounders',
            'tushar deshpande': 'bowlers', 'deshpande': 'bowlers', 'tushar': 'bowlers',
            'navdeep saini': 'bowlers', 'saini': 'bowlers', 'navdeep': 'bowlers',
            'prasidh krishna': 'bowlers', 'prasidh': 'bowlers', 'krishna': 'bowlers',
            'arshdeep singh': 'bowlers', 'arshdeep': 'bowlers', 'singh': 'bowlers',
            'harshal patel': 'bowlers', 'harshal': 'bowlers',
            
            // Indian All-Rounders
            'hardik pandya': 'allRounders', 'hardik': 'allRounders', 'pandya': 'allRounders',
            'krunal pandya': 'allRounders', 'krunal': 'allRounders',
            'venkatesh iyer': 'allRounders', 'venkatesh': 'allRounders',
            'shivam dube': 'allRounders', 'shivam': 'allRounders', 'dube': 'allRounders',
            
            // International Batsmen
            'jos buttler': 'wicketKeepers', 'buttler': 'wicketKeepers', 'jos': 'wicketKeepers',
            'jonny bairstow': 'wicketKeepers', 'bairstow': 'wicketKeepers', 'jonny': 'wicketKeepers',
            'alex carey': 'wicketKeepers', 'carey': 'wicketKeepers', 'alex': 'wicketKeepers',
            'matthew wade': 'wicketKeepers', 'wade': 'wicketKeepers', 'matthew': 'wicketKeepers',
            'quinton de kock': 'wicketKeepers', 'de kock': 'wicketKeepers', 'quinton': 'wicketKeepers',
            'kyle verreynne': 'wicketKeepers', 'verreynne': 'wicketKeepers', 'kyle': 'wicketKeepers',
            'tom nicholls': 'wicketKeepers', 'nicholls': 'wicketKeepers', 'tom': 'wicketKeepers',
            'tom latham': 'wicketKeepers', 'latham': 'wicketKeepers',
            'shai hope': 'wicketKeepers', 'hope': 'wicketKeepers', 'shai': 'wicketKeepers',
            'nicholas pooran': 'wicketKeepers', 'pooran': 'wicketKeepers', 'nicholas': 'wicketKeepers',
            'andre fletcher': 'wicketKeepers', 'fletcher': 'wicketKeepers', 'andre': 'wicketKeepers',
            'dhananjaya da silva': 'wicketKeepers', 'da silva': 'wicketKeepers', 'dhananjaya': 'wicketKeepers',
            'niroshan dickwella': 'wicketKeepers', 'dickwella': 'wicketKeepers', 'niroshan': 'wicketKeepers',
            'kusal mendis': 'wicketKeepers', 'mendis': 'wicketKeepers', 'kusal': 'wicketKeepers',
            'mushfiqur rahman': 'wicketKeepers', 'rahman': 'wicketKeepers', 'mushfiqur': 'wicketKeepers',
            
            // International Bowlers
            'trent boult': 'bowlers', 'boult': 'bowlers', 'trent': 'bowlers',
            'mitchell starc': 'bowlers', 'starc': 'bowlers', 'mitchell': 'bowlers',
            'josh hazlewood': 'bowlers', 'hazlewood': 'bowlers', 'josh': 'bowlers',
            'pat cummins': 'bowlers', 'cummins': 'bowlers', 'pat': 'bowlers',
            'kagiso rabada': 'bowlers', 'rabada': 'bowlers', 'kagiso': 'bowlers',
            'lungi ngidi': 'bowlers', 'ngidi': 'bowlers', 'lungi': 'bowlers',
            'anrich nortje': 'bowlers', 'nortje': 'bowlers', 'anrich': 'bowlers',
            'jofra archer': 'bowlers', 'archer': 'bowlers', 'jofra': 'bowlers',
            'mark wood': 'bowlers', 'wood': 'bowlers', 'mark': 'bowlers',
            'james anderson': 'bowlers', 'anderson': 'bowlers', 'james': 'bowlers',
            'stuart broad': 'bowlers', 'broad': 'bowlers', 'stuart': 'bowlers',
            'chris woakes': 'bowlers', 'woakes': 'bowlers', 'chris': 'bowlers',
            'sam curran': 'allRounders', 'curran': 'allRounders', 'sam': 'allRounders',
            'ben stokes': 'allRounders', 'stokes': 'allRounders', 'ben': 'allRounders',
            'jason holder': 'allRounders', 'holder': 'allRounders', 'jason': 'allRounders',
            'kemar roach': 'bowlers', 'roach': 'bowlers', 'kemar': 'bowlers',
            'shannon gabriel': 'bowlers', 'gabriel': 'bowlers', 'shannon': 'bowlers',
            'sheldon cotterell': 'bowlers', 'cotterell': 'bowlers', 'sheldon': 'bowlers',
            'dwayne bravo': 'allRounders', 'bravo': 'allRounders', 'dwayne': 'allRounders',
            'kieron pollard': 'allRounders', 'pollard': 'allRounders', 'kieron': 'allRounders',
            'andre russell': 'allRounders', 'russell': 'allRounders', 'andre': 'allRounders',
            'sunil narine': 'allRounders', 'narine': 'allRounders', 'sunil': 'allRounders',
            'glenn maxwell': 'allRounders', 'maxwell': 'allRounders', 'glenn': 'allRounders',
            'mitchell marsh': 'allRounders', 'marsh': 'allRounders',
            'cameron green': 'allRounders', 'green': 'allRounders', 'cameron': 'allRounders',
            'liam livingstone': 'allRounders', 'livingstone': 'allRounders', 'liam': 'allRounders',
            'moeen ali': 'allRounders', 'ali': 'allRounders', 'moeen': 'allRounders',
            
            // Additional common players
            'rahul dravid': 'batsmen', 'dravid': 'batsmen', 'rahul dravid': 'batsmen',
            'sachin tendulkar': 'batsmen', 'tendulkar': 'batsmen', 'sachin': 'batsmen',
            'virender sehwag': 'batsmen', 'sehwag': 'batsmen', 'virender': 'batsmen',
            'gautam gambhir': 'batsmen', 'gambhir': 'batsmen', 'gautam': 'batsmen',
            'yuvraj singh': 'allRounders', 'yuvraj': 'allRounders',
            'zaheer khan': 'bowlers', 'zaheer': 'bowlers', 'khan': 'bowlers',
            'harbhajan singh': 'bowlers', 'harbhajan': 'bowlers',
            'anil kumble': 'bowlers', 'kumble': 'bowlers', 'anil': 'bowlers',
            'kapil dev': 'allRounders', 'kapil': 'allRounders', 'dev': 'allRounders',
            'sunil gavaskar': 'batsmen', 'gavaskar': 'batsmen', 'sunil gavaskar': 'batsmen',
            'dilip vengsarkar': 'batsmen', 'vengsarkar': 'batsmen', 'dilip': 'batsmen',
            'gundappa viswanath': 'batsmen', 'viswanath': 'batsmen', 'gundappa': 'batsmen',
            'ravishastri': 'allRounders', 'ravishastri': 'allRounders',
            'manoj prabhakar': 'allRounders', 'prabhakar': 'allRounders', 'manoj': 'allRounders',
            'robin singh': 'allRounders', 'robin': 'allRounders',
            'ajay jadeja': 'allRounders', 'ajay': 'allRounders',
            'nayan mongia': 'wicketKeepers', 'mongia': 'wicketKeepers', 'nayan': 'wicketKeepers',
            'kiran more': 'wicketKeepers', 'more': 'wicketKeepers', 'kiran': 'wicketKeepers',
            'syed kirmani': 'wicketKeepers', 'kirmani': 'wicketKeepers', 'syed': 'wicketKeepers',
            'farokh engineer': 'wicketKeepers', 'engineer': 'wicketKeepers', 'farokh': 'wicketKeepers',
            'budhi kunderan': 'wicketKeepers', 'kunderan': 'wicketKeepers', 'budhi': 'wicketKeepers',
            'dilawar hussain': 'wicketKeepers', 'hussain': 'wicketKeepers', 'dilawar': 'wicketKeepers',
            'janardan navle': 'wicketKeepers', 'navle': 'wicketKeepers', 'janardan': 'wicketKeepers',
            'k s limaye': 'wicketKeepers', 'limaye': 'wicketKeepers',
            'k s ranjitsinhji': 'batsmen', 'ranjitsinhji': 'batsmen',
            'k s duleepsinhji': 'batsmen', 'duleepsinhji': 'batsmen',
            'k s ghavri': 'allRounders', 'ghavri': 'allRounders',
            'k s more': 'wicketKeepers',
            'k s prasad': 'wicketKeepers', 'prasad': 'wicketKeepers',
            'k s karthik': 'wicketKeepers',
            'k s parthiv': 'wicketKeepers', 'parthiv': 'wicketKeepers',
            'k s saha': 'wicketKeepers', 'saha': 'wicketKeepers',
            'k s bharat': 'wicketKeepers', 'bharat': 'wicketKeepers',
            'k s jurel': 'wicketKeepers', 'jurel': 'wicketKeepers',
            'k s upendra': 'wicketKeepers', 'upendra': 'wicketKeepers',
            'k s jagadeesan': 'wicketKeepers', 'jagadeesan': 'wicketKeepers',
            'k s bharat': 'wicketKeepers',
            'k s jurel': 'wicketKeepers',
            'k s upendra': 'wicketKeepers',
            'k s jagadeesan': 'wicketKeepers'
        };
        
        // Check hardcoded roles first
        if (playerRoles[lowerName]) {
            console.log(`Hardcoded role found for ${name}: ${playerRoles[lowerName]}`);
            return playerRoles[lowerName];
        }
        
        // Check for partial matches in hardcoded names
        for (const [playerName, playerRole] of Object.entries(playerRoles)) {
            if (lowerName.includes(playerName) || playerName.includes(lowerName)) {
                console.log(`Partial match found for ${name}: ${playerName} → ${playerRole}`);
                return playerRole;
            }
        }
        
        // For unknown players, use a more intelligent distribution based on name patterns
        const nameHash = this.hashString(name);
        
        // Look for common patterns in names that might indicate roles
        if (lowerName.includes('kumar') || lowerName.includes('singh') || lowerName.includes('patel')) {
            // Common Indian bowler surnames
            console.log(`Surname pattern match for ${name}: bowlers`);
            return 'bowlers';
        } else if (lowerName.includes('sharma') || lowerName.includes('kohli') || lowerName.includes('rohit')) {
            // Common Indian batsman surnames
            console.log(`Surname pattern match for ${name}: batsmen`);
            return 'batsmen';
        } else if (lowerName.includes('dhoni') || lowerName.includes('pant') || lowerName.includes('kishan')) {
            // Common wicket-keeper names
            console.log(`Surname pattern match for ${name}: wicketKeepers`);
            return 'wicketKeepers';
        }
        
        // Final fallback: Use hash-based distribution but with better ratios
        // Realistic distribution: 35% batsmen, 35% bowlers, 20% all-rounders, 10% wicket-keepers
        const roleDistribution = [
            'batsmen', 'batsmen', 'batsmen', 'batsmen', 'batsmen', 'batsmen', 'batsmen', // 35%
            'bowlers', 'bowlers', 'bowlers', 'bowlers', 'bowlers', 'bowlers', 'bowlers', // 35%
            'allRounders', 'allRounders', 'allRounders', 'allRounders', // 20%
            'wicketKeepers', 'wicketKeepers' // 10%
        ];
        const finalRole = roleDistribution[nameHash % roleDistribution.length];
        console.log(`No specific match found for ${name}, using hash-based distribution: ${finalRole}`);
        return finalRole;
    }

    hashString(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash);
    }

    mapDatabaseRoleToCategory(dbRole) {
        if (!dbRole || dbRole === 'unknown') {
            return 'batsmen'; // Default fallback
        }
        
        const lowerRole = dbRole.toLowerCase();
        
        // Wicket-keeper variations
        if (lowerRole.includes('wk') || lowerRole.includes('keeper') || lowerRole.includes('wicket') || 
            lowerRole.includes('wk-batsman') || lowerRole.includes('wicket-keeper')) {
            return 'wicketKeepers';
        }
        
        // Bowler variations
        if (lowerRole.includes('bowl') || lowerRole.includes('bowler') || lowerRole.includes('fast') || 
            lowerRole.includes('spin') || lowerRole.includes('seam') || lowerRole.includes('pace') ||
            lowerRole.includes('fast-bowler') || lowerRole.includes('spin-bowler')) {
            return 'bowlers';
        }
        
        // All-rounder variations
        if (lowerRole.includes('all') || lowerRole.includes('rounder') || lowerRole.includes('allrounder') ||
            lowerRole.includes('all-rounder') || lowerRole.includes('allrounder-batsman') ||
            lowerRole.includes('allrounder-bowler')) {
            return 'allRounders';
        }
        
        // Batsman variations
        if (lowerRole.includes('bat') || lowerRole.includes('batsman') || lowerRole.includes('opener') || 
            lowerRole.includes('middle') || lowerRole.includes('top-order') || lowerRole.includes('middle-order')) {
            return 'batsmen';
        }
        
        // If role is just "batsman" (without any other indicators)
        if (lowerRole === 'batsman') {
            return 'batsmen';
        }
        
        return 'batsmen'; // Default fallback
    }

    fallbackToNameBasedRoles(teamsData, summary) {
        console.log('Using fallback name-based role detection');
        teamsData.forEach((team, index) => {
            if (team.players) {
                team.players.forEach(player => {
                    const playerName = player.name || player.player_name;
                    const role = this.getPlayerRole(player);
                    console.log(`Fallback - Player: ${playerName}, Detected Role: ${role}`);
                    summary.roleBreakdown[role]++;
                    summary.teamStats[index].roles[role]++;
                });
            }
        });
    }



    displayQuickStats(summaryData) {
        const quickStatsSection = document.getElementById('quick-stats');
        if (!quickStatsSection) return;

        // Get current match details for team names
        const currentMatchDetails = this.currentMatchDetails || 
            JSON.parse(sessionStorage.getItem('currentMatchDetails') || '{}');
        
        const teamAShort = currentMatchDetails.teamA ? this.getTeamShortName(currentMatchDetails.teamA) : 'Team A';
        const teamBShort = currentMatchDetails.teamB ? this.getTeamShortName(currentMatchDetails.teamB) : 'Team B';

        quickStatsSection.innerHTML = `
            <div class="grid grid-cols-2 gap-3">
                <div class="bg-blue-50 p-3 rounded-lg border border-blue-200">
                    <div class="text-xs font-medium text-blue-700">Total Teams</div>
                    <div class="text-lg font-bold text-blue-900">${summaryData.totalTeams}</div>
                </div>
                <div class="bg-green-50 p-3 rounded-lg border border-green-200">
                    <div class="text-xs font-medium text-green-700">Total Players</div>
                    <div class="text-lg font-bold text-green-900">${summaryData.totalPlayers}</div>
                </div>
                <div class="bg-purple-50 p-3 rounded-lg border border-purple-200">
                    <div class="text-xs font-medium text-purple-700">${teamAShort} Players</div>
                    <div class="text-lg font-bold text-purple-900">${summaryData.teamDistribution.teamA}</div>
                </div>
                <div class="bg-orange-50 p-3 rounded-lg border border-orange-200">
                    <div class="text-xs font-medium text-orange-700">${teamBShort} Players</div>
                    <div class="text-lg font-bold text-orange-900">${summaryData.teamDistribution.teamB}</div>
                </div>
                <div class="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                    <div class="text-xs font-medium text-yellow-700">Need Validation</div>
                    <div class="text-lg font-bold text-yellow-900">${summaryData.teamDistribution.unvalidated}</div>
                </div>
                <div class="bg-red-50 p-3 rounded-lg border border-red-200">
                    <div class="text-xs font-medium text-red-700">Captains Set</div>
                    <div class="text-lg font-bold text-red-900">${summaryData.captains.filter(c => c !== 'Not specified').length}</div>
                </div>
            </div>
        `;
    }

    displayRoleBreakdown(summaryData) {
        const roleBreakdown = document.getElementById('role-breakdown-content');
        if (!roleBreakdown) return;

        const roles = [
            { key: 'batsmen', label: 'Batsmen', color: 'blue', icon: '🏏' },
            { key: 'bowlers', label: 'Bowlers', color: 'green', icon: '🎯' },
            { key: 'allRounders', label: 'All-Rounders', color: 'purple', icon: '⚡' },
            { key: 'wicketKeepers', label: 'Wicket-Keepers', color: 'orange', icon: '🧤' }
        ];

        roleBreakdown.innerHTML = roles.map(role => `
            <div class="bg-white border border-gray-200 rounded-xl p-4 text-center shadow-sm hover:shadow-md transition-shadow duration-200">
                <div class="text-3xl mb-3">${role.icon}</div>
                <div class="text-xl font-bold text-gray-900 mb-2">${summaryData.roleBreakdown[role.key]}</div>
                <div class="text-sm text-gray-600 font-medium">${role.label}</div>
            </div>
        `).join('');
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

    // Navigate to team summary page
    navigateToTeamSummary() {
        console.log('Navigating to team summary page...');
        window.location.href = 'team-summary.html';
    }

    // Test function to verify toast functionality
    testToast() {
        console.log('Testing toast functionality...');
        this.components.toast.showSuccess('✅ Toast test successful! This is a success message.');
        setTimeout(() => {
            this.components.toast.showError('❌ Toast test successful! This is an error message.');
        }, 2000);
    }

    // Make test function available globally for debugging
    static makeTestAvailable() {
        // Make the app instance available globally for testing
        window.enhancedApp = this;
        console.log('Enhanced app instance made available globally as window.enhancedApp');
        console.log('Toast test function available. Run testToast() in console to test.');
    }

    // Add this function to update summary in real-time
    async updateSummaryInRealTime() {
        try {
            console.log('Updating summary in real-time...');
            
            // Get current teams data from session storage
            const teamsData = JSON.parse(sessionStorage.getItem('currentTeams') || '[]');
            
            if (teamsData.length > 0) {
                // Generate updated summary data
                const updatedSummaryData = await this.generateMiniSummaryData(teamsData);
                
                // Update the display
                this.displayQuickStats(updatedSummaryData);
                this.displayRoleBreakdown(updatedSummaryData);
                
                console.log('Summary updated in real-time:', updatedSummaryData);
            }
        } catch (error) {
            console.error('Error updating summary in real-time:', error);
        }
    }

    // Add this function to refresh summary when validation completes
    async refreshSummaryAfterValidation() {
        console.log('Refreshing summary after validation...');
        
        // Wait a bit for validation to complete
        setTimeout(async () => {
            await this.updateSummaryInRealTime();
        }, 500);
    }

    // Test function for manual summary update
    async testSummaryUpdate() {
        console.log('Testing summary update...');
        await this.updateSummaryInRealTime();
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.enhancedApp = new EnhancedCricketAnalyzerApp();
}); 