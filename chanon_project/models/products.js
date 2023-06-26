const mongoose = require('mongoose');

const chanonproSchema = new mongoose.Schema({
    labelprolexme: {
        type: String,
        required: true
    },
    numpivot: {
        type: String,
        required: true
    },
    nbrauthores: {
        type: String,
        //required: true
    },
    extlink: {
        type: String,
        required: true
    },
    hists: {
        type: String,
        required: true
    },
    sizedata: {
        type: String,
        //required: true
    },
    pagerankwiki: {
        type: String,
        //required: true
    },
    frenq: {
        type: String,
        required: true
    },
    wikilink: {
        type: String,
        required: true
    },
    date: {
        type: String,
        required: true
    },
    lng: {
        type: String,
        required: true
    },
    type: {
        type: String,
        //required: true
    },
})


module.exports = mongoose.model('chanonpro', chanonproSchema);