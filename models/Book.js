const mongoose = require('mongoose');

const ratingSchema = mongoose.Schema({
    userId: { type: String, required: true },
    grade: { type: Number, required: true }
});

const bookSchema = mongoose.Schema({
    userId: { type: mongoose.Types.ObjectId, required: true, ref: 'User' },
    title: { type: String, required: true },
    author: { type: String, required: true },
    imageUrl: { type: String, required: true, default: 'https://example.com/default-image.jpg' },
    year: { type: Number, required: true },
    genre: { type: String, required: true },
    ratings: [ratingSchema], //*
    averageRating: { type: Number, default: 0 }
}, { collection: 'bookmodels' });

module.exports = mongoose.model('BookModel', bookSchema);
