const BookModel = require('../models/Book');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const User = require('../models/User');

exports.getAllBooks = async (req, res) => {
    try {
        const books = await BookModel.find();
        res.status(200).json(books);
    } catch (error) {
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

exports.getOneBook = async (req, res) => {
    try {
        const book = await BookModel.findOne({ _id: req.params.id });
        if (!book) {
            return res.status(404).json({ error: 'Livre non trouvé' });
        }
        res.status(200).json(book);
    } catch (error) {
        res.status(500).json({ error: 'Erreur serveur' });
    }
};
 
exports.createBook = async (req, res) => {
    console.log(req.body);

    let requestData;
    try {
        requestData = typeof req.body.book === 'string' ? JSON.parse(req.body.book) : req.body.book;
    } catch (error) {
        return res.status(400).json({ error: 'Données du livre invalides.' });
    }

    if (!requestData.title || !requestData.author || !requestData.year || !requestData.genre) {
        return res.status(400).json({ error: 'Tous les champs sont requis.' });
    }

    const newBook = {
        ...requestData,
        imageUrl: req.file ? `${req.protocol}://${req.get('host')}/images/${req.file.filename}` : '',
        userId: req.auth.userId,
    };

    try {
        const book = new BookModel(newBook);
        await book.save();
        res.status(201).json(book);
    } catch (error) {
        console.error('Erreur lors de la création du livre :', error);
        res.status(500).json({ error: 'Erreur serveur lors de la création du livre.' });
    }
};



exports.modifyBook = async (req, res) => {
    try {
        const bookToUpdate = req.file ? {
            ...req.body,
            imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
        } : { ...req.body };

        const book = await BookModel.findOne({ _id: req.params.id });
        if (!book) {
            return res.status(404).json({ error: 'Livre non trouvé' });
        }

        if (!book.userId.equals(new mongoose.Types.ObjectId(req.auth.userId))) {
            return res.status(401).json({ message: 'Non autorisé' });
        }

        await BookModel.updateOne({ _id: req.params.id }, { ...bookToUpdate, _id: req.params.id });
        res.status(200).json({ message: 'Livre modifié !' });
    } catch (error) {
        console.error('Erreur lors de la modification du livre :', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

exports.deleteBook = async (req, res) => {
    try {
        const bookId = req.params.id;

        if (!mongoose.Types.ObjectId.isValid(bookId)) {
            return res.status(400).json({ error: 'ID du livre invalide' });
        }

        const book = await BookModel.findOne({ _id: bookId });
        if (!book) {
            return res.status(404).json({ error: 'Livre non trouvé' });
        }

        if (!book.userId.equals(new mongoose.Types.ObjectId(req.auth.userId))) {
            return res.status(401).json({ message: 'Non autorisé' });
        }

        await BookModel.deleteOne({ _id: bookId });
        res.status(200).json({ message: 'Livre supprimé !' });
    } catch (error) {
        console.error('Erreur lors de la suppression du livre :', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

exports.rateBook = async (req, res) => {
    const { userId, rating } = req.body;

    if (rating < 0 || rating > 5) {
        return res.status(400).json({ error: 'La note doit être comprise entre 0 et 5.' });
    }

    try {
        const book = await BookModel.findOne({ _id: req.params.id });
        if (!book) {
            return res.status(404).json({ error: 'Livre non trouvé' });
        }

        const existingRating = book.ratings.find(r => r.userId === userId);
        if (existingRating) {
            return res.status(400).json({ error: 'Vous avez déjà noté ce livre.' });
        }

        book.ratings.push({ userId, grade: rating });
        book.averageRating = book.ratings.reduce((acc, curr) => acc + curr.grade, 0) / book.ratings.length;

        await book.save();
        res.status(200).json(book);
    } catch (error) {
        console.error("Erreur lors de la notation du livre :", error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};


exports.getBestRatedBooks = async (req, res) => {
    try {
        console.log("Lancement de l'agrégation pour récupérer les meilleurs livres...");

        // Vérification si la connexion MongoDB est active
        if (mongoose.connection.readyState !== 1) {
            return res.status(500).json({ error: "La connexion à la base de données est défaillante." });
        }

        const books = await BookModel.aggregate([
            {
                $unwind: "$ratings"
            },
            {
                $group: {
                    _id: "$_id",
                    title: { $first: "$title" },
                    averageRating: { $avg: "$ratings.grade" }
                }
            },
            {
                $sort: { averageRating: -1 }
            },
            {
                $limit: 3
            }
        ]);

        console.log("Livres avec les meilleures notes :", books);

        if (books.length === 0) {
            return res.status(404).json({ error: "Aucun livre trouvé avec des notes." });
        }

        res.status(200).json(books);
    } catch (error) {
        console.error("Erreur dans l'agrégation :", error.message);
        console.error("Détails de l'erreur :", error.stack);
        res.status(500).json({ error: 'Erreur serveur', details: error.message });
    }
};
