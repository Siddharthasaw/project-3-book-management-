const reviewModel = require("../models/reviewModel")
const booksModel = require("../models/booksModel")
const userModel = require('../models/userModel')
const { isValidDate, isValidISBN13 } = require("../validation/validator");
const mongoose = require('mongoose')




const stringRegex = /^[ a-z ]+$/i



//====================================== creating books ===================================================

const createBooks = async function (req, res) {
    try {
        let requestBody = req.body;
        const { title, excerpt, userId, ISBN, category, subcategory, releasedAt } = requestBody
        //========================= if body data is not present =======================================
        if (Object.keys(requestBody).length == 0)
            return res.status(400).send({ status: false, message: "Body can't be empty! Please Provide Data" })
        //========================== title is mandatory ====================================
        if (!title) {
            return res.status(400).send({ status: false, message: "Title is required" })
        };
        //============================== if title already exist =====================================
        let checkTitle = await booksModel.findOne({ title: title })
        if (checkTitle) {
            return res.status(400).send({ status: false, message: "Title already used" })
        }
        //============================ excerpt is mandatory =========================================
        if (!excerpt) {
            return res.status(400).send({ status: false, message: "excerpt is required" })
        };
        //================================= userId is mandatory =====================================
        if (!userId) {
            return res.status(400).send({ status: false, message: "userId is required" })
        };

        //=============================== invalid format of userId =================================
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).send({ status: false, msg: "invalid userId format" });
        }
        //=============================== if userId is not found ======================================
        let checkuserId = await userModel.findOne({ userId: userId })
        if (!checkuserId) {
            return res.status(400).send({ status: false, message: "userId not found" })
        }
        //========================= if the user is authorised to create data =======================
        if (userId != req.token) {
            return res.status(403).send({
                status: false,
                message: "Unauthorized access ! User's credentials do not match."
            })
        }
        //======================== ISBN is mandatory ===========================================
        if (!ISBN) {
            return res.status(400).send({ status: false, message: "ISBN is required" })
        };
        //======================== invalid format of ISBN =======================================
        if (!isValidISBN13(ISBN)) {
            return res.status(400).send({ status: false, message: "Please provide correct format for ISBN" })
        };
        //================================ if ISBN already exist =====================================
        let checkISBN = await booksModel.findOne({ ISBN: ISBN })
        if (checkISBN) {
            return res.status(400).send({ status: false, message: "ISBN already used" })
        }
        //=================================== category is mandatory ==============================
        if (!category) {
            return res.status(400).send({ status: false, message: "category is required" })
        };

        if (!category.match(stringRegex)) {
            return res.status(400).send({ status: false, message: "category cannot contain numbers" })
        };
        //=============================== subcategory is mandatory =============================
        if (!subcategory) {
            return res.status(400).send({ status: false, message: "subcategory is required" })
        };
        if (typeof subcategory != "object" && typeof subcategory != "string") {
            return res.status(400).send({ status: false, message: "subcategory is in wrong format" })
        };
        //============================ releasedAt is mandatory ====================================
        if (!releasedAt) {
            return res.status(400).send({ status: false, message: "releasedAt is required" })
        };

        if (!isValidDate(releasedAt)) {
            return res.status(400).send({ status: false, message: "releasedAt is in incorrect format (YYYY-MM-DD)" })
        }


        //============================== createing books ============================================
        const newBook = await booksModel.create(requestBody);
        return res.status(201).send({ status: true, message: "Book created successfully", data: newBook })
    }
    catch (error) {
        return res.status(500).send({ status: false, message: error.message })
    }
}








//=================================== geting books data using query params ==================================

const getBooks = async function (req, res) {
    try {
        const queryParams = req.query
        let { userId, category, subcategory } = queryParams

        //========================== if query are not entered ==========================================
        if (Object.keys(queryParams).length == 0) {
            return res.status(400).send({ status: false, message: "enter query to get data" })
        }
        if (!(userId || category || subcategory)) {
            return res.status(400).send({ status: false, message: "enter valid query to get data" })
        }
        //================================== if userId is of invalid format =============================
        if (userId) {
            if (!mongoose.isValidObjectId(userId)) {
                return res.status(400).send({ status: false, msg: "invalid userId format" });
            }
        }
        //=============================== finding books in DB ========================================
        const books = await booksModel.find({ $and: [{ ...queryParams }, { isDeleted: false }] }).sort({ title: 1 }).select('_id title excerpt userId category releasedAt reviews')
        books.sort((a, b) => a.title.localeCompare(b.title))
        //============================ if book is not found ===========================================
        if (books.length === 0) {
            return res.status(404).send({ status: false, message: "Books not found" })
        }
        return res.status(200).send({ status: true, message: "Books list", data: books })

    }
    catch (error) {
        return res.status(500).send({ status: false, message: error.message })

    }
}







//=================================== get books by path params ========================================

const getBookById = async function (req, res) {
    try {
        const bookid = req.params.bookId
        //========================== invalid format of bookid =========================================
        if (!mongoose.Types.ObjectId.isValid(bookid)) {
            return res.status(400).send({ status: false, message: "Invalid Book Id" })
        }
        const book = await booksModel.findOne({ _id: bookid, isDeleted: false })

        if (!book) return res.status(404).send({ status: false, message: "Sorry! No book found Or Book may be deleted" })

        let review = await reviewModel.find({ bookId: bookid, isDeleted: false })
        const bookData = book.toObject() // to convert into mongoose object
        bookData["reviewsData"] = review

        return res.status(200).send({ status: true, message: "Book List", data: bookData })
    }

    catch (err) {
        res.status(500).send({ status: false, error: err.message })
    }

}








//========================================== update books =====================================================

const updateBooks = async function (req, res) {
    try {
        const bookId = req.params.bookId
        let { title, excerpt, releasedAt, ISBN } = req.body
        //======================= if invalid book id ==========================================
        if (!mongoose.Types.ObjectId.isValid(bookId)) {
            return res.status(400).send({ status: false, message: "Invalid Book Id" })
        }
        //=========================== if bodydata is empty =======================================
        if(Object.keys(req.body).length === 0){
            return res.status(400).send({ status: false, message: "Body cannot be empty" })
        }
        //============================== if title already exist =====================================
        let checkTitle = await booksModel.findOne({ title: title })
        if (checkTitle) {
            return res.status(400).send({ status: false, message: "Title already used" })
        }
        //======================== invalid format of ISBN =======================================
        if (!isValidISBN13(ISBN)) {
            return res.status(400).send({ status: false, message: "Please provide correct format for ISBN" })
        };
        //================================ if ISBN already exist =====================================
        let checkISBN = await booksModel.findOne({ ISBN: ISBN })
        if (checkISBN) {
            return res.status(400).send({ status: false, message: "ISBN already used" })
        }
        //============================== valid format of releasedAt ====================================
        if (!isValidDate(releasedAt)) {
            return res.status(400).send({ status: false, message: "releasedAt is in incorrect format (YYYY-MM-DD)" })
        }
        //========================== check of blogid exist =======================================
        const findBook = await booksModel.findOne({ _id: bookId })
        if (findBook) {
            const updateBooks = await booksModel.findOneAndUpdate({ _id: bookId, isDeleted: false }, { title: title, excerpt: excerpt, releasedAt: releasedAt, ISBN: ISBN }, { new: true })
            return res.status(200).send({ status: true, message: "Book updated", data: updateBooks })
        }
        else {
            return res.status(404).send({ status: false, message: "BookId does not exist" })
        }
    }
    catch (err) {
        res.status(500).send({ status: false, error: err.message })
    }
}






module.exports = { createBooks, getBooks, getBookById, updateBooks }