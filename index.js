const express = require('express');
const cors = require('cors');
const ObjectId = require('mongodb').ObjectId;
const { MongoClient, ServerApiVersion } = require('mongodb');
const port = process.env.PORT || 5000;
require('dotenv').config();


const app = express();


//use middleware
app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.m12jl.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {

    try {
        await client.connect();

        const productCollection = client.db("warehouseManagement").collection("products");

        //get all products
        app.get('/products', async (req, res) => {
            const query = {};
            const cursor = productCollection.find(query);
            const products = await cursor.toArray();
            console.log("Getting products");
            res.send(products);
        });

        // POST user: add a new item 
        app.post('/add', async (req, res) => {
            const newProduct = req.body;
            console.log("adding new item", newProduct);
            const result = await productCollection.insertOne(newProduct);
            res.send(result)
        });

        //get all products added by user email
        app.get('/myItems', async (req, res) => {
            const query = req.body.email;
            const cursor = productCollection.find(query);
            const products = await cursor.toArray();
            console.log("Getting products");
            res.send(products);
        });

    }
    finally {
        // await client.close();
    }
}

run().catch(console.dir);



app.get('/', (req, res) => {
    res.send('Running my node CRUD server with env');
})

app.listen(port, () => {
    console.log('CRUD server running with env file');
});