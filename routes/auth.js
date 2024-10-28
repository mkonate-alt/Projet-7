const express = require('express'); //import de express
const router = express.Router(); //création de "router" pour définir les routes
const authCtrl = require('../controllers/auth'); //import du controller auth

router.post('/signup', authCtrl.signup); //endpoint qui repond au requete POST
router.post('/login', authCtrl.login); //*

module.exports = router; //export du routeur
