// Configuration
const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
const API_BASE_URL = isProduction 
    ? `${window.location.origin}/api`  // Use same domain for production
    : 'http://localhost:3001/api';     // Use localhost for development

// DOM Elements
let csvInput, csvUploadBtn, downloadTemplateBtn;
let screenshotsInput, screenshotsUploadBtn;
let uploadProgress, uploadStatus, uploadCount, uploadBar;
let teamsSummary, summaryContent;
let comparisonResults, twoTeamsComparison, multipleTeamsComparison;
let loadingState, errorState, errorMessage;
let backBtn, helpBtn;

// Global state
let currentTeams = [];

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    initializeElements();
    initializeEventListeners();
    createCSVTemplate();
});

function initializeElements() {
    // Upload elements
    csvInput = document.getElementById('csv-input');
    csvUploadBtn = document.getElementById('csv-upload-btn');
    downloadTemplateBtn = document.getElementById('download-template');
    
    screenshotsInput = document.getElementById('screenshots-input');
    screenshotsUploadBtn = document.getElementById('screenshots-upload-btn');
    
    // Progress elements
    uploadProgress = document.getElementById('upload-progress');
    uploadStatus = document.getElementById('upload-status');
    uploadCount = document.getElementById('upload-count');
    uploadBar = document.getElementById('upload-bar');
    
    // Results elements
    teamsSummary = document.getElementById('teams-summary');
    summaryContent = document.getElementById('summary-content');
    comparisonResults = document.getElementById('comparison-results');
    twoTeamsComparison = document.getElementById('two-teams-comparison');
    multipleTeamsComparison = document.getElementById('multiple-teams-comparison');
    
    // State elements
    loadingState = document.getElementById('loading-state');
    errorState = document.getElementById('error-state');
    errorMessage = document.getElementById('error-message');
    
    // Navigation elements
    backBtn = document.getElementById('back-btn');
    helpBtn = document.getElementById('help-btn');
}

function initializeEventListeners() {
    // CSV upload
    csvUploadBtn.addEventListener('click', () => csvInput.click());
    csvInput.addEventListener('change', handleCSVUpload);
    downloadTemplateBtn.addEventListener('click', downloadCSVTemplate);
    
    // Screenshots upload
    screenshotsUploadBtn.addEventListener('click', () => screenshotsInput.click());
    screenshotsInput.addEventListener('change', handleScreenshotsUpload);
    
    // Navigation
    backBtn.addEventListener('click', () => window.history.back());
    helpBtn.addEventListener('click', showHelp);
}

function createCSVTemplate() {
    const template = `Team Name,Players,Captain,Vice Captain
Team 1,"Virat Kohli, Rohit Sharma, MS Dhoni, Jasprit Bumrah, Ravindra Jadeja, Hardik Pandya, KL Rahul, Yuzvendra Chahal, Bhuvneshwar Kumar, Shreyas Iyer, Rishabh Pant",Virat Kohli,Rohit Sharma
Team 2,"Virat Kohli, Rohit Sharma, MS Dhoni, Jasprit Bumrah, Ravindra Jadeja, Hardik Pandya, KL Rahul, Yuzvendra Chahal, Bhuvneshwar Kumar, Shreyas Iyer, Rishabh Pant",Virat Kohli,Rohit Sharma`;
    
    // Store template for download
    window.csvTemplate = template;
}

function downloadCSVTemplate() {
    const blob = new Blob([window.csvTemplate], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'team-comparison-template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}

async function handleCSVUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    if (!validateCSVFile(file)) {
        showError('Please select a valid CSV file');
        return;
    }
    
    try {
        showUploadProgress(true);
        uploadStatus.textContent = 'Reading CSV file...';
        
        const text = await file.text();
        const teams = parseCSVTeams(text);
        
        if (teams.length < 2) {
            showError('At least 2 teams are required for comparison');
            return;
        }
        
        currentTeams = teams;
        displayTeamsSummary(teams);
        await compareTeams();
        
    } catch (error) {
        console.error('CSV upload error:', error);
        showError('Failed to process CSV file. Please check the format.');
    } finally {
        showUploadProgress(false);
        csvInput.value = '';
    }
}

function validateCSVFile(file) {
    return file.type === 'text/csv' || file.name.endsWith('.csv');
}

function parseCSVTeams(csvText) {
    const lines = csvText.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    
    const teams = [];
    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        const team = {};
        
        headers.forEach((header, index) => {
            team[header.toLowerCase().replace(/\s+/g, '')] = values[index] || '';
        });
        
        // Parse players string into array
        if (team.players) {
            team.players = team.players.split(',').map(p => p.trim()).filter(p => p);
        }
        
        teams.push(team);
    }
    
    return teams;
}

async function handleScreenshotsUpload(e) {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    
    if (!validateScreenshots(files)) {
        showError('Please select valid image files (JPG, PNG)');
        return;
    }
    
    if (files.length < 2) {
        showError('At least 2 team screenshots are required for comparison');
        return;
    }
    
    try {
        showUploadProgress(true);
        uploadStatus.textContent = 'Processing screenshots...';
        uploadCount.textContent = `0/${files.length}`;
        
        const teams = [];
        let processedCount = 0;
        
        for (const file of files) {
            uploadStatus.textContent = `Processing ${file.name}...`;
            uploadCount.textContent = `${processedCount + 1}/${files.length}`;
            uploadBar.style.width = `${((processedCount + 1) / files.length) * 100}%`;
            
            const teamData = await processScreenshot(file);
            if (teamData.success) {
                teams.push(teamData.data);
            }
            
            processedCount++;
        }
        
        if (teams.length < 2) {
            showError('Could not extract enough teams from screenshots');
            return;
        }
        
        currentTeams = teams;
        displayTeamsSummary(teams);
        await compareTeams();
        
    } catch (error) {
        console.error('Screenshots upload error:', error);
        showError('Failed to process screenshots. Please try again.');
    } finally {
        showUploadProgress(false);
        screenshotsInput.value = '';
    }
}

function validateScreenshots(files) {
    return files.every(file => 
        file.type.startsWith('image/') && 
        (file.type === 'image/jpeg' || file.type === 'image/png')
    );
}

async function processScreenshot(file) {
    const formData = new FormData();
    formData.append('image', file);
    
    const response = await fetch(`${API_BASE_URL}/ocr`, {
        method: 'POST',
        body: formData
    });
    
    return await response.json();
}

function displayTeamsSummary(teams) {
    teamsSummary.classList.remove('hidden');
    
    summaryContent.innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            ${teams.map((team, index) => `
                <div class="bg-gray-50 rounded-lg p-4">
                    <h4 class="font-semibold text-gray-900 mb-2">${team.name || `Team ${index + 1}`}</h4>
                    <div class="text-sm text-gray-600 space-y-1">
                        <div>Players: ${team.players ? team.players.length : 0}</div>
                        <div>Captain: ${team.captain || 'Not specified'}</div>
                        <div>Vice-Captain: ${team.viceCaptain || 'Not specified'}</div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

async function compareTeams() {
    if (currentTeams.length < 2) {
        showError('At least 2 teams are required for comparison');
        return;
    }
    
    try {
        showLoading(true);
        hideError();
        
        const response = await fetch(`${API_BASE_URL}/compare-teams-focused`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                teams: currentTeams
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            displayComparisonResults(result);
        } else {
            showError(result.message || 'Failed to compare teams');
        }
        
    } catch (error) {
        console.error('Team comparison error:', error);
        showError('Failed to compare teams. Please try again.');
    } finally {
        showLoading(false);
    }
}

function displayComparisonResults(data) {
    comparisonResults.classList.remove('hidden');
    
    if (data.comparisonType === 'two-teams') {
        displayTwoTeamsComparison(data);
    } else {
        displayMultipleTeamsComparison(data);
    }
}

function displayTwoTeamsComparison(data) {
    twoTeamsComparison.classList.remove('hidden');
    multipleTeamsComparison.classList.add('hidden');
    
    // Common players
    document.getElementById('common-count').textContent = data.commonPlayers.count;
    document.getElementById('common-players').innerHTML = data.commonPlayers.players.map(player => `
        <div class="bg-green-100 text-green-800 px-3 py-2 rounded-lg text-sm font-medium">
            ${player}
        </div>
    `).join('');
    
    // Team 1 differentials
    document.getElementById('team1-name').textContent = data.differentials.team1.teamName;
    document.getElementById('team1-diff-count').textContent = data.differentials.team1.count;
    document.getElementById('team1-captain').textContent = data.differentials.team1.captain;
    document.getElementById('team1-vc').textContent = data.differentials.team1.viceCaptain;
    document.getElementById('team1-differentials').innerHTML = data.differentials.team1.players.map(player => `
        <div class="text-sm text-blue-700">• ${player}</div>
    `).join('');
    
    // Team 2 differentials
    document.getElementById('team2-name').textContent = data.differentials.team2.teamName;
    document.getElementById('team2-diff-count').textContent = data.differentials.team2.count;
    document.getElementById('team2-captain').textContent = data.differentials.team2.captain;
    document.getElementById('team2-vc').textContent = data.differentials.team2.viceCaptain;
    document.getElementById('team2-differentials').innerHTML = data.differentials.team2.players.map(player => `
        <div class="text-sm text-red-700">• ${player}</div>
    `).join('');
    
    // Overlap percentage
    document.getElementById('overlap-percentage').textContent = `${data.overlapPercentage}%`;
}

function displayMultipleTeamsComparison(data) {
    multipleTeamsComparison.classList.remove('hidden');
    twoTeamsComparison.classList.add('hidden');
    
    // Most common players
    document.getElementById('most-common-players').innerHTML = data.playerFrequency.mostCommon.map(player => `
        <div class="flex justify-between items-center bg-green-50 p-2 rounded">
            <span class="text-sm font-medium">${player.player}</span>
            <div class="text-right">
                <div class="text-xs text-green-600 font-medium">${player.frequency} teams</div>
                <div class="text-xs text-gray-500">${player.teamNumbers.join(', ')}</div>
            </div>
        </div>
    `).join('');
    
    // Moderately common players
    document.getElementById('moderately-common-players').innerHTML = data.playerFrequency.moderatelyCommon.map(player => `
        <div class="flex justify-between items-center bg-yellow-50 p-2 rounded">
            <span class="text-sm font-medium">${player.player}</span>
            <div class="text-right">
                <div class="text-xs text-yellow-600 font-medium">${player.frequency} teams</div>
                <div class="text-xs text-gray-500">${player.teamNumbers.join(', ')}</div>
            </div>
        </div>
    `).join('');
    
    // Unique players
    document.getElementById('unique-players').innerHTML = data.playerFrequency.unique.map(player => `
        <div class="flex justify-between items-center bg-blue-50 p-2 rounded">
            <span class="text-sm font-medium">${player.player}</span>
            <div class="text-right">
                <div class="text-xs text-blue-600 font-medium">Team ${player.teamNumbers[0]}</div>
            </div>
        </div>
    `).join('');
    
    // Popular captains
    document.getElementById('popular-captains').innerHTML = data.captaincyAnalysis.popularCaptains.map(captain => `
        <div class="flex justify-between items-center bg-purple-50 p-2 rounded">
            <span class="text-sm font-medium">${captain.player}</span>
            <span class="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">${captain.count} teams</span>
        </div>
    `).join('');
    
    // Popular vice-captains
    document.getElementById('popular-vice-captains').innerHTML = data.captaincyAnalysis.popularViceCaptains.map(vc => `
        <div class="flex justify-between items-center bg-orange-50 p-2 rounded">
            <span class="text-sm font-medium">${vc.player}</span>
            <span class="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full">${vc.count} teams</span>
        </div>
    `).join('');
}

function showUploadProgress(show) {
    if (show) {
        uploadProgress.classList.remove('hidden');
    } else {
        uploadProgress.classList.add('hidden');
        uploadBar.style.width = '0%';
    }
}

function showLoading(show) {
    if (show) {
        loadingState.classList.remove('hidden');
        comparisonResults.classList.add('hidden');
    } else {
        loadingState.classList.add('hidden');
    }
}

function showError(message) {
    errorMessage.textContent = message;
    errorState.classList.remove('hidden');
}

function hideError() {
    errorState.classList.add('hidden');
}

function showHelp() {
    alert(`Focused Team Comparison Help:

1. Upload 2 or more teams using CSV or screenshots
2. For 2 teams: See common players vs differentials
3. For multiple teams: See player frequency analysis
4. Each player shows which teams they appear in
5. Captain and vice-captain popularity is also analyzed

CSV Format:
Team Name, Players, Captain, Vice Captain

The comparison focuses on what makes each team unique!`);
} 