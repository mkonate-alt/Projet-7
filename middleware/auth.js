const jwt = require('jsonwebtoken'); //import de jwt

module.exports = (req, res, next) => {
    try {
        const token = req.headers.authorization.split(' ')[1]; //récupération du token
        const decodedToken = jwt.verify(token, process.env.JWT_SECRET); // Vérification du token
        req.auth = { userId: decodedToken.userId }; //ajout de l'id utilisateur à la requête
        next(); //passage au middleware suivant
    } catch {
        res.status(401).json({ error: 'Requête non authentifiée !' }); //erreur si le token est invalide
    }
};

