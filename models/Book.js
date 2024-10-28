const mongoose = require('mongoose'); //import de mongoose

const ratingSchema = mongoose.Schema({ //structure de la notation //*
    userId: { type: String, required: true },
    grade: { type: Number, required: true }
});

const bookSchema = mongoose.Schema({ //structure d'un livre
    userId: { type: mongoose.Types.ObjectId, required: true, ref: 'User' },
    title: { type: String, required: true },
    author: { type: String, required: true },
    imageUrl: { type: String, required: true },
    year: { type: Number, required: true },
    genre: { type: String, required: true },
    ratings: [ratingSchema], //*
    averageRating: { type: Number, default: 0 }
});

module.exports = mongoose.model('Book', bookSchema); //création de Book > exportation
