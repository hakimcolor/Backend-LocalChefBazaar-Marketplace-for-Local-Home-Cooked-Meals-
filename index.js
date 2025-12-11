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
    // await client.connect();
    console.log('MongoDB connected successfully!');

    const database = client.db('mishown11DB');
    const userCollection = database.collection('user');
    const mealsCollection = database.collection('meals');
    // Inside your run() function, after your existing collections
    const reviewsCollection = database.collection('reviews');
    const favoritesCollection = database.collection('favorites');

    // GET: Logged-in user's meals
    app.get('/user-meals/:email', async (req, res) => {
      const email = req.params.email;

      try {
        const meals = await mealsCollection
          .find({ userEmail: email }) 
          .toArray();

        res.send({
          success: true,
          data: meals,
        });
      } catch (error) {
        console.error(error);
        res.status(500).send({
          success: false,
          message: 'Failed to fetch meals',
        });
      }
    });

    //length for three one

    app.get('/api/stats', async (req, res) => {
      try {
        const mealsCount = await mealsCollection.countDocuments();
        const reviewsCount = await reviewsCollection.countDocuments();
        const favoritesCount = await favoritesCollection.countDocuments();

        res.json({
          success: true,
          mealsCount,
          reviewsCount,
          favoritesCount,
        });
      } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
      }
    });

    // GET latest 6 reviews for home page ok ......
    app.get('/reviews/latest', async (req, res) => {
      try {
        const latestReviews = await reviewsCollection
          .find()
          .sort({ date: -1 })
          .limit(6)
          .toArray();

        res.status(200).json({ success: true, data: latestReviews });
      } catch (err) {
        res.status(500).json({ success: false, error: err.message });
      }
    });

    // Update a review by ID (PATCH)
    app.patch('/reviewsup/:id', async (req, res) => {
      const id = req.params.id;
      const { rating, comment } = req.body;

      try {
        const updatedReview = await reviewsCollection.findOneAndUpdate(
          { _id: new ObjectId(id) },
          { $set: { rating, comment } },
          { returnDocument: 'after' }
        );

        if (!updatedReview.value) {
          return res.status(404).json({
            success: false,
            message: 'Review not found',
          });
        }

        const review = updatedReview.value;
        review._id = review._id.toString();

        res.status(200).json({
          success: true,
          updatedReview: review,
        });
      } catch (err) {
        res.status(500).json({
          success: false,
          error: err.message,
        });
      }
    });

    // Delete a review by ID
    app.delete('/reviews/:id', async (req, res) => {
      const id = req.params.id;

      try {
        const result = await reviewsCollection.deleteOne({
          _id: new ObjectId(id),
        });
        if (result.deletedCount === 1) {
          res
            .status(200)
            .json({ success: true, message: 'Review deleted successfully' });
        } else {
          res.status(404).json({ success: false, message: 'Review not found' });
        }
      } catch (err) {
        res.status(500).json({ success: false, error: err.message });
      }
    });

    //show all login user reviews
    app.get('/user-reviews/:email', async (req, res) => {
      const email = req.params.email;
      try {
        const userReviews = await reviewsCollection
          .find({ reviewerEmail: email })
          .sort({ date: -1 })
          .toArray();
        res.status(200).json({ success: true, data: userReviews });
      } catch (err) {
        res.status(500).json({ success: false, error: err.message });
      }
    });

    // Reviews Routes

    const { ObjectId } = require('mongodb');

    app.get('/mealsd/:id', async (req, res) => {
      const id = req.params.id;

      if (!ObjectId.isValid(id)) {
        return res
          .status(400)
          .json({ success: false, message: 'Invalid Meal ID' });
      }

      try {
        const meal = await mealsCollection.findOne({ _id: new ObjectId(id) });

        if (!meal) {
          return res
            .status(404)
            .json({ success: false, message: 'Meal not found' });
        }

        res.status(200).json(meal);
      } catch (err) {
        console.log('MEAL DETAILS ERROR:', err);
        res.status(500).json({ success: false, message: 'Server error' });
      }
    });

    // GET all reviews for a specific meal
    app.get('/reviews/:mealId', async (req, res) => {
      const mealId = req.params.mealId;
      try {
        const reviews = await reviewsCollection
          .find({ foodId: mealId })
          .sort({ date: -1 })
          .toArray();
        res.status(200).json({ success: true, data: reviews });
      } catch (err) {
        res.status(500).json({ success: false, error: err.message });
      }
    });

    // POST a review
    app.post('/reviews', async (req, res) => {
      const review = req.body;

      try {
        const result = await reviewsCollection.insertOne(review);

        res.status(201).json({
          success: true,
          data: { ...review, _id: result.insertedId }, // fixed
        });
      } catch (err) {
        res.status(500).json({ success: false, error: err.message });
      }
    });

    // Favorites Routes

    // POST add meal to favorites
    app.post('/favorites', async (req, res) => {
      const favoriteMeal = req.body;

      try {
        const exists = await favoritesCollection.findOne({
          userEmail: favoriteMeal.userEmail,
          mealId: favoriteMeal.mealId,
        });
        if (exists) {
          return res
            .status(400)
            .json({ success: false, message: 'Meal already in favorites' });
        }

        const result = await favoritesCollection.insertOne(favoriteMeal);
        res.status(201).json({ success: true, data: result.ops[0] });
      } catch (err) {
        res.status(500).json({ success: false, error: err.message });
      }
    });

    // Optional: GET all favorites of a user
    app.get('/favorites/:email', async (req, res) => {
      const email = req.params.email;
      try {
        const favorites = await favoritesCollection
          .find({ userEmail: email })
          .toArray();
        res.status(200).json({ success: true, data: favorites });
      } catch (err) {
        res.status(500).json({ success: false, error: err.message });
      }
    });

    //for deleate my favorites mel from my favoriteMeals list
    app.delete('/favorites/:id', async (req, res) => {
      const id = req.params.id;
      try {
        const result = await favoritesCollection.deleteOne({
          _id: new ObjectId(id),
        });
        if (result.deletedCount > 0) {
          res.status(200).json({ success: true, message: 'Favorite removed' });
        } else {
          res
            .status(404)
            .json({ success: false, message: 'Favorite not found' });
        }
      } catch (err) {
        res.status(500).json({ success: false, error: err.message });
      }
    });

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

    app.get('/meals', async (req, res) => {
      try {
        const sortQuery = req.query.sort;
        let sortOption = {};

        if (sortQuery === 'asc') {
          sortOption = { price: 1 };
        } else if (sortQuery === 'desc') {
          sortOption = { price: -1 };
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

    // POST /users  add new user
    app.post('/users', async (req, res) => {
      const userInfo = req.body;
      userInfo.role = 'buyer';
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
    
  }
}

run().catch(console.dir);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
