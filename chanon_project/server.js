const express = require('express');
const request = require('request');
const cheerio = require('cheerio');
const fs = require('fs');
const axios = require('axios');
// var mysql = require('mysql');
const cors = require('cors');
const mysql = require('mysql2/promise');
const mongoose = require('mongoose');
const { setDefaultHighWaterMark } = require('stream');
const histo = require('./models/products');
const cls = require('./routes/cls');
const { databaseNames, tableNames, columnNames, languageMap } = require('./constants');
const app = express();
const PORT = 5000;
const dbHost = 'localhost';
const dbUser = 'root';
const dbPassword = 'root';

// mongoDB
mongoose.connect("mongodb://localhost:27017/chanonpro");
const db = mongoose.connection;
db.on('error', (error) => console.log('### db.connect - error :', error));
db.once('open', () => console.log('### db.once : connected'));

app.use(express.json());
app.use(cors());

const logStream = fs.createWriteStream('logs.txt', { flags: 'a' });

// Create a function to get the database name based on the selected language
function getDatabaseName(language) {
    return databaseNames[language] || '';
}

// Create a function to get the database table name based on the selected language
function getDatabaseTableName(language) {
    return tableNames[language] || '';
}

// Create a function to get the database table name based on the selected language
function getDatabaseTableNameColumnName(databaseTableName) {
    return columnNames[databaseTableName] || '';
}
  
// middleware to log each request to the file
/**
 * @param {import('next').NextApiRequest} req
 * @param {import('next').NextApiResponse} res
 */
app.use((req, res, next) => {
    const now = new Date();
    const log = `${now}: ${req.method} ${req.path}\n`;
    const language = req.query['lng'];
    const databaseName = getDatabaseName(language);

    // Create a MySQL connection pool
    const pool = mysql.createPool({
        host: dbHost,
        user: dbUser,
        password: dbPassword,
        database: databaseName,
        connectionLimit: 10, // Adjust the connection limit as per your requirements
    });

    req.db = pool;
    
    // logStream.write(log);
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
});

// Methods in JavaScript, such as get, post, and use, are functions that define different routes and behaviors for handling HTTP requests in the Express.js framework.

// get all label prolexem
// app.get('/fetch-all-data', ...) defines a route that handles a GET request to fetch all data from the MongoDB collection using the histo model.
/**
 * @param {import('next').NextApiRequest} req
 * @param {import('next').NextApiResponse} res
 */
app.get('/fetch-all-data', async (req, res) => {

    try {
        const query = await histo.find();

        return res.status(200).json({
            data: query
        })
    } catch (err) {
        return res.status(500).json({
            message: err
        })
    }
});

// app.get('/filter', ...) defines a route that handles a GET request to filter data based on the provided query parameters (labelprolexme and lng).
/**
 * @param {import('next').NextApiRequest} req
 * @param {import('next').NextApiResponse} res
 */
app.get('/filter', async (req, res) => {

    const { labelprolexme, lng, year } = req.query;
    const currentDate = new Date();
    const currentTime = currentDate.toLocaleString();
    
    try {

        const query_size = await histo.find();
        
        // voir si le produit existe dans mongodb
        const query = await histo.find({
            "labelprolexme": labelprolexme
        });
        
        function getFieldForLanguage(language) {
            return languageMap[language] || '';
        }

        const fieldForLanguage = getFieldForLanguage(lng);
        
        let msg;
        if (query.length === 0) {
            
            // Le produit n'existe pas dans la base mongodb
            
            const db = req.db;
            
            const dbTableName = getDatabaseTableName(lng);

            const dbTableNameColumnName = getDatabaseTableNameColumnName(dbTableName);

            results = await db.query(`SELECT * FROM ${dbTableName} where ${dbTableNameColumnName} = '${labelprolexme}'`); 

            if (results.length === 0) {
                console.log('Fetch data ...')
                const [
                    response_nbrContri,
                    response_sizeItm,
                    response_nbrInterLink,
                    response_nbrExtrLink,
                    response_crtFive,
                    responseCal,
                ] = await Promise.all([
                    axios.get(`http://localhost:5000/api/nbr-contributors?name=${labelprolexme}&lng=${lng}`),
                    axios.get(`http://localhost:5000/api/size-item?name=${labelprolexme}&splt=${splt}&lng=${lng}`),
                    axios.get(`http://localhost:5000/api/nbr-internal-links?name=${labelprolexme}&lng=${lng}`),
                    axios.get(`http://localhost:5000/api/nbr-external-links?name=${labelprolexme}&lng=${lng}`),
                    axios.get(`http://localhost:5000/api/crt-five?name=${labelprolexme}&lng=${lng}&year=${year}`),
                    axios.get(`http://localhost:5000/api/cls`),
                ]);

                if (
                    ![
                        response_nbrContri,
                        response_sizeItm,
                        response_nbrInterLink,
                        response_nbrExtrLink,
                        response_crtFive,
                        responseCal,
                    ].every(res => res.status === 200) 
                ){
                    return res.status(500).json({error: 'Error fetching data - Server Error 500'});
                }

                // ### STEP A ###
                console.log('### app.get(filter) - STEP A : get nbr-Contributors');                    
                console.log('================================= Result =======================================');
                console.log('### app.get(filter) - result  : ', response_nbrContri.data);
                console.log('### app.get(filter) - result splt  : ', response_nbrContri.data.splt);
                console.log('### app.get(filter) - result sumD  : ', response_nbrContri.data.sumD);
                console.log('### app.get(filter) - result size : ', response_nbrContri.data.size);
                console.log('### app.get(filter) - result data : ', response_nbrContri.data.data);
                console.table(response_nbrContri.data.data);
                //var splt = response_nbrContri.data.splt;
                var splt = Object.keys(response_nbrContri.data.data.query.pages)[0];
                
                // ### STEP A ###
                console.log('### app.get(filter - STEP B : get size-item');
                console.log('================================= Result =======================================');
                console.log('### app.get(filter) - response : ', response_sizeItm.data);
                console.log('### app.get(filter) - result data : ', response_sizeItm.data.data);
                //console.log('### app.get(filter) - result page id : ', response_sizeItm.data.data.query.pages[splt]);
                const _responseSizeItmPageIdNode = Object.keys(response_sizeItm.data.data.query.pages)[0];
                const _responseSizeItmPageId = _responseSizeItmPageIdNode != -1 ? response_sizeItm.data.data.query.pages[_responseSizeItmPageIdNode].pageid : null;
                const responseSizeItmREvisionsSize = _responseSizeItmPageId ? response_sizeItm.data.data.query.pages[_responseSizeItmPageId].revisions[0].size : 0;
                console.log('### app.get(filter) - result page id  : ', _responseSizeItmPageId);
                console.log('### app.get(filter) - result size : ', _responseSizeItmPageIdNode != -1 ?  responseSizeItmREvisionsSize : 0);
                
                // ### STEP C ###
                console.log('### app.get(filter) - STEP C : get nbr-internal-links');
                console.log('================================= Result =======================================');
                console.log('### app.get(filter) - response : ', response_nbrInterLink);
                console.log('### app.get(filter) - response data  : ', response_nbrInterLink.data);
                console.log('### app.get(filter) - response data sum: ', response_nbrInterLink.data.sum);
                console.log('### app.get(filter) - response data size: ', response_nbrInterLink.data.size);
                console.table(response_nbrInterLink.data.data.query.backlinks);
                console.log(response_nbrInterLink.status);
                                    
                // ### STEP D ###
                console.log('### app.get(filter) - STEP D : get nbr-external-links');
                console.log('================================= Result =======================================');
                console.log('### app.get(filter) - response : ', response_nbrExtrLink);
                console.log('### app.get(filter) - response data : ', response_nbrExtrLink.data);
                console.table(response_nbrExtrLink.data);
                console.log('### app.get(filter) - response data size : ', response_nbrExtrLink.data.size);
                console.log('### app.get(filter) - response status : ', response_nbrExtrLink.status);
            
                // ### STEP E ###
                // console.log('qrt five');
                console.log('### app.get(filter) - STEP E : get crt-five');
                console.log('================================= Result =======================================');
                console.log('### app.get(filter) -  crt five : ', response_crtFive);
                console.log('### app.get(filter) -  crt five data : ', response_crtFive.data.datasiz);
                console.table(response_crtFive.data.datasiz);
                // console.table(response_crtFive.data);
                console.log('### app.get(filter) - crt five sumTotale: ', response_crtFive.data.sumTotale);
                console.log('### app.get(filter) - crt five size: ', response_crtFive.data.size);
                console.log('### app.get(filter) - crt five rowHist: ', response_crtFive.data.rowofhits);
                console.log('### app.get(filter) - crt five : histVal', response_crtFive.data.hitsValue);
                console.log('### app.get(filter) - crt five moyenneViews', response_crtFive.data.moyenneViews);
                console.log('### app.get(filter) - crt five status', response_crtFive.status);
                
                const casl = await axios.post(`http://localhost:5000/api/additive_wighting`, {
                    normTable: response_crtFive.data.rowofhits,
                    wight: response_crtFive.data.sumTotale
                });
                
                // console.log('cal : ', cal);
                console.log('### app.get(filter) - notority : ', responseCal.data.data);

                console.log('### newProduct : start insert');
        
                const addProduct = new histo({
                    labelprolexme: labelprolexme,
                    [fieldForLanguage]: {
                        numpivot: '',
                        nbrauthores: `${response_nbrContri.data.sumD}`,
                        extlink: `${response_nbrExtrLink.data.size}`,
                        hists: `${response_crtFive.data.hitsValue}`,
                        sizedata: `${responseSizeItmREvisionsSize}`,
                        pagerankwiki: `${response_crtFive.data.sumTotale}`,
                        frenq: `${responseCal.data.data}`,
                        wikilink: `https://${lng}.wikipedia.org/wiki/${labelprolexme}`,
                        date: currentTime,
                        lng: lng,
                        type: 'from web',
                        year_views: [
                            {
                                year: `${year}`,
                                views_average: `${response_crtFive.data.moyenneViews}`,
                                notoriety: responseCal.data.data != 0 ? `${responseCal.data.data}` : '3'
                            }
                        ],
                    } 
                });
        
                const newProducts = await addProduct.save();
                console.log('### newProducts : end insert');
                
                return res.status(200).json({
                    data: query,
                    messA: 'test',
                    newD: query_size.length,
                    // oldD: result_size.length
                })
            } else {

                // Choose the correct table
                const dbTableColunm = lng === 'fr' ? 'LABEL_ALIAS' : 'WIKIPEDIA_LINK';

                // Get the result from db
                const resultat = await db.query(`SELECT * FROM ${dbTableName} WHERE ${dbTableColunm} = '${labelprolexme}'`);
                const obgResult = resultat[0][0];

                const addProduct = new histo({
                    labelprolexme: obgResult.LABEL_PROLEXEME != null ? obgResult.LABEL_PROLEXEME : '',
                    [fieldForLanguage]: {
                        numpivot: obgResult.NUM_PIVOT != null ? obgResult.NUM_PIVOT : '',
                        nbrauthores: '',
                        extlink: obgResult.WIKIPEDIA_LINK != null ? obgResult.WIKIPEDIA_LINK : '',
                        hists: obgResult.SORT != null ? obgResult.SORT : '',
                        sizedata: '',
                        pagerankwiki: '',
                        frenq: obgResult.NUM_FREQUENCY != null ? obgResult.NUM_FREQUENCY : '3',
                        wikilink: `https://${lng}.wikipedia.org/wiki/${labelprolexme}`,
                        date: currentTime,
                        lng: lng,
                        type: 'mysql',
                        year_views: [
                            {
                                year: `${year}`,
                                views_average: '',
                                notoriety: obgResult.NUM_FREQUENCY != null ? obgResult.NUM_FREQUENCY : '3'
                            }
                        ],
                    }
                });

                //const newProducts = await addProduct.save();
                await addProduct.save();
            }

            return res.status(200).json({
                data: query,
                messB: 'test',
            })
        } else if (!query[0][fieldForLanguage]){
                // Le produit existe dans mongodb
    
                // Voir si le produit exist dans la langue selectionnée
                
                console.log('labelprolexme does not exist in the selected language :', labelprolexme, fieldForLanguage);
                
                // Fetch data
                console.log('Fetch data ...');
                const [
                    responseNbrContri,
                    responseSizeItm,
                    responseNbrInterLink,
                    responseNbrExtrLink,
                    responseCrtFive,
                    responseCal
                ] = await Promise.all([
                    axios.get(`http://localhost:5000/api/nbr-contributors?name=${labelprolexme}&lng=${lng}`),
                    axios.get(`http://localhost:5000/api/size-item?name=${labelprolexme}&lng=${lng}`),
                    axios.get(`http://localhost:5000/api/nbr-internal-links?name=${labelprolexme}&lng=${lng}`),
                    axios.get(`http://localhost:5000/api/nbr-external-links?name=${labelprolexme}&lng=${lng}`),
                    axios.get(`http://localhost:5000/api/crt-five?name=${labelprolexme}&lng=${lng}&year=${year}`),
                    axios.get(`http://localhost:5000/api/cls`)
                ]);

                console.log('Fetched data OK');

                // Handle errors
                if(
                    ![
                        responseNbrContri, 
                        responseSizeItm, 
                        responseNbrInterLink, 
                        responseNbrExtrLink,
                        responseCrtFive,
                        responseCal
                    ].every(res => res.status === 200)
                ) {
                    return res.status(500).json({error: 'Error fetching data - Server Error 500'});
                }

                const nbrContri = responseNbrContri.data.size;
                console.log('@ nbrContri ->',nbrContri);
                console.log('----------------------------------------------');

                const sizeItm = responseSizeItm.data.size;
                console.log('@ sizeItm ->',sizeItm);
                console.log('----------------------------------------------');

                
                console.log('@ responseNbrInterLink ->',responseNbrInterLink.data.size);
                console.log('----------------------------------------------');

                const nbrExtrLink = responseNbrExtrLink.data.size;
                console.log('@ nbrExtrLink ->',nbrExtrLink);
                console.log('----------------------------------------------');
                
                const crtFiveHitsValue = `${responseCrtFive.data.hitsValue}`;
                console.log('@ crtFiveHitsValue ->',crtFiveHitsValue);
                console.log('----------------------------------------------');

                const crtFiveSumTotale = responseCrtFive.data.sumTotale;
                console.log('@ crtFiveSumTotale ->',crtFiveSumTotale);

                const crtFiveMoyenneViews = responseCrtFive.data.moyenneViews;
                console.log('@ crtFiveMoyenneViews ->',crtFiveMoyenneViews);
                console.log('----------------------------------------------');

                const cal = responseCal.data.data;
                console.log('@ cal ->',cal);
                console.log('----------------------------------------------');
                
                // Créer l'enregistrement language
                try  {
                    const newEntry = {
                            numpivot: '',
                            nbrauthores: nbrContri,
                            extlink: nbrExtrLink,
                            hists: crtFiveHitsValue,
                            sizedata: sizeItm,
                            pagerankwiki: crtFiveSumTotale,
                            frenq: cal != 0 ? `${cal}` : '3',
                            wikilink: `https://${lng}.wikipedia.org/wiki/${labelprolexme}`,
                            date: currentTime,
                            lng: lng,
                            type: '',
                            year_views: [
                                {
                                    year: `${year}`,
                                    views_average: crtFiveMoyenneViews,
                                    notoriety: cal != 0 ? `${cal}` : '3'
                                }
                            ], 
                    }

                    const update = {
                        $set: {
                            [fieldForLanguage]: newEntry
                        }
                    }

                    const productId = query[0]._id;
                    
                    console.log('start adding new entry ...');
                    
                    const addNewEntry = await histo.findOneAndUpdate(
                        { _id: productId }, 
                        update
                    );

                    console.log('---');
                    console.log(addNewEntry);
                    console.log('---');
                    if (!addNewEntry){
                        return res.status(404).json({error: 'Record not found'});
                    }
                    console.log('new entry added');
                    const updateProduct = await histo.findById(productId);
                    console.log('product updated', updateProduct);
                    res.status(200).json(updateProduct);

                } catch(err) {
                    console.error(err);
                    res.status(500).json(err);
                }
                

            } else {
            
            // Get year_views array
            const yearViews = query[0][fieldForLanguage].year_views;
            
            // Check if year entry exist
            const yearEntry = yearViews.find(y => y.year === year);

            // update Product Year
            const productId = query[0]._id;
            
            const filter = {
                _id: productId,
                //'year_views.year': year,
                [`${fieldForLanguage}.year_views.year`]: year,
            };

            const [
                response_crtFive,
                cal
            ] = await Promise.all([
                await axios.get(`http://localhost:5000/api/crt-five?name=${labelprolexme}&lng=${lng}&year=${year}`),
                await axios.get(`http://localhost:5000/api/cls`)
            ]);

            if (
                ![
                    response_crtFive,
                    cal
                ].every(res => res.status === 200)
            ){
                return res.status(500).json({error: 'Error fetching data - Server Error 500'});
            }
           
            const update = {
                $set: {
                    //'year_views.$.views_average': `${response_crtFive.data.moyenneViews}`,
                    [`${fieldForLanguage}.year_views.$.views_average`]: `${response_crtFive.data.moyenneViews}`,
                }
            }

            if (!yearEntry) {
                // Year doesn't exist, add it
                
                try {

                    // Add new entry
                    const newEntry = {
                        year: `${year}`,
                        views_average: `${response_crtFive.data.moyenneViews}`,
                        notoriety: cal.data.data != 0 ? `${cal.data.data}` : '3'
                    };
                    const yearViewsPath = `${fieldForLanguage}.year_views`;
                    const addNewEntry = await histo.findByIdAndUpdate(
                        productId,
                        { $push: {[yearViewsPath]: newEntry} },
                        { new: true },
                    );
                    if (!addNewEntry) {
                        return res.status(404).json({error: 'Record not found'});
                    }

                    const updateProduct = await histo.findById(productId);
                    res.status(200).json(updateProduct);
                    
                } catch(err){
                    res.status(500).json({error: '@02-01 - Server Error 500'});
                }

            } else {
                try{
                    // Year exist, update it
                    console.log('@@ update existing year entry');
    
                    const updateProduct = await histo.findOneAndUpdate(
                        filter, 
                        { $set: { "year_views.$[selectedYear]" : update} },
                        { arrayFilters: [ { "selectedYear" : year } ] }
                    );
                    if (updateProduct.nModified === 0) {
                        return res.status(404).json({error: 'Record not found'});
                    }
                    res.status(200).json(updateProduct);
                } catch(err){
                    res.status(500).json({error: '@02-02 - Server Error 500'});
                }
            }
            
        }
    } catch (err) {
        console.error(err);
        return res.status(500).json({message: err});
    }
});


// add new labelprolexem
// app.post('/addhisto', ...) defines a route that handles a POST request to add a new entry to the histo collection in MongoDB.
/**
 * @param {import('next').NextApiRequest} req
 * @param {import('next').NextApiResponse} res
 */
app.post('/addhisto', async (req, res) => {
    const currentDate = new Date();
    const currentTime = currentDate.toLocaleString();
    const addProduct = new histo({
        labelprolexme: `AbdelKadar`,
        numpivot: `1552`,
        nbrauthores: `1200`,
        extlink: `1253`,
        hists: `1230`,
        sizedata: `500`,
        pagerankwiki: `454652`,
        frenq: `3`,
        wikilink: 'www.Paris.frWikiLinkTest',
        date: currentTime,
        lng: 'Fr'
    });

    try {
        const newProducts = await addProduct.save();
        console.log('### app.post(/addhisto)', newProducts);
        return res.status(201).json({
            data: newProducts
        })
    } catch (err) {
        return res.status(500).json({
            message: err
        })
    }

});


// app.get("/api/scrap", ...) defines a route that handles a GET request to scrape data from a Wikipedia page using the request and cheerio libraries.
/**
 * @param {import('next').NextApiRequest} req
 * @param {import('next').NextApiResponse} res
 */
app.get("/api/scrap", async (req, res) => {

    const { name, lng } = req.query;

    try {
        url = `https://${lng}.wikipedia.org/wiki/${name}`;
        const encodedURL = encodeURI(url);
        request(encodedURL, function (error, response, html) {
            if (!error) {
                const $ = cheerio.load(html);
                // For example:
                const title = $('table>tbody>tr').text();
                //console.log('### app.get(/api/scrap) - title : ', title);
                // logStream.write(title);
                res.send(title);
            }
        });
    } catch (err) {
        console.error('### app.get(/api/scrap) - error : ', err);
    }
});


// this function for calculate nbr of contributors
// app.get('/api/nbr-contributors', ...) defines a route that handles a GET request to calculate the number of contributors for a Wikipedia page using the Wikimedia API.
/**
 * @param {import('next').NextApiRequest} req
 * @param {import('next').NextApiResponse} res
 */
app.get('/api/nbr-contributors', async (req, res) => {
    const { name, lng } = req.query;

    try {
      //const response = await axios.get(`http://${lng}.wikipedia.org/w/api.php?action=query&titles=${name}&prop=contributors&pclimit=max&format=json&nonredirects&rawcontinue`);
        const response = await axios.get(`http://${lng}.wikipedia.org/w/api.php?action=query&titles=${name}&prop=contributors&pclimit=max&format=json&rawcontinue`);
        
        if (response.status === 200){

            let sumD = 0;

            const data = response.data;
    
            const pageId = Object.keys(data.query.pages)[0];
    
            const contributorsCount = pageId != -1 ? data.query.pages[pageId].contributors.length : 0;
    
            // console.log('### app.get(/api/nbr-contributors) - page id : ', response.data['query-continue'].contributors.pccontinue);
            // var splt = response.data['query-continue'].contributors.pccontinue.split('|')[0];
            // console.log('### app.get(/api/nbr-contributors) - after split : ', splt);
            // for (let dt of response.data.query.pages[splt].contributors) {
            //     sumD += dt['userid']
            // }
            
            // console.log('### app.get(/api/nbr-contributors) - sum data : ', sumD);
    
            res.send({
            //  "splt": splt,
                "splt": pageId,
            //  "sumD": sumD,
            //  "size": response.data.query.pages[splt].contributors.length,
                "size": contributorsCount,
            //  "data": response.data,
                "data": data,
            });

        }
        
    } catch (err) {
        //console.log(error);
        //res.status(500).send('@03 - Server Error 500');
        res.status(500).json({error: '@03 - Server Error 500'});
    }
});


// this function for extract item size
// app.get('/api/size-item', ...) defines a route that handles a GET request to extract the size of the query result from the histo collection in MongoDB.
/**
 * @param {import('next').NextApiRequest} req
 * @param {import('next').NextApiResponse} res
 */
app.get('/api/size-item', async (req, res) => {
    const { name, lng } = req.query;
    try {
        const response = await axios.get(`http://${lng}.wikipedia.org/w/api.php?action=query&prop=revisions&rvprop=size&format=json&titles=${name}&redirects`);

        const data = response.data;
        const pageId = Object.keys(data.query.pages)[0];
        const size = pageId != -1 ? data.query.pages[pageId].revisions[0].size : 0;

        // console.log("size item : ", name);
        res.send({
            // "size": response.data.query.pages[splt].revisions[0]['size'],
            "size": size,
            // "data": response.data,
            "data": data,
        });
    } catch (err) {
        //console.error('### app.get(/api/size-item) - Error : ', error);
        res.status(500).json({error: '@04 - Server Error 500'});
    }
});


// this function extract the number the internal links
/**
 * @param {import('next').NextApiRequest} req
 * @param {import('next').NextApiResponse} res
 */
app.get('/api/nbr-internal-links', async (req, res) => {
    const { name, lng } = req.query;

    try {
     // const response = await axios.get(`http://${lng}.wikipedia.org/w/api.php?action=query&list=backlinks&bllimit=max&bltitle=${name}&blfilterredir=nonredirects&format=json&raccontinue`);
        const response = await axios.get(`http://${lng}.wikipedia.org/w/api.php?action=query&list=backlinks&bllimit=max&bltitle=${name}&blfilterredir=nonredirects&format=json&rawcontinue`);
        let sum = 0;
        for (let dt of response.data.query.backlinks) {
            sum += dt['pageid']
        }
        res.send(
            {
                "sum": sum,
                "size": response.data.query.backlinks.length,
                "data": response.data,
            }
        );
    } catch (err) {
        console.error('### app.get(/api/nbr-internak-links - Error : )', err);
        res.status(500).json({error: '@05 - Server Error 500'});
    }
});


// this function extract the number the external links
/**
 * @param {import('next').NextApiRequest} req
 * @param {import('next').NextApiResponse} res
 */
app.get('/api/nbr-external-links', async (req, res) => {
    const { name, lng } = req.query;
    try {
     // const response = await axios.get(`http://${lng}.wikipedia.org/w/api.php?action=query&prop=extlinks&ellimit=max&bltitle=${name}&format=json&rawcontinue`);
        const response = await axios.get(`http://${lng}.wikipedia.org/w/api.php?action=query&prop=extlinks&ellimit=max&titles=${name}&format=json&rawcontinue`);
        const data = response.data;
        const pageId = Object.keys(data.query.pages)[0];

        const extlinks = pageId != -1 
            ? (data.query.pages[pageId].extlinks) 
                ? data.query.pages[pageId].extlinks
                :[]
            : [];
        const extlinksCount = extlinks.length;
        res.send({
            //"data": response.data,
            "data": data,
            //"size": response.data.limits.extlinks
            "size": extlinksCount
        });
    } catch (err) {
        //console.error('### app.get(/api/nbr-external-links) - Error : ',error);
        res.status(500).json({error: '@06 - Server Error 500'});
    }
});


// this function critare 5
// app.get('/api/crt-five', ...) defines a route that handles a GET request to retrieve data from the Wikimedia API and perform calculations on the data.
/**
 * @param {import('next').NextApiRequest} req
 * @param {import('next').NextApiResponse} res
 */
app.get('/api/crt-five', async (req, res) => {
    
    const { name, lng, year } = req.query;

    try {

        // const response = await axios.get(`https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article/${lng}.wikipedia/all-access/all-agents/${name}/monthly/2016010100/2022013100`);
        const response = await axios.get(`https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article/${lng}.wikipedia/all-access/all-agents/${name}/monthly/${year}010100/${year}123100`);

       // console.log('### app.get(/api/crt-five) - response.data : ', response.data);
        
        if ( response.status === 200 ){
            let size = response.data.items.length;
            var data = response.data.items;
            let rowofhits = [];
            let hitsValue = [];
            let sumHitV = 0;
            let sumHistV = 0;

            // calcul de la moyenne de views sur une année
            let sommeViews = 0;
            let moyenneViews = 0;

            for (let i = 0; i < size; i++) {
                let histV = data[i]['views'] * ((i + 1) / size);
                rowofhits.push(Math.round(histV));
                sumHitV += Math.round(histV);
                hitsValue.push(sumHitV);
                // Somme des views sur une année
                sommeViews += data[i]['views'];
            }
            moyenneViews = sommeViews / size            
            res.send({
                "datasiz": response.data.items,
                "sumTotale": sumHitV,
                "size": response.data.items.length,
                "rowofhits": rowofhits,
                "hitsValue": hitsValue,
                // moyenne des views sur une année
                "moyenneViews":moyenneViews,
            });
        } 
        
    } catch (err) {
        console.error(err.response.status);
        if ( err.response.status === 404 ){
            res.status(404).json({error: 'Not found'});
        } else {
            res.status(500).json({error: '@07 - Server Error 500'});  
        }
    }
});


// calculate_wightofcriteria
/**
 * @param {import('next').NextApiRequest} req
 * @param {import('next').NextApiResponse} res
 */
app.get('/api/wightofcriteria', async (req, res) => {
    try {
        let linkscount = 500;
        let sumauthoresNum = 227496101;
        let sumextlinks = 500;
        let sumlinkscount = 16481131;
        let sumhits = 6118485;
        let sumarticllength = 173855;

    } catch (error) {
        res.status(500).send('Error: ', error);
    }
});


// simple_additive_wighting
// app.post('/api/additive_wighting', ...) defines a route that handles a POST request to perform additive weighting calculations based on the provided request body parameters.
/**
 * @param {import('next').NextApiRequest} req
 * @param {import('next').NextApiResponse} res
 */
app.post('/api/additive_wighting', async (req, res) => {
    const { normTable, wight } = req.body
    console.log('norm Table : ', normTable);
    try {
        const cls = await axios.get(`http://localhost:5000/api/cls`);
        // console.log('@ saw : ', cls);
        // console.log('# saw : ', cls.data.data);
        // const ntr = cls
        res.send('cls');

        var c = normTable.length;
        var w = [];

        for (let m = 0; m < c; m++) {
            let wsm = 0;
            for (let l = 0; l < 5; l++) {
                wsm += (wight[l]) * (normTable[m][l]);
                w.push(wsm);
            }
        }

    } catch (err) {
        //console.log(error);
        res.status(500).json({error: '@08 - Server Error 500'});
    }
});


// connection with mysql database
/**
 * @param {import('next').NextApiRequest} req
 * @param {import('next').NextApiResponse} res
 */
app.get('/api/fetch', async (req, res) => {
    const db = req.db;

    db.query(`SELECT * FROM alias_fra`, (err, results) => {
        if (err) {
            //console.error('### app.get(/api/fetch) - Error executing query:', err);
            return res.status(500).json({error: '@09 - Server Error 500'});
        }

        res.send(results);
    });


    // try {
    //     connection.connect();
    //     connection.query('SELECT * FROM alias_fra', function (error, results, fields) {
    //         if (error) throw error;
    //         console.log('The solution is: ', results);
    //         res.send(results);
    //     });
    //     connection.end(function (err) {
    //         if (err) {
    //             console.error('Error closing the connection: ', err);
    //         } else {
    //             console.log('Connection closed successfully.');
    //         }
    //     });
    // } catch (error) {
    //     console.error(error);
    //     res.status(500).send('Server Error #09');
    // }
});

/**
 * @param {import('next').NextApiRequest} req
 * @param {import('next').NextApiResponse} res
 */
app.get('/api/classification', async (req, res)=>{

    const { language, type, year } = req.query; // Extract the language and year query parameters

    const query = {};

    function getFieldForLanguage(language) {
        return languageMap[language] || '';
    }

    let fieldForLanguage = '';
    
    if (language) {
        fieldForLanguage = getFieldForLanguage(language);
        const lngPath = `${fieldForLanguage}.lng`;
        query[lngPath] = language;
        
        if (type) {
            const typePath = `${fieldForLanguage}.type`;
            query[typePath] = type;
        }
        
        if (year) {
            const yearPath = `${fieldForLanguage}.year_views.year`;
            query[yearPath] = year;
        }
    }
    
    try{
        
        // Construct the query object based on provided parameters
        
        const data = await histo.find(query)
        .sort({notoriety: -1})
        .lean()
        .exec();
        
        //const notoriety = data[0][fieldForLanguage].year_views.find(obj => obj.year === year).notoriety;
        
        return res.status(200).json({ data: data });

    } catch(err){
        if(!language){
            return res.status(400).json({error: 'Language required'});
        }

        if(err.kind === 'ObjectId'){
            return res.status(400).json({error: 'Invalid ID'});
        }
        
        res.status(500).json({message: err});
    }
});

/**
 * @param {import('next').NextApiRequest} req
 * @param {import('next').NextApiResponse} res
 */
app.get('/api/getrecordbyid', async (req, res) => {
    const { id, lng } = req.query;

    function getFieldForLanguage(language) {
        return languageMap[language] || '';
    }
    let record;
    let yearViewsInRecord;
    try {
        
        if (id) {
            record = await histo.findById(id);
        }

        if (lng) {
            const fieldForLanguage = getFieldForLanguage(lng);
            yearViewsInRecord = record[fieldForLanguage].year_views;
        }
        

        if (yearViewsInRecord.length > 0) {
            // Sort by year in 'asc' order
            const yearViewsInRecordSorted = yearViewsInRecord.sort((a,b)=>a.year - b.year);

            // Send res status and data
            res.status(200).json({ data:yearViewsInRecordSorted });
        } else if (yearViewsInRecord.length === 0) {
            res.status(404).json({error: 'No records found'});
        }
    } catch (err) {
        res.status(500).json({
            error: '@10 - Server Error 500',
            message: err
        });
    }

});

/**
 * @param {import('next').NextApiRequest} req
 * @param {import('next').NextApiResponset} res
 */
app.get('/api/getrandomlabelname', async (req, res) => {
    const lng = req.query['lng'];
    const db = req.db

    const dbTable = getDatabaseTableName(lng);
    const dbTableColunm = lng==='fr' ? 'LABEL_ALIAS' : 'WIKIPEDIA_LINK'

    const getRandomRow = async (column, table, count) => {
        const random = Math.floor(Math.random()*count) + 1;
        const result = await db.query(`SELECT ${column} FROM ${table} LIMIT 1 OFFSET ?`, [random-1]);
        return result[0][0][`${column}`];
    }
    const getCount = async (table) => {
        const results = await db.query(`SELECT COUNT(*) as count FROM ${table}`);
        return results[0][0].count;
    }

    try {
        const count = await getCount(dbTable);
        let labelname = '';
        if (lng==='fr'){
            let randomLabelname = await getRandomRow(dbTableColunm, dbTable, count);
            let randomLabelnameArray = randomLabelname.split(' ');
            while (randomLabelname === null || randomLabelnameArray.length > 1) {
                randomLabelname = await getRandomRow(dbTableColunm, dbTable, count);
                randomLabelnameArray = randomLabelname.split(' ');
                console.log(randomLabelname);
            }
            labelname = randomLabelname;
        } else {
            let randomLabelname = await getRandomRow(dbTableColunm, dbTable, count);
            while (randomLabelname === null){
                randomLabelname = await getRandomRow(dbTableColunm, dbTable, count);
                console.log('WIKIPEDIA_LINK NULL');
            }
            labelname = randomLabelname;
        }
      
        res.status(200).json({data: labelname });
        
    } catch(err) {
        console.error(err);
        res.status(500).json({
            error: '@11 - Server Error 500',
            message: err
        })
    }
});

app.use('/api/cls', require('./routes/cls'));


// close the write stream when the application is shutting down
process.on('SIGINT', () => {
    logStream.end();
    process.exit(0);
});

app.listen(PORT, () => { console.log('### app.listen - Server is started with nodemon') });




// nbr de contrubuteurs
// http://fr.wikipedia.org/w/api.php?action=query&titles=Platon&prop=contributors&pclimit=max&format=json&nonredirects&rawcontinue

// api pour extraire la taille de l'article.
// http://fr.wikipedia.org/w/api.php?action=query&prop=revisions&rvprop=size&format=json&titles=Platon&redirects

// api pour extraire le nombre le liens internes
// http://fr.wikipedia.org/w/api.php?action=query&list=backlinks&bllimit=max&bltitle=Platon&blfilterredir=nonredirects&format=json&raccontinue

// nbr extraire de liens externes
// http://fr.wikipedia.org/w/api.php?action=query&prop=extlinks&ellimit=max&bltitle=Platon&format=json&rawcontinue