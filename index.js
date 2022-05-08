const express = require('express');
const cors = require('cors');
const ObjectId = require('mongodb').ObjectId;
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion } = require('mongodb');
const port = process.env.PORT || 5000;
require('dotenv').config();


const app = express();


//use middleware
app.use(cors());
app.use(express.json());

function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send({ message: 'Unauthorized Access' });
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).send({ message: 'Forbidden Access' });
        }
        console.log('Decoded', decoded);
        req.decoded = decoded;
        next();
    })
}



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.m12jl.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {

    try {
        await client.connect();

        const productCollection = client.db("warehouseManagement").collection("products");

        app.post('/login', async (req, res) => {
            const user = req.body;
            const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
                expiresIn: '15d'
            });
            console.log('user:', user, 'Token:', accessToken);
            res.send({ accessToken });
        })



        //get all products
        app.get('/products', async (req, res) => {
            const query = {};
            const cursor = productCollection.find(query);
            const products = await cursor.toArray();
            res.send(products);
        });

        // POST user: add a new item 
        app.post('/add', async (req, res) => {
            const newProduct = req.body;
            const result = await productCollection.insertOne(newProduct);
            res.send(result)
        });

        //get a single product to update
        app.get('/product/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };

            const result = await productCollection.findOne(query);
            res.send(result);
        })

        // get products by user email 
        app.get('/myproducts', verifyJWT, async (req, res) => {

            const authHeader = req.headers.authorization;
            console.log(authHeader);

            // const decodedEmail = req.decoded.email;
            const email = req.query.email;
            const decodedEmail = req.decoded.email;

            if (email === decodedEmail) {
                const query = { email: email };
                const cursor = productCollection.find(query);
                const products = await cursor.toArray();
                res.send(products);
            }
            else {
                res.status(403).send({ message: 'Forbidden Access' })
            }

        })


        // update product 
        app.put('/product/:id', async (req, res) => {
            const id = req.params.id;
            const updatedProduct = req.body;
            const filter = { _id: ObjectId(id) };
            const ooptions = { upsert: true };

            const updatedDoc = {
                $set: {
                    quantity: updatedProduct.quantity,
                    sold: updatedProduct?.sold,
                }
            };

            const result = await productCollection.updateOne(filter, updatedDoc, ooptions);
            res.send(result);
        })


        //delete a product
        app.delete('/product/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };

            const result = await productCollection.deleteOne(query);
            res.send(result);
        })

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