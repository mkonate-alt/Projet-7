const multer = require('multer'); //import de multer

const storage = multer.diskStorage({
    destination: (req, file, callback) => { //déstination /images
        callback(null, 'images');
    },
    filename: (req, file, callback) => { //création d'un nom de fichier unique
        callback(null, Date.now() + file.originalname);
    }
});

module.exports = multer({ storage: storage }).single('image'); //création d'un instance multer
