require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB Atlas'))
  .catch((error) => console.error('Error connecting to MongoDB:', error));

// --- Mongoose Models ---
const categorySchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  color: { type: String, required: true }
});
const Category = mongoose.model('Category', categorySchema);

const clipSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  content: { type: String, required: true },
  type: { type: String, required: true },
  categoryId: { type: String, default: null },
  createdAt: { type: Date, default: Date.now }
});
const Clip = mongoose.model('Clip', clipSchema);

// --- API Endpoints ---

// Categories API
app.get('/api/categories', async (req, res) => {
  try {
    const categories = await Category.find();
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/categories', async (req, res) => {
  try {
    const newCategory = new Category(req.body);
    await newCategory.save();
    res.status(201).json(newCategory);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Clips API
app.get('/api/clips', async (req, res) => {
  try {
    const clips = await Clip.find().sort({ createdAt: 1 }); // Oldest to newest
    res.json(clips);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/clips', async (req, res) => {
  try {
    const newClip = new Clip(req.body);
    await newClip.save();
    res.status(201).json(newClip);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.delete('/api/clips/:id', async (req, res) => {
  try {
    const deletedClip = await Clip.findOneAndDelete({ id: req.params.id });
    if (!deletedClip) return res.status(404).json({ error: 'Clip not found' });
    res.json(deletedClip);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start Server
// app.listen(PORT, () => {
//   console.log(`Server is running on http://localhost:${PORT}`);
// });
module.exports = app;