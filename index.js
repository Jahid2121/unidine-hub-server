const express = require('express');
const app = express();
const cors = require('cors')
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

    app.get('/meal', async (req, res) => {
    const result = await mealCollection.find().toArray();
    res.send(result)
    })

    app.get('/meal/:id', async (req, res) => {
      const id = req.params.id;
      const query = {_id: new ObjectId(id)}
      const result = await mealCollection.findOne(query)
      res.send(result)
    })


    // request meals

    app.get('/requestedMeals', async (req, res) => {
      const adminEmail = req.query.email;
      console.log(adminEmail);
      const query = {adminEmail: adminEmail}
      const result = await reqMealCollection.find(query).toArray();
      res.send(result)
    })


    app.post('/requestedMeals', async (req, res) => {
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