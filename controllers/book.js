const BookModel = require('../models/Book');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const User = require('../models/User');
const fs = require('fs');
const path = require('path');

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
    let requestData;
    try {
        requestData = typeof req.body.book === 'string' ? JSON.parse(req.body.book) : req.body.book;
    } catch (error) {
        return res.status(400).json({ error: 'Données du livre invalides.' });
    }

    if (!requestData.title || !requestData.author || !requestData.year || !requestData.genre) {
        return res.status(400).json({ error: 'Tous les champs sont requis.' });
    }

    let imageUrl = '';
    if (req.file) {
        const webpFilename = path.basename(req.file.path);
        imageUrl = `${req.protocol}://${req.get('host')}/images/${webpFilename}`;
    } else {
        imageUrl = 'https://example.com/default-image.jpg';
    }

    const newBook = {
        ...requestData,
        imageUrl: imageUrl,
        userId: req.auth.userId,
    };

    try {
        const book = new BookModel(newBook);
        await book.save();
        res.status(201).json(book);
    } catch (error) {
        res.status(500).json({ error: 'Erreur serveur lors de la création du livre.' });
    }
};

exports.modifyBook = async (req, res) => {
    try {
        const book = await BookModel.findById(req.params.id);
        if (!book) return res.status(404).json({ error: 'Livre non trouvé.' });
        if (book.userId.toString() !== req.auth.userId) {
            return res.status(401).json({ error: 'Non autorisé.' });
        }

        if (req.file && book.imageUrl) {
            const oldImage = path.join(__dirname, '..', 'images', path.basename(book.imageUrl));
            fs.unlink(oldImage, (err) => {
                if (err) {
                    console.error("Erreur lors de la suppression de l'image :", err);
                }
            });
        }

        const updatedData = {
            ...JSON.parse(req.body.book || '{}'),
            imageUrl: req.file ? `${req.protocol}://${req.get('host')}/images/${path.basename(req.file.path)}` : book.imageUrl,
        };

        await BookModel.updateOne({ _id: req.params.id }, updatedData);
        res.status(200).json({ message: 'Livre modifié avec succès.' });
    } catch (error) {
        res.status(500).json({ error: 'Erreur lors de la modification du livre.' });
    }
};

exports.deleteBook = async (req, res) => {
    try {
        const book = await BookModel.findById(req.params.id);
        if (!book) return res.status(404).json({ error: 'Livre non trouvé.' });
        if (book.userId.toString() !== req.auth.userId) {
            return res.status(401).json({ error: 'Non autorisé.' });
        }

        if (book.imageUrl) {
            const imagePath = path.join(__dirname, '..', 'images', path.basename(book.imageUrl));
            fs.unlink(imagePath, () => {});
        }

        await BookModel.deleteOne({ _id: req.params.id });
        res.status(200).json({ message: 'Livre supprimé avec succès.' });
    } catch {
        res.status(500).json({ error: 'Erreur lors de la suppression du livre.' });
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
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

exports.getBestRatedBooks = async (req, res) => {
    try {
        if (mongoose.connection.readyState !== 1) {
            return res.status(500).json({ error: "La connexion à la base de données est défaillante." });
        }

        const books = await BookModel
           .find()
           .sort({ averageRating: -1})
           .limit(3);

        if (books.length === 0) {
            return res.status(200).json([]);
        }

        res.status(200).json(books);
    } catch (error) {
        res.status(500).json({ error: 'Erreur serveur', details: error.message });
    }
};
