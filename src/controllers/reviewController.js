const { default: mongoose } = require("mongoose")
const booksModel = require("../models/booksModel")
const reviewModel = require("../models/reviewModel")
const { isValid } = require("../validation/validator")


//------------------------------------- [creating review] --------------------------------------------------


const createReview = async function (req, res) {
    try {
        let data = req.body
        const bookId = req.params.bookId;
        data.bookId = bookId
        const { review, rating, reviewedBy } = data
        
        if (!mongoose.isValidObjectId(bookId)) {
            return res.status(400).send({ status: false, message: "Invalid Book Id" })
        }
        
        if (Object.keys(req.body).length == 0) {
            return res.status(400).send({ status: false, message: "Body can't be empty! Provide Data to create review" })
        }
        
        if (!review) {
            return res.status(400).send({ status: false, message: "Review is mandatory" })
        }
        
        if (review) {
            if (!isValid(review)) return res.status(400).send({ status: false, message: "Review is in Invalid Format" })
            req.body.review = review.replace(/\s+/g, ' ')
        }
       
        if (!rating) {
            return res.status(400).send({ status: false, message: "Rating is mandatory" })
        }
        
        if (rating) {
            if (!(typeof rating == "number")) {
                return res.status(400).send({ status: false, message: "Rating should be a number" })
            }

            if (Number.isInteger(rating)) {
                if (rating < 1 || rating > 5) {
                    return res.status(400).send({ status: false, message: "Rating can only be 1,2,3,4,5" })
                }
            }
            else {
                return res.status(400).send({ status: false, message: "Rating can be only Integer and Whole Number" })
            }
        }
        
        if (!reviewedBy) {
            req.body.reviewedBy = "Guest"
        }

        if (reviewedBy) {
            if (!isValid(reviewedBy)) {
                return res.status(400).send({ status: false, message: "Your name is in Invalid Format" })
            }
            req.body.reviewedBy = reviewedBy.replace(/\s+/g, ' ')
        }
        
        const book = await booksModel.findOne({ _id: bookId,isDeleted:false })
        if (!book) {
            return res.status(404).send({ status: false, message: "Book not found or deleted" })
        }

        
        const newReview = await reviewModel.create(data)
        const obj = {
            _id: newReview._id,
            bookId: newReview.bookId,
            reviewedBy: newReview.reviewedBy,
            reviewedAt: newReview.reviewedAt,
            rating: newReview.rating,
            review: newReview.review
        }
        const addReview = await booksModel.findOneAndUpdate({ _id: bookId ,isDeleted:false}, { $inc: { reviews: 1 } }, { new: true }).lean()

      
        addReview["reviewsData"] = obj

        return res.status(201).send({ status: true, message: "Review Added", data: addReview })
    }
    catch (err) {
        res.status(500).send({ status: false, error: err.message })
    }
}








//========================================= [review updation] ===========================================

const updateReview = async function (req, res) {
    try {
        let bookId = req.params.bookId
        let reviewid = req.params.reviewId
        let data = req.body
        const { review, rating, reviewedBy } = data
       
        if (!mongoose.isValidObjectId(bookId)) {
            return res.status(400).send({ status: false, message: "Invalid Format of BookId" })
        }
       
        if (!mongoose.isValidObjectId(reviewid)) {
            return res.status(400).send({ status: false, message: "Invalid Format of ReviewId" })
        }
       
        if (Object.keys(data).length == 0) {
            return res.status(400).send({ status: false, message: "Please provide data to update book review" })
        }
        
        if (!(review || rating || reviewedBy)) {
            return res.status(400).send({ status: false, message: "Please enter Valid body to update review" })
        }

        
        let book = await booksModel.findOne({ _id: bookId }).lean()
        if (!book) {
            return res.status(404).send({ status: false, message: "Sorry! Book Not Found!" })
        }
        if (book.isDeleted == true) {
            return res.status(404).send({ status: false, message: "Book is Deleted. You cannot add/update review" })
        }
        
        let findreview = await reviewModel.findOne({ _id: reviewid })
        if (!findreview) {
            return res.status(404).send({ status: false, message: "Sorry! No such review found!" })
        }
        if (findreview.isDeleted == true) {
            return res.status(404).send({ status: false, message: "Review is Deleted. You cannot update review" })
        }

       
        if (review) {
            if (!isValid(review)) {
                return res.status(400).send({ status: false, message: "Review is in Invalid Format" })
            }
            req.body.review = review.replace(/\s+/g, ' ')
        }
        let reviews = req.body.review

       
        if (rating) {
            if (!(typeof rating == "number")) {
                return res.status(400).send({ status: false, message: "Rating should be a number" })
            }
            if (Number.isInteger(rating)) {
                if (rating < 1 || rating > 5) {
                    return res.status(400).send({ status: false, message: "Rating can only be 1,2,3,4,5" })
                }
            }
            else {
                return res.status(400).send({ status: false, message: "Rating can be only Integer and Whole Number" })
            }
        }

        
        if (reviewedBy) {
            if (!isValid(reviewedBy)) {
                return res.status(400).send({ status: false, message: "Your name is in Invalid Format" })
            }
            req.body.reviewedBy = reviewedBy.replace(/\s+/g, ' ')
        }
        let reviewedBys = req.body.reviewedBy

       
        if (bookId != findreview.bookId) {
            return res.status(403).send({ status: false, message: "You cannot update review of others books" })
        }

       
        if (bookId == findreview.bookId) {
            let updateReview = await reviewModel.findOneAndUpdate({ _id: reviewid,isDeleted:false }, { review: reviews, rating: rating, reviewedBy: reviewedBys, reviewedAt: new Date() }, { new: true })
            book["reviewsData"] = updateReview
            res.status(200).send({ status: true, message: "BookReview is updated", data: book })
        }
    }
    catch (err) {
        res.status(500).send({ status: false, error: err.message })
    }
}




//=========================================== [delete review] ===========================================

const deleteReview = async function (req, res) {
    try {

        let bookId = req.params.bookId
        let reviewId = req.params.reviewId
        
        if (!mongoose.isValidObjectId(bookId)) {
            return res.status(400).send({ status: false, message: "Invalid Format of BookId" })
        }
       
        if (!mongoose.isValidObjectId(reviewId)) {
            return res.status(400).send({ status: false, message: "Invalid Format of ReviewId" })
        }
       
        let book = await booksModel.findOne({ _id: bookId })
        if (!book) {
            return res.status(404).send({ status: false, message: "Sorry! Book Not Found!" })
        }
        if (book.isDeleted == true) {
            return res.status(400).send({ status: false, message: "Book is Deleted. You cannot delete review" })
        }
        
        let findreview = await reviewModel.findOne({ _id: reviewId })
        if (!findreview) {
            return res.status(404).send({ status: false, message: "Sorry! No such review found!" })
        }
        if (findreview.isDeleted == true) {
            return res.status(400).send({ status: false, message: "Review is Deleted. You cannot delete review" })
        }

        
        if (bookId != findreview.bookId) {
            return res.status(403).send({ status: false, message: "You cannot delete review of other books" })
        }

       
        if (bookId == findreview.bookId) {
            const deletereview = await reviewModel.findOneAndUpdate({ _id: reviewId ,isDeleted:false}, { isDeleted: true, })
            book.reviews -= 1
            await book.save();
            res.status(200).send({ status: true, message: "BookReview is Deleted" })
        }

    }
    catch (err) {
        res.status(500).send({ status: false, error: err.message })
    }
}




module.exports = { createReview, updateReview, deleteReview }
