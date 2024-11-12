const express = require('express'); //import de express
const router = express.Router(); //création de "router" pour définir les routes
const auth = require('../middleware/auth'); //import du middleware auth
const multer = require('../middleware/multer-config'); //import du middleware multer-config
const bookCtrl = require('../controllers/book'); //import du controller book

router.get('/bestrating', bookCtrl.getBestRatedBooks);
router.get('/', bookCtrl.getAllBooks);
router.get('/:id', bookCtrl.getOneBook);
router.post('/', auth, multer, bookCtrl.createBook);
router.put('/:id', auth, multer, bookCtrl.modifyBook);
router.delete('/:id', auth, bookCtrl.deleteBook);
router.post('/:id/rating', auth, bookCtrl.rateBook);


module.exports = router;
