const jwt = require('jsonwebtoken')
const mongoose = require("mongoose")
const booksModel = require("../models/booksModel")


//-------------------------------------------------[authentication]----------------------------------------------------------------

const authentication = function (req, res, next) {
    try {
        let token = req.headers["x-api-key"]
        if (!token) {
            return res.status(401).send({ status: false, message: "Please provide a token" })
        }

        jwt.verify(token, "secretKey", function (err, decodedToken) {
            if (err && err.message == "jwt expired") {
                return res.status(401).send({ status: false, message: "Session expired! Please login again." })
            }
            if (err) {
                return res.status(401).send({ status: false, message: "Incorrect token" })
            }
            else {
                req.token = decodedToken.userId
                next()
            }
        })
    } 
    catch (error) {
        return res.status(500).send({ status: false, message: error.message })
    }
}


//---------------------------------------------------[authorisation]-----------------------------------------------------------------------

const authorisation = async function (req, res, next) {
    try {
        let bookid = req.params.bookId
        let validUser = req.token // userid from token

        if (!mongoose.isValidObjectId(bookid)) {
            return res.status(400).send({ status: false, message: "Invalid Format of Book Id" })
        }

        let book = await booksModel.findById(bookid)
        if (book) {
            let user = book.userId.toString() //userId from book
            if (user !== validUser) {
                return res.status(403).send({ status: false, message: "Sorry! Unauthorized User" })
            }

            next()
        }
        else{
            return res.status(404).send({ status: false, message: "Book not found or BookId does not exist" })
        }
    }
    catch (err) {
        res.status(500).send({ status: false, error: err.message })
    }
}



module.exports = { authentication, authorisation }