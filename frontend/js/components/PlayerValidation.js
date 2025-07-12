// Player Validation Component
class PlayerValidation {
    constructor(apiBaseUrl) {
        this.apiBaseUrl = apiBaseUrl;
        this.playerValidationResults = null;
        this.availablePlayers = [];
        this.currentPlayerIndex = null;
        this.onValidationCompleteCallback = null;
        this.onPlayerReplaceCallback = null;
    }

    async validatePlayers(players, teamA, teamB) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/validate-players`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ players, teamA, teamB })
            });

            const result = await response.json();

            if (result.success) {
                this.playerValidationResults = result;
                this.availablePlayers = result.availablePlayers || [];
                
                if (this.onValidationCompleteCallback) {
                    this.onValidationCompleteCallback(result);
                }
                
                return result;
            } else {
                throw new Error(result.message || 'Failed to validate players');
            }
        } catch (error) {
            console.error('Player validation error:', error);
            throw error;
        }
    }

    replacePlayer(playerIndex, newName, playerId, role, team) {
        if (!this.playerValidationResults) return;
        
        this.playerValidationResults.validationResults[playerIndex] = {
            inputName: this.playerValidationResults.validationResults[playerIndex].inputName,
            validatedName: newName,
            playerId: playerId,
            role: role,
            team: team,
            isValid: true,
            confidence: 1.0
        };
        
        if (this.onPlayerReplaceCallback) {
            this.onPlayerReplaceCallback(playerIndex, newName);
        }
    }

    getValidationResults() {
        return this.playerValidationResults;
    }

    getAvailablePlayers() {
        return this.availablePlayers;
    }

    getValidPlayers() {
        if (!this.playerValidationResults) return [];
        return this.playerValidationResults.validationResults.filter(p => p.isValid);
    }

    getInvalidPlayers() {
        if (!this.playerValidationResults) return [];
        return this.playerValidationResults.validationResults.filter(p => !p.isValid && !p.isMissing);
    }

    getMissingPlayers() {
        if (!this.playerValidationResults) return [];
        return this.playerValidationResults.validationResults.filter(p => p.isMissing);
    }

    onValidationComplete(callback) {
        this.onValidationCompleteCallback = callback;
    }

    onPlayerReplace(callback) {
        this.onPlayerReplaceCallback = callback;
    }

    // Player Selection Modal Methods
    showPlayerSelectionModal(playerIndex, originalName) {
        this.currentPlayerIndex = playerIndex;
        
        // This will be handled by the UI component
        if (window.showPlayerSelectionModal) {
            window.showPlayerSelectionModal(playerIndex, originalName);
        }
    }

    selectPlayerFromModal(player) {
        if (!this.playerValidationResults || this.currentPlayerIndex === null) return;
        
        this.playerValidationResults.validationResults[this.currentPlayerIndex] = {
            inputName: this.playerValidationResults.validationResults[this.currentPlayerIndex].inputName,
            validatedName: player.player_name,
            playerId: player.player_id,
            role: player.role,
            team: player.team_name,
            isValid: true,
            confidence: 1.0
        };
        
        if (this.onPlayerReplaceCallback) {
            this.onPlayerReplaceCallback(this.currentPlayerIndex, player.player_name);
        }
        
        this.currentPlayerIndex = null;
    }

    // Utility methods for UI components
    createPlayerCard(playerData, index) {
        const { player, validation } = playerData;
        
        if (validation.isValid) {
            const isAutoReplaced = validation.autoReplaced;
            const bgColor = isAutoReplaced ? 'bg-blue-50 border-blue-200' : 'bg-success/10 border-success/20';
            const textColor = isAutoReplaced ? 'text-blue-600' : 'text-success';
            
            return `
                <div class="flex items-center justify-between p-3 ${bgColor} border rounded-lg">
                    <div>
                        <span class="font-medium text-gray-900">${validation.validatedName}</span>
                        <div class="text-xs text-gray-500">${validation.role} • ${validation.team}</div>
                    </div>
                    <div class="text-xs ${textColor} font-medium">${isAutoReplaced ? 'Auto-corrected' : 'Valid'}</div>
                </div>
            `;
        } else if (validation.isMissing) {
            return `
                <div class="p-3 bg-gray-100 border border-gray-300 rounded-lg border-dashed">
                    <div class="flex items-center justify-between">
                        <div>
                            <span class="font-medium text-gray-600">${validation.inputName}</span>
                            <div class="text-xs text-gray-500">Missing</div>
                        </div>
                        <button class="text-xs bg-primary text-white px-2 py-1 rounded hover:bg-primary/80 transition-colors player-select-btn"
                                data-action="showPlayerSelectionModal" data-player-index="${index}" data-player-name="${validation.inputName}">
                            Add
                        </button>
                    </div>
                </div>
            `;
        } else {
            const hasSuggestions = validation.suggestions && validation.suggestions.length > 0;
            const suggestionsHtml = hasSuggestions ? `
                <div class="mt-2">
                    <div class="text-xs text-gray-600 mb-1">Suggestions:</div>
                    <div class="space-y-1 max-h-24 overflow-y-auto">
                        ${validation.suggestions.map(suggestion => `
                            <button class="block w-full text-left p-2 bg-white border border-gray-200 rounded text-xs hover:bg-gray-50 transition-colors player-suggestion-btn"
                                    data-action="replacePlayer"
                                    data-player-index="${index}"
                                    data-player-name="${suggestion.playerName}"
                                    data-player-id="${suggestion.playerId}"
                                    data-player-role="${suggestion.role}"
                                    data-player-team="${suggestion.team}">
                                <div class="flex items-center justify-between">
                                    <div>
                                        <span class="font-medium text-gray-900">${suggestion.playerName}</span>
                                        <div class="text-gray-500">${suggestion.role} • ${suggestion.team}</div>
                                    </div>
                                    <span class="text-warning font-bold">${Math.round(suggestion.similarity * 100)}%</span>
                                </div>
                            </button>
                        `).join('')}
                    </div>
                </div>
            ` : '';
            
            return `
                <div class="p-3 bg-warning/10 border border-warning/20 rounded-lg">
                    <div class="flex items-center justify-between">
                        <div>
                            <span class="font-medium text-gray-900">${validation.inputName}</span>
                            <div class="text-xs text-gray-500">Not found</div>
                        </div>
                        <button class="text-xs bg-secondary text-white px-2 py-1 rounded hover:bg-secondary/80 transition-colors player-select-btn"
                                data-action="showPlayerSelectionModal" data-player-index="${index}" data-player-name="${validation.inputName}">
                            Select
                        </button>
                    </div>
                    ${suggestionsHtml}
                </div>
            `;
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PlayerValidation;
} else {
    window.PlayerValidation = PlayerValidation;
} 