require('dotenv').config();

const http = require('http');
const qs = require('querystring')
const QiwiBillPaymentsAPI = require('@qiwi/bill-payments-node-js-sdk');
const qiwiApi = new QiwiBillPaymentsAPI(process.env.SECRET_KEY);
const MongoClient = require("mongodb").MongoClient;
const mongoClient = new MongoClient("mongodb://localhost:27017/");
let clientDB = null;
mongoClient.connect(function(err, client) {
    if(err){
        return console.log(err);
    }
    
    clientDB = client;
});

http.createServer(async function(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'origin, content-type, accept');
    res.setHeader('Content-Type', 'application/json');

    if (req.url.includes('/api/qiwi/payPlaceRating')) {
        const {name, email, price, review} = qs.parse(req.url);
        const billId = Date.now();
        const fields = {
            amount: price,
            currency: 'RUB',
            comment: review,
            email: email,
            account : `client${Date.now()}`,
            successUrl: 'http://localhost:5500'
        };
        
        try {
            qiwiApi.createBill( billId, fields ).then( async (data) => {
                if (clientDB) {
                    await addPlaceIntoRating(clientDB, {name, review, price});
                    res.end(JSON.stringify(data.payUrl));
                }
            });
        } catch (e) {
            res.end(e);
        }
    }
    if (req.url.includes('/api/qiwi/getAllDonaters')) {
        try {
            let donaters = await getAllDonaters(clientDB);
            res.end(JSON.stringify(donaters));
        } catch (e) {
            res.end('err');
        }
    }
}).listen(3001);

async function getAllDonaters(client) {
    const db = client.db('rating');
    const collection = db.collection('donaters');

    return new Promise((res, rej) => {
        collection.find().toArray(function(err, results) {
            if (err) { rej('Донатеры не найдены'); console.log(err); }
            res(results);
        })
    })
}

async function addPlaceIntoRating(client, {name, review, price}) {
    const db = client.db("rating");
    const collection = db.collection("donaters");
    let donater = {name, review, price};

    return new Promise((res, rej) => {
        collection.insertOne(donater, function(err, result) {
            if (err) { rej('Донатер не был добавлен в базу данных'); }
            else { res('ok'); console.log(result)}
        })
    })
}