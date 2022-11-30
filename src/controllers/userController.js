const userModel = require("../models/userModel")
const { isValidBody, isValidEmail, isValidName, isValidPassword, isvalidPhone, isvalidPincode, isValid } = require("../validation/validator");
const jwt = require('jsonwebtoken')





//-------------------------------------- [user creation] --------------------------------------------------

const createUser = async function (req, res) {
    try {
        let data = req.body;
        let { name, phone, email, password, title, address } = data;

       
        if (!isValidBody(data)) {
            return res.status(400).send({ status: false, msg: "Request body cannot be empty" });
        }
        
        if (!name || !isValidName(name) || !isValid(name)) {
            return res.status(400).send({ status: false, message: "Name is required in a string format length should be 2 to 10" })
        }
        req.body.name = name.replace(/\s+/g, ' ')

        
        if (!title) {
            return res.status(400).send({ status: false, message: "Title is mandatory" })
        }
        if (title) {
            if ((["Mr", "Mrs", "Miss"].indexOf(title.trim()) == -1)) {
                return res.status(400).send({ status: false, msg: `Title is required in given format, format: "Mr","Mrs" or "Miss` });
            }
        }
        
        if (!email || !isValidEmail(email.trim())) {
            return res.status(400).send({ status: false, msg: "email is required in a valid format" });
        }
       
        let inputEmail = await userModel.findOne({ email: email });
        if (inputEmail) {
            return res.status(400).send({ status: false, msg: `${email} is already registered` });
        }
        
        if (!password || !isValidPassword(password)) {
            return res.status(400).send({ status: false, msg: "Password is required with these conditions: at least one upperCase, lowerCase letter, one number and one special character" });
        }
        
        if (!phone || !isvalidPhone(phone)) {
            return res.status(400).send({ status: false, message: "phone no. is required in a string format length should be of 10" });
        }
       
        let inputPhone = await userModel.findOne({ phone: phone });
        if (inputPhone) {
            return res.status(400).send({ status: false, msg: `${phone} is already registered ` });
        }
       
        if (address && typeof address != "object") {
            return res.status(400).send({ status: false, message: "Address is in wrong format" })
        };

        if (address && address.pincode && !isvalidPincode(address.pincode)) {
            return res.status(400).send({ status: false, message: "Pincode is in wrong format" })
        };
           
        let Users = await userModel.create(data)
        res.status(201).send({ status: true, data: Users });
    }
    catch (error) {
        res.status(500).send({ status: false, message: error.message });
    }
};





//-----------------------------------------------[user login] --------------------------------------------------------

const userLogin = async function (req, res) {
    try {
        let data = req.body
        const { email, password } = data
       
        if (Object.keys(data).length == 0) {
            return res.status(400).send({ status: false, message: "Body can't be empty! Please Provide Data" })
        }
      
        if (!email) {
            return res.status(400).send({ status: false, message: "Please provide Email to login" })
        }
        if (!isValidEmail(email.trim())) {
            return res.status(400).send({ status: false, msg: "invalid email format" });
        }
       
        if (!password) {
            return res.status(400).send({ status: false, message: "Please provide Password to login" })
        }
        if (!isValidPassword(password)) {
            return res.status(400).send({ status: false, msg: "invalid password format" });
        }
        
        const findUser = await userModel.findOne({ email: email, password: password })
        if (!findUser)
            return res.status(401).send({ status: false, message: "Invalid email or Password" })

        
        let token = jwt.sign({ userId: findUser._id }, "secretKey", { expiresIn: '24h' })
        let decode = jwt.decode(token, "secretKey")
 

        res.status(201).send({ status: true, message: "User logged in Successfully", data: token })
    }

    catch (err) {
        res.status(500).send({ status: false, message: err.message })
    }
}



module.exports = { createUser, userLogin }
