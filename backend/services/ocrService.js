const axios = require('axios');
const FormData = require('form-data');
const supabase = require('./supabaseClient');

async function processImageWithOCR(imageBuffer) {
    if (!process.env.OCR_API_KEY || process.env.OCR_API_KEY === 'your_ocr_space_api_key_here') {
        throw new Error('OCR API key not configured. Please set OCR_API_KEY in your .env file. Get a free key from https://ocr.space/ocrapi');
    }
    
    try {
        // Try multiple OCR engines for better results
        const engines = [1, 2, 3]; // OCR engines: 1=Fast, 2=Accurate, 3=Best
        let bestResult = null;
        let bestText = '';
        
        for (const engine of engines) {
            try {
                console.log(`Trying OCR engine ${engine}...`);
                
                const formData = new FormData();
                formData.append('file', imageBuffer, {
                    filename: 'image.jpg',
                    contentType: 'image/jpeg',
                });
                formData.append('apikey', process.env.OCR_API_KEY);
                formData.append('language', 'eng');
                formData.append('OCREngine', engine.toString());
                formData.append('detectOrientation', 'true');
                formData.append('isTable', 'false');
                formData.append('scale', 'true');
                formData.append('filetype', 'jpg');
                formData.append('isOverlayRequired', 'false');
                formData.append('isCreateSearchablePdf', 'false');
                formData.append('isSearchablePdfHideTextLayer', 'false');
                
                const response = await axios.post('https://api.ocr.space/parse/image', formData, {
                    headers: {
                        ...formData.getHeaders(),
                    },
                    timeout: 20000, // Increased timeout
                    maxRedirects: 3,
                    validateStatus: function (status) {
                        return status < 500;
                    }
                });
                
                if (response.data && response.data.ParsedResults && response.data.ParsedResults.length > 0) {
                    const extractedText = response.data.ParsedResults[0].ParsedText;
                    const confidence = response.data.ParsedResults[0].TextOverlay?.Lines?.length || 0;
                    
                    console.log(`Engine ${engine} extracted ${extractedText.length} characters with ${confidence} lines`);
                    
                    // Keep the result with more text or better confidence
                    if (extractedText.length > bestText.length || (extractedText.length === bestText.length && confidence > (bestResult?.confidence || 0))) {
                        bestText = extractedText;
                        bestResult = response.data.ParsedResults[0];
                    }
                }
                
                // If we got a good result, we can stop trying other engines
                if (bestText.length > 100) {
                    console.log(`Good result found with engine ${engine}, stopping...`);
                    break;
                }
                
            } catch (engineError) {
                console.warn(`Engine ${engine} failed:`, engineError.message);
                continue; // Try next engine
            }
        }
        
        if (bestText && bestText.trim().length > 0) {
            console.log(`Best OCR result: ${bestText.length} characters extracted`);
            return bestText;
        } else {
            throw new Error('No text detected in the uploaded image. Please ensure the image is clear and contains visible player names.');
        }
        
    } catch (error) {
        const isNetworkError = 
            error.code === 'ETIMEDOUT' || 
            error.code === 'ECONNABORTED' || 
            error.code === 'ENOTFOUND' ||
            error.code === 'ECONNREFUSED' ||
            error.message.includes('timeout') || 
            error.message.includes('ETIMEDOUT') ||
            error.message.includes('network') ||
            error.message.includes('connect');
            
        if (isNetworkError) {
            throw new Error('Unable to connect to OCR service. Please check your internet connection and try again.');
        }
        
        if (error.response && error.response.data && error.response.data.ErrorMessage) {
            throw new Error(`OCR service error: ${error.response.data.ErrorMessage}`);
        }
        
        throw error;
    }
}

function parseTeamDataFromOCRText(ocrText) {
    console.log('Raw OCR Text:', ocrText);
    
    const lines = ocrText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    console.log('Processed lines:', lines);
    
    const players = [];
    let currentRole = '';
    let captain = '';
    let viceCaptain = '';
    
    // Enhanced player name patterns for better detection
    const playerNamePatterns = [
        // Full names with spaces
        /^[A-Z][a-z]+ [A-Z][a-z]+$/,
        /^[A-Z][a-z]+ [A-Z][a-z]+ [A-Z][a-z]+$/,
        // Names with dots (initials)
        /^[A-Z]\.[A-Z]? [A-Z][a-z]+$/,
        /^[A-Z][a-z]+ [A-Z]\.[A-Z]?$/,
        // Names with hyphens
        /^[A-Z][a-z]+-[A-Z][a-z]+$/,
        // Single word names (common surnames)
        /^[A-Z][a-z]{3,}$/
    ];
    
    // First pass: Look for role headers and structured player data
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // Detect role headers
        if (line.toUpperCase().includes('WICKET-KEEPER') || line.toUpperCase().includes('WK')) { 
            currentRole = 'Wicket-Keeper'; 
            continue; 
        }
        if (line.toUpperCase().includes('BATTER') || line.toUpperCase().includes('BATSMAN')) { 
            currentRole = 'Batter'; 
            continue; 
        }
        if (line.toUpperCase().includes('ALL-ROUNDER') || line.toUpperCase().includes('ALL ROUNDER')) { 
            currentRole = 'All-Rounder'; 
            continue; 
        }
        if (line.toUpperCase().includes('BOWLER')) { 
            currentRole = 'Bowler'; 
            continue; 
        }
        
        // Skip obvious non-player lines
        const skipLine = (
            line.toLowerCase().includes('dream11') ||
            line.toLowerCase().includes('pts') ||
            line.toLowerCase().includes('team') ||
            line.toLowerCase().includes('match') ||
            line.toLowerCase().includes('save') ||
            line.toLowerCase().includes('selected') ||
            line.toLowerCase().includes('edit') ||
            line.toLowerCase().includes('confirm') ||
            line.toLowerCase().includes('submit') ||
            line.toLowerCase().includes('preview') ||
            line.toLowerCase().includes('credits') ||
            line.toLowerCase().includes('remaining') ||
            line.toLowerCase().includes('balance') ||
            /^(CSK|MI|RCB|KKR|DC|PBKS|RR|SRH|GT|LSG|DT|RC|KK|PB|SR|GU|LS)$/i.test(line) ||
            line.toLowerCase().includes('wicket') ||
            line.toLowerCase().includes('keeper') ||
            line.toLowerCase().includes('batter') ||
            line.toLowerCase().includes('batsman') ||
            line.toLowerCase().includes('rounder') ||
            line.toLowerCase().includes('bowler') ||
            (line.toLowerCase().includes('captain') && !line.toLowerCase().includes('(c)') && !line.toLowerCase().includes('[c]') && !line.toLowerCase().includes('(vc)') && !line.toLowerCase().includes('[vc]')) ||
            /^\d+$/.test(line) ||
            /^\d+\.\d+$/.test(line) ||
            /^\d+\s*pts?$/i.test(line) ||
            line.toLowerCase() === 'c' ||
            line.toLowerCase() === 'vc' ||
            line.toLowerCase() === 'captain' ||
            line.toLowerCase() === 'vice' ||
            line.toLowerCase() === 'ot' ||
            line.toLowerCase() === 'o' ||
            line.toLowerCase() === 't' ||
            /^[.,;:!@#$%^&*()_+\-=\[\]{}|\\:";'<>?,./]$/.test(line) ||
            line.length < 2 ||
            line.length > 35 || // Increased max length
            /^(tap|click|select|choose|add|remove|delete|cancel|ok|yes|no)$/i.test(line) ||
            /^(total|runs|wickets|overs|extras|batting|bowling|fielding)$/i.test(line)
        );
        
        // Special case: Allow lines with captain/vice captain indicators even if they would be skipped
        const hasCaptainIndicator = line.toLowerCase().includes('(c)') || line.toLowerCase().includes('[c]') || line.toLowerCase().includes('captain:') || line.toLowerCase().startsWith('c:');
        const hasViceCaptainIndicator = line.toLowerCase().includes('(vc)') || line.toLowerCase().includes('[vc]') || line.toLowerCase().includes('vice') || line.toLowerCase().startsWith('vc:');
        
        if (skipLine && !hasCaptainIndicator && !hasViceCaptainIndicator) {
            console.log(`Skipping line "${line}" due to skipLine logic`);
            continue;
        }
        
        // Enhanced player name detection with multiple validation methods
        let isValidPlayerName = false;
        
        // Method 1: Check against player name patterns
        isValidPlayerName = playerNamePatterns.some(pattern => pattern.test(line));
        
        // Method 2: Manual validation for edge cases
        if (!isValidPlayerName) {
            isValidPlayerName = (
                /^[A-Za-z\s\.\-'()\[\]]{2,}$/.test(line) &&
                /[A-Za-z]/.test(line) &&
                !(line.length <= 3 && line === line.toUpperCase()) &&
                !['BATTING', 'BOWLING', 'FIELDING', 'EXTRAS', 'TOTAL', 'RUNS', 'WICKETS', 'OVERS'].includes(line.toUpperCase()) &&
                (line.includes(' ') || (line.length >= 3 && line.length <= 35)) // Increased max length
            );
        }
        
        // Method 3: Check for common cricket player names
        if (!isValidPlayerName) {
            const commonPlayerNames = [
                'kohli', 'sharma', 'dhoni', 'bumrah', 'jadeja', 'rahul', 'pandya', 'ashwin', 'chahal', 'kumar',
                'singh', 'patel', 'khan', 'ahmed', 'ali', 'malik', 'yadav', 'verma', 'reddy', 'naik',
                'gill', 'iyer', 'pant', 'kishan', 'gaikwad', 'jaiswal', 'tripathi', 'samson', 'buttler',
                'warner', 'smith', 'maxwell', 'starc', 'cummins', 'hazlewood', 'lyon', 'carey', 'marsh',
                'du plessis', 'livingstone', 'curran', 'rabada', 'chahar', 'brar', 'ellis', 'joseph',
                'dayal', 'lomror', 'prabhudessai', 'rawat', 'vyshak', 'deep', 'bhandage', 'ferguson',
                'dhawan', 'bairstow', 'rajapaksa', 'taide', 'conway', 'stokes', 'gaikwad'
            ];
            
            const lineLower = line.toLowerCase();
            isValidPlayerName = commonPlayerNames.some(name => 
                lineLower.includes(name) || name.includes(lineLower)
            );
        }
        
        console.log(`Processing line "${line}": isValidPlayerName = ${isValidPlayerName}`);
        if (isValidPlayerName) {
            console.log(`  ✅ Line "${line}" passed validation, proceeding to name cleaning`);
            let cleanName = line.replace(/\d+/g, '').replace(/pts?/gi, '').replace(/\s+/g, ' ').trim();
            console.log(`  Initial cleanName: "${cleanName}"`);
            
            // Check for captain/vice-captain indicators with more precise patterns
            const isCaptain = (
                line.toLowerCase().includes('(c)') || 
                line.toLowerCase().includes(' (c)') || 
                line.toLowerCase().includes('(c) ') || 
                line.toLowerCase().includes(' captain') ||
                line.toLowerCase().endsWith(' c') ||
                line.toLowerCase().startsWith('c ') ||
                /\b(c)\b/i.test(line) ||
                line.toLowerCase().includes('captain')
            );
            const isViceCaptain = (
                line.toLowerCase().includes('(vc)') || 
                line.toLowerCase().includes(' (vc)') || 
                line.toLowerCase().includes('(vc) ') || 
                line.toLowerCase().includes(' vice') ||
                line.toLowerCase().includes(' vice-captain') ||
                line.toLowerCase().endsWith(' vc') ||
                line.toLowerCase().startsWith('vc ') ||
                /\b(vc)\b/i.test(line)
            );
            
            console.log(`  Captain detection: ${isCaptain}, Vice Captain detection: ${isViceCaptain}`);
            
            // Remove captain/vice-captain indicators from name more precisely
            cleanName = cleanName
                .replace(/\(c\)/gi, '')
                .replace(/\(vc\)/gi, '')
                .replace(/\[c\]/gi, '')
                .replace(/\[vc\]/gi, '')
                .replace(/\bcaptain\b/gi, '')
                .replace(/\bvice\s*captain\b/gi, '')
                .replace(/\bvice\b/gi, '')
                .trim();
            
            console.log(`  Clean name: "${cleanName}", length: ${cleanName.length}, isCaptain: ${isCaptain}, isViceCaptain: ${isViceCaptain}`);
            if (cleanName.length >= 2 && cleanName.length <= 35 && /^[A-Za-z\s\.\-']+$/.test(cleanName)) {
                if (cleanName.length >= 2) {
                    players.push({ 
                        name: cleanName, 
                        role: currentRole || 'Unknown',
                        isCaptain: isCaptain,
                        isViceCaptain: isViceCaptain
                    });
                    
                    if (isCaptain) captain = cleanName;
                    if (isViceCaptain) viceCaptain = cleanName;
                    console.log(`  ✅ Added player: ${cleanName}`);
                } else {
                    console.log(`  ❌ Player not added - cleanName too short`);
                }
            }
        }
    }
    
    // Remove duplicates while preserving order
    const uniquePlayers = players.filter((player, index, self) => 
        index === self.findIndex(p => p.name.toLowerCase() === player.name.toLowerCase())
    );
    
    let finalPlayers = uniquePlayers.map(p => p.name);
    
    // Log the players found in the first pass
    console.log('Players found in first pass:', uniquePlayers.map(p => `${p.name} (C:${p.isCaptain}, VC:${p.isViceCaptain})`));
    
    // If we don't have enough players, try more aggressive parsing
    if (finalPlayers.length < 8) {
        console.log('Not enough players found, trying aggressive parsing...');
        
        // Second pass: Look for any text that could be a player name
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            // Skip if already found or clearly not a player
            if (finalPlayers.some(player => 
                player.toLowerCase().includes(line.toLowerCase()) || 
                line.toLowerCase().includes(player.toLowerCase())
            )) continue;
            
            // More lenient player name detection
            const couldBePlayer = (
                line.length >= 3 && 
                line.length <= 35 && 
                /^[A-Za-z\s\.\-']+$/.test(line) &&
                !/^(CSK|MI|RCB|KKR|DC|PBKS|RR|SRH|GT|LSG|BATTER|BOWLER|WICKET|KEEPER|ALL|ROUNDER|DREAM11|TEAM|MATCH|SAVE|EDIT|CONFIRM|SUBMIT|PREVIEW|CREDITS|REMAINING|BALANCE|TOTAL|RUNS|WICKETS|OVERS|EXTRAS|BATTING|BOWLING|FIELDING)$/i.test(line) &&
                !/^\d+$/.test(line) &&
                !/^\d+\.\d+$/.test(line) &&
                !/^\d+\s*pts?$/i.test(line) &&
                !line.toLowerCase().includes('dream11') &&
                !line.toLowerCase().includes('team') &&
                !line.toLowerCase().includes('match')
            );
            
            if (couldBePlayer) {
                const cleanName = line.replace(/\d+/g, '').replace(/\s+/g, ' ').trim();
                if (cleanName.length >= 3 && !finalPlayers.includes(cleanName)) {
                    finalPlayers.push(cleanName);
                    console.log('Added player via aggressive parsing:', cleanName);
                    if (finalPlayers.length >= 11) break;
                }
            }
        }
    }
    
    // Third pass: If still not enough, look for single words that could be surnames
    if (finalPlayers.length < 8) {
        console.log('Still not enough players, trying surname detection...');
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            if (finalPlayers.some(player => 
                player.toLowerCase().includes(line.toLowerCase()) || 
                line.toLowerCase().includes(player.toLowerCase())
            )) continue;
            
            // Look for common cricket player surname patterns
            const commonSurnames = [
                'kohli', 'sharma', 'dhoni', 'bumrah', 'jadeja', 'rahul', 'pandya', 'ashwin', 'chahal', 'kumar',
                'singh', 'patel', 'khan', 'ahmed', 'ali', 'malik', 'yadav', 'verma', 'reddy', 'naik',
                'gill', 'iyer', 'pant', 'kishan', 'gaikwad', 'jaiswal', 'tripathi', 'samson', 'buttler',
                'warner', 'smith', 'maxwell', 'starc', 'cummins', 'hazlewood', 'lyon', 'carey', 'marsh',
                'du plessis', 'livingstone', 'curran', 'rabada', 'chahar', 'brar', 'ellis', 'joseph',
                'dayal', 'lomror', 'prabhudessai', 'rawat', 'vyshak', 'deep', 'bhandage', 'ferguson',
                'dhawan', 'bairstow', 'rajapaksa', 'taide', 'conway', 'stokes', 'gaikwad'
            ];
            
            const isCommonSurname = commonSurnames.some(surname => 
                line.toLowerCase().includes(surname.toLowerCase())
            );
            
            const couldBeSurname = (
                line.length >= 3 && 
                line.length <= 20 && // Increased max length
                /^[A-Za-z]+$/.test(line) &&
                !/^(CSK|MI|RCB|KKR|DC|PBKS|RR|SRH|GT|LSG|BATTER|BOWLER|WICKET|KEEPER|ALL|ROUNDER|DREAM11|TEAM|MATCH|SAVE|EDIT|CONFIRM|SUBMIT|PREVIEW|CREDITS|REMAINING|BALANCE|TOTAL|RUNS|WICKETS|OVERS|EXTRAS|BATTING|BOWLING|FIELDING)$/i.test(line) &&
                !/^\d+$/.test(line) &&
                !/^\d+\.\d+$/.test(line) &&
                !/^\d+\s*pts?$/i.test(line) &&
                (isCommonSurname || line.length >= 4)
            );
            
            if (couldBeSurname) {
                const cleanName = line.trim();
                if (cleanName.length >= 3 && !finalPlayers.includes(cleanName)) {
                    finalPlayers.push(cleanName);
                    console.log('Added player via surname detection:', cleanName);
                    if (finalPlayers.length >= 11) break;
                }
            }
        }
    }
    
    // Limit to 11 players and ensure we have captain/vice-captain
    finalPlayers = finalPlayers.slice(0, 11);
    
    // If no captain/vice-captain found, try to detect from the data
    if (!captain && finalPlayers.length > 0) {
        const captainPlayer = uniquePlayers.find(p => p.isCaptain);
        if (captainPlayer) {
            captain = captainPlayer.name;
        }
    }
    
    if (!viceCaptain && finalPlayers.length > 1) {
        const viceCaptainPlayer = uniquePlayers.find(p => p.isViceCaptain);
        if (viceCaptainPlayer) {
            viceCaptain = viceCaptainPlayer.name;
        }
    }
    
    // Additional pass: Look for captain/vice-captain indicators in the raw text
    if (!captain || !viceCaptain) {
        console.log('Performing additional captain/vice-captain detection...');
        
        // Look for common Dream11 UI patterns where captain/vice-captain info is displayed
        const lines = ocrText.split('\n');
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].toLowerCase().trim();
            
            // Look for lines that contain captain/vice-captain information
            if (line.includes('captain') || line.includes('(c)') || line.includes('[c]')) {
                console.log('Found captain indicator in line:', lines[i]);
                // Try to extract player name from surrounding context
                if (i > 0 && i < lines.length - 1) {
                    const prevLine = lines[i - 1].trim();
                    const nextLine = lines[i + 1].trim();
                    
                    // Check if previous or next line contains a player name
                    const potentialCaptain = finalPlayers.find(player => 
                        prevLine.includes(player.toLowerCase()) || 
                        nextLine.includes(player.toLowerCase())
                    );
                    
                    if (potentialCaptain && !captain) {
                        captain = potentialCaptain;
                        console.log('Found captain from context:', captain);
                    }
                }
            }
            
            if (line.includes('vice') || line.includes('(vc)') || line.includes('[vc]')) {
                console.log('Found vice-captain indicator in line:', lines[i]);
                // Try to extract player name from surrounding context
                if (i > 0 && i < lines.length - 1) {
                    const prevLine = lines[i - 1].trim();
                    const nextLine = lines[i + 1].trim();
                    
                    // Check if previous or next line contains a player name
                    const potentialViceCaptain = finalPlayers.find(player => 
                        prevLine.includes(player.toLowerCase()) || 
                        nextLine.includes(player.toLowerCase())
                    );
                    
                    if (potentialViceCaptain && !viceCaptain) {
                        viceCaptain = potentialViceCaptain;
                        console.log('Found vice-captain from context:', viceCaptain);
                    }
                }
            }
        }
    
        // Look for common Dream11 captain/vice-captain patterns
        const captainPatterns = [
            /captain\s*:\s*([A-Za-z\s\.\-']+)/i,
            /c\s*:\s*([A-Za-z\s\.\-']+)/i,
            /\(c\)\s*([A-Za-z\s\.\-']+)/i,
            /([A-Za-z\s\.\-']+)\s*\(c\)/i,
            /([A-Za-z\s\.\-']+)\s*captain/i,
            /captain\s*([A-Za-z\s\.\-']+)/i,
            /([A-Za-z\s\.\-']+)\s*\(c\s*\)/i,
            /\(c\s*\)\s*([A-Za-z\s\.\-']+)/i,
            /([A-Za-z\s\.\-']+)\s*\[c\]/i,
            /\[c\]\s*([A-Za-z\s\.\-']+)/i,
            /captain\s*selected\s*:\s*([A-Za-z\s\.\-']+)/i,
            /captain\s*choice\s*:\s*([A-Za-z\s\.\-']+)/i
        ];
        
        const viceCaptainPatterns = [
            /vice\s*captain\s*:\s*([A-Za-z\s\.\-']+)/i,
            /vc\s*:\s*([A-Za-z\s\.\-']+)/i,
            /\(vc\)\s*([A-Za-z\s\.\-']+)/i,
            /([A-Za-z\s\.\-']+)\s*\(vc\)/i,
            /([A-Za-z\s\.\-']+)\s*vice\s*captain/i,
            /vice\s*captain\s*([A-Za-z\s\.\-']+)/i,
            /([A-Za-z\s\.\-']+)\s*\(vc\s*\)/i,
            /\(vc\s*\)\s*([A-Za-z\s\.\-']+)/i,
            /([A-Za-z\s\.\-']+)\s*\[vc\]/i,
            /\[vc\]\s*([A-Za-z\s\.\-']+)/i,
            /vice\s*captain\s*selected\s*:\s*([A-Za-z\s\.\-']+)/i,
            /vice\s*captain\s*choice\s*:\s*([A-Za-z\s\.\-']+)/i
        ];
        
        // Check for captain patterns
        if (!captain) {
            for (const pattern of captainPatterns) {
                const match = ocrText.match(pattern);
                if (match && match[1]) {
                    const potentialCaptain = match[1].trim();
                    // Check if this name exists in our player list
                    const foundPlayer = finalPlayers.find(player => 
                        player.toLowerCase().includes(potentialCaptain.toLowerCase()) ||
                        potentialCaptain.toLowerCase().includes(player.toLowerCase())
                    );
                    if (foundPlayer) {
                        captain = foundPlayer;
                        console.log('Found captain via pattern matching:', captain);
                        break;
                    }
                }
            }
        }
        
        // Check for vice-captain patterns
        if (!viceCaptain) {
            for (const pattern of viceCaptainPatterns) {
                const match = ocrText.match(pattern);
                if (match && match[1]) {
                    const potentialViceCaptain = match[1].trim();
                    // Check if this name exists in our player list
                    const foundPlayer = finalPlayers.find(player => 
                        player.toLowerCase().includes(potentialViceCaptain.toLowerCase()) ||
                        potentialViceCaptain.toLowerCase().includes(player.toLowerCase())
                    );
                    if (foundPlayer) {
                        viceCaptain = foundPlayer;
                        console.log('Found vice-captain via pattern matching:', viceCaptain);
                        break;
                    }
                }
            }
        }
    }
    
    console.log('Final extracted data:', {
        players: finalPlayers,
        captain: captain,
        viceCaptain: viceCaptain,
        extractedCount: finalPlayers.length,
        expectedCount: 11,
        captainDetection: captain ? '✅ Detected' : '❌ Not detected',
        viceCaptainDetection: viceCaptain ? '✅ Detected' : '❌ Not detected'
    });
    
    return {
        players: finalPlayers,
        captain: captain,
        vice_captain: viceCaptain,
        playerDetails: uniquePlayers.slice(0, 11),
        extractedCount: finalPlayers.length,
        expectedCount: 11,
        rawText: ocrText // Include raw text for debugging
    };
}

module.exports = { processImageWithOCR, parseTeamDataFromOCRText }; 