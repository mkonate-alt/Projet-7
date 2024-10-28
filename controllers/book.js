const Book = require('../models/Book'); //import du model Book

//récupération des livres dans la bdd
exports.getAllBooks = (req, res) => {
    Book.find() //trouver tout les livres
        .then(books => res.status(200).json(books))
        .catch(error => res.status(500).json({ error }));
};

//récupérer un livre en fonction de son id
exports.getOneBook = (req, res) => { //recherche d'un livre
    Book.findOne({ _id: req.params.id })
        .then(book => res.status(200).json(book))
        .catch(error => res.status(404).json({ error }));
};

//création d'un livre
exports.createBook = (req, res) => { //créer un nouveau livre
    const bookObject = {
        title: req.body.title,
        author: req.body.author,
        imageUrl: req.file ? `${req.protocol}://${req.get('host')}/images/${req.file.filename}` : '',
        year: req.body.year,
        genre: req.body.genre,
        userId: req.auth.userId,
    };

    const book = new Book(bookObject); //création de l'instance Book
    book.save()
        .then(() => res.status(201).json({ message: 'Livre enregistré !' }))
        .catch(error => res.status(400).json({ error }));
};

//modifie un livre éxistant
exports.modifyBook = (req, res) => {
    const bookObject = req.file ? {
        ...JSON.parse(req.body.book),
        imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
    } : { ...req.body };

    delete bookObject.userId;

    Book.findOne({ _id: req.params.id }) //vérification de l'utilisateur
        .then((book) => {
            if (book.userId !== req.auth.userId) {
                return res.status(403).json({ message: 'Non autorisé' });
            } else {
                Book.updateOne({ _id: req.params.id }, { ...bookObject, _id: req.params.id })
                    .then(() => res.status(200).json({ message: 'Livre modifié !' }))
                    .catch(error => res.status(400).json({ error }));
            }
        })
        .catch((error) => {
            res.status(404).json({ error: 'Livre non trouvé' });
        });
};

//supréssion d'un livre
exports.deleteBook = (req, res) => {
    Book.findOne({ _id: req.params.id }) //recherche du livre par l'id
        .then((book) => {
            if (book.userId !== req.auth.userId) { //vérification de l'utilisateur
                return res.status(403).json({ message: 'Non autorisé' });
            } else {
                Book.deleteOne({ _id: req.params.id }) //supression du livre
                    .then(() => res.status(200).json({ message: 'Livre supprimé !' }))
                    .catch(error => res.status(400).json({ error }));
            }
        })
        .catch((error) => {
            res.status(404).json({ error: 'Livre non trouvé' });
        });
};

//évaluation d'un livre
exports.rateBook = (req, res) => {
    const { userId, rating } = req.body;

    if (rating < 0 || rating > 5) { //vérification que la note est entre 0 et 5
        return res.status(400).json({ error: 'La note doit être comprise entre 0 et 5.' });
    }

    Book.findOne({ _id: req.params.id })
        .then(book => {
            const existingRating = book.ratings.find(r => r.userId === userId); //vérification pour voir si l'utilisateur a déja noté le livre
            if (existingRating) {
                return res.status(400).json({ error: 'Vous avez déjà noté ce livre.' });
            }

            book.ratings.push({ userId, grade: rating }); //si tout est bon ajout de note et mise a jour de la note moyenne
            book.averageRating = book.ratings.reduce((acc, curr) => acc + curr.grade, 0) / book.ratings.length;

            book.save()
                .then(() => res.status(200).json(book))
                .catch(error => res.status(500).json({ error }));
        })
        .catch(error => res.status(404).json({ error: 'Livre non trouvé' }));
};
