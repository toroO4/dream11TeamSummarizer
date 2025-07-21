// Simple debug script for OCR captain/vice captain detection

const testLines = [
    "Virat Kohli (c)",
    "Rohit Sharma (vc)",
    "MS Dhoni"
];

console.log('Testing multiple lines:');

const players = [];
let currentRole = '';
let captain = '';
let viceCaptain = '';

for (let i = 0; i < testLines.length; i++) {
    const line = testLines[i];
    console.log(`\n--- Processing line: "${line}" ---`);
    
    // Test skipLine logic
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
        line.length > 30 ||
        /^(tap|click|select|choose|add|remove|delete|cancel|ok|yes|no)$/i.test(line) ||
        /^(total|runs|wickets|overs|extras|batting|bowling|fielding)$/i.test(line)
    );

    console.log('skipLine result:', skipLine);

    // Test captain/vice captain indicators
    const hasCaptainIndicator = line.toLowerCase().includes('(c)') || line.toLowerCase().includes('[c]') || line.toLowerCase().includes('captain:') || line.toLowerCase().startsWith('c:');
    const hasViceCaptainIndicator = line.toLowerCase().includes('(vc)') || line.toLowerCase().includes('[vc]') || line.toLowerCase().includes('vice') || line.toLowerCase().startsWith('vc:');

    console.log('hasCaptainIndicator:', hasCaptainIndicator);
    console.log('hasViceCaptainIndicator:', hasViceCaptainIndicator);

    // Test if line should be processed
    const shouldProcess = !skipLine || hasCaptainIndicator || hasViceCaptainIndicator;
    console.log('shouldProcess:', shouldProcess);

    if (!shouldProcess) {
        console.log('Skipping line');
        continue;
    }

    // Test player name validation
    const isValidPlayerName = (
        /^[A-Za-z\s\.\-'()\[\]]{2,}$/.test(line) &&
        /[A-Za-z]/.test(line) &&
        !(line.length <= 3 && line === line.toUpperCase()) &&
        !['BATTING', 'BOWLING', 'FIELDING', 'EXTRAS', 'TOTAL', 'RUNS', 'WICKETS', 'OVERS'].includes(line.toUpperCase()) &&
        (line.includes(' ') || (line.length >= 3 && line.length <= 30))
    );

    console.log('isValidPlayerName:', isValidPlayerName);

    if (!isValidPlayerName) {
        console.log('Invalid player name, skipping');
        continue;
    }

    // Test captain detection
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

    console.log('isCaptain:', isCaptain);
    console.log('isViceCaptain:', isViceCaptain);

    // Test name cleaning
    let cleanName = line.replace(/\d+/g, '').replace(/pts?/gi, '').replace(/\s+/g, ' ').trim();
    console.log('Initial cleanName:', cleanName);

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

    console.log('Final cleanName:', cleanName);
    console.log('cleanName length:', cleanName.length);
    console.log('cleanName valid:', cleanName.length >= 2 && cleanName.length <= 25 && /^[A-Za-z\s\.\-']+$/.test(cleanName));

    if (cleanName.length >= 2 && cleanName.length <= 25 && /^[A-Za-z\s\.\-']+$/.test(cleanName)) {
        players.push({ 
            name: cleanName, 
            role: currentRole || 'Unknown',
            isCaptain: isCaptain,
            isViceCaptain: isViceCaptain
        });
        
        if (isCaptain) captain = cleanName;
        if (isViceCaptain) viceCaptain = cleanName;
        
        console.log('✅ Added player:', cleanName);
        console.log('  - isCaptain:', isCaptain);
        console.log('  - isViceCaptain:', isViceCaptain);
    } else {
        console.log('❌ Player not added - validation failed');
    }
}

console.log('\n=== Final Results ===');
console.log('Players:', players.map(p => `${p.name} (C:${p.isCaptain}, VC:${p.isViceCaptain})`));
console.log('Captain:', captain);
console.log('Vice Captain:', viceCaptain); 