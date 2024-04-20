const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();
const mongoose = require('mongoose');

app.use(express.urlencoded({ extended: true }));
app.use(cors());

// Serve static files from the 'public' directory
app.use(express.static('public'));

// Route to serve the homepage
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
});

// Connect to MongoDB database
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

// Define exercise schema
let exerciseSchema = new mongoose.Schema({
  username: String,
  description: { type: String, required: true },
  duration: { type: Number, required: true },
  date: String,
  userId: String,
});

// Define user schema
let userSchema = new mongoose.Schema({
  username: { type: String, required: true },
});

// Create Exercise and User models from the schemas
let Exercise = mongoose.model('Exercise', exerciseSchema);
let User = mongoose.model('User', userSchema);

// Route to create new user
app.post("/api/users", async (req, res) => {
  try {
    const username = req.body.username;
    const userValue = await User.findOne({ username });
    if (userValue) {
      res.json(userValue); // Send back userValue if user exists
    } else {
      const user = await User.create({ username });
      res.json(user); // Send back the created user
    }
  } catch (err) {
    res.send(err.message); // Send back error message if any error occurs
  }
});

// Route to get all users
app.get('/api/users', async (req, res) => {
  const users = await User.find();
  if (users) {
    res.json(users);
  } else {
    res.json({ error: "Something is false" });
  }
});

// Route to add new exercise for a user
app.post("/api/users/:_id/exercises", async (req, res) => {
  try {
    let userId = req.params._id;
    let description = req.body.description;
    let duration = parseInt(req.body.duration);
    let date = new Date(req.body.date);

    if (date == "Invalid Date") {
      date = new Date().toDateString();
    } else {
      date = new Date(date).toDateString();
    }

    let user = await User.findById(userId);

    if (!user) {
      return res.json({ error: "Unknown userId" });
    }

    let exercise = await Exercise.create({
      username: user.username,
      description,
      duration,
      date,
      userId,
    });

    return res.json({
      _id: user._id,
      username: user.username,
      date,
      duration,
      description,
    });
  } catch (err) {
    res.send(err.message); // Send back error message if any error occurs
  }
});

// Route to get exercise logs of a user
app.get('/api/users/:_id/logs', async (req, res) => {
  const { from, to, limit } = req.query;
  const _id = req.params._id;
  const userId = req.params._id;
  const user = await User.findById(userId);
  if (!user) {
    res.json({ error: "No user with this ID" });
  }

  let dateObj = {};

  if (from) {
    dateObj['$gte'] = new Date(from)
  }
  if (to) {
    dateObj['$lte'] = new Date(to)
  }
  if (from || to) {
    dateObj['$lte'] = new Date(to)
  }

  let filter = { userId };
  const exercises = await Exercise.find(filter).limit(+limit ?? 100);

  res.json({
    username: user.username,
    count: exercises.length,
    _id: userId,
    log: exercises.map((exercise) => {
      return {
        description: exercise.description,
        duration: exercise.duration,
        date: exercise.date
      }
    })
  })
});

// Set up the server to listen on specified port
const port = process.env.PORT || 3000;
const listener = app.listen(port, () => {
  console.log('Your app is listening on port ' + listener.address().port);
});
