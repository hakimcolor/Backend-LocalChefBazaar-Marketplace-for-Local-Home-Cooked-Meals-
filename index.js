const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion } = require('mongodb');

const port = process.env.PORT || 5000;
const app = express();

app.use(cors());
app.use(express.json());

// MongoDB connection
const uri =
  'mongodb+srv://mishown11:filA50pJCzGmc6w9@cluster0.wcellxl.mongodb.net/?appName=Cluster0';
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
