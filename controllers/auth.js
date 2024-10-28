const bcrypt = require('bcrypt'); //import de bcrypt pour hacher les mots de passes
const jwt = require('jsonwebtoken'); //import de jwt pour gérer les tokens
const User = require('../models/User'); //models de donné = utilisateur
 
// Création d'un nouvelle utilisateur
exports.signup = (req, res) => {
    bcrypt.hash(req.body.password, 10) //hachage de mot de passe
        .then(hash => {
            const user = new User({ //crée un nouveau user avec email+mdp
                email: req.body.email,
                password: hash
            });
            user.save() //enregistrement de l'utilisateur
                .then(() => res.status(201).json({ message: 'Utilisateur créé !' }))
                .catch(error => res.status(400).json({ error }));
        })
        .catch(error => res.status(500).json({ error }));
};

// Connexion d'un utilisateur déja crée
exports.login = (req, res) => {
    console.log('Tentative de connexion avec l\'email:', req.body.email);
    
    User.findOne({ email: req.body.email }) //recherche de l'utilisateur par son mail
        .then(user => {
            if (!user) {
                console.log('Utilisateur non trouvé');
                return res.status(401).json({ error: 'Utilisateur non trouvé !' });
            }
            bcrypt.compare(req.body.password, user.password) //comparaison du mdp
                .then(valid => {
                    if (!valid) {
                        console.log('Mot de passe incorrect');
                        return res.status(401).json({ error: 'Mot de passe incorrect !' });
                    }
                    console.log('Connexion réussie');
                    console.log('JWT_SECRET:', process.env.JWT_SECRET); //géneration du token
                    res.status(200).json({
                        userId: user._id,
                        token: jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '24h' })
                    });
                })
                .catch(error => {
                    console.error('Erreur lors de la comparaison des mots de passe:', error);
                    res.status(500).json({ error });
                });
        })
        .catch(error => {
            console.error('Erreur lors de la recherche de l\'utilisateur:', error);
            res.status(500).json({ error });
        });
};
