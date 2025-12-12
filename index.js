
// const express = require('express');
// const cors = require('cors');
// require('dotenv').config();
// const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

// const port = process.env.PORT || 5000;
// const app = express();

// app.use(cors());
// app.use(express.json());

// const uri = process.env.MONGO_URI;
// const client = new MongoClient(uri, {
//   serverApi: {
//     version: ServerApiVersion.v1,
//     strict: true,
//     deprecationErrors: true,
//   },
// });

// async function run() {
//   try {
//     await client.connect();
//     console.log('MongoDB connected successfully!');

//     const database = client.db('mishown11DB');
//     const userCollection = database.collection('user');
//     const mealsCollection = database.collection('meals');
//     const reviewsCollection = database.collection('reviews');
//     const favoritesCollection = database.collection('favorites');

//     // Helper: normalize ObjectId fields to strings for front-end consistency
//     const normalizeDoc = (doc) => {
//       if (!doc) return doc;
//       const copy = { ...doc };
//       if (copy._id && copy._id.toString) copy._id = copy._id.toString();
//       if (copy.foodId && copy.foodId.toString)
//         copy.foodId = copy.foodId.toString();
//       return copy;
//     };

//     // ------------------ Meals ------------------

//     // PUT: update meal by id (accepts string id or ObjectId)
//     app.put('/meals/:id', async (req, res) => {
//       const rawId = req.params.id;
//       const id = typeof rawId === 'string' ? rawId.trim() : rawId;
//       const updateData = req.body;

//       try {
//         // prevent updating _id
//         const { _id, ...fieldsToUpdate } = updateData;

//         // coerce numeric fields if present
//         if (fieldsToUpdate.price !== undefined)
//           fieldsToUpdate.price = Number(fieldsToUpdate.price);
//         if (fieldsToUpdate.rating !== undefined)
//           fieldsToUpdate.rating = Number(fieldsToUpdate.rating);
//         if (fieldsToUpdate.estimatedDeliveryTime !== undefined)
//           fieldsToUpdate.estimatedDeliveryTime = Number(
//             fieldsToUpdate.estimatedDeliveryTime
//           );

//         const queries = [];
//         if (typeof id === 'string' && ObjectId.isValid(id)) {
//           queries.push({ _id: new ObjectId(id) });
//         }
//         queries.push({ _id: id });

//         const matchQuery = queries.length > 1 ? { $or: queries } : queries[0];

//         const updatedMeal = await mealsCollection.findOneAndUpdate(
//           matchQuery,
//           { $set: fieldsToUpdate },
//           { returnDocument: 'after' }
//         );

//         if (!updatedMeal.value) {
//           return res
//             .status(404)
//             .json({ success: false, message: 'Meal not found' });
//         }

//         const meal = normalizeDoc(updatedMeal.value);
//         res.status(200).json({ success: true, updatedMeal: meal });
//       } catch (err) {
//         console.error('PUT /meals/:id error:', err);
//         res.status(500).json({ success: false, error: err.message });
//       }
//     });

//     // DELETE a meal by ID
//     app.delete('/meals/:id', async (req, res) => {
//       const rawId = req.params.id;
//       const id = typeof rawId === 'string' ? rawId.trim() : rawId;

//       try {
//         let result;
//         if (typeof id === 'string' && ObjectId.isValid(id)) {
//           result = await mealsCollection.deleteOne({ _id: new ObjectId(id) });
//         } else {
//           result = await mealsCollection.deleteOne({ _id: id });
//         }

//         if (result.deletedCount === 1) {
//           res
//             .status(200)
//             .json({ success: true, message: 'Meal deleted successfully' });
//         } else {
//           res.status(404).json({ success: false, message: 'Meal not found' });
//         }
//       } catch (error) {
//         console.error('DELETE /meals/:id error:', error);
//         res.status(500).json({ success: false, error: error.message });
//       }
//     });

//     // GET: Logged-in user's meals
//     app.get('/user-meals/:email', async (req, res) => {
//       const email = req.params.email;

//       try {
//         const meals = await mealsCollection
//           .find({ userEmail: email })
//           .toArray();
//         const normalized = meals.map((m) => ({
//           ...m,
//           _id: m._id?.toString ? m._id.toString() : m._id,
//         }));
//         res.send({ success: true, data: normalized });
//       } catch (error) {
//         console.error('GET /user-meals error:', error);
//         res
//           .status(500)
//           .send({ success: false, message: 'Failed to fetch meals' });
//       }
//     });

//     // GET latest 6 meals
//     app.get('/meals/latest', async (req, res) => {
//       try {
//         const latestMeals = await mealsCollection
//           .find()
//           .sort({ createdAt: -1 })
//           .limit(6)
//           .toArray();
//         const normalized = latestMeals.map((m) => ({
//           ...m,
//           _id: m._id.toString(),
//         }));
//         res.status(200).json({ success: true, data: normalized });
//       } catch (err) {
//         console.error('GET /meals/latest error:', err);
//         res.status(500).json({ success: false, error: err.message });
//       }
//     });

//     // GET all meals with optional price sorting
//     app.get('/meals', async (req, res) => {
//       try {
//         const sortQuery = req.query.sort;
//         let sortOption = {};

//         if (sortQuery === 'asc') {
//           sortOption = { price: 1 };
//         } else if (sortQuery === 'desc') {
//           sortOption = { price: -1 };
//         }

//         const meals = await mealsCollection.find().sort(sortOption).toArray();
//         const normalized = meals.map((m) => ({ ...m, _id: m._id.toString() }));
//         res.status(200).json({ success: true, data: normalized });
//       } catch (err) {
//         console.error('GET /meals error:', err);
//         res.status(500).json({ success: false, error: err.message });
//       }
//     });

//     // POST: Add a meal
//     app.post('/meals', async (req, res) => {
//       const meal = req.body;
//       meal.createdAt = new Date();

//       try {
//         const result = await mealsCollection.insertOne(meal);
//         res.status(201).json({
//           success: true,
//           message: 'Meal added successfully',
//           data: { ...meal, _id: result.insertedId.toString() },
//         });
//       } catch (err) {
//         console.error('POST /meals error:', err);
//         res.status(500).json({ success: false, error: err.message });
//       }
//     });

//     // GET meal by id (mealsd route)
//     app.get('/mealsd/:id', async (req, res) => {
//       const id = req.params.id;

//       if (!ObjectId.isValid(id)) {
//         return res
//           .status(400)
//           .json({ success: false, message: 'Invalid Meal ID' });
//       }

//       try {
//         const meal = await mealsCollection.findOne({ _id: new ObjectId(id) });

//         if (!meal) {
//           return res
//             .status(404)
//             .json({ success: false, message: 'Meal not found' });
//         }

//         meal._id = meal._id.toString();
//         res.status(200).json(meal);
//       } catch (err) {
//         console.error('GET /mealsd error:', err);
//         res.status(500).json({ success: false, message: 'Server error' });
//       }
//     });

//     // ------------------ Reviews ------------------

//     // GET latest 6 reviews
//     app.get('/reviews/latest', async (req, res) => {
//       try {
//         const latestReviews = await reviewsCollection
//           .find()
//           .sort({ date: -1 })
//           .limit(6)
//           .toArray();
//         const normalized = latestReviews.map((r) => normalizeDoc(r));
//         res.status(200).json({ success: true, data: normalized });
//       } catch (err) {
//         console.error('GET /reviews/latest error:', err);
//         res.status(500).json({ success: false, error: err.message });
//       }
//     });

//     // GET all reviews for a specific meal
//     app.get('/reviews/:mealId', async (req, res) => {
//       const mealId = req.params.mealId;
//       try {
//         const reviews = await reviewsCollection
//           .find({ foodId: mealId })
//           .sort({ date: -1 })
//           .toArray();
//         const normalized = reviews.map((r) => normalizeDoc(r));
//         res.status(200).json({ success: true, data: normalized });
//       } catch (err) {
//         console.error('GET /reviews/:mealId error:', err);
//         res.status(500).json({ success: false, error: err.message });
//       }
//     });

//     // POST a review
//     app.post('/reviews', async (req, res) => {
//       const review = req.body;

//       try {
//         const result = await reviewsCollection.insertOne(review);
//         res.status(201).json({
//           success: true,
//           data: { ...review, _id: result.insertedId.toString() },
//         });
//       } catch (err) {
//         console.error('POST /reviews error:', err);
//         res.status(500).json({ success: false, error: err.message });
//       }
//     });

//     // Update a review by ID (PATCH)
//     // replace your /reviewsup/:id handler with this to get debug logs
//     // replace the /reviewsup/:id handler with this block
//     app.patch('/reviewsup/:id', async (req, res) => {
//       const rawId = req.params.id;
//       const id = typeof rawId === 'string' ? rawId.trim() : rawId;
//       const { rating, comment } = req.body;

//       // small helper to normalize doc for logging/response
//       const normalizeDoc = (doc) => {
//         if (!doc) return doc;
//         const copy = { ...doc };
//         if (copy._id && copy._id.toString) copy._id = copy._id.toString();
//         if (copy.foodId && copy.foodId.toString)
//           copy.foodId = copy.foodId.toString();
//         return copy;
//       };

//       console.log(`PATCH /reviewsup called with id="${id}" body=`, req.body);

//       try {
//         // Build updates safely
//         const updates = {};
//         if (rating !== undefined) {
//           const rn = Number(rating);
//           if (Number.isNaN(rn)) {
//             throw new Error('Invalid rating: not a number');
//           }
//           updates.rating = rn;
//         }
//         if (comment !== undefined) updates.comment = String(comment);

//         // Build a robust match query:
//         // - if id is a valid ObjectId try matching by ObjectId OR string
//         // - otherwise try matching by string id only
//         let matchQuery;
//         if (typeof id === 'string' && ObjectId.isValid(id)) {
//           matchQuery = { $or: [{ _id: new ObjectId(id) }, { _id: id }] };
//         } else {
//           matchQuery = { _id: id };
//         }
//         console.log('PATCH matchQuery:', JSON.stringify(matchQuery));

//         // check existence first (better logs & avoids constructor issues)
//         const found = await reviewsCollection.findOne(matchQuery);
//         console.log('PATCH found:', found ? normalizeDoc(found) : null);

//         if (!found) {
//           return res
//             .status(404)
//             .json({ success: false, message: 'Review not found' });
//         }

//         // Use the actual _id value returned by DB (avoid mismatched types)
//         const dbId = found._id;

//         const updated = await reviewsCollection.findOneAndUpdate(
//           { _id: dbId },
//           { $set: updates },
//           { returnDocument: 'after' }
//         );

//         if (!updated.value) {
//           console.error('PATCH update returned no value for id:', dbId);
//           return res
//             .status(500)
//             .json({ success: false, message: 'Update failed' });
//         }

//         const review = normalizeDoc(updated.value);
//         console.log('PATCH updatedReview:', review);
//         res.status(200).json({ success: true, updatedReview: review });
//       } catch (err) {
//         // full error logged for debugging
//         console.error(
//           'PATCH /reviewsup error:',
//           err && err.stack ? err.stack : err
//         );
//         res
//           .status(500)
//           .json({ success: false, error: err.message || String(err) });
//       }
//     });
//     // Delete a review by ID
//     app.delete('/reviews/:id', async (req, res) => {
//       const rawId = req.params.id;
//       const id = typeof rawId === 'string' ? rawId.trim() : rawId;

//       try {
//         let result;
//         if (typeof id === 'string' && ObjectId.isValid(id)) {
//           result = await reviewsCollection.deleteOne({ _id: new ObjectId(id) });
//         } else {
//           result = await reviewsCollection.deleteOne({ _id: id });
//         }

//         if (result.deletedCount === 1) {
//           res
//             .status(200)
//             .json({ success: true, message: 'Review deleted successfully' });
//         } else {
//           res.status(404).json({ success: false, message: 'Review not found' });
//         }
//       } catch (err) {
//         console.error('DELETE /reviews error:', err);
//         res.status(500).json({ success: false, error: err.message });
//       }
//     });

//     // GET reviews of logged-in user
//     app.get('/user-reviews/:email', async (req, res) => {
//       const email = req.params.email;
//       try {
//         const userReviews = await reviewsCollection
//           .find({ reviewerEmail: email })
//           .sort({ date: -1 })
//           .toArray();
//         const normalized = userReviews.map((r) => normalizeDoc(r));
//         res.status(200).json({ success: true, data: normalized });
//       } catch (err) {
//         console.error('GET /user-reviews error:', err);
//         res.status(500).json({ success: false, error: err.message });
//       }
//     });

//     // ------------------ Favorites ------------------

//     // POST add meal to favorites
//     app.post('/favorites', async (req, res) => {
//       const favoriteMeal = req.body;

//       try {
//         const exists = await favoritesCollection.findOne({
//           userEmail: favoriteMeal.userEmail,
//           mealId: favoriteMeal.mealId,
//         });
//         if (exists) {
//           return res
//             .status(400)
//             .json({ success: false, message: 'Meal already in favorites' });
//         }

//         const result = await favoritesCollection.insertOne(favoriteMeal);
//         res.status(201).json({
//           success: true,
//           data: { ...favoriteMeal, _id: result.insertedId.toString() },
//         });
//       } catch (err) {
//         console.error('POST /favorites error:', err);
//         res.status(500).json({ success: false, error: err.message });
//       }
//     });

//     // GET all favorites of a user
//     app.get('/favorites/:email', async (req, res) => {
//       const email = req.params.email;
//       try {
//         const favorites = await favoritesCollection
//           .find({ userEmail: email })
//           .toArray();
//         const normalized = favorites.map((f) => normalizeDoc(f));
//         res.status(200).json({ success: true, data: normalized });
//       } catch (err) {
//         console.error('GET /favorites error:', err);
//         res.status(500).json({ success: false, error: err.message });
//       }
//     });

//     // delete favorite
//     app.delete('/favorites/:id', async (req, res) => {
//       const rawId = req.params.id;
//       const id = typeof rawId === 'string' ? rawId.trim() : rawId;

//       try {
//         if (!ObjectId.isValid(id)) {
//           // still attempt delete by string id as fallback
//           const result = await favoritesCollection.deleteOne({ _id: id });
//           if (result.deletedCount > 0) {
//             return res
//               .status(200)
//               .json({ success: true, message: 'Favorite removed' });
//           } else {
//             return res
//               .status(404)
//               .json({ success: false, message: 'Favorite not found' });
//           }
//         }

//         const result = await favoritesCollection.deleteOne({
//           _id: new ObjectId(id),
//         });
//         if (result.deletedCount > 0) {
//           res.status(200).json({ success: true, message: 'Favorite removed' });
//         } else {
//           res
//             .status(404)
//             .json({ success: false, message: 'Favorite not found' });
//         }
//       } catch (err) {
//         console.error('DELETE /favorites error:', err);
//         res.status(500).json({ success: false, error: err.message });
//       }
//     });

//     // ------------------ Users ------------------

//     // GET full user info by email
//     app.get('/users/:email', async (req, res) => {
//       const email = req.params.email;
//       try {
//         const user = await userCollection.findOne({ email: email });
//         if (user) {
//           return res.status(200).json({ success: true, data: user });
//         } else {
//           return res
//             .status(404)
//             .json({ success: false, message: 'User not found' });
//         }
//       } catch (err) {
//         console.error('GET /users/:email error:', err);
//         res.status(500).json({ success: false, error: err.message });
//       }
//     });

//     // GET user role by email
//     app.get('/users/role/:email', async (req, res) => {
//       const email = req.params.email;
//       try {
//         const user = await userCollection.findOne({ email: email });
//         if (user) {
//           return res.status(200).json({ success: true, role: user.role });
//         } else {
//           return res
//             .status(404)
//             .json({ success: false, message: 'User not found' });
//         }
//       } catch (err) {
//         console.error('GET /users/role/:email error:', err);
//         res.status(500).json({ success: false, error: err.message });
//       }
//     });

//     // POST /users  add new user
//     app.post('/users', async (req, res) => {
//       const userInfo = req.body;
//       userInfo.role = 'buyer';
//       userInfo.createdAt = new Date();

//       try {
//         const result = await userCollection.insertOne(userInfo);
//         res.status(201).json({
//           success: true,
//           data: {
//             ...userInfo,
//             _id: result.insertedId?.toString?.() || result.insertedId,
//           },
//         });
//       } catch (err) {
//         console.error('POST /users error:', err);
//         res.status(500).json({ success: false, error: err.message });
//       }
//     });

//     // ------------------ Stats ------------------

//     app.get('/api/stats', async (req, res) => {
//       try {
//         const mealsCount = await mealsCollection.countDocuments();
//         const reviewsCount = await reviewsCollection.countDocuments();
//         const favoritesCount = await favoritesCollection.countDocuments();

//         res.json({ success: true, mealsCount, reviewsCount, favoritesCount });
//       } catch (error) {
//         console.error('GET /api/stats error:', error);
//         res.status(500).json({ success: false, message: 'Server Error' });
//       }
//     });

//     // Test route
//     app.get('/', (req, res) => {
//       res.send('Hello World from Express + MongoDB!');
//     });
//   } finally {
//     // keep connection open; do not close client here so server can keep using it
//   }
// }

// run().catch(console.dir);

// app.listen(port, () => {
//   console.log(`Server is running on port ${port}`);
// });

// server.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const port = process.env.PORT || 5000;
const app = express();

app.use(cors());
app.use(express.json());

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
    const reviewsCollection = database.collection('reviews');
    const favoritesCollection = database.collection('favorites');
    const orderCollection = database.collection('order_collection');
    // Helper: normalize ObjectId fields to strings for front-end consistency
    const normalizeDoc = (doc) => {
      if (!doc) return doc;
      const copy = { ...doc };
      if (copy._id && copy._id.toString) copy._id = copy._id.toString();
      if (copy.foodId && copy.foodId.toString)
        copy.foodId = copy.foodId.toString();
      return copy;
    };

    //.....................oreder her..............
    // POST: Create New Order
    app.post('/orders', async (req, res) => {
      try {
        const orderData = req.body;
        const orderCollection = client
          .db('MealDB')
          .collection('order_collection');

        const result = await orderCollection.insertOne(orderData);

        res.send({
          success: true,
          message: 'Order placed successfully!',
          data: result,
        });
      } catch (error) {
        res.status(500).send({
          success: false,
          message: 'Failed to place order',
          error: error.message,
        });
      }
    });

    // ------------------ Meals ------------------

    app.put('/meals/:id', async (req, res) => {
      const rawId = req.params.id;
      const id = typeof rawId === 'string' ? rawId.trim() : rawId;
      const updateData = req.body;

      try {
        const { _id, ...fieldsToUpdate } = updateData;

        if (fieldsToUpdate.price !== undefined)
          fieldsToUpdate.price = Number(fieldsToUpdate.price);
        if (fieldsToUpdate.rating !== undefined)
          fieldsToUpdate.rating = Number(fieldsToUpdate.rating);
        if (fieldsToUpdate.estimatedDeliveryTime !== undefined)
          fieldsToUpdate.estimatedDeliveryTime = Number(
            fieldsToUpdate.estimatedDeliveryTime
          );

        const queries = [];
        if (typeof id === 'string' && ObjectId.isValid(id)) {
          queries.push({ _id: new ObjectId(id) });
        }
        queries.push({ _id: id });

        const matchQuery = queries.length > 1 ? { $or: queries } : queries[0];

        const updatedMeal = await mealsCollection.findOneAndUpdate(
          matchQuery,
          { $set: fieldsToUpdate },
          { returnDocument: 'after' }
        );

        if (!updatedMeal.value) {
          return res
            .status(404)
            .json({ success: false, message: 'Meal not found' });
        }

        const meal = normalizeDoc(updatedMeal.value);
        res.status(200).json({ success: true, updatedMeal: meal });
      } catch (err) {
        console.error('PUT /meals/:id error:', err);
        res.status(500).json({ success: false, error: err.message });
      }
    });

    app.delete('/meals/:id', async (req, res) => {
      const rawId = req.params.id;
      const id = typeof rawId === 'string' ? rawId.trim() : rawId;

      try {
        let result;
        if (typeof id === 'string' && ObjectId.isValid(id)) {
          result = await mealsCollection.deleteOne({ _id: new ObjectId(id) });
        } else {
          result = await mealsCollection.deleteOne({ _id: id });
        }

        if (result.deletedCount === 1) {
          res
            .status(200)
            .json({ success: true, message: 'Meal deleted successfully' });
        } else {
          res.status(404).json({ success: false, message: 'Meal not found' });
        }
      } catch (error) {
        console.error('DELETE /meals/:id error:', error);
        res.status(500).json({ success: false, error: error.message });
      }
    });

    app.get('/user-meals/:email', async (req, res) => {
      const email = req.params.email;

      try {
        const meals = await mealsCollection
          .find({ userEmail: email })
          .toArray();
        const normalized = meals.map((m) => ({
          ...m,
          _id: m._id?.toString ? m._id.toString() : m._id,
        }));
        res.send({ success: true, data: normalized });
      } catch (error) {
        console.error('GET /user-meals error:', error);
        res
          .status(500)
          .send({ success: false, message: 'Failed to fetch meals' });
      }
    });

    app.get('/meals/latest', async (req, res) => {
      try {
        const latestMeals = await mealsCollection
          .find()
          .sort({ createdAt: -1 })
          .limit(6)
          .toArray();
        const normalized = latestMeals.map((m) => ({
          ...m,
          _id: m._id.toString(),
        }));
        res.status(200).json({ success: true, data: normalized });
      } catch (err) {
        console.error('GET /meals/latest error:', err);
        res.status(500).json({ success: false, error: err.message });
      }
    });

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
        const normalized = meals.map((m) => ({ ...m, _id: m._id.toString() }));
        res.status(200).json({ success: true, data: normalized });
      } catch (err) {
        console.error('GET /meals error:', err);
        res.status(500).json({ success: false, error: err.message });
      }
    });

    app.post('/meals', async (req, res) => {
      const meal = req.body;
      meal.createdAt = new Date();

      try {
        const result = await mealsCollection.insertOne(meal);
        res.status(201).json({
          success: true,
          message: 'Meal added successfully',
          data: { ...meal, _id: result.insertedId.toString() },
        });
      } catch (err) {
        console.error('POST /meals error:', err);
        res.status(500).json({ success: false, error: err.message });
      }
    });

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

        meal._id = meal._id.toString();
        res.status(200).json(meal);
      } catch (err) {
        console.error('GET /mealsd error:', err);
        res.status(500).json({ success: false, message: 'Server error' });
      }
    });

    // ------------------ Reviews ------------------

    app.get('/reviews/latest', async (req, res) => {
      try {
        const latestReviews = await reviewsCollection
          .find()
          .sort({ date: -1 })
          .limit(6)
          .toArray();
        const normalized = latestReviews.map((r) => normalizeDoc(r));
        res.status(200).json({ success: true, data: normalized });
      } catch (err) {
        console.error('GET /reviews/latest error:', err);
        res.status(500).json({ success: false, error: err.message });
      }
    });

    app.get('/reviews/:mealId', async (req, res) => {
      const mealId = req.params.mealId;
      try {
        const reviews = await reviewsCollection
          .find({ foodId: mealId })
          .sort({ date: -1 })
          .toArray();
        const normalized = reviews.map((r) => normalizeDoc(r));
        res.status(200).json({ success: true, data: normalized });
      } catch (err) {
        console.error('GET /reviews/:mealId error:', err);
        res.status(500).json({ success: false, error: err.message });
      }
    });

    app.post('/reviews', async (req, res) => {
      const review = req.body;

      try {
        const result = await reviewsCollection.insertOne(review);
        res.status(201).json({
          success: true,
          data: { ...review, _id: result.insertedId.toString() },
        });
      } catch (err) {
        console.error('POST /reviews error:', err);
        res.status(500).json({ success: false, error: err.message });
      }
    });

    // PATCH /reviewsup/:id — robust: match by ObjectId or string, then update using actual DB _id
    app.patch('/reviewsup/:id', async (req, res) => {
      const rawId = req.params.id;
      const id = typeof rawId === 'string' ? rawId.trim() : rawId;
      const { rating, comment } = req.body;

      try {
        const updates = {};
        if (rating !== undefined) updates.rating = Number(rating);
        if (comment !== undefined) updates.comment = comment;

        // try to find the document by either ObjectId or string id
        const queries = [];
        if (typeof id === 'string' && ObjectId.isValid(id)) {
          queries.push({ _id: new ObjectId(id) });
        }
        queries.push({ _id: id });
        const matchQuery = queries.length > 1 ? { $or: queries } : queries[0];

        const found = await reviewsCollection.findOne(matchQuery);
        if (!found) {
          return res
            .status(404)
            .json({ success: false, message: 'Review not found' });
        }

        // update using the DB's actual _id (avoids type mismatch)
        const dbId = found._id;
        const updated = await reviewsCollection.findOneAndUpdate(
          { _id: dbId },
          { $set: updates },
          { returnDocument: 'after' }
        );

        if (!updated.value) {
          return res
            .status(500)
            .json({ success: false, message: 'Update failed' });
        }

        const review = normalizeDoc(updated.value);
        res.status(200).json({ success: true, updatedReview: review });
      } catch (err) {
        console.error('PATCH /reviewsup error:', err);
        res.status(500).json({ success: false, error: err.message });
      }
    });

    app.delete('/reviews/:id', async (req, res) => {
      const rawId = req.params.id;
      const id = typeof rawId === 'string' ? rawId.trim() : rawId;

      try {
        let result;
        if (typeof id === 'string' && ObjectId.isValid(id)) {
          result = await reviewsCollection.deleteOne({ _id: new ObjectId(id) });
        } else {
          result = await reviewsCollection.deleteOne({ _id: id });
        }

        if (result.deletedCount === 1) {
          res
            .status(200)
            .json({ success: true, message: 'Review deleted successfully' });
        } else {
          res.status(404).json({ success: false, message: 'Review not found' });
        }
      } catch (err) {
        console.error('DELETE /reviews error:', err);
        res.status(500).json({ success: false, error: err.message });
      }
    });

    app.get('/user-reviews/:email', async (req, res) => {
      const email = req.params.email;
      try {
        const userReviews = await reviewsCollection
          .find({ reviewerEmail: email })
          .sort({ date: -1 })
          .toArray();
        const normalized = userReviews.map((r) => normalizeDoc(r));
        res.status(200).json({ success: true, data: normalized });
      } catch (err) {
        console.error('GET /user-reviews error:', err);
        res.status(500).json({ success: false, error: err.message });
      }
    });

    // ------------------ Favorites ------------------

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
        res
          .status(201)
          .json({
            success: true,
            data: { ...favoriteMeal, _id: result.insertedId.toString() },
          });
      } catch (err) {
        console.error('POST /favorites error:', err);
        res.status(500).json({ success: false, error: err.message });
      }
    });

    app.get('/favorites/:email', async (req, res) => {
      const email = req.params.email;
      try {
        const favorites = await favoritesCollection
          .find({ userEmail: email })
          .toArray();
        const normalized = favorites.map((f) => normalizeDoc(f));
        res.status(200).json({ success: true, data: normalized });
      } catch (err) {
        console.error('GET /favorites error:', err);
        res.status(500).json({ success: false, error: err.message });
      }
    });

    app.delete('/favorites/:id', async (req, res) => {
      const rawId = req.params.id;
      const id = typeof rawId === 'string' ? rawId.trim() : rawId;

      try {
        let result;
        if (typeof id === 'string' && ObjectId.isValid(id)) {
          result = await favoritesCollection.deleteOne({
            _id: new ObjectId(id),
          });
        } else {
          result = await favoritesCollection.deleteOne({ _id: id });
        }

        if (result.deletedCount > 0) {
          res.status(200).json({ success: true, message: 'Favorite removed' });
        } else {
          res
            .status(404)
            .json({ success: false, message: 'Favorite not found' });
        }
      } catch (err) {
        console.error('DELETE /favorites error:', err);
        res.status(500).json({ success: false, error: err.message });
      }
    });

    // ------------------ Users ------------------

    app.get('/users/:email', async (req, res) => {
      const email = req.params.email;
      try {
        const user = await userCollection.findOne({ email: email });
        if (user) {
          return res.status(200).json({ success: true, data: user });
        } else {
          return res
            .status(404)
            .json({ success: false, message: 'User not found' });
        }
      } catch (err) {
        console.error('GET /users/:email error:', err);
        res.status(500).json({ success: false, error: err.message });
      }
    });

    app.get('/users/role/:email', async (req, res) => {
      const email = req.params.email;
      try {
        const user = await userCollection.findOne({ email: email });
        if (user) {
          return res.status(200).json({ success: true, role: user.role });
        } else {
          return res
            .status(404)
            .json({ success: false, message: 'User not found' });
        }
      } catch (err) {
        console.error('GET /users/role/:email error:', err);
        res.status(500).json({ success: false, error: err.message });
      }
    });

    app.post('/users', async (req, res) => {
      const userInfo = req.body;
      userInfo.role = 'buyer';
      userInfo.createdAt = new Date();

      try {
        const result = await userCollection.insertOne(userInfo);
        res
          .status(201)
          .json({
            success: true,
            data: {
              ...userInfo,
              _id: result.insertedId?.toString?.() || result.insertedId,
            },
          });
      } catch (err) {
        console.error('POST /users error:', err);
        res.status(500).json({ success: false, error: err.message });
      }
    });

    // ------------------ Stats ------------------

    app.get('/api/stats', async (req, res) => {
      try {
        const mealsCount = await mealsCollection.countDocuments();
        const reviewsCount = await reviewsCollection.countDocuments();
        const favoritesCount = await favoritesCollection.countDocuments();

        res.json({ success: true, mealsCount, reviewsCount, favoritesCount });
      } catch (error) {
        console.error('GET /api/stats error:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
      }
    });

    // Test route
    app.get('/', (req, res) => {
      res.send('Hello World from Express + MongoDB!');
    });
  } finally {
    // keep connection open; do not close client here so server can keep using it
  }
}

run().catch(console.dir);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});