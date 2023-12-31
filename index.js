const express = require('express');
require("dotenv").config();
const app = express();
const cors = require('cors')
const jwt = require('jsonwebtoken')
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
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
    // await client.connect();



    const mealCollection = client.db("hosteldb").collection("meal")
    const reqMealCollection = client.db("hosteldb").collection("requestedMeals")
    const reviewCollection = client.db("hosteldb").collection("reviews")
    const userCollection = client.db("hosteldb").collection("users")
    const membershipCollection = client.db("hosteldb").collection("membership")
    const paymentCollection = client.db("hosteldb").collection("payment")

    // jwt
    app.post('/jwt', async (req, res) => {
      const user = req.body;
      console.log(user);
      const token = jwt.sign(user, process.env.ACCESS_TOKEN, {
        expiresIn: '1h'
      })
      res.send({ token })
    })

    // verify middlewares
    const verifyToken = (req, res, next) => {
      console.log('inside verify', req.headers.authorization);
      if (!req.headers.authorization) {
        return res.status(401).send({ message: 'unauthorized access' })
      }
      const token = req.headers.authorization.split(' ')[1];
      // console.log(token);
      jwt.verify(token, process.env.ACCESS_TOKEN, (err, decoded) => {
        if (err) {
          return res.status(401).send({ message: 'unauthorized access' })
        }
        req.decoded = decoded
        next()
      })
    }

    // const verifyAdmin = async (req, res, next) => {
    //   const email = req.decoded.email;
    //   const query = { email: email };
    //   const user = await userCollection.findOne(query)
    //   const isAdmin = user?.role === 'admin';
    //   if (!isAdmin) {
    //     return res.status(403).send({ message: 'forbidden access' })
    //   }
    //   next()
    // }
    const verifyAdmin = async (req, res, next) => {
      const email = req.decoded.email;
      const query = { email: email };
      const user = await userCollection.findOne(query);
      const isAdmin = user?.role === 'admin';
      if (!isAdmin) {
        return res.status(403).send({ message: 'forbidden access' });
      }
      next();
    }

    app.post('/meal', async (req, res) => {
      const mealData = req.body;
      const result = await mealCollection.insertOne(mealData);
      res.send(result)
    })

    app.get('/meal', async (req, res) => {
      const result = await mealCollection.find().toArray();
      res.send(result)
    })

    app.put('/meal/:id', async (req, res) => {
      const id = req.params.id;
      console.log(id);
      const filter = {_id: new ObjectId(id)}
      const updatedMeal = req.body;
      console.log(updatedMeal);
      const meal = {
        $set: {
          title: updatedMeal.title,
          category: updatedMeal.category,
          image: updatedMeal.image,
          ingredients: updatedMeal.ingredients,
          description: updatedMeal.description,
          price: updatedMeal.price
        }
      }
      const result = await userCollection.updateOne(filter, meal )
      res.send(result)
    })

    app.get('/meal/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await mealCollection.findOne(query)
      res.send(result)
    })

    app.delete('/meal/:id', verifyToken, verifyAdmin, async (req, res) => {
      const id =req.params.id;
      const query = {_id : new ObjectId(id)}
      const result = await mealCollection.deleteOne(query)
      res.send(result)
    })

    app.patch('/meal/:id', verifyToken, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      // console.log(req.body.action);
      if (req.body.action === 'like') {
        updateFields = { $inc: { likes: 1, 'metrics.orders': 1 } };

      } else if (req.body.action === 'review') {
        updateFields = { $inc: { reviews: 1, 'metrics.orders': 1 } };
      }
    
      const updatedResult = await mealCollection.updateOne(query, updateFields);
      res.send(updatedResult)
    })



    
    // request meals


    app.get("/requestedMeals", verifyToken, async (req, res) => {
      let query = {};
      if (req.query?.email) {
        query = { email: req.query.email }
      }
      const cursor = reqMealCollection.find(query)
      const result = await cursor.toArray()
      res.send(result)
    })



    app.post('/requestedMeals', verifyToken, async (req, res) => {
      const reqMeal = req.body;
      const result = await reqMealCollection.insertOne(reqMeal);
      res.send(result)
    })

    // reviews 

    app.post('/reviews', verifyToken, async (req, res) => {
      const review = req.body;
      const result = await reviewCollection.insertOne(review)
      res.send(result)
    })


    app.get('/reviews', verifyToken, async (req, res) => {
      // const email = req.query.email;
      let query = {};
      if (req.query?.email) {
        query = { email: req.query.email }
      }
      const result = await reviewCollection.find(query).toArray();
      res.send(result)
    })

    app.delete('/reviews/:id', verifyToken, verifyAdmin, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await reviewCollection.deleteOne(query)
      res.send(result)
    })

    




    // users
    app.post('/users',  async (req, res) => {
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

    app.put('/users', verifyToken, async (req, res) => {
      let query = {}
      if (req.query?.email) {
        query = { email: req.query.email }
      }
      const options = {upsert: true}
      const updatedUser = req.body
      const user = {
        $set: {
          name: updatedUser.name,
          email:updatedUser.email
        }
      }
      const result = await userCollection.updateOne(query, user, options )
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

      const query = { email: email };
      const user = await userCollection.findOne(query);
      
      const admin = user?.role === 'admin';
      
      res.send({ admin });
    })

    // membership 
    app.get('/memberships', verifyToken, verifyAdmin, async (req, res) => {
      let query = {};
      if (req.query?.name) {
        query = { name: req.query?.name }
      }
      const result = await membershipCollection.find(query).toArray()
      res.send(result)
    })

    app.get("/requestedMeals",verifyToken, async (req, res) => {
      let query = {};
      if (req.query?.email) {
        query = { email: req.query.email }
      }
      const cursor = reqMealCollection.find(query)
      const result = await cursor.toArray()
      res.send(result)
    })

    // payment 
    app.post('/create-payment-intent', verifyToken, async (req, res) => {
      const { price } = req.body;
      const amount = parseInt(price * 100)
      // console.log('amout in the intent', amount);
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: 'usd',
        payment_method_types: ['card']
      })

      res.send({
        clientSecret: paymentIntent.client_secret
      })
    })


    app.post('/payments',verifyToken, async (req, res) => {
      const payment = req.body;
      const result = await paymentCollection.insertOne(payment)
      res.send(result)
    })

    app.get('/payments',verifyToken, async (req, res) => {
      let query = {}
      if (req.query?.email) {
        query = { email: req.query.email }
      }

      const result = await paymentCollection.find(query).toArray()
      res.send(result)
    })



    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    // console.log("Pinged your deployment. You successfully connected to MongoDB!");
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