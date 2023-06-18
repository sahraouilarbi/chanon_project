const express = require("express");
const router = express.Router();



router.get('/', async (req, res) => {
    try {
        console.log('data');
    const randomNumber = Math.floor(Math.random() * 4);
        return res.status(200).json({
            data:randomNumber
        })

    } catch (error) {
        return res.status(500).json({
            message: error
        })
    }
});

module.exports = router;
