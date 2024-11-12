const Book = require('../models/Book'); //import du model Book
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const User = require('../models/User'); // Assure-toi que le chemin d'importation est correct

// Récupération des livres dans la BDD
exports.getAllBooks = async (req, res) => {
    try {
        const books = await Book.find(); // Trouver tous les livres
        res.status(200).json(books);
    } catch (error) {
        res.status(401).json({ error });
    }
};

// Récupérer un livre en fonction de son ID
exports.getOneBook = async (req, res) => {
    try {
        const book = await Book.findOne({ _id: req.params.id });
        if (!book) {
            return res.status(404).json({ error: 'Livre non trouvé' });
        }
        res.status(200).json(book);
    } catch (error) {
        res.status(401).json({ error: 'Livre non trouvé' });
    }
};

exports.createBook = async (req, res) => {
    console.log(req.body); // Ajoutez ce log pour voir ce qui est reçu

    let bookObject;
    try {
        bookObject = JSON.parse(req.body.book); // Assurez-vous que ça correspond au format envoyé
    } catch (error) {
        return res.status(400).json({ error: 'Données du livre invalides.' });
    }

    // Validation des champs
    if (!bookObject.title || !bookObject.author || !bookObject.year || !bookObject.genre) {
        return res.status(400).json({ error: 'Tous les champs sont requis.' });
    }

    const newBook = {
        title: bookObject.title,
        author: bookObject.author,
        imageUrl: req.file ? `${req.protocol}://${req.get('host')}/images/${req.file.filename}` : '',
        year: bookObject.year,
        genre: bookObject.genre,
        userId: req.auth.userId,
    };

    try {
        const book = new Book(newBook);
        await book.save();
        res.status(201).json(book);
    } catch (error) {
        res.status(401).json({ error: error.message });
    }
};

// Modifier un livre existant
exports.modifyBook = async (req, res) => {
    try {
        // Préparer l'objet book à mettre à jour
        const bookToUpdate = req.file ? {
            ...req.body, // Prend les données de req.body (JSON)
            imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}` // Si un fichier est envoyé, ajouter l'URL de l'image
        } : { ...req.body };

        // Vérifie si le livre existe
        const book = await Book.findOne({ _id: req.params.id });
        if (!book) {
            return res.status(404).json({ error: 'Livre non trouvé' });
        }

        // Vérifier si l'utilisateur est autorisé à modifier ce livre
        if (!book.userId.equals(new mongoose.Types.ObjectId(req.auth.userId))) {
            return res.status(401).json({ message: 'Non autorisé' });
        }

        // Mettre à jour le livre dans la base de données
        await Book.updateOne({ _id: req.params.id }, { ...bookToUpdate, _id: req.params.id });

        res.status(200).json({ message: 'Livre modifié !' });
    } catch (error) {
        console.error('Error while modifying book:', error);
        res.status(401).json({ error: 'Erreur lors de la modification du livre', message: error.message });
    }
};

exports.deleteBook = async (req, res) => {
    try {
        const bookId = req.params.id;

        // Vérification que l'ID est valide
        if (!mongoose.Types.ObjectId.isValid(bookId)) {
            return res.status(400).json({ error: 'ID du livre invalide' });
        }

        const book = await Book.findOne({ _id: bookId }); // Recherche du livre par l'ID
        if (!book) {
            return res.status(404).json({ error: 'Livre non trouvé' });
        }

        // Vérification de la correspondance entre le userId du livre et l'ID de l'utilisateur dans le token
        if (!book.userId.equals(new mongoose.Types.ObjectId(req.auth.userId))) {
            return res.status(401).json({ message: 'Non autorisé' });
        }

        // Suppression du livre
        await Book.deleteOne({ _id: bookId });
        res.status(200).json({ message: 'Livre supprimé !' });
    } catch (error) {
        console.error('Error while deleting book:', error);
        res.status(401).json({ message: 'Erreur lors de la suppression du livre', error: error.message });
    }
};

// Évaluation d'un livre
exports.rateBook = async (req, res) => {
    const { userId, rating } = req.body;

    if (rating < 0 || rating > 5) { // Vérification que la note est entre 0 et 5
        return res.status(400).json({ error: 'La note doit être comprise entre 0 et 5.' });
    }

    try {
        const book = await Book.findOne({ _id: req.params.id });
        if (!book) {
            return res.status(404).json({ error: 'Livre non trouvé' });
        }

        const existingRating = book.ratings.find(r => r.userId === userId); // Vérification pour voir si l'utilisateur a déjà noté le livre
        if (existingRating) {
            return res.status(400).json({ error: 'Vous avez déjà noté ce livre.' });
        }

        book.ratings.push({ userId, grade: rating }); // Ajout de note et mise à jour de la note moyenne
        book.averageRating = book.ratings.reduce((acc, curr) => acc + curr.grade, 0) / book.ratings.length;

        await book.save();
        res.status(200).json(book);
    } catch (error) {
        res.status(401).json({ error });
    }
};

exports.getBestRatedBooks = async (req, res) => {
    try {
        console.log("Lancement de l'agrégation pour récupérer les meilleurs livres...");

        const books = await Book.aggregate([
            {
                $unwind: "$ratings" // Déplier les notes (pour obtenir la note moyenne de chaque livre)
            },
            {
                $group: {
                    _id: "$_id", // Identifier les livres par leur ID
                    title: { $first: "$title" }, // Garder le titre du livre
                    averageRating: { $avg: "$ratings.grade" } // Calculer la moyenne des notes
                }
            },
            {
                $sort: { averageRating: -1 } // Trier par note moyenne décroissante
            },
            {
                $limit: 3 // Limiter à 3 livres
            }
        ]);

        console.log("Livres avec les meilleures notes :", books);

        if (books.length === 0) {
            return res.status(404).json({ error: "Aucun livre trouvé avec des notes." });
        }

        res.status(200).json(books);
    } catch (error) {
        console.error("Erreur dans l'agrégation :", error);
        res.status(401).json({ error: error.message });
    }
};
