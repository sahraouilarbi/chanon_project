const express = require('express');
const request = require('request');
const cheerio = require('cheerio');
const fs = require('fs');
const axios = require('axios');
// var mysql = require('mysql');
const mysql = require('mysql2');
const mongoose = require('mongoose');
const histo = require('./models/products');
const cls = require('./routes/cls');
const cors = require('cors');
const { setDefaultHighWaterMark } = require('stream');
const app = express();
const PORT = 5000

// mongoDB
mongoose.connect("mongodb://localhost:27017/chanonpro");
const db = mongoose.connection;
db.on('error', (error) => console.log('### db.connect - error :', error));
db.once('open', () => console.log('### db.once : connected'));

app.use(express.json());
app.use(cors());

const logStream = fs.createWriteStream('logs.txt', { flags: 'a' });
// var connection = mysql.createConnection({
//     host: 'localhost',
//     user: 'root',
//     password: 'root',
//     database: '2_prolexbase_3_1_eng_data'
// });


// Create a MySQL connection pool
// const pool = mysql.createPool({
//     host: 'localhost',
//     user: 'root',
//     password: 'root',
//     database: '2_prolexbase_3_1_other_data',
//     connectionLimit: 10, // Adjust the connection limit as per your requirements
// });

// Create a function to get the database name based on the selected language
function getDatabaseName(language) {
    switch (language) {
        case 'ar':
            return '2_prolexbase_3_1_other_data';
        case 'en':
            return '2_prolexbase_3_1_eng_data'
        case 'fr':
            return '2_prolexbase_3_1_fra_data';
        default:
            return '';
    }
}

// Create a function to get the database table name based on the selected language
function getDatabaseTableName(language) {
    switch (language) {
        case 'ar':
            return 'prolexeme_arb';
        case 'en':
            return 'prolexeme_eng'
        case 'fr':
            return 'alias_fra';
        default:
            return '';
    }
}

// Create a function to get the database table name based on the selected language
function getDatabaseTableNameColumnName(databaseTableName) {
    switch (databaseTableName) {
        case 'prolexeme_arb':
            return 'LABEL_PROLEXEME';
        case 'prolexeme_eng':
            return 'LABEL_PROLEXEME'
        case 'alias_fra':
            return 'LABEL_ALIAS';
        default:
            return '';
    }
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
        host: 'localhost',
        user: 'root',
        password: 'root',
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
    } catch (error) {
        return res.status(500).json({
            message: error
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

        // const result_size = await db.query('SELECT count(*) FROM prolexeme_arb');
        
        const query = await histo.find({
            "labelprolexme": labelprolexme
        });

        console.log('### app.get(filter) - query.length : ', query.length);
        console.log('### app.get(filter) - query : ', query);
        
        
        let msg;
        if (query.length === 0) {
            const db = req.db;

            
            const dbTableName = getDatabaseTableName(lng);

            const dbTableNameColumnName = getDatabaseTableNameColumnName(dbTableName);
            
            db.query(`SELECT * FROM ${dbTableName} where ${dbTableNameColumnName} = '${labelprolexme}'`, async (err, results) => {

                if (err) {
                    console.error('### app.get(filter) - Error executing query:', err);
                    return res.status(500).send('Server Error #01');
                }

                if (results.length === 0) {

                    console.log('### app.get(filter) - a');                    
                    const response_nbrContri = await axios.get(`http://localhost:5000/api/nbr-contributors?name=${labelprolexme}&lng=${lng}`);
                    console.log('======================================== Result ==============================================');
                    
                    console.log('### app.get(filter) - result  : ', response_nbrContri.data);
                    console.log('### app.get(filter) - result splt  : ', response_nbrContri.data.splt);
                    console.log('### app.get(filter) - result sumD  : ', response_nbrContri.data.sumD);
                    console.log('### app.get(filter) - result size : ', response_nbrContri.data.size);
                    console.log('### app.get(filter) - result data : ', response_nbrContri.data.data);
                    console.table(response_nbrContri.data.data);

                    //var splt = response_nbrContri.data.splt;
                    const splt = Object.keys(response_nbrContri.data.data.query.pages)[0];
                    
                    if (response_nbrContri.status === 200) {
                        const response_sizeItm = await axios.get(`http://localhost:5000/api/size-item?name=${labelprolexme}&splt=${splt}&lng=${lng}`);                        console.log('### app.get(filter) - b');
                        console.log('======================================== Result ==============================================');
                        
                        console.log('### app.get(filter) - response : ', response_sizeItm.data);
                        console.log('### app.get(filter) - result data : ', response_sizeItm.data.data);
                        //console.log('### app.get(filter) - result page id : ', response_sizeItm.data.data.query.pages[splt]);
                        
                        const splt_ = Object.keys(response_sizeItm.data.data.query.pages)[0];
                        
                        console.log('### app.get(filter) - result page id  : ', response_sizeItm.data.data.query.pages[splt_].pageid);
                        console.log('### app.get(filter) - result size : ', splt != -1 ? response_sizeItm.data.data.query.pages[splt_].revisions[0].size : 0);
                        
                        const response_nbrInterLink = await axios.get(`http://localhost:5000/api/nbr-internal-links?name=${labelprolexme}&lng=${lng}`);
                        console.log('### app.get(filter) - c');
                        console.log('======================================== Result ==============================================');
                        
                        console.log('### app.get(filter) - response : ', response_nbrInterLink);
                        console.log('### app.get(filter) - response data  : ', response_nbrInterLink.data);
                        console.log('### app.get(filter) - response data sum: ', response_nbrInterLink.data.sum);
                        console.log('### app.get(filter) - response data size: ', response_nbrInterLink.data.size);
                        console.table(response_nbrInterLink.data.data.query.backlinks);
                        
                        console.log(response_nbrInterLink.status);
                        if (response_nbrInterLink.status == '200') {
                            const response_nbrExtrLink = await axios.get(`http://localhost:5000/api/nbr-external-links?name=${labelprolexme}&lng=${lng}`);
                            console.log('### app.get(filter) - d');
                            console.log('======================================== Result ==============================================');
                            
                            console.log('### app.get(filter) - response : ', response_nbrExtrLink);
                            console.log('### app.get(filter) - response data : ', response_nbrExtrLink.data);
                            console.table(response_nbrExtrLink.data);
                            console.log('### app.get(filter) - response data size : ', response_nbrExtrLink.data.size);
                            console.log('### app.get(filter) - response status : ', response_nbrExtrLink.status);
                            
                            
                            if (response_nbrExtrLink.status === 200) {
                                // console.log('qrt five');
                                const response_crtFive = await axios.get(`http://localhost:5000/api/crt-five?name=${labelprolexme}&lng=${lng}&year=${year}`);
                                
                                console.log('======================================== Result ==============================================');
                                console.log('### app.get(filter) -  crt five : ', response_crtFive);
                                console.log('### app.get(filter) -  crt five data : ', response_crtFive.data.datasiz);
                                console.table(response_crtFive.data.datasiz);
                                // console.table(response_crtFive.data);
                                console.log('### app.get(filter) -  crt five sumTotale: ', response_crtFive.data.sumTotale);
                                console.log('### app.get(filter) -  crt five size: ', response_crtFive.data.size);
                                console.log('### app.get(filter) -  crt five rowHist: ', response_crtFive.data.rowofhits);
                                console.log('### app.get(filter) -  crt five : histVal', response_crtFive.data.hitsValue);
                                console.log('### app.get(filter) - crt five moyenneViews', response_crtFive.data.moyenneViews);
                                console.log('### app.get(filter) -  crt five status', response_crtFive.status);
                                
                                if (response_crtFive.status === 200) {
                                    const casl = await axios.post(`http://localhost:5000/api/additive_wighting`, {
                                        normTable: response_crtFive.data.rowofhits,
                                        wight: response_crtFive.data.sumTotale
                                    });
                                    // console.log('cal : ', cal);
                                    const cal = await axios.get(`http://localhost:5000/api/cls`);                                    
                                    console.log('### app.get(filter) - notoritie : ', cal.data.data);
                                    if (cal.data.data === 1 || cal.data.data === 2) {
                                        console.log('### newProduct : start insert');
                                
                                        const revisionPageId = Object.keys(response_sizeItm.data.data.query.pages)[0];
                                
                                        revisionSizeData = response_sizeItm.data.data.query.pages[revisionPageId].revisions
                                
                                        
                                        const addProduct = new histo({
                                            labelprolexme: labelprolexme,
                                            numpivot: `1552`,
                                            nbrauthores: `${response_nbrContri.data.sumD}`,
                                            extlink: `${response_nbrExtrLink.data.size}`,
                                            hists: `${response_crtFive.data.hitsValue}`,
                                            sizedata: `${revisionSizeData}`,
                                            pagerankwiki: `${response_crtFive.data.sumTotale}`,
                                            frenq: `2`,
                                            wikilink: `https://${lng}.wikipedia.org/wiki/${labelprolexme}`,
                                            date: currentTime,
                                            lng: lng,
                                            type: 'person',
                                            year_views:[
                                                {
                                                    year: `${year}`,
                                                    views_average: `${response_crtFive.data.moyenneViews}`,
                                                }
                                            ],
                                        });
                                        const newProducts = await addProduct.save();
                                        console.log('### newProducts : end insert');

                                    }
                                }

                            } else {
                                console.log('### app.get(filter) - rah fal 3aks');
                            }
                        } else {
                        }
                    }
                    return res.status(200).json({
                        data: query,
                        messA: 'test',
                        newD: query_size.length,
                        // oldD: result_size.length
                    })
                } else {
                    console.log('### app.get(filter) - result : ', results);
                    const addProduct = new histo({
                        labelprolexme: labelprolexme,
                        numpivot: results[0].NUM_PIVOT,
                        nbrauthores: '',
                        extlink: results[0].WIKIPEDIA_LINK,
                        hists: results[0].SORT,
                        sizedata: '',
                        pagerankwiki: '',
                        frenq: results[0].NUM_FREQUENCY,
                        wikilink: `https://${lng}.wikipedia.org/wiki/${labelprolexme}`,
                        date: currentTime,
                        lng: lng,
                        type: ''
                    });
                    const newProducts = await addProduct.save();
                }

                return res.status(200).json({
                    data: query,
                    messB: 'test',
                })
            });
        } else {
            // update product
            console.log('update product');
            const response_crtFive = await axios.get(`http://localhost:5000/api/crt-five?name=${labelprolexme}&lng=${lng}&year=${year}`);
            
            try{
                    const reQuery = await histo.find({"labelprolexme": labelprolexme});
                    console.log('@@ reQuery', reQuery);
                    const productId = reQuery[0]._id;
                    console.log('@@ productId to update',productId);

                    const filter = {
                        _id: productId,
                        'year_views.year': year,
                    };

                    const update = {
                        $set: {
                            'year_views.$.views_average': `${response_crtFive.data.moyenneViews}`,
                        }
                    }
                    if(reQuery[0].year_views.some((elem) => elem.year === year)) {
                        // Update existing entry
                        const updateProduct = await histo.updateOne(filter, update);
                        if (updateProduct.nModified === 0) {
                            return res.status(404).json({error: 'Record not found'});
                        }
                    } else {
                        // Add new entry
                        const newEntry = {
                            year: `${year}`,
                            views_average: `${response_crtFive.data.moyenneViews}`,
                        };
                        const addNewEntry = await histo.findByIdAndUpdate(
                            productId,
                            { $push: {year_views: newEntry} },
                            { new: true },
                        );
                        if (!addNewEntry) {
                            return res.status(404).json({error: 'Record not found'});
                        }
                    }
                    

                    const updateProduct = await histo.findById(productId);
                    res.status(200).json(updateProduct);
            } catch(error){
                console.log(error);
                res.status(500).json({error: 'Server error @@'});
            }

        }
    } catch (error) {
        return res.status(500).json({
            message: error
        })
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
    } catch (error) {
        return res.status(500).json({
            message: error
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

    console.log('### app.get(/api/scrap) - req.query', req.query);

    try {
        url = `https://${lng}.wikipedia.org/wiki/${name}`;
        const encodedURL = encodeURI(url);
        request(encodedURL, function (error, response, html) {
            if (!error) {
                const $ = cheerio.load(html);
                // For example:
                const title = $('table>tbody>tr').text();
                console.log('### app.get(/api/scrap) - title : ', title);
                // logStream.write(title);
                res.send(title);
            }
        });
    } catch (error) {
        console.log('### app.get(/api/scrap) - error : ', error);
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
        
        console.log('### app.get(/api/nbr-contributors) - sum data : ', sumD);
        
        res.send({
        //  "splt": splt,
            "splt": pageId,
        //  "sumD": sumD,
        //  "size": response.data.query.pages[splt].contributors.length,
            "size": contributorsCount,
        //  "data": response.data,
            "data": data,
        });
    } catch (error) {
        console.log(error);
        res.status(500).send('Server Error #02');
    }
});


// this function for extract item size
// app.get('/api/size-item', ...) defines a route that handles a GET request to extract the size of the query result from the histo collection in MongoDB.
/**
 * @param {import('next').NextApiRequest} req
 * @param {import('next').NextApiResponse} res
 */
app.get('/api/size-item', async (req, res) => {
    const { name, splt, lng } = req.query;
    console.log('###-### ###-###',req.query);
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
    } catch (error) {
        console.error('### app.get(/api/size-item) - Error : ', error);
        res.status(500).send('Server Error #03');
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
    } catch (error) {
        console.error('### app.get(/api/nbr-internak-links - Error : )', error);
        res.status(500).send('Server Error #04');
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
        const extlinks = data.query.pages[pageId].extlinks || [];
        const extlinksCount = extlinks.length;
        res.send({
            //"data": response.data,
            "data": data,
            //"size": response.data.limits.extlinks
            "size": extlinksCount
        });
    } catch (error) {
        console.error('### app.get(/api/nbr-external-links) - Error : ',error);
        res.status(500).send('Server Error #05');
    }
});


// this function critare 5
// app.get('/api/crt-five', ...) defines a route that handles a GET request to retrieve data from the Wikimedia API and perform calculations on the data.
/**
 * @param {import('next').NextApiRequest} req
 * @param {import('next').NextApiResponse} res
 */
app.get('/api/crt-five', async (req, res) => {
    
    console.log('### app.get(/api/crt-five) - req.query', req.query);
    const { name, lng, year } = req.query;

    console.log(req.query);

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
                console.log('histV : ', histV);
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
        
    } catch (error) {
        // console.log('### app.get(/api/crt-five) - Error', error);
        res.status(500).send('Server Error #06');
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
        console.log('saw : ', cls);
        console.log('saw : ', cls.data.data);
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

    } catch (error) {
        console.log(error);
        res.status(500).send('Server Error #07');
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
            console.error('### app.get(/api/fetch) - Error executing query:', err);
            return res.status(500).send('Server Error #08');
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

    try{
        const query = await histo.find();
        return res.status(200).json({
            data: query
        });
    } catch(error){
        res.status(500).json({
            message: error
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