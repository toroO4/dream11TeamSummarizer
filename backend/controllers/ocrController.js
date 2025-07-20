const { processImageWithOCR, parseTeamDataFromOCRText } = require('../services/ocrService');

exports.processImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No image file provided'
            });
        }

        console.log('Processing image with OCR...');
        const ocrText = await processImageWithOCR(req.file.buffer);
        console.log('OCR text extracted, parsing team data...');
        
        const teamData = parseTeamDataFromOCRText(ocrText);
        
        // Check if we got enough players
        if (teamData.players.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No player data could be extracted from the image',
                suggestion: 'Please ensure the image is clear, well-lit, and shows all player names clearly. Try taking a screenshot in landscape mode for better results.',
                extractedCount: 0,
                expectedCount: 11
            });
        }
        
        if (teamData.players.length < 8) {
            return res.status(400).json({
                success: false,
                message: `Only ${teamData.players.length} players were extracted from the image`,
                suggestion: `Expected 11 players but found only ${teamData.players.length}. Please ensure all player names are visible and clearly readable in the screenshot. You can manually add the missing players after extraction.`,
                data: teamData,
                extractedCount: teamData.players.length,
                expectedCount: 11,
                partialSuccess: true
            });
        }
        
        // Success response
        res.json({
            success: true,
            data: teamData,
            message: `Successfully extracted ${teamData.players.length} players from your uploaded image`,
            extractedFromImage: true,
            extractedCount: teamData.players.length,
            expectedCount: 11
        });
        
    } catch (error) {
        console.error('OCR processing error:', error);
        
        let errorMessage = 'Failed to process image';
        let suggestion = 'Please try again with a clear, well-lit screenshot of your Dream11 team.';
        
        if (error.message.includes('OCR API key not configured')) {
            errorMessage = 'OCR API key not configured';
            suggestion = 'Please set OCR_API_KEY in your .env file. Get a free key from https://ocr.space/ocrapi';
        } else if (error.message.includes('No text detected')) {
            errorMessage = 'No text could be detected in the image';
            suggestion = 'Please ensure the image is clear, contains visible player names, and is not too blurry or dark.';
        } else if (error.message.includes('Unable to connect')) {
            errorMessage = 'Unable to connect to OCR service';
            suggestion = 'Please check your internet connection and try again.';
        } else if (error.message.includes('OCR service error')) {
            errorMessage = 'OCR service error';
            suggestion = 'The OCR service is temporarily unavailable. Please try again in a few minutes.';
        }
        
        // Always show the actual error in development
        const showError = process.env.NODE_ENV === 'development' || error.message.includes('OCR API key not configured');
        
        res.status(500).json({
            success: false,
            message: errorMessage,
            suggestion: suggestion,
            error: showError ? error.message : undefined,
            debug: process.env.NODE_ENV === 'development' ? {
                hasOcrKey: !!process.env.OCR_API_KEY,
                ocrKeyLength: process.env.OCR_API_KEY ? process.env.OCR_API_KEY.length : 0,
                nodeEnv: process.env.NODE_ENV
            } : undefined
        });
    }
}; 