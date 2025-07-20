exports.healthCheck = (req, res) => {
    res.json({
        status: 'healthy',
        message: 'cricbuzz11 Team Analyzer Backend is running',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        version: '2.0.0',
        services: {
            ocr: {
                configured: !!process.env.OCR_API_KEY && process.env.OCR_API_KEY !== 'your_ocr_space_api_key_here',
                keyLength: process.env.OCR_API_KEY ? process.env.OCR_API_KEY.length : 0
            },
            openai: {
                configured: !!process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your_openai_api_key_here',
                keyLength: process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.length : 0
            }
        }
    });
}; 