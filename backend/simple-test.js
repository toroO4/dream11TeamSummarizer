// Simple test to debug OCR processing

const testLine = "Virat Kohli (c)";

console.log('Testing line:', testLine);

// Test the validation logic
const isValidPlayerName = (
    /^[A-Za-z\s\.\-'()\[\]]{2,}$/.test(testLine) &&
    /[A-Za-z]/.test(testLine) &&
    !(testLine.length <= 3 && testLine === testLine.toUpperCase()) &&
    !['BATTING', 'BOWLING', 'FIELDING', 'EXTRAS', 'TOTAL', 'RUNS', 'WICKETS', 'OVERS'].includes(testLine.toUpperCase()) &&
    (testLine.includes(' ') || (testLine.length >= 3 && testLine.length <= 30))
);

console.log('Regex test:', /^[A-Za-z\s\.\-'()\[\]]{2,}$/.test(testLine));
console.log('Has letters:', /[A-Za-z]/.test(testLine));
console.log('Length check:', !(testLine.length <= 3 && testLine === testLine.toUpperCase()));
console.log('Not in excluded list:', !['BATTING', 'BOWLING', 'FIELDING', 'EXTRAS', 'TOTAL', 'RUNS', 'WICKETS', 'OVERS'].includes(testLine.toUpperCase()));
console.log('Space or length check:', (testLine.includes(' ') || (testLine.length >= 3 && testLine.length <= 30)));

console.log('Final result:', isValidPlayerName); 