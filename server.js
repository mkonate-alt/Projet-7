const app = require('./app');
const mongoose = require('mongoose');
require('dotenv').config();


mongoose.connect('mongodb+srv://konatemahamadou:Cpnp1aY6eLxfdjdQ@cluster0.zqcjt.mongodb.net/test?retryWrites=true&w=majority')
    .then(() => console.log('Connexion à MongoDB réussie !'))
    .catch((error) => console.error('Connexion à MongoDB échouée !', error));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});