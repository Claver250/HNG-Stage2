const jwt = require('jsonwebtoken');
const User = require('../models/user')
const SECRET_KEY = process.env.JWT_SECRET;

const authenticate = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if(!authHeader || !authHeader.startsWith('Bearer')) {
        return res.status(401).json({ error: 'Access denied. No token provided.'});
    };

    const token = authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token provided'})

    try{
        const decoded = jwt.verify(token, SECRET_KEY);
        console.log("DEBUG: Decoded Token Content:", decoded);
        req.user = {
            userId: decoded.userId,  // match your User model
            email: decoded.email,
            role: decoded.role,
        };
        next();
    }catch(err){
        res.status(400).json({ error: 'Invalid or expired token'})
    }
};

const authorize = (roles = []) => (req, res, next) => {
    if (typeof roles === 'string') {
        roles = [roles];
    }

    if (!req.user) {
        return res.status(401).json({ error: 'Not authorized, no user found' });
    }
    
    if(req.user.isActive === false) {
        return res.status(403).json({ status: 'error', message: 'Account is inactive.' });
    }

    if(!roles.includes(req.user.role)) {
        console.log(req.user.role);
        return res.status(403).json({ error: 'Access denied'});
    }
    next();
}

// middleware/authMiddleware.js

const protect = async (req, res, next) => {
    try {

        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer')) {
            return res.status(401).json({ error: "Access denied. No token provided." });
        }

        const token = authHeader.split(' ')[1];
        // 1. Get token and decode it...
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // 2. Fetch user from database
        const user = await User.findById(decoded.userId || decoded.id);

        // 3. CHECK IF USER EXISTS FIRST! <--- This is what's missing
        if (!user) {
            return res.status(401).json({ error: "User no longer exists" });
        }

        // 4. Attach user to request
        req.user = user;

        // 5. Now it is safe to check the role at line 33
        if (req.user.role === 'guest') { 
            return res.status(403).json({ error: "Access denied" });
        }

        next();
    } catch (error) {
        console.log(error)
        res.status(401).json({ error: "Access denied" });
    }
};
module.exports = {authenticate, authorize, protect};