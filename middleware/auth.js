const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    try {
        if (!req.headers.authorization) {
            throw new Error('Authorization header is missing');
        }
        const token = req.headers.authorization.split(' ')[1];

        const decodedToken = jwt.verify(token, process.env.JWT_SECRET);

        req.auth = { userId: decodedToken.userId };
        next();
    } catch (error) {
        console.error('Token invalide ou absent:', error);
        res.status(401).json({ error: 'Requête non authentifiée !' });
    }
};
