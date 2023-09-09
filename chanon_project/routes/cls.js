const express = require("express");
const router = express.Router();

// Define a GET route for the root path ('/')
router.get('/', async (req, res) => {
    try {
        // Generate a random number between 0 and 3 (inclusive)
        const randomNumber = Math.floor(Math.random() * 4);

        // Send a JSON response with a status code of 200 and the random number in the 'data' property
        console.log(randomNumber);
        return res.status(200).json({
            data: randomNumber
        });
    } catch (error) {
        // If an error occurs during execution, send a JSON response with a status code of 500 and the error message
        return res.status(500).json({
            message: error
        });
    }
});

module.exports = router;
