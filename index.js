const express = require('express');
const app = express();
const cors = require('cors')
const jwt = require('jsonwebtoken')
require("dotenv").config();
const port = process.env.PORT || 5000;



// middlewares
app.use(cors())
app.use(express.json())






const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.pu45iww.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });


    const mealCollection = client.db("hosteldb").collection("meal")
    const reqMealCollection = client.db("hosteldb").collection("requestedMeals")
    const reviewCollection = client.db("hosteldb").collection("reviews")
    const userCollection = client.db("hosteldb").collection("users")


    // verify middlewares
const verifyToken = (req, res, next) => {
  // console.log('inside verify', req.headers.authorization);
  if(!req.headers.authorization){
    return res.status(401).send({message: 'unauthorized access'})
  }
  const token = req.headers.authorization.split(' ')[1];
  jwt.verify(token, process.env.ACCESS_TOKEN, (err, decoded) => {
    if(err){
      return res.status(401).send({message: 'unauthorized access'})
    }
    req.decoded = decoded
    next()
  })
}

const verifyAdmin = async(req, res, next) => {
  const email = req.decoded.email;
  const query = {email: email};
  const user = await userCollection.findOne(query)
  const isAdmin = user?.role === 'admin';
  if(!isAdmin){
    return res.status(403).send({message: 'forbidden access'})
  }
  next()
}

    app.get('/meal', async (req, res) => {
      const result = await mealCollection.find().toArray();
      res.send(result)
    })

    app.get('/meal/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await mealCollection.findOne(query)
      res.send(result)
    })

    app.patch('/meal/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const updatedResult = await mealCollection.updateOne(query, { $inc: { likes: 1, "metrics.orders": 1 } })
      res.send(updatedResult)
    })


    // request meals

    app.get('/requestedMeals', verifyToken, async (req, res) => {
      const email = req.query.email;
      console.log(email);
      const query = { email: email }
      const result = await reqMealCollection.find(query).toArray();
      res.send(result)
    })


    app.post('/requestedMeals', verifyToken, async (req, res) => {
      const reqMeal = req.body;
      const result = await reqMealCollection.insertOne(reqMeal);
      res.send(result)
    })

    // reviews 

    app.post('/reviews', async (req, res) => {
      const review = req.body;
      const result = await reviewCollection.insertOne(review)
      res.send(result)
    })


    app.get('/reviews', async (req, res) => {
      const email = req.query.email;
      console.log(email);
      const query = { email: email }
      const result = await reviewCollection.find(query).toArray();
      res.send(result)
    })

    app.delete('/reviews/:id', verifyToken, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await reviewCollection.deleteOne(query)
      res.send(result)
    })

    // jwt
    app.post('/jwt', async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN, {
        expiresIn: '1h'
      })
      res.send({ token })
    })




    // users
    app.post('/users', async (req, res) => {
      const userData = req.body;
      const query = { email: userData.email }
      const userExist = await userCollection.findOne(query)
      if (userExist) {
        return res.send({ message: 'user already exist', insertedId: null })
      }
      const result = await userCollection.insertOne(userData)
      res.send(result)
    })

    app.get('/users', verifyToken, verifyAdmin, async (req, res) => {

      const result = await userCollection.find().toArray()
      res.send(result)
    })
    app.patch('/users/admin/:id', verifyToken, verifyAdmin, async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) }
      const updatedUser = {
        $set: {
          role: 'admin'
        }
      }
      const result = await userCollection.updateOne(filter, updatedUser)
      res.send(result)
    })

    app.get('/users/admin/:email', verifyToken, async (req, res) => {
      const email = req.params.email;
      if (email !== req.decoded.email) {
        return res.status(403).send({ message: 'unAuthorized access' })
      }
      const query = { email: email };
      const user = await userCollection.findOne(query)
      let admin = false;
      if (user) {
        admin = user?.role === 'admin'
      }
      res.send({ admin })
    })



    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);






app.get('/', async (req, res) => {
  res.send('UniDine Hub server is running')
})

app.listen(port, () => {
  console.log(`UniDine Hub server listening on ${port}`);
})