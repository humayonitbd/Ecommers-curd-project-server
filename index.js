const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken')
const port = process.env.PORT || 5000;
const app = express();
require('dotenv').config();


//middware
app.use(cors());
app.use(express.json())


app.get('/', (req, res)=>{
    res.send('server is running..')

})



const uri = `mongodb+srv://${process.env.DB_USER_NAME}:${process.env.DB_PASSWORD}@cluster0.epqkzkd.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function dbConnect(){
   try {
    await client.connect();
    console.log('db connected')
    
   } catch (error) {
    console.log(error.name, error.message)
    
   }
}
dbConnect();

const productsCollection = client.db('curd-ecommers').collection('products');
const ordersCollection = client.db('curd-ecommers').collection('orders');
const addProductsCollection = client.db('curd-ecommers').collection('addProducts')

//All-products get database
app.get('/products', async(req, res)=>{
    try {
        const page = parseInt(req.query.page);
        const size = parseInt(req.query.size);
        // console.log(page, size)
        const query = {};
        const cursor = productsCollection.find(query);
        const products = await cursor.skip(page * size).limit(size).toArray();
        const count = await productsCollection.estimatedDocumentCount();
        res.send({products, count})
        
    } catch (error) {
        console.log(error.message)
        
    }
})

//Single Product get 
app.get('/products/:id', async(req, res)=>{
    try {
        const id = req.params.id;
        const query = {_id: ObjectId(id)}
        const product = await productsCollection.findOne(query);
        res.send(product)
        
    } catch (error) {
        console.lor(error.message)
        
    }
})


//orders data post 

app.post('/orders', async(req, res)=>{
    try {
        const body = req.body;
        const orders = await ordersCollection.insertOne(body);
        if(orders.insertedId){
            res.send({
                success: true,
                message: 'Buy successfull!!'
            })
            
        }else{
            res.send({
                success: false,
                error: 'faild ,,,sory'
            })
        }
      
    } catch (error) {
        console.log(error.message)
    }
})

 function verifyJWT(req, res, next){
    const authorization = req.headers.authorization;
    if(!authorization){
        res.status(401).send({message: 'unauthoriziton access'})
    }
    const token = authorization.split(' ')[1];
  
    jwt.verify(token, process.env.ACCESS_JWT_TOKEN, function(err, decoded){
        if(err){
            res.status(403).send({message: 'forbidden access'})
        }
        req.decoded = decoded;
        next();
    })
   
}

//orders find er kaj bs get korar kaj hobe
app.get('/orders', verifyJWT, async(req, res)=>{
    try {
        const decoded = req.decoded;
        if(decoded.email !== req.query.email){
            res.status(403).send({message: 'unauthorized access!'})
        }

        let query = {};
        if(req.query.email){
            query = {
                email: req.query.email
            }
        }
        const cursor = ordersCollection.find(query);
        const orders = await cursor.toArray();
        res.send(orders)

    } catch (error) {
        
    }
})


//order producte ke delete kora hobe akhane
app.delete('/orders/:id', async(req, res)=>{
    try {
        const id = req.params.id;

        const query = {_id: ObjectId(id)}
        const result = await ordersCollection.deleteOne(query);
        if(result.deletedCount){
            res.send({
                success: true,
                message: 'Delete successfull!!'
            })
        }else{
            res.send({
                success: false,
                error:'dont deleted porduct!!'
            })
        }

        
    } catch (error) {
        console.log(error.message)
        
    }
})

//update orders 
app.patch('/orders/:id', async(req, res)=>{
    try {
        const id = req.params.id;
        const status = req.body.status;
        const query = {_id: ObjectId(id)}

        const updateDoc = {
            $set:{
                status: status
            }
        }

        const result = await ordersCollection.updateOne(query, updateDoc)
        res.send(result)
        
        
    } catch (error) {
        console.log(error.name)
        
    }
})


//jwt token post
app.post('/jwt', (req, res)=>{
    try {
        const user = req.body;
        console.log(user)
        const token = jwt.sign(user, process.env.ACCESS_JWT_TOKEN, {expiresIn: '1h'})
        res.send({token})
        
    } catch (error) {
        console.log(error.message)
    }
})



//new page a add product er jonno kaj 
//post product
app.post('/addProducts', async(req, res)=>{
    try {
        const query = req.body;
        const addProducts = await addProductsCollection.insertOne(query);
        if(addProducts.insertedId){
            res.send({
                success: true,
                message: 'Successfull add your product!!'
            })
        }else{
            res.send({
                success: false,
                error: 'Faild,, Do not add Product!!'
            })
        }

        
    } catch (error) {
        console.log(error.message)
    }
})

//get add product 

app.get('/addProducts', async(req, res)=>{
    try {
        const query = {};
        const cursor = addProductsCollection.find(query);
        const products = await cursor.toArray();
        res.send(products)
        
    } catch (error) {
        console.log(error.message)
    }
})

// user load data 
app.get('/addProductsAdd', verifyJWT, async(req, res)=>{
    try {
        // console.log(req.query.email)
        const decoded = req.decoded;
        if(decoded.email !== req.query.email){
            res.status(403).send({message: 'unauthorized access!'})
        }
        let query = {};
        if(req.query.email){
            query = {
                email: req.query.email
            }
        }

        const cursor = addProductsCollection.find(query);
        const products = await cursor.toArray();
        res.send(products)
        
    } catch (error) {
        console.log(error.message)
    }
})

//delete oparation
app.delete('/addProductsAdd/:id', async(req, res)=>{
    try {
        const id = req.params.id;

        const query = {_id: ObjectId(id)}
        const result = await addProductsCollection.deleteOne(query);
        if(result.deletedCount){
            res.send({
                success: true,
                message: 'Delete successfull!!'
            })
        }else{
            res.send({
                success: false,
                error:'dont deleted porduct!!'
            })
        }

        
    } catch (error) {
        console.log(error.message)
        
    }

})


// one product get 
app.get('/addProductsAdd/:id', async(req, res)=>{
    try {
        const id = req.params.id;

        const query = {_id: ObjectId(id)}
        const result = await addProductsCollection.findOne(query);
        res.send(result)

        
    } catch (error) {
        console.log(error.message)
        
    }

})


app.put('/addProductsAdd/:id', async(req, res)=>{
    try {
        const id = req.params.id;
        const datas = req.body;
        const query = {_id: ObjectId(id)}
        const updateDoc = {
            $set: {
                name: datas.name,
                url: datas.url

            }
        }

        const result = await addProductsCollection.updateOne(query, updateDoc)

        if(result.modifiedCount){
            res.send({
                success: true,
                message: 'Successfull update product!!'
            })
        }else{
            res.send({
                success: false,
                error: "dont't update product!!"
            })
        }


        
    } catch (error) {
        console.log(error.message)
        
    }
})



app.listen(port,()=>{
    console.log('your server is runing', port)
})