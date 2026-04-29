const versionCheck = (req, res, next) => {
    const version = req.headers['x-api-version'];
    
    if (!version || version !== '1') {
        return res.status(400).json({ 
            status: 'error', 
            message: 'Missing or invalid X-API-Version header. Expected: 1' 
        });
    }
    next();
};

module.exports = versionCheck;