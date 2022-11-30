const express = require('express');
const router = express.Router();
const { createUser, userLogin } = require("../controllers/userController")
const { createBooks, getBooks, getBookById, updateBooks, deleteBooks } = require("../controllers/booksController")
const { createReview,updateReview,deleteReview } = require('../controllers/reviewController')
const { authentication, authorisation } = require("../middleware/auth");


//----------------------------------------------[user apis] ---------------------------------------------------------
router.post("/register", createUser)
router.post("/login", userLogin)



//---------------------------------------------- [book apis] ----------------------------------------------------------
router.post("/books", authentication, createBooks)
router.get("/books", authentication, getBooks)
router.get("/books/:bookId", authentication, getBookById)
router.put("/books/:bookId", authentication, authorisation, updateBooks)
router.delete("/books/:bookId", authentication, authorisation, deleteBooks)



//-------------------------------------------------[review apis]-----------------------------------------------------
router.post("/books/:bookId/review", createReview)
router.put("/books/:bookId/review/:reviewId", updateReview)
router.delete("/books/:bookId/review/:reviewId", deleteReview)




module.exports = router;