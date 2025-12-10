const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion } = require('mongodb');

const port = process.env.PORT || 5000;
const app = express();

app.use(cors());
app.use(express.json());

// MongoDB connection
const uri = process.env.MONGO_URI;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();
    console.log('MongoDB connected successfully!');

    const database = client.db('mishown11DB');
    const userCollection = database.collection('user');
    const mealsCollection = database.collection('meals');

    // GET latest 6 meals
    app.get('/meals/latest', async (req, res) => {
      try {
        const latestMeals = await mealsCollection
          .find()
          .sort({ createdAt: -1 }) // newest first
          .limit(6)
          .toArray();

        res.status(200).json({ success: true, data: latestMeals });
      } catch (err) {
        res.status(500).json({ success: false, error: err.message });
      }
    });

    // GET all meals with optional price sorting
    // Example: /meals?sort=asc or /meals?sort=desc
    app.get('/meals', async (req, res) => {
      try {
        const sortQuery = req.query.sort;
        let sortOption = {};

        if (sortQuery === 'asc') {
          sortOption = { price: 1 }; // ascending
        } else if (sortQuery === 'desc') {
          sortOption = { price: -1 }; // descending
        }

        const meals = await mealsCollection.find().sort(sortOption).toArray();
        res.status(200).json({ success: true, data: meals });
      } catch (err) {
        res.status(500).json({ success: false, error: err.message });
      }
    });

    // POST: Add a meal
    app.post('/meals', async (req, res) => {
      const meal = req.body;
      meal.createdAt = new Date();

      try {
        const result = await mealsCollection.insertOne(meal);
        res.status(201).json({
          success: true,
          message: 'Meal added successfully',
          data: result,
        });
      } catch (err) {
        res.status(500).json({ success: false, error: err.message });
      }
    });

    // GET full user info by email
    app.get('/users/:email', async (req, res) => {
      const email = req.params.email;
      try {
        const user = await userCollection.findOne({ email: email });
        if (user) {
          res.status(200).json({ success: true, data: user });
        } else {
          res.status(404).json({ success: false, message: 'User not found' });
        }
      } catch (err) {
        res.status(500).json({ success: false, error: err.message });
      }
    });

    // GET user role by email
    app.get('/users/role/:email', async (req, res) => {
      const email = req.params.email;
      try {
        const user = await userCollection.findOne({ email: email });
        if (user) {
          res.status(200).json({ success: true, role: user.role });
        } else {
          res.status(404).json({ success: false, message: 'User not found' });
        }
      } catch (err) {
        res.status(500).json({ success: false, error: err.message });
      }
    });

    // POST /users → add new user
    app.post('/users', async (req, res) => {
      const userInfo = req.body;
      userInfo.role = 'buyer'; // default role
      userInfo.createdAt = new Date();

      try {
        const result = await userCollection.insertOne(userInfo);
        res.status(201).json({ success: true, data: result });
      } catch (err) {
        res.status(500).json({ success: false, error: err.message });
      }
    });

    // Test route
    app.get('/', (req, res) => {
      res.send('Hello World from Express + MongoDB!');
    });
  } finally {
    // Do not close client to keep the connection alive
  }
}

run().catch(console.dir);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
