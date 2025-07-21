const { parseTeamDataFromOCRText } = require('./services/ocrService');

// Test cases for captain/vice captain detection
const testCases = [
    {
        name: "Basic captain/vice captain with (c) and (vc)",
        ocrText: `Virat Kohli (c)
Rohit Sharma (vc)
MS Dhoni
Jasprit Bumrah
Ravindra Jadeja
KL Rahul
Hardik Pandya
R Ashwin
Yuzvendra Chahal
Bhuvneshwar Kumar
Mohammed Shami`
    },
    {
        name: "Captain/vice captain with different formats",
        ocrText: `Captain: Virat Kohli
Vice Captain: Rohit Sharma
MS Dhoni
Jasprit Bumrah
Ravindra Jadeja
KL Rahul
Hardik Pandya
R Ashwin
Yuzvendra Chahal
Bhuvneshwar Kumar
Mohammed Shami`
    },
    {
        name: "Captain/vice captain with [c] and [vc] brackets",
        ocrText: `Virat Kohli [c]
Rohit Sharma [vc]
MS Dhoni
Jasprit Bumrah
Ravindra Jadeja
KL Rahul
Hardik Pandya
R Ashwin
Yuzvendra Chahal
Bhuvneshwar Kumar
Mohammed Shami`
    },
    {
        name: "Captain/vice captain with C: and VC: format",
        ocrText: `C: Virat Kohli
VC: Rohit Sharma
MS Dhoni
Jasprit Bumrah
Ravindra Jadeja
KL Rahul
Hardik Pandya
R Ashwin
Yuzvendra Chahal
Bhuvneshwar Kumar
Mohammed Shami`
    },
    {
        name: "Captain/vice captain with spaces around indicators",
        ocrText: `Virat Kohli ( c )
Rohit Sharma ( vc )
MS Dhoni
Jasprit Bumrah
Ravindra Jadeja
KL Rahul
Hardik Pandya
R Ashwin
Yuzvendra Chahal
Bhuvneshwar Kumar
Mohammed Shami`
    }
];

console.log('Testing Enhanced OCR Captain/Vice Captain Detection\n');

testCases.forEach((testCase, index) => {
    console.log(`\n=== Test Case ${index + 1}: ${testCase.name} ===`);
    console.log('Input OCR Text:');
    console.log(testCase.ocrText);
    console.log('\n--- Processing ---');
    
    try {
        const result = parseTeamDataFromOCRText(testCase.ocrText);
        
        console.log('\nResults:');
        console.log(`Players found: ${result.players.length}`);
        console.log(`Captain: ${result.captain || 'Not detected'}`);
        console.log(`Vice Captain: ${result.vice_captain || 'Not detected'}`);
        console.log(`Captain Detection: ${result.captainDetection}`);
        console.log(`Vice Captain Detection: ${result.viceCaptainDetection}`);
        
        if (result.captain && result.vice_captain) {
            console.log('✅ SUCCESS: Both captain and vice-captain detected!');
        } else if (result.captain || result.vice_captain) {
            console.log('⚠️  PARTIAL: Only one detected');
        } else {
            console.log('❌ FAILED: Neither detected');
        }
        
    } catch (error) {
        console.error('❌ ERROR:', error.message);
    }
    
    console.log('\n' + '='.repeat(60));
});

console.log('\nTest completed!'); 