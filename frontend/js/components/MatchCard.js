// MatchCard Component - Reusable component for displaying match information
class MatchCard {
    constructor(matchData, onSelectCallback = null) {
        this.matchData = matchData;
        this.onSelectCallback = onSelectCallback;
        this.element = null;
    }

    create() {
        const card = document.createElement('div');
        card.className = 'bg-white rounded-lg shadow-cricket border border-gray-200 p-4 cursor-pointer hover:shadow-lg transition-all duration-300 transform hover:scale-105 card-hover animate-fade-in';
        card.dataset.matchId = this.matchData.match_id;
        
        // Format match date
        const matchDate = new Date(this.matchData.match_date);
        const formattedDate = matchDate.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });

        // Determine if match is upcoming or completed
        const isUpcoming = this.matchData.is_upcoming;
        const statusClass = isUpcoming ? 'text-blue-600' : 'text-gray-600';
        const statusText = isUpcoming ? 'Upcoming' : 'Completed';

        // Get team logo data
        const team1Logo = this.getTeamLogo(this.matchData.team1.name);
        const team2Logo = this.getTeamLogo(this.matchData.team2.name);

        card.innerHTML = `
            <div class="flex items-center justify-between mb-3">
                <div class="flex items-center space-x-2">
                    <span class="text-xs font-semibold ${statusClass}">${statusText}</span>
                    ${isUpcoming ? '<span class="text-xs text-blue-500">📅</span>' : ''}
                </div>
                <div class="text-xs text-gray-500">${formattedDate}</div>
            </div>
            
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
                    <div class="text-center">
                        <div class="text-xs font-semibold text-gray-900">${team1Logo.short}</div>
                        <div class="text-xs text-gray-600 max-w-16 truncate">${this.matchData.team1.name}</div>
                    </div>
                </div>
                
                <!-- VS -->
                <div class="bg-primary text-white px-3 py-1 rounded-full text-xs font-bold shadow-sm">
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
                    <div class="text-center">
                        <div class="text-xs font-semibold text-gray-900">${team2Logo.short}</div>
                        <div class="text-xs text-gray-600 max-w-16 truncate">${this.matchData.team2.name}</div>
                    </div>
                </div>
            </div>
            
            <div class="text-center space-y-1">
                <div class="text-xs text-gray-700">📍 ${this.matchData.venue.name}</div>
                <div class="text-xs text-gray-500">${this.matchData.venue.city}</div>
            </div>
            
            
        `;

        // Add click event listener
        card.addEventListener('click', () => {
            this.handleCardClick();
        });

        this.element = card;
        return card;
    }

    getTeamLogo(teamName) {
        // Team logo and external URL mapping (same as team-analysis-tabbed.js)
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

    handleCardClick() {
        if (this.onSelectCallback) {
            this.onSelectCallback(this.matchData);
        }
    }

    // Static method to create multiple cards
    static createCards(matches, onSelectCallback) {
        return matches.map(match => {
            const card = new MatchCard(match, onSelectCallback);
            return card.create();
        });
    }

    // Method to update card state (e.g., selected state)
    setSelected(selected) {
        if (this.element) {
            if (selected) {
                this.element.classList.add('ring-2', 'ring-primary', 'ring-opacity-50');
                this.element.classList.remove('hover:scale-105');
            } else {
                this.element.classList.remove('ring-2', 'ring-primary', 'ring-opacity-50');
                this.element.classList.add('hover:scale-105');
            }
        }
    }

    // Method to disable card
    setDisabled(disabled) {
        if (this.element) {
            if (disabled) {
                this.element.classList.add('opacity-50', 'cursor-not-allowed');
                this.element.classList.remove('cursor-pointer', 'hover:shadow-lg', 'hover:scale-105');
            } else {
                this.element.classList.remove('opacity-50', 'cursor-not-allowed');
                this.element.classList.add('cursor-pointer', 'hover:shadow-lg', 'hover:scale-105');
            }
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MatchCard;
} else {
    window.MatchCard = MatchCard;
} 