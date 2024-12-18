const fs = require('fs');
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');

const storage = multer.memoryStorage();

const convertImageToWebp = (req, res, next) => {
    if (req.file && req.file.mimetype.startsWith('image/')) {
        const outputPath = `images/${Date.now()}.webp`;

        sharp(req.file.buffer)
            .webp({ quality: 80 })
            .toFile(outputPath, (err, info) => {
                if (err) {
                    return res.status(500).json({ error: 'Erreur lors de la conversion de l\'image.' });
                }

                console.log('Image convertie en WebP :', outputPath);

                req.file.path = outputPath;

                next();
            });
    } else {
        next();
    }
};

const imageUpload = multer({ storage: storage }).single('image');

module.exports = { imageUpload, convertImageToWebp };

