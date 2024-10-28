const mongoose = require('mongoose'); //import de mongoose
const uniqueValidator = require('mongoose-unique-validator'); //import de UniqueValidator

const userSchema = mongoose.Schema({ //structure d'un user
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }
});

userSchema.plugin(uniqueValidator); //ajout du plugin UniqueValidator

module.exports = mongoose.model('User', userSchema); //création de User > exportation
