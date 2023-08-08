const mongoose = require('mongoose');

const yearViewsSchema = new mongoose.Schema({
  year: { type: String, required: true },
  views_average: { type: String },
  notoriety: {type: String}
});

const languageSchema = new mongoose.Schema({
  numpivot: { type: String, 
  //  required: true 
  },
  nbrauthores: { type: String },
  extlink: { type: String, 
  //  required: true 
  },
  hists: { type: String, 
  //  required: true 
  },
  sizedata: { type: String },
  pagerankwiki: { type: String },
  frenq: { type: String, 
  //  required: true 
  },
  wikilink: { type: String, 
  //  required: true 
  },
  date: { type: String, 
  //  required: true 
  },
  lng: { type: String, required: true },
  type: { type: String },
  year_views: [yearViewsSchema]
});

const chanonproSchema = new mongoose.Schema({
  labelprolexme: {type: String, required: true, unique: true},
    arabic: { type: languageSchema },
    french: { type: languageSchema },
    english: { type: languageSchema },
    polish: { type: languageSchema }
  }
);

module.exports = mongoose.model('chanonpro', chanonproSchema);


// const chanonproSchema = new mongoose.Schema({
//     labelprolexme: {
//         type: String,
//         required: true
//     },
//     numpivot: {
//         type: String,
//         required: true
//     },
//     nbrauthores: {
//         type: String,
//         //required: true
//     },
//     extlink: {
//         type: String,
//         required: true
//     },
//     hists: {
//         type: String,
//         required: true
//     },
//     sizedata: {
//         type: String,
//         //required: true
//     },
//     pagerankwiki: {
//         type: String,
//         //required: true
//     },
//     frenq: {
//         type: String,
//         required: true
//     },
//     wikilink: {
//         type: String,
//         required: true
//     },
//     date: {
//         type: String,
//         required: true
//     },
//     lng: {
//         type: String,
//         required: true
//     },
//     type: {
//         type: String,
//         //required: true
//     },
//     year_views:[
//         {
//             year:{type:String, unique: true},
//             views_average:{type:String}
//         }],
// })