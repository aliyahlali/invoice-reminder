const express = require('express');
const Client = require('../models/Client');
const auth = require('../middleware/Auth');

const router = express.Router();

// Get all clients
router.get('/', auth, async (req, res) => {
  try {
    const clients = await Client.find({ userId: req.user._id });
    res.json(clients);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Create client
router.post('/', auth, async (req, res) => {
  try {
    const { name, email, phone } = req.body;

    const client = new Client({
      userId: req.user._id,
      name,
      email,
      phone
    });

    await client.save();
    res.status(201).json(client);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update client
router.put('/:id', auth, async (req, res) => {
  try {
    const client = await Client.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(client);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete client
router.delete('/:id', auth, async (req, res) => {
  try {
    await Client.findByIdAndDelete(req.params.id);
    res.json({ message: 'Client deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
