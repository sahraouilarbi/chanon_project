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

const app = express();
const PORT = 5000

// mongoDB
mongoose.connect("mongodb://127.0.0.1/chanonpro");
const db = mongoose.connection;
db.on('error', (error) => console.log(error));
db.once('open', () => console.log('connected'));

app.use(express.json());

const logStream = fs.createWriteStream('logs.txt', { flags: 'a' });
var connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: '2_prolexbase_3_1_fra_data'
});


// Create a MySQL connection pool
const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: '2_prolexbase_3_1_fra_data',
    connectionLimit: 10, // Adjust the connection limit as per your requirements
});

// middleware to log each request to the file
app.use((req, res, next) => {
    const now = new Date();
    const log = `${now}: ${req.method} ${req.path}\n`;
    req.db = pool;
    // logStream.write(log);
    res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
});


//  get all label prolexem

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

app.get('/filter', async (req, res) => {

    const { labelprolexme, lng } = req.query;
    console.log('label name : ', labelprolexme);
    console.log('lng : ', lng);
    const currentDate = new Date();
    const currentTime = currentDate.toLocaleString();
    try {

        const query_size = await histo.find();
        const result_size = await db.query('SELECT count(*) FROM prolexeme_arb');

        const query = await histo.find({
            "labelprolexme": labelprolexme
        });


        console.log('data : ', query.length);
        let msg;
        if (query.length === 0) {
            const db = req.db;
            db.query(`SELECT * FROM prolexeme_arb where LABEL_PROLEXEME = '${labelprolexme}'`, async (err, results) => {
                if (err) {
                    console.error('Error executing query:', err);
                    return res.status(500).send('Server Error');
                }
                console.log('data sql : ', results.length);
                if (results.length === 0) {
                    const response_nbrContri = await axios.get(`http://127.0.0.1:5000/api/nbr-contributors?name=${labelprolexme}&lng=${lnge}`);
                    console.log('======================================== Result ==============================================');
                    console.log('result  : ', response_nbrContri.data);
                    console.log('result splt  : ', response_nbrContri.data.splt);
                    console.log('result sumD  : ', response_nbrContri.data.sumD);
                    console.log('result size : ', response_nbrContri.data.size);
                    console.log('result data : ', response_nbrContri.data.data);
                    console.table(response_nbrContri.data.data);

                    var splt = response_nbrContri.data.splt;
                    if (response_nbrContri.status === 200) {
                        const response_sizeItm = await axios.get(`http://127.0.0.1:5000/api/size-item?name=${labelprolexme}&splt=${splt}&lng=${lnge}`);
                        console.log('b');
                        console.log('======================================== Result ==============================================');

                        console.log('response : ', response_sizeItm.data);
                        console.log('result data : ', response_sizeItm.data.data);
                        console.log('result page id : ', response_sizeItm.data.data.query.pages[splt]);
                        console.log('result page id  : ', response_sizeItm.data.data.query.pages[splt].pageid);
                        console.log('result size : ', response_sizeItm.data.data.query.pages[splt].revisions[0].size);
                        const response_nbrInterLink = await axios.get(`http://127.0.0.1:5000/api/nbr-internal-links?name=${labelprolexme}&lng=${lnge}`);
                        console.log('c');
                        console.log('======================================== Result ==============================================');

                        console.log('response : ', response_nbrInterLink);
                        console.log('response data  : ', response_nbrInterLink.data);
                        console.log('response data sum: ', response_nbrInterLink.data.sum);
                        console.log('response data size: ', response_nbrInterLink.data.size);
                        console.table(response_nbrInterLink.data.data.query.backlinks);
                        console.log(response_nbrInterLink.status);
                        if (response_nbrInterLink.status == '200') {
                            const response_nbrExtrLink = await axios.get(`http://127.0.0.1:5000/api/nbr-external-links?name=${labelprolexme}&lng=${lnge}`);
                            console.log('d');
                            console.log('======================================== Result ==============================================');

                            console.log('response : ', response_nbrExtrLink);
                            console.log('response data : ', response_nbrExtrLink.data);
                            console.table(response_nbrExtrLink.data);
                            console.log('response data size : ', response_nbrExtrLink.data.size);
                            console.log('response status : ', response_nbrExtrLink.status);


                            if (response_nbrExtrLink.status === 200) {
                                // console.log('qrt five');
                                const response_crtFive = await axios.get(`http://127.0.0.1:5000/api/crt-five?name=${labelprolexme}&lng=${lnge}`);

                                console.log('======================================== Result ==============================================');
                                console.log(' crt five : ', response_crtFive);
                                console.log(' crt five data : ', response_crtFive.data.datasiz);
                                console.table(response_crtFive.data.datasiz);
                                // console.table(response_crtFive.data);
                                console.log(' crt five sumTotale: ', response_crtFive.data.sumTotale);
                                console.log(' crt five size: ', response_crtFive.data.size);
                                console.log(' crt five rowHist: ', response_crtFive.data.rowofhits);
                                console.log(' crt five : histVal', response_crtFive.data.hitsValue);
                                console.log(' crt five status', response_crtFive.status);
                                if (response_crtFive.status === 200) {
                                    const casl = await axios.post(`http://127.0.0.1:5000/api/additive_wighting`, {
                                        normTable: response_crtFive.data.rowofhits,
                                        wight: response_crtFive.data.sumTotale
                                    });
                                    // console.log('cal : ', cal);
                                    const cal = await axios.get(`http://127.0.0.1:5000/api/cls`);

                                    console.log('notoritie : ', cal.data.data);
                                    if (cal.data.data === 1 || cal.data.data === 2) {
                                        const addProduct = new histo({
                                            labelprolexme: labelprolexme,
                                            numpivot: `1552`,
                                            nbrauthores: `${response_nbrContri.data.sumD}`,
                                            extlink: `${response_nbrExtrLink.data.size}`,
                                            hists: `${response_crtFive.data.hitsValue}`,
                                            sizedata: `${response_sizeItm.data.data.query.pages[splt].revisions[0].size}`,
                                            pagerankwiki: `${response_crtFive.data.sumTotale}`,
                                            frenq: `2`,
                                            wikilink: `https://ar.wikipedia.org/wiki/${labelprolexme}`,
                                            date: currentTime,
                                            lng: 'Fr',
                                            type: 'person'
                                        });
                                        // const newProducts = await addProduct.save();

                                    }
                                }

                            } else {
                                console.log('rah fal 3aks');
                            }
                        } else {
                        }
                    }
                    return res.status(200).json({
                        data: query,
                        messA: 'test',
                        newD: query_size.length,
                        oldD: result_size.length
                    })
                }

                return res.status(200).json({
                    data: query,
                    messB: 'test',
                })
            });
        }
    } catch (error) {
        return res.status(500).json({
            message: error
        })
    }
});

// add new labelprolexem
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
        return res.status(201).json({
            data: newProducts
        })
    } catch (error) {
        return res.status(500).json({
            message: error
        })
    }

});

app.get("/api/scrap", async (req, res) => {
    const { name, lng } = req.query;

    try {
        console.log('name : ', name);
        url = `https://${lng}.wikipedia.org/wiki/${name}`;
        // url = `https://ar.wikipedia.org/wiki/${name}`;
        request(url, function (error, response, html) {
            if (!error) {
                const $ = cheerio.load(html);
                // For example:
                const title = $('table>tbody>tr').text();
                console.log('title : ', title);
                // logStream.write(title);
                res.send(title);
            }
        });
    } catch (error) {
        console.log('error : ', error);
    }
});



// this function for calculate nbr of contributors
app.get('/api/nbr-contributors', async (req, res) => {
    const { name, lng } = req.query;

    console.log('name : ', name);

    try {
        const response = await axios.get(`http://${lng}.wikipedia.org/w/api.php?action=query&titles=${name}&prop=contributors&pclimit=max&format=json&nonredirects&rawcontinue`);
        let sumD = 0;
        console.log('page id : ', response.data['query-continue'].contributors.pccontinue);
        var splt = response.data['query-continue'].contributors.pccontinue.split('|')[0];
        console.log('after split : ', splt);
        for (let dt of response.data.query.pages[splt].contributors) {
            sumD += dt['userid']
        }

        console.log('sum data : ', sumD);
        res.send({
            "splt": splt,
            "sumD": sumD,
            "size": response.data.query.pages[splt].contributors.length,
            "data": response.data,
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
});


// this function for extract item size
app.get('/api/size-item', async (req, res) => {
    const { name, splt, lng } = req.query;
    try {
        const response = await axios.get(`http://${lng}.wikipedia.org/w/api.php?action=query&prop=revisions&rvprop=size&format=json&titles=${name}&redirects`);
        // console.log("size item : ", name);
        res.send({
            "size": response.data.query.pages[splt].revisions[0]['size'],
            "data": response.data,
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
});


// this function extract the number the internal links
app.get('/api/nbr-internal-links', async (req, res) => {
    const { name, lng } = req.query;

    try {
        const response = await axios.get(`http://${lng}.wikipedia.org/w/api.php?action=query&list=backlinks&bllimit=max&bltitle=${name}&blfilterredir=nonredirects&format=json&raccontinue`);
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
        console.error(error);
        res.status(500).send('Server Error');
    }
});

// this function extract the number the external links
app.get('/api/nbr-external-links', async (req, res) => {
    const { name, lng } = req.query;
    try {
        const response = await axios.get(`http://${lng}.wikipedia.org/w/api.php?action=query&prop=extlinks&ellimit=max&bltitle=${name}&format=json&rawcontinue`);
        res.send({
            "data": response.data,
            "size": response.data.limits.extlinks
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
});

// this function critare 5
app.get('/api/crt-five', async (req, res) => {
    const { name, lng } = req.query;

    try {
        const response = await axios.get(`https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article/${lng}.wikipedia/all-access/all-agents/${name}/monthly/2016010100/2022013100`);

        let size = response.data.items.length;
        var data = response.data.items;
        let rowofhits = [];
        let hitsValue = [];
        let sumHitV = 0;
        let sumHistV = 0;

        for (let i = 0; i < size; i++) {
            let histV = data[i]['views'] * ((i + 1) / size);
            rowofhits.push(Math.round(histV));
            sumHitV += Math.round(histV);
            console.log('histV : ', histV);
            hitsValue.push(sumHitV);
        }
        res.send({
            "datasiz": response.data.items,
            "sumTotale": sumHitV,
            "size": response.data.items.length,
            "rowofhits": rowofhits,
            "hitsValue": hitsValue,
        }
        );
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
});


// calculate_wightofcriteria
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
app.post('/api/additive_wighting', async (req, res) => {
    const { normTable, wight } = req.body

    console.log('norm Table : ', normTable);

    try {
        const cls = await axios.get(`http://127.0.0.1:5000/api/cls`);

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
        res.status(500).send('Server Error : ', error);
    }
});


// connection with mysql database
app.get('/api/fetch', async (req, res) => {
    const db = req.db;

    db.query(`SELECT * FROM alias_fra`, (err, results) => {
        if (err) {
            console.error('Error executing query:', err);
            return res.status(500).send('Server Error');
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
    //     res.status(500).send('Server Error');
    // }
});


app.use('/api/cls', require('./routes/cls'));


// close the write stream when the application is shutting down
process.on('SIGINT', () => {
    logStream.end();
    process.exit(0);
});

app.listen(PORT, () => { console.log('Server is started with nodemone') });




// nbr de contrubuteurs
// http://fr.wikipedia.org/w/api.php?action=query&titles=Platon&prop=contributors&pclimit=max&format=json&nonredirects&rawcontinue

// api pour extraire la taille de l'article.
// http://fr.wikipedia.org/w/api.php?action=query&prop=revisions&rvprop=size&format=json&titles=Platon&redirects

// api pour extraire le nombre le liens internes
// http://fr.wikipedia.org/w/api.php?action=query&list=backlinks&bllimit=max&bltitle=Platon&blfilterredir=nonredirects&format=json&raccontinue

// nbr extraire de liens externes
// http://fr.wikipedia.org/w/api.php?action=query&prop=extlinks&ellimit=max&bltitle=Platon&format=json&rawcontinue