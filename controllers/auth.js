const bcrypt = require('bcrypt'); //import de bcrypt pour hacher les mots de passes
const jwt = require('jsonwebtoken'); //import de jwt pour gérer les tokens
const User = require('../models/User'); //models de donné = utilisateur
 
// Création d'un nouvelle utilisateur
exports.signup = async (req, res) => {
    try {
        const hash = await bcrypt.hash(req.body.password, 10);
        const user = new User({
            email: req.body.email,
            password: hash
        });
        await user.save();
        res.status(201).json({ message: 'Utilisateur créé !' });
    } catch (error) {
        res.status(error.status || 500).json({ error });
    }
};

// Connexion d'un utilisateur déja crée
exports.login = async (req, res) => {
    console.log('Tentative de connexion avec l\'email:', req.body.email);
    
    try {
        const user = await User.findOne({ email: req.body.email });
        if (!user) {
            console.log('Utilisateur non trouvé');
            return res.status(401).json({ error: 'Utilisateur non trouvé !' });
        }
        
        const valid = await bcrypt.compare(req.body.password, user.password);
        if (!valid) {
            console.log('Mot de passe incorrect');
            return res.status(401).json({ error: 'Mot de passe incorrect !' });
        }
        
        console.log('Connexion réussie');
        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET);
        res.status(200).json({
            userId: user._id,
            token: token
        });
    } catch (error) {
        console.error('Erreur lors de la connexion:', error);
        res.status(500).json({ error });
    }
};